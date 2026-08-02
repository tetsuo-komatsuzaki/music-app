/**
 * verify-onboarding-c5.ts — C5保存トランザクションのE2E検証
 * 本番DB・実ユーザーIDで completeOnboardingTx を実行し、
 * 全書き込み(①profile ②★ ③仮習得 ④診断予約 ⑤曲リクエスト)と
 * 冪等性(2回目=alreadyDone・重複なし)を確認して ROLLBACK(痕跡ゼロ)。
 *
 * 実行: npx tsx scripts/verify-onboarding-c5.ts
 */
import "dotenv/config"
import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { completeOnboardingTx } from "../app/onboarding/_lib/persist"
import { judge, toAcquisitionFlags } from "../app/onboarding/_lib/logic"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL?.split("?")[0] ?? process.env.DATABASE_URL }),
})

const ROLLBACK = new Error("ROLLBACK_SENTINEL")

async function main() {
  const user = await prisma.user.findFirst({ select: { id: true } })
  if (!user) throw new Error("no user")

  // 上級者★6の実回答を再現(登録star整合ラダー 2026-08-02・logic.test.ts G6ケース相当)
  const result = judge({
    g1: true,
    g2: ["スタッカート", "ピチカート", "トレモロ"],
    g3: ["スピッカート", "トリル"],
    g4: ["ビブラート", "3rd"],
    g5: ["5th", "グリッサンド", "ハーモニクス"],
    g6: ["2nd", "4th", "6th+", "連続重音"],
  })
  const input = {
    answers: {
      q2: "3年以上", q3: "独学", q4cat: "classic",
      q4song: "チャルダッシュ(モンティ)", q4star: 6,
      q5: "すらすら読める", q6: "30分 / 日",
      q8: "憧れのあの曲を完璧に弾きたい", goalSong: "イザイ 無伴奏ソナタ",
    },
    ladder: { g1: true, g2: ["スタッカート", "ピチカート", "トレモロ"], g3: ["スピッカート", "トリル"], g4: ["ビブラート", "3rd"], g5: ["5th", "グリッサンド", "ハーモニクス"], g6: ["2nd", "4th", "6th+", "連続重音"] },
    screen: "SCR12",
    seg: { Q2: 1, ladder: 1, Q3: 1, Q4: 1, Q5: 1, Q6: 1, goal: 1 },
    star: result.star,
    flags: toAcquisitionFlags(result),
    songRequest: "イザイ 無伴奏ソナタ",
  }

  const before = await prisma.userStarProgress.findUnique({ where: { userId: user.id } })
  console.log(`対象ユーザー: ${user.id.slice(0, 8)}... 現在★=${before?.currentStar ?? "(なし)"}`)
  console.log(`判定: ★${result.star} / flags=${input.flags.length}件`)

  try {
    await prisma.$transaction(async (tx) => {
      // 1回目: 全書き込み
      const r1 = await completeOnboardingTx(tx, user.id, input)
      if (r1.alreadyDone) throw new Error("FAIL: 初回なのに alreadyDone")

      const prof = await tx.onboardingProfile.findUnique({ where: { userId: user.id } })
      const sp = await tx.userStarProgress.findUnique({ where: { userId: user.id } })
      const tags = await tx.userTagAcquisition.findMany({ where: { userId: user.id } })
      const u = await tx.user.findUnique({ where: { id: user.id }, select: { diagnosisReservedAt: true } })
      const req = await tx.songRequest.findMany({ where: { userId: user.id } })

      console.log("① profile:", prof?.completedAt ? `completedAt=済 star=${prof.star}` : "FAIL")
      console.log(`② ★: ${before?.currentStar ?? 1} → ${sp?.currentStar} (max適用・下げない)`)
      console.log(`③ 仮習得: ${tags.length}件 全PROVISIONAL=${tags.every((t) => t.state === "PROVISIONAL")}`,
        "例:", tags.slice(0, 4).map((t) => `${t.tagType}:${t.tagKey}`).join(", "), "...")
      console.log("④ diagnosisReservedAt:", u?.diagnosisReservedAt ? "セット済" : "FAIL")
      console.log(`⑤ SongRequest: ${req.length}件 (${req[0]?.songName})`)

      // 2回目: 冪等性
      const r2 = await completeOnboardingTx(tx, user.id, input)
      const tags2 = await tx.userTagAcquisition.count({ where: { userId: user.id } })
      const req2 = await tx.songRequest.count({ where: { userId: user.id } })
      console.log(`冪等性: 2回目 alreadyDone=${r2.alreadyDone} / タグ${tags2}件(増加なし=${tags2 === tags.length}) / リクエスト${req2}件(増加なし=${req2 === req.length})`)

      const ok =
        !!prof?.completedAt && sp?.currentStar === Math.max(before?.currentStar ?? 1, result.star) &&
        tags.length === input.flags.length && !!u?.diagnosisReservedAt && req.length >= 1 &&
        r2.alreadyDone && tags2 === tags.length && req2 === req.length
      console.log(`\n==== ${ok ? "ALL PASS" : "FAIL"} ====`)
      throw ROLLBACK
    })
  } catch (e) {
    if (e !== ROLLBACK) throw e
    console.log("rollback しました(DB痕跡ゼロ)")
  }
}

main()
  .catch((e) => { console.error("ERR:", e); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
