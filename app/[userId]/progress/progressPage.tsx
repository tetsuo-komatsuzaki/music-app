"use client"

// 成長カルテ v3 → ダーク写経 (2026-08-22 確定モック build-karte.py K1/K2/K3/NO_TEACHER/TEACHER_VIEW)。
// 1枚のシート (DSカード padding0) に章を刻む構成は維持し、P3ライトブルーをダークへ:
//   h1 ds.t「成長カルテ」・ 章罫 rgba(150,175,225,.12) ・ kicker #7F97C4 ・
//   わざバー=金 / 表現バー=#7FC4C4 (幅74ラベル ・ ds.bar) ・ 章末リンク=pill mute 右寄せ ・
//   STORY=insetタイムライン (マスター金/タッセイ緑の14pxノード ・ 終端「ここから物語がはじまった」) ・
//   先生なし=手紙カード (紺グラデ+金罫 ・ 先生をさがす金ピル) ・ MORE=grid2 DSカード。
// 出現は RevealMotion (ds.card=ブロック ・ 章=項目)。ヒーローは原本どおり (モックが実装値)。
// 30日固定 (期間切替は記録の分析)。次の一歩はホームの領分 (カルテには置かない)。
import Link from "next/link"
import type { KarteData, SkillNode } from "@/app/_libs/growthKarte"
import BodyObsMap from "@/app/components/BodyObsMap"
import ds from "@/app/components/ds.module.css"
import GrowthCurveChapter, { type CurvePoint } from "@/app/components/GrowthCurveChapter"

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

/** 原本 catbar: ラベル + ds.bar + n/m。ラベルは7字級 (フィンガリング/やさしい・歌う) でも1行 */
function CatBar({ label, done, total, col }: { label: string; done: number; total: number; col: string }) {
  const pct = Math.round((done / Math.max(1, total)) * 100)
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 9 }}>
      <span style={{ width: 88, fontSize: 11, fontWeight: 800, flex: "none", whiteSpace: "nowrap", color: "var(--text-ink)" }}>{label}</span>
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

export default function ProgressPage({ userId, data, readOnly = false, detailBase, cardAlbum, curve = [], current = null }: {
  userId: string
  data: KarteData
  readOnly?: boolean
  /** 先生ビュー (2026-08-11): readOnlyでも詳細へ遷移できるリンク土台 (例 /uid/teacher/students/sid/growth) */
  detailBase?: string
  /** カードアルバムの概況 (2026-08-31・報酬体系点灯時のみ。null=章を出さない) */
  cardAlbum?: { got: number; total: number } | null
  /** 成長カーブ (2026-09-02): カルテのトップに置く唯一の数字 */
  curve?: CurvePoint[]
  current?: { avg: number; delta: number | null } | null
}) {
  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: readOnly ? "4px 0 30px" : "0 0 60px" }}>
      {/* 原本: h1 ds.t (先生ビューは pill mute を添える) */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 2px" }}>
        <h1 className={ds.t} style={{ paddingTop: 6, flex: 1, minWidth: 0 }}>成長カルテ</h1>
        {readOnly && (
          <span style={{ flex: "none", fontSize: 10, fontWeight: 800, color: "var(--text-sub)", background: "rgba(150,175,225,.1)", borderRadius: 999, padding: "4px 11px" }}>生徒に見えているのと同じカルテ</span>
        )}
      </div>

      {/* ═ 1枚のシート (原本 sheet = DSカード padding0) ═ */}
      <div className={ds.card} style={{ padding: 0, overflow: "hidden", marginTop: 12 }}>
        <GrowthCurveChapter curve={curve} current={current}
          numbersHref={detailBase ? `${detailBase}/numbers` : `/${userId}/progress/numbers`} />
        <Rule />
        <SkillsChapter userId={userId} data={data} readOnly={readOnly} detailBase={detailBase} />
        <Rule />
        <ExprChapter userId={userId} data={data} readOnly={readOnly} detailBase={detailBase} />
        {data.bodyObs && <Rule />}
        <FormChapter data={data} userId={userId} readOnly={readOnly} />
        {cardAlbum != null && !readOnly && (<>
          <Rule />
          <AlbumChapter userId={userId} got={cardAlbum.got} total={cardAlbum.total} />
        </>)}
      </div>

      {/* 記録への導線 (2026-08-22 Tetsuo指示: シェアカード/シェアページは削除 ・ シェアはヒーローの「今週をシェア」に一本化) */}
      {!readOnly && (
        <Link href={`/${userId}/records`} className={`${ds.card} pressable`} style={{ ...moreCardStyle, marginTop: 12 }}>
          <b style={{ fontSize: 13.5, display: "block", color: "var(--text-ink)" }}>記録</b>
          <span style={{ fontSize: 10.5, color: "var(--text-sub)" }}>弾いた日と点数のすべて</span>
        </Link>
      )}

    </div>
  )
}
/* これから追加する章の面 (2026-09-02 Tetsuo確定 案4): 斜めのハッチ + 無彩色。
   青の一族から外して「いまは働いていない」を色で示す。破線はデータ待ちの記号なので避ける */
const soonChapter: React.CSSProperties = {
  padding: "18px 16px 16px",
  background: "repeating-linear-gradient(135deg, rgba(140,146,158,.07) 0 7px, transparent 7px 15px), #1a1d24",
}
const moreCardStyle: React.CSSProperties = { margin: 0, padding: 14, textDecoration: "none", display: "block" }


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
  const { nodes } = data.skillMap
  const litOf = (n: SkillNode) => n.state === "stable" || n.state === "wobble" || n.state === "acquired_nodata"
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const cats = SKILL_CATEGORIES.map((c) => {
    const items = c.ids.map((id) => byId.get(id)).filter((n): n is SkillNode => !!n)
    return { label: c.label, total: items.length, lit: items.filter(litOf).length }
  }).filter((c) => c.total > 0)

  return (
    <div style={{ padding: "18px 16px 16px" }}>
      <div style={kicker}>SKILLS</div>
      <div style={chapTitle}>わざの習得状況</div>
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
    // 2026-09-02 Tetsuo確定: 先生機能は未公開。文言は一行だけ、面は斜めのハッチで
    // 「いま塞がっている」ことを示す。破線はデータ待ちに使っているので使わない。
    // 先生をさがす導線は、押しても空振りするため置かない。
    return (
      <div style={{ ...soonChapter }}>
        <div style={{ ...kicker, color: "#7c8088" }}>ESPRESSIONE</div>
        <div style={{ ...chapTitle, color: "#a8adb6" }}>表現の習得状況</div>
        <div style={{ fontSize: 12.5, color: "#8d929b", marginTop: 8 }}>この機能はこれから追加します。</div>
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
      {litCount === 0 && <div style={chapNote}>曲で表現して「先生に聴いてもらう」と認定されるよ</div>}
      <div style={{ marginTop: 1 }}>
        {cats.map((c) => <CatBar key={c.label} label={c.label} done={c.lit} total={c.total} col="#7fc4c4" />)}
      </div>
      {(!readOnly || detailBase) && (
        <ChapterLink href={detailBase ? `${detailBase}/expression` : `/${userId}/progress/expression`} label="表現の一覧へ" />
      )}
    </div>
  )
}

/* ═ カードアルバム (2026-08-31 Tetsuo確定: クエストカードの置き場。からだの癖と同じ章文法) ═ */
function AlbumChapter({ userId, got, total }: { userId: string; got: number; total: number }) {
  return (
    <div style={{ padding: "18px 16px 16px" }}>
      <div style={kicker}>CARD ALBUM</div>
      <div style={chapTitle}>カードアルバム</div>
      <div style={chapNote}>クエストのカードが おさまっていく図鑑</div>
      <div style={{ marginTop: 1 }}>
        <CatBar label="あつめたカード" done={got} total={total} col="var(--gold)" />
      </div>
      <ChapterLink href={`/${userId}/progress/cards`} label="アルバムへ" />
    </div>
  )
}

/* ═ からだの癖 (原本 FORM。マップ本体は BodyObsMap = 承認済み構造 ・ ダーク化) ═ */
function FormChapter({ data, userId, readOnly }: { data: KarteData; userId: string; readOnly: boolean }) {
  if (!data.bodyObs) return null
  const overcomeCount = data.bodyObs.filter((t) => t.severity === "resolved").length
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
        {/* 原本 K2: 克服した癖への導線行 */}
        {!readOnly && overcomeCount > 0 && (
          <Link href={`/${userId}/progress/overcome`} className="pressable" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, paddingTop: 11, borderTop: "1px solid rgba(150,175,225,.10)", textDecoration: "none" }}>
            <b style={{ fontSize: 12.5, color: "#a8c97f" }}>克服した癖 ・ {overcomeCount}つ</b>
            <span style={{ color: "var(--text-sub)", fontWeight: 800, fontSize: 12 }}>→</span>
          </Link>
        )}
      </div>
    </>
  )
}
