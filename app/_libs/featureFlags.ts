// フロント側の機能フラグ (祝い体験 v2.0 §8)。
// CELEBRATION_ENABLED: バナー・祝い表示・記念カード・本棚導線を一括ゲート。
// OFF のとき、これらは一切描画されない (= 現状と差分ゼロ)。Vercel env で切替。
// クライアント/サーバ双方から読めるよう NEXT_PUBLIC_ を使用。
export const CELEBRATION_ENABLED =
  process.env.NEXT_PUBLIC_CELEBRATION_ENABLED === "true"

// 公開時刻カットオフ (§5.4・遡及発火の遮断)。ISO文字列。この時刻より前に録音(uploadedAt)された
// 演奏は祝い対象にしない。フラグON前の既存演奏(とくにフロント合成の自己ベスト)が一斉に発火するのを
// 構造的に防ぐ。未設定なら無制限(開発)。ミリ秒。パース不能時は 0(=無制限)。
export const CELEBRATION_SINCE_MS = (() => {
  const raw = process.env.NEXT_PUBLIC_CELEBRATION_SINCE
  if (!raw) return 0
  const t = Date.parse(raw)
  return Number.isFinite(t) ? t : 0
})()
