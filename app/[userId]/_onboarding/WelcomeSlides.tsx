"use client"

import { useState, useEffect, ReactNode } from "react"
import { createPortal } from "react-dom"
import { useParams, useRouter } from "next/navigation"
import { SLIDES, Slide, SlideVisual } from "./content/slides"
import { useOnboarding } from "./hooks/useOnboarding"
import styles from "./styles/WelcomeSlides.module.css"

type Props = {
  /** ヘルプモーダルから明示的に再生する場合に true */
  forceOpen?: boolean
  onClose?: () => void
}

const COLOR_LEGEND_ITEMS = [
  { emoji: "🟢", name: "緑",       meaning: "OK",                     bg: "#e8f7e9" },
  { emoji: "🔴", name: "赤",       meaning: "音程ズレ",               bg: "#fdecea" },
  { emoji: "🟠", name: "オレンジ", meaning: "タイミングズレ",          bg: "#fef4e8" },
  { emoji: "⚪", name: "灰色",     meaning: "検出できず",              bg: "#f0f0f0" },
] as const

function renderVisual(visual: SlideVisual): ReactNode {
  switch (visual.type) {
    case "hero":
      return (
        <div className={styles.heroVisual}>
          <span className={styles.heroEmoji} aria-hidden>{visual.emoji}</span>
        </div>
      )
    case "options":
      return (
        <div className={styles.optionsVisual}>
          <div className={styles.optionCard}>
            <span className={styles.optionEmoji} aria-hidden>{visual.left.emoji}</span>
            <span className={styles.optionLabel}>{visual.left.label}</span>
          </div>
          <span className={styles.optionsConnector} aria-hidden>or</span>
          <div className={styles.optionCard}>
            <span className={styles.optionEmoji} aria-hidden>{visual.right.emoji}</span>
            <span className={styles.optionLabel}>{visual.right.label}</span>
          </div>
        </div>
      )
    case "flow": {
      const elements: ReactNode[] = []
      visual.steps.forEach((step, i) => {
        elements.push(
          <div key={`step-${i}`} className={styles.flowStep}>
            <span className={styles.flowEmoji} aria-hidden>{step.emoji}</span>
            <span className={styles.flowLabel}>{step.label}</span>
          </div>
        )
        if (i < visual.steps.length - 1) {
          elements.push(
            <span key={`arrow-${i}`} className={styles.flowArrow} aria-hidden>→</span>
          )
        }
      })
      return <div className={styles.flowVisual}>{elements}</div>
    }
    case "colorLegend":
      return (
        <div className={styles.legendVisual}>
          {COLOR_LEGEND_ITEMS.map(item => (
            <div
              key={item.name}
              className={styles.legendRow}
              style={{ background: item.bg }}
            >
              <span className={styles.legendDot} aria-hidden>{item.emoji}</span>
              <span className={styles.legendName}>{item.name}</span>
              <span className={styles.legendMeaning}>{item.meaning}</span>
            </div>
          ))}
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

  const handleDualCta = (pathTemplate: string) => {
    const fullPath = userId ? `/${userId}${pathTemplate}` : pathTemplate
    markWelcomeSlidesShown()
    onClose?.()
    router.push(fullPath)
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

        {slide.cta.type === "dual" ? (
          <>
            <div className={styles.dualCta}>
              <button
                type="button"
                className={styles.dualCtaPrimary}
                onClick={() => handleDualCta(slide.cta.type === "dual" ? slide.cta.primary.pathTemplate : "/")}
              >
                {slide.cta.type === "dual" ? slide.cta.primary.label : ""}
              </button>
              <button
                type="button"
                className={styles.dualCtaSecondary}
                onClick={() => handleDualCta(slide.cta.type === "dual" ? slide.cta.secondary.pathTemplate : "/")}
              >
                {slide.cta.type === "dual" ? slide.cta.secondary.label : ""}
              </button>
            </div>
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
              <div className={styles.footerRight}>
                <button
                  type="button"
                  className={styles.skipButton}
                  onClick={handleClose}
                >
                  閉じる
                </button>
              </div>
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
