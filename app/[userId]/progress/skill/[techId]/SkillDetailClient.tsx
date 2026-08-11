"use client"

// 技術の詳細分析 UI (モック743beec0準拠)。
// ①指導注釈つき推移グラフ ②先生の指導履歴 ③聴き比べ ④処方箋。
import Link from "next/link"
import { TrendingUp, GraduationCap, MessageCircle, Headphones, Lightbulb, Target, ClipboardList, Sprout } from "lucide-react"
import type { SkillDetailData } from "@/app/_libs/growthKarte"

const INK = "#2b3742"
const SUB = "#8a9099"
const GOOD = "#2e8b57"
const BAD = "#c0473a"
const ACCENT = "#3555d4"

const card: React.CSSProperties = {
  background: "#fff", border: "1px solid #eceff3", borderRadius: 12,
  padding: "15px 16px", marginBottom: 12, boxShadow: "0 1px 3px rgba(30,45,70,.04)",
}
const secTtl: React.CSSProperties = { fontSize: "var(--fs-body)", fontWeight: 800, margin: "0 0 10px" }

const GLYPH: Record<string, string> = {
  slur: "〰", staccato: "•", portato: "‿", bow_staccato: "•••", tremolo: "≋",
  pizzicato: "pz", spiccato: "sp", ricochet: "ric",
  position: "↕", double: "♬", trill: "tr", mordent: "≈", vibrato: "∿",
  glissando: "⤴", harmonic: "◯",
}

const STATE_LABEL: Record<SkillDetailData["state"], string> = {
  stable: "習得済み・安定",
  wobble: "習得済み・ゆらぎ中",
  acquired_nodata: "習得済み（データ集め中）",
  ready: "これから挑戦",
  locked: "まだ先（★が足りない）",
}

export default function SkillDetailClient({ userId, data }: { userId: string; data: SkillDetailData }) {
  const wob = data.state === "wobble"
  const col = wob ? BAD : data.state === "stable" ? GOOD : SUB

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "18px 14px 60px", color: INK }}>
      <Link href={`/${userId}/progress`} style={{ fontSize: "var(--fs-body)", color: SUB, textDecoration: "none" }}>← 成長カルテ</Link>

      {/* ヘッダー */}
      <div style={{ ...card, marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 50, height: 50, borderRadius: "50%", flex: "none", display: "grid", placeItems: "center", fontSize: "var(--fs-title)", fontWeight: 800, border: `2.5px solid ${col}`, background: wob ? "#fbecea" : data.state === "stable" ? "#e9f5ee" : "#f2f4f7" }}>
            {GLYPH[data.id] ?? "♪"}
          </span>
          <div>
            <div style={{ fontSize: "var(--fs-head)", fontWeight: 900 }}>{data.label}</div>
            <span style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: col, background: wob ? "#fbecea" : data.state === "stable" ? "#e9f5ee" : "#f2f4f7", border: "1px solid #eceef2", borderRadius: 999, padding: "2px 9px", display: "inline-block", marginTop: 3 }}>
              {STATE_LABEL[data.state]}{data.provisional ? "・仮習得" : ""}
            </span>
          </div>
          {data.pct != null && (
            <div style={{ marginLeft: "auto", textAlign: "center" }}>
              <div style={{ fontSize: "var(--fs-title)", fontWeight: 900, color: col, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{data.pct}<span style={{ fontSize: "var(--fs-body)" }}>%</span></div>
              <div style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: SUB, marginTop: 2 }}>安定度</div>
            </div>
          )}
        </div>
        {data.pct != null && (
          <div style={{ fontSize: "var(--fs-label)", color: SUB, marginTop: 8 }}>※ この技術が出てくる音（全期間 {data.target}音）の音程・リズムから算出</div>
        )}
      </div>

      {/* ① 推移 + 指導注釈 */}
      <div style={card}>
        <div style={{ ...secTtl, display: "flex", alignItems: "center", gap: 6 }}><TrendingUp size={15} color={ACCENT} /> 安定度の推移と、指導の効果</div>
        {data.series.length < 2 ? (
          <div style={{ fontSize: "var(--fs-body)", color: SUB, lineHeight: 1.7 }}>
            この技術が出てくる録音がまだ{data.series.length}回です。録音がたまると、推移と指導の効果がここに描かれます。
          </div>
        ) : (
          <Chart data={data} />
        )}
        {data.effect && (
          <div style={{ marginTop: 12, border: `1px solid ${data.effect.delta >= 0 ? "#cfe6d8" : "#f0d4d0"}`, background: data.effect.delta >= 0 ? "#e9f5ee" : "#fbecea", borderRadius: 10, padding: "9px 12px", fontSize: "var(--fs-caption)", fontWeight: 700, color: data.effect.delta >= 0 ? "#2e6b47" : "#8a4a44", lineHeight: 1.6 }}>
            {data.effect.delta >= 5
              ? <><Sprout size={13} style={{ verticalAlign: -2 }} /> {`${data.effect.label}のあと、安定度が +${data.effect.delta}。指導が効いています！`}</>
              : data.effect.delta <= -5
                ? `${data.effect.label}のあと、安定度が ${data.effect.delta}。次のレッスンで相談してみよう。`
                : `${data.effect.label}のあとの安定度は ${data.effect.delta >= 0 ? "+" : ""}${data.effect.delta}（大きな変化はまだ）`}
          </div>
        )}
      </div>

      {/* ② 先生が気づいた癖 (2026-08-11 改名: 実体は癖記録の技術別抜粋。ゼロ件なら非表示) */}
      {data.guidance.length > 0 && (
      <div style={card}>
        <div style={{ ...secTtl, display: "flex", alignItems: "center", gap: 6 }}><GraduationCap size={15} color={ACCENT} /> 先生が気づいた癖（この技術に関わるもの）</div>
        {(
          <div style={{ borderLeft: "3px solid #d7dcf6", paddingLeft: 12 }}>
            {data.guidance.map((g, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)", fontWeight: 700 }}>{g.date}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, margin: "4px 0" }}>
                  {g.severity === "focus" && (
                    <span style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: BAD, background: "#fbecea", border: "1px solid #f0d4d0", borderRadius: 999, padding: "2px 8px" }}>要重点</span>
                  )}
                  {g.tags.map((t) => (
                    <span key={t} style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: ACCENT, background: "#eef0fc", border: "1px solid #d7dcf6", borderRadius: 7, padding: "2px 8px" }}>{t}</span>
                  ))}
                </div>
                {g.comment && (
                  <div style={{ fontSize: "var(--fs-body)", color: "var(--text-body)", lineHeight: 1.65, background: "#fafbfc", border: "1px solid #eceef2", borderRadius: 9, padding: "8px 10px", marginTop: 4, display: "flex", gap: 5 }}><MessageCircle size={13} style={{ flex: "none", marginTop: 2 }} /> <span>{g.comment}</span></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* ③ 聴き比べ */}
      {data.listen && (
        <div style={card}>
          <div style={{ ...secTtl, display: "flex", alignItems: "center", gap: 6 }}><Headphones size={15} color={ACCENT} /> 聴き比べ — 耳でわかる成長</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { l: `はじめの頃（${data.listen.old.date}）`, it: data.listen.old, c: SUB },
              { l: `いま（${data.listen.new.date}）`, it: data.listen.new, c: GOOD },
            ].map(({ l, it, c }) => (
              <div key={l} style={{ border: "1px solid #eceef2", background: "#fafbfc", borderRadius: 12, padding: 10 }}>
                <div style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: SUB, marginBottom: 6 }}>{l}</div>
                <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-body)", marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.title}</div>
                {it.audioUrl ? (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <audio controls preload="none" src={it.audioUrl} style={{ width: "100%", height: 32 }} />
                ) : (
                  <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)" }}>音がうまく開けなかったよ</div>
                )}
                {it.pct != null && (
                  <div style={{ fontSize: "var(--fs-caption)", fontWeight: 800, marginTop: 6, color: c, fontVariantNumeric: "tabular-nums" }}>{data.label}の安定度 {it.pct}%</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ④ おすすめ練習 (2026-08-11 改名+推薦エンジン連携: ホーム④と同じロジックからこの技術に効く教材) */}
      <div style={{ ...card, marginBottom: 0 }}>
        <div style={{ border: "1px solid #d7dcf6", background: "#f4f7fd", borderRadius: 12, padding: "11px 13px" }}>
          <div style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: ACCENT, marginBottom: 5, display: "flex", alignItems: "center", gap: 5 }}><Lightbulb size={13} /> おすすめ練習</div>
          {data.recommended.length > 0 ? (
            <>
              <div style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)", marginBottom: 7 }}>きみの録音の弱点から、この技術に効く教材を選んだよ。</div>
              {data.recommended.map((m) => (
                <Link key={m.id} href={`/${userId}/practice/${m.category}/${m.id}`}
                  style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #e0e9f6", borderRadius: 10, padding: "9px 11px", marginBottom: 6, textDecoration: "none", color: "var(--text-ink)" }}>
                  {m.star != null && <span style={{ flex: "none", fontSize: "var(--fs-label)", fontWeight: 900, color: "#b58a1e" }}>★{m.star}</span>}
                  <b style={{ fontSize: "var(--fs-body)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.title}</b>
                  <span style={{ marginLeft: "auto", flex: "none", fontSize: "var(--fs-caption)", fontWeight: 800, color: ACCENT }}>ひらく →</span>
                </Link>
              ))}
            </>
          ) : (
            <div style={{ fontSize: "var(--fs-body)", color: "var(--text-body)", lineHeight: 1.7 }}>
              録音がたまると、きみの弱点に合わせた教材がここに出ます。
            </div>
          )}
          <Link href={data.practiceHref}
            style={{ display: "inline-block", marginTop: 6, fontSize: "var(--fs-caption)", fontWeight: 800, color: ACCENT, textDecoration: "none" }}>
            {data.label}の教材いちらんを見る →
          </Link>
        </div>
      </div>
    </div>
  )
}

/* 時間比例X軸の折れ線 + 注釈マーカー */
function Chart({ data }: { data: SkillDetailData }) {
  const W = 420
  const H = 110
  const PAD = 14
  const t0 = data.series[0].at
  const t1 = data.series[data.series.length - 1].at
  const span = Math.max(1, t1 - t0)
  const x = (at: number) => PAD + ((at - t0) / span) * (W - 2 * PAD)
  const y = (pct: number) => H - PAD - (pct / 100) * (H - 2 * PAD)
  const pts = data.series.map((s) => `${x(s.at)},${y(s.pct)}`).join(" ")
  const last = data.series[data.series.length - 1]
  const annos = data.annotations.filter((a) => a.at >= t0 - span * 0.05 && a.at <= t1 + span * 0.05)

  return (
    <div>
      <div style={{ position: "relative" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="110" preserveAspectRatio="none">
          {[25, 50, 75].map((p) => (
            <line key={p} x1={PAD} y1={y(p)} x2={W - PAD} y2={y(p)} stroke="#eef0f4" strokeWidth="1" />
          ))}
          {annos.map((a, i) => (
            <line key={i} x1={x(a.at)} y1={PAD - 4} x2={x(a.at)} y2={H - PAD} stroke={a.kind === "lesson_clear" ? "#c98a2a" : "#c0473a"} strokeWidth="1.4" strokeDasharray="3 3" />
          ))}
          <polyline points={pts} fill="none" stroke="#3555d4" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
          {data.series.map((s, i) => (
            <circle key={i} cx={x(s.at)} cy={y(s.pct)} r={i === data.series.length - 1 ? 4.2 : 2.6} fill="#3555d4" stroke="#fff" strokeWidth="1.5" />
          ))}
        </svg>
        {/* 注釈ラベル */}
        {annos.slice(-3).map((a, i) => (
          <span key={i} style={{
            position: "absolute", top: -2 + i * 16, left: `${(x(a.at) / W) * 100}%`, transform: "translateX(-50%)",
            fontSize: "var(--fs-label)", fontWeight: 800, whiteSpace: "nowrap",
            color: a.kind === "lesson_clear" ? "#8a5a10" : "#c0473a",
            background: "#fff", border: "1px solid #eceef2", borderRadius: 6, padding: "1px 6px",
            boxShadow: "0 1px 3px rgba(30,45,70,.12)",
          }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>{a.kind === "lesson_clear" ? <Target size={10} /> : <ClipboardList size={10} />}{a.label.slice(0, 12)}</span>
          </span>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-label)", color: "var(--text-muted)", marginTop: 3 }}>
        <span>{data.series[0].date}</span>
        <span>{last.date}</span>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: "var(--fs-label)", color: SUB, fontWeight: 700 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><ClipboardList size={11} /> = 先生の所見</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Target size={11} /> = レッスンクリア</span>
        <span>点 = 録音ごとの安定度</span>
      </div>
    </div>
  )
}
