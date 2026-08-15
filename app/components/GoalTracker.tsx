// 「この曲のゴール」達成/マスターの進捗ビジュアル (2026-07-25)。
// 曲詳細(ScoreLoopDetail) と ホーム(PracticeFocusCard) で共通利用する。
// 見出し・カード枠は呼び手側が用意し、ここは中身 (道バッジ帯 + STEP1達成 + STEP2マスター) のみ描く。
// データ元は GET /api/scores/[scoreId]/achievement-status。

import Link from "next/link"
import type { ReactNode } from "react"
import { BookOpen, Music, Trophy } from "lucide-react"
import type { DailyLesson } from "../_libs/dailyLessons"

// achievement-status API レスポンス (route.ts と同期)
export type AchievementStatus = {
  dailyLessons: DailyLesson[]
  lessons: { total: number; cleared: number; nextLessonId?: string | null }
  etude: { required: boolean; id?: string; title?: string; achieved?: boolean }
  cleanRuns: { count: number; required: number }
  achieved: boolean
  mastered: boolean
  master: {
    recentAvg: number | null
    scoredCount: number
    requiredCount: number
    threshold: number
  }
  latestPerformanceId: string | null
  totalPerformanceCount: number
}

// 進捗リボン (2026-08-09 案03): 道の帯を3分割の細バーに凝縮した全体地図。
// stage 1 = STEP1中 / 2 = 達成済(STEP2中) / 3 = マスター済。
// stage2のマスターバーは全塗りだと達成済みに見える (2026-08-16 Tetsuo指摘) ため、
// 90点への到達度ぶんだけ塗る部分進捗表示にする。
function GoalRibbon({ stage, masterPct = 0 }: { stage: 1 | 2 | 3; masterPct?: number }) {
  const GRAY = "#e6eaef"
  const pct = Math.max(0, Math.min(100, Math.round(masterPct)))
  const bars = [
    stage >= 2 ? "#2e8b57" : "#7cc39a",
    stage === 3 ? "#b5651d" : stage === 2 ? `linear-gradient(90deg,#e6a94a 0 ${pct}%,${GRAY} ${pct}% 100%)` : GRAY,
  ]
  const labels = [stage >= 2 ? "弾けた" : "弾ける", "マスター"]
  const labCol = ["#2e8b57", stage === 3 ? "#b5651d" : "#8b97a3"]
  return (
    <div style={{ margin: "2px 0 14px" }}>
      <div style={{ display: "flex", gap: 4 }}>
        {bars.map((bg, i) => (
          <div key={i} style={{ flex: 1, height: 7, borderRadius: 3, background: bg }} />
        ))}
      </div>
      <div style={{ display: "flex", marginTop: 5 }}>
        {labels.map((l, i) => (
          <span key={i} style={{ flex: 1, textAlign: "center", fontSize: "var(--fs-label)", fontWeight: 800, color: labCol[i] }}>{l}</span>
        ))}
      </div>
    </div>
  )
}

/** 見出しの出し分け (2026-08-16 Tetsuo指定): 達成前=通し目標 / 達成後=マスター目標 */
export function goalHeadline(achv: AchievementStatus): string {
  return achv.achieved ? "曲をマスターしよう！" : "まずは通しで弾けるようになろう！"
}

function GoalRing({ full, pct, done, total }: { full?: boolean; pct?: number; done?: number; total?: number }) {
  const base = { position: "relative" as const, width: 72, height: 72, flex: "none" as const, borderRadius: "50%", display: "grid", placeItems: "center" }
  if (full) {
    return <div style={{ ...base, background: "#34a06a" }}><b style={{ fontSize: "var(--fs-display)", fontWeight: 900, color: "var(--text-on-accent)", lineHeight: 1 }}>✓</b></div>
  }
  return (
    <div style={{ ...base, background: `conic-gradient(#34a06a ${pct ?? 0}%, #e2ebe5 0)` }}>
      <div style={{ position: "absolute", inset: 8, background: "#fff", borderRadius: "50%" }} />
      <b style={{ position: "relative", zIndex: 1, fontSize: "var(--fs-head)", fontWeight: 900, color: "var(--text-good)", lineHeight: 1 }}>
        {done}<small style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-sub)" }}>/{total}</small>
      </b>
    </div>
  )
}

function GoalDot({ icon, name, done, st, href }: { icon: ReactNode; name: string; done: boolean; st: string; href?: string | null }) {
  const body = (
    <>
      <span style={{ width: 26, height: 26, flex: "none", borderRadius: "50%", display: "grid", placeItems: "center", background: done ? "#e3f5ea" : "#eef1f5", filter: done ? "none" : "grayscale(.4) opacity(.7)" }}>{icon}</span>
      <span style={{ fontWeight: 700, color: done ? "#1f7a4d" : "#3a4653" }}>{name}</span>
      <span style={{ marginLeft: "auto", fontSize: "var(--fs-caption)", fontWeight: 700, color: done ? "#34a06a" : "#9aa6b3" }}>{st}</span>
      {!done && href && <span style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-link)" }}>やる →</span>}
    </>
  )
  // 未クリアで行き先があるものはタップでそのまま飛べる (2026-08-02 行き止まり解消)
  if (!done && href) {
    return (
      <Link href={href} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "var(--fs-body)", textDecoration: "none", background: "#f7f8fd", border: "1px solid #e3e7f6", borderRadius: 9, padding: "5px 8px", margin: "-3px -4px" }}>
        {body}
      </Link>
    )
  }
  return <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "var(--fs-body)" }}>{body}</div>
}

const goalCheer = (gold?: boolean) => ({
  margin: "10px 0 0", fontSize: gold ? 14 : 12.5, fontWeight: 800, textAlign: "center" as const,
  color: gold ? "#b5651d" : "#2e8b57", background: gold ? "#fbf0da" : "#eafaf0", borderRadius: 10, padding: gold ? 12 : 7,
})

export default function GoalTracker({ achv, userId }: { achv: AchievementStatus; userId?: string }) {
  // 達成条件（対象がある曲だけ・通し演奏は常に）→ リング進捗。
  // userId があれば未クリア条件はタップでそのまま飛べる (行き止まり解消 2026-08-02)
  const condItems: { icon: ReactNode; name: string; done: boolean; st: string; href?: string | null }[] = [
    ...(achv.lessons.total > 0
      ? [{
          icon: <BookOpen size={14} />, name: "学びレッスン",
          done: achv.lessons.cleared >= achv.lessons.total,
          st: achv.lessons.cleared >= achv.lessons.total ? "✓" : `${achv.lessons.cleared}/${achv.lessons.total}`,
          href: userId ? (achv.lessons.nextLessonId ? `/${userId}/lessons/${achv.lessons.nextLessonId}` : `/${userId}/lessons`) : null,
        }]
      : []),
    ...(achv.etude.required
      ? [{
          icon: <Music size={14} />, name: "エチュード",
          done: achv.etude.achieved === true,
          st: achv.etude.achieved ? "✓" : "まだ",
          href: userId && achv.etude.id ? `/${userId}/practice/etude/${achv.etude.id}` : null,
        }]
      : []),
    {
      icon: <Music size={14} />, name: "通して弾く",
      done: achv.cleanRuns.count >= achv.cleanRuns.required,
      st: achv.cleanRuns.count >= achv.cleanRuns.required ? "✓" : `${achv.cleanRuns.count}/${achv.cleanRuns.required}回`,
    },
  ]
  const condTotal = condItems.length
  const condDone = condItems.filter((c) => c.done).length
  const ringPct = condTotal > 0 ? Math.round((condDone / condTotal) * 100) : 0

  const avg = achv.master.recentAvg
  const avgPct = avg != null ? Math.max(0, Math.min(100, avg)) : 0
  const needMore = achv.master.scoredCount < achv.master.requiredCount
  const remainingRuns = achv.master.requiredCount - achv.master.scoredCount

  // STEP出し分け (2026-08-09 案03): 進捗で「今の1ステップ」だけ表示し、同時に両方は出さない。
  const stage: 1 | 2 | 3 = achv.mastered ? 3 : achv.achieved ? 2 : 1

  return (
    <>
      <GoalRibbon stage={stage} masterPct={avg != null ? (avg / achv.master.threshold) * 100 : 0} />

      {stage === 3 ? (
        // マスター済: お祝いだけ
        <div style={{ ...goalCheer(true), display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Trophy size={16} color="#b58a1e" /> この曲をマスター！ おつかれさま、すごい！</div>
      ) : stage === 1 ? (
        // 達成前: STEP1 (弾けるように) だけ
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {condDone >= condTotal
              ? <GoalRing full />
              : <GoalRing pct={ringPct} done={condDone} total={condTotal} />}
            <div style={{ display: "flex", flexDirection: "column", gap: 7, flex: 1, minWidth: 0 }}>
              {condItems.map((c) => (
                <GoalDot key={c.name} icon={c.icon} name={c.name} done={c.done} st={c.st} href={c.href} />
              ))}
            </div>
          </div>
        </>
      ) : (
        // 達成済・マスター挑戦中: STEP1はリボンの緑「弾けた」に畳み、STEP2 (弾きこなそう) を主役に
        <>
          <div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, margin: "2px 0 12px" }}>
              <span style={{ fontSize: "var(--fs-display)", fontWeight: 900, lineHeight: 0.9, color: "var(--text-master)" }}>
                {avg != null ? avg.toFixed(0) : "—"}<small style={{ fontSize: "var(--fs-subhead)", fontWeight: 800 }}>点</small>
              </span>
              <span style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", fontWeight: 700, paddingBottom: 3 }}>
                いまの平均
              </span>
            </div>
            <div style={{ position: "relative", paddingTop: 16 }}>
              <div style={{ position: "absolute", top: 0, left: "90%", transform: "translateX(-50%)", fontSize: "var(--fs-label)", fontWeight: 900, color: "var(--text-master)" }}>
                90
                <div style={{ width: 2, height: 8, background: "#b5651d", margin: "1px auto 0" }} />
              </div>
              <div style={{ height: 12, borderRadius: 8, background: "#eef1f5", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 8, width: `${avgPct}%`, background: "linear-gradient(90deg,#e6a94a,#b5651d)" }} />
              </div>
            </div>
            <p style={{ margin: "9px 0 0", fontSize: "var(--fs-caption)", color: "var(--text-muted)", fontWeight: 600, lineHeight: 1.6 }}>
              {avg == null
                ? "まだ演奏がないよ"
                : needMore
                ? `5回ぶん演奏すると判定できるよ・いま${achv.master.scoredCount}回・あと${remainingRuns}回`
                : "直近5回の平均で判定中"}
            </p>
          </div>
        </>
      )}
    </>
  )
}
