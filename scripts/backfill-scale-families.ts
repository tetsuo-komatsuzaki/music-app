import "dotenv/config"
import { prisma } from "../app/_libs/prisma"

// Phase D 族束ね (2026-07-18 Tetsuo承認): scale/arpeggio の調違いを1つの「族」グループに束ねる。
// 族キー = title の先頭「〜長調/〜短調」を除去 → 全角数字を半角化 → trim (空なら「基本」)。
// 同族内の keyTonic 違い = 調の変種。同一調の重複は両方残し flag 報告 (論点2=②)。
// 冪等: 既に族へ束ねられていれば再編は最小限。practiceItem は破壊しない (groupId 付替のみ)。
const CAT_LABEL: Record<string, string> = { scale: "音階", arpeggio: "アルペジオ" }

function familyKey(title: string): string {
  const z2h: Record<string, string> = { "０":"0","１":"1","２":"2","３":"3","４":"4","５":"5","６":"6","７":"7","８":"8","９":"9" }
  const stripped = title.replace(/^[^_＿]*?[長短]調[_＿]?/, "").replace(/[０-９]/g, (c) => z2h[c] ?? c).trim()
  return stripped || "基本"
}

async function main() {
  const dupWarnings: string[] = []
  for (const cat of ["scale", "arpeggio"]) {
    const items = await prisma.practiceItem.findMany({
      where: { category: cat as never },
      select: { id: true, title: true, keyTonic: true, groupId: true, coverImagePath: true, sortOrder: true },
      orderBy: { sortOrder: "asc" },
    })
    // 族ごとに集約
    const fam = new Map<string, typeof items>()
    for (const it of items) {
      const k = familyKey(it.title)
      if (!fam.has(k)) fam.set(k, [])
      fam.get(k)!.push(it)
    }

    let merged = 0
    const emptiedGroupIds: string[] = []
    for (const [key, members] of fam) {
      // 同一調の重複を報告
      const keys = members.map((m) => m.keyTonic)
      const dup = keys.filter((k, i) => keys.indexOf(k) !== i)
      if (dup.length) dupWarnings.push(`${cat}/${key}: 調重複 ${[...new Set(dup)].join(",")}`)

      if (members.length < 2) continue // 1件族は 1:1 のまま

      // canonical = 先頭メンバーの既存グループを流用し、族グループへ昇格
      const canonical = members[0]
      const familyTitle = `${CAT_LABEL[cat]} ${key}`
      if (canonical.groupId) {
        await prisma.materialGroup.update({
          where: { id: canonical.groupId },
          data: { title: familyTitle, coverImagePath: canonical.coverImagePath },
        })
      }
      // 残メンバーを canonical グループへ付替。旧グループは空になるので削除対象へ
      for (const m of members.slice(1)) {
        if (m.groupId && m.groupId !== canonical.groupId) emptiedGroupIds.push(m.groupId)
        await prisma.practiceItem.update({
          where: { id: m.id },
          data: { groupId: canonical.groupId },
        })
      }
      merged++
    }

    // 空グループを削除 (念のため practiceItems/scores が無いことを確認)
    let deleted = 0
    for (const gid of [...new Set(emptiedGroupIds)]) {
      const g = await prisma.materialGroup.findUnique({
        where: { id: gid },
        select: { _count: { select: { scores: true, practiceItems: true } } },
      })
      if (g && g._count.scores === 0 && g._count.practiceItems === 0) {
        await prisma.materialGroup.delete({ where: { id: gid } })
        deleted++
      }
    }
    console.log(`${cat}: ${fam.size} 族 (2件以上=${merged}) / 空グループ削除 ${deleted}`)
  }

  if (dupWarnings.length) {
    console.log(`\n⚠️ 同一調の重複 (管理画面で整理推奨):`)
    dupWarnings.forEach((w) => console.log(`   - ${w}`))
  }

  const total = await prisma.materialGroup.count()
  const byKind = await prisma.materialGroup.groupBy({ by: ["kind"], _count: true })
  console.log(`\nMaterialGroup 総数 ${total}: ${byKind.map((k) => `${k.kind}:${k._count}`).join(" ")}`)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
