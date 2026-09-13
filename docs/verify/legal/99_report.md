# 課金の法務文面 ― 検証報告 (v4・2026-09-13)

## 結論
- 4 文書 (利用規約・プライバシーポリシー・特定商取引法に基づく表記・App Store 製品ページ文) を作成し、批評 5 ラウンドの指摘 77 件 (R1 34・R2 16・R3 7・R4 9・R5 11) をすべて処理した。R4・R5 とも条件つき合格 (S1・S2 ゼロ)。
- 【 】の空欄 (事業者名・代表者・運営責任者・住所・連絡先メール・施行日・管轄裁判所・iOS 対応バージョン・審査用アカウント。App Review 用の連絡先電話は別) が残る間は本番に出さない (コミットはしたが deploy しない)。
- Tetsuo の決定 (2026-09-13): 特商法の電話番号は省略規定。反映済み。

## 実装で足したもの (法務文面を事実にするため)
| 何を | どこ |
|---|---|
| 設定「お知らせメール」スイッチ (停止・再開) | SettingsClient.tsx・settings/page.tsx・updateNotificationPref.ts setMarketingOff |
| 退会時に Web (Stripe) の契約を Stripe に確認 (届かなければ中断)・Auth 削除の後に解約・終端以外はすべて解約 | requestAccountDeletion.ts・_libs/billingProviderOf.ts |
| Stripe 契約者の提供元: webhook が billingProvider=stripe を書く + 既存行のバックフィル migration + 列が空でも加入歴から判定 | _libs/stripe.ts・prisma/migrations/20260913120000_stripe_billing_provider_backfill・_libs/billingProviderOf.ts |
| Apple に移った人に Stripe のイベントを書かない | api/stripe/webhook/route.ts |
| 契約中の人は /start に入れない (二重契約の防止) | start/page.tsx |
| Apple トークン失効を Auth 削除の後に | requestAccountDeletion.ts |
| 退会完了メールに Apple 契約者向けの解約案内・件名をアルコに | requestAccountDeletion.ts |
| 退会モーダルの注記を契約の提供元 (生きている契約) で出し分け | DeleteAccountModal.tsx・profile/AccountInfo.tsx・profile/page.tsx |
| 「契約を管理」は Stripe 契約者なら apple モードでも Customer Portal。契約が止まっている人 (unpaid・incomplete・契約切れ) にも出す | settings/PlanCard.tsx |
| Apple 通知原文を 7 年で削除・ゲスト削除は Auth → DB の順 | api/cron/guest-cleanup/route.ts |
| REQUIRE_SUBSCRIPTION を apple モードに連動 | _libs/plan.ts |
| サポート一覧に特商法・/[userId]/support/tokushoho・/tokushoho | support/page.tsx・support/tokushoho/page.tsx・app/tokushoho/page.tsx |
| /support と /support/help をゲスト閲覧へ redirect (App Store のサポート URL) | app/support/page.tsx・app/support/help/page.tsx |
| ログイン画面の同意の一文 | login/page.tsx |
| ヘルプ FAQ 4 件と退会 FAQ の追記・名称をアルコに | support/help/page.tsx |
| 「最初の 2 週間は無料」に「はじめての方は」(8 か所) | gateText.ts・Recorder.tsx・home.tsx・PlanCard.tsx・ArcoResultOverlay.tsx・LibraryClient.tsx |
| SCR-11d の同意文にポリシーへのリンク | onboarding/onboardingClient.tsx |
| LP フッターに規約・ポリシー・特商法のリンク | public/lp/index.html |

## 検証の結果
| 確認 | 結果 |
|---|---|
| tsc --noEmit | エラーなし |
| eslint (変更ファイル) | エラーなし。既存の警告 (settings/page.tsx authUser・SettingsClient _userId・PlanCard planStatus・ArcoResultOverlay の ref) は変更行と無関係 |
| vitest | 653 件 green (billingProviderOf 10・stripe 12・plan 17・planGrant 6)・5 ファイルは @testing-library 未導入で以前から失敗 |
| dev 3101 (apple モード) curl | /terms /privacy /tokushoho /login /guest /guest/support/* /start → 200。/support → 307 /guest/support。/support/help → 307 /guest/support/help → 200 |
| 設定のスイッチ | オン→オフで marketingOptOutAt が入る。再読み込み後もオフ。オフ→オンで optOutAt が null・optInAt 更新 |
| 修正画面の撮影 (検証ユーザー 5 人・削除済み) | docs/verify/legal/evidence/screens/ 18 枚。ページ「法務対応の修正画面」 |
| 台帳 02_cases.csv | L-01〜L-35 すべて記入 |

## 人にしか確かめられないもの (memory project_billing_verify_manual_pending 10〜12)
- 実 Stripe での退会時解約 (retrieve → cancel)、unpaid の契約での挙動、Stripe ダッシュボードの「支払い失敗時の設定」の確認
- 退会完了メールの実送
- 殻での SCR-11d のプライバシーポリシーリンクの挙動 (同じ WebView で開いて回答が消えないか)
- 本番へのバックフィル migration の適用と、listing の 5 URL の 200 確認 (デプロイ後)

## Tetsuo の判断が要るもの
1. 無料期間中の上限を文面に書いた (実装が正)。無制限にするなら実装を変える。
2. 委託先の契約主体と国名 (Supabase リージョン・Google Cloud 契約主体・日本向け App Store の販売主体)。
3. LP の名称「アルコーダ」と運営者名の公開を本体文書と揃えるか (事業者名の決定と同時に)。
4. Apple 通知原文の保管年数 7 年 (仮)。
5. 【 】を埋める。
6. REQUIRE_SUBSCRIPTION を apple モードに連動させた (ローンチの env 切替で自動 true)。切替前に planGrant=internal を付ける手順は listing §4。
7. 先生ロールは apple モードで採点が止まる (先生機能の公開時に扱いを決める)。
8. 記録ページ: 修正画面 https://claude.ai/code/artifact/672492f3-3be2-4806-8e76-d3a4cdfd56d3

## 記録
- docs/verify/legal/00_requirements.md・01_plan.md・02_cases.csv・03_round-1〜5-critic.md・04_round-1〜5-fix.md
- 文面と批評の記録ページ: https://claude.ai/code/artifact/4d55d34e-168f-4fcc-a2f5-e482b899bc0b
