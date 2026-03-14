"use client"

import styles from "./page.module.css"
// import { uploadScore } from "../../actions/uploadScore"
import { useState, useRef, useEffect, useTransition } from "react"
import UploadModal from "../components/UploadModal"
import { uploadScore } from "@/app/actions/uploadScore"
import { ScoreView } from "@/app/types/score"



type TopClientProps = {
  scores: ScoreView[]
  userId: string
}

export default function TopClient({
  scores,
  userId
}: TopClientProps) {

  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  // const [errorMessage, setErrorMessage] = useState("")
  // const [isPending, startTransition] = useTransition()

  const dropdownRef = useRef<HTMLDivElement | null>(null)




  // 外クリックで編集閉じる
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

  // const handleUpload = async (formData: FormData) => {
  //   setErrorMessage("")

  //   startTransition(async () => {
  //     const result = await uploadScore(formData)

  //     if (result?.error) {
  //       setErrorMessage(result.error)
  //       return
  //     }

  //     // 成功時
  //     setIsOpen(false)
  //   })
  // }



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
          {scores.map(score => (
            <div key={score.id} className={styles.card}>

              <div className={styles.cardLeft}>
                🎼
              </div>

              <div className={styles.cardContent}>
                <div className={styles.cardTopRow}>
                  <h3 className={styles.cardTitle}>
                    {score.title}
                  </h3>

                  <a
                    href={`/${userId}/top/${score.id}`}
                    className={styles.practiceBtn}
                  >
                    ▶ 練習する
                  </a>
                </div>

                <p className={styles.cardComposer}>
                  作曲者：{score.composer ?? "未登録"}
                </p>

                <div className={styles.cardBottomRow}>
                  <span className={styles.dateTag}>
                    作成日：
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
                    <button>楽曲名を変更</button>
                    <button className={styles.deleteBtn}>
                      削除
                    </button>
                  </div>
                )}

              </div>
            </div>
          ))}
        </div>
      </main>
      <UploadModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        action={uploadScore}
        // onSubmit={handleUpload}
        // isPending={isPending}

      />
    </div>
  )
}
