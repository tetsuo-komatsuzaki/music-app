"use client"
// 曲詳細の難易度・パートセレクタ (2026-08-24 アップロード改修 Step4)。
// 同じ教材グループの変種 (難易度×パート) を切り替える。存在しない組み合わせは出さない。
// 採点履歴・カルテは変種ごとに独立 (要件確定)。
import { useRouter } from "next/navigation"

const TIER_LABEL: Record<string, string> = { BEGINNER: "初級", INTERMEDIATE: "中級", ADVANCED: "上級" }

export type VariantEntry = {
  id: string
  difficulty: string | null
  partId: string | null
  partName: string | null
  star: number | null
}

export default function ScoreVariantSwitcher({
  userId, currentId, variants,
}: {
  userId: string
  currentId: string
  variants: VariantEntry[] // 自分自身も含む全変種 (buildStatus=done のみ)
}) {
  const router = useRouter()
  if (variants.length <= 1) return null
  const current = variants.find((v) => v.id === currentId)
  if (!current) return null

  const tiers = [...new Set(variants.map((v) => v.difficulty ?? ""))]
  const partsOfTier = (tier: string) =>
    variants.filter((v) => (v.difficulty ?? "") === tier)

  const go = (id: string) => {
    if (id && id !== currentId) router.push(`/${userId}/scores/${id}`)
  }

  const selStyle: React.CSSProperties = {
    background: "rgba(150,175,225,.1)", color: "var(--text-body)",
    border: "1px solid rgba(150,175,225,.25)", borderRadius: 10,
    padding: "7px 10px", fontSize: "var(--fs-body)", fontWeight: 700,
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 16px 0", flexWrap: "wrap" }}>
      {tiers.length > 1 && (
        <select
          style={selStyle}
          value={current.difficulty ?? ""}
          onChange={(e) => {
            const tier = e.target.value
            const sameTier = partsOfTier(tier)
            // いまのパートと同じものがあれば維持、無ければそのtierの先頭へ
            const hit = sameTier.find((v) => v.partId === current.partId) ?? sameTier[0]
            if (hit) go(hit.id)
          }}
          aria-label="難易度をえらぶ"
        >
          {tiers.map((t) => (
            <option key={t || "none"} value={t}>{TIER_LABEL[t] ?? "難易度なし"}</option>
          ))}
        </select>
      )}
      {partsOfTier(current.difficulty ?? "").length > 1 && (
        <select
          style={selStyle}
          value={current.id}
          onChange={(e) => go(e.target.value)}
          aria-label="パートをえらぶ"
        >
          {partsOfTier(current.difficulty ?? "").map((v) => (
            <option key={v.id} value={v.id}>
              {v.partName ?? "通し"}{v.star ? ` ・ ★${v.star}` : ""}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
