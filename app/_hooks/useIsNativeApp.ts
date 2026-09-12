"use client"

import { useSyncExternalStore } from "react"

import { isNativeApp } from "@/app/_libs/isNativeApp"

// 殻の判定は起動後に変わらないので、購読は何もしない。
const subscribe = () => () => {}

/**
 * ARC-SPEC-NATIVE-1.0 §1 — 表示の出し分け用のアプリ版判定。
 *
 * サーバーレンダリング時はアプリかどうか分からないので、サーバー側スナップショットは
 * 常に false (= Web版と同じ見た目) にして、ハイドレーション後に実際の値へ切り替える。
 */
export function useIsNativeApp(): boolean {
  return useSyncExternalStore(subscribe, isNativeApp, () => false)
}

/**
 * いま開いている場所で「アルコプラスをはじめる」導線を出してよいか (isNativeApp.ts の canShowBillingEntryPoint の表示用)。
 * サーバー側は Web と同じ値 (apple なら false・stripe なら true) で描き、ハイドレーション後に殻の値へ切り替える。
 */
export function useCanShowBillingEntryPoint(): boolean {
  const native = useIsNativeApp()
  const apple = process.env.NEXT_PUBLIC_BILLING_MODE === "apple"
  return apple ? native : !native
}

/** Apple 課金かつ iOS の殻の中か (要件整理 v2.7 §3)。表示の出し分け用 */
export function useIsAppleFlowHere(): boolean {
  const native = useIsNativeApp()
  return process.env.NEXT_PUBLIC_BILLING_MODE === "apple" && native
}
