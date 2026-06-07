// app/components/MasterBadge.tsx
//
// 曲(Score)をマスター(SongMastery.isFullyMastered)した時に曲名の横へ出す
// 「🏆 マスター」金バッジ。UI 上の曲名表示箇所すべてで共通利用する
// (2026-06-08 Tetsuo: あらゆる場所で一目でマスター済みと分かるように)。

type Props = {
  /** マスター済みか。false/未指定なら何も描画しない (呼び出し側で条件分岐不要)。 */
  mastered?: boolean | null
  /** "sm" = リスト等の小型, "md" = 詳細ヘッダ等。既定 "sm"。 */
  size?: "sm" | "md"
}

export default function MasterBadge({ mastered, size = "sm" }: Props) {
  if (!mastered) return null
  const isMd = size === "md"
  return (
    <span
      title="この曲をマスターしました"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: isMd ? 4 : 3,
        fontSize: isMd ? 13 : 11,
        fontWeight: 700,
        lineHeight: 1,
        padding: isMd ? "4px 12px" : "2px 8px",
        borderRadius: 14,
        background: "linear-gradient(135deg, #f7d774, #e0a800)",
        color: "#5c3d00",
        border: "1px solid #d4a017",
        boxShadow: "0 1px 3px rgba(212,160,0,0.35)",
        whiteSpace: "nowrap",
        flex: "0 0 auto",
        verticalAlign: "middle",
      }}
    >
      🏆 マスター
    </span>
  )
}
