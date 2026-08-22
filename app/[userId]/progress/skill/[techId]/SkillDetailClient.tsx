"use client"

// 技術の詳細分析 UI — 確定モック karte08 SKILL_DETAIL のヘッダ様式 + ダーク写経 (2026-08-22)。
// back「‹ わざの習得状況」・ h1 ds.t ・ subT「分類 ・ 状態」・ いまの状態カード
// (bigN38 + 金バー + 算出注記)。既存の機能章 (①推移+指導注釈 ②先生が気づいた癖
// ③聴き比べ ④おすすめ練習) は原本モックに無いが情報量維持で残置し、ダークトークンへ。
// (karte08 の「この わざが出てくる曲」はデータ未整備のため見送り ・ SPEC-CHANGES記録)
import Link from "next/link"
import { TrendingUp, GraduationCap, MessageCircle, Headphones, Lightbulb, Target, ClipboardList, Sprout } from "lucide-react"
import type { SkillDetailData } from "@/app/_libs/growthKarte"
import ds from "@/app/components/ds.module.css"

const SUB = "var(--text-sub)"
const GOOD = "#a8c97f"
const BAD = "#e8a78f"
const ACCENT = "#7fa4e8"

const card: React.CSSProperties = {
  background: "linear-gradient(180deg, var(--card-a), var(--card-b))",
  border: "1px solid var(--line)", borderRadius: 20,
  padding: "15px 16px", marginBottom: 12,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,.06), 0 2px 6px rgba(4,10,28,.35), 0 14px 34px -8px rgba(4,10,28,.55)",
}
const secTtl: React.CSSProperties = { fontSize: "var(--fs-body)", fontWeight: 800, margin: "0 0 10px", color: "var(--text-ink)" }

const STATE_LABEL: Record<SkillDetailData["state"], string> = {
  stable: "安定している",
  wobble: "ゆらぎ中",
  acquired_nodata: "習得ずみ",
  ready: "これから挑戦",
  locked: "まだ先",
}

// 分類ラベル (karte08 subT 用 ・ SkillsLevelClient と同一)
const CAT_OF: Record<string, string> = {
  slur: "弓", staccato: "弓", portato: "弓", bow_staccato: "弓", tremolo: "弓", spiccato: "弓", ricochet: "弓", pizzicato: "弓",
  position: "フィンガリング", double: "フィンガリング",
  trill: "装飾", mordent: "装飾", glissando: "装飾",
  vibrato: "音色・特殊", harmonic: "音色・特殊",
}

export default function SkillDetailClient({ userId, data }: { userId: string; data: SkillDetailData }) {
  const wob = data.state === "wobble"
  const col = wob ? BAD : data.state === "stable" ? GOOD : SUB

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 0 60px" }}>
      {/* 原本 karte08: back ‹ わざの習得状況 ・ h1 ・ subT 分類 ・ 状態 */}
      <Link href={`/${userId}/progress/skills`}
        style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--text-sub)", fontSize: 13, fontWeight: 700, padding: "10px 2px 2px", textDecoration: "none" }}>
        ‹ わざの習得状況
      </Link>
      <h1 className={ds.t} style={{ paddingTop: 0 }}>{data.label}</h1>
      <div style={{ color: "var(--text-sub)", fontSize: 13, padding: "5px 2px 0" }}>
        {CAT_OF[data.id] ?? "わざ"} ・ {STATE_LABEL[data.state]}{data.provisional ? " ・ 仮習得" : ""}
      </div>

      {/* いまの状態 (原本: bigN38 + 金バー + 注記) */}
      <div className={ds.card}>
        <div className={ds.lab}>いまの状態</div>
        {data.pct != null ? (
          <>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginTop: 6 }}>
              <div className={ds.bigN} style={{ fontSize: 38, lineHeight: 1 }}><span data-anim="count">{data.pct}</span></div>
              <span style={{ paddingBottom: 7, fontSize: 11, color: "var(--text-sub)", fontWeight: 700 }}>% ・ この技術の安定度</span>
            </div>
            <div className={`${ds.bar} ${ds.gold}`} data-anim="bar" style={{ marginTop: 10, ["--w" as string]: `${data.pct}%` }}>
              <i />
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-sub)", marginTop: 10, lineHeight: 1.75 }}>
              この技術が出てくる音 ・ 全期間{data.target}音の音程とリズムから算出しているよ。
            </div>
          </>
        ) : (
          <div style={{ fontSize: 11.5, color: "var(--text-sub)", marginTop: 8, lineHeight: 1.75 }}>
            まだ判定できる録音がないよ。この技術が出てくる曲や教材を弾くと、ここに安定度が出るよ。
          </div>
        )}
      </div>

      {/* ① 推移 + 指導注釈 (残置 ・ ダーク化) */}
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
          <div style={{ marginTop: 12, background: data.effect.delta >= 0 ? "rgba(168,201,127,.13)" : "rgba(232,138,111,.13)", borderRadius: 10, padding: "9px 12px", fontSize: "var(--fs-caption)", fontWeight: 700, color: data.effect.delta >= 0 ? GOOD : BAD, lineHeight: 1.6 }}>
            {data.effect.delta >= 5
              ? <><Sprout size={13} style={{ verticalAlign: -2 }} /> {`${data.effect.label}のあと、安定度が +${data.effect.delta}。指導が効いています！`}</>
              : data.effect.delta <= -5
                ? `${data.effect.label}のあと、安定度が ${data.effect.delta}。次のレッスンで相談してみよう。`
                : `${data.effect.label}のあとの安定度は ${data.effect.delta >= 0 ? "+" : ""}${data.effect.delta}`}
          </div>
        )}
      </div>

      {/* ② 先生が気づいた癖 (2026-08-11 改名: 実体は癖記録の技術別抜粋。ゼロ件なら非表示) */}
      {data.guidance.length > 0 && (
      <div style={card}>
        <div style={{ ...secTtl, display: "flex", alignItems: "center", gap: 6 }}><GraduationCap size={15} color={ACCENT} /> 先生が気づいた癖</div>
        {(
          <div style={{ borderLeft: "3px solid rgba(150,175,225,.22)", paddingLeft: 12 }}>
            {data.guidance.map((g, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)", fontWeight: 700 }}>{g.date}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, margin: "4px 0" }}>
                  {g.severity === "focus" && (
                    <span style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: BAD, background: "rgba(232,138,111,.14)", borderRadius: 999, padding: "2px 8px" }}>要重点</span>
                  )}
                  {g.tags.map((t) => (
                    <span key={t} style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: "#9db8e8", background: "rgba(43,91,196,.22)", borderRadius: 7, padding: "2px 8px" }}>{t}</span>
                  ))}
                </div>
                {g.comment && (
                  <div style={{ fontSize: "var(--fs-body)", color: "var(--text-ink)", lineHeight: 1.65, background: "var(--card-in)", border: "1px solid rgba(150,175,225,.08)", borderRadius: 9, padding: "8px 10px", marginTop: 4, display: "flex", gap: 5 }}><MessageCircle size={13} style={{ flex: "none", marginTop: 2 }} /> <span>{g.comment}</span></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* ③ 聴き比べ (残置 ・ ダーク化) */}
      {data.listen && (
        <div style={card}>
          <div style={{ ...secTtl, display: "flex", alignItems: "center", gap: 6 }}><Headphones size={15} color={ACCENT} /> 聴き比べ — 耳でわかる成長</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { l: `はじめの頃・${data.listen.old.date}`, it: data.listen.old, c: SUB },
              { l: `いま・${data.listen.new.date}`, it: data.listen.new, c: GOOD },
            ].map(({ l, it, c }) => (
              <div key={l} style={{ background: "var(--card-in)", border: "1px solid rgba(150,175,225,.08)", borderRadius: 12, padding: 10 }}>
                <div style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: SUB, marginBottom: 6 }}>{l}</div>
                <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-ink)", marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.title}</div>
                {it.audioUrl ? (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <audio controls preload="none" src={it.audioUrl} style={{ width: "100%", height: 32, colorScheme: "dark" }} />
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
        <div style={{ background: "rgba(43,91,196,.12)", borderRadius: 12, padding: "11px 13px" }}>
          <div style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "#9db8e8", marginBottom: 5, display: "flex", alignItems: "center", gap: 5 }}><Lightbulb size={13} /> おすすめ練習</div>
          {data.recommended.length > 0 ? (
            <>
              <div style={{ fontSize: "var(--fs-label)", color: "var(--text-sub)", marginBottom: 7 }}>きみの録音の弱点から、この技術に効く教材を選んだよ。</div>
              {data.recommended.map((m) => (
                <Link key={m.id} href={`/${userId}/practice/${m.category}/${m.id}`} className="pressable"
                  style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--card-in)", border: "1px solid rgba(150,175,225,.08)", borderRadius: 10, padding: "9px 11px", marginBottom: 6, textDecoration: "none", color: "var(--text-ink)" }}>
                  {m.star != null && <span style={{ flex: "none", fontSize: "var(--fs-label)", fontWeight: 900, color: "var(--gold)" }}>★{m.star}</span>}
                  <b style={{ fontSize: "var(--fs-body)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.title}</b>
                  <span style={{ marginLeft: "auto", flex: "none", fontSize: "var(--fs-caption)", fontWeight: 800, color: ACCENT }}>ひらく →</span>
                </Link>
              ))}
            </>
          ) : (
            <div style={{ fontSize: "var(--fs-body)", color: "var(--text-sub)", lineHeight: 1.7 }}>
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

/* 時間比例X軸の折れ線 + 注釈マーカー (ダーク: 線=クリーム ・ 節点=上達のようすと同作法) */
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
        <svg data-anim="chart" viewBox={`0 0 ${W} ${H}`} width="100%" height="110" preserveAspectRatio="none">
          {[25, 50, 75].map((p) => (
            <line key={p} x1={PAD} y1={y(p)} x2={W - PAD} y2={y(p)} stroke="rgba(150,175,225,.10)" strokeWidth="1" />
          ))}
          {annos.map((a, i) => (
            <line key={i} x1={x(a.at)} y1={PAD - 4} x2={x(a.at)} y2={H - PAD} stroke={a.kind === "lesson_clear" ? "#e8b23c" : "#e8a78f"} strokeWidth="1.4" strokeDasharray="3 3" />
          ))}
          <polyline points={pts} fill="none" stroke="#fff3dc" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
          {data.series.map((s, i) => (
            <circle key={i} cx={x(s.at)} cy={y(s.pct)} r={i === data.series.length - 1 ? 4.2 : 2.6} fill="#16294f" stroke="#fff3dc" strokeWidth="1.5" />
          ))}
        </svg>
        {/* 注釈ラベル */}
        {annos.slice(-3).map((a, i) => (
          <span key={i} style={{
            position: "absolute", top: -2 + i * 16, left: `${(x(a.at) / W) * 100}%`, transform: "translateX(-50%)",
            fontSize: "var(--fs-label)", fontWeight: 800, whiteSpace: "nowrap",
            color: a.kind === "lesson_clear" ? "#e8b23c" : "#e8a78f",
            background: "var(--card-in)", border: "1px solid rgba(150,175,225,.14)", borderRadius: 6, padding: "1px 6px",
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
