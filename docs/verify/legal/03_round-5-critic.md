# 法務文面 4 点 ラウンド 5 批評 (critic)

- 日付: 2026-09-13
- 対象: 03_round-4-critic.md の 9 件 (S3 6・S4 3) に対する 04_round-4-fix.md の修正。台帳 02_cases.csv (L-01〜L-31)、99_report.md (v3)、docs/legal/app-store-listing.md。
- 自分の手で読んだもの: app/start/{page,StartClient}.tsx、app/_libs/{billingProviderOf,billingProviderOf.test,stripe,stripe.test,plan}.ts、app/actions/requestAccountDeletion.ts、app/api/stripe/webhook/route.ts、app/api/apple/{verify,restore}/route.ts、app/_libs/apple/appleServer.ts:100-152、app/api/cron/guest-cleanup/route.ts、app/[userId]/settings/{page,PlanCard,DeleteAccountModal}.tsx、app/[userId]/profile/{page,AccountInfo}.tsx、app/[userId]/layout.tsx:40-70、app/[userId]/page.tsx:812-835、app/[userId]/home.tsx (帯)、app/components/guest/gateText.ts、app/components/Recorder.tsx (該当行)、app/[userId]/library/LibraryClient.tsx:120-124、app/[userId]/support/help/page.tsx (該当行)、app/[userId]/support/contact/page.tsx、app/components/legal/{Tokushoho,Terms}Content.tsx (該当条)、app/_libs/getUserIdsFromParams.ts、app/page.tsx、node_modules/@supabase/auth-js (fetch.js の error 生成・GoTrueAdminApi.deleteUser)、docs/verify/legal/{02_cases.csv,04_round-3-fix,04_round-4-fix,99_report}、docs/legal/app-store-listing.md §3-4、メモリ project_teacher_embed_email_pending_tests.md:78-79・project_billing_verify_manual_pending.md (10〜12)、evidence/screens/07_delete_stripe.jpg・08_settings_stripe.jpg。git diff (作業ツリー vs HEAD) で今回の変更行を特定。
- 実行したもの: `npx vitest run app/_libs/billingProviderOf.test.ts app/_libs/stripe.test.ts app/_libs/plan.test.ts app/_libs/planGrant.test.ts` → 4 ファイル 43 件 green。`--reporter=verbose` で per-file: billingProviderOf 8・stripe 12・plan 17・planGrant 6。dev (http://localhost:3101・apple モード) で curl: /start 200・/guest/support/tokushoho 200・/guest/support/contact 200。Stripe 公式ドキュメント (docs.stripe.com/billing/subscriptions/overview) の status 表を取得して unpaid / paused / canceled の挙動を引用。`grep -rn "1,280"` と `grep -rn "無料"` で UI の固定価格と「無料」の語を再洗い出し。
- 【 】の空欄そのものは指摘しない。本番 DB は読み書きしていない。退会は実行していない。実装・テストコードは編集していない。

## 0. 総評

ラウンド 4 の 9 件は、実装側の 7 件 (01・02・03・05・06・08・09) をコードと画面で閉じた。/start のガードは契約中 (plus・trial・internal) をホームへ戻し、購入・復元の戻り (step) と匿名を通す。退会時の Stripe 解約は DB でなく Stripe に retrieve して決めるようになり、Apple に上書きされた人も対象になる。webhook は主経路で apple の行を守る。cron は Auth → DB の順になり、auth-js の error.message が GoTrue の "User not found" をそのまま持つので not found の判定は合う。PlanCard の Stripe 注記と退会モーダルの出し分けは撮影画像 07・08 と一致する。

新規は S1・S2 なし。S3 が 6 件: 退会時の解約が unpaid / paused / incomplete の契約を残す (Stripe 公式で unpaid は請求書の生成が続き支払えば active に戻る)、退会の Stripe 解約が Auth 削除より前で失敗時に巻き戻せない (Web の再契約は閉じている)、テスト件数の記録が 3 回目の不一致、listing の「5 か所」が列挙 6 か所と矛盾、ラウンド 4 で求めた台帳の抜け 3 件が未対応、fix 記録と billingProviderOf.ts の「解約済みでも契約を管理から Customer Portal」が PlanCard の実装と違う。S4 が 5 件。

## 1. 前ラウンド指摘の閉じ判定

| ID | 重大度 | 判定 | 自分で確認した根拠 |
|---|---|---|---|
| CR-L4-01 | S3 | **閉じる** (期待 (1)(2) 実装済。期待 (3) 台帳の行は未 → CR-L5-05) | (1) start/page.tsx:25-29: 非匿名で dbUser があれば `resolveEffectivePlan(...restrictionStart: null...)` が "free" 以外かつ `!sp.step` で `redirect(/${user.id})`。redirect 先は Supabase UUID で、URL 規約 (getUserIdsFromParams.ts:24 `authUserId: params.userId と一致`・app/page.tsx:10 も同じ) と一致。副作用: 購入直後は doPurchase が `router.replace("/")` (StartClient:171) で /start に戻らない。Apple OAuth から `/start?step=purchase` で戻る人は step があるので通る (かつ戻る時点では free)。trial の人は "trial" ≠ "free" で戻される = 契約中扱いで正しい (入口の帯・ゲート・PlanCard は free/expired にしか /start を出さない)。planGrant=internal は "plus" で戻される (手順上の注意 → CR-L5-10)。匿名 (anon) は `!user.is_anonymous` で判定を通らず StartClient に進む。(2) requestAccountDeletion.ts:92-109: 加入歴があれば `subscriptions.retrieve` → `isStripeLiveStatus` なら `cancel`、それ以外はログのみ。catch で `code === "resource_missing"` または "already canceled" の文言なら続行、その他は :106 で中断。shouldCancelStripeOnDeletion:33-35 は `!!stripeSubscriptionId` だけになり、billingProvider "apple" でも通る (test :23 で固定)。残: 生きている集合の外側 (CR-L5-01)・順序 (CR-L5-02) |
| CR-L4-02 | S3 | **閉じる** (主経路)。予備経路は CR-L5-07 (S4) | webhook route.ts:72-76: `findFirst({ stripeCustomerId })` で billingProvider "apple" なら warn を出して return。4 経路とも applySubscription を通るので checkout.session.completed・created/updated・deleted すべてに効く。期待にあった「apple の行は上書きしない」のテストは無い (applySubscription は route.ts 内の非公開関数で、テストは書きにくい。空振り欄に記す) |
| CR-L4-03 | S3 | 閉じる | LibraryClient.tsx:123「はじめての方は最初の 2 週間は無料」。`grep -rn 無料` で UI の「最初の 2 週間は無料」8 か所 (ArcoResultOverlay:265・gateText:30/38/47・Recorder:1055・home:237・LibraryClient:123・PlanCard:124) がすべて「はじめての方は」つき。StartClient:254/287/291 は introEligible 判定下。無条件は 0 件 |
| CR-L4-04 | S3 | **一部閉じる** | 1. 99_report.md は v3 (L1)、「批評 4 ラウンド 66 件」(L4)、実装の表に retrieve・billingProviderOf・migration (L12-13)、8 か所 (L26)、未実施に migration 適用 (L45) → 閉じる。2. listing L128 は「無料の文は 8 か所」に直ったが、同じ行の「円額はアプリ内の 5 か所 (gateText ×3・Recorder・ホームの帯・PlanCard)」は列挙が 6 → CR-L5-04。3. 04_round-3-fix.md L30 は「webhook のテストファイルは無い」と訂正された。しかし 04_round-4-fix.md L24 と 99_report L35 のテスト件数がまた実測と違う → CR-L5-03 |
| CR-L4-05 | S3 | 閉じる (台帳の行は未 → CR-L5-05) | PlanCard.tsx:107-111: `provider === "stripe"` なら「変更・解約は契約の管理ページで行います。退会すると、この契約は同時に解約されます。」、それ以外で `!native && (apple)` なら Apple の注記。evidence/08_settings_stripe.jpg で「契約中」「契約を管理」の下にこの文が出ている。manage:69 の順序は据え置きで Customer Portal。括弧なし |
| CR-L4-06 | S4 | 閉じる | project_teacher_embed_email_pending_tests.md:78-79 に「2026-09-13 追記 (法務 verify-loop CR-L3-07)」と needsSubscription・getGradingQuota の見直しが書かれている |
| CR-L4-07 | S3 | 閉じる (実機確認へ・残件として保持) | project_billing_verify_manual_pending.md の 10 番に SCR-11d の target=_blank の確認と「消えるなら Capacitor Browser」が記録されている。onboardingClient.tsx:686 はそのまま |
| CR-L4-08 | S4 | 閉じる | cron route.ts:39-45: Storage → Auth (`deleteUser`) → DB。`authErr && !/not\s*found/i.test(authErr.message)` で not found 以外は throw。auth-js 2.97.0 fetch.js:15 `_getErrorMessage = err.msg \|\| err.message \|\| ...` → GoTrue の 404 は `{"msg":"User not found","error_code":"user_not_found"}` なので message は "User not found" で正規表現に一致する。より堅いのは `authErr.code === "user_not_found"` (fetch.js:66 で errorCode が AuthApiError.code に入る) だが、現行でも動く。DB 削除が失敗した場合も次回は Auth が not found → 続行 → DB 削除で回収される |
| CR-L4-09 | S4 | 閉じる (根拠文の誤りは CR-L5-06) | billingProviderOf.ts:46-50 billingNoteProvider: stripe は `isStripeLiveStatus(planStatus)` のときだけ "stripe"。profile/page.tsx:28 select に planStatus・:39 で渡す → AccountInfo:269 → DeleteAccountModal:98。test :42-46 で canceled は null。evidence/07_delete_stripe.jpg で「Web で契約中の…」が active の検証ユーザーに出ている |

閉じた: 7 (01・02・03・05・06・08・09) / 一部: 1 (04) / 実機へ: 1 (07)。
前ラウンドからの残り (変化なし): CR-L1-15 (見送り)、CR-L1-18 (Tetsuo)、CR-L2-09 (Tetsuo)、CR-L3-06 (サポート画面の Arcoda・据え置き)。

## 2. 新規指摘 (CR-L5-xx)

重大度: S1 法令違反または審査で確実に止まる・虚偽の公開文書 / S2 紛争や返金の火種・主要動線が破れる / S3 分かりにくい・不正確 / S4 改善提案
種別: 適合・完全性・価値・整合・証跡の不備

### S3

#### CR-L5-01 退会時の Stripe 解約が unpaid / paused / incomplete の契約を残し、unpaid は退会後も請求書が生成され続ける
- 重大度: S3 (到達には Stripe ダッシュボードの「失敗した支払いの設定」が unpaid を選んでいることが要る。既定は canceled。設定が unpaid なら退会した人に請求書が積み上がり、支払うと契約が active に戻る = S2 相当の火種になるので、設定を確認して決めること) / 種別: 完全性 (コード読みによる反例)
- 対象: app/_libs/billingProviderOf.ts:16 `STRIPE_LIVE_STATUSES = {trialing, active, past_due}`、app/actions/requestAccountDeletion.ts:96-100
- 何が問題か: retrieve した status が集合の外 (unpaid・paused・incomplete) だと cancel を呼ばずログだけで退会が進む。Stripe 公式 (docs.stripe.com/billing/subscriptions/overview「サブスクリプションステータス」表) の原文: unpaid は "The latest invoice remains open and invoices continue to generate, but payments aren't attempted. … To move the subscription to `active`, pay the most recent invoice before its due date." canceled は "キャンセル時に未払いのすべての請求書の自動回収が無効化されます … 更新できない最終的なステータス"。つまり unpaid を残すと、退会でアカウントが消えた人の Customer に請求書が毎期作られ、Stripe のメール (hosted invoice) が届き、支払えば契約が復活する。paused も運営側から再開できる状態で残る。規約 第5条の5「退会すると同時に当社が解約し、以後の請求は発生しません」・退会モーダル「以後の請求はありません」と食い違う。
- 根拠: 上記行と Stripe 公式。checkout の二重加入ガードと同じ集合を使った経緯 (R4 空振り欄) は「加入中か」の判定には合うが、「退会で残してよいか」の判定には合わない。退会で残してよいのは canceled と incomplete_expired (終端) だけ。
- 期待: 退会では `sub.status !== "canceled" && sub.status !== "incomplete_expired"` なら cancel する (終端以外はすべて止める)。billingProviderOf に `isStripeTerminalStatus` を足してテスト 1 本。isStripeLiveStatus は「契約中の注記」用に残してよい。

#### CR-L5-02 退会の Stripe 解約が Auth 削除より前にあり、Auth 削除が失敗すると契約だけ消えて巻き戻せない
- 重大度: S3 (Auth 削除の一時失敗という条件つき。起きると Web の Stripe 契約者は契約を失い、Web の新規契約は「準備中」で閉じているので同じ条件で戻れない) / 種別: 完全性 (コード読みによる反例)
- 対象: app/actions/requestAccountDeletion.ts:92-109 (cancel) → :112 (deletedAt) → :124-139 (Auth 削除失敗のロールバックは deletedAt のみ)
- 何が問題か: 手順: Web の Stripe 契約者が退会 → :97 で Stripe を即時 cancel (取り消せない) → :124 deleteUser が一時エラー → :127 deletedAt を null に戻して「退会申請に失敗しました。時間をおいて再試行してください」。この時点でアカウントは生きているが契約は canceled (webhook で plan null)。再試行すれば退会は完了するが、気が変わっても Web では再契約できない (StartClient の Web 分岐は「iPhone アプリではじめられます」)。ロールバックの設計 (:18「失敗時は deletedAt ロールバックで無傷状態」) が Stripe を含んでいない。
- 根拠: 上記行。Stripe の cancel は `cancel_at_period_end` ではなく即時 (`subscriptions.cancel`)。
- 期待: いずれか。(a) retrieve は今の位置で行い (生死の確認と Stripe 疎通の確認)、cancel は Auth 削除が成功した直後・Storage 削除の前に移す。cancel がそこで失敗したときは退会を続行しつつ `stripe_cancel_after_auth_failed` を error ログに出し、完了メールに「Web の契約の解約に失敗したため、サポートに連絡してください」を足す (CR-L2-03 の「本人が止める手段が無い」は運営が止めることで担保)。(b) 現在の順序を保つなら、Auth 削除失敗のエラー文に「Web の契約は解約済みです。退会を完了するには再試行してください」を出し、ロールバックが不完全であることを本人に伝える。いずれも台帳に行を足す。

#### CR-L5-03 テスト件数の記録が実測と違う (3 ラウンド連続)
- 重大度: S3 / 種別: 証跡の不備
- 対象: docs/verify/legal/04_round-4-fix.md L24「billingProviderOf 14 件・stripe 7 件・plan/planGrant 22 件」、docs/verify/legal/99_report.md L35「648 件 green (billingProviderOf 14 件を含む)」
- 何が問題か: `npx vitest run ... --reporter=verbose` の実測は billingProviderOf.test.ts 8 件・stripe.test.ts 12 件・plan.test.ts 17 件・planGrant.test.ts 6 件 (合計 43 は fix の 14+7+22 = 43 と一致するが、ファイルごとの数はどれも合わない)。billingProviderOf は it が 8 で expect が 14。ラウンド 4 の期待「ファイル名と vitest の出力の件数で書く」が守られていない。数が合わないと「テストを足した」という主張 (fix L9「テスト更新」) を裏取りできない。
- 期待: fix 記録と 99_report を「billingProviderOf.test.ts 8・stripe.test.ts 12・plan.test.ts 17・planGrant.test.ts 6 (vitest 4 files 43 passed)」に直す。以後は vitest の出力行をそのまま貼る。

#### CR-L5-04 listing の「円額はアプリ内の 5 か所」が、直後の列挙 (6 か所) と grep の実測 (6 か所 + FAQ) に合わない
- 重大度: S3 / 種別: 証跡の不備・整合 (CR-L4-04 の直し方で新たに生じた誤り)
- 対象: docs/legal/app-store-listing.md L128「円額はアプリ内の 5 か所 (gateText ×3・Recorder・ホームの帯・PlanCard) とヘルプ FAQ に固定で書いてあり」
- 何が問題か: 列挙は 3 + 1 + 1 + 1 = 6。`grep -rn "1,280" app` の UI 側は gateText.ts:30/38/47・Recorder.tsx:1055・home.tsx:237・PlanCard.tsx:124 の 6 件 + help/page.tsx:126 (FAQ) + 法務文書 2 件 (Terms:70・Tokushoho:45)。価格ポイントが変わったときに「5 か所直した」で 1 か所残る。
- 期待: 「6 か所」に直し、法務文書 2 件 (規約 第5条・特商法) も同じ行に足す (円額を一括で直す対象は UI 6 + FAQ 1 + 法務 2 = 9)。

#### CR-L5-05 ラウンド 4 で求めた台帳の抜け 3 件が未対応
- 重大度: S3 / 種別: 証跡の不備・完全性
- 対象: docs/verify/legal/02_cases.csv (L-01〜L-31 のまま)、docs/verify/legal/04_round-4-fix.md (台帳への言及なし)、99_report.md L39「L-01〜L-31 すべて記入」
- 何が問題か: CR-L4-01 期待 (3)「契約中の人は /start に入れない」の行、CR-L4-03 期待「台帳 L-29 の対象列を 8 か所に直す」(L-29 は gateText/Recorder/home/PlanCard のまま・ArcoResultOverlay と LibraryClient が無い)、CR-L4-05 期待「Web の Stripe 契約者の PlanCard の文言」の行。3 つとも台帳に無い。fix 記録はコードの修正だけを書き、台帳は触っていない。台帳に無い挙動は次のラウンドで「直っているか」を誰も見ない。
- 期待: L-32 (/start ガード: plus・trial・internal は redirect、step あり・anon は通す)、L-33 (Web の Stripe 契約者の PlanCard 注記と manage 先)、L-34 (退会時の Stripe retrieve → cancel の 4 分岐: live・not live・resource_missing・その他失敗) を足し、L-29 の対象列を 8 か所に。

#### CR-L5-06 「解約済みでも『契約を管理』から Customer Portal に入れる」は PlanCard の実装と違う
- 重大度: S3 (記録と実装の不一致。加えて Stripe の unpaid / incomplete の人が Customer Portal に届かず、規約 第5条の5「解約とお支払い方法の変更は『契約を管理』から」が成り立たない) / 種別: 証跡の不備・整合
- 対象: docs/verify/legal/04_round-4-fix.md L17「設定の『契約を管理』は解約済みでも Customer Portal (履歴を見られる) のまま」、app/_libs/billingProviderOf.ts:20「解約済みの人も "stripe" になる (Customer Portal で履歴を見られる)」、app/[userId]/settings/PlanCard.tsx:41-42・114-130
- 何が問題か: viewOf は `isPlus` が false で planStatus が canceled / expired なら action "start" (「契約切れ」「再開する」)、それ以外の非 plus は「未加入」で action "start"。「契約を管理」は action "manage" (isPlus) のときしか描かれない (:101)。したがって Stripe 解約済みの人は Customer Portal に入れず、Web では「アルコプラスは iPhone アプリではじめられます」(:128) だけが出る。fix 記録と billingProviderOf.ts の理由づけは事実でない。実害は Stripe の status が unpaid (CR-L5-01 の設定) や incomplete の人: plan null → 「未加入」→ お支払い方法を直す入口 (Customer Portal) が無い。past_due は isPlus なので入れる。
- 根拠: PlanCard.tsx の該当行、settings/page.tsx:41-44 (isPlus = plus か trial)。
- 期待: 記録とコメントを事実に直す (「解約済みの人は resolveBillingProvider が "stripe" を返すが、PlanCard は manage を出さない」)。実装は、`provider === "stripe" && stripeSubscriptionId あり` の非 plus に「契約を管理」(Customer Portal) の小さな入口を残すか、少なくとも unpaid の人に出すかを決める。台帳に行を足す。

### S4

#### CR-L5-07 webhook の apple ガードは予備経路 (stripeCustomerId 未保存) で効かない
- 対象: app/api/stripe/webhook/route.ts:72-92
- 内容: ガードは `findFirst({ stripeCustomerId })` の結果だけを見る。customerId が User に保存されていない人 (checkout 前の保存失敗) は current が null でガードを抜け、:85-91 の `dbUserIdHint ?? sub.metadata.dbUserId` で id 指定の updateMany に進む。その人が Apple 契約者なら plan 4 列が Stripe の値で上書きされる。到達は「customerId の保存失敗 + Apple 契約 + Stripe の遅延イベント」の三重なので S4。直すなら予備経路でも `findUnique({ id: dbUserId, select: { billingProvider } })` を見る。

#### CR-L5-08 `/start?step=purchase` を手で開いた契約中の人 (Apple の identity あり) は自動購入が走る
- 対象: app/start/page.tsx:29 `!sp.step`、app/start/StartClient.tsx:195-207 (resume effect)
- 内容: step の免除は「Apple OAuth から戻る途中」を通すためだが、戻る時点の人は必ず free (契約中なら OAuth に行く前に redirect されている)。したがって免除は不要で、契約中の人が `?step=purchase` を付けて開くと resume effect が `doPurchase` を自動で呼ぶ。CR-L4-01 の反例が「URL + クエリ」に狭まっただけで残る。期待: step の有無にかかわらず eff !== "free" なら redirect (復元も同様: 契約中の人に復元は要らない)。

#### CR-L5-09 退会モーダルの Apple 注記の fallback (`provider == null && hasApple`) が、契約の無い Apple サインインの人に出る
- 対象: app/[userId]/settings/DeleteAccountModal.tsx:93
- 内容: billingNoteProvider が「契約の提供元が分からない」ときだけ null を返すのではなく、「Stripe 解約済み」「契約なし」でも null を返すようになった。Apple でサインインしただけの人 (購入をやめた人・Stripe 解約後に Apple でログインした人) に「Apple の契約は自動では止まりません」が出る。R4 空振り欄で完了メール側は resolveBillingProvider === "apple" で正しいと確認したが、モーダル側は fallback が残っている。逆に、Web で Stripe が生きたまま Apple も契約した人 (CR-L4-01 の反例・今後は /start ガードで稀) は "apple" だけが出て、退会で Stripe も解約される (retrieve → cancel) ことが伝わらない。期待: fallback を外し、provider を配列 (apple と stripe の両方) にして両方の注記を出せるようにする。

#### CR-L5-10 planGrant=internal のアカウントは /start に入れないので、審査用アカウントの「Sandbox 購入」は internal を付けない別アカウントで行う手順にする
- 対象: docs/legal/app-store-listing.md L95、メモリ project_billing_verify_manual_pending.md の 6 番 (admin 2 件に internal)
- 内容: /start ガードは internal を "plus" として redirect する。listing L95 は「審査用アカウントで Sandbox 購入を完了させる」と書くが、そのアカウントに internal が付いていると /start が開けず購入できない。手順に「審査用アカウントには internal を付けない」を 1 行足す。

#### CR-L5-11 特商法の「お問い合わせフォームから請求」は、送信にログインが要る
- 対象: app/components/legal/TokushohoContent.tsx:29-30、app/[userId]/support/contact/page.tsx:13 (getUserIdsFromParams)・gateText.ts:96 GATE_TEXT.contact「送信には登録かログインが必要です」
- 内容: 電話番号の省略規定は「請求により遅滞なく提供」が要件で、請求の経路として本文がメールとフォームの 2 つを挙げる。フォームは /guest/support/contact が 200 で開くが、送信はログインが要る (ゲートが出る)。App Store の製品ページから来た未登録の人はメールだけが使える。文の要件 (規則 第10条) はメールの経路で満たすので違反ではないが、「フォームからお願いします」がそのまま使えない人がいる。期待: 「メールアドレス、またはログイン後にサポート画面のお問い合わせフォーム」とするか、メールだけにする。法 11 条ただし書との整合は V5-9 で再確認した (問題なし)。

## 3. 裏取りした事実の表

| # | 主張 | 確認した実装・手段 | 結果 |
|---|---|---|---|
| V5-1 | /start ガードの redirect 先が URL 規約と合う | start/page.tsx:29 `/${user.id}` (Supabase UUID)。getUserIdsFromParams.ts:24・36 と app/page.tsx:10 が同じ UUID を URL に使う | 一致 |
| V5-2 | 購入直後・OAuth 戻り・trial・internal・anon の 5 通り | StartClient:171 `router.replace("/")`、:114 `dest = /start?step=…`、plan.ts:131 internal → plus・:137 trialing → trial、start/page.tsx:24 `!user.is_anonymous` | 壊れない。internal は手順の注意 (CR-L5-10)、step の免除は不要 (CR-L5-08) |
| V5-3 | retrieve → cancel の分岐 | requestAccountDeletion.ts:92-109。resource_missing (`err.code`) と "already canceled" 文言は続行、他は中断。live 以外はログのみ | 一致 (live 以外を残す副作用は CR-L5-01) |
| V5-4 | Stripe の unpaid / paused / canceled の挙動 | docs.stripe.com/billing/subscriptions/overview のステータス表を取得 (unpaid: invoices continue to generate, pay → active。paused: 請求書は作られない・再開可。canceled: 自動回収停止・終端) | CR-L5-01 の根拠 |
| V5-5 | webhook ガードが 4 経路に効く | route.ts:37/47/53 がすべて applySubscription → :72-76 | 主経路は一致。予備経路 :85-91 は効かない (CR-L5-07) |
| V5-6 | cron の not found 判定が auth-js の error と合う | node_modules/@supabase/auth-js/dist/main/lib/fetch.js:15 (`err.msg` を message に)・:66 (errorCode を code に)。GoTrueAdminApi.js:260-272 deleteUser は AuthError を `{ data, error }` で返す | 一致 ("User not found" に `/not\s*found/i` が当たる)。code 比較の方が堅い |
| V5-7 | billingNoteProvider の受け渡しと画面 | profile/page.tsx:28・39 → AccountInfo.tsx:269 → DeleteAccountModal.tsx:98。evidence/07_delete_stripe.jpg | 一致 |
| V5-8 | PlanCard の Stripe 注記 | PlanCard.tsx:107-108、evidence/08_settings_stripe.jpg | 一致 |
| V5-9 | 特商法 電話番号の省略規定と法 11 条ただし書 (再確認) | TokushohoContent.tsx:29「ご請求があった場合に、遅滞なく電子メールにてお知らせします」。法 11 条ただし書 → 規則 第10条 (請求により遅滞なく交付・提供する旨を広告に表示し、実際に提供する措置を講じている場合)。電子メールは「電磁的記録の提供」。名称 (【事業者名】:13) と住所 (【住所】:23) は残している (法人は省略不可) | 妥当。請求経路のフォームは要ログイン (CR-L5-11・S4) |
| V5-10 | apple モードの Web で Stripe 契約者が見るもの (B) | active: home planView "none" (page.tsx:821-831)・PlanCard「契約中」→ Customer Portal・Recorder unlimited。past_due: plan.ts:91 PAYING に含む → PlanCard「お支払いに問題があります」→ manage → Customer Portal・注記は Stripe 用。canceled: 帯「アルコプラスが終了しています」「再開する」→ /start → Web「iPhone アプリではじめられます」。unpaid: 「未加入」「はじめると使えます」→ 同上 (Portal に届かない・CR-L5-06) | active / past_due / canceled は文面と一致。unpaid は CR-L5-06 |
| V5-11 | vitest の件数 | `--reporter=verbose` で per-file 8 / 12 / 17 / 6、合計 43 | fix 記録の 14 / 7 / 22 と不一致 (CR-L5-03) |
| V5-12 | 「無料」の語 (C) | grep: UI の「最初の 2 週間は無料」8 か所すべて「はじめての方は」つき。StartClient は introEligible 判定下。help FAQ:126 も条件つき。「無料で登録」は GateSheet.tsx:9 と AccountMenu.tsx:40 のコメントのみ (UI 文字列ではない) | 違反なし |
| V5-13 | 括弧 (C) | 今回の新規文 PlanCard:108・LibraryClient:123・onboarding:686 の日本語直後に括弧なし。DeleteAccountModal:89「(録音・楽譜・解析結果・練習履歴)」は R3 (V3-16) で既存文として据え置き済み | 新規は違反なし |
| V5-14 | 台帳 02_cases.csv の更新 | wc -l 32 (ヘッダ + L-01〜L-31)。/start・PlanCard の Stripe 注記・retrieve の行なし。L-29 の対象列は 4 ファイルのまま | **不一致** (CR-L5-05) |
| V5-15 | CR-L4-06 の記録先 | project_teacher_embed_email_pending_tests.md:78-79 | 一致 |
| V5-16 | CR-L4-07 の記録先 | project_billing_verify_manual_pending.md 10 番 (11・12 も追加されている) | 一致 |
| V5-17 | 99_report v3 の記述 | L1 v3・L4 66 件・L12-13 retrieve と migration・L26 8 か所・L45 未実施に migration | 一致 (L35 の件数だけ CR-L5-03) |

## 4. 空振り (探したが問題が見つからなかったもの)

- /start の redirect と StartClient「購入を復元」の整合: 契約中の人は復元が要らないので redirect で問題ない。DB に写っていない Apple 契約者 (通知未達で expired) は eff free で /start に入れ、復元 → /api/apple/restore で結び直せる。別アカウントに結び済みは conflict の文言。破れなし。
- 復元後の遷移 `router.replace(onboarded ? "/" : "/onboarding")` と [userId]/layout.tsx:65-66 の契約済み → /onboarding: 同じ判定 (resolveEffectivePlan !== "free") で一貫。
- /start の redirect は `redirect()` を try の外で呼んでいる (NEXT_REDIRECT が握りつぶされない)。
- Stripe の past_due の文面: PlanCard「お支払いに問題があります。カード情報をご確認ください。このままだと採点が使えなくなります。」→ Customer Portal で更新できる。規約 第5条の4 は Apple の文だが Web の past_due も「提供を停止」ではなく維持 (PAYING に含む) で、文面より本人に有利な側。指摘にしない。
- webhook の順不同対策 (updated を retrieve で取り直す) と apple ガードの順序: ガードは retrieve 後・updateMany 前なので、取り直しの結果に関係なく apple の行を守る。
- applySubscription のテスト: route.ts 内の非公開関数で、subscriptionToUserFields (純関数) の外にある。「apple の行は上書きしない」のテストは無いが、書くには関数を切り出す必要がある。指摘にはしない (S4 の候補として記録)。
- cron の順序変更で Storage → Auth の間に失敗しても、User 行が残るので次回に再試行される。removeStorageFolder は空なら何もしない。
- cron の Apple 通知原文の 7 年削除 (新規追加行 :50-59): プライバシーポリシー第6条の年数と定数 APPLE_NOTIFICATION_RETENTION_YEARS = 7 が一致。失敗は握りつぶしだが集計の 1 項目なので妥当。
- billingNoteProvider の Apple 側: billingProvider "apple" なら planStatus に関係なく "apple" (expired でも注記が出る) → Apple は退会で止まらないので、期限切れでも注記が出る側に倒すのは正しい。
- retrieve の失敗 (Stripe 疎通不可・STRIPE_SECRET_KEY 未設定): getStripe() が throw → catch → already でない → 中断。listing L125 の「STRIPE env を残す」と整合。
- Terms 第5条の5 と PlanCard の Stripe 注記「退会すると、この契約は同時に解約されます」・help FAQ:109「Web で契約したアルコプラスは、退会と同時に解約されます」: 3 か所で同じ意味。
- LibraryClient の planModal は契約切れの人にも「はじめての方は」つきで出るので、無料期間が無い人に無料を約束していない。
- help/page.tsx:126-127「Web ブラウザで以前に契約した方は、設定の『契約を管理』から確認・解約できます」: active / past_due の人には成り立つ。解約済みの人には出ないが「解約できます」の対象ではない。指摘にしない (CR-L5-06 は unpaid の人)。
- 誤字脱字: 今回変更された文 (PlanCard:108・LibraryClient:123・onboarding:686・listing L128・99_report v3・04_round-4-fix) を通読。脱字なし。
- 撮影画像 17 枚のうち 07・08 を目視。他は開いていない。

## 5. 判定

**条件つき合格。**

理由: S1・S2 はゼロ。ラウンド 4 の 9 件は、実装側 7 件をコード・テスト実行・撮影画像で閉じ、CR-L4-04 は一部 (記述の不一致が 2 点残る)、CR-L4-07 は実機確認の箱に入った。

新規: S3 6 件 (CR-L5-01 退会時に unpaid / paused / incomplete を残す、02 Stripe 解約が Auth 削除より前で巻き戻せない、03 テスト件数の記録の不一致、04 listing「5 か所」と列挙 6 か所の矛盾、05 台帳の抜け 3 件が未対応、06 「解約済みでも契約を管理」が PlanCard の実装と違う) / S4 5 件 (07 webhook 予備経路のガード、08 step つき URL で自動購入、09 退会モーダルの Apple 注記の fallback、10 internal と Sandbox 購入の手順、11 特商法のフォーム請求は要ログイン)。

残件の一覧 (S3 以下):
- 今回: CR-L5-01〜11。
- 前ラウンドから: CR-L4-04 (一部・記述 2 点 = CR-L5-03/04 に統合)、CR-L4-07 (実機)、CR-L1-15 (見送り)、CR-L1-18 (Tetsuo)、CR-L2-09 (Tetsuo)、CR-L3-06 (据え置き)。

次に手を付けるなら: CR-L5-01 (終端以外は cancel・1 行 + テスト 1 本) と CR-L5-02 (cancel の位置か失敗時の文言)。この 2 つで退会と Stripe の火種は消える。証跡は CR-L5-03/04/05/06 をまとめて 1 回で直す (fix 記録に vitest の出力行を貼る・listing の数・台帳 3 行 + L-29・fix 記録 L17 の理由づけ)。
