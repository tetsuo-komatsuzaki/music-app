# 批評 ラウンド 4: 登録と課金 (Apple アプリ内課金)

- 対象: 作業ツリーの未コミット差分 (27 ファイル・+231/-84。`git diff --stat` 2026-09-13 09:2x)。HEAD は 2863dc07。未追跡の新規テスト 6 ファイルは `git status` の `??` にある (appleServer.test / isNativeApp.test / planGrant.test / notifications route.test / verify route.test / gateText.test)
- 読んだもの: 03_round-3-critic.md・04_round-3-fix.md・evidence/r3fix (screens.json・trial_settings.png・free_start_exit.png)・evidence/require (screens.json 全文・expired_song.png・expired_lesson.png)・scripts/_tmp_verify_require.mjs と _tmp_verify_r3check.mjs (証跡の撮り方)・99_report.md §4/§6/§8・02_cases.csv の該当行。ラウンド 3 で触った 3 ファイルの現物全文と `git diff` (GateSheet.tsx / StartClient.tsx / PlanCard.tsx)、その周辺 (GuestGate.tsx・GateSheet.module.css・gateText.ts・scores/[scoreId]/page.tsx 340-383・practice/[category]/[itemId]/page.tsx 280-310・lessons/page.tsx 全文・lessons/[lessonId]/page.tsx 1-80・LibraryClient.tsx 60-110・GuestHome.tsx 20-45・start/page.tsx・app/page.tsx・appleStore.ts・billingMode.ts・returnTo.ts・plan.ts・planConstants.ts・useIsNativeApp.ts・onboarding/page.tsx・recordGuestEvent.ts・api/apple/verify/route.ts・[userId]/layout.tsx の diff・home.tsx の diff)
- 自分の手で実行したもの (すべて読み取り。app/ は書き換えていない。plan.ts の REQUIRE_SUBSCRIPTION は私は書き換えられないので false のまま。DB への直接の書き込みなし。ただし画面を歩いた分だけアプリ自身が GuestEvent を 22 行足している: 207 → 229 行。内訳は §1 DB 読み):
  - `npx tsc --noEmit` → exit 0
  - `npx vitest run` 課金関連 7 ファイル → 7 files / 60 tests passed (790ms)
  - scripts/_tmp_critic_r4_events.ts (GuestEvent を kind × place × path で集計。playwright の前後で 2 回)
  - scripts/_tmp_critic_r4.mjs (playwright・3101 apple モード): A ゲストのゲート 4 箇所の退行・B `.later` を Link に当てたときの文字の寄り・C /start の出口・D/E/F /start の続きと verify の失敗 (RSC 応答の `"hasApple":false` を true に書き換える手口はラウンド 3 の _tmp_critic_r3_rsc.mjs を流用。ログイン直後の遅延ナビゲーションが混ざるので、2 回目からはログイン後にホームで 3 秒落ち着かせてから push した)。出力 evidence/critic-r4/r4.json (1 回目)・r4_DEF.json (2 回目)・r4_*.png
  - scripts/_tmp_critic_r4c.mjs (playwright): /start の出口リンクを実際に押して着地を見る 4 経路 + ライブラリのアップロードのゲート。出力 evidence/critic-r4/r4c.json・r4c_*.png
- 判定は末尾

## 0. 先に結論

条件つき合格。S1・S2 は無い。ラウンド 3 の S3 2 件と S4 2 件 (CR-3-01〜04) は自分の手で確かめて閉じた。新規は S3 が 1 件 (verify / restore の通信が失敗すると /start が busy のまま戻らない) と S4 が 5 件。

## 1. 試したことの一覧 (空振りを含む)

| # | 試したこと | 結果 |
|---|---|---|
| 裏取り 1 (CR-3-01 出口) | evidence/require/expired_song.png・expired_lesson.png を目視 + require/screens.json の `expired_gate_back_link` (href=/6bba…/library・found) と `expired_gate_back` (着地がライブラリ)・free 側も同じ。撮影スクリプト _tmp_verify_require.mjs 45 行で「ライブラリにもどる」を実際に押して waitForURL(/library/) していることを確認 | 出口は存在し、押すとライブラリに着く。GateSheet.tsx 68-69 行 (uidInPath → backHref)・129 行。閉じる。ただし文字が左に寄っている → CR-4-02、レッスンからの出口先が一覧ではない → CR-4-03 |
| 裏取り 2 (CR-3-01 /start の出口) | r3fix/free_start_exit.png を目視 + 自分で 4 経路を押した (r4c.json): 匿名 (殻) 「ゲストにもどる」→ /guest に着地 / free (殻) 「ホームにもどる」→ /d89a…(本人ホーム) / expired (殻) → /6bba… / free (Web・殻でない) は「ゲストにもどる」→ /guest → layout が本人ホームへ | 殻ではログイン済みに「ホームにもどる」が出て、押せば本人ホームに着く。閉じる。Web の分岐は直っていない → CR-4-04 |
| 裏取り 3 (CR-3-02) | r3fix/trial_settings.png を目視 + r3fix/screens.json の本文「無料期間中は 1 日 8 本・10 分まで採点できます。無料期間は 2026年9月25日 までです。」。plan.ts の TRIAL_DAILY_GRADINGS=8・TRIAL_DAILY_SECONDS=600 と一致。require/trial_song の「今日の採点 0/8回 ・ あと 10 分」とも一致 | 閉じる。数値は文言に直書き (定数から出していない) → CR-4-06 の注記 |
| 裏取り 4 (CR-3-03) | r4_DEF.json の r4_E_resume_verify_slow_ok: verify を 5 秒遅らせると 2〜6 秒は CTA が disabled+busy、7 秒で `/`、8 秒で本人ホーム。着地まで CTA は押せない | 閉じる (実測) |
| 裏取り 5 (CR-3-04) | GateSheet.tsx 87 行・99 行の読解 + DB 読み: 私の走行で gate_shown は song 2・lesson 1・generic 1 (すべて path=/guest…) だけ増え、契約ゲートは今回開いていないので path=null の gate_shown は 0 | 閉じる (契約ゲートは REQUIRE=true が要るので実測は撮り直しの screens.json に頼る。read 側で gate_shown の generic/null が増えないことは前後比較で確認) |
| 裏取り 6 (04 §2 の検査) | tsc / vitest を自分で再実行。plan.ts の REQUIRE が false のままであること (`git diff app/_libs/plan.ts` に定数の差分なし) | 記録どおり |
| 退行 1 (GateSheet の他の呼び出し元) | Web ゲストの曲ゲート (GuestGate・bar): Escape → 帯「登録かログインで続ける」→ 帯で再表示 → veil クリックで閉じる → あとで で閉じる (r4.json r4_A1)。ライブラリのアップロード (hide): マイ楽譜タブの箱を押す → シート「楽譜を取り込むには、登録が必要です」→ あとで で消える (r4c_A2)。レッスン (hide・returnTo): Escape で消える (r4_A3)。ゲストホーム generic (hide): veil クリックで消える (r4_A4) | 4 箇所とも退行なし。ボタン構成は Web+apple の「iPhone アプリで登録 / ログイン / あとで」 |
| 退行 2 (1 回ためしの分岐) | 殻 (偽ブリッジ) のゲスト曲ゲート: 「登録なしで 1 回ためす / はじめる / ログイン」(r4_B) | 退行なし。ただし「ログイン」が左寄せ → CR-4-02 の同根 |
| 退行 3 (busy の解除漏れ) | onStart: ensureSession 失敗・linkApple・purchase cancel/pending/error・verify 非 2xx → すべて finally で busy=false (読解)。r4_F で verify がネットワーク失敗のとき CTA は enabled に戻る (実測) | CTA 経路は戻る。戻らないのは続きの effect → CR-4-01 |
| 実測 1 (反例) | r4_D_resume_verify_abort (2 回): /start?step=purchase で purchase(ok) → verify を abort → 14 秒以上 CTA が disabled+busy のまま・URL に ?step= が残る・トーストは「反映しています…」だけで消える・「購入を復元」を押しても何も起きない (busy ガード)・pageerror `TypeError: Failed to fetch` | CR-4-01 |
| 実測 2 | r4_F_click_verify_abort: CTA を押す経路で verify が失敗 → busy は戻るがトーストが出ない (「反映しています…」が消えて終わり) | CR-4-01 (b) |
| DB 読み | 走行前 20 分: start_screen 1。走行後 20 分: gate_later 5 (generic/lesson/song・path は /guest…)・gate_shown 4 (同)・purchase_ok 1・signin_ok 2・start_screen 10・visit 1 | ゲストの計測は生きている。契約ゲート由来の path=null の gate_* は 0 |
| 台帳の抜け探し 1 | CR-3-05 で挙げた行 (TC-0004/0039/0048/0082/0092/0102/0112/0470/0474) | 02_cases.csv の mtime 08:30 は 04_round-3-fix.md (09:09) より前で、どの行も動いていない。99_report.md (08:59) の §4 にラウンド 3 の修正が無い → CR-4-06 |
| 台帳の抜け探し 2 | 「契約ゲートからライブラリにもどる」「/start のログイン済みの出口」「trialing の文言」の行 | 台帳に無い (grep 0 件)。証跡は evidence/require・r3fix にあるが台帳から辿れない → CR-4-06 |
| 台帳の抜け探し 3 | 「/start の続きで verify が通信失敗」の行 | D 軸に無い (verify 500 の行はある)。→ CR-4-01 の期待に台帳追加を含める |
| コード読み 1 (反例作り) | StartClient.tsx 189 行 `void run.then((navigated) => …)` に catch が無い。doPurchase の `fetch("/api/apple/verify")`・doRestore の `fetch("/api/apple/restore")` は通信失敗で throw する (purchase()/restorePurchases() は appleStore.ts で catch 済み)。onStart/onRestore は finally で busy を戻すがトーストは無い | 実測 1・2 で裏づけ → CR-4-01 |
| コード読み 2 | GateSheet.module.css `.later` に text-align が無い。button は UA 既定で中央、`<a>` (display:block) は start | 実測 B: A.later は textAlign=start・文字の中心が箱の中心から -152px。BUTTON.later は 0 → CR-4-02 |
| コード読み 3 | GateSheet.tsx 68 行 uidInPath は `/[0-9a-f-]{36}` 前提。lessons/page.tsx 78 行のゲートも同じ backHref (ライブラリ) | レッスン一覧の上に出たゲートの出口がライブラリ → CR-4-03 |
| コード読み 4 | StartClient.tsx 214 行 (Web の分岐): `url ? App Store を開く : ゲストにもどる`。session を見ていない | 実測 C3 → CR-4-04 |
| コード読み 5 | StartClient.tsx 279 行「購入を復元」は busy で disabled にしていない (onRestore が busy で return するだけ) | 実測 D: busy 中に押しても無反応。CR-4-01 の見え方を悪くしている。CR-4-05 |
| コード読み 6 | GateSheet の Escape リスナーの deps が [open] だけで noLater を捕捉 | noLater は呼び出し元で定数なので問題なし。指摘にしない |
| コード読み 7 | remember() が fixedPrimary でも returnTo cookie を置く。/start 成功後は `/` へ行くので cookie は使われず 1 日残る。次に /login を通る時に resolveLoginDestination が拾う | ログイン済みの人が cookie を拾う経路は middleware が /login を弾くので実害は見つからず。指摘にしない |
| 空振り 1 | 契約ゲート (REQUIRE_SUBSCRIPTION=true) を自分の環境で出す | 定数を私は書き換えられない。撮り直しの screens.json + 撮影スクリプトの読解 + 同じ class の別分岐 (B) の実測で代替 |
| 空振り 2 | 1 回目の D/E/F でログイン直後に URL がホームに戻る (ラウンド 3 の空振り 3 と同じ現象) | ハーネスの都合 (ログイン画面の router.push が遅れて効く) と判断し、ホームで 3 秒落ち着かせてから push する形に変えたら消えた。アプリの不具合ではない |
| 空振り 3 | onStart で purchase 成功 → verify 成功のときに busy が戻って CTA が押せる (CR-3-03 の退行) | E で着地まで disabled。反例なし |
| 空振り 4 | 出口リンクが何かに覆われて押せない | r4c: 4 経路とも elementFromPoint がリンク自身・押せば着地。1 回目 (r4.json C1/C2) の「/start のまま」はハーネスの待ち方の問題 |

## 2. ラウンド 3 の指摘の閉じ判定

| ID | 04 の処理 | 私の確認 | 判定 |
|---|---|---|---|
| CR-3-01 (S3) | 直した (ライブラリにもどる・ホームにもどる) | 裏取り 1・2 | 閉じる。派生 CR-4-02 (左寄せ)・CR-4-03 (レッスンの出口先)・CR-4-04 (Web の分岐) はいずれも S4 |
| CR-3-02 (S3) | 直した (文言) | 裏取り 3 | 閉じる |
| CR-3-03 (S4) | 直した (navigated で busy 維持) | 裏取り 4 (実測) + 退行 3 | 閉じる。反面、失敗時の解除漏れが残る → CR-4-01 |
| CR-3-04 (S4) | 直した (fixedPrimary で記録しない) | 裏取り 5 | 閉じる |
| CR-3-05 (S4) | 記録のみ | 台帳の抜け探し 1・2 | 開いたまま (台帳は動いていない・99_report にラウンド 3 が無い) → CR-4-06 に引き継ぐ |
| CR-2-04 (S3・/progress) | 未実施のまま | — | 開いたまま (実装者側・合意済み)。判定には響かない |

## 3. 新規の指摘

### CR-4-01
- 重大度: S3
- 種別: 価値 (待たされる・怖い) / 整合 (CR-3-03 の直しの残り)
- 対象: app/start/StartClient.tsx 189 行 `void run.then((navigated) => { if (!navigated) { router.replace("/start"); setBusy(false) } })` (catch なし)、132 行 `fetch("/api/apple/verify")`・141 行 `fetch("/api/apple/restore")`、153-165 行 onStart / 167-179 行 onRestore (finally はあるがトーストなし)
- 何が起きるか:
  - (a) Apple のサインインから戻った直後の続き (?step=purchase / restore) で、購入シートは確定したのに /api/apple/verify (または restore) への通信が失敗 (圏外・タイムアウト・fetch の例外) すると、`run` が reject して `.then` が走らず、busy が true のまま戻らない。CTA は回転したまま、URL に ?step= が残り、「購入を復元」も busy ガードで無反応、トーストは「反映しています…」が 2.4 秒で消えて何も残らない。殻にはリロードが無いので、アプリを終了するしかない。お金は Apple 側で決まっている (通知経路で後から反映される見込み) が、その場では「払ったのに固まった」に見える
  - (b) CTA を押す経路 (onStart) で同じ失敗が起きると busy は戻るが、エラーの案内が出ない (unhandled rejection)
- 再現手順: scripts/_tmp_critic_r4.mjs `CASES=D` (trial でログイン → ホームで 3 秒 → router.push("/start?step=purchase&plan=year") → RSC の hasApple を true に書き換え → 偽ブリッジ purchase(ok) → `/api/apple/verify` を route.abort("failed")) → 14 秒後も cta=disabled+busy・URL /start?step=purchase&plan=year・「購入を復元」クリック後も calls に restore が増えない。`CASES=F` で (b)
- 根拠: evidence/critic-r4/r4_DEF.json (r4_D_resume_verify_abort の trace 2〜14s・restoreClickAfter・errs「pageerror: TypeError: Failed to fetch」)、r4_D_resume_verify_abort.png (CTA が回転のみ・トーストなし)、r4_F_click_verify_abort (toast は「反映しています…」だけ)。同じ手口で verify 200 (r4_E) は 7 秒で `/` に着くので、書き換えと偽ブリッジは効いている
- 期待: doPurchase / doRestore の fetch を try/catch で包み、失敗時は「通信できませんでした。電波のある場所で 購入を復元 をお試しください」のような warn トーストを出して false を返す (これで続きの effect も onStart も同じ道を通る)。加えて続きの effect の `.then` に `.catch` を付け、例外でも `router.replace("/start"); setBusy(false)` を通す。台帳 D 軸に「verify / restore の通信失敗 → busy が戻り、案内が出る」の行を足す

### CR-4-02
- 重大度: S4
- 種別: 価値 (見た目・気づきにくい) / 整合
- 対象: app/components/guest/GateSheet.module.css 36-39 行 `.later` (text-align なし)、GateSheet.tsx 129 行 `<Link className={styles.later}>ライブラリにもどる</Link>`・136 行 `<Link className={styles.later}>ログイン</Link>`
- 何が起きるか: `.later` は button 用に書かれていて text-align が無い。button は UA 既定で中央だが、`<a>` を display:block にすると文字が左端 (padding 8px) に寄る。CR-3-01 で足した「ライブラリにもどる」と、1 回ためしの「ログイン」がシートの左端に小さく置かれ、中央の「再開する」と揃わない。出口として足したものが目に入りにくい
- 再現手順: 殻 (偽ブリッジ) のゲストで /guest/scores/cmq2… → シートの「ログイン」の文字の箱と要素の箱の中心差を測る
- 根拠: evidence/critic-r4/r4.json r4_B_native_guest_try.laterLinkOffset (tag A・textAlign start・offset -152px。同じ class の BUTTON「あとで」は offset 0)、evidence/require/expired_song.png・expired_lesson.png (「ライブラリにもどる」が左寄せ)、r4_native_guest_song_try.png
- 期待: `.later` に `text-align: center` を足す (button にも無害)。撮り直しで中央になったことを 1 枚

### CR-4-03
- 重大度: S4
- 種別: 価値 (迷う)
- 対象: app/[userId]/lessons/page.tsx 78 行 (subGate の GateSheet)、GateSheet.tsx 68-69 行 (backHref は常に /<uid>/library)
- 何が起きるか: レッスンの行を押す → lessons/[lessonId] が `/lessons?gate=…&plan=1` へ戻す → 一覧の上に契約ゲート。ここで「ライブラリにもどる」を押すと、いま見ていたレッスン一覧ではなくライブラリに飛ぶ。一覧に戻るには ライブラリ → 基礎練タブ → 学びのレッスン の 2〜3 手。CR-3-01 の「一覧に戻れる」の一覧は、この画面ではレッスン一覧
- 再現手順: REQUIRE_SUBSCRIPTION=true で expired → /<uid>/lessons/staccato → シート → 「ライブラリにもどる」
- 根拠: evidence/require/expired_lesson.png・screens.json expired_lesson の本文 (下に一覧が透けている)、lessons/page.tsx 78 行に backHref の指定が無い
- 期待: GateSheet に `backHref` (と文言) の prop を足し、lessons/page.tsx から `/${userId}/lessons`「レッスンにもどる」を渡す。曲・教材はいまのままでよい

### CR-4-04
- 重大度: S4
- 種別: 整合 (CR-3-01 の Web 側)
- 対象: app/start/StartClient.tsx 214 行 `{url ? <a href={url}>App Store を開く</a> : <Link href={`/${GUEST_ID}`}>ゲストにもどる</Link>}`
- 何が起きるか: Web (殻でない) でログイン済みの人が /start を開くと (設定の「アルコプラスは iPhone アプリではじめられます」からは飛べないが、ホームの帯や URL 直打ちで来る)、NEXT_PUBLIC_APP_STORE_URL 未設定なら「ゲストにもどる」(ログイン済みなのに)、設定済みなら戻るリンクが 1 つも無い。機能上は /guest → layout が本人ホームへ送るので閉じ込めはない
- 再現手順: free で Web の /start (evidence/critic-r4/r4c.json r4c_user_web_guest_exit: リンクは「ゲストにもどる」/guest、押すと本人ホームに着く)
- 根拠: 上記行は session を見ていない。殻側 (280 行) だけ直した
- 期待: Web の分岐も `session === "user"` なら「ホームにもどる」(/) にし、App Store リンクがあるときも戻るリンクを残す

### CR-4-05
- 重大度: S4
- 種別: 価値 (押したのに何も起きない)
- 対象: app/start/StartClient.tsx 279 行 `<button type="button" onClick={() => void onRestore()}>購入を復元</button>` (disabled なし)、167 行 onRestore の `if (!appleHere || busy) return`
- 何が起きるか: busy 中 (購入シートの最中・verify 待ち・CR-4-01 の固まった状態) に「購入を復元」は押せる見た目のまま無反応。CTA は disabled で見た目も変わるのに、復元だけ変わらない
- 根拠: evidence/critic-r4/r4_DEF.json r4_D の restoreClickAfter (calls に restore が増えない)、r4.json r4_C2_start_exit_user.restoreDisabledIdle=false
- 期待: busy のとき `disabled` と opacity を付ける (CTA と同じ扱い)

### CR-4-06
- 重大度: S4
- 種別: 証跡の不備 (台帳・報告・作業ツリー)。CR-3-05 の引き継ぎ
- 対象: docs/verify/billing-iap/02_cases.csv (mtime 08:30)・99_report.md (08:59)・git の状態
- 内容:
  1. 台帳は 04_round-3-fix.md (09:09) より前のまま。CR-3-05 の 1〜5 (TC-0082/0092 の証跡・TC-0039・TC-0102〜0152・実測欄の取り違え 4 行) はどれも動いていない
  2. ラウンド 3 で直した 4 件に対応する台帳の行が無い (「契約ゲートからライブラリにもどる」「/start のログイン済みの出口」「trialing の文言」「fixedPrimary は gate_* を記録しない」)。証跡は evidence/require・r3fix にあるが、台帳から辿れない
  3. 99_report.md §4 はラウンド 1・2 だけで、ラウンド 3 の修正 (CR-3-01〜04) が入っていない。§6 の残件表には CR-3-01〜05 が「残件」として載ったままで、直した後の状態と食い違う
  4. next-env.d.ts の差分 (`.next/dev/types/routes.d.ts`・dev の生成物) がまだ作業ツリーにある。未追跡のテスト 6 ファイルはファイル名を指名して add すること
  5. PlanCard.tsx 37 行の「1 日 8 本・10 分」は文言に直書き。plan.ts の TRIAL_DAILY_GRADINGS / TRIAL_DAILY_SECONDS は prisma を import するので client から取れないが、planConstants.ts に移せば定数から出せる。上限を変えたときに設定カードだけ古くなる (gateText.ts の「月 1,280 円」も同じ性質・既知)

## 4. 判定

条件つき合格。

- S1・S2: なし
- ラウンド 3 の S3 2 件・S4 2 件 (CR-3-01〜04) はすべて自分の手で確かめて閉じた。出口 4 経路は実際に押して着地を見た (匿名 → /guest、ログイン済み → 本人ホーム)。CR-3-03 は verify を 5 秒遅らせて着地まで CTA が押せないことを実測した
- 既存の動線の退行: GateSheet の他の呼び出し元 4 箇所 (曲ゲート bar・アップロード hide・レッスン hide・ゲストホーム generic) と 1 回ためしの分岐は、Escape / veil / あとで / ボタン構成とも退行なし。ゲストの計測 (gate_shown / gate_later) も生きている
- S3: CR-4-01 (verify / restore の通信失敗で /start の続きが busy のまま戻らない・CTA 経路でも案内が出ない)。対応するか Tetsuo へ差し戻して合意すること
- S4: CR-4-02 (出口リンクの左寄せ)・CR-4-03 (レッスンの出口先)・CR-4-04 (Web の /start の出口)・CR-4-05 (busy 中の「購入を復元」)・CR-4-06 (台帳・報告・作業ツリーの記録)。加えて CR-2-04 (/progress) が実装者側で未実施のまま

未確認 (自分では出せなかったもの): 契約ゲート (REQUIRE_SUBSCRIPTION=true) の実物。定数を私は書き換えられないので、撮り直しの screens.json (撮影スクリプトが実際にリンクを押している) と、同じ class の別分岐の実測で代替した。

空振り: 出口リンクが覆われて押せない (押せた)・購入成功後の busy 解除の退行 (なし)・ログイン直後にホームへ戻る現象 (ハーネスの都合)・returnTo cookie の残留 (実害なし)・Escape リスナーの noLater 捕捉 (問題なし)。

次のラウンドで見せてほしい証跡: (1) CR-4-01 を直したうえで、verify を abort した続きが「案内 + busy 解除 + ?step= 消去」になる記録 (scripts/_tmp_critic_r4.mjs `CASES=DF` をそのまま使える)、(2) `.later` を中央にした契約ゲートの 1 枚、(3) 台帳へのラウンド 3・4 の行の追加と 99_report §4 のラウンド 3 の追記、(4) コミットに含めるファイルの一覧 (テスト 6 ファイルを含む・next-env.d.ts を含まない)。
