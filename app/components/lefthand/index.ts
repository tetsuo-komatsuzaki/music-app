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

// トリル
export {
  TRILLS,
  getTrill,
  trillCSS,
  trillD,
  type TrillDef,
  type TrillLiftStyle,
} from "./lefthand-trill-motions";
export { TrillDemo, type TrillDemoProps } from "./TrillDemo";

// グリッサンド
export {
  GLISSANDOS,
  PROFILE_EVEN,
  PROFILE_UNEVEN,
  getGlissando,
  glissandoCSS,
  glissKeyframes,
  glissSpeeds,
  assertMonotone as assertGlissMonotone,
  type GlissandoDef,
  type GlissKeyframe,
  type SpeedSegment,
  type GlissandoSpeedId,
} from "./lefthand-glissando-motions";
export { GlissandoDemo, type GlissandoDemoProps } from "./GlissandoDemo";

// ビブラート（正解 / ミス）
export {
  VIBRATOS,
  getVibrato,
  vibratoKeyframes,
  vibratoNoteD,
  vibratoAmplitude,
  vibratoHandAmplitude,
  vibratoDuration,
  pxPerCent,
  assertVibrato,
  smilTiming as vibratoSmilTiming,
  fingerValues as vibratoFingerValues,
  handPathValues as vibratoHandPathValues,
  handCreaseValues as vibratoHandCreaseValues,
  type VibratoDef,
  type VibratoKeyframe,
} from "./lefthand-vibrato-motions";
export { VibratoDemo, type VibratoDemoProps } from "./VibratoDemo";

// 装飾音（プラルトリラー / モルデント・正解 / ミス）
export {
  ORNAMENTS,
  getOrnament,
  ornamentCSS,
  ornamentD,
  ornamentShare,
  slownessVsCorrect,
  assertOrnament,
  type OrnamentDef,
} from "./lefthand-ornament-motions";
export { OrnamentDemo, type OrnamentDemoProps } from "./OrnamentDemo";
