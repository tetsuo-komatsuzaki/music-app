"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import styles from "../practice.module.css"

type PracticeItemDTO = {
  id: string
  title: string
  composer: string | null
  category: string
  difficulty: number
  keyTonic: string
  keyMode: string
  positions: string[]
  techniques: string[]
  descriptionShort: string | null
  lastPracticed: string | null
  totalPractices: number
}

type Props = {
  userId: string
  category: string
  categoryTitle: string
  items: PracticeItemDTO[]
  filterOptions: { keys: string[]; difficulties: number[]; positions: string[] }
  currentFilters: { key?: string; difficulty?: string; position?: string }
}

const modeLabels: Record<string, string> = { major: "長調", minor: "短調" }

function Stars({ count }: { count: number }) {
  return (
    <span className={styles.stars}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= count ? styles.starFilled : styles.starEmpty}>★</span>
      ))}
    </span>
  )
}

export default function PracticeList({
  userId, category, categoryTitle, items, filterOptions, currentFilters,
}: Props) {
  const router = useRouter()

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams()
    const newFilters = { ...currentFilters, [key]: value }
    for (const [k, v] of Object.entries(newFilters)) {
      if (v) params.set(k, v)
    }
    router.push(`/${userId}/practice/${category}?${params.toString()}`)
  }

  return (
    <div className={styles.container}>
      <div className={styles.listHeader}>
        <h1 className={styles.pageTitle}>{categoryTitle}</h1>
        <Link href={`/${userId}/practice`} style={{ fontSize: 13, color: "#4a90d9" }}>
          ← 練習メニュー
        </Link>
      </div>

      <div className={styles.filters}>
        <select
          className={styles.filterSelect}
          value={currentFilters.key || ""}
          onChange={(e) => handleFilterChange("key", e.target.value)}
        >
          <option value="">調: 全て</option>
          {filterOptions.keys.map((k) => {
            const [tonic, mode] = k.split("_")
            return <option key={k} value={k}>{tonic} {modeLabels[mode] || mode}</option>
          })}
        </select>

        <select
          className={styles.filterSelect}
          value={currentFilters.difficulty || ""}
          onChange={(e) => handleFilterChange("difficulty", e.target.value)}
        >
          <option value="">難易度: 全て</option>
          {filterOptions.difficulties.sort().map((d) => (
            <option key={d} value={String(d)}>{"★".repeat(d)}{"☆".repeat(5 - d)}</option>
          ))}
        </select>

        {filterOptions.positions.length > 0 && (
          <select
            className={styles.filterSelect}
            value={currentFilters.position || ""}
            onChange={(e) => handleFilterChange("position", e.target.value)}
          >
            <option value="">ポジション: 全て</option>
            {filterOptions.positions.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        )}
      </div>

      <div className={styles.itemList}>
        {items.length === 0 && (
          <div className={styles.emptyState}>該当する練習メニューがありません</div>
        )}
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/${userId}/practice/${category}/${item.id}`}
            className={styles.itemCard}
          >
            <div className={styles.itemTitle}>
              {item.title}
              <Stars count={item.difficulty} />
            </div>
            {item.composer && <div className={styles.itemComposer}>{item.composer}</div>}
            <div className={styles.itemMeta}>
              {item.keyTonic} {modeLabels[item.keyMode] || item.keyMode}
              {item.positions.length > 0 && ` · ${item.positions.join(", ")}`}
              {item.techniques.length > 0 && ` · ${item.techniques.join(", ")}`}
            </div>
            {item.descriptionShort && (
              <div className={styles.itemDescription}>{item.descriptionShort}</div>
            )}
            {item.lastPracticed ? (
              <div className={styles.itemHistory}>
                最終練習: {new Date(item.lastPracticed).toLocaleDateString("ja-JP")}
                {" · "}練習回数: {item.totalPractices}回
              </div>
            ) : (
              <div className={styles.itemMeta}>未練習</div>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}

