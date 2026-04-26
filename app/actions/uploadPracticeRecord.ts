"use server"

import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { revalidatePath } from "next/cache"
import { isValidCuid } from "@/app/_libs/validators"
import { invokeAnalysis } from "@/app/_libs/pythonRunner"

/**
 * 練習録音アップロード完了通知 + 解析起動 (G-1 + Path B、v3.3 spec Commit 3+4)
 *
 * 旧: ファイル本体を FormData で受信 → Storage upload → PracticePerformance.create → invokeAnalysis
 * 新: メタデータ (performanceId, recordingBpm) のみ受信
 *     - PracticePerformance は getSignedUploadUrl で先行作成 + audioPath 確定済み
 *     - ここでは所有者検証 + invokeAnalysis のみ
 *     - storageUserId (auth.uid()) を Python に伝達 (isPractice: true)
 */
export async function uploadPracticeRecord(params: {
  performanceId: string
  recordingBpm?: number
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
  const performance = await prisma.practicePerformance.findFirst({
    where: { id: params.performanceId, userId: dbUser.id },
    select: { id: true, practiceItemId: true, audioPath: true },
  })
  if (!performance) {
    return { error: "PracticePerformance が見つかりません" }
  }
  if (!performance.audioPath || performance.audioPath === "") {
    return { error: "audioPath が確定していません" }
  }

  // 4. invokeAnalysis 起動 (isPractice: true、storageUserId = auth.uid())
  const bpm = params.recordingBpm
  const validBpm = bpm && bpm > 0 && bpm < 1000 ? bpm : undefined
  try {
    await invokeAnalysis({
      mode: "analyze_performance",
      idempotencyKey: `pperf:${performance.id}`,
      userId: dbUser.id,
      storageUserId: user.id,
      scoreId: performance.practiceItemId,
      performanceId: performance.id,
      isPractice: true,
      recordingBpm: validBpm,
    })
  } catch (e) {
    console.error("[uploadPracticeRecord] invokeAnalysis failed:", e)
    await prisma.practicePerformance.update({
      where: { id: performance.id },
      data: {
        analysisStatus: "error",
        errorMessage:
          e instanceof Error ? e.message.slice(0, 300) : String(e).slice(0, 300),
      },
    })
  }

  revalidatePath(`/${user.id}/practice`)
  return { success: true, performanceId: performance.id }
}
