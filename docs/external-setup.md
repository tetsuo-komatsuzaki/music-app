# 外部設定チェックリスト（コードで閉じられない・ダッシュボード/アカウント作業）

最終更新: 2026-08-08。課金公開の前提となる外部設定と、確認状況を記録する。

## 1. Vercel 環境変数（Production）

| 変数 | 用途 | 本番の状況(2026-08-08確認) |
|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe API 認証(サーバー) | ⚠️ **要再確認**（下記「発見」参照） |
| `STRIPE_WEBHOOK_SECRET` | webhook 署名検証 | ✅ 設定済（本番webhookが400 invalid signatureを返す=未設定なら503） |
| `STRIPE_PRICE_MONTHLY` | 月額980円のprice ID | ✅ 値は有効（テストキーでセッション作成成功） |
| `STRIPE_PRICE_YEARLY` | 年額9,800円のprice ID | ✅ 値は有効（同上） |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | 公開可能キー | 現行の hosted-checkout(リダイレクト)では**未使用**。将来Stripe.jsを使う時のみ必要 |

テスト値（テストモード・2026-08-07発行）。**秘密キーはリポジトリに載せない**（GitHub push protectionがブロックする）。実値は会話履歴 / Stripeダッシュボード / Vercel env を参照:
```
STRIPE_SECRET_KEY=sk_test_51U1nyt……（末尾 ...0004fzjbYcY・Stripeダッシュボードで再取得可）
STRIPE_WEBHOOK_SECRET=whsec_……（Webhookエンドポイント we_1U1obo... の署名シークレット）
STRIPE_PRICE_MONTHLY=price_1U1oYoQnMgaMHv9Myzi828g2
STRIPE_PRICE_YEARLY=price_1U1oYoQnMgaMHv9M7ftXhY5F
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51U1nyt……（公開キーなので秘匿不要・Stripeダッシュボード参照）
```

### 🔴 発見(2026-08-08): 本番の決済ページ作成が失敗する
- 症状: 本番設定ページのプラン欄は表示されるが、「月額980円で始める」を押すと **「決済ページの作成に失敗しました」(500)**。
- 切り分け: 上記テストキー + 同じ price ID ではセッション作成が**成功する**（price IDは有効）。→ 原因は**本番の `STRIPE_SECRET_KEY`**。
- 最有力: (a) Vercelに貼った値のタイポ/欠け、(b) **本番(live)キーとテストのprice IDの食い違い**（liveキーだとテストのprice IDは "No such price" になる）。
- `isBillingConfigured()` は「envが空でないか」しか見ないため、キーが不正でもプラン欄は出てしまう（要注意）。
- **対応(ユーザー)**: Vercelの `STRIPE_SECRET_KEY` が上記テストキーと**完全一致**か確認（末尾は `...0004fzjbYcY`、大文字小文字注意）。直したら Redeploy → 再度プラン欄でボタンを押し、Stripe決済ページに遷移すればOK。

### env反映後の手順
Vercel Settings → Environment Variables で追加/修正 → **Deployments から Redeploy**（環境変数は再デプロイで反映）。

## 2. Stripe ダッシュボード設定（課金の端）
- 支払い失敗の自動督促（Billing → Smart Retries / Dunning）
- 返金ポリシーの運用
- **日本の適格請求書（インボイス番号）**の表示設定
- 税設定（税込980円で発行済み。税率/表示の確認）
- 本番公開時: テストキー→**ライブキー**へ差し替え、Webhookエンドポイントをライブモードで再登録し `STRIPE_WEBHOOK_SECRET` を更新

## 3. Sentry（可観測性・P0）
- Sentryプロジェクト作成 → DSN取得
- `npm i @sentry/nextjs` → `npx @sentry/wizard@latest -i nextjs`
- 起動時に `setErrorReporter((err,tag,ctx)=>Sentry.captureException(...))`（手順は `app/_libs/logError.ts` 末尾）
- `SENTRY_DSN` を Vercel env に設定
- これで既存の `logError` 呼び出しが自動でSentryに飛ぶ

## 4. Supabase
- Storageバケット `performances` の **file size limit** をダッシュボードで設定（署名URL直PUTの一次防御。コード側は解析前に30MB+magic-byte検証済み）
- 本番DBの**バックアップ復元訓練**（一度リストアを試す）

## 5. その他（P2）
- メール到達性: Resendの SPF/DKIM/バウンス（arcodaviolin.com）実機確認
- 独自ドメイン/HTTPS: 設定済み（arcodaviolin.com、HSTS有効）
