"use client";

import styles from "../top/page.module.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  scoreId: string;
  action: (formData: FormData) => void;
};

export default function UploadRecordModal({
  isOpen,
  onClose,
  scoreId,
  action
}: Props) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <button
          className={styles.closeBtn}
          onClick={onClose}
        >
          ✕
        </button>

        <h2 className={styles.modalTitle}>
          🎤 演奏データをアップロード
        </h2>

        <form
          action={action}
          className={styles.uploadForm}
        >
          <input
            type="hidden"
            name="scoreId"
            value={scoreId}
          />

          <div className={styles.fileSection}>
            <label
              htmlFor="wavInput"
              className={styles.fileDrop}
            >
              <div className={styles.uploadIcon}>🎵</div>
              <p>WAVファイルをドラッグ or クリック</p>
            </label>

            <input
              id="wavInput"
              type="file"
              name="file"
              required
              accept=".wav"
              className={styles.hiddenInput}
            />
          </div>

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
              アップロード
            </button>
          </div>
        </form>

        <div className={styles.infoBox}>
          <h4>WAVファイルについて</h4>
          <p>・48kHz / 16bit 推奨</p>
          <p>・圧縮音源（mp3等）は非推奨</p>
          <p>・解析精度のため無圧縮推奨</p>
        </div>
      </div>
    </div>
  );
}