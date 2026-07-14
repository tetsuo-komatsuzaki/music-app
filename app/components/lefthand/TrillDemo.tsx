"use client";

/**
 * Arcoda 左手 — トリルのデモ
 *
 * 手は動かない。指パターンを step-end で交替させるだけ。
 *
 * ⚠️ FingersShape に animated を渡さないこと。
 *    トリルでは transform を CSS でアニメーションさせないため、
 *    内側の transform（= fingerTransform(d)）が必要。
 */

import { useId } from "react";
import { VIEWBOX, POSITIONS } from "./lefthand-geometry";
import { getTrill, trillCSS, trillD, type TrillLiftStyle } from "./lefthand-trill-motions";
import { InstrumentShape, FingersShape, HandShape, BodyOverlay } from "./LeftHand";

export interface TrillDemoProps {
  /** "0-1" */
  trill: string;
  /**
   * 指の上げ方。
   * "hover"（既定）= 浮かせ指。規約どおりで物理的に正確だが、動きがほとんど見えない。
   * "raised"       = 立て指。動きは明確だが、本来「使わない指」の表現。
   */
  liftStyle?: TrillLiftStyle;
  playing?: boolean;
  className?: string;
}

export function TrillDemo({
  trill: trillId,
  liftStyle = "hover",
  playing = true,
  className,
}: TrillDemoProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const t = getTrill(trillId);
  if (!t) return null;

  const d = trillD(t);
  const pos = POSITIONS[t.position];

  return (
    <svg
      viewBox={VIEWBOX}
      className={`${className ?? ""} lh-${uid} ${playing ? "" : "is-paused"}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${t.label}：${t.description}`}
    >
      <style>{trillCSS(t, uid)}</style>

      <InstrumentShape />

      {/* 主音（指が弦に触れている） */}
      <FingersShape d={d} pattern={t.lower} className="lh-trill-lower" />
      {/* 補助音（指を上げた） */}
      <FingersShape d={d} pattern={t.upper[liftStyle]} className="lh-trill-upper" opacity={0} />

      <HandShape d={d} behindNeck={pos.thumbBehindNeck} />
      {pos.bodyOverlay && <BodyOverlay />}
    </svg>
  );
}
