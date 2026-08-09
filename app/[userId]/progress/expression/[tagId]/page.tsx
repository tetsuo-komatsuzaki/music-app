// 表現の詳細 (Phase2 D2・2026-08-03)。確定構成: ①子ども語の説明 ②評価の物語+先生コメント全文
// ③この表現に合う曲 ④アルコのひと言。先生あり特典 (無し/データ無しは /progress へ)。
import { redirect } from "next/navigation"
import Link from "next/link"
import { Award, Sprout, Flame } from "lucide-react"
import { getUserIdsFromParams } from "@/app/_libs/getUserIdsFromParams"
import { buildExpressionDetail } from "@/app/_libs/growthKarte"
import { prisma } from "@/app/_libs/prisma"
import { matchSongsForExpr } from "@/app/_libs/exprSongMatch.server"
import { EXPR_AXES } from "@/app/_libs/exprSongFeatures"

export const metadata = { title: "表現マップ" }

const SUB = "#8a9099"
const ACC = "#3555d4"
const GOLD = "#a97b1f"
const GOOD = "#0f8a4f"
const card: React.CSSProperties = { background: "#fff", border: "1px solid #eceff3", borderRadius: 12, padding: "13px 15px", marginBottom: 11 }

export default async function ExpressionDetailPage({ params }: { params: Promise<{ userId: string; tagId: string }> }) {
  const p = await params
  const { authUserId, dbUserId } = await getUserIdsFromParams(p)
  const tagId = decodeURIComponent(p.tagId)
  const d = await buildExpressionDetail(dbUserId, tagId)
  if (!d) redirect(`/${authUserId}/progress`)

  // ③合う曲 (相対順位・上位5%)。ユーザーの★はUserStarProgressから
  const starRow = await prisma.userStarProgress.findUnique({ where: { userId: dbUserId }, select: { currentStar: true } })
  const matches = await matchSongsForExpr(tagId, starRow?.currentStar ?? 1)
  const tag = tagId

  const statusMeta = (s: string) => (s === "strength" ? { Icon: Award, color: GOLD } : s === "improving" ? { Icon: Sprout, color: GOOD } : { Icon: Flame, color: ACC })
  const HeadIcon = statusMeta(d.status).Icon
  const statusText = d.status === "strength" ? "きみのとくい" : d.status === "improving" ? "良くなってきた" : "挑戦中"
  const stepText = (s: string) => (s === "strength" ? "とくいに！" : s === "improving" ? "良くなってきた" : "課題として記録")

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "18px 14px 60px", color: "var(--text-ink)" }}>
      <Link href={`/${authUserId}/progress`} style={{ fontSize: "var(--fs-body)", color: SUB, textDecoration: "none" }}>← 成長カルテ</Link>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, margin: "8px 0 12px" }}>
        <h1 style={{ fontSize: "var(--fs-head)", fontWeight: 900, margin: 0, display: "inline-flex", alignItems: "center", gap: 6 }}><HeadIcon size={18} color={statusMeta(d.status).color} /> {d.label}</h1>
        <span style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: d.status === "strength" ? GOLD : ACC, display: "inline-flex", alignItems: "center", gap: 4 }}><HeadIcon size={11} /> {statusText}</span>
      </div>

      {/* ① 子ども語の説明 */}
      {d.kid && (
        <div style={card}>
          <div style={{ fontSize: "var(--fs-body)", fontWeight: 900, marginBottom: 5 }}>これはなに？</div>
          <div style={{ fontSize: "var(--fs-body)", lineHeight: 1.8 }}>{d.kid}</div>
        </div>
      )}

      {/* ② 評価の物語 (先生コメント全文) */}
      <div style={card}>
        <div style={{ fontSize: "var(--fs-body)", fontWeight: 900, marginBottom: 8 }}>評価のあゆみ</div>
        {d.history.map((h, i) => (
          <div key={i} style={{ borderLeft: `3px solid ${h.status === "strength" ? "#e8d9ae" : h.status === "improving" ? "#cfe6d8" : "#d8dcf0"}`, borderRadius: "0 8px 8px 0", background: "#fafbfc", padding: "7px 11px", marginBottom: i === d.history.length - 1 ? 0 : 7 }}>
            <div style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: h.status === "strength" ? GOLD : h.status === "improving" ? GOOD : ACC }}>
              {(() => { const { Icon } = statusMeta(h.status); return <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Icon size={11} /> {stepText(h.status)}</span> })()} <span style={{ color: "var(--text-muted)", fontWeight: 700 }}>{h.date}</span>
            </div>
            {h.comment && <div style={{ fontSize: "var(--fs-body)", lineHeight: 1.75, marginTop: 3 }}>「{h.comment}」<span style={{ fontSize: "var(--fs-label)", color: SUB }}> — 先生</span></div>}
          </div>
        ))}
      </div>

      {/* ③ この表現に合う曲 (2026-08-04: 相対順位方式=カタログ上位5%のみ。雰囲気の言葉で見せる) */}
      <div style={card}>
        <div style={{ fontSize: "var(--fs-body)", fontWeight: 900, marginBottom: 5 }}>
          {d.status === "strength" ? "この強みが活きる曲" : "この表現に挑戦できる曲"}
        </div>
        {matches === null ? (
          <div style={{ fontSize: "var(--fs-caption)", color: SUB, lineHeight: 1.7 }}>
            この表現の自動おすすめは準備中。いまは先生に「{d.label}{d.status === "strength" ? "が活きる曲" : "の練習になる曲"}」を聞いてみてね。
          </div>
        ) : matches.length === 0 ? (
          <div style={{ fontSize: "var(--fs-caption)", color: SUB, lineHeight: 1.7 }}>
            きみの★の近くには、この表現がとくに濃い曲がまだ無いみたい。先生にも聞いてみてね。
          </div>
        ) : (
          <>
            <div style={{ fontSize: "var(--fs-caption)", color: SUB, marginBottom: 7 }}>{EXPR_AXES[tag]?.mood} を、ぜんぶの曲の中からえらんだよ</div>
            <div style={{ display: "grid", gap: 6 }}>
              {matches.map((m) => (
                <Link key={m.id} href={`/${authUserId}/scores/${m.id}`}
                  style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "inherit", border: "1px solid #f0ead8", background: "#fdfaf2", borderRadius: 10, padding: "7px 10px" }}>
                  <span style={{ fontSize: "var(--fs-body)", fontWeight: 800, flex: 1, minWidth: 0 }}>{m.title}</span>
                  {m.star != null && <span style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: GOLD }}>★{m.star}</span>}
                  <span style={{ fontSize: "var(--fs-caption)", color: ACC, fontWeight: 800 }}>→</span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ④ アルコのひと言 */}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/Icon.png" alt="" aria-hidden width={21} height={21} style={{ flex: "none", borderRadius: 5 }} />
        <span style={{ flex: 1, background: "#eef1fc", borderRadius: 10, borderTopLeftRadius: 3, padding: "8px 11px", fontSize: "var(--fs-caption)", fontWeight: 700, lineHeight: 1.7 }}>
          {d.arcoLine}
        </span>
      </div>
    </div>
  )
}
