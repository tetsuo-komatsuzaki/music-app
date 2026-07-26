// フロント側の機能フラグ (祝い体験 v2.0 §8)。
// CELEBRATION_ENABLED: バナー・祝い表示・記念カード・本棚導線を一括ゲート。
// OFF のとき、これらは一切描画されない (= 現状と差分ゼロ)。Vercel env で切替。
// クライアント/サーバ双方から読めるよう NEXT_PUBLIC_ を使用。
export const CELEBRATION_ENABLED =
  process.env.NEXT_PUBLIC_CELEBRATION_ENABLED === "true"
