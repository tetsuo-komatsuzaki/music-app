// app/[userId]/profile/myPage.tsx
//
// UI 設計書 v3.1 §7 — マイページの Client Component。
// グレード詳細セクション + あなたの課題 (3 タブ) + プロフィール / 設定リンク。

"use client"

import Link from "next/link"
import { useMemo, useRef, useState } from "react"
import GradeBadge from "@/app/components/GradeBadge"
import GradeProgressBar from "@/app/components/GradeProgressBar"
import GradeDetailModal, {
  type GradeDetailData,
} from "@/app/components/GradeDetailModal"
import StatusTab, { type CardStatus } from "@/app/components/StatusTab"
import SkillTaskCardItem, {
  type SkillTaskCardData,
} from "@/app/components/SkillTaskCardItem"
import styles from "./myPage.module.css"

type GradeData = GradeDetailData & {
  totalCompleted: number
  totalRequired: number
}

type Props = {
  userId: string
  userName: string
  gradeData: GradeData
  cards: SkillTaskCardData[]
  subScoresMap: Record<string, number | null>
  skillScoresMap: Record<string, number | null>
}

const EMPTY_MESSAGES: Record<CardStatus, { title: string; description: string }> = {
  active: {
    title: "気になる箇所はありません",
    description: "素晴らしい演奏です！次のチャレンジに進みましょう。",
  },
  improving: {
    title: "改善傾向のカードはまだありません",
    description: "練習を重ねると、改善傾向のカードがここに集まります。",
  },
  cleared: {
    title: "達成したカードはまだありません",
    description: "課題を解決していくと、達成したカードがここに集まります。",
  },
}

// F6: status 別ソート (UI 設計書 v3.1 §7-7)
function sortCards(cards: SkillTaskCardData[], status: CardStatus): SkillTaskCardData[] {
  const sorted = [...cards]
  if (status === "improving") {
    sorted.sort((a, b) => {
      const ax = a.lastMatchedAt ?? "0000"
      const bx = b.lastMatchedAt ?? "0000"
      return bx.localeCompare(ax) // 降順
    })
  } else if (status === "cleared") {
    sorted.sort((a, b) => {
      const ax = a.clearedAt ?? "0000"
      const bx = b.clearedAt ?? "0000"
      return bx.localeCompare(ax)
    })
  } else {
    sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
  return sorted
}

function getCardScore(
  card: SkillTaskCardData,
  subScoresMap: Record<string, number | null>,
  skillScoresMap: Record<string, number | null>,
): number | null {
  if (card.cardType === "sub_task" && card.skillSubTaskId) {
    return subScoresMap[card.skillSubTaskId] ?? null
  }
  if (card.cardType === "task" && card.skillTaskId) {
    return skillScoresMap[card.skillTaskId] ?? null
  }
  return null
}

export default function MyPage({
  userId,
  userName: _userName,
  gradeData,
  cards: initialCards,
  subScoresMap,
  skillScoresMap,
}: Props) {
  void _userName

  // 楽観的更新を含むカード状態
  const [cards, setCards] = useState<SkillTaskCardData[]>(initialCards)
  const [activeStatus, setActiveStatus] = useState<CardStatus>("active")
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [gradeModalOpen, setGradeModalOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimerRef = useRef<number | null>(null)

  const showToast = (msg: string) => {
    if (toastTimerRef.current != null) {
      window.clearTimeout(toastTimerRef.current)
    }
    setToast(msg)
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null)
      toastTimerRef.current = null
    }, 3000)
  }

  // タブ件数 (cards 状態に応じてリアルタイム計算)
  const counts = useMemo<Record<CardStatus, number>>(() => {
    const c: Record<CardStatus, number> = { active: 0, improving: 0, cleared: 0 }
    for (const card of cards) {
      c[card.status] = (c[card.status] ?? 0) + 1
    }
    return c
  }, [cards])

  // 表示対象カード (filter + F6 sort)
  const visibleCards = useMemo(
    () => sortCards(cards.filter(c => c.status === activeStatus), activeStatus),
    [cards, activeStatus],
  )

  const toggleExpanded = (cardId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(cardId)) next.delete(cardId)
      else next.add(cardId)
      return next
    })
  }

  // C6: 達成ボタン — 楽観的更新 + API call
  const handleClear = async (cardId: string) => {
    const original = cards.find(c => c.id === cardId)
    if (!original) return
    if (original.status === "cleared") return // 既に達成済み

    // 楽観的更新: cleared に遷移
    const nowIso = new Date().toISOString()
    setCards(prev =>
      prev.map(c =>
        c.id === cardId ? { ...c, status: "cleared", clearedAt: nowIso } : c,
      ),
    )

    try {
      const res = await fetch(`/api/skill-task-cards/${cardId}/clear`, {
        method: "POST",
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      showToast("達成しました！")
    } catch (e) {
      // ロールバック
      setCards(prev => prev.map(c => (c.id === cardId ? original : c)))
      showToast(
        `達成の記録に失敗しました (${e instanceof Error ? e.message : String(e)})`,
      )
    }
  }

  const empty = EMPTY_MESSAGES[activeStatus]

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>マイページ</h1>
      </header>

      {/* グレード詳細セクション (UI-11 で GradeProgressDetail に拡張予定) */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>あなたのグレード</h2>
        <div className={styles.gradeRow}>
          <GradeBadge
            grade={gradeData.currentGrade}
            onTap={() => setGradeModalOpen(true)}
          />
          <div className={styles.gradeProgress}>
            <GradeProgressBar
              completed={gradeData.totalCompleted}
              required={gradeData.totalRequired}
              remainingCount={gradeData.remainingCount}
              nextGrade={gradeData.nextGrade}
            />
          </div>
        </div>
      </section>

      {/* あなたの課題 */}
      <section
        className={styles.section}
        id={`status-tab-panel-${activeStatus}`}
        role="tabpanel"
      >
        <h2 className={styles.sectionTitle}>あなたの課題</h2>
        <StatusTab
          activeStatus={activeStatus}
          counts={counts}
          onChange={setActiveStatus}
        />

        <div className={styles.cardList}>
          {visibleCards.length === 0 ? (
            <div className={styles.empty} role="status">
              <div className={styles.emptyTitle}>{empty.title}</div>
              <div className={styles.emptyDescription}>{empty.description}</div>
            </div>
          ) : (
            visibleCards.map(card => (
              <SkillTaskCardItem
                key={card.id}
                card={card}
                averageScore={getCardScore(card, subScoresMap, skillScoresMap)}
                expanded={expandedIds.has(card.id)}
                userId={userId}
                onToggle={() => toggleExpanded(card.id)}
                onClear={() => handleClear(card.id)}
              />
            ))
          )}
        </div>
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

      {/* C6 達成完了トースト (3 秒で自動消去) */}
      {toast && (
        <div className={styles.toast} role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  )
}
