# 最終報告 (第 3 版): 登録と課金 (Apple アプリ内課金) の検証ループ

- 対象: コミット f12bdfb3 (main・本番配信済み) と、作業ツリーの未コミット修正 (ラウンド 1・2 の指摘と、承認された所見 2 件への対応)
- 日付: 2026-09-13
- 置き場: docs/verify/billing-iap/ (00 要件表・01 計画・02 台帳・03 批評 ×3・04 修正記録 ×2・evidence/)
- 経緯: 第 1 版 (批評 2 ラウンド・不合格) → Tetsuo の決定 (残る不具合の修正 OK・未決は第 1 案・所見 2 件を実装) → 第 2 版 (ラウンド 3・条件つき合格) → 「なおしておーけー」で S3 2 件と S4 2 件を修正 → ラウンド 4
- コミットと push はまだ行っていない (承認待ち)

## 1. 結論

批評ラウンド 4 は**条件つき合格** (S1・S2 なし、新規は S3 が 1 件、S4 が 5 件)。ラウンド 1〜3 の指摘は、S1 2 件・S2 10 件・S3 13 件を含めてすべて批評者が自分の手で確認して閉じた。購入成功後の遷移も、批評者が RSC の応答を書き換えて Apple 済みの状態を作り、購入 ok → ホーム、復元 ok → ホームまたは /onboarding、キャンセルと失敗 → /start に留まる、着地まで CTA が押せないこと、を実測した。

- 要件は作業ツリーでは満たされている。ただし**本番はまだコミット f12bdfb3 のまま**なので、Apple 通知と Cron の 401、無料期間中の設定の「未加入」、未加入者への App Store 案内は本番で続いている。作業ツリーの修正を配信するかは Tetsuo の判断
- 残る S3 は 1 件。Apple から戻った続きの購入証明の通信が失敗すると、CTA が回ったまま戻らない (catch が無い)。1 行の修正で、判断待ち (§6b)
- 収束条件 (2 ラウンド連続で新規指摘ゼロ) はまだ満たしていない。S3 1 件と小さな S4 4 件を直して 1 ラウンド回せば合格が見込める
- 確かめられていないものは変わらず、本物の Apple サインイン・StoreKit・署名つき通知・匿名サインインの本番設定 (§5)

## 2. 数字

| 項目 | 数 |
|---|---|
| 要件 (REQ) | 63 |
| 未決 (AMB) | 12 → すべて第 1 案で決定済み |
| 要件外の挙動 (EXTRA) | 17 (うち 4 は今回の承認による追加) |
| テストケース (台帳) | 879 |
| うち 実行して合格 | 216 |
| うち 実行して不合格 | 3 (ゲストホームの横スクロール・既存の透かし) |
| うち 読解で判定 | 450 (51%) |
| うち 人へ | 194 (22%) |
| うち 未実施 | 16 (カルテ 6 は /karte の 404 を撮っていたため無効・ログイン済みで /login 6・契約中の曲/録音画面 4) |
| 単体テスト | 643 件通過 (課金関連 7 ファイル 60 件を含む) |
| 批評ラウンド | 4 (上限 8)。各ラウンドの批評者は毎回新しく起動 |

## 3. ラウンドの経緯

| ラウンド | 対象 | 指摘 S1/S2/S3/S4 | 判定 | 何をしたか |
|---|---|---|---|---|
| 1 | 計画と台帳 + コミット f12bdfb3 | 2 / 7 / 9 / 4 = 22 | 不合格 | 19 件を修正、3 件を人へ。検証手段の穴 2 件を塞いだ |
| 2 | 修正後の作業ツリー | 0 / 3 / 4 / 5 = 12 (+ O-1 を S2 と認定) | 不合格 | 私の証跡の読み違い 1 件と、直しが生んだ不具合 1 件を含む。Tetsuo の承認後に S2 4 件・S3 3 件・S4 1 件を修正 |
| 3 | 修正後の作業ツリー | 0 / 0 / 2 / 3 = 5 | 条件つき合格 | ラウンド 2 の 9 件を批評者が自分の手で閉じた (購入成功後の遷移も実測)。Tetsuo の承認で S3 2 件と S4 2 件を修正 (04_round-3-fix.md) |
| 4 | 修正後の作業ツリー | 0 / 0 / 1 / 5 = 6 | 条件つき合格 | ラウンド 3 の 4 件を批評者が自分の手で閉じた (出口 4 経路・busy の実測・GuestEvent の前後比較)。新規は S3 1 件 (verify の通信失敗で busy が戻らない) と S4 5 件。判断待ち (03_round-4-critic.md) |

## 4. 直したもの (すべて未コミット・作業ツリー)

### ラウンド 1 (22 件中 19 件)

| 何が壊れていたか | どう直したか | 証跡 |
|---|---|---|
| Apple の通知と Cron が middleware で 401 (S1) | 2 経路を公開パスに | api_before_fix.json → api_round.json |
| 匿名ユーザーの無限リダイレクト (S1) | 匿名は /guest のまま | screens/anon_*.png |
| 契約切れの曲・教材・レッスンにゲートが無い (S2) | subscriptionGate + GuestGate を 4 画面に | require/*.png |
| stripe モードで未加入者が App Store 案内へ (S2) | 「準備中」を出す | screens/stripe_web_free_settings.png |
| 購入キャンセルの人がオンボへ (S2) | apple モードは契約ありのときだけ誘導 | screens/apple_free_home.png |
| 運営の楽譜取り込みが消える (S2) | library に planGrant | upload_tab.json |
| 古い通知で状態が巻き戻る (S2) | 本人の期末より古い取引は捨てる | apply_transaction.json |
| 検証手段 2 件 (匿名の代用・署名の先の経路) (S2) | is_anonymous を立てる・route 単体テスト | scripts/_tmp_verify_anon.ts・route.test.ts |
| S3 8 件・S4 3 件 | 未契約者の文言、イベント記録、queued の 15 分、Web の 1 回ためし、?step= の始末、linkIdentity、仮名、Cron の安全網、x-pathname、お得の計算、殻の文言、admin の列名 | 04_round-1-fix.md |

### ラウンド 3 (Tetsuo 承認後)

| 何が壊れていたか | どう直したか | 証跡 |
|---|---|---|
| 契約ゲートが下のタブまで覆い一覧に戻れない (S3) | 「ライブラリにもどる」の出口。/start はログイン済みなら「ホームにもどる」 | require/expired_gate_back.png・free_gate_back.png・r3fix/free_start_exit.png |
| 無料期間中のカードが「無制限」(S3) | 「無料期間中は 1 日 8 本・10 分まで採点できます」 | r3fix/trial_settings.png |
| 購入成功後に CTA が押せる状態に戻る (S4) | 移動したら busy を解かない | 読解 |
| ログイン済みの契約ゲートがゲスト統計に混ざる (S4) | fixedPrimary は記録しない | 読解 |

### ラウンド 2 (Tetsuo 承認後)

| 何が壊れていたか | どう直したか | 証跡 |
|---|---|---|
| 契約ゲートの主ボタンが「ログイン」になる (S2) | primaryHref 明示のゲートは主ボタンを固定、ログインの従ボタンを出さない | require/expired_song.png「… 再開する」・free_song.png「… はじめる」 |
| 続きの router.replace が購入成功の遷移を取り消す (S2) | 移動しなかったときだけ ?step= を消す | 読解 (人へ: OAuth 戻りの実測) |
| 1 回ためし中の人が /login に着けない (S2) | middleware の /login 分岐を匿名以外に | r2fix/anon_login_page.png・anon_then_login_as_free.png |
| 無料期間中の設定が「未加入」(S2・本番でも発生) | isPlus を plus か trial に。planGrant も渡す | r2fix/trial_settings.png「無料期間中」 |
| 契約なし・匿名の /onboarding 直接表示 (S3) | 匿名は /guest・契約なしはホームへ | r2fix/free_onboarding_direct.png・anon_onboarding_direct.png |
| Web+apple のライブラリに 1 回ためしの帯 (S3) | 殻だけ出す | r2fix/web_guest_library.png |
| getGuestTryState の queued (S3) | 15 分規則に揃えた | 読解 |
| noLater でも veil と Escape で閉じる (S3) | 無効に | 読解 |
| planView が先生接続を見ない (S4) | teacherSummary があれば帯なし | 読解 |
| 所見: 結果カードの先が支払いだと分からない | ボタン下に「はじめる手続き・最初の 2 週間は無料」 | r2fix/result_guest_note.png |
| 所見: CTA が「Apple ではじめる」で課金を誤解する | 導入オファー対象なら「2 週間無料ではじめる」 | r2fix/start_cta_intro.png・start_cta_nointro.png |

## 5. 人にしか確かめられない残件

memory (project_billing_verify_manual_pending) と第 1 版の §5 のとおり 9 件。今回の追加: 「/start?step=purchase から戻って購入が成功したらホーム (または /onboarding) に着くこと」を Sandbox の手順 2 に足す (CR-2-02 の直しは実測できていない)。

## 6. 未決と残件

### 6a. 決定済み (すべて第 1 案・04_round-2-fix.md §2)

Web の 1 回ためしは殻だけ／請求リトライ中は「契約切れ・再開する」／アプリ公開前の本番の未加入者は「準備中」／使用済み端末でためした曲は本人ページへ／契約切れのカルテは閲覧可／Apple 以外のアカウントは linkIdentity (Supabase の手動 identity 結合を有効化する・Tetsuo 側)／契約なし・匿名の /onboarding 直接は送り返す／仕様書の矛盾は決定表を正に (要件整理 v2.8 に更新済み)／先生の課金は別件

### 6b. 直していない残件 (既存または S4)

| ID | 重大度 | 何が起きるか | 誰の変更か |
|---|---|---|---|
| O-4 | S3 既存 | ライブラリの曲タブで hydration 失敗 (StaggerRail の data-rv)、設定の h1 の rv-on 不一致。出現演出のエンジンの残り | 既存 |
| O-5 | S3 既存 | ゲストホームが横スクロール (見本カードの透かし 474px) | 既存 |
| O-6 | 未確認 | 匿名で「登録なしで 1 回ためす」を押して 4 秒で移らなかった (dev の初回コンパイルが第一候補) | 人へ |
| O-8 | S4 既存 | ゲストの曲ページで /api/plan/usage が 401 を console に出す | 既存 |
| O-9 | S4 | /api/apple/* に回数上限が無い | 私 |
| O-10 | S4 | fetch と nativePromise に timeout が無い | 私 |
| CR-2-04 | S3 | 台帳のカルテ行が /karte の 404 を撮っていた。/progress で撮り直していない (AMB-006 は未検証) | 私 (検証) |
| CR-2-08 | S4 | stale 判定が billingProvider を見ない (Stripe の期末が未来の開発用アカウントだけ) | 私 |
| CR-4-01 | S3 | /start?step=purchase の続きで /api/apple/verify の通信が失敗すると busy が戻らず、CTA が回ったまま・購入を復元も無反応・案内なし (run.then に catch が無い) | 私 (CR-2-02 の直し) |
| CR-4-02 | S4 | 契約ゲートの「ライブラリにもどる」が左寄せ (.later に text-align が無い) | 私 |
| CR-4-03 | S4 | レッスンのゲートの出口がレッスン一覧でなくライブラリ | 私 |
| CR-4-04 | S4 | Web の /start はログイン済みでも「ゲストにもどる」 | 私 |
| CR-4-05 | S4 | busy 中の「購入を復元」が disabled でない | 私 |
| CR-4-06 | S4 | 台帳と報告がラウンド 3 の修正を反映しきれていない箇所 (csv の更新順・next-env.d.ts の差分) | 私 (記録) |
| CR-3-05 | S4 | 台帳の記録の不備 (TC-0082 の証跡が stripe モード・TC-0039 が人へのまま・/login の未実施・実測欄の取り違え 4 行・/progress の撮り直し未) | 私 (記録) |

### 6c. 本番へ出す判断

- 作業ツリーの修正をコミットして配信するか。配信しない限り、本番の Apple 通知と Cron は 401、無料期間中の 1 人の設定は「未加入」、未加入者は App Store 案内のまま
- 無関係の差分 (music-analyzer/tests/audit/offline_analyzer.py・scripts/reanalyze_bulk.ts・scripts/upload_position_shift.ts・.claude/) はコミットから除外する

## 7. 良さについての所見

画面つきのページ: https://claude.ai/code/artifact/085adcbd-fc93-40f3-bf66-cd048ded4692 。承認された 2 件は実装済み。残りは、子ども向けの言い回し (要件の不備)、請求リトライ中の見せ方 (決定 2a のまま・Sandbox で挙動を見てから再検討)。

## 8. やらなかったこと

- dom テスト基盤 (@testing-library/react) の導入
- Apple の公式ライブラリへの置き換え、leaf 証明書の OID 照合
- /api/apple/* の回数上限、fetch の timeout
- 本物の Apple 署名・StoreKit・OAuth を使う検査 (§5 へ)
- J 軸 199 行の自動化 (tsc・vitest・stripe モードの撮影で回帰の当たりだけ)
- /progress の撮り直し (CR-2-04)
