"use client"

// ============================================================
// 達成コインの獲得モーション 案A「ホーム帰着で1回だけ」(2026-08-30 Tetsuo確定)。
// タイムラインの正 = coin-motions.html モック:
//   0.4s リング2/3→満了(1.0s ease-out) → 1.6s リング中心にコイン出現(0.45s
//   スケール+720度スピン) → 2.5s マイランクカードへ飛翔(0.8s 縮小吸い込み・
//   飛翔と同時に自動スクロール) → 3.2s カード金フラッシュ+ゲージ+1。
// 確定事項: 対象曲が「いま練習している曲」タブに無ければ演出なし(ゲージのみ)/
//   複数同時は最大2枚・2枚目はリング省略(画面中央出現)/ 画面タップでスキップ/
//   消化は演出開始時点(DB)・reduced-motionは演出なしで即時反映 / 無音。
// リングは実物 ([data-guide="home-ring"] の conic-gradient) を rAF で満了させる
// (RingComplete.tsx と同方式)。演出中の2/3表示は home.tsx が達成前ステータスを
// 合成して PracticeFocusCard に渡す (データは触らない)。
// ============================================================

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Coin from "@/app/components/Coin"
import { markCoinsCelebrated } from "@/app/actions/coinCelebration"

/** trigger = 最後にそろった達成条件 (2026-08-30 Tetsuo指定: その行を巻き戻して✓を打つ) */
export type CoinTrigger = "run" | "lesson" | "etude"
export type CoinQueueItem = { scoreId: string; star: number; trigger?: CoinTrigger }

/** home.tsx へ返す表示調整。rankHold=まだ着地していないコイン数 (ゲージから一時控除) */
export type CoinFx = {
  rankHold: number
  focus: { scoreId: string; rewind: boolean; trigger: CoinTrigger } | null
  flashAt: number
}
export const COIN_FX_IDLE: CoinFx = { rankHold: 0, focus: null, flashAt: 0 }

const COIN_SIZE = 56

function sleep(ms: number, cancelled: { current: boolean }): Promise<void> {
  return new Promise((res) => {
    const t = setInterval(() => {
      if (cancelled.current) { clearInterval(t); res() }
    }, 50)
    setTimeout(() => { clearInterval(t); res() }, ms)
  })
}

/** 縦スクロールする祖先 (アプリ殻は main が担うことがある)。無ければ window 相当 */
function scrollerOf(el: HTMLElement): HTMLElement | Window {
  let p = el.parentElement
  while (p) {
    const s = getComputedStyle(p)
    if (/(auto|scroll)/.test(s.overflowY) && p.scrollHeight > p.clientHeight + 2) return p
    p = p.parentElement
  }
  return window
}
const scrollTopOf = (sc: HTMLElement | Window) =>
  sc instanceof Window ? (document.scrollingElement?.scrollTop ?? 0) : sc.scrollTop
const scrollToY = (sc: HTMLElement | Window, y: number) => {
  if (sc instanceof Window) window.scrollTo(0, y)
  else sc.scrollTop = y
}

const TRIGGER_ROW_NAME: Record<CoinTrigger, string> = {
  run: "通して弾く",
  lesson: "学びレッスン",
  etude: "エチュード",
}

/** リング満了と同時に、最後にそろった条件の行を✓に・チップを「達成」へ (2026-08-30 Tetsuo指定:
 *  達成宣言はリング満了の瞬間。カウンタ満了と行未チェックが矛盾したまま
 *  コインが出る詰め漏れの修正。GoalDot done=true / 達成チップと同じ見た目を実DOMに反映) */
export function markGoalRowDone(ring: HTMLElement, trigger: CoinTrigger) {
  const card = ring.closest<HTMLElement>('[data-guide="home-focus-card"]') ?? document
  const items = card.querySelector('[data-anim="items"]')
  const findRow = (name: string) => (items ? Array.from(items.children).flatMap((el) => {
    // 学びレッスン/エチュード行は home-ring-rows 配下・行がリンクのこともある
    const own = el.textContent?.includes(name) ? [el] : []
    return el.getAttribute("data-guide") === "home-ring-rows"
      ? Array.from(el.children).filter((c) => c.textContent?.includes(name))
      : own
  })[0] : null)
  // その曲に trigger の行が無いときは通しに倒す (PracticeFocusCard の巻き戻しと同じフォールバック)
  const row = findRow(TRIGGER_ROW_NAME[trigger]) ?? findRow(TRIGGER_ROW_NAME.run)
  if (row) {
    const circle = row.firstElementChild as HTMLElement | null
    if (circle && circle.tagName === "SPAN") {
      circle.outerHTML =
        '<span style="width:20px;height:20px;flex:none;border-radius:50%;display:grid;place-items:center;background:rgba(232,178,60,.16)">' +
        '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M20 6L9 17l-5-5" stroke="#e8b23c"></path></svg></span>'
    }
    const name = row.querySelector("b")
    if (name) name.style.color = "var(--text-ink)"
    const st = row.lastElementChild as HTMLElement | null
    if (st && st.tagName === "SPAN") {
      st.textContent = "✓"
      st.style.color = "var(--gold)"
    }
  }
  for (const s of Array.from(card.querySelectorAll<HTMLElement>('[data-guide="home-current-song"] span'))) {
    if (s.textContent === "挑戦中") { s.textContent = "達成"; break }
  }
}

export default function CoinCelebration({
  flying,
  currentStar,
  demo,
  onFx,
  onDone,
}: {
  /** 演出対象 (タブに居る曲のみ・最大2枚)。home.tsx が選定済み */
  flying: CoinQueueItem[]
  /** マイランクの現在★。ゲージ控除(rankHold)は同★のコインだけが対象 */
  currentStar: number
  /** devハーネス: DB消化をしない */
  demo?: boolean
  onFx: (fx: CoinFx) => void
  /** コイン工程の終了通知 (宝物オーケストレーターの直列起動用・2026-08-30) */
  onDone?: () => void
}) {
  const [mounted, setMounted] = useState(false)
  const [done, setDone] = useState(false)
  const [coinPos, setCoinPos] = useState<{ x: number; y: number; key: number } | null>(null)
  const coinRef = useRef<HTMLDivElement | null>(null)
  const cancelled = useRef(false)
  const anims = useRef<Animation[]>([])
  const rafs = useRef<number[]>([])
  const onFxRef = useRef(onFx)
  onFxRef.current = onFx
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!mounted) return
    let alive = true
    // 消化は演出開始時点 (Q17)。飛ばない分・reduced-motion もここでまとめて消化
    if (!demo) void markCoinsCelebrated()

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduced || flying.length === 0) {
      onFxRef.current(COIN_FX_IDLE)
      setDone(true); onDoneRef.current?.()
      return
    }

    const finish = () => {
      cancelled.current = true
      for (const a of anims.current) { try { a.cancel() } catch { /* 停止済みは無視 */ } }
      for (const r of rafs.current) cancelAnimationFrame(r)
      onFxRef.current(COIN_FX_IDLE)
      setCoinPos(null)
      setDone(true); onDoneRef.current?.()
    }
    ;(window as unknown as Record<string, unknown>).__coinSkip = finish

    const waitForRing = async (): Promise<HTMLElement | null> => {
      for (let waited = 0; waited < 8000; waited += 150) {
        if (cancelled.current) return null
        const rings = document.querySelectorAll<HTMLElement>('[data-guide="home-ring"]')
        if (rings.length) return rings[rings.length - 1]
        await sleep(150, cancelled)
      }
      return null
    }

    /** リングを rAF で満了させる (RingComplete と同方式・1.0s ease-out) */
    const fillRing = (ring: HTMLElement): Promise<void> =>
      new Promise((res) => {
        const from = parseFloat(ring.style.getPropertyValue("--p")) || 66.7
        const t0 = performance.now()
        const DUR = 1000
        const tick = (t: number) => {
          if (cancelled.current) return res()
          const k = Math.min(1, (t - t0) / DUR)
          const eased = 1 - (1 - k) * (1 - k)
          const p = from + (100 - from) * eased
          ring.style.setProperty("--p", `${p}%`)
          ring.style.background = `conic-gradient(var(--gold) ${p}%, rgba(150,175,225,.14) 0)`
          if (k < 1) { rafs.current.push(requestAnimationFrame(tick)) } else {
            // 中央カウンタを 満了 (例 3/3) へ。分母は表示中の "/n" から読む
            const b = ring.querySelector("b")
            const denom = b?.querySelector("span")?.textContent?.replace("/", "")
            if (b && denom) {
              b.innerHTML = `${denom}<span style="font-size:12px;font-weight:800;color:var(--text-sub);text-shadow:none">/${denom}</span>`
            }
            // 満了と同時に達成の姿へ: 最後の条件行✓ + チップ「達成」(2026-08-30 Tetsuo指定)
            markGoalRowDone(ring, flying[0]?.trigger ?? "run")
            res()
          }
        }
        rafs.current.push(requestAnimationFrame(tick))
      })

    /** コイン出現 (0.45s 720度スピン) → 900ms 後に飛翔 (0.8s) + 自動スクロール → 着地fx */
    const popAndFly = async (start: { x: number; y: number }, holdAfter: number) => {
      setCoinPos({ ...start, key: Date.now() })
      // React の描画を待って WAAPI を当てる
      await sleep(30, cancelled)
      const el = coinRef.current
      if (!el || cancelled.current) return
      const pop = el.animate(
        [
          { transform: "scale(0) rotateY(0deg)", opacity: 0 },
          { transform: "scale(1.14) rotateY(600deg)", opacity: 1, offset: 0.6 },
          { transform: "scale(1) rotateY(720deg)", opacity: 1 },
        ],
        { duration: 450, easing: "cubic-bezier(.2,1.6,.4,1)", fill: "forwards" },
      )
      anims.current.push(pop)
      await sleep(900, cancelled)
      if (cancelled.current) return

      // 飛翔先 = マイランクカード。スクロール後の見え位置を先に決めてから同時に動かす
      const card = document.querySelector<HTMLElement>('[data-guide="home-rank-card"]')
      let dx = 0
      let dy = -Math.min(320, start.y)
      if (card) {
        const sc = scrollerOf(card)
        const rect = card.getBoundingClientRect()
        const desiredTop = Math.round(window.innerHeight * 0.16)
        const s0 = scrollTopOf(sc)
        const maxDown = sc instanceof Window
          ? Math.max(0, (document.scrollingElement?.scrollHeight ?? 0) - window.innerHeight - s0)
          : Math.max(0, sc.scrollHeight - sc.clientHeight - s0)
        // 正=下へ / 負=上へ。スクロール可能範囲でクランプ
        const scrollDelta = Math.max(-s0, Math.min(rect.top - desiredTop, maxDown))
        const endX = rect.left + rect.width * 0.5
        const endY = rect.top - scrollDelta + rect.height * 0.78
        dx = endX - start.x
        dy = endY - start.y
        // スクロール (0.8s easeInOut) を飛翔と同時に
        const t0 = performance.now()
        const scrollTick = (t: number) => {
          if (cancelled.current) return
          const k = Math.min(1, (t - t0) / 800)
          const eased = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2
          scrollToY(sc, s0 + scrollDelta * eased)
          if (k < 1) rafs.current.push(requestAnimationFrame(scrollTick))
        }
        rafs.current.push(requestAnimationFrame(scrollTick))
      }
      const fly = el.animate(
        [
          { transform: "translate(0px, 0px) scale(1) rotateY(720deg)", opacity: 1, offset: 0 },
          { opacity: 1, offset: 0.7 },
          { transform: `translate(${dx}px, ${dy}px) scale(.34) rotateY(720deg)`, opacity: 0, offset: 1 },
        ],
        { duration: 800, easing: "cubic-bezier(.5,-.1,.4,1)", fill: "forwards" },
      )
      anims.current.push(fly)
      // 3.2s 相当 (飛翔開始+0.7s) で着地fx: ゲージ+1 + 金フラッシュ
      await sleep(700, cancelled)
      if (cancelled.current) return
      onFxRef.current({ rankHold: holdAfter, focus: null, flashAt: Date.now() })
      await sleep(150, cancelled)
      setCoinPos(null)
    }

    const run = async () => {
      // ゲージから一時控除するのは現在★と同じコインだけ (★違いは数字が動かないため)
      let hold = flying.filter((c) => c.star === currentStar).length
      // ── 1枚目: タブ切替+リング巻き戻し → 満了 → コイン → 飛翔 ──
      const first = flying[0]
      onFxRef.current({ rankHold: hold, focus: { scoreId: first.scoreId, rewind: true, trigger: first.trigger ?? "run" }, flashAt: 0 })
      const ring = await waitForRing()
      if (cancelled.current || !alive) return
      if (ring) {
        ring.scrollIntoView({ behavior: "smooth", block: "center" })
        await sleep(500, cancelled)
        if (cancelled.current) return
        await fillRing(ring)
        await sleep(150, cancelled)
        if (cancelled.current) return
        if (first.star === currentStar) hold -= 1
        const r = ring.getBoundingClientRect()
        await popAndFly({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, hold)
      } else {
        // リングが見つからないときは中央出現に切替 (演出は止めない)
        if (first.star === currentStar) hold -= 1
        await popAndFly({ x: window.innerWidth / 2, y: window.innerHeight * 0.38 }, hold)
      }
      if (cancelled.current) return

      // ── 2枚目 (あれば): リング省略・画面中央に出現 → 飛翔 ──
      if (flying.length > 1) {
        await sleep(350, cancelled)
        if (cancelled.current) return
        if (flying[1].star === currentStar) hold -= 1
        await popAndFly({ x: window.innerWidth / 2, y: window.innerHeight * 0.38 }, hold)
        if (cancelled.current) return
      }
      onFxRef.current(COIN_FX_IDLE)
      setDone(true); onDoneRef.current?.()
    }
    void run()

    return () => {
      alive = false
      cancelled.current = true
      for (const a of anims.current) { try { a.cancel() } catch { /* 停止済みは無視 */ } }
      for (const r of rafs.current) cancelAnimationFrame(r)
      delete (window as unknown as Record<string, unknown>).__coinSkip
    }
    // 演出はマウント時に一度だけ流す (flyingは初回値で固定)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted])

  if (!mounted || done) return null

  return createPortal(
    <div
      onClick={() => (window as unknown as { __coinSkip?: () => void }).__coinSkip?.()}
      aria-hidden
      style={{ position: "fixed", inset: 0, zIndex: 940, background: "transparent", cursor: "default" }}
    >
      {coinPos && (
        <div
          key={coinPos.key}
          ref={coinRef}
          style={{
            position: "fixed",
            left: coinPos.x - COIN_SIZE / 2,
            top: coinPos.y - COIN_SIZE / 2,
            width: COIN_SIZE,
            height: COIN_SIZE,
            opacity: 0,
            willChange: "transform, opacity",
          }}
        >
          <Coin size={COIN_SIZE} />
        </div>
      )}
    </div>,
    document.body,
  )
}
