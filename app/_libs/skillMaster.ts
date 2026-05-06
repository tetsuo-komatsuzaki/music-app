// app/_libs/skillMaster.ts
//
// v3.2.2 上達ループエンジン — マスターデータ定義 (Commit 2)。
// improvementGuide の文言は暫定。UI 設計書で書き直し前提 (§16-5)。

// =======================================================================
// 中項目 (task)
// =======================================================================

export const TASK_IDS = ["pitch", "rhythm", "bowing"] as const
export type TaskId = (typeof TASK_IDS)[number]

export const TASK_NAMES: Record<TaskId, string> = {
  pitch: "音程",
  rhythm: "リズム",
  bowing: "弦移動",
}

export const SKILL_TASKS: Record<TaskId, { id: TaskId; name: string; subTaskIds: SubTaskId[] }> = {
  pitch: {
    id: "pitch",
    name: "音程",
    subTaskIds: ["pitch_overall", "pitch_high", "pitch_chromatic"],
  },
  rhythm: {
    id: "rhythm",
    name: "リズム",
    subTaskIds: ["rhythm_overall", "rhythm_fast", "rhythm_after_rest"],
  },
  bowing: {
    id: "bowing",
    name: "弦移動",
    subTaskIds: ["string_change_volume", "string_change_slur", "string_change_timing"],
  },
}

// =======================================================================
// 小項目 (sub_task)
// =======================================================================

export const SUB_TASK_IDS = [
  "pitch_overall",
  "pitch_high",
  "pitch_chromatic",
  "rhythm_overall",
  "rhythm_fast",
  "rhythm_after_rest",
  "string_change_volume",
  "string_change_slur",
  "string_change_timing",
] as const
export type SubTaskId = (typeof SUB_TASK_IDS)[number]

export const SUB_TASK_NAMES: Record<SubTaskId, string> = {
  pitch_overall: "全体的な音程",
  pitch_high: "高音域の音程",
  pitch_chromatic: "半音階の音程",
  rhythm_overall: "全体的なリズム",
  rhythm_fast: "速い音符のリズム",
  rhythm_after_rest: "休符明けのリズム",
  string_change_volume: "弦移動時の音量",
  string_change_slur: "スラー中の弦移動",
  string_change_timing: "弦移動時のタイミング",
}

// =======================================================================
// improvementGuide 型 (§16-5)
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
// SKILL_SUB_TASKS — 9 sub task の改善ガイド (暫定文言)
// =======================================================================

export const SKILL_SUB_TASKS: Record<SubTaskId, SubTaskDef> = {
  // -------- pitch --------
  pitch_overall: {
    id: "pitch_overall",
    parentTaskId: "pitch",
    name: "全体的な音程",
    improvementGuide: {
      awareness: {
        type: "awareness",
        title: "演奏前の準備",
        description:
          "演奏前に開放弦の音をチューナーで確認しましょう。耳を慣らしてから始めると、音程の感覚が安定します。",
      },
      practice: {
        type: "practice",
        title: "ロングトーンでの音程確認",
        description: "ゆっくりとしたテンポで音程を確認する練習です。",
        durationMinutes: 5,
        steps: [
          "メトロノームを♩=60に設定する",
          "各音を4拍ずつ鳴らす",
          "チューナーで確認しながら微調整する",
        ],
      },
      etudeRecommendation: {
        type: "etude_recommendation",
        title: "Sevcik op.6 No.1〜5",
        description: "音程の基礎練習として最適な教材です。",
      },
    },
  },

  pitch_high: {
    id: "pitch_high",
    parentTaskId: "pitch",
    name: "高音域の音程",
    improvementGuide: {
      awareness: {
        type: "awareness",
        title: "ポジション移動の準備",
        description:
          "高音域に入る前に、左手のポジションをイメージしてみましょう。指の置き場所を予測しておくと音程が安定します。",
      },
      practice: {
        type: "practice",
        title: "3rd ポジションスケール",
        description: "ポジション移動を含む音階で高音域に慣れる練習です。",
        durationMinutes: 5,
        steps: [
          "メトロノームを♩=60に設定する",
          "1st から 3rd へゆっくり移動する",
          "各ポジションでチューナー確認を入れる",
        ],
      },
      etudeRecommendation: {
        type: "etude_recommendation",
        title: "Sevcik op.6 No.6〜10",
        description: "ポジション移動の練習に最適な教材です。",
      },
    },
  },

  pitch_chromatic: {
    id: "pitch_chromatic",
    parentTaskId: "pitch",
    name: "半音階の音程",
    improvementGuide: {
      awareness: {
        type: "awareness",
        title: "指の間隔を意識する",
        description:
          "半音階では指同士の間隔がとても狭くなります。隣の指に密着させる感覚を持ってみましょう。",
      },
      practice: {
        type: "practice",
        title: "1オクターブの半音階",
        description: "ゆっくりと半音階の指間隔を体で覚える練習です。",
        durationMinutes: 5,
        steps: [
          "メトロノームを♩=60に設定する",
          "各音を2拍ずつ鳴らす",
          "隣の指との距離を確認しながら弾く",
        ],
      },
      etudeRecommendation: {
        type: "etude_recommendation",
        title: "クロイツェル No.7",
        description: "半音階を含む音程練習として効果的です。",
      },
    },
  },

  // -------- rhythm --------
  rhythm_overall: {
    id: "rhythm_overall",
    parentTaskId: "rhythm",
    name: "全体的なリズム",
    improvementGuide: {
      awareness: {
        type: "awareness",
        title: "拍を心の中で歌う",
        description:
          "演奏前にメトロノームに合わせて拍を歌ってみましょう。頭の中で拍を感じてから弾くと、リズムが安定します。",
      },
      practice: {
        type: "practice",
        title: "リズム読み練習",
        description: "弓を持たずにリズムだけを取る練習です。",
        durationMinutes: 5,
        steps: [
          "メトロノームを♩=60に設定する",
          "膝を叩いて拍を取る",
          "曲の冒頭4小節をリズムだけで歌う",
        ],
      },
      etudeRecommendation: {
        type: "etude_recommendation",
        title: "クロイツェル No.2",
        description: "リズムの基礎を整えるのに最適な教材です。",
      },
    },
  },

  rhythm_fast: {
    id: "rhythm_fast",
    parentTaskId: "rhythm",
    name: "速い音符のリズム",
    improvementGuide: {
      awareness: {
        type: "awareness",
        title: "ゆっくりから始める",
        description:
          "速い音符ほどゆっくりのテンポから練習を始めると効果的です。指の動きを正確にしてから徐々に速度を上げましょう。",
      },
      practice: {
        type: "practice",
        title: "段階的テンポアップ",
        description: "テンポを少しずつ上げて速い音符に慣れる練習です。",
        durationMinutes: 8,
        steps: [
          "メトロノームを♩=80に設定する",
          "該当箇所を3回繰り返す",
          "♩=100、♩=120と段階的に上げる",
        ],
      },
      etudeRecommendation: {
        type: "etude_recommendation",
        title: "シェフチーク Op.2",
        description: "速い音符の指の独立性を養う教材です。",
      },
    },
  },

  rhythm_after_rest: {
    id: "rhythm_after_rest",
    parentTaskId: "rhythm",
    name: "休符明けのリズム",
    improvementGuide: {
      awareness: {
        type: "awareness",
        title: "休符でも拍を数える",
        description:
          "休符の間も心の中で拍を数え続けましょう。次の音の入りが正確になります。",
      },
      practice: {
        type: "practice",
        title: "休符明けアクセント練習",
        description: "休符の後の音にアクセントをつける練習です。",
        durationMinutes: 5,
        steps: [
          "メトロノームを♩=60に設定する",
          "休符を含むフレーズを選ぶ",
          "休符明けの音にアクセントをつけて弾く",
        ],
      },
      etudeRecommendation: {
        type: "etude_recommendation",
        title: "カイザー Op.20 No.4",
        description: "休符を含むフレーズの練習に向いています。",
      },
    },
  },

  // -------- bowing (string change) --------
  string_change_volume: {
    id: "string_change_volume",
    parentTaskId: "bowing",
    name: "弦移動時の音量",
    improvementGuide: {
      awareness: {
        type: "awareness",
        title: "弓圧と速度を一定に",
        description:
          "弦を変えるときに弓圧と速度が変わってしまうことがあります。両方を一定に保つ意識を持つと音量が揃います。",
      },
      practice: {
        type: "practice",
        title: "隣接弦のデタシェ",
        description: "隣り合う弦を行き来して音量を揃える練習です。",
        durationMinutes: 5,
        steps: [
          "メトロノームを♩=60に設定する",
          "A弦とD弦を交互に4拍ずつ弾く",
          "音量計や録音で同じ音量になっているか確認する",
        ],
      },
      etudeRecommendation: {
        type: "etude_recommendation",
        title: "クロイツェル No.6",
        description: "弦移動の音量コントロールに効果的な教材です。",
      },
    },
  },

  string_change_slur: {
    id: "string_change_slur",
    parentTaskId: "bowing",
    name: "スラー中の弦移動",
    improvementGuide: {
      awareness: {
        type: "awareness",
        title: "弓の動きを連続させる",
        description:
          "スラー中の弦移動は、弓の動きを途切れさせない意識が大切です。手首と肘の角度をなめらかに変えてみましょう。",
      },
      practice: {
        type: "practice",
        title: "2音スラー → 4音スラー",
        description: "スラーの音数を段階的に増やして弦移動を滑らかにする練習です。",
        durationMinutes: 5,
        steps: [
          "メトロノームを♩=60に設定する",
          "隣接弦で2音スラーを繰り返す",
          "慣れてきたら4音スラーに広げる",
        ],
      },
      etudeRecommendation: {
        type: "etude_recommendation",
        title: "カイザー Op.20 No.2",
        description: "スラー中の弦移動の基礎練習に向いています。",
      },
    },
  },

  string_change_timing: {
    id: "string_change_timing",
    parentTaskId: "bowing",
    name: "弦移動時のタイミング",
    improvementGuide: {
      awareness: {
        type: "awareness",
        title: "手首の柔軟さを意識する",
        description:
          "弦移動の瞬間が遅れがちなときは、手首の柔軟さを意識してみましょう。事前に右肘の高さを調整しておくと滑らかに移れます。",
      },
      practice: {
        type: "practice",
        title: "メトロノームに合わせた移弦",
        description: "拍ぴったりに弦を変える練習です。",
        durationMinutes: 5,
        steps: [
          "メトロノームを♩=60に設定する",
          "拍頭で隣接弦に移る",
          "録音して拍とのズレを確認する",
        ],
      },
      etudeRecommendation: {
        type: "etude_recommendation",
        title: "クロイツェル No.13",
        description: "弦移動のタイミングを整える教材です。",
      },
    },
  },
}

// =======================================================================
// グレード (§7-5, §10)
// =======================================================================

export const GRADE_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "MASTER"] as const
export type GradeLevel = (typeof GRADE_LEVELS)[number]

export const GRADE_NAMES: Record<GradeLevel, string> = {
  BEGINNER: "初級",
  INTERMEDIATE: "中級",
  ADVANCED: "上級",
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
