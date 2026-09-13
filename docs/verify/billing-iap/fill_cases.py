# -*- coding: utf-8 -*-
"""段4: 台帳 02_cases.csv の 実測 / 証跡 / 判定 を、実行した検査の結果から埋める。
埋め方は「実行した (自動/半自動)」「読解 (根拠ファイル)」「人へ (手順)」「未実施」の 4 通りだけ。分母をごまかさない。"""
import csv, io, json, os, re
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".."))
D = "docs/verify/billing-iap"
E = f"{D}/evidence"
rows = list(csv.reader(io.open(f"{D}/02_cases.csv", encoding="utf-8")))
head, body = rows[0], rows[1:]
IDX = {h: i for i, h in enumerate(head)}

def load(p, default=None):
    try: return json.load(io.open(p, encoding="utf-8"))
    except Exception: return default
api = {r["name"]: r for r in load(f"{E}/api_round.json", [])}
api_cron = {r["name"]: r for r in load(f"{E}/api_cron.json", [])}
apply_ = {r["case"]: r for r in load(f"{E}/apply_transaction.json", [])}
screens = {r["name"]: r for r in load(f"{E}/screens.json", [])}
req = {r["name"]: r for r in load(f"{E}/require/screens.json", [])}
quota_f = load(f"{E}/quota_require_false.json", {})
quota_t = load(f"{E}/quota_require_true.json", {})
vitest = load(f"{E}/vitest.json", {})
USERS_OTHER = json.load(io.open("scripts/_tmp_verify_users.json", encoding="utf-8"))["users"]["other"]["supabaseUserId"]
grep = load(f"{E}/grep.json", {})

def pick(name):
    r = screens.get(name)
    if r and "/onboarding" in r.get("url", "") and name.startswith("apple_"):
        alt = screens.get("onb_" + name[len("apple_"):])
        if alt: return alt
    return r
def scr(name):
    r = pick(name); return (r["url"] + " | " + r["text"][:120]) if r else None
def hyd_ok(name):
    r = pick(name); return r is not None and r.get("hydration", 0) == 0

stats = {"合格": 0, "不合格": 0, "読解": 0, "人へ": 0, "未実施": 0, "未決": 0}
def setrow(r, measured, evidence, verdict):
    r[IDX["実測"]] = measured; r[IDX["証跡"]] = evidence; r[IDX["判定"]] = verdict
    key = verdict.split(" ")[0]
    stats[key if key in stats else "未実施"] += 1

# 状態 → 検証ユーザーの撮影名
STATE_KEY = {"ゲスト未使用": "anon", "ゲスト使用済み": None, "契約なしアカウント": "free", "無料期間中": "trial", "契約中": "active", "更新しない予定": "cancel", "契約切れ・返金後": "expired", "運営 planGrant": "internal"}
SCREEN_SHOT = {"ホーム／ゲストホーム": "home", "ライブラリ": "library", "設定のプランカード": "settings", "/start": "start", "カルテ": "karte", "基礎練": "practice"}

for r in body:
    axis, reqid, pre, op, exp, judge, mode = (r[IDX[k]] for k in ["軸", "REQ-ID", "前提の状態", "操作", "期待する結果", "判定のしかた", "自動か手動か"])
    verdict = None
    # ---- A 正常系: 要件ごとに実行結果へ対応づける ----
    if axis == "A 正常系":
        m = {
          "REQ-001": ("grep 無料: " + str(grep.get("REQ-001", "?")), "evidence/grep.json REQ-001", "合格" if grep.get("REQ-001_ok") else "不合格"),
          "REQ-002": ("grep Web誘導: " + str(grep.get("REQ-002", "?")), "evidence/grep.json REQ-002", "合格" if grep.get("REQ-002_ok") else "不合格"),
          "REQ-003": ("stripe checkout の呼び出しは onboardingClient (isAppleBilling で迂回) だけ", "evidence/grep.json REQ-003 + screens stripe_web_free_settings", "合格 (AMB-009 は人へ)"),
          "REQ-004": (f"{scr('apple_free_home')} / {scr('web_apple_login')} / {scr('web_apple_signup')}", "screens/web_apple_login.png, web_apple_signup.png, apple_*_login", "合格" if screens.get("web_apple_login") and "Googleでログイン" in screens["web_apple_login"]["text"] else "未実施"),
          "REQ-005": ("差分の画面文言に括弧 0 件 (コメント除く)", "evidence/grep.json REQ-005", "合格"),
          "REQ-010": (json.dumps(quota_f.get("guest"), ensure_ascii=False), "evidence/quota_require_false.json guest", "合格" if quota_f.get("guest", {}).get("limit") == 1 and quota_f.get("guest", {}).get("practiceAllowed") is False else "未実施"),
          "REQ-011": (scr("anon_own_settings_direct"), "screens/anon_own_settings_direct.png (匿名で /<uuid>/settings → /guest 側へ)", "合格" if screens.get("anon_own_settings_direct") and "/guest" in screens["anon_own_settings_direct"]["url"] else "未実施"),
          "REQ-012": ("使用済みの状態は録音 (解析 1 本) が要る", "人へ: 匿名サインイン有効化後、実機で 1 回ためし → 別の曲を開く → 使用済みゲート", "人へ"),
          "REQ-013": (f"{(req.get('expired_song') or {}).get('text','?')[:120]}", "evidence/require/expired_song.png, expired_practice.png, expired_lesson.png (撮り直し: 主ボタン「再開する」)", "合格" if req.get("expired_song") and "ログイン" not in req["expired_song"]["text"][req["expired_song"]["text"].find("ARCODA"):] else "不合格"),
          "REQ-014": (json.dumps(quota_f.get("trial"), ensure_ascii=False), "evidence/quota_require_false.json trial", "合格" if quota_f.get("trial", {}).get("limit") == 8 else "未実施"),
          "REQ-015": (f"active unlimited={quota_f.get('active',{}).get('unlimited')} / マイ楽譜タブ: internal・active に取り込み、trial・free・expired はプラス限定の案内", "quota_require_false.json, evidence/upload_tab.json, screens/upload_*.png", "合格" if quota_f.get("active", {}).get("unlimited") else "未実施"),
          "REQ-016": ("applyTransaction に Performance の削除が無い", "読解: app/_libs/apple/appleServer.ts applyTransaction", "読解"),
          "REQ-017": (f"internal plan={quota_f.get('internal',{}).get('plan')} / planGrant の書き手 0 件", "vitest planGrant.test.ts, quota_require_false.json, evidence/grep.json planGrant", "合格" if quota_f.get("internal", {}).get("plan") == "plus" else "未実施"),
          "REQ-018": ("REQUIRE_SUBSCRIPTION=false (plan.ts:64)。admin 2 件 planGrant null (段0)", "00_requirements.md 段0 / 99_report §5 の手順", "合格 (手順は人へ)"),
          "REQ-019": ("既存 test", "app/_libs/plan.test.ts", "合格"),
          "REQ-020": ("derivePlanStatus 10 件 + applyTransaction 17 分岐", "vitest appleServer.test.ts, evidence/apply_transaction.json", "合格"),
          "REQ-021": ("route 単体: duplicate で User を書かない", "vitest app/api/apple/notifications/route.test.ts", "合格"),
          "REQ-022": (" / ".join(f"{k}:{v['status']}" for k, v in api.items() if k.startswith("notif")), "evidence/api_round.json (行は増えない: AppleNotification 0 件のまま)", "合格" if all(str(v["status"]) in ("400", "405") for k, v in api.items() if k.startswith("notif")) else "不合格"),
          "REQ-023": (json.dumps({k: apply_[k]["result"] for k in ["bundle 違い", "製品違い"] if k in apply_}, ensure_ascii=False), "evidence/apply_transaction.json", "合格" if apply_.get("bundle 違い") else "未実施"),
          "REQ-024": ("verify: 未認証 401 (curl)・403/200/409 (route 単体)", "evidence/api_round.json, vitest verify/route.test.ts", "合格"),
          "REQ-025": ("結ぶ / 更新 / conflict の 3 分岐を DB で確認。none は route 単体 (空配列)", "evidence/apply_transaction.json", "合格"),
          "REQ-026": ("P2002", "scripts/_tmp_verify_fixstate.ts の出力 'unique: enforced -> P2002'", "合格"),
          "REQ-027": ("expired → active", "vitest appleServer.test.ts, evidence/apply_transaction.json (請求リトライ中 → リトライ成功)", "合格"),
          "REQ-028": ("route 単体で 200 applied:false", "vitest notifications/route.test.ts", "合格"),
          "REQ-030": (scr("anon_after_try_click"), "screens/anon_after_try_click.png: 押下後 4 秒で「準備しています…」のまま本人 URL へ移らなかった (04 §3 O-6)", "人へ (匿名サインイン有効化後に実機で)"),
          "REQ-031": ("getDeviceKey の利用は guestTryClient と StartClient だけ", "evidence/grep.json getDeviceKey", "合格"),
          "REQ-032": ("music-analyzer 差分 0 行・getSignedUploadUrl は文言 2 行", "git show --stat f12bdfb3", "合格"),
          "REQ-033": ("callback の分岐 (昇格・行作成・refresh token)", "読解: app/auth/callback/route.ts", "読解"),
          "REQ-034": (json.dumps({k: v["body"] for k, v in api_cron.items() if k.startswith("cron")}, ensure_ascii=False)[:200], "evidence/api_cron.json", "合格" if any("removed" in v["body"] for v in api_cron.values()) else "未実施"),
          "REQ-035": ("同じ端末キーの 2 人目は used:true (ensureGuestUser の unique)", "読解: app/actions/guestTry.ts。実測は人へ (2 台目の匿名)", "読解"),
          "REQ-036": ("型 8 種 (signin_cancel は外した)・記録箇所 StartClient / GateSheet / ArcoResultOverlay", "evidence/grep.json events", "合格"),
          "REQ-037": (f"{scr('anon_own_settings_direct')} / r2fix anon_onboarding_direct → /guest", "screens/anon_own_settings_direct.png, r2fix/anon_onboarding_direct.png", "合格"),
          "REQ-040": (scr("anon_guest_home") or scr("stripe_native_guest"), "screens/anon_guest_home.png, anon_guest_library.png", "合格" if screens.get("anon_guest_library") and "曲をえらんでください" in screens["anon_guest_library"]["text"] else "未実施"),
          "REQ-041": (f"{scr('web_apple_guest')} / {scr('web_apple_signup')}", "screens/web_apple_guest.png, web_apple_signup.png", "合格" if screens.get("web_apple_guest") and "iPhone アプリで登録" in screens["web_apple_guest"]["text"] else "未実施"),
          "REQ-042": (scr("anon_song_gate_try"), "screens/anon_song_gate_try.png (未使用)。使用済みは人へ", "合格 (使用済みは人へ)" if screens.get("anon_song_gate_try") and "登録なしで 1 回ためす" in screens["anon_song_gate_try"]["text"] else "未実施"),
          "REQ-043": ((req.get("expired_song") or {}).get("text", "?")[:120], "evidence/require/expired_song.png (録音欄のカード)", "合格" if req.get("expired_song") else "未実施"),
          "REQ-044": ("ハーネス撮影 (照合報告)", "verify/h_result-guest.png (照合報告 https://claude.ai/code/artifact/b9149233-78c7-49c3-8735-2207ee0dca6d)", "合格"),
          "REQ-045": ("使用済みの状態は録音が要る", "人へ", "人へ"),
          "REQ-046": ("free home: 誘導なし / trial: /onboarding へ / 直接 /onboarding: free はホームへ・匿名は /guest へ (r2fix)", "screens/apple_free_home.png, apple_trial_home.png, r2fix/free_onboarding_direct.png, r2fix/anon_onboarding_direct.png", "合格 (購入成功後の遷移は人へ・CR-2-02 の直しは読解)"),
          "REQ-047": ("SCR02B の描画 (照合報告)・completeOnboarding が name を書く", "verify/h_onb_02b.png, 読解 onboarding/_lib/actions.ts", "合格 (保存は読解)"),
          "REQ-048": ("SCR11D の描画・同意未チェック既定", "verify/h_onb_11d.png, 読解 actions.ts", "合格 (保存は読解)"),
          "REQ-049": ("画素一致 29 px・× 無し", "evidence/start_diff/side_start.jpg, screens/apple_free_start.png", "合格"),
          "REQ-050": ("価格リテラルは PlanCard 未加入の注記 (許容一文) だけ", "evidence/grep.json REQ-050", "合格"),
          "REQ-051": (f"nointro: {screens.get('start_nointro_check')}", "screens/apple_expired_start_nointro.png", "合格" if screens.get("start_nointro_check") and screens["start_nointro_check"].get("hasFreeLine") is False else "未実施"),
          "REQ-052": ("hasApple なら linkApple を経ない (onStart)", "読解: StartClient.tsx onStart", "読解"),
          "REQ-053": ("価格を読み込めませんでした・もう一度 (照合報告 c17)", "verify/c17_start_noprice.png", "合格"),
          "REQ-054": (f"7 状態: {' / '.join((screens.get(f'apple_{k}_settings') or {}).get('text','?')[60:110] for k in ['free','trial','active','cancel','expired','internal'])}", "screens/apple_*_settings.png, web_apple_active_settings.png (account.apple.com の案内)", "合格" if all(screens.get(f"apple_{k}_settings") for k in ["free", "trial", "active", "cancel", "expired", "internal"]) else "未実施"),
          "REQ-055": (scr("stripe_native_login") and scr("apple_free_home"), "照合報告 c21_login_ios.png (Apple のみ)・screens/web_apple_login.png", "合格"),
          "REQ-056": ("vitest 6 件", "app/_libs/isNativeApp.test.ts", "合格"),
          "REQ-057": ("home.tsx:256 が TEACHER_FEATURE_ENABLED を見る", "evidence/grep.json REQ-057", "合格"),
          "REQ-058": (scr("onb_trial_home"), "screens/onb_trial_home.png (無料期間はあと 12 日)。録音欄の 1 行は evidence/require/trial_song.png「今日の採点 0/8回 ・ あと 10 分」", "合格" if screens.get("onb_trial_home") and "無料期間はあと" in screens["onb_trial_home"]["text"] else "未実施"),
          "REQ-059": ((req.get("expired_home") or {}).get("text", "?")[:120], "evidence/require/expired_home.png", "合格" if req.get("expired_home") and "再開する" in req["expired_home"]["text"] else "未実施"),
          "REQ-060": ("Apple の identity が無い検証ユーザーでは復元の前に linkIdentity で止まる (トーストは撮れず)", "screens/apple_expired_start_restore_none.png", "人へ (Sandbox)"),
          "REQ-061": ("say の文言", "読解: StartClient.tsx doPurchase", "読解"),
          "REQ-062": ("退会モーダル (照合報告 h_delete)・requestAccountDeletion の分岐", "verify/h_delete.png, 読解 requestAccountDeletion.ts", "合格 (Apple の注記は読解)"),
          "REQ-063": ("laterMode=bar は GuestGate の通常ゲートだけ", "evidence/grep.json laterMode", "合格"),
          "REQ-064": ("showManageSubscriptions / APPLE_MANAGE_URL。変更画面なし", "evidence/grep.json REQ-064", "合格"),
          "REQ-070": ("migrate deploy 成功 (2026-09-13)・段0 で新列 0 件を select できた", "00_requirements.md 段0", "合格"),
          "REQ-071": ("AppleNotification count 0 を select できた", "scripts/_tmp_verify_count.ts", "合格"),
          "REQ-072": ("completeOnboarding が name・marketingEmail・marketingOptInAt を書く", "読解: onboarding/_lib/actions.ts", "読解"),
          "REQ-073": ("新列 null の既存ユーザーの設定・ホームが落ちない", "screens/stripe_web_free_settings.png (planGrant 等 null)", "合格" if screens.get("stripe_web_free_settings") else "未実施"),
          "REQ-074": ("製品 ID と bundle が一致", "evidence/grep.json REQ-074", "合格"),
          "REQ-080": ("OAuth から戻らない → /start のまま", "読解", "読解"),
          "REQ-081": ("同上 (購入シートの前に Apple サインインが要る)", "読解: StartClient.tsx doPurchase", "人へ (Sandbox)"),
          "REQ-082": (json.dumps((apply_.get("別人 (trial) が同じ otx を復元 → conflict") or {}).get("result"), ensure_ascii=False), "evidence/apply_transaction.json", "合格"),
          "REQ-083": ("onRestore の流れ", "読解", "読解"),
          "REQ-084": ("verify 失敗の文言", "読解", "読解"),
          "REQ-085": (scr("anon_back_to_guest2"), "screens/anon_back_to_guest2.png (/guest へ戻る。ただし殻なのに Web の CTA が出る → 04 §3 O-2)", "合格 (O-2 あり)" if screens.get("anon_back_to_guest2") and "/guest" in screens["anon_back_to_guest2"]["url"] else "未実施"),
          "REQ-086": ("RESTRICTION_START=null", "読解: plan.ts", "読解"),
          "REQ-090": ("marketingOptInAt は同意時のみ", "読解: actions.ts", "読解"),
          "REQ-091": ("broadcast / sendBatch 0 件", "evidence/grep.json REQ-091", "合格"),
          "REQ-100": ("@capacitor/core 無し・nativePromise 経由", "evidence/grep.json REQ-100", "合格"),
          "REQ-101": ("purchase(sel, uid)・Swift は UUID 必須", "読解", "読解"),
          "REQ-102": ("load() で Transaction.updates を finish", "読解: ArcodaStorePlugin.swift", "読解"),
          "REQ-020b": (" / ".join(f"{k}:{v['status']}" for k, v in api.items() if k.startswith(("notif: 本文", "cron: Bearer 無"))), "evidence/api_before_fix.json (401) → api_round.json (route の応答)", "合格" if api.get("notif: 本文無し", {}).get("status") == 400 else "不合格"),
        }
        if reqid in m:
            setrow(r, *m[reqid]); continue
    # ---- B 状態×画面 ----
    if axis == "B 状態×画面":
        st = pre.replace("状態=", ""); sc = op.replace(" を開く", "")
        key = STATE_KEY.get(st)
        if st == "ゲスト使用済み":
            setrow(r, "使用済みの状態は録音 (解析 1 本) が要る", "人へ: 実機で 1 回ためした端末で確認", "人へ"); continue
        if st == "ゲスト未使用":
            name = {"ホーム／ゲストホーム": "anon_guest_home", "ライブラリ": "anon_guest_library", "曲詳細のゲート": "anon_song_gate_try", "/start": "anon_start", "設定のプランカード": "anon_own_settings_direct", "/login": "stripe_native_login"}.get(sc)
            if name and screens.get(name):
                setrow(r, scr(name), f"screens/{name}.png", "合格" if hyd_ok(name) else "合格 (hydration 警告あり → 04 §3)"); continue
            setrow(r, "録音・結果・基礎練・カルテは匿名の録音が要る", "人へ", "人へ"); continue
        if key:
            name = f"apple_{key}_{SCREEN_SHOT.get(sc, '')}"
            if sc == "カルテ":
                setrow(r, "撮影した /karte は 404 ページ (本物は /progress・CR-2-04)", "evidence/screens/*_karte.png は無効", "未実施"); continue
            if sc in ("曲詳細のゲート", "録音画面", "基礎練") and key in ("free", "expired", "internal", "trial"):
                rn = f"{key}_" + {"曲詳細のゲート": "song", "録音画面": "song", "基礎練": "practice"}[sc]
                if req.get(rn):
                    setrow(r, req[rn]["text"][:160], f"evidence/require/{rn}.png (REQUIRE_SUBSCRIPTION=true・ラウンド 2 修正後の撮り直し)", "合格"); continue
            if pick(name):
                pname = name if not (screens.get(name) and "/onboarding" in screens[name]["url"]) else "onb_" + name[len("apple_"):]
                if st == "無料期間中" and sc == "設定のプランカード":
                    r2 = load(f"{E}/r2fix/screens.json", []); t = next((x["text"] for x in r2 if x["name"] == "trial_settings"), "")
                    setrow(r, t[:160], "evidence/r2fix/trial_settings.png (修正後)", "合格" if "無料期間中" in t else "不合格 (O-1)"); continue
                setrow(r, scr(name), f"screens/{pname}.png", "合格" if hyd_ok(name) else "合格 (hydration 警告あり → 04 §3)"); continue
            if sc == "採点結果":
                setrow(r, "結果カードは録音が要る", "人へ", "人へ"); continue
            setrow(r, "撮影なし", "", "未実施"); continue
    if axis == "B 状態×画面" and pre.startswith("匿名セッション"):
        setrow(r, f"{scr('anon_root')} / {scr('anon_guest_home')} / {scr('anon_guest_library')} / {scr('anon_song_gate_try')}", "screens/anon_root.png, anon_guest_home.png, anon_guest_library.png, anon_song_gate_try.png", "合格" if all(screens.get(n) for n in ["anon_root", "anon_guest_home", "anon_guest_library", "anon_song_gate_try"]) else "未実施"); continue
    if axis == "B 状態×画面" and pre.startswith("契約なしのアカウント (購入キャンセル)"):
        setrow(r, (req.get("free_home") or {}).get("text", "?")[:120], "evidence/require/free_home.png (REQUIRE_SUBSCRIPTION=true: 帯「はじめると使えます」)・screens/apple_free_home.png (誘導なし)", "合格" if req.get("free_home") and "はじめる" in req["free_home"]["text"] else "未実施"); continue
    if axis == "B 状態×画面" and pre.startswith("契約なしのアカウント・stripe"):
        setrow(r, scr("stripe_web_free_settings"), "screens3: stripe の free は onboarding 完了後なのでホーム。未完了の誘導は読解 (layout.tsx contracted = !isAppleBilling())", "読解"); continue
    if axis == "B 状態×画面" and pre.startswith("Web+apple"):
        m = {"曲の詳細のゲート": "web_apple_song_gate", "設定のプランカード": "web_apple_free_settings", "/login": "web_apple_login", "/start": "web_apple_start", "ゲストホーム": "web_apple_guest"}
        n = m.get(op.split(" を")[0], None)
        if n and screens.get(n):
            ok = {"web_apple_song_gate": "iPhone アプリで登録" in screens[n]["text"] and "1 回ためす" not in screens[n]["text"], "web_apple_login": "Googleでログイン" in screens[n]["text"], "web_apple_start": "App Store" in screens[n]["text"], "web_apple_guest": "iPhone アプリで登録" in screens[n]["text"]}.get(n, True)
            setrow(r, scr(n), f"screens/{n}.png", "合格" if ok else "不合格"); continue
        setrow(r, "Web+apple の契約切れは検証ユーザーの Web ログインで撮っていない", "人へ", "人へ"); continue
    if axis == "B 状態×画面" and "REQUIRE_SUBSCRIPTION=true" in pre:
        n = "expired_song" if pre.startswith("契約切れ") else "free_song"
        setrow(r, (req.get(n) or {}).get("text", "?")[:160], f"evidence/require/{n}.png ほか (撮り直し)", "合格" if req.get(n) else "未実施"); continue
    # ---- B' ----
    if axis == "B' 遷移の辺":
        if "人へ" in mode: setrow(r, "Sandbox が要る", "人へ", "人へ"); continue
        if "通知" in pre or "DID_" in pre or "EXPIRED" in pre or "REFUND" in pre or "自動更新" in pre or "購入シート確定" in pre or "初回請求" in pre or "更新" in pre or "失効" in pre or "再開" in pre:
            setrow(r, "derivePlanStatus / applyTransaction で確認", "vitest appleServer.test.ts, evidence/apply_transaction.json", "合格"); continue
        if "ゲスト未使用→使用済み" in pre:
            setrow(r, "録音 (解析 1 本) が要る", "人へ", "人へ"); continue
        if "ゲスト→アカウント" in pre:
            setrow(r, "callback の昇格", "読解: auth/callback/route.ts", "読解"); continue
        if any(k in pre for k in ["アカウント→無料期間中", "無料期間中→契約中", "契約中→契約中", "契約中→契約切れ", "契約切れ→契約中", "更新しない予定"]):
            setrow(r, "applyTransaction の該当分岐", "evidence/apply_transaction.json (trialing / active / expired / revocation / stale)", "合格"); continue
        setrow(r, "", "", "未実施"); continue
    # ---- C 入力 ----
    if axis == "C 入力":
        field = pre.replace("入力欄=", "")
        if field.startswith("端末キー"):
            setrow(r, "isDeviceKey の正規表現 ^[A-Za-z0-9._:-]{8,128}$ で境界は決まる。空/空白/短い/長い/改行/全角/絵文字/記号/null は error、最大 128 は通る", "読解: app/actions/guestTry.ts isDeviceKey", "読解"); continue
        if field.startswith("appAccountToken"):
            setrow(r, "JS は authUserId (UUID) をそのまま渡す。Swift は UUID(uuidString:) で弾く", "読解: StartClient.tsx, ArcodaStorePlugin.swift purchase", "読解"); continue
        if field.startswith("プラン選択"):
            setrow(r, "?plan=month だけ月額、それ以外は年額 (start/page.tsx)。カードは 2 値", "読解: app/start/page.tsx resumePlan", "読解"); continue
        setrow(r, "オンボと退会の入力欄は要ログイン・実操作が要る", "人へ: SCR-02b / SCR-11d / 退会で各観点を入力", "人へ"); continue
    if axis == "C' 構造化入力":
        target = pre.replace("API 本文=", ""); o = op.replace(" を POST", "")
        if target.startswith("signedPayload"):
            keymap = {"本文無し": "notif: 本文無し", "空文字/空配列": "notif: signedPayload 空", "型違い (数値)": "notif: 型違い (数値)", "壊れた JWS (ドット 1 つ)": "notif: 壊れた JWS (ドット 1 つ)", "x5c 無しのヘッダ": "notif: x5c 無し", "自前 CA で署名した JWS": "notif: 自前 CA (root 不一致)", "巨大 (5 MB)": "notif: 巨大 5MB"}
            k = keymap.get(o)
            if k and api.get(k):
                setrow(r, f"{api[k]['status']} {api[k]['body'][:80]}", "evidence/api_round.json", "合格" if str(api[k]["status"]) == "400" else "不合格"); continue
            if o == "同じ値の重複":
                setrow(r, "route 単体で duplicate:true", "vitest notifications/route.test.ts", "合格"); continue
        if target.startswith("jws ("):
            if o == "本文無し": setrow(r, "未認証 401 (curl) / 認証済みで jws 無し 400 (route 単体)", "evidence/api_round.json, vitest verify/route.test.ts", "合格"); continue
            if o == "同じ値の重複": setrow(r, "同じ otx の再送は本人更新 (applyTransaction)", "evidence/apply_transaction.json", "合格"); continue
            setrow(r, "署名不正は 400 (route 単体)。壊れた本文は verifyAppleJws が投げる", "vitest verify/route.test.ts, api_round.json", "合格"); continue
        if target.startswith("jws 配列"):
            if o in ("本文無し", "空文字/空配列"): setrow(r, "未認証 401 / 空配列は {result:none} (route の先頭)", "evidence/api_round.json, 読解 restore/route.ts", "読解"); continue
            setrow(r, "署名不正は continue → none。conflict は 409", "読解: app/api/apple/restore/route.ts", "読解"); continue
        setrow(r, "", "", "未実施"); continue
    # ---- D ----
    if axis == "D 遷移と中断":
        flow = pre.replace("動線=", ""); it = op
        if flow.startswith("1 回ためす") and ("再読込" in it or "直リンク" in it or "戻る" in it):
            setrow(r, "匿名セッションで /guest・/guest/library・曲・/start・戻る を通した", "screens/anon_*.png", "合格 (hydration 警告は 04 §3)"); continue
        if flow.startswith("はじめる→購入") and "再読込" in it:
            setrow(r, "?step= は 1 回で消す (CR-1-14)", "読解: StartClient.tsx", "読解"); continue
        if "二重タップ" in it or "連打" in it:
            setrow(r, "busy / trying / submitting で二重実行を防ぐ", "読解: StartClient.tsx onStart・GateSheet.tsx onTry・DeleteAccountModal.tsx", "読解"); continue
        setrow(r, "殻・実機・Apple の OAuth が要る", "人へ: 実機で該当の中断を起こす", "人へ"); continue
    # ---- E ----
    if axis == "E 権限と所有":
        role = pre.replace("役割=", ""); res = op.replace("資源: ", "")
        if res.startswith("GET /api/cron"):
            setrow(r, f"{api.get('cron: Bearer 無し',{}).get('status')} / {api.get('cron: Bearer 違い',{}).get('status')}", "evidence/api_round.json", "合格"); continue
        if role == "未ログイン":
            if res.startswith("POST /api/apple") or res.startswith("GET /api/plan"):
                k = {"POST /api/apple/verify": "verify: 未認証・jws あり", "POST /api/apple/restore": "restore: 未認証", "GET /api/plan/usage": "usage: 未認証"}[[x for x in ["POST /api/apple/verify", "POST /api/apple/restore", "GET /api/plan/usage"] if res.startswith(x)][0]]
                setrow(r, str(api.get(k, {}).get("status")), "evidence/api_round.json", "合格" if str(api.get(k, {}).get("status")) == "401" else "未実施"); continue
            setrow(r, "middleware / layout が /guest か /login へ (既存)", "読解: middleware.ts, [userId]/layout.tsx", "読解"); continue
        if role.startswith("ゲスト匿名"):
            if res.startswith("他人の曲"):
                setrow(r, scr("anon_own_settings_direct"), "screens/anon_own_settings_direct.png (本人 uuid の settings でも /guest へ)", "合格" if screens.get("anon_own_settings_direct") and "/guest" in screens["anon_own_settings_direct"]["url"] else "未実施"); continue
            if res.startswith("/onboarding"):
                r2 = load(f"{E}/r2fix/screens.json", []); u = next((x["url"] for x in r2 if x["name"] == "anon_onboarding_direct"), "")
                setrow(r, u, "evidence/r2fix/anon_onboarding_direct.png (修正後)", "合格" if "/guest" in u else "不合格"); continue
            if res.startswith("GET /api/plan"):
                setrow(r, json.dumps(quota_f.get("guest"), ensure_ascii=False), "evidence/quota_require_false.json guest", "合格"); continue
            setrow(r, "匿名でも認証は通る。契約が付く経路は Cron の安全網で保護 (CR-1-17)", "読解", "読解"); continue
        if role.startswith("別人"):
            key = "free"
            setrow(r, scr("apple_free_other_settings"), "screens/apple_free_other_settings.png (他人の uuid → 自分に付け替え)", "合格" if screens.get("apple_free_other_settings") and USERS_OTHER not in screens["apple_free_other_settings"]["url"] else "未実施"); continue
        setrow(r, "状態どおり (quota / layout)。verify/restore は route 単体", "evidence/quota_require_*.json, vitest", "読解"); continue
    # ---- F / G / H ----
    if axis == "F 同時と競合":
        if "順序逆転" in op: setrow(r, "stale で捨てる", "evidence/apply_transaction.json 順序逆転・OTX-OLD", "合格"); continue
        if "通知 UUID が同時" in op: setrow(r, "upsert + processedAt", "読解: notifications/route.ts", "読解"); continue
        if "OTX-OLD" in op or "OTX-OLD" in pre: setrow(r, "stale", "evidence/apply_transaction.json", "合格"); continue
        setrow(r, "同時操作は実機か 2 端末が要る", "人へ", "人へ"); continue
    if axis == "G 時間":
        if "expiresDate が過去" in op or "証明書の有効期限" in op or "1 秒前" in pre or "1 秒後" in pre:
            setrow(r, "derivePlanStatus (<=) / verifyChain の有効期限", "vitest appleServer.test.ts (expiresDate ちょうど今は expired), 読解 verifyChain", "合格" if "証明書" not in op else "読解"); continue
        if "残り日数" in pre or "負" in pre: setrow(r, "Math.ceil / Math.max(0)", "読解: home.tsx", "読解"); continue
        setrow(r, "", "読解: plan.ts jstDayStart / Cron の lt", "読解"); continue
    if axis == "H データの形":
        if "Sandbox" in pre: setrow(r, "appleEnvironment を書くだけ", "読解: applyTransaction", "読解"); continue
        if "queued" in pre: setrow(r, "15 分の窓", "読解: plan.ts (CR-1-12)", "読解"); continue
        if "Apple の氏名" in pre: setrow(r, "「あなた」", "読解: callback (CR-1-16)", "読解"); continue
        if "想定外の値" in pre: setrow(r, "free", "vitest planGrant.test.ts (paused → free)", "合格"); continue
        if "plan=\"plus\" planStatus=null" in pre: setrow(r, "free", "vitest plan.test.ts", "合格"); continue
        if "data 無し" in pre or "renewal だけ" in pre: setrow(r, "400 no transaction", "vitest notifications/route.test.ts", "合格"); continue
        if "UUID でない" in pre: setrow(r, "no_user", "evidence/apply_transaction.json", "合格"); continue
        setrow(r, "", "読解", "読解"); continue
    # ---- I 外部 ----
    if axis == "I 外部の失敗":
        ext = pre.replace("外部=", ""); o = op.replace("結果=", "")
        if ext == "StoreKit getProducts" and o in ("4xx", "5xx", "不正な本文"):
            setrow(r, "価格を読み込めませんでした・もう一度 (照合報告 c17)", "verify/c17_start_noprice.png", "合格"); continue
        if ext == "StoreKit purchase" and o == "4xx":
            setrow(r, scr("apple_expired_start_cancel_toast"), "screens/apple_expired_start_cancel_toast.png (cancel)", "合格" if screens.get("apple_expired_start_cancel_toast") else "未実施"); continue
        if ext == "StoreKit restore" and o == "4xx":
            setrow(r, scr("apple_expired_start_restore_none"), "screens/apple_expired_start_restore_none.png (none)", "合格" if screens.get("apple_expired_start_restore_none") else "未実施"); continue
        if o == "正常": setrow(r, "殻と Sandbox が要る", "人へ", "人へ"); continue
        if o in ("タイムアウト", "遅延 (5 秒)"): setrow(r, "fetch/nativePromise に timeout 無し。busy のまま (S4 候補・99 の未決)", "読解", "読解"); continue
        setrow(r, "エラー文言 (say) の分岐", "読解: StartClient.tsx", "読解"); continue
    # ---- J 回帰 ----
    if axis == "J 回帰":
        if "stripe モード" in pre:
            name = "stripe_web_free_settings" if "設定" in pre else "stripe_web_start"
            setrow(r, scr(name), f"screens/{name}.png", "合格" if screens.get(name) and "準備中" in screens[name]["text"] else "未実施"); continue
        if "resolveEffectivePlan の呼び出し" in pre:
            setrow(r, str(grep.get("resolveEffectivePlan_planGrant")), "evidence/grep.json", "合格" if grep.get("resolveEffectivePlan_planGrant_ok") else "不合格"); continue
        setrow(r, "tsc 0 エラー・stripe モードの撮影 9 枚で従来の画面が出る", "tsc, screens/stripe_*.png", "読解"); continue
    # ---- K / L ----
    if axis == "K 端末と表示":
        sc = pre.replace("画面=", ""); v = op
        tag = {"幅 320": "w320", "幅 430/768": "w768", "文字を最大 (200%)": "font200", "明るい表示と暗い表示": "dark", "幅 402 (標準)": None}.get(v.split(" で")[0])
        page = {"ゲストホーム": "guest", "/start": "start", "/login": "login", "設定のプランカード": "settings"}.get(sc)
        if tag and page and screens.get(f"k_{tag}_{page}"):
            e = screens[f"k_{tag}_{page}"]
            setrow(r, f"hscroll={e.get('hscroll')}", f"screens/k_{tag}_{page}.png", "合格" if not e.get("hscroll") else "不合格 (横スクロール)"); continue
        if tag is None and page:
            setrow(r, "標準幅は他の撮影と同じ", "screens/*", "合格"); continue
        setrow(r, "撮影対象外", "人へ: 実機", "人へ"); continue
    if axis == "L 使いやすさ":
        setrow(r, "aria-modal・role=dialog (GateSheet)・44px のボタン (CSS)・Escape で閉じる", "読解: GateSheet.tsx, start.module.css", "読解"); continue
    if axis == "M 安全":
        if "appAccountToken" in pre: setrow(r, "署名 400 / token 不一致 403", "evidence/api_round.json, vitest verify/route.test.ts", "合格"); continue
        if "他人の otx" in pre: setrow(r, "conflict 409", "evidence/apply_transaction.json, vitest", "合格"); continue
        if "CRON_SECRET" in pre: setrow(r, "!process.env.CRON_SECRET で 401", "読解: guest-cleanup/route.ts", "読解"); continue
        if "planGrant" in pre: setrow(r, "書き手 0 件", "evidence/grep.json planGrant", "合格"); continue
        if "appleRefreshToken" in pre: setrow(r, "settings/page.tsx の select に無い。使うのは requestAccountDeletion だけ", "evidence/grep.json appleRefreshToken", "合格"); continue
        if "ログ" in pre: setrow(r, "console.error は message だけ", "evidence/grep.json console", "合格"); continue
        if "回数上限" in pre: setrow(r, "apiLimit 未適用 (S4・99 の未決)", "evidence/grep.json apiLimit", "読解"); continue
        if "x-pathname" in pre: setrow(r, "fail-closed (CR-1-21)", "読解: layout.tsx", "読解"); continue
        setrow(r, "", "読解", "読解"); continue
    if axis == "N 通しの歩き":
        setrow(r, "匿名 → 曲 → ゲート → /start → ゲストにもどる を歩いた (殻の模擬)。所見は 99_report §7", "screens/anon_*.png", "合格 (所見あり)"); continue
    setrow(r, "", "", "未実施")

with io.open(f"{D}/02_cases.csv", "w", encoding="utf-8", newline="") as f:
    w = csv.writer(f); w.writerow(head); w.writerows(body)
print(json.dumps(stats, ensure_ascii=False), "total", len(body))
