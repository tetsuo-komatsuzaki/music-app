"use client"

// 成長カルテ v2 (2026-08-03 Phase1・確定モック 7c74b97d・案10ミニマルダッシュボード)。
// 6章: ①数字ヘッダ(変化が主役) ②技術マップ(2本バー) ③表現力 ④癖マップ ⑤くわしい数字 ⑥きみの歴史。
// 全章文法 =「表面は薄く → タップで深く」。次の一歩(カリキュラム)はホームの領分 (カルテには置かない)。
// readOnly = 先生の閲覧モード (期間タブ・リンク・オンボ非表示)。
import { useState } from "react"
import Link from "next/link"
import OnboardingTrigger from "@/app/[userId]/_onboarding/OnboardingTrigger"
import type { KarteData, SkillNode } from "@/app/_libs/growthKarte"
import BodyObsMap from "@/app/components/BodyObsMap"
import ShareSheet from "@/app/components/ShareSheet"

// ── 案10 トークン ──
const INK = "#1a2028"
const SUB = "#8a9099"
const ACC = "#3555d4"
const GOOD = "#0f8a4f"
const BAD = "#d0453a"
const GOLD = "#a97b1f"
const WARN = "#c9752e"

const card: React.CSSProperties = {
  background: "#fff", border: "1px solid #eceff3", borderRadius: 12,
  padding: "13px 15px", marginBottom: 11,
}
const secTtl: React.CSSProperties = { fontSize: 12.5, fontWeight: 900, color: INK, margin: "0 0 8px", display: "flex", alignItems: "baseline", gap: 6 }
const subLbl: React.CSSProperties = { fontSize: 9.5, fontWeight: 800, color: SUB }
const tnum: React.CSSProperties = { fontVariantNumeric: "tabular-nums" }

const SKILL_GLYPH: Record<string, string> = {
  slur: "〰️", staccato: "•", portato: "‿", bow_staccato: "•••", tremolo: "🌀",
  pizzicato: "🤏", spiccato: "✨", ricochet: "🎯",
  position: "↕️", double: "♬", trill: "tr", mordent: "≈", vibrato: "🫨",
  glissando: "⤴", harmonic: "◯",
}

export default function ProgressPage({ userId, data, readOnly = false }: {
  userId: string
  data: KarteData
  readOnly?: boolean
}) {
  const v2 = data.v2
  const [weeklyShare, setWeeklyShare] = useState(false)
  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: readOnly ? "4px 0 30px" : "18px 14px 60px", fontFamily: "inherit", color: INK }}>
      {!readOnly && (
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
          <h1 style={{ fontSize: 17, fontWeight: 900, margin: 0 }}>成長カルテ</h1>
          <span style={subLbl}>きみの成長の記録</span>
          {/* 週間ハイライトのシェア (自分のカルテのみ) */}
          <button type="button" onClick={() => setWeeklyShare(true)}
            style={{ marginLeft: "auto", fontSize: 10.5, fontWeight: 800, color: GOLD, background: "#fdf6e6", border: "1px solid #eee0bd", borderRadius: 999, padding: "4px 11px", cursor: "pointer" }}>
            📤 今週をシェア
          </button>
        </div>
      )}
      {weeklyShare && <ShareSheet kind="weekly" onClose={() => setWeeklyShare(false)} />}

      {/* 期間タブ (readOnlyは30d固定ラベル) */}
      {readOnly ? (
        <div style={{ ...subLbl, margin: "0 0 10px" }}>生徒に見えているのと同じカルテ（直近30日）</div>
      ) : (
        <div style={{ display: "flex", gap: 4, background: "#eceef2", borderRadius: 10, padding: 3, marginBottom: 12 }}>
          {([["7d", "今週"], ["30d", "直近30日"], ["all", "全期間"]] as const).map(([p, label]) => (
            <Link key={p} href={`/${userId}/progress${p === "30d" ? "" : `?period=${p}`}`} scroll={false}
              style={{
                flex: 1, textAlign: "center", fontSize: 12, fontWeight: 800, padding: "7px 0", borderRadius: 8,
                textDecoration: "none",
                color: data.period === p ? INK : "#8b97a3",
                background: data.period === p ? "#fff" : "transparent",
              }}>
              {label}
            </Link>
          ))}
        </div>
      )}

      <HeaderKpi data={data} />
      <SkillMapV2 userId={userId} data={data} readOnly={readOnly} />
      <ExpressionSectionV2 userId={userId} data={data} readOnly={readOnly} />
      <BodyMapSection data={data} />
      <DiscoverySection userId={userId} data={data} readOnly={readOnly} />
      <HistorySection data={data} />

      {!readOnly && <OnboardingTrigger pageKey="progress" />}
    </div>
  )
}

/* ── ① 数字ヘッダ: アルコの解説 + ★進捗(固定) + 今週の基礎練/わざ (ゼロ週は±0を正直表示) ── */
function HeaderKpi({ data }: { data: KarteData }) {
  const k = data.v2.kpi
  return (
    <div style={{ marginBottom: 11 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 9 }}>
        <span style={{ fontSize: 21, flex: "none" }} aria-hidden>🎻</span>
        <span style={{ flex: 1, background: "#eef1fc", borderRadius: 10, borderTopLeftRadius: 3, padding: "7px 11px", fontSize: 11.5, fontWeight: 700 }}>
          {data.v2.arcoLine}
        </span>
      </div>
      <div style={{ display: "flex", gap: 8, textAlign: "center" }}>
        <div style={{ ...card, flex: 1, marginBottom: 0, padding: "10px 4px 8px", borderColor: "#d8dcf0" }}>
          <b style={{ ...tnum, display: "block", fontSize: 21, fontWeight: 900, lineHeight: 1.15, color: ACC }}>
            {k.starDone}<small style={{ fontSize: 10, color: SUB }}>/{k.starRequired}</small>
          </b>
          <span style={subLbl}>★{k.star}の達成曲</span>
        </div>
        <div style={{ ...card, flex: 1, marginBottom: 0, padding: "10px 4px 8px" }}>
          <b style={{ ...tnum, display: "block", fontSize: 21, fontWeight: 900, lineHeight: 1.15, color: k.basicsWeek > 0 ? GOOD : SUB }}>
            {k.basicsWeek > 0 ? `+${k.basicsWeek}` : "±0"}
          </b>
          <span style={subLbl}>今週の基礎練クリア</span>
        </div>
        <div style={{ ...card, flex: 1, marginBottom: 0, padding: "10px 4px 8px" }}>
          <b style={{ ...tnum, display: "block", fontSize: 21, fontWeight: 900, lineHeight: 1.15, color: k.skillsWeek > 0 ? GOLD : SUB }}>
            {k.skillsWeek > 0 ? `+${k.skillsWeek}` : "±0"}
          </b>
          <span style={subLbl}>今週のわざ習得</span>
        </div>
        {/* 表現の4枚目は表現記録の運用開始後に追加 (確定: それまで3枚) */}
      </div>
    </div>
  )
}

/* ── ② 技術マップ: 全15わざ・印はNEW/↑/%のみ・タップで案4パネル(推移主役) ── */
function SkillMapV2({ userId, data, readOnly }: { userId: string; data: KarteData; readOnly: boolean }) {
  const [selId, setSelId] = useState<string | null>(null)

  if (!data.skillMap) {
    if (readOnly) return null
    return (
      <div style={{ ...card, textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 900 }}>🎻 技術マップ</div>
        <div style={{ fontSize: 12, color: SUB, margin: "8px 0 12px", lineHeight: 1.7 }}>
          スラーやビブラートなど「わざ」の習得と安定が一目でわかる地図。<br />
          先生が気づいた癖を体の場所で見られる「🧍 癖マップ」も。<br />
          <b>先生とつながると開放</b>されます。
        </div>
        <Link href={`/${userId}/find-teacher`}
          style={{ display: "inline-block", fontSize: 12.5, fontWeight: 800, color: "#fff", background: ACC, borderRadius: 9, padding: "9px 18px", textDecoration: "none" }}>
          🔎 先生を探す →
        </Link>
      </div>
    )
  }

  const { nodes, currentStar } = data.skillMap
  const sel = nodes.find((n) => n.id === selId) ?? null

  const nodeEl = (n: SkillNode) => {
    const locked = n.state === "locked"
    const borderColor =
      n.state === "stable" ? GOOD : n.state === "wobble" ? WARN
      : n.state === "acquired_nodata" ? "#bcd9cc" : n.state === "ready" ? "#cfd5dc" : "#e2e6ea"
    const bg = n.state === "stable" ? "#e9f5ee" : n.state === "wobble" ? "#fdf2e4" : "#fff"
    return (
      <div key={n.id} style={{ width: 46, textAlign: "center" }}>
        <button type="button" onClick={() => !locked && setSelId(selId === n.id ? null : n.id)}
          aria-label={n.label}
          style={{
            position: "relative", width: 38, height: 38, borderRadius: "50%", border: `2px solid ${borderColor}`,
            background: locked ? "#f2f4f7" : bg, display: "inline-grid", placeItems: "center", fontSize: 13,
            cursor: locked ? "default" : "pointer", filter: locked ? "grayscale(1)" : "none", opacity: locked ? 0.5 : 1,
            outline: selId === n.id ? `3px solid #d8dcf0` : "none", padding: 0, fontFamily: "inherit",
          }}>
          {locked ? "🔒" : SKILL_GLYPH[n.id] ?? "♪"}
          {!locked && n.isNew && (
            <span style={{ position: "absolute", top: -7, right: -10, fontSize: 7.5, fontWeight: 900, color: "#fff", background: GOLD, borderRadius: 999, padding: "1px 5px" }}>NEW</span>
          )}
          {!locked && !n.isNew && n.weekDelta != null && n.weekDelta > 0 && (
            <span style={{ position: "absolute", top: -7, right: -10, fontSize: 7.5, fontWeight: 900, color: "#fff", background: GOOD, borderRadius: 999, padding: "1px 5px" }}>↑{n.weekDelta}</span>
          )}
          {!locked && n.pct != null && (
            <span style={{ ...tnum, position: "absolute", bottom: -4, right: -7, fontSize: 7.5, fontWeight: 900, color: "#fff", background: n.state === "wobble" ? WARN : GOOD, borderRadius: 999, padding: "1px 4px" }}>{n.pct}</span>
          )}
        </button>
        <div style={{ fontSize: 8, fontWeight: 800, color: locked ? "#b3bcc6" : "#4a5766", marginTop: 2, lineHeight: 1.2 }}>{n.label}</div>
      </div>
    )
  }

  return (
    <div style={card}>
      <div style={secTtl}>🎻 技術マップ <span style={subLbl}>いまの★{currentStar}</span></div>
      <div style={{ ...subLbl, margin: "4px 0 5px" }}>🏹 右手のわざ（弓）</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "9px 7px" }}>{nodes.filter((n) => n.lane === "bow").map(nodeEl)}</div>
      <div style={{ ...subLbl, margin: "9px 0 5px" }}>🤚 左手のわざ</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "9px 7px" }}>{nodes.filter((n) => n.lane === "left").map(nodeEl)}</div>

      {sel && <SkillPanel userId={userId} n={sel} readOnly={readOnly} />}
    </div>
  )
}

/* 案4パネル: 推移が主役 (大きな%↑ + スパークライン + 2本バー) */
function SkillPanel({ userId, n, readOnly }: { userId: string; n: SkillNode; readOnly: boolean }) {
  const stateLabel =
    n.state === "stable" ? "習得ずみ・安定" : n.state === "wobble" ? "習得ずみ・ゆらぎ中"
    : n.state === "acquired_nodata" ? "習得ずみ（データ集め中）" : "これから挑戦"
  const bar = (label: string, pct: number | null, color: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10.5, marginTop: 6 }}>
      <span style={{ width: 80, flex: "none", fontWeight: 800, color: SUB }}>{label}</span>
      <span style={{ flex: 1, height: 7, borderRadius: 4, background: "#eceff3", overflow: "hidden" }}>
        {pct != null && <span style={{ display: "block", width: `${pct}%`, height: "100%", borderRadius: 4, background: color }} />}
      </span>
      <b style={{ ...tnum, width: 40, flex: "none", textAlign: "right", fontSize: 11.5 }}>{pct != null ? pct : "—"}</b>
    </div>
  )
  const advice =
    n.pitchPct != null && n.rhythmPct != null
      ? (n.rhythmPct < n.pitchPct - 5 ? "音程はいい感じ。次はテンポ — メトロノームに合わせてみよう"
        : n.pitchPct < n.rhythmPct - 5 ? "リズムはいい感じ。次は音程 — ゆっくり音を確かめよう"
        : "音程もテンポもバランスよし。この調子！")
      : "録音がたまると、音程とテンポの中身が見えてくるよ"
  return (
    <div style={{ border: "1.5px solid #d8dcf0", borderRadius: 11, padding: "11px 13px", marginTop: 11 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
        <span style={{ fontSize: 15 }}>{SKILL_GLYPH[n.id] ?? "♪"}</span>
        <b style={{ fontSize: 12.5 }}>{n.label}{n.provisional ? <span style={{ color: GOLD, fontSize: 10 }}>（仮習得）</span> : ""}</b>
        <span style={{ ...subLbl, marginLeft: "auto" }}>{stateLabel}</span>
      </div>
      {n.pct != null ? (
        <div style={{ display: "flex", gap: 14, alignItems: "flex-end", marginBottom: 4 }}>
          <div>
            <div style={{ ...tnum, fontSize: 26, fontWeight: 900, lineHeight: 1 }}>{n.pct}<span style={{ fontSize: 12, color: SUB }}>%</span></div>
            {n.weekDelta != null && (
              <div style={{ fontSize: 10, fontWeight: 900, color: n.weekDelta > 0 ? GOOD : n.weekDelta < 0 ? BAD : SUB }}>
                {n.weekDelta > 0 ? `↑${n.weekDelta}` : n.weekDelta < 0 ? `↓${-n.weekDelta}` : "→"} 今週
              </div>
            )}
          </div>
          {n.series.length >= 2 && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 32 }} aria-hidden>
              {n.series.map((v, i) => (
                <span key={i} style={{ width: 9, height: `${Math.max(8, v * 0.32)}px`, borderRadius: "2px 2px 0 0", background: i === n.series.length - 1 ? ACC : "#c3cdea" }} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ fontSize: 11.5, color: SUB }}>この期間の録音に「{n.label}」の音がまだ少ないよ。</div>
      )}
      {bar("🎵 音程のぶれ", n.pitchPct, ACC)}
      {bar("🥁 テンポずれ", n.rhythmPct, "#a9b6d8")}
      <div style={{ fontSize: 10, color: SUB, marginTop: 6 }}>{advice}</div>
      {n.obsTags.length > 0 && (
        <div style={{ fontSize: 10, color: BAD, marginTop: 5 }}>📋 先生の所見と関連: {n.obsTags.join("・")}</div>
      )}
      {!readOnly && (
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <Link href={`/${userId}/progress/skill/${n.id}`}
            style={{ fontSize: 11, fontWeight: 800, color: "#fff", background: ACC, borderRadius: 8, padding: "7px 13px", textDecoration: "none" }}>
            📈 くわしい分析 →
          </Link>
          <Link href={n.practiceHref}
            style={{ fontSize: 11, fontWeight: 800, color: "#fff", background: WARN, borderRadius: 8, padding: "7px 13px", textDecoration: "none" }}>
            練習する →
          </Link>
        </div>
      )}
    </div>
  )
}

/* ── ③ 表現力: タグのみ (💪とくい / 🔥挑戦中)。詳細画面はPhase2 ── */
function ExpressionSectionV2({ userId, data, readOnly }: { userId: string; data: KarteData; readOnly: boolean }) {
  const ex = data.v2.expression
  if (!ex) {
    if (readOnly) return null
    return (
      <div style={{ ...card, textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 900 }}>🎤 表現力</div>
        <div style={{ fontSize: 12, color: SUB, margin: "8px 0 12px", lineHeight: 1.7 }}>
          「音の深み」「歌わせ方」— きみの表現の<b>強み</b>を先生が記録してくれる場所。<br />
          <b>先生とつながると開放</b>されます。
        </div>
        <Link href={`/${userId}/find-teacher`}
          style={{ display: "inline-block", fontSize: 12.5, fontWeight: 800, color: "#fff", background: ACC, borderRadius: 9, padding: "9px 18px", textDecoration: "none" }}>
          🔎 先生を探す →
        </Link>
      </div>
    )
  }
  const chip = (tagId: string, label: string, kind: "str" | "grow", extra?: string) => {
    const style: React.CSSProperties = {
      display: "inline-block", fontSize: 11, fontWeight: 800, borderRadius: 999, padding: "4px 12px", margin: "2px 4px 2px 0",
      color: kind === "str" ? GOLD : ACC,
      background: kind === "str" ? "#fbf3dc" : "#eef1fc",
      border: kind === "str" ? "1.5px solid #e8d9ae" : "1.5px dashed #b9c2f0",
      textDecoration: "none",
    }
    const body = `${label}${extra ? ` ${extra}` : ""}`
    // タップで表現の詳細 (D2) へ (先生の閲覧モードはリンクなし)
    return readOnly
      ? <span key={tagId} style={style}>{body}</span>
      : <Link key={tagId} href={`/${userId}/progress/expression/${encodeURIComponent(tagId)}`} style={style}>{body} →</Link>
  }
  return (
    <div style={card}>
      <div style={secTtl}>🎤 表現力 <span style={subLbl}>先生の評価</span></div>
      {ex.strengths.length === 0 && ex.growing.length === 0 ? (
        <div style={{ fontSize: 11.5, color: SUB, lineHeight: 1.7 }}>
          先生がレッスンで表現を評価すると、きみの「とくい」がここに並ぶよ。
        </div>
      ) : (
        <>
          {ex.strengths.length > 0 && (
            <div style={{ marginBottom: ex.growing.length ? 8 : 0 }}>
              <div style={{ ...subLbl, color: GOLD }}>💪 きみのとくい</div>
              <div style={{ marginTop: 3 }}>{ex.strengths.map((i) => chip(i.tagId, i.label, "str"))}</div>
            </div>
          )}
          {ex.growing.length > 0 && (
            <div>
              <div style={{ ...subLbl, color: ACC }}>🔥 挑戦中</div>
              <div style={{ marginTop: 3 }}>{ex.growing.map((i) => chip(i.tagId, i.label, "grow", i.status === "improving" ? "🌿" : ""))}</div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ── ④ 癖マップ (機能は現行のまま・「日々の意識でなおす」明記) ── */
function BodyMapSection({ data }: { data: KarteData }) {
  if (!data.bodyObs) return null // 先生なし (ティーザーは②③に集約)
  return (
    <div style={card}>
      <div style={secTtl}>🧍 癖マップ <span style={subLbl}>日々の意識でなおす</span></div>
      {data.bodyObs.length === 0 ? (
        <div style={{ fontSize: 11.5, color: SUB, lineHeight: 1.7 }}>
          先生がレッスンで気づいた癖を記録すると、ここに「体のどこの癖か」が表示されます。
        </div>
      ) : (
        <BodyObsMap tags={data.bodyObs} />
      )}
    </div>
  )
}

/* ── ⑤ くわしい数字: いちばんの発見 + 🔍虫めがね + ▸折りたたみ(実態・調・奏法) ── */
function DiscoverySection({ userId, data, readOnly }: { userId: string; data: KarteData; readOnly: boolean }) {
  const d = data.v2.discovery
  const BAND_LABEL: Record<string, string> = { low: "低い弦域（G・D線）", mid: "まん中（A線域）", high: "高い弦域（E線域）" }
  const hasFinding = d.keyWorst || d.registerWorst || d.lens
  return (
    <div style={card}>
      <div style={secTtl}>📊 くわしい数字
        {!readOnly && (
          <Link href={`/${userId}/progress/numbers`} style={{ marginLeft: "auto", fontSize: 10.5, fontWeight: 800, color: ACC, textDecoration: "none" }}>数字のへや →</Link>
        )}
      </div>
      {!hasFinding ? (
        <div style={{ fontSize: 11.5, color: SUB, lineHeight: 1.7 }}>録音がたまると、苦手な調・音域・音がここに見えてくるよ。</div>
      ) : (
        <>
          {(d.keyWorst || d.registerWorst) && (
            <div style={{ fontSize: 12, lineHeight: 1.7, marginBottom: d.lens ? 7 : 0 }}>
              いまの苦手:
              {d.keyWorst && <> <b style={{ color: BAD }}>{d.keyWorst.label} <span style={tnum}>{d.keyWorst.pct}%</span></b></>}
              {d.keyWorst && d.registerWorst && " ・ "}
              {d.registerWorst && <>とくに<b>{BAND_LABEL[d.registerWorst.band]}</b> <span style={{ ...tnum, color: BAD, fontWeight: 800 }}>{d.registerWorst.pct}%</span></>}
            </div>
          )}
          {d.lens && (
            <div style={{ background: "#fdf8ec", border: "1px solid #e8dcc2", borderRadius: 10, padding: "9px 12px", fontSize: 11.5, lineHeight: 1.85 }}>
              🔍 <b>{d.lens.note}{d.lens.hand ? `（${d.lens.hand}・推定）` : `（${d.lens.raw}）`}</b> が {d.lens.type}
              {d.lens.cents != null && <>（平均 {d.lens.cents > 0 ? "+" : ""}{d.lens.cents}セント）</>}。
              {d.lens.fromNote && <><br />とくに<b>「{d.lens.fromNote}」から動いてきた時</b>にずれやすいよ。</>}
              <span style={{ color: GOLD, fontWeight: 800 }}><br />処方はホームのおすすめに出しておくね</span>
            </div>
          )}
        </>
      )}
      <details style={{ marginTop: 9 }}>
        <summary style={{ fontSize: 10.5, fontWeight: 800, color: SUB, cursor: "pointer" }}>▸ もっと見る（練習の実態・調・奏法）</summary>
        <div style={{ fontSize: 11.5, color: "#4a5766", lineHeight: 1.9, marginTop: 7 }}>
          練習 <b style={tnum}>{data.practiceDays}日</b> ・ 録音 <b style={tnum}>{data.recordingCount}回</b> ・ れんぞく <b style={tnum}>{data.streak}日</b>🔥
          {data.keyRows.length > 0 && (
            <div style={{ marginTop: 4 }}>
              {data.keyRows.slice(0, 5).map((k) => (
                <div key={k.label} style={{ display: "flex", gap: 8, fontSize: 11 }}>
                  <span style={{ width: 92, flex: "none" }}>{k.label}</span>
                  <span style={{ color: SUB }}>{k.count}回</span>
                  {k.avgPitch != null && <span style={{ ...tnum, marginLeft: "auto", fontWeight: 800 }}>{k.avgPitch}%</span>}
                </div>
              ))}
            </div>
          )}
          {data.techRows.length > 0 && (
            <div style={{ marginTop: 6 }}>
              {data.techRows.slice(0, 4).map((t) => {
                const pct = Math.max(0, Math.round(100 - (t.miss / Math.max(1, t.target)) * 100))
                return (
                  <div key={t.label} style={{ display: "flex", gap: 8, fontSize: 11 }}>
                    <span style={{ width: 92, flex: "none" }}>{t.label}</span>
                    <span style={{ flex: 1, alignSelf: "center", height: 5, borderRadius: 3, background: "#eceff3", overflow: "hidden" }}>
                      <span style={{ display: "block", width: `${pct}%`, height: "100%", background: pct < 70 ? WARN : GOOD }} />
                    </span>
                    <b style={{ ...tnum, width: 36, textAlign: "right" }}>{pct}%</b>
                  </div>
                )
              })}
            </div>
          )}
          <div style={{ fontSize: 9.5, color: "#b3bcc6", marginTop: 5 }}>※ この数字は録音の音程・リズムから算出しています</div>
        </div>
      </details>
    </div>
  )
}

/* ── ⑥ きみの歴史: 節目だけの年表 ── */
function HistorySection({ data }: { data: KarteData }) {
  const ms = data.v2.milestones
  return (
    <div style={{ ...card, marginBottom: 0 }}>
      <div style={secTtl}>📜 きみの歴史</div>
      {ms.length === 0 ? (
        <div style={{ fontSize: 11.5, color: SUB }}>最初の録音をすると、ここにきみの歴史が刻まれはじめるよ。</div>
      ) : (
        <div>
          {ms.map((m, i) => (
            <div key={`${m.at}-${i}`} style={{ display: "flex", gap: 9, fontSize: 11.5, lineHeight: 1.7, marginBottom: i === ms.length - 1 ? 0 : 6 }}>
              <span style={{ flex: "none", width: 52, fontSize: 9.5, color: SUB, fontWeight: 800, paddingTop: 2, ...tnum }}>{m.date}</span>
              <span style={{ flex: "none" }}>{m.icon}</span>
              <span style={{ minWidth: 0 }}>{m.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
