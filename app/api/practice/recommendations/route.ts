// app/api/practice/recommendations/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"
import { storageAdmin } from "@/app/_libs/storageAdmin"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

  // --- 楽譜ベースのレコメンド ---
  const scores = await prisma.score.findMany({
    where: { createdById: userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, title: true, keyTonic: true, keyMode: true, defaultTempo: true },
  })

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

    // MusicXMLタグベースのエチュード
    try {
      const analysisPath = `${userId}/${score.id}/analysis.json`
      const { data } = await storageAdmin.storage.from("musicxml").createSignedUrl(analysisPath, 30)
      if (data?.signedUrl) {
        const res = await fetch(data.signedUrl)
        if (res.ok) {
          const analysis = await res.json()
          const xmlTags = extractXmlTags(analysis)
          if (xmlTags.length > 0) {
            const etudeItems = await prisma.practiceItem.findMany({
              where: {
                category: "etude", isPublished: true, OR: [{ ownerUserId: null }, { ownerUserId: userId }],
                techniques: { some: { techniqueTag: { xmlTags: { hasSome: xmlTags }, implementStatus: "実装" } } },
              },
              take: 3,
              select: { id: true, title: true, category: true },
            })
            if (etudeItems.length > 0) {
              scoreRecommendations.push({
                scoreTitle: score.title,
                reason: `「${score.title}」の演奏記号に基づくエチュード`,
                items: etudeItems,
              })
            }
          }
        }
      }
    } catch (_e) { /* analysis.json が取得できなくても無視 */ }
  }

  // --- 弱点ベースのレコメンド ---
  const weaknesses = await prisma.userWeakness.findMany({
    where: { userId },
    orderBy: { severity: "desc" },
    take: 5,
    include: { techniqueTag: true },
  })

  const weaknessRecommendations = []
  for (const w of weaknesses) {
    let items: any[] = []
    let reason = ""

    switch (w.weaknessType) {
      case "key_area": {
        const [tonic, mode] = w.weaknessKey.split("_")
        items = await prisma.practiceItem.findMany({
          where: { keyTonic: tonic, keyMode: mode, category: { in: ["scale", "arpeggio"] }, isPublished: true, OR: [{ ownerUserId: null }, { ownerUserId: userId }] },
          take: 3, select: { id: true, title: true, category: true },
        })
        const modeName = mode === "major" ? "長調" : "短調"
        reason = `${tonic}${modeName}でピッチが不安定です（エラー率${Math.round(w.severity * 100)}%）`
        break
      }
      case "pitch_range": {
        const rangeLabel: Record<string, string> = { low: "低音域", mid: "中音域", high: "高音域", very_high: "超高音域" }
        items = await prisma.practiceItem.findMany({
          where: { category: { in: ["scale", "etude"] }, isPublished: true, OR: [{ ownerUserId: null }, { ownerUserId: userId }], positions: { hasSome: ["3rd", "5th", "7th"] } },
          take: 3, select: { id: true, title: true, category: true },
        })
        reason = `${rangeLabel[w.weaknessKey] || w.weaknessKey}でピッチが不安定です`
        break
      }
      case "timing": {
        items = await prisma.practiceItem.findMany({
          where: { category: "etude", isPublished: true, OR: [{ ownerUserId: null }, { ownerUserId: userId }], techniques: { some: { techniqueTag: { name: { in: ["デタシェ", "マルテレ", "スタッカート"] } } } } },
          take: 3, select: { id: true, title: true, category: true },
        })
        reason = `タイミングの精度に課題があります（エラー率${Math.round(w.severity * 100)}%）`
        break
      }
      case "technique": {
        if (w.techniqueTagId) {
          items = await prisma.practiceItem.findMany({
            where: { isPublished: true, OR: [{ ownerUserId: null }, { ownerUserId: userId }], techniques: { some: { techniqueTagId: w.techniqueTagId } } },
            take: 3, select: { id: true, title: true, category: true },
          })
          reason = `${w.techniqueTag?.name || "特定の技法"}が苦手です（エラー率${Math.round(w.severity * 100)}%）`
        }
        break
      }
    }
    if (items.length > 0) weaknessRecommendations.push({ reason, items })
  }

  return NextResponse.json({ scoreRecommendations, weaknessRecommendations })
}

function extractXmlTags(analysis: any): string[] {
  const tags = new Set<string>()
  for (const note of analysis.notes || []) {
    if (note.articulations) {
      for (const art of note.articulations) tags.add(`<${art}>`)
    }
    if (note.is_tremolo) tags.add("<tremolo>")
    if (note.is_trill) tags.add("<trill-mark>")
    if (note.is_tied) tags.add("<tie>")
    if (note.is_chord) tags.add("multiple notes")
  }
  return Array.from(tags)
}
