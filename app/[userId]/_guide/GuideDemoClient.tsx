"use client"

// ============================================================
// 「アルコと最初の1周」dev ハーネス (2026-08-29・全19ステップ)
// 本番ではない環境 (/dev/guide-demo/demo?step=N) で、実装コードから
// 各ステップの画面を複製し、モック (docs/mocks/first-loop-guide/) と
// 突き合わせるためのページ。誤差ゼロになるまでここで反復し、
// 確認後に本番 (初回ユーザーのホーム) へ接続する。
//
// 方式: デモ画面は実コンポーネント (HomeClient/GoalTracker/MyRankCard/
// FingerboardPanel) を最優先で再利用し、scoreDetail 系はネットワーク密結合の
// ため _guide/demo/ の転写画面で再現。ネットワークは makeGuideFetchStub が
// デモ固定値を返す (DB・実APIに触れない)。
// 進行: spot 要素タップ (Link の遷移は捕捉して抑止) / カード内ボタン /
// 「つづける」チップ / 録音デモ。window.__guideStep(n) で任意ステップへ (撮影用)。
// ============================================================

import { useCallback, useEffect, useMemo, useState } from "react"
import HomeClient from "../home"
import GuideOverlay from "./GuideOverlay"
import { FIRST_LOOP } from "./guideFlow"
import { ACH_AFTER, ACH_BEFORE, HOME_DONE, HOME_FRESH, HOME_LOOP } from "./guideDemoData"

// フェッチスタブはモジュール読込時に常設する (2026-08-29):
// 子コンポーネントの useEffect (achievement-status フェッチ) は親の effect より先に
// 走るため、effect での差し替えでは深いステップへの直接入場時に本物のfetchが
// 先に飛んで「読み込み中…」のまま止まる。devハーネス専用ページなので常設で安全
declare global { interface Window { __guideAch?: "before" | "after" } }
if (typeof window !== "undefined" && !(window as unknown as { __guideStubbed?: boolean }).__guideStubbed) {
  ;(window as unknown as { __guideStubbed?: boolean }).__guideStubbed = true
  const orig = window.fetch.bind(window)
  window.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
    if (url.includes("/achievement-status")) {
      const ach = window.__guideAch === "after" ? ACH_AFTER : ACH_BEFORE
      return new Response(JSON.stringify(ach), { status: 200, headers: { "Content-Type": "application/json" } })
    }
    if (url.startsWith("/api/")) {
      return new Response(JSON.stringify({}), { status: 200, headers: { "Content-Type": "application/json" } })
    }
    return orig(input, init)
  }
}
import DemoScore from "./demo/DemoScore"
import DemoRecording from "./demo/DemoRecording"
import DemoResult from "./demo/DemoResult"
import DemoReview from "./demo/DemoReview"
import RingComplete from "./demo/RingComplete"

export default function GuideDemoClient({ initialStep }: { initialStep: number }) {
  const [idx, setIdx] = useState(() => Math.min(Math.max(initialStep, 0), FIRST_LOOP.length - 1))
  const [recording, setRecording] = useState(false)
  const [finished, setFinished] = useState(false)
  const step = FIRST_LOOP[idx]
  // 最終ステップのつづける=ガイド終了 (完了画面は廃止・通常ホームに着地)
  const next = useCallback(() => setIdx((i) => {
    if (i >= FIRST_LOOP.length - 1) { setFinished(true); return i }
    return i + 1
  }), [])

  // 撮影ハーネス: Playwright から任意ステップへ
  useEffect(() => {
    ;(window as unknown as Record<string, unknown>).__guideStep = (n: number) => {
      setRecording(false)
      setFinished(false)
      setIdx(Math.min(Math.max(n, 0), FIRST_LOOP.length - 1))
    }
  }, [])

  // 達成後の画面は AFTER を返す。子のフェッチより先に決まるよう描画中に同期設定する
  // ringComplete は達成前 (リング2/3) を描き、リングが満ちてから達成カードを出す
  // (達成後データを読むとマスター画面になりリングが出ない・2026-08-29 実機指摘の修正)
  const achAfter = ["home3", "trace"].includes(step.screen)
  if (typeof window !== "undefined") window.__guideAch = achAfter ? "after" : "before"

  // spot 要素のタップで進む (デモ内では Link の実遷移を抑止する)
  const onCapture = useCallback((e: React.MouseEvent) => {
    const t = e.target as HTMLElement
    if (t.closest("a")) e.preventDefault()
    if (step.spot && t.closest(`[data-guide="${step.spot}"]`)) {
      if (step.advance.type === "record") { setRecording(true); return }
      if (step.advance.type === "tap") { next(); return }
    }
    // chip ステップは画面のどこをタップしても進む (チップは onContinue 経由)
    if (step.advance.type === "chip" && !t.closest("button")) next()
  }, [step, next])

  // 画面レジストリ。review系は同一マウント・home3/trace はシート開状態を保つ
  const screenNode = useMemo(() => {
    switch (step.screen) {
      case "home":
        return <HomeClient key="fresh" {...HOME_FRESH} />
      case "home2":
        return <HomeClient key="loop" {...HOME_LOOP} />
      case "home3":
        // コイン誘導とシートは同一マウント (タップで開いた状態を保つ)。
        // マスター説明は別マウントにして、シートが閉じた状態から枠を計測する
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
    <div onClickCapture={onCapture} style={{ maxWidth: 402, margin: "0 auto", minHeight: "100dvh", background: "var(--bg, #0a1122)", position: "relative", padding: "0 18px" }}>
      {screenNode}
      {recording && <DemoRecording onDone={() => { setRecording(false); next() }} />}
      <GuideOverlay step={recording || finished ? null : step} onSkip={() => setFinished(true)} onContinue={next} />
    </div>
  )
}
