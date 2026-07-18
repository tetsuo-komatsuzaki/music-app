"use client"

// 練習前シートの譜面プレビュー + お手本再生 (2026-07-18)。
// scoreId(=選択中の難易度変種) が変わると譜面・お手本を出し分ける。
// OSMD / Tone は遅延 import。最終的な音・描画は実アプリでの確認前提。
import { useEffect, useRef, useState } from "react"
import { getScorePreview, type PreviewNote } from "@/app/actions/getScorePreview"
import styles from "./prePractice.module.css"

export default function SheetPreview({ scoreId }: { scoreId: string }) {
  const boxRef = useRef<HTMLDivElement>(null)
  const notesRef = useRef<PreviewNote[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toneRef = useRef<{ synth?: any; part?: any }>({})
  const [status, setStatus] = useState<"loading" | "ready" | "empty">("loading")
  const [playing, setPlaying] = useState(false)

  // 選択変種が変わるたびに 譜面 + お手本ノートを取り直す
  useEffect(() => {
    let cancelled = false
    setStatus("loading")
    stopPlayback()
    if (boxRef.current) boxRef.current.innerHTML = ""
    ;(async () => {
      const data = await getScorePreview(scoreId)
      if (cancelled) return
      notesRef.current = data?.notes ?? []
      if (data?.buildUrl && boxRef.current) {
        try {
          const { OpenSheetMusicDisplay } = await import("opensheetmusicdisplay")
          if (cancelled) return
          boxRef.current.innerHTML = ""
          const osmd = new OpenSheetMusicDisplay(boxRef.current, {
            autoResize: false,
            drawingParameters: "compact",
            drawTitle: false,
            drawPartNames: false,
          })
          await osmd.load(data.buildUrl)
          if (cancelled) return
          osmd.zoom = 0.62
          osmd.render()
          setStatus("ready")
        } catch {
          setStatus(data.notes.length ? "ready" : "empty")
        }
      } else {
        setStatus(data?.notes.length ? "ready" : "empty")
      }
    })()
    return () => { cancelled = true; stopPlayback() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoreId])

  useEffect(() => () => stopPlayback(), [])

  function stopPlayback() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Tone = (window as any).Tone
      toneRef.current.part?.dispose?.()
      toneRef.current.part = undefined
      if (Tone) { Tone.getTransport().stop(); Tone.getTransport().cancel() }
    } catch { /* noop */ }
    setPlaying(false)
  }

  async function play() {
    const notes = notesRef.current
    if (!notes.length) return
    const Tone = await import("tone")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).Tone = Tone
    await Tone.start()
    const transport = Tone.getTransport()
    transport.stop(); transport.cancel()
    if (!toneRef.current.synth) {
      toneRef.current.synth = new Tone.Synth({
        oscillator: { type: "sawtooth" },
        envelope: { attack: 0.08, decay: 0.05, sustain: 0.75, release: 0.35 },
      }).toDestination()
    }
    const events = notes.map((n) => ({
      time: n.start,
      duration: Math.max(n.end - n.start, 0.05),
      frequency: n.freq,
    }))
    toneRef.current.part?.dispose?.()
    toneRef.current.part = new Tone.Part((time, v: { frequency: number; duration: number }) => {
      toneRef.current.synth?.triggerAttackRelease(v.frequency, v.duration, time)
    }, events).start(0)
    const end = notes[notes.length - 1].end + 0.5
    transport.schedule(() => stopPlayback(), `${end}` as never)
    transport.seconds = 0
    transport.start()
    setPlaying(true)
  }

  return (
    <div className={styles.previewWrap}>
      <button
        type="button"
        className={styles.modelBtn}
        onClick={() => (playing ? stopPlayback() : play())}
        disabled={status === "loading"}
      >
        {playing ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1.2" /><rect x="14" y="5" width="4" height="14" rx="1.2" /></svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
        )}
        <span>お手本を{playing ? "停止" : "再生"}</span>
      </button>
      <div className={styles.sheetBox}>
        {status === "loading" && <div className={styles.previewNote}>読み込み中…</div>}
        {status === "empty" && <div className={styles.previewNote}>譜面プレビューは準備中です</div>}
        <div ref={boxRef} className={styles.osmdBox} />
      </div>
    </div>
  )
}
