/**
 * 録音中のテンポガイドの引っかかりを、実機で数字として取るための計測。
 *
 * 2026-08-26 新設。横画面録音で「青線が止まって飛ぶ」が報告されているが、
 * 開発機からは実機のフレーム落ちを測れず、直しても効果を数字で示せなかった。
 * 推測で修正を重ねないための一時装備 (先例: 演出の ?rvdebug=1)。
 *
 * 計測するだけで、挙動には一切影響しない。原因が確定したら削除する。
 */

export type RecDiag = {
  /** ガイド開始からの総フレーム数 */
  frames: number
  /** フレーム間隔の最大 (ms)。画面が固まった最長時間 */
  maxGapMs: number
  /** 100ms を超えた間隔の回数 = 目に見える引っかかりの回数 */
  jankCount: number
  /** 100ms 超が起きた時刻 (ガイド開始からの秒)。最大8件 */
  jankAtSec: number[]
  /** updateRecordingCursor が「位置を据え置く」分岐に入った累計フレーム数 */
  holdFrames: number
  /** その連続回数の最大 */
  maxHoldRun: number
  /** 録音中(カウントダウン含む)に OSMD の再描画が走った回数 */
  renders: number
  /** どこで・いつ再描画したか。"band@12.3s" 形式。準備中は "@準備" (2026-08-28 追加)。
      ガイドが回り始めたあとの再描画だけが「録音中に組み直した」= 直すべきもの。 */
  renderLog: string[]
  /** カウントインのクリック4発の実測間隔 (ms)。理想は 60000/bpm で一定 */
  clickGapsMs: number[]
  /** 理想の間隔 (ms) */
  clickIdealMs: number
  // ▼ 2026-08-28 追加: 横スクロールそのものを測る。
  // ガイドのフレームが滑らかでも、譜面の流れが「止まって飛ぶ」ことがあるため。
  /** 1フレームでのスクロール移動量の最大 (px)。大きいほど「飛んだ」 */
  maxScrollJumpPx: number
  /** 移動量が 0 だったフレーム数 = 流れが止まっていた時間 */
  scrollStallFrames: number
  /** その連続回数の最大 */
  maxScrollStallRun: number
  /** スクロールを測ったフレーム数 */
  scrollFrames: number
}

const empty = (): RecDiag => ({
  frames: 0, maxGapMs: 0, jankCount: 0, jankAtSec: [],
  holdFrames: 0, maxHoldRun: 0, renders: 0, renderLog: [], clickGapsMs: [], clickIdealMs: 0,
  maxScrollJumpPx: 0, scrollStallFrames: 0, maxScrollStallRun: 0, scrollFrames: 0,
})

let cur: RecDiag = empty()
let lastFrameAt = 0
let startAt = 0
let holdRun = 0
let lastClickAt = 0
let lastScrollLeft = -1
let scrollStallRun = 0

/** 録音ボタンを押した時点で呼ぶ。すべてリセット */
export function diagReset(idealClickMs: number): void {
  cur = empty()
  cur.clickIdealMs = Math.round(idealClickMs)
  lastFrameAt = 0
  startAt = 0
  holdRun = 0
  lastClickAt = 0
  lastScrollLeft = -1
  scrollStallRun = 0
}

/** 帯モードの横スクロールを毎フレーム呼ぶ。止まり/飛びを数字にする */
export function diagScroll(scrollLeft: number): void {
  cur.scrollFrames++
  if (lastScrollLeft >= 0) {
    const d = Math.abs(scrollLeft - lastScrollLeft)
    if (d > cur.maxScrollJumpPx) cur.maxScrollJumpPx = Math.round(d)
    if (d < 0.5) {
      cur.scrollStallFrames++
      scrollStallRun++
      if (scrollStallRun > cur.maxScrollStallRun) cur.maxScrollStallRun = scrollStallRun
    } else {
      scrollStallRun = 0
    }
  }
  lastScrollLeft = scrollLeft
}

/** カウントインのクリックを鳴らした瞬間に呼ぶ */
export function diagClick(now: number): void {
  if (lastClickAt > 0) cur.clickGapsMs.push(Math.round(now - lastClickAt))
  lastClickAt = now
}

/** ガイドの rAF が回り始めた瞬間に呼ぶ */
export function diagGuideStart(now: number): void {
  startAt = now
  lastFrameAt = now
}

/** ガイドの rAF 1フレームごとに呼ぶ */
export function diagFrame(now: number): void {
  cur.frames++
  if (lastFrameAt > 0) {
    const gap = now - lastFrameAt
    if (gap > cur.maxGapMs) cur.maxGapMs = Math.round(gap)
    if (gap > 100) {
      cur.jankCount++
      if (cur.jankAtSec.length < 8) {
        cur.jankAtSec.push(Math.round(((now - startAt) / 1000) * 10) / 10)
      }
    }
  }
  lastFrameAt = now
}

/** カーソルが「据え置き」の分岐に入ったフレームで呼ぶ。動いたフレームでは diagMoved */
export function diagHold(): void {
  cur.holdFrames++
  holdRun++
  if (holdRun > cur.maxHoldRun) cur.maxHoldRun = holdRun
}

export function diagMoved(): void {
  holdRun = 0
}

/** OSMD が再描画されたときに呼ぶ。tag は呼び出し箇所 (load / band / resize)。
    ガイド開始前 (帯モードの組み立て) は "@準備" として区別する。
    ここが "@12.3s" のように秒つきで出たら、録音の最中に組み直している。 */
export function diagRender(tag: string): void {
  cur.renders++
  if (cur.renderLog.length >= 10) return
  const at = startAt > 0 ? `@${Math.round(((performance.now() - startAt) / 1000) * 10) / 10}s` : "@準備"
  cur.renderLog.push(`${tag}${at}`)
}

export function diagRead(): RecDiag {
  return cur
}

/** 録音後の確認画面に出す1行。数字が出なければ計測できていない */
export function diagSummary(): string | null {
  if (cur.frames === 0) return null
  const clicks = cur.clickGapsMs.length
    ? cur.clickGapsMs.join("/") + `ms (理想${cur.clickIdealMs})`
    : "-"
  const at = cur.jankAtSec.length ? ` @${cur.jankAtSec.join(",")}s` : ""
  return [
    `最大停止 ${cur.maxGapMs}ms`,
    `引っかかり ${cur.jankCount}回${at}`,
    `据え置き ${cur.holdFrames}F (連続最大${cur.maxHoldRun})`,
    `再描画 ${cur.renders}回${cur.renderLog.length ? ` [${cur.renderLog.join(" ")}]` : ""}`,
    `クリック間隔 ${clicks}`,
    cur.scrollFrames > 0
      ? `横スクロール ${cur.scrollFrames}F 最大跳び ${cur.maxScrollJumpPx}px 停止 ${cur.scrollStallFrames}F (連続最大${cur.maxScrollStallRun})`
      : "横スクロール 未計測",
  ].join(" ・ ")
}
