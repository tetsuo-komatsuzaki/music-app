// app/components/CandidatePickerModal.tsx
//
// UI 設計書 v3 §5-5 / §5-12 — 候補が 2 件以上のときの単一選択モーダル
//
// 「どちらが原因に近いですか？」をタイトルに、候補をラジオで列挙して
// 1 件だけ選択させる。MVP では「この2つ」(複数選択) は実装しない:
// feedback API が selectedSubTaskId 単数形のみ対応。
// 設計書 §5-15 で β 以降に「selectedSubTaskIds[] サポート + 復活」を追加要望。

"use client"

import { useEffect, useState } from "react"
import styles from "./CandidatePickerModal.module.css"

type Props = {
  open: boolean
  candidates: { id: string; name: string }[]
  onClose: () => void
  onConfirm: (selectedId: string) => void
}

export default function CandidatePickerModal({
  open,
  candidates,
  onClose,
  onConfirm,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [prevOpen, setPrevOpen] = useState(open)

  // open が false → true に変わるたびに選択をリセット (前回の選択リーク防止)。
  // useEffect での setState は eslint react-hooks/set-state-in-effect を踏むので、
  // React docs 推奨の「render 中に prop 変化を検知して state 同期」パターンを使う。
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setSelectedId(null)
  }

  // Esc / 外側クリックで閉鎖
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleConfirm = () => {
    if (selectedId) onConfirm(selectedId)
  }

  return (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="candidate-picker-title"
    >
      <div className={styles.modal}>
        <h2 id="candidate-picker-title" className={styles.title}>
          どちらが原因に近いですか？
        </h2>
        <div className={styles.options} role="radiogroup">
          {candidates.map(c => (
            <label key={c.id} className={styles.option}>
              <input
                type="radio"
                name="candidate"
                value={c.id}
                checked={selectedId === c.id}
                onChange={() => setSelectedId(c.id)}
                className={styles.radio}
              />
              <span className={styles.optionLabel}>{c.name}</span>
            </label>
          ))}
        </div>
        <div className={styles.buttonRow}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
          >
            キャンセル
          </button>
          <button
            type="button"
            className={styles.confirmButton}
            onClick={handleConfirm}
            disabled={!selectedId}
          >
            これだ
          </button>
        </div>
      </div>
    </div>
  )
}
