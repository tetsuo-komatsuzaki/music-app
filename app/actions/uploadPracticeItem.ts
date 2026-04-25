"use server"
import { prisma } from "@/app/_libs/prisma"
import { createClient } from "@supabase/supabase-js"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { revalidatePath } from "next/cache"
import { invokeAnalysis } from "@/app/_libs/pythonRunner"
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
      analysisStatus: "queued",
      buildStatus: "queued",
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

  // 解析ジョブ起動 (Cloud Run Jobs 経由・非同期)
  // analysis/build のパス更新・status=done 遷移は Python 側 (analyze_musicxml.py /
  // build_score.py) が DB UPDATE する。ここでは起動だけ。
  try {
    const r = await invokeAnalysis({
      mode: "score_full",
      idempotencyKey: `score_full:${item.id}`,
      practiceItemId: item.id,
    })
    if (r.status === "skipped") {
      console.warn(
        `[uploadPracticeItem] Analysis skipped, item ${item.id} remains in "queued" state`
      )
      revalidatePath("/admin/practice")
      return { success: true, itemId: item.id }
    }
  } catch (e) {
    console.error("[uploadPracticeItem] invokeAnalysis failed:", e)
    // 失敗してもアイテム自体は残す（手動で再実行可能）
  }

  revalidatePath("/admin/practice")
  return { success: true, itemId: item.id }
}
