/**
 * Arcoda ナチュラル・ハーモニクス図解 — 描画コンポーネント
 *
 * 描画順序は LeftHand.tsx と同一。変更禁止:
 *   楽器 → 指（指塊 → 爪 → 指しわ） → 手 → 胴の前面再描画 → 注釈
 *
 * 指塊は open の 4 サブパスを 1 つの path にまとめて描く（元絵と同一の見え方）。
 * 状態差は「爪の矩形」と「指しわの有無」だけで表現される。
 */

import { COLORS, VIEWBOX, fingerTransform } from "./lefthand-geometry";
import { InstrumentShape, HandShape, BodyOverlay } from "./LeftHand";
import {
  OPEN_FINGER_MASS,
  nailFor,
  creaseFor,
  contactPoint,
  fingerStates,
  nodeD,
  nodeBodyOverlay,
  HARMONIC_NODES,
  HARMONIC_MISTAKES,
  HARMONIC_COLORS,
  type FingerState,
  type HarmonicNodeId,
  type HarmonicMistakeId,
} from "./lefthand-harmonics";

/* ============================================================
   指（状態を 1 本ずつ指定できる版）
   ============================================================ */
export function FingersStateShape({ d, states }: { d: number; states: FingerState[] }) {
  const t = fingerTransform(d);
  const creases = states.map((s, i) => creaseFor(i, s)).filter(Boolean) as string[];
  return (
    <g>
      <path
        transform={t}
        d={OPEN_FINGER_MASS.join(" ")}
        fill={COLORS.skin}
        stroke={COLORS.skinEdge}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <g transform={t} stroke={COLORS.skinEdge} strokeWidth="2" strokeLinecap="round" opacity=".8" fill="none">
        {creases.map((c, i) => (
          <path key={i} d={c} />
        ))}
      </g>
      <g transform={t} fill={COLORS.nail} stroke={COLORS.skinEdge} strokeWidth="1.4">
        {states.map((s, i) => (
          <rect key={i} {...nailFor(i, s)} />
        ))}
      </g>
    </g>
  );
}

/* ============================================================
   注釈
   ============================================================ */
function ContactRing({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r="17" fill="none" stroke="#fff" strokeWidth="7" />
      <circle cx={x} cy={y} r="17" fill="none" stroke={color} strokeWidth="4" />
    </g>
  );
}

function WrongMark({ x, y, size = 44 }: { x: number; y: number; size?: number }) {
  const r = size / 2;
  return (
    <g stroke={HARMONIC_COLORS.bad} strokeWidth="6" strokeLinecap="round">
      <line x1={x - r} y1={y - r} x2={x + r} y2={y + r} />
      <line x1={x + r} y1={y - r} x2={x - r} y2={y + r} />
    </g>
  );
}

/** 押さえすぎ: 下向きの圧力矢印 */
function PressArrow({ x, y }: { x: number; y: number }) {
  return (
    <g stroke={HARMONIC_COLORS.bad} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <line x1={x - 58} y1={y - 96} x2={x - 58} y2={y - 44} />
      <path d={`M ${x - 74},${y - 58} L ${x - 58},${y - 40} L ${x - 42},${y - 58}`} />
    </g>
  );
}

/** 接触が浅い: 弦と指先の隙間 */
function GapMark({ x, y }: { x: number; y: number }) {
  return (
    <g stroke={HARMONIC_COLORS.bad} strokeWidth="5" strokeLinecap="round" fill="none">
      <line x1={x - 62} y1={y - 34} x2={x - 62} y2={y + 2} />
      <path d={`M ${x - 72},${y - 24} L ${x - 62},${y - 36} L ${x - 52},${y - 24}`} />
      <path d={`M ${x - 72},${y - 8} L ${x - 62},${y + 4} L ${x - 52},${y - 8}`} />
      <line x1={x - 92} y1={y + 4} x2={x - 32} y2={y + 7} strokeWidth="3" />
    </g>
  );
}

function Callout({ x, y, text, color }: { x: number; y: number; text: string; color: string }) {
  const top = y - 120;
  const w = Math.max(150, text.length * 30 + 34);
  return (
    <g>
      <line x1={x} y1={y - 24} x2={x} y2={top + 34} stroke={color} strokeWidth="3" />
      <rect x={x - w / 2} y={top - 32} width={w} height="66" rx="18" fill="#fff" stroke={color} strokeWidth="3" />
      <text x={x} y={top + 11} textAnchor="middle" fontSize="30" fontWeight="700" fill={color}>
        {text}
      </text>
    </g>
  );
}

/* ============================================================
   図（正しい接触）
   ============================================================ */
export function HarmonicFigure({ node, className, crop }: { node: HarmonicNodeId; className?: string; crop?: string }) {
  const n = HARMONIC_NODES[node];
  const d = nodeD(n);
  const p = contactPoint(n.finger, d);
  return (
    <svg viewBox={crop ?? VIEWBOX} preserveAspectRatio="xMidYMid meet" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label={`${n.label}：${n.touchAt}に軽く触れる。${n.sounds}が鳴る`}>
      <InstrumentShape />
      <FingersStateShape d={d} states={fingerStates(n.finger, "touch")} />
      <HandShape d={d} />
      {nodeBodyOverlay(n) && <BodyOverlay />}
      <ContactRing x={p.x} y={p.y} color={HARMONIC_COLORS.ring} />
      <Callout x={p.x} y={p.y} text="軽く触れる" color={HARMONIC_COLORS.ring} />
    </svg>
  );
}

/* ============================================================
   図（誤り）— 1/3点（1stポジション・4の指）を題材にする
   ============================================================ */
export function HarmonicMistakeFigure({
  mistake,
  node = "third",
  className,
  crop,
}: {
  mistake: HarmonicMistakeId;
  node?: HarmonicNodeId;
  className?: string;
  crop?: string;
}) {
  const n = HARMONIC_NODES[node];
  const m = HARMONIC_MISTAKES[mistake];
  const d = nodeD(n);
  const p = contactPoint(n.finger, d);
  return (
    <svg viewBox={crop ?? VIEWBOX} preserveAspectRatio="xMidYMid meet" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label={`誤り：${m.label}。${m.result}`}>
      <InstrumentShape />
      <FingersStateShape d={d} states={fingerStates(n.finger, m.state)} />
      <HandShape d={d} />
      {nodeBodyOverlay(n) && <BodyOverlay />}
      <ContactRing x={p.x} y={p.y} color={HARMONIC_COLORS.bad} />
      <WrongMark x={p.x} y={p.y + 78} />
      {mistake === "press" ? <PressArrow x={p.x} y={p.y} /> : <GapMark x={p.x} y={p.y} />}
      <Callout x={p.x} y={p.y} text={mistake === "press" ? "押さえすぎ" : "触れていない"} color={HARMONIC_COLORS.bad} />
    </svg>
  );
}
