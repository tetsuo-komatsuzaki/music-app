"use client";

/**
 * Arcoda 左手ポジション移動デモ
 *
 * BowingDemo.tsx と同じ設計:
 *   - キーフレームはデータ（lefthand-motions.ts）
 *   - CSS は useId() で一意化して衝突を避ける
 *   - prefers-reduced-motion に対応
 *   - playing=false で停止（1st・開放弦の静止画として正しく表示される）
 *
 * 構造:
 *   <g.lh-fingers>            ← CSS が transform（d）を与える。**内側に transform を付けない**
 *     <g.lh-fingers-open>     ← 開放弦（全指浮き）  opacity 1→0
 *     <g.lh-fingers-press>    ← 押弦パターン        opacity 0→1
 *   <g.lh-hand-front>         ← ナット側の手（移動する／持ち替え時にフェードアウト）
 *   <g.lh-hand-behind>        ← ネック裏の手（静止／持ち替え時にフェードイン）
 *   <g.lh-overlay>            ← 胴の前面再描画
 */

import { useId } from "react";
import { VIEWBOX, POSITIONS, type FingerPatternId } from "./lefthand-geometry";
import { getShift, shiftCSS } from "./lefthand-motions";
import { InstrumentShape, FingersShape, HandShape, BodyOverlay } from "./LeftHand";

export interface PositionShiftDemoProps {
  /** "1st-2nd" | "1st-3rd" | "1st-4th" | "1st-5th" | "1st-5th-6th" */
  shift: string;
  /** 移動後に押さえる指のパターン（既定: 1の指のみ） */
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
  // useId() は ":r0:" のような CSS で使えない文字を含むためサニタイズする
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");

  const shift = getShift(shiftId);
  if (!shift) return null;

  const css = shiftCSS(shift, uid);
  const needsOverlay = POSITIONS[shift.target].bodyOverlay;

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

      {/* 指: 外側の <g> が d に沿って動く。内側は animated で transform を出さない */}
      <g className="lh-fingers">
        <FingersShape d={0} pattern="open" animated className="lh-fingers-open" />
        <FingersShape d={0} pattern={pattern} animated className="lh-fingers-press" opacity={0} />
      </g>

      {/* 手（ナット側形状）: 移動する。持ち替えを伴う場合は終盤にフェードアウト */}
      <HandShape
        d={0}
        animated
        className={shift.hasThumbSwitch ? "lh-hand-front" : "lh-hand"}
      />

      {/* 手（ネック裏形状）: 持ち替えを伴う場合のみ。静止しており、指だけが先へ伸びる */}
      {shift.hasThumbSwitch && (
        <g className="lh-hand-behind" opacity={0}>
          <HandShape d={shift.behindHandD} behindNeck />
        </g>
      )}

      {/* 胴オーバーレイ: 手が胴に達する前に不透明化しきる（掌の透け防止）。
          常時表示すると 1st の前腕を覆ってしまうため、アニメーションさせる。 */}
      {needsOverlay && <BodyOverlay className="lh-overlay" />}
    </svg>
  );
}
