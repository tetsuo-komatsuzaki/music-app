"use server"
import { prisma } from "@/app/_libs/prisma"
import { createClient } from "@supabase/supabase-js"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { revalidatePath } from "next/cache"

export async function uploadPracticeRecord(formData: FormData) {
  console.log("▶ uploadPracticeRecord START")

  const practiceItemId = formData.get("practiceItemId") as string
  const file = formData.get("file") as File
  if (!practiceItemId) return { error: "practiceItemIdがありません" }
  if (!file) return { error: "ファイルがありません" }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "ログインが必要です" }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: user.id }
  })
  if (!dbUser) return { error: "User未登録" }

  const performance = await prisma.practicePerformance.create({
    data: {
      userId: dbUser.id,
      practiceItemId,
      audioPath: ""
    }
  })

  const filePath = `practice/${dbUser.id}/${practiceItemId}/${performance.id}.wav`

  const storage = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await storage.storage
    .from("performances")
    .upload(filePath, file, { upsert: false })

  console.log("STORAGE ERROR:", error)

  if (error) {
    await prisma.practicePerformance.delete({
      where: { id: performance.id }
    })
    return { error: "アップロード失敗" }
  }

  await prisma.practicePerformance.update({
    where: { id: performance.id },
    data: { audioPath: filePath }
  })

  // 比較処理を実行
  try {
    const { exec } = require("child_process")
    const { promisify } = require("util")
    const execAsync = promisify(exec)

    const PYTHON_PATH =
      "C:/Users/tetsu/OneDrive/Desktop/shiftB/music-app/music-analyzer/venv/Scripts/python.exe"

    await execAsync(
      `"${PYTHON_PATH}" ../music-analyzer/analyze_performance.py ${dbUser.id} ${practiceItemId} ${performance.id}`
    )
  } catch (e) {
    console.error("analyze_performance failed:", e)
  }

  revalidatePath(`/${dbUser.id}/practice`)
  return { success: true }
}
