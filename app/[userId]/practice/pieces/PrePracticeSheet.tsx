"use client"

// 練習前シート (Phase C / 2026-07-18更新): 難易度・パートを常時フル表示。
// 教材の無い難易度/パートはグレー(選択不可)で「準備中」を明示。曲が増えれば自動で有効化。
// お手本再生・譜面プレビューは次段 (アセット未整備)。
import { useState } from "react"
import { useRouter } from "next/navigation"
import styles from "./prePractice.module.css"
import { DIFFICULTIES } from "@/app/_libs/materialVariant"
import { ARTICULATIONS } from "@/app/_libs/materialVariant"
import SheetPreview from "./SheetPreview"
import SheetSkills from "./SheetSkills"

export type SheetSection = { id?: string; name: string; startMeasure: number; endMeasure: number }
export type SheetVariant = {
  id: string
  star: number | null
  difficulty: string | null
  /** 奏法 (エチュードの第1軸。legato/staccato/... ・ 曲では未使用) */
  articulation?: string | null
  /** 個別パターン名 (音符ごとの奏法・リズムを作ったときに付けた名前)。null=標準 */
  patternName?: string | null
  /** 実体化されたパート教材 (2026-08-25 案B)。null=通し */
  partId?: string | null
  partName?: string | null
  sections: SheetSection[]
  bestScore: number | null
}
export type SheetGroup = {
  title: string
  composer: string | null
  genre: string | null
  coverImagePath: string | null
  variants: SheetVariant[]
}


export default function PrePracticeSheet({
  userId, group, onClose, basePath = "/scores", enablePreview = false, previewKind = "score",
  primaryAxis = "difficulty",
}: {
  userId: string
  group: SheetGroup
  onClose: () => void
  /** 遷移先ベース。曲=/scores(既定)、エチュード=/practice/etude */
  basePath?: string
  /** 譜面プレビュー+お手本再生を出す。難易度連動で選択変種を表示 */
  enablePreview?: boolean
  /** プレビュー取得元。曲=score(既定)、エチュード=practice */
  previewKind?: "score" | "practice"
  /** 第1軸 (2026-08-25 Tetsuo確定): 曲=難易度 / エチュード=奏法。パートは共通で残す */
  primaryAxis?: "difficulty" | "articulation"
}) {
  const router = useRouter()
  const byArt = primaryAxis === "articulation"
  // 第1軸 → 変種。曲=難易度 / エチュード=奏法 (2026-08-25 Tetsuo確定)
  const byKey = new Map<string, SheetVariant>()
  for (const v of group.variants) {
    byKey.set(byArt ? (v.articulation ?? "legato") : (v.difficulty ?? "BEGINNER"), v)
  }
  // 選択肢は「選択用」の ARTICULATIONS を使う (2026-08-25)。
  // 生成用の STANDARD_ARTICULATIONS には slur が無く、奏法=slur の教材
  // (カイザー No.4/6/8/10/12/31/34/35/36) が選択肢に出ず、既定がレガートに落ちて
  // variant=undefined になり、詳細画面へ遷移できず譜面も出ない状態だった。
  const options: { id: string; label: string }[] = byArt
    ? ARTICULATIONS.map((a) => ({ id: a.id, label: a.label }))
    : DIFFICULTIES.map((d) => ({ id: d.id, label: d.label }))
  const firstAvail = options.find((o) => byKey.has(o.id))?.id ?? options[0].id

  const [diff, setDiff] = useState(firstAvail)

  // 第2軸: 個別パターン (2026-08-25 確定)。第1軸で選んだ変種を親として、
  // 同じ軸値を持つパターン付き変種を選べるようにする。null = パターンなし (標準)。
  const sameAxis = group.variants.filter(
    (v) => (byArt ? (v.articulation ?? "legato") : (v.difficulty ?? "BEGINNER")) === diff,
  )
  // パターン軸には「第1軸に載らなかったもの」だけを出す。
  // 単一奏法のパターンは奏法軸 (第1軸) に載るので、ここには重複させない (2026-08-25)。
  const patterns = sameAxis.filter((v) => v.patternName && (byArt ? !v.articulation : true))
  const [patternId, setPatternId] = useState<string>("")
  // 軸の値がラダーのどれとも噛み合わない教材があるため、最後に「先頭の変種」へ落とす
  // (2026-08-25: カイザーNo.10ほか9件が 奏法=slur の単独グループで variant=undefined になり、
  //  詳細画面へ遷移できず譜面も出ない状態だった。start() が黙って return していて気付けなかった)
  // フォールバックは「どの軸の値にも教材が無い族」だけに効かせる (2026-08-25)。
  // 常に variants[0] へ落とすと、準備中の奏法を選んでも別の教材へ遷移してしまう。
  const base = sameAxis.find((v) => !v.patternName) ?? byKey.get(diff)
    ?? (byKey.size === 0 ? group.variants[0] : undefined)
  const variant = (patternId ? sameAxis.find((v) => v.id === patternId) : base) ?? base

  // パート: 実体化されたパート教材 (2026-08-25 案B) があればそれを選ぶ。
  // 選ぶと譜面・録音・採点・カルテのすべてがその範囲だけの教材に切り替わる。
  //
  // 2026-08-28: 第1軸 (奏法/難易度) で選んだ値に属するパートだけを出す。
  // 以前はグループ内のパート教材を軸と無関係に全部並べていたため、
  // レガートを選んでいてもスラーのパートが選択肢に出て、選ぶと黙って
  // 奏法まで変わっていた。パートは通しから奏法を継ぐので (createPartVariant)、
  // 軸で絞れば「その奏法の通しとパートが必ず揃う」形になる。
  const axisOf = (v: { articulation?: string | null; difficulty?: string | null }) =>
    byArt ? (v.articulation ?? "legato") : (v.difficulty ?? "BEGINNER")
  const partVariants = group.variants.filter((v) => v.partId && axisOf(v) === diff)
  const sections = variant?.sections ?? []
  const [rangeIdx, setRangeIdx] = useState(-1) // -1 = 全部演奏する (実体が無いときの旧経路)
  const [partPick, setPartPick] = useState("")  // 実体化済みパート教材のid
  // プレビューと「はじめる」の行き先は同じものを指す。
  // パートを選んでいればそのパート教材、選んでいなければ通し。
  const previewId = partPick || variant?.id || null

  const start = () => {
    if (!variant) {
      // 握り潰すと「押しても何も起きない」になる。必ず理由を残す。
      console.error("[PrePracticeSheet] 変種が決まらないため遷移できません", { diff, variants: group.variants.length })
      return
    }
    // 実体化済みのパート教材が選ばれていれば、そのまま教材ごと切り替える (案B)
    if (partPick) {
      router.push(`/${userId}${basePath}/${partPick}`)
      return
    }
    const q = new URLSearchParams()
    // 実体が無い場合の従来経路: 詳細画面のパート練習UIで初期選択させる
    if (rangeIdx >= 0 && sections[rangeIdx]?.id) {
      q.set("part", String(sections[rangeIdx].id))
    }
    const qs = q.toString()
    router.push(`/${userId}${basePath}/${variant.id}${qs ? `?${qs}` : ""}`)
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.grab} />
        <button className={styles.close} onClick={onClose} aria-label="閉じる">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>

        <div className={styles.hero}>
          <div className={styles.cover}>
            {group.coverImagePath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={group.coverImagePath} alt="" />
            ) : (
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"><path d="M9 18V5l10-2v12" /><circle cx="6.4" cy="18" r="2.6" /><circle cx="16.4" cy="15" r="2.6" /></svg>
            )}
          </div>
          <div className={styles.info}>
            <div className={styles.title}>{group.title}</div>
            {group.composer && <div className={styles.composer}>{group.composer}</div>}
            {variant?.bestScore != null && <div className={styles.best}>ベスト {variant.bestScore}</div>}
          </div>
        </div>

        {/* 譜面プレビュー + お手本再生。
            2026-08-28: パートを選んだらその小節だけの譜面を出す。
            以前は常に通し (variant) を見ていたため、パートを選んでもプレビューが
            変わらず、「パートごとに機能を提供する」という仕様と食い違っていた。 */}
        {enablePreview && previewId && (
          <SheetPreview key={previewId} scoreId={previewId} kind={previewKind} />
        )}

        {/* この曲に必要な技術 (未習得表示) */}
        {variant && (
          <div data-onboarding="prePractice.skills">
            <SheetSkills key={`sk-${variant.id}`} userId={userId} kind={previewKind} id={variant.id} />
          </div>
        )}

        {/* 奏法・パート: 画面ガイドはこの2つをまとめて指す */}
        <div data-onboarding="prePractice.choose">
        {/* 曲の難易度軸は廃止 (2026-08-25 Tetsuo確定)。
            初級・中級・上級それぞれのスコアを用意するのが現実的でないため、
            曲では軸のセレクタを出さない。エチュード等の奏法軸はそのまま残す。 */}
        {byArt && <>
        {/* 選択肢が1つでも隠さない (2026-08-25 Tetsuo「案c」)。
            まだ作っていない奏法も「準備中」として見せることで、何を作るべきかが分かる。 */}
        <div className={styles.slab}>奏法を選ぶ</div>
        <select
          className={styles.sheetSelect}
          value={diff}
          onChange={(e) => { setDiff(e.target.value); setPatternId(""); setRangeIdx(-1) }}
        >
          {options.map((d) => {
            const v = byKey.get(d.id)
            const suffix = v
              ? `${v.star != null ? ` ・ ☆${v.star}` : ""}${v.bestScore != null ? ` ・ ベスト ${v.bestScore}` : ""}`
              : " ・ 準備中"
            return (
              <option key={d.id} value={d.id} disabled={!v}>
                {d.label}{suffix}
              </option>
            )
          })}
        </select>
        </>}

        {/* パターン (2026-08-25): 音符ごとの奏法・リズムで作った個別パターン。
            管理画面で名前を付けて作ると、ここに選択肢として並ぶ。 */}
        {patterns.length > 0 && (
          <>
            <div className={styles.slab}>パターンを選ぶ</div>
            <select
              className={styles.sheetSelect}
              value={patternId}
              onChange={(e) => { setPatternId(e.target.value); setRangeIdx(-1) }}
            >
              <option value="">そのまま弾く</option>
              {patterns.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.patternName}{v.bestScore != null ? ` ・ ベスト ${v.bestScore}` : ""}
                </option>
              ))}
            </select>
          </>
        )}

        {/* パート: 全部演奏する(現行スコア) + 分割は教材が入れば有効 */}
        <div className={styles.slab}>パートを選ぶ</div>
        {partVariants.length > 0 ? (
          // 実体化済み: その小節だけの教材へ切り替える
          <select
            className={styles.sheetSelect}
            value={partPick}
            onChange={(e) => setPartPick(e.target.value)}
          >
            <option value="">全部演奏する</option>
            {partVariants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.partName ?? "パート"}{v.bestScore != null ? ` ・ ベスト ${v.bestScore}` : ""}
              </option>
            ))}
          </select>
        ) : (
          <select
            className={styles.sheetSelect}
            value={rangeIdx}
            onChange={(e) => setRangeIdx(Number(e.target.value))}
            disabled={sections.length === 0}
            title={sections.length === 0 ? "管理画面でパートを登録すると選べます" : undefined}
          >
            <option value={-1}>全部演奏する</option>
            {sections.length > 0 ? (
              sections.map((s, i) => (
                <option key={i} value={i}>
                  {s.name} ・ {s.startMeasure}〜{s.endMeasure}小節
                </option>
              ))
            ) : (
              <option disabled value="soon">パートはまだ登録されていません</option>
            )}
          </select>
        )}

        </div>

        {/* 準備中を選んでいるあいだは押せないようにする。押しても何も起きない状態を作らない。 */}
        <button className={styles.cta} onClick={start} disabled={!variant}
          style={!variant ? { opacity: .5, cursor: "not-allowed" } : undefined}
          data-onboarding="prePractice.start">
          {variant ? "練習をはじめる" : "この奏法はまだ準備中"}
        </button>

        {/* シート自体が開いたときに出るガイド (z-index: シート1000 < マーク1901) */}
      </div>
    </div>
  )
}
