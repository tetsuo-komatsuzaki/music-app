"use client"

// 学びレッスン プレーヤー (プロトタイプ v2.4 の INTRO→SLIDE→PLAY→CLEAR を実装)
//
// 確定#3: 録音はアップロードせず端末内で窓あき発音チェックのみ。
//   カウントイン(4拍・ガイドテンポ)→録音→停止→窓判定→合格なら recordLessonPlay 報告。
//   3回で習得(クリア画面)。期待タイミングは OSMD のカーソルイテレータから抽出する
//   (scoreDetail.tsx buildTimeToGNotesMap と同じ换算: realValue*4*60/bpm)。

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay"
import { ArcoChan, POSE_BY_ID } from "@/app/onboarding/_components/ArcoChan"
import { recordLessonPlay } from "@/app/actions/recordLessonPlay"
import { CATS, FEEDBACK, LESSON_BY_ID } from "../_lib/content"
import { bowFig, fbFig, type BowFigOpts, type FbFigOpts } from "../_lib/figures"
import { checkSound, SOUND_CHECK_PARAMS } from "../_lib/soundCheck"
import { playExemplar } from "../_lib/exemplar"
import { LESSON_MOTION_MAP } from "@/app/components/violin/bowing-motions"
import LessonBowingMotion from "./LessonBowingMotion"
import LessonBowingStatic from "./LessonBowingStatic"
import LessonPositionShift from "./LessonPositionShift"
import LessonPositionMistake from "./LessonPositionMistake"
import LessonTrill from "./LessonTrill"
import LessonGlissando from "./LessonGlissando"
import LessonVibrato from "./LessonVibrato"
import LessonOrnament from "./LessonOrnament"
import LessonFingerboard from "./LessonFingerboard"
import LessonHarmonics from "./LessonHarmonics"
import LessonScoreCard from "./LessonScoreCard"
import styles from "../lessons.module.css"

type Screen = "INTRO" | "SLIDE" | "PLAY" | "CLEAR"
type RecState = "idle" | "counting" | "rec" | "analyzing"

const RUNS_REQUIRED = 3
const COUNT_IN_BEATS = 4
/** スライドの用語タイルに出すアルコのポーズ (プロト準拠) */
const SLIDE_POSES = ["07B", "05A", "04A", "01A", "02A"] as const

/** 間違い(❌ 赤)/コツ(◯ 緑)のマーク。スライドのイラスト右上に重ねる (全レッスン共通) */
function FigMark({ kind }: { kind: "cross" | "circle" | null }) {
  if (!kind) return null
  const color = kind === "cross" ? "#E5484D" : "#2EAD5B"
  return (
    <div className={styles.figMark} aria-hidden="true">
      <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        {kind === "cross" ? (
          <path
            d="M 9,9 L 31,31 M 31,9 L 9,31"
            stroke={color}
            strokeWidth="6.5"
            strokeLinecap="round"
            fill="none"
          />
        ) : (
          <circle cx="20" cy="20" r="15" stroke={color} strokeWidth="5.5" fill="none" />
        )}
      </svg>
    </div>
  )
}

export default function LessonPlayer({
  lessonId,
  practiceItemId,
  buildUrl,
  guideBpm,
  initialPlayCount,
  alreadyCleared,
  listHref,
  returnUrl,
  exemplarAudioUrl,
}: {
  lessonId: string
  practiceItemId: string
  buildUrl: string
  guideBpm: number
  initialPlayCount: number
  alreadyCleared: boolean
  listHref: string
  /** 曲詳細から来た場合の復帰先 (「曲にもどる」・UI要件v1.1 §4) */
  returnUrl: string | null
  /** 専用お手本録音 (未登録=null→課題フレーズの合成再生フォールバック) */
  exemplarAudioUrl: string | null
}) {
  const lesson = LESSON_BY_ID.get(lessonId)!
  const theme = CATS[lesson.cat]
  const router = useRouter()

  const [screen, setScreen] = useState<Screen>("INTRO")
  const [slide, setSlide] = useState(0)
  const [plays, setPlays] = useState(Math.min(initialPlayCount, RUNS_REQUIRED))
  const [recState, setRecState] = useState<RecState>("idle")
  const [countNum, setCountNum] = useState(0)
  const [bubbleOverride, setBubbleOverride] = useState<string | null>(null)
  const [osmdReady, setOsmdReady] = useState(false)
  const [exemplarPlaying, setExemplarPlaying] = useState(false)
  const exemplarStopRef = useRef<(() => void) | null>(null)

  const toggleExemplar = async () => {
    if (exemplarPlaying) {
      exemplarStopRef.current?.()
      return
    }
    setExemplarPlaying(true)
    try {
      exemplarStopRef.current = await playExemplar(buildUrl, guideBpm, exemplarAudioUrl, () => {
        setExemplarPlaying(false)
        exemplarStopRef.current = null
      })
    } catch (e) {
      console.error("[lesson] exemplar failed:", e)
      setExemplarPlaying(false)
    }
  }
  useEffect(() => () => exemplarStopRef.current?.(), [])
  // 画面が切り替わったらお手本を強制停止する (2026-08-29 Tetsuo指示)。
  // アンマウントは上の行が守る。ここはタブ/アプリの切り替えとページ離脱。
  useEffect(() => {
    const stopNow = () => exemplarStopRef.current?.()
    const onHidden = () => { if (document.hidden) stopNow() }
    document.addEventListener("visibilitychange", onHidden)
    window.addEventListener("pagehide", stopNow)
    return () => {
      document.removeEventListener("visibilitychange", onHidden)
      window.removeEventListener("pagehide", stopNow)
    }
  }, [])

  // ── OSMD (弾く画面の譜面 + 期待タイミング抽出) ──────────────────────
  const osmdHostRef = useRef<HTMLDivElement | null>(null)
  const expectedTimesRef = useRef<number[]>([])
  useEffect(() => {
    if (screen !== "PLAY" || !osmdHostRef.current || osmdReady) return
    let disposed = false
    const host = osmdHostRef.current
    const osmd = new OpenSheetMusicDisplay(host, {
      autoResize: false,
      backend: "svg",
      drawTitle: false,
      drawPartNames: false,
      pageFormat: "Endless",
      drawingParameters: "compacttight",
    })
;(async () => {
      try {
        await osmd.load(buildUrl)
        if (disposed) return
        // 拍子記号(4/4)非表示 (Part C C-1・全譜面共通)。テンポ表記はガイドラベルと重複のため非表示
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(osmd.EngravingRules as any).RenderTimeSignatures = false
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(osmd.EngravingRules as any).MetronomeMarksDrawn = false
        osmd.zoom = 0.62
        osmd.render()
        // 期待タイミング抽出: 非休符 VoiceEntry の開始時刻 (秒)
        const times = new Set<number>()
        const it = osmd.cursor.iterator
        while (!it.EndReached) {
          const entries = it.CurrentVoiceEntries ?? []
          const hasNote = entries.some((ve) =>
            ve.Notes?.some((n) => !n.isRest()),
          )
          if (hasNote) {
            times.add((it.currentTimeStamp.RealValue * 4 * 60) / guideBpm)
          }
          it.moveToNext()
        }
        expectedTimesRef.current = [...times].sort((a, b) => a - b)
        setOsmdReady(true)
      } catch (e) {
        console.error("[lesson] OSMD load failed:", e)
      }
    })()
    return () => {
      disposed = true
      host.innerHTML = ""
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen])

  // ── 録音 + カウントイン + 窓判定 ──────────────────────────────────
  const mediaRef = useRef<{
    stream: MediaStream
    recorder: MediaRecorder
    chunks: Blob[]
    /** 録音開始からカウントイン終了(=演奏開始)までの秒 */
    playStartOffset: number
    autoStop: ReturnType<typeof setTimeout> | null
  } | null>(null)

  const cleanupMedia = useCallback(() => {
    const m = mediaRef.current
    if (!m) return
    if (m.autoStop) clearTimeout(m.autoStop)
    m.stream.getTracks().forEach((t) => t.stop())
    mediaRef.current = null
  }, [])
  useEffect(() => cleanupMedia, [cleanupMedia])

  const playClick = (ctx: AudioContext, at: number, accent: boolean) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = accent ? 880 : 660
    gain.gain.setValueAtTime(0.35, at)
    gain.gain.exponentialRampToValueAtTime(0.001, at + 0.09)
    osc.connect(gain).connect(ctx.destination)
    osc.start(at)
    osc.stop(at + 0.1)
  }

  const startTake = async () => {
    if (recState !== "idle" || !osmdReady) return
    setBubbleOverride(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })
      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find(
        (m) => MediaRecorder.isTypeSupported(m),
      )
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      const chunks: Blob[] = []
      recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data)
      recorder.onstop = () => void analyzeTake()

      const beatSec = 60 / guideBpm
      const recStart = performance.now()
      recorder.start(500)
      setRecState("counting")

      // カウントイン (録音は先に回し、演奏開始位置はオフセットで合わせる)
      const ctx = new AudioContext()
      const t0 = ctx.currentTime + 0.15
      for (let i = 0; i < COUNT_IN_BEATS; i++) playClick(ctx, t0 + i * beatSec, i === 0)
      for (let i = 0; i < COUNT_IN_BEATS; i++) {
        setTimeout(() => setCountNum(COUNT_IN_BEATS - i), (0.15 + i * beatSec) * 1000)
      }
      const playStartMs = (0.15 + COUNT_IN_BEATS * beatSec) * 1000
      setTimeout(() => {
        setCountNum(0)
        setRecState("rec")
        void ctx.close()
      }, playStartMs)

      const expected = expectedTimesRef.current
      const phraseEnd = (expected[expected.length - 1] ?? 4) + 2.5
      const autoStop = setTimeout(
        () => {
          if (mediaRef.current?.recorder.state === "recording")
            mediaRef.current.recorder.stop()
        },
        playStartMs + phraseEnd * 1000,
      )
      mediaRef.current = {
        stream,
        recorder,
        chunks,
        playStartOffset: (performance.now() - recStart) / 1000 + playStartMs / 1000,
        autoStop,
      }
    } catch (e) {
      console.error("[lesson] mic failed:", e)
      setBubbleOverride("マイクが使えないみたい。ブラウザの設定を確認してね")
      setRecState("idle")
    }
  }

  const stopTake = () => {
    const m = mediaRef.current
    if (!m || m.recorder.state !== "recording") return
    m.recorder.stop()
  }

  const analyzeTake = async () => {
    const m = mediaRef.current
    if (!m) return
    setRecState("analyzing")
    try {
      const blob = new Blob(m.chunks)
      const buf = await blob.arrayBuffer()
      const ctx = new AudioContext()
      const audio = await ctx.decodeAudioData(buf)
      void ctx.close()
      // モノラル化 + 演奏開始(カウントイン終了)以降だけ切り出し
      const ch = audio.getChannelData(0)
      const startSample = Math.min(
        ch.length,
        Math.max(0, Math.floor(m.playStartOffset * audio.sampleRate)),
      )
      const samples = ch.subarray(startSample)
      const result = checkSound(samples, audio.sampleRate, expectedTimesRef.current)
      console.log("[lesson] soundCheck:", JSON.stringify(result))
      if (!result.pass) {
        setBubbleOverride("あれ?音がよく聞こえなかったみたい。もういちど、いっしょにやってみよう!")
        setRecState("idle")
        return
      }
      const res = await recordLessonPlay(practiceItemId, lessonId)
      if (!res.ok) {
        setBubbleOverride(res.error)
        setRecState("idle")
        return
      }
      const shown = Math.min(res.playCount, RUNS_REQUIRED)
      setPlays(shown)
      setRecState("idle")
      if (res.cleared) {
        setScreen("CLEAR")
        router.refresh() // 一覧の✓を最新化
      }
    } catch (e) {
      console.error("[lesson] analyze failed:", e)
      setBubbleOverride("うまく聞き取れなかった…もう一回だけお願い!")
      setRecState("idle")
    } finally {
      cleanupMedia()
    }
  }

  // ── 画面 ──────────────────────────────────────────────────────────
  // 2026-08-22 ダーク化 (補02〜11): カテゴリ色をやめ操作の紺一族に固定 (配色ルール 2026-08-16)
  const themeStyle = {
    "--theme": "#2b5bc4",
    "--theme-light": "rgba(255,255,255,.16)",
  } as React.CSSProperties

  // スライド2〜4の仮図解 (S1/S5の譜面はLessonScoreCardが担当)。間違い(❌)はFigMarkで
  // 統一するため、図解自体の cross(✕) は描かない
  const figSvg = (i: number): string => {
    const f = { ...lesson.figs[i - 1] } as BowFigOpts & FbFigOpts
    delete f.cross
    return lesson.figType === "bow"
      ? bowFig(f as BowFigOpts, theme.theme)
      : fbFig(f as FbFigOpts, theme.theme)
  }

  // 弓系レッスン(モーションを持つ技法)の運弓モーションid
  const bowMotionId = LESSON_MOTION_MAP[lesson.id] ?? null
  // S2(slide=1)・S5(slide=4)は運弓モーション2ビュー (v3.18・仕様書v1.2 §10-1)
  const motionId = (slide === 1 || slide === 4) && bowMotionId ? bowMotionId : null
  // S5(弓系)は二段: 上段=モーション/下段=譜面カード
  const twoTier = slide === 4 && !!motionId

  // S3(間違い)で見せる「別技法」の運弓(横から)。指定レッスンのみ (2026-07-13 Tetsuo指示)
  const S3_WRONG_MOTION: Record<string, string> = {
    staccato: "spiccato", // 間違い=跳ねてしまう(スピッカート)
    bow_staccato: "portato", // 間違い=つながってしまう(ポルタート)
    spiccato: "staccato", // 間違い=弦に乗ってしまう(スタッカート)
    ricochet: "staccato", // 間違い=1音ずつ返してしまう(スタッカート)
    portato: "staccato", // 間違い=切りすぎる(スタッカート)
    slur: "bow_staccato", // 間違い=1音ずつ切ってしまう(連続スピッカート)
  }
  // S3(間違い)で見せる「その技法自身のミスモーション」(横から)。指定レッスンのみ (2026-07-14 Tetsuo指示)
  //   別技法に倒れるのではなく、同じ技法の崩れた運弓を見せる (トレモロ=弓の位置が定まらない)
  const S3_MISTAKE_MOTION: Record<string, string> = {
    tremolo: "tremolo-unstable",
  }
  // S3/S4 の運弓(横から)イラスト:
  //   S4(コツ,slide3) = その技法自身の運弓(横から) — 全弓系motionレッスン共通
  //   S3(間違い,slide2) = 指定の別技法の運弓、または同技法のミスモーション(横から) — 指定レッスンのみ
  const sideMotionId =
    slide === 3 && bowMotionId
      ? bowMotionId
      : slide === 2 && S3_WRONG_MOTION[lesson.id]
        ? (LESSON_MOTION_MAP[S3_WRONG_MOTION[lesson.id]] ?? null)
        : slide === 2 && S3_MISTAKE_MOTION[lesson.id]
          ? S3_MISTAKE_MOTION[lesson.id]
          : null
  // S3で運弓指定が無い弓系は静止バイオリン+弓 (マークはFigMarkで付与)
  const staticFig = slide === 2 && !!bowMotionId && !sideMotionId
  // スライドのマーク: S3(間違い)=❌ / S4(コツ)=◯ (全レッスン共通)
  const slideMark: "cross" | "circle" | null =
    slide === 2 ? "cross" : slide === 3 ? "circle" : null

  // 左手ポジション移動モーション (2026-07-14 Tetsuo指示)。
  //   S2(体の使い方,slide1) と S4(コツ,slide3) = 正しい移動モーション
  //   S3(よくある間違い,slide2)              = ミスモーション(親指が取り残される)
  const POS_SHIFT: Record<string, string> = {
    pos2: "1st-2nd",
    pos3: "1st-3rd",
    pos4: "1st-4th",
    pos5: "1st-5th",
    pos6: "1st-5th-6th", // 6th は 5th を経由 (手はネック裏のまま指だけ伸ばす)
  }
  const POS_MISTAKE: Record<string, string> = {
    pos2: "miss-1st-2nd",
    pos3: "miss-1st-3rd",
    pos4: "miss-1st-4th",
    pos5: "miss-1st-4th", // 5th/6thのミスは構造上作れないため4thのミスを流用
    pos6: "miss-1st-4th",
  }
  // S2(体の使い方,slide1)/S4(コツ,slide3)/S5(成功の感覚,slide4) = 正しい移動モーション
  const posShiftId = slide === 1 || slide === 3 || slide === 4 ? POS_SHIFT[lesson.id] : undefined
  const posMistakeId = slide === 2 ? POS_MISTAKE[lesson.id] : undefined

  // トリル/グリッサンド: S3(よくあるまちがい,slide2)/S4(コツ,slide3) にモーション
  // (2026-07-14 Tetsuo指示)。トリル: S3=立て指(raised) / S2(下の指は置いたまま)とS4(コツ)=浮かせ指(hover)
  const trillLift: "raised" | "hover" | null =
    lesson.id === "trill"
      ? slide === 2
        ? "raised"
        : slide === 1 || slide === 3
          ? "hover"
          : null
      : null
  // グリッサンド: S2(腕ごと運ぶ)=コツと同一(倍速) / S3=速度ムラ(uneven) / S4=倍速(fast)
  const glissId: string | null =
    lesson.id === "glissando"
      ? slide === 1 || slide === 3
        ? "6th-1st-fast"
        : slide === 2
          ? "6th-1st-uneven"
          : null
      : null
  // ビブラート: S2(体の使い方)/S4(コツ)=正解(手と指が一緒に揺れる) / S3(間違い)=手が固まって指だけ滑る
  const vibratoId: string | null =
    lesson.id === "vibrato"
      ? slide === 1 || slide === 3
        ? "3rd-ok"
        : slide === 2
          ? "3rd-stiff-hand"
          : null
      : null
  // 装飾音(プラルトリラー+モルデント): 1レッスン2技術のため1スライドに両方を横並び表示。
  //   S2(体の使い方)/S4(コツ)=正解(ok) / S3(間違い)=指を立てて装飾がもたつく(slow)
  const ornamentKind: "ok" | "slow" | null =
    lesson.id === "mordent"
      ? slide === 1 || slide === 3
        ? "ok"
        : slide === 2
          ? "slow"
          : null
      : null

  // 指板俯瞰図 (fingerboard パッケージ・13レッスン)。lesson.id → fingerboard id (2026-07-15 Tetsuo指示)
  const FB_LESSON_MAP: Record<string, string> = {
    pos2: "pos-2nd", pos3: "pos-3rd", pos4: "pos-4th", pos5: "pos-5th", pos6: "pos-6th",
    glissando: "glissando", harmonics: "harmonics", mordent: "ornament",
    ds3: "double-3rd", ds6: "double-6th", ds8: "double-octave", ds10: "double-10th", ds_seq: "double-series",
  }
  const DOUBLE_STOP_FB = new Set(["ds3", "ds6", "ds8", "ds10", "ds_seq"])
  const fbId = FB_LESSON_MAP[lesson.id] ?? null
  // 重音(縦型): S4(コツ,slide3) と S2(体の使い方,slide1) に指板俯瞰図(正解)。
  //   S2はコツと同一(2026-07-15 Tetsuo指示)。S2はマークなし/S4は◯。
  const fbCoachId = fbId && DOUBLE_STOP_FB.has(lesson.id) && (slide === 1 || slide === 3) ? fbId : null
  // 重音(縦型): S3(よくある間違い,slide2)にミス図=pull(引っ張られて音程が潰れる)。本文「音程がくずれる」と一致
  const fbMissId = fbId && DOUBLE_STOP_FB.has(lesson.id) && slide === 2 ? fbId : null
  // 非重音(横長): S1(これは何,slide0)に譜面と併記
  const fbIntroId = fbId && !DOUBLE_STOP_FB.has(lesson.id) && slide === 0 ? fbId : null
  // ポジション移動 S4(コツ,slide3)/S5(成功の感覚,slide4): 移動モーション+指板俯瞰図を併記 (2026-07-15 Tetsuo指示)
  const posFbId = posShiftId && (slide === 3 || slide === 4) ? (FB_LESSON_MAP[lesson.id] ?? null) : null
  // ハーモニクス左手図(1/2点・4th・4の指): S2(体の使い方)/S4(コツ)=正しい接触 / S3(間違い)=押さえすぎ (2026-07-15 Tetsuo指示)
  //   ※押さえすぎ図は図自身に✗と「押さえすぎ」注釈を持つ。正解S4のみ◯を重ねる。
  const harmonicKind: "ok" | "mistake" | null =
    lesson.id === "harmonics"
      ? slide === 1 || slide === 3
        ? "ok"
        : slide === 2
          ? "mistake"
          : null
      : null

  const playBubble =
    bubbleOverride ??
    (plays > 0
      ? FEEDBACK(lesson.name)[Math.min(plays - 1, 2)]
      : `このフレーズを3回いっしょに弾こう。点数は気にしなくていいよ!`)

  return (
    <div className={styles.stage}>
      <div className={styles.frame} style={themeStyle}>
        {screen === "INTRO" && (
          <div className={`${styles.pl} ${styles.plIntro}`}>
            <button
              type="button"
              className={`${styles.backC} ${styles.backCLight}`}
              onClick={() => router.push(listHref)}
            >
              &lt;
            </button>
            {/* アルコちゃんを上部中央に大きく (2026-07-13 Tetsuo指示) */}
            <div className={styles.introChar}>
              <ArcoChan plain pose={POSE_BY_ID["05B"]} />
            </div>
            <div className={styles.introGreet}>
              <b>{lesson.name}</b>
              {alreadyCleared
                ? "のレッスンだよ。復習はいつでも大歓迎!"
                : "っていう技術を、まず僕といっしょにやってみようか!"}
            </div>
            <div className={`${styles.plScore} ${styles.plScoreIntro}`}>
              <LessonScoreCard buildUrl={buildUrl} lessonId={lessonId} hi />
            </div>
            <div className={styles.ctaWrap}>
              <button
                type="button"
                className={styles.cta}
                onClick={() => {
                  setSlide(0)
                  setScreen("SLIDE")
                }}
              >
                レッスンをはじめる
              </button>
            </div>
          </div>
        )}

        {screen === "SLIDE" && (
          <div className={styles.slide}>
            <button
              type="button"
              className={styles.backC}
              onClick={() => (slide > 0 ? setSlide(slide - 1) : setScreen("INTRO"))}
            >
              &lt;
            </button>
            <div className={styles.sTitle}>{lesson.name}</div>
            {motionId ? (
              <div className={`${styles.figCard} ${twoTier ? styles.figCardTwoTier : ""}`}>
                <LessonBowingMotion motionId={motionId} />
              </div>
            ) : sideMotionId ? (
              // S3=別技法の運弓 / S4=自技法の運弓 (横から単独)。奏法差を動きで見せる + ❌/◯
              <div className={styles.figCard}>
                <LessonBowingMotion motionId={sideMotionId} view="side" />
                <FigMark kind={slideMark} />
              </div>
            ) : staticFig ? (
              // S3(間違い)で運弓指定が無い弓系 = 静止バイオリン+弓 + ❌
              <div className={styles.figCard}>
                <LessonBowingStatic />
                <FigMark kind={slideMark} />
              </div>
            ) : posShiftId ? (
              posFbId ? (
                // S4(コツ)/S5(成功の感覚): 移動モーション(上) + 指板俯瞰図(下) 併記 (S4は◯/S5はマークなし)
                <>
                  <div className={`${styles.figCard} ${styles.fbCoachMotion}`}>
                    <LessonPositionShift shift={posShiftId} />
                    <FigMark kind={slideMark} />
                  </div>
                  <div className={`${styles.figCard} ${styles.fbCoachBoard}`}>
                    <LessonFingerboard lesson={posFbId} />
                  </div>
                </>
              ) : (
                // 左手ポジション移動: S2(体の使い方) = 正しい移動モーション
                <div className={styles.figCard}>
                  <LessonPositionShift shift={posShiftId} />
                  <FigMark kind={slideMark} />
                </div>
              )
            ) : posMistakeId ? (
              // 左手ポジション移動: S3(よくある間違い) = ミスモーション + ❌
              <div className={styles.figCard}>
                <LessonPositionMistake shift={posMistakeId} />
                <FigMark kind={slideMark} />
              </div>
            ) : trillLift ? (
              // トリル: S3(間違い)=立て指 / S4(コツ)=浮かせ指 + ❌/◯
              <div className={styles.figCard}>
                <LessonTrill trill="0-1" liftStyle={trillLift} />
                <FigMark kind={slideMark} />
              </div>
            ) : glissId ? (
              // グリッサンド: S3(間違い)=速度ムラ / S4(コツ)=倍速 + ❌/◯
              <div className={styles.figCard}>
                <LessonGlissando glissando={glissId} />
                <FigMark kind={slideMark} />
              </div>
            ) : vibratoId ? (
              // ビブラート: S3(間違い)=手が固まって指だけ滑る / S2・S4=手と指が一緒に揺れる + ❌/◯
              <div className={styles.figCard}>
                <LessonVibrato vibrato={vibratoId} />
                <FigMark kind={slideMark} />
              </div>
            ) : ornamentKind ? (
              // 装飾音: プラルトリラー+モルデントを横並び。S3(間違い)=slow / S2・S4=ok + ❌/◯
              <div className={styles.figCard}>
                <LessonOrnament kind={ornamentKind} />
                <FigMark kind={slideMark} />
              </div>
            ) : fbIntroId ? (
              // 非重音レッスン S1「これは何」: 上=課題フレーズ(緑丸) / 下=指板俯瞰図(横長) 併記
              <>
                <div className={`${styles.figCard} ${styles.fbIntroScore}`}>
                  <LessonScoreCard buildUrl={buildUrl} lessonId={lessonId} hi />
                </div>
                <div className={`${styles.figCard} ${styles.fbIntroBoard}`}>
                  <LessonFingerboard lesson={fbIntroId} />
                </div>
              </>
            ) : fbMissId ? (
              // 重音レッスン S3「よくある間違い」: 指板俯瞰図ミス(縦型・pull=音程が潰れる) + ❌
              <div className={`${styles.figCard} ${styles.fbCoachCard}`}>
                <LessonFingerboard lesson={fbMissId} miss="pull" />
                <FigMark kind={slideMark} />
              </div>
            ) : fbCoachId ? (
              // 重音レッスン S4「コツ」: 指板俯瞰図(縦型)に差し替え + ◯
              <div className={`${styles.figCard} ${styles.fbCoachCard}`}>
                <LessonFingerboard lesson={fbCoachId} />
                <FigMark kind={slideMark} />
              </div>
            ) : harmonicKind ? (
              // ハーモニクス: S2/S4=正しい接触(軽く触れる) / S3=押さえすぎ(図自身に✗) + S4は◯
              <div className={styles.figCard}>
                <LessonHarmonics mistake={harmonicKind === "mistake"} />
                {harmonicKind === "ok" && <FigMark kind={slideMark} />}
              </div>
            ) : slide === 0 || slide === 4 ? (
              // S1=課題フレーズ+緑丸 / S5(非弓系)=課題フレーズ(緑丸なし・v3.18準拠)
              <div className={styles.figCard}>
                <LessonScoreCard buildUrl={buildUrl} lessonId={lessonId} hi={slide === 0} />
              </div>
            ) : (
              // S2〜S4の仮図解 (左手系/重音系/ピチカート)。S3=❌ / S4=◯ を重ねる
              <div className={styles.figCard}>
                <div style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: figSvg(slide) }} />
                <FigMark kind={slideMark} />
              </div>
            )}
            {twoTier && (
              <div className={styles.scoreCard}>
                <LessonScoreCard buildUrl={buildUrl} lessonId={lessonId} hi={false} />
              </div>
            )}
            <div className={styles.sheet}>
              <div className={styles.term}>
                <div className={styles.termTile}>
                  <ArcoChan plain pose={POSE_BY_ID[SLIDE_POSES[slide]]} />
                </div>
                <div className={styles.termLbl}>{lesson.terms[slide]}</div>
              </div>
              {slide === 0 && (
                <button type="button" className={styles.playBtn} onClick={() => void toggleExemplar()}>
                  {exemplarPlaying ? "■ 停止" : "▶ お手本をきく"}
                </button>
              )}
              <div
                className={styles.desc}
                dangerouslySetInnerHTML={{ __html: lesson.texts[slide] }}
              />
            </div>
            <div className={styles.pager}>{slide + 1} / 5</div>
            <div className={styles.navRow}>
              <button
                type="button"
                className={`${styles.navBtn} ${styles.navPrev}`}
                onClick={() => (slide > 0 ? setSlide(slide - 1) : setScreen("INTRO"))}
              >
                もどる
              </button>
              <button
                type="button"
                className={`${styles.navBtn} ${styles.navNext}`}
                onClick={() => (slide < 4 ? setSlide(slide + 1) : setScreen("PLAY"))}
              >
                {slide === 4 ? "弾いてみる!" : "次へ"}
              </button>
            </div>
          </div>
        )}

        {screen === "PLAY" && (
          <div className={styles.pl}>
            <button
              type="button"
              className={`${styles.backC} ${styles.backCLight}`}
              onClick={() => {
                cleanupMedia()
                setRecState("idle")
                setSlide(4)
                setScreen("SLIDE")
              }}
            >
              &lt;
            </button>
            <div className={styles.plHead}>弾いてみよう</div>
            <div className={styles.dots}>
              {[0, 1, 2].map((i) => (
                <div key={i} className={`${styles.dot} ${i < plays ? styles.dotOn : ""}`} />
              ))}
            </div>
            <div className={styles.qa}>
              <div className={styles.avatar}>
                <ArcoChan
                  plain
                  pose={
                    POSE_BY_ID[
                      recState === "rec" || recState === "analyzing"
                        ? "08B"
                        : plays > 0
                          ? "06A"
                          : "05A"
                    ]
                  }
                />
              </div>
              <div className={styles.bubble}>{playBubble}</div>
            </div>
            <div className={styles.plScore}>
              <div ref={osmdHostRef} className={styles.osmdBox} />
              {!osmdReady && <span style={{ fontSize: "1.6cqh", color: "var(--text-muted)" }}>楽譜を準備中…</span>}
            </div>
            <div className={styles.tempoLbl}>
              ♩= {guideBpm} ・ カウント{COUNT_IN_BEATS}拍のあとにスタート(採点はしないよ)
            </div>
            {recState === "counting" && <div className={styles.countNum}>{countNum || "♪"}</div>}
            {recState !== "counting" && (
              <button
                type="button"
                className={`${styles.recBtn} ${recState === "rec" ? styles.recActive : ""}`}
                disabled={recState === "analyzing" || !osmdReady}
                onClick={() => (recState === "idle" ? void startTake() : stopTake())}
              >
                <div className={styles.recCore} />
              </button>
            )}
            <div className={styles.recLbl}>
              {recState === "rec"
                ? "演奏中… 弾き終わったらもう一度押してね"
                : recState === "analyzing"
                  ? "アルコが聴いてるよ…"
                  : recState === "counting"
                    ? "カウントイン…"
                    : "ボタンを押すとカウントインが始まるよ"}
            </div>
          </div>
        )}

        {screen === "CLEAR" && (
          <div className={styles.clr}>
            <div className={styles.bigChar}>
              <ArcoChan plain pose={POSE_BY_ID["06B"]} />
            </div>
            <div className={styles.clrTitle}>{lesson.name}を習得!</div>
            <div className={styles.clrSub}>
              3回弾けたね。ここからは曲やエチュードの中でみがいていこう。いつでも戻ってこられるよ。
            </div>
            <div className={styles.clrBtns}>
              {returnUrl ? (
                <>
                  <button
                    type="button"
                    className={styles.cta}
                    onClick={() => router.push(returnUrl)}
                  >
                    曲にもどる
                  </button>
                  <button
                    type="button"
                    className={`${styles.cta} ${styles.ctaGhost}`}
                    onClick={() => router.push(listHref)}
                  >
                    レッスン一覧へ
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className={styles.cta}
                  onClick={() => router.push(listHref)}
                >
                  レッスン一覧へ
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// 参考: SOUND_CHECK_PARAMS はここから調整 (窓±0.4s / カバー率70% は仮値)
void SOUND_CHECK_PARAMS
