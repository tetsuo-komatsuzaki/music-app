// お手本再生 (実装指示書v1.2 §5 / UI要件v1.1 §7-3 確定③)
// - exemplarAudioUrl (PracticeItem.metadata.exemplarAudioUrl) があれば専用録音を再生
// - 未登録の間は課題フレーズMusicXMLの合成再生でフォールバック
//   (音源が入り次第、コード変更なしで置換される差し替え設計)
// すべて端末内で完結する。

type ParsedNote = {
  midi: number
  startBeats: number
  durBeats: number
  /** 2026-08-27: 奏法。お手本を実録音にしたので、鳴らし方に反映する */
  articulations?: string[]
  is_tremolo?: boolean
  is_trill?: boolean
  is_mordent?: boolean
}

/** MusicXML の記号 → アプリの奏法id (analyze_musicxml.py と同じ対応) */
const ART_TAG: Record<string, string> = {
  staccato: "staccato",
  spiccato: "spiccato",
  "strong-accent": "martele",
  "detached-legato": "portato",
  tenuto: "legato",
}

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
        // 奏法を拾う。<notations> の下に <articulations> と装飾記号が入る
        const arts: string[] = []
        for (const k of Object.keys(ART_TAG)) {
          if (el.querySelector(`notations > articulations > ${k}`)) arts.push(ART_TAG[k])
        }
        notes.push({
          midi,
          startBeats: isChord ? Math.max(0, cursorBeats - durBeats) : cursorBeats,
          durBeats,
          articulations: arts.length ? arts : undefined,
          is_tremolo: !!el.querySelector("notations > ornaments > tremolo"),
          is_trill: !!el.querySelector("notations > ornaments > trill-mark"),
          is_mordent: !!el.querySelector("notations > ornaments > mordent, notations > ornaments > inverted-mordent"),
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
  // 2026-08-27: 三角波の合成 → 実録音のサンプラーへ。
  // 旧実装は OscillatorNode(triangle) を1本鳴らすだけで、倍音も弓の立ち上がりも
  // 胴の響きも無く機械音の域を出なかった。音源は VSCO 2 CE (CC0)。
  const { playNote, preloadFor, midiToNoteName, releaseViolin } =
    await import("@/app/_libs/violinSampler")
  const Tone = await import("tone")
  await Tone.start()
  // 使う奏法の音源を先に読み込む。途中で読み込むと最初の数音が無音になる
  await preloadFor(notes)

  const beatSec = 60 / bpm
  const t0 = Tone.now() + 0.15
  let endSec = 0
  for (let i = 0; i < notes.length; i++) {
    const n = notes[i]
    const start = t0 + n.startBeats * beatSec
    const dur = n.durBeats * beatSec
    void playNote(
      midiToNoteName(n.midi), dur, start, n,
      notes[i + 1] ? midiToNoteName(notes[i + 1].midi) : null,
    )
    endSec = Math.max(endSec, n.startBeats * beatSec + n.durBeats * beatSec)
  }

  const timer = setTimeout(() => { releaseViolin(); onEnd() }, (endSec + 0.8) * 1000)
  return () => {
    clearTimeout(timer)
    releaseViolin()
    onEnd()
  }
}
