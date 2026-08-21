"use client"

// 共通ボタン (2026-08-21 リバイス8 ・ Tetsuo提供の押下マイクロインタラクション仕様)。
// 押下/ホバー/フォーカスの見た目は globals.css の共通規則 (E3') が担い、
// この部品は「非同期処理を行うボタン」の状態管理を足す:
//   ・クリック直後から二重送信を防止
//   ・長引く処理はボタン幅を変えずに スピナー+「処理中」 へ切替 (aria-busy)
//   ・画面遷移しない処理が成功したときだけ ✓+「完了」を約700ms表示
//   ・エラー時はボタン直下に具体的なメッセージ (スクリーンリーダーにも届く)
// 既存のボタンには影響しない追加部品。順次この部品への置き換えを進める。
import { useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react"

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> & {
  children: ReactNode
  /** 同期/非同期どちらでも。Promise を返すと処理中/完了/エラーの状態管理が働く */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<unknown>
  /** 成功後に画面遷移する場合 true: 完了演出を待たずそのまま (既定 false) */
  navigates?: boolean
  /** エラー時の文言を組み立てる (既定: エラーの message か定型文) */
  errorText?: (err: unknown) => string
}

type Phase = "idle" | "busy" | "done"

export default function AppButton({ children, onClick, navigates, errorText, disabled, ...rest }: Props) {
  const [phase, setPhase] = useState<Phase>("idle")
  const [error, setError] = useState<string | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const busyRef = useRef(false)

  const handle = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!onClick || busyRef.current) return
    setError(null)
    const ret = onClick(e)
    if (!(ret instanceof Promise)) return
    // 二重送信はクリック直後から防止。幅は現在値で固定してラベル切替でも変えない
    busyRef.current = true
    const el = btnRef.current
    const w = el ? `${el.offsetWidth}px` : undefined
    if (el && w) el.style.width = w
    setPhase("busy")
    try {
      await ret
      if (navigates) return // 遷移する場合は完了演出を待たない (busyのまま画面が替わる)
      setPhase("done")
      window.setTimeout(() => {
        setPhase("idle")
        busyRef.current = false
        if (el) el.style.width = ""
      }, 700)
    } catch (err) {
      setPhase("idle")
      busyRef.current = false
      if (el) el.style.width = ""
      setError(errorText ? errorText(err) : err instanceof Error && err.message ? err.message : "うまくいかなかったよ。少し待ってもう一度ためしてね")
    }
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        {...rest}
        disabled={disabled || phase === "busy"}
        aria-busy={phase === "busy"}
        onClick={handle}
        style={{ ...rest.style, ...(phase !== "idle" ? { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 } : null) }}
      >
        {phase === "busy" ? (
          <>
            <span aria-hidden style={{ width: 12, height: 12, flex: "none", borderRadius: "50%", border: "2px solid rgba(217,169,60,.35)", borderTopColor: "#d9a93c", animation: "appbtn-spin .7s linear infinite" }} />
            処理中
          </>
        ) : phase === "done" ? (
          <>
            <span aria-hidden>✓</span>完了
          </>
        ) : (
          children
        )}
      </button>
      {/* 状態の読み上げ: 処理中/完了/エラーを polite に通知 */}
      <span aria-live="polite" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)" }}>
        {phase === "busy" ? "処理中" : phase === "done" ? "完了" : error ?? ""}
      </span>
      {error && (
        <span role="alert" style={{ display: "block", marginTop: 6, fontSize: 11.5, fontWeight: 700, color: "var(--text-error)" }}>
          {error}
        </span>
      )}
      <style>{`@keyframes appbtn-spin { to { transform: rotate(360deg) } }`}</style>
    </>
  )
}
