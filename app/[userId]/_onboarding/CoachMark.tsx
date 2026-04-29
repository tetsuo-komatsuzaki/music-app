"use client"

import { useEffect, useState, ReactNode } from "react"
import { createPortal } from "react-dom"
import { useTargetRect } from "./hooks/useTargetRect"
import { useOnboarding } from "./hooks/useOnboarding"
import { CoachMarkBody } from "./content/coachMarks"
import styles from "./styles/CoachMark.module.css"

type Props = {
  targetKey: string | null
  headline: string
  body: CoachMarkBody
  step: number
  totalSteps: number
  showDismissAllCheckbox: boolean
  onNext: () => void
  onPrev?: () => void
  onSkip: () => void
  onDismissAll?: () => void
}

const TOOLTIP_W = 320
const TOOLTIP_GAP = 12  // ターゲットとの隙間

type Position = { top: number; left: number }

function calcTooltipPos(rect: DOMRect, viewportW: number, viewportH: number): Position {
  // tooltip の高さは可変なので暫定 200px で見切れ判定 (実描画後の自動調整は CSS で吸収)
  const tooltipH = 200
  // 横位置: ターゲット中央に揃える、画面端で寄せる
  let left = rect.left + rect.width / 2 - TOOLTIP_W / 2
  if (left < 8) left = 8
  if (left + TOOLTIP_W > viewportW - 8) left = viewportW - TOOLTIP_W - 8

  // 縦位置: 下を優先、画面下端を超えたら上にフリップ
  let top = rect.bottom + TOOLTIP_GAP
  if (top + tooltipH > viewportH - 8) {
    top = rect.top - tooltipH - TOOLTIP_GAP
    if (top < 8) {
      // 上下どちらにも入らない場合は画面下端基準で表示
      top = Math.max(8, viewportH - tooltipH - 8)
    }
  }
  return { top, left }
}

export default function CoachMark({
  targetKey,
  headline,
  body,
  step,
  totalSteps,
  showDismissAllCheckbox,
  onNext,
  onPrev,
  onSkip,
  onDismissAll,
}: Props) {
  const { isHydrated } = useOnboarding()
  const { rect, resolved } = useTargetRect(targetKey)

  // viewport size を保持
  const [viewport, setViewport] = useState<{ w: number; h: number }>({
    w: typeof window !== "undefined" ? window.innerWidth : 0,
    h: typeof window !== "undefined" ? window.innerHeight : 0,
  })
  const [dismissAll, setDismissAll] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  // SSR / Hydration ガード
  if (!isHydrated) return null
  if (typeof document === "undefined") return null
  // target 解決前は何も描画しない (5 秒タイムアウト後に resolved=true になる)
  if (!resolved) return null

  const handleNextClick = () => {
    if (showDismissAllCheckbox && dismissAll && onDismissAll) {
      onDismissAll()
      return
    }
    onNext()
  }

  const renderBody = (): ReactNode => {
    if (typeof body === "string") {
      return <p className={styles.bodyText} style={{ whiteSpace: "pre-line" }}>{body}</p>
    }
    return (
      <div className={styles.legendTable}>
        {body.rows.map(row => (
          <div key={row.label} className={styles.legendRow}>
            <span className={styles.legendColor}>{row.color}</span>
            <span className={styles.legendName}>{row.label}</span>
            <span className={styles.legendMeaning}>{row.meaning}</span>
          </div>
        ))}
      </div>
    )
  }

  const tooltipContent = (
    <>
      <div className={styles.body}>
        <h3 className={styles.headline}>{headline}</h3>
        {renderBody()}
      </div>
      {showDismissAllCheckbox && (
        <div className={styles.dismissAllRow}>
          <input
            type="checkbox"
            id={`coachmark-dismissall-${step}`}
            checked={dismissAll}
            onChange={(e) => setDismissAll(e.target.checked)}
          />
          <label htmlFor={`coachmark-dismissall-${step}`}>もう表示しない</label>
        </div>
      )}
      <div className={styles.footer}>
        <span className={styles.stepIndicator}>
          {totalSteps > 1 ? `${step} / ${totalSteps}` : ""}
        </span>
        <div className={styles.actions}>
          <button type="button" className={styles.skipButton} onClick={onSkip}>
            スキップ
          </button>
          {onPrev && (
            <button type="button" className={styles.navButton} onClick={onPrev}>
              戻る
            </button>
          )}
          <button type="button" className={styles.primaryButton} onClick={handleNextClick}>
            {step === totalSteps ? "完了" : "次へ"}
          </button>
        </div>
      </div>
    </>
  )

  // rect = null (targetKey null またはタイムアウト): 画面中央表示
  if (!rect) {
    return createPortal(
      <>
        <div className={styles.backdrop} />
        <div className={styles.tooltipCenter} role="dialog" aria-modal="true">
          {tooltipContent}
        </div>
      </>,
      document.body
    )
  }

  // rect 存在: spotlight + tooltip
  const pos = calcTooltipPos(rect, viewport.w, viewport.h)
  const padding = 4
  return createPortal(
    <>
      <div
        className={styles.spotlight}
        style={{
          top: rect.top - padding,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        }}
      />
      <div
        className={styles.tooltip}
        role="dialog"
        aria-modal="true"
        style={{ top: pos.top, left: pos.left, width: TOOLTIP_W }}
      >
        {tooltipContent}
      </div>
    </>,
    document.body
  )
}
