"use client"

// 指板ヒートマップ表示パネル (2026-08-11 Tetsuo確定: 案4=2カラム・タップで右の詳細が切替)
// 横向き表示 (ナット左・E線上・右=高ポジション)。n<5セルは無色(白)。
// markable=true (先生カルテ入力=案5) で「気をつける音をマークする」モードが使える。
import { useMemo, useState, useTransition } from "react"
import { createPortal } from "react-dom"
import {
  STRINGS, type ViolinString, N_END, H_OPEN, Y_END, colX, cellPolygon, cellId, yOf,
} from "@/app/_libs/fingerboard/geometry"
import { CELL_FILLS, type CellStatus } from "@/app/_libs/fingerboard/colors"
import { posLabel, type HeatCellOut, type CellDetail, type TransitionRow } from "@/app/_libs/fingerboard/heatmapTypes"
import { recordQuestEvent } from "@/app/actions/questEvents"

export type FingerboardMark = { cellId: string; note: string }

// (x,y) -> (y,-x): ナット左・E線(右端カラム)が上になる横向き変換
const rot = (p: readonly (readonly [number, number])[]) => p.map(([x, y]) => [y, -x] as const)
const pts = (p: readonly (readonly [number, number])[]) => p.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ")

// 基準がわかる言い方に統一 (2026-08-11 Tetsuo指示): 音が低い / 音が高い / (ミス0=) 音が正確
const DIR_LABEL = { high: "音が高い", low: "音が低い", mixed: "高低にブレ" } as const
const STATUS_LABEL: Record<CellStatus, string> = {
  insufficient: "", stable: "安定", sharp: "高すぎ", flat: "低すぎ", unstable: "両方にブレる",
}
const STATUS_INK: Record<CellStatus, string> = {
  insufficient: "#8b97a8", stable: "#2e8b57", sharp: "#c0473a", flat: "#2b5bc4", unstable: "#7a4dd6",
}

export default function FingerboardPanel({
  cells, details, marks = [], markable = false, onSaveMark, onRemoveMark, emptyText, stack = false,
  initialZoom = false, initialSel = null, guideCellId, modalTopOffset,
}: {
  cells: Record<string, HeatCellOut>
  details: Record<string, CellDetail>
  /** 先生の「気をつける音」マーク (生徒側は表示のみ) */
  marks?: FingerboardMark[]
  /** 案5: マーキングモードを出す (先生カルテ入力画面のみ) */
  markable?: boolean
  onSaveMark?: (cellId: string, note: string) => Promise<boolean>
  onRemoveMark?: (cellId: string) => Promise<boolean>
  emptyText?: string
  /** 縦積みレイアウト (演奏履歴カード内など狭い場所用: 指板を全幅で大きく) */
  stack?: boolean
  /** ガイドのデモ用: 初期状態で拡大モーダルを開く/セルを選択しておく (通常画面では未使用) */
  initialZoom?: boolean
  initialSel?: string | null
  /** ガイドのデモ用: このセルに data-guide="map-red-cell" を付ける (金枠の対象) */
  guideCellId?: string
  /** ガイドのデモ用: 拡大モーダルを上端から下げる (スキップ等と被らないように) */
  modalTopOffset?: number
}) {
  const [sel, setSel] = useState<string | null>(initialSel)
  const [zoom, setZoom] = useState(initialZoom) // クリックでモーダル拡大 (2026-08-11 Tetsuo指示)
  const [marking, setMarking] = useState(false)
  const [markNote, setMarkNote] = useState("")
  const [pending, start] = useTransition()
  const markSet = useMemo(() => new Map(marks.map((m) => [m.cellId, m.note])), [marks])
  const hasData = Object.keys(cells).length > 0

  const selDetail = sel ? details[sel] : null
  const selCell = sel ? cells[sel] : null

  const svg = useMemo(() => {
    const nodes: React.ReactNode[] = []
    for (let n = 0; n <= N_END; n++) {
      STRINGS.forEach((s, si) => {
        const id = cellId(s, n)
        const cell = cells[id]
        // n<5(無色)は白。開放弦帯だけデータ無しでも薄グレーで区別
        const fill = cell ? CELL_FILLS[cell.status][cell.level] : n === 0 ? "#f4f4f4" : "#ffffff"
        nodes.push(
          <polygon
            key={id}
            data-guide={guideCellId && id === guideCellId ? "map-red-cell" : undefined}
            points={pts(rot(cellPolygon(si, n)))}
            fill={fill}
            stroke={sel === id ? "#111" : "#c9cdd4"}
            strokeWidth={sel === id ? 1.1 : 0.3}
            onClick={() => setSel(id)}
            style={{ cursor: "pointer" }}
          />,
        )
        // 幹音 (ドレミファソラシ) の音名○ ・ 初見でも何の音か分かるように (2026-08-22 Tetsuo指示。♯♭の枠は描かない)
        const midi = OPEN_MIDI[s] + n
        const NATURAL: Record<number, string> = { 0: "ド", 2: "レ", 4: "ミ", 5: "ファ", 7: "ソ", 9: "ラ", 11: "シ" }
        const kana = NATURAL[midi % 12]
        if (kana) {
          const poly = rot(cellPolygon(si, n))
          const cx = poly.reduce((a2, p2) => a2 + p2[0], 0) / poly.length
          const cy = poly.reduce((a2, p2) => a2 + p2[1], 0) / poly.length
          nodes.push(
            <g key={`nk-${id}`} pointerEvents="none">
              <circle cx={cx} cy={cy} r={2.7} fill="rgba(255,255,255,.9)" stroke="#c2c8d2" strokeWidth={0.25} />
              <text x={cx} y={cy + (kana === "ファ" ? 0.8 : 1.05)} fontSize={kana === "ファ" ? 2 : 2.9} textAnchor="middle" fill="#16294f" fontWeight={700}>{kana}</text>
            </g>,
          )
        }
      })
    }
    // マーク (橙枠+旗)
    for (const [id] of markSet) {
      const m = /^cell-([GDAE])-(\d{2})$/.exec(id)
      if (!m) continue
      const si = STRINGS.indexOf(m[1] as ViolinString)
      const n = Number(m[2])
      if (si < 0 || n > N_END) continue
      const p = rot(cellPolygon(si, n))
      nodes.push(<polygon key={`mk-${id}`} points={pts(p)} fill="none" stroke="#e07f10" strokeWidth={1.3} pointerEvents="none" />)
      nodes.push(<circle key={`mkf-${id}`} cx={(p[0][0] + p[1][0]) / 2} cy={p[0][1] - 2.4} r={2.2} fill="#e07f10" pointerEvents="none" />)
    }
    const edge = rot([
      [colX(0, 0), 0], [colX(0, 4), 0], [colX(Y_END, 4), Y_END], [colX(Y_END, 0), Y_END],
    ] as const)
    return (
      <svg viewBox="-24 -27 300 58" role="img" aria-label="指板ヒートマップ" style={{ width: "100%", height: "auto", fontFamily: "inherit", display: "block" }}>
        <g>{nodes}</g>
        <polygon points={pts(edge)} fill="none" stroke="#333" strokeWidth={0.8} pointerEvents="none" />
        <line x1={0} y1={-colX(0, 0)} x2={0} y2={-colX(0, 4)} stroke="#111" strokeWidth={1.6} pointerEvents="none" />
        {STRINGS.map((s, si) => (
          <text key={s} x={-H_OPEN - 4} y={-(colX(-H_OPEN, si) + colX(-H_OPEN, si + 1)) / 2 + 2.2} fontSize={6.5} textAnchor="middle" fill="#333">{s}</text>
        ))}
      </svg>
    )
  }, [cells, sel, markSet, guideCellId])

  const selKana = sel ? (selDetail?.kana ?? cellKana(sel)) : null
  const selStrN = sel ? /^cell-([GDAE])-(\d{2})$/.exec(sel) : null

  const renderBody = (inModal: boolean) => (
    <div>
      {markable && (
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          <button type="button" onClick={() => setMarking(false)}
            style={modeBtn(!marking)}>ヒートマップを見る</button>
          <button type="button" onClick={() => setMarking(true)}
            style={modeBtn(marking)}>気をつける音をマークする</button>
        </div>
      )}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap", flexDirection: stack && !inModal ? "column" : undefined }}>
        <div style={{ flex: inModal || stack ? "1 1 100%" : "1.6 1 260px", width: stack && !inModal ? "100%" : undefined, boxSizing: "border-box", minWidth: 0, background: "var(--card-in)", border: "1px solid rgba(150,175,225,.10)", borderRadius: 12, padding: "10px 8px", overflow: "hidden" }}>
          {/* 指板クリック(セル以外の余白も含む)でモーダル拡大。セルタップは stopPropagation 済みではないので
              セル選択と拡大が両立するよう、拡大は専用ボタンではなく図全体のクリックで開く (セルはonClickが先に走る) */}
          <div onClick={inModal ? undefined : () => setZoom(true)} style={{ cursor: inModal ? "default" : "zoom-in" }}>
            {svg}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 9, fontSize: "var(--fs-label)", color: "var(--text-muted)", marginTop: 5 }}>
            <Leg c="#e26a5d" t="高すぎ" /><Leg c="#5e97dd" t="低すぎ" /><Leg c="#b478cf" t="両方にブレる" /><Leg c="#d9efd9" t="安定" />
            {!inModal && <span style={{ marginLeft: "auto", fontWeight: 800, color: "#7aa7ff" }}>タップで大きく表示</span>}
          </div>
          {!hasData && (
            <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", marginTop: 6 }}>
              {emptyText ?? "まだ判定できる音がありません・同じ音を5回以上ひくと色がつきます。"}
            </div>
          )}
        </div>

        {/* 右: 詳細パネル (案4: タップで切替) */}
        <div data-guide="map-detail-panel" style={{ flex: "1 1 220px", minWidth: 200, background: "var(--card-in)", border: "1px solid rgba(150,175,225,.10)", borderRadius: 10, padding: "10px 12px", fontSize: "var(--fs-caption)" }}>
          {!sel ? (
            <div style={{ color: "var(--text-muted)" }}>指板の色がついた音をタップすると、ここに「どこからの移動でずれたか」が出ます。</div>
          ) : marking && markable ? (
            <MarkEditor
              key={sel}
              cellLabel={`${selKana}・${selStrN?.[1]}線`}
              existing={markSet.get(sel) ?? null}
              note={markNote}
              setNote={setMarkNote}
              pending={pending}
              onSave={() => { if (onSaveMark && sel) start(async () => { if (await onSaveMark(sel, markNote.trim())) setMarkNote("") }) }}
              onRemove={() => { if (onRemoveMark && sel) start(async () => { await onRemoveMark(sel) }) }}
            />
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                <b style={{ fontSize: "var(--fs-body)" }}>{selKana}・{selStrN?.[1]}線{selStrN?.[2] === "00" ? "・開放" : ""}</b>
                {selCell && (
                  <span style={{ fontSize: "var(--fs-label)", fontWeight: 900, color: "#fff", background: STATUS_INK[selCell.status], borderRadius: 999, padding: "1px 8px" }}>
                    {STATUS_LABEL[selCell.status]}
                  </span>
                )}
              </div>
              {selDetail ? (
                <>
                  <div style={{ color: "var(--text-sub)", marginTop: 3 }}>
                    {selDetail.high + selDetail.low === 0
                      ? `音が正確(0回/${selDetail.n}回)`
                      : `ずれ(${selDetail.high + selDetail.low}回/${selDetail.n}回)・音が高い${selDetail.high}回・音が低い${selDetail.low}回`}
                  </div>

                  {/* ポジションべつの安定度 (v2) */}
                  {(selDetail.positions?.length ?? 0) > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={secHead}>ポジションべつの安定度</div>
                      {selDetail.positions.map((p, i) => {
                        const pct = Math.round(((p.n - p.miss) / p.n) * 100)
                        return (
                          <div key={i} style={rowStyle(i)}>
                            <span style={posBadge}>{posLabel(p.position)}</span>
                            {p.finger != null && <span style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)" }}>{p.finger === 0 ? "開放" : `${p.finger}の指`}</span>}
                            <span style={barOuter}><span style={barInner(pct)} /></span>
                            <span style={{ fontWeight: 900, flex: "none", color: pctInk(pct), fontVariantNumeric: "tabular-nums" }}>
                              {p.miss > 0 ? DIR_LABEL[p.dir] : "音が正確"}({p.miss}回/{p.n}回)・{pct}%
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* シフト直後 vs 移動なし (v2) */}
                  {selDetail.shiftSplit && (
                    <div style={{ marginTop: 8 }}>
                      <div style={secHead}>ポジション移動のあとかどうか</div>
                      {(() => {
                        const sp = selDetail.shiftSplit!
                        const pctA = Math.round(((sp.after.n - sp.after.miss) / sp.after.n) * 100)
                        const pctN = sp.normal.n > 0 ? Math.round(((sp.normal.n - sp.normal.miss) / sp.normal.n) * 100) : null
                        return (
                          <>
                            <div style={rowStyle(0)}>
                              <span style={shiftBadge}>シフト直後</span>
                              <span style={barOuter}><span style={barInner(pctA)} /></span>
                              <span style={{ fontWeight: 900, flex: "none", color: pctInk(pctA), fontVariantNumeric: "tabular-nums" }}>
                                {sp.after.miss > 0 ? DIR_LABEL[sp.after.dir] : "音が正確"}({sp.after.miss}回/{sp.after.n}回)
                              </span>
                            </div>
                            {pctN != null && (
                              <div style={rowStyle(1)}>
                                <span style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--text-sub)", flex: "none" }}>移動なし</span>
                                <span style={barOuter}><span style={barInner(pctN)} /></span>
                                <span style={{ fontWeight: 900, flex: "none", color: pctInk(pctN), fontVariantNumeric: "tabular-nums" }}>
                                  {sp.normal.miss === 0 ? "音が正確" : "ずれ"}({sp.normal.miss}回/{sp.normal.n}回)
                                </span>
                              </div>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  )}

                  {selDetail.transitions.length > 0 && selStrN && (
                    <div style={{ marginTop: 8 }}>
                      <div style={secHead}>どこからの移動でずれた？</div>
                      {selDetail.transitions.map((t, i) => (
                        <TransRow key={i} t={t} to={{ s: selStrN[1], n: Number(selStrN[2]) }} first={i === 0} />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ color: "var(--text-muted)", marginTop: 3 }}>この音はまだ5回弾いていないので判定していません。</div>
              )}
              {markSet.has(sel) && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(232,178,60,.14)", border: "1px solid rgba(232,178,60,.3)", borderRadius: 8, padding: "6px 9px", marginTop: 8 }}>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#e8b23c", flex: "none" }} />
                  <span style={{ fontSize: "var(--fs-label)", color: "#e8b23c", fontWeight: 700 }}>先生のマーク{markSet.get(sel) ? `：${markSet.get(sel)}` : ""}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )

  // モーダルは document.body へポータル描画する (2026-08-11 バグ修正)。
  // 真因: 演奏履歴カードの行が .pressable を持ち、グローバルCSSの :active { transform: scale(.955) } が
  // 押下中に祖先へかかる → transform を持つ祖先は position:fixed の基準になる (CSS仕様) →
  // 行div内に描いたモーダルが押下のたびに行基準へ転移・縮小し、セルのクリックが成立しなかった。
  // body 直下ならどの画面のどの祖先の transform/overflow の影響も受けない。
  const modal = zoom && typeof document !== "undefined"
    ? createPortal(
      <div
        onClick={() => setZoom(false)}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        style={{ position: "fixed", inset: 0, background: "rgba(4,8,18,.66)", zIndex: 1200, display: "flex", alignItems: modalTopOffset ? "flex-start" : "center", justifyContent: "center", padding: 12, paddingTop: modalTopOffset ?? 12 }}
      >
        <div onClick={(e) => e.stopPropagation()}
          style={{ background: "linear-gradient(180deg,var(--card-a),var(--card-b))", border: "1px solid var(--line)", borderRadius: 16, padding: "13px 16px 16px", width: "min(960px, 96vw)", maxHeight: "92vh", overflowY: "auto", boxSizing: "border-box" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
            <b style={{ fontSize: "var(--fs-body)", color: "var(--text-ink)" }}>音程マップ</b>
            <button type="button" data-guide="map-close" onClick={() => setZoom(false)}
              style={{ marginLeft: "auto", fontSize: "var(--fs-caption)", fontWeight: 900, color: "var(--text-muted)", background: "rgba(150,175,225,.12)", border: "none", borderRadius: 999, padding: "6px 14px", cursor: "pointer" }}>
              とじる ×
            </button>
          </div>
          {renderBody(true)}
        </div>
      </div>,
      document.body,
    )
    : null

  return (
    <>
      {renderBody(false)}
      {modal}
    </>
  )
}

/* v2 詳細パネルの共通スタイル */
const secHead: React.CSSProperties = { fontSize: "var(--fs-label)", fontWeight: 900, color: "var(--text-muted)" }
const posBadge: React.CSSProperties = { fontSize: "var(--fs-label)", fontWeight: 900, color: "#7aa7ff", background: "rgba(43,91,196,.17)", border: "1px solid rgba(122,167,255,.3)", borderRadius: 6, padding: "1px 7px", flex: "none" }
const shiftBadge: React.CSSProperties = { fontSize: "var(--fs-label)", fontWeight: 900, color: "#e8b23c", background: "rgba(232,178,60,.14)", border: "1px solid rgba(232,178,60,.3)", borderRadius: 6, padding: "1px 7px", flex: "none" }
const barOuter: React.CSSProperties = { flex: 1, minWidth: 40, height: 6, borderRadius: 3, background: "rgba(150,175,225,.14)", overflow: "hidden", alignSelf: "center" }
function barInner(pct: number): React.CSSProperties {
  return { display: "block", height: "100%", width: `${Math.max(3, pct)}%`, background: pct >= 85 ? "var(--text-good)" : pct >= 70 ? "#e8b23c" : "var(--text-error)" }
}
function pctInk(pct: number): string {
  return pct >= 85 ? "var(--text-good)" : pct >= 70 ? "#e8b23c" : "var(--text-error)"
}
function rowStyle(i: number): React.CSSProperties {
  return { display: "flex", alignItems: "baseline", gap: 6, padding: "4px 0", borderTop: i > 0 ? "1px dashed #e2e9f2" : "none", flexWrap: "wrap", fontSize: "var(--fs-caption)" }
}

function cellKana(id: string): string {
  const m = /^cell-([GDAE])-(\d{2})$/.exec(id)
  if (!m) return ""
  const open: Record<string, number> = { G: 55, D: 62, A: 69, E: 76 }
  const midi = open[m[1]] + Number(m[2])
  const KANA = ["ド", "ド♯", "レ", "レ♯", "ミ", "ファ", "ファ♯", "ソ", "ソ♯", "ラ", "ラ♯", "シ"]
  return KANA[midi % 12]
}

function modeBtn(on: boolean): React.CSSProperties {
  return {
    fontSize: "var(--fs-label)", fontWeight: 900, borderRadius: 8, padding: "6px 13px", cursor: "pointer",
    border: `1px solid ${on ? "rgba(232,178,60,.34)" : "rgba(150,175,225,.14)"}`,
    color: on ? "var(--gold)" : "var(--text-sub)",
    background: on ? "rgba(232,178,60,.16)" : "transparent",
  }
}

function Leg({ c, t }: { c: string; t: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span style={{ width: 10, height: 10, borderRadius: 3, background: c, display: "inline-block" }} />{t}
    </span>
  )
}

function MarkEditor({ cellLabel, existing, note, setNote, pending, onSave, onRemove }: {
  cellLabel: string; existing: string | null
  note: string; setNote: (v: string) => void
  pending: boolean; onSave: () => void; onRemove: () => void
}) {
  return (
    <div>
      <div style={{ fontWeight: 900 }}>{cellLabel} をマーク</div>
      {existing != null && (
        <div style={{ fontSize: "var(--fs-label)", color: "#e8b23c", background: "rgba(232,178,60,.14)", border: "1px solid rgba(232,178,60,.3)", borderRadius: 8, padding: "5px 8px", marginTop: 5 }}>
          マーク済み{existing ? `：${existing}` : ""}
        </div>
      )}
      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="一言"
        style={{ width: "100%", boxSizing: "border-box", border: "1px solid #dce6f2", borderRadius: 8, padding: "7px 9px", fontSize: "var(--fs-caption)", resize: "vertical", marginTop: 7, background: "#fff" }} />
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        <button type="button" disabled={pending} onClick={onSave}
          style={{ flex: 1, fontSize: "var(--fs-label)", fontWeight: 900, color: "#fff", background: "#e8b23c", border: "none", borderRadius: 8, padding: "7px 0", cursor: "pointer", opacity: pending ? 0.6 : 1 }}>
          {existing != null ? "マークを更新" : "マークする"}
        </button>
        {existing != null && (
          <button type="button" disabled={pending} onClick={onRemove}
            style={{ flex: "none", fontSize: "var(--fs-label)", fontWeight: 800, color: "#8b97a8", background: "#fff", border: "1px solid #dce6f2", borderRadius: 8, padding: "7px 11px", cursor: "pointer" }}>
            はずす
          </button>
        )}
      </div>
    </div>
  )
}

/* ── どこからの移動でずれた？ 案C: 弦の上で見せる (2026-08-22 Tetsuo確定) ──
   来た音(グレー)→この音(ネイビー)を4本弦のミニ図に置き、破線矢印でつなぐ。
   文言: 同じ弦=「音名 から ・ 同じ弦」/ 移弦=「音名 ・ 弦 から ・ 移弦」/
   シフト=「音名 から ・ 1st→3rd シフト」。結果は「n回中m回 ・ 音が低い/高い/正確」 */
const OPEN_MIDI: Record<string, number> = { G: 55, D: 62, A: 69, E: 76 }
function noteKana(s: string, n: number): string {
  const KANA = ["ド", "ド♯", "レ", "レ♯", "ミ", "ファ", "ファ♯", "ソ", "ソ♯", "ラ", "ラ♯", "シ"]
  return KANA[((OPEN_MIDI[s] ?? 76) + n) % 12]
}

function TransRow({ t, to, first }: { t: TransitionRow; to: { s: string; n: number }; first: boolean }) {
  const from = t.from ?? null
  // 文言 (2026-08-22 Tetsuo指示): 「音名から(弦)」。同じ弦=同一弦 ・ 違う弦=その弦名
  const head = !from
    ? "弾き始め ・ 休符のあと"
    : `${noteKana(from.s, from.n)}から(${from.s === to.s ? "同一弦" : `${from.s}線`})${t.badgeKind === "shift" ? ` ・ ${t.badge}シフト` : ""}`
  const resColor = t.miss === 0 ? "var(--text-good)" : t.miss / t.n >= 0.4 ? "var(--text-error)" : "#e8b23c"
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderTop: first ? "none" : "1px dashed rgba(150,175,225,.16)" }}>
      {from && <TransFig from={from} to={to} />}
      <div style={{ minWidth: 0 }}>
        <b style={{ fontSize: "var(--fs-caption)", color: "var(--text-ink)" }}>{head}</b>
        <div style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: resColor, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
          {t.miss > 0 ? DIR_LABEL[t.dir] : "音が正確"}({t.miss}回/{t.n}回)
        </div>
      </div>
    </div>
  )
}

function TransFig({ from, to }: { from: { s: string; n: number }; to: { s: string; n: number } }) {
  const ORDER = ["E", "A", "D", "G"] // 音程マップと同じ E線が上
  const yOfS = (s: string) => 7 + Math.max(0, ORDER.indexOf(s)) * 12
  // 開放弦 (n=0) は弦の起点=ナット上に描く。内側に置くと1フレット目の音
  // (レ開放がミ♭など) に見える (2026-08-29 Tetsuo指摘)
  const xOfN = (n: number) => (n === 0 ? 11.5 : 16 + Math.min(n, 12) * 7)
  const fx = xOfN(from.n), fy = yOfS(from.s), tx = xOfN(to.n), ty = yOfS(to.s)
  const dx = tx - fx, dy = ty - fy
  const len = Math.hypot(dx, dy)
  const sameCell = len < 1
  const ux = sameCell ? 1 : dx / len, uy = sameCell ? 0 : dy / len
  const sx2 = fx + ux * 5.5, sy2 = fy + uy * 5.5
  const tipX = tx - ux * 7, tipY = ty - uy * 7
  const upNote = OPEN_MIDI[to.s] + to.n > OPEN_MIDI[from.s] + from.n
  const sameNote = OPEN_MIDI[to.s] + to.n === OPEN_MIDI[from.s] + from.n
  return (
    <svg width="104" height="50" viewBox="0 0 104 50" style={{ flex: "none" }} aria-hidden>
      {ORDER.map((s2) => (
        <g key={s2}>
          <text x={2} y={yOfS(s2) + 2.6} fontSize={7} fill="var(--text-muted)">{s2}</text>
          <line x1={11} y1={yOfS(s2)} x2={102} y2={yOfS(s2)}
            stroke={s2 === to.s ? "rgba(150,175,225,.4)" : s2 === from.s ? "rgba(150,175,225,.3)" : "rgba(150,175,225,.14)"}
            strokeWidth={s2 === to.s ? 1.4 : 1} />
        </g>
      ))}
      {!sameCell && (
        <>
          <line x1={sx2} y1={sy2} x2={tipX - ux * 4} y2={tipY - uy * 4} stroke="#8fa0c4" strokeWidth={1.4} strokeDasharray="3 3" />
          <polygon points={`${tipX},${tipY} ${tipX - ux * 5 - uy * 3},${tipY - uy * 5 + ux * 3} ${tipX - ux * 5 + uy * 3},${tipY - uy * 5 - ux * 3}`} fill="#8fa0c4" />
          {!sameNote && (
            <text x={(fx + tx) / 2} y={(fy + ty) / 2 - 4.5} fontSize={8} fontWeight={800} fill="#8fa0c4" textAnchor="middle">{upNote ? "↑" : "↓"}</text>
          )}
        </>
      )}
      <circle cx={fx} cy={fy} r={4} fill="rgba(150,175,225,.5)" />
      <circle cx={tx} cy={ty} r={5} fill="#2b5bc4" stroke="rgba(255,255,255,.6)" strokeWidth={1} />
    </svg>
  )
}
