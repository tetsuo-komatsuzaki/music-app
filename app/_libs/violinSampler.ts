/**
 * お手本の音 (2026-08-27)。
 *
 * 従来は3箇所がそれぞれ勝手に音を作っていた。
 *   曲画面のお手本      Tone.Synth + Vibrato
 *   レッスンのお手本    生の OscillatorNode (三角波)
 *   レッスンの単音再生  同上
 * 波形1つでは倍音も弓の立ち上がりも胴の響きも無く、機械音の域を出なかった。
 *
 * 実際のバイオリンを録音したサンプルに差し替え、ここに1本化する。
 *   音源: VSCO 2 Community Edition (Versilian Studios)
 *   ライセンス: CC0 / パブリックドメイン。商用可・表記不要・ロイヤリティなし
 *   収録: G3〜C7 の15音 (最大4半音間隔)。間の音は Tone.Sampler が補間する
 *   加工: 2.6秒で切り、末尾0.5秒をフェード、mono 64kbps に再エンコード (4.6MB→310KB)
 *
 * 読み込みは初回の再生時だけ。以後はこのモジュール内で使い回す。
 */
import * as Tone from "tone"

/** public/violin に置いた音。ファイル名がそのまま音名 */
const SAMPLE_NOTES = [
  "G3", "A3", "C4", "E4", "G4", "A4", "C5",
  "E5", "G5", "A5", "C6", "E6", "G6", "A6", "C7",
] as const

let sampler: Tone.Sampler | null = null
let loading: Promise<Tone.Sampler> | null = null

/**
 * サンプラーを用意する。何度呼んでも読み込みは1回だけ。
 * 呼び出し側は必ず await してから鳴らすこと (未読み込みだと無音になる)。
 */
export function getViolin(): Promise<Tone.Sampler> {
  if (sampler) return Promise.resolve(sampler)
  if (loading) return loading

  loading = new Promise<Tone.Sampler>((resolve, reject) => {
    const urls: Record<string, string> = {}
    for (const n of SAMPLE_NOTES) urls[n] = `${n}.mp3`

    const s = new Tone.Sampler({
      urls,
      baseUrl: "/violin/",
      // 弓を離したあとの余韻。切れると機械的に聞こえる
      release: 0.6,
      onload: () => { sampler = s; resolve(s) },
      onerror: (e) => { loading = null; reject(e) },
    }).toDestination()
    s.volume.value = -4
  })
  return loading
}

/** 音を止める。画面を離れるときなどに呼ぶ */
export function releaseViolin(): void {
  try { sampler?.releaseAll() } catch { /* 未読み込み */ }
}

/** MIDI番号 → Tone が解釈できる音名 (例: 69 → "A4") */
export function midiToNoteName(midi: number): string {
  return Tone.Frequency(midi, "midi").toNote()
}

/** サンプルが用意されている音域か。外れる音は補間が大きくなり不自然になる */
export function inSampledRange(midi: number): boolean {
  return midi >= 55 - 2 && midi <= 96 + 4 // G3 の少し下 〜 C7 の少し上
}
