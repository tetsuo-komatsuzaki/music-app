"use client"

// 工程G (2026-07-11) — 奏法確認キューのクライアントUI。
// 曲/教材ごとに一律4択 (スタッカート/スピッカート/ボウ・スタッカート/ポルタート)
// から選んで一括確定。確定済みは折りたたみに移動し、選び直しも可能。

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { resolveTechniqueConfirmation } from "@/app/actions/resolveTechniqueConfirmation"
import { categoryLabel } from "@/app/_libs/practiceConstants"

export type ConfirmationGroup = {
  targetType: "score" | "practice"
  targetId: string
  title: string
  star: number | null
  category: string | null
  status: "pending" | "confirmed"
  resolvedTag: string | null
  patterns: Array<{ pattern: string; noteCount: number; measures: number[] }>
}

const TAG_CHOICES = ["スタッカート", "スピッカート", "ボウ・スタッカート", "ポルタート"]

const PATTERN_LABELS: Record<string, string> = {
  staccato_inside_slur: "スラー内の点",
  staccato_outside_slur: "スラー外の点",
}

function GroupCard({
  group,
  userId,
}: {
  group: ConfirmationGroup
  userId: string
}) {
  void userId
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const resolve = (tag: string) => {
    setError(null)
    startTransition(async () => {
      const res = await resolveTechniqueConfirmation({
        targetType: group.targetType,
        targetId: group.targetId,
        resolvedTag: tag,
      })
      if (!res.ok) setError(res.error ?? "確定に失敗しました")
      else router.refresh()
    })
  }

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: "14px 16px",
        background: "#fff",
        marginBottom: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontWeight: 700, fontSize: 15 }}>{group.title}</span>
        <span style={{ fontSize: 12, color: "#888" }}>
          {group.targetType === "score"
            ? "曲"
            : categoryLabel(group.category ?? "")}
          {group.star != null && ` ★${group.star}`}
        </span>
        {group.status === "confirmed" && group.resolvedTag && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#1d5c38",
              background: "#e3f3e9",
              borderRadius: 999,
              padding: "2px 10px",
            }}
          >
            ✓ {group.resolvedTag} で確定済み
          </span>
        )}
      </div>

      <div style={{ fontSize: 13, color: "#555", margin: "8px 0 10px" }}>
        {group.patterns.map((p) => (
          <div key={p.pattern}>
            {PATTERN_LABELS[p.pattern] ?? p.pattern}: {p.noteCount}音
            {p.measures.length > 0 && (
              <span style={{ color: "#999" }}>
                {" "}
                (第{p.measures.slice(0, 8).join(",")}
                {p.measures.length > 8 ? "…" : ""}小節)
              </span>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {TAG_CHOICES.map((tag) => {
          const active = group.resolvedTag === tag
          return (
            <button
              key={tag}
              type="button"
              disabled={pending}
              onClick={() => resolve(tag)}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: pending ? "wait" : "pointer",
                border: active ? "2px solid #2e8b57" : "1px solid #cbd5e1",
                background: active ? "#e3f3e9" : "#f8fafc",
                color: active ? "#1d5c38" : "#333",
              }}
            >
              {tag}
            </button>
          )
        })}
      </div>
      {error && (
        <div style={{ marginTop: 8, fontSize: 12, color: "#b91c1c" }}>{error}</div>
      )}
    </div>
  )
}

export default function AdminConfirmations({
  userId,
  groups,
}: {
  userId: string
  groups: ConfirmationGroup[]
}) {
  const pending = groups.filter((g) => g.status === "pending")
  const confirmed = groups.filter((g) => g.status === "confirmed")

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 16px" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
        奏法の確認
      </h1>
      <p style={{ fontSize: 13, color: "#666", marginBottom: 20 }}>
        楽譜のスタッカート点(・)は記号だけでは奏法が確定できません。
        曲ごとに正しい奏法を選んで確定してください（達成要件・推薦に反映されます）。
      </p>

      <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 10px" }}>
        未確認 ({pending.length}件)
      </h2>
      {pending.length === 0 ? (
        <p style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>
          未確認の曖昧記号はありません 🎉
        </p>
      ) : (
        pending.map((g) => (
          <GroupCard key={`${g.targetType}:${g.targetId}`} group={g} userId={userId} />
        ))
      )}

      {confirmed.length > 0 && (
        <details style={{ marginTop: 24 }}>
          <summary
            style={{ cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#4a90d9" }}
          >
            確認済み ({confirmed.length}件) — 選び直しもここから
          </summary>
          <div style={{ marginTop: 12 }}>
            {confirmed.map((g) => (
              <GroupCard
                key={`${g.targetType}:${g.targetId}`}
                group={g}
                userId={userId}
              />
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
