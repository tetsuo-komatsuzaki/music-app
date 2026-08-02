// 先生→生徒の通知メール (2026-08-01)。
// 先生が「メッセージ送信」「添削保存」「宿題作成」した時に、生徒の登録メールへ即時通知。
// メール基盤は既存の Resend を再利用 (Supabase 単体では任意メール送信ができないため)。
// 生徒のメールは User に持たないので Supabase Admin(service role) の auth から引く。
// best effort: 送信に失敗しても本処理(メッセージ保存等)は止めない。
import { Resend } from "resend"
import { prisma } from "./prisma"
import { supabaseAdmin } from "./supabaseAdmin"

export type NotifyKind = "message" | "feedback" | "assignment" | "celebration" | "observation"

const SUBJECT: Record<NotifyKind, string> = {
  message: "先生からメッセージが届きました",
  feedback: "先生の添削が届きました",
  assignment: "先生から新しい宿題が届きました",
  celebration: "🎉 先生からお祝いが届きました！",
  observation: "先生からレッスンの所見が届きました",
}
const NOUN: Record<NotifyKind, string> = {
  message: "メッセージ",
  feedback: "添削",
  assignment: "宿題",
  celebration: "お祝いメッセージ",
  observation: "所見",
}

/** 生徒へ即時メール通知 (best effort)。studentDbUserId / teacherDbUserId は User.id。 */
export async function notifyStudent(
  studentDbUserId: string,
  teacherDbUserId: string,
  kind: NotifyKind,
  preview?: string | null,
): Promise<void> {
  try {
    const apiKey = process.env.RESEND_API_KEY
    const from = process.env.ARCODA_NOREPLY_EMAIL
    if (!apiKey || !from) return

    const [student, teacher] = await Promise.all([
      prisma.user.findUnique({ where: { id: studentDbUserId }, select: { supabaseUserId: true, teacherEmailOff: true } }),
      prisma.user.findUnique({ where: { id: teacherDbUserId }, select: { name: true } }),
    ])
    if (!student) return
    if (student.teacherEmailOff) return // 生徒が配信停止に設定している

    const { data, error } = await supabaseAdmin.auth.admin.getUserById(student.supabaseUserId)
    const to = data?.user?.email
    if (error || !to) return

    const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "")
    const link = base ? `${base}/${student.supabaseUserId}/my-teacher` : null
    const teacherName = teacher?.name ? `${teacher.name} 先生` : "先生"
    const trimmed = preview ? preview.replace(/\s+/g, " ").trim().slice(0, 140) : ""

    const lines = [`${teacherName}から${NOUN[kind]}が届きました。`]
    if (trimmed) lines.push("", `「${trimmed}${(preview ?? "").length > 140 ? "…" : ""}」`)
    if (link) lines.push("", `▼ アプリで確認`, link)
    lines.push("", "――", "Arcoda（アルコダ）", "※通知が不要な場合は、アプリの「設定 > 通知」からオフにできます。")

    const resend = new Resend(apiKey)
    await resend.emails.send({
      from,
      to,
      subject: `【Arcoda】${SUBJECT[kind]}`,
      text: lines.join("\n"),
    })
  } catch (e) {
    console.error("[teacherEmailNotify] 送信失敗(処理は継続):", e)
  }
}
