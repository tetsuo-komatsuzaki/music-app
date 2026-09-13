# 批評 ラウンド 2: 登録と課金 (Apple アプリ内課金)

- 対象: コミット f12bdfb3 + 作業ツリーの未コミット差分 (25 ファイル・+166/-56。`git diff --stat` 2026-09-13)。main の HEAD 28bc63f7 は別件
- 読んだもの: 00_requirements.md (REQ-020b・AMB-007〜012・EXTRA-008〜013 を含む)・01_plan.md・02_cases.csv (879 行)・03_round-1-critic.md・04_round-1-fix.md・evidence/ 配下 (api_before_fix / api_round / api_cron / apply_transaction / screens*.json / require/screens.json / quota_require_* / grep / vitest / clean_recheck / upload_tab / start_diff)・差分 25 ファイルの全文と、周辺 (guestTry.ts・verify/restore/notifications route・cron・GateSheet・GuestGate・GuestHome・knownUser・middleware・onboarding/page.tsx・BottomTabs・arcodaAuthBrowser)
- 自分の手で実行したもの (すべて読み取り。app/ は書き換えていない。DB への書き込みなし):
  - `npx tsc --noEmit` → エラー 0
  - `npx vitest run` 課金関連 7 ファイル → 7 files / 60 tests passed
  - port 3101 (apple モード) に cookie 無し curl 4 本
  - scripts/_tmp_critic_users.ts (検証ユーザー 7 件・auth.users の is_anonymous と providers・本番の plan × planStatus・AppleNotification 件数・GuestEvent 種別) の読み取り
  - scripts/_tmp_critic_r2.mjs (playwright): trial の設定・ログイン済みでの /login・/karte と /progress・端末記録ありのゲスト曲ゲート・expired の /start (殻・導入オファー対象外)。出力は evidence/critic-r2/ (screens.json + r2_*.png)
  - 画像を目で確認: screens/onb_trial_settings.png・anon_back_to_guest2.png・require/expired_song.png
- ゲストの匿名セッションは削除済みで、本番 DB に書けない規則のため作り直していない。匿名が要る項目は実装者の証跡 (evidence/screens/anon_*) と読解で判断し、その旨を書く
- 判定は末尾

## 0. 先に結論

不合格。S2 が新規 3 件 (CR-2-01〜03) と、04 §3 の O-1 (S2 で妥当・しかも本番で既に起きている)。

最も重いのは次の 3 つ。いずれもラウンド 1 の「直した」の中か、その直しの影で生まれたもの。

1. CR-1-03 の「契約切れ・契約なしの曲・教材・レッスンにゲート」は、シートの主ボタンが「再開する」ではなく「ログイン」になる。実装者の証跡 evidence/require/expired_song.png 自身がそれを写しており (主ボタン「ログイン」・副「アカウントがない人は再開する」)、04 §1 は見出しだけを読んで「再開する」と記録している。ログイン済みの人が「ログイン」を押すと middleware がホームへ送り返すので、契約切れの人が曲から再開する主要動線が成り立たない
2. CR-1-14 の直し (`?step=` を消す `router.replace("/start")`) が、購入成功・復元成功のときの `router.replace("/")` / `router.replace("/onboarding")` を取り消す。Next 16.2.4 の app-router は「後から来たナビゲーションが、進行中のナビゲーションを discarded にする」ので、Apple サインインから戻って購入が成功した人は、ホームでもオンボーディングでもなく /start のプラン選択に戻される。新規ユーザーの本線 (匿名 → Apple 結合 → 戻り → 購入) は全員ここを通る
3. 匿名セッション (1 回ためし中) は /login に到達できない。middleware が「user あり」なら /login を本人 URL へ送り、layout が role=guest を /guest へ送り返す。既にアカウントを持つ人が「1 回ためす」を先に押すと、ゲートとゲストホームの「ログイン」が死に、再インストールか 30 日後の Cron まで自分のアカウントに入れない

## 1. 試したことの一覧 (空振りを含む)

| # | 試したこと | 結果 |
|---|---|---|
| 台帳の抜け探し 1 | B 軸「カルテ を開く」の URL | 台帳は `/<uuid>/karte` を開いて **404 ページを「合格」にしている** (TC-0104/0114/0124/0134/0144/0154、require/ の *_karte も同じ)。本物のカルテは `/progress` (app/[userId]/components/BottomTabs.tsx:29)。AMB-006「契約切れでもカルテは閲覧可」は未検証。CR-2-04 |
| 台帳の抜け探し 2 | B 軸「ゲスト (匿名) × /login を開く」と、ゲート・ゲストホームの「ログイン」リンク | TC-0082/0092 は「Apple ボタン」を期待しているが、匿名セッションでは /login に着かない (middleware → 本人 URL → layout → /guest)。CR-2-03 |
| 台帳の抜け探し 3 | D 軸「はじめる→購入」に「購入が成功したら / → /onboarding に着く」の行が無い (15 行すべて中断系で、成功の着地先を確かめる行が無い) | 抜け。ここが空だったので CR-2-02 が見えなかった |
| 台帳の抜け探し 4 | B 軸「Web+apple × ライブラリ」に帯の行が無い | Web のゲストのライブラリに「登録なしで 1 回だけためせます」が出る (curl で確認)。同じ Web の曲ゲートは CR-1-13 で「iPhone アプリで登録」に変えたので画面同士が矛盾する。CR-2-05 |
| 証跡の裏取り 1 | CR-1-01: 3101 に cookie 無し curl | notifications 400 (route)・cron 401 小文字 `unauthorized` (route)・verify 401 大文字 (middleware) = 04 の記録どおり。本番は f12bdfb3 のままなので本番ではいまも 401 |
| 証跡の裏取り 2 | CR-1-03: require/expired_song.png と require/screens.json の *_song / *_practice / *_lesson の本文 | 6 枚とも本文は「… ログイン アカウントがない人は再開する (はじめる)」。04 §1 CR-1-03 の「+『再開する』」は見出しの文言であり、主ボタンではない。TC-0009 も同じ画像で「合格」 |
| 証跡の裏取り 3 | O-1: onb_trial_settings.png を目で確認 + 自分の手で trial にログインして /settings | 「未加入 … アルコプラスは iPhone アプリではじめられます。」(evidence/critic-r2/r2_trial_settings.png)。再現 |
| 証跡の裏取り 4 | 04 §2「vitest 67 件」 | 私の再実行は 7 files / **60** tests。ソースの `it(` の数は 55 (plan 12・appleServer 11・isNativeApp 7・planGrant 6・gateText 5・notifications 7・verify 7)。67 の根拠が無い (S4・CR-2-09) |
| 証跡の裏取り 5 | CR-1-07: apply_transaction.json の「順序逆転」と「stale: 別契約 OTX-OLD」 | どちらも before=active のまま・stale:true。合格として閉じる。ただし TC-0874 (同じ内容) は台帳で「人へ」のまま (集計の取りこぼし) |
| 証跡の裏取り 6 | 検証データの形 (CR-1-20) | DB 読み取りで expired は plan=plus/planStatus=expired/billingProvider=apple (書き手の形)。trial は plus/trialing。合格 |
| コード読みの反例 1 | StartClient の resume 経路で購入成功したときの着地 | `run.finally(() => router.replace("/start"))` が `router.replace("/")` を取り消す (Next 16.2.4 app-router-instance.js 144-153 行)。CR-2-02 |
| コード読みの反例 2 | 匿名セッションで /login | middleware.ts 81-85 → layout.tsx 52-56 → /guest。CR-2-03。ログイン済みの通常ユーザーで同じ入口を叩くと本人 URL へ飛ぶことを実測 (r2_trial_login_redirect) |
| コード読みの反例 3 | CR-1-12 (queued は 15 分で数えない) の相手側 | getGuestTryState (guestTry.ts 77 行) は queued を無条件に used と数える。quota と食い違う。CR-2-06 |
| コード読みの反例 4 | GateSheet の `noLater` | ボタンを隠すだけで、veil のクリックと Escape で閉じる (104 行・83 行)。閉じると帯「登録かログインで続ける」(98 行)。CR-2-07 |
| コード読みの反例 5 | applyTransaction の stale 規則と既存の Stripe 行 | billingProvider を見ずに planCurrentPeriodEnd と比べるので、Stripe の期末が未来の人が Apple で買うと stale:true で何も書かれず、verify は ok を返す。CR-2-08 |
| 実測 1 | Web (cookie 無し) で /guest/scores/<id> の SSR | 主ボタン「iPhone アプリで登録」(href=/signUp・NEXT_PUBLIC_APP_STORE_URL 未設定)。CR-1-13 の直しは効いている |
| 実測 2 | expired で /start (殻・偽ブリッジ introEligible:false) | 「選んだプランの料金で、今日から再開できます」・注記に「無料」無し。REQ-051 合格 |
| 空振り 1 | CR-1-02 (匿名の無限リダイレクト) の再実測 | 匿名ユーザーを作れない (本番 DB に書かない規則・検証ゲストは Cron が削除済み)。実装者の anon_root / anon_guest_home / anon_guest_library の記録と、layout.tsx 37 行・52 行の読解で閉じる |
| 空振り 2 | 端末に記録がある状態のゲスト曲ゲートで known 分岐を再現 | localStorage に arcoda_known_user があるのに、ゲストの曲ゲートは「iPhone アプリで登録 / ログイン / あとで」の非 known 分岐で描かれた (evidence/critic-r2/r2_known_guest_gate.png)。理由は追い切れていない。契約ゲートについては require/ の 6 枚が known 分岐を写しているので CR-2-01 の根拠には影響しない |
| 空振り 3 | stripe モード (3102) の再実測 | 3102 は起動していない。CR-1-04 は PlanCard.tsx 113-115 行と StartClient.tsx 191-207 行の読解 + 実装者の stripe_web_free_settings.png で閉じる |
| 空振り 4 | O-6 (「準備しています…」のまま 4 秒) | 再現手段なし。startGuestTry → router.push の先が曲詳細 (dev では初回コンパイルが数秒) なので dev の遅さが第一候補。判断は人へのまま |

## 2. CR-1-01〜22 の閉じ判定

| ID | 04 の処理 | 私の確認 | 判定 |
|---|---|---|---|
| CR-1-01 | 直した | cookie 無し curl を自分で再実行。route の応答 | 閉じる。本番は未配信のまま (最終報告に明記) |
| CR-1-02 | 直した | layout.tsx 37/52 行の読解 + anon_* の記録 (自分では匿名を作れない) | 条件つきで閉じる (実測は実装者の記録に依存) |
| CR-1-03 | 直した | ゲートは重なるが主ボタンが「ログイン」。04 の証跡の読み違い | **開いたまま → CR-2-01 (S2)** |
| CR-1-04 | 直した + AMB-009 | 読解 + 実装者の画像 | 条件つきで閉じる (3102 未起動) |
| CR-1-05 | 直した | layout.tsx 65-66 行 + apple_free_home.png | 閉じる。O-3 は残る |
| CR-1-06 | 直した | library/page.tsx 67/76 行 + upload_tab.json | 閉じる。TC-0873 (5 箇所) は settings/page.tsx:38 が残り不合格のまま = O-1 の根 |
| CR-1-07 | 直した | apply_transaction.json の 2 ケース | 閉じる。副作用は CR-2-08 (S4) |
| CR-1-08 | 直した | plan §1 の手順 + auth.users の読み取り (検証ゲストは既に無い) | 閉じる |
| CR-1-09 | 直した | route 単体 14 件を自分で実行 (green) | 閉じる |
| CR-1-10 | 直した | require/free_song・free_home の本文 + home.tsx / Recorder.tsx / gateText.ts | 閉じる (ただし主ボタンは CR-2-01 と同じ問題) |
| CR-1-11 | 直した | StartClient 120 行・ArcoResultOverlay 59 行 | 閉じる |
| CR-1-12 | 直した | plan.ts 264-272 行 | 閉じる。相手側の getGuestTryState は未修正 → CR-2-06 (S3) |
| CR-1-13 | 直した + AMB-010 | curl の SSR | 閉じる。ライブラリの帯は Web でも出る → CR-2-05 (S3) |
| CR-1-14 | 直した | StartClient 183 行 | **直したが、成功時の遷移を壊した → CR-2-02 (S2)** |
| CR-1-15 | 直した + AMB-012 | StartClient 111 行 | 閉じる (Supabase 側の設定はペンディング) |
| CR-1-16 | 直した | callback 47 行 | 閉じる |
| CR-1-17 | 直した | cron 29 行 + api_cron.json | 閉じる |
| CR-1-18 | 人へ | AMB-008 | 妥当 |
| CR-1-19 | 一部 | (d) savedMonths は StartClient 217/235 行で確認。(a) は「対応しない」だが Web で帯が出る矛盾が残る (CR-2-05) | (d) 閉じる。(a) は S3 で再提示 |
| CR-1-20 | 直した | plan §1・DB の seed 形・start_diff/ の 3 枚 | 閉じる |
| CR-1-21 | 直した | layout.tsx 56 行 | 閉じる |
| CR-1-22 | 記録 | — | 妥当 |

## 3. 04 §3 O-1〜O-10 の重大度の見立て

| ID | 04 の見立て | 私の見立て | 根拠 |
|---|---|---|---|
| O-1 | S2 | **S2 で妥当。加えて本番で既に起きている** | settings/page.tsx 38-40 行の `isPlus = resolveEffectivePlan(...) === "plus"` は trialing で "trial" を返す。PlanCard.viewOf は `p.isPlus && st === "trialing"` を先頭条件にしているので無料期間中が「未加入」に落ちる。f12bdfb3 は本番に配信済み (stripe モード) で、本番 DB には plus/trialing/billingProvider=null (Stripe) の実利用者が 1 件いる (scripts/_tmp_critic_users.ts の groupBy)。その人の設定はいま「未加入・アルコプラスの新しいお申し込みは準備中です」。旧 PlanCard (f12bdfb3^) は STATUS_LABEL で trialing を扱っていたので、これは f12bdfb3 で入った回帰。直しは 1 行 (`isPlus` を "plus" か "trial" に、または planStatus を PlanCard に任せる) |
| O-2 | S2 | **S3** | html[data-native-boot] は最初の読み込みで立ち、クライアント遷移では消えない。消えるのは「印を埋めないページの全読込」だけで、殻でそれが起きるのは (a) OAuth の戻り (arcodaAuthBrowser.ts 53 行 `window.location.href = "/auth/callback…"`) と (b) WKWebView のプロセス再読込。(a) の後の人は Apple の identity が結ばれて非匿名なので /guest を開いても本人 URL へ送られ、ゲストホームを見ない。実害の経路は (b) と、アプリの起動 URL が /guest 以外のとき。実装者の再現 (fresh context で /start を直接開く) は殻の実使用と一致しない。ただし恒久的な構造の穴 (root layout に印が無い) なので直す価値はある |
| O-3 | S3 | S3 で妥当 | onboarding/page.tsx に契約と role の検査が無い。匿名が完走すると role=guest の行に OnboardingProfile が付くが、layout は引き続き /guest に送る |
| O-4 | S3 (既存) | 妥当 | 差分外 |
| O-5 | S3 (既存) | 妥当 | 差分外 |
| O-6 | 未確認 | 人へのまま。第一候補は dev の初回コンパイル | 上表「空振り 4」 |
| O-7 | S4 | **O-1 と同じ行**。O-7 単体は S4 だが、この行の `isPlus` が O-1 の根なので同時に直す | settings/page.tsx 38 行 |
| O-8 | S4 (既存) | 妥当 | — |
| O-9 | S4 | 妥当 | apiLimit 未適用 |
| O-10 | S4 | S4 で妥当。ただし StoreKit の purchase が返らないと busy=true のまま CTA が押せず、再読込しか無い点は最終報告に書く | StartClient 148-159 行 |

## 4. 新規の指摘

### CR-2-01
- 重大度: S2
- 種別: 適合 (REQ-013・REQ-059) / 価値 / 証跡の不備
- 対象: app/components/guest/GateSheet.tsx 74-75 行 (`known`) と 124-128 行 (known 分岐)。呼び出し元 scores/[scoreId]/page.tsx 380 行・practice/[category]/[itemId]/page.tsx 298-304 行・lessons/page.tsx 78 行 (いずれも `primaryHref="/start" primaryLabel={…}` を渡す)
- 何が起きるか: 契約切れ・契約なしの人の曲・教材・レッスンに重なるシートは、端末に「ログインしたことがある記録」(localStorage の arcoda_known_user。ホームを開くたびに KnownUserRecorder が書く) があると known 分岐に入り、主ボタンが「ログイン」、副リンクが「アカウントがない人は再開する」(または「…はじめる」) になる。ログイン済みの人は必ずホームを通っているので、実際にはほぼ全員がこの分岐に入る。「ログイン」を押すと `/login?returnTo=…` → middleware 81-85 行がログイン済みなので本人 URL へ送り返し、ホームに戻る。「再開する」は副リンクの末尾にしか無く、文言も「アカウントがない人は」と嘘になる。契約切れの人が曲から再開する本線が成り立たない (REQ-013「ゲート『再開する』」・REQ-059)。副ボタンの `remember("gate_signup")` はゲスト計測の gate_signup を汚す
- 再現手順: REQUIRE_SUBSCRIPTION=true (scripts/_tmp_verify_require.mjs の手順) で verify-billing-expired にログイン → ホーム → `/<uuid>/scores/<id>`。主ボタン「ログイン」。押すとホーム
- 根拠: evidence/require/screens.json の expired_song / expired_practice / expired_lesson / free_song / free_practice / free_lesson の本文 (6 枚とも「… ログイン アカウントがない人は再開する (はじめる)」)。evidence/require/expired_song.png を目視。GateSheet.tsx 124-128 行は `primaryHref`/`primaryLabel` が渡されていても known を優先する
- 期待: `primaryHref` か `primaryLabel` が渡されたとき (契約ゲート) は known 分岐を使わず、主ボタンをその label にする。ログイン済みなら「ログイン」を出さない。台帳 TC-0009・B 軸「契約切れ × 曲詳細のゲート」の判定を不合格に戻す

### CR-2-02
- 重大度: S2
- 種別: 適合 (REQ-046・REQ-060) / 整合 (CR-1-14 の直しによる退行)
- 対象: app/start/StartClient.tsx 175-184 行 (resume の useEffect)、183 行 `void run.finally(() => { setBusy(false); router.replace("/start") })`。131 行 `router.replace("/")` (doPurchase 成功)、145 行 `router.replace(onboarded ? "/" : "/onboarding")` (doRestore 成功)
- 何が起きるか: Apple サインインから `/start?step=purchase` に戻った人 (新規ユーザーの本線: 匿名 → linkApple → OAuth → /auth/callback → /start?step=purchase) は、useEffect が doPurchase を走らせ、成功すると 131 行で `/` へ移ろうとする。直後に finally の `router.replace("/start")` が走る。Next 16.2.4 の app-router は、進行中のナビゲーションがあるときに新しいナビゲーションが来ると前のものを `discarded = true` にして新しい方を即座に走らせる (node_modules/next/dist/client/components/app-router-instance.js 144-153 行「Navigations (including back/forward) take priority over any pending actions. Mark the pending action as discarded」)。`/` への遷移は RSC の取得中なので必ず discarded になり、着地は `/start` (プラン選択・購入済みの人に「年額プランで Apple ではじめる」が再び出る)。オンボーディングにも着かない。復元成功も同じ (alert のあと `/start`)。トーストは「反映しています…」の 2.4 秒だけ。CTA を押し直すと StoreKit の「既に登録済み」のシートになる
- 再現手順: hasApple=true (app_metadata.providers に apple) の検証ユーザー + 偽ブリッジ purchase ok + `/api/apple/verify` を page.route で 200 に差し替え → `/start?step=purchase` を開く → 着地 URL が `/start`。検証ユーザーに apple provider が無いので今回は実行できていない (証跡の作り方は台帳に足すこと)
- 根拠: 上記行。onStart から直接 doPurchase に入る経路 (hasApple の人が CTA を押す) は finally の replace が無いので影響しない。影響するのは resume 経路 = OAuth を挟む全員
- 期待: `?step=` を消すのは続きを走らせる前に 1 回 (`router.replace("/start")` を run の前に置く) か、成功時は消さない。台帳 D 軸に「購入成功 → / → /onboarding に着く」「復元成功 → / か /onboarding に着く」を自動 (page.route で verify/restore を差し替え) で足す

### CR-2-03
- 重大度: S2
- 種別: 適合 (REQ-041「/login は残す」・REQ-042 ゲートの「ログイン」・REQ-055) / 価値
- 対象: middleware.ts 81-85 行 (`if (user && pathname === "/login") redirect(/${user.id})`)。app/[userId]/layout.tsx 52-56 行。GateSheet.tsx 122/126/132 行と GuestHome.tsx 71 行の「ログイン」リンク
- 何が起きるか: 「登録なしで 1 回ためす」を押した端末は匿名セッションを持つ。この状態で /login を開くと middleware が `user` (匿名も user) を見て `/<匿名uuid>` へ送り、layout が role=guest を `/guest` へ送り返す。/login のフォームには着けない。したがって既にアカウントを持つ人が試しに 1 回ためしを押すと、ゲストホームの「アカウントがある人はログイン」、曲ゲート (未使用・使用済み) の「ログイン」、/signUp の「ログイン」がすべて /guest に戻る死んだリンクになる。/start の CTA (linkIdentity) で既存の Apple identity を結ぼうとしても Supabase は別ユーザーに結ばれた identity を拒むので、そこからも入れない。抜け道はアプリのデータ削除 (匿名セッションを捨てる) か 30 日後の Cron。1 回ためし後にログインする動線が要件 (v2.7 §3 「/login は残す」) にあるのに通らない
- 再現手順: 匿名セッションで `/login` を開く → `/guest`。代用: ログイン済みの通常ユーザーで `/login?returnTo=…` を開くと `/<uuid>?returnTo=…` に飛ぶ (evidence/critic-r2/r2_trial_login_redirect.png)。匿名では飛び先の layout がさらに /guest へ送る
- 根拠: middleware.ts 81 行に `is_anonymous` の除外が無い。layout.tsx 54 行の許可正規表現は `/scores/` だけ
- 期待: middleware の /login 転送を `user && !user.is_anonymous` にする。/login で匿名セッションのままメール+パスワードや Apple でログインしたときの扱い (匿名を捨てる・匿名の 1 回の記録は消えてよい) を要件に書く。台帳 B 軸ゲスト × /login (TC-0082/0092) の期待を「フォームが出る」に直し、匿名で自動化する

### CR-2-04
- 重大度: S3
- 種別: 証跡の不備 / 完全性 (AMB-006 が未検証)
- 対象: 02_cases.csv TC-0104・0114・0124・0134・0144・0154 (B 軸「カルテ を開く」)、evidence/screens/apple_*_karte.png、evidence/require/*_karte.png、scripts/_tmp_verify_screens.mjs と _tmp_verify_require.mjs の `/${uid}/karte`
- 何が起きるか: 6 行すべて実測が「404 This page could not be found.」なのに判定が「合格」。本物のカルテは `/progress` (BottomTabs.tsx 20/29 行 `KARTE_PREFIXES = ["/progress", "/records"]`)。AMB-006「契約切れ・契約なしでもカルテは開ける」は一度も確かめられていない。自分の手で `/progress` は 200 で「成長カルテ」が描けることを確認した (r2_trial_progress.png) が、REQUIRE_SUBSCRIPTION=true の契約切れでの確認は残っている
- 期待: 6 行と require/ の 4 行を `/progress` で撮り直す。契約切れで「閲覧可・ゲート無し」を確かめる。判定は取り直すまで「未実施」に戻す

### CR-2-05
- 重大度: S3
- 種別: 価値 (画面同士の矛盾) / 完全性 (CR-1-19a の「対応しない」の帰結)
- 対象: app/[userId]/library/page.tsx 74 行 `tryBanner = guest && isAppleBilling() ? !(await getGuestTryState()).used : false`。LibraryClient.tsx 95-99 行
- 何が起きるか: Web (ブラウザ) + apple のゲストがライブラリを開くと帯「登録なしで 1 回だけためせます。曲をえらんでください」が出る (curl で確認)。曲を押すとゲートは CR-1-13 で「iPhone アプリで登録」に変わっているので、帯の約束が裏切られる。AMB-010 で「1 回ためしは殻だけ」と決めたなら帯も殻だけに揃えるべき
- 期待: 帯を `nativeOnly` (GuestHome と同じ印) で出すか、AMB-010 を「Web でも許す」に変える。B 軸「Web+apple × ライブラリ」を足す

### CR-2-06
- 重大度: S3
- 種別: 整合 (CR-1-12 の片側だけの修正)
- 対象: app/actions/guestTry.ts 76-80 行 (`analysisStatus: { in: ["queued", "processing", "done", "retrying"] }`)。plan.ts 264-272 行
- 何が起きるか: アップロード途中で切れて queued のまま 15 分以上残った Performance は、quota (Recorder・getSignedUploadUrl) では「取り直せる」(used=0) だが、getGuestTryState では used=true のまま。同じ端末で、録音欄は録音ボタンを出すのに、ゲストホームは「さっきの採点を残しておこう」、ライブラリの帯は消え、別の曲のゲートは「使用済み」、ためした曲は本人 URL へ転送される。画面ごとに言うことが違う
- 期待: getGuestTryState も同じ 15 分規則にする (共通関数に寄せる)。H 行 TC-0879 に「getGuestTryState も同じ」を足す

### CR-2-07
- 重大度: S3
- 種別: 価値 / 適合 (REQ-013 ハードペイウォール)
- 対象: GateSheet.tsx 104 行 (veil の `onClick={later}`)・83 行 (Escape)・93-101 行 (帯「登録かログインで続ける」)・135 行 (`noLater` はボタンを隠すだけ)
- 何が起きるか: 契約ゲート (noLater) でもシートの外を触ると閉じる。GuestGate 経由 (曲・教材) では画面下に「+ 登録かログインで続ける」の帯が残る。ログイン済みの契約切れの人に「登録かログイン」と言う。レッスン一覧 (laterMode="hide") では消えて再び出せない (一覧は許可された画面なので実害は文言だけ)
- 期待: noLater のときは veil と Escape でも閉じない、または帯の文言を primaryLabel に合わせる

### CR-2-08
- 重大度: S4
- 種別: 整合 (EXTRA-009 の副作用)
- 対象: app/_libs/apple/appleServer.ts 132-136 行
- 何が起きるか: stale 判定は `current.planCurrentPeriodEnd` を billingProvider に関係なく使う。Stripe の契約で期末が未来の人 (本番に plus/active 2・plus/trialing 1・plus/past_due 1 = billingProvider null) が Apple で買うと、Apple の expiresDate (無料期間なら +14 日) が Stripe の期末より手前で stale:true になり、User には何も書かれない。verify は `ok: true, status: <Stripe の status>` を返すのでアプリは成功と見なし、appleOriginalTransactionId は結ばれない。以後の Apple の通知も owner 無し → appAccountToken で本人 → stale。Stripe の期末が過ぎるまで Apple の契約が写らない。既存の Stripe 行は開発用だけ (§8-5) なので S4
- 期待: stale 判定を「同じ billingProvider=apple の期末」に限る (billingProvider が apple 以外なら比べない)

### CR-2-09
- 重大度: S4
- 種別: 証跡の不備
- 対象: 04_round-1-fix.md §2「67 件通過 (… plan 既存 23 …)」
- 内容: 私の再実行は 60 件 (7 ファイル)。plan.test.ts の `it(` は 12。集計の根拠が無い。数を書くなら vitest の json を証跡に置くこと (evidence/vitest.json は全体 643 件で、課金 7 ファイルの内訳が読めない)

### CR-2-10
- 重大度: S4
- 種別: 整合 (コミット時の混入)
- 対象: 作業ツリー
- 内容: `git status` に課金と無関係の差分がある: music-analyzer/tests/audit/offline_analyzer.py (解析の監査スクリプト・instrument の扱い)、next-env.d.ts (dev の生成物)、未追跡の .claude/ と _tmp/*。課金の差分をコミットするときに `git add -A` すると混入する (feedback_nested_git_repo_trap・feedback_no_analyzer_logic_changes)。ファイルを指名して add すること

### CR-2-11
- 重大度: S4
- 種別: 適合 (REQ-019)
- 対象: app/[userId]/page.tsx 822-829 行 (planView)
- 内容: planView は resolveEffectivePlan だけで決めるので、先生接続中で plan=free の生徒に REQUIRE_SUBSCRIPTION=true で「アルコプラスをはじめると…」の帯が出る。quota は teacherLink で unlimited なので録音はできる。帯だけが嘘。先生機能は未公開なので S4

### CR-2-12
- 重大度: S4
- 種別: 証跡の不備 (集計)
- 対象: 02_cases.csv TC-0874
- 内容: 実測欄「同時操作は実機か 2 端末が要る」・判定「人へ」だが、evidence/apply_transaction.json の「stale: 別契約 OTX-OLD の遅い通知」がまさにこの行の内容で通っている。合格に直せる。同様に TC-0479 (価格取得前の CTA) は StartClient 261 行 `disabled={loadState !== "ok" || busy}` の読解 + 偽ブリッジ (getProducts を返さない) で自動にできる

## 5. 台帳の「読解」450 行と「人へ」195 行について

### 自動にできる「読解」(手段がこの環境に既にあるもの)

| 群 | 行 | 手段 |
|---|---|---|
| C 軸 端末キー (TC-0244〜0261 の 18 行) | `isDeviceKey` は guestTry.ts の非公開関数 | ensureGuestUser を verify/route.test.ts と同じ作法 (server-only と prisma・supabaseServer を vi.mock) で呼ぶ vitest。匿名セッションは mock で作れる |
| E 軸 verify / restore / usage (TC-0407〜0468 のうち約 40 行) | 状態ごとの verify・restore は route 単体 (verifyAppleJws を mock) で、usage は検証ユーザーの cookie で | verify/restore は既にある route.test.ts に状態のパラメータを足す。usage は quota_require_*.json が既に 8 ユーザー分あるので、その行は「合格」にできる |
| G 軸 (TC-0489〜0498) | 純関数 (jstDayStart・Math.ceil・derivePlanStatus・verifyChain の有効期限) | vitest。verifyChain の期限外は自前 CA で作れる (TC-0018 と同じ道具) |
| I 軸 (TC-0516〜0554 のうち偽ブリッジで作れる 30 行) | getProducts / purchase / restore の reject・遅延・不正な本文、/api/apple/verify の 4xx/5xx/timeout は page.route | playwright (既存の _tmp_verify_screens.mjs の FAKE_BRIDGE を差し替える) |
| L 軸 (40 行) | 44px・aria・色 | playwright + axe-core (cdnjs から読める) |
| J 軸 (202 行) | 「利用箇所を読む」 | tsc 0 と 60 tests green で型と値の回帰は覆われている。行ごとの読解は不要で、J 軸は「tsc + vitest + 差分の呼び出し元 grep」の 3 行に畳んでよい |
| D 軸 二重タップ・連打 (TC-0326/0327/0341/0342/0356/0357/0371/0372/0386/0387) | busy / trying / submitting | playwright で 2 回連続 click して呼び出し回数を数える |
| M 軸 TC-0836 (getSignedUploadUrl が quota で弾く) | server action | requireAuthAction と prisma を mock した vitest |

### 「人へ」のうち自分で確かめたもの・確かめられるもの

| 行 | 結果 |
|---|---|
| TC-0874 (別契約の遅い通知) | apply_transaction.json で通っている → 合格 |
| TC-0479 (価格取得前の CTA) | 読解で押せない (261 行)。自動化可 |
| TC-0091 (ゲスト使用済み × /start) / TC-0092 (× /login) | /login は CR-2-03 で着けない。期待そのものが誤り |
| K 軸 ゲート・ライブラリ帯・オンボ 02b/11d (TC-0759〜0768・0784〜0793) | 既存の撮影ハーネスの URL を足せば自動。オンボは OnboardingProfile.completedAt を null にした検証ユーザーが要る (seed の書き込みは実装者側の規則で可) |
| C 軸 ニックネーム・お便りメール (TC-0172〜0199) | 同上 (オンボの検証ユーザーで playwright)。規則は actions.ts 70-77 行 (trim・20 文字・mailOptIn で marketingOptInAt) |
| I 軸 正常 (TC-0513/0520/0527/0534/0548) | 偽ブリッジで自動化可。Apple OAuth 正常 (TC-0541) だけが本当に人へ |
| TC-0867 (DID_FAIL_TO_RENEW 後の再開) | 人へで妥当 (StoreKit のシートは Sandbox が要る) |
| B 軸 採点結果 (TC-0099〜0149) | 録音が要る。検証ユーザーに Performance を 1 件 seed すれば自動化できるが、解析器を回すので人の判断でよい |

## 6. 判定

不合格。

- S2: CR-2-01 (契約ゲートの主ボタンが「ログイン」)、CR-2-02 (購入・復元成功後に /start へ戻る)、CR-2-03 (匿名セッションが /login に着けない)。O-1 は S2 で妥当・本番で発生中
- S3: CR-2-04 (カルテの 404 を合格にしている)、CR-2-05、CR-2-06、CR-2-07。O-2 は S3 に下げる
- S4: CR-2-08〜12

ラウンド 1 の 22 件のうち、閉じられるのは 19 件 (条件つき 2 件を含む)。開いたままは CR-1-03 (CR-2-01 として再提示) と CR-1-14 (直しが CR-2-02 を生んだ)。CR-1-18・22 は記録どおり。

次のラウンドで最低限見せてほしい証跡: (1) REQUIRE_SUBSCRIPTION=true で契約切れの曲ゲートの主ボタンが「再開する」で、押すと /start に着く記録、(2) hasApple の検証ユーザー + page.route で verify を 200 にした `/start?step=purchase` の着地 URL が `/` 経由で `/onboarding` になる記録、(3) 匿名セッションで /login のフォームが描ける記録、(4) `/progress` を契約切れで開いた記録 (AMB-006)、(5) O-1 を直したうえで trial の設定が「無料期間中」になる記録。
