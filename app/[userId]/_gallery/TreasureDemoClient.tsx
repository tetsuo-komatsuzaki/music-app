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
import MyRankCard from "@/app/components/MyRankCard"
import CardAlbumClient from "../progress/cards/CardAlbumClient"
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
    treasures: [T("card", "lesson_first", 3), T("card", "annotate", 2), CERT_DEMO],
  },
  coins: { coins: true, treasures: [T("card", "annotate", 2)] },
  cert: { coins: false, treasures: [CERT_DEMO] },
  nintei: { coins: false, treasures: [T("cert", "streak_100", 51)] },
  title: { coins: false, treasures: [T("title", "2", null)] },
}

export default function TreasureDemoClient({ scenario }: { scenario: string }) {
  const [run, setRun] = useState(1)
  useEffect(() => {
    ;(window as unknown as Record<string, unknown>).__treasureReplay = () => setRun((r) => r + 1)
  }, [])

  // カードアルバム (カルテ配下の図鑑) の見た目検証
  if (scenario === "album") {
    return (
      <CardAlbumClient
        userId="demo"
        cleared={["first_loop", "annotate", "lesson_first", "karte_view", "scale_first", "achieve_1", "rec_50", "streak_3"]
          .map((questId) => ({ questId, clearedAt: "2026-08-30T09:00:00.000Z" }))}
      />
    )
  }

  // 新マイランクカード (案3+質感A+透かし特大) の見た目検証
  if (scenario === "rank") {
    return (
      <div style={{ maxWidth: 402, margin: "0 auto", padding: "14px 10px", display: "grid", gap: 14 }}>
        <h1 style={{ fontSize: 15, textAlign: "center" }}>マイランクカード (刷新)</h1>
        {[1, 3, 5, 8, 10].map((star) => (
          <MyRankCard
            key={star}
            currentStar={star}
            required={10}
            achievedCount={7}
            stamps={[]}
            gallery={{
              coins: [
                { scoreId: "a", title: "きらきら星", star, mastered: true },
                { scoreId: "b", title: "ちょうちょう", star, mastered: false },
              ],
              treasures: [
                { kind: "card", sourceId: "first_loop", catalogNo: 1, earnedAt: "2026-08-30" },
                { kind: "title", sourceId: String(star), catalogNo: null, earnedAt: "2026-08-30" },
              ],
            }}
          />
        ))}
      </div>
    )
  }

  if (scenario === "shelves") {
    return (
      <div style={{ maxWidth: 402, margin: "0 auto", padding: "14px 8px" }}>
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
            { kind: "card", sourceId: "annotate", catalogNo: 2, earnedAt: "2026-08-30" },
            { kind: "title", sourceId: "2", catalogNo: null, earnedAt: "2026-08-30" },
            { kind: "cert", sourceId: "master:a", catalogNo: null, earnedAt: "2026-08-30", label: "きらきら星" },
            { kind: "cert", sourceId: "streak_100", catalogNo: 51, earnedAt: "2026-08-30" },
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
        homeQuestClears={["first_loop", "annotate", "lesson_first", "karte_view", "scale_first"]}
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
