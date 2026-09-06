// 学びレッスン一覧 (確定#2/#5/#6 2026-07-14)
// - 23本をカテゴリ別に表示。★=正式クリア / 淡★=申告済み(自己申告・未受講) / 準備中=教材未公開
// - クリアn/23 のカウントは正式クリアのみ (確定#5)
// 見た目 = 確定モック 補01 (scratchpad/build-gap5.py LESSONS_LIST) の写経 (2026-08-22):
//   back「‹ ライブラリ」・ h1 ds.t ・ subT 13px ・ 進捗カード (bigN26px + /23クリア +
//   申告ずみn + 金バー) ・ カテゴリカード (色ドット9px + 13px見出し + n本) ・
//   行 = inset (12.5px/700 + ★13px: クリア=金 / 申告=金.45 / まだ=青灰.28) ・
//   準備中 = 薄行 (青灰.05地 ・ op.55 ・ チップ9.5px) ・ 凡例カード 10px。
//   PC≥900px はテーマ3列 (2026-07-14確定の維持)。
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { getLessonInventory, getUserLessonState, tagId } from "@/app/_libs/lessonStatus"
import { CATS, LESSONS, type LessonCat } from "./_lib/content"
import LessonCardStatus from "./_components/LessonCardStatus"
import styles from "./lessons.module.css"
import ds from "@/app/components/ds.module.css"
import GateSheet from "@/app/components/guest/GateSheet"
import { GATE_TEXT } from "@/app/components/guest/gateText"
import { GUEST_DB_PLACEHOLDER, GUEST_ID } from "@/app/_libs/viewer"

export const metadata = { title: "学びレッスン" }

export default async function LessonsPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>
  searchParams?: Promise<{ gate?: string }>
}) {
  const { userId } = await params
  // ゲスト閲覧 (2026-09-06): 一覧は見せる (本人の状態は無い)。行を押すと ?gate= で同じ画面の上にシート
  const guest = userId === GUEST_ID
  const gateOpen = guest && !!(await searchParams)?.gate
  let dbUser: { id: string } | null = { id: GUEST_DB_PLACEHOLDER }
  if (!guest) {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) redirect("/login")
    // レッスンは本人の学習記録なので、他人のページ経由でも自分の一覧へ
    if (user.id !== userId) redirect(`/${user.id}/lessons`)

    dbUser = await prisma.user.findUnique({
      where: { supabaseUserId: user.id },
      select: { id: true },
    })
    if (!dbUser) redirect("/login")
  }

  const [inventory, state] = await Promise.all([
    getLessonInventory(),
    getUserLessonState(dbUser.id),
  ])

  const groups: LessonCat[] = ["bow", "left", "both"]
  const total = LESSONS.length
  const clearedCount = LESSONS.filter((l) => state.cleared.has(tagId(l.tag))).length
  const reportedCount = LESSONS.filter((l) => {
    const id = tagId(l.tag)
    return !state.cleared.has(id) && state.selfReported.has(id)
  }).length
  const pct = Math.round((clearedCount / total) * 100)

  return (
    <div>
      {gateOpen && <GateSheet key={String((await searchParams)?.gate)} title={GATE_TEXT.lesson.title} items={[...GATE_TEXT.lesson.items]} laterMode="hide" returnTo={`/${userId}/lessons`} />}
      {/* 原本 .back */}
      <Link
        href={`/${userId}/library?tab=basics`}
        style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--text-sub)", fontSize: 13, fontWeight: 700, padding: "10px 2px 2px", textDecoration: "none" }}
      >
        ‹ ライブラリ
      </Link>
      <h1 className={ds.t} style={{ paddingTop: 0 }}>学びのレッスン</h1>
      <div style={{ color: "var(--text-sub)", fontSize: 13, padding: "5px 2px 0" }}>
        音のしくみを、{total}本の短い動画で。
      </div>

      {/* 進捗カード (原本: bigN 26px + /n クリア + 申告ずみ + 金バー) */}
      <div className={ds.card} style={{ padding: "13px 15px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span className={ds.bigN} style={{ fontSize: 26 }}><span data-anim="count">{clearedCount}</span></span>
          <span style={{ fontSize: 12, color: "var(--text-sub)", fontWeight: 800 }}>/ {total} クリア</span>
          <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: "auto" }}>申告ずみ {reportedCount}</span>
        </div>
        <div className={`${ds.bar} ${ds.gold}`} data-anim="bar" style={{ marginTop: 9, ["--w" as string]: `${pct}%` }}>
          <i />
        </div>
      </div>

      <div className={styles.dsCols}>
        {groups.map((g) => (
          <div key={g} className={ds.card} style={{ padding: "13px 15px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: CATS[g].theme, flex: "none" }} />
              <b style={{ fontSize: 13, color: "var(--text-ink)" }}>{CATS[g].label}</b>
              <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: "auto" }}>
                {LESSONS.filter((l) => l.cat === g).length}本
              </span>
            </div>
            {LESSONS.filter((l) => l.cat === g).map((l) => {
              const id = tagId(l.tag)
              const item = inventory.get(id)
              const cleared = state.cleared.has(id)
              const reported = !cleared && state.selfReported.has(id)
              const ready = !!item && item.buildStatus === "done" && !!item.generatedXmlPath
              if (!ready) {
                return (
                  <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 11px", borderRadius: 10, background: "rgba(150,175,225,.05)", opacity: 0.55, marginTop: 6 }}>
                    <span style={{ flex: 1, fontSize: 12, color: "var(--text-muted)" }}>{l.name}</span>
                    <span style={{ fontSize: 9.5, color: "var(--text-muted)", border: "1px solid rgba(150,175,225,.16)", borderRadius: 5, padding: "1px 6px" }}>準備中</span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>☆</span>
                  </div>
                )
              }
              return (
                <Link
                  key={l.id}
                  href={guest ? `/${userId}/lessons?gate=${l.id}` : `/${userId}/lessons/${l.id}`}
                  scroll={!guest}
                  className="pressable"
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 11px", marginTop: 6, background: "var(--card-in)", border: "1px solid rgba(150,175,225,.08)", borderRadius: 10, textDecoration: "none", color: "inherit" }}
                >
                  <span style={{ flex: 1, fontSize: 12.5, fontWeight: 700, color: "var(--text-ink)" }}>{l.name}</span>
                  <LessonCardStatus>
                    <span style={{ fontSize: 13, color: cleared ? "var(--gold)" : reported ? "rgba(232,178,60,.45)" : "rgba(150,175,225,.28)" }}>
                      {cleared || reported ? "★" : "☆"}
                    </span>
                  </LessonCardStatus>
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      {/* 凡例 (原本) */}
      <div className={ds.card} style={{ padding: "12px 15px" }}>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", fontSize: 10, color: "var(--text-sub)" }}>
          <span><span style={{ color: "var(--gold)" }}>★</span> クリア</span>
          <span><span style={{ color: "rgba(232,178,60,.45)" }}>★</span> 申告ずみ</span>
          <span><span style={{ color: "rgba(150,175,225,.28)" }}>☆</span> まだ</span>
          <span style={{ color: "var(--text-muted)" }}>準備中 教材待ち</span>
        </div>
      </div>
    </div>
  )
}
