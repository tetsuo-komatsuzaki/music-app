/**
 * 教材カバー画像の生成プロンプト組み立て（FLUX.1 向けに厳密設計）。
 *
 * 【設計根拠 — Black Forest Labs 公式ガイド他】
 *  - FLUX はネガティブプロンプト非対応 → 望む結果を肯定文で描く（"wordless / purely pictorial"）。
 *  - タグ羅列より自然文（情景描写）。語数は中(30-80)〜長を推奨。
 *  - 棚全体の一貫性 = ①固定スタイル記述 ②固定パレット ③seed。
 *
 * 【この版の作り込み（カテゴリ別・季節・年代）】
 *  - カテゴリごとに情景を複数用意し、教材ごとに **決定的に** 選ぶ（同一教材=同一絵/別教材=別絵）。
 *  - 季節: 指定が無ければ教材ハッシュで四季を割り当て → 光・色調に反映（棚に変化）。
 *  - 年代: 作曲者名(カタカナ/英語) → 時代を自動判定し、舞台・空気感に反映（曲のみ）。
 *  - 統一感はスタイル＋パレット固定で担保。変化するのは情景/季節/年代のみ。
 *
 * ⚠️ 日本語の題名/作曲者は呪文本文に埋めない（FLUXが文字を崩す）。年代判定にのみ内部利用。
 */

/* ============================================================
   固定要素（棚全体の統一感。安易に変えない）
   ============================================================ */
const STYLE_ANCHOR =
  "Rendered as a cohesive fine-art illustration in a blended impressionist watercolor and gouache style, " +
  "with delicate visible brushwork, soft feathered edges and a subtle paper grain, " +
  "in the refined manner of elegant early-twentieth-century European concert-poster art."

const PALETTE =
  "The colour palette is restrained and harmonious: warm ivory cream, muted terracotta, " +
  "soft sage green, dusty slate blue and touches of antique gold."

const CLEAN =
  "The picture is entirely wordless and purely pictorial — a single quiet, tasteful scene, " +
  "with a balanced centred composition and gentle painterly negative space."

/* ============================================================
   季節（光と色調。指定なければ教材ごとに決定的に割り当て）
   ============================================================ */
export type Season = "spring" | "summer" | "autumn" | "winter"
const SEASON_ORDER: Season[] = ["spring", "summer", "autumn", "winter"]
const SEASONS: Record<Season, string> = {
  spring: "bathed in soft spring light with hints of pale blossom and fresh new green",
  summer: "in warm, luminous summer light with lush greenery and a clear bright sky",
  autumn: "in golden autumn light with amber and russet tones and a few drifting leaves",
  winter: "in cool, still winter light with soft snow and long delicate shadows",
}

/* ============================================================
   年代（舞台・空気感。作曲者から自動判定。基礎練は無し）
   ============================================================ */
export type Era = "baroque" | "classical" | "romantic" | "impressionist" | "modern"
const ERAS: Record<Era, string> = {
  baroque: "with an ornate baroque sensibility of carved wood, candlelight and rich draperies",
  classical: "with poised classical-era elegance of clean lines, marble and restrained ornament",
  romantic: "with a romantic-era mood of moonlight, misty landscapes and expressive warmth",
  impressionist: "with an impressionist sensibility of shimmering light and loose luminous colour",
  modern: "with a quietly modern simplicity of airy space and understated forms",
}

// 作曲者名(カタカナ/英語 部分一致・小文字) → 年代。代表的なヴァイオリン作曲家のみ。
const COMPOSER_ERA: [RegExp, Era][] = [
  [/bach|バッハ|vivaldi|ヴィヴァルディ|ビバルディ|handel|ヘンデル|corelli|コレッリ|telemann/i, "baroque"],
  [/mozart|モーツァルト|haydn|ハイドン|clementi|クレメンティ/i, "classical"],
  [/beethoven|ベートーヴェン|ベートーベン/i, "classical"],
  [/mendelssohn|メンデルスゾーン|schubert|シューベルト|brahms|ブラームス|tchaikovsky|チャイコフスキー|schumann|シューマン|chopin|ショパン|dvorak|ドヴォルザーク|wieniawski|ヴィエニャフスキ|paganini|パガニーニ|kreisler|クライスラー|sarasate|サラサーテ/i, "romantic"],
  [/debussy|ドビュッシー|ravel|ラヴェル|fauré|faure|フォーレ|satie|サティ/i, "impressionist"],
  [/bartok|バルトーク|prokofiev|プロコフィエフ|shostakovich|ショスタコーヴィチ|stravinsky|ストラヴィンスキー/i, "modern"],
]

function eraFromComposer(composer: string | null | undefined): Era | null {
  if (!composer) return null
  for (const [re, era] of COMPOSER_ERA) if (re.test(composer)) return era
  return null
}

/* ============================================================
   情緒（長短）
   ============================================================ */
function moodFor(keyMode: string | null | undefined): string {
  if (keyMode === "minor")
    return "The mood is introspective and softly dramatic, wrapped in cool shadow with candle-warm highlights."
  if (keyMode === "major")
    return "The mood is bright, warm and quietly hopeful."
  return "The mood is calm, elegant and contemplative."
}

/* ============================================================
   カテゴリ別の情景（各カテゴリに複数バリエーション）
   ============================================================ */
type Cat = "scale" | "etude" | "piece" | "other"
function normalizeCat(category: string | null | undefined): Cat {
  switch (category) {
    case "scale": case "scales": case "arpeggio": case "arpeggios": return "scale"
    case "etude": case "etudes": return "etude"
    case "piece": case "pieces": return "piece"
    default: return "other"
  }
}

const SCENES: Record<Cat, string[]> = {
  scale: [
    "luminous ribbons and slender arcs of light drifting gracefully upward across a soft misty field, suggesting the smooth sweep of an ascending musical line",
    "a gentle staircase of glowing light rising through pale mist, like a run of notes climbing higher",
    "softly curving streams of colour sweeping upward and curling back, evoking a fluent scale in motion",
  ],
  etude: [
    "a single violin and its bow resting on an antique carved wooden music stand beside a softly draped cloth, in a calm light-filled practice room",
    "a violin resting on the sill of an open window, sheer curtains stirring, a quiet corner devoted to daily practice",
    "a worn étude book open on a small wooden desk with a violin laid beside it, in a peaceful study",
  ],
  piece: [
    "an evocative, dreamlike landscape that mirrors the emotion of the music, with distant rolling hills and still reflective water",
    "a tranquil vista of a quiet lake and far mountains at gentle dusk, poetic and atmospheric",
    "a lyrical scene of a winding path through soft meadows toward a luminous horizon",
  ],
  other: [
    "a poised violin encircled by softly flowing abstract musical forms and gentle streams of light",
    "a graceful still life of a violin, bow and a single flower in a calm, luminous setting",
  ],
}

/* 教材ごとに決定的な選択をするためのハッシュ */
function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}
// ⚠️ seed は負になり得る(seed>>5 等)。負インデックスで undefined にならないよう正規化する。
function pick<T>(arr: T[], seed: number): T { return arr[((seed % arr.length) + arr.length) % arr.length] }

const isAscii = (s: string) => /^[\x20-\x7E]+$/.test(s)

export interface CoverPromptInput {
  title?: string | null
  composer?: string | null
  category?: string | null
  keyMode?: string | null
  /** 任意: 英語テーマ語（例 "a moonlit summer forest"）。あれば情景に上書き反映 */
  themeHint?: string | null
  /** 任意: 季節を明示。無ければ教材ごとに決定的に割り当て */
  season?: Season | null
  /** 任意: 年代を明示。無ければ作曲者から自動判定（曲のみ） */
  era?: Era | null
}

/** 教材メタから 1:1 カバー用の自然文プロンプトを生成する */
export function buildCoverPrompt(m: CoverPromptInput): string {
  const cat = normalizeCat(m.category)
  const seed = hash(`${m.title ?? ""}|${m.category ?? ""}|${m.composer ?? ""}`)

  // 情景: themeHint 最優先、無ければカテゴリ別バリエーションから決定的に選ぶ
  const scene = m.themeHint && m.themeHint.trim()
    ? `a fine painterly scene that subtly evokes ${m.themeHint.trim()}`
    : pick(SCENES[cat], seed)

  // 季節: 指定 → それ。無ければ教材ハッシュで割り当て
  const season = m.season ?? pick(SEASON_ORDER, seed >> 5)

  // 年代: 曲のみ。指定 → それ。無ければ作曲者から自動判定
  const era: Era | null = cat === "piece" ? (m.era ?? eraFromComposer(m.composer)) : m.era ?? null

  const parts: string[] = [
    `A refined square album cover for a classical violin work: ${scene}, ${SEASONS[season]}.`,
  ]
  if (era) parts.push(`The setting is imbued ${ERAS[era]}.`)
  // 英字作曲者は雰囲気づけに（日本語は使わない）
  if (!m.themeHint && m.composer && isAscii(m.composer)) {
    parts.push(`Painted in the expressive spirit of ${m.composer}.`)
  }
  parts.push(STYLE_ANCHOR, PALETTE, moodFor(m.keyMode), CLEAN,
    "1:1 square aspect ratio, high level of fine painterly detail.")

  return parts.join(" ")
}
