"use client"

// 次の曲にチャレンジ — モック build-home.py NEXT_FAV の写経 (2026-08-20)。
// 行 = nextsong(): ♪の丸 + 曲名/説明 + ★ピル(先頭だけ金) + 金の矢印
import Link from "next/link"
import ds from "./ds.module.css"
import type { SongRecommendation } from "./RecommendationItem"

export default function NextPiecesCard({ pieces }: { pieces: SongRecommendation[] }) {
  if (pieces.length === 0) return null
  const star = pieces[0]?.practiceItem.star
  return (
    <div className={ds.card}>
      <div className={ds.lab}>次の曲にチャレンジ</div>
      <div style={{ fontSize: 11, color: "var(--text-sub)", marginTop: 5 }}>
        {star != null ? `同じ★${star}で、まだ達成していない曲だよ` : "まだ達成していない曲だよ"}
      </div>
      {pieces.slice(0, 3).map((p, i) => (
        <Link
          key={p.practiceItem.id}
          href={p.href}
          className={`${ds.row} pressable`}
          style={{ marginTop: 10, textDecoration: "none", color: "inherit" }}
        >
          <span
            className={ds.chk}
            style={{
              background: "rgba(150,175,225,.10)",
              border: "1px solid rgba(150,175,225,.14)",
              color: "var(--text-sub)",
              fontSize: 11,
              fontWeight: 900,
            }}
          >
            ♪
          </span>
          <div className={ds.rowMain}>
            <b style={{ fontSize: 13.5 }}>{p.practiceItem.title}</b>
            <span style={{ display: "block", fontSize: 11, color: "var(--text-sub)" }}>
              {p.practiceItem.composer ?? ""}
              {p.practiceItem.composer && p.reason ? " ・ " : ""}
              {p.reason ?? ""}
            </span>
          </div>
          {p.practiceItem.star != null && (
            <span className={`${ds.pill} ${i === 0 ? ds.gold : ds.mute}`} style={{ fontSize: 10.5, flex: "none" }}>
              ★{p.practiceItem.star}
            </span>
          )}
          <span className={ds.arrow}>→</span>
        </Link>
      ))}
    </div>
  )
}
