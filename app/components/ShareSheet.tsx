"use client"

// シェアシート (2026-08-03): カード作成 → OSシェア / X / LINE / Instagram(画像) / 保存 / リンクコピー。
// 名前はデフォルトなし・入れる場合だけ入力 (シェア時選択の確定仕様)。
import { useState } from "react"
import { createPortal } from "react-dom"
import { Share2, MessageCircle, Camera, Check, Link2 } from "lucide-react"
import { createShareCard } from "@/app/actions/shareCards"
import { type ShareKind, type SharePayload, shareText, SHARE_KIND_META } from "@/app/_libs/shareCard"

export default function ShareSheet({
  kind, refId, onClose,
}: {
  kind: ShareKind
  refId?: string
  onClose: () => void
}) {
  const [name, setName] = useState("")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<{ token: string; withName: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const url = created ? `${window.location.origin}/s/${created.token}` : null
  // 文言はサーバー payload と同型のダミーで組む必要はない — 作成後はカード種の定型文で十分
  const text = shareText(kind, {} as SharePayload).replace("「」を", "").replace("音程-点・リズム-点", "")

  const ensureCard = async (): Promise<string | null> => {
    // 名前を変えて作り直した場合は再作成 (tokenは名前込みのスナップショット)
    if (created && created.withName === name.trim()) return created.token
    setCreating(true)
    setError(null)
    const r = await createShareCard({ kind, refId, displayName: name.trim() || null })
    setCreating(false)
    if (!r.ok) { setError(r.error); return null }
    setCreated({ token: r.token, withName: name.trim() })
    return r.token
  }

  const openShare = async () => {
    const token = await ensureCard()
    if (!token) return
    const u = `${window.location.origin}/s/${token}`
    if (navigator.share) {
      try { await navigator.share({ text, url: u }) } catch { /* キャンセルは無視 */ }
    } else {
      await navigator.clipboard?.writeText(`${text} ${u}`).catch(() => {})
      setCopied(true)
    }
  }

  const openX = async () => {
    const token = await ensureCard()
    if (!token) return
    const u = `${window.location.origin}/s/${token}`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(u)}`, "_blank", "noopener")
  }

  const openLine = async () => {
    const token = await ensureCard()
    if (!token) return
    const u = `${window.location.origin}/s/${token}`
    window.open(`https://line.me/R/share?text=${encodeURIComponent(`${text} ${u}`)}`, "_blank", "noopener")
  }

  const openInstagram = async () => {
    const token = await ensureCard()
    if (!token) return
    try {
      const blob = await fetch(`/s/${token}/ig-image`).then((r) => { if (!r.ok) throw new Error(); return r.blob() })
      const file = new File([blob], "arcoda-share.png", { type: "image/png" })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] }).catch(() => {})
        return
      }
    } catch { /* fallthrough */ }
    // ファイル共有非対応 (PC等) → 縦画像を開いて手動保存
    window.open(`/s/${token}/ig-image`, "_blank", "noopener")
  }

  const copyLink = async () => {
    const token = await ensureCard()
    if (!token) return
    await navigator.clipboard?.writeText(`${window.location.origin}/s/${token}`).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const btn: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    fontSize: "var(--fs-body)", fontWeight: 800, borderRadius: 12, padding: "11px 10px",
    border: "1px solid #e2ddce", background: "#fbf8f0", color: "var(--text-ink)", cursor: "pointer",
  }

  return createPortal(
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(30,25,10,.45)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "min(100%, 480px)", background: "#fffdf6", borderRadius: "18px 18px 0 0",
        padding: "16px 16px calc(16px + env(safe-area-inset-bottom))", boxShadow: "0 -6px 30px rgba(40,30,10,.25)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: "var(--fs-subhead)", fontWeight: 900, color: "var(--text-ink)", display: "flex", alignItems: "center", gap: 6 }}>
            <Share2 size={16} /> {SHARE_KIND_META[kind].label}をシェア
          </div>
          <button type="button" onClick={onClose} aria-label="閉じる"
            style={{ border: "none", background: "none", fontSize: "var(--fs-subhead)", color: "var(--text-sub)", cursor: "pointer" }}>✕</button>
        </div>

        {/* 名前 (任意・デフォルトなし) */}
        <div style={{ marginBottom: 10 }}>
          <input value={name} onChange={(e) => { setName(e.target.value) }} maxLength={20}
            placeholder="名前を入れる（任意・画像に表示されます）"
            style={{ width: "100%", boxSizing: "border-box", fontSize: "var(--fs-body)", border: "1px solid #e2ddce", borderRadius: 10, padding: "9px 12px", background: "#fff" }} />
        </div>

        {/* プレビュー (作成後に実画像) */}
        {created && (
          <div style={{ marginBottom: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/s/${created.token}/opengraph-image`} alt="シェア画像プレビュー"
              style={{ width: "100%", borderRadius: 12, border: "1px solid #eee5d0", display: "block" }} />
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <button type="button" style={{ ...btn, gridColumn: "1 / -1", background: "linear-gradient(135deg,#c9a227,#a97b1f)", color: "var(--text-on-accent)", border: "none" }}
            onClick={openShare} disabled={creating}>
            {creating ? "作成中…" : <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Share2 size={15} /> シェアする</span>}
          </button>
          <button type="button" style={btn} onClick={openX} disabled={creating}>𝕏 でポスト</button>
          <button type="button" style={{ ...btn, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }} onClick={openLine} disabled={creating}><MessageCircle size={15} /> LINEで送る</button>
          <button type="button" style={{ ...btn, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }} onClick={openInstagram} disabled={creating}><Camera size={15} /> Instagram</button>
          <button type="button" style={{ ...btn, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }} onClick={copyLink} disabled={creating}>{copied ? <><Check size={15} /> コピーした！</> : <><Link2 size={15} /> リンクをコピー</>}</button>
        </div>

        {error && <div style={{ marginTop: 8, fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-error)" }}>{error}</div>}
      </div>
    </div>,
    document.body,
  )
}
