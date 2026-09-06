"use client"

// ライブラリの本体 — 確定モック lib-mock (scratchpad/build-lib.py 01〜05) の写経 (2026-08-21 再写経)。
// 現行フロー適用: 原本 + SPEC-CHANGES (星タグ 2026-08-20) + EFFECTS-CODE 7項目 (DSクラス+data-anim)。
//  ・セグメント 曲 / 基礎練 / マイ楽譜。選択はURLの ?tab= に持ち、戻る操作で復元する
//  ・曲/マイ楽譜 = 1曲1カード (b14.5 / 作曲者11 / ★11px ls1.5 実数 / 判定バッジ=マスター金・達成テール)
//  ・基礎練 = カテゴリ grid2 (0曲は文字と矢印だけ薄く) + 学びのレッスン行
//  ・マイ楽譜 = 金破線のアップロード箱。無料プランには PLAN_NOTICE を常設
//  ・空状態 = ♪ + 見出し + 説明 + 金ピル (原本 04/05)
// 逸脱申告: 検索行右の + ボタンは原本に無いため廃止 (アップロード導線はマイ楽譜タブに一本化)
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { categoryLabel } from "@/app/_libs/practiceConstants"
import { canShowBillingEntryPoint } from "@/app/_libs/isNativeApp"
import styles from "./library.module.css"
import PieceCatalog from "./PieceCatalog"
import type { CatalogPiece } from "./loadPieceCatalog"
import ds from "@/app/components/ds.module.css"
import ArcoMotion from "@/app/components/ArcoMotion"
import GateSheet from "@/app/components/guest/GateSheet"
import { GATE_TEXT } from "@/app/components/guest/gateText"

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
  userId, initialTab, pieces, catalog, categories, lessonTotal, ownScoreCount, canUpload = false, guest = false,
}: {
  userId: string
  initialTab: Tab
  pieces: LibraryPiece[]
  /** 曲タブ = 曲カタログ (補12統合 2026-08-21) */
  catalog: CatalogPiece[]
  categories: LibraryCategory[]
  lessonTotal: number
  ownScoreCount: number
  /** 有料プランかどうか。false ならアップロードは案内のみ */
  canUpload?: boolean
  /** ゲスト閲覧 (2026-09-06): 曲カードは曲の詳細 (ゲート) へ、アップロードはその場でゲート */
  guest?: boolean
}) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>(initialTab)
  const [q, setQ] = useState("")
  // 曲を星ごとに見るタグ (SPEC-CHANGES 2026-08-20)。null = すべて
  const [starTag, setStarTag] = useState<number | null>(null)

  const base = `/${userId}`
  const selectTab = (t: Tab) => {
    setTab(t)
    // 戻る操作で選択が復元されるよう履歴に積む (要件定義 2-2)
    router.push(`${base}/library?tab=${t}`, { scroll: false })
  }

  const q2 = q.trim().toLowerCase()
  const minePieces = pieces.filter((p) => p.mine && (!q2 || `${p.title} ${p.composer ?? ""}`.toLowerCase().includes(q2)))
  // 曲タブ = カタログ (補12統合)。検索と星タグで絞る
  const catalogQ = catalog.filter((p) => !q2 || `${p.title} ${p.composer ?? ""}`.toLowerCase().includes(q2))
  const starLevels = [...new Set(catalog.filter((p) => p.star != null).map((p) => p.star as number))].sort((a, b) => a - b)
  const starFiltered = starTag == null ? catalogQ : catalogQ.filter((p) => p.star === starTag)

  // 2026-09-02 Tetsuo確定: 無料ユーザーが押したときは黙って無視せず、プランの案内を出す。
  // 以前はボタンを出しておいて何も起きず、壊れているように見えていた。
  const [planModal, setPlanModal] = useState(false)
  const [gate, setGate] = useState(false)
  const onUpload = () => {
    if (guest) setGate(true)
    else if (canUpload) router.push(`${base}/scores?upload=1`)
    else setPlanModal(true)
  }

  return (
    <div className={styles.root}>
      {gate && <GateSheet key="upload" title={GATE_TEXT.upload.title} items={[...GATE_TEXT.upload.items]} laterMode="hide" onLater={() => setGate(false)} />}
      {planModal && (
        <div role="dialog" aria-modal="true" aria-label="アルコプラスの案内"
          onClick={() => setPlanModal(false)}
          style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(6,12,24,.72)",
            display: "flex", alignItems: "flex-end" }}>
          {/* 2026-09-02 Tetsuo確定 案5: 下から出るシートに、プラスでできることを並べる。
              書くのは実装に課金判定がある2つと、既に案内している無料おためしだけ。
              設定のプラン欄にある基礎練やレッスンは課金判定が無いので書かない */}
          <div onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", background: "var(--card-b, #15233f)",
              borderTop: "1px solid rgba(232,178,60,.34)", borderRadius: "20px 20px 0 0",
              padding: "16px 16px calc(20px + env(safe-area-inset-bottom))" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(150,175,225,.28)", margin: "0 auto 12px" }} />
            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: ".14em", color: "var(--gold)" }}>ARCODA PLUS</div>
            <b style={{ display: "block", fontSize: 15.5, marginTop: 7 }}>アルコプラスでできること</b>
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 12 }}>
              {[
                ["自分の楽譜を取り込む", "その曲も採点できる"],
                ["採点が無制限", "週7回の上限が外れる"],
                ["14日間おためし", "いつでもやめられる"],
              ].map(([t, sub]) => (
                <div key={t} style={{ display: "flex", gap: 8, alignItems: "baseline", fontSize: 12, color: "var(--text-sub)" }}>
                  <span style={{ color: "var(--gold)", fontWeight: 900, flex: "none" }}>+</span>
                  <span><b style={{ color: "var(--text-ink)", fontWeight: 700 }}>{t}</b> ・ {sub}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16, alignItems: "center", flexWrap: "wrap" }}>
              {canShowBillingEntryPoint() ? (
                <Link href={`${base}/settings`} className={`${ds.pill} ${ds.gold}`}
                  style={{ fontSize: 12, textDecoration: "none" }}>プランを見る</Link>
              ) : (
                <span style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.7 }}>Webのアルコダからプランを確認できます</span>
              )}
              <button type="button" onClick={() => setPlanModal(false)} className={ds.pill}
                style={{ fontSize: 12, marginLeft: "auto", cursor: "pointer" }}>とじる</button>
            </div>
          </div>
        </div>
      )}
      {/* 原本 HEAD: h1.t + subT + 検索inset */}
      {/* 見出し+動くアルコ (2026-08-23 Tetsuo指示: 右側に金縁メダリオンの05C) */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 className={ds.t} style={{ paddingTop: 6, flex: 1, minWidth: 0 }}>ライブラリ</h1>
        <ArcoMotion kit="05C" label="楽譜を見せるアルコ" className="libArcoBadge" />
        <style>{`.libArcoBadge { width: 64px; height: 64px; flex: none; box-shadow: 0 0 0 3px #e8ca84, 0 0 0 7px rgba(11,18,32,.9), 0 0 0 8px #bca160, 0 8px 22px rgba(0,0,0,.45); }`}</style>
      </div>
      <div className={styles.subT}>弾くものは、ぜんぶここに。</div>
      <div className={styles.search}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="曲や教材をさがす"
          aria-label="曲や教材をさがす"
        />
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

      {tab === "pieces" && (
        <section>
          {/* 星ごとに見るタグ (SPEC-CHANGES 2026-08-20)。補12の☆セグはこのタグで代替 */}
          {starLevels.length > 1 && (
            <div className={styles.starChips} role="group" aria-label="星でしぼる" data-onboarding="pieces.starTabs">
              <button
                type="button"
                className={`${styles.starChip} ${starTag == null ? styles.starChipOn : ""}`}
                onClick={() => setStarTag(null)}
              >
                すべて
              </button>
              {starLevels.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`${styles.starChip} ${starTag === n ? styles.starChipOn : ""}`}
                  onClick={() => setStarTag(starTag === n ? null : n)}
                >
                  ★{n}
                </button>
              ))}
            </div>
          )}
          {catalog.length === 0 ? (
            <EmptyCard
              title="練習曲はまだ準備中だよ。もう少し待っててね"
              titleSize={14}
              body={null}
              cta={null}
            />
          ) : starFiltered.length === 0 ? (
            <EmptyCard
              title="この難しさの練習曲はまだないよ"
              titleSize={14}
              body={null}
              cta={null}
            />
          ) : (
            <PieceCatalog userId={userId} pieces={starFiltered} guest={guest} />
          )}
        </section>
      )}

      {tab === "basics" && (
        <section>
          {/* おすすめはホームに一本化 (A案A)。ここは探す場所に徹する */}
          <h2 className={styles.sectionTitle}>カテゴリから探す</h2>
          <div className={styles.catGrid}>
            {categories.map((c) => (
              <Link
                key={c.category}
                href={`${base}/practice/${c.category}`}
                className={ds.card}
                style={{ margin: 0, padding: "13px 14px", textDecoration: "none", color: "inherit" }}
              >
                <b style={{ fontSize: 13.5, display: "block", color: c.count === 0 ? "var(--text-sub)" : "var(--text-ink)" }}>
                  {categoryLabel(c.category)}
                </b>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: "var(--text-sub)" }}>{c.count}曲</span>
                  <span className={ds.arrow} style={{ fontSize: 13, opacity: c.count === 0 ? 0.35 : 1 }} aria-hidden>→</span>
                </div>
              </Link>
            ))}
          </div>

          <Link href={`${base}/lessons`} className={ds.card} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
            <div className={ds.row}>
              <span className={ds.chk} style={{ background: "rgba(127,164,232,.14)", border: "1px solid rgba(127,164,232,.26)", color: "#7fa4e8" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M4 5h7a2 2 0 0 1 2 2v13a1.5 1.5 0 0 0-1.5-1.5H4z" />
                  <path d="M20 5h-7a2 2 0 0 0-2 2v13a1.5 1.5 0 0 1 1.5-1.5H20z" />
                </svg>
              </span>
              <div className={ds.rowMain}>
                <b style={{ fontSize: 13.5 }}>学びのレッスン</b>
                <span>音のしくみを、{lessonTotal}本の短い動画で。</span>
              </div>
              <span className={ds.arrow} aria-hidden>→</span>
            </div>
          </Link>
        </section>
      )}

      {tab === "mine" && (
        <section>
          {/* UPBOX (原本: 金破線 ・ 中央 ・ 26px矢印 ・ 26px 16px) */}
          <button
            type="button"
            onClick={onUpload}
            className={ds.card}
            style={{ width: "100%", textAlign: "center", padding: "26px 16px", borderStyle: "dashed", borderColor: "rgba(232,178,60,.4)", cursor: "pointer", font: "inherit", color: "inherit", display: "block" }}
          >
            <div style={{ color: "var(--gold)", marginBottom: 8 }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 16V4" /><path d="M7 9l5-5 5 5" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
              </svg>
            </div>
            <b style={{ fontSize: 14 }}>自分の楽譜をアップロード</b>
            <span style={{ display: "block", fontSize: 11, color: "var(--text-sub)", marginTop: 5 }}>
              取り込むと、その曲も採点できるようになります
            </span>
          </button>

          {/* PLAN_NOTICE (原本 04): 無料プランには常設 */}
          {!canUpload && !guest && (
            <div className={ds.card} style={{ padding: "14px 15px", borderColor: "rgba(232,178,60,.3)" }} role="status">
              <b style={{ fontSize: 13.5, color: "var(--gold)" }}>楽譜のアップロードはプラス限定の機能です</b>
              <span style={{ display: "block", fontSize: 11.5, color: "var(--text-sub)", marginTop: 6, lineHeight: 1.8 }}>
                自分の楽譜を取り込むと、その曲も採点できるようになります。
              </span>
              {canShowBillingEntryPoint() ? (
                <div style={{ marginTop: 11, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Link href={`${base}/settings`} className={`${ds.pill} ${ds.gold}`} style={{ fontSize: 11, textDecoration: "none" }}>プランを見る →</Link>
                </div>
              ) : (
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 9 }}>Webのアルコダからプランを確認できます</div>
              )}
            </div>
          )}

          {ownScoreCount === 0 ? (
            <EmptyCard
              title="まだ取り込んだ楽譜はありません。"
              titleSize={14}
              pad="28px 20px"
              body={<>自分の楽譜を取り込むと、その曲も<br />採点できるようになります。</>}
              cta={canUpload ? (
                <button type="button" onClick={onUpload} className={`${ds.pill} ${ds.gold}`} style={{ marginTop: 14, fontSize: 12, border: "none", cursor: "pointer", fontFamily: "inherit" }}>楽譜をえらぶ →</button>
              ) : null}
            />
          ) : (
            minePieces.map((p) => <PieceCard key={p.id} p={p} base={base} />)
          )}
        </section>
      )}
    </div>
  )
}

/* 曲カード (原本 piece() ベース ・ ★は5枠→「★n」数字表記に変更 2026-08-22 Tetsuo指示: ★1〜10共通スケール) */
function PieceCard({ p, base }: { p: LibraryPiece; base: string }) {
  const star = p.star ?? 0
  return (
    <Link href={`${base}/scores/${p.id}`} className={ds.card} style={{ padding: "13px 15px", textDecoration: "none", color: "inherit", display: "block" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <b style={{ fontSize: 14.5, display: "block", color: "var(--text-ink)" }}>{p.title}</b>
          <span style={{ fontSize: 11, color: "var(--text-sub)" }}>
            {p.composer ?? "作曲者不明"}
            {p.mine ? " ・ 自分の楽譜" : ""}
          </span>
          {p.star != null && (
            <div style={{ marginTop: 5 }}>
              <span className={ds.stars} style={{ fontSize: 11 }} aria-label={`★${p.star}`}>
                ★{star}
              </span>
            </div>
          )}
        </div>
        {p.badge === "mastered" && (
          <span className={`${ds.pill} ${ds.gold}`} style={{ fontSize: 10, padding: "3px 9px", flex: "none" }}>マスター</span>
        )}
        {p.badge === "achieved" && (
          <span className={ds.pill} style={{ fontSize: 10, padding: "3px 9px", flex: "none", background: "rgba(127,196,196,.16)", color: "var(--teal)", border: "1px solid rgba(127,196,196,.32)" }}>達成</span>
        )}
      </div>
    </Link>
  )
}

/* 空状態カード (原本 04/05): 中央 ・ ♪30px 50% ・ 見出し ・ 説明11.5 lh1.8 ・ 金ピル */
function EmptyCard({ title, titleSize, body, cta, pad = "30px 20px" }: {
  title: string
  titleSize: number
  body: React.ReactNode
  cta: React.ReactNode
  pad?: string
}) {
  return (
    <div className={ds.card} style={{ textAlign: "center", padding: pad }}>
      <div style={{ fontSize: 30, opacity: 0.5 }} aria-hidden>♪</div>
      <b style={{ fontSize: titleSize, display: "block", marginTop: 8 }}>{title}</b>
      <span style={{ display: "block", fontSize: 11.5, color: "var(--text-sub)", marginTop: 7, lineHeight: 1.8 }}>{body}</span>
      {cta}
    </div>
  )
}
