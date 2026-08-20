"use client"

// モック照合ページ (検証専用): 実装コンポーネントを「モックの見本データ」で描画する。
// これをモックと並べて画素で比べ、一致してから「完了」を宣言する (2026-08-20 規約)。
import TeacherAssignments from "@/app/[userId]/TeacherAssignments"

// parts-04 宿題カード 案1 の見本データそのまま (宿題2 / 提出ずみ1 / 合格1)
const ASSIGNMENTS = [
  {
    id: "1", kind: "practice" as const, teacherName: "田中", title: "クロイツェル 2番",
    reps: null, targetTempo: null, comment: null, href: "#", dueDate: "2026-08-20",
    goalType: "score", targetScore: 90, submitted: false, achieved: false, mastered: false,
  },
  {
    id: "2", kind: "practice" as const, teacherName: "田中", title: "イ長調の音階をなめらかに",
    reps: null, targetTempo: null, comment: null, href: "#", dueDate: "2026-08-23",
    goalType: null, targetScore: null, submitted: false, achieved: false, mastered: false,
  },
  {
    id: "3", kind: "score" as const, teacherName: "田中", title: "ふるさと",
    reps: null, targetTempo: null, comment: null, href: "#", dueDate: null,
    goalType: "achieve", targetScore: null, submitted: true, achieved: true, mastered: false,
  },
]

export default function ParityPage() {
  return (
    <div style={{ width: 390, margin: "0 auto", padding: "24px 18px" }}>
      <TeacherAssignments
        assignments={ASSIGNMENTS}
        summary={{ teacherName: "田中", unreadMessages: 0, feedbackCount: 0, unreadPassed: 1 }}
      />
    </div>
  )
}
