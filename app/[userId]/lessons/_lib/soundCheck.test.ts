import { describe, it, expect } from "vitest"
import { frameRms, checkSound, SOUND_CHECK_PARAMS } from "./soundCheck"

// 窓あき発音チェック (純関数)。端末内で「期待タイミングの窓に音があるか」だけを見る。

function constSamples(len: number, amp: number): Float32Array {
  const a = new Float32Array(len)
  a.fill(amp)
  return a
}

describe("frameRms", () => {
  it("一定振幅の信号は各フレームでその振幅の RMS になる", () => {
    // sampleRate=100, frameSec=0.1 → frameLen=10, 100サンプル→10フレーム
    const rms = frameRms(constSamples(100, 0.5), 100, 0.1)
    expect(rms.length).toBe(10)
    for (const v of rms) expect(v).toBeCloseTo(0.5, 6)
  })

  it("端数フレームは切り捨てられる (floor(len/frameLen))", () => {
    const rms = frameRms(constSamples(105, 0.3), 100, 0.1) // frameLen=10 → 10フレーム
    expect(rms.length).toBe(10)
  })

  it("無音は RMS 0", () => {
    const rms = frameRms(constSamples(50, 0), 100, 0.1)
    expect(rms.length).toBe(5)
    for (const v of rms) expect(v).toBe(0)
  })
})

describe("checkSound", () => {
  const P = { ...SOUND_CHECK_PARAMS, frameSec: 0.1, windowSec: 0.4 }

  it("期待タイミングが0件なら pass=false / ratio=0 (ゼロ割回避)", () => {
    const r = checkSound(constSamples(300, 0.5), 100, [], P)
    expect(r.total).toBe(0)
    expect(r.ratio).toBe(0)
    expect(r.pass).toBe(false)
  })

  it("全域で鳴っていれば全窓カバーで pass、かつ peakRatio 天井が効く", () => {
    // 全て0.5 → floor=peak=0.5。もし peakRatio 天井が無ければ threshold=floor*4=2.0 で全滅する。
    // 天井 peak*0.5=0.25 により threshold=0.25、RMS0.5≥0.25 で全カバー。
    const r = checkSound(constSamples(300, 0.5), 100, [0.5, 1.5, 2.5], P)
    expect(r.threshold).toBeCloseTo(0.25, 6)
    expect(r.covered).toBe(3)
    expect(r.total).toBe(3)
    expect(r.ratio).toBe(1)
    expect(r.pass).toBe(true)
  })

  it("完全無音は絶対下限で全滅 (pass=false)", () => {
    const r = checkSound(constSamples(300, 0), 100, [0.5, 1.5, 2.5], P)
    expect(r.threshold).toBe(P.absoluteFloor)
    expect(r.covered).toBe(0)
    expect(r.pass).toBe(false)
  })

  it("一部の窓しか鳴っていないと passRatio(0.7) を割って fail", () => {
    // 前半2秒(frames0-19)だけ鳴り、後半1秒(frames20-29)は無音。
    const s = new Float32Array(300)
    for (let i = 0; i < 200; i++) s[i] = 0.5
    // 期待 0.5s,1.5s は鳴っている窓、2.5s は無音窓 → covered=2/3=0.666<0.7
    const r = checkSound(s, 100, [0.5, 1.5, 2.5], P)
    expect(r.covered).toBe(2)
    expect(r.total).toBe(3)
    expect(r.ratio).toBeCloseTo(2 / 3, 6)
    expect(r.pass).toBe(false)
  })

  it("passRatio 丁度以上なら pass (4窓中3窓=0.75≥0.7)", () => {
    const s = new Float32Array(300)
    for (let i = 0; i < 200; i++) s[i] = 0.5 // frames0-19 鳴る
    const r = checkSound(s, 100, [0.5, 1.0, 1.5, 2.5], P) // 最後だけ無音窓
    expect(r.covered).toBe(3)
    expect(r.ratio).toBeCloseTo(0.75, 6)
    expect(r.pass).toBe(true)
  })

  it("窓は ±windowSec 内を走査する (境界近傍の音を拾う)", () => {
    // t=1.0s の窓 [0.6,1.4]。frame13(=1.3s) にだけ短い音を置く → 拾える。
    const s = new Float32Array(300)
    for (let i = 130; i < 140; i++) s[i] = 0.5 // frame13 のみ
    const r = checkSound(s, 100, [1.0], P)
    expect(r.covered).toBe(1)
    expect(r.pass).toBe(true)
  })
})
