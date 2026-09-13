# 検証計画: 登録と課金 (Apple アプリ内課金)

## 1. 環境

- コード: main f12bdfb3 (本番に配信済み。本番は NEXT_PUBLIC_BILLING_MODE 未設定 = stripe モードのまま)
- 立ち上げ: `NEXT_PUBLIC_BILLING_MODE=apple npx next dev -p 3101` と `npx next dev -p 3102` (stripe モード) の 2 本。フラグの全値 (apple / 未設定) を通す
- 殻の模擬: playwright の addInitScript で window.Capacitor を注入 (isNativePlatform true・isPluginAvailable("ArcodaStore")・nativePromise が getProducts / purchase / restore / deviceKey を返す)。返す値を差し替えて I 軸 (外部の失敗) を作る
- DB: 本番 (DATABASE_URL は .env)。読み取りは自由。書き込みは検証用ユーザー (name に `verify-billing-` を付ける) だけに限り、最後に消す
- Supabase Auth: 匿名サインインと Apple プロバイダは未設定 (Tetsuo 側のペンディング)。匿名セッションは、検証ゲストの `auth.users.is_anonymous` を DATABASE_URL 経由で true にし、メール+パスワードでログインして作る (scripts/_tmp_verify_anon.ts。ラウンド 1 CR-1-08 で admin 作成ユーザーの代用が無効と分かり、この方法に変えた。`user.is_anonymous` が true になることを確認済み)。代用できないもの (Apple OAuth・StoreKit の本物のシート・署名が本物の JWS) は「人へ」
- REQUIRE_SUBSCRIPTION は env ではなく app/_libs/plan.ts:64 のコンパイル時定数 (CR-1-20)。契約なし・契約切れの制御 (REQ-013・B 軸の該当行・CR-1-03/10) は、この定数を一時的に true に書き換えて dev を再読込し、撮影と quota の記録を取ったあと false に戻す。書き換えた差分はコミットしない (scripts/_tmp_verify_require.mjs が書き換え → 撮影 → 復元を 1 本で行い、復元後の `git diff app/_libs/plan.ts` を証跡に残す)
- 環境変数: CRON_SECRET はローカルの .env.local に検証値を入れて dev を立てる

## 2. 検証用データ

| 名前 | 作り方 | 状態 | 消し方 |
|---|---|---|---|
| verify-billing-guest | supabaseAdmin.auth.admin.createUser(is_anonymous 相当は API で作れないため email 無しのユーザー) + prisma.user.create role=guest, guestDeviceKey=VERIFY-DEV-1, guestExpiresAt=昨日 | ゲスト・未使用 → Performance を 1 件入れて使用済み → Cron の削除対象 | Cron が消す。残れば admin.deleteUser + prisma.user.delete |
| verify-billing-free | createUser + prisma role=student plan=free | 契約なしアカウント | 最後に削除 |
| verify-billing-trial | plan=plus planStatus=trialing periodEnd=+12 日 billingProvider=apple appleOriginalTransactionId=VERIFY-OTX-1 | 無料期間中 | 同上 |
| verify-billing-active | plan=plus active periodEnd=+44 日 appleAutoRenew=true | 契約中 | 同上 |
| verify-billing-cancel | 同上 appleAutoRenew=false | 更新しない予定 | 同上 |
| verify-billing-expired | plan=plus planStatus=expired periodEnd=-3 日 billingProvider=apple (applyTransaction が書く形・CR-1-20) | 契約切れ | 同上 |
| verify-billing-internal | plan=free planGrant=internal | 運営 | 同上 |
| verify-billing-other | 別人。appleOriginalTransactionId=VERIFY-OTX-CONFLICT | 復元の衝突相手 | 同上 |

本番 DB に検証行を作るのは §1 の規則 6 に照らして許容範囲 (自分のデータ・最後に消す)。作成と削除は scripts/_tmp_verify_seed.ts / _tmp_verify_teardown.ts で行い、実行ログを証跡にする。

## 3. 確認手段の段

| 手段 | どこで使うか |
|---|---|
| `npx tsc --noEmit` | 全体 (回帰) |
| `npm run lint` | 差分ファイル |
| `npm test` (vitest) | plan.ts 純関数 (resolveEffectivePlan・planGrant)、derivePlanStatus、isKnownProduct、canShowBillingEntryPoint、gateText、perMonth。新規テストを足す |
| `*.dom.test.tsx` | @testing-library/react が未導入で既存 5 ファイルが落ちている (段0 で確認)。導入は範囲外 → 画面の描画は playwright で代替 |
| next dev + playwright | ゲストホーム・ライブラリ・ゲート・/start・/login・/signUp・設定・オンボの描画と操作、殻/Web の両方、コンソール警告の収集 (hydration 0 件が条件) |
| /dev ハーネス | PlanCard 7 状態・GateSheet 2 種・結果カード・退会モーダル・SCR-02b/11d。撮影後に削除 (コミットしない) |
| `npm run build` | 回帰 (済: 2026-09-13 成功。再実行する) |
| `npx tsx scripts/` | DB の実地確認 (段0 済)、検証ユーザーの作成と削除、applyTransaction の分岐を DB で回す |
| curl | /api/apple/notifications (壊れた JSON・signedPayload 無し・x5c 無し・自前 CA・UUID 重複)、/api/apple/verify (未認証・jws 無し)、/api/apple/restore (未認証・空配列)、/api/cron/guest-cleanup (Bearer 無し・違う・一致)、/api/plan/usage |
| 表示の崩れ | 幅 320 / 402 / 430 / 768、文字最大 (html font-size 200%)、明暗 |

## 4. 網羅の設計 (軸と数)

| 軸 | 具体値の数え上げ | 件数 |
|---|---|---|
| A 正常系 | 要件 62 本 × 1 | 62 |
| B 状態 × 画面 | 状態 8 (ゲスト未使用・ゲスト使用済・契約なしアカウント・無料期間中・契約中・更新しない予定・契約切れ／返金・運営) × 画面 10 (ホーム／ゲストホーム・ライブラリ・曲詳細のゲート・録音画面・採点結果・設定のプランカード・/start・/login・基礎練・カルテ) | 80 |
| B' 遷移の辺 | 状態機械の辺 9 (ためす・Apple で続ける・購入確定・初回請求・更新・失敗・期限・返金・自動更新オフ) + 通知の種類 8 | 17 |
| C 入力 | 入力欄 7 (ニックネーム・お便りメール・同意チェック・退会の確認語・端末キー・appAccountToken・プラン選択) × 観点 18 | 126 |
| C' 構造化入力 | API 本文 3 (signedPayload・verify の jws・restore の jws 配列) × 8 (無し・空・型違い・壊れた JWS・x5c 無し・自前 CA・巨大・重複) | 24 |
| D 遷移と中断 | 動線 5 (1 回ためす・はじめる→購入・購入を復元・オンボ 02b/11d・退会) × 中断 15 | 75 |
| E 権限と所有 | 役割 10 (未ログイン・ゲスト匿名・契約なし・無料期間中・契約中・期限切れ・返金後・管理者・先生・別人) × 資源 8 (他人の曲ページ・録音のアップロード・/api/apple/verify・/api/apple/restore・/api/cron/guest-cleanup・/api/plan/usage・/onboarding・退会) | 80 |
| F 同時と競合 | 10 | 10 |
| G 時間 | 12 | 12 |
| H データの形 | 14 | 14 |
| I 外部の失敗 | 外部 6 (StoreKit getProducts・StoreKit purchase・StoreKit restore・Supabase 匿名サインイン・Apple OAuth・自サーバー /api/apple/verify) × 結果 7 (正常・4xx・5xx・タイムアウト・不正な本文・遅延・部分成功) | 42 |
| J 回帰 | 変更した共有部品の利用箇所 (grep 実測): canShowBillingEntryPoint 2・useCanShowBillingEntryPoint 4・GateSheet 4・GATE_TEXT 16・getGradingQuota 3・resolveEffectivePlan 5・isNativeApp() 16・useIsNativeApp 8・isAppleBilling 15・appStoreUrl 4・getGuestTryState 6・ensureGuestUser 3・recordGuestEvent 13・quota 18・planGrant 10・needsSubscription 11・isGuest 8・guestTrial 4・role guest 3・requestAccountDeletion 2・SCR11D 5・SCR02B 3 | 163 |
| K 端末と表示 | 画面 8 × (幅 3 + 文字最大 + 明暗) 5 | 40 |
| L 使いやすさ | 画面 8 × 観点 5 | 40 |
| M 安全 | 14 | 14 |
| N 通しの歩き | ペルソナ 4 × 動線 2 | 8 |
| 合計 | | 807 |

## 5. 自動で確かめられない残件と、代わりの手段

| 残件 | なぜ無理か | 代わり | 人に頼むこと |
|---|---|---|---|
| Sign in with Apple の本物の OAuth | Supabase の Apple プロバイダ未設定・Apple 側の Services ID 未作成 | /auth/callback のロジックを読解し、Supabase の user オブジェクトを模した単体で分岐を確認 | Sandbox で 1 回通す (手順は 99_report に書く) |
| StoreKit の購入シート・復元・導入オファー判定 | 殻のプラグインが未ビルド、App Store Connect に商品なし | 偽ブリッジで JS 側の全分岐 (ok/cancel/pending/error/none/conflict) を通す | Sandbox テスターで購入 → 通知 → 復元 → 返金 |
| Apple 署名の本物の JWS | Apple の秘密鍵は持てない | 検証の失敗経路を全部通す。成功経路は derivePlanStatus と applyTransaction を単体で通す | Sandbox の通知を 1 通受けて AppleNotification に行が立つのを見る |
| 匿名サインイン | Supabase で未有効化 | admin API で作った検証ユーザーの cookie で代用 | 有効化後に「登録なしで 1 回ためす」を実機で 1 回 |
| iOS の実機表示 (セーフエリア・管理シート) | 実機なし | 幅と文字サイズの playwright 撮影で代替 | 実機で /start と設定のプランカードを開く |
