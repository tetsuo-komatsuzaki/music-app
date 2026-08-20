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
| 1 | カード出現の時差 (塊130ms/項目95ms/先行170ms/CAP3.2s・起き上がり22px) | v3 CSS+v5 JS | 反映 (v4) | RevealMotion (data-anim="block" + ds.card/seg/letter + h1)。項目=card直下 |
| 2 | 数字のカウントアップ (項目+230ms開始・終わりに一度弾む) | v5 JS | 反映 (v4) | RevealMotion (data-anim="count") + .rv-settled |
| 3 | リングの回転描画 0%→目標 (項目+200ms) | v3 CSS+JS | 反映 (v4) | globals @property --p + data-anim="ring" (--rd) |
| 4 | バーの伸び 0→目標 (項目+200ms・1.15s) | v3/v5 | 反映 (v4) | globals + data-anim="bar" (--w/--base) |
| 5 | 進捗バーの流れる光 | v2 CSS | 反映 | ds .bar i::after (sweepX 2.8s) |
| 6 | 金要素の光沢スイープ | v2 CSS | 反映 | ds .pill.ink::after / .cta::after (sweepX 3.4s) |
| 7 | クリーム数字のグロー | v2 CSS | 反映 | ds .bigN text-shadow |
| 8 | 波形バー: 立ち上がり(項目+180ms+n*22ms)→律動+注目バー発光 | v3 CSS | 反映 (v4) | RevealMotion CSS (rvBarRise) + ds .wave i/i.hot |
| 9 | 手紙カードの金縁グロー | v2 CSS | 反映 | ds .letter (塊としても出現対象) |
| 10 | 選択タブの金グロー | v2 CSS | 反映 | BottomTabs.module .tab.active svg |
| 11 | RECボタンの呼吸 | v2 CSS | キーフレーム定義済み | globals recBreathe (録音画面の写経時に適用) |
| 12 | prefers-reduced-motion 全停止 | v2 CSS | 反映 | 各定義にガード + rv-boot は最初から立てない |
| 13 | ページ背景オーロラ+グレイン / タイトルの金シーン / 端末の浮遊 | v2 CSS | 対象外 | モックのギャラリーページ専用 (端末の外側) |
| 14 | 3Dチルト / スポットライト | v2 JS+CSS | 復活しない | 2026-08-20 Tetsuo決定 |
| 15 | 見えたら発火 + 最初の画面は一本の時間軸 | v5 JS | 反映 (v4) | RevealMotion IntersectionObserver + rv-boot (layout.tsx) |
| 16 | ★が1個ずつ灯る (項目+240ms+n*105ms・消えた★は静かに) | v3 CSS+v5 JS | 反映 (v4) | RevealMotion (ds.stars を自動分割 .rv-star/--si) |
| 17 | チェック: 丸が開く(+130ms)→✓が描かれる(+260ms) | v3 CSS | 反映 (v4) | RevealMotion CSS (ds.chk 自動) |
| 18 | 未完了番号ふわり(+150ms) / ピルふわり(+170ms+n*70ms) | v3 CSS | 反映 (v4) | RevealMotion CSS (ds.todo/ds.pill 自動) |
| 19 | 折れ線: 左から描画(+230ms)→面(+780ms)→節点(+380ms+n*185ms) | v3 CSS | 定義済み・適用待ち | svg に data-anim="chart" を宣言 (ふりかえりTRAJ写経時に使用) |

## data-anim の宣言ルール (演出要件v1.1)
- `data-anim="block"` … DSクラス以外の独自カードを塊として出す
- `data-anim="ring"` + style `--p: N%` … リング描画
- `data-anim="bar"` + style `--w: N%` (中身は `<i>`) … バーの伸び
- `data-anim="count"` … 数字のカウントアップ (子タグを含めない)
- `data-anim="chart"` … 折れ線SVGの描画演出 (本物イラストと区別する明示宣言。モックの .appfig 除外に相当)

## v4 での申告事項 (2026-08-20)
- 入れ子の塊 (カードの中のカード) は「項目」として出す。モックは内側にも枠時間を配るが、
  アプリの実DOMに深い入れ子がほぼ無いため簡素化 (発生したら写経時に個別確認)
- ds.stars の★分割は初回描画のみ。Reactが再描画すると素の表示に戻る (静的表示が前提)
