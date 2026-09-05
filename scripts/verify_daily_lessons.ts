/**
 * verify_daily_lessons.ts — 毎日の基礎練 ②④ (ノート属性ストア版) を実ユーザー×曲で回して検査する。
 *
 * 見るのは3点。
 *   ① 苦手な音の移動 (直近3回) が、旧 noteStats.transitions の合算と同じ順位で出るか
 *   ② ②フィンガリングの理由と ④診断おすすめ が出るか
 *   ③ ④で出した教材に、その束が本当にあるか (写し MaterialBundleCount で回数>0)
 *
 * 実行: npx tsx scripts/verify_daily_lessons.ts
 */
import "dotenv/config"
import { prisma } from "../app/_libs/prisma"
import { selectDailyLessons, bundleName } from "../app/_libs/dailyLessons"
import { prismaSource, aggregate } from "../app/_libs/noteStore"

async function main() {
  // 直近3回の通し演奏を持つ ユーザー×曲
  const pairs = await prisma.$queryRaw<{ userId: string; scoreId: string; n: number }[]>`
    SELECT p."userId", p."scoreId", count(*)::int AS n
    FROM "Performance" p
    WHERE p."rangeFromNote" IS NULL AND p."scoreNoteVersion" IS NOT NULL
    GROUP BY p."userId", p."scoreId" ORDER BY n DESC`
  console.log(`対象 ${pairs.length} ユーザー×曲\n`)
  let same = 0, differ = 0, recOk = 0, recBad = 0, recNone = 0, fingTrans = 0
  const times: number[] = []
  for (const pr of pairs) {
    const score = await prisma.score.findUnique({
      where: { id: pr.scoreId },
      select: { id: true, title: true, star: true, keyTonic: true, keyMode: true, defaultTempo: true, positions: true, primaryPosition: true, primaryBowing: true },
    })
    if (!score) continue
    const userStar = (await prisma.userStarProgress.findUnique({ where: { userId: pr.userId }, select: { currentStar: true } }))?.currentStar ?? 1
    // 旧: noteStats.transitions の合算 (直近3回)
    const perfs = await prisma.performance.findMany({ where: { userId: pr.userId, scoreId: pr.scoreId, rangeFromNote: null }, orderBy: { uploadedAt: "desc" }, take: 3, select: { analysisSummary: true } })
    const agg: Record<string, { target: number; miss: number }> = {}
    for (const p of perfs) {
      const tr = (p.analysisSummary as { noteStats?: { transitions?: Record<string, { target: number; miss: number }> } } | null)?.noteStats?.transitions
      if (!tr) continue
      for (const [k, v] of Object.entries(tr)) { const c = agg[k] ?? { target: 0, miss: 0 }; c.target += v.target; c.miss += v.miss; agg[k] = c }
    }
    const oldTop = Object.entries(agg).filter(([, v]) => v.target >= 2 && v.miss > 0).map(([k, v]) => ({ k: k.replace("-", "b"), r: v.miss / v.target })).sort((a, b) => b.r - a.r || a.k.localeCompare(b.k)).slice(0, 10)
    // 新
    const rows = await prismaSource.fetchDetail({ userId: pr.userId, target: { type: "score", id: pr.scoreId }, lastN: 3, wholeOnly: true })
    const newAgg = aggregate("pitch", rows, "any")
    const newTop = [...newAgg.entries()].filter(([, v]) => v.target >= 2 && v.miss > 0).map(([k, v]) => ({ k: k.replace("pitch|", "").replace("|", ">"), r: v.miss / v.target })).sort((a, b) => b.r - a.r || a.k.localeCompare(b.k)).slice(0, 10)
    const oldKeys = oldTop.map((t) => t.k).join(","), newKeys = newTop.map((t) => t.k).join(",")
    // 旧は「演奏ごとに2回以上出た遷移」しか保存していない (1回ずつ3演奏に出る遷移は落ちる)。
    // なので順位の完全一致ではなく「旧に出た苦手移動は新にも全部ある (包含)」で比べる
    const newAll = new Set([...newAgg.entries()].filter(([, v]) => v.miss > 0).map(([k]) => k.replace("pitch|", "").replace("|", ">")))
    const missing = oldTop.filter((t) => !newAll.has(t.k)).map((t) => t.k)
    const eq = missing.length === 0
    if (eq) same++; else { differ++; console.log(`   ★ 旧にあって新に無い: ${missing.join(",")}`) }
    const s = performance.now()
    const lessons = await selectDailyLessons({ userId: pr.userId, score: { ...score, positions: score.positions as unknown as number[] } as never, userStar, scoreId: pr.scoreId, songMastered: false })
    times.push(performance.now() - s)
    const fing = lessons.find((l) => l.slot === "fingering"), rec = lessons.find((l) => l.slot === "rec")
    if (fing?.reason === "fing_transition") fingTrans++
    let recLine = "④ なし"
    if (rec) {
      const pin = await prisma.scoreRecPin.findUnique({ where: { userId_scoreId: { userId: pr.userId, scoreId: pr.scoreId } } })
      const key = pin?.subtaskId ?? ""
      const cnt = key.includes("|") ? (await prisma.materialBundleCount.findUnique({ where: { targetId_bundleKey: { targetId: rec.itemId, bundleKey: key } } }))?.count ?? 0 : -1
      if (cnt > 0) recOk++; else if (cnt === 0) recBad++
      recLine = `④ ${rec.label} ${rec.reason} ← ${key.includes("|") ? bundleName(key) : key} 出現${cnt < 0 ? "旧ピン" : cnt}回`
    } else recNone++
    console.log(`--- ${pr.userId.slice(0, 8)} × ${score.title.slice(0, 14)} ・ 演奏${pr.n} ・ ${Math.round(times[times.length - 1])}ms`)
    console.log(`   苦手移動 旧[${oldKeys}]`)
    console.log(`            新[${newKeys}] ${eq ? "一致" : "差"}`)
    console.log(`   ② ${fing ? `${fing.reason} ${fing.detail ?? ""}` : "なし"} / ${recLine}`)
  }
  times.sort((a, b) => a - b)
  console.log(`\n苦手移動 旧⊆新 ${same} ・ 旧にあって新に無い ${differ} / ④ 束あり ${recOk} ・ 束なし(嘘) ${recBad} ・ なし ${recNone} / ②が苦手移動で決まった ${fingTrans}`)
  console.log(`基礎練の組み立て 中央値 ${Math.round(times[Math.floor(times.length / 2)] ?? 0)}ms ・ 最大 ${Math.round(times[times.length - 1] ?? 0)}ms`)
  await prisma.$disconnect()
  if (recBad > 0) { console.log("判定: 失敗 ・ 束の無い教材を出した"); process.exit(1) }
  console.log("判定: 合格")
}
main().catch((e) => { console.error(e); process.exit(1) })
