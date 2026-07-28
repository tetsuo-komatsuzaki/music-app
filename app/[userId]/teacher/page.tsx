// 先生ホーム = 生徒一覧 + 招待コード (2026-07-28)。MVPではホームと一覧を統合。
// role!==teacher は生徒ホームへ redirect。別シェル(TeacherShell)内で描画される。
import Link from "next/link"
import { redirect } from "next/navigation"
import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import InviteCodeCard from "./InviteCodeCard"

export const metadata = { title: "先生モード" }

function daysAgoLabel(d: Date | null): string {
  if (!d) return "まだ練習なし"
  const ms = Date.now() - d.getTime()
  const day = Math.floor(ms / 86400000)
  if (day <= 0) return "今日"
  if (day === 1) return "昨日"
  return `${day}日前`
}

export default async function TeacherHomePage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) redirect(`/${userId}`)

  const me = await prisma.user.findUnique({
    where: { supabaseUserId: userId },
    select: { id: true, role: true },
  })
  if (!me || me.role !== "teacher") redirect(`/${userId}`)

  const links = await prisma.teacherStudent.findMany({
    where: { teacherId: me.id },
    orderBy: { createdAt: "asc" },
    select: { student: { select: { id: true, name: true } } },
  })
  const studentIds = links.map((l) => l.student.id)

  // 直近活動 (曲/教材の演奏の最新 uploadedAt) をまとめて取得
  const lastByStudent = new Map<string, Date | null>()
  if (studentIds.length) {
    const [perf, prac] = await Promise.all([
      prisma.performance.groupBy({
        by: ["userId"], where: { userId: { in: studentIds } }, _max: { uploadedAt: true },
      }),
      prisma.practicePerformance.groupBy({
        by: ["userId"], where: { userId: { in: studentIds } }, _max: { uploadedAt: true },
      }),
    ])
    for (const id of studentIds) {
      const a = perf.find((p) => p.userId === id)?._max.uploadedAt ?? null
      const b = prac.find((p) => p.userId === id)?._max.uploadedAt ?? null
      const latest = [a, b].filter(Boolean).sort((x, y) => (y as Date).getTime() - (x as Date).getTime())[0] ?? null
      lastByStudent.set(id, latest as Date | null)
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 18, fontWeight: 900, margin: "4px 0 2px" }}>生徒</h1>
      <p style={{ fontSize: 12.5, color: "#6b7885", margin: "0 0 16px" }}>
        担当している生徒の一覧です。タップでカルテ（練習の様子・宿題）を開きます。
      </p>

      {links.length === 0 ? (
        <div style={{ fontSize: 13, color: "#9aa6b3", padding: "18px 0", textAlign: "center" }}>
          まだ生徒がいません。下の招待コードを生徒に伝えてください。
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
          {links.map((l) => (
            <Link
              key={l.student.id}
              href={`/${userId}/teacher/students/${l.student.id}`}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                background: "#fff", border: "1px solid #eef1f4", borderRadius: 14,
                padding: "12px 14px", textDecoration: "none", color: "inherit",
                boxShadow: "0 1px 3px rgba(30,45,70,.05)",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <span aria-hidden style={{ fontSize: 22 }}>👤</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#2b3742", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {l.student.name}
                </span>
              </span>
              <span style={{ fontSize: 11.5, color: "#9aa6b3", flex: "none" }}>
                直近 {daysAgoLabel(lastByStudent.get(l.student.id) ?? null)} →
              </span>
            </Link>
          ))}
        </div>
      )}

      <InviteCodeCard />
    </div>
  )
}
