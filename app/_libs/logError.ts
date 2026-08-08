// 可観測性の最小基盤 (2026-08-08 システム部監査 P0-1)。
//
// 現状 console.error が各所に散っているだけで、本番で何が起きているか集約されない。
// このヘルパに一本化し、①構造化 JSON でログ (Cloud/Vercel のログ検索が効く)
// ②SENTRY_DSN があれば外部監視へ送る (SDK 導入後に有効化) の2段にする。
//
// 使い方: catch 節で `logError("stripe.webhook", e, { eventType })` のように呼ぶ。
// Sentry を実際に有効化する手順は本ファイル末尾のコメント参照 (DSN はユーザー用意)。

type Context = Record<string, unknown>

/** Sentry 等への送信フック。SDK 導入時に setErrorReporter で差し込む (未設定なら no-op)。 */
let reporter: ((err: unknown, tag: string, ctx: Context) => void) | null = null
export function setErrorReporter(fn: (err: unknown, tag: string, ctx: Context) => void) {
  reporter = fn
}

/**
 * エラーを構造化ログ + (設定時)外部監視へ。tag は "領域.操作" 形式で検索しやすく。
 * 例外自体は握る (ロギングが本処理を巻き込んで落とさない)。
 */
export function logError(tag: string, err: unknown, ctx: Context = {}): void {
  const message = err instanceof Error ? err.message : String(err)
  const stack = err instanceof Error ? err.stack : undefined
  try {
    // 構造化 JSON 1 行 (Vercel/Cloud Logging でフィールド検索可能)
    console.error(JSON.stringify({ level: "error", tag, message, stack, ...ctx }))
  } catch {
    console.error(`[${tag}] ${message}`)
  }
  if (reporter) {
    try { reporter(err, tag, ctx) } catch { /* 監視側の失敗で本処理を壊さない */ }
  }
}

// ── Sentry を有効化する手順 (ユーザー作業) ──────────────────────────
// 1. Sentry プロジェクトを作成し DSN を取得
// 2. `npm i @sentry/nextjs` して `npx @sentry/wizard@latest -i nextjs`
// 3. instrumentation.ts などの起動時に:
//      import * as Sentry from "@sentry/nextjs"
//      import { setErrorReporter } from "@/app/_libs/logError"
//      setErrorReporter((err, tag, ctx) => Sentry.captureException(err, { tags: { area: tag }, extra: ctx }))
// 4. SENTRY_DSN を Vercel 環境変数に設定
// これで既存の logError 呼び出しが自動的に Sentry にも飛ぶ (コード変更不要)。
