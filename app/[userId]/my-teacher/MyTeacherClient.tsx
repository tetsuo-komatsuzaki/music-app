"use client"

// 先生とのやりとり UI — 確定モック 先生03〜05 (build-teacher.py) の写経 (2026-08-22)。
// 先生カード=青グラデヘッダ (丸アバター52 ・ 名前17px白 ・ つぎのレッスン行 金ドット) ・
// タブ=金選択チップ (件数バッジ) ・ すべて=色ノードのタイムライン+insetカード ・
// 宿題=!コーラル/緑✓行+金ピル ・ 0件=✉カード ・ 解除=下部の小さな文字リンク。
// タブ構成とデータは現行 (すべて/宿題/練習後カルテ/合格の履歴/添削) を維持。
// 自由チャットの「メッセージ」タブは廃止 (2026-08-09)。
import { useState, useTransition } from "react"
import { MessageCircle, NotebookPen, type LucideIcon, Pin, Upload, UserRound, ClipboardList, PartyPopper } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { unlinkTeacher } from "@/app/actions/teacherActions"
import AssignmentSubmit from "@/app/components/AssignmentSubmit"
import { goalLabel, dueInfo, goalResult } from "@/app/_libs/assignmentGoal"
import PassedHwHistory, { type PassedHwItem } from "@/app/components/PassedHwHistory"
import ds from "@/app/components/ds.module.css"

type TimelineEv = { when: string; kind: "hw" | "comment"; text: string; href?: string | null; icon?: string }

const TIMELINE_ICON: Record<string, LucideIcon> = {
  pin: Pin, message: MessageCircle, upload: Upload, you: UserRound, clipboard: ClipboardList, party: PartyPopper,
}
// 原本 tl(): 種別ラベルと色ノード
const TL_META: Record<string, { label: string; color: string }> = {
  pin: { label: "宿題", color: "#a8c97f" },
  clipboard: { label: "練習後カルテ", color: "#e8b23c" },
  message: { label: "添削", color: "#7fa4e8" },
  party: { label: "お祝い", color: "#e8b23c" },
  upload: { label: "提出", color: "#8fa0c4" },
  you: { label: "きみ", color: "#8fa0c4" },
}
type Homework = {
  id: string; title: string; detail: string; comment: string | null
  dueDate: string | null; goalType: string | null; targetScore: number | null
  achieved: boolean; mastered: boolean
  done: boolean; submitted: boolean; submittedScore: number | null; date: string; href: string
}
type Feedback = { scoreId: string; title: string; date: string }
/** 先生からの練習後カルテ (演奏への返し・2026-08-11) */
type KarteItem = { when: string; title: string; href: string; body: string }
type LessonDTO = { id: string; when: string; durationMin: number; online: boolean; locationNote: string | null }
type Lessons = { open: LessonDTO[]; booked: LessonDTO[] }

const dueDark = {
  overdue: { fg: "#e8a78f", bg: "rgba(232, 138, 111, 0.16)" },
  soon: { fg: "#e0b25c", bg: "rgba(224, 160, 47, 0.16)" },
  normal: { fg: "var(--text-sub)", bg: "rgba(150, 175, 225, 0.12)" },
} as const

const goldPill: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 800, color: "var(--gold)", background: "rgba(232,178,60,.14)", borderRadius: 999, padding: "4px 11px", textDecoration: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }

export default function MyTeacherClient({
  userId, teacherName, since, timeline: _timeline, homework, karteItems = [], passedItems = [], feedbacks, lessons: _lessons, nextLessonLabel,
}: {
  userId: string
  teacherName: string
  since: string
  timeline: TimelineEv[]
  homework: Homework[]
  karteItems?: KarteItem[]
  passedItems?: PassedHwItem[]
  feedbacks: Feedback[]
  lessons: Lessons
  nextLessonLabel: string | null
}) {
  // ?tab=karte 等の初期タブ指定 (ホームの「練習後カルテが届いたよ」通知から)
  const sp = useSearchParams()
  const initTab = (["hw", "karte", "passed", "review"] as const).find((t) => t === sp.get("tab")) ?? "hw"
  const [tab, setTab] = useState<"hw" | "karte" | "passed" | "review">(initTab)
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const doUnlink = () => {
    if (!window.confirm(`${teacherName} 先生との、つながりを解除しますか？\n`)) return
    startTransition(async () => {
      await unlinkTeacher()
      router.push(`/${userId}`)
      router.refresh()
    })
  }

  const tabs = [
    ["hw", "宿題", homework.filter((h) => !h.submitted).length],
    ["karte", "練習後カルテ", karteItems.length],
    ["passed", "合格", passedItems.length],
    ["review", "添削", feedbacks.length],
  ] as const

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 0 60px" }}>
      <h1 className={ds.t} style={{ paddingTop: 6 }}>先生とのやりとり</h1>

      {/* 先生カード (原本 TEACHER_CARD) */}
      <div className={ds.card} style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 15px", background: "linear-gradient(135deg,#1f3d78,#2b5bc4)" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", flex: "none", display: "grid", placeItems: "center", background: "rgba(255,255,255,.18)", color: "#fff", fontSize: 18, fontWeight: 900 }}>
            {teacherName.slice(0, 1)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 900, color: "#fff" }}>{teacherName}先生</div>
            <div style={{ fontSize: 11.5, color: "#cdd9f2", marginTop: 2 }}>つながって {since} から</div>
          </div>
        </div>
        {nextLessonLabel && (
          <div style={{ padding: "11px 15px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--gold)", flex: "none" }} />
            <span style={{ fontSize: 12, color: "var(--text-sub)" }}>つぎのレッスン</span>
            <b style={{ fontSize: 12.5, marginLeft: "auto", color: "var(--text-ink)" }}>{nextLessonLabel}</b>
          </div>
        )}
      </div>

      {/* タブ (原本 tcat_tabs: 金選択チップ + 件数) */}
      <div style={{ display: "flex", gap: 5, overflowX: "auto", marginTop: 12, paddingBottom: 2 }}>
        {tabs.map(([k, label, cnt]) => {
          const on = tab === k
          return (
            <button key={k} type="button" onClick={() => setTab(k)} className="pressable"
              style={{
                flex: "none", display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: 10.5, fontWeight: 800, fontFamily: "inherit", cursor: "pointer",
                borderRadius: 999, padding: "4px 9px", whiteSpace: "nowrap",
                color: on ? "var(--gold)" : "var(--text-sub)",
                background: on ? "rgba(232,178,60,.16)" : "rgba(150,175,225,.07)",
                border: `1px solid ${on ? "rgba(232,178,60,.34)" : "transparent"}`,
              }}>
              {label}
              {cnt > 0 && (
                <span style={{ fontSize: 9, fontWeight: 900, borderRadius: 999, padding: "0 5px", background: on ? "rgba(255,255,255,.22)" : "rgba(150,175,225,.14)", fontVariantNumeric: "tabular-nums" }}>{cnt}</span>
              )}
            </button>
          )
        })}
      </div>

      <div style={{ marginTop: 0 }}>
        {tab === "hw" && <HwTab homework={homework} />}
        {tab === "karte" && <KarteTab items={karteItems} />}
        {tab === "passed" && <PassedHwHistory items={passedItems} />}
        {tab === "review" && <ReviewTab userId={userId} feedbacks={feedbacks} />}
      </div>

      {/* 解除 (原本: 下部の小さな文字リンク) */}
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <button type="button" onClick={doUnlink} disabled={pending}
          style={{ border: "none", background: "none", fontSize: 11, color: "var(--text-muted)", cursor: "pointer", fontFamily: "inherit", opacity: pending ? 0.6 : 1 }}>
          先生とのつながりを解除する
        </button>
      </div>
    </div>
  )
}

/* すべて (原本: 色ノードのタイムライン + insetカード) */
function HwTab({ homework }: { homework: Homework[] }) {
  if (homework.length === 0) return <Empty note="いまは宿題がありません。" />
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {homework.map((h) => <HwCard key={h.id} h={h} />)}
    </div>
  )
}

function HwCard({ h }: { h: Homework }) {
  const router = useRouter()
  const di = dueInfo(h.dueDate)
  const goal = goalLabel(h.goalType, h.targetScore)
  const gr = goalResult(h.goalType, { achieved: h.achieved, mastered: h.mastered })
  const showGr = gr && h.goalType !== "score"

  return (
    <div className={ds.card} style={{ padding: "13px 15px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-ink)" }}>{h.title}</span>
        {h.submitted ? (
          <span style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "#8fd3a8", flex: "none" }}>提出済{h.submittedScore != null ? ` ${h.submittedScore}点` : ""}</span>
        ) : (
          <span style={{ fontSize: "var(--fs-caption)", fontWeight: 700, color: "#e8a78f", flex: "none" }}>未提出</span>
        )}
      </div>
      {(di || goal || showGr) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
          {di && (
            <span style={{ fontSize: 10.5, fontWeight: 800, color: dueDark[di.state].fg, background: dueDark[di.state].bg, borderRadius: 999, padding: "3px 9px" }}>
              期限 {di.label}
            </span>
          )}
          {goal && (
            <span style={{ fontSize: 10.5, fontWeight: 800, color: "#9db8e8", background: "rgba(43,91,196,.2)", borderRadius: 999, padding: "3px 9px" }}>{goal}</span>
          )}
          {showGr && gr && (
            <span style={{ fontSize: 10.5, fontWeight: 800, color: gr.met ? "#8fd3a8" : "var(--text-sub)", background: gr.met ? "rgba(127,196,148,.16)" : "rgba(150,175,225,.12)", borderRadius: 999, padding: "3px 9px" }}>{gr.label}</span>
          )}
        </div>
      )}
      {h.detail && <div style={{ fontSize: "var(--fs-body)", color: "var(--text-sub)", marginTop: 5 }}>{h.detail}</div>}
      {h.comment && (
        <div style={{ fontSize: 11.5, color: "var(--text-sub)", marginTop: 8, lineHeight: 1.6, paddingLeft: 9, borderLeft: "2px solid rgba(150,175,225,.22)" }}>{h.comment}</div>
      )}
      {!h.submitted && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
          <Link href={h.href} className="pressable" style={{ ...goldPill, fontSize: 11 }}>演奏する</Link>
          <AssignmentSubmit assignmentId={h.id} goalType={h.goalType} targetScore={h.targetScore} onDone={() => router.refresh()} />
        </div>
      )}
      {h.submitted && (
        <div style={{ marginTop: 10 }}>
          <Link href={h.href} className="pressable" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 800, color: "var(--text-ink)", background: "rgba(150,175,225,.1)", borderRadius: 999, padding: "4px 11px", textDecoration: "none" }}>もう一度練習する →</Link>
        </div>
      )}
    </div>
  )
}

/* 先生からの練習後カルテ (演奏への返し)。タップでその演奏の練習後カルテへ */
function KarteTab({ items }: { items: KarteItem[] }) {
  if (items.length === 0) return <Empty note="まだ先生からの練習後カルテはありません。演奏に先生がコメントすると、ここに届きます。" />
  const md = (iso: string) => { const d = new Date(iso); return `${d.getMonth() + 1}/${d.getDate()}` }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {items.map((k, i) => (
        <Link key={i} href={k.href} className={`${ds.card} pressable`} style={{ padding: "13px 15px", textDecoration: "none", color: "inherit", display: "block" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <b style={{ fontSize: 13, color: "var(--text-ink)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k.title}</b>
            <span style={{ marginLeft: "auto", flex: "none", fontSize: 10, color: "var(--text-muted)", fontWeight: 700 }}>{md(k.when)}</span>
          </div>
          <div style={{ fontSize: "var(--fs-body)", color: "var(--text-sub)", lineHeight: 1.6, marginTop: 5, whiteSpace: "pre-wrap" }}>{k.body}</div>
          <div style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "#7fa4e8", marginTop: 7 }}>この演奏の練習後カルテをひらく →</div>
        </Link>
      ))}
    </div>
  )
}

function ReviewTab({ userId, feedbacks }: { userId: string; feedbacks: Feedback[] }) {
  if (feedbacks.length === 0) return <Empty note="まだ先生からの添削はありません。先生が譜面に書き込むと、ここに届きます。" />
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {feedbacks.map((f) => (
        <Link key={f.scoreId} href={`/${userId}/scores/${f.scoreId}`} className={`${ds.card} pressable`}
          style={{ padding: "13px 15px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, textDecoration: "none", color: "inherit" }}>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 800, color: "var(--text-ink)", overflow: "hidden" }}><NotebookPen size={14} style={{ flex: "none", color: "#7fa4e8" }} /> <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.title}</span></span>
            <span style={{ display: "block", fontSize: 11, color: "var(--text-sub)", marginTop: 2 }}>{f.date} に更新</span>
          </span>
          <span style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "#7fa4e8", flex: "none" }}>譜面で見る →</span>
        </Link>
      ))}
    </div>
  )
}

/* 0件 (原本 先生05: ✉カード) */
function Empty({ note }: { note: React.ReactNode }) {
  return (
    <div className={ds.card} style={{ textAlign: "center", padding: "28px 20px" }}>
      <div style={{ fontSize: 26, opacity: 0.5 }} aria-hidden>✉</div>
      <span style={{ display: "block", fontSize: 12, color: "var(--text-sub)", marginTop: 9, lineHeight: 1.9 }}>{note}</span>
    </div>
  )
}
