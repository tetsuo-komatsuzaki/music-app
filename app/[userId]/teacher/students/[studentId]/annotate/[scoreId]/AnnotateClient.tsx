"use client"

// 先生の添削 authoring 画面 (2026-07-29)。AnnotatableScore を編集モードで、保存先を
// TeacherFeedback(この生徒・この曲) に差し替える。
import Link from "next/link"
import { useCallback } from "react"
import AnnotatableScore from "@/app/components/AnnotatableScore"
import { getFeedbackAsTeacher, saveFeedback } from "@/app/actions/teacherFeedback"
import type { AnnotationData } from "@/app/actions/scoreAnnotations"

export default function AnnotateClient({
  userId, studentId, studentName, scoreId, scoreTitle, buildUrl,
}: {
  userId: string
  studentId: string
  studentName: string
  scoreId: string
  scoreTitle: string
  buildUrl: string | null
}) {
  const load = useCallback(async (): Promise<AnnotationData> => {
    const r = await getFeedbackAsTeacher(studentId, { scoreId })
    return r.ok ? r.data : {}
  }, [studentId, scoreId])

  const save = useCallback((data: AnnotationData) => {
    saveFeedback(studentId, { scoreId }, data)
  }, [studentId, scoreId])

  return (
    <div>
      <Link href={`/${userId}/teacher/students/${studentId}`} style={{ fontSize: 12, color: "#6b7885", textDecoration: "none" }}>← {studentName} さんのカルテ</Link>
      <h1 style={{ fontSize: 17, fontWeight: 900, margin: "6px 0 2px" }}>添削：{scoreTitle}</h1>
      <p style={{ fontSize: 12, color: "#6b7885", margin: "0 0 12px" }}>
        「譜面に書き込む」を押して、ハイライトやメモを付けてください。書いた内容は {studentName} さんに届きます（自動保存）。
      </p>
      <AnnotatableScore buildUrl={buildUrl} scoreId={scoreId} loadOverride={load} saveOverride={save} />
    </div>
  )
}
