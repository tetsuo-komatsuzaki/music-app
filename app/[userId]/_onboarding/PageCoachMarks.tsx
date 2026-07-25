"use client"

// コーチガイドの薄い React ラッパー (2026-07-25 状態機械化)
//
// 役割は2つだけ:
//   1. 外界のシグナル (Provider の state / DOM / navigation) → Event 変換して dispatch
//   2. 状態機械の State → CoachMark を描画
// 遷移ロジックは guideMachine.ts (純粋・テスト済み) に集約している。
// 旧実装は settleTick / latchedOpen / pageMarkIndex / showAnalysisMark / didMountRef …
// が絡み合い、複数の useEffect が同じ state を奪い合って順序バグを起こしていた。

import { useCallback, useEffect, useReducer, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useOnboarding } from "./hooks/useOnboarding"
import CoachMark from "./CoachMark"
import { CoachMarkConfig } from "./content/coachMarks"
import {
  transition,
  selectActiveMark,
  selectGuideSample,
  isPageGuideActive,
  initialState,
  type GuideState,
  type GuideEvent,
  type GuideEffect,
} from "./guideMachine"

type Props = {
  pageKey: string
  marks: CoachMarkConfig[]
  /** このページのガイドが動いている間ずっと出す見本の種類 */
  pageSample?: string
}

/** DOM を見て、この画面で実際に出せる page マークだけに絞る。 */
function computeEligibleMarks(marks: CoachMarkConfig[]): CoachMarkConfig[] {
  const has = (key: string) => !!document.querySelector(`[data-onboarding="${key}"]`)
  return marks.filter((m) => {
    if (m.trigger !== "page") return false
    // requiresAbsent: 指定要素が「在る」なら出さない (例: まだ弾いていない人向け)
    if (m.requiresAbsent && has(m.requiresAbsent)) return false
    // requiresTarget: 対象要素が「無い」なら出さない
    if (m.requiresTarget && m.targetKey && !has(m.targetKey)) return false
    return true
  })
}

export default function PageCoachMarks({ pageKey, marks, pageSample }: Props) {
  const {
    isHydrated,
    welcomeSlidesShown,
    allGuidesDismissed,
    pageGuidesSeen,
    replayingPageKey,
    clearReplayingPageKey,
    analysisOverlayRenderedAt,
    firstAnalysisGuideShown,
    markFirstAnalysisGuideShown,
    markPageGuideSeen,
    dismissAllGuides,
    guideSample,
    setGuideSample,
  } = useOnboarding()

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const isReplaying = replayingPageKey === pageKey
  const analysisMark = marks.find((m) => m.trigger === "first-analysis-complete") ?? null

  // --- 状態機械 ---
  // transition が返す effects を Provider アクションに落とす reducer ラッパー。
  const [state, rawDispatch] = useReducer(
    (s: GuideState, e: GuideEvent): GuideState => {
      const { next, effects } = transition(s, e, { isReplaying })
      pendingEffectsRef.current.push(...effects)
      return next
    },
    initialState,
  )
  // effects は render 後の effect フェーズで実行する (dispatch 中に副作用を起こさない)
  const pendingEffectsRef = useRef<GuideEffect[]>([])
  const runEffect = useCallback((eff: GuideEffect) => {
    switch (eff.type) {
      case "MARK_SEEN": markPageGuideSeen(pageKey); break
      case "CLEAR_REPLAY": clearReplayingPageKey(); break
      case "DISMISS_ALL": dismissAllGuides(); break
      case "MARK_ANALYSIS_SEEN": markFirstAnalysisGuideShown(); break
    }
  }, [pageKey, markPageGuideSeen, clearReplayingPageKey, dismissAllGuides, markFirstAnalysisGuideShown])
  useEffect(() => {
    if (pendingEffectsRef.current.length === 0) return
    const effs = pendingEffectsRef.current
    pendingEffectsRef.current = []
    effs.forEach(runEffect)
  })
  const dispatch = rawDispatch

  // --- 開始判定 (旧 settleTick + gating + latch + reset を1本化) ---
  // state が pagePending のときだけ動く。gating を満たし、DOM 由来の有効マークが
  // 確定したら START(marks) を1回。DOM 未確定ならタイマーで再試行し、
  // タイムアウトで有効0なら GATING_FAIL。→ 開始時に有効マークを凍結する。
  useEffect(() => {
    if (state.t !== "pagePending") return
    if (!isHydrated) return
    if (typeof document === "undefined") return

    // 構造的に出せない: 既読(非replay) or dismissed
    if (allGuidesDismissed || (!isReplaying && pageGuidesSeen.has(pageKey))) {
      dispatch({ type: "GATING_FAIL" })
      return
    }
    // はじめてガイド表示中は開始しない (replay は例外)
    if (!welcomeSlidesShown && !isReplaying) return

    let done = false
    const timers: ReturnType<typeof setTimeout>[] = []
    const tryStart = () => {
      if (done || state.t !== "pagePending") return
      const eligible = computeEligibleMarks(marks)
      if (eligible.length > 0) {
        done = true
        dispatch({ type: "START", marks: eligible })
      }
    }
    // 遷移直後は対象要素が未 commit のことがある → 描画が落ち着くまで数回試す
    ;[0, 60, 200, 500].forEach((ms) => timers.push(setTimeout(tryStart, ms)))
    // それでも 0 件なら「出すものが無い」で idle へ
    timers.push(setTimeout(() => {
      if (!done && state.t === "pagePending") dispatch({ type: "GATING_FAIL" })
    }, 800))
    return () => timers.forEach(clearTimeout)
    // pathname を依存に入れ、クライアント遷移のたびに再評価する
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.t, isHydrated, allGuidesDismissed, isReplaying, welcomeSlidesShown, pageGuidesSeen, pageKey, marks, pathname])

  // --- 明示的な再生 (replay) ---
  // replayingPageKey がこのページに変わったら再生。マウント初回は発火させない。
  const prevReplayRef = useRef(replayingPageKey)
  useEffect(() => {
    const prev = prevReplayRef.current
    prevReplayRef.current = replayingPageKey
    if (prev === replayingPageKey) return
    if (replayingPageKey === pageKey) dispatch({ type: "REPLAY_START" })
  }, [replayingPageKey, pageKey])

  // --- analysis-trigger 発火 ---
  // page ガイドが idle に落ち、分析オーバーレイが描画され未表示なら1回出す。
  useEffect(() => {
    if (state.t !== "idle") return
    if (!analysisMark) return
    if (firstAnalysisGuideShown) return
    if (allGuidesDismissed) return
    if (analysisOverlayRenderedAt === null) return
    dispatch({ type: "ANALYSIS_READY" })
  }, [state.t, analysisMark, firstAnalysisGuideShown, allGuidesDismissed, analysisOverlayRenderedAt])

  // --- 描画すべきマーク ---
  const active = selectActiveMark(state, analysisMark)

  // --- targetUrl: 表示前にクエリを合わせる (タブ切替マーク) ---
  const targetUrl = active?.mark.targetUrl ?? null
  const urlMatches = (() => {
    if (!targetUrl) return true
    const want = new URLSearchParams(targetUrl)
    for (const [k, v] of want.entries()) if (searchParams.get(k) !== v) return false
    return true
  })()
  useEffect(() => {
    if (!targetUrl || urlMatches) return
    const want = new URLSearchParams(targetUrl)
    const cur = new URLSearchParams(searchParams.toString())
    for (const [k, v] of want.entries()) cur.set(k, v)
    router.replace(pathname + "?" + cur.toString())
  }, [targetUrl, urlMatches, router, pathname, searchParams])

  // --- 見本 (guideSample) の on/off。描画中調整 (React 公式パターン) ---
  const wantSample = selectGuideSample(state, pageSample ?? null)
  if (wantSample !== guideSample) setGuideSample(wantSample)

  if (!isHydrated) return null
  if (!active) return null
  // URL がマークの targetUrl と一致するまで非表示 (タブ切替が完了するまで)
  if (!urlMatches) return null

  if (active.kind === "page") {
    const { mark, index, total } = active
    return (
      <CoachMark
        key={`${pageKey}-page-${index}`}
        targetKey={mark.targetKey}
        headline={mark.headline}
        body={mark.body}
        step={index + 1}
        totalSteps={total}
        showDismissAllCheckbox={mark.showDismissAllCheckbox}
        awaitTapHint={mark.awaitTap?.hint}
        onTargetTap={mark.awaitTap ? () => dispatch({ type: "TARGET_TAP" }) : undefined}
        onNext={() => dispatch({ type: "NEXT" })}
        onPrev={index > 0 ? () => dispatch({ type: "PREV" }) : undefined}
        onSkip={() => dispatch({ type: "SKIP_ALL" })}
        onDismissAll={mark.showDismissAllCheckbox ? () => dispatch({ type: "DISMISS_ALL" }) : undefined}
      />
    )
  }

  // analysis-trigger マーク
  return (
    <CoachMark
      key={`${pageKey}-analysis`}
      targetKey={active.mark.targetKey}
      headline={active.mark.headline}
      body={active.mark.body}
      step={1}
      totalSteps={1}
      showDismissAllCheckbox={false}
      onNext={() => dispatch({ type: "ANALYSIS_DONE" })}
      onSkip={() => dispatch({ type: "ANALYSIS_DONE" })}
    />
  )
}

// isPageGuideActive はセレクタとして guideMachine 側に持たせているが、
// このラッパーでは analysis 発火を state.t==="idle" で判定するため未使用。
// (将来 page ガイド中に別処理を挟む場合の拡張点として export を残す)
void isPageGuideActive
