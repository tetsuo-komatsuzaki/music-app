"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { HELP_CONTENT } from "./content/help"
import { useOnboarding } from "./hooks/useOnboarding"
import type { HelpSection } from "./OnboardingProvider"
import WelcomeSlides from "./WelcomeSlides"
import styles from "./styles/HelpModal.module.css"

type Props = {
  open: boolean
  initialSection?: HelpSection
  onClose: () => void
}

export default function HelpModal({ open, initialSection, onClose }: Props) {
  const params = useParams<{ userId: string }>()
  const userId = (params?.userId as string) ?? ""
  const router = useRouter()
  const { isHydrated, replayPageGuide } = useOnboarding()

  const [welcomeReplayOpen, setWelcomeReplayOpen] = useState(false)

  const welcomeRef = useRef<HTMLElement>(null)
  const markersRef = useRef<HTMLElement>(null)
  const pageGuidesRef = useRef<HTMLElement>(null)
  const faqRef = useRef<HTMLElement>(null)
  const troubleshootingRef = useRef<HTMLElement>(null)

  // 開いた直後に initialSection の位置までスクロール
  useEffect(() => {
    if (!open || !initialSection) return
    const refMap: Record<HelpSection, React.RefObject<HTMLElement | null>> = {
      welcome: welcomeRef,
      markers: markersRef,
      pageGuides: pageGuidesRef,
      faq: faqRef,
      troubleshooting: troubleshootingRef,
    }
    const target = refMap[initialSection]
    if (target?.current) {
      target.current.scrollIntoView({ behavior: "auto", block: "start" })
    }
  }, [open, initialSection])

  // ESC で閉じる
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  // body スクロール制御
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!isHydrated) return null
  if (typeof document === "undefined") return null
  if (!open) return null

  const handleReplayWelcome = () => {
    setWelcomeReplayOpen(true)
  }

  const handlePageGuideReplay = (pageKey: string, pathTemplate: string | null) => {
    if (!pathTemplate) return  // scoreDetail / categoryList / practiceItem は遷移不可
    replayPageGuide(pageKey)
    onClose()
    const fullPath = userId
      ? (pathTemplate === "/" ? `/${userId}` : `/${userId}${pathTemplate}`)
      : pathTemplate
    router.push(fullPath)
  }

  const fullHelpHref = userId
    ? `/${userId}${HELP_CONTENT.fullHelpLink}`
    : HELP_CONTENT.fullHelpLink

  const modalContent = (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
      onClick={(e) => {
        // backdrop クリックで閉じる
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={styles.dialog}>
        <header className={styles.header}>
          <h2 id="help-modal-title" className={styles.title}>使い方</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="閉じる"
          >
            ✕
          </button>
        </header>

        <div className={styles.content}>
          {/* ① はじめてガイド */}
          <section ref={welcomeRef} id="help-welcome" className={styles.section}>
            <h3 className={styles.sectionTitle}>① {HELP_CONTENT.welcome.title}</h3>
            <p className={styles.sectionIntro}>{HELP_CONTENT.welcome.description}</p>
            <button
              type="button"
              className={styles.welcomeReplayButton}
              onClick={handleReplayWelcome}
            >
              {HELP_CONTENT.welcome.buttonLabel}
            </button>
          </section>

          {/* ② マーカー凡例 */}
          <section ref={markersRef} id="help-markers" className={styles.section}>
            <h3 className={styles.sectionTitle}>② {HELP_CONTENT.markerLegend.title}</h3>
            <p className={styles.sectionIntro}>{HELP_CONTENT.markerLegend.intro}</p>
            <div className={styles.legendList}>
              {HELP_CONTENT.markerLegend.rows.map(row => (
                <div key={row.name} className={styles.legendCard}>
                  <span className={styles.legendColor}>{row.color}</span>
                  <span className={styles.legendName}>{row.name} ({row.meaning})</span>
                  <span className={styles.legendDetail}>{row.detail}</span>
                </div>
              ))}
            </div>
            <p className={styles.legendNote}>{HELP_CONTENT.markerLegend.note}</p>
          </section>

          {/* ③ ページごとの使い方 */}
          <section ref={pageGuidesRef} id="help-pageGuides" className={styles.section}>
            <h3 className={styles.sectionTitle}>③ {HELP_CONTENT.pageGuides.title}</h3>
            <div className={styles.pageGuideList}>
              {HELP_CONTENT.pageGuides.items.map(item => (
                <div key={item.pageKey} className={styles.pageGuideCard}>
                  <span className={styles.pageGuideIcon}>{item.icon}</span>
                  <div className={styles.pageGuideText}>
                    <span className={styles.pageGuideName}>{item.name}</span>
                    <span className={styles.pageGuideDescription}>{item.description}</span>
                  </div>
                  <button
                    type="button"
                    className={styles.pageGuideButton}
                    onClick={() => handlePageGuideReplay(item.pageKey, item.pathTemplate)}
                    disabled={!item.pathTemplate}
                    title={item.pathTemplate ? "" : "対象ページにアクセスしてからご利用ください"}
                  >
                    {HELP_CONTENT.pageGuides.buttonLabel}
                  </button>
                </div>
              ))}
            </div>
            <p className={styles.pageGuideNote}>{HELP_CONTENT.pageGuides.note}</p>
          </section>

          {/* ④ FAQ */}
          <section ref={faqRef} id="help-faq" className={styles.section}>
            <h3 className={styles.sectionTitle}>④ よくある質問</h3>
            <div className={styles.faqList}>
              {HELP_CONTENT.faq.map((item, i) => (
                <details key={i} className={styles.faqItem}>
                  <summary className={styles.faqSummary}>{item.q}</summary>
                  <div className={styles.faqAnswer}>{item.a}</div>
                </details>
              ))}
            </div>
            <Link href={fullHelpHref} className={styles.fullHelpLink} onClick={onClose}>
              {HELP_CONTENT.fullHelpLinkLabel} →
            </Link>
          </section>

          {/* ⑤ うまくいかないとき */}
          <section ref={troubleshootingRef} id="help-troubleshooting" className={styles.section}>
            <h3 className={styles.sectionTitle}>⑤ うまくいかないとき</h3>
            <div className={styles.troubleshootList}>
              {HELP_CONTENT.troubleshooting.map((item, i) => (
                <div key={i} className={styles.troubleshootItem}>
                  <h4 className={styles.troubleshootTitle}>{item.title}</h4>
                  <p className={styles.troubleshootBody}>{item.body}</p>
                </div>
              ))}
            </div>
            <p className={styles.footerNote}>{HELP_CONTENT.footerNote}</p>
          </section>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {createPortal(modalContent, document.body)}
      {welcomeReplayOpen && (
        <WelcomeSlides
          forceOpen
          onClose={() => setWelcomeReplayOpen(false)}
        />
      )}
    </>
  )
}
