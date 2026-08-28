"use client"

// 共有 E5 レール (2026-08-22 抽出): ライブラリ曲タブと基礎練カテゴリのカードレールで共用。
// 仕様原本はリバイス12 (docs/MOTION-SPEC.md)。挙動は PieceCatalog 時代から不変。
import { useEffect, useRef } from "react"

// E5 レール (2026-08-22 リバイス12 Tetsuo提供仕様)。
// ネイティブスクロールの一括移動を廃止し、レール全体の x ドラッグ + カード個別の
// 硬いばね追従に置換。追従感は「横方向の開始時間の差」だけで表現する:
// - y移動・回転・拡縮は一切させない (transform は translateX のみ ・ y は常に 0)
// - ドラッグはレール全体の x のみ。しきい値 (5px) 動くまで開始せず、横量が縦量を
//   上回ったときだけ開始 (縦優勢は touch-action: pan-y でページ縦スクロールに委ねる)
// - 初動のランプイン (2026-08-29 Tetsuo承認「初動が重い」対策): 触った直後は
//   時差0で列全体が指に即応し、60px 動くまでに本来の時差へ立ち上げる
// - 移動方向の先頭カードから 20〜30ms ずつ遅らせる (合計 100ms まで)。
//   移動距離と最終停止位置は全カードで一致 = 停止時は間隔が完全に元へ戻る
// - ばねは硬め (stiffness 700 / damping 50 / mass 0.45 → 減衰比1.4 でオーバー
//   シュートなし ・ 300ms 前後で収束)。慣性なし (dragMomentum: false 相当) ・
//   端は dragElastic 0.02 相当でほぼ動かない
// - reduced-motion はネイティブ横スクロールへフォールバック (時差なし)
const STIFF = 700
const DAMP = 50
const MASS = 0.45
const STEP_DELAY = 25   // カードごとの開始時間差 (仕様 20〜30ms)
const MAX_STAGGER = 100 // 時間差の合計上限
const DRAG_START = 5    // ドラッグ開始しきい値 (2026-08-29 初動を軽く 9→5。縦横判定は別途あるので誤爆しない)
const ELASTIC = 0.02    // 端の抵抗 (dragElastic 相当)
const RAMP_PX = 60      // 時差のランプイン距離 (2026-08-29 Tetsuo承認: 触った直後は時差0、60px動くまでに本来値へ)

export default function StaggerRail({ children, onboarding, gap = 10 }: { children: React.ReactNode; onboarding?: string; gap?: number }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const suppressClick = useRef(false)
  useEffect(() => {
    const wrap = ref.current
    if (!wrap) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      wrap.style.overflowX = "auto"
      wrap.style.touchAction = "pan-x pan-y"
      return
    }
    type Sample = { t: number; x: number }
    const hist: Sample[] = []
    let railX = 0
    let raf = 0
    let lastT = 0
    let dragging = false
    let decided = false
    let pid = -1
    let sx = 0, sy = 0, startRail = 0
    // ジェスチャ開始からの累計移動量。初動の重さ対策 (2026-08-29):
    // 静止からの立ち上がりは時差を距離比例で 0→100% に立ち上げ、列全体を即応させる
    let travel = 0
    let dir = 1 // 1=コンテンツが左へ (次を見る) ・ -1=右へ
    const pos: number[] = []
    const vel: number[] = []

    const maxX = () => Math.max(0, wrap.scrollWidth - wrap.clientWidth)
    const cardW = () => {
      const c = wrap.children as HTMLCollectionOf<HTMLElement>
      return c.length > 1 ? Math.max(1, c[1].offsetLeft - c[0].offsetLeft) : 142
    }
    const record = (x: number) => {
      const now = performance.now()
      hist.push({ t: now, x })
      while (hist.length > 2 && hist[0].t < now - 400) hist.shift()
    }
    // t 時点のレール位置 (履歴の線形補間) — カードごとの「過去の位置」参照に使う
    const at = (t: number) => {
      if (hist.length === 0) return railX
      if (t <= hist[0].t) return hist[0].x
      for (let i = hist.length - 1; i >= 0; i--) {
        if (hist[i].t <= t) {
          const a = hist[i], b = hist[i + 1]
          if (!b) return a.x
          return a.x + (b.x - a.x) * ((t - a.t) / Math.max(1, b.t - a.t))
        }
      }
      return hist[hist.length - 1].x
    }
    // 出現演出のアイテム ([data-rvi]) には transition (遅延 --rvd 付き ・ 最大数秒) が
    // 残るため、そのままインライン transform を書くと「触ってから効くまで時差 ・
    // 下のレールほど動かない」になる。エンジン v5 の rv-notx と同じ発想で、
    // レールを駆動する間はカードの transition を無効化する (出現が済んでから触るので安全)。
    let notx = false
    const killTransitions = () => {
      if (notx) return
      notx = true
      for (const el of wrap.children) (el as HTMLElement).style.transition = "none"
    }
    const restoreTransitions = () => {
      notx = false
      for (const el of wrap.children) (el as HTMLElement).style.transition = ""
    }
    // フリックの慣性滑走 (2026-08-22 Tetsuo指摘「フリック速度が乗らず重い」で追加 ・
    // リバイス12追補)。iOS 風の指数減衰 τ=325ms。端で停止 (バウンスなし)。
    let glideV = 0 // px/s
    const tick = () => {
      const now = performance.now()
      const dt = lastT ? Math.min(0.032, (now - lastT) / 1000) : 0.016
      lastT = now
      if (!dragging && glideV !== 0) {
        let x = railX + glideV * dt
        const m = maxX()
        if (x <= 0) { x = 0; glideV = 0 }
        else if (x >= m) { x = m; glideV = 0 }
        else {
          glideV *= Math.exp(-dt / 0.325)
          if (Math.abs(glideV) < 40) glideV = 0
        }
        if (x !== railX) dir = x > railX ? 1 : -1
        travel += Math.abs(x - railX)
        railX = x
      }
      record(railX)
      const cards = [...wrap.children] as HTMLElement[]
      const w = cardW()
      const firstVis = Math.max(0, Math.floor(railX / w))
      const lastVis = Math.min(cards.length - 1, Math.ceil((railX + wrap.clientWidth) / w))
      let active = dragging || glideV !== 0
      // 硬いばね (減衰係数/質量 = 111/s) は 1 フレーム一括の Euler だと発散するため、
      // 4ms の固定サブステップで積分する (最大 8 回/フレーム)
      const n = Math.max(1, Math.ceil(dt / 0.004))
      const h = dt / n
      cards.forEach((el, i) => {
        // 移動方向の先頭 (見えている端のカード) から順に遅らせる
        const order = dir >= 0 ? Math.max(0, i - firstVis) : Math.max(0, lastVis - i)
        // 初動のランプイン: 触った直後は時差0で列全体が指に即応し、
        // 流れに乗る (60px) までに本来の時差へ立ち上げる
        const ramp = Math.min(1, travel / RAMP_PX)
        const delay = Math.min(order * STEP_DELAY, MAX_STAGGER) * ramp
        const target = at(now - delay)
        if (pos[i] === undefined || !Number.isFinite(pos[i])) { pos[i] = railX; vel[i] = 0 }
        if (dragging && delay < 1 && Math.abs(pos[i] - railX) < 2) {
          // 揃っているカードだけ即応にする。滑走中に掴み直した直後など
          // 遅れが残るカードはばねで追いつかせ、1フレームの瞬間整列を防ぐ
          // 先頭カード (移動方向の見えている端) は指に 1:1 で追従させ、重さを消す。
          // 時差はあくまで後続カードの遅れだけで表現する
          pos[i] = target
          vel[i] = 0
        } else {
          for (let k = 0; k < n; k++) {
            vel[i] += ((STIFF * (target - pos[i]) - DAMP * vel[i]) / MASS) * h
            pos[i] += vel[i] * h
          }
        }
        if (Math.abs(pos[i] - railX) > 0.05 || Math.abs(vel[i]) > 0.5) active = true
        else { pos[i] = railX; vel[i] = 0 }
        el.style.transform = `translateX(${(-pos[i]).toFixed(2)}px)` // y は常に 0
      })
      if (active) raf = requestAnimationFrame(tick)
      else { raf = 0; lastT = 0 }
    }
    const wake = () => { killTransitions(); if (!raf) { lastT = 0; raf = requestAnimationFrame(tick) } }
    const setRail = (x: number) => {
      const m = maxX()
      if (x < 0) x = x * ELASTIC
      else if (x > m) x = m + (x - m) * ELASTIC
      if (x !== railX) dir = x > railX ? 1 : -1
      travel += Math.abs(x - railX)
      railX = x
      // 履歴は tick 任せにしない: 速いフリックは tick が1回も回る前に終わるため、
      // tick だけの記録だと解放時速度が 0 と誤判定され慣性が乗らない (2026-08-22 実測)
      record(x)
      wake()
    }
    const down = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return
      pid = e.pointerId; sx = e.clientX; sy = e.clientY
      startRail = railX; decided = false; dragging = false
      travel = 0 // 新しいジェスチャは毎回「即応」から始める
      glideV = 0 // 触れたら滑走停止 (iOS流)
      record(railX) // 速度算出の基準点。move が1発に合体しても履歴が2点になり速度が出る
      suppressClick.current = false
    }
    const move = (e: PointerEvent) => {
      if (e.pointerId !== pid) return
      const dx = e.clientX - sx, dy = e.clientY - sy
      if (!decided) {
        if (Math.hypot(dx, dy) < DRAG_START) return // しきい値までは開始しない
        decided = true
        if (Math.abs(dx) > Math.abs(dy)) {
          dragging = true
          suppressClick.current = true
          try { wrap.setPointerCapture(pid) } catch { /* 取得不可でも横ドラッグは動く */ }
        }
        // 縦優勢: ドラッグにせずページの縦スクロールへ (touch-action: pan-y)
        return
      }
      if (!dragging) return
      setRail(startRail - (e.clientX - sx))
    }
    const up = (e: PointerEvent) => {
      if (e.pointerId !== pid) return
      pid = -1
      if (dragging) {
        dragging = false
        // 端の弾み分は枠内へ戻し、フリック速度 (直近80msの平均) を慣性滑走に乗せる
        railX = Math.max(0, Math.min(maxX(), railX))
        const now = performance.now()
        const v = (railX - at(now - 100)) / 0.1 // 直近100msの平均速度 (iOS相当)
        glideV = Math.abs(v) > 300 ? v : 0
        wake()
      }
    }
    const wheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
      e.preventDefault()
      setRail(Math.max(0, Math.min(maxX(), railX + e.deltaX)))
    }
    const onShow = () => restoreTransitions() // bfcache復帰時は出現の再生を優先
    window.addEventListener("pageshow", onShow)
    wrap.addEventListener("pointerdown", down)
    wrap.addEventListener("pointermove", move)
    wrap.addEventListener("pointerup", up)
    wrap.addEventListener("pointercancel", up)
    wrap.addEventListener("wheel", wheel, { passive: false })
    return () => {
      wrap.removeEventListener("pointerdown", down)
      wrap.removeEventListener("pointermove", move)
      wrap.removeEventListener("pointerup", up)
      wrap.removeEventListener("pointercancel", up)
      wrap.removeEventListener("wheel", wheel)
      window.removeEventListener("pageshow", onShow)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
  return (
    <div
      ref={ref}
      data-anim="rail" // レール=1ブロック ・ カードは項目出現 (横画面外カードのIO未発火対策)
      data-onboarding={onboarding}
      onClickCapture={(e) => {
        if (suppressClick.current) { e.preventDefault(); e.stopPropagation(); suppressClick.current = false }
      }}
      style={{ display: "flex", gap, overflowX: "hidden", paddingBottom: 2, touchAction: "pan-y", overscrollBehaviorX: "contain", userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" }}
    >
      {children}
    </div>
  )
}
