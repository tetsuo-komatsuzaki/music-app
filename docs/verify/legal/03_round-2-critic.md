# 法務文面 4 点 ラウンド 2 批評 (critic)

- 日付: 2026-09-13
- 対象: 03_round-1-critic.md の 34 件 + 追記 1 件に対する 04_round-1-fix.md の修正、および Tetsuo の追加指示「画面への反映・適用範囲・修正が必要な箇所やデータ」の棚卸し (01_plan.md)
- 自分の手で読んだもの: app/components/legal/{TermsContent,PrivacyContent,TokushohoContent}.tsx、docs/legal/app-store-listing.md、app/_libs/plan.ts・planConstants.ts、app/actions/{requestAccountDeletion,updateNotificationPref,guestTry,getSignedUploadUrl}.ts、app/_libs/apple/appleRevoke.ts、app/api/cron/guest-cleanup/route.ts、vercel.json、prisma/schema.prisma (User.marketingOpt*・AppleNotification)、app/[userId]/settings/{page,SettingsClient,PlanCard,DeleteAccountModal}.tsx、app/[userId]/support/{page,tokushoho/page,help/page}.tsx、app/{terms,privacy,tokushoho}/page.tsx、app/login/page.tsx、app/signUp/page.tsx、app/start/{page,StartClient}.tsx、app/[userId]/layout.tsx、app/[userId]/{page,home}.tsx、app/[userId]/scores/[scoreId]/page.tsx (subGate)、app/components/guest/{GateSheet,GuestGate,gateText}.tsx、app/components/ArcoResultOverlay.tsx、app/components/Recorder.tsx (quota 表示行)、app/[userId]/_guest/GuestHome.tsx、app/onboarding/onboardingClient.tsx (Scr11D)・_lib/actions.ts、app/[userId]/profile/{page,AccountInfo}.tsx、app/[userId]/components/AccountMenu.tsx、app/[userId]/library/page.tsx (canUpload)、app/api/stripe/webhook/route.ts、public/lp/index.html (プライバシー節・フッター)、docs/verify/legal/{00_requirements,01_plan,02_cases.csv}、docs/verify/billing-iap/00_requirements.md (REQ-013/018/086)
- dev (http://localhost:3101・apple モード) で curl: /terms /privacy /tokushoho /login → 200。/support/help → 404。/guest/support/help → 200。/signUp → 200
- 【 】の空欄そのものは指摘しない。本番 DB は読み書きしていない。

## 0. 総評

ラウンド 1 の 34 件のうち 30 件は文面とコードで直ったことを確認して閉じた。残り 4 件は「意図的な見送り (CR-L1-15)」「Tetsuo の確認待ち (CR-L1-18)」「直し漏れの断片 (CR-L1-22 の LP・CR-L1-23 の添付欄)」で、いずれも S3 以下。文面 4 本は法的な骨格としては前回より格段に良い。

しかし追加指示「ありとあらゆる観点」で見ると、実装と文面の突き合わせに 3 つの穴が残っており、これが S2 になる。

1. App Store 製品ページの「サポート URL」https://arcodaviolin.com/support/help が実在しない (dev で 404・app/support ディレクトリ無し)。動くのは /guest/support/help。Apple は審査でサポート URL を開く。
2. 規約 第5条「契約者に提供」「恒久的な無料プランはありません」、第5条の4「請求が成立しなかった場合、その時点で提供を停止」に対し、実装は REQUIRE_SUBSCRIPTION = false のままなので、契約なし・契約切れのアカウントでも 1 日 8 回・10 分の採点が通る (plan.ts:64・296、getSignedUploadUrl.ts)。PlanCard「採点と基礎練が止まっています」、ホームの帯、曲画面のゲートも同じ理由で出ない。billing-iap の REQ-018 が「ローンチ日に true にする」と書いているが、法務側のローンチ前チェック (listing.md §4) にこの項目が無く、01_plan.md の突き合わせ表は「契約切れでも記録は閲覧可 → 一致」としか書いていない。
3. 退会時の Stripe 解約 (requestAccountDeletion.ts:94-100) は失敗しても退会を続ける。規約 第5条の5・第13条・特商法・退会モーダルの 4 か所が「退会と同時に解約され、以後の請求は発生しません」と約束しているのに、失敗経路では退会したユーザーの Stripe 契約が残り、本人には Customer Portal も無くなる。

加えて、検証台帳 02_cases.csv は 24 行すべて「結果」が空欄で、04 §3 が参照する 99_report は存在しない。実装者の「dev で表示を確認」は証跡無しなので、この批評では自分の curl で代替した。

## 1. ラウンド 1 指摘の閉じ判定

| ID | 重大度 | 判定 | 自分で確認した根拠 |
|---|---|---|---|
| CR-L1-01 | S1 | 閉じる | Terms 第4条「ユーザーの責めに帰すべき事由により」(L52)、第7・9・10・15・16条に「当社の故意または重過失による場合を除き」、第15・16条に「当社の責任の範囲は第17条によります」、第16条「やむを得ない場合を除き事前にお知らせしたうえで」(L237) |
| CR-L1-02 | S1 | 閉じる | 第17条 第2段落 (L250-251) が「過失 (重大な過失を除きます) による…直近 1 年間の料金の額を上限」+「故意または重大な過失による場合には、この上限は適用されません」の二文構成 |
| CR-L1-03 | S2 | 閉じる | Terms 第5条の2 第3段落 (L96-97)、Tokushoho「販売するもの」(L38)、listing 説明 (L32)、商品説明 (L80)。実装: plan.ts TRIAL_DAILY_GRADINGS=8 / SECONDS=600 / PRACTICE=5、library/page.tsx:75-76 canUpload は eff === "plus" のみ、getSignedUploadUrl.ts が kind score/practice で別枠に判定。学びレッスンは lessons/_components/LessonPlayer.tsx が Recorder を使い practicePerformance に入る。残る差は PlanCard「8 本」対 規約「8 回」の語 (CR-L2-12) |
| CR-L1-04 | S2 | 閉じる | SettingsClient.tsx:69-96 のスイッチ、updateNotificationPref.ts setMarketingOff (off → marketingOptOutAt、on → optOutAt null + optInAt 更新)、settings/page.tsx:59 の off 判定 `!marketingOptInAt || !!marketingOptOutAt` は「未同意 or 解除済み = オフ」で正しい。スイッチは marketingEmail がある人だけに出るが、同意した人は必ず onboarding/_lib/actions.ts:77 で marketingEmail が入るので到達できる。Privacy 4.・12.、Tokushoho「メールによるお知らせ」の文と一致 |
| CR-L1-05 | S2 | 閉じる | Privacy 9. (L122-123) が 28 条 1 項後段の基準適合体制に一本化、「みなし同意」の文は消えている、本人の求めに応じた情報提供の文あり |
| CR-L1-06 | S2 | 閉じる | 案 (a) を採用。listing.md L55-57 で EULA 欄空欄 = 標準 EULA と明記。Terms 第21条 (L284) に標準 EULA を補う関係、保守・サポート・保証・知財対応は当社 |
| CR-L1-07 | S2 | 閉じる | listing.md L111 がネイティブ機能 (ArcodaRecorder・StoreKit 2・Sign in with Apple・identifierForVendor) を主語にし web view は従 |
| CR-L1-08 | S2 | 閉じる | listing.md §4 ローンチ前チェックに ENABLE_ACCOUNT_DELETION・APPLE_* 4 変数・CRON_SECRET。Privacy 6. (L69) に失敗時の扱い「Apple ID の設定の『Apple でサインイン』から解除できます」(iOS の 設定 › Apple ID › サインインとセキュリティ › Apple でサインイン から利用停止できるので事実)。再試行を作らず文面で処理する判断は妥当 |
| CR-L1-09 | S2 | 閉じる | Terms 第5条 第2段落 (L64-66)、Tokushoho 特別な販売条件 (L110)。実装 StartClient.tsx linkApple は linkIdentity で「いまのアカウントに Apple を結ぶ」なので「同じアカウントでサインインしてから契約」の指示と整合 |
| CR-L1-10 | S2 | 閉じる | Terms 第5条の2 (L92-93)、Tokushoho 解約 (L82)、help/page.tsx:135 が「無料期間の終了の 24 時間前まで」。curl した /terms と /tokushoho の HTML にも同文を確認 |
| CR-L1-11 | S3 | 閉じる | Terms 第3条 (L44)・Privacy 6. (L73) が「『登録なしで 1 回ためす』を始めてから 30 日を過ぎた後、順次」。guestTry.ts:59 の guestExpiresAt = 作成時 + 30 日、cron は vercel.json「0 18 * * *」(UTC 18 = JST 3 時) と一致。Tokushoho L109 と FAQ L152 は起点を書かないが誤りではない |
| CR-L1-12 | S3 | 閉じる | Tokushoho L29-30。番号の但書は消え、問い合わせ手段は別文 |
| CR-L1-13 | S3 | 閉じる | Tokushoho 支払方法 (L67)・解約 (L86)。PlanCard.tsx:69-87 は provider === "stripe" で /api/stripe/portal を開く |
| CR-L1-14 | S3 | 閉じる | Tokushoho「メールによるお知らせ」節 (L117-122) |
| CR-L1-15 | S3 | 開いたまま (見送り・理由妥当) | /start 注記の延長は写経寸法の制約で見送り。特商法リンクは注記直下の法務行 (StartClient.tsx:294-298) にある。「Apple の購入シートが 12 条の 6 の最終確認画面か」は要確認のまま。S3 残件として記録 |
| CR-L1-16 | S3 | 閉じる | Privacy 1.「代表者: 【代表者氏名】」(L14)、12.「手数料はいただきません」(L148) |
| CR-L1-17 | S3 | 閉じる | Privacy 8. Vercel が「ホスティング・定期処理の実行」(L101)、13. がアクセスログの記述 (L158)、listing App プライバシーに「診断」無し (L65-71) |
| CR-L1-18 | S3 | 開いたまま (Tetsuo 確認待ち) | Privacy 8./9. は「本拠を置く事業者」に緩め Google Cloud に「東京リージョンで実行」を併記したが、「いずれもアメリカ合衆国に本拠」の断定 (L116) は契約主体の確認前。listing §4 に確認項目あり。S3 のまま |
| CR-L1-19 | S3 | 閉じる | Privacy 6. 第3段落 (L76) が 7 年保管・退会後も残る・個人と結びつけない。cron guest-cleanup route.ts:47-56 が createdAt < 7 年前 を deleteMany、schema に @@index([createdAt])。年数 7 は Tetsuo 判断項目として 04 §4 に記録済み |
| CR-L1-20 | S3 | 閉じる | Terms 第13条 (L208) |
| CR-L1-21 | S3 | 閉じる | Terms 第5条 第5段落 (L79-80) |
| CR-L1-22 | S3 | 一部閉じる | 4 文書は「アルコ (英語表記 Arcoda)」に統一、アプリ名の中黒も修正 (listing L8)。残: LP (public/lp/index.html:848)「Arcoda（アルコーダ）」と、退会完了メール件名「Arcoda 退会完了のお知らせ」。LP は Apple に渡すマーケティング URL なので CR-L2-09 に引き継ぐ |
| CR-L1-23 | S3 | 開いたまま (直し漏れ) | listing §2 L85 は 1206 × 2622 に直ったが、§3「添付」L118 に「(402 × 874)」が残る。同じ文書内で寸法が食い違う → CR-L2-08 |
| CR-L1-24 | S3 | 閉じる | キーワード (L44) から「チューナー」削除・「独学」追加 |
| CR-L1-25 | S3 | 閉じる (要確認は残置) | Terms 第5条 (L76)「App Store の購入画面に表示される金額が優先」。価格ポイントの実在確認は listing §4。ただし UI 側の固定価格は別問題 → CR-L2-05 |
| CR-L1-26 | S3 | 閉じる | Privacy 4. から「所在地の表示を整えた後」の文が消えている |
| CR-L1-27 | S3 | 閉じる | login/page.tsx:94-139 のメール・パスワードフォームは条件なしで描画、Google だけ `!(isAppleBilling() && native)` (L151)。listing L95・L113 がこれと一致 |
| CR-L1-28 | S3 | 閉じる | Privacy 14. (L169-170)・12. (L145) に保護者の Apple ID 前提と請求窓口 |
| CR-L1-29 | S4 | 閉じる | Tokushoho L110-111 に Apple ID 1 契約・ファミリー共有対象外・Apple ID 必須。「ひとつの Apple ID につき契約はひとつ」は 2 商品が同じサブスクリプショングループ (listing L87) なので事実 |
| CR-L1-30 | S4 | 閉じる | Terms 第14条 6 号 (L221) |
| CR-L1-31 | S4 | 閉じる | Terms 第19条 (L265-268) |
| CR-L1-32 | S4 | 閉じる | 規約 L293・ポリシー L17・L148 が「サポート画面にあるお問い合わせフォーム」。app/[userId]/support/contact/page.tsx 実在を ls で確認 |
| CR-L1-33 | S4 | 閉じる | Privacy 2. (L32) |
| CR-L1-34 | S4 | 閉じる | Terms 第2条 (L26)「第3条に定める」 |
| 追記 6. | — | 閉じる | Terms 第5条の5 (L139)・第13条 (L207)・Tokushoho L86 に「退会と同時に解約」。requestAccountDeletion.ts:109-111 の文字列リテラルは 1 行の "\n\n…" になっており構文上の問題なし。ただし解約失敗時の扱いは新規 CR-L2-03 |

閉じた: 30 / 一部: 1 (22) / 開いたまま: 3 (15・18・23)。

## 2. 新規指摘 (CR-L2-xx)

重大度: S1 法令違反または審査で確実に止まる・虚偽の公開文書 / S2 誤解を招き紛争や返金の火種・主要動線が破れる / S3 分かりにくい・不正確 / S4 改善提案
種別: 適合・完全性・価値・整合・証跡の不備・要件そのものへの疑義

### S2

#### CR-L2-01 App Store の「サポート URL」が実在しない
- 重大度: S2 (審査員が開いて 404 なら Guideline 1.5 で差し戻し。S1 に近い) / 種別: 整合・到達経路
- 対象: docs/legal/app-store-listing.md L47「サポート URL https://arcodaviolin.com/support/help」
- 何が問題か: ヘルプは app/[userId]/support/help/page.tsx にしか無く、app/support ディレクトリは存在しない。dev で `curl /support/help` → 404 (「support」が [userId] として解釈され resolveViewer で弾かれる)。ゲスト用の URL /guest/support/help は 200 で開く。01_plan.md の到達経路の表には「App Store Connect → 説明文に URL」の行があるが、サポート URL の実在確認が無い。02_cases.csv にも該当行が無い。
- 根拠: `ls app/support` → No such file。`curl -w %{http_code} http://localhost:3101/support/help` → 404。`/guest/support/help` → 200。App Store Review Guidelines 1.5 (Developer Information: サポート URL は機能する連絡手段であること・要確認)。
- 期待: listing のサポート URL を https://arcodaviolin.com/guest/support/help に直す (ゲスト閲覧で規約・ポリシー・特商法・お問い合わせにも辿れる)。または app/support/help を /guest/support/help へ redirect する page を置く。どちらでも、02_cases.csv に「listing の 5 つの URL (terms/privacy/tokushoho/support/lp) を curl して 200」の行を足す。

#### CR-L2-02 規約が約束する「契約者だけ・請求不成立で停止」が実装では発動していない
- 重大度: S2 (REQUIRE_SUBSCRIPTION を true にせずローンチすれば公開文書が事実と違う状態になるので S1 に上がる) / 種別: 整合・完全性
- 対象: TermsContent.tsx 第5条 L59-60「有料プラン『アルコプラス』の契約者に提供します…恒久的な無料プランはありません」、第5条の4 L126「請求が成立しなかった場合、当社はその時点でアルコプラスの提供を停止します」、PlanCard.tsx:41「採点と基礎練が止まっています」、home.tsx:237、gateText.ts resume、docs/legal/app-store-listing.md §4 (ローンチ前チェック)、docs/verify/legal/01_plan.md 突き合わせ表
- 何が問題か: plan.ts:64 `REQUIRE_SUBSCRIPTION = false`。getGradingQuota (plan.ts:296) の needsSubscription は `REQUIRE_SUBSCRIPTION && plan === "free" && …` なので常に false。plan === "free" (契約なし・expired・canceled) の人でも `allowed = used < 8 && secondsUsed < 600` で録音が通り (plan.ts:304-311)、getSignedUploadUrl.ts:85 の権威判定も同じ quota を見る。曲画面の契約ゲート (scores/[scoreId]/page.tsx:345 `quota?.needsSubscription ? subscriptionGate(...) : null`) もホームの「再開する」帯 (page.tsx:825 `eff === "free" && REQUIRE_SUBSCRIPTION`) も出ない。つまり Apple モードでも「購入をやめた Apple サインイン済みアカウント」「Web で Google ログインした新規アカウント」「契約切れの人」が 1 日 8 回・10 分の採点を使える。無料期間と同じ量が、期限なしに続く = 恒久的な無料プランが事実上ある。billing-iap REQ-018/086 は「ローンチ日に true にする。先に admin 2 件へ planGrant=internal」と手順を持っているが、法務側のローンチ前チェック (listing §4) にこの項目が無く、01_plan.md の突き合わせ表は「契約切れでも記録は閲覧可 → 一致」とだけ書いて「録音もできてしまう」ことに触れていない。
- 根拠: plan.ts:64・255・296・304-311、getSignedUploadUrl.ts:83-100、scores/[scoreId]/page.tsx:345・380、[userId]/page.tsx:822-828、billing-iap/00_requirements.md REQ-013・018・086。
- 期待: (1) listing §4 ローンチ前チェックに「plan.ts REQUIRE_SUBSCRIPTION = true に切り替え (先に admin 2 件へ planGrant=internal)。切り替えないと規約 第5条・第5条の4、PlanCard・ホーム帯・曲ゲートの文が事実でなくなる」を追加。(2) 01_plan.md 突き合わせ表に「契約なし・契約切れは録音不可 → 現在 false・ローンチ日に切替」の行を追加。(3) できれば REQUIRE_SUBSCRIPTION をコンパイル時定数から `isAppleBilling()` 連動または env に変え、apple モードでは自動で true にする (Stripe モードの既存開発アカウントに影響させない)。

#### CR-L2-03 退会時の Stripe 解約が失敗しても退会が完了し、本人に止める手段が残らない
- 重大度: S2 / 種別: 整合・価値
- 対象: app/actions/requestAccountDeletion.ts:92-100、TermsContent.tsx 第5条の5 L139「退会すると同時に当社が解約し、以後の請求は発生しません」、第13条 L207、TokushohoContent.tsx L86、DeleteAccountModal.tsx:97「退会と同時に解約されます」
- 何が問題か: `subscriptions.cancel` を try/catch で包み、失敗は console.error だけで退会を続ける。Stripe の一時障害・鍵の未設定 (getStripe() が投げる) ・ネットワーク失敗のいずれでも、Auth と DB は消え、Stripe の契約は生きたまま毎月請求される。退会後は Customer Portal に入れず (PlanCard は消えている)、本人は「以後の請求は発生しません」と 4 か所で読んでいるので請求に気づいた時点で紛争になる。Stripe 側の webhook (customer.subscription.deleted) は updateMany で 0 件更新に終わるだけで誰にも知らせない。コメント「退会後は本人が止める手段が無くなるため」は問題を正しく認識しているのに、失敗時に退会を止めていない。
- 根拠: requestAccountDeletion.ts:94-100 (catch → console.error → 続行)、webhook/route.ts:50-54・66-75。
- 期待: 解約が失敗したら退会を中断して `{ success: false, error: "契約の解約に失敗しました。時間をおいて再試行するか、先に『契約を管理』から解約してください" }` を返す (Stripe が「既に解約済み」を返した場合だけは続行してよい)。順序は現状どおり Auth 削除より前。あわせて Stripe モードで動く本番 (現状) にも影響するので、02_cases.csv に「Stripe 解約失敗 → 退会が止まる」の行を足す。

### S3

#### CR-L2-04 「設定画面から退会」「設定画面で表示名・メールアドレス・パスワードの変更」は実装ではプロフィール画面
- 重大度: S3 (審査メモ「Settings → 退会」を審査員が辿れないと 5.1.1(v) の確認で手戻り) / 種別: 整合
- 対象: TermsContent.tsx 第13条 L201「設定画面から退会することができます」、PrivacyContent.tsx 12. L144「設定画面からは、表示名・メールアドレス・パスワードの変更、お知らせメールの停止、および退会」、app-store-listing.md L108「Account deletion: Settings → 退会」、help/page.tsx:99「設定画面から、表示名・メールアドレス・パスワードを変更できます」
- 何が問題か: 退会ボタンと表示名・メール・パスワードの変更は app/[userId]/profile (AccountInfo.tsx:4「表示名・メールアドレス・パスワード・退会 をここに集約する」、page.tsx タイトル「プロフィール」) にあり、設定 (settings) にはプラン・お知らせメール・通知だけ。両者は AccountMenu.tsx:118・124 のアカウントメニューから別項目として入る。文面どおり「設定」を開いた親と審査員は退会を見つけられない。
- 期待: 文面を「プロフィール画面から退会」「プロフィール画面で表示名・メールアドレス・パスワードの変更、設定画面でお知らせメールの停止」に直す。listing の審査メモは「Account menu (avatar) → プロフィール → 退会」に。または退会をプロフィールから設定へ移す (文面 4 か所を変えなくてよい)。

#### CR-L2-05 UI の 6 か所に「月 1,280 円」「最初の 2 週間は無料」が固定で埋め込まれ、StoreKit 正・価格ポイント未確定・無料期間の資格判定と噛み合わない
- 重大度: S3 / 種別: 整合
- 対象: gateText.ts:30・38・47、Recorder.tsx:1055、home.tsx:237、PlanCard.tsx:122 (いずれも「最初の 2 週間は無料、その後 月 1,280 円」または「月 1,280 円・年 12,800 円」)、ArcoResultOverlay.tsx:265「はじめる手続き・最初の 2 週間は無料」
- 何が問題か: (a) PlanCard.tsx:5 自身のコメント「価格はここに書かない (StoreKit の値だけを /start で出す)」、plan.ts:47「iOS の価格は StoreKit が返す値を表示し、ここには書かない」、CR-L1-25 (価格ポイント未確定) と矛盾する。App Store Connect の価格ポイントが ¥1,280 と一致しなければ 6 か所が一斉に誤表示になる。(b) 「最初の 2 週間は無料」は、過去にその Apple ID で無料期間を使った人には事実でない。/start は StoreKit の introEligible で出し分けている (StartClient.tsx:254・287・291) が、これら 6 か所は出し分けなしで表示される。年額の価格は書かれず月額だけ、というのも 規約・特商法 (月・年 併記) と揃っていない。
- 期待: 「はじめての方は最初の 2 週間は無料」のように条件を文中に入れる (listing L32 と同じ書き方)。価格は「料金は はじめる画面で」に寄せるか、/start と同じく StoreKit の値を渡す。少なくとも価格ポイント確定後に 6 か所を一括で見直す行を listing §4 に足す。

#### CR-L2-06 ヘルプ FAQ に括弧 (R7 違反) と Apple 前提の一般化
- 重大度: S3 / 種別: 適合・価値
- 対象: app/[userId]/support/help/page.tsx:126「アルコプラス (月 1,280 円・年 12,800 円) です。最初の 2 週間は無料で、その後は選んだプランの料金が Apple ID に請求されます」
- 何が問題か: 00_requirements R7「UI 文言に括弧は使わない (法務文面の本文は例外)」に、今回足した FAQ 文が違反。同じ FAQ は Web の Stripe 既存契約者にも表示されるが「Apple ID に請求」「iPhone の設定 › サブスクリプションから解約」としか書かない (退会 FAQ L108-109 は Apple と Web を分けているのに、料金 FAQ は分けていない)。「無料」も条件なしの一文になっている。
- 期待: 「アルコプラスは月 1,280 円・年 12,800 円です。はじめての方は最初の 2 週間は無料で、その後は選んだプランの料金が Apple ID に請求されます。Web ブラウザで以前に契約した方は、設定の『契約を管理』から確認・解約できます。」

#### CR-L2-07 証跡の不備: 台帳の結果が全行空欄、参照先の報告が無い
- 重大度: S3 / 種別: 証跡の不備
- 対象: docs/verify/legal/02_cases.csv (L-01〜L-24 の「結果」列が全て空)、04_round-1-fix.md §3「dev サーバー (apple モード) で /terms・/tokushoho・/login の表示を確認 (結果は 99_report に記載)」
- 何が問題か: docs/verify/legal に 99_report は存在しない (ls: 00〜04 のみ)。実装者の表示確認・tsc・eslint の主張はすべて証跡無し。この批評では /terms /privacy /tokushoho /login を自分で curl して文面の反映を確認したので文面の側は担保できたが、tsc・eslint は未確認のまま。
- 期待: 02_cases.csv の結果列を埋め、99_report.md (curl の status・tsc の出力) を置く。加えて台帳に無い観点を足す: (1) listing の 5 URL の実在 (CR-L2-01)、(2) REQUIRE_SUBSCRIPTION と規約 第5条・第5条の4 の整合 (CR-L2-02)、(3) Stripe 解約失敗時の退会の挙動 (CR-L2-03)、(4) 「設定画面から退会」の到達 (CR-L2-04)、(5) UI の固定価格と StoreKit 正の整合 (CR-L2-05)、(6) R7 括弧の grep (CR-L2-06)。

#### CR-L2-08 listing 内で審査用スクリーンショットの寸法が食い違う
- 重大度: S3 / 種別: 整合 (CR-L1-23 の直し漏れ)
- 対象: docs/legal/app-store-listing.md L85「1206 × 2622」と L118「(402 × 874)」
- 期待: L118 を「1206 × 2622 (evidence/screens/apple_free_start.png の 3 倍書き出し)」に揃える。

#### CR-L2-09 マーケティング URL の LP がサービス名・運営者名・プライバシーの内容で本体と食い違う
- 重大度: S3 / 種別: 整合・価値
- 対象: public/lp/index.html:840-849 (「Arcoda（アルコーダ）｜運営者: 小松崎鉄雄」、待機リスト専用のプライバシーポリシー)、app-store-listing.md L50「マーケティング URL https://arcodaviolin.com/lp/」
- 何が問題か: App Store は「アルコ (Arcoda)」、LP は「アルコーダ」。LP には運営者の実名が公開され、本体の 4 文書は【事業者名】。LP のプライバシー節は「お預かりする情報はメールアドレスのみ」で、アプリのポリシー (/privacy) にリンクしていない。Apple に渡すマーケティング URL からアプリの規約・ポリシーに辿れない。04 §2 は「変更せず・Tetsuo 判断」としているが、判断材料として書き残す。
- 期待: 事業者名が決まった時点で LP の名称・運営者表記を揃え、フッターに /terms /privacy /tokushoho へのリンクを足す。LP 整備 (project_lp_waitlist_pending) の項目に含める。

### S4

#### CR-L2-10 退会モーダルの注記の分岐が「サインイン方法」で、「契約の提供元」ではない
- 対象: DeleteAccountModal.tsx:24・35・91-99 (hasApple = providers.includes("apple"))、settings/page.tsx は billingProvider を持っているのにモーダルへ渡していない
- 内容: Apple でサインインしたが契約は Web (Stripe) の人には「Apple の契約は自動では止まりません」だけが出て、Stripe 契約が退会と同時に解約されることは知らされない。逆にメールだけの人には「Web で契約中のアルコプラスがある場合は」と仮定形で出る。/start は Apple の identity を必ず結ぶので Apple 契約者は hasApple になり、主要経路は壊れていない。分岐を billingProvider (apple / stripe / null) にすると 3 通りを正確に出せる。

#### CR-L2-11 Apple トークンの失効を Auth 削除の前に行うので、Auth 削除が失敗して巻き戻った場合に連携だけ切れる
- 対象: requestAccountDeletion.ts:86-90 (revoke) → 102-129 (deletedAt → Auth 削除 → 失敗時 deletedAt を戻す)
- 内容: Auth 削除失敗で「何も壊れていない状態に戻す」と書いてあるが、Apple の refresh token は既に失効している。次回の Apple サインインで再連携されるなら実害は小さい。失効を Auth 削除の直後に移すか、失敗時の挙動をコメントに書く。

#### CR-L2-12 無料期間中の上限の語が画面と規約で違う
- 対象: PlanCard.tsx:37「1 日 8 本・10 分まで」、Recorder の「今日の採点 N/8回」、規約 第5条の2「1 日 8 回」
- 内容: 「本」と「回」が混在。規約・特商法・listing・Recorder が「回」なので PlanCard を「回」に。PlanCard の無料期間の文に基礎練 5 回と楽譜取り込み不可が無いのは簡潔さの範囲で可。

#### CR-L2-13 免責・変更条項の細部
- 対象: TermsContent.tsx 第17条 第1段落 (L247)、PrivacyContent.tsx 15. (L177)
- 内容: 第17条 第1段落の「明示的にも黙示的にも保証するものではありません」は単独で読むと契約不適合責任の全部免除に見える。「ただし当社の責任は次項によります」を足すと第2段落の上限規定と一体に読める。ポリシー 15. の「掲載した時点から効力」は規約 第19条 (効力発生日を定めて周知) と書き方を揃えてよい。

#### CR-L2-14 ローンチ前チェックに Stripe 既存契約者の管理経路が無い
- 対象: app-store-listing.md §4、PlanCard.tsx:54・69-87、settings/page.tsx:63 (billingEnabled = isBillingConfigured())
- 内容: Web の Stripe 契約者が残る間は STRIPE_* の env と /api/stripe/portal を生かしておく必要がある (消すと「契約を管理」がエラーになり 特商法 L86・規約 第5条の5 が事実でなくなる)。§4 に 1 行足す。

#### CR-L2-15 オンボーディング SCR-11d の同意文からポリシーに辿れない
- 対象: onboardingClient.tsx Scr11D「受け取る・いつでもやめられる」「メールはお便り以外に使いません」
- 内容: 同意の取り方としては足りているが、ポリシー 4. で約束した「設定画面のスイッチで停止」を「設定でいつでも止められる」と書き、/privacy へのリンクを 1 つ置くと、同意の記録 (marketingOptInAt) の根拠が強くなる。

#### CR-L2-16 退会完了メールの表記
- 対象: requestAccountDeletion.ts:175-181
- 内容: 件名・本文が「Arcoda」のみ (CR-L1-22 の統一が及んでいない)。本文に括弧「(Supabase の自動バックアップには…)」があるが、メールは UI 文言の規則の対象外と判断。「アルコ (Arcoda)」への統一だけ提案。

## 3. 裏取りした事実の表

| # | 文面の主張 | 確認した実装 | 結果 |
|---|---|---|---|
| V2-1 | 無料期間中は採点 1 日 8 回・10 分、基礎練と学びレッスン 1 日 5 回 (規約 5 条の 2・特商法) | plan.ts TRIAL_DAILY_GRADINGS=8・SECONDS=600・PRACTICE_GRADINGS=5、getSignedUploadUrl.ts:85-100 が kind ごとに判定。学びレッスンは LessonPlayer.tsx が Recorder を使い practicePerformance に入る | 一致 |
| V2-2 | 自分の楽譜の取り込みは請求開始後 | library/page.tsx:75-76 canUpload = resolveEffectivePlan(...) === "plus" (trial は不可) | 一致 |
| V2-3 | お知らせメールは設定のスイッチで停止できる (ポリシー 4.・12.、特商法) | SettingsClient.tsx:69-96、setMarketingOff、off 判定 `!optInAt || !!optOutAt`、同意者は必ず marketingEmail を持つ (onboarding actions.ts:77) | 一致 |
| V2-4 | Apple の通知原文は 7 年で削除 (ポリシー 6.) | cron route.ts:47-56 deleteMany createdAt < 7 年前、vercel.json で毎日 UTC 18:00 = JST 3:00、schema @@index([createdAt]) | 一致 |
| V2-5 | ゲストの記録は「1 回ためす」開始から 30 日後に順次削除 | guestTry.ts:59 guestExpiresAt = now + GUEST_RETENTION_DAYS(30)、cron が lt now で削除 | 一致 |
| V2-6 | Web の Stripe 契約は退会と同時に解約 | requestAccountDeletion.ts:94-100 subscriptions.cancel (即時) | 成功時は一致・失敗時は不一致 (CR-L2-03) |
| V2-7 | 退会で Apple トークンを失効、届かなければ Apple ID の設定から解除できる | appleRevoke.ts (env 4 つ + refreshToken が無いと false)、requestAccountDeletion.ts:87-90 は false でも続行 | 一致 (文面が失敗時を書いている) |
| V2-8 | 契約は購入時のアカウントに結びつき移せない。Web 登録者は同じアカウントでサインインしてから契約 | StartClient.tsx linkApple は linkIdentity、doPurchase の conflict トースト | 一致 |
| V2-9 | iPhone では新規登録は Apple でサインインのみ。既存アカウントはメール・パスワードでもログイン可 (listing) | login/page.tsx: フォーム常時、Apple は isAppleBilling()、Google は !(apple && native) | 一致 |
| V2-10 | ログイン画面に規約・ポリシーの同意文 | curl /login の HTML に「つづけると」と href="/terms" href="/privacy" 各 1 | 一致 |
| V2-11 | /start の法務行に 3 リンク、サポート一覧に特商法 | StartClient.tsx:294-298、support/page.tsx:37-42、support/tokushoho/page.tsx、/guest/support/tokushoho → 200 | 一致 |
| V2-12 | ひとつの Apple ID につき契約はひとつ・ファミリー共有対象外 | 2 商品が同じグループ (listing L83・L87)・ファミリー共有オフは App Store Connect 側の設定 (project_apple_store_setup_pending) | 一致 (設定は Tetsuo の実行待ち) |
| V2-13 | 契約者に提供・請求不成立で停止 (規約 5 条・5 条の 4) | plan.ts REQUIRE_SUBSCRIPTION=false → plan "free" でも 8 回まで採点可 | 不一致 (CR-L2-02) |
| V2-14 | 設定画面から退会 (規約 13 条・ポリシー 12.・listing) | 退会は profile/AccountInfo.tsx、settings には無い | 不一致 (CR-L2-04) |
| V2-15 | サポート URL https://arcodaviolin.com/support/help (listing) | app/support 無し、curl 404。/guest/support/help は 200 | 不一致 (CR-L2-01) |
| V2-16 | 先生ロールは billing を渡さない | settings/page.tsx:62 `role === "teacher" ? undefined : {...}`。先生に Apple 契約があっても iPhone の設定から解約できるので規約 5 条の 3「…からも」の書き方は成立 | 一致 |
| V2-17 | Web ブラウザでは新規契約を受け付けない (規約 5 条の 5・特商法) | signUp/page.tsx:102-116 (apple かつ非ネイティブは App Store 案内・ネイティブは /start へ)、PlanCard stripe モードは「準備中」、StartClient !appleHere は App Store 案内 | 一致 |
| V2-18 | 「無料」の語は条件つき一文のみ (R7) | 4 文書は「最初の 2 週間は無料」「無料期間」「無料トライアル」のみ。UI は gateText/Recorder/home/PlanCard/ArcoResultOverlay/FAQ に「最初の 2 週間は無料」(条件語なし) | 文書は一致・UI は CR-L2-05・06 |

## 4. 空振り (探したが問題が見つからなかったもの)

- GateSheet.tsx:9 のコメント「無料で登録 (主・紺)」: コメントだけで、実際のボタン文言は「はじめる」「登録する」「iPhone アプリで登録」「登録なしで 1 回ためす」。文言違反なし (コメントは古い)。
- GuestHome.tsx: 「無料」の語なし。ボタンは「はじめる」「登録なしで 1 回ためす」「iPhone アプリで登録」「登録して始める」。
- 退会モーダル・設定のスイッチ・サポート一覧・ログイン同意文・特商法サポート項目: 新規に足した UI 文言に括弧なし (退会モーダル L87 の括弧は既存文)。
- Scr11D: optIn 初期 false、「あとで」で mailEmail null・mailOptIn false。同意なしに marketingOptInAt が入る経路なし。
- settings/page.tsx の off 判定: 未同意 (optInAt null) の人にスイッチがオフで出る → オンにすると setMarketingOff(false) が optInAt を書く。同意の記録として成立。
- Stripe webhook customer.subscription.deleted: 退会済みユーザーの通知は updateMany 0 件で 200 を返し、例外にならない。
- 越境移転の記述 (ポリシー 9.): 28 条 1 項後段への一本化は文として成立。国名は CR-L1-18 のまま。
- AppleNotification の cron 削除が User の cascade と衝突しないこと: User と relation なし。
- 規約 第5条の3「設定画面の『契約を管理』」: PlanCard は settings にあり一致 (退会とは別)。
- 規約 第3条「Apple でサインイン」の取得情報 (識別子・氏名初回・非公開メール): ポリシー 2. と一致。
- listing の「利用規約 / プライバシー / 特商法」3 URL: /terms /privacy /tokushoho すべて 200。マーケティング URL /lp/ は 308 で /lp/index.html へ。
- 学びレッスンの採点が practicePerformance に入ること: LessonPlayer.tsx が Recorder を使用 (深追いはしていない)。

## 5. 判定

不合格。

理由: S2 が 3 件 (CR-L2-01 サポート URL の 404、CR-L2-02 契約必須のペイウォールが未発動で規約 第5条・第5条の4 と不一致、CR-L2-03 Stripe 解約失敗時に退会が完了して請求だけ残る)。S3 が 6 件 (CR-L2-04〜09)、S4 が 7 件 (CR-L2-10〜16)。

ラウンド 1 の 34 件は 30 件を閉じ、3 件 (15・18・23) と 1 件の一部 (22) が S3 以下で残る。文面 4 本そのものは、CR-L2-04 (退会の場所) と CR-L2-05 (UI の固定価格) を直せば法的な骨格は通る。次のラウンドで S2 の 3 件を直し、02_cases.csv の結果列を埋めて 99_report を置けば、CR-L1-15・18 と CR-L2-09 (Tetsuo 判断) を残した条件つき合格にできる。

直し方の目安:
- CR-L2-01: listing 1 行の修正 (/guest/support/help) または redirect ページ 1 枚。
- CR-L2-02: listing §4 と 01_plan.md への追記が最低線。REQUIRE_SUBSCRIPTION を apple モード連動にできればより安全。
- CR-L2-03: requestAccountDeletion.ts の catch を「退会を中断して error を返す」に変える 5 行程度。
