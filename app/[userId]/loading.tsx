// ページ遷移ローディング — 原本: /proto v3 画面2 (loading-mock 正) の写経 (2026-08-23)。
// 二重金枠リング+アルコ(05A 弓を両手で構える)+「音を調えています…」(点が順に点灯)。
// 原本の進捗%はデモ値のため、実進捗が取れないルート遷移では回転アークの不確定表示に翻案。
import ArcoMotion from "@/app/components/ArcoMotion"

export default function Loading() {
  return (
    <div style={{ minHeight: "70dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <style>{`
        @keyframes arcoLoadSpin { to { transform: rotate(360deg); } }
        @keyframes arcoLoadBob { 0%, 100% { transform: translateY(0) rotate(-1.5deg); } 50% { transform: translateY(-6px) rotate(1.5deg); } }
        @keyframes arcoLoadDot { 0%, 100% { opacity: .2; } 50% { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) {
          .arcoLoadArc { animation: none !important; }
          .arcoLoadDisc { animation: none !important; }
          .arcoLoadDots span { animation: none !important; opacity: .6; }
        }
      `}</style>
      {/* 原本 .progress-ring: 基準の細円 + 外側の薄いアウトライン + 金アーク */}
      <div style={{ position: "relative", width: 176, height: 176, borderRadius: "50%", border: "2px solid rgba(188,161,96,.4)", outline: "1px solid rgba(217,169,60,.18)", outlineOffset: 5 }}>
        <span
          className="arcoLoadArc"
          aria-hidden
          style={{
            position: "absolute", inset: -2, borderRadius: "50%",
            background: "conic-gradient(#d4af37 18%, transparent 0)",
            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px))",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px))",
            filter: "drop-shadow(0 0 4px rgba(217,169,60,.4))",
            animation: "arcoLoadSpin 1.1s linear infinite",
          }}
        />
        <ArcoMotion kit="05A" label="相棒のアルコ" className="arcoLoadDisc" />
        <style>{`.arcoLoadDisc { position: absolute; inset: 10px; animation: arcoLoadBob 2.4s ease-in-out infinite; }`}</style>
      </div>
      <p className="arcoLoadDots" style={{ fontSize: 17, fontWeight: 800, letterSpacing: ".08em", color: "#fffae8", margin: "30px 0 0" }}>
        音を調えています
        <span aria-hidden style={{ animation: "arcoLoadDot .9s ease-in-out infinite" }}>・</span>
        <span aria-hidden style={{ animation: "arcoLoadDot .9s ease-in-out infinite .3s" }}>・</span>
        <span aria-hidden style={{ animation: "arcoLoadDot .9s ease-in-out infinite .6s" }}>・</span>
      </p>
      <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".3em", color: "#6b7488", margin: "26px 0 0" }}>Arcoda</p>
    </div>
  )
}
