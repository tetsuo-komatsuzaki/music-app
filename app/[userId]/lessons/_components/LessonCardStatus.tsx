"use client"

// レッスンカードのクリック即時フィードバック。
// Next.js の <Link> 遷移が保留中(pending)の間、チェック丸をスピナーに差し替える。
// 一覧はサーバーコンポーネントなので、この小さなクライアント子だけで pending を購読する。
import { useLinkStatus } from "next/link"
import styles from "../lessons.module.css"

export default function LessonCardStatus({ children }: { children: React.ReactNode }) {
  const { pending } = useLinkStatus()
  if (pending) return <span className={styles.cardSpin} aria-label="読み込み中" />
  return <>{children}</>
}
