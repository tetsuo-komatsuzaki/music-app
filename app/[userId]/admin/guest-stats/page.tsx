// ゲストの計測 (2026-09-06 Tetsuo確定: 自前で記録)。管理者だけが見る。
// 直近 30 日の 訪問 ・ シートが出た場所ごとの回数 ・ そこから登録/ログインへ進んだ比率。
import { redirect } from "next/navigation"
import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { GUEST_PLACES, GUEST_PLACE_LABEL, type GuestPlace } from "@/app/_libs/guestEvents"
import ds from "@/app/components/ds.module.css"

export const metadata = { title: "ゲストの計測" }
export const dynamic = "force-dynamic"

const DAYS = 30

export default async function GuestStatsPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  void userId
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const dbUser = await prisma.user.findUnique({ where: { supabaseUserId: user.id } })
  if (!dbUser || dbUser.role !== "admin") {
    return <div style={{ padding: 40, textAlign: "center" }}>管理者権限が必要です</div>
  }

  const since = new Date(Date.now() - DAYS * 24 * 3600 * 1000)
  let rows: { kind: string; place: string; n: number }[] = []
  let byDay: { day: string; visits: number }[] = []
  let ready = true
  try {
    const grouped = await prisma.guestEvent.groupBy({ by: ["kind", "place"], where: { createdAt: { gte: since } }, _count: { _all: true } })
    rows = grouped.map((g) => ({ kind: g.kind, place: g.place, n: g._count._all }))
    const days = await prisma.$queryRaw<{ day: string; n: bigint }[]>`
      SELECT to_char("createdAt" AT TIME ZONE 'Asia/Tokyo', 'MM-DD') AS day, count(*)::bigint AS n
      FROM "GuestEvent" WHERE kind = 'visit' AND "createdAt" >= ${since}
      GROUP BY 1 ORDER BY 1 DESC LIMIT 14`
    byDay = days.map((d) => ({ day: d.day, visits: Number(d.n) }))
  } catch {
    ready = false   // 表がまだ無い (マイグレーション未適用)
  }

  const count = (kind: string, place?: string) => rows.filter((r) => r.kind === kind && (place == null || r.place === place)).reduce((a, r) => a + r.n, 0)
  const visitsHome = count("visit", "home"), visitsReturning = count("visit", "returning")
  const shownTotal = count("gate_shown"), goTotal = count("gate_signup") + count("gate_login"), laterTotal = count("gate_later")
  const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : "-")
  const places = GUEST_PLACES.filter((p) => p !== "home" && p !== "returning") as GuestPlace[]

  const cell: React.CSSProperties = { padding: "6px 8px", borderBottom: "1px solid rgba(150,175,225,.14)", fontSize: 13, whiteSpace: "nowrap" }
  const head: React.CSSProperties = { ...cell, fontSize: 11, color: "var(--text-sub)", fontWeight: 800, letterSpacing: ".04em" }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "12px 0 40px" }}>
      <h1 style={{ fontSize: 18, fontWeight: 900, margin: "6px 0 12px" }}>ゲストの計測 ・ 直近 {DAYS} 日</h1>
      {!ready && (
        <div className={ds.card}><b>まだ記録の表がありません。</b><span style={{ fontSize: 13, color: "var(--text-sub)" }}> マイグレーション 20260906120000_guest_event を本番に適用すると記録が始まります。</span></div>
      )}
      <div className={ds.card}>
        <div className={ds.lab}>入口</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 8 }}>
          <Stat label="ゲストホーム ・ 未登録" value={visitsHome} />
          <Stat label="ゲストホーム ・ 前回の画面" value={visitsReturning} />
          <Stat label="シートから進んだ比率" value={pct(goTotal, shownTotal)} sub={`${goTotal} / ${shownTotal} ・ あとで ${laterTotal}`} />
        </div>
      </div>
      <div className={ds.card}>
        <div className={ds.lab}>シートが出た場所</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", marginTop: 6 }}>
            <thead><tr><th style={head}>場所</th><th style={head}>出た回数</th><th style={head}>無料で登録</th><th style={head}>ログイン</th><th style={head}>あとで</th><th style={head}>進んだ比率</th></tr></thead>
            <tbody>
              {places.map((p) => {
                const shown = count("gate_shown", p), su = count("gate_signup", p), lo = count("gate_login", p), la = count("gate_later", p)
                return (
                  <tr key={p}>
                    <td style={cell}>{GUEST_PLACE_LABEL[p]}</td>
                    <td style={cell}>{shown}</td><td style={cell}>{su}</td><td style={cell}>{lo}</td><td style={cell}>{la}</td>
                    <td style={cell}><b>{pct(su + lo, shown)}</b></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className={ds.card}>
        <div className={ds.lab}>日ごとの訪問 ・ 直近 14 日</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
          {byDay.length === 0 && <span style={{ fontSize: 13, color: "var(--text-sub)" }}>まだ訪問がありません</span>}
          {byDay.map((d) => (
            <span key={d.day} style={{ fontSize: 12, padding: "4px 9px", borderRadius: 999, background: "rgba(127,164,232,.14)" }}>{d.day} ・ <b>{d.visits}</b></span>
          ))}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div style={{ padding: "8px 10px", borderRadius: 12, background: "rgba(127,164,232,.10)" }}>
      <div style={{ fontSize: 11, color: "var(--text-sub)", fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900, marginTop: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-sub)" }}>{sub}</div>}
    </div>
  )
}
