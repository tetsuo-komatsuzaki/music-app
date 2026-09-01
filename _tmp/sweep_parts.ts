import "dotenv/config"
import { createRequire } from "module"
const require_ = createRequire(import.meta.url)
// server-only は Next のガード。CLI から同じロジックを流すため無効化する
const M = require_("module") as { _load: (r: string, ...a: unknown[]) => unknown }
const orig = M._load
M._load = function (req: string, ...a: unknown[]) {
  if (req === "server-only") return {}
  return orig.call(this, req, ...a)
}
async function main() {
  const { prisma } = await import("../app/_libs/prisma")
  const { sweepPracticePartVariants } = await import("../app/_libs/partMaterialize")
  const r = await sweepPracticePartVariants()
  console.log("スイープ結果:", r)
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
