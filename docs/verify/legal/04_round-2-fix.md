# 法務文面 ラウンド 2 修正記録

日付: 2026-09-13。対象: 03_round-2-critic.md (S2 3・S3 6・S4 7 = 16 件) と、ラウンド 1 の開き残り 3 件 + 一部 1 件。

## 1. 新規指摘への対応

| ID | 重大度 | 対応 | どこを直したか |
|---|---|---|---|
| CR-L2-01 | S2 | 修正 | app/support/page.tsx と app/support/help/page.tsx を新設し、ゲスト閲覧の /guest/support, /guest/support/help へ redirect。dev で /support/help → 307 → 200 を確認。listing のサポート URL は据え置き (実在するようになった) |
| CR-L2-02 | S2 | 修正 (案 3) | plan.ts の REQUIRE_SUBSCRIPTION を `isAppleBilling()` に連動。apple モード (ローンチの env 切替) で自動 true、Stripe モードは従来どおり false。listing §4 ローンチ前チェックに「先に開発・検証用アカウントへ planGrant=internal」を明記。01_plan.md の突き合わせ表にも行を追加。単体テスト 643 件 green (vitest は env 未設定 = false で走る) |
| CR-L2-03 | S2 | 修正 | requestAccountDeletion.ts: Stripe の解約に失敗したら退会を中断し「契約の解約に失敗しました。時間をおいて再試行するか、先に『契約を管理』から解約してください」を返す。Stripe が resource_missing または already canceled を返したときだけ続行 |
| CR-L2-04 | S3 | 修正 | 規約 第13条・ポリシー 第12条・ヘルプ FAQ・listing 審査メモを「プロフィール画面から退会」「プロフィールで表示名・メール・パスワード、設定でお知らせメール」に |
| CR-L2-05 | S3 | 一部修正 | 6 か所の文頭に「はじめての方は」を付けて条件つきに。円額はそのまま (Tetsuo 決定の 月 1,280・年 12,800 を規約・特商法と揃えるため)。listing §4 に「価格ポイントが違えば 6 か所 + FAQ を一括で直す」を追加。StoreKit の値を渡す改修はしない (ゲート・ホーム帯・Recorder はサーバー描画で StoreKit を持たない) |
| CR-L2-06 | S3 | 修正 | FAQ 料金の文から括弧を除去、「はじめての方は」を付け、Web の Stripe 契約者の行を追加 |
| CR-L2-07 | S3 | 修正 | 02_cases.csv の結果列を全行記入、L-25〜L-30 の 6 行を追加。99_report.md を作成 (curl の status・tsc・eslint・vitest の結果) |
| CR-L2-08 | S3 | 修正 | listing §3 添付を 1206 × 2622 に統一 |
| CR-L2-09 | S3 | 一部修正 | LP のフッターに /terms・/privacy・/tokushoho のリンクを追加。名称「アルコーダ」と運営者名の扱いは Tetsuo 判断のまま (事業者名の決定と同時に揃える。project_lp_waitlist_pending に記録) |
| CR-L2-10 | S4 | 採用 | DeleteAccountModal に provider を渡し、apple / stripe / null で注記を出し分け。profile/page.tsx が billingProvider を select し AccountInfo 経由で渡す。provider 不明のときだけ従来の hasApple にフォールバック |
| CR-L2-11 | S4 | 採用 | Apple トークンの失効を Auth 削除の成功後に移動 (refresh token は DB 削除前に保持) |
| CR-L2-12 | S4 | 採用 | PlanCard「8 本」→「8 回」 |
| CR-L2-13 | S4 | 採用 | 規約 第17条 第1段落に「ただし、当社の責任の範囲は次項によります」。ポリシー 第15条を効力発生日の型に |
| CR-L2-14 | S4 | 採用 | listing §4 に STRIPE_* env と /api/stripe/portal を残す行 |
| CR-L2-15 | S4 | 採用 | SCR-11d: 「設定でいつでも止められる」+ プライバシーポリシーへのリンク (新しいタブ) |
| CR-L2-16 | S4 | 採用 | 退会完了メールの件名「アルコ 退会完了のお知らせ」、本文「アルコ (Arcoda) の退会処理が完了しました」 |

## 2. ラウンド 1 の開き残り

| ID | 状態 |
|---|---|
| CR-L1-15 | 見送りのまま (/start 注記は写経寸法。特商法リンクは注記直下) |
| CR-L1-18 | Tetsuo 確認待ち (委託先の契約主体と国名)。listing §4 に確認項目あり |
| CR-L1-22 | 4 文書は統一済み。退会メールを「アルコ (Arcoda)」に修正 (CR-L2-16)。LP の名称は Tetsuo 判断 (CR-L2-09) |
| CR-L1-23 | 修正 (CR-L2-08) |

## 3. 確認
- tsc: エラーなし。eslint: 変更ファイルにエラーなし (既存の未使用変数の警告のみ)。
- vitest: 643 件 green (5 ファイルは @testing-library 未導入で以前から失敗)。
- dev (apple モード): /support 307→/guest/support、/support/help 307→/guest/support/help 200、/guest・/guest/support/tokushoho・/start・/login 200。
- 未実施 (人にしか確かめられない): 実 Stripe での解約失敗の再現、退会完了メールの実送、退会モーダルの 3 通りの画面 (dev の ENABLE_ACCOUNT_DELETION 未設定)。
