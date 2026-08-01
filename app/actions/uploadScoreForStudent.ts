"use server"

// 先生が楽譜(MusicXML)を作成して生徒に渡す (2026-08-02)。
// 方式=「生徒の代わりにアップロード」: Score.createdById を生徒にして作成するので、
// 生徒のマイライブラリーに自然に現れ、アクセス制御・解析パイプライン・宿題の
// 対象選択(全曲リスト)とそのまま整合する。uploadScore の生徒向け最小版。
import { prisma } from "../_libs/prisma"
import { createClient } from "@supabase/supabase-js"
import { after } from "next/server"
import { generateScoreCover } from "../_libs/coverImage/generateAndStore"
import { requireAuthAction } from "../_libs/requireAuth"
import { invokeAnalysis } from "../_libs/pythonRunner"
import { ensureScoreGroup } from "../_libs/materialGroup"
import { notifyStudent } from "../_libs/teacherEmailNotify"

export async function uploadScoreForStudent(
  studentId: string,
  formData: FormData,
): Promise<{ ok: true; scoreId: string } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  if (auth.user.dbUser.role !== "teacher") return { ok: false, error: "先生アカウントが必要です" }
  const teacherId = auth.user.dbUser.id

  // 担当生徒か確認
  const link = await prisma.teacherStudent.findUnique({
    where: { teacherId_studentId: { teacherId, studentId } },
    select: { id: true },
  })
  if (!link) return { ok: false, error: "担当していない生徒です" }

  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { supabaseUserId: true },
  })
  if (!student) return { ok: false, error: "生徒が見つかりません" }

  const title = (formData.get("title") as string | null)?.trim() ?? ""
  const composer = (formData.get("composer") as string | null)?.trim() ?? ""
  const comment = (formData.get("comment") as string | null)?.trim() ?? ""
  const file = formData.get("file")
  if (!title) return { ok: false, error: "曲名を入力してください" }
  if (!(file instanceof File)) return { ok: false, error: "MusicXMLファイルを選んでください" }
  if (file.size > 5 * 1024 * 1024) return { ok: false, error: "5MB以下のみ対応です" }
  const extension = file.name.split(".").pop()?.toLowerCase()
  if (!extension || !["xml", "musicxml", "mxl"].includes(extension)) {
    return { ok: false, error: "対応形式は .xml / .musicxml / .mxl のみです" }
  }

  // Score は生徒名義で作成 (createdById=生徒) → 生徒のライブラリーに出る
  const score = await prisma.score.create({
    data: {
      createdById: studentId,
      title,
      composer,
      originalXmlPath: "",
      analysisStatus: "queued",
      buildStatus: "queued",
      isShared: false,
    },
  })

  // ストレージは生徒の領域 (Path B: auth.uid() ベース) に保存
  const filePath = `${student.supabaseUserId}/${score.id}.${extension}`
  const storageClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { error: uploadError } = await storageClient.storage
    .from("musicxml")
    .upload(filePath, file, { upsert: false })
  if (uploadError) {
    await prisma.score.delete({ where: { id: score.id } })
    return { ok: false, error: "Storage保存に失敗しました" }
  }
  await prisma.score.update({ where: { id: score.id }, data: { originalXmlPath: filePath } })

  // グループ作成 (失敗しても致命的でない)
  try { await ensureScoreGroup(score.id) } catch { /* noop */ }

  // AIカバーは応答後に非同期生成
  after(async () => {
    try { await generateScoreCover(score.id) } catch { /* noop */ }
  })

  // 解析ジョブ起動 (生徒のIDで。失敗時はエラー状態を刻む)
  try {
    await invokeAnalysis({
      mode: "score_full",
      idempotencyKey: `score_full:${score.id}`,
      userId: studentId,
      storageUserId: student.supabaseUserId,
      scoreId: score.id,
    })
  } catch (e) {
    await prisma.score.update({
      where: { id: score.id },
      data: {
        analysisStatus: "error",
        buildStatus: "error",
        errorMessage: e instanceof Error ? e.message.slice(0, 300) : String(e).slice(0, 300),
      },
    })
    return { ok: false, error: "解析の開始に失敗しました (楽譜は保存済み)" }
  }

  // 生徒へお知らせ (メッセージ + メール)
  try {
    const body = `📓 楽譜「${title}」を送りました。ライブラリーから開いてね${comment ? `\n💬 ${comment}` : ""}`
    await prisma.message.create({
      data: { teacherId, studentId, fromTeacher: true, body },
    })
    await notifyStudent(studentId, teacherId, "message", body)
  } catch { /* 通知失敗は致命的でない */ }

  return { ok: true, scoreId: score.id }
}
