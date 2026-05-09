// app/[userId]/profile/myPage.tsx
//
// UI 設計書 v3.1 §7 — マイページの Client Component。
// グレード詳細セクション + プロフィール / 設定リンクのみ。
//
// 旧「あなたの課題」カード一覧は 成長記録「あなたの課題」タブに移設済み
// (TasksSection コンポーネントとして抽出)。

"use client"

import Link from "next/link"
import { useState } from "react"
import GradeProgressDetail from "@/app/components/GradeProgressDetail"
import GradeDetailModal, {
  type GradeDetailData,
} from "@/app/components/GradeDetailModal"
import styles from "./myPage.module.css"

type GradeData = GradeDetailData & {
  totalCompleted: number
  totalRequired: number
}

type Props = {
  userId: string
  userName: string
  gradeData: GradeData
}

export default function MyPage({
  userId,
  userName: _userName,
  gradeData,
}: Props) {
  void _userName

  const [gradeModalOpen, setGradeModalOpen] = useState(false)

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>マイページ</h1>
      </header>

      {/* UI-11: グレード詳細セクション */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>あなたのグレード</h2>
        <GradeProgressDetail
          data={gradeData}
          onTapBadge={() => setGradeModalOpen(true)}
        />
      </section>

      {/* 「あなたの課題」セクションは 成長記録の「あなたの課題」タブに移設済み */}
      <section className={styles.section}>
        <p className={styles.tasksMoved}>
          「あなたの課題」は<Link href={`/${userId}/progress?tab=tasks`} className={styles.tasksMovedLink}>
            成長記録の「あなたの課題」タブ
          </Link>に移動しました。
        </p>
      </section>

      {/* プロフィール / 設定リンク */}
      <nav className={styles.footerNav}>
        <Link href={`/${userId}/settings`} className={styles.footerLink}>
          🛠️ 設定
        </Link>
        <Link href={`/${userId}/support`} className={styles.footerLink}>
          ❓ サポート
        </Link>
      </nav>

      {/* グレード詳細モーダル */}
      <GradeDetailModal
        open={gradeModalOpen}
        onClose={() => setGradeModalOpen(false)}
        data={gradeData}
      />
    </div>
  )
}
