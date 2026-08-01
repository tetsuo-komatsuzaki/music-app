"use client"

// 記号ガイド (2026-07-25)
// 譜面に出てくる記号・技法をチップで並べ、タップすると意味と弾き方を出す。
// 譜面上の音符を直接タップして調べるモード (tapMode) は scoreDetail 側が制御し、
// タップされた note_index を openNote で渡してくる。
//
// ハイライトは #osmd-container の音符要素に filter を直接当てる (AnnotationLayer と同方式)。
// OSMD 再描画で要素が差し替わるため、noteElementsVersion 変化時にクリアする。

import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import type { ScoreSymbol, SymbolGlyphKind } from "@/app/_libs/scoreSymbols"
import styles from "./SymbolGuide.module.css"

const HL_FILTER = "drop-shadow(0 0 4px #f0a020) drop-shadow(0 0 9px rgba(240,160,32,.75))"

// 記号のグリフ。AnnotationLayer の記譜スタンプと同じ描き方に揃えている。
export function SymbolGlyph({ glyph, value }: { glyph: SymbolGlyphKind; value?: string }) {
  const svg = (inner: React.ReactNode, extra?: { fill?: string }) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill={extra?.fill ?? "none"}
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{inner}</svg>
  )
  const txt = (t: string, style?: React.CSSProperties) => <span className={styles.gTxt} style={style}>{t}</span>

  switch (glyph) {
    case "staccato": return svg(<circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" />)
    case "staccatissimo": return svg(<path d="M9.5 6 H14.5 L12 17 Z" fill="currentColor" stroke="none" />)
    case "accent": return svg(<path d="M6 8 L18 12 L6 16" />)
    case "marcato": return svg(<path d="M7 17 L12 6 L17 17" />)
    case "tenuto": return svg(<path d="M5 12 H19" />)
    case "portato": return svg(<><path d="M5 15 Q12 9 19 15" /><circle cx="12" cy="18.5" r="1.8" fill="currentColor" stroke="none" /></>)
    case "spiccato": return svg(<><circle cx="7" cy="14" r="1.8" fill="currentColor" stroke="none" /><circle cx="12" cy="11" r="1.8" fill="currentColor" stroke="none" /><circle cx="17" cy="14" r="1.8" fill="currentColor" stroke="none" /></>)
    case "harmonic": return svg(<circle cx="12" cy="12" r="5.6" strokeWidth="1.9" />)
    case "openstring": return svg(<circle cx="12" cy="12" r="5.6" strokeWidth="1.9" />)
    case "upbow": return svg(<path d="M7 6 L12 17 L17 6" />)
    case "downbow": return svg(<path d="M5 6 H19 V15 H16 V9 H8 V15 H5 Z" fill="currentColor" stroke="none" />)
    case "pizz": return txt("pizz.", { fontStyle: "italic", fontSize: 11 })
    case "snappizz": return svg(<><circle cx="12" cy="14" r="4.6" strokeWidth="1.8" /><path d="M12 9.4 V3.5" strokeWidth="1.8" /></>)
    case "lhpizz": return svg(<path d="M12 6 V18 M6 12 H18" />)
    case "breath": return svg(<path d="M13 6 C13 10 10 11 9 14 C12 12 15 12 14 7" />)
    case "trill": return txt("tr", { fontStyle: "italic", fontFamily: "Georgia,serif", fontWeight: 800 })
    case "mordent": return svg(<path d="M4 14 L7 10 L10 14 L13 10 L16 14 L20 10" strokeWidth="1.8" />)
    case "turn": return svg(<path d="M4 14 Q6 8 10 12 Q14 16 18 12 Q20 10 20 10" strokeWidth="1.8" />)
    case "tremolo": return svg(<path d="M6 10 L18 6 M6 14 L18 10 M6 18 L18 14" strokeWidth="2.2" />)
    case "tie": return svg(<><path d="M5 11 Q12 18 19 11" /><circle cx="5" cy="9" r="1.6" fill="currentColor" stroke="none" /><circle cx="19" cy="9" r="1.6" fill="currentColor" stroke="none" /></>)
    case "slur": return svg(<><path d="M5 15 Q12 7 19 15" /><circle cx="5" cy="17" r="1.6" fill="currentColor" stroke="none" /><circle cx="19" cy="17" r="1.6" fill="currentColor" stroke="none" /></>)
    case "chord": return svg(<><ellipse cx="12" cy="8.5" rx="4.2" ry="3.1" fill="currentColor" stroke="none" transform="rotate(-18 12 8.5)" /><ellipse cx="12" cy="16" rx="4.2" ry="3.1" fill="currentColor" stroke="none" transform="rotate(-18 12 16)" /></>)
    case "arpeggio": return svg(<path d="M12 19 Q8 16 12 13 Q16 10 12 7 Q8 5 12 3" strokeWidth="1.7" />)
    case "gliss": return svg(<><path d="M5 18 L19 6" strokeWidth="1.7" /><ellipse cx="4.5" cy="19" rx="2.6" ry="2" fill="currentColor" stroke="none" /><ellipse cx="19.5" cy="5" rx="2.6" ry="2" fill="currentColor" stroke="none" /></>)
    case "vibrato": return svg(<path d="M3 12 Q6 7 9 12 Q12 17 15 12 Q18 7 21 12" strokeWidth="1.8" />)
    case "shift": return svg(<><path d="M4 12 H18" strokeWidth="1.8" /><path d="M14 8 L19 12 L14 16" strokeWidth="1.8" /></>)
    case "grace": return svg(<><ellipse cx="9" cy="16" rx="3" ry="2.3" fill="currentColor" stroke="none" transform="rotate(-18 9 16)" /><path d="M11.6 15 V6" strokeWidth="1.5" /><path d="M6 12 L14 8" strokeWidth="1.5" /></>)
    case "fermata": return svg(<><path d="M4 15 A9 9 0 0 1 20 15" strokeWidth="1.8" /><circle cx="12" cy="13.5" r="1.5" fill="currentColor" stroke="none" /></>)
    case "tuplet": return txt(value ?? "3", { fontStyle: "italic", fontWeight: 800 })
    case "dotted": return svg(<><ellipse cx="10" cy="14" rx="4" ry="3" fill="currentColor" stroke="none" transform="rotate(-18 10 14)" /><circle cx="17.5" cy="14" r="1.8" fill="currentColor" stroke="none" /></>)
    case "rest": return svg(<path d="M8 5 L14 11 L9 13 L16 19" strokeWidth="2.1" />)
    case "dynamic": return txt(value ?? "f", { fontStyle: "italic", fontFamily: "Georgia,serif", fontWeight: 900 })
    case "cresc": return svg(<path d="M20 6 L4 12 L20 18" strokeWidth="1.8" />)
    case "dim": return svg(<path d="M4 6 L20 12 L4 18" strokeWidth="1.8" />)
    case "text": return txt("dolce", { fontStyle: "italic", fontSize: 9 })
    case "metronome": return txt("♩=", { fontWeight: 800, fontSize: 12 })
    case "finger": return txt("2", { fontWeight: 800 })
    case "string": return txt("Ⅲ", { fontWeight: 800 })
    case "key": return txt("♯♭", { fontWeight: 800, fontSize: 12 })
    case "time": return txt(value ?? "4/4", { fontWeight: 800, fontSize: 11 })
    case "accidental": return txt("♮", { fontWeight: 800, fontSize: 15 })
    case "clef": return txt("𝄞", { fontSize: 17 })
    case "ottava": return txt("8va", { fontStyle: "italic", fontSize: 10, fontWeight: 800 })
    case "repeat": return svg(<><path d="M6 5 V19" strokeWidth="2.4" /><path d="M10 5 V19" strokeWidth="1.4" /><circle cx="15" cy="9.5" r="1.6" fill="currentColor" stroke="none" /><circle cx="15" cy="14.5" r="1.6" fill="currentColor" stroke="none" /></>)
    case "segno": return txt("𝄋", { fontSize: 15 })
    case "barline": return svg(<><path d="M9 5 V19" strokeWidth="1.4" /><path d="M14 5 V19" strokeWidth="3" /></>)
    case "dashes": return svg(<path d="M3 12 H7 M10 12 H14 M17 12 H21" strokeWidth="2" />)
    case "sordino": return svg(<><path d="M7 4 V13 A5 5 0 0 0 17 13 V4" strokeWidth="1.8" /><path d="M5 20 H19" strokeWidth="1.8" /></>)
    case "tuning": return svg(<><path d="M6 4 V20 M12 4 V20 M18 4 V20" strokeWidth="1.4" /><path d="M3 9 H21" strokeWidth="2.2" /></>)
    case "beam": return svg(<><path d="M6 6 L18 4 V8 L6 10 Z" fill="currentColor" stroke="none" /><path d="M6 10 V19 M18 8 V17" strokeWidth="1.6" /></>)
    case "diamond": return svg(<path d="M12 6 L18 12 L12 18 L6 12 Z" strokeWidth="1.8" />)
    case "xhead": return svg(<path d="M7 7 L17 17 M17 7 L7 17" strokeWidth="2.2" />)
    case "timeC": return txt("C", { fontFamily: "Georgia,serif", fontWeight: 800, fontSize: 15 })
    case "ritard": return txt("rit.", { fontStyle: "italic", fontSize: 10, fontWeight: 800 })
    case "cue": return svg(<><ellipse cx="10" cy="15" rx="3.2" ry="2.4" fill="currentColor" stroke="none" transform="rotate(-18 10 15)" /><path d="M12.8 14 V7" strokeWidth="1.4" /></>)
    case "measure_repeat": return svg(<><path d="M6 18 L18 6" strokeWidth="2" /><circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none" /><circle cx="16" cy="16" r="1.5" fill="currentColor" stroke="none" /></>)
    case "tremolo2": return svg(<><ellipse cx="6" cy="17" rx="3.4" ry="2.6" fill="currentColor" stroke="none" /><ellipse cx="18" cy="7" rx="3.4" ry="2.6" fill="currentColor" stroke="none" /><path d="M8 13 L16 10 M8 16 L16 13" strokeWidth="2" /></>)
    case "arco": return txt("arco", { fontStyle: "italic", fontSize: 10 })
    case "sulpont": return txt("s.p.", { fontStyle: "italic", fontSize: 11 })
    case "sultasto": return txt("s.t.", { fontStyle: "italic", fontSize: 11 })
    case "collegno": return txt("legno", { fontStyle: "italic", fontSize: 8.5 })
    case "ghost": return svg(<><path d="M6 7 A6 6 0 0 1 18 7" strokeWidth="1.5" /><path d="M6 17 A6 6 0 0 0 18 17" strokeWidth="1.5" /><path d="M9 9 L15 15 M15 9 L9 15" strokeWidth="1.8" /></>)
    case "swing": return svg(<><ellipse cx="7" cy="16" rx="3" ry="2.3" fill="currentColor" stroke="none" /><ellipse cx="17" cy="14" rx="3" ry="2.3" fill="currentColor" stroke="none" /><path d="M9.6 15 V6 L19.6 4 V13" strokeWidth="1.5" /><path d="M9.6 6 L19.6 4" strokeWidth="2.4" /></>)
    case "doubledot": return svg(<><ellipse cx="8" cy="14" rx="3.6" ry="2.8" fill="currentColor" stroke="none" transform="rotate(-18 8 14)" /><circle cx="15" cy="14" r="1.6" fill="currentColor" stroke="none" /><circle cx="20" cy="14" r="1.6" fill="currentColor" stroke="none" /></>)
    case "voice": return svg(<><ellipse cx="8" cy="8" rx="3" ry="2.3" fill="currentColor" stroke="none" /><path d="M10.6 7.4 V2" strokeWidth="1.5" /><ellipse cx="16" cy="16" rx="3" ry="2.3" fill="currentColor" stroke="none" /><path d="M13.4 16.6 V22" strokeWidth="1.5" /></>)
    case "doubleacc": return txt("𝄪", { fontWeight: 800, fontSize: 15 })
    case "quarter": return txt("♯½", { fontWeight: 800, fontSize: 11 })
    case "lyric": return txt("La", { fontSize: 12, fontWeight: 700 })
    case "enharmonic": return txt("♯=♭", { fontWeight: 800, fontSize: 10 })
    case "finger_sub": return txt("2-3", { fontWeight: 800, fontSize: 10 })
    case "fall": return svg(<><ellipse cx="7" cy="9" rx="3.2" ry="2.5" fill="currentColor" stroke="none" /><path d="M10 11 Q15 12 18 19" strokeWidth="1.8" /></>)
    default: return txt("?")
  }
}

/** scoreDetail の譜面クリックハンドラから直接呼ぶための命令的API */
export type SymbolGuideHandle = { openForNote: (noteIndex: number) => void }

const CONTAINER_ID = "osmd-container"
// 目印の portal 先は「OSMD がクリアしない安定要素」= 譜面ラッパー
// ([data-onboarding="scoreDetail.scoreOverlay"], position:relative)。
// #osmd-container に portal すると OSMD の innerHTML='' 再描画で React が
// 管理ノードを見失い removeChild で全体クラッシュする (真因)。
const HOST_SELECTOR = '[data-onboarding="scoreDetail.scoreOverlay"]'
const getHost = (): HTMLElement | null =>
  typeof document === "undefined" ? null : document.querySelector<HTMLElement>(HOST_SELECTOR)

type Props = {
  userId: string
  symbols: ScoreSymbol[]
  byNote: Map<number, string[]>
  noteElementsRef: React.MutableRefObject<Element[]>
  noteElementsVersion: number
  /** 譜面タップで調べるモード */
  tapMode: boolean
  onTapModeChange: (v: boolean) => void
  ref?: React.Ref<SymbolGuideHandle>
}

export default function SymbolGuide({
  userId, symbols, byNote, noteElementsRef, noteElementsVersion,
  tapMode, onTapModeChange, ref,
}: Props) {
  const [sheet, setSheet] = useState<{ heading: string; items: ScoreSymbol[] } | null>(null)
  const [showMarks, setShowMarks] = useState(true)
  const litRef = useRef<HTMLElement[]>([])

  // 譜面に置く目印: 各記号の「最初に出てくる音符」に1つだけ付ける。
  // 全出現に付けるとスラーだらけの曲で譜面が埋まるため、代表位置のみ。
  // 残りの位置はシートの「譜面で光らせる」で確認できる。
  const marks = useMemo(
    () => symbols.filter((s) => s.noteIndices.length > 0)
      .map((s) => ({ sym: s, noteIndex: Math.min(...s.noteIndices) })),
    [symbols],
  )

  // 目印は譜面ラッパー(安定要素)にぶら下げる。#osmd-container は OSMD が
  // 再描画で innerHTML='' するため、そこへ React portal を挿すとクラッシュする。
  const overlayEl = getHost()

  // 位置は state に持たず、ref コールバックで直接 style を書く
  // (再描画のたびに state 更新が走るのを避けるため)。
  const markNodesRef = useRef<Map<string, { node: HTMLElement; noteIndex: number }>>(new Map())
  const placeMark = useCallback((node: HTMLElement | null, noteIndex: number) => {
    const host = getHost()
    const container = document.getElementById(CONTAINER_ID)
    const el = noteElementsRef.current[noteIndex] as HTMLElement | undefined
    if (!node || !host || !el || (container && !container.contains(el))) {
      if (node) node.style.display = "none"
      return
    }
    const h = host.getBoundingClientRect()
    // 符頭(玉)単体を狙う。el(g.vf-stavenote)は符幹込みで縦長なので、
    // その中の .vf-notehead を優先すると玉の中心・大きさが取れる
    // (LessonScoreCard と同方式)。玉を輪でかこう配置に使う。
    const head = (el.querySelector(".vf-notehead") as HTMLElement | null) ?? el
    const r = head.getBoundingClientRect()
    node.style.display = ""
    // 玉に少しだけ余白を足した円で「かこむ」。玉サイズに合わせて毎回調整。
    const d = Math.max(r.width, r.height) + 7
    node.style.width = `${d}px`
    node.style.height = `${d}px`
    node.style.left = `${r.left + r.width / 2 - h.left}px`
    node.style.top = `${r.top + r.height / 2 - h.top}px`
  }, [noteElementsRef])

  const repositionAll = useCallback(() => {
    markNodesRef.current.forEach(({ node, noteIndex }) => placeMark(node, noteIndex))
  }, [placeMark])

  // 譜面のサイズが変わったら (zoom / 端末回転 / フルスクリーン) 位置を取り直す
  useEffect(() => {
    if (!showMarks) return
    const container = document.getElementById(CONTAINER_ID)
    if (!container || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(() => repositionAll())
    ro.observe(container)
    container.addEventListener("scroll", repositionAll, { passive: true })
    return () => { ro.disconnect(); container.removeEventListener("scroll", repositionAll) }
  }, [showMarks, repositionAll, noteElementsVersion])

  const clearHighlight = useCallback(() => {
    litRef.current.forEach((el) => { el.style.filter = "" })
    litRef.current = []
  }, [])

  const highlight = useCallback((indices: number[]) => {
    clearHighlight()
    const els = noteElementsRef.current
    const lit: HTMLElement[] = []
    for (const i of indices) {
      const el = els[i] as HTMLElement | undefined
      if (!el) continue
      el.style.filter = HL_FILTER
      lit.push(el)
    }
    litRef.current = lit
    lit[0]?.scrollIntoView({ block: "center", behavior: "smooth" })
  }, [clearHighlight, noteElementsRef])

  // 譜面が再描画されたら参照が切れるのでハイライトを捨てる
  useEffect(() => { litRef.current = [] }, [noteElementsVersion])
  useEffect(() => clearHighlight, [clearHighlight])

  const openSymbol = useCallback((s: ScoreSymbol) => {
    setSheet({ heading: s.label, items: [s] })
    if (s.noteIndices.length > 0) highlight(s.noteIndices)
  }, [highlight])

  // 譜面タップ経由: その音符についている記号をまとめて出す
  useImperativeHandle(ref, () => ({
    openForNote: (noteIndex: number) => {
      const ids = byNote.get(noteIndex) ?? []
      const items = symbols.filter((s) => ids.includes(s.id))
      setSheet(items.length > 0
        ? { heading: `${noteIndex + 1}番目の音符の記号`, items }
        : { heading: "この音符に記号はないよ", items: [] })
      highlight([noteIndex])
    },
  }), [byNote, symbols, highlight])

  const close = () => { setSheet(null); clearHighlight() }

  if (symbols.length === 0) return null

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <span className={styles.lab}>この曲に出てくる記号</span>
        <span className={styles.spacer} />
        <button
          type="button"
          className={`${styles.tapToggle} ${showMarks ? styles.tapOn : ""}`}
          onClick={() => setShowMarks((v) => !v)}
          aria-pressed={showMarks}
        >
          譜面に目印
        </button>
        <button
          type="button"
          className={`${styles.tapToggle} ${tapMode ? styles.tapOn : ""}`}
          onClick={() => { onTapModeChange(!tapMode); if (tapMode) close() }}
          aria-pressed={tapMode}
        >
          {tapMode ? "譜面タップ：ON" : "譜面をタップして調べる"}
        </button>
      </div>

      <div className={styles.chips}>
        {symbols.map((s) => (
          <button key={s.id} type="button" className={styles.chip} onClick={() => openSymbol(s)}>
            <span className={styles.gWrap}><SymbolGlyph glyph={s.glyph} value={s.value} /></span>
            <span className={styles.chipLabel}>{s.label}</span>
            {s.value && s.glyph !== "dynamic" && s.glyph !== "tuplet" && (
              <span className={styles.chipValue}>{s.value}</span>
            )}
            {s.lessonId && <span className={styles.chipLesson}>学べる</span>}
          </button>
        ))}
      </div>

      {showMarks && overlayEl && createPortal(
        <div key={noteElementsVersion} className={styles.markLayer}>
          {marks.map((m) => (
            <button
              key={m.sym.id}
              type="button"
              className={styles.mark}
              title={m.sym.label}
              aria-label={`${m.sym.label}の説明を見る`}
              ref={(node) => {
                if (node) markNodesRef.current.set(m.sym.id, { node, noteIndex: m.noteIndex })
                else markNodesRef.current.delete(m.sym.id)
                placeMark(node, m.noteIndex)
              }}
              onClick={(e) => { e.stopPropagation(); openSymbol(m.sym) }}
            />


          ))}
        </div>,
        overlayEl,
      )}

      {tapMode && (
        <p className={styles.tapHint}>譜面の音符をタップすると、その音についている記号を説明するよ。</p>
      )}

      {sheet && (
        <div className={styles.overlay} onClick={close}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.grab} />
            <button type="button" className={styles.close} onClick={close} aria-label="閉じる">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
            <div className={styles.sheetHead}>{sheet.heading}</div>

            {sheet.items.length === 0 && (
              <p className={styles.none}>この音符には、とくべつな記号はついていないよ。</p>
            )}

            {sheet.items.map((s) => (
              <div key={s.id} className={styles.item}>
                <div className={styles.itemHead}>
                  <span className={styles.gBig}><SymbolGlyph glyph={s.glyph} value={s.value} /></span>
                  <div>
                    <div className={styles.itemName}>{s.label}</div>
                    {s.value && <div className={styles.itemValue}>{s.value}</div>}
                    {s.noteIndices.length > 0 && (
                      <div className={styles.itemCount}>この曲に {s.noteIndices.length}か所</div>
                    )}
                  </div>
                </div>
                <p className={styles.what}>{s.what}</p>
                {s.tip && <p className={styles.tip}><b>弾き方</b>{s.tip}</p>}
                <div className={styles.actions}>
                  {s.noteIndices.length > 0 && (
                    <button type="button" className={styles.act} onClick={() => highlight(s.noteIndices)}>
                      譜面で光らせる
                    </button>
                  )}
                  {s.lessonId && (
                    <Link href={`/${userId}/lessons/${s.lessonId}`} className={`${styles.act} ${styles.actPrimary}`}>
                      学びのレッスンで詳しく →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
