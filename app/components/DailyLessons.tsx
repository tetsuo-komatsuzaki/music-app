// 「毎日の基礎練」= 4教材の共通表示 (2026-07-25 Tetsuo確定)。
// ①音階 ②フィンガリング ③④推薦上位2。表記は項目名(カテゴリ名)のみ。
// ホームの曲カードと曲詳細ふりかえりで共通利用。href はここで組む。
// タップ時は即遷移せず「練習紹介モーダル」を挟む (案1・2026-08-09)。
"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { ArcoChan, POSES } from "./ArcoChan"
import type { DailyLesson } from "@/app/_libs/dailyLessons"

// スロット由来の一言 (なぜ選ばれたか) をやさしく添える
const SLOT_NOTE: Record<DailyLesson["slot"], string> = {
  scale: "調にあわせて",
  fingering: "ポジションにあわせて",
  bowing: "弓の奏法にあわせて",
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

// カテゴリ別の「練習紹介」文章 (アルコの一言 + やることの要点2つ)。
// 文言は後から調整しやすいよう一箇所に集約 (2026-08-09)。
const INTRO_COPY: Record<string, { bubble: string; points: string[] }> = {
  scale: { bubble: "この曲と同じ調で、指の形と音程をならしておこう。ゆっくり・正確にがコツだよ！", points: ["音程の土台をつくる", "左手の形を安定させる"] },
  arpeggio: { bubble: "和音のならびを、弓と左手でなめらかに。音の跳びに慣れておこう！", points: ["和音の指の形をつかむ", "弦をまたぐ動きに慣れる"] },
  fingering: { bubble: "指づかいを固めると、曲がスッと弾けるようになるよ。", points: ["指の順番を体で覚える", "迷わず押さえられるように"] },
  etude: { bubble: "この曲に出てくる難しい形を、練習曲で先にならそう。", points: ["苦手な形を取り出して練習", "曲での再現につなげる"] },
  bowing: { bubble: "弓の使い方を練習しよう。音の粒や長さがそろうよ。", points: ["弓の配分をつかむ", "音のはじまりをそろえる"] },
  position_shift: { bubble: "ポジション移動をなめらかに。着地の音程をピタッと合わせよう！", points: ["移動のタイミングをつかむ", "移動後の音程を合わせる"] },
  double_stop: { bubble: "2つの音を同時に。まず1音ずつ確かめてから重ねよう。", points: ["2音の音程を合わせる", "弓を2弦にのせる"] },
  lesson: { bubble: "新しいわざを基礎から学ぼう。ここが分かると、弾ける曲が広がるよ！", points: ["わざの仕組みを知る", "やり方を身につける"] },
}
const DEFAULT_COPY = { bubble: "この練習で、弾く力の土台をつくろう。ゆっくり・正確にがコツだよ！", points: ["苦手をひとつ克服する", "曲につながる力をつける"] }

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
  const [active, setActive] = useState<DailyLesson | null>(null)

  if (!lessons.length) {
    return (
      <div style={{ fontSize: "var(--fs-body)", color: "var(--text-muted)", padding: "8px 0" }}>
        きょうの基礎練を準備中…
      </div>
    )
  }

  const hrefOf = (l: DailyLesson) =>
    `/${userId}/practice/${l.category}/${l.itemId}${fromScoreId ? `?from=${fromScoreId}` : ""}`

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {lessons.map((l) => {
        const col = CAT_COLOR[l.category] ?? DEFAULT_COLOR
        return (
          <button
            key={l.itemId}
            type="button"
            onClick={() => setActive(l)}
            style={{
              display: "flex",
              alignItems: "center",
              background: "#fff",
              border: "1px solid #eceef2",
              borderRadius: 12,
              overflow: "hidden",
              textAlign: "left",
              cursor: "pointer",
              padding: 0,
              font: "inherit",
              color: "inherit",
              boxShadow: "0 1px 2px rgba(20,25,40,.03)",
            }}
          >
            {/* 左: カテゴリ色のバンド */}
            <span style={{ width: 4, alignSelf: "stretch", flex: "none", background: col.c }} aria-hidden />
            <span style={{ flex: 1, minWidth: 0, padding: "9px 11px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ flex: 1, minWidth: 0, fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {l.label}
              </span>
              <span style={{ flex: "none", fontSize: "var(--fs-label)", fontWeight: 800, padding: "2px 8px", borderRadius: 999, background: col.bg, color: col.c, whiteSpace: "nowrap" }}>
                {SLOT_NOTE[l.slot]}
              </span>
              <span style={{ flex: "none", width: 21, height: 21, borderRadius: "50%", background: col.c, color: "var(--text-on-accent)", display: "grid", placeItems: "center", fontSize: "var(--fs-caption)", fontWeight: 900 }} aria-hidden>→</span>
            </span>
          </button>
        )
      })}

      {active && (
        <IntroModal
          lesson={active}
          href={hrefOf(active)}
          onClose={() => setActive(null)}
        />
      )}
    </div>
  )
}

// 練習紹介モーダル (案1: アルコのひとこと + 要点 → スコアに進む)
function IntroModal({ lesson, href, onClose }: { lesson: DailyLesson; href: string; onClose: () => void }) {
  const col = CAT_COLOR[lesson.category] ?? DEFAULT_COLOR
  const copy = INTRO_COPY[lesson.category] ?? DEFAULT_COPY
  const pose = POSES.find((p) => p.cat === "説明") ?? POSES[0]

  return createPortal(
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${lesson.label} の練習紹介`}
      style={{ position: "fixed", inset: 0, background: "rgba(18,18,30,0.42)", display: "flex", alignItems: "center", justifyContent: "center", padding: 18, zIndex: 1000 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth: 340, overflow: "hidden", boxShadow: "0 18px 44px rgba(20,20,40,.3)" }}
      >
        {/* ヘッダー: アルコ + 練習名 + スロット */}
        <div style={{ position: "relative", padding: "14px 15px", display: "flex", alignItems: "center", gap: 10 }}>
          <button type="button" onClick={onClose} aria-label="閉じる" style={{ position: "absolute", top: 10, right: 12, border: "none", background: "transparent", fontSize: "var(--fs-subhead)", lineHeight: 1, cursor: "pointer", color: "var(--text-muted)" }}>×</button>
          <span style={{ width: 42, height: 42, flex: "none", borderRadius: "50%", background: col.bg, display: "grid", placeItems: "center", overflow: "hidden" }}>
            <span style={{ width: 40, height: 40 }}><ArcoChan pose={pose as unknown as Parameters<typeof ArcoChan>[0]["pose"]} /></span>
          </span>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: "block", fontSize: "var(--fs-subhead)", fontWeight: 900, color: "var(--text-ink)", lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lesson.label}</span>
            <span style={{ display: "block", fontSize: "var(--fs-label)", fontWeight: 800, color: col.c }}>{SLOT_NOTE[lesson.slot]}</span>
          </span>
        </div>

        {/* 本体: アルコの吹き出し + 要点 */}
        <div style={{ padding: "0 15px 4px" }}>
          <div style={{ background: col.bg, borderRadius: 12, borderTopLeftRadius: 3, padding: "9px 11px", fontSize: "var(--fs-body)", fontWeight: 700, color: "var(--text-body)", lineHeight: 1.6 }}>
            {copy.bubble}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 9 }}>
            {copy.points.map((p, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: "var(--fs-body)", fontWeight: 600, color: "var(--text-ink)", lineHeight: 1.5 }}>
                <span style={{ flex: "none", width: 17, height: 17, borderRadius: "50%", background: col.bg, color: col.c, display: "grid", placeItems: "center", marginTop: 1 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                </span>
                <span>{p}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px 15px 15px" }}>
          <Link
            href={href}
            onClick={onClose}
            style={{ textAlign: "center", textDecoration: "none", fontSize: "var(--fs-subhead)", fontWeight: 800, color: "var(--text-on-accent)", background: "linear-gradient(135deg,#1f3d78,#2b5bc4)", borderRadius: 12, padding: "11px 0" }}
          >
            スコアに進む
          </Link>
          <button type="button" onClick={onClose} style={{ border: "none", background: "transparent", fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-sub)", cursor: "pointer", padding: 2 }}>とじる</button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
