"use client"

// 成長カルテ v3 ビジュアル刷新 (2026-08-06 Tetsuo確定モック 1f527c6d)。
// 白カードの羅列を廃止し「1枚のクリームの紙」に章を刻む。シェアカードの世界観
// (五線譜・金・アルコ・大きな数字) で統一。操作はスクロールと横スライドのみ —
// クリック依存ゼロ (リンクは補助導線のみ)。章はスクロールで順に現れる。
// 30日固定 (期間切替は記録の分析)。次の一歩はホームの領分 (カルテには置かない)。
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Share2, Search } from "lucide-react"
import OnboardingTrigger from "@/app/[userId]/_onboarding/OnboardingTrigger"
import type { KarteData, SkillNode } from "@/app/_libs/growthKarte"
import BodyObsMap from "@/app/components/BodyObsMap"
import ShareSheet from "@/app/components/ShareSheet"

// ── P3 ライトブルートークン (2026-08-11 Tetsuo確定: クリーム紙→青基調に刷新) ──
const INK = "#1c2b4d"
const SUB = "#7f8ea9"
const ACC = "#2b5bc4"
const GOOD = "#0f8a4f"
const GOLD = "#b58a1e"
const WARN = "#c9752e"
const tnum: React.CSSProperties = { fontVariantNumeric: "tabular-nums" }

const kicker: React.CSSProperties = { fontSize: 9, fontWeight: 900, letterSpacing: ".24em", color: "#7f97c4" }
const chapTitle: React.CSSProperties = { fontSize: 15, fontWeight: 900, marginTop: 1 }
const chapNote: React.CSSProperties = { fontSize: 9.5, color: SUB, fontWeight: 700 }

// わざの分類 (SkillsLevelClient と同一。id は SkillNode.id と一致)
const SKILL_CATEGORIES: { label: string; ids: string[] }[] = [
  { label: "弓（ボーイング）", ids: ["slur", "staccato", "portato", "bow_staccato", "tremolo", "spiccato", "ricochet", "pizzicato"] },
  { label: "フィンガリング（左手）", ids: ["position", "double"] },
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

/** 章区切りの罫線 (P3: 淡青) */
const Rule = () => (
  <div style={{ height: 1, margin: "16px 18px 0", background: "#e3ecf9" }} />
)

/** スクロールで現れる (IntersectionObserver・reduced-motion対応) */
function Reveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setInView(true); return }
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) setInView(true) })
    }, { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(14px)",
      transition: "opacity .5s ease, transform .5s cubic-bezier(.2,.8,.3,1)",
    }}>
      {children}
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
    <div style={{ maxWidth: 520, margin: "0 auto", padding: readOnly ? "4px 0 30px" : "18px 14px 60px", fontFamily: "inherit", color: INK }}>
      {weeklyShare && <ShareSheet kind="weekly" onClose={() => setWeeklyShare(false)} />}
      {readOnly && (
        <div style={{ fontSize: 9.5, fontWeight: 800, color: "#8a9099", margin: "0 0 10px" }}>生徒に見えているのと同じカルテ</div>
      )}

      {/* ═ P3 ライトブルーの1枚 ═ */}
      <div style={{
        background: "#f2f7fd", border: "1px solid #dbe7f6",
        borderRadius: 18, overflow: "hidden", position: "relative",
      }}>
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

      {!readOnly && <OnboardingTrigger pageKey="progress" />}
    </div>
  )
}

/* ═ ヒーロー: 五線譜 + アルコ + KPI大数字 ═ */
function Hero({ userId, data, readOnly, detailBase, onShare }: { userId: string; data: KarteData; readOnly: boolean; detailBase?: string; onShare: () => void }) {
  const k = data.v2.kpi
  return (
    // P3: 青グラデのヒーロー + 白テキスト (2026-08-11 Tetsuo確定)
    <div style={{ position: "relative", padding: "20px 18px 18px", background: "linear-gradient(135deg,#1f3d78,#2b5bc4)", color: "#eaf1ff" }}>
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: ".22em", color: "#a9c3f2" }}>GROWTH KARTE</div>
          </div>
          {!readOnly && (
            <button type="button" onClick={onShare}
              style={{ marginLeft: "auto", fontSize: 10.5, fontWeight: 800, color: "#fff", background: "rgba(255,255,255,.16)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 999, padding: "4px 11px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Share2 size={12} /> 今週をシェア
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <div style={kpiBox}><b style={{ ...kpiNum, color: "#fff" }}>{k.starDone}<small style={{ fontSize: 11, color: "#bcd0f5" }}>/{k.starRequired}</small></b><span style={kpiLbl}>★{k.star}の達成曲</span></div>
          <div style={kpiBox}><b style={{ ...kpiNum, color: k.basicsWeek > 0 ? "#fff" : "#bcd0f5" }}>{k.basicsWeek > 0 ? `+${k.basicsWeek}` : "±0"}</b><span style={kpiLbl}>今週の基礎練</span></div>
          <div style={kpiBox}><b style={{ ...kpiNum, color: k.skillsWeek > 0 ? "#fff" : "#bcd0f5" }}>{k.skillsWeek > 0 ? `+${k.skillsWeek}` : "±0"}</b><span style={kpiLbl}>今週のわざ</span></div>
        </div>
        {(!readOnly || detailBase) && (
          <Link href={detailBase ? `${detailBase}/numbers` : `/${userId}/progress/numbers`} style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 12, fontSize: 10.5, fontWeight: 800, color: "#cfe0ff", textDecoration: "none" }}>
            <Search size={11} /> きろくを詳しくみる（記録の分析）→
          </Link>
        )}
      </div>
    </div>
  )
}
const kpiBox: React.CSSProperties = { flex: 1, textAlign: "center", background: "rgba(255,255,255,.14)", border: "1px solid rgba(255,255,255,.16)", borderRadius: 13, padding: "10px 4px 8px" }
const kpiNum: React.CSSProperties = { display: "block", fontSize: 23, fontWeight: 900, lineHeight: 1.1, ...tnum }
const kpiLbl: React.CSSProperties = { fontSize: 8.5, fontWeight: 800, color: "#bcd0f5" }

/* ═ わざの習得状況: 分類ごとの進み具合バー (タップ不要・情報常時表示) ═ */
function SkillsChapter({ userId, data, readOnly, detailBase }: { userId: string; data: KarteData; readOnly: boolean; detailBase?: string }) {
  // 2026-08-11 Tetsuo確定: わざの習得状況は先生なしでも全ユーザーに開放 (nullは集計エラー時のみ)
  if (!data.skillMap) {
    if (readOnly) return null
    return (
      <div style={{ padding: "20px 18px 4px" }}>
        <div style={kicker}>SKILLS</div>
        <div style={chapTitle}>わざの習得状況</div>
        <div style={{ fontSize: 12, color: SUB, margin: "8px 0 12px", lineHeight: 1.7 }}>
          いまは集計を準備中。録音してわざを練習すると、ここに習得状況が表示されます。
        </div>
      </div>
    )
  }
  const { nodes, currentStar } = data.skillMap
  const litOf = (n: SkillNode) => n.state === "stable" || n.state === "wobble" || n.state === "acquired_nodata"
  const litCount = nodes.filter(litOf).length
  const byId = new Map(nodes.map((n) => [n.id, n]))
  // 分類ごとの進み具合。総数0の分類は非表示。
  const cats = SKILL_CATEGORIES.map((c) => {
    const items = c.ids.map((id) => byId.get(id)).filter((n): n is SkillNode => !!n)
    return { label: c.label, total: items.length, lit: items.filter(litOf).length }
  }).filter((c) => c.total > 0)

  return (
    <Reveal>
      <div style={{ padding: "18px 18px 16px" }}>
        <div style={kicker}>SKILLS</div>
        <div style={chapTitle}>わざの習得状況 <span style={{ fontSize: 10, fontWeight: 800, color: SUB }}>いまの★{currentStar}</span></div>
        <div style={chapNote}>15のわざ ・ {litCount}つ点灯</div>
        {/* 分類ごとの進み具合バー */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
          {cats.map((c) => (
            <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ flex: "none", width: 116, fontSize: 10.5, fontWeight: 800, color: INK }}>{c.label}</span>
              <div style={{ flex: 1, height: 8, borderRadius: 999, background: "#dfe9f8", overflow: "hidden" }}>
                <div style={{ width: `${(c.lit / c.total) * 100}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#2b5bc4,#59a7ff)" }} />
              </div>
              <span style={{ ...tnum, flex: "none", width: 34, textAlign: "right", fontSize: 10.5, fontWeight: 900, color: SUB }}>{c.lit}/{c.total}</span>
            </div>
          ))}
        </div>
        {(!readOnly || detailBase) && (
          <Link href={detailBase ? `${detailBase}/skills` : `/${userId}/progress/skills`}
            style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 12, fontSize: 11.5, fontWeight: 800, color: ACC, textDecoration: "none" }}>
            わざの習得状況を詳しくみる →
          </Link>
        )}
      </div>
    </Reveal>
  )
}

/* ═ 表現の習得状況: 概要=系統バー + 詳細ページへの導線 (詳細は /progress/expression) ═ */
function ExprChapter({ userId, data, readOnly, detailBase }: { userId: string; data: KarteData; readOnly: boolean; detailBase?: string }) {
  if (!data.v2.expression) {
    if (readOnly) return null
    return (
      <Reveal>
        <div style={{ padding: "18px 18px 14px", textAlign: "center" }}>
          <div style={kicker}>ESPRESSIONE</div>
          <div style={chapTitle}>表現の習得状況</div>
          <div style={{ fontSize: 12, color: SUB, margin: "8px 0 12px", lineHeight: 1.7 }}>
            「優しく（Dolce）」「歌うように（Cantabile）」— きみの表現を先生が認定してくれる場所。<br />
            <b>先生とつながると開放</b>されます。
          </div>
          <Link href={`/${userId}/find-teacher`}
            style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 800, color: "#fff", background: ACC, borderRadius: 9, padding: "9px 18px", textDecoration: "none" }}>
            <Search size={14} /> 先生を探す →
          </Link>
        </div>
      </Reveal>
    )
  }
  const nodes = data.v2.exprMap.nodes
  const litOf = (n: { star: number }) => n.star > 0
  const litCount = nodes.filter(litOf).length
  const byId = new Map(nodes.map((n) => [n.tagId, n]))
  // 系統ごとの認定ぐあい。総数0の系統は非表示 (実質は常に全4系統)。
  const cats = EXPR_CATEGORIES.map((c) => {
    const items = c.ids.map((id) => byId.get(id)).filter((n): n is (typeof nodes)[number] => !!n)
    return { label: c.label, total: items.length, lit: items.filter(litOf).length }
  }).filter((c) => c.total > 0)

  return (
    <Reveal>
      <div style={{ padding: "18px 18px 16px" }}>
        <div style={kicker}>ESPRESSIONE</div>
        <div style={chapTitle}>表現の習得状況</div>
        <div style={chapNote}>
          15の表現 ・ {litCount}つ認定
          {litCount === 0 && " ・ 曲で表現して「先生に聴いてもらう」と認定されるよ"}
        </div>
        {/* 系統ごとの認定ぐあいバー */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
          {cats.map((c) => (
            <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ flex: "none", width: 116, fontSize: 10.5, fontWeight: 800, color: INK }}>{c.label}</span>
              <div style={{ flex: 1, height: 8, borderRadius: 999, background: "#dfe9f8", overflow: "hidden" }}>
                <div style={{ width: `${(c.lit / c.total) * 100}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#2b5bc4,#59a7ff)" }} />
              </div>
              <span style={{ ...tnum, flex: "none", width: 34, textAlign: "right", fontSize: 10.5, fontWeight: 900, color: SUB }}>{c.lit}/{c.total}</span>
            </div>
          ))}
        </div>
        {(!readOnly || detailBase) && (
          <Link href={detailBase ? `${detailBase}/expression` : `/${userId}/progress/expression`}
            style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 12, fontSize: 11.5, fontWeight: 800, color: ACC, textDecoration: "none" }}>
            表現の習得状況を詳しくみる →
          </Link>
        )}
      </div>
    </Reveal>
  )
}

/* ═ からだの癖 (先生の目・日々の意識でなおす) ═ */
function FormChapter({ data }: { data: KarteData }) {
  if (!data.bodyObs) return null
  return (
    <Reveal>
      <div style={{ padding: "18px 18px 0" }}>
        <div style={kicker}>FORM</div>
        <div style={chapTitle}>からだの癖</div>
        <div style={chapNote}>先生の目 ・ 日々の意識でなおす</div>
      </div>
      <div style={{ padding: "10px 18px 16px" }}>
        {data.bodyObs.length === 0 ? (
          <div style={{ fontSize: 11.5, color: SUB, lineHeight: 1.7 }}>
            先生がレッスンで気づいた癖を記録すると、ここに「体のどこの癖か」が表示されます。
          </div>
        ) : (
          <BodyObsMap tags={data.bodyObs} />
        )}
      </div>
    </Reveal>
  )
}

/* ═ きみの歴史: 曲の達成/マスターを縦スクロールのタイムラインで (2026-08-11 Tetsuo確定) ═ */
function HistorySection({ data }: { data: KarteData }) {
  const ms = data.v2.milestones

  const CAT: Record<string, { label: string; color: string }> = {
    "🏆": { label: "マスター", color: "#b58a1e" },
    "✨": { label: "タッセイ", color: "#2e8b57" },
  }
  const isBig = (icon: string) => icon === "🏆"

  if (ms.length === 0) {
    return (
      <div style={{ padding: "18px 18px 16px" }}>
        <div style={kicker}>STORY</div>
        <div style={chapTitle}>きみの歴史</div>
        <div style={{ fontSize: 11.5, color: SUB, marginTop: 6 }}>最初の録音をすると、ここにきみの歴史が刻まれはじめるよ。</div>
      </div>
    )
  }

  const N = ms.length
  const first = ms[N - 1]
  const days = Math.max(1, Math.round((ms[0].at - first.at) / 864e5))

  return (
    <Reveal>
      <div style={{ padding: "18px 18px 0" }}>
        <div style={kicker}>STORY</div>
        <div style={chapTitle}>きみの歴史</div>
        <div style={chapNote}>{first.date}にはじまって {days}日間 ・ {N}つの節目</div>
      </div>

      {/* 上=いま / 下=はじまり の縦タイムライン (素直な縦スクロール) */}
      <div style={{ padding: "12px 18px 16px" }}>
        {ms.map((m, i) => {
          const cat = CAT[m.icon] ?? { label: "セツメ", color: SUB }
          const big = isBig(m.icon)
          const isLast = i === N - 1
          return (
            <div key={`${m.at}-${i}`} style={{ display: "flex", gap: 12 }}>
              {/* 左: 縦線 + 節目ドット */}
              <div style={{ position: "relative", width: 14, flex: "none" }}>
                {!isLast && <div style={{ position: "absolute", top: 14, bottom: -10, left: 6, width: 2, borderRadius: 1, background: "#dbe7f6" }} />}
                <span style={{
                  position: "absolute", top: 3, left: big ? 2 : 3,
                  width: big ? 10 : 8, height: big ? 10 : 8, borderRadius: "50%", boxSizing: "border-box",
                  background: big ? "#fdf3d8" : "#fff", border: `2px solid ${cat.color}`,
                }} />
              </div>
              {/* 右: 節目カード */}
              <div style={{
                flex: 1, minWidth: 0, marginBottom: 10, borderRadius: 14, padding: "12px 14px",
                background: big ? "#eef5ff" : "#fff",
                border: `1px solid ${big ? "#cfe0f7" : "#e0e9f6"}`,
              }}>
                <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: ".16em", color: cat.color }}>
                  {cat.label} ・ {m.date}
                </div>
                <div style={{ fontSize: big ? 14.5 : 13, fontWeight: 900, lineHeight: 1.5, marginTop: 3 }}>
                  {m.text}
                </div>
                {isLast && (
                  <div style={{ fontSize: 10, color: "#7f8ea9", marginTop: 4 }}>ここから物語がはじまった</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Reveal>
  )
}
