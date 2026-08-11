// 「毎日の基礎練」= 4教材の共通表示 (2026-07-25 Tetsuo確定)。
// ①音階 ②フィンガリング ③④推薦上位2。表記は項目名(カテゴリ名)のみ。
// ホームの曲カードと曲詳細ふりかえりで共通利用。href はここで組む。
// タップ時は即遷移せず「練習紹介モーダル」を挟む (案1・2026-08-09)。
"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { ArcoChan, POSES } from "./ArcoChan"
import { formatKey } from "@/app/_libs/musicNotation"
import type { DailyLesson } from "@/app/_libs/dailyLessons"

// 主要ポジションの表示ラベル (1st/2nd/3rd/Nth ポジション)
function posLabel(n: number): string {
  const suffix = n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"
  return `${n}${suffix}ポジション`
}

// モーダルのメタ行: ★難易度 ・ 主要な調 ・ 主要なポジション (空値は非表示)
function metaChips(l: DailyLesson): string[] {
  const chips: string[] = []
  if (l.star != null) chips.push(`★${l.star}`)
  if (l.keyTonic) chips.push(formatKey(l.keyTonic, l.keyMode))
  if (l.primaryPosition != null) chips.push(posLabel(l.primaryPosition))
  return chips
}

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

// 「練習紹介」文章 (アルコの一言 + やることの要点2つ) を、選定の理由コード(reason)と
// 差し込み値(detail: 調名/奏法名/ポジション)から返す。文言は一箇所に集約 (2026-08-10)。
type IntroCopy = { bubble: string; points: string[] }
const DEFAULT_COPY: IntroCopy = { bubble: "この練習で、弾く力の土台をつくろう。ゆっくり・正確にがコツだよ！", points: ["苦手をひとつ克服する", "曲につながる力をつける"] }

function copyFor(reason: string, detail: string | null): IntroCopy {
  switch (reason) {
    case "scale_key":
      return { bubble: `この曲と同じ${detail ?? "調"}で、指の形と音程をならしておこう。`, points: ["音程の土台をつくる", "左手の形を安定させる"] }
    case "scale_nokey":
      return { bubble: "近い調の音階で、指の形と音程をならしておこう。", points: ["音程の土台をつくる", "左手の形を安定させる"] }
    case "fing_exact":
      if (detail === "2") return { bubble: "この曲は2ndポジションを使うよ。手をひとつ上へ動かす指づかいを固めよう。", points: ["2ndの音の位置を覚える", "移動を正確に"] }
      if (detail === "3") return { bubble: "この曲は3rdポジションを使うよ。よく使う定番ポジションの指づかいをならそう。", points: ["3rdの手の形をつかむ", "1st⇄3rdの移動を安定"] }
      return { bubble: "この曲は高いポジション（4th以上）を使うよ。高音域の指づかいに慣れよう。", points: ["目印のない高音域を、耳で音程をとる", "手全体をなめらかに運ぶ（親指も一緒に）"] }
    case "fing_transition":
      return { bubble: `この曲で「${detail ?? "音の移動"}」のうごきがにがてだったよ。この教材でねらって練習しよう。`, points: ["ゆっくり正しい音程で", "できたら少しずつ速く"] }
    case "fing_near":
      return { bubble: "ぴったりの教材がないので、近いポジションの指づかいで練習しよう。", points: ["近い手の形をつかむ", "曲のポジションに橋渡し"] }
    case "fing_basic":
      return { bubble: "まずは1stポジションの基本の指づかいを固めよう。", points: ["指の間隔（全音・半音）を手で覚える", "最短の動きで正確に押さえる"] }
    case "bow_match":
      switch (detail) {
        case "スタッカート":
          return { bubble: "この曲はスタッカートを使うよ。音を短くはっきり切る弓を練習しよう。", points: ["弓を止めて音を短く切る", "切っても音程と粒をそろえる"] }
        case "スピッカート":
          return { bubble: "この曲はスピッカートを使うよ。弓を弾ませて軽く跳ねる音を練習しよう。", points: ["弓の重さで自然に弾ませる", "跳ねる位置と速さをそろえる"] }
        case "ポルタート":
          return { bubble: "この曲はポルタートを使うよ。弓を止めずに、やわらかく音を分けよう。", points: ["つなげつつ一音ずつ表す", "弓圧の抜き差しをなめらかに"] }
        case "連続スタッカート":
          return { bubble: "この曲は連続スタッカートを使うよ。一弓の中で連続して切る弓を練習しよう。", points: ["一弓で粒をそろえて連ねる", "弓を配分して最後までもたせる"] }
        case "トレモロ":
          return { bubble: "この曲はトレモロを使うよ。弓を細かく速く動かす反復を練習しよう。", points: ["手首をやわらかく速く動かす", "音量と速さを一定に保つ"] }
        case "ピチカート":
          return { bubble: "この曲はピチカートを使うよ。指で弦をはじく音を練習しよう。", points: ["はじく指の位置と力をつかむ", "音程と響きをそろえる"] }
        case "リコシェ":
          return { bubble: "この曲はリコシェを使うよ。弓を跳ねさせて連続する音を練習しよう。", points: ["弓を落として自然に跳ねさせる", "跳ねる回数をコントロール"] }
        default:
          return { bubble: "ぴったりの教材がないので、別の弓の技で弓の使い方をならそう。", points: ["弓の基本の動きをつかむ", "音の粒・長さをそろえる"] }
      }
    case "bow_alt":
      return { bubble: "ぴったりの教材がないので、別の弓の技で弓の使い方をならそう。", points: ["弓の基本の動きをつかむ", "音の粒・長さをそろえる"] }
    case "rec_tech":
      return { bubble: `直近の演奏で「${detail ?? "その奏法"}」がまだ不安定だったよ。エチュードで取り出して練習しよう。`, points: ["奏法の形を固める", "曲の中で再現する"] }
    case "rec_posshift":
      return { bubble: "直近の演奏でポジション移動がつまずいたよ。移動をエチュードでならそう。", points: ["移動のタイミングをつかむ", "移動後の音程を合わせる"] }
    case "rec_interval":
      return { bubble: "直近の演奏で大きな跳躍／移弦がずれたよ。エチュードでならそう。", points: ["跳ぶ距離を耳で測る", "弦をまたぐ動きを最小に"] }
    case "rec_rhythm":
      return { bubble: "直近の演奏でリズムがつまずいたよ。エチュードで整えよう。", points: ["拍を体で感じる", "音の長さを正確に"] }
    case "rec_double":
      return { bubble: "直近の演奏で重音がつまずいたよ。2音を合わせる練習をしよう。", points: ["2音の音程を合わせる", "弓を2弦にのせる"] }
    case "rec_etude":
    default:
      return DEFAULT_COPY
  }
}

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
  const copy = copyFor(lesson.reason, lesson.detail)
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

        {/* メタ行: ★難易度 ・ 主要な調 ・ 主要なポジション (空値は非表示) */}
        {metaChips(lesson).length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "0 15px 10px" }}>
            {metaChips(lesson).map((m, i) => (
              <span key={i} style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: col.c, background: col.bg, borderRadius: 999, padding: "3px 10px", whiteSpace: "nowrap" }}>{m}</span>
            ))}
          </div>
        )}

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
