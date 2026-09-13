# 法務文面 4 点 ラウンド 3 批評 (critic)

- 日付: 2026-09-13
- 対象: 03_round-2-critic.md の 16 件 + ラウンド 1 の開き残り 4 件 (CR-L1-15・18・22・23) に対する 04_round-2-fix.md の修正、02_cases.csv (L-01〜L-30)、99_report.md
- 自分の手で読んだもの: app/_libs/{plan,planConstants,billingMode,stripe}.ts、app/actions/requestAccountDeletion.ts、app/_libs/apple/{appleRevoke,appleServer}.ts、app/support/{page,help/page}.tsx、app/[userId]/settings/{page,SettingsClient,PlanCard,DeleteAccountModal}.tsx、app/[userId]/profile/{page,AccountInfo}.tsx、app/[userId]/support/{page,help/page,tokushoho/page}.tsx、app/{terms,privacy,tokushoho}/page.tsx、app/components/legal/{Terms,Privacy,Tokushoho}Content.tsx、docs/legal/app-store-listing.md、app/components/guest/gateText.ts、app/components/{Recorder,ArcoResultOverlay}.tsx (該当行)、app/[userId]/{page,home}.tsx (該当行)、app/login/page.tsx、app/signUp/page.tsx、app/auth/callback/route.ts、app/api/stripe/{checkout,portal,webhook}/route.ts、app/api/cron/guest-cleanup/route.ts、vercel.json、prisma/schema.prisma・migrations/20260912200000_apple_billing、app/onboarding/onboardingClient.tsx (Scr11D)、public/lp/index.html (フッター)、app/[userId]/components/AccountMenu.tsx (ゲスト側)、docs/verify/legal/{01_plan,02_cases.csv,99_report}、docs/verify/legal/evidence の一覧
- dev (http://localhost:3101・apple モード) で curl: /support → 307 /guest/support、/support/help → 307 /guest/support/help、/guest/support/help → 200、/terms /privacy /tokushoho → 200、/lp/ → 308 /lp。/support/contact → 404 (listing に載せていないので指摘しない)
- 外部: docs.stripe.com/api/subscriptions/cancel を取得 (解約済みを再度 cancel したときのエラーは記載なし)
- 【 】の空欄そのものは指摘しない。本番 DB は読み書きしていない。

## 0. 総評

ラウンド 2 の 16 件のうち、文面の修正 (CR-L2-04・06・08・12・13・14 の文・15・16) と到達経路 (CR-L2-01) と REQUIRE_SUBSCRIPTION の連動 (CR-L2-02) は、自分の目とコードで確認して閉じた。台帳と報告も置かれ、evidence の PNG 7 枚も実在する。

しかし、S2 の中核だった CR-L2-03 (退会時の Stripe 解約) と、それに乗る CR-L2-10 (退会モーダルの出し分け) と CR-L2-14 (Stripe 契約者の「契約を管理」) は、コードの形は直っているが**到達しない**。理由はひとつで、User.billingProvider に "stripe" を書く箇所がリポジトリのどこにも無い。Stripe の checkout・webhook (subscriptionToUserFields)・migration のいずれも billingProvider を書かず、"apple" を書くのは appleServer.ts だけ。したがって Stripe 契約者は全員 billingProvider = null であり、

- requestAccountDeletion.ts:89 `dbUser.billingProvider === "stripe" && dbUser.stripeSubscriptionId` は常に偽 → 解約は呼ばれず、失敗時の中断も働かず、退会が完了して Stripe の請求だけが残る (ラウンド 2 の S2 そのまま)。
- DeleteAccountModal.tsx:98 `provider === "stripe"` は常に偽 → 「退会と同時に解約されます」の注記は誰にも出ない。Apple の identity を持つ Stripe 契約者には逆に「Apple の契約は自動では止まりません」だけが出る。
- PlanCard.tsx:69 `provider === "apple" || (apple && provider !== "stripe")` は apple モードで provider = null のとき真 → ローンチ後、Stripe 契約者の「契約を管理」は Customer Portal ではなく Apple の管理ページを開く。規約 第5条の5・特商法 L86「設定画面の『契約を管理』から解約」が事実でなくなる。

台帳 L-18・L-20・L-27 はいずれも「合格 (コード確認)」だが、コードを読めば分岐条件が成立しないことが分かる。証跡の裏取りとしては、ここが今ラウンドの最大の穴。

そのほか新規は S3 が 4 件 (結果カードの無条件の「無料」、審査メモのデモアカウントの契約状態、規約「登録は契約と同時」と Web の Google 新規ログインの食い違い、台帳の合格記載の誤り)、S4 が 2 件。

## 1. 前ラウンド指摘の閉じ判定

### 1-1. ラウンド 2 の 16 件

| ID | 重大度 | 判定 | 自分で確認した根拠 |
|---|---|---|---|
| CR-L2-01 | S2 | 閉じる | app/support/page.tsx・app/support/help/page.tsx が redirect(`/${GUEST_ID}/support…`)。Next.js は静的セグメントを動的 [userId] より優先するので middleware なしで効く。curl: /support → 307 /guest/support、/support/help → 307 /guest/support/help、/guest/support/help → 200。listing L47 は URL 据え置きで注記追加 |
| CR-L2-02 | S2 | 閉じる (副作用 2 点を S4 で記録) | plan.ts:66 `REQUIRE_SUBSCRIPTION = isAppleBilling()`。billingMode.ts は isNativeApp.ts だけを import し、isNativeApp.ts は import なし → 循環なし。plan.ts を import する client component は 0 (grep)。消費側 3 か所 (plan.ts:257・298、[userId]/page.tsx:825) は真偽値の読み方が変わらず、Stripe モード (env 未設定) は従来どおり false。listing §4 L122・01_plan.md L35 に手順追記。副作用: (a) 先生ロールも apple モードでは needsSubscription になる (CR-L3-07)。(b) scripts/_tmp_verify_require.mjs は文字列一致で throw するようになるが一時スクリプトなので指摘しない |
| CR-L2-03 | S2 | **開いたまま** | 中断のコード (requestAccountDeletion.ts:89-101) は書かれているが、外側の条件 `billingProvider === "stripe"` が成立するデータを作る箇所が無い (→ CR-L3-01)。エラー形の判定 (code resource_missing / message "already canceled") 自体は妥当な包含 (§3 V3-6) |
| CR-L2-04 | S3 | 閉じる | Terms 第13条 L201「プロフィール画面から退会」、Privacy 12. L144「プロフィール画面からは…変更と退会…設定画面からはお知らせメールの停止」、help L99「プロフィール画面から」、listing L108「avatar → プロフィール → 退会」。実装 AccountInfo.tsx に退会ボタンとモーダル |
| CR-L2-05 | S3 | 一部閉じる | gateText.ts:30・38・47、Recorder.tsx:1055、home.tsx:237、PlanCard.tsx:122 に「はじめての方は」。**ArcoResultOverlay.tsx:265「はじめる手続き・最初の 2 週間は無料」は無条件のまま** (ラウンド 2 で対象に挙げた 7 か所目) → CR-L3-02。listing §4 L126 に価格ポイント確定後の一括見直し行あり |
| CR-L2-06 | S3 | 閉じる | help/page.tsx:126-128: 括弧なし・「はじめての方は」・Web の Stripe 契約者の行あり |
| CR-L2-07 | S3 | 閉じる (中身の誤りは CR-L3-05) | 02_cases.csv は L-01〜L-30 の結果列すべて記入、99_report.md 実在、evidence 7 枚実在。ただし L-18・L-20・L-27 の「合格」は成立しない (CR-L3-05) |
| CR-L2-08 | S3 | 閉じる | listing L85・L118 とも 1206 × 2622 |
| CR-L2-09 | S3 | 一部閉じる (残りは Tetsuo 判断) | public/lp/index.html:850 に /terms・/privacy・/tokushoho のリンク。L6・L848「Arcoda（アルコーダ）｜運営者: 小松崎鉄雄」は据え置き (Tetsuo 判断・project_lp_waitlist_pending に記録済みとのこと) |
| CR-L2-10 | S4 | **開いたまま** | 受け渡しは正しい (profile/page.tsx:26 select billingProvider → AccountInfo.tsx:18 → DeleteAccountModal provider)。しかし provider が "stripe" になるデータは存在しないので L98 の分岐は到達不能。provider = null にフォールバックし、hasApple のときは Apple の注記だけが出る (→ CR-L3-01) |
| CR-L2-11 | S4 | 閉じる | requestAccountDeletion.ts:109 で appleRefreshToken を保持 → :112-127 Auth 削除・失敗時 deletedAt 巻き戻し → :133-135 で失効。Auth 失敗時に連携が切れない順序になった。Storage・DB 削除の失敗で半端になる点は既存のトレードオフ (ヘッダのコメントどおり) |
| CR-L2-12 | S4 | 閉じる | PlanCard.tsx:37「1 日 8 回・10 分まで」 |
| CR-L2-13 | S4 | 閉じる | Terms 第17条 L247 末尾「ただし、当社の責任の範囲は次項によります」。Privacy 15. L177 効力発生日の型 |
| CR-L2-14 | S4 | 閉じる (文) / 実装は CR-L3-01 | listing §4 L123 に STRIPE_* と /api/stripe/portal を残す行。ただし PlanCard.tsx:69 は apple モードで provider = null の Stripe 契約者を Apple の管理ページへ送るので、env を残しても Customer Portal に届かない |
| CR-L2-15 | S4 | 閉じる | onboardingClient.tsx:685「設定でいつでも止められる」、:686 /privacy へのリンク (新しいタブ) |
| CR-L2-16 | S4 | 閉じる | requestAccountDeletion.ts 件名「アルコ 退会完了のお知らせ」・本文「アルコ (Arcoda) の退会処理が完了しました」 |

閉じた: 11 / 一部: 2 (05・09) / 開いたまま: 3 (03・10・14 の実装側は 03 と同根で CR-L3-01 に統合)。

### 1-2. ラウンド 1 の開き残り

| ID | 判定 | 根拠 |
|---|---|---|
| CR-L1-15 | 開いたまま (見送り・理由妥当) | /start の注記は写経寸法の制約。法務行 StartClient.tsx:294-298 に 3 リンク + 購入を復元。S3 残件として保持 |
| CR-L1-18 | 開いたまま (Tetsuo 確認待ち) | Privacy 8./9. L100-106・L116 の国名は据え置き。listing §4 L127 に確認項目 |
| CR-L1-22 | 一部閉じる | 4 文書は「アルコ (英語表記 Arcoda)」。退会メールも直った。LP は Tetsuo 判断。なお help/page.tsx:18「Arcodaってなに?」と support/page.tsx:70-71「Arcoda v…」「© 2026 Arcoda」は未統一 (CR-L3-06・S4) |
| CR-L1-23 | 閉じる | listing L118 が 1206 × 2622 に揃った |

## 2. 新規指摘 (CR-L3-xx)

重大度: S1 法令違反または審査で確実に止まる・虚偽の公開文書 / S2 誤解を招き紛争や返金の火種・主要動線が破れる / S3 分かりにくい・不正確 / S4 改善提案
種別: 適合・完全性・価値・整合・証跡の不備

### S2

#### CR-L3-01 billingProvider に "stripe" を書く箇所が無く、退会時の解約・退会モーダルの注記・「契約を管理」の Stripe 分岐がすべて到達不能
- 重大度: S2 (規約 第5条の5 L139・第13条 L207、特商法 L86、help L109、DeleteAccountModal L98 の「退会と同時に解約」「以後の請求は発生しません」が、Stripe 契約者全員について事実でない。ラウンド 2 の CR-L2-03 と同じ火種が残る) / 種別: 整合・適合
- 対象:
  - app/actions/requestAccountDeletion.ts:89 `if (dbUser.billingProvider === "stripe" && dbUser.stripeSubscriptionId)`
  - app/[userId]/settings/DeleteAccountModal.tsx:93・98
  - app/[userId]/settings/PlanCard.tsx:69 `if (provider === "apple" || (apple && provider !== "stripe"))`
  - app/_libs/stripe.ts:42-58 subscriptionToUserFields (plan / planStatus / planCurrentPeriodEnd / stripeSubscriptionId のみ)
  - app/api/stripe/checkout/route.ts:61 (stripeCustomerId のみ更新)、app/api/stripe/webhook/route.ts applySubscription (fields をそのまま書く)
  - prisma/migrations/20260912200000_apple_billing/migration.sql:5 (ADD COLUMN のみ・バックフィルなし)
- 何が問題か: `grep -rn billingProvider app lib prisma scripts` で値を書き込むのは app/_libs/apple/appleServer.ts:142 `billingProvider: "apple"` と検証用シード (scripts/_tmp_verify_*・"apple") だけ。Stripe の加入・更新・解約のどの経路でも billingProvider は書かれず、既存の Stripe 契約者に対するバックフィルも無い。よって Stripe 契約者は全員 billingProvider = null。その結果、
  1. 退会時の `subscriptions.cancel` は一度も呼ばれない。ラウンド 2 で足した「失敗したら中断」も一度も評価されない。退会後に Stripe の契約と請求が残り、本人は Customer Portal に入れない (CR-L2-03 の状況がそのまま)。
  2. 退会モーダルは provider = null → hasApple にフォールバック。メール/Google だけの Stripe 契約者には注記が何も出ず、Apple の identity も結んでいる Stripe 契約者には「Apple の契約は自動では止まりません」という無関係な注記だけが出る。
  3. apple モードに切り替えた後、Stripe 契約者が設定の「契約を管理」を押すと `apple && provider !== "stripe"` が真になり、ネイティブなら Apple の管理シート、Web なら account.apple.com が開く。Customer Portal には行けない。listing §4 L123「STRIPE_* env と /api/stripe/portal を残す」を守っても届かない。退会中断時のエラー文「先に『契約を管理』から解約してください」も、この状態では実行できない指示になる。
  settings/page.tsx:31 は stripeSubscriptionId を select しているのに provider の導出に使っておらず (`provider: dbUser.billingProvider` L67)、profile/page.tsx:26 は billingProvider しか select していない。
- 根拠: 上記 grep 結果 (書き込み箇所 1 か所 = apple)。stripe.ts:53-56 のコメント「解約 (deleted) でも旧 sub.id を残す」から、stripeSubscriptionId は加入歴の印であって現役契約の印ではないことも読める (解約済みの人にも残る)。02_cases.csv L-18・L-27 は「コード確認」のみで、Stripe 契約者の行を用意して分岐に入ることを確認していない。
- 期待:
  1. 契約の提供元を stripeSubscriptionId から導出するか (`billingProvider ?? (stripeSubscriptionId ? "stripe" : null)` を settings/page.tsx と profile/page.tsx で計算して渡す)、または webhook の subscriptionToUserFields に `billingProvider: "stripe"` を足し、既存行に `UPDATE "User" SET "billingProvider"='stripe' WHERE "stripeSubscriptionId" IS NOT NULL AND "billingProvider" IS NULL` のバックフィル migration を置く (本番 migration は手動: project_prisma_prod_migration_manual)。
  2. requestAccountDeletion.ts の解約条件は `stripeSubscriptionId && planStatus ∈ {trialing, active, past_due}` を正とし、billingProvider に依存しない (canceled 済みの人に cancel を投げて resource_missing を待つより明確)。
  3. PlanCard.tsx:69 は「stripeSubscriptionId がある人は Customer Portal」を apple モードでも優先する。
  4. 検証: 開発 DB に Stripe 契約者 (stripeSubscriptionId あり・billingProvider null) を 1 行作り、モーダルの注記が出ること・退会で cancel が呼ばれること (Stripe をモック) を vitest で固定する。02_cases.csv L-18・L-20・L-27 の結果を書き直す。

### S3

#### CR-L3-02 結果カードの「最初の 2 週間は無料」が条件なしのまま
- 重大度: S3 / 種別: 適合 (社内規則: 「無料」は条件つき一文のみ) ・整合 (CR-L2-05 の直し漏れ)
- 対象: app/components/ArcoResultOverlay.tsx:265「はじめる手続き・最初の 2 週間は無料」
- 何が問題か: ラウンド 2 で対象に挙げた箇所だが「はじめての方は」が付いていない。他の 6 か所と listing L32 は条件つきに揃った。1 回ためしの結果カードは端末ごとに出るので、過去に無料期間を使った Apple ID の人にも表示される。99_report は「6 か所」と数え、この行を対象から落としている。
- 期待: 「はじめる手続き・はじめての方は最初の 2 週間は無料」に揃える。listing §4 L126 の「6 か所」も 7 か所に直す。

#### CR-L3-03 審査メモのデモアカウント「契約済みの状態」の作り方が書かれておらず、審査員が辿る手順と噛み合わない
- 重大度: S3 (審査員が Manage or cancel の手順どおりに進んで「契約を管理」が見つからないと手戻り) / 種別: 整合・完全性
- 対象: docs/legal/app-store-listing.md L95「(契約済みの状態)」、L107「Manage or cancel: Settings → プラン → "契約を管理"」、L115「the demo account above already has an active subscription」、L119 添付「設定のプランカード (契約中)」
- 何が問題か: デモアカウントはメール・パスワードで入る。そのアカウントを「契約済み」にする手段は (a) planGrant = internal か (b) planStatus を手で active にするか (c) 審査用 Apple ID で Sandbox 購入するか、のどれかで、listing はどれとも書いていない。(a) だと PlanCard.tsx:35 はチップ「運営」・本文「運営用のアカウントです」・action "none" になり、L107 の「契約を管理」ボタンは存在しない。(b) だと「契約を管理」は showManageSubscriptions を開くが、審査員の Apple ID にはこのアプリの契約が無いので空のシートが出る。(c) なら整合するが、その場合 L95「契約済みの状態」で渡す意味が薄い。listing §4 にもこの項目が無い。
- 期待: デモアカウントの契約状態の作り方を 1 行で決めて書く。planGrant = internal を使うなら L107 を「the demo account is an internal account; to see 契約を管理, complete a Sandbox purchase with a fresh Sandbox tester」に直し、添付の「プランカード (契約中)」は Sandbox 購入済みアカウントで撮ると書く。

#### CR-L3-04 規約「アカウントの登録はアルコプラスの契約と同時に行われ」と listing「new users sign in with Apple only」が、Web の Google 新規ログインで破れる
- 重大度: S3 / 種別: 整合
- 対象: TermsContent.tsx 第5条 L60、app-store-listing.md L95・L113、app/login/page.tsx:152 `!(isAppleBilling() && native)` (Web ブラウザでは apple モードでも Google ボタンが出る)、app/auth/callback/route.ts:50-52 (apple 以外の provider で User が無ければ `prisma.user.create({ …, plan: "free" })`)
- 何が問題か: apple モードでも Web ブラウザの /login には「Googleでログイン」が出る。初めての Google アカウントで押すと callback が plan "free" の User を作る。つまり契約なしのアカウントが登録できる。第5条 L60 の断定と、listing L113「new users sign in with Apple only」は「iPhone 向けアプリでは」の限定を落としている。そのユーザーは needsSubscription で録音できず、/start は Web では「iPhone アプリではじめられます」を出すので実害は小さいが、規約の文としては事実と違う。signUp/page.tsx:102-116 は Web で塞いでいるのに、login の Google 経路だけ塞がれていない。
- 期待: 第5条 L60 を「iPhone 向けアプリでは、アカウントの登録はアルコプラスの契約と同時に行われます。本サービスに恒久的な無料プランはありません」にする。listing L113 は「On iPhone, new users sign in with Apple only. On the web, existing accounts can sign in with email/password or Google」に。または callback で apple モード・非 apple provider・User 不在のときは作成せず案内に流す (実装変更は Tetsuo 承認後)。

#### CR-L3-05 台帳 L-18・L-20・L-27 の「合格 (コード確認)」が成立しない
- 重大度: S3 / 種別: 証跡の不備
- 対象: docs/verify/legal/02_cases.csv L-18・L-20・L-27、99_report.md「実装で足したもの」の 2 行 (退会時に Web の契約を解約 / 退会モーダルの出し分け)
- 何が問題か: 3 行とも「コード確認」で合格にしているが、CR-L3-01 のとおり分岐条件が成立するデータ経路が無い。コード確認で合格を出すなら、条件を満たすデータがどこで作られるかまで追う必要があった。99_report の「実装で足したもの」も、足したコードが動く前提で書かれている。
- 期待: 3 行を「不合格 (billingProvider "stripe" の書き込み経路なし)」に直し、CR-L3-01 の修正後に Stripe をモックしたテストまたは開発 DB の 1 行で再確認して書き直す。

### S4

#### CR-L3-06 サービス名の統一が FAQ とサポート画面の既存文に及んでいない
- 対象: app/[userId]/support/help/page.tsx:18「Arcodaってなに?」、app/[userId]/support/page.tsx:70-71「Arcoda v{APP_VERSION}」「© 2026 Arcoda」
- 内容: 4 文書と退会メールは「アルコ (英語表記 Arcoda)」に揃った (CR-L1-22)。サポート画面と FAQ の見出しは Arcoda 単独のまま。ゲストがサポート URL から最初に見る画面なので、「アルコってなに?」「アルコ (Arcoda) v…」に寄せると製品ページ「アルコ・バイオリン練習の採点」と一致する。

#### CR-L3-07 apple モードでは先生ロールも「契約が必要」の扱いになる
- 対象: app/_libs/plan.ts:298 (`teacherLink` は生徒側の接続だけを見る)、app/[userId]/page.tsx:825 (`!teacherSummary` も生徒側)、app/components/Recorder.tsx:1053 needs-plan カード、app/[userId]/settings/page.tsx:62 (先生には billing を渡さず PlanCard を出さない)
- 内容: REQUIRE_SUBSCRIPTION の連動で、先生ロールのアカウント (plan "free") は録音画面に「アルコプラスをはじめると採点できます」、ホームに「はじめる」の帯が出る一方、設定には「先生には加入導線を出さない」方針で PlanCard が無い。先生機能は TEACHER_FEATURE_ENABLED = false で未公開なので今は影響しないが、公開時に規約 第5条 (契約者に提供) と先生プラン (料金未定) の関係を決める必要がある。plan.ts:212 のコメント「先生機能をサービスインする日に必ず見直す」と同じ箱に入れておく。

## 3. 裏取りした事実の表

| # | 主張 | 確認した実装・手段 | 結果 |
|---|---|---|---|
| V3-1 | /support/help は実在し、ログインなしで開く (CR-L2-01) | app/support/help/page.tsx redirect → curl 307 → /guest/support/help 200。静的セグメントが [userId] より優先 | 一致 |
| V3-2 | REQUIRE_SUBSCRIPTION は apple モードで true・Stripe モードで false・循環 import なし (CR-L2-02) | plan.ts:66、billingMode.ts の import は isNativeApp のみ、isNativeApp.ts は import 0、plan.ts を import する client component 0 | 一致 |
| V3-3 | Stripe の解約に失敗したら退会が止まる (CR-L2-03) | requestAccountDeletion.ts:89-101 の分岐はあるが、billingProvider = "stripe" を書く経路が無い (grep: appleServer.ts の "apple" のみ) | **不一致** (CR-L3-01) |
| V3-4 | 退会モーダルは契約の提供元で 3 通りに出し分ける (CR-L2-10) | 受け渡しは正しいが provider が "stripe" になるデータが無い | **不一致** (CR-L3-01) |
| V3-5 | Apple トークン失効は Auth 削除の後 (CR-L2-11) | :109 保持 → :112 Auth 削除 → :133 失効 | 一致 |
| V3-6 | Stripe の「既に解約済み」判定が実際のエラー形と合う | stripe-node の StripeError は `code` と `message` を持つ。docs.stripe.com/api/subscriptions/cancel は解約済みへの再 cancel のエラーを記載しない。コミュニティの報告では invalid_request_error / code resource_missing / "No such subscription: …" が返る。コードは code と message 正規表現の両方を見る包含判定なので、どちらの形でも続行になる | 妥当 (ただし到達不能なので実地未確認・ユニットテストなし) |
| V3-7 | 「プロフィール画面から退会」の到達 (CR-L2-04) | AccountInfo.tsx に退会ボタン・モーダル。AccountMenu にプロフィール項目 | 一致 |
| V3-8 | 「はじめての方は」が 6 か所に付いた (CR-L2-05) | gateText ×3・Recorder:1055・home:237・PlanCard:122 に付いた。ArcoResultOverlay:265 は無条件 | 一部 (CR-L3-02) |
| V3-9 | 条番号の相互参照 | Terms 第2条 → 第5条・第3条、第13条 → 第5条の3・第5条の5・第5条の4、第15・16条 → 第17条、第17条 → 次項。Privacy 9. → 第8条、13. → 第8条、14. → 第12条 | すべて実在・内容一致 |
| V3-10 | cron の一致 | vercel.json「0 18 * * *」(JST 3:00) と route.ts の説明、ゲスト削除 + AppleNotification 7 年削除 (Privacy 6. L76) | 一致 |
| V3-11 | ゲストが法務文面に辿れる | AccountMenu (ゲスト側) → /guest/support → 利用規約・ポリシー・特商法・お問い合わせ。support/terms・privacy・tokushoho の page 実在 | 一致 |
| V3-12 | Web ブラウザでは新規契約なし・登録は iPhone (規約 第5条・第5条の5・listing) | signUp は Web で App Store 案内。login の Google は Web で出て、callback が新規 User を作る | 一部不一致 (CR-L3-04) |
| V3-13 | listing の 5 URL | /terms /privacy /tokushoho 200、/support/help 307 → 200、/lp/ 308 → /lp | 一致 (本番は未確認・listing §4 に行あり) |
| V3-14 | 特電法の表示 | お便りメールの送信実装は存在しない (app/_libs に teacherEmailNotify・waitlistThanksEmail のみ)。listing §4 L129 に配信前の条件 | 一致 (先送りが明記されている) |
| V3-15 | 「無料」の語 | 4 文書・listing は条件つきのみ。UI は ArcoResultOverlay:265 が無条件 | 文書一致・UI 1 件 (CR-L3-02) |
| V3-16 | R7 括弧 (新規 UI 文言) | gateText・help FAQ・PlanCard・SettingsClient・DeleteAccountModal・login・onboarding Scr11D の新規文に日本語直後の括弧なし。DeleteAccountModal:87・AccountInfo の「(録音・楽譜・解析結果・練習履歴)」は既存文 | 新規は違反なし |

## 4. 空振り (探したが問題が見つからなかったもの)

- Privacy 13.「サービス品質改善のため Cookie 等」: gtag・GA・@vercel/analytics・posthog・plausible は app/layout.tsx と package.json に無い。登録の入口の記録は GuestEvent (サーバー側 DB) で Cookie ではない。開示が実装より広いだけで害はなく、指摘にしない。
- Privacy 2.「Web ブラウザではブラウザに保存する乱数」: ゲストの端末識別子の説明としては前ラウンドで deviceKey.ts と照合済み。今回は再確認せず。
- 規約 第5条の3「設定画面の『契約を管理』からも同じ画面」: Apple 契約者 (billingProvider "apple") は PlanCard:69-77 で showManageSubscriptions / account.apple.com。こちらは正しく動く。
- 退会モーダルの文言と規約の一致: モーダル「退会のあと、iPhone の設定 › サブスクリプション から解約」と規約 第13条「退会の前後に必ず解約」、第5条の3「退会の前または後に」は整合。Stripe 側の文「以後の請求はありません」も規約 第5条の5 と同じ (ただし到達不能・CR-L3-01)。
- Recorder の needs-plan カード (Recorder.tsx:1053-1060): 契約切れ/未加入で見出しと副文を分け、括弧なし、「無料」は条件つき。canShowBilling が偽 (Web) のときはボタンを出さない。問題なし。
- guest-cleanup の安全網 `billingProvider: null, plan: "free"`: ゲストが購入で昇格した行は消さない。Apple 昇格は appleServer.ts で billingProvider "apple" を書くので成立。
- 特商法「動作環境」: iOS は【 】。Web の記述に問題なし。
- StartClient.tsx:287 ボタン「2 週間無料ではじめる」: 条件語は無いが introEligible (StoreKit の資格判定) でのみ表示され、直下 L291 の一文が条件を書く。規則の趣旨 (資格の無い人に無料と言わない) は満たすと判断。
- Terms 第16条 の「当社の責任の範囲は第17条によります。ただし、当社の都合で…」: 「ただし」が免責の例外として読めるか一瞬迷うが、文意 (終了時の返金案内) は通る。指摘にしない。
- 誤字脱字: 4 文書と listing を通読。重複文・脱字は見つからなかった。「第5条の2 … 契約から 2 週間の無料期間」と特商法「2 週間の無料期間の終了時に」の週数一致、8 回・10 分・5 回の数値一致を確認。
- LP フッター (public/lp/index.html:850): /terms・/privacy・/tokushoho の相対リンクは同一ドメイン配下なので LP (/lp/) から解決できる。
- Scr11D の /privacy リンク target="_blank": Capacitor 殻でどう開くかは未確認だが、開けなくてもオンボーディングは進む。指摘にしない。
- scripts/_tmp_verify_require.mjs: plan.ts の文字列変更で throw するようになるが、一時スクリプトのため指摘対象外 (指示どおり)。

## 5. 判定

**不合格。**

理由: S2 が 1 件 (CR-L3-01)。ラウンド 2 の S2 CR-L2-03 は形の上で直ったが、billingProvider に "stripe" を書く経路がリポジトリに無いため分岐が到達せず、Stripe 契約者の退会で契約が残る状況は変わっていない。同じ根で CR-L2-10 の出し分けと、apple モード切替後の Stripe 契約者の「契約を管理」(CR-L2-14 の実装側) も破れる。

新規: S2 1 (CR-L3-01) / S3 4 (CR-L3-02 結果カードの無条件の「無料」、CR-L3-03 デモアカウントの契約状態、CR-L3-04 規約「登録は契約と同時」と Web の Google 新規ログイン、CR-L3-05 台帳の合格記載) / S4 2 (CR-L3-06 名称統一の残り、CR-L3-07 先生ロール)。

前ラウンド: ラウンド 2 の 16 件は 11 閉じ・2 一部 (05・09)・3 開き (03・10・14 実装側 → CR-L3-01 に統合)。ラウンド 1 の残りは 23 を閉じ、15 (見送り)・18 (Tetsuo)・22 (LP は Tetsuo・FAQ/サポートは CR-L3-06) が S3 以下で残る。

次のラウンドで合格にする最短路:
1. CR-L3-01: provider の導出を stripeSubscriptionId 基準にする (settings/page.tsx・profile/page.tsx の 2 行 + requestAccountDeletion.ts:89 の条件 + PlanCard.tsx:69 の順序)。webhook で billingProvider "stripe" を書き、バックフィル migration を置くならそれも可 (本番 migration は手動)。Stripe をモックしたテスト 1 本で「呼ばれる・失敗で止まる・resource_missing で続く」を固定。
2. CR-L3-02: ArcoResultOverlay.tsx:265 に「はじめての方は」。
3. CR-L3-03・04: listing と規約 第5条 L60 の文言。
4. CR-L3-05: 02_cases.csv L-18・L-20・L-27 を書き直す。

これで残るのは CR-L1-15・18・CR-L2-09 (Tetsuo 判断) と S4 だけになり、条件つき合格にできる。
