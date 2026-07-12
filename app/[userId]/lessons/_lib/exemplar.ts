// お手本再生 (実装指示書v1.2 §5 / UI要件v1.1 §7-3 確定③)
// - exemplarAudioUrl (PracticeItem.metadata.exemplarAudioUrl) があれば専用録音を再生
// - 未登録の間は課題フレーズMusicXMLの合成再生でフォールバック
//   (音源が入り次第、コード変更なしで置換される差し替え設計)
// すべて端末内で完結する。

type ParsedNote = { midi: number; startBeats: number; durBeats: number }

const STEP_SEMITONES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

/** MusicXML(score-partwise) → 音列。レッスンフレーズ想定の簡易パーサ (和音・付点・休符対応) */
export function parseMusicXml(xmlText: string): ParsedNote[] {
  const doc = new DOMParser().parseFromString(xmlText, "application/xml")
  const notes: ParsedNote[] = []
  let divisions = 4
  let cursorBeats = 0
  const measures = [...doc.querySelectorAll("part > measure")]
  for (const measure of measures) {
    for (const el of [...measure.children]) {
      if (el.tagName === "attributes") {
        const d = el.querySelector("divisions")
        if (d?.textContent) divisions = parseInt(d.textContent, 10) || divisions
        continue
      }
      if (el.tagName !== "note") continue
      const durEl = el.querySelector("duration")
      const durBeats = durEl?.textContent
        ? parseInt(durEl.textContent, 10) / divisions
        : 0
      const isChord = !!el.querySelector("chord")
      const pitch = el.querySelector("pitch")
      if (pitch) {
        const step = pitch.querySelector("step")?.textContent ?? "C"
        const octave = parseInt(pitch.querySelector("octave")?.textContent ?? "4", 10)
        const alter = parseInt(pitch.querySelector("alter")?.textContent ?? "0", 10) || 0
        const midi = 12 * (octave + 1) + (STEP_SEMITONES[step] ?? 0) + alter
        notes.push({
          midi,
          startBeats: isChord ? Math.max(0, cursorBeats - durBeats) : cursorBeats,
          durBeats,
        })
      }
      // 和音の2音目以降は時間を進めない
      if (!isChord) cursorBeats += durBeats
    }
  }
  return notes
}

/**
 * お手本を再生する。返り値は停止関数。
 * @param xmlUrl 課題フレーズMusicXMLの署名URL (合成フォールバック用)
 * @param bpm ガイドテンポ
 * @param audioUrl 専用録音があればそのURL (優先)
 * @param onEnd 再生終了コールバック
 */
export async function playExemplar(
  xmlUrl: string,
  bpm: number,
  audioUrl: string | null,
  onEnd: () => void,
): Promise<() => void> {
  if (audioUrl) {
    const audio = new Audio(audioUrl)
    audio.onended = onEnd
    audio.onerror = onEnd
    void audio.play()
    return () => {
      audio.pause()
      onEnd()
    }
  }

  const res = await fetch(xmlUrl)
  const xml = await res.text()
  const notes = parseMusicXml(xml)
  if (notes.length === 0) {
    onEnd()
    return () => {}
  }
  const ctx = new AudioContext()
  await ctx.resume().catch(() => {})
  const t0 = ctx.currentTime + 0.1
  const beatSec = 60 / bpm
  let endSec = 0
  const master = ctx.createGain()
  master.gain.value = 0.5
  master.connect(ctx.destination)
  for (const n of notes) {
    const start = t0 + n.startBeats * beatSec
    const dur = Math.max(0.12, n.durBeats * beatSec - 0.06)
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "triangle"
    osc.frequency.value = 440 * Math.pow(2, (n.midi - 69) / 12)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(0.9, start + 0.02)
    gain.gain.setValueAtTime(0.9, start + dur * 0.7)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)
    osc.connect(gain).connect(master)
    osc.start(start)
    osc.stop(start + dur + 0.05)
    endSec = Math.max(endSec, n.startBeats * beatSec + n.durBeats * beatSec)
  }
  const timer = setTimeout(
    () => {
      void ctx.close().catch(() => {})
      onEnd()
    },
    (endSec + 0.4) * 1000,
  )
  return () => {
    clearTimeout(timer)
    void ctx.close().catch(() => {})
    onEnd()
  }
}
