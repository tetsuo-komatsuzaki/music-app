"use server"

import { prisma } from "../_libs/prisma"
import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "../_libs/supabaseServer"
import { invokeAnalysis } from "../_libs/pythonRunner"

export async function uploadScore(formData: FormData) {
  const title = (formData.get("title") as string | null)?.trim() ?? ""
  const composer = (formData.get("composer") as string | null)?.trim() ?? null
  const file = formData.get("file") as File | null

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
    },
  })

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
