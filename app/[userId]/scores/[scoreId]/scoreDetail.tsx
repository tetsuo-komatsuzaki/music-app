"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import ScoreDetailTabs, { type ScoreDetailTabId } from "@/app/components/ScoreDetailTabs"
import MasterBadge from "@/app/components/MasterBadge"
import FavoriteButton from "@/app/components/FavoriteButton"
import ArcoResultOverlay from "@/app/components/ArcoResultOverlay"
import ScoreLoopDetail from "@/app/components/ScoreLoopDetail"
import AnnotationLayer from "./AnnotationLayer"
import SymbolGuide, { type SymbolGuideHandle } from "./SymbolGuide"
import { extractScoreSymbols } from "@/app/_libs/scoreSymbols"
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
import { resolvePartToNoteRange, type Part } from "@/app/_libs/materialParts"
import { CELEBRATION_SINCE_MS } from "@/app/_libs/featureFlags"
import { parseMilestoneEvents } from "@/app/_libs/celebration"
import CelebrationBanner from "@/app/components/CelebrationBanner"
import MilestoneCelebration from "@/app/components/MilestoneCelebration"
import CelebrationBoundary from "@/app/components/CelebrationBoundary"
import OnboardingTrigger from "@/app/[userId]/_onboarding/OnboardingTrigger"
import { useOnboarding } from "@/app/[userId]/_onboarding/hooks/useOnboarding"

// =========================================================
// 型定義
// =========================================================

// v1.7 Phase B (2026-05-23): EvaluationStatus は重音/ハーモニクスの新値を含む。
// scoreDetail はまだ新値の専用 UI を持たないが、型としては受け入れる
// (Phase F で表現追加するまで、新値は既存 UI の中立色で描画される)。
import type { EvaluationStatus } from "@/app/types/comparisonResult"

/** v2 正規化済みの比較結果（コンポーネント内で扱う唯一の型） */
type ComparisonNote = {
  note_index: number
  measure_number: number
  note_name: string
  pitch_ok: boolean | null
  start_ok: boolean | null
  pitch_cents_error: number | null
  start_diff_sec: number | null
  evaluation_status: EvaluationStatus
  detected_pitch_hz: number | null
}

type PerformanceDTO = {
  id: string
  name: string | null
  uploadedAt: string
  status: string
  analysisStatus?: string | null
  audioUrl: string | null
  comparisonResult: any[] | null
  comparisonWarnings?: string[]
  pitchAccuracy?: number | null
  timingAccuracy?: number | null
  evaluatedNotes?: number | null
  analysisSummary?: any
  // 区間録音 (部分練習 Phase 2): 非null = 区間演奏。曲の公式スコアには非算入・履歴で「区間」表示。
  rangeFromNote?: number | null
  rangeToNote?: number | null
  // パート分け (2026-07-26): 区間がどの名前付きパートか。パート別 自己ベスト/推移の集計キー。
  partId?: string | null
}

// analysis.json (analyze_musicxml.py) の音符。記号ガイド用のフィールドは
// 以前から書き出されていたが型に載っていなかったため、任意項目として追加 (2026-07-25)。
type AnalysisNote = {
  note_index: number
  measure_number?: number // パート(小節範囲)→音符範囲の解決に使う (2026-07-26)
  type: string
  pitches: number[]
  start_time_sec: number
  end_time_sec: number
  articulations?: string[] | null
  dynamic?: string | null
  is_tied?: boolean | null
  is_tremolo?: boolean | null
  is_trill?: boolean | null
  is_mordent?: boolean | null
  is_chord?: boolean | null
  is_harmonic?: boolean | null
  tuplet_actual?: number | null
  display_finger?: number | null
  display_string_num?: number | null
}

type AnalysisData = {
  bpm: number
  notes: AnalysisNote[]
  key?: { tonic?: string | null; mode?: string | null } | null
  time_signature?: { numerator?: number | null; denominator?: number | null } | null
  spanners?: { slurs?: { start: number; end: number }[] | null } | null
}

type Props = {
  score: { id: string; title: string; badge?: "mastered" | "achieved" | null }
  userId: string
  analysis: AnalysisData | null
  buildUrl: string | null
  /**
   * 解析起動を通知する Server Action (v3.3 spec Commit 3 で型変更)
   * Commit 4 で uploadRecord/uploadPracticeRecord 自体が新シグネチャに変わる予定。
   * 現状は呼び出し側 (page.tsx) でアダプター経由の呼び出しを行う。
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uploadAction: (params: { performanceId: string; recordingBpm?: number; rangeFromNote?: number; rangeToNote?: number; partId?: string }) => Promise<any>
  performanceCount: number
  latestPitchAccuracy: number | null
  infoSlot?: React.ReactNode
  singleStaffLine?: boolean
  /** practice用: score-performancesの代わりにpractice-performancesを使う */
  practiceItemId?: string
  /** お気に入り初期状態 (曲/教材) */
  initialFavorite?: boolean
  /** パート分け (2026-07-26): 曲(グループ)共通のパート範囲リスト。空=分割なし(通しのみ) */
  parts?: Part[]
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
  // v1.7 Phase F: spectral_inconclusive (信号弱で判定保留) は赤判定にせず灰へ
  if (r.evaluation_status === "spectral_inconclusive") return COLOR_GREY
  if (r.evaluation_status === "not_evaluated" || r.evaluation_status === "section_missing" || r.evaluation_status === "not_detected") {
    return COLOR_GREY
  }
  // v1.7 Phase F: △ (重音部分一致 / ハーモニクス普通音色化) は橙 = 改善ポイント
  if (r.evaluation_status === "double_stop_partial" ||
      r.evaluation_status === "harmonic_normal_tone") return COLOR_ORANGE
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

// 演奏スコア = 音程・リズム正確率の平均。総合点(overallScore)廃止に伴う曲の代表点。
// (2026-06-07 設計確定: 曲の評価は音程+リズム、課題クリアは別軸)
function performanceScore(p: { pitchAccuracy?: number | null; timingAccuracy?: number | null }): number | null {
  if (p.pitchAccuracy == null || p.timingAccuracy == null) return null
  return Math.round((p.pitchAccuracy + p.timingAccuracy) / 2)
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
  const totalNotes = Array.isArray(performance.comparisonResult) ? performance.comparisonResult.length : null
  const showEval = performance.evaluatedNotes != null

  // 音程/タイミング正確率と点数は畳んだ演奏履歴カードで表示済みのため、
  // ここは「評価対象 ○/○ ノート」だけを小さく残す (2026-08-01 Tetsuo)。
  if (!showEval && warnings.length === 0) return null

  return (
    <div>
      {showEval && (
        <div style={{ fontSize: 11, color: "#9aa6b3", fontWeight: 600 }}>
          評価対象 {performance.evaluatedNotes}{totalNotes != null ? ` / ${totalNotes}` : ""} ノート
        </div>
      )}
      {warnings.length > 0 && (
        <div className={styles.evalWarnings} style={{ marginTop: showEval ? 8 : 0 }}>
          {warnings.map((w, i) => (
            <div key={i} className={styles.evalWarning}>{w}</div>
          ))}
        </div>
      )}
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
  renderDetail,
  onReplayArco,
}: {
  performances: PerformanceDTO[]
  selectedId: string | null
  onSelect: (p: PerformanceDTO) => void
  loading: boolean
  performanceCount: number
  kind: "score" | "practice"
  onRenamed: (performanceId: string, newName: string) => void
  /** 開いたカード内に収納する評価詳細 (再生 / 得点 / 判定内容) を描画する */
  renderDetail?: (p: PerformanceDTO) => React.ReactNode
  /** アルコ結果オーバーレイを再表示する (スコアモードのみ) */
  onReplayArco?: (p: PerformanceDTO) => void
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
            // 既定名 "Performance #N" は長いので短い "録音 #N" に (既存データも表示時に変換)
            const nameMatch = /^Performance #?(\d+)$/i.exec(p.name ?? "")
            const displayName = nameMatch ? `録音 #${nameMatch[1]}` : (p.name ?? "録音")
            const score = performanceScore(p)
            const statusLabel =
              score != null
                ? `${score}点`
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
                <div className={styles.histMain}>
                  {/* 左: 点数 (ランク色)。無ければプレースホルダ */}
                  {!isEditing &&
                    (score != null ? (
                      <div className={styles.histScore} style={{ color: rankLabels[getScoreRank(score)].color }}>
                        {score}
                        <span className={styles.histScoreUnit}>点</span>
                      </div>
                    ) : (
                      <div className={styles.histScoreNa} aria-hidden>—</div>
                    ))}

                  {/* 中: 名前・ランク・日付 + 音程/リズムバー (無評価時は状態) */}
                  <div className={styles.histMid}>
                    {isEditing ? (
                      <div className={styles.histEditRow}>
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
                        <button type="button" className={styles.historyActionBtn} onClick={(e) => submitEdit(p.id, e)} disabled={saving} aria-label="保存">{saving ? "..." : "保存"}</button>
                        <button type="button" className={styles.historyActionBtn} onClick={cancelEdit} disabled={saving} aria-label="キャンセル">取消</button>
                      </div>
                    ) : (
                      <>
                        <div className={styles.histTop}>
                          <span className={styles.historyName}>{displayName}</span>
                          {p.rangeFromNote != null && (
                            <span className={styles.rangeTag} title="区間だけを録音した部分練習（曲のスコアには非算入）">区間</span>
                          )}
                          <span className={styles.historyDate}>{dateLabel}</span>
                        </div>
                        {score != null ? (
                          <div className={styles.histSubs}>
                            <div className={styles.histBar}>
                              <span className={styles.histDot} style={{ background: "#4a6cf7" }} />
                              <span className={styles.histMiniLabel}>音程</span>
                              <span className={styles.histBarTrack}>
                                <span className={styles.histBarFill} style={{ width: `${Math.round(p.pitchAccuracy!)}%`, background: "#4a6cf7" }} />
                              </span>
                              <b className={styles.histBarVal}>{Math.round(p.pitchAccuracy!)}</b>
                            </div>
                            <div className={styles.histBar}>
                              <span className={styles.histDot} style={{ background: "#e0872b" }} />
                              <span className={styles.histMiniLabel}>リズム</span>
                              <span className={styles.histBarTrack}>
                                <span className={styles.histBarFill} style={{ width: `${Math.round(p.timingAccuracy!)}%`, background: "#e0872b" }} />
                              </span>
                              <b className={styles.histBarVal}>{Math.round(p.timingAccuracy!)}</b>
                            </div>
                          </div>
                        ) : (
                          <div className={styles.histStatusRow}>
                            <span>{statusLabel}</span>
                            {showEvalBadge && <span className={styles.historyBadge}>評価あり</span>}
                          </div>
                        )}
                      </>
                    )}
                    {isEditing && saveError && (
                      <div className={styles.historyError}>{saveError}</div>
                    )}
                  </div>

                  {/* 右: 開閉のみ (操作は展開後に表示してモックの簡潔な行に合わせる) */}
                  {!isEditing && (
                    <span aria-hidden className={styles.histChev}>
                      {selectedId === p.id ? "▲" : "▼"}
                    </span>
                  )}
                </div>
                {/* アコーディオン展開: 操作(結果/名前) + 再生 / 得点 / 判定内容 */}
                {!isEditing && selectedId === p.id && (
                  <div
                    style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className={styles.histDetailActions}>
                      {score != null && onReplayArco && (
                        <button
                          type="button"
                          className={styles.historyActionBtn}
                          onClick={(e) => { e.stopPropagation(); onReplayArco(p) }}
                          title="アルコの結果をもう一度"
                        >
                          🎻 結果をもう一度
                        </button>
                      )}
                      <button
                        type="button"
                        className={styles.historyActionBtn}
                        onClick={(e) => startEdit(p, e)}
                        title="名前を編集"
                      >
                        ✏ 名前を変更
                      </button>
                    </div>
                    {renderDetail && renderDetail(p)}
                  </div>
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
// サブコンポーネント: ProgressTrajectory（上達のようす）
// 演奏履歴を「1演奏ずつのカード」ではなく "推移" で見せる (2026-07-25 Tetsuo確定・案1拡張)。
// 総合スコアの折れ線を主役に、音程/リズムの分解と統計を添える。個別一覧は呼び手側で折りたたむ。
// データは既存 performances(pitchAccuracy/timingAccuracy/uploadedAt) のみで算出。区間録音は非算入。
// =========================================================

const GOAL_SCORE = 90 // 達成ライン (曲マスター基準・アプリ全体と統一)
const TRAJECTORY_MIN_POINTS = 2 // 推移として見せるのに必要な最小演奏数

type TrajAxis = "total" | "pitch" | "rhythm"
const TRAJ_COLOR: Record<TrajAxis, string> = { total: "#2e8b57", pitch: "#3f74c4", rhythm: "#cc5470" }

/** 数値系列を viewBox 内の polyline points 文字列にする */
function seriesPoints(values: number[], w: number, h: number, pad: number, minV: number, maxV: number): string {
  const n = values.length
  const span = maxV - minV || 1
  return values
    .map((v, i) => {
      const x = n === 1 ? w / 2 : pad + (i / (n - 1)) * (w - 2 * pad)
      const y = h - pad - ((v - minV) / span) * (h - 2 * pad)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")
}

function TrajStat({ v, l }: { v: string; l: string }) {
  return (
    <div style={{ flex: 1, background: "#f7f9fc", borderRadius: 11, padding: "9px 4px", textAlign: "center" }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: "#2b3742", fontVariantNumeric: "tabular-nums" }}>{v}</div>
      <div style={{ fontSize: 10, color: "#9aa6b3", fontWeight: 700, marginTop: 2 }}>{l}</div>
    </div>
  )
}

/** 音程/リズムのミニ推移カード */
function ProgressTrajectory({
  performances,
  partId,
  title,
}: {
  performances: PerformanceDTO[]
  /** 指定時: そのパート(partId一致の区間録音)だけの推移。未指定: 通し(区間非算入)。 */
  partId?: string
  title?: string
}) {
  const [axis, setAxis] = useState<TrajAxis>("total")

  // partId指定=そのパートの区間録音のみ / 未指定=通し演奏のみ(区間非算入)。いずれも評価済み・古い順。
  const evaluated = performances
    .filter((p) =>
      (partId ? p.partId === partId : p.rangeFromNote == null) &&
      p.pitchAccuracy != null &&
      p.timingAccuracy != null,
    )
    .slice()
    .sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime())

  if (evaluated.length < TRAJECTORY_MIN_POINTS) return null

  const totals = evaluated.map((p) => performanceScore(p) ?? 0)
  const pitches = evaluated.map((p) => Math.round(p.pitchAccuracy!))
  const timings = evaluated.map((p) => Math.round(p.timingAccuracy!))
  const series = axis === "total" ? totals : axis === "pitch" ? pitches : timings
  const color = TRAJ_COLOR[axis]

  // 表示中の軸(総合/音程/リズム)に合わせて、数値・伸び・統計も切り替える
  const latest = series[series.length - 1]
  // 直近5回の伸び: 最新 − (5回前 or 最初)
  const baseIdx = Math.max(0, series.length - 5)
  const delta = latest - series[baseIdx]
  const best = Math.max(...series)
  const recent5 = series.slice(-5)
  const recentAvg = Math.round(recent5.reduce((s, v) => s + v, 0) / recent5.length)

  // チャート座標 (viewBox 265x110, pad 10)。下限は 50 か 最低点-5 の低い方。
  const W = 265, H = 110, PAD = 10
  const minV = Math.max(0, Math.min(50, Math.min(...series) - 5))
  const maxV = 100
  const pts = seriesPoints(series, W, H, PAD, minV, maxV)
  const goalY = H - PAD - ((GOAL_SCORE - minV) / (maxV - minV)) * (H - 2 * PAD)
  const lastPt = pts.split(" ").pop()!.split(",")

  const seg = (key: TrajAxis, label: string) => (
    <button
      type="button"
      onClick={() => setAxis(key)}
      style={{
        flex: 1, border: "none", background: axis === key ? "#fff" : "transparent",
        fontSize: 11.5, fontWeight: 800, color: axis === key ? TRAJ_COLOR[key] : "#8b97a3",
        padding: "6px 0", borderRadius: 8, cursor: "pointer",
        boxShadow: axis === key ? "0 1px 2px rgba(30,45,70,.08)" : "none",
      }}
    >
      {label}
    </button>
  )

  return (
    <div className={styles.card}>
      <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 800 }}>{title ?? "上達のようす"}</h3>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginBottom: 12 }}>
        <div>
          <div>
            <span style={{ fontSize: 40, fontWeight: 800, lineHeight: .95, color, fontVariantNumeric: "tabular-nums" }}>{latest}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color }}>点</span>
          </div>
        </div>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 800,
          color: delta >= 0 ? "#2e8b57" : "#cc5470", background: delta >= 0 ? "#e9f7ef" : "#fdeef0",
          borderRadius: 999, padding: "4px 10px", marginBottom: 4,
        }}>
          {delta >= 0 ? "▲" : "▼"} {delta >= 0 ? "+" : ""}{delta}
          <span style={{ color: "#9aa6b3", fontWeight: 700 }}>直近{recent5.length}回</span>
        </span>
      </div>

      <div style={{ display: "flex", gap: 4, background: "#f1f4f8", borderRadius: 10, padding: 3, marginBottom: 10 }}>
        {seg("total", "総合")}
        {seg("pitch", "音程")}
        {seg("rhythm", "リズム")}
      </div>

      <div style={{ position: "relative" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="120" preserveAspectRatio="none">
          {goalY > PAD && goalY < H - PAD && (
            <line x1={PAD - 2} y1={goalY} x2={W - PAD + 2} y2={goalY} stroke="#e7c9a0" strokeWidth="1.2" strokeDasharray="4 4" />
          )}
          {axis === "total" && (
            <path d={`M${pts} L${lastPt[0]},${H} L${PAD},${H} Z`} fill="#e9f7ef" />
          )}
          <polyline points={pts} fill="none" stroke={color} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={lastPt[0]} cy={lastPt[1]} r="4.4" fill={color} stroke="#fff" strokeWidth="2" />
        </svg>
        {goalY > PAD && goalY < H - PAD && (
          <span style={{ position: "absolute", right: 2, top: Math.max(0, goalY * (120 / H) - 14), fontSize: 9.5, fontWeight: 800, color: "#b5651d" }}>
            達成 {GOAL_SCORE}点
          </span>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#b3bcc6", marginTop: 2 }}>
        <span>{new Date(evaluated[0].uploadedAt).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}</span>
        <span>いま</span>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <TrajStat v={String(best)} l="自己ベスト" />
        <TrajStat v={String(recentAvg)} l={`直近${recent5.length}回平均`} />
        <TrajStat v={String(evaluated.length)} l="演奏回数" />
      </div>

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
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "2px 0" }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#555", whiteSpace: "nowrap" }}>🔊 この演奏を聴く</span>
      <audio
        key={performanceId}
        controls
        src={audioUrl ?? undefined}
        style={{ flex: 1, minWidth: 0, height: 36 }}
      />
    </div>
  )
}

// スコア(譜面)下に置く判定カラーの凡例
function ScoreLegend() {
  return (
    <div className={styles.evalLegend}>
      <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: COLOR_GREEN }} /> 正確</span>
      <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: COLOR_ORANGE }} /> タイミングずれ</span>
      <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: COLOR_RED }} /> 音程ずれ</span>
      <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: COLOR_GREY }} /> 判定不能</span>
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
  infoSlot,
  singleStaffLine,
  practiceItemId,
  initialFavorite,
  parts = [],
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // ▼ 上達ループタブ (Phase 4-1、Score 演奏のみ。practice 経路では非表示)
  const isScoreMode = !practiceItemId
  const urlTab: ScoreDetailTabId =
    ["review", "loop"].includes(searchParams.get("tab") ?? "")
      ? "review"
      : "play"
  const [activeTab, setActiveTab] = useState<ScoreDetailTabId>(urlTab)
  // URL の ?tab= が外部から変わったら追従する (画面ガイドのタブ誘導 targetUrl など)。
  // タブ操作自体は setActiveTab で即時反映し、router.replace の完了を待たない。
  // 「props 変化に合わせた描画中の state 調整」= React 公式パターン (effect ではない)。
  const [lastUrlTab, setLastUrlTab] = useState<ScoreDetailTabId>(urlTab)
  if (urlTab !== lastUrlTab) {
    setLastUrlTab(urlTab)
    setActiveTab(urlTab)
  }
  const handleTabChange = useCallback(
    (next: ScoreDetailTabId) => {
      setActiveTab(next)
      const params = new URLSearchParams(searchParams.toString())
      if (next === "review") {
        params.set("tab", "review")
      } else {
        params.delete("tab")
      }
      const q = params.toString()
      router.replace(q ? `?${q}` : "?", { scroll: false })
    },
    [router, searchParams],
  )

  // ▼ 非同期データ取得
  const [performances, setPerformances] = useState<PerformanceDTO[]>([])
  const [perfLoading, setPerfLoading] = useState(performanceCount > 0)
  const [selected, setSelected] = useState<PerformanceDTO | null>(null)
  // 録音直後のアルコ結果オーバーレイ (通し録音の解析完了で表示)
  const justRecordedRef = useRef<string | null>(null)
  const [arcoResult, setArcoResult] = useState<PerformanceDTO | null>(null)

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
  // メトロノーム (お手本再生中に拍を刻む) 2026-07-18
  const [metronomeOn, setMetronomeOn] = useState(false)
  const metronomeOnRef = useRef(false)
  useEffect(() => { metronomeOnRef.current = metronomeOn }, [metronomeOn])
  // ▼ 区間ループ (部分練習 Phase 1) 2026-07-18: 譜面で開始/終了の音符を選び、その区間だけお手本をループ再生
  const [rangeMode, setRangeMode] = useState(false)          // 区間選択モード
  const [rangeStart, setRangeStart] = useState<number | null>(null) // note index
  const [rangeEnd, setRangeEnd] = useState<number | null>(null)     // note index
  const [isRangeLooping, setIsRangeLooping] = useState(false)
  const rangeBandsRef = useRef<HTMLDivElement[]>([])         // オーバーレイのハイライト帯
  // 演奏バー(Step 2)の展開パネル: テンポ / 区間 のどちらを開いているか
  const [openPanel, setOpenPanel] = useState<null | "tempo" | "range">(null)
  // 区間録音 (部分練習 Phase 2b): この録音が区間演奏か。pending=録音開始トリガ直前にステージ、
  // recording=進行中の録音に確定した区間 (アップロード時に読む)。null = 通常の全体録音。
  const pendingRangeRef = useRef<{ from: number; to: number } | null>(null)
  const recordingRangeRef = useRef<{ from: number; to: number } | null>(null)
  // パート分け (2026-07-26): 区間がどの名前付きパートか。pending→recording は区間と同じタイミングで確定。
  const pendingPartIdRef = useRef<string | null>(null)
  const recordingPartIdRef = useRef<string | null>(null)
  // 現在選択中のパート (UI表示用)。null = 通し。
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null)
  const recGuideOffsetSecRef = useRef<number>(0) // 録音ガイドの開始オフセット秒 (区間先頭ノートの開始秒)
  // 区間録音の自動停止 (2c): この実経過秒に達したら録音を止める。全体録音は Infinity (末尾停止は別effect)。
  const recGuideStopAtRealSecRef = useRef<number>(Infinity)
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
        .then((data: PerformanceDTO[]) =>
          // 既にロード済みの comparison を保持しつつ他フィールドを更新 (ポーリング上書き防止)
          setPerformances(prev => data.map(d => {
            const old = prev.find(p => p.id === d.id)
            return old?.comparisonResult
              ? { ...d, comparisonResult: old.comparisonResult, comparisonWarnings: old.comparisonWarnings }
              : d
          }))
        )
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
          // 演奏モード既定のため自動選択はしない。comparison だけ先読みしておく
          void 0
          if (!first.comparisonResult && first.pitchAccuracy != null) {
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
    // アコーディオン: 開いているカードを再タップしたら閉じる
    const willClose = selected?.id === p.id
    setSelected(willClose ? null : p)
    // 開くときだけ comparison をロード (loadComparison は既ロード時 early-return)
    if (!willClose && !p.comparisonResult && p.pitchAccuracy != null) {
      loadComparison(p)
    }
  }, [selected, loadComparison])

  // 演奏セレクタ (譜面の上で過去の演奏を選び、フィードバックを譜面に色表示) 2026-07-18
  // 直接選択版 (トグルしない)。selected を設定すると comparison(useMemo) 経由で譜面が色付く。
  const selectPerformanceById = useCallback((id: string | null) => {
    setPopover(null)
    if (!id) { setSelected(null); return }
    const p = performances.find((x) => x.id === id)
    if (!p) return
    setSelected(p)
    if (!p.comparisonResult && p.pitchAccuracy != null) {
      loadComparison(p)
    }
  }, [performances, loadComparison])

  // リネーム (演奏履歴カード・セレクタ横 共通)
  const handleRenamed = useCallback((performanceId: string, newName: string) => {
    setPerformances((prev) => prev.map((p) => (p.id === performanceId ? { ...p, name: newName } : p)))
    setSelected((prev) => (prev && prev.id === performanceId ? { ...prev, name: newName } : prev))
  }, [])
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState("")
  const [renameSaving, setRenameSaving] = useState(false)
  const submitRename = useCallback(async () => {
    if (!renamingId || renameSaving) return
    setRenameSaving(true)
    const res = await renamePerformance({
      performanceId: renamingId,
      kind: practiceItemId ? "practice" : "score",
      name: renameDraft,
    })
    setRenameSaving(false)
    if (res.ok) {
      handleRenamed(renamingId, res.name)
      setRenamingId(null)
    }
  }, [renamingId, renameSaving, renameDraft, practiceItemId, handleRenamed])

  // 過去ベストスコア（ピッチ）— 録音後フィードバックの比較用
  // 区間演奏(rangeFromNote != null)は練習補助であり、ベスト/レベル等の公式表示には非算入。
  const fullPerformances = useMemo(
    () => performances.filter(p => p.rangeFromNote == null),
    [performances],
  )

  const bestPitchScore = useMemo(() => {
    if (fullPerformances.length === 0) return latestPitchAccuracy ?? undefined
    const scores = fullPerformances.map(p => p.pitchAccuracy ?? null).filter((s): s is number => s !== null)
    return scores.length > 0 ? Math.max(...scores) : latestPitchAccuracy ?? undefined
  }, [fullPerformances, latestPitchAccuracy])

  // 現在のレベル（直近 RECENT_LEVEL_N 回の「音程・リズム平均」の平均）— 録音ボタン上の表示用。
  // overallScore は bowing(skill)依存で欠損しやすいため、確実に入る
  // pitchAccuracy / timingAccuracy の 2 軸平均でレベルを可視化する。
  const recentLevel = useMemo(() => {
    const RECENT_LEVEL_N = 5
    const scored = fullPerformances
      .filter(p => p.pitchAccuracy != null && p.timingAccuracy != null)
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      .slice(0, RECENT_LEVEL_N)
      .map(p => (p.pitchAccuracy! + p.timingAccuracy!) / 2)
    if (scored.length === 0) return null
    const avg = Math.round(scored.reduce((sum, v) => sum + v, 0) / scored.length)
    return { avg }
  }, [fullPerformances])

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

    // 3. 解析起動を通知 (区間録音ならこの録音に確定した区間を渡す → Python が部分採点)
    const activeRange = recordingRangeRef.current
    recordingRangeRef.current = null
    const activePartId = recordingPartIdRef.current
    recordingPartIdRef.current = null
    recGuideOffsetSecRef.current = 0
    recGuideStopAtRealSecRef.current = Infinity
    const notifyResult = await uploadAction({
      performanceId: signedRes.performanceId,
      recordingBpm: recordingBpmRef.current,
      rangeFromNote: activeRange?.from,
      rangeToNote: activeRange?.to,
      partId: activePartId ?? undefined,
    })
    // エラー分類 3: 解析起動失敗 (録音は Storage に保存済み)
    if (notifyResult?.error) {
      return { error: `録音は保存されましたが、解析に失敗しました (${notifyResult.error})` }
    }

    // 通し録音(非区間)かつ曲モードなら、解析完了後にアルコ結果オーバーレイを出す。
    // モバイルでの背面化/再読込/ブラウザバック復帰でも拾えるよう sessionStorage にも保持。
    const arcoPendingId = (activeRange || practiceItemId) ? null : signedRes.performanceId
    justRecordedRef.current = arcoPendingId
    if (arcoPendingId) {
      try { sessionStorage.setItem("arcoPending", JSON.stringify({ scoreId: score.id, perfId: arcoPendingId, at: Date.now() })) } catch {}
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
      // overallScore 廃止: 録音後フィードバックも演奏スコア(音程+リズム平均)で表示
      const overallScore = latest ? performanceScore(latest) : null
      const prevOverall = previous ? performanceScore(previous) : null
      const isPersonalBest = overallScore != null && (prevOverall == null || overallScore > prevOverall)
      router.refresh()
      const allApiUrl = practiceItemId
        ? `/api/practice-performances?practiceItemId=${practiceItemId}&userId=${userId}`
        : `/api/score-performances?scoreId=${score.id}&userId=${userId}`
      fetch(allApiUrl).then(r => r.json()).then((data: PerformanceDTO[]) => {
        setPerformances(data)
        if (data.length > 0) {
          const first = data[0]
          // 録音後も演奏モードを維持 (結果はアルコ結果オーバーレイ + Recorder 結果で表示)。comparison だけ先読み
          if (!first.comparisonResult && first.pitchAccuracy != null) {
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

  // 解析完了した「今録音した曲演奏」を検知してアルコ結果を表示 (3秒ポーリング/復帰再取得が performances を更新)
  useEffect(() => {
    const id = justRecordedRef.current
    if (!id) return
    const p = performances.find((x) => x.id === id)
    if (p && p.analysisStatus === "done" && p.pitchAccuracy != null && p.timingAccuracy != null) {
      justRecordedRef.current = null
      try { sessionStorage.removeItem("arcoPending") } catch {}
      // 祝い体験 v2.0 (§2): 自動全画面は廃止し、バナー → 振り返りで祝う方式に統一(自動オーバーレイは出さない)。
    }
  }, [performances])

  // 再読込/ブラウザバック後も拾えるよう、保存済みの pending 録音を復元 (マウント時)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("arcoPending")
      if (!raw) return
      const p = JSON.parse(raw) as { scoreId?: string; perfId?: string; at?: number }
      if (p?.scoreId === score.id && p.perfId && (!p.at || Date.now() - p.at < 3600_000)) {
        justRecordedRef.current = p.perfId
      } else {
        sessionStorage.removeItem("arcoPending")
      }
    } catch {}
  }, [score.id])

  // フォアグラウンド復帰時に performances を再取得 (モバイルは背面でタイマーが止まるため、
  // 復帰した瞬間に解析完了を拾えるようにする)
  useEffect(() => {
    const onVisible = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return
      if (!justRecordedRef.current) return
      const apiBase = practiceItemId
        ? `/api/practice-performances?practiceItemId=${practiceItemId}&userId=${userId}`
        : `/api/score-performances?scoreId=${score.id}&userId=${userId}`
      fetch(apiBase).then((r) => r.json()).then((data: PerformanceDTO[]) => {
        setPerformances((prev) => data.map((d) => {
          const old = prev.find((p) => p.id === d.id)
          return old?.comparisonResult ? { ...d, comparisonResult: old.comparisonResult, comparisonWarnings: old.comparisonWarnings } : d
        }))
      }).catch(() => {})
    }
    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("focus", onVisible)
    return () => {
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("focus", onVisible)
    }
  }, [score.id, userId, practiceItemId])

  // =========================================================
  // 再生・ハイライト関連
  // =========================================================

  const synthRef = useRef<Tone.Synth | null>(null)
  const vibratoRef = useRef<Tone.Vibrato | null>(null)
  const partRef = useRef<Tone.Part | null>(null)
  const colorTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]) // 比較色付けの遅延タイマー群
  // 視覚ビート(青い線の上で上下に揺れる丸)。表拍=下/裏拍=上
  const beatBallRef = useRef<HTMLDivElement | null>(null)
  const noteElementsRef = useRef<Element[]>([])
  const animationRef = useRef<number | null>(null)
  const activeTempoRatioRef = useRef<number>(1)
  const cursorRef = useRef<HTMLDivElement | null>(null)
  const pausedAtRef = useRef<number>(0)

  // UI-4: 気になる箇所ハイライト管理
  // - 紫 (#8b5cf6) drop-shadow を 3 秒間付与し、別カードタップ or タイマー経過で消す
  // - 既存の colorizeNote とは衝突しない (filter プロパティを使うため)
  const problematicHighlightTimerRef = useRef<number | null>(null)
  const problematicHighlightedElsRef = useRef<Element[]>([])

  // ▼ OSMDカーソルAPIベースのタイムスタンプマップ
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null)
  const [isOsmdReady, setIsOsmdReady] = useState(false)
  const timeToGNotesMap = useRef<Map<number, any[]>>(new Map())
  const sortedTimes = useRef<number[]>([])
  // 層1 (不変): 時刻 → 不変 Note 模型オブジェクト。
  //   録音テンポガイド専用。SVG/GraphicalNote は保持しない (stale 元凶を断つ)。
  //   毎フレーム osmd.rules.GNote(sourceNote) で現在の SVG をライブ解決する (層2)。
  //   timeToGNotesMap (再生ハイライト用) とは責務分離し、そちらは非改修。
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const timeToSourceNote = useRef<Map<number, any>>(new Map())
  const lastHighlightedTimeRef = useRef<number>(-1)

  const HIGHLIGHT_THRESHOLD_SEC = 0.15

  // OSMDカーソルで 時刻(秒) → GraphicalNote[] マップを構築
  const buildTimeToGNotesMap = useCallback((bpm: number) => {
    const osmd = osmdRef.current
    if (!osmd?.cursor) return

    timeToGNotesMap.current.clear()
    timeToSourceNote.current.clear()
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
          // 層1: 不変 Note 模型のみ保持 (sourceNote は再描画で不変)。
          //   SVG は録音時に osmd.rules.GNote(sourceNote) でライブ解決する。
          timeToSourceNote.current.set(rounded, gNotes[0].sourceNote)
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

  // リサイズ後の再レンダリング検知用（インクリメントで applyComparisonColors を再トリガー）
  const [noteElementsVersion, setNoteElementsVersion] = useState(0)

  // --- オンボーディング: 解析オーバーレイ描画完了を Provider に通知 ---
  // applyComparisonColors の setTimeout 連鎖 (最大 800ms) を待ってから dispatch
  const { markAnalysisOverlayRendered, activeGuideMarkId, setOnboardingSamplePiece, setOnboardingEnding, allGuidesDismissed, welcomeSlidesShown, pageGuidesSeen } = useOnboarding()
  // オンボの「録音」ステップ表示中だけ、録音ボタンを「ふりかえりへ進むだけのボタン」に差し替える。
  // 実録音は省くという方針 (通常ユーザーの録音ボタンは元のまま)。
  const onboardingRecordStep = isScoreMode && activeGuideMarkId === "scoreDetail.record"
  // オンボ進行中 (はじめてガイド済み・未dismiss・締めの homeEnding 未到達) の判定。
  // 「ホームに戻る」バナーの表示に使う (samplePiece 有無に依存させない = 確実に出す)。
  const onboardingActive = welcomeSlidesShown && !allGuidesDismissed && !pageGuidesSeen.has("homeEnding")
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

  // --- オンボ: 開いた曲を「終盤の見本ホーム」用に控える ---
  // ツアーでは実録音を省くので、録音タップ時ではなく「曲を開いた時点」で確実に保存する。
  // これで練習教材まで進んでも samplePiece が残り、ホームで「弾いたらこう出る」見本を出せる。
  useEffect(() => {
    if (isScoreMode && !allGuidesDismissed) {
      setOnboardingSamplePiece({ id: score.id, title: score.title, cover: null, star: null })
    }
  }, [isScoreMode, allGuidesDismissed, score.id, score.title, setOnboardingSamplePiece])

  // オンボ中に練習教材まで来たら「締め」を armed 状態にする。以後どの経路 (サイドバーの
  // 「ホーム」含む) でホームに戻っても、見本ホーム + 締めガイドが出る。
  useEffect(() => {
    if (practiceItemId && onboardingActive) setOnboardingEnding(true)
  }, [practiceItemId, onboardingActive, setOnboardingEnding])

  // --- 記号ガイド: 譜面に出てくる記号・技法 (2026-07-25) ---
  // analysis.json に既にある情報から抽出するだけなので追加の通信は無い。
  const scoreSymbols = useMemo(() => extractScoreSymbols(analysis), [analysis])
  const [symbolTapMode, setSymbolTapMode] = useState(false)
  const symbolGuideRef = useRef<SymbolGuideHandle | null>(null)
  const symbolTapModeRef = useRef(false)
  symbolTapModeRef.current = symbolTapMode

  // --- ScoreViewer からノート要素を受け取る（評価オーバーレイ用）---
  const handleNoteElementsReady = useCallback((elements: Element[]) => {
    noteElementsRef.current = elements
    setNoteElementsVersion(v => v + 1)
    setPopover(null)
  }, [])

  // --- OSMDインスタンスを受け取り、タイムスタンプマップを構築 ---
  const handleOsmdReady = useCallback((osmd: OpenSheetMusicDisplay) => {
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

  // 注: 旧「MutationObserver で再描画検知 → timeToGNotesMap 再構築」effect は撤去。
  //   P-1 層分離設計により録音テンポガイドは層1 (不変 Note 模型) + 層2
  //   (毎フレーム osmd.rules.GNote ライブ解決) で再描画に追従するため、
  //   キャッシュ再構築機構そのものが不要。層1 は handleOsmdReady で構築され、
  //   再描画時も既存 ScoreViewer 経由で handleOsmdReady が再呼出される (冪等)。

  // analysis.notes インデックス → OSMD要素インデックス の変換（評価オーバーレイ用）
  // VexFlow は休符も vf-stavenote として描画するため note_index を直接 OSMD インデックスとして使う
  const analysisIdxToOsmdIdx = useCallback((analysisIdx: number): number => {
    if (!analysis || analysisIdx < 0) return -1
    if (analysisIdx < analysis.notes.length && analysis.notes[analysisIdx].type !== "note") {
      return -1
    }
    return analysisIdx < noteElementsRef.current.length ? analysisIdx : -1
  }, [analysis])

  const clearProblematicHighlight = useCallback(() => {
    if (problematicHighlightTimerRef.current != null) {
      window.clearTimeout(problematicHighlightTimerRef.current)
      problematicHighlightTimerRef.current = null
    }
    for (const el of problematicHighlightedElsRef.current) {
      ;(el as SVGElement).style.removeProperty("filter")
    }
    problematicHighlightedElsRef.current = []
  }, [])

  // C-6b (2026-07-11): 旧「気になる箇所」譜面ジャンプ (handleJumpToProblematicPosition) は
  // 旧55アドバイス内の表示だったため退役。ハイライト解除機構は他機能が使うので温存。

  // unmount 時にタイマーを解放
  useEffect(() => {
    return () => {
      if (problematicHighlightTimerRef.current != null) {
        window.clearTimeout(problematicHighlightTimerRef.current)
      }
    }
  }, [])

  // --- 色塗りのみ（getBoundingClientRect 不要、即時実行可能）---
  const applyComparisonColors = useCallback(() => {
    // 前回の遅延色付けタイマーを破棄 (演奏を素早く切替えると前の色が後から乗る問題を防止)
    colorTimersRef.current.forEach(clearTimeout)
    colorTimersRef.current = []
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
        colorTimersRef.current.push(setTimeout(() => colorizeNote(elements[osmdIdx], color), delay))
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
  // 自動復旧の核心: cursor div は #osmd-container の子。OSMD が再描画
  //   (最小化/DevTools/リサイズ → container.innerHTML="" / osmd.render()) で
  //   cursor を DOM から消すことがある。旧実装は「ref があれば返す」だったため
  //   切り離された幽霊要素を返し続け、ハードリロードしないと復旧しなかった。
  //   → 「ref があり かつ まだ container に接続されていれば再利用、
  //     切り離されていれば作り直して再 append」に変更。
  //   updateRecordingCursor が毎フレーム本関数を呼ぶことで、OSMD が消しても
  //   次フレームで自動再生成され、ハードリロード不要で青線が復活する。
  const ensureCursor = useCallback(() => {
    const container = document.getElementById("osmd-container")
    if (!container) return null
    if (cursorRef.current && container.contains(cursorRef.current)) {
      return cursorRef.current
    }
    container.style.position = "relative"
    const cursor = document.createElement("div")
    cursor.className = styles.playbackCursor
    // 視覚ビート用の丸 (青い線の上端に載せ、拍位相で上下)
    const ball = document.createElement("div")
    ball.className = styles.beatBall
    cursor.appendChild(ball)
    beatBallRef.current = ball
    container.appendChild(cursor)
    cursorRef.current = cursor
    return cursor
  }, [])

  // 視覚ビート: 経過秒とテンポから拍位相を出し、丸を上下させる (表拍=下/裏拍=上)
  const updateBeatBall = useCallback((elapsedSec: number, bpm: number) => {
    const ball = beatBallRef.current
    if (!ball) return
    if (!metronomeOnRef.current || !bpm) { ball.style.opacity = "0"; return }
    const beatSec = 60 / bpm
    const phase = ((elapsedSec % beatSec) + beatSec) % beatSec / beatSec // 0..1
    const y = -18 * Math.sin(phase * Math.PI) // 0=下(表拍), 0.5=上(裏拍)
    ball.style.opacity = "1"
    ball.style.transform = `translateX(-50%) translateY(${y.toFixed(1)}px)`
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

  // --- 区間ハイライト帯の描画 (部分練習 Phase 1) ---
  // cursor と同じく #osmd-container 内にコンテンツ座標(scrollTop加算)で絶対配置し、スクロール追従させる。
  // 選択区間の音符を行ごとにまとめ、各行に半透明の帯を描く (行の切れ目は x が左へ戻ることで検出)。
  const renderRangeOverlay = useCallback(() => {
    const container = document.getElementById("osmd-container")
    if (!container) return
    // 既存の帯を除去
    rangeBandsRef.current.forEach((b) => b.remove())
    rangeBandsRef.current = []
    if (rangeStart === null || rangeEnd === null) return

    container.style.position = "relative"
    const cRect = container.getBoundingClientRect()
    const scrollTop = container.scrollTop
    const lo = Math.min(rangeStart, rangeEnd)
    const hi = Math.max(rangeStart, rangeEnd)

    type Band = { left: number; right: number; top: number; bottom: number }
    const bands: Band[] = []
    let cur: Band | null = null
    let prevCx = -Infinity
    for (let i = lo; i <= hi; i++) {
      const el = noteElementsRef.current[i]
      if (!el || !container.contains(el)) continue
      const r = el.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) continue
      const left = r.left - cRect.left
      const right = r.right - cRect.left
      const top = r.top - cRect.top + scrollTop
      const bottom = r.bottom - cRect.top + scrollTop
      const cx = (left + right) / 2
      if (!cur || cx < prevCx - 4) {
        cur = { left, right, top, bottom }
        bands.push(cur)
      } else {
        cur.left = Math.min(cur.left, left)
        cur.right = Math.max(cur.right, right)
        cur.top = Math.min(cur.top, top)
        cur.bottom = Math.max(cur.bottom, bottom)
      }
      prevCx = cx
    }

    const padX = 5
    const padY = 9
    for (const g of bands) {
      const b = document.createElement("div")
      b.className = styles.rangeBand
      b.style.left = `${g.left - padX}px`
      b.style.top = `${g.top - padY}px`
      b.style.width = `${g.right - g.left + padX * 2}px`
      b.style.height = `${g.bottom - g.top + padY * 2}px`
      container.appendChild(b)
      rangeBandsRef.current.push(b)
    }
  }, [rangeStart, rangeEnd])

  // 選択変化・再描画(zoom等)・スクロール・リサイズで区間ハイライトを再配置
  useEffect(() => {
    renderRangeOverlay()
    const container = document.getElementById("osmd-container")
    if (!container) return
    let raf: number | null = null
    const schedule = () => {
      if (raf !== null) return
      raf = requestAnimationFrame(() => { raf = null; renderRangeOverlay() })
    }
    container.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    return () => {
      if (raf !== null) cancelAnimationFrame(raf)
      container.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
    }
  }, [renderRangeOverlay, noteElementsVersion, isOsmdReady])

  // --- 譜面再生のアニメーション ---
  const stopVisualSync = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    if (beatBallRef.current) beatBallRef.current.style.opacity = "0"
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

      // 視覚ビート: 再生テンポの拍で上下 (transport秒の拍間隔 = 60/playbackTempo)
      updateBeatBall(t, playbackTempo)

      animationRef.current = requestAnimationFrame(loop)
    }
    animationRef.current = requestAnimationFrame(loop)
  }, [analysis, highlightNoteAtTime, findNearestGNotes, ensureCursor, updateCursorFromGNotes, updateBeatBall, playbackTempo])

  // --- テンポ比率ヘルパー ---
  const getTempoRatio = useCallback(() => {
    if (!analysis) return 1
    return analysis.bpm / playbackTempo
  }, [analysis, playbackTempo])

  // --- 譜面再生の完全停止 ---
  const stopPlayback = useCallback(() => {
    Tone.getTransport().stop()
    Tone.getTransport().cancel()
    Tone.getTransport().loop = false // 区間ループを解除 (singleton の transport に残るため)
    stopVisualSync()
    clearHighlight()
    hideCursor()
    pausedAtRef.current = 0
    setIsRangeLooping(false)
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
  const setupPart = useCallback(async (startFromSec: number = 0, loop?: { start: number; end: number }) => {
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

    if (loop) {
      // 区間ループ: transport のネイティブ loop で [start, end] を繰り返す (Part のイベントは絶対時刻なので窓内のみ再発火)
      transport.loop = true
      transport.loopStart = loop.start
      transport.loopEnd = loop.end
    } else {
      transport.loop = false
      const lastNote = analysis.notes[analysis.notes.length - 1]
      const endTimeSec = lastNote ? lastNote.end_time_sec * tempoRatio + 0.5 : 10
      transport.schedule(() => stopPlayback(), `${endTimeSec}` as any)
    }

    transport.seconds = startFromSec
    lastHighlightedTimeRef.current = -1
    ensureCursor()
    transport.start()
    startVisualSync()
    setPlaybackState("playing")
  }, [analysis, getTempoRatio, startVisualSync, stopPlayback, ensureCursor, playbackTempo])

  // --- 再開 ---
  const resumePlayback = useCallback(async () => {
    await setupPart(pausedAtRef.current)
  }, [setupPart])

  // --- 先頭から再生 ---
  const startPlayback = useCallback(async () => {
    pausedAtRef.current = 0
    await setupPart(0)
  }, [setupPart])

  // --- 区間ループ再生 (部分練習 Phase 1) ---
  const startRangeLoop = useCallback(async () => {
    if (!analysis || rangeStart === null || rangeEnd === null) return
    const ratio = getTempoRatio()
    const lo = Math.min(rangeStart, rangeEnd)
    const hi = Math.max(rangeStart, rangeEnd)
    const s = analysis.notes[lo]
    const e = analysis.notes[hi]
    if (!s || !e) return
    const startSec = s.start_time_sec * ratio
    const endSec = e.end_time_sec * ratio
    if (endSec <= startSec) return
    if (playbackState === "playing") {
      Tone.getTransport().stop()
      Tone.getTransport().cancel()
      stopVisualSync()
    }
    setIsRangeLooping(true)
    await setupPart(startSec, { start: startSec, end: endSec })
  }, [analysis, rangeStart, rangeEnd, getTempoRatio, setupPart, playbackState, stopVisualSync])

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

    // 1.5 区間選択モード: 開始→終了の音符を順にタップして区間を確定 (部分練習 Phase 1)
    if (rangeMode && closestDist <= HIT_RADIUS) {
      if (rangeStart === null || rangeEnd !== null) {
        // 新しい選択を開始
        setRangeStart(closestIdx)
        setRangeEnd(null)
      } else {
        // 終了を確定 (開始 > 終了 なら入れ替え)
        const a = Math.min(rangeStart, closestIdx)
        const b = Math.max(rangeStart, closestIdx)
        setRangeStart(a)
        setRangeEnd(b)
      }
      setPopover(null)
      return
    }

    // 1.7 記号ガイド: 「譜面をタップして調べる」ON のときは再生ジャンプより優先。
    //    OFF (既定) では従来動作のままなので、通常の操作感は変わらない。
    if (symbolTapModeRef.current && closestDist <= HIT_RADIUS) {
      setPopover(null)
      symbolGuideRef.current?.openForNote(closestIdx)
      return
    }

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
  }, [analysis, playbackState, comparison, getTempoRatio, setupPart, stopVisualSync, rangeMode, rangeStart, rangeEnd])

  // --- 録音中ガイドカーソル ---
  const recGuideAnimRef = useRef<number | null>(null)
  const recGuideStartRef = useRef<number>(0)

  // ▼ F-1 Commit 2: 譜面の行構造とスクロール計画
  // 2026-05-30 bugfix: ResizeObserver でコンテナサイズ変化を検知して rebuild。
  // 旧実装は window resize のみ依存だったため、録音開始で body[data-fullscreen=true]
  // が CSS で osmd-container のサイズを変えても (window 自体は resize しないため)
  // rebuild が走らず stale plan で scrollTop の clamp 値がズレていた。
  const [scrollPlan, setScrollPlan] = useState<ScrollPlan | null>(null)
  useEffect(() => {
    if (!isOsmdReady || !osmdRef.current || recordingBpm === null) return
    const container = document.getElementById("osmd-container")
    if (!container) return

    let debounceTimer: ReturnType<typeof setTimeout> | null = null
    const buildPlan = () => {
      if (!osmdRef.current || recordingBpm === null) return
      const viewportHeight = container.clientHeight
      const plan = buildScrollPlan(osmdRef.current, recordingBpm, viewportHeight)
      setScrollPlan(plan)
    }
    const scheduleBuildPlan = () => {
      // OSMD autoResize の再描画完了を待ってから plan 計算する
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(buildPlan, 300)
    }

    buildPlan()  // 初回 (即時)
    const ro = new ResizeObserver(scheduleBuildPlan)
    ro.observe(container)
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      ro.disconnect()
    }
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

  // 2026-05-30: 旧 F-1 Commit 6 の window resize / orientationchange ハンドラは
  // ResizeObserver ベースの scrollPlan effect に統合済 (= コンテナサイズ変化を直接検知)
  // → ここでの window 依存リスナは不要。

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
    // 区間録音では曲全体スクロールを止める (区間はハイライトで可視・カーソルは区間内で動く)。
    if (recordingRangeRef.current) return
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
    // 毎フレーム ensureCursor: OSMD 再描画で cursor が DOM から消えても
    // ここで自動再生成され、ハードリロード不要で青線が復活する。
    const cursor = ensureCursor()
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

    // 層1: 不変 Note 模型を取得 (再描画で不変)
    const prevNote = timeToSourceNote.current.get(prevTime)
    if (!prevNote) return

    const container = document.getElementById("osmd-container")
    if (!container) return

    const svgs = container.querySelectorAll("svg")
    let activeSvg: SVGSVGElement | null = null
    for (const svg of svgs) {
      if (svg.style.display !== "none") { activeSvg = svg as SVGSVGElement; break }
    }
    if (!activeSvg) return

    // 層2: 毎フレーム osmd.rules.GNote(不変Note) で現在の SVG をライブ解決。
    //   再描画されても NoteToGraphicalNoteMap は再構築済のため常に最新を返す。
    // osmd.rules は protected。公開 getter osmd.EngravingRules 経由で GNote を呼ぶ。
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const osmdRules: any = osmdRef.current?.EngravingRules
    const prevGN = osmdRules?.GNote?.(prevNote)
    const prevSvg = prevGN?.getSVGGElement?.() as SVGGElement | undefined
    // 追加指示1: ライブ解決失敗 (再描画中の数 ms の null 等) は
    //   display:none にせず return → 直前フレームの位置を維持し青線を消さない。
    if (!prevSvg || !activeSvg.contains(prevSvg)) {
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
    const nextNote = timeToSourceNote.current.get(nextTime)
    if (nextNote && nextTime > prevTime) {
      // 層2: next も同様にライブ解決
      const nextSvg = osmdRules?.GNote?.(nextNote)?.getSVGGElement?.() as SVGGElement | undefined
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
  }, [ensureCursor])

  const startRecordingGuide = useCallback(() => {
    if (!analysis) return
    ensureCursor()
    recGuideStartRef.current = performance.now()

    const loop = () => {
      const elapsedRealSec = (performance.now() - recGuideStartRef.current) / 1000
      // 区間録音(2c): 区間終端 + バッファに達したら自動停止 (全体録音は Infinity で発火しない)
      if (elapsedRealSec >= recGuideStopAtRealSecRef.current) {
        triggerStopRecording()
        return
      }
      // ユーザー録音テンポで再生位置をスケール:
      // recordingBpm=60, analysis.bpm=120 なら、実時間 1 秒 = 楽譜時間 0.5 秒
      // (ゆっくり録音するほど、カーソルもゆっくり進む)
      const recBpm = recordingBpmRef.current || analysis.bpm
      // 区間録音では区間先頭ノートの開始秒をオフセットとして加算 → カーソルが区間から始まる
      const scoreTimeSec = recGuideOffsetSecRef.current + elapsedRealSec * (recBpm / analysis.bpm)
      updateRecordingCursor(scoreTimeSec)
      // 視覚ビート: 録音テンポの拍で上下 (実経過秒の拍間隔 = 60/recBpm)
      updateBeatBall(elapsedRealSec, recBpm)
      recGuideAnimRef.current = requestAnimationFrame(loop)
    }
    recGuideAnimRef.current = requestAnimationFrame(loop)
  }, [analysis, ensureCursor, updateRecordingCursor, updateBeatBall, triggerStopRecording])

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
      colorTimersRef.current.forEach(clearTimeout)
      colorTimersRef.current = []
      try {
        Tone.getTransport().stop()
        Tone.getTransport().cancel()
      } catch { /* ignore */ }
      // Tone.js の音声ノードを破棄 (未破棄だと遷移毎に Destination に接続が残りリーク)
      try {
        partRef.current?.dispose(); partRef.current = null
        synthRef.current?.dispose(); synthRef.current = null
        vibratoRef.current?.dispose(); vibratoRef.current = null
      } catch { /* ignore */ }
    }
  }, [stopVisualSync])

  // ふりかえりタブ用ブロック (Step 1: 構成再編 2026-07-18 — 履歴/採点結果/上達ループを1タブに集約)
  const deleteHintBlock = !practiceItemId && !selected && recentlyDeleted && (
    <div className={styles.deleteHint} role="status">
      演奏を削除しました。履歴から別の演奏を選んでください。
    </div>
  )
  // 上達の推移 (上達のようす)。個別演奏の一覧はこの下に「すべての演奏を見る」で畳む。
  // パート分け (2026-07-26): パートを選ぶと、そのパートの音符範囲を区間として確定 (次の録音が部分採点+partId付与)。
  const selectPart = (part: Part | null) => {
    if (!part || !analysis) {
      setSelectedPartId(null)
      pendingPartIdRef.current = null
      pendingRangeRef.current = null
      setRangeStart(null)
      setRangeEnd(null)
      return
    }
    const nr = resolvePartToNoteRange(part, analysis.notes)
    if (!nr) return // このアレンジには該当小節の音符が無い
    setSelectedPartId(part.id)
    pendingPartIdRef.current = part.id
    pendingRangeRef.current = { from: nr.rangeFromNote, to: nr.rangeToNote }
    setRangeStart(nr.rangeFromNote)
    setRangeEnd(nr.rangeToNote)
  }
  // パート別 自己ベスト (partId 一致の区間録音の最高点)
  const partBest = (pid: string): number | null => {
    const ss = performances
      .filter((p) => p.partId === pid && p.pitchAccuracy != null && p.timingAccuracy != null)
      .map((p) => performanceScore(p))
      .filter((s): s is number => s != null)
    return ss.length ? Math.max(...ss) : null
  }

  // ── 祝い体験 v2.0 (§2): バナー → 振り返りを開いた瞬間に祝い(通常機能・常時有効) ──
  const [celebShown, setCelebShown] = useState<Set<string>>(new Set())
  useEffect(() => {
    try {
      const shown = new Set<string>()
      for (const p of performances) {
        if (sessionStorage.getItem(`celebShown:${p.id}`) === "1") shown.add(p.id)
      }
      if (shown.size) setCelebShown((s) => new Set([...s, ...shown]))
    } catch {}
  }, [performances])
  // milestone(Python導出) に加え、自己ベスト(過去最高更新)をフロントで合成する (§1・personal_best)。
  const celebration = useMemo(() => {
    // 評価済み通し演奏を古い順に見て「その時点で過去最高を超えたか」を判定 (初回は対象外)。
    const fulls = performances
      .filter((p) => p.rangeFromNote == null && p.pitchAccuracy != null && p.timingAccuracy != null)
      .slice()
      .sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime())
    const bestFlag = new Map<string, boolean>()
    let prevMax = -Infinity
    let hasPrior = false
    for (const p of fulls) {
      const s = performanceScore(p) ?? 0
      bestFlag.set(p.id, hasPrior && s > prevMax)
      if (s > prevMax) prevMax = s
      hasPrior = true
    }
    // 候補 = milestoneイベントあり or 自己ベスト。公開時刻カットオフより後の演奏に限る(遡及発火の遮断)。最新を採用。
    const cands = performances
      .filter((p) =>
        p.analysisStatus === "done" &&
        new Date(p.uploadedAt).getTime() >= CELEBRATION_SINCE_MS &&
        (parseMilestoneEvents(p.analysisSummary).length > 0 || bestFlag.get(p.id)))
      .slice()
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    const perf = cands[0] ?? null
    if (!perf) return { perf: null, events: [] }
    const events = parseMilestoneEvents(perf.analysisSummary)
    if (bestFlag.get(perf.id)) events.push({ type: "personal_best", tier: "medium", payload: {} })
    return { perf, events }
  }, [performances])
  const celebrationPerf = celebration.perf
  const celebEvents = celebration.events
  const celebAlreadyShown = !celebrationPerf || celebShown.has(celebrationPerf.id)
  const closeCelebration = useCallback(() => {
    const perf = celebrationPerf
    if (!perf) return
    try { sessionStorage.setItem(`celebShown:${perf.id}`, "1") } catch {}
    setCelebShown((s) => new Set(s).add(perf.id))
    fetch("/api/celebrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(practiceItemId ? { practiceItemId } : { scoreId: score.id }),
    }).catch(() => {})
  }, [celebrationPerf, practiceItemId, score.id])

  const trajectoryBlock = <ProgressTrajectory performances={performances} />
  const performanceHistoryBlock = (
    <div data-onboarding="scoreDetail.performanceHistory">
      <PerformanceHistory
        performances={performances}
        selectedId={selected?.id ?? null}
        onSelect={handleSelectPerformance}
        loading={perfLoading}
        performanceCount={performanceCount}
        kind={practiceItemId ? "practice" : "score"}
        onRenamed={handleRenamed}
        onReplayArco={practiceItemId ? undefined : (p) => setArcoResult(p)}
        renderDetail={(p) => (
          <>
            <AudioPlayer audioUrl={p.audioUrl ?? null} performanceId={p.id} />
            {(p.pitchAccuracy != null || p.timingAccuracy != null) && (
              <EvaluationSummaryCard performance={p} warnings={p.comparisonWarnings ?? []} />
            )}
            {!practiceItemId && (
              <PerformanceSkillDetail
                performanceId={p.id}
                kind="score"
                onDeleted={handlePerformanceDeleted}
                userId={userId}
              />
            )}
          </>
        )}
      />
    </div>
  )

  return (
    <div className={styles.container} data-section="score-detail-root">
      {/* F-1: フルスクリーン中の操作ガイドバー (Recorder の停止ボタンは leftColumn 内で非表示のため、戻るボタンを案内) */}
      {isFullscreen && (
        <div data-section="fullscreen-bar">
          <span data-fs-hint>録音中… 弾き終えたら停止</span>
          <button type="button" data-fs-stop onClick={triggerStopRecording} aria-label="録音を停止">
            <span data-fs-sq /> 停止
          </button>
        </div>
      )}
      {/* UI-6: 削除完了トースト (3 秒で自動消去) */}
      {deleteToast && (
        <div className={styles.deleteToast} role="status" aria-live="polite">
          {deleteToast}
        </div>
      )}
      <div className={styles.header} data-section="header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", flex: 1, minWidth: 0 }}>
            <h1 className={styles.title}>{score.title}</h1>
            <MasterBadge kind={score.badge} size="md" />
          </div>
          <FavoriteButton
            scoreId={practiceItemId ? undefined : score.id}
            practiceItemId={practiceItemId}
            initialOn={!!initialFavorite}
          />
        </div>
      </div>

      {/* タブ (演奏 / ふりかえり): 曲・練習アイテムの両方で表示。
          演奏履歴はふりかえり側に集約。上達ループは曲のみ (下の isScoreMode ガード)。 */}
      <div data-section="score-tabs" style={{ marginBottom: 12 }}>
        <ScoreDetailTabs activeTab={activeTab} onChange={handleTabChange} />
      </div>

      {activeTab === "play" && (
      <div className={styles.playStack} data-section="play-tab">
        {infoSlot}

        {/* 祝いバナー (§2.1): done演奏に対し常に同一・節目を読まない。タップで振り返りへ。 */}
        {celebrationPerf && !celebAlreadyShown && (
          <CelebrationBanner name={score.title} onOpen={() => handleTabChange("review")} />
        )}

        {/* パート練習 (曲にパートがある時のみ)。選ぶとその範囲だけを録音・部分採点し partId を付与。
            右に各パートの自己ベスト。おすすめ非表示・点数のみは振り返り側の仕様 (2026-07-26)。 */}
        {isScoreMode && parts.length > 0 && analysis && (
          <div style={{ background: "#fff", border: "1px solid #eef1f4", borderRadius: 12, padding: "11px 13px", marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#3a4653", marginBottom: 8 }}>🎯 パート練習</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              <button
                type="button"
                onClick={() => selectPart(null)}
                style={{
                  border: `1.5px solid ${selectedPartId == null ? "#2e8b57" : "#e3e9f0"}`,
                  background: selectedPartId == null ? "#eef7f1" : "#fff",
                  color: "#2b3742", borderRadius: 999, padding: "6px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer",
                }}
              >
                通し
              </button>
              {parts.map((p) => {
                const resolvable = resolvePartToNoteRange(p, analysis.notes) != null
                const best = partBest(p.id)
                const on = selectedPartId === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={!resolvable}
                    onClick={() => selectPart(p)}
                    title={resolvable ? "" : "この難易度には該当小節がありません"}
                    style={{
                      border: `1.5px solid ${on ? "#2e8b57" : "#e3e9f0"}`,
                      background: on ? "#eef7f1" : "#fff",
                      color: resolvable ? "#2b3742" : "#b3bcc6",
                      borderRadius: 999, padding: "6px 12px", fontSize: 12.5, fontWeight: 700,
                      cursor: resolvable ? "pointer" : "not-allowed",
                      display: "inline-flex", alignItems: "center", gap: 7,
                    }}
                  >
                    <span>{p.name}</span>
                    {best != null && (
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#2e8b57" }}>{best}点</span>
                    )}
                  </button>
                )
              })}
            </div>
            {selectedPartId != null && (
              <div style={{ fontSize: 11, color: "#9aa6b3", marginTop: 7 }}>
                選択中のパートの範囲で録音します（部分採点・曲の達成には非算入）。
              </div>
            )}
          </div>
        )}

        {/* パート振り返り: 選択中パートの推移のみ (おすすめ教材/学びポイントは出さない・点数のみ)。2026-07-26 */}
        {isScoreMode && selectedPartId != null && (
          <div style={{ marginBottom: 10 }}>
            <ProgressTrajectory performances={performances} partId={selectedPartId} title="このパートの上達" />
          </div>
        )}

        {/* 過去の演奏セレクタ: 選ぶと譜面にその演奏のフィードバックを色表示 + 右にスコア。名前編集も。 */}
        {performances.length > 0 && (
          <div className={styles.perfSelectRow}>
            {renamingId && selected && renamingId === selected.id ? (
              <>
                <input
                  className={styles.perfRenameInput}
                  value={renameDraft}
                  maxLength={PERFORMANCE_NAME_MAX}
                  autoFocus
                  onChange={(e) => setRenameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitRename()
                    else if (e.key === "Escape") setRenamingId(null)
                  }}
                  disabled={renameSaving}
                />
                <button className={styles.perfSaveBtn} onClick={submitRename} disabled={renameSaving}>保存</button>
                <button className={styles.perfCancelBtn} onClick={() => setRenamingId(null)}>取消</button>
              </>
            ) : (
              <>
                <select
                  className={styles.perfSelect}
                  value={selected?.id ?? ""}
                  onChange={(e) => selectPerformanceById(e.target.value || null)}
                >
                  <option value="">🎻 演奏モード（演奏を選ぶと採点を表示）</option>
                  {performances.map((p) => (
                    <option key={p.id} value={p.id}>
                      {(p.name ?? "Performance")}{p.rangeFromNote != null ? "（区間）" : ""} ・ {new Date(p.uploadedAt).toLocaleDateString("ja-JP")}
                    </option>
                  ))}
                </select>
                {selected && (() => {
                  const sc = performanceScore(selected)
                  return (
                    <span className={styles.perfSelectScore}>
                      {sc != null ? (
                        <span style={{ color: rankLabels[getScoreRank(sc)].color }}>{sc}<small>点</small></span>
                      ) : (
                        <span style={{ fontSize: 12, color: "#999" }}>解析中</span>
                      )}
                    </span>
                  )
                })()}
                {selected && (
                  <button
                    className={styles.perfRenameBtn}
                    onClick={() => { setRenamingId(selected.id); setRenameDraft(selected.name ?? "") }}
                    title="この演奏の名前を編集"
                    aria-label="名前を編集"
                  >
                    ✎
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* 譜面ヒーロー (全幅・最上部) — UX刷新 Step 3 */}
        <div ref={scoreWrapperRef} style={{ position: "relative" }} data-onboarding="scoreDetail.scoreOverlay" data-section="score-hero">
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

        {/* 記号ガイド: 譜面に出てくる記号・技法をタップで説明 (2026-07-25) */}
        {analysis && (
          <div data-onboarding="scoreDetail.symbolGuide">
            <SymbolGuide
              userId={userId}
              symbols={scoreSymbols.list}
              byNote={scoreSymbols.byNote}
              noteElementsRef={noteElementsRef}
              noteElementsVersion={noteElementsVersion}
              tapMode={symbolTapMode}
              onTapModeChange={setSymbolTapMode}
              ref={symbolGuideRef}
            />
          </div>
        )}

        {/* 判定カラーの凡例: 演奏を選択して譜面に採点色が出ている時にスコア直下へ */}
        {selected && <ScoreLegend />}

        {/* 譜面注釈 (Phase 1): ハイライト/メモ/注意を譜面に書き込み・保存 */}
        {analysis && (
          <AnnotationLayer
            containerId="osmd-container"
            noteElementsRef={noteElementsRef}
            noteElementsVersion={noteElementsVersion}
            scoreId={practiceItemId ? undefined : score.id}
            practiceItemId={practiceItemId}
          />
        )}

        {/* 演奏バー: お手本 / テンポ / メトロノーム / 区間 を1本に統合 — UX刷新 Step 2 */}
        {analysis && (
          <div className={styles.playBar} data-onboarding="scoreDetail.playControls">
            <div className={styles.playBarRow}>
              <button
                type="button"
                className={`${styles.barCell} ${playbackState === "playing" ? styles.barCellOn : ""}`}
                onClick={() => {
                  if (playbackState === "playing") pausePlayback()
                  else if (playbackState === "paused") resumePlayback()
                  else startPlayback()
                }}
                disabled={recordingState === "recording" || recordingState === "countdown"}
                aria-label="お手本 再生/一時停止"
              >
                {playbackState === "playing" ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                )}
                <span className={styles.barLabel}>お手本</span>
              </button>

              <button
                type="button"
                className={`${styles.barCell} ${openPanel === "tempo" ? styles.barCellActive : ""}`}
                onClick={() => setOpenPanel((p) => (p === "tempo" ? null : "tempo"))}
                aria-expanded={openPanel === "tempo"}
              >
                <span className={styles.barTempo}>♩{playbackTempo}</span>
                <span className={styles.barLabel}>テンポ</span>
              </button>

              <button
                type="button"
                className={`${styles.barCell} ${metronomeOn ? styles.barCellOn : ""}`}
                onClick={() => setMetronomeOn((v) => !v)}
                aria-pressed={metronomeOn}
                aria-label="メトロノーム"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 21h12L15 4H9L6 21z" /><path d="M12 8l4 8" /></svg>
                <span className={styles.barLabel}>メトロ{metronomeOn ? "・ON" : ""}</span>
              </button>

              <button
                type="button"
                className={`${styles.barCell} ${openPanel === "range" || rangeMode || (rangeStart !== null && rangeEnd !== null) ? styles.barCellActive : ""}`}
                onClick={() => setOpenPanel((p) => (p === "range" ? null : "range"))}
                aria-expanded={openPanel === "range"}
                aria-label="区間ループ"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M17 2l4 4-4 4" /><path d="M3 11V10a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" /></svg>
                <span className={styles.barLabel}>区間</span>
              </button>
            </div>

            {openPanel === "tempo" && (
              <div className={styles.barPanel}>
                {(() => {
                  const tMin = Math.max(Math.round(analysis.bpm * 0.25), 20)
                  const tMax = Math.round(analysis.bpm * 2)
                  const busy = playbackState === "playing" || recordingState === "recording" || recordingState === "countdown"
                  const set = (v: number) => setPlaybackTempo(Math.min(tMax, Math.max(tMin, v)))
                  const pct = ((playbackTempo - tMin) / Math.max(1, tMax - tMin)) * 100
                  return (
                    <div className={styles.tempoControl}>
                      <div className={styles.tempoMain}>
                        <button type="button" className={styles.stepBtn} onClick={() => set(playbackTempo - 1)} disabled={busy || playbackTempo <= tMin} aria-label="遅く">−</button>
                        <div className={styles.tempoCenter}>
                          <span className={styles.tempoNum}>{playbackTempo}</span>
                          <span className={styles.tempoUnit}>BPM</span>
                          <button type="button" className={styles.resetBtn} onClick={() => set(analysis.bpm)} disabled={busy} title="原速に戻す" aria-label="原速に戻す">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
                          </button>
                        </div>
                        <button type="button" className={styles.stepBtn} onClick={() => set(playbackTempo + 1)} disabled={busy || playbackTempo >= tMax} aria-label="速く">＋</button>
                      </div>
                      <input
                        type="range" min={tMin} max={tMax} value={playbackTempo}
                        onChange={(e) => set(Number(e.target.value))}
                        disabled={busy}
                        className={styles.tempoSlider}
                        style={{ background: `linear-gradient(to right, var(--tempo-accent,#4a6cf7) ${pct}%, #e6e4ea ${pct}%)` }}
                      />
                      <div className={styles.tempoScale}><span>{tMin}</span><span>{tMax}</span></div>
                    </div>
                  )
                })()}
              </div>
            )}

            {openPanel === "range" && (
              <div className={styles.barPanel}>
                <div className={styles.rangeBody}>
                  <button
                    type="button"
                    className={`${styles.rangeSelectBtn} ${rangeMode ? styles.rangeSelectOn : ""}`}
                    onClick={() => setRangeMode((v) => !v)}
                    aria-pressed={rangeMode}
                  >
                    {rangeMode ? "選択モード中（もう一度で終了）" : "区間を選ぶ"}
                  </button>

                  {rangeMode && rangeStart === null && (
                    <p className={styles.rangeHint}>楽譜で <b>開始の音符</b> をタップ → 次に <b>終了の音符</b> をタップ</p>
                  )}
                  {rangeMode && rangeStart !== null && rangeEnd === null && (
                    <p className={styles.rangeHint}>次に <b>終了の音符</b> をタップ</p>
                  )}

                  {rangeStart !== null && rangeEnd !== null && (
                    <>
                      <div className={styles.rangeActions}>
                        {!isRangeLooping ? (
                          <button className={styles.rangePlayBtn} onClick={startRangeLoop}>▶ 区間をループ再生</button>
                        ) : (
                          <button className={styles.rangeStopBtn} onClick={stopPlayback}>■ ループ停止</button>
                        )}
                        <button
                          className={styles.rangeClearBtn}
                          onClick={() => { if (isRangeLooping) stopPlayback(); setRangeStart(null); setRangeEnd(null) }}
                        >
                          解除
                        </button>
                      </div>
                      {isScoreMode && (
                        <button
                          type="button"
                          className={styles.rangeRecordBtn}
                          disabled={recordingState !== "idle"}
                          onClick={() => {
                            if (rangeStart === null || rangeEnd === null) return
                            const lo = Math.min(rangeStart, rangeEnd)
                            const hi = Math.max(rangeStart, rangeEnd)
                            if (isRangeLooping) stopPlayback()
                            pendingRangeRef.current = { from: lo, to: hi }
                            // 区間先頭を画面内へ入れてから録音CTAをトリガ (Recorderのidleボタンを click)
                            noteElementsRef.current[lo]?.scrollIntoView({ behavior: "smooth", block: "center" })
                            const btn = document.querySelector('[data-testid="recorder-start-button"]') as HTMLButtonElement | null
                            btn?.click()
                          }}
                        >
                          ● この区間を録音（部分採点）
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 現在のレベル（直近5回の総合点平均）— 録音の直前に可視化 */}
        {recordingState === "idle" && recentLevel && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "12px 16px",
              borderRadius: 12,
              background: rankLabels[getScoreRank(recentLevel.avg)].bg,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 12, color: "#666" }}>現在のレベル</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: rankLabels[getScoreRank(recentLevel.avg)].color }}>
                {rankLabels[getScoreRank(recentLevel.avg)].label}
              </span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: rankLabels[getScoreRank(recentLevel.avg)].color }}>
              {recentLevel.avg}
              <span style={{ fontSize: 14, fontWeight: 500 }}>点</span>
            </div>
          </div>
        )}

        {/* 履歴レビュー中(演奏を選択中)は録音ボタンを隠し、演奏モードへ戻すリードを表示 */}
        {selected ? (
          <div style={{ textAlign: "center", padding: "18px 16px", background: "linear-gradient(135deg,#F0F7FF,#FDF8E7)", border: "1px solid #DCE7F5", borderRadius: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>🎻 もう一度演奏してみよう！</div>
            <div style={{ fontSize: 13, color: "#666", marginBottom: 14 }}>この演奏をふまえて、もう一度チャレンジ</div>
            <button type="button" onClick={() => selectPerformanceById(null)} style={{ background: "linear-gradient(135deg,#2563EB,#3B82F6)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>演奏する</button>
          </div>
        ) : onboardingRecordStep ? (
          // オンボの録音ステップだけ、実録音せず「ふりかえり(見本)へ進むだけ」のボタンに差し替える。
          // 通常ユーザーの録音ボタン(下の Recorder)は元のまま。
          <div data-onboarding="scoreDetail.recordButton">
            <button
              type="button"
              onClick={() => handleTabChange("review")}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "14px 16px", background: "linear-gradient(100deg,#e5392b,#f0603a)", color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: "pointer" }}
            >
              <span aria-hidden style={{ width: 10, height: 10, borderRadius: "50%", background: "#fff", display: "inline-block" }} />
              録音して AI 採点
            </button>
          </div>
        ) : (
        <div data-onboarding="scoreDetail.recordButton">
          <Recorder
            onRecordingComplete={handleRecordingComplete}
            previousBestScore={bestPitchScore}
            bpm={playbackTempo}
            onCountdownStart={() => setRecordingState("countdown")}
            onRecordingStart={() => { setRecordingState("recording"); startRecordingGuide() }}
            onRecordingBpmChange={handleRecordingBpmChange}
            onRecordingStop={() => { setRecordingState("preview"); stopRecordingGuide() }}
            uploadProgress={uploadProgress}
            onShowLoop={isScoreMode ? () => handleTabChange("review") : undefined}
            onIdleRecordClick={() => {
              // 録音CTA押下の瞬間に「この録音が区間録音か」を確定。
              // 区間ボタン経由なら pendingRangeRef がセット済 → 確定。通常録音なら null。
              const r = pendingRangeRef.current
              pendingRangeRef.current = null
              recordingRangeRef.current = r
              // パート: 区間と同じタイミングで確定 (区間が無ければパートも無し)
              recordingPartIdRef.current = r ? pendingPartIdRef.current : null
              pendingPartIdRef.current = null
              if (r && analysis) {
                const startSec = analysis.notes[r.from]?.start_time_sec ?? 0
                const endSec = analysis.notes[r.to]?.end_time_sec ?? startSec
                recGuideOffsetSecRef.current = startSec
                // 区間の実時間長 = 楽譜時間長 × (楽譜bpm / 録音bpm)。末尾に余韻+反応分のバッファ。
                const recBpm = recordingBpmRef.current || analysis.bpm
                const RANGE_TAIL_BUFFER_SEC = 2.0
                recGuideStopAtRealSecRef.current =
                  (endSec - startSec) * (analysis.bpm / recBpm) + RANGE_TAIL_BUFFER_SEC
              } else {
                recGuideOffsetSecRef.current = 0
                recGuideStopAtRealSecRef.current = Infinity
              }
            }}
          />
        </div>
        )}
      </div>
      )}

      {/* ふりかえりタブ: 上達の推移 → ゴール/基礎練/学びポイント → (畳んだ)演奏履歴。曲・練習アイテム両対応。
          個別演奏の一覧は「すべての演奏を見る」で畳み、気になる人だけ展開する (2026-07-25 案1拡張)。 */}
      {activeTab === "review" && (
        <div data-section="review" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {deleteHintBlock}
          {trajectoryBlock}
          {isScoreMode && <ScoreLoopDetail scoreId={score.id} userId={userId} />}
          {selected != null ? (
            performanceHistoryBlock
          ) : (
            <details className={styles.allTakes}>
              <summary className={styles.allTakesSummary}>すべての演奏を見る</summary>
              <div style={{ marginTop: 12 }}>{performanceHistoryBlock}</div>
            </details>
          )}
        </div>
      )}

      {arcoResult && (
        <ArcoResultOverlay
          scoreId={score.id}
          userId={userId}
          perf={{ id: arcoResult.id, pitchAccuracy: arcoResult.pitchAccuracy ?? null, timingAccuracy: arcoResult.timingAccuracy ?? null }}
          onClose={() => { setArcoResult(null); if (isScoreMode) handleTabChange("review") }}
          onGoReview={isScoreMode ? () => { setArcoResult(null); handleTabChange("review") } : undefined}
        />
      )}

      {/* 祝いオーバーレイ (§2.2): 振り返りを開いた瞬間に発動。Error Boundary で通常結果に必ずフォールバック。 */}
      {activeTab === "review" && celebrationPerf && !celebAlreadyShown && celebEvents.length > 0 && (
        <CelebrationBoundary>
          <MilestoneCelebration
            events={celebEvents}
            tone="child"
            subjectName={score.title}
            star={null}
            dateLabel={new Date(celebrationPerf.uploadedAt).toLocaleDateString("ja-JP").replace(/\//g, ".")}
            onClose={closeCelebration}
            onSeeRecords={() => { closeCelebration(); router.push(`/${userId}/records`) }}
            onNewPieces={() => { closeCelebration(); router.push(`/${userId}/practice/pieces`) }}
          />
        </CelebrationBoundary>
      )}

      <OnboardingTrigger pageKey={practiceItemId ? "practiceItem" : "scoreDetail"} />
    </div>
  )
}
