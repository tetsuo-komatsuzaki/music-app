// 記録の分析の共有ビュー — 確定モック 追10 NUMBERS (build-tmodeb.py) の写経 (2026-08-22)。
// back「‹ カルテ」・ ds.t ・ 期間セグ(7日/30日/すべて ・ TRAJセグ様式) ・ DSカード ・
// 音程マップ(注記=期間タブと連動 ・ 先生の気をつける音) ・ 得意/苦手grid2 ・
// 今週うごいた枝=▲▼チップ。調/テンポ/移動の各カードは現行のデータ分割を維持しダーク化。
// 生徒本人ページと先生の生徒閲覧ページで共用。
import Link from "next/link"
import type { NumbersRoomData, KartePeriod } from "@/app/_libs/growthKarte"
import type { HeatmapData } from "@/app/_libs/fingerboard/heatmapTypes"
import FingerboardPanel, { type FingerboardMark } from "@/app/components/FingerboardPanel"
import ds from "@/app/components/ds.module.css"

const tnum: React.CSSProperties = { fontVariantNumeric: "tabular-nums" }

// 原本 追10 の枝色: 良=緑 / 中=アンバー / 低=赤 (バー塗り)。文字は明るい同系
function fillColor(pct: number) {
  return pct >= 85 ? "#2e7d5b" : pct >= 70 ? "#d97b2e" : "#b44b4b"
}
function inkColor(pct: number) {
  return pct >= 85 ? "#a8c97f" : pct >= 70 ? "#e0b25c" : "#e8a78f"
}

function Row({ label, sub, pct }: { label: string; sub?: string; pct: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "var(--fs-caption)", marginBottom: 6 }}>
      <span style={{ width: 118, flex: "none", fontWeight: 700, color: "var(--text-ink)" }}>{label}</span>
      {sub && <span style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)", flex: "none" }}>{sub}</span>}
      <span className={ds.bar} style={{ flex: 1, height: 6 }}>
        <i style={{ width: `${pct}%`, background: fillColor(pct) }} />
      </span>
      <b style={{ ...tnum, width: 40, flex: "none", textAlign: "right", color: inkColor(pct) }}>{pct}%</b>
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
  const periodLabel = period === "7d" ? "7日" : period === "all" ? "すべて" : "30日"
  const lens = d.worstNotes[0] ?? null // 旧カルテ「いちばんの発見(虫めがね)」をここに集約

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
          const on = period === pp
          return (
            <Link key={pp} href={`${baseHref}${pp === "30d" ? "" : `?period=${pp}`}`} scroll={false}
              style={{
                flex: 1, textAlign: "center", fontSize: "var(--fs-caption)", fontWeight: 800, padding: "7px 0", borderRadius: 8,
                textDecoration: "none",
                color: on ? "var(--gold)" : "var(--text-sub)",
                background: on ? "linear-gradient(180deg,#22355e,#182747)" : "transparent",
                boxShadow: on ? "inset 0 0 0 1px rgba(232,178,60,.28)" : "none",
              }}>
              {label}
            </Link>
          )
        })}
      </div>

      {empty ? (
        <div className={ds.card} style={{ padding: "13px 15px" }}>
          <div style={{ fontSize: "var(--fs-body)", color: "var(--text-sub)", lineHeight: 1.8 }}>この期間の録音がまだ少ないよ。録音がたまると、調・音・移動ごとの数字がここに並びます。</div>
        </div>
      ) : (
        <>
          {/* 音程マップ (原本: 注記=期間タブと連動 ・ 先生の気をつける音) */}
          {heatmap && (
            <div className={ds.card} style={{ padding: "13px 15px" }}>
              <div className={ds.lab}>音程マップ</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", margin: "4px 0 9px" }}>
                期間タブと連動{fbMarks.length > 0 ? " ・ 橙の旗 = 先生の「気をつける音」" : " ・ 先生の「気をつける音」も出る"}
              </div>
              <FingerboardPanel cells={heatmap.cells} details={heatmap.details} marks={fbMarks}
                emptyText={`この期間はまだ判定できる音が少ないよ・同じ音を5回以上ひくと色がつくよ。`} />
            </div>
          )}

          {/* いちばんの発見 (虫めがね ・ 桃系) */}
          {lens && (
            <div className={ds.card} style={{ padding: "13px 15px", borderColor: "rgba(232,155,168,.3)" }}>
              <div style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: "#e89ba8" }}>{periodLabel}の録音ぜんぶから見つけた</div>
              <div style={{ fontSize: 27, fontWeight: 900, marginTop: 2, lineHeight: 1.15, color: "var(--text-ink)" }}>
                {lens.kana} <span style={{ fontSize: "var(--fs-caption)", color: "var(--text-sub)", fontWeight: 800 }}>{lens.hand ? `${lens.hand}・推定` : lens.string ? `${lens.string}・推定` : lens.raw}</span>
              </div>
              <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-sub)", marginTop: 4, lineHeight: 1.7 }}>
                成功 <b style={{ ...tnum, color: inkColor(lens.pct) }}>{lens.pct}%</b>。この期間でいちばんずれやすい音だよ。
                {lens.cents != null && Math.abs(lens.cents) >= 15 && <>・平均 {lens.cents < 0 ? `ぶら下がり ${lens.cents}` : `上ずり +${lens.cents}`}セント</>}
                <span style={{ color: "var(--gold)", fontWeight: 800 }}> 処方はホームのおすすめに出しておくね。</span>
              </div>
            </div>
          )}

          {/* 得意 / 苦手 (原本 grid2) */}
          {(d.bestNotes.length > 0 || d.worstNotes.length > 0) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
              <div className={ds.card} style={{ margin: 0, padding: "13px 14px" }}>
                <div className={ds.lab} style={{ color: "#a8c97f" }}>得意</div>
                <div style={{ fontSize: 12, marginTop: 6, lineHeight: 1.9, color: "var(--text-ink)" }}>
                  {d.bestNotes.slice(0, 3).map((n) => <span key={n.raw} style={{ display: "block" }}>{n.kana}</span>)}
                  {d.bestNotes.length === 0 && <span style={{ color: "var(--text-muted)" }}>集計中</span>}
                </div>
              </div>
              <div className={ds.card} style={{ margin: 0, padding: "13px 14px" }}>
                <div className={ds.lab} style={{ color: "#e8a78f" }}>苦手</div>
                <div style={{ fontSize: 12, marginTop: 6, lineHeight: 1.9, color: "var(--text-ink)" }}>
                  {d.worstNotes.slice(0, 3).map((n) => <span key={n.raw} style={{ display: "block" }}>{n.kana}{n.string ? ` ・ ${n.string}` : ""}</span>)}
                  {d.worstNotes.length === 0 && <span style={{ color: "var(--text-muted)" }}>集計中</span>}
                </div>
              </div>
            </div>
          )}

          {/* 今週うごいた枝 (原本: ▲▼チップ) */}
          {d.weekMoved.length > 0 && (
            <div className={ds.card} style={{ padding: "13px 15px" }}>
              <div className={ds.lab}>今週うごいた枝</div>
              {d.weekMoved.map((w, i) => (
                <div key={w.label} style={{ display: "flex", alignItems: "center", gap: 9, marginTop: i === 0 ? 9 : 8 }}>
                  <span style={{
                    ...tnum, fontSize: 10.5, fontWeight: 900, borderRadius: 7, padding: "2px 8px", flex: "none",
                    background: w.delta > 0 ? "rgba(168,201,127,.16)" : "rgba(232,138,111,.14)",
                    color: w.delta > 0 ? "#a8c97f" : "#e8a78f",
                    border: `1px solid ${w.delta > 0 ? "rgba(168,201,127,.3)" : "rgba(232,138,111,.3)"}`,
                  }}>
                    {w.delta > 0 ? `▲ +${w.delta}` : `▼ ${w.delta}`}
                  </span>
                  <span style={{ fontSize: 12.5, color: "var(--text-ink)" }}>{w.label}</span>
                </div>
              ))}
            </div>
          )}

          {d.keys.length > 0 && (
            <div className={ds.card} style={{ padding: "13px 15px" }}>
              <div className={ds.lab}>調べつ <span style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)", fontWeight: 800 }}>演奏スコア平均 ・ 低い順</span></div>
              <div style={{ marginTop: 9 }}>
                {d.keys.map((k) => <Row key={k.label} label={k.label} sub={`${k.count}回`} pct={k.pct} />)}
              </div>
            </div>
          )}

          {d.tempoBands.length > 0 && (
            <div className={ds.card} style={{ padding: "13px 15px" }}>
              <div className={ds.lab}>テンポ帯べつ <span style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)", fontWeight: 800 }}>曲のテンポで分類</span></div>
              <div style={{ marginTop: 9 }}>
                {d.tempoBands.map((t) => <Row key={t.label} label={t.label} sub={`${t.count}回`} pct={t.pct} />)}
              </div>
              <div style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)", marginTop: 4 }}>※ 録音がたまるほど、アルコの見方がくわしくなるよ</div>
            </div>
          )}

          {d.posShifts.length > 0 && (
            <div className={ds.card} style={{ padding: "13px 15px" }}>
              <div className={ds.lab}>ポジション移動べつ <span style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)", fontWeight: 800 }}>左手の移動 ・ にがて順</span></div>
              <div style={{ marginTop: 9 }}>
                {d.posShifts.map((p) => <Row key={p.label} label={p.label} sub={`${p.target}回`} pct={p.pct} />)}
              </div>
              <div style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)", marginTop: 4 }}>※ ポジション移動をふくむ曲・教材を弾くと集計されるよ</div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
