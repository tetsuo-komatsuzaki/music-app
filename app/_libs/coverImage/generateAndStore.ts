/**
 * 教材カバーの生成 → Supabase Storage 保存 → coverImagePath 記録（サーバ専用）。
 *
 * フロー: buildCoverPrompt → generateFluxImage(Replicate/Flux) → 画像DL
 *        → Storage("covers" 公開バケット)に保存 → 公開URLを coverImagePath に更新。
 *
 * ⚠️ REPLICATE_API_TOKEN / NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が必要。
 * ⚠️ サーバ/バッチ専用（ブラウザから呼ばない = トークン秘匿）。
 */

import { prisma } from "../prisma"
import { storageAdmin } from "../storageAdmin"
import { buildCoverPrompt, type CoverPromptInput } from "./coverPrompt"
import { generateFluxImage } from "./replicateFlux"

const BUCKET = "covers"

/** 公開バケットが無ければ作る（冪等） */
async function ensureBucket(): Promise<void> {
  const { data } = await storageAdmin.storage.getBucket(BUCKET)
  if (data) return
  const { error } = await storageAdmin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: "5MB",
    allowedMimeTypes: ["image/webp", "image/png", "image/jpeg"],
  })
  // 競合(同時作成)は無視
  if (error && !/already exists/i.test(error.message)) throw new Error(`bucket作成失敗: ${error.message}`)
}

/** プロンプト→生成→画像バイナリ */
async function renderCover(input: CoverPromptInput): Promise<Buffer> {
  const prompt = buildCoverPrompt(input)
  const url = await generateFluxImage(prompt, { aspectRatio: "1:1", outputFormat: "webp", goFast: true })
  const res = await fetch(url)
  if (!res.ok) throw new Error(`カバー画像DL失敗 ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

/** Storageに保存して公開URLを返す */
async function storeCover(storagePath: string, buf: Buffer): Promise<string> {
  await ensureBucket()
  const { error } = await storageAdmin.storage
    .from(BUCKET)
    .upload(storagePath, buf, { contentType: "image/webp", upsert: true })
  if (error) throw new Error(`カバー保存失敗: ${error.message}`)
  const { data } = storageAdmin.storage.from(BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

/** 練習曲(Score)のカバーを生成→保存→coverImagePath更新。生成URLを返す */
export async function generateScoreCover(scoreId: string): Promise<string> {
  const s = await prisma.score.findUnique({
    where: { id: scoreId },
    select: { id: true, title: true, composer: true, keyMode: true },
  })
  if (!s) throw new Error(`Score が見つかりません: ${scoreId}`)
  const buf = await renderCover({ title: s.title, composer: s.composer, keyMode: s.keyMode, category: "piece" })
  const url = await storeCover(`score/${scoreId}.webp`, buf)
  await prisma.score.update({ where: { id: scoreId }, data: { coverImagePath: url } })
  return url
}

/** 基礎練(PracticeItem)のカバーを生成→保存→coverImagePath更新。生成URLを返す */
export async function generatePracticeItemCover(itemId: string): Promise<string> {
  const it = await prisma.practiceItem.findUnique({
    where: { id: itemId },
    select: { id: true, title: true, composer: true, category: true, keyMode: true },
  })
  if (!it) throw new Error(`PracticeItem が見つかりません: ${itemId}`)
  const buf = await renderCover({ title: it.title, composer: it.composer, category: it.category, keyMode: it.keyMode })
  const url = await storeCover(`practice/${itemId}.webp`, buf)
  await prisma.practiceItem.update({ where: { id: itemId }, data: { coverImagePath: url } })
  return url
}
