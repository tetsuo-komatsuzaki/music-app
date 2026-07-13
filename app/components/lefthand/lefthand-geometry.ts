/**
 * Arcoda 左手ポジション図解アセット — 図形データ（単一の真実）
 *
 * 図解アセット仕様書 v1.2 の設計思想に準拠:
 *   - 図形データはこのファイルが単一の真実
 *   - 運弓の h に相当するのが、左手では d（シフト量）
 *   - d の時系列だけから全パーツの座標変換が導出される
 *   - パターンごとに動きを作り込んではならない
 */

/* ============================================================
   カラーパレット（violin-geometry.ts と同値・確定値）
   ============================================================ */
export const COLORS = {
  bg: "#F7F0E8",
  floor: "#E5D5AE",
  skin: "#F6CBA6",
  skinEdge: "#C98F5F",
  nail: "#FADFC9",
  wood: "#E5C39B",
  woodEdge: "#A97142",
  woodDark: "#D8B182",
  nut: "#EFE2CE",
  fingerboard: "#4A3728",
  string: "#F2EDE4",
  peg: "#3A2A1E",
} as const;

/* ============================================================
   座標系
   ============================================================ */
export const VIEWBOX = "0 0 1000 1000";

/** ネック下縁の直線: y = NECK_Y0 + (x - NECK_X0) * NECK_SLOPE */
export const NECK_X0 = 345;
export const NECK_Y0 = 365;
export const NECK_SLOPE = 0.0519;

/** 弦の傾き（指の移動に使う） */
export const STRING_SLOPE = 0.0497;

/** 指幅 1 本分 = 68px（ポジション間隔の基準単位） */
export const FINGER_WIDTH = 68;

/**
 * シフト量 d から、2 系統の transform を導出する。
 *
 * ⚠️ y 係数が異なるのは、弦の傾き(0.0497)とネック下縁の傾き(0.0519)が
 *    異なるため。**片方だけ動かすと絵が壊れる。**
 */
export function fingerTransform(d: number): string {
  const x = -34 + d;
  const y = -1.69 + d * STRING_SLOPE;
  return `translate(${x}, ${round(y)})`;
}

export function handTransform(d: number): string {
  const x = -49 + d;
  const y = -2.54 + d * NECK_SLOPE;
  return `translate(${x}, ${round(y)})`;
}

const round = (v: number) => Math.round(v * 100) / 100;

/* ============================================================
   ポジション定義
   ============================================================ */
export type PositionId = "1st" | "2nd" | "3rd" | "4th" | "5th" | "6th";

export interface PositionDef {
  /** シフト量（px・1st を 0 とする） */
  d: number;
  /** 掌が胴と重なるため、胴を手前に再描画する必要があるか */
  bodyOverlay: boolean;
  /**
   * 親指がネック裏に回る専用形状か。
   * true の場合、handTransform では作れない（HAND_BEHIND_NECK を使う）
   */
  thumbBehindNeck: boolean;
  label: string;
}

export const POSITIONS: Record<PositionId, PositionDef> = {
  "1st": { d: 0, bodyOverlay: false, thumbBehindNeck: false, label: "1stポジション" },
  "2nd": { d: 68, bodyOverlay: false, thumbBehindNeck: false, label: "2ndポジション" },
  "3rd": { d: 170, bodyOverlay: true, thumbBehindNeck: false, label: "3rdポジション" },
  "4th": { d: 272, bodyOverlay: true, thumbBehindNeck: false, label: "4thポジション" },
  "5th": { d: 340, bodyOverlay: true, thumbBehindNeck: true, label: "5thポジション" },
  "6th": { d: 391, bodyOverlay: true, thumbBehindNeck: true, label: "6thポジション" },
};

/* ============================================================
   指パターン
   ============================================================ */
export type FingerPatternId =
  | "f1"          // 1の指のみ押弦
  | "f12"         // 1〜2の指
  | "f123"        // 1〜3の指
  | "f1234"       // 全指
  | "f1_up2"      // 1押弦・2を立てる
  | "f12_up3";    // 1,2押弦・3を立てる

/* ============================================================
   パス定義（確定値）

   ⚠️ 手パスの「L 458,371 以降」の区間（掌上縁 → 水かきの窪み → 親指の内縁）は
      掌上縁とネック下縁の「一本線」を成立させている。**削ってはならない。**
   ============================================================ */

/** 掌＋親指＋手首＋前腕（1st〜4th 共通・単一クローズドパス） */
export const HAND_PATH = `M 363,342
  C 382,374 398,404 420,440
  C 444,472 486,492 520,498
  C 546,502 566,506 576,514
  L 689,627
  Q 695,633 702,630
  L 788,580
  Q 795,576 794,569
  L 682,464
  C 675,437 668,410 662,382
  L 458,371
  C 462,380 464,390 466,398
  C 444,376 420,350 397,322
  C 390,310 372,314 363,342 Z`;

/** 手のしわ（母指球・手首） */
export const HAND_CREASES = [
  "M 472,408 C 478,436 486,460 494,480",
  "M 624,568 C 642,550 660,532 678,514",
] as const;

/**
 * 5th/6th 専用の手パス（親指がネック裏に回る）。
 * translate では作れないため、最終座標で定義する。
 * 5th と 6th で共通（指の位置だけが d で変わる）。
 */
export const HAND_BEHIND_NECK_PATH = `M 714,385
  C 700,389 676,398 672,415
  C 668,435 682,456 705,456
  C 718,456 727,445 731,430
  L 918,394
  C 930,398 938,403 942,410
  L 1008,476
  Q 1014,483 1009,489
  L 932,566
  Q 926,571 920,566
  L 848,494
  C 826,480 780,458 712,436 Z`;

export const HAND_BEHIND_NECK_CREASES = [
  "M 838,570 C 848,558 858,548 868,538",
] as const;

/**
 * 胴の前面再描画（3rd 以上で必須）。
 * 掌が胴と重なる領域では、胴が掌の手前に来る。
 * 塗りは一塊と同色・無ストロークにすること（継ぎ目を作らないため）。
 */
export const BODY_OVERLAY_FILL = `M 692,355.4 L 1000,371 L 1000,478 L 716,464
  C 702,460 694,428 692,383 Z`;

export const BODY_OVERLAY_STROKE = `M 692,383 C 694,428 702,460 716,464 L 1000,478`;

/* ============================================================
   検証用の不変条件（実装後に必ず確認すること）
   ============================================================ */
export const INVARIANTS = {
  /** 掌上縁がこの直線に載る（残差 ≤3px）。崩れると手が楽器から浮いて見える */
  neckLine: (x: number) => NECK_Y0 + (x - NECK_X0) * NECK_SLOPE,
  neckLineTolerance: 3,
  /** 指先は弦の上に着地している */
  /** 浮かせ指の直下に背景の空白がない */
  /** 手は単一の連結成分（分断していない） */
} as const;

/**
 * 既知の「欠陥ではない」検出。
 * ピクセル検査で「囲まれた背景」として現れるが、いずれも意図した構造。
 */
export const KNOWN_NON_DEFECTS = {
  nut: 15,              // ナット部
  webNotch: [139, 151], // 水かき（親指と人差し指の谷）
  webNotchMiss: [233, 312], // ミスパターンの水かき（親指が取り残される表現）
} as const;
