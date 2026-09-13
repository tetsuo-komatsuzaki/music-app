# 法務文面 ラウンド 4 修正記録

日付: 2026-09-13。対象: 03_round-4-critic.md (条件つき合格・S3 6・S4 3) と、Tetsuo の決定 (電話番号は省略規定)。

## 1. 指摘への対応

| ID | 重大度 | 対応 | どこを直したか |
|---|---|---|---|
| CR-L4-01 | S3 | 修正 | (a) app/start/page.tsx: ログイン済みで契約が生きている人 (resolveEffectivePlan が free 以外・Web の Stripe 契約者を含む) は /start を開いてもホームへ redirect。購入・復元から戻る途中 (step あり) は通す。(b) 退会時の Stripe 解約は DB の planStatus ではなく Stripe に retrieve して status が trialing/active/past_due なら cancel。shouldCancelStripeOnDeletion は「加入歴があれば確認する」に変更 (Apple に上書きされた人も対象)。isStripeLiveStatus を追加。テスト更新 |
| CR-L4-02 | S3 | 修正 | app/api/stripe/webhook/route.ts applySubscription: 対象ユーザーの billingProvider が apple なら Stripe のイベントを書かずログだけ残す |
| CR-L4-03 | S3 | 修正 | LibraryClient.tsx の「最初の 2 週間は無料」→「はじめての方は最初の 2 週間は無料」(8 か所目)。listing §4 の数を「5 か所 + FAQ、無料の文は 8 か所」に訂正 |
| CR-L4-04 | S3 | 修正 | 99_report.md を v3 に更新。04_round-3-fix.md の「webhook 2 件 green」を「webhook のテストファイルは無い」に訂正 |
| CR-L4-05 | S3 | 修正 | PlanCard.tsx: provider が stripe のときは「変更・解約は契約の管理ページで行います。退会すると、この契約は同時に解約されます」、それ以外で Web の Apple なら従来の注記 |
| CR-L4-06 | S4 | 修正 | memory project_teacher_embed_email_pending_tests.md に CR-L3-07 (先生ロールの needsSubscription) を記録 |
| CR-L4-07 | S3 | 実機確認へ | SCR-11d のリンクは target=_blank のまま。殻で同じ WebView に読み込まれるかは実機でしか分からないので memory project_billing_verify_manual_pending.md の 10 番に追加。消えるなら Capacitor Browser に変える |
| CR-L4-08 | S4 | 修正 | cron guest-cleanup: Auth を先に消し (not found は続行)、その後 DB を消す。Auth の失敗で匿名ユーザーが永久に残らない |
| CR-L4-09 | S4 | 修正 | billingNoteProvider を追加: 退会モーダルの注記は Stripe の契約が生きている人だけ "stripe"。profile/page.tsx はこれを渡す。設定の「契約を管理」は R5 で見直し (PlanCard は契約中しか manage を出していなかった・CR-L5-06) |

## 2. Tetsuo の決定
- 特商法の電話番号は省略規定 (TokushohoContent: 「ご請求があった場合に、遅滞なく電子メールにてお知らせします」)。批評家は妥当と判定 (V4-15)。

## 3. 確認
- tsc: エラーなし。eslint: 変更ファイルにエラーなし (PlanCard の planStatus 未使用は既存の警告)。
- vitest: billingProviderOf 10 件・stripe 12 件・plan 17 件・planGrant 6 件 green (R5 で実測に修正)。
- dev (apple モード・ENABLE_ACCOUNT_DELETION=true) で修正画面を撮影: docs/verify/legal/evidence/screens/ (ページ「法務対応の修正画面」)。
- 未実施: 実 Stripe での retrieve → cancel、Web 契約者が /start を開いたときの redirect の画面 (コードで確認)。
