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

/** わざタブ ・ 音の高さつきなら「スラーのソ」(2026-09-05 Tetsuo: わざ+音の高さ)、無ければ「スラーのところ」 */
export function techniqueLabel(tech: string, pitch?: string): string {
  const name = TECH_LABELS[tech] ?? tech
  return pitch ? `${name}の${kanaNote(pitch)}` : `${name}のところ`
}

// ── 条件の名前 (成長1行・成長カルテが読む派生サマリのID) → 表示名 ──
// 旧 課題カタログの名前をそのまま引き継ぐ。箱としては保存しない (段5・2026-09-05)。
// null = 表示しない条件: 同じポジションの中 (変化なし)、2026-09-04 に削除した 順次/弦とばし/全2分4分音符
const INTERVAL_LABELS: Record<string, string> = {
  same_up_leap: "同じ弦で高い音へ大きく跳ぶ", same_down_leap: "同じ弦で低い音へ大きく跳ぶ",
  adj_up_leap: "となりの弦に移って高い音へ大きく跳ぶ", adj_down_leap: "となりの弦に移って低い音へ大きく跳ぶ",
  unison_crossing: "弦を移っても同じ高さの音を弾く",
}
const VALUE_LABELS: Record<string, string> = {
  eighth: "8分音符のリズム", "16th": "16分音符のリズム", "32nd_plus": "32分音符以上のリズム", dotted: "付点音符のリズム",
}
const TUPLET_LABELS: Record<string, string> = { "3": "三連符のリズム", "5": "五連符のリズム", "6": "六連符のリズム", "7plus": "七連符以上のリズム" }
const REST_LEN: Record<string, string> = { short: "短い", mid: "中くらいの", long: "長い" }
const BEAT: Record<string, string> = { onbeat: "拍の頭から入る", offbeat: "拍の裏から入る" }
const DOUBLE_KIND: Record<string, string> = { third: "3度", fourth: "4度", fifth: "5度", sixth: "6度", octave: "オクターブ", other: "その他" }

export function conditionLabel(id: string): string | null {
  const m = /^(pitch|rhythm)_(.+)$/.exec(id)
  if (!m) return null
  const body = m[2]
  let mm: RegExpExecArray | null
  if ((mm = /^posshift_([0-9]+|5plus)_([0-9]+|5plus)$/.exec(body))) {
    if (mm[1] === mm[2]) return null
    const n = (t: string) => (t === "5plus" ? 5 : parseInt(t, 10))
    return positionMoveLabel(n(mm[1]), n(mm[2]))
  }
  if ((mm = /^tech_(.+)$/.exec(body))) return techniqueLabel(mm[1])
  if ((mm = /^interval_(.+)$/.exec(body))) return INTERVAL_LABELS[mm[1]] ?? null
  if ((mm = /^value_(.+)$/.exec(body))) return VALUE_LABELS[mm[1]] ?? null
  if ((mm = /^tuplet_(.+)$/.exec(body))) return TUPLET_LABELS[mm[1]] ?? null
  if ((mm = /^entry_(short|mid|long)_(onbeat|offbeat)$/.exec(body))) return `${REST_LEN[mm[1]]}休みのあと、${BEAT[mm[2]]}`
  if ((mm = /^double_([a-z]+)_(single|cont)$/.exec(body))) {
    const k = DOUBLE_KIND[mm[1]]
    if (!k) return null
    return mm[2] === "cont" ? `${k}の重音を続けて弾く` : `${k}の重音を弾く`
  }
  return null
}
