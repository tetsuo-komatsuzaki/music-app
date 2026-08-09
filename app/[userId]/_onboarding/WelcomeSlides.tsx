"use client"

import { useState, useEffect, ReactNode } from "react"
import { createPortal } from "react-dom"
import { useParams, useRouter } from "next/navigation"
import { SLIDES, Slide, SlideVisual } from "./content/slides"
import { useOnboarding } from "./hooks/useOnboarding"
import { ArcoChan, POSES } from "@/app/components/ArcoChan"
import styles from "./styles/WelcomeSlides.module.css"

// アルコちゃんの pose カテゴリ解決 (モーション付きイラスト)
const ARCO_POSE = {
  greet: POSES.find((p) => p.cat === "指差し") ?? POSES[0],
  point: POSES.find((p) => p.cat === "指差し") ?? POSES[0],
  joy: POSES.find((p) => p.cat === "喜び") ?? POSES[0],
}

type Props = {
  /** ヘルプモーダルから明示的に再生する場合に true */
  forceOpen?: boolean
  onClose?: () => void
}

// 譜面マーカーの色 (凡例 & 音符の評価色)
const MARK_COLORS = [
  { key: "green",  label: "ばっちり" },
  { key: "red",    label: "音程" },
  { key: "orange", label: "リズム" },
] as const
const MK_FILL: Record<string, [string, string]> = {
  green: ["#6fdc7e", "#2fae52"],
  red: ["#ff8a80", "#e5392b"],
  orange: ["#ffc16b", "#f08a1d"],
}
// 譜面上の音符 [x, y, 評価色] (グレー=拾えずはガイドに出さない)
const EVAL_NOTES: ReadonlyArray<readonly [number, number, string]> = [
  [40, 74, "green"], [74, 62, "green"], [108, 68, "orange"], [142, 56, "green"],
  [176, 74, "red"], [210, 62, "green"], [244, 68, "green"],
]
const TREND_DOTS: ReadonlyArray<readonly [number, number, number]> = [
  [22, 112, 0.3], [68, 104, 0.6], [114, 86, 0.9], [160, 62, 1.1],
]
const STAMP_V = ["", "v2", "v3"] as const

const NoteGlyph = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
    <path d="M9 18V6l9-2v12" />
    <circle cx="6.5" cy="18" r="2.6" fill="#fff" stroke="none" />
    <circle cx="15.5" cy="16" r="2.6" fill="#fff" stroke="none" />
  </svg>
)
const Sparkle = () => (
  <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden>
    <path d="M10 0l2.3 7.7L20 10l-7.7 2.3L10 20l-2.3-7.7L0 10l7.7-2.3z" fill="#f7c948" />
  </svg>
)

function renderVisual(visual: SlideVisual): ReactNode {
  switch (visual.type) {
    case "arco":
      return (
        <div className={styles.arcoVisual}>
          <div className={styles.arcoGlow} aria-hidden />
          <div className={styles.arcoFig}>
            <ArcoChan pose={ARCO_POSE[visual.pose]} />
          </div>
        </div>
      )

    case "dreamSong":
      return (
        <div className={styles.songwrap}>
          <span className={`${styles.spk} ${styles.spkA}`}><Sparkle /></span>
          <span className={`${styles.spk} ${styles.spkB}`}><Sparkle /></span>
          <span className={`${styles.spk} ${styles.spkC}`}><Sparkle /></span>
          <div className={styles.songCard}>
            <div className={styles.scover}><NoteGlyph /></div>
            <div className={styles.sinfo}>
              <div className={styles.stitle}>{visual.title}</div>
              <div className={styles.scomp}>{visual.composer}</div>
              <span className={styles.wantTag}>♡ いつか弾きたい</span>
            </div>
            <div className={styles.gaze}><ArcoChan pose={ARCO_POSE.greet} /></div>
          </div>
        </div>
      )

    case "scoreEval":
      return (
        <div className={styles.scoreEval}>
          <svg viewBox="0 0 284 100" fill="none">
            <defs>
              {Object.entries(MK_FILL).map(([k, [a, b]]) => (
                <radialGradient key={k} id={`mk_${k}`} cx="35%" cy="30%">
                  <stop offset="0" stopColor={a} />
                  <stop offset="1" stopColor={b} />
                </radialGradient>
              ))}
            </defs>
            <g stroke="#d6dee6" strokeWidth="1.4">
              {[44, 54, 64, 74, 84].map((y) => <line key={y} x1="16" y1={y} x2="268" y2={y} />)}
            </g>
            {EVAL_NOTES.map(([x, y, c], i) => (
              <g key={i}>
                <line x1={x + 6} y1={y} x2={x + 6} y2={y - 28} stroke="#3a3a3a" strokeWidth="2" />
                <ellipse cx={x} cy={y} rx="6.5" ry="5" fill="#3a3a3a" transform={`rotate(-18 ${x} ${y})`} />
                <circle
                  className={styles.mk}
                  style={{ animationDelay: `${(0.3 + i * 0.13).toFixed(2)}s` }}
                  cx={x} cy="22" r="5.8" fill={`url(#mk_${c})`}
                />
              </g>
            ))}
          </svg>
          <div className={styles.miniLeg}>
            {MARK_COLORS.map((m) => (
              <span key={m.key}><i data-c={m.key} />{m.label}</span>
            ))}
          </div>
        </div>
      )

    case "resultScreen":
      return (
        <div className={styles.rscreen}>
          <div className={styles.rhero}>
            <div className={styles.rarco}><ArcoChan pose={ARCO_POSE.joy} /></div>
            <div className={styles.rbubble}>いい演奏！あと少しで完璧だね。</div>
          </div>
          <div className={styles.rcard}>
            <div className={styles.rbig}>
              <span className={styles.rnum}>88</span>
              <span className={styles.runit}>点</span>
              <span className={styles.rbadge}>A</span>
            </div>
            <div className={styles.rsubs}>
              <div className={styles.rsub}><span>音程</span><b>92</b></div>
              <div className={styles.rsub}><span>リズム</span><b>84</b></div>
            </div>
          </div>
          <div className={styles.rsec}>
            <div className={styles.rsecH}>おすすめ練習</div>
            <div className={styles.rrec}>
              <span className={`${styles.rtag} ${styles.tagRhythm}`}>リズム</span>
              <span className={styles.rrb}>
                <span className={styles.rrs}>3小節目が少し早い</span>
                <span className={styles.rrm}>付点のリズム練習</span>
              </span>
            </div>
            <div className={styles.rrec}>
              <span className={`${styles.rtag} ${styles.tagPitch}`}>音程</span>
              <span className={styles.rrb}>
                <span className={styles.rrs}>学びのレッスン</span>
                <span className={styles.rrm}>スラー：なめらかな弓</span>
              </span>
            </div>
          </div>
        </div>
      )

    case "lesson":
      return (
        <div className={styles.lcard}>
          <div className={styles.lArco}><ArcoChan pose={ARCO_POSE.point} /></div>
          <div className={styles.lbody}>
            <span className={styles.lbadge}>学びのレッスン</span>
            <div className={styles.lmsg}>
              スラーやビブラート…新しい技術は、アルコと基礎から。身につけば、あの曲もぐっと近づく。
            </div>
          </div>
        </div>
      )

    case "rankTrend":
      return (
        <div className={styles.trend}>
          <svg viewBox="0 0 260 142" fill="none">
            <defs>
              <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#e6a94a" stopOpacity="0.30" />
                <stop offset="1" stopColor="#e6a94a" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M22,112 L68,104 L114,86 L160,62 L206,32 L206,128 L22,128 Z" fill="url(#tg)" />
            <polyline
              className={styles.tline}
              points="22,112 68,104 114,86 160,62 206,32"
              stroke="#d19a2b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
            />
            <g fill="#d19a2b">
              {TREND_DOTS.map(([x, y, d], i) => (
                <circle key={i} className={styles.tdot} style={{ animationDelay: `${d}s` }} cx={x} cy={y} r="3.4" />
              ))}
            </g>
            <circle className={styles.tnow} cx="206" cy="32" r="7.5" fill="#f7c948" stroke="#fff" strokeWidth="2.5" />
            <text x="20" y="126" fontSize="10" fill="#9aa5b0" fontWeight="700">☆1</text>
            <text x="196" y="20" fontSize="11" fill="#c98f10" fontWeight="900">☆3</text>
          </svg>
          <span className={styles.rankupTag}>☆2 → ☆3 <span>ランクUP！</span></span>
        </div>
      )

    case "mastered":
      return (
        <div className={styles.shelfwrap}>
          <div className={styles.shelf}>
            {Array.from({ length: 8 }, (_, k) => {
              const done = k < 6
              const variant = done ? STAMP_V[k % 3] : ""
              return (
                <div
                  key={k}
                  className={`${styles.stamp} ${done ? (variant ? styles[variant] : "") : styles.locked}`}
                  style={{ animationDelay: `${(k * 0.08).toFixed(2)}s` }}
                >
                  {done && <><NoteGlyph /><span className={styles.ck} /></>}
                </div>
              )
            })}
          </div>
          <div className={styles.mcount}><b>12</b>曲マスター</div>
        </div>
      )
  }
}

export default function WelcomeSlides({ forceOpen, onClose }: Props) {
  const params = useParams<{ userId: string }>()
  const userId = (params?.userId as string) ?? ""
  const router = useRouter()
  const {
    isHydrated,
    welcomeSlidesShown,
    allGuidesDismissed,
    markWelcomeSlidesShown,
  } = useOnboarding()

  const [index, setIndex] = useState(0)

  // 開閉判定
  const shouldAutoOpen = !welcomeSlidesShown && !allGuidesDismissed
  const isOpen = forceOpen ?? shouldAutoOpen

  // forceOpen が変わったら index を 0 にリセット
  useEffect(() => {
    if (isOpen) setIndex(0)
  }, [isOpen, forceOpen])

  // SSR / Hydration ガード
  if (!isHydrated) return null
  if (typeof document === "undefined") return null
  if (!isOpen) return null

  const slide: Slide = SLIDES[index]
  const isLast = index === SLIDES.length - 1
  const isFirst = index === 0

  const handleClose = () => {
    markWelcomeSlidesShown()
    onClose?.()
  }

  const handleNext = () => {
    if (isLast) {
      handleClose()
      return
    }
    setIndex(i => i + 1)
  }

  const handlePrev = () => {
    if (isFirst) return
    setIndex(i => i - 1)
  }

  const handleSkip = () => {
    handleClose()
  }

  // 最終スライド完了: ホームへ着地させ、そこからコーチガイドを始めさせる。
  // welcomeSlidesShown が true になるので、ホームのコーチマークが
  // 「はじめてガイド完了後」の条件を満たして表示される (PageCoachMarks 側で判定)。
  const handleStart = () => {
    markWelcomeSlidesShown()
    onClose?.()
    router.push(userId ? `/${userId}` : "/")
  }

  return createPortal(
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-slide-headline"
    >
      <div className={styles.dialog}>
        <div className={styles.body} key={slide.id}>
          <div className={styles.visualArea}>{renderVisual(slide.visual)}</div>
          <h2 id="welcome-slide-headline" className={styles.headline}>
            {slide.headline}
          </h2>
          {slide.subhead && (
            <p className={styles.subhead}>{slide.subhead}</p>
          )}
          {slide.body && (
            <p className={styles.bodyText}>{slide.body}</p>
          )}
        </div>

        <div className={styles.progress} aria-hidden="true">
          {SLIDES.map((s, i) => (
            <div
              key={s.id}
              className={`${styles.progressDot} ${i === index ? styles.progressDotActive : ""}`}
            />
          ))}
        </div>

        {slide.cta.type === "start" ? (
          <>
            <button
              type="button"
              className={styles.dualCtaPrimary}
              onClick={handleStart}
            >
              {slide.cta.label}
            </button>
            <div className={styles.footer}>
              <div className={styles.footerLeft}>
                <button
                  type="button"
                  className={styles.navButton}
                  onClick={handlePrev}
                  disabled={isFirst}
                >
                  戻る
                </button>
              </div>
              <div className={styles.footerRight} />
            </div>
          </>
        ) : (
          <div className={styles.footer}>
            <div className={styles.footerLeft}>
              <button
                type="button"
                className={styles.skipButton}
                onClick={handleSkip}
              >
                スキップ
              </button>
            </div>
            <div className={styles.footerRight}>
              <button
                type="button"
                className={styles.navButton}
                onClick={handlePrev}
                disabled={isFirst}
              >
                戻る
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleNext}
              >
                次へ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
