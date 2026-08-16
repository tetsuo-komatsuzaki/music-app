// iOSアプリアイコン生成 (2026-08-16)。
// 起動スプラッシュの1番目 = ポーズ03B「弓を振って応援」の静止状態を、
// #16294F 全面背景の中央 (上下左右10%余白) に置いた 1024×1024 PNG を書き出す。
//
// 実行: npx tsx scripts/gen-app-icon.tsx
// 出力: native/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png (上書き)
// 注意: 出力後に PIL でアルファチャンネルを除去すること (App Store必須要件)。
//   python -c "from PIL import Image; p=r'native/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png'; Image.open(p).convert('RGB').save(p)"
// アイコン変更は審査再提出が必要 (殻の同梱物のため)。
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { chromium } from "playwright-core"
import { ArcoChan, POSES } from "../app/components/ArcoChan"

const pose = (POSES as { id: string }[]).find((p) => p.id === "03B") // スプラッシュ1番目と同一
if (!pose) throw new Error("pose 03B not found")

// playing:false → data-arco="static" となり全アニメ停止 = 初期状態の静止画
const svg = renderToStaticMarkup(
  React.createElement(ArcoChan as React.FC<{ pose: unknown; playing: boolean }>, { pose, playing: false }),
)

const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  html, body { margin: 0; width: 1024px; height: 1024px; background: #16294F; overflow: hidden; }
  .box {
    position: absolute; inset: 102px; /* 上下左右10%余白 (角丸マスク対策) */
    display: flex; align-items: center; justify-content: center;
  }
  .box svg { width: 100%; height: 100%; }
</style></head>
<body><div class="box">${svg}</div></body></html>`

const outPath = join(
  dirname(fileURLToPath(import.meta.url)), "..",
  "native", "ios", "App", "App", "Assets.xcassets", "AppIcon.appiconset", "AppIcon-512@2x.png",
)

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 1 })
  await page.setContent(html)
  await page.screenshot({ path: outPath })
  await browser.close()
  console.log(`generated: ${outPath}`)
}
main().catch((e) => { console.error(e); process.exit(1) })
