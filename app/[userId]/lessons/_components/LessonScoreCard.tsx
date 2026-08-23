"use client"

// レッスン譜面カード (図解モーション要件v1.0 Part C・実装指示書v1.2 §4)
//
// - 描画はOSMD+MusicXML原本。教材データJSONの lessonScores は描画に使わず、
//   ハイライト規則・補筆記号の正としてのみ参照する (指示書§0-2)
// - 拍子記号(4/4)は非表示 (C-1)
// - 緑丸ハイライト4規則 (C-5・JSON _meta.hiRules):
//     hiAll   = 弓系8本 + ds_seq + mordent → 全音符(休符除く)に各1円
//     hiLast  = harmonics/pos2..6 → 到達音(最右)のみ
//     hiChord = ds3/6/8/10 → 和音の音 (符頭+符幹を包含する拡大円)
//     default = 技術記号付き先頭音。23教材では先頭音と等価(trill/gliss/vibrato)
// - 補筆 (C-6・JSON _meta.editorialFlags): プラル/モル装飾・ハーモニクス○・pizz. は
//   MusicXML未記載のため表示側で暫定付与。**再書き出し版受領後はEDITORIALから削除し
//   原本タグから抽出に切り替えること**
// - OSMD標準挙動で満たされる項目(符幹方向・重音符幹・スラー・装飾)は追加実装しない

import { useEffect, useRef, useState } from "react"
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay"
import { lessonFingerNumbers } from "../_lib/content"
import styles from "../lessons.module.css"

// ポジション移動レッスンで弾く弦 (すべてA線の音階練習)。指番号の上に表示する
const POSITION_STRING: Record<string, string> = {
  pos2: "A", pos3: "A", pos4: "A", pos5: "A", pos6: "A",
}

const HI_ALL = new Set([
  "staccato", "bow_staccato", "spiccato", "ricochet", "tremolo", "portato",
  "slur", "pizzicato", "ds_seq", "mordent",
])
const HI_LAST = new Set(["harmonics", "pos2", "pos3", "pos4", "pos5", "pos6"])
const HI_CHORD = new Set(["ds3", "ds6", "ds8", "ds10"])

/** 補筆 (再書き出し待ち教材のみ。受領後に削除。※glissはOSMDが線を描かない場合表示側継続) */
const EDITORIAL: Record<
  string,
  Array<{ noteIndex: number; kind: "pral" | "mor" | "harm" | "pizz" | "gliss" | "trill" }>
> = {
  mordent: [
    { noteIndex: 0, kind: "pral" },
    { noteIndex: 1, kind: "mor" },
  ],
  harmonics: [{ noteIndex: -1, kind: "harm" }], // -1 = 最終音
  pizzicato: [{ noteIndex: 0, kind: "pizz" }],
  glissando: [{ noteIndex: 0, kind: "gliss" }], // 先頭音→次音への斜線+gliss.表記
  trill: [{ noteIndex: 0, kind: "trill" }], // 先頭音の上に "tr" + 波線 (MusicXML未記載)
}

const HI_COLOR = "#2EAD5B"

type NoteEntry = { els: SVGGraphicsElement[]; chordEl: SVGGraphicsElement | null }

export default function LessonScoreCard({
  buildUrl,
  lessonId,
  hi,
  className,
}: {
  buildUrl: string
  lessonId: string
  /** 緑丸ハイライトを描くか (S1/導入=true、S5下段/弾く画面=false) */
  hi: boolean
  className?: string
}) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let disposed = false
    const osmd = new OpenSheetMusicDisplay(host, {
      autoResize: false,
      backend: "svg",
      drawTitle: false,
      drawPartNames: false,
      pageFormat: "Endless",
      drawingParameters: "compacttight",
    })
    ;(async () => {
      // ① 譜面読込 (署名URLのfetchは一過性の失敗があり得るのでリトライ)
      let loaded = false
      for (let attempt = 0; attempt < 3 && !disposed; attempt++) {
        try {
          await osmd.load(buildUrl)
          loaded = true
          break
        } catch (e) {
          console.error(`[lesson] score load failed (attempt ${attempt + 1}/3):`, e)
          await new Promise((r) => setTimeout(r, 400 * (attempt + 1)))
        }
      }
      if (disposed) return
      if (!loaded) {
        setFailed(true)
        return
      }
      // ② 描画
      try {
        // 拍子記号(4/4)非表示 (Part C C-1)。テンポ表記もプロト準拠で非表示
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(osmd.EngravingRules as any).RenderTimeSignatures = false
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(osmd.EngravingRules as any).MetronomeMarksDrawn = false
        osmd.zoom = 0.35
        osmd.render()
      } catch (e) {
        console.error("[lesson] score render failed:", e)
        setFailed(true)
        return
      }
      // ③ 装飾(緑丸・補筆・スタッカート点の退避)。ブラウザのgetBBox挙動差やタイミングで
      //    例外があり得るが、失敗しても描画済みの譜面は絶対に消さない
      //    (2026-07-13: 本番でスコアが表示されない不具合対策)
      try {
        decorate(osmd, host, lessonId, hi)
      } catch (e) {
        console.error("[lesson] score decorate failed:", e)
      }
    })()
    return () => {
      disposed = true
      host.innerHTML = ""
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildUrl, lessonId, hi])

  return (
    <div ref={hostRef} className={className ?? styles.osmdCardBox}>
      {failed && <span style={{ fontSize: "1.4cqh", color: "var(--text-muted)" }}>楽譜がうまく開けなかったよ</span>}
    </div>
  )
}

/** OSMDのカーソルから音符要素列を収集 (休符除外・和音は同エントリにまとめる)
 *
 * 和音(重音)は cursor.GNotesUnderCursor() が符頭を別々のステップで返すことがあり、
 * それに頼ると重音の2符頭を1エントリにまとめられず片方しか囲めない。そこで
 * 描画済みDOMの `g.vf-stavenote` (VexFlowの音符グループ) 単位でまとめ、その中の
 * `.vf-notehead` を全て els に入れる。これで重音は必ず両符頭を1エントリに持つ。 */
function collectNotes(osmd: OpenSheetMusicDisplay): NoteEntry[] {
  const entries: NoteEntry[] = []
  const seen = new Set<Element>()
  const cursor = osmd.cursor
  cursor.reset()
  const guard = 500
  let steps = 0
  while (!cursor.iterator.EndReached && steps++ < guard) {
    const gNotes = (cursor.GNotesUnderCursor() ?? []).filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (g: any) => g && g.sourceNote && !g.sourceNote.isRest(),
    )
    for (const g of gNotes) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const el = typeof (g as any).getSVGGElement === "function" ? (g as any).getSVGGElement() : null
      if (!el) continue
      const stave = (el.closest("g.vf-stavenote") as SVGGraphicsElement | null) ?? el
      if (seen.has(stave)) continue // 和音の2符頭目でstaveが重複 → 1エントリに集約
      seen.add(stave)
      const heads = [...stave.querySelectorAll(".vf-notehead")] as SVGGraphicsElement[]
      const els = heads.length > 0 ? heads : [el as SVGGraphicsElement]
      entries.push({ els, chordEl: stave === el ? null : stave })
    }
    cursor.next()
  }
  cursor.reset()
  cursor.hide()
  return entries
}

/** 緑丸 + 補筆を OSMD の svg 上へオーバーレイ */
function decorate(osmd: OpenSheetMusicDisplay, host: HTMLElement, lessonId: string, hi: boolean) {
  const svg = host.querySelector("svg")
  if (!svg) return
  const entries = collectNotes(osmd)
  if (entries.length === 0) return

  // 追加した装飾 (緑丸・補筆) を覚えておき、最後に viewBox クロップの範囲計算に使う
  const extra: SVGGraphicsElement[] = []

  // 符頭単体のbboxを返す (els[0]は符幹込みのg要素なので .vf-notehead を優先)。
  // これを取り違えると基準単位が符頭+符幹の高さ(≈符頭の4〜5倍)になり、緑丸が
  // 譜面全体より大きくなる (2026-07-12バグ修正)
  const headBBox = (el: SVGGraphicsElement): DOMRect => {
    const head = el.classList.contains("vf-notehead")
      ? el
      : (el.querySelector(".vf-notehead") as SVGGraphicsElement | null)
    return (head ?? el).getBBox()
  }

  // 基準単位 = 符頭の高さ (≈1譜線間隔)
  const nh = headBBox(entries[0].els[0]).height || 10

  const circleFor = (e: NoteEntry) => {
    // 符頭群 (単音=1個 / 和音=複数) を包む最小外接ボックスから円を作る。
    // 符幹は含めない — 含めると円が縦に伸びて符頭からずれる
    const boxes = e.els.map(headBBox)
    const minX = Math.min(...boxes.map((b) => b.x))
    const maxX = Math.max(...boxes.map((b) => b.x + b.width))
    const minY = Math.min(...boxes.map((b) => b.y))
    const maxY = Math.max(...boxes.map((b) => b.y + b.height))
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    if (e.els.length > 1) {
      // 重音: 符頭群を包含する拡大円 (C-5)
      const span = Math.hypot(maxX - minX, maxY - minY)
      return { cx, cy, r: span / 2 + nh * 0.7 }
    }
    return { cx, cy, r: nh * 1.5 }
  }
  const draw = (c: { cx: number; cy: number; r: number }) => {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "circle")
    el.setAttribute("cx", String(c.cx))
    el.setAttribute("cy", String(c.cy))
    el.setAttribute("r", String(c.r))
    el.setAttribute("fill", "none")
    el.setAttribute("stroke", HI_COLOR)
    el.setAttribute("stroke-width", String(nh * 0.36))
    svg.appendChild(el)
    extra.push(el)
  }

  // スタッカート点など小さな装飾記号が緑丸の線と重なるのを避け、緑丸の外側へ退避する
  // (2026-07-13 Tetsuo指摘)。ただし「スタッカート点は符幹の反対側」という記譜ルールは
  // 厳守 — OSMDが既に正しい側(符頭の上 or 下)に置いているので、その側のまま緑丸の外へ
  // 押し出す(上側の点は上へ / 下側の点は下へ)。フィンガリング数字・テヌート線・スラー等の
  // 大きい/横長の修飾は動かさない (点=ほぼ正方形の小さなbboxのみ対象)
  const clearDotFromCircle = (e: NoteEntry, c: { cx: number; cy: number; r: number }) => {
    const stave = e.chordEl ?? (e.els[0].closest("g.vf-stavenote") as SVGGraphicsElement | null)
    const mod = stave?.querySelector(".vf-modifiers") as SVGGraphicsElement | null
    if (!mod) return
    const mb = mod.getBBox()
    // 対象=スタッカート点(小さな点)・テヌート線(横長だが薄い)など「背の低い」記号のみ。
    // フィンガリング数字・トレモロの斜線など背の高い修飾は動かさない(高さで判定)
    if (mb.width === 0 || mb.height > nh * 0.8) return
    const nb = e.els[0].getBBox()
    const noteCy = nb.y + nb.height / 2
    const dotCy = mb.y + mb.height / 2
    const above = dotCy < noteCy // OSMDが置いた側(=符幹の反対側)を尊重
    const targetCy = above
      ? c.cy - c.r - nh * 0.4 - mb.height / 2 // 緑丸の上へ
      : c.cy + c.r + nh * 0.4 + mb.height / 2 // 緑丸の下へ
    const dy = targetCy - dotCy
    mod.setAttribute("transform", `translate(0 ${dy.toFixed(2)})`)
    extra.push(mod) // クロップ範囲に含める
  }
  const drawOn = (e: NoteEntry) => {
    // 円の座標計算・点退避は getBBox に依存し稀に例外があり得るので個別に握りつぶす
    // (1音分の装飾が失敗しても他の音・譜面表示は続行する)
    try {
      const c = circleFor(e)
      draw(c)
      clearDotFromCircle(e, c)
    } catch (err) {
      console.error("[lesson] highlight draw failed for a note:", err)
    }
  }

  if (hi) {
    if (HI_ALL.has(lessonId)) {
      for (const e of entries) drawOn(e)
    } else if (HI_LAST.has(lessonId)) {
      drawOn(entries[entries.length - 1])
    } else if (HI_CHORD.has(lessonId)) {
      const chord = entries.find((e) => e.els.length > 1) ?? entries[0]
      drawOn(chord)
    } else {
      drawOn(entries[0]) // default: 技術記号付き先頭音 (23教材では先頭音と等価)
    }
  }

  // 譜面(音符+音部記号)の最上端。pizz./tr など上部の記号を五線に被らせないための基準
  const topCandidates = entries.flatMap((en) => en.els.map((el) => el.getBBox().y))
  const clefEl = svg.querySelector(".vf-clef") as SVGGraphicsElement | null
  if (clefEl) topCandidates.push(clefEl.getBBox().y)
  const staffTop = topCandidates.length ? Math.min(...topCandidates) : 0

  // ── トレモロの演奏記号 (符幹に斜線)。build_scoreに未記載のため補筆 (2026-07-13) ──
  if (lessonId === "tremolo") {
    for (const e of entries) {
      try {
        const stave = e.chordEl ?? (e.els[0].closest("g.vf-stavenote") as SVGGraphicsElement | null)
        const stem = stave?.querySelector(".vf-stem") as SVGGraphicsElement | null
        if (!stem) continue
        const sb = stem.getBBox()
        const cx = sb.x + sb.width / 2
        const midY = sb.y + sb.height * 0.45
        for (let k = 0; k < 3; k++) {
          const y = midY + (k - 1) * nh * 0.5
          const p = document.createElementNS("http://www.w3.org/2000/svg", "path")
          p.setAttribute("d", `M ${cx - nh * 0.55},${y + nh * 0.28} L ${cx + nh * 0.55},${y - nh * 0.28}`)
          p.setAttribute("stroke", "#333")
          p.setAttribute("stroke-width", String(nh * 0.24))
          p.setAttribute("stroke-linecap", "round")
          svg.appendChild(p)
          extra.push(p)
        }
      } catch (err) {
        console.error("[lesson] tremolo mark failed:", err)
      }
    }
  }

  // ── 補筆 (C-6・再書き出し待ちの3教材のみ) ──
  for (const ed of EDITORIAL[lessonId] ?? []) {
   try {
    const e = entries[ed.noteIndex === -1 ? entries.length - 1 : ed.noteIndex]
    if (!e) continue
    const b = e.els[0].getBBox()
    const cx = b.x + b.width / 2
    const top = (e.chordEl ?? e.els[0]).getBBox().y
    const put = (node: SVGGraphicsElement) => {
      svg.appendChild(node)
      extra.push(node)
    }
    if (ed.kind === "pral" || ed.kind === "mor") {
      // 装飾波線 (プラルトリラー)。モルデントは+縦棒
      const my = top - nh * 1.2
      const w = nh * 0.45
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path")
      p.setAttribute(
        "d",
        `M ${cx - w * 2},${my} l ${w},${-w} l ${w * 1.2},${w * 1.2} l ${w},${-w} l ${w * 1.2},${w * 1.2} l ${w},${-w}`,
      )
      p.setAttribute("stroke", "#333")
      p.setAttribute("stroke-width", String(nh * 0.2))
      p.setAttribute("fill", "none")
      put(p)
      if (ed.kind === "mor") {
        const l = document.createElementNS("http://www.w3.org/2000/svg", "line")
        l.setAttribute("x1", String(cx))
        l.setAttribute("y1", String(my - nh * 0.8))
        l.setAttribute("x2", String(cx))
        l.setAttribute("y2", String(my + nh * 0.5))
        l.setAttribute("stroke", "#333")
        l.setAttribute("stroke-width", String(nh * 0.2))
        put(l)
      }
    } else if (ed.kind === "harm") {
      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle")
      c.setAttribute("cx", String(cx))
      c.setAttribute("cy", String(top - nh * 1.1))
      c.setAttribute("r", String(nh * 0.42))
      c.setAttribute("fill", "none")
      c.setAttribute("stroke", "#333")
      c.setAttribute("stroke-width", String(nh * 0.2))
      put(c)
    } else if (ed.kind === "gliss") {
      // 次音への斜線 + 線上に回転させた "gliss." (プロトタイプ rSlide 準拠)
      const nextIdx = (ed.noteIndex === -1 ? entries.length - 1 : ed.noteIndex) + 1
      const e2 = entries[nextIdx]
      if (!e2) continue
      // 符頭単体のbboxを基準にする (els[0]は符幹込みのことがあるため .vf-notehead を優先)
      const headOf = (el: SVGGraphicsElement) => {
        if (el.classList.contains("vf-notehead")) return el
        return (el.querySelector(".vf-notehead") as SVGGraphicsElement | null) ?? el
      }
      const nb1 = headOf(e.els[0]).getBBox()
      const nb2 = headOf(e2.els[0]).getBBox()
      const hh = Math.min(nb1.height, nb2.height) || nh * 0.25 // ≈1譜線間隔
      // 符頭中心±パッドを結ぶ (プロトタイプの cx±9 相当)
      const x1 = nb1.x + nb1.width + hh * 0.5
      const y1 = nb1.y + nb1.height / 2 + hh * 0.3
      const x2 = nb2.x - hh * 0.5
      const y2 = nb2.y + nb2.height / 2 - hh * 0.3
      const l = document.createElementNS("http://www.w3.org/2000/svg", "line")
      l.setAttribute("x1", String(x1))
      l.setAttribute("y1", String(y1))
      l.setAttribute("x2", String(x2))
      l.setAttribute("y2", String(y2))
      l.setAttribute("stroke", "#333")
      l.setAttribute("stroke-width", String(hh * 0.4))
      put(l)
      const gmx = (x1 + x2) / 2
      const gmy = (y1 + y2) / 2
      const ga = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI
      const t = document.createElementNS("http://www.w3.org/2000/svg", "text")
      t.setAttribute("x", String(gmx))
      t.setAttribute("y", String(gmy - hh * 1.3))
      t.setAttribute("text-anchor", "middle")
      t.setAttribute("font-size", String(hh * 2.4))
      t.setAttribute("font-style", "italic")
      t.setAttribute("font-weight", "700")
      t.setAttribute("font-family", "serif")
      t.setAttribute("fill", "#333")
      t.setAttribute("transform", `rotate(${ga.toFixed(1)} ${gmx} ${gmy})`)
      t.textContent = "gliss."
      put(t)
    } else if (ed.kind === "pizz") {
      const t = document.createElementNS("http://www.w3.org/2000/svg", "text")
      t.setAttribute("x", String(cx))
      // 五線に重ならないよう上方に退避 (2026-07-13)
      t.setAttribute("y", String(staffTop - nh * 0.8))
      t.setAttribute("text-anchor", "middle")
      t.setAttribute("font-size", String(nh * 1.15))
      t.setAttribute("font-style", "italic")
      t.setAttribute("font-weight", "700")
      t.setAttribute("font-family", "serif")
      t.setAttribute("fill", "#333")
      t.textContent = "pizz."
      put(t)
    } else if (ed.kind === "trill") {
      // 音符の上に "tr" + 波線 (プロトタイプ renderScore の n.trl 準拠)。五線に重ならないよう上方へ
      const ty = staffTop - nh * 0.4
      const t = document.createElementNS("http://www.w3.org/2000/svg", "text")
      t.setAttribute("x", String(cx - nh * 0.7))
      t.setAttribute("y", String(ty))
      t.setAttribute("font-size", String(nh * 1.15))
      t.setAttribute("font-style", "italic")
      t.setAttribute("font-weight", "800")
      t.setAttribute("font-family", "serif")
      t.setAttribute("fill", "#333")
      t.textContent = "tr"
      put(t)
      const w = nh * 0.38
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path")
      p.setAttribute(
        "d",
        `M ${cx + nh * 0.5},${ty - nh * 0.35} l ${w},${-w * 0.7} l ${w},${w * 0.7} l ${w},${-w * 0.7} l ${w},${w * 0.7}`,
      )
      p.setAttribute("stroke", "#333")
      p.setAttribute("stroke-width", String(nh * 0.16))
      p.setAttribute("fill", "none")
      put(p)
    }
   } catch (err) {
    console.error("[lesson] editorial mark failed:", err)
   }
  }

  // ── ポジション移動レッスン: 指番号 + 弾く弦を補筆 (2026-07-14 Tetsuo指示) ──
  //    build_scoreに運指が無いため lessonScores の fg を音符順で対応付ける。
  //    各音符の上に「弦名(上)/指番号(下)」を積んで表示する。
  const posString = POSITION_STRING[lessonId]
  if (posString) {
    const fingerings = lessonFingerNumbers(lessonId)
    const putText = (
      cx: number, y: number, text: string, size: number, fill: string, weight = "800",
    ) => {
      const t = document.createElementNS("http://www.w3.org/2000/svg", "text")
      t.setAttribute("x", String(cx))
      t.setAttribute("y", String(y))
      t.setAttribute("text-anchor", "middle")
      t.setAttribute("font-size", String(size))
      t.setAttribute("font-weight", weight)
      t.setAttribute("font-family", "inherit")
      t.setAttribute("fill", fill)
      t.textContent = text
      svg.appendChild(t)
      extra.push(t)
    }
    entries.forEach((e, i) => {
      const fg = fingerings[i]
      if (!fg) return
      try {
        const hb = headBBox(e.els[0])
        const cx = hb.x + hb.width / 2
        // その音符の緑丸(r≈nh*1.5)より上に置くための最上端
        const noteTop = hb.y - nh * 1.6
        const fingerY = noteTop - nh * 0.6
        const stringY = fingerY - nh * 1.5
        putText(cx, stringY, `${posString}線`, nh * 1.1, "#2563cb") // 弦名(上・青)
        putText(cx, fingerY, fg, nh * 1.5, "#333") // 指番号(下)
      } catch (err) {
        console.error("[lesson] fingering mark failed:", err)
      }
    })
  }

  // ── viewBox を音楽コンテンツ+装飾にクロップして中央寄せ (2026-07-12) ──
  // OSMD(Endless)は五線を固定幅で描くため短いフレーズだと右側が空白になり左寄せに
  // 見える。譜表・音符・補筆・緑丸の外接矩形に viewBox を合わせ、SVGをカードいっぱいに
  // preserveAspectRatio="xMidYMid meet" で拡大・中央配置する。
  // 失敗しても譜面自体は表示継続 (SVGは描画済み)
  try {
    cropAndCenter(svg, host, extra)
  } catch (err) {
    console.error("[lesson] cropAndCenter failed:", err)
  }
}

/** 音楽コンテンツ(音部記号・音符)と装飾の外接矩形に viewBox を合わせ、中央配置する */
function cropAndCenter(svg: SVGSVGElement, host: HTMLElement, extra: SVGGraphicsElement[]) {
  // 五線(全幅に伸びる)は含めず、音部記号・符頭・符幹・補筆・緑丸だけで範囲を取る
  const marks: SVGGraphicsElement[] = [
    ...(svg.querySelectorAll("g.vf-clef, g.vf-stavenote") as NodeListOf<SVGGraphicsElement>),
    ...extra,
  ]
  if (marks.length === 0) return
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const m of marks) {
    const b = m.getBBox()
    if (b.width === 0 && b.height === 0) continue
    minX = Math.min(minX, b.x)
    minY = Math.min(minY, b.y)
    maxX = Math.max(maxX, b.x + b.width)
    maxY = Math.max(maxY, b.y + b.height)
  }
  if (!Number.isFinite(minX)) return
  // 五線が音符の左右に少しはみ出す分の余白 + 上下の記号余白
  const padX = (maxY - minY) * 0.12
  const padY = (maxY - minY) * 0.08
  const vbX = minX - padX
  const vbY = minY - padY
  const vbW = maxX - minX + padX * 2
  const vbH = maxY - minY + padY * 2
  svg.setAttribute("viewBox", `${vbX} ${vbY} ${vbW} ${vbH}`)
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet")
  // カードいっぱいに拡大して中央配置。OSMDは host 内に中間ラッパーdivを挟み、それが
  // 内容サイズ(小さい)になるため、host→ラッパー→svg の全段を 100% に開放する
  // (CSSの max-width/height は縮小しかしないため inline style で上書き)。
  // viewBox外に伸びる五線を隠すため overflow:hidden
  for (let el: HTMLElement | null = svg.parentElement; el && el !== host; el = el.parentElement) {
    el.style.width = "100%"
    el.style.height = "100%"
  }
  svg.style.width = "100%"
  svg.style.height = "100%"
  svg.style.overflow = "hidden"
}
