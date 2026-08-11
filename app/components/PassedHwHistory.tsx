// 宿題「合格の履歴」共有ビュー (2026-08-11 Tetsuo確定)。先生の生徒カルテと生徒のやりとり画面で共用。
// カテゴリ (曲/音階/アルペジオ…) ごとに分かれ、その中で ★ごとにまとまって見える。
import { BadgeCheck } from "lucide-react"

export type PassedHwItem = {
  title: string
  cat: string // "曲" / 教材カテゴリラベル
  star: number | null
  when: string // M/D
  score: number | null // 提出時の点数
}

export default function PassedHwHistory({ items }: { items: PassedHwItem[] }) {
  if (items.length === 0) {
    return (
      <div style={{ background: "#fff", border: "1px solid #e6e9ef", borderRadius: 13, padding: "16px 15px", fontSize: "var(--fs-body)", color: "var(--text-muted)", lineHeight: 1.7 }}>
        まだ合格した宿題はありません。宿題を提出して、先生が「合格」にするとここに刻まれます。
      </div>
    )
  }
  // カテゴリ → ★ の2段グループ (出現順を保持)
  const catOrder: string[] = []
  const byCat = new Map<string, PassedHwItem[]>()
  for (const it of items) {
    if (!byCat.has(it.cat)) { byCat.set(it.cat, []); catOrder.push(it.cat) }
    byCat.get(it.cat)!.push(it)
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {catOrder.map((cat) => {
        const rows = byCat.get(cat)!
        const starOrder: (number | null)[] = []
        const byStar = new Map<number | null, PassedHwItem[]>()
        for (const it of rows) {
          if (!byStar.has(it.star)) { byStar.set(it.star, []); starOrder.push(it.star) }
          byStar.get(it.star)!.push(it)
        }
        starOrder.sort((a, b) => (a ?? 99) - (b ?? 99))
        return (
          <div key={cat} style={{ background: "#fff", border: "1px solid #e6e9ef", borderRadius: 13, padding: "12px 14px" }}>
            <div style={{ fontSize: "var(--fs-caption)", fontWeight: 900, color: "#22346b", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              {cat}
              <span style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--text-muted)" }}>合格 {rows.length}件</span>
            </div>
            {starOrder.map((st) => (
              <div key={String(st)} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: "var(--fs-label)", fontWeight: 900, color: "#b58a1e", marginBottom: 4 }}>{st != null ? `★${st}` : "★なし"}</div>
                {byStar.get(st)!.map((it, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 8, fontSize: "var(--fs-caption)", marginBottom: 4 }}>
                    <BadgeCheck size={14} color="#158253" style={{ flex: "none", alignSelf: "center" }} />
                    <b style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.title}</b>
                    {it.score != null && <span style={{ flex: "none", fontSize: "var(--fs-label)", fontWeight: 800, color: "#158253" }}>{it.score}点</span>}
                    <span style={{ marginLeft: "auto", flex: "none", fontSize: "var(--fs-label)", color: "var(--text-muted)", fontWeight: 700 }}>{it.when}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
