"use client"
/** ゲストホームの訪問を 1 回だけ記録する (2026-09-06 計測)。同じタブでの再表示は数えない */
import { useEffect } from "react"
import { recordGuestEvent } from "@/app/actions/recordGuestEvent"
import { readKnownUser } from "@/app/_libs/knownUser"

export default function GuestVisitPing() {
  useEffect(() => {
    try {
      if (window.sessionStorage.getItem("arcoda_guest_visit")) return
      window.sessionStorage.setItem("arcoda_guest_visit", "1")
    } catch { /* 記録できない端末では毎回 1 回になるだけ */ }
    void recordGuestEvent("visit", readKnownUser() ? "returning" : "home", "/guest")
  }, [])
  return null
}
