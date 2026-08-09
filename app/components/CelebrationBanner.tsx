// 祝いバナー (祝い体験 v2.0 §2.1)。解析 done の演奏に対し、詳細画面に出す通知バナー。
// サプライズ設計(§2.2): 節目の有無を一切読まない。常に同一の見た目・文言・ポーズ。
// タップ → 振り返り(結果)画面へ。文言の名前は12〜15文字で省略。
"use client"

import { ArcoChan, POSES } from "./ArcoChan"
import { truncateBannerName } from "@/app/_libs/celebration"

// 通常系の落ち着いたポーズで固定(特別感を出さない)
function normalPose() {
  const pool = (POSES as { cat: string }[]).filter((p) => p.cat === "挨拶" || p.cat === "見守り")
  return (pool[0] ?? POSES[0]) as unknown as Parameters<typeof ArcoChan>[0]["pose"]
}

export default function CelebrationBanner({ name, onOpen }: { name: string; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        display: "flex", alignItems: "center", gap: 10, width: "100%",
        background: "#fff", border: "1px solid #eef1f4", borderRadius: 14,
        padding: "10px 12px", marginBottom: 10, cursor: "pointer", textAlign: "left",
        boxShadow: "0 1px 3px rgba(30,45,70,.06)",
      }}
    >
      <span style={{ width: 40, height: 40, flex: "none" }}>
        <ArcoChan pose={normalPose()} />
      </span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span style={{ display: "block", fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-ink)" }}>
          {truncateBannerName(name)}の採点、できあがったよ！
        </span>
        <span style={{ display: "block", fontSize: "var(--fs-caption)", color: "var(--text-muted)", marginTop: 1 }}>
          ここから確認してね
        </span>
      </span>
      <span style={{ fontSize: "var(--fs-subhead)", fontWeight: 800, color: "var(--text-muted)" }} aria-hidden>→</span>
    </button>
  )
}
