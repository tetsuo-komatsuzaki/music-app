"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useOnboarding } from "./hooks/useOnboarding"
import CoachMark from "./CoachMark"
import { CoachMarkConfig } from "./content/coachMarks"

type Props = {
  pageKey: string
  marks: CoachMarkConfig[]
  /** このページのガイドが動いている間ずっと出す見本の種類 */
  pageSample?: string
}

export default function PageCoachMarks({ pageKey, marks, pageSample }: Props) {
  const {
    isHydrated,
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

  // requiresTarget のマークは、対象要素が今この画面に在るときだけ出す。
  // (無いまま出すと useTargetRect が 5 秒後に画面中央フォールバックしてしまう)
  const pageMarks = useMemo(
    () => marks.filter((m) => {
      if (m.trigger !== "page") return false
      if (!m.requiresTarget || !m.targetKey) return true
      if (!isHydrated || typeof document === "undefined") return false
      return !!document.querySelector(`[data-onboarding="${m.targetKey}"]`)
    }),
    [marks, isHydrated],
  )
  const analysisMark = marks.find(m => m.trigger === "first-analysis-complete") ?? null

  const [pageMarkIndex, setPageMarkIndex] = useState(0)
  const [showAnalysisMark, setShowAnalysisMark] = useState(false)
  // 表示を開始したら、このマウント中は出し続けるためのラッチ。
  // (表示と同時に既読化するため、既読判定だけでは即座に閉じてしまう)
  const [latchedOpen, setLatchedOpen] = useState(false)

  const isReplaying = replayingPageKey === pageKey
  const eligible =
    isHydrated &&
    !allGuidesDismissed &&
    pageMarks.length > 0 &&
    (isReplaying || !pageGuidesSeen.has(pageKey))
  const shouldShowPageMarks =
    eligible || (latchedOpen && !allGuidesDismissed && pageMarks.length > 0)

  // 「一度でも表示したら既読」にする (2026-07-21)。
  // 従来は最後まで進める/閉じる まで既読にならず、途中でページを離れると
  // 次回また最初から出てしまい「何回も表示される」状態だった。
  useEffect(() => {
    if (!eligible || latchedOpen) return
    setLatchedOpen(true)
    if (!isReplaying) markPageGuideSeen(pageKey)
  }, [eligible, latchedOpen, isReplaying, pageKey, markPageGuideSeen])

  // pageKey or replay 切替時に index リセット
  useEffect(() => {
    setPageMarkIndex(0)
    setShowAnalysisMark(false)
    setLatchedOpen(false)
  }, [pageKey, replayingPageKey])

  const pageMarksDone = pageMarkIndex >= pageMarks.length

  // analysis-trigger 発動判定
  // M4: page-trigger を全て消費してから初めて発動する
  useEffect(() => {
    if (!analysisMark) return
    if (firstAnalysisGuideShown) return
    if (allGuidesDismissed) return
    if (!isHydrated) return
    if (shouldShowPageMarks && !pageMarksDone) return
    if (analysisOverlayRenderedAt === null) return
    setShowAnalysisMark(true)
  }, [
    analysisMark,
    firstAnalysisGuideShown,
    allGuidesDismissed,
    isHydrated,
    shouldShowPageMarks,
    pageMarksDone,
    analysisOverlayRenderedAt,
  ])

  // 現在表示すべきマーク
  const activeMark: CoachMarkConfig | null = (() => {
    if (shouldShowPageMarks && !pageMarksDone) return pageMarks[pageMarkIndex] ?? null
    if (showAnalysisMark && analysisMark) return analysisMark
    return null
  })()

  // targetUrl が指定されたマークに対する URL ナビゲーション
  // (タブ切替が必要なマーク: progress.weakness, categoryList.* 等)
  const urlMatchesTarget = useMemo(() => {
    if (!activeMark?.targetUrl) return true
    const targetParams = new URLSearchParams(activeMark.targetUrl)
    for (const [key, value] of targetParams.entries()) {
      if (searchParams.get(key) !== value) return false
    }
    return true
  }, [activeMark?.targetUrl, searchParams])

  useEffect(() => {
    if (!activeMark?.targetUrl) return
    if (urlMatchesTarget) return
    const targetParams = new URLSearchParams(activeMark.targetUrl)
    const currentParams = new URLSearchParams(searchParams.toString())
    for (const [key, value] of targetParams.entries()) {
      currentParams.set(key, value)
    }
    router.replace(pathname + "?" + currentParams.toString())
  }, [activeMark?.id, activeMark?.targetUrl, urlMatchesTarget, router, pathname, searchParams])

  // 見本表示の on/off。描画中の state 調整 (React 公式パターン) で effect を使わない。
  // ページ単位の見本は、マークが1枚でも出ている間ずっと立てる。
  // requiresTarget の判定より先に見本が描画されるので、見本が作った要素を
  // 指すマークもきちんと出せる。
  const guideRunning = shouldShowPageMarks && !pageMarksDone
  const wantSample = activeMark?.sample ?? (guideRunning ? pageSample ?? null : null)
  if (wantSample !== guideSample) setGuideSample(wantSample)

  if (!isHydrated) return null
  // URL がマークの targetUrl と一致するまでマーク描画を遅延 (タブ切替が完了するまで非表示)
  if (!urlMatchesTarget) return null

  // page-trigger マーク表示
  if (shouldShowPageMarks && !pageMarksDone) {
    const mark = pageMarks[pageMarkIndex]
    const onAdvance = () => {
      const next = pageMarkIndex + 1
      if (next >= pageMarks.length) {
        if (isReplaying) {
          clearReplayingPageKey()
        } else {
          markPageGuideSeen(pageKey)
        }
      }
      setPageMarkIndex(next)
    }
    const onSkipAll = () => {
      if (isReplaying) {
        clearReplayingPageKey()
      } else {
        markPageGuideSeen(pageKey)
      }
      setPageMarkIndex(pageMarks.length)
    }
    const onDismissAllAction = () => {
      dismissAllGuides()
      setPageMarkIndex(pageMarks.length)
    }
    return (
      <CoachMark
        key={`${pageKey}-page-${pageMarkIndex}`}
        targetKey={mark.targetKey}
        headline={mark.headline}
        body={mark.body}
        step={pageMarkIndex + 1}
        totalSteps={pageMarks.length}
        showDismissAllCheckbox={mark.showDismissAllCheckbox}
        awaitTapHint={mark.awaitTap?.hint}
        onTargetTap={mark.awaitTap ? () => {
          // 実際のボタンが押された。遷移や録音はアプリ側が行うので、
          // ここではガイドを次へ進めるだけ。
          onAdvance()
        } : undefined}
        onNext={onAdvance}
        onPrev={pageMarkIndex > 0 ? () => setPageMarkIndex(pageMarkIndex - 1) : undefined}
        onSkip={onSkipAll}
        onDismissAll={mark.showDismissAllCheckbox ? onDismissAllAction : undefined}
      />
    )
  }

  // analysis-trigger マーク表示
  if (showAnalysisMark && analysisMark) {
    return (
      <CoachMark
        key={`${pageKey}-analysis`}
        targetKey={analysisMark.targetKey}
        headline={analysisMark.headline}
        body={analysisMark.body}
        step={1}
        totalSteps={1}
        showDismissAllCheckbox={false}
        onNext={() => {
          markFirstAnalysisGuideShown()
          setShowAnalysisMark(false)
        }}
        onSkip={() => {
          markFirstAnalysisGuideShown()
          setShowAnalysisMark(false)
        }}
      />
    )
  }

  return null
}
