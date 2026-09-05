/**
 * check_note_store_orphans.ts — ノート属性ストアの残骸を数える門番 (F13)。
 *
 * ScoreNote / PerformanceNote / MaterialBundleCount は本体と外部キーで結ばれていないので、
 * 本体を消した側が後始末を忘れると残骸が残る。読み手には出ないが、増え続けないよう定期的に数える。
 *
 *   npx tsx scripts/check_note_store_orphans.ts          … 数えるだけ (残骸があれば exit 1)
 *   npx tsx scripts/check_note_store_orphans.ts --apply  … 残骸を消す
 */
import "dotenv/config"
import { prisma } from "../app/_libs/prisma"

async function main() {
  const apply = process.argv.includes("--apply")
  const q = async (label: string, countSql: ReturnType<typeof prisma.$queryRaw>, deleteSql: () => Promise<number>) => {
    const n = Number(((await countSql) as { n: number }[])[0].n)
    let deleted = 0
    if (n > 0 && apply) deleted = await deleteSql()
    console.log(`${label}: 残骸 ${n}${apply ? ` → 削除 ${deleted}` : ""}`)
    return n
  }
  let total = 0
  total += await q("ScoreNote (曲が無い)",
    prisma.$queryRaw`SELECT count(*)::int AS n FROM "ScoreNote" sn WHERE sn."targetType" = 'score' AND NOT EXISTS (SELECT 1 FROM "Score" s WHERE s.id = sn."targetId")`,
    () => prisma.$executeRaw`DELETE FROM "ScoreNote" sn WHERE sn."targetType" = 'score' AND NOT EXISTS (SELECT 1 FROM "Score" s WHERE s.id = sn."targetId")`)
  total += await q("ScoreNote (教材が無い)",
    prisma.$queryRaw`SELECT count(*)::int AS n FROM "ScoreNote" sn WHERE sn."targetType" = 'practice' AND NOT EXISTS (SELECT 1 FROM "PracticeItem" p WHERE p.id = sn."targetId")`,
    () => prisma.$executeRaw`DELETE FROM "ScoreNote" sn WHERE sn."targetType" = 'practice' AND NOT EXISTS (SELECT 1 FROM "PracticeItem" p WHERE p.id = sn."targetId")`)
  total += await q("PerformanceNote (曲の演奏が無い)",
    prisma.$queryRaw`SELECT count(*)::int AS n FROM "PerformanceNote" pn WHERE pn."performanceKind" = 'score' AND NOT EXISTS (SELECT 1 FROM "Performance" p WHERE p.id = pn."performanceId")`,
    () => prisma.$executeRaw`DELETE FROM "PerformanceNote" pn WHERE pn."performanceKind" = 'score' AND NOT EXISTS (SELECT 1 FROM "Performance" p WHERE p.id = pn."performanceId")`)
  total += await q("PerformanceNote (教材の演奏が無い)",
    prisma.$queryRaw`SELECT count(*)::int AS n FROM "PerformanceNote" pn WHERE pn."performanceKind" = 'practice' AND NOT EXISTS (SELECT 1 FROM "PracticePerformance" p WHERE p.id = pn."performanceId")`,
    () => prisma.$executeRaw`DELETE FROM "PerformanceNote" pn WHERE pn."performanceKind" = 'practice' AND NOT EXISTS (SELECT 1 FROM "PracticePerformance" p WHERE p.id = pn."performanceId")`)
  total += await q("MaterialBundleCount (教材が無い)",
    prisma.$queryRaw`SELECT count(*)::int AS n FROM "MaterialBundleCount" mb WHERE NOT EXISTS (SELECT 1 FROM "PracticeItem" p WHERE p.id = mb."targetId")`,
    () => prisma.$executeRaw`DELETE FROM "MaterialBundleCount" mb WHERE NOT EXISTS (SELECT 1 FROM "PracticeItem" p WHERE p.id = mb."targetId")`)
  // NoteProfile は共有の「かたち」辞書。再解析で参照が外れた行は残骸だが害はなく、解析と同時に消すと
  // 挿入直後の参照を壊しうるので、判定には入れず参考値として数える (--apply では消す。解析が走っていない時に)
  const unreferenced = await q("NoteProfile (どの並びからも参照されない・参考)",
    prisma.$queryRaw`SELECT count(*)::int AS n FROM "NoteProfile" np WHERE NOT EXISTS (SELECT 1 FROM "ScoreNote" sn WHERE sn."profileId" = np.id OR sn."prevProfileId" = np.id)`,
    () => prisma.$executeRaw`DELETE FROM "NoteProfile" np WHERE NOT EXISTS (SELECT 1 FROM "ScoreNote" sn WHERE sn."profileId" = np.id OR sn."prevProfileId" = np.id)`)
  void unreferenced
  await prisma.$disconnect()
  if (total > 0 && !apply) { console.log("判定: 残骸あり (--apply で削除)"); process.exit(1) }
  console.log(apply ? "判定: 掃除済" : "判定: 残骸なし")
}
main().catch((e) => { console.error(e); process.exit(1) })
