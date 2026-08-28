/**
 * お手本の音 (2026-08-27 新設 / 2026-08-28 強弱3層に改修)。
 *
 * 音源: University of Iowa Electronic Music Studios / Musical Instrument Samples
 *       Violin (無響室録音)。arco / pizzicato とも pp・mf・ff の3強度を収録。
 *       「1997年以来自由に公開しており、いかなるプロジェクトにも制限なく使用できる」
 *       https://theremin.music.uiowa.edu/MIS.html
 *
 * 強弱 (2026-08-28 Tetsuo確定):
 *   楽譜に強弱記号があれば、その強さの層の音源を使う。無ければ mf。
 *   以前は pp/mf/ff を混ぜて1セットにしていたため、隣の半音で最大27.6dBの
 *   音量段差が出ていた (実測)。層を分ければ段差は録音自体の自然なばらつきだけになる。
 *
 * 長さ (2026-08-28): 一律2.6秒への切り詰めを廃止し、元の演奏の全長を使う。
 *   ゆっくりの曲の長い音符でも音が先に尽きない。
 *
 * 層の中の抜け: 埋めない。Tone.Sampler が同じ層の最寄りの音からピッチシフトで
 *   補う。別の強さの録音を混ぜるより自然 (混在が今回の不具合の原因)。
 *
 * ファイル名は # が使えないので s に置き換えてある (C#4 → Cs4.mp3)。
 * 生成: scratchpad/violin/split3.py → scripts/gen_violin_samples.ts で一覧再生成。
 */
import * as Tone from "tone"
import { SAMPLE_SETS } from "./violinSamples.generated"

export type Technique = "arco" | "pizz"
export type DynLayer = "pp" | "mf" | "ff"

/** 楽譜の強弱記号 → 使う層。無指定・不明は mf (2026-08-28 Tetsuo確定) */
export function dynamicToLayer(dyn: string | null | undefined): DynLayer {
  const d = (dyn ?? "").toLowerCase()
  if (/^p+$/.test(d)) return "pp"            // p, pp, ppp...
  if (/^f+$|^s?fz$|^sffz$|^rfz?$/.test(d)) return "ff" // f, ff, fz, sfz...
  return "mf"                                 // mp, mf, 指定なし, その他
}

const setKey = (tech: Technique, layer: DynLayer) => `${tech}_${layer}` as const

/** その層に音があるか。空の層は mf → もう片方の順で代替する */
function resolveLayer(tech: Technique, layer: DynLayer): DynLayer {
  const order: DynLayer[] = layer === "mf" ? ["mf", "ff", "pp"]
    : layer === "pp" ? ["pp", "mf", "ff"] : ["ff", "mf", "pp"]
  for (const l of order) {
    if ((SAMPLE_SETS[setKey(tech, l)] ?? []).length > 0) return l
  }
  return "mf"
}

const fileOf = (note: string) => `${note.replace("#", "s")}.mp3`

const loaded = new Map<string, Tone.Sampler>()
const loading = new Map<string, Promise<Tone.Sampler>>()

/**
 * サンプラーを用意する。読み込みは 奏法×層 ごとに1回だけ。
 * 呼び出し側は必ず await してから鳴らすこと (未読み込みだと無音になる)。
 */
export function getViolin(tech: Technique = "arco", layer: DynLayer = "mf"): Promise<Tone.Sampler> {
  const l = resolveLayer(tech, layer)
  const key = setKey(tech, l)
  const done = loaded.get(key)
  if (done) return Promise.resolve(done)
  const inFlight = loading.get(key)
  if (inFlight) return inFlight

  const p = new Promise<Tone.Sampler>((resolve, reject) => {
    const notes = SAMPLE_SETS[key] ?? []
    const urls: Record<string, string> = {}
    for (const n of notes) urls[n] = fileOf(n)

    const s = new Tone.Sampler({
      urls,
      baseUrl: `/violin/${tech}/${l}/`,
      // 弓を離したあとの余韻。切れると機械的に聞こえる。pizz は自然減衰なので短く
      release: tech === "pizz" ? 0.3 : 0.6,
      onload: () => { loaded.set(key, s); resolve(s) },
      onerror: (e) => { loading.delete(key); reject(e) },
    }).toDestination()
    s.volume.value = -4
  })
  loading.set(key, p)
  return p
}

/** 鳴っている音を止める。共有インスタンスなので dispose はしない */
export function releaseViolin(): void {
  for (const s of loaded.values()) {
    try { s.releaseAll() } catch { /* noop */ }
  }
}

/** MIDI番号 → Tone が解釈できる音名 (例: 69 → "A4") */
export function midiToNoteName(midi: number): string {
  return Tone.Frequency(midi, "midi").toNote()
}

/** 楽譜の音符から読み取る、鳴らし方に関わる情報 */
export type NoteArticulation = {
  articulations?: string[] | null
  is_tremolo?: boolean | null
  is_trill?: boolean | null
  is_mordent?: boolean | null
  /** その音に効いている強弱 (記号の位置から持ち越した値)。無ければ mf */
  dynamic?: string | null
}

/** その音を鳴らすのに使う音源 */
export function techniqueOf(n: NoteArticulation | null | undefined): Technique {
  const a = n?.articulations ?? []
  return a.includes("pizzicato") || a.includes("pizz") ? "pizz" : "arco"
}

/**
 * 音符の長さに対して、実際に音を出す割合。
 * 短い奏法は弓を止めるので、次の音との間に隙間ができる。
 */
function sustainRatio(n: NoteArticulation | null | undefined): number {
  const a = n?.articulations ?? []
  if (a.includes("spiccato")) return 0.35   // 弓を弾ませる。最も短い
  if (a.includes("staccato")) return 0.45   // 弓を止めて切る
  if (a.includes("martele")) return 0.55    // 強いアタックで切る
  if (a.includes("portato")) return 0.75    // 1弓で軽く分ける
  if (a.includes("legato")) return 1.0      // なめらかに繋ぐ。隙間なし
  return 0.92                                // 指定なし。わずかに隙間
}

/** その音の強さの微調整。強弱の主役は層の選択で、こちらは奏法の性格づけのみ */
function velocityOf(n: NoteArticulation | null | undefined): number {
  const a = n?.articulations ?? []
  if (a.includes("martele")) return 1.0     // 強いアタック
  if (a.includes("spiccato")) return 0.92
  if (a.includes("staccato")) return 0.9
  return 0.85
}

/**
 * 音符を1つ鳴らす。強弱で層を選び、奏法に応じて長さ・刻みを決める。
 *
 * @param note    Tone が解釈する音名 (例 "A4") か周波数
 * @param durSec  楽譜上の長さ (秒)
 * @param atSec   鳴らし始める時刻 (Tone の時計)
 * @param art     楽譜から読んだ奏法・強弱の情報
 * @param nextNote トリル・モルデントで交互に鳴らす相手 (無ければ2半音上を使う)
 */
export async function playNote(
  note: string | number,
  durSec: number,
  atSec: number,
  art?: NoteArticulation | null,
  nextNote?: string | null,
): Promise<void> {
  const tech = techniqueOf(art)
  const layer = dynamicToLayer(art?.dynamic)
  const s = await getViolin(tech, layer)
  const vel = velocityOf(art)

  // トレモロ: 同じ音を高速に刻む。1秒あたり10回前後が実際の速さ
  if (art?.is_tremolo) {
    const step = 0.1
    for (let t = 0; t < durSec - 0.02; t += step) {
      s.triggerAttackRelease(note, Math.min(step * 0.85, durSec - t), atSec + t, vel)
    }
    return
  }

  // トリル・モルデント: 本来の音と隣の音を素早く交互に
  if (art?.is_trill || art?.is_mordent) {
    const other = nextNote ?? Tone.Frequency(note as string).transpose(2).toNote()
    const step = art.is_mordent ? 0.075 : 0.085
    // モルデントは頭で1往復するだけ。トリルは音符の間ずっと
    const span = art.is_mordent ? Math.min(durSec, step * 3) : durSec
    let i = 0
    for (let t = 0; t < span - 0.01; t += step, i++) {
      const nt = i % 2 === 0 ? note : other
      s.triggerAttackRelease(nt, Math.min(step * 0.9, span - t), atSec + t, vel)
    }
    // モルデントの残りは本来の音を伸ばす
    if (art.is_mordent && durSec > span) {
      s.triggerAttackRelease(note, durSec - span, atSec + span, vel)
    }
    return
  }

  const dur = Math.max(0.08, durSec * sustainRatio(art))
  s.triggerAttackRelease(note, dur, atSec, vel)
}

/** 使う 奏法×層 の音源をまとめて読み込む。再生前に呼ぶと途中で無音にならない */
export async function preloadFor(notes: NoteArticulation[]): Promise<void> {
  const keys = new Map<string, [Technique, DynLayer]>()
  keys.set("arco_mf", ["arco", "mf"])   // 既定は常に用意
  for (const n of notes) {
    const t = techniqueOf(n)
    const l = dynamicToLayer(n.dynamic)
    keys.set(`${t}_${l}`, [t, l])
  }
  await Promise.all([...keys.values()].map(([t, l]) => getViolin(t, l)))
}
