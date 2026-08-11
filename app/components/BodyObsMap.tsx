"use client"

// 癖マップの共通表示 (2026-08-02): 6ビューのサムネイル+件数バッジ → 部位ハイライト+タグ一覧。
// 生徒の成長カルテと先生の生徒カルテの両方から使う (タグごと最新の所見を渡す)。
// 癖は演奏ではなく本人に紐づく。タグの現在状態 = 最新所見の severity:
//   mild(気になる) / focus(要重点) / improving(🌿良くなってきた) / resolved(🌱克服=卒業)
// renderTagActions を渡すと各タグ行に操作UIが出る (先生の経過記録用)。
import { useState, type ReactNode } from "react"
import { Sprout } from "lucide-react"
import { BODY_VIEWS, SPOT_BY_TAG, spotsOf, type BodyViewId } from "@/app/_libs/bodyMap"
import { OBSERVATION_TAG_BY_ID } from "@/app/_libs/observationCatalog"
import BodyFigure from "@/app/components/BodyFigure"

export interface BodyObsItem {
  tagId: string
  severity: string | null
  date: string
}

const BAD = { c: "#c0473a", bg: "#fbecea", bd: "#f0d4d0" }
const SUB = "#8a9099"

function sevPill(s: string | null) {
  if (s === "focus") return { l: "要重点", c: BAD.c, bg: BAD.bg, bd: BAD.bd }
  if (s === "improving") return { l: "良くなってきた", c: "#2e8b57", bg: "#e9f5ee", bd: "#cfe6d8" }
  return { l: "気になる", c: "#b7823a", bg: "#faf1e1", bd: "#ecdfc8" }
}

export default function BodyObsMap({ tags, renderTagActions }: {
  tags: BodyObsItem[]
  renderTagActions?: (tag: BodyObsItem) => ReactNode
}) {
  const [viewId, setViewId] = useState<BodyViewId | null>(null)

  // 🌱克服したタグはマップから卒業し、下部の「克服した癖」に移る
  const active = tags.filter((t) => t.severity !== "resolved" && OBSERVATION_TAG_BY_ID[t.tagId])
  const resolved = tags.filter((t) => t.severity === "resolved" && OBSERVATION_TAG_BY_ID[t.tagId])

  const tagsOf = (v: BodyViewId): BodyObsItem[] => active.filter((t) => SPOT_BY_TAG[t.tagId]?.view === v)
  const nonBody = active.filter((t) => !SPOT_BY_TAG[t.tagId])

  const sel = viewId ? BODY_VIEWS.find((v) => v.id === viewId)! : null
  const selTags = viewId ? tagsOf(viewId) : []

  return (
    <div>
      {/* サムネイル一覧 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {BODY_VIEWS.map((v) => {
          const vt = tagsOf(v.id)
          const focus = vt.some((t) => t.severity === "focus")
          const on = viewId === v.id
          return (
            <button key={v.id} type="button" onClick={() => setViewId(on ? null : v.id)}
              style={{ position: "relative", background: "#fdfaf4", border: "1.5px solid", borderColor: on ? "#4a5bd0" : vt.length ? (focus ? BAD.bd : "#ecdfc8") : "#f0e9db", borderRadius: 11, padding: "6px 4px 4px", cursor: "pointer" }}>
              <BodyFigure view={v.id} />
              <div style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--text-body)", marginTop: 2 }}>{v.short}</div>
              {vt.length > 0 && (
                <span style={{ position: "absolute", top: -6, right: -5, minWidth: 17, height: 17, borderRadius: 999, background: focus ? BAD.c : "#c98a2a", color: "var(--text-on-accent)", fontSize: "var(--fs-label)", fontWeight: 900, display: "grid", placeItems: "center", padding: "0 4px", border: "1.5px solid #fff" }}>
                  {vt.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 選択ビューの詳細 */}
      {sel && (
        <div style={{ border: "1px solid #eef1f4", borderRadius: 13, marginTop: 10, overflow: "hidden" }}>
          <div style={{ background: "#f7f4ec", padding: "8px 12px", fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-body)", display: "flex", alignItems: "center", gap: 5 }}>
            <sel.Icon size={14} /> {sel.label}
          </div>
          <div style={{ padding: 10 }}>
            <div style={{ position: "relative", background: "#fdfaf4", border: "1px solid #f0e9db", borderRadius: 11, padding: 6 }}>
              <BodyFigure view={sel.id} />
              {spotsOf(sel.id).map((s) => {
                const cnt = selTags.filter((t) => SPOT_BY_TAG[t.tagId]?.id === s.id).length
                if (cnt === 0) return null
                const focus = selTags.some((t) => SPOT_BY_TAG[t.tagId]?.id === s.id && t.severity === "focus")
                return (
                  <span key={s.id}
                    style={{ position: "absolute", left: `${s.x}%`, top: `${s.y}%`, transform: "translate(-50%, -50%)", fontSize: "var(--fs-label)", fontWeight: 900, borderRadius: 999, padding: "3px 8px", background: focus ? BAD.c : "#c98a2a", color: "var(--text-on-accent)", boxShadow: "0 1px 4px rgba(60,50,30,.25)", whiteSpace: "nowrap" }}>
                    {s.label} {cnt}
                  </span>
                )
              })}
            </div>
            {selTags.length === 0 ? (
              <div style={{ fontSize: "var(--fs-caption)", color: SUB, marginTop: 8 }}>この場所の癖は記録されていません。いい調子！</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 9 }}>
                {selTags.map((t) => {
                  const sev = sevPill(t.severity)
                  return (
                    <div key={t.tagId} style={{ border: "1px solid #eef1f4", borderRadius: 9, padding: "7px 10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                        <span style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: sev.c, background: sev.bg, border: `1px solid ${sev.bd}`, borderRadius: 999, padding: "2px 7px" }}>{sev.l}</span>
                        <span style={{ fontSize: "var(--fs-caption)", fontWeight: 700, color: "var(--text-ink)" }}>{OBSERVATION_TAG_BY_ID[t.tagId]?.label ?? t.tagId}</span>
                        <span style={{ marginLeft: "auto", fontSize: "var(--fs-label)", color: "var(--text-muted)" }}>{t.date}</span>
                      </div>
                      {renderTagActions && <div style={{ marginTop: 6 }}>{renderTagActions(t)}</div>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 体で表せない癖 (リズム・習慣など) */}
      {nonBody.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: SUB, marginBottom: 6 }}>体の外の癖</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {nonBody.map((t) => {
              const sev = sevPill(t.severity)
              return (
                <div key={t.tagId} style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                  <span style={{ fontSize: "var(--fs-caption)", fontWeight: 700, color: sev.c, background: sev.bg, border: `1px solid ${sev.bd}`, borderRadius: 999, padding: "4px 10px" }}>
                    {OBSERVATION_TAG_BY_ID[t.tagId]?.label ?? t.tagId}
                  </span>
                  {renderTagActions && renderTagActions(t)}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 🌱 克服した癖 (卒業リスト) */}
      {resolved.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-good)", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}><Sprout size={13} /> 克服した癖</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {resolved.map((t) => (
              <span key={t.tagId} style={{ fontSize: "var(--fs-caption)", fontWeight: 700, color: "var(--text-sub)", background: "#f2f6f3", border: "1px solid #dbe6de", borderRadius: 999, padding: "4px 10px", textDecoration: "line-through" }}>
                {OBSERVATION_TAG_BY_ID[t.tagId]?.label ?? t.tagId}
                <span style={{ textDecoration: "none", marginLeft: 5, fontSize: "var(--fs-label)", color: "var(--text-muted)" }}>{t.date}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
