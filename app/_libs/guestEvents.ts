/** ゲストの計測の語彙 (2026-09-06)。use server ファイルからは値を再エクスポートできないので素のモジュールに置く */
export const GUEST_EVENT_KINDS = ["visit", "gate_shown", "gate_signup", "gate_login", "gate_later"] as const
export type GuestEventKind = (typeof GUEST_EVENT_KINDS)[number]
export const GUEST_PLACES = ["home", "returning", "song", "item", "lesson", "karte", "teacher", "upload", "contact", "generic"] as const
export type GuestPlace = (typeof GUEST_PLACES)[number]

export const GUEST_PLACE_LABEL: Record<GuestPlace, string> = {
  home: "ゲストホーム ・ 未登録", returning: "ゲストホーム ・ 前回の画面", song: "曲の詳細", item: "教材の詳細", lesson: "学びのレッスン",
  karte: "成長カルテ", teacher: "先生とのやりとり", upload: "アップロード", contact: "問い合わせ", generic: "ログインが要る画面",
}

/** シートが出た場所を URL から決める */
export function placeOf(path: string): GuestPlace {
  if (path.startsWith("/guest/scores")) return "song"
  if (path.startsWith("/guest/practice")) return "item"
  if (path.startsWith("/guest/lessons")) return "lesson"
  if (path.startsWith("/guest/progress")) return "karte"
  if (path.startsWith("/guest/my-teacher")) return "teacher"
  if (path.startsWith("/guest/library")) return "upload"
  if (path.startsWith("/guest/support")) return "contact"
  return "generic"
}
