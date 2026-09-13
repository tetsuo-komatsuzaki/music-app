# 批評 ラウンド 5: 登録と課金 (Apple アプリ内課金)

- 対象: コミット 793f4da7 (main・本番配信済み)。作業ツリーとの差は next-env.d.ts の 1 行 (`.next/dev/types/routes.d.ts`・dev の生成物) だけで、app/ 配下に差分なし
- ラウンドの位置づけ: ラウンド 4 の指摘 6 件 (S3 1・S4 5) を「すべて直してコミット」した後の 1 回目。ここから 2 ラウンド連続で新規指摘ゼロなら合格
- 読んだもの: 03_round-4-critic.md・04_round-4-fix.md・99_report.md・02_cases.csv (879 行の判定分布と TC-0551/0553・TC-0004/0039/0048/0082/0092/0102/0112)・`git show 793f4da7` (StartClient.tsx / GateSheet.tsx / GateSheet.module.css / lessons/page.tsx / lessons/[lessonId]/page.tsx の差分と現物全文)・start.module.css・api/apple/restore/route.ts・billingMode.ts・plan.ts の REQUIRE_SUBSCRIPTION・PlanCard.tsx 37 行・evidence/require/screens.json の expired_lesson・scripts/_tmp_critic_r4.mjs / r4c.mjs (手口の流用元)
- 自分の手で実行したもの (すべて読み取り。app/ は書き換えていない。DB への直接の書き込みなし。画面を歩いた分だけアプリ自身が GuestEvent を足す):
  - `npx tsc --noEmit` → exit 0
  - `npx vitest run` 課金関連 7 ファイル (appleServer / isNativeApp / planGrant / plan / notifications route / verify route / gateText) → 7 files / 60 tests passed
  - `npx eslint app/start/StartClient.tsx app/components/guest/GateSheet.tsx` → error 0・warning 1 (StartClient.tsx 207 行: 続きの effect の deps に `say` が無い。say は useCallback([]) で安定なので実害なし)
  - _tmp/build_r4.log (09:50) → 「Compiled successfully in 49s」。04 §2 の「本番ビルド」は本当
  - scripts/_tmp_critic_r4_events.ts (GuestEvent の集計・読み取りのみ。`node --env-file=.env --env-file=.env.local --import tsx` で実行。sandbox からの `set -a; . .env` では env が入らず localhost に向いて ECONNREFUSED になるので注意)
  - scripts/_tmp_critic_r5.mjs (playwright・3101 apple モード。RSC 応答の `"hasApple":false` を true に書き換える手口と偽ブリッジはラウンド 3・4 の流用)。出力 evidence/critic-r5/r5_ABC.json・r5_DE.json・r5_FHIJR.json・r5_K.json・r5_*.png
    - A: Web ゲストの曲ゲート/レッスンゲート (退行)
    - B: 殻のゲスト曲ゲート (1 回ためしの分岐) の「ログイン」の寄り
    - C1/C2: /start の出口を押して着地 (殻 匿名 → /guest、殻 free → /)
    - D: /start?step=purchase の続きで verify を abort (CR-4-01 a)・D2: /start?step=restore の続きで restore を abort
    - E: verify 5 秒遅延 (CR-3-03 の退行・busy 中の「購入を復元」の見た目)
    - F: CTA を押す経路で verify を abort (CR-4-01 b)・J: verify 500
    - H: 「購入を復元」で /api/apple/restore が 500 (HTML)・I: 同 401
    - K: トーストの幾何 (文字の箱と viewport の関係) を、出た瞬間に測る
- 判定は末尾

## 0. 先に結論

条件つき合格。S1・S2 は無い。ラウンド 4 の S3 1 件 (CR-4-01) は自分の手で実測して閉じた。ただし新規指摘はゼロではない: S3 が 1 件 (CR-4-01 で足した案内の文言が iPhone 幅のトーストからはみ出して画面の外に切れる) と S4 が 5 件 (うち 3 件はラウンド 4 の直しの取り残し、1 件は新しい反例、1 件は記録の整合)。収束条件 (2 ラウンド連続で新規ゼロ) はこのラウンドでは満たしていない。

## 1. 試したことの一覧 (空振りを含む)

| # | 試したこと | 結果 |
|---|---|---|
| 裏取り 1 (CR-4-01 a・実測) | r5_D_resume_verify_abort: trial でログイン → ホームで 3 秒 → `router.push("/start?step=purchase&plan=year")` → hasApple を true に書き換え → 偽ブリッジ purchase(ok) → `/api/apple/verify` を route.abort("failed") | 0.9 秒でトースト「通信できませんでした。電波のある場所で、購入を復元をお試しください」(3.3 秒で消える)。1.5 秒で URL が `/start` (?step= が消える)。CTA は enabled・「購入を復元」も enabled。最後に「購入を復元」を押すと橋の restore が呼ばれた (calls に restore が増える)。**閉じる**。ただし文言がはみ出す → CR-5-01 |
| 裏取り 2 (CR-4-01 a・restore 側) | r5_D2_resume_restore_abort: `/start?step=restore` の続きで `/api/apple/restore` を abort | 1.2 秒で「通信できませんでした。電波のある場所でもう一度お試しください」・URL が `/start` に戻る・「購入を復元」を押し直すと再び restore が走る (restore_api=2)。**閉じる** |
| 裏取り 3 (CR-4-01 b) | r5_F_click_verify_abort: CTA を押す経路で verify を abort | 0.3 秒でトースト (2.4 秒で消える)・busy が戻る・「購入を復元」が押せる。**閉じる** |
| 裏取り 4 (CR-3-03 の退行) | r5_E_resume_verify_slow_ok: verify 5 秒遅延 | 1.1〜7.3 秒は CTA が disabled+busy、7.8 秒で `/`、8.3 秒で本人ホーム。退行なし |
| 裏取り 5 (CR-4-05) | 同 r5_E の trace の「購入を復元」列 | busy 中は `disabled` になる (1.1〜7.3 秒 restore=disabled)。ただし opacity は 1.0 のまま (アイドル時も 1.0・色 rgb(94,112,153)・cursor pointer)。見た目が変わらない → CR-5-03 |
| 裏取り 6 (CR-4-02) | r5_B_native_guest_try: 殻 (偽ブリッジ) のゲストで曲ゲート → 「ログイン」(A.later) の文字の箱と要素の箱の中心差 | **-152px (textAlign start)**。ラウンド 4 と同じ値。主 (0px)・従「はじめる」(0px) は中央。契約ゲートの「ライブラリにもどる」は inline style で中央になった (コード 130 行) が、指摘に挙げた 137 行の「ログイン」は直っていない → CR-5-02 |
| 裏取り 7 (CR-4-03) | REQUIRE_SUBSCRIPTION=false (plan.ts 64 行) なので契約ゲートは私の環境では出せない。代わりに GateSheet.tsx 69-72 行の正規表現を 9 通りの pathname で node 実行: `/<uuid>/lessons` と `/<uuid>/lessons/staccato` → `/<uuid>/lessons`「レッスンの一覧にもどる」、`/<uuid>/library`・`/scores/..`・`/practice/..` → ライブラリ、`/guest/lessons` → `/guest/library`、大文字 UUID → ゲストのライブラリ | 契約ゲートが出る URL (require/screens.json の expired_lesson: `/<uuid>/lessons?gate=staccato&plan=1`) の pathname は `/<uuid>/lessons` なので一覧へ戻る。**コードと正規表現の実測で閉じる。実物の画面は未確認** |
| 裏取り 8 (CR-4-04) | StartClient.tsx 231 行の読解 + r5_C3 (Web・殻でない free): リンクは「ホームにもどる」(/) だけ → 押して `/` に着地。r5_C4 (Web 匿名): 「ゲストにもどる」→ /guest に着地。r5_C2 (殻 free) も `/` | Web でもログイン済みなら「ホームにもどる」になり、押せば着く。**閉じる**。ただし `url ?` の分岐が先なので App Store URL が設定されていると戻るリンクが無い (期待の後半が未対応) → CR-5-04 |
| 裏取り 9 (CR-4-06) | 02_cases.csv の判定分布を再集計: 合格 216・不合格 3・読解 450・人へ 194・未実施 16 (04 の数字と一致。ただし前回 99_report §2 の数字とも同一) / TC-0551・0553 の実測欄 / 99_report.md の §1・§4・§6b / 04 §2「本番ビルド (99_report に結果)」 | 集計は「数え直しただけ」で行は動いていない。TC-0551/0553 は「busy のまま (S4 候補・99 の未決)」の古い記述のまま。99_report は 09:38 のままで「コミットと push はまだ行っていない」「§4 直したもの (すべて未コミット)」「§6b に CR-4-01〜06 が残件」と、09:51 のコミット後の実態と食い違う。next build の結果も 99_report に無い → CR-5-06 |
| 退行 1 (GateSheet の他の呼び出し元) | r5_A_web_guest_song: Escape → 帯 → 帯で再表示 → veil クリックで閉じる → あとで。r5_A_web_guest_lesson: Escape で消える (hide)。ボタン構成は「iPhone アプリで登録 / ログイン / あとで」・「あとで」(BUTTON.later) の寄りは 0px | 退行なし |
| 退行 2 (/start の出口) | r5_C1: 殻 匿名 (guest ユーザー) → 「ゲストにもどる」(/guest) を押して /guest に着地。r5_C2: 殻 free → 「ホームにもどる」(/) を押して / に着地。「購入を復元」はアイドル時 disabled=false | 退行なし |
| 退行 3 (verify 500・従来の文言) | r5_J_click_verify_500 | 「確認できませんでした。購入を復元をお試しください」(2.6 秒)・busy 戻る。ラウンド 3 と同じ |
| 反例 1 (新規) | r5_K_toast_verify_abort: F と同じ手口で、トーストが出た瞬間 (+0.35 秒) に文字の箱を測る | 文字の箱 left 38 / right **499** px に対し viewport 402 px・トーストの箱 right 386 px。`white-space: nowrap; max-width: 92%; overflow: visible` (start.module.css 64 行) なので、33 文字の文言が箱からもはみ出し、画面の右端で切れる。同じ手口で 24 文字の「確認できませんでした。購入を復元をお試しください」は right 374 px で収まる (r5_K_toast_verify_500)。スクショ r5_K_toast_verify_abort.png では「…購入を復元を」まで見え、「お試しください」が画面外 → CR-5-01 |
| 反例 2 (新規) | r5_H_click_restore_500: 「購入を復元」→ 偽ブリッジ restore(ok・JWS 1 本) → `/api/apple/restore` を 500 (text/html) で返す。r5_I: 同 401 | どちらも「この Apple アカウントに契約はありません」と言われ、GuestEvent restore_none が記録される (doRestore 155-157 行: `res.json().catch(() => ({}))` → `d.result !== "ok"`)。サーバーの失敗が「契約が無い」に化ける → CR-5-05 |
| DB 読み | 走行前 (10:00・直前 20 分): gate_shown song 1・signin_ok 2・start_screen 4 (この時点で D/E は走行中なので一部は私の走行)。走行後の集計は本文の末尾 | ゲストの計測は生きている。契約ゲート由来の path=null の gate_* は増えていない |
| 空振り 1 | 続きの effect の `.catch` (206 行) に入る経路を探す: doPurchase / doRestore は fetch を try/catch し、purchase()/restorePurchases() は appleStore.ts 側で catch 済み。`.catch` に届くのは recordGuestEvent の同期例外か router.replace の例外くらい | 反例なし。保険としては妥当 |
| 空振り 2 | 購入成功後に「購入を復元」が押せる隙 (CR-4-05 の裏) | r5_E で着地まで restore=disabled。反例なし |
| 空振り 3 | `.later` の inline style が BUTTON「あとで」に副作用を出す | 130 行の style は Link だけ。「あとで」の offset 0 (r5_A)。反例なし |
| 空振り 4 | K の restore abort / restore conflict (r5_K_toast_restore_abort・r5_K_toast_restore_conflict) | どちらも waitForFunction が 8 秒でタイムアウトし幾何を測れなかった (D2 では restore abort の文言は出ている。K のハーネスで「購入を復元」の click が CTA の待ちと競合した疑い)。30 文字 × 14 px ≈ 420 px・39 文字 ≈ 546 px なので同じくはみ出す見込みだが **未確認** |
| K の残り | r5_K_toast_purchase_cancel: 「購入をやめました。いつでも再開できます」(19 文字) | textBox.right 334 px で収まる。はみ出すのはラウンド 4 で足した長い文言だけという裏づけ |

## 2. ラウンド 4 の指摘の閉じ判定

| ID | 04 の処理 | 私の確認 | 判定 |
|---|---|---|---|
| CR-4-01 (S3) | 直した (try/catch + 続きの catch) | 裏取り 1・2・3 (実測): busy が戻る・案内が出る・?step= が消える・復元が押せる | **閉じる**。派生: 案内の文言がはみ出す → CR-5-01 (S3) |
| CR-4-02 (S4) | 直した (出口を display block・text-align center) | 裏取り 6: 契約ゲートの出口は中央 (コード)。1 回ためしの「ログイン」は -152px のまま | **半分だけ**。残り → CR-5-02 |
| CR-4-03 (S4) | 直した (lessons 配下なら一覧へ) | 裏取り 7: 正規表現の実測 9 通り | 閉じる (実物の画面は未確認) |
| CR-4-04 (S4) | 直した (user なら ホームにもどる) | 裏取り 8: C3 (Web free) で「ホームにもどる」→ `/` に着地 (実測)。App Store URL 設定時の戻りリンクは無いまま | 指摘の本体は閉じる。期待の後半 → CR-5-04 |
| CR-4-05 (S4) | 直した (disabled={busy}) | 裏取り 5: disabled は付く。opacity は 1.0 のまま | **半分だけ**。残り → CR-5-03 |
| CR-4-06 (S4) | 台帳を再集計・next-env.d.ts を戻した | 裏取り 9: 行は動いていない。99_report が古い | 開いたまま → CR-5-06 |
| CR-2-04 (S3・/progress) | 未実施のまま | — | 開いたまま (合意済み)。判定には響かない |

## 3. 新規の指摘

### CR-5-01
- 重大度: S3
- 種別: 価値 (だまされた・壊れて見える) / 整合 (CR-4-01 の直しの残り)
- 対象: app/start/start.module.css 64 行 `.toast { … white-space: nowrap; … max-width: 92%; }` (overflow は visible)、app/start/StartClient.tsx 130 行の文言「通信できませんでした。電波のある場所で、購入を復元をお試しください」(33 文字) と 152 行「通信できませんでした。電波のある場所でもう一度お試しください」(30 文字)
- 何が起きるか: iPhone 幅 (402 px) で、購入は確定したのに通信が失敗したときの唯一の案内が、トーストの箱 (幅 370 px) を突き抜けて画面の右端で切れる。文字の箱は right 499 px (viewport 402 px)。見えるのは「通信できませんでした。電波のある場所で、購入を復元を」まで。丸い箱の外に文字が続いて途中で切れるので「壊れた」ように見え、払った直後の人に不安を足す。従来の 24 文字までの文言 (「確認できませんでした。購入を復元をお試しください」など) は収まる。ラウンド 4 で足した 2 文言だけが長すぎる (別アカウント conflict の 39 文字 (156 行) も同じ性質だが、これは既存)
- 再現手順: scripts/_tmp_critic_r5.mjs `CASES=K` (trial でログイン → /start へ push → hasApple 書き換え → CTA → 偽ブリッジ purchase(ok) → verify を abort → トースト表示の +0.35 秒で getBoundingClientRect を測る)
- 根拠: evidence/critic-r5/r5_K.json r5_K_toast_verify_abort (chars 33・textBox.right 499・box.right 386・viewportW 402・textOutsideViewport true)・r5_K_toast_verify_500 (chars 24・textBox.right 374・収まる)・r5_K_toast_verify_abort.png (右端で切れている)
- 期待: (a) `.toast` の nowrap をやめて折り返す (`white-space: normal; text-align: center; line-height: 1.5`) か、(b) 文言を 24 文字以内に縮める (例「通信できませんでした。購入を復元 をお試しください」)。あわせて表示時間 2.4 秒 (say の固定値) は 33 文字には短いので、warn のときは 4 秒程度にする。台帳 D 軸「verify / restore の通信失敗」の行に「文言が画面に収まる」を判定に含める。撮り直し 1 枚 (iPhone 幅)

### CR-5-02
- 重大度: S4
- 種別: 整合 (CR-4-02 の取り残し)
- 対象: app/components/guest/GateSheet.tsx 137 行 `<Link href={LOGIN+q} className={styles.later} … style={{ textDecoration: "none" }}>ログイン</Link>`、GateSheet.module.css 36-39 行 `.later` (text-align なし)
- 何が起きるか: 殻のゲストが曲を開いたときの「登録なしで 1 回ためす / はじめる / ログイン」で、「ログイン」だけが左端に寄る (offset -152 px)。CR-4-02 はこの行も名指ししていたが、直したのは 130 行 (契約ゲートの出口) のインラインだけ
- 根拠: evidence/critic-r5/r5_ABC.json r5_B_native_guest_try.loginLinkOffset (tag A・textAlign start・offset -152)、r5_B_native_guest_song_try.png
- 期待: `.later` に `text-align: center` を足す (button にも無害・130 行のインラインも不要になる)

### CR-5-03
- 重大度: S4
- 種別: 価値 (押せそうに見えるのに押せない) / 整合 (CR-4-05 の取り残し)
- 対象: app/start/StartClient.tsx 293 行 `disabled={busy}`、start.module.css 63 行 `.legal a, .legal button {…}` (`:disabled` の規則なし)
- 何が起きるか: busy 中の「購入を復元」は disabled になったが、色・下線・cursor が変わらない (opacity 1.0・色 rgb(94,112,153) はアイドル時と同じ)。CTA は disabled で 0.55 に薄くなるのに、復元だけ「押せる見た目で無反応」のまま
- 根拠: evidence/critic-r5/r5_DE.json r5_E の trace (1.1〜7.3 秒 restore=disabled(op=1))・r5_ABC.json r5_C1/C2 の restoreIdle (opacity 1・cursor pointer)
- 期待: `.legal button:disabled { opacity: 0.55; cursor: default; }`

### CR-5-04
- 重大度: S4
- 種別: 整合 (CR-4-04 の取り残し)
- 対象: app/start/StartClient.tsx 231 行 `{url ? <a href={url}>App Store を開く</a> : session === "user" ? <Link href="/">ホームにもどる</Link> : <Link href="/guest">ゲストにもどる</Link>}`
- 何が起きるか: NEXT_PUBLIC_APP_STORE_URL が設定された本番の Web で /start を開くと、「App Store を開く」だけで戻るリンクが無い (ログイン済み・匿名とも)。CR-4-04 の期待「App Store リンクがあるときも戻るリンクを残す」が入っていない。dev (.env / .env.local に未設定) では再現しないので、本番の env 次第。本番で設定されているかは **未確認**
- 根拠: 上記行の読解 (三項の順序)
- 期待: `url` の有無に関係なく戻るリンクを常に置く (App Store リンクの下に「ホームにもどる / ゲストにもどる」)

### CR-5-05
- 重大度: S4
- 種別: 価値 (だまされたと感じる) / 計測の汚れ。既存 (ラウンド 4 で入ったものではない)
- 対象: app/start/StartClient.tsx 155-157 行 `const d = await res.json().catch(() => ({})); … if (d?.result !== "ok") { recordGuestEvent("restore_none"); say("この Apple アカウントに契約はありません") }`
- 何が起きるか: `/api/apple/restore` が 500 (DB 障害・applyTransaction の例外・HTML 応答) や 401 (セッション切れ) を返しても、「この Apple アカウントに契約はありません」と断言され、GuestEvent に restore_none が記録される。契約している人が機種変更で復元を試み、たまたまサーバーが落ちていると「契約が無い」と言われる。restore_none の集計 (本当に契約が無い人) にサーバー障害が混ざる
- 再現手順: scripts/_tmp_critic_r5.mjs `CASES=H` (restore を 500 text/html で返す)・`CASES=I` (401)
- 根拠: evidence/critic-r5/r5_FHIJR.json r5_H_click_restore_500.restoreClickAfter.toast・r5_I_click_restore_401 (どちらも「この Apple アカウントに契約はありません」・restoreApiHits 1)
- 期待: `!res.ok` かつ 409 でないときは verify と同じ「確認できませんでした。時間をおいてもう一度お試しください」を出し、restore_none は記録しない。none は `res.ok && d.result === "none"` のときだけ

### CR-5-06
- 重大度: S4
- 種別: 証跡の不備 (台帳・報告)。CR-3-05 → CR-4-06 の引き継ぎ
- 対象: docs/verify/billing-iap/99_report.md (09:38)・02_cases.csv (09:38)・04_round-4-fix.md §2
- 内容:
  1. 99_report.md はコミット (09:51) より前のまま。冒頭「コミットと push はまだ行っていない」、§4「直したもの (すべて未コミット・作業ツリー)」、§3 のラウンド 4 が「判断待ち」、§6b に CR-4-01〜06 が「直していない残件」として並ぶ。本番配信済みの現状と食い違う
  2. 04 §2「本番ビルド: コミット前に `next build` を実行 (99_report に結果)」の結果は 99_report に無い (_tmp/build_r4.log にはある: Compiled successfully in 49s)
  3. 台帳は「再集計」で数字が前回と同一 (216/3/450/194/16)。TC-0551・0553 の実測欄「busy のまま (S4 候補・99 の未決)」は CR-4-01 の修正後も古いまま。ラウンド 3・4 の修正に対応する行 (契約ゲートの出口・/start の出口・trialing の文言・fixedPrimary の非記録・verify/restore の通信失敗) は無い (grep 0 件)。CR-3-05 の 1〜5 (TC-0082/0092 の証跡・TC-0039・TC-0102〜0152・実測欄の取り違え) も動いていない
  4. PlanCard.tsx 37 行の「1 日 8 本・10 分」は直書きのまま (CR-4-06 の 5・注記のみなので指摘ではなく記録)
  5. 作業ツリーに next-env.d.ts の差分 (dev が生成) が再び出ている。コミットには含まれていないので実害なし。コミット時に含めないよう `git add` を指名で

## 4. 判定

条件つき合格。

- S1・S2: なし
- ラウンド 4 の S3 (CR-4-01) は自分の手で実測して閉じた: verify / restore の通信失敗で busy が戻り、案内が出て、?step= が消え、「購入を復元」が再び押せる (r5_D・r5_D2・r5_F)。CR-3-03 の退行もなし (r5_E)
- 既存の動線の退行: Web ゲストの曲ゲート/レッスンゲート (Escape / 帯 / veil / あとで)・/start の出口 2 経路 (押して着地)・verify 500 の文言、いずれも退行なし
- S3: CR-5-01 (CR-4-01 で足した案内がトーストからはみ出して画面の右端で切れる)。対応するか Tetsuo へ差し戻して合意すること
- S4: CR-5-02 (1 回ためしの「ログイン」の左寄せ・CR-4-02 の取り残し)・CR-5-03 (busy 中の「購入を復元」の見た目・CR-4-05 の取り残し)・CR-5-04 (App Store URL 設定時の戻りリンク・CR-4-04 の取り残し)・CR-5-05 (restore の 500/401 が「契約はありません」に化ける・既存)・CR-5-06 (99_report と台帳がコミット後の実態を反映していない)
- 新規指摘はゼロではないので、「2 ラウンド連続で新規ゼロ」の数え直しはここから

未確認 (自分では出せなかったもの): 契約ゲートの実物 (REQUIRE_SUBSCRIPTION=false・CR-4-03 は正規表現の実測で代替)・restore abort / restore conflict のトーストの幾何 (K のハーネスがタイムアウト。文言は D2 で出ている)・本番の NEXT_PUBLIC_APP_STORE_URL の設定有無 (CR-5-04 の再現条件)。

GuestEvent の走行後の集計 (10:05・直前 30 分): gate_later lesson 1・song 3、gate_shown lesson 1・song 2 (path はすべて /guest…)、purchase_ok 1 (r5_E の verify 200 差し替えで画面側が記録したもの。DB の plan は verify を差し替えたので変わらない)、signin_ok 3、start_screen 26。総行数 263 → 293 (+30・すべて私の走行)。契約ゲート由来の path=null の gate_* は 0。

空振り: 続きの effect の `.catch` に届く経路 (無い・保険として妥当)・購入成功後に復元が押せる隙 (無い)・`.later` の inline style の副作用 (無い)。

GuestEvent: 私の走行で増えたのは start_screen・signin_ok・purchase_ok は無し (verify は全部差し替え)・restore_none (H/I/F/J の「購入を復元」)・gate_shown/gate_later (A/B)。契約ゲート由来の path=null の gate_* は増えていない。本番データへの直接の書き込みはしていない。

次のラウンドで見せてほしい証跡: (1) CR-5-01 を直したうえで、K の手口 (`CASES=K`) で textBox.right ≤ viewportW になった記録と iPhone 幅の 1 枚、(2) `.later` の text-align を CSS に移して B の offset が 0 になった記録、(3) busy 中の「購入を復元」の opacity が 0.55 になった記録 (E の trace)、(4) restore 500 で「確認できませんでした」系の文言になり restore_none が増えない記録 (H)、(5) 99_report をコミット後の実態に合わせ、台帳に TC-0551/0553 の更新とラウンド 3〜5 の行を足したもの。
