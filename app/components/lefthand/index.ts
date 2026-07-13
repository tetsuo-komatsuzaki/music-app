/**
 * Arcoda 左手ポジション図解アセット
 *
 * 図解アセット仕様書 v1.2 準拠。図形データは lefthand-geometry.ts が単一の真実。
 */

// 図形データ（単一の真実）
export * from "./lefthand-geometry";
export { FINGER_PATTERNS, type FingerPattern, type NailRect } from "./lefthand-fingers";
export { INSTRUMENT_SVG } from "./lefthand-instrument";

// 描画コンポーネント
export {
  LeftHand,
  InstrumentShape,
  HandShape,
  MissHandShape,
  FingersShape,
  BodyOverlay,
  PositionBadge,
  WrongMark,
  type LeftHandProps,
} from "./LeftHand";

// ポジション移動モーション（正解）
export {
  POSITION_SHIFTS,
  getShift,
  shiftCSS,
  fingerKeyframes,
  handKeyframes,
  overlayOpacityKeyframes,
  type PositionShift,
  type ShiftKeyframe,
} from "./lefthand-motions";
export { PositionShiftDemo, type PositionShiftDemoProps } from "./PositionShiftDemo";

// ポジション移動モーション（ミスパターン）
export {
  MISTAKE_SHIFTS,
  getMistake,
  hasMistake,
  smilTiming,
  assertMonotone,
  mistakeThumbStaysAt,
  type MistakeShift,
  type MistakeKeyframe,
} from "./lefthand-mistake-motions";
export {
  PositionMistakeDemo,
  type PositionMistakeDemoProps,
} from "./PositionMistakeDemo";
