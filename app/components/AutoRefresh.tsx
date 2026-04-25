"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * 一定間隔で router.refresh() を呼び、Server Component のデータを再取得する。
 * meta http-equiv="refresh" と違い、フルページリロードせず scroll/client state を保つ。
 */
export default function AutoRefresh({
  intervalMs = 3000,
}: {
  intervalMs?: number
}) {
  const router = useRouter()
  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs)
    return () => clearInterval(id)
  }, [router, intervalMs])
  return null
}
