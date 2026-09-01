// 代表教材の判定 (2026-09-01 Tetsuo確定)。
//
// 奏法別・リズム別・パート別は「別の教材」ではなく「同じ教材の選び方」。
// 一覧に並べたり件数に数えたりすると、教材1つが数十件に見えてしまう。
// 族・調・難易度・旋法・和音種別・ポジションが同じものの中で、いちばん素の1件だけを
// 代表とし、残りは練習前シートの中で選ぶ。調や難易度が違うものは別物なので両方残る。
export type RepresentativeInput = {
  id: string
  title: string
  groupId?: string | null
  keyTonic?: string | null
  keyMode?: string | null
  difficulty?: string | null
  positions?: string[]
  modeVariant?: string | null
  chordType?: string | null
  /** パート教材 (通しの一部を切り出したもの) */
  partId?: string | null
  /** 奏法変種 (第1軸) */
  articulation?: string | null
  /** リズム変種を持つ */
  hasRhythmRecipe?: boolean
  /** 音符ごとの奏法パターンを持つ */
  hasArticulationRecipe?: boolean
}

const bucketOf = (v: RepresentativeInput) => [
  v.groupId ?? `solo:${v.id}`,
  v.keyTonic ?? "", v.keyMode ?? "", v.difficulty ?? "",
  v.modeVariant ?? "", v.chordType ?? "", (v.positions ?? []).join(","),
].join("|")

/** 素なものほど小さい = 代表になる */
const plainness = (v: RepresentativeInput) =>
  (v.partId ? 8 : 0) + (v.hasRhythmRecipe ? 4 : 0) + (v.hasArticulationRecipe ? 2 : 0) + (v.articulation ? 1 : 0)

/** 代表になる教材の id 集合を返す */
export function pickRepresentatives(list: RepresentativeInput[]): Set<string> {
  const best = new Map<string, RepresentativeInput>()
  for (const v of list) {
    const k = bucketOf(v)
    const cur = best.get(k)
    if (!cur
      || plainness(v) < plainness(cur)
      || (plainness(v) === plainness(cur) && v.title.localeCompare(cur.title, "ja") < 0)) {
      best.set(k, v)
    }
  }
  return new Set([...best.values()].map((v) => v.id))
}

/** DB行 (PracticeItem / Score) から判定用の形に落とす。metadata から旋法・和音種別を拾う */
export function toRepresentativeInput(row: {
  id: string; title: string; groupId?: string | null
  keyTonic?: string | null; keyMode?: string | null; difficulty?: string | null
  positions?: string[]; metadata?: unknown; partId?: string | null; articulation?: string | null
  rhythmRecipe?: unknown; articulationRecipe?: unknown
}): RepresentativeInput {
  const md = (row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
    ? row.metadata : {}) as Record<string, unknown>
  return {
    id: row.id, title: row.title, groupId: row.groupId ?? null,
    keyTonic: row.keyTonic ?? null, keyMode: row.keyMode ?? null,
    difficulty: row.difficulty ?? null, positions: row.positions ?? [],
    modeVariant: typeof md.modeVariant === "string" ? md.modeVariant : null,
    chordType: typeof md.chordType === "string" ? md.chordType : null,
    partId: row.partId ?? null, articulation: row.articulation ?? null,
    hasRhythmRecipe: row.rhythmRecipe != null,
    hasArticulationRecipe: row.articulationRecipe != null,
  }
}
