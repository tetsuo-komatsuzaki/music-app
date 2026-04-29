"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { useParams, useRouter } from "next/navigation"
import { SLIDES, Slide } from "./content/slides"
import { useOnboarding } from "./hooks/useOnboarding"
import styles from "./styles/WelcomeSlides.module.css"

type Props = {
  /** ヘルプモーダルから明示的に再生する場合に true */
  forceOpen?: boolean
  onClose?: () => void
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
    // forceOpen 経由でも自動表示でも、welcomeSlidesShown は markWelcomeSlidesShown で必ず立てる
    // (既に true なら no-op、false なら true に遷移)
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
    // F1 修正: pathTemplate は相対パス、userId を runtime に付与
    const fullPath = userId ? `/${userId}${pathTemplate}` : pathTemplate
    markWelcomeSlidesShown()
    onClose?.()
    router.push(fullPath)
  }

  const renderBody = () => {
    // スライド 4 のマーカー凡例は body 内の絵文字つきテキストで表現済み
    // visual な表組みも併設すると説明力が上がるため、slide.id === 4 のときは凡例表も追加
    if (slide.id === 4) {
      const legend = [
        { color: "🟢", name: "緑",       meaning: "OK" },
        { color: "🔴", name: "赤",       meaning: "音程がズレた" },
        { color: "🟠", name: "オレンジ", meaning: "タイミングがズレた" },
        { color: "⚪", name: "灰色",     meaning: "音が検出できなかった" },
      ]
      return (
        <>
          <p className={styles.bodyText}>{slide.body.split("\n\n")[0]}</p>
          <div className={styles.legendTable}>
            {legend.map(row => (
              <div key={row.name} className={styles.legendRow}>
                <span className={styles.legendColor}>{row.color}</span>
                <span className={styles.legendName}>{row.name}</span>
                <span className={styles.legendMeaning}>{row.meaning}</span>
              </div>
            ))}
          </div>
          {slide.body.split("\n\n")[1] && (
            <p className={styles.bodyText}>{slide.body.split("\n\n")[1]}</p>
          )}
        </>
      )
    }
    return <p className={styles.bodyText}>{slide.body}</p>
  }

  return createPortal(
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-slide-headline"
    >
      <div className={styles.dialog}>
        <div className={styles.body}>
          <h2 id="welcome-slide-headline" className={styles.headline}>
            {slide.headline}
          </h2>
          {renderBody()}
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
