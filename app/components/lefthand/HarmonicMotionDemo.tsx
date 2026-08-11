"use client";

/**
 * Arcoda ナチュラル・ハーモニクス — モーション再生コンポーネント
 *
 * 運弓の BowingDemo.tsx に相当する再生コンポーネント。
 * harmonic-motions.ts の harmonicCSS() が吐く CSS を <style> に流し込み、
 * その CSS が期待するクラス構造（.hm-fingers / .hm-f-base / .hm-f-on /
 * .hm-hand / .hm-overlay / .hm-mark / .hm-ripple）を組み立てる。
 *
 * ⚠️ アニメーションされる層（.hm-fingers / .hm-hand）の内側に transform を
 *    書いてはならない。transform は CSS 側が与えるため、二重変換で絵が壊れる。
 *    （HandShape は animated=true で内側 transform を出さない。指層はここで
 *      transform 無しに組み立てる。）
 */

import { useId } from "react";
import { COLORS, VIEWBOX } from "./lefthand-geometry";
import { InstrumentShape, HandShape, BodyOverlay } from "./LeftHand";
import {
  OPEN_FINGER_MASS,
  nailFor,
  creaseFor,
  fingerStates,
  HARMONIC_NODES,
  type FingerState,
} from "./lefthand-harmonics";
import {
  HARMONIC_MOTIONS,
  harmonicCSS,
  HALF_CONTACT,
  HALF_D,
  RING_COLOR,
  BAD_COLOR,
} from "./harmonic-motions";

/* ============================================================
   指層（transform 無し・親 .hm-fingers が変換を与える）
   ============================================================ */
function FingerLayer({
  states,
  className,
}: {
  states: FingerState[];
  className: string;
}) {
  const creases = states.map((s, i) => creaseFor(i, s)).filter(Boolean) as string[];
  return (
    <g className={className}>
      <path
        d={OPEN_FINGER_MASS.join(" ")}
        fill={COLORS.skin}
        stroke={COLORS.skinEdge}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <g stroke={COLORS.skinEdge} strokeWidth="2" strokeLinecap="round" opacity=".8" fill="none">
        {creases.map((c, i) => (
          <path key={i} d={c} />
        ))}
      </g>
      <g fill={COLORS.nail} stroke={COLORS.skinEdge} strokeWidth="1.4">
        {states.map((s, i) => (
          <rect key={i} {...nailFor(i, s)} />
        ))}
      </g>
    </g>
  );
}

/* ============================================================
   注釈（接触点まわり）
   ============================================================ */
function Ring({ color }: { color: string }) {
  const p = HALF_CONTACT;
  return (
    <>
      <circle cx={p.x} cy={p.y} r="17" fill="none" stroke="#fff" strokeWidth="7" />
      <circle cx={p.x} cy={p.y} r="17" fill="none" stroke={color} strokeWidth="4" />
    </>
  );
}

function Ripple() {
  const p = HALF_CONTACT;
  return (
    <g className="hm-ripple" fill="none" stroke={RING_COLOR} strokeWidth="3">
      <circle cx={p.x} cy={p.y} r="17" />
    </g>
  );
}

function WrongMark({ size = 44 }: { size?: number }) {
  const p = HALF_CONTACT;
  const r = size / 2;
  const y = p.y + 78;
  return (
    <g stroke={BAD_COLOR} strokeWidth="6" strokeLinecap="round">
      <line x1={p.x - r} y1={y - r} x2={p.x + r} y2={y + r} />
      <line x1={p.x + r} y1={y - r} x2={p.x - r} y2={y + r} />
    </g>
  );
}

function PressArrow() {
  const p = HALF_CONTACT;
  return (
    <g stroke={BAD_COLOR} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <line x1={p.x - 58} y1={p.y - 96} x2={p.x - 58} y2={p.y - 44} />
      <path d={`M ${p.x - 74},${p.y - 58} L ${p.x - 58},${p.y - 40} L ${p.x - 42},${p.y - 58}`} />
    </g>
  );
}

function Callout({ text, color }: { text: string; color: string }) {
  const p = HALF_CONTACT;
  const top = p.y - 120;
  const w = Math.max(150, text.length * 30 + 34);
  return (
    <>
      <line x1={p.x} y1={p.y - 24} x2={p.x} y2={top + 34} stroke={color} strokeWidth="3" />
      <rect x={p.x - w / 2} y={top - 32} width={w} height="66" rx="18" fill="#fff" stroke={color} strokeWidth="3" />
      <text x={p.x} y={top + 11} textAnchor="middle" fontSize="30" fontWeight="700" fill={color}>
        {text}
      </text>
    </>
  );
}

/* ============================================================
   HarmonicMotionDemo
   ============================================================ */
export interface HarmonicMotionDemoProps {
  /** "half-ok" | "half-press" */
  motion?: "half-ok" | "half-press";
  /** 再生中か */
  playing?: boolean;
  className?: string;
  /** レッスンカード用のクロップ viewBox */
  crop?: string;
}

const HALF_NODE = HARMONIC_NODES.half;

export function HarmonicMotionDemo({
  motion = "half-ok",
  playing = true,
  className,
  crop,
}: HarmonicMotionDemoProps) {
  const m = HARMONIC_MOTIONS[motion] ?? HARMONIC_MOTIONS["half-ok"];
  // useId は ":r0:" 等を返すため CSS 識別子用にサニタイズ
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const ok = m.state === "touch";

  const baseStates = fingerStates(HALF_NODE.finger, "hover");
  const onStates = fingerStates(HALF_NODE.finger, m.state);

  return (
    <svg
      viewBox={crop ?? VIEWBOX}
      preserveAspectRatio="xMidYMid meet"
      className={[`hm-${uid}`, playing ? "" : "is-paused", className].filter(Boolean).join(" ")}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={ok ? "1/2点ハーモニクス：4の指を軽く乗せる" : "誤り：押さえすぎ"}
    >
      <style>{harmonicCSS(m, uid)}</style>

      <InstrumentShape />

      {/* 指（親が transform をアニメ／子は base↔on の不透明度クロスフェード） */}
      <g className="hm-fingers">
        <FingerLayer states={baseStates} className="hm-f-base" />
        <FingerLayer states={onStates} className="hm-f-on" />
      </g>

      {/* 手（animated=true で内側 transform を出さない） */}
      <HandShape d={HALF_D} animated className="hm-hand" />

      {/* 胴の前面再描画（4th 以上・手を覆う。opacity をアニメ） */}
      <BodyOverlay className="hm-overlay" />

      {/* 注釈（指を置いた時にフェードイン） */}
      <g className="hm-mark">
        {ok && <Ripple />}
        <Ring color={ok ? RING_COLOR : BAD_COLOR} />
        {!ok && <PressArrow />}
        {!ok && <WrongMark />}
        <Callout text={ok ? "軽く触れる" : "押さえすぎ"} color={ok ? RING_COLOR : BAD_COLOR} />
      </g>
    </svg>
  );
}
