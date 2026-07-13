/**
 * Arcoda 左手ポジション図解 — 描画コンポーネント
 *
 * 図形データは lefthand-geometry.ts が単一の真実。
 * 描画順序が被覆関係を成立させる。変更禁止:
 *   1 背景・床 → 2 スクロール/ペグ → 3 ネック・胴の一塊 → 4 指板 → 5 弦 → 6 ナット
 *   → 7 指（指塊 → 爪 → 指しわ） → 8 手（掌＋親指＋前腕）
 *   → 9 胴の前面再描画（3rd 以上のみ／手を覆う）
 */

import {
  COLORS,
  VIEWBOX,
  HAND_PATH,
  HAND_CREASES,
  HAND_BEHIND_NECK_PATH,
  HAND_BEHIND_NECK_CREASES,
  BODY_OVERLAY_FILL,
  BODY_OVERLAY_STROKE,
  fingerTransform,
  handTransform,
  POSITIONS,
  type PositionId,
  type FingerPatternId,
} from "./lefthand-geometry";
import { FINGER_PATTERNS } from "./lefthand-fingers";
import { INSTRUMENT_SVG } from "./lefthand-instrument";

/* ============================================================
   楽器（不動部分）
   ============================================================ */
export function InstrumentShape() {
  // 背景・床・スクロール・ペグ・ネック・胴の一塊・指板・弦・ナット
  return <g dangerouslySetInnerHTML={{ __html: INSTRUMENT_SVG }} />;
}

/* ============================================================
   手（掌＋親指＋手首＋前腕）
   ============================================================ */
export function HandShape({
  d,
  behindNeck = false,
  className,
}: {
  d: number;
  behindNeck?: boolean;
  className?: string;
}) {
  if (behindNeck) {
    // 5th/6th 専用形状: translate では作れないため最終座標で描く
    return (
      <g className={className}>
        <path
          d={HAND_BEHIND_NECK_PATH}
          fill={COLORS.skin}
          stroke={COLORS.skinEdge}
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <g stroke={COLORS.skinEdge} strokeWidth="2" strokeLinecap="round" opacity=".5" fill="none">
          {HAND_BEHIND_NECK_CREASES.map((c, i) => (
            <path key={i} d={c} />
          ))}
        </g>
      </g>
    );
  }
  const t = handTransform(d);
  return (
    <g className={className}>
      <path
        transform={t}
        d={HAND_PATH}
        fill={COLORS.skin}
        stroke={COLORS.skinEdge}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <g
        transform={t}
        stroke={COLORS.skinEdge}
        strokeWidth="2"
        strokeLinecap="round"
        opacity=".5"
        fill="none"
      >
        {HAND_CREASES.map((c, i) => (
          <path key={i} d={c} />
        ))}
      </g>
    </g>
  );
}

/* ============================================================
   指（指塊 → 爪 → 指しわ）
   ============================================================ */
export function FingersShape({
  d,
  pattern,
  reverseTilt = false,
  className,
}: {
  d: number;
  pattern: FingerPatternId;
  /** ミスパターン用: 指の軸の傾きを反転させる */
  reverseTilt?: boolean;
  className?: string;
}) {
  const p = FINGER_PATTERNS[pattern];
  // ⚠️ 鏡映(scale(-1,1))は禁止。指の並び順まで反転してしまう。
  //    指先ライン(y=305)を固定した剪断を使う。
  const shear = reverseTilt ? " matrix(1,0,-0.42,1,128.1,0)" : "";
  const t = fingerTransform(d) + shear;
  return (
    <g className={className}>
      <path transform={t} d={p.mass} fill={COLORS.skin} stroke={COLORS.skinEdge} strokeWidth="2.4" strokeLinejoin="round" />
      <g transform={t} fill={COLORS.nail} stroke={COLORS.skinEdge} strokeWidth="1.8">
        {p.nails.map((n, i) => (
          <rect key={i} {...n} />
        ))}
      </g>
      <g transform={t} stroke={COLORS.skinEdge} strokeWidth="2" strokeLinecap="round" opacity=".8" fill="none">
        {p.creases.map((c, i) => (
          <path key={i} d={c} />
        ))}
      </g>
    </g>
  );
}

/* ============================================================
   胴の前面再描画（3rd 以上・手を覆う）
   ============================================================ */
export function BodyOverlay({ className }: { className?: string }) {
  return (
    <g className={className}>
      <path d={BODY_OVERLAY_FILL} fill={COLORS.wood} />
      <path
        d={BODY_OVERLAY_STROKE}
        fill="none"
        stroke={COLORS.woodEdge}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </g>
  );
}

/* ============================================================
   静止イラスト
   ============================================================ */
export interface LeftHandProps {
  position: PositionId;
  pattern?: FingerPatternId;
  /** ミスパターン: 親指が 1 つ前のポジションに取り残される */
  thumbLagsBehind?: boolean;
  /** ミスパターン: 指の軸が逆に傾く */
  reverseTilt?: boolean;
  className?: string;
  title?: string;
}

export function LeftHand({
  position,
  pattern = "f1",
  thumbLagsBehind = false,
  reverseTilt = false,
  className,
  title,
}: LeftHandProps) {
  const pos = POSITIONS[position];
  const label = title ?? `${pos.label}・${pattern}`;

  return (
    <svg
      viewBox={VIEWBOX}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={label}
    >
      <InstrumentShape />
      <FingersShape d={pos.d} pattern={pattern} reverseTilt={reverseTilt} />
      <HandShape d={pos.d} behindNeck={pos.thumbBehindNeck} />
      {pos.bodyOverlay && <BodyOverlay />}
    </svg>
  );
}

/* ============================================================
   注釈ヘルパ（Violin.tsx の FingerBadge / WrongMark と同系）
   ============================================================ */

/** ポジション名のバッジ */
export function PositionBadge({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g>
      <rect x={x - 34} y={y - 16} width="68" height="32" rx="16" fill="#fff" stroke={COLORS.woodEdge} strokeWidth="2" />
      <text x={x} y={y + 6} textAnchor="middle" fontSize="18" fill={COLORS.woodEdge} fontWeight="600">
        {label}
      </text>
    </g>
  );
}

/** ミスを示す × マーク */
export function WrongMark({ x, y, size = 40 }: { x: number; y: number; size?: number }) {
  const r = size / 2;
  return (
    <g stroke="#D9534F" strokeWidth="5" strokeLinecap="round">
      <line x1={x - r} y1={y - r} x2={x + r} y2={y + r} />
      <line x1={x + r} y1={y - r} x2={x - r} y2={y + r} />
    </g>
  );
}
