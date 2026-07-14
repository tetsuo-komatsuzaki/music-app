"use client";

/**
 * Arcoda 左手 — 装飾音のデモ（プラルトリラー / モルデント・正解 / ミス）
 *
 * 手はまったく動かない。主音レイヤと装飾レイヤの opacity を step-end で切り替えるだけ。
 *
 * ⚠️ FingersShape に `animated` を渡さないこと。
 *    ここでは transform を CSS でアニメーションさせないため、
 *    内側の transform（= fingerTransform(d)）が必要。
 */

import { useId } from "react";
import { VIEWBOX, POSITIONS } from "./lefthand-geometry";
import { getOrnament, ornamentCSS, ornamentD } from "./lefthand-ornament-motions";
import { InstrumentShape, FingersShape, HandShape, BodyOverlay } from "./LeftHand";

export interface OrnamentDemoProps {
  /** "pralltriller-ok" | "pralltriller-slow" | "mordent-ok" | "mordent-slow" */
  ornament: string;
  playing?: boolean;
  className?: string;
}

export function OrnamentDemo({
  ornament: ornamentId,
  playing = true,
  className,
}: OrnamentDemoProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const o = getOrnament(ornamentId);
  if (!o) return null;

  const d = ornamentD(o);
  const pos = POSITIONS[o.position];

  return (
    <svg
      viewBox={VIEWBOX}
      className={`${className ?? ""} lh-${uid} ${playing ? "" : "is-paused"}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${o.label}：${o.description}`}
    >
      <style>{ornamentCSS(o, uid)}</style>

      <InstrumentShape />

      {/* 主音（ド） */}
      <FingersShape d={d} pattern={o.main} className="lh-orn-main" />
      {/* 装飾音（プラル = レ／モルデント = シ） */}
      <FingersShape d={d} pattern={o.ornament} className="lh-orn-aux" opacity={0} />

      <HandShape d={d} behindNeck={pos.thumbBehindNeck} />
      {pos.bodyOverlay && <BodyOverlay />}
    </svg>
  );
}
