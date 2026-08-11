"use client"

// 生徒カルテ UI (2026-07-28)。タブ = 概要 / 宿題。将来タブ(診断/添削)はここに足すだけ。
import { useState, useTransition } from "react"
import Link from "next/link"
import { Ear, Library, Palette, MessageCircle, FileMusic } from "lucide-react"
import { useRouter } from "next/navigation"
import { MOOD_TAG_DEFS, moodTagPhrase, moodTagLabel } from "@/app/_libs/moodTags"
import { recordExpressionClear } from "@/app/actions/expressionClears"
import { createAssignment } from "@/app/actions/teacherActions"
import { uploadScoreForStudent } from "@/app/actions/uploadScoreForStudent"
import ProgressPage from "@/app/[userId]/progress/progressPage"
import PassedHwHistory, { type PassedHwItem } from "@/app/components/PassedHwHistory"
import FingerboardPanel, { type FingerboardMark } from "@/app/components/FingerboardPanel"
import type { HeatmapData } from "@/app/_libs/fingerboard/heatmapTypes"
import type { KarteData, RemarkTrack, NumbersRoomData } from "@/app/_libs/growthKarte"

// 数値入力を打った瞬間に上限へ収める (2026-08-08)。サーバーのクランプと一致させ、
// 「打った値と保存される値が違う」サイレントな食い違いを無くす。空欄は空のまま許可。
function clampNumStr(raw: string, max: number): string {
  const d = raw.replace(/[^0-9]/g, "")
  return d === "" ? "" : String(Math.min(max, Number(d)))
}

import { goalLabel, dueInfo, DUE_COLOR, scorePassed, goalResult } from "@/app/_libs/assignmentGoal"

type Target = { id: string; title: string; group?: string }
type Briefing = {
  practiceCount7d: number
  recent5: { title: string; avg: number; date: string }[]
  achievements: { title: string; mastered: boolean }[]
  /** 生徒の目標 (オンボの旅の地図)。null=未回答 */
  goal: { songName: string; songStar: number | null; goalDate: string | null; epicWin: string | null } | null
}
type AssignmentRow = {
  id: string
  targetTitle: string
  targetMeasures: string | null
  reps: number | null
  targetTempo: number | null
  comment: string | null
  dueDate: string | null
  goalType: string | null
  targetScore: number | null
  /** 意識する表現 (統一雰囲気タグID) */
  moodTagId?: string | null
  scoreId?: string | null
  achieved: boolean
  mastered: boolean
  done: boolean
  passed: boolean
  submitted: boolean
  submittedScore: number | null
  submittedPerformanceId?: string | null
  createdAt: string
}

type ObservationRow = { id: string; tagIds: string[]; severity: string | null; comment: string | null; date: string }
type ExpressionRow = { id: string; tagId: string; severity: string | null; comment: string | null; date: string }
type WorkItem = { title: string; cat: string; kind: "score" | "practice"; avg: number; first: number; count: number; perfId: string }
type WeakSlot = { name: string; tree: "音程" | "リズム"; miss: number; target: number }
type ListenReq = { id: string; scoreId: string; performanceId: string; title: string; avg: number | null; date: string }
type Recording = { id: string; kind: "score" | "practice"; title: string; cat: string; star: number | null; pitch: number; timing: number; avg: number; date: string; audioUrl: string | null; weak: WeakSlot[]; targetId: string | null }
/** 練習後カルテ (2026-08-11 Tetsuo確定): 曲/教材にぶら下がる独立エンティティ (演奏には紐づかない) */
type KarteRow = { id: string; targetId: string; kind: "score" | "practice"; title: string; cat: string; body: string; date: string; monthKey: string; monthLabel: string; read: boolean }
type WorstNote = NumbersRoomData["worstNotes"][number]
type BestNote = NumbersRoomData["bestNotes"][number]

export default function StudentKarte({
  userId, studentId, studentName, briefing, scoreTargets, itemTargets, listenRequests = [],
  allScoreTargets, allItemTargets, working, recordings, kartes = [], assignments,
  observations = [],
  expressions = [],
  karte = null,
  studentSupabaseUserId = null,
  initialTab,
  remarks = [],
  passedItems = [],
  worstNotes = [],
  bestNotes = [],
  heatmap = null,
  fbMarks = [],
}: {
  userId: string
  studentId: string
  studentName: string
  briefing: Briefing
  /** 生徒が最近取り組んだ曲/教材 (添削タブ用) */
  scoreTargets: Target[]
  listenRequests?: ListenReq[]
  itemTargets: Target[]
  /** 宿題で選べる全曲/全公開教材 (最近以外も出せる) */
  allScoreTargets: Target[]
  allItemTargets: Target[]
  working: WorkItem[]
  recordings: Recording[]
  /** 書かれた練習後カルテ一覧 (曲/教材にぶら下がる) */
  kartes?: KarteRow[]
  assignments: AssignmentRow[]
  /** 先生の所見 (癖タグ) 履歴 */
  observations?: ObservationRow[]
  /** 表現の評価 (expr_*) 履歴 (2026-08-03 Phase0-3) */
  expressions?: ExpressionRow[]
  /** 生徒の成長カルテ (2026-08-02): 生徒に見えているのと同じもの (30日) を読み取り専用で */
  karte?: KarteData | null
  studentSupabaseUserId?: string | null
  initialTab?: "summary" | "karte" | "growth" | "passed"
  /** 指摘トラッキング (v3第2段③) */
  remarks?: RemarkTrack[]
  /** 宿題 合格の履歴 (2026-08-11) */
  passedItems?: PassedHwItem[]
  /** 強み・弱み (記録の分析=音×成功率と同じ土俵・直近2週間) */
  worstNotes?: WorstNote[]
  bestNotes?: BestNote[]
  /** 指板ヒートマップ (直近2週間・診断レポートの音程パート) */
  heatmap?: HeatmapData | null
  fbMarks?: FingerboardMark[]
}) {
  // 先生カルテ v3 (2026-08-11 再設計・最終モック=3タブ): 主役=まとめ(理解の統合)＋練習後カルテ(曲別)。成長カルテは脇役。
  // 旧「宿題・指導」タブは廃止: 依頼/返し待ち/宿題を出す/認定は「まとめ」に統合、癖は練習後カルテ詳細で書く。
  const [tab, setTab] = useState<"summary" | "karte" | "growth" | "passed">(initialTab ?? "summary")
  return (
    // 先生カルテv3 (2026-08-11): モック(teacher-all-screens)準拠のダッシュボード基調。
    // 紺ヘッダー + 白タブバー + ソフトグレー地。
    <div style={{ background: "#f5f7fa", border: "1px solid #e6e9ef", borderRadius: 18, overflow: "hidden", color: "var(--text-ink)" }}>
      <div style={{ background: "#22346b", color: "#eaf0fb", padding: "13px 15px 12px" }}>
        <Link href={`/${userId}/teacher`} style={{ fontSize: "var(--fs-label)", fontWeight: 700, color: "#9fb2dd", textDecoration: "none" }}>← 生徒一覧</Link>
        <h1 style={{ fontSize: "var(--fs-head)", fontWeight: 900, margin: "3px 0 0", color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
          {studentName} <span style={{ fontSize: "var(--fs-label)", fontWeight: 700, color: "#9fb2dd", letterSpacing: ".12em" }}>STUDENT</span>
          {(assignments.filter((a) => a.submitted && !a.done && a.scoreId).length + listenRequests.length) > 0 && (
            <button type="button" onClick={() => setTab("summary")}
              style={{ flex: "none", fontSize: "var(--fs-label)", fontWeight: 900, color: "#fff", background: "#cf4638", border: "none", borderRadius: 999, padding: "2px 9px", cursor: "pointer" }}>
              返し待ち{assignments.filter((a) => a.submitted && !a.done && a.scoreId).length + listenRequests.length}
            </button>
          )}
        </h1>
      </div>

      <div style={{ display: "flex", gap: 4, background: "#eef1f6", borderBottom: "1px solid #e6e9ef", padding: "7px 10px" }}>
        {([["summary", "まとめ"], ["karte", "練習後カルテ"], ["growth", "成長カルテ"], ["passed", "合格の履歴"]] as const).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            style={{
              flex: 1, border: "none",
              background: tab === k ? "#fff" : "transparent",
              color: tab === k ? "#22346b" : "#8b97a8",
              boxShadow: tab === k ? "0 1px 3px rgba(30,40,70,.12)" : "none",
              borderRadius: 8, padding: "7px 0", fontSize: "var(--fs-caption)", fontWeight: 900, cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding: "12px 12px 14px" }}>

      {tab === "summary" && (
        <SummaryTab
          userId={userId} studentId={studentId} briefing={briefing} working={working} recordings={recordings}
          remarks={remarks} worstNotes={worstNotes} bestNotes={bestNotes}
          heatmap={heatmap} fbMarks={fbMarks}
          listenRequests={listenRequests} assignments={assignments} karte={karte}
          allScoreTargets={allScoreTargets} allItemTargets={allItemTargets} observations={observations}
        />
      )}
      {tab === "karte" && (
        <KarteBySong userId={userId} studentId={studentId} recordings={recordings} kartes={kartes} heatmap={heatmap} fbMarks={fbMarks} />
      )}
      {tab === "growth" && (
        karte ? (
          <>
            <div style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-sub)", margin: "0 2px 8px" }}>生徒に見えている成長カルテ・参考・直近30日</div>
            <ProgressPage userId={studentSupabaseUserId ?? ""} data={karte} readOnly detailBase={`/${userId}/teacher/students/${studentId}/growth`} />
          </>
        ) : (
          <Card><div style={{ fontSize: "var(--fs-body)", color: "var(--text-muted)" }}>成長カルテを読み込めませんでした。</div></Card>
        )
      )}
      {tab === "passed" && <PassedHwHistory items={passedItems} />}
      </div>
    </div>
  )
}

const kScoreColor = (n: number) => (n >= 90 ? "#2e8b57" : n >= 70 ? "#b7823a" : "#c0473a")
const kSec: React.CSSProperties = { fontSize: "var(--fs-caption)", fontWeight: 900, color: "var(--text-master)", margin: "14px 2px 8px", display: "flex", alignItems: "center", gap: 6 }
const kCat: React.CSSProperties = { fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--text-sub)", background: "#f7f8fa", border: "1px solid #eef1f4", borderRadius: 999, padding: "1px 7px", flex: "none" }

/* ═ 主役①: まとめ (上達状況＋アルコの診断)。強み/弱みは生徒側「記録の分析」と同じ土俵=音×成功率・直近2週間 ═ */
function SummaryTab({ userId, studentId, briefing, working, recordings, remarks, worstNotes, bestNotes, heatmap, fbMarks, listenRequests, assignments, karte, allScoreTargets, allItemTargets, observations }: {
  userId: string; studentId: string
  briefing: Briefing; working: WorkItem[]; recordings: Recording[]; remarks: RemarkTrack[]; worstNotes: WorstNote[]; bestNotes: BestNote[]
  heatmap: HeatmapData | null; fbMarks: FingerboardMark[]
  listenRequests: ListenReq[]; assignments: AssignmentRow[]; karte: KarteData | null
  allScoreTargets: Target[]; allItemTargets: Target[]; observations: ObservationRow[]
}) {
  const weak3 = worstNotes.slice(0, 3)
  void bestNotes // とくい一覧は指板ヒートマップに置換 (緑セル=とくい)
  const rmView = (s: RemarkTrack["status"]) => s === "improved" ? { mk: "✓", c: "#158253", t: "直ってきた" } : s === "improving" ? { mk: "△", c: "#c07a1e", t: "改善中" } : s === "stalled" ? { mk: "×", c: "#bb3a2e", t: "停滞" } : { mk: "…", c: "#8b97a8", t: "判定中" }
  const noteSub: React.CSSProperties = { fontSize: "var(--fs-label)", color: "var(--text-sub)" }
  const notePct: React.CSSProperties = { marginLeft: "auto", flex: "none", fontWeight: 900, fontVariantNumeric: "tabular-nums" }
  // 採点カルテ(添削)は廃止 (2026-08-11 Tetsuo確定)。返しはすべて練習後カルテ詳細で行う
  const karteHref = (perfId: string) => `/${userId}/teacher/students/${studentId}/karte/${perfId}?kind=score`
  const submittedHw = assignments.filter((a) => a.submitted && !a.done && a.scoreId)
  const achvMap = new Map(briefing.achievements.map((a) => [a.title, a.mastered]))
  // 見える化4軸 (曲/技術/癖/表現)
  const skillLit = karte?.skillMap ? karte.skillMap.nodes.filter((n) => n.state === "stable" || n.state === "wobble" || n.state === "acquired_nodata").length : null
  const skillTotal = karte?.skillMap?.nodes.length ?? 0
  const exprLit = karte ? karte.v2.exprMap.nodes.filter((n) => n.star > 0).length : null
  const kuseCount = new Set(observations.slice(0, 8).flatMap((o) => o.tagIds)).size

  return (
    <>
      <div style={{ background: "#eef2fb", border: "1px solid #dbe4f5", borderRadius: 12, padding: "10px 13px", marginBottom: 4 }}>
        <div style={{ fontSize: "var(--fs-caption)", fontWeight: 900, color: "#2b3d6b" }}>この生徒の今週</div>
        <div style={{ display: "flex", gap: 14, marginTop: 5, fontSize: "var(--fs-caption)", color: "#3a4a68", flexWrap: "wrap" }}>
          <span>直近7日の練習 <b style={{ color: "#1a2740" }}>{briefing.practiceCount7d}</b>回</span>
          <span>2週間のカルテ <b style={{ color: "#1a2740" }}>{working.reduce((s, w) => s + w.count, 0)}</b>枚</span>
          <span>達成 <b style={{ color: "#1a2740" }}>{briefing.achievements.length}</b></span>
        </div>
      </div>

      {/* 生徒が「見てほしい」と送った演奏 (丁寧に聴いて返す) */}
      {listenRequests.map((r) => (
        <div key={r.id} style={{ background: "#fff8ec", border: "1px solid #f0dcb4", borderRadius: 12, padding: "10px 12px", marginTop: 10 }}>
          <div style={{ fontSize: "var(--fs-label)", fontWeight: 900, color: "#a9741c", display: "flex", alignItems: "center", gap: 5 }}><Ear size={12} /> 生徒が「見てほしい」と送った演奏</div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 6 }}>
            <b style={{ fontSize: "var(--fs-body)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</b>
            <span style={{ marginLeft: "auto", flex: "none", fontWeight: 900, color: r.avg != null ? kScoreColor(r.avg) : "var(--text-muted)" }}>{r.avg ?? "—"}</span>
          </div>
          <Link href={karteHref(r.performanceId)} style={{ display: "block", textAlign: "center", marginTop: 8, fontSize: "var(--fs-caption)", fontWeight: 900, color: "#fff", background: "#a9741c", borderRadius: 8, padding: "8px 0", textDecoration: "none" }}>
            練習後カルテを書いて渡す →
          </Link>
        </div>
      ))}

      {/* 返し待ちの宿題 (出した→生徒がやった→先生が返す番) */}
      {submittedHw.map((a) => (
        <div key={a.id} style={{ background: "#fbfcff", border: "1px solid #d6e0f5", borderRadius: 12, padding: "10px 12px", marginTop: 10 }}>
          <div style={{ fontSize: "var(--fs-label)", fontWeight: 900, color: "#3b56d4", display: "flex", alignItems: "center", gap: 5 }}><Library size={12} /> 宿題の提出 ・ 先生が返す番</div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 6 }}>
            <b style={{ fontSize: "var(--fs-body)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.targetTitle}</b>
            <span style={{ marginLeft: "auto", flex: "none", fontWeight: 900, color: a.submittedScore != null ? kScoreColor(a.submittedScore) : "var(--text-muted)" }}>{a.submittedScore != null ? `${a.submittedScore}点` : "提出済み"}</span>
          </div>
          {a.moodTagId && <div style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: "#a9741c", marginTop: 3 }}>目標: {moodTagPhrase(a.moodTagId)}</div>}
          {/* 合格ボタンはここに置かない (演奏詳細を見ないと判断できない)。合格は練習後カルテ最下部で */}
          {a.submittedPerformanceId && (
            <Link href={karteHref(a.submittedPerformanceId)} style={{ display: "block", textAlign: "center", marginTop: 8, fontSize: "var(--fs-caption)", fontWeight: 900, color: "#fff", background: "#3b56d4", borderRadius: 8, padding: "8px 0", textDecoration: "none" }}>
              練習後カルテを書いて渡す →
            </Link>
          )}
        </div>
      ))}

      <div style={kSec}>練習曲・宿題の上達状況<span style={{ marginLeft: "auto", fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--text-muted)" }}>直近2週間 ・ タップで練習後カルテ</span></div>
      {working.length === 0 ? (
        <Card><div style={{ fontSize: "var(--fs-body)", color: "var(--text-muted)" }}>直近2週間の録音がありません。</div></Card>
      ) : (
        working.map((w, i) => {
          const mastered = achvMap.get(w.title)
          const delta = w.avg - w.first
          const badge = mastered === true
            ? { t: "マスター", c: "#b5651d", bg: "#fdf3df" }
            : mastered === false
              ? { t: "達成", c: "#158253", bg: "#e9f8f0" }
              : w.count >= 2 && delta >= 3
                ? { t: "改善 ↑", c: "#158253", bg: "#e9f8f0" }
                : w.count >= 2 && delta <= -3
                  ? { t: "下降 ↓", c: "#bb3a2e", bg: "#fdeceb" }
                  : null
          return (
            <Link key={i} href={`/${userId}/teacher/students/${studentId}/karte/${w.perfId}?kind=${w.kind}`}
              style={{ background: "#fff", border: "1px solid #e6e9ef", borderRadius: 11, padding: "9px 12px", marginBottom: 7, display: "flex", alignItems: "center", gap: 9, textDecoration: "none", color: "var(--text-ink)" }}>
              <span style={kCat}>{w.cat}</span>
              <span style={{ minWidth: 0 }}>
                <b style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.title}</b>
                {w.count >= 2 && (
                  <span style={{ fontSize: "var(--fs-label)", color: "var(--text-sub)", fontWeight: 700 }}>
                    {w.first} → <b style={{ color: "var(--text-ink)" }}>{w.avg}</b>{delta !== 0 ? `・${delta > 0 ? "+" : ""}${delta}` : ""} ・ {w.count}枚
                  </span>
                )}
              </span>
              {badge && <span style={{ marginLeft: "auto", flex: "none", fontSize: "var(--fs-label)", fontWeight: 900, color: badge.c, background: badge.bg, borderRadius: 999, padding: "2px 9px" }}>{badge.t}</span>}
              <span style={{ marginLeft: badge ? 0 : "auto", fontSize: "var(--fs-subhead)", fontWeight: 900, color: kScoreColor(w.avg), flex: "none" }}>{w.avg}</span>
              <span style={{ flex: "none", color: "#b6bfca" }}>›</span>
            </Link>
          )
        })
      )}

      {/* 上達の見える化 4軸 (曲/技術/癖/表現) */}
      <div style={kSec}>上達の見える化<span style={{ marginLeft: "auto", fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--text-muted)" }}>くわしくは成長カルテへ</span></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={{ background: "#fff", border: "1px solid #e6e9ef", borderRadius: 11, padding: "9px 11px" }}>
          <div style={{ fontSize: "var(--fs-label)", fontWeight: 900, color: "var(--text-sub)" }}>技術</div>
          <div style={{ fontSize: "var(--fs-subhead)", fontWeight: 900, marginTop: 3, color: "#22346b" }}>{skillLit ?? "—"}<span style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)", fontWeight: 800 }}>{skillLit != null ? ` /${skillTotal} 点灯` : ""}</span></div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e6e9ef", borderRadius: 11, padding: "9px 11px" }}>
          <div style={{ fontSize: "var(--fs-label)", fontWeight: 900, color: "var(--text-sub)" }}>癖</div>
          <div style={{ fontSize: "var(--fs-subhead)", fontWeight: 900, marginTop: 3, color: kuseCount > 0 ? "#c07a1e" : "var(--text-muted)" }}>{kuseCount}<span style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)", fontWeight: 800 }}> 記録中</span></div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e6e9ef", borderRadius: 11, padding: "9px 11px" }}>
          <div style={{ fontSize: "var(--fs-label)", fontWeight: 900, color: "var(--text-sub)" }}>表現</div>
          <div style={{ fontSize: "var(--fs-subhead)", fontWeight: 900, marginTop: 3, color: "#7a4dd6" }}>{exprLit ?? "—"}<span style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)", fontWeight: 800 }}> 認定</span></div>
        </div>
      </div>

      {/* アルコの診断レポート (モック画面2: 紫グラデヘッダー) */}
      <div style={{ border: "1px solid #e3d8f7", borderRadius: 15, overflow: "hidden", marginTop: 14, boxShadow: "0 4px 16px -8px rgba(110,60,190,.3)" }}>
        <div style={{ background: "linear-gradient(135deg,#5a3fa8,#7a4dd6)", color: "#fff", padding: "10px 14px" }}>
          <div style={{ fontSize: "var(--fs-caption)", fontWeight: 900 }}>アルコの診断レポート</div>
          <div style={{ fontSize: "var(--fs-label)", color: "#e2d6fb", marginTop: 2 }}>音程マップ・直近2週間 {heatmap ? `${heatmap.perfCount}演奏分` : ""}</div>
        </div>
        <div style={{ background: "#fff", padding: "12px 14px" }}>
        {/* 音程 = 指板ヒートマップ (2026-08-11 Tetsuo確定: 文章のにがて/とくい一覧を指板に置換)。
            リズム系は指板で表現できないため下のリズム欄が残る */}
        {heatmap ? (
          <FingerboardPanel cells={heatmap.cells} details={heatmap.details} marks={fbMarks}
            emptyText="直近2週間はまだ判定できる音が少ないよ・同じ音を5回以上ひくと色がつきます。" />
        ) : (
          <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-sub)" }}>音程マップを読み込めませんでした。</div>
        )}
        {/* リズムのにがて (指板は音程専用のため、リズム由来の崩れだけ文章で残す) */}
        {weak3.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: "var(--fs-label)", fontWeight: 900, color: "#b7823a" }}>リズムもふくめた にがて上位</div>
            <div style={{ marginTop: 4 }}>
              {weak3.map((n) => (
                <div key={n.raw} style={{ display: "flex", alignItems: "baseline", gap: 7, fontSize: "var(--fs-caption)", marginBottom: 4, flexWrap: "wrap" }}>
                  <b style={{ width: 44, flex: "none" }}>{n.kana}</b>
                  <span style={noteSub}>{n.hand ? `${n.hand}` : n.string ? `${n.string}` : n.raw}・{n.target}音</span>
                  <b style={{ ...notePct, color: kScoreColor(n.pct) }}>{n.pct}%</b>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* 指摘トラッキング: 前に指摘したこと、直った? */}
        {remarks.length > 0 && (
          <>
            <div style={{ fontSize: "var(--fs-label)", fontWeight: 900, color: "#a9741c", marginTop: 10 }}>前に指摘したこと、直った？</div>
            <div style={{ marginTop: 4 }}>
              {remarks.map((rm, i) => {
                const st = rmView(rm.status)
                return (
                  <div key={i} style={{ fontSize: "var(--fs-caption)", color: "#3a3550", lineHeight: 1.6, marginBottom: 5 }}>
                    <span style={{ color: st.c, fontWeight: 900, marginRight: 5 }}>{st.mk}</span>
                    <b>{rm.label}</b> <span style={{ color: st.c, fontWeight: 800 }}>{st.t}</span>
                    {rm.from != null && rm.to != null && <span style={{ color: "var(--text-sub)" }}> ・{rm.from}→{rm.to}%</span>}
                    {rm.recommend && <div style={{ fontSize: "var(--fs-label)", color: "#3b56d4", fontWeight: 800, marginLeft: 17, marginTop: 1 }}>◇ おすすめ：{rm.recommend}</div>}
                  </div>
                )
              })}
            </div>
          </>
        )}
        {/* 指導提案は廃止 (2026-08-11 Tetsuo確定: 指導=練習後カルテへの返し+宿題がその役割) */}
        </div>
      </div>

      {/* 指導メニュー (宿題を出す)。表現認定は「その曲の練習後カルテ詳細」に移設 (2026-08-11 Tetsuo指摘) */}
      <div style={kSec}>指導メニュー</div>
      <details style={{ background: "#fff", border: "1px solid #e6e9ef", borderRadius: 12, marginBottom: 8 }}>
        <summary style={{ cursor: "pointer", padding: "11px 13px", fontSize: "var(--fs-caption)", fontWeight: 900, color: "#22346b" }}>宿題を出す・やりとり中の宿題</summary>
        <div style={{ padding: "0 6px 6px" }}>
          <Homework studentId={studentId} scoreTargets={allScoreTargets} itemTargets={allItemTargets} assignments={assignments} />
        </div>
      </details>
      {briefing.goal && (
        <div style={{ fontSize: "var(--fs-label)", color: "var(--text-sub)", margin: "2px 2px 0", fontWeight: 700 }}>
          生徒の目標: <b style={{ color: "var(--text-ink)" }}>{briefing.goal.songName}</b>{briefing.goal.songStar != null ? ` ★${briefing.goal.songStar}` : ""}{briefing.goal.goalDate ? ` ・ ${briefing.goal.goalDate}まで` : ""}
        </div>
      )}
    </>
  )
}


/* ═ 主役②: 練習後カルテ (曲別。曲→この曲のカルテを横スライド) ═ */
type SongGroup = { title: string; cat: string; kind: "score" | "practice"; star: number | null; recs: Recording[]; count: number; latest: Recording; trend: number }
function KarteBySong({ userId, studentId, recordings, kartes, heatmap, fbMarks }: { userId: string; studentId: string; recordings: Recording[]; kartes: KarteRow[]; heatmap: HeatmapData | null; fbMarks: FingerboardMark[] }) {
  // カルテ再設計 (2026-08-11 Tetsuo確定・案2): サブタブで「カルテを書く」と「カルテをふりかえる」を分離。
  // 書く = 曲一覧(書くための入口)。ふりかえる = 全体の分析(音程マップ) + 今までのカルテ(月別・概要カード横スライド)。
  const [kmode, setKmode] = useState<"write" | "review">("write")
  const [karteFilter, setKarteFilter] = useState<string>("all")
  const [openKarte, setOpenKarte] = useState<KarteRow | null>(null)
  const order: string[] = []
  const groups = new Map<string, Recording[]>()
  for (const r of recordings) {
    if (!groups.has(r.title)) { groups.set(r.title, []); order.push(r.title) }
    groups.get(r.title)!.push(r)
  }
  const kartesByTitle = new Map<string, KarteRow[]>()
  for (const k of kartes) {
    if (!kartesByTitle.has(k.title)) kartesByTitle.set(k.title, [])
    kartesByTitle.get(k.title)!.push(k)
  }
  const gs: SongGroup[] = order.map((title) => {
    const recs = groups.get(title)!
    const latest = recs[0]
    const earliest = recs[recs.length - 1]
    return { title, cat: latest.cat, kind: latest.kind, star: latest.star, recs, count: recs.length, latest, trend: latest.avg - earliest.avg }
  })
  // 演奏が36件枠から落ちてもカルテがある曲は出す (カルテだけのグループ)
  const karteOnly: { title: string; kind: "score" | "practice"; targetId: string }[] = []
  for (const [title, ks] of kartesByTitle) {
    if (!groups.has(title)) karteOnly.push({ title, kind: ks[0].kind, targetId: ks[0].targetId })
  }
  // 曲は難易度★の低い順 (未設定は末尾)、同★は最新の点の高い順
  const songs = gs.filter((g) => g.kind === "score").sort((a, b) => (a.star ?? 99) - (b.star ?? 99) || b.latest.avg - a.latest.avg)
  const basics = gs.filter((g) => g.kind === "practice").sort((a, b) => (a.star ?? 99) - (b.star ?? 99))

  const renderKarteList = (title: string, kind: "score" | "practice", targetId: string | null) => {
    const ks = kartesByTitle.get(title) ?? []
    return (
      <>
        <div style={{ fontSize: "var(--fs-label)", fontWeight: 900, color: "#22346b", margin: "2px 0 6px" }}>
          練習後カルテ・{ks.length}枚
        </div>
        {ks.length === 0 ? (
          <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", marginBottom: 8 }}>まだカルテがありません。下のボタンから書けます。</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
            {ks.map((k) => (
              <div key={k.id} style={{ background: "#fbfcfe", border: "1px solid #e6e9ef", borderRadius: 10, padding: "8px 11px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "var(--fs-label)", fontWeight: 900, color: "var(--text-muted)" }}>{k.date}</span>
                  <span style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: k.read ? "#2f9e63" : "#b58a1e" }}>{k.read ? "既読" : "未読"}</span>
                </div>
                <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-body)", marginTop: 4, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{k.body}</div>
              </div>
            ))}
          </div>
        )}
        {targetId && (
          <Link href={`/${userId}/teacher/students/${studentId}/karte/write?kind=${kind}&target=${targetId}`}
            style={{ display: "block", textAlign: "center", fontSize: "var(--fs-caption)", fontWeight: 900, color: "#fff", background: "#22346b", borderRadius: 10, padding: "10px 0", textDecoration: "none" }}>
            練習後カルテを書く→
          </Link>
        )}
      </>
    )
  }

  const renderGroup = (g: SongGroup) => {
    const kCount = (kartesByTitle.get(g.title) ?? []).length
    return (
      <details key={g.title} style={{ background: "#fff", border: "1px solid #e6e9ef", borderRadius: 13, marginBottom: 8 }}>
        <summary style={{ listStyle: "none", cursor: "pointer", padding: "11px 13px", display: "flex", alignItems: "center", gap: 9 }}>
          {g.star != null
            ? <span style={{ flex: "none", fontSize: "var(--fs-label)", fontWeight: 900, color: "#b58a1e" }}>★{g.star}</span>
            : <span style={kCat}>{g.cat}</span>}
          <b style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-ink)" }}>{g.title}</b>
          <span style={{ marginLeft: "auto", flex: "none", textAlign: "right", fontSize: "var(--fs-label)", color: "var(--text-muted)", fontWeight: 800, lineHeight: 1.35 }}>カルテ{kCount}枚<br />{g.latest.date}</span>
          <span style={{ flex: "none", fontSize: "var(--fs-subhead)", fontWeight: 900, color: kScoreColor(g.latest.avg) }}>{g.latest.avg}</span>
        </summary>
        <div style={{ padding: "0 13px 12px" }}>
          <SongTrendCard g={g} />
          {renderKarteList(g.title, g.kind, g.latest.targetId)}
        </div>
      </details>
    )
  }

  if (recordings.length === 0 && kartes.length === 0) {
    return <Card><div style={{ fontSize: "var(--fs-body)", color: "var(--text-muted)" }}>まだ演奏がありません。</div></Card>
  }

  // ふりかえる: 月別グループ (新しい順) + 曲フィルタ
  const filtered = karteFilter === "all" ? kartes : kartes.filter((k) => k.title === karteFilter)
  const months: { key: string; label: string; rows: KarteRow[] }[] = []
  for (const k of filtered) {
    let m = months.find((x) => x.key === k.monthKey)
    if (!m) { m = { key: k.monthKey, label: k.monthLabel, rows: [] }; months.push(m) }
    m.rows.push(k)
  }
  const filterTitles = [...new Set(kartes.map((k) => k.title))]

  const subTab = (k: "write" | "review", label: string) => (
    <button key={k} type="button" onClick={() => setKmode(k)}
      style={{ flex: 1, border: "none", borderRadius: 7, padding: "7px 0", fontSize: "var(--fs-caption)", fontWeight: 900, cursor: "pointer",
        background: kmode === k ? "#fff" : "transparent", color: kmode === k ? "#22346b" : "#8b97a8",
        boxShadow: kmode === k ? "0 1px 3px rgba(30,40,70,.12)" : "none" }}>
      {label}
    </button>
  )

  return (
    <>
      {/* サブタブ: 書く / ふりかえる (2026-08-11 Tetsuo確定・案2) */}
      <div style={{ display: "flex", gap: 4, background: "#e7ebf2", borderRadius: 9, padding: 4, marginBottom: 11 }}>
        {subTab("write", "カルテを書く")}
        {subTab("review", "カルテをふりかえる")}
      </div>

      {kmode === "write" ? (
        <>
          <div style={kSec}>曲をえらんでカルテを書く<span style={{ marginLeft: "auto", fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--text-muted)" }}>カルテ枚数・直近</span></div>
          {songs.length === 0 ? (
            <Card><div style={{ fontSize: "var(--fs-body)", color: "var(--text-muted)" }}>曲の演奏がまだありません。</div></Card>
          ) : songs.map(renderGroup)}
          {basics.length > 0 && (
            <>
              <div style={kSec}>基礎練・教材<span style={{ marginLeft: "auto", fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--text-muted)" }}>カルテ枚数・直近</span></div>
              {basics.map(renderGroup)}
            </>
          )}
          {karteOnly.map((g) => (
            <details key={g.title} style={{ background: "#fff", border: "1px solid #e6e9ef", borderRadius: 13, marginBottom: 8 }}>
              <summary style={{ listStyle: "none", cursor: "pointer", padding: "11px 13px", display: "flex", alignItems: "center", gap: 9 }}>
                <b style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-ink)" }}>{g.title}</b>
                <span style={{ marginLeft: "auto", flex: "none", fontSize: "var(--fs-label)", color: "var(--text-muted)", fontWeight: 800 }}>カルテ{(kartesByTitle.get(g.title) ?? []).length}枚</span>
              </summary>
              <div style={{ padding: "0 13px 12px" }}>{renderKarteList(g.title, g.kind, g.targetId)}</div>
            </details>
          ))}
        </>
      ) : (
        <>
          {/* 全体の分析 (音程マップ) = ふりかえりの一部 */}
          <div style={{ border: "1px solid #e3d8f7", borderRadius: 13, overflow: "hidden", marginBottom: 11 }}>
            <div style={{ background: "linear-gradient(135deg,#5a3fa8,#7a4dd6)", color: "#fff", padding: "8px 12px" }}>
              <div style={{ fontSize: "var(--fs-caption)", fontWeight: 900 }}>全体の分析・曲をまたいで</div>
              <div style={{ fontSize: "var(--fs-label)", color: "#e2d6fb", marginTop: 1 }}>音程マップ・直近2週間{heatmap ? `・${heatmap.perfCount}演奏分` : ""}・タップでくわしく</div>
            </div>
            <div style={{ background: "#fff", padding: "9px 12px" }}>
              {heatmap ? (
                <FingerboardPanel cells={heatmap.cells} details={heatmap.details} marks={fbMarks}
                  emptyText="直近2週間はまだ判定できる音が少ないよ・同じ音を5回以上ひくと色がつきます。" />
              ) : (
                <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)" }}>音程マップを読み込めませんでした。</div>
              )}
            </div>
          </div>

          {/* 今までのカルテ (月別・概要カード横スライド・タップで全文) */}
          <div style={kSec}>今までのカルテ<span style={{ marginLeft: "auto", fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--text-muted)" }}>{kartes.length}枚・タップで全文</span></div>
          {kartes.length === 0 ? (
            <Card><div style={{ fontSize: "var(--fs-body)", color: "var(--text-muted)" }}>まだカルテがありません。「カルテを書く」から1枚目を書けます。</div></Card>
          ) : (
            <>
              {filterTitles.length > 1 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 9 }}>
                  {[["all", "すべて"] as const, ...filterTitles.map((t) => [t, t] as const)].map(([v, label]) => (
                    <button key={v} type="button" onClick={() => setKarteFilter(v)}
                      style={{ fontSize: "var(--fs-label)", fontWeight: 900, borderRadius: 999, padding: "4px 12px", cursor: "pointer",
                        border: `1px solid ${karteFilter === v ? "#22346b" : "#e6e9ef"}`,
                        background: karteFilter === v ? "#22346b" : "#fff", color: karteFilter === v ? "#fff" : "#8b97a8",
                        maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
              {months.map((m) => (
                <div key={m.key}>
                  <div style={{ fontSize: "var(--fs-label)", fontWeight: 900, color: "var(--text-muted)", margin: "8px 2px 5px", letterSpacing: ".04em" }}>{m.label}・{m.rows.length}枚</div>
                  <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, scrollbarWidth: "thin" }}>
                    {m.rows.map((k) => (
                      <div key={k.id} onClick={() => setOpenKarte(k)}
                        style={{ flex: "none", width: 150, background: "#fff", border: "1px solid #e6e9ef", borderRadius: 12, padding: "9px 11px", boxSizing: "border-box", cursor: "pointer" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--text-muted)" }}>
                          <b style={{ color: "var(--text-ink)" }}>{k.date}</b>
                          <span style={{ marginLeft: "auto", color: k.read ? "#2f9e63" : "#b58a1e" }}>{k.read ? "既読" : "未読"}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4, minWidth: 0 }}>
                          <span style={{ flex: "none", fontSize: "var(--fs-label)", fontWeight: 900, color: "var(--text-muted)", background: "#f2f4f8", border: "1px solid #e6eaf1", borderRadius: 5, padding: "0 5px" }}>{k.cat}</span>
                          <span style={{ fontWeight: 900, color: "#2f66c4", fontSize: "var(--fs-label)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k.title}</span>
                        </div>
                        <div style={{ marginTop: 7, fontSize: "var(--fs-label)", fontWeight: 900, color: "#8b97a8", textAlign: "right" }}>タップで全文 →</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* 全文モーダル */}
          {openKarte && (
            <div onClick={() => setOpenKarte(null)}
              style={{ position: "fixed", inset: 0, background: "rgba(15,25,50,.55)", zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: 14 }}>
              <div onClick={(e) => e.stopPropagation()}
                style={{ background: "#fff", borderRadius: 15, padding: "13px 16px 16px", width: "min(560px, 94vw)", maxHeight: "84vh", overflowY: "auto", boxSizing: "border-box" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--text-muted)" }}>
                  <b style={{ color: "var(--text-ink)", fontSize: "var(--fs-caption)" }}>{openKarte.date}</b>
                  <span style={{ flex: "none", background: "#f2f4f8", border: "1px solid #e6eaf1", borderRadius: 5, padding: "0 5px", fontWeight: 900 }}>{openKarte.cat}</span>
                  <span style={{ fontWeight: 900, color: "#2f66c4", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{openKarte.title}</span>
                  <button type="button" onClick={() => setOpenKarte(null)}
                    style={{ marginLeft: "auto", flex: "none", fontSize: "var(--fs-label)", fontWeight: 900, color: "var(--text-muted)", background: "#f1f4f8", border: "none", borderRadius: 999, padding: "5px 12px", cursor: "pointer" }}>
                    とじる ×
                  </button>
                </div>
                <div style={{ marginTop: 9, fontSize: "var(--fs-body)", color: "var(--text-body)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{openKarte.body}</div>
                <div style={{ marginTop: 8, fontSize: "var(--fs-label)", fontWeight: 800, color: openKarte.read ? "#2f9e63" : "#b58a1e" }}>{openKarte.read ? "既読・生徒が読みました" : "未読・まだ生徒は読んでいません"}</div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}


/* ═ この曲の傾向カード (カルテN枚の推移 + よく崩れる所 + AI提案文) ═ */
function SongTrendCard({ g }: { g: SongGroup }) {
  // この曲の全カルテから崩れを合算 (成功率の低い順・上位2)
  const agg = new Map<string, { tree: "音程" | "リズム"; miss: number; target: number }>()
  for (const r of g.recs) for (const w of r.weak) {
    const e = agg.get(w.name) ?? { tree: w.tree, miss: 0, target: 0 }
    e.miss += w.miss; e.target += w.target
    agg.set(w.name, e)
  }
  const topWeak = [...agg.entries()]
    .map(([name, e]) => ({ name, tree: e.tree, pct: Math.max(0, Math.round(100 - (e.miss / Math.max(1, e.target)) * 100)) }))
    .sort((a, b) => a.pct - b.pct).slice(0, 2)
  if (g.count < 2 && topWeak.length === 0) return null
  return (
    <div style={{ background: "#faf7ff", border: "1px solid #e7dcfb", borderRadius: 10, padding: "9px 11px", marginBottom: 9 }}>
      <div style={{ fontSize: "var(--fs-label)", fontWeight: 900, color: "#7a4dd6" }}>この曲の傾向</div>
      {g.count >= 2 && (
        <div style={{ fontSize: "var(--fs-caption)", color: "#3a3550", marginTop: 4, fontWeight: 700 }}>
          カルテ{g.count}枚で {g.recs[g.recs.length - 1].avg} → <b>{g.latest.avg}</b>・{g.trend > 2 ? `改善 +${g.trend}` : g.trend < -2 ? `${g.trend}` : "横ばい"}
        </div>
      )}
      {topWeak.map((w) => (
        <div key={w.name} style={{ fontSize: "var(--fs-caption)", color: "#3a3550", marginTop: 3, lineHeight: 1.55 }}>
          <span style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: w.tree === "音程" ? "#c0473a" : "#b7823a", background: w.tree === "音程" ? "#fbecea" : "#fbf1e2", borderRadius: 999, padding: "1px 6px", marginRight: 5 }}>{w.tree}</span>
          {w.name} 成功率{w.pct}%
        </div>
      ))}
      {topWeak.length > 0 && (
        <div style={{ fontSize: "var(--fs-label)", color: "#136647", fontWeight: 800, marginTop: 5, lineHeight: 1.55 }}>
          提案：まず「{topWeak[0].name}」をゆっくり取り出して。合ってきたら通しで確認しよう。
        </div>
      )}
    </div>
  )
}


function Card({ children }: { children: React.ReactNode }) {
  // ペーパーデザイン (2026-08-06): クリームの紙の上の半透明カード (成長カルテv3と同トークン)
  return (
    <div style={{ background: "#fff", border: "1px solid #e6e9ef", borderRadius: 15, padding: "14px 16px", marginBottom: 12 }}>
      {children}
    </div>
  )
}





/** 宿題カード内の表現クリア認定ボタン (2026-08-06・案C 宿題側入口) */
function AssignmentExprClearButton({ studentId, moodTagId, scoreId }: { studentId: string; moodTagId: string; scoreId: string }) {
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle")
  const [star, setStar] = useState<number | null>(null)
  if (state === "done") {
    return <span style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-good)" }}>✓ 表現クリア認定{star != null ? `・★${star}相当` : ""}</span>
  }
  return (
    <button type="button" disabled={state === "saving"}
      onClick={async () => {
        setState("saving")
        const r = await recordExpressionClear({ studentId, moodTagId, scoreId })
        if (r.ok) { setStar(r.star); setState("done") } else setState("error")
      }}
      style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-on-accent)", background: "#8a5a1f", border: "none", borderRadius: 999, padding: "3px 10px", cursor: "pointer", opacity: state === "saving" ? 0.6 : 1 }}>
      {state === "saving" ? "記録中…" : state === "error" ? "失敗・もう一度" : "表現できていた → クリア認定"}
    </button>
  )
}


/** 楽譜を渡す (2026-08-02): 先生が MusicXML をアップロード → 生徒のライブラリーに追加される */
function SendScoreBox({ studentId }: { studentId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [composer, setComposer] = useState("")
  const [comment, setComment] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, start] = useTransition()

  const submit = () => {
    setMsg(null)
    if (!file) { setMsg({ ok: false, text: "MusicXMLファイルを選んでください" }); return }
    if (!title.trim()) { setMsg({ ok: false, text: "曲名を入力してください" }); return }
    const fd = new FormData()
    fd.append("title", title)
    fd.append("composer", composer)
    fd.append("comment", comment)
    fd.append("file", file)
    start(async () => {
      const r = await uploadScoreForStudent(studentId, fd)
      if (r.ok) {
        setMsg({ ok: true, text: "楽譜を渡しました！生徒のライブラリーに追加され、準備ができると演奏できます。" })
        setOpen(false); setTitle(""); setComposer(""); setComment(""); setFile(null)
        router.refresh()
      } else {
        setMsg({ ok: false, text: r.error })
      }
    })
  }

  const inp: React.CSSProperties = { width: "100%", border: "1px solid #dfe3e8", borderRadius: 8, padding: "8px 10px", fontSize: "var(--fs-body)", marginTop: 4 }
  const lbl: React.CSSProperties = { fontSize: "var(--fs-caption)", fontWeight: 700, color: "var(--text-sub)" }

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={() => { setOpen(true); setMsg(null) }}
          style={{ width: "100%", border: "1px dashed #b7c0ca", background: "#fff", color: "var(--text-ink)", borderRadius: 12, padding: 12, fontSize: "var(--fs-body)", fontWeight: 800, cursor: "pointer", marginBottom: 14, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        >
          <FileMusic size={15} /> 楽譜を渡す
        </button>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #eef1f4", borderRadius: 14, padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-ink)", marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}><FileMusic size={14} /> 楽譜を渡す</div>
          <label style={lbl}>MusicXMLファイル・.xml / .musicxml / .mxl・5MBまで
            <input type="file" accept=".xml,.musicxml,.mxl" style={{ ...inp, padding: "7px 8px" }}
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null
                setFile(f)
                if (f && !title.trim()) setTitle(f.name.replace(/\.(xml|musicxml|mxl)$/i, ""))
              }} />
          </label>
          <label style={{ ...lbl, display: "block", marginTop: 10 }}>曲名
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例: きらきら星 変奏曲" style={inp} maxLength={100} />
          </label>
          <label style={{ ...lbl, display: "block", marginTop: 10 }}>作曲者
            <input value={composer} onChange={(e) => setComposer(e.target.value)} placeholder="例: モーツァルト" style={inp} maxLength={100} />
          </label>
          <label style={{ ...lbl, display: "block", marginTop: 10 }}>ひとこと
            <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="例: 次のレッスンまでに1ページ目をさらっておいてね" style={inp} maxLength={200} />
          </label>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button type="button" onClick={() => setOpen(false)} style={{ flex: 1, border: "1px solid #e2e6ea", background: "#fff", color: "var(--text-sub)", borderRadius: 10, padding: 10, fontSize: "var(--fs-body)", fontWeight: 800, cursor: "pointer" }}>キャンセル</button>
            <button type="button" onClick={submit} disabled={pending} style={{ flex: 2, border: "none", background: "#8a5a1f", color: "var(--text-on-accent)", borderRadius: 10, padding: 10, fontSize: "var(--fs-body)", fontWeight: 800, cursor: "pointer", opacity: pending ? 0.6 : 1 }}>
              {pending ? "アップロード中…" : "生徒に渡す"}
            </button>
          </div>
        </div>
      )}
      {msg && <div style={{ fontSize: "var(--fs-body)", margin: "0 0 10px", color: msg.ok ? "#2e8b57" : "#c0392b" }}>{msg.text}</div>}
    </>
  )
}


function Homework({
  studentId, scoreTargets, itemTargets, assignments,
}: {
  studentId: string
  scoreTargets: Target[]
  listenRequests?: ListenReq[]
  itemTargets: Target[]
  assignments: AssignmentRow[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<"score" | "item">("score")
  const [targetId, setTargetId] = useState("")
  const [filter, setFilter] = useState("")
  const [reps, setReps] = useState("")
  const [tempo, setTempo] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [goalType, setGoalType] = useState<"" | "score" | "achieve" | "master">("")
  const [targetScore, setTargetScore] = useState("")
  const [comment, setComment] = useState("")
  const [moodTagId, setMoodTagId] = useState("")
  const [err, setErr] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const targets = kind === "score" ? scoreTargets : itemTargets
  const q = filter.trim().toLowerCase()
  const filtered = q ? targets.filter((t) => t.title.toLowerCase().includes(q)) : targets
  // 難易度/カテゴリ(group)ごとにまとめて optgroup 表示 (並列プルダウンを避ける)
  const grouped = new Map<string, Target[]>()
  for (const t of filtered) {
    const g = t.group ?? "その他"
    const arr = grouped.get(g)
    if (arr) arr.push(t)
    else grouped.set(g, [t])
  }

  const submit = () => {
    setErr(null)
    if (!targetId) { setErr("対象の曲/教材を選んでください"); return }
    startTransition(async () => {
      const r = await createAssignment({
        studentId,
        scoreId: kind === "score" ? targetId : null,
        practiceItemId: kind === "item" ? targetId : null,
        reps: reps ? Number(reps) : null,
        targetTempo: tempo ? Number(tempo) : null,
        comment: comment || null,
        dueDate: dueDate || null,
        goalType: goalType || null,
        targetScore: goalType === "score" && targetScore ? Number(targetScore) : null,
        moodTagId: moodTagId || null,
      })
      if (!r.ok) { setErr(r.error); return }
      setOpen(false); setTargetId(""); setReps(""); setTempo(""); setComment("")
      setDueDate(""); setGoalType(""); setTargetScore(""); setMoodTagId("")
      router.refresh()
    })
  }

  const inp: React.CSSProperties = { width: "100%", border: "1px solid #dfe3e8", borderRadius: 8, padding: "8px 10px", fontSize: "var(--fs-body)", marginTop: 4 }
  const lbl: React.CSSProperties = { fontSize: "var(--fs-caption)", fontWeight: 700, color: "var(--text-sub)" }

  return (
    <>
      <SendScoreBox studentId={studentId} />
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{ width: "100%", border: "1px dashed #b7c0ca", background: "#fff", color: "var(--text-ink)", borderRadius: 12, padding: 12, fontSize: "var(--fs-body)", fontWeight: 800, cursor: "pointer", marginBottom: 14 }}
        >
          ＋ 宿題を出す
        </button>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #eef1f4", borderRadius: 14, padding: 16, marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {([["score", "曲"], ["item", "教材"]] as const).map(([k, label]) => (
              <button key={k} type="button" onClick={() => { setKind(k); setTargetId(""); setFilter("") }}
                style={{ flex: 1, border: "1px solid", borderColor: kind === k ? "#8a5a1f" : "#e8e0cc", background: kind === k ? "#8a5a1f" : "rgba(255,255,255,.7)", color: kind === k ? "#fff" : "#9a8c74", borderRadius: 8, padding: "6px 0", fontSize: "var(--fs-body)", fontWeight: 800, cursor: "pointer" }}>
                {label}
              </button>
            ))}
          </div>

          <label style={lbl}>対象の{kind === "score" ? "曲" : "教材"}を選ぶ
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="名前で絞り込み"
              style={inp}
            />
            <select value={targetId} onChange={(e) => setTargetId(e.target.value)} style={{ ...inp, marginTop: 6 }}>
              <option value="">選択してください・{filtered.length}件</option>
              {[...grouped.entries()].map(([g, items]) => (
                <optgroup key={g} label={g}>
                  {items.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                </optgroup>
              ))}
            </select>
          </label>
          {targets.length === 0 && (
            <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", marginTop: 4 }}>選べる{kind === "score" ? "曲" : "教材"}がありません。</div>
          )}

          {/* 回数・目標♩は廃止 (2026-08-11 Tetsuo確定: 設定不要) */}
          <label style={{ ...lbl, display: "block", marginTop: 10 }}>提出期限
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inp} />
          </label>

          {/* 2026-08-11 Tetsuo確定: ゴール=先生が設定する点数のみ。クリア=提出→先生の合格 */}
          <label style={{ ...lbl, display: "block", marginTop: 10 }}>ゴール・合格ラインの点数・任意
            <input value={targetScore} onChange={(e) => { setTargetScore(clampNumStr(e.target.value, 100)); setGoalType(e.target.value ? "score" : "") }} placeholder="80" style={inp} inputMode="numeric" />
          </label>
          <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", marginTop: 4 }}>クリアは、生徒の提出をあなたが「合格」にしたときです。</div>

          {/* 意識する表現 (2026-08-05): 統一雰囲気タグから1つ。「この曲では◯◯を意識しよう」 */}
          <label style={{ ...lbl, display: "block", marginTop: 10 }}><Palette size={12} style={{ verticalAlign: -1, marginRight: 4 }} />意識する表現
            <select value={moodTagId} onChange={(e) => setMoodTagId(e.target.value)} style={inp}>
              <option value="">なし</option>
                            {MOOD_TAG_DEFS.map((t) => (
                <option key={t.id} value={t.id}>{moodTagLabel(t.id)}</option>
              ))}
            </select>
          </label>

          <label style={{ ...lbl, display: "block", marginTop: 10 }}>コメント
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} maxLength={500} placeholder="例: 移弦を先に準備しよう" style={{ ...inp, resize: "vertical" }} />
          </label>

          {err && <div style={{ fontSize: "var(--fs-body)", color: "var(--text-error)", marginTop: 8 }}>{err}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button type="button" onClick={() => setOpen(false)} style={{ flex: 1, border: "1px solid #e2e6ea", background: "#fff", color: "var(--text-sub)", borderRadius: 10, padding: 10, fontSize: "var(--fs-body)", fontWeight: 800, cursor: "pointer" }}>キャンセル</button>
            <button type="button" onClick={submit} disabled={pending} style={{ flex: 2, border: "none", background: "#8a5a1f", color: "var(--text-on-accent)", borderRadius: 10, padding: 10, fontSize: "var(--fs-body)", fontWeight: 800, cursor: "pointer", opacity: pending ? 0.6 : 1 }}>
              {pending ? "送信中…" : "宿題を出す"}
            </button>
          </div>
        </div>
      )}

      <div style={{ fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-sub)", margin: "4px 0 8px" }}>これまでの宿題</div>
      {assignments.length === 0 ? (
        <div style={{ fontSize: "var(--fs-body)", color: "var(--text-muted)" }}>まだ宿題はありません。</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {assignments.map((a) => (
            <div key={a.id} style={{ background: "#fff", border: "1px solid #eef1f4", borderRadius: 12, padding: "10px 12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                <span style={{ fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-ink)" }}>{a.targetTitle}</span>
                {(() => {
                  if (!a.submitted) return <span style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-master)", flex: "none" }}>未提出</span>
                  const passed = scorePassed(a.goalType, a.targetScore, a.submittedScore)
                  const base = `提出済${a.submittedScore != null ? ` ${a.submittedScore}点` : ""}`
                  return <span style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: passed === false ? "#c0392b" : "#2e8b57", flex: "none" }}>{base}{passed === true ? " ・合格" : passed === false ? " ・あと少し" : ""}</span>
                })()}
              </div>
              <div style={{ fontSize: "var(--fs-body)", color: "var(--text-sub)", marginTop: 3 }}>
                {[a.reps && `×${a.reps}`, a.targetTempo && `♩=${a.targetTempo}`].filter(Boolean).join(" ・ ") || ""}
              </div>
              {(dueInfo(a.dueDate) || goalLabel(a.goalType, a.targetScore)) && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                  {(() => {
                    const di = dueInfo(a.dueDate)
                    if (!di) return null
                    const c = DUE_COLOR[di.state]
                    return (
                      <span style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: c.fg, background: c.bg, border: `1px solid ${c.border}`, borderRadius: 999, padding: "2px 8px" }}>
                        期限 {di.label}{di.state === "overdue" ? "" : di.state === "soon" ? "" : ""}
                      </span>
                    )
                  })()}
                  {goalLabel(a.goalType, a.targetScore) && (
                    <span style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-link)", background: "#eef1fe", border: "1px solid #d6ddff", borderRadius: 999, padding: "2px 8px" }}>
                      {goalLabel(a.goalType, a.targetScore)}
                    </span>
                  )}
                  {(() => {
                    const gr = goalResult(a.goalType, { achieved: a.achieved, mastered: a.mastered })
                    if (!gr || a.goalType === "score") return null
                    return (
                      <span style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: gr.met ? "#2e8b57" : "#9aa6b3", background: gr.met ? "#e9f7ef" : "#f1f4f8", border: `1px solid ${gr.met ? "#cbe8d6" : "#e2e6ea"}`, borderRadius: 999, padding: "2px 8px" }}>
                        {gr.label}
                      </span>
                    )
                  })()}
                </div>
              )}
              {a.comment && <div style={{ fontSize: "var(--fs-body)", color: "var(--text-ink)", marginTop: 4, display: "flex", gap: 5 }}><MessageCircle size={13} style={{ flex: "none", marginTop: 2 }} /> <span>{a.comment}</span></div>}
              {/* 🎨 意識する表現 (2026-08-06・案C 宿題側入口): 提出済みなら聴いてクリア認定できる */}
              {a.moodTagId && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                  <span style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-master)", background: "#fdf3d8", border: "1px solid #eed9a0", borderRadius: 999, padding: "2px 8px", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Palette size={11} /> {moodTagPhrase(a.moodTagId)}
                  </span>
                  {a.submitted && a.scoreId && (
                    <AssignmentExprClearButton studentId={studentId} moodTagId={a.moodTagId} scoreId={a.scoreId} />
                  )}
                </div>
              )}
              <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", marginTop: 4 }}>{a.createdAt}</div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
