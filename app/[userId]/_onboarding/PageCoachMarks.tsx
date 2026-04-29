"use client"

import { useEffect, useState } from "react"
import { useOnboarding } from "./hooks/useOnboarding"
import CoachMark from "./CoachMark"
import { CoachMarkConfig } from "./content/coachMarks"

type Props = {
  pageKey: string
  marks: CoachMarkConfig[]
}

export default function PageCoachMarks({ pageKey, marks }: Props) {
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
  } = useOnboarding()

  const pageMarks = marks.filter(m => m.trigger === "page")
  const analysisMark = marks.find(m => m.trigger === "first-analysis-complete") ?? null

  const [pageMarkIndex, setPageMarkIndex] = useState(0)
  const [showAnalysisMark, setShowAnalysisMark] = useState(false)

  const isReplaying = replayingPageKey === pageKey
  const shouldShowPageMarks =
    isHydrated &&
    !allGuidesDismissed &&
    pageMarks.length > 0 &&
    (isReplaying || !pageGuidesSeen.has(pageKey))

  // pageKey or replay 切替時に index リセット
  useEffect(() => {
    setPageMarkIndex(0)
    setShowAnalysisMark(false)
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

  if (!isHydrated) return null

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
