"use client"

// 生徒の曲/教材詳細・練習後カルテタブ (2026-08-11 Tetsuo確定・案A):
// カルテ1枚ごとのカードに、本文 + そのとき先生が記録したこと (癖・気をつける音・表現認定) を
// セットで表示する「日付の診療録」スタイル。紐づけは PracticeKarte.id (karteId列・案A migration)。
import FingerboardPanel from "./FingerboardPanel"

export type StudentKarteCard = {
  id: string
  body: string
  date: string
  teacherName: string
  context?: "lesson" | "audio" | null
  read?: boolean
  /** このカルテと一緒に記録された癖 (対象ラベル+癖タグラベル) */
  kuse?: { targets: string[]; tags: string[] }[]
  /** このカルテと一緒に置かれた気をつける音の旗 */
  marks?: { cellId: string; note: string }[]
  /** このカルテと一緒に認定された表現 */
  exprs?: { label: string; star: number }[]
}

const OPEN_MIDI: Record<string, number> = { G: 55, D: 62, A: 69, E: 76 }
const KANA = ["ド", "ド♯", "レ", "レ♯", "ミ", "ファ", "ファ♯", "ソ", "ソ♯", "ラ", "ラ♯", "シ"]
function cellLabel(cellId: string): string {
  const m = /^cell-([GDAE])-(\d{2})$/.exec(cellId)
  if (!m) return cellId
  const midi = OPEN_MIDI[m[1]] + Number(m[2])
  return `${KANA[midi % 12]}・${m[1]}線${m[2] === "00" ? "・開放" : ""}`
}

export default function StudentKarteCards({ kartes }: { kartes: StudentKarteCard[] }) {
  if (kartes.length === 0) {
    return (
      <div style={{ fontSize: "var(--fs-body)", color: "var(--text-muted)" }}>
        まだ先生からの練習後カルテはありません。先生がこの曲のカルテを書くと、ここに届きます。
      </div>
    )
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {kartes.map((k) => {
        const hasExtras = (k.kuse?.length ?? 0) > 0 || (k.marks?.length ?? 0) > 0 || (k.exprs?.length ?? 0) > 0
        return (
          <div key={k.id} style={{ background: "var(--card-in)", border: "1px solid rgba(150,175,225,.14)", borderRadius: 14, padding: "12px 14px" }}>
            {/* ヘッダー: 日付・先生・場面 */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--text-sub)", flexWrap: "wrap" }}>
              <b style={{ color: "var(--text-ink)", fontSize: "var(--fs-caption)" }}>{k.date}</b>
              <span>{k.teacherName}先生</span>
              {k.context && (
                <span style={{ fontSize: "var(--fs-label)", fontWeight: 900, color: "#7fa4e8", background: "rgba(127,164,232,.14)", border: "1px solid rgba(127,164,232,.3)", borderRadius: 5, padding: "0 6px" }}>
                  {k.context === "lesson" ? "レッスン直後" : "演奏をきいて"}
                </span>
              )}
            </div>
            {/* 本文 */}
            <div style={{ fontSize: "var(--fs-body)", color: "var(--text-body)", lineHeight: 1.75, marginTop: 6, whiteSpace: "pre-wrap" }}>{k.body}</div>

            {/* このとき先生が記録したこと */}
            {hasExtras && (
              <>
                <div style={{ borderTop: "1px dashed rgba(150,175,225,.16)", margin: "10px 0 7px" }} />
                <div style={{ fontSize: "var(--fs-label)", fontWeight: 900, color: "var(--text-muted)", marginBottom: 4 }}>このとき先生が記録したこと</div>

                {(k.kuse?.length ?? 0) > 0 && (
                  <div style={{ marginBottom: 5 }}>
                    {k.kuse!.map((o, i) => (
                      <span key={i} style={{ display: "inline-block", fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--gold)", background: "rgba(232,178,60,.12)", border: "1px solid rgba(232,178,60,.3)", borderRadius: 999, padding: "2px 9px", margin: "2px 4px 0 0" }}>
                        {o.targets.length > 0 && (
                          <span style={{ fontSize: "var(--fs-label)", fontWeight: 900, color: "#a9c3f2", background: "rgba(43,91,196,.28)", borderRadius: 5, padding: "0 5px", marginRight: 4 }}>{o.targets.join("・")}</span>
                        )}
                        {o.tags.join("・") || "癖の記録"}
                      </span>
                    ))}
                  </div>
                )}

                {(k.marks?.length ?? 0) > 0 && (
                  <div style={{ marginBottom: 5 }}>
                    {k.marks!.map((m) => (
                      <div key={m.cellId} style={{ display: "flex", alignItems: "baseline", gap: 7, fontSize: "var(--fs-caption)", marginTop: 2 }}>
                        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#E0872B", flex: "none", alignSelf: "center" }} />
                        <b style={{ color: "var(--text-ink)" }}>気をつける音：{cellLabel(m.cellId)}</b>
                        {m.note && <span style={{ color: "var(--text-sub)", fontSize: "var(--fs-label)" }}>{m.note}</span>}
                      </div>
                    ))}
                    <div style={{ marginTop: 6 }}>
                      <FingerboardPanel cells={{}} details={{}} marks={k.marks!} stack
                        emptyText="橙の旗が先生の気をつける音だよ。タップするとひとことが読めるよ。" />
                    </div>
                  </div>
                )}

                {(k.exprs?.length ?? 0) > 0 && (
                  <div>
                    {k.exprs!.map((e, i) => (
                      <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "var(--fs-caption)", fontWeight: 900, color: "#7fa4e8", background: "rgba(127,164,232,.14)", border: "1px solid rgba(127,164,232,.3)", borderRadius: 999, padding: "2px 10px", marginRight: 5 }}>
                        表現クリア認定・{e.label} ★{e.star}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
