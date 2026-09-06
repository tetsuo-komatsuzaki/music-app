"use client"
// 自作スコア登録の五線譜 (2026-09-06)。音を押して選び、上下にドラッグで高さを変える。
// 音符の上に弦 (G D A E ・ ポジション 2 以上は ・数字)、下に指番号。16 音ごとに段を分ける。
import { useRef } from "react"
import { noteName, type AuthorNote } from "@/app/_libs/scoreAuthor"

const STEP_OF: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 }
function diatonic(name: string): number {
  const m = name.match(/^([A-G])([#b]?)(-?\d+)$/)
  if (!m) return 0
  return (Number(m[3]) - 4) * 7 + (STEP_OF[m[1]] ?? 0)
}

const PER = 16, GAP = 9, TOP = 40, X0 = 70, DX = 36, H = 132

export default function AuthorStaff({ notes, beats, flats, selected, onSelect, onDrag }: {
  notes: AuthorNote[]
  beats: number
  flats: boolean
  selected: number
  onSelect: (i: number) => void
  /** 選んだ音を段 steps ぶん動かす (正 = 上)。ドラッグ中に呼ぶ */
  onDrag: (i: number, steps: number) => void
}) {
  const dragged = useRef(false)
  const rows = Math.max(1, Math.ceil(notes.length / PER))
  const lineY = (i: number) => TOP + i * GAP
  const yOf = (name: string) => lineY(4) - (diatonic(name) - diatonic("E4")) * (GAP / 2)

  return (
    <div style={{ background: "#FFF9EC", border: "1px solid rgba(217,169,60,.35)", borderRadius: 11, padding: "6px 8px", overflowX: "auto", userSelect: "none", touchAction: "none" }}>
      {Array.from({ length: rows }, (_, r) => {
        const slice = notes.slice(r * PER, (r + 1) * PER)
        let beatAcc = 0
        return (
          <svg key={r} viewBox={`0 0 700 ${H}`} preserveAspectRatio="xMinYMid meet" style={{ width: "100%", minWidth: 560, height: H, display: "block" }}>
            {[0, 1, 2, 3, 4].map((i) => <line key={i} x1={X0 - 44} y1={lineY(i)} x2={690} y2={lineY(i)} stroke="#B9A88C" strokeWidth={1} />)}
            <text x={X0 - 52} y={lineY(4) + 3} fontSize={46} fill="#16294F" fontFamily="serif">&#119070;</text>
            {slice.map((n, k) => {
              const i = r * PER + k
              const cx = X0 + k * DX
              const name = noteName(n.midi, flats)
              const y = yOf(name)
              const up = y > lineY(2)
              const sx = up ? cx + 5.4 : cx - 5.4
              const sy = up ? y - 26 : y + 26
              const flags = n.ql <= 0.25 ? 2 : n.ql <= 0.5 ? 1 : 0
              const acc = name.includes("#") ? "♯" : name.includes("b") ? "♭" : null
              const ledgerA: number[] = []; for (let ly = lineY(0) - GAP; ly > y - 3; ly -= GAP) ledgerA.push(ly)
              const ledgerB: number[] = []; for (let ly = lineY(4) + GAP; ly < y + 3; ly += GAP) ledgerB.push(ly)
              beatAcc += n.ql
              const bar = Math.abs(beatAcc - beats) < 1e-6
              if (bar) beatAcc = 0
              const ay = up ? y + 13 : y - 13
              return (
                <g key={i}>
                  {i === selected && <rect x={cx - 15} y={8} width={30} height={118} rx={6} fill="#ffe9a8" />}
                  {ledgerA.map((ly) => <line key={`a${ly}`} x1={cx - 9} y1={ly} x2={cx + 9} y2={ly} stroke="#B9A88C" strokeWidth={1} />)}
                  {ledgerB.map((ly) => <line key={`b${ly}`} x1={cx - 9} y1={ly} x2={cx + 9} y2={ly} stroke="#B9A88C" strokeWidth={1} />)}
                  {acc && <text x={cx - 17} y={y + 4.5} fontSize={14} fill="#16294F" fontFamily="serif">{acc}</text>}
                  <ellipse cx={cx} cy={y} rx={5.4} ry={4.1} fill={n.ql < 2 ? "#16294F" : "none"} stroke="#16294F" strokeWidth={1.4} transform={`rotate(-18 ${cx} ${y})`} />
                  {n.ql < 4 && <line x1={sx} y1={y} x2={sx} y2={sy} stroke="#16294F" strokeWidth={1.5} />}
                  {Array.from({ length: flags }, (_, f) => {
                    const fy = sy + (up ? f * 6 : -f * 6)
                    return <path key={f} d={up ? `M${sx} ${fy} q 9 4 8 13` : `M${sx} ${fy} q 9 -4 8 -13`} stroke="#16294F" strokeWidth={1.5} fill="none" />
                  })}
                  {n.art === "staccato" && <circle cx={cx} cy={ay} r={2} fill="#16294F" />}
                  {n.art === "tenuto" && <line x1={cx - 6} y1={ay} x2={cx + 6} y2={ay} stroke="#16294F" strokeWidth={1.5} />}
                  {n.art === "accent" && <path d={`M${cx - 6} ${ay - 4} L${cx + 6} ${ay} L${cx - 6} ${ay + 4}`} stroke="#16294F" strokeWidth={1.4} fill="none" />}
                  <text x={cx} y={18} textAnchor="middle" fontSize={10} fontWeight={900} fill="#b8860b" fontFamily="ui-monospace, monospace">{n.str}{n.pos > 1 ? `·${n.pos}` : ""}</text>
                  <text x={cx} y={118} textAnchor="middle" fontSize={12} fontWeight={900} fill="#2b5bc4" fontFamily="ui-monospace, monospace">{n.fin}</text>
                  {bar && <line x1={cx + DX / 2} y1={lineY(0)} x2={cx + DX / 2} y2={lineY(4)} stroke="#16294F" strokeWidth={1} />}
                  <rect x={cx - 15} y={8} width={30} height={118} fill="transparent" style={{ cursor: "pointer" }}
                    onClick={() => { if (!dragged.current) onSelect(i); dragged.current = false }}
                    onPointerDown={(e) => {
                      onSelect(i)
                      const svg = (e.currentTarget as SVGRectElement).ownerSVGElement
                      const unit = ((svg?.getBoundingClientRect().height ?? H) / H) * (GAP / 2)
                      const y0 = e.clientY
                      let last = 0
                      const move = (ev: PointerEvent) => {
                        const st = Math.round((y0 - ev.clientY) / unit)
                        if (st !== last) { onDrag(i, st - last); last = st; dragged.current = true }
                      }
                      const upH = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", upH) }
                      window.addEventListener("pointermove", move)
                      window.addEventListener("pointerup", upH)
                    }} />
                </g>
              )
            })}
          </svg>
        )
      })}
    </div>
  )
}
