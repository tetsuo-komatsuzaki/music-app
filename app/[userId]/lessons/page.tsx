// 学びレッスン一覧 (確定#2/#5/#6 2026-07-14)
// - 23本をカテゴリ別に表示。✓=正式クリア / 淡✓=申告済み(自己申告・未受講) / 準備中=教材未公開
// - クリアn/23 のカウントは正式クリアのみ (確定#5)
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { getLessonInventory, getUserLessonState, tagId } from "@/app/_libs/lessonStatus"
import { CATS, LESSONS, LESSON_TOTAL, type LessonCat } from "./_lib/content"
import styles from "./lessons.module.css"

export const metadata = { title: "学びレッスン" }

export default async function LessonsPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  // レッスンは本人の学習記録なので、他人のページ経由でも自分の一覧へ
  if (user.id !== userId) redirect(`/${user.id}/lessons`)

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: user.id },
    select: { id: true },
  })
  if (!dbUser) redirect("/login")

  const [inventory, state] = await Promise.all([
    getLessonInventory(),
    getUserLessonState(dbUser.id),
  ])

  const clearedCount = LESSONS.filter((l) => state.cleared.has(tagId(l.tag))).length
  const groups: LessonCat[] = ["bow", "left", "both"]

  return (
    <div className={styles.stage}>
      <div className={styles.frame}>
        <div className={styles.home}>
          <div className={styles.hTitle}>学びのレッスン</div>
          <div className={styles.hSub}>
            クリア: {clearedCount} / {LESSON_TOTAL}（各3回弾けばクリア・点数不問）
          </div>
          {/* PC(≥900px)ではテーマ3列を並列表示・⭐︎で習得状態を見せる。モバイルは縦積み */}
          <div className={styles.cols}>
            {groups.map((g) => (
              <div key={g} className={styles.catCol}>
                <div className={styles.catHead}>
                  <div className={styles.catDot} style={{ background: CATS[g].theme }} />
                  {CATS[g].label}
                </div>
                {LESSONS.filter((l) => l.cat === g).map((l) => {
                  const id = tagId(l.tag)
                  const item = inventory.get(id)
                  const cleared = state.cleared.has(id)
                  const reported = !cleared && state.selfReported.has(id)
                  const ready = !!item && item.buildStatus === "done" && !!item.generatedXmlPath
                  const star = (
                    <span
                      className={`${styles.star} ${cleared ? styles.starOn : reported ? styles.starHalf : ""}`}
                    >
                      {cleared || reported ? "★" : "☆"}
                    </span>
                  )
                  if (!ready) {
                    return (
                      <div key={l.id} className={`${styles.lCard} ${styles.pending}`}>
                        {l.name}
                        <span className={styles.pendingLbl}>準備中</span>
                        {star}
                      </div>
                    )
                  }
                  return (
                    <Link
                      key={l.id}
                      href={`/${userId}/lessons/${l.id}`}
                      className={`${styles.lCard} ${cleared ? styles.done : ""} ${reported ? styles.reported : ""}`}
                    >
                      {l.name}
                      {reported && <span className={styles.reportedLbl}>申告済み</span>}
                      <span className={styles.chk}>{cleared || reported ? "✓" : ""}</span>
                      {star}
                    </Link>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
