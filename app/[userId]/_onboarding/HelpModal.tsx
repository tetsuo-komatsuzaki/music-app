"use client"

// 使い方 (ヘルプ) モーダル。
// 2026-08-29 旧ガイド削除: 「はじめてガイド (7枚スライド)」と「ページごとの使い方
// (コーチマーク再生)」のセクションを廃止し、代わりに新チュートリアル
// 「アルコと最初の1周」をもう一度見る導線を置く (Tetsuo確定 2026-08-29)。
// 旧 OnboardingProvider への依存も外し、helpBus (CustomEvent) で自立して開閉する。

import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { useParams } from "next/navigation"
import { HELP_CONTENT } from "./content/help"
import type { HelpSection } from "./helpBus"
import { resetGuideForReplay } from "@/app/actions/guideState"
import styles from "./styles/HelpModal.module.css"

type Props = {
  open: boolean
  initialSection?: HelpSection
  onClose: () => void
}

export default function HelpModal({ open, initialSection, onClose }: Props) {
  const params = useParams<{ userId: string }>()
  const userId = (params?.userId as string) ?? ""

  const faqRef = useRef<HTMLElement>(null)
  const troubleshootingRef = useRef<HTMLElement>(null)

  // 開いた直後に initialSection の位置までスクロール
  useEffect(() => {
    if (!open || !initialSection) return
    const refMap: Record<HelpSection, React.RefObject<HTMLElement | null>> = {
      faq: faqRef,
      troubleshooting: troubleshootingRef,
    }
    refMap[initialSection]?.current?.scrollIntoView({ behavior: "auto", block: "start" })
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

  if (typeof document === "undefined") return null
  if (!open) return null

  // 「最初の1周をもう一度見る」: 完了/スキップを外してホームへ。
  // ソフト遷移だとホーム滞在中は client 状態が残り再起動しないことがあるため、
  // フルリロードで確実にチュートリアルを立ち上げる (2026-08-29 実機指摘の修正)
  const handleReplayFirstLoop = async () => {
    await resetGuideForReplay()
    onClose()
    // クエリでキャッシュを確実に回避 (アプリのWebViewがページを再利用しても新規読込になる)
    window.location.assign(userId ? `/${userId}?replay=${Date.now()}` : "/")
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
          {/* ① アルコと最初の1周 (もう一度見る) */}
          <section id="help-first-loop" className={styles.section}>
            <h3 className={styles.sectionTitle}>アルコと最初の1周</h3>
            <button
              type="button"
              className={styles.welcomeReplayButton}
              onClick={handleReplayFirstLoop}
            >
              最初の1周をもう一度見る
            </button>
          </section>

          {/* ② FAQ */}
          <section ref={faqRef} id="help-faq" className={styles.section}>
            <h3 className={styles.sectionTitle}>よくある質問</h3>
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

          {/* ③ うまくいかないとき */}
          <section ref={troubleshootingRef} id="help-troubleshooting" className={styles.section}>
            <h3 className={styles.sectionTitle}>うまくいかないとき</h3>
            <div className={styles.troubleshootList}>
              {HELP_CONTENT.troubleshooting.map((item, i) => (
                <div key={i} className={styles.troubleshootItem}>
                  <h4 className={styles.troubleshootTitle}>{item.title}</h4>
                  <p className={styles.troubleshootBody}>{item.body}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
