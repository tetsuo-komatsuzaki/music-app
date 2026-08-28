/**
 * public/violin/ にある実ファイルから、サンプラーが読む音名一覧を生成する (2026-08-27)。
 * 2026-08-28: 強弱3層 (pp/mf/ff) × 奏法 (arco/pizz) の6セット構成に更新。
 *
 * 手で書くと実ファイルとずれる。ずれると Tone.Sampler が 404 を引き、
 * その音だけ無音になる (エラーは出ない)。生成して突き合わせをなくす。
 *
 *   npx tsx scripts/gen_violin_samples.ts
 */
import { readdirSync, writeFileSync, existsSync } from "fs"
import { join } from "path"

const ROOT = "public/violin"
const OUT = "app/_libs/violinSamples.generated.ts"
const NAME = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

function midiOf(note: string): number {
  const m = /^([A-G]#?)(-?\d+)$/.exec(note)
  if (!m) throw new Error(`音名として読めない: ${note}`)
  return NAME.indexOf(m[1]) + 12 * (Number(m[2]) + 1)
}

function collect(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith(".mp3"))
    .map((f) => f.slice(0, -4).replace("s", "#"))
    .sort((a, b) => midiOf(a) - midiOf(b))
}

const report = (label: string, notes: string[]) => {
  if (notes.length === 0) { console.log(`  ${label}: なし`); return }
  const ms = notes.map(midiOf)
  const gaps: string[] = []
  for (let i = 1; i < ms.length; i++) {
    if (ms[i] - ms[i - 1] > 1) gaps.push(`${notes[i - 1]}→${notes[i]}`)
  }
  const maxGap = Math.max(...ms.slice(1).map((v, i) => v - ms[i]))
  console.log(`  ${label}: ${notes.length}音  ${notes[0]}〜${notes[notes.length - 1]}  最大間隔 ${maxGap}半音`)
  console.log(`    半音の抜け ${gaps.length}箇所${gaps.length ? "  " + gaps.join(" ") : ""}`)
}

const TECHS = ["arco", "pizz"] as const
const DYNS = ["pp", "mf", "ff"] as const

console.log("public/violin から生成:")
const sets: Record<string, string[]> = {}
for (const t of TECHS) {
  for (const d of DYNS) {
    const notes = collect(join(ROOT, t, d))
    sets[`${t}_${d}`] = notes
    report(`${t}/${d}`, notes)
  }
}

const body = `// 自動生成。手で編集しない。
// public/violin/{arco,pizz}/{pp,mf,ff}/ の実ファイルから scripts/gen_violin_samples.ts が作る。
// 音源を入れ替えたら再生成すること。
export const SAMPLE_SETS = ${JSON.stringify(sets)} as const
export type SampleSetKey = keyof typeof SAMPLE_SETS
`
writeFileSync(OUT, body)
console.log(`
${OUT} を書き出した`)
