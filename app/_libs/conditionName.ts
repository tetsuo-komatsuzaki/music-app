/**
 * conditionName.ts — 条件の表示名 (ノート属性ストア 2026-09-05)。
 *
 * 課題カタログの箱をやめたので、ユーザーに見せる言葉は「属性を絞る条件」に付けた表示名になる。
 * 定義はここ1か所。音名はカナ・♯♭は付ける・オクターブは同じ音名の移動だけ添える (Tetsuo確定)。
 */
import { kanaNote } from "./growthKarte"

/** 奏法13種 ・ 列の接尾辞 → 表示名 */
export const TECH_LABELS: Record<string, string> = {
  slur: "スラー",
  portato: "ポルタート",
  staccato: "スタッカート",
  bow_staccato: "ボウ・スタッカート",
  spiccato: "スピッカート",
  ricochet: "リコシェ",
  pizzicato: "ピチカート",
  tremolo: "トレモロ",
  vibrato: "ビブラート",
  trill: "トリル",
  mordent: "モルデント",
  glissando: "グリッサンド",
  harmonic: "ナチュラル・ハーモニクス",
}

function letterOf(pitch: string): string {
  return pitch.replace(/\d+$/, "")
}
function octaveOf(pitch: string): number | null {
  const m = /(\d+)$/.exec(pitch)
  return m ? parseInt(m[1], 10) : null
}

/** "G4" → "ソ"。同じ音名で高さだけ違う相手がいるときは「高いソ」「低いソ」 */
export function pitchLabel(pitch: string, relativeTo?: string): string {
  const base = kanaNote(pitch)
  if (relativeTo && letterOf(relativeTo) === letterOf(pitch)) {
    const a = octaveOf(pitch)
    const b = octaveOf(relativeTo)
    if (a !== null && b !== null && a !== b) return a > b ? `高い${base}` : `低い${base}`
  }
  return base
}

/** 音程タブ ・ 「ソ→ド の移動」。同じ音名なら行き先だけに「高い/低い」を添える ・ 「ソ→高いソ」 */
export function movementLabel(prev: string, cur: string): string {
  return `${kanaNote(prev)}→${pitchLabel(cur, prev)} の移動`
}

/** フィンガリングタブ ・ 「ソ→ラ の速い切り替え」 */
export function fastSwitchLabel(prev: string, cur: string): string {
  return `${kanaNote(prev)}→${pitchLabel(cur, prev)} の速い切り替え`
}

/** ポジション移動タブ ・ 「左手を第1から第3ポジションへ移す」 ・ いまの文言のまま */
export function positionMoveLabel(from: number, to: number): string {
  const f = from >= 5 ? "第5以上" : `第${from}`
  const t = to >= 5 ? "第5以上" : `第${to}`
  return `左手を${f}から${t}ポジションへ移す`
}

/** わざタブ ・ 「スラーのところ」 ・ いまの文言のまま */
export function techniqueLabel(tech: string): string {
  return `${TECH_LABELS[tech] ?? tech}のところ`
}
