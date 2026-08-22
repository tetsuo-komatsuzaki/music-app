// わざの5つの状態 (確定モック karte09 STATES5 の写経 ・ 2026-08-22 新設ページ)
// back「‹ わざの習得状況」・ h1 ds.t ・ subT「なにで変わるか」・
// 5状態の見本カード (grid2 ・ リンクなし) + 「状態が変わる引き金」カード。
import Link from "next/link"
import ds from "@/app/components/ds.module.css"

export const metadata = { title: "わざの5つの状態" }

const GOOD = "#a8c97f"
const WARN = "#e8a78f"

// 原本 skillcards.STATES_DEMO
const DEMO: { name: string; label: string; color: string; pct: number | null; isNew?: boolean; delta?: number; locked?: boolean }[] = [
  { name: "安定", label: "安定", color: GOOD, pct: 92, delta: 4 },
  { name: "ゆらぎ中", label: "ゆらぎ中 ・ 練習しどき", color: WARN, pct: 61, delta: -3 },
  { name: "データ集め中", label: "習得ずみ ・ データ集め中", color: "var(--gold)", pct: null, isNew: true },
  { name: "つぎに挑戦", label: "つぎに挑戦できる", color: "#7fa4e8", pct: null },
  { name: "まだ先", label: "★4 で出会う", color: "var(--text-muted)", pct: null, locked: true },
]

export default async function SkillStatesPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 0 60px" }}>
      <Link href={`/${userId}/progress/skills`}
        style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--text-sub)", fontSize: 13, fontWeight: 700, padding: "10px 2px 2px", textDecoration: "none" }}>
        ‹ わざの習得状況
      </Link>
      <h1 className={ds.t} style={{ paddingTop: 0 }}>わざの5つの状態</h1>
      <div style={{ color: "var(--text-sub)", fontSize: 13, padding: "5px 2px 0" }}>なにで変わるか</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
        {DEMO.map((d) => (
          <div key={d.name} className={ds.card} style={{ margin: 0, padding: "12px 13px", ...(d.locked ? { opacity: 0.55 } : {}) }}>
            <b style={{ fontSize: 12.5, color: d.locked ? "var(--text-sub)" : "var(--text-ink)" }}>{d.name}</b>
            {d.isNew && (
              <span style={{ fontSize: 8, fontWeight: 900, color: "#fff", background: "#e8697a", borderRadius: 999, padding: "1px 6px", marginLeft: 5, verticalAlign: 2 }}>NEW</span>
            )}
            {d.pct != null ? (
              <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginTop: 6 }}>
                <span className={ds.bigN} style={{ fontSize: 30, lineHeight: 1, color: d.color, fontVariantNumeric: "tabular-nums" }}>{d.pct}</span>
                <span style={{ fontSize: 11, color: "var(--text-sub)", fontWeight: 800 }}>%</span>
              </div>
            ) : (
              <div style={{ marginTop: 6 }}>
                <span style={{ fontSize: 26, lineHeight: 1, color: "var(--text-muted)", fontWeight: 900 }}>—</span>
              </div>
            )}
            <div style={{ fontSize: 10, fontWeight: 800, color: d.color, marginTop: 3 }}>{d.label}</div>
            {d.delta != null && (
              <div style={{ fontSize: 10, fontWeight: 800, marginTop: 2, color: d.delta > 0 ? GOOD : WARN }}>
                今週 {d.delta > 0 ? `+${d.delta}` : d.delta}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={ds.card} style={{ padding: "13px 15px" }}>
        <div className={ds.lab}>状態が変わる引き金</div>
        <div style={{ fontSize: 11.5, color: "var(--text-sub)", marginTop: 9, lineHeight: 1.9 }}>
          <b style={{ color: "var(--text-ink)" }}>教材を通ると</b> ロック・つぎに挑戦できる → 習得ずみ<br />
          <b style={{ color: "var(--text-ink)" }}>判定が8個たまると</b> 習得ずみ → 安定 または ゆらぎ中<br />
          <b style={{ color: "var(--text-ink)" }}>70%をまたぐと</b> 安定 ⇄ ゆらぎ中<br />
          <b style={{ color: "var(--text-ink)" }}>★が上がると</b> まだ先 → つぎに挑戦できる
        </div>
        <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 10 }}>
          一度 習得すると 未習得には戻らないよ
        </div>
      </div>
    </div>
  )
}
