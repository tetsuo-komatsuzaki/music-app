"use client"

// 癖マップの共通表示 (2026-08-02): 6ビューのサムネイル+件数バッジ → 部位ハイライト+タグ一覧。
// 生徒の成長カルテと先生の生徒カルテの両方から使う (タグごと最新の所見を渡す)。
// 癖は演奏ではなく本人に紐づく。タグの現在状態 = 最新所見の severity:
//   mild(気になる) / focus(要重点) / improving(🌿良くなってきた) / resolved(🌱克服=卒業)
// renderTagActions を渡すと各タグ行に操作UIが出る (先生の経過記録用)。
import { useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { Sprout } from "lucide-react"
import { BODY_VIEWS, spotOfTag, spotsOf, type BodyViewId } from "@/app/_libs/bodyMap"
import { resolveObsTag } from "@/app/_libs/observationCatalog"
import BodyFigure from "@/app/components/BodyFigure"

export interface BodyObsItem {
  tagId: string
  severity: string | null
  date: string
  /** どんな時の癖か (対象わざのラベル・2026-08-12 Tetsuo指摘: 項目の概念が無く何の癖か不明だった) */
  targets?: string[]
}

// ダーク化 (2026-08-22 カルテ写経): 構造は承認済み(2026-08-02/16)のまま配色のみ
const BAD = { c: "#e8a78f", bg: "rgba(232,138,111,.14)", bd: "rgba(232,138,111,.3)" }
const SUB = "var(--text-sub)"

function sevPill(s: string | null) {
  if (s === "focus") return { l: "要重点", c: BAD.c, bg: BAD.bg, bd: BAD.bd }
  if (s === "improving") return { l: "良くなってきた", c: "#a8c97f", bg: "rgba(168,201,127,.14)", bd: "rgba(168,201,127,.35)" }
  return { l: "気になる", c: "#e0b25c", bg: "rgba(224,160,47,.14)", bd: "rgba(224,160,47,.3)" }
}

export default function BodyObsMap({ tags, renderTagActions }: {
  tags: BodyObsItem[]
  renderTagActions?: (tag: BodyObsItem) => ReactNode
}) {
  const [viewId, setViewId] = useState<BodyViewId | null>(null)
  // タップで拡大 (2026-08-16 Tetsuo指定: 小さい図では癖ポイントが見にくいため)
  const [zoom, setZoom] = useState(false)

  // 🌱克服したタグはマップから卒業し、下部の「克服した癖」に移る。
  // resolveObsTag はカタログタグと自由記入タグ (custom::部位::文言) の両対応 (2026-08-16)
  const active = tags.filter((t) => t.severity !== "resolved" && resolveObsTag(t.tagId))
  const resolved = tags.filter((t) => t.severity === "resolved" && resolveObsTag(t.tagId))

  const tagsOf = (v: BodyViewId): BodyObsItem[] => active.filter((t) => spotOfTag(t.tagId)?.view === v)
  const nonBody = active.filter((t) => !spotOfTag(t.tagId))

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
              style={{ position: "relative", background: "var(--card-in)", border: "1.5px solid", borderColor: on ? "#7fa4e8" : vt.length ? (focus ? BAD.bd : "rgba(232,178,60,.3)") : "rgba(150,175,225,.14)", borderRadius: 11, padding: "6px 4px 4px", cursor: "pointer" }}>
              <BodyFigure view={v.id} />
              <div style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--text-ink)", marginTop: 2 }}>{v.short}</div>
              {vt.length > 0 && (
                <span style={{ position: "absolute", top: -6, right: -5, minWidth: 17, height: 17, borderRadius: 999, background: focus ? BAD.c : "#c98a2a", color: "var(--text-on-accent)", fontSize: "var(--fs-label)", fontWeight: 900, display: "grid", placeItems: "center", padding: "0 4px", border: "1.5px solid #101c36" }}>
                  {vt.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 選択ビューの詳細 */}
      {sel && (
        <div style={{ border: "1px solid rgba(150,175,225,.12)", borderRadius: 13, marginTop: 10, overflow: "hidden" }}>
          <div style={{ background: "rgba(150,175,225,.08)", padding: "8px 12px", fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-ink)", display: "flex", alignItems: "center", gap: 5 }}>
            <sel.Icon size={14} /> {sel.label}
          </div>
          <div style={{ padding: 10 }}>
            <button type="button" onClick={() => setZoom(true)} aria-label="癖マップを拡大表示"
              style={{ display: "block", width: "100%", position: "relative", background: "var(--card-in)", border: "1px solid rgba(150,175,225,.14)", borderRadius: 11, padding: 6, cursor: "zoom-in", textAlign: "left" }}>
              <BodyFigure view={sel.id} />
              {spotsOf(sel.id).map((s) => {
                const cnt = selTags.filter((t) => spotOfTag(t.tagId)?.id === s.id).length
                if (cnt === 0) return null
                const focus = selTags.some((t) => spotOfTag(t.tagId)?.id === s.id && t.severity === "focus")
                return (
                  <span key={s.id}
                    style={{ position: "absolute", left: `${s.x}%`, top: `${s.y}%`, transform: "translate(-50%, -50%)", fontSize: "var(--fs-label)", fontWeight: 900, borderRadius: 999, padding: "3px 8px", background: focus ? BAD.c : "#c98a2a", color: "var(--text-on-accent)", boxShadow: "0 1px 4px rgba(60,50,30,.25)", whiteSpace: "nowrap" }}>
                    {s.label} {cnt}
                  </span>
                )
              })}
              <span style={{ position: "absolute", right: 9, bottom: 8, fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--text-sub)", background: "rgba(16,28,54,.85)", borderRadius: 999, padding: "2px 9px" }}>タップで拡大</span>
            </button>
            {selTags.length === 0 ? (
              <div style={{ fontSize: "var(--fs-caption)", color: SUB, marginTop: 8 }}>この場所の癖は記録されていません。いい調子！</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 9 }}>
                {selTags.map((t) => {
                  const sev = sevPill(t.severity)
                  return (
                    <div key={t.tagId} style={{ border: "1px solid rgba(150,175,225,.12)", borderRadius: 9, padding: "7px 10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                        <span style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: sev.c, background: sev.bg, border: `1px solid ${sev.bd}`, borderRadius: 999, padding: "2px 7px" }}>{sev.l}</span>
                        {(t.targets?.length ?? 0) > 0 && (
                          <span style={{ fontSize: "var(--fs-label)", fontWeight: 900, color: "#9db8e8", background: "rgba(43,91,196,.22)", border: "1px solid transparent", borderRadius: 6, padding: "1px 7px" }}>
                            {t.targets!.join("・")}のとき
                          </span>
                        )}
                        <span style={{ fontSize: "var(--fs-caption)", fontWeight: 700, color: "var(--text-ink)" }}>{resolveObsTag(t.tagId)?.label ?? t.tagId}</span>
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
                  {(t.targets?.length ?? 0) > 0 && (
                    <span style={{ fontSize: "var(--fs-label)", fontWeight: 900, color: "#9db8e8", background: "rgba(43,91,196,.22)", border: "1px solid transparent", borderRadius: 6, padding: "1px 7px" }}>
                      {t.targets!.join("・")}のとき
                    </span>
                  )}
                  <span style={{ fontSize: "var(--fs-caption)", fontWeight: 700, color: sev.c, background: sev.bg, border: `1px solid ${sev.bd}`, borderRadius: 999, padding: "4px 10px" }}>
                    {resolveObsTag(t.tagId)?.label ?? t.tagId}
                  </span>
                  {renderTagActions && renderTagActions(t)}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 拡大モーダル (2026-08-16): 図を全画面近くまで広げてピンを見やすく */}
      {zoom && sel && typeof document !== "undefined" && createPortal(
        <div onClick={() => setZoom(false)} role="dialog" aria-modal="true" aria-label={`${sel.label}の癖マップ拡大表示`}
          style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(11,30,58,.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ position: "relative", width: "100%", maxWidth: 520, maxHeight: "92vh", overflowY: "auto", background: "linear-gradient(180deg,#16264a,#101c36)", border: "1px solid rgba(150,175,225,.16)", borderRadius: 16, padding: 12 }}>
            <button type="button" onClick={() => setZoom(false)} aria-label="閉じる"
              style={{ position: "absolute", top: 8, right: 10, zIndex: 2, border: "none", background: "rgba(150,175,225,.14)", borderRadius: 999, width: 30, height: 30, fontSize: "var(--fs-subhead)", color: "var(--text-sub)", cursor: "pointer" }}>✕</button>
            <div style={{ fontSize: "var(--fs-caption)", fontWeight: 900, color: "var(--text-ink)", margin: "2px 0 8px", display: "flex", alignItems: "center", gap: 5 }}>
              <sel.Icon size={15} /> {sel.label}
            </div>
            <div style={{ position: "relative" }}>
              <BodyFigure view={sel.id} />
              {spotsOf(sel.id).map((s) => {
                const cnt = selTags.filter((t) => spotOfTag(t.tagId)?.id === s.id).length
                if (cnt === 0) return null
                const focus = selTags.some((t) => spotOfTag(t.tagId)?.id === s.id && t.severity === "focus")
                return (
                  <span key={s.id}
                    style={{ position: "absolute", left: `${s.x}%`, top: `${s.y}%`, transform: "translate(-50%, -50%)", fontSize: "var(--fs-caption)", fontWeight: 900, borderRadius: 999, padding: "5px 11px", background: focus ? BAD.c : "#c98a2a", color: "var(--text-on-accent)", boxShadow: "0 2px 8px rgba(60,50,30,.35)", whiteSpace: "nowrap" }}>
                    {s.label} {cnt}
                  </span>
                )
              })}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 10 }}>
              {selTags.map((t) => (
                <div key={t.tagId} style={{ fontSize: "var(--fs-caption)", fontWeight: 700, color: "var(--text-ink)", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.severity === "focus" ? BAD.c : "#c98a2a", flex: "none" }} />
                  {spotOfTag(t.tagId)?.label && <b style={{ color: "#7fa4e8", fontWeight: 800 }}>{spotOfTag(t.tagId)!.label}</b>}
                  {resolveObsTag(t.tagId)?.label ?? t.tagId}
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* 🌱 克服した癖 (卒業リスト) */}
      {resolved.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-good)", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}><Sprout size={13} /> 克服した癖</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {resolved.map((t) => (
              <span key={t.tagId} style={{ fontSize: "var(--fs-caption)", fontWeight: 700, color: "var(--text-sub)", background: "rgba(168,201,127,.1)", border: "1px solid rgba(168,201,127,.3)", borderRadius: 999, padding: "4px 10px", textDecoration: "line-through" }}>
                {resolveObsTag(t.tagId)?.label ?? t.tagId}
                <span style={{ textDecoration: "none", marginLeft: 5, fontSize: "var(--fs-label)", color: "var(--text-muted)" }}>{t.date}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
