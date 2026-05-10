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
import {
  GRADE_NAMES,
  TASK_IDS,
  TASK_NAMES,
  type TaskId,
} from "@/app/_libs/skillMaster"
import styles from "./TasksSection.module.css"

type MasteryProgress = {
  perfCount: number
  averageScore: number | null
  threshold: number
  window: number
}

type Props = {
  userId: string
  initialCards: SkillTaskCardData[]
  subScoresMap: Record<string, number | null>
  skillScoresMap: Record<string, number | null>
  /** 現在のユーザーグレード (BEGINNER 等) */
  currentGrade: string
  /** グレード内でマスターしていない最低難易度。null = 全マスター済み */
  currentTargetDifficulty: number | null
  /** 現在難易度の達成進捗 (直近5回平均) */
  currentDifficultyProgress: MasteryProgress | null
}

// skillMaster.ts §10-7: 初級者 / 中級者 / 上級者 / マスター を使用

type VisibleStatus = "active" | "cleared"

const EMPTY_MESSAGES: Record<VisibleStatus, { title: string; description: string }> = {
  active: {
    title: "気になる箇所はありません",
    description: "素晴らしい演奏です！次のチャレンジに進みましょう。",
  },
  cleared: {
    title: "達成したカードはまだありません",
    description: "課題を解決していくと、達成したカードがここに集まります。",
  },
}

// status 別ソート (active タブは createdAt 降順 / cleared タブは clearedAt 降順)
function sortCards(
  cards: SkillTaskCardData[],
  status: VisibleStatus,
): SkillTaskCardData[] {
  const sorted = [...cards]
  if (status === "cleared") {
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
  currentGrade,
  currentTargetDifficulty,
  currentDifficultyProgress,
}: Props) {
  const [cards, setCards] = useState<SkillTaskCardData[]>(initialCards)
  const [activeStatus, setActiveStatus] = useState<VisibleStatus>("active")
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

  // counts: active タブは active + improving を集約、cleared は cleared のみ
  const counts = useMemo<Record<CardStatus, number>>(() => {
    const c: Record<CardStatus, number> = { active: 0, improving: 0, cleared: 0 }
    for (const card of cards) {
      c[card.status] = (c[card.status] ?? 0) + 1
    }
    // StatusTab 表示用に active = active + improving の合算値で上書き
    return { ...c, active: c.active + c.improving }
  }, [cards])

  // active タブ: status in [active, improving] AND cardDifficulty == currentTargetDifficulty
  // cleared タブ: status === cleared
  const visibleCards = useMemo(() => {
    if (activeStatus === "cleared") {
      return sortCards(
        cards.filter(c => c.status === "cleared"),
        "cleared",
      )
    }
    // active タブ
    const filtered = cards.filter(c => {
      if (c.status !== "active" && c.status !== "improving") return false
      // currentTargetDifficulty フィルタ (null = 全マスター済みで何も表示しない)
      if (currentTargetDifficulty == null) return false
      // augmentation で cardDifficulty = currentTargetDifficulty に揃えてあるカードのみ
      return c.cardDifficulty === currentTargetDifficulty
    })
    return sortCards(filtered, "active")
  }, [cards, activeStatus, currentTargetDifficulty])

  // active タブのみ中項目→難易度グルーピングを適用
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

  // empty state 文言: active タブで "全マスター済み" の場合は専用文言
  const empty = (() => {
    if (activeStatus === "active" && currentTargetDifficulty == null) {
      return {
        title: "現在のグレードを習得しました 🎉",
        description:
          "現在のグレードのすべての難易度をマスターしました。次のグレードへ昇格中です。",
      }
    }
    return EMPTY_MESSAGES[activeStatus]
  })()

  // 達成進捗テキスト
  const progress = currentDifficultyProgress
  const progressText = (() => {
    if (currentTargetDifficulty == null) {
      return "現在のグレードはすべての難易度をマスター済みです"
    }
    if (!progress || progress.perfCount === 0) {
      return `直近 ${progress?.window ?? 5} 回の平均が ${
        progress?.threshold ?? 90
      } 点以上で次の難易度へ。まずは Lv.${currentTargetDifficulty} の曲を演奏してみましょう。`
    }
    const avgStr = progress.averageScore != null ? `${progress.averageScore}` : "—"
    const remaining = Math.max(0, progress.window - progress.perfCount)
    if (remaining > 0) {
      return `直近 ${progress.perfCount}/${progress.window} 回の平均: ${avgStr} 点 (達成基準 ${progress.threshold} 点)。あと ${remaining} 回演奏してください。`
    }
    return `直近 ${progress.window} 回の平均: ${avgStr} 点 / 達成基準 ${progress.threshold} 点`
  })()

  const gradeLabel =
    (GRADE_NAMES as Record<string, string>)[currentGrade] ?? currentGrade

  return (
    <>
      {/* ───── グレード + 現在難易度 + 達成状況ヘッダー ───── */}
      <section className={styles.gradeHeader}>
        <div className={styles.gradeHeaderTop}>
          <div className={styles.gradeHeaderItem}>
            <span className={styles.gradeHeaderLabel}>グレード</span>
            <span className={styles.gradeHeaderValue}>{gradeLabel}</span>
          </div>
          <div className={styles.gradeHeaderItem}>
            <span className={styles.gradeHeaderLabel}>現在の難易度</span>
            <span className={styles.gradeHeaderValue}>
              {currentTargetDifficulty != null ? `Lv.${currentTargetDifficulty}` : "—"}
            </span>
          </div>
        </div>
        <div className={styles.gradeHeaderProgress}>{progressText}</div>
      </section>

      <StatusTab
        activeStatus={activeStatus}
        counts={counts}
        onChange={(s) => {
          // StatusTab は CardStatus 型 (active|improving|cleared) を渡してくるが、
          // 表示タブは active/cleared のみ。improving は無視 (タブが消えているので来ない想定)
          if (s === "active" || s === "cleared") setActiveStatus(s)
        }}
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
