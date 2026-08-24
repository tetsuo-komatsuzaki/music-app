"use client"
// リズム編集の五線譜プレビュー (2026-08-24)。
// 作成前の確認用。符頭・符幹・旗・加線・臨時記号・付点・3連・スラー弧・奏法記号を描く。
// 作成後の実物は、この内容から組み立てた MusicXML をアプリ本体と同じ楽譜エンジン (OSMD)
// で描画するため、ここは「作る前に形を確かめる」ための軽量表示。
const STEP_OF: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 }

export type StaffNote = {
  ql: number          // quarterLength
  name: string        // "A4" / "C#5" などの音名 (解析データの note_name)
  art: string
  slurId: number | null
  dot: boolean
  triplet: boolean
}

function diatonic(name: string): number {
  const m = name.match(/^([A-G])([#b]?)(-?\d)$/)
  if (!m) return 0
  return (Number(m[3]) - 4) * 7 + (STEP_OF[m[1]] ?? 0)
}

export default function StaffPreview({ notes, beats }: { notes: StaffNote[]; beats: number }) {
  const X0 = 74, X1 = 686, TOP = 34, GAP = 9
  const lineY = (i: number) => TOP + i * GAP
  const yOf = (name: string) => lineY(4) - (diatonic(name) - diatonic("E4")) * (GAP / 2)

  const els: React.ReactNode[] = []
  for (let i = 0; i < 5; i++) {
    els.push(<line key={`l${i}`} x1={X0 - 44} y1={lineY(i)} x2={X1} y2={lineY(i)} stroke="#B9A88C" strokeWidth={1} />)
  }
  els.push(<text key="clef" x={X0 - 52} y={lineY(4) + 3} fontSize={46} fill="#16294F" fontFamily="serif">&#119070;</text>)

  const placed: { x: number; y: number; n: StaffNote }[] = []
  let x = X0
  for (const n of notes) {
    const w = (n.ql / Math.max(0.001, beats)) * (X1 - X0 - 24)
    placed.push({ x, y: yOf(n.name), n })
    x += w
  }

  placed.forEach((p, i) => {
    const { x: cx, y, n } = p
    const filled = n.ql < 2
    const up = y > lineY(2)
    const sx = up ? cx + 5.4 : cx - 5.4
    const sy = up ? y - 26 : y + 26
    for (let ly = lineY(0) - GAP; ly > y - 3; ly -= GAP) els.push(<line key={`la${i}${ly}`} x1={cx - 9} y1={ly} x2={cx + 9} y2={ly} stroke="#B9A88C" strokeWidth={1} />)
    for (let ly = lineY(4) + GAP; ly < y + 3; ly += GAP) els.push(<line key={`lb${i}${ly}`} x1={cx - 9} y1={ly} x2={cx + 9} y2={ly} stroke="#B9A88C" strokeWidth={1} />)
    if (/#/.test(n.name)) els.push(<text key={`ac${i}`} x={cx - 17} y={y + 4.5} fontSize={14} fill="#16294F" fontFamily="serif">&#9839;</text>)
    els.push(<ellipse key={`h${i}`} cx={cx} cy={y} rx={5.4} ry={4.1} fill={filled ? "#16294F" : "none"} stroke="#16294F" strokeWidth={1.4} transform={`rotate(-18 ${cx} ${y})`} />)
    if (n.ql < 4) els.push(<line key={`st${i}`} x1={sx} y1={y} x2={sx} y2={sy} stroke="#16294F" strokeWidth={1.5} />)
    const flags = n.ql <= 0.125 ? 3 : n.ql <= 0.25 ? 2 : n.ql <= 0.5 ? 1 : 0
    for (let f = 0; f < flags; f++) {
      const fy = sy + (up ? f * 6 : -f * 6)
      els.push(<path key={`fl${i}_${f}`} d={up ? `M${sx} ${fy} q 9 4 8 13` : `M${sx} ${fy} q 9 -4 8 -13`} stroke="#16294F" strokeWidth={1.5} fill="none" />)
    }
    if (n.dot) els.push(<circle key={`dt${i}`} cx={cx + 11} cy={y} r={1.8} fill="#16294F" />)
    if (n.triplet) els.push(<text key={`tr${i}`} x={cx - 3} y={up ? sy - 4 : sy + 12} fontSize={10} fill="#5B5033" fontFamily="serif">3</text>)
    const ay = up ? y + 13 : y - 13
    const a = n.art
    if (a === "staccato") els.push(<circle key={`a${i}`} cx={cx} cy={ay} r={2} fill="#16294F" />)
    else if (a === "tenuto" || a === "legato") els.push(<line key={`a${i}`} x1={cx - 6} y1={ay} x2={cx + 6} y2={ay} stroke="#16294F" strokeWidth={1.5} />)
    else if (a === "accent") els.push(<path key={`a${i}`} d={`M${cx - 6} ${ay - 4} L${cx + 6} ${ay} L${cx - 6} ${ay + 4}`} stroke="#16294F" strokeWidth={1.4} fill="none" />)
    else if (a === "martele") els.push(<path key={`a${i}`} d={`M${cx - 5} ${ay + 5} L${cx} ${ay - 5} L${cx + 5} ${ay + 5}`} stroke="#16294F" strokeWidth={1.4} fill="none" />)
    else if (a === "spiccato") els.push(
      <g key={`a${i}`}><circle cx={cx - 5} cy={ay} r={1.7} fill="#16294F" /><circle cx={cx} cy={ay - 2} r={1.7} fill="#16294F" /><circle cx={cx + 5} cy={ay} r={1.7} fill="#16294F" /></g>)
    else if (a === "portato") els.push(
      <g key={`a${i}`}><path d={`M${cx - 6} ${ay - 3} Q${cx} ${ay + 3} ${cx + 6} ${ay - 3}`} stroke="#16294F" strokeWidth={1.3} fill="none" /><circle cx={cx} cy={ay + 6} r={1.7} fill="#16294F" /></g>)
    else if (a === "tremolo") els.push(<path key={`a${i}`} d={`M${sx - 5} ${sy + 8} l10 -4 M${sx - 5} ${sy + 13} l10 -4`} stroke="#16294F" strokeWidth={1.6} />)
  })

  // スラー弧 (同じ slurId をまとめて1本)
  const groups = new Map<number, number[]>()
  placed.forEach((p, i) => { if (p.n.slurId) groups.set(p.n.slurId, [...(groups.get(p.n.slurId) ?? []), i]) })
  for (const [sid, idxs] of groups) {
    const s0 = placed[idxs[0]], s1 = placed[idxs[idxs.length - 1]]
    const topY = Math.min(s0.y, s1.y) - 20, midX = (s0.x + s1.x) / 2
    els.push(<path key={`sl${sid}`} d={`M${s0.x} ${s0.y - 12} Q${midX} ${topY} ${s1.x} ${s1.y - 12}`} stroke="#16294F" strokeWidth={1.4} fill="none" />)
  }

  return (
    <div style={{ background: "#FFF9EC", border: "1px solid rgba(217,169,60,.35)", borderRadius: 11, padding: "6px 8px", overflowX: "auto" }}>
      <svg viewBox="0 0 700 120" preserveAspectRatio="xMinYMid meet" style={{ width: "100%", minWidth: 520, height: 120, display: "block" }}>
        {els}
      </svg>
    </div>
  )
}
