// 「この曲のゴール」達成/マスターの進捗ビジュアル (2026-07-25)。
// 曲詳細(ScoreLoopDetail) と ホーム(PracticeFocusCard) で共通利用する。
// 見出し・カード枠は呼び手側が用意し、ここは中身 (道バッジ帯 + STEP1達成 + STEP2マスター) のみ描く。
// データ元は GET /api/scores/[scoreId]/achievement-status。
// 2026-08-16 #6: scoreId付きで呼ばれた場合「直近5回の平均で判定中」の横に
// 上達のようすモーダルへのリンクを出す (データは /api/scores/[scoreId]/trajectory を遅延取得)。
"use client"

import Link from "next/link"
import ds from "./ds.module.css"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import type { ReactNode } from "react"
import { BookOpen, Music, Trophy, X } from "lucide-react"
import type { DailyLesson } from "../_libs/dailyLessons"
import ProgressTrajectory, { trajectoryPointCount, type TrajectoryPerformance } from "./ProgressTrajectory"

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
// マスターバーはマスター済みのときだけオレンジ。未マスターは灰色
// (2026-08-16 Tetsuo指定: 部分塗りも廃止し、達成済みと誤認しない見た目に)
function GoalRibbon({ stage }: { stage: 1 | 2 | 3 }) {
  const GRAY = "rgba(150,175,225,.14)"
  const bars = [
    stage >= 2 ? "#2b5bc4" : "#9db9e8",
    stage === 3 ? "#d9a93c" : GRAY,
  ]
  const labels = [stage >= 2 ? "弾けた" : "弾ける", "マスター"]
  const labCol = ["#7fa4e8", stage === 3 ? "var(--gold)" : "var(--text-sub)"]
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
  // モック nowsong.ring: 76px ・ 内円 inset6 #182747 ・ 数字 bigN 20px + /total 12px
  const base = { position: "relative" as const, width: 76, height: 76, flex: "none" as const, borderRadius: "50%", display: "grid", placeItems: "center" }
  if (full) {
    return <div style={{ ...base, background: "#2b5bc4" }}><b style={{ fontSize: "var(--fs-display)", fontWeight: 900, color: "var(--text-on-accent)", lineHeight: 1 }}>✓</b></div>
  }
  return (
    <div data-anim="ring" data-guide="home-ring" style={{ ...base, ["--p" as string]: `${pct ?? 0}%`, background: `conic-gradient(var(--gold) var(--p, ${pct ?? 0}%), rgba(150,175,225,.14) 0)` }}>
      <div style={{ position: "absolute", inset: 6, background: "#182747", borderRadius: "50%" }} />
      <b className={ds.bigN} style={{ position: "relative", zIndex: 1, fontSize: 20, fontWeight: 900, lineHeight: 1 }}>
        {done}<span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-sub)", textShadow: "none" }}>/{total}</span>
      </b>
    </div>
  )
}

// モック nowsong.cond の写経: 20pxの印 + 名前12.5 + 右に値11px (済=金 / 未=くすみ)。
// アイコンとやる→は出さない (モックが仕様)。未クリアで行き先があれば行ごとタップで飛べる
function GoalDot({ name, done, st, href }: { icon?: ReactNode; name: string; done: boolean; st?: string; href?: string | null }) {
  const body = (
    <>
      {done ? (
        <span className={`${ds.chk} ${ds.gold}`} style={{ width: 20, height: 20 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" stroke="var(--gold)" /></svg>
        </span>
      ) : (
        <span style={{ width: 20, height: 20, flex: "none", borderRadius: "50%", border: "1.5px solid rgba(150,175,225,.24)" }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <b style={{ fontSize: 12.5, color: done ? "var(--text-ink)" : "var(--text-sub)" }}>{name}</b>
      </div>
      <span style={{ fontSize: 11, fontWeight: 800, flex: "none", color: done ? "var(--gold)" : "var(--text-sub)", fontVariantNumeric: "tabular-nums" }}>
        {done ? (st ?? "✓") : st}
      </span>
    </>
  )
  if (!done && href) {
    return (
      <Link href={href} style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
        {body}
      </Link>
    )
  }
  return <div style={{ display: "flex", alignItems: "center", gap: 9 }}>{body}</div>
}

const goalCheer = (gold?: boolean) => ({
  margin: "10px 0 0", fontSize: gold ? 14 : 12.5, fontWeight: 800, textAlign: "center" as const,
  color: gold ? "var(--gold)" : "#7fa4e8", background: gold ? "rgba(232,178,60,.14)" : "rgba(122,167,255,.14)", borderRadius: 10, padding: gold ? 12 : 7,
})

/** 上達のようすモーダル (portal直付け: 祖先の.pressable transformでfixedが壊れる既知トラップ回避) */
function TrajectoryModal({ scoreId, onClose }: { scoreId: string; onClose: () => void }) {
  const [rows, setRows] = useState<TrajectoryPerformance[] | null>(null)
  const [failed, setFailed] = useState(false)
  // 報酬体系 (骨組み): 伸びグラフ閲覧クエスト (点灯前はサーバー側で無視)
  useEffect(() => {
  }, [])
  useEffect(() => {
    let alive = true
    fetch(`/api/scores/${scoreId}/trajectory`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (alive) setRows(d.performances ?? []) })
      .catch(() => { if (alive) setFailed(true) })
    return () => { alive = false }
  }, [scoreId])

  return createPortal(
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(15,25,50,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, maxHeight: "86dvh", overflowY: "auto", background: "var(--card-b)", borderRadius: 16, position: "relative" }}>
        <button
          type="button"
          onClick={onClose}
          aria-label="とじる"
          style={{ position: "absolute", top: 10, right: 10, zIndex: 1, width: 32, height: 32, borderRadius: "50%", border: "none", background: "#eef1f6", display: "grid", placeItems: "center", cursor: "pointer", color: "#3a4653" }}
        >
          <X size={17} />
        </button>
        {failed ? (
          <div style={{ padding: 28, textAlign: "center", color: "var(--text-sub)", fontWeight: 700 }}>いまうまく開けなかったみたい。少し待ってね</div>
        ) : rows == null ? (
          <div style={{ padding: 28, textAlign: "center", color: "var(--text-sub)", fontWeight: 700 }}>読み込み中…</div>
        ) : trajectoryPointCount(rows) < 2 ? (
          <div style={{ padding: 28, textAlign: "center", color: "var(--text-sub)", fontWeight: 700, lineHeight: 1.8 }}>
            まだ演奏が少ないよ。<br />2回以上録音すると上達のようすが見られるよ
          </div>
        ) : (
          <ProgressTrajectory performances={rows} />
        )}
      </div>
    </div>,
    document.body,
  )
}

export default function GoalTracker({ achv, userId, scoreId }: { achv: AchievementStatus; userId?: string; scoreId?: string }) {
  const [showTrajectory, setShowTrajectory] = useState(false)
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
      <GoalRibbon stage={stage} />

      {stage === 3 ? (
        // マスター済: お祝いだけ
        <div style={{ ...goalCheer(true), display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Trophy size={16} color="#d9a93c" /> この曲をマスター！ おつかれさま、すごい！</div>
      ) : stage === 1 ? (
        // 達成前: STEP1 (弾けるように) だけ
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {condDone >= condTotal
              ? <GoalRing full />
              : <GoalRing pct={ringPct} done={condDone} total={condTotal} />}
            <div data-anim="items" style={{ display: "flex", flexDirection: "column", gap: 9, flex: 1, minWidth: 0 }}>
              {/* ガイドの灰枠はレッスン・エチュード行のみ (通して弾く行は含めない・2026-08-29 Tetsuo指定) */}
              <div data-guide="home-ring-rows" style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {condItems.slice(0, -1).map((c) => (
                  <GoalDot key={c.name} icon={c.icon} name={c.name} done={c.done} st={c.st} href={c.href} />
                ))}
              </div>
              {condItems.slice(-1).map((c) => (
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
              <span className={ds.bigN} style={{ fontSize: 38, lineHeight: 0.9 }}>
                <span data-anim="count">{avg != null ? avg.toFixed(0) : "—"}</span><small style={{ fontSize: 14, fontWeight: 800, color: "var(--text-sub)" }}>点</small>
              </span>
            </div>
            <div style={{ position: "relative", paddingTop: 17 }}>
              <div style={{ position: "absolute", top: 0, left: "90%", transform: "translateX(-50%)", fontSize: 10, fontWeight: 900, color: "var(--gold)", textAlign: "center" }}>
                90
                <div style={{ width: 2, height: 8, background: "var(--gold)", margin: "1px auto 0" }} />
              </div>
              <div data-anim="bar" style={{ height: 12, borderRadius: 8, background: "rgba(150,175,225,.14)", overflow: "hidden", ["--w" as string]: `${avgPct}%` }}>
                <i style={{ display: "block", height: "100%", borderRadius: 8, width: `${avgPct}%`, background: "#2b5bc4" }} />
              </div>
            </div>
            <p style={{ margin: "9px 0 0", fontSize: "var(--fs-caption)", color: "var(--text-muted)", fontWeight: 600, lineHeight: 1.6 }}>
              {avg == null
                ? "まだ演奏がないよ"
                : needMore
                ? `5回ぶん演奏すると判定できるよ・いま${achv.master.scoredCount}回・あと${remainingRuns}回`
                : null}
              {scoreId && avg != null && (
                <button
                  type="button"
                  onClick={() => setShowTrajectory(true)}
                  style={{ border: "none", background: "transparent", padding: 0, marginLeft: 8, fontSize: "var(--fs-caption)", fontWeight: 800, color: "#7fa4e8", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}
                >
                  上達のようすを見る
                </button>
              )}
            </p>
          </div>
        </>
      )}
      {showTrajectory && scoreId && <TrajectoryModal scoreId={scoreId} onClose={() => setShowTrajectory(false)} />}
    </>
  )
}
