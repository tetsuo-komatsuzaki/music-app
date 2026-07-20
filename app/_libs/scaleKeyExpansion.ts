// 音階・アルペジオの「全調自動生成」用のターゲット調リスト (2026-07-20)。
// 長調ソース1つ → 12長調(移調) + 12自然的短調(3,6,7度♭化して移調)。
// keyTonic は DB 表記 (b=♭, #=♯)。Python 側 (analyze_musicxml) が music21 表記へ変換して移調する。

export type ExpandKeyMode = "major" | "natural_minor"
export type KeyTarget = { keyTonic: string; keyMode: ExpandKeyMode; label: string }

// [DB keyTonic, 日本語調名]
const MAJOR: [string, string][] = [
  ["C", "ハ"], ["Db", "変ニ"], ["D", "ニ"], ["Eb", "変ホ"], ["E", "ホ"], ["F", "ヘ"],
  ["F#", "嬰ヘ"], ["G", "ト"], ["Ab", "変イ"], ["A", "イ"], ["Bb", "変ロ"], ["B", "ロ"],
]
const MINOR: [string, string][] = [
  ["A", "イ"], ["Bb", "変ロ"], ["B", "ロ"], ["C", "ハ"], ["C#", "嬰ハ"], ["D", "ニ"],
  ["Eb", "変ホ"], ["E", "ホ"], ["F", "ヘ"], ["F#", "嬰ヘ"], ["G", "ト"], ["G#", "嬰ト"],
]

/** 12長調 + 12自然的短調 = 24ターゲット。 */
export function allKeyTargets(): KeyTarget[] {
  return [
    ...MAJOR.map(([keyTonic, j]) => ({ keyTonic, keyMode: "major" as const, label: `${j}長調` })),
    ...MINOR.map(([keyTonic, j]) => ({ keyTonic, keyMode: "natural_minor" as const, label: `${j}短調` })),
  ]
}
