"use server"
// パートの追加・編集 (2026-08-25 Tetsuo確定 ・ admin専用)。
//
// パートは教材グループ (MaterialGroup.parts) 単位で持つ。曲・エチュードのどちらでも
// 「開始小節 / 終了小節 / パート名」を何個でも追加でき、付けた名前がそのまま
// 練習前シートの「パートを選ぶ」の選択肢として並ぶ。
// アップロード時にしか入れられなかった制約を解消する。
import { revalidatePath } from "next/cache"
import { Prisma } from "@/app/generated/prisma"
import { prisma } from "@/app/_libs/prisma"
import { requireAdminAction } from "@/app/_libs/requireAuth"
import { parseParts, validateParts, type Part } from "@/app/_libs/materialParts"

export type PartInput = { id?: string; name: string; startMeasure: number; endMeasure: number }

/** ダイアログ用: 対象のグループと現在のパート、小節数を返す */
export async function getPartsContext(itemId: string, kind: "practice" | "score"): Promise<
  | { ok: true; title: string; groupId: string; parts: Part[]; measureCount: number }
  | { ok: false; error: string }
> {
  const gate = await requireAdminAction()
  if (!gate.ok) return { ok: false, error: gate.error }

  const row = kind === "practice"
    ? await prisma.practiceItem.findUnique({ where: { id: itemId }, select: { id: true, title: true, groupId: true } })
    : await prisma.score.findUnique({ where: { id: itemId }, select: { id: true, title: true, groupId: true } })
  if (!row) return { ok: false, error: "見つかりません" }
  if (!row.groupId) return { ok: false, error: "教材グループが無いためパートを設定できません" }

  const g = await prisma.materialGroup.findUnique({ where: { id: row.groupId }, select: { parts: true } })
  const parts = parseParts(g?.parts ?? [])

  // 小節数は解析データから (入力の上限チェックに使う)
  let measureCount = 0
  try {
    const { createClient } = await import("@supabase/supabase-js")
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const path = kind === "practice" ? `practice/${itemId}/analysis.json` : null
    if (path) {
      const { data } = await sb.storage.from("musicxml").download(path)
      if (data) {
        const j = JSON.parse(Buffer.from(await data.arrayBuffer()).toString("utf8"))
        const nums = (j.notes ?? []).map((n: { measure_number?: number }) => n.measure_number ?? 0)
        measureCount = nums.length ? Math.max(...nums) : 0
      }
    }
  } catch { /* 取れなくても入力は可能 */ }

  return { ok: true, title: row.title, groupId: row.groupId, parts, measureCount }
}

/** パートを丸ごと保存する (追加・編集・削除をまとめて反映) */
export async function updateMaterialParts(input: {
  itemId: string
  kind: "practice" | "score"
  parts: PartInput[]
}): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  const gate = await requireAdminAction()
  if (!gate.ok) return { ok: false, error: gate.error }

  const row = input.kind === "practice"
    ? await prisma.practiceItem.findUnique({ where: { id: input.itemId }, select: { groupId: true } })
    : await prisma.score.findUnique({ where: { id: input.itemId }, select: { groupId: true } })
  if (!row?.groupId) return { ok: false, error: "教材グループが無いためパートを設定できません" }

  const normalized: Part[] = input.parts
    .map((p, i) => ({
      id: p.id?.trim() || `part-${Date.now()}-${i}`,
      name: p.name.trim().slice(0, 20),
      startMeasure: Math.trunc(p.startMeasure),
      endMeasure: Math.trunc(p.endMeasure),
      order: i,
    }))
    .filter((p) => p.name && p.startMeasure >= 1 && p.endMeasure >= p.startMeasure)

  const err = validateParts(normalized)
  if (err) return { ok: false, error: err }

  await prisma.materialGroup.update({
    where: { id: row.groupId },
    data: { parts: normalized as unknown as Prisma.InputJsonValue },
  })
  revalidatePath(`/${gate.user.supabaseUser.id}/admin/practice`)
  return { ok: true, count: normalized.length }
}
