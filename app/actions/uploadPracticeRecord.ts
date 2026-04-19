"use server"

import { prisma } from "@/app/_libs/prisma"
import { createClient } from "@supabase/supabase-js"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { revalidatePath } from "next/cache"
import { isValidCuid } from "@/app/_libs/validators"
import { runPythonScriptFireAndForget } from "@/app/_libs/pythonRunner"

export async function uploadPracticeRecord(formData: FormData) {
  console.log("▶ uploadPracticeRecord START")

  const practiceItemId = (formData.get("practiceItemId") as string | null)?.trim() ?? ""
  const file = formData.get("file") as File | null

  if (!isValidCuid(practiceItemId)) return { error: "practiceItemId が不正です" }
  if (!file) return { error: "ファイルがありません" }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "ログインが必要です" }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: user.id },
  })
  if (!dbUser) return { error: "User未登録" }

  // PracticeItem アクセス制御（B-2 items/[itemId]/route.ts と同一パターン）:
  // - 自己所有                        → OK
  // - 運営サンプル(null) かつ 公開      → OK
  // - それ以外（他者所有・未公開null）  → 404 相当
  const item = await prisma.practiceItem.findUnique({
    where: { id: practiceItemId },
    select: { id: true, ownerUserId: true, isPublished: true },
  })
  const isOwner = item?.ownerUserId === dbUser.id
  const isPublicPublished = item?.ownerUserId === null && item?.isPublished === true
  if (!item || (!isOwner && !isPublicPublished)) {
    return { error: "PracticeItem が見つかりません" }
  }

  const performance = await prisma.practicePerformance.create({
    data: {
      userId: dbUser.id,
      practiceItemId,
      audioPath: "",
    },
  })

  // practiceItemId は検証済み・cuid形式
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
    await prisma.practicePerformance.delete({ where: { id: performance.id } })
    return { error: "アップロード失敗" }
  }

  await prisma.practicePerformance.update({
    where: { id: performance.id },
    data: { audioPath: filePath },
  })

  // Python 解析（fire-and-forget・spawn 配列引数）
  runPythonScriptFireAndForget("../music-analyzer/analyze_performance.py", [
    dbUser.id,
    practiceItemId,
    performance.id,
    "practice",
  ])

  revalidatePath(`/${user.id}/practice`)
  return { success: true }
}
