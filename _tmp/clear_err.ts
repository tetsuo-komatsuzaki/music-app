import "dotenv/config"
import { prisma } from "../app/_libs/prisma"
async function main() {
  const r = await prisma.practiceItem.update({
    where: { id: "cmth92pz0000404jpbo6ghlbf" },
    data: { errorMessage: null },
    select: { id: true, analysisStatus: true, buildStatus: true, errorMessage: true },
  })
  console.log(JSON.stringify(r))
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e.message); process.exit(1) })
