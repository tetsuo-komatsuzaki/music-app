// 祝いバナー (祝い体験 v2.0 §2.1 → 2026-08-16 吹き出し化)。
// 解析 done の演奏に対し、スコア詳細のタブ帯の「ふりかえり」タブの真上に
// コンパクトな吹き出しで出す (Tetsuo指定: 画面がごちゃつかないように)。
// サプライズ設計(§2.2): 節目の有無を一切読まない。常に同一の見た目・文言。
// タップ → 振り返り(結果)画面へ。親要素は position:relative であること。
"use client"

export default function CelebrationBanner({ onOpen }: { name?: string; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        position: "absolute",
        // タブ帯は 演奏/ふりかえり/練習後カルテ の3等分 → ふりかえりの中心 = 50%
        left: "50%",
        top: -34,
        transform: "translateX(-50%)",
        zIndex: 20,
        display: "inline-flex", alignItems: "center", gap: 6,
        background: "#1E3A8A", color: "#fff",
        border: "none", borderRadius: 999,
        padding: "6px 14px", cursor: "pointer",
        fontSize: "var(--fs-label)", fontWeight: 800, whiteSpace: "nowrap",
        boxShadow: "0 3px 10px rgba(20,35,70,.28)",
        animation: "celebBubbleIn .3s ease",
      }}
      aria-label="採点ができあがりました。ふりかえりを開く"
    >
      採点できあがったよ！
      {/* 吹き出しのしっぽ (ふりかえりタブを指す) */}
      <span
        aria-hidden
        style={{
          position: "absolute", left: "50%", bottom: -4, width: 10, height: 10,
          background: "#1E3A8A", transform: "translateX(-50%) rotate(45deg)",
        }}
      />
      <style>{`@keyframes celebBubbleIn { from { opacity: 0; transform: translateX(-50%) translateY(4px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }`}</style>
    </button>
  )
}
