// 先生モード共通のローディング表示 (2026-08-01)。
// /teacher 配下(生徒一覧・生徒カルテ・プロフィール・予約)の遷移中に、
// 画面が固まって見えないよう読み込み中を明示する。
export default function TeacherLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: "60px 0",
        color: "var(--text-sub)",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          border: "3px solid #dfe3e8",
          borderTopColor: "#2b3742",
          animation: "teacherspin 0.8s linear infinite",
        }}
      />
      <span style={{ fontSize: "var(--fs-body)", fontWeight: 700 }}>読み込み中…</span>
      <style>{`@keyframes teacherspin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
