import type { OpenSheetMusicDisplay } from "opensheetmusicdisplay"

export type ScrollRow = {
  index: number
  yPx: number
  heightPx: number
  beats: number
  durationSec: number
  pxPerSec: number
}

export type ScrollPlan = {
  rows: ScrollRow[]
  totalHeightPx: number
  totalDurationSec: number
  isShortScore: boolean
}

export function buildScrollPlan(
  osmd: OpenSheetMusicDisplay,
  bpm: number,
  viewportHeightPx: number,
): ScrollPlan {
  if (!osmd || !osmd.GraphicSheet) {
    return { rows: [], totalHeightPx: 0, totalDurationSec: 0, isShortScore: true }
  }

  const allSystems: Array<{ yOsmd: number; beats: number }> = []

  for (const page of osmd.GraphicSheet.MusicPages) {
    for (const system of page.MusicSystems) {
      const yOsmd = system.PositionAndShape.AbsolutePosition.y
      let beats = 0
      // GraphicalMeasures は実装によって measure[]] (1次元) と measure[][] (パートごとの2次元) があるため両対応
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const measuresRaw = system.GraphicalMeasures as any[]
      const measures = Array.isArray(measuresRaw[0]) ? measuresRaw.flat() : measuresRaw
      for (const measure of measures) {
        const dur = measure?.parentSourceMeasure?.Duration
        if (dur) {
          beats += dur.RealValue * 4
        }
      }
      allSystems.push({ yOsmd, beats })
    }
  }

  if (allSystems.length === 0) {
    return { rows: [], totalHeightPx: 0, totalDurationSec: 0, isShortScore: true }
  }

  const zoom = osmd.zoom ?? 1.0
  const OSMD_UNIT_TO_PX = 10.0 * zoom

  // 最終行の高さは「直前の行の高さ」を使う (次行が無いため)
  const lastSystemYPx = allSystems[allSystems.length - 1].yOsmd * OSMD_UNIT_TO_PX
  let lastRowHeightPx: number
  if (allSystems.length >= 2) {
    const prevSystemYPx = allSystems[allSystems.length - 2].yOsmd * OSMD_UNIT_TO_PX
    lastRowHeightPx = lastSystemYPx - prevSystemYPx
  } else {
    lastRowHeightPx = viewportHeightPx * 0.5
  }
  const totalHeightPx = lastSystemYPx + lastRowHeightPx

  const rows: ScrollRow[] = allSystems.map((sys, i) => {
    const yPx = sys.yOsmd * OSMD_UNIT_TO_PX
    const nextYPx =
      i + 1 < allSystems.length ? allSystems[i + 1].yOsmd * OSMD_UNIT_TO_PX : totalHeightPx
    const heightPx = nextYPx - yPx
    const safeBeats = sys.beats > 0 ? sys.beats : 4
    const safeBpm = bpm > 0 ? bpm : 60
    const durationSec = (safeBeats * 60) / safeBpm
    const pxPerSec = heightPx / durationSec

    return { index: i, yPx, heightPx, beats: safeBeats, durationSec, pxPerSec }
  })

  const totalDurationSec = rows.reduce((sum, r) => sum + r.durationSec, 0)
  const isShortScore = totalHeightPx <= viewportHeightPx

  return { rows, totalHeightPx, totalDurationSec, isShortScore }
}

export function locateInPlan(
  plan: ScrollPlan,
  elapsedSec: number,
): { rowIndex: number; rowProgress: number; scrollTopPx: number } | null {
  if (plan.rows.length === 0) return null

  let cumulative = 0
  for (const row of plan.rows) {
    if (elapsedSec < cumulative + row.durationSec) {
      const rowProgress = (elapsedSec - cumulative) / row.durationSec
      const scrollTopPx = row.yPx + row.heightPx * rowProgress
      return { rowIndex: row.index, rowProgress, scrollTopPx }
    }
    cumulative += row.durationSec
  }

  const last = plan.rows[plan.rows.length - 1]
  return { rowIndex: last.index, rowProgress: 1.0, scrollTopPx: last.yPx + last.heightPx }
}
