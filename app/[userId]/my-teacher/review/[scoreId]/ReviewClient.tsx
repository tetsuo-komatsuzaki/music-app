"use client"

// 生徒: 先生の添削を読み取り専用で表示 (2026-07-29)。AnnotatableScore を readOnly で、
// 先生の TeacherFeedback を読み込んで譜面に重ねる。
import Link from "next/link"
import { useCallback } from "react"
import AnnotatableScore from "@/app/components/AnnotatableScore"
import { getFeedbackAsStudent } from "@/app/actions/teacherFeedback"
import type { AnnotationData } from "@/app/actions/scoreAnnotations"

export default function ReviewClient({
  userId, scoreId, scoreTitle, buildUrl,
}: {
  userId: string
  scoreId: string
  scoreTitle: string
  buildUrl: string | null
}) {
  const load = useCallback(async (): Promise<AnnotationData> => {
    const r = await getFeedbackAsStudent({ scoreId })
    return r.ok ? r.data : {}
  }, [scoreId])

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "16px 14px 60px" }}>
      <Link href={`/${userId}/my-teacher`} style={{ fontSize: 12, color: "#6b7885", textDecoration: "none" }}>← 先生とのやりとり</Link>
      <h1 style={{ fontSize: 17, fontWeight: 900, margin: "6px 0 2px" }}>先生の添削：{scoreTitle}</h1>
      <p style={{ fontSize: 12, color: "#6b7885", margin: "0 0 12px" }}>先生が譜面に書き込んだハイライトやメモです。</p>
      <AnnotatableScore buildUrl={buildUrl} scoreId={scoreId} readOnly loadOverride={load} />
    </div>
  )
}
