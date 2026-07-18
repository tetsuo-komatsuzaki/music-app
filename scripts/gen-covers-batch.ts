/**
 * 教材カバーの一括生成バッチ。
 * coverImagePath が未設定の 練習曲(公開Score) と 基礎練(PracticeItem) にカバーを生成し保存する。
 *
 * 使い方:
 *   npx tsx scripts/gen-covers-batch.ts        … 未生成すべて
 *   npx tsx scripts/gen-covers-batch.ts 3      … 先頭3件だけ（テスト用・安く確認）
 *
 * ⚠️ .env に REPLICATE_API_TOKEN / DATABASE_URL / NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が必要。
 * ⚠️ Replicate に支払い方法未登録だとレート制限(429)で遅い/失敗する。本番は登録推奨。
 */
import "dotenv/config"
import { prisma } from "../app/_libs/prisma"
import { generateScoreCover, generatePracticeItemCover } from "../app/_libs/coverImage/generateAndStore"

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function main() {
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error("REPLICATE_API_TOKEN が未設定です（.env）。"); process.exit(1)
  }
  const limit = Number(process.argv[2]) || Infinity

  const scores = await prisma.score.findMany({
    where: { isShared: true, deletedAt: null, coverImagePath: null },
    select: { id: true, title: true },
    orderBy: { createdAt: "asc" },
  })
  const items = await prisma.practiceItem.findMany({
    where: { coverImagePath: null },
    select: { id: true, title: true },
    orderBy: { createdAt: "asc" },
  })

  // [種別, id, title] の一覧を作り、limit で先頭から絞る
  const jobs: { kind: "score" | "item"; id: string; title: string }[] = [
    ...scores.map((s) => ({ kind: "score" as const, id: s.id, title: s.title })),
    ...items.map((i) => ({ kind: "item" as const, id: i.id, title: i.title })),
  ].slice(0, limit === Infinity ? undefined : limit)

  console.log(`未生成: 練習曲 ${scores.length} / 基礎練 ${items.length} 件。今回実行: ${jobs.length} 件`)
  let ok = 0, ng = 0
  for (const [n, j] of jobs.entries()) {
    process.stdout.write(`[${n + 1}/${jobs.length}] ${j.kind} ${j.title.slice(0, 30)} … `)
    try {
      const url = j.kind === "score" ? await generateScoreCover(j.id) : await generatePracticeItemCover(j.id)
      ok += 1
      console.log(`✅ ${url}`)
    } catch (e) {
      ng += 1
      console.log(`❌ ${(e as Error).message}`)
    }
    if (n < jobs.length - 1) await sleep(1500)
  }
  console.log(`\n完了: 成功 ${ok} / 失敗 ${ng}`)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
