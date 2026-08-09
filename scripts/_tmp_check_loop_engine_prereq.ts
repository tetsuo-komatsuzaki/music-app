// Cloud Run Job (8a) 動作確認の前提チェック:
// 対象 PracticeItem に loop_engine_runner が必要とする Storage ファイルが
// 揃っているか確認する。
//
// Usage:
//   npx tsx scripts/_tmp_check_loop_engine_prereq.ts <practiceItemId>
//   npx tsx scripts/_tmp_check_loop_engine_prereq.ts          # 推奨: 任意 scale を自動選択

import { config } from "dotenv"
config()
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../app/generated/prisma/client.js"

const TARGET_USER_ID = "cmmm46xn40000jgjytot9eobc"

async function check(supabaseUrl: string, srKey: string, bucket: string, path: string) {
  const url = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${srKey}` } })
  return { ok: res.ok, status: res.status, path: `${bucket}/${path}` }
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter })

  const arg = process.argv[2]
  let item
  if (arg) {
    item = await prisma.practiceItem.findUnique({
      where: { id: arg },
      select: { id: true, title: true, category: true, star: true, skillSubTaskTags: true },
    })
    if (!item) { console.error(`PracticeItem not found: ${arg}`); process.exit(1) }
  } else {
    item = await prisma.practiceItem.findFirst({
      where: { category: "scale", isPublished: true, star: { not: null } },
      orderBy: { sortOrder: "asc" },
      select: { id: true, title: true, category: true, star: true, skillSubTaskTags: true },
    })
    if (!item) { console.error("No PracticeItem found"); process.exit(1) }
  }

  console.log(`\n=== PracticeItem ===`)
  console.log(`id: ${item.id}`)
  console.log(`title: ${item.title}`)
  console.log(`category: ${item.category}`)
  console.log(`star: ${item.star}`)
  console.log(`skillSubTaskTags: ${JSON.stringify(item.skillSubTaskTags)}`)

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const srKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !srKey) {
    console.error("\nSUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in env")
    process.exit(1)
  }
  const musicxmlBucket = process.env.BUCKET_NAME || "musicxml"

  console.log(`\n=== Storage files ===`)
  const files = [
    [musicxmlBucket, `practice/${item.id}/analysis.json`],
    [musicxmlBucket, `practice/${item.id}/musicxml_skill_info.json`],
  ] as const

  let allOk = true
  for (const [bucket, path] of files) {
    const r = await check(supabaseUrl, srKey, bucket, path)
    console.log(`  ${r.ok ? "✅" : "❌"} ${r.path} (HTTP ${r.status})`)
    if (!r.ok) allOk = false
  }

  console.log(`\n=== Result ===`)
  if (allOk) {
    console.log(`✅ This PracticeItem is ready for loop_engine_runner.`)
    console.log(`   Use this id when uploading a recording: ${item.id}`)
  } else {
    console.log(`❌ Missing files. Cannot run loop_engine_runner on this item.`)
    console.log(`   musicxml_skill_info.json missing → Commit D run on this item required.`)
    console.log(`   試す候補: 別 PracticeItem 指定、または admin で再 upload (analyze_musicxml 起動)。`)
  }

  // 既存の PracticePerformance count
  const _userId = TARGET_USER_ID
  void _userId
  const recentPerfs = await prisma.practicePerformance.findMany({
    where: { practiceItemId: item.id },
    orderBy: { uploadedAt: "desc" },
    take: 3,
    select: { id: true, uploadedAt: true, analysisStatus: true, pitchSkillScore: true },
  })
  console.log(`\n=== Recent perfs for this item (top 3) ===`)
  for (const p of recentPerfs) {
    console.log(`  ${p.id}  ${p.uploadedAt.toISOString()}  status=${p.analysisStatus} pitchSkillScore=${p.pitchSkillScore}`)
  }

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
