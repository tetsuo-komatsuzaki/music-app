# ラウンド 4 の修正記録

- Tetsuo の指示 (2026-09-13): 「これ全てを修正して合格でオッケー。今の段階のものを本番でコミットして、その後にラウンドを 2 回回す」
- この記録の修正までをコミット・配信し、そのあとラウンド 5・6 で確認する

## 1. 指摘ごとの処理

### CR-4-01 (S3) verify の通信失敗で busy が戻らない → 直した
- 修正: StartClient.tsx の doPurchase / doRestore の fetch を try/catch で受け、「通信できませんでした。電波のある場所で、購入を復元をお試しください」を出して false を返す。続きの effect にも catch を足し、失敗時は /start に戻して busy を解く
- 証跡: 読解。実測はラウンド 5 (批評者が verify を落として確認する)

### CR-4-02 (S4) 出口リンクが左寄せ → 直した
- 修正: GateSheet の出口を display block・text-align center に

### CR-4-03 (S4) レッスンのゲートの出口がライブラリ → 直した
- 修正: pathname が /<uuid>/lessons 配下なら「レッスンの一覧にもどる」(/<uuid>/lessons)

### CR-4-04 (S4) Web の /start がログイン済みでも「ゲストにもどる」 → 直した
- 修正: session が user なら「ホームにもどる」(/)

### CR-4-05 (S4) busy 中の「購入を復元」が押せる → 直した
- 修正: disabled={busy}

### CR-4-06 (S4) 記録の整合 → 台帳を再集計 (216 / 3 / 450 / 194 / 16)、next-env.d.ts を戻した

## 2. 修正後の検査

- `npx tsc --noEmit`: 0 エラー
- `npx vitest run` (課金関連 7 ファイル): 60 件通過
- eslint (StartClient・GateSheet): error 0
- 本番ビルド: コミット前に `next build` を実行 (99_report に結果)
