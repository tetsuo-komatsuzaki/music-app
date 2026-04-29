"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import styles from "../practice.module.css"
import type { ScoredItemDTO, RecommendReason } from "@/app/lib/practice/getRecommendations"
import type { PracticeStats } from "@/app/lib/practice/getPracticeStats"
import OnboardingTrigger from "../../_onboarding/OnboardingTrigger"

type PracticeItemDTO = {
  id: string
  title: string
  composer: string | null
  category: string
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
  filterOptions: { keys: string[]; positions: string[] }
  currentFilters: { key?: string; position?: string }
  recommendations: ScoredItemDTO[]
  stats: PracticeStats
}

type ViewType = "recommend" | "group" | "all"
type SortType = "recommend" | "practices"

const modeLabels: Record<string, string> = { major: "長調", minor: "短調" }

const REASON_LABELS: Record<RecommendReason, string> = {
  weakness: "苦手克服",
  continue: "継続練習",
  same_key: "同じ調",
}

const REASON_COLORS: Record<RecommendReason, string> = {
  weakness: styles.reasonWeakness,
  continue: styles.reasonContinue,
  same_key: styles.reasonSameKey,
}

const SCALE_TYPE_EN: Record<string, string> = {
  "長調":      "Major Scale",
  "和声的短調": "Harmonic Minor",
  "旋律的短調": "Melodic Minor",
  "自然短調":  "Natural Minor",
  "半音階":    "Chromatic Scale",
}
const CHORD_TYPE_EN: Record<string, string> = {
  "長和音":   "Major Triad",
  "短和音":   "Minor Triad",
  "属七和音": "Dominant 7th",
  "減七和音": "Diminished 7th",
  "増三和音": "Augmented Triad",
}

function extractCardInfo(item: PracticeItemDTO | ScoredItemDTO) {
  const category = item.category
  const isEtude    = category === "etude"
  const isArpeggio = category === "arpeggio"

  const titleParts = item.title.split(" ")
  const typeLabel  = titleParts[1] ?? ""

  const keyTonic = "keyTonic" in item ? item.keyTonic : ""

  const shortTitle = isEtude ? item.title : `${keyTonic} ${typeLabel}`

  const subtitle = isEtude
    ? null
    : isArpeggio
    ? (CHORD_TYPE_EN[typeLabel] ?? "")
    : (SCALE_TYPE_EN[typeLabel] ?? "")

  const octMatch = item.title.match(/(\d+)オクターブ/)
  const octaves  = octMatch ? parseInt(octMatch[1]) : null

  const techniques = "techniques" in item ? item.techniques : ("techniqueNames" in item ? (item as ScoredItemDTO).techniqueNames : [])
  const bowTech   = techniques[0] ?? null
  const chordType = isArpeggio ? typeLabel : null

  return { shortTitle, subtitle, octaves, bowTech, chordType }
}

function relativeDate(isoString: string): string {
  const days = Math.floor((Date.now() - new Date(isoString).getTime()) / 86400000)
  if (days === 0) return "今日"
  if (days === 1) return "昨日"
  if (days < 7)  return `${days}日前`
  if (days < 30) return `${Math.floor(days / 7)}週間前`
  if (days < 365) return `${Math.floor(days / 30)}ヶ月前`
  return `${Math.floor(days / 365)}年前`
}

// ────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────

function StatsRow({ stats }: { stats: PracticeStats }) {
  const pct = stats.totalItems > 0
    ? Math.round((stats.practicedItems / stats.totalItems) * 100)
    : 0
  return (
    <div className={styles.statsRow}>
      <div className={styles.statCard}>
        <div className={styles.statValue}>{stats.practicedItems}<span className={styles.statUnit}>/{stats.totalItems}</span></div>
        <div className={styles.statLabel}>練習済み</div>
        <div className={styles.statBar}><div className={styles.statBarFill} style={{ width: `${pct}%` }} /></div>
      </div>
      <div className={styles.statCard}>
        <div className={styles.statValue}>
          {stats.avgPitchAccuracy > 0 ? `${stats.avgPitchAccuracy}` : "–"}<span className={styles.statUnit}>{stats.avgPitchAccuracy > 0 ? "%" : ""}</span>
        </div>
        <div className={styles.statLabel}>音程精度 (推定)</div>
      </div>
      <div className={styles.statCard}>
        <div className={styles.statValue}>{stats.weakKeyCount}</div>
        <div className={styles.statLabel}>苦手な調</div>
      </div>
    </div>
  )
}

function RecommendCard({ item, userId, category }: { item: ScoredItemDTO; userId: string; category: string }) {
  const { shortTitle, subtitle } = extractCardInfo(item)

  return (
    <Link href={`/${userId}/practice/${category}/${item.id}`} className={styles.recCard}>
      <div className={styles.recCardInner}>
        <span className={`${styles.recReason} ${REASON_COLORS[item.reason]}`}>
          {REASON_LABELS[item.reason]}
        </span>
        <div className={styles.recTitle}>{shortTitle}</div>
        {subtitle && <div className={styles.recSubtitle}>{subtitle}</div>}
        {item.lastPracticed && (
          <div className={styles.recLast}>{relativeDate(item.lastPracticed)}</div>
        )}
      </div>
    </Link>
  )
}

function ItemCard({ item, userId, category }: { item: PracticeItemDTO; userId: string; category: string }) {
  const { shortTitle, subtitle, octaves, bowTech, chordType } = extractCardInfo(item)
  return (
    <Link href={`/${userId}/practice/${category}/${item.id}`} className={styles.itemCard}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>{shortTitle}</div>
      </div>
      {subtitle && <div className={styles.cardSubtitle}>{subtitle}</div>}
      <div className={styles.chipRow}>
        {octaves != null && <span className={styles.chipBlue}>{octaves} オクターブ</span>}
        {bowTech && <span className={styles.chipGreen}>{bowTech}</span>}
        {item.positions.length > 0 && <span className={styles.chipGray}>{item.positions.join(", ")}</span>}
        {chordType && <span className={styles.chipPurple}>{chordType}</span>}
      </div>
      <div className={styles.cardFooter}>
        <div className={styles.cardFooterLeft}>
          <div className={styles.cardFooterLabel}>最終練習</div>
          <div className={styles.cardFooterValue}>
            {item.lastPracticed ? relativeDate(item.lastPracticed) : "未練習"}
          </div>
        </div>
        <div>
          {item.totalPractices > 0 ? (
            <span className={styles.scoreBadge}>練習済み {item.totalPractices}回</span>
          ) : (
            <span className={styles.cardFooterEmpty}>スコアなし</span>
          )}
        </div>
      </div>
    </Link>
  )
}

// ────────────────────────────────────────────────────────────
// View 1: おすすめ順
// ────────────────────────────────────────────────────────────

function RecommendView({
  items, recommendations, stats, userId, category,
}: {
  items: PracticeItemDTO[]
  recommendations: ScoredItemDTO[]
  stats: PracticeStats
  userId: string
  category: string
}) {
  const recent = items
    .filter((i) => i.lastPracticed != null)
    .sort((a, b) => new Date(b.lastPracticed!).getTime() - new Date(a.lastPracticed!).getTime())
    .slice(0, 5)

  return (
    <div>
      <StatsRow stats={stats} />

      {recommendations.length > 0 && (
        <section className={styles.viewSection}>
          <h2 className={styles.sectionTitle}>AIおすすめ</h2>
          <div className={styles.recScroll}>
            {recommendations.map((r) => (
              <RecommendCard key={r.id} item={r} userId={userId} category={category} />
            ))}
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section className={styles.viewSection}>
          <h2 className={styles.sectionTitle}>最近練習した曲</h2>
          <div className={styles.itemList}>
            {recent.map((item) => (
              <ItemCard key={item.id} item={item} userId={userId} category={category} />
            ))}
          </div>
        </section>
      )}

      {recommendations.length === 0 && recent.length === 0 && (
        <div className={styles.emptyState}>練習アイテムがありません</div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// View 2: グループ別
// ────────────────────────────────────────────────────────────

const CHORD_ORDER = ["長和音", "短和音", "属七和音", "減七和音", "増三和音"]
const KEY_ORDER   = ["C","G","D","A","E","B","F#","Db","Ab","Eb","Bb","F"]

function GroupView({
  items, userId, category,
}: {
  items: PracticeItemDTO[]
  userId: string
  category: string
}) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)

  let groups: { key: string; label: string; items: PracticeItemDTO[] }[] = []

  if (category === "scale" || category === "scales") {
    const map = new Map<string, PracticeItemDTO[]>()
    for (const item of items) {
      const k = item.keyTonic || "?"
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(item)
    }
    groups = KEY_ORDER
      .filter((k) => map.has(k))
      .map((k) => ({ key: k, label: k, items: map.get(k)! }))
    for (const [k, v] of map) {
      if (!KEY_ORDER.includes(k)) groups.push({ key: k, label: k, items: v })
    }
  } else if (category === "arpeggio" || category === "arpeggios") {
    const map = new Map<string, PracticeItemDTO[]>()
    for (const item of items) {
      const typeLabel = item.title.split(" ")[1] ?? "その他"
      if (!map.has(typeLabel)) map.set(typeLabel, [])
      map.get(typeLabel)!.push(item)
    }
    groups = CHORD_ORDER
      .filter((k) => map.has(k))
      .map((k) => ({ key: k, label: `${k} (${CHORD_TYPE_EN[k] ?? ""})`, items: map.get(k)! }))
    for (const [k, v] of map) {
      if (!CHORD_ORDER.includes(k)) groups.push({ key: k, label: k, items: v })
    }
  } else {
    const map = new Map<string, PracticeItemDTO[]>()
    for (const item of items) {
      const k = item.composer || "不明"
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(item)
    }
    for (const [k, v] of map) groups.push({ key: k, label: k, items: v })
    groups.sort((a, b) => a.key.localeCompare(b.key))
  }

  const activeGroup = selectedGroup ? groups.find((g) => g.key === selectedGroup) : null

  if (activeGroup) {
    const subGroups: { label: string; items: PracticeItemDTO[] }[] = []
    if (category === "scale" || category === "scales") {
      const byMode = new Map<string, PracticeItemDTO[]>()
      for (const item of activeGroup.items) {
        const m = modeLabels[item.keyMode] || item.keyMode || "その他"
        if (!byMode.has(m)) byMode.set(m, [])
        byMode.get(m)!.push(item)
      }
      for (const [m, v] of byMode) subGroups.push({ label: m, items: v })
    } else if (category === "arpeggio" || category === "arpeggios") {
      const byKey = new Map<string, PracticeItemDTO[]>()
      for (const item of activeGroup.items) {
        const k = item.keyTonic || "?"
        if (!byKey.has(k)) byKey.set(k, [])
        byKey.get(k)!.push(item)
      }
      KEY_ORDER.forEach((k) => {
        if (byKey.has(k)) subGroups.push({ label: k, items: byKey.get(k)! })
      })
      for (const [k, v] of byKey) {
        if (!KEY_ORDER.includes(k)) subGroups.push({ label: k, items: v })
      }
    } else {
      subGroups.push({ label: "", items: activeGroup.items })
    }

    return (
      <div>
        <button className={styles.groupBack} onClick={() => setSelectedGroup(null)}>
          ← {activeGroup.label}
        </button>
        {subGroups.map((sg) => (
          <section key={sg.label} className={styles.viewSection}>
            {sg.label && <h2 className={styles.sectionTitle}>{sg.label}</h2>}
            <div className={styles.itemList}>
              {sg.items.map((item) => (
                <ItemCard key={item.id} item={item} userId={userId} category={category} />
              ))}
            </div>
          </section>
        ))}
      </div>
    )
  }

  const isKeyGrid = category === "scale" || category === "scales"
  return (
    <div className={isKeyGrid ? styles.keyGrid : styles.groupGrid}>
      {groups.map((g) => {
        const practiced = g.items.filter((i) => i.lastPracticed).length
        return (
          <button
            key={g.key}
            className={isKeyGrid ? styles.keyCell : styles.groupCell}
            onClick={() => setSelectedGroup(g.key)}
          >
            <div className={styles.groupCellKey}>{g.key}</div>
            <div className={styles.groupCellCount}>{practiced}/{g.items.length}</div>
          </button>
        )
      })}
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// View 3: すべて（フィルタ + ソート）
// ────────────────────────────────────────────────────────────

function AllView({
  items, filterOptions, currentFilters, userId, category,
}: {
  items: PracticeItemDTO[]
  filterOptions: Props["filterOptions"]
  currentFilters: Props["currentFilters"]
  userId: string
  category: string
}) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<SortType>("recommend")

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams()
    const newFilters = { ...currentFilters, [key]: value }
    for (const [k, v] of Object.entries(newFilters)) {
      if (v) params.set(k, v)
    }
    router.push(`/${userId}/practice/${category}?${params.toString()}`)
  }

  let filtered = search.trim()
    ? items.filter((i) => i.title.includes(search) || (i.composer ?? "").includes(search))
    : items

  // ソート
  if (sortBy === "practices") {
    filtered = [...filtered].sort((a, b) => b.totalPractices - a.totalPractices)
  }

  return (
    <div>
      {/* Search */}
      <input
        className={styles.searchInput}
        placeholder="タイトルで検索…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Filters + Sort */}
      <div className={styles.filters} data-onboarding="categoryList.filters">
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

        <select
          className={styles.filterSelect}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortType)}
        >
          <option value="recommend">おすすめ順</option>
          <option value="practices">演奏回数順</option>
        </select>
      </div>

      {filtered.length === 0 && (
        <div className={styles.emptyState}>該当する練習メニューがありません</div>
      )}

      <div className={styles.itemList}>
        {filtered.map((item) => (
          <ItemCard key={item.id} item={item} userId={userId} category={category} />
        ))}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────

export default function PracticeList({
  userId, category, categoryTitle, items, filterOptions, currentFilters, recommendations, stats,
}: Props) {
  const [activeView, setActiveView] = useState<ViewType>("recommend")

  const tabs: { key: ViewType; label: string }[] = [
    { key: "recommend", label: "おすすめ順" },
    { key: "group",     label: "グループ別" },
    { key: "all",       label: "すべて" },
  ]

  return (
    <div className={styles.container}>
      <div className={styles.listHeader}>
        <h1 className={styles.pageTitle}>{categoryTitle}</h1>
        <Link href={`/${userId}/practice`} style={{ fontSize: 13, color: "#4a90d9" }}>
          ← 練習メニュー
        </Link>
      </div>

      <div className={styles.tabRow}>
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`${styles.tab} ${activeView === t.key ? styles.tabActive : ""}`}
            onClick={() => setActiveView(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeView === "recommend" && (
        <RecommendView
          items={items}
          recommendations={recommendations}
          stats={stats}
          userId={userId}
          category={category}
        />
      )}
      {activeView === "group" && (
        <GroupView items={items} userId={userId} category={category} />
      )}
      {activeView === "all" && (
        <AllView
          items={items}
          filterOptions={filterOptions}
          currentFilters={currentFilters}
          userId={userId}
          category={category}
        />
      )}

      <OnboardingTrigger pageKey="categoryList" />
    </div>
  )
}
