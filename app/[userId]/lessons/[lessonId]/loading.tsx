// レッスン読込中のフォールバック (教材の署名URL取得・状態計算の間に表示)。
// 一覧のカードをクリックした瞬間から画面が切り替わり、待ちが分かるようにする。
import styles from "../lessons.module.css"

export default function LessonLoading() {
  return (
    <div className={styles.stage}>
      <div className={styles.frame}>
        <div className={styles.loadWrap}>
          <div className={styles.spinner} />
          <div className={styles.loadLbl}>レッスンを準備中…</div>
        </div>
      </div>
    </div>
  )
}
