"use server"

import { prisma } from "../_libs/prisma"
import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "../_libs/supabaseServer"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

const PYTHON_PATH =
  "C:/Users/tetsu/OneDrive/Desktop/shiftB/music-app/music-analyzer/venv/Scripts/python.exe"


export async function uploadScore(formData: FormData) {
  const title = formData.get("title") as string
  const composer = formData.get("composer") as string | null
  const file = formData.get("file") as File

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
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) return { error: "ログインが必要です" }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: user.id }
  })

  if (!dbUser) return { error: "UserがDBに存在しません" }

  // Score作成（状態初期化）
  const score = await prisma.score.create({
    data: {
      createdById: dbUser.id,
      title,
      composer: composer || "",
      originalXmlPath: "",
      analysisStatus: "processing",
      buildStatus: "processing"
    }
  })

  const filePath = `${dbUser.id}/${score.id}.${extension}`

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

  // 先に originalXmlPath 保存（安全）
  await prisma.score.update({
    where: { id: score.id },
    data: { originalXmlPath: filePath }
  })

  try {
    await execAsync(
      `"${PYTHON_PATH}" ../music-analyzer/analyze_musicxml.py ${dbUser.id} ${score.id}`
    )

    await execAsync(
      `"${PYTHON_PATH}" ../music-analyzer/build_score.py ${dbUser.id} ${score.id}`
    )
  } catch (e) {
    await prisma.score.update({
      where: { id: score.id },
      data: {
        analysisStatus: "error",
        buildStatus: "error"
      }
    })
    throw e
  }

  revalidatePath(`/${user.id}/top`)
  return { success: true }
}