"use client"

// ヘルプモーダルの開閉 (2026-08-29 旧ガイド削除に伴い自立化)。
// 旧 OnboardingProvider のコンテキストに依存せず、CustomEvent で開く。
// 使い方: AccountMenu 等から openHelp() → userShell の HelpModalHost が受けて表示。

export type HelpSection = "markers" | "faq" | "troubleshooting"

const EVENT = "arcoda:open-help"

export function openHelp(section?: HelpSection): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { section } }))
}

export function onOpenHelp(handler: (section?: HelpSection) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<{ section?: HelpSection }>).detail?.section)
  window.addEventListener(EVENT, listener)
  return () => window.removeEventListener(EVENT, listener)
}
