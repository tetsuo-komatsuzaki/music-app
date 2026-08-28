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
import { ArcoChan, POSES } from "@/app/components/ArcoChan"
import { GUIDE_PHASES, type GuideStep } from "./guideFlow"
import styles from "./guide.module.css"

type Rect = { left: number; top: number; width: number; height: number }

function findTarget(name: string | undefined): HTMLElement | null {
  if (!name) return null
  return document.querySelector<HTMLElement>(`[data-guide="${name}"]`)
}

function rectOf(el: HTMLElement | null): Rect | null {
  if (!el) return null
  const r = el.getBoundingClientRect()
  if (r.width === 0 || r.height === 0) return null
  // 光は要素より少し外側に (モックの見え方に合わせる)
  const pad = 4
  return { left: r.left - pad, top: r.top - pad, width: r.width + pad * 2, height: r.height + pad * 2 }
}

export default function GuideOverlay({
  step,
  onSkip,
  children,
}: {
  /** 現在のステップ。null でガイド層ごと非表示 */
  step: GuideStep | null
  onSkip: () => void
  /** ガイドカード (作法・ごほうび等)。ステップに応じて呼び出し側が渡す */
  children?: ReactNode
}) {
  const [spotRect, setSpotRect] = useState<Rect | null>(null)
  const [spot2Rect, setSpot2Rect] = useState<Rect | null>(null)
  const [barOnTop, setBarOnTop] = useState(false)
  const rippleHost = useRef<HTMLDivElement | null>(null)

  // 対象要素の追跡。スクロール・リサイズ・DOM変化で測り直す
  useEffect(() => {
    if (!step) { setSpotRect(null); setSpot2Rect(null); return }
    let raf = 0
    const measure = () => {
      const r = rectOf(findTarget(step.spot))
      setSpotRect(r)
      setSpot2Rect(rectOf(findTarget(step.spot2)))
      // 光の対象が画面下部 (タブバー等) ならバーを上へ退避して対象を隠さない
      setBarOnTop(!!r && r.top + r.height > window.innerHeight * 0.62)
    }
    const onMove = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure) }
    measure()
    // ステップ開始時、対象を画面内へ寄せる (バーは固定のまま・光は要素に追従)
    const intoView = setTimeout(() => {
      const el = findTarget(step.spot)
      try { el?.scrollIntoView({ block: "center", behavior: "smooth" }) } catch { /* noop */ }
    }, 250)
    // 描画直後は対象がまだ無いことがある (譜面の読み込み等)。しばらく再測定
    const warm = setInterval(measure, 400)
    const warmStop = setTimeout(() => clearInterval(warm), 6000)
    window.addEventListener("scroll", onMove, { capture: true, passive: true })
    window.addEventListener("resize", onMove)
    return () => {
      clearInterval(warm); clearTimeout(warmStop); clearTimeout(intoView); cancelAnimationFrame(raf)
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

  if (!step) return null
  const pose = POSES.find((p) => p.id === step.pose) ?? POSES[0]

  return (
    <div ref={rippleHost} className={styles.layer} data-guide-overlay>
      <div className={`${styles.dimmer} ${styles.dimmerOn}`} aria-hidden />
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
      <div className={`${styles.shirube} ${barOnTop ? styles.shirubeTop : ""}`} role="status">
        <div className={styles.arco}><ArcoChan pose={pose} /></div>
        <div className={styles.body}>
          <div className={styles.text}>{step.text}</div>
          <div className={styles.pips} aria-hidden>
            {Array.from({ length: GUIDE_PHASES }, (_, i) => (
              <i key={i} className={i < step.phase ? styles.pipOn : i === step.phase ? styles.pipNow : ""} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
