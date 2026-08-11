"use client";

/**
 * Arcoda 左手 — グリッサンドのデモ
 *
 * 構造:
 *   <g.lh-gl-fingers>       ← CSS が transform（d）を与える。**内側に transform を付けない**
 *     <g.lh-gl-press>       ← 押弦（滑走中はこちら）
 *     <g.lh-gl-open>        ← 浮かせ（復帰中はこちら）
 *   <g.lh-gl-hand-front>    ← ナット側の手（移動する／深いところでフェードアウト）
 *   <g.lh-gl-hand-behind>   ← ネック裏の手（静止／深いところでフェードイン）
 *   <g.lh-gl-overlay>       ← 胴の前面再描画
 *
 * ⚠️ 手形の持ち替えと胴オーバーレイは d から導出している（時間で直書きしていない）。
 *    速度プロファイルを変えてもタイミングが自動で追従する。
 */

import { useId } from "react";
import {
  VIEWBOX,
  POSITIONS,
  HAND_SWITCH_D_HI,
  type FingerPatternId,
} from "./lefthand-geometry";
import {
  getGlissando,
  glissandoCSS,
  glissKeyframes,
} from "./lefthand-glissando-motions";
import { InstrumentShape, FingersShape, HandShape, BodyOverlay } from "./LeftHand";

export interface GlissandoDemoProps {
  /** "6th-1st-even" | "6th-1st-fast" | "6th-1st-uneven" */
  glissando: string;
  /** 滑走に使う指のパターン・既定: 1の指 */
  pattern?: FingerPatternId;
  playing?: boolean;
  className?: string;
}

export function GlissandoDemo({
  glissando: glissId,
  pattern = "f1",
  playing = true,
  className,
}: GlissandoDemoProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const g = getGlissando(glissId);
  if (!g) return null;

  const kf = glissKeyframes(g);
  const dMax = Math.max(...kf.map((f) => f.d));
  const dMin = Math.min(...kf.map((f) => f.d));

  // ネック裏の手形は静止形。到達しうる最大の d で描く
  const needsBehind = dMax >= HAND_SWITCH_D_HI;
  // 胴オーバーレイは、区間のどこかで必要になるなら置く
  const needsOverlay =
    POSITIONS[g.from].bodyOverlay || POSITIONS[g.to].bodyOverlay || dMax > dMin;

  return (
    <svg
      viewBox={VIEWBOX}
      className={`${className ?? ""} lh-${uid} ${playing ? "" : "is-paused"}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${g.label}：${g.description}`}
    >
      <style>{glissandoCSS(g, uid)}</style>

      <InstrumentShape />

      {/* 指: 外側の <g> が d に沿って動く。内側は animated で transform を出さない */}
      <g className="lh-gl-fingers">
        <FingersShape d={0} pattern={pattern} animated className="lh-gl-press" />
        <FingersShape d={0} pattern="open" animated className="lh-gl-open" opacity={0} />
      </g>

      <HandShape d={0} animated className="lh-gl-hand-front" />

      {needsBehind && (
        <g className="lh-gl-hand-behind" opacity={0}>
          <HandShape d={dMax} behindNeck />
        </g>
      )}

      {needsOverlay && <BodyOverlay className="lh-gl-overlay" />}
    </svg>
  );
}
