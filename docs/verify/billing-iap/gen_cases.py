# -*- coding: utf-8 -*-
"""02_cases.csv を軸の掛け合わせで機械的に作る (verify-loop 段3)。
列: TC-ID / 軸 / REQ / 前提の状態 / 操作 / 期待する結果 / 判定のしかた / 自動か手動か / 実測 / 証跡 / 判定
実測・証跡・判定は段4 で埋める。J 軸は grep の実測から行を起こす。"""
import csv, io, os, re, subprocess, sys
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".."))
rows = []
def add(axis, req, pre, op, exp, judge, mode):
    rows.append([axis, req, pre, op, exp, judge, mode])

# ---------- A 正常系 (要件 1 件に 1 本) ----------
A = [
 ("REQ-001","apple モードの全画面","grep '無料で登録|無料プラン|はじめは無料|無料でためす' app","0 件。許される形は「最初の 2 週間は無料、その後 月 1,280 円」だけ","grep の出力","自動"),
 ("REQ-002","殻+apple","GateSheet・PlanCard・LibraryClient・signUp を描画","「Web のアルコダから」「ブラウザで購入」の文言が無い。Web への購入リンクが無い","grep + 描画","自動"),
 ("REQ-003","apple モード","/api/stripe/checkout への遷移経路を grep","onboardingClient は isAppleBilling で迂回。PlanCard に Stripe ボタン無し。stripe モードでは従来の checkout が残る","grep","自動"),
 ("REQ-004","殻+apple / Web+apple","/login と /signUp を描画","殻: Apple のみ・signUp は /start へ。Web: Apple + Google・signUp は App Store 案内","playwright","自動"),
 ("REQ-005","差分の全 tsx","grep '（|）|\\(' を新規文言に","画面文言に括弧 0 件 (コードのコメントは除く)","grep","自動"),
 ("REQ-010","role=guest の検証ユーザー","getGradingQuota(dbUserId)","limit 1・practiceAllowed false・needsSubscription false・isGuest true。Performance 1 件後は allowed false","scripts で実行","半自動"),
 ("REQ-011","ゲスト匿名","/<uuid>/practice/... と /<uuid>/lessons を直リンク","/guest/... へ redirect (layout の許可正規表現は /scores/<id> だけ)","playwright + 読解","半自動"),
 ("REQ-012","ゲスト使用済み (Performance 1 件)","ためした曲を開く / 別の曲を開く","ためした曲: 録音ボタンが畳まれ「N 点を残してつづける」。別の曲: ゲート songUsed「続けるには、はじめる手続きが必要です」","playwright","半自動"),
 ("REQ-013","REQUIRE_SUBSCRIPTION=true・plan=free の検証ユーザー","曲を開く・録音画面","needsSubscription true。Recorder に「アルコプラスが終了しています・再開する」→ /start","読解 + 描画","半自動"),
 ("REQ-014","planStatus=trialing","getGradingQuota","limit 8・secondsLimit 600・practiceLimit 5","vitest 既存","自動"),
 ("REQ-015","plan=plus active","getGradingQuota・library/page canUpload","unlimited true・canUpload true。free/expired は false","読解 + 既存 test","自動"),
 ("REQ-016","expired の通知を適用","applyTransaction","Performance の削除処理が無い。planStatus だけ expired","読解","読解"),
 ("REQ-017","planGrant=internal・plan=free","resolveEffectivePlan","\"plus\"。planGrant を書く経路が admin 以外に無い","vitest + grep","自動"),
 ("REQ-018","現在の plan.ts","REQUIRE_SUBSCRIPTION の値","false (未ローンチ)。true にする前の admin 2 件の planGrant 付与手順が 99_report に載る","読解 + DB","半自動"),
 ("REQ-019","teacherLink あり・plan free","getGradingQuota","unlimited true","既存 test","自動"),
 ("REQ-020","各通知種の tx/renewal","derivePlanStatus","表どおり: 導入オファー→trialing・請求あり→active・BillingRetry→expired・expiresDate 過去→expired・revocationDate→expired","vitest (新規)","自動"),
 ("REQ-021","同じ notificationUUID を 2 回","POST /api/apple/notifications","2 回目は {ok:true,duplicate:true}。User は 1 回しか更新されない","curl + DB (署名が通らないため UUID 重複は処理済み行を DB に用意して確認)","半自動"),
 ("REQ-022","壊れた JWS・x5c 無し・自前 CA","POST /api/apple/notifications","すべて 400 {error:invalid signature}。AppleNotification に行が増えない","curl + DB","自動"),
 ("REQ-023","bundleId 違い・productId 違いの tx","applyTransaction","reason bundle / unknown_product。User 不変","scripts","自動"),
 ("REQ-024","ログイン済み検証ユーザー","POST /api/apple/verify","未認証 401・jws 無し 400・壊れた jws 400。token 不一致 403 (署名が通らないため読解)","curl + 読解","半自動"),
 ("REQ-025","owner 無し / 本人 / 別人 / 権利なし","applyTransaction(forUserId)","結ぶ / 更新 / conflict / (restore route) none","scripts (DB)","半自動"),
 ("REQ-026","同じ appleOriginalTransactionId を 2 ユーザーに書く","prisma.user.update","2 件目が unique 違反で失敗","scripts","自動"),
 ("REQ-027","isInBillingRetryPeriod=true → その後 DID_RENEW","derivePlanStatus を 2 回","expired → active","vitest","自動"),
 ("REQ-028","appAccountToken 無し・未結びの通知","notifications route","200 {ok:true, applied:false, reason:no_user}","読解","読解"),
 ("REQ-030","匿名セッション・未使用の端末キー","ensureGuestUser(key)","User role=guest・guestExpiresAt=+30 日・name ゲスト。ログイン中の人には error","scripts + 読解","半自動"),
 ("REQ-031","deviceKey.ts","grep getDeviceKey の利用箇所","guestTryClient と StartClient だけ。殻は ArcodaStore.deviceKey・Web は localStorage","grep","自動"),
 ("REQ-032","git diff f12bdfb3","music-analyzer と getSignedUploadUrl の差分","解析器 0 行。getSignedUploadUrl は文言 2 行のみ","git diff","自動"),
 ("REQ-033","/auth/callback に apple provider の user","読解","role guest→student・guestDeviceKey null・guestExpiresAt null・name=Apple 氏名。行が無ければ作る。refresh token を保存","読解","読解"),
 ("REQ-034","期限切れの検証ゲスト","GET /api/cron/guest-cleanup Bearer 一致","{ok, candidates:1, removed:1}。User・Performance・Auth が消える。Bearer 無し/違い → 401","curl + DB","半自動"),
 ("REQ-035","同じ端末キーで 2 回目の匿名ユーザー","ensureGuestUser","used:true・行は作らない","scripts","半自動"),
 ("REQ-036","guestEvents.ts","型の定義と記録箇所","9 種が型にあり、StartClient・guestTryClient が記録する","grep","自動"),
 ("REQ-037","匿名ゲストの cookie","/<uuid>・/<uuid>/library・/<uuid>/settings・/<uuid>/karte","すべて /guest/... へ redirect。/<uuid>/scores/<id> は 200","playwright","半自動"),
 ("REQ-040","殻+apple・未使用","/guest → CTA → /guest/library?try=1","CTA「登録なしで 1 回ためす」。帯「登録なしで 1 回だけためせます。曲をえらんでください」","playwright","自動"),
 ("REQ-041","Web+apple","/guest と /signUp","CTA「iPhone アプリで登録」+「App Store で「アルコ」をダウンロード」。/signUp は App Store 案内・フォーム無し","playwright","自動"),
 ("REQ-042","殻+apple・未使用 / 使用済み","曲を開く","未使用: 「登録なしで 1 回ためす」「はじめる」「ログイン」。使用済み: 「はじめる」「ログイン」「あとで」。「Apple で続ける」が無い","playwright","自動"),
 ("REQ-043","quota.needsSubscription=true","Recorder 描画","「アルコプラスが終了しています」「採点と基礎練が止まっています。記録は残っています」「再開する」→ /start","描画 (quota 偽装)","半自動"),
 ("REQ-044","guestTrial=true","ArcoResultOverlay","「この N 点を残してつづける」→ /start・「残さない場合は右上の × で閉じる」。シェア・カルテ無し","playwright ハーネス","自動"),
 ("REQ-045","quota.isGuest && used>=limit","Recorder 描画","「N 点を残してつづける」ピル + 「ためせるのは 1 回。次からはアルコプラスで」。帯無し","描画","半自動"),
 ("REQ-046","購入成功 / ゲスト / 購入キャンセル","購入後の遷移・layout","成功→ / → 未完了なら /onboarding。guest は /onboarding に行かない。契約なし (キャンセル) は /onboarding に行かない → ★実装を確認","読解 + playwright","半自動"),
 ("REQ-047","オンボ SCR02","次へ","SCR02B「なんて呼べばいい？」→ 入力 → SCR03。completeOnboarding が User.name を書く","playwright + 読解","半自動"),
 ("REQ-048","オンボ SCR11C","次へ","SCR11D。同意は未チェック既定。空で次へ可。あとで可。marketingEmail・marketingOptInAt を書く (同意時のみ)","playwright + 読解","半自動"),
 ("REQ-049","殻+apple","/start","モック v3 と画素一致 (済・29 px)。× 無し。出口は購入を復元・ゲストにもどる","playwright","自動"),
 ("REQ-050","StartClient・PlanCard","grep '1,280|1280|12,800|12800|980'","価格の数値は説明文の条件つき一文 (PlanCard 未加入の注記・gateText) だけ。表示価格は displayPrice","grep","自動"),
 ("REQ-051","偽ブリッジ introEligible:false","/start","見出し下「選んだプランの料金で、今日から再開できます。」。注記に「無料」無し","playwright","自動"),
 ("REQ-052","hasApple=true","CTA","linkApple を経ずに purchase","読解","読解"),
 ("REQ-053","偽ブリッジ getProducts reject","/start","価格欄 hidden・「価格を読み込めませんでした。」「もう一度」。CTA disabled","playwright","自動"),
 ("REQ-054","7 状態","PlanCard ハーネス","文言 7 種が照合報告どおり。Web: 「契約を管理」が account.apple.com。980 無し","playwright + grep","自動"),
 ("REQ-055","殻+apple","/login","Apple ボタンあり・Google 無し・メールフォームあり","playwright","自動"),
 ("REQ-056","apple / stripe × native true/false","canShowBillingEntryPoint","apple: native。stripe: !native","vitest (新規)","自動"),
 ("REQ-057","TEACHER_FEATURE_ENABLED=false","home.tsx","TeacherAssignments を描画しない","grep + 読解","自動"),
 ("REQ-058","trialing・periodEnd +12 日","ホーム・Recorder","チップ「無料期間はあと 12 日」。quotaLine「今日の採点 N/8回 ・ あと M 分」","描画 + 読解","半自動"),
 ("REQ-059","expired","ホーム","バナー「アルコプラスが終了しています」+「再開する」→ /start","読解","読解"),
 ("REQ-060","偽ブリッジ restore none / ok","/start 購入を復元","none: トースト「この Apple アカウントに契約はありません」。ok: ダイアログ → / か /onboarding","playwright (セッション要)","半自動"),
 ("REQ-061","verify が 500","doPurchase","「反映しています…」→「確認できませんでした。購入を復元をお試しください」","読解","読解"),
 ("REQ-062","Apple のみの user","退会モーダル","注記あり・確認語「退会」。requestAccountDeletion: revokeAppleToken を呼ぶ","ハーネス + 読解","半自動"),
 ("REQ-063","結果を閉じたあと","grep laterMode=bar の使用","GateSheet の帯モードを結果後に使っていない","grep","自動"),
 ("REQ-064","PlanCard","契約を管理","showManageSubscriptions (殻) / account.apple.com (Web)。変更画面は無い","grep","自動"),
 ("REQ-070","本番 DB","information_schema","列 12 と unique 2 がある","scripts","自動"),
 ("REQ-071","本番 DB","AppleNotification","表と unique がある","scripts","自動"),
 ("REQ-072","completeOnboarding","読解","name・marketingEmail・marketingOptInAt を User に書く","読解","読解"),
 ("REQ-073","新列 null の既存ユーザー 38 件","/ と /settings を描画","落ちない。PlanCard は従来表示","playwright (本番 or dev 既存ユーザー)","半自動"),
 ("REQ-074","planConstants と Swift","grep","製品 ID 2 つと bundle ID が一致","grep","自動"),
 ("REQ-080","OAuth から戻らない","/start","DB 不変・/start のまま","読解","読解"),
 ("REQ-081","purchase cancel","/start","トースト「購入をやめました。いつでも再開できます」。role student・plan free のまま","偽ブリッジ + 読解","半自動"),
 ("REQ-082","別人に結び済みの otx","applyTransaction(forUserId)","conflict","scripts","半自動"),
 ("REQ-083","未サインインで購入を復元","onRestore","ensureSession → linkApple(restore) → 戻りで doRestore","読解","読解"),
 ("REQ-084","verify 失敗","doPurchase","「購入を復元をお試しください」","読解","読解"),
 ("REQ-085","/start","ゲストにもどる","/guest へ。ゲストの used は不変","playwright","自動"),
 ("REQ-086","RESTRICTION_START=null","resolveEffectivePlan","猶予経路は未発動。apple モードでの猶予は無い","読解","読解"),
 ("REQ-090","同意未チェックでメール入力","completeOnboarding","marketingEmail は書く・marketingOptInAt は書かない ★要確認","読解","読解"),
 ("REQ-091","app/","grep 'broadcast|sendBatch'","配信コード 0 件","grep","自動"),
 ("REQ-100","package.json・appleStore.ts","grep","@capacitor/core 無し。nativePromise 経由","grep","自動"),
 ("REQ-101","purchase の引数","読解","appAccountToken=authUserId。Swift は UUID でなければ reject","読解","読解"),
 ("REQ-102","ArcodaStorePlugin.swift","load()","Transaction.updates を finish","読解","読解"),
]
for req, pre, op, exp, judge, mode in A:
    add("A 正常系", req, pre, op, exp, judge, mode)

# ---------- B 状態 × 画面 ----------
STATES = ["ゲスト未使用","ゲスト使用済み","契約なしアカウント","無料期間中","契約中","更新しない予定","契約切れ・返金後","運営 planGrant"]
SCREENS = ["ホーム／ゲストホーム","ライブラリ","曲詳細のゲート","録音画面","採点結果","設定のプランカード","/start","/login","基礎練","カルテ"]
EXP = {
 ("ゲスト未使用","ホーム／ゲストホーム"): "ゲストホーム。CTA「登録なしで 1 回ためす」",
 ("ゲスト未使用","ライブラリ"): "公式曲だけ。?try=1 で帯",
 ("ゲスト未使用","曲詳細のゲート"): "songTry の文言。主ボタン「登録なしで 1 回ためす」",
 ("ゲスト未使用","録音画面"): "(匿名ユーザー作成後) 録音ボタンあり。1 行「登録なしでためせるのは 1 回」",
 ("ゲスト未使用","採点結果"): "下段「この N 点を残してつづける」のみ",
 ("ゲスト未使用","設定のプランカード"): "設定は開けない (/guest へ戻す)",
 ("ゲスト未使用","/start"): "プラン画面。CTA で匿名→Apple サインイン→購入",
 ("ゲスト未使用","/login"): "Apple ボタン (殻)。ログインすれば自分の URL へ",
 ("ゲスト未使用","基礎練"): "一覧は見える。開くとゲート item",
 ("ゲスト未使用","カルテ"): "見本。ゲート karte",
 ("ゲスト使用済み","ホーム／ゲストホーム"): "「さっきの N 点を残しておこう」+「はじめる」",
 ("ゲスト使用済み","ライブラリ"): "公式曲だけ。帯は出ない (used なので try 不可)",
 ("ゲスト使用済み","曲詳細のゲート"): "songUsed「続けるには、はじめる手続きが必要です」「さっきの N 点」",
 ("ゲスト使用済み","録音画面"): "ためした曲: 録音ボタン畳み「N 点を残してつづける」",
 ("ゲスト使用済み","採点結果"): "同上 (結果は再表示可)",
 ("ゲスト使用済み","設定のプランカード"): "開けない",
 ("ゲスト使用済み","/start"): "プラン画面 (導入オファー対象)",
 ("ゲスト使用済み","/login"): "Apple ボタン",
 ("ゲスト使用済み","基礎練"): "ゲート",
 ("ゲスト使用済み","カルテ"): "ゲート",
 ("契約なしアカウント","ホーム／ゲストホーム"): "REQUIRE_SUBSCRIPTION=true なら契約切れと同じ帯「再開する」。false (現在) なら通常ホーム ★フラグ依存",
 ("契約なしアカウント","ライブラリ"): "一覧。取り込みボタン無し",
 ("契約なしアカウント","曲詳細のゲート"): "REQUIRE_SUBSCRIPTION=true: ゲート resume「再開する」→ /start",
 ("契約なしアカウント","録音画面"): "needsSubscription: 「アルコプラスが終了しています・再開する」",
 ("契約なしアカウント","採点結果"): "過去の結果は読める",
 ("契約なしアカウント","設定のプランカード"): "未加入「アルコプラスをはじめる」+ 注記",
 ("契約なしアカウント","/start"): "hasApple なら購入シートだけ。導入オファーは Apple ID 次第",
 ("契約なしアカウント","/login"): "n/a (ログイン済み) → / へ",
 ("契約なしアカウント","基礎練"): "practiceAllowed false",
 ("契約なしアカウント","カルテ"): "閲覧可 (AMB-006)",
 ("無料期間中","ホーム／ゲストホーム"): "チップ「無料期間はあと N 日」",
 ("無料期間中","ライブラリ"): "一覧。取り込みは不可 (canUpload false)",
 ("無料期間中","曲詳細のゲート"): "ゲート無し",
 ("無料期間中","録音画面"): "1 行「今日の採点 N/8回 ・ あと M 分」。上限で「今日の採点はここまで」",
 ("無料期間中","採点結果"): "通常 (シェア・カルテあり)",
 ("無料期間中","設定のプランカード"): "「無料期間中」+ 期日 + 契約を管理",
 ("無料期間中","/start"): "来ない導線。直リンクで開けば購入シート (Apple が既契約と言う)",
 ("無料期間中","/login"): "/ へ",
 ("無料期間中","基礎練"): "1 日 5 本",
 ("無料期間中","カルテ"): "通常",
 ("契約中","ホーム／ゲストホーム"): "通常。チップ無し",
 ("契約中","ライブラリ"): "取り込み可",
 ("契約中","曲詳細のゲート"): "無し",
 ("契約中","録音画面"): "無制限。1 行無し",
 ("契約中","採点結果"): "通常",
 ("契約中","設定のプランカード"): "「契約中」+ 次回更新日 + 契約を管理",
 ("契約中","/start"): "来ない導線",
 ("契約中","/login"): "/ へ",
 ("契約中","基礎練"): "無制限",
 ("契約中","カルテ"): "通常",
 ("更新しない予定","ホーム／ゲストホーム"): "通常",
 ("更新しない予定","ライブラリ"): "取り込み可 (期末まで)",
 ("更新しない予定","曲詳細のゲート"): "無し",
 ("更新しない予定","録音画面"): "無制限",
 ("更新しない予定","採点結果"): "通常",
 ("更新しない予定","設定のプランカード"): "「更新しない予定」+「〜まで使えます」",
 ("更新しない予定","/start"): "来ない導線",
 ("更新しない予定","/login"): "/ へ",
 ("更新しない予定","基礎練"): "無制限",
 ("更新しない予定","カルテ"): "通常",
 ("契約切れ・返金後","ホーム／ゲストホーム"): "帯「アルコプラスが終了しています」「再開する」",
 ("契約切れ・返金後","ライブラリ"): "一覧。取り込み不可",
 ("契約切れ・返金後","曲詳細のゲート"): "ゲート resume「再開する」→ /start (REQUIRE_SUBSCRIPTION=true 時)",
 ("契約切れ・返金後","録音画面"): "「アルコプラスが終了しています・再開する」",
 ("契約切れ・返金後","採点結果"): "過去の結果は読める",
 ("契約切れ・返金後","設定のプランカード"): "「契約切れ」+「再開する」。注記無し",
 ("契約切れ・返金後","/start"): "導入オファー対象外なら無料の行無し。購入シートだけ",
 ("契約切れ・返金後","/login"): "/ へ",
 ("契約切れ・返金後","基礎練"): "ゲート／practiceAllowed false",
 ("契約切れ・返金後","カルテ"): "閲覧可 (AMB-006)",
 ("運営 planGrant","ホーム／ゲストホーム"): "通常。チップ無し",
 ("運営 planGrant","ライブラリ"): "取り込み可",
 ("運営 planGrant","曲詳細のゲート"): "無し",
 ("運営 planGrant","録音画面"): "無制限",
 ("運営 planGrant","採点結果"): "通常",
 ("運営 planGrant","設定のプランカード"): "「運営」+「運営用のアカウントです」。ボタン無し",
 ("運営 planGrant","/start"): "来ない導線",
 ("運営 planGrant","/login"): "/ へ",
 ("運営 planGrant","基礎練"): "無制限",
 ("運営 planGrant","カルテ"): "通常",
}
for s in STATES:
    for sc in SCREENS:
        e = EXP[(s, sc)]
        mode = "自動" if sc in ("/start","/login","設定のプランカード","曲詳細のゲート") and s.startswith("ゲスト") else "半自動"
        add("B 状態×画面", "REQ-010..019,040..064", f"状態={s}", f"{sc} を開く", e, "playwright / ハーネス / 読解", mode)
EDGES = [
 ("ゲスト未使用→使用済み","1 回ためして採点完了","Performance 1 件。quota.used=1・allowed false","REQ-010"),
 ("ゲスト→アカウント","/start で Apple サインイン (匿名に identity 結合)","role student・guestDeviceKey null・同じ UUID","REQ-033"),
 ("アカウント→無料期間中","購入シート確定 → /api/apple/verify (offerType 1)","planStatus trialing・plan plus・billingProvider apple","REQ-024"),
 ("無料期間中→契約中","DID_RENEW 通知 (請求あり)","active・periodEnd 更新","REQ-020"),
 ("契約中→契約中","DID_RENEW","periodEnd 更新","REQ-020"),
 ("契約中→契約切れ","DID_FAIL_TO_RENEW (isInBillingRetryPeriod)","expired 即時","REQ-027"),
 ("契約中→契約切れ","EXPIRED","expired","REQ-020"),
 ("契約中→契約切れ","REFUND (revocationDate)","expired。記録は残る","REQ-016"),
 ("契約中→更新しない予定","DID_CHANGE_RENEWAL_STATUS autoRenewStatus 0","planStatus 不変・appleAutoRenew false","REQ-020"),
 ("契約切れ→契約中","再開: 購入 (導入オファー無し) → verify","active (offerType 無し)","REQ-051"),
 ("通知 SUBSCRIBED INITIAL_BUY","derivePlanStatus","trialing (offerType 1) / active","REQ-020"),
 ("通知 SUBSCRIBED RESUBSCRIBE","derivePlanStatus","active","REQ-020"),
 ("通知 DID_CHANGE_RENEWAL_PREF (年額↔月額)","applyTransaction","appleProductId 更新・状態不変","REQ-064"),
 ("通知 GRACE_PERIOD_EXPIRED","derivePlanStatus","expired","REQ-020"),
 ("通知 REVOKE","derivePlanStatus","expired","REQ-020"),
 ("通知 OFFER_REDEEMED","applyTransaction","状態は tx から (active/trialing)","REQ-020"),
 ("通知 TEST (App Store Connect の疎通)","notifications route","data 無し → 400 no transaction。AppleNotification に行は残る ★Apple の TEST 通知に 400 を返してよいか","REQ-028"),
]
for name, op, exp, req in EDGES:
    add("B' 遷移の辺", req, f"辺={name}", op, exp, "vitest / scripts / 読解", "半自動")

# ---------- C 入力 ----------
INPUTS = {
 "ニックネーム (SCR-02b)": ("REQ-047", "trim して User.name に。空なら次へ不可 (既定名のまま)。上限は既存の name と同じ"),
 "お便りメール (SCR-11d)": ("REQ-048", "空で進める。形式不正は次へ不可。marketingEmail に保存"),
 "同意チェック (SCR-11d)": ("REQ-048", "未チェック既定。チェック時のみ marketingOptInAt"),
 "退会の確認語": ("REQ-062", "「退会」完全一致だけ通す。前後空白は trim"),
 "端末キー (ensureGuestUser)": ("REQ-030", "^[A-Za-z0-9._:-]{8,128}$ 以外は error"),
 "appAccountToken (purchase)": ("REQ-101", "UUID 以外は Swift が reject。JS は authUserId をそのまま渡す"),
 "プラン選択 (/start)": ("REQ-049", "yearly/monthly の 2 値。?plan=month で月額を初期選択。それ以外は年額"),
}
OBS = ["空","空白のみ","最小 (1 文字)","最小未満 (0)","最大","最大超え","型違い (数値/配列)","負の値","ゼロ","極端に長い文 (10 万字)","改行入り","前後に空白","全角と半角","絵文字と多言語","記号と引用符 (' \" < > &)","同じ値の再投入","貼り付けでの一括入力","null/undefined"]
for name, (req, rule) in INPUTS.items():
    for o in OBS:
        add("C 入力", req, f"入力欄={name}", f"{o} を入れる", f"規則: {rule}。{o} で落ちない・保存値が規則どおり・XSS にならない", "playwright / scripts / 読解", "半自動")
APIS = {
 "signedPayload (/api/apple/notifications)": "REQ-022",
 "jws (/api/apple/verify)": "REQ-024",
 "jws 配列 (/api/apple/restore)": "REQ-025",
}
OBS2 = ["本文無し","空文字/空配列","型違い (数値)","壊れた JWS (ドット 1 つ)","x5c 無しのヘッダ","自前 CA で署名した JWS","巨大 (5 MB)","同じ値の重複"]
EXP2 = {"本文無し":"400","空文字/空配列":"400 (restore は {result:none})","型違い (数値)":"400","壊れた JWS (ドット 1 つ)":"400 invalid","x5c 無しのヘッダ":"400 invalid","自前 CA で署名した JWS":"400 invalid (root 不一致)","巨大 (5 MB)":"400 か 413。プロセスが落ちない","同じ値の重複":"冪等 (2 回目 duplicate / 状態不変)"}
for name, req in APIS.items():
    for o in OBS2:
        add("C' 構造化入力", req, f"API 本文={name}", f"{o} を POST", f"{EXP2[o]}。DB に不正な行が残らない", "curl + DB", "自動")

# ---------- D 遷移と中断 ----------
FLOWS = ["1 回ためす (ゲストホーム→ライブラリ→曲→録音→結果)","はじめる→購入 (/start→Apple サインイン→購入シート→反映)","購入を復元","オンボ SCR-02b / 11d","退会"]
INTS = ["戻る","進む","再読込","直リンクで途中から入る","二重タップ","連打","送信中に戻る","通信を切る","機内モード","電話や別アプリで中断","バックグラウンドから復帰","画面回転","横画面","タブを閉じる","長時間放置してから続ける"]
DEXP = {
 "1 回ためす": "used は 1 回だけ増える。二重に Performance ができない。途中で離れても再開できる",
 "はじめる→購入": "購入が二重に走らない (busy)。OAuth 戻りの ?step=purchase で続きから。キャンセルは 1 画面に戻る",
 "購入を復元": "復元が二重に走らない。結果のダイアログ/トーストが 1 回",
 "オンボ": "下書きが残り、再読込で同じ画面から。二重送信で User が壊れない",
 "退会": "submitting 中は閉じられない。二重クリックは 30 秒以内 success 扱い",
}
for f in FLOWS:
    key = f.split(" (")[0].split(" SCR")[0]
    for i in INTS:
        add("D 遷移と中断", "REQ-040..048,060,062,081", f"動線={f}", f"途中で「{i}」", DEXP[key], "playwright (通信断は route.abort) / 読解", "半自動")

# ---------- E 権限と所有 ----------
ROLES = ["未ログイン","ゲスト匿名 (role guest)","契約なしアカウント","無料期間中","契約中","期限切れ","返金後","管理者","先生","別人 (他人の UUID を URL に)"]
RES = ["他人の曲ページ /<他人uuid>/scores/<id>","録音のアップロード getSignedUploadUrl","POST /api/apple/verify","POST /api/apple/restore","GET /api/cron/guest-cleanup","GET /api/plan/usage","/onboarding","退会 requestAccountDeletion"]
def eexp(r, res):
    if res.startswith("GET /api/cron"): return "Bearer 無しは誰でも 401。役割で変わらない"
    if r == "未ログイン":
        return {"他人の曲ページ":"/guest/... か /login へ","録音":"未認証エラー","POST /api/apple/verify":"401","POST /api/apple/restore":"401","GET /api/plan/usage":"401","/onboarding":"/login へ","退会":"認証されていません"}[[k for k in ["他人の曲ページ","録音","POST /api/apple/verify","POST /api/apple/restore","GET /api/plan/usage","/onboarding","退会"] if res.startswith(k)][0]]
    if r.startswith("ゲスト匿名"):
        return {"他人の曲ページ":"/guest/scores/<id> へ redirect (自分の uuid 以外は不可)","録音":"1 回まで。2 回目は allowed false で拒否","POST /api/apple/verify":"認証は通る (匿名) → tx の appAccountToken が自分の UUID なら反映 ★匿名のまま契約が付く経路が無いか確認","POST /api/apple/restore":"同上","GET /api/plan/usage":"isGuest true","/onboarding":"layout が /guest へ (出さない)","退会":"email 無し → 「認証されていません」"}[[k for k in ["他人の曲ページ","録音","POST /api/apple/verify","POST /api/apple/restore","GET /api/plan/usage","/onboarding","退会"] if res.startswith(k)][0]]
    if r.startswith("別人"):
        return "他人の資源には触れない: 曲ページは自分の uuid に付け替え/404、verify/restore は自分の UUID にしか結ばない、退会は自分だけ"
    base = {"他人の曲ページ":"自分の URL へ付け替え (既存 layout)","録音":"状態どおり (契約中/無料期間中は可、期限切れ/返金後/契約なしは needsSubscription で拒否 ※REQUIRE_SUBSCRIPTION)","POST /api/apple/verify":"本人の UUID に結ぶ。token 不一致 403","POST /api/apple/restore":"本人に結ぶ／conflict","GET /api/plan/usage":"状態どおりの quota","/onboarding":"未完了なら出る。完了済みは / へ","退会":"本人確認 (パスワード or 退会)"}
    return base[[k for k in base if res.startswith(k)][0]]
for r in ROLES:
    for res in RES:
        add("E 権限と所有", "REQ-013,024,025,034,037,062", f"役割={r}", f"資源: {res}", eexp(r, res), "curl (cookie 差し替え) / playwright / 読解", "半自動")

# ---------- F 同時と競合 ----------
F = [
 ("2 つのタブで /start を開き両方で CTA","購入は 1 回。2 つ目は busy か Apple が既契約を返す","REQ-049"),
 ("2 端末で同じ Apple ID・同時に購入","Apple 側で 1 契約。後の verify は同じ otx で本人更新 (conflict でない)","REQ-025"),
 ("古い /start (価格取得前) から CTA","loadState!=ok なので押せない","REQ-053"),
 ("同じ通知 UUID が同時に 2 回届く","upsert + processedAt で 1 回だけ適用。片方は duplicate か同結果","REQ-021"),
 ("通知の順序逆転: EXPIRED の後に古い DID_RENEW","★applyTransaction は signedDate を見ない → 古い通知で active に戻る可能性。確認","REQ-020"),
 ("verify と通知が同時","両方同じ状態を書く。不整合なし","REQ-024"),
 ("同じ端末キーで 2 つの匿名ユーザーが同時に ensureGuestUser","unique で片方が used:true","REQ-035"),
 ("Cron が 2 本同時に走る","delete の競合は try/catch で握り、removed 数が二重にならない","REQ-034"),
 ("退会中に別タブで録音","退会後の書き込みは cascade で消える。エラーは握る","REQ-062"),
 ("オンボ SCR-11d を 2 タブで別の値で送信","後勝ち。User が壊れない","REQ-048"),
]
for op, exp, req in F:
    add("F 同時と競合", req, "2 系統の同時操作", op, exp, "scripts (Promise.all) / 読解", "半自動")

# ---------- G 時間 ----------
G = [
 ("planCurrentPeriodEnd の 1 秒前","resolveEffectivePlan","plus (trial/active)","REQ-014"),
 ("planCurrentPeriodEnd の 1 秒後 (通知未着)","resolveEffectivePlan","★通知が来るまで active のまま扱うか。期日で切るか確認","REQ-020"),
 ("無料期間の残り日数: 期日が今日の 23:59","ホームのチップ","「あと 1 日」(切り上げ)","REQ-058"),
 ("残り日数が負","チップ","「あと 0 日」(max 0)","REQ-058"),
 ("JST 0:00 をまたぐ採点","countDailyGradings","日付が変わって 0 から","REQ-014"),
 ("月末と月初の更新","periodEnd の表示","toLocaleDateString ja-JP が正しい日付 ★サーバー UTC とクライアント JST で日付がずれないか","REQ-054"),
 ("端末の時計が 1 日進んでいる","/start・ホーム","サーバー時刻で判定。表示だけ端末","REQ-058"),
 ("セッション失効後に CTA","ensureSession","authUserId は props → 失効なら purchase 後の verify が 401 → 「確認できませんでした」","REQ-024"),
 ("guestExpiresAt ちょうど","Cron","lt なので同時刻は残る。1 秒後に消える","REQ-034"),
 ("expiresDate が過去の tx を verify で受ける","applyTransaction","expired を書く (購入証明が古い)","REQ-020"),
 ("通知の signedDate が古い (再送)","notifications","UUID 同じなら duplicate。違えば適用 ★順序","REQ-021"),
 ("証明書の有効期限外の x5c","verifyChain","400 有効期限外","REQ-022"),
]
for pre, op, exp, req in G:
    add("G 時間", req, pre, op, exp, "vitest / scripts / 読解", "半自動")

# ---------- H データの形 ----------
H = [
 ("Performance 0 件のゲスト","getGuestTryState","used false・lastScore null","REQ-030"),
 ("Performance あり・accuracy null (解析中)","getGuestTryState / quota","used true・lastScore null。カード文言は「この採点を残してつづける」","REQ-045"),
 ("Performance 大量 (200 件) のゲスト","quota count","used>=1 で拒否。遅くない","REQ-010"),
 ("planStatus に想定外の値 (\"paused\")","resolveEffectivePlan / PlanCard","free 扱い・PlanCard は未加入表示 (落ちない)","REQ-073"),
 ("plan=\"plus\" planStatus=null","resolveEffectivePlan","free (既存 test)","REQ-073"),
 ("billingProvider=apple だが appleOriginalTransactionId null","PlanCard","表示は planStatus だけで決まる","REQ-054"),
 ("periodEnd null で trialing","ホームのチップ・PlanCard","チップ非表示 (periodEnd 必須)・PlanCard は日付なし文","REQ-058"),
 ("Apple 通知の data 無し (TEST)","notifications","400 no transaction・行は残る","REQ-028"),
 ("tx.appAccountToken が UUID でない文字列","applyTransaction","findUnique が null → no_user","REQ-028"),
 ("renewal だけ・tx 無し","notifications","400 no transaction","REQ-028"),
 ("AppleNotification.signedPayload が巨大","upsert","TEXT なので入る","REQ-021"),
 ("User.name が空文字 (Apple 氏名なし)","callback","「あなた」","AMB-004"),
 ("marketingEmail に大文字","completeOnboarding","そのまま保存 (正規化しない) ★仕様なし","REQ-090"),
 ("古い OnboardingProfile (nickname 無し) の下書き","store hydrate","既定値で埋まる・落ちない","REQ-047"),
]
for pre, op, exp, req in H:
    add("H データの形", req, pre, op, exp, "scripts / 読解", "半自動")

# ---------- I 外部の失敗 ----------
EXT = {
 "StoreKit getProducts": ("REQ-053","正常: 価格表示。失敗/timeout/不正: 価格を伏せ「読み込めませんでした」+「もう一度」。遅延: ローディングのまま CTA 不可"),
 "StoreKit purchase": ("REQ-081","ok: verify へ。cancel: トースト。pending: 「承認を待っています」。error: message をトースト。timeout: busy が解けない ★確認"),
 "StoreKit restore": ("REQ-060","ok: /api/apple/restore へ。none: トースト。error: message。timeout ★"),
 "Supabase 匿名サインイン": ("REQ-030","失敗: 「準備できませんでした。時間をおいてもう一度」。busy 解除"),
 "Apple OAuth (linkIdentity)": ("REQ-080","error/url 無し: 「Apple でのサインインを開けませんでした」。ブラウザが開けない: location.href で代替"),
 "自サーバー /api/apple/verify": ("REQ-061","4xx: 「確認できませんでした。購入を復元をお試しください」(409: 別アカウント)。5xx: 同上。timeout: ★fetch に timeout 無し"),
}
OUT = ["正常","4xx","5xx","タイムアウト","不正な本文","遅延 (5 秒)","部分的な成功"]
for name, (req, rule) in EXT.items():
    for o in OUT:
        add("I 外部の失敗", req, f"外部={name}", f"結果={o}", f"{rule}", "playwright 偽ブリッジ / route.fulfill / 読解", "半自動")

# ---------- J 回帰 (grep の実測から 1 箇所 1 本) ----------
SYMS = ["canShowBillingEntryPoint(","useCanShowBillingEntryPoint(","<GateSheet","GATE_TEXT","getGradingQuota(","resolveEffectivePlan(","isNativeApp()","useIsNativeApp()","isAppleBilling()","appStoreUrl()","getGuestTryState(","ensureGuestUser(","recordGuestEvent(","quota","planGrant","needsSubscription","isGuest","guestTrial","role === \"guest\"","requestAccountDeletion(","SCR11D","SCR02B"]
seen = set()
for s in SYMS:
    out = subprocess.run(["grep","-rn","--include=*.ts","--include=*.tsx","-F",s,"app","middleware.ts"], capture_output=True, text=True, encoding="utf-8", errors="replace").stdout
    for line in out.splitlines():
        if ".test." in line or "app/generated" in line: continue
        loc = ":".join(line.split(":")[:2])
        if (s, loc) in seen: continue
        seen.add((s, loc))
        add("J 回帰", "REQ-056 ほか", f"共有部品={s}", f"利用箇所 {loc} を読む/描画する", "変更後の型と値で従来どおり動く。stripe モード (本番の現状) で挙動が変わらない", "読解 + tsc + 描画", "読解")

# ---------- K 端末と表示 ----------
KS = ["ゲストホーム","ライブラリ (帯)","曲詳細のゲート","/start","/login","設定のプランカード","オンボ SCR-02b","オンボ SCR-11d"]
KV = ["幅 320","幅 402 (標準)","幅 430/768","文字を最大 (200%)","明るい表示と暗い表示"]
for sc in KS:
    for v in KV:
        add("K 端末と表示", "REQ-040..055", f"画面={sc}", f"{v} で撮る", "はみ出し・重なり・切れ無し。横スクロール無し。文言は折り返す", "playwright 撮影 + 目視", "半自動")

# ---------- L 使いやすさ ----------
LV = ["読み上げで意味が通る (aria/role/alt)","色だけに頼っていない","押せる範囲 44px 以上","キーボードだけで進める","焦点の行き先 (開いた時・閉じた時)"]
for sc in KS:
    for v in LV:
        add("L 使いやすさ", "REQ-049 ほか", f"画面={sc}", v, "満たす。満たさなければ S3", "playwright (axe 相当の DOM 検査) + 読解", "半自動")

# ---------- M 安全 ----------
M = [
 ("他人の UUID を appAccountToken に入れた偽の JWS","/api/apple/verify","署名で 400。署名が通っても token 不一致で 403","REQ-024"),
 ("他人の otx を restore","/api/apple/restore","conflict 409・付け替えない","REQ-025"),
 ("画面側だけの判定になっていないか: 録音の許可","getSignedUploadUrl","サーバーが quota で弾く (allowed/needsSubscription)","REQ-013"),
 ("ゲストの /<自分uuid>/settings 直叩き","layout","/guest/settings へ","REQ-037"),
 ("ゲストの retryAnalysis / 他 action","server actions","role guest でも呼べるものは 1 回ためしの範囲内か ★洗い出し","REQ-037"),
 ("CRON_SECRET 未設定","/api/cron","401 (空と一致させない)","REQ-034"),
 ("planGrant を自分で書く経路","grep","admin 以外に無い","REQ-017"),
 ("appleRefreshToken が画面や API に出ない","grep select","settings/page などの select に含まれない","REQ-062"),
 ("secrets がログに出ない","console.log の grep","jws 全文・refresh token を出していない","REQ-022"),
 ("notifications の回数上限","apiLimit","★未適用なら S4 (Apple からしか来ない前提)","REQ-021"),
 ("verify/restore の回数上限","apiLimit","★連打で DB 更新が増えるだけ。上限の有無","REQ-024"),
 ("匿名ユーザーの guestExpiresAt を伸ばす経路","grep","無い (Cron で必ず消える)","REQ-034"),
 ("Web の deviceKey (localStorage) 改ざん","ensureGuestUser","別キー = 別端末扱い (許容・§6)","REQ-035"),
 ("XSS: ニックネーム・メールに <script>","描画","エスケープされる (React)","REQ-047"),
]
for pre, op, exp, req in M:
    add("M 安全", req, pre, op, exp, "curl / grep / 読解", "半自動")

# ---------- N 通しの歩き ----------
PERS = ["はじめて触る大人の独学者","子ども","子どもの親","先生"]
NF = ["起動→1 回ためす→結果→はじめる→購入→オンボ→ホーム","契約切れ→再開する→購入→ホーム"]
for p in PERS:
    for f in NF:
        add("N 通しの歩き", "全体", f"ペルソナ={p}", f"動線: {f}", "迷う・損する・怖い・待たされる・だまされたと感じる瞬間を記録。あれば実装の不備 / 要件の不備に分ける", "playwright で歩く + 所見", "半自動")


# ---------- ラウンド 1 の指摘で足した行 ----------
R1 = [
 ("A 正常系","REQ-020b","cookie 無し (Apple / Vercel Cron)","POST /api/apple/notifications {} と GET /api/cron/guest-cleanup (Bearer 無し)","middleware の 401 (大文字 Unauthorized + WWW-Authenticate) ではなく route の応答 (400 signedPayload required / 401 小文字 unauthorized)","curl","自動"),
 ("B 状態×画面","REQ-037,040,085","匿名セッション (1 回ためし中)","/ ・ /guest ・ /guest/library ・ /guest/scores/<別の曲> を開く","すべて 200 で描ける。無限リダイレクトにならない (CR-1-02)","playwright (auth.users.is_anonymous=true の検証ゲスト)","自動"),
 ("B 状態×画面","REQ-046","契約なしのアカウント (購入キャンセル)・apple モード","ホームを開く","/onboarding へ送らない。ホームに「アルコプラスをはじめると、採点と基礎練が使えます」の帯 (REQUIRE_SUBSCRIPTION=true 時)","playwright + 読解","半自動"),
 ("B 状態×画面","REQ-046","契約なしのアカウント・stripe モード","ホームを開く","従来どおり未完了なら /onboarding (Stripe はオンボ→決済の順)","playwright","自動"),
 ("B 状態×画面","REQ-041,042","Web+apple・未ログイン","曲の詳細のゲート","「登録なしで 1 回ためす」は出ない。主ボタンは「iPhone アプリで登録」(AMB-005)","playwright","自動"),
 ("B 状態×画面","REQ-054","Web+apple・契約切れ","設定のプランカード","「契約切れ」+「アルコプラスは iPhone アプリではじめられます」(ボタン無し)","playwright","半自動"),
 ("B 状態×画面","REQ-055","Web+apple","/login","Apple + Google","playwright","自動"),
 ("B 状態×画面","REQ-049","Web+apple","/start","App Store の案内・購入不可","playwright","自動"),
 ("B 状態×画面","REQ-040","Web+apple","ゲストホーム","「iPhone アプリで登録」+「App Store で「アルコ」をダウンロード」","playwright","自動"),
 ("B 状態×画面","REQ-013","契約切れ・REQUIRE_SUBSCRIPTION=true","曲の詳細 / 教材の詳細 / レッスンの動画","ゲート「アルコプラスが終了しています」主ボタン「再開する」→ /start。あとで無し (CR-1-03)","playwright (定数を一時的に true)","半自動"),
 ("B 状態×画面","REQ-013","契約なし (一度も契約なし)・REQUIRE_SUBSCRIPTION=true","曲の詳細 / 教材 / レッスン / ホーム / 録音欄","ゲートと帯は「アルコプラスをはじめると、採点と基礎練が使えます」主ボタン「はじめる」(CR-1-10)","playwright","半自動"),
 ("B' 遷移の辺","REQ-020","DID_FAIL_TO_RENEW のあと本人が「再開する」を押す","StoreKit の購入 (既に所有している商品)","Apple のシートの挙動は Sandbox で確認 (人へ)。サーバーは verify で同じ otx を本人に更新","人へ","人へ"),
 ("H データの形","REQ-022","environment=Sandbox の通知が本番 URL に届く (審査時)","notifications","受け入れて反映する (appleEnvironment=Sandbox を書く)。本番の利用者と混ざらない","読解","読解"),
 ("E 権限と所有","REQ-024","先生 role","POST /api/apple/verify","先生にも plan が書ける。PlanCard は先生画面に無い → 人へ (先生の課金は別件)","読解","読解"),
 ("M 安全","REQ-037","x-pathname が無い (middleware を通らない経路)","匿名ゲストで /<uuid>/settings","path が空でも /guest へ送る (fail-closed・CR-1-21)","読解","読解"),
 ("J 回帰","REQ-003","stripe モード × 設定のプランカード × 未加入","/<uuid>/settings","「アルコプラスの新しいお申し込みは準備中です」。Stripe の checkout ボタンは出ない (決定: 導線を止める)。/start に送らない (CR-1-04)","playwright","自動"),
 ("J 回帰","REQ-003","stripe モード × /start","直リンク","「準備中」の案内。App Store の文言は出ない","playwright","自動"),
 ("J 回帰","REQ-017","resolveEffectivePlan の呼び出し 5 箇所","grep で planGrant を渡しているか","5 箇所すべて planGrant を渡す (CR-1-06)","grep","自動"),
 ("F 同時と競合","REQ-020","本人に結び済みより古い期末の別契約 (OTX-OLD) の遅い通知","applyTransaction","stale として捨てる。appleOriginalTransactionId は生きている契約のまま (CR-1-07 b)","scripts","自動"),
 ("A 正常系","REQ-036","purchase ok / cancel","GuestEvent","cancel のときだけ purchase_cancel。try_result は結果カード表示時 (CR-1-11)","読解 + 偽ブリッジ","半自動"),
 ("D 遷移と中断","REQ-052","/start?step=purchase を再読込","続き","1 回走ったら URL から step が消え、再読込で購入シートは出ない (CR-1-14)","playwright","半自動"),
 ("H データの形","REQ-033","Apple の氏名が無い昇格","callback","name が「ゲスト」なら「あなた」に (CR-1-16)","読解","読解"),
 ("M 安全","REQ-034","契約が付いたままの role=guest 行","Cron","消さない (billingProvider null かつ plan free だけ) (CR-1-17)","scripts","半自動"),
 ("H データの形","REQ-010","queued のまま 15 分以上残った Performance","ゲストの quota","数えない (取り直せる)。15 分以内は数える (CR-1-12)","scripts","半自動"),
]
for axis, req, pre, op, exp, judge, mode in R1:
    add(axis, req, pre, op, exp, judge, mode)


# ---------- ラウンド 3〜5 の修正に対応する行 ----------
R3 = [
 ("A 正常系","REQ-013","契約切れ・REQUIRE_SUBSCRIPTION=true","曲のゲートの主ボタンと出口","主ボタン「再開する」(ログインは出ない)。「ライブラリにもどる」で本人のライブラリへ (CR-2-01・CR-3-01)","playwright","半自動"),
 ("A 正常系","REQ-054","無料期間中","設定のプランカードの文言","「無料期間中は 1 日 8 本・10 分まで採点できます」(CR-3-02)","playwright","半自動"),
 ("A 正常系","REQ-049","ログイン済み・殻","/start の出口","「ホームにもどる」(CR-3-01)。Web も同じ。App Store の URL があっても戻るリンクを出す (CR-4-04・CR-5-04)","playwright","半自動"),
 ("I 外部の失敗","REQ-061","/start?step=purchase の続きで verify の通信が切れる","fetch を abort","1 秒以内に「通信できませんでした。電波のある場所で、購入を復元をお試しください」。?step= が消え CTA と復元が押せる (CR-4-01)。トーストは折り返して幅に収まる (CR-5-01)","playwright (批評者の手口 r5_D)","半自動"),
 ("I 外部の失敗","REQ-060","/api/apple/restore が 500 / 401","restore の続き","「確認できませんでした。時間をおいてもう一度」。restore_none を記録しない (CR-5-05)","読解 + playwright","半自動"),
 ("D 遷移と中断","REQ-049","購入成功後の着地前","CTA と「購入を復元」","着地まで disabled のまま。復元は薄く見える (CR-3-03・CR-4-05・CR-5-03)","playwright (r5_E)","半自動"),
 ("K 端末と表示","REQ-042","1 回ためしのゲート","「ログイン」の位置","中央寄せ (CR-4-02・CR-5-02)","playwright","半自動"),
 ("A 正常系","REQ-036","ログイン済みの契約ゲート","GuestEvent","gate_shown・gate_signup を記録しない (CR-3-04)","scripts (前後比較)","半自動"),
 ("A 正常系","REQ-013","契約切れ・レッスンの動画","ゲートの出口","「レッスンの一覧にもどる」→ /<uuid>/lessons (CR-4-03)","読解","読解"),
]
for axis, req, pre, op, exp, judge, mode in R3:
    add(axis, req, pre, op, exp, judge, mode)

# ---------- 書き出し ----------
with io.open("docs/verify/billing-iap/02_cases.csv", "w", encoding="utf-8", newline="") as f:
    w = csv.writer(f)
    w.writerow(["TC-ID","軸","REQ-ID","前提の状態","操作","期待する結果","判定のしかた","自動か手動か","実測","証跡","判定"])
    for i, r in enumerate(rows, 1):
        w.writerow([f"TC-{i:04d}"] + r + ["", "", ""])
from collections import Counter
c = Counter(r[0] for r in rows)
print("total", len(rows)); [print(f"  {k}: {v}") for k, v in c.items()]
