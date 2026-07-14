/**
 * Arcoda 左手ポジション図解アセット — 図形データ（単一の真実）
 *
 * 図解アセット仕様書 v1.2 の設計思想に準拠:
 *   - 図形データはこのファイルが単一の真実
 *   - 運弓の h に相当するのが、左手では d（シフト量）
 *   - d の時系列だけから全パーツの座標変換が導出される
 *   - パターンごとに動きを作り込んではならない
 *
 * ⚠️ 本ファイルの座標値は確定SVGアセットから機械抽出したもの。手書きで書き換えないこと。
 */

/* ============================================================
   カラーパレット（確定値・楽器SVGの実値と一致）
   ============================================================ */
export const COLORS = {
  bg: "#F7F0E8",
  floor: "#E9D3A9",
  floorEdge: "#D9BE8E",
  skin: "#F6CBA6",
  skinEdge: "#C98F5F",
  nail: "#FADFC9",
  wood: "#E5C39B",
  woodEdge: "#A97142",
  woodDark: "#D9AF80",
  nut: "#EFE2CE",
  nutEdge: "#B98A55",
  fingerboardSide: "#463527",
  fingerboardTop: "#5A4535",
  string: "#EFE9DA",
  peg: "#3A2A1D",
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

/** 指幅 1 本分 = 68px（2nd への移動量） */
export const FINGER_WIDTH = 68;

/** 指系・手系の基準オフセット（1st = d0 の位置） */
export const FINGER_ORIGIN_X = -34;
export const FINGER_ORIGIN_Y = -1.69;
export const HAND_ORIGIN_X = -49;
export const HAND_ORIGIN_Y = -2.54;

const round2 = (v: number) => Math.round(v * 100) / 100;

/**
 * シフト量 d から、2 系統の transform を導出する。
 *
 * ⚠️ y 係数が異なるのは、弦の傾き(0.0497)とネック下縁の傾き(0.0519)が
 *    異なるため。**片方だけ動かすと掌がネックから浮いて絵が壊れる。**
 */
export function fingerTransform(d: number): string {
  const [x, y] = fingerTranslate(d);
  return `translate(${x}, ${y})`;
}

export function handTransform(d: number): string {
  const [x, y] = handTranslate(d);
  return `translate(${x}, ${y})`;
}

/** SMIL の animateTransform に渡す数値ペア（transform 文字列ではなく [x, y]） */
export function fingerTranslate(d: number): [number, number] {
  return [FINGER_ORIGIN_X + d, round2(FINGER_ORIGIN_Y + d * STRING_SLOPE)];
}

export function handTranslate(d: number): [number, number] {
  return [HAND_ORIGIN_X + d, round2(HAND_ORIGIN_Y + d * NECK_SLOPE)];
}

/* ============================================================
   ポジション定義
   ============================================================ */
export type PositionId = "1st" | "2nd" | "3rd" | "4th" | "5th" | "6th";

export interface PositionDef {
  /** シフト量（px・1st を 0 とする） */
  d: number;
  /** 掌が胴と重なるため、胴を手前に再描画する必要があるか */
  bodyOverlay: boolean;
  /** 親指がネック裏に回る専用形状か（handTransform では作れない） */
  thumbBehindNeck: boolean;
  label: string;
}

export const POSITIONS: Record<PositionId, PositionDef> = {
  "1st": { d: 0,   bodyOverlay: false, thumbBehindNeck: false, label: "1stポジション" },
  "2nd": { d: 68,  bodyOverlay: false, thumbBehindNeck: false, label: "2ndポジション" },
  "3rd": { d: 170, bodyOverlay: true,  thumbBehindNeck: false, label: "3rdポジション" },
  "4th": { d: 272, bodyOverlay: true,  thumbBehindNeck: false, label: "4thポジション" },
  "5th": { d: 340, bodyOverlay: true,  thumbBehindNeck: true,  label: "5thポジション" },
  "6th": { d: 391, bodyOverlay: true,  thumbBehindNeck: true,  label: "6thポジション" },
};

/** 胴オーバーレイが必要になる最小の d（3rd の手前） */
export const BODY_OVERLAY_MIN_D = POSITIONS["3rd"].d;

/* ============================================================
   指パターン
   ============================================================ */
export type FingerPatternId =
  | "open"        // どの指も押さえていない（開放弦）
  | "up1"         // 1の指を立てる（トリル「0の指 ⇔ 1の指」の上側）
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
export const HAND_PATH = `M 363,342 C 382,374 398,404 420,440 C 444,472 486,492 520,498 C 546,502 566,506 576,514
  L 689,627 Q 695,633 702,630 L 788,580 Q 795,576 794,569 L 682,464 C 675,437 668,410
  662,382 L 458,371 C 462,380 464,390 466,398 C 444,376 420,350 397,322 C 390,310 372,314
  363,342 Z`;

/** 手のしわ（母指球・手首・親指の付け根） */
export const HAND_CREASES = [
  "M 472,408 C 478,436 486,460 494,480",
  "M 624,568 C 642,550 660,532 678,514",
  "M 414,372 C 421,380 426,388 428,396",
] as const;

/**
 * 5th/6th 専用の手パス（親指がネック裏に回る）。
 * translate では作れないため、最終座標で定義する。
 * 5th と 6th で共通（指の位置だけが d で変わる = 手は動かず指だけが伸びる）。
 */
export const HAND_BEHIND_NECK_PATH = `M 714,385 C 700,389 676,398 672,415 C 668,435 682,456 705,456 C 718,456 727,445 731,430
  L 918,394 C 930,398 938,403 942,410 L 1008,476 Q 1014,483 1009,489 L 932,566 Q 926,571
  920,566 L 848,494 C 826,480 780,462 716,446 Z`;

export const HAND_BEHIND_NECK_CREASES = [
  "M 942,546 C 954,534 964,522 974,512",
] as const;

/**
 * 胴の前面再描画（3rd 以上で必須）。
 * 掌が胴と重なる領域では、胴が掌の手前に来る。
 */
export const BODY_OVERLAY_FILL = `M 692,355.4 L 1000,371 L 1000,478 L 716,464 C 702,460 694,428 692,383 Z`;
export const BODY_OVERLAY_STROKE = `M 692,383 C 694,428 702,460 716,464 L 1000,478`;

/* ============================================================
   ミスパターン（親指が1つ前のポジションに取り残される・指が逆傾き）

   元絵の構造（2nd-miss / 4th-miss の実測から機械特定）:
     指 = fingerTransform(d) ∘ 剪断 MISS_SHEAR_MATRIX
     手 = handTransform(d) ＋ 専用のミス手パス
   ミス手パスは「掌が MISS_PALM_LAG(68px) 引っ込み、
   親指がさらに (lag - 68) 引っ込む」形で描かれている。
   正しい手は60点・ミス手は70点なので、**両者は形状補間できない**。
   ============================================================ */

/** 親指が取り残される先（1つ前のポジション） */
export const PREV_POSITION: Record<PositionId, PositionId> = {
  "1st": "1st", "2nd": "1st", "3rd": "2nd", "4th": "3rd", "5th": "4th", "6th": "5th",
};

/** ミス手の掌が引っ込んでいる量（元絵に焼き込まれた定数） */
export const MISS_PALM_LAG = 68;

/** 指の逆傾き（剪断）。⚠️ 鏡映 scale(-1,1) は禁止（指の並び順まで反転する） */
export const MISS_SHEAR_MATRIX = "matrix(1,0,-0.42,1,128.1,0)";
/** 上記をアニメーション可能な形に分解: translate(TX,0) skewX(DEG) */
export const MISS_SHEAR_TX = 128.1;
export const MISS_SKEW_DEG = -22.78241;   // atan(-0.42) → tan = -0.420000

/** ミス手パスの基準形（遅れ量 lag = MISS_PALM_LAG のとき。= 2nd-miss の元絵） */
export const MISS_HAND_PATH_BASE = `M 295,339 C 314,371 330,401 352,437 C 376,471 418,491 452,497 C 458,501 472,506 480,516 Q
  486,524 490,532 L 597,626 Q 603,632 610,629 L 696,579 Q 703,575 702,568 L 616,486 C 606,478
  598,468 594,456 C 612,432 640,410 646,381 L 422,370 C 414,374 406,378 398,383 C 376,373
  352,347 329,319 C 322,307 304,311 295,339 Z`;

/**
 * 上記パスの数値列を 0 始まりで数えたときの、**親指側 x 座標**の位置。
 * 2nd-miss と 4th-miss の差分（x のみ14点・すべて -34）から機械特定した。
 */
export const MISS_HAND_THUMB_INDICES = [0, 2, 4, 6, 50, 52, 54, 56, 58, 60, 62, 64, 66, 68] as const;

/** ミス手のしわ（遅れ量によらず不変） */
export const MISS_HAND_CREASES = [
  "M 436,404 C 464,424 474,452 476,480",
  "M 516,386 C 528,420 552,440 582,444",
  "M 414,372 C 421,380 426,388 428,396",
] as const;

/** そのポジションで親指が取り残される量（px） */
export function missLag(p: PositionId): number {
  return POSITIONS[p].d - POSITIONS[PREV_POSITION[p]].d;
}

/** 遅れ量 lag のミス手パスを生成する（親指側 x を -(lag - 68) だけずらす） */
export function missHandPath(lag: number): string {
  const off = -(lag - MISS_PALM_LAG);
  const idx = new Set<number>(MISS_HAND_THUMB_INDICES as readonly number[]);
  let i = -1;
  return MISS_HAND_PATH_BASE.replace(/-?\d+\.?\d*/g, (mm) => {
    i += 1;
    return idx.has(i) ? String(Number(mm) + off) : mm;
  });
}

/* ------------------------------------------------------------
   ミスモーションは「移動進捗 s（0→1）」の一元管理。

     指  = fingerTransform(D·s) translate(TX·s, 0) skewX(DEG·s)
     手  = handTransform(D·s + MISS_PALM_LAG·(1 - s))
     パス = missHandPath(MISS_PALM_LAG - (MISS_PALM_LAG - lag)·s)

   ⇒ 親指の絶対x = 314 + s·(D - lag)   掌の絶対x = 471 + s·(D - 68)
      ともに **単調増加**し、最終値を超えない。これが唯一の合格条件。

   ⚠️ 親指の座標だけを s に比例させてはならない。掌も68px引っ込んでいるため、
      s=0 のとき掌だけが左に残り、**親指の左に出っ張りが生じる**。
   ⚠️ transform と d 属性は必ず同一の keyTimes / keySplines を使うこと。
      ずらすと **親指が逆戻りする**。
   ------------------------------------------------------------ */

/** 静止画用: 指の transform 文字列（剪断込み） */
export function missFingerTransform(target: PositionId, s: number): string {
  const [x, y] = fingerTranslate(POSITIONS[target].d * s);
  return `translate(${x}, ${y}) translate(${round2(MISS_SHEAR_TX * s)}, 0)`
    + ` skewX(${(MISS_SKEW_DEG * s).toFixed(5)})`;
}

/** 静止画用: 崩れた手の transform 文字列（掌の遅れ込み） */
export function missHandTransform(target: PositionId, s: number): string {
  return handTransform(POSITIONS[target].d * s + MISS_PALM_LAG * (1 - s));
}

/** 崩れた手のパス（親指の遅れ込み） */
export function missHandPathAt(target: PositionId, s: number): string {
  return missHandPath(MISS_PALM_LAG - (MISS_PALM_LAG - missLag(target)) * s);
}

/* ------------------------------------------------------------
   SMIL 用の数値ペア。
   ⚠️ 剪断 matrix(...) は animateTransform で補間できない（type は translate/scale/
      rotate/skewX/skewY のみ）。**additive="sum" の3本に分解**して重ねること:
        1) translate  fingerTranslate(D·s)
        2) translate  (MISS_SHEAR_TX·s, 0)   additive
        3) skewX      MISS_SKEW_DEG·s        additive
   ------------------------------------------------------------ */
export const missFingerTranslate = (target: PositionId, s: number) =>
  fingerTranslate(POSITIONS[target].d * s);

export const missShearTranslate = (s: number): [number, number] =>
  [round2(MISS_SHEAR_TX * s), 0];

export const missSkew = (s: number): number =>
  Number((MISS_SKEW_DEG * s).toFixed(5));

export const missHandTranslate = (target: PositionId, s: number) =>
  handTranslate(POSITIONS[target].d * s + MISS_PALM_LAG * (1 - s));

/** 正しい手（崩れる前に見えている手）の平行移動 */
export const okHandTranslate = (target: PositionId, s: number) =>
  handTranslate(POSITIONS[target].d * s);

/* ============================================================
   立て指(F-6)のスロット間隔 (トリル up1 の機械導出用)
   f1_up2 → f12_up3 の実測差分。傾き 0.05 は弦の傾き(0.0497)と一致する。
   ============================================================ */
export const RAISED_FINGER_SLOT_DX = 60;
export const RAISED_FINGER_SLOT_DY = 3;

/* ============================================================
   連続移動(グリッサンド)のためのしきい値
   ポジション移動は「点から点へ」だが、グリッサンドは d が連続変化する。
   そのため手形の持ち替えと胴オーバーレイの出没を d から直接導出する。
   ⚠️ BODY_OVERLAY_FADE_HI < HAND_SWITCH_D_LO を必ず保つこと(掌が胴から透ける防止)。
   ============================================================ */
/** この d 以下ではナット側の手形、以上ではネック裏の手形。間はクロスフェード */
export const HAND_SWITCH_D_LO = 265;
export const HAND_SWITCH_D_HI = 315;
/** 胴オーバーレイの出没帯(3rd の d=170 前後) */
export const BODY_OVERLAY_FADE_LO = BODY_OVERLAY_MIN_D; // 170
export const BODY_OVERLAY_FADE_HI = 215;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** d から「親指がネック裏に回っている度合い」(0-1) を導く */
export function behindNeckAt(d: number): number {
  return clamp01((d - HAND_SWITCH_D_LO) / (HAND_SWITCH_D_HI - HAND_SWITCH_D_LO));
}

/** d から「胴オーバーレイの不透明度」(0-1) を導く */
export function bodyOverlayAt(d: number): number {
  return clamp01((d - BODY_OVERLAY_FADE_LO) / (BODY_OVERLAY_FADE_HI - BODY_OVERLAY_FADE_LO));
}

/* ============================================================
   検証用の不変条件（改変後は必ず確認すること）
   ============================================================ */
export const INVARIANTS = {
  /** 掌上縁がこの直線に載る（残差 ≤3px）。崩れると手が楽器から浮いて見える */
  neckLine: (x: number) => NECK_Y0 + (x - NECK_X0) * NECK_SLOPE,
  neckLineTolerance: 3,
  /** 指先が弦の上に着地している / 浮かせ指の直下に背景の空白がない / 手が単一の連結成分 */
} as const;

/** ピクセル検査で「囲まれた背景」として現れるが、いずれも意図した構造 */
export const KNOWN_NON_DEFECTS = {
  nut: 15,
  webNotch: [139, 151],
  webNotchMiss: [233, 312],
} as const;
