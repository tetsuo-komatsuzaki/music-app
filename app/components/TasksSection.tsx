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
import { TASK_IDS, TASK_NAMES, type TaskId } from "@/app/_libs/skillMaster"
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

// 親 TaskId を解決 (sub_task カードは parentTaskName 経由 / task カードは skillTaskId 経由)
function resolveParentTaskId(card: SkillTaskCardData): TaskId | null {
  if (card.cardType === "task" && card.skillTaskId) {
    return TASK_IDS.includes(card.skillTaskId as TaskId)
      ? (card.skillTaskId as TaskId)
      : null
  }
  // sub_task: parentTaskName で逆引き (TASK_NAMES の値 → key)
  for (const taskId of TASK_IDS) {
    if (TASK_NAMES[taskId] === card.parentTaskName) return taskId
  }
  return null
}

// 中項目 → 難易度 → カード の 2 階層グルーピング (Q1:A + Q2:A)
type DifficultyGroup = { difficulty: number | null; cards: SkillTaskCardData[] }
type ParentGroup = { taskId: TaskId | "other"; taskName: string; difficultyGroups: DifficultyGroup[] }

function groupByParentAndDifficulty(cards: SkillTaskCardData[]): ParentGroup[] {
  const byParent = new Map<TaskId | "other", SkillTaskCardData[]>()
  for (const card of cards) {
    const parentId = resolveParentTaskId(card) ?? "other"
    if (!byParent.has(parentId)) byParent.set(parentId, [])
    byParent.get(parentId)!.push(card)
  }

  const orderedTaskIds: (TaskId | "other")[] = [...TASK_IDS, "other"]
  const groups: ParentGroup[] = []
  for (const taskId of orderedTaskIds) {
    const list = byParent.get(taskId)
    if (!list || list.length === 0) continue

    // 難易度 (cardDifficulty) ごとに細分 (null は末尾の "難易度未判定" グループ)
    const byDiff = new Map<number | null, SkillTaskCardData[]>()
    for (const c of list) {
      const d = c.cardDifficulty ?? null
      if (!byDiff.has(d)) byDiff.set(d, [])
      byDiff.get(d)!.push(c)
    }
    const sortedDiffKeys = [...byDiff.keys()].sort((a, b) => {
      if (a == null) return 1
      if (b == null) return -1
      return a - b
    })

    groups.push({
      taskId,
      taskName: taskId === "other" ? "その他" : TASK_NAMES[taskId as TaskId],
      difficultyGroups: sortedDiffKeys.map(d => ({
        difficulty: d,
        cards: byDiff.get(d)!,
      })),
    })
  }
  return groups
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

  // active タブのみ中項目→難易度グルーピングを適用 (improving/cleared は従来通りフラット表示)
  const groupedCards = useMemo(
    () =>
      activeStatus === "active"
        ? groupByParentAndDifficulty(visibleCards)
        : null,
    [visibleCards, activeStatus],
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
        ) : groupedCards ? (
          // active: 中項目 → 難易度 → カード の 2 階層
          groupedCards.map(parent => (
            <section key={parent.taskId} className={styles.parentGroup}>
              <h3 className={styles.parentGroupTitle}>{parent.taskName}</h3>
              {parent.difficultyGroups.map(dg => (
                <div
                  key={`${parent.taskId}-${dg.difficulty ?? "none"}`}
                  className={styles.difficultyGroup}
                >
                  <div className={styles.difficultyLabel}>
                    {dg.difficulty != null ? `Lv.${dg.difficulty}` : "難易度未判定"}
                  </div>
                  <div className={styles.difficultyCards}>
                    {dg.cards.map(card => (
                      <SkillTaskCardItem
                        key={card.id}
                        card={card}
                        averageScore={getCardScore(card, subScoresMap, skillScoresMap)}
                        expanded={expandedIds.has(card.id)}
                        userId={userId}
                        onToggle={() => toggleExpanded(card.id)}
                        onClear={() => handleClear(card.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ))
        ) : (
          // improving / cleared: 従来通りフラット表示
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
