"use server"
import { prisma } from "@/app/_libs/prisma"
import { createClient } from "@supabase/supabase-js"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { revalidatePath } from "next/cache"
import { runPythonScript } from "@/app/_libs/pythonRunner"
import type { PracticeCategory } from "@/app/generated/prisma"

export async function uploadPracticeItem(formData: FormData) {
  console.log("▶ uploadPracticeItem START")

  // 管理者チェック（Role enum で "student"|"teacher"|"admin" に限定済）
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "ログインが必要です" }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: user.id },
  })
  if (!dbUser || dbUser.role !== "admin") return { error: "管理者権限が必要です" }

  // フォームデータ取得
  // 入力値は trim する（前後空白が create 時のバリデーションや path 組み立てで
  // 予期しない挙動を招くのを防ぐ）
  const file = formData.get("file") as File | null
  const title = (formData.get("title") as string | null)?.trim() ?? ""
  const composer = (formData.get("composer") as string | null)?.trim() || null
  const category = (formData.get("category") as string | null)?.trim() ?? ""
  const keyTonic = (formData.get("keyTonic") as string | null)?.trim() ?? ""
  const keyMode = (formData.get("keyMode") as string | null)?.trim() ?? ""
  const tempoMin = parseInt(formData.get("tempoMin") as string) || null
  const tempoMax = parseInt(formData.get("tempoMax") as string) || null
  const positions = JSON.parse(formData.get("positions") as string || "[]")
  const techniques = JSON.parse(formData.get("techniques") as string || "[]")
  const description = (formData.get("description") as string | null)?.trim() || null
  const descriptionShort = (formData.get("descriptionShort") as string | null)?.trim() || null

  if (!file || !title || !category || !keyTonic || !keyMode) {
    return { error: "必須項目が不足しています" }
  }

  // TODO(Phase 2): category は現状 `as PracticeCategory` で Prisma にキャスト渡し。
  //                不正値は Prisma create 時に例外になるが、事前に enum 集合で
  //                ランタイム検証して 400 を返す方がユーザー体感エラーが親切。
  //                例: if (!["scale","arpeggio","etude"].includes(category)) ...
  const item = await prisma.practiceItem.create({
    data: {
      category: category as PracticeCategory,
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
  // item.id は Prisma 生成の cuid なので path に使って安全
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

  // Python 解析（spawn + 2段階環境変数）
  // Python無効（本番など）なら analysisStatus="processing" のまま。
  // エラーマークしない = 後処理インフラでの再解析可能な状態を維持。
  try {
    const r1 = await runPythonScript("../music-analyzer/analyze_musicxml.py", [
      "--practice-item",
      item.id,
    ])
    if (r1.status === "skipped") {
      // TODO(Phase 2): Python 無効環境では analysisStatus="processing" が永続化する。
      //                バックグラウンドジョブ基盤が整ったら skipped → queued 等の
      //                専用ステータスへ。現状は手動監査 + 手動再解析で対応想定。
      console.warn(
        `[uploadPracticeItem] Python skipped, item ${item.id} remains in "processing" state`
      )
      revalidatePath("/admin/practice")
      return { success: true, itemId: item.id }
    }

    await runPythonScript("../music-analyzer/build_score.py", [
      "--practice-item",
      item.id,
    ])

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
