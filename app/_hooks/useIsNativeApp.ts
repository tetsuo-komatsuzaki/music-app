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
