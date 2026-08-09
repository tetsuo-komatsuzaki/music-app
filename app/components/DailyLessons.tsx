// 「毎日の基礎練」= 4教材の共通表示 (2026-07-25 Tetsuo確定)。
// ①音階 ②フィンガリング ③④推薦上位2。表記は項目名(カテゴリ名)のみ。
// ホームの曲カードと曲詳細ふりかえりで共通利用。href はここで組む。
"use client"

import Link from "next/link"
import type { DailyLesson } from "@/app/_libs/dailyLessons"

// スロット由来の一言 (なぜ選ばれたか) をやさしく添える
const SLOT_NOTE: Record<DailyLesson["slot"], string> = {
  scale: "調にあわせて",
  fingering: "レベルにあわせて",
  rec: "学びポイントに効く",
}

// 案C: カテゴリごとの色 (左のカラーバンド・チップ・ボタンに使う)
// 予約色は使わない: 達成の緑(#2e8b57系) / 世界観のブランド青(#2563EB・#4a6cf7系)。
const CAT_COLOR: Record<string, { c: string; bg: string }> = {
  scale: { c: "#c0891f", bg: "#f7efd9" },        // アンバー
  fingering: { c: "#7159e8", bg: "#eeebfd" },    // バイオレット
  arpeggio: { c: "#8b5cf6", bg: "#f2edfe" },     // パープル
  etude: { c: "#e0872b", bg: "#fdf2e4" },        // オレンジ
  bowing: { c: "#0ea5a5", bg: "#e6f7f6" },       // ティール
  position_shift: { c: "#d6547a", bg: "#fdeef2" }, // ローズ
  double_stop: { c: "#be3a8e", bg: "#fbe9f4" },  // マゼンタ
  lesson: { c: "#c0453a", bg: "#fbeceb" },       // クリムゾン
}
const DEFAULT_COLOR = { c: "#6b7480", bg: "#eef1f4" }

export default function DailyLessons({
  lessons,
  userId,
  fromScoreId,
}: {
  lessons: DailyLesson[]
  userId: string
  /** 曲詳細から来た場合の元Score ID。教材ページに「曲にもどる」導線を出す (2026-08-02) */
  fromScoreId?: string | null
}) {
  if (!lessons.length) {
    return (
      <div style={{ fontSize: "var(--fs-body)", color: "var(--text-muted)", padding: "8px 0" }}>
        きょうの基礎練を準備中…
      </div>
    )
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {lessons.map((l) => {
        const col = CAT_COLOR[l.category] ?? DEFAULT_COLOR
        return (
          <Link
            key={l.itemId}
            href={`/${userId}/practice/${l.category}/${l.itemId}${fromScoreId ? `?from=${fromScoreId}` : ""}`}
            style={{
              display: "flex",
              alignItems: "stretch",
              background: "#fff",
              border: "1px solid #eceef2",
              borderRadius: 14,
              overflow: "hidden",
              textDecoration: "none",
              color: "inherit",
              boxShadow: "0 1px 2px rgba(20,25,40,.03)",
            }}
          >
            {/* 左: カテゴリ色のバンド */}
            <span style={{ width: 5, flex: "none", background: col.c }} aria-hidden />
            <span style={{ flex: 1, minWidth: 0, padding: "13px 14px", display: "flex", flexDirection: "column", gap: 11 }}>
              {/* 名前 + 理由チップ */}
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "var(--fs-subhead)", fontWeight: 800, color: "var(--text-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
                  {l.label}
                </span>
                <span style={{ marginLeft: "auto", flex: "none", fontSize: "var(--fs-label)", fontWeight: 800, padding: "2px 8px", borderRadius: 999, background: col.bg, color: col.c, whiteSpace: "nowrap" }}>
                  {SLOT_NOTE[l.slot]}
                </span>
              </span>
              {/* 練習ボタン (カード全体がリンク・見た目のボタン) */}
              <span style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 5, fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-on-accent)", background: col.c, borderRadius: 9, padding: "8px 14px" }}>
                練習する →
              </span>
            </span>
          </Link>
        )
      })}
    </div>
  )
}
