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
import LessonScoreCard from "./LessonScoreCard"
import styles from "../lessons.module.css"

type Screen = "INTRO" | "SLIDE" | "PLAY" | "CLEAR"
type RecState = "idle" | "counting" | "rec" | "analyzing"

const RUNS_REQUIRED = 3
const COUNT_IN_BEATS = 4
/** スライドの用語タイルに出すアルコのポーズ (プロト準拠) */
const SLIDE_POSES = ["07B", "05A", "04A", "01A", "02A"] as const

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
  const themeStyle = {
    "--theme": theme.theme,
    "--theme-light": theme.light,
  } as React.CSSProperties

  // スライド2〜4の仮図解 (S1/S5の譜面はLessonScoreCardが担当)
  const figSvg = (i: number): string => {
    const f = lesson.figs[i - 1]
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
  // S3(よくある間違い)・S4(コツ)も弓系はモーションと同じバイオリン+弓の静止図に統一
  // (2026-07-12 Tetsuo指示)。slide2=間違い(✕)/slide3=コツ(矢印)
  const staticMark: "cross" | "hint" | null =
    bowMotionId && slide === 2 ? "cross" : bowMotionId && slide === 3 ? "hint" : null
  // レッスンごとにS3(間違い)/S4(コツ)を「別技法の運弓(横から)」で見せる指定
  // (2026-07-13 Tetsuo指示)。値=技法id。例: スタッカートの間違い=スピッカート運弓
  const S3S4_SIDE_MOTION: Record<string, { s3: string; s4: string }> = {
    staccato: { s3: "spiccato", s4: "staccato" }, // 間違い=跳ねる(スピッカート)/成功=乗せて止める(スタッカート)
  }
  const sideOverride = S3S4_SIDE_MOTION[lesson.id]
  const sideMotionId =
    sideOverride && slide === 2
      ? (LESSON_MOTION_MAP[sideOverride.s3] ?? null)
      : sideOverride && slide === 3
        ? (LESSON_MOTION_MAP[sideOverride.s4] ?? null)
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
          <div className={styles.pl}>
            <button
              type="button"
              className={`${styles.backC} ${styles.backCLight}`}
              onClick={() => router.push(listHref)}
            >
              &lt;
            </button>
            <div className={`${styles.qa} ${styles.qaIntro}`}>
              <div className={styles.avatar}>
                <ArcoChan pose={POSE_BY_ID["05B"]} />
              </div>
              <div className={styles.bubble}>
                <b>{lesson.name}</b>
                {alreadyCleared
                  ? "のレッスンだよ。復習はいつでも大歓迎!"
                  : "っていう技術を、まず僕といっしょにやってみようか!"}
              </div>
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
              // レッスン指定のS3/S4 = 別技法の運弓(横から単独)。奏法差(跳ね/乗せ)を動きで見せる
              <div className={styles.figCard}>
                <LessonBowingMotion motionId={sideMotionId} view="side" />
              </div>
            ) : staticMark ? (
              // 弓系のS3(間違い)/S4(コツ) = モーションと同じバイオリン+弓の静止図
              <div className={styles.figCard}>
                <LessonBowingStatic mark={staticMark} />
              </div>
            ) : slide === 0 || slide === 4 ? (
              // S1=課題フレーズ+緑丸 / S5(非弓系)=課題フレーズ(緑丸なし・v3.18準拠)
              <div className={styles.figCard}>
                <LessonScoreCard buildUrl={buildUrl} lessonId={lessonId} hi={slide === 0} />
              </div>
            ) : (
              <div
                className={styles.figCard}
                dangerouslySetInnerHTML={{ __html: figSvg(slide) }}
              />
            )}
            {twoTier && (
              <div className={styles.scoreCard}>
                <LessonScoreCard buildUrl={buildUrl} lessonId={lessonId} hi={false} />
              </div>
            )}
            <div className={styles.sheet}>
              <div className={styles.term}>
                <div className={styles.termTile}>
                  <ArcoChan pose={POSE_BY_ID[SLIDE_POSES[slide]]} />
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
              {!osmdReady && <span style={{ fontSize: "1.6cqh", color: "#afafaf" }}>楽譜を準備中…</span>}
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
              <ArcoChan pose={POSE_BY_ID["06B"]} />
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
