"use client"

import { useState, useTransition, useRef, ChangeEvent, DragEvent, FormEvent } from "react"
import { useRouter } from "next/navigation"
import styles from "../scores/page.module.css"

type UploadResult = { success?: boolean; error?: string }

type UploadModalProps = {
  isOpen: boolean
  onClose: () => void
  action: (formData: FormData) => Promise<UploadResult> | UploadResult | void
}

export default function UploadModal({
  isOpen,
  onClose,
  action,
}: UploadModalProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!isOpen) return null

  const reset = () => {
    setSelectedFile(null)
    setIsDragging(false)
    setError(null)
  }

  const handleClose = () => {
    if (isPending) return // 登録中はキャンセル不可
    reset()
    onClose()
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)
    setError(null)
  }

  const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    if (!isPending) setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (isPending) return
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    // input.files に DataTransfer 経由で設定 (form 送信時に含まれるように)
    if (fileInputRef.current) {
      const dt = new DataTransfer()
      dt.items.add(file)
      fileInputRef.current.files = dt.files
    }
    setSelectedFile(file)
    setError(null)
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedFile) {
      setError("ファイルを選択してください")
      return
    }
    const formData = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      const result = await action(formData)
      // result が undefined または error なし → 成功扱い
      if (!result || (!result.error)) {
        reset()
        onClose()
        router.refresh()
      } else {
        setError(result.error || "登録に失敗しました")
      }
    })
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <button
          className={styles.closeBtn}
          onClick={handleClose}
          disabled={isPending}
          aria-label="閉じる"
        >
          ✕
        </button>

        <h2 className={styles.modalTitle}>♪ 新規楽曲を登録</h2>

        <form onSubmit={handleSubmit} className={styles.uploadForm}>
          {/* ===== 基本情報 ===== */}
          <div className={styles.formSection}>
            <label className={styles.formLabel}>曲名</label>
            <input
              type="text"
              name="title"
              required
              disabled={isPending}
              className={styles.textInput}
            />

            <label className={styles.formLabel}>作曲者</label>
            <input
              type="text"
              name="composer"
              disabled={isPending}
              className={styles.textInput}
            />
          </div>

          {/* ===== ファイル ===== */}
          <div className={styles.fileSection}>
            <label
              htmlFor="fileInput"
              className={styles.fileDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                border: selectedFile
                  ? "2px solid #16a34a"
                  : isDragging
                  ? "2px dashed #2563EB"
                  : "2px dashed #cbd5e1",
                background: selectedFile
                  ? "#f0fdf4"
                  : isDragging
                  ? "#eff6ff"
                  : "#f8fafc",
                padding: "24px 16px",
                borderRadius: 12,
                cursor: isPending ? "not-allowed" : "pointer",
                opacity: isPending ? 0.6 : 1,
                display: "block",
              }}
            >
              {selectedFile ? (
                <>
                  <div className={styles.uploadIcon} style={{ color: "#16a34a" }}>✅</div>
                  <p style={{ margin: "4px 0", fontWeight: 600, color: "#166534" }}>
                    {selectedFile.name}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: "#475569" }}>
                    {formatSize(selectedFile.size)} ・ クリック / ドラッグで変更
                  </p>
                </>
              ) : (
                <>
                  <div className={styles.uploadIcon}>📁</div>
                  <p style={{ margin: "4px 0" }}>
                    {isDragging
                      ? "ここにドロップしてください"
                      : "MusicXMLをドラッグ or クリック"}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
                    .xml / .musicxml / .mxl ・ 5MB 以下
                  </p>
                </>
              )}
            </label>

            <input
              ref={fileInputRef}
              id="fileInput"
              type="file"
              name="file"
              required
              accept=".xml,.musicxml,.mxl"
              disabled={isPending}
              onChange={handleFileChange}
              className={styles.hiddenInput}
            />
          </div>

          {/* ===== エラー / 進捗 ===== */}
          {error && (
            <div
              role="alert"
              style={{
                padding: "10px 14px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 8,
                color: "#b91c1c",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          {isPending && (
            <div
              style={{
                padding: "12px 14px",
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: 8,
                color: "#1e40af",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span
                aria-hidden
                style={{
                  display: "inline-block",
                  width: 14,
                  height: 14,
                  border: "2px solid #1e40af",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "uploadModalSpin 0.8s linear infinite",
                  flexShrink: 0,
                }}
              />
              スコアを登録中… 完了まで画面を閉じずにお待ちください
              <style>{`@keyframes uploadModalSpin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* ===== アクション ===== */}
          <div className={styles.actionRow}>
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className={styles.cancelBtn}
            >
              キャンセル
            </button>

            <button
              type="submit"
              disabled={isPending || !selectedFile}
              className={styles.primaryBtn}
            >
              {isPending ? "登録中…" : "登録"}
            </button>
          </div>
        </form>

        {!isPending && (
          <div className={styles.infoBox}>
            <h4>MusicXMLファイルについて</h4>
            <p>・Finale、Sibelius、MuseScoreなどで作成したMusicXMLファイルに対応</p>
            <p>・ファイル形式: .xml / .musicxml / .mxl</p>
            <p>・アップロード後、譜面として表示されます</p>
          </div>
        )}
      </div>
    </div>
  )
}
