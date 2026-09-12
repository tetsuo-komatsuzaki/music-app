// わざ関連の実装確認用プレビュー (2026-09-02)。
// 先生あり特典の詳細ページは通常アカウントで開けないため、実コンポーネントに
// 実データと同じ形の値を流して並べる。確認が済んだら消してよい一時ルート。
import SkillDetailClient from "@/app/[userId]/progress/skill/[techId]/SkillDetailClient"
import type { SkillDetailData } from "@/app/_libs/growthKarte"
import type { SkillMasteryEntry } from "@/app/_libs/skillMastery"

export const metadata = { title: "わざ 実装プレビュー" }

const UID = "preview"

// 課題曲は本番の投入結果 (2026-09-02) と同じ並び

const day = (d: string, at: number) => ({ at, date: d })

// ── B1 の 3 状態 (2026-09-10)。数字は本番DBの実測値 ──
//  A 数字を出す      2026-04-28 G線上のアリア 60音中44音を判定 ・ 精度86 ・ 先週比+9
//  B 拾えていない    スラー全期間 912音中135音 ・ 検出率14.8%
// 認定曲は実データと同じ ★1 ワルツ No.15 / ★2 ポルカ / ★3 楽しい農夫 (このユーザーは録音なし)
const MASTERY_SLUR: SkillMasteryEntry = {
  // 案3 の 3 状態が全部見えるように 合格 / 挑戦中 / まだ先 を1つずつ。曲名は実データ
  rank: 1,
  ladder: [
    { star: 1, scoreId: "s1", title: "ワルツ No.15", state: "done", masteredAt: "2026.8.14" },
    { star: 2, scoreId: "s2", title: "ポルカ", state: "now", avg: 78, count: 6 },
    { star: 3, scoreId: "s3", title: "楽しい農夫", state: "lock" },
  ],
}

const SERIES = [
  { ...day("3.30", 0), pct: 51, target: 35 },
  { ...day("4.20", 1), pct: 77, target: 50 },
  { ...day("4.28", 2), pct: 86, target: 44 },
]

const detailA: SkillDetailData = {
  id: "slur", label: "スラー", lane: "bow", star: 1, state: "stable", provisional: false,
  pct: 86, miss: 12, target: 44, undetected: 16, coverage: 44 / 60, weekDelta: 9,
  // 奏法の出来。スラーは判定を持たないので null。5奏法の見え方は下の別枠で見る
  quality: null,
  practiceHref: `/${UID}/practice/bowing`,
  series: SERIES,
  annotations: [{ at: 1, date: "4.20", kind: "lesson_clear", label: "スラーのレッスン合格" }],
  effect: { label: "レッスンクリア", delta: 9 },
  listen: {
    old: { date: "3.30", title: "G線上のアリア", pct: 51, audioUrl: null },
    new: { date: "4.28", title: "G線上のアリア", pct: 86, audioUrl: null },
  },
  guidance: [],
  recommended: [
    { id: "m1", title: "カイザー No.31", category: "etude", star: 5 },
    { id: "m2", title: "スラーの練習 2", category: "bowing", star: 4 },
  ],
}

const detailB: SkillDetailData = {
  ...detailA,
  pct: 73, miss: 72, target: 135, undetected: 777, coverage: 135 / 912, weekDelta: null,
}

function Frame({ n, title, note, children }: { n: string; title: string; note: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
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

      <Frame n="1" title="音を拾えていない" note="スラー全期間 ・ 対象912音 ・ 検出135音 ・ 検出率14.8%">
        <SkillDetailClient userId={UID} data={detailB} mastery={MASTERY_SLUR} />
      </Frame>

      <Frame n="2" title="判定できている" note="2026-04-28 G線上のアリア ・ 対象60音 ・ 検出44音 ・ 検出率73%">
        <SkillDetailClient userId={UID} data={detailA} mastery={MASTERY_SLUR} />
      </Frame>

      <Frame n="3" title="認定曲が未登録" note="いまの本番は全わざがこの状態">
        <SkillDetailClient userId={UID} data={detailA} mastery={null} />
      </Frame>

      <Frame n="4" title="奏法の出来が測れたとき" note="スタッカート ・ 判定できた12音中9音">
        <SkillDetailClient userId={UID}
          data={{ ...detailA, id: "staccato", label: "スタッカート",
                  quality: { judged: 12, ok: 9, unmeasured: 3, pct: 75 } }}
          mastery={null} />
      </Frame>

      <Frame n="5" title="奏法の出来がまだ測れないとき" note="いまの本番はほぼこの状態">
        <SkillDetailClient userId={UID}
          data={{ ...detailA, id: "staccato", label: "スタッカート",
                  quality: { judged: 0, ok: 0, unmeasured: 225, pct: null } }}
          mastery={null} />
      </Frame>

    </div>
  )
}
