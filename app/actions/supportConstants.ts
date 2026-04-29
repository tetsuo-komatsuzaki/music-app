// 純データのみ ("use server" ディレクティブなし)
// FeedbackClient / InquiryClient (client) と submitFeedback / submitInquiry (server action)
// の両方から参照される共通定数。
//
// "use server" ファイルから export できるのは async function のみ (Next.js 16+ の制約) のため、
// 定数は本ファイル (use server なし) に置く。

export const FEEDBACK_CATEGORIES = [
  "機能改善要望",
  "不具合報告",
  "使い勝手",
  "その他",
] as const

export type FeedbackCategory = typeof FEEDBACK_CATEGORIES[number]

export const INQUIRY_CATEGORIES = [
  "アカウントについて",
  "機能・使い方について",
  "不具合報告",
  "料金・支払いについて",
  "その他",
] as const

export type InquiryCategory = typeof INQUIRY_CATEGORIES[number]
