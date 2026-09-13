# App Store 製品ページ文・審査メモ (案・2026-09-13)

【 】は Tetsuo が決める。要件整理 v2.8 §5-8・§10-4。「無料」という語は、無料期間の条件つき一文以外で使わない。

## 1. 製品ページ

### アプリ名 (30 文字以内)
アルコ・バイオリン練習の採点

### サブタイトル (30 文字以内)
弾くたびに音程とリズムを採点

### プロモーションテキスト (170 文字以内・審査なしで差し替え可)
録音するだけで、音程とリズムを 1 音ずつ採点。先生がいなくても、弾くたびに何が良くなったかが残ります。登録なしで 1 回ためせます。

### 説明 (4,000 文字以内)
アルコは、バイオリンの練習を録音すると、音程とリズムをその場で採点するアプリです。

■ できること
・録音して採点。音程とリズムを 1 音ずつ見て、どこがずれたかを譜面の上に示します
・毎日の基礎練。苦手に合わせて、音階・アルペジオ・エチュードを毎日 4 枚組みます
・成長カルテ。回数ではなく変化が主役。弾くたびに何が良くなったかが残ります
・自分の楽譜の取り込み。取り込んだ曲もそのまま採点できます

■ 登録の前に 1 回ためせます
アカウントを作らずに、公式の曲を 1 回だけ録音して採点を受けられます。点数を見てから、続けるかを決められます。

■ アルコプラス (自動更新のサブスクリプション)
続けるには、アルコプラスの契約が必要です。
・月額プラン 1,280 円 / 1 か月
・年額プラン 12,800 円 / 1 年 (月あたり約 1,067 円)
はじめての方は最初の 2 週間は無料です。無料期間中は 1 日 8 回・合計 10 分まで採点でき、楽譜の取り込みは請求の開始後から使えます。その後は選んだプランの料金が Apple ID に請求されます。契約期間の終了の 24 時間前までに解約しない限り自動で更新されます。解約は iPhone の設定のサブスクリプションからいつでもできます。

■ こんな方に
・先生のレッスンの間、自分の練習を確かめたい
・独学で、何を直せばよいか分からない
・子どもの練習を、親が横で見なくても続けさせたい

利用規約: https://arcodaviolin.com/terms
プライバシーポリシー: https://arcodaviolin.com/privacy
特定商取引法に基づく表記: https://arcodaviolin.com/tokushoho

### キーワード (100 文字以内)
バイオリン,ヴァイオリン,練習,採点,音程,リズム,楽譜,基礎練,音階,エチュード,上達,独学

### サポート URL
https://arcodaviolin.com/support/help (app/support/help/page.tsx がゲスト閲覧の /guest/support/help へ redirect する。ログインなしで開き、規約・ポリシー・特商法・お問い合わせにも辿れる)

### マーケティング URL
https://arcodaviolin.com/lp/

### プライバシーポリシー URL
https://arcodaviolin.com/privacy

### 利用規約 (EULA)
App Store Connect の EULA 欄は空欄にして Apple の標準 EULA (Licensed Application End User License Agreement) を適用する。自社の利用規約 (https://arcodaviolin.com/terms) は「サービスの利用条件」として製品ページの説明文とアプリ内 (/start の下段・サポート) からリンクする。
理由: カスタム EULA を提出すると Apple の最低条項 10 項目をすべて含める義務が生じ、親が読む文書として重くなる。規約第21条で標準 EULA を補う関係を明記した。

### カテゴリ
主: ミュージック / 副: 教育

### 年齢制限指定
4+ (暴力・性的表現・ギャンブル・医療なし。子どもが使うが、購入は保護者の Apple ID の管理下)

### App プライバシー (App Store Connect の申告)
- 連絡先情報: メールアドレス・氏名 → アカウント作成に使用・ユーザーに紐づく
- ユーザーコンテンツ: 音声データ (録音)・その他 (楽譜) → アプリの機能に使用・ユーザーに紐づく
- 識別子: ユーザー ID・端末 ID (identifierForVendor・1 回ためしの回数のためだけ) → アプリの機能・ユーザーに紐づく
- 購入: 購入履歴 (App Store の取引識別子と契約状態) → アプリの機能・ユーザーに紐づく
- 使用状況データ: 製品の操作 (登録の入口の記録) → 分析・ユーザーに紐づかない
- 追跡 (トラッキング): なし

## 2. サブスクリプションの商品情報 (App Store Connect)

| 項目 | 年額 | 月額 |
|---|---|---|
| 製品 ID | com.arcodaviolin.app.plus.yearly | com.arcodaviolin.app.plus.monthly |
| 参照名 | Arco Plus Yearly | Arco Plus Monthly |
| 表示名 (日本語) | アルコプラス 年額 | アルコプラス 月額 |
| 説明 (日本語・45 文字以内) | 録音して採点、毎日の基礎練、楽譜の取り込み | 録音して採点、毎日の基礎練、楽譜の取り込み |
| 期間 | 1 年 | 1 か月 |
| 価格 | ¥12,800 の価格ポイント | ¥1,280 の価格ポイント |
| グループ内のレベル | 1 | 2 |
| 導入オファー | 無料トライアル 2 週間・新規の契約者のみ | 同左 |
| 審査用スクリーンショット | 「アルコプラスをはじめる」画面 (evidence/screens/apple_free_start.png と同じ状態) を 3 倍で書き出す 1206 × 2622。App Store Connect の最小 640 × 920 を満たすこと | 同左 |

グループ「アルコプラス」: 請求猶予期間オフ・ファミリー共有オフ・配信地域は日本のみ。

## 3. 審査メモ (App Review Information)

### 連絡先
【氏名】 / 【電話番号】 / 【連絡先メールアドレス】

### デモアカウント
- 審査用アカウントの「契約済み」は、そのアカウントで Sandbox の購入を実際に完了させて作る (planGrant=internal では PlanCard が「運営」表示になり「契約を管理」が出ない。加えて契約中扱いなので /start に入れず購入の流れを見せられない)。
- 新規の登録は Sign in with Apple のみ。既存アカウントは /login のメール・パスワードのフォームでもサインインできる (殻でもフォームは出る。Google ボタンだけ殻では出さない)。デモアカウント: メール 【審査用メールアドレス】 / パスワード 【審査用パスワード】 (契約済みの状態) をこのフォームで使う。

### メモ (英語)
Arcoda is a violin practice app that records the user's playing and scores pitch and rhythm note by note.

How to reach the subscription screen:
1. Launch the app. The guest home appears. Tap "登録なしで 1 回ためす" (try once without signing up), pick any song, and record a few seconds. You will see a score card. This one-time trial is limited to one per device.
2. Tap "この N 点を残してつづける" on the score card, or "はじめる" on any gate. The screen "アルコプラスをはじめる" (Start Arco Plus) appears with the two plans (yearly is selected by default), the features, and the CTA. Prices, periods and the introductory offer eligibility are read from StoreKit; nothing is hard-coded.
3. Tap the CTA. Sign in with Apple is requested first (we link the anonymous trial account to the Apple identity so the trial recording is kept), then the StoreKit purchase sheet appears.
4. After the purchase the onboarding questions appear (only for subscribers), then the home screen.

Restore purchases: "購入を復元" at the bottom of the same screen.
Manage or cancel: Settings → プラン → "契約を管理" opens the App Store subscription management sheet.
Account deletion: tap the avatar (account menu) → プロフィール → 退会 (in-app, Guideline 5.1.1(v)). We revoke the Sign in with Apple token on deletion.
Terms of Use and Privacy Policy links are at the bottom of the subscription screen and in the App Store metadata.

Arcoda uses native iOS capabilities: audio recording through a native plugin (ArcodaRecorder, AVAudioSession, measurement mode), StoreKit 2 purchases and restore through a native plugin (ArcodaStore), Sign in with Apple, and identifierForVendor for the one-time trial. The UI layer is rendered in a web view backed by our servers, and scoring is computed server-side. Server-side we verify App Store Server Notifications V2 signatures against the Apple Root CA G3.

Sign-in: on iPhone, new users sign in with Apple only. Existing accounts can also sign in with email and password on the /login screen; the demo account below uses this path. (On the web, existing accounts can also use Google.)

Sandbox: the demo account above already has an active subscription (created by completing a real Sandbox purchase on that account, not by an internal grant, so that the plan card shows 契約中 and the 契約を管理 button). To test a fresh purchase, use a Sandbox tester with a new Apple ID; the 2-week free trial is offered once per Apple ID.

### 添付
- 「アルコプラスをはじめる」画面のスクリーンショット (1206 × 2622。evidence/screens/apple_free_start.png の 3 倍書き出し)
- 設定のプランカード (契約中) のスクリーンショット

## 4. ローンチ前チェック (法務文面と実装をそろえるための確認)
- NEXT_PUBLIC_BILLING_MODE=apple を入れると plan.ts の REQUIRE_SUBSCRIPTION が自動で true になり、契約なし・契約切れのアカウントは録音できなくなる (規約 第5条・第5条の4 が事実になる)。**その前に** 開発・検証用アカウントへ planGrant=internal を付ける (REQ-018)。
- migration 20260913120000_stripe_billing_provider_backfill を本番に手動で適用する (Stripe 契約者の billingProvider を 'stripe' に)。
- Web の Stripe 契約者が残る間は STRIPE_SECRET_KEY 等の env と /api/stripe/portal を残す (消すと設定の「契約を管理」が動かず、特商法・規約 第5条の5 が事実でなくなる)。
- listing の 5 つの URL (terms / privacy / tokushoho / support/help / lp) を本番で curl して 200 を確認する。
- 本番 env: ENABLE_ACCOUNT_DELETION=true、APPLE_TEAM_ID / APPLE_KEY_ID / APPLE_PRIVATE_KEY / APPLE_SERVICES_ID (退会時のトークン失効)、CRON_SECRET (ゲスト削除と通知原文の削除)。無いと規約第13条・ポリシー第6条が事実でなくなる。
- App Store Connect の日本の価格ポイントに ¥1,280 と ¥12,800 があることを確認してから、3 文書の円額を確定する。円額はアプリ内の 6 か所 (gateText ×3・Recorder・ホームの帯・PlanCard) とヘルプ FAQ・規約・特商法に書いてあり、「最初の 2 週間は無料」の文は結果カードと LibraryClient を含めて 8 か所にあるので、価格ポイントや無料期間が変われば grep して一括で直す。
- 委託先の契約主体と所在国を確認 (Supabase のリージョン、Google Cloud の契約主体、日本向け App Store の販売主体 iTunes K.K.)。ポリシー第8条・第9条の国名を合わせる。
- 【 】をすべて埋める: 事業者名・代表者・運営責任者・住所・連絡先メール・電話・施行日・管轄裁判所・iOS 対応バージョン・審査用アカウント。
- お便りメールの配信を始める前に: 送信者名・住所・解除方法を各メールに載せる (特定電子メール法第4条)。設定の「お知らせメール」スイッチは実装済み。

## 5. 「無料」の語の使い方 (社内規則)
- 使ってよい: 「最初の 2 週間は無料」「無料期間」「無料トライアル」(条件つきの一文の中だけ)
- 使わない: 「無料で登録」「無料プラン」「無料ではじめる」「無料アプリ」
