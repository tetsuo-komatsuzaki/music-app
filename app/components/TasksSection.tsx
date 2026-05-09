// app/components/TasksSection.tsx
//
// 「あなたの課題」セクション (StatusTab + SkillTaskCardItem 一覧 + 達成ボタン + トースト)。
// マイページから 成長記録「あなたの課題」タブに移設するため抽出。
//
// 含む機能:
//   - StatusTab (active/improving/cleared)
//   - SkillTaskCardItem 一覧 (展開・F6 sort)
//   - 達成ボタン (C6 ワンタップ即遷移、楽観的更新)
//   - 「達成しました！」トースト (3 秒自動消去)
//   - 空ケース文言

"use client"

import { useMemo, useRef, useState } from "react"
import StatusTab, { type CardStatus } from "@/app/components/StatusTab"
import SkillTaskCardItem, {
  type SkillTaskCardData,
} from "@/app/components/SkillTaskCardItem"
import styles from "./TasksSection.module.css"

type Props = {
  userId: string
  initialCards: SkillTaskCardData[]
  subScoresMap: Record<string, number | null>
  skillScoresMap: Record<string, number | null>
}

const EMPTY_MESSAGES: Record<
  CardStatus,
  { title: string; description: string }
> = {
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
function sortCards(
  cards: SkillTaskCardData[],
  status: CardStatus,
): SkillTaskCardData[] {
  const sorted = [...cards]
  if (status === "improving") {
    sorted.sort((a, b) => {
      const ax = a.lastMatchedAt ?? "0000"
      const bx = b.lastMatchedAt ?? "0000"
      return bx.localeCompare(ax)
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

export default function TasksSection({
  userId,
  initialCards,
  subScoresMap,
  skillScoresMap,
}: Props) {
  const [cards, setCards] = useState<SkillTaskCardData[]>(initialCards)
  const [activeStatus, setActiveStatus] = useState<CardStatus>("active")
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
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

  const counts = useMemo<Record<CardStatus, number>>(() => {
    const c: Record<CardStatus, number> = {
      active: 0,
      improving: 0,
      cleared: 0,
    }
    for (const card of cards) {
      c[card.status] = (c[card.status] ?? 0) + 1
    }
    return c
  }, [cards])

  const visibleCards = useMemo(
    () =>
      sortCards(
        cards.filter(c => c.status === activeStatus),
        activeStatus,
      ),
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

  const handleClear = async (cardId: string) => {
    const original = cards.find(c => c.id === cardId)
    if (!original) return
    if (original.status === "cleared") return

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
    <>
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

      {toast && (
        <div className={styles.toast} role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </>
  )
}
