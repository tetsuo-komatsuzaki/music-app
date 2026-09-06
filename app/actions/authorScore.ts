"use server"
/**
 * スコアを自分で作る ・ サーバー処理 (要件定義 v1 01 08 09)。
 *   作る:   AuthorScore → 検証 → MusicXML → 既存のファイル登録 (uploadPracticeItem) と同じ道 → 入力の内容 (author.json) も storage に残す
 *   開く:   author.json を読み戻す (再編集)
 *   直す:   MusicXML を作り直して同じ場所に上書き → author.json 更新 → 再解析
 * 管理者の認証を通さない同じ処理 (registerAuthoredScore) を分けて置き、検証スクリプトからも呼べるようにする。
 */
import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { prisma } from "@/app/_libs/prisma"
import { requireAdminAction } from "@/app/_libs/requireAuth"
import { invokeAnalysis } from "@/app/_libs/pythonRunner"
import type { AuthorScore, AuthorRegisterInput } from "@/app/_libs/author/model"
import { buildMusicXml } from "@/app/_libs/author/musicxml"
import { validateScore } from "@/app/_libs/author/validate"
import { keyTonicForItem, positionOf } from "@/app/_libs/author/pitch"
import { uploadPracticeItem } from "./uploadPracticeItem"

const BUCKET = "musicxml"
function storage() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!).storage.from(BUCKET)
}
const authorPath = (itemId: string) => `practice/${itemId}/author.json`
const INDEX_PATH = "practice/authored-index.json"

/** この画面で作った教材の id 一覧 (管理画面の「直す」ボタンの出し分け用) */
export async function listAuthoredIds(): Promise<string[]> {
  try {
    const { data } = await storage().download(INDEX_PATH)
    if (!data) return []
    const arr = JSON.parse(await data.text())
    return Array.isArray(arr) ? arr.filter((v): v is string => typeof v === "string") : []
  } catch { return [] }
}
async function addToIndex(itemId: string) {
  const ids = await listAuthoredIds()
  if (!ids.includes(itemId)) ids.push(itemId)
  await storage().upload(INDEX_PATH, Buffer.from(JSON.stringify(ids), "utf-8"), { contentType: "application/json", upsert: true })
}
/** 使っているポジション ("1st" 形式 ・ 既存の positions 欄と同じ) */
function positionsOf(s: AuthorScore): string[] {
  const set = new Set<number>()
  for (const m of s.measures) for (const e of m.elements) for (const h of e.heads) {
    if (!h.string || h.finger == null) continue
    const r = positionOf(h.pitch, h.string, h.finger)
    if (r.pos != null && r.pos > 0) set.add(r.pos)
  }
  const ord = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`
  return [...set].sort((a, b) => a - b).map(ord)
}

/** 認証を通さない登録の本体。管理者の action と検証スクリプトの両方から呼ぶ */
export async function registerAuthoredScore(input: AuthorRegisterInput): Promise<{ ok: true; itemId: string; xml: string } | { ok: false; error: string; problems?: ReturnType<typeof validateScore> }> {
  const s = input.score
  const problems = validateScore(s)
  const errors = problems.filter((p) => p.level === "error")
  if (errors.length) return { ok: false, error: `直すところが ${errors.length} 件あります: ${errors[0].text}`, problems }
  const xml = buildMusicXml(s)
  const fd = new FormData()
  fd.set("file", new File([xml], "authored.musicxml", { type: "application/xml" }))
  fd.set("title", s.title.trim())
  fd.set("composer", s.composer ?? "")
  fd.set("category", s.category)
  fd.set("keyTonic", keyTonicForItem(s.key))
  fd.set("keyMode", s.key.mode)
  fd.set("star", String(Math.max(1, Math.min(10, Math.round(input.star || 2)))))
  fd.set("expandAllKeys", input.expandAllKeys && s.key.mode === "major" ? "true" : "false")
  fd.set("standardArticulations", input.standardArticulations ? "true" : "false")
  if (input.standardArticulations && input.articulationIds?.length) fd.set("articulationIds", JSON.stringify(input.articulationIds))
  fd.set("tempoMin", s.tempoMin != null ? String(s.tempoMin) : "")
  fd.set("tempoMax", s.tempoMax != null ? String(s.tempoMax) : "")
  fd.set("positions", JSON.stringify(positionsOf(s)))
  fd.set("description", input.description ?? "")
  fd.set("descriptionShort", input.descriptionShort ?? "")
  if (s.articulation) fd.set("articulation", s.articulation)
  if (input.joinGroupId) fd.set("groupId", input.joinGroupId)
  const r = await uploadPracticeItem(fd)
  if ("error" in r && r.error) return { ok: false, error: r.error }
  const itemId = (r as { itemId?: string }).itemId
  if (!itemId) return { ok: false, error: "登録に失敗しました" }
  await storage().upload(authorPath(itemId), Buffer.from(JSON.stringify({ ...s, star: input.star }), "utf-8"), { contentType: "application/json", upsert: true })
  await addToIndex(itemId)
  return { ok: true, itemId, xml }
}

export async function createAuthoredScore(input: AuthorRegisterInput) {
  const gate = await requireAdminAction()
  if (!gate.ok) return { ok: false as const, error: gate.error }
  return registerAuthoredScore(input)
}

/** 再編集用に入力の内容を読む。無ければ null (ファイル登録の教材) */
export async function loadAuthoredScore(itemId: string): Promise<{ ok: true; score: AuthorScore & { star?: number }; item: { title: string; category: string; star: number | null } } | { ok: false; error: string }> {
  const gate = await requireAdminAction()
  if (!gate.ok) return { ok: false, error: gate.error }
  const item = await prisma.practiceItem.findUnique({ where: { id: itemId }, select: { title: true, category: true, star: true } })
  if (!item) return { ok: false, error: "教材が見つかりません" }
  const { data, error } = await storage().download(authorPath(itemId))
  if (error || !data) return { ok: false, error: "この教材は自分で作ったものではありません (ファイル登録)" }
  const score = JSON.parse(await data.text()) as AuthorScore & { star?: number }
  return { ok: true, score, item: { title: item.title, category: item.category, star: item.star } }
}

/** 直して保存: MusicXML を作り直して上書きし、再解析を起動 */
export async function updateAuthoredScore(itemId: string, score: AuthorScore, star: number): Promise<{ ok: true } | { ok: false; error: string; problems?: ReturnType<typeof validateScore> }> {
  const gate = await requireAdminAction()
  if (!gate.ok) return { ok: false, error: gate.error }
  const problems = validateScore(score)
  const errors = problems.filter((p) => p.level === "error")
  if (errors.length) return { ok: false, error: `直すところが ${errors.length} 件あります: ${errors[0].text}`, problems }
  const item = await prisma.practiceItem.findUnique({ where: { id: itemId }, select: { originalXmlPath: true } })
  if (!item?.originalXmlPath) return { ok: false, error: "教材が見つかりません" }
  const xml = buildMusicXml(score)
  const st = storage()
  const up = await st.upload(item.originalXmlPath, Buffer.from(xml, "utf-8"), { contentType: "application/xml", upsert: true })
  if (up.error) return { ok: false, error: `保存に失敗: ${up.error.message}` }
  await st.upload(authorPath(itemId), Buffer.from(JSON.stringify({ ...score, star }), "utf-8"), { contentType: "application/json", upsert: true })
  await prisma.practiceItem.update({
    where: { id: itemId },
    data: {
      title: score.title.trim(), composer: score.composer || null, keyTonic: keyTonicForItem(score.key), keyMode: score.key.mode,
      tempoMin: score.tempoMin, tempoMax: score.tempoMax, star: Math.max(1, Math.min(10, Math.round(star || 2))), articulation: score.articulation, positions: positionsOf(score),
      analysisStatus: "queued", buildStatus: "queued",
    },
  })
  try {
    await invokeAnalysis({ mode: "score_full", idempotencyKey: `score_full:${itemId}:${Date.now()}`, practiceItemId: itemId })
  } catch (e) {
    console.error("[authorScore] invokeAnalysis failed:", e)
  }
  revalidatePath("/admin/practice")
  return { ok: true }
}
