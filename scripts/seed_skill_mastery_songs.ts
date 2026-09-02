// わざマスターの課題曲を自動選定して投入する (2026-09-02)。
//
// 選定方法は [[project_skill_mastery_criteria]] の記録どおり:
//   1. 候補 = その★の曲 (Score・公開) のうち、対象わざの技術タグが付いているもの
//   2. 密度で順位付け = 対象わざの音符が多く、出現率が高い曲を第1候補
//   3. 1わざ×1★につき1曲
//   4. その★に候補が無ければ認定曲なし (在庫の穴。教材が入ったら埋める)
//
// 密度は譜面解析 (musicxml_skill_info.json の articulation) から数える。
// 取れない曲は技術タグの有無だけで候補に残し、音符総数の多い方を優先する。
//
// 使い方: npx tsx scripts/seed_skill_mastery_songs.ts [--apply]
//   --apply を付けないと何も書き込まず、選定結果だけ出す。
import "dotenv/config"
import { prisma } from "../app/_libs/prisma"
import { storageAdmin } from "../app/_libs/storageAdmin"

const APPLY = process.argv.includes("--apply")

// わざID → 譜面側でその音を数えるための手がかり。
//   tags = 候補にする技術タグ (ScoreTechniqueTag)
//   marks = analysis.json の articulations に出る music21 のクラス名
//   flag  = musicxml_skill_info.json の音符フラグ (記号ではなく構造で数えるもの)
const SKILLS: { id: string; tags: string[]; marks?: string[]; flag?: "slur" | "chord" | "shift" }[] = [
  { id: "slur", tags: ["スラー"], flag: "slur" },
  { id: "staccato", tags: ["スタッカート", "連続スタッカート"], marks: ["Staccato"] },
  { id: "portato", tags: ["ポルタート"], marks: ["DetachedLegato"] },
  { id: "bow_staccato", tags: ["弓スタッカート"], marks: ["Staccatissimo"] },
  { id: "tremolo", tags: ["トレモロ"], marks: ["Tremolo"] },
  { id: "pizzicato", tags: ["ピチカート"], marks: ["Pizzicato"] },
  { id: "spiccato", tags: ["スピッカート"], marks: ["Spiccato"] },
  { id: "ricochet", tags: ["リコシェ"], marks: ["Ricochet"] },
  { id: "position", tags: ["2ndポジション", "3rdポジション", "4thポジション", "5thポジション", "6thポジション", "7thポジション"], flag: "shift" },
  { id: "double", tags: ["3度", "6度", "オクターブ", "10度", "連続重音"], flag: "chord" },
  { id: "trill", tags: ["トリル"], marks: ["Trill"] },
  { id: "mordent", tags: ["プラルトリラーとモルデント", "モルデント"], marks: ["Mordent", "InvertedMordent"] },
  { id: "vibrato", tags: ["ビブラート"], marks: [] },
  { id: "glissando", tags: ["グリッサンド"], marks: ["Glissando"] },
  { id: "harmonic", tags: ["ナチュラル・ハーモニクス", "ハーモニクス"], marks: ["Harmonic"] },
]
const STARS = [1, 2, 3, 4, 5]

type Density = { hit: number; total: number }

/** analysis.json の articulations (music21のクラス名) で数える */
async function markDensity(ownerId: string, scoreId: string, marks: string[]): Promise<Density | null> {
  if (!marks.length) return null
  try {
    const r = await storageAdmin.storage.from("musicxml").download(`${ownerId}/${scoreId}/analysis.json`)
    if (!r.data) return null
    const j = JSON.parse(await r.data.text()) as { notes?: { articulations?: string[] | null; type?: string }[] }
    const notes = (j.notes ?? []).filter((n) => n.type !== "rest")
    if (!notes.length) return null
    const want = new Set(marks)
    let hit = 0
    for (const n of notes) if ((n.articulations ?? []).some((a) => want.has(a))) hit++
    return { hit, total: notes.length }
  } catch { return null }
}

/** skill_info の構造フラグで数える (スラー・重音・ポジション移動) */
async function flagDensity(ownerId: string, scoreId: string, flag: "slur" | "chord" | "shift"): Promise<Density | null> {
  try {
    const r = await storageAdmin.storage.from("musicxml").download(`${ownerId}/${scoreId}/musicxml_skill_info.json`)
    if (!r.data) return null
    const j = JSON.parse(await r.data.text()) as {
      notes?: { is_rest?: boolean; is_in_slur?: boolean; is_chord?: boolean; position_moved?: boolean }[]
    }
    const notes = (j.notes ?? []).filter((n) => !n.is_rest)
    if (!notes.length) return null
    let hit = 0
    for (const n of notes) {
      if (flag === "slur" && n.is_in_slur) hit++
      else if (flag === "chord" && n.is_chord) hit++
      else if (flag === "shift" && n.position_moved) hit++
    }
    return { hit, total: notes.length }
  } catch { return null }
}

async function main() {
  const scores = await prisma.score.findMany({
    where: { isShared: true, deletedAt: null, partId: null, star: { not: null } },
    select: {
      id: true, title: true, star: true, createdById: true,
      scoreTechniqueTags: { select: { techniqueTag: { select: { name: true } } } },
    },
  })
  console.log(`公開曲 ${scores.length}件 (★あり・パートを除く)`)

  const rows: { skillId: string; star: number; scoreId: string; title: string; why: string }[] = []
  const holes: string[] = []

  for (const sk of SKILLS) {
    const want = new Set(sk.tags)
    for (const star of STARS) {
      const cands = scores.filter((s) => s.star === star
        && s.scoreTechniqueTags.some((t) => want.has(t.techniqueTag.name)))
      if (cands.length === 0) { holes.push(`${sk.id} ★${star}`); continue }
      // 密度で順位付け。取れない曲は density=null として後ろに回す
      const scored = await Promise.all(cands.map(async (c) => ({
        c,
        d: sk.flag
          ? await flagDensity(c.createdById, c.id, sk.flag)
          : await markDensity(c.createdById, c.id, sk.marks ?? []),
      })))
      scored.sort((a, b) => {
        const ra = a.d ? a.d.hit / a.d.total : -1
        const rb = b.d ? b.d.hit / b.d.total : -1
        if (rb !== ra) return rb - ra                       // 出現率が高い順
        const ha = a.d?.hit ?? 0, hb = b.d?.hit ?? 0
        if (hb !== ha) return hb - ha                       // 対象わざの音符が多い順
        const ta = a.d?.total ?? 0, tb = b.d?.total ?? 0
        return tb - ta                                       // 音符総数が多い順 (検定材料が多い)
      })
      const win = scored[0]
      const why = win.d
        ? `出現率 ${Math.round((win.d.hit / win.d.total) * 100)}% ・ ${win.d.hit}/${win.d.total}音`
        : `技術タグのみ (譜面解析なし) ・ 候補${cands.length}曲`
      rows.push({ skillId: sk.id, star, scoreId: win.c.id, title: win.c.title, why })
    }
  }

  console.log(`\n=== 選定できた ${rows.length}件 ===`)
  for (const r of rows) console.log(`  ${r.skillId.padEnd(13)} ★${r.star}  ${r.title}   (${r.why})`)
  console.log(`\n=== 候補なし ${holes.length}件 ===`)
  console.log("  " + holes.join(" / "))

  if (!APPLY) { console.log("\n--apply を付けると書き込みます (いまは何もしていません)"); await prisma.$disconnect(); return }

  let up = 0
  for (const r of rows) {
    await prisma.skillMasterySong.upsert({
      where: { skillId_star: { skillId: r.skillId, star: r.star } },
      create: { skillId: r.skillId, star: r.star, scoreId: r.scoreId },
      update: { scoreId: r.scoreId },
    })
    up++
  }
  console.log(`\n投入 ${up}件`)
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
