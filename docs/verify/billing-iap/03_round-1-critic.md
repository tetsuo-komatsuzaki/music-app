# 批評 ラウンド 1: 登録と課金 (Apple アプリ内課金)

- 対象: コミット f12bdfb3 (main・本番配信済み)。作業ツリーに未コミットの差分 (middleware.ts・appleServer.ts・LibraryClient.tsx) があるが、批評の対象はコミットである。作業ツリーの差分に触れるときはその旨を書く
- 読んだもの: 00_requirements.md・01_plan.md・02_cases.csv (819 行)・gen_cases.py・要件整理 v2.7 のテキスト抽出 (billing-spec.txt)・コミットの差分 62 ファイルのうち主要 30 ファイル・既存テスト 4 本
- 実行したこと: port 3101 で動いている dev サーバー (私が立てたのではない。plan §1 の apple モードのサーバーと思われる。`npx next dev -p 3111` は「Another next dev server is already running」で起動しなかった) に curl を 9 本。本番 DB への書き込みは行っていない
- 判定は末尾

## 0. 先に結論

不合格。S1 が 2 件、S2 が 7 件。

最も重いのは次の 2 つ。

1. コミット f12bdfb3 の middleware.ts は `/api/apple/notifications` と `/api/cron/guest-cleanup` を PUBLIC_API_PATHS に入れていないので、cookie を持たない Apple のサーバーと Vercel Cron は route に届く前に 401 で止まる (2026-08-08 の Stripe webhook と同じ型)。作業ツリーには既に修正が入っている (未コミット) が、本番はコミットのままである
2. 匿名セッション (1 回ためしを始めた人) が `/guest`・`/guest/*`・`/` を開くと、layout.tsx と app/page.tsx の redirect が互いに投げ合って無限リダイレクトになる。1 回ためしのあとに要件が約束する画面 (使用済みのゲート・「さっきの N 点を残しておこう」・「ゲストにもどる」・ライブラリ) はすべてここを通るので、コードのままでは一つも表示されない

## 1. 試したことの一覧 (空振りを含む)

| # | 試したこと | 結果 |
|---|---|---|
| 台帳の抜け探し 1 | B 軸 (状態 × 画面) に「殻 / Web」の軸が無いことを確認 | 抜け。CR-1-13, CR-1-20 |
| 台帳の抜け探し 2 | B 軸に「匿名セッションで /guest と / を開く」行が無いことを確認 (B のゲスト行はゲストホームが描けることを前提にしている) | 抜け。CR-1-02 |
| 台帳の抜け探し 3 | J 軸 (回帰) に「stripe モード × 設定のプランカード × 未加入ユーザー」が無いことを確認 | 抜け。CR-1-04 |
| 台帳の抜け探し 4 | B' 軸に「DID_FAIL_TO_RENEW のあと本人が「再開する」を押す (既に所有している商品の購入)」が無い。H 軸に「environment=Sandbox の通知が本番 URL に届く (審査時はこれが起きる)」が無い | 抜け。CR-1-18, CR-1-19 |
| 証跡の裏取り 1 | TC-0017 (UUID 重複) の手順「処理済み行を DB に用意して確認」が route の処理順で成り立つか | 成り立たない。CR-1-09 |
| 証跡の裏取り 2 | plan §1 の「匿名セッションの代用 = admin で作った検証ユーザーの cookie」がゲストの経路を通るか | 通らない (`is_anonymous` 判定で別分岐へ)。CR-1-08 |
| 証跡の裏取り 3 | TC-0003 の期待「stripe モードでは従来の checkout が残る」を差分で確認 | PlanCard の Stripe ボタンは撤去済み。残るのはオンボ SCR12 だけ。CR-1-04 |
| 証跡の裏取り 4 | REQ-049「モック v3 と画素一致 (済・29 px)」 | 差分画像が 03/99 のどこにも無い。証跡として画像を evidence/ に置くこと (CR-1-20 に含める) |
| コード読みの反例 1 | REQUIRE_SUBSCRIPTION=false の現状で、購入をキャンセルした人がどこへ行くか | /onboarding へ (CR-1-05) |
| コード読みの反例 2 | planGrant=internal を resolveEffectivePlan の 5 呼び出し箇所すべてが渡しているか | library/page.tsx が渡していない (CR-1-06) |
| コード読みの反例 3 | 匿名セッションで /guest を開いたときの redirect の連鎖 | 無限 (CR-1-02) |
| 実測 1 | port 3101 に `POST /api/apple/notifications {}` と `GET /api/cron/guest-cleanup` を cookie 無しで送る | どちらも route に届いた (400 `signedPayload required` / 401 小文字 `unauthorized`)。しかしそれは作業ツリーの未コミット修正が効いているから。コミットの middleware.ts には無い (CR-1-01) |
| 実測 2 | 同サーバーで `POST /api/apple/verify {}`・`/api/plan/usage` を cookie 無しで | 401 大文字 `Unauthorized` + `WWW-Authenticate: Bearer` = middleware で止まる (公開パスに入っていない側の対照) |
| 実測 3 | 同サーバーで `GET /<存在しない uuid>/library` を cookie 無しで | 307 → `/guest?gate=1&returnTo=...` = middleware は動いている |
| 空振り 1 | 無限リダイレクト (CR-1-02) の実測 | 匿名セッションが要り、本番 DB に書けないので未実測。コードの読み筋だけ |
| 空振り 2 | verifyChain (x5c) を自前 CA で通してみる | 時間の都合で未実施。TC-0018 が自動なので段 4 に任せる |
| 空振り 3 | scores/[scoreId]/page.tsx の `(dbUser as { role?: string }).role` が undefined になる疑い | `findUnique` に select が無いので全列が返る。問題なし |
| 空振り 4 | Recorder の使用済みカードの点数 (quota.guestLastScore) と結果カードの点数の式が違う疑い | どちらも (pitch + timing) / 2 の四捨五入。一致 |

## 2. 指摘

### CR-1-01
- 重大度: S1
- 種別: 適合 / 整合
- 対象: middleware.ts (f12bdfb3) 14-32 行 PUBLIC_API_PATHS。app/api/apple/notifications/route.ts・app/api/cron/guest-cleanup/route.ts
- 何が起きるか: Apple のサーバーは cookie 無しで POST する。Vercel Cron は `Authorization: Bearer` だけで GET する。middleware は `/api/*` で `supabase.auth.getUser()` が null なら `unauthorizedResponse()` を返すので、どちらも route に届かない。契約の状態は永遠に更新されず (無料期間中の人は trialing のまま 1 日 8 本で止まり続け、失効も返金も反映されない)、期限切れゲストも消えない。resolveEffectivePlan は planCurrentPeriodEnd を見ないので、通知が来ない限り状態は自然には変わらない
- 再現手順: `git show f12bdfb3:middleware.ts | grep -n "apple\|cron"` → 0 件。コミットの状態でサーバーを立て `curl -i -X POST http://localhost:PORT/api/apple/notifications -H "Content-Type: application/json" -d '{}'` → `401 {"error":"Unauthorized"}` + `WWW-Authenticate: Bearer` (route なら `400 {"error":"signedPayload required"}`)
- 根拠: コミットの middleware.ts の PUBLIC_API_PATHS は `/api/stripe/webhook` と `/api/waitlist` だけ。同ファイルのコメント自身が「ここで遮断すると課金反映が全滅する (2026-08-08 調査 Wave2 で発見)」と書いている。作業ツリー (未コミット) の middleware.ts には 2 パスが足されており、port 3101 では route に届くことを実測した
- 期待: REQ-020・REQ-021・REQ-034 の前提として「cookie 無しの受け口が middleware を通る」を要件表に 1 行立て (完全性の欠け)、TC に「cookie 無し curl が route の応答を返す (middleware の 401 でない)」を自動で入れる。作業ツリーの修正をコミットして本番に出すまで、本番の vercel.json の cron は毎日 401 を打ち続ける

### CR-1-02
- 重大度: S1
- 種別: 適合
- 対象: app/[userId]/layout.tsx 443-446 行と 459-462 行。app/page.tsx 9-13 行
- 何が起きるか: 1 回ためしで匿名セッション (role=guest の User 行あり) を持った人が `/guest` を開く → layout 443: `userId === GUEST_ID` かつ `sessionUser` あり (匿名ユーザーも user) → `redirect("/<uuid>")` → layout 459: role=guest、x-pathname="/<uuid>" は `/scores/` を含まないので `redirect("/guest")` → 443 に戻る → 無限。`/guest/library`・`/guest/scores/<別の曲>`・`/guest/settings` も同じ。`/` (app/page.tsx) は匿名なら `redirect("/guest")` なので同じ輪に入る。したがって 1 回ためしのあと、REQ-012「別の曲を開くと使用済みのゲート」・REQ-040「使用済みなら『さっきの N 点を残しておこう』」・REQ-085「ゲストにもどる」・殻の下タブでライブラリを開く・アプリアイコンから起動し直す、のすべてが ERR_TOO_MANY_REDIRECTS になる。GuestHome.tsx 61-65 行の used 分岐は到達不能
- 再現手順: (匿名サインイン有効化後) 殻または Web+apple で曲のゲート「登録なしで 1 回ためす」→ 録音でも録音なしでも可 → アドレスバーで `/guest` を開く。匿名を使わずに再現するなら、検証ユーザーの User.role を guest にして cookie を付け `curl -i http://localhost:PORT/guest` → 307 `/<uuid>` → `curl -i http://localhost:PORT/<uuid>` → 307 `/guest` (輪は DB の role と session の有無だけで決まる)
- 根拠: 上記行の引用。`redirect(`/${sessionUser.id}`)` に `is_anonymous` の除外が無い。`redirect(path.replace(`/${userId}`, `/${GUEST_ID}`))` の戻り先が 443 の条件を満たす
- 期待: REQ-037 の設計どおり「匿名ユーザーは /guest/... を見る」なら、layout 443 は `sessionUser && !sessionUser.is_anonymous` で分岐すべき。台帳に「匿名セッションで /guest・/・/guest/library・/guest/scores/<別の曲> を開いて 200」を自動で追加

### CR-1-03
- 重大度: S2
- 種別: 適合 / 要件表の narrowing
- 対象: app/components/guest/gateText.ts 33-39 行 (`resume`)。app/[userId]/scores/[scoreId]/page.tsx・app/[userId]/practice/[category]/[itemId]/page.tsx・lessons・progress
- 何が起きるか: 要件の出所 (v2.7 §2 表「猶予切れ・期末で失効」行と §8-8 確定) は「曲を開いた時点でゲート『再開する』／基礎練: 同じゲート／レッスン・カルテもゲート」と書く。実装では `GATE_TEXT.resume` の呼び出し箇所が 0 件 (`grep -rn "GATE_TEXT.resume" app` → 定義のみ)。`practiceAllowed` を読む UI も 0 件 (getSignedUploadUrl.ts:100 だけ)。契約切れの人が曲や教材を開くと、譜面・練習前シート・ふりかえり・全部が通常どおり出て、録音欄だけが Recorder のカードになる。00_requirements.md の REQ-013 受入条件は「録音画面に『再開する』カード。ゲート主ボタン『再開する』」と書いて出所より狭い
- 再現手順: REQUIRE_SUBSCRIPTION=true の状態で verify-billing-expired で `/<uuid>/scores/<id>` と `/<uuid>/practice/<cat>/<item>` を開く。ゲートは出ない
- 根拠: grep の結果 (呼び出し 0 件)。02_cases.csv の B 行「契約切れ・返金後 × 曲詳細のゲート = ゲート resume」「契約なし × 基礎練 = practiceAllowed false」は、実行すれば落ちる
- 期待: 出所どおり曲・教材・レッスン・カルテの入口に GuestGate (primaryHref="/start"・primaryLabel="再開する"・noLater) を重ねる。または REQ-013 を「録音欄のカードだけ」に落とすなら、それは要件の変更なので AMB として人に戻す (AMB-006 が「カルテは開ける」と決めたのは §2 表の「閲覧」と整合するが、曲・教材・レッスンのゲート省略は決めていない)

### CR-1-04
- 重大度: S2
- 種別: 整合 (stripe モード = いまの本番の回帰)
- 対象: app/[userId]/settings/PlanCard.tsx (差分で `/api/stripe/checkout` 呼び出し・「月額 980円で始める」「年額 9,800円・2ヶ月分お得」を削除)。app/components/Recorder.tsx 1049-1055 行 (上限カードの「アルコプラスで無制限にする →」を削除)。app/start/StartClient.tsx 191-203 行
- 何が起きるか: NEXT_PUBLIC_BILLING_MODE 未設定 (本番) で plan=free の人 (段0 で 25 件) が設定を開くと、PlanCard は `apple=false`・`billingEnabled=true` で「未加入」→ `canShow` は Web で true → `<Link href="/start">アルコプラスをはじめる</Link>`。/start は殻でないので「アルコプラスは iPhone アプリではじめられます」+ NEXT_PUBLIC_APP_STORE_URL 未設定なら「ゲストにもどる」(/guest → ログイン中なので自分のホームへ戻される)。Stripe で買える入口は消え、iPhone アプリも存在しない。REQ-003「未設定 (stripe) のときは従来どおり」に反する。残る Stripe 導線はオンボ SCR12 の 1 か所だけ
- 再現手順: stripe モードのサーバー (plan の 3102) に plan=free の既存ユーザーでログインし `/<uuid>/settings` → 「アルコプラスをはじめる」→ `/start`
- 根拠: `git show f12bdfb3 -- "app/[userId]/settings/PlanCard.tsx" | grep -n "^-.*\(checkout\|980\|9,800\)"` → 116, 198, 206 行。PlanCard.tsx 現行 111-121 行の `v.action === "start"` 分岐に Stripe の経路が無い
- 期待: stripe モードでは従来のボタンを残す (isAppleBilling() で分岐) か、REQ-003 を「Stripe の新規加入導線はモードに関わらず止める」に改め、Tetsuo の決定として書く。台帳 J 軸に「stripe モード × PlanCard × 未加入」「stripe モード × Recorder 上限カード」を自動で追加 (現状の J 行はすべて「読解」)

### CR-1-05
- 重大度: S2
- 種別: 適合
- 対象: app/[userId]/layout.tsx 465-469 行。app/start/StartClient.tsx 122 行・262 行
- 何が起きるか: /start で Apple サインインまで済ませ (role=student の User 行ができる)、購入シートをキャンセルした人は plan=free のアカウントになる。この人が「ゲストにもどる」(`/guest`) を押す → layout 443 で自分の `/<uuid>` へ → 465 でオンボ未完了なので `/onboarding`。REQ-046「契約なしのアカウント (購入キャンセル) にも出さない」・v2.7 §0「決済していない人にオンボーディングは出さない」に反する。オンボ完了後はホームに着き、REQUIRE_SUBSCRIPTION=false の現状では 1 日 8 本の採点が契約なしで使える (= 無い筈の無料プラン)
- 再現手順: 偽ブリッジで purchase が `{status:"cancel"}` を返す設定にし、Apple 済み (app_metadata.providers に apple) の検証ユーザーで /start → CTA → 「ゲストにもどる」
- 根拠: layout 465-469 に plan/契約の条件が無い。TC (REQ-046) の期待欄自身が「★実装を確認」と書いている
- 期待: layout のオンボ誘導に「契約あり (resolveEffectivePlan が plus/trial、または planGrant)」の条件を足すか、契約なしの人の着地先 (/start に留める・ホームを契約切れ表示にする) を決めて要件に書く

### CR-1-06
- 重大度: S2
- 種別: 適合
- 対象: app/[userId]/library/page.tsx 67 行 (select) と 76 行
- 何が起きるか: `resolveEffectivePlan({ plan, planStatus, createdAt })` に planGrant を渡していない (select にも無い)。planGrant=internal・plan=free の運営アカウントは canUpload=false になり、ライブラリの「自分の楽譜を取り込む」が消える。REQ-017「planGrant=internal は契約中扱い」と REQ-015「取り込みは契約中だけ」の交点が破れる。ローンチ手順 (§9: admin 2 件に planGrant を付けてから REQUIRE_SUBSCRIPTION=true) を踏んだ瞬間に Tetsuo の取り込みが止まる
- 再現手順: verify-billing-internal で `/<uuid>/library` を開く。取り込みボタンが無い
- 根拠: 76 行の引数。app/[userId]/page.tsx 822 行は planGrant を渡しており、呼び出し箇所ごとに揃っていない
- 期待: planGrant を select して渡す。台帳 J 軸の「resolveEffectivePlan( 5 箇所」を「読解」から「自動 (各呼び出しが planGrant を渡す grep)」に変える。02_cases の B 行「運営 planGrant × ライブラリ = 取り込み可」は実行すれば落ちる

### CR-1-07
- 重大度: S2
- 種別: 適合 / 価値
- 対象: app/_libs/apple/appleServer.ts applyTransaction 116-126 行 (コミット)。作業ツリーの未コミット差分 129-134 行 (stale 防御)
- 何が起きるか: (a) 通知の順序逆転: 同じ originalTransactionId について、DID_RENEW (期末 +30 日) のあとに遅れて届いた古い EXPIRED (期末が過去) を、コミットの実装はそのまま expired で上書きする。台帳 F 行「通知の順序逆転」が ★ として認識している。作業ツリーの防御は `!renewal` を条件に入れているが、App Store Server Notifications V2 のサブスク通知は signedRenewalInfo を伴うのが普通なので、通知経路 (renewal 非 null) では防御が働かず、verify/restore (renewal null) でしか効かない。書いた目的と逆
- (b) 別の契約の後追い: 本人が Apple ID を変えて再契約し、`forUserId` 経路で appleOriginalTransactionId が OTX-A から OTX-B に上書きされた後、OTX-A の遅い通知 (EXPIRED や REFUND、appAccountToken に本人の UUID) が届くと、owner 検索 (OTX-A) は null → appAccountToken で本人に当たる → OTX-A・expired で上書き。生きている OTX-B の契約が画面上は契約切れになる
- 再現手順: scripts で verify-billing-active (OTX-B・active・periodEnd +44 日) に対し `applyTransaction({originalTransactionId:"OTX-A", appAccountToken:<本人 UUID>, expiresDate: 過去, ...}, renewal)` を呼ぶ → planStatus=expired・appleOriginalTransactionId=OTX-A
- 根拠: 116-126 行の owner/target 決定。作業ツリー差分 131 行の `&& !renewal`
- 期待: 「同じ契約」だけでなく「本人に結び済みの契約と違う originalTransactionId の通知は、期末が古ければ捨てる」まで含める。renewal の有無を条件にせず、tx.expiresDate と signedDate で比較する。台帳の F 行を「半自動 / 読解」ではなく scripts で回す自動に格上げする

### CR-1-08
- 重大度: S2
- 種別: 証跡の不備 (計画の代用手段が無効)
- 対象: 01_plan.md §1「匿名セッションが要るケースは、supabaseAdmin で作った検証ユーザーのセッション cookie を playwright に渡して代用する」
- 何が起きるか: ゲストの経路はすべて `user.is_anonymous` で分岐する (app/actions/guestTry.ts 219 行・250 行、app/page.tsx 9 行、app/start/page.tsx 290 行、app/start/StartClient.tsx 110 行)。admin.createUser で作ったユーザーは is_anonymous=false なので、ensureGuestUser は「ログイン中のアカウントでは 1 回ためしは使えません」を返し、getGuestTryState は empty を返し、/ は自分のホームへ飛ぶ。REQ-030・035・037・040 (使用済み)・042・044・045・085、B 軸のゲスト 20 行、D 軸「1 回ためす」15 行、E 軸「ゲスト匿名」8 行、およそ 50 行が、別の分岐を通って空振りするか、原因違いで落ちる
- 再現手順: 代用 cookie で `/guest/scores/<id>` のゲートから「登録なしで 1 回ためす」を押す → エラー文言
- 根拠: 上記行の `!user.is_anonymous` 判定
- 期待: Supabase ダッシュボードで匿名サインインを有効化する (ローンチに必須で、切り替えはトグル 1 つ) か、service role で `auth.users.is_anonymous = true` を検証ユーザーに書く。どちらも無理なら、それらの行を「人へ」に変え、判定欄に「未実施」と正直に書く

### CR-1-09
- 重大度: S2
- 種別: 証跡の不備 (計画どおりでは観測できない)
- 対象: 02_cases.csv TC-0017 (UUID 重複)・TC-0020 (token 不一致 403)・TC-0024 (no_user 200)。app/api/apple/notifications/route.ts 21-31 行
- 何が起きるか: route は署名検証 (21-27 行) を通ってから notificationUUID を引く (30 行)。署名の通らない JWS では 400 で終わるので、処理済み行を DB に用意しても `duplicate:true` は観測できない。TC-0020 の 403 と TC-0024 の 200 も同じ理由で curl では到達しない。台帳はこれらを「読解」にしているが、app/_libs/apple/appleServer.test.ts が既に `vi.mock("server-only")`・`vi.mock("@/app/_libs/prisma")` を使っているので、route の handler を import して `vi.mock` で verifyAppleJws を差し替えれば自動で確かめられる
- 再現手順: 処理済み AppleNotification 行を作ってから同じ UUID を含む未署名の signedPayload を POST → 400 invalid signature
- 根拠: route の処理順
- 期待: TC-0017/0020/0024 と A 行 REQ-028 を vitest (route 単体 + mock) の「自動」に変える。「読解」69 行のうち同様に自動化できるもの: REQ-016 (scripts で Performance 件数の前後比較)、REQ-033 (exchangeCodeForSession を mock)、REQ-052/060/083 (app_metadata.providers に apple を持つ検証ユーザー + 偽ブリッジで playwright)、REQ-059 (playwright ハーネスで planView=expired を渡す)、REQ-072/090 (completeOnboarding を検証ユーザーの cookie で呼び DB を読む)

### CR-1-10
- 重大度: S3
- 種別: 価値
- 対象: app/[userId]/home.tsx 124-130 行、app/components/Recorder.tsx 1051-1059 行、gateText.ts resume
- 何が起きるか: 一度も契約したことのない plan=free のアカウント (購入キャンセルの人、既存のメール登録者) に、REQUIRE_SUBSCRIPTION=true で「アルコプラスが終了しています。採点と基礎練が止まっています。記録は残っています」と出る。PlanCard は「未加入」と「契約切れ」を分けているのに、ホームと録音欄は分けていない。「終了」と言われた新規の人は「何かを失った」と読む (だまされた・迷う)
- 再現手順: verify-billing-free で REQUIRE_SUBSCRIPTION=true のホーム
- 根拠: home.tsx planView は `eff === "free" && REQUIRE_SUBSCRIPTION` だけで expired を返す (page.tsx 825 行)
- 期待: planStatus が expired/canceled のときだけ「終了しています」、それ以外は「アルコプラスをはじめると採点できます」型の文言に分ける

### CR-1-11
- 重大度: S3
- 種別: 適合 (REQ-036)
- 対象: app/start/StartClient.tsx 120 行。app/_libs/guestEvents.ts
- 何が起きるか: doPurchase は購入シートを出す前に無条件で `purchase_cancel` を記録する。成功・pending・error のときも cancel が 1 件立つので、離脱率の計測が壊れる (成功率 100% でも cancel が同数)。`try_result` と `signin_cancel` は型にあるだけで記録箇所が 0 件 (`grep -rn "try_result\|signin_cancel" app` → guestEvents.ts のみ)。TC (REQ-036) の期待「StartClient・guestTryClient が記録する」は guestTryClient について誤り (記録するのは GateSheet)
- 再現手順: 偽ブリッジで purchase ok → GuestEvent に purchase_cancel と purchase_ok の両方
- 根拠: 120 行のコメント「既定は『途中』」
- 期待: cancel は `r.status === "cancel"` のときだけ。try_result は解析完了 (ArcoResultOverlay の guestTrial 表示時) で記録。signin_cancel は OAuth から戻らなかったことを次回 /start 表示時に補記するか、記録しないなら型から外して REQ-036 を直す

### CR-1-12
- 重大度: S3
- 種別: 価値
- 対象: app/_libs/plan.ts getGradingQuota の guest 分岐 (`analysisStatus: { in: ["queued", ...] }`)。app/actions/guestTry.ts 254 行。app/actions/getSignedUploadUrl.ts 149-157 行
- 何が起きるか: Performance 行は署名 URL 発行時に queued で作られる。ゲストがアップロード中にアプリを閉じる・電波が切れると、行は queued のまま残り、guestUsed=1 で 1 回は消費済み。結果は無いのに録音欄は「この採点を残してつづける」(点数なし) になる。登録ユーザーの countDailyGradings は queued を数えないので、ゲストだけ厳しい。台帳 D 行「1 回ためす × 通信を切る」の期待「途中で離れても再開できる」は、この実装では成り立たない
- 再現手順: ゲストで録音 → 署名 URL 発行後に route.abort で Storage への PUT を落とす → ライブラリ (CR-1-02 が直っていれば) → 曲を開く → 使用済み
- 根拠: 上記行
- 期待: ゲストも queued を数えない (error と同じく「取り直せる」) か、数える決定なら D 行の期待を「1 回は消費される」に直して人の判断に戻す

### CR-1-13
- 重大度: S3
- 種別: 要件そのものへの疑義 (AMB-005) / 適合
- 対象: app/[userId]/scores/[scoreId]/page.tsx 315-318 行。00_requirements.md AMB-005
- 何が起きるか: `getGuestTryState()` はセッション無しで `{ready:false, used:false, ...}` を返し、`canTry = !!tryState && !tryState.used` は true。したがって Web (ブラウザ) + apple モードでも曲のゲートに「登録なしで 1 回ためす」が出て、押せば signInAnonymously が走り、ブラウザで 1 回ためしができる (localStorage の乱数キーなので、シークレットウィンドウで何度でも)。AMB-005 の解釈「使えない (App Store へ)」と実装が食い違い、同じ Web のゲストホームは「iPhone アプリで登録」を出しているので画面同士も矛盾する。一方、出所 v2.7 §1 は端末の識別子として「ブラウザの記録 (Web 版)」を明記しており、AMB-005 の解釈自体が出所と合っていない
- 再現手順: Web+apple のサーバーで cookie 無しに `/guest/scores/<id>` → ゲートの主ボタンの文言
- 根拠: 上記行。`ready` を見ていない
- 期待: 人の判断に戻す。Web で許すなら AMB-005 を改め、悪用の上限 (解析 1 本分 × ブラウザ数) を受け入れると書く。許さないなら `tryState.ready || isNativeApp` 相当の条件を足す。台帳に「Web+apple × 曲詳細のゲート」を追加 (B 軸に殻/Web の軸を足す)

### CR-1-14
- 重大度: S3
- 種別: 価値
- 対象: app/start/StartClient.tsx 176-185 行
- 何が起きるか: `/start?step=purchase` は hasApple・価格取得済みなら描画直後に doPurchase を自動で走らせる。OAuth 戻りのための仕組みだが URL に残るので、購入をキャンセルした直後に再読込すると、指一本触れずに Apple の購入シートが再び出る。signin_ok もそのたびに記録される。台帳 D 行「はじめる→購入 × 再読込」の期待「?step=purchase で続きから」はこれを正常扱いにしてしまっている
- 再現手順: 偽ブリッジ + Apple 済み検証ユーザーで `/start?step=purchase` を 2 回読み込む
- 根拠: `resumed` は ref なので再マウントで初期化される
- 期待: 続きを 1 回走らせたら `router.replace("/start")` で step を消す。D 行の期待を「再読込でシートは再び出ない」に直す

### CR-1-15
- 重大度: S3
- 種別: 適合 (REQ-052) / 要件そのものへの疑義
- 対象: app/start/StartClient.tsx 110-112 行。app/login/page.tsx 176-181 行
- 何が起きるか: session="user" で hasApple=false (メールや Google のアカウントで殻にログインしている人) が CTA を押すと `signInWithOAuth({provider:"apple"})` が走り、セッションは Apple の identity のアカウントに置き換わる。購入はそのアカウントに結ばれ、元のアカウントの記録とは別になる。また REQ-055 で殻の /login から Google を消したので、Web で Google 登録した人は殻にログインできない (既存は開発用だけなので今は実害なし、だが恒久の性質)
- 再現手順: メールでログイン済みの検証ユーザーで /start → CTA (偽ブリッジ不要・OAuth の URL 生成まで)
- 根拠: 110-112 行の分岐 (anon は linkIdentity、user は signInWithOAuth)
- 期待: user セッションでも linkIdentity を使う (Supabase の手動リンク設定が前提) か、「Apple 以外のアカウントでは殻で買えない」を要件に明記し画面で伝える

### CR-1-16
- 重大度: S3
- 種別: 適合 (AMB-004)
- 対象: app/auth/callback/route.ts 307-315 行。app/actions/guestTry.ts 232 行
- 何が起きるか: ゲストから昇格した人は name が「ゲスト」のままで、Apple が氏名を渡さない 2 回目以降のサインインでは上書きされない (appleName が空なら name を触らない)。「あなた」になるのは新規行だけ。AMB-004 の解釈と食い違う。SCR-02b で上書きされる前提だが、SCR-02b は空なら進めないので実害は小さい。ただし台帳 H 行「Apple 氏名なし → あなた」は昇格経路で落ちる
- 再現手順: role=guest の検証ユーザーで callback を模す (exchangeCodeForSession を mock) と name="ゲスト"
- 根拠: 309 行の `...(appleName ? { name: appleName } : {})`
- 期待: 昇格時に appleName が空なら「あなた」を書く。H 行に「昇格経路」を足す

### CR-1-17
- 重大度: S3
- 種別: 整合
- 対象: app/api/cron/guest-cleanup/route.ts 159-163 行。app/api/apple/verify/route.ts 95 行。appleServer.ts applyTransaction
- 何が起きるか: verify/restore/通知は target の role を見ないので、昇格に失敗した (callback の updateMany が走らなかった) 匿名ユーザーに plan=plus が書ける。その行は role=guest・guestExpiresAt あり のままなので、30 日後に Cron が Performance・音声・Auth ごと消す。払った人の記録が消える。台帳 E 行「ゲスト匿名 × verify」の ★ はこの入口を疑っているが、Cron まで追っていない
- 再現手順: scripts で role=guest・guestExpiresAt=昨日 の検証ゲストに applyTransaction(forUserId) を適用 → plan=plus → Cron を叩く → 消える
- 根拠: Cron の where は `{ role: "guest", guestExpiresAt: { lt: now } }` のみ
- 期待: Cron の where に `billingProvider: null` を足す (安全網)。applyTransaction か verify で role=guest を拒む (先に昇格させる)。E 行の期待に Cron の帰結を足す

### CR-1-18
- 重大度: S3
- 種別: 要件そのものへの疑義 / 価値
- 対象: 00_requirements.md REQ-054 の「お支払いに問題」状態。appleServer.ts derivePlanStatus。PlanCard.tsx viewOf
- 何が起きるか: Apple の経路では DID_FAIL_TO_RENEW が即 expired なので、PlanCard の「お支払いに問題があります」は Stripe の past_due 以外で到達しない。v2.7 §2 表「支払い失敗」行は「設定に『お支払いに問題があります・再開する』。決済が通れば自動で戻る」と書き、実装は「契約切れ・再開する」を出す。Apple がまだ再試行している最中に「契約切れ」を見て「再開する」を押すと、StoreKit は既に所有している商品の購入になる (Apple のシートが何を出すかは Sandbox で要確認)。AMB-001 は猶予の有無を扱ったが、この文言と動線は扱っていない
- 再現手順: verify-billing-expired (billingProvider=apple・appleAutoRenew=true) の設定画面 → 「契約切れ」
- 根拠: derivePlanStatus は isInBillingRetryPeriod で expired を返し、past_due を書く経路が無い
- 期待: 人へ。「請求リトライ中」を planStatus=expired + appleAutoRenew=true (かつ renewal.isInBillingRetryPeriod) で判別し、PlanCard とホームで「お支払いに問題があります。Apple が再試行しています」を出すか、REQ-054 から「お支払いに問題」を Apple 経路の状態として外す。台帳 B' に「DID_FAIL_TO_RENEW 後に再開するを押す」を人の手順として追加

### CR-1-19
- 重大度: S4
- 種別: 完全性 (要件表の漏れ) / 改善提案
- 対象: 00_requirements.md
- 内容:
  - (a) v2.7 §3 ゲストホーム「帯 (未使用の端末だけ)」: 実装の帯は `?try=1` を見ず、apple モードのゲストがライブラリを開くたびに出る (library/page.tsx 74 行)。`?try=1` は死んだパラメータ。REQ-040 の受入条件「CTA → 帯」と「常に帯」のどちらが正か要件に書く
  - (b) v2.7 §3「結果を閉じたあと … 曲詳細から離れると、その曲を開いたときは使用済みのゲート」と REQ-012「使用済み端末は結果を見られる」(実装: ためした曲は本人 URL へ redirect) が出所内で食い違う。AMB に無い
  - (c) v2.7 §7・§10-1・§10-3: /start が `/terms`・`/privacy` にリンクするが、そこに課金条項が無い (project_legal_docs_pending)。審査 3.1.2 は自動更新の条件と規約リンクを要求するので、要件表に「範囲外だがローンチ阻害」として明記する
  - (d) StartClient 224 行「2ヶ月分お得」は固定文字列。REQ-050 の趣旨 (価格は StoreKit) からすると、価格ポイントが変わると嘘になる。price から計算するか注記する
  - (e) TC-0001 の grep パターンは 4 語だけ。「無料採点」(Recorder にあった) 型を取り逃す。`無料` で全件を出し、許容一文をホワイトリストにする方が確実
  - (f) H 軸に「environment=Sandbox の通知が本番の URL に届く」を足す。審査は Sandbox の取引で本番サーバーを叩くので、受け入れるのが正だが、その決定が要件に無い
  - (g) E 軸に「先生 role × verify」を足す。先生に plan が書けるが PlanCard は先生に出ない

### CR-1-20
- 重大度: S4
- 種別: 証跡の不備 / 改善提案
- 対象: 01_plan.md §1・§2。02_cases.csv B 軸
- 内容:
  - REQ-013/018 の検証は REQUIRE_SUBSCRIPTION=true が要るが、これは env でなく plan.ts のコンパイル時定数。plan §1 の環境変数の節に、どう true にするか (一時的なコード編集・別サーバー・どの TC 群がそれに依存するか) が無い
  - 検証データ verify-billing-expired (plan=free・planStatus=expired) は applyTransaction が実際に書く形 (plan="plus"・planStatus="expired") と違う。resolveEffectivePlan の結果は同じだが、seed は書き手を写すべき。planGrant.test.ts 19 行の「free/expired は free」も seed の形を試しており、書き手の形 (plus/expired) を試していない
  - B 軸に殻/Web の軸が無い。Web+apple で意味を持つ画面 (曲詳細のゲート・設定の契約切れ・/login・/start・ゲストホーム) を最低 8 行足す
  - REQ-049「モック v3 と画素一致 (済・29 px)」の差分画像を evidence/ に置き、TC の証跡欄から参照する

### CR-1-21
- 重大度: S4
- 種別: 改善提案 (安全)
- 対象: app/[userId]/layout.tsx 462 行 `if (!allowed && path)`
- 内容: x-pathname が空なら redirect しない (fail-open)。middleware の matcher から外れる経路や、将来の rewrite で header が落ちると、匿名ゲストが本人 URL の全画面を開ける。`!allowed` だけで redirect し、path が空のときは `/guest` に送る。M 軸に「x-pathname 無しでの layout の振る舞い」を足す

### CR-1-22
- 重大度: S4
- 種別: 改善提案 (安全)
- 対象: app/_libs/apple/appleServer.ts verifyChain
- 内容: 根が Apple Root CA G3 であることは確かめるが、leaf が App Store のレシート署名用 (OID 1.2.840.113635.100.6.11.1) であることも、中間が WWDR であることも見ていない。Apple の公式ライブラリは OID を照合する。Apple Root G3 配下の他の leaf で署名された JWS を通す余地がある (実害は Apple の鍵管理次第で低い)。TC-0018 に「OID 違いの leaf」は作れないので読解で可

## 3. 作業ツリーの未コミット差分への所見 (対象外だが、次のラウンドで見る)

- middleware.ts: CR-1-01 の修正。コミットして本番に出すまで本番は壊れたまま。TC に「cookie 無し curl が route に届く」を足すこと
- appleServer.ts の stale 防御: CR-1-07 に書いたとおり `!renewal` の条件で通知経路を外している。目的と逆なので直すこと
- LibraryClient.tsx: 「Webのアルコダから」の文言差し替え。REQ-002 の対応。問題なし

## 4. 判定

不合格。

- S1: CR-1-01, CR-1-02
- S2: CR-1-03, CR-1-04, CR-1-05, CR-1-06, CR-1-07, CR-1-08, CR-1-09
- S3: CR-1-10 〜 CR-1-18
- S4: CR-1-19 〜 CR-1-22

次のラウンドで最低限見せてほしい証跡: (1) 匿名セッションで /guest・/・/guest/library・/guest/scores/<別の曲> が 200 になる playwright の記録、(2) コミット済みの middleware で cookie 無し curl が route の応答を返す記録、(3) REQUIRE_SUBSCRIPTION=true をどう作ったかの記録と、契約切れの曲・教材のゲートの撮影、(4) stripe モードの設定画面 (未加入ユーザー) の撮影、(5) verifyAppleJws を mock した route 単体テストの green。
