# 批評 ラウンド 6: 登録と課金 (Apple アプリ内課金)

- 対象: コミット 793f4da7 + 作業ツリーの未コミット差分 (ラウンド 5 の修正)。app/ 配下の差分は 3 ファイルだけ: app/start/start.module.css (`.legal button:disabled` の追加・`.toast` の折り返し)、app/components/guest/GateSheet.module.css (`.later` に text-align center)、app/start/StartClient.tsx (doRestore の `!res.ok` 分岐・Web の出口を App Store リンクと戻るリンクの両方に)。ほかは docs/verify/billing-iap/ の 4 ファイルと next-env.d.ts (dev の生成物)
- ラウンドの位置づけ: ラウンド 5 (条件つき合格・S3 1・S4 5) の修正後の 1 回目。「2 ラウンド連続で新規指摘ゼロ」の数え直しはラウンド 5 から
- 読んだもの: 03_round-5-critic.md・04_round-5-fix.md・99_report.md (第 4 版)・02_cases.csv (895 行の判定分布と TC-0551/0553/0887〜0895)・`git diff` (上記 3 ファイルと fill_cases.py / gen_cases.py)・start.module.css / GateSheet.module.css / GateSheet.tsx / StartClient.tsx の現物全文・api/apple/restore/route.ts・billingMode.ts・scripts/_tmp_critic_r5.mjs (手口の流用元)・evidence/critic-r5/r5_K.json
- 自分の手で実行したもの (すべて読み取り。app/ は書き換えていない。DB への直接の書き込みなし。画面を歩いた分だけアプリ自身が GuestEvent を足す):
  - `npx tsc --noEmit` → exit 0 (_tmp/critic_r6_tsc.log)
  - `npx vitest run` 課金関連 (app/_libs/apple・app/api/apple・isNativeApp・planGrant・plan・gateText) → exit 0 (_tmp/critic_r6_vitest.log)
  - `npx eslint app/start/StartClient.tsx app/components/guest/GateSheet.tsx` → error 0・warning 1 (208 行の deps に `say` が無い。ラウンド 5 と同じ・実害なし)
  - scripts/_tmp_critic_r6_events.ts (GuestEvent の集計・読み取りのみ。restore_none / restore_ok の総数も出す)
  - scripts/_tmp_critic_r6.mjs (playwright・3101 apple モード・iPhone 幅 402×874。RSC 応答の `"hasApple":false` を true に書き換える手口と偽ブリッジは r5 の流用)。出力 evidence/critic-r6/r6_K.json・r6_BAHIN.json・r6_EHIN.json・r6_W.json・r6_P.json・r6_*.png
    - K: トーストの幾何を出た瞬間 (+0.35 秒) に測る。7 文言 (verify abort 33 字 / verify 500 24 字 / restore abort 30 字 / restore 409 39 字 / restore 500 28 字 (新文言) / purchase cancel 19 字 / pending 9 字)
    - E: verify 5 秒遅延 → busy 中の「購入を復元」の opacity と cursor
    - B: 殻ゲストの曲ゲート「ログイン」の寄り。A: Web ゲストの曲/レッスンゲートの「あとで」「ログイン」の寄りと Escape / 帯 / あとで
    - H / I / N: 「購入を復元」→ /api/apple/restore を 500 (text/html) / 401 / 200 none で返し、文言と GuestEvent restore_none の前後比較
    - P: dev の JS チャンクから `appStoreUrl` の compiled 形を探す → W: チャンクの `process.env.NEXT_PUBLIC_APP_STORE_URL` の読み出し行を `"https://apps.apple.com/…"` に書き換え、Web (殻でない) の /start を free と匿名で開く (CR-5-04 の再現。env は偽装できないのでチャンクを差し替えた)
- 判定は末尾

## 0. 先に結論

条件つき合格。S1・S2 は無い。ラウンド 5 の 6 件は自分の手で確かめて 5 件を閉じ、1 件 (CR-5-06 記録) は半分だけ閉じた。ただし新規指摘はゼロではない: S3 が 1 件 (CR-5-01 の直し方の副作用。トーストが折り返すようになったが、絶対配置 + `left: 50%` の shrink-to-fit で箱の幅が画面の半分 (201 px) に固定され、24 字の従来文言まで 3 行になり最終行に「さい」だけが残る。9 文言中 6 文言の見た目が変わった) と S4 が 4 件 (App Store URL 設定時の Web 出口が主ボタンと同じ見た目の 2 段・warn の表示時間が 2.4 秒のまま・99_report の §1/§4/§6c がまだコミット前の記述・Web /start の見出しの改行位置 (既存))。収束条件 (2 ラウンド連続で新規ゼロ) は満たしていない。

## 1. 試したことの一覧 (空振りを含む)

| # | 試したこと | 結果 |
|---|---|---|
| 裏取り 1 (CR-5-01・実測) | r6_K_toast_verify_abort: CTA → 偽ブリッジ purchase(ok) → verify を abort → トースト表示 +0.35 秒で幾何を測る | 33 字が **3 行** (行幅 154/154/154) に折り返し、文字の箱 right 278 px ≤ viewport 402 px・textOutsideViewport false。画面の右端で切れる現象は無い。**閉じる**。ただし箱の幅が 201 px (= 402 × 50%) で `max-width: 92%` (370 px) に届いていない → CR-6-01 |
| 裏取り 1b (K の残り 6 文言) | verify 500 (24 字)・restore abort (30)・restore 409 (39)・restore 500 (28・新文言)・purchase cancel (19)・pending (9) | すべて viewport 内。ただし箱の幅は 9 字の pending (170 px) 以外すべて 201 px。24 字 → 3 行 (154/154/**28**: 最終行「さい」だけ)・30 字 → 3 行・39 字 → **4 行** (箱の高さ 103 px)・19 字 → 2 行。r5 では 24 字・19 字は 1 行で収まっていた → CR-6-01 |
| 裏取り 2 (CR-5-02・実測) | r6_B_native_guest_try: 殻ゲストの曲ゲート「登録なしで 1 回ためす / はじめる / ログイン」 | 「ログイン」(A・textAlign center・display block) の中心差 **0 px** (r5 は -152 px)。主・従も 0 px。**閉じる** |
| 裏取り 3 (CR-5-03・実測) | r6_E_resume_verify_slow_ok: /start?step=purchase の続きで verify を 5 秒遅らせ、0.5 秒ごとに「購入を復元」の computed style を見る | 1.2〜4.8 秒: restore=disabled **opacity 0.45・cursor default** (アイドル時は 1・pointer)。CTA は disabled+busy 0.55。6.8 秒で `/`、7.9 秒で本人ホームに着地。**閉じる**。CR-3-03 の退行もなし |
| 裏取り 4 (CR-5-04・実測に格上げ) | r6_P で compiled 形 (`const v = __turbopack_context__…["default"].env.NEXT_PUBLIC_APP_STORE_URL;`) を確かめ、r6_W でその行を書き換えて Web の /start を開く | free: 「App Store を開く」(href = 差し替えた URL) と「ホームにもどる」(/) の両方。匿名: 「App Store を開く」と「ゲストにもどる」(/guest)。**閉じる**。ただし 2 つとも同じ紺の主ボタンの見た目 (`.retry` が `.webNote a` に負ける) → CR-6-02 |
| 裏取り 5 (CR-5-05・実測) | r6_H (restore を 500 text/html)・r6_I (401)・r6_N (200 `{result:"none"}`・対照)。前後で GuestEvent の restore_none の総数を数える | H・I: 0.3 秒で「確認できませんでした。時間をおいてもう一度お試しください」(2.6 秒で消える)。N: 「この Apple アカウントに契約はありません」。restore_none の総数は走行前 1 → 走行後 **2** (N の 1 件だけ増え、H・I では増えない)。**閉じる** |
| 裏取り 6 (CR-5-06・記録) | 99_report.md の全文 grep と 02_cases.csv の再集計 (合格 224・不合格 3・読解 458・人へ 194・未実施 16 = 895。04 の数字と一致)。TC-0551/0553 の実測欄・TC-0887〜0895 の 9 行 | 台帳は動いた (ラウンド 3〜5 の行 9 本・TC-0551/0553 を更新)。§2 に next build の結果が入った。**半分閉じる**。残り: 99_report の 3 行目「対象: コミット f12bdfb3」、§1「批評ラウンド 4 は条件つき合格」「本番はまだコミット f12bdfb3 のまま」「残る S3 は 1 件 (CR-4-01) … 判断待ち」、§4 見出し「すべて未コミット・作業ツリー」、§6c「配信しない限り … 401」がコミット・配信後の実態と食い違ったまま → CR-6-04 |
| 退行 1 (GateSheet の他の呼び出し元) | r6_A_web_guest_song: Web ゲストの曲ゲート「iPhone アプリで登録 / ログイン / あとで」。「あとで」(BUTTON) の中心差 0・「ログイン」(A・secondary) 0。Escape → 帯 → 帯で再表示 → あとで → 帯。r6_A_web_guest_lesson: 「あとで」0・Escape で消える (hide) | `.later` の text-align center は button に副作用なし。退行なし |
| 退行 2 (短い文言の見た目) | r6_K_toast_purchase_pending (9 字) | 1 行 (170 px)。短い文言は 1 行のまま。**19 字以上は折り返す** (退行 → CR-6-01 に含める) |
| 退行 3 (restore の正常系の記録) | r6_N (200 none) | 「契約はありません」と restore_none の記録は残る。`!res.ok` 分岐が none の経路を奪っていない |
| 退行 4 (CTA の busy) | r6_E の trace | CTA は 0.7 秒から着地まで disabled。opacity 0.55。r5_E と同じ |
| 反例 1 (新規) | トーストの箱の幅を測る (K の box.width と parentW) | 絶対配置で `left: 50%`・`right: auto`・`width: auto` の要素の shrink-to-fit の「利用可能幅」は 包含ブロック幅 − left = 402 − 201 = 201 px (CSS 2.1 §10.3.7)。`white-space: nowrap` のときは preferred width が勝って 1 行で伸びていたが、normal にしたことで 201 px で折り返す。`max-width: 92%` は一度も効いていない → CR-6-01 |
| 反例 2 (新規) | App Store URL 設定時の Web の出口の見た目 (r6_W_web_free_appstore.png) | 「App Store を開く」234×53・「ホームにもどる」223×55 が同じ紺・同じ影で 2 段。`.retry` (枠だけの丸ボタン) は `.webNote a` (0,1,1) に負けて background / padding / border-radius / box-shadow がすべて上書きされる → CR-6-02 |
| 空振り 1 | `.legal button:disabled` が `.legal a, .legal button { cursor: pointer }` より前に書かれている。詳細度で負けないか | (0,2,1) > (0,1,1)。r6_E で cursor=default を実測。反例なし |
| 空振り 2 | GateSheet 130 行の inline style (textAlign center) と 137 行の `.later` の重複で 1 回ためし以外の分岐が崩れないか | r6_A / r6_B で主・従・あとで・ログインの中心差すべて 0。反例なし |
| 空振り 3 | doRestore の `!res.ok` が 409 の前後で conflict を隠さないか (409 は `res.status === 409` が先) | r6_K_toast_restore_conflict で「この契約は別のアカウントに結ばれています。そのアカウントでログインしてください」が出る。反例なし |
| 空振り 4 | `say` の 2.4 秒固定が復元の alert (window.alert) と競合しないか | r6_E は purchase 経路で alert なし。restore ok の経路は r4/r5 で確認済みで今回の差分に含まれない。今回は確かめていない (未確認・差分外) |
| 空振り 5 | r5 の K で restore 系の click が 30 秒タイムアウトした原因 | dev の Next バッジ (nextjs-portal・左下 「N」) が 402 px 幅では「購入を復元」(rect 24,827,59×19) に重なり、playwright の actionability 待ちが終わらない。バッジを隠すと押せる。**製品の不具合ではない** (本番に dev バッジは無い)。r6_K_toast_verify_500.png の左下に写っている |
| DB 読み | 走行前 (01:15): 総行数 296・restore_none 1・restore_ok 2。走行後 (01:27): 総行数 **336** (+40・すべて私の走行)・restore_none 2・restore_ok 2 | 直前 15 分: gate_later 2・gate_shown 3 (path はすべて /guest…)・purchase_cancel 1 (K)・purchase_ok 1 (E の verify 200 差し替え。DB の plan は変わらない)・restore_none 1 (N)・signin_ok 1・start_screen 31。契約ゲート由来の path=null の gate_* は 0 |

## 2. ラウンド 5 の指摘の閉じ判定

| ID | 04 の処理 | 私の確認 | 判定 |
|---|---|---|---|
| CR-5-01 (S3) | `.toast` を white-space normal・text-align center・line-height 1.5・border-radius 18px に | 裏取り 1: 33 字が 3 行に折り返し viewport 内 (textBox.right 278 / 402)。r6_K_toast_verify_abort.png | **閉じる** (画面外に切れる現象は無い)。派生: 箱の幅が 201 px 固定で 24 字の従来文言まで 3 行になる → CR-6-01 (S3)。期待の後半 (warn は 4 秒程度) は未対応 → CR-6-03 (S4) |
| CR-5-02 (S4) | `.later` に text-align center | 裏取り 2: 「ログイン」の中心差 0 px (r5 は -152) | **閉じる** |
| CR-5-03 (S4) | `.legal button:disabled { opacity: 0.45; cursor: default }` | 裏取り 3: busy 中 opacity 0.45・cursor default を実測 | **閉じる** (04 の記述は 0.45 で、r5 の期待 0.55 と数字が違うが薄く見える目的は満たす) |
| CR-5-04 (S4) | App Store リンクと戻るリンクを両方出す | 裏取り 4: チャンク差し替えで free・匿名とも両方出る (実測) | **閉じる**。派生: 2 段とも主ボタンの見た目 → CR-6-02 (S4) |
| CR-5-05 (S4) | `!res.ok` は「確認できませんでした。時間をおいて…」、restore_none は result=none のときだけ | 裏取り 5: 500・401 で新文言、restore_none は増えない。200 none では増える | **閉じる** |
| CR-5-06 (S4) | 99_report 第 4 版・台帳 9 行追加・TC-0551/0553 更新 | 裏取り 6: 台帳と §2 は直った。99_report の §1・§4・§6c と 3 行目は古いまま | **半分だけ**。残り → CR-6-04 |
| CR-2-04 (S3・/progress) | 未実施のまま | — | 開いたまま (合意済み)。判定には響かない |

## 3. 新規の指摘

### CR-6-01
- 重大度: S3
- 種別: 整合 (CR-5-01 の直しの副作用) / 価値 (雑に見える)
- 対象: app/start/start.module.css 65 行 `.toast { position: absolute; left: 50%; … transform: translateX(-50%) …; white-space: normal; … max-width: 92%; }` (`width` 未指定)
- 何が起きるか: 絶対配置で `left: 50%`・`width: auto` の要素は、幅が「包含ブロック幅 − left」= 画面の半分 (402 px なら 201 px) を上限に shrink-to-fit で決まる (CSS 2.1 §10.3.7)。nowrap のときは preferred width が勝って 1 行で伸びていたので隠れていたが、normal にしたことで **すべてのトーストが 201 px で折り返す**。`max-width: 92%` (370 px) は一度も効いていない。実測: 33 字 → 3 行 (154/154/154)、24 字「確認できませんでした。購入を復元をお試しください」→ 3 行で最終行が「さい」だけ (154/154/28)、30 字 → 3 行、39 字 (別アカウント) → 4 行・高さ 103 px、19 字「購入をやめました。いつでも再開できます」→ 2 行。r5 では 24 字・19 字は 1 行 (textBox.right 374 / 334) で収まっていた。9 文言中、1 行のままなのは 9 字の「承認を待っています」と 8 字の「反映しています…」だけ。払った直後の失敗の案内が、画面の半分の幅の縦長の箱に 1 文字だけの行を残して出る
- 再現手順: scripts/_tmp_critic_r6.mjs `CASES=K` (trial でログイン → /start へ push → hasApple 書き換え → CTA または「購入を復元」→ 偽ブリッジ → verify / restore を abort・500・409 → トースト表示の +0.35 秒で getBoundingClientRect と Range.getClientRects を測る)
- 根拠: evidence/critic-r6/r6_K.json (全 7 件の box.width 201 (pending だけ 170)・lineRects・parentW 402)・r6_K_toast_verify_500.png (「確認できませんでした。/ 購入を復元をお試しくだ / さい」の 3 行)・r6_K_toast_restore_conflict.png (4 行)・r5_K.json (修正前の 24 字・19 字は 1 行)
- 期待: `.toast` に `width: max-content` を足す (絶対配置でも preferred width を取り、`max-width: 92%` で頭打ちになる)。これで 24 字以下は 1 行に戻り、33 字は 370 px の箱で 2 行、39 字は 2 行になる。別案は `left: 4%; right: 4%; width: auto; transform: translateY(…)` にして内側で中央寄せ。撮り直し: K の 7 件で box.width が文言ごとに変わり 370 px を超えないこと・24 字と 19 字が 1 行 (lineRects が 1 要素) であること

### CR-6-02
- 重大度: S4
- 種別: 価値 (出口が主ボタンと同じ重さ) / 整合 (CR-5-04 の直しの見た目)
- 対象: app/start/StartClient.tsx 232-233 行 (`<a href={url}>App Store を開く</a>` と `<Link … className={styles.retry}>ホームにもどる</Link>`)、start.module.css 80 行 `.webNote a { background: var(--primary); … box-shadow: … }`・70 行 `.retry`
- 何が起きるか: NEXT_PUBLIC_APP_STORE_URL が設定された本番の Web で /start を開くと、「App Store を開く」と「ホームにもどる (ゲストにもどる)」が同じ紺の塗り・同じ影・ほぼ同じ幅 (234 px / 223 px) で 2 段に並ぶ。`.retry` (枠だけの丸ボタン) は `.webNote a` (詳細度 0,1,1) に background / padding / border-radius / box-shadow / font-size を上書きされ、名前どおりの見た目にならない。売る動線の画面で出口が主ボタンと見分けがつかない。URL 未設定 (dev) では戻るリンク 1 つだけなので目立たなかった
- 再現手順: scripts/_tmp_critic_r6.mjs `CASES=W` (JS チャンクの `process.env.NEXT_PUBLIC_APP_STORE_URL` の読み出し行を https の URL に書き換えて Web の /start を free と匿名で開く)
- 根拠: evidence/critic-r6/r6_W.json (2 リンクの rect と class)・r6_W_web_free_appstore.png・r6_W_web_guest_appstore.png
- 期待: 戻るリンクを `.webNote a.retry` か `.webNote .retry` で上書きして枠だけの従ボタンに (または `.webNote a` を `.webNote a:not(.retry)` に)。本番の NEXT_PUBLIC_APP_STORE_URL の設定有無は **未確認** (ラウンド 5 と同じ)

### CR-6-03
- 重大度: S4
- 種別: 整合 (CR-5-01 の期待の後半が未対応)
- 対象: app/start/StartClient.tsx 71-74 行 `say` (`window.setTimeout(() => setToast(null), 2400)` 固定)
- 何が起きるか: 33 字・3 行 (CR-6-01 を直しても 2 行) の案内が 2.3 秒で消える (r6_K の各件: 0.3 秒 show → 2.6 秒 hide)。「電波のある場所で、購入を復元をお試しください」を読み終える前に消え、復元の案内が伝わらない。04_round-5-fix.md にこの項目の記述が無い
- 根拠: evidence/critic-r6/r6_EHIN.json の toasts (H: 0.3 秒 show・2.6 秒 hide)・StartClient.tsx 73 行
- 期待: warn のときは 4 秒程度 (`warn ? 4000 : 2400`)。または文字数に比例 (例 1200 + 80 ms × 文字数)

### CR-6-04
- 重大度: S4
- 種別: 証跡の不備 (報告)。CR-5-06 の 1 の取り残し
- 対象: docs/verify/billing-iap/99_report.md 3 行目・§1 (11-14 行)・§4 見出し (46 行)・§6c (123 行)
- 内容: 第 4 版と銘打ち §2・§3 は更新されたが、次がコミット 793f4da7 (09:51)・本番配信後の実態と食い違ったまま: 3 行目「対象: コミット f12bdfb3 (main・本番配信済み) と、作業ツリーの未コミット修正 (ラウンド 1・2 の指摘 …)」、§1「批評ラウンド 4 は条件つき合格」「ただし本番はまだコミット f12bdfb3 のまま … 本番で続いている」「残る S3 は 1 件。… CTA が回ったまま戻らない (catch が無い)。1 行の修正で、判断待ち (§6b)」(CR-4-01 は 793f4da7 で直り、r5 で閉じている)、§4 見出し「直したもの (すべて未コミット・作業ツリー)」(ラウンド 1〜4 はコミット済み)、§6c「作業ツリーの修正をコミットして配信するか。配信しない限り、本番の Apple 通知と Cron は 401 …」(配信済み)。§3 の表 (ラウンド 5 まで) と §1 の結論が同じ文書の中で矛盾する
- 期待: 3 行目を「コミット 793f4da7 (本番配信済み) + ラウンド 5 の修正 (未コミット)」に、§1 をラウンド 6 の結果に、§4 を「ラウンド 1〜4 はコミット済み・ラウンド 5 は未コミット」に、§6c を「ラウンド 5・6 の修正をコミットするか」に書き換える

### CR-6-05
- 重大度: S4 (既存・今回の差分ではない)
- 種別: 価値 (見出しの改行)
- 対象: app/start/StartClient.tsx 223 行 `<h3>アルコプラスは<br />iPhone アプリではじめられます</h3>`、start.module.css 78 行 `.webNote h3 { font-size: min(2.8cqh, 25px) }`・77 行 `.webNote { padding: 0 10% }`
- 何が起きるか: iPhone 幅 (402 px) の Web の /start で見出しが「アルコプラスは / iPhone アプリではじめられ / ます」と 3 行になり、「ます」だけが 3 行目に残る。内側の幅 322 px に対して 2 行目 (14 文字 + 半角) が 25 px では入らない
- 根拠: evidence/critic-r6/r6_W_web_free_appstore.png・r6_W_web_guest_appstore.png (URL の差し替えとは無関係に出る)
- 期待: 「iPhone アプリで<br />はじめられます」に改行を移すか、`.webNote h3` を min(2.8cqh, 22px) にする。今回の差分外なので判定には含めない

## 4. 判定

条件つき合格。

- S1・S2: なし
- ラウンド 5 の 6 件: CR-5-01 (画面外に切れる)・02・03・04・05 は自分の手で実測して閉じた。CR-5-06 は台帳と §2 が直り、99_report の本文が残った (半分)
- 既存の動線の退行: Web ゲストの曲/レッスンゲート (Escape / 帯 / あとで・「あとで」「ログイン」の中心差 0)・殻ゲストの 1 回ためしゲート・CTA の busy と着地・restore 200 none の文言と記録、いずれも退行なし。ただしトーストは 19 字以上の全文言で折り返し方が変わった (CR-6-01)
- S3: CR-6-01 (トーストの箱が画面の半分の幅に固定され、従来文言まで 3 行・1 文字の最終行になる)。対応するか Tetsuo へ差し戻して合意すること
- S4: CR-6-02 (App Store URL 設定時の Web 出口が主ボタンと同じ見た目)・CR-6-03 (warn の表示時間 2.4 秒のまま)・CR-6-04 (99_report の §1/§4/§6c がコミット前の記述)・CR-6-05 (Web /start の見出しの改行・既存)
- 新規指摘はゼロではないので、「2 ラウンド連続で新規ゼロ」の数え直しはここから

未確認 (自分では出せなかったもの): 本番の NEXT_PUBLIC_APP_STORE_URL の設定有無 (CR-6-02 の再現条件)・契約ゲートの実物 (REQUIRE_SUBSCRIPTION=false・r5 と同じ)・restore ok の alert と `say` の競合 (今回の差分外・確かめていない)。

空振り: `.legal button:disabled` の詳細度 (負けない・cursor default を実測)・GateSheet 130 行の inline style と `.later` の重複 (中心差すべて 0)・`!res.ok` が 409 の conflict を隠す (隠さない・文言を実測)・r5 の K の restore 系タイムアウト (dev の Next バッジが「購入を復元」に重なる harness 側の問題。製品の不具合ではない)。

GuestEvent: 私の走行で総行数 296 → 336 (+40)。内訳は start_screen・gate_shown/gate_later (A/B の /guest…)・purchase_cancel 1 (K)・purchase_ok 1 (E の verify 200 差し替え。DB の plan は変わらない)・restore_none 1 (N の 200 none。H・I の 500/401 では増えない)・signin_ok。契約ゲート由来の path=null の gate_* は増えていない。本番データへの直接の書き込みはしていない。統計を見るときは 2026-09-13 の verify-billing-* と匿名の行を除くこと。

次のラウンドで見せてほしい証跡: (1) CR-6-01 を直したうえで K の 7 件 (`CASES=K`) の box.width が文言ごとに変わり 370 px 以下、24 字と 19 字の lineRects が 1 要素、33 字と 39 字が 2 行になった記録と iPhone 幅の 1 枚、(2) `CASES=W` で「ホームにもどる」が枠だけの従ボタンになった記録 (rect と computed background)、(3) warn の表示時間を変えたなら H の toasts の show/hide の差、(4) 99_report の 3 行目・§1・§4・§6c を実態に合わせたもの。
