"use client";

import styles from "../scores/page.module.css"

// type Props = {
//   isOpen: boolean
//   onClose: () => void
//   onSubmit: (formData: FormData) => void
//   isPending: boolean
// }


type UploadModalProps = {
  isOpen: boolean
  onClose: () => void
   action: (formData: FormData) => void
}

export default function UploadModal({
  isOpen,
  onClose,
  action
  // onSubmit,
  // isPending
}: UploadModalProps){
  if(!isOpen) return null
return(
            <div className={styles.modalOverlay}>
            <div className={styles.modal}>

              {/* 右上閉じる */}
              <button
                className={styles.closeBtn}
                onClick={onClose}
              >
                ✕
              </button>

              <h2 className={styles.modalTitle}>
                ♪ 新規楽曲を登録
              </h2>

              <form action={action} className={styles.uploadForm}>

                {/* ===== 基本情報 ===== */}
                <div className={styles.formSection}>
                  <label className={styles.formLabel}>曲名</label>
                  <input
                    type="text"
                    name="title"
                    required
                    className={styles.textInput}
                  />

                  <label className={styles.formLabel}>作曲者</label>
                  <input
                    type="text"
                    name="composer"
                    className={styles.textInput}
                  />
                </div>

                {/* ===== ファイル ===== */}
                <div className={styles.fileSection}>
                  <label htmlFor="fileInput" className={styles.fileDrop}>
                    <div className={styles.uploadIcon}>📁</div>
                    <p>MusicXMLをドラッグ or クリック</p>
                  </label>

                  <input
                    id="fileInput"
                    type="file"
                    name="file"
                    required
                    accept=".xml,.musicxml,.mxl"
                    className={styles.hiddenInput}
                  />
                </div>

                {/* ===== アクション ===== */}
                <div className={styles.actionRow}>
                  <button
                    type="button"
                    onClick={onClose}
                    className={styles.cancelBtn}
                  >
                    キャンセル
                  </button>

                  <button
                    type="submit"
                    className={styles.primaryBtn}
                  >
                    登録
                    {/* {isPending ? "登録中..." : "登録する"} */}
                  </button>
                </div>

              </form>

              <div className={styles.infoBox}>
                <h4>MusicXMLファイルについて</h4>
                <p>・Finale、Sibelius、MuseScoreなどで作成したMusicXMLファイルに対応</p>
                <p>・ファイル形式: .xml / .musicxml / .mxl</p>
                <p>・アップロード後、譜面として表示されます</p>
              </div>
            </div>
          </div>
)
}