"use server"

import { prisma } from "../_libs/prisma"
import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "../_libs/supabaseServer"
import { runPythonScript } from "../_libs/pythonRunner"

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
      analysisStatus: "processing",
      buildStatus: "processing",
    },
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

  await prisma.score.update({
    where: { id: score.id },
    data: { originalXmlPath: filePath },
  })

  // Python 解析（spawn + 2段階環境変数）
  // Python無効（本番など）なら status は processing のまま。
  // エラーマークはしない = 後処理インフラでの再解析可能な状態を維持。
  try {
    const r1 = await runPythonScript("../music-analyzer/analyze_musicxml.py", [
      dbUser.id,
      score.id,
    ])
    if (r1.status === "skipped") {
      // TODO(Phase 2): Python 無効環境では analysisStatus="processing" が永続化する。
      //                バックグラウンドジョブ基盤が整ったら skipped → queued 等の
      //                専用ステータスへ。現状は手動監査 + 手動再解析で対応想定。
      console.warn(
        `[uploadScore] Python skipped, score ${score.id} remains in "processing" state`
      )
      revalidatePath(`/${user.id}/scores`)
      return { success: true }
    }
    await runPythonScript("../music-analyzer/build_score.py", [dbUser.id, score.id])
  } catch (e) {
    await prisma.score.update({
      where: { id: score.id },
      data: {
        analysisStatus: "error",
        buildStatus: "error",
      },
    })
    throw e
  }

  revalidatePath(`/${user.id}/scores`)
  return { success: true }
}
