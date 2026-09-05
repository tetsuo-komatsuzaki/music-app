"use client"

// 練習前シート (Phase C / 2026-07-18更新): 難易度・パートを常時フル表示。
// 教材の無い難易度/パートはグレー(選択不可)で「準備中」を明示。曲が増えれば自動で有効化。
// お手本再生・譜面プレビューは次段 (アセット未整備)。
import { useState } from "react"
import { useRouter } from "next/navigation"
import styles from "./prePractice.module.css"
import { DIFFICULTIES } from "@/app/_libs/materialVariant"
import { ARTICULATIONS } from "@/app/_libs/materialVariant"
import { STANDARD_ARTICULATIONS } from "@/app/_libs/articulationPatterns"
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
  /** リズム変種 (rhythmRecipe 由来) なら true。奏法を継いでいてもパターン欄に出す (2026-09-05 カイザー No.4) */
  rhythmPattern?: boolean | null
  /** 実体化されたパート教材 (2026-08-25 案B)。null=通し */
  partId?: string | null
  partName?: string | null
  /** パート教材の切り出し元 (通し変種) のid。2026-09-01: パートの親判定はこれが正 */
  sourceItemId?: string | null
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
  // 2026-09-01: 軸の組み立てはパートを除いた「通し変種」だけで行う。
  // パートを混ぜると byKey が最後のパート教材で上書きされ、パターンも選んでいない
  // のに「はじめる」の行き先がパートになりうる。
  const soloVariants = group.variants.filter((v) => !v.partId)
  // 2026-09-01 Tetsuo確定: 奏法とパターンは並列の別軸で、パターンはどの奏法にも
  // ぶら下がらない。通し (奏法なし・パターンなし) を「そのまま弾く」として基準に置き、
  //   奏法軸   = articulation を持つ変種
  //   パターン軸 = articulation を持たずパターン名を持つ変種
  // に分ける。どちらか一方を選んだら他方の欄は消える (排他)。
  const baseVariant = byArt
    ? soloVariants.find((v) => !v.articulation && !v.patternName)
    : undefined
  // 2026-09-05 Tetsuo指摘 (カイザー No.4 のリズム別が選べない): 通し自体が奏法を持つエチュード
  // (No.4 は奏法=slur) では、リズム変種も通しから奏法を継いで articulation=slur になる。
  // 「奏法を持たない変種だけがパターン」と決めていたため1件も出なかった。
  //   奏法軸   = リズム変種でない、奏法を持つ変種 (奏法レシピの変種は従来どおりここ)
  //   パターン欄 = リズム変種は「いま選んでいる奏法と同じ奏法を継いだもの」、
  //              奏法レシピの混合パターン (奏法なし) は従来どおり「そのまま弾く」のとき
  const isRhythm = (v: SheetVariant) => v.rhythmPattern === true
  const artVariants = byArt ? soloVariants.filter((v) => v.articulation && !isRhythm(v)) : soloVariants
  // 第1軸 → 変種。曲=難易度 / エチュード=奏法 (2026-08-25 Tetsuo確定)
  const byKey = new Map<string, SheetVariant>()
  for (const v of artVariants) {
    byKey.set(byArt ? (v.articulation ?? "legato") : (v.difficulty ?? "BEGINNER"), v)
  }
  // 選択肢は「選択用」の ARTICULATIONS を使う (2026-08-25)。
  // 生成用の STANDARD_ARTICULATIONS には slur が無く、奏法=slur の教材
  // (カイザー No.4/6/8/10/12/31/34/35/36) が選択肢に出ず、既定がレガートに落ちて
  // variant=undefined になり、詳細画面へ遷移できず譜面も出ない状態だった。
  // 2026-09-01 Tetsuo確定: これから作れる奏法だけを「準備中」で見せる。
  // スラー・テヌートは一括生成の対象外 (STANDARD_ARTICULATIONS に無い) なので、
  // 教材が実在する族でだけ選択肢に出す。No.2 のように作る予定の無いスラーが
  // ずっと準備中で居座るのを防ぐ。
  const generatable = new Set<string>(STANDARD_ARTICULATIONS.map((a) => a.id))
  const options: { id: string; label: string }[] = byArt
    ? ARTICULATIONS.filter((a) => generatable.has(a.id) || byKey.has(a.id))
        .map((a) => ({ id: a.id, label: a.label }))
    : DIFFICULTIES.map((d) => ({ id: d.id, label: d.label }))
  // 2026-09-05 Tetsuo指摘 (連続スピッカートのパターンが出ない): 奏法の通し変種が無くても、その奏法に
  // 置いたリズム変種があれば奏法は選べる (選ぶとパターン欄にそのリズム変種が出る)
  const rhythmArts = new Set(soloVariants.filter((v) => isRhythm(v) && v.patternName).map((v) => v.articulation ?? ""))
  const artAvailable = (id: string) => byKey.has(id) || rhythmArts.has(id)
  const firstAvail = options.find((o) => artAvailable(o.id))?.id ?? options[0].id
  // 「まだ何も選んでいない」状態の値。通しがあれば "" (そのまま弾く)
  const neutral = baseVariant ? "" : firstAvail

  const [diff, setDiff] = useState(neutral)

  // 第2軸: 個別パターン。曲 (難易度軸) は従来どおり選んだ難易度の中から出す。
  const sameAxis = soloVariants.filter(
    (v) => (byArt ? (v.articulation ?? "legato") : (v.difficulty ?? "BEGINNER")) === diff,
  )
  const patterns = byArt
    ? soloVariants.filter((v) => v.patternName && (isRhythm(v) ? (v.articulation ?? "") === diff : (!v.articulation && diff === "")))
    : sameAxis.filter((v) => v.patternName)
  const [patternId, setPatternId] = useState<string>("")
  // 軸の値がラダーのどれとも噛み合わない教材があるため、最後に「先頭の変種」へ落とす
  // (2026-08-25: カイザーNo.10ほか9件が 奏法=slur の単独グループで variant=undefined になり、
  //  詳細画面へ遷移できず譜面も出ない状態だった。start() が黙って return していて気付けなかった)
  // フォールバックは「どの軸の値にも教材が無い族」だけに効かせる (2026-08-25)。
  // 常に variants[0] へ落とすと、準備中の奏法を選んでも別の教材へ遷移してしまう。
  const base = byArt
    ? ((diff === "" ? baseVariant : byKey.get(diff)) ?? (byKey.size === 0 ? soloVariants[0] : undefined))
    : (sameAxis.find((v) => !v.patternName) ?? byKey.get(diff)
        ?? (byKey.size === 0 ? soloVariants[0] : undefined))
  const variant = (patternId ? patterns.find((v) => v.id === patternId) : base) ?? base
  // 排他: 片方を選んだらもう片方の欄は消す (2026-09-01 Tetsuo確定)
  // 排他 (2026-09-01) は「奏法を持たないパターン」だけに効かせる。奏法を継いだリズム変種は
  // 奏法欄とパターン欄を両方出す (奏法 → その奏法のパターン、の2段で選ぶ)
  const selectedPattern = patternId ? patterns.find((v) => v.id === patternId) : undefined
  const showArtSelect = patternId === "" || !!selectedPattern?.articulation
  const showPatternSelect = patterns.length > 0

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
  // 2026-09-01: パートは「いま選んでいる通し変種から切り出したもの」だけを出す。
  // 名前 (奏法/パターン) での突き合わせは、スラーのように 奏法=slur と
  // リズム名「スラー」を両方持つ変種で必ず食い違う。実体化時に必ず入る
  // variantRecipe.sourceItemId が唯一の正 (partMaterialize.ts)。
  // sourceItemId を持たない旧データだけ、従来どおり軸で拾う。
  const partVariants = group.variants.filter((v) =>
    v.partId && (v.sourceItemId ? v.sourceItemId === variant?.id : axisOf(v) === diff),
  )
  // 2026-08-31 Tetsuo確定 B案: グループにパート実体があるのに、いま選んでいる軸
  // (奏法/難易度) の分がまだ無いときは「準備中」で選択不可にする。以前は旧経路
  // (通し+区間) に黙って落ち、パートを選んだのに全小節の詳細が開いていた
  const partNamesAllAxes = [...new Map(
    group.variants.filter((v) => v.partId).map((v) => [v.partId as string, v.partName ?? "パート"]),
  ).values()]
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
        {byArt && showArtSelect && <>
        {/* 選択肢が1つでも隠さない (2026-08-25 Tetsuo「案c」)。
            まだ作っていない奏法も「準備中」として見せることで、何を作るべきかが分かる。 */}
        <div className={styles.slab}>奏法を選ぶ</div>
        <select
          className={styles.sheetSelect}
          value={diff}
          onChange={(e) => { setDiff(e.target.value); setPatternId(""); setRangeIdx(-1); setPartPick("") }}
        >
          {baseVariant && <option value="">そのまま弾く</option>}
          {options.map((d) => {
            const v = byKey.get(d.id)
            const suffix = v
              ? `${v.star != null ? ` ・ ☆${v.star}` : ""}${v.bestScore != null ? ` ・ ベスト ${v.bestScore}` : ""}`
              : rhythmArts.has(d.id) ? " ・ パターンのみ" : " ・ 準備中"
            return (
              <option key={d.id} value={d.id} disabled={!artAvailable(d.id)}>
                {d.label}{suffix}
              </option>
            )
          })}
        </select>
        </>}

        {/* パターン (2026-08-25): 音符ごとの奏法・リズムで作った個別パターン。
            管理画面で名前を付けて作ると、ここに選択肢として並ぶ。 */}
        {showPatternSelect && (
          <>
            <div className={styles.slab}>パターンを選ぶ</div>
            <select
              className={styles.sheetSelect}
              value={patternId}
              onChange={(e) => { setPatternId(e.target.value); setRangeIdx(-1); setPartPick("") }}
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
        ) : partNamesAllAxes.length > 0 ? (
          // この軸のパートは実体化待ち (管理画面を開くと自動補充される)
          <select className={styles.sheetSelect} value="" onChange={() => {}}>
            <option value="">全部演奏する</option>
            {partNamesAllAxes.map((name) => (
              <option key={name} disabled value={`soon:${name}`}>{name} ・ 準備中</option>
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
          {variant ? "練習をはじめる" : patterns.length > 0 ? "パターンを選んでください" : "この奏法はまだ準備中"}
        </button>

        {/* シート自体が開いたときに出るガイド (z-index: シート1000 < マーク1901) */}
      </div>
    </div>
  )
}
