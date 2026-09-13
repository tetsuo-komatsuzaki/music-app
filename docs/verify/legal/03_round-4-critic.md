# 法務文面 4 点 ラウンド 4 批評 (critic)

- 日付: 2026-09-13
- 対象: 03_round-3-critic.md の 7 件 (S2 1・S3 4・S4 2) と、ラウンド 2 の開き残り (CR-L2-03・05・09・10・14) に対する 04_round-3-fix.md の修正。台帳 02_cases.csv (L-01〜L-31)、01_plan.md、99_report.md。コーディネータの追加指示で TokushohoContent.tsx の電話番号の省略規定 (最新版) も判定に含めた。
- 自分の手で読んだもの: app/_libs/{billingProviderOf,billingProviderOf.test,stripe,stripe.test}.ts、app/actions/requestAccountDeletion.ts、app/api/stripe/{webhook,checkout,portal}/route.ts、app/api/apple/{verify,restore,notifications}/route.ts、app/_libs/apple/appleServer.ts、prisma/migrations/20260913120000_stripe_billing_provider_backfill/migration.sql、prisma/schema.prisma (User の課金列)、app/[userId]/settings/{page,PlanCard,DeleteAccountModal}.tsx、app/[userId]/profile/{page,AccountInfo}.tsx、app/start/{page,StartClient}.tsx、app/auth/callback/route.ts、app/api/cron/guest-cleanup/route.ts、vercel.json、app/actions/recordGuestEvent.ts、app/_libs/guestEvents.ts、app/components/guest/GuestVisitPing.tsx、app/_libs/knownUser.ts、app/components/ArcoResultOverlay.tsx:259-267、app/[userId]/library/LibraryClient.tsx:100-135、app/[userId]/support/{page,help/page}.tsx (該当行)、app/onboarding/onboardingClient.tsx:686 と actions の import、app/components/legal/{Terms,Privacy,Tokushoho}Content.tsx (該当条)、native/capacitor.config.ts、public/lp/index.html:850、docs/legal/app-store-listing.md、docs/verify/legal/{01_plan,02_cases.csv,04_round-3-fix,99_report}、メモリ project_teacher_embed_email_pending_tests.md / project_billing_iap_decision.md (CR-L3-07 の記録先の確認)
- 実行したもの: `npx vitest run app/_libs/billingProviderOf.test.ts app/_libs/stripe.test.ts` → 2 ファイル 17 件 green。dev (http://localhost:3101・apple モード) で curl: /guest/support /guest/support/help /guest/support/tokushoho /guest/support/terms /guest/support/privacy /guest/support/contact /guest/settings /guest/profile → すべて 200。`grep -rn billingProvider` で書き込み箇所を再洗い出し (appleServer.ts:142 "apple"・stripe.ts:59 "stripe"・migration の 2 か所)。
- 【 】の空欄そのものは指摘しない。本番 DB は読み書きしていない。実装・テストコードは編集していない。

## 0. 総評

ラウンド 3 の S2 (CR-L3-01) は閉じる。billingProviderOf.ts の 2 関数が列の空白に依存せずに提供元を導出し、requestAccountDeletion.ts:91 の解約条件・settings/page.tsx:68・profile/page.tsx:39 の受け渡し・PlanCard.tsx:69 の順序がすべてその関数に乗り替わっていることを自分の目で確認した。stripe.ts:59 で webhook が以後 "stripe" を書き、migration が既存行を埋める。テスト 17 件は自分の環境で green。Stripe 契約者 (列が空・planStatus active) の退会で `subscriptions.cancel` に到達すること、失敗で中断すること、canceled の人には投げないことがコードとテストで固定された。

ただし反例を作ると、**二つの提供元が User の同じ列 (plan / planStatus / planCurrentPeriodEnd / billingProvider) を共有している**ことから来る穴が 2 つ残る。(1) 契約中の人が /start に入れる (start/page.tsx も /api/apple/verify も契約状態を見ない) ので、Web の Stripe 契約者が iPhone で Apple を買うと billingProvider = "apple" になり、shouldCancelStripeOnDeletion は最初の行で false → 退会しても Stripe の請求が残る。(2) webhook は billingProvider = "stripe" を無条件に上書きするので、Apple 契約者に Stripe の遅延イベント (Stripe は失敗した webhook を最長 3 日再送する) が届くと Apple の契約が DB から消え、退会モーダルの注記が反転する。どちらも UI の導線からは起きず (URL 直打ち・障害時の再送)、主要動線は破れていないので S3 とした。根拠は各項に書いた。

そのほか新規は S3 が 4 件 (ライブラリの案内シートに 8 か所目の無条件の「無料」、Web + apple モードの Stripe 契約者に Apple の案内文、SCR-11d のポリシーリンクが殻で同じ WebView に読み込まれてオンボの回答を失う可能性、99_report と listing L128 と fix 記録のテスト件数の不一致)、S4 が 3 件。

追加指示の特商法・電話番号の省略規定は妥当と判断 (§3 V4-15)。

## 1. 前ラウンド指摘の閉じ判定

### 1-1. ラウンド 3 の 7 件

| ID | 重大度 | 判定 | 自分で確認した根拠 |
|---|---|---|---|
| CR-L3-01 | S2 | **閉じる** (派生の穴 2 つは CR-L4-01・02 として S3 で新規) | billingProviderOf.ts:22-26 `resolveBillingProvider`: 列が apple/stripe ならそれ、無ければ stripeSubscriptionId から "stripe"。:32-36 `shouldCancelStripeOnDeletion`: apple でなく・加入歴あり・planStatus ∈ {trialing, active, past_due}。requestAccountDeletion.ts:91 がこれを使い、:93 cancel → :96 resource_missing / already canceled は続行・それ以外は :99 で中断。stripe.ts:36・59 `billingProvider: "stripe"` が型と値の両方に入り、webhook route.ts:69-73 applySubscription が fields をそのまま updateMany する (checkout.session.completed・created/updated・deleted の 4 経路すべて)。migration.sql は `UPDATE "User" SET "billingProvider"='stripe' WHERE "stripeSubscriptionId" IS NOT NULL AND "billingProvider" IS NULL` のデータのみ・schema 変更なし・フォルダ名 14 桁で 20260912200000 の後に並ぶ → Prisma の migration として妥当。settings/page.tsx:32 select に stripeSubscriptionId・:68 `provider: resolveBillingProvider(dbUser)`。profile/page.tsx:28 select に stripeSubscriptionId・planStatus・:39 で導出値を渡す → AccountInfo:269 → DeleteAccountModal provider。PlanCard.tsx:69 `provider !== "stripe" && (provider === "apple" || apple)` で stripe は apple モードでも Customer Portal。vitest 17 件 green (自分で実行)。反例 3 つ: (a) Stripe canceled → Apple 契約: 列 "apple"・planStatus は Apple の active → resolve "apple"・shouldCancel false → 正しい (Stripe は既に無い)。(b) Apple 契約後に stripeSubscriptionId が残る人 = (a) と同じで正しい。(c) billingProvider "apple" だが Stripe が生きている人 → shouldCancel が :33 で即 false → **Stripe が残る** (CR-L4-01)。 |
| CR-L3-02 | S3 | 閉じる (8 か所目は CR-L4-03) | ArcoResultOverlay.tsx:265「はじめる手続き・はじめての方は最初の 2 週間は無料」。ただし grep で LibraryClient.tsx:123「最初の 2 週間は無料」が無条件のまま見つかった。listing L128 の「6 か所」も据え置き (期待の 2 点目が未対応・CR-L4-04) |
| CR-L3-03 | S3 | 閉じる | listing L95「Sandbox の購入を実際に完了させて作る (planGrant=internal では…『契約を管理』が出ない)」、L116 英文に同じ旨・添付 L120 は Sandbox 購入済みで撮る前提に読める |
| CR-L3-04 | S3 | 閉じる | TermsContent.tsx:60「iPhone 向けアプリでは、アカウントの登録はアルコプラスの契約と同時に行われます。Web ブラウザでログインしてアカウントを作った場合、アルコプラスの契約は iPhone 向けアプリで行います」。listing L114「on iPhone, new users sign in with Apple only… (On the web, existing accounts can also use Google.)」。callback route.ts:50-52 の plan "free" 作成と矛盾しない文になった |
| CR-L3-05 | S3 | 閉じる | 02_cases.csv L-18・L-20・L-27 が「R3 fix」の根拠つきで書き直され、L-31 (バックフィル migration) 追加。L-20 は画面未撮影を明記 (dev の ENABLE_ACCOUNT_DELETION 未設定・妥当) |
| CR-L3-06 | S4 | 一部閉じる (据え置き分は理由妥当) | help/page.tsx:18「アルコってなに?」。support/page.tsx:70-71「Arcoda v…」「© 2026 Arcoda」は著作権表示のブランド名として据え置き。残件として保持 |
| CR-L3-07 | S4 | **開いたまま (記録の証跡なし)** | fix は「project_teacher_embed_email_pending_tests に記録」と書くが、そのファイルに CR-L3-07 / REQUIRE_SUBSCRIPTION / getGradingQuota の行は無い (grep 0 件)。REQUIRE_SUBSCRIPTION は project_billing_iap_decision.md 等 3 ファイルにあるが先生ロールの箱ではない → CR-L4-06 |

閉じた: 5 / 一部: 1 (06) / 開いたまま: 1 (07・S4)。

### 1-2. ラウンド 2 の開き残り

| ID | 判定 | 根拠 |
|---|---|---|
| CR-L2-03 | 閉じる | requestAccountDeletion.ts:91-102。列が空の Stripe 契約者で到達することはテスト :20-25 で固定。失敗時の中断 :98-99 はそのまま |
| CR-L2-05 | 一部閉じる | 7 か所は条件つきに揃った。LibraryClient.tsx:123 が 8 か所目 (CR-L4-03) |
| CR-L2-09 | 開いたまま (Tetsuo 判断) | public/lp/index.html:850 に 3 リンクあり。名称・運営者名は据え置き |
| CR-L2-10 | 閉じる | profile/page.tsx:39 → AccountInfo:269 → DeleteAccountModal:93・98。provider "stripe" が導出で成立するので Web の注記に到達する。canceled の人にも「契約中」と出る点は CR-L4-09 (S4) |
| CR-L2-14 | 閉じる (文の矛盾 1 点は CR-L4-05) | listing L125 に STRIPE env と /api/stripe/portal を残す行。PlanCard.tsx:69 の順序で apple モードでも Customer Portal に届く。ただし :107 の注記の条件は直っていない |

### 1-3. ラウンド 1 の残り (変化なし)

CR-L1-15 (見送り・S3)、CR-L1-18 (Tetsuo 確認待ち)、CR-L1-22 (LP は Tetsuo・FAQ は閉じ・サポート画面は CR-L3-06 で据え置き)。

## 2. 新規指摘 (CR-L4-xx)

重大度: S1 法令違反または審査で確実に止まる・虚偽の公開文書 / S2 紛争や返金の火種・主要動線が破れる / S3 分かりにくい・不正確 / S4 改善提案
種別: 適合・完全性・価値・整合・証跡の不備

### S3

#### CR-L4-01 契約中の人が /start で Apple を買えるため、Stripe が生きたまま billingProvider = "apple" になり退会で Stripe が解約されない
- 重大度: S3 (退会後に Stripe の請求が残る点は CR-L2-03 と同じ火種だが、到達には Web の Stripe 契約者が殻で /start を URL 直打ちして二重に購入する必要があり、UI の導線は無い。主要動線は破れていない) / 種別: 整合・完全性 (コード読みによる反例)
- 対象:
  - app/start/page.tsx:11-39 (plan / planStatus を select せず、契約中でも StartClient を描く)
  - app/api/apple/verify/route.ts:26-28 と app/_libs/apple/appleServer.ts:112-152 (Stripe の契約が生きているかを見ずに billingProvider "apple"・plan "plus"・planStatus・planCurrentPeriodEnd を上書き)
  - app/_libs/billingProviderOf.ts:33 `if (u.billingProvider === "apple") return false`
- 何が問題か: 手順: Web で Stripe 月額 active (planCurrentPeriodEnd +20 日) → iPhone の殻でログイン → /start を開く (session "user"・hasApple になれば購入ボタンが出る) → 購入 → verify → applyTransaction。stale 判定 (:133-134) は Apple の expiresDate (+1 か月) が Stripe の期末より新しいので通り、billingProvider = "apple"・planStatus = "active" (Apple の値) に書き換わる。Stripe の契約は生きているが DB からは分からない。退会すると shouldCancelStripeOnDeletion は :33 で false → cancel を呼ばず、退会後は Customer Portal にも入れない。逆に Stripe が年額 (期末 +10 か月) で Apple 月額を買うと stale で捨てられ、verify は 200 を返すが DB は Stripe のまま → Apple の請求だけが始まり、退会モーダルは Web の注記だけを出す。どちらも「Stripe が正・DB は写し」(stripe.ts ヘッダ) の原則に反して、退会判定が DB の写しだけを見ている。
- 根拠: 上記 3 ファイルの該当行。/start への導線は結果カード・ゲート・ゲストホーム・契約切れの「再開する」のみ (PlanCard:112-128 は isPlus なら action "manage")。start/page.tsx に plan の参照が無いことは全文で確認。
- 期待: (1) start/page.tsx で契約中 (resolveEffectivePlan が plus/trial) なら `/` へ redirect。(2) 退会時の解約判定は billingProvider に依存せず、stripeSubscriptionId があれば `subscriptions.retrieve` で Stripe 側の status を見て live なら cancel (retrieve が resource_missing なら続行)。これで planStatus の共有列に頼らなくなる。(3) 台帳に「契約中の人は /start に入れない」の行を足す (現在 L-01〜L-31 に無い・台帳の抜け 1)。

#### CR-L4-02 webhook が billingProvider = "stripe" を無条件に上書きし、Apple 契約者に Stripe の遅延イベントが届くと契約が DB から消える
- 重大度: S3 (発生は Stripe の再送・遅延に限られる。起きたときは Apple 契約中なのに PlanCard 契約切れ・退会モーダルで Apple の注記が消えて Web の注記が出る、という文面と事実の反転) / 種別: 整合 (コード読みによる反例)
- 対象: app/api/stripe/webhook/route.ts:67-87 applySubscription (`data: fields` をそのまま updateMany)、app/_libs/stripe.ts:51-60
- 何が問題か: Stripe canceled (planStatus canceled・stripeSubscriptionId 残り) の人が iPhone で Apple を契約 → billingProvider "apple"・plan "plus"。その後、以前 500 を返して再送待ちになっていた customer.subscription.deleted / updated が届く (Stripe は最長 3 日再送。route.ts:62 は handler 失敗を 500 で返す設計) と、applySubscription が plan null・planStatus canceled・billingProvider "stripe" を書き、Apple の契約が DB から消える。Apple の次の通知まで PlanCard は「契約切れ」、録音は needsSubscription。退会モーダルは provider "stripe" → 「Web で契約中の…解約されます」のみで、Apple の解約案内が出ない。plan / planStatus の上書きは以前からあった穴だが、今回 billingProvider が加わって退会の注記まで反転するようになった。
- 根拠: webhook の 4 経路すべてが同じ applySubscription を通り、現在の billingProvider を見ない。appleServer.ts には順序逆転の防御 (:129-136) があるのに Stripe 側には無い非対称。
- 期待: applySubscription で対象 User の billingProvider が "apple" のときは plan 系 4 列を上書きせず stripeSubscriptionId だけ更新する (または Apple の planCurrentPeriodEnd が未来なら捨てる)。stripe.test.ts に「apple の行は上書きしない」のテスト 1 本。

#### CR-L4-03 ライブラリの案内シートに 8 か所目の無条件の「最初の 2 週間は無料」
- 重大度: S3 / 種別: 適合 (社内規則: 「無料」は条件つきの一文のみ)・整合 (CR-L2-05・CR-L3-02 の直し漏れ)
- 対象: app/[userId]/library/LibraryClient.tsx:123 `["最初の 2 週間は無料", "いつでも解約できる"]`
- 何が問題か: 未加入・契約切れの人が「自分の楽譜」を押したときの planModal に出る。契約切れ = 無料期間を使い切った人が主な閲覧者で、その人には無料期間は無い (規約 第5条の2「Apple ID ごとに 1 回」)。ラウンド 2 で挙げた 7 か所と同じ文だが grep から漏れていた。台帳 L-29 の対象列 (gateText/Recorder/home/PlanCard) にも無い (台帳の抜け 2)。
- 期待: 「はじめての方は最初の 2 週間は無料」に揃えるか、この行を落として 2 行にする。listing L128 の数と台帳 L-29 の対象列を 8 か所に直す。

#### CR-L4-04 報告・listing・fix 記録の記述がラウンド 3 の修正と食い違う
- 重大度: S3 / 種別: 証跡の不備
- 対象: docs/verify/legal/99_report.md L4・L6・L22・L35・L8-24 の表、docs/legal/app-store-listing.md L128、docs/verify/legal/04_round-3-fix.md L30
- 何が問題か:
  1. 99_report.md はラウンド 2 時点のまま。「批評 2 ラウンドの指摘 50 件」「ラウンド 3 の批評で S1・S2 ゼロなら合格」「台帳 L-01〜L-30」「『はじめての方は』は gateText・Recorder・home・PlanCard」。実装で足したものの表に billingProviderOf.ts・stripe.ts の billingProvider・バックフィル migration が無い。人にしか確かめられないものに「本番へのバックフィル migration の適用」が無い。
  2. listing L128「円額はアプリ内の 6 か所 (gateText ×3・Recorder・ホームの帯・PlanCard)」は CR-L3-02 の期待で 7 か所に直すよう求めたが据え置き。実際は結果カード・LibraryClient を含めて 8 か所。
  3. 04_round-3-fix.md L30「vitest: billingProviderOf 10 件・stripe 5 件・stripe webhook 2 件 green」。自分の実行では 2 ファイル 17 件 (billingProviderOf は it ブロック 5・expect 13 / stripe.test は it 12)。webhook のテストファイルはリポジトリに無い (`grep -rln webhook --include=*.test.ts` は plan.test.ts のテスト名 1 件のみ)。数え方が書かれていないので裏取りできない。
- 期待: 99_report を v3 に更新 (件数・台帳範囲・実装の表・未実施に migration 適用)。listing L128 を 8 か所に。fix 記録のテスト件数は「ファイル名と vitest の出力の件数」で書く。

#### CR-L4-05 apple モードの Web で Stripe 契約者に「変更・解約は Apple のアカウントページで行います」が出る
- 重大度: S3 (ボタンは Customer Portal を開くのに、直下の注記が Apple を指す。特商法 L86・規約 第5条の5「設定画面の『契約を管理』から解約」を読んで来た人が迷う) / 種別: 整合 (CR-L2-14 の直し残り)
- 対象: app/[userId]/settings/PlanCard.tsx:107 `{!native && (provider === "apple" || apple) && (…Apple のアカウントページ…)}`
- 何が問題か: :69 の manage は `provider !== "stripe"` を先に見るよう直ったが、:107 の注記の条件は直っていない。apple モード (ローンチ後) で Web の Stripe 契約者が設定を開くと、「契約を管理」(→ Customer Portal) の下に「変更・解約は Apple のアカウントページで行います。iPhone の設定 › サブスクリプションからもできます」が出る。
- 根拠: 該当行。provider "stripe" は resolveBillingProvider で Stripe 契約者全員に付くようになったので、この表示は apple モードで必ず出る。
- 期待: 条件を `!native && provider !== "stripe" && (provider === "apple" || apple)` に。Stripe 契約者には「変更・解約は Stripe の管理ページで行います」を出すか、注記なし。台帳に「Web の Stripe 契約者の PlanCard の文言」の行を足す (台帳の抜け 3)。

#### CR-L4-07 SCR-11d のポリシーリンクは殻では同じ WebView に読み込まれ、オンボーディングの回答が失われる可能性が高い
- 重大度: S3 (法務文面ではなく到達性。実機未確認のため「要確認」として出す) / 種別: 完全性・価値
- 対象: app/onboarding/onboardingClient.tsx:686 `<a href="/privacy" target="_blank" rel="noopener">`、native/capacitor.config.ts (server.url = https://arcodaviolin.com・allowNavigation 自ドメイン)、app/components/legal/PrivacyContent.tsx (戻る導線なし・Link 0 件)
- 何が問題か: 殻はリモート URL 方式で、/privacy は同一ホスト。Capacitor の WKWebView はタブを持たないので target=_blank の同一ホストのリンクは同じ WebView に読み込まれる (外部ホストだけ OS ブラウザ)。オンボーディングの回答はクライアント state のみで、保存は最後の completeOnboarding (:715) の一括 → SCR-11d でリンクを押すと 10 段分の回答が消え、PrivacyContent には戻る導線が無いので、戻れるかは iOS のスワイプ操作に依存する。ラウンド 3 の空振り欄は「開けなくてもオンボは進む」と書いたが、逆に「開けてしまって進めなくなる」が実際の危険。/start の 3 リンク (Link・client nav) も同じ構造で、/terms 等に戻る導線が無い。
- 根拠: 上記ファイル。Capacitor の実挙動は手元にソースが無く未確認 (native/node_modules 不在)。
- 期待: 殻ではポリシーをアプリ内のシート (モーダル) で表示するか、`@capacitor/browser` で SFSafariViewController に開く。少なくとも実機で 1 回押して、戻れることを台帳に記録する (人にしか確かめられないもの)。

### S4

#### CR-L4-06 CR-L3-07 の記録先が見つからない
- 対象: docs/verify/legal/04_round-3-fix.md L15「project_teacher_embed_email_pending_tests に記録」
- 内容: 当該メモリファイルに CR-L3-07・REQUIRE_SUBSCRIPTION・getGradingQuota の行は無い。先生機能公開時に見直す約束が箱に入っていない。記録するか、fix 記録から「記録した」を消す。

#### CR-L4-08 ゲスト削除 cron の順序は Storage → DB → Auth で、Auth 削除が失敗すると匿名 Auth ユーザーが永久に残る
- 対象: app/api/cron/guest-cleanup/route.ts:37-46
- 内容: prisma.user.delete の後に supabaseAdmin.auth.admin.deleteUser。後者が失敗すると catch で次へ進み、次回は User 行が無いので候補に上がらない。requestAccountDeletion は Auth-first で巻き戻す設計なのに cron は逆順。Privacy 6.「順次自動的に削除」の趣旨には影響が小さいが、Auth を先に消す (失敗なら行を残して次回再試行) に揃えると漏れが無くなる。Storage の list は limit 1000・ページングなし (ゲストは録音 1 本なので実害なし)。

#### CR-L4-09 退会モーダルの Web の注記が、解約済みの Stripe 加入歴の人にも「契約中」と出る
- 対象: app/[userId]/settings/DeleteAccountModal.tsx:98-101、app/_libs/billingProviderOf.ts:20-25
- 内容: resolveBillingProvider は解約済み (planStatus canceled) でも "stripe" を返す (Customer Portal で履歴を見せるため・設計どおり)。その値で「Web で契約中のアルコプラスは、退会と同時に解約されます。以後の請求はありません」が出るので、契約が無い人に「契約中」と言う。planStatus (または shouldCancelStripeOnDeletion の真偽) を渡して live のときだけ出すか、文を「Web で契約したアルコプラスが残っている場合は、退会と同時に解約されます」にする。

## 3. 裏取りした事実の表

| # | 主張 | 確認した実装・手段 | 結果 |
|---|---|---|---|
| V4-1 | 列が空の Stripe 契約者で退会時の cancel に到達する (CR-L3-01) | billingProviderOf.ts:32-36・requestAccountDeletion.ts:91、test :20-25。vitest 自分で実行 17 件 green | 一致 |
| V4-2 | webhook が以後 billingProvider "stripe" を書く | stripe.ts:36・59、webhook route.ts:69-73・80-83 (fields をそのまま書く 2 経路) | 一致 (無条件上書きの副作用は CR-L4-02) |
| V4-3 | バックフィル migration が Prisma の migration として妥当 | フォルダ名 20260913120000_…・migration.sql はデータのみ・schema.prisma:33 と整合・本番手動は listing L124 と 02_cases L-31 に明記 | 一致 |
| V4-4 | PlanCard の manage は stripe を Customer Portal に最優先 | PlanCard.tsx:69。git diff で旧 `provider === "apple" || (apple && provider !== "stripe")` から変更を確認 | 一致 (注記 :107 は未修正・CR-L4-05) |
| V4-5 | settings / profile が導出値を渡す | settings/page.tsx:32・68、profile/page.tsx:28・39、AccountInfo.tsx:269 | 一致 |
| V4-6 | 反例 (a) Stripe canceled → Apple | resolve "apple"・shouldCancel false・Stripe は既に無い | 正しく動く |
| V4-7 | 反例 (c) billingProvider "apple" で Stripe が生きている人 | shouldCancel :33 で即 false。到達は /start の URL 直打ち + 二重購入 (start/page.tsx にガードなし) | **不一致** (CR-L4-01・S3) |
| V4-8 | /guest/support 配下がゲストで開く (B 新規観点) | curl 8 URL すべて 200 (support/help/tokushoho/terms/privacy/contact/settings/profile) | 一致 |
| V4-9 | 規約 第3条「氏名 (初回のみ)」と callback (B 新規観点) | callback route.ts:42-47 は user_metadata.full_name / name を読み、取れなければ「あなた」。Apple は 2 回目以降に氏名を返さないので文と一致。非公開メールは Supabase Auth 側 | 一致 |
| V4-10 | ポリシー第 2 条「操作履歴 (登録の入口をどこまで進んだか)」と recordGuestEvent (B 新規観点) | recordGuestEvent.ts:10-19 は kind / place / path (/guest 配下・クエリ除去) だけ。ID・cookie・IP を持たない。GUEST_EVENT_KINDS に start_screen / signin_ok / purchase_ok / restore_* があり「どこまで進んだか」と一致。GuestVisitPing の sessionStorage は同一タブの重複防止フラグ | 一致 (開示が実装より広い方向・害なし) |
| V4-11 | cron の削除順序と Storage (B 新規観点) | route.ts:37-46 Storage → DB → Auth。bucket は performances のみ (ゲストは musicxml を持てない) | 動くが順序に漏れの余地 (CR-L4-08・S4) |
| V4-12 | 特商法「動作環境」 | TokushohoContent.tsx:101-102 iOS 【 】・Web は最新の Safari / Chrome / Edge・新規契約なしの注記 | 問題なし |
| V4-13 | LP フッターのリンク先が実在するパス | public/lp/index.html:850 → /terms /privacy /tokushoho。app/terms・privacy・tokushoho の page.tsx 実在。同一ドメイン配下の絶対パス | 一致 (本番 200 は listing L126 の手順) |
| V4-14 | ローンチ前チェックに ENABLE_ACCOUNT_DELETION がある (5.1.1(v)) | listing L127 に env 名・APPLE_* 4 変数・CRON_SECRET | 一致 |
| V4-15 | 特商法の電話番号の省略規定 (追加指示) | TokushohoContent.tsx:29「お客様からのご請求があった場合に、遅滞なく電子メールにてお知らせします。ご請求は上記のメールアドレスまたは本サービス内のサポート画面にあるお問い合わせフォームからお願いします」。法 11 条ただし書・規則 10 条の要件 (請求により遅滞なく提供する旨を広告に表示・提供できる措置) を文として満たす。請求経路のメール欄は同節 :28、お問い合わせフォームは /guest/support/contact が 200 で実在。括弧なし。「電子メールにて」と提供手段まで書いてあり、口頭でなく記録が残る形 | 妥当。留意点 1 つ: 事業者が法人なら 販売事業者 の名称と 住所 は省略できないので、【事業者名】【住所】は引き続き埋める前提 (空欄は指摘対象外) |
| V4-16 | 「無料」の語 (C) | grep: 条件つき 7 か所 + StartClient は introEligible 判定下。LibraryClient.tsx:123 が無条件 | UI 1 件 (CR-L4-03) |
| V4-17 | 括弧 (C・新規 UI 文言) | ArcoResultOverlay:265・help:18・PlanCard:108・Terms:60 (法務文書)・listing 英文。日本語 UI の新規文に括弧なし | 違反なし |
| V4-18 | CR-L3-07 を記録した | メモリ project_teacher_embed_email_pending_tests.md を grep | **不一致** (CR-L4-06) |

## 4. 空振り (探したが問題が見つからなかったもの)

- resolveBillingProvider と guest-cleanup の安全網 `billingProvider: null, plan: "free"`: ゲスト (匿名) は Stripe を持てないので導出の変更は cron に影響しない。
- requestAccountDeletion の Apple 注記 (:112) は resolveBillingProvider === "apple" で判定。Apple の identity だけあって契約が無い人には出ない (hasApple ではなく契約の提供元を見る) → 正しい。
- stripe checkout route.ts:48 の二重加入ガード (stripeSubscriptionId + live status) は据え置きで問題なし。apple モードでも API は残るが UI の導線は無く、Web の新規は「準備中」「iPhone アプリで」で塞がれている。
- Stripe の cancel を canceled 済みの人に投げない設計 (shouldCancel の planStatus 判定): checkout の二重加入ガードと同じ集合 {trialing, active, past_due} で一貫。
- migration の対象に Apple 契約者が混ざる可能性: Apple の経路は必ず billingProvider "apple" を書くので `IS NULL` 条件で除外される。
- 特商法 L86「設定画面の『契約を管理』から解約できます。この契約は退会と同時に解約されます」と実装: apple モードでも Customer Portal に届き (PlanCard:69)、退会で cancel (requestAccountDeletion:93)。文どおり。
- 規約 第13条 L205-208 と退会モーダルの 2 注記の文意一致 (Apple は止まらない・Web は同時に解約)。
- listing L108 Manage or cancel と PlanCard の Apple 契約者の動き (showManageSubscriptions → 失敗時 account.apple.com)。
- 02_cases.csv L-25 の 5 URL: dev で /guest/support 配下を含め 200 (V4-8)。
- knownUser (localStorage の名前とホームの写し): 端末内のみ・サーバー送信なし。ポリシー 13. の「Cookie 等の識別子」で読める範囲。指摘にしない。
- ポリシー 第 2 条「Web ブラウザではブラウザに保存する乱数」: 前ラウンドで deviceKey.ts と照合済み。今回は再確認せず。
- apple モードでの /api/stripe/portal: STRIPE env を残す前提 (listing L125)。消したときのエラー文「管理ページの作成に失敗しました」は既存。
- 04_round-3-fix の eslint 注記 (ArcoResultOverlay:111 の既存エラー): 今回の変更行ではないことを diff の文脈で確認。
- Terms L60 の新文: 「Web ブラウザでログインしてアカウントを作った場合」は callback の Google 経路 (route.ts:50-52 は apple のみ create するので、Google 新規は別の場所で作られる可能性があるが、文は「作った場合」の条件文なので経路に依存しない)。
- 誤字脱字: 今回変更された文 (Terms:60、listing L95・L114・L116・L124、ArcoResultOverlay:265、help:18、csv L-18/20/27/31) を通読。脱字なし。

## 5. 判定

**条件つき合格。**

理由: S1・S2 はゼロ。ラウンド 3 の S2 (CR-L3-01) は、導出関数・解約条件・受け渡し・manage の順序・webhook・migration のすべてを自分の目で確認し、テストを自分の環境で通して閉じた。ラウンド 2 の開き残り 5 件は 03・10・14 を閉じ、05 は 8 か所目が出て一部、09 は Tetsuo 判断。

新規: S3 6 件 (CR-L4-01 契約中の人が /start で Apple を買えて Stripe が残る、02 webhook の無条件上書き、03 LibraryClient の無条件の「無料」、04 報告・listing・fix 記録の不一致、05 PlanCard の Apple 注記が Stripe 契約者に出る、07 SCR-11d のリンクが殻でオンボの回答を失う可能性) / S4 3 件 (06 CR-L3-07 の記録なし、08 cron の削除順序、09 解約済みの人への「契約中」)。

残件の一覧 (S3 以下):
- 今回: CR-L4-01〜09。
- 前ラウンドから: CR-L1-15 (見送り)、CR-L1-18 (Tetsuo)、CR-L2-09 (Tetsuo)、CR-L3-06 (サポート画面の Arcoda・据え置き)、CR-L3-07 (記録先・CR-L4-06 に統合)。

追加指示の特商法・電話番号の省略規定は妥当 (V4-15)。

次に手を付けるなら: CR-L4-01 (start/page.tsx の redirect 1 行 + 退会時は Stripe 側の status を retrieve して判定)、CR-L4-05 (PlanCard:107 の条件 1 語)、CR-L4-03 (LibraryClient:123 の 1 行)、CR-L4-04 (99_report と listing L128)。この 4 つで S3 の実装側は 02・07 だけになる。
