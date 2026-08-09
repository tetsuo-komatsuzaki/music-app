"use client"

// 演奏履歴の各録音から、宿題でなくても先生に「見てほしい」と共有する (D・2026-08-01)。
// 先生あり生徒のときだけ描画される (呼び手が canShare を判定)。
import { useState, useTransition } from "react"
import { Headphones } from "lucide-react"
import { sharePerformanceWithTeacher } from "@/app/actions/teacherActions"

export default function ShareToTeacherButton({
  performanceId,
  kind,
}: {
  performanceId: string
  kind: "score" | "practice"
}) {
  const [pending, start] = useTransition()
  const [done, setDone] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const click = () => {
    setErr(null)
    start(async () => {
      const r = await sharePerformanceWithTeacher(performanceId, kind)
      if (r.ok) setDone(true)
      else setErr(r.error)
    })
  }

  if (done) {
    return <span style={{ fontSize: 11.5, fontWeight: 800, color: "#2e8b57" }}>先生に共有しました ✓</span>
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <button
        type="button"
        onClick={click}
        disabled={pending}
        style={{ fontSize: 11.5, fontWeight: 800, color: "#3b56d4", background: "#eef1fe", border: "1px solid #d6ddff", borderRadius: 8, padding: "6px 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}
      >
        {pending ? "共有中…" : <><Headphones size={13} /> 先生に共有</>}
      </button>
      {err && <span style={{ fontSize: 11, color: "#cc5470" }}>{err}</span>}
    </span>
  )
}
