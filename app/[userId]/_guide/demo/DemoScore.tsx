"use client"

// ============================================================
// デモ演奏画面 (2026-08-29)。実画面 (scoreDetail 演奏タブ) の転写+デモデータ。
// 1回目: 採点前なので現在のレベルは非表示 (実装準拠・recentLevel null で非描画)。
// 2回目: いい調子・80点 (直近1回=getScoreRank 75-89)。
// 楽譜は実画面のレンダリング画像 (public/guide-demo/sheet_plain.jpg)。
// 作法カードはお手本ボタン行を隠さない位置 (下寄せ) に出す。
// ============================================================

import { Pencil, Play, Music2, Timer, ChevronDown } from "lucide-react"
import { DemoTopBar, DemoScoreTabs, DemoTabBar } from "./DemoChrome"

export default function DemoScore({
  level, manner, onKnow,
}: {
  /** 現在のレベル (2回目のみ)。無指定=採点前で非表示 */
  level?: { label: string; score: number }
  /** 作法カード (1回目の最初のステップのみ) */
  manner?: boolean
  onKnow?: () => void
}) {
  return (
    <div style={{ paddingBottom: 120, position: "relative" }}>
      <DemoTopBar title="きらきら星" />
      <DemoScoreTabs active="score" />

      <div style={{ marginTop: 12, background: "rgba(16,26,50,.7)", border: "1px solid rgba(150,175,225,.14)", borderRadius: 12, padding: "11px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", color: "var(--text-sub)", fontSize: 12, fontWeight: 700 }}>
        演奏モード ・ 演奏を選ぶと採点を表示 <ChevronDown size={15} />
      </div>

      {/* 楽譜カード */}
      <div style={{ marginTop: 12, background: "var(--card-in, #111c38)", border: "1px solid rgba(150,175,225,.10)", borderRadius: 14, padding: "12px 12px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <b style={{ fontSize: 13, color: "var(--text-ink)" }}>楽譜</b>
          <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text-sub)", background: "rgba(150,175,225,.12)", borderRadius: 999, padding: "4px 10px" }}>⤢ ひろげる</span>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/guide-demo/sheet_plain.jpg" alt="きらきら星の楽譜" style={{ width: "100%", borderRadius: 8, marginTop: 9, display: "block" }} />
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-sub)", background: "rgba(150,175,225,.12)", borderRadius: 999, padding: "6px 14px" }}>全部見る ▼</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
        <b style={{ fontSize: 13.5, color: "var(--text-ink)" }}>この曲に出てくる記号</b>
        <span style={{ fontSize: 12, fontWeight: 800, color: "#7aa7ff" }}>▼ 開く ・ 2</span>
      </div>

      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, fontSize: 12, fontWeight: 800, color: "var(--text-ink)", background: "rgba(150,175,225,.12)", borderRadius: 999, padding: "8px 14px" }}>
        <Pencil size={13} /> 譜面に書き込む
      </span>

      {/* お手本 / テンポ / メトロ (お手本がガイドの灰枠対象) */}
      <div style={{ display: "flex", gap: 8, marginTop: 13 }}>
        {[
          { key: "exemplar", icon: <Play size={15} color="#e8b23c" />, label: "お手本" },
          { key: "tempo", icon: <Music2 size={15} color="#e8b23c" />, label: "テンポ", sub: "♩100" },
          { key: "metro", icon: <Timer size={15} color="#e8b23c" />, label: "メトロ" },
        ].map((b) => (
          <span key={b.key} data-guide={b.key === "exemplar" ? "score-exemplar" : undefined}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "rgba(16,26,50,.7)", border: "1px solid rgba(150,175,225,.14)", borderRadius: 12, padding: "11px 0", fontSize: 11.5, fontWeight: 800, color: "var(--gold)" }}>
            {b.sub ? <b style={{ fontSize: 13 }}>{b.sub}</b> : b.icon}
            {b.label}
          </span>
        ))}
      </div>

      {/* 現在のレベル: 採点前は非表示 (実装準拠) */}
      {level && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 15px", marginTop: 14, borderRadius: 14, background: "var(--card-in, #111c38)", border: "1px solid rgba(150,175,225,.08)" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-sub)" }}>現在のレベル</div>
            <b style={{ fontSize: 13, color: "#7fa4e8" }}>{level.label}</b>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
            <span style={{ fontSize: 30, fontWeight: 900, lineHeight: 1, color: "var(--cream, #f6ecd4)", fontVariantNumeric: "tabular-nums", textShadow: "0 0 24px rgba(255,243,220,.28)" }}>{level.score}</span>
            <span style={{ fontSize: 11, color: "var(--text-sub)" }}>点</span>
          </div>
        </div>
      )}

      {/* 録音して採点 */}
      <div data-guide="score-record" style={{ marginTop: 14, background: "linear-gradient(180deg,#b3402f,#9c3325)", border: "1px solid rgba(255,160,140,.35)", borderRadius: 16, padding: "15px 0", textAlign: "center", color: "#fff", fontSize: 15, fontWeight: 900 }}>
        ● 録音して採点 ⌄
      </div>
      <div style={{ textAlign: "center", marginTop: 9, fontSize: 11, color: "var(--text-sub)" }}>今週の採点 0/7回</div>

      {/* 作法カード (わかった で進む)。お手本行を隠さない下寄せ配置 */}
      {manner && (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: "calc(180px + env(safe-area-inset-bottom, 0px))", zIndex: 1953, display: "flex", justifyContent: "center", padding: "0 6%" }}>
          <div style={{ width: "100%", maxWidth: 370, background: "linear-gradient(180deg,#1e3053,#15233f)", border: "1px solid rgba(150,175,225,.25)", borderRadius: 16, padding: "15px 16px", boxShadow: "0 14px 40px rgba(4,8,20,.7)" }}>
            <b style={{ fontSize: 14.5, color: "var(--gold)" }}>録音の前に、これだけ</b>
            {[
              ["1", "スマホを 横向き にすると譜面が大きくなる"],
              ["2", "3・2・1 のカウントのあとに弾きはじめる"],
              ["3", "テンポガイドの音 に合わせて、ゆっくりでOK"],
            ].map(([n, t]) => (
              <div key={n} style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 10, fontSize: 12.5, fontWeight: 700, color: "var(--text-ink)" }}>
                <span style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(122,167,255,.18)", color: "#7aa7ff", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 900, flex: "none" }}>{n}</span>
                {t}
              </div>
            ))}
            <button type="button" onClick={onKnow} style={{ width: "100%", marginTop: 13, background: "#2b5bc4", color: "#fff", border: "none", borderRadius: 12, padding: "12px 0", fontSize: 13.5, fontWeight: 900, cursor: "pointer" }}>
              わかった
            </button>
          </div>
        </div>
      )}

      <DemoTabBar active="library" />
    </div>
  )
}
