/**
 * verify-lesson-soundcheck.ts — 窓あき発音チェック(soundCheck.ts)のユニットテスト
 * 実行: npx tsx scripts/verify-lesson-soundcheck.ts
 * 合成PCM(サイン波バースト+微小ノイズ床)で5ケースを検証する。
 */
import { checkSound } from "../app/[userId]/lessons/_lib/soundCheck"

const SR = 44100

/** noiseAmp の床の上に、指定時刻から dur 秒のサイン波バーストを置いたPCMを合成 */
function synth(totalSec: number, bursts: Array<[number, number]>, noiseAmp = 0.002): Float32Array {
  const out = new Float32Array(Math.floor(totalSec * SR))
  for (let i = 0; i < out.length; i++) out[i] = (Math.random() * 2 - 1) * noiseAmp
  for (const [at, dur] of bursts) {
    const from = Math.floor(at * SR)
    const to = Math.min(out.length, Math.floor((at + dur) * SR))
    for (let i = from; i < to; i++) {
      out[i] += 0.3 * Math.sin((2 * Math.PI * 440 * (i - from)) / SR)
    }
  }
  return out
}

let pass = 0
let fail = 0
function t(name: string, cond: boolean) {
  if (cond) {
    pass++
    console.log(`  PASS ${name}`)
  } else {
    fail++
    console.log(`  FAIL ${name}`)
  }
}

// 期待タイミング: 60BPMで4分音符×8 (0,1,2,...7秒)
const expected = [0, 1, 2, 3, 4, 5, 6, 7]

// ① 全音符ぴったり発音 → 合格
{
  const r = checkSound(synth(9, expected.map((e) => [e, 0.6])), SR, expected)
  t(`① 全発音 → pass (ratio=${r.ratio.toFixed(2)})`, r.pass && r.covered === 8)
}
// ② 完全な無音 (ノイズ床のみ) → 不合格
{
  const r = checkSound(synth(9, []), SR, expected)
  t(`② 無音 → fail (covered=${r.covered})`, !r.pass)
}
// ③ 半分だけ弾いて途中放棄 (4/8=50% < 70%) → 不合格
{
  const r = checkSound(synth(9, [[0, 0.6], [1, 0.6], [2, 0.6], [3, 0.6]]), SR, expected)
  t(`③ 途中放棄50% → fail (ratio=${r.ratio.toFixed(2)})`, !r.pass)
}
// ④ 多少ズレて弾く (+0.3秒遅れ・窓±0.4内) → 合格
{
  const r = checkSound(synth(9, expected.map((e) => [e + 0.3, 0.6])), SR, expected)
  t(`④ +0.3秒ズレ → pass (ratio=${r.ratio.toFixed(2)})`, r.pass)
}
// ⑤ スラー的な連続音 (0〜7.5秒鳴りっぱなし) → 全窓が埋まり合格
{
  const r = checkSound(synth(9, [[0, 7.5]]), SR, expected)
  t(`⑤ 連続音(スラー) → pass (ratio=${r.ratio.toFixed(2)})`, r.pass && r.covered === 8)
}
// ⑥ 1音抜け (7/8=87.5% ≥ 70%) → 合格 (点数不問の寛容さ)
{
  const r = checkSound(synth(9, expected.filter((e) => e !== 4).map((e) => [e, 0.6])), SR, expected)
  t(`⑥ 1音抜け → pass (ratio=${r.ratio.toFixed(2)})`, r.pass && r.covered === 7)
}

console.log(`\n${fail === 0 ? "ALL PASS" : "FAILED"} (${pass} pass / ${fail} fail)`)
if (fail > 0) process.exitCode = 1
