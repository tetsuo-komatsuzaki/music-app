# トップページのエフェクト実コード集 (全ページ統一の正)

**目的 (2026-08-21 Tetsuo指示)**: トップページで使った演出コードを漏れなく記載し、
**以後どのページを作っても同じエフェクトが統一して掛かる**ようにする。
このファイルは実装から機械抽出した写しで、**正本は各実ファイル**。乖離したら実ファイルを正として更新する。

## 統一の仕組み — なぜ全ページで同じになるのか

エフェクトは4層の**中央実装**で、ページ側にコードを書かない:

| 層 | 実装ファイル | 効くもの | ページ側の作業 |
|---|---|---|---|
| 1. 全画面共通CSS | app/globals.css | A1/A2/F4背景・E3'押下・D3クラス・独自カードの立体/出現 | なし (自動) |
| 2. シェル常駐 | app/[userId]/userShell.tsx + layout.tsx(rv-boot) | 出現エンジン起動 (B2チルト/B4ベゼルは廃止) | なし (自動) |
| 3. DS部品CSS | app/components/ds.module.css | カード/★/チェック/ピル/バー/大数字/リング/CTA/波形/見出し | **DSクラスを使うだけ** |
| 4. 宣言属性 | app/components/RevealMotion.tsx (エンジン正本) | 出現の時間軸・リング/バー/数字/折れ線 | **data-anim を書くだけ** |

**新しいページの義務は2つだけ**: ①部品は必ずDSクラス (ds.card / ds.lab / ds.chk / ds.pill /
ds.bar / ds.bigN / ds.stars / ds.todo / ds.seg / ds.cta / ds.wave / ds.letter / ds.t) で組む
②独自カードには data-anim="block"、行リストの入れ物に data-anim="items"、
値ものに data-anim="ring|bar|count|chart" を宣言する。これで全演出が自動で揃う。

## ページ作成チェック (EFFECTS.md 規約の完了定義に含める)

1. h1 は ds.t か (A3/A4 が付く)
2. カードは ds.card か data-anim="block" か (出現+立体+浮影+グラデ F3)
3. 行リストの入れ物に data-anim="items" (順番出し)
4. ★は ds.stars ・ チェックは ds.chk ・ ピルは ds.pill ・ 番号丸は ds.todo (葉の演出)
5. 進捗は data-anim="bar"(--w) / リングは data-anim="ring"(--p) / 成果数字は data-anim="count" / 折れ線は data-anim="chart"
6. 金のCTAは ds.cta (スイープ) ・ 大数字は ds.bigN (グロー)
7. 台帳 EFFECTS.md 全行チェック + このファイルとの目視突き合わせ

---

## 1. 全画面共通 (globals.css)

### 共有キーフレーム (sweepX/barPulse/hotPulse/recBreathe)
```css
/* ── v2演出レイヤーの共有キーフレーム (appv2motion.css の値そのまま) ── */
@keyframes sweepX { 0%, 55% { left: -60%; } 100% { left: 140%; } }
@keyframes barPulse {
  0%, 100% { transform: scaleY(0.82); filter: brightness(0.9); }
  50% { transform: scaleY(1.06); filter: brightness(1.12); }
}
@keyframes hotPulse { /* D2: 発光は銀 (2026-08-21) */
  0%, 100% { box-shadow: 0 0 14px rgba(191,207,237,.85), 0 0 4px rgba(191,207,237,.9); }
  50% { box-shadow: 0 0 26px rgba(191,207,237,1), 0 0 8px rgba(191,207,237,1); }
}
@keyframes recBreathe {
  0%, 100% { box-shadow: 0 12px 26px rgba(191,207,237,.35), 0 0 0 0 rgba(191,207,237,.35); }
  60% { box-shadow: 0 12px 26px rgba(191,207,237,.35), 0 0 0 16px rgba(191,207,237,0); }
}
```

### D3 RECの呼吸 (クラス適用式)
```css
/* D3 RECボタンの呼吸 (2026-08-21 適用)。キーフレームは上の recBreathe (銀) */
.recBreathe {
  animation: recBreathe 2.4s ease-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .recBreathe { animation: none; }
}
```

### A1 オーロラ ・ A2 グレイン ・ F4 右上光彩 (body層)
```css
/* ── A群 ページ背景の演出 (2026-08-21 Tetsuo指示でアプリ適用。原本 uiv2/app.v2.motion.css 逐語) ──
   A1 オーロラの呼吸: 紺(左上)・金(右上)・紺(下部中央) 3層 radial ・ 18秒 alternate
   A2 フィルムグレイン: feTurbulence ・ opacity 5% ・ mix-blend overlay */
body { position: relative; }
body::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    /* F4 右上光彩 (原本 .scr::before: 420px円 right-170 top-140 = 中心 右-40,70) */
    radial-gradient(210px circle at calc(100% - 40px) 70px, rgba(72, 104, 182, 0.28), transparent 68%),
    radial-gradient(60% 45% at 18% 8%, rgba(35, 58, 120, 0.55), transparent 70%),
    radial-gradient(50% 40% at 85% 20%, rgba(163, 183, 219, 0.14), transparent 70%),
    radial-gradient(55% 45% at 50% 95%, rgba(35, 58, 120, 0.35), transparent 70%),
    linear-gradient(180deg, #0d1226, #080b17);
  animation: aurora 18s ease-in-out infinite alternate;
}
@keyframes aurora {
  0% { opacity: 0.85; transform: scale(1); }
  100% { opacity: 1; transform: scale(1.06); }
}
body::after {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.15; /* A2: 原本5% → 15% (2026-08-21 Tetsuo指示) */
  mix-blend-mode: overlay;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/></filter><rect width="220" height="220" filter="url(%23n)"/></svg>');
}
body > div { position: relative; z-index: 1; }
@keyframes sheenTxt { to { background-position: 220% 0; } }
@media (prefers-reduced-motion: reduce) {
  body::before { animation: none; }
}

/* F3補強 (リバイス9): 独自カードにも同じ立体の層 */
[data-anim="block"] {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 2px 6px rgba(4, 10, 28, 0.35),
    0 14px 34px -8px rgba(4, 10, 28, 0.55);
}

/* ── B群のカード翻案 (2026-08-21 Tetsuo指示・リバイス3) ──
   B1 浮遊: 独自カード (data-anim=block) も同じ 7s/-7px/奇数-3.5s (translate で合成)
   B3 縁グロー: 押下中に銀の外周ライン + 60px の銀グロー (ホバー→押下に翻案) */
```

### 出現演出の土台 (rv-boot ・ リング/バーのトランジション)
```css
/* ── 出現演出の部品 (モック app.v5.motion 相当・RevealMotion が制御) ── */
/* v3: 最初の描画から main を隠す (layout.tsx のインラインスクリプトが立てる)。
   モック同様「隠れた状態で始まり時差出現」を成立させるための土台。
   解除はエンジンの下ごしらえ完了時 or 2.5秒の保険タイマー */
html.rv-boot main { opacity: 0; }
@property --p { syntax: "<percentage>"; initial-value: 0%; inherits: false; }
/* v4: 原本 v3/v5 の値。待ち時間は「乗っている項目の出現時刻 (--base)」起点 */
html.rv-anim [data-anim="ring"] { transition: --p 1.5s cubic-bezier(0.2, 0.85, 0.25, 1) var(--rd, 450ms); }
html.rv-anim [data-anim="bar"] > i { width: 0 !important; transition: width 1.15s cubic-bezier(0.2, 0.85, 0.25, 1) calc(var(--base, 0ms) + 200ms); }
html.rv-anim [data-anim="bar"].rv-go > i { width: var(--w) !important; }
```
※ rv-boot を立てる起動スクリプトは app/layout.tsx のインライン script (UUIDパスのみ・保険2.5s)。

### E3' 上品な押下 + ホバー + 金フォーカスリング + reduced-motion
```css
/* E3' 上品な押下マイクロインタラクション (2026-08-21 リバイス8 ・ Tetsuo提供仕様に全面置換)
   ネイビー #16294F ×ゴールド #D9A93C。派手なリップル・過度な拡大・バウンド・発光は使わない。
   押下: 0.975倍 + 下1px + 影を弱め + わずかに暗く + 薄い金の光を約220msで内側に広げる。
   戻り: 約200msで滑らかに (ばね無し・CSS transition)。 */
button, [role="button"], a, .pressable {
  transition: transform 0.2s ease, opacity 0.2s ease, filter 0.2s ease, box-shadow 0.2s ease;
}
button, [role="button"], a, .pressable, summary, label[role="button"] {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
/* a も対象: transform は仕様上インライン文中リンクには効かず、ボタン風リンク(inline-flex/block)だけが沈む */
button:active:not(:disabled):not(.noPress),
[role="button"]:active:not(.noPress),
a:active:not(.noPress),
.pressable:active:not(.noPress) {
  transform: translateY(1px) scale(0.975);
  filter: brightness(0.96);
  box-shadow: 0 1px 4px rgba(4, 10, 28, 0.35), inset 0 0 24px rgba(217, 169, 60, 0.18);
  transition: transform 0.06s ease, filter 0.06s ease, box-shadow 0.22s ease;
}
/* ホバー対応端末のみ: 上1px + わずかに明るく (押下より控えめ) */
@media (hover: hover) {
  button:hover:not(:disabled):not(.noPress):not(:active),
  [role="button"]:hover:not(.noPress):not(:active),
  a:hover:not(.noPress):not(:active),
  .pressable:hover:not(.noPress):not(:active) {
    transform: translateY(-1px);
    filter: brightness(1.04);
    box-shadow: 0 4px 14px rgba(4, 10, 28, 0.45);
  }
}
/* キーボードでも同じ手応え: フォーカスリングは外側2pxの金 */
:is(button, [role="button"], a, .pressable):focus-visible {
  outline: 2px solid #d9a93c;
  outline-offset: 2px;
}
/* 除外用: 既に transform を持つ / 絶対配置トグル等で崩れる要素に付与 */
.noPress:active { transform: none !important; opacity: 1 !important; filter: none !important; }
```

### 独自カード (data-anim="block") の立体 (F3補強)
```css
/* F3補強 (リバイス9): 独自カードにも同じ立体の層 */
[data-anim="block"] {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 2px 6px rgba(4, 10, 28, 0.35),
    0 14px 34px -8px rgba(4, 10, 28, 0.55);
}
```

## 2. DS部品 (ds.module.css)

### ds.t 画面見出し (A3 光沢流れ + A4 光彩)
```css
.t {
  font-size: 27px;
  font-weight: 900;
  letter-spacing: 0.01em;
  padding: 6px 2px 0;
  color: var(--text-ink);
  /* A3 見出しの光沢流れ + A4 金の光彩 (2026-08-21 Tetsuo指示でアプリ適用。原本 .gallery-title) */
  text-shadow: 0 2px 30px rgba(163, 183, 219, 0.25);
  background: linear-gradient(100deg, #edf1fa 30%, #d5e1f6 50%, #edf1fa 70%);
  background-size: 220% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: sheenTxt 8s linear infinite;
}
/* CSSモジュールは animation 名をスコープするため、参照する全キーフレームを同じファイルに置く。
   (globals の同名定義を参照しても解決されず、v2装飾層が沈黙していた真因 2026-08-21) */
@keyframes sheenTxt {
  to { background-position: 220% 0; }
}
@keyframes sweepX { 0%, 55% { left: -60%; } 100% { left: 140%; } }
@keyframes barPulse {
  0%, 100% { transform: scaleY(0.82); filter: brightness(0.9); }
  50% { transform: scaleY(1.06); filter: brightness(1.12); }
}
@keyframes hotPulse {
  0%, 100% { box-shadow: 0 0 14px rgba(191, 207, 237, 0.85), 0 0 4px rgba(191, 207, 237, 0.9); }
  50% { box-shadow: 0 0 26px rgba(191, 207, 237, 1), 0 0 8px rgba(191, 207, 237, 1); }
}
@media (prefers-reduced-motion: reduce) {
  .t { animation: none; }
}
```

### ds.card (F3グラデ + 立体3層)
```css
.card {
  background: linear-gradient(180deg, var(--card-a) 0%, var(--card-b) 100%);
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 16px;
  margin-top: 14px;
  /* F3補強 (2026-08-21 Tetsuo指示「のっぺりして高級感がない」・リバイス9):
     上辺1pxのハイライト + 近影/深影の二層で立体に。色は変えず光と影のみ */
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 2px 6px rgba(4, 10, 28, 0.35),
    0 14px 34px -8px rgba(4, 10, 28, 0.55);
}
```

### 葉の部品 (chk/todo/bigN/pill/bar/arrow/stars)
```css
.chk {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  flex: none;
}
.chk svg {
  width: 13px;
  height: 13px;
}
.chk.gold { background: rgba(232, 178, 60, 0.16); }
.chk.gold svg { stroke: var(--gold); }
.chk.teal { background: rgba(127, 196, 196, 0.16); }
.chk.teal svg { stroke: var(--teal); }
.chk.green { background: rgba(168, 201, 127, 0.16); }
.chk.green svg { stroke: var(--green-soft); }
.chk.pink { background: rgba(232, 155, 168, 0.16); }
.chk.pink svg { stroke: var(--pink-soft); }

.todo {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #0e1830;
  border: 1px solid rgba(150, 175, 225, 0.1);
  color: var(--text-muted);
  font-size: 10.5px;
  font-weight: 800;
  display: grid;
  place-items: center;
  flex: none;
  font-variant-numeric: tabular-nums;
}

.bigN {
  color: var(--cream);
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
  text-shadow: 0 0 24px rgba(255, 243, 220, 0.28); /* v2: クリーム数字の淡いグロー */
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 800;
  border-radius: 999px;
  padding: 4px 11px;
}
.pill.gold { background: rgba(232, 178, 60, 0.15); color: var(--gold); }
.pill.teal { background: rgba(127, 196, 196, 0.15); color: var(--teal); }
.pill.pink { background: rgba(232, 155, 168, 0.15); color: var(--pink-soft); }
.pill.mute { background: rgba(150, 175, 225, 0.12); color: var(--text-sub); }
.pill.ink {
  background: #0e1830;
  color: var(--gold);
  border: 1px solid rgba(232, 178, 60, 0.35);
  position: relative;
  overflow: hidden;
}
/* v2: 金要素の光沢スイープ */
.pill.ink::after {
  content: "";
  position: absolute;
  top: -10%;
  bottom: -10%;
  left: -60%;
  width: 40%;
  background: linear-gradient(100deg, transparent, rgba(255, 255, 255, 0.5), transparent);
  transform: skewX(-18deg);
  animation: sweepX 3.4s ease-in-out infinite;
}

.bar {
  height: 7px;
  border-radius: 5px;
  background: rgba(150, 175, 225, 0.14);
  overflow: hidden;
}
.bar i {
  display: block;
  height: 100%;
  border-radius: 5px;
  position: relative;
  overflow: hidden;
}
/* v2: 進捗バーに流れる光 */
.bar i::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(100deg, transparent 30%, rgba(255, 255, 255, 0.35), transparent 70%);
  animation: sweepX 2.8s ease-in-out infinite;
}
.bar.gold i { background: linear-gradient(90deg, #f0c25c, var(--gold-2)); }
.bar.teal i { background: var(--teal); }
.bar.green i { background: var(--green-soft); }
.bar.pink i { background: var(--pink-soft); }

.arrow {
  color: var(--gold);
  font-weight: 900;
}

.stars {
  color: var(--gold);
  font-size: 12px;
  letter-spacing: 2px;
}
.stars s {
  color: #31406a;
  text-decoration: none;
}
```

### ring / letter / wave / cta
```css
/* リング進捗 (conic)。--p を 0%→目標% にすると描画が進む */
.ring {
  border-radius: 50%;
  background: conic-gradient(var(--gold) var(--p, 0%), rgba(150, 175, 225, 0.14) 0);
  display: grid;
  place-items: center;
}
.ring .in {
  width: 78%;
  height: 78%;
  border-radius: 50%;
  background: var(--card-b);
  display: grid;
  place-items: center;
  text-align: center;
}

/* 手紙カード (uiv2 .letter + v2の金縁グロー)。暗地に1枚だけ明るい紙 */
.letter {
  background: linear-gradient(180deg, #fff9ec, var(--cream));
  color: #43351b;
  border-radius: 18px;
  padding: 16px 18px;
  margin-top: 14px;
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(217, 169, 60, 0.18),
    0 0 44px rgba(255, 243, 220, 0.07);
}
.letter .from {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.12em;
  color: #a9833b;
  margin-bottom: 7px;
}
.letter p {
  font-size: 13.5px;
  line-height: 1.9;
  font-weight: 600;
}

/* 波形バーの律動 (v2 barPulse/hotPulse)。.wave の中の i に適用 */
.wave i {
  transform-origin: center;
  animation: barPulse 2.6s ease-in-out infinite;
  animation-delay: calc(var(--i, 0) * -0.22s);
}
.wave i.hot {
  animation: barPulse 2.6s ease-in-out infinite, hotPulse 1.8s ease-in-out infinite;
  animation-delay: calc(var(--i, 0) * -0.22s), 0s;
}
```

## 3. エンジン (ファイルが正本)

- **出現の時間軸 (C群+v5)**: app/components/RevealMotion.tsx
  — 定数 GAP_ITEM=95 / LEAD_IN=170 / GAP_BLOCK=130 / CAP=3200。
  対象=h1 ・ ds.card/seg/letter ・ data-anim=block。項目= card直下+data-anim=items。
  葉の遅延 (★240+105n ・ チェック130/260 ・ 番号150 ・ ピル170+70n ・ バー/リング200 ・ 数字230 ・
  折れ線230/節点380+185n) はエンジン内CSSに記載。再生手順は原本v5 reset/play と1対1
- **B2チルト + B4ベゼル**: 廃止 (B4=2026-08-28 / B2=2026-08-29 Tetsuo指示)。DeviceMotion.tsx は削除済み
- **非同期ボタン**: app/components/AppButton.tsx (二重送信防止/処理中/完了/エラー)

## 4. シェルに紐づくもの

- D5 タブグロー: app/[userId]/components/BottomTabs.module.css (.active svg drop-shadow 銀)
- ヘッダー: 背景 .35+blur (F4光彩が透ける)
