"use client"

// 練習前シートの譜面プレビュー + お手本再生 (2026-07-18)。
// scoreId(=選択中の難易度変種) が変わると譜面・お手本を出し分ける。
// OSMD / Tone は遅延 import。最終的な音・描画は実アプリでの確認前提。
import { useEffect, useRef, useState } from "react"
import { getScorePreview, getPracticeItemPreview, type PreviewNote } from "@/app/actions/getScorePreview"
import styles from "./prePractice.module.css"

// OSMD の PlacementEnum.Below の実値 (2026-08-25 Tetsuo: 記号の重なり対策)。
// OSMD はこの enum をパッケージ直下から re-export していないため
// (build/dist/src/index.d.ts に無く、実行時の 201 exports にも含まれない)、
// import すると undefined になる。深い相対パスの import はバージョン更新で壊れるので
// 値だけをここに置く。出典: MusicalScore/VoiceData/Expressions/AbstractExpression
// (Above=0, Below=1, Left=2, Right=3, NotYetDefined=4, AboveOrBelow=5)
const OSMD_PLACEMENT_BELOW = 1

export default function SheetPreview({ scoreId, kind = "score" }: { scoreId: string; kind?: "score" | "practice" }) {
  const boxRef = useRef<HTMLDivElement>(null)
  const fsRef = useRef<HTMLDivElement>(null)
  const buildUrlRef = useRef<string | null>(null)
  const notesRef = useRef<PreviewNote[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toneRef = useRef<{ synth?: any; part?: any }>({})
  const [status, setStatus] = useState<"loading" | "ready" | "empty">("loading")
  const [playing, setPlaying] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  // 選択変種が変わるたびに 譜面 + お手本ノートを取り直す
  useEffect(() => {
    let cancelled = false
    setStatus("loading")
    stopPlayback()
    if (boxRef.current) boxRef.current.innerHTML = ""
    buildUrlRef.current = null
    setFullscreen(false)
    ;(async () => {
      const data = kind === "practice"
        ? await getPracticeItemPreview(scoreId)
        : await getScorePreview(scoreId)
      if (cancelled) return
      notesRef.current = data?.notes ?? []
      buildUrlRef.current = data?.buildUrl ?? null
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

  // 全画面で譜面をフル描画
  useEffect(() => {
    if (!fullscreen || !buildUrlRef.current || !fsRef.current) return
    let cancelled = false
    ;(async () => {
      try {
        const { OpenSheetMusicDisplay } = await import("opensheetmusicdisplay")
        if (cancelled || !fsRef.current) return
        fsRef.current.innerHTML = ""
        const osmd = new OpenSheetMusicDisplay(fsRef.current, {
          autoResize: true, drawTitle: false, drawPartNames: false,
        })
        // 記号の重なり対策 (2026-08-25 Tetsuo確定方針): 記号を上下に振り分ける。
        // 上=3連符・弓記号・スタッカート / 下=運指・弦番号 (教本の慣例どおり)。
        // OSMDは種類の違う記号同士の衝突回避をしないうえ、FingeringPosition の既定が
        // AboveOrBelow(5) で運指を上下どちらにも自動配置するため衝突する。下段に固定する。
        osmd.EngravingRules.FingeringPositionFromXML = false
        osmd.EngravingRules.FingeringPosition = OSMD_PLACEMENT_BELOW
        osmd.EngravingRules.MinimumDistanceBetweenSystems = 12
        await osmd.load(buildUrlRef.current!)
        if (cancelled) return
        osmd.zoom = 0.7
        osmd.render()
      } catch (e) {
        // 握り潰すと全画面が白いまま原因不明になる (2026-08-25: PlacementEnum が
        // undefined で TypeError を投げていたのに気付けなかった)。必ずログに出す。
        console.error("[SheetPreview] 全画面の描画に失敗", e)
      }
    })()
    return () => { cancelled = true }
  }, [fullscreen])

  const canFullscreen = status === "ready" && !!buildUrlRef.current

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
      <div
        className={styles.sheetBox}
        onClick={() => canFullscreen && setFullscreen(true)}
        style={{ cursor: canFullscreen ? "zoom-in" : "default" }}
      >
        {status === "loading" && <div className={styles.previewNote}>読み込み中…</div>}
        {status === "empty" && <div className={styles.previewNote}>楽譜のプレビューを準備中だよ</div>}
        <div ref={boxRef} className={styles.osmdBox} />
        {canFullscreen && (
          <span className={styles.expandHint}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 9V4h5M20 15v5h-5M15 4h5v5M9 20H4v-5" /></svg>
            タップで拡大
          </span>
        )}
      </div>

      {fullscreen && (
        <div className={styles.fsOverlay} onClick={() => setFullscreen(false)}>
          <button type="button" className={styles.fsClose} onClick={() => setFullscreen(false)} aria-label="閉じる">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
          <div className={styles.fsSheet} ref={fsRef} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}
