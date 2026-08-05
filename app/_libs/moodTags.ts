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
  /** イタリア語の発想標語 (音の表情のみ。日本語主表示+補足の確定方針) */
  italian?: string
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
  // ── ② 音の表情 (2026-08-06 Tetsuo確定: イタリア語の発想標語15語に統一。日本語主表示+イタリア語補足) ──
  { id: "mood_dolce", label: "優しく", italian: "Dolce", group: "texture" },
  { id: "mood_cantabile", label: "歌うように", italian: "Cantabile", group: "texture" },
  { id: "mood_espressivo", label: "表情豊かに", italian: "Espressivo", group: "texture" },
  { id: "mood_tranquillo", label: "穏やかに", italian: "Tranquillo", group: "texture" },
  { id: "mood_grazioso", label: "優雅に", italian: "Grazioso", group: "texture" },
  { id: "mood_brillante", label: "華やかに", italian: "Brillante", group: "texture" },
  { id: "mood_energico", label: "力強く", italian: "Energico", group: "texture" },
  { id: "mood_appassionato", label: "情熱的に", italian: "Appassionato", group: "texture" },
  { id: "mood_misterioso", label: "神秘的に", italian: "Misterioso", group: "texture" },
  { id: "mood_delicato", label: "繊細に", italian: "Delicato", group: "texture" },
  { id: "mood_leggiero", label: "軽やかに", italian: "Leggiero", group: "texture" },
  { id: "mood_maestoso", label: "荘厳に", italian: "Maestoso", group: "texture" },
  { id: "mood_giocoso", label: "楽しげに", italian: "Giocoso", group: "texture" },
  { id: "mood_amoroso", label: "愛情深く", italian: "Amoroso", group: "texture" },
  { id: "mood_nobile", label: "気高く", italian: "Nobile", group: "texture" },
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

/** 表示ラベル: 音の表情は「優しく（Dolce）」形式 (日本語主+イタリア語補足) */
export function moodTagLabel(id: string): string {
  const t = MOOD_TAG_BY_ID[id]
  if (!t) return id
  return t.italian ? `${t.label}（${t.italian}）` : t.label
}

/** グループの名詞 (文中で使う): リズムの印象→リズム / 音の表情→音色 */
export const MOOD_GROUP_NOUNS: Record<MoodTagGroup, string> = {
  rhythm: "リズム",
  texture: "音色",
}

/** 名詞つきフレーズ: リズム=「ゆったりと呼吸するようなリズム」 / 音色=「優しく（Dolce）」 */
export function moodTagPhrase(id: string): string {
  const t = MOOD_TAG_BY_ID[id]
  if (!t) return id
  return t.group === "rhythm" ? `${t.label}${MOOD_GROUP_NOUNS.rhythm}` : moodTagLabel(id)
}

/** 宿題の目標文 (2026-08-06 Tetsuo確定の言い回し):
 * リズム系=「◯◯リズムを意識しよう」 / 音色系=「◯◯音色を表現しよう」 */
export function moodTagGoalText(id: string): string {
  const t = MOOD_TAG_BY_ID[id]
  if (!t) return id
  return t.group === "rhythm"
    ? `${t.label}リズムを意識しよう`
    : `${moodTagLabel(id)}の音色を表現しよう`
}
