// ホーム「あなた専用のおすすめ練習」の型とラベル (2026-09-04)。
// 表示 (PersonalRecoCard) とエンジン (personalReco) の両方から読むため、
// CSS を持たない素のモジュールに置く。スクリプトからも import できるようにするため。

/** タブの分類。記録の分析 / わざの詳細 と同じ切り口に揃える */
export type RecoCategory = "pitch" | "position" | "technique" | "fingering"

export const RECO_TAB_LABELS: Record<RecoCategory, string> = {
  pitch: "音程",
  position: "ポジション移動",
  technique: "わざ",
  fingering: "フィンガリング",
}

/** タブごとの一言。見出しの下に1行だけ出す */
export const RECO_TAB_NOTES: Record<RecoCategory, string> = {
  pitch: "音の高さがずれやすいところに効く練習",
  position: "左手を動かしたあとの音に効く練習",
  technique: "スラーやスタッカートなどのわざに効く練習",
  fingering: "指を切り替える時間が短い音に効く練習",
}

export type RecoMaterial = {
  id: string
  title: string
  /** practice のカテゴリ (scale / arpeggio / etude / bowing / fingering / doublestop) */
  category: string
  star: number | null
  keyTonic: string
  keyMode: string
}

export type RecoTab = {
  key: RecoCategory
  /** いま一番効く課題。null = 判定できる音がまだ足りない */
  focus: { name: string; successPct: number } | null
  /** おすすめ教材。空 = 課題は出たが在庫が無い */
  materials: RecoMaterial[]
  /** このタブの課題がどれも低い。一点を指さず基礎として案内する (2026-09-04 Tetsuo) */
  basics: boolean
}

export type PersonalReco = {
  tabs: RecoTab[]
}
