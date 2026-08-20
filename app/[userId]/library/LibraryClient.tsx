"use client"

// ライブラリの本体 (2026-08-17 ナビ要件定義 SECTION 02)。
//  ・セグメント 曲 / 基礎練 / マイ楽譜。選択はURLの ?tab= に持ち、戻る操作で復元する
//  ・基礎練にはおすすめカードを置かない (A案A決定)。ホームの「曲のための基礎練」に一本化し、
//    ここは「カテゴリから探す」ことに徹する
//  ・カテゴリカードは掲載数のみ。進捗率は出さない
//  ・楽譜アップロードは有料プラン限定。入口は無料でも出し、押した時点で案内する
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Plus, Upload, BookOpen } from "lucide-react"
import { categoryLabel } from "@/app/_libs/practiceConstants"
import { canShowBillingEntryPoint } from "@/app/_libs/isNativeApp"
import styles from "./library.module.css"

export type LibraryPiece = {
  id: string
  title: string
  composer: string | null
  star: number | null
  mine: boolean
  badge: "achieved" | "mastered" | null
}

export type LibraryCategory = { category: string; count: number }

type Tab = "pieces" | "basics" | "mine"

const TABS: { key: Tab; label: string }[] = [
  { key: "pieces", label: "曲" },
  { key: "basics", label: "基礎練" },
  { key: "mine", label: "マイ楽譜" },
]

export default function LibraryClient({
  userId, initialTab, pieces, categories, lessonTotal, ownScoreCount, canUpload = false,
}: {
  userId: string
  initialTab: Tab
  pieces: LibraryPiece[]
  categories: LibraryCategory[]
  lessonTotal: number
  ownScoreCount: number
  /** 有料プランかどうか。false ならアップロードは案内のみ */
  canUpload?: boolean
}) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>(initialTab)
  const [q, setQ] = useState("")
  const [planNotice, setPlanNotice] = useState(false)

  const base = `/${userId}`
  const selectTab = (t: Tab) => {
    setTab(t)
    // 戻る操作で選択が復元されるよう履歴に積む (要件定義 2-2)
    router.push(`${base}/library?tab=${t}`, { scroll: false })
  }

  const filtered = pieces.filter((p) => {
    if (!q.trim()) return true
    const s = `${p.title} ${p.composer ?? ""}`.toLowerCase()
    return s.includes(q.trim().toLowerCase())
  })
  const minePieces = filtered.filter((p) => p.mine)

  const onUpload = () => {
    if (canUpload) { router.push(`${base}/scores?upload=1`); return }
    setPlanNotice(true)
  }

  return (
    <div className={styles.root}>
      <header className={styles.head}>
        <h1 className={styles.title}>ライブラリ</h1>
        <p className={styles.lead}>弾くものは、ぜんぶここに。</p>
      </header>

      <div className={styles.searchRow}>
        <div className={styles.search}>
          <Search size={17} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="曲や教材をさがす"
            aria-label="曲や教材をさがす"
          />
        </div>
        <button type="button" className={styles.addBtn} onClick={onUpload} aria-label="楽譜をアップロード">
          <Plus size={22} strokeWidth={2.6} />
        </button>
      </div>

      <div className={styles.segments} role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={`${styles.segment} ${tab === t.key ? styles.segmentOn : ""}`}
            onClick={() => selectTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {planNotice && (
        <div className={styles.notice} data-anim="block" role="status">
          <b>楽譜のアップロードはプラス限定の機能です</b>
          <span>自分の楽譜を取り込むと、その曲も採点できるようになります。</span>
          {canShowBillingEntryPoint() ? (
            <Link href={`${base}/settings`} className={styles.noticeLink}>プランを見る →</Link>
          ) : (
            <span className={styles.noticeMuted}>Webのアルコダからプランを確認できます</span>
          )}
          <button type="button" className={styles.noticeClose} onClick={() => setPlanNotice(false)} aria-label="閉じる">✕</button>
        </div>
      )}

      {tab === "pieces" && (
        <section className={styles.list}>
          {filtered.length === 0 ? (
            <EmptyState
              title="弾きたい曲を、さがしてみよう。"
              body="曲をえらぶと、楽譜が出て、演奏をアルコが採点するよ。"
              href={`${base}/practice/pieces`}
              cta="曲をさがす"
            />
          ) : (
            filtered.map((p) => <PieceRow key={p.id} p={p} base={base} />)
          )}
        </section>
      )}

      {tab === "basics" && (
        <section>
          {/* おすすめはホームに一本化 (A案A)。ここは探す場所に徹する。
              ホームへの誘導カードは不要と判断し置かない (2026-08-17 Tetsuo指定) */}
          <h2 className={styles.sectionTitleTop}>カテゴリから探す</h2>
          <div className={styles.catGrid}>
            {categories.map((c) => (
              <Link key={c.category} href={`${base}/practice/${c.category}`} className={styles.catCard} data-anim="block" data-empty={c.count === 0}>
                <span className={styles.catName}>{categoryLabel(c.category)}</span>
                <span className={styles.catMeta}>
                  <span className={styles.catCount}>{c.count}曲</span>
                  <span className={styles.catGo}>→</span>
                </span>
              </Link>
            ))}
          </div>

          <Link href={`${base}/lessons`} className={styles.lessonCard} data-anim="block">
            <span className={styles.lessonIcon}><BookOpen size={19} /></span>
            <span className={styles.lessonBody}>
              <b>学びのレッスン</b>
              <span>音のしくみを、{lessonTotal}本の短い動画で。</span>
            </span>
            <span className={styles.catGo}>→</span>
          </Link>
        </section>
      )}

      {tab === "mine" && (
        <section className={styles.list}>
          <button type="button" className={styles.uploadBox} data-anim="block" onClick={onUpload}>
            <Upload size={22} />
            <b>自分の楽譜をアップロード</b>
            <span>取り込むと、その曲も採点できるようになります</span>
          </button>
          {ownScoreCount === 0 ? (
            <p className={styles.mineEmpty} data-anim="block">まだ取り込んだ楽譜はありません。</p>
          ) : (
            minePieces.map((p) => <PieceRow key={p.id} p={p} base={base} />)
          )}
        </section>
      )}
    </div>
  )
}

function PieceRow({ p, base }: { p: LibraryPiece; base: string }) {
  return (
    <Link href={`${base}/scores/${p.id}`} className={styles.row} data-anim="block">
      <span className={styles.rowBody}>
        <span className={styles.rowTitle}>{p.title}</span>
        <span className={styles.rowSub}>
          {p.composer ?? "作曲者不明"}
          {p.mine ? " ・ 自分の楽譜" : ""}
        </span>
        {p.star != null && (
          <span className={styles.stars} aria-label={`★${p.star}`}>
            {"★".repeat(Math.min(p.star, 5))}
            <s>{"★".repeat(Math.max(0, 5 - p.star))}</s>
          </span>
        )}
      </span>
      {p.badge === "mastered" && <span className={styles.badgeMaster}>マスター</span>}
      {p.badge === "achieved" && <span className={styles.badgeAchieved}>達成</span>}
    </Link>
  )
}

function EmptyState({ title, body, href, cta }: { title: string; body: string; href: string; cta: string }) {
  return (
    <div className={styles.empty} data-anim="block">
      <b>{title}</b>
      <span>{body}</span>
      <Link href={href} className={styles.emptyCta}>{cta}</Link>
    </div>
  )
}
