/**
 * お手本の音 (2026-08-27)。
 *
 * 従来は3箇所がそれぞれ勝手に音を作っていた。
 *   曲画面のお手本    Tone.Synth (sawtooth) + Vibrato
 *   レッスンのお手本  生の OscillatorNode (triangle) を1本
 * 波形1つでは倍音も弓の立ち上がりも胴の響きも無く、機械音の域を出なかった。
 * 実際のバイオリンを録音したサンプルに差し替え、ここに1本化する。
 *
 * 音源: University of Iowa Electronic Music Studios / Musical Instrument Samples
 *       Violin (無響室録音)。arco と pizzicato の両方。
 *       「1997年以来自由に公開しており、いかなるプロジェクトにも制限なく使用できる」
 *       https://theremin.music.uiowa.edu/MIS.html
 *
 * 音域: バイオリンの最低音は G3 (開放G弦)。それより低い音は楽器として出せない。
 *       最高音は実用上 C8 前後。Iowa は G3〜B7 を収録しており、
 *       最低音は一致、最高音も実用域をほぼ網羅する。
 *       教材の音域に合わせるのではなく、楽器の全音域を持たせている。
 *
 * 加工: pp / mf / ff の3段階すべてを材料にし、同じ音が複数あれば品質の良いものを採る。
 *       (mf 単独では高音域に抜けが出た。強さの差より抜けが無いことを優先)
 *       ファイル名の音域表記は信用せず、切り出した音の高さを YIN で実測して命名。
 *       arco は2.6秒、pizz は減衰音なので1.6秒で切り、末尾をフェード、mono 64kbps。
 *       生成スクリプトは scratchpad/violin/split2.py。
 *
 * 奏法: 音源があるのは arco と pizzicato だけ。
 *       トリル・トレモロ・モルデントは音源ではなく「鳴らし方」で作れる
 *       (2音を素早く交互に鳴らす / 同じ音を高速に繰り返す)。
 *       ハーモニクスとグリッサンドは録音が無く、実音で代替する。
 *
 * ファイル名は # が使えないので s に置き換えてある (C#4 → Cs4.mp3)。
 * 読み込みは初回の再生時だけ。奏法ごとに別々に読み込む。
 */
import * as Tone from "tone"
import { ARCO_NOTES, PIZZ_NOTES } from "./violinSamples.generated"

export type Technique = "arco" | "pizz"

/**
 * public/violin/{奏法}/ にある音。
 * 手で書くと実ファイルとずれ、その音だけ無音になる (404 はエラーにならない)。
 * scripts/gen_violin_samples.ts が実ファイルから生成する。音源を入れ替えたら再生成する。
 */
export const SAMPLE_NOTES: Record<Technique, readonly string[]> = {
  arco: ARCO_NOTES,
  pizz: PIZZ_NOTES,
}

/** その奏法のサンプルがある音域か。外れる音は arco で代替する */
export function inRange(tech: Technique, noteName: string): boolean {
  const list = SAMPLE_NOTES[tech]
  if (list.length === 0) return false
  const midi = Tone.Frequency(noteName).toMidi()
  return midi >= Tone.Frequency(list[0]).toMidi()
    && midi <= Tone.Frequency(list[list.length - 1]).toMidi()
}

/** ファイル名は # を s にしてある */
const fileOf = (note: string) => `${note.replace("#", "s")}.mp3`

const loaded: Partial<Record<Technique, Tone.Sampler>> = {}
const loading: Partial<Record<Technique, Promise<Tone.Sampler>>> = {}

/**
 * サンプラーを用意する。何度呼んでも読み込みは奏法ごとに1回だけ。
 * 呼び出し側は必ず await してから鳴らすこと (未読み込みだと無音になる)。
 */
export function getViolin(tech: Technique = "arco"): Promise<Tone.Sampler> {
  const done = loaded[tech]
  if (done) return Promise.resolve(done)
  const inFlight = loading[tech]
  if (inFlight) return inFlight

  const p = new Promise<Tone.Sampler>((resolve, reject) => {
    const notes = SAMPLE_NOTES[tech]
    const urls: Record<string, string> = {}
    for (const n of notes) urls[n] = fileOf(n)

    const s = new Tone.Sampler({
      urls,
      baseUrl: tech === "arco" ? "/violin/" : `/violin/${tech}/`,
      // 弓を離したあとの余韻。切れると機械的に聞こえる。pizz は自然に減衰するので短く
      release: tech === "pizz" ? 0.3 : 0.6,
      onload: () => { loaded[tech] = s; resolve(s) },
      onerror: (e) => { delete loading[tech]; reject(e) },
    }).toDestination()
    s.volume.value = -4
  })
  loading[tech] = p
  return p
}

/** 鳴っている音を止める。共有インスタンスなので dispose はしない */
export function releaseViolin(): void {
  for (const s of Object.values(loaded)) {
    try { s?.releaseAll() } catch { /* noop */ }
  }
}

/** MIDI番号 → Tone が解釈できる音名 (例: 69 → "A4") */
export function midiToNoteName(midi: number): string {
  return Tone.Frequency(midi, "midi").toNote()
}

/* ────────────────────────────────────────────────────────────
   奏法ごとの鳴らし方 (2026-08-27)

   専用の録音があるのは arco と pizzicato だけ。他は arco の鳴らし方で作る。
   スピッカート専用の録音 (VSCO 2 CE) も存在するが、15音・最大4半音間隔・
   上限 C6 で、arco (54音・抜け0・C8まで) より質が落ちるため採らない。
   4半音ずれた音を引き伸ばすと「その音だけ変」になる。
   ──────────────────────────────────────────────────────────── */

/** 楽譜の音符から読み取る、鳴らし方に関わる情報 */
export type NoteArticulation = {
  articulations?: string[] | null
  is_tremolo?: boolean | null
  is_trill?: boolean | null
  is_mordent?: boolean | null
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

/** その音の強さ。0〜1 */
function velocityOf(n: NoteArticulation | null | undefined): number {
  const a = n?.articulations ?? []
  if (a.includes("martele")) return 1.0     // 強いアタック
  if (a.includes("spiccato")) return 0.85
  if (a.includes("staccato")) return 0.8
  return 0.72
}

/**
 * 音符を1つ鳴らす。奏法に応じて長さ・強さ・刻みを決める。
 *
 * @param note    Tone が解釈する音名 (例 "A4") か周波数
 * @param durSec  楽譜上の長さ (秒)
 * @param atSec   鳴らし始める時刻 (Tone の時計)
 * @param art     楽譜から読んだ奏法の情報
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
  const s = await getViolin(tech)
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

/** 使う奏法の音源をまとめて読み込む。再生前に呼ぶと途中で無音にならない */
export async function preloadFor(notes: NoteArticulation[]): Promise<void> {
  const set = new Set<Technique>(["arco"])
  for (const n of notes) set.add(techniqueOf(n))
  await Promise.all([...set].map((t) => getViolin(t)))
}
