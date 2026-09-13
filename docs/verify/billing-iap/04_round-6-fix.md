# ラウンド 6 の修正記録

- ラウンド 6 の判定は条件つき合格 (S3 1・S4 4)。ラウンド 5 の 6 件は批評者が実測で閉じた
- Tetsuo の指示 (コミット後にラウンド 2 回) はここで完了。新規の指摘は直したが未コミット (指示待ち)

## 1. 指摘ごとの処理

### CR-6-01 (S3) トーストが画面の半分の幅で折り返す (CR-5-01 の直し方の副作用) → 直した
- 原因: 絶対配置 + left 50% で width 未指定のため、shrink-to-fit の利用可能幅が包含ブロックの半分に固定されていた
- 修正: `.toast` に `width: max-content` (max-width 92% はそのまま)
- 証跡: evidence/r6fix/screens.json・toast_short.png・toast_long.png (幅と行数)

### CR-6-02 (S4) Web の戻りリンクが主ボタンと同じ見た目 → 直した
- 修正: `.webNote a.webBack` を下線のリンクに、主ボタンの規則は `a:not(.webBack)` に
- 証跡: evidence/r6fix/web_back.png

### CR-6-03 (S4) 警告トーストの表示時間 → 直した
- 修正: warn は 4.2 秒 (通常 2.4 秒)

### CR-6-04 (S4) 99_report の §1 / §4 / §6c がコミット前の記述 → 第 5 版で直した

### CR-6-05 (S4・既存) Web /start の見出しの改行位置 → 対応しない (既存・文言の長さの問題。見出しを短くするかは Tetsuo の判断)

## 2. 修正後の検査

- `npx tsc --noEmit`: 0 エラー
