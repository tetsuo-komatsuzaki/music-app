# 法務文面 ラウンド 5 修正記録

日付: 2026-09-13。対象: 03_round-5-critic.md (条件つき合格・S3 6・S4 5)。

## 1. 指摘への対応

| ID | 重大度 | 対応 | どこを直したか |
|---|---|---|---|
| CR-L5-01 | S3 | 修正 | billingProviderOf.ts に `isStripeTerminalStatus` (canceled / incomplete_expired) を追加し、退会時は終端以外をすべて解約する。unpaid は請求書が生成され続けるため残さない。テスト 2 本追加 |
| CR-L5-02 | S3 | 修正 (案 a) | requestAccountDeletion.ts: Auth 削除の前は retrieve だけ (Stripe に届かない・状態が読めないなら退会を中断)。取り消せない cancel は Auth 削除が成功した後に移した。そこで失敗しても退会は止めず、`stripe_cancel_after_auth_failed` を error ログに出し、完了メールに「Web でご契約のアルコプラスの解約処理に失敗しました。お問い合わせ先までご連絡ください」を足す |
| CR-L5-03 | S3 | 修正 | テスト件数を実測に直した。billingProviderOf 10・stripe 12・plan 17・planGrant 6。全体は 653 件 green (5 ファイルは @testing-library 未導入で以前から失敗) |
| CR-L5-04 | S3 | 修正 | listing §4 を「アプリ内の 6 か所とヘルプ FAQ・規約・特商法。『最初の 2 週間は無料』は 8 か所。grep して一括で直す」に |
| CR-L5-05 | S3 | 修正 | 02_cases.csv に L-32〜L-35 を追加 (/start の契約中ガード・「はじめての方は」8 か所・Stripe 契約者の PlanCard 文言・退会時の Stripe 解約の順序と対象) |
| CR-L5-06 | S3 | 修正 (実装も) | PlanCard: provider が stripe なら、unpaid / incomplete は「お支払いに問題があります」+ 契約を管理、契約切れ (expired / canceled) も契約を管理を出す。注記を「お支払い方法の変更・解約・請求書の確認は契約の管理ページで」に。billingProviderOf のコメントも事実に合わせた |
| CR-L5-07 | S4 | 採用 | webhook の予備経路 (dbUserIdHint) の updateMany にも `NOT: { billingProvider: "apple" }` |
| CR-L5-08 | S4 | 採用 | /start の step 免除を廃止。契約が付いていれば step 付きでもホームへ |
| CR-L5-09 | S4 | 採用 | 退会モーダルの `provider == null && hasApple` フォールバックを廃止。注記は契約の提供元だけで出す |
| CR-L5-10 | S4 | 採用 | listing の審査メモに「planGrant=internal は契約中扱いで /start に入れない」を追記 |
| CR-L5-11 | S4 | 対応なし (理由記録) | 特商法の「フォームから請求」は送信にログインが要るが、同じ文にメールアドレスの経路を併記しており、法 11 条ただし書の「請求により遅滞なく提供する」は満たす |

## 2. 確認
- tsc: エラーなし。eslint: 変更ファイルにエラーなし (PlanCard の planStatus 未使用は既存の警告)。
- vitest: 653 件 green。内訳の実測は上表のとおり。
- 退会の順序 (最終形): 本人確認 → Stripe の retrieve (届かなければ中断) → deletedAt → Auth 削除 (失敗なら deletedAt を戻して中断) → Stripe の cancel (失敗はメールで通知) → Apple トークン失効 → Storage 削除 → DB 削除 → 完了メール。
- 未実施 (人にしか確かめられない): 実 Stripe での retrieve → cancel、unpaid の契約での挙動、Stripe ダッシュボードの「支払い失敗時の設定」の確認。
