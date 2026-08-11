// 先生ホーム = 生徒一覧 + 招待コード (2026-07-28)。MVPではホームと一覧を統合。
// 2026-08-11 先生カルテv3: モック(teacher-all-screens 画面1)準拠のダッシュボード基調に刷新。
// 生徒ごとに 今週の練習/カルテ枚数 + 返し待ちバッジ(宿題提出+聴いてほしい依頼) + カルテを見るボタン。
// role!==teacher は生徒ホームへ redirect。別シェル(TeacherShell)内で描画される。
import Link from "next/link"
import { UserRound } from "lucide-react"
import { redirect } from "next/navigation"
import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { SUBTASK_BY_ID } from "@/app/_libs/subtaskCatalog.generated"
import InviteCodeCard from "./InviteCodeCard"

// 直近演奏1件から、いちばんの課題(診断サブタスク名)を1つ取り出す (AIの一言用・軽量)
function topWeakName(analysisSummary: unknown): string | null {
  const dj = (analysisSummary as { diagnosis?: { map_available?: boolean; diagnosis?: { pitch?: string[]; rhythm?: string[] } } })?.diagnosis
  if (!dj?.map_available) return null
  for (const tree of ["pitch", "rhythm"] as const) {
    for (const sid of dj.diagnosis?.[tree] ?? []) {
      const def = SUBTASK_BY_ID[sid]
      if (def?.diagnosable) return def.name
    }
  }
  return null
}

export const metadata = { title: "先生モード" }

const NAVY = "#22346b"
const SOFT = "#f5f7fa"
const LINE = "#e6e9ef"

function sinceDays(days: number): Date {
  return new Date(Date.now() - days * 86400000)
}

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

  // 生徒ごとの 今週(7日)の練習/カルテ枚数・直近活動・返し待ち をまとめて取得
  const weekAgo = sinceDays(7)
  const lastByStudent = new Map<string, Date | null>()
  const weekCount = new Map<string, number>()
  const waitCount = new Map<string, number>()
  if (studentIds.length) {
    const [perfMax, pracMax, perf7, prac7, hwWait, listenWait] = await Promise.all([
      prisma.performance.groupBy({ by: ["userId"], where: { userId: { in: studentIds } }, _max: { uploadedAt: true } }),
      prisma.practicePerformance.groupBy({ by: ["userId"], where: { userId: { in: studentIds } }, _max: { uploadedAt: true } }),
      prisma.performance.groupBy({ by: ["userId"], where: { userId: { in: studentIds }, uploadedAt: { gte: weekAgo } }, _count: { _all: true } }),
      prisma.practicePerformance.groupBy({ by: ["userId"], where: { userId: { in: studentIds }, uploadedAt: { gte: weekAgo } }, _count: { _all: true } }),
      // 返し待ち = 提出済みで未完了の宿題
      prisma.assignment.groupBy({ by: ["studentId"], where: { teacherId: me.id, studentId: { in: studentIds }, submittedAt: { not: null }, doneAt: null }, _count: { _all: true } }),
      // + 未対応の「聴いてほしい」依頼
      prisma.listenRequest.groupBy({ by: ["studentId"], where: { teacherId: me.id, studentId: { in: studentIds }, status: "pending" }, _count: { _all: true } }),
    ])
    for (const id of studentIds) {
      const a = perfMax.find((p) => p.userId === id)?._max.uploadedAt ?? null
      const b = pracMax.find((p) => p.userId === id)?._max.uploadedAt ?? null
      const latest = [a, b].filter(Boolean).sort((x, y) => (y as Date).getTime() - (x as Date).getTime())[0] ?? null
      lastByStudent.set(id, latest as Date | null)
      weekCount.set(id, (perf7.find((p) => p.userId === id)?._count._all ?? 0) + (prac7.find((p) => p.userId === id)?._count._all ?? 0))
      waitCount.set(id, (hwWait.find((p) => p.studentId === id)?._count._all ?? 0) + (listenWait.find((p) => p.studentId === id)?._count._all ?? 0))
    }
  }

  // AIの一言 (ルールベース・生徒1人あたり追加1クエリ): 直近演奏の課題 + 返し待ちアクション
  const aiLine = new Map<string, string>()
  await Promise.all(studentIds.map(async (id) => {
    const week = weekCount.get(id) ?? 0
    const wait = waitCount.get(id) ?? 0
    if (week === 0) { aiLine.set(id, "今週はまだ練習なし。声をかけてみよう。"); return }
    let weakName: string | null = null
    try {
      const p = await prisma.performance.findFirst({
        where: { userId: id, pitchAccuracy: { not: null } },
        orderBy: { uploadedAt: "desc" },
        select: { analysisSummary: true },
      })
      weakName = p ? topWeakName(p.analysisSummary) : null
    } catch { weakName = null }
    const head = weakName ? `「${weakName}」が課題。` : "今週も練習中。順調そう。"
    const tail = wait > 0 ? " 返し待ちがあるよ。" : ""
    aiLine.set(id, `今週：${head}${tail}`)
  }))

  return (
    <div>
      {/* 紺ヘッダー (モック画面1) */}
      <div style={{ background: NAVY, color: "#eaf0fb", borderRadius: 16, padding: "14px 16px 13px", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "var(--fs-label)", fontWeight: 700, color: "#9fb2dd", letterSpacing: ".08em" }}>ARCODA 先生</div>
            <h1 style={{ fontSize: "var(--fs-head)", fontWeight: 900, margin: "2px 0 0", color: "#fff" }}>生徒一覧</h1>

          </div>
          <span style={{ marginLeft: "auto", display: "flex", gap: 6, flex: "none" }}>
            <Link href={`/${userId}/teacher/schedule`} style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: "#dbe4f2", background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.18)", borderRadius: 999, padding: "5px 11px", textDecoration: "none" }}>
              レッスン枠
            </Link>
            <Link href={`/${userId}/teacher/profile`} style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: "#dbe4f2", background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.18)", borderRadius: 999, padding: "5px 11px", textDecoration: "none" }}>
              プロフィール
            </Link>
          </span>
        </div>
      </div>

      {links.length === 0 ? (
        <div style={{ fontSize: "var(--fs-body)", color: "var(--text-muted)", padding: "18px 0", textAlign: "center" }}>
          まだ生徒がいません。下の招待コードを生徒に伝えてください。
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
          {links.map((l) => {
            const wait = waitCount.get(l.student.id) ?? 0
            const week = weekCount.get(l.student.id) ?? 0
            return (
              <div key={l.student.id}
                style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 14, padding: "12px 14px", boxShadow: "0 1px 3px rgba(30,45,70,.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <UserRound size={20} color="#8ba0c4" aria-hidden style={{ flex: "none" }} />
                  <span style={{ fontSize: "var(--fs-subhead)", fontWeight: 900, color: "var(--text-ink)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {l.student.name}
                  </span>
                  {/* 返し待ちバッジは個別の生徒カルテへ移設 (2026-08-11 Tetsuo確定) */}
                </div>
                <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-sub)", marginTop: 5 }}>
                  今週 練習 <b style={{ color: "var(--text-ink)" }}>{week}</b>回 ・ 直近 {daysAgoLabel(lastByStudent.get(l.student.id) ?? null)}
                </div>
                {aiLine.get(l.student.id) && (
                  <div style={{ fontSize: "var(--fs-caption)", color: "#4a4066", background: "#f6f4ff", border: "1px solid #e7dcfb", borderRadius: 8, padding: "6px 9px", marginTop: 7, lineHeight: 1.55 }}>
                    {aiLine.get(l.student.id)}
                  </div>
                )}
                <Link href={`/${userId}/teacher/students/${l.student.id}`}
                  style={{ display: "block", textAlign: "center", marginTop: 9, fontSize: "var(--fs-caption)", fontWeight: 900, color: "#fff", background: NAVY, borderRadius: 9, padding: "9px 0", textDecoration: "none" }}>
                  カルテを見る →
                </Link>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ background: SOFT, borderRadius: 14, padding: 2 }}>
        <InviteCodeCard />
      </div>
    </div>
  )
}
