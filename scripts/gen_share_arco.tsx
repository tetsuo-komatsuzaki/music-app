// シェアOG画像用: ArcoChan の4ポーズを SVG 文字列に事前生成する (2026-08-03)。
// Next.js は app 配下での react-dom/server import を禁止しているため、
// ビルド外 (npx tsx) で実行して app/_libs/shareArcoSvg.ts を生成する。
// ポーズを変えたいときはここを編集して再実行:
//   npx tsx scripts/gen_share_arco.tsx
import { writeFileSync } from "fs"
import { renderToStaticMarkup } from "react-dom/server"
import { ArcoChan, POSES } from "../app/components/ArcoChan"

const POSE_ID: Record<string, string> = {
  master: "02A", // 両手上げジャンプ = やったね！
  rank_up: "02B", // ダブルガッツ = やったね！
  weekly: "02C", // 両手ほっぺ = お疲れさま！
  daily: "01A", // 斜め上を指す = いいね！
}

const poses = POSES as { id: string }[]
const out: Record<string, string> = {}
for (const [kind, id] of Object.entries(POSE_ID)) {
  const pose = poses.find((p) => p.id === id) ?? poses[0]
  out[kind] = renderToStaticMarkup(<ArcoChan pose={pose} playing={false} />)
}

const file = `// 自動生成: scripts/gen_share_arco.tsx (編集禁止・再生成で更新)
// シェアOG画像に埋め込む ArcoChan SVG (kind別ポーズ)。
import type { ShareKind } from "@/app/_libs/shareCard"

export const ARCO_SVG: Record<ShareKind, string> = ${JSON.stringify(out, null, 2)}
`
writeFileSync("app/_libs/shareArcoSvg.ts", file)
console.log("generated app/_libs/shareArcoSvg.ts", Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.length])))
