/**
 * ポジション移動の公開教材を一括登録する (2026-09-13 Tetsuo指示)。
 *
 * 素材: C:\Users\tetsu\OneDrive\Desktop\アルコ用教材\ポジション移動\*.musicxml (120本)
 * 教材名 = ファイル名から拡張子を除いたもの。難易度 (star) は入れない
 * (解析器が譜面のタグから推定して star が NULL のときだけ書く: analyze_musicxml.py の _TAG_STAR)。
 *
 * 管理画面の 1 件アップロード (app/actions/uploadPracticeItem.ts) と同じ順序を踏む:
 *   1. 調を MusicXML から読む (<mode> が無ければ長調)
 *   2. PracticeItem を作る (isPublished=true / analysisStatus=queued / buildStatus=queued)
 *   3. Storage の musicxml バケット practice/{id}/original.musicxml に上げる
 *   4. MaterialGroup (系統ごとに1つ) に紐付ける
 *   5. relay 経由で Cloud Run の score_full を投入する (429 対策で間隔を空ける)
 * カバー画像 (Replicate 課金) はこのスクリプトでは作らない。
 *
 * 弦の注記が無いファイルへの手当て:
 *   2-4-6-8ポジション移動_A線_① だけ <string> が無く運指だけがある。推定に落とさず
 *   ファイル名の弦で <string> を足してから上げる (2026-09-13 Tetsuo: A線でよろしく)。
 *   元ファイルは書き換えない。上げる中身だけを直す。
 *
 * 使い方:
 *   DRY=1 npx tsx scripts/upload_position_shift.ts                      対象と内訳だけ表示
 *   ONLY="a.musicxml,b.musicxml" npx tsx scripts/upload_position_shift.ts   指定した数本だけ
 *   SKIP_EXISTING=0 で同名教材があっても作る (既定は飛ばす)
 *   REPLACE=1 で同名教材の中身を差し替える (Storage の写しを上げ直して再解析。id は変わらない)
 *   SPACING_MS=8000 で解析の投入間隔 (既定 8 秒)
 *
 * 必要な env: DATABASE_URL / NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY /
 *             RELAY_URL / RELAY_API_KEY / ENABLE_PYTHON_ANALYSIS=true
 */
import { config } from "dotenv"
config()
import * as fs from "fs"
import * as path from "path"
import { createClient } from "@supabase/supabase-js"
import { randomUUID } from "crypto"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../app/generated/prisma/client.js"
import { detectKeyFromMusicXmlText } from "../app/_libs/musicxmlKey.js"

const SRC_DIR = process.env.SRC_DIR ?? "C:\\Users\\tetsu\\OneDrive\\Desktop\\アルコ用教材\\ポジション移動"
const CATEGORY = "position_shift"
const KIND = "POSITION_SHIFT"
const DRY = process.env.DRY === "1"
const ONLY = (process.env.ONLY ?? "").split(",").map((s) => s.trim()).filter(Boolean)
const SKIP_EXISTING = process.env.SKIP_EXISTING !== "0"
/**
 * REPLACE=1: 同じ名前の教材が既にあるとき、新しく作らず**中身を差し替える**。
 * Storage の写しを上げ直し、解析をやり直す。教材の id も履歴も変わらない。
 * 登録したあとに譜面の欠陥が見つかったときの直し方 (指示書 §9-1 の6)。
 * 素材フォルダの古いファイルを退避する作業は別途必要 (§5-22 の重複判定は解除しない)。
 */
const REPLACE = process.env.REPLACE === "1"
const SPACING_MS = Number(process.env.SPACING_MS ?? 8000)

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** MusicXML の弦番号。1=E 2=A 3=D 4=G */
const STRING_NO: Record<string, number> = { E: 1, A: 2, D: 3, G: 4 }
/** 軸の値としての弦の並び (低い順) */
const STRING_LABELS = ["G線", "D線", "A線", "E線"]

/**
 * ファイル名 → 系統名 (MaterialGroup の題)。**先頭トークンをそのまま使う。**
 * 「1指の…」〜「4指の…」を1つにまとめてはいけない。一覧は系統ごとに1枚のカードで、
 * 弦と番号は練習前シートの軸から選ぶ作りだが、軸の値は教材名の2トークン目以降
 * (app/[userId]/practice/[category]/page.tsx の axisValues) しか見ない。
 * 指の違いは先頭トークンの中にあるため、まとめると軸として現れず 16 件が 4 通りに潰れる。
 */
function familyOf(stem: string): string {
  return stem.split("_")[0]
}

/** ファイル名の末尾の丸数字・指番号から並び順を作る (①=1 … / 1指=1 …)。無ければ 0 */
function sortOrderOf(stem: string): number {
  const circled = "①②③④⑤⑥⑦⑧⑨⑩"
  const tail = stem.split("_").pop() ?? ""
  const i = circled.indexOf(tail)
  if (i >= 0) return i + 1
  const finger = /^([1-4])指の/.exec(stem)
  return finger ? Number(finger[1]) : 0
}

/**
 * ファイル名の弦 (E/A/D/G)。`_` 区切りのトークンに完全一致するものが
 * ちょうど1つのときだけ返す。部分一致で採ると `G線上のアリア_A線` を G と誤認する。
 */
function stringLetterOf(stem: string): string | null {
  const hits = stem.split("_").map((t) => /^([GDAE])線$/.exec(t)?.[1]).filter(Boolean) as string[]
  return hits.length === 1 ? hits[0] : null
}

/**
 * <string> が1つも無く <fingering> がある譜面に、ファイル名の弦を書き足す。
 * 解析器は <string>+<fingering> の両方があるときだけ "annotated" (最優先) の経路に乗る。
 */
function withStringAnnotations(xml: string, stem: string): { xml: string; injected: number } {
  if (/<string[\s>]/.test(xml)) return { xml, injected: 0 }
  const letter = stringLetterOf(stem)
  if (!letter || !STRING_NO[letter]) return { xml, injected: 0 }
  const no = STRING_NO[letter]
  let injected = 0
  const out = xml.replace(/(<fingering\b[^>]*>[^<]*<\/fingering>)/g, (m) => {
    injected++
    return `${m}<string>${no}</string>`
  })
  return { xml: out, injected }
}

type Plan = {
  file: string
  stem: string
  family: string
  sortOrder: number
  keyTonic: string
  keyMode: string
  injected: number
}

async function buildPlan(): Promise<Plan[]> {
  const files = fs
    .readdirSync(SRC_DIR)
    .filter((f) => f.toLowerCase().endsWith(".musicxml"))
    .filter((f) => ONLY.length === 0 || ONLY.includes(f))
    .sort()
  const plans: Plan[] = []
  for (const file of files) {
    const stem = path.basename(file, path.extname(file))
    const raw = fs.readFileSync(path.join(SRC_DIR, file), "utf8")
    const detected = detectKeyFromMusicXmlText(raw)
    if (!detected) {
      console.warn(`  ⚠ 調を読めないため飛ばす: ${file}`)
      continue
    }
    const { injected } = withStringAnnotations(raw, stem)
    plans.push({
      file,
      stem,
      family: familyOf(stem),
      sortOrder: sortOrderOf(stem),
      keyTonic: detected.keyTonic,
      keyMode: detected.keyMode,
      injected,
    })
  }
  return plans
}

/** 系統ごとの MaterialGroup。同じ題のものがあれば使い回す */
async function ensureGroup(title: string): Promise<string> {
  const found = await prisma.materialGroup.findFirst({
    where: { category: CATEGORY, title },
    select: { id: true },
  })
  if (found) return found.id
  const created = await prisma.materialGroup.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { kind: KIND as any, category: CATEGORY as any, title, composer: null },
    select: { id: true },
  })
  console.log(`  + グループ作成: ${title} (${created.id})`)
  return created.id
}

async function invokeAnalysis(practiceItemId: string, fresh = false): Promise<string> {
  if (process.env.ENABLE_PYTHON_ANALYSIS !== "true") return "skipped(disabled)"
  const relayUrl = process.env.RELAY_URL
  const apiKey = process.env.RELAY_API_KEY
  if (!relayUrl || !apiKey) throw new Error("RELAY_URL / RELAY_API_KEY が要る")
  const res = await fetch(`${relayUrl}/invoke`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      mode: "score_full",
      // relay は「同じ鍵 + 実行済み」なら exists を返してジョブを起こさない
      // (relay-service/main.py の早期 return)。差し替えのときは毎回ちがう鍵にする。
      idempotency_key: fresh
        ? `replace-${practiceItemId}-${randomUUID().slice(0, 8)}`
        : `score_full:${practiceItemId}`,
      practice_item_id: practiceItemId,
      is_practice: false,
    }),
  })
  if (!res.ok) throw new Error(`relay ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const data = (await res.json()) as { execution_id?: string; status?: string }
  return `${data.status ?? "?"} ${data.execution_id ?? ""}`.trim()
}

/**
 * 教材グループの軸 (弦・番号) を、いま所属している教材名から作り直す。
 * 練習前シートのプルダウンは axes[i].values に保存された配列だけを見るので、
 * 教材を足したらここを作り直さないと、新しい弦が選択肢に出ず到達できなくなる。
 */
async function rebuildAxes() {
  const groups = await prisma.materialGroup.findMany({
    where: { category: CATEGORY as never },
    select: { id: true, title: true, practiceItems: { select: { title: true } } },
  })
  for (const g of groups) {
    if (g.practiceItems.length === 0) continue
    const cols: string[][] = []
    for (const it of g.practiceItems) {
      it.title.split("_").slice(1).forEach((v, i) => { cols[i] = [...(cols[i] ?? []), v] })
    }
    const axes = cols.map((vals) => {
      const uniq = [...new Set(vals)]
      const isString = uniq.every((v) => STRING_LABELS.includes(v))
      // 弦の値に混ざりもの (汎用 など) が1つでも入ると、その軸は「番号」に落ちて
      // 弦のプルダウンが系統ごと消える。気づけるように警告を出す。
      if (!isString && uniq.some((v) => STRING_LABELS.includes(v))) {
        console.warn(`  ⚠ ${g.title}: 弦の軸に弦以外の値が混ざっている (${uniq.join(" / ")}) ・弦で選べなくなる`)
      }
      return {
        key: isString ? "string" : "no",
        label: isString ? "弦" : "番号",
        kind: "select" as const,
        values: isString ? STRING_LABELS.filter((x) => uniq.includes(x)) : uniq.sort(),
      }
    })
    await prisma.materialGroup.update({ where: { id: g.id }, data: { axes } })
    console.log(`  軸を更新: ${g.title} = ${axes.map((a) => `${a.label}(${a.values.length})`).join(" × ")}`)
  }
}

async function main() {
  if (REPLACE && ONLY.length === 0) {
    console.error("REPLACE=1 は ONLY で対象を名指しすること。付けないと登録済みの全件を差し替えてしまう")
    process.exit(1)
  }
  const plans = await buildPlan()
  const byFamily = new Map<string, number>()
  for (const p of plans) byFamily.set(p.family, (byFamily.get(p.family) ?? 0) + 1)

  console.log(`素材: ${SRC_DIR}`)
  console.log(`対象: ${plans.length} 件 / 系統 ${byFamily.size} 個`)
  for (const [f, n] of [...byFamily].sort()) console.log(`  ${f}: ${n} 件`)
  const injectedFiles = plans.filter((p) => p.injected > 0)
  for (const p of injectedFiles) console.log(`  弦を書き足す: ${p.stem} (${p.injected} 音)`)

  if (DRY) {
    for (const p of plans) console.log(`  [DRY] ${p.stem} | ${p.keyTonic} ${p.keyMode} | 並び ${p.sortOrder}`)
    await prisma.$disconnect()
    return
  }

  const storage = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const groupIds = new Map<string, string>()
  const created: { id: string; stem: string }[] = []
  const replaced = new Set<string>()   // 差し替えたもの。解析の鍵を変える

  for (const p of plans) {
    // 同名の確認は SKIP_EXISTING とは別に行う。REPLACE=1 は SKIP_EXISTING の値によらず効く
    const dup = (SKIP_EXISTING || REPLACE)
      ? await prisma.practiceItem.findFirst({
          where: { category: CATEGORY as never, title: p.stem },
          select: { id: true, star: true, autoStar: true },
        })
      : null
    {
      if (!dup && REPLACE) {
        // 差し替えのつもりで新しい教材を作ってしまわない。名前が1文字でも違えば当たらない
        console.error(`  ✗ 差し替える相手が見つからない: ${p.stem} ・教材名が登録時と一致しているか確かめること`)
        continue
      }
      if (dup && !REPLACE && SKIP_EXISTING) {
        console.log(`  = 既にあるので飛ばす: ${p.stem} (${dup.id})`)
        continue
      }
      if (dup && REPLACE) {
        const raw = fs.readFileSync(path.join(SRC_DIR, p.file), "utf8")
        const xml = withStringAnnotations(raw, p.stem).xml
        const storagePath = `practice/${dup.id}/original.musicxml`
        const { error } = await storage.storage
          .from("musicxml")
          .upload(storagePath, Buffer.from(xml, "utf8"), { contentType: "application/xml", upsert: true })
        if (error) {
          console.error(`  ✗ 差し替え失敗: ${p.stem} - ${error.message}`)
          continue
        }
        if (!groupIds.has(p.family)) groupIds.set(p.family, await ensureGroup(p.family))
        // star は人が入れた値のこともある。機械が入れた値 (autoStar と同じ) のときだけ空に戻し、
        // 解析にタグから決め直させる。人の値は残す。
        const machineStar = dup.star != null && dup.star === dup.autoStar
        await prisma.practiceItem.update({
          where: { id: dup.id },
          data: {
            originalXmlPath: storagePath,
            keyTonic: p.keyTonic,
            keyMode: p.keyMode,
            groupId: groupIds.get(p.family)!,
            sortOrder: p.sortOrder,
            analysisStatus: "queued",
            buildStatus: "queued",
            errorMessage: null,
            retryCount: 0,
            positions: [],
            ...(machineStar || dup.star == null ? { star: null } : {}),
          },
        })
        if (!machineStar && dup.star != null) {
          console.log(`     ※ 人が入れた★${dup.star} は残した (autoStar=${dup.autoStar})`)
        }
        replaced.add(dup.id)
        created.push({ id: dup.id, stem: p.stem })
        console.log(`  ↻ 差し替え: ${p.stem} (${dup.id}) ${p.keyTonic} ${p.keyMode}`)
        continue
      }
    }
    if (!groupIds.has(p.family)) groupIds.set(p.family, await ensureGroup(p.family))

    const item = await prisma.practiceItem.create({
      data: {
        category: CATEGORY as never,
        title: p.stem,
        composer: null,
        keyTonic: p.keyTonic,
        keyMode: p.keyMode,
        tempoMin: null,
        tempoMax: null,
        positions: [],
        instrument: "violin",
        originalXmlPath: "",
        source: "admin",
        isPublished: true,
        analysisStatus: "queued",
        buildStatus: "queued",
        star: null,
        skillSubTaskTags: [],
        groupId: groupIds.get(p.family)!,
        sortOrder: p.sortOrder,
      },
      select: { id: true },
    })

    const raw = fs.readFileSync(path.join(SRC_DIR, p.file), "utf8")
    const xml = withStringAnnotations(raw, p.stem).xml
    const storagePath = `practice/${item.id}/original.musicxml`
    const { error } = await storage.storage
      .from("musicxml")
      .upload(storagePath, Buffer.from(xml, "utf8"), { contentType: "application/xml", upsert: true })
    if (error) {
      await prisma.practiceItem.delete({ where: { id: item.id } })
      console.error(`  ✗ アップロード失敗のため取り消し: ${p.stem} - ${error.message}`)
      continue
    }
    await prisma.practiceItem.update({ where: { id: item.id }, data: { originalXmlPath: storagePath } })
    created.push({ id: item.id, stem: p.stem })
    console.log(`  ✓ 作成: ${p.stem} (${item.id}) ${p.keyTonic} ${p.keyMode}`)
  }

  console.log(`\n解析を投入する (${created.length} 件・間隔 ${SPACING_MS}ms)`)
  for (const c of created) {
    try {
      const r = await invokeAnalysis(c.id, replaced.has(c.id))
      console.log(`  → ${c.stem}: ${r}`)
    } catch (e) {
      console.error(`  ✗ 投入失敗 ${c.stem}: ${e instanceof Error ? e.message : e}`)
    }
    await sleep(SPACING_MS)
  }

  // 軸はシートのプルダウンの選択肢そのもの。教材を足したら必ず作り直す。
  // 作り直さないと、新しい弦は DB にあるのにシートに出ず、到達できない。
  console.log("\n教材グループの軸を作り直す")
  await rebuildAxes()

  console.log("\n投入したものの現状 (この時点):")
  const rows = await prisma.practiceItem.findMany({
    where: { id: { in: created.map((c) => c.id) } },
    select: { id: true, title: true, analysisStatus: true, buildStatus: true, star: true, autoStar: true, positions: true, errorMessage: true },
    orderBy: { title: "asc" },
  })
  for (const r of rows) {
    console.log(`  ${r.title} | 解析 ${r.analysisStatus} / 譜面 ${r.buildStatus} | ★${r.star ?? "-"} (auto ${r.autoStar ?? "-"}) | ${r.positions.join(",") || "ポジション未"} ${r.errorMessage ? `| ${r.errorMessage}` : ""}`)
  }
  console.log("\n解析は非同期なので、数分おいて scripts/upload_position_shift.ts の最後の表を見るか管理画面で状態を確認すること")
  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
