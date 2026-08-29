"use client"

// ヘルプモーダルのホスト (2026-08-29 旧 OnboardingProvider 廃止に伴う自立版)。
// openHelp() の CustomEvent を受けて HelpModal を表示する。userShell に1つだけ置く。

import { useEffect, useState } from "react"
import HelpModal from "./HelpModal"
import { onOpenHelp, type HelpSection } from "./helpBus"

export default function HelpModalHost() {
  const [open, setOpen] = useState(false)
  const [section, setSection] = useState<HelpSection | undefined>(undefined)

  useEffect(() => onOpenHelp((s) => { setSection(s); setOpen(true) }), [])

  return <HelpModal open={open} initialSection={section} onClose={() => setOpen(false)} />
}
