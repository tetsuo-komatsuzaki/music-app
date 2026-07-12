/**
 * verify-bowing-motions.ts — bowing-motions.ts(SSOT) の検証
 * ① 教材データJSON `bowingMotions` との数値diffゼロ (検証プロトコル#1)
 * ② 図解モーション要件定義書 v1.0 A-5 の教育的不変条件 (検証プロトコル#2)
 * 実行: npx tsx scripts/verify-bowing-motions.ts
 */
import { BOWING_TECHNIQUES, LESSON_MOTION_MAP } from "../app/components/violin/bowing-motions"
import lessonData from "../app/[userId]/lessons/_lib/lessonData.v1_0.json"

let fail = 0
const t = (name: string, cond: boolean, detail = "") => {
  if (cond) console.log(`  PASS ${name}`)
  else {
    fail++
    console.log(`  FAIL ${name} ${detail}`)
  }
}

// JSONキー → 技法id (bowstacc は bow-staccato のエイリアス)
const JSON_TO_ID: Record<string, string> = {
  detache: "detache",
  legato: "legato",
  staccato: "staccato",
  bowstacc: "bow-staccato",
  spiccato: "spiccato",
  ricochet: "ricochet",
  portato: "portato",
  tremolo: "tremolo",
}

console.log("── ① JSONとの数値diff ──")
const motions = lessonData.bowingMotions as Record<
  string,
  { dur: number; alt: boolean; blink?: boolean; k: number[][] }
>
for (const [jsonKey, jm] of Object.entries(motions)) {
  const id = JSON_TO_ID[jsonKey]
  const tech = BOWING_TECHNIQUES.find((x) => x.id === id)
  if (!tech) {
    fail++
    console.log(`  FAIL 技法 ${id} が bowing-motions.ts に無い`)
    continue
  }
  const tsK = tech.keyframes.map((f) => [f.t, f.h, f.lift])
  const same =
    tech.duration === jm.dur &&
    tech.alternate === jm.alt &&
    !!tech.hasBounce === !!jm.blink &&
    JSON.stringify(tsK) === JSON.stringify(jm.k)
  t(`${id} (dur/alt/blink/keyframes 完全一致)`, same,
    same ? "" : `ts=${JSON.stringify({ d: tech.duration, a: tech.alternate, k: tsK })}`)
}
t("技法数 = 8", BOWING_TECHNIQUES.length === 8, `actual=${BOWING_TECHNIQUES.length}`)

console.log("── ② A-5 教育的不変条件 ──")
const get = (id: string) => BOWING_TECHNIQUES.find((x) => x.id === id)!
const allLiftZero = (id: string) => get(id).keyframes.every((f) => f.lift === 0)
const hs = (id: string) => get(id).keyframes.map((f) => f.h)
// 停止(同値プラトー)を圧縮してから方向転換を数える
const reversals = (arr: number[]) => {
  const c = arr.filter((v, i) => i === 0 || v !== arr[i - 1])
  let n = 0
  for (let i = 1; i < c.length - 1; i++) {
    if (Math.sign(c[i] - c[i - 1]) !== Math.sign(c[i + 1] - c[i])) n++
  }
  return n
}
const monotoneNonInc = (arr: number[]) => arr.every((v, i) => i === 0 || v <= arr[i - 1])
const monotoneNonDec = (arr: number[]) => arr.every((v, i) => i === 0 || v >= arr[i - 1])

// スタッカート: h往復・lift常に0
t("staccato: h往復(方向転換あり)", reversals(hs("staccato")) >= 3)
t("staccato: 全フレーム lift=0", allLiftZero("staccato"))

// 連続スタッカート: ダウン区間(t≤50)単調非増加・アップ区間(t≥50)単調非減少・4音×2・lift0・終点=始点
{
  const kf = get("bow-staccato").keyframes
  const down = kf.filter((f) => f.t <= 50).map((f) => f.h)
  const up = kf.filter((f) => f.t >= 50).map((f) => f.h)
  t("連続スタッカート: ダウン区間 h単調非増加", monotoneNonInc(down))
  t("連続スタッカート: アップ区間 h単調非減少", monotoneNonDec(up))
  t("連続スタッカート: 全フレーム lift=0", allLiftZero("bow-staccato"))
  t("連続スタッカート: 終点h=始点h", kf[0].h === kf[kf.length - 1].h)
  const downNotes = new Set(down).size - 1 // 停止段数-1(始点除く)
  const upNotes = new Set(up).size - 1
  t("連続スタッカート: 各区間4音", downNotes === 4 && upNotes === 4, `down=${downNotes} up=${upNotes}`)
}

// スピッカート: h往復・方向転換はすべて空中(lift>0)
{
  const kf = get("spiccato").keyframes
  let ok = true
  for (let i = 1; i < kf.length - 1; i++) {
    const a = kf[i].h - kf[i - 1].h
    const b = kf[i + 1].h - kf[i].h
    if (a !== 0 && b !== 0 && Math.sign(a) !== Math.sign(b) && kf[i].lift === 0) ok = false
  }
  t("spiccato: h往復", reversals(hs("spiccato")) >= 1)
  t("spiccato: 方向転換はすべて lift>0 (空中)", ok)
}

// リコシェ: 各群h単調・接地4回×2・方向転換(t=0/50/100)は空中・跳ね減衰
// 方向転換点(t=0/50/100)は群の境界=空中の返しなので、単調性・減衰の判定からは
// 転換点そのもの(t=50は両群・t=0/100は跳ねでなく返し)を適切に除外する
{
  const kf = get("ricochet").keyframes
  const down = kf.filter((f) => f.t < 50) // t=0(返し)含む・t=50(返し)除く
  const up = kf.filter((f) => f.t > 50) // t=100(返し)含む・t=50除く
  t("ricochet: ダウン群 h単調減少", monotoneNonInc(down.map((f) => f.h)))
  t("ricochet: アップ群 h単調増加", monotoneNonDec(up.map((f) => f.h)))
  const downGround = down.filter((f) => f.lift === 0).length
  const upGround = up.filter((f) => f.lift === 0).length
  t("ricochet: 接地(lift=0)が4回×2群", downGround === 4 && upGround === 4, `down=${downGround} up=${upGround}`)
  const turns = kf.filter((f) => f.t === 0 || f.t === 50 || f.t === 100)
  t("ricochet: 方向転換点はすべて lift>0", turns.every((f) => f.lift > 0))
  const downBounces = down.filter((f) => f.lift > 0 && f.t !== 0).map((f) => f.lift)
  const upBounces = up.filter((f) => f.lift > 0 && f.t !== 100).map((f) => f.lift)
  t("ricochet: 跳ね高さが群内で減衰", monotoneNonInc(downBounces) && monotoneNonInc(upBounces),
    `down=${JSON.stringify(downBounces)} up=${JSON.stringify(upBounces)}`)
}

// ポルタート: h往復・lift0・停止がスタッカートより短い
{
  const stopLen = (id: string) => {
    const kf = get(id).keyframes
    let m = 0
    for (let i = 1; i < kf.length; i++) {
      if (kf[i].h === kf[i - 1].h) m = Math.max(m, kf[i].t - kf[i - 1].t)
    }
    return m
  }
  t("portato: h往復", reversals(hs("portato")) >= 3)
  t("portato: 全フレーム lift=0", allLiftZero("portato"))
  t("portato: 停止がスタッカートと同等以下(柔らかさ)", stopLen("portato") <= stopLen("staccato"),
    `portato=${stopLen("portato")} staccato=${stopLen("staccato")}`)
}

// トレモロ: 中心が中弓(≈172)
{
  const h = hs("tremolo")
  const center = (Math.max(...h) + Math.min(...h)) / 2
  t("tremolo: 中心が中弓(172±6)", Math.abs(center - 172) <= 6, `center=${center}`)
}

// lessonMotionMap: JSON準拠 (bowstacc→bow-staccatoの正規化のみ許容)
{
  const jsonMap = lessonData.lessonMotionMap as Record<string, string>
  const ok = Object.entries(jsonMap).every(
    ([lesson, mid]) => LESSON_MOTION_MAP[lesson] === (JSON_TO_ID[mid] ?? mid),
  )
  t("LESSON_MOTION_MAP がJSON準拠", ok)
}

console.log(`\n${fail === 0 ? "ALL PASS" : `FAILED (${fail})`}`)
if (fail > 0) process.exitCode = 1
