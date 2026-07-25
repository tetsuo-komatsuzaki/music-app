"use client"

import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { useParams } from "next/navigation"

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
  /**
   * ガイドが「見本データを見せている」間だけ立つ印 (例: "review")。
   * まだ演奏が1件も無いユーザーに、ふりかえり画面がどうなるかを見せるため、
   * 該当画面が見本の採点結果とおすすめ練習を描画する。
   */
  guideSample: string | null
  setGuideSample: (key: string | null) => void
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
  guideSample: null,
  setGuideSample: () => {},
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

// localStorage キーはユーザーごとに分ける (2026-07-25)。
// 以前は全ユーザー共通キーだったため、同じブラウザで別ユーザーがログインすると
// 前のユーザーの「見た」状態を引き継ぎ、新規ユーザーにガイドが出なかった。
// userId を名前空間に含めることで、各ユーザーが自分の状態を持つ。
type StorageKeys = {
  welcomeSlidesShown: string
  allGuidesDismissed: string
  pageGuidesSeen: string
  firstAnalysisGuideShown: string
}
function makeStorageKeys(userId: string): StorageKeys {
  const ns = `arcoda.onboarding.${userId || "anon"}`
  return {
    welcomeSlidesShown: `${ns}.welcomeSlidesShown`,
    allGuidesDismissed: `${ns}.allGuidesDismissed`,
    pageGuidesSeen: `${ns}.pageGuidesSeen`,
    firstAnalysisGuideShown: `${ns}.firstAnalysisGuideShown`,
  }
}
// 旧・全ユーザー共通キー (移行判定に使う)
const LEGACY_KEYS: StorageKeys = {
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
  const params = useParams<{ userId: string }>()
  const userId = params?.userId ?? ""
  // localStorage キーは userId で名前空間化する。コールバックの依存に載せないよう
  // ref に保持し、常に最新の userId 分のキーを参照する (userId 変化時は下の effect で更新)。
  const keysRef = useRef<StorageKeys>(makeStorageKeys(userId))
  keysRef.current = makeStorageKeys(userId)

  const [welcomeSlidesShown, setWelcomeSlidesShown] = useState(false)
  const [allGuidesDismissed, setAllGuidesDismissed] = useState(false)
  const [pageGuidesSeen, setPageGuidesSeen] = useState<Set<string>>(() => new Set())
  const [firstAnalysisGuideShown, setFirstAnalysisGuideShown] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  const [analysisOverlayRenderedAt, setAnalysisOverlayRenderedAt] = useState<number | null>(null)
  const [replayingPageKey, setReplayingPageKey] = useState<string | null>(null)
  const [guideSample, setGuideSample] = useState<string | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [helpSection, setHelpSection] = useState<HelpSection | null>(null)

  // Hydration: localStorage 読込 (userId ごと)
  useEffect(() => {
    const STORAGE_KEYS = keysRef.current
    // 一回限りの移行: このユーザーの新キーがまだ無く、旧・全ユーザー共通キーが
    // 残っている場合だけ引き継ぐ。これで「既存ユーザーが移行直後にガイドを
    // もう一度見せられる」のを防ぎつつ、新規ユーザーには汚染が伝播しない。
    // (旧キーは残さず消す。以後どのユーザーにも影響させない)
    if (
      safeGetItem(STORAGE_KEYS.welcomeSlidesShown) === null &&
      safeGetItem(LEGACY_KEYS.welcomeSlidesShown) !== null
    ) {
      // 移行するのは「初回ログイン後にオンボーディングを完了した既存ユーザー」だけ。
      // completedAt を通ったユーザーだけがこの Provider に来る前提だが、
      // ブラウザ共有の新規ユーザーに旧状態が漏れないよう、移行は現ユーザーの
      // 新キーへコピーしてから旧キーを削除する。
      for (const k of ["welcomeSlidesShown", "allGuidesDismissed", "pageGuidesSeen", "firstAnalysisGuideShown"] as const) {
        const v = safeGetItem(LEGACY_KEYS[k])
        if (v !== null) safeSetItem(STORAGE_KEYS[k], v)
        safeRemoveItem(LEGACY_KEYS[k])
      }
    }

    setWelcomeSlidesShown(safeGetItem(STORAGE_KEYS.welcomeSlidesShown) === "true")
    setAllGuidesDismissed(safeGetItem(STORAGE_KEYS.allGuidesDismissed) === "true")
    const seenJson = safeGetItem(STORAGE_KEYS.pageGuidesSeen)
    let seen = new Set<string>()
    if (seenJson) {
      try {
        const arr = JSON.parse(seenJson)
        if (Array.isArray(arr)) seen = new Set(arr.filter((x): x is string => typeof x === "string"))
      } catch { /* パース失敗は空 Set */ }
    }
    setPageGuidesSeen(seen)
    setFirstAnalysisGuideShown(safeGetItem(STORAGE_KEYS.firstAnalysisGuideShown) === "true")
    setIsHydrated(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const markWelcomeSlidesShown = useCallback(() => {
    setWelcomeSlidesShown(true)
    safeSetItem(keysRef.current.welcomeSlidesShown, "true")
  }, [])

  const markPageGuideSeen = useCallback((pageKey: string) => {
    setPageGuidesSeen(prev => {
      if (prev.has(pageKey)) return prev
      const next = new Set(prev)
      next.add(pageKey)
      safeSetItem(keysRef.current.pageGuidesSeen, JSON.stringify([...next]))
      return next
    })
  }, [])

  const markFirstAnalysisGuideShown = useCallback(() => {
    setFirstAnalysisGuideShown(true)
    safeSetItem(keysRef.current.firstAnalysisGuideShown, "true")
  }, [])

  const dismissAllGuides = useCallback(() => {
    setAllGuidesDismissed(true)
    safeSetItem(keysRef.current.allGuidesDismissed, "true")
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
    safeRemoveItem(keysRef.current.welcomeSlidesShown)
    safeRemoveItem(keysRef.current.allGuidesDismissed)
    safeRemoveItem(keysRef.current.pageGuidesSeen)
    safeRemoveItem(keysRef.current.firstAnalysisGuideShown)
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
    guideSample,
    setGuideSample,
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
