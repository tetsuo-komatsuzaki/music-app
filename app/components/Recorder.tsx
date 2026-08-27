"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import styles from "./Recorder.module.css"
import Link from "next/link"
import { useParams } from "next/navigation"
import { canShowBillingEntryPoint } from "@/app/_libs/isNativeApp"
import { planCountIn } from "@/app/_libs/countIn"
import {
  addInterruptionListener,
  addLevelListener,
  addMaxDurationListener,
  addRecordingErrorListener,
  cancelNativeRecording,
  checkMicPermission,
  deleteNativeRecording,
  isNativeRecorderAvailable,
  readNativeRecordingBlob,
  requestMicPermission,
  startNativeRecording,
  stopNativeRecording,
  type NativeStopResult,
} from "@/app/_libs/arcodaRecorder"

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
      <div style={{ fontSize: "var(--fs-subhead)", fontWeight: 800, color: "var(--text-ink)", marginTop: 11 }}>
        <span aria-hidden style={{ display: "inline-block", verticalAlign: 2, marginRight: 7, width: 9, height: 9, borderRadius: "50%", background: "#d64541", animation: "recBlink 1.1s steps(1) infinite" }} />
        アルコが採点ちゅう…
      </div>
      <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-sub)", marginTop: 5 }}>できあがりまで 約1〜2分</div>
      <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-sub)", marginTop: 7 }}>待っているあいだに、もう一回練習してもOK！</div>
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
  excellent:     { label: "ばっちり",   color: "var(--text-good)", bg: "#E1F5EE" },
  good:          { label: "いい調子",   color: "var(--text-link)", bg: "#E6F1FB" },
  ok:            { label: "あと少し",   color: "var(--text-master)", bg: "#FAEEDA" },
  needsPractice: { label: "練習しよう", color: "var(--text-error)", bg: "#FCEBEB" },
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

/** ネイティブ経路の reject は Error とは限らないので、表示用に安全に文字列化する。 */
function nativeErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as { message?: unknown }).message)
  }
  return String(err)
}

/** Capacitor が reject に載せる code (PERMISSION_DENIED 等)。無ければ空文字。 */
function nativeErrorCode(err: unknown): string {
  if (typeof err === "object" && err !== null && "code" in err) {
    return String((err as { code?: unknown }).code)
  }
  return ""
}

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
}

type Props = {
  onRecordingComplete: (blob: Blob) => Promise<{
    success?: boolean
    error?: string
    result?: PerfResult
  }>
  previousBestScore?: number       // ピッチベスト
  disabled?: boolean
  bpm?: number
  onRecordingStart?: () => void
  onRecordingStop?: () => void
  onRecordingBpmChange?: (bpm: number) => void
  /** countdown 突入時に1回呼ぶ (F-1 のフルスクリーン化トリガ) */
  onCountdownStart?: () => void
  /**
   * 状態が変わるたびに呼ぶ (2026-08-27)。
   * 従来は countdown / recording / preview へ進むときだけ個別に通知しており、
   * 「もう一度録音する」で idle に戻ったことが親に伝わらなかった。
   * その結果 recordingState が preview のまま固定され、
   * `recordingState === "idle"` を条件にした録音の入口がすべて消えていた。
   * 進む向きだけでなく戻る向きも含め、ここで一括して伝える。
   */
  onStatusChange?: (status: Status) => void
  /** 拍子 (2026-08-27)。カウントインの回数と刻みをこれで決める。未指定は 4/4 扱い */
  timeNumerator?: number | null
  timeDenominator?: number | null
  /** 1拍目 (楽譜の起点) が録音の何秒目かを1回だけ通知する (2026-08-27)。
      アプリ版のみ。Web版は録音の実開始時刻が取れないので null を渡す。 */
  onGuideOffset?: (sec: number | null) => void
  /** カウントダウンを始める前に済ませたい準備 (2026-08-26)。
      横画面録音では、ここで画面の横固定と譜面の組み直しを終わらせる。
      これを待たずにカウントを始めると、4拍の最中に譜面の再描画が走り、
      テンポガイドが固まる・クリック音の間隔が乱れる。 */
  onPrepare?: () => Promise<void>
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

export type Status = "idle" | "tempo-select" | "preparing" | "countdown" | "recording" | "preview" | "uploading" | "result"

export default function Recorder({ onRecordingComplete, previousBestScore, disabled, bpm, onRecordingStart, onRecordingStop, onRecordingBpmChange, onCountdownStart, onStatusChange, timeNumerator, timeDenominator, onGuideOffset, onPrepare, uploadProgress, onShowLoop, onIdleRecordClick, resolvedResult }: Props) {
  const [status, setStatus] = useState<Status>("idle")
  const params = useParams<{ userId?: string }>()

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
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [volumeLevel, setVolumeLevel] = useState(0)
  const [realtimeHint, setRealtimeHint] = useState("")

  // カウントイン
  const [countdownNum, setCountdownNum] = useState(0)
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null)

  // プレビュー品質チェック
  const [qualityResult, setQualityResult] = useState<QualityResult | null>(null)
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null)

  // ARC-SPEC-NATIVE-1.0 §2 — アプリ版のネイティブ録音経路。
  // 使えるときだけ getUserMedia + MediaRecorder の代わりに ArcodaRecorder を使う。
  // Web版ブラウザでは nativeReadyRef が false のままなので、以下は一切通らない。
  const nativeReadyRef = useRef(false)
  /** この録音がネイティブ経路かどうか (停止・後片付けの分岐に使う) */
  const usingNativeRef = useRef(false)
  /** アップロード成功後にローカル録音を消すための stop() 結果 */
  const nativeResultRef = useRef<NativeStopResult | null>(null)
  /** 最初のサンプルが実際に録れた壁時計ms (テンポガイドとの同期照合用) */
  const nativeStartedAtRef = useRef<number | null>(null)
  /** 1拍目 (= 楽譜の起点) の壁時計。nativeStartedAtRef との差が録音内の位置になる */
  const downbeatWallMsRef = useRef<number | null>(null)
  /** 1拍目に発火させるタイマー */
  const downbeatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** 使ったカウントインの計画 (中止・再開時の参照用) */
  const countInPlanRef = useRef<ReturnType<typeof planCountIn> | null>(null)
  /* startRecording は beginCapture / enterRecordingState より前に定義されるため、
     宣言順に依存しないよう ref 経由で呼ぶ (関数の実体は下で代入する)。 */
  const beginCaptureRef = useRef<(() => Promise<boolean>) | null>(null)
  const enterRecordingStateRef = useRef<(() => void) | null>(null)
  const nativeListenersRef = useRef<Array<() => void>>([])
  /** 停止処理の二重実行 (停止ボタンと maxDuration イベントの競合) を防ぐ */
  const nativeFinalizingRef = useRef(false)

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
  // AccountMenu.logout が参照する。Context 共有を避けた最小実装。
  // あわせて body[data-recording] を立て、ボトムタブをCSSだけで隠す
  // (2026-08-17 ナビ要件定義 1-2: 録音中の誤タップで演奏が中断されるのを防ぐ)。
  useEffect(() => {
    if (typeof window === "undefined") return
    const on = status === "recording" || status === "countdown"
    ;(window as { __arcodaIsRecording?: boolean }).__arcodaIsRecording = (status === "recording")
    if (on) document.body.setAttribute("data-recording", "true")
    else document.body.removeAttribute("data-recording")
    return () => {
      ;(window as { __arcodaIsRecording?: boolean }).__arcodaIsRecording = false
      document.body.removeAttribute("data-recording")
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

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // =========================================================
  // カウントイン
  // =========================================================

  // 状態の変化を親へ伝える。戻る向き (preview → idle など) も漏らさない
  const onStatusChangeRef = useRef(onStatusChange)
  onStatusChangeRef.current = onStatusChange
  useEffect(() => { onStatusChangeRef.current?.(status) }, [status])

  /** 予約したクリック音。中止時に止められるよう控えておく */
  const scheduledClicksRef = useRef<OscillatorNode[]>([])

  /**
   * クリックを「音の時計」で予約する (2026-08-27)。
   * 旧実装は setInterval + osc.start(ctx.currentTime) の「今すぐ鳴らして」方式で、
   * 画面が忙しいと鳴る時刻がずれた。演奏者はこの音を基準に弾き始めるため、
   * ここがずれると演奏者のせいでないズレを演奏者のズレとして扱ってしまう。
   * @param at 鳴らす時刻 (AudioContext の時計)
   */
  const scheduleClick = useCallback((ctx: AudioContext, at: number) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = 440
    osc.type = "sine"
    gain.gain.value = 0.3
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(at)
    osc.stop(at + 0.02)
    scheduledClicksRef.current.push(osc)
    osc.onended = () => {
      scheduledClicksRef.current = scheduledClicksRef.current.filter((o) => o !== osc)
    }
  }, [])

  /** 予約済みのクリックを全部取り消す (中止・アンマウント時) */
  const cancelScheduledClicks = useCallback(() => {
    for (const osc of scheduledClicksRef.current) {
      try { osc.stop() } catch { /* 既に鳴り終わっている */ }
    }
    scheduledClicksRef.current = []
  }, [])

  // アプリ版の殻の中にいて、録音プラグインが組み込まれているかを一度だけ調べる。
  // Web版では常に false のまま = 既存の getUserMedia 経路。
  useEffect(() => {
    let alive = true
    void isNativeRecorderAvailable().then((available) => {
      if (alive) nativeReadyRef.current = available
    })
    return () => { alive = false }
  }, [])

  // マイク許可を先に取得し、準備できたらカウントダウン（4→3→2→1）を開始
  const streamRef = useRef<MediaStream | null>(null)

  const startCountdown = useCallback(async () => {
    // 1. マイク許可を先に取得
    if (nativeReadyRef.current) {
      // アプリ版: OS のマイク許可ダイアログはここで出る。
      // getUserMedia は呼ばない (WebView 側で入力を掴むと AVAudioSession の
      // .measurement 設定が崩れ、加工なし録音という価値の本体が失われる)。
      try {
        let permission = await checkMicPermission()
        if (permission.status === "prompt") permission = await requestMicPermission()
        if (!permission.granted) {
          showToast("マイクの使用が許可されていません", "error")
          return
        }
      } catch (err) {
        showToast(`マイクエラー: ${nativeErrorMessage(err)}`, "error")
        return
      }
      // 録音中イベント (レベル・中断・上限・失敗) はカウントイン中に繋いでおく。
      // 録音開始の直前に繋ぐと、その往復ぶん最初の音を取りこぼす。
      await attachNativeListeners()
    } else {
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
    }

    // 2. AudioContextをユーザージェスチャー内で初期化
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new AudioContext()
    }

    // 3. カウントダウンの前に準備を済ませる (横固定 + 譜面の組み直し)。
    //    Web版・プラグイン不在では即座に返るので待ち時間は増えない。
    setStatus("preparing")
    try {
      await onPrepare?.()
    } catch { /* 準備に失敗しても録音は続行する */ }

    // 4. アプリ版だけ、マイクを先に回し始める (2026-08-27)。
    //    旧実装は1拍目が来てから録音を頼んでいたため、マイクが立ち上がるまでの
    //    数十〜数百ミリ秒だけ録れず、時間どおりに弾くと出だしが欠けていた。
    //    カウントインぶんは余分に録れるが、1拍目の位置を解析へ渡すので除外できる。
    //    Web版は録音の実開始時刻が取れず位置を渡せないため、前倒しにするとクリック音が
    //    解析に混ざったまま除外できない。よって従来どおり1拍目で録り始める。
    const preRoll = nativeReadyRef.current
    if (preRoll) {
      const ok = await beginCaptureRef.current?.()
      if (!ok) return
    }

    // 5. カウントインを「音の時計」で予約する。
    //    拍子に応じて回数と刻みを決める (4/4=4回、3/4=3回、6/8=付点四分4回 …)。
    const ctx = audioCtxRef.current!
    const plan = planCountIn(effectiveBpm, timeNumerator, timeDenominator)
    countInPlanRef.current = plan

    // 予約の基準時刻。少し先に置いて、予約処理そのものの時間を吸収する
    const LEAD_SEC = 0.12
    const firstClickAt = ctx.currentTime + LEAD_SEC
    for (let i = 0; i < plan.clicks; i++) {
      scheduleClick(ctx, firstClickAt + i * plan.intervalSec)
    }
    // 1拍目 = 最後のクリックの1拍後。ここが楽譜の起点になる
    const downbeatAt = firstClickAt + plan.clicks * plan.intervalSec

    setStatus("countdown")
    onCountdownStart?.()
    setCountdownNum(plan.clicks)

    // 画面の数字は音とは別に進める。数字がずれても音はずれない
    let shown = plan.clicks
    countdownTimerRef.current = setInterval(() => {
      shown--
      if (shown >= 1) setCountdownNum(shown)
    }, plan.intervalSec * 1000)

    // 1拍目ちょうどにガイドを走らせる。音の時計との差を見て残りを setTimeout で待つ
    const fireAtDownbeat = async () => {
      if (!preRoll) {
        // Web版はここで録り始める (従来どおり)
        const ok = await beginCaptureRef.current?.()
        if (!ok) return
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current)
        countdownTimerRef.current = null
      }
      // 1拍目の壁時計。ネイティブが返す録音開始時刻と突き合わせて位置を出す
      const wall = Date.now()
      downbeatWallMsRef.current = wall
      const startedAt = nativeStartedAtRef.current
      // アプリ版だけ「1拍目は録音の何秒目か」が出せる。
      // 負や極端な値は取り違えなので渡さない (解析は従来方式に落ちる)。
      let offsetSec: number | null = null
      if (usingNativeRef.current && startedAt != null) {
        const sec = (wall - startedAt) / 1000
        if (sec >= 0 && sec <= 60) offsetSec = sec
      }
      onGuideOffset?.(offsetSec)
      enterRecordingStateRef.current?.()
    }
    const waitMs = Math.max(0, (downbeatAt - ctx.currentTime) * 1000)
    downbeatTimerRef.current = setTimeout(() => { void fireAtDownbeat() }, waitMs)
  }, [effectiveBpm, timeNumerator, timeDenominator, scheduleClick, onGuideOffset])

  // =========================================================
  // 録音
  // =========================================================

  // メーターと助言の出し方は Web版 / アプリ版で同一にする。
  // 入力が AnalyserNode か ArcodaRecorder の level イベントかだけが違う。
  const applyLevel = useCallback((rms: number) => {
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
  }, [])

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
    applyLevel(rms)

    animFrameRef.current = requestAnimationFrame(updateVolumeMeter)
  }, [applyLevel])

  // 録音できた Blob を preview へ渡すまでの共通処理 (Web版 / アプリ版で同一)。
  const presentRecordedBlob = useCallback(async (blob: Blob) => {
    // 2026-08-27: ここも黙って idle に戻していた。
    // 弾き終えて停止したのに、何も言われず録音前の画面に戻るので
    // 「録音できたはずなのに反応しない」に見える。理由を伝える。
    if (blob.size === 0) {
      showToast("音が録れていなかったよ。マイクを確かめてもう一度ためしてね", "error")
      setStatus("idle")
      return
    }
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
      // FLAC を decodeAudioData できない環境では波形と品質判定を諦める
      // (録音そのものは成功しているのでアップロードは通す)
      setQualityResult({ status: "ok", message: "録音できました" })
      setStatus("preview")
    }
  }, [])

  const detachNativeListeners = useCallback(() => {
    nativeListenersRef.current.forEach((remove) => remove())
    nativeListenersRef.current = []
  }, [])

  /**
   * ネイティブ録音を確定して preview へ進める。
   * 停止ボタン・上限10分到達・電話等の中断のどれからでもここに合流する
   * (中断のときはネイティブ側で既にファイルが確定していて、stop() は取り出すだけ)。
   */
  const finalizeNative = useCallback(async () => {
    if (nativeFinalizingRef.current) return
    nativeFinalizingRef.current = true

    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    setVolumeLevel(0)
    setRealtimeHint("")

    try {
      const result = await stopNativeRecording()
      nativeResultRef.current = result
      nativeStartedAtRef.current = result.startedAtMs
      detachNativeListeners()
      usingNativeRef.current = false
      onRecordingStop?.()

      const blob = await readNativeRecordingBlob(result)
      await presentRecordedBlob(blob)
    } catch (err) {
      detachNativeListeners()
      usingNativeRef.current = false
      onRecordingStop?.()
      showToast(`録音エラー: ${nativeErrorMessage(err)}`, "error")
      setStatus("idle")
    } finally {
      nativeFinalizingRef.current = false
    }
  }, [detachNativeListeners, onRecordingStop, presentRecordedBlob])

  const attachNativeListeners = useCallback(async () => {
    detachNativeListeners()
    const removers = await Promise.all([
      addLevelListener((event) => applyLevel(event.rms)),
      // 上限10分: ネイティブ側は既に確定済みなので、そのまま preview へ送る
      addMaxDurationListener(() => {
        showToast("10分に達したので録音を止めました", "error")
        void finalizeNative()
      }),
      // 電話・アラーム等。自動再開はせず、そこまでを保存するか本人に選ばせる
      addInterruptionListener((event) => {
        if (event.type !== "began") return
        showToast("録音が中断されました。ここまでを保存できます", "error")
        void finalizeNative()
      }),
      addRecordingErrorListener((event) => {
        showToast(`録音エラー: ${event.message}`, "error")
        detachNativeListeners()
        usingNativeRef.current = false
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
        setVolumeLevel(0)
        setRealtimeHint("")
        void cancelNativeRecording()
        onRecordingStop?.()
        setStatus("idle")
      }),
    ])
    nativeListenersRef.current = removers
  }, [applyLevel, detachNativeListeners, finalizeNative, onRecordingStop])

  const stopRecording = useCallback(() => {
    if (usingNativeRef.current) {
      void finalizeNative()
      return
    }
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop()
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [finalizeNative])

  /**
   * マイクを回し始める (2026-08-27 でカウントインの前へ移動)。
   * 「録音中」の見た目にはまだしない。1拍目で enterRecordingState を呼ぶ。
   * 戻り値 false は開始できなかった場合 (呼び出し側は中断する)。
   */
  const beginCapture = useCallback(async (): Promise<boolean> => {
    // アプリ版: MediaRecorder ではなくネイティブ録音を回す。
    // 加工なし (AGC/ノイズ抑制/EQ オフ) の 48kHz FLAC がネイティブ側で直接書き出される。
    if (nativeReadyRef.current) {
      try {
        nativeResultRef.current = null
        nativeStartedAtRef.current = null
        nativeFinalizingRef.current = false
        usingNativeRef.current = true

        const started = await startNativeRecording({
          sampleRate: 48000,
          maxDurationSec: MAX_DURATION,
        })
        // 最初のサンプルが実際に録れた時刻 (Date.now と同じ壁時計)。
        // 1拍目の壁時計との差が「1拍目は録音の何秒目か」になる。
        nativeStartedAtRef.current = started.startedAtMs
        return true
      } catch (err) {
        usingNativeRef.current = false
        detachNativeListeners()
        void cancelNativeRecording()
        showToast(
          err instanceof Error ? `録音を開始できませんでした: ${err.message}` : "録音を開始できませんでした",
          "error",
        )
        setStatus("idle")
        return false
      }
    }

    // Web版: MediaRecorder。開始の正確な時刻は取れないので位置は渡さない。
    try {
      const stream = streamRef.current
      if (!stream) throw new Error("マイクが使えません")

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
        await presentRecordedBlob(blob)
      }

      mediaRecorderRef.current = recorder
      recorder.start(1000)
      animFrameRef.current = requestAnimationFrame(updateVolumeMeter)
      return true
    } catch (err: unknown) {
      const e = err as { name?: string; message?: string }
      if (e.name === "NotAllowedError") {
        showToast("マイクの使用が許可されていません", "error")
      } else if (e.name === "NotFoundError") {
        showToast("マイクが見つかりません", "error")
      } else {
        showToast(`録音エラー: ${e.message ?? ""}`, "error")
      }
      setStatus("idle")
      return false
    }
  }, [updateVolumeMeter, presentRecordedBlob, detachNativeListeners, onRecordingStop])

  beginCaptureRef.current = beginCapture

  /** 1拍目に呼ぶ。ここで初めて「録音中」の見た目になり、テンポガイドが走り出す。 */
  const enterRecordingState = useCallback(() => {
    setStatus("recording")
    setElapsed(0)
    setPerfResult(null)
    setQualityResult(null)
    onRecordingStart?.()

    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        if (prev + 1 >= MAX_DURATION) { stopRecording(); return MAX_DURATION }
        return prev + 1
      })
    }, 1000)
  }, [stopRecording, onRecordingStart])
  enterRecordingStateRef.current = enterRecordingState


  /** 送信せずに捨てる録音のローカルファイルを消す (アプリ版のみ・取りこぼしても24hで自動削除)。 */
  const discardNativeFile = useCallback(() => {
    const result = nativeResultRef.current
    if (!result) return
    nativeResultRef.current = null
    void deleteNativeRecording(result.path)
  }, [])

  const retryRecording = useCallback(() => {
    // 防御 (2026-08-16): 後片付けで例外が出ても必ず idle に戻す (録音ボタン消失の予防)
    setStatus("idle")
    try { if (audioUrl) URL.revokeObjectURL(audioUrl) } catch { /* noop */ }
    try { discardNativeFile() } catch { /* noop */ }
    setAudioUrl(null)
    setBlobRef(null)
    setPerfResult(null)
    setQualityResult(null)
  }, [audioUrl, discardNativeFile])

  const submitRecording = useCallback(async () => {
    // 2026-08-27: ここは以前 `if (!blobRef) return` で黙って戻っていた。
    // 録音が手元に無いのに採点ボタンだけ出ている状態になると、押しても
    // トーストも出ず状態も変わらず、利用者からは「押しても反応しない」に見える。
    // 何が起きたか伝え、録音し直せる場所まで戻す。
    if (!blobRef) {
      showToast("録音が見つからなかったよ。もう一度録音してね", "error")
      retryRecording()
      return
    }
    setStatus("uploading")
    try {
      const res = await onRecordingComplete(blobRef)
      if (res?.error) {
        showToast(res.error, "error")
        setStatus("preview")
      } else {
        // アップロード済みなのでローカルの録音ファイルはもう要らない
        const uploaded = nativeResultRef.current
        if (uploaded) {
          nativeResultRef.current = null
          void deleteNativeRecording(uploaded.path)
        }

        const r = res?.result
        setPerfResult(r || null)
        setStatus("result")

        if (r?.overallScore != null && r?.previousOverall != null) {
          const diff = Math.round(r.overallScore - r.previousOverall)
          if (diff > 0) {
            showToast(`+${diff}点 のびたよ！`, "success")
          } else {
            showToast(`${Math.round(r.overallScore)}点だったよ`, "success")
          }
        } else if (r?.pitchAccuracy != null && r?.previousScore != null) {
          const diff = r.pitchAccuracy - r.previousScore
          if (diff > 0) {
            showToast(`音程が +${diff}% のびたよ！`, "success")
          } else {
            showToast(`音程 ${r.pitchAccuracy}%`, "success")
          }
        } else if (r?.pitchAccuracy != null) {
          showToast(`音程 ${r.pitchAccuracy}%`, "success")
        }

        // 旧「録音リング」トーストは機能廃止に伴い撤去 (2026-08-15)
      }
    } catch (e: any) {
      showToast(`送信エラー: ${e.message}`, "error")
      setStatus("preview")
    }
  }, [blobRef, onRecordingComplete, retryRecording])


  const continueToNext = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    discardNativeFile()
    setAudioUrl(null)
    setBlobRef(null)
    setStatus("idle")
  }, [audioUrl, discardNativeFile])

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
    return "もう一回挑戦！・+10点くらい"
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
      // 予約済みのクリックは自分で止めないと、画面を離れたあとも鳴る
      if (downbeatTimerRef.current) clearTimeout(downbeatTimerRef.current)
      cancelScheduledClicks()
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl, cancelScheduledClicks])

  // 真のアンマウント専用: 録音中/カウントイン中にタブ切替等で消えても
  // マイク・MediaRecorder・AudioContext を確実に解放する (リーク & マイク点灯継続 防止)。
  useEffect(() => {
    return () => {
      // アプリ版: 録音中に画面が消えたらネイティブ側も止める (マイク点灯継続の防止)
      nativeListenersRef.current.forEach((remove) => remove())
      nativeListenersRef.current = []
      if (usingNativeRef.current) {
        usingNativeRef.current = false
        void cancelNativeRecording()
      }

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
          styles.toastSuccess
        }`}>
          {toast.message}
        </div>
      )}

      {/* ① 待機 */}
      {status === "idle" && (
        <div className={styles.idlePanel}>
          {/* テンポは共通の「テンポ・メトロノーム」で設定 → ここは直接カウントインへ (2026-07-18 一本化) */}
          {quota && !quota.unlimited && quota.used >= quota.limit ? (
            /* Phase 3 (2026-08-16発動): 無料は週7回まで。上限到達時は録音ボタンを畳んで案内カード */
            <div data-testid="recorder-quota-limit" style={{ textAlign: "center", background: "#f3f6fb", border: "1px solid #d9e3f4", borderRadius: 12, padding: "16px 14px" }}>
              <div style={{ fontSize: "var(--fs-subhead)", fontWeight: 800, color: "#1f3d78" }}>今週の無料採点はここまで</div>
              <div style={{ fontSize: "var(--fs-body)", color: "var(--text-sub)", marginTop: 4 }}>月曜日にまた7回できるよ</div>
              {canShowBillingEntryPoint() && params?.userId && (
                <Link href={`/${params.userId}/settings`} style={{ display: "inline-block", marginTop: 10, fontSize: "var(--fs-body)", fontWeight: 800, color: "#2b5bc4", textDecoration: "none" }}>
                  アルコプラスなら無制限・14日間無料 →
                </Link>
              )}
            </div>
          ) : (
            <button
              className={styles.mainCta}
              data-testid="recorder-start-button"
              onClick={() => { if (onIdleRecordClick?.()) return; startCountdown() }}
              disabled={disabled}
            >
              <span className={styles.ctaDot} />
              <span>録音して採点</span>
            </button>
          )}
          {quota && !quota.unlimited && quota.used < quota.limit && (
            <div className={styles.quotaLine} data-testid="recorder-quota">
              今週の採点 {Math.min(quota.used, quota.limit)}/{quota.limit}回
            </div>
          )}
        </div>
      )}

      {/* ② カウントイン (キャンセル不可) */}
      {/* ②' 準備中: 横固定と譜面の組み直しを待つ間。ここを空にすると画面が消えて見える */}
      {status === "preparing" && (
        <div className={styles.countdownPanel} data-recorder-panel="preparing">
          <div className={styles.countdownLabel}>よこ画面にしています</div>
        </div>
      )}

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
              <div style={{ fontSize: "var(--fs-label)", color: "var(--text-sub)", marginTop: 3, textAlign: "center" }}>録音をおくっています… {uploadProgress}%</div>
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
