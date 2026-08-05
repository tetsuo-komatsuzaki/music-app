// 統一 雰囲気/表現タグ台帳 (2026-08-05 Tetsuo確定)。
// 思想: 「曲の雰囲気」と「演奏の表現」は同じ語彙を使う —
//   曲えらび「しなやかに流れる曲」→ 演奏後「きみの演奏もしなやかに流れていた」の往復を同じ言葉で。
// 付け方:
//   曲側 = admin が曲を聴いて手動設定 (アップロード/管理画面。自動判定はしない — 人間の耳が正)
//   演奏側 = 将来、録音の物理指標 (IOI/ルバート/スペクトル等) からAI判定 (リズム系→音色系の順)。
//            手動の曲タグはその学習の正解データにもなる
// 分類: ①リズムの印象 / ②音の表情 (内部区分: 音色・輪郭・密度は台帳では分けず10語で平置き)

export type MoodTagGroup = "rhythm" | "texture"

export type MoodTag = {
  id: string
  label: string
  group: MoodTagGroup
}

export const MOOD_TAG_DEFS: MoodTag[] = [
  // ── ① リズムの印象 ──
  { id: "mood_breathing", label: "ゆったりと呼吸するような", group: "rhythm" },
  { id: "mood_light_bounce", label: "軽やかに弾むような", group: "rhythm" },
  { id: "mood_weighted_beat", label: "一拍一拍に重みのある", group: "rhythm" },
  { id: "mood_tense", label: "張り詰めた緊張感のある", group: "rhythm" },
  { id: "mood_groove", label: "心地よく躍動する", group: "rhythm" },
  { id: "mood_supple_flow", label: "しなやかに流れる", group: "rhythm" },
  { id: "mood_crisp", label: "歯切れよく引き締まった", group: "rhythm" },
  // ── ② 音の表情 ──
  { id: "mood_radiant", label: "明るく輝きのある", group: "texture" },
  { id: "mood_warm", label: "温かく包み込むような", group: "texture" },
  { id: "mood_soft_calm", label: "柔らかく穏やかな", group: "texture" },
  { id: "mood_strong_core", label: "力強く芯のある", group: "texture" },
  { id: "mood_deep_rich", label: "深みと厚みのある", group: "texture" },
  { id: "mood_clear", label: "澄んだ透明感のある", group: "texture" },
  { id: "mood_lustrous", label: "艶やかで色彩豊かな", group: "texture" },
  { id: "mood_delicate", label: "繊細で淡い", group: "texture" },
  { id: "mood_sharp_taut", label: "鋭く張りのある", group: "texture" },
  { id: "mood_dark_shadow", label: "重く陰影のある", group: "texture" },
]

export const MOOD_TAG_BY_ID: Record<string, MoodTag> =
  Object.fromEntries(MOOD_TAG_DEFS.map((t) => [t.id, t]))

export const MOOD_GROUP_LABELS: Record<MoodTagGroup, string> = {
  rhythm: "リズムの印象",
  texture: "音の表情",
}

export function isMoodTagId(v: unknown): v is string {
  return typeof v === "string" && v in MOOD_TAG_BY_ID
}

export function moodTagLabel(id: string): string {
  return MOOD_TAG_BY_ID[id]?.label ?? id
}
