import { config } from "dotenv"
config()
async function main() {
  const { prisma } = await import("../app/_libs/prisma")
  const r = await prisma.shareCard.deleteMany({
    where: { token: { in: ["foXzuoteGa42rEL3", "J4UPv2NtJHCdWqYn", "ty5AdgUipqM7mzOL", "ZFp9hsm1b2FWsMLg"] } },
  })
  console.log("deleted:", r.count)
}
main()
