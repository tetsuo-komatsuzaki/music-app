"use server"

import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { prisma } from "@/app/_libs/prisma"
import { Resend } from "resend"

export const FEEDBACK_CATEGORIES = [
  "機能改善要望",
  "不具合報告",
  "使い勝手",
  "その他",
] as const

export type FeedbackCategory = typeof FEEDBACK_CATEGORIES[number]

export async function submitFeedback(params: {
  rating: number
  category: string
  message: string
  contactEmail?: string
}): Promise<{ success: boolean; error?: string }> {
  const { rating, category, message, contactEmail } = params

  // バリデーション
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { success: false, error: "評価を選択してください" }
  }
  if (!FEEDBACK_CATEGORIES.includes(category as FeedbackCategory)) {
    return { success: false, error: "カテゴリを選択してください" }
  }
  const trimmedMessage = message?.trim() ?? ""
  if (!trimmedMessage) {
    return { success: false, error: "ご意見を入力してください" }
  }
  if (trimmedMessage.length > 1000) {
    return { success: false, error: "1000文字以内で入力してください" }
  }
  const trimmedContact = contactEmail?.trim() ?? ""
  if (trimmedContact && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedContact)) {
    return { success: false, error: "連絡先メールアドレスの形式が不正です" }
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
  const feedback = await prisma.feedback.create({
    data: {
      userId: dbUserId,
      rating,
      category,
      message: trimmedMessage,
      contactEmail: trimmedContact || null,
    },
  })

  // メール送信 (best effort)
  // TODO: rate limit (Out-of-scope, β 後)
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const safeSubject = `[Feedback] ${category} (${rating}★)`.replace(/[\r\n]/g, "")
    await resend.emails.send({
      from: process.env.ARCODA_NOREPLY_EMAIL!,
      to: process.env.ARCODA_FEEDBACK_EMAIL!,
      subject: safeSubject,
      text: [
        `feedbackId: ${feedback.id}`,
        `userId: ${dbUserId ?? "未ログイン"}`,
        `userEmail: ${user?.email ?? "未ログイン"}`,
        `contactEmail: ${trimmedContact || "未記載"}`,
        `rating: ${rating}`,
        `category: ${category}`,
        ``,
        trimmedMessage,
      ].join("\n"),
    })
    await prisma.feedback.update({
      where: { id: feedback.id },
      data: { emailSentAt: new Date() },
    })
  } catch (e) {
    console.error(JSON.stringify({
      event: "feedback_email_failed",
      feedbackId: feedback.id,
      error: e instanceof Error ? e.message : String(e),
      timestamp: new Date().toISOString(),
    }))
  }

  return { success: true }
}
