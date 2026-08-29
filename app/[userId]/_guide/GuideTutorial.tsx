"use client"

// ============================================================
// 「アルコと最初の1周」本番チュートリアル (2026-08-29 本番接続)
// ホームの上に全画面のデモ層 (z950: タブバーz90より上・モーダルz1000より下) を重ね、
// 18ステップのデモを実コンポーネント+デモデータで再生する。
//
// 【徹底事項】
//  ・DBに演奏データは一切書かない。本物は進行の保存 (saveGuideStep/complete/skip) と
//    クエスト「はじめての1周」達成だけ。終了/スキップで層ごとアンマウント→通常ホーム。
//  ・fetch の横取りはデモ曲IDの achievement-status 1本だけ (他の通信は素通し)。
//    アンマウントで必ず復元する。
//  ・進行は最終ステップの「つづける」で completeGuide → onDone。
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import HomeClient from "../home"
import GuideOverlay from "./GuideOverlay"
import { FIRST_LOOP } from "./guideFlow"
import { ACH_AFTER, ACH_BEFORE, DEMO_SONG_ID, HOME_DONE, HOME_FRESH, HOME_LOOP } from "./guideDemoData"
import { completeGuide, saveGuideStep, skipGuide } from "@/app/actions/guideState"
import DemoScore from "./demo/DemoScore"
import DemoRecording from "./demo/DemoRecording"
import DemoResult from "./demo/DemoResult"
import DemoReview from "./demo/DemoReview"
import RingComplete from "./demo/RingComplete"

export default function GuideTutorial({ initialStep, onDone }: { initialStep: number; onDone: () => void }) {
  const [idx, setIdx] = useState(() => Math.min(Math.max(initialStep, 0), FIRST_LOOP.length - 1))
  const [recording, setRecording] = useState(false)
  const step = FIRST_LOOP[idx]
  const achAfter = ["ringComplete", "home3", "trace"].includes(step.screen)
  const achRef = useRef(achAfter)
  achRef.current = achAfter

  // デモ曲の achievement-status だけデモ固定値を返す (他は素通し・終了で復元)
  useEffect(() => {
    const orig = window.fetch.bind(window)
    window.fetch = async (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
      if (url.includes(`/api/scores/${DEMO_SONG_ID}/achievement-status`)) {
        return new Response(JSON.stringify(achRef.current ? ACH_AFTER : ACH_BEFORE), {
          status: 200, headers: { "Content-Type": "application/json" },
        })
      }
      return orig(input, init)
    }
    return () => { window.fetch = orig }
  }, [])

  const finish = useCallback((how: "done" | "skip") => {
    void (how === "done" ? completeGuide() : skipGuide())
    onDone()
  }, [onDone])

  const next = useCallback(() => setIdx((i) => {
    if (i >= FIRST_LOOP.length - 1) { void completeGuide(); onDone(); return i }
    const n = i + 1
    void saveGuideStep(n)
    return n
  }), [onDone])

  // デモ内では実リンクの遷移を抑止し、spot 要素タップで進める
  const onCapture = useCallback((e: React.MouseEvent) => {
    const t = e.target as HTMLElement
    if (t.closest("a")) e.preventDefault()
    if (step.spot && t.closest(`[data-guide="${step.spot}"]`)) {
      if (step.advance.type === "record") { setRecording(true); return }
      if (step.advance.type === "tap") { next(); return }
    }
    if (step.advance.type === "chip" && !t.closest("button")) next()
  }, [step, next])

  const screenNode = useMemo(() => {
    switch (step.screen) {
      case "home":
        return <HomeClient key="fresh" {...HOME_FRESH} />
      case "home2":
        return <HomeClient key="loop" {...HOME_LOOP} />
      case "home3":
        return <HomeClient key={step.id === "home_master" ? "done2" : "done"} {...HOME_DONE} />
      case "trace":
        return <HomeClient key="done" {...HOME_DONE} />
      case "score":
        return <DemoScore key="score1" manner={step.id === "score_manner"} onKnow={next} />
      case "score2":
        return <DemoScore key="score2" level={{ label: "いい調子", score: 80 }} />
      case "result80":
        return <DemoResult key="r80" perfNo={5} score={80} sheet="/guide-demo/sheet80.jpg" />
      case "result95":
        return <DemoResult key="r95" perfNo={6} score={95} sheet="/guide-demo/sheet95.jpg" confetti />
      case "reviewGraph":
      case "review":
        return <DemoReview key="review" />
      case "mapZoom":
        return <DemoReview key="review" zoomOpen />
      case "mapDetail":
        return <DemoReview key="review" zoomOpen selCell="cell-A-02" />
      case "ringComplete":
        return (
          <div key="ringdone">
            <HomeClient {...HOME_LOOP} />
            <RingComplete onReceive={next} />
          </div>
        )
      case "recording":
        return null
    }
  }, [step, next])

  return (
    <div
      onClickCapture={onCapture}
      data-guide-tutorial
      style={{
        position: "fixed", inset: 0, zIndex: 950, overflowY: "auto",
        background: "var(--bg, #0a1122)", overscrollBehavior: "contain",
      }}
    >
      <div style={{ maxWidth: 402, margin: "0 auto", minHeight: "100dvh", padding: "0 18px", position: "relative" }}>
        {screenNode}
      </div>
      {recording && <DemoRecording onDone={() => { setRecording(false); next() }} />}
      <GuideOverlay step={recording ? null : step} onSkip={() => finish("skip")} onContinue={next} />
    </div>
  )
}
