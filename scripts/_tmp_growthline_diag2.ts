import { config } from "dotenv"
config()
async function main() {
  const { prisma } = await import("../app/_libs/prisma")
  const p = await prisma.performance.findFirst({
    where: { pitchAccuracy: { not: null }, score: { title: "アルプス一万尺" } },
    orderBy: { uploadedAt: "desc" },
    select: { analysisSummary: true },
  })
  const d = (p?.analysisSummary as { diagnosis?: { per_subtask?: Record<string, unknown> } } | null)?.diagnosis
  console.log("keys:", Object.keys(d?.per_subtask ?? {}).join(", "))
}
main()
