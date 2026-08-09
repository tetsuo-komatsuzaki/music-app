// 「この曲のゴール」達成/マスターの進捗ビジュアル (2026-07-25)。
// 曲詳細(ScoreLoopDetail) と ホーム(PracticeFocusCard) で共通利用する。
// 見出し・カード枠は呼び手側が用意し、ここは中身 (道バッジ帯 + STEP1達成 + STEP2マスター) のみ描く。
// データ元は GET /api/scores/[scoreId]/achievement-status。

import Link from "next/link"
import type { ReactNode } from "react"
import { BookOpen, Music, Trophy, Sparkles, Lock } from "lucide-react"
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

type NodeOn = "a" | "m" | ""

function TrackNode({ em, label, on }: { em: ReactNode; label: string; on: NodeOn }) {
  const bg = on === "a" ? "#e9f7ef" : on === "m" ? "#fbf0da" : "#f1f4f8"
  const col = on === "a" ? "#2e8b57" : on === "m" ? "#b5651d" : "#9aa6b3"
  const bd = on === "a" ? "#bfe6cf" : on === "m" ? "#eecfa0" : "transparent"
  return (
    <div style={{ flex: 1, textAlign: "center", fontSize: 11, fontWeight: 800, padding: "7px 4px", borderRadius: 10, background: bg, color: col, border: `1.5px solid ${bd}` }}>
      <span style={{ display: "flex", justifyContent: "center", lineHeight: 1.1, marginBottom: 1, filter: on ? "none" : "grayscale(1) opacity(.5)" }}>{em}</span>
      {label}
    </div>
  )
}

function StepHead({ n, title, sub, tone }: { n: string; title: string; sub: string; tone: "s1" | "s2" }) {
  const pillBg = tone === "s1" ? "#e9f7ef" : "#fbf0da"
  const pillCol = tone === "s1" ? "#2e8b57" : "#b5651d"
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, color: "#22303c", margin: "0 0 8px" }}>
      <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 999, background: pillBg, color: pillCol }}>{n}</span>
      {title}
      {sub && <span style={{ fontWeight: 600, color: "#94a0ad", fontSize: 11 }}>{sub}</span>}
    </div>
  )
}

function GoalRing({ full, pct, done, total }: { full?: boolean; pct?: number; done?: number; total?: number }) {
  const base = { position: "relative" as const, width: 72, height: 72, flex: "none" as const, borderRadius: "50%", display: "grid", placeItems: "center" }
  if (full) {
    return <div style={{ ...base, background: "#34a06a" }}><b style={{ fontSize: 30, fontWeight: 900, color: "#fff", lineHeight: 1 }}>✓</b></div>
  }
  return (
    <div style={{ ...base, background: `conic-gradient(#34a06a ${pct ?? 0}%, #e2ebe5 0)` }}>
      <div style={{ position: "absolute", inset: 8, background: "#fff", borderRadius: "50%" }} />
      <b style={{ position: "relative", zIndex: 1, fontSize: 18, fontWeight: 900, color: "#2e8b57", lineHeight: 1 }}>
        {done}<small style={{ fontSize: 11, fontWeight: 800, color: "#7bad92" }}>/{total}</small>
      </b>
    </div>
  )
}

function GoalDot({ icon, name, done, st, href }: { icon: ReactNode; name: string; done: boolean; st: string; href?: string | null }) {
  const body = (
    <>
      <span style={{ width: 26, height: 26, flex: "none", borderRadius: "50%", display: "grid", placeItems: "center", background: done ? "#e3f5ea" : "#eef1f5", filter: done ? "none" : "grayscale(.4) opacity(.7)" }}>{icon}</span>
      <span style={{ fontWeight: 700, color: done ? "#1f7a4d" : "#3a4653" }}>{name}</span>
      <span style={{ marginLeft: "auto", fontSize: 11.5, fontWeight: 700, color: done ? "#34a06a" : "#9aa6b3" }}>{st}</span>
      {!done && href && <span style={{ fontSize: 11, fontWeight: 800, color: "#4a5bd0" }}>やる →</span>}
    </>
  )
  // 未クリアで行き先があるものはタップでそのまま飛べる (2026-08-02 行き止まり解消)
  if (!done && href) {
    return (
      <Link href={href} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, textDecoration: "none", background: "#f7f8fd", border: "1px solid #e3e7f6", borderRadius: 9, padding: "5px 8px", margin: "-3px -4px" }}>
        {body}
      </Link>
    )
  }
  return <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>{body}</div>
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

  const n1On: NodeOn = achv.mastered ? "a" : achv.achieved ? "" : "a"
  const n1Label = !achv.achieved && !achv.mastered ? "いま挑戦中" : "スタート"
  const n2On: NodeOn = achv.achieved || achv.mastered ? "a" : ""
  const n2Label = achv.mastered ? "弾ける" : achv.achieved ? "弾けた" : "弾ける"
  const n3On: NodeOn = achv.mastered ? "m" : ""
  const n3Label = achv.mastered ? "マスター！" : "マスター"

  return (
    <>
      {/* 道: スタート → 達成 → マスター */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "2px 0 14px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <TrackNode em={<img src="/Icon-green.png" alt="" aria-hidden width={18} height={18} style={{ borderRadius: 4 }} />} label={n1Label} on={n1On} />
        <span style={{ color: "#c4ccd6", fontWeight: 900 }}>›</span>
        <TrackNode em={<Music size={18} />} label={n2Label} on={n2On} />
        <span style={{ color: "#c4ccd6", fontWeight: 900 }}>›</span>
        <TrackNode em={<Trophy size={18} color="#b58a1e" />} label={n3Label} on={n3On} />
      </div>

      {achv.mastered ? (
        <div style={{ ...goalCheer(true), display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Trophy size={16} color="#b58a1e" /> この曲をマスター！ おつかれさま、すごい！</div>
      ) : (
        <>
          <StepHead n="STEP 1" title="まずは弾けるように" sub="" tone="s1" />
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
          <div style={{ ...goalCheer(), display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            {achv.achieved ? <><Sparkles size={14} /> 達成ずみ！「弾ける」認定</> : `あと ${condTotal - condDone}つ で達成！`}
          </div>
        </>
      )}

      <div style={{ height: 1, background: "#eef1f4", margin: "14px 0" }} />

      <StepHead n="STEP 2" title="曲を弾きこなそう" sub="" tone="s2" />
      {!achv.achieved && !achv.mastered ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f4f6f9", borderRadius: 12, padding: "12px 14px", color: "#9aa6b3", fontSize: 12.5, fontWeight: 700 }}>
          <Lock size={15} style={{ flex: "none" }} /> 達成すると挑戦できるよ
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, margin: "2px 0 12px" }}>
            <span style={{ fontSize: 34, fontWeight: 900, lineHeight: 0.9, color: "#b5651d" }}>
              {avg != null ? avg.toFixed(0) : "—"}<small style={{ fontSize: 14, fontWeight: 800 }}>点</small>
            </span>
            <span style={{ fontSize: 11.5, color: "#9aa6b3", fontWeight: 700, paddingBottom: 3 }}>
              {achv.mastered ? "直近5回の平均" : avg != null && avg < 90 ? `あと ${Math.max(1, Math.ceil(90 - avg))}点！` : "いまの平均"}
            </span>
          </div>
          <div style={{ position: "relative", paddingTop: 16 }}>
            <div style={{ position: "absolute", top: 0, left: "90%", transform: "translateX(-50%)", fontSize: 10, fontWeight: 900, color: "#b5651d" }}>
              90
              <div style={{ width: 2, height: 8, background: "#b5651d", margin: "1px auto 0" }} />
            </div>
            <div style={{ height: 12, borderRadius: 8, background: "#eef1f5", overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 8, width: `${avgPct}%`, background: "linear-gradient(90deg,#e6a94a,#b5651d)" }} />
            </div>
          </div>
          <p style={{ margin: "9px 0 0", fontSize: 11.5, color: "#9aa6b3", fontWeight: 600, lineHeight: 1.6 }}>
            {avg == null
              ? "まだ演奏がないよ"
              : needMore
              ? `5回ぶん演奏すると判定できるよ（いま${achv.master.scoredCount}回・あと${remainingRuns}回）`
              : "直近5回の平均で判定中"}
          </p>
        </div>
      )}
    </>
  )
}
