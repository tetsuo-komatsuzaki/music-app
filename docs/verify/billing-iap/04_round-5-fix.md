# ラウンド 5 の修正記録

- 前提: ラウンド 4 までの修正はコミット 793f4da7 として本番に配信済み (2026-09-13)。本番で `POST /api/apple/notifications {}` が 400 (route に届く) を確認。Cron は Vercel に CRON_SECRET が無いので 401
- ラウンド 5 の判定は条件つき合格 (S3 1・S4 5)。Tetsuo の方針「全部直して合格を取る」に従い、ここで直す。この記録の修正は未コミット (ラウンド 6 のあとにまとめる)

## 1. 指摘ごとの処理

### CR-4-01 (S3・前ラウンド) → 批評者が実測で閉じた (r5_D / r5_D2 / r5_F)。CR-3-03 の退行なし (r5_E)

### CR-5-01 (S3) 33 文字の案内がトーストの幅を突き抜ける → 直した
- 修正: start.module.css の .toast を `white-space: normal; text-align: center; line-height: 1.5; border-radius: 18px` に (折り返す)
- 証跡: ラウンド 6 で実測 (批評者の手口 r5_K)

### CR-5-02 (S4) 1 回ためしの「ログイン」が左寄せ → 直した
- 修正: GateSheet.module.css の .later に text-align center

### CR-5-03 (S4) 無効の「購入を復元」の見た目が変わらない → 直した
- 修正: `.legal button:disabled { opacity: 0.45 }`

### CR-5-04 (S4) App Store の URL があると戻るリンクが無い → 直した
- 修正: App Store のリンクと戻るリンクを両方出す

### CR-5-05 (S4) restore の 500/401 で「契約はありません」と断言 → 直した
- 修正: `!res.ok` は「確認できませんでした。時間をおいてもう一度お試しください」。restore_none は result=none のときだけ

### CR-5-06 (S4) 記録の不備 → 直した
- 99_report を第 4 版 (コミット後の実態) に。台帳にラウンド 3〜5 の行 9 本を追加し、TC-0551/0553 の実測を更新。04_round-4 の「next build の結果」は _tmp/build_r4.log「Compiled successfully in 49s」を 99_report §2 に転記

## 2. 修正後の検査

- `npx tsc --noEmit`: 0 エラー
- `npx vitest run` (課金関連): 60 件通過
