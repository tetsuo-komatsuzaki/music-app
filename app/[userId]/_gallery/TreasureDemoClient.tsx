"use client"

// ============================================================
// 報酬体系骨組みの dev ハーネス (/dev/treasure-demo/demo・2026-08-30)。
// 検証対象: ①コイン→宝物の直列授与 (最大2つ合算・スキップ・棚あふれ)
//           ②ギャラリー3棚スケルトン。DBに書かない (demoフラグ+fetchスタブ)。
// シナリオ: ?s=card (カード1枚) / mixed (コイン1+カード2+巻物1=2つ目以降棚) /
//           coins (コイン2枚のみ→宝物は全部棚) / shelves (棚の表示のみ)。
// ============================================================

import { useEffect, useState } from "react"
import HomeClient from "../home"
import GalleryShelves from "./GalleryShelves"
import { ACH_AFTER, DEMO_SONG_ID, HOME_DONE } from "../_guide/guideDemoData"
import type { TreasureQueueItem } from "../_coin/TreasureCelebration"

if (typeof window !== "undefined" && !(window as unknown as { __tqStubbed?: boolean }).__tqStubbed) {
  ;(window as unknown as { __tqStubbed?: boolean }).__tqStubbed = true
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

const T = (kind: string, sourceId: string, catalogNo: number | null): TreasureQueueItem =>
  ({ id: `${kind}:${sourceId}`, kind, sourceId, catalogNo, earnedAt: "2026-08-30T09:00:00.000Z" })

const CERT_DEMO: TreasureQueueItem = {
  ...T("cert", "master:demo", null),
  label: "きらきら星",
  stars: 3,
  certNo: 1,
}

const SCENARIOS: Record<string, { coins: boolean; treasures: TreasureQueueItem[] }> = {
  card: { coins: false, treasures: [T("card", "annotate", 2)] },
  mixed: {
    coins: true,
    treasures: [T("card", "lesson_first", 3), T("card", "tempo_change", 12), CERT_DEMO],
  },
  coins: { coins: true, treasures: [T("card", "annotate", 2)] },
  medal: { coins: false, treasures: [T("medal", "5", null)] },
  cert: { coins: false, treasures: [CERT_DEMO] },
  nintei: { coins: false, treasures: [T("cert", "streak_100", 51)] },
}

export default function TreasureDemoClient({ scenario }: { scenario: string }) {
  const [run, setRun] = useState(1)
  useEffect(() => {
    ;(window as unknown as Record<string, unknown>).__treasureReplay = () => setRun((r) => r + 1)
  }, [])

  if (scenario === "shelves") {
    return (
      <div style={{ maxWidth: 402, margin: "0 auto", padding: "20px 16px" }}>
        <h1 style={{ fontSize: 15, textAlign: "center" }}>ギャラリー (骨組み)</h1>
        <GalleryShelves
          required={10}
          coins={[
            { scoreId: "a", title: "きらきら星", star: 1, mastered: true },
            { scoreId: "b", title: "ちょうちょう", star: 1, mastered: false },
            { scoreId: "c", title: "かっこう", star: 1, mastered: false },
          ]}
          treasures={[
            { kind: "card", sourceId: "first_loop", catalogNo: 1, earnedAt: "2026-08-30" },
            { kind: "card", sourceId: "annotate", catalogNo: 2, earnedAt: "2026-08-30" },
            { kind: "title", sourceId: "2", catalogNo: null, earnedAt: "2026-08-30" },
            { kind: "master_card", sourceId: "card:a", catalogNo: null, earnedAt: "2026-08-30" },
            { kind: "medal", sourceId: "5", catalogNo: null, earnedAt: "2026-08-30" },
            { kind: "cert", sourceId: "きらきら星", catalogNo: null, earnedAt: "2026-08-30" },
          ]}
        />
      </div>
    )
  }

  const sc = SCENARIOS[scenario] ?? SCENARIOS.card
  return (
    <>
      <HomeClient
        key={run}
        {...HOME_DONE}
        coinQueue={sc.coins ? [{ scoreId: DEMO_SONG_ID, star: 1 }] : []}
        treasureQueue={sc.treasures}
        coinDemo
      />
      <button
        type="button"
        onClick={() => setRun((r) => r + 1)}
        style={{ position: "fixed", right: 10, bottom: 10, zIndex: 2100, background: "#16294f", color: "#edf1fa", border: "1px solid rgba(150,175,225,.3)", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 800, cursor: "pointer" }}
      >
        もう一度
      </button>
    </>
  )
}
