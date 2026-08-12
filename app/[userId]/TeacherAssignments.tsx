"use client"

// 生徒ホームの「先生から」= 省スペース版 (2026-08-11 再設計)。
// カテゴリタブ(宿題/添削/お祝い) + 横スワイプ + アコーディオン(全体を畳む)。
// 常にコンパクト(開いても約120px/畳めば1行)。1枚に1件集中。参照系(やりとり/所見)は下に小リンク。
import { useEffect, useRef, useState } from "react"
import { GraduationCap, PartyPopper, ClipboardList, Calendar, MessageCircle, PenLine, Target, Palette, ChevronRight, ChevronDown, FileText } from "lucide-react"
import Link from "next/link"
import { MOOD_TAG_BY_ID } from "@/app/_libs/moodTags"
import { useParams } from "next/navigation"
import { goalLabel, dueInfo } from "@/app/_libs/assignmentGoal"

export type StudentAssignment = {
  id: string
  kind: "score" | "practice"
  teacherName: string
  title: string
  reps: number | null
  targetTempo: number | null
  comment: string | null
  href: string
  dueDate: string | null
  goalType: string | null
  targetScore: number | null
  moodTagId?: string | null
  submitted?: boolean
  achieved: boolean
  mastered: boolean
}

export type TeacherHomeSummary = {
  unreadKarte?: number
  unreadPassed?: number
  teacherName: string | null
  unreadMessages: number
  feedbackCount: number
  unreadCelebration?: boolean
  recentObservations?: number
}

const DUE_CALM = {
  overdue: { fg: "#b0524c", bg: "#f7ebea", bd: "#eed6d3" },
  soon: { fg: "#a9762f", bg: "#f7f1e6", bd: "#ecdfc8" },
  normal: { fg: "#5a636e", bg: "#f2f4f7", bd: "#e6e9ee" },
}
const chip: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 4, fontSize: "var(--fs-label)", fontWeight: 800, borderRadius: 6, padding: "2px 7px", whiteSpace: "nowrap", lineHeight: 1.2 }
const goalChip: React.CSSProperties = { ...chip, color: "#1f3d78", background: "#eaf0fc" }
const exprChip: React.CSSProperties = { ...chip, color: "#c0891f", background: "#f9f0d8", border: "1px solid #ecd8a4" }

type Cat = "hw" | "pass" | "karte" | "fb" | "cel" | "obs"
type Slide = { cat: Cat; node: React.ReactNode }

export default function TeacherAssignments({
  assignments,
  summary,
}: {
  assignments: StudentAssignment[]
  summary?: TeacherHomeSummary
}) {
  const { userId } = useParams<{ userId: string }>()
  const [open, setOpen] = useState(true)
  const [idx, setIdx] = useState(0)
  const vpRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; dx: number; on: boolean }>({ x: 0, dx: 0, on: false })
  const [w, setW] = useState(0)

  // ── カルーセル位置 (imperative transform)。フックは早期returnより前に置く ──
  const applyT = (i: number, animate: boolean) => {
    const t = trackRef.current
    if (!t) return
    t.style.transition = animate ? "transform .28s cubic-bezier(.22,1,.36,1)" : "none"
    t.style.transform = `translateX(${-i * w}px)`
  }
  useEffect(() => {
    if (!open) return
    const measure = () => setW(vpRef.current?.clientWidth ?? 0)
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [open])
  useEffect(() => { applyT(idx, false) }, [w, open]) // eslint-disable-line react-hooks/exhaustive-deps

  const unread = summary?.unreadMessages ?? 0
  const unreadKarte = summary?.unreadKarte ?? 0
  const unreadPassed = summary?.unreadPassed ?? 0
  const feedback = summary?.feedbackCount ?? 0
  const recentObs = summary?.recentObservations ?? 0
  const celebration = !!summary?.unreadCelebration
  const hwCount = assignments.length
  if (hwCount === 0 && unread === 0 && unreadKarte === 0 && unreadPassed === 0 && feedback === 0 && recentObs === 0 && !celebration) return null

  // 畳んだ見出しの要約 = 一番近い期限の宿題
  const withDue = assignments.filter((a) => a.dueDate)
  const nearest = withDue.length
    ? withDue.reduce((a, b) => (new Date(a.dueDate as string).getTime() <= new Date(b.dueDate as string).getTime() ? a : b))
    : assignments[0] ?? null
  const nearestDi = nearest?.dueDate ? dueInfo(nearest.dueDate) : null

  // ── スライド (宿題→添削→お祝いの順) ──
  const slides: Slide[] = []
  for (const a of assignments) {
    const di = dueInfo(a.dueDate)
    const goal = goalLabel(a.goalType, a.targetScore)
    const initial = (a.teacherName ?? "先").trim().charAt(0) || "先"
    slides.push({
      cat: "hw",
      node: (
        <Link href={a.href} className="pressable" style={cardStyle}>
          <span style={{ ...av, background: "linear-gradient(135deg,#d6547a,#e57a97)", color: "#fff" }}>{initial}</span>
          <span style={cbody}>
            <span style={who}>{a.teacherName} 先生{a.kind === "score" ? " ・ 曲" : " ・ 基礎練"}</span>
            <span style={title}>{a.title}</span>
            <span style={chips}>
              {goal && <span style={{ ...goalChip }}><Target size={11} /> {goal}{a.reps ? `・${a.reps}回` : ""}</span>}
              {a.targetTempo && <span style={{ ...chip, color: "var(--text-body)", background: "#f2f4f7", border: "1px solid #e6e9ee" }}>♩={a.targetTempo}</span>}
              {a.moodTagId && <span style={exprChip}><Palette size={11} /> {MOOD_TAG_BY_ID[a.moodTagId]?.label ?? a.moodTagId}</span>}
              {a.submitted && <span style={{ ...chip, color: "#158253", background: "#e9f8f0", border: "1px solid #c8ecd8" }}>提出ずみ ・ 先生の合格待ち</span>}
              {di && (() => { const c = DUE_CALM[di.state]; return <span style={{ ...chip, color: c.fg, background: c.bg, border: `1px solid ${c.bd}` }}><Calendar size={11} /> {di.label}{di.state === "overdue" ? "" : di.state === "soon" ? "" : ""}</span> })()}
            </span>
          </span>
          <ChevronRight size={18} style={{ flex: "none", color: "var(--text-muted)" }} />
        </Link>
      ),
    })
  }
  if (unreadPassed > 0) {
    slides.push({
      cat: "pass",
      node: (
        <Link href={`/${userId}/my-teacher?tab=passed`} className="pressable" style={cardStyle}>
          <span style={{ ...av, background: "#e2f5ea", color: "#158253" }}><PartyPopper size={17} /></span>
          <span style={cbody}>
            <span style={who}>{summary?.teacherName ?? "先生"}</span>
            <span style={{ ...title, color: "#158253" }}>宿題に合格したよ！・{unreadPassed}件</span>
            <span style={chips}><span style={{ ...chip, color: "#158253", background: "#e2f5ea", border: "1px solid #c8ecd8" }}>合格の履歴を見る</span></span>
          </span>
          <ChevronRight size={18} style={{ flex: "none", color: "var(--text-muted)" }} />
        </Link>
      ),
    })
  }
  if (unreadKarte > 0) {
    slides.push({
      cat: "karte",
      node: (
        <Link href={`/${userId}/my-teacher?tab=karte`} className="pressable" style={cardStyle}>
          <span style={{ ...av, background: "#e8effc", color: "#2b5bc4" }}><FileText size={17} /></span>
          <span style={cbody}>
            <span style={who}>{summary?.teacherName ?? "先生"}</span>
            <span style={{ ...title, color: "#2b5bc4" }}>練習後カルテが届いたよ・{unreadKarte}件</span>
            <span style={chips}><span style={{ ...chip, color: "#2b5bc4", background: "#e8effc", border: "1px solid #d3e0f7" }}>先生の返しを見る</span></span>
          </span>
          <ChevronRight size={18} style={{ flex: "none", color: "var(--text-muted)" }} />
        </Link>
      ),
    })
  }
  // 添削通知は削除 (2026-08-11 Tetsuo指示: 添削機能の廃止にともない通知も不要)
  void feedback
  // 癖の所見スライド (2026-08-12 Tetsuo指示: リンクからスライドへ昇格。
  // 既読の仕組みが無いため「直近7日は表示」ルールで消える)
  if (recentObs > 0) {
    slides.push({
      cat: "obs",
      node: (
        <Link href={`/${userId}/progress`} className="pressable" style={cardStyle}>
          <span style={{ ...av, background: "#f6f4ff", color: "#7a4dd6" }}><ClipboardList size={17} /></span>
          <span style={cbody}>
            <span style={who}>{summary?.teacherName ?? "先生"}</span>
            <span style={title}>先生が癖を記録したよ</span>
            <span style={chips}><span style={{ ...chip, color: "#7a4dd6", background: "#f6f4ff", border: "1px solid #e3d8f7" }}>癖マップで見る</span></span>
          </span>
          <ChevronRight size={18} style={{ flex: "none", color: "var(--text-muted)" }} />
        </Link>
      ),
    })
  }
  if (celebration) {
    slides.push({
      cat: "cel",
      node: (
        <Link href={`/${userId}/my-teacher`} className="pressable" style={cardStyle}>
          <span style={{ ...av, background: "#f9f0d8", color: "#c0891f" }}><PartyPopper size={17} /></span>
          <span style={cbody}>
            <span style={who}>{summary?.teacherName ?? "先生"}</span>
            <span style={{ ...title, color: "#c0891f" }}>お祝いが届いたよ！</span>
            <span style={chips}><span style={{ ...chip, color: "#c0891f", background: "#f9f0d8", border: "1px solid #ecd8a4" }}>メッセージを見る</span></span>
          </span>
          <ChevronRight size={18} style={{ flex: "none", color: "var(--text-muted)" }} />
        </Link>
      ),
    })
  }

  const N = slides.length
  const cats = slides.map((s) => s.cat)
  const CAT_LABEL: Record<Cat, string> = { hw: "宿題", pass: "合格", karte: "練習後カルテ", fb: "添削", cel: "お祝い", obs: "癖" }
  const tabCats = [...new Set(cats)]
  const catCount = (c: Cat) => cats.filter((x) => x === c).length
  const curCat = cats[idx] ?? "hw"
  const groupIdxs = slides.map((_, i) => i).filter((i) => cats[i] === curCat)

  const settle = (i: number) => { const c = Math.max(0, Math.min(N - 1, i)); applyT(c, true); setIdx(c) }

  return (
    <section style={{ margin: "0 0 14px", background: "#fff", border: "1px solid #eef1f4", borderRadius: 16, padding: "4px 4px 6px", boxShadow: "0 1px 3px rgba(30,45,70,.04)" }}>
      {/* アコーディオン見出し */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", padding: "9px 10px", cursor: "pointer", font: "inherit", textAlign: "left" }}
      >
        <span style={{ flex: "none", width: 28, height: 28, borderRadius: "50%", background: "#f7edf1", color: "#d6547a", display: "grid", placeItems: "center" }}><GraduationCap size={15} /></span>
        <span style={{ fontSize: "var(--fs-body)", fontWeight: 900, color: "var(--text-ink)", display: "inline-flex", alignItems: "center", gap: 5, flex: "none" }}>
          先生から{N > 0 && <span style={{ fontSize: "var(--fs-label)", fontWeight: 900, color: "#fff", background: "#2b5bc4", borderRadius: 999, padding: "1px 7px" }}>{N}</span>}
        </span>
        {!open && nearest && (
          <span style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0, flex: 1 }}>
            {nearest.title}{nearestDi ? ` ・ ${nearestDi.label}${nearestDi.state === "overdue" ? "" : nearestDi.state === "soon" ? "" : ""}` : ""}
          </span>
        )}
        <ChevronDown size={18} style={{ marginLeft: open ? "auto" : 0, flex: "none", color: "var(--text-muted)", transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
      </button>

      {open && (
        <div style={{ padding: "0 6px 4px" }}>
          {/* カテゴリタブ */}
          {tabCats.length > 1 && (
            <div style={{ display: "flex", gap: 6, padding: "2px 2px 8px" }}>
              {tabCats.map((c) => {
                const on = curCat === c
                const cnt = catCount(c)
                return (
                  <button
                    key={c}
                    type="button"
                    className="pressable"
                    onClick={() => { const first = cats.indexOf(c); if (first >= 0) settle(first) }}
                    style={{ fontSize: "var(--fs-label)", fontWeight: 800, borderRadius: 999, padding: "5px 12px", border: `1px solid ${on ? "transparent" : "#e4e9f1"}`, background: on ? "var(--text-ink)" : "#fff", color: on ? "#fff" : "var(--text-sub)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}
                  >
                    {CAT_LABEL[c]}{cnt > 1 && <span style={{ fontSize: "var(--fs-label)", fontWeight: 900, borderRadius: 999, padding: "0 5px", background: on ? "rgba(255,255,255,.25)" : "#eef2f8", color: on ? "#fff" : "var(--text-muted)" }}>{cnt}</span>}
                  </button>
                )
              })}
            </div>
          )}

          {/* 横スワイプ カルーセル */}
          <div ref={vpRef} style={{ overflow: "hidden", borderRadius: 14 }}>
            <div
              ref={trackRef}
              style={{ display: "flex", touchAction: "pan-y", transform: `translateX(${-idx * w}px)` }}
              onPointerDown={(e) => { drag.current = { x: e.clientX, dx: 0, on: true }; if (trackRef.current) trackRef.current.style.transition = "none"; try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* noop */ } }}
              onPointerMove={(e) => { const d = drag.current; if (!d.on) return; d.dx = e.clientX - d.x; if (trackRef.current) trackRef.current.style.transform = `translateX(${-idx * w + d.dx}px)` }}
              onPointerUp={() => { const d = drag.current; if (!d.on) return; d.on = false; settle(Math.abs(d.dx) > w * 0.18 ? idx + (d.dx < 0 ? 1 : -1) : idx) }}
              onPointerCancel={() => { const d = drag.current; if (!d.on) return; d.on = false; settle(idx) }}
            >
              {slides.map((s, i) => (
                <div key={i} style={{ flex: "0 0 100%", minWidth: 0, padding: 1 }}>{s.node}</div>
              ))}
            </div>
          </div>

          {/* 同カテゴリ複数のドット */}
          {groupIdxs.length > 1 && (
            <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 7 }}>
              {groupIdxs.map((gi) => (
                <span key={gi} style={{ width: gi === idx ? 13 : 5, height: 5, borderRadius: gi === idx ? 3 : "50%", background: gi === idx ? "#2b5bc4" : "#e4e9f1", transition: "all .2s" }} />
              ))}
            </div>
          )}

          {/* 参照リンク */}
          {/* 所見はスライドへ昇格 (2026-08-12)。参照リンクはやりとりのみ */}
          {unread > 0 && (
            <div style={{ display: "flex", gap: 12, margin: "9px 4px 2px", flexWrap: "wrap" }}>
              <Link href={`/${userId}/my-teacher`} style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-sub)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                <MessageCircle size={13} /> やりとり・{unread}
              </Link>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

const cardStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1px solid #eef1f4", borderRadius: 14, padding: "11px 13px", textDecoration: "none", color: "inherit", minHeight: 60 }
const av: React.CSSProperties = { flex: "none", width: 34, height: 34, borderRadius: "50%", display: "grid", placeItems: "center", fontWeight: 900, fontSize: "var(--fs-body)" }
const cbody: React.CSSProperties = { minWidth: 0, flex: 1 }
const who: React.CSSProperties = { display: "block", fontSize: "var(--fs-label)", color: "var(--text-muted)", fontWeight: 700, lineHeight: 1.1 }
const title: React.CSSProperties = { display: "block", fontSize: "var(--fs-body)", fontWeight: 900, color: "var(--text-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }
const chips: React.CSSProperties = { display: "flex", gap: 5, marginTop: 3, flexWrap: "wrap" }
