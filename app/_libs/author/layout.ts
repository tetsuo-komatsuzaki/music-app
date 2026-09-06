/**
 * 五線譜の配置 (要件 10 見やすい画面 ・ 09 音数無制限 = 段を折り返す)。純粋。
 * 単位は「線間 = 10」の座標系。拡大は描く側の transform で行う。
 * 小節の頭に音部記号 ・ 調号 ・ 拍子を置き、段の幅を超えたら次の段へ折り返す。段の中は幅いっぱいに均す (最後の段は均さない)。
 */
import { durQl, effectiveKey, effectiveTime, type AuthorScore, type Element, type KeySig, type TimeSig } from "./model"
import { accidentalsForMeasure, diatonicIndex, type AccidentalOut } from "./pitch"

export const SP = 10                      // 線の間
export const STAFF_TOP = 60               // 段の中での第 1 線 (上) の y ・ 上に指番号 ・ 弦 ・ 記号を置く余白
export const SYSTEM_H = 170               // 段の高さ
export const LEFT_PAD = 12
const B4_DI = 4 * 7 + 6                   // 第 3 線 = B4

export type LaidHead = { y: number; di: number; acc: AccidentalOut; shift: boolean }
export type LaidElement = {
  id: string; mIdx: number; eIdx: number; el: Element
  x: number                               // 符頭の中心
  heads: LaidHead[]                       // 音の順 (低い順)
  stemUp: boolean
  onset: number                           // 小節の頭からの拍
  ql: number
  restY: number
}
export type LaidMeasure = {
  mIdx: number; no: number; sysIdx: number
  x: number; width: number                // 左の縦線から右の縦線まで
  contentX: number                        // 記号のあとの、音を置き始める x
  clef: boolean; key: KeySig | null; time: TimeSig | null
  effKey: KeySig; effTime: TimeSig
  elements: LaidElement[]
}
export type LaidSystem = { idx: number; y: number; measures: LaidMeasure[]; x0: number; x1: number }
export type Layout = { systems: LaidSystem[]; measures: LaidMeasure[]; byId: Map<string, LaidElement>; height: number; width: number }

export function yOfDi(di: number): number {
  return STAFF_TOP + 2 * SP - (di - B4_DI) * (SP / 2)
}
export function diOfY(y: number): number {
  return Math.round(B4_DI - (y - (STAFF_TOP + 2 * SP)) / (SP / 2))
}

function elWidth(e: Element, hasAcc: boolean): number {
  if (e.grace) return 18
  const ql = durQl(e.dur)
  const w = 24 + 9 * Math.max(0, Math.min(7, Math.log2(ql / 0.0625)))   // 64 分 24 → 全 87
  return w + (hasAcc ? 12 : 0) + (e.heads.length > 1 ? 6 : 0)
}

export function layoutScore(score: AuthorScore, targetWidth: number): Layout {
  const measures: LaidMeasure[] = []
  const byId = new Map<string, LaidElement>()
  // 1. 小節ごとに自然な幅と中身を出す
  let accState = new Map<string, -2 | -1 | 0 | 1 | 2>()
  let prevKey: KeySig | null = null
  let prevTime: TimeSig | null = null
  let no = score.measures[0]?.implicit ? 0 : 1
  const natural: { m: LaidMeasure; headerW: (first: boolean) => number; bodyW: number; offsets: number[] }[] = []
  score.measures.forEach((m, mIdx) => {
    const effKey = effectiveKey(score, mIdx), effTime = effectiveTime(score, mIdx)
    if (mIdx > 0 && (!prevKey || prevKey.fifths !== effKey.fifths || prevKey.mode !== effKey.mode)) accState = new Map()
    const keyShown = mIdx === 0 || !prevKey || prevKey.fifths !== effKey.fifths || prevKey.mode !== effKey.mode ? effKey : null
    const timeShown = mIdx === 0 || !prevTime || prevTime.beats !== effTime.beats || prevTime.beatType !== effTime.beatType ? effTime : null
    const { out, state } = accidentalsForMeasure(effKey, m.elements, accState)
    accState = state
    const lm: LaidMeasure = { mIdx, no: m.implicit ? 0 : no, sysIdx: 0, x: 0, width: 0, contentX: 0, clef: false, key: keyShown, time: timeShown, effKey, effTime, elements: [] }
    if (!m.implicit) no++
    let onset = 0
    const offsets: number[] = []
    let cursor = 10
    m.elements.forEach((e, eIdx) => {
      const heads: LaidHead[] = e.heads.map((h, hi) => ({ y: yOfDi(diatonicIndex(h.pitch)), di: diatonicIndex(h.pitch), acc: out.get(`${e.id}#${hi}`) ?? null, shift: false }))
      // 2 度で重なる符頭は右へずらす
      for (let i = 1; i < heads.length; i++) if (heads[i].di - heads[i - 1].di === 1 && !heads[i - 1].shift) heads[i].shift = true
      const hasAcc = heads.some((h) => h.acc)
      const w = elWidth(e, hasAcc)
      const x = cursor + (hasAcc ? 12 : 0) + 6
      const ql = durQl(e.dur)
      const avgDi = heads.length ? heads.reduce((a, h) => a + h.di, 0) / heads.length : B4_DI
      const le: LaidElement = { id: e.id, mIdx, eIdx, el: e, x, heads, stemUp: avgDi < B4_DI, onset, ql, restY: yOfDi(B4_DI) }
      lm.elements.push(le)
      byId.set(e.id, le)
      offsets.push(x)
      cursor += w
      if (!e.grace) onset += ql
    })
    const bodyW = Math.max(60, cursor + 6)
    const headerW = (first: boolean) => (first ? 34 : 0) + (lm.key || first ? 4 + 8 * Math.abs(lm.key?.fifths ?? effKey.fifths) : 0) + (lm.time ? 22 : 0) + 6
    natural.push({ m: lm, headerW, bodyW, offsets })
    measures.push(lm)
    prevKey = effKey; prevTime = effTime
  })
  // 2. 段に折り返す
  const systems: LaidSystem[] = []
  const usable = targetWidth - LEFT_PAD * 2
  let sys: LaidSystem = { idx: 0, y: 0, measures: [], x0: LEFT_PAD, x1: LEFT_PAD + usable }
  let used = 0
  const rows: { sys: LaidSystem; items: typeof natural }[] = [{ sys, items: [] }]
  for (const n of natural) {
    const first = rows[rows.length - 1].items.length === 0
    const w = n.headerW(first) + n.bodyW
    if (!first && used + w > usable) {
      sys = { idx: systems.length + 1, y: 0, measures: [], x0: LEFT_PAD, x1: LEFT_PAD + usable }
      rows.push({ sys, items: [] })
      used = 0
    }
    if (rows.length - 1 >= systems.length) systems.push(rows[rows.length - 1].sys)
    rows[rows.length - 1].items.push(n)
    used += n.headerW(rows[rows.length - 1].items.length === 1) + n.bodyW
  }
  // 3. 段ごとに位置を決め、最後の段以外は幅いっぱいに均す (伸ばすのは音の部分だけ ・ 最大 1.8 倍)
  rows.forEach((row, ri) => {
    const s = row.sys
    s.idx = ri
    s.y = ri * SYSTEM_H
    const headers = row.items.map((n, i) => n.headerW(i === 0))
    const bodies = row.items.map((n) => n.bodyW)
    const natW = headers.reduce((a, b) => a + b, 0) + bodies.reduce((a, b) => a + b, 0)
    const last = ri === rows.length - 1
    const bodySum = bodies.reduce((a, b) => a + b, 0)
    const factor = last ? 1 : Math.min(1.8, Math.max(1, (usable - headers.reduce((a, b) => a + b, 0)) / bodySum))
    let x = s.x0
    row.items.forEach((n, i) => {
      const m = n.m
      s.measures.push(m)
      m.sysIdx = ri
      m.x = x
      m.clef = i === 0
      if (i === 0 && !m.key) m.key = m.effKey   // 段の頭には必ず調号
      m.contentX = x + headers[i]
      const bw = bodies[i] * factor
      m.width = headers[i] + bw
      m.elements.forEach((le, k) => { le.x = m.contentX + n.offsets[k] * factor })
      x += m.width
    })
    if (last) s.x1 = Math.max(x, s.x0 + Math.min(usable, natW))
    else s.x1 = x
  })
  return { systems, measures, byId, height: Math.max(1, rows.length) * SYSTEM_H + 20, width: targetWidth }
}
