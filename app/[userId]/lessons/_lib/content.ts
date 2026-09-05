// 学びレッスン 全23本のコンテンツ定義
//
// 【SSOT 2026-07-14】文言・図解パラメータ・分類は lessonData.v1_0.json
// (教材データJSON v1.0 = プロトタイプv3.18からの機械抽出・Tetsuo確定値) を
// プログラム的に参照する。転記・丸め・再解釈は禁止 (実装指示書v1.2 §0-2)。
// 検証: scripts/verify-lesson-content.ts が JSON との全文一致を保証する。
//
// タグ対応 (このファイルのみのアプリ側管理):
//   technique = TechniqueTag.name / position = "2".."6"(6=6th以上) / double_stop = FeatureTag.name
// 対応する教材 (PracticeItem category=lesson) はこのタグが張られたものを実行時に解決する。
// レッスン名やIDをtagKeyに使わないこと (正本はこの対応表のみ)。

import type { BowFigOpts, FbFigOpts } from "./figures"
import lessonData from "./lessonData.v1_0.json"

export type LessonCat = "bow" | "left" | "both"

export const CATS = lessonData.categories as Record<
  LessonCat,
  { label: string; theme: string; light: string }
>

export type LessonTag = {
  tagType: "technique" | "position" | "double_stop"
  tagKey: string
}

export type Lesson = {
  id: string
  name: string
  cat: LessonCat
  tag: LessonTag
  figType: "bow" | "fb"
  /** スライド2,3,4 の図解パラメータ (JSON確定値) */
  figs: [BowFigOpts | FbFigOpts, BowFigOpts | FbFigOpts, BowFigOpts | FbFigOpts]
  /** [①これは何 ②体の使い方 ③よくある間違い ④コツ ⑤成功の感覚] (<b>タグ可・JSON確定値) */
  texts: [string, string, string, string, string]
  /** 各スライドの用語ラベル (JSON確定値) */
  terms: [string, string, string, string, string]
}

const tech = (key: string): LessonTag => ({ tagType: "technique", tagKey: key })
const pos = (key: string): LessonTag => ({ tagType: "position", tagKey: key })
const ds = (key: string): LessonTag => ({ tagType: "double_stop", tagKey: key })

/** レッスンid → 習得タグ (2026-07-14 用語改定済みの正本) */
const TAG_MAP: Record<string, LessonTag> = {
  staccato: tech("スタッカート"),
  bow_staccato: tech("連続スピッカート"), // 旧称ボウ・スタッカート
  spiccato: tech("スピッカート"),
  ricochet: tech("リコシェ"),
  tremolo: tech("トレモロ"),
  portato: tech("ポルタート"),
  vibrato: tech("ビブラート"),
  trill: tech("トリル"),
  mordent: tech("プラルトリラーとモルデント"), // 旧称モルデント
  glissando: tech("グリッサンド"),
  harmonics: tech("ナチュラル・ハーモニクス"),
  slur: tech("スラー"),
  pizzicato: tech("ピチカート"),
  pos2: pos("2"),
  pos3: pos("3"),
  pos4: pos("4"),
  pos5: pos("5"),
  pos6: pos("6"), // 6=6thポジション以上 (確定#8)
  ds3: ds("3度"),
  ds6: ds("6度"),
  ds8: ds("オクターブ"),
  ds10: ds("10度"),
  ds_seq: ds("連続重音"),
}

export const LESSONS: Lesson[] = lessonData.lessons.map((l) => {
  const tag = TAG_MAP[l.id]
  if (!tag) throw new Error(`lesson ${l.id} のタグ対応が未定義です (content.ts TAG_MAP)`)
  return {
    id: l.id,
    name: l.name,
    cat: l.cat as LessonCat,
    tag,
    figType: l.figType as "bow" | "fb",
    figs: l.figs as Lesson["figs"],
    texts: l.texts as Lesson["texts"],
    terms: l.terms as Lesson["terms"],
  }
})

export const LESSON_BY_ID = new Map(LESSONS.map((l) => [l.id, l]))
export const LESSON_TOTAL = LESSONS.length // 23

// ── 譜面(lessonScores)の運指参照 (指番号・弦の補筆用) ──
type LessonScoreNote = { r?: number; fg?: string; p?: [string, number, number] }
const LESSON_SCORES = lessonData.lessonScores as unknown as Record<
  string,
  { m: LessonScoreNote[][] }
>

/** A線・1stポジションの標準運指 (シフト前の音符に付与)。開放弦=0 */
const FIRST_POS_A: Record<string, string> = {
  A4: "0", B4: "1", C5: "2", D5: "3", E5: "4",
}

/** レッスン譜面から休符を除いた「音符順の指番号」配列を返す。
 *  LessonScoreCard の collectNotes と同じ音符順。
 *  - fg があればそれ (ポジション移動後の運指)
 *  - 無ければ A線・1stポジションの標準運指を音高から導出 (移動前の音符)
 *  - どちらも無ければ undefined */
export function lessonFingerNumbers(id: string): (string | undefined)[] {
  const s = LESSON_SCORES[id]
  if (!s) return []
  const out: (string | undefined)[] = []
  for (const measure of s.m) for (const n of measure) {
    if (n.r) continue
    if (n.fg) { out.push(n.fg); continue }
    const key = n.p ? `${n.p[0]}${n.p[1]}` : ""
    out.push(FIRST_POS_A[key])
  }
  return out
}

/** 3回いっしょに弾こう画面の掛け声 (クリアまで固定3種) */
export const FEEDBACK = (name: string): [string, string, string] => [
  `いいね!${name}の感覚、つかめてきた?`,
  "その調子!だんだん形になってきたよ",
  "3回目、いこう。力を抜いて、ていねいに",
]

/** タグ→レッスンの逆引き (曲詳細の誘導などで使用) */
export const LESSON_BY_TAG = new Map(
  LESSONS.map((l) => [`${l.tag.tagType}:${l.tag.tagKey}`, l]),
)
