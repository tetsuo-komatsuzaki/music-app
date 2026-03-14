"use client"

import { useState, useRef, useEffect, useCallback,useMemo } from "react"
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay"
import * as Tone from "tone"
import styles from "./scoreDetail.module.css"
import UploadRecordModal from "@/app/[userId]/components/UploadRecordModal"

// =========================================================
// 型定義
// =========================================================

/** v2 正規化済みの比較結果（コンポーネント内で扱う唯一の型） */
type ComparisonNote = {
  note_index: number
  measure_number: number
  note_name: string
  pitch_ok: boolean | null
  start_ok: boolean | null
  pitch_cents_error: number | null
  start_diff_sec: number | null
  evaluation_status: "evaluated" | "pitch_only" | "not_evaluated" | "section_missing"
}

type PerformanceDTO = {
  id: string
  uploadedAt: string
  status: string
  audioUrl: string | null
  comparisonResult: any[] | null
  comparisonWarnings?: string[]
}

type AnalysisNote = {
  note_index: number
  type: string
  pitches: number[]
  start_time_sec: number
  end_time_sec: number
}

type Props = {
  score: { id: string; title: string }
  performances: PerformanceDTO[]
  analysis: { bpm: number; notes: AnalysisNote[] } | null
  buildUrl: string | null
  uploadAction: (formData: FormData) => Promise<any>
}

// =========================================================
// v1 → v2 正規化（D1: データ取得時点で統一）
// =========================================================

function normalizeComparison(raw: any[] | null): ComparisonNote[] | null {
  if (!raw || raw.length === 0) return null
  return raw.map((r) => ({
    note_index: r.note_index ?? 0,
    measure_number: r.measure_number ?? 0,
    note_name: r.note_name ?? "",
    pitch_ok: r.pitch_ok ?? null,
    start_ok: r.start_ok ?? null,
    pitch_cents_error: r.pitch_cents_error ?? null,
    start_diff_sec: r.start_diff_sec ?? null,
    evaluation_status: r.evaluation_status ?? "evaluated",
  }))
}

// =========================================================
// 色判定（コンポーネント外のpure function — B1対策）
// =========================================================

const COLOR_GREEN = "#22aa44"
const COLOR_ORANGE = "#ee8800"
const COLOR_RED = "#ee2222"
const COLOR_GREY = "#aaaaaa"
const COLOR_HIGHLIGHT = "#2266ff"

function getComparisonColor(r: ComparisonNote): string {
  if (r.evaluation_status === "not_evaluated" || r.evaluation_status === "section_missing") {
    return COLOR_GREY
  }
  if (r.pitch_ok === false) return COLOR_RED
  if (r.evaluation_status === "evaluated" && r.start_ok === false) return COLOR_ORANGE
  return COLOR_GREEN
}

// =========================================================
// 評価サマリー集計フック（A2: JSXからロジック抽出）
// =========================================================

type EvaluationSummary = {
  pitchRate: number
  timingRate: number
  perfectRate: number
  pitchCount: number
  timingCount: number
  notEvaluatedCount: number
}

function useEvaluationSummary(comparison: ComparisonNote[] | null): EvaluationSummary | null {
  return useMemo(() => {
    if (!comparison || comparison.length === 0) return null

    const pitchEvaluated = comparison.filter(
      (c) => c.evaluation_status === "evaluated" || c.evaluation_status === "pitch_only"
    )
    const timingEvaluated = comparison.filter(
      (c) => c.evaluation_status === "evaluated"
    )
    const pitchOk = pitchEvaluated.filter((c) => c.pitch_ok === true).length
    const timingOk = timingEvaluated.filter((c) => c.start_ok === true).length
    const perfect = timingEvaluated.filter(
      (c) => c.pitch_ok === true && c.start_ok === true
    ).length
    const notEvaluated = comparison.filter(
      (c) => c.evaluation_status === "not_evaluated" || c.evaluation_status === "section_missing"
    ).length

    return {
      pitchRate: pitchEvaluated.length > 0 ? Math.round((pitchOk / pitchEvaluated.length) * 100) : 0,
      timingRate: timingEvaluated.length > 0 ? Math.round((timingOk / timingEvaluated.length) * 100) : 0,
      perfectRate: timingEvaluated.length > 0 ? Math.round((perfect / timingEvaluated.length) * 100) : 0,
      pitchCount: pitchEvaluated.length,
      timingCount: timingEvaluated.length,
      notEvaluatedCount: notEvaluated,
    }
  }, [comparison])
}

// =========================================================
// SVGノート操作ヘルパー
// =========================================================

const ORIG_FILL = "origFill"
const ORIG_STROKE = "origStroke"

function colorizeNote(el: Element, color: string) {
  el.querySelectorAll("path").forEach((path) => {
    const fill = path.dataset[ORIG_FILL]
    if (fill && fill !== "none") path.setAttribute("fill", color)
    const stroke = path.dataset[ORIG_STROKE]
    if (stroke && stroke !== "none") path.setAttribute("stroke", color)
  })
}

function restoreNote(el: Element) {
  el.querySelectorAll("path").forEach((path) => {
    const f = path.dataset[ORIG_FILL]
    const s = path.dataset[ORIG_STROKE]
    if (f !== undefined) path.setAttribute("fill", f)
    if (s !== undefined) path.setAttribute("stroke", s)
  })
}

function saveOriginalColors(el: Element) {
  el.querySelectorAll("path").forEach((path) => {
    if (path.dataset[ORIG_FILL] === undefined) {
      path.dataset[ORIG_FILL] = path.getAttribute("fill") || ""
      path.dataset[ORIG_STROKE] = path.getAttribute("stroke") || ""
    }
  })
}

// =========================================================
// サブコンポーネント: EvaluationSummaryCard
// =========================================================

function EvaluationSummaryCard({
  summary,
  warnings,
}: {
  summary: EvaluationSummary
  warnings: string[]
}) {
  return (
    <div className={styles.card}>
      <h3>演奏評価</h3>
      <div className={styles.evalSummary}>
        {summary.pitchCount > 0 && (
          <div className={styles.evalRow}>
            <span className={styles.evalLabel}>音程正確率</span>
            <span className={styles.evalValue}>{summary.pitchRate}%</span>
          </div>
        )}
        {summary.timingCount > 0 && (
          <div className={styles.evalRow}>
            <span className={styles.evalLabel}>タイミング正確率</span>
            <span className={styles.evalValue}>{summary.timingRate}%</span>
          </div>
        )}
        {summary.timingCount > 0 && (
          <div className={styles.evalRow}>
            <span className={styles.evalLabel}>完全一致率</span>
            <span className={styles.evalValue}>{summary.perfectRate}%</span>
          </div>
        )}
        {summary.notEvaluatedCount > 0 && (
          <div className={styles.evalRow}>
            <span className={styles.evalLabel}>判定不能</span>
            <span className={styles.evalValue}>{summary.notEvaluatedCount}ノート</span>
          </div>
        )}
        {warnings.length > 0 && (
          <div className={styles.evalWarnings}>
            {warnings.map((w, i) => (
              <div key={i} className={styles.evalWarning}>{w}</div>
            ))}
          </div>
        )}
        <div className={styles.evalLegend}>
          <span className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: COLOR_GREEN }} /> 正確
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: COLOR_ORANGE }} /> タイミングずれ
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: COLOR_RED }} /> 音程ずれ
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: COLOR_GREY }} /> 判定不能
          </span>
        </div>
      </div>
    </div>
  )
}

// =========================================================
// サブコンポーネント: PerformanceHistory
// =========================================================

function PerformanceHistory({
  performances,
  selectedId,
  onSelect,
}: {
  performances: PerformanceDTO[]
  selectedId: string | null
  onSelect: (p: PerformanceDTO) => void
}) {
  return (
    <div className={styles.card}>
      <h3>演奏履歴</h3>
      {performances.map((p) => (
        <div
          key={p.id}
          className={`${styles.historyItem} ${selectedId === p.id ? styles.historyActive : ""}`}
          onClick={() => onSelect(p)}
        >
          <div>{new Date(p.uploadedAt).toLocaleDateString("ja-JP")}</div>
          <div className={styles.historyMeta}>
            <span>{p.status}</span>
            {p.comparisonResult && <span className={styles.historyBadge}>評価あり</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

// =========================================================
// サブコンポーネント: ScoreViewer
// =========================================================

function ScoreViewer({
  buildUrl,
  onNoteElementsReady,
}: {
  buildUrl: string | null
  onNoteElementsReady: (elements: Element[]) => void
}) {
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState<string | null>(null)

  const showPage = useCallback((container: HTMLElement, pageIndex: number) => {
    container.querySelectorAll("svg").forEach((svg, index) => {
      svg.style.display = index === pageIndex ? "block" : "none"
    })
    setCurrentPage(pageIndex)
  }, [])

  useEffect(() => {
    if (!buildUrl) return
    const container = document.getElementById("osmd-container")
    if (!container) return
    container.innerHTML = ""
    setError(null)

    const osmd = new OpenSheetMusicDisplay(container, {
      autoResize: true,
      backend: "svg",
      drawTitle: false,
      drawPartNames: false,
      pageFormat: "A4_P",
      newPageFromXML: true,
      renderSingleHorizontalStaffline: false,
      pageBackgroundColor: "#ffffff",
    })

    osmd
      .load(buildUrl)
      .then(() => {
        osmd.zoom = 0.85
        osmd.render()

        const svgCount = container.querySelectorAll("svg").length
        setTotalPages(svgCount > 0 ? svgCount : 1)
        setCurrentPage(0)
        showPage(container, 0)

        const stavenotes = container.querySelectorAll("g.vf-stavenote")
        const elements = Array.from(stavenotes)
        elements.forEach(saveOriginalColors)
        onNoteElementsReady(elements)
      })
      .catch((e: unknown) => {
        console.error("OSMD load error:", e)
        setError("楽譜を表示できませんでした。再読み込みをお試しください。")
      })
  }, [buildUrl, onNoteElementsReady, showPage])

  const goToPage = (page: number) => {
    if (page < 0 || page >= totalPages) return
    const container = document.getElementById("osmd-container")
    if (container) showPage(container, page)
  }

  if (!buildUrl) {
    return (
      <div className={styles.card}>
        <h3>楽譜データ</h3>
        <div className={styles.scoreMock}><div>解析データなし</div></div>
      </div>
    )
  }

  return (
    <div className={styles.card}>
      <h3>楽譜データ</h3>
      <div className={styles.scoreMock}>
        {error ? (
          <div style={{ color: "#c62828", padding: "20px 0" }}>{error}</div>
        ) : (
          <>
            <div id="osmd-container" className={styles.osmdContainer} />
            {totalPages > 1 && (
              <div className={styles.scoreNav}>
                <button disabled={currentPage === 0} onClick={() => goToPage(currentPage - 1)}>
                  前へ
                </button>
                <span>{currentPage + 1} / {totalPages}</span>
                <button disabled={currentPage === totalPages - 1} onClick={() => goToPage(currentPage + 1)}>
                  次へ
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// =========================================================
// サブコンポーネント: AudioPlayer
// =========================================================

function AudioPlayer({
  audioUrl,
  performanceId,
}: {
  audioUrl: string | null
  performanceId: string | undefined
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    setIsPlaying(false)
  }, [performanceId])

  const handleToggle = () => {
    if (!audioRef.current) return
    if (isPlaying) audioRef.current.pause()
    else audioRef.current.play()
    setIsPlaying(!isPlaying)
  }

  return (
    <div className={styles.card}>
      <h3>最新の演奏</h3>
      <button className={styles.playBtn} onClick={handleToggle} disabled={!audioUrl}>
        {isPlaying ? "一時停止" : "再生"}
      </button>
      <audio
        ref={audioRef}
        key={performanceId}
        controls
        src={audioUrl ?? undefined}
        className={styles.audioMock}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  )
}

// =========================================================
// メインコンポーネント
// =========================================================

export default function ScoreDetail({
  score,
  performances,
  uploadAction,
  analysis,
  buildUrl,
}: Props) {
  const [selected, setSelected] = useState<PerformanceDTO | null>(performances[0] ?? null)
  const [isScorePlaying, setIsScorePlaying] = useState(false)
  const [isRecordingOpen, setIsRecordingOpen] = useState(false)

  const synthRef = useRef<Tone.Synth | null>(null)
  const partRef = useRef<Tone.Part | null>(null)
  const noteElementsRef = useRef<Element[]>([])
  const animationRef = useRef<number | null>(null)
  const lastHighlightedRef = useRef<number>(-1)

  // --- v1→v2正規化（D1: この時点で統一） ---
  const comparison = useMemo(
    () => normalizeComparison(selected?.comparisonResult ?? null),
    [selected]
  )
  const warnings = useMemo(
    () => selected?.comparisonWarnings ?? [],
    [selected]
  )
  const evalSummary = useEvaluationSummary(comparison)

  // --- ScoreViewer からノート要素を受け取る ---
  const handleNoteElementsReady = useCallback((elements: Element[]) => {
    noteElementsRef.current = elements
  }, [])

  // --- 比較色の適用 ---
  const applyComparisonColors = useCallback(() => {
    const elements = noteElementsRef.current
    if (elements.length === 0) return
    elements.forEach(restoreNote)
    if (!comparison) return
    const cmap = new Map(comparison.map((c) => [c.note_index, c]))
    elements.forEach((el, i) => {
      const r = cmap.get(i)
      if (r) colorizeNote(el, getComparisonColor(r))
    })
  }, [comparison])

  useEffect(() => {
    if (!isScorePlaying) {
      if (comparison) applyComparisonColors()
      else noteElementsRef.current.forEach(restoreNote)
    }
  }, [comparison, isScorePlaying, applyComparisonColors])

  // --- ハイライト ---
  const highlightNote = useCallback(
    (noteIdx: number) => {
      if (noteIdx === lastHighlightedRef.current) return
      const elements = noteElementsRef.current
      if (lastHighlightedRef.current >= 0 && lastHighlightedRef.current < elements.length) {
        const prev = elements[lastHighlightedRef.current]
        restoreNote(prev)
        if (comparison) {
          const r = comparison.find((c) => c.note_index === lastHighlightedRef.current)
          if (r) colorizeNote(prev, getComparisonColor(r))
        }
      }
      if (noteIdx >= 0 && noteIdx < elements.length) {
        colorizeNote(elements[noteIdx], COLOR_HIGHLIGHT)
      }
      lastHighlightedRef.current = noteIdx
    },
    [comparison]
  )

  // --- 譜面再生のアニメーション ---
  const stopVisualSync = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }, [])

  const startVisualSync = useCallback(() => {
    if (!analysis) return
    const notes = analysis.notes
    const loop = () => {
      const t = Tone.getTransport().seconds
      let idx = -1
      for (let i = notes.length - 1; i >= 0; i--) {
        if (t >= notes[i].start_time_sec) {
          if (t < notes[i].end_time_sec) idx = i
          break
        }
      }
      highlightNote(idx)
      animationRef.current = requestAnimationFrame(loop)
    }
    animationRef.current = requestAnimationFrame(loop)
  }, [analysis, highlightNote])

  // --- 譜面再生の開始/停止 ---
  const stopPlayback = useCallback(() => {
    Tone.getTransport().stop()
    Tone.getTransport().cancel()
    stopVisualSync()
    lastHighlightedRef.current = -1
    setIsScorePlaying(false)
    if (comparison) {
      // 次のtickで色を適用
      setTimeout(() => {
        const elements = noteElementsRef.current
        if (elements.length === 0) return
        elements.forEach(restoreNote)
        const cmap = new Map(comparison.map((c) => [c.note_index, c]))
        elements.forEach((el, i) => {
          const r = cmap.get(i)
          if (r) colorizeNote(el, getComparisonColor(r))
        })
      }, 0)
    } else {
      noteElementsRef.current.forEach(restoreNote)
    }
  }, [comparison, stopVisualSync])

  const setupPlayback = useCallback(async () => {
    if (!analysis) return
    await Tone.start()
    const transport = Tone.getTransport()
    transport.stop()
    transport.cancel()
    transport.seconds = 0

    if (!synthRef.current) {
      synthRef.current = new Tone.Synth({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.4 },
      }).toDestination()
    }

    const events = analysis.notes
      .filter((n) => n.type === "note" && n.pitches.length > 0)
      .map((n) => ({
        time: n.start_time_sec,
        duration: Math.max(n.end_time_sec - n.start_time_sec, 0.05),
        frequency: n.pitches[0],
      }))

    if (partRef.current) partRef.current.dispose()
    partRef.current = new Tone.Part(
      (time, value: { frequency: number; duration: number }) => {
        synthRef.current?.triggerAttackRelease(value.frequency, value.duration, time)
      },
      events
    ).start(0)

    const lastNote = analysis.notes[analysis.notes.length - 1]
    transport.schedule(() => stopPlayback(), lastNote ? lastNote.end_time_sec + 0.5 : 10)

    lastHighlightedRef.current = -1
    transport.start()
    startVisualSync()
    setIsScorePlaying(true)
  }, [analysis, startVisualSync, stopPlayback])

  const handleScorePlayToggle = async () => {
    if (!analysis) return
    if (isScorePlaying) stopPlayback()
    else await setupPlayback()
  }

  // --- クリーンアップ ---
  useEffect(() => {
    return () => {
      stopVisualSync()
      try {
        Tone.getTransport().stop()
        Tone.getTransport().cancel()
      } catch {
        /* ignore */
      }
    }
  }, [stopVisualSync])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div><h1 className={styles.title}>{score.title}</h1></div>
        <button className={styles.recordBtn} onClick={() => setIsRecordingOpen(true)}>
          演奏をアップロード
        </button>
      </div>

      <div className={styles.grid}>
        <div className={styles.leftColumn}>
          <AudioPlayer audioUrl={selected?.audioUrl ?? null} performanceId={selected?.id} />

          <div className={styles.card}>
            <h3>楽譜を再生</h3>
            <button className={styles.playBtn} onClick={handleScorePlayToggle} disabled={!analysis}>
              {isScorePlaying ? "停止" : "譜面再生"}
            </button>
          </div>

          {evalSummary && (
            <EvaluationSummaryCard summary={evalSummary} warnings={warnings} />
          )}

          <PerformanceHistory
            performances={performances}
            selectedId={selected?.id ?? null}
            onSelect={setSelected}
          />
        </div>

        <div className={styles.rightColumn}>
          <ScoreViewer buildUrl={buildUrl} onNoteElementsReady={handleNoteElementsReady} />
        </div>
      </div>

      <UploadRecordModal
        isOpen={isRecordingOpen}
        onClose={() => setIsRecordingOpen(false)}
        scoreId={score.id}
        action={uploadAction}
      />
    </div>
  )
}
