# 登録と課金 (Apple アプリ内課金) 要件表

- 検証対象: 登録と課金 (コミット f12bdfb3・2026-09-13)
- 要件の出所: 要件整理 v2.7 確定版 (https://claude.ai/code/artifact/29e9e8af-3d88-494a-9cf1-5c1e0ad20e23)、流れ図 16 画面 第12版 (https://claude.ai/code/artifact/20111c89-6d31-492c-9db4-b2bc68ac8d07)、プラン画面モック v3 (https://claude.ai/code/artifact/23bd6964-2281-42e6-860d-f0e5cea7c50a)、変更の全容 (https://claude.ai/code/artifact/aaaa2758-e31e-47f4-a9e6-25282883c8b6)、コミット f12bdfb3 のメッセージと差分、会話 2026-09-12 の Tetsuo 決定
- 出所の食い違い: 流れ図の手順 16「録音は無制限」と全容 C-19「今日の採点 3/8回 ・ あと 6 分」が矛盾する → AMB-003 として立てた
- 範囲外だがローンチを阻むもの (CR-1-19c): /start が /terms と /privacy にリンクするが、そこに Apple 課金・自動更新・解約の条項が無い (project_legal_docs_pending)。審査 3.1.2 は自動更新の条件と規約リンクを求める

## 段0 前提の抜き取り検査 (2026-09-13・scripts/_tmp_verify_premise.ts)

| 見たもの | 実測 | 要件の前提との関係 |
|---|---|---|
| User 総数 | 38 | 既存アカウントは開発用だけ (§8-5) と整合 |
| plan × planStatus | free/null 25・plus/trialing 1・plus/active 2・plus/past_due 1・null/canceled 1・null/null 8 | §10-11 の「active 2・trialing 1・past_due 1・canceled 1」と一致。本物の Stripe 契約か未確認のまま (人へ) |
| role | admin 2・teacher 2・student 34・guest 0 | guest はまだ 0 (未点灯) |
| admin 2 件の planGrant | 両方 null | §9「planGrant=internal を付けてから REQUIRE_SUBSCRIPTION」の順序が守られている (まだどちらも未実施) |
| 新列の使用 | billingProvider / planGrant / guestDeviceKey / appleOriginalTransactionId すべて 0 件 | 移行は適用済み・データはまだ入っていない |
| AppleNotification | 0 件 | 通知 URL 未登録と整合 |
| Performance | 646 件 | ゲストの 1 回ためしが積むのはここ |

前提の崩れ: なし。

## 要件表

列: REQ-ID / 要件の文言そのまま / 出所 / 受入条件 / 観測のしかた / 自動で確かめられるか / 関係する画面とファイル

### A. 思想と言い回し

| REQ | 文言 | 出所 | 受入条件 | 観測 | 自動 | 関係 |
|---|---|---|---|---|---|---|
| REQ-001 | 無料プランは無い。登録とはアルコプラスを始めること。最初の 2 週間だけ 0 円 | v2.7 §0 | 「無料で登録」「無料プラン」「はじめは無料」の文言がアプリの画面文言に 0 件。許されるのは「最初の 2 週間は無料、その後 月 1,280 円」型の条件つき一文だけ | grep で画面文言を全走査 | 自動 (grep) | app/ 全体 |
| REQ-002 | Web への誘導 (外部誘導エンタイトルメント) は使わない | v2.7 §0 やらないこと | iOS の殻の中で、Web の購入ページやブラウザで買う旨の文言・リンクが出ない | grep + 殻モードの描画 | 自動 | GateSheet, PlanCard, LibraryClient, signUp |
| REQ-003 | Stripe は売らない。コードとテストは残し、導線だけ止める | v2.7 §0 | NEXT_PUBLIC_BILLING_MODE=apple のとき Stripe checkout への遷移が 0 経路。未設定 (stripe) のときは従来どおり | 経路 grep + 描画 | 自動 | canShowBillingEntryPoint, onboardingClient, PlanCard, LibraryClient |
| REQ-004 | iOS ではメール登録と Google を出さない。Web のログインには Apple と Google を残す | v2.7 §0 | 殻+apple: /login に Apple のみ、/signUp はフォームを出さず /start へ。Web+apple: /login に Apple と Google、/signUp は App Store 案内 | playwright 描画 | 自動 | login/page.tsx, signUp/page.tsx |
| REQ-005 | 画面の文言に括弧を使わない。区切りは中黒 | 規約 (verify-loop 第0条 8) | 今回追加した文言に ( ) （ ） が 0 件 | grep | 自動 | 差分の全 tsx |

### B. 状態機械と、できること

| REQ | 文言 | 出所 | 受入条件 | 観測 | 自動 | 関係 |
|---|---|---|---|---|---|---|
| REQ-010 | ゲスト (アカウント無し) は閲覧だけ。録音して採点は 1 回。基礎練の採点は不可 | v2.7 §2 表 | role=guest の getGradingQuota が limit 1・practiceAllowed false・needsSubscription false。2 回目は allowed false | vitest (plan.ts の純関数は prisma 依存 → 読解 + 実 DB 検証ユーザー) | 半自動 | plan.ts getGradingQuota |
| REQ-011 | 1 回ためしの対象は公式曲だけ。教材の採点は対象外 | v2.7 §8-4 | ゲストは /guest/library の公式曲だけ開ける。基礎練・教材・レッスンはゲート | playwright + layout の許可正規表現 | 自動 | [userId]/layout.tsx, PieceCatalog |
| REQ-012 | 使用済み端末は結果を見られるが 2 回目は録音できない | v2.7 §2 | 使用済みで曲を開くと録音ボタンが畳まれ「N 点を残してつづける」カード。別の曲を開くと使用済みのゲート | playwright (ゲストの状態が要る → 検証ユーザー) | 半自動 | Recorder.tsx, scores/[scoreId]/page.tsx |
| REQ-013 | アカウント (契約なし) と契約切れは同じ扱い。ゲストと同じ範囲。一覧は見られ、曲・教材・レッスン・カルテを開くとゲート「再開する」 | v2.7 §2, §8-8 | REQUIRE_SUBSCRIPTION=true かつ plan=free の人は needsSubscription=true。録音画面に「アルコプラスが終了しています・再開する」カード。ゲート主ボタン「再開する」→ /start | 読解 + 描画 | 半自動 | plan.ts, Recorder.tsx, gateText.resume, GuestGate |
| REQ-014 | 無料期間中は 1 日 10 分 かつ 8 本、基礎練 1 日 5 本 | v2.7 §2 表 | trialing の quota が limit 8・secondsLimit 600・practiceLimit 5 | vitest 既存 (plan.test) | 自動 | plan.ts |
| REQ-015 | 契約中は無制限。自分の楽譜の取り込みは契約中だけ | v2.7 §2 表 | plan=plus active → unlimited true、canUpload true。それ以外は false | 読解 + 既存 test | 自動 | plan.ts, getSignedUploadUrl, library/page.tsx |
| REQ-016 | 契約切れ・返金後も記録は残り、読み取りで見られる | v2.7 §2 | expired の User の Performance を消さない。カルテは閲覧可 | 読解 | 読解 | appleServer.applyTransaction (削除処理が無いこと) |
| REQ-017 | 開発者アカウントは User.planGrant="internal" で契約中扱い。付与は管理画面からだけ | v2.7 §2 | planGrant=internal → resolveEffectivePlan が "plus"。planGrant を書く UI・API が管理者以外に無い | vitest + grep | 自動 | plan.ts resolveEffectivePlan |
| REQ-018 | ローンチ日から REQUIRE_SUBSCRIPTION を true にし、既存アカウントは猶予なく録音が止まる | v2.7 §8-5 | 現在は false (未ローンチ)。true にした場合の挙動は REQ-013 で確かめる。admin 2 件に planGrant を付ける手順が先 | 読解 + DB | 半自動 | plan.ts:64 |
| REQ-019 | 先生接続中の生徒は無制限のまま残す | v2.7 §2 | teacherLink != null → unlimited | 既存 test | 自動 | plan.ts |

### C. Apple の通知と状態の同期

| REQ | 文言 | 出所 | 受入条件 | 観測 | 自動 | 関係 |
|---|---|---|---|---|---|---|
| REQ-020 | 状態を変えるのは Apple からの通知だけ。SUBSCRIBED (無料期間つき) → trialing、DID_RENEW/SUBSCRIBED (請求あり) → active、DID_FAIL_TO_RENEW → expired、EXPIRED/GRACE_PERIOD_EXPIRED → expired、REFUND/REVOKE → expired、DID_CHANGE_RENEWAL_STATUS → 変えない (autoRenew だけ) | v2.7 §2 表 | derivePlanStatus が表どおり。applyTransaction が plan="plus"・planStatus・planCurrentPeriodEnd・appleAutoRenew を書く | vitest (derivePlanStatus は純関数) + 模擬 POST | 自動 | appleServer.ts |
| REQ-021 | 通知は notificationUUID で冪等に処理し、生の JWS を保存する | v2.7 §2 | 同じ UUID の 2 回目は duplicate:true で User を書かない。AppleNotification.signedPayload に原文 | 模擬 POST (署名は自前 CA で作ると root 照合で落ちる → 署名検証を通す本物の JWS は Sandbox 待ち。壊れた署名・JSON 不正・UUID 重複の経路は自動) | 半自動 | api/apple/notifications |
| REQ-022 | 署名検証: x5c チェーンを Apple Root CA G3 まで辿り、leaf の公開鍵で検証。失敗は 400 で保存しない | v2.7 §10-6, コード | 壊れた JWS・x5c 無し・自前 CA の JWS はすべて 400 で AppleNotification に行が増えない | 模擬 POST | 自動 | appleServer.verifyAppleJws |
| REQ-023 | bundleId と製品 ID を照合。違えば反映しない | コード appleServer | bundle 違い → reason "bundle"、製品違い → "unknown_product" | vitest | 自動 | appleServer.applyTransaction |
| REQ-024 | 購入直後にアプリから購入証明を送り、通知を待たずに即反映 | v2.7 §2, §6 | POST /api/apple/verify: 未認証 401、jws 無し 400、appAccountToken が本人と違えば 403、成功で User に写す | 模擬 POST + DB | 半自動 | api/apple/verify |
| REQ-025 | 復元: originalTransactionId を照合し、未結び→結ぶ／本人に結び済み→更新／別人に結び済み→conflict で付け替えない／権利なし→none | v2.7 §6 | POST /api/apple/restore の 4 分岐。conflict は 409 | vitest (applyTransaction の分岐は DB が要る → 検証ユーザー) | 半自動 | api/apple/restore, applyTransaction |
| REQ-026 | 同じ契約が 2 アカウントに付かない | v2.7 §4 | User.appleOriginalTransactionId が unique (DB 制約) | migration + DB | 自動 | schema.prisma |
| REQ-027 | 請求猶予は無し。DID_FAIL_TO_RENEW で即 expired。Apple の再試行が通れば DID_RENEW で復帰 | v2.7 §8-9 | isInBillingRetryPeriod=true → expired。その後 DID_RENEW (expiresDate 未来) → active | vitest | 自動 | derivePlanStatus |
| REQ-028 | 持ち主が見つからない通知でも Apple には 200 を返す | コード | appAccountToken 無し・未結び → applied:false で 200 | vitest (route 単体・署名検証を差し替え) | 自動 | notifications/route.ts |
| REQ-020b | cookie を持たない受け口 (Apple の通知・Vercel Cron) は middleware の認証ガードを通る | v2.7 §2, §4 の前提 (ラウンド 1 CR-1-01 で追加) | PUBLIC_API_PATHS に /api/apple/notifications と /api/cron/guest-cleanup がある。cookie 無し curl が route の応答を返す | curl | 自動 | middleware.ts |

### D. ゲストの 1 回ためし (データと入口)

| REQ | 文言 | 出所 | 受入条件 | 観測 | 自動 | 関係 |
|---|---|---|---|---|---|---|
| REQ-030 | 「1 回ためす」を押した瞬間に Supabase の匿名ユーザーを作り、その UUID で User 行 (role=guest・guestDeviceKey unique・guestExpiresAt 30 日) を作る | v2.7 §4 | ensureGuestUser が role=guest・期限 30 日で作る。端末キーが既使用なら used:true で作らない。ログイン中の人には拒否 | vitest (server action は Supabase セッションが要る → 読解 + 検証ユーザー) | 半自動 | actions/guestTry.ts |
| REQ-031 | 端末キーは identifierForVendor (殻) / ブラウザの記録 (Web)。1 回ためしを数える以外に使わない | v2.7 §1 | deviceKey.ts が殻では ArcodaStore.deviceKey、Web では localStorage の乱数。他の用途で参照されない | grep | 自動 | deviceKey.ts |
| REQ-032 | 匿名ユーザーは既存の getSignedUploadUrl と Storage パスと解析器をそのまま通る。解析器は無変更 | v2.7 §4 | getSignedUploadUrl に guest 分岐の追加が無い (quota で弾くだけ)。music-analyzer の差分 0 | git diff | 自動 | getSignedUploadUrl.ts, music-analyzer |
| REQ-033 | Sign in with Apple のとき匿名ユーザーに identity を結び、同じ UUID のまま role を student に。Apple の氏名は仮の名前 | v2.7 §4 | /auth/callback が role guest→student、guestDeviceKey/guestExpiresAt を消す、name を Apple の氏名で埋める。User 行が無ければ作る | 読解 + 模擬 (Supabase の OAuth は本物が要る) | 読解 | auth/callback/route.ts |
| REQ-034 | guestExpiresAt を過ぎたゲスト User を Performance ごと・Storage の音声ごと・Supabase Auth ごと削除する Cron を 1 本。CRON_SECRET で保護 | v2.7 §4, §10-8 | vercel.json に crons。GET /api/cron/guest-cleanup は Bearer 不一致で 401、一致で削除 | 模擬 GET + DB (検証ゲストを作って消す) | 半自動 | api/cron/guest-cleanup, vercel.json |
| REQ-035 | 1 回ためしの悪用: 端末ごと。再インストールでの復活は許容 | v2.7 §6 | 同じ deviceKey での 2 回目は used。別キーなら新規 | vitest 相当 (DB) | 半自動 | guestTry.ts |
| REQ-036 | GuestEvent の種類を追加: try_start・try_result・start_screen・signin_ok・signin_cancel・purchase_ok・purchase_cancel・restore_ok・restore_none | v2.7 §4 | guestEvents.ts の型に 9 種。画面から記録される | grep | 自動 | guestEvents.ts, StartClient |
| REQ-037 | 匿名ユーザー (role=guest) が開けるのは「ためす曲の詳細」だけ。それ以外は /guest に戻す。オンボは出さない | コード layout.tsx, v2.7 §3 | guest の /<uuid>/home・/library・/settings・/karte は /guest/... へ redirect。/<uuid>/scores/<id> は通る | playwright (匿名セッションが要る → 読解 + 検証) | 半自動 | [userId]/layout.tsx, middleware.ts x-pathname |

### E. 画面

| REQ | 文言 | 出所 | 受入条件 | 観測 | 自動 | 関係 |
|---|---|---|---|---|---|---|
| REQ-040 | ゲストホーム: CTA「登録なしで 1 回ためす」→ ライブラリの曲タブに着地し、帯「登録なしで 1 回だけためせます。曲をえらんでください」(未使用の端末だけ)。使用済みなら「さっきの N 点を残しておこう」+「はじめる」 | v2.7 §3 | 殻+apple で CTA と帯の文言と遷移先が一致。使用済みは getGuestTryState で切替 | playwright | 自動 (未使用) / 半自動 (使用済み) | GuestHome.tsx, library/page.tsx, LibraryClient |
| REQ-041 | Web (ブラウザ) のゲストホームと /signUp は「iPhone アプリで登録」→ App Store。/login は残す | v2.7 §3 | Web+apple: CTA「iPhone アプリで登録」+「App Store で「アルコ」をダウンロード」。/signUp は App Store 案内。Web+stripe: 従来 | playwright | 自動 | GuestHome, signUp, NATIVE_BOOT_SCRIPT |
| REQ-042 | 曲の詳細・ゲート: 未使用「登録なしで 1 回ためす」／使用済み「はじめる」→ /start。従ボタン名は「はじめる」(「Apple で続ける」は使わない) | v2.7 §3, v2.5 | gateText.songTry / songUsed の文言と GateSheet の主・従ボタン | playwright | 自動 | gateText.ts, GateSheet.tsx |
| REQ-043 | 録音・採点ちゅう: ゲストの録音はゲスト User の Performance に保存。契約なし・契約切れは録音ボタンを畳んで「再開する」カード | v2.7 §3 | Recorder の needsSubscription 分岐に「アルコプラスが終了しています」「再開する」→ /start | 読解 + 描画 (quota を偽装した描画) | 半自動 | Recorder.tsx |
| REQ-044 | 採点結果: ゲストには下段を「この N 点を残してつづける」1 つに (→ /start)。シェアとカルテは出さない | v2.7 §3 | guestTrial=true で下段がその 1 ボタン + 「残さない場合は右上の × で閉じる」。シェア・カルテのボタンが無い | playwright (ハーネス) | 自動 | ArcoResultOverlay.tsx |
| REQ-045 | 結果を閉じたあと: 帯は出さない。録音ボタンを畳み「N 点を残してつづける」+「ためせるのは 1 回。次からはアルコプラスで」 | 流れ図 手順 9, v2.5 | Recorder の isGuest && used>=limit 分岐 | 読解 + 描画 | 半自動 | Recorder.tsx |
| REQ-046 | オンボーディングは購入シート確定の直後に、契約した人だけに出す。要ログインのまま。既存の「未完了なら /onboarding へ」で来る | v2.7 §3, v2.7 順番 | /start 購入成功 → router.replace("/") → layout が未完了なら /onboarding。ゲスト (role=guest) には出さない。契約なしのアカウント (購入キャンセル) にも出さない | 読解 + playwright | 半自動 | StartClient, [userId]/layout.tsx |
| REQ-047 | SCR-02b 呼び名: 挨拶の直後。User.name になる | v2.7 §3 | SCR02 → SCR02B → SCR03。completeOnboarding が name を書く | playwright (ハーネス) + 読解 | 半自動 | onboardingClient, _lib/actions.ts |
| REQ-048 | SCR-11d お便り: ゴールの直後。メールと同意 (未チェック)。必須にしない。「あとで」で飛ばせる | v2.7 §3 | SCR11C → SCR11D → SCR12。同意未チェック既定。空でも次へ進める。marketingEmail・marketingOptInAt を書く | playwright + 読解 | 半自動 | onboardingClient, actions.ts |
| REQ-049 | アルコプラスをはじめる: 見出し・プラン 2 枚 (初期選択 年額)・できること 3 つ・「年額プランで Apple ではじめる」・注記・購入を復元・規約・ポリシー。× は置かない。出口は「購入を復元」と「ゲストにもどる」だけ | v2.7 §3, §8-1, §8-2 | モック v3 と画素一致 (済)。× のボタンが無い | playwright + 画素 | 自動 | StartClient, start.module.css |
| REQ-050 | 価格と期間は StoreKit の値。コードに 1,280 を書かない (画面の説明文の条件つき一文は除く) | v2.7 §3, §5 | StartClient・PlanCard に価格の数値リテラルが無い。表示は displayPrice | grep + 描画 | 自動 | StartClient, appleStore.ts |
| REQ-051 | 導入オファーの対象外 (2 回目以降) なら「最初の 2 週間は無料」の行と注記を出さない | v2.7 §3 | introEligible=false で見出し下が「選んだプランの料金で、今日から再開できます」、注記に「無料」が無い | playwright (偽ブリッジ introEligible:false) | 自動 | StartClient |
| REQ-052 | アカウント済みなら Apple のサインインを飛ばして購入シートだけ | v2.7 §3, §6 | hasApple=true の人が CTA → linkApple を経ずに purchase | 読解 (StoreKit は殻が要る) | 読解 | StartClient.onStart |
| REQ-053 | 商品情報が取れないとき (オフライン・未登録) は価格を伏せて「読み込めませんでした・もう一度」 | v2.7 §3 | getProducts 失敗で価格欄 hidden、「価格を読み込めませんでした。」+「もう一度」ボタン、CTA は押せない | playwright (偽ブリッジ reject) | 自動 | StartClient |
| REQ-054 | 設定のプランカード: 無料期間中・契約中・お支払いに問題・更新しない予定・契約切れ・未加入・運営 の表示と「契約を管理」。iOS は Apple の管理シート、Web は account.apple.com へのリンク。未加入は「アルコプラスをはじめる」→ /start。価格は StoreKit だけ (Stripe の 980 円ボタンは撤去) | v2.7 §3, v2.2, §8-7 | 7 状態の文言 (照合報告で一致済)。Web で「契約を管理」が account.apple.com を開く。980 が無い | playwright (ハーネス) + grep | 自動 | PlanCard.tsx |
| REQ-055 | iOS の /login: ボタンは Apple だけ。メール・パスワードのフォームは残す | v2.7 §3 | 殻+apple で Google が無く Apple がある。フォームあり | playwright | 自動 | login/page.tsx |
| REQ-056 | canShowBillingEntryPoint() を「iOS で true・Web で false」に反転 (apple モード) | v2.7 §3 | apple: isNativeApp。stripe: !isNativeApp | vitest (純関数) | 自動 | isNativeApp.ts |
| REQ-057 | ホームの先生セクションは TEACHER_FEATURE_ENABLED=false で隠す | v2.2 | home.tsx が TEACHER_FEATURE_ENABLED を見る | grep + 読解 | 自動 | home.tsx |
| REQ-058 | ホームか設定に「無料期間はあと N 日」。録音画面の「今日の採点 N/8回」に「あと M 分」 | v2.7 §3 | home.tsx trial チップ、Recorder quotaLine | 読解 + 描画 | 半自動 | home.tsx, Recorder.tsx |
| REQ-059 | 契約切れの人のホーム: 「再開する」→ /start (購入シートだけ) | v2.7 §3 | home.tsx expired バナー | 読解 | 読解 | home.tsx, [userId]/page.tsx |
| REQ-060 | 復元の結果: 見つかった (戻り先へ)／見つからない (この Apple アカウントに契約が無い) | v2.7 §3 | doRestore: ok → ダイアログ → / か /onboarding。none → トースト「この Apple アカウントに契約はありません」 | playwright (偽ブリッジ) | 半自動 (セッションが要る) | StartClient.doRestore |
| REQ-061 | 反映待ち・失敗: 「反映しています…」と、検証失敗時に「購入を復元」を促す | v2.7 §3 | doPurchase の say 文言 | 読解 | 読解 | StartClient |
| REQ-062 | 退会は残す。「Apple の契約は自動では止まりません。iPhone の設定 › サブスクリプション から解約」を足す。本人確認は Apple ユーザーは「退会」入力。Apple トークンの失効を退会に足す | v2.7 §3, §6, §10-14 | DeleteAccountModal: hasApple で注記、hasPassword=false で確認語。requestAccountDeletion: email 無しは confirmWord、apple なら revokeAppleToken | playwright (ハーネス) + 読解 | 半自動 | DeleteAccountModal, requestAccountDeletion, appleRevoke |
| REQ-063 | 帯 (C-9) は出さない | v2.5 | GateSheet の bar モードを「結果を閉じたあと」で使っていない | grep | 自動 | scoreDetail, GuestGate |
| REQ-064 | プランの変更 (年額↔月額) はアプリに画面を作らず、Apple の管理シートへ | v2.7 §5 | 変更画面が無い。PlanCard「契約を管理」が showManageSubscriptions | grep | 自動 | PlanCard |

### F. データ

| REQ | 文言 | 出所 | 受入条件 | 観測 | 自動 | 関係 |
|---|---|---|---|---|---|---|
| REQ-070 | User に billingProvider・appleOriginalTransactionId (unique)・appleProductId・appleEnvironment・marketingEmail・marketingOptInAt・marketingOptOutAt・planGrant を足す。plan・planStatus・planCurrentPeriodEnd は流用 | v2.7 §4 | migration.sql に列と unique。本番に適用済み (段0) | DB | 自動 | schema.prisma, migration |
| REQ-071 | AppleNotification (notificationUUID unique・type・subtype・raw JWS・processedAt) | v2.7 §4 | 表と unique がある | DB | 自動 | migration |
| REQ-072 | OnboardingProfile の答えに呼び名とお便りを追加。同意日時は User に写す | v2.7 §4 | completeOnboarding が name・marketingEmail・marketingOptInAt を User に書く | 読解 | 読解 | onboarding/_lib/actions.ts |
| REQ-073 | 本番のマイグレーションは手動。読み取り側の防御がある | 規約 | 新列はすべて nullable。読み手は null を既定として扱う | 読解 | 読解 | plan.ts, PlanCard |
| REQ-074 | 製品 ID を定数化: com.arcodaviolin.app.plus.yearly / .monthly。バンドル ID com.arcodaviolin.app | v2.7 §5, §9 | planConstants と Swift の値が一致 | grep | 自動 | planConstants.ts, ArcodaStorePlugin.swift |

### G. 例外系

| REQ | 文言 | 出所 | 受入条件 | 観測 | 自動 | 関係 |
|---|---|---|---|---|---|---|
| REQ-080 | サインインをキャンセル → 1 画面に戻る。何もできていない | v2.7 §6 | OAuth から戻らない → /start のまま。DB に変化なし | 読解 | 読解 | StartClient.linkApple |
| REQ-081 | 購入をキャンセル → 1 画面に戻る。アカウントはできている。次回はサインインが飛ばされ購入だけ。状態は free | v2.7 §6 | purchase status "cancel" → トースト「購入をやめました。いつでも再開できます」。User は role=student・plan=free | 読解 + 偽ブリッジ | 半自動 | StartClient.doPurchase |
| REQ-082 | 同じ Apple ID で 2 つ目のアカウント → 復元の経路へ。契約は最初のアカウントにしか付かない | v2.7 §6 | applyTransaction の conflict | vitest (DB) | 半自動 | applyTransaction |
| REQ-083 | 機種変更・再インストール → 「購入を復元」→ Apple サインイン → 権利取得 → /api/apple/restore | v2.7 §6 | onRestore: ensureSession → linkApple("restore") → resume で doRestore | 読解 | 読解 | StartClient |
| REQ-084 | 購入直後に通知が来ない → 購入証明で先に反映。両方来ないとき「反映中…」→「購入を復元」を案内 | v2.7 §6 | doPurchase の verify 失敗文言 | 読解 | 読解 | StartClient |
| REQ-085 | 購入シートをキャンセルして残った人は「ゲストにもどる」で退出。次回起動時はゲートから 1 画面へ。ゲストの 1 回は使用済みのまま | v2.7 §6 | /start に「ゲストにもどる」リンク。guest の used は消えない | playwright + 読解 | 半自動 | StartClient, guestTry |
| REQ-086 | 既存アカウント (メール登録・開発用) はローンチ日に REQUIRE_SUBSCRIPTION=true。猶予は置かない | v2.7 §6 | RESTRICTION_START/EXISTING_USER_GRACE_DAYS を使う猶予経路が apple モードで効かないか、または未発動 | 読解 | 読解 | plan.ts resolveEffectivePlan |

### H. 同意とメール

| REQ | 文言 | 出所 | 受入条件 | 観測 | 自動 | 関係 |
|---|---|---|---|---|---|---|
| REQ-090 | お便り用メールは本人が SCR-11d で書いたもの + 未チェックの同意。Apple のメールとは別に持つ | v2.7 §7 | marketingEmail は authUser.email と独立。同意チェック無しなら marketingOptInAt を書かない | 読解 | 読解 | actions.ts |
| REQ-091 | 配信は事務所住所を用意してから。それまで同意だけ集めて配信しない | v2.7 §7 | 配信コードが無い (Resend の broadcast 呼び出しが無い) | grep | 自動 | app/ |

### I. 殻 (ネイティブ)

| REQ | 文言 | 出所 | 受入条件 | 観測 | 自動 | 関係 |
|---|---|---|---|---|---|---|
| REQ-100 | StoreKit・端末識別子は remote URL 方式の nativePromise 経由で呼ぶ。@capacitor/core は Web に積まない | v2.7 §4, appleStore.ts | appleStore.ts が window.Capacitor.nativePromise("ArcodaStore", …) を使う。package.json に @capacitor/core が無い | grep | 自動 | appleStore.ts, package.json |
| REQ-101 | 購入には appAccountToken = supabaseUserId (UUID) を添える | v2.7 §1 | purchase(kind, appAccountToken) に authUserId を渡す。Swift 側は UUID でなければ reject | 読解 | 読解 | StartClient, ArcodaStorePlugin.swift |
| REQ-102 | 殻のプラグインは Transaction.updates を finish する | コード | Swift の load() | 読解 | 読解 | ArcodaStorePlugin.swift |

### 未決 (AMB) — 2026-09-13 Tetsuo 決定: すべて第 1 案 (04_round-2-fix.md §2)

| ID | 何が読めないか | 私の解釈 (この解釈で進める) |
|---|---|---|
| AMB-001 | v2.7 §6「支払い失敗: past_due のまま Apple の猶予期間は使わせる」と §8-9「請求猶予なし・即 expired」が同じ文書内で矛盾する | §8 決定表 (後から確定) を正とし、即 expired で進める。§6 の一行は古い記述として人へ戻す |
| AMB-002 | ゲストの「結果は点数と音程・リズムまで」の範囲。ふりかえりタブや練習後カルテをゲストが開けるかは書かれていない | 曲詳細の中のタブは開ける (実装のまま)。シェアとカルテ画面への導線は出さない |
| AMB-003 | 流れ図 手順 16 は「録音は無制限」(契約中) と読めるが、全容 C-19 は「無料期間中の 1 行」 | 両方が正 (状態が違う)。契約中は行を出さない、無料期間中は出す |
| AMB-004 | 「Apple の氏名は仮の名前として入れておき」: 氏名が Apple から取れないとき (2 回目以降のサインインでは Apple は氏名を渡さない) の既定名 | 「あなた」を仮名にし、SCR-02b で上書きさせる |
| AMB-005 | Web (ブラウザ) で apple モードのとき、ゲストが「1 回ためす」を使えるか | 使えない (App Store へ)。1 回ためしは殻だけ |
| AMB-006 | 「自分の過去の記録だけは読み取りで見られる」(契約切れ) の具体: カルテ画面はゲート「再開する」なのか読めるのか | §2 表の「成長カルテ・記録: 契約切れ ○ (閲覧)」を正とし、カルテは開ける。曲・教材・レッスンはゲート (ラウンド 1 CR-1-03 で実装) |
| AMB-007 | v2.7 §3「曲詳細から離れると、その曲を開いたときは使用済みのゲート」と REQ-012「使用済み端末は結果を見られる」(実装: ためした曲を開き直すと本人 URL へ) が出所内で食い違う (CR-1-19b) | 実装のとおり「ためした曲は結果が見られる (本人 URL)・別の曲は使用済みのゲート」で進める。人へ |
| AMB-008 | Apple 経路で「お支払いに問題があります」の状態が到達不能 (DID_FAIL_TO_RENEW は即 expired・CR-1-18)。§2 表の「設定に『お支払いに問題があります・再開する』」と実装「契約切れ・再開する」が違う | 人へ。請求リトライ中の表示を分けるなら planStatus=expired かつ appleAutoRenew=true で判別する案を最終報告に書く |
| AMB-009 | stripe モード (アプリ公開前の本番) で未加入者の設定と /start に何を出すか。REQ-003「従来どおり」と Tetsuo 決定「Stripe の新規導線は止める」が両立しない (CR-1-04) | 「アルコプラスの新しいお申し込みは準備中です」を出す (Stripe の checkout ボタンは戻さない)。人へ |
| AMB-010 | Web (ブラウザ) + apple モードで 1 回ためしを許すか。v2.7 §1 は「ブラウザの記録」を端末識別子に挙げるが、§3 は Web を App Store へ送る (CR-1-13) | 殻だけ (AMB-005 を維持)。Web の曲ゲートは「iPhone アプリで登録」に揃えた。人へ |
| AMB-011 | 先生 role にも Apple の契約が書けるが、先生画面にプランカードが無い (CR-1-19g) | 先生の課金は別件 (先生機能は未公開)。人へ |
| AMB-012 | メールや Google のアカウントで殻にログインしている人が /start で Apple を結ぶとき、Supabase の手動 identity 結合が要る (CR-1-15)。Web で Google 登録した人は殻の /login に Google が無いので入れない (REQ-004 の帰結) | linkIdentity に統一した。Google の人の殻ログインは既存が開発用だけなので今は実害なし。人へ |

### 要件に無いが実装に入っている挙動 (EXTRA)

| ID | 挙動 | 出所 |
|---|---|---|
| EXTRA-001 | 復元成功時に確認ダイアログ (window.alert) を出してから遷移する | 流れ図 C-18 のモック |
| EXTRA-002 | /start はハイドレーション前に枠だけ描く (Web の案内が一瞬出るのを避ける) | 照合ループでの修正 |
| EXTRA-003 | GuestHome の殻/Web 出し分けに html[data-native-boot] を使う (描画前の印) | 照合ループでの修正 |
| EXTRA-004 | Recorder の使用済みカードに guestLastScore を出す (quota に列を足した) | 流れ図 手順 9 |
| EXTRA-005 | 削除の本人確認語「退会」 | v2.7 §6 は「Apple で再サインイン」と書いていたが、会話で「退会と入力」に変更 (Tetsuo 承認済・2026-09-12 深夜) |
| EXTRA-006 | /api/apple/verify で appAccountToken 不一致は 403 | 乗っ取り防止 (§6 の趣旨から) |
| EXTRA-007 | ゲストの guestExpiresAt を Apple 結合時に null にする (削除対象から外す) | 昇格した人を Cron で消さないため |
| EXTRA-008 | 一度も契約していないアカウント (REQUIRE_SUBSCRIPTION=true) には「終了しています」でなく「アルコプラスをはじめると、採点と基礎練が使えます」+「はじめる」 | ラウンド 1 CR-1-10 (価値) |
| EXTRA-009 | 古い期末の取引 (順序逆転・別契約の遅い通知) は捨てる。失効と請求リトライは通す | ラウンド 1 CR-1-07 |
| EXTRA-010 | ゲストの queued Performance は 15 分で「取り直せる」扱い | ラウンド 1 CR-1-12 |
| EXTRA-011 | 「N ヶ月分お得」は Apple の価格から計算 | ラウンド 1 CR-1-19d |
| EXTRA-012 | Cron は billingProvider null かつ plan free の行だけ消す (安全網) | ラウンド 1 CR-1-17 |
| EXTRA-013 | /start?step= は、続きが移動しなかった (キャンセル・失敗) ときだけ URL から消す | ラウンド 1 CR-1-14 → ラウンド 2 CR-2-02 |
| EXTRA-014 | 結果カードの「この N 点を残してつづける」の下に「はじめる手続き・最初の 2 週間は無料」の 1 行 | 検証ループ §7・Tetsuo 承認 2026-09-13 |
| EXTRA-015 | /start の CTA は導入オファー対象なら「2 週間無料ではじめる」、対象外なら「年額プランで Apple ではじめる」 | 同上 |
| EXTRA-016 | 契約ゲート (primaryHref 明示) は端末の「登録済み」の印に関係なく主ボタンを固定し、veil クリックと Escape で閉じない | ラウンド 2 CR-2-01/07 |
| EXTRA-017 | 匿名セッションは /login を通る。/onboarding は匿名を /guest へ、apple モードで契約なしをホームへ送り返す | ラウンド 2 CR-2-03・未決 7a |
