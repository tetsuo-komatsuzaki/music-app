// 曲(Score)のジャンル区分 (2026-07-18 Tetsuo確定)。
// 既存曲はAI一括分類、新規はadmin登録UIで手動指定。piecesList の☆タブ内サブグループ軸。

export const SONG_GENRES = [
  { id: "warabe",  label: "童謡・わらべうた" },
  { id: "shouka",  label: "唱歌・叙情歌" },
  { id: "classic", label: "クラシック名曲" },
  { id: "folk",    label: "世界の民謡" },
  { id: "pops",    label: "映画・アニメ・ポップス" },
] as const

export type SongGenreId = (typeof SONG_GENRES)[number]["id"]

export const SONG_GENRE_IDS: readonly string[] = SONG_GENRES.map((g) => g.id)

const GENRE_LABEL: Record<string, string> = Object.fromEntries(
  SONG_GENRES.map((g) => [g.id, g.label]),
)

export function songGenreLabel(id: string | null | undefined): string {
  return (id && GENRE_LABEL[id]) || "その他"
}

export function isSongGenre(v: string): v is SongGenreId {
  return SONG_GENRE_IDS.includes(v)
}

/** piecesList のサブグループ表示順 (未分類は末尾) */
export const SONG_GENRE_ORDER: readonly string[] = SONG_GENRES.map((g) => g.label)
