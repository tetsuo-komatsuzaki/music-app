"use client"

// 生徒カルテ UI (2026-07-28)。タブ = 概要 / 宿題。将来タブ(診断/添削)はここに足すだけ。
import { useState, useTransition } from "react"
import Link from "next/link"
import { Leaf, Sprout, Inbox, Ear, Library, Palette, MessageCircle, Target, Calendar, Sparkles, Trophy, ClipboardList, FileText, PartyPopper, FileMusic } from "lucide-react"
import { useRouter } from "next/navigation"
import { MOOD_TAG_DEFS, moodTagPhrase, moodTagLabel } from "@/app/_libs/moodTags"
import { recordExpressionClear } from "@/app/actions/expressionClears"
import { createAssignment, sendMessageToStudent, sendCelebration } from "@/app/actions/teacherActions"
import { uploadScoreForStudent } from "@/app/actions/uploadScoreForStudent"
import { createObservation, recordObservationProgress } from "@/app/actions/teacherObservations"
import { EXPRESSION_TAGS, expressionLabel } from "@/app/_libs/expressionCatalog"
import { OBSERVATION_CATALOG, OBSERVATION_TAG_BY_ID, OBSERVATION_SEVERITIES } from "@/app/_libs/observationCatalog"
import { BODY_VIEWS, NON_BODY_CATEGORIES, spotsOf, type BodyViewId } from "@/app/_libs/bodyMap"
import BodyFigure from "@/app/components/BodyFigure"
import BodyObsMap, { type BodyObsItem } from "@/app/components/BodyObsMap"
import ProgressPage from "@/app/[userId]/progress/progressPage"
import type { KarteData } from "@/app/_libs/growthKarte"

// 数値入力を打った瞬間に上限へ収める (2026-08-08)。サーバーのクランプと一致させ、
// 「打った値と保存される値が違う」サイレントな食い違いを無くす。空欄は空のまま許可。
function clampNumStr(raw: string, max: number): string {
  const d = raw.replace(/[^0-9]/g, "")
  return d === "" ? "" : String(Math.min(max, Number(d)))
}

/** 履歴(新しい順)からタグごとに最新の所見1件を取り出す (癖マップ表示用) */
function latestPerTag(observations: ObservationRow[]): BodyObsItem[] {
  const m = new Map<string, BodyObsItem>()
  for (const o of observations) {
    for (const t of o.tagIds) if (!m.has(t)) m.set(t, { tagId: t, severity: o.severity, date: o.date })
  }
  return [...m.values()]
}

/** レッスン直後の経過記録 (まだ / 🌿良くなってきた / 🌱克服)。克服だけ二度押し確認 */
function ObsProgressButtons({ studentId, tag }: { studentId: string; tag: BodyObsItem }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [confirmResolve, setConfirmResolve] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const record = (status: "still" | "improving" | "resolved") => {
    setErr(null)
    start(async () => {
      const r = await recordObservationProgress({ studentId, tagId: tag.tagId, status })
      if (r.ok) { setConfirmResolve(false); router.refresh() }
      else setErr(r.error)
    })
  }
  const b: React.CSSProperties = { fontSize: "var(--fs-label)", fontWeight: 800, borderRadius: 999, padding: "4px 9px", cursor: "pointer", border: "1px solid #e2e6ea", background: "#fff", color: "var(--text-sub)" }

  return (
    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center", opacity: pending ? 0.5 : 1 }}>
      <button type="button" disabled={pending} onClick={() => record("still")} style={b}>まだある</button>
      <button type="button" disabled={pending} onClick={() => record("improving")} style={{ ...b, color: "var(--text-good)", borderColor: "#cfe6d8", display: "inline-flex", alignItems: "center", gap: 4 }}><Leaf size={12} /> 良くなってきた</button>
      {confirmResolve ? (
        <button type="button" disabled={pending} onClick={() => record("resolved")}
          style={{ ...b, color: "var(--text-on-accent)", background: "#2e8b57", borderColor: "#2e8b57", display: "inline-flex", alignItems: "center", gap: 4 }}><Sprout size={12} /> 克服にする（もう一度押して確定）</button>
      ) : (
        <button type="button" disabled={pending} onClick={() => setConfirmResolve(true)} style={{ ...b, color: "var(--text-good)", borderColor: "#cfe6d8", display: "inline-flex", alignItems: "center", gap: 4 }}><Sprout size={12} /> 克服</button>
      )}
      {err && <span style={{ fontSize: "var(--fs-label)", color: "var(--text-error)" }}>{err}</span>}
    </div>
  )
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
  submitted: boolean
  submittedScore: number | null
  createdAt: string
}

type ObservationRow = { id: string; tagIds: string[]; severity: string | null; comment: string | null; date: string }
type ExpressionRow = { id: string; tagId: string; severity: string | null; comment: string | null; date: string }
type WorkItem = { title: string; cat: string; avg: number }
type WeakSlot = { name: string; tree: "音程" | "リズム"; miss: number; target: number }
type ListenReq = { id: string; scoreId: string; title: string; avg: number | null; date: string }
type Recording = { id: string; kind: "score" | "practice"; title: string; cat: string; pitch: number; timing: number; avg: number; date: string; audioUrl: string | null; weak: WeakSlot[] }

export default function StudentKarte({
  userId, studentId, studentName, briefing, scoreTargets, itemTargets, listenRequests = [],
  allScoreTargets, allItemTargets, working, recordings, assignments,
  observations = [],
  expressions = [],
  karte = null,
  studentSupabaseUserId = null,
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
  assignments: AssignmentRow[]
  /** 先生の所見 (癖タグ) 履歴 */
  observations?: ObservationRow[]
  /** 表現の評価 (expr_*) 履歴 (2026-08-03 Phase0-3) */
  expressions?: ExpressionRow[]
  /** 生徒の成長カルテ (2026-08-02): 生徒に見えているのと同じもの (30日) を読み取り専用で */
  karte?: KarteData | null
  studentSupabaseUserId?: string | null
}) {
  // 案1 カルテ・フィード (2026-08-11 再設計): 練習後カルテを背骨に。カルテ(フィード)を主役、成長カルテは参照、指導ツールは集約。
  const [tab, setTab] = useState<"feed" | "growth" | "teach">("feed")
  return (
    // 生徒カルテ ペーパーデザイン (2026-08-06 Tetsuo確定B: 成長カルテv3と同じ世界観に全面統一)
    <div style={{
      background: "linear-gradient(165deg,#fffdf6,#faf4e4)", border: "1px solid #eee6d0",
      borderRadius: 18, padding: "16px 14px 14px", color: "var(--text-master)",
    }}>
      <Link href={`/${userId}/teacher`} style={{ fontSize: "var(--fs-body)", color: "var(--text-sub)", textDecoration: "none" }}>← 生徒一覧</Link>
      <div style={{ fontSize: "var(--fs-label)", fontWeight: 900, letterSpacing: ".22em", color: "var(--text-master)", marginTop: 6 }}>STUDENT KARTE</div>
      <h1 style={{ fontSize: "var(--fs-head)", fontWeight: 900, margin: "0 0 10px" }}>{studentName}</h1>

      <div style={{ display: "flex", gap: 4, marginBottom: 14, background: "rgba(255,255,255,.55)", border: "1px solid #efe5cc", borderRadius: 12, padding: 3 }}>
        {([["feed", "カルテ"], ["growth", "成長カルテ"], ["teach", "宿題・指導"]] as const).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            style={{
              flex: 1, border: "none",
              background: tab === k ? "linear-gradient(150deg,#f5df9e,#e3b93c)" : "transparent",
              color: tab === k ? "#4a3a12" : "#9a8c74",
              boxShadow: tab === k ? "0 1px 3px rgba(200,160,40,.3)" : "none",
              borderRadius: 9, padding: "8px 0", fontSize: "var(--fs-caption)", fontWeight: 900, cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "feed" && (
        <KarteFeed userId={userId} studentId={studentId} briefing={briefing} working={working} recordings={recordings} onGoTeach={() => setTab("teach")} />
      )}
      {tab === "growth" && (
        karte ? (
          <>
            <div style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-sub)", margin: "0 2px 8px" }}>生徒に見えている成長カルテ（参考・直近30日）</div>
            <ProgressPage userId={studentSupabaseUserId ?? ""} data={karte} readOnly />
          </>
        ) : (
          <Card><div style={{ fontSize: "var(--fs-body)", color: "var(--text-muted)" }}>成長カルテを読み込めませんでした。</div></Card>
        )
      )}
      {tab === "teach" && (
        <>
          <FeedbackTab userId={userId} studentId={studentId} scoreTargets={scoreTargets} listenRequests={listenRequests} assignments={assignments} />
          <Overview b={briefing} studentId={studentId} observations={observations} expressions={expressions} scoreTargets={allScoreTargets} listenRequests={listenRequests} />
          <Homework studentId={studentId} scoreTargets={allScoreTargets} itemTargets={allItemTargets} assignments={assignments} />
        </>
      )}
    </div>
  )
}

/* ═ 案1: カルテ・フィード (練習後カルテを新しい順に。各カルテの上で指導へ) ═ */
function KarteFeed({ userId, studentId, briefing, working, recordings, onGoTeach }: {
  userId: string; studentId: string; briefing: Briefing; working: WorkItem[]; recordings: Recording[]; onGoTeach: () => void
}) {
  void userId
  const scoreColor = (n: number) => (n >= 90 ? "#2e8b57" : n >= 70 ? "#b7823a" : "#c0473a")
  const catChip: React.CSSProperties = { fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--text-sub)", background: "#f7f8fa", border: "1px solid #eef1f4", borderRadius: 999, padding: "1px 7px", marginRight: 6 }
  const actBtn: React.CSSProperties = { fontSize: "var(--fs-label)", fontWeight: 800, border: "1px solid #d8dee8", background: "#fff", color: "#33405a", borderRadius: 8, padding: "6px 10px", cursor: "pointer" }
  return (
    <>
      {/* 前回から (背骨のサマリー) */}
      <div style={{ background: "#eef2fb", border: "1px solid #dbe4f5", borderRadius: 12, padding: "10px 13px", marginBottom: 12 }}>
        <div style={{ fontSize: "var(--fs-caption)", fontWeight: 900, color: "#2b3d6b" }}>この生徒の練習後カルテ</div>
        <div style={{ display: "flex", gap: 14, marginTop: 5, fontSize: "var(--fs-caption)", color: "#3a4a68", flexWrap: "wrap" }}>
          <span>直近7日の練習 <b style={{ color: "#1a2740" }}>{briefing.practiceCount7d}</b>回</span>
          <span>カルテ <b style={{ color: "#1a2740" }}>{recordings.length}</b>枚</span>
          <span>達成 <b style={{ color: "#1a2740" }}>{briefing.achievements.length}</b></span>
        </div>
        {working.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 7 }}>
            {working.slice(0, 4).map((w, i) => (
              <span key={i} style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: "#3a4a68", background: "#fff", border: "1px solid #dbe4f5", borderRadius: 999, padding: "2px 9px" }}>
                {w.title} <b style={{ color: scoreColor(w.avg) }}>{w.avg}</b>
              </span>
            ))}
          </div>
        )}
      </div>

      {recordings.length === 0 ? (
        <Card><div style={{ fontSize: "var(--fs-body)", color: "var(--text-muted)" }}>まだ練習後カルテがありません（録音するとここに1枚ずつ増えます）。</div></Card>
      ) : (
        recordings.map((r) => (
          <div key={r.id} style={{ background: "rgba(255,255,255,.85)", border: "1px solid #efe5cc", borderRadius: 14, padding: "12px 14px", marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
              <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <span style={catChip}>{r.cat}</span>
                <b style={{ color: "var(--text-ink)" }}>{r.title}</b>
              </span>
              <span style={{ flex: "none", fontSize: "var(--fs-subhead)", fontWeight: 900, color: scoreColor(r.avg) }}>{r.avg}</span>
            </div>
            <div style={{ display: "flex", gap: 12, fontSize: "var(--fs-caption)", marginTop: 4 }}>
              <span style={{ color: "var(--text-sub)" }}>音程 <b style={{ color: scoreColor(r.pitch) }}>{r.pitch}</b></span>
              <span style={{ color: "var(--text-sub)" }}>リズム <b style={{ color: scoreColor(r.timing) }}>{r.timing}</b></span>
              <span style={{ marginLeft: "auto", color: "var(--text-muted)" }}>{r.date}</span>
            </div>
            {r.weak.length > 0 && (
              <div style={{ background: "#f4f7fc", borderRadius: 8, padding: "7px 9px", marginTop: 8 }}>
                <div style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--text-muted)", marginBottom: 2 }}>アルコの聴きとり・崩れやすかった所</div>
                {r.weak.map((w, i) => (
                  <div key={i} style={{ fontSize: "var(--fs-caption)", color: "var(--text-body)" }}>
                    <span style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: w.tree === "音程" ? "#c0473a" : "#b7823a", background: w.tree === "音程" ? "#fbecea" : "#fbf1e2", borderRadius: 999, padding: "1px 6px", marginRight: 5 }}>{w.tree}</span>
                    {w.name} 成功率{Math.max(0, Math.round(100 - (w.miss / Math.max(1, w.target)) * 100))}%（{w.target}音中{w.miss}ミス）
                  </div>
                ))}
              </div>
            )}
            {r.audioUrl ? (
              <audio controls preload="none" src={r.audioUrl} style={{ width: "100%", height: 32, marginTop: 8 }} />
            ) : null}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 9 }}>
              <button type="button" onClick={onGoTeach} style={actBtn}>この曲に宿題</button>
              <button type="button" onClick={onGoTeach} style={actBtn}>癖として記録</button>
              <button type="button" onClick={onGoTeach} style={{ ...actBtn, color: "#a9741c", borderColor: "#f0dcb4" }}>表現を認定</button>
            </div>
            <RecCommentBox studentId={studentId} performanceId={r.id} kind={r.kind} />
          </div>
        ))
      )}
    </>
  )
}

function FeedbackTab({ userId, studentId, scoreTargets, listenRequests = [], assignments = [] }: {
  userId: string; studentId: string; scoreTargets: Target[]
  listenRequests?: ListenReq[]; assignments?: AssignmentRow[]
}) {
  // 採点カルテの依頼箱 (2026-08-06 統一・モック103dcadf):
  // 👂聴いてほしい依頼 + 📚提出済み宿題 + 自分で選ぶ、を1本に。書くものはどれも同じ採点カルテ。
  const submittedHw = assignments.filter((a) => a.submitted && !a.done && a.scoreId)
  const pendingCount = listenRequests.length + submittedHw.length
  const annotateHref = (scoreId: string, mood?: string | null) =>
    `/${userId}/teacher/students/${studentId}/annotate/${scoreId}${mood ? `?mood=${encodeURIComponent(mood)}` : ""}`
  return (
    <Card>
      <div style={{ fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-sub)", marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
        <Inbox size={14} /> 採点カルテ {pendingCount > 0 && (
          <span style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-master)", background: "#fdf3d8", border: "1px solid #eed9a0", borderRadius: 999, padding: "1px 8px" }}>未対応 {pendingCount}</span>
        )}
      </div>
      <p style={{ fontSize: "var(--fs-body)", color: "var(--text-muted)", margin: "0 0 10px" }}>
        演奏を聴いて、譜面添削・コメント・表現の認定を1枚のカルテで返せます。
      </p>

      {/* 👂 聴いてほしい依頼 */}
      {listenRequests.map((r) => (
        <div key={r.id} style={{ border: "1px solid #eed9a0", background: "#fdfaf2", borderRadius: 11, padding: "9px 12px", marginBottom: 7 }}>
          <div style={{ fontSize: "var(--fs-body)" }}>
            <span style={{ fontSize: "var(--fs-label)", fontWeight: 900, color: "var(--text-master)", background: "#fdf3d8", border: "1px solid #eed9a0", borderRadius: 999, padding: "1px 8px", marginRight: 6, display: "inline-flex", alignItems: "center", gap: 3 }}><Ear size={10} /> 聴いてほしい</span>
            <b>{r.title}</b>
            <span style={{ fontSize: "var(--fs-caption)", color: "var(--text-sub)", marginLeft: 6 }}>{r.avg != null ? `${r.avg}点 ・ ` : ""}{r.date}</span>
          </div>
          <Link href={annotateHref(r.scoreId)} style={{ display: "inline-block", marginTop: 6, fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-on-accent)", background: "#8a5a1f", borderRadius: 999, padding: "5px 13px", textDecoration: "none" }}>
            採点カルテを書く →
          </Link>
        </div>
      ))}

      {/* 📚 提出済み宿題 */}
      {submittedHw.map((a) => (
        <div key={a.id} style={{ border: "1px solid #d6ddff", background: "#fbfcff", borderRadius: 11, padding: "9px 12px", marginBottom: 7 }}>
          <div style={{ fontSize: "var(--fs-body)" }}>
            <span style={{ fontSize: "var(--fs-label)", fontWeight: 900, color: "var(--text-link)", background: "#eef1fe", border: "1px solid #d6ddff", borderRadius: 999, padding: "1px 8px", marginRight: 6, display: "inline-flex", alignItems: "center", gap: 3 }}><Library size={10} /> 宿題の提出</span>
            <b>{a.targetTitle}</b>
            <span style={{ fontSize: "var(--fs-caption)", color: "var(--text-sub)", marginLeft: 6 }}>{a.submittedScore != null ? `${a.submittedScore}点` : "提出済み"}</span>
          </div>
          {a.moodTagId && <div style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--text-master)", margin: "3px 0 0", display: "flex", alignItems: "center", gap: 4 }}><Palette size={11} /> 目標: {moodTagPhrase(a.moodTagId)}</div>}
          <Link href={annotateHref(a.scoreId!, a.moodTagId)} style={{ display: "inline-block", marginTop: 6, fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-on-accent)", background: "#3b56d4", borderRadius: 999, padding: "5px 13px", textDecoration: "none" }}>
            採点カルテを書く →
          </Link>
        </div>
      ))}

      {/* 自分で選ぶ */}
      <div style={{ borderTop: "1px dashed #e2e6ea", marginTop: 4, paddingTop: 10 }}>
        <div style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-muted)", marginBottom: 6 }}>自分で曲をえらんで書く</div>
        {scoreTargets.length === 0 ? (
          <div style={{ fontSize: "var(--fs-body)", color: "var(--text-muted)" }}>この生徒はまだ曲の演奏がありません。</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {scoreTargets.map((s) => (
              <Link key={s.id} href={annotateHref(s.id)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, textDecoration: "none", color: "inherit", border: "1px solid #eef1f4", borderRadius: 10, padding: "10px 12px" }}>
                <span style={{ fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</span>
                <span style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-link)", flex: "none" }}>カルテを書く →</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

function RecCommentBox({ studentId, performanceId, kind }: { studentId: string; performanceId: string; kind: "score" | "practice" }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState("")
  const [pending, start] = useTransition()
  const [done, setDone] = useState(false)

  const send = () => {
    const t = text.trim()
    if (!t) return
    start(async () => {
      const r = await sendMessageToStudent(studentId, t, performanceId, kind)
      if (r.ok) { setDone(true); setText(""); setOpen(false); router.refresh() }
    })
  }
  if (done) return <div style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-good)", marginTop: 8 }}>この演奏にコメントを送りました ✓</div>
  const btn: React.CSSProperties = { fontSize: "var(--fs-caption)", fontWeight: 800, borderRadius: 8, padding: "6px 12px", cursor: "pointer" }
  return (
    <div style={{ marginTop: 8 }}>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} style={{ ...btn, color: "var(--text-sub)", background: "#eef0fc", border: "1px solid #d7dcf6", display: "inline-flex", alignItems: "center", gap: 5 }}><MessageCircle size={13} /> この演奏にコメント</button>
      ) : (
        <div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={1000} placeholder="この演奏へのコメント（生徒に届きます）" style={{ width: "100%", border: "1px solid #dfe3e8", borderRadius: 8, padding: "8px 10px", fontSize: "var(--fs-body)", resize: "vertical" }} />
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <button type="button" onClick={() => { setOpen(false); setText("") }} style={{ ...btn, color: "var(--text-sub)", background: "#fff", border: "1px solid #e2e6ea" }}>やめる</button>
            <button type="button" onClick={send} disabled={pending} style={{ ...btn, color: "var(--text-on-accent)", background: "#8a5a1f", border: "none", opacity: pending ? 0.6 : 1 }}>{pending ? "送信中…" : "送る"}</button>
          </div>
        </div>
      )}
    </div>
  )
}
function Card({ children }: { children: React.ReactNode }) {
  // ペーパーデザイン (2026-08-06): クリームの紙の上の半透明カード (成長カルテv3と同トークン)
  return (
    <div style={{ background: "rgba(255,255,255,.8)", border: "1px solid #efe5cc", borderRadius: 15, padding: "14px 16px", marginBottom: 12 }}>
      {children}
    </div>
  )
}

function Overview({ b, studentId, observations, expressions = [], scoreTargets = [], listenRequests = [] }: { b: Briefing; studentId: string; observations: ObservationRow[]; expressions?: ExpressionRow[]; scoreTargets?: Target[]; listenRequests?: ListenReq[] }) {
  return (
    <>
      {/* 生徒の目標 + 直近7日の練習を1枚に集約 (2026-08-11: カード分割を廃してコンパクト化)。「直近の演奏」カードは削除 */}
      <Card>
        {b.goal ? (
          <>
            <div style={{ fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-sub)", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}><Target size={14} /> 生徒の目標</div>
            <div style={{ fontSize: "var(--fs-subhead)", fontWeight: 800, color: "var(--text-ink)" }}>
              {b.goal.songName}
              {b.goal.songStar != null && <span style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-master)", marginLeft: 6 }}>★{b.goal.songStar}</span>}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 6, fontSize: "var(--fs-caption)", color: "var(--text-sub)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Calendar size={12} /> 直近7日 <b style={{ color: "var(--text-ink)" }}>{b.practiceCount7d}</b>回練習</span>
              {b.goal.goalDate && <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>目標 {b.goal.goalDate}</span>}
              {b.goal.epicWin && <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Sparkles size={12} /> {b.goal.epicWin}</span>}
            </div>
          </>
        ) : (
          <div style={{ fontSize: "var(--fs-body)", color: "var(--text-sub)", display: "inline-flex", alignItems: "center", gap: 5 }}><Calendar size={14} /> 直近7日の練習 <b style={{ color: "var(--text-ink)" }}>{b.practiceCount7d}</b> 回</div>
        )}
      </Card>

      <Card>
        <div style={{ fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-sub)", marginBottom: 8 }}>達成・マスター</div>
        {b.achievements.length === 0 ? (
          <div style={{ fontSize: "var(--fs-body)", color: "var(--text-muted)" }}>まだ達成した曲はありません。</div>
        ) : (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {b.achievements.map((a, i) => (
                <span key={i} style={{ fontSize: "var(--fs-body)", fontWeight: 700, color: a.mastered ? "#b5651d" : "#2e8b57", background: a.mastered ? "#fdf3df" : "#eafaf0", border: "1px solid", borderColor: a.mastered ? "#eecfa0" : "#cbe8d6", borderRadius: 999, padding: "3px 10px", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  {a.mastered ? <Trophy size={12} color="#b5651d" /> : <Sparkles size={12} color="#2e8b57" />} {a.title}
                </span>
              ))}
            </div>
            <CelebrateBox studentId={studentId} latest={b.achievements[0]} />
          </>
        )}
      </Card>

      {/* 👂リクエストは採点カルテタブの依頼箱に一本化 (2026-08-06統一) */}
      {/* 所見 (癖タグ・2026-08-02): 選択式で記録→生徒にも表示・集計してアドバイスに活用 */}
      <ObservationSection studentId={studentId} observations={observations} />

      {/* 表現の評価 (2026-08-03 Phase0-3): 💪とくい/🔥挑戦中/🌿。強みは曲の推薦にも使われる(変換表実装後) */}
      <ExpressionSection studentId={studentId} expressions={expressions} scoreTargets={scoreTargets} />
    </>
  )
}

function ObservationSection({ studentId, observations }: { studentId: string; observations: ObservationRow[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  // 選び方 (2026-08-02 人体マップ化): 体のビュー / 体で表せない分類(リズム・習慣) / 全タグ一覧
  const [mode, setMode] = useState<{ kind: "view"; view: BodyViewId } | { kind: "cat"; catId: string } | { kind: "all" }>({ kind: "view", view: "body" })
  const [spotId, setSpotId] = useState<string | null>(null)
  const [allCatId, setAllCatId] = useState(OBSERVATION_CATALOG[0].id)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [severity, setSeverity] = useState<"" | "mild" | "focus">("")
  const [comment, setComment] = useState("")
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, start] = useTransition()

  const toggleTag = (id: string) =>
    setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })

  const tagChip = (t: { id: string; label: string }) => (
    <button key={t.id} type="button" onClick={() => toggleTag(t.id)}
      style={{ fontSize: "var(--fs-caption)", fontWeight: 700, borderRadius: 9, padding: "6px 11px", cursor: "pointer", border: "1px solid", borderColor: selected.has(t.id) ? "#4a5bd0" : "#e2e6ea", background: selected.has(t.id) ? "#eef0fc" : "#fff", color: selected.has(t.id) ? "#4a5bd0" : "#4a5766" }}>
      {t.label}
    </button>
  )

  const save = () => {
    setMsg(null)
    start(async () => {
      const r = await createObservation({
        studentId,
        tagIds: [...selected],
        severity: severity || null,
        comment: comment || null,
      })
      if (r.ok) {
        setMsg({ ok: true, text: "所見を記録しました（生徒にも届きます）" })
        setSelected(new Set()); setSeverity(""); setComment(""); setOpen(false)
        router.refresh()
      } else {
        setMsg({ ok: false, text: r.error })
      }
    })
  }

  const sevColor = (s: string | null) =>
    s === "focus" ? { c: "#c0473a", bg: "#fbecea", bd: "#f0d4d0", l: "要重点" }
    : s === "mild" ? { c: "#b7823a", bg: "#faf1e1", bd: "#ecdfc8", l: "気になる" }
    : s === "improving" ? { c: "#2e8b57", bg: "#e9f5ee", bd: "#cfe6d8", l: "良くなってきた" }
    : s === "resolved" ? { c: "#2e8b57", bg: "#e9f5ee", bd: "#cfe6d8", l: "克服" }
    : null

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-sub)", display: "inline-flex", alignItems: "center", gap: 5 }}><ClipboardList size={14} /> 先生の所見（癖の記録）</span>
        {!open && (
          <button type="button" onClick={() => { setOpen(true); setMsg(null) }}
            style={{ marginLeft: "auto", fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-ink)", background: "#fff", border: "1px solid #dfe3e8", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>
            ＋ 記録する
          </button>
        )}
      </div>

      {open && (
        <div style={{ border: "1px solid #eef1f4", borderRadius: 12, padding: 12, marginBottom: 10 }}>
          {/* ビュー切替 (人体マップ) + 体で表せない分類 + 全タグ */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 9 }}>
            {BODY_VIEWS.map((v) => {
              const on = mode.kind === "view" && mode.view === v.id
              return (
                <button key={v.id} type="button" onClick={() => { setMode({ kind: "view", view: v.id }); setSpotId(null) }}
                  style={{ fontSize: "var(--fs-caption)", fontWeight: 800, borderRadius: 999, padding: "5px 10px", cursor: "pointer", border: "1px solid", borderColor: on ? "#2b3742" : "#e2e6ea", background: on ? "#2b3742" : "#fff", color: on ? "#fff" : "#6b7885", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <v.Icon size={12} /> {v.short}
                </button>
              )
            })}
            {OBSERVATION_CATALOG.filter((c) => (NON_BODY_CATEGORIES as readonly string[]).includes(c.id)).map((c) => {
              const on = mode.kind === "cat" && mode.catId === c.id
              return (
                <button key={c.id} type="button" onClick={() => setMode({ kind: "cat", catId: c.id })}
                  style={{ fontSize: "var(--fs-caption)", fontWeight: 800, borderRadius: 999, padding: "5px 10px", cursor: "pointer", border: "1px solid", borderColor: on ? "#2b3742" : "#e2e6ea", background: on ? "#2b3742" : "#fff", color: on ? "#fff" : "#6b7885", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <c.Icon size={12} /> {c.label}
                </button>
              )
            })}
            <button type="button" onClick={() => setMode({ kind: "all" })}
              style={{ fontSize: "var(--fs-caption)", fontWeight: 800, borderRadius: 999, padding: "5px 10px", cursor: "pointer", border: "1px dashed", borderColor: mode.kind === "all" ? "#2b3742" : "#cdd3d9", background: mode.kind === "all" ? "#2b3742" : "#fff", color: mode.kind === "all" ? "#fff" : "#8a95a1", display: "inline-flex", alignItems: "center", gap: 4 }}>
              <FileText size={12} /> 全タグ
            </button>
          </div>

          {mode.kind === "view" && (() => {
            const view = BODY_VIEWS.find((v) => v.id === mode.view)!
            const spots = spotsOf(mode.view)
            const activeSpot = spots.find((s) => s.id === spotId) ?? null
            return (
              <div>
                {/* イラスト + 部位ボタン */}
                <div style={{ position: "relative", background: "#fdfaf4", border: "1px solid #f0e9db", borderRadius: 12, padding: 6 }}>
                  <BodyFigure view={mode.view} className="" />
                  {spots.map((s) => {
                    const cnt = s.tagIds.filter((t) => selected.has(t)).length
                    const on = spotId === s.id
                    return (
                      <button key={s.id} type="button" onClick={() => setSpotId((cur) => (cur === s.id ? null : s.id))}
                        style={{ position: "absolute", left: `${s.x}%`, top: `${s.y}%`, transform: "translate(-50%, -50%)", fontSize: "var(--fs-caption)", fontWeight: 800, borderRadius: 999, padding: "4px 9px", cursor: "pointer", border: "1.5px solid", borderColor: on ? "#4a5bd0" : cnt > 0 ? "#4a5bd0" : "#c9a87c", background: on ? "#4a5bd0" : "#fff", color: on ? "#fff" : cnt > 0 ? "#4a5bd0" : "#7a6a55", boxShadow: "0 1px 4px rgba(60,50,30,.18)", whiteSpace: "nowrap" }}>
                        {s.label}{cnt > 0 ? ` ${cnt}` : ""}
                      </button>
                    )
                  })}
                </div>
                <div style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)", marginTop: 5 }}>{view.caption} — 気になる場所をタップ</div>
                {/* タップした部位のタグ */}
                {activeSpot && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {activeSpot.tagIds.filter((id) => OBSERVATION_TAG_BY_ID[id]).map((id) => tagChip({ id, label: OBSERVATION_TAG_BY_ID[id].label }))}
                  </div>
                )}
              </div>
            )
          })()}

          {mode.kind === "cat" && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(OBSERVATION_CATALOG.find((c) => c.id === mode.catId)?.tags ?? []).map((t) => tagChip(t))}
            </div>
          )}

          {mode.kind === "all" && (
            <div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                {OBSERVATION_CATALOG.map((c) => (
                  <button key={c.id} type="button" onClick={() => setAllCatId(c.id)}
                    style={{ fontSize: "var(--fs-caption)", fontWeight: 800, borderRadius: 999, padding: "4px 9px", cursor: "pointer", border: "1px solid", borderColor: allCatId === c.id ? "#4a5bd0" : "#e2e6ea", background: allCatId === c.id ? "#eef0fc" : "#fff", color: allCatId === c.id ? "#4a5bd0" : "#6b7885", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <c.Icon size={12} /> {c.label}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(OBSERVATION_CATALOG.find((c) => c.id === allCatId) ?? OBSERVATION_CATALOG[0]).tags.map((t) => tagChip(t))}
              </div>
            </div>
          )}
          {/* 選択中 (他分類も含む) */}
          {selected.size > 0 && (
            <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-sub)", marginTop: 8 }}>
              選択中: {[...selected].map((id) => OBSERVATION_TAG_BY_ID[id]?.label).filter(Boolean).join("・")}
            </div>
          )}
          {/* 程度 */}
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            {OBSERVATION_SEVERITIES.map((s) => (
              <button key={s.id} type="button" onClick={() => setSeverity((cur) => (cur === s.id ? "" : s.id))}
                style={{ flex: 1, fontSize: "var(--fs-caption)", fontWeight: 800, borderRadius: 8, padding: "7px 0", cursor: "pointer", border: "1px solid", borderColor: severity === s.id ? "#2b3742" : "#e2e6ea", background: severity === s.id ? "#2b3742" : "#fff", color: severity === s.id ? "#fff" : "#6b7885" }}>
                {s.label}
              </button>
            ))}
          </div>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} maxLength={500}
            placeholder="補足コメント（任意・「その他」の内容もここに）"
            style={{ width: "100%", border: "1px solid #dfe3e8", borderRadius: 8, padding: "8px 10px", fontSize: "var(--fs-body)", marginTop: 10, resize: "vertical" }} />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button type="button" onClick={() => setOpen(false)}
              style={{ flex: 1, fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-sub)", background: "#fff", border: "1px solid #e2e6ea", borderRadius: 9, padding: 9, cursor: "pointer" }}>キャンセル</button>
            <button type="button" onClick={save} disabled={pending}
              style={{ flex: 2, fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-on-accent)", background: "#8a5a1f", border: "none", borderRadius: 9, padding: 9, cursor: "pointer", opacity: pending ? 0.6 : 1 }}>
              {pending ? "保存中…" : "記録する"}
            </button>
          </div>
        </div>
      )}
      {msg && <div style={{ fontSize: "var(--fs-body)", margin: "0 0 8px", color: msg.ok ? "#2e8b57" : "#c0392b" }}>{msg.text}</div>}

      {/* 癖マップ (レッスン前後のひと目確認): タグごとに最新の所見を体の場所で表示。
          レッスン直後はここから経過をワンタップ記録 (まだ/🌿良くなってきた/🌱克服) */}
      {!open && observations.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <BodyObsMap tags={latestPerTag(observations)}
            renderTagActions={(t) => <ObsProgressButtons studentId={studentId} tag={t} />} />
        </div>
      )}

      {/* 履歴 */}
      {observations.length === 0 ? (
        !open && <div style={{ fontSize: "var(--fs-body)", color: "var(--text-muted)" }}>まだ所見はありません。レッスン後に気づいた癖を記録すると、生徒に届き、カルテに蓄積されます。</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {observations.slice(0, 10).map((o) => {
            const sev = sevColor(o.severity)
            return (
              <div key={o.id} style={{ border: "1px solid #eef1f4", borderRadius: 10, padding: "9px 11px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
                  {sev && <span style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: sev.c, background: sev.bg, border: `1px solid ${sev.bd}`, borderRadius: 999, padding: "2px 8px" }}>{sev.l}</span>}
                  {o.tagIds.map((t) => (
                    <span key={t} style={{ fontSize: "var(--fs-caption)", fontWeight: 700, color: "var(--text-link)", background: "#eef0fc", border: "1px solid #d7dcf6", borderRadius: 8, padding: "3px 8px" }}>
                      {OBSERVATION_TAG_BY_ID[t]?.label ?? t}
                    </span>
                  ))}
                  <span style={{ marginLeft: "auto", fontSize: "var(--fs-label)", color: "var(--text-muted)" }}>{o.date}</span>
                </div>
                {o.comment && <div style={{ fontSize: "var(--fs-body)", color: "var(--text-body)", marginTop: 5, lineHeight: 1.55, display: "flex", gap: 5 }}><MessageCircle size={13} style={{ flex: "none", marginTop: 2 }} /> <span>{o.comment}</span></div>}
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

/** 表現の評価 (2026-08-03 Phase0-3): 7語彙+自由入力から選び 💪/🔥/🌿 で記録。
 *  現在状態 = タグごとの最新行。挑戦中→🌿→💪の昇格が時系列で残り、カルテ表現章(Phase1)に流れる */
function ExpressionSection({ studentId, expressions, scoreTargets }: { studentId: string; expressions: ExpressionRow[]; scoreTargets: Target[] }) {
  // 2026-08-06統一: 旧4語彙の評価フォーム(💪🌿🔥)は廃止。表現=統一15語のクリア認定に一本化。
  // 過去の旧評価はコメント付きの記録として表示だけ残す (入力は不可)
  const past = expressions.filter((e) => e.comment)
  return (
    <Card>
      <div style={{ fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-sub)", marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}><Palette size={14} /> 表現の認定</div>
      <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", marginBottom: 4 }}>
        「この曲でこの表現ができていた」を認定すると、曲の★がそのまま生徒の表現力レベルになります。
      </div>
      <ExprClearBox studentId={studentId} scoreTargets={scoreTargets} />
      {past.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-muted)" }}>これまでの表現メモ（旧記録）</div>
          {past.slice(0, 3).map((e) => (
            <div key={e.id} style={{ fontSize: "var(--fs-caption)", color: "var(--text-sub)", marginTop: 3 }}>
              {expressionLabel(e.tagId)}: 「{e.comment}」 <span style={{ fontSize: "var(--fs-label)" }}>{e.date}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

/** 表現クリア認定ボックス (2026-08-06): 統一雰囲気タグ × 曲 → UserExpressionClear */
function ExprClearBox({ studentId, scoreTargets }: { studentId: string; scoreTargets: Target[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [tag, setTag] = useState("")
  const [scoreId, setScoreId] = useState("")
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, start] = useTransition()

  const submit = () => {
    if (!tag || !scoreId) return
    start(async () => {
      const r = await recordExpressionClear({ studentId, moodTagId: tag, scoreId })
      if (!r.ok) { setMsg({ ok: false, text: r.error }); return }
      setMsg({ ok: true, text: `認定しました！ この表現の到達レベルは ★${r.star} 相当になります` })
      setTag(""); setScoreId(""); setOpen(false)
      router.refresh()
    })
  }

  const sel: React.CSSProperties = { width: "100%", border: "1px solid #dfe3e8", borderRadius: 8, padding: "7px 10px", fontSize: "var(--fs-body)", marginTop: 6 }
  return (
    <div style={{ marginTop: 12, borderTop: "1px dashed #e2e6ea", paddingTop: 10 }}>
      {!open ? (
        <button type="button" onClick={() => { setOpen(true); setMsg(null) }}
          style={{ width: "100%", border: "1px dashed #d8c9a4", background: "#fdfaf2", color: "var(--text-master)", borderRadius: 10, padding: 9, fontSize: "var(--fs-body)", fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
          <Palette size={13} /> 表現クリアを認定する（曲の★が表現力レベルになります）
        </button>
      ) : (
        <div>
          <div style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-sub)" }}>この曲で、この表現ができていた:</div>
          <select value={tag} onChange={(e) => setTag(e.target.value)} style={sel}>
            <option value="">表現をえらぶ</option>
                          {MOOD_TAG_DEFS.map((t) => (
                <option key={t.id} value={t.id}>{moodTagLabel(t.id)}</option>
              ))}
          </select>
          <select value={scoreId} onChange={(e) => setScoreId(e.target.value)} style={sel}>
            <option value="">曲をえらぶ</option>
            {scoreTargets.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button type="button" onClick={() => setOpen(false)}
              style={{ flex: 1, fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-sub)", background: "#fff", border: "1px solid #e2e6ea", borderRadius: 9, padding: 8, cursor: "pointer" }}>キャンセル</button>
            <button type="button" onClick={submit} disabled={pending || !tag || !scoreId}
              style={{ flex: 2, fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-on-accent)", background: "#8a5a1f", border: "none", borderRadius: 9, padding: 8, cursor: "pointer", opacity: pending || !tag || !scoreId ? 0.5 : 1 }}>
              {pending ? "記録中…" : <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Palette size={13} /> クリア認定</span>}
            </button>
          </div>
        </div>
      )}
      {msg && <div style={{ fontSize: "var(--fs-body)", marginTop: 6, color: msg.ok ? "#2e8b57" : "#c0392b" }}>{msg.text}</div>}
    </div>
  )
}

/** 宿題カード内の表現クリア認定ボタン (2026-08-06・案C 宿題側入口) */
function AssignmentExprClearButton({ studentId, moodTagId, scoreId }: { studentId: string; moodTagId: string; scoreId: string }) {
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle")
  const [star, setStar] = useState<number | null>(null)
  if (state === "done") {
    return <span style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-good)" }}>✓ 表現クリア認定{star != null ? `（★${star}相当）` : ""}</span>
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

/** 一緒に祝う (2026-08-02): 生徒の達成に、先生からお祝いメッセージを送る */
function CelebrateBox({ studentId, latest }: { studentId: string; latest: { title: string; mastered: boolean } }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState("")
  const [done, setDone] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const defaultMsg = `「${latest.title}」${latest.mastered ? "マスター" : "達成"}おめでとう！がんばったね！`

  const send = () => {
    const body = (text.trim() || defaultMsg)
    setErr(null)
    start(async () => {
      const r = await sendCelebration(studentId, body)
      if (r.ok) { setDone(true); setOpen(false) }
      else setErr(r.error)
    })
  }

  if (done) return <div style={{ fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-good)", marginTop: 10, display: "flex", alignItems: "center", gap: 5 }}><PartyPopper size={14} /> お祝いを送りました！生徒に届きます。</div>

  return (
    <div style={{ marginTop: 10 }}>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)}
          style={{ fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-master)", background: "#fdf3df", border: "1px solid #eecfa0", borderRadius: 9, padding: "7px 14px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}>
          <PartyPopper size={13} /> 一緒に祝う（お祝いを送る）
        </button>
      ) : (
        <div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={500} placeholder={defaultMsg}
            style={{ width: "100%", border: "1px solid #dfe3e8", borderRadius: 8, padding: "8px 10px", fontSize: "var(--fs-body)", resize: "vertical" }} />
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <button type="button" onClick={() => { setOpen(false); setText("") }}
              style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-sub)", background: "#fff", border: "1px solid #e2e6ea", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>やめる</button>
            <button type="button" onClick={send} disabled={pending}
              style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-on-accent)", background: "#b5651d", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", opacity: pending ? 0.6 : 1 }}>
              {pending ? "送信中…" : <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><PartyPopper size={13} /> 送る</span>}
            </button>
          </div>
          {err && <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-error)", marginTop: 5 }}>{err}</div>}
        </div>
      )}
    </div>
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
          <FileMusic size={15} /> 楽譜を渡す（MusicXML）
        </button>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #eef1f4", borderRadius: 14, padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-ink)", marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}><FileMusic size={14} /> 楽譜を渡す</div>
          <label style={lbl}>MusicXMLファイル（.xml / .musicxml / .mxl・5MBまで）
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
          <label style={{ ...lbl, display: "block", marginTop: 10 }}>作曲者（任意）
            <input value={composer} onChange={(e) => setComposer(e.target.value)} placeholder="例: モーツァルト" style={inp} maxLength={100} />
          </label>
          <label style={{ ...lbl, display: "block", marginTop: 10 }}>ひとこと（任意・メッセージで届きます）
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

          <label style={lbl}>対象の{kind === "score" ? "曲" : "教材"}を選ぶ（最近以外もOK）
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="名前で絞り込み"
              style={inp}
            />
            <select value={targetId} onChange={(e) => setTargetId(e.target.value)} style={{ ...inp, marginTop: 6 }}>
              <option value="">選択してください（{filtered.length}件）</option>
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

          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <label style={{ ...lbl, flex: 1 }}>回数<input value={reps} onChange={(e) => setReps(clampNumStr(e.target.value, 999))} placeholder="5" style={inp} inputMode="numeric" /></label>
            <label style={{ ...lbl, flex: 1 }}>目標♩<input value={tempo} onChange={(e) => setTempo(clampNumStr(e.target.value, 400))} placeholder="80" style={inp} inputMode="numeric" /></label>
          </div>

          <label style={{ ...lbl, display: "block", marginTop: 10 }}>提出期限（任意）
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inp} />
          </label>

          <div style={{ ...lbl, marginTop: 10 }}>合格の目安（任意）</div>
          <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
            {([["score", "点数"], ["achieve", "達成"], ["master", "マスター"]] as const).map(([g, label]) => (
              <button
                key={g}
                type="button"
                onClick={() => setGoalType((cur) => (cur === g ? "" : g))}
                style={{ flex: 1, border: "1px solid", borderColor: goalType === g ? "#8a5a1f" : "#e8e0cc", background: goalType === g ? "#8a5a1f" : "rgba(255,255,255,.7)", color: goalType === g ? "#fff" : "#9a8c74", borderRadius: 8, padding: "6px 0", fontSize: "var(--fs-body)", fontWeight: 800, cursor: "pointer" }}
              >
                {label}
              </button>
            ))}
          </div>
          {goalType === "score" && (
            <label style={{ ...lbl, display: "block", marginTop: 8 }}>合格ライン（点）
              <input value={targetScore} onChange={(e) => setTargetScore(clampNumStr(e.target.value, 100))} placeholder="80" style={inp} inputMode="numeric" />
            </label>
          )}
          {goalType === "master" && (
            <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", marginTop: 6 }}>マスター＝達成＋直近5回の平均90点以上（曲のみ）</div>
          )}

          {/* 意識する表現 (2026-08-05): 統一雰囲気タグから1つ。「この曲では◯◯を意識しよう」 */}
          <label style={{ ...lbl, display: "block", marginTop: 10 }}><Palette size={12} style={{ verticalAlign: -1, marginRight: 4 }} />意識する表現（任意）
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
                {[a.reps && `×${a.reps}`, a.targetTempo && `♩=${a.targetTempo}`].filter(Boolean).join(" ・ ") || "（詳細指定なし）"}
              </div>
              {(dueInfo(a.dueDate) || goalLabel(a.goalType, a.targetScore)) && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                  {(() => {
                    const di = dueInfo(a.dueDate)
                    if (!di) return null
                    const c = DUE_COLOR[di.state]
                    return (
                      <span style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: c.fg, background: c.bg, border: `1px solid ${c.border}`, borderRadius: 999, padding: "2px 8px" }}>
                        期限 {di.label}{di.state === "overdue" ? "（過ぎています）" : di.state === "soon" ? "（もうすぐ）" : ""}
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
