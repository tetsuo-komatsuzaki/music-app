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
const secTtl: React.CSSProperties = { fontSize: 12.5, fontWeight: 800, margin: "0 0 10px" }

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
      <Link href={`/${userId}/progress`} style={{ fontSize: 12, color: SUB, textDecoration: "none" }}>← 成長カルテ</Link>

      {/* ヘッダー */}
      <div style={{ ...card, marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 50, height: 50, borderRadius: "50%", flex: "none", display: "grid", placeItems: "center", fontSize: 22, fontWeight: 800, border: `2.5px solid ${col}`, background: wob ? "#fbecea" : data.state === "stable" ? "#e9f5ee" : "#f2f4f7" }}>
            {GLYPH[data.id] ?? "♪"}
          </span>
          <div>
            <div style={{ fontSize: 17, fontWeight: 900 }}>{data.label}</div>
            <span style={{ fontSize: 10.5, fontWeight: 800, color: col, background: wob ? "#fbecea" : data.state === "stable" ? "#e9f5ee" : "#f2f4f7", border: "1px solid #eceef2", borderRadius: 999, padding: "2px 9px", display: "inline-block", marginTop: 3 }}>
              {STATE_LABEL[data.state]}{data.provisional ? "・仮習得" : ""}
            </span>
          </div>
          {data.pct != null && (
            <div style={{ marginLeft: "auto", textAlign: "center" }}>
              <div style={{ fontSize: 25, fontWeight: 900, color: col, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{data.pct}<span style={{ fontSize: 12 }}>%</span></div>
              <div style={{ fontSize: 9, fontWeight: 800, color: SUB, marginTop: 2 }}>安定度</div>
            </div>
          )}
        </div>
        {data.pct != null && (
          <div style={{ fontSize: 10, color: SUB, marginTop: 8 }}>※ この技術が出てくる音（全期間 {data.target}音）の音程・リズムから算出</div>
        )}
      </div>

      {/* ① 推移 + 指導注釈 */}
      <div style={card}>
        <div style={{ ...secTtl, display: "flex", alignItems: "center", gap: 6 }}><TrendingUp size={15} color={ACCENT} /> 安定度の推移と、指導の効果</div>
        {data.series.length < 2 ? (
          <div style={{ fontSize: 12, color: SUB, lineHeight: 1.7 }}>
            この技術が出てくる録音がまだ{data.series.length}回です。録音がたまると、推移と指導の効果がここに描かれます。
          </div>
        ) : (
          <Chart data={data} />
        )}
        {data.effect && (
          <div style={{ marginTop: 12, border: `1px solid ${data.effect.delta >= 0 ? "#cfe6d8" : "#f0d4d0"}`, background: data.effect.delta >= 0 ? "#e9f5ee" : "#fbecea", borderRadius: 10, padding: "9px 12px", fontSize: 11.5, fontWeight: 700, color: data.effect.delta >= 0 ? "#2e6b47" : "#8a4a44", lineHeight: 1.6 }}>
            {data.effect.delta >= 5
              ? <><Sprout size={13} style={{ verticalAlign: -2 }} /> {`${data.effect.label}のあと、安定度が +${data.effect.delta}。指導が効いています！`}</>
              : data.effect.delta <= -5
                ? `${data.effect.label}のあと、安定度が ${data.effect.delta}。次のレッスンで相談してみよう。`
                : `${data.effect.label}のあとの安定度は ${data.effect.delta >= 0 ? "+" : ""}${data.effect.delta}（大きな変化はまだ）`}
          </div>
        )}
      </div>

      {/* ② 先生からの指導 */}
      <div style={card}>
        <div style={{ ...secTtl, display: "flex", alignItems: "center", gap: 6 }}><GraduationCap size={15} color={ACCENT} /> 先生からの指導（この技術に関わる所見）</div>
        {data.guidance.length === 0 ? (
          <div style={{ fontSize: 12, color: SUB }}>この技術について、先生の所見はまだないよ</div>
        ) : (
          <div style={{ borderLeft: "3px solid #d7dcf6", paddingLeft: 12 }}>
            {data.guidance.map((g, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: "#aab2bb", fontWeight: 700 }}>{g.date}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, margin: "4px 0" }}>
                  {g.severity === "focus" && (
                    <span style={{ fontSize: 10, fontWeight: 800, color: BAD, background: "#fbecea", border: "1px solid #f0d4d0", borderRadius: 999, padding: "2px 8px" }}>要重点</span>
                  )}
                  {g.tags.map((t) => (
                    <span key={t} style={{ fontSize: 10, fontWeight: 800, color: ACCENT, background: "#eef0fc", border: "1px solid #d7dcf6", borderRadius: 7, padding: "2px 8px" }}>{t}</span>
                  ))}
                </div>
                {g.comment && (
                  <div style={{ fontSize: 12, color: "#4a5766", lineHeight: 1.65, background: "#fafbfc", border: "1px solid #eceef2", borderRadius: 9, padding: "8px 10px", marginTop: 4, display: "flex", gap: 5 }}><MessageCircle size={13} style={{ flex: "none", marginTop: 2 }} /> <span>{g.comment}</span></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

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
                <div style={{ fontSize: 10, fontWeight: 800, color: SUB, marginBottom: 6 }}>{l}</div>
                <div style={{ fontSize: 11, color: "#4a5766", marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.title}</div>
                {it.audioUrl ? (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <audio controls preload="none" src={it.audioUrl} style={{ width: "100%", height: 32 }} />
                ) : (
                  <div style={{ fontSize: 10.5, color: "#b3bcc6" }}>音がうまく開けなかったよ</div>
                )}
                {it.pct != null && (
                  <div style={{ fontSize: 11, fontWeight: 800, marginTop: 6, color: c, fontVariantNumeric: "tabular-nums" }}>{data.label}の安定度 {it.pct}%</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ④ 処方箋 */}
      <div style={{ ...card, marginBottom: 0 }}>
        <div style={{ border: "1px solid #ecdcb6", background: "#fbf4e6", borderRadius: 12, padding: "11px 13px" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#8a5a10", marginBottom: 5, display: "flex", alignItems: "center", gap: 5 }}><Lightbulb size={13} /> いまの処方箋</div>
          <div style={{ fontSize: 12, color: "#4a5766", lineHeight: 1.7 }}>
            {data.state === "wobble"
              ? `①ゆっくりのテンポで「${data.label}」の部分だけ取り出して練習 ②教材で形を確かめる ③安定したら曲に戻る`
              : data.state === "stable"
                ? `安定しています。テンポを上げる・より長いフレーズで維持できるか試してみよう`
                : data.state === "ready"
                  ? `挑戦できる技術です。まずは教材でフォームから始めよう`
                  : `録音がたまると、この技術に合わせた処方箋が出ます`}
          </div>
          <Link href={data.practiceHref}
            style={{ display: "inline-block", marginTop: 9, fontSize: 11.5, fontWeight: 800, color: "#fff", background: "#c98a2a", borderRadius: 8, padding: "7px 14px", textDecoration: "none" }}>
            {data.label}の教材を練習する →
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
            fontSize: 9, fontWeight: 800, whiteSpace: "nowrap",
            color: a.kind === "lesson_clear" ? "#8a5a10" : "#c0473a",
            background: "#fff", border: "1px solid #eceef2", borderRadius: 6, padding: "1px 6px",
            boxShadow: "0 1px 3px rgba(30,45,70,.12)",
          }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>{a.kind === "lesson_clear" ? <Target size={10} /> : <ClipboardList size={10} />}{a.label.slice(0, 12)}</span>
          </span>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#b3bcc6", marginTop: 3 }}>
        <span>{data.series[0].date}</span>
        <span>{last.date}</span>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 9.5, color: SUB, fontWeight: 700 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><ClipboardList size={11} /> = 先生の所見</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Target size={11} /> = レッスンクリア</span>
        <span>点 = 録音ごとの安定度</span>
      </div>
    </div>
  )
}
