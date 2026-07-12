// 学びレッスン 仮図解SVG生成 (プロトタイプ v2.4 から移植)
// 絵は後日確定アセット(バイオリン全身図v7等)へ差し替え予定 — 生成器を差し替えれば済む分離。
// theme はカテゴリ色 (CATS[cat].theme) を呼び出し側から渡す。

const PAL = {
  wood: "#E8B87E",
  woodLine: "#8A5A33",
  dark: "#4A2A18",
  string: "#E9E2D0",
  err: "#E5484D",
}

const alp = (hex: string, a: number) =>
  hex + Math.round(a * 255).toString(16).padStart(2, "0")

export type BowFigOpts = {
  zone?: "tip" | "mid" | "frog" | "whole"
  dir?: "down" | "both"
  bounce?: boolean
  shake?: boolean
  throw_?: boolean
  press?: boolean
  cross?: boolean
}

/** 弓の図解: ゾーン強調 + 動きの記号 */
export function bowFig(o: BowFigOpts, theme: string): string {
  const t = theme
  const XT = 30, XF = 358, HY = 78, SY = 62
  const Z = (
    {
      tip: [XT, XT + 110],
      mid: [XT + 110, XT + 220],
      frog: [XT + 220, XF],
      whole: [XT, XF],
    } as Record<string, [number, number]>
  )[o.zone || "whole"]
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 130">`
  s += `<rect x="${Z[0]}" y="54" width="${Z[1] - Z[0]}" height="36" rx="8" fill="${alp(t, 0.25)}" stroke="${t}" stroke-width="2" stroke-dasharray="6 4"/>`
  s += `<line x1="${XT}" y1="${SY}" x2="${XF}" y2="${SY}" stroke="${PAL.woodLine}" stroke-width="5.5" stroke-linecap="round"/>`
  s += `<line x1="${XT}" y1="${HY}" x2="${XF}" y2="${HY}" stroke="#F5EFDC" stroke-width="5"/>`
  s += `<path d="M ${XT + 4},56 Q ${XT - 10},56 ${XT - 8},66 L ${XT - 2},${HY} L ${XT + 6},${HY} Z" fill="${PAL.woodLine}"/>`
  s += `<path d="M ${XF + 4},60 L ${XF - 26},60 L ${XF - 26},88 L ${XF - 6},88 Q ${XF + 4},88 ${XF + 4},74 Z" fill="${PAL.dark}"/>
      <rect x="${XF + 4}" y="58" width="12" height="8" rx="3" fill="#C9CDD3"/><rect x="${XF - 52}" y="58" width="22" height="7" rx="3" fill="#C9CDD3"/>`
  const cx = (Z[0] + Z[1]) / 2
  if (o.dir === "down")
    s += `<path d="M ${cx + 2},20 L ${cx + 2},34 M ${cx + 2},20 L ${cx + 18},20 L ${cx + 18},34" stroke="${PAL.dark}" stroke-width="4" fill="none"/><path d="M ${cx - 14},27 L ${cx - 52},27 M ${cx - 44},20 L ${cx - 52},27 L ${cx - 44},34" stroke="${t}" stroke-width="4" fill="none" stroke-linecap="round"/>`
  if (o.dir === "both")
    s += `<path d="M ${cx - 34},27 L ${cx + 34},27 M ${cx - 26},20 L ${cx - 34},27 L ${cx - 26},34 M ${cx + 26},20 L ${cx + 34},27 L ${cx + 26},34" stroke="${t}" stroke-width="4" fill="none" stroke-linecap="round"/>`
  if (o.bounce)
    for (let i = 0; i < 3; i++) {
      const bx = Z[0] + 18 + i * ((Z[1] - Z[0] - 36) / 2)
      s += `<path d="M ${bx},108 Q ${bx + 16},92 ${bx + 32},108" stroke="${t}" stroke-width="3.5" fill="none" stroke-dasharray="1 6" stroke-linecap="round"/>`
    }
  if (o.shake)
    s += `<path d="M ${cx - 30},104 l 12,0 m 6,0 l 12,0 m 6,0 l 12,0" stroke="${t}" stroke-width="4" stroke-linecap="round"/><path d="M ${cx - 34},98 L ${cx - 40},104 L ${cx - 34},110 M ${cx + 34},98 L ${cx + 40},104 L ${cx + 34},110" stroke="${t}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
  if (o.throw_)
    s += `<path d="M ${Z[0] + 8},96 Q ${cx},120 ${Z[1] - 8},96" stroke="${t}" stroke-width="3" fill="none" stroke-dasharray="2 5"/><circle cx="${Z[0] + 30}" cy="104" r="3" fill="${t}"/><circle cx="${cx}" cy="110" r="3" fill="${t}"/><circle cx="${Z[1] - 30}" cy="104" r="3" fill="${t}"/>`
  if (o.press)
    s += `<path d="M ${cx},18 L ${cx},40 M ${cx - 8},32 L ${cx},44 L ${cx + 8},32" stroke="${PAL.err}" stroke-width="5" fill="none" stroke-linecap="round"/>`
  if (o.cross)
    s += `<path d="M 178,42 l 44,46 M 222,42 l -44,46" stroke="${PAL.err}" stroke-width="6" stroke-linecap="round"/>`
  return s + `</svg>`
}

/** 五線の飾り図 (スライド1/5用の汎用イメージ。実フレーズは弾く画面でOSMD描画) */
export function staffFig(o: { hi?: boolean } = {}): string {
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 100">`
  for (let i = 0; i < 5; i++)
    s += `<line x1="30" y1="${30 + i * 10}" x2="380" y2="${30 + i * 10}" stroke="#9AA0A6" stroke-width="1.6"/>`
  s += `<text x="42" y="66" font-size="52" font-family="serif">&#x1D11E;</text>`
  const notes: Array<[number, number]> = [[130, 55], [180, 50], [230, 45], [280, 50], [330, 55]]
  for (const [x, y] of notes)
    s += `<ellipse cx="${x}" cy="${y}" rx="7" ry="5.5" fill="#333"/><line x1="${x + 6.5}" y1="${y - 1}" x2="${x + 6.5}" y2="${y - 28}" stroke="#333" stroke-width="2"/>`
  if (o.hi) s += `<circle cx="230" cy="41" r="18" fill="none" stroke="#2EAD5B" stroke-width="4"/>`
  return s + `</svg>`
}

export type FbFigOpts = {
  band?: [number, number]
  fingers?: Array<[number, number]>
  harm?: Array<[number, number]>
  arrow?: [number, number]
  wave?: boolean
  pluck?: boolean
  cross?: boolean
}

/** 指板の図解: 押さえる指・ポジション帯・動きの記号 */
export function fbFig(o: FbFigOpts, theme: string): string {
  const t = theme
  const SY = (i: number) => 96 - i * 17 // G=96..E=45
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 130">`
  s += `<path d="M 30,38 L 30,104 L 380,116 L 380,26 Z" fill="${PAL.dark}"/>
      <rect x="26" y="36" width="6" height="70" rx="2" fill="${PAL.wood}" stroke="${PAL.woodLine}" stroke-width="2"/>`
  if (o.band) {
    s += `<rect x="${o.band[0]}" y="20" width="${o.band[1] - o.band[0]}" height="102" rx="8" fill="${alp(t, 0.25)}" stroke="${t}" stroke-width="2" stroke-dasharray="6 4"/>`
  }
  for (let i = 0; i < 4; i++)
    s += `<line x1="32" y1="${SY(i) + 12}" x2="380" y2="${SY(i) + 12}" stroke="${PAL.string}" stroke-width="2.6"/>`
  for (const [si, fi] of o.fingers || []) {
    const x = 110 + fi * 26,
      y = SY(si) + 12
    s += `<circle cx="${x}" cy="${y}" r="11" fill="${t}"/><text x="${x}" y="${y + 5}" text-anchor="middle" font-size="14" font-weight="900" fill="#FFF" font-family="sans-serif">${fi}</text>`
  }
  for (const [si, fi] of o.harm || []) {
    const x = 110 + fi * 26,
      y = SY(si) + 12
    s += `<circle cx="${x}" cy="${y}" r="10" fill="#FFF" stroke="${t}" stroke-width="3.5"/>`
  }
  if (o.arrow)
    s += `<path d="M ${o.arrow[0]},14 L ${o.arrow[1] - 12},14" stroke="${t}" stroke-width="5" stroke-linecap="round"/><path d="M ${o.arrow[1] - 16},7 L ${o.arrow[1] - 4},14 L ${o.arrow[1] - 16},21 Z" fill="${t}"/>`
  if (o.wave)
    s += `<path d="M 150,120 q 8,-8 16,0 t 16,0 t 16,0" stroke="${t}" stroke-width="4" fill="none" stroke-linecap="round"/>`
  if (o.pluck)
    s += `<path d="M 236,26 Q 214,32 208,50 M 205,38 L 208,52 L 220,46" stroke="${t}" stroke-width="4" fill="none" stroke-linecap="round"/>`
  if (o.cross)
    s += `<path d="M 178,42 l 44,46 M 222,42 l -44,46" stroke="${PAL.err}" stroke-width="6" stroke-linecap="round"/>`
  return s + `</svg>`
}
