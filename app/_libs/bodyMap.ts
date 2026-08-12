// 癖の人体マップ 定義 (2026-08-02・モックv2承認済 1349ea3b)。
// 癖タグ(observationCatalog)を「体の場所」に対応づける。
//  - 先生の入力: ビュー切替→部位タップ→その部位のタグだけ表示
//  - 生徒の表示: ビューごとの癖バッジ + 部位ハイライト (先生あり特典)
// 座標 x/y は各ビューSVGの viewBox に対する % (BodyFigure と対で管理)。

import { PersonStanding, Hand, Move, Music, type LucideIcon } from "lucide-react"

export type BodyViewId = "body" | "left_out" | "left_in" | "bow_frog" | "bow_tip" | "strings"

export interface BodyView {
  id: BodyViewId
  label: string
  short: string
  Icon: LucideIcon
  caption: string
}

export const BODY_VIEWS: BodyView[] = [
  { id: "body", label: "全身", short: "全身", Icon: PersonStanding, caption: "全身＋横すがた" },
  { id: "left_out", label: "左手", short: "左手·右", Icon: Hand, caption: "指のかたち・1〜4指の音程" },
  { id: "left_in", label: "左手", short: "左手·左", Icon: Hand, caption: "手首の折れ・親指・押さえすぎ" },
  { id: "bow_frog", label: "右手・弓", short: "元弓", Icon: Move, caption: "元弓の手と肘" },
  { id: "bow_tip", label: "右手・弓", short: "先弓", Icon: Move, caption: "先弓の手と肘" },
  { id: "strings", label: "弦の上・弓と弦の接点", short: "弦の上", Icon: Music, caption: "弓の通り道・接点の音" },
]

export interface BodySpot {
  id: string
  view: BodyViewId
  label: string
  /** SVGステージに対する位置 (%) */
  x: number
  y: number
  tagIds: string[]
}

export const BODY_SPOTS: BodySpot[] = [
  // 全身 (2026-08-11 新イラスト・viewBox -52 -15 188 132。座標は anc-* アンカーの%換算)
  { id: "right_shoulder", view: "body", label: "右肩", x: 22.1, y: 26.9, tagIds: ["posture_right_shoulder_up"] },
  { id: "left_shoulder", view: "body", label: "左肩", x: 33.2, y: 26.9, tagIds: ["posture_left_shoulder_tense"] },
  { id: "neck", view: "body", label: "首", x: 27.7, y: 16.1, tagIds: ["posture_head_tilt"] },
  { id: "violin", view: "body", label: "楽器", x: 50.2, y: 28.8, tagIds: ["posture_violin_drops"] },
  { id: "back", view: "body", label: "背中", x: 77.9, y: 35.6, tagIds: ["posture_slouch"] },
  // 左手・右側から (viewBox 240x190)
  {
    id: "fingers", view: "left_out", label: "指", x: 52, y: 22,
    tagIds: [
      "left_finger_flat", "left_finger_high", "left_pinky_straight",
      "pitch_finger1_low", "pitch_finger2_high", "pitch_finger3_low", "pitch_finger4_short",
      "pitch_semitone_wide", "pitch_no_resonance",
    ],
  },
  // 左手・左側から (viewBox 240x190)
  // 2026-08-12 新イラスト (viewBox 0 0 1000 1000・anc-lhl-*アンカーの%換算)
  { id: "left_wrist", view: "left_in", label: "手首", x: 69.0, y: 59.6, tagIds: ["left_wrist_collapse", "left_shift_press", "pitch_after_shift", "tone_vibrato"] },
  { id: "left_thumb", view: "left_in", label: "親指", x: 34.8, y: 31.9, tagIds: ["left_thumb_position", "left_press_hard", "left_shift_thumb"] },
  // 元弓 (viewBox 240x190)
  { id: "frog_hand", view: "bow_frog", label: "手", x: 40, y: 42, tagIds: ["bow_pressure_heavy", "bow_distribution"] },
  { id: "frog_elbow", view: "bow_frog", label: "肘", x: 17, y: 76, tagIds: ["bow_elbow_lag"] },
  // 先弓 (viewBox 240x190)
  { id: "tip_hand", view: "bow_tip", label: "手", x: 76, y: 44, tagIds: ["bow_wrist_stiff", "bow_pressure_light"] },
  { id: "tip_elbow", view: "bow_tip", label: "肘", x: 44, y: 78, tagIds: ["bow_short_stroke"] },
  // 弦の上 (viewBox 240x140)
  { id: "contact", view: "strings", label: "弓", x: 45, y: 48, tagIds: ["bow_drift_fingerboard", "bow_drift_bridge", "bow_crooked", "tone_crossing_noise", "tone_scratchy", "tone_weak", "tone_speed_uneven"] },
]

/** タグID → 部位 (体で表せないタグは undefined) */
export const SPOT_BY_TAG: Record<string, BodySpot> = Object.fromEntries(
  BODY_SPOTS.flatMap((s) => s.tagIds.map((t) => [t, s])),
)

/** ビューごとの部位一覧 */
export function spotsOf(view: BodyViewId): BodySpot[] {
  return BODY_SPOTS.filter((s) => s.view === view)
}

/** 体で表せないカテゴリ (入力UIでは別ボタン) */
export const NON_BODY_CATEGORIES = ["rhythm", "habit"] as const
