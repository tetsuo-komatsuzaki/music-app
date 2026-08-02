"use client"

// 成長カルテ UI (2026-08-02 全面作り替え・モック承認済)。
// 4章: 実態 / 安定マップ / 所見 / 物語。データは server (growthKarte.ts) から受け取る。
import { useState } from "react"
import Link from "next/link"
import OnboardingTrigger from "@/app/[userId]/_onboarding/OnboardingTrigger"
import type { KarteData, GridCell } from "@/app/_libs/growthKarte"

const INK = "#2b3742"
const SUB = "#8a9099"
const GOOD = { c: "#2e8b57", bg: "#e9f5ee", bd: "#cfe6d8" }
const MID = { c: "#b7823a", bg: "#faf1e1", bd: "#ecdfc8" }
const BAD = { c: "#c0473a", bg: "#fbecea", bd: "#f0d4d0" }
const NONE = { c: "#c0c7cf", bg: "#f2f4f7", bd: "#e6e9ee" }

const card: React.CSSProperties = {
  background: "#fff", border: "1px solid #eef1f4", borderRadius: 16,
  padding: "15px 16px", marginBottom: 14, boxShadow: "0 1px 3px rgba(30,45,70,.04)",
}
const secTtl: React.CSSProperties = { fontSize: 13, fontWeight: 800, color: INK, margin: "0 0 12px" }
const miniLbl: React.CSSProperties = { fontSize: 11, fontWeight: 800, color: SUB, marginBottom: 7 }

function rateColor(miss: number, target: number) {
  if (target < 8) return NONE
  const r = miss / target
  if (r < 0.25) return GOOD
  if (r <= 0.5) return MID
  return BAD
}

export default function ProgressPage({ userId, data }: { userId: string; data: KarteData }) {
  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "18px 14px 60px", fontFamily: "inherit", color: INK }}>
      <h1 style={{ fontSize: 18, fontWeight: 900, margin: "0 0 3px" }}>📖 成長カルテ</h1>
      <p style={{ fontSize: 11.5, color: SUB, margin: "0 0 14px", lineHeight: 1.6 }}>
        きみの練習を「意味」に変えて見せるよ。
      </p>

      {/* 期間タブ */}
      <div style={{ display: "flex", gap: 4, background: "#eceef2", borderRadius: 10, padding: 3, marginBottom: 16 }}>
        {([["7d", "今週"], ["30d", "直近30日"], ["all", "全期間"]] as const).map(([p, label]) => (
          <Link key={p} href={`/${userId}/progress${p === "30d" ? "" : `?period=${p}`}`} scroll={false}
            style={{
              flex: 1, textAlign: "center", fontSize: 12, fontWeight: 800, padding: "7px 0", borderRadius: 8,
              textDecoration: "none",
              color: data.period === p ? INK : "#8b97a3",
              background: data.period === p ? "#fff" : "transparent",
              boxShadow: data.period === p ? "0 1px 2px rgba(30,45,70,.08)" : "none",
            }}>
            {label}
          </Link>
        ))}
      </div>

      <Reality userId={userId} data={data} />
      <StabilityMap data={data} />
      <Insights data={data} />
      <Story data={data} />

      <OnboardingTrigger pageKey="progress" />
    </div>
  )
}

/* ── 1. 練習の実態 ── */
function Reality({ userId, data }: { userId: string; data: KarteData }) {
  const catColor = (label: string) =>
    label === "曲" ? "#5b6b9e" : label === "音階" ? "#2f9e6a" : label === "アルペジオ" ? "#8b5cf6" : label === "フィンガリング" ? "#4a6cf7" : "#0ea5a5"
  return (
    <div style={card}>
      <div style={secTtl}>🗓 練習の実態</div>

      <div style={{ display: "flex", gap: 8 }}>
      {[
        { v: data.practiceDays, u: "日", k: "練習した日" },
        { v: data.recordingCount, u: "回", k: "録音" },
        { v: data.streak, u: "日", k: "🔥 連続記録" },
      ].map((s) => (
        <div key={s.k} style={{ flex: 1, textAlign: "center", background: "#fafbfc", border: "1px solid #eceef2", borderRadius: 12, padding: "10px 4px" }}>
          <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
            {s.v}<span style={{ fontSize: 11 }}>{s.u}</span>
          </div>
          <div style={{ fontSize: 10, fontWeight: 800, color: SUB, marginTop: 4 }}>{s.k}</div>
        </div>
      ))}
      </div>

      {data.categoryShare.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={miniLbl}>なにを練習した？</div>
          {data.categoryShare.slice(0, 5).map((c) => (
            <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
              <span style={{ width: 88, flex: "none", fontSize: 11.5, fontWeight: 700, color: "#4a5766", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.label}</span>
              <span style={{ flex: 1, height: 9, borderRadius: 5, background: "#eef0f4", overflow: "hidden" }}>
                <span style={{ display: "block", height: "100%", borderRadius: 5, width: `${c.pct}%`, background: catColor(c.label) }} />
              </span>
              <b style={{ width: 34, flex: "none", textAlign: "right", fontSize: 11, fontVariantNumeric: "tabular-nums" }}>{c.pct}%</b>
            </div>
          ))}
        </div>
      )}

      {(data.keyRows.length > 0 || data.unusedKeys.length > 0) && (
        <div style={{ marginTop: 14 }}>
          <div style={miniLbl}>どの調を練習した？（回数と音程）</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {data.keyRows.slice(0, 6).map((k) => {
              const col = k.avgPitch == null ? NONE : k.avgPitch >= 85 ? GOOD : k.avgPitch >= 75 ? MID : BAD
              return (
                <span key={k.label} style={{ fontSize: 11, fontWeight: 800, borderRadius: 8, padding: "5px 10px", color: col.c, background: col.bg, border: `1px solid ${col.bd}`, fontVariantNumeric: "tabular-nums" }}>
                  {k.label} ×{k.count}{k.avgPitch != null ? ` ・${k.avgPitch}点` : ""}
                </span>
              )
            })}
            {data.unusedKeys.map((k) => (
              <span key={k} style={{ fontSize: 11, fontWeight: 800, borderRadius: 8, padding: "5px 10px", color: NONE.c, background: NONE.bg, border: `1px solid ${NONE.bd}` }}>
                {k} 0回
              </span>
            ))}
          </div>
        </div>
      )}

      <Calendar userId={userId} dayCounts={data.dayCounts} />
    </div>
  )
}

/* 録音した日ベースのカレンダー (旧3つルール廃止: 色=その日の録音回数) */
function Calendar({ dayCounts }: { userId: string; dayCounts: Record<string, number> }) {
  const now = new Date(Date.now() + 9 * 3600_000)
  const [ym, setYm] = useState({ y: now.getUTCFullYear(), m: now.getUTCMonth() + 1 })
  const pad2 = (n: number) => String(n).padStart(2, "0")
  const daysInMonth = new Date(ym.y, ym.m, 0).getDate()
  const offset = new Date(`${ym.y}-${pad2(ym.m)}-01T00:00:00Z`).getUTCDay()
  const todayStr = now.toISOString().slice(0, 10)
  const nav = (d: number) => setYm(({ y, m }) => {
    const nm = m + d
    return nm < 1 ? { y: y - 1, m: 12 } : nm > 12 ? { y: y + 1, m: 1 } : { y, m: nm }
  })
  const cellBg = (c: number) => (c >= 3 ? "#2e8b57" : c === 2 ? "#7cc39a" : c === 1 ? "#c8e6d4" : "#f2f4f7")
  const cellFg = (c: number) => (c >= 2 ? "#fff" : c === 1 ? "#2e6b47" : "#aab2bb")

  return (
    <div style={{ marginTop: 14 }} data-onboarding="progress.calendar">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
        <button type="button" onClick={() => nav(-1)} aria-label="前の月" style={{ border: "1px solid #e2e6ea", background: "#fff", borderRadius: 8, width: 28, height: 28, cursor: "pointer", color: SUB, fontWeight: 800 }}>←</button>
        <span style={{ fontSize: 12, fontWeight: 800 }}>{ym.y}年{ym.m}月</span>
        <button type="button" onClick={() => nav(1)} aria-label="次の月" style={{ border: "1px solid #e2e6ea", background: "#fff", borderRadius: 8, width: 28, height: 28, cursor: "pointer", color: SUB, fontWeight: 800 }}>→</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
        {["日", "月", "火", "水", "木", "金", "土"].map((h) => (
          <div key={h} style={{ textAlign: "center", fontSize: 9.5, fontWeight: 800, color: "#aab2bb", padding: "2px 0" }}>{h}</div>
        ))}
        {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const d = i + 1
          const key = `${ym.y}-${pad2(ym.m)}-${pad2(d)}`
          const c = dayCounts[key] ?? 0
          const isToday = key === todayStr
          return (
            <div key={d} style={{
              textAlign: "center", fontSize: 10.5, fontWeight: 800, borderRadius: 7, padding: "6px 0",
              background: cellBg(c), color: cellFg(c),
              outline: isToday ? "2px solid #4a5bd0" : "none", outlineOffset: -1,
              fontVariantNumeric: "tabular-nums",
            }}>{d}</div>
          )
        })}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 7, fontSize: 10, color: SUB, fontWeight: 700, alignItems: "center" }}>
        色 = その日の録音回数：
        <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: "#c8e6d4" }} />1回</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: "#7cc39a" }} />2回</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: "#2e8b57" }} />3回+</span>
      </div>
    </div>
  )
}

/* ── 2. 音の安定マップ ── */
function StabilityMap({ data }: { data: KarteData }) {
  const hasGrid = data.grid.some((c) => c.target >= 8)
  const cell = (c: GridCell | undefined) => {
    if (!c) return null
    const col = rateColor(c.miss, c.target)
    const label = c.target < 8 ? "少" : `${Math.round((c.miss / c.target) * 100)}%`
    return (
      <span style={{ borderRadius: 8, textAlign: "center", padding: "8px 2px", fontWeight: 900, fontSize: 12, background: col.bg, color: col.c, fontVariantNumeric: "tabular-nums" }}>
        {label}
      </span>
    )
  }
  const find = (cross: GridCell["cross"], dir: GridCell["dir"], dist: GridCell["dist"]) =>
    data.grid.find((c) => c.cross === cross && c.dir === dir && c.dist === dist)

  if (!hasGrid && data.techRows.length === 0 && data.balance.pitchAvg == null) {
    return (
      <div style={card}>
        <div style={secTtl}>🎯 音の安定マップ</div>
        <div style={{ fontSize: 12.5, color: SUB }}>録音がたまると、どの音が安定していてどこが苦手かが見えてきます。まずは1曲弾いてみよう。</div>
      </div>
    )
  }

  return (
    <div style={card}>
      <div style={secTtl}>🎯 音の安定マップ（ミス率）</div>

      {hasGrid && (
        <>
          <div style={miniLbl}>音の動きかた別</div>
          <div style={{ display: "grid", gridTemplateColumns: "76px repeat(3,1fr)", gap: 5, fontSize: 10.5 }}>
            <span />
            {["同じ弦で", "となりの弦", "弦とばし"].map((h) => (
              <span key={h} style={{ fontWeight: 800, color: SUB, textAlign: "center", padding: "3px 0" }}>{h}</span>
            ))}
            {([["少し上へ", "up", "step"], ["少し下へ", "down", "step"], ["大きく上へ", "up", "leap"], ["大きく下へ", "down", "leap"]] as const).map(([label, dir, dist]) => (
              <FragmentRow key={label} label={label}>
                {cell(find("same", dir, dist))}
                {cell(find("adj", dir, dist))}
                {cell(find("skip", dir, dist))}
              </FragmentRow>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 9, fontSize: 10, color: SUB, fontWeight: 700 }}>
            <span>🟢 安定 (&lt;25%)</span><span>🟡 ゆらぎ</span><span>🔴 不安定 (&gt;50%)</span><span>⬜ データ少</span>
          </div>
        </>
      )}

      {data.techRows.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={miniLbl}>奏法・リズム別</div>
          {data.techRows.map((t) => {
            const r = Math.round((t.miss / t.target) * 100)
            const col = rateColor(t.miss, t.target)
            return (
              <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                <span style={{ width: 88, flex: "none", fontSize: 11.5, fontWeight: 700, color: "#4a5766" }}>{t.label}</span>
                <span style={{ flex: 1, height: 9, borderRadius: 5, background: "#eef0f4", overflow: "hidden" }}>
                  <span style={{ display: "block", height: "100%", borderRadius: 5, width: `${Math.min(100, r)}%`, background: col.c }} />
                </span>
                <b style={{ width: 38, flex: "none", textAlign: "right", fontSize: 11, color: col.c, fontVariantNumeric: "tabular-nums" }}>{r}%</b>
              </div>
            )
          })}
        </div>
      )}

      {data.balance.pitchAvg != null && data.balance.timingAvg != null && (
        <div style={{ marginTop: 14 }}>
          <div style={miniLbl}>音程（左手）とリズムのバランス</div>
          <div style={{ display: "flex", gap: 12 }}>
            {[
              { n: data.balance.pitchAvg, k: "音程（左手）", d: data.balance.pitchDelta, c: "#4a6cf7", bg: "#eef1fe" },
              { n: data.balance.timingAvg, k: "リズム", d: data.balance.timingDelta, c: "#e0872b", bg: "#fdf1e2" },
            ].map((b) => (
              <div key={b.k} style={{ flex: 1, textAlign: "center", borderRadius: 12, padding: "11px 4px", background: b.bg }}>
                <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1, color: b.c, fontVariantNumeric: "tabular-nums" }}>{b.n}</div>
                <div style={{ fontSize: 10.5, fontWeight: 800, marginTop: 4, color: b.c }}>{b.k}</div>
                {b.d != null && (
                  <div style={{ fontSize: 10, marginTop: 2, fontWeight: 700, color: b.d > 0 ? "#2e8b57" : "#aab2bb", fontVariantNumeric: "tabular-nums" }}>
                    {b.d >= 0 ? "▲ +" : "▼ "}{b.d} この期間
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ fontSize: 10.5, color: SUB, marginTop: 10, lineHeight: 1.6 }}>
        ※ 右手（ボウイング・音色）の解析は今後追加予定。
      </div>
    </div>
  )
}

function FragmentRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <span style={{ fontWeight: 800, color: "#4a5766", display: "flex", alignItems: "center", fontSize: 10.5 }}>{label}</span>
      {children}
    </>
  )
}

/* ── 3. 所見 ── */
function Insights({ data }: { data: KarteData }) {
  if (data.insights.length === 0) return null
  return (
    <div style={card}>
      <div style={secTtl}>💡 カルテの所見（データからの知見）</div>
      {data.insights.map((ins, i) => {
        const warn = ins.tone === "warn"
        return (
          <div key={i} style={{
            border: `1px solid ${warn ? "#ecdcb6" : "#cfe6d8"}`,
            background: warn ? "#fbf4e6" : "#e9f5ee",
            borderRadius: 13, padding: "12px 14px", marginBottom: 9,
          }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: warn ? "#8a5a10" : "#2e8b57", lineHeight: 1.55 }}>
              {warn ? "📌" : "🌱"} {ins.title}
            </div>
            <div style={{ fontSize: 11, color: warn ? "#7a6a4a" : "#4a6a56", marginTop: 7, lineHeight: 1.6 }}>
              根拠：{ins.evidence}
            </div>
            {ins.action && (
              <Link href={ins.action.href} style={{ display: "inline-block", marginTop: 9, fontSize: 11.5, fontWeight: 800, color: "#fff", background: "#c98a2a", borderRadius: 8, padding: "6px 13px", textDecoration: "none" }}>
                {ins.action.label}
              </Link>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── 4. 成長の物語 ── */
function Story({ data }: { data: KarteData }) {
  const [showAll, setShowAll] = useState(false)
  const KIND: Record<KarteData["events"][number]["kind"], { icon: string; color: string }> = {
    master: { icon: "🏆", color: "#b5651d" },
    achieve: { icon: "✨", color: "#2e8b57" },
    submit: { icon: "📤", color: "#4a5bd0" },
    feedback: { icon: "✍️", color: "#4a5bd0" },
    observation: { icon: "📋", color: "#5b6b9e" },
    celebration: { icon: "🎉", color: "#c98a2a" },
  }
  const events = showAll ? data.events : data.events.slice(0, 10)
  return (
    <div style={card}>
      <div style={secTtl}>📈 成長の物語</div>
      {data.events.length === 0 ? (
        <div style={{ fontSize: 12.5, color: SUB }}>まだ記録がありません。曲を弾いて、達成を目指そう。</div>
      ) : (
        <>
          <div style={{ position: "relative", paddingLeft: 20 }}>
            <span style={{ position: "absolute", left: 6, top: 4, bottom: 4, width: 2, background: "#e7e9ef" }} />
            {events.map((e, i) => (
              <div key={i} style={{ position: "relative", marginBottom: 12 }}>
                <span style={{ position: "absolute", left: -18, top: 3, width: 10, height: 10, borderRadius: "50%", background: KIND[e.kind].color, border: "2px solid #fff", boxShadow: `0 0 0 1.5px ${KIND[e.kind].color}` }} />
                <div style={{ fontSize: 10, color: "#aab2bb", fontWeight: 700 }}>{e.date}</div>
                <div style={{ fontSize: 12.5, color: INK, marginTop: 1, lineHeight: 1.5 }}>{KIND[e.kind].icon} {e.text}</div>
              </div>
            ))}
          </div>
          {data.events.length > 10 && (
            <button type="button" onClick={() => setShowAll((v) => !v)}
              style={{ width: "100%", marginTop: 4, border: "1px solid #e2e6ea", background: "#fff", color: SUB, borderRadius: 9, padding: 8, fontSize: 11.5, fontWeight: 800, cursor: "pointer" }}>
              {showAll ? "▲ 閉じる" : `▼ すべて見る（${data.events.length}件）`}
            </button>
          )}
        </>
      )}
    </div>
  )
}
