// コーチガイドの状態機械 (2026-07-25)
//
// 【なぜ純粋関数か】
// 旧 PageCoachMarks は settleTick / latchedOpen / pageMarkIndex / showAnalysisMark /
// didMountRef … が絡み合い、複数の useEffect が同じ state を奪い合っていた。
// マウント時にラッチをリセットが打ち消す等、順序・タイミング由来のバグが頻発した。
// ここに遷移ロジックを純粋関数として1本化し、テストで固定することで、
// この種のバグを構造的に起こさない。React 側 (PageCoachMarks) は
// 「外界のシグナル → Event 変換」と「State → 描画」だけを担う。

import type { CoachMarkConfig } from "./content/coachMarks"

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export type GuideState =
  // 開始判定中 (DOM が揃うのを待っている / gating 判定前)
  | { t: "pagePending" }
  // page マーク列を表示中。有効マークは開始時に凍結して保持する
  // (実行中に DOM が変わっても列が揺れない)。
  | { t: "pageRunning"; index: number; marks: CoachMarkConfig[] }
  // page ガイドは完了/スキップ済。analysis マークはまだ出うる。
  | { t: "idle" }
  // analysis-trigger マーク表示中。
  | { t: "analysis" }
  // 全部終了。何も出さない。
  | { t: "off" }

export const initialState: GuideState = { t: "pagePending" }

// ---------------------------------------------------------------------------
// Event
// ---------------------------------------------------------------------------

export type GuideEvent =
  // 開始判定が通り、表示すべき有効マークが確定した (marks.length>0 前提)
  | { type: "START"; marks: CoachMarkConfig[] }
  // gating が構造的に不成立 (既読で非 replay / dismissed / 有効マーク0)
  | { type: "GATING_FAIL" }
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "TARGET_TAP" }
  | { type: "SKIP_ALL" }
  | { type: "DISMISS_ALL" }
  // page マーク完了後、分析オーバーレイが描画され analysis マークを出す条件が整った
  | { type: "ANALYSIS_READY" }
  | { type: "ANALYSIS_DONE" }
  // ヘルプ等からの明示的な再生。マウントでは絶対に発火させない (旧クロバーの根絶)。
  | { type: "REPLAY_START" }

// ---------------------------------------------------------------------------
// Effect (副作用の記述。実行は React 側。純粋性とテスト容易性のため)
// ---------------------------------------------------------------------------

export type GuideEffect =
  | { type: "MARK_SEEN" }          // markPageGuideSeen(pageKey)
  | { type: "CLEAR_REPLAY" }       // clearReplayingPageKey()
  | { type: "DISMISS_ALL" }        // dismissAllGuides()
  | { type: "MARK_ANALYSIS_SEEN" } // markFirstAnalysisGuideShown()

export type TransitionResult = { next: GuideState; effects: GuideEffect[] }

/** replay 中に終了したら CLEAR_REPLAY、そうでなければ MARK_SEEN。 */
function finishPageEffects(isReplaying: boolean): GuideEffect[] {
  return isReplaying ? [{ type: "CLEAR_REPLAY" }] : [{ type: "MARK_SEEN" }]
}

/**
 * 純粋な遷移関数。
 * isReplaying は「このページが今 replay 中か」を表す文脈フラグ
 * (page 完了時に MARK_SEEN するか CLEAR_REPLAY するかの分岐にのみ使う)。
 */
export function transition(
  state: GuideState,
  event: GuideEvent,
  ctx: { isReplaying: boolean },
): TransitionResult {
  const none = (next: GuideState): TransitionResult => ({ next, effects: [] })

  // どの状態からでも受ける「終了系」
  switch (event.type) {
    case "DISMISS_ALL":
      return { next: { t: "off" }, effects: [{ type: "DISMISS_ALL" }] }
    case "REPLAY_START":
      // 明示的な再生。既読でも最初からやり直す。
      return none({ t: "pagePending" })
    default:
      break
  }

  switch (state.t) {
    case "pagePending": {
      if (event.type === "START") {
        if (event.marks.length === 0) return none({ t: "idle" })
        return {
          next: { t: "pageRunning", index: 0, marks: event.marks },
          // 「一度表示したら既読」。開始時に1回だけ。
          effects: ctx.isReplaying ? [] : [{ type: "MARK_SEEN" }],
        }
      }
      if (event.type === "GATING_FAIL") return none({ t: "idle" })
      return none(state)
    }

    case "pageRunning": {
      const { index, marks } = state
      switch (event.type) {
        case "NEXT":
        case "TARGET_TAP": {
          const nextIndex = index + 1
          if (nextIndex >= marks.length) {
            // 最後のマークを越えた → page ガイド完了
            return { next: { t: "idle" }, effects: finishPageEffects(ctx.isReplaying) }
          }
          return none({ t: "pageRunning", index: nextIndex, marks })
        }
        case "PREV":
          return none({ t: "pageRunning", index: Math.max(0, index - 1), marks })
        case "SKIP_ALL":
          return { next: { t: "idle" }, effects: finishPageEffects(ctx.isReplaying) }
        default:
          return none(state)
      }
    }

    case "idle": {
      if (event.type === "ANALYSIS_READY") return none({ t: "analysis" })
      return none(state)
    }

    case "analysis": {
      if (event.type === "ANALYSIS_DONE" || event.type === "SKIP_ALL" || event.type === "NEXT") {
        return { next: { t: "off" }, effects: [{ type: "MARK_ANALYSIS_SEEN" }] }
      }
      return none(state)
    }

    case "off":
      return none(state)
  }
}

// ---------------------------------------------------------------------------
// Selectors (純粋。State → 描画に必要な値)
// ---------------------------------------------------------------------------

export type ActiveMark =
  | { kind: "page"; mark: CoachMarkConfig; index: number; total: number }
  | { kind: "analysis"; mark: CoachMarkConfig }
  | null

/** いま表示すべきマーク。無ければ null。 */
export function selectActiveMark(
  state: GuideState,
  analysisMark: CoachMarkConfig | null,
): ActiveMark {
  if (state.t === "pageRunning") {
    const mark = state.marks[state.index]
    if (!mark) return null
    return { kind: "page", mark, index: state.index, total: state.marks.length }
  }
  if (state.t === "analysis" && analysisMark) {
    return { kind: "analysis", mark: analysisMark }
  }
  return null
}

/**
 * いま立てるべき見本 (guideSample)。
 * page マーク実行中は マーク単位 sample、無ければ pageSample。
 * それ以外は null。
 */
export function selectGuideSample(
  state: GuideState,
  pageSample: string | null,
): string | null {
  if (state.t === "pageRunning") {
    return state.marks[state.index]?.sample ?? pageSample ?? null
  }
  return null
}

/** page ガイドが「まだ表示しうる/表示中」か (analysis 発火の前提判定に使う)。 */
export function isPageGuideActive(state: GuideState): boolean {
  return state.t === "pagePending" || state.t === "pageRunning"
}
