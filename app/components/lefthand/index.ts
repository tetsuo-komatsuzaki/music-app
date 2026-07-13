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
  FingersShape,
  BodyOverlay,
  PositionBadge,
  WrongMark,
  type LeftHandProps,
} from "./LeftHand";

// ポジション移動モーション
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
