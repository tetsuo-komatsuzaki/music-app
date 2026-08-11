"use client";

/**
 * Arcoda 左手 — ビブラートのデモ（正解 / ミス）
 *
 * 【⚠️ 親指は支点。動いてはならない】
 * 手の群 transform は **基準音の位置に固定**する。動かすのは **パスの節点だけ**。
 * `handPathPivotThumb(delta)` が、親指の先端を追従率 0 で固定したまま掌をずらす。
 *
 * 【なぜ SMIL か】
 * 掌の動きが path の `d` の変化として現れるため。CSS の `d: path()` は対応環境が限られる。
 * 指の transform も同じ SMIL タイムラインに乗せて、指と掌がずれないようにしている。
 *
 * ⚠️ 手に `transform` のアニメーションを与えてはならない。親指まで動いてしまう。
 * ⚠️ 手を回転させてはならない（掌がネック下縁から浮き、指と掌が分断される）。
 */

import { useId } from "react";
import {
  COLORS,
  VIEWBOX,
  POSITIONS,
  HAND_CREASES,
  handTransform,
  handPathPivotThumb,
  handCreasesPivotThumb,
  type FingerPatternId,
} from "./lefthand-geometry";
import { FINGER_PATTERNS } from "./lefthand-fingers";
import { InstrumentShape, BodyOverlay } from "./LeftHand";
import {
  getVibrato,
  smilTiming,
  fingerValues,
  handPathValues,
  handCreaseValues,
  vibratoNoteD,
} from "./lefthand-vibrato-motions";

export interface VibratoDemoProps {
  /** "3rd-ok" | "3rd-stiff-hand" */
  vibrato: string;
  /** 揺らす指・既定: 1の指 */
  pattern?: FingerPatternId;
  playing?: boolean;
  className?: string;
}

export function VibratoDemo({
  vibrato: vibratoId,
  pattern = "f1",
  playing = true,
  className,
}: VibratoDemoProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const v = getVibrato(vibratoId);
  if (!v) return null;

  const pos = POSITIONS[v.position];
  const noteD = vibratoNoteD(v);
  const fp = FINGER_PATTERNS[pattern];
  const t = smilTiming(v);
  const tp = {
    calcMode: "spline" as const,
    keyTimes: t.keyTimes,
    keySplines: t.keySplines,
    dur: t.dur,
    repeatCount: "indefinite" as const,
    ...(playing ? {} : { begin: "indefinite" as const }),
  };
  // handRatio = 0（ミス）では掌も動かない → アニメーションを出力しない
  const palmMoves = v.handRatio > 0;

  return (
    <svg
      viewBox={VIEWBOX}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${v.label}：${v.description}`}
    >
      <InstrumentShape />

      {/* 指 */}
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          {...tp}
          values={fingerValues(v)}
        />
        <path
          d={fp.mass}
          fill={COLORS.skin}
          stroke={COLORS.skinEdge}
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <g stroke={COLORS.skinEdge} strokeWidth="2" strokeLinecap="round" opacity=".8" fill="none">
          {fp.creases.map((c, i) => (
            <path key={i} d={c} />
          ))}
        </g>
        <g fill={COLORS.nail} stroke={COLORS.skinEdge} strokeWidth="1.4">
          {fp.nails.map((n, i) => (
            <rect key={i} {...n} />
          ))}
        </g>
      </g>

      {/* 手: 群 transform は基準音の位置で固定。掌だけを d で動かす（親指は支点＝不動） */}
      <g transform={handTransform(noteD)}>
        <path
          d={handPathPivotThumb(0)}
          fill={COLORS.skin}
          stroke={COLORS.skinEdge}
          strokeWidth="2.4"
          strokeLinejoin="round"
        >
          {palmMoves && <animate attributeName="d" {...tp} values={handPathValues(v)} />}
        </path>
        <g stroke={COLORS.skinEdge} strokeWidth="2" strokeLinecap="round" opacity=".5" fill="none">
          {HAND_CREASES.map((_, i) => (
            <path key={i} d={handCreasesPivotThumb(0)[i]}>
              {palmMoves && <animate attributeName="d" {...tp} values={handCreaseValues(v, i)} />}
            </path>
          ))}
        </g>
      </g>

      {pos.bodyOverlay && <BodyOverlay />}
    </svg>
  );
}
