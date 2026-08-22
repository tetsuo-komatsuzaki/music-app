"use client"

// 成長カルテ v3 → ダーク写経 (2026-08-22 確定モック build-karte.py K1/K2/K3/NO_TEACHER/TEACHER_VIEW)。
// 1枚のシート (DSカード padding0) に章を刻む構成は維持し、P3ライトブルーをダークへ:
//   h1 ds.t「成長カルテ」・ 章罫 rgba(150,175,225,.12) ・ kicker #7F97C4 ・
//   わざバー=金 / 表現バー=#7FC4C4 (幅74ラベル ・ ds.bar) ・ 章末リンク=pill mute 右寄せ ・
//   STORY=insetタイムライン (マスター金/タッセイ緑の14pxノード ・ 終端「ここから物語がはじまった」) ・
//   先生なし=手紙カード (紺グラデ+金罫 ・ 先生をさがす金ピル) ・ MORE=grid2 DSカード。
// 出現は RevealMotion (ds.card=ブロック ・ 章=項目)。ヒーローは原本どおり (モックが実装値)。
// 30日固定 (期間切替は記録の分析)。次の一歩はホームの領分 (カルテには置かない)。
import { useState } from "react"
import Link from "next/link"
import { Share2, Search } from "lucide-react"
import OnboardingTrigger from "@/app/[userId]/_onboarding/OnboardingTrigger"
import type { KarteData, SkillNode } from "@/app/_libs/growthKarte"
import BodyObsMap from "@/app/components/BodyObsMap"
import ShareSheet from "@/app/components/ShareSheet"
import ds from "@/app/components/ds.module.css"

const tnum: React.CSSProperties = { fontVariantNumeric: "tabular-nums" }

const kicker: React.CSSProperties = { fontSize: 9, fontWeight: 900, letterSpacing: ".24em", color: "#7f97c4" }
const chapTitle: React.CSSProperties = { fontSize: 15, fontWeight: 900, marginTop: 2, color: "var(--text-ink)" }
const chapNote: React.CSSProperties = { fontSize: 9.5, color: "var(--text-sub)", fontWeight: 700, marginTop: 2 }

// わざの分類 (SkillsLevelClient と同一。id は SkillNode.id と一致)
const SKILL_CATEGORIES: { label: string; ids: string[] }[] = [
  { label: "弓", ids: ["slur", "staccato", "portato", "bow_staccato", "tremolo", "spiccato", "ricochet", "pizzicato"] },
  { label: "フィンガリング", ids: ["position", "double"] },
  { label: "装飾", ids: ["trill", "mordent", "glissando"] },
  { label: "音色・特殊", ids: ["vibrato", "harmonic"] },
]

// 表現の分類 (ExpressionLevelClient と同一。id は moodTags の tagId と一致・2026-08-11 Tetsuo承認の4系統)
const EXPR_CATEGORIES: { label: string; ids: string[] }[] = [
  { label: "やさしい・歌う", ids: ["mood_dolce", "mood_cantabile", "mood_amoroso", "mood_delicato", "mood_tranquillo"] },
  { label: "華やか・軽快", ids: ["mood_brillante", "mood_grazioso", "mood_leggiero", "mood_giocoso"] },
  { label: "力強い・堂々", ids: ["mood_energico", "mood_appassionato", "mood_maestoso", "mood_nobile"] },
  { label: "表情・幻想", ids: ["mood_espressivo", "mood_misterioso"] },
]

/** 章区切りの罫線 (原本 RULE) */
const Rule = () => (
  <div style={{ height: 1, margin: "16px 16px 0", background: "rgba(150,175,225,.12)" }} />
)

/** 原本 catbar: 幅74ラベル + ds.bar + n/m */
function CatBar({ label, done, total, col }: { label: string; done: number; total: number; col: string }) {
  const pct = Math.round((done / Math.max(1, total)) * 100)
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 9 }}>
      <span style={{ width: 74, fontSize: 11.5, fontWeight: 800, flex: "none", color: "var(--text-ink)" }}>{label}</span>
      <div className={ds.bar} style={{ flex: 1 }}>
        <i style={{ width: `${pct}%`, background: col }} />
      </div>
      <span style={{ ...tnum, fontSize: 11, fontWeight: 800, color: "var(--text-sub)", flex: "none" }}>{done}/{total}</span>
    </div>
  )
}

/** 章末の導線 (原本: pill mute 右寄せ) */
function ChapterLink({ href, label }: { href: string; label: string }) {
  return (
    <div style={{ marginTop: 12, textAlign: "right" }}>
      <Link href={href} className="pressable" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 800, color: "var(--text-ink)", background: "rgba(150,175,225,.1)", borderRadius: 999, padding: "4px 11px", textDecoration: "none" }}>
        {label} →
      </Link>
    </div>
  )
}

export default function ProgressPage({ userId, data, readOnly = false, detailBase }: {
  userId: string
  data: KarteData
  readOnly?: boolean
  /** 先生ビュー (2026-08-11): readOnlyでも詳細へ遷移できるリンク土台 (例 /uid/teacher/students/sid/growth) */
  detailBase?: string
}) {
  const [weeklyShare, setWeeklyShare] = useState(false)
  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: readOnly ? "4px 0 30px" : "0 0 60px" }}>
      {weeklyShare && <ShareSheet kind="weekly" onClose={() => setWeeklyShare(false)} />}

      {/* 原本: h1 ds.t (先生ビューは pill mute を添える) */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 2px" }}>
        <h1 className={ds.t} style={{ paddingTop: 6, flex: 1, minWidth: 0 }}>成長カルテ</h1>
        {readOnly && (
          <span style={{ flex: "none", fontSize: 10, fontWeight: 800, color: "var(--text-sub)", background: "rgba(150,175,225,.1)", borderRadius: 999, padding: "4px 11px" }}>生徒に見えているのと同じカルテ</span>
        )}
      </div>

      {/* ═ 1枚のシート (原本 sheet = DSカード padding0) ═ */}
      <div className={ds.card} style={{ padding: 0, overflow: "hidden", marginTop: 12 }}>
        <Hero userId={userId} data={data} readOnly={readOnly} detailBase={detailBase} onShare={() => setWeeklyShare(true)} />
        <Rule />
        <SkillsChapter userId={userId} data={data} readOnly={readOnly} detailBase={detailBase} />
        <Rule />
        <ExprChapter userId={userId} data={data} readOnly={readOnly} detailBase={detailBase} />
        {data.bodyObs && <Rule />}
        <FormChapter data={data} />
        <Rule />
        <HistorySection data={data} />
      </div>

      {/* 記録とシェアへの導線 (原本 MORE = grid2 DSカード) */}
      {!readOnly && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
          <Link href={`/${userId}/records`} className={`${ds.card} pressable`} style={moreCardStyle}>
            <b style={{ fontSize: 13.5, display: "block", color: "var(--text-ink)" }}>記録</b>
            <span style={{ fontSize: 10.5, color: "var(--text-sub)" }}>弾いた日と点数のすべて</span>
          </Link>
          <Link href={`/${userId}/share`} className={`${ds.card} pressable`} style={moreCardStyle}>
            <b style={{ fontSize: 13.5, display: "block", color: "var(--text-ink)" }}>シェア</b>
            <span style={{ fontSize: 10.5, color: "var(--text-sub)" }}>成長を1枚のカードに</span>
          </Link>
        </div>
      )}

      {!readOnly && <OnboardingTrigger pageKey="progress" />}
    </div>
  )
}
const moreCardStyle: React.CSSProperties = { margin: 0, padding: 14, textDecoration: "none", display: "block" }

/* ═ ヒーロー (原本 HERO = 実装値そのまま): 青グラデ + KPI大数字 ═ */
function Hero({ userId, data, readOnly, detailBase, onShare }: { userId: string; data: KarteData; readOnly: boolean; detailBase?: string; onShare: () => void }) {
  const k = data.v2.kpi
  return (
    <div style={{ position: "relative", padding: "20px 18px 18px", background: "linear-gradient(135deg,#1f3d78,#2b5bc4)", color: "#eaf1ff" }}>
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: ".22em", color: "#a9c3f2" }}>GROWTH KARTE</div>
          {!readOnly && (
            <button type="button" onClick={onShare} className="pressable"
              style={{ marginLeft: "auto", fontSize: 10.5, fontWeight: 800, color: "#fff", background: "rgba(255,255,255,.16)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 999, padding: "4px 11px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Share2 size={12} /> 今週をシェア
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <div style={kpiBox}><b style={{ ...kpiNum, color: "#fff" }}><span data-anim="count">{k.starDone}</span><small style={{ fontSize: 11, color: "#bcd0f5" }}>/{k.starRequired}</small></b><span style={kpiLbl}>★{k.star}の達成曲</span></div>
          <div style={kpiBox}><b style={{ ...kpiNum, color: k.basicsWeek > 0 ? "#fff" : "#bcd0f5" }}>{k.basicsWeek > 0 ? `+${k.basicsWeek}` : "±0"}</b><span style={kpiLbl}>今週の基礎練</span></div>
          <div style={kpiBox}><b style={{ ...kpiNum, color: k.skillsWeek > 0 ? "#fff" : "#bcd0f5" }}>{k.skillsWeek > 0 ? `+${k.skillsWeek}` : "±0"}</b><span style={kpiLbl}>今週のわざ</span></div>
        </div>
        {(!readOnly || detailBase) && (
          <Link href={detailBase ? `${detailBase}/numbers` : `/${userId}/progress/numbers`} style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 12, fontSize: 10.5, fontWeight: 800, color: "#cfe0ff", textDecoration: "none" }}>
            <Search size={11} /> きろくを詳しくみる→
          </Link>
        )}
      </div>
    </div>
  )
}
const kpiBox: React.CSSProperties = { flex: 1, textAlign: "center", background: "rgba(255,255,255,.14)", border: "1px solid rgba(255,255,255,.16)", borderRadius: 13, padding: "10px 4px 8px" }
const kpiNum: React.CSSProperties = { display: "block", fontSize: 23, fontWeight: 900, lineHeight: 1.1, ...tnum }
const kpiLbl: React.CSSProperties = { fontSize: 8.5, fontWeight: 800, color: "#bcd0f5" }

/* ═ わざの習得状況 (原本 SKILLS: 金バー + 技術マップへ) ═ */
function SkillsChapter({ userId, data, readOnly, detailBase }: { userId: string; data: KarteData; readOnly: boolean; detailBase?: string }) {
  // 2026-08-11 Tetsuo確定: わざの習得状況は先生なしでも全ユーザーに開放 (nullは集計エラー時のみ)
  if (!data.skillMap) {
    if (readOnly) return null
    return (
      <div style={{ padding: "18px 16px 4px" }}>
        <div style={kicker}>SKILLS</div>
        <div style={chapTitle}>わざの習得状況</div>
        <div style={{ fontSize: 12, color: "var(--text-sub)", margin: "8px 0 12px", lineHeight: 1.7 }}>
          いまは集計を準備中。録音してわざを練習すると、ここに習得状況が表示されます。
        </div>
      </div>
    )
  }
  const { nodes, currentStar } = data.skillMap
  const litOf = (n: SkillNode) => n.state === "stable" || n.state === "wobble" || n.state === "acquired_nodata"
  const litCount = nodes.filter(litOf).length
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const cats = SKILL_CATEGORIES.map((c) => {
    const items = c.ids.map((id) => byId.get(id)).filter((n): n is SkillNode => !!n)
    return { label: c.label, total: items.length, lit: items.filter(litOf).length }
  }).filter((c) => c.total > 0)

  return (
    <div style={{ padding: "18px 16px 16px" }}>
      <div style={kicker}>SKILLS</div>
      <div style={chapTitle}>わざの習得状況 <span style={{ fontSize: 10, fontWeight: 800, color: "var(--text-sub)" }}>いまの★{currentStar}</span></div>
      <div style={chapNote}>15のわざ ・ {litCount}つ点灯</div>
      <div style={{ marginTop: 1 }}>
        {cats.map((c) => <CatBar key={c.label} label={c.label} done={c.lit} total={c.total} col="var(--gold)" />)}
      </div>
      {(!readOnly || detailBase) && (
        <ChapterLink href={detailBase ? `${detailBase}/skills` : `/${userId}/progress/skills`} label="技術マップへ" />
      )}
    </div>
  )
}

/* ═ 表現の習得状況 (原本 EXPR: #7FC4C4バー / 先生なし=手紙カード) ═ */
function ExprChapter({ userId, data, readOnly, detailBase }: { userId: string; data: KarteData; readOnly: boolean; detailBase?: string }) {
  if (!data.v2.expression) {
    if (readOnly) return null
    // 原本 NO_TEACHER の手紙: 紺グラデ + 金罫 + 先生をさがす金ピル
    return (
      <div style={{ margin: "16px 16px 16px", border: "1px solid rgba(232,178,60,.3)", borderRadius: 18, padding: 18, background: "linear-gradient(180deg,#20304f,#16233e)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 900, letterSpacing: ".12em", color: "#a9833b" }}>ESPRESSIONE ・ 先生とつながると開放</div>
        <div style={{ fontSize: 15, fontWeight: 900, marginTop: 8, color: "var(--cream)" }}>表現は、先生の耳から</div>
        <div style={{ fontSize: 12.5, color: "var(--text-sub)", marginTop: 7, lineHeight: 1.8 }}>
          「優しく」「歌うように」— きみの表現を<br />先生が認定すると、ここに刻まれていくよ。
        </div>
        <div style={{ marginTop: 14 }}>
          <Link href={`/${userId}/find-teacher`} className="pressable" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 800, color: "var(--gold)", background: "rgba(232,178,60,.14)", borderRadius: 999, padding: "4px 11px", textDecoration: "none" }}>
            先生をさがす →
          </Link>
        </div>
      </div>
    )
  }
  const nodes = data.v2.exprMap.nodes
  const litOf = (n: { star: number }) => n.star > 0
  const litCount = nodes.filter(litOf).length
  const byId = new Map(nodes.map((n) => [n.tagId, n]))
  const cats = EXPR_CATEGORIES.map((c) => {
    const items = c.ids.map((id) => byId.get(id)).filter((n): n is (typeof nodes)[number] => !!n)
    return { label: c.label, total: items.length, lit: items.filter(litOf).length }
  }).filter((c) => c.total > 0)

  return (
    <div style={{ padding: "18px 16px 16px" }}>
      <div style={kicker}>ESPRESSIONE</div>
      <div style={chapTitle}>表現の習得状況</div>
      <div style={chapNote}>
        15の表現 ・ {litCount}つ認定
        {litCount === 0 && " ・ 曲で表現して「先生に聴いてもらう」と認定されるよ"}
      </div>
      <div style={{ marginTop: 1 }}>
        {cats.map((c) => <CatBar key={c.label} label={c.label} done={c.lit} total={c.total} col="#7fc4c4" />)}
      </div>
      {(!readOnly || detailBase) && (
        <ChapterLink href={detailBase ? `${detailBase}/expression` : `/${userId}/progress/expression`} label="表現の一覧へ" />
      )}
    </div>
  )
}

/* ═ からだの癖 (原本 FORM。マップ本体は BodyObsMap = 承認済み構造 ・ ダーク化) ═ */
function FormChapter({ data }: { data: KarteData }) {
  if (!data.bodyObs) return null
  return (
    <>
      <div style={{ padding: "18px 16px 0" }}>
        <div style={kicker}>FORM</div>
        <div style={chapTitle}>からだの癖</div>
        <div style={chapNote}>先生の目 ・ 日々の意識でなおす</div>
      </div>
      <div style={{ padding: "10px 16px 16px" }}>
        {data.bodyObs.length === 0 ? (
          <div style={{ fontSize: 11.5, color: "var(--text-sub)", lineHeight: 1.8 }}>
            先生がレッスンで気づいた癖を記録すると、ここに「体のどこの癖か」が表示されます。
          </div>
        ) : (
          <BodyObsMap tags={data.bodyObs} />
        )}
      </div>
    </>
  )
}

/* ═ きみの歴史 (原本 STORY: insetタイムライン ・ 14pxノード ・ 終端「ここから物語がはじまった」) ═ */
function HistorySection({ data }: { data: KarteData }) {
  const ms = data.v2.milestones

  const CAT: Record<string, { label: string; color: string }> = {
    "🏆": { label: "マスター", color: "#e8b23c" },
    "✨": { label: "タッセイ", color: "#a8c97f" },
  }

  if (ms.length === 0) {
    return (
      <div style={{ padding: "18px 16px 16px" }}>
        <div style={kicker}>STORY</div>
        <div style={chapTitle}>きみの歴史</div>
        <div style={{ fontSize: 11.5, color: "var(--text-sub)", marginTop: 6 }}>最初の録音をすると、ここにきみの歴史が刻まれはじめるよ。</div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ padding: "18px 16px 0" }}>
        <div style={kicker}>STORY</div>
        <div style={chapTitle}>きみの歴史</div>
      </div>
      <div style={{ padding: "10px 16px 18px" }}>
        {ms.map((m, i) => {
          const cat = CAT[m.icon] ?? { label: "セツメ", color: "var(--text-sub)" }
          return (
            <div key={`${m.at}-${i}`} style={{ display: "flex", gap: 12, position: "relative", paddingBottom: 14 }}>
              <div style={{ width: 14, flex: "none", position: "relative" }}>
                <div style={{ position: "absolute", top: 14, bottom: -14, left: 6, width: 2, borderRadius: 1, background: "rgba(150,175,225,.16)" }} />
                <div style={{ position: "absolute", top: 3, left: 0, width: 14, height: 14, borderRadius: "50%", background: cat.color, border: "2px solid #101c36", boxSizing: "border-box" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0, background: "var(--card-in)", border: "1px solid rgba(150,175,225,.08)", borderRadius: 14, padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
                  <span style={{ fontSize: 11 }}>{m.icon}</span>
                  <b style={{ fontSize: 9.5, fontWeight: 900, letterSpacing: ".1em", color: cat.color }}>{cat.label}</b>
                  <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: "auto" }}>{m.date}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, marginTop: 3, color: "var(--text-ink)" }}>{m.text}</div>
              </div>
            </div>
          )
        })}
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ width: 14, flex: "none", position: "relative" }}>
            <div style={{ position: "absolute", top: 3, left: 0, width: 14, height: 14, borderRadius: "50%", background: "rgba(150,175,225,.2)", border: "2px solid #101c36", boxSizing: "border-box" }} />
          </div>
          <div style={{ flex: 1, fontSize: 11, color: "var(--text-muted)", paddingTop: 2 }}>ここから物語がはじまった</div>
        </div>
      </div>
    </div>
  )
}
