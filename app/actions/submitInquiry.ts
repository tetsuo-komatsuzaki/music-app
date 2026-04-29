"use server"

import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { prisma } from "@/app/_libs/prisma"
import { Resend } from "resend"
import { INQUIRY_CATEGORIES, InquiryCategory } from "./supportConstants"

const sanitizeHeader = (s: string) => s.replace(/[\r\n]/g, "")

export async function submitInquiry(params: {
  category: string
  subject: string
  message: string
  replyTo: string
}): Promise<{ success: boolean; error?: string }> {
  const { category, subject, message, replyTo } = params

  // バリデーション
  if (!INQUIRY_CATEGORIES.includes(category as InquiryCategory)) {
    return { success: false, error: "カテゴリを選択してください" }
  }
  const trimmedSubject = subject?.trim() ?? ""
  if (!trimmedSubject) return { success: false, error: "件名を入力してください" }
  if (trimmedSubject.length > 100) {
    return { success: false, error: "件名は100文字以内で入力してください" }
  }
  const trimmedMessage = message?.trim() ?? ""
  if (!trimmedMessage) return { success: false, error: "本文を入力してください" }
  if (trimmedMessage.length > 2000) {
    return { success: false, error: "本文は2000文字以内で入力してください" }
  }
  const trimmedReplyTo = replyTo?.trim() ?? ""
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedReplyTo)) {
    return { success: false, error: "返信先メールアドレスの形式が不正です" }
  }

  // 認証 (任意ログインユーザーは記録、未ログインも可)
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  let dbUserId: string | null = null
  if (user) {
    const dbUser = await prisma.user.findUnique({
      where: { supabaseUserId: user.id },
      select: { id: true },
    })
    dbUserId = dbUser?.id ?? null
  }

  // 必ず DB INSERT (Resend 障害でロストしない)
  const inquiry = await prisma.supportInquiry.create({
    data: {
      userId: dbUserId,
      category,
      subject: trimmedSubject,
      message: trimmedMessage,
      replyTo: trimmedReplyTo,
    },
  })

  // メール送信 (best effort)
  // TODO: rate limit (Out-of-scope, β 後)
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const safeSubject = sanitizeHeader(`[Inquiry] ${category}: ${trimmedSubject}`)
    const safeReplyTo = sanitizeHeader(trimmedReplyTo)
    await resend.emails.send({
      from: process.env.ARCODA_NOREPLY_EMAIL!,
      to: process.env.ARCODA_SUPPORT_EMAIL!,
      replyTo: safeReplyTo,
      subject: safeSubject,
      text: [
        `inquiryId: ${inquiry.id}`,
        `userId: ${dbUserId ?? "未ログイン"}`,
        `userEmail: ${user?.email ?? "未ログイン"}`,
        `replyTo: ${trimmedReplyTo}`,
        `category: ${category}`,
        `subject: ${trimmedSubject}`,
        ``,
        trimmedMessage,
      ].join("\n"),
    })
    await prisma.supportInquiry.update({
      where: { id: inquiry.id },
      data: { emailSentAt: new Date() },
    })
  } catch (e) {
    console.error(JSON.stringify({
      event: "inquiry_email_failed",
      inquiryId: inquiry.id,
      error: e instanceof Error ? e.message : String(e),
      timestamp: new Date().toISOString(),
    }))
  }

  return { success: true }
}
