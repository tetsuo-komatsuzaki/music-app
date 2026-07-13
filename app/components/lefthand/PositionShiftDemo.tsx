"use client";

/**
 * Arcoda 左手ポジション移動デモ
 *
 * BowingDemo.tsx と同じ設計:
 *   - キーフレームはデータ（lefthand-motions.ts）
 *   - CSS は useId() で一意化して衝突を避ける
 *   - prefers-reduced-motion に対応
 *   - playing=false で停止（1st の静止画として正しく表示される）
 */

import { useId } from "react";
import {
  VIEWBOX,
  POSITIONS,
  type FingerPatternId,
} from "./lefthand-geometry";
import { getShift, shiftCSS } from "./lefthand-motions";
import {
  InstrumentShape,
  FingersShape,
  HandShape,
  BodyOverlay,
} from "./LeftHand";

export interface PositionShiftDemoProps {
  /** "1st-2nd" | "1st-3rd" | "1st-4th" | "1st-5th" | "1st-6th" */
  shift: string;
  pattern?: FingerPatternId;
  playing?: boolean;
  className?: string;
}

export function PositionShiftDemo({
  shift: shiftId,
  pattern = "f1",
  playing = true,
  className,
}: PositionShiftDemoProps) {
  const rawId = useId();
  // useId() は ":r0:" のような CSS で使えない文字を含むためサニタイズする
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, "");

  const shift = getShift(shiftId);
  if (!shift) return null;

  const target = POSITIONS[shift.target];
  const css = shiftCSS(shift, uid);

  return (
    <svg
      viewBox={VIEWBOX}
      className={`${className ?? ""} lh-${uid} ${playing ? "" : "is-paused"}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${shift.label}：${shift.description}`}
    >
      <style>{css}</style>

      <InstrumentShape />

      {/* 指: d の時系列に沿って移動 */}
      <FingersShape d={0} pattern={pattern} className="lh-fingers" />

      {/* 手（通常形状）: 移動する。持ち替えを伴う場合は到達時にフェードアウト */}
      <HandShape
        d={0}
        className={shift.hasThumbSwitch ? "lh-hand-front" : "lh-hand"}
      />

      {/* 手（ネック裏形状）: 持ち替えを伴う場合のみ。到達時にフェードイン */}
      {shift.hasThumbSwitch && (
        <g className="lh-hand-behind" opacity="0">
          <HandShape d={target.d} behindNeck />
        </g>
      )}

      {/* 胴オーバーレイ: 手が胴に達してから現れる（常時表示すると 1st の前腕を覆う） */}
      {target.bodyOverlay && <BodyOverlay className="lh-overlay" />}
    </svg>
  );
}
