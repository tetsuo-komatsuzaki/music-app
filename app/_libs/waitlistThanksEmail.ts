// ウェイティングリスト登録のサンクスメール (2026-08-23)。
// 新規登録時に1通だけ送る。失敗しても登録自体は成立させる (呼び出し側でawaitしても throw しない)。
import { Resend } from "resend"

export async function sendWaitlistThanksEmail(to: string): Promise<void> {
  try {
    const apiKey = process.env.RESEND_API_KEY
    const from = process.env.ARCODA_NOREPLY_EMAIL
    if (!apiKey || !from) return

    const text = [
      "Arcoda（アルコーダ）へのご登録、ありがとうございます。",
      "",
      "バイオリンの練習を、毎日たのしくするアプリ Arcoda は、",
      "9月中のリリースを予定しています。",
      "",
      "リリースしたら、いちばんにこのメールアドレスへお知らせします。",
      "それまで少しだけ、お待ちください。",
      "",
      "――",
      "Arcoda 開発者",
      "https://arcodaviolin.com/lp",
      "",
      "※このご案内に心当たりがない場合や、配信の解除をご希望の場合は、",
      "  contact@arcodaviolin.com までご連絡ください。",
    ].join("\n")

    const resend = new Resend(apiKey)
    await resend.emails.send({
      from,
      to,
      subject: "【Arcoda】ご登録ありがとうございます ・ リリースは9月中を予定しています",
      text,
    })
  } catch (e) {
    console.error("[waitlistThanksEmail] 送信失敗:", e)
  }
}
