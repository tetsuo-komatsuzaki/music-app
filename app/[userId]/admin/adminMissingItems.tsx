"use client"

// v1.6 Phase 6 (2026-05-18) — MissingPracticeItemFlag 一覧クライアント。
// (keyTonic, keyMode, star) グループ → missingCategory 別カードを表示。
// 「解決済みにする」= グループ単位一括 (resolveMissingPracticeItemFlag)。

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import styles from "./adminMissingItems.module.css"
import type { ResolveMissingFlagResult } from "@/app/actions/resolveMissingPracticeItemFlag"

type CategoryDto = {
  missingCategory: string
  unresolvedCount: number
  resolvedCount: number
  subTaskTypes: string[]
  scores: { id: string; title: string }[]
  earliestDetectedAt: string
  allResolved: boolean
}
type GroupDto = {
  key: string
  keyTonic: string
  keyMode: string
  star: number
  categories: CategoryDto[]
}

type Props = {
  userId: string
  groups: GroupDto[]
  totalUnresolved: number
  totalFlags: number
  resolveAction: (input: {
    keyTonic: string
    keyMode: string
    star: number
    missingCategory: string
  }) => Promise<ResolveMissingFlagResult>
}

const CATEGORY_LABEL: Record<string, string> = {
  scale: "音階",
  arpeggio: "アルペジオ",
  etude: "エチュード",
}

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(
    d.getDate(),
  ).padStart(2, "0")}`
}

export default function AdminMissingItems({
  userId,
  groups,
  totalUnresolved,
  totalFlags,
  resolveAction,
}: Props) {
  const [showResolved, setShowResolved] = useState(false)
  const [pending, startTransition] = useTransition()
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const visibleGroups = useMemo(() => {
    if (showResolved) return groups
    return groups
      .map((g) => ({
        ...g,
        categories: g.categories.filter((c) => c.unresolvedCount > 0),
      }))
      .filter((g) => g.categories.length > 0)
  }, [groups, showResolved])

  const handleResolve = (
    g: GroupDto,
    c: CategoryDto,
  ) => {
    const k = `${g.key}|${c.missingCategory}`
    setBusyKey(k)
    setMessage(null)
    startTransition(async () => {
      const res = await resolveAction({
        keyTonic: g.keyTonic,
        keyMode: g.keyMode,
        star: g.star,
        missingCategory: c.missingCategory,
      })
      if ("error" in res) {
        setMessage(`解決に失敗: ${res.error}`)
      } else {
        setMessage(
          `${g.keyTonic}/${g.keyMode} ★${g.star} の${
            CATEGORY_LABEL[c.missingCategory] ?? c.missingCategory
          }を解決済みにしました (${res.resolvedCount}件)`,
        )
      }
      setBusyKey(null)
    })
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>不足教材フラグ</h1>
        <Link href={`/${userId}/admin/practice`} className={styles.navLink}>
          ← 教材管理へ
        </Link>
      </div>

      <p className={styles.summary}>
        未解決 <strong>{totalUnresolved}</strong> 件 / 全 {totalFlags} 件。
        Phase 3b で 3 カテゴリの教材が揃わず SubTask 生成が skip された
        (keyTonic/keyMode/★) を表示しています。該当教材を作成したら
        「解決済みにする」を押してください。
      </p>

      <label className={styles.toggle}>
        <input
          type="checkbox"
          checked={showResolved}
          onChange={(e) => setShowResolved(e.target.checked)}
        />
        解決済みも表示
      </label>

      {message && (
        <div className={styles.message} role="status">
          {message}
        </div>
      )}

      {visibleGroups.length === 0 ? (
        <div className={styles.empty}>
          {showResolved
            ? "フラグはありません。"
            : "未解決の不足教材フラグはありません 🎉"}
        </div>
      ) : (
        <ul className={styles.groupList}>
          {visibleGroups.map((g) => (
            <li key={g.key} className={styles.group}>
              <div className={styles.groupHead}>
                <span className={styles.groupKey}>
                  {g.keyTonic} / {g.keyMode} / ★{g.star}
                </span>
              </div>
              <ul className={styles.catList}>
                {g.categories.map((c) => {
                  const k = `${g.key}|${c.missingCategory}`
                  const resolved = c.unresolvedCount === 0
                  return (
                    <li
                      key={k}
                      className={`${styles.cat} ${
                        resolved ? styles.catResolved : ""
                      }`}
                    >
                      <div className={styles.catMain}>
                        <span className={styles.catName}>
                          {CATEGORY_LABEL[c.missingCategory] ??
                            c.missingCategory}
                        </span>
                        <span className={styles.catMeta}>
                          未解決 {c.unresolvedCount} / 解決 {c.resolvedCount}
                          {" ・ "}
                          検出 {fmtDate(c.earliestDetectedAt)}
                        </span>
                        {c.subTaskTypes.length > 0 && (
                          <span className={styles.subTasks}>
                            小課題: {c.subTaskTypes.join(", ")}
                          </span>
                        )}
                        {c.scores.length > 0 && (
                          <span className={styles.scores}>
                            対象曲:{" "}
                            {c.scores.map((s) => s.title).join(" / ")}
                          </span>
                        )}
                      </div>
                      {resolved ? (
                        <span className={styles.resolvedBadge}>解決済み</span>
                      ) : (
                        <button
                          type="button"
                          className={styles.resolveBtn}
                          disabled={pending && busyKey === k}
                          onClick={() => handleResolve(g, c)}
                        >
                          {pending && busyKey === k
                            ? "処理中…"
                            : "解決済みにする"}
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
