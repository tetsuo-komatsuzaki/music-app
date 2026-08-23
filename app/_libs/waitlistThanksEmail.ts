// ウェイティングリスト登録のサンクスメール (2026-08-23)。
// 新規登録時に1通だけ送る。失敗しても登録自体は成立させる (throw しない)。
// アルコのイラストは本番の公開URLを参照する (添付ではなくリモート画像。
// 画像を読み込まないメーラーでも文意が通るよう、テキスト版を必ず併送する)。
import { Resend } from "resend"

const SITE = "https://arcodaviolin.com"
const ARCO_IMG = `${SITE}/arco/09B.jpg` // 手をふって挨拶

const TEXT = [
  "このたびは Arcoda（アルコーダ）のリリース通知にご登録いただき、ありがとうございます。",
  "",
  "Arcoda は、バイオリンの練習を録音するだけで、音程とリズムを1音ずつ採点し、",
  "上達の記録を積み上げていく練習アプリです。",
  "「どこを直せばよいか」「何を練習すればよいか」「どれだけ伸びているか」を、",
  "毎日の練習のなかでお返しします。",
  "",
  "リリースは2026年9月中を予定しております。",
  "準備が整いましたら、このメールアドレス宛に、いちばんにご案内をお送りします。",
  "それまで、いましばらくお待ちください。",
  "",
  "アプリの詳しい内容は、こちらでご覧いただけます。",
  SITE + "/lp",
  "",
  "――",
  "Arcoda 開発者",
  "",
  "※本メールにお心当たりがない場合、または配信の停止をご希望の場合は、",
  "　お手数ですが contact@arcodaviolin.com までご連絡ください。",
].join("\n")

const HTML = `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:#0B1220;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0B1220;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#101B38;border:1px solid rgba(217,169,60,.28);border-radius:18px;">
        <tr><td align="center" style="padding:34px 28px 6px;">
          <img src="${ARCO_IMG}" width="132" height="132" alt="Arcodaの相棒アルコ"
               style="display:block;width:132px;height:132px;border-radius:50%;border:2px solid #E8CA84;background:#FAF9F6;">
        </td></tr>
        <tr><td align="center" style="padding:20px 28px 0;">
          <div style="font-family:'Hiragino Sans','Yu Gothic',sans-serif;font-size:19px;font-weight:700;color:#FFFAE8;line-height:1.6;">
            ご登録ありがとうございます
          </div>
          <div style="font-family:'Hiragino Sans','Yu Gothic',sans-serif;font-size:13px;font-weight:700;color:#D9A93C;letter-spacing:.06em;margin-top:10px;">
            リリースは2026年9月中を予定しています
          </div>
        </td></tr>
        <tr><td style="padding:22px 30px 0;">
          <p style="margin:0;font-family:'Hiragino Sans','Yu Gothic',sans-serif;font-size:14px;line-height:2;color:#C9CFDD;">
            このたびは Arcoda（アルコーダ）のリリース通知にご登録いただき、ありがとうございます。
          </p>
          <p style="margin:16px 0 0;font-family:'Hiragino Sans','Yu Gothic',sans-serif;font-size:14px;line-height:2;color:#C9CFDD;">
            Arcoda は、バイオリンの練習を録音するだけで、音程とリズムを1音ずつ採点し、上達の記録を積み上げていく練習アプリです。「どこを直せばよいか」「何を練習すればよいか」「どれだけ伸びているか」を、毎日の練習のなかでお返しします。
          </p>
          <p style="margin:16px 0 0;font-family:'Hiragino Sans','Yu Gothic',sans-serif;font-size:14px;line-height:2;color:#C9CFDD;">
            準備が整いましたら、このメールアドレス宛に、いちばんにご案内をお送りします。それまで、いましばらくお待ちください。
          </p>
        </td></tr>
        <tr><td align="center" style="padding:26px 30px 4px;">
          <a href="${SITE}/lp" style="display:inline-block;font-family:'Hiragino Sans','Yu Gothic',sans-serif;font-size:14px;font-weight:700;letter-spacing:.06em;color:#0B1220;background:#D9A93C;border-radius:999px;padding:13px 30px;text-decoration:none;">
            アプリの内容を見る
          </a>
        </td></tr>
        <tr><td style="padding:28px 30px 30px;">
          <div style="border-top:1px solid rgba(217,169,60,.2);padding-top:16px;font-family:'Hiragino Sans','Yu Gothic',sans-serif;font-size:12px;line-height:1.9;color:#8B97B3;">
            Arcoda 開発者<br><br>
            ※本メールにお心当たりがない場合、または配信の停止をご希望の場合は、お手数ですが
            <a href="mailto:contact@arcodaviolin.com" style="color:#D9A93C;text-decoration:none;">contact@arcodaviolin.com</a>
            までご連絡ください。
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

export async function sendWaitlistThanksEmail(to: string): Promise<void> {
  try {
    const apiKey = process.env.RESEND_API_KEY
    const from = process.env.ARCODA_NOREPLY_EMAIL
    if (!apiKey || !from) return

    const resend = new Resend(apiKey)
    await resend.emails.send({
      from,
      to,
      subject: "【Arcoda】ご登録ありがとうございます｜リリースは2026年9月中を予定しています",
      text: TEXT,
      html: HTML,
    })
  } catch (e) {
    console.error("[waitlistThanksEmail] 送信失敗:", e)
  }
}
