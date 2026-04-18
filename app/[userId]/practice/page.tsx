import { prisma } from "@/app/_libs/prisma"
import PracticeTop from "./practiceTop"

export default async function PracticePage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params

  // カテゴリごとの件数（運営サンプル + 自分のアイテムのみ）
  const ownerFilter = { OR: [{ ownerUserId: null }, { ownerUserId: userId }] }
  const [scaleCount, arpeggioCount, etudeCount] = await Promise.all([
    prisma.practiceItem.count({ where: { category: "scale", isPublished: true, ...ownerFilter } }),
    prisma.practiceItem.count({ where: { category: "arpeggio", isPublished: true, ...ownerFilter } }),
    prisma.practiceItem.count({ where: { category: "etude", isPublished: true, ...ownerFilter } }),
  ])

  // ユーザーの楽曲（レコメンド用）
  const scores = await prisma.score.findMany({
    where: { createdById: userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, title: true, keyTonic: true, keyMode: true, defaultTempo: true },
  })

  // 楽譜ベースレコメンド
  const scoreRecommendations = []
  for (const score of scores) {
    if (!score.keyTonic) continue
    const items = await prisma.practiceItem.findMany({
      where: {
        keyTonic: score.keyTonic,
        keyMode: score.keyMode ?? "major",
        category: { in: ["scale", "arpeggio"] },
        isPublished: true,
        OR: [{ ownerUserId: null }, { ownerUserId: userId }],
      },
      take: 3,
      orderBy: { title: "asc" },
      select: { id: true, title: true, category: true },
    })
    if (items.length > 0) {
      const modeName = score.keyMode === "minor" ? "短調" : "長調"
      scoreRecommendations.push({
        scoreTitle: score.title,
        reason: `「${score.title}」は${score.keyTonic}${modeName}`,
        items,
      })
    }
  }

  // 弱点ベースレコメンド
  const weaknesses = await prisma.userWeakness.findMany({
    where: { userId },
    orderBy: { severity: "desc" },
    take: 3,
    include: { techniqueTag: true },
  })

  const weaknessRecommendations = []
  for (const w of weaknesses) {
    let items: any[] = []
    let reason = ""

    if (w.weaknessType === "key_area") {
      const [tonic, mode] = w.weaknessKey.split("_")
      items = await prisma.practiceItem.findMany({
        where: { keyTonic: tonic, keyMode: mode, category: { in: ["scale", "arpeggio"] }, isPublished: true, OR: [{ ownerUserId: null }, { ownerUserId: userId }] },
        take: 3, select: { id: true, title: true, category: true },
      })
      const modeName = mode === "major" ? "長調" : "短調"
      reason = `${tonic}${modeName}でピッチが不安定です（エラー率${Math.round(w.severity * 100)}%）`
    } else if (w.weaknessType === "timing") {
      items = await prisma.practiceItem.findMany({
        where: {
          category: "etude", isPublished: true,
          OR: [{ ownerUserId: null }, { ownerUserId: userId }],
          techniques: { some: { techniqueTag: { name: { in: ["デタシェ", "マルテレ", "スタッカート"] } } } },
        },
        take: 3, select: { id: true, title: true, category: true },
      })
      reason = `タイミングの精度に課題があります（エラー率${Math.round(w.severity * 100)}%）`
    } else if (w.weaknessType === "pitch_range") {
      const rangeLabel: Record<string, string> = { low: "低音域", mid: "中音域", high: "高音域", very_high: "超高音域" }
      items = await prisma.practiceItem.findMany({
        where: {
          category: { in: ["scale", "etude"] }, isPublished: true,
          OR: [{ ownerUserId: null }, { ownerUserId: userId }],
          positions: { hasSome: ["3rd", "5th", "7th"] },
        },
        take: 3, select: { id: true, title: true, category: true },
      })
      reason = `${rangeLabel[w.weaknessKey] || w.weaknessKey}でピッチが不安定です`
    } else if (w.weaknessType === "technique" && w.techniqueTag) {
      items = await prisma.practiceItem.findMany({
        where: {
          isPublished: true,
          OR: [{ ownerUserId: null }, { ownerUserId: userId }],
          techniques: { some: { techniqueTagId: w.techniqueTagId! } },
        },
        take: 3, select: { id: true, title: true, category: true },
      })
      reason = `${w.techniqueTag.name}が苦手です（エラー率${Math.round(w.severity * 100)}%）`
    }

    if (items.length > 0) {
      weaknessRecommendations.push({ reason, items })
    }
  }

  return (
    <PracticeTop
      userId={userId}
      categoryCounts={{ scale: scaleCount, arpeggio: arpeggioCount, etude: etudeCount }}
      scoreRecommendations={scoreRecommendations}
      weaknessRecommendations={weaknessRecommendations}
    />
  )
}
