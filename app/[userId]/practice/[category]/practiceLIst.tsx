"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import styles from "../practice.module.css"
import type { PracticeStats } from "@/app/lib/practice/getPracticeStats"
import OnboardingTrigger from "../../_onboarding/OnboardingTrigger"
import { tonicToJa } from "@/app/_libs/musicNotation"

type PracticeItemDTO = {
  id: string
  title: string
  composer: string | null
  category: string
  star: number | null
  keyTonic: string
  keyMode: string
  modeVariant?: string | null
  chordType?: string | null
  positions: string[]
  techniques: string[]
  descriptionShort: string | null
  lastPracticed: string | null
  totalPractices: number
}

const CHORD_TYPE_LABEL_JA: Record<string, string> = {
  major_triad: "長和音",
  minor_triad: "短和音",
  augmented:   "増和音",
  dominant7:   "属7和音",
  diminished7: "減7和音",
}

const CHORD_TYPE_LABEL_EN: Record<string, string> = {
  major_triad: "Major Triad",
  minor_triad: "Minor Triad",
  augmented:   "Augmented Triad",
  dominant7:   "Dominant 7th",
  diminished7: "Diminished 7th",
}

const VARIANT_LABEL: Record<string, string> = {
  harmonic: "和声",
  melodic: "旋律",
  natural: "自然",
}

function modeLabelWithVariant(item: { keyMode: string; modeVariant?: string | null }): string {
  const base = modeLabels[item.keyMode] || item.keyMode || "その他"
  if (item.keyMode === "minor" && item.modeVariant && VARIANT_LABEL[item.modeVariant]) {
    return `${base}(${VARIANT_LABEL[item.modeVariant]})`
  }
  return base
}

type Props = {
  userId: string
  category: string
  categoryTitle: string
  items: PracticeItemDTO[]
  filterOptions: { keys: string[]; positions: string[] }
  currentFilters: { key?: string; position?: string }
  stats: PracticeStats
}

type ViewType = "star" | "group"

const modeLabels: Record<string, string> = { major: "長調", minor: "短調" }

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

// title を音名/スケール種別に分解して表示するカテゴリ (音階・アルペジオのみ)。
// それ以外 (エチュード / 基礎練の fingering・bowing・position_shift・double_stop) は
// アップロードされた教材の title をそのまま表示する。
function decomposesTitle(category: string): boolean {
  return ["scale", "scales", "arpeggio", "arpeggios"].includes(category)
}

function extractCardInfo(item: PracticeItemDTO) {
  const category = item.category
  const isArpeggio = category === "arpeggio" || category === "arpeggios"
  const decompose  = decomposesTitle(category)

  // 新形式タイトル: "Bb(2オクターブ・低)" / "A(3オクターブ)"
  // 旧形式タイトル: "Bb 長調 2オクターブ デタシェ (低音域)" / "A 長調 長和音 3オクターブ デタシェ"
  // 音階/アルペジオは tonic 部分を抽出 (両形式互換)。それ以外は title をそのまま表示。
  const tonicMatch = item.title.match(/^([A-G][#b]?)/)
  const titleParts = item.title.split(" ")
  // 分解カテゴリ(音階/アルペジオ)は短いトニック表示。それ以外(ボーイング/フィンガリング等)は
  // フルの題名。アンダースコア区切りは見栄えが悪いので中点に整える (2026-06-08)。
  const shortTitle = decompose
    ? (tonicMatch?.[1] ?? titleParts[0] ?? "")
    : item.title.replace(/_/g, "・")

  // subtitle: arpeggio は metadata.chordType (新形式) 優先、scale は旧形式 fallback
  let subtitle: string | null = null
  if (decompose) {
    if (isArpeggio) {
      const ct = "chordType" in item ? item.chordType : null
      if (ct && CHORD_TYPE_LABEL_EN[ct]) {
        subtitle = CHORD_TYPE_LABEL_EN[ct]
      } else {
        // 旧形式 title 第3要素 (互換)
        subtitle = CHORD_TYPE_EN[titleParts[2] ?? ""] ?? ""
      }
    } else {
      subtitle = SCALE_TYPE_EN[titleParts[1] ?? ""] ?? ""
    }
  }

  const octMatch = item.title.match(/(\d+)オクターブ/)
  const octaves  = octMatch ? parseInt(octMatch[1]) : null

  const techniques = item.techniques
  const bowTech   = techniques[0] ?? null

  // chordType chip: arpeggio のみ。metadata.chordType 優先、旧 title 形式 fallback
  let chordType: string | null = null
  if (isArpeggio) {
    const ct = "chordType" in item ? item.chordType : null
    if (ct && CHORD_TYPE_LABEL_JA[ct]) {
      chordType = CHORD_TYPE_LABEL_JA[ct]
    } else {
      chordType = titleParts[2] ?? null  // 旧形式
    }
  }

  return { shortTitle, subtitle, octaves, bowTech, chordType, decompose }
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

// カバープレースホルダ: カテゴリ色 + グリフ + ☆ (練習曲カードと共通の .matCover/.matStar を再利用)。
// 将来 coverImagePath の写真を差し込める枠。
const CAT_COVER: Record<string, { a: string; b: string }> = {
  scale:          { a: "#12988f", b: "#0c645d" },
  scales:         { a: "#12988f", b: "#0c645d" },
  arpeggio:       { a: "#8a54b8", b: "#573380" },
  arpeggios:      { a: "#8a54b8", b: "#573380" },
  etude:          { a: "#d9722a", b: "#9a4d18" },
  etudes:         { a: "#d9722a", b: "#9a4d18" },
  fingering:      { a: "#3f78d4", b: "#24447e" },
  bowing:         { a: "#2e9866", b: "#1c6041" },
  position_shift: { a: "#c85d86", b: "#8a3556" },
  double_stop:    { a: "#5b78c9", b: "#374a80" },
  _default:       { a: "#3f78d4", b: "#24447e" },
}

function coverGlyph(category: string) {
  if (category === "scale" || category === "scales") {
    return <path d="M4 15c3 0 3-8 6-8s3 8 6 8M4 19h16" />
  }
  if (category === "arpeggio" || category === "arpeggios") {
    return <><circle cx="6" cy="17" r="2.3" /><circle cx="18" cy="13" r="2.3" /><path d="M8.3 16.3 15.8 13M8 15V8l10-2.4V11" /></>
  }
  if (category === "etude" || category === "etudes") {
    return <><path d="M6 4v13" /><circle cx="6" cy="18.5" r="2.2" /><path d="M11 8h7M11 12h7M11 16h4" /></>
  }
  // fingering / bowing / position_shift / double_stop 等
  return <><path d="M9 18V6l9-2v12" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="15.5" cy="16" r="2.5" /></>
}

function CategoryCover({ category, star }: { category: string; star: number | null }) {
  const c = CAT_COVER[category] ?? CAT_COVER._default
  return (
    <div className={styles.matCover} style={{ background: `linear-gradient(150deg, ${c.a}, ${c.b})` }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round">
        {coverGlyph(category)}
      </svg>
      {star != null && (
        <span className={styles.matStar}>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="#fff">
            <path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.7 5.9 21l1.5-6.8L2.2 9.6l6.9-.7z" />
          </svg>
          {star}
        </span>
      )}
    </div>
  )
}

function ItemCard({ item, userId, category }: { item: PracticeItemDTO; userId: string; category: string }) {
  const { shortTitle, subtitle, octaves, bowTech, chordType, decompose } = extractCardInfo(item)
  return (
    <Link href={`/${userId}/practice/${category}/${item.id}`} className={styles.itemCard}>
      <CategoryCover category={category} star={item.star} />
      <div className={styles.itemCardBody}>
      <div className={styles.cardHeader}>
        {/* 分解(音階/アルペジオ)は短いトニックを大きめ、非分解(長いフル題名)は小さめで揃える */}
        <div className={decompose ? styles.cardTitle : styles.cardTitleFull}>{shortTitle}</div>
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
      </div>
    </Link>
  )
}

// ────────────────────────────────────────────────────────────
// View 1: ☆順 (難易度タブ)
// ────────────────────────────────────────────────────────────
// 練習曲 (pieces) と同じ☆タブ仕様。star 未設定の教材も隠さないよう、
// null の教材がある場合のみ末尾に「☆未設定」フォールバックタブを設ける。

type StarTab = number | "none"

function StarView({
  items, userId, category,
}: {
  items: PracticeItemDTO[]
  userId: string
  category: string
}) {
  const starValues = Array.from(
    new Set(items.map((i) => i.star).filter((s): s is number => s != null)),
  ).sort((a, b) => a - b)
  const hasNull = items.some((i) => i.star == null)
  const tabs: StarTab[] = [...starValues, ...(hasNull ? (["none"] as StarTab[]) : [])]

  const [active, setActive] = useState<StarTab | null>(tabs.length ? tabs[0] : null)

  if (tabs.length === 0) {
    return (
      <p className={styles.cardContextEmpty}>
        公開されている教材はまだありません。
      </p>
    )
  }

  const filtered = items.filter((i) =>
    active === "none" ? i.star == null : i.star === active,
  )

  return (
    <div>
      {/* ☆ごとの横並びタブ */}
      <div className={styles.starTabs}>
        {tabs.map((t) => (
          <button
            key={String(t)}
            type="button"
            className={`${styles.starTab} ${active === t ? styles.starTabActive : ""}`}
            onClick={() => setActive(t)}
          >
            {t === "none" ? "☆未設定" : `☆${t}`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className={styles.cardContextEmpty}>この難易度の教材はありません。</p>
      ) : (
        <section className={styles.viewSection}>
          <div className={styles.itemList}>
            {filtered.map((item) => (
              <ItemCard key={item.id} item={item} userId={userId} category={category} />
            ))}
          </div>
        </section>
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

  // 音階(tonic別) / アルペジオ(和音種別) / エチュード(作曲者別) のみグループ化。
  // 基礎練の新カテゴリ (fingering・bowing・position_shift・double_stop) は
  // グループ化せず、教材の title をそのまま一覧表示する。
  const isGrouped = ["scale", "scales", "arpeggio", "arpeggios", "etude", "etudes"].includes(category)
  if (!isGrouped) {
    return (
      <section className={styles.viewSection}>
        <div className={styles.itemList}>
          {items.map((item) => (
            <ItemCard key={item.id} item={item} userId={userId} category={category} />
          ))}
        </div>
      </section>
    )
  }

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
      .map((k) => ({ key: k, label: tonicToJa(k), items: map.get(k)! }))
    for (const [k, v] of map) {
      if (!KEY_ORDER.includes(k)) groups.push({ key: k, label: tonicToJa(k), items: v })
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
        const m = modeLabelWithVariant(item)
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
        if (byKey.has(k)) subGroups.push({ label: tonicToJa(k), items: byKey.get(k)! })
      })
      for (const [k, v] of byKey) {
        if (!KEY_ORDER.includes(k)) subGroups.push({ label: tonicToJa(k), items: v })
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
// Main component
// ────────────────────────────────────────────────────────────

export default function PracticeList({
  userId, category, categoryTitle, items, filterOptions: _filterOptions, currentFilters: _currentFilters, stats: _stats,
}: Props) {
  void _filterOptions
  void _currentFilters
  void _stats
  const searchParams = useSearchParams()
  const initialView: ViewType = (() => {
    const v = searchParams.get("view")
    if (v === "star" || v === "group") return v
    return "star"
  })()
  const [activeView, setActiveView] = useState<ViewType>(initialView)

  // URL の ?view= が変化したら state を同期 (オンボーディングからのナビゲーション用)
  useEffect(() => {
    const v = searchParams.get("view")
    if (v === "star" || v === "group") {
      setActiveView(v)
    }
  }, [searchParams])

  const tabs: { key: ViewType; label: string }[] = [
    { key: "star",  label: "☆順" },
    { key: "group", label: "グループ別" },
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

      {activeView === "star" && (
        <StarView items={items} userId={userId} category={category} />
      )}
      {activeView === "group" && (
        <GroupView items={items} userId={userId} category={category} />
      )}

      <OnboardingTrigger pageKey="categoryList" />
    </div>
  )
}
