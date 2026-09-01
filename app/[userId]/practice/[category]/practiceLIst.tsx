"use client"

import StaggerRail from "@/app/components/StaggerRail"
import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import styles from "../practice.module.css"
import type { PracticeStats } from "@/app/lib/practice/getPracticeStats"
import { tonicToJa } from "@/app/_libs/musicNotation"
import BasicsPreSheet from "./BasicsPreSheet"
import PrePracticeSheet from "../pieces/PrePracticeSheet"

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
  /** 重音の度数など double_stop 系特徴タグ名 (区分軸用) */
  intervals?: string[]
  /** 族(グループ)。音階/アルペジオの調シート用 (Phase C-basics) */
  groupId?: string | null
  /** パート定義 (グループ単位・2026-08-25) */
  groupParts?: { id: string; name: string; startMeasure: number; endMeasure: number }[]
  /** 族の軸。練習前シートのプルダウンになる (2026-08-25) */
  groupAxes?: { key: string; label: string; kind: "select" | "toggle"; values: string[] }[] | null
  /** 教材名から取り出した軸の値。族名_軸1_軸2 の 軸1以降 */
  axisValues?: string[]
  /** 個別パターン名 (奏法・リズムレシピで付けた名前) */
  patternName?: string | null
  /** 実体化されたパート教材 (2026-08-25 案B) */
  partId?: string | null
  partName?: string | null
  /** パート教材の切り出し元 (通し変種) のid。2026-09-01 */
  sourceItemId?: string | null
  /** 奏法別・リズム別・パート別。一覧には出さずシートの中で選ぶ (2026-09-01) */
  isVariant?: boolean
  groupTitle?: string | null
  articulation?: string | null
  /** 難易度 (エチュードシート用) */
  difficulty?: string | null
  descriptionShort: string | null
  lastPracticed: string | null
  totalPractices: number
  /** 自己ベストスコア(0-100)。無ければ null */
  bestScore?: number | null
  /** AI生成カバー画像URL。無ければプレースホルダ */
  coverImagePath?: string | null
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
  /** 練習前シートの「パートを選ぶ」用。一覧には出さないパート教材 (2026-08-28) */
  partItems?: PracticeItemDTO[]
  filterOptions: { keys: string[]; positions: string[] }
  currentFilters: { key?: string; position?: string }
  stats: PracticeStats
  /** ユーザーの現在★。奏法/調の選択可否は「開いたタブ」ではなくこのレベルで判定する */
  userStar?: number | null
  /** カルテで「取り組んだが未習得」と出ている技法名。一覧の学びポイント表示に使う */
  weakTechniques?: string[]
}

type ViewType = "star" | "group"

// 学びポイント (2026-08-25「案5」)。カードは StarView/GroupView の下に深く入るため、
// props を全段に通さずコンテキストで配る。
const WeakTechniquesContext = createContext<Set<string>>(new Set())

const modeLabels: Record<string, string> = { major: "長調", minor: "短調" }

const CHORD_TYPE_EN: Record<string, string> = {
  "長和音":   "Major Triad",
  "短和音":   "Minor Triad",
  "属七和音": "Dominant 7th",
  "減七和音": "Diminished 7th",
  "増三和音": "Augmented Triad",
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

function CategoryCover({ category, cover }: { category: string; cover?: string | null }) {
  const c = CAT_COVER[category] ?? CAT_COVER._default
  if (cover) {
    return (
      <div className={styles.matCover}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cover} alt="" loading="lazy" />
      </div>
    )
  }
  return (
    <div className={styles.matCover} style={{ background: `linear-gradient(150deg, ${c.a}, ${c.b})` }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round">
        {coverGlyph(category)}
      </svg>
    </div>
  )
}

// 編み込み案4/案2 (2026-08-03): 教材わざラベル。技術マップ/わざ点灯バナーと同じ語彙 (TechniqueTag名) を
// 教材カードに表示し、「この教材はカルテのこのわざを伸ばす」の繋がりを見せる。主タグのみ・最大2つ。
// ポジションの要約 (2026-08-25 Tetsuo: 一覧でタグが多すぎて見えづらい)。
// 1st〜8thを全部並べず「1st〜8th」「3rdのみ」の形に畳む。
function summarizePositions(positions: string[]): string | null {
  if (!positions || positions.length === 0) return null
  const order = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"]
  const sorted = [...positions].sort((a, b) => order.indexOf(a) - order.indexOf(b))
  if (sorted.length === 1) return sorted[0]
  return `${sorted[0]}〜${sorted[sorted.length - 1]}`
}

// 学びポイントのチップ (2026-08-25 Tetsuo確定「案5」)。
// 全教材に一律で付く技法名は情報量が無く、件数畳み(+3)も中身を伝えないため廃止した。
// カルテで「取り組んだが未習得」の技法に一致するものだけを1つ出し、一致しなければ何も出さない。
// 色はネイビー一族。金は成果(達成/マスター/ランク)専用なので学びポイントには使わない。
function TechChips({ names }: { names: string[] }) {
  const weak = useContext(WeakTechniquesContext)
  const hit = names.find((n) => weak.has(n))
  if (!hit) return null
  return (
    <span style={{
      fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--accent)",
      background: "rgba(43,91,196,.12)", border: "1px solid rgba(43,91,196,.35)",
      borderRadius: 999, padding: "1px 7px", whiteSpace: "nowrap",
      overflow: "hidden", textOverflow: "ellipsis", maxWidth: "12em",
    }}>
      学びポイント・{hit}
    </span>
  )
}

// 基礎練カード (曲以外): カバー / タイトル / ◯ポジション / 薄い線 / 説明文(左)・スコア or 未練習(右端)。
// (2026-07-18 Tetsuo指示。「最終練習」表記は撤去し、右端はベストスコア/未練習)
function ItemCard({ item, userId, category }: { item: PracticeItemDTO; userId: string; category: string }) {
  const pos = summarizePositions(item.positions)
  return (
    <Link href={`/${userId}/practice/${category}/${item.id}`} className={styles.itemCard}>
      <CategoryCover category={category} cover={item.coverImagePath} />
      <div className={styles.itemCardBody}>
        <div className={styles.matTitle}>{item.title.replace(/_/g, "・")}</div>
        {(pos || item.techniques.length > 0) && (
          <div className={styles.basicTop} style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
            {pos && <span className={styles.posCircle}>{pos}</span>}
            <TechChips names={item.techniques} />
          </div>
        )}
        <div className={styles.basicDivider} />
        <div className={styles.basicBottom}>
          <span className={styles.basicDesc}>{item.descriptionShort ?? ""}</span>
          {item.bestScore != null ? (
            <span className={styles.basicScore}>ベスト {item.bestScore}</span>
          ) : (
            <span className={styles.basicUnpracticed}>未練習</span>
          )}
        </div>
      </div>
    </Link>
  )
}

// 横スクロールレール用の囲みなしカード (2026-07-18 Tetsuo指示: Violy風。
// 教材を囲む四角(枠/背景/影)を撤去し、カバー画像 + タイトル + メタのみで見せる)。
// onOpen があればタップでシートを開く(button)、無ければ従来の直接遷移(Link)。
function RailCard({ item, userId, category, onOpen }: {
  item: PracticeItemDTO; userId: string; category: string; onOpen?: (item: PracticeItemDTO) => void
}) {
  const pos = summarizePositions(item.positions)
  const inner = (
    <>
      <CategoryCover category={category} cover={item.coverImagePath} />
      <div className={styles.railCardTitle}>{item.title.replace(/_/g, "・")}</div>
      <div className={styles.railCardMeta}>
        {pos && <span className={styles.railPos}>{pos}</span>}
        <TechChips names={item.techniques} />
        {item.bestScore != null ? (
          <span className={styles.railBest}>ベスト {item.bestScore}</span>
        ) : (
          <span className={styles.railUnpracticed}>未練習</span>
        )}
      </div>
    </>
  )
  if (onOpen) {
    return <button type="button" draggable={false} className={styles.railCard} onClick={() => onOpen(item)}>{inner}</button>
  }
  return <Link href={`/${userId}/practice/${category}/${item.id}`} draggable={false} className={styles.railCard}>{inner}</Link>
}

// title からオクターブ数を抽出 (半角/全角/漢数字対応)。無ければ null。
function octaveOf(title: string): string | null {
  const m = title.match(/([0-9０-９一二三四五六])\s*オクターブ/)
  if (!m) return null
  const z: Record<string, string> = {
    "０": "0", "１": "1", "２": "2", "３": "3", "４": "4", "５": "5", "６": "6",
    "一": "1", "二": "2", "三": "3", "四": "4", "五": "5", "六": "6",
  }
  return `${z[m[1]] ?? m[1]}オクターブ`
}

// 練習テーマ = title の最初のセグメント。先頭の弦名(例「E線を」)は除いて抽象化する。
function themeOf(title: string): string {
  const seg = (title.split(/[_＿]/)[0] || title).trim()
  const stripped = seg.replace(/^[GDAEＧＤＡＥ]線[をと]?/, "").trim()
  return stripped || seg
}

// 重音の度数区分。小さい度数を優先し代表を1つ選ぶ (double_stop 特徴タグ名から)。
const DEGREE_ORDER = ["3度", "4度", "5度", "6度", "オクターブ", "10度", "連続重音", "その他"]
function representativeDegree(intervals: string[]): string {
  for (const d of DEGREE_ORDER) if (intervals.includes(d)) return d
  return intervals[0] ?? "その他"
}

// ☆タブ内をカテゴリ別の軸でサブグループ化 (2026-07-18 Tetsuo確定、実データ準拠)。
//   音階 / アルペジオ … オクターブ数
//   フィンガリング / ボーイング … 練習テーマ (title 先頭セグメント / 弦名は除去)
//   重音 … 度数 (double_stop 特徴タグの代表1つ)
//   エチュード … 作者
//   ポジション移動 等 … 単一レール (label 空)
function subGroupItems(
  items: PracticeItemDTO[],
  category: string,
): { label: string; items: PracticeItemDTO[] }[] {
  const group = (
    keyOf: (it: PracticeItemDTO) => string,
    order: (keys: string[]) => string[],
  ) => {
    const map = new Map<string, PracticeItemDTO[]>()
    for (const it of items) {
      const k = keyOf(it)
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(it)
    }
    return order([...map.keys()]).map((k) => ({ label: k, items: map.get(k)! }))
  }
  const jaSort = (keys: string[]) => keys.sort((a, b) => a.localeCompare(b, "ja"))

  if (["scale", "scales", "arpeggio", "arpeggios"].includes(category)) {
    const UNSET = "オクターブ数未設定"
    return group(
      (it) => octaveOf(it.title) ?? UNSET,
      (keys) => {
        const num = keys
          .filter((k) => k !== UNSET)
          .sort((a, b) => a.localeCompare(b, "ja", { numeric: true }))
        return keys.includes(UNSET) ? [...num, UNSET] : num
      },
    )
  }
  if (category === "fingering" || category === "bowing") {
    return group((it) => themeOf(it.title), jaSort)
  }
  if (category === "double_stop") {
    return group(
      (it) => representativeDegree(it.intervals ?? []),
      (keys) => [...DEGREE_ORDER.filter((k) => keys.includes(k)), ...keys.filter((k) => !DEGREE_ORDER.includes(k))],
    )
  }
  if (category === "etude" || category === "etudes") {
    return group((it) => it.composer || "不明", jaSort)
  }
  // ポジション移動 等: サブグループ無し
  return [{ label: "", items }]
}

// 族カード + シートで選ばせるカテゴリ (2026-08-25 Tetsuo確定)。
// 一覧には「族」だけを出し、調・奏法・弦・指の形といった変種は練習前シートの中で選ぶ。
// ボーイング120件→23族 / フィンガリング32件→4族 に畳まれる (グループはbackfill済み)。
function isFamilyCategory(c: string): boolean {
  return c === "scale" || c === "scales" || c === "arpeggio" || c === "arpeggios"
    || c === "bowing" || c === "fingering"
}

// 族カードの2行目。調が族を分ける軸なら「N調」、そうでなければ「N種類」。
// ボーイング/フィンガリングは弦・指の形・音符の長さで分かれるため、調では数えない。
function familySubLabel(fam: { items: PracticeItemDTO[] }): string {
  if (fam.items.length === 1) return keyLabelOf(fam.items[0])
  const keys = new Set(fam.items.map((it) => `${it.keyTonic ?? ""}:${it.keyMode ?? ""}`))
  return keys.size > 1 ? `${keys.size}調` : `${fam.items.length}種類`
}

const TONIC_JA: Record<string, string> = {
  C: "ハ", G: "ト", D: "ニ", A: "イ", E: "ホ", B: "ロ", F: "ヘ",
  "F#": "嬰ヘ", "C#": "嬰ハ", Db: "変ニ", Ab: "変イ", Eb: "変ホ", Bb: "変ロ", Gb: "変ト",
}
// 教材の調ラベル: title 先頭の「〜長調/〜短調」を優先、無ければ keyTonic+keyMode から生成。
function keyLabelOf(it: PracticeItemDTO): string {
  const m = it.title.match(/^[^_＿]*?[長短]調/)
  if (m) return m[0]
  return `${TONIC_JA[it.keyTonic] ?? it.keyTonic}${it.keyMode === "minor" ? "短調" : "長調"}`
}

type Family = { gkey: string; title: string; cover: string | null; items: PracticeItemDTO[] }

const groupKeyOf = (it: PracticeItemDTO) => it.groupId ?? `solo:${it.id}`

// 族カード一覧 (音階/アルペジオ)。族(groupId)ごとに1枚、タップで調シート。1調のみは直接遷移。
// items = 現★タブの族カード用 (絞り込み済) / allItems = シートの奏法ラダー用 (全★の同族兄弟)。
function FamilyView({
  items, allItems, baseStar, userId, category,
}: {
  items: PracticeItemDTO[]
  allItems: PracticeItemDTO[]
  baseStar: number | null
  userId: string
  category: string
}) {
  const [sheet, setSheet] = useState<Family | null>(null)

  const map = new Map<string, PracticeItemDTO[]>()
  for (const it of items) {
    const k = groupKeyOf(it)
    if (!map.has(k)) map.set(k, [])
    map.get(k)!.push(it)
  }
  const families: Family[] = [...map.entries()]
    .map(([gkey, its]) => ({
      gkey,
      title: its[0].groupTitle ?? its[0].title.replace(/_/g, "・"),
      cover: its[0].coverImagePath ?? null,
      items: its,
    }))
    .sort((a, b) => a.title.localeCompare(b.title, "ja"))

  // 常にシートを開く (1調だけの族も調ラダーを見せる = 教材による有無をなくす)
  const tap = (fam: Family) => setSheet(fam)

  // シートには全★の同族兄弟を渡す (上位★の奏法を「選択不可(⭐N)」で示すため)。
  const siblings = sheet ? allItems.filter((it) => groupKeyOf(it) === sheet.gkey) : []

  return (
    <section className={styles.railSection}>
      <div className={styles.familyGrid}>
        {families.map((fam, i) => (
          <button key={i} type="button" className={styles.railCard} onClick={() => tap(fam)}>
            <CategoryCover category={category} cover={fam.cover} />
            <div className={styles.railCardTitle}>{fam.title}</div>
            <div className={styles.railSub}>
              {familySubLabel(fam)}
            </div>
          </button>
        ))}
      </div>
      {sheet && (
        <BasicsPreSheet
          userId={userId}
          category={category}
          family={{
            title: sheet.title,
            coverImagePath: sheet.cover,
            baseStar,
            // 族の軸 (2026-08-25)。ボーイング/フィンガリングは 弦・指の形・音符の長さ で分かれる。
            // 軸があるときはシートが調/奏法のかわりに軸のプルダウンを出す。
            axes: siblings.find((it) => it.groupAxes)?.groupAxes ?? null,
            variants: siblings.map((it) => ({
              id: it.id,
              keyTonic: it.keyTonic,
              keyMode: it.keyMode ?? null,
              articulation: it.articulation ?? null,
              bestScore: it.bestScore ?? null,
              star: it.star ?? null,
              axisValues: it.axisValues ?? [],
            })),
          }}
          onClose={() => setSheet(null)}
        />
      )}
    </section>
  )
}

// ────────────────────────────────────────────────────────────
// View 1: ☆順 (難易度タブ → カテゴリ別サブグループの横スクロールレール)
// ────────────────────────────────────────────────────────────
// 練習曲 (pieces) と同じ☆タブ仕様。star 未設定の教材も隠さないよう、
// null の教材がある場合のみ末尾に「☆未設定」フォールバックタブを設ける。
// 2026-07-18: ☆選択後、教材を調/和音種別/作曲者ごとの横並びレールに区分。

type StarTab = number | "none"

function StarView({
  items, partItems, userId, category, userStar,
}: {
  items: PracticeItemDTO[]
  /** 練習前シートの「パートを選ぶ」用。一覧には出さない (2026-08-28) */
  partItems: PracticeItemDTO[]
  userId: string
  category: string
  userStar?: number | null
}) {
  const starValues = Array.from(
    new Set(items.map((i) => i.star).filter((s): s is number => s != null)),
  ).sort((a, b) => a - b)
  const hasNull = items.some((i) => i.star == null)
  const tabs: StarTab[] = [...starValues, ...(hasNull ? (["none"] as StarTab[]) : [])]

  // 曲タブの星タグと同じ: 既定=すべて、タップで絞り込み (2026-08-22 Tetsuo指示)
  const [active, setActive] = useState<StarTab | null>(null)
  // 全教材でシートを開く: エチュード=難易度+パート, その他基礎練=調+奏法
  const [songItem, setSongItem] = useState<PracticeItemDTO | null>(null)
  const [basicItem, setBasicItem] = useState<PracticeItemDTO | null>(null)
  const isEtude = category === "etude" || category === "etudes"
  const openItem = (it: PracticeItemDTO) => (isEtude ? setSongItem(it) : setBasicItem(it))

  if (tabs.length === 0) {
    return (
      <p className={styles.cardContextEmpty}>
        この教材はまだ準備中だよ。もう少し待っててね
      </p>
    )
  }

  const filtered = active == null
    ? items
    : items.filter((i) => (active === "none" ? i.star == null : i.star === active))
  // 2026-09-01 Tetsuo確定: 奏法別・リズム別を1曲として並べない。
  // 族カードのカテゴリ (音階等) は元から族で1枚に畳んでいるのでそのまま。
  const cards = isFamilyCategory(category) ? filtered : filtered.filter((i) => !i.isVariant)
  const subGroups = subGroupItems(cards, category)
  const baseStar = typeof active === "number" ? active : null

  return (
    <div>
      {/* ☆ごとの横並びタブ */}
      <div className={styles.starTabs} role="group" aria-label="星でしぼる">
        <button
          type="button"
          className={`${styles.starTab} ${active == null ? styles.starTabActive : ""}`}
          onClick={() => setActive(null)}
        >
          すべて
        </button>
        {tabs.map((t) => (
          <button
            key={String(t)}
            type="button"
            className={`${styles.starTab} ${active === t ? styles.starTabActive : ""}`}
            onClick={() => setActive(active === t ? null : t)}
          >
            {t === "none" ? "★未設定" : `★${t}`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className={styles.cardContextEmpty}>この難しさの教材はまだないよ</p>
      ) : isFamilyCategory(category) ? (
        // 音階/アルペジオ: 族カード + 調シート (オクターブ見出しは廃止し族が兼ねる)
        // 選択可否(gate)は「開いたタブ」ではなくユーザーの現在★で判定 (userStar優先)。
        <FamilyView items={filtered} allItems={[...items, ...partItems]} baseStar={userStar ?? baseStar} userId={userId} category={category} />
      ) : (
        subGroups.map((sg, idx) => (
          <section key={sg.label || idx} className={styles.railSection}>
            {sg.label && <h3 className={styles.railLabel}>{sg.label}</h3>}
            <StaggerRail gap={16}>
              {sg.items.map((item) => (
                <RailCard key={item.id} item={item} userId={userId} category={category} onOpen={openItem} />
              ))}
            </StaggerRail>
          </section>
        ))
      )}

      {/* エチュード: 奏法+パートシート (2026-08-25 Tetsuo確定で難易度→奏法) */}
      {songItem && (
        <PrePracticeSheet
          userId={userId}
          basePath={`/practice/${category}`}
          enablePreview
          previewKind="practice"
          primaryAxis="articulation"
          group={{
            title: songItem.title.replace(/_/g, "・"),
            composer: songItem.composer,
            genre: null,
            coverImagePath: songItem.coverImagePath ?? null,
            // 同じグループの奏法変種をすべて渡す (2026-08-25: エチュードの第1軸=奏法)。
            // グループが無い単独教材は自分だけ。
            // 2026-08-28: 一覧はパート教材を除いて取得しているので、
            // シートの選択肢にはパートを別途混ぜる。混ぜないと partVariants が空になり、
            // 「パートはまだ登録されていません」のまま全小節で練習・録音してしまう。
            variants: (songItem.groupId
              ? [...items, ...partItems].filter((i) => i.groupId === songItem.groupId)
              : [songItem]
            ).map((i) => ({
              id: i.id, star: i.star,
              difficulty: i.difficulty ?? null,
              // 2026-09-01: null を "legato" で埋めない。埋めると
              // 「奏法軸に載らない変種 (=リズムだけの変種)」の判別が消え、
              // 16音符のようなリズム登録がパターン欄に一切出なくなる。
              articulation: i.articulation ?? null,
              patternName: i.patternName ?? null,
              partId: i.partId ?? null,
              sourceItemId: i.sourceItemId ?? null,
              partName: i.partName ?? null,
              sections: i.groupParts ?? [],
              bestScore: i.bestScore ?? null,
            })),
          }}
          onClose={() => setSongItem(null)}
        />
      )}

      {/* フィンガリング/ボーイング/重音 等: 調+奏法シート (同族兄弟を全★渡し、上位★は選択不可(⭐N)) */}
      {basicItem && (
        <BasicsPreSheet
          userId={userId}
          category={category}
          family={{
            title: basicItem.groupTitle ?? basicItem.title.replace(/_/g, "・"),
            coverImagePath: basicItem.coverImagePath ?? null,
            baseStar,
            variants: [...items, ...partItems]
              .filter((i) => groupKeyOf(i) === groupKeyOf(basicItem))
              .map((i) => ({
                id: i.id, keyTonic: i.keyTonic, keyMode: i.keyMode ?? null,
                articulation: i.articulation ?? null, bestScore: i.bestScore ?? null,
                star: i.star ?? null,
              })),
          }}
          onClose={() => setBasicItem(null)}
        />
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
  userId, category, categoryTitle, items, partItems = [],
  filterOptions: _filterOptions, currentFilters: _currentFilters, stats: _stats, userStar = null,
  weakTechniques,
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
  const weakSet = useMemo(() => new Set(weakTechniques ?? []), [weakTechniques])

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
    <WeakTechniquesContext.Provider value={weakSet}>
    <div className={styles.container}>
      <div className={styles.listHeader}>
        <h1 className={styles.pageTitle}>{categoryTitle}</h1>
        <Link href={`/${userId}/practice`} style={{ fontSize: "var(--fs-body)", color: "var(--text-link)" }}>
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
        <StarView items={items} partItems={partItems} userId={userId} category={category} userStar={userStar} />
      )}
      {activeView === "group" && (
        <GroupView items={items} userId={userId} category={category} />
      )}

    </div>
    </WeakTechniquesContext.Provider>
  )
}
