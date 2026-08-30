"use client"

// dev専用: 結果パネル祝い階層の検証ハーネス (本番導線からは一切参照されない)。
// /dev/result-demo?t=1..5 (1=通常 2=自己ベスト 3=達成 4=マスター 5=ランクアップ)
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import ArcoResultOverlay from "@/app/components/ArcoResultOverlay"

const TIERS: Record<string, string[]> = {
  "1": [],
  "2": ["personal_best"],
  "3": ["personal_best", "achieve"],
  "4": ["personal_best", "achieve", "master"],
  "5": ["personal_best", "achieve", "master", "rank_up"],
}

function Demo() {
  const sp = useSearchParams()
  const t = sp.get("t") ?? "1"
  return (
    <ArcoResultOverlay
      scoreId="demo"
      userId="demo"
      perf={{ id: "demo-perf", pitchAccuracy: 93, timingAccuracy: 96 }}
      events={TIERS[t] ?? []}
      rewardLit
      songTitle="きらきら星"
      onClose={() => {}}
    />
  )
}

export default function ResultDemoPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0d1426" }}>
      <Suspense fallback={null}>
        <Demo />
      </Suspense>
    </div>
  )
}
