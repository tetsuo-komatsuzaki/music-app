// 上達のようす (推移チャート)。2026-08-16 scoreDetail.tsx から独立部品化。
// 演奏履歴を「1演奏ずつのカード」ではなく "推移" で見せる (2026-07-25 Tetsuo確定・案1拡張)。
// 見た目 = 確定モック TRAJ_CARD (scratchpad/build-score.py 294-321) の写経 (2026-08-20)。
//   カード=DS card / 大数字40px cream+グロー / 伸びチップ緑・下げは桃 /
//   折れ線=クリーム2.6px+節点r3.4(地#16294f) / 格子 rgba(150,175,225,.10) /
//   達成ライン=金1.1px破線4 4 op.5 / 音程・リズムのinset2枚 (#E0872B / #7FC4C4)。
// 機能は従来どおり維持 (総合/音程/リズムの切替・自己ベスト等の統計・達成ライン・日付)。
// データは performances(pitchAccuracy/timingAccuracy/uploadedAt) のみで算出。区間録音は非算入。
"use client"

import { useEffect, useRef, useState } from "react"
import ds from "./ds.module.css"

const GOAL_SCORE = 90 // 達成ライン (曲マスター基準・アプリ全体と統一)
const TRAJECTORY_MIN_POINTS = 2 // 推移として見せるのに必要な最小演奏数

export type TrajectoryPerformance = {
  pitchAccuracy?: number | null
  timingAccuracy?: number | null
  uploadedAt: string | Date
  partId?: string | null
  rangeFromNote?: number | null
  /** 点タップ再生+ふりかえり用 (2026-08-22 Tetsuo指示)。呼び手が渡せる場合のみ有効 */
  id?: string
  audioUrl?: string | null
  name?: string | null
}

/** 推移表示に使える演奏数 (呼び手が「データ不足」表示を出す判定用) */
export function trajectoryPointCount(performances: TrajectoryPerformance[], partId?: string): number {
  return performances.filter((p) =>
    (partId ? p.partId === partId : p.rangeFromNote == null) &&
    p.pitchAccuracy != null && p.timingAccuracy != null,
  ).length
}

function totalScore(p: TrajectoryPerformance): number {
  return Math.round(((p.pitchAccuracy ?? 0) + (p.timingAccuracy ?? 0)) / 2)
}

type TrajAxis = "total" | "pitch" | "rhythm"
// モック TRAJ_CARD の軸色: 総合=クリーム / 音程=#E0872B / リズム=#7FC4C4
const TRAJ_COLOR: Record<TrajAxis, string> = { total: "#fff3dc", pitch: "#e0872b", rhythm: "#7fc4c4" }

/** 数値系列を viewBox 内の座標列にする */
function seriesXY(values: number[], w: number, h: number, pad: number, minV: number, maxV: number): [number, number][] {
  const n = values.length
  const span = maxV - minV || 1
  return values.map((v, i) => {
    const x = n === 1 ? w / 2 : pad + (i / (n - 1)) * (w - 2 * pad)
    const y = h - pad - ((v - minV) / span) * (h - 2 * pad)
    return [Math.round(x * 10) / 10, Math.round(y * 10) / 10]
  })
}

function TrajStat({ v, l, dep }: { v: string; l: string; dep?: boolean }) {
  // 2026-08-21 Tetsuo指示: 統計3枚 (自己ベスト/直近平均/演奏回数) もカウントアップ対象
  // dep=true は軸切替で値が変わる数字 (切替時にカウントを再生する)
  return (
    <div style={{ flex: 1, background: "var(--card-in)", borderRadius: 11, padding: "9px 4px", textAlign: "center" }}>
      <div style={{ fontSize: "var(--fs-subhead)", fontWeight: 800, color: "var(--cream)", fontVariantNumeric: "tabular-nums" }}>
        <span data-anim="count" data-axis-dep={dep ? "1" : undefined}>{v}</span>
      </div>
      <div style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)", fontWeight: 700, marginTop: 2 }}>{l}</div>
    </div>
  )
}

// 軸切替時のカウント再生 (エンジン runCount と同じ増え方: 遅延230ms ・ 1150+値*4ms ・
// 3乗イーズアウト ・ 終わりに rv-settled の弾み)。連打は世代トークンで巻き取る。
function replayCount(n: HTMLElement) {
  const orig = (n.textContent ?? "").trim()
  const m = orig.match(/^(\D*)(\d+)(\D*)$/)
  if (!m) return
  const pre = m[1], target = +m[2], post = m[3]
  const token = (n.dataset.rvReplay = String(+(n.dataset.rvReplay || 0) + 1))
  const host = n.closest(`.${ds.bigN}`) ?? n // エンジン runCount と同じ弾み先
  host.classList.remove("rv-settled")
  window.setTimeout(() => {
    if (n.dataset.rvReplay !== token) return
    const s0 = performance.now(), du = 1150 + Math.min(target, 100) * 4
    const step = (now: number) => {
      if (n.dataset.rvReplay !== token) return
      const pr = Math.min(1, (now - s0) / du)
      const q = 1 - Math.pow(1 - pr, 3)
      n.textContent = pre + Math.round(target * q) + post
      if (pr < 1) requestAnimationFrame(step)
      else { n.textContent = orig; host.classList.add("rv-settled") }
    }
    requestAnimationFrame(step)
  }, 230)
}

export default function ProgressTrajectory({
  performances,
  partId,
  title,
  className,
}: {
  performances: TrajectoryPerformance[]
  /** 指定時: そのパート(partId一致の区間録音)だけの推移。未指定: 通し(区間非算入)。 */
  partId?: string
  title?: string
  /** 呼び手のカードスタイル。未指定は DS カード */
  className?: string
}) {
  const [axis, setAxis] = useState<TrajAxis>("total")

  // 点タップ (2026-08-22 Tetsuo指示: 履歴タイムラインの代替):
  // グラフの点を選ぶと その演奏の録音再生と まとめ振り返り (ほめフィードバック) が出る
  const [selPt, setSelPt] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const [praise, setPraise] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const selPtRef = useRef<number | null>(null)
  selPtRef.current = selPt
  const praiseCache = useRef<Map<string, string | null>>(new Map())
  useEffect(() => () => { audioRef.current?.pause() }, [])

  // タブ切替のたびに「線が描かれる」モーションを再生する (2026-08-22 Tetsuo指示)。
  // 初回はRevealMotionの出現が担当。切替時は v5 と同じ手順 (reset → リフロー → 再生) で
  // エンジンの rv-line/rv-dot 定義 (rvDrawIn 1.5s / rvDotPop 185ms刻み) をそのまま再駆動する。
  const svgRef = useRef<SVGSVGElement | null>(null)
  const firstAxis = useRef(true)
  useEffect(() => {
    if (firstAxis.current) { firstAxis.current = false; return }
    const svg = svgRef.current
    if (!svg) return
    if (!document.documentElement.classList.contains("rv-anim")) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    // 仕分け (エンジン prepareChart と同じ判定): 折れ線 = stroke あり fill none、節点 = r<=9
    const lines: SVGPathElement[] = []
    svg.querySelectorAll<SVGPathElement>("path").forEach((p) => {
      if (p.getAttribute("fill") === "none" && p.getAttribute("stroke") && p.getTotalLength) {
        const len = Math.ceil(p.getTotalLength())
        if (len > 40) { p.classList.add("rv-line"); p.style.setProperty("--len", String(len)); lines.push(p) }
      }
    })
    const dots: SVGCircleElement[] = []
    svg.querySelectorAll<SVGCircleElement>("circle").forEach((c, i) => {
      const r = parseFloat(c.getAttribute("r") || "0")
      if (r > 0 && r <= 9) { c.classList.add("rv-dot"); c.style.setProperty("--di", String(i % 8)); dots.push(c) }
    })
    // 切替時は待たせない (初回出現の --base 遅延を 0 に上書き)
    svg.style.setProperty("--base", "0ms")
    const all: (SVGPathElement | SVGCircleElement)[] = [...lines, ...dots]
    all.forEach((el) => { el.style.animation = "none" })   // reset (巻き戻し)
    void svg.getBoundingClientRect()                        // リフロー
    all.forEach((el) => { el.style.animation = "" })        // 再生
    // 軸で値が変わる数字 (大数字/自己ベスト/直近平均) はカウントも再生 (2026-08-22 Tetsuo指示)
    rootRef.current?.querySelectorAll<HTMLElement>('[data-anim="count"][data-axis-dep]').forEach(replayCount)
  }, [axis])
  const rootRef = useRef<HTMLDivElement | null>(null)

  // partId指定=そのパートの区間録音のみ / 未指定=通し演奏のみ(区間非算入)。いずれも評価済み・古い順。
  const evaluated = performances
    .filter((p) =>
      (partId ? p.partId === partId : p.rangeFromNote == null) &&
      p.pitchAccuracy != null &&
      p.timingAccuracy != null,
    )
    .slice()
    .sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime())

  if (evaluated.length < TRAJECTORY_MIN_POINTS) return null

  const totals = evaluated.map((p) => totalScore(p))
  const pitches = evaluated.map((p) => Math.round(p.pitchAccuracy!))
  const timings = evaluated.map((p) => Math.round(p.timingAccuracy!))
  const series = axis === "total" ? totals : axis === "pitch" ? pitches : timings
  const color = TRAJ_COLOR[axis]

  // 表示中の軸(総合/音程/リズム)に合わせて、数値・伸び・統計も切り替える
  const latest = series[series.length - 1]
  // 直近5回の伸び: 最新 − (5回前 or 最初)
  const baseIdx = Math.max(0, series.length - 5)
  const delta = latest - series[baseIdx]
  const best = Math.max(...series)
  const recent5 = series.slice(-5)
  const recentAvg = Math.round(recent5.reduce((s, v) => s + v, 0) / recent5.length)

  // チャート座標 (モック viewBox 310x120)。下限は 50 か 最低点-5 の低い方。
  const W = 310, H = 120, PAD = 10
  const minV = Math.max(0, Math.min(50, Math.min(...series) - 5))
  const maxV = 100
  const xy = seriesXY(series, W, H, PAD, minV, maxV)
  const line = "M" + xy.map(([x, y]) => `${x} ${y}`).join(" L")
  const goalY = H - PAD - ((GOAL_SCORE - minV) / (maxV - minV)) * (H - 2 * PAD)

  const up = delta >= 0

  // 点の選択: 再生準備 + ふりかえり (ほめ) の取得。もう一度同じ点で解除
  const selectPoint = (i: number) => {
    if (selPt === i) { audioRef.current?.pause(); setPlaying(false); setSelPt(null); setPraise(null); return }
    setSelPt(i)
    audioRef.current?.pause()
    setPlaying(false)
    setPraise(null)
    const perf = evaluated[i]
    if (perf?.id) {
      const hit = praiseCache.current.get(perf.id)
      if (hit !== undefined) setPraise(hit)
      else {
        fetch(`/api/performances/${perf.id}/growth-line?scope=single`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
          .then((g) => {
            const text = g?.praise?.text ?? null
            praiseCache.current.set(perf.id!, text)
            setPraise((cur) => (selPtRef.current === i ? text : cur))
          })
      }
    }
  }
  const togglePlay = () => {
    const perf = selPt != null ? evaluated[selPt] : null
    if (!perf?.audioUrl) return
    if (!audioRef.current) audioRef.current = new Audio()
    const a = audioRef.current
    if (playing) { a.pause(); setPlaying(false); return }
    if (a.src !== perf.audioUrl) a.src = perf.audioUrl
    a.onended = () => setPlaying(false)
    a.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
  }

  const seg = (key: TrajAxis, label: string) => (
    <button
      type="button"
      onClick={() => setAxis(key)}
      style={{
        flex: 1, border: "none", fontSize: "var(--fs-caption)", fontWeight: 800,
        background: axis === key ? "linear-gradient(180deg,#22355e,#182747)" : "transparent",
        color: axis === key ? TRAJ_COLOR[key] : "var(--text-sub)",
        boxShadow: axis === key ? "inset 0 0 0 1px rgba(232,178,60,.28)" : "none",
        padding: "6px 0", borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
      }}
    >
      {label}
    </button>
  )

  return (
    <div ref={rootRef} className={className ?? ds.card} data-anim={className ? "block" : undefined} style={{ marginTop: 0 }}>
      {/* モック: lab + 直近nピル */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className={ds.lab}>{title ?? "上達のようす"}</div>
        <span className={`${ds.pill} ${ds.mute}`} style={{ fontSize: 10.5 }}>直近{recent5.length}回</span>
      </div>

      {/* モック: bigN 40px + 伸びチップ */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginTop: 4 }}>
        <div className={ds.bigN} style={{ fontSize: 40, lineHeight: 1, color }}><span data-anim="count" data-axis-dep="1">{latest}</span></div>
        {/* F6 変化量ピル (Motion Edition 正本): 軸色13%薄塗り ・ 枠なし。
            矢印は文字だとiOSで絵文字描画になるためSVG (2026-08-22 Tetsuo指示) */}
        <span
          style={{
            display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 8,
            fontSize: 11.5, fontWeight: 800, borderRadius: 999, padding: "4px 11px",
            background: up ? "rgba(168,201,127,.13)" : "rgba(232,155,168,.13)",
            color: up ? "var(--green-soft)" : "var(--pink-soft)",
          }}
        >
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            {up ? <path d="M2 8L8 2M3.5 2H8v4.5" /> : <path d="M2 2l6 6M8 3.5V8H3.5" />}
          </svg>
          {up ? "+" : ""}{delta}
        </span>
      </div>

      {/* 軸の切替 (機能維持・DSセグの意匠) */}
      <div style={{ display: "flex", gap: 4, background: "#0e1830", border: "1px solid rgba(150,175,225,.1)", borderRadius: 10, padding: 3, marginTop: 10 }}>
        {seg("total", "総合")}
        {seg("pitch", "音程")}
        {seg("rhythm", "リズム")}
      </div>

      {/* モック: 格子 + 金の達成破線 + クリーム折れ線 + 節点 */}
      <div style={{ position: "relative" }}>
        {/* data-anim="chart": 線が左から描かれ、節点が後から打たれる (台帳19・v3 drawLine) */}
        <svg ref={svgRef} data-anim="chart" viewBox={`0 0 ${W} ${H}`} width="100%" height="118" style={{ marginTop: 8 }} preserveAspectRatio="none">
          <g stroke="rgba(150,175,225,.10)" strokeWidth="1">
            <line x1="8" y1="30" x2={W - 8} y2="30" />
            <line x1="8" y1="70" x2={W - 8} y2="70" />
            <line x1="8" y1="110" x2={W - 8} y2="110" />
          </g>
          {goalY > PAD && goalY < H - PAD && (
            <line x1="8" y1={goalY} x2={W - 8} y2={goalY} stroke="#E8B23C" strokeWidth="1.1" strokeDasharray="4 4" opacity=".5" />
          )}
          <path d={line} fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          <g stroke={color} strokeWidth="2" fill="#16294f">
            {xy.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={selPt === i ? 4.6 : 3.4} />)}
          </g>
          {selPt != null && xy[selPt] && (
            <circle cx={xy[selPt][0]} cy={xy[selPt][1]} r="8" fill="none" stroke={color} strokeWidth="1.2" opacity=".55" pointerEvents="none" />
          )}
          {/* タップ判定 (透明・広め)。エンジンの rv-dot 対象にならないよう r=10 */}
          <g>
            {xy.map(([x, y], i) => (
              <circle key={`hit-${i}`} cx={x} cy={y} r="10" fill="transparent" style={{ cursor: "pointer" }} onClick={() => selectPoint(i)} />
            ))}
          </g>
        </svg>
        {goalY > PAD && goalY < H - PAD && (
          <span style={{ position: "absolute", right: 2, top: Math.max(0, (goalY / H) * 118 - 14), fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--gold)" }}>
            達成 {GOAL_SCORE}点
          </span>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-label)", color: "var(--text-muted)", marginTop: 2 }}>
        <span>{new Date(evaluated[0].uploadedAt).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}</span>
        <span>いま</span>
      </div>

      {/* 点タップの詳細: 録音再生 + まとめ振り返り (2026-08-22 Tetsuo指示) */}
      {selPt == null ? (
        <div style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)", marginTop: 7, textAlign: "center" }}>
          グラフの点をタップすると その日の録音と ふりかえりが見られるよ
        </div>
      ) : (() => {
        const perf = evaluated[selPt]
        const d = new Date(perf.uploadedAt)
        const nameMatch = /^Performance #?(\d+)$/i.exec(perf.name ?? "")
        const dispName = nameMatch ? `#${nameMatch[1]}` : (perf.name ?? `${selPt + 1}回目`)
        return (
          <div style={{ background: "var(--card-in)", border: "1px solid rgba(150,175,225,.08)", borderRadius: 12, padding: "10px 12px", marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              {perf.audioUrl && (
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={playing ? "一時停止" : "この演奏を聴く"}
                  style={{ width: 28, height: 28, borderRadius: "50%", flex: "none", display: "grid", placeItems: "center", background: "rgba(43,91,196,.35)", color: "#cdddfa", border: "none", cursor: "pointer", padding: 0 }}
                >
                  {playing ? (
                    <svg width="10" height="11" viewBox="0 0 10 12" fill="currentColor"><rect x="1" width="3" height="12" rx="1" /><rect x="6" width="3" height="12" rx="1" /></svg>
                  ) : (
                    <svg width="10" height="11" viewBox="0 0 10 12" fill="currentColor" style={{ marginLeft: 2 }}><path d="M0 0l10 6-10 6z" /></svg>
                  )}
                </button>
              )}
              <b style={{ fontSize: 12, color: "var(--text-ink)" }}>{dispName}</b>
              <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700 }}>{d.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}</span>
              <span style={{ marginLeft: "auto", fontSize: 15, fontWeight: 900, color, fontVariantNumeric: "tabular-nums" }}>{series[selPt]}<small style={{ fontSize: 9, color: "var(--text-sub)" }}>点</small></span>
            </div>
            {praise && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: 8, padding: "7px 10px", borderRadius: 9, background: "rgba(127,196,148,.12)", fontSize: 11, fontWeight: 800, color: "#8fd3a8", lineHeight: 1.55 }}>
                <span aria-hidden style={{ flex: "none" }}>🌱</span>{praise}
              </div>
            )}
          </div>
        )
      })()}

      {/* モック: 音程/リズムの inset 2枚 (最新値) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
        <div style={{ background: "var(--card-in)", borderRadius: 12, padding: "10px 12px" }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#e0872b" }}>音程</span>
          <div className={ds.bigN} style={{ fontSize: 22, marginTop: 2, color: "#e0872b" }}><span data-anim="count">{pitches[pitches.length - 1]}</span></div>
        </div>
        <div style={{ background: "var(--card-in)", borderRadius: 12, padding: "10px 12px" }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#7fc4c4" }}>リズム</span>
          <div className={ds.bigN} style={{ fontSize: 22, marginTop: 2, color: "#7fc4c4" }}><span data-anim="count">{timings[timings.length - 1]}</span></div>
        </div>
      </div>

      {/* 統計 (機能維持・insetの意匠) */}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <TrajStat v={String(best)} l="自己ベスト" dep />
        <TrajStat v={String(recentAvg)} l={`直近${recent5.length}回平均`} dep />
        <TrajStat v={String(evaluated.length)} l="演奏回数" />
      </div>
    </div>
  )
}
