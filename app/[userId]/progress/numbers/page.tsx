// 数字のへや (Phase2 D3・2026-08-03)。カルテ⑤の詳細画面: 調→音域→テンポ→音の
// 掘れるツリー全体 + 得意も苦手も一覧 + 今週うごいた枝。
import Link from "next/link"
import { getUserIdsFromParams } from "@/app/_libs/getUserIdsFromParams"
import { buildNumbersRoom, type KartePeriod } from "@/app/_libs/growthKarte"

export const metadata = { title: "数字のへや" }

const SUB = "#8a9099"
const GOOD = "#0f8a4f"
const BAD = "#d0453a"
const GOLD = "#a97b1f"
const card: React.CSSProperties = { background: "#fff", border: "1px solid #eceff3", borderRadius: 12, padding: "13px 15px", marginBottom: 11 }
const ttl: React.CSSProperties = { fontSize: 12.5, fontWeight: 900, marginBottom: 8 }
const tnum: React.CSSProperties = { fontVariantNumeric: "tabular-nums" }

function pctColor(pct: number) {
  return pct >= 85 ? GOOD : pct >= 70 ? "#c9752e" : BAD
}

function Row({ label, sub, pct }: { label: string; sub?: string; pct: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, marginBottom: 5 }}>
      <span style={{ width: 118, flex: "none", fontWeight: 700 }}>{label}</span>
      {sub && <span style={{ fontSize: 9.5, color: SUB, flex: "none" }}>{sub}</span>}
      <span style={{ flex: 1, height: 6, borderRadius: 3, background: "#eceff3", overflow: "hidden" }}>
        <span style={{ display: "block", width: `${pct}%`, height: "100%", background: pctColor(pct) }} />
      </span>
      <b style={{ ...tnum, width: 40, flex: "none", textAlign: "right", color: pctColor(pct) }}>{pct}%</b>
    </div>
  )
}

export default async function NumbersRoomPage({
  params, searchParams,
}: {
  params: Promise<{ userId: string }>
  searchParams: Promise<{ period?: string }>
}) {
  const p = await params
  const sp = await searchParams
  const { authUserId, dbUserId } = await getUserIdsFromParams(p)
  const period: KartePeriod = sp.period === "7d" ? "7d" : sp.period === "all" ? "all" : "30d"
  const d = await buildNumbersRoom(dbUserId, period)
  const REG_LABEL: Record<string, string> = { low: "低い弦域（G・D線）", mid: "まん中（A線域）", high: "高い弦域（E線域）" }
  const empty = d.keys.length === 0 && d.registers.length === 0 && d.worstNotes.length === 0

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "18px 14px 60px", color: "#1a2028" }}>
      <Link href={`/${authUserId}/progress`} style={{ fontSize: 12, color: SUB, textDecoration: "none" }}>← 成長カルテ</Link>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, margin: "8px 0 10px" }}>
        <h1 style={{ fontSize: 17, fontWeight: 900, margin: 0 }}>📊 数字のへや</h1>
        <span style={{ fontSize: 10, fontWeight: 800, color: SUB }}>得意も苦手もぜんぶ</span>
      </div>
      {/* 期間切替 (2026-08-06: カルテ本体から移設。期間が効くのはこの部屋だけ) */}
      <div style={{ display: "flex", gap: 4, background: "#eceef2", borderRadius: 10, padding: 3, marginBottom: 12 }}>
        {([["7d", "今週"], ["30d", "直近30日"], ["all", "全期間"]] as const).map(([pp, label]) => (
          <Link key={pp} href={`/${authUserId}/progress/numbers${pp === "30d" ? "" : `?period=${pp}`}`} scroll={false}
            style={{
              flex: 1, textAlign: "center", fontSize: 12, fontWeight: 800, padding: "7px 0", borderRadius: 8,
              textDecoration: "none",
              color: period === pp ? "#1a2028" : "#8b97a3",
              background: period === pp ? "#fff" : "transparent",
            }}>
            {label}
          </Link>
        ))}
      </div>

      {empty ? (
        <div style={card}><div style={{ fontSize: 12, color: SUB, lineHeight: 1.8 }}>この期間の録音がまだ少ないよ。録音がたまると、調・音域・音ごとの数字がここに並びます。</div></div>
      ) : (
        <>
          {d.weekMoved.length > 0 && (
            <div style={{ ...card, borderColor: "#d8dcf0" }}>
              <div style={ttl}>🌟 今週うごいた枝</div>
              <div style={{ fontSize: 12, lineHeight: 2 }}>
                {d.weekMoved.map((w) => (
                  <span key={w.label} style={{ marginRight: 14, whiteSpace: "nowrap" }}>
                    {w.label} <b style={{ ...tnum, color: w.delta > 0 ? GOOD : BAD }}>{w.delta > 0 ? `↑${w.delta}` : `↓${-w.delta}`}</b>
                  </span>
                ))}
              </div>
            </div>
          )}

          {d.keys.length > 0 && (
            <div style={card}>
              <div style={ttl}>🎼 調べつ <span style={{ fontSize: 9.5, color: SUB, fontWeight: 800 }}>演奏スコア平均・低い順</span></div>
              {d.keys.map((k) => <Row key={k.label} label={k.label} sub={`${k.count}回`} pct={k.pct} />)}
            </div>
          )}

          {d.registers.length > 0 && (
            <div style={card}>
              <div style={ttl}>🎹 音域べつ <span style={{ fontSize: 9.5, color: SUB, fontWeight: 800 }}>音単位の成功率</span></div>
              {d.registers.map((r) => <Row key={r.band} label={REG_LABEL[r.band]} sub={`${r.target}音`} pct={r.pct} />)}
            </div>
          )}

          {d.tempoBands.length > 0 && (
            <div style={card}>
              <div style={ttl}>⏱ テンポ帯べつ <span style={{ fontSize: 9.5, color: SUB, fontWeight: 800 }}>曲のテンポで分類</span></div>
              {d.tempoBands.map((t) => <Row key={t.label} label={t.label} sub={`${t.count}回`} pct={t.pct} />)}
              <div style={{ fontSize: 9.5, color: "#b3bcc6", marginTop: 4 }}>※ 録音時のテンポでの分析は、これからの録音がたまると精密になるよ</div>
            </div>
          )}

          {d.worstNotes.length > 0 && (
            <div style={card}>
              <div style={ttl}>🔍 音のじっくり表 <span style={{ fontSize: 9.5, color: SUB, fontWeight: 800 }}>にがて順</span></div>
              {d.worstNotes.map((n) => (
                <div key={n.raw} style={{ display: "flex", alignItems: "baseline", gap: 7, fontSize: 11.5, marginBottom: 5, flexWrap: "wrap" }}>
                  <b style={{ width: 44, flex: "none" }}>{n.kana}</b>
                  <span style={{ fontSize: 9.5, color: SUB }}>{n.hand ? `${n.hand}（推定）` : n.raw}・{n.target}音</span>
                  {n.cents != null && Math.abs(n.cents) >= 15 && (
                    <span style={{ fontSize: 9.5, fontWeight: 800, color: GOLD }}>{n.cents < 0 ? `ぶら下がり ${n.cents}c` : `上ずり +${n.cents}c`}</span>
                  )}
                  <b style={{ ...tnum, marginLeft: "auto", color: pctColor(n.pct) }}>{n.pct}%</b>
                </div>
              ))}
              {d.bestNotes.length > 0 && (
                <div style={{ fontSize: 10.5, color: GOOD, marginTop: 6 }}>
                  💮 とくいな音: {d.bestNotes.map((n) => `${n.kana} ${n.pct}%`).join(" ・ ")}
                </div>
              )}
            </div>
          )}

          {d.transitions.length > 0 && (
            <div style={{ ...card, marginBottom: 0 }}>
              <div style={ttl}>↔ 動きのにがて <span style={{ fontSize: 9.5, color: SUB, fontWeight: 800 }}>前の音 → この音</span></div>
              {d.transitions.map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 8, fontSize: 11.5, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700 }}>{t.from} → {t.to}</span>
                  <span style={{ fontSize: 9.5, color: SUB, alignSelf: "center" }}>{t.target}回中</span>
                  <b style={{ ...tnum, marginLeft: "auto", color: BAD }}>ミス率 {t.missRate}%</b>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
