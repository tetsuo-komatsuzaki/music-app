import { COLORS, BOW_PATHS, BOW_PARTS, BOW_VIEWBOX } from "./violin-geometry";

/* ============================================================
   BowShape — 局所座標系（先=左 x≈12 / フロッグ=右 x=374）
   描画順序が被覆関係を成立させる。変更禁止。
     1 毛 → 2 竿＋ヘッド(毛の左端を覆う) → 3 象牙プレート
     → 4 巻線 → 5 グリップ → 6 フェルール
     → 7 フロッグ(毛の右端を覆う) → 8 真珠アイ → 9 ボタン
   ============================================================ */

export function BowShape() {
  const h = BOW_PATHS.hair;
  const p = BOW_PARTS;
  return (
    <>
      {/* 1. 毛（両端はヘッド／フロッグ内部まで伸ばす） */}
      <line
        x1={h.x1}
        y1={h.y1}
        x2={h.x2}
        y2={h.y2}
        stroke={COLORS.bowHair}
        strokeWidth={h.width}
      />
      {/* 2. 竿＋ヘッド（単一パス・継ぎ目なし） */}
      <path d={BOW_PATHS.stickAndHead} fill={COLORS.bowStick} />
      {/* 3. 象牙プレート（先端の下面） */}
      <path
        d={BOW_PATHS.tipPlate}
        fill={COLORS.bowHair}
        stroke={COLORS.bowHairEdge}
        strokeWidth=".5"
      />
      {/* 4. 巻線 */}
      <rect
        {...p.winding}
        fill={COLORS.bowMetal}
        stroke={COLORS.bowMetalEdge}
        strokeWidth=".6"
      />
      {/* 5. 革グリップ */}
      <rect {...p.grip} fill={COLORS.bowGrip} />
      {/* 6. フェルール */}
      <rect
        {...p.ferrule}
        fill={COLORS.bowMetal}
        stroke={COLORS.bowMetalEdge}
        strokeWidth=".6"
      />
      {/* 7. フロッグ（斜面の最下部から毛が出る） */}
      <path d={BOW_PATHS.frog} fill={COLORS.bowFrog} />
      {/* 8. 真珠アイ */}
      <circle
        {...p.pearl}
        fill={COLORS.bowPearl}
        stroke={COLORS.bowPearlEdge}
        strokeWidth=".7"
      />
      {/* 9. ボタン */}
      <rect {...p.button} fill={COLORS.bowButton} />
      <rect {...p.buttonInner} fill={COLORS.bowButtonInner} />
    </>
  );
}

/** 単体表示用（先=左・フロッグ=右の横長） */
export function Bow({
  className,
  viewBox = BOW_VIEWBOX,
  children,
  title,
}: {
  className?: string;
  viewBox?: string;
  children?: React.ReactNode;
  title?: string;
}) {
  return (
    <svg
      viewBox={viewBox}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title ?? "バイオリンの弓"}
    >
      <BowShape />
      {children}
    </svg>
  );
}
