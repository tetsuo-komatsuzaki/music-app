// 「毎日の基礎練」= 4教材の共通表示 (2026-07-25 Tetsuo確定)。
// ①音階 ②フィンガリング ③④推薦上位2。表記は項目名(カテゴリ名)のみ。
// ホームの曲カードと曲詳細ふりかえりで共通利用。href はここで組む。
"use client"

import Link from "next/link"
import type { DailyLesson } from "@/app/_libs/dailyLessons"

const CAT_ICON: Record<string, string> = {
  scale: "🎵",
  arpeggio: "🎶",
  etude: "📖",
  fingering: "✋",
  bowing: "🎻",
  position_shift: "↕️",
  double_stop: "♬",
  lesson: "📘",
}

// スロット由来の一言 (なぜ選ばれたか) をやさしく添える
const SLOT_NOTE: Record<DailyLesson["slot"], string> = {
  scale: "この曲の調・レベルに合わせて",
  fingering: "この曲のレベルに合わせて",
  rec: "いまの学びポイントに効く",
}

export default function DailyLessons({
  lessons,
  userId,
}: {
  lessons: DailyLesson[]
  userId: string
}) {
  if (!lessons.length) {
    return (
      <div style={{ fontSize: 12.5, color: "#9aa6b3", padding: "8px 0" }}>
        きょうの基礎練を準備中…
      </div>
    )
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {lessons.map((l) => (
        <Link
          key={l.itemId}
          href={`/${userId}/practice/${l.category}/${l.itemId}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#f7f9fc",
            borderRadius: 10,
            padding: "10px 12px",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <span style={{ fontSize: 17, lineHeight: 1 }} aria-hidden>
            {CAT_ICON[l.category] ?? "🎼"}
          </span>
          <span style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
            <span style={{ fontWeight: 800, fontSize: 13, color: "#3a4653" }}>{l.label}</span>
            <span style={{ fontSize: 10.5, color: "#9aa6b3" }}>{SLOT_NOTE[l.slot]}</span>
          </span>
          <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 800, color: "#c3ccd6" }} aria-hidden>
            →
          </span>
        </Link>
      ))}
    </div>
  )
}
