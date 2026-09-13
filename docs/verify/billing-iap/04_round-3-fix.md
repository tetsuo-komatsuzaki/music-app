# ラウンド 3 の修正記録

- Tetsuo の承認 (2026-09-13): 「なおしておーけー」(S3 2 件)。S4 のうち小さい 2 件も同時に直した
- すべて作業ツリーの未コミット差分 (コミットと push は承認待ち)
- 証跡: evidence/r3fix/ (screens.json・*.png)、evidence/require/ (REQUIRE_SUBSCRIPTION=true の撮り直し。`*_gate_back*`)

## 1. 指摘ごとの処理

### CR-3-01 (S3) 契約ゲートが下のタブまで覆い、一覧に戻れない → 直した
- 修正: GateSheet.tsx の fixedPrimary (契約ゲート) に「ライブラリにもどる」の出口を追加 (本人 URL の /library。ゲストなら /guest/library)。/start の出口はログイン済みなら「ホームにもどる」(/)、それ以外は「ゲストにもどる」
- 証跡: evidence/require/expired_gate_back.png・free_gate_back.png (押すとライブラリへ)、require/screens.json `*_gate_back_link`、evidence/r3fix/free_start_exit.png (ログイン済みの /start に「ホームにもどる」)

### CR-3-02 (S3) 無料期間中のカードが「無制限」 → 直した
- 修正: PlanCard.tsx の trialing の文言を「無料期間中は 1 日 8 本・10 分まで採点できます。無料期間は X までです。」に (§2 表と録音画面の表示に一致)
- 証跡: evidence/r3fix/trial_settings.png

### CR-3-03 (S4) 購入成功後に CTA が押せる状態に戻る → 直した
- 修正: onStart / onRestore / 続きの effect で、移動したときは busy を解かない
- 証跡: 読解 (StartClient.tsx)

### CR-3-04 (S4) ログイン済みの契約ゲートがゲストの統計に混ざる → 直した
- 修正: fixedPrimary のときは gate_shown・gate_signup を記録しない
- 証跡: 読解 (GateSheet.tsx)

### CR-3-05 (S4) 台帳の記録の不備 → 記録のみ (最終報告 §8)。/progress の撮り直しと /login の未実施は次回

## 2. 修正後の検査

- `npx tsc --noEmit`: 0 エラー
- `npx vitest run` (課金関連 7 ファイル): 60 件通過
- REQUIRE_SUBSCRIPTION=true の撮り直し (evidence/require/)、定数は復元済み
