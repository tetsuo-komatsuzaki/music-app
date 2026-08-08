"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import styles from "./Recorder.module.css"

// =========================================================
// 解析待ちカード (2026-08-02 案2改・Tetsuo確定デザイン):
// クリーム×木目 + 金のVUメーター + 赤ランプ「アルコが採点ちゅう…」。
// 解析ジョブ完了までの数分を「空の-%」ではなく待てる画面にする。
// =========================================================

const VU_BARS = [11, 18, 14, 9, 15] // 高さpx (モックと同一)

function AnalysisWaiting() {
  return (
    <div style={{
      textAlign: "center", padding: "20px 12px 18px",
      background: "linear-gradient(150deg,#fdf8ec,#f7efe2)",
      border: "1.5px solid #e8dcc2", borderRadius: 15,
    }}>
      <style>{`
        @keyframes recVu { 0%,100%{ transform:scaleY(.3) } 30%{ transform:scaleY(1) } 60%{ transform:scaleY(.6) } }
        @keyframes recBlink { 0%,100%{ opacity:1 } 50%{ opacity:.15 } }
      `}</style>
      <span style={{ display: "inline-flex", alignItems: "flex-end", gap: 3, height: 24 }} aria-hidden>
        {VU_BARS.map((h, i) => (
          <span key={i} style={{
            width: 4, height: h * 1.33, borderRadius: 2, transformOrigin: "bottom",
            background: "linear-gradient(180deg,#c9a227,#b8862e)",
            animation: `recVu 1s ease-in-out ${i * 0.15}s infinite`,
          }} />
        ))}
      </span>
      <div style={{ fontSize: 14.5, fontWeight: 800, color: "#4a3f2e", marginTop: 11 }}>
        <span aria-hidden style={{ display: "inline-block", verticalAlign: 2, marginRight: 7, width: 9, height: 9, borderRadius: "50%", background: "#d64541", animation: "recBlink 1.1s steps(1) infinite" }} />
        アルコが採点ちゅう…
      </div>
      <div style={{ fontSize: 11.5, color: "#9a8c74", marginTop: 5 }}>できあがりまで 約1〜2分</div>
      <div style={{ fontSize: 10.5, color: "#9a8c74", marginTop: 7 }}>待っているあいだに、もう一回練習してもOK！</div>
    </div>
  )
}

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
  excellent:     { label: "ばっちり",   color: "#085041", bg: "#E1F5EE" },
  good:          { label: "いい調子",   color: "#0C447C", bg: "#E6F1FB" },
  ok:            { label: "あと少し",   color: "#633806", bg: "#FAEEDA" },
  needsPractice: { label: "練習しよう", color: "#791F1F", bg: "#FCEBEB" },
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
      quality: { status: "clipping", message: "音が割れています。採点の正確さが下がる場合があります。" },
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
  disabled?: boolean
  bpm?: number
  onRecordingStart?: () => void
  onRecordingStop?: () => void
  onRecordingBpmChange?: (bpm: number) => void
  /** countdown 突入時に1回呼ぶ (F-1 のフルスクリーン化トリガ) */
  onCountdownStart?: () => void
  /** アップロード進捗 (0-100、null は未開始/完了)。v3.3 spec Commit 3 で追加 */
  uploadProgress?: number | null
  /** 採点完了の後追い通知 (2026-08-02): 録音直後は採点未完で点数が無いが、
   *  親のポーリングが完了を検知したらここに結果が入る → 待ちカードを結果表示に昇格 */
  resolvedResult?: {
    pitchAccuracy: number | null
    timingAccuracy: number | null
    overallScore: number | null
    analysisSummary?: PerfResult["analysisSummary"]
  } | null
  /**
   * Phase 4-1 (Q2=D): 演奏結果ダイアログから「上達ループタブで詳細」リンクを表示。
   * Score 演奏のみ undefined 以外で渡す (practice では undefined のままにする)。
   * クリックすると親側で URL ?tab=loop に切替。
   */
  onShowLoop?: () => void
  /**
   * 区間録音 (部分練習 Phase 2b): idle の録音CTAが押された瞬間に親へ通知。
   * 親はここで「この録音が区間録音か」を確定する (区間ボタン経由なら pending→confirmed)。
   * 区間ボタンは data-testid="recorder-start-button" を click してこのCTAをトリガする。
   *
   * 戻り値が truthy のときは、この後の録音開始 (カウントイン) を行わない。
   * オンボーディング中に「録音は始めず、ふりかえりの見本へ進める」ために使う。
   */
  onIdleRecordClick?: () => boolean | void
}

export type Status = "idle" | "tempo-select" | "countdown" | "recording" | "preview" | "uploading" | "result"

export default function Recorder({ onRecordingComplete, previousBestScore, disabled, bpm, onRecordingStart, onRecordingStop, onRecordingBpmChange, onCountdownStart, uploadProgress, onShowLoop, onIdleRecordClick, resolvedResult }: Props) {
  const [status, setStatus] = useState<Status>("idle")

  // 課金 Phase 1 (2026-08-07): 無料ユーザーへの週次採点カウント表示 (制限はまだ発動しない)。
  // idle に戻るたびに再取得 (採点1回で消費が増えるため)。無制限 (プラス/先生接続) は非表示。
  const [quota, setQuota] = useState<{ unlimited: boolean; used: number; limit: number } | null>(null)
  useEffect(() => {
    if (status !== "idle") return
    let cancelled = false
    fetch("/api/plan/usage")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (!cancelled && data) setQuota(data) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [status])
  const [elapsed, setElapsed] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [blobRef, setBlobRef] = useState<Blob | null>(null)
  const [perfResult, setPerfResult] = useState<PerfResult | null>(null)

  // 採点完了の後追い (2026-08-02): 待ちカード表示中に親が完了を検知したら点数を注入し、
  // 「アルコ結果を閉じたのに下はまだ採点ちゅう」の取り残しを無くす
  useEffect(() => {
    if (!resolvedResult || resolvedResult.pitchAccuracy == null) return
    setPerfResult((prev) => {
      if (prev?.pitchAccuracy != null) return prev // すでに点数あり
      return {
        ...prev,
        pitchAccuracy: resolvedResult.pitchAccuracy ?? undefined,
        timingAccuracy: resolvedResult.timingAccuracy ?? undefined,
        overallScore: resolvedResult.overallScore ?? undefined,
        analysisSummary: resolvedResult.analysisSummary ?? prev?.analysisSummary,
      }
    })
  }, [resolvedResult])
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
    onCountdownStart?.()
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
            showToast(`演奏スコア +${diff}点 改善しました`, "success")
          } else {
            showToast(`演奏スコア ${Math.round(r.overallScore)}点`, "success")
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

  // 真のアンマウント専用: 録音中/カウントイン中にタブ切替等で消えても
  // マイク・MediaRecorder・AudioContext を確実に解放する (リーク & マイク点灯継続 防止)。
  useEffect(() => {
    return () => {
      const rec = mediaRecorderRef.current
      if (rec && rec.state !== "inactive") {
        // 停止すると onstop が発火し stream/recAudioCtx を解放 + onRecordingStop で親stateも復帰
        try { rec.stop() } catch { /* ignore */ }
      } else {
        // カウントイン中など (recorder 未生成でも stream は取得済み) は直接解放
        streamRef.current?.getTracks().forEach((t) => t.stop())
      }
      // カウントインのクリック音用 AudioContext (recAudioCtx とは別) は常に閉じる
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {})
        audioCtxRef.current = null
      }
    }
  }, [])

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
          {/* テンポは共通の「テンポ・メトロノーム」で設定 → ここは直接カウントインへ (2026-07-18 一本化) */}
          <button
            className={styles.mainCta}
            data-testid="recorder-start-button"
            onClick={() => { if (onIdleRecordClick?.()) return; startCountdown() }}
            disabled={disabled}
          >
            <span className={styles.ctaDot} />
            <span>録音して AI 採点</span>
          </button>
          {quota && !quota.unlimited && (
            <div className={styles.quotaLine} data-testid="recorder-quota">
              今週のAI採点 {Math.min(quota.used, quota.limit)}/{quota.limit}回
            </div>
          )}
        </div>
      )}

      {/* ② カウントイン (キャンセル不可) */}
      {status === "countdown" && (
        <div className={styles.countdownPanel} data-recorder-panel="countdown">
          <div className={styles.countdownNum} key={countdownNum} data-recorder-element="countdown-number">{countdownNum}</div>
          <div className={styles.countdownLabel}>
            {effectiveBpm} BPM
          </div>
        </div>
      )}

      {/* ③ 録音中 */}
      {status === "recording" && (
        <div className={styles.recordingPanel} data-recorder-panel="recording">
          <div className={styles.recordingTitle} data-recorder-element="label">録音中…</div>
          <div className={styles.meterContainer} data-recorder-element="volume">
            <div className={styles.meterTrack}>
              <div className={styles.meterFill} style={{ width: `${volumeLevel * 100}%` }} />
            </div>
          </div>
          <div className={styles.timerRow} data-recorder-element="timer">
            <span className={styles.recordingDot} />
            <span className={styles.timer}>{formatTime(elapsed)}</span>
            <span className={styles.timerMax}>/ {formatTime(MAX_DURATION)}</span>
          </div>
          {elapsed < RECOMMENDED_DURATION && (
            <div className={styles.recHint}>推奨: {RECOMMENDED_DURATION}秒以上</div>
          )}
          <button className={styles.stopBtn} onClick={stopRecording} data-testid="recorder-stop-button">
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
                この録音で採点する
              </button>
            )}
          </div>
        </div>
      )}

      {/* ⑤ アップロード中 (2026-08-06: 継ぎ目撤去 — 提出の瞬間から採点ちゅうカード1枚に統一。
          内部工程 (アップロード→解析) の切り替わりはユーザーに見せない。
          進捗バーだけカード下に小さく出し、送信が終わると自然に消える) */}
      {status === "uploading" && (
        <div className={styles.resultPanel}>
          <AnalysisWaiting />
          {uploadProgress != null && uploadProgress < 100 && (
            <div style={{ margin: "10px 2px 0" }}>
              <div style={{ width: "100%", height: 5, background: "#eee5cc", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${uploadProgress}%`, height: "100%", background: "#c9a227", transition: "width 0.2s ease" }} />
              </div>
              <div style={{ fontSize: 10, color: "#9a8c74", marginTop: 3, textAlign: "center" }}>録音をおくっています… {uploadProgress}%</div>
            </div>
          )}
        </div>
      )}

      {/* ⑥ 結果表示。解析(Cloud Run job)が未完のうちは点数が無いので、
          空の「-%」を見せず ワクワク待ちカード に差し替える (2026-08-02)。
          完了すると通し録音はアルコ結果オーバーレイが自動で出る。 */}
      {status === "result" && perfResult?.pitchAccuracy == null && (
        <div className={styles.resultPanel}>
          <AnalysisWaiting />
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
      {status === "result" && perfResult?.pitchAccuracy != null && (
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

          {/* Phase 4-1 (Q2=D): Score 演奏で上達ループタブへの導線 */}
          {onShowLoop && (
            <button
              type="button"
              className={styles.loopLinkBtn}
              onClick={onShowLoop}
            >
              ふりかえりで詳細を見る →
            </button>
          )}

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
