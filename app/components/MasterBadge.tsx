// app/components/MasterBadge.tsx
//
// 曲の達成/マスターの2段バッジ (C-6b 2026-07-11 Tetsuo確定)。
//   🏆 マスター (金)  = 達成 + 直近5回平均90 (UserScoreAchievement.masteredAt)
//   ✨ 達成 (緑)      = 弾ける認定 (UserScoreAchievement.achievedAt)
// マスターは達成を含むため表示は常に上位1つだけ。
// UI 上の曲名表示箇所すべてで共通利用する。

import { Trophy, Sparkles } from "lucide-react"
import type { AchievementBadgeKind } from "@/app/_libs/starProgress"

type Props = {
  /** "mastered" | "achieved" | null。null/未指定なら何も描画しない。 */
  kind?: AchievementBadgeKind
  /** 後方互換: mastered=true は kind="mastered" と同じ。 */
  mastered?: boolean | null
  /** "sm" = リスト等の小型, "md" = 詳細ヘッダ等。既定 "sm"。 */
  size?: "sm" | "md"
}

export default function MasterBadge({ kind, mastered, size = "sm" }: Props) {
  const resolved: AchievementBadgeKind = kind ?? (mastered ? "mastered" : null)
  if (!resolved) return null
  const isMd = size === "md"
  const isMaster = resolved === "mastered"
  return (
    <span
      title={isMaster ? "この曲をマスターしました・達成＋平均90点" : "この曲を達成しました"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: isMd ? 4 : 3,
        fontSize: isMd ? 13 : 11,
        fontWeight: 700,
        lineHeight: 1,
        padding: isMd ? "4px 12px" : "2px 8px",
        borderRadius: 14,
        background: isMaster
          ? "linear-gradient(135deg, #f7d774, #e0a800)"
          : "linear-gradient(135deg, #d9f2e3, #9fd8b4)",
        color: isMaster ? "#5c3d00" : "#1d5c38",
        border: isMaster ? "1px solid #d4a017" : "1px solid #6fbf8f",
        boxShadow: isMaster
          ? "0 1px 3px rgba(212,160,0,0.35)"
          : "0 1px 3px rgba(60,160,100,0.25)",
        whiteSpace: "nowrap",
        flex: "0 0 auto",
        verticalAlign: "middle",
      }}
    >
      {isMaster ? <><Trophy size={isMd ? 14 : 12} /> マスター</> : <><Sparkles size={isMd ? 14 : 12} /> 達成</>}
    </span>
  )
}
