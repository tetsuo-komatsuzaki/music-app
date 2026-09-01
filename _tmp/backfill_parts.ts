import "dotenv/config"
import { sweepPracticePartVariants } from "../app/_libs/partMaterialize"
import { prisma } from "../app/_libs/prisma"
async function main() {
  const r = await sweepPracticePartVariants()
  console.log(JSON.stringify(r))
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
