"use client"

// ============================================================
// 「アルコと最初の1周」ガイド層 (2026-08-29 土台・未接続)
// 見た目の正 = docs/mocks/first-loop-guide/。実装完了時に誤差ゼロ突き合わせ。
//
// 責務: 暗幕+金の光(次に押す場所)+灰枠(いま見る場所)+道しるべバー+
//       現在地チップ+スキップ+タップ波紋 の描画のみ。
// 進行の状態機械 (どのステップか・保存・イベント購読) は呼び出し側が持つ。
// 対象要素は実画面側の data-guide="<名前>" で指す (guideFlow.ts の spot 名)。
//
// 【Tetsuo徹底事項 2026-08-29】
//  1. 暗幕・光・灰枠は pointer-events:none。タップは常に下の実画面へ素通し。
//     操作を受けるのはバー内ボタンとガイドカードのボタンだけ。
//  2. ガイド終了 (step=null) で DOM からアンマウント。透明カバーが残って
//     タップを妨害する事故を構造的に不可能にする (GuideOverlay.dom.test で担保)。
//  3. 表示データはすべて本物 (デモ表示→戻す処理は存在しない)。
//  4. バーはビューポート下端固定 (タブバーの上)。光の対象が画面下部のときは
//     上部へ退避。録音中・全画面中は層ごと非表示 (CSS)。
// ============================================================

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { ArcoChan, POSES } from "@/app/components/ArcoChan"
import { GUIDE_PHASES, type GuideStep } from "./guideFlow"
import styles from "./guide.module.css"

type Rect = { left: number; top: number; width: number; height: number }

function findTarget(name: string | undefined): HTMLElement | null {
  if (!name) return null
  // 同名が複数あるとき (指板の拡大モーダル内の複製など) は後勝ち = 最前面の方を指す
  const all = document.querySelectorAll<HTMLElement>(`[data-guide="${name}"]`)
  return all.length ? all[all.length - 1] : null
}

// 対象のスクロールコンテナ (overflow-y が auto/scroll の最近傍祖先)。null=ページ全体 (window)
function scrollParentOf(el: HTMLElement | null): HTMLElement | null {
  let node: HTMLElement | null = el?.parentElement ?? null
  while (node && node !== document.body) {
    const oy = getComputedStyle(node).overflowY
    if (oy === "auto" || oy === "scroll") return node
    node = node.parentElement
  }
  return null
}

// 固定配置 (タブバー等) はスクロールで中央に寄せられない → その場合のみバーを上へ退避。
// チュートリアル層 (それ自体が fixed のスクロールコンテナ) の中身は固定扱いにしない
function isFixed(el: HTMLElement | null): boolean {
  const boundary = scrollParentOf(el) ?? document.body
  let node: HTMLElement | null = el
  while (node && node !== boundary) {
    const pos = getComputedStyle(node).position
    if (pos === "fixed" || pos === "sticky") return true
    node = node.parentElement
  }
  return false
}

function rectOf(el: HTMLElement | null): Rect | null {
  if (!el) return null
  const r = el.getBoundingClientRect()
  if (r.width === 0 || r.height === 0) return null
  // 光は要素より少し外側に (モックの見え方に合わせる)。
  // 全幅要素などで枠が画面外へはみ出て見切れないよう、ビューポート内へクランプする (2026-08-29)
  const pad = 4
  const m = 3
  const left = Math.max(m, r.left - pad)
  const top = Math.max(m, r.top - pad)
  const right = Math.min(window.innerWidth - m, r.right + pad)
  const bottom = Math.min(window.innerHeight - m, r.bottom + pad)
  return { left, top, width: right - left, height: bottom - top }
}

export default function GuideOverlay({
  step,
  onSkip,
  onContinue,
  children,
}: {
  /** 現在のステップ。null でガイド層ごと非表示 */
  step: GuideStep | null
  onSkip: () => void
  /** 説明ステップ (advance: chip) の「つづける」。呼び出し側が次ステップへ進める */
  onContinue?: () => void
  /** ガイドカード (作法・達成カード等)。ステップに応じて呼び出し側が渡す */
  children?: ReactNode
}) {
  const [spotRect, setSpotRect] = useState<Rect | null>(null)
  const [spot2Rect, setSpot2Rect] = useState<Rect | null>(null)
  const [barOnTop, setBarOnTop] = useState(false)
  const rippleHost = useRef<HTMLDivElement | null>(null)

  // 対象要素の追跡。スクロール・リサイズ・DOM変化で測り直す
  useEffect(() => {
    if (!step) { setSpotRect(null); setSpot2Rect(null); return }
    // ガイド中は下部にスクロール余白を足す: ページ末尾近くの対象でも
    // 「バーを除いた可視領域の中央」まで画面をスライドできるようにする (2026-08-29)。
    // 対象のスクロールコンテナ (チュートリアル層 or ページ) に対して足し、終了時に戻す
    let padded: HTMLElement | null = null
    let prevPad = ""
    const ensureHeadroom = (el: HTMLElement | null) => {
      const target = el ?? document.body
      if (padded === target) return
      if (padded) padded.style.paddingBottom = prevPad
      padded = target
      prevPad = target.style.paddingBottom
      target.style.paddingBottom = "45vh"
    }
    let raf = 0
    const measure = () => {
      const el = findTarget(step.spot)
      const el2 = findTarget(step.spot2)
      const r = rectOf(el)
      const r2 = rectOf(el2)
      setSpotRect(r)
      setSpot2Rect(r2)
      // バーは常に最下部 (2026-08-29 Tetsuo指定)。対象は自動スクロールで中央へ寄せるため
      // 退避が必要なのは、スクロールで動かせない固定要素 (タブバー等) が下部にあるときだけ
      const anchor = r ?? r2
      const anchorEl = r ? el : el2
      setBarOnTop(!!anchor && isFixed(anchorEl) && anchor.top + anchor.height > window.innerHeight * 0.62)
    }
    const onMove = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure) }
    measure()
    // ステップ開始時、対象が「バーを除いた可視領域」の中央に来るよう自動スクロール
    // (2026-08-29 Tetsuo指定: バーは動かさず、画面位置をスライドして調整する)
    const recenter = () => {
      // 金枠と灰枠の両方があるときは、2つを合わせた範囲の中心を寄せる (両方見せる)
      const els = [findTarget(step.spot), findTarget(step.spot2)].filter((e): e is HTMLElement => !!e && !isFixed(e))
      if (els.length === 0) return
      const sp = scrollParentOf(els[0])
      ensureHeadroom(sp)
      const BAR_ZONE = 130
      const visibleH = window.innerHeight - BAR_ZONE
      const rs = els.map((e) => e.getBoundingClientRect())
      const top = Math.min(...rs.map((r) => r.top))
      const bottom = Math.max(...rs.map((r) => r.bottom))
      const delta = (top + bottom) / 2 - visibleH / 2
      const scroller: { scrollBy: (o: ScrollToOptions) => void } = sp ?? window
      try { scroller.scrollBy({ top: delta, behavior: "smooth" }) } catch { (sp ?? window).scrollBy(0, delta) }
    }
    // 描画直後と、非同期コンテンツ (achievement等) が入ってレイアウトが確定した後の2回寄せる
    const intoView = setTimeout(recenter, 250)
    const intoView2 = setTimeout(recenter, 1000)
    // 描画直後は対象がまだ無いことがある (譜面の読み込み等)。しばらく再測定
    const warm = setInterval(measure, 400)
    const warmStop = setTimeout(() => clearInterval(warm), 6000)
    window.addEventListener("scroll", onMove, { capture: true, passive: true })
    window.addEventListener("resize", onMove)
    return () => {
      if (padded) padded.style.paddingBottom = prevPad
      clearInterval(warm); clearTimeout(warmStop); clearTimeout(intoView); clearTimeout(intoView2); cancelAnimationFrame(raf)
      window.removeEventListener("scroll", onMove, { capture: true })
      window.removeEventListener("resize", onMove)
    }
  }, [step])

  // タップ波紋: spot 対象がタップされた瞬間に出す (進行は実要素のイベントに任せる)
  const spawnRipple = useCallback((x: number, y: number) => {
    const host = rippleHost.current
    if (!host) return
    const el = document.createElement("span")
    el.className = styles.ripple
    el.style.left = `${x}px`
    el.style.top = `${y}px`
    host.appendChild(el)
    window.setTimeout(() => el.remove(), 600)
  }, [])
  useEffect(() => {
    if (!step?.spot) return
    const target = findTarget(step.spot)
    if (!target) return
    const onDown = (e: PointerEvent) => spawnRipple(e.clientX, e.clientY)
    target.addEventListener("pointerdown", onDown)
    return () => target.removeEventListener("pointerdown", onDown)
  }, [step, spawnRipple])

  // body 直下へポータル描画 (2026-08-29): 実画面側のモーダル (演奏の軌跡シート等が
  // body にポータルされ z-index 1000 帯) より確実に上へ。祖先のスタッキング文脈に
  // 巻き込まれてバーが暗幕の下に潜る事故を構造的に防ぐ
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!step || !mounted) return null
  const pose = POSES.find((p) => p.id === step.pose) ?? POSES[0]

  return createPortal(
    <div ref={rippleHost} className={styles.layer} data-guide-overlay>
      {step.dim !== false && <div className={`${styles.dimmer} ${styles.dimmerOn}`} aria-hidden />}
      {spotRect && (
        <div
          className={styles.spot}
          style={{ left: spotRect.left, top: spotRect.top, width: spotRect.width, height: spotRect.height }}
          aria-hidden
        />
      )}
      {spot2Rect && (
        <div
          className={styles.spot2}
          style={{ left: spot2Rect.left, top: spot2Rect.top, width: spot2Rect.width, height: spot2Rect.height }}
          aria-hidden
        />
      )}
      <div className={styles.whereChip}>{step.where}</div>
      <button type="button" className={styles.skip} onClick={onSkip}>スキップ</button>
      {children}
      {step.text !== "" && <div
        className={`${styles.shirube} ${step.barPos === "high" ? styles.shirubeHigh : barOnTop ? styles.shirubeTop : ""}`}
        role="status"
      >
        <div className={styles.arco}><ArcoChan pose={pose} /></div>
        <div className={styles.body}>
          <div className={styles.text}>{step.text}</div>
          <div className={styles.pips} aria-hidden>
            {Array.from({ length: GUIDE_PHASES }, (_, i) => (
              <i key={i} className={i < step.phase ? styles.pipOn : i === step.phase ? styles.pipNow : ""} />
            ))}
          </div>
        </div>
        {step.advance.type === "chip" && (
          <button type="button" className={styles.advChip} onClick={onContinue}>つづける</button>
        )}
      </div>}
    </div>,
    document.body,
  )
}
