/**
 * 教材カバーの試作スクリプト（作風確認用）。
 *
 * 使い方:
 *   1) Replicate の API トークンを用意（https://replicate.com/account/api-tokens）
 *   2) プロジェクト直下の .env または .env.local に次を追記:
 *        REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxxxxx
 *      （または PowerShell で:  $env:REPLICATE_API_TOKEN="r8_..."  ）
 *   3) 実行:
 *        npx tsx scripts/gen-cover-sample.ts
 *   4) ./cover-samples/ に webp が保存されるので作風を確認
 *
 * 数枚だけ・1枚 約$0.025(Flux Dev)。合計でも数十円で済みます。
 */

import { promises as fs } from "fs"
import path from "path"
import { buildCoverPrompt, type CoverPromptInput } from "../app/_libs/coverImage/coverPrompt"
import { generateFluxImage } from "../app/_libs/coverImage/replicateFlux"

// .env / .env.local から REPLICATE_API_TOKEN を拾う（tsx単体実行では自動読込されないため）
async function loadToken(): Promise<void> {
  if (process.env.REPLICATE_API_TOKEN) return
  for (const f of [".env.local", ".env"]) {
    try {
      const txt = await fs.readFile(path.resolve(process.cwd(), f), "utf8")
      const m = txt.match(/^\s*REPLICATE_API_TOKEN\s*=\s*["']?([^"'\r\n]+)["']?/m)
      if (m) { process.env.REPLICATE_API_TOKEN = m[1]; return }
    } catch { /* ファイルが無ければ次へ */ }
  }
}

// 作風の幅を見るための代表サンプル（カテゴリ別・季節自動・年代自動を網羅）
const SAMPLES: (CoverPromptInput & { label: string })[] = [
  { label: "scale-major",        category: "scale", keyMode: "major", title: "ニ長調 音階" },
  { label: "etude-minor",        category: "etude", keyMode: "minor", title: "カイザー 練習曲", composer: "カイザー" },
  { label: "piece-mendelssohn",  category: "piece", keyMode: "minor", title: "ノクターン", composer: "メンデルスゾーン" }, // 年代=romantic自動
  { label: "piece-bach",         category: "piece", keyMode: "minor", title: "パルティータ", composer: "Bach" },          // 年代=baroque自動
  { label: "piece-theme",        category: "piece", keyMode: "major", title: "夏の夜の夢", composer: "メンデルスゾーン", themeHint: "a moonlit midsummer forest" },
]

async function download(url: string, dest: string): Promise<void> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`ダウンロード失敗 ${r.status}`)
  const buf = Buffer.from(await r.arrayBuffer())
  await fs.writeFile(dest, buf)
}

async function main() {
  await loadToken()
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error("REPLICATE_API_TOKEN が見つかりません。.env に REPLICATE_API_TOKEN=... を追記してください。")
    process.exit(1)
  }

  const outDir = path.resolve(process.cwd(), "cover-samples")
  await fs.mkdir(outDir, { recursive: true })

  for (let i = 0; i < SAMPLES.length; i++) {
    const s = SAMPLES[i]
    const prompt = buildCoverPrompt(s)
    console.log(`\n▶ ${s.label}`)
    console.log(`  prompt: ${prompt}`)
    try {
      const url = await generateFluxImage(prompt, { aspectRatio: "1:1", outputFormat: "webp", goFast: true })
      const dest = path.join(outDir, `${s.label}.webp`)
      await download(url, dest)
      console.log(`  ✅ 保存: ${dest}`)
    } catch (e) {
      console.error(`  ❌ 失敗: ${(e as Error).message}`)
    }
    // 無料枠(支払い方法未登録)のレート制限(429)回避のためサンプル間に待機
    if (i < SAMPLES.length - 1) await new Promise((r) => setTimeout(r, 4000))
  }
  console.log(`\n完了。./cover-samples/ を開いて作風を確認してください。`)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
