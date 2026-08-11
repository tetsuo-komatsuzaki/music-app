/**
 * Arcoda ナチュラル・ハーモニクス図解 — データ層
 *
 * 【設計の核 — 「接触」は押弦と浮きの中間状態】
 * 既存アセットでは、指の状態は **爪の矩形** で符号化されている:
 *   浮かせ指 = open の爪（縦 8px・浅い）
 *   押弦     = f1234 の爪（縦 16px・深い）
 * ハーモニクスの「軽く触れる」は、この 2 状態の **中点** として定義する。
 *
 * > 新しい座標値を手書きしてはならない。
 * > 本ファイルの数値はすべて lefthand-fingers.ts / lefthand-geometry.ts から導出される。
 *
 * また、open パターンの mass は 4 指が独立したサブパスで構成されているため、
 * 指を 1 本だけ別状態にできる（f123/f1234 の融合マスとは異なる）。
 */

import { FINGER_PATTERNS, type NailRect } from "./lefthand-fingers";
import { STRING_SLOPE, FINGER_ORIGIN_X, FINGER_ORIGIN_Y, POSITIONS, type PositionId } from "./lefthand-geometry";

const round2 = (v: number) => Math.round(v * 100) / 100;

/* ============================================================
   open の 4 指を個別サブパスに分解（機械分割・手書き禁止）
   ============================================================ */
export const OPEN_FINGER_MASS: string[] = FINGER_PATTERNS.open.mass
  .split("Z")
  .map((s) => s.trim())
  .filter(Boolean)
  .map((s) => `${s} Z`);

if (process.env.NODE_ENV !== "production" && OPEN_FINGER_MASS.length !== 4) {
  throw new Error("OPEN_FINGER_MASS: 4指に分割できていない");
}

/* ============================================================
   指の 3 状態
   ============================================================ */
export type FingerState = "hover" | "touch" | "press";

/** 浮かせ */
export const NAIL_HOVER: readonly NailRect[] = FINGER_PATTERNS.open.nails;
/** 押弦・f1234 の確定値 */
export const NAIL_PRESS: readonly NailRect[] = FINGER_PATTERNS.f1234.nails;

/** rotate(8 cx cy) を矩形中心から再生成する */
const nailTransform = (n: Omit<NailRect, "transform">) =>
  `rotate(8 ${round2(n.x + n.width / 2)} ${round2(n.y + n.height / 2)})`;

/** 接触＝浮きと押弦の中点。新規の手書き値は存在しない。 */
export const NAIL_TOUCH: readonly NailRect[] = NAIL_HOVER.map((a, i) => {
  const b = NAIL_PRESS[i];
  const rect = {
    x: round2((a.x + b.x) / 2),
    y: round2((a.y + b.y) / 2),
    width: round2((a.width + b.width) / 2),
    height: round2((a.height + b.height) / 2),
    rx: round2(((a.rx ?? 0) + (b.rx ?? 0)) / 2),
  };
  return { ...rect, transform: nailTransform(rect) };
});

export function nailFor(index: number, state: FingerState): NailRect {
  return state === "press" ? NAIL_PRESS[index] : state === "touch" ? NAIL_TOUCH[index] : NAIL_HOVER[index];
}

/** 押弦した指はしわを描かない。接触・浮きは描く。 */
export function creaseFor(index: number, state: FingerState): string | null {
  return state === "press" ? null : FINGER_PATTERNS.open.creases[index];
}

/* ============================================================
   接触点（指先を弦上に射影）
   指先 = 押弦時の爪の下端 + 8px（指腹の厚み）
   ============================================================ */
export const FINGERTIP_OFFSET = 8;

export function contactPoint(fingerIndex: number, d: number): { x: number; y: number } {
  const n = NAIL_PRESS[fingerIndex];
  return {
    x: round2(n.x + n.width / 2 + FINGER_ORIGIN_X + d),
    y: round2(n.y + n.height + FINGERTIP_OFFSET + FINGER_ORIGIN_Y + d * STRING_SLOPE),
  };
}

/* ============================================================
   ハーモニクスの節（図解の確定仕様）

   ⚠️ 駒はビューボックス外にあるため、節を弦長比では置けない。
      「その節を鳴らす運指位置」で定義する（物理的に等価）。
   ============================================================ */
export type HarmonicNodeId = "quarter" | "third" | "half";

export interface HarmonicNode {
  id: HarmonicNodeId;
  /** 触れる指・0 = 1の指 */
  finger: 0 | 1 | 2 | 3;
  position: PositionId;
  /** 節の呼称 */
  node: string;
  /** 触れる位置 */
  touchAt: string;
  /** 実際に鳴る音 */
  sounds: string;
  label: string;
}

export const HARMONIC_NODES: Record<HarmonicNodeId, HarmonicNode> = {
  quarter: {
    id: "quarter", finger: 2, position: "1st",
    node: "1/4点", touchAt: "完全4度の位置・3の指", sounds: "開放弦の2オクターブ上",
    label: "1/4点ハーモニクス",
  },
  third: {
    id: "third", finger: 3, position: "1st",
    node: "1/3点", touchAt: "完全5度の位置・4の指", sounds: "開放弦の12度上・オクターブ＋5度",
    label: "1/3点ハーモニクス",
  },
  half: {
    id: "half", finger: 3, position: "4th",
    node: "1/2点", touchAt: "オクターブの位置・4thポジション・4の指", sounds: "開放弦の1オクターブ上",
    label: "1/2点ハーモニクス",
  },
};

/* ============================================================
   ミスパターン
   ============================================================ */
export type HarmonicMistakeId = "press" | "shallow";

export interface HarmonicMistake {
  id: HarmonicMistakeId;
  /** 触れるべき指が実際に取る状態 */
  state: FingerState;
  label: string;
  result: string;
}

export const HARMONIC_MISTAKES: Record<HarmonicMistakeId, HarmonicMistake> = {
  press: {
    id: "press", state: "press",
    label: "押さえすぎ",
    result: "弦が指板に着き、実音が鳴る",
  },
  shallow: {
    id: "shallow", state: "hover",
    label: "接触が浅い／位置がズレる",
    result: "鳴らない・雑音になる",
  },
};

/** 図の色 */
export const HARMONIC_COLORS = {
  ring: "#1E88A8",
  bad: "#D9534F",
} as const;

/** 指状態の配列を組み立てる */
export function fingerStates(target: number, state: FingerState): FingerState[] {
  return [0, 1, 2, 3].map((i) => (i === target ? state : "hover"));
}

/** d の取得 */
export const nodeD = (n: HarmonicNode) => POSITIONS[n.position].d;
export const nodeBodyOverlay = (n: HarmonicNode) => POSITIONS[n.position].bodyOverlay;
export const nodeThumbBehind = (n: HarmonicNode) => POSITIONS[n.position].thumbBehindNeck;
