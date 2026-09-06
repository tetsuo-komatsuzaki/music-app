"use server"
/**
 * 自作スコア登録 (2026-09-06 Tetsuo確定): 画面で組み立てた音の並びから MusicXML を作り、
 * 従来のファイル登録 (uploadPracticeItem) と同じ道に流す。解析 ・ 譜面 ・ 全調生成 ・ 奏法パターンはそのまま動く。
 */
import { requireAdminAction } from "@/app/_libs/requireAuth"
import { buildMusicXml, totalBeats, type AuthorNote, type AuthorCategory, STRINGS, VIOLIN_LOW, VIOLIN_HIGH } from "@/app/_libs/scoreAuthor"
import { uploadPracticeItem } from "./uploadPracticeItem"

export type CreateAuthoredInput = {
  title: string
  category: AuthorCategory
  keyTonic: string
  keyMode: "major" | "minor"
  beats: number
  star: number
  notes: AuthorNote[]
  expandAllKeys?: boolean
  standardArticulations?: boolean
  articulationIds?: string[]
}

const CATEGORIES: AuthorCategory[] = ["scale", "arpeggio", "bowing", "fingering"]
const ARTS = new Set(["", "staccato", "accent", "tenuto"])

export async function createAuthoredItem(input: CreateAuthoredInput): Promise<{ ok: true; itemId: string } | { ok: false; error: string }> {
  const gate = await requireAdminAction()
  if (!gate.ok) return { ok: false, error: gate.error }

  const title = (input.title ?? "").trim().slice(0, 100)
  if (!title) return { ok: false, error: "教材名を入れてください" }
  if (!CATEGORIES.includes(input.category)) return { ok: false, error: "分類が不正です" }
  if (!/^[A-G][#b]?$/.test(input.keyTonic) || !["major", "minor"].includes(input.keyMode)) return { ok: false, error: "調が不正です" }
  const beats = [2, 3, 4].includes(input.beats) ? input.beats : 4
  const star = Number.isInteger(input.star) && input.star >= 1 && input.star <= 10 ? input.star : 2

  const notes: AuthorNote[] = (input.notes ?? []).filter((n) =>
    Number.isInteger(n.midi) && n.midi >= VIOLIN_LOW && n.midi <= VIOLIN_HIGH
    && STRINGS.includes(n.str) && Number.isInteger(n.fin) && n.fin >= 0 && n.fin <= 4
    && Number.isInteger(n.pos) && n.pos >= 1 && n.pos <= 5
    && [4, 2, 1, 0.5, 0.25, 0.125].includes(n.ql) && ARTS.has(n.art ?? ""),
  ).map((n) => ({ ...n, art: n.art ?? "" }))
  if (notes.length === 0) return { ok: false, error: "音がありません" }
  if (notes.length > 400) return { ok: false, error: "音が多すぎます (400 まで)" }
  const total = totalBeats(notes)
  if (Math.abs(total / beats - Math.round(total / beats)) > 1e-6) {
    return { ok: false, error: `小節がぴったり埋まっていません (${total} 拍 ・ ${beats} 拍ずつ)` }
  }

  const xml = buildMusicXml({ title, tonic: input.keyTonic, keyMode: input.keyMode, beats, notes })
  const fd = new FormData()
  fd.set("file", new File([xml], "authored.musicxml", { type: "application/xml" }))
  fd.set("title", title)
  fd.set("composer", "")
  fd.set("category", input.category)
  fd.set("keyTonic", input.keyTonic)
  fd.set("keyMode", input.keyMode)
  fd.set("star", String(star))
  fd.set("expandAllKeys", input.expandAllKeys ? "true" : "false")
  fd.set("standardArticulations", input.standardArticulations ? "true" : "false")
  if (input.standardArticulations && input.articulationIds?.length) fd.set("articulationIds", JSON.stringify(input.articulationIds))
  fd.set("tempoMin", "")
  fd.set("tempoMax", "")
  fd.set("positions", JSON.stringify([]))
  fd.set("description", "")
  fd.set("descriptionShort", "")
  const r = await uploadPracticeItem(fd)
  if ("error" in r && r.error) return { ok: false, error: r.error }
  const itemId = (r as { itemId?: string }).itemId
  return itemId ? { ok: true, itemId } : { ok: false, error: "登録に失敗しました" }
}
