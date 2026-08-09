// 学びレッスン誘導バナー (フロー【1】・確定#5/#6 2026-07-14)
// この曲に出てくる技術のうち、公開中レッスンがあり未習得(クリアも自己申告もない)
// ものを案内する。サーバーコンポーネント (計算は page.tsx 側)。
import Link from "next/link"
import { GraduationCap } from "lucide-react"

export default function LessonGateBanner({
  userId,
  scoreId,
  lessons,
}: {
  userId: string
  scoreId: string
  lessons: Array<{ id: string; name: string }>
}) {
  // クリア後「曲にもどる」でこの曲へ復帰させる (UI要件v1.1 §4)
  const returnQuery = `?return=${encodeURIComponent(`/${userId}/scores/${scoreId}`)}`
  const names = lessons.map((l) => l.name).join("・")
  return (
    <div
      style={{
        margin: "10px 12px 0",
        padding: "12px 14px",
        background: "#F3FBEA",
        border: "2px solid #CDEEB2",
        borderRadius: 14,
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <GraduationCap size={26} color="#5a8a2e" aria-hidden style={{ flex: "none" }} />
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontWeight: 800, color: "#3c5a1e", fontSize: 14 }}>
          この曲には <b>{names}</b> が出てくるよ
        </div>
        <div style={{ fontSize: 12, color: "#5f7a44", marginTop: 2 }}>
          まだ練習していないから、先に学びレッスンでいっしょにやってみよう!（1本2〜3分）
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {lessons.slice(0, 3).map((l) => (
          <Link
            key={l.id}
            href={`/${userId}/lessons/${l.id}${returnQuery}`}
            style={{
              background: "#58CC02",
              boxShadow: "0 3px 0 #58A700",
              color: "#fff",
              fontWeight: 800,
              fontSize: 13,
              borderRadius: 12,
              padding: "8px 14px",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            {l.name}のレッスンへ
          </Link>
        ))}
      </div>
    </div>
  )
}
