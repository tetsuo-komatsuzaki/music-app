"use client"

import styles from "./page.module.css"
import { useState, useRef, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import UploadModal from "../components/UploadModal"
import { uploadScore } from "@/app/actions/uploadScore"
import { updateScoreTitle } from "@/app/actions/updateScore"
import { ScoreView } from "@/app/types/score"


type ScoresClientProps = {
  scores: ScoreView[]
  userId: string
}

export default function ScoresClient({
  scores,
  userId,
}: ScoresClientProps) {

  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)        // dropdown 表示中の score id

  // 楽曲名インライン編集用 state
  const [renamingId, setRenamingId] = useState<string | null>(null)      // 編集モード中の score id
  const [renameInput, setRenameInput] = useState("")
  const [renameError, setRenameError] = useState<string | null>(null)
  const [isRenaming, startRenameTransition] = useTransition()

  const dropdownRef = useRef<HTMLDivElement | null>(null)


  // 外クリックで dropdown 閉じる (編集モード中は閉じない)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setEditingId(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // 「楽曲名を変更」ボタンクリック → インライン編集モードへ
  const handleStartRename = (score: ScoreView) => {
    setRenamingId(score.id)
    setRenameInput(score.title)
    setRenameError(null)
    setEditingId(null)  // dropdown を閉じる
  }

  const handleCancelRename = () => {
    setRenamingId(null)
    setRenameInput("")
    setRenameError(null)
  }

  const handleSubmitRename = (scoreId: string) => {
    const trimmed = renameInput.trim()
    if (trimmed.length === 0) {
      setRenameError("曲名を入力してください")
      return
    }
    setRenameError(null)
    startRenameTransition(async () => {
      const result = await updateScoreTitle(scoreId, trimmed)
      if (!result.ok) {
        setRenameError(result.error)
        return
      }
      // 成功 → 編集モード終了 + 一覧再取得
      setRenamingId(null)
      setRenameInput("")
      setRenameError(null)
      router.refresh()
    })
  }

  const handleRenameKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    scoreId: string
  ) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSubmitRename(scoreId)
    } else if (e.key === "Escape") {
      e.preventDefault()
      handleCancelRename()
    }
  }


  return (
    <div>
      {/* ===== MAIN ===== */}
      <main className={styles.main}>

        <h1 className={styles.pageTitle}>スコア一覧</h1>

        <div className={styles.subHeaderRow}>
          <h2 className={styles.pageSubTitle}>
            あなたの登録済み楽曲
          </h2>

          <button
            className={styles.newButton}
            onClick={() => setIsOpen(true)}
          >
            ＋ 新規楽曲を登録
          </button>
        </div>

        {/* ===== EMPTY STATE ===== */}
        {scores.length === 0 && (
          <div className={styles.emptyState}>
            🎻 まだ楽曲が登録されていません
          </div>
        )}

        {/* ===== SCORE CARDS ===== */}
        <div className={styles.cardGrid}>
          {scores.map(score => {
            const isEditing = renamingId === score.id
            return (
              <div key={score.id} className={styles.card}>

                <div className={styles.cardLeft}>
                  🎼
                </div>

                <div className={styles.cardContent}>
                  <div className={styles.cardTopRow}>
                    {isEditing ? (
                      <div className={styles.renameRow}>
                        <input
                          type="text"
                          value={renameInput}
                          onChange={e => setRenameInput(e.target.value)}
                          onKeyDown={e => handleRenameKeyDown(e, score.id)}
                          autoFocus
                          disabled={isRenaming}
                          maxLength={100}
                          className={styles.renameInput}
                          aria-label="曲名を入力"
                        />
                        <button
                          type="button"
                          onClick={() => handleSubmitRename(score.id)}
                          disabled={isRenaming}
                          className={styles.renameSubmitBtn}
                        >
                          {isRenaming ? "..." : "保存"}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelRename}
                          disabled={isRenaming}
                          className={styles.renameCancelBtn}
                        >
                          キャンセル
                        </button>
                      </div>
                    ) : (
                      <h3 className={styles.cardTitle}>
                        {score.title}
                      </h3>
                    )}

                    <Link
                      href={`/${userId}/scores/${score.id}`}
                      className={styles.practiceBtn}
                    >
                      ▶ 練習する
                    </Link>
                  </div>

                  {isEditing && renameError && (
                    <div className={styles.renameError}>{renameError}</div>
                  )}

                  <p className={styles.cardComposer}>
                    作曲者:{score.composer ?? "未登録"}
                  </p>

                  <div className={styles.cardBottomRow}>
                    <span className={styles.dateTag}>
                      作成日:
                      {new Date(score.createdAt)
                        .toLocaleDateString("ja-JP")}
                    </span>

                    <button
                      className={styles.editBtn}
                      onClick={() =>
                        setEditingId(editingId === score.id ? null : score.id)
                      }
                    >
                      編集
                    </button>
                  </div>

                  {editingId === score.id && (
                    <div
                      ref={dropdownRef}
                      className={styles.dropdown}
                    >
                      <button
                        type="button"
                        onClick={() => handleStartRename(score)}
                      >
                        楽曲名を変更
                      </button>
                      <button className={styles.deleteBtn}>
                        削除
                      </button>
                    </div>
                  )}

                </div>
              </div>
            )
          })}
        </div>
      </main>
      <UploadModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        action={uploadScore}
      />
    </div>
  )
}
