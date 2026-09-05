// わざ関連の実装確認用プレビュー (2026-09-02)。
// 先生あり特典の詳細ページは通常アカウントで開けないため、実コンポーネントに
// 実データと同じ形の値を流して並べる。確認が済んだら消してよい一時ルート。
import SkillsLevelClient from "@/app/[userId]/progress/skills/SkillsLevelClient"
import SkillDetailClient from "@/app/[userId]/progress/skill/[techId]/SkillDetailClient"
import type { SkillDetailData, SkillMapData } from "@/app/_libs/growthKarte"
import type { SkillMasteryEntry } from "@/app/_libs/skillMastery"

export const metadata = { title: "わざ 実装プレビュー" }

const UID = "preview"

// 課題曲は本番の投入結果 (2026-09-02) と同じ並び
const MASTERY: Record<string, SkillMasteryEntry> = {
  slur: {
    rank: 1,
    ladder: [
      { star: 1, scoreId: "s1", title: "ワルツ No.15", state: "done", masteredAt: "2026.8.14" },
      { star: 2, scoreId: "s2", title: "ポルカ", state: "now", avg: 78 },
      { star: 3, scoreId: "s3", title: "楽しい農夫", state: "lock" },
    ],
  },
  staccato: {
    rank: null,
    ladder: [
      { star: 2, scoreId: "s4", title: "メヌエット（「ドン・ジョバンニ」より）", state: "now", avg: null },
      { star: 3, scoreId: "s5", title: "ガボット「ミニヨンより」", state: "lock" },
    ],
  },
  portato: {
    rank: 2,
    ladder: [
      { star: 1, scoreId: "s6", title: "ワルツ No.15", state: "done", masteredAt: "2026.7.2" },
      { star: 2, scoreId: "s7", title: "ファニタ", state: "done", masteredAt: "2026.8.30" },
    ],
  },
  tremolo: { rank: null, ladder: [] },   // 課題曲なし = 記録表を出さない
}

const skillMap: SkillMapData = {
  nodes: [
    { id: "slur", label: "スラー", lane: "bow", star: 1, state: "stable", provisional: false, pct: 86, miss: 12, target: 88 },
    { id: "staccato", label: "スタッカート", lane: "bow", star: 2, state: "wobble", provisional: false, pct: 61, miss: 39, target: 100 },
    { id: "portato", label: "ポルタート", lane: "bow", star: 2, state: "acquired_nodata", provisional: true, pct: null, miss: 0, target: 0 },
    { id: "bow_staccato", label: "連続スピッカート", lane: "bow", star: 2, state: "ready", provisional: false, pct: null, miss: 0, target: 0 },
    { id: "tremolo", label: "トレモロ", lane: "bow", star: 3, state: "locked", provisional: false, pct: null, miss: 0, target: 0 },
    { id: "spiccato", label: "スピッカート", lane: "bow", star: 3, state: "locked", provisional: false, pct: null, miss: 0, target: 0 },
    { id: "ricochet", label: "リコシェ", lane: "bow", star: 5, state: "locked", provisional: false, pct: null, miss: 0, target: 0 },
    { id: "pizzicato", label: "ピチカート", lane: "bow", star: 1, state: "stable", provisional: false, pct: 92, miss: 4, target: 52 },
    { id: "position", label: "ポジション移動", lane: "left", star: 3, state: "ready", provisional: false, pct: null, miss: 0, target: 0 },
    { id: "double", label: "重音", lane: "left", star: 4, state: "locked", provisional: false, pct: null, miss: 0, target: 0 },
    { id: "trill", label: "トリル", lane: "left", star: 3, state: "locked", provisional: false, pct: null, miss: 0, target: 0 },
    { id: "mordent", label: "モルデント", lane: "left", star: 3, state: "locked", provisional: false, pct: null, miss: 0, target: 0 },
    { id: "glissando", label: "グリッサンド", lane: "left", star: 4, state: "locked", provisional: false, pct: null, miss: 0, target: 0 },
    { id: "vibrato", label: "ビブラート", lane: "left", star: 4, state: "locked", provisional: false, pct: null, miss: 0, target: 0 },
    { id: "harmonic", label: "ハーモニクス", lane: "left", star: 5, state: "locked", provisional: false, pct: null, miss: 0, target: 0 },
  ],
} as SkillMapData

const day = (d: string, at: number) => ({ at, date: d })

const detailFull: SkillDetailData = {
  id: "slur", label: "スラー", lane: "bow", star: 1, state: "stable", provisional: false,
  pct: 86, miss: 12, target: 88,
  practiceHref: `/${UID}/practice/bowing`,
  series: [
    { ...day("6.14", 0), pct: 62, target: 30 },
    { ...day("6.28", 1), pct: 68, target: 44 },
    { ...day("7.12", 2), pct: 64, target: 51 },
    { ...day("7.26", 3), pct: 77, target: 66 },
    { ...day("8.9", 4), pct: 81, target: 74 },
    { ...day("8.23", 5), pct: 86, target: 88 },
  ],
  annotations: [
    { at: 2, date: "7.12", kind: "observation", label: "弓が浮きやすい", severity: "challenge" },
    { at: 4, date: "8.9", kind: "lesson_clear", label: "スラーのレッスン合格" },
  ],
  effect: { label: "レッスンクリア", delta: 9 },
  listen: {
    old: { date: "6.14", title: "ワルツ No.15", pct: 62, audioUrl: null },
    new: { date: "8.23", title: "ポルカ", pct: 86, audioUrl: null },
  },
  guidance: [
    { date: "8.9", severity: "improving", tags: ["スラー"], comment: "つなぎ目が滑らかになってきました。弓の返しをもう少しゆっくり。" },
    { date: "7.12", severity: "challenge", tags: ["スラー", "ボウイング"], comment: "弓が浮いて音が切れるところがあります。" },
  ],
  recommended: [
    { id: "m1", title: "スラーの練習・A線", category: "bowing", star: 1 },
    { id: "m2", title: "3度音程と移弦の練習", category: "bowing", star: 1 },
  ],
}

const detailThin: SkillDetailData = {
  id: "staccato", label: "スタッカート", lane: "bow", star: 2, state: "wobble", provisional: false,
  pct: 61, miss: 39, target: 100,
  practiceHref: `/${UID}/practice/bowing`,
  series: [{ ...day("8.20", 0), pct: 58, target: 44 }, { ...day("8.28", 1), pct: 61, target: 100 }],
  annotations: [],
  effect: null,
  listen: null,
  guidance: [],
  recommended: [{ id: "m3", title: "弓とリズムの練習・G線", category: "bowing", star: 1 }],
}

const detailEmpty: SkillDetailData = {
  id: "tremolo", label: "トレモロ", lane: "bow", star: 3, state: "locked", provisional: false,
  pct: null, miss: 0, target: 0,
  practiceHref: `/${UID}/practice/bowing`,
  series: [], annotations: [], effect: null, listen: null, guidance: [], recommended: [],
}

function Frame({ n, title, note, children }: { n: string; title: string; note: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 34 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: ".16em", color: "#3f74e0" }}>{n}</span>
        <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>{title}</h2>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#6e83a8" }}>{note}</span>
      </div>
      <div style={{ maxWidth: 420, border: "1px solid rgba(150,175,225,.16)", borderRadius: 18, overflow: "hidden" }}>
        {children}
      </div>
    </section>
  )
}

export default function SkillPreviewPage() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "26px 18px 70px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 6px" }}>わざ 実装プレビュー</h1>
      <p style={{ color: "var(--text-sub)", fontSize: 14, margin: "0 0 26px", maxWidth: "62ch" }}>
        描き直したモックではなく、本番と同じコンポーネントに実データと同じ形の値を流したものです。
        課題曲の並びは 2026-09-02 に投入した実データと同じ。
      </p>

      <Frame n="1" title="技術マップ" note="/progress/skills ・ 全ユーザー">
        <SkillsLevelClient userId={UID} skillMap={skillMap} mastery={MASTERY} hideDetailLinks />
      </Frame>

      <Frame n="2" title="わざ詳細 ・ 記録も指導もある" note="/progress/skill/slur ・ 先生あり">
        <SkillDetailClient userId={UID} data={detailFull} mastery={MASTERY.slur} />
      </Frame>

      <Frame n="3" title="わざ詳細 ・ 記録が少ない" note="録音2回 ・ 指導なし">
        <SkillDetailClient userId={UID} data={detailThin} mastery={MASTERY.staccato} />
      </Frame>

      <Frame n="4" title="わざ詳細 ・ まだ出会っていない" note="課題曲なし ・ 記録表は出ない">
        <SkillDetailClient userId={UID} data={detailEmpty} mastery={MASTERY.tremolo} />
      </Frame>
    </div>
  )
}
