"use client"
import { useEffect, useRef } from "react"
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay"

type ComparisonNote = {
  note_index: number
  detected_start_sec: number | null
  pitch_cents_error: number | null
  start_diff_sec: number | null
}

const PITCH_TOLERANCE = 10
const NULL_CONSECUTIVE = 3
const RECOVERY_DIFF_THRESHOLD = 0.15 // 150ms以上なら本当にずれたと判定

export default function ScoreViewer() {
  const containerRef = useRef<HTMLDivElement>(null)

  function getPitchSymbol(error: number | null) {
    if (error === null) return ""
    if (Math.abs(error) <= PITCH_TOLERANCE) return ""
    if (error >= 100) return "↑↑"
    if (error > 0) return "↑"
    if (error <= -100) return "↓↓"
    if (error < 0) return "↓"
    return ""
  }

  function getPitchColor(error: number | null) {
    if (error === null) return "gray"
    if (Math.abs(error) >= 100) return "red"
    return "orange"
  }

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    container.style.position = "relative"

    const osmd = new OpenSheetMusicDisplay(container)

    Promise.all([
      osmd.load("/test/output/pseudo_score.musicxml"),
      fetch("/test/output/comparison_result.json").then(res => res.json())
    ])
      .then(([_, comparisonData]: [unknown, ComparisonNote[]]) => {

        osmd.render()

        setTimeout(() => {

          const noteheads = container.querySelectorAll("g.vf-notehead")
          const containerRect = container.getBoundingClientRect()

          // -----------------------------
          // null連続ブロック検出＋復帰判定
          // -----------------------------
          type NullBlock = {
            startIndex: number
            isRealShift: boolean
          }

          const nullBlocks: NullBlock[] = []

          let i = 0
          while (i < comparisonData.length) {

            if (comparisonData[i].detected_start_sec !== null) {
              i++
              continue
            }

            // null開始
            const start = i
            let count = 0

            while (
              i < comparisonData.length &&
              comparisonData[i].detected_start_sec === null
            ) {
              count++
              i++
            }

            if (count >= NULL_CONSECUTIVE) {
              // 復帰位置を確認
              const recoveryIndex = i
              let isRealShift = false

              if (
                recoveryIndex < comparisonData.length &&
                comparisonData[recoveryIndex].start_diff_sec !== null
              ) {
                const diff = Math.abs(
                  comparisonData[recoveryIndex].start_diff_sec as number
                )

                if (diff >= RECOVERY_DIFF_THRESHOLD) {
                  isRealShift = true
                }
              }

              nullBlocks.push({
                startIndex: start,
                isRealShift
              })
            }
          }

          console.log("nullBlocks:", nullBlocks)

          // -----------------------------
          // 描画
          // -----------------------------
          comparisonData.forEach((comp, index) => {

            if (comp.note_index == null) return
            if (comp.note_index >= noteheads.length) return

            const notehead = noteheads[comp.note_index] as HTMLElement
            const rect = notehead.getBoundingClientRect()

            const x = rect.left - containerRect.left + rect.width / 2
            const y = rect.top - containerRect.top - 10

            const marker = document.createElement("div")
            marker.style.position = "absolute"
            marker.style.left = `${x}px`
            marker.style.top = `${y}px`
            marker.style.pointerEvents = "none"
            marker.style.fontWeight = "bold"

            // nullブロック開始位置チェック
            const block = nullBlocks.find(b => b.startIndex === index)

            if (block) {
              if (block.isRealShift) {
                marker.innerText = "⚠ ここから演奏がずれています"
                marker.style.color = "blue"
              } else {
                marker.innerText = "ℹ 一時的に検出できませんでした"
                marker.style.color = "purple"
              }
              marker.style.fontSize = "14px"
              container.appendChild(marker)
              return
            }

            // null音
            if (comp.detected_start_sec === null) {
              marker.innerText = "×"
              marker.style.color = "green"
              marker.style.fontSize = "18px"
              container.appendChild(marker)
              return
            }

            // ピッチ表示
            const symbol = getPitchSymbol(comp.pitch_cents_error)
            if (!symbol) return

            marker.innerText = symbol
            marker.style.color = getPitchColor(comp.pitch_cents_error)
            marker.style.fontSize = "18px"

            container.appendChild(marker)
          })

        }, 200)

      })
      .catch(err => {
        console.error("OSMD error:", err)
      })

  }, [])

  return <div ref={containerRef} />
}
