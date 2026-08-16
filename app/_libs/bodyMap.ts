// 癖の人体マップ 定義 (2026-08-02・モックv2承認済 1349ea3b)。
// 癖タグ(observationCatalog)を「体の場所」に対応づける。
//  - 先生の入力: ビュー切替→部位タップ→その部位のタグだけ表示
//  - 生徒の表示: ビューごとの癖バッジ + 部位ハイライト (先生あり特典)
// 座標 x/y は各ビューSVGの viewBox に対する % (BodyFigure と対で管理)。

import { PersonStanding, Hand, Move, Music, type LucideIcon } from "lucide-react"

export type BodyViewId = "body" | "left_out" | "left_in" | "bow_frog" | "bow_tip" | "bow_hold" | "strings"

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
  { id: "bow_tip", label: "右手・弓", short: "先弓", Icon: Move, caption: "先弓の手と腕" },
  { id: "bow_hold", label: "弓の持ち方", short: "弓の持ち方", Icon: Hand, caption: "弓の持ち方・手首・指" },
  { id: "strings", label: "バイオリン上部", short: "バイオリン上部", Icon: Music, caption: "弓の通り道・接点の音" },
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
  // 全身 (2026-08-16 Tetsuo FB反復で確定・v4)。首/楽器/背中は削除→タグは体の外リストへ自動で落ちる。
  // 右肘/右手首/左手首はタグなしの自由記入用 (表示はタグ・自由記入が付くまで出ない)
  { id: "right_shoulder", view: "body", label: "右肩", x: 33, y: 24, tagIds: ["posture_right_shoulder_up"] },
  { id: "left_shoulder", view: "body", label: "左肩", x: 50, y: 24, tagIds: ["posture_left_shoulder_tense"] },
  { id: "body_right_elbow", view: "body", label: "右肘", x: 31, y: 35, tagIds: [] },
  { id: "body_right_wrist", view: "body", label: "右手首", x: 48, y: 36, tagIds: [] },
  { id: "body_left_wrist", view: "body", label: "左手首", x: 72, y: 27, tagIds: [] },
  // 左手・右側から (viewBox 240x190)
  {
    id: "fingers", view: "left_out", label: "指", x: 52, y: 28, // 2026-08-13 イラスト画像 (left-out.webp 1000x750)
    tagIds: [
      "left_finger_flat", "left_finger_high", "left_pinky_straight",
      "pitch_finger1_low", "pitch_finger2_high", "pitch_finger3_low", "pitch_finger4_short",
      "pitch_semitone_wide", "pitch_no_resonance",
    ],
  },
  // 左手・左側から (viewBox 240x190)
  // 2026-08-13 イラスト画像 (left-in.webp 1000x800)
  { id: "left_wrist", view: "left_in", label: "手首", x: 76, y: 76, tagIds: ["left_wrist_collapse", "left_shift_press", "pitch_after_shift", "tone_vibrato"] },
  { id: "left_thumb", view: "left_in", label: "親指", x: 43, y: 52, tagIds: ["left_thumb_position", "left_press_hard", "left_shift_thumb"] },
  // 元弓 (2026-08-16 Tetsuo FB反復で確定: 両手首+両肘の4点構成。手/うで表記は廃止)
  { id: "frog_right_wrist", view: "bow_frog", label: "右手首", x: 39, y: 48, tagIds: ["bow_pressure_heavy", "bow_distribution"] },
  { id: "frog_right_elbow", view: "bow_frog", label: "右肘", x: 23, y: 68, tagIds: ["bow_elbow_lag"] },
  { id: "frog_left_wrist", view: "bow_frog", label: "左手首", x: 79, y: 59, tagIds: [] },
  { id: "frog_left_elbow", view: "bow_frog", label: "左肘", x: 65, y: 79, tagIds: [] },
  // 先弓 (2026-08-16 Tetsuo FB反復で確定: 両手首+両肘の4点構成)
  { id: "tip_right_wrist", view: "bow_tip", label: "右手首", x: 38, y: 77, tagIds: ["bow_wrist_stiff", "bow_pressure_light"] },
  { id: "tip_right_elbow", view: "bow_tip", label: "右肘", x: 24, y: 67, tagIds: ["bow_short_stroke", "bow_elbow_moving"] },
  { id: "tip_left_wrist", view: "bow_tip", label: "左手首", x: 74, y: 46, tagIds: [] },
  { id: "tip_left_elbow", view: "bow_tip", label: "左肘", x: 57, y: 59, tagIds: [] },
  // 弓の持ち方 (2026-08-13 新設ビュー bow-hold.webp 1000x585)。持ち方系タグを集約
  { id: "hold_fingers", view: "bow_hold", label: "指", x: 44, y: 42, tagIds: ["bow_grip_tense", "bow_pinky_straight"] },
  { id: "hold_wrist", view: "bow_hold", label: "手首", x: 78, y: 30, tagIds: ["bow_bounce"] },
  // 弦の上 (viewBox 240x140)
  { id: "contact", view: "strings", label: "弓", x: 42, y: 46, tagIds: ["bow_drift_fingerboard", "bow_drift_bridge", "bow_crooked", "tone_crossing_noise", "tone_scratchy", "tone_weak", "tone_speed_uneven"] },
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
