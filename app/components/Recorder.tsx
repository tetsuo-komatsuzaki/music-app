"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import styles from "./recorder.module.css"

// =========================================================
// スコアランク + フィードバック
// =========================================================

type ScoreRank = "excellent" | "good" | "ok" | "needsPractice"

function getScoreRank(score: number): ScoreRank {
  if (score >= 90) return "excellent"
  if (score >= 75) return "good"
  if (score >= 60) return "ok"
  return "needsPractice"
}

const rankLabels: Record<ScoreRank, { label: string; color: string; bg: string }> = {
  excellent:     { label: "Excellent",      color: "#085041", bg: "#E1F5EE" },
  good:          { label: "Good",           color: "#0C447C", bg: "#E6F1FB" },
  ok:            { label: "OK",             color: "#633806", bg: "#FAEEDA" },
  needsPractice: { label: "Needs Practice", color: "#791F1F", bg: "#FCEBEB" },
}

type Feedback = {
  issue: string
  advice: string
  actionLabel: string
}

function generateFeedback(
  pitchAccuracy: number,
  timingAccuracy: number,
  analysisSummary: any,
): Feedback {
  if (analysisSummary?.primaryAdvice) {
    return {
      issue: analysisSummary.primaryIssue === "pitch_unstable" ? "音程が不安定" :
             analysisSummary.primaryIssue === "pitch_slight" ? "音程を微調整" :
             analysisSummary.primaryIssue === "timing_late" ? "リズムが遅れ気味" :
             analysisSummary.primaryIssue === "timing_early" ? "リズムが走り気味" :
             analysisSummary.primaryIssue === "none" ? "よく弾けています" :
             "もう少し練習",
      advice: analysisSummary.primaryAdvice,
      actionLabel: analysisSummary.primaryIssue === "none" ? "テンポを上げて挑戦" : "意識してもう一回",
    }
  }
  if (pitchAccuracy < timingAccuracy) {
    return {
      issue: "音程を安定させましょう",
      advice: "チューナーのトーンで、1音ずつ確認しながら弾いてみましょう",
      actionLabel: "ゆっくり弾いてみる",
    }
  } else {
    return {
      issue: "リズムを安定させましょう",
      advice: "メトロノームに合わせて練習しましょう",
      actionLabel: "メトロノームで弾く",
    }
  }
}

// =========================================================
// 音声品質チェック
// =========================================================

type QualityResult = {
  status: "ok" | "silent" | "clipping"
  message: string
}

async function checkAudioQuality(blob: Blob): Promise<{ quality: QualityResult; audioBuffer: AudioBuffer }> {
  const arrayBuffer = await blob.arrayBuffer()
  const audioCtx = new AudioContext()
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
  const channelData = audioBuffer.getChannelData(0)

  // 無音チェック: ピークRMS < 0.003
  let sumSq = 0
  let clippingCount = 0
  for (let i = 0; i < channelData.length; i++) {
    const sample = channelData[i]
    sumSq += sample * sample
    if (Math.abs(sample) >= 0.99) clippingCount++
  }
  const rms = Math.sqrt(sumSq / channelData.length)

  await audioCtx.close()

  if (rms < 0.003) {
    return {
      quality: { status: "silent", message: "音が録れていません。マイクを確認してください。" },
      audioBuffer,
    }
  }

  // クリッピングチェック: 0.99以上のサンプルが1%以上
  const clippingRatio = clippingCount / channelData.length
  if (clippingRatio >= 0.01) {
    return {
      quality: { status: "clipping", message: "音が割れています。解析精度が下がる場合があります。" },
      audioBuffer,
    }
  }

  return {
    quality: { status: "ok", message: "録音できました" },
    audioBuffer,
  }
}

// =========================================================
// 波形描画
// =========================================================

function drawWaveform(canvas: HTMLCanvasElement, audioBuffer: AudioBuffer) {
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  const width = canvas.width
  const height = canvas.height
  const data = audioBuffer.getChannelData(0)
  const step = Math.ceil(data.length / width)

  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = "#f0f0f0"
  ctx.fillRect(0, 0, width, height)

  const mid = height / 2
  ctx.beginPath()
  ctx.strokeStyle = "#4a90d9"
  ctx.lineWidth = 1

  for (let i = 0; i < width; i++) {
    const start = i * step
    let min = 1, max = -1
    for (let j = 0; j < step && start + j < data.length; j++) {
      const val = data[start + j]
      if (val < min) min = val
      if (val > max) max = val
    }
    ctx.moveTo(i, mid + min * mid)
    ctx.lineTo(i, mid + max * mid)
  }
  ctx.stroke()
}

// =========================================================
// 型定義
// =========================================================

type PerfResult = {
  pitchAccuracy?: number
  timingAccuracy?: number
  overallScore?: number
  isPersonalBest?: boolean
  previousScore?: number
  previousOverall?: number
  analysisSummary?: {
    primaryIssue?: string
    primaryAdvice?: string
    [key: string]: any
  }
  ringStatus?: { record: boolean; remaining: number }
}

type Props = {
  onRecordingComplete: (blob: Blob) => Promise<{
    success?: boolean
    error?: string
    result?: PerfResult
  }>
  previousBestScore?: number       // ピッチベスト（録音後フィードバック比較用）
  bestOverallScore?: number        // 総合ベスト（録音ボタン下の表示用）
  disabled?: boolean
  bpm?: number
  onRecordingStart?: () => void
  onRecordingStop?: () => void
  onRecordingBpmChange?: (bpm: number) => void
  /** アップロード進捗 (0-100、null は未開始/完了)。v3.3 spec Commit 3 で追加 */
  uploadProgress?: number | null
}

type Status = "idle" | "tempo-select" | "countdown" | "recording" | "preview" | "uploading" | "result"

export default function Recorder({ onRecordingComplete, previousBestScore, bestOverallScore, disabled, bpm, onRecordingStart, onRecordingStop, onRecordingBpmChange, uploadProgress }: Props) {
  const [status, setStatus] = useState<Status>("idle")
  const [elapsed, setElapsed] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [blobRef, setBlobRef] = useState<Blob | null>(null)
  const [perfResult, setPerfResult] = useState<PerfResult | null>(null)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "ring" } | null>(null)
  const [volumeLevel, setVolumeLevel] = useState(0)
  const [realtimeHint, setRealtimeHint] = useState("")

  // カウントイン
  const [countdownNum, setCountdownNum] = useState(0)
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null)

  // プレビュー品質チェック
  const [qualityResult, setQualityResult] = useState<QualityResult | null>(null)
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const sliderRef = useRef<HTMLInputElement | null>(null)
  const bpmDisplayRef = useRef<HTMLSpanElement | null>(null)

  const MAX_DURATION = 600
  const RECOMMENDED_DURATION = 15
  const scoreBpm = bpm ?? 90
  const [recordingBpm, setRecordingBpm] = useState(scoreBpm)
  const userChangedBpmRef = useRef(false)
  const effectiveBpm = recordingBpm

  // S-1: ログアウト時の警告用に録音中フラグをグローバルに公開
  // Sidebar.handleLogout が参照する。Context 共有を避けた最小実装。
  useEffect(() => {
    if (typeof window === "undefined") return
    ;(window as { __arcodaIsRecording?: boolean }).__arcodaIsRecording = (status === "recording")
    return () => {
      ;(window as { __arcodaIsRecording?: boolean }).__arcodaIsRecording = false
    }
  }, [status])

  // bpm prop が後から届いたら (analysis ロード完了時など) recordingBpm を同期。
  // ただし、ユーザーが既にスライダーを触っていれば尊重する。
  useEffect(() => {
    if (!userChangedBpmRef.current && bpm != null) {
      setRecordingBpm(bpm)
      if (sliderRef.current) sliderRef.current.value = String(bpm)
      if (bpmDisplayRef.current) bpmDisplayRef.current.textContent = `${bpm} BPM`
      onRecordingBpmChange?.(bpm)
    }
  }, [bpm, onRecordingBpmChange])

  const showToast = (message: string, type: "success" | "error" | "ring") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // =========================================================
  // カウントイン
  // =========================================================

  const playClick = useCallback(() => {
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new AudioContext()
      }
      const ctx = audioCtxRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = 440
      osc.type = "sine"
      gain.gain.value = 0.3
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.02)
    } catch { /* ignore */ }
  }, [])

  // マイク許可を先に取得し、準備できたらカウントダウン（4→3→2→1）を開始
  const streamRef = useRef<MediaStream | null>(null)

  const startCountdown = useCallback(async () => {
    // 1. マイク許可を先に取得（ブラウザの許可ダイアログはここで出る）
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100,
        }
      })
      streamRef.current = stream
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        showToast("マイクの使用が許可されていません", "error")
      } else if (err.name === "NotFoundError") {
        showToast("マイクが見つかりません", "error")
      } else {
        showToast(`マイクエラー: ${err.message}`, "error")
      }
      return
    }

    // 2. AudioContextをユーザージェスチャー内で初期化
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new AudioContext()
    }

    // 3. カウントダウン開始（4→3→2→1）
    setStatus("countdown")
    setCountdownNum(4)
    playClick()

    const interval = 60000 / effectiveBpm
    let count = 4

    countdownTimerRef.current = setInterval(() => {
      count--
      if (count >= 1) {
        setCountdownNum(count)
        playClick()
      } else {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
        countdownTimerRef.current = null
        actuallyStartRecording()
      }
    }, interval)
  }, [effectiveBpm, playClick])

  const cancelCountdown = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
    // マイクストリームを解放
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setStatus("idle")
    setCountdownNum(0)
  }, [])

  // =========================================================
  // 録音
  // =========================================================

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
      setRealtimeHint("いい感じです")
    } else if (level > 0.8) {
      setRealtimeHint("少し強すぎます！少しだけ離して！")
    } else {
      setRealtimeHint("安定しています")
    }

    animFrameRef.current = requestAnimationFrame(updateVolumeMeter)
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop()
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  const actuallyStartRecording = useCallback(async () => {
    try {
      // マイクはカウントダウン前に取得済み
      const stream = streamRef.current
      if (!stream) {
        showToast("マイクの準備ができていません", "error")
        setStatus("idle")
        return
      }

      const recAudioCtx = new AudioContext()
      const source = recAudioCtx.createMediaStreamSource(stream)
      const analyser = recAudioCtx.createAnalyser()
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
        audioBitsPerSecond: 64000,
      })
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop())
        recAudioCtx.close()
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
        setVolumeLevel(0)
        setRealtimeHint("")
        onRecordingStop?.()

        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" })
        chunksRef.current = []

        if (blob.size > 0) {
          const url = URL.createObjectURL(blob)
          setAudioUrl(url)
          setBlobRef(blob)

          // 品質チェック
          try {
            const { quality, audioBuffer } = await checkAudioQuality(blob)
            setQualityResult(quality)
            setStatus("preview")
            // 波形描画（次フレームでcanvasが存在してから）
            requestAnimationFrame(() => {
              if (waveformCanvasRef.current) {
                drawWaveform(waveformCanvasRef.current, audioBuffer)
              }
            })
          } catch {
            setQualityResult({ status: "ok", message: "録音できました" })
            setStatus("preview")
          }
        } else {
          setStatus("idle")
        }
      }

      mediaRecorderRef.current = recorder
      recorder.start(1000)
      setStatus("recording")
      setElapsed(0)
      setPerfResult(null)
      setQualityResult(null)
      animFrameRef.current = requestAnimationFrame(updateVolumeMeter)
      onRecordingStart?.()

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
    setQualityResult(null)
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

        if (r?.overallScore != null && r?.previousOverall != null) {
          const diff = Math.round(r.overallScore - r.previousOverall)
          if (diff > 0) {
            showToast(`総合 +${diff}点 改善しました`, "success")
          } else {
            showToast(`総合 ${Math.round(r.overallScore)}点`, "success")
          }
        } else if (r?.pitchAccuracy != null && r?.previousScore != null) {
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

  const getOverallDiff = (): number | null => {
    if (perfResult?.overallScore == null || perfResult?.previousOverall == null) return null
    return Math.round(perfResult.overallScore - perfResult.previousOverall)
  }

  const getRetryLabel = () => {
    if (perfResult?.pitchAccuracy != null && perfResult?.timingAccuracy != null) {
      const fb = generateFeedback(
        perfResult.pitchAccuracy,
        perfResult.timingAccuracy,
        perfResult.analysisSummary,
      )
      return fb.actionLabel
    }
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
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
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
          <button className={styles.mainCta} onClick={() => setStatus("tempo-select")} disabled={disabled}>
            <span className={styles.ctaDot} />
            <span>録音する</span>
          </button>
          <div className={styles.safetyMsg}>何度でもやり直せます</div>
          {bestOverallScore != null && (
            <div className={styles.prevScore}>ベストスコア: {Math.round(bestOverallScore)}点</div>
          )}
        </div>
      )}

      {/* ①-b テンポ選択 */}
      {status === "tempo-select" && (
        <div className={styles.idlePanel}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: "#555" }}>録音テンポ</span>
              <span ref={bpmDisplayRef} style={{ fontSize: 18, fontWeight: 700 }}>{recordingBpm} BPM</span>
            </div>
            <input
              ref={sliderRef}
              type="range"
              min={Math.max(Math.round(scoreBpm * 0.25), 20)}
              max={Math.round(scoreBpm * 2)}
              defaultValue={recordingBpm}
              onInput={(e) => {
                userChangedBpmRef.current = true
                const v = Number(e.currentTarget.value)
                if (bpmDisplayRef.current) bpmDisplayRef.current.textContent = `${v} BPM`
                onRecordingBpmChange?.(v)
              }}
              onMouseUp={(e) => setRecordingBpm(Number(e.currentTarget.value))}
              onTouchEnd={(e) => setRecordingBpm(Number(e.currentTarget.value))}
              onKeyUp={(e) => setRecordingBpm(Number(e.currentTarget.value))}
              style={{ width: "100%", accentColor: "#2e7dff" }}
            />
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              {[0.5, 0.75, 1, 1.25, 1.5].map((ratio) => {
                const t = Math.round(scoreBpm * ratio)
                return (
                  <button
                    key={ratio}
                    onClick={() => {
                      userChangedBpmRef.current = true
                      setRecordingBpm(t)
                      if (sliderRef.current) sliderRef.current.value = String(t)
                      if (bpmDisplayRef.current) bpmDisplayRef.current.textContent = `${t} BPM`
                      onRecordingBpmChange?.(t)
                    }}
                    style={{
                      flex: 1, padding: "4px 0", fontSize: 12, borderRadius: 6, cursor: "pointer",
                      border: recordingBpm === t ? "1px solid #2e7dff" : "1px solid #ddd",
                      background: recordingBpm === t ? "#2e7dff" : "#f5f5f5",
                      color: recordingBpm === t ? "#fff" : "#333",
                    }}
                  >
                    {ratio === 1 ? `${t}` : `x${ratio}`}
                  </button>
                )
              })}
            </div>
          </div>
          <button className={styles.mainCta} onClick={startCountdown}>
            <span className={styles.ctaDot} />
            <span>録音開始</span>
          </button>
          <button
            onClick={() => setStatus("idle")}
            style={{ marginTop: 8, background: "none", border: "none", color: "#999", fontSize: 13, cursor: "pointer" }}
          >
            キャンセル
          </button>
        </div>
      )}

      {/* ② カウントイン */}
      {status === "countdown" && (
        <div className={styles.countdownPanel}>
          <div className={styles.countdownNum} key={countdownNum}>{countdownNum}</div>
          <div className={styles.countdownLabel}>
            {effectiveBpm} BPM
          </div>
          <button className={styles.cancelBtn} onClick={cancelCountdown}>
            キャンセル
          </button>
        </div>
      )}

      {/* ③ 録音中 */}
      {status === "recording" && (
        <div className={styles.recordingPanel}>
          <div className={styles.recordingTitle}>録音中…</div>
          <div className={styles.meterContainer}>
            <div className={styles.meterTrack}>
              <div className={styles.meterFill} style={{ width: `${volumeLevel * 100}%` }} />
            </div>
          </div>
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

      {/* ④ プレビュー（品質チェック付き） */}
      {status === "preview" && (
        <div className={styles.previewPanel}>
          {/* 品質チェック結果 */}
          {qualityResult && (
            <div className={
              qualityResult.status === "silent" ? styles.qualitySilent :
              qualityResult.status === "clipping" ? styles.qualityClipping :
              styles.qualityOk
            }>
              {qualityResult.status === "silent" && "❌ "}
              {qualityResult.status === "clipping" && "⚠️ "}
              {qualityResult.status === "ok" && "✅ "}
              {qualityResult.message}
            </div>
          )}

          {/* 波形表示 */}
          <canvas
            ref={waveformCanvasRef}
            width={320}
            height={60}
            className={styles.waveformCanvas}
          />

          {/* 録音時間 */}
          <div className={styles.previewDuration}>録音時間：{formatTime(elapsed)}</div>

          {/* 再生 */}
          {audioUrl && <audio controls src={audioUrl} className={styles.audioPlayer} />}

          {/* ボタン */}
          <div className={styles.previewActions}>
            <button className={styles.retryBtn} onClick={retryRecording}>
              もう一度録音する
            </button>
            {qualityResult?.status !== "silent" && (
              <button className={styles.submitBtn} onClick={submitRecording}>
                この録音で解析する
              </button>
            )}
          </div>
          <div className={styles.safetyMsg}>何度でもやり直せます</div>
        </div>
      )}

      {/* ⑤ アップロード/解析中 */}
      {status === "uploading" && (
        <div className={styles.uploadingPanel}>
          {uploadProgress != null && uploadProgress < 100 ? (
            <>
              <div style={{
                width: "100%", height: 8, background: "#eee",
                borderRadius: 4, overflow: "hidden", marginBottom: 8,
              }}>
                <div style={{
                  width: `${uploadProgress}%`, height: "100%",
                  background: "#2e7dff", transition: "width 0.2s ease",
                }} />
              </div>
              <span>アップロード中... {uploadProgress}%</span>
            </>
          ) : (
            <>
              <span className={styles.spinner} />
              <span>どれくらい良くなったか計算中…</span>
            </>
          )}
        </div>
      )}

      {/* ⑥ 結果表示 */}
      {status === "result" && (
        <div className={styles.resultPanel}>
          {perfResult?.isPersonalBest && (
            <div className={styles.personalBest}>自己ベスト更新！</div>
          )}

          {perfResult?.overallScore != null && (
            <div className={styles.overallRow}>
              <span
                className={styles.rankBadge}
                style={{
                  background: rankLabels[getScoreRank(perfResult.overallScore)].bg,
                  color: rankLabels[getScoreRank(perfResult.overallScore)].color,
                }}
              >
                {rankLabels[getScoreRank(perfResult.overallScore)].label}
              </span>
              <span className={styles.overallValue}>
                {Math.round(perfResult.overallScore)}
                <span className={styles.overallUnit}>点</span>
              </span>
              {getOverallDiff() != null && (
                <span className={
                  getOverallDiff()! > 0 ? styles.scoreDiffUp :
                  getOverallDiff()! < 0 ? styles.scoreDiffDown :
                  styles.scoreDiffSame
                }>
                  {getOverallDiff()! > 0 ? "+" : ""}{getOverallDiff()}
                </span>
              )}
            </div>
          )}

          <div className={styles.subScoreRow}>
            <div className={styles.subScore}>
              <span className={styles.subLabel}>音程</span>
              <span className={styles.subValue}>{perfResult?.pitchAccuracy ?? "-"}%</span>
            </div>
            {perfResult?.timingAccuracy != null && (
              <div className={styles.subScore}>
                <span className={styles.subLabel}>リズム</span>
                <span className={styles.subValue}>{perfResult.timingAccuracy}%</span>
              </div>
            )}
          </div>

          <div className={styles.resultMessage}>{getResultMessage()}</div>

          {perfResult?.pitchAccuracy != null && perfResult?.timingAccuracy != null && (
            (() => {
              const fb = generateFeedback(
                perfResult.pitchAccuracy,
                perfResult.timingAccuracy,
                perfResult.analysisSummary,
              )
              return (
                <div className={styles.feedbackCard}>
                  <div className={styles.feedbackBody}>
                    <div className={styles.feedbackIssue}>{fb.issue}</div>
                    <div className={styles.feedbackAdvice}>{fb.advice}</div>
                  </div>
                </div>
              )
            })()
          )}

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
