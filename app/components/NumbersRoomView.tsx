// 記録の分析の共有ビュー (2026-08-11): 生徒本人ページと先生の生徒閲覧ページで共用。
// リンク先(base)と戻り先を props で受ける。データは buildNumbersRoom の結果。
import Link from "next/link"
import { BarChart3, Sparkles, Music, Timer, Search, ArrowLeftRight } from "lucide-react"
import type { NumbersRoomData, KartePeriod } from "@/app/_libs/growthKarte"
import type { HeatmapData } from "@/app/_libs/fingerboard/heatmapTypes"
import FingerboardPanel, { type FingerboardMark } from "@/app/components/FingerboardPanel"

const SUB = "#8a9099"
const GOOD = "#0f8a4f"
const BAD = "#d0453a"
const GOLD = "#a97b1f"
const card: React.CSSProperties = { background: "#fff", border: "1px solid #eceff3", borderRadius: 12, padding: "13px 15px", marginBottom: 11 }
const ttl: React.CSSProperties = { fontSize: "var(--fs-body)", fontWeight: 900, marginBottom: 8 }
const tnum: React.CSSProperties = { fontVariantNumeric: "tabular-nums" }

function pctColor(pct: number) {
  return pct >= 85 ? GOOD : pct >= 70 ? "#c9752e" : BAD
}

function Row({ label, sub, pct }: { label: string; sub?: string; pct: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "var(--fs-caption)", marginBottom: 5 }}>
      <span style={{ width: 118, flex: "none", fontWeight: 700 }}>{label}</span>
      {sub && <span style={{ fontSize: "var(--fs-label)", color: SUB, flex: "none" }}>{sub}</span>}
      <span style={{ flex: 1, height: 6, borderRadius: 3, background: "#eceff3", overflow: "hidden" }}>
        <span style={{ display: "block", width: `${pct}%`, height: "100%", background: pctColor(pct) }} />
      </span>
      <b style={{ ...tnum, width: 40, flex: "none", textAlign: "right", color: pctColor(pct) }}>{pct}%</b>
    </div>
  )
}

export default function NumbersRoomView({ d, period, baseHref, backHref, backLabel, heatmap = null, fbMarks = [] }: {
  d: NumbersRoomData
  period: KartePeriod
  /** 期間切替リンクの土台 (例: /uid/progress/numbers) */
  baseHref: string
  backHref: string
  backLabel: string
  /** 指板ヒートマップ (2026-08-11 Tetsuo確定: 音のじっくり表/動きのにがて文章の代替・期間タブ連動) */
  heatmap?: HeatmapData | null
  fbMarks?: FingerboardMark[]
}) {
  const empty = d.keys.length === 0 && d.registers.length === 0 && d.worstNotes.length === 0
  const periodLabel = period === "7d" ? "今週" : period === "all" ? "全期間" : "直近30日"
  const lens = d.worstNotes[0] ?? null // 旧カルテ「いちばんの発見(虫めがね)」をここに集約

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "18px 14px 60px", color: "var(--text-ink)" }}>
      <Link href={backHref} style={{ fontSize: "var(--fs-body)", color: SUB, textDecoration: "none" }}>← {backLabel}</Link>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, margin: "8px 0 10px" }}>
        <h1 style={{ fontSize: "var(--fs-head)", fontWeight: 900, margin: 0, display: "inline-flex", alignItems: "center", gap: 6 }}><BarChart3 size={18} color="#3555d4" /> 記録の分析</h1>
      </div>
      {/* 期間切替 (期間が効くのはこの部屋だけ) */}
      <div style={{ display: "flex", gap: 4, background: "#eceef2", borderRadius: 10, padding: 3, marginBottom: 12 }}>
        {([["7d", "今週"], ["30d", "直近30日"], ["all", "全期間"]] as const).map(([pp, label]) => (
          <Link key={pp} href={`${baseHref}${pp === "30d" ? "" : `?period=${pp}`}`} scroll={false}
            style={{
              flex: 1, textAlign: "center", fontSize: "var(--fs-body)", fontWeight: 800, padding: "7px 0", borderRadius: 8,
              textDecoration: "none",
              color: period === pp ? "#1a2028" : "#8b97a3",
              background: period === pp ? "#fff" : "transparent",
            }}>
            {label}
          </Link>
        ))}
      </div>

      {empty ? (
        <div style={card}><div style={{ fontSize: "var(--fs-body)", color: SUB, lineHeight: 1.8 }}>この期間の録音がまだ少ないよ。録音がたまると、調・音・移動ごとの数字がここに並びます。</div></div>
      ) : (
        <>
          {lens && (
            <div style={{ ...card, borderColor: "#e7b8d0", background: "linear-gradient(155deg,#fff,#fdf1f6)" }}>
              <div style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: "#a4527a", display: "inline-flex", alignItems: "center", gap: 4 }}><Search size={12} /> {periodLabel}の録音ぜんぶから見つけた</div>
              <div style={{ fontSize: 27, fontWeight: 900, marginTop: 2, lineHeight: 1.15 }}>
                {lens.kana} <span style={{ fontSize: "var(--fs-caption)", color: SUB, fontWeight: 800 }}>{lens.hand ? `${lens.hand}・推定` : lens.string ? `${lens.string}・推定` : lens.raw}</span>
              </div>
              <div style={{ fontSize: "var(--fs-caption)", color: "#6a5f48", marginTop: 4, lineHeight: 1.7 }}>
                成功 <b style={{ ...tnum, color: pctColor(lens.pct) }}>{lens.pct}%</b>。この期間でいちばんずれやすい音だよ。
                {lens.cents != null && Math.abs(lens.cents) >= 15 && <>・平均 {lens.cents < 0 ? `ぶら下がり ${lens.cents}` : `上ずり +${lens.cents}`}セント</>}
                <span style={{ color: GOLD, fontWeight: 800 }}> 処方はホームのおすすめに出しておくね。</span>
              </div>
            </div>
          )}
          {d.weekMoved.length > 0 && (
            <div style={{ ...card, borderColor: "#d8dcf0" }}>
              <div style={{ ...ttl, display: "flex", alignItems: "center", gap: 6 }}><Sparkles size={14} color="#3555d4" /> 今週うごいた枝</div>
              <div style={{ fontSize: "var(--fs-body)", lineHeight: 2 }}>
                {d.weekMoved.map((w) => (
                  <span key={w.label} style={{ marginRight: 14, whiteSpace: "nowrap" }}>
                    {w.label} <b style={{ ...tnum, color: w.delta > 0 ? GOOD : BAD }}>{w.delta > 0 ? `↑${w.delta}` : `↓${-w.delta}`}</b>
                  </span>
                ))}
              </div>
            </div>
          )}

          {d.keys.length > 0 && (
            <div style={card}>
              <div style={{ ...ttl, display: "flex", alignItems: "center", gap: 6 }}><Music size={14} /> 調べつ <span style={{ fontSize: "var(--fs-label)", color: SUB, fontWeight: 800 }}>演奏スコア平均・低い順</span></div>
              {d.keys.map((k) => <Row key={k.label} label={k.label} sub={`${k.count}回`} pct={k.pct} />)}
            </div>
          )}

          {d.tempoBands.length > 0 && (
            <div style={card}>
              <div style={{ ...ttl, display: "flex", alignItems: "center", gap: 6 }}><Timer size={14} /> テンポ帯べつ <span style={{ fontSize: "var(--fs-label)", color: SUB, fontWeight: 800 }}>曲のテンポで分類</span></div>
              {d.tempoBands.map((t) => <Row key={t.label} label={t.label} sub={`${t.count}回`} pct={t.pct} />)}
              <div style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)", marginTop: 4 }}>※ 録音がたまるほど、アルコの見方がくわしくなるよ</div>
            </div>
          )}

          {/* 音程マップ = 指板ヒートマップ (2026-08-11 Tetsuo確定):
              旧「音のじっくり表」「動きのにがて」の文章一覧を指板に置換。
              動き(遷移)はセルをタップした詳細に出る。リズム系は上のカードのまま */}
          {heatmap && (
            <div style={card}>
              <div style={{ ...ttl, display: "flex", alignItems: "center", gap: 6 }}><Search size={14} /> 音程マップ <span style={{ fontSize: "var(--fs-label)", color: SUB, fontWeight: 800 }}>{periodLabel}・タップで くわしく</span></div>
              <FingerboardPanel cells={heatmap.cells} details={heatmap.details} marks={fbMarks}
                emptyText={`${periodLabel}はまだ判定できる音が少ないよ・同じ音を5回以上ひくと色がつくよ。`} />
              {fbMarks.length > 0 && (
                <div style={{ fontSize: "var(--fs-label)", color: "#6b4a12", marginTop: 6 }}>
                  橙の旗 = 先生の「気をつける音」だよ。タップすると一言が読めるよ。
                </div>
              )}
            </div>
          )}

          {d.posShifts.length > 0 && (
            <div style={{ ...card, marginBottom: 0 }}>
              <div style={{ ...ttl, display: "flex", alignItems: "center", gap: 6 }}><ArrowLeftRight size={14} /> ポジション移動べつ <span style={{ fontSize: "var(--fs-label)", color: SUB, fontWeight: 800 }}>左手の移動・にがて順</span></div>
              {d.posShifts.map((p) => <Row key={p.label} label={p.label} sub={`${p.target}回`} pct={p.pct} />)}
              <div style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)", marginTop: 4 }}>※ ポジション移動をふくむ曲・教材を弾くと集計されるよ</div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
