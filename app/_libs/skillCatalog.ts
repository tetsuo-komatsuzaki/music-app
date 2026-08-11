// わざの軽量カタログ (2026-08-11)。クライアントからも安全にimportできる単一ソース。
// growthKarte.ts の SKILL_DEFS と id/label/lane を同期すること (フル定義はあちらが正)。
export type SkillIdLabel = { id: string; label: string; lane: "bow" | "left" }

// ── 癖の対象の拡張 (2026-08-11 Tetsuo確定) ──
// ①大分類に「曲の特徴」(リズム/音の強弱) を追加。②細目(特徴タグ)を任意で選べる。
// IDは "feat:" 接頭辞。TeacherObservation.skillIds に保存され、指摘トラッキングは
// growthKarte 側の対応表 (featureSubtaskRegex) で診断サブタスクへ解決する。
export const FEATURE_TARGETS: SkillIdLabel[] = [
  // lane は癖タグパレットの出し分け用。リズム/強弱は両手にまたがるため UI 側で両方出す
  { id: "feat_rhythm", label: "リズム", lane: "bow" },
  { id: "feat_dynamics", label: "音の強弱", lane: "bow" },
]

/** 細目 (対象を選んだときに出る任意チップ)。キー = 大分類ID */
export const SUB_TARGETS: Record<string, { id: string; label: string }[]> = {
  position: [
    { id: "feat:pos:2", label: "2nd" },
    { id: "feat:pos:3", label: "3rd" },
    { id: "feat:pos:4", label: "4th" },
    { id: "feat:pos:5p", label: "5th以上" },
  ],
  double: [
    { id: "feat:ds:3", label: "3度" },
    { id: "feat:ds:6", label: "6度" },
    { id: "feat:ds:oct", label: "オクターブ" },
    { id: "feat:ds:cont", label: "連続重音" },
    { id: "feat:ds:other", label: "その他" },
  ],
  feat_rhythm: [
    { id: "feat:rhy:8", label: "8分音符" },
    { id: "feat:rhy:16", label: "16分音符" },
    { id: "feat:rhy:dot", label: "付点" },
    { id: "feat:rhy:off", label: "裏拍開始" },
    { id: "feat:rhy:tup", label: "連符" },
    { id: "feat:rhy:sync", label: "シンコペーション" },
  ],
  feat_dynamics: [
    { id: "feat:dyn:cre", label: "クレッシェンド" },
    { id: "feat:dyn:dec", label: "デクレッシェンド" },
  ],
}

/** feat系IDの全集合 (バリデーション用) */
export const FEATURE_ID_SET: Set<string> = new Set([
  ...FEATURE_TARGETS.map((t) => t.id),
  ...Object.values(SUB_TARGETS).flat().map((s) => s.id),
])

/** feat系ID → 表示ラベル (指摘トラッキングの行ラベル用) */
export const FEATURE_ID_LABELS: Record<string, string> = Object.fromEntries([
  ...FEATURE_TARGETS.map((t) => [t.id, t.label]),
  ...Object.entries(SUB_TARGETS).flatMap(([main, subs]) => {
    const mainLabel = main === "position" ? "ポジション移動" : main === "double" ? "重音" : main === "feat_rhythm" ? "リズム" : "音の強弱"
    return subs.map((s) => [s.id, `${mainLabel}・${s.label}`])
  }),
])

/** feat系ID → 診断サブタスクIDの対応 (正規表現)。null = 自動判定の対象外 (音量系判定が未実装) */
export function featureSubtaskRegex(id: string): RegExp | null {
  switch (id) {
    case "position": return /posshift/
    case "double": return /_double_/
    case "feat:pos:2": return /posshift_(2_|\d(?:plus)?_2$)/
    case "feat:pos:3": return /posshift_(3_|\d(?:plus)?_3$)/
    case "feat:pos:4": return /posshift_(4_|\d(?:plus)?_4$)/
    case "feat:pos:5p": return /posshift_.*5plus/
    case "feat:ds:3": return /_double_third/
    case "feat:ds:6": return /_double_sixth/
    case "feat:ds:oct": return /_double_octave/
    case "feat:ds:cont": return /_double_.*_cont$/
    case "feat:ds:other": return /_double_(fourth|fifth|other)/
    case "feat_rhythm": return /(_value_|_tuplet_|_offbeat)/
    case "feat:rhy:8": return /_value_eighth/
    case "feat:rhy:16": return /_value_16th/
    case "feat:rhy:dot": return /_value_dotted/
    case "feat:rhy:off": return /_offbeat/
    case "feat:rhy:tup": return /_tuplet_/
    // シンコペーション・強弱系は対応する診断サブタスクが無い (判定中のまま。画面にも明記)
    case "feat:rhy:sync":
    case "feat_dynamics":
    case "feat:dyn:cre":
    case "feat:dyn:dec":
      return null
    default: return null
  }
}
export const SKILL_ID_LABELS: SkillIdLabel[] = [
  { id: "slur", label: "スラー", lane: "bow" },
  { id: "staccato", label: "スタッカート", lane: "bow" },
  { id: "portato", label: "ポルタート", lane: "bow" },
  { id: "bow_staccato", label: "連続スタッカート", lane: "bow" },
  { id: "tremolo", label: "トレモロ", lane: "bow" },
  { id: "pizzicato", label: "ピチカート", lane: "bow" },
  { id: "spiccato", label: "スピッカート", lane: "bow" },
  { id: "ricochet", label: "リコシェ", lane: "bow" },
  { id: "position", label: "ポジション移動", lane: "left" },
  { id: "double", label: "重音", lane: "left" },
  { id: "trill", label: "トリル", lane: "left" },
  { id: "mordent", label: "プラルトリラーとモルデント", lane: "left" },
  { id: "vibrato", label: "ビブラート", lane: "left" },
  { id: "glissando", label: "グリッサンド", lane: "left" },
  { id: "harmonic", label: "ハーモニクス", lane: "left" },
]
