"use client"

import { PAGE_COACH_MARKS } from "./content/coachMarks"
import PageCoachMarks from "./PageCoachMarks"
import OnboardingErrorBoundary from "./OnboardingErrorBoundary"

type Props = { pageKey: string }

/**
 * 各ページに mount する薄いラッパー。
 * pageKey に対応する PAGE_COACH_MARKS の config を取り出して PageCoachMarks に渡す。
 * 個別 ErrorBoundary で囲み、コーチマークがクラッシュしても当該ページは生存する。
 */
export default function OnboardingTrigger({ pageKey }: Props) {
  const config = PAGE_COACH_MARKS.find(p => p.pageKey === pageKey)
  if (!config) return null
  return (
    <OnboardingErrorBoundary>
      <PageCoachMarks pageKey={pageKey} marks={config.marks} />
    </OnboardingErrorBoundary>
  )
}
