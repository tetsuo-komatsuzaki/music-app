"use client"

// 成長カルテ v2 (2026-08-03 Phase1・確定モック 7c74b97d・案10ミニマルダッシュボード)。
// 6章: ①数字ヘッダ(変化が主役) ②技術マップ(2本バー) ③表現力 ④癖マップ ⑤くわしい数字 ⑥きみの歴史。
// 全章文法 =「表面は薄く → タップで深く」。次の一歩(カリキュラム)はホームの領分 (カルテには置かない)。
// readOnly = 先生の閲覧モード (期間タブ・リンク・オンボ非表示)。
import { useRef, useState } from "react"
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
  // 2026-08-06統一: 旧4語彙の💪/🔥チップは廃止。表現=統一15語の認定 (表現マップ) に一本化。
  // data.v2.expression の有無は「先生とつながっているか」の判定にのみ使う
  if (!data.v2.expression) {
    if (readOnly) return null
    return (
      <div style={{ ...card, textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 900 }}>🎤 表現力</div>
        <div style={{ fontSize: 12, color: SUB, margin: "8px 0 12px", lineHeight: 1.7 }}>
          「優しく（Dolce）」「歌うように（Cantabile）」— きみの表現を先生が認定してくれる場所。<br />
          <b>先生とつながると開放</b>されます。
        </div>
        <Link href={`/${userId}/find-teacher`}
          style={{ display: "inline-block", fontSize: 12.5, fontWeight: 800, color: "#fff", background: ACC, borderRadius: 9, padding: "9px 18px", textDecoration: "none" }}>
          🔎 先生を探す →
        </Link>
      </div>
    )
  }
  return (
    <div style={card}>
      <div style={secTtl}>🎤 表現力 <span style={subLbl}>先生の認定</span></div>
      <ExprMapGrid data={data} readOnly={readOnly} userId={userId} />
      {data.v2.exprMap.nodes.every((n) => n.star === 0) && (
        <div style={{ fontSize: 11.5, color: SUB, lineHeight: 1.7, marginTop: 4 }}>
          曲で表現して「👂 先生に聴いてもらう」と、先生がきみの表現を認定してくれるよ。
        </div>
      )}
    </div>
  )
}

/** 🎨 表現マップ (2026-08-06): ノード=点灯(★N)/未開拓、NEWのみ。タップで下にパネル展開 */
function ExprMapGrid({ data, readOnly, userId }: { data: KarteData; readOnly: boolean; userId: string }) {
  const [openTag, setOpenTag] = useState<string | null>(null)
  const m = data.v2.exprMap
  if (!m) return null
  const sel = m.nodes.find((n) => n.tagId === openTag) ?? null
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ ...subLbl, color: GOLD }}>🎨 表現マップ</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 4 }}>
        {m.nodes.map((n) => {
          const lit = n.star > 0
          const active = openTag === n.tagId
          return (
            <button key={n.tagId} type="button" onClick={() => setOpenTag(active ? null : n.tagId)}
              style={{
                position: "relative", fontSize: 10.5, fontWeight: 800, borderRadius: 999,
                padding: "4px 11px", cursor: "pointer",
                color: lit ? "#8a5a1f" : "#9aa6b3",
                background: lit ? "#fdf3d8" : "#f4f6f8",
                border: `1.5px solid ${active ? "#c9a227" : lit ? "#eed9a0" : "#e5e9ed"}`,
              }}>
              {n.label}{lit && <b style={{ color: "#c9820e" }}> ★{n.star}</b>}
              {n.isNew && (
                <span style={{ position: "absolute", top: -7, right: -4, fontSize: 8, fontWeight: 900, color: "#fff", background: "#d0453a", borderRadius: 999, padding: "1px 5px" }}>NEW</span>
              )}
            </button>
          )
        })}
      </div>
      {sel && (
        <div style={{ marginTop: 8, border: "1px solid #eed9a0", background: "#fdfaf2", borderRadius: 11, padding: "10px 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 13, fontWeight: 900 }}>{sel.label}</span>
            <span style={{ fontSize: 15, fontWeight: 900, color: "#c9820e" }}>
              {"★".repeat(Math.max(0, sel.star))}<span style={{ color: "#e5d9b8" }}>{"★".repeat(Math.max(0, 5 - sel.star))}</span>
            </span>
          </div>
          {sel.history.length > 0 ? (
            <div style={{ marginTop: 6 }}>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: SUB }}>認定のあゆみ</div>
              {sel.history.map((hh, i) => (
                <div key={i} style={{ fontSize: 11, color: "#6a5f48", marginTop: 2 }}>
                  {hh.title}（★{hh.star}） ・ {hh.teacher}先生 ・ {hh.date}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 11, color: SUB, marginTop: 4 }}>まだ認定はないよ。曲で表現して、先生に聴いてもらおう。</div>
          )}
          {(data.v2.exprMap.songsByTag[sel.tagId] ?? []).length > 0 && (
            <div style={{ marginTop: 7 }}>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: SUB }}>この表現に挑戦する曲</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 3 }}>
                {data.v2.exprMap.songsByTag[sel.tagId].map((sg) => (
                  readOnly ? (
                    <span key={sg.id} style={{ fontSize: 11.5, fontWeight: 800 }}>{sg.title} {sg.star != null ? `★${sg.star}` : ""}</span>
                  ) : (
                    <Link key={sg.id} href={`/${userId}/scores/${sg.id}`}
                      style={{ fontSize: 11.5, fontWeight: 800, color: ACC, textDecoration: "none" }}>
                      {sg.title} {sg.star != null ? `★${sg.star}` : ""} →
                    </Link>
                  )
                ))}
              </div>
              {!readOnly && <div style={{ fontSize: 10, color: SUB, marginTop: 5 }}>弾けたら、採点画面の「👂 先生に聴いてもらう」で認定をもらおう</div>}
            </div>
          )}
        </div>
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
  // きみの歴史 縦スライド版 (2026-08-06 Tetsuo確定デモ 0edb9f66):
  // タップ不要 — 縦スナップで節目カードが入れ替わり、左の「時間の道」が現在地に追従。
  // 絵文字スタンプは廃止し、カテゴリ色+カナ表記で情報を整理。新しい順→一番下に「はじまり」。
  const ms = data.v2.milestones
  const railRef = useRef<HTMLDivElement | null>(null)
  const [active, setActive] = useState(0)

  // アイコン → カテゴリ表記/色 (Milestone.icon を流用してカテゴリ判定)
  const CAT: Record<string, { label: string; color: string }> = {
    "🏆": { label: "マスター", color: "#b58a1e" },
    "⭐": { label: "ランクアップ", color: "#b58a1e" },
    "✨": { label: "タッセイ", color: "#2e8b57" },
    "🎓": { label: "ワザ", color: "#4a63c8" },
    "🎨": { label: "ヒョウゲン", color: "#a4527a" },
    "💪": { label: "ヒョウゲン", color: "#a4527a" },
    "🌱": { label: "クセこくふく", color: "#5f9c6e" },
    "👩‍🏫": { label: "センセイ", color: "#8a6fb8" },
    "🎙": { label: "ハジマリ", color: "#9aa3ae" },
  }
  const isBig = (icon: string) => icon === "🏆" || icon === "⭐"

  const onScroll = () => {
    const rail = railRef.current
    if (!rail) return
    requestAnimationFrame(() => {
      const mid = rail.scrollTop + rail.clientHeight / 2
      let best = 0
      let bestDist = Infinity
      Array.from(rail.children).forEach((c, i) => {
        const el = c as HTMLElement
        const center = el.offsetTop + el.offsetHeight / 2
        const d = Math.abs(center - mid)
        if (d < bestDist) { bestDist = d; best = i }
      })
      setActive(best)
    })
  }

  if (ms.length === 0) {
    return (
      <div style={{ ...card, marginBottom: 0 }}>
        <div style={secTtl}>📜 きみの歴史</div>
        <div style={{ fontSize: 11.5, color: SUB }}>最初の録音をすると、ここにきみの歴史が刻まれはじめるよ。</div>
      </div>
    )
  }

  const N = ms.length
  const first = ms[N - 1]
  const days = Math.max(1, Math.round((ms[0].at - first.at) / 864e5))
  // 表示順 i (新しい順) → 時系列位置 (0=はじまり)
  const tickIdx = N - 1 - active

  return (
    <div style={{ ...card, marginBottom: 0, paddingLeft: 0, paddingRight: 0, overflow: "hidden" }}>
      <div style={{ padding: "0 15px" }}>
        <div style={secTtl}>📜 きみの歴史</div>
        <div style={{ ...subLbl, marginTop: -4 }}>{first.date}にはじまって {days}日間 ・ {N}つの節目</div>
      </div>

      <div style={{ display: "flex", gap: 12, padding: "10px 15px 0" }}>
        {/* 時間の道 (縦): 上=いま / 下=はじまり。スライドに追従 */}
        <div style={{ position: "relative", width: 22, flex: "none" }}>
          <div style={{ position: "absolute", top: 0, bottom: 0, left: 9, width: 2, borderRadius: 1, background: "#ece8db" }} />
          <div style={{
            position: "absolute", top: 0, left: 9, width: 2, borderRadius: 1,
            background: "linear-gradient(180deg,#e3c96a,#d8b34e)",
            height: `${(active / Math.max(1, N - 1)) * 100}%`, transition: "height .3s ease",
          }} />
          {ms.map((m, i) => {
            const frac = i / Math.max(1, N - 1)
            const cur = i === active
            return (
              <span key={`${m.at}-${i}`} style={{
                position: "absolute", left: isBig(m.icon) ? 5 : 6, top: `calc(${frac * 100}% - 4px)`,
                width: isBig(m.icon) ? 10 : 8, height: isBig(m.icon) ? 10 : 8, borderRadius: "50%",
                boxSizing: "border-box", background: cur ? "#fdf3d8" : "#fff",
                border: `2px solid ${cur ? "#c9a227" : i <= active ? "#d8b34e" : "#ded8c6"}`,
                transform: cur ? "scale(1.5)" : "none", transition: "border-color .3s, transform .3s",
              }} />
            )
          })}
        </div>

        {/* 縦スナップのカードレール */}
        <div ref={railRef} onScroll={onScroll} style={{
          flex: 1, minWidth: 0, height: 280, overflowY: "auto",
          scrollSnapType: "y mandatory", scrollbarWidth: "none",
          display: "flex", flexDirection: "column", gap: 10, padding: "56px 2px",
        }}>
          {ms.map((m, i) => {
            const cat = CAT[m.icon] ?? { label: "セツメ", color: SUB }
            const big = isBig(m.icon)
            const activeCard = i === active
            return (
              <div key={`${m.at}-${i}`} style={{
                flex: "none", scrollSnapAlign: "center", borderRadius: 14, padding: "13px 15px",
                background: big ? "linear-gradient(155deg,#fffdf4,#fbf2d8)" : "#fbfaf6",
                border: `1px solid ${big ? "#ecd9a2" : "#eee9da"}`,
                transform: activeCard ? "scale(1)" : "scale(.94)",
                opacity: activeCard ? 1 : 0.55,
                filter: activeCard ? "none" : "saturate(.6)",
                transition: "transform .35s cubic-bezier(.2,.8,.3,1), opacity .35s, filter .35s",
              }}>
                <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: ".16em", color: cat.color }}>
                  {cat.label} ・ {m.date}
                </div>
                <div style={{ fontSize: big ? 14.5 : 13, fontWeight: 900, lineHeight: 1.5, marginTop: 3 }}>
                  {m.text}
                </div>
                {i === N - 1 && (
                  <div style={{ fontSize: 10, color: "#9a9384", marginTop: 4 }}>ここから物語がはじまった</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
