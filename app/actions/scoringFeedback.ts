"use server"

// 採点フィードバック (2026-08-03): 「点数がおかしい」と感じた瞬間にユーザーが運営へ送れる。
// 乖離の声は採点エンジン改善の教師データになる (project_karte_growth_requirements 要望3のMVP)。
// 保存先は運営メール (Resend・既存基盤)。テーブルは持たない (量が増えたらDB化を検討)。
import { Resend } from "resend"
import { prisma } from "@/app/_libs/prisma"
import { requireAuthAction } from "@/app/_libs/requireAuth"
import { isValidCuid } from "@/app/_libs/validators"

const OPERATOR_EMAIL = "tetsuo9293@gmail.com" // 運営 (サーバー側のみ・クライアントに出ない)

/** アプリ全般への改善要望・ご意見 (2026-08-03)。設定画面の常設入口から */
export async function sendAppFeedback(input: {
  message: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  const dbUser = auth.user.dbUser

  const message = (input.message ?? "").trim().slice(0, 2000)
  if (!message) return { ok: false, error: "内容を書いてください" }

  try {
    const apiKey = process.env.RESEND_API_KEY
    const from = process.env.ARCODA_NOREPLY_EMAIL
    if (!apiKey || !from) return { ok: false, error: "送信基盤が未設定です" }
    const resend = new Resend(apiKey)
    await resend.emails.send({
      from,
      to: OPERATOR_EMAIL,
      subject: `【ご意見】アプリへの要望 (${dbUser.role})`,
      text: [`ユーザー: ${dbUser.id} (${dbUser.role})`, "", message].join("\n"),
    })
    return { ok: true }
  } catch {
    return { ok: false, error: "送信に失敗しました。時間をおいて試してください" }
  }
}

export async function sendScoringFeedback(input: {
  performanceId: string
  kind: "score" | "practice"
  message: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  const dbUser = auth.user.dbUser

  if (!isValidCuid(input.performanceId)) return { ok: false, error: "対象が不正です" }
  const message = (input.message ?? "").trim().slice(0, 1000)
  if (!message) return { ok: false, error: "内容を書いてください" }

  try {
    // 本人の演奏かを確認しつつ、採点コンテキストを添える
    const perf =
      input.kind === "score"
        ? await prisma.performance.findFirst({
            where: { id: input.performanceId, userId: dbUser.id },
            select: { id: true, pitchAccuracy: true, timingAccuracy: true, recordingBpm: true, score: { select: { id: true, title: true } } },
          })
        : await prisma.practicePerformance.findFirst({
            where: { id: input.performanceId, userId: dbUser.id },
            select: { id: true, pitchAccuracy: true, timingAccuracy: true, recordingBpm: true, practiceItem: { select: { id: true, title: true } } },
          })
    if (!perf) return { ok: false, error: "演奏が見つかりません" }

    const apiKey = process.env.RESEND_API_KEY
    const from = process.env.ARCODA_NOREPLY_EMAIL
    if (!apiKey || !from) return { ok: false, error: "送信基盤が未設定です" }

    const title = input.kind === "score"
      ? (perf as { score: { title: string } }).score.title
      : (perf as { practiceItem: { title: string } }).practiceItem.title
    const resend = new Resend(apiKey)
    await resend.emails.send({
      from,
      to: OPERATOR_EMAIL,
      subject: `【採点FB】${title}・音程${perf.pitchAccuracy ?? "-"}/リズム${perf.timingAccuracy ?? "-"}`,
      text: [
        `ユーザー: ${dbUser.id} (${dbUser.role})`,
        `対象: ${input.kind} / ${title}`,
        `performanceId: ${perf.id}`,
        `採点: 音程 ${perf.pitchAccuracy ?? "-"} / リズム ${perf.timingAccuracy ?? "-"} / bpm ${perf.recordingBpm ?? "-"}`,
        "",
        "--- 本人の声 ---",
        message,
      ].join("\n"),
    })
    return { ok: true }
  } catch {
    return { ok: false, error: "送信に失敗しました。時間をおいて試してください" }
  }
}
