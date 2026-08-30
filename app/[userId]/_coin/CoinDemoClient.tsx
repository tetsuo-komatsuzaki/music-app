"use client"

// ============================================================
// 達成コイン獲得モーションの dev ハーネス (2026-08-30)。
// 本番ではない環境 (/dev/coin-demo/demo) で、実装そのもの
// (HomeClient + CoinCelebration + 実リング) を達成後デモデータで動かし、
// coin-motions.html モック (案A) と誤差ゼロになるまで突き合わせる。
// DB には一切書かない (coinDemo フラグで消化スキップ・fetchはスタブ)。
// window.__coinReplay() で再生し直せる (Playwright 撮影用)。
// ============================================================

import { useEffect, useState } from "react"
import HomeClient from "../home"
import { ACH_AFTER, DEMO_SONG_ID, HOME_DONE } from "../_guide/guideDemoData"

// フェッチスタブはモジュール読込時に常設 (guide-demo と同じ理由:
// 子の achievement-status フェッチが親の effect より先に走るため)
if (typeof window !== "undefined" && !(window as unknown as { __coinStubbed?: boolean }).__coinStubbed) {
  ;(window as unknown as { __coinStubbed?: boolean }).__coinStubbed = true
  const orig = window.fetch.bind(window)
  window.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
    if (url.includes("/achievement-status")) {
      return new Response(JSON.stringify(ACH_AFTER), { status: 200, headers: { "Content-Type": "application/json" } })
    }
    if (url.startsWith("/api/")) {
      return new Response(JSON.stringify({}), { status: 200, headers: { "Content-Type": "application/json" } })
    }
    return orig(input, init)
  }
}

export default function CoinDemoClient({ two, trigger = "run" }: { two?: boolean; trigger?: "run" | "lesson" | "etude" }) {
  const [run, setRun] = useState(1)
  useEffect(() => {
    ;(window as unknown as Record<string, unknown>).__coinReplay = () => setRun((r) => r + 1)
  }, [])
  // two: 複数同時達成 (2枚目=リング省略・中央出現) の検証モード (?two=1)
  // trigger: 最後にそろった条件の巻き戻し検証 (?trigger=lesson|etude)
  const props = two
    ? {
        ...HOME_DONE,
        recentPieces: [
          ...HOME_DONE.recentPieces,
          { id: "guide-demo-second", title: "ちょうちょう", star: 1, cover: null, latest: 92, recentAvg: 92, badge: "achieved" as const, href: "#demo-second" },
        ],
        rankCard: { ...HOME_DONE.rankCard, achievedCount: 2 },
        coinQueue: [
          { scoreId: DEMO_SONG_ID, star: 1, trigger },
          { scoreId: "guide-demo-second", star: 1, trigger: "run" as const },
        ],
      }
    : { ...HOME_DONE, coinQueue: [{ scoreId: DEMO_SONG_ID, star: 1, trigger }] }
  return (
    <>
      <HomeClient key={run} {...props} coinDemo />
      <button
        type="button"
        onClick={() => setRun((r) => r + 1)}
        style={{
          position: "fixed", right: 10, bottom: 10, zIndex: 2100,
          background: "#16294f", color: "#edf1fa", border: "1px solid rgba(150,175,225,.3)",
          borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 800, cursor: "pointer",
        }}
      >
        もう一度
      </button>
    </>
  )
}
