"use client"

// 技術の詳細分析 UI — B1「リングと 3 つの事実」(2026-09-10 Tetsuo承認・モック cca7f28e が仕様)。
// back「‹ わざの習得状況」・ h1 ds.t ・ subT「分類 ・ 習得段階」・ いまの状態カード (リング)。
//
// 2026-09-10 の変更点:
//  - いまの状態: bigN38 + 金バー → リング + 「判定できた N 音」+ 先週比。金は成果のみに使う配色
//    ルールがあり、精度は成果ではないため青にした。
//  - 拾えなかった音が多い録音では数字を出さず、検出率を出す。しきい値は新規に作らず既存の
//    DETECTION_RATE_MIN=0.50 と target>=8 を踏襲 ([[project_technique_metric_misfit]])。
//  - わざマスターの記録: 課題曲が未登録でも枠を出し「準備中」と表示する。後から登録しても
//    レイアウトが動かないようにするため。
//  - 状態ラベルから精度を外した (「ゆらぎ中」→ 習得段階のみ)。2026-09-01 確定「精度は判定基準
//    ではなく表示指標」に合わせる。表示だけの変更で、lib の state 判定と他画面には触っていない。
//  - 「先生が気づいた癖」の章は削除 (先生機能は対象外・2026-09-10 Tetsuo指示)。
//  - 聴き比べ と 章末のおすすめ練習 を削除 (2026-09-10 Tetsuo指示)。効く教材は 3 つの事実の行に
//    出すので章と重複していた。
//  - 精度の推移と指導の効果 を削除 (2026-09-11 Tetsuo指示)。折れ線と Chart ごと落とした
// くわしく に畳むもの: わざマスターの記録
import Link from "next/link"
import type { SkillDetailData } from "@/app/_libs/growthKarte"
import ds from "@/app/components/ds.module.css"
import type { SkillLadderRow, SkillMasteryEntry } from "@/app/_libs/skillMastery"
import { MASTER_AVG, MASTER_RECENT_COUNT } from "@/app/_libs/masteryRule"

const SUB = "var(--text-sub)"
const ACCENT = "#7fa4e8"

// 数字を出してよい録音の条件。新規の値は作らず既存の足切りを踏襲する
const MIN_COVERAGE = 0.5   // music-analyzer/lib/subtask_judges.py DETECTION_RATE_MIN
const MIN_TARGET = 8       // growthKarte の精度を出す条件と同じ

const factRow: React.CSSProperties = { display: "flex", gap: 11, alignItems: "flex-start", padding: "11px 2px" }
const factKey: React.CSSProperties = { width: 62, flex: "none", fontSize: 9.5, fontWeight: 900, letterSpacing: ".06em", color: "var(--text-sub)", paddingTop: 3 }


// 習得段階のみ。精度からは判定しない (2026-09-01 確定)。stable / wobble は精度 70% の線で
// 分かれる区別なので、この画面ではどちらも「習得ずみ」に寄せる。lib の state 自体は変えていない。
const STATE_LABEL: Record<SkillDetailData["state"], string> = {
  stable: "習得ずみ",
  wobble: "習得ずみ",
  acquired_nodata: "習得ずみ",
  ready: "これから挑戦",
  locked: "まだ先",
}

/** 挑戦中の段に書く一行。マスターは 直近5回平均 90 かつ 5 回以上 (achievement.py と同じ) なので、
    5 回に満たないうちは点数ではなく残りの回数を出す。ここで点差だけを出すと、
    回数が足りずに判定が始まらない状態を「あと少し」と誤って伝えてしまう */
function masteryHint(l: SkillLadderRow): string {
  const n = l.count ?? 0
  if (n === 0 || l.avg == null) return "まだ弾いていません"
  if (n < MASTER_RECENT_COUNT) return `あと ${MASTER_RECENT_COUNT - n} 回 弾くと判定できるよ ・ いまの平均 ${l.avg} 点`
  if (l.avg >= MASTER_AVG) return `直近5回の平均 ${l.avg} 点 ・ まもなくマスター`
  return `直近5回の平均 ${l.avg} 点 ・ マスターまで あと ${Math.ceil(MASTER_AVG - l.avg)}`
}

// 何を見て合否にしているか。数字だけ出しても何の出来か分からないため
const QUALITY_NOTE: Record<string, string> = {
  staccato: "楽譜の音価の半分以下に短く切れていれば合格だよ。",
  spiccato: "楽譜の音価の半分以下に短く切れていれば合格だよ。",
  portato: "切るけれど切りすぎない長さなら合格だよ。",
  trill: "主音と補助音を4回以上いききしていれば合格だよ。",
  pizzicato: "はじいた音らしく、出だしが鋭くて減っていけば合格だよ。",
}

// 分類ラベル (karte08 subT 用 ・ SkillsLevelClient と同一)
const CAT_OF: Record<string, string> = {
  slur: "弓", staccato: "弓", portato: "弓", bow_staccato: "弓", tremolo: "弓", spiccato: "弓", ricochet: "弓", pizzicato: "弓",
  position: "フィンガリング", double: "フィンガリング",
  trill: "装飾", mordent: "装飾", glissando: "装飾",
  vibrato: "音色・特殊", harmonic: "音色・特殊",
}

/** 精度のリング。金は成果のみに使う配色ルールがあるため青 (--text-link) で描く */
function Ring({ pct }: { pct: number }) {
  const R = 46
  const C = 2 * Math.PI * R
  return (
    <div style={{ position: "relative", width: 108, height: 108, flex: "none" }}>
      <svg width="108" height="108" viewBox="0 0 108 108" style={{ display: "block", transform: "rotate(-90deg)" }}>
        <circle cx="54" cy="54" r={R} fill="none" stroke="rgba(150,175,225,.16)" strokeWidth="10" />
        <circle cx="54" cy="54" r={R} fill="none" stroke="var(--text-link)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${(C * pct) / 100} ${C}`} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 29, fontWeight: 900, color: "var(--cream)", lineHeight: 1 }}><span data-anim="count">{pct}</span></div>
        <div style={{ fontSize: 9.5, fontWeight: 800, color: SUB, letterSpacing: ".06em" }}>%</div>
      </div>
    </div>
  )
}

export default function SkillDetailClient({ userId, data, mastery = null }: { userId: string; data: SkillDetailData; mastery?: SkillMasteryEntry | null }) {
  // 数字を出してよい録音か。拾えた音が少ないと、精度は演奏の巧拙ではなく検出の失敗を映す
  const covered = data.coverage != null && data.coverage >= MIN_COVERAGE
  const showPct = data.pct != null && covered && data.target >= MIN_TARGET
  const total = data.target + data.undetected
  // B1 の事実に出す「いまの一手」。認定曲は挑戦中の 1 曲、教材は推薦の先頭 1 件
  const now = mastery?.ladder.find((l) => l.state === "now") ?? null
  const top = data.recommended[0] ?? null
  // 畳む中身があるか。いまは わざマスターの記録 だけなので、認定曲が未登録なら折りたたみを出さない
  const hasMore = !!mastery && mastery.ladder.length > 0

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

      {/* いまの状態 (B1: リング + 判定できた音数 + 先週比 / 拾えていないときは検出率) */}
      <div className={ds.card}>
        <div className={ds.lab}>いまの状態</div>
        {showPct ? (
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
            <Ring pct={data.pct as number} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text-ink)" }}>{data.label}の精度</div>
              <div style={{ fontSize: 11, color: SUB, marginTop: 5, lineHeight: 1.65 }}>
                判定できた {data.target} 音の<br />音程とリズムから
              </div>
              {data.weekDelta != null && (
                <div style={{
                  display: "inline-block", marginTop: 8, fontSize: 10.5, fontWeight: 900, padding: "3px 9px", borderRadius: 999,
                  color: data.weekDelta >= 0 ? "var(--text-good)" : "var(--text-error)",
                  background: data.weekDelta >= 0 ? "rgba(92,201,138,.13)" : "rgba(255,123,110,.12)",
                  border: `1px solid ${data.weekDelta >= 0 ? "rgba(92,201,138,.4)" : "rgba(255,123,110,.38)"}`,
                }}>
                  先週より {data.weekDelta >= 0 ? "+" : ""}{data.weekDelta}
                </div>
              )}
            </div>
          </div>
        ) : data.coverage != null && data.undetected > 0 ? (
          <>
            <div style={{ marginTop: 8, background: "var(--card-in)", border: "1px solid rgba(255,123,110,.35)", borderRadius: 14, padding: "14px 15px" }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text-error)" }}>{data.label}の音を拾えていません</div>
              <div style={{ fontSize: 11.5, color: "var(--text-body)", marginTop: 6, lineHeight: 1.75 }}>
                {total} 音のうち、判定できたのは {data.target} 音だけ。{data.label}は音がつながるので、録音の環境によっては拾いにくいことがあるよ。
              </div>
              <div style={{ marginTop: 11, height: 7, borderRadius: 99, background: "rgba(150,175,225,.14)", overflow: "hidden" }}>
                <i style={{ display: "block", height: "100%", borderRadius: 99, background: "var(--text-error)", width: `${Math.round((data.coverage as number) * 1000) / 10}%` }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, color: "var(--text-muted)", fontWeight: 700, marginTop: 5 }}>
                <span>判定できた {data.target} 音</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{(Math.round((data.coverage as number) * 1000) / 10).toFixed(1)}%</span>
              </div>
            </div>
            <Link href={`/${userId}/support`} className="pressable"
              style={{ display: "block", marginTop: 11, textAlign: "center", background: "transparent", border: "1px solid var(--line)", color: SUB, fontWeight: 800, fontSize: 12, borderRadius: 14, padding: 13, textDecoration: "none" }}>
              録音のコツを見る
            </Link>
          </>
        ) : (
          <div style={{ fontSize: 11.5, color: "var(--text-sub)", marginTop: 8, lineHeight: 1.75 }}>
            まだ判定できる録音がないよ。この技術が出てくる曲や教材を弾くと、ここに精度が出るよ。
          </div>
        )}
      </div>

      {/* 奏法そのものの出来 (2026-09-12)。音程とリズムではなく、音の長さや音量の包絡から
          「奏法として弾けているか」を見る。判定を持つ 5 奏法だけに出す。
          いまは測定値のある録音がほとんど無いので、多くの場合ここは「まだ測れていません」になる */}
      {data.quality && (
        <div className={ds.card}>
          <div className={ds.lab}>{data.label}の出来</div>
          {data.quality.pct != null ? (
            <>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 9, marginTop: 7 }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: "var(--cream)", lineHeight: 1 }}>{data.quality.pct}</div>
                <span style={{ paddingBottom: 4, fontSize: 11, color: SUB, fontWeight: 700 }}>
                  % ・ {data.quality.judged} 音のうち {data.quality.ok} 音
                </span>
              </div>
              <div style={{ fontSize: 10.5, color: SUB, marginTop: 7, lineHeight: 1.7 }}>
                {QUALITY_NOTE[data.id] ?? "奏法として弾けているかを見ているよ。"}
                {data.quality.unmeasured > 0 && `${data.quality.unmeasured} 音は測れなかったので数えていないよ。`}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 11.5, color: SUB, marginTop: 8, lineHeight: 1.75 }}>
              まだ測れていないよ。{data.quality.unmeasured > 0 && `${data.label}の音は ${data.quality.unmeasured} 音あるけれど、`}
              音の長さを測るには録音がうまく拾えている必要があるよ。
            </div>
          )}
        </div>
      )}

      {/* B1 の 3 つの事実。いまの一手だけをここに置き、詳細は下の「くわしく」に畳む。
          先生の指摘は今回の対象外のため出していない (枠を足せば 3 行に戻る) */}
      <div className={ds.card}>
        <div style={factRow}>
          <span style={factKey}>認定曲</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            {now ? (
              <>
                <Link href={`/${userId}/scores/${now.scoreId}`} style={{ fontSize: 13, fontWeight: 900, color: "var(--text-ink)", textDecoration: "none" }}>
                  <span style={{ color: "var(--gold)" }}>★{now.star}</span> {now.title}
                </Link>
                <span style={{ display: "block", fontSize: 10.5, color: SUB, marginTop: 3 }}>
                  {masteryHint(now)}
                </span>
              </>
            ) : (
              <>
                <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 800, color: "var(--text-muted)" }}>
                  <span style={{ display: "inline-block", width: 30, height: 1, background: "rgba(150,175,225,.3)" }} />
                  準備中
                </span>
                <span style={{ display: "block", fontSize: 10.5, color: SUB, marginTop: 3 }}>
                  課題曲が登録されると、マスターまでの残りがここに出るよ
                </span>
              </>
            )}
          </span>
        </div>
        <div style={{ ...factRow, borderTop: "1px solid rgba(150,175,225,.09)" }}>
          <span style={factKey}>効く教材</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            {top ? (
              <Link href={`/${userId}/practice/${top.category}/${top.id}`} className="pressable"
                style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "var(--text-ink)" }}>
                {top.star != null && <span style={{ flex: "none", fontSize: "var(--fs-label)", fontWeight: 900, color: "var(--gold)" }}>★{top.star}</span>}
                <b style={{ fontSize: 13, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{top.title}</b>
                <span style={{ marginLeft: "auto", flex: "none", fontSize: "var(--fs-caption)", fontWeight: 800, color: ACCENT }}>開く →</span>
              </Link>
            ) : (
              <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 800 }}>録音がたまると出るよ</span>
            )}
          </span>
        </div>
      </div>

      {/* B1: 押すボタンは 1 つ。認定曲があるときだけ出す */}
      {now && (
        <Link href={`/${userId}/scores/${now.scoreId}`} className="pressable"
          style={{ display: "block", marginTop: 14, textAlign: "center", background: "var(--accent)", color: "#fff", fontWeight: 900, fontSize: 13.5, borderRadius: 14, padding: 13, textDecoration: "none", boxShadow: "0 6px 16px -6px rgba(43,91,196,.8)" }}>
          ★{now.star}の課題曲を弾く
        </Link>
      )}

      {/* B1: ここから下は畳む。上から 1 画面で状態と次の一手が読めるようにするため。
          中身が無いときは折りたたみごと出さない (認定曲が未登録だと空の見出しだけが残るため) */}
      {hasMore && (
      <details style={{ marginTop: 14 }}>
        <summary style={{ listStyle: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "var(--card-in)", border: "1px solid var(--line)", borderRadius: 14, fontSize: 12.5, fontWeight: 800, color: "var(--text-sub)" }}>
          <span>わざマスターの記録</span>
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>くわしく ▼</span>
        </summary>

      {/* わざマスターの記録 (2026-09-11 Tetsuo確定 案3「認定証が積まれていく」)。
          合格するたびに金の枠の認定証が 1 枚増える。挑戦中は白紙の認定証として点線で置き、
          残りをそこに書く。まだ先の段は 1 行だけ。旧: ★・課題曲・判定の 3 列の表 (案4)。
          判定の仕組みは 2026-09-01 確定のまま。認定曲をマスターするとそのわざの★が上がる */}
      {mastery && mastery.ladder.length > 0 && (
        <div className={ds.card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div className={ds.lab}>わざマスターの記録</div>
            {mastery.rank != null && (
              <span style={{ fontSize: 10, fontWeight: 900, color: "var(--gold)", background: "rgba(232,178,60,.13)", border: "1px solid rgba(232,178,60,.4)", borderRadius: 999, padding: "3px 11px", whiteSpace: "nowrap" }}>
                ★{mastery.rank} マスター
              </span>
            )}
          </div>
          <div style={{ marginTop: 13, display: "flex", flexDirection: "column", gap: 9 }}>
            {mastery.ladder.map((l) => l.state === "done" ? (
              /* 合格 ・ 金の枠の認定証 */
              <div key={l.star} style={{ position: "relative", border: "2px solid rgba(232,178,60,.75)", borderRadius: 10, padding: "11px 13px", background: "rgba(232,178,60,.07)" }}>
                <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: ".2em", color: "var(--gold)" }}>{data.label} ・ ★{l.star} 認定</div>
                <Link href={`/${userId}/scores/${l.scoreId}`} style={{ display: "block", fontSize: 13.5, fontWeight: 900, marginTop: 3, color: "var(--text-ink)", textDecoration: "none" }}>{l.title}</Link>
                <div style={{ fontSize: 9.5, color: SUB, marginTop: 3 }}>{l.masteredAt} マスター</div>
                <span style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%) rotate(-8deg)", border: "2px solid rgba(232,178,60,.8)", color: "var(--gold)", borderRadius: 6, padding: "2px 8px", fontSize: 9, fontWeight: 900 }}>合格</span>
              </div>
            ) : l.state === "now" ? (
              /* 挑戦中 ・ 白紙の認定証 */
              <div key={l.star} style={{ border: "1px dashed rgba(150,175,225,.3)", borderRadius: 10, padding: "11px 13px", background: "rgba(150,175,225,.03)" }}>
                <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: ".2em", color: "#9fc2ff" }}>{data.label} ・ ★{l.star} 認定</div>
                <Link href={`/${userId}/scores/${l.scoreId}`} style={{ display: "block", fontSize: 13, fontWeight: 900, marginTop: 3, color: "var(--text-ink)", textDecoration: "none" }}>{l.title}</Link>
                <div style={{ fontSize: 9.5, color: SUB, marginTop: 3 }}>{masteryHint(l)}</div>
              </div>
            ) : (
              /* まだ先 ・ 1 行だけ */
              <div key={l.star} style={{ border: "1px dashed rgba(150,175,225,.16)", borderRadius: 10, padding: "9px 13px", background: "transparent", display: "flex", gap: 8, alignItems: "center", fontSize: 11, fontWeight: 800, color: "var(--text-muted)" }}>
                <span>★{l.star}</span>{l.title}
              </div>
            ))}
          </div>
          {/* 課題曲を弾くボタンは B1 の 1 つのボタンとして上に置いた */}
        </div>
      )}

      </details>
      )}
    </div>
  )
}
