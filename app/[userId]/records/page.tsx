// 記録 /[userId]/records — 確定モック 記録01/02 (build-teacher.py RECORDS) の写経 (2026-08-22)。
// 「弾いた日と点数のすべて」: 月送りバー ・ grid3統計 (演奏/弾いた日/つづけて) ・
// 日別カード (時刻 ・ 曲名 ・ 区間/マスター/達成タグ ・ 音程#2B5BC4/リズム#E6A94Aの5pxバー ・
// 平均点ピル ・ →)。旧・記念カード本棚は「きみの歴史」(カルテSTORY) に役割移譲して置換。
import { notFound } from "next/navigation"
import Link from "next/link"
import ArcoMotion from "@/app/components/ArcoMotion"
import { prisma } from "@/app/_libs/prisma"
import ds from "@/app/components/ds.module.css"

export const metadata = { title: "記録" }

type Row = {
  id: string
  time: string
  title: string
  pitch: number
  timing: number
  range: boolean
  badge: "master" | "achieve" | null
  href: string
}

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

export default async function RecordsPage({ params, searchParams }: {
  params: Promise<{ userId: string }>
  searchParams: Promise<{ m?: string }>
}) {
  const { userId } = await params
  const { m } = await searchParams

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: userId },
    select: { id: true },
  })
  if (!dbUser) notFound()

  // 対象月 (?m=YYYY-MM ・ 既定=今月)
  const now = new Date()
  const mm = /^(\d{4})-(\d{2})$/.exec(m ?? "")
  const year = mm ? +mm[1] : now.getFullYear()
  const month = mm ? +mm[2] - 1 : now.getMonth()
  const from = new Date(year, month, 1)
  const to = new Date(year, month + 1, 1)
  const prevM = `${month === 0 ? year - 1 : year}-${String((month === 0 ? 12 : month)).padStart(2, "0")}`
  const nextM = `${month === 11 ? year + 1 : year}-${String((month === 11 ? 1 : month + 2)).padStart(2, "0")}`

  const [perfs, pracs, achievements, allDaysRows] = await Promise.all([
    prisma.performance.findMany({
      where: { userId: dbUser.id, uploadedAt: { gte: from, lt: to }, pitchAccuracy: { not: null }, timingAccuracy: { not: null } },
      orderBy: { uploadedAt: "desc" },
      select: { id: true, uploadedAt: true, pitchAccuracy: true, timingAccuracy: true, rangeFromNote: true, scoreId: true, score: { select: { title: true } } },
    }),
    prisma.practicePerformance.findMany({
      where: { userId: dbUser.id, uploadedAt: { gte: from, lt: to }, pitchAccuracy: { not: null }, timingAccuracy: { not: null } },
      orderBy: { uploadedAt: "desc" },
      select: { id: true, uploadedAt: true, pitchAccuracy: true, timingAccuracy: true, practiceItemId: true, practiceItem: { select: { title: true, category: true } } },
    }),
    prisma.userScoreAchievement.findMany({
      where: { userId: dbUser.id },
      select: { scoreId: true, achievedAt: true, masteredAt: true },
    }),
    // つづけて日数: 直近90日の演奏日 (曲+教材)
    prisma.performance.findMany({
      where: { userId: dbUser.id, uploadedAt: { gte: new Date(Date.now() - 90 * 864e5) } },
      select: { uploadedAt: true },
    }),
  ])
  const pracDays = await prisma.practicePerformance.findMany({
    where: { userId: dbUser.id, uploadedAt: { gte: new Date(Date.now() - 90 * 864e5) } },
    select: { uploadedAt: true },
  })

  const achByScore = new Map(achievements.map((a) => [a.scoreId, a]))
  const badgeOf = (scoreId: string, at: Date): Row["badge"] => {
    const a = achByScore.get(scoreId)
    if (!a) return null
    if (a.masteredAt && dayKey(a.masteredAt) === dayKey(at)) return "master"
    if (a.achievedAt && dayKey(a.achievedAt) === dayKey(at)) return "achieve"
    return null
  }

  const rows: (Row & { at: Date })[] = [
    ...perfs.map((p) => ({
      id: p.id, at: p.uploadedAt,
      time: `${p.uploadedAt.getHours()}:${String(p.uploadedAt.getMinutes()).padStart(2, "0")}`,
      title: p.score.title,
      pitch: Math.round(p.pitchAccuracy!), timing: Math.round(p.timingAccuracy!),
      range: p.rangeFromNote != null,
      badge: badgeOf(p.scoreId, p.uploadedAt),
      href: `/${userId}/scores/${p.scoreId}?tab=review`,
    })),
    ...pracs.map((p) => ({
      id: p.id, at: p.uploadedAt,
      time: `${p.uploadedAt.getHours()}:${String(p.uploadedAt.getMinutes()).padStart(2, "0")}`,
      title: p.practiceItem.title.replace(/_/g, "・"),
      pitch: Math.round(p.pitchAccuracy!), timing: Math.round(p.timingAccuracy!),
      range: false,
      badge: null as Row["badge"],
      href: `/${userId}/practice/${p.practiceItem.category}/${p.practiceItemId}?tab=review`,
    })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime())

  // 日別グループ
  const byDay = new Map<string, { label: string; rows: (Row & { at: Date })[] }>()
  for (const r of rows) {
    const k = dayKey(r.at)
    if (!byDay.has(k)) byDay.set(k, { label: `${r.at.getMonth() + 1}月${r.at.getDate()}日`, rows: [] })
    byDay.get(k)!.rows.push(r)
  }

  // つづけて日数 (最後に弾いた日から連続何日か)
  const playDays = new Set([...allDaysRows, ...pracDays].map((p) => dayKey(p.uploadedAt)))
  let streak = 0
  if (playDays.size > 0) {
    const cur = new Date()
    if (!playDays.has(dayKey(cur))) cur.setDate(cur.getDate() - 1) // 今日まだ弾いていなければ昨日から数える
    while (playDays.has(dayKey(cur))) { streak++; cur.setDate(cur.getDate() - 1) }
  }

  const daysInMonth = new Set(rows.map((r) => dayKey(r.at))).size

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 0 60px" }}>
      <Link href={`/${userId}/progress`}
        style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--text-sub)", fontSize: 13, fontWeight: 700, padding: "10px 2px 2px", textDecoration: "none" }}>
        ‹ カルテ
      </Link>
      <h1 className={ds.t} style={{ paddingTop: 0 }}>記録</h1>
      <div style={{ color: "var(--text-sub)", fontSize: 13, padding: "5px 2px 0" }}>弾いた日と点数のすべて</div>

      {/* 月送り (原本: カレンダーは置かない) */}
      <div className={ds.card} style={{ padding: "11px 15px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href={`/${userId}/records?m=${prevM}`} className="pressable" style={{ fontSize: 14, color: "var(--text-sub)", fontWeight: 800, textDecoration: "none", padding: "0 8px" }}>‹</Link>
          <b style={{ fontSize: 14, color: "var(--text-ink)" }}>{year}年 {month + 1}月</b>
          <Link href={`/${userId}/records?m=${nextM}`} className="pressable" style={{ fontSize: 14, color: "var(--text-sub)", fontWeight: 800, textDecoration: "none", padding: "0 8px" }}>›</Link>
        </div>
      </div>

      {/* grid3 統計 (原本) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
        {[
          { lab: "演奏", n: rows.length, unit: "回" },
          { lab: "弾いた日", n: daysInMonth, unit: "日" },
          { lab: "つづけて", n: streak, unit: "日" },
        ].map((s) => (
          <div key={s.lab} className={ds.card} style={{ margin: 0, textAlign: "center", padding: "14px 6px" }}>
            <div className={ds.lab} style={{ letterSpacing: ".1em" }}>{s.lab}</div>
            <div className={ds.bigN} style={{ fontSize: 24, marginTop: 4 }}><span data-anim="count">{s.n}</span></div>
            <div style={{ fontSize: 9.5, color: "var(--text-sub)" }}>{s.unit}</div>
          </div>
        ))}
      </div>

      {rows.length === 0 ? (
        /* 原本 記録02: 0件 */
        <div style={{ textAlign: "center", padding: "10px 0 6px" }}>
          {/* 空状態 — 原本: /proto v3 画面5 (empty-mock 正) の写経 (2026-08-23) */}
          <ArcoMotion kit="05C" label="楽譜を見せるアルコ" className="recEmptyArco" />
          <style>{`.recEmptyArco { width: 176px; height: 176px; margin: 0 auto; box-shadow: 0 0 0 3px #e8ca84, 0 0 0 8px rgba(11,18,32,.9), 0 0 0 9px #bca160, 0 10px 28px rgba(0,0,0,.45); }`}</style>
          <div aria-hidden style={{ width: 24, height: 3, margin: "22px auto 14px", borderTop: "1px solid #d4af37", borderBottom: "1px solid #d4af37" }} />
          <b style={{ display: "block", fontSize: 21, fontWeight: 900, color: "#fffae8" }}>まだ記録がありません</b>
          <span style={{ display: "block", fontSize: 13, color: "#a89d85", marginTop: 10, lineHeight: 1.8 }}>
            最初の1曲を、いっしょに録りましょう
          </span>
          <div style={{ marginTop: 22 }}>
            <Link href={`/${userId}/library?tab=pieces`} className="pressable" style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: "100%", maxWidth: 300, height: 50, borderRadius: 999,
              background: "linear-gradient(180deg, #f0d98c 0%, #d4af37 45%, #b8892e 100%)",
              color: "#0b1220", fontWeight: 900, fontSize: 15, letterSpacing: ".08em",
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(217,169,60,.35), 0 2px 4px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.35)",
            }}>
              練習をはじめる
            </Link>
          </div>
        </div>
      ) : (
        [...byDay.values()].map((day) => (
          <div key={day.label} className={ds.card} style={{ padding: "13px 15px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <b style={{ fontSize: 13.5, color: "var(--text-ink)" }}>{day.label}</b>
              <span style={{ fontSize: 10.5, color: "var(--text-sub)" }}>{day.rows.length}回</span>
            </div>
            {day.rows.map((r) => (
              <Link key={r.id} href={r.href} className="pressable"
                style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(150,175,225,.08)", textDecoration: "none", color: "inherit" }}>
                <span aria-hidden style={{ width: 28, height: 28, borderRadius: "50%", flex: "none", display: "grid", placeItems: "center", background: "linear-gradient(160deg,#4a6cf7,#3b56d4)", color: "#fff", fontSize: 10 }}>▶</span>
                <span style={{ flex: 1, minWidth: 0, display: "block" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <b style={{ fontSize: 12.5, color: "var(--text-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.title}</b>
                    {r.range && <span style={{ flex: "none", fontSize: 9.5, fontWeight: 800, color: "var(--text-sub)", background: "rgba(150,175,225,.1)", borderRadius: 999, padding: "2px 7px" }}>区間</span>}
                    {r.badge === "master" && <span style={{ flex: "none", fontSize: 9.5, fontWeight: 800, color: "var(--gold)", background: "rgba(232,178,60,.14)", borderRadius: 999, padding: "2px 7px" }}>マスター</span>}
                    {r.badge === "achieve" && <span style={{ flex: "none", fontSize: 9.5, fontWeight: 800, color: "var(--teal)", background: "rgba(127,196,196,.16)", border: "1px solid rgba(127,196,196,.32)", borderRadius: 999, padding: "2px 7px" }}>達成</span>}
                    <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: "auto", flex: "none" }}>{r.time}</span>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#2b5bc4", flex: "none" }} />
                    <span style={{ fontSize: 9.5, color: "var(--text-sub)", width: 26, flex: "none" }}>音程</span>
                    <span className={ds.bar} style={{ flex: 1, height: 5 }}><i style={{ width: `${r.pitch}%`, background: "#2b5bc4" }} /></span>
                    <b style={{ fontSize: 10.5, flex: "none", color: "var(--text-ink)", fontVariantNumeric: "tabular-nums" }}>{r.pitch}</b>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#e6a94a", flex: "none" }} />
                    <span style={{ fontSize: 9.5, color: "var(--text-sub)", width: 26, flex: "none" }}>リズム</span>
                    <span className={ds.bar} style={{ flex: 1, height: 5 }}><i style={{ width: `${r.timing}%`, background: "#e6a94a" }} /></span>
                    <b style={{ fontSize: 10.5, flex: "none", color: "var(--text-ink)", fontVariantNumeric: "tabular-nums" }}>{r.timing}</b>
                  </span>
                </span>
                <span style={{ flex: "none", fontSize: 11, fontWeight: 800, color: "var(--text-ink)", background: "rgba(150,175,225,.1)", borderRadius: 999, padding: "4px 11px", fontVariantNumeric: "tabular-nums" }}>{Math.round((r.pitch + r.timing) / 2)}点</span>
                <span aria-hidden style={{ flex: "none", color: "var(--text-sub)", fontWeight: 800, fontSize: 12 }}>→</span>
              </Link>
            ))}
          </div>
        ))
      )}
    </div>
  )
}
