/**
 * 全曲・全教材の一括再解析。
 *
 * 2026-08-26 新設。2026-08-24 のアドホックな一括再解析が2つの穴を踏み、
 * 曲74件が全滅したうえ2日間気づかれなかったため、正規の手順としてリポジトリに置く。
 *
 *   穴1: 曲に渡す USER_ID を auth uid(UUID) にしていた。Score.createdById は
 *        内部の User.id(cuid) なので1件も一致せず、74件すべてが
 *        "Score not found or unauthorized" で落ちた。
 *        → このスクリプトは createdById(cuid) を DB から引いてそのまま渡す。
 *   穴2: `gcloud jobs execute --async` の投入成功だけをログに残していた。
 *        74件すべて「成功」と記録されていた。
 *        → このスクリプトは投入後に DB のステータスを突き合わせ、
 *          error/未完了を件数と理由つきで報告する。
 *
 * 使い方:
 *   DRY=1 npx tsx scripts/reanalyze_bulk.ts            件数と対象だけ表示
 *   npx tsx scripts/reanalyze_bulk.ts                  曲+教材すべて
 *   TARGET=scores npx tsx scripts/reanalyze_bulk.ts    曲だけ
 *   TARGET=items  npx tsx scripts/reanalyze_bulk.ts    教材だけ
 *   SPACING_MS=8000 で投入間隔を変えられる (既定 8 秒)
 *
 * 必要な env: DATABASE_URL / RELAY_URL / RELAY_KEY
 */
import { config } from "dotenv"
config()
import { randomUUID } from "crypto"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../app/generated/prisma/client.js"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

const DRY = process.env.DRY === "1"
const TARGET = process.env.TARGET ?? "all"
const SPACING_MS = Number(process.env.SPACING_MS ?? 8000)
const RELAY_URL = process.env.RELAY_URL
const RELAY_KEY = process.env.RELAY_KEY

type Target =
  | { kind: "score"; id: string; title: string; ownerId: string }
  | { kind: "item"; id: string; title: string }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function collect(): Promise<Target[]> {
  const out: Target[] = []
  if (TARGET === "all" || TARGET === "scores") {
    const scores = await prisma.score.findMany({
      where: { deletedAt: null },  // originalXmlPath は非null列なので絞り込み不要
      select: { id: true, title: true, createdById: true },
      orderBy: { createdAt: "asc" },
    })
    // createdById は内部の User.id(cuid)。ここを auth uid にすると全滅する。
    for (const s of scores) {
      if (!s.createdById) {
        console.warn(`  ⚠ 作成者不明のためスキップ: ${s.title} (${s.id})`)
        continue
      }
      out.push({ kind: "score", id: s.id, title: s.title, ownerId: s.createdById })
    }
  }
  if (TARGET === "all" || TARGET === "items") {
    const items = await prisma.practiceItem.findMany({
      select: { id: true, title: true },
      orderBy: { createdAt: "asc" },
    })
    for (const i of items) out.push({ kind: "item", id: i.id, title: i.title })
  }
  return out
}

async function submit(t: Target): Promise<string | null> {
  const body: Record<string, unknown> = {
    mode: "score_full",
    idempotency_key: `bulk-${t.id}-${randomUUID().slice(0, 8)}`,
    is_practice: false,
  }
  if (t.kind === "item") body.practice_item_id = t.id
  else {
    body.score_id = t.id
    body.user_id = t.ownerId // ★ 内部 User.id(cuid)
    body.storage_user_id = t.ownerId
  }
  const res = await fetch(`${RELAY_URL}/invoke`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RELAY_KEY}` },
    body: JSON.stringify(body),
  })
  if (!res.ok) return `投入失敗 HTTP ${res.status}: ${(await res.text()).slice(0, 160)}`
  return null
}

/** 投入だけでは何も分からない。DB のステータスを突き合わせて結果を出す。 */
async function verify(targets: Target[]) {
  const scoreIds = targets.filter((t) => t.kind === "score").map((t) => t.id)
  const itemIds = targets.filter((t) => t.kind === "item").map((t) => t.id)
  const scores = scoreIds.length
    ? await prisma.score.findMany({
        where: { id: { in: scoreIds } },
        select: { id: true, title: true, analysisStatus: true, buildStatus: true, errorMessage: true },
      })
    : []
  const items = itemIds.length
    ? await prisma.practiceItem.findMany({
        where: { id: { in: itemIds } },
        select: { id: true, title: true, analysisStatus: true, buildStatus: true, errorMessage: true },
      })
    : []
  const rows = [
    ...scores.map((s) => ({ kind: "曲", ...s })),
    ...items.map((i) => ({ kind: "教材", ...i })),
  ]
  const done = rows.filter((r) => r.analysisStatus === "done" && r.buildStatus === "done")
  const err = rows.filter((r) => r.analysisStatus === "error" || r.buildStatus === "error")
  const pending = rows.filter((r) => !done.includes(r) && !err.includes(r))

  console.log(`\n──── 結果 ────`)
  console.log(`  完了   ${done.length}`)
  console.log(`  エラー ${err.length}`)
  console.log(`  未完了 ${pending.length}  (まだ解析中の可能性あり。数分おいて再確認)`)
  if (err.length) {
    console.log(`\nエラーの内訳:`)
    for (const r of err.slice(0, 30))
      console.log(`  [${r.kind}] ${r.title.slice(0, 30).padEnd(32)} ${r.errorMessage ?? "(理由なし)"}`)
    if (err.length > 30) console.log(`  ...ほか ${err.length - 30}件`)
  }
  return err.length
}

async function main() {
  if (!DRY && (!RELAY_URL || !RELAY_KEY)) throw new Error("RELAY_URL / RELAY_KEY が未設定")

  const targets = await collect()
  const nScore = targets.filter((t) => t.kind === "score").length
  const nItem = targets.filter((t) => t.kind === "item").length
  console.log(`対象: 曲 ${nScore}件 + 教材 ${nItem}件 = ${targets.length}件`)
  console.log(`推定所要: 約 ${Math.ceil((targets.length * SPACING_MS) / 60000)}分`)
  if (DRY) {
    console.log("\nDRY=1 のため投入しない。曲の先頭5件に渡す user_id:")
    for (const t of targets.filter((x) => x.kind === "score").slice(0, 5))
      console.log(`  ${(t as { ownerId: string }).ownerId}  ${t.id}`)
    return
  }

  const failures: string[] = []
  for (let n = 0; n < targets.length; n++) {
    const t = targets[n]
    const e = await submit(t)
    if (e) failures.push(`${t.title} (${t.id}): ${e}`)
    if ((n + 1) % 20 === 0 || n === targets.length - 1)
      console.log(`  投入 ${n + 1}/${targets.length}  投入失敗 ${failures.length}`)
    if (n < targets.length - 1) await sleep(SPACING_MS)
  }
  if (failures.length) {
    console.log(`\n投入そのものに失敗 ${failures.length}件:`)
    for (const f of failures.slice(0, 20)) console.log(`  ${f}`)
  }

  console.log(`\n解析の完了を待つ (90秒)…`)
  await sleep(90_000)
  const bad = await verify(targets)
  if (bad > 0) process.exitCode = 1
}

main().finally(() => prisma.$disconnect())
