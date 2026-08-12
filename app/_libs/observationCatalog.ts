// 先生の所見「癖タグ」カタログ v1 (2026-08-02 叩き台)。
// 先生は自由記述ではなくここから選ぶ → 構造化データとして集計し、
// 解析データとの相関・処方箋提案・改善トラッキングに使う (成長カルテ Phase 2)。
//
// 運用ルール (subtaskCatalog と同思想):
//  - id は不変。追加は自由。削除・意味変更はしない (表示名の言い換えは可)。
//  - 各分類の「その他」({cat}_other) の利用率が高い分類は粒度が荒いサイン。
//    コメントの内容を見てタグ昇格を検討する (実データでタクソノミーを育てる)。

import { PersonStanding, Move, Hand, Music, Activity, Bell, Calendar, type LucideIcon } from "lucide-react"

export type ObservationTag = { id: string; label: string }
export type ObservationCategory = { id: string; label: string; Icon: LucideIcon; tags: ObservationTag[] }

export const OBSERVATION_CATALOG: ObservationCategory[] = [
  {
    id: "posture", label: "姿勢・構え", Icon: PersonStanding,
    tags: [
      { id: "posture_right_shoulder_up", label: "右肩が上がる" },
      { id: "posture_left_shoulder_tense", label: "左肩に力み" },
      { id: "posture_violin_drops", label: "楽器が下がる" },
      { id: "posture_head_tilt", label: "首の傾き・挟みすぎ" },
      { id: "posture_slouch", label: "猫背・目線が下" },
      { id: "posture_other", label: "その他" },
    ],
  },
  {
    id: "bow", label: "右手", Icon: Move,
    tags: [
      { id: "bow_drift_fingerboard", label: "弓が指板寄りに流れる" },
      { id: "bow_drift_bridge", label: "弓が駒寄りに流れる" },
      { id: "bow_pressure_heavy", label: "弓の圧が強すぎる" },
      { id: "bow_pressure_light", label: "弓の圧が弱い" },
      { id: "bow_wrist_stiff", label: "手首が固い" },
      { id: "bow_short_stroke", label: "全弓を使えていない" },
      { id: "bow_distribution", label: "弓の配分が悪い" },
      { id: "bow_elbow_lag", label: "移弦で肘が遅れる" },
      { id: "bow_crooked", label: "弓が斜めに走る" },
      // 2026-08-12 Tetsuo確定追加 (プロ目線の網羅性レビューより): 持ち方系・跳ね・肘
      { id: "bow_grip_tense", label: "弓を握り込んでいる" },
      { id: "bow_pinky_straight", label: "右小指が伸びている" },
      { id: "bow_bounce", label: "弓が跳ねる・浮く" },
      { id: "bow_elbow_moving", label: "肘を動かしながら弾いている" },
      { id: "bow_other", label: "その他" },
    ],
  },
  {
    id: "left", label: "左手", Icon: Hand,
    tags: [
      { id: "left_wrist_collapse", label: "手首が折れる" },
      { id: "left_press_hard", label: "指の押さえすぎ" },
      { id: "left_finger_flat", label: "指が寝る" },
      { id: "left_finger_high", label: "指が高く上がりすぎる" },
      { id: "left_thumb_position", label: "親指の位置" },
      { id: "left_pinky_straight", label: "小指が伸びきる" },
      { id: "left_shift_tense", label: "ポジション移動で力む" },
      { id: "left_other", label: "その他" },
    ],
  },
  {
    id: "pitch", label: "音程の癖", Icon: Music,
    tags: [
      { id: "pitch_finger1_low", label: "1の指が低い" },
      { id: "pitch_finger2_high", label: "2の指が高い" },
      { id: "pitch_finger3_low", label: "3の指が低い" },
      { id: "pitch_finger4_short", label: "4の指が届かない" },
      { id: "pitch_semitone_wide", label: "半音が広い" },
      { id: "pitch_after_shift", label: "シフト後に定まらない" },
      { id: "pitch_no_resonance", label: "響きを聴けていない" },
      { id: "pitch_other", label: "その他" },
    ],
  },
  {
    id: "rhythm", label: "リズムの癖", Icon: Activity,
    tags: [
      { id: "rhythm_rush", label: "走る" },
      { id: "rhythm_drag", label: "もたる" },
      { id: "rhythm_dotted_weak", label: "付点が甘い" },
      { id: "rhythm_rest_skip", label: "休符を待てない" },
      { id: "rhythm_entry", label: "出だしが合わない" },
      { id: "rhythm_tempo_sway", label: "テンポが揺れる" },
      { id: "rhythm_other", label: "その他" },
    ],
  },
  {
    id: "tone", label: "音・音色", Icon: Bell,
    tags: [
      { id: "tone_scratchy", label: "音がかすれる" },
      { id: "tone_weak", label: "芯がない" },
      { id: "tone_speed_uneven", label: "弓速にムラ" },
      { id: "tone_crossing_noise", label: "移弦の雑音" },
      { id: "tone_vibrato", label: "ビブラートが速い・浅い" },
      { id: "tone_other", label: "その他" },
    ],
  },
  {
    id: "habit", label: "練習習慣", Icon: Calendar,
    tags: [
      { id: "habit_no_slow", label: "ゆっくり練習をしない" },
      { id: "habit_no_section", label: "部分練習をしない" },
      { id: "habit_no_listen", label: "録音を聴き返さない" },
      { id: "habit_skip_basics", label: "基礎練を飛ばす" },
      { id: "habit_other", label: "その他" },
    ],
  },
]

/** タグID→ラベルの逆引き (表示用) */
export const OBSERVATION_TAG_BY_ID: Record<string, { label: string; category: string; categoryLabel: string }> =
  Object.fromEntries(
    OBSERVATION_CATALOG.flatMap((c) =>
      c.tags.map((t) => [t.id, { label: t.label, category: c.id, categoryLabel: c.label }]),
    ),
  )

export const OBSERVATION_SEVERITIES = [
  { id: "mild", label: "気になる" },
  { id: "focus", label: "要重点" },
] as const
export type ObservationSeverity = (typeof OBSERVATION_SEVERITIES)[number]["id"]
