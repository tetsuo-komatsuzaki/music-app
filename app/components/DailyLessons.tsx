// 「毎日の基礎練」= 4教材の共通表示 (2026-07-25 Tetsuo確定)。
// ①音階 ②フィンガリング ③④推薦上位2。表記は項目名(カテゴリ名)のみ。
// ホームの曲カードと曲詳細ふりかえりで共通利用。href はここで組む。
// タップ時は即遷移せず「練習紹介モーダル」を挟む (案1・2026-08-09)。
"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import ds from "./ds.module.css"
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

// 配色統一 案1 (2026-08-16 Tetsuo確定): カテゴリ色は廃止し全て青一族。
// 色のルール = 構造/操作は青・金は成果(達成/マスター/ランク)のみ。見分けは文字とアイコンで行う
const BLUE_CAT = { c: "#7aa7ff", bg: "rgba(122,167,255,.14)" }
const CAT_COLOR: Record<string, { c: string; bg: string }> = {
  scale: BLUE_CAT, fingering: BLUE_CAT, arpeggio: BLUE_CAT, etude: BLUE_CAT,
  bowing: BLUE_CAT, position_shift: BLUE_CAT, double_stop: BLUE_CAT, lesson: BLUE_CAT,
}
const DEFAULT_COLOR = BLUE_CAT

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
      return { bubble: "この曲は高いポジション・4th以上を使うよ。高音域の指づかいに慣れよう。", points: ["目印のない高音域を、耳で音程をとる", "手全体をなめらかに運ぶ"] }
    case "fing_transition":
      return { bubble: `この曲で「${detail ?? "音の移動"}」のうごきがにがてだったよ。この教材でねらって練習しよう。`, points: ["ゆっくり正しい音程で", "できたら少しずつ速く"] }
    case "fing_near":
      return { bubble: "ぴったりの教材がないので、近いポジションの指づかいで練習しよう。", points: ["近い手の形をつかむ", "曲のポジションに橋渡し"] }
    case "fing_basic":
      return { bubble: "まずは1stポジションの基本の指づかいを固めよう。", points: ["指の間隔を手で覚える", "最短の動きで正確に押さえる"] }
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

// 項目名の自動縮小 (2026-08-16 Tetsuo指定: 折り返し禁止・全文を1行で見せる)。
// リスト内の全項目を一括で測り、いちばん縮みが必要な行に合わせて
// 全行を同じフォントサイズに統一する (行ごとにサイズが揃わないのはNG・2026-08-16指定)。
// 最小9pxまで縮めても収まらない場合のみ ellipsis で切る (保険)。
function useUnifiedLabelFit(containerRef: React.RefObject<HTMLDivElement | null>, dep: unknown) {
  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    const fit = () => {
      const els = Array.from(container.querySelectorAll<HTMLElement>("[data-fit-label]"))
      if (!els.length) return
      els.forEach((el) => { el.style.fontSize = "" }) // CSS既定 (--fs-caption) に戻してから測る
      let size = parseFloat(getComputedStyle(els[0]).fontSize)
      const allFit = () => els.every((el) => el.scrollWidth <= el.clientWidth)
      while (!allFit() && size > 9) {
        size -= 0.5
        els.forEach((el) => { el.style.fontSize = `${size}px` })
      }
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(container)
    return () => ro.disconnect()
  }, [containerRef, dep])
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
  const listRef = useRef<HTMLDivElement>(null)
  useUnifiedLabelFit(listRef, lessons)

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
    <div ref={listRef} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {lessons.map((l, idx) => {
        const col = CAT_COLOR[l.category] ?? DEFAULT_COLOR
        return (
          <button
            key={l.itemId}
            type="button"
            onClick={() => setActive(l)}
            style={{
              // モック nowsong.lesson_row のDOM: 番号丸 + 名前/説明 + →
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "none",
              border: "none",
              textAlign: "left",
              cursor: "pointer",
              padding: 0,
              font: "inherit",
              color: "inherit",
              width: "100%",
            }}
          >
            <span
              aria-hidden
              style={{
                width: 26, height: 26, borderRadius: "50%", flex: "none",
                background: "#0e1830", border: "1px solid rgba(150,175,225,.10)",
                color: "var(--text-muted)", fontSize: 10.5, fontWeight: 800,
                display: "grid", placeItems: "center", fontVariantNumeric: "tabular-nums",
              }}
            >
              {String(idx + 1).padStart(2, "0")}
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <b data-fit-label style={{ display: "block", fontSize: 13.5, fontWeight: 800, color: "var(--text-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.label}</b>
              <span style={{ display: "block", fontSize: 11, color: "var(--text-sub)", marginTop: 2 }}>{SLOT_NOTE[l.slot]}</span>
            </span>
            <span style={{ flex: "none", color: "var(--gold)", fontWeight: 900 }} aria-hidden>→</span>
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
      style={{ position: "fixed", inset: 0, zIndex: 1000 }}
    >
      {/* モック SHEET_TOP を土台に、背景と同化しないよう分離を強化 (2026-08-20 Tetsuo指示):
          覆い=深く+すりガラス / シート=一段明るいネイビー面+浮き影。ネイビー一族の中で階調を変える */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(4,8,18,.66)", backdropFilter: "blur(7px)", WebkitBackdropFilter: "blur(7px)" }} />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute", left: 0, right: 0, bottom: 0, top: 108,
          background: "linear-gradient(180deg,#213459,#14213d)",
          borderRadius: "24px 24px 0 0", borderTop: "1px solid rgba(150,175,225,.30)",
          boxShadow: "0 -20px 60px rgba(0,0,0,.6)",
          padding: "0 18px 18px", overflowY: "auto",
        }}
      >
        <div style={{ position: "sticky", top: 0, background: "#213459", padding: "10px 0 8px", zIndex: 2 }}>
          <div style={{ width: 38, height: 4, borderRadius: 3, background: "rgba(150,175,225,.28)", margin: "0 auto" }} />
        </div>

        {/* ヘッダー: アルコ + 練習名 + スロット */}
        <div style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: 11, marginTop: 6 }}>
          <button type="button" onClick={onClose} aria-label="閉じる" style={{ position: "absolute", top: 0, right: 0, border: "none", background: "transparent", fontSize: "var(--fs-subhead)", lineHeight: 1, cursor: "pointer", color: "var(--text-muted)" }}>×</button>
          <span style={{ width: 44, height: 44, flex: "none", borderRadius: 13, background: col.bg, display: "grid", placeItems: "center", overflow: "hidden" }}>
            <span style={{ width: 40, height: 40 }}><ArcoChan pose={pose as unknown as Parameters<typeof ArcoChan>[0]["pose"]} /></span>
          </span>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 16, fontWeight: 900, color: "var(--text-ink)", lineHeight: 1.25 }}>{lesson.label}</span>
            <span style={{ display: "block", fontSize: 11.5, fontWeight: 800, color: col.c, marginTop: 2 }}>{SLOT_NOTE[lesson.slot]}</span>
          </span>
        </div>

        {/* メタ行: ★難易度 ・ 主要な調 ・ 主要なポジション (空値は非表示) */}
        {metaChips(lesson).length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {metaChips(lesson).map((m, i) => (
              <span key={i} style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: col.c, background: col.bg, borderRadius: 999, padding: "3px 10px", whiteSpace: "nowrap" }}>{m}</span>
            ))}
          </div>
        )}

        {/* 本体: 金縁カードの吹き出し (モック GUIDE) */}
        <div className={ds.card} style={{ borderColor: "rgba(232,178,60,.3)" }}>
          <div style={{ background: "rgba(150,175,225,.10)", border: "1px solid rgba(150,175,225,.14)", borderRadius: 13, padding: "11px 12px", fontSize: 12.5, lineHeight: 1.85, color: "var(--text-ink)" }}>
            {copy.bubble}
          </div>
        </div>

        <div className={ds.card}>
          <div className={ds.lab}>この練習でつかむこと</div>
          {copy.points.map((p, i) => (
            <div key={i} className={ds.row} style={{ marginTop: 10 }}>
              <span className={`${ds.chk} ${ds.gold}`} style={{ color: "var(--gold)" }}>
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" stroke="currentColor" /></svg>
              </span>
              <div className={ds.rowMain}><b style={{ fontSize: 13 }}>{p}</b></div>
            </div>
          ))}
        </div>

        {/* CTA: 金のグラデ (モック) */}
        <Link
          href={href}
          onClick={onClose}
          className={ds.cta}
          style={{ marginTop: 14 }}
        >
          この練習をひらく
        </Link>
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <button type="button" onClick={onClose} style={{ border: "none", background: "transparent", fontSize: 12, fontWeight: 800, color: "var(--text-sub)", cursor: "pointer" }}>とじる</button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
