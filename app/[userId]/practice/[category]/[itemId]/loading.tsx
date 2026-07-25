export default function PracticeDetailLoading() {
  return (
    <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto", position: "relative", minHeight: "60vh" }}>
      <div style={{ height: 20, width: 120, background: "#e8e8e8", borderRadius: 4, marginBottom: 20 }} />
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 260px", height: 480, background: "#e8e8e8", borderRadius: 12 }} />
        <div style={{ flex: "1 1 200px", maxWidth: 280, height: 480, background: "#e8e8e8", borderRadius: 12 }} />
      </div>
      {/* 遷移中だとはっきり分かるよう、中央にスピナー */}
      <div
        style={{
          position: "fixed", left: "50%", top: "50%", transform: "translate(-50%,-50%)",
          display: "flex", alignItems: "center", gap: 10, padding: "14px 22px",
          background: "rgba(26,32,44,0.92)", color: "#fff", borderRadius: 999,
          fontSize: 14, fontWeight: 700, boxShadow: "0 8px 28px rgba(0,0,0,0.35)", zIndex: 50,
        }}
      >
        <span style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "#fff", borderRadius: "50%", animation: "arcoLoadSpin 0.7s linear infinite" }} />
        <span>読み込み中…</span>
      </div>
      <style>{`@keyframes arcoLoadSpin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
