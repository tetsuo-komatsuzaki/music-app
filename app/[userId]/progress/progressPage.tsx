"use client"

// 成長カルテ v3 ビジュアル刷新 (2026-08-06 Tetsuo確定モック 1f527c6d)。
// 白カードの羅列を廃止し「1枚のクリームの紙」に章を刻む。シェアカードの世界観
// (五線譜・金・アルコ・大きな数字) で統一。操作はスクロールと横スライドのみ —
// クリック依存ゼロ (リンクは補助導線のみ)。章はスクロールで順に現れる。
// 30日固定 (期間切替は数字のへや)。次の一歩はホームの領分 (カルテには置かない)。
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Share2, Search, Flame } from "lucide-react"
import OnboardingTrigger from "@/app/[userId]/_onboarding/OnboardingTrigger"
import type { KarteData, SkillNode } from "@/app/_libs/growthKarte"
import BodyObsMap from "@/app/components/BodyObsMap"
import ShareSheet from "@/app/components/ShareSheet"

// ── ペーパートークン ──
const INK = "#241f14"
const SUB = "#9a8c74"
const ACC = "#3555d4"
const GOOD = "#0f8a4f"
const BAD = "#d0453a"
const GOLD = "#b58a1e"
const WARN = "#c9752e"
const tnum: React.CSSProperties = { fontVariantNumeric: "tabular-nums" }

const kicker: React.CSSProperties = { fontSize: 9, fontWeight: 900, letterSpacing: ".24em", color: "#b99b45" }
const chapTitle: React.CSSProperties = { fontSize: 15, fontWeight: 900, marginTop: 1 }
const chapNote: React.CSSProperties = { fontSize: 9.5, color: SUB, fontWeight: 700 }
const railCard: React.CSSProperties = {
  flex: "none", width: 150, scrollSnapAlign: "start", borderRadius: 15, padding: "12px 13px",
  boxSizing: "border-box", background: "rgba(255,255,255,.8)", border: "1px solid #efe5cc",
}
const litCard: React.CSSProperties = { borderColor: "#e3c96a", background: "linear-gradient(155deg,#fffdf4,#fdf2d2)" }
const dimCard: React.CSSProperties = { opacity: 0.55, filter: "saturate(.5)" }
const railStyle: React.CSSProperties = {
  display: "flex", gap: 10, overflowX: "auto", scrollSnapType: "x mandatory",
  padding: "12px 18px 16px", scrollbarWidth: "none",
}

/** 金の罫線 (章区切り) */
const Rule = () => (
  <div style={{ height: 1, margin: "16px 18px 0", background: "linear-gradient(90deg,#e3c96a,#f2ead2 70%,transparent)" }} />
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

export default function ProgressPage({ userId, data, readOnly = false }: {
  userId: string
  data: KarteData
  readOnly?: boolean
}) {
  const [weeklyShare, setWeeklyShare] = useState(false)
  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: readOnly ? "4px 0 30px" : "18px 14px 60px", fontFamily: "inherit", color: INK }}>
      {weeklyShare && <ShareSheet kind="weekly" onClose={() => setWeeklyShare(false)} />}
      {readOnly && (
        <div style={{ fontSize: 9.5, fontWeight: 800, color: "#8a9099", margin: "0 0 10px" }}>生徒に見えているのと同じカルテ（直近30日）</div>
      )}

      {/* ═ 1枚のクリームの紙 ═ */}
      <div style={{
        background: "linear-gradient(165deg,#fffdf6,#faf4e4)", border: "1px solid #eee6d0",
        borderRadius: 18, overflow: "hidden", position: "relative",
      }}>
        <Hero data={data} readOnly={readOnly} onShare={() => setWeeklyShare(true)} />
        <Rule />
        <SkillsChapter userId={userId} data={data} readOnly={readOnly} />
        <Rule />
        <ExprChapter userId={userId} data={data} readOnly={readOnly} />
        {data.bodyObs && <Rule />}
        <FormChapter data={data} />
        <Rule />
        <DiscoveryChapter userId={userId} data={data} readOnly={readOnly} />
        <Rule />
        <HistorySection data={data} />
      </div>

      {!readOnly && <OnboardingTrigger pageKey="progress" />}
    </div>
  )
}

/* ═ ヒーロー: 五線譜 + アルコ + KPI大数字 ═ */
function Hero({ data, readOnly, onShare }: { data: KarteData; readOnly: boolean; onShare: () => void }) {
  const k = data.v2.kpi
  return (
    <div style={{ position: "relative", padding: "22px 18px 18px" }}>
      <svg viewBox="0 0 400 200" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-hidden>
        <g stroke="#e3d5ac" strokeWidth="1.4" fill="none" opacity=".5">
          <path d="M-10,36 C100,26 260,48 410,30" />
          <path d="M-10,52 C100,42 260,64 410,46" />
          <path d="M-10,68 C100,58 260,80 410,62" />
        </g>
        <g transform="translate(330,26) rotate(-6)" opacity=".8">
          <ellipse cx="0" cy="0" rx="5.5" ry="4" fill="#d8c48e" transform="rotate(-20)" />
          <rect x="4" y="-17" width="1.4" height="17" rx=".7" fill="#d8c48e" />
        </g>
      </svg>
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: ".22em", color: "#a98b2f" }}>GROWTH KARTE</div>
            <div style={{ fontSize: 20, fontWeight: 900 }}>きみの成長カルテ</div>
            <div style={{ fontSize: 10.5, color: "#8a7c62", fontWeight: 700 }}>直近30日のきろく</div>
          </div>
          {!readOnly && (
            <button type="button" onClick={onShare}
              style={{ marginLeft: "auto", fontSize: 10.5, fontWeight: 800, color: GOLD, background: "rgba(255,255,255,.7)", border: "1px solid #eee0bd", borderRadius: 999, padding: "4px 11px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Share2 size={12} /> 今週をシェア
            </button>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Icon.png" alt="" aria-hidden width={42} height={42} style={{ flex: "none", borderRadius: 9, filter: "drop-shadow(0 3px 6px rgba(160,120,30,.25))" }} />
          <span style={{ flex: 1, background: "rgba(255,255,255,.75)", border: "1px solid #eee0bd", borderRadius: 13, borderTopLeftRadius: 4, padding: "9px 12px", fontSize: 11.5, fontWeight: 700, color: "#4a4030" }}>
            {data.v2.arcoLine}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <div style={kpiBox}><b style={{ ...kpiNum, color: ACC }}>{k.starDone}<small style={{ fontSize: 11, color: "#9aa6b3" }}>/{k.starRequired}</small></b><span style={kpiLbl}>★{k.star}の達成曲</span></div>
          <div style={kpiBox}><b style={{ ...kpiNum, color: k.basicsWeek > 0 ? GOOD : SUB }}>{k.basicsWeek > 0 ? `+${k.basicsWeek}` : "±0"}</b><span style={kpiLbl}>今週の基礎練</span></div>
          <div style={kpiBox}><b style={{ ...kpiNum, color: k.skillsWeek > 0 ? GOLD : SUB }}>{k.skillsWeek > 0 ? `+${k.skillsWeek}` : "±0"}</b><span style={kpiLbl}>今週のわざ</span></div>
        </div>
      </div>
    </div>
  )
}
const kpiBox: React.CSSProperties = { flex: 1, textAlign: "center", background: "rgba(255,255,255,.65)", border: "1px solid #efe5cc", borderRadius: 13, padding: "10px 4px 8px" }
const kpiNum: React.CSSProperties = { display: "block", fontSize: 23, fontWeight: 900, lineHeight: 1.1, ...tnum }
const kpiLbl: React.CSSProperties = { fontSize: 8.5, fontWeight: 800, color: "#9a8c74" }

/* ═ わざの地図: 俯瞰ミニマップ + 横スライド (タップ不要・情報常時表示) ═ */
function SkillsChapter({ userId, data, readOnly }: { userId: string; data: KarteData; readOnly: boolean }) {
  if (!data.skillMap) {
    if (readOnly) return null
    return (
      <div style={{ padding: "20px 18px 4px", textAlign: "center" }}>
        <div style={kicker}>SKILLS</div>
        <div style={chapTitle}>わざの地図</div>
        <div style={{ fontSize: 12, color: SUB, margin: "8px 0 12px", lineHeight: 1.7 }}>
          スラーやビブラートなど「わざ」の習得と安定が一目でわかる地図。<br />
          先生が気づいた癖を体の場所で見られる「からだの癖」も。<br />
          <b>先生とつながると開放</b>されます。
        </div>
        <Link href={`/${userId}/find-teacher`}
          style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 800, color: "#fff", background: ACC, borderRadius: 9, padding: "9px 18px", textDecoration: "none", marginBottom: 12 }}>
          <Search size={14} /> 先生を探す →
        </Link>
      </div>
    )
  }
  const { nodes, currentStar } = data.skillMap
  // 並び: 実測あり → 習得済み(データ待ち) → 挑戦できる → まだ先
  const order = (n: SkillNode) =>
    n.pct != null ? 0 : n.state === "acquired_nodata" ? 1 : n.state === "ready" ? 2 : 3
  const sorted = [...nodes].sort((a, b) => order(a) - order(b) || a.star - b.star)
  const litCount = nodes.filter((n) => n.state === "stable" || n.state === "wobble" || n.state === "acquired_nodata").length

  const tile = (n: SkillNode) => {
    const lit = n.state === "stable" || n.state === "wobble" || n.state === "acquired_nodata"
    const style: React.CSSProperties = {
      width: 21, height: 21, borderRadius: 7, boxSizing: "border-box",
      background: lit
        ? "linear-gradient(150deg,#ffe9a8,#e3b93c)"
        : n.state === "ready" ? "#f6edd6" : "#efe9da",
      border: n.state === "ready" ? "1.5px solid #e3c96a" : "none",
      boxShadow: lit ? "0 1px 3px rgba(200,160,40,.35)" : "none",
      opacity: n.state === "wobble" ? 0.85 : 1,
    }
    return <span key={n.id} style={style} title={n.label} />
  }

  return (
    <Reveal>
      <div style={{ padding: "18px 18px 0" }}>
        <div style={kicker}>SKILLS</div>
        <div style={chapTitle}>わざの地図 <span style={{ fontSize: 10, fontWeight: 800, color: SUB }}>いまの★{currentStar}</span></div>
        <div style={chapNote}>15のわざ ・ {litCount}つ点灯 ・ 横にスライドでくわしく</div>
        {/* 俯瞰ミニマップ: 点灯状況が3秒でわかる (地図性) */}
        <div style={{ display: "flex", gap: 5, marginTop: 8, flexWrap: "wrap" }}>{nodes.map(tile)}</div>
      </div>
      <div style={railStyle}>
        {sorted.map((n) => {
          const lit = n.state === "stable" || n.state === "wobble" || n.state === "acquired_nodata"
          const locked = n.state === "locked"
          return (
            <div key={n.id} style={{ ...railCard, ...(lit ? litCard : {}), ...(locked ? dimCard : {}) }}>
              <div style={{ fontSize: 12, fontWeight: 900, lineHeight: 1.4 }}>
                {n.label}
                {n.isNew && <span style={{ fontSize: 7.5, fontWeight: 900, color: "#fff", background: BAD, borderRadius: 999, padding: "1px 6px", marginLeft: 5, verticalAlign: 2 }}>NEW</span>}
              </div>
              {n.pct != null ? (
                <>
                  <div style={{ ...tnum, fontSize: 25, fontWeight: 900, lineHeight: 1.15, marginTop: 4, color: n.state === "wobble" ? WARN : GOOD }}>
                    {n.pct}<span style={{ fontSize: 11 }}>%</span>
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: SUB, marginTop: 2 }}>
                    {n.weekDelta != null && n.weekDelta !== 0
                      ? `先週より ${n.weekDelta > 0 ? `+${n.weekDelta}` : n.weekDelta}`
                      : n.state === "wobble" ? "ゆらぎ中 ・ 練習しどき" : "安定してきた"}
                  </div>
                  {n.series.length >= 2 && (
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 2.5, height: 24, marginTop: 8 }} aria-hidden>
                      {n.series.slice(-8).map((v, i, arr) => (
                        <span key={i} style={{ flex: 1, height: `${Math.max(12, v)}%`, borderRadius: "2px 2px 0 0", background: i === arr.length - 1 ? "#c9a227" : "linear-gradient(180deg,#e3c96a,#d8b34e)" }} />
                      ))}
                    </div>
                  )}
                  {!readOnly && (
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <Link href={`/${userId}/progress/skill/${n.id}`} style={{ fontSize: 9.5, fontWeight: 800, color: ACC, textDecoration: "none" }}>くわしく →</Link>
                      {n.practiceHref && <Link href={n.practiceHref} style={{ fontSize: 9.5, fontWeight: 800, color: WARN, textDecoration: "none" }}>練習する →</Link>}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#c0b598", marginTop: 4 }}>—</div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: SUB, marginTop: 2 }}>
                    {n.state === "acquired_nodata" ? "習得ずみ ・ データ集め中"
                      : n.state === "ready" ? "つぎに挑戦できる"
                      : `★${n.star} で出会う`}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </Reveal>
  )
}

/* ═ 表現のレベル: 認定★の横スライド ═ */
function ExprChapter({ userId, data, readOnly }: { userId: string; data: KarteData; readOnly: boolean }) {
  if (!data.v2.expression) {
    if (readOnly) return null
    return (
      <Reveal>
        <div style={{ padding: "18px 18px 14px", textAlign: "center" }}>
          <div style={kicker}>ESPRESSIONE</div>
          <div style={chapTitle}>表現のレベル</div>
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
  const litCount = nodes.filter((n) => n.star > 0).length
  return (
    <Reveal>
      <div style={{ padding: "18px 18px 0" }}>
        <div style={kicker}>ESPRESSIONE</div>
        <div style={chapTitle}>表現のレベル</div>
        <div style={chapNote}>
          先生の認定 ・ ★は認定された曲のレベル
          {litCount === 0 && " ・ 曲で表現して「先生に聴いてもらう」と認定してもらえるよ"}
        </div>
      </div>
      <div style={railStyle}>
        {nodes.map((n) => {
          const lit = n.star > 0
          const latest = n.history[n.history.length - 1]
          const jp = n.label.replace(/（.+）$/, "")
          const it = (n.label.match(/（(.+)）$/)?.[1] ?? "").toUpperCase()
          return (
            <div key={n.tagId} style={{ ...railCard, ...(lit ? litCard : dimCard) }}>
              <div style={{ fontSize: 12, fontWeight: 900, lineHeight: 1.4 }}>
                {jp}
                {n.isNew && <span style={{ fontSize: 7.5, fontWeight: 900, color: "#fff", background: BAD, borderRadius: 999, padding: "1px 6px", marginLeft: 5, verticalAlign: 2 }}>NEW</span>}
              </div>
              {it && <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: ".1em", color: SUB, marginTop: 1 }}>{it}</div>}
              <div style={{ fontSize: 20, fontWeight: 900, marginTop: 5, color: lit ? "#c9820e" : "#c0b598" }}>
                {lit
                  ? <>{"★".repeat(Math.min(5, n.star))}<span style={{ color: "#ecdcb2" }}>{"★".repeat(Math.max(0, 5 - n.star))}</span></>
                  : "☆☆☆☆☆"}
              </div>
              <div style={{ fontSize: 9, fontWeight: 800, color: SUB, marginTop: 3, lineHeight: 1.5 }}>
                {lit ? `${latest?.title ?? ""}で認定` : "これから出会う表現"}
              </div>
            </div>
          )
        })}
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

/* ═ いちばんの発見 (虫めがね・大数字の1枚) ═ */
function DiscoveryChapter({ userId, data, readOnly }: { userId: string; data: KarteData; readOnly: boolean }) {
  const d = data.v2.discovery
  const BAND_LABEL: Record<string, string> = { low: "低い弦域（G・D線）", mid: "まん中（A線域）", high: "高い弦域（E線域）" }
  const hasFinding = d.keyWorst || d.registerWorst || d.lens
  return (
    <Reveal>
      <div style={{ padding: "18px 18px 0" }}>
        <div style={kicker}>DISCOVERY</div>
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <div style={chapTitle}>いちばんの発見</div>
          {!readOnly && (
            <Link href={`/${userId}/progress/numbers`} style={{ marginLeft: "auto", fontSize: 10, fontWeight: 800, color: ACC, textDecoration: "none" }}>数字のへや →</Link>
          )}
        </div>
      </div>
      <div style={{ margin: "10px 18px 16px" }}>
        {!hasFinding ? (
          <div style={{ fontSize: 11.5, color: SUB, lineHeight: 1.7 }}>録音がたまると、苦手な調・音域・音がここに見えてくるよ。</div>
        ) : (
          <div style={{ background: "rgba(255,255,255,.8)", border: "1px solid #efe5cc", borderRadius: 16, padding: "13px 15px" }}>
            {d.lens ? (
              <>
                <div style={{ fontSize: 9.5, fontWeight: 800, color: "#a4527a", display: "flex", alignItems: "center", gap: 4 }}><Search size={11} /> 30日の録音ぜんぶから見つけた</div>
                <div style={{ fontSize: 27, fontWeight: 900, marginTop: 2 }}>
                  {d.lens.note} <span style={{ fontSize: 12, color: "#8a7c62", fontWeight: 800 }}>{d.lens.hand ? `${d.lens.hand}・推定` : d.lens.raw}</span>
                </div>
                <div style={{ fontSize: 10.5, color: "#6a5f48", marginTop: 4, lineHeight: 1.7 }}>
                  成功 <b style={tnum}>{d.lens.successPct}%</b>。{d.lens.type}
                  {d.lens.cents != null && <>（平均 {d.lens.cents > 0 ? "+" : ""}{d.lens.cents}セント）</>}。
                  {d.lens.fromNote && <>とくに<b>「{d.lens.fromNote}」から動いてきた時</b>にずれやすい。</>}
                  <span style={{ color: GOLD, fontWeight: 800 }}> 処方はホームのおすすめに出しておくね。</span>
                </div>
              </>
            ) : (
              <div style={{ fontSize: 12, lineHeight: 1.7 }}>
                いまの苦手:
                {d.keyWorst && <> <b style={{ color: BAD }}>{d.keyWorst.label} <span style={tnum}>{d.keyWorst.pct}%</span></b></>}
                {d.keyWorst && d.registerWorst && " ・ "}
                {d.registerWorst && <>とくに<b>{BAND_LABEL[d.registerWorst.band]}</b> <span style={{ ...tnum, color: BAD, fontWeight: 800 }}>{d.registerWorst.pct}%</span></>}
              </div>
            )}
            {d.lens && (d.keyWorst || d.registerWorst) && (
              <div style={{ fontSize: 10, color: SUB, marginTop: 7 }}>
                苦手な調: {d.keyWorst ? `${d.keyWorst.label} ${d.keyWorst.pct}%` : "—"}
                {d.registerWorst && ` ・ ${BAND_LABEL[d.registerWorst.band]} ${d.registerWorst.pct}%`}
              </div>
            )}
            <details style={{ marginTop: 9 }}>
              <summary style={{ fontSize: 10, fontWeight: 800, color: SUB, cursor: "pointer" }}>▸ もっと見る（練習の実態・調・奏法）</summary>
              <div style={{ fontSize: 11, color: "#5a5140", lineHeight: 1.9, marginTop: 7 }}>
                練習 <b style={tnum}>{data.practiceDays}日</b> ・ 録音 <b style={tnum}>{data.recordingCount}回</b> ・ れんぞく <b style={tnum}>{data.streak}日</b> <Flame size={13} color="#e8743b" style={{ verticalAlign: -2 }} />
                {data.keyRows.length > 0 && (
                  <div style={{ marginTop: 4 }}>
                    {data.keyRows.slice(0, 5).map((kk) => (
                      <div key={kk.label} style={{ display: "flex", gap: 8, fontSize: 10.5 }}>
                        <span style={{ width: 92, flex: "none" }}>{kk.label}</span>
                        <span style={{ color: SUB }}>{kk.count}回</span>
                        {kk.avgPitch != null && <span style={{ ...tnum, marginLeft: "auto", fontWeight: 800 }}>{kk.avgPitch}%</span>}
                      </div>
                    ))}
                  </div>
                )}
                {data.techRows.length > 0 && (
                  <div style={{ marginTop: 6 }}>
                    {data.techRows.slice(0, 4).map((t) => {
                      const pct = Math.max(0, Math.round(100 - (t.miss / Math.max(1, t.target)) * 100))
                      return (
                        <div key={t.label} style={{ display: "flex", gap: 8, fontSize: 10.5 }}>
                          <span style={{ width: 92, flex: "none" }}>{t.label}</span>
                          <span style={{ flex: 1, alignSelf: "center", height: 5, borderRadius: 3, background: "#efe9da", overflow: "hidden" }}>
                            <span style={{ display: "block", width: `${pct}%`, height: "100%", background: pct < 70 ? WARN : GOOD }} />
                          </span>
                          <b style={{ ...tnum, width: 36, textAlign: "right" }}>{pct}%</b>
                        </div>
                      )
                    })}
                  </div>
                )}
                <div style={{ fontSize: 9, color: "#c0b598", marginTop: 5 }}>※ アルコが、録音の音程・リズムから見ているよ</div>
              </div>
            </details>
          </div>
        )}
      </div>
    </Reveal>
  )
}

/* ═ きみの歴史: 縦スライド + 時間の道 (2026-08-06確定・デモ0edb9f66) ═ */
function HistorySection({ data }: { data: KarteData }) {
  const ms = data.v2.milestones
  const railRef = useRef<HTMLDivElement | null>(null)
  const [active, setActive] = useState(0)

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
        const dd = Math.abs(center - mid)
        if (dd < bestDist) { bestDist = dd; best = i }
      })
      setActive(best)
    })
  }

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

      <div style={{ display: "flex", gap: 12, padding: "10px 18px 16px" }}>
        {/* 時間の道 (縦): 上=いま / 下=はじまり */}
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
                background: big ? "linear-gradient(155deg,#fffdf4,#fbf2d8)" : "rgba(255,255,255,.8)",
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
    </Reveal>
  )
}
