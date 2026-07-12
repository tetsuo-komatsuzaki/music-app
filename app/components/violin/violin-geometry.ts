/**
 * violin-geometry.ts
 *
 * バイオリン／弓 図形データの「単一の真実（Single Source of Truth）」。
 * 図解アセット仕様書 v1.0 の確定値をそのまま定数化したもの。
 *
 * 【不変条件】改変時も必ず維持すること
 *  1. バイオリンは「素の縦座標系」で定義し、単一の回転変換で横長化する。
 *     個別パーツを横向きにハードコードしてはならない（弦順・ポジション方向が崩れる）。
 *  2. 指の位置・弦のx座標は関数で算出する。座標を直接書いてはならない
 *     （ネック長を変えた瞬間に破綻する）。
 *  3. 弓の竿とヘッドは1つのパス。分離した瞬間に継ぎ目が生じる。
 *  4. 弓の毛は必ず両端をパーツ内部まで伸ばし、上に重なるパーツで覆う。
 */

/* ============================================================
   カラーパレット
   ============================================================ */

export const COLORS = {
  // バイオリン
  wood: "#E5C39B",
  wood2: "#D9AF80",
  woodEdge: "#B98A55",
  outline: "#A97142",
  dark: "#463527",
  dark2: "#5A4535",
  string: "#6E5B48",
  nut: "#EFE2CE",
  bridge: "#EBD9B9",
  tailpieceGroove: "#7A6552",

  // 弓
  bowStick: "#B0522E",
  bowHair: "#EFE9DA",
  bowHairEdge: "#D8D0BC",
  bowMetal: "#E6E6E6",
  bowMetalEdge: "#C6C6C6",
  bowGrip: "#2E2E2E",
  bowFrog: "#9A4E28",
  bowPearl: "#F6F2E7",
  bowPearlEdge: "#C9BFA8",
  bowButton: "#3A3A3A",
  bowButtonInner: "#565656",

  // 注釈
  purple: "#7C3AED",
  purpleFill: "rgba(124,58,237,.16)",
  purpleFaint: "rgba(124,58,237,.07)",
  purpleLight: "#B79BEA",
  orange: "#E08A3C",
  orangeFill: "rgba(224,138,60,.16)",
  red: "#D9382C",
  teal: "#14A6A0",
  tealFill: "rgba(20,166,160,.12)",
} as const;

/* ============================================================
   バイオリン：座標系
   ------------------------------------------------------------
   全パスは「素の縦座標系」(240 x 520) で定義する。
   出力時に VIOLIN_ROTATE を一度だけ適用して横長化する。

   変換: 素の点 (x, y) → 表示点 (y, 240 - x)
     ・スクロール(y小) → 表示の左
     ・駒(y大)         → 表示の右 = 高ポジション方向
     ・E弦(x大)        → 表示の上 ／ G弦(x小) → 表示の下
   ============================================================ */

export const VIOLIN_ROTATE = "translate(0,240) rotate(-90)";

/** 標準の横長ビューボックス。minX が -10 なのはスクロール先端が素の y=-5 まで伸びるため */
export const VIOLIN_VIEWBOX = "-10 0 514 240";

export const NUT_Y = 90;
export const BRIDGE_Y = 405;
export const BODY_TOP = 199;
export const FINGERBOARD_END = 262;

/** 露出ネック長（ナット〜胴体上端）。初期設計 84 を 1.3 倍した確定値 */
export const EXPOSED_NECK = BODY_TOP - NUT_Y; // = 109

/** 弦インデックス。素の縦座標系で左→右。回転後は上から E, A, D, G になる */
export const STRING = { G: 0, D: 1, A: 2, E: 3 } as const;
export type StringIndex = 0 | 1 | 2 | 3;

export const STRING_WIDTHS = [1.9, 1.6, 1.3, 1.05] as const;
export const STRING_LABELS = ["G", "D", "A", "E"] as const;

/** 弦のx座標（ナットで狭く、駒で広がる） */
export const nutX = (i: number) => 120 + (i - 1.5) * 6.4;
export const bridgeX = (i: number) => 120 + (i - 1.5) * 11.4;

export const stringX = (i: number, y: number) =>
  nutX(i) + (bridgeX(i) - nutX(i)) * ((y - NUT_Y) / (BRIDGE_Y - NUT_Y));

/** 素の点 (x,y) を表示座標へ変換（回転を数値で再現する必要がある場合に使う） */
export const toDisplay = (x: number, y: number): [number, number] => [y, 240 - x];

/** 表示座標における、位置 y での弦の表示y */
export const stringDisplayY = (i: number, y: number) => 240 - stringX(i, y);

/* ------------------------------------------------------------
   指の押さえ位置
   押さえ位置は振動弦長(ナット→駒)に比例する。ハードコード禁止。
   ------------------------------------------------------------ */

export type PositionNo = 1 | 3;
export type FingerNo = 1 | 2 | 3 | 4;

const FINGER_RATIO: Record<PositionNo, Record<FingerNo, number>> = {
  1: { 1: 0.117, 2: 0.179, 3: 0.241, 4: 0.3 },
  3: { 1: 0.348, 2: 0.403, 3: 0.455, 4: 0.503 },
};

/** 指の押さえ位置（素の縦座標系の y） */
export const fingerY = (pos: PositionNo, finger: FingerNo) =>
  NUT_Y + FINGER_RATIO[pos][finger] * (BRIDGE_Y - NUT_Y);

/** 指の押さえ位置（素の縦座標系の x, y） */
export const fingerPoint = (
  s: StringIndex,
  pos: PositionNo,
  finger: FingerNo
): { x: number; y: number } => {
  const y = fingerY(pos, finger);
  return { x: stringX(s, y), y };
};

/* ============================================================
   バイオリン：パス定義（素の縦座標系）
   ============================================================ */

export const VIOLIN_PATHS = {
  body:
    "M 120,199 C 152,199 178,214 190,244 C 199,266 193,296 175,311 " +
    "C 167,318 165,330 173,341 C 187,357 209,382 213,415 " +
    "C 217,452 198,478 158,489 C 145,491 132,491 120,491 " +
    "C 108,491 95,491 82,489 C 42,478 23,452 27,415 " +
    "C 31,382 53,357 67,341 C 75,330 73,318 65,311 " +
    "C 47,296 41,266 50,244 C 62,214 88,199 120,199 Z",

  purfling:
    "M 120,206 C 149,206 173,220 184,247 C 192,267 187,294 170,308 " +
    "C 161,316 159,331 168,343 C 181,358 202,384 206,415 " +
    "C 210,448 192,472 156,482 C 144,484 132,484 120,484 " +
    "C 108,484 96,484 84,482 C 48,472 30,448 34,415 " +
    "C 38,384 59,358 72,343 C 81,331 79,316 70,308 " +
    "C 53,294 48,267 56,247 C 67,220 91,206 120,206 Z",

  neck: "M 106,87 L 134,87 L 143,240 L 97,240 Z",
  fingerboard: "M 108,90 L 132,90 L 141,262 Q 120,272 99,262 Z",
  pegboxOuter: "M 108,21 L 132,21 L 134,85 L 106,85 Z",
  pegboxInner: "M 112,29 L 128,29 L 129,79 L 111,79 Z",
  scroll: "M 108,21 C 104,9 108,-3 120,-5 C 132,-3 136,9 132,21 Z",

  /** f字孔（片側）。右は translate(158,340)、左は translate(82,340) scale(-1,1) */
  fHole:
    "M 0,0 c -5,9 -8,17 -6,26 c 1,6 5,9 5,14 c 0,5 -5,8 -6,14 c -2,10 1,18 7,24",
  fHoleNotch: "M -6,38 l -5,0 M -6,46 l -5,0",

  bridge: "M 101,412 L 139,412 L 135,398 L 105,398 Z",
  bridgeFeet: "M 108,412 L 108,406 M 132,412 L 132,406",
  tailpiece: "M 107,414 L 133,414 L 129,470 Q 120,476 111,470 Z",
  tailpieceGrooves:
    "M 112,424 L 112,436 M 117,424 L 117,436 M 123,424 L 123,436 M 128,424 L 128,436",
  chinrest:
    "M 62,438 C 48,448 44,466 54,478 C 66,491 92,490 100,476 " +
    "C 106,464 100,448 86,440 C 78,435 68,434 62,438 Z",
} as const;

/* ============================================================
   弓：座標系とパス
   ------------------------------------------------------------
   局所座標系: 先(ヘッド)=左(x≈12) ／ フロッグ=右(x=374)
   毛は y = HAIR_Y の水平線。
   ============================================================ */

export const BOW_VIEWBOX = "0 0 384 84";

/** 毛の高さ（局所y）。フロッグ斜面の最下部 (317,57) を通る */
export const HAIR_Y = 57;

/** 毛の可視範囲（局所x）。両端はヘッド／フロッグに覆われる */
export const HAIR_VISIBLE_MIN = 30; // 先端側
export const HAIR_VISIBLE_MAX = 316; // フロッグ側

export const BOW_TIP_X = 12;
export const BOW_BUTTON_END_X = 374;

export const BOW_PATHS = {
  /** 毛。両端はパーツ内部まで伸ばし、上に重ねるパーツで覆う */
  hair: { x1: 18, y1: HAIR_Y, x2: 324, y2: HAIR_Y, width: 4 },

  /**
   * 竿＋ヘッド：一本の木部として単一パス（継ぎ目・隙間なし）
   *   M 302,43.7            竿の上稜・フロッグ側の起点
   *   Q 168,46.7 30,40      上稜。カンバー（中央が毛側へ湾曲）
   *   L 12,55               ヘッドの前稜。上稜から途切れず流れる「上→左下」
   *   L 16.5,61             先端の象牙面（プレートが乗る）
   *   L 28,59.5             ヘッド下面（毛が入る）
   *   C 32,54 34,49 37,44.9 喉。concave に立ち上がり竿の下稜へ復帰
   *   Q 168,51.3 302,48.3 Z 竿の下稜
   */
  stickAndHead:
    "M 302,43.7 Q 168,46.7 30,40 L 12,55 L 16.5,61 L 28,59.5 " +
    "C 32,54 34,49 37,44.9 Q 168,51.3 302,48.3 Z",

  /** 象牙プレート：先端の下面（毛と同じ側） */
  tipPlate: "M 12,55 L 16.5,61 L 21,59.3 L 16.5,53.3 Z",

  /** フロッグ：斜面 (308,45)→(317,57)。最下部から毛が出る。頂点の下も body が続く */
  frog: "M 308,41 L 338,41 L 338,62 L 322,62 L 317,57 L 308,45 Z",
} as const;

export const BOW_PARTS = {
  winding: { x: 274, y: 42.5, width: 10, height: 8, rx: 1 },
  grip: { x: 284, y: 41.5, width: 17, height: 9.5, rx: 1.5 },
  ferrule: { x: 301, y: 41, width: 7, height: 13, rx: 1 },
  pearl: { cx: 325, cy: 50, r: 3.3 },
  button: { x: 338, y: 45, width: 36, height: 13, rx: 2.5 },
  buttonInner: { x: 344, y: 47.5, width: 18, height: 8, rx: 1.5 },
} as const;
