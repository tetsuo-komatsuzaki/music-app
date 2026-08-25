"use client"

// 基礎練の練習前シート (Phase C-basics / 2026-07-18更新): 調・奏法を常時フル表示。
// グレー(選択不可)の理由を出し分ける (2026-07-20):
//   - 上位★でのみ存在する奏法 (例: ⭐1音階のスタッカート=⭐2) → 「選択不可(⭐N)」
//   - そもそも教材が無い → 「準備中」(教材が増えれば自動で有効化)
import { useState } from "react"
import { useRouter } from "next/navigation"
import styles from "../pieces/prePractice.module.css"
import { ARTICULATIONS } from "@/app/_libs/materialVariant"
import SheetPreview from "../pieces/SheetPreview"
import SheetSkills from "../pieces/SheetSkills"

export type BasicsVariant = {
  id: string
  keyTonic: string
  keyMode: string | null
  articulation: string | null
  bestScore: number | null
  /** この変種の難易度⭐。上位★ロック判定に使う */
  star?: number | null
  /** 教材名から取り出した軸の値 (族名_軸1_軸2 の 軸1以降) */
  axisValues?: string[]
}
export type GroupAxis = { key: string; label: string; kind: "select" | "toggle"; values: string[] }
export type BasicsFamily = {
  title: string
  coverImagePath: string | null
  variants: BasicsVariant[]
  /** 族の軸。あるときは調/奏法のかわりにこのプルダウンを出す (2026-08-25) */
  axes?: GroupAxis[] | null
  /** いま開いている★タブの難易度。これ以下の★のみ選択可、超過は「選択不可(⭐N)」表示 */
  baseStar?: number | null
}

// 調ラダー: 長調12 + 短調12 (指導順)。族に無い調はグレー表示。
// 長調・短調は主音が同じでも別物なので、(主音+旋法) を identity にして出し分ける (2026-07-20)。
const KEY_ORDER = ["C", "G", "D", "A", "E", "B", "F#", "Db", "Ab", "Eb", "Bb", "F"]
const MINOR_ORDER = ["A", "E", "B", "F#", "C#", "G#", "D", "G", "C", "F", "Bb", "Eb"]
const TONIC_JA: Record<string, string> = {
  C: "ハ", G: "ト", D: "ニ", A: "イ", E: "ホ", B: "ロ", "F#": "嬰ヘ", "C#": "嬰ハ", "G#": "嬰ト",
  Db: "変ニ", Ab: "変イ", Eb: "変ホ", Bb: "変ロ", F: "ヘ",
}
type ModeKind = "major" | "minor"
const modeOf = (m?: string | null): ModeKind => ((m ?? "").includes("minor") ? "minor" : "major")
const ckey = (tonic: string, mode: ModeKind) => `${tonic}:${mode}`
const keyLabel = (tonic: string, mode: ModeKind) => `${TONIC_JA[tonic] ?? tonic}${mode === "minor" ? "短調" : "長調"}`
// 奏法ラダー: 各奏法 (「基本」は廃止 2026-07-20。スラー等は articulation で識別)
const ART_LADDER = [...ARTICULATIONS]

function coverGlyph(category: string) {
  if (category === "arpeggio" || category === "arpeggios") {
    return <><circle cx="6" cy="17" r="2.3" /><circle cx="18" cy="13" r="2.3" /><path d="M8.3 16.3 15.8 13M8 15V8l10-2.4V11" /></>
  }
  return <><path d="M4 15c3 0 3-8 6-8s3 8 6 8" /><path d="M4 19h16" /></>
}

export default function BasicsPreSheet({
  userId, category, family, onClose,
}: {
  userId: string
  category: string
  family: BasicsFamily
  onClose: () => void
}) {
  const router = useRouter()
  // baseStar = 開いている★タブ。null なら全存在教材を選択可 (旧挙動)。
  const baseStar = family.baseStar ?? null
  const inLevel = (v: BasicsVariant) => baseStar == null || (v.star != null && v.star <= baseStar)
  // いま選択可能な変種 (★条件を満たすもの)
  const selVariants = family.variants.filter(inLevel)
  const vkey = (v: BasicsVariant) => ckey(v.keyTonic, modeOf(v.keyMode))
  const availKeys = new Set(selVariants.map(vkey))
  const availArts = new Set(selVariants.map((v) => v.articulation ?? "basic"))
  // 調ラダー = 長調12 + (族に短調があれば)短調12 + 標準外の実在調
  const hasMinor = family.variants.some((v) => modeOf(v.keyMode) === "minor")
  const keyList: { tonic: string; mode: ModeKind }[] = [
    ...KEY_ORDER.map((t) => ({ tonic: t, mode: "major" as ModeKind })),
    ...(hasMinor ? MINOR_ORDER.map((t) => ({ tonic: t, mode: "minor" as ModeKind })) : []),
  ]
  for (const v of family.variants) {
    const m = modeOf(v.keyMode)
    if (!keyList.some((x) => x.tonic === v.keyTonic && x.mode === m)) keyList.push({ tonic: v.keyTonic, mode: m })
  }
  const firstKey = keyList.find((x) => availKeys.has(ckey(x.tonic, x.mode)))
  const firstArt = ART_LADDER.find((a) => availArts.has(a.id))?.id ?? "basic"
  const [selKey, setSelKey] = useState(firstKey ? ckey(firstKey.tonic, firstKey.mode) : "")
  const [selArt, setSelArt] = useState(firstArt)

  const variant =
    family.variants.find(
      (v) => vkey(v) === selKey && (v.articulation ?? "basic") === selArt && inLevel(v),
    ) ?? selVariants.find((v) => vkey(v) === selKey)

  // 選択不可の奏法が「上位★でのみ存在」なら、その最小★を返す (=選択不可(⭐N))。教材自体が無ければ null。
  const lockStar = (artId: string): number | null => {
    const higher = family.variants
      .filter((v) => (v.articulation ?? "basic") === artId && v.star != null && (baseStar == null || (v.star as number) > baseStar))
      .map((v) => v.star as number)
    return higher.length ? Math.min(...higher) : null
  }

  // 選択不可の調が「上位★でのみ存在」なら、その最小★を返す (=選択不可(⭐N))。教材自体が無ければ null。
  const lockKeyStar = (tonic: string, mode: ModeKind): number | null => {
    const higher = family.variants
      .filter((v) => v.keyTonic === tonic && modeOf(v.keyMode) === mode && v.star != null && (baseStar == null || (v.star as number) > baseStar))
      .map((v) => v.star as number)
    return higher.length ? Math.min(...higher) : null
  }

  const start = () => { if (variant) router.push(`/${userId}/practice/${category}/${variant.id}`) }

  // ── 軸モード (2026-08-25): 族に axes があるときは、調/奏法ではなく軸で選ばせる。
  // ボーイングなら「弦 × 指の形」、フィンガリングなら「指 × 開放弦から」。
  // 値の一致は教材名から取り出した axisValues で判定する (族名_軸1_軸2)。
  const axes = family.axes ?? null
  const [axisSel, setAxisSel] = useState<string[]>(() =>
    // 初期値は「実在する最初の教材」の軸値。無ければ軸の先頭。
    (family.axes ?? []).map((ax, i) => selVariants[0]?.axisValues?.[i] || ax.values[0] || "基本"),
  )
  // 「基本」= 教材名に軸2が付いていない状態。空文字と読み替える。
  // 例: A線を押さえる練習_2の指 は「開放弦から=基本」、_2の指_開放弦から は「開放弦から」。
  const axVal = (v: BasicsVariant, i: number) => v.axisValues?.[i] || "基本"
  const axisMatch = (v: BasicsVariant) =>
    (axes ?? []).every((_, i) => axVal(v, i) === (axisSel[i] ?? ""))
  const axisVariant = axes ? selVariants.find(axisMatch) ?? null : null
  const axisHas = (i: number, val: string) =>
    selVariants.some((v) =>
      axVal(v, i) === val &&
      (axes ?? []).every((_, k) => k === i || axVal(v, k) === (axisSel[k] ?? "")),
    )
  const startAxis = () => { if (axisVariant) router.push(`/${userId}/practice/${category}/${axisVariant.id}`) }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.grab} />
        <button className={styles.close} onClick={onClose} aria-label="閉じる">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>

        <div className={styles.hero}>
          <div className={styles.cover} style={{ background: "linear-gradient(150deg,#137d76,#3fb9a6)" }}>
            {family.coverImagePath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={family.coverImagePath} alt="" />
            ) : (
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round">{coverGlyph(category)}</svg>
            )}
          </div>
          <div className={styles.info}>
            <div className={styles.title}>{family.title}</div>
            <div className={styles.composer}>調・奏法を選んで練習</div>
          </div>
        </div>

        {/* 譜面プレビュー + お手本再生 (選択中の調変種で出し分け) */}
        {(axes ? axisVariant : variant) && <SheetPreview key={(axes ? axisVariant : variant)!.id} scoreId={(axes ? axisVariant : variant)!.id} kind="practice" />}

        {/* この練習に必要な技術 (未習得表示) */}
        {variant && <SheetSkills key={`sk-${variant.id}`} userId={userId} kind="practice" id={variant.id} />}

        {/* 調: 長調・短調を出し分けて常時表示。族に無い調はグレー */}
        {/* 軸モード (2026-08-25): 族に軸があるときは、調/奏法ではなく軸で選ばせる。
            存在しない組み合わせは選択不可にする (格子が埋まっていない族があるため)。 */}
        {axes ? (
          <>
            {axes.map((ax, i) => (
              <div key={ax.key}>
                <div className={styles.slab}>{ax.label}を選ぶ</div>
                <select
                  className={styles.sheetSelect}
                  value={axisSel[i] ?? ""}
                  onChange={(e) => setAxisSel((prev) => prev.map((v, k) => (k === i ? e.target.value : v)))}
                >
                  {ax.values.map((val) => (
                    <option key={val} value={val} disabled={!axisHas(i, val)}>
                      {val}{axisHas(i, val) ? "" : " ・ 準備中"}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            <button className={styles.cta} onClick={startAxis} disabled={!axisVariant}
              style={!axisVariant ? { opacity: .5, cursor: "not-allowed" } : undefined}>
              {axisVariant ? "練習をはじめる" : "この組み合わせはまだ準備中"}
            </button>
          </>
        ) : (
          <>
        <div className={styles.slab}>調を選ぶ</div>
        <select
          className={styles.sheetSelect}
          value={selKey}
          onChange={(e) => setSelKey(e.target.value)}
        >
          {keyList.map(({ tonic, mode }) => {
            const cek = ckey(tonic, mode)
            const avail = availKeys.has(cek)
            const v = selVariants.find((x) => vkey(x) === cek)
            const lock = avail ? null : lockKeyStar(tonic, mode)
            const suffix = avail
              ? (v?.bestScore != null ? ` ・ ベスト ${v.bestScore}` : "")
              : lock != null ? ` ・ ⭐${lock}で解放` : " ・ 準備中"
            return (
              <option key={cek} value={cek} disabled={!avail}>
                {keyLabel(tonic, mode)}{suffix}
              </option>
            )
          })}
        </select>

        {/* 奏法バリエーション: 基本 + 各奏法。未整備は選択不可 */}
        <div className={styles.slab}>奏法バリエーション</div>
        <select
          className={styles.sheetSelect}
          value={selArt}
          onChange={(e) => setSelArt(e.target.value)}
        >
          {ART_LADDER.map((a) => {
            const avail = availArts.has(a.id)
            const lock = avail ? null : lockStar(a.id)
            const suffix = avail ? "" : lock != null ? ` ・ ⭐${lock}で解放` : " ・ 準備中"
            return (
              <option key={a.id} value={a.id} disabled={!avail}>
                {a.label}{suffix}
              </option>
            )
          })}
        </select>

        <button className={styles.cta} onClick={start}>練習をはじめる</button>
          </>
        )}
      </div>
    </div>
  )
}
