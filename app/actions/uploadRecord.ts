"use server"

import { prisma } from "@/app/_libs/prisma"
import { createClient } from "@supabase/supabase-js"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { revalidatePath } from "next/cache"
import { isValidCuid } from "@/app/_libs/validators"
import { invokeAnalysis } from "@/app/_libs/pythonRunner"

export async function uploadRecord(formData: FormData) {
  console.log("① uploadRecord START")

  const scoreId = (formData.get("scoreId") as string | null)?.trim() ?? ""
  const file = formData.get("file") as File | null
  const recordingBpm = formData.get("recordingBpm") as string | null

  // cuid 形式検証（早期リターン）
  if (!isValidCuid(scoreId)) return { error: "scoreId が不正です" }
  if (!file) return { error: "ファイルがありません" }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "ログインが必要です" }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: user.id },
  })
  if (!dbUser) return { error: "User未登録" }

  // Score の所有者検証（他者Scoreへの紐付け防止）
  // 存在しない or 他者所有 → エンティティ列挙防止で同一エラー文言
  const score = await prisma.score.findUnique({
    where: { id: scoreId },
    select: { id: true, createdById: true },
  })
  if (!score || score.createdById !== dbUser.id) {
    return { error: "Score が見つかりません" }
  }

  const performance = await prisma.performance.create({
    data: {
      userId: dbUser.id,
      scoreId,
      performanceType: "user",
      performanceStatus: "uploaded",
      audioPath: "",
      analysisStatus: "queued",
    },
  })

  // scoreId は所有者確認済み・cuid形式なので path 組み立てに使っても安全
  const filePath = `${dbUser.id}/${scoreId}/${performance.id}.wav`

  const storage = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await storage.storage
    .from("performances")
    .upload(filePath, file, { upsert: false })

  console.log("STORAGE ERROR:", error)

  if (error) {
    await prisma.performance.delete({ where: { id: performance.id } })
    return { error: "アップロード失敗" }
  }

  await prisma.performance.update({
    where: { id: performance.id },
    data: { audioPath: filePath },
  })

  // 解析ジョブ起動 (Cloud Run Jobs 経由・非同期)
  // Relay が Cloud Run Jobs execution を create して即 return する。
  // Python の結果は Performance の analysisStatus/comparisonResultPath を UPDATE。
  const bpmNum = recordingBpm ? parseFloat(recordingBpm) : NaN
  const validBpm = !isNaN(bpmNum) && bpmNum > 0 && bpmNum < 1000 ? bpmNum : undefined
  try {
    await invokeAnalysis({
      mode: "analyze_performance",
      idempotencyKey: `perf:${performance.id}`,
      userId: dbUser.id,
      scoreId,
      performanceId: performance.id,
      recordingBpm: validBpm,
    })
  } catch (e) {
    console.error("[uploadRecord] invokeAnalysis failed:", e)
    await prisma.performance.update({
      where: { id: performance.id },
      data: {
        analysisStatus: "error",
        errorMessage:
          e instanceof Error ? e.message.slice(0, 300) : String(e).slice(0, 300),
      },
    })
  }

  revalidatePath(`/${user.id}/scores/${scoreId}`)

  return { success: true, performanceId: performance.id }
}
