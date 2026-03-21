"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import styles from "./recorder.module.css"

type PerfResult = {
  pitchAccuracy?: number
  timingAccuracy?: number
  isPersonalBest?: boolean
  previousScore?: number
  ringStatus?: { record: boolean; remaining: number }
}

type Props = {
  onRecordingComplete: (blob: Blob) => Promise<{
    success?: boolean
    error?: string
    result?: PerfResult
  }>
  previousBestScore?: number
  disabled?: boolean
}

export default function Recorder({ onRecordingComplete, previousBestScore, disabled }: Props) {
  const [status, setStatus] = useState<"idle" | "recording" | "preview" | "uploading" | "result">("idle")
  const [elapsed, setElapsed] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [blobRef, setBlobRef] = useState<Blob | null>(null)
  const [perfResult, setPerfResult] = useState<PerfResult | null>(null)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "ring" } | null>(null)
  const [volumeLevel, setVolumeLevel] = useState(0)
  const [realtimeHint, setRealtimeHint] = useState("")

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number | null>(null)

  const MAX_DURATION = 300        // 5分
  const RECOMMENDED_DURATION = 15

  const showToast = (message: string, type: "success" | "error" | "ring") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const updateVolumeMeter = useCallback(() => {
    if (!analyserRef.current) return
    const data = new Uint8Array(analyserRef.current.fftSize)
    analyserRef.current.getByteTimeDomainData(data)
    let sum = 0
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128
      sum += v * v
    }
    const rms = Math.sqrt(sum / data.length)
    const level = Math.min(rms * 5, 1)
    setVolumeLevel(level)

    if (level < 0.02) {
      setRealtimeHint("音が小さいです…もう少し近づいてください")
    } else if (level < 0.1) {
      setRealtimeHint("いい感じです 🎵")
    } else if (level > 0.8) {
      setRealtimeHint("少し強すぎます！少しだけ離して！")
    } else {
      setRealtimeHint("安定しています 🎵")
    }

    animFrameRef.current = requestAnimationFrame(updateVolumeMeter)
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop()
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100,
        }
      })

      const audioCtx = new AudioContext()
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      let mimeType = "audio/webm;codecs=opus"
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "audio/webm"
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "audio/ogg;codecs=opus"
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "audio/mp4"
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = ""

      const recorder = new MediaRecorder(stream, {
        mimeType: mimeType || undefined,
        audioBitsPerSecond: 128000,
      })
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop())
        audioCtx.close()
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
        setVolumeLevel(0)
        setRealtimeHint("")

        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" })
        chunksRef.current = []

        if (blob.size > 0) {
          const url = URL.createObjectURL(blob)
          setAudioUrl(url)
          setBlobRef(blob)
          setStatus("preview")
        } else {
          setStatus("idle")
        }
      }

      mediaRecorderRef.current = recorder
      recorder.start(1000)
      setStatus("recording")
      setElapsed(0)
      setPerfResult(null)
      animFrameRef.current = requestAnimationFrame(updateVolumeMeter)

      timerRef.current = setInterval(() => {
        setElapsed(prev => {
          if (prev + 1 >= MAX_DURATION) { stopRecording(); return MAX_DURATION }
          return prev + 1
        })
      }, 1000)

    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        showToast("マイクの使用が許可されていません", "error")
      } else if (err.name === "NotFoundError") {
        showToast("マイクが見つかりません", "error")
      } else {
        showToast(`録音エラー: ${err.message}`, "error")
      }
      setStatus("idle")
    }
  }, [updateVolumeMeter, stopRecording])

  const retryRecording = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    setBlobRef(null)
    setPerfResult(null)
    setStatus("idle")
  }, [audioUrl])

  const submitRecording = useCallback(async () => {
    if (!blobRef) return
    setStatus("uploading")
    try {
      const res = await onRecordingComplete(blobRef)
      if (res?.error) {
        showToast(res.error, "error")
        setStatus("preview")
      } else {
        const r = res?.result
        setPerfResult(r || null)
        setStatus("result")

        if (r?.pitchAccuracy != null && r?.previousScore != null) {
          const diff = r.pitchAccuracy - r.previousScore
          if (diff > 0) {
            showToast(`音程 +${diff}% 改善しました`, "success")
          } else {
            showToast(`音程 ${r.pitchAccuracy}%`, "success")
          }
        } else if (r?.pitchAccuracy != null) {
          showToast(`音程 ${r.pitchAccuracy}%`, "success")
        }

        if (r?.ringStatus?.record) {
          setTimeout(() => {
            showToast(
              r.ringStatus!.remaining > 0
                ? `Recordリング達成！あと${r.ringStatus!.remaining}つで今日完了`
                : `今日のリング全て達成！`,
              "ring"
            )
          }, 2000)
        }
      }
    } catch (e: any) {
      showToast(`送信エラー: ${e.message}`, "error")
      setStatus("preview")
    }
  }, [blobRef, onRecordingComplete])

  const continueToNext = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    setBlobRef(null)
    setStatus("idle")
  }, [audioUrl])

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`

  const getResultMessage = () => {
    if (!perfResult?.pitchAccuracy) return ""
    const prev = perfResult.previousScore ?? previousBestScore
    if (prev == null) return "グッドスタートです"
    const diff = perfResult.pitchAccuracy - prev
    if (diff >= 5) return "かなり安定してきています"
    if (diff > 0) return `+${diff} 改善！いい感じです`
    if (diff === 0) return "安定しています"
    if (diff > -5) return "あと少しで前回を超えます"
    return "少し崩れています。大丈夫です"
  }

  const getDiffText = () => {
    if (!perfResult?.pitchAccuracy) return null
    const prev = perfResult.previousScore ?? previousBestScore
    if (prev == null) return null
    const diff = perfResult.pitchAccuracy - prev
    if (diff > 0) return `+${diff}`
    if (diff < 0) return `${diff}`
    return "±0"
  }

  const getRetryLabel = () => {
    if (!perfResult?.pitchAccuracy) return "もう一回挑戦"
    const gap = 100 - perfResult.pitchAccuracy
    if (gap <= 0) return "完璧！もう一度！"
    if (gap <= 3) return `あと+${gap}で自己ベスト`
    if (gap <= 10) return `あと+${gap}でかなり良くなる`
    return "もう一回挑戦！(+10点くらい)"
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  return (
    <div className={styles.wrapper}>

      {toast && (
        <div className={`${styles.toast} ${
          toast.type === "error" ? styles.toastError :
          toast.type === "ring" ? styles.toastRing :
          styles.toastSuccess
        }`}>
          {toast.message}
        </div>
      )}

      {/* ① 待機 */}
      {status === "idle" && (
        <div className={styles.idlePanel}>
          <button className={styles.mainCta} onClick={startRecording} disabled={disabled}>
            <span className={styles.ctaDot} />
            <span>今すぐ試す（10秒）</span>
          </button>
          <div className={styles.safetyMsg}>何度でもやり直せます</div>
          {previousBestScore != null && (
            <div className={styles.prevScore}>前回ベスト: {previousBestScore}%</div>
          )}
        </div>
      )}

      {/* ② 録音中 */}
      {status === "recording" && (
        <div className={styles.recordingPanel}>
          <div className={styles.recordingTitle}>録音中…</div>
          <div className={styles.meterContainer}>
            <div className={styles.meterTrack}>
              <div className={styles.meterFill} style={{ width: `${volumeLevel * 100}%` }} />
            </div>
          </div>
          {realtimeHint && (
            <div className={styles.realtimeHint}>{realtimeHint}</div>
          )}
          <div className={styles.timerRow}>
            <span className={styles.recordingDot} />
            <span className={styles.timer}>{formatTime(elapsed)}</span>
            <span className={styles.timerMax}>/ {formatTime(MAX_DURATION)}</span>
          </div>
          {elapsed < RECOMMENDED_DURATION && (
            <div className={styles.recHint}>推奨: {RECOMMENDED_DURATION}秒以上</div>
          )}
          <button className={styles.stopBtn} onClick={stopRecording}>
            <span className={styles.stopSquare} /> 停止
          </button>
        </div>
      )}

      {/* ③ プレビュー */}
      {status === "preview" && (
        <div className={styles.previewPanel}>
          <audio controls src={audioUrl!} className={styles.audioPlayer} />
          <div className={styles.previewActions}>
            <button className={styles.retryBtn} onClick={retryRecording}>
              もう一度録音
            </button>
            <button className={styles.submitBtn} onClick={submitRecording}>
              結果を見る
            </button>
          </div>
          <div className={styles.safetyMsg}>何度でもやり直せます</div>
        </div>
      )}

      {/* ④ 解析中 */}
      {status === "uploading" && (
        <div className={styles.uploadingPanel}>
          <span className={styles.spinner} />
          <span>どれくらい良くなったか計算中…</span>
        </div>
      )}

      {/* ⑤ 結果表示 */}
      {status === "result" && (
        <div className={styles.resultPanel}>
          {perfResult?.isPersonalBest && (
            <div className={styles.personalBest}>自己ベスト更新！</div>
          )}
          <div className={styles.scoreRow}>
            <div className={styles.scoreItem}>
              <div className={styles.scoreLabel}>音程</div>
              <div className={styles.scoreValue}>
                {perfResult?.pitchAccuracy ?? "-"}%
                {getDiffText() && (
                  <span className={
                    getDiffText()!.startsWith("+") ? styles.scoreDiffUp :
                    getDiffText()!.startsWith("-") ? styles.scoreDiffDown :
                    styles.scoreDiffSame
                  }>
                    {getDiffText()}
                  </span>
                )}
              </div>
            </div>
            {perfResult?.timingAccuracy != null && (
              <div className={styles.scoreItem}>
                <div className={styles.scoreLabel}>リズム</div>
                <div className={styles.scoreValue}>{perfResult.timingAccuracy}%</div>
              </div>
            )}
          </div>

          <div className={styles.resultMessage}>{getResultMessage()}</div>

          {audioUrl && <audio controls src={audioUrl} className={styles.audioPlayer} />}

          <div className={styles.resultActions}>
            <button className={styles.retryBtnStrong} onClick={continueToNext}>
              {getRetryLabel()}
            </button>
            <button className={styles.doneBtn} onClick={continueToNext}>
              完了
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
