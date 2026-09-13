# ラウンド 2 の修正記録

- Tetsuo の承認 (2026-09-13): 「残る不具合の修正は OK。実装して」「4 (未決) は最初から」「所見の 2 件は OK。実装して」
- すべて作業ツリーの未コミット差分 (コミットと push は承認待ち)
- 証跡: evidence/r2fix/ (screens.json・ux.json・*.png)、evidence/require/ (REQUIRE_SUBSCRIPTION=true で撮り直し)

## 1. 指摘ごとの処理

### CR-2-01 (S2) 契約ゲートの主ボタンが「ログイン」 → 直した
- 修正: GateSheet.tsx に `fixedPrimary = !!primaryHref`。契約ゲート (primaryHref を明示) は端末の「登録済み」の印に関係なく主ボタンを固定し、ログインの従ボタンは出さない
- 修正前: evidence/require (ラウンド 2 時点) の expired_song「ログイン ／ アカウントがない人は再開する」
- 修正後: evidence/require/screens.json (撮り直し): expired_song・expired_practice・expired_lesson「… 再開する ホーム …」、free_song・free_practice「… はじめる ホーム …」(ログインの文字なし)。CR-1-03 もこれで完了

### CR-2-02 (S2) 続きの router.replace が成功時の遷移を取り消す → 直した
- 修正: doPurchase / doRestore が「移動したか」を返し、移動しなかった (キャンセル・失敗) ときだけ `router.replace("/start")`。成功時は後発のナビゲーションを発行しない
- 証跡: 読解 (StartClient.tsx 118-147・181-184 行)。Apple の OAuth 戻りが要るため実測は人へ

### CR-2-03 (S2) 匿名セッションが /login に着けない → 直した
- 修正: middleware.ts の「既ログインで /login → ホーム」を `user && !user.is_anonymous` に
- 証跡: evidence/r2fix/anon_login_page.png (匿名で /login のフォームが出る)、anon_then_login_as_free.png (そのまま既存アカウントで入ると本人ホーム /99a7…)。r2fix/screens.json `anon_login_form_visible: ok true`

### O-1 (S2) 無料期間中の設定カードが「未加入」 → 直した
- 修正: settings/page.tsx の isPlus を「plus か trial」に。planGrant も渡す (O-7 も解消)
- 修正前: evidence/screens/onb_trial_settings.png「未加入 … アルコプラスをはじめる」
- 修正後: evidence/r2fix/trial_settings.png「無料期間中 アルコの採点は無制限で使えます。無料期間は 2026年9月25日 までです。 契約を管理」

### 未決 7a: 契約なし・匿名の /onboarding 直接表示 (O-3) → 直した
- 修正: onboarding/page.tsx で匿名は /guest へ、apple モードで契約なしはホームへ
- 証跡: evidence/r2fix/free_onboarding_direct.png (URL が本人ホーム)、anon_onboarding_direct.png (URL が /guest)

### CR-2-05 (S3) Web+apple のライブラリに 1 回ためしの帯 → 直した
- 修正: LibraryClient の帯を `tryBanner && (!isAppleBilling() || native)` に
- 証跡: evidence/r2fix/web_guest_library.png (帯の文言が無い)

### CR-2-06 (S3) getGuestTryState の queued の数え方 → 直した
- 修正: getGradingQuota と同じ「queued は 15 分以内だけ」に
- 証跡: 読解 (guestTry.ts)

### CR-2-07 (S3) noLater でも veil クリックと Escape で閉じる → 直した
- 修正: noLater のとき veil の onClick と Escape を無効に
- 証跡: 読解 (GateSheet.tsx)

### CR-2-11 (S4) planView が teacherLink を見ない → 直した
- 修正: teacherSummary があれば契約の帯を出さない
- 証跡: 読解 ([userId]/page.tsx)

### CR-2-04 (S3) 台帳のカルテ行が 404 を撮っていた → 台帳を直した (未実施に)。/progress の撮影は次のラウンドで
### CR-2-08 (S4) stale 判定が billingProvider を見ない → 対応しない (開発用アカウントだけ・Stripe は眠り)。最終報告に記録
### CR-2-09 / CR-2-10 / CR-2-12 (S4) 記録の誤り → 04_round-1-fix.md §4 と台帳で訂正済み

## 2. 未決 (AMB) の決定: すべて第 1 案 (Tetsuo「4 は最初から」)

| 論点 | 決定 | 実装 |
|---|---|---|
| 1 Web での 1 回ためし | 殻だけ | 済 (CR-1-13・CR-2-05) |
| 2 請求リトライ中の見せ方 | 「契約切れ・再開する」のまま | 変更なし |
| 3 アプリ公開前の本番の未加入者 | 「新しいお申し込みは準備中です」 | 済 (CR-1-04) |
| 4 使用済み端末でためした曲 | 結果が見える本人ページへ | 変更なし |
| 5 契約切れのカルテ | 閲覧できる | 変更なし |
| 6 Apple 以外のアカウントで殻から Apple を結ぶ | Supabase の手動 identity 結合を有効化して linkIdentity | 済 (CR-1-15)。有効化は Tetsuo 側 (ペンディングに記載) |
| 7 契約なし・匿名の /onboarding 直接 | 送り返す | 済 (上記) |
| 8 仕様書の矛盾 2 つ | 決定表を正として古い文言を消す | 要件整理の artifact を v2.8 に更新 |
| 9 先生アカウントの Apple 契約 | 別件 | 変更なし |

## 3. 所見 (§7) からの変更 (Tetsuo 承認)

| 変更 | 実装 | 証跡 |
|---|---|---|
| 結果カードのボタンの下に 1 行「はじめる手続き・最初の 2 週間は無料」 | ArcoResultOverlay.tsx guestTrial の下段 | evidence/r2fix/result_guest_note.png「この 95 点を残してつづける はじめる手続き・最初の 2 週間は無料 残さない場合は右上の × で閉じる」 |
| /start の CTA を「2 週間無料ではじめる」(導入オファー対象のとき)。対象外は「年額プランで Apple ではじめる」のまま | StartClient.tsx | evidence/r2fix/start_cta_intro.png・start_cta_nointro.png |

## 4. 修正後の検査

- `npx tsc --noEmit`: 0 エラー
- `npx vitest run` (課金関連 7 ファイル): 60 件通過
- REQUIRE_SUBSCRIPTION=true の撮り直し 28 枚 (evidence/require/)、定数は復元済み (`git diff app/_libs/plan.ts` に REQUIRE の差分なし)
- 一時ハーネス app/dev/billing-demo は撮影後に削除
