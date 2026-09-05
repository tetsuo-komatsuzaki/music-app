/**
 * verify_personal_reco.ts — おすすめエンジンを実ユーザー全員で回して結果を検査する (ノート属性ストア版)。
 *
 * 見るのは3点。
 *   ① タブごとに束 (課題) が立つか
 *   ② その束に教材が付くか
 *   ③ 付いた教材に、その束が本当に出てくるか (並びを数え直して回数>0)
 * ③ が0ならエンジンは嘘の教材を出している。必ず落とす。
 *
 * 実行: npx tsx scripts/verify_personal_reco.ts
 */
import "dotenv/config"
import { prisma } from "../app/_libs/prisma"
import { buildPersonalReco, MIN_TARGET, TAB_CATEGORIES } from "../app/_libs/personalReco"
import { prismaSource, aggregate, pickWeakest, type TabKey } from "../app/_libs/noteStore"
import { RECO_TAB_LABELS } from "../app/_libs/personalRecoTypes"

async function main() {
  const t0 = performance.now()
  const users = await prisma.$queryRaw<{ userId: string; n: number }[]>`
    SELECT p."userId", count(*)::int AS n
    FROM "PerformanceNote" pn JOIN "Performance" p ON p.id = pn."performanceId"
    WHERE pn."performanceKind" = 'score'
    GROUP BY p."userId" ORDER BY n DESC`
  console.log(`明細を持つユーザー ${users.length}人 ・ 足切り ${MIN_TARGET}音\n`)
  let bad = 0, filled = 0, slots = 0
  const times: number[] = []

  for (const u of users) {
    const s = performance.now()
    const reco = await buildPersonalReco(u.userId)
    times.push(performance.now() - s)
    const star = (await prisma.userStarProgress.findUnique({ where: { userId: u.userId }, select: { currentStar: true } }))?.currentStar
    console.log(`--- ${u.userId.slice(0, 8)} ・ 明細${u.n}行 ・ ★${star ?? "なし"} ・ ${Math.round(times[times.length - 1])}ms ---`)
    if (!reco) { console.log("   枠ごと非表示\n"); continue }
    // 検査用に束の中身を取り直す
    const rows = await prismaSource.fetchDetail({ userId: u.userId })
    for (const t of reco.tabs) {
      slots++
      const label = RECO_TAB_LABELS[t.key]
      const pick = pickWeakest(aggregate(t.key as TabKey, rows), MIN_TARGET)
      if (!t.focus) { console.log(`   ${label.padEnd(8)} ${pick.status}`); continue }
      if (t.materials.length === 0) {
        console.log(`   ${label.padEnd(8)} ${t.focus.name} 成功率${t.focus.successPct}%  → 教材なし${t.basics ? " ・基礎の案内" : ""}`)
        continue
      }
      const m = t.materials[0]
      const hit = await prismaSource.findMaterial(pick.weakest!.key, 99, TAB_CATEGORIES[t.key])
      const again = await prisma.$queryRaw<{ c: number }[]>`
        SELECT count(*)::int AS c FROM "ScoreNote" sn
        JOIN "NoteProfile" cur ON cur.id = sn."profileId"
        LEFT JOIN "NoteProfile" prev ON prev.id = sn."prevProfileId"
        WHERE sn."targetType" = 'practice' AND sn."targetId" = ${m.id}`
      const total = again[0]?.c ?? 0
      const ok = (hit?.itemId === m.id ? hit.count : 0) > 0 || true
      // 束がその教材に本当にあるか: findMaterial を★無制限で引き直し、同じ教材が候補にあれば回数を得る
      const cnt = hit && hit.itemId === m.id ? hit.count : null
      if (cnt === null || cnt <= 0) bad++
      else filled++
      console.log(`   ${label.padEnd(8)} ${t.focus.name} 成功率${t.focus.successPct}%  → ★${m.star} [${m.category}] ${m.title.slice(0, 26)}  出現${cnt ?? "?"}回/全${total}音${cnt === null ? "  ← 束がこの教材に無い" : ""}${t.basics ? " ・基礎の案内" : ""}`)
      void ok
    }
    console.log()
  }
  times.sort((a, b) => a - b)
  console.log(`枠 ${slots}個中 教材つき ${filled}個 ・ 嘘の教材 ${bad}個`)
  console.log(`ホームの組み立て時間 中央値 ${Math.round(times[Math.floor(times.length / 2)] ?? 0)}ms ・ 最大 ${Math.round(times[times.length - 1] ?? 0)}ms ・ 全体 ${Math.round(performance.now() - t0)}ms`)
  await prisma.$disconnect()
  if (bad > 0) { console.log("\n判定: 失敗"); process.exit(1) }
  console.log("判定: 合格 ・ 出した教材はすべてその束を含む")
}
main().catch((e) => { console.error(e); process.exit(1) })
