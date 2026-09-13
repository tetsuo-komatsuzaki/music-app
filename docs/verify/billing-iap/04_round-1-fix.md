# ラウンド 1 の修正記録

- 対象: 03_round-1-critic.md の CR-1-01 〜 CR-1-22 と、段4 の実行中に自分で見つけた 3 件 (X-1 〜 X-3)
- すべて**作業ツリーの未コミット差分**。Tetsuo の指示 (2026-09-13)「修正実装はまだしないでいい。終了したら報告し、それを踏まえて判断する」を受け、ここに記録した修正より先の追加修正は行っていない。コミット・push もしていない
- 証跡は docs/verify/billing-iap/evidence/ 配下

## 0. 段4 の実行中に自分で見つけたもの (批評ラウンドの前)

| ID | 何が壊れていたか | 原因 | 直し方 | 修正前の証跡 | 修正後の証跡 |
|---|---|---|---|---|---|
| X-1 (= CR-1-01・S1) | cookie 無しの POST /api/apple/notifications と GET /api/cron/guest-cleanup が middleware で 401 | PUBLIC_API_PATHS に 2 経路が無い (Stripe webhook と同じ型) | middleware.ts の PUBLIC_API_PATHS に `/api/apple/notifications` と `/api/cron/guest-cleanup` を追加。認証は route 内 (署名検証・Bearer) | evidence/api_before_fix.json: 18 本すべて `401 {"error":"Unauthorized"}` | evidence/api_round.json: notifications は 400 (bad json / signedPayload required / invalid signature)、GET は 405、cron は route の 401 小文字 `unauthorized`。TC-0018 の自前 CA も 400 |
| X-2 | 殻の中で「Webのアルコダからプランを確認できます」が出る (REQ-002) | LibraryClient の `!canShowBilling` 分岐が Stripe 前提の文言 | apple モードでは「アルコプラスは iPhone アプリではじめられます」 | grep (段4 A 行 REQ-002) | 同 grep で該当 0 件 (isAppleBilling() で分岐) |
| X-3 | admin の guest-stats の列見出しに「無料で登録」(REQ-001) | 旧 CTA 名のまま | 「登録へ」に | grep REQ-001: 1 件 | 0 件 |

## 1. 批評の指摘ごとの処理

処理は三択 (直す / 台帳に足す / 人へ戻す)。「直す」は修正前後の証跡を並べる。

### CR-1-01 (S1) middleware の公開パス → 直した (X-1 と同じ)
- 再現: `git show f12bdfb3:middleware.ts | grep -c "apple\|cron"` → 0。コミットのままの応答は evidence/api_before_fix.json
- 修正後: evidence/api_round.json。要件表に REQ-020b を追加、台帳に A 行「cookie 無し」を追加
- 本番はコミット f12bdfb3 のままなので、**本番では Apple の通知と Cron はいまも 401** (コミットと配信は Tetsuo の判断待ち)

### CR-1-02 (S1) 匿名セッションの無限リダイレクト → 直した
- 原因: layout.tsx の `/guest` 分岐が匿名ユーザーも本人 URL へ送り、role=guest の分岐が /guest へ送り返す
- 修正: `/guest` 分岐を `sessionUser && !sessionUser.is_anonymous` に。role=guest の分岐は `sessionUser.is_anonymous` のときだけ
- 修正前の証跡: 批評の読み筋 (03_round-1-critic.md CR-1-02)。修正前の実測は取っていない (作業ツリーで先に直した)
- 修正後: evidence/screens/anon_root.png・anon_guest_home.png・anon_guest_library.png・anon_song_gate_try.png (匿名セッションで / → /guest 200、/guest 200、/guest/library 200、曲のゲート表示)。evidence/screens.json の `anon_*` 行に URL と本文

### CR-1-03 (S2) 契約切れの曲・教材・レッスンにゲート「再開する」が無い → 直した
- 修正: gateText.ts に `subscriptionGate(planStatus)` (expired/canceled → resume「再開する」、それ以外 → subscribe「はじめる」)。scores/[scoreId]/page.tsx・practice/[category]/[itemId]/page.tsx・lessons/[lessonId]/page.tsx (→ 一覧 `?gate=&plan=1`)・lessons/page.tsx に、`getGradingQuota(...).needsSubscription` のとき GuestGate/GateSheet を重ねる (noLater・primaryHref=/start)
- 証跡: evidence/require/ (REQUIRE_SUBSCRIPTION=true を一時的に作って撮影) の expired_song.png・expired_practice.png・expired_lesson.png (「アルコプラスが終了しています」+「再開する」)、free_song.png ほか (「アルコプラスをはじめると、採点と基礎練が使えます」+「はじめる」)、trial_song.png (ゲート無し)、internal_song.png (ゲート無し)
- 定数の書き換えは scripts/_tmp_verify_require.mjs が撮影後に復元。復元後の `git diff app/_libs/plan.ts` に REQUIRE_SUBSCRIPTION の変更が無いことを同スクリプトの出力で確認

### CR-1-04 (S2) stripe モード (本番の現状) で未加入者が App Store 案内に送られる → 直した + 人へ (AMB-009)
- 修正: PlanCard の未加入は stripe モードでは「アルコプラスの新しいお申し込みは準備中です。はじまったらお知らせします。」(ボタン無し)。/start も stripe モードでは同じ文言 (App Store の文言を出さない)。Stripe の checkout ボタンは戻していない (Tetsuo 決定「Stripe の新規導線は止める」)
- 証跡: evidence/screens/stripe_web_free_settings.png・stripe_web_start.png
- 人へ: REQ-003「未設定 (stripe) のときは従来どおり」の文言を「Stripe の新規導線は止め、準備中を出す」に改めるか (AMB-009)

### CR-1-05 (S2) 購入キャンセルの契約なしアカウントが /onboarding へ → 直した
- 修正: layout.tsx のオンボ誘導に「apple モードでは契約あり (resolveEffectivePlan が free でない・planGrant 含む) のときだけ」を追加。stripe モードは従来 (オンボ → 決済) のまま
- 証跡: evidence/screens/apple_free_home.png (契約なし・apple: ホームに留まり /onboarding へ送られない)、evidence/screens/apple_trial_home.png (契約あり・オンボ未完了: /onboarding へ送られる)
- 残り (直していない): /onboarding を URL で直接開くと、契約なしでも匿名でも描画される (evidence/screens/apple_free_onboarding.png・anon_onboarding_direct.png)。§3 O-3

### CR-1-06 (S2) library/page.tsx が planGrant を渡さない → 直した
- 修正: select と resolveEffectivePlan に planGrant
- 証跡: evidence/upload_tab.json と evidence/screens/upload_internal.png・upload_active.png (マイ楽譜タブに「自分の楽譜をアップロード」・プラス限定の案内なし)。trial・free・expired は「楽譜のアップロードはプラス限定」(upload_trial.png ほか)
- 残り: grep `resolveEffectivePlan(` 5 箇所のうち settings/page.tsx:38 だけ planGrant を渡していない (§3 O-7)

### CR-1-07 (S2) 順序逆転・別契約の遅い通知 → 直した
- 修正: 「本人に写してある期末 (planCurrentPeriodEnd) より古い期末の取引は捨てる」(otx が同じでも違っても)。失効 (revocationDate) と請求リトライ中 (isInBillingRetryPeriod) は対象外。`!renewal` の条件は撤去
- 修正前: evidence/apply_transaction.json (ラウンド 1 前・「順序逆転」の before=expired → 後の古い DID_RENEW で active に戻った)
- 修正後: evidence/apply_transaction.json (再実行): 「順序逆転」は stale で捨てられ before=active のまま、「stale: 別契約 OTX-OLD の遅い通知」も stale・otx は生きている契約のまま。失効とリトライは通る
- 副作用 (記録): 本人の期末が未来のまま、期末がそれより短い新しい契約 (別 Apple ID で重ねて契約) が届いても捨てる。Apple のプラン変更は同じ otx で期末が延びるので影響なし

### CR-1-08 (S2) 匿名セッションの代用が無効 → 直した (検証手段)
- 修正: 検証ゲストの `auth.users.is_anonymous` を DATABASE_URL 経由で true にし、メール+パスワードで入ると `user.is_anonymous=true` のセッションになることを確認 (scripts/_tmp_verify_anon.ts の出力「password login as anonymous: ok is_anonymous=true」)。01_plan.md §1 を書き換え
- これで B 軸のゲスト 20 行・D 軸「1 回ためす」・E 軸「ゲスト匿名」の行が本当のゲスト経路を通る (evidence/screens/anon_*)

### CR-1-09 (S2) 署名検証の後ろにある経路が curl で観測できない → 直した (自動化)
- 追加: app/api/apple/notifications/route.test.ts (UUID 重複 duplicate・no_user で 200・TEST 通知 400・内側の署名不正 400・外側の署名不正は保存しない)、app/api/apple/verify/route.test.ts (未認証 401・jws 無し 400・token 不一致 403・本人 200・conflict 409・署名不正 400)
- 証跡: `npx vitest run app/api/apple` → 2 files, 14 tests passed

### CR-1-10 (S3) 一度も契約していない人に「終了しています」 → 直した
- 修正: planView に `unsubscribed` を追加 (planStatus が expired/canceled 以外)。ホーム・Recorder・ゲートで「アルコプラスをはじめると、採点と基礎練が使えます」+「はじめる」。quota に planStatus を追加
- 証跡: evidence/require/free_home.png・free_song.png (はじめる) と expired_home.png・expired_song.png (再開する)

### CR-1-11 (S3) purchase_cancel が無条件・try_result と signin_cancel が未記録 → 直した
- 修正: purchase_cancel は `status === "cancel"` のときだけ。try_result は ArcoResultOverlay の guestTrial 表示時に記録。signin_cancel は記録できない (OAuth から戻らない) ので型から外し、要件表 REQ-036 の一覧から外す
- 証跡: 読解 (StartClient.tsx doPurchase・ArcoResultOverlay.tsx の useEffect)。台帳 A 行 REQ-036 を更新

### CR-1-12 (S3) queued のまま残った Performance が 1 回を消費 → 直した
- 修正: ゲストの used は processing/done/retrying と、15 分以内の queued だけを数える
- 証跡: 読解 (plan.ts)。台帳 H 行を追加。実測は「人へ」(アップロード途中の切断は実機)

### CR-1-13 (S3) Web+apple でも 1 回ためしが出る → 直した + 人へ (AMB-010)
- 修正: GateSheet が `useIsNativeApp()` を見て、apple モードの Web では試すボタンを出さず、主ボタンを「iPhone アプリで登録」(App Store の URL、未設定なら /signUp の案内) に
- 証跡: evidence/screens/web_apple_song_gate.png
- 人へ: 出所 §1 の「ブラウザの記録」と §3 の「Web は App Store へ」の食い違い (AMB-010)

### CR-1-14 (S3) /start?step=purchase の再読込で購入シートが再び出る → 直した
- 修正: 続きを走らせたら `router.replace("/start")`
- 証跡: 読解。実測は「人へ」(Apple の OAuth 戻りが要る)

### CR-1-15 (S3) user セッションで signInWithOAuth → 直した + 人へ (AMB-012)
- 修正: すべて linkIdentity に統一
- 前提: Supabase の「手動の identity 結合」を有効にする (Tetsuo 側のペンディングに追記)

### CR-1-16 (S3) 昇格で氏名が無いと「ゲスト」のまま → 直した
- 修正: callback の昇格で `name: appleName || "あなた"`
- 証跡: 読解

### CR-1-17 (S3) 契約が付いた role=guest 行を Cron が消す → 直した
- 修正: Cron の where に `billingProvider: null, plan: "free"` (安全網)
- 証跡: evidence/api_cron.json (Bearer 一致で期限切れの検証ゲストが 1 件消える。契約つき行の実測は「人へ」)

### CR-1-18 (S3) Apple 経路で「お支払いに問題」が到達不能 → 人へ (AMB-008)
- 対応しない理由: §8-9「猶予なし・即 expired」の決定と §2 表の「お支払いに問題があります・再開する」が両立しない。判別するなら planStatus=expired かつ appleAutoRenew=true (かつ renewal.isInBillingRetryPeriod) を写す列が要る。設計判断なので最終報告の未決へ

### CR-1-19 (S4) 要件表の漏れ 7 点
- (a) 帯と ?try=1: 対応しない。出所は「未使用の端末だけ」を条件にしており、実装 (未使用なら常に帯) は矛盾しない。`?try=1` は着地の印としてのみ残す
- (b) AMB-007 として立てた
- (c) 要件表の冒頭に「範囲外だがローンチを阻む」として明記
- (d) 直した: 「N ヶ月分お得」を price から計算 (1 未満なら出さない)。証跡: evidence/screens/apple_free_start.png (偽ブリッジ 12,800 / 1,280 → 「2ヶ月分お得」)
- (e) 台帳 A 行 REQ-001 の grep を「無料」全件 + 許容一文のホワイトリストに変えた (段4 の grep 結果は 04 §2)
- (f) H 行に追加 (読解: appleEnvironment を書くだけで混ざらない)
- (g) E 行に追加・AMB-011

### CR-1-20 (S4)
- REQUIRE_SUBSCRIPTION の作り方を 01_plan.md §1 に明記。seed の expired を plan=plus/expired に。B 軸に Web+apple の 8 行を追加。画素照合の三面図を evidence/start_diff/ に置いた (impl_start.png・mock_start.png・side_start.jpg)

### CR-1-21 (S4) x-pathname 無しで fail-open → 直した
- 修正: `if (!allowed) redirect(path ? ... : "/guest")`

### CR-1-22 (S4) leaf の OID 未照合 → 対応しない (記録)
- 理由: Node の X509Certificate は拡張 (OID) を直接は出さない。Apple Root G3 への到達 + bundleId + 製品 ID の照合で実害は低い。将来 App Store Server Library (公式) に置き換える候補として最終報告に書く

## 2. 修正後に回した検査

| 検査 | 結果 |
|---|---|
| `npx tsc --noEmit` | エラー 0 |
| `npx vitest run` (課金関連 7 ファイル) | 67 件通過 (appleServer 12・isNativeApp 7・planGrant 6・gateText 5・plan 既存 23・notifications route 7・verify route 7) |
| eslint (差分ファイル) | 私の差分による error は signUp の関数名 (hooks 規則) 1 件 → `SignUpPage` に改名して 0。残る error は ArcoResultOverlay 111 行の ref (コミット前から存在・今回の差分外) と既存の any |
| evidence/api_round.json | 18 本 (上記) |
| evidence/apply_transaction.json | 17 分岐 |
| evidence/screens/*.png + screens.json | 状態 6 × 画面 7 + 匿名 9 + Web 7 + stripe 9 + /start 変種 3 + 表示 16 |
| evidence/require/*.png + screens.json | REQUIRE_SUBSCRIPTION=true の 4 状態 × 7 画面 |
| evidence/quota_require_false.json / quota_require_true.json | 8 ユーザーの quota |
| evidence/api_cron.json | Cron の削除 1 件 |

## 3. 修正後の実行で見つかった、直していないもの (Tetsuo の指示「修正実装はまだしない」以降)

| ID | 重大度 (私見) | 何が起きるか | 証跡 | 原因 | 私の変更か |
|---|---|---|---|---|---|
| O-1 | S2 | **無料期間中 (plan=plus・planStatus=trialing) の設定のプランカードが「未加入・アルコプラスをはじめる」と出る** | evidence/screens/onb_trial_settings.png (「未加入 … アルコプラスをはじめる」)。ホームのチップは「無料期間はあと 12 日」と正しい (onb_trial_home.png) | settings/page.tsx:38 の `isPlus = resolveEffectivePlan(...) === "plus"` は trialing で "trial" を返すため false。書き直した PlanCard.viewOf は `p.isPlus && st === "trialing"` を先頭条件にしているので無料期間中の分岐に入らない。照合報告のハーネスは isPlus:true を渡していたので見えなかった | 私 (f12bdfb3 の PlanCard 書き直し) |
| O-2 | S2 | **殻の中で、クライアント遷移 (Link) で /guest に戻ると、ゲストホームの CTA が Web 用「iPhone アプリで登録」になる** (最初の読み込みでは正しく「登録なしで 1 回ためす」) | evidence/screens/anon_back_to_guest2.png (/start の「ゲストにもどる」→ /guest で Web の文言)。console: 「Encountered a script tag while rendering React component. Scripts inside React components are never executed when rendering on the client」 (screens.json apple_cancel_other_settings) | NATIVE_BOOT_SCRIPT は `<script>` を GuestHome (サーバー部品) に埋めて html[data-native-boot] を立てる方式。React はクライアント遷移で描いた `<script>` を実行しないので印が立たず、CSS が Web 側を出す。既存の KNOWN_USER_BOOT_SCRIPT も同じ性質 | 私 (照合ループで入れた CR-1-19 相当の修正) |
| O-3 | S3 | 匿名ユーザーと契約なしのアカウントでも、/onboarding を直接開くとオンボーディングが描画される (誘導はしなくなったが、URL を打てば出る) | evidence/screens/anon_onboarding_direct.png・apple_free_onboarding.png (どちらも「arcoda きみの音を、きみの曲に。 スタート」) | /onboarding のページは [userId]/layout.tsx の外にあり、契約と role の検査が無い | 既存 + 私 (CR-1-05 の修正は layout の誘導だけ) |
| O-4 | S3 (既存) | ライブラリの曲タブで hydration 失敗 (ツリー再生成) が出る。設定のタイトルとホームで属性不一致の警告 | evidence/clean_recheck.json (free/library pageerror)。dev ログの差分: StaggerRail の style に `--rvd`・`data-rv` がサーバー側だけにある。設定は `<h1 class="… rv-on" data-rv style=--rvd>` | 出現演出のエンジン (data-rv) がハイドレーション前に DOM を書き換える。project_reveal_hydration_fix (2026-09-07) の残り | 既存 (今回の差分外) |
| O-5 | S3 (既存) | ゲストホームが横にスクロールする (幅 320・402・文字 200%・暗) | evidence/screens/k_w320_guest.png ほか。scrollWidth 438 > 402。はみ出しは `.watermark` (幅 474) | 見本カードの透かし | 既存 |
| O-6 | 未確認 | 匿名セッションで曲のゲート「登録なしで 1 回ためす」を押すと「準備しています…」のまま 4 秒以上本人 URL に移らなかった | evidence/screens/anon_after_try_click.png | 不明。startGuestTry → ensureGuestUser (server action) → router.push。dev の遅さか、匿名サインイン未有効化の影響か切り分けていない | 人へ (匿名サインイン有効化後に実機) |
| O-7 | S4 | settings/page.tsx:38 の resolveEffectivePlan に planGrant を渡していない (5 箇所中 1 箇所)。運営の表示は PlanCard が planGrant を先に見るので影響なし | evidence/grep.json resolveEffectivePlan_planGrant | 揃え漏れ | 私 |
| O-8 | S4 (既存) | ゲストの曲ページで /api/plan/usage 等が 401 を返し console に赤いエラーが出る | screens.json web_apple_song_gate errors | Recorder が未ログインでも quota を取りに行く | 既存 |
| O-9 | S4 | /api/apple/verify・restore・notifications に回数上限 (apiLimit) が無い | evidence/grep.json apiLimit | 未適用 | 私 (設計の漏れ) |
| O-10 | S4 | fetch と nativePromise に timeout が無く、StoreKit や verify が返らないと busy のまま | 読解 | 未実装 | 私 |

撮影中の HMR について: 撮影と並行してリポジトリ内のファイルを書いた回では、`Rendered more hooks than during the previous render` (設定) や無関係なページの hydration 失敗が出た。ファイルを書かずに同じ順で再訪した evidence/clean_recheck.json では設定は 0 件、ライブラリの O-4 だけが再現した。O-4 以外の撮影中エラーは HMR 起因と判断した (根拠: clean_recheck.json)。

## 4. ラウンド 2 で分かった、この記録の誤り (訂正)

- CR-1-03 の証跡の読み違い: evidence/require/expired_song.png ほか 6 枚のゲートの主ボタンは「再開する」ではなく「ログイン」(従ボタンが「アカウントがない人は再開する」)。GateSheet の known 分岐 (端末に arcoda_known_user があると primaryHref/primaryLabel を無視する) が原因。録音欄のカードは「再開する」で正しい。→ CR-2-01 (S2)。台帳の該当行は不合格に直した
- CR-1-14 の直し (`router.replace("/start")`) が、購入成功の `router.replace("/")` と復元成功の `/onboarding` を取り消す → CR-2-02 (S2)
- §2 の「67 件通過」は誤り。課金関連 7 ファイルの実測は 60 件 (全体は 643 件)
- 台帳の「カルテ」6 行と require の *_karte.png は /karte の 404 ページを撮っていた (本物は /progress)。未実施に直した (CR-2-04)
