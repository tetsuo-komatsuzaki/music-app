"use client"
/**
 * ログイン中の本人がホームを開いたとき、ホームの描画データの写しを端末に残す (2026-09-06 Tetsuo確定)。
 * ログアウト後の「その人がログイン中に見ていたホーム」に使う。画面には何も描かない。
 */
import { useEffect } from "react"
import { writeKnownUser } from "@/app/_libs/knownUser"

export default function KnownUserRecorder({ name, snapshot }: { name: string; snapshot: Record<string, unknown> }) {
  useEffect(() => {
    // 祝い演出の待ち行列と最初の案内は空にして残す (ログアウト後に演出が走らないように)
    const safe = { ...snapshot, coinQueue: [], treasureQueue: [], guide: { active: false, initialStep: 0 }, coinDemo: true }
    writeKnownUser({ name, snapshot: safe })
  }, [name, snapshot])
  return null
}
