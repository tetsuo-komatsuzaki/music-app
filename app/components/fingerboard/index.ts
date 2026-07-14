// Arcoda 指板俯瞰図（学びのレッスン 13本）
export {
  OPEN_MIDI, STRING_ORDER, STRING_WIDTH, K, dist,
  V_STR, V_NUT, H_STR, H_NUT, SEG_COLORS,
  DOT_R, DOT_FONT, PILL_FONT, OPEN_R,
  Geo, type StringName,
} from "./fingerboard-geometry";
export {
  FB_LESSONS, getFbLesson, fbLoop, assertFbLesson,
  type FbLesson, type FbEvent, type FbNote,
} from "./fingerboard-lessons";
export { FingerboardDemo, type FingerboardDemoProps } from "./FingerboardDemo";
export {
  FB_MISTAKES, PULL_SEMITONES, LATE_SEC, MISS_COLOR, assertFbMistakes,
  type FbMistakeSet, type PullVictim, type LateVictim,
} from "./fingerboard-mistakes";
export { FingerboardMissDemo, type FingerboardMissDemoProps } from "./FingerboardMissDemo";
