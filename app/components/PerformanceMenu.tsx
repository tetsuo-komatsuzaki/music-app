// app/components/PerformanceMenu.tsx
//
// UI 設計書 v3 §5-7 — 演奏ヘッダー右上の ⋯ メニュー (削除のみ MVP)
//
// 動作:
//   - ⋯ ボタン押下で dropdown 開閉
//   - 削除項目選択で PerformanceDeleteModal を開く
//   - 外側クリック / Esc で dropdown 閉鎖
//   - 削除成功は onDeleted で親に伝搬

"use client"

import { useEffect, useRef, useState } from "react"
import PerformanceDeleteModal from "./PerformanceDeleteModal"
import styles from "./PerformanceMenu.module.css"

type Props = {
  performanceId: string
  onDeleted: (performanceId: string) => void
  /** v1.6 Phase 5: Score 演奏は score-performances 削除ルートを使う。既定 practice。 */
  kind?: "score" | "practice"
}

export default function PerformanceMenu({
  performanceId,
  onDeleted,
  kind = "practice",
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 外側クリックで dropdown を閉じる
  useEffect(() => {
    if (!menuOpen) return
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        !triggerRef.current?.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [menuOpen])

  // Esc で dropdown を閉じる
  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false)
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [menuOpen])

  const handleDeleteClick = () => {
    setMenuOpen(false)
    setModalOpen(true)
  }

  return (
    <div className={styles.menuWrapper}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        onClick={() => setMenuOpen(o => !o)}
        aria-label="演奏メニュー"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
      >
        ⋯
      </button>
      {menuOpen && (
        <div ref={dropdownRef} className={styles.dropdown} role="menu">
          <button
            type="button"
            className={styles.deleteOption}
            onClick={handleDeleteClick}
            role="menuitem"
          >
            削除
          </button>
        </div>
      )}
      <PerformanceDeleteModal
        performanceId={performanceId}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onDeleted={onDeleted}
        kind={kind}
      />
    </div>
  )
}
