"use server"

import { prisma } from "../_libs/prisma"
import { Prisma } from "../generated/prisma"
import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { after } from "next/server"
import { generateScoreCover } from "../_libs/coverImage/generateAndStore"
import { createServerSupabaseClient } from "../_libs/supabaseServer"
import { invokeAnalysis } from "../_libs/pythonRunner"
import { SUB_TASK_IDS } from "../_libs/skillMaster"
import { autoLinkOnboardingSongs } from "../_libs/onboardingSongLink"
import { isSongGenre } from "../_libs/songGenre"
import { ensureScoreGroup } from "../_libs/materialGroup"
import { isDifficulty } from "../_libs/materialVariant"
import { parseParts, validateParts, type Part } from "../_libs/materialParts"

const VALID_SUB_TASK_IDS = new Set<string>(SUB_TASK_IDS as readonly string[])

export async function uploadScore(formData: FormData) {
  const title = (formData.get("title") as string | null)?.trim() ?? ""
  const composer = (formData.get("composer") as string | null)?.trim() ?? null
  const file = formData.get("file") as File | null

  // ループエンジン用フィールド (2026-05-10 追加、admin upload で利用、user upload では空のまま)
  // v1.3 B-3: DB カラム & formData key 双方 star に統一
  const starRaw = (formData.get("star") as string | null)?.trim() ?? ""
  let star: number | null = null
  if (starRaw !== "") {
    const n = Number.parseInt(starRaw, 10)
    if (!Number.isFinite(n) || n < 1 || n > 10) {
      return { error: "難易度は 1 〜 10 で指定してください" }
    }
    star = n
  }
  const skillSubTaskTagsRaw = JSON.parse(
    (formData.get("skillSubTaskTags") as string | null) || "[]",
  )
  const skillSubTaskTags = Array.isArray(skillSubTaskTagsRaw)
    ? Array.from(
        new Set(
          (skillSubTaskTagsRaw as unknown[]).filter(
            (v): v is string => typeof v === "string" && VALID_SUB_TASK_IDS.has(v),
          ),
        ),
      )
    : []
  // admin が共有サンプルとしてアップロードする時に true、user upload は false (formData 未設定でデフォルト false)
  const isShared = formData.get("isShared") === "true"

  // 曲ジャンル (songGenre.ts の id)。admin 登録UIで手動指定。未選択/不正は null。
  const genreRaw = (formData.get("genre") as string | null)?.trim() || ""
  const genre = isSongGenre(genreRaw) ? genreRaw : null

  // 教材グループ・変種 (Phase B): 既存グループに変種として追加する場合 groupId、難易度は difficulty。
  const joinGroupId = (formData.get("groupId") as string | null)?.trim() || ""
  const difficultyRaw = (formData.get("difficulty") as string | null)?.trim() || ""
  const difficulty = isDifficulty(difficultyRaw) ? difficultyRaw : null

  // パート分け (2026-07-26): アップロード時に parts を任意個入力 (案b)。パートは曲(グループ)単位。
  const partsRaw = (formData.get("parts") as string | null)?.trim() || ""
  let partsInput: Part[] = []
  if (partsRaw) {
    try { partsInput = parseParts(JSON.parse(partsRaw)) } catch { partsInput = [] }
  }

  // 2026-08-28 Tetsuo確定: 技法タグは全自動 (解析が譜面から判定)。手動指定の受け口は廃止。

  if (!title) return { error: "曲名が必要です" }
  if (!file) return { error: "ファイルがありません" }
  if (file.size > 5 * 1024 * 1024) {
    return { error: "5MB以下のみ対応" }
  }

  const allowedExtensions = ["xml", "musicxml", "mxl"]
  const extension = file.name.split(".").pop()?.toLowerCase()
  if (!extension || !allowedExtensions.includes(extension)) {
    return { error: "対応形式は .xml / .musicxml / .mxl のみです" }
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "ログインが必要です" }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: user.id },
  })
  if (!dbUser) return { error: "UserがDBに存在しません" }

  const score = await prisma.score.create({
    data: {
      createdById: dbUser.id,
      title,
      composer: composer || "",
      originalXmlPath: "",
      analysisStatus: "queued",
      buildStatus: "queued",
      star,
      skillSubTaskTags: skillSubTaskTags as Prisma.InputJsonValue,
      isShared,
      genre,
      difficulty,
    },
  })

  // オンボーディング目標曲カタログとの自動結線 (共有曲のみ・正規化名の一意一致時)
  if (isShared) {
    try {
      const linked = await autoLinkOnboardingSongs(score.id, title)
      if (linked.length > 0) {
        console.log(`[uploadScore] onboarding song linked: ${linked.join(", ")} -> ${score.id}`)
      }
    } catch (e) {
      // 結線失敗はアップロード自体を止めない(後から scripts/link-onboarding-songs.ts で再結線可)
      console.error("[uploadScore] onboarding song link failed:", e)
    }
  }

  // Path B 統一 (v3.3 spec): auth.uid() ベースで組み立てる
  const filePath = `${user.id}/${score.id}.${extension}`

  const storageClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error: uploadError } = await storageClient.storage
    .from("musicxml")
    .upload(filePath, file, { upsert: false })

  if (uploadError) {
    await prisma.score.delete({ where: { id: score.id } })
    return { error: "Storage保存失敗" }
  }

  await prisma.score.update({
    where: { id: score.id },
    data: { originalXmlPath: filePath },
  })

  // 教材グループ紐付け (Phase B): 既存グループ指定があれば変種として追加、無ければ新規1:1作成。
  // 失敗しても致命的でない。
  let joinedExistingGroup = false
  try {
    if (joinGroupId) {
      const g = await prisma.materialGroup.findUnique({
        where: { id: joinGroupId },
        select: { id: true, kind: true },
      })
      if (g && g.kind === "SONG") {
        await prisma.score.update({ where: { id: score.id }, data: { groupId: g.id } })
        joinedExistingGroup = true
      }
    }
    if (!joinedExistingGroup) await ensureScoreGroup(score.id)
  } catch (e) {
    console.error(`[group] score ${score.id} グループ紐付け失敗:`, e instanceof Error ? e.message : e)
  }

  // パートは曲(グループ)単位に保存 (難易度共通)。入力があるときだけ更新 (変種追加時に既存partsを消さない)。
  if (partsInput.length > 0 && validateParts(partsInput) == null) {
    try {
      const withGroup = await prisma.score.findUnique({
        where: { id: score.id },
        select: { groupId: true },
      })
      if (withGroup?.groupId) {
        await prisma.materialGroup.update({
          where: { id: withGroup.groupId },
          data: { parts: partsInput as unknown as Prisma.InputJsonValue },
        })
      }
    } catch (e) {
      console.error(`[parts] score ${score.id} parts保存失敗:`, e instanceof Error ? e.message : e)
    }
  }

  // AIカバーを応答後に非同期生成 (アップロードを遅らせない)。失敗しても致命的でない。
  // 既存グループへの変種追加時はグループのカバーを継承するため生成しない。
  // ⚠️ REPLICATE_API_TOKEN 未設定/課金未登録の環境ではスキップされるだけ (batchで後追い可)。
  if (!joinedExistingGroup) {
    after(async () => {
      try {
        await generateScoreCover(score.id)
      } catch (e) {
        console.error(`[cover] score ${score.id} 生成失敗:`, e instanceof Error ? e.message : e)
      }
    })
  }

  // 解析ジョブ起動 (Cloud Run Jobs 経由・非同期)
  try {
    const r = await invokeAnalysis({
      mode: "score_full",
      idempotencyKey: `score_full:${score.id}`,
      userId: dbUser.id,
      storageUserId: user.id,    // ★ Path B 統一: auth.uid() を Python に渡す
      scoreId: score.id,
    })
    if (r.status === "skipped") {
      console.warn(
        `[uploadScore] Analysis skipped, score ${score.id} remains in "queued" state`
      )
      revalidatePath(`/${user.id}/scores`)
      return { success: true }
    }
  } catch (e) {
    await prisma.score.update({
      where: { id: score.id },
      data: {
        analysisStatus: "error",
        buildStatus: "error",
        errorMessage:
          e instanceof Error ? e.message.slice(0, 300) : String(e).slice(0, 300),
      },
    })
    throw e
  }

  revalidatePath(`/${user.id}/scores`)
  return { success: true }
}
