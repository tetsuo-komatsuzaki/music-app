// app/_libs/skillMaster.ts
//
// 個別課題 v1 (2026-05-25) — マスターデータ定義。
// 旧 9 サブタスクは完全廃止、新 57 項目 (MVP対象、将来検討 2 を加えて 59 定義) で
// 置換 (Tetsuo 確定 2026-05-25)。中項目 ID は pitch / rhythm / bowing 維持 (① 確定)。
//
// improvementGuide 文言は暫定 (UI 設計書で書き直し前提)。

// =======================================================================
// 中項目 (task)
// =======================================================================

export const TASK_IDS = ["pitch", "rhythm", "bowing"] as const
export type TaskId = (typeof TASK_IDS)[number]

export const TASK_NAMES: Record<TaskId, string> = {
  pitch: "音程",
  rhythm: "リズム",
  bowing: "弓使い",
}

// =======================================================================
// 小項目 (sub_task) — 個別課題 v1 全 59 項目
// =======================================================================

export const SUB_TASK_IDS = [
  // ─── 音程 (18) ───
  "pitch_position_2",
  "pitch_position_3",
  "pitch_position_4",
  "pitch_position_5plus",
  "pitch_shift_up",
  "pitch_shift_down",
  "pitch_double_stop_2",
  "pitch_double_stop_3plus",
  "pitch_double_stop_continuous",
  "pitch_harmonic",
  "pitch_interval_up_2nd_plus",
  "pitch_interval_up_3rd_plus",
  "pitch_interval_down_2nd_plus",
  "pitch_interval_down_3rd_plus",
  "pitch_finger_1",
  "pitch_finger_2",
  "pitch_finger_3",
  "pitch_finger_4",
  // ─── リズム (17、うち 1 将来検討) ───
  "rhythm_value_whole",
  "rhythm_value_half",
  "rhythm_value_16th",
  "rhythm_value_32nd_plus",
  "rhythm_value_dotted",
  "rhythm_pattern_triplet",
  "rhythm_pattern_2plet_plus",
  "rhythm_entry_after_rest",
  "rhythm_technique_martele",
  "rhythm_technique_staccato",
  "rhythm_technique_spiccato",
  "rhythm_technique_ricochet",
  "rhythm_technique_tremolo",
  "rhythm_technique_portato",
  "rhythm_technique_trill",
  "rhythm_technique_arpeggio",
  "rhythm_technique_glissando",
  // ─── 弦移動 (24、うち 1 将来検討) ───
  "bowing_technique_staccato",
  "bowing_technique_hooked_staccato",
  "bowing_technique_spiccato",
  "bowing_technique_ricochet",
  "bowing_technique_pizzicato",
  "bowing_technique_tremolo",
  "bowing_technique_portato",
  "bowing_technique_trill",
  "bowing_technique_arpeggio",
  "bowing_technique_glissando",
  "bowing_technique_harmonic",
  "bowing_string_g",
  "bowing_string_d",
  "bowing_string_a",
  "bowing_string_e",
  "bowing_string_change_g_to_d",
  "bowing_string_change_d_to_g",
  "bowing_string_change_d_to_a",
  "bowing_string_change_a_to_d",
  "bowing_string_change_a_to_e",
  "bowing_string_change_e_to_a",
  "bowing_double_stop_2",
  "bowing_double_stop_3plus",
  "bowing_double_stop_continuous",
] as const
export type SubTaskId = (typeof SUB_TASK_IDS)[number]

// MVP では音声側品質判定が未実装の項目 (タグから対象音符は絞れるが判定は別タスク)。
// 表示時にバッジ等で「精査中」を示す用途。詳細は
// [[project_subtask_quality_judgment_deferred]] 参照。
export const SUB_TASKS_QUALITY_DEFERRED = new Set<SubTaskId>([
  "bowing_technique_staccato",
  "bowing_technique_hooked_staccato",
  "bowing_technique_spiccato",
  "bowing_technique_pizzicato",
  "bowing_technique_tremolo",
  "bowing_technique_portato",
  "bowing_technique_trill",
  "bowing_technique_arpeggio",
  "bowing_technique_glissando",
])

// 「将来検討」フラグ (MVP 未実装、UI で非表示)。リコシェのみ。
export const SUB_TASKS_FUTURE = new Set<SubTaskId>([
  "rhythm_technique_ricochet",
  "bowing_technique_ricochet",
])

export const SUB_TASK_NAMES: Record<SubTaskId, string> = {
  // ─── 音程 ───
  pitch_position_2: "第 2 ポジションの音程",
  pitch_position_3: "第 3 ポジションの音程",
  pitch_position_4: "第 4 ポジションの音程",
  pitch_position_5plus: "第 5 ポジション以上の音程",
  pitch_shift_up: "上へのポジション移動の音程",
  pitch_shift_down: "下へのポジション移動の音程",
  pitch_double_stop_2: "重音の音程(2音)",
  pitch_double_stop_3plus: "重音の音程(3音以上)",
  pitch_double_stop_continuous: "連続する重音の音程",
  pitch_harmonic: "ハーモニクスの音程",
  pitch_interval_up_2nd_plus: "すぐ上の音をとる(半音・全音)の音程",
  pitch_interval_up_3rd_plus: "離れた上の音をとる(3度以上)の音程",
  pitch_interval_down_2nd_plus: "すぐ下の音をとる(半音・全音)の音程",
  pitch_interval_down_3rd_plus: "離れた下の音をとる(3度以上)の音程",
  pitch_finger_1: "人差し指(1指)の音程",
  pitch_finger_2: "中指(2指)の音程",
  pitch_finger_3: "薬指(3指)の音程",
  pitch_finger_4: "小指(4指)の音程",
  // ─── リズム ───
  rhythm_value_whole: "全音符のリズム",
  rhythm_value_half: "2分音符のリズム",
  rhythm_value_16th: "16分音符のリズム",
  rhythm_value_32nd_plus: "32分音符以上のリズム",
  rhythm_value_dotted: "付点のリズム",
  rhythm_pattern_triplet: "三連符のリズム",
  rhythm_pattern_2plet_plus: "二連符以上の連符のリズム",
  rhythm_entry_after_rest: "休符後の入り",
  rhythm_technique_martele: "マルテレのリズム",
  rhythm_technique_staccato: "スタッカートのリズム",
  rhythm_technique_spiccato: "スピッカートのリズム",
  rhythm_technique_ricochet: "リコシェのリズム",
  rhythm_technique_tremolo: "トレモロのリズム",
  rhythm_technique_portato: "ポルタートのリズム",
  rhythm_technique_trill: "トリルのリズム",
  rhythm_technique_arpeggio: "アルペジオのリズム",
  rhythm_technique_glissando: "グリッサンドのリズム",
  // ─── 弦移動 ───
  bowing_technique_staccato: "スタッカートの音色",
  bowing_technique_hooked_staccato: "ハウ・スタッカートの音色",
  bowing_technique_spiccato: "スピッカートの音色",
  bowing_technique_ricochet: "リコシェの音色",
  bowing_technique_pizzicato: "ピチカートの音色",
  bowing_technique_tremolo: "トレモロの音色",
  bowing_technique_portato: "ポルタートの音色",
  bowing_technique_trill: "トリルの音色",
  bowing_technique_arpeggio: "アルペジオの音色",
  bowing_technique_glissando: "グリッサンドの音色",
  bowing_technique_harmonic: "ハーモニクスの音色",
  bowing_string_g: "G線(4弦)の音色",
  bowing_string_d: "D線(3弦)の音色",
  bowing_string_a: "A線(2弦)の音色",
  bowing_string_e: "E線(1弦)の音色",
  bowing_string_change_g_to_d: "G線→D線の移弦",
  bowing_string_change_d_to_g: "D線→G線の移弦",
  bowing_string_change_d_to_a: "D線→A線の移弦",
  bowing_string_change_a_to_d: "A線→D線の移弦",
  bowing_string_change_a_to_e: "A線→E線の移弦",
  bowing_string_change_e_to_a: "E線→A線の移弦",
  bowing_double_stop_2: "重音の音色(2音)",
  bowing_double_stop_3plus: "重音の音色(3音以上)",
  bowing_double_stop_continuous: "連続する重音の音色",
}

// =======================================================================
// 中項目 → 小項目マッピング (表示用グルーピングは別途 axis 概念で持つ)
// =======================================================================

export const SKILL_TASKS: Record<TaskId, { id: TaskId; name: string; subTaskIds: SubTaskId[] }> = {
  pitch: {
    id: "pitch",
    name: "音程",
    subTaskIds: SUB_TASK_IDS.filter((id) => id.startsWith("pitch_")) as SubTaskId[],
  },
  rhythm: {
    id: "rhythm",
    name: "リズム",
    subTaskIds: SUB_TASK_IDS.filter((id) => id.startsWith("rhythm_")) as SubTaskId[],
  },
  bowing: {
    id: "bowing",
    name: "弓使い",
    subTaskIds: SUB_TASK_IDS.filter((id) => id.startsWith("bowing_")) as SubTaskId[],
  },
}

// =======================================================================
// 軸 (axis) — 中項目内のサブグルーピング (admin UI / 表示用)
// =======================================================================

export type AxisDef = {
  id: string
  name: string
  parentTaskId: TaskId
  subTaskIds: SubTaskId[]
}

export const AXES: AxisDef[] = [
  // 音程
  { id: "pitch_position",     name: "ポジション",       parentTaskId: "pitch",
    subTaskIds: ["pitch_position_2", "pitch_position_3", "pitch_position_4", "pitch_position_5plus"] },
  { id: "pitch_shift",        name: "ポジション移動",   parentTaskId: "pitch",
    subTaskIds: ["pitch_shift_up", "pitch_shift_down"] },
  { id: "pitch_double_stop",  name: "重音",             parentTaskId: "pitch",
    subTaskIds: ["pitch_double_stop_2", "pitch_double_stop_3plus", "pitch_double_stop_continuous"] },
  { id: "pitch_technique",    name: "演奏技法",         parentTaskId: "pitch",
    subTaskIds: ["pitch_harmonic"] },
  { id: "pitch_interval",     name: "音程関係",         parentTaskId: "pitch",
    subTaskIds: ["pitch_interval_up_2nd_plus", "pitch_interval_up_3rd_plus",
                 "pitch_interval_down_2nd_plus", "pitch_interval_down_3rd_plus"] },
  { id: "pitch_finger",       name: "指使い",           parentTaskId: "pitch",
    subTaskIds: ["pitch_finger_1", "pitch_finger_2", "pitch_finger_3", "pitch_finger_4"] },
  // リズム
  { id: "rhythm_value",       name: "音価",             parentTaskId: "rhythm",
    subTaskIds: ["rhythm_value_whole", "rhythm_value_half", "rhythm_value_16th",
                 "rhythm_value_32nd_plus", "rhythm_value_dotted"] },
  { id: "rhythm_pattern",     name: "リズムパターン",   parentTaskId: "rhythm",
    subTaskIds: ["rhythm_pattern_triplet", "rhythm_pattern_2plet_plus"] },
  { id: "rhythm_entry",       name: "入り",             parentTaskId: "rhythm",
    subTaskIds: ["rhythm_entry_after_rest"] },
  { id: "rhythm_technique",   name: "演奏技法",         parentTaskId: "rhythm",
    subTaskIds: ["rhythm_technique_martele", "rhythm_technique_staccato",
                 "rhythm_technique_spiccato", "rhythm_technique_ricochet",
                 "rhythm_technique_tremolo", "rhythm_technique_portato",
                 "rhythm_technique_trill", "rhythm_technique_arpeggio",
                 "rhythm_technique_glissando"] },
  // 弦移動
  { id: "bowing_technique",   name: "演奏技法",         parentTaskId: "bowing",
    subTaskIds: ["bowing_technique_staccato", "bowing_technique_hooked_staccato",
                 "bowing_technique_spiccato", "bowing_technique_ricochet",
                 "bowing_technique_pizzicato", "bowing_technique_tremolo",
                 "bowing_technique_portato", "bowing_technique_trill",
                 "bowing_technique_arpeggio", "bowing_technique_glissando",
                 "bowing_technique_harmonic"] },
  { id: "bowing_string",      name: "弦",               parentTaskId: "bowing",
    subTaskIds: ["bowing_string_g", "bowing_string_d", "bowing_string_a", "bowing_string_e"] },
  { id: "bowing_string_change", name: "移弦",           parentTaskId: "bowing",
    subTaskIds: ["bowing_string_change_g_to_d", "bowing_string_change_d_to_g",
                 "bowing_string_change_d_to_a", "bowing_string_change_a_to_d",
                 "bowing_string_change_a_to_e", "bowing_string_change_e_to_a"] },
  { id: "bowing_double_stop", name: "重音",             parentTaskId: "bowing",
    subTaskIds: ["bowing_double_stop_2", "bowing_double_stop_3plus",
                 "bowing_double_stop_continuous"] },
]

// =======================================================================
// improvementGuide 型
// =======================================================================

export type AwarenessGuide = {
  type: "awareness"
  title: string
  description: string
}

export type PracticeGuide = {
  type: "practice"
  title: string
  description: string
  durationMinutes: number
  steps: string[]
}

export type EtudeRecommendationGuide = {
  type: "etude_recommendation"
  title: string
  description: string
}

export type ImprovementGuide = {
  awareness: AwarenessGuide
  practice: PracticeGuide
  etudeRecommendation: EtudeRecommendationGuide
}

export type SubTaskDef = {
  id: SubTaskId
  parentTaskId: TaskId
  name: string
  improvementGuide: ImprovementGuide
}

// =======================================================================
// improvementGuide 暫定文言 (UI 設計書で書き直し前提)
// =======================================================================

function makeGuide(awarenessText: string, practiceTitle: string, practiceSteps: string[]): ImprovementGuide {
  return {
    awareness: {
      type: "awareness",
      title: "意識のポイント",
      description: awarenessText,
    },
    practice: {
      type: "practice",
      title: practiceTitle,
      description: "ゆっくりとしたテンポで集中して取り組む練習です。",
      durationMinutes: 5,
      steps: practiceSteps,
    },
    etudeRecommendation: {
      type: "etude_recommendation",
      title: "教材選定中",
      description: "該当課題に最適なエチュードを別途選定します。",
    },
  }
}

// 暫定: 各サブタスクに最小限の改善ガイドを付与。本実装時に上書き予定。
export const SKILL_SUB_TASKS: Record<SubTaskId, SubTaskDef> = Object.fromEntries(
  SUB_TASK_IDS.map((id): [SubTaskId, SubTaskDef] => {
    const parentTaskId: TaskId = id.startsWith("pitch_") ? "pitch"
      : id.startsWith("rhythm_") ? "rhythm"
      : "bowing"
    return [id, {
      id,
      parentTaskId,
      name: SUB_TASK_NAMES[id],
      improvementGuide: makeGuide(
        `${SUB_TASK_NAMES[id]}を意識して、ゆっくり丁寧に演奏してみましょう。`,
        `${SUB_TASK_NAMES[id]}の基礎練習`,
        [
          "メトロノームを♩=60に設定する",
          "該当箇所を一音ずつ確認しながら演奏する",
          "うまく出来ない箇所を抜き出して繰り返し練習する",
        ],
      ),
    }]
  }),
) as Record<SubTaskId, SubTaskDef>

// =======================================================================
// グレード (§7-5, §10) — サブタスク再設計の影響範囲外、旧定義を維持
// =======================================================================

export const GRADE_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "MASTER"] as const
export type GradeLevel = (typeof GRADE_LEVELS)[number]

// UI 設計書 v3 §10-7 で確定: 人称形に統一 (「マスター」も「人」を表す名詞のため整合)
export const GRADE_NAMES: Record<GradeLevel, string> = {
  BEGINNER: "初級者",
  INTERMEDIATE: "中級者",
  ADVANCED: "上級者",
  MASTER: "マスター",
}

// difficulty は 1〜10 (Commit 1.5 で backfill 済み、Excel 1-5 を ×2 で拡張)
export const GRADE_DIFFICULTY_RANGE: Record<GradeLevel, readonly [number, number]> = {
  BEGINNER: [1, 4],
  INTERMEDIATE: [3, 7],
  ADVANCED: [6, 10],
  MASTER: [1, 10],
}

export function getDifficultyRange(grade: GradeLevel): readonly [number, number] {
  return GRADE_DIFFICULTY_RANGE[grade]
}
