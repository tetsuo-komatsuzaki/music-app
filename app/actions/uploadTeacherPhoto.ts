"use server"

// 先生プロフィールの顔写真アップロード (2026-08-01)。
// Supabase Storage の公開バケット "avatars" に保存し、公開URLを返す。
// バケットは初回に自動作成 (service role)。「先生を探す」で公開される前提の画像なので public でよい。
import { prisma } from "@/app/_libs/prisma"
import { requireAuthAction } from "@/app/_libs/requireAuth"
import { storageAdmin } from "@/app/_libs/storageAdmin"

const BUCKET = "avatars"
const MAX_BYTES = 5 * 1024 * 1024 // 5MB
const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

export async function uploadTeacherPhoto(
  formData: FormData,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  if (auth.user.dbUser.role !== "teacher") return { ok: false, error: "先生アカウントが必要です" }

  const file = formData.get("file")
  if (!(file instanceof File)) return { ok: false, error: "画像ファイルを選んでください" }
  const ext = MIME_EXT[file.type]
  if (!ext) return { ok: false, error: "JPEG / PNG / WebP の画像を選んでください" }
  if (file.size > MAX_BYTES) return { ok: false, error: "5MB以下の画像にしてください" }

  try {
    // バケットが無ければ作成 (既存ならエラーを無視)
    await storageAdmin.storage.createBucket(BUCKET, { public: true }).catch(() => {})

    const path = `teacher/${auth.user.dbUser.id}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    const { error } = await storageAdmin.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: true })
    if (error) return { ok: false, error: "アップロードに失敗しました" }

    const { data } = storageAdmin.storage.from(BUCKET).getPublicUrl(path)
    // キャッシュ更新のためタイムスタンプを付与 (同名上書きでも新しい画像が出る)
    const url = `${data.publicUrl}?v=${Date.now()}`

    // プロフィールにも即保存 (保存ボタンを押し忘れても写真は反映される)
    await prisma.teacherProfile.upsert({
      where: { teacherId: auth.user.dbUser.id },
      create: { teacherId: auth.user.dbUser.id, photoUrl: url },
      update: { photoUrl: url },
    })

    return { ok: true, url }
  } catch {
    return { ok: false, error: "アップロードに失敗しました" }
  }
}

/** 顔写真を削除 (プロフィールから外す。ファイル自体は上書き運用なので残っても害なし) */
export async function removeTeacherPhoto(): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  if (auth.user.dbUser.role !== "teacher") return { ok: false, error: "先生アカウントが必要です" }
  try {
    await prisma.teacherProfile.upsert({
      where: { teacherId: auth.user.dbUser.id },
      create: { teacherId: auth.user.dbUser.id, photoUrl: null },
      update: { photoUrl: null },
    })
    return { ok: true }
  } catch {
    return { ok: false, error: "削除に失敗しました" }
  }
}
