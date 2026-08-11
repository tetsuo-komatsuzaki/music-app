/**
 * Arcoda 左手ポジション図解 — 描画コンポーネント
 *
 * 図形データは lefthand-geometry.ts が単一の真実。
 * 描画順序が被覆関係を成立させる。変更禁止:
 *   1 背景・床 → 2 スクロール/ペグ → 3 ネック・胴の一塊 → 4 指板 → 5 弦 → 6 ナット
 *   → 7 指（指塊 → 爪 → 指しわ） → 8 手（掌＋親指＋前腕）
 *   → 9 胴の前面再描画（3rd 以上のみ／手を覆う）
 *
 * ⚠️ animated=true のとき、内側の transform 属性を出さない。
 *    CSS アニメーションが外側の <g> に transform を与えるため、両方に付けると
 *    変換が二重に掛かって絵が壊れる。
 */

import {
  COLORS,
  VIEWBOX,
  HAND_PATH,
  HAND_CREASES,
  HAND_BEHIND_NECK_PATH,
  HAND_BEHIND_NECK_CREASES,
  MISS_HAND_CREASES,
  MISS_SHEAR_MATRIX,
  BODY_OVERLAY_FILL,
  BODY_OVERLAY_STROKE,
  fingerTransform,
  handTransform,
  missHandTransform,
  missHandPathAt,
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
  return <g dangerouslySetInnerHTML={{ __html: INSTRUMENT_SVG }} />;
}

/* ============================================================
   手（掌＋親指＋手首＋前腕）
   ============================================================ */
export function HandShape({
  d,
  behindNeck = false,
  animated = false,
  className,
}: {
  d: number;
  behindNeck?: boolean;
  /** true のとき transform は CSS 側が与える */
  animated?: boolean;
  className?: string;
}) {
  if (behindNeck) {
    // 5th/6th 専用形状: translate では作れないため最終座標で描く（移動しない）
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
  const t = animated ? undefined : handTransform(d);
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
  animated = false,
  className,
  opacity,
}: {
  d: number;
  pattern: FingerPatternId;
  /** ミスパターン用: 指の軸の傾きを反転させる */
  reverseTilt?: boolean;
  /** true のとき transform は CSS 側が与える */
  animated?: boolean;
  className?: string;
  opacity?: number;
}) {
  const p = FINGER_PATTERNS[pattern];
  // ⚠️ 鏡映(scale(-1,1))は禁止。指の並び順まで反転してしまう。
  //    指先ライン(y=305)を固定した剪断を使う。
  const shear = reverseTilt ? MISS_SHEAR_MATRIX : "";
  const t = animated
    ? shear || undefined
    : `${fingerTransform(d)}${shear ? " " + shear : ""}`;
  return (
    <g className={className} opacity={opacity}>
      <path
        transform={t}
        d={p.mass}
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
        opacity=".8"
        fill="none"
      >
        {p.creases.map((c, i) => (
          <path key={i} d={c} />
        ))}
      </g>
      {/* 爪は指しわより手前（元絵の描画順どおり）／stroke-width は 1.4 */}
      <g transform={t} fill={COLORS.nail} stroke={COLORS.skinEdge} strokeWidth="1.4">
        {p.nails.map((n, i) => (
          <rect key={i} {...n} />
        ))}
      </g>
    </g>
  );
}

/* ============================================================
   崩れた手（ミスパターン: 親指が1つ前のポジションに取り残される）

   ⚠️ 正しい手を「1つ前のポジションの transform」で描いてはならない。
      掌まで丸ごと後ろに下がってしまう。ミス手は専用パス（70点）で、
      正しい手（60点）とは**形状補間できない**。
   ============================================================ */
export function MissHandShape({
  target,
  s = 1,
  className,
}: {
  target: PositionId;
  /** 移動進捗 0-1・1 = 到達した崩れた形 */
  s?: number;
  className?: string;
}) {
  return (
    <g className={className} transform={missHandTransform(target, s)}>
      <path
        d={missHandPathAt(target, s)}
        fill={COLORS.skin}
        stroke={COLORS.skinEdge}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <g stroke={COLORS.skinEdge} strokeWidth="2" strokeLinecap="round" opacity=".5" fill="none">
        {MISS_HAND_CREASES.map((c, i) => (
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
      {thumbLagsBehind ? (
        <MissHandShape target={position} />
      ) : (
        <HandShape d={pos.d} behindNeck={pos.thumbBehindNeck} />
      )}
      {pos.bodyOverlay && <BodyOverlay />}
    </svg>
  );
}

/* ============================================================
   注釈ヘルパ（Violin.tsx の FingerBadge / WrongMark と同系）
   ============================================================ */

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

export function WrongMark({ x, y, size = 40 }: { x: number; y: number; size?: number }) {
  const r = size / 2;
  return (
    <g stroke="#D9534F" strokeWidth="5" strokeLinecap="round">
      <line x1={x - r} y1={y - r} x2={x + r} y2={y + r} />
      <line x1={x + r} y1={y - r} x2={x - r} y2={y + r} />
    </g>
  );
}
