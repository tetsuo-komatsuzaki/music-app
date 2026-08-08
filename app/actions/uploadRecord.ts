"use server"

import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { revalidatePath } from "next/cache"
import { isValidCuid } from "@/app/_libs/validators"
import { invokeAnalysis } from "@/app/_libs/pythonRunner"
import { logError } from "@/app/_libs/logError"
import { storageAdmin } from "@/app/_libs/storageAdmin"
import { checkAudioFile } from "@/app/_libs/audioValidation"

/**
 * 録音アップロード完了通知 + 解析起動 (G-1 + Path B、v3.3 spec Commit 3+4)
 *
 * 旧: ファイル本体を FormData で受信 → Storage upload → Performance.create → invokeAnalysis
 * 新: メタデータ (performanceId, recordingBpm) のみ受信
 *     - Performance は getSignedUploadUrl で先行作成 + audioPath 確定済み
 *     - ここでは所有者検証 + invokeAnalysis のみ
 *     - storageUserId (auth.uid()) を Python に伝達
 */
export async function uploadRecord(params: {
  performanceId: string
  recordingBpm?: number
  // 区間録音 (部分練習 Phase 2): 選択区間だけを録音した場合の note_index 範囲。
  // 未指定 = 通常の全体演奏。指定時は Python が区間だけを部分採点し、曲の公式スコア/マスターには非算入。
  rangeFromNote?: number
  rangeToNote?: number
  // パート分け (2026-07-26): この区間録音が名前付きパート(MaterialGroup.parts[].id)なら partId。
  // 区間(rangeFromNote/To)と一緒に保存し、パート別の自己ベスト/推移の集計キーにする。
  partId?: string
}) {
  // 1. 認証
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "ログインが必要です" }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: user.id },
  })
  if (!dbUser) return { error: "User未登録" }

  // 2. cuid 検証
  if (!isValidCuid(params.performanceId)) {
    return { error: "performanceId が不正です" }
  }

  // 3. 所有者検証 + audioPath 確定済みチェック
  const performance = await prisma.performance.findFirst({
    where: { id: params.performanceId, userId: dbUser.id },
    select: { id: true, scoreId: true, audioPath: true },
  })
  if (!performance) {
    return { error: "Performance が見つかりません" }
  }
  if (!performance.audioPath || performance.audioPath === "") {
    return { error: "audioPath が確定していません" }
  }

  // 3.5 区間録音 (部分練習 Phase 2): 有効な区間 (3音以上) なら Performance 行に保存。
  // Python (analyze_performance.py) がこの行を読み、区間だけをスライスして部分採点する。
  const rf = params.rangeFromNote
  const rt = params.rangeToNote
  const validRange =
    Number.isInteger(rf) && Number.isInteger(rt) &&
    (rf as number) >= 0 && (rt as number) >= (rf as number) + 2
  if (validRange) {
    const partId = typeof params.partId === "string" && params.partId ? params.partId : null
    await prisma.performance.update({
      where: { id: performance.id },
      data: { rangeFromNote: rf, rangeToNote: rt, partId },
    })
  }

  // 3.7 アップロード実体の検証 (2026-08-08 P1): 解析(Cloud Run)を起動する前に、
  // Storage の実ファイルの magic-byte とサイズを確認。音声でない/巨大なファイルは
  // 解析コストの前に弾く (署名URL直PUTはブラウザ自己申告MIMEしか通っていないため)。
  try {
    const dl = await storageAdmin.storage.from("performances").download(performance.audioPath)
    if (dl.error || !dl.data) {
      return { error: "アップロードされた録音が確認できませんでした。もう一度お試しください" }
    }
    const bytes = new Uint8Array(await dl.data.arrayBuffer())
    const check = checkAudioFile(bytes)
    if (!check.ok) {
      // 不正ファイルは解析せず error 化 (Cloud Run を回さない)
      await prisma.performance.update({
        where: { id: performance.id },
        data: { analysisStatus: "error", errorMessage: `invalid audio: ${check.reason}` },
      })
      logError("upload.invalidAudio", new Error(check.reason), { performanceId: performance.id, detail: check.detail })
      return { error: check.reason === "too_large"
        ? "録音ファイルが大きすぎます。もう一度短く録音してください"
        : "音声ファイルとして認識できませんでした。もう一度録音してください" }
    }
  } catch (e) {
    logError("upload.validateFailed", e, { performanceId: performance.id })
    // 検証自体の失敗(一時的なStorage障害等)では解析を止めない(従来動作を維持)
  }

  // 4. invokeAnalysis 起動 (storageUserId = auth.uid() を Python に渡す)
  const bpm = params.recordingBpm
  const validBpm = bpm && bpm > 0 && bpm < 1000 ? bpm : undefined
  // 録音時bpmをDBにも保存 (カルテv2 Phase0-1: テンポ帯分析用。従来は解析に渡すのみだった)
  if (validBpm) {
    try {
      await prisma.performance.update({ where: { id: performance.id }, data: { recordingBpm: validBpm } })
    } catch (e) {
      console.error("[uploadRecord] recordingBpm save failed:", e) // 保存失敗でも解析は続行
    }
  }
  try {
    await invokeAnalysis({
      mode: "analyze_performance",
      idempotencyKey: `perf:${performance.id}`,
      userId: dbUser.id,
      storageUserId: user.id,
      scoreId: performance.scoreId,
      performanceId: performance.id,
      recordingBpm: validBpm,
    })
  } catch (e) {
    logError("analysis.invoke", e, { performanceId: performance.id, scoreId: performance.scoreId })
    await prisma.performance.update({
      where: { id: performance.id },
      data: {
        analysisStatus: "error",
        errorMessage:
          e instanceof Error ? e.message.slice(0, 300) : String(e).slice(0, 300),
      },
    })
  }

  revalidatePath(`/${user.id}/scores/${performance.scoreId}`)
  return { success: true, performanceId: performance.id }
}
