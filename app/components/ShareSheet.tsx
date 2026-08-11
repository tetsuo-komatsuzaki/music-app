"use client"

// シェアシート (2026-08-11 作り替え): カードをシート表示時に先に作成しておき、
// 共有はタップ時に同期実行 (navigator.share/clipboard) — await後に開くと
// ジェスチャ文脈が切れてブロックされる不具合を解消。名前欄は廃止・OS共有シートを主に。
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Share2, Check, Link2, RefreshCw } from "lucide-react"
import { createShareCard } from "@/app/actions/shareCards"
import { type ShareKind, type SharePayload, shareText, SHARE_KIND_META } from "@/app/_libs/shareCard"

export default function ShareSheet({
  kind, refId, onClose,
}: {
  kind: ShareKind
  refId?: string
  onClose: () => void
}) {
  const [token, setToken] = useState<string | null>(null)
  const [creating, setCreating] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [attempt, setAttempt] = useState(0)

  const url = token ? `${typeof window !== "undefined" ? window.location.origin : ""}/s/${token}` : null
  const text = shareText(kind, {} as SharePayload).replace("「」を", "").replace("音程-点・リズム-点", "")

  // シート表示時にカードを先に作成 (名前なし)。ジェスチャ不要な処理はここで済ませる。
  useEffect(() => {
    let aborted = false
    setCreating(true)
    setError(null)
    ;(async () => {
      try {
        const r = await createShareCard({ kind, refId, displayName: null })
        if (aborted) return
        if (r.ok) setToken(r.token)
        else setError(r.error)
      } catch {
        if (!aborted) setError("作成に失敗しました。時間をおいて試してください")
      } finally {
        if (!aborted) setCreating(false)
      }
    })()
    return () => { aborted = true }
  }, [kind, refId, attempt])

  // 以下はすべてタップ時に同期実行 (token は準備済み) — ジェスチャが切れず確実に開く
  // 2026-08-11 修正: share が開けない環境 (アプリ内ブラウザ等の壊れた実装・権限拒否) で
  // 何も起きないバグ → 失敗を検知してリンクコピーに自動フォールバックする
  const shareNative = () => {
    if (!url) return
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        navigator.share({ text, url }).catch((e: unknown) => {
          const name = (e as { name?: string } | null)?.name
          if (name !== "AbortError") copyLink() // キャンセル以外の失敗はコピーで代替
        })
      } catch {
        copyLink() // 同期例外 (壊れたWebView実装) もコピーで代替
      }
    } else {
      copyLink()
    }
  }
  const copyLink = () => {
    if (!url) return
    navigator.clipboard?.writeText(url).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const btn: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    fontSize: "var(--fs-body)", fontWeight: 800, borderRadius: 12, padding: "12px 10px",
    border: "1px solid #e2ddce", background: "#fbf8f0", color: "var(--text-ink)", cursor: "pointer",
  }

  return createPortal(
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(30,25,10,.45)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "min(100%, 480px)", background: "#fffdf6", borderRadius: "18px 18px 0 0",
        padding: "16px 16px calc(16px + env(safe-area-inset-bottom))", boxShadow: "0 -6px 30px rgba(40,30,10,.25)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: "var(--fs-subhead)", fontWeight: 900, color: "var(--text-ink)", display: "flex", alignItems: "center", gap: 6 }}>
            <Share2 size={16} /> {SHARE_KIND_META[kind].label}をシェア
          </div>
          <button type="button" onClick={onClose} aria-label="閉じる"
            style={{ border: "none", background: "none", fontSize: "var(--fs-subhead)", color: "var(--text-sub)", cursor: "pointer" }}>✕</button>
        </div>

        {/* プレビュー (作成後に実画像) */}
        {token && (
          <div style={{ marginBottom: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/s/${token}/opengraph-image`} alt="シェア画像プレビュー"
              style={{ width: "100%", borderRadius: 12, border: "1px solid #eee5d0", display: "block" }} />
          </div>
        )}

        {creating && (
          <div style={{ padding: "18px 0", textAlign: "center", fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-sub)" }}>
            シェアカードを準備中…
          </div>
        )}

        {error && (
          <div style={{ padding: "10px 0 4px", textAlign: "center" }}>
            <div style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-error)", marginBottom: 10 }}>{error}</div>
            <button type="button" style={{ ...btn, width: "100%" }} onClick={() => setAttempt((a) => a + 1)}>
              <RefreshCw size={15} /> もう一度ためす
            </button>
          </div>
        )}

        {token && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button type="button" style={{ ...btn, background: "linear-gradient(135deg,#c9a227,#a97b1f)", color: "var(--text-on-accent)", border: "none" }} onClick={shareNative}>
              <Share2 size={15} /> {typeof navigator !== "undefined" && "share" in navigator ? "共有する" : "リンクをコピー"}
            </button>
            <button type="button" style={btn} onClick={copyLink}>
              {copied ? <><Check size={15} /> コピーした！</> : <><Link2 size={15} /> リンクをコピー</>}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
