# 批評 ラウンド 3: 登録と課金 (Apple アプリ内課金)

- 対象: コミット f12bdfb3 + 作業ツリーの未コミット差分 (27 ファイル・+212/-76。`git diff --stat` 2026-09-13)。HEAD は 2863dc07 (別件が 3 つ積まれている)。未追跡の新規テスト 6 ファイル (appleServer.test / isNativeApp.test / planGrant.test / notifications route.test / verify route.test / gateText.test) は `git diff --stat` に出ないので注意 (§5 CR-3-05)
- 読んだもの: 00_requirements.md (AMB は全部第 1 案・EXTRA-014〜017)・01_plan.md・02_cases.csv (879 行)・03_round-2-critic.md・04_round-2-fix.md・04_round-1-fix.md §4・evidence/r2fix (screens.json・ux.json・画像 3 枚を目視)・evidence/require/screens.json (28 枚の本文)・要件の出所 billing-spec.txt (v2.7・§2 表・§8-8・§3 の表)・ラウンド 2 で触った 9 ファイルの現物全文と、その周辺 (start/page.tsx・app/page.tsx・login/page.tsx・returnTo.ts・auth/callback・appleStore.ts・recordGuestEvent.ts・guestEvents.ts placeOf・GuestGate.tsx・GateSheet.module.css・BottomTabs.module.css・PlanCard.tsx・plan.ts・[userId]/layout.tsx・lessons/[lessonId]・progress/page.tsx)
- 自分の手で実行したもの (すべて読み取り。app/ は書き換えていない。DB への書き込みなし。REQUIRE_SUBSCRIPTION は私は書き換えられないので false のまま):
  - `npx tsc --noEmit` → エラー 0
  - `npx vitest run` 課金関連 7 ファイル → 7 files / 60 tests passed
  - scripts/_tmp_critic_users.ts (検証ユーザー 8 件の現在の状態・OnboardingProfile・本番の plan × planStatus) と scripts/_tmp_critic_r3_events.ts (GuestEvent を kind × place × path で集計・検証ユーザーの Performance)
  - scripts/_tmp_critic_r3.mjs (playwright): 匿名の /login・通常ユーザーの /login 転送・設定 6 状態・/onboarding 直接 3 種・匿名で本人 URL の設定・Web と殻のライブラリの帯・Web のゲストゲートの veil と下のタブ。出力は evidence/critic-r3/screens.json と r3_*.png
  - scripts/_tmp_critic_r3_rsc.mjs (playwright): CR-2-02 の実測。hasApple=true の検証ユーザーが無いので、ホームから `window.next.router.push("/start?step=…")` でクライアント遷移し、その RSC 応答の `"hasApple":false` を page.route で true に書き換え、偽ブリッジ + /api/apple/verify|restore の差し替えで着地 URL を 1 秒刻みで記録した。出力は evidence/critic-r3/resume.json と r3b_*.png。document (HTML) 側の差し替えはハイドレーションを壊す (書き換え無しの素通しでも壊れる) ことを scripts/_tmp_critic_r3_dbg2.mjs で切り分けたうえで、この手段にした
- 判定は末尾

## 0. 先に結論

条件つき合格。S1・S2 は無い。ラウンド 2 の S2 4 件 (CR-2-01/02/03・O-1) は自分の手で閉じた。新規は S3 が 2 件 (契約ゲートの出口・無料期間中のカードの文言) と S4 が 3 件。

## 1. 試したことの一覧 (空振りを含む)

| # | 試したこと | 結果 |
|---|---|---|
| 裏取り 1 (CR-2-01) | evidence/require/expired_song.png を目視 + require/screens.json の expired_song / expired_practice / expired_lesson / free_song / free_practice / free_lesson の本文 | 6 枚とも主ボタン 1 つ (「再開する」または「はじめる」)、「ログイン」「アカウントがない人は」の文字なし。GateSheet.tsx 66 行 `fixedPrimary = !!primaryHref`・120-121 行で known より先に分岐。閉じる |
| 裏取り 2 (CR-2-03) | r2fix/anon_login_page.png を目視 + 自分で再実行 (r3_anon_login) | 匿名セッション (verify-billing-guest・auth.users.is_anonymous=true) で /login に着き、フォームとメール欄がある。そのまま free で入ると /99a7…(本人ホーム)。閉じる |
| 裏取り 3 (O-1) | r2fix/trial_settings.png を目視 + 自分で再実行 (r3_trial_settings) | 「無料期間中 … 無料期間は 2026年9月25日 までです。契約を管理」。閉じる。ただし本文の「採点は無制限で使えます」は要件と矛盾 → CR-3-02 |
| 裏取り 4 (CR-2-05) | r2fix/web_guest_library.png + 自分で Web と殻の両方 (r3_web_guest_library / r3_native_guest_library) | Web: 帯の要素 0 個。殻 (偽 Capacitor): 帯「登録なしで 1 回だけためせます。曲をえらんでください」1 個。片側だけ消えて片側は残る。閉じる |
| 裏取り 5 (O-3 = 未決 7a) | r2fix/free_onboarding_direct / anon_onboarding_direct + 自分で再実行 (r3_free_onboarding_direct → /99a7…, r3_anon_onboarding_direct → /guest, r3_trial_onboarding_direct → /4aa1… 完了済み) | 閉じる |
| 裏取り 6 (04 §4 の検査) | tsc / vitest を自分で再実行、app/dev/billing-demo の不在、`git diff app/_libs/plan.ts` に REQUIRE の差分が無いこと (64 行 false) | 記録どおり |
| 実測 1 (CR-2-02 購入成功) | r3b_purchase_ok: /start?step=purchase&plan=year → purchase(ok) → verify 200 (1 回) → トースト「反映しています…」→ `/` → /4aa1…(本人ホーム) | 着地は本人ホーム。ラウンド 2 の「/start に戻される」は解消。閉じる |
| 実測 2 (CR-2-02 復元成功) | r3b_restore_ok: restore(ok) → /api/apple/restore 200 → alert「契約が見つかりました…」→ `/` → ホーム。r3b_restore_ok_not_onboarded (onboarded を false に書き換え): → /onboarding → (完了済みなので) ホーム | /onboarding への経路が通る。閉じる |
| 実測 3 (CR-2-02 中断側) | r3b_purchase_cancel → URL が /start (?step= 消える)・トースト「購入をやめました。いつでも再開できます」。r3b_purchase_verify500 → /start・「確認できませんでした。購入を復元をお試しください」。r3b_restore_none → /start・「この Apple アカウントに契約はありません」 | EXTRA-013 どおり |
| 実測 4 (middleware の退行) | trial (非匿名) で /login?returnTo=%2Fguest%2Flibrary を開く → /4aa1…?returnTo=… (r3_trial_login_redirect) | 既ログインの転送は生きている。台帳 TC-0112 相当 |
| 実測 5 (CR-1-02 の退行) | 匿名で /76da…/settings → /guest (r3_anon_own_settings) | 無限リダイレクトなし |
| 実測 6 (設定 6 状態) | trial 無料期間中 / active 契約中 / cancel 更新しない予定 / expired 契約切れ+再開する / internal 運営 / free 未加入+アルコプラスをはじめる (r3_*_settings) | isPlus の変更で他の状態は崩れていない |
| 実測 7 (veil の下) | Web のゲストゲート (/guest/scores/cmq2…) で下タブ「ライブラリ」の中心に elementFromPoint | 最前面はシート内の要素 (isVeil: true)。veil z-index 130 > タブ 90・ヘッダ 120。契約ゲート (noLater) では閉じる手段が無いので出口が無い → CR-3-01 |
| DB 読み 1 | GuestEvent 直近 3 日: gate_shown generic path=null 22 件・start_screen generic 80 件 | 契約ゲートとログイン済みの /start が計測を汚している → CR-3-04 |
| DB 読み 2 | 検証ユーザーの Performance 0 件・guest は role=guest・guestExpiresAt 2026-09-11 (Cron 対象) | seed の形は 01_plan §2 どおり |
| 台帳の抜け探し 1 | B 軸 ゲスト × /login (TC-0082 / TC-0092) | CR-2-03 の期待 (「フォームが出る」) に直っていない。TC-0082 の証跡は 3102 (stripe モード) の stripe_native_login.png で「合格」、TC-0092 は「人へ」のまま。匿名で自動化できる (r2fix と私の r3_anon_login が既にそれ) → CR-3-05 |
| 台帳の抜け探し 2 | D 軸「購入成功 → / → ホーム／/onboarding に着く」 | TC-0039 が「購入成功後の遷移は人へ」のまま。今回 RSC 書き換えで自動化した (resume.json)。復元の /onboarding 経由も同様 → CR-3-05 |
| 台帳の抜け探し 3 | CR-2-05 / CR-2-07 の相手側の行 | 「殻+apple ではライブラリの帯が残る」行が無い (TC-0076 の証跡は変更前の撮影)。「契約ゲートは veil クリック・Escape で閉じない」行が無い。B 軸 × /login のログイン済み 6 行 (TC-0102/0112/0122/0132/0142/0152) は 1 行の playwright で埋まるのに「未実施」 → CR-3-05 |
| 台帳の抜け探し 4 | 実測列の取り違え | TC-0004 / TC-0048 (/login の描画) の実測が本人ホームの本文、TC-0470 / TC-0474 (getSignedUploadUrl・/api/plan/usage) の実測が設定画面の本文。判定「合格」の根拠が列に無い → CR-3-05 |
| コード読み 1 (CR-2-02 の反例探し) | StartClient 179-189 行。`run.then(navigated => !navigated && replace("/start"))`。resumed ref・StrictMode の二重実行・loadState error 時 (purchase は待つ・restore は進む)・verify 409・fetch の例外 | 成功時に後発ナビゲーションが無いことは実測で確認。反例は見つからず。ただし成功直後に `finally(() => setBusy(false))` が走り、遷移が終わる前に CTA が押せる → CR-3-03 (S4) |
| コード読み 2 (GateSheet) | fixedPrimary の分岐で `remember("gate_signup")` と gate_shown の記録がログイン済みでも走る。placeOf は /guest 以外を generic に落とす | CR-3-04 |
| コード読み 3 (onboarding/page.tsx) | apple + free → ホーム、layout は contracted=false で /onboarding に送らない。往復にならない。trial/plus は通る (実測 r3b_restore_ok_not_onboarded で /onboarding に着く) | 反例なし |
| コード読み 4 (LibraryClient) | `showTryBanner = tryBanner && (!isAppleBilling() || native)`。stripe モードは tryBanner が元から false | 反例なし |
| コード読み 5 (getGuestTryState) | quota と同じ 15 分規則。error は両方で数えない。lastScore は数えた行から取るので quota (最新行) と差が出うるが、queued を除いた最新行が同じなら一致 | S4 未満。指摘にしない |
| コード読み 6 (planView) | `!teacherSummary` は teacherStudent の照会が例外で落ちると undefined になり帯が出る。先生機能は未公開 | S4 未満。指摘にしない |
| 空振り 1 | 契約ゲート (REQUIRE_SUBSCRIPTION=true) の veil クリック・Escape の実測 | 定数を私は書き換えられない。GateSheet.tsx 86 行・107 行の読解と、Web ゲストゲートでの veil の重なり (実測 7) で代替 |
| 空振り 2 | document (HTML) の page.route 差し替えで hasApple を立てる | 素通しでもハイドレーションが止まる (dbg2: passthrough で getProducts が呼ばれず、ブート画面のまま)。原因は追わず、RSC 応答の差し替えに切り替えた |
| 空振り 3 | r3b_control_no_rewrite (書き換え無しの対照) が /start?step=purchase から 3 秒後にホームへ戻った | 続きは走っていない (purchase 呼び出しなし・verify 0)。document で開いた対照 (r3_resume_control_no_rewrite) は /start に留まるので、ログイン直後にホームから push した私のハーネスの都合と判断。home.tsx・NativeChrome に router.replace は無い。原因未特定のまま記録 |
| 空振り 4 | CR-2-04 (/progress を契約切れで開く) | REQUIRE=true が要る。progress/page.tsx は guest 以外にゲートが無い (getGradingQuota を呼ばない) ので構造上は閲覧可。実測は実装者側の撮り直し待ち (台帳 未実施 6 行のまま) |

## 2. ラウンド 2 の指摘の閉じ判定

| ID | 04 の処理 | 私の確認 | 判定 |
|---|---|---|---|
| CR-2-01 (S2) | 直した (fixedPrimary) | 裏取り 1 | 閉じる |
| CR-2-02 (S2) | 直した (navigated を返す) | 実測 1〜3 (resume.json) | 閉じる。派生 CR-3-03 (S4) |
| CR-2-03 (S2) | 直した (middleware の is_anonymous) | 裏取り 2 + 実測 4 (退行なし) | 閉じる |
| O-1 (S2) | 直した (isPlus = plus か trial) | 裏取り 3 + 実測 6 | 閉じる。文言は CR-3-02 |
| O-3 / 未決 7a (S3) | 直した | 裏取り 5 + コード読み 3 | 閉じる |
| CR-2-04 (S3) | 台帳を未実施に | 空振り 4 | 開いたまま (実測待ち・実装者側)。判定には響かない (S3・人への差し戻しで合意済み) |
| CR-2-05 (S3) | 直した | 裏取り 4 | 閉じる |
| CR-2-06 (S3) | 直した | コード読み 5 | 閉じる |
| CR-2-07 (S3) | 直した | GateSheet 86/107 行 + 実測 7 | 閉じる。帰結として出口が無い → CR-3-01 |
| CR-2-08 (S4) | 対応しない・記録 | — | 妥当 |
| CR-2-09 / 10 / 12 (S4) | 記録を訂正 | 04_round-1-fix §4 を確認。60 件・/karte 404・TC-0874 | 閉じる。CR-2-10 は未追跡テスト 6 ファイルの add が残る (CR-3-05) |
| CR-2-11 (S4) | 直した | コード読み 6 | 閉じる |
| 所見 2 件 (結果カードの 1 行・CTA 文言) | 実装 | r2fix/ux.json の本文 + 私の r3b_* の本文に「2 週間無料ではじめる」 | 閉じる |
| CR-1-02 / CR-1-04 (条件つき) | — | 匿名の実測は今回私が行った (裏取り 2・実測 5) ので CR-1-02 は無条件で閉じる。CR-1-04 は 3102 未起動のまま条件つき | — |

## 3. 新規の指摘

### CR-3-01
- 重大度: S3
- 種別: 価値 (迷う・閉じ込められる) / 整合 (CR-2-07 の帰結)
- 対象: app/components/guest/GateSheet.tsx 107 行 (veil・z-index 130・noLater で閉じない)、app/[userId]/components/BottomTabs.module.css 9 行 (z-index 90)・Header.module.css 17 行 (120)。呼び出し元 scores/[scoreId]/page.tsx 380 行・practice/[category]/[itemId]/page.tsx 303 行・lessons/page.tsx 78 行 (いずれも noLater)。app/start/StartClient.tsx 278 行「ゲストにもどる」
- 何が起きるか: 契約切れ・契約なしの人が曲・教材・レッスンの行を押すと、シートが下タブ・ヘッダの「‹ ライブラリ」・アカウントメニューをすべて覆い、閉じる手段が無い (veil・Escape・あとで が全部無効)。殻には戻るボタンが無いので、間違えて開いた人の出口は「再開する」→ /start → 「ゲストにもどる」→ /guest → (layout がログイン済みを) ホームへ、の 3 手だけ。しかも /start の唯一の退出リンクがログイン済みの人にも「ゲストにもどる」と出る (ゲストではないのに)。一覧は見られる (§8-8) はずなのに、一覧に戻れない
- 再現手順: REQUIRE_SUBSCRIPTION=true で verify-billing-expired にログイン → ライブラリ → 任意の曲 → シート。画面のどこを押しても閉じない。「再開する」→ /start → 「ゲストにもどる」でようやくホーム
- 根拠: 実測 7 (Web ゲストゲートでの elementFromPoint。契約ゲートも同じ veil)、evidence/require/expired_song.png (画面下まで veil)、GateSheet.tsx 86 行・107 行・140 行、StartClient.tsx 278 行は session を見ていない
- 期待: 契約ゲート (noLater) には「ライブラリにもどる」か「ホームにもどる」の 1 リンクを置く (または下タブを veil より前に出す)。/start の退出リンクは session が "user" のとき「ホームにもどる」にする。台帳 B 軸「契約切れ × 曲詳細のゲート」に「一覧に戻れる」を足す

### CR-3-02
- 重大度: S3
- 種別: 適合 (REQ-014・REQ-058) / 価値 (だまされたと感じる)
- 対象: app/[userId]/settings/PlanCard.tsx 37 行 `if (p.isPlus && st === "trialing") return { chip: "無料期間中", text: "アルコの採点は無制限で使えます。無料期間は … までです。" }`
- 何が起きるか: 無料期間中の人の設定カードが「採点は無制限で使えます」と言う。要件 (v2.7 §2 表 46 行) は無料期間中を「1 日 10 分 かつ 8 本・基礎練 1 日 5 本」と定め、同じ人の録音画面は「今日の採点 0/8回 ・ あと 10 分」(require/trial_song) と出す。画面同士が矛盾し、上限に当たった人は設定の文言に裏切られる。O-1 を直したことでこの文言が初めて本番の trial ユーザーに見えるようになった (直す前は「未加入」だった)
- 再現手順: verify-billing-trial で /settings (evidence/critic-r3/r3_trial_settings.png)
- 根拠: 上記行。REQ-054 の「照合報告で一致済」はモックとの照合であり、REQ-014 との整合は確かめられていない
- 期待: trialing の本文を「1 日 8 回・10 分まで採点できます。無料期間は … までです。」のように上限のある文言にする (数値は plan.ts の定数から)。台帳 A 行 REQ-054 に「REQ-014 の上限と矛盾しない」を足す

### CR-3-03
- 重大度: S4
- 種別: 価値 (待たされる) / 整合 (CR-2-02 の直しの残り)
- 対象: app/start/StartClient.tsx 132-133 行 (`router.replace("/")` の直後に return true)・188 行 `.finally(() => setBusy(false))`・161 行 (onStart の finally)
- 何が起きるか: 購入成功で `router.replace("/")` を発行した直後に busy が false に戻り、`/` → `/<uuid>` (→ /onboarding) の往復が終わるまでプラン画面が押せる状態で残る。トーストは 2.4 秒で消える。実測 (r3b_purchase_ok) では /start に 8 秒留まった (dev の初回コンパイル込み。本番は 1〜2 秒程度の見込み)。その間に CTA を押すと購入シートが再び出る (StoreKit 側は「登録済み」を返す)
- 期待: 遷移を発行した後は busy を解除しない (成功時は unmount に任せる)、または「反映しました。ホームへ移ります…」を遷移まで出し続ける。O-10 (timeout 無し) と同じ箇所なので一緒に

### CR-3-04
- 重大度: S4
- 種別: 整合 (計測の汚れ)
- 対象: app/components/guest/GateSheet.tsx 81 行 (gate_shown)・92 行 (gate_signup / gate_login)・121 行 (fixedPrimary の remember)、app/_libs/guestEvents.ts 17-25 行 (placeOf は /guest 以外を generic)、app/[userId]/admin/guest-stats/page.tsx
- 何が起きるか: 契約ゲート (ログイン済み) が出るたびに gate_shown が place=generic・path=null で記録され、「再開する」を押すと gate_signup が入る。管理画面「シートが出た場所」の generic 行と進んだ比率がゲスト以外で膨らむ。直近 3 日で gate_shown generic 22 件 (実装者の require 撮影が主因と推測)。start_screen も /start を開いた全員 (ログイン済み含む) で 80 件
- 期待: 契約ゲートでは recordGuestEvent を呼ばない (fixedPrimary なら記録を止める)、または place を "plan" に分けて集計表を分ける。start_screen は要件どおりなら注記だけ

### CR-3-05
- 重大度: S4
- 種別: 証跡の不備 (台帳と作業ツリー)
- 対象: 02_cases.csv と git の状態
- 内容:
  1. TC-0082 (ゲスト未使用 × /login) の証跡が 3102 の stripe_native_login.png (別モード) で「合格」。TC-0092 は「人へ」。CR-2-03 の期待「フォームが出る」に直し、匿名の実測 (r2fix/anon_login_page または critic-r3/r3_anon_login) を付ける
  2. TC-0039 の「購入成功後の遷移は人へ」は自動化済み (critic-r3/resume.json の r3b_purchase_ok・r3b_restore_ok・r3b_restore_ok_not_onboarded)。D 軸に着地の行を足して合格に
  3. TC-0102/0112/0122/0132/0142/0152 (ログイン済み × /login → ホーム) は「未実施」だが、実測 4 の 1 行で埋まる (trial は critic-r3/screens.json r3_trial_login_redirect)
  4. 「殻+apple のライブラリに帯が残る」(critic-r3/r3_native_guest_library) と「契約ゲートは veil・Escape で閉じない」の行が無い
  5. TC-0004 / TC-0048 / TC-0470 / TC-0474 の実測列が別画面の本文 (fill_cases の割り付けの取り違え)。判定の根拠が列に無い
  6. 未追跡の新規テスト 6 ファイルは `git status` の `??` にあり、`git diff --stat` に出ない。コミット時にファイル名を指名して add すること (CR-2-10 の続き)。next-env.d.ts の差分 (dev の生成物) は入れない
  7. CR-2-04 の /progress 撮り直し 6 行は未実施のまま

## 4. 判定

条件つき合格。

- S1・S2: なし。ラウンド 2 の S2 4 件 (CR-2-01/02/03・O-1) はすべて自分の手で再現できないことを確かめて閉じた。CR-2-02 は hasApple の書き換えで購入成功・復元成功・中断 4 経路の着地を実測した
- S3: CR-3-01 (契約ゲートに一覧へ戻る出口が無い・/start の「ゲストにもどる」がログイン済みに出る)、CR-3-02 (無料期間中のカードが「無制限」)。この 2 件は対応するか Tetsuo へ差し戻して合意すること。加えて CR-2-04 (/progress の実測) が実装者側で未実施
- S4: CR-3-03 (成功後の busy 解除)、CR-3-04 (計測の汚れ)、CR-3-05 (台帳と作業ツリーの記録)

空振り: 契約ゲートの veil の実測 (REQUIRE 定数)、document 差し替えによる hasApple の書き換え、対照ケースのホームへの戻り (原因未特定・続きは走っていない)、/progress の契約切れでの実測。

次のラウンドで見せてほしい証跡: (1) CR-3-01 の出口を足したうえで、契約切れの曲ゲートから一覧に戻れる記録、(2) trial の設定カードの新しい文言、(3) /progress を契約切れで開いた記録 (CR-2-04)、(4) 台帳の 5 点の訂正と、コミットに含めるファイルの一覧 (テスト 6 ファイルを含む・next-env.d.ts を含まない)。
