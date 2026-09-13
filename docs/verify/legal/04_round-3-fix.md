# 法務文面 ラウンド 3 修正記録

日付: 2026-09-13。対象: 03_round-3-critic.md (S2 1・S3 4・S4 2 = 7 件) と、ラウンド 2 の開き残り (CR-L2-03・05・09・10・14)。

## 1. 新規指摘への対応

| ID | 重大度 | 対応 | どこを直したか |
|---|---|---|---|
| CR-L3-01 | S2 | 修正 (期待 1〜4 すべて) | (1) app/_libs/billingProviderOf.ts を新設: `resolveBillingProvider` (列が空でも stripeSubscriptionId から "stripe" を導出) と `shouldCancelStripeOnDeletion` (Apple でなく・加入歴あり・planStatus が trialing/active/past_due)。stripe.ts の subscriptionToUserFields に `billingProvider: "stripe"` を追加 (webhook が以後書く)。migration 20260913120000_stripe_billing_provider_backfill で既存行を埋める (本番は手動適用・listing §4 に追記)。(2) requestAccountDeletion.ts の解約条件を shouldCancelStripeOnDeletion に。Apple の注記も resolveBillingProvider で判定。(3) PlanCard.tsx の manage を「stripe なら Customer Portal を最優先、それ以外で apple/Apple モードなら Apple」に並べ替え。settings/page.tsx と profile/page.tsx は resolveBillingProvider の値を渡す (profile は stripeSubscriptionId・planStatus も select)。(4) billingProviderOf.test.ts 10 件 (列が空の Stripe 契約者で true になること、canceled・未加入・Apple で false になること) |
| CR-L3-02 | S3 | 修正 | ArcoResultOverlay の 1 行を「はじめる手続き・はじめての方は最初の 2 週間は無料」に |
| CR-L3-03 | S3 | 修正 | listing §3 に「審査用アカウントの契約済みは Sandbox の購入を実際に完了させて作る (planGrant=internal では『契約を管理』が出ない)」。英文の Sandbox 段落にも同じ旨 |
| CR-L3-04 | S3 | 修正 | 規約 第5条「iPhone 向けアプリでは、アカウントの登録はアルコプラスの契約と同時に行われます。Web ブラウザでログインしてアカウントを作った場合、アルコプラスの契約は iPhone 向けアプリで行います」。listing の Sign-in を「on iPhone, new users sign in with Apple only… (On the web, existing accounts can also use Google.)」に |
| CR-L3-05 | S3 | 修正 | 02_cases.csv L-18・L-20・L-27 を書き直し (単体テストで分岐到達を固定・列が空の行も対象)。L-31 (バックフィル migration) を追加 |
| CR-L3-06 | S4 | 一部採用 | FAQ「アルコってなに?」に。サポート画面の「© 2026 Arcoda」は著作権表示のブランド名として据え置き |
| CR-L3-07 | S4 | 記録のみ | 先生機能は未公開 (TEACHER_FEATURE_ENABLED=false)。公開時に getGradingQuota の先生ロール除外を見直す。project_teacher_embed_email_pending_tests に記録 |

## 2. ラウンド 2 の開き残り

| ID | 状態 |
|---|---|
| CR-L2-03 | CR-L3-01 の修正で分岐に到達するようになった。失敗時の中断はそのまま |
| CR-L2-05 | 7 か所目 (結果カード) も条件つきに (CR-L3-02)。円額の据え置きは判断済み |
| CR-L2-09 | LP の名称・運営者名は Tetsuo 判断のまま |
| CR-L2-10 | 提供元の導出を列に依存しない形にしたので、メール/Google だけの Stripe 契約者にも「退会と同時に解約」の注記が出る |
| CR-L2-14 | listing §4 に Stripe env の行あり。PlanCard の並べ替えで apple モードでも Customer Portal に届く |

## 3. 確認
- tsc: エラーなし。
- eslint: 変更行にエラーなし。ArcoResultOverlay.tsx の「Cannot access refs during render」2 件は 111 行目 (ドラッグハンドルの ref) の既存エラーで、今回の変更 (265 行目の文言) とは無関係 (git diff で確認)。
- vitest: billingProviderOf 10 件・stripe 12 件 green (webhook 自体のテストファイルは無い・CR-L4-04 で訂正。件数は R5 で実測に修正)。
- 未実施 (人にしか確かめられない): 実 Stripe での退会時解約、本番へのバックフィル migration の適用。

## 4. Tetsuo の決定 (2026-09-13)
- 特商法の電話番号は省略規定を使う (Tetsuo「電話番号は省略規定とする」)。TokushohoContent の連絡先を「ご請求があった場合に遅滞なく電子メールにてお知らせします。ご請求は上記メールアドレスまたはお問い合わせフォームへ」に差し替え、【電話番号】の空欄を削除。根拠: 特定商取引法施行規則の表示事項の省略 (請求により遅滞なく提供する旨の表示)。判断待ち 2 は解消。
