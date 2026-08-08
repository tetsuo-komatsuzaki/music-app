// テストデータ生成 (2026-08-08 テストケースv1.1 実行用)
//
//   npx tsx scripts/seed_test_users.ts create   … テストユーザー11人を作成/再構築 (冪等)
//   npx tsx scripts/seed_test_users.ts cleanup  … テストユーザーと関連データを全削除
//   npx tsx scripts/seed_test_users.ts list     … 作成済みテストユーザーの一覧
//
// - メールは @example.com (配信不能ドメイン) なので通知メールが実在者に飛ばない
// - パスワードは全員 ArcoTest-1234
// - 再実行すると各ユーザーの演奏系データを消して作り直す (状態が決定的)
// - 課金状態はDB直書き (UI表示テスト用)。Stripe実流のE2Eはテストカードで別途行うこと
//   (このユーザーで「契約を管理」を押すと Stripe 顧客が無いためエラーになるのは想定内)
// - 音声ファイルは作らない (audioPath 空)。再生系のケースは実録音ユーザーで行うこと
import { config } from "dotenv"
config()
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../app/generated/prisma/client.js"
import { createClient } from "@supabase/supabase-js"

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const PASSWORD = "ArcoTest-1234"
const DAY = 24 * 60 * 60 * 1000
const now = () => new Date()

/** JST 月曜 0:00 (plan.ts と同ロジック) */
function jstWeekStart(d: Date): Date {
  const JST = 9 * 3600_000
  const s = new Date(d.getTime() + JST)
  const days = (s.getUTCDay() + 6) % 7
  return new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate()) - days * DAY - JST)
}

type PersonaKey =
  | "zero" | "free3" | "free7" | "young" | "heavy"
  | "student" | "teacher"
  | "plus-trial" | "plus-active" | "pastdue" | "canceled"

const PERSONAS: { key: PersonaKey; name: string; role?: "teacher"; desc: string }[] = [
  { key: "zero", name: "TEST_ゼロ新規", desc: "録音0・オンボ未完 (空状態/オンボの検証)" },
  { key: "free3", name: "TEST_無料週3", desc: "無料・今週3回消費 (カウント表示 3/7)" },
  { key: "free7", name: "TEST_無料週7", desc: "無料・今週7回消費 (上限到達)" },
  { key: "young", name: "TEST_歴10日", desc: "演奏歴10日・20件 (成長1行の半分割窓)" },
  { key: "heavy", name: "TEST_500件", desc: "90日で演奏500件 (性能/集計)" },
  { key: "student", name: "TEST_生徒ゆい", desc: "先生接続・認定3語・宿題4状態・👂・メッセージ・所見" },
  { key: "teacher", name: "TEST_先生ゆか", role: "teacher", desc: "上記生徒を担当する先生" },
  { key: "plus-trial", name: "TEST_トライアル中", desc: "plan=plus/trialing (期限14日後)" },
  { key: "plus-active", name: "TEST_加入中", desc: "plan=plus/active (更新30日後)" },
  { key: "pastdue", name: "TEST_支払失敗", desc: "plan=plus/past_due" },
  { key: "canceled", name: "TEST_解約済", desc: "planStatus=canceled+旧sub有 (再加入トライアルなし検証)" },
]
const email = (k: PersonaKey) => `test-arco-${k}@example.com`

/** Supabase auth ユーザーを取得または作成して id を返す */
async function ensureAuthUser(mail: string): Promise<string> {
  const created = await supabase.auth.admin.createUser({ email: mail, password: PASSWORD, email_confirm: true })
  if (created.data.user) return created.data.user.id
  // 既存 → listUsers から探す (テスト規模なので3ページで十分)
  for (let page = 1; page <= 3; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    const hit = data.users.find((u) => u.email === mail)
    if (hit) return hit.id
    if (data.users.length < 1000) break
  }
  throw new Error(`auth user not found/creatable: ${mail} (${created.error?.message})`)
}

/** ユーザーの演奏・先生系データを全消去 (再シードの決定性) */
async function wipeUserData(userId: string) {
  await prisma.$transaction([
    prisma.listenRequest.deleteMany({ where: { OR: [{ studentId: userId }, { teacherId: userId }] } }),
    prisma.message.deleteMany({ where: { OR: [{ studentId: userId }, { teacherId: userId }] } }),
    prisma.teacherObservation.deleteMany({ where: { OR: [{ studentId: userId }, { teacherId: userId }] } }),
    prisma.userExpressionClear.deleteMany({ where: { OR: [{ userId }, { teacherId: userId }] } }),
    prisma.teacherFeedback.deleteMany({ where: { OR: [{ studentId: userId }, { teacherId: userId }] } }),
    prisma.assignment.deleteMany({ where: { OR: [{ studentId: userId }, { teacherId: userId }] } }),
    prisma.performance.deleteMany({ where: { userId } }),
    prisma.practicePerformance.deleteMany({ where: { userId } }),
  ])
}

/** n 件の Performance を期間 [from, to] に等間隔で生成 (done・点数は緩やかに上達) */
function perfRows(userId: string, scoreIds: string[], n: number, from: Date, to: Date) {
  const span = Math.max(1, to.getTime() - from.getTime())
  return Array.from({ length: n }, (_, i) => {
    const t = new Date(from.getTime() + (n === 1 ? 0 : (span * i) / (n - 1)))
    const base = 62 + (i / Math.max(1, n - 1)) * 25 // 62→87 に上達
    const pitch = Math.min(98, base + (i % 7) - 3)
    const timing = Math.min(98, base - 4 + ((i * 3) % 9) - 4)
    return {
      userId, scoreId: scoreIds[i % scoreIds.length],
      performanceType: "user" as const, performanceStatus: "uploaded" as const,
      name: `#${i + 1}`, audioPath: "", analysisStatus: "done" as const,
      pitchAccuracy: Math.round(pitch * 10) / 10, timingAccuracy: Math.round(timing * 10) / 10,
      overallScore: Math.round(((pitch + timing) / 2) * 10) / 10,
      evaluatedNotes: 40 + (i % 30), performanceDuration: 45 + (i % 60), recordingBpm: 80,
      uploadedAt: t, createdAt: t, performanceDate: t,
    }
  })
}

async function ensureDbUser(key: PersonaKey): Promise<string> {
  const p = PERSONAS.find((x) => x.key === key)!
  const authId = await ensureAuthUser(email(key))
  const u = await prisma.user.upsert({
    where: { supabaseUserId: authId },
    update: { name: p.name, role: p.role ?? "student" },
    create: { supabaseUserId: authId, name: p.name, role: p.role ?? "student" },
  })
  return u.id
}

async function markOnboarded(userId: string) {
  await prisma.onboardingProfile.upsert({
    where: { userId },
    update: { completedAt: now() },
    create: { userId, completedAt: now(), answers: {}, ladder: {}, seg: {} },
  })
}

async function create() {
  // 素材: ★付きの曲3つ + 教材1つ
  const scores = await prisma.score.findMany({
    where: { deletedAt: null, star: { not: null } },
    orderBy: { star: "asc" }, take: 3, select: { id: true, star: true },
  })
  if (scores.length === 0) throw new Error("Score が無い (先に曲を登録して)")
  const scoreIds = scores.map((s) => s.id)
  const item = await prisma.practiceItem.findFirst({ where: {}, select: { id: true } })

  const ids = {} as Record<PersonaKey, string>
  for (const p of PERSONAS) {
    ids[p.key] = await ensureDbUser(p.key)
    await wipeUserData(ids[p.key])
    if (p.key !== "zero") await markOnboarded(ids[p.key])
    // 課金状態リセット (該当ペルソナ以外は無料に戻す)
    await prisma.user.update({
      where: { id: ids[p.key] },
      data: { plan: null, planStatus: null, planCurrentPeriodEnd: null, stripeCustomerId: null, stripeSubscriptionId: null },
    })
  }

  const weekStart = jstWeekStart(now())
  const inWeek = (i: number) => new Date(weekStart.getTime() + 3600_000 * (i + 1)) // 週内 月曜1時〜

  // free3 / free7: 今週の消費 (曲2+基礎練1 の混合で作る)
  for (const [key, n] of [["free3", 3], ["free7", 7]] as const) {
    const uid = ids[key]
    const nScore = item ? n - 1 : n
    await prisma.performance.createMany({
      data: perfRows(uid, scoreIds, nScore, inWeek(0), inWeek(nScore - 1)) })
    if (item) {
      await prisma.practicePerformance.create({
        data: {
          userId: uid, practiceItemId: item.id, name: "#p1", audioPath: "",
          analysisStatus: "done", pitchAccuracy: 75, timingAccuracy: 70, overallScore: 72.5,
          uploadedAt: inWeek(nScore),
        },
      })
    }
    // おまけ: queued(録音キャンセル) と error(解析失敗) を1件ずつ → カウント非消費の検証用
    await prisma.performance.createMany({
      data: [
        { userId: uid, scoreId: scoreIds[0], performanceType: "user", performanceStatus: "uploaded", name: "#q", audioPath: "", analysisStatus: "queued", uploadedAt: inWeek(8), createdAt: inWeek(8) },
        { userId: uid, scoreId: scoreIds[0], performanceType: "user", performanceStatus: "uploaded", name: "#e", audioPath: "", analysisStatus: "error", errorMessage: "seed: 解析失敗の再現", uploadedAt: inWeek(9), createdAt: inWeek(9) },
      ],
    })
  }

  // young: 10日前開始・20件
  await prisma.performance.createMany({
    data: perfRows(ids["young"], scoreIds, 20, new Date(Date.now() - 10 * DAY), now()) })

  // heavy: 90日で500件 (createMany 1発)
  await prisma.performance.createMany({
    data: perfRows(ids["heavy"], scoreIds, 500, new Date(Date.now() - 90 * DAY), now()) })

  // student × teacher
  const sid = ids["student"], tid = ids["teacher"]
  await prisma.teacherStudent.upsert({
    where: { teacherId_studentId: { teacherId: tid, studentId: sid } },
    update: {}, create: { teacherId: tid, studentId: sid },
  })
  await prisma.performance.createMany({
    data: perfRows(sid, scoreIds, 15, new Date(Date.now() - 30 * DAY), now()) })
  const listenPerf = await prisma.performance.findFirst({
    where: { userId: sid }, orderBy: { uploadedAt: "desc" }, select: { id: true, scoreId: true } })
  await prisma.listenRequest.create({
    data: { studentId: sid, teacherId: tid, performanceId: listenPerf!.id, scoreId: listenPerf!.scoreId, status: "pending" },
  })
  // 表現クリア3語 (★は曲のsnapshot)。ID は moodTags.ts の正 (mood_ prefix 必須)
  for (const [i, mood] of ["mood_dolce", "mood_cantabile", "mood_energico"].entries()) {
    const sc = scores[i % scores.length]
    await prisma.userExpressionClear.upsert({
      where: { userId_moodTagId_scoreId: { userId: sid, moodTagId: mood, scoreId: sc.id } },
      update: {}, create: { userId: sid, teacherId: tid, moodTagId: mood, scoreId: sc.id, starAtClear: sc.star ?? 1 },
    })
  }
  // 宿題4状態: 未着手(期限先) / 提出済 / 合格(提出+高得点) / 期限切れ
  await prisma.assignment.createMany({
    data: [
      { teacherId: tid, studentId: sid, scoreId: scoreIds[0], reps: 3, targetTempo: 80, comment: "seed: 未着手", dueDate: new Date(Date.now() + 7 * DAY), goalType: "score", targetScore: 80, moodTagId: "mood_dolce" },
      { teacherId: tid, studentId: sid, scoreId: scoreIds[1], comment: "seed: 提出済", dueDate: new Date(Date.now() + 3 * DAY), submittedAt: new Date(Date.now() - 1 * DAY), submittedPerformanceId: listenPerf!.id, submittedScore: 72 },
      { teacherId: tid, studentId: sid, scoreId: scoreIds[2], comment: "seed: 合格", goalType: "score", targetScore: 70, submittedAt: new Date(Date.now() - 2 * DAY), submittedPerformanceId: listenPerf!.id, submittedScore: 91, doneAt: new Date(Date.now() - 2 * DAY) },
      { teacherId: tid, studentId: sid, scoreId: scoreIds[0], comment: "seed: 期限切れ", dueDate: new Date(Date.now() - 3 * DAY) },
    ],
  })
  // メッセージ往復 + 癖の所見
  await prisma.message.createMany({
    data: [
      { teacherId: tid, studentId: sid, fromTeacher: true, body: "seed: 今週もがんばりましょう🎻", createdAt: new Date(Date.now() - 2 * DAY) },
      { teacherId: tid, studentId: sid, fromTeacher: false, body: "seed: 3小節目が難しいです", createdAt: new Date(Date.now() - 2 * DAY + 3600_000) },
      { teacherId: tid, studentId: sid, fromTeacher: true, body: "seed: ゆっくりのテンポで部分練習してみて", readAt: null, createdAt: new Date(Date.now() - 3600_000) },
    ],
  })
  await prisma.teacherObservation.create({
    data: { teacherId: tid, studentId: sid, tagIds: ["posture_right_shoulder_up"], severity: "mild", comment: "seed: 弓が上がるときに右肩も一緒に上がる" },
  })

  // 課金状態 (DB直書き)
  const bill = async (key: PersonaKey, data: object) =>
    prisma.user.update({ where: { id: ids[key] }, data })
  await bill("plus-trial", { plan: "plus", planStatus: "trialing", planCurrentPeriodEnd: new Date(Date.now() + 14 * DAY), stripeSubscriptionId: "sub_seed_trial", stripeCustomerId: "cus_seed_trial" })
  await bill("plus-active", { plan: "plus", planStatus: "active", planCurrentPeriodEnd: new Date(Date.now() + 30 * DAY), stripeSubscriptionId: "sub_seed_active", stripeCustomerId: "cus_seed_active" })
  await bill("pastdue", { plan: "plus", planStatus: "past_due", planCurrentPeriodEnd: new Date(Date.now() + 5 * DAY), stripeSubscriptionId: "sub_seed_pastdue", stripeCustomerId: "cus_seed_pastdue" })
  await bill("canceled", { plan: null, planStatus: "canceled", planCurrentPeriodEnd: new Date(Date.now() - 10 * DAY), stripeSubscriptionId: "sub_seed_canceled", stripeCustomerId: "cus_seed_canceled" })

  console.log("\n== 作成完了 ==")
  for (const p of PERSONAS) console.log(`${email(p.key).padEnd(36)} ${PASSWORD}  ${p.name} — ${p.desc}`)
  console.log("\n注意: 音声なし(再生不可)。課金系はDB直書きなので「契約を管理」はエラーが正常。")
}

async function cleanup() {
  for (const p of PERSONAS) {
    const mail = email(p.key)
    let authId: string | null = null
    for (let page = 1; page <= 3; page++) {
      const { data } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
      const hit = data?.users.find((u) => u.email === mail)
      if (hit) { authId = hit.id; break }
      if (!data || data.users.length < 1000) break
    }
    if (!authId) { console.log(`skip (auth無し): ${mail}`); continue }
    const dbUser = await prisma.user.findUnique({ where: { supabaseUserId: authId }, select: { id: true } })
    if (dbUser) {
      await wipeUserData(dbUser.id)
      await prisma.user.delete({ where: { id: dbUser.id } }) // 残りは cascade
    }
    await supabase.auth.admin.deleteUser(authId)
    console.log(`deleted: ${mail}`)
  }
}

async function list() {
  for (const p of PERSONAS) {
    const authId = await (async () => {
      const { data } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
      return data?.users.find((u) => u.email === email(p.key))?.id ?? null
    })()
    const db = authId ? await prisma.user.findUnique({ where: { supabaseUserId: authId }, select: { id: true, plan: true, planStatus: true } }) : null
    console.log(`${email(p.key).padEnd(36)} auth=${authId ? "○" : "×"} db=${db ? db.id : "×"} plan=${db?.plan ?? "-"}/${db?.planStatus ?? "-"}`)
  }
}

const cmd = process.argv[2]
const run = cmd === "create" ? create : cmd === "cleanup" ? cleanup : cmd === "list" ? list : null
if (!run) { console.log("usage: npx tsx scripts/seed_test_users.ts <create|cleanup|list>"); process.exit(1) }
run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
