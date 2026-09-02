"use client"

// 記録の分析 (2026-08-31 Tetsuo確定・案2コックピット計器盤に全面再構成)。
// モック正本: scratchpad/gen_numbers_redesign.py 案2。
// 読み筋: 音程マップ+発見1行 → 計器盤 (音程のクセ+いまの平均) → 成長カーブ →
//         練習バランス → 奏法べつ → ポジション移動べつ (各行から練習へ)。
// 旧構成 (いちばんの発見カード/得意苦手/今週うごいた枝/調べつ/テンポ帯べつ) は廃止。
// 生徒本人ページと先生の生徒閲覧ページで共用 (practiceBase=nullで練習導線を隠す)。
import { useEffect, useState } from "react"
import Link from "next/link"
import type { NumbersRoomData, KartePeriod } from "@/app/_libs/growthKarte"
import type { HeatmapData } from "@/app/_libs/fingerboard/heatmapTypes"
import FingerboardPanel, { type FingerboardMark } from "@/app/components/FingerboardPanel"
import type { FastSwitchData } from "@/app/_libs/fastSwitch"
import ds from "@/app/components/ds.module.css"

const tnum: React.CSSProperties = { fontVariantNumeric: "tabular-nums" }

// 原本 追10 の枝色: 良=緑 / 中=アンバー / 低=赤 (バー塗り)。文字は明るい同系
function fillColor(pct: number) {
  return pct >= 85 ? "#2e7d5b" : pct >= 70 ? "#d97b2e" : "#b44b4b"
}
function inkColor(pct: number) {
  return pct >= 85 ? "#a8c97f" : pct >= 70 ? "#e0b25c" : "#e8a78f"
}

/** バー行 (奏法べつ/ポジション移動べつ共通)。href付きなら行末に練習へ */
function BarRow({ label, sub, pct, on, href }: { label: string; sub?: string; pct: number; on: boolean; href?: string | null }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 9 }}>
      <span style={{ width: 104, flex: "none", fontSize: 12, fontWeight: 800, color: "var(--text-ink)" }}>
        {label}
        {sub && <span style={{ display: "block", fontSize: 9.5, color: "var(--text-muted)", fontWeight: 700 }}>{sub}</span>}
      </span>
      <div className="naBar"><i style={{ width: on ? `${pct}%` : 0, background: fillColor(pct) }} /></div>
      <b style={{ ...tnum, width: 38, flex: "none", textAlign: "right", fontSize: 12, fontWeight: 900, color: inkColor(pct) }}>{pct}%</b>
      {href && (
        <Link href={href} className="naGo pressable">練習へ</Link>
      )}
    </div>
  )
}

export default function NumbersRoomView({ d, period, baseHref, backHref, backLabel, heatmap = null, fbMarks = [], practiceBase = null, fastSwitch = null }: {
  d: NumbersRoomData
  period: KartePeriod
  /** 期間切替リンクの土台 (例: /uid/progress/numbers) */
  baseHref: string
  backHref: string
  backLabel: string
  /** 指板ヒートマップ (2026-08-11 Tetsuo確定・期間タブ連動) */
  heatmap?: HeatmapData | null
  fbMarks?: FingerboardMark[]
  /** 練習導線の土台 (例: /uid/practice)。null=先生ビュー等で導線を出さない */
  practiceBase?: string | null
  /** 速い指の切り替え (2026-09-02 新設)。null=集計できなかった */
  fastSwitch?: FastSwitchData | null
}) {
  // 出現アニメ (マウント後に計器が振れ、バーと線が満ちる)
  const [on, setOn] = useState(false)
  useEffect(() => {
    const t = requestAnimationFrame(() => setOn(true))
    return () => cancelAnimationFrame(t)
  }, [])

  const empty = d.curve.length === 0 && d.worstNotes.length === 0 && d.posShifts.length === 0 && d.articulations.length === 0
  const lens = d.worstNotes[0] ?? null

  // クセメーターの針: セント偏差を±70度へ (±28セントで振り切り)
  const needleAngle = d.centsBias == null ? 0 : Math.max(-70, Math.min(70, d.centsBias * 2.5))
  const biasLabel = d.centsBias == null ? null
    : Math.abs(d.centsBias) < 5 ? { text: "ぴったり", color: "#a8c97f" }
    : d.centsBias < 0 ? { text: `ぶら下がりぎみ ${d.centsBias}セント`, color: "#e8a78f" }
    : { text: `上ずりぎみ +${d.centsBias}セント`, color: "#e0b25c" }

  // 成長カーブのSVG (日別平均・金点=自己ベスト更新日)
  const curveSvg = (() => {
    if (d.curve.length < 2) return null
    const W = 360
    const H = 96
    const pad = 10
    const vals = d.curve.map((c) => c.score)
    const min = Math.min(...vals) - 4
    const max = Math.max(...vals) + 4
    const pts = d.curve.map((c, i) => [
      pad + (i * (W - 2 * pad)) / (d.curve.length - 1),
      H - pad - ((c.score - min) / Math.max(1, max - min)) * (H - 2 * pad),
    ] as const)
    const line = "M " + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ")
    const area = `${line} L ${W - pad} ${H - 2} L ${pad} ${H - 2} Z`
    return (
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} aria-hidden>
        <defs>
          <linearGradient id="naAg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(122,167,255,.28)" />
            <stop offset="1" stopColor="rgba(122,167,255,0)" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#naAg)" style={{ opacity: on ? 1 : 0, transition: "opacity 1s ease .5s" }} />
        <path d={line} fill="none" stroke="#7aa7ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={600} strokeDashoffset={on ? 0 : 600} style={{ transition: "stroke-dashoffset 1.6s ease" }} />
        {d.curve.map((c, i) => c.best && (
          <g key={c.day + i} style={{ opacity: on ? 1 : 0, transition: `opacity .4s ease ${0.9 + i * 0.08}s` }}>
            <circle cx={pts[i][0]} cy={pts[i][1]} r="4" fill="#f0cd7c" />
            <text x={pts[i][0]} y={pts[i][1] - 8} textAnchor="middle" fontSize="9" fontWeight="900" fill="#f0cd7c">{c.score}</text>
          </g>
        ))}
      </svg>
    )
  })()

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 0 60px" }}>
      <Link href={backHref}
        style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--text-sub)", fontSize: 13, fontWeight: 700, padding: "10px 2px 2px", textDecoration: "none" }}>
        ‹ {backLabel}
      </Link>
      <h1 className={ds.t} style={{ paddingTop: 0 }}>記録の分析</h1>

      {/* 期間セグ (原本: 7日/30日/すべて ・ TRAJセグ様式) */}
      <div style={{ display: "flex", gap: 4, background: "#0e1830", border: "1px solid rgba(150,175,225,.1)", borderRadius: 10, padding: 3, marginTop: 10 }}>
        {([["7d", "7日"], ["30d", "30日"], ["all", "すべて"]] as const).map(([pp, label]) => {
          const active = period === pp
          return (
            <Link key={pp} href={`${baseHref}${pp === "30d" ? "" : `?period=${pp}`}`} scroll={false}
              style={{
                flex: 1, textAlign: "center", fontSize: "var(--fs-caption)", fontWeight: 800, padding: "7px 0", borderRadius: 8,
                textDecoration: "none",
                color: active ? "var(--gold)" : "var(--text-sub)",
                background: active ? "linear-gradient(180deg,#22355e,#182747)" : "transparent",
                boxShadow: active ? "inset 0 0 0 1px rgba(232,178,60,.28)" : "none",
              }}>
              {label}
            </Link>
          )
        })}
      </div>

      {empty ? (
        <div className={ds.card} style={{ padding: "13px 15px" }}>
          <div style={{ fontSize: "var(--fs-body)", color: "var(--text-sub)", lineHeight: 1.8 }}>この期間の録音がまだ少ないよ。録音がたまると、クセ・のび・奏法ごとの数字がここに並びます。</div>
        </div>
      ) : (
        <>
          {/* 音程マップ + いちばんの発見1行 (旧発見カード/得意苦手を統合) */}
          {heatmap && (
            <div className={ds.card} style={{ padding: "13px 15px" }}>
              <div className={ds.lab}>音程マップ</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", margin: "4px 0 9px" }}>
                期間タブと連動{fbMarks.length > 0 ? " ・ 橙の旗 = 先生の「気をつける音」" : " ・ 先生の「気をつける音」も出る"}
              </div>
              <FingerboardPanel cells={heatmap.cells} details={heatmap.details} marks={fbMarks}
                emptyText={`この期間はまだ判定できる音が少ないよ・同じ音を5回以上ひくと色がつくよ。`} />
              {lens && (
                <div className="naLens">
                  <span style={{ flex: 1 }}>
                    いちばんずれやすいのは <b style={{ color: "var(--text-ink)" }}>{lens.kana}{lens.string ? ` ・ ${lens.string}` : ""}</b> ・ 成功 <b style={{ ...tnum, color: inkColor(lens.pct) }}>{lens.pct}%</b>
                    {lens.cents != null && Math.abs(lens.cents) >= 15 && <>・{lens.cents < 0 ? `ぶら下がり ${lens.cents}` : `上ずり +${lens.cents}`}セント</>}
                  </span>
                  {practiceBase && <Link href={practiceBase} className="naCta pressable">処方の基礎練へ</Link>}
                </div>
              )}
            </div>
          )}

          {/* 計器盤: 音程のクセ + いまの平均 */}
          <div className={`${ds.card} naCockpit`} style={{ padding: "13px 15px" }}>
            <div style={{ display: "flex", alignItems: "stretch", gap: 14 }}>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div className={ds.lab}>音程のクセ</div>
                {d.centsBias == null ? (
                  <div style={{ fontSize: 10.5, color: "var(--text-muted)", fontWeight: 800, marginTop: 24, lineHeight: 1.8 }}>集計中<br />録音がたまると針が振れるよ</div>
                ) : (
                  <>
                    <svg width="120" height="64" viewBox="0 0 120 64" style={{ marginTop: 6 }} aria-hidden>
                      <path d="M 12 56 A 48 48 0 0 1 108 56" fill="none" stroke="rgba(150,175,225,.15)" strokeWidth="9" strokeLinecap="round" />
                      <path d="M 12 56 A 48 48 0 0 1 40 14" fill="none" stroke="rgba(232,138,111,.5)" strokeWidth="9" strokeLinecap="round" />
                      <path d="M 80 14 A 48 48 0 0 1 108 56" fill="none" stroke="rgba(232,178,60,.5)" strokeWidth="9" strokeLinecap="round" />
                      {[-60, -30, 0, 30, 60].map((a) => (
                        <line key={a} x1="60" y1="14" x2="60" y2="20" stroke="rgba(150,175,225,.4)" strokeWidth="2" transform={`rotate(${a} 60 56)`} />
                      ))}
                      <line x1="60" y1="56" x2="60" y2="18" stroke="#edf1fa" strokeWidth="3" strokeLinecap="round"
                        style={{ transformOrigin: "60px 56px", transform: `rotate(${on ? needleAngle : 0}deg)`, transition: "transform 1.1s cubic-bezier(.3,1.2,.4,1)" }} />
                      <circle cx="60" cy="56" r="5" fill="#edf1fa" />
                    </svg>
                    {biasLabel && <div style={{ fontSize: 11, fontWeight: 900, color: biasLabel.color }}>{biasLabel.text}</div>}
                    <div style={{ fontSize: 9.5, color: "var(--text-muted)", fontWeight: 800, marginTop: 2 }}>左=ぶら下がり ・ 右=上ずり</div>
                  </>
                )}
              </div>
              <div style={{ flex: 1, textAlign: "center", borderLeft: "1px solid rgba(150,175,225,.12)", paddingLeft: 12 }}>
                <div className={ds.lab}>いまの平均</div>
                {d.current == null ? (
                  <div style={{ fontSize: 10.5, color: "var(--text-muted)", fontWeight: 800, marginTop: 24, lineHeight: 1.8 }}>集計中<br />曲を2回採点すると出るよ</div>
                ) : (
                  <>
                    <div style={{ ...tnum, fontSize: 30, fontWeight: 900, color: "var(--gold)", marginTop: 14, lineHeight: 1 }}>
                      {d.current.avg}<span style={{ fontSize: 12, color: "var(--text-muted)" }}>点</span>
                    </div>
                    {d.current.delta != null && (
                      <div style={{ ...tnum, fontSize: 10.5, fontWeight: 900, marginTop: 5, color: d.current.delta >= 0 ? "#a8c97f" : "#e8a78f" }}>
                        {d.current.delta >= 0 ? `▲ +${d.current.delta}` : `▼ ${d.current.delta}`} この{period === "7d" ? "7日" : period === "all" ? "期間" : "30日"}
                      </div>
                    )}
                    <div style={{ fontSize: 9.5, color: "var(--text-muted)", fontWeight: 800, marginTop: 3 }}>直近5回の演奏スコア</div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 成長カーブ */}
          <div className={`${ds.card} naCockpit`} style={{ padding: "13px 15px" }}>
            <div className={ds.lab}>成長カーブ</div>
            {curveSvg == null ? (
              <div style={{ fontSize: 10.5, color: "var(--text-muted)", fontWeight: 800, margin: "10px 0 4px", lineHeight: 1.8 }}>2日ぶん録音がたまると 線がのびていくよ</div>
            ) : (
              <>
                <div style={{ marginTop: 8 }}>{curveSvg}</div>
                <div style={{ fontSize: 9.5, color: "var(--text-muted)", fontWeight: 800, marginTop: 3 }}>金の点 = 自己ベスト更新 ・ 点は録音した日の平均</div>
              </>
            )}
          </div>

          {/* 練習バランス */}
          {d.balance && (
            <div className={`${ds.card} naCockpit`} style={{ padding: "13px 15px" }}>
              <div className={ds.lab}>練習バランス</div>
              <div className="naSplit">
                <i style={{ width: on ? `${d.balance.songPct}%` : 0, background: "linear-gradient(180deg,#3d5da8,#2c4a86)", color: "#c6d6f5" }}>曲 {d.balance.songPct}%</i>
                <i style={{ width: on ? `${d.balance.basicPct}%` : 0, background: "linear-gradient(180deg,#c99a35,#8a6a1a)", color: "#fff3dc" }}>基礎 {d.balance.basicPct}%</i>
              </div>
              <div style={{ fontSize: 9.5, color: "var(--text-muted)", fontWeight: 800, marginTop: 5 }}>
                {d.balance.basicPct < 30 ? "曲にかたよりぎみ。基礎練を1日1本まぜよう"
                  : d.balance.songPct < 30 ? "基礎練はばっちり。曲にも挑戦しよう"
                  : "いいバランス。この調子"}
              </div>
            </div>
          )}

          {/* 奏法べつ (2026-08-31 Tetsuo確定: 調べつ/テンポ帯べつは廃止) */}
          {d.articulations.length > 0 && (
            <div className={ds.card} style={{ padding: "13px 15px" }}>
              <div className={ds.lab}>奏法べつ <span style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)", fontWeight: 800 }}>基礎練のスコア平均 ・ にがて順</span></div>
              {d.articulations.map((a) => (
                <BarRow key={a.label} label={a.label} sub={`${a.count}回`} pct={a.pct} on={on} href={practiceBase} />
              ))}
            </div>
          )}

          {/* 速い指の切り替え (2026-09-02 Tetsuo確定: 記録の分析に新設)。
              指を切り替える猶予 = 前の音からこの音までの実時間。テンポと音価が1つの数字にまとまる。
              開放弦と同音連続は除く (どちらも指を替えないため) */}
          {fastSwitch && fastSwitch.bands.some((b) => b.pitchPct != null) && (
            <div className={ds.card} style={{ padding: "13px 15px" }}>
              <div className={ds.lab}>速い指の切り替え <span style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)", fontWeight: 800 }}>指を替える猶予べつ ・ 音程</span></div>
              {fastSwitch.bands.map((b) => (
                b.pitchPct == null
                  ? (
                    <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 9 }}>
                      <span style={{ width: 104, flex: "none", fontSize: 12, fontWeight: 800, color: "var(--text-muted)" }}>{b.label}</span>
                      <span style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)" }}>まだ判定できる音が少ないよ ・ {b.notes}音</span>
                    </div>
                  )
                  : <BarRow key={b.label} label={b.label} sub={`${b.notes}音${b.timingPct != null ? ` ・ タイミング${b.timingPct}%` : ""}`}
                      pct={b.pitchPct} on={on} href={practiceBase ? `${practiceBase}/bowing` : null} />
              ))}
              <div style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)", marginTop: 4 }}>※ 開放弦と、同じ音が続くところは数えていないよ</div>
            </div>
          )}

          {/* ポジション移動べつ */}
          {d.posShifts.length > 0 && (
            <div className={ds.card} style={{ padding: "13px 15px" }}>
              <div className={ds.lab}>ポジション移動べつ <span style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)", fontWeight: 800 }}>左手の移動 ・ にがて順</span></div>
              {d.posShifts.map((p) => (
                <BarRow key={p.label} label={p.label} sub={`${p.target}回`} pct={p.pct} on={on} href={practiceBase ? `${practiceBase}/fingering` : null} />
              ))}
              <div style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)", marginTop: 4 }}>※ ポジション移動をふくむ曲・教材を弾くと集計されるよ</div>
            </div>
          )}
        </>
      )}

      {/* 案2コックピットの装飾 (モック正本のCSS移植) */}
      <style>{`
.naCockpit { background:linear-gradient(180deg,#10182e,#0a1020); border-color:rgba(122,167,255,.2); }
.naLens { display:flex; align-items:center; gap:10px; margin-top:10px; padding:9px 11px; border-radius:11px;
  font-size:11px; color:var(--text-sub); line-height:1.7;
  background:rgba(232,155,168,.08); border:1px solid rgba(232,155,168,.25); }
.naCta { flex:none; display:inline-block; font-size:10.5px; font-weight:900; color:#0d1730; text-decoration:none;
  background:linear-gradient(180deg,#f0cd7c,#d9a93c); border-radius:999px; padding:5px 13px;
  box-shadow:0 3px 10px rgba(232,178,60,.35); }
.naGo { flex:none; font-size:10px; font-weight:900; color:var(--gold); text-decoration:none;
  background:rgba(232,178,60,.12); border:1px solid rgba(232,178,60,.35); border-radius:999px; padding:4px 11px; }
.naBar { height:7px; border-radius:99px; background:rgba(150,175,225,.12); overflow:hidden; flex:1; }
.naBar i { display:block; height:100%; border-radius:99px; transition:width 1s cubic-bezier(.2,.8,.2,1); }
.naSplit { display:flex; height:26px; border-radius:9px; overflow:hidden; margin-top:10px; border:1px solid rgba(150,175,225,.16); }
.naSplit i { display:grid; place-items:center; font-size:10px; font-weight:900; transition:width 1.1s cubic-bezier(.2,.8,.2,1);
  white-space:nowrap; overflow:hidden; }
@media (prefers-reduced-motion: reduce) {
  .naBar i, .naSplit i { transition:none; }
}
      `}</style>
    </div>
  )
}
