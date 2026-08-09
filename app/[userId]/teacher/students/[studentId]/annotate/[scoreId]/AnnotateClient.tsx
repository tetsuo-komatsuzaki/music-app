"use client"

// 採点カルテ 記入画面 (2026-08-06 統一・モック103dcadf)。
// 譜面添削 (AnnotatableScore・自動保存) + 💬コメント + 🎨表現クリア認定 を1枚で書き、
// 「カルテを返す」で該当曲の👂依頼も自動解決・生徒に通知。
import Link from "next/link"
import { useCallback, useState } from "react"
import { Palette, MessageCircle } from "lucide-react"
import AnnotatableScore from "@/app/components/AnnotatableScore"
import { getFeedbackAsTeacher, saveFeedback } from "@/app/actions/teacherFeedback"
import { returnGradingKarte } from "@/app/actions/gradingKarte"
import { MOOD_TAG_DEFS, moodTagLabel } from "@/app/_libs/moodTags"
import type { AnnotationData } from "@/app/actions/scoreAnnotations"

export default function AnnotateClient({
  userId, studentId, studentName, scoreId, scoreTitle, buildUrl, initialMood = null,
}: {
  userId: string
  studentId: string
  studentName: string
  scoreId: string
  scoreTitle: string
  buildUrl: string | null
  initialMood?: string | null
}) {
  const [comment, setComment] = useState("")
  const [moodTagId, setMoodTagId] = useState(initialMood ?? "")
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle")
  const [clearedStar, setClearedStar] = useState<number | null>(null)

  const load = useCallback(async (): Promise<AnnotationData> => {
    const r = await getFeedbackAsTeacher(studentId, { scoreId })
    if (r.ok) {
      const d = r.data as AnnotationData & { comment?: string | null }
      if (d.comment) setComment(d.comment)
      return r.data
    }
    return {}
  }, [studentId, scoreId])

  const save = useCallback((data: AnnotationData) => {
    saveFeedback(studentId, { scoreId }, data)
  }, [studentId, scoreId])

  const submit = async () => {
    setState("sending")
    const r = await returnGradingKarte({ studentId, scoreId, comment: comment || null, moodTagId: moodTagId || null })
    if (r.ok) { setClearedStar(r.clearedStar); setState("done") } else setState("error")
  }

  const lbl: React.CSSProperties = { fontSize: 11.5, fontWeight: 800, color: "#6b7885", display: "block", marginTop: 12 }
  const inp: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid #dfe3e8", borderRadius: 9, padding: "8px 11px", fontSize: 12.5, marginTop: 4 }

  return (
    <div>
      <Link href={`/${userId}/teacher/students/${studentId}`} style={{ fontSize: 12, color: "#6b7885", textDecoration: "none" }}>← {studentName} さんのカルテ</Link>
      <h1 style={{ fontSize: 17, fontWeight: 900, margin: "6px 0 2px" }}>採点カルテ：{scoreTitle}</h1>
      <p style={{ fontSize: 12, color: "#6b7885", margin: "0 0 12px" }}>
        譜面の書き込みは自動保存。コメントと表現の認定を添えて「カルテを返す」と、{studentName} さんに1枚のカルテとして届きます。
      </p>
      <AnnotatableScore buildUrl={buildUrl} scoreId={scoreId} loadOverride={load} saveOverride={save} />

      {/* ── 採点カルテ: 添削以外の記入欄 ── */}
      <div style={{ background: "#fff", border: "1px solid #eef1f4", borderRadius: 14, padding: "13px 15px", marginTop: 14 }}>
        <label style={{ ...lbl, marginTop: 0 }}><Palette size={13} style={{ verticalAlign: -1, marginRight: 4 }} />表現クリア認定（任意）
          <select value={moodTagId} onChange={(e) => setMoodTagId(e.target.value)} style={inp}>
            <option value="">認定しない</option>
            {MOOD_TAG_DEFS.map((t) => (
              <option key={t.id} value={t.id}>{moodTagLabel(t.id)}</option>
            ))}
          </select>
          <span style={{ fontSize: 10, color: "#9aa6b3" }}>認定すると、この曲の★がそのまま {studentName} さんの表現力レベルになります</span>
        </label>

        <label style={lbl}><MessageCircle size={13} style={{ verticalAlign: -1, marginRight: 4 }} />ひとこと（生徒に届きます）
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} maxLength={500}
            placeholder="例: フレーズの終わりがふわっと収まって、とても良かった！"
            style={{ ...inp, resize: "vertical" }} />
        </label>

        {state === "done" ? (
          <div style={{ marginTop: 12, fontSize: 12.5, fontWeight: 800, color: "#2e8b57" }}>
            ✓ カルテを返しました{clearedStar != null ? `（表現力 ★${clearedStar} に認定）` : ""}。この曲の「聴いてほしい」も対応済みになりました。
          </div>
        ) : (
          <button type="button" onClick={submit} disabled={state === "sending"}
            style={{ width: "100%", marginTop: 12, border: "none", borderRadius: 11, padding: 12, fontSize: 13, fontWeight: 900, color: "#fff", background: "#8a5a1f", cursor: "pointer", opacity: state === "sending" ? 0.6 : 1 }}>
            {state === "sending" ? "返却中…" : "カルテを返す"}
          </button>
        )}
        {state === "error" && <div style={{ marginTop: 6, fontSize: 11.5, color: "#c0392b" }}>返却に失敗しました。もう一度ためしてください。</div>}
      </div>
    </div>
  )
}
