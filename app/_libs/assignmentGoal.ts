// 宿題の「提出期限」と「合格の目安(点数/達成/マスター)」の共通表示ヘルパー (2026-08-01)。
// 先生カルテ・ホーム・スコアバナー・my-teacher で同じ文言/判定を使う。

export function goalLabel(goalType?: string | null, targetScore?: number | null): string | null {
  if (goalType === "score") return targetScore != null ? `目標 ${targetScore}点以上` : "目標 点数"
  if (goalType === "achieve") return "目標 達成（弾ける）"
  if (goalType === "master") return "目標 🏆マスター"
  return null
}

export type DueState = "overdue" | "soon" | "normal"

/** 提出期限の表示ラベル(M/D)と状態。null=期限なし/不正。 */
export function dueInfo(dueDate?: string | Date | null): { label: string; state: DueState } | null {
  if (!dueDate) return null
  const d = new Date(dueDate)
  if (isNaN(d.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(d)
  due.setHours(0, 0, 0, 0)
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000)
  const state: DueState = diffDays < 0 ? "overdue" : diffDays <= 2 ? "soon" : "normal"
  return { label: `${d.getMonth() + 1}/${d.getDate()}`, state }
}

export const DUE_COLOR: Record<DueState, { fg: string; bg: string; border: string }> = {
  overdue: { fg: "#c0392b", bg: "#fdecec", border: "#f6cdcd" },
  soon: { fg: "#b7823a", bg: "#fdf2e4", border: "#f0dcb9" },
  normal: { fg: "#6b7885", bg: "#f1f4f8", border: "#e2e6ea" },
}

/** 点数目標に対する合否 (提出点数がある場合のみ)。score型以外は null。 */
export function scorePassed(goalType?: string | null, targetScore?: number | null, submittedScore?: number | null): boolean | null {
  if (goalType !== "score" || targetScore == null || submittedScore == null) return null
  return submittedScore >= targetScore
}
