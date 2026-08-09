// 曲リクエスト一覧 (2026-07-12)
// オンボーディングQ8「憧れの曲」で未収録曲が自由入力された記録(SongRequest)を
// 曲名ごとに集計して表示する。教材追加の需要調査用(閲覧のみ)。
import { redirect } from "next/navigation"
import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"

export const metadata = { title: "曲リクエスト" }

export default async function AdminSongRequestsPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: user.id },
  })
  if (!dbUser || dbUser.role !== "admin") {
    return <div style={{ padding: 40, textAlign: "center" }}>管理者権限が必要です</div>
  }

  const grouped = await prisma.songRequest.groupBy({
    by: ["songName"],
    _count: { songName: true },
    _max: { createdAt: true },
    orderBy: [{ _count: { songName: "desc" } }, { _max: { createdAt: "desc" } }],
  })
  const total = grouped.reduce((n, g) => n + g._count.songName, 0)

  const fmt = (d: Date | null) =>
    d
      ? new Date(d).toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" })
      : "-"

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 4 }}>曲リクエスト</h1>
      <p style={{ fontSize: "0.85rem", color: "var(--text-body)", marginBottom: 20 }}>
        オンボーディングで「弾きたい曲がリストにない」と入力された曲名の集計
        （{grouped.length}曲 / のべ{total}件）。教材追加の需要調査用。
      </p>

      {grouped.length === 0 ? (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            color: "var(--text-sub)",
            background: "#fafafa",
            borderRadius: 12,
          }}
        >
          リクエストはまだありません
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.92rem" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
              <th style={{ padding: "8px 12px" }}>曲名</th>
              <th style={{ padding: "8px 12px", width: 90, textAlign: "right" }}>件数</th>
              <th style={{ padding: "8px 12px", width: 140 }}>最終リクエスト</th>
            </tr>
          </thead>
          <tbody>
            {grouped.map((g) => (
              <tr key={g.songName} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "10px 12px", fontWeight: 600 }}>{g.songName}</td>
                <td style={{ padding: "10px 12px", textAlign: "right" }}>
                  {g._count.songName}
                </td>
                <td style={{ padding: "10px 12px", color: "var(--text-body)" }}>
                  {fmt(g._max.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
