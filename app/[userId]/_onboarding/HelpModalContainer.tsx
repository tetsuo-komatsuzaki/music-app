"use client"

import { useOnboarding } from "./hooks/useOnboarding"
import HelpModal from "./HelpModal"

export default function HelpModalContainer() {
  const { helpOpen, helpSection, closeHelp } = useOnboarding()
  return (
    <HelpModal
      open={helpOpen}
      initialSection={helpSection ?? undefined}
      onClose={closeHelp}
    />
  )
}
