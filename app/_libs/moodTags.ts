// 統一 表現タグ台帳 (2026-08-06 Tetsuo確定・最終形)。
// 思想: 「曲の表現」と「演奏の表現」は同じ語彙 — 曲えらび→宿題の目標→クリア認定→表現力レベルを同じ言葉で往復。
// 語彙 = イタリア語の発想標語15語のみ (リズムの印象グループは廃止 — 軽やかさ等は Leggiero/Tranquillo が吸収)。
// 表示 = 日本語主 + イタリア語補足「優しく（Dolce）」(初心者に直感的・先生には馴染みの標語)。
// 付け方: 曲 = admin が聴いて手動 / 演奏 = 先生が認定 (将来は録音からAI判定・手動データが教師データ)。

export type MoodTag = {
  id: string
  label: string
  /** イタリア語の発想標語 */
  italian: string
}

export const MOOD_TAG_DEFS: MoodTag[] = [
  { id: "mood_dolce", label: "優しく", italian: "Dolce" },
  { id: "mood_cantabile", label: "歌うように", italian: "Cantabile" },
  { id: "mood_espressivo", label: "表情豊かに", italian: "Espressivo" },
  { id: "mood_tranquillo", label: "穏やかに", italian: "Tranquillo" },
  { id: "mood_grazioso", label: "優雅に", italian: "Grazioso" },
  { id: "mood_brillante", label: "華やかに", italian: "Brillante" },
  { id: "mood_energico", label: "力強く", italian: "Energico" },
  { id: "mood_appassionato", label: "情熱的に", italian: "Appassionato" },
  { id: "mood_misterioso", label: "神秘的に", italian: "Misterioso" },
  { id: "mood_delicato", label: "繊細に", italian: "Delicato" },
  { id: "mood_leggiero", label: "軽やかに", italian: "Leggiero" },
  { id: "mood_maestoso", label: "荘厳に", italian: "Maestoso" },
  { id: "mood_giocoso", label: "楽しげに", italian: "Giocoso" },
  { id: "mood_amoroso", label: "愛情深く", italian: "Amoroso" },
  { id: "mood_nobile", label: "気高く", italian: "Nobile" },
]

export const MOOD_TAG_BY_ID: Record<string, MoodTag> =
  Object.fromEntries(MOOD_TAG_DEFS.map((t) => [t.id, t]))

export function isMoodTagId(v: unknown): v is string {
  return typeof v === "string" && v in MOOD_TAG_BY_ID
}

/** 表示ラベル: 「優しく」(日本語主+イタリア語補足) */
export function moodTagLabel(id: string): string {
  const t = MOOD_TAG_BY_ID[id]
  if (!t) return id
  return `${t.label}・${t.italian}`
}

/** 名詞つきフレーズ (カルテ・チップ用) — ラベルと同形 */
export function moodTagPhrase(id: string): string {
  return moodTagLabel(id)
}

/** 宿題の目標文: 「優しくの音色を表現しよう」 */
export function moodTagGoalText(id: string): string {
  const t = MOOD_TAG_BY_ID[id]
  if (!t) return id
  return `${moodTagLabel(id)}の音色を表現しよう`
}
