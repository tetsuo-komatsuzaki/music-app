import "dotenv/config"
import { prisma } from "../app/_libs/prisma"

// いまアップロード済みの教材を全て「初級(BEGINNER)」として登録 (2026-07-18 Tetsuo指示)。
// 難易度シートは初級〜上級を常時表示し、教材の無い難易度は選択不可にするため、
// 既存は全て初級に揃える。冪等 (difficulty 未設定のみ)。
async function main() {
  const s = await prisma.score.updateMany({ where: { difficulty: null }, data: { difficulty: "BEGINNER" } })
  const p = await prisma.practiceItem.updateMany({
    where: { difficulty: null, category: { not: "lesson" } },
    data: { difficulty: "BEGINNER" },
  })
  console.log(`初級設定: Score ${s.count} / PracticeItem ${p.count}`)
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
