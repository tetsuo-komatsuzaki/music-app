// 癖ループの鎖の実測検証 (2026-08-02):
//   所見記録 → 生徒カルテ(癖マップ/技術マップ!/あゆみ) → 🌿経過 → 🌱克服 → 各表示の状態遷移
// を本番DBに実データを流して assert する。対象=リンク済みテスト生徒(テスト1)。
// createObservation / recordObservationProgress と同一のDB書き込みを再現し、
// 表示側は本物の buildKarteData / bodyMap / teacher latestPerTag ロジックで検証する。
// ※ データは残す (実機確認でそのまま見えるように)。掃除は --cleanup で。
import { config } from "dotenv"
config()

let pass = 0, fail = 0
function chk(name: string, ok: boolean, detail?: string) {
  console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`)
  if (ok) pass++; else fail++
}

async function main() {
  const { PrismaPg } = await import("@prisma/adapter-pg")
  const { PrismaClient } = await import("../app/generated/prisma/client.js")
  const { buildKarteData } = await import("../app/_libs/growthKarte")
  const { SPOT_BY_TAG } = await import("../app/_libs/bodyMap")
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })

  const STUDENT = "cmrzmcrpy000004lbhwfodj6w" // テスト1
  const link = await prisma.teacherStudent.findFirst({ where: { studentId: STUDENT }, select: { teacherId: true } })
  if (!link) throw new Error("テスト1に先生リンクが無い")
  const TEACHER = link.teacherId
  const student = await prisma.user.findUnique({ where: { id: STUDENT }, select: { supabaseUserId: true } })
  if (!student) throw new Error("no student")

  if (process.argv.includes("--cleanup")) {
    const del = await prisma.teacherObservation.deleteMany({ where: { studentId: STUDENT, comment: { startsWith: "[E2E]" } } })
    const del2 = await prisma.teacherObservation.deleteMany({ where: { studentId: STUDENT, tagIds: { hasSome: ["left_shift_tense", "left_wrist_collapse", "rhythm_rush"] } } })
    console.log("cleanup:", del.count + del2.count, "rows")
    await prisma.$disconnect(); return
  }

  // ── Step A: 所見記録 (createObservation と同一の書き込み) ──
  await prisma.teacherObservation.create({
    data: { teacherId: TEACHER, studentId: STUDENT, tagIds: ["left_shift_tense", "left_wrist_collapse", "rhythm_rush"], severity: "focus", comment: "[E2E] 鎖の検証" },
  })
  let k = await buildKarteData(STUDENT, student.supabaseUserId, "30d")
  chk("A1 bodyObs が null でない (先生あり)", k.bodyObs !== null)
  const b = (id: string) => k.bodyObs!.find((t) => t.tagId === id)
  chk("A2 癖マップ: left_shift_tense が載る", !!b("left_shift_tense"), JSON.stringify(b("left_shift_tense")))
  chk("A3 癖マップ: left_wrist_collapse → 左手(左側)ビューの手首", SPOT_BY_TAG["left_wrist_collapse"]?.view === "left_in" && SPOT_BY_TAG["left_wrist_collapse"]?.id === "left_wrist")
  chk("A4 癖マップ: rhythm_rush は体の外 (部位なし)", !SPOT_BY_TAG["rhythm_rush"])
  const posNode = k.skillMap?.nodes.find((n) => n.id === "position")
  chk("A5 技術マップ: ポジション移動に「!」(obsTags)", (posNode?.obsTags.length ?? 0) > 0, JSON.stringify(posNode?.obsTags))
  chk("A6 あゆみ: 所見【要重点】イベント", k.events.some((e) => e.kind === "observation" && e.text.includes("要重点")), k.events.find((e) => e.kind === "observation")?.text)

  // ── Step B: 🌿 経過 (recordObservationProgress improving と同一) ──
  await new Promise((r) => setTimeout(r, 1100)) // createdAt の順序を確実に
  await prisma.teacherObservation.create({
    data: { teacherId: TEACHER, studentId: STUDENT, tagIds: ["left_shift_tense"], severity: "improving", comment: null },
  })
  k = await buildKarteData(STUDENT, student.supabaseUserId, "30d")
  chk("B1 癖マップ: left_shift_tense の最新が improving", b("left_shift_tense")?.severity === "improving")
  chk("B2 あゆみ: 🌿 イベント", k.events.some((e) => e.text.includes("🌿")))
  chk("B3 技術マップ: 「!」はまだ残る (improvingはアクティブ)", (k.skillMap?.nodes.find((n) => n.id === "position")?.obsTags.length ?? 0) > 0)

  // ── Step C: 🌱 克服 (resolved) ──
  await new Promise((r) => setTimeout(r, 1100))
  await prisma.teacherObservation.create({
    data: { teacherId: TEACHER, studentId: STUDENT, tagIds: ["left_shift_tense"], severity: "resolved", comment: null },
  })
  k = await buildKarteData(STUDENT, student.supabaseUserId, "30d")
  chk("C1 癖マップ: left_shift_tense の最新が resolved", b("left_shift_tense")?.severity === "resolved")
  chk("C2 技術マップ: ポジション移動の「!」が消える", (k.skillMap?.nodes.find((n) => n.id === "position")?.obsTags.length ?? 0) === 0,
    JSON.stringify(k.skillMap?.nodes.find((n) => n.id === "position")?.obsTags))
  chk("C3 あゆみ: 🌱 克服イベント", k.events.some((e) => e.text.includes("🌱 癖を克服")), k.events.find((e) => e.text.includes("🌱"))?.text)
  chk("C4 癖マップ: 他タグ(left_wrist_collapse)はアクティブのまま", b("left_wrist_collapse")?.severity === "focus")

  // ── 先生側: page.tsx と同じ取得(40件desc) + latestPerTag 相当 ──
  const rows = await prisma.teacherObservation.findMany({
    where: { teacherId: TEACHER, studentId: STUDENT }, orderBy: { createdAt: "desc" }, take: 40,
    select: { tagIds: true, severity: true },
  })
  const latest = new Map<string, string | null>()
  for (const o of rows) for (const t of o.tagIds) if (!latest.has(t)) latest.set(t, o.severity)
  chk("T1 先生カルテ: latestPerTag で left_shift_tense=resolved", latest.get("left_shift_tense") === "resolved")
  chk("T2 先生カルテ: BodyObsMap分離 = activeに克服タグが出ない",
    ![...latest.entries()].filter(([, s]) => s !== "resolved").some(([t]) => t === "left_shift_tense"))
  // ホームの新着チップ条件 (直近7日)
  const recentCnt = await prisma.teacherObservation.count({
    where: { studentId: STUDENT, teacherId: TEACHER, createdAt: { gte: new Date(Date.now() - 7 * 864e5) } },
  })
  chk("H1 ホーム「📋新しい所見」チップ条件 (7日以内>0)", recentCnt > 0, `count=${recentCnt}`)

  // ── 曲に戻る (?from=) の受け側条件 ──
  const anyShared = await prisma.score.findFirst({ where: { deletedAt: null, isShared: true }, select: { id: true }, orderBy: { createdAt: "desc" } })
  if (anyShared) {
    chk("F1 from の cuid 正規表現に実IDが一致", /^c[a-z0-9]{20,32}$/.test(anyShared.id), anyShared.id)
    const dbUserId = STUDENT
    const s = await prisma.score.findFirst({
      where: { id: anyShared.id, deletedAt: null, OR: [{ createdById: dbUserId }, { isShared: true }] },
      select: { id: true, title: true },
    })
    chk("F2 共有曲は from 解決される (バナー表示)", !!s, s?.title)
  } else {
    chk("F1/F2 共有曲が存在しない", false, "isShared=true の曲が0件")
  }
  const other = await prisma.score.findFirst({ where: { deletedAt: null, isShared: false, createdById: { not: STUDENT } }, select: { id: true } })
  if (other) {
    const s = await prisma.score.findFirst({
      where: { id: other.id, deletedAt: null, OR: [{ createdById: STUDENT }, { isShared: true }] },
      select: { id: true },
    })
    chk("F3 他人の非共有曲は from を無視 (安全)", s === null)
  }

  console.log(`\n==== ${fail === 0 ? "ALL PASS" : "FAIL x" + fail} (${pass} pass) ====`)
  console.log("※ 検証データ(テスト1への所見3行)は実機確認用に残置。消す場合: npx tsx scripts/_tmp_kuse_chain_check.ts --cleanup")
  await prisma.$disconnect()
  if (fail > 0) process.exit(1)
}
main().catch((e) => { console.error(e); process.exit(1) })
