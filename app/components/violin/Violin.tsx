import type { ReactNode } from "react";
import {
  COLORS,
  VIOLIN_PATHS,
  VIOLIN_ROTATE,
  VIOLIN_VIEWBOX,
  NUT_Y,
  BRIDGE_Y,
  nutX,
  bridgeX,
  stringX,
  STRING_WIDTHS,
  fingerPoint,
  type StringIndex,
  type PositionNo,
  type FingerNo,
} from "./violin-geometry";

/* ============================================================
   ViolinBody — 素の縦座標系で描画する本体パーツ群
   回転は Violin 側で一度だけ適用する（不変条件 1）
   描画順序（背面→前面）を変えてはならない
   ============================================================ */

function FHole({ mirror = false }: { mirror?: boolean }) {
  const t = mirror ? "translate(82,340) scale(-1,1)" : "translate(158,340)";
  return (
    <g transform={t}>
      <path d={VIOLIN_PATHS.fHole} />
      <circle cx="1" cy="-2" r="1.8" fill={COLORS.dark} />
      <circle cx="6" cy="80" r="2.4" fill={COLORS.dark} />
      <path d={VIOLIN_PATHS.fHoleNotch} strokeWidth="2" />
    </g>
  );
}

function Strings() {
  return (
    <g stroke={COLORS.string} strokeLinecap="round">
      {[0, 1, 2, 3].map((i) => (
        <g key={i} strokeWidth={STRING_WIDTHS[i]}>
          {/* ナット → 駒 */}
          <line x1={nutX(i)} y1={NUT_Y} x2={bridgeX(i)} y2={BRIDGE_Y} />
          {/* 駒 → テールピース */}
          <line
            x1={bridgeX(i)}
            y1={BRIDGE_Y}
            x2={120 + (i - 1.5) * 5}
            y2={418}
          />
        </g>
      ))}
    </g>
  );
}

export function ViolinBody() {
  return (
    <>
      {/* 1. 胴体 */}
      <path
        d={VIOLIN_PATHS.body}
        fill={COLORS.wood}
        stroke={COLORS.outline}
        strokeWidth="2.4"
      />
      {/* 2. パフリング */}
      <path
        d={VIOLIN_PATHS.purfling}
        fill="none"
        stroke={COLORS.woodEdge}
        strokeWidth="1"
        opacity=".75"
      />
      {/* 3-5. ネック下地 / 指板 / ナット */}
      <path d={VIOLIN_PATHS.neck} fill={COLORS.wood2} />
      <path d={VIOLIN_PATHS.fingerboard} fill={COLORS.dark} />
      <rect
        x="106.5"
        y="85"
        width="27"
        height="5"
        rx="1.6"
        fill={COLORS.nut}
        stroke={COLORS.woodEdge}
        strokeWidth=".8"
      />
      {/* 6. ペグボックス */}
      <path
        d={VIOLIN_PATHS.pegboxOuter}
        fill={COLORS.wood2}
        stroke={COLORS.outline}
        strokeWidth="1.6"
      />
      <path d={VIOLIN_PATHS.pegboxInner} fill={COLORS.dark} opacity=".9" />
      {/* 7. ペグ4本 */}
      <g fill={COLORS.dark}>
        <rect x="92" y="33" width="18" height="6" rx="3" />
        <circle cx="92" cy="36" r="5" />
        <rect x="92" y="63" width="18" height="6" rx="3" />
        <circle cx="92" cy="66" r="5" />
        <rect x="130" y="33" width="18" height="6" rx="3" />
        <circle cx="148" cy="36" r="5" />
        <rect x="130" y="63" width="18" height="6" rx="3" />
        <circle cx="148" cy="66" r="5" />
      </g>
      {/* 8. スクロール（先端が y=-5 まで出る） */}
      <path
        d={VIOLIN_PATHS.scroll}
        fill={COLORS.wood2}
        stroke={COLORS.outline}
        strokeWidth="1.6"
      />
      <circle
        cx="120"
        cy="6"
        r="6.5"
        fill="none"
        stroke={COLORS.outline}
        strokeWidth="1.8"
      />
      <circle cx="120" cy="6" r="2.2" fill={COLORS.outline} />
      {/* 9. f字孔 */}
      <g stroke={COLORS.dark} strokeWidth="4" fill="none" strokeLinecap="round">
        <FHole />
        <FHole mirror />
      </g>
      {/* 10. 駒 */}
      <path
        d={VIOLIN_PATHS.bridge}
        fill={COLORS.bridge}
        stroke={COLORS.woodEdge}
        strokeWidth="1.4"
      />
      <path
        d={VIOLIN_PATHS.bridgeFeet}
        stroke={COLORS.woodEdge}
        strokeWidth="1.4"
      />
      {/* 11. テールピース */}
      <path d={VIOLIN_PATHS.tailpiece} fill={COLORS.dark} />
      <path
        d={VIOLIN_PATHS.tailpieceGrooves}
        stroke={COLORS.tailpieceGroove}
        strokeWidth="1.2"
      />
      {/* 12. サドル＋エンドピン */}
      <rect
        x="112"
        y="478"
        width="16"
        height="4"
        rx="1"
        fill={COLORS.nut}
        stroke={COLORS.woodEdge}
        strokeWidth=".8"
      />
      <circle cx="120" cy="489" r="5" fill={COLORS.dark} />
      {/* 13. あご当て */}
      <path d={VIOLIN_PATHS.chinrest} fill={COLORS.dark2} opacity=".95" />
      {/* 14. 弦 */}
      <Strings />
    </>
  );
}

/* ============================================================
   Violin — 横長（スクロール=左・駒=右・弦は上から E,A,D,G）
   ============================================================ */

export function Violin({
  viewBox = VIOLIN_VIEWBOX,
  className,
  children,
  title,
}: {
  viewBox?: string;
  className?: string;
  /** 注釈など。素の縦座標系で渡すこと（回転が適用される） */
  children?: ReactNode;
  title?: string;
}) {
  return (
    <svg
      viewBox={viewBox}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title ?? "バイオリン"}
    >
      <g transform={VIOLIN_ROTATE}>
        <ViolinBody />
        {children}
      </g>
    </svg>
  );
}

/* ============================================================
   注釈ヘルパ（素の縦座標系で使う）
   文字は rotate(90) で正立させる（回転を打ち消す）
   ============================================================ */

export function FingerBadge({
  string: s,
  position,
  finger,
  color = COLORS.purple,
}: {
  string: StringIndex;
  position: PositionNo;
  finger: FingerNo;
  color?: string;
}) {
  const { x, y } = fingerPoint(s, position, finger);
  return (
    <g>
      <circle cx={x} cy={y} r="7.6" fill={color} stroke="#fff" strokeWidth="1.6" />
      <text
        x={x}
        y={y + 3.4}
        textAnchor="middle"
        fontSize="9.5"
        fontWeight="800"
        fill="#fff"
        transform={`rotate(90 ${x} ${y})`}
      >
        {finger}
      </text>
    </g>
  );
}

export function StringBand({
  string: s,
  fromY,
  toY,
  stroke = COLORS.purple,
  fill = COLORS.purpleFill,
}: {
  string: StringIndex;
  fromY: number;
  toY: number;
  stroke?: string;
  fill?: string;
}) {
  const xa = stringX(s, fromY);
  const xb = stringX(s, toY);
  const x = Math.min(xa, xb) - 11;
  const w = 22 + Math.abs(xb - xa);
  return (
    <rect
      x={x}
      y={fromY - 11}
      width={w}
      height={toY - fromY + 22}
      rx="7"
      fill={fill}
      stroke={stroke}
      strokeWidth="1.8"
      strokeDasharray="5 3.5"
    />
  );
}

export function WrongMark({
  string: s,
  position,
  finger,
  color = COLORS.red,
}: {
  string: StringIndex;
  position: PositionNo;
  finger: FingerNo;
  color?: string;
}) {
  const { x, y } = fingerPoint(s, position, finger);
  return (
    <g stroke={color} strokeWidth="3.4" strokeLinecap="round">
      <path
        d={`M ${x - 7},${y - 7} L ${x + 7},${y + 7} M ${x + 7},${y - 7} L ${x - 7},${y + 7}`}
      />
    </g>
  );
}
