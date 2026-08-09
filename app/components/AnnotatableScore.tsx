"use client"

// 添削用の軽量譜面ビュー (2026-07-29 Phase1.5-c)。scoreDetail に触れず、OSMD で楽譜を描画し
// 既存 AnnotationLayer を載せる。先生=編集(添削保存) / 生徒=読み取り専用(先生の添削表示)。
import { useEffect, useRef, useState } from "react"
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay"
import AnnotationLayer from "@/app/[userId]/scores/[scoreId]/AnnotationLayer"
import type { AnnotationData } from "@/app/actions/scoreAnnotations"

const CID = "annot-osmd-container"

function zoomFor(w: number): number {
  if (w < 400) return 0.45
  if (w < 700) return 0.6
  if (w < 1000) return 0.75
  return 0.85
}

export default function AnnotatableScore({
  buildUrl, scoreId, practiceItemId, readOnly, loadOverride, saveOverride,
}: {
  buildUrl: string | null
  scoreId?: string
  practiceItemId?: string
  readOnly?: boolean
  loadOverride?: () => Promise<AnnotationData>
  saveOverride?: (data: AnnotationData) => void | Promise<void>
}) {
  const noteElementsRef = useRef<Element[]>([])
  const [version, setVersion] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!buildUrl) return
    const container = document.getElementById(CID)
    if (!container) return
    container.innerHTML = ""
    let disposed = false

    const osmd = new OpenSheetMusicDisplay(container, {
      autoResize: false, backend: "svg", drawTitle: false, drawPartNames: false,
      pageFormat: "Endless", pageBackgroundColor: "#ffffff", followCursor: false,
    })
    const collect = () => {
      noteElementsRef.current = Array.from(container.querySelectorAll("g.vf-stavenote"))
      setVersion((v) => v + 1)
    }
    const renderAll = () => {
      osmd.zoom = zoomFor(container.clientWidth)
      osmd.render()
      collect()
    }

    osmd.load(buildUrl).then(() => {
      if (disposed) return
      renderAll()
      setReady(true)
    }).catch(() => setError("楽譜を表示できませんでした。再読み込みをお試しください。"))

    // 自前リサイズ (autoResize:false)。overlay の追記では発火しない → ループ回避。
    let t: ReturnType<typeof setTimeout> | null = null
    const onResize = () => { if (t) clearTimeout(t); t = setTimeout(() => { if (!disposed) renderAll() }, 200) }
    window.addEventListener("resize", onResize)

    return () => { disposed = true; window.removeEventListener("resize", onResize); if (t) clearTimeout(t) }
  }, [buildUrl])

  if (!buildUrl) {
    return <div style={{ fontSize: "var(--fs-body)", color: "var(--text-muted)", textAlign: "center", padding: "30px 0" }}>楽譜がまだ準備できていません。</div>
  }
  if (error) {
    return <div style={{ fontSize: "var(--fs-body)", color: "var(--text-error)", textAlign: "center", padding: "30px 0" }}>{error}</div>
  }

  return (
    <div>
      <div id={CID} style={{ background: "#fff", border: "1px solid #eef1f4", borderRadius: 12, padding: "10px 6px", overflowX: "auto", minHeight: 120 }} />
      {ready && (
        <AnnotationLayer
          containerId={CID}
          noteElementsRef={noteElementsRef}
          noteElementsVersion={version}
          scoreId={scoreId}
          practiceItemId={practiceItemId}
          readOnly={readOnly}
          loadOverride={loadOverride}
          saveOverride={saveOverride}
        />
      )}
    </div>
  )
}
