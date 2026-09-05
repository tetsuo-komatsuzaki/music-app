// 旧実装の写し (comparison_result.json と musicxml_skill_info.json を直読み)。verify_fingerboard.ts が新実装との突き合わせに使う。本体からは参照しない。
// 速い指の切り替え (2026-09-02 Tetsuo確定・記録の分析ページの新項目)。
//
// 何を見るか: 「前の音から次の音までの実時間」= 指を切り替える猶予。
// この値は録音テンポを反映した秒数なので、テンポが速い場合も短い音符が続く場合も
// 1つの数字にまとまる。その帯ごとに、音程とタイミングの成功率を出す。
//
// 除外 (2026-09-02 Tetsuo確定):
//   - 開放弦 = 指を使わないので切り替えの話に入らない (skill_info の弦上位置 0)
//   - 同じ音名が続く音 = 指を替える必要がない
//
// データ源は指板ヒートマップと同じ2つ。集計は別なので aggregate.ts には混ぜない。
//   comparison_result.json … note_index / expected_start_sec / note_name / pitch_ok / start_ok
//   musicxml_skill_info.json … note_index / string_id / midi (弦上の位置を出すため)
import { prisma } from "../../app/_libs/prisma"
import { storageAdmin } from "../../app/_libs/storageAdmin"

export type SwitchBand = {
  label: string
  /** 判定できた音数 (音程) */
  notes: number
  /** 音程の成功率 (%)。判定音が MIN_NOTES 未満なら null */
  pitchPct: number | null
  /** タイミングの成功率 (%) */
  timingPct: number | null
}
export type FastSwitchData = {
  bands: SwitchBand[]
  /** 集計に使えた録音数 */
  perfCount: number
}

const MIN_NOTES = 20
const OPEN_MIDI: Record<string, number> = { G: 55, D: 62, A: 69, E: 76 }
const BANDS: { label: string; lo: number; hi: number }[] = [
  { label: "0.3秒未満", lo: 0, hi: 0.3 },
  { label: "0.3〜0.6秒", lo: 0.3, hi: 0.6 },
  { label: "0.6〜1.0秒", lo: 0.6, hi: 1.0 },
  { label: "1.0秒以上", lo: 1.0, hi: Infinity },
]

type Note = { onString: number }
type Comp = {
  note_index?: number; note_name?: string | null
  expected_start_sec?: number | null; pitch_ok?: boolean | null; start_ok?: boolean | null
}

async function downloadJson(bucket: string, path: string): Promise<unknown | null> {
  try {
    const r = await storageAdmin.storage.from(bucket).download(path)
    if (!r.data) return null
    return JSON.parse(await r.data.text())
  } catch {
    return null
  }
}

/** skill_info を「note_index → 弦上の位置」に変換。開放弦は 0 になる */
function toNotes(sj: unknown): Map<number, Note> {
  const out = new Map<number, Note>()
  const notes = (sj as { notes?: unknown[] })?.notes
  if (!Array.isArray(notes)) return out
  for (const raw of notes) {
    const nt = raw as { note_index?: number; string_id?: string | null; midi?: number | null; is_rest?: boolean }
    if (nt.note_index == null || nt.is_rest) continue
    if (!nt.string_id || !(nt.string_id in OPEN_MIDI) || nt.midi == null) continue
    out.set(nt.note_index, { onString: nt.midi - OPEN_MIDI[nt.string_id] })
  }
  return out
}

export async function buildFastSwitch(userId: string, sinceDays: number, maxPerfs = 30): Promise<FastSwitchData> {
  const since = new Date(Date.now() - sinceDays * 864e5)
  const [scorePerfs, pracPerfs] = await Promise.all([
    prisma.performance.findMany({
      where: { userId, uploadedAt: { gte: since }, comparisonResultPath: { not: null }, pitchAccuracy: { not: null } },
      orderBy: { uploadedAt: "desc" }, take: maxPerfs,
      select: { comparisonResultPath: true, scoreId: true, score: { select: { createdById: true } } },
    }),
    prisma.practicePerformance.findMany({
      where: { userId, uploadedAt: { gte: since }, comparisonResultPath: { not: null }, pitchAccuracy: { not: null } },
      orderBy: { uploadedAt: "desc" }, take: maxPerfs,
      select: { comparisonResultPath: true, practiceItemId: true },
    }),
  ])
  const refs = [
    ...scorePerfs.map((p) => ({ skillPath: `${p.score?.createdById}/${p.scoreId}/musicxml_skill_info.json`, key: `s:${p.scoreId}`, comp: p.comparisonResultPath! })),
    ...pracPerfs.map((p) => ({ skillPath: `practice/${p.practiceItemId}/musicxml_skill_info.json`, key: `p:${p.practiceItemId}`, comp: p.comparisonResultPath! })),
  ]

  const agg = BANDS.map((b) => ({ ...b, p: { n: 0, ok: 0 }, r: { n: 0, ok: 0 } }))
  const skillCache = new Map<string, Map<number, Note>>()
  let used = 0

  // 指板と同じく6並列 (直列だとDLで待たされる)
  const queue = [...refs]
  await Promise.all(Array.from({ length: 6 }, async () => {
    for (;;) {
      const ref = queue.shift()
      if (!ref) return
      let skill = skillCache.get(ref.key)
      if (!skill) {
        skill = toNotes(await downloadJson("musicxml", ref.skillPath))
        skillCache.set(ref.key, skill)
      }
      if (skill.size === 0) continue
      const cj = await downloadJson("performances", ref.comp)
      const results = ((cj as { results?: unknown })?.results ?? []) as Comp[]
      if (!results.length) continue
      used++
      const sorted = [...results].sort((a, b) => (a.note_index ?? 0) - (b.note_index ?? 0))
      for (let i = 1; i < sorted.length; i++) {
        const n = sorted[i], prev = sorted[i - 1]
        if (n.note_index == null || prev.note_index == null) continue
        if (n.note_index !== prev.note_index + 1) continue   // 休符などで切れたら比べない
        const sk = skill.get(n.note_index)
        if (!sk || sk.onString === 0) continue               // 開放弦は除く
        if (n.note_name && prev.note_name && n.note_name === prev.note_name) continue // 同音連続は除く
        if (prev.expected_start_sec == null || n.expected_start_sec == null) continue
        const gap = n.expected_start_sec - prev.expected_start_sec
        if (!(gap > 0)) continue
        const band = agg.find((b) => gap >= b.lo && gap < b.hi)
        if (!band) continue
        if (typeof n.pitch_ok === "boolean") { band.p.n++; if (n.pitch_ok) band.p.ok++ }
        if (typeof n.start_ok === "boolean") { band.r.n++; if (n.start_ok) band.r.ok++ }
      }
    }
  }))

  const pct = (b: { n: number; ok: number }) => (b.n >= MIN_NOTES ? Math.round((b.ok / b.n) * 100) : null)
  return {
    bands: agg.map((b) => ({ label: b.label, notes: b.p.n, pitchPct: pct(b.p), timingPct: pct(b.r) })),
    perfCount: used,
  }
}
