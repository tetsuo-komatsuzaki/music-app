// app/[userId]/profile/myPage.tsx
//
// v1.6 Phase 4-2 (2026-05-16) — マイページの Client Component。
// グレード詳細セクション + プロフィール / 設定リンクのみ。
// Q5=c 確定: GradeDetailModal 削除済 (Phase 4-2 で撤去)。
//
// 旧「あなたの課題」カード一覧は 成長記録「あなたの課題」タブに移設済み
// (TasksSection コンポーネントとして抽出)。

"use client"

import Link from "next/link"
import GradeProgressDetail, {
  type GradeProgressDetailData,
} from "@/app/components/GradeProgressDetail"
import styles from "./myPage.module.css"

type Props = {
  userId: string
  userName: string
  gradeData: GradeProgressDetailData
}

export default function MyPage({
  userId,
  userName: _userName,
  gradeData,
}: Props) {
  void _userName

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>マイページ</h1>
      </header>

      {/* v1.6 §3-5-2: グレード詳細セクション (UserGradeProgress 準拠) */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>あなたのグレード</h2>
        <GradeProgressDetail data={gradeData} />
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
    </div>
  )
}
