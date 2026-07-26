// 本棚(成長記録) /[userId]/records — 達成/マスターした曲の記念カード一覧 (祝い体験 v2.0 §10)。
// フラグOFF時は導線非表示 + 直リンク404。曲のみ表示・group集約(マスター優先)。認可は [userId] レイアウト踏襲。
import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/app/_libs/prisma"

export default async function RecordsPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: userId },
    select: { id: true },
  })
  if (!dbUser) notFound()

  const achievements = await prisma.userScoreAchievement.findMany({
    where: { userId: dbUser.id },
    orderBy: [{ masteredAt: "desc" }, { achievedAt: "desc" }],
    select: {
      scoreId: true,
      achievedAt: true,
      masteredAt: true,
      starAtAchievement: true,
      score: { select: { title: true, coverImagePath: true, groupId: true } },
    },
  })

  // 同一曲(group)は1枚に集約。masteredAt降順で並べているのでマスター版が優先される。
  const seen = new Set<string>()
  const cards = achievements.flatMap((a) => {
    const key = a.score.groupId ?? a.scoreId
    if (seen.has(key)) return []
    seen.add(key)
    const mastered = a.masteredAt != null
    const date = (a.masteredAt ?? a.achievedAt).toLocaleDateString("ja-JP")
    return [{
      scoreId: a.scoreId,
      title: a.score.title,
      cover: a.score.coverImagePath,
      star: a.starAtAchievement,
      mastered,
      date,
      href: `/${userId}/scores/${a.scoreId}`,
    }]
  })

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "18px 16px 60px" }}>
      <h1 style={{ fontSize: 18, fontWeight: 900, margin: "0 0 4px" }}>成長の記録</h1>
      <p style={{ fontSize: 12.5, color: "#6b7885", margin: "0 0 18px" }}>
        これまでに達成・マスターした曲の記念カード。
      </p>

      {cards.length === 0 ? (
        <div style={{ fontSize: 13, color: "#9aa6b3", padding: "24px 0", textAlign: "center" }}>
          まだ記録がありません。曲を達成すると、ここに記念カードが並びます。
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
          {cards.map((c) => (
            <Link
              key={c.scoreId}
              href={c.href}
              style={{ textDecoration: "none", color: "inherit", background: "#fff", border: `1.5px solid ${c.mastered ? "#eecfa0" : "#cbe8d6"}`, borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(30,45,70,.05)" }}
            >
              <div style={{ height: 96, background: c.mastered ? "linear-gradient(135deg,#fdf3df,#f7e3b8)" : "linear-gradient(135deg,#eafaf0,#d3f0df)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34 }}>
                {c.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                ) : (
                  <span aria-hidden>{c.mastered ? "🏆" : "✨"}</span>
                )}
              </div>
              <div style={{ padding: "9px 10px 11px" }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: c.mastered ? "#b5651d" : "#2e8b57" }}>
                  {c.mastered ? "🏆 マスター" : "✨ 達成"}
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: "#2b3742", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.title}
                </div>
                <div style={{ fontSize: 10.5, color: "#b3bcc6", marginTop: 3 }}>
                  {c.star != null ? `☆${c.star} ・ ` : ""}{c.date}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
