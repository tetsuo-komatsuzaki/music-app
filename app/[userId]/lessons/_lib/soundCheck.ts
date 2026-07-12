// 窓あき発音チェック (学びレッスン確定#3 2026-07-14)
//
// 「楽譜の音符がある期待タイミングの窓の中で音が鳴っているか」だけを見る、
// 音程・リズム解析より粗い粒度の有効演奏判定。すべて端末内で完結する。
//
// パラメータは仮値 (Tetsuo確定値扱い・実機で調整):
//   窓幅 ±0.4秒 / 合格に必要な窓カバー率 70% / ノイズ床比 4倍 / 絶対下限 RMS 0.01

export const SOUND_CHECK_PARAMS = {
  /** 期待タイミングの前後この秒数を「窓」とする */
  windowSec: 0.4,
  /** 音が鳴っていた窓の割合がこれ以上なら有効演奏 */
  passRatio: 0.7,
  /** 発音とみなす閾値 = max(絶対下限, min(ノイズ床×この倍率, ピーク×peakRatio)) */
  noiseFloorFactor: 4,
  /**
   * ピーク(上位5%分位RMS)比の上限。録音全体が鳴りっぱなし(スラー/トレモロ等)だと
   * 「ノイズ床」推定が信号そのものになり閾値が信号を超えて全滅するため、
   * ピーク基準で閾値に天井を設ける
   */
  peakRatio: 0.5,
  /** 絶対下限 (フルスケール比RMS)。無音・環境ノイズだけの録音を落とす保険 */
  absoluteFloor: 0.015,
  /** RMSフレーム長 (秒) */
  frameSec: 0.03,
}

export type SoundCheckResult = {
  pass: boolean
  /** 音が鳴っていた窓の数 */
  covered: number
  /** 期待タイミング(窓)の総数 */
  total: number
  ratio: number
  /** 判定に使った発音閾値 (デバッグ用) */
  threshold: number
}

/**
 * フレームRMS列を計算する。
 * @param samples モノラルPCM (-1..1)
 * @param sampleRate サンプルレート
 */
export function frameRms(
  samples: Float32Array,
  sampleRate: number,
  frameSec = SOUND_CHECK_PARAMS.frameSec,
): Float32Array {
  const frameLen = Math.max(1, Math.round(sampleRate * frameSec))
  const n = Math.floor(samples.length / frameLen)
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    let sum = 0
    const off = i * frameLen
    for (let j = 0; j < frameLen; j++) {
      const v = samples[off + j]
      sum += v * v
    }
    out[i] = Math.sqrt(sum / frameLen)
  }
  return out
}

/** 分位RMS (q=0.1でノイズ床、q=0.95でピーク相当) */
function rmsQuantile(rms: Float32Array, q: number): number {
  if (rms.length === 0) return 0
  const sorted = Array.from(rms).sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))]
}

/**
 * 窓あき発音チェック本体 (純関数)。
 * @param samples 録音のモノラルPCM。t=0 が「カウントイン終了=演奏開始」に揃っていること
 * @param sampleRate サンプルレート
 * @param expectedTimes 音符の期待開始時刻 (秒・演奏開始起点・昇順)
 */
export function checkSound(
  samples: Float32Array,
  sampleRate: number,
  expectedTimes: number[],
  params = SOUND_CHECK_PARAMS,
): SoundCheckResult {
  const rms = frameRms(samples, sampleRate, params.frameSec)
  const floor = rmsQuantile(rms, 0.1)
  const peak = rmsQuantile(rms, 0.95)
  const threshold = Math.max(
    params.absoluteFloor,
    Math.min(floor * params.noiseFloorFactor, peak * params.peakRatio),
  )
  const frameSec = params.frameSec
  let covered = 0
  for (const t of expectedTimes) {
    const from = Math.max(0, Math.floor((t - params.windowSec) / frameSec))
    const to = Math.min(rms.length - 1, Math.ceil((t + params.windowSec) / frameSec))
    let hit = false
    for (let i = from; i <= to; i++) {
      if (rms[i] >= threshold) {
        hit = true
        break
      }
    }
    if (hit) covered++
  }
  const total = expectedTimes.length
  const ratio = total === 0 ? 0 : covered / total
  return { pass: total > 0 && ratio >= params.passRatio, covered, total, ratio, threshold }
}
