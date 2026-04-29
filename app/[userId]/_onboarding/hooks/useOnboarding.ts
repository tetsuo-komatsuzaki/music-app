"use client"

import { useContext } from "react"
import { OnboardingContext, OnboardingContextValue } from "../OnboardingProvider"

/**
 * Provider 不在時は NOOP_CONTEXT が返る (createContext のデフォルト値)。
 * クラッシュさせず、全アクションを no-op として安全に扱う。
 */
export function useOnboarding(): OnboardingContextValue {
  return useContext(OnboardingContext)
}
