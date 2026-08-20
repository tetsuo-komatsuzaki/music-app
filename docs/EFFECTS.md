# 演出の台帳と写経の作業規約

## 作業規約 (2026-08-20 Tetsuo指示 ・ 必ず実施)
1. **仕様書を開いてから書く。** 記憶で書かない。確定モック・要件定義 (演出要件v1.1 /
   配色案1 / ナビ要件) を該当箇所ごとに開き、値を見ながら写す
2. **演出は写経と同時。** 「あとでまとめて」に切り出さない。data-anim 宣言は
   その画面のDOMを書くときに一緒に付ける
3. **写経の完了定義 = 次の4点が全部そろって完了**
   - DOM一致 (モックの構造どおり)
   - CSS一致 (computed style の突き合わせ)
   - data-anim 宣言 (block/ring/bar/count) と遅延描画ブロックの発火確認
   - この台帳の全行チェック
4. 実施済み画面にも、規約変更のたびに再チェックをかける

写経した画面は、公開前にこの表の全行を通すこと。
「実装の場所」が ds.module.css / globals.css / RevealMotion のものは、
DSクラス (card/bar/pill/bigN/wave/letter/cta) と data-anim 宣言を使えば自動で付く。

| # | 演出 | 出どころ | 状態 | 実装の場所 |
|---|---|---|---|---|
| 1 | カード出現の時差 (塊130ms/項目95ms/CAP3.2s) | v5 JS | 反映 | RevealMotion (data-anim="block" + ds.card/seg + h1) |
| 2 | 数字のカウントアップ (子タグ入りは対象外) | v2/v5 JS | 反映 | RevealMotion (data-anim="count") |
| 3 | リングの回転描画 0%→目標 | v2 CSS+JS | 反映 | globals @property --p + data-anim="ring" |
| 4 | バーの伸び 0→目標 | v5 | 反映 | globals + data-anim="bar" (--w) |
| 5 | 進捗バーの流れる光 | v2 CSS | 反映 | ds .bar i::after (sweepX 2.8s) |
| 6 | 金要素の光沢スイープ | v2 CSS | 反映 | ds .pill.ink::after / .cta::after (sweepX 3.4s) |
| 7 | クリーム数字のグロー | v2 CSS | 反映 | ds .bigN text-shadow |
| 8 | 波形バーの律動 + 注目バー発光 | v2 CSS | 反映 | ds .wave i / i.hot (barPulse 2.6s / hotPulse 1.8s) |
| 9 | 手紙カードの金縁グロー | v2 CSS | 反映 | ds .letter (適用画面は写経時にクラスを使う) |
| 10 | 選択タブの金グロー | v2 CSS | 反映 | BottomTabs.module .tab.active svg |
| 11 | RECボタンの呼吸 | v2 CSS | キーフレーム定義済み | globals recBreathe (録音画面の写経時に適用) |
| 12 | prefers-reduced-motion 全停止 | v2 CSS | 反映 | 各定義にガード |
| 13 | ページ背景オーロラ+グレイン / タイトルの金シーン / 端末の浮遊 | v2 CSS | 対象外 | モックのギャラリーページ専用 (端末の外側) |
| 14 | 3Dチルト / スポットライト | v2 JS+CSS | 復活しない | 2026-08-20 Tetsuo決定 |
| 15 | IntersectionObserver 発火 | v2 JS | 対象外 | アプリはページ遷移駆動 (RevealMotion) |

## data-anim の宣言ルール (演出要件v1.1)
- `data-anim="block"` … DSクラス以外の独自カードを塊として出す
- `data-anim="ring"` + style `--p: N%` … リング描画
- `data-anim="bar"` + style `--w: N%` (中身は `<i>`) … バーの伸び
- `data-anim="count"` … 数字のカウントアップ (子タグを含めない)
