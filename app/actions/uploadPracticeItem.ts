"use server"
import { prisma } from "@/app/_libs/prisma"
import { createClient } from "@supabase/supabase-js"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { revalidatePath } from "next/cache"

export async function uploadPracticeItem(formData: FormData) {
  console.log("▶ uploadPracticeItem START")

  // 管理者チェック
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "ログインが必要です" }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: user.id },
  })
  if (!dbUser || dbUser.role !== "admin") return { error: "管理者権限が必要です" }

  // フォームデータ取得
  const file = formData.get("file") as File
  const title = formData.get("title") as string
  const composer = formData.get("composer") as string || null
  const category = formData.get("category") as string
  const keyTonic = formData.get("keyTonic") as string
  const keyMode = formData.get("keyMode") as string
  const tempoMin = parseInt(formData.get("tempoMin") as string) || null
  const tempoMax = parseInt(formData.get("tempoMax") as string) || null
  const positions = JSON.parse(formData.get("positions") as string || "[]")
  const techniques = JSON.parse(formData.get("techniques") as string || "[]")
  const description = formData.get("description") as string || null
  const descriptionShort = formData.get("descriptionShort") as string || null

  if (!file || !title || !category || !keyTonic || !keyMode) {
    return { error: "必須項目が不足しています" }
  }

  // PracticeItem レコード作成
  const item = await prisma.practiceItem.create({
    data: {
      category: category as any,
      title,
      composer,
      description,
      descriptionShort,
      keyTonic,
      keyMode,
      tempoMin,
      tempoMax,
      positions,
      instrument: "violin",
      originalXmlPath: "",
      source: "admin",
      isPublished: true,
    },
  })

  // Storage にアップロード
  const storagePath = `practice/${item.id}/original.musicxml`
  const buffer = Buffer.from(await file.arrayBuffer())

  const storage = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { error: uploadError } = await storage.storage
    .from("musicxml")
    .upload(storagePath, buffer, { contentType: "application/xml", upsert: true })

  if (uploadError) {
    await prisma.practiceItem.delete({ where: { id: item.id } })
    return { error: `アップロード失敗: ${uploadError.message}` }
  }

  // originalXmlPath を更新
  await prisma.practiceItem.update({
    where: { id: item.id },
    data: { originalXmlPath: storagePath },
  })

  // 技法タグを紐づけ
  for (const tech of techniques as { id: string; isPrimary: boolean }[]) {
    await prisma.practiceItemTechnique.create({
      data: {
        practiceItemId: item.id,
        techniqueTagId: tech.id,
        isPrimary: tech.isPrimary,
      },
    })
  }

  // analyze_musicxml.py + build_score.py を実行（バックグラウンド）
  try {
    const { exec } = require("child_process")
    const { promisify } = require("util")
    const execAsync = promisify(exec)

    const PYTHON_PATH =
      "C:/Users/tetsu/OneDrive/Desktop/shiftB/music-app/music-analyzer/venv/Scripts/python.exe"

    // analysis.json 生成
    await execAsync(
      `"${PYTHON_PATH}" ../music-analyzer/analyze_musicxml.py --practice-item ${item.id}`
    )

    // 表示用 MusicXML 生成
    await execAsync(
      `"${PYTHON_PATH}" ../music-analyzer/build_score.py --practice-item ${item.id}`
    )

    // ステータス更新
    await prisma.practiceItem.update({
      where: { id: item.id },
      data: {
        analysisStatus: "done",
        buildStatus: "done",
        analysisPath: `practice/${item.id}/analysis.json`,
        generatedXmlPath: `practice/${item.id}/build_score.musicxml`,
      },
    })
  } catch (e) {
    console.error("Post-processing failed:", e)
    // 失敗してもアイテム自体は残す（手動で再実行可能）
  }

  revalidatePath("/admin/practice")
  return { success: true, itemId: item.id }
}
