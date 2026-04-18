"use server"

import { prisma } from "@/app/_libs/prisma"
import { createClient } from "@supabase/supabase-js"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { revalidatePath } from "next/cache"

export async function uploadRecord(formData: FormData) {

  console.log("① uploadRecord START")

  const scoreId = formData.get("scoreId") as string
  const file = formData.get("file") as File
  const recordingBpm = formData.get("recordingBpm") as string | null

  if (!scoreId) return { error: "scoreIdがありません" }
  if (!file) return { error: "ファイルがありません" }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "ログインが必要です" }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: user.id }
  })

  if (!dbUser) return { error: "User未登録" }

  const performance = await prisma.performance.create({
    data: {
      userId: dbUser.id,
      scoreId,
      performanceType: "user",
      performanceStatus: "uploaded",
      audioPath: ""
    }
  })

  const filePath =
    `${dbUser.id}/${scoreId}/${performance.id}.wav`

  // 🔥 ここで直接作る
  const storage = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await storage.storage
    .from("performances")
    .upload(filePath, file, { upsert: false })

  console.log("STORAGE ERROR:", error)

  if (error) {
    await prisma.performance.delete({
      where: { id: performance.id }
    })
    return { error: "アップロード失敗" }
  }

  await prisma.performance.update({
    where: { id: performance.id },
    data: { audioPath: filePath }
  })

  // 演奏比較をバックグラウンドで実行（awaitしない → すぐに保存完了を返す）
  const { exec } = require("child_process")
  const PYTHON_PATH =
    "C:/Users/tetsu/OneDrive/Desktop/shiftB/music-app/music-analyzer/venv/Scripts/python.exe"
  const bpmNum = recordingBpm ? parseFloat(recordingBpm) : NaN
  const bpmArg = !isNaN(bpmNum) && bpmNum > 0 && bpmNum < 1000 ? ` --recording-bpm=${bpmNum}` : ""
  exec(
    `"${PYTHON_PATH}" ../music-analyzer/analyze_performance.py ${dbUser.id} ${scoreId} ${performance.id}${bpmArg}`,
    (err: Error | null) => {
      if (err) console.error("analyze_performance failed:", err)
    }
  )

  revalidatePath(`/${user.id}/scores/${scoreId}`)

  return { success: true, performanceId: performance.id }
}