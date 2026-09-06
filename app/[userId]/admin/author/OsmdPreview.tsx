"use client"
/**
 * 作った MusicXML をアプリ本体と同じ楽譜エンジン (OSMD) で描く確認 (要件 10 ・ 14)。
 * 練習画面での見え方をそのまま確かめる。
 */
import { useEffect, useRef, useState } from "react"

export default function OsmdPreview({ xml }: { xml: string }) {
  const box = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<"loading" | "ok" | "error">("loading")
  const [err, setErr] = useState("")
  useEffect(() => {
    let cancelled = false
    setState("loading")
    ;(async () => {
      try {
        const { OpenSheetMusicDisplay } = await import("opensheetmusicdisplay")
        if (cancelled || !box.current) return
        box.current.innerHTML = ""
        const osmd = new OpenSheetMusicDisplay(box.current, { autoResize: false, drawingParameters: "compact", drawTitle: false, drawPartNames: false })
        await osmd.load(xml)
        if (cancelled) return
        osmd.zoom = 0.75
        osmd.render()
        setState("ok")
      } catch (e) {
        if (cancelled) return
        setErr(e instanceof Error ? e.message : String(e))
        setState("error")
      }
    })()
    return () => { cancelled = true }
  }, [xml])
  return (
    <div>
      {state === "loading" && <p style={{ color: "#6b7385", fontSize: 13 }}>楽譜エンジンで描いています…</p>}
      {state === "error" && <p style={{ color: "#b3261e", fontSize: 13 }}>楽譜エンジンが読めませんでした ・ {err}</p>}
      <div ref={box} style={{ background: "#fff", borderRadius: 8, overflowX: "auto" }} />
    </div>
  )
}
