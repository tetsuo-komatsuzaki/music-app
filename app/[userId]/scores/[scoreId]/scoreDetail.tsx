"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay"
import * as Tone from "tone"
import styles from "./scoreDetail.module.css"
import "./ScoreFullscreen.css"
import Recorder, { type Status as RecorderStatus } from "@/app/components/Recorder"
import { buildScrollPlan, locateInPlan, type ScrollPlan } from "@/app/_libs/scoreScroll"
import PerformanceSkeleton from "@/app/components/PerformanceSkeleton"
import PerformanceSkillDetail from "@/app/components/PerformanceSkillDetail"
import { getSignedUploadUrl } from "@/app/actions/getSignedUploadUrl"
import { renamePerformance } from "@/app/actions/renamePerformance"
import OnboardingTrigger from "@/app/[userId]/_onboarding/OnboardingTrigger"
import { useOnboarding } from "@/app/[userId]/_onboarding/hooks/useOnboarding"

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
  evaluation_status: "evaluated" | "pitch_only" | "not_evaluated" | "not_detected" | "section_missing"
  detected_pitch_hz: number | null
}

type PerformanceDTO = {
  id: string
  name: string | null
  uploadedAt: string
  status: string
  analysisStatus?: string | null
  errorMessage?: string | null
  audioUrl: string | null
  comparisonResult: any[] | null
  comparisonWarnings?: string[]
  pitchAccuracy?: number | null
  timingAccuracy?: number | null
  overallScore?: number | null
  evaluatedNotes?: number | null
  analysisSummary?: any
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
  userId: string
  analysis: { bpm: number; notes: AnalysisNote[] } | null
  buildUrl: string | null
  /**
   * 解析起動を通知する Server Action (v3.3 spec Commit 3 で型変更)
   * Commit 4 で uploadRecord/uploadPracticeRecord 自体が新シグネチャに変わる予定。
   * 現状は呼び出し側 (page.tsx) でアダプター経由の呼び出しを行う。
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uploadAction: (params: { performanceId: string; recordingBpm?: number }) => Promise<any>
  performanceCount: number
  latestPitchAccuracy: number | null
  latestTimingAccuracy: number | null
  infoSlot?: React.ReactNode
  singleStaffLine?: boolean
  /** practice用: score-performancesの代わりにpractice-performancesを使う */
  practiceItemId?: string
}

// =========================================================
// v1 → v2 正規化
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
    detected_pitch_hz: r.detected_pitch_hz ?? null,
  }))
}

// =========================================================
// 色判定
// =========================================================

const COLOR_GREEN = "#22aa44"
const COLOR_ORANGE = "#ee8800"
const COLOR_RED = "#ee2222"
const COLOR_GREY = "#aaaaaa"
const HIGHLIGHT_COLOR = "#2266ff"

function getComparisonColor(r: ComparisonNote): string {
  if (r.evaluation_status === "not_evaluated" || r.evaluation_status === "section_missing" || r.evaluation_status === "not_detected") {
    return COLOR_GREY
  }
  if (r.pitch_ok === false) return COLOR_RED
  if (r.evaluation_status === "evaluated" && r.start_ok === false) return COLOR_ORANGE
  return COLOR_GREEN
}

// =========================================================
// 間違い音符オーバーレイ + ポップオーバー用ヘルパー
// =========================================================

/** Hz → 音名（例: 277.2 → "C#4"） */
function hzToNoteName(hz: number): string {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
  const midi = Math.round(12 * Math.log2(hz / 440) + 69)
  return `${names[midi % 12]}${Math.floor(midi / 12) - 1}`
}

/** cents差 → 自然言語 */
function centsToLabel(cents: number): string {
  const abs = Math.abs(cents)
  const dir = cents > 0 ? "高い" : "低い"
  if (abs <= 15) return "ほぼ正確"
  if (abs <= 50) return `少し${dir}`
  if (abs <= 80) return dir
  if (abs <= 150) return `半音${dir}`
  return "大きくずれている"
}

/** MIDI番号 → ダイアトニックステップ（C4=0起点ではなく、絶対値） */
function midiToDiatonicStep(midi: number): number {
  const octave = Math.floor(midi / 12)
  const pc = midi % 12
  //               C  C# D  D# E  F  F# G  G# A  A# B
  const map = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6]
  return octave * 7 + map[pc]
}

/** 期待Hz vs 検出Hz → 五線上の Y オフセット (px) */
function calcYOffset(expectedHz: number, detectedHz: number, lineSpacing: number): number {
  const expectedMidi = Math.round(12 * Math.log2(expectedHz / 440) + 69)
  const detectedMidi = Math.round(12 * Math.log2(detectedHz / 440) + 69)
  const stepDiff = midiToDiatonicStep(detectedMidi) - midiToDiatonicStep(expectedMidi)
  if (stepDiff === 0) return 0 // 同一ダイアトニック位置（半音差）→ オーバーレイ不要
  return -stepDiff * (lineSpacing / 2)
}

/** オーバーレイ用 SVG レイヤーを確保（なければ作成、あればクリア） */
function ensureOverlaySvg(container: HTMLElement): SVGSVGElement {
  let overlay = container.querySelector("svg.wrong-note-layer") as SVGSVGElement | null
  if (!overlay) {
    overlay = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    overlay.setAttribute("class", "wrong-note-layer")
    overlay.style.position = "absolute"
    overlay.style.top = "0"
    overlay.style.left = "0"
    overlay.style.pointerEvents = "none"
    overlay.style.zIndex = "5"
    container.style.position = "relative"
    container.appendChild(overlay)
  }
  overlay.setAttribute("width", String(container.scrollWidth))
  overlay.setAttribute("height", String(container.scrollHeight))
  overlay.innerHTML = ""
  return overlay
}

/** 五線の線間隔を計測（ノートヘッドの高さから算出） */
function measureLineSpacing(noteElements: Element[]): number {
  // 楽譜の標準: ノートヘッド高さ ≒ 五線の1スペース（隣接する線の間隔）
  // 表示中のノート要素からノートヘッドの高さを取得
  for (const el of noteElements) {
    const rect = el.getBoundingClientRect()
    if (rect.height > 0 && rect.width > 0) {
      // vf-stavenote の高さはノートヘッド+符幹を含むが、幅はノートヘッド幅に近い
      // ノートヘッドは楕円で、高さ ≈ 幅 × 0.8〜1.0
      // ノートヘッドの高さ ≈ 五線の1スペース
      return rect.height
    }
  }
  return 12
}


// =========================================================
// スコアランク + フィードバック
// =========================================================

type ScoreRank = "excellent" | "good" | "ok" | "needsPractice"

function getScoreRank(score: number): ScoreRank {
  if (score >= 90) return "excellent"
  if (score >= 75) return "good"
  if (score >= 60) return "ok"
  return "needsPractice"
}

const rankLabels: Record<ScoreRank, { label: string; color: string; bg: string }> = {
  excellent:     { label: "Excellent",      color: "#085041", bg: "#E1F5EE" },
  good:          { label: "Good",           color: "#0C447C", bg: "#E6F1FB" },
  ok:            { label: "OK",             color: "#633806", bg: "#FAEEDA" },
  needsPractice: { label: "Needs Practice", color: "#791F1F", bg: "#FCEBEB" },
}

// =========================================================
// 評価サマリー（DB値をそのまま表示）
// =========================================================

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
// サブコンポーネント: NotePopoverContent
// =========================================================

function NotePopoverContent({ note }: { note: ComparisonNote }) {
  if (note.evaluation_status === "not_detected") {
    return <div style={{ fontSize: 16, fontWeight: 700 }}>検出できませんでした</div>
  }
  if (note.evaluation_status === "not_evaluated" || note.evaluation_status === "section_missing") {
    return <div style={{ fontSize: 16, fontWeight: 700 }}>評価対象外</div>
  }
  const expected = note.note_name
  const detected = note.detected_pitch_hz ? hzToNoteName(note.detected_pitch_hz) : null
  return (
    <>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
        {note.pitch_ok
          ? `${expected} 正確`
          : `${expected} → ${detected ?? "?"}`}
      </div>
      <div style={{ fontSize: 12, color: "#666", lineHeight: 1.6 }}>
        {note.pitch_cents_error != null && !note.pitch_ok && (
          <div>
            {centsToLabel(note.pitch_cents_error)}（{note.pitch_cents_error > 0 ? "+" : ""}
            {Math.round(note.pitch_cents_error)} cents）
          </div>
        )}
        {note.evaluation_status === "evaluated" && note.start_diff_sec != null && (
          <div>
            タイミング:{" "}
            {note.start_ok
              ? "正確"
              : `${note.start_diff_sec > 0 ? "+" : ""}${note.start_diff_sec.toFixed(2)}秒`}
          </div>
        )}
      </div>
    </>
  )
}

// =========================================================
// サブコンポーネント: EvaluationSummaryCard
// =========================================================

function EvaluationSummaryCard({
  performance,
  warnings,
}: {
  performance: PerformanceDTO
  warnings: string[]
}) {
  const hasPitch = performance.pitchAccuracy != null
  const hasTiming = performance.timingAccuracy != null
  const hasOverall = performance.overallScore != null

  if (!hasPitch && !hasTiming) return null

  return (
    <div className={styles.card}>
      <h3>演奏評価</h3>
      <div className={styles.evalSummary}>
        {hasPitch && (
          <div className={styles.evalRow}>
            <span className={styles.evalLabel}>音程正確率</span>
            <span className={styles.evalValue}>{Math.round(performance.pitchAccuracy!)}%</span>
          </div>
        )}
        {hasTiming && (
          <div className={styles.evalRow}>
            <span className={styles.evalLabel}>タイミング正確率</span>
            <span className={styles.evalValue}>{Math.round(performance.timingAccuracy!)}%</span>
          </div>
        )}
        {hasOverall && (
          <div className={styles.evalRow}>
            <span className={styles.evalLabel}>総合スコア</span>
            <span className={styles.evalValue}>{Math.round(performance.overallScore!)}点</span>
          </div>
        )}
        {performance.evaluatedNotes != null && (
          <div className={styles.evalRow}>
            <span className={styles.evalLabel}>評価対象</span>
            <span className={styles.evalValue}>{performance.evaluatedNotes}ノート</span>
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

const HISTORY_PAGE_SIZE = 10
const PERFORMANCE_NAME_MAX = 10

function PerformanceHistory({
  performances,
  selectedId,
  onSelect,
  loading,
  performanceCount,
  kind,
  onRenamed,
}: {
  performances: PerformanceDTO[]
  selectedId: string | null
  onSelect: (p: PerformanceDTO) => void
  loading: boolean
  performanceCount: number
  kind: "score" | "practice"
  onRenamed: (performanceId: string, newName: string) => void
}) {
  const [page, setPage] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState("")
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const totalPages = Math.max(1, Math.ceil(performances.length / HISTORY_PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const pageStart = safePage * HISTORY_PAGE_SIZE
  const pageItems = performances.slice(pageStart, pageStart + HISTORY_PAGE_SIZE)

  const startEdit = (p: PerformanceDTO, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(p.id)
    setDraftName(p.name ?? "")
    setSaveError(null)
  }

  const cancelEdit = (e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.stopPropagation()
    setEditingId(null)
    setDraftName("")
    setSaveError(null)
  }

  const submitEdit = async (performanceId: string, e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.stopPropagation()
    if (saving) return
    setSaving(true)
    setSaveError(null)
    const res = await renamePerformance({ performanceId, kind, name: draftName })
    setSaving(false)
    if (!res.ok) {
      setSaveError(res.error)
      return
    }
    onRenamed(performanceId, res.name)
    setEditingId(null)
    setDraftName("")
  }

  return (
    <div className={styles.card}>
      <h3>演奏履歴</h3>
      {loading ? (
        <PerformanceSkeleton count={Math.min(performanceCount, 5)} />
      ) : performances.length === 0 ? (
        <div style={{ fontSize: 13, color: "#999" }}>まだ演奏がありません</div>
      ) : (
        <>
          {pageItems.map((p) => {
            const isEditing = editingId === p.id
            const dateLabel = new Date(p.uploadedAt).toLocaleDateString("ja-JP")
            const displayName = p.name ?? "Performance"
            const statusLabel =
              p.overallScore != null
                ? `${Math.round(p.overallScore)}点`
                : p.analysisStatus === "error"
                  ? "解析失敗"
                  : p.analysisStatus === "done"
                    ? "評価あり"
                    : "解析中..."
            const showEvalBadge = p.comparisonResult || p.pitchAccuracy != null

            return (
              <div
                key={p.id}
                className={`${styles.historyItem} ${selectedId === p.id ? styles.historyActive : ""}`}
                onClick={() => !isEditing && onSelect(p)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  {isEditing ? (
                    <input
                      type="text"
                      value={draftName}
                      maxLength={PERFORMANCE_NAME_MAX}
                      autoFocus
                      onChange={(e) => setDraftName(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") submitEdit(p.id, e)
                        else if (e.key === "Escape") cancelEdit(e)
                      }}
                      className={styles.historyNameInput}
                      disabled={saving}
                    />
                  ) : (
                    <span className={styles.historyName}>{displayName}</span>
                  )}
                  {p.overallScore != null && !isEditing && (
                    <span
                      className={styles.rankBadgeSmall}
                      style={{
                        background: rankLabels[getScoreRank(p.overallScore)].bg,
                        color: rankLabels[getScoreRank(p.overallScore)].color,
                      }}
                    >
                      {rankLabels[getScoreRank(p.overallScore)].label}
                    </span>
                  )}
                </div>
                <div className={styles.historyMeta}>
                  <span>{statusLabel}</span>
                  {showEvalBadge && <span className={styles.historyBadge}>評価あり</span>}
                  <span className={styles.historyDate}>{dateLabel}</span>
                  <div className={styles.historyActions}>
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          className={styles.historyActionBtn}
                          onClick={(e) => submitEdit(p.id, e)}
                          disabled={saving}
                          aria-label="保存"
                        >
                          {saving ? "..." : "保存"}
                        </button>
                        <button
                          type="button"
                          className={styles.historyActionBtn}
                          onClick={cancelEdit}
                          disabled={saving}
                          aria-label="キャンセル"
                        >
                          取消
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className={styles.historyEditBtn}
                        onClick={(e) => startEdit(p, e)}
                        aria-label="名前を編集"
                        title="名前を編集"
                      >
                        ✏
                      </button>
                    )}
                  </div>
                </div>
                {isEditing && saveError && (
                  <div className={styles.historyError}>{saveError}</div>
                )}
              </div>
            )
          })}
          {totalPages > 1 && (
            <div className={styles.historyPager}>
              <button
                type="button"
                className={styles.historyPagerBtn}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
              >
                戻る
              </button>
              <span className={styles.historyPagerInfo}>
                {safePage + 1} / {totalPages}
              </span>
              <button
                type="button"
                className={styles.historyPagerBtn}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={safePage >= totalPages - 1}
              >
                次へ
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// =========================================================
// サブコンポーネント: ScoreViewer（OSMDインスタンスを親に公開）
// =========================================================

// コンテナ幅に応じた OSMD zoom 値を返す。
// 狭い画面で1小節しか表示されない問題を回避するため、幅に応じて段階的に縮小する。
function computeResponsiveZoom(containerWidth: number): number {
  if (containerWidth < 400) return 0.45
  if (containerWidth < 700) return 0.6
  if (containerWidth < 1000) return 0.75
  return 0.85
}

function ScoreViewer({
  buildUrl,
  onNoteElementsReady,
  onOsmdReady,
  onScoreClick,
  onPageChange,
  singleStaffLine,
}: {
  buildUrl: string | null
  onNoteElementsReady: (elements: Element[]) => void
  onOsmdReady: (osmd: OpenSheetMusicDisplay) => void
  onScoreClick?: (e: React.MouseEvent) => void
  onPageChange?: () => void
  singleStaffLine?: boolean
}) {
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const onScoreClickRef = useRef(onScoreClick)
  onScoreClickRef.current = onScoreClick
  const osmdInstanceRef = useRef<OpenSheetMusicDisplay | null>(null)

  const showPage = useCallback((container: HTMLElement, pageIndex: number) => {
    // OSMD SVGバックエンドはページごとに直下 <svg> を1つ作る（系列SVGはその内部にネスト）
    const directChildren = Array.from(container.children)
    if (directChildren.length > 1) {
      directChildren.forEach((el, index) => {
        (el as HTMLElement).style.display = index === pageIndex ? "" : "none"
      })
    }
    // 直下要素が1つ（1ページ）の場合は何もしない
    setCurrentPage(pageIndex)
  }, [])

  const onNoteElementsReadyRef = useRef(onNoteElementsReady)
  onNoteElementsReadyRef.current = onNoteElementsReady
  const onOsmdReadyRef = useRef(onOsmdReady)
  onOsmdReadyRef.current = onOsmdReady

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
      pageFormat: "Endless",
      newPageFromXML: false,
      renderSingleHorizontalStaffline: false,
      pageBackgroundColor: "#ffffff",
      followCursor: false,
    })

    console.log('[DEBUG-XML] buildUrl:', buildUrl)

    const collectElements = () => {
      const stavenotes = container.querySelectorAll("g.vf-stavenote")
      const elements = Array.from(stavenotes)
      elements.forEach(saveOriginalColors)
      onNoteElementsReadyRef.current(elements)
      onOsmdReadyRef.current(osmd)
      const pageCount = osmd.GraphicSheet?.MusicPages?.length ?? 1
      setTotalPages(pageCount)
    }

    // autoResize: true のとき OSMD はリサイズ時に内部で render() を呼び SVG を再生成する。
    // MutationObserver で直下子要素の変化を検知し、色の再適用をトリガーする。
    let mutationTimer: ReturnType<typeof setTimeout> | null = null
    const mutationObserver = new MutationObserver(() => {
      if (mutationTimer) clearTimeout(mutationTimer)
      mutationTimer = setTimeout(() => {
        collectElements()
      }, 150)
    })

    osmdInstanceRef.current = osmd

    osmd
      .load(buildUrl)
      .then(() => {
        osmd.zoom = computeResponsiveZoom(container.clientWidth)
        osmd.render()

        setCurrentPage(0)
        showPage(container, 0)
        collectElements()

        // 初回 render() 完了後に監視開始（render()中の変化は拾わない）
        mutationObserver.observe(container, { childList: true })
      })
      .catch((e: unknown) => {
        console.error("OSMD load error:", e)
        setError("楽譜を表示できませんでした。再読み込みをお試しください。")
      })

    return () => {
      mutationObserver.disconnect()
      if (mutationTimer) clearTimeout(mutationTimer)
      osmdInstanceRef.current = null
    }
  }, [buildUrl, showPage, singleStaffLine])

  // ウィンドウ幅変化に追従して zoom を再計算する。
  // 端末回転や PC でのウィンドウリサイズに対応。OSMD の autoResize は描画幅追従のみで
  // zoom 値は変えないため、ここで明示的に zoom を切り替える。
  useEffect(() => {
    let resizeTimer: ReturnType<typeof setTimeout> | null = null
    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        const osmd = osmdInstanceRef.current
        const container = document.getElementById("osmd-container")
        if (!osmd || !container) return
        const newZoom = computeResponsiveZoom(container.clientWidth)
        if (Math.abs(newZoom - osmd.zoom) < 1e-6) return
        osmd.zoom = newZoom
        osmd.render()
      }, 200)
    }
    window.addEventListener("resize", handleResize)
    window.addEventListener("orientationchange", handleResize)
    return () => {
      if (resizeTimer) clearTimeout(resizeTimer)
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("orientationchange", handleResize)
    }
  }, [])

  const goToPage = (page: number) => {
    if (page < 0 || page >= totalPages) return
    const container = document.getElementById("osmd-container")
    if (container) {
      showPage(container, page)
      onPageChange?.()
    }
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
            <div id="osmd-container" className={styles.osmdContainer} onClick={(e) => onScoreClickRef.current?.(e)} style={{ cursor: "pointer" }} />
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
    if (!audioRef.current || !audioUrl) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
    }
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
  userId,
  uploadAction,
  analysis,
  buildUrl,
  performanceCount,
  latestPitchAccuracy,
  latestTimingAccuracy: _latestTimingAccuracy,
  infoSlot,
  singleStaffLine,
  practiceItemId,
}: Props) {
  const router = useRouter()

  // ▼ 非同期データ取得
  const [performances, setPerformances] = useState<PerformanceDTO[]>([])
  const [perfLoading, setPerfLoading] = useState(performanceCount > 0)
  const [selected, setSelected] = useState<PerformanceDTO | null>(null)

  // ▼ UI-6: 削除完了後の状態
  // - recentlyDeleted: 直前の操作が削除だった = ヒント表示用 (selected が再度選ばれたら解除)
  // - deleteToast: 「演奏を削除しました」トースト (3 秒で自動消去)
  const [recentlyDeleted, setRecentlyDeleted] = useState(false)
  const [deleteToast, setDeleteToast] = useState<string | null>(null)
  const deleteToastTimerRef = useRef<number | null>(null)
  useEffect(() => {
    // 別の演奏を選んだら hint は不要なので解除
    if (selected) setRecentlyDeleted(false)
  }, [selected])
  useEffect(() => {
    // unmount 時にトースト用タイマーを解放
    return () => {
      if (deleteToastTimerRef.current != null) {
        window.clearTimeout(deleteToastTimerRef.current)
      }
    }
  }, [])
  const handlePerformanceDeleted = useCallback((performanceId: string) => {
    setPerformances(prev => prev.filter(p => p.id !== performanceId))
    setSelected(prev => (prev?.id === performanceId ? null : prev))
    setRecentlyDeleted(true)
    setDeleteToast("演奏を削除しました")
    if (deleteToastTimerRef.current != null) {
      window.clearTimeout(deleteToastTimerRef.current)
    }
    deleteToastTimerRef.current = window.setTimeout(() => {
      setDeleteToast(null)
      deleteToastTimerRef.current = null
    }, 3000)
  }, [])
  const [playbackState, setPlaybackState] = useState<"stopped" | "playing" | "paused">("stopped")
  const [playbackTempo, setPlaybackTempo] = useState(analysis?.bpm ?? 90)
  const [, setComparisonLoading] = useState(false)

  // ▼ ポップオーバー
  type NotePopover = { note: ComparisonNote; left: number; top: number }
  const [popover, setPopover] = useState<NotePopover | null>(null)
  const scoreWrapperRef = useRef<HTMLDivElement>(null)

  // ▼ 録音テンポ（Recorder から通知される）
  // ref は startRecordingGuide の rAF tick から同期参照、state は F-1 の useEffect/scrollPlan 再計算に使う
  const recordingBpmRef = useRef(analysis?.bpm ?? 90)
  const [recordingBpm, setRecordingBpm] = useState<number | null>(null)
  const handleRecordingBpmChange = useCallback((v: number) => {
    console.log("[F-1/diag] handleRecordingBpmChange", v)
    recordingBpmRef.current = v
    setRecordingBpm(v)
  }, [])

  // ▼ 録音状態 (F-1 のフルスクリーン化トリガ用)。Recorder 内の status を最小限ミラー
  const [recordingState, setRecordingState] = useState<RecorderStatus>("idle")

  // ▼ F-1: 録音中 (countdown / recording) は body に data-fullscreen を付与
  // 親ページ (practice の breadcrumb 等) も含めて全画面化したいので body 経由
  const isFullscreen = recordingState === "countdown" || recordingState === "recording"
  useEffect(() => {
    if (isFullscreen) {
      document.body.setAttribute("data-fullscreen", "true")
    } else {
      document.body.removeAttribute("data-fullscreen")
    }
    return () => {
      document.body.removeAttribute("data-fullscreen")
    }
  }, [isFullscreen])

  // ▼ アップロード進捗 (0-100、未開始時は null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)

  // 解析中の performance を 3 秒ごとに再 fetch
  useEffect(() => {
    const hasPending = performances.some(
      p => p.analysisStatus && p.analysisStatus !== "done" && p.analysisStatus !== "error"
    )
    if (!hasPending) return
    const apiBase = practiceItemId
      ? `/api/practice-performances?practiceItemId=${practiceItemId}&userId=${userId}`
      : `/api/score-performances?scoreId=${score.id}&userId=${userId}`
    const timer = setInterval(() => {
      fetch(apiBase)
        .then(res => res.json())
        .then((data: PerformanceDTO[]) => setPerformances(data))
        .catch(() => {})
    }, 3000)
    return () => clearInterval(timer)
  }, [performances, score.id, userId, practiceItemId])

  // パフォーマンスデータの非同期取得
  useEffect(() => {
    if (performanceCount === 0) { setPerfLoading(false); return }
    const apiBase = practiceItemId
      ? `/api/practice-performances?practiceItemId=${practiceItemId}&userId=${userId}`
      : `/api/score-performances?scoreId=${score.id}&userId=${userId}`
    fetch(apiBase)
      .then(res => res.json())
      .then((data: PerformanceDTO[]) => {
        setPerformances(data)
        if (data.length > 0) {
          const first = data[0]
          setSelected(first)
          // 初期選択のcomparison詳細をロード
          if (!first.comparisonResult && (first.pitchAccuracy != null || first.overallScore != null)) {
            const compApi = practiceItemId
              ? `/api/practice-performances/${first.id}/comparison`
              : `/api/score-performances/${first.id}/comparison`
            fetch(compApi).then(r => r.json()).then(compData => {
              let comparisonResult = null
              let comparisonWarnings: string[] = []
              if (compData.results) {
                comparisonResult = compData.results
                comparisonWarnings = compData.warnings || []
              } else if (Array.isArray(compData)) {
                comparisonResult = compData
              }
              setPerformances(prev => prev.map(p => p.id === first.id ? { ...p, comparisonResult, comparisonWarnings } : p))
              setSelected(prev => prev?.id === first.id ? { ...prev, comparisonResult, comparisonWarnings } : prev)
            }).catch(() => {})
          }
        }
        setPerfLoading(false)
      })
      .catch(() => setPerfLoading(false))
  }, [score.id, userId, performanceCount, practiceItemId])

  // comparison 詳細の遅延取得
  const loadComparison = useCallback(async (perf: PerformanceDTO) => {
    if (perf.comparisonResult) return
    setComparisonLoading(true)
    try {
      const apiBase = practiceItemId
        ? `/api/practice-performances/${perf.id}/comparison`
        : `/api/score-performances/${perf.id}/comparison`
      const res = await fetch(apiBase)
      const data = await res.json()
      let comparisonResult = null
      let comparisonWarnings: string[] = []
      if (data.results) {
        comparisonResult = data.results
        comparisonWarnings = data.warnings || []
      } else if (Array.isArray(data)) {
        comparisonResult = data
      }
      setPerformances(prev => prev.map(p => p.id === perf.id ? { ...p, comparisonResult, comparisonWarnings } : p))
      setSelected(prev => prev?.id === perf.id ? { ...prev, comparisonResult, comparisonWarnings } : prev)
    } catch { /* ignore */ }
    setComparisonLoading(false)
  }, [practiceItemId])

  const handleSelectPerformance = useCallback((p: PerformanceDTO) => {
    setPopover(null)
    setSelected(p)
    if (!p.comparisonResult && (p.pitchAccuracy != null || p.overallScore != null)) {
      loadComparison(p)
    }
  }, [loadComparison])

  // 過去ベストスコア（ピッチ）— 録音後フィードバックの比較用
  const bestPitchScore = useMemo(() => {
    if (performances.length === 0) return latestPitchAccuracy ?? undefined
    const scores = performances.map(p => p.pitchAccuracy ?? null).filter((s): s is number => s !== null)
    return scores.length > 0 ? Math.max(...scores) : latestPitchAccuracy ?? undefined
  }, [performances, latestPitchAccuracy])

  // 過去ベストスコア（総合）— 録音ボタン下の表示用
  const bestOverallScore = useMemo(() => {
    if (performances.length === 0) return undefined
    const scores = performances.map(p => p.overallScore ?? null).filter((s): s is number => s !== null)
    return scores.length > 0 ? Math.max(...scores) : undefined
  }, [performances])

  // Recorder の onRecordingComplete ハンドラ (G-1 + Path B、v3.3 spec Commit 3)
  // 旧: convert-audio → uploadRecord(WAV FormData)
  // 新: getSignedUploadUrl → XHR PUT 直接 → uploadAction({ performanceId, recordingBpm })
  const handleRecordingComplete = useCallback(async (blob: Blob) => {
    const mimeType = blob.type || "audio/webm"  // iOS Safari は audio/mp4

    // 1. signed URL 取得 (Performance 行作成 + audioPath 確定済み = Commit 2 Step A-D)
    const signedRes = practiceItemId
      ? await getSignedUploadUrl({ kind: "practice", itemId:  practiceItemId, mimeType })
      : await getSignedUploadUrl({ kind: "score",    scoreId: score.id,        mimeType })
    if (!signedRes.ok) return { error: signedRes.error }

    // 2. Supabase Storage に直接 PUT (XMLHttpRequest で進捗取得)
    setUploadProgress(0)
    const uploadStatus = await new Promise<{ ok: boolean; httpStatus: number }>((resolve) => {
      const xhr = new XMLHttpRequest()
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100))
        }
      }
      xhr.onload  = () => resolve({ ok: xhr.status >= 200 && xhr.status < 300, httpStatus: xhr.status })
      xhr.onerror = () => resolve({ ok: false, httpStatus: 0 })  // ネットワークエラー
      xhr.open("PUT", signedRes.signedUrl)
      xhr.setRequestHeader("Content-Type", mimeType)
      xhr.send(blob)
    })
    setUploadProgress(null)

    // エラー分類 1: ネットワークエラー
    if (uploadStatus.httpStatus === 0) {
      return { error: "ネットワーク接続を確認して再試行してください" }
    }
    // エラー分類 2: アップロード失敗 (HTTP 4xx/5xx)
    if (!uploadStatus.ok) {
      return { error: "アップロードに失敗しました。もう一度お試しください" }
    }

    // 3. 解析起動を通知
    const notifyResult = await uploadAction({
      performanceId: signedRes.performanceId,
      recordingBpm: recordingBpmRef.current,
    })
    // エラー分類 3: 解析起動失敗 (録音は Storage に保存済み)
    if (notifyResult?.error) {
      return { error: `録音は保存されましたが、解析に失敗しました (${notifyResult.error})` }
    }

    // 4. 後続処理 (latest perf 取得・comparison ロード・state 更新) - 既存ロジック踏襲
    try {
      const apiUrl = practiceItemId
        ? `/api/practice-performances?practiceItemId=${practiceItemId}&userId=${userId}&limit=2`
        : `/api/score-performances?scoreId=${score.id}&userId=${userId}&limit=2`
      const res = await fetch(apiUrl)
      if (!res.ok) throw new Error("fetch failed")
      const perfs = await res.json()
      const latest = perfs[0], previous = perfs[1]
      const pitchAccuracy = latest?.pitchAccuracy ?? null
      const timingAccuracy = latest?.timingAccuracy ?? null
      const overallScore = latest?.overallScore ?? null
      const prevOverall = previous?.overallScore ?? null
      const isPersonalBest = overallScore != null && (prevOverall == null || overallScore > prevOverall)
      router.refresh()
      const allApiUrl = practiceItemId
        ? `/api/practice-performances?practiceItemId=${practiceItemId}&userId=${userId}`
        : `/api/score-performances?scoreId=${score.id}&userId=${userId}`
      fetch(allApiUrl).then(r => r.json()).then((data: PerformanceDTO[]) => {
        setPerformances(data)
        if (data.length > 0) {
          const first = data[0]
          setSelected(first)
          if (!first.comparisonResult && (first.pitchAccuracy != null || first.overallScore != null)) {
            loadComparison(first)
          }
        }
      }).catch(() => {})
      return {
        success: true,
        result: {
          pitchAccuracy: pitchAccuracy ?? undefined,
          timingAccuracy: timingAccuracy ?? undefined,
          overallScore: overallScore ?? undefined,
          isPersonalBest,
          previousScore: (previous?.pitchAccuracy ?? bestPitchScore) ?? undefined,
          previousOverall: prevOverall ?? undefined,
          analysisSummary: latest?.analysisSummary,
          ringStatus: { record: true, remaining: 1 },
        },
      }
    } catch {
      router.refresh()
      return { success: true }
    }
  }, [score.id, userId, uploadAction, bestPitchScore, router, practiceItemId, loadComparison])

  // =========================================================
  // 再生・ハイライト関連
  // =========================================================

  const synthRef = useRef<Tone.Synth | null>(null)
  const vibratoRef = useRef<Tone.Vibrato | null>(null)
  const partRef = useRef<Tone.Part | null>(null)
  const noteElementsRef = useRef<Element[]>([])
  const animationRef = useRef<number | null>(null)
  const activeTempoRatioRef = useRef<number>(1)
  const cursorRef = useRef<HTMLDivElement | null>(null)
  const pausedAtRef = useRef<number>(0)

  // ▼ OSMDカーソルAPIベースのタイムスタンプマップ
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null)
  const [isOsmdReady, setIsOsmdReady] = useState(false)
  const timeToGNotesMap = useRef<Map<number, any[]>>(new Map())
  const sortedTimes = useRef<number[]>([])
  const lastHighlightedTimeRef = useRef<number>(-1)

  const HIGHLIGHT_THRESHOLD_SEC = 0.15

  // OSMDカーソルで 時刻(秒) → GraphicalNote[] マップを構築
  const buildTimeToGNotesMap = useCallback((bpm: number) => {
    const osmd = osmdRef.current
    if (!osmd?.cursor) return

    timeToGNotesMap.current.clear()
    sortedTimes.current = []

    try {
      osmd.cursor.show()
      osmd.cursor.reset()
      const iterator = osmd.cursor.iterator

      while (!iterator.EndReached) {
        const ts = iterator.currentTimeStamp as any
        const timeSec = (ts.realValue ?? ts.RealValue ?? (ts.Numerator / ts.Denominator)) * 4 * 60 / bpm
        const rounded = Math.round(timeSec * 100) / 100
        const gNotes = osmd.cursor.GNotesUnderCursor()
        if (gNotes && gNotes.length > 0) {
          timeToGNotesMap.current.set(rounded, [...gNotes])
          sortedTimes.current.push(rounded)
        }
        iterator.moveToNext()
      }

      sortedTimes.current.sort((a, b) => a - b)
      osmd.cursor.hide()
    } catch (e) {
      console.warn("buildTimeToGNotesMap failed:", e)
    }
  }, [])

  // バイナリサーチで最近傍のタイムスタンプを見つける
  const findNearestGNotes = useCallback((currentSec: number): any[] | null => {
    const times = sortedTimes.current
    if (times.length === 0) return null

    let lo = 0, hi = times.length - 1
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2)
      if (times[mid] < currentSec) lo = mid + 1
      else hi = mid
    }

    const candidates = [times[lo]]
    if (lo > 0) candidates.push(times[lo - 1])
    const nearest = candidates.reduce((a, b) =>
      Math.abs(a - currentSec) <= Math.abs(b - currentSec) ? a : b
    )

    return Math.abs(nearest - currentSec) <= HIGHLIGHT_THRESHOLD_SEC
      ? (timeToGNotesMap.current.get(nearest) ?? null)
      : null
  }, [])

  // ハイライト中のGNotesを保持（復元用）
  const highlightedGNotesRef = useRef<any[]>([])

  // ハイライトをクリア（OSMD setColor APIで元に戻す）
  const clearHighlight = useCallback(() => {
    highlightedGNotesRef.current.forEach((gNote: any) => {
      gNote.setColor?.("#000000")
    })
    highlightedGNotesRef.current = []
    lastHighlightedTimeRef.current = -1
  }, [])

  // 時刻ベースでハイライト（OSMD setColor API）
  const highlightNoteAtTime = useCallback((currentSec: number) => {
    const rounded = Math.round(currentSec * 100) / 100
    if (rounded === lastHighlightedTimeRef.current) return

    // 前のハイライトを解除
    clearHighlight()

    const gNotes = findNearestGNotes(currentSec)
    if (!gNotes) return

    gNotes.forEach((gNote: any) => {
      gNote.setColor?.(HIGHLIGHT_COLOR)
      highlightedGNotesRef.current.push(gNote)
    })

    lastHighlightedTimeRef.current = rounded
  }, [findNearestGNotes, clearHighlight])

  // --- v1→v2正規化 ---
  const comparison = useMemo(
    () => normalizeComparison(selected?.comparisonResult ?? null),
    [selected]
  )
  const warnings = useMemo(
    () => selected?.comparisonWarnings ?? [],
    [selected]
  )

  // リサイズ後の再レンダリング検知用（インクリメントで applyComparisonColors を再トリガー）
  const [noteElementsVersion, setNoteElementsVersion] = useState(0)

  // --- オンボーディング: 解析オーバーレイ描画完了を Provider に通知 ---
  // applyComparisonColors の setTimeout 連鎖 (最大 800ms) を待ってから dispatch
  const { markAnalysisOverlayRendered } = useOnboarding()
  useEffect(() => {
    if (!selected?.comparisonResult) return
    if (noteElementsRef.current.length === 0) return
    const id = setTimeout(() => {
      requestAnimationFrame(() => {
        markAnalysisOverlayRendered()
      })
    }, 900)
    return () => clearTimeout(id)
  }, [selected?.comparisonResult, noteElementsVersion, markAnalysisOverlayRendered])

  // --- ScoreViewer からノート要素を受け取る（評価オーバーレイ用）---
  const handleNoteElementsReady = useCallback((elements: Element[]) => {
    noteElementsRef.current = elements
    setNoteElementsVersion(v => v + 1)
    setPopover(null)
  }, [])

  // --- OSMDインスタンスを受け取り、タイムスタンプマップを構築 ---
  const handleOsmdReady = useCallback((osmd: OpenSheetMusicDisplay) => {
    console.log("[F-1/diag] handleOsmdReady fired")
    osmdRef.current = osmd
    setIsOsmdReady(true)
    if (analysis) {
      requestAnimationFrame(() => {
        buildTimeToGNotesMap(analysis.bpm)
      })
    }
  }, [analysis, buildTimeToGNotesMap])

  useEffect(() => {
    return () => {
      setIsOsmdReady(false)
    }
  }, [score.id])

  // analysis.notes インデックス → OSMD要素インデックス の変換（評価オーバーレイ用）
  // VexFlow は休符も vf-stavenote として描画するため note_index を直接 OSMD インデックスとして使う
  const analysisIdxToOsmdIdx = useCallback((analysisIdx: number): number => {
    if (!analysis || analysisIdx < 0) return -1
    if (analysisIdx < analysis.notes.length && analysis.notes[analysisIdx].type !== "note") {
      return -1
    }
    return analysisIdx < noteElementsRef.current.length ? analysisIdx : -1
  }, [analysis])

  // --- 色塗りのみ（getBoundingClientRect 不要、即時実行可能）---
  const applyComparisonColors = useCallback(() => {
    const elements = noteElementsRef.current
    const container = document.getElementById("osmd-container")
    if (elements.length === 0 || !container) return
    elements.forEach(restoreNote)

    if (!comparison) return

    const prefersReduced = typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    for (const c of comparison) {
      const osmdIdx = analysisIdxToOsmdIdx(c.note_index)
      if (osmdIdx < 0 || osmdIdx >= elements.length) continue
      const color = getComparisonColor(c)
      if (prefersReduced) {
        colorizeNote(elements[osmdIdx], color)
      } else {
        const delay = Math.min(osmdIdx * 18, 800)
        setTimeout(() => colorizeNote(elements[osmdIdx], color), delay)
      }
    }
  }, [comparison, analysisIdxToOsmdIdx])

  // --- 間違い音符オーバーレイ描画（getBoundingClientRect 使用、遅延実行専用）---
  const drawWrongNoteOverlay = useCallback(() => {
    const elements = noteElementsRef.current
    const container = document.getElementById("osmd-container")
    if (elements.length === 0 || !container || !comparison || !analysis) return

    const lineSpacing = measureLineSpacing(elements)
    const containerRect = container.getBoundingClientRect()
    const overlay = ensureOverlaySvg(container)

    for (const c of comparison) {
      if (c.pitch_ok !== false || !c.detected_pitch_hz) continue
      const osmdIdx = analysisIdxToOsmdIdx(c.note_index)
      if (osmdIdx < 0 || osmdIdx >= elements.length) continue
      const el = elements[osmdIdx]

      const expectedHz = analysis.notes[c.note_index]?.pitches?.[0]
      if (!expectedHz) continue

      const yOffset = calcYOffset(expectedHz, c.detected_pitch_hz, lineSpacing)
      if (yOffset === 0) continue

      const noteRect = el.getBoundingClientRect()
      if (noteRect.width === 0) continue
      const cx = noteRect.left + noteRect.width / 2 - containerRect.left
      const cy = noteRect.top + noteRect.height / 2 - containerRect.top

      const ellipse = document.createElementNS("http://www.w3.org/2000/svg", "ellipse")
      ellipse.setAttribute("cx", String(cx))
      ellipse.setAttribute("cy", String(cy + yOffset))
      ellipse.setAttribute("rx", String(Math.max(noteRect.width / 2.2, 5)))
      ellipse.setAttribute("ry", String(Math.max(noteRect.height / 2.5, 3.5)))
      ellipse.setAttribute("fill", "rgba(238, 34, 34, 0.3)")
      ellipse.setAttribute("stroke", "#ee2222")
      ellipse.setAttribute("stroke-width", "1.5")
      ellipse.style.pointerEvents = "none"
      overlay.appendChild(ellipse)
    }
  }, [comparison, analysis, analysisIdxToOsmdIdx])

  // 色塗り: noteElementsVersion が変わるたびに即時実行
  useEffect(() => {
    if (noteElementsVersion >= 0 && playbackState === "stopped") {
      if (comparison) {
        applyComparisonColors()
      } else {
        noteElementsRef.current.forEach(restoreNote)
      }
    }
  }, [comparison, playbackState, applyComparisonColors, noteElementsVersion])

  // オーバーレイ: comparison が変わったときだけ遅延実行（noteElementsVersion に依存しない）
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (playbackState !== "stopped" || !comparison) return
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current)
    overlayTimerRef.current = setTimeout(() => {
      drawWrongNoteOverlay()
      overlayTimerRef.current = null
    }, 2000)
    return () => {
      if (overlayTimerRef.current) { clearTimeout(overlayTimerRef.current); overlayTimerRef.current = null }
    }
  }, [comparison, playbackState, drawWrongNoteOverlay])

  // --- カーソル（縦線）操作 ---
  const ensureCursor = useCallback(() => {
    if (cursorRef.current) return cursorRef.current
    const container = document.getElementById("osmd-container")
    if (!container) return null
    container.style.position = "relative"
    const cursor = document.createElement("div")
    cursor.className = styles.playbackCursor
    container.appendChild(cursor)
    cursorRef.current = cursor
    return cursor
  }, [])

  const updateCursorFromGNotes = useCallback((gNotes: any[] | null) => {
    const cursor = cursorRef.current
    if (!cursor) return
    if (!gNotes || gNotes.length === 0) {
      cursor.style.display = "none"
      return
    }
    const svgEl = gNotes[0].getSVGGElement?.()
    if (!svgEl) { cursor.style.display = "none"; return }

    const container = document.getElementById("osmd-container")
    if (!container) return

    const svgs = container.querySelectorAll("svg")
    let activeSvg: SVGSVGElement | null = null
    for (const svg of svgs) {
      if (svg.style.display !== "none") { activeSvg = svg; break }
    }
    if (!activeSvg || !activeSvg.contains(svgEl)) {
      cursor.style.display = "none"
      return
    }

    const containerRect = container.getBoundingClientRect()
    // cursor は position:absolute でコンテナ内配置 → top をコンテンツ座標で算出するため scrollTop を加算
    const scrollTop = container.scrollTop
    const noteRect = svgEl.getBoundingClientRect()
    const x = noteRect.left + noteRect.width / 2 - containerRect.left
    const noteMidY = noteRect.top + noteRect.height / 2

    // 五線の範囲を特定
    const staves = activeSvg.querySelectorAll("g.vf-stave")
    let staffTop = noteMidY - containerRect.top - 30 + scrollTop
    let staffHeight = 60

    let closestStave: Element | null = null
    let closestDist = Infinity
    for (const stave of staves) {
      const sr = stave.getBoundingClientRect()
      const staveMid = sr.top + sr.height / 2
      const dist = Math.abs(staveMid - noteMidY)
      if (dist < closestDist) { closestDist = dist; closestStave = stave }
    }
    if (closestStave) {
      const paths = closestStave.querySelectorAll("path")
      let lineMinY = Infinity, lineMaxY = -Infinity, foundLines = 0
      for (const path of paths) {
        const r = path.getBoundingClientRect()
        if (r.height <= 2 && r.width > 20) {
          lineMinY = Math.min(lineMinY, r.top)
          lineMaxY = Math.max(lineMaxY, r.bottom)
          foundLines++
        }
      }
      if (foundLines >= 3) {
        const margin = 8
        staffTop = lineMinY - containerRect.top - margin + scrollTop
        staffHeight = (lineMaxY - lineMinY) + margin * 2
      } else {
        const sr = closestStave.getBoundingClientRect()
        staffTop = sr.top - containerRect.top + scrollTop
        staffHeight = sr.height
      }
    }

    cursor.style.display = "block"
    cursor.style.left = `${x}px`
    cursor.style.top = `${staffTop}px`
    cursor.style.height = `${staffHeight}px`
  }, [])

  const hideCursor = useCallback(() => {
    if (cursorRef.current) cursorRef.current.style.display = "none"
  }, [])

  // --- 譜面再生のアニメーション ---
  const stopVisualSync = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }, [])

  const startVisualSync = useCallback(() => {
    if (!analysis) return
    ensureCursor()
    const loop = () => {
      const t = Tone.getTransport().seconds
      const ratio = activeTempoRatioRef.current
      const analysisTime = t / ratio

      // OSMDカーソルAPIベースのハイライト
      highlightNoteAtTime(analysisTime)

      // カーソル（縦線）の位置更新
      const gNotes = findNearestGNotes(analysisTime)
      updateCursorFromGNotes(gNotes)

      animationRef.current = requestAnimationFrame(loop)
    }
    animationRef.current = requestAnimationFrame(loop)
  }, [analysis, highlightNoteAtTime, findNearestGNotes, ensureCursor, updateCursorFromGNotes])

  // --- テンポ比率ヘルパー ---
  const getTempoRatio = useCallback(() => {
    if (!analysis) return 1
    return analysis.bpm / playbackTempo
  }, [analysis, playbackTempo])

  // --- 譜面再生の完全停止 ---
  const stopPlayback = useCallback(() => {
    Tone.getTransport().stop()
    Tone.getTransport().cancel()
    stopVisualSync()
    clearHighlight()
    hideCursor()
    pausedAtRef.current = 0
    setPlaybackState("stopped")
    // 色復元 + オーバーレイ再描画は useEffect 経由で applyComparisonColors が担当
    // （playbackState → "stopped" の変化で発火する）
    // comparison が null の場合のみ即時復元
    if (!comparison) {
      noteElementsRef.current.forEach(restoreNote)
    }
  }, [comparison, stopVisualSync, clearHighlight, hideCursor])

  // --- 一時停止 ---
  const pausePlayback = useCallback(() => {
    pausedAtRef.current = Tone.getTransport().seconds
    Tone.getTransport().pause()
    stopVisualSync()
    setPlaybackState("paused")
  }, [stopVisualSync])

  // --- Partのセットアップ（共通） ---
  const setupPart = useCallback(async (startFromSec: number = 0) => {
    if (!analysis) return
    setPopover(null)
    await Tone.start()
    const transport = Tone.getTransport()
    transport.stop()
    transport.cancel()

    if (!synthRef.current) {
      if (!vibratoRef.current) {
        vibratoRef.current = new Tone.Vibrato({ frequency: 5.5, depth: 0.08 }).toDestination()
      }
      synthRef.current = new Tone.Synth({
        oscillator: { type: "sawtooth" },
        envelope: { attack: 0.08, decay: 0.05, sustain: 0.75, release: 0.35 },
      }).connect(vibratoRef.current)
    }

    const tempoRatio = getTempoRatio()
    activeTempoRatioRef.current = tempoRatio

    const events = analysis.notes
      .filter((n) => n.type === "note" && n.pitches.length > 0)
      .map((n) => ({
        time: Tone.Time(n.start_time_sec * tempoRatio, "s"),
        duration: Math.max((n.end_time_sec - n.start_time_sec) * tempoRatio, 0.05),
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
    const endTimeSec = lastNote ? lastNote.end_time_sec * tempoRatio + 0.5 : 10
    transport.schedule(() => stopPlayback(), `${endTimeSec}` as any)

    transport.seconds = startFromSec
    lastHighlightedTimeRef.current = -1
    ensureCursor()
    transport.start()
    startVisualSync()
    setPlaybackState("playing")
  }, [analysis, getTempoRatio, startVisualSync, stopPlayback, ensureCursor])

  // --- 再開 ---
  const resumePlayback = useCallback(async () => {
    await setupPart(pausedAtRef.current)
  }, [setupPart])

  // --- 先頭から再生 ---
  const startPlayback = useCallback(async () => {
    pausedAtRef.current = 0
    await setupPart(0)
  }, [setupPart])

  // --- スコアクリックで任意位置から再生 / ポップオーバー表示 ---
  const handleScoreClick = useCallback(async (e: React.MouseEvent) => {
    if (!analysis) return
    if (recGuideAnimRef.current !== null) return // 録音中は無視

    const elements = noteElementsRef.current
    if (elements.length === 0) return

    // 1. クリック座標に最も近いノート要素を特定
    const clickX = e.clientX
    const clickY = e.clientY
    let closestIdx = 0
    let closestDist = Infinity
    for (let i = 0; i < elements.length; i++) {
      const rect = elements[i].getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dist = Math.sqrt((clickX - cx) ** 2 + (clickY - cy) ** 2)
      if (dist < closestDist) {
        closestDist = dist
        closestIdx = i
      }
    }

    const HIT_RADIUS = 40

    // 2. ポップオーバー分岐: 停止中 + 評価あり + ノート近傍
    if (playbackState === "stopped" && comparison && closestDist <= HIT_RADIUS) {
      const compNote = comparison.find(c => c.note_index === closestIdx)
      if (compNote) {
        const parentRect = scoreWrapperRef.current?.getBoundingClientRect()
        if (parentRect) {
          const noteRect = elements[closestIdx].getBoundingClientRect()
          const POPOVER_HEIGHT_EST = 80
          const POPOVER_HALF_WIDTH = 120
          let left = noteRect.left + noteRect.width / 2 - parentRect.left
          left = Math.max(POPOVER_HALF_WIDTH, Math.min(left, parentRect.width - POPOVER_HALF_WIDTH))
          let top = noteRect.top - parentRect.top - POPOVER_HEIGHT_EST - 8
          if (top < 0) {
            top = noteRect.bottom - parentRect.top + 8
          }
          setPopover({ note: compNote, left, top })
          return
        }
      }
      // compNote なし（休符等）→ フォールスルーして再生ジャンプ
    }

    // 3. 再生ジャンプ（既存動作）
    setPopover(null)
    const tempoRatio = getTempoRatio()
    const startSec = analysis.notes[closestIdx]
      ? analysis.notes[closestIdx].start_time_sec * tempoRatio
      : 0

    if (playbackState === "playing") {
      Tone.getTransport().stop()
      Tone.getTransport().cancel()
      stopVisualSync()
    }

    await setupPart(startSec)
  }, [analysis, playbackState, comparison, getTempoRatio, setupPart, stopVisualSync])

  // --- 録音中ガイドカーソル ---
  const recGuideAnimRef = useRef<number | null>(null)
  const recGuideStartRef = useRef<number>(0)

  // ▼ F-1 Commit 2: 譜面の行構造とスクロール計画
  const [scrollPlan, setScrollPlan] = useState<ScrollPlan | null>(null)
  useEffect(() => {
    // [DIAG] 一時診断ログ: 真因切り分けのためどの条件で early-return したか可視化
    console.log("[F-1/diag] scrollPlan effect tick", {
      isOsmdReady,
      hasOsmdRef: !!osmdRef.current,
      recordingBpm,
    })
    if (!isOsmdReady || !osmdRef.current || recordingBpm === null) return
    const container = document.getElementById("osmd-container")
    const viewportHeight = container?.clientHeight ?? 600
    const plan = buildScrollPlan(osmdRef.current, recordingBpm, viewportHeight)
    setScrollPlan(plan)
    console.log("[F-1/diag] scrollPlan generated", plan)
  }, [isOsmdReady, recordingBpm])

  // ▼ F-1 Commit 4: 末尾到達自動停止トリガ (Recorder の停止ボタンを click)
  const triggerStopRecording = useCallback(() => {
    const button = document.querySelector(
      '[data-testid="recorder-stop-button"]',
    ) as HTMLButtonElement | null
    if (button) {
      button.click()
    } else {
      console.warn("[F-1] recorder stop button not found")
    }
  }, [])

  // ▼ F-1 Commit 6: 戻るボタン制御 (録音中 / countdown 中)
  useEffect(() => {
    if (recordingState !== "recording" && recordingState !== "countdown") return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = "録音中です。中断しますか？"
      return e.returnValue
    }

    const handlePopState = () => {
      const confirmed = window.confirm("録音中です。中断しますか？")
      if (confirmed) {
        triggerStopRecording()
      } else {
        window.history.pushState(null, "", window.location.href)
      }
    }

    window.history.pushState(null, "", window.location.href)
    window.addEventListener("beforeunload", handleBeforeUnload)
    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("popstate", handlePopState)
    }
  }, [recordingState, triggerStopRecording])

  // ▼ F-1 Commit 6: 画面回転 / リサイズで scrollPlan を再計算
  useEffect(() => {
    if (recordingState !== "recording") return
    if (!isOsmdReady || !osmdRef.current || recordingBpm === null) return

    const handleResize = () => {
      if (!osmdRef.current || recordingBpm === null) return
      const container = document.getElementById("osmd-container")
      const viewportHeight = container?.clientHeight ?? 600
      const newPlan = buildScrollPlan(osmdRef.current, recordingBpm, viewportHeight)
      setScrollPlan(newPlan)
    }

    window.addEventListener("resize", handleResize)
    window.addEventListener("orientationchange", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("orientationchange", handleResize)
    }
  }, [recordingState, isOsmdReady, recordingBpm])

  // ▼ F-1 Commit 5: 短い譜面の場合は body[data-short-score=true] で上端揃え
  const isShortScore = scrollPlan?.isShortScore ?? false
  useEffect(() => {
    if (isShortScore) {
      document.body.setAttribute("data-short-score", "true")
    } else {
      document.body.removeAttribute("data-short-score")
    }
    return () => {
      document.body.removeAttribute("data-short-score")
    }
  }, [isShortScore])

  // ▼ F-1 Commit 3: 録音中の自動スクロール (短い譜面はスキップ、analysis null もスキップ)
  useEffect(() => {
    if (recordingState !== "recording") return
    if (!scrollPlan || scrollPlan.isShortScore) return
    if (!analysis) return

    const container = document.getElementById("osmd-container")
    if (!container) return

    let rafId = 0
    const cursorOffsetRatio = 1 / 3
    const TAIL_BUFFER_SEC = 1.5

    const tick = () => {
      if (!recGuideStartRef.current) {
        rafId = requestAnimationFrame(tick)
        return
      }
      const elapsedSec = (performance.now() - recGuideStartRef.current) / 1000

      // F-1 Commit 4: 末尾到達後 1.5 秒で自動停止
      if (elapsedSec >= scrollPlan.totalDurationSec + TAIL_BUFFER_SEC) {
        triggerStopRecording()
        return
      }

      const located = locateInPlan(scrollPlan, elapsedSec)
      if (!located) return

      const viewportHeight = container.clientHeight
      const targetScrollTop = located.scrollTopPx - viewportHeight * cursorOffsetRatio
      const clampedScrollTop = Math.max(
        0,
        Math.min(targetScrollTop, scrollPlan.totalHeightPx - viewportHeight),
      )
      container.scrollTop = clampedScrollTop

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [recordingState, scrollPlan, analysis, triggerStopRecording])

  // 録音中のガイドラインを前後ノート間で線形補間して横スライドさせる
  const updateRecordingCursor = useCallback((currentSec: number) => {
    const cursor = cursorRef.current
    if (!cursor) return
    const times = sortedTimes.current
    if (times.length === 0) return

    // 前後のノート index を二分探索
    let lo = 0, hi = times.length - 1
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2)
      if (times[mid] < currentSec) lo = mid + 1
      else hi = mid
    }
    const nextIdx = times[lo] >= currentSec ? lo : Math.min(lo + 1, times.length - 1)
    const prevIdx = Math.max(0, nextIdx - 1)
    const prevTime = times[prevIdx]
    const nextTime = times[nextIdx]

    const prevGNotes = timeToGNotesMap.current.get(prevTime)
    if (!prevGNotes || prevGNotes.length === 0) return

    const container = document.getElementById("osmd-container")
    if (!container) return

    const svgs = container.querySelectorAll("svg")
    let activeSvg: SVGSVGElement | null = null
    for (const svg of svgs) {
      if (svg.style.display !== "none") { activeSvg = svg as SVGSVGElement; break }
    }
    if (!activeSvg) return

    const prevSvg = prevGNotes[0].getSVGGElement?.()
    if (!prevSvg || !activeSvg.contains(prevSvg)) {
      cursor.style.display = "none"
      return
    }

    const containerRect = container.getBoundingClientRect()
    // cursor は position:absolute でコンテナ内配置 → top/left はコンテンツ座標
    // viewport 相対の rect を + scrollTop でコンテンツ相対に変換 (横スクロールはこのアプリで発生しないので scrollLeft は使わない)
    const scrollTop = container.scrollTop
    const prevRect = prevSvg.getBoundingClientRect()
    const prevX = prevRect.left + prevRect.width / 2 - containerRect.left

    // 前後ノートが同じ段なら x を線形補間、改段を跨ぐなら prev 位置に固定
    let x = prevX
    const nextGNotes = timeToGNotesMap.current.get(nextTime)
    if (nextGNotes && nextGNotes.length > 0 && nextTime > prevTime) {
      const nextSvg = nextGNotes[0].getSVGGElement?.()
      if (nextSvg && activeSvg.contains(nextSvg)) {
        const nextRect = nextSvg.getBoundingClientRect()
        const sameRow = Math.abs(prevRect.top - nextRect.top) < 20
        if (sameRow) {
          const nextX = nextRect.left + nextRect.width / 2 - containerRect.left
          const progress = Math.max(0, Math.min(1, (currentSec - prevTime) / (nextTime - prevTime)))
          x = prevX + (nextX - prevX) * progress
        }
      }
    }

    // 五線の範囲を特定 (updateCursorFromGNotes と同じロジック)
    const noteMidY = prevRect.top + prevRect.height / 2
    const staves = activeSvg.querySelectorAll("g.vf-stave")
    let staffTop = noteMidY - containerRect.top - 30 + scrollTop
    let staffHeight = 60

    let closestStave: Element | null = null
    let closestDist = Infinity
    for (const stave of staves) {
      const sr = stave.getBoundingClientRect()
      const staveMid = sr.top + sr.height / 2
      const dist = Math.abs(staveMid - noteMidY)
      if (dist < closestDist) { closestDist = dist; closestStave = stave }
    }
    if (closestStave) {
      const paths = closestStave.querySelectorAll("path")
      let lineMinY = Infinity, lineMaxY = -Infinity, foundLines = 0
      for (const path of paths) {
        const r = path.getBoundingClientRect()
        if (r.height <= 2 && r.width > 20) {
          lineMinY = Math.min(lineMinY, r.top)
          lineMaxY = Math.max(lineMaxY, r.bottom)
          foundLines++
        }
      }
      if (foundLines >= 3) {
        const margin = 8
        staffTop = lineMinY - containerRect.top - margin + scrollTop
        staffHeight = (lineMaxY - lineMinY) + margin * 2
      } else {
        const sr = closestStave.getBoundingClientRect()
        staffTop = sr.top - containerRect.top + scrollTop
        staffHeight = sr.height
      }
    }

    cursor.style.display = "block"
    cursor.style.left = `${x}px`
    cursor.style.top = `${staffTop}px`
    cursor.style.height = `${staffHeight}px`
  }, [])

  const startRecordingGuide = useCallback(() => {
    if (!analysis) return
    ensureCursor()
    recGuideStartRef.current = performance.now()

    const loop = () => {
      const elapsedRealSec = (performance.now() - recGuideStartRef.current) / 1000
      // ユーザー録音テンポで再生位置をスケール:
      // recordingBpm=60, analysis.bpm=120 なら、実時間 1 秒 = 楽譜時間 0.5 秒
      // (ゆっくり録音するほど、カーソルもゆっくり進む)
      const recBpm = recordingBpmRef.current || analysis.bpm
      const scoreTimeSec = elapsedRealSec * (recBpm / analysis.bpm)
      updateRecordingCursor(scoreTimeSec)
      recGuideAnimRef.current = requestAnimationFrame(loop)
    }
    recGuideAnimRef.current = requestAnimationFrame(loop)
  }, [analysis, ensureCursor, updateRecordingCursor])

  const stopRecordingGuide = useCallback(() => {
    if (recGuideAnimRef.current) {
      cancelAnimationFrame(recGuideAnimRef.current)
      recGuideAnimRef.current = null
    }
    hideCursor()
  }, [hideCursor])

  // --- ESCキーでポップオーバーを閉じる ---
  useEffect(() => {
    if (!popover) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPopover(null)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [popover])

  // --- クリーンアップ ---
  useEffect(() => {
    return () => {
      stopVisualSync()
      if (recGuideAnimRef.current) cancelAnimationFrame(recGuideAnimRef.current)
      try {
        Tone.getTransport().stop()
        Tone.getTransport().cancel()
      } catch { /* ignore */ }
    }
  }, [stopVisualSync])

  return (
    <div className={styles.container} data-section="score-detail-root">
      {/* F-1: フルスクリーン中の操作ガイドバー (Recorder の停止ボタンは leftColumn 内で非表示のため、戻るボタンを案内) */}
      {isFullscreen && (
        <div data-section="fullscreen-bar">
          演奏停止するには、ブラウザの戻るボタン(←)を押してください
        </div>
      )}
      {/* UI-6: 削除完了トースト (3 秒で自動消去) */}
      {deleteToast && (
        <div className={styles.deleteToast} role="status" aria-live="polite">
          {deleteToast}
        </div>
      )}
      <div className={styles.header} data-section="header">
        <div><h1 className={styles.title}>{score.title}</h1></div>
      </div>

      <div className={styles.grid}>
        <div className={styles.leftColumn} data-section="left-column">
          {infoSlot}
          <div data-onboarding="scoreDetail.recordButton">
            <Recorder
              onRecordingComplete={handleRecordingComplete}
              previousBestScore={bestPitchScore}
              bestOverallScore={bestOverallScore}
              bpm={analysis?.bpm ?? undefined}
              onCountdownStart={() => setRecordingState("countdown")}
              onRecordingStart={() => { setRecordingState("recording"); startRecordingGuide() }}
              onRecordingBpmChange={handleRecordingBpmChange}
              onRecordingStop={() => { setRecordingState("preview"); stopRecordingGuide() }}
              uploadProgress={uploadProgress}
            />
          </div>
          <div className={styles.card} data-onboarding="scoreDetail.playControls">
            <h3>楽譜を再生</h3>
            {analysis && (
              <div className={styles.tempoControl}>
                <div className={styles.tempoHeader}>
                  <span className={styles.tempoLabel}>テンポ</span>
                  <span className={styles.tempoValue}>{playbackTempo} BPM</span>
                </div>
                <input
                  type="range"
                  min={Math.max(Math.round((analysis.bpm) * 0.25), 20)}
                  max={Math.round((analysis.bpm) * 2)}
                  value={playbackTempo}
                  onChange={(e) => setPlaybackTempo(Number(e.target.value))}
                  disabled={playbackState === "playing"}
                  className={styles.tempoSlider}
                />
                <div className={styles.tempoPresets}>
                  {[0.5, 0.75, 1, 1.25, 1.5].map((ratio) => {
                    const t = Math.round(analysis.bpm * ratio)
                    return (
                      <button
                        key={ratio}
                        className={`${styles.tempoPresetBtn} ${playbackTempo === t ? styles.tempoPresetActive : ""}`}
                        onClick={() => setPlaybackTempo(t)}
                        disabled={playbackState === "playing"}
                      >
                        {ratio === 1 ? `${t}` : `x${ratio}`}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            <div className={styles.playbackButtons}>
              {playbackState === "stopped" && (
                <button className={styles.playBtn} onClick={startPlayback} disabled={!analysis}>
                  再生
                </button>
              )}
              {playbackState === "playing" && (
                <>
                  <button className={styles.playBtn} onClick={pausePlayback}>
                    一時停止
                  </button>
                  <button className={styles.stopBtn} onClick={stopPlayback}>
                    停止
                  </button>
                </>
              )}
              {playbackState === "paused" && (
                <>
                  <button className={styles.playBtn} onClick={resumePlayback}>
                    再開
                  </button>
                  <button className={styles.stopBtn} onClick={stopPlayback}>
                    停止
                  </button>
                </>
              )}
            </div>
          </div>

          <AudioPlayer audioUrl={selected?.audioUrl ?? null} performanceId={selected?.id} />

          {selected && (selected.pitchAccuracy != null || selected.timingAccuracy != null) && (
            <EvaluationSummaryCard performance={selected} warnings={warnings} />
          )}

          {/* v3.2.2 上達ループエンジン: PracticeItem 由来 + 演奏選択時に skill-detail を表示 */}
          {practiceItemId && selected?.id && (
            <PerformanceSkillDetail
              performanceId={selected.id}
              onDeleted={handlePerformanceDeleted}
            />
          )}
          {practiceItemId && !selected && recentlyDeleted && (
            <div className={styles.deleteHint} role="status">
              演奏を削除しました。履歴から別の演奏を選んでください。
            </div>
          )}

          <div data-onboarding="scoreDetail.performanceHistory">
            <PerformanceHistory
              performances={performances}
              selectedId={selected?.id ?? null}
              onSelect={handleSelectPerformance}
              loading={perfLoading}
              performanceCount={performanceCount}
              kind={practiceItemId ? "practice" : "score"}
              onRenamed={(performanceId, newName) => {
                setPerformances((prev) =>
                  prev.map((p) => (p.id === performanceId ? { ...p, name: newName } : p))
                )
                setSelected((prev) =>
                  prev && prev.id === performanceId ? { ...prev, name: newName } : prev
                )
              }}
            />
          </div>
        </div>

        <div className={styles.rightColumn} data-section="right-column">
          <div ref={scoreWrapperRef} style={{ position: "relative" }} data-onboarding="scoreDetail.scoreOverlay">
            <ScoreViewer
              buildUrl={buildUrl}
              onNoteElementsReady={handleNoteElementsReady}
              onOsmdReady={handleOsmdReady}
              onScoreClick={handleScoreClick}
              onPageChange={() => setPopover(null)}
              singleStaffLine={singleStaffLine}
            />
            {popover && (
              <div
                className={styles.notePopover}
                style={{
                  left: popover.left,
                  top: popover.top,
                  borderLeftColor: getComparisonColor(popover.note),
                }}
              >
                <NotePopoverContent note={popover.note} />
              </div>
            )}
          </div>
        </div>
      </div>

      <OnboardingTrigger pageKey={practiceItemId ? "practiceItem" : "scoreDetail"} />
    </div>
  )
}
