"use client"

import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react"

export type HelpSection =
  | "welcome"
  | "markers"
  | "pageGuides"
  | "faq"
  | "troubleshooting"

export type OnboardingState = {
  // 永続化 (localStorage)
  welcomeSlidesShown: boolean
  allGuidesDismissed: boolean
  pageGuidesSeen: Set<string>
  firstAnalysisGuideShown: boolean

  // transient (永続化しない)
  isHydrated: boolean
  analysisOverlayRenderedAt: number | null
  replayingPageKey: string | null
  helpOpen: boolean
  helpSection: HelpSection | null
}

export type OnboardingActions = {
  markWelcomeSlidesShown: () => void
  markPageGuideSeen: (pageKey: string) => void
  markFirstAnalysisGuideShown: () => void
  dismissAllGuides: () => void
  resetAll: () => void

  markAnalysisOverlayRendered: () => void
  replayPageGuide: (pageKey: string) => void
  clearReplayingPageKey: () => void
  openHelp: (section?: HelpSection) => void
  closeHelp: () => void
}

export type OnboardingContextValue = OnboardingState & OnboardingActions

/**
 * Provider 不在時のフォールバック値。
 * ErrorBoundary 経由で Provider が落ちた場合や、Provider 外で誤って consumer を使った場合の安全網。
 * 全フラグを「表示済み/dismissed」にして、オーバーレイが出ないようにする。actions は no-op。
 */
const NOOP_CONTEXT: OnboardingContextValue = {
  welcomeSlidesShown: true,
  allGuidesDismissed: true,
  pageGuidesSeen: new Set(),
  firstAnalysisGuideShown: true,
  isHydrated: true,
  analysisOverlayRenderedAt: null,
  replayingPageKey: null,
  helpOpen: false,
  helpSection: null,
  markWelcomeSlidesShown: () => {},
  markPageGuideSeen: () => {},
  markFirstAnalysisGuideShown: () => {},
  dismissAllGuides: () => {},
  resetAll: () => {},
  markAnalysisOverlayRendered: () => {},
  replayPageGuide: () => {},
  clearReplayingPageKey: () => {},
  openHelp: () => {},
  closeHelp: () => {},
}

export const OnboardingContext = createContext<OnboardingContextValue>(NOOP_CONTEXT)

const STORAGE_KEYS = {
  welcomeSlidesShown: "arcoda.onboarding.welcomeSlidesShown",
  allGuidesDismissed: "arcoda.onboarding.allGuidesDismissed",
  pageGuidesSeen: "arcoda.onboarding.pageGuidesSeen",
  firstAnalysisGuideShown: "arcoda.onboarding.firstAnalysisGuideShown",
} as const

const safeGetItem = (key: string): string | null => {
  if (typeof window === "undefined") return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

const safeSetItem = (key: string, value: string) => {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // QuotaExceeded / private mode は黙認
  }
}

const safeRemoveItem = (key: string) => {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(key)
  } catch {
    // 黙認
  }
}

export default function OnboardingProvider({ children }: { children: ReactNode }) {
  const [welcomeSlidesShown, setWelcomeSlidesShown] = useState(false)
  const [allGuidesDismissed, setAllGuidesDismissed] = useState(false)
  const [pageGuidesSeen, setPageGuidesSeen] = useState<Set<string>>(() => new Set())
  const [firstAnalysisGuideShown, setFirstAnalysisGuideShown] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  const [analysisOverlayRenderedAt, setAnalysisOverlayRenderedAt] = useState<number | null>(null)
  const [replayingPageKey, setReplayingPageKey] = useState<string | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [helpSection, setHelpSection] = useState<HelpSection | null>(null)

  // Hydration: localStorage 読込
  useEffect(() => {
    setWelcomeSlidesShown(safeGetItem(STORAGE_KEYS.welcomeSlidesShown) === "true")
    setAllGuidesDismissed(safeGetItem(STORAGE_KEYS.allGuidesDismissed) === "true")
    const seenJson = safeGetItem(STORAGE_KEYS.pageGuidesSeen)
    if (seenJson) {
      try {
        const arr = JSON.parse(seenJson)
        if (Array.isArray(arr)) {
          setPageGuidesSeen(new Set(arr.filter((x): x is string => typeof x === "string")))
        }
      } catch {
        // パース失敗は空 Set のまま
      }
    }
    setFirstAnalysisGuideShown(safeGetItem(STORAGE_KEYS.firstAnalysisGuideShown) === "true")
    setIsHydrated(true)
  }, [])

  const markWelcomeSlidesShown = useCallback(() => {
    setWelcomeSlidesShown(true)
    safeSetItem(STORAGE_KEYS.welcomeSlidesShown, "true")
  }, [])

  const markPageGuideSeen = useCallback((pageKey: string) => {
    setPageGuidesSeen(prev => {
      if (prev.has(pageKey)) return prev
      const next = new Set(prev)
      next.add(pageKey)
      safeSetItem(STORAGE_KEYS.pageGuidesSeen, JSON.stringify([...next]))
      return next
    })
  }, [])

  const markFirstAnalysisGuideShown = useCallback(() => {
    setFirstAnalysisGuideShown(true)
    safeSetItem(STORAGE_KEYS.firstAnalysisGuideShown, "true")
  }, [])

  const dismissAllGuides = useCallback(() => {
    setAllGuidesDismissed(true)
    safeSetItem(STORAGE_KEYS.allGuidesDismissed, "true")
  }, [])

  const resetAll = useCallback(() => {
    setWelcomeSlidesShown(false)
    setAllGuidesDismissed(false)
    setPageGuidesSeen(new Set())
    setFirstAnalysisGuideShown(false)
    setAnalysisOverlayRenderedAt(null)
    setReplayingPageKey(null)
    setHelpOpen(false)
    setHelpSection(null)
    safeRemoveItem(STORAGE_KEYS.welcomeSlidesShown)
    safeRemoveItem(STORAGE_KEYS.allGuidesDismissed)
    safeRemoveItem(STORAGE_KEYS.pageGuidesSeen)
    safeRemoveItem(STORAGE_KEYS.firstAnalysisGuideShown)
  }, [])

  const markAnalysisOverlayRendered = useCallback(() => {
    setAnalysisOverlayRenderedAt(Date.now())
  }, [])

  const replayPageGuide = useCallback((pageKey: string) => {
    setReplayingPageKey(pageKey)
  }, [])

  const clearReplayingPageKey = useCallback(() => {
    setReplayingPageKey(null)
  }, [])

  const openHelp = useCallback((section?: HelpSection) => {
    setHelpSection(section ?? null)
    setHelpOpen(true)
  }, [])

  const closeHelp = useCallback(() => {
    setHelpOpen(false)
    setHelpSection(null)
  }, [])

  const value: OnboardingContextValue = {
    welcomeSlidesShown,
    allGuidesDismissed,
    pageGuidesSeen,
    firstAnalysisGuideShown,
    isHydrated,
    analysisOverlayRenderedAt,
    replayingPageKey,
    helpOpen,
    helpSection,
    markWelcomeSlidesShown,
    markPageGuideSeen,
    markFirstAnalysisGuideShown,
    dismissAllGuides,
    resetAll,
    markAnalysisOverlayRendered,
    replayPageGuide,
    clearReplayingPageKey,
    openHelp,
    closeHelp,
  }

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  )
}
