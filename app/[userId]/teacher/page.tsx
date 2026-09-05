// 先生ホーム = 生徒一覧 + 招待コード (2026-07-28)。MVPではホームと一覧を統合。
// 2026-08-11 先生カルテv3: モック(teacher-all-screens 画面1)準拠のダッシュボード基調に刷新。
// 生徒ごとに 今週の練習/カルテ枚数 + 返し待ちバッジ(宿題提出+聴いてほしい依頼) + カルテを見るボタン。
// role!==teacher は生徒ホームへ redirect。別シェル(TeacherShell)内で描画される。
import Link from "next/link"
import ds from "@/app/components/ds.module.css"
import { redirect } from "next/navigation"
import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { weakSlotsByPerformance } from "@/app/_libs/diagnosisPresentation"
import InviteCodeCard from "./InviteCodeCard"

// 直近演奏1件のいちばんの課題 (AIの一言用) は明細から (weakSlotsByPerformance lastN=1・2026-09-05)

export const metadata = { title: "先生モード" }


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
      const m = await weakSlotsByPerformance(id, { lastN: 1 }, 1)
      weakName = [...m.values()][0]?.[0]?.name ?? null
    } catch { weakName = null }
    const head = weakName ? `「${weakName}」が課題。` : "今週も練習中。順調そう。"
    const tail = wait > 0 ? " 返し待ちがあるよ。" : ""
    aiLine.set(id, `今週：${head}${tail}`)
  }))

  return (
    <div>
      {/* 紺グラデヘッダー (原本 先01 HEAD) */}
      <div style={{ background: "linear-gradient(135deg,#1f3d78,#2b5bc4)", borderRadius: 16, padding: "16px 18px 14px", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 9.5, fontWeight: 900, letterSpacing: ".2em", color: "#a9c3f2" }}>ARCODA 先生</div>
          <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 800, color: "#fff", background: "rgba(255,255,255,.16)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 999, padding: "3px 10px", flex: "none" }}>先生モード</span>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: "2px 0 0", color: "#fff" }}>生徒一覧</h1>
      </div>

      {links.length === 0 ? (
        <div style={{ fontSize: "var(--fs-body)", color: "var(--text-sub)", padding: "18px 0", textAlign: "center" }}>
          まだ生徒がいません。下の招待コードを生徒に伝えてください。
        </div>
      ) : (
        links.map((l) => {
          const wait = waitCount.get(l.student.id) ?? 0
          const week = weekCount.get(l.student.id) ?? 0
          const state = week === 0 ? "none" : wait > 0 ? "wait" : "ok"
          const col = state === "ok" ? "#a8c97f" : state === "none" ? "#e8a78f" : "var(--gold)"
          return (
            <Link key={l.student.id} href={`/${userId}/teacher/students/${l.student.id}`} className={`${ds.card} pressable`}
              style={{ display: "block", padding: "13px 15px", textDecoration: "none", color: "inherit" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <span style={{ width: 42, height: 42, borderRadius: "50%", flex: "none", display: "grid", placeItems: "center", background: "linear-gradient(150deg,#2a3f6b,#1b2b4c)", color: "#7fa4e8", fontSize: 15, fontWeight: 900 }}>
                  {(l.student.name ?? "生").slice(0, 1)}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ fontSize: 14.5, display: "block", color: "var(--text-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.student.name}</b>
                  <span style={{ fontSize: 10.5, color: "var(--text-muted)" }}>
                    {daysAgoLabel(lastByStudent.get(l.student.id) ?? null)}{week > 0 ? ` ・ ${week}回` : ""}
                  </span>
                </span>
                {wait > 0 && (
                  <span style={{ flex: "none", fontSize: 10, fontWeight: 800, color: "var(--gold)", background: "rgba(232,178,60,.14)", borderRadius: 999, padding: "3px 9px", fontVariantNumeric: "tabular-nums" }}>{wait}</span>
                )}
                <span aria-hidden style={{ flex: "none", color: "var(--text-sub)", fontWeight: 800 }}>→</span>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 9, paddingTop: 9, borderTop: "1px solid rgba(150,175,225,.09)" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: col, flex: "none" }} />
                <span style={{ fontSize: 11, color: col, fontWeight: 800, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {aiLine.get(l.student.id) ?? "今週も練習中。順調そう。"}
                </span>
              </span>
            </Link>
          )
        })
      )}

      <InviteCodeCard />

      {/* プロフィール / レッスン枠 (原本 先01: grid2) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
        <Link href={`/${userId}/teacher/profile`} className={`${ds.card} pressable`} style={{ margin: 0, padding: 14, textDecoration: "none", display: "block" }}>
          <b style={{ fontSize: 13.5, display: "block", color: "var(--text-ink)" }}>プロフィール</b>
          <span style={{ fontSize: 10.5, color: "var(--text-sub)" }}>先生を探すに載る内容</span>
        </Link>
        <Link href={`/${userId}/teacher/schedule`} className={`${ds.card} pressable`} style={{ margin: 0, padding: 14, textDecoration: "none", display: "block" }}>
          <b style={{ fontSize: 13.5, display: "block", color: "var(--text-ink)" }}>レッスン枠</b>
          <span style={{ fontSize: 10.5, color: "var(--text-sub)" }}>空き枠と予約</span>
        </Link>
      </div>
    </div>
  )
}
