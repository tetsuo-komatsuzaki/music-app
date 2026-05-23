// app/types/comparisonResult.ts
//
// v1.7 Phase B (2026-05-23) — comparison_result.json の中央型定義。
//
// 経緯: 重音 (ダブルストップ) / ハーモニクス対応により多 pitch 構造が必要に
//   なったため、これまで各 consumer に散らばっていた局所型を中央化する。
//
// 後方互換戦略: 既存スカラーキー (expected_pitch_hz / detected_pitch_hz /
//   pitch_cents_error / pitch_ok) は温存。Phase D 出力以降、重音時は集約規則:
//     - 全 pitch_ok=true → pitch_ok=true
//     - 全 pitch_ok=false → pitch_ok=false
//     - 部分一致 (△)    → pitch_ok=null + evaluation_status="double_stop_partial"
//   単音時は pitches[0] と同値。
//
// 新フィールド (pitches[] / harmonic_purity) は optional。Phase D/E 実装前の
// 既存 JSON も型違反にならない (forward 互換)。

/** evaluation_status の取り得る値。Phase D/E で値が追加される。 */
export type EvaluationStatus =
  // ─── 既存 (v3.2.2 / v1.5) ─────────────────────────
  | "evaluated"
  | "pitch_only"
  | "not_evaluated"
  | "not_detected"
  | "section_missing"
  // ─── v1.7 Phase D 重音 ─────────────────────────────
  /** 重音: 全 pitch OK (◯) */
  | "double_stop_full"
  /** 重音: 一部 pitch OK (△ = 改善ポイント可視化) */
  | "double_stop_partial"
  /** 重音: 全 pitch NG (×) */
  | "double_stop_miss"
  // ─── v1.7 Phase E ハーモニクス ─────────────────────
  /** ハーモニクス: 純度・音程ともに OK (◎) */
  | "harmonic_ok"
  /** ハーモニクスのつもりが普通の音色になっている (△、音程は合っている) */
  | "harmonic_normal_tone"
  /** ハーモニクス: 鳴らず (×) */
  | "harmonic_miss"
  // ─── v1.7 Phase D 候補③保険 ───────────────────────
  /** スペクトル検証不能 (信号不足等) → 判定保留、赤判定にしない。
   *  presence/SNR の発火条件具体値は Phase D 実装中に現場値決定する。 */
  | "spectral_inconclusive"

/**
 * 重音の各 pitch 評価 (v1.7 Phase D で出力開始)。
 * 単音音符でも `pitches: [{...}]` (length=1) で出力される。
 */
export type ComparisonPitch = {
  /** 期待音 (MusicXML 由来) */
  expected_pitch_hz: number
  /** 検出音 (ピーク補間後)。鳴っていなかった場合 null */
  detected_pitch_hz: number | null
  /** セント誤差 (期待音基準)。detected_pitch_hz==null の場合 null */
  pitch_cents_error: number | null
  /** 音程 OK 判定 (true=合致 / false=外れ / null=判定保留 or 未検出) */
  pitch_ok: boolean | null
  /** 当該周波数帯にエネルギーが閾値以上あったか (= その音が鳴っていたか) */
  presence_ok: boolean | null
}

/**
 * ハーモニクス純度評価 (v1.7 Phase E で is_harmonic=true ノートのみ出力)。
 * 通常音 / 重音ノートでは null。
 */
export type HarmonicPurity = {
  /** 基音卓越度 = (基音帯エネルギー) / (全体エネルギー)。
   *  高いほど純度が高い = ハーモニクスらしい音色。
   *  ◎/△/× 境界は Phase E 実装中に現場値決定する。 */
  fundamental_ratio: number
  /** 顕著な倍音本数。少ないほど純度高 (フラジオレットは基音卓越で倍音弱い)。 */
  overtone_count: number
  /** ◎=true (純度十分) / △=null (音程合うが普通の音色) / ×=false (鳴らず) */
  ok: boolean | null
}

/**
 * comparison_result.json の 1 ノート (analyze_performance.py 出力)。
 *
 * 単音時: pitches.length===1、pitch_ok 等のスカラーは pitches[0] と一致。
 * 重音時: pitches.length>=2、スカラーは集約値 (上記後方互換規則)。
 * ハーモニクス: harmonic_purity が非 null、pitches は sounding_pitch_hz と比較済。
 */
export type ComparisonResultNote = {
  note_index: number
  measure_number: number
  note_name: string

  // ─── タイミング系 (単音・重音・ハーモニクス共通) ───
  global_shift_sec: number
  current_shift_sec: number
  expected_start_sec: number
  expected_end_sec: number
  detected_start_sec: number | null
  timing_from_start_sec: number | null
  match_confidence: number | null
  start_diff_sec: number | null
  start_ok: boolean | null
  valid_frames: number
  evaluation_status: EvaluationStatus

  // ─── 後方互換スカラー pitch ─────────────────────────
  // Phase D 実装後も継続出力。単音時=pitches[0] / 重音時=集約値。
  // 既存 consumer (scoreDetail UI / analyze-weaknesses / aggregate) は無改修で動作。
  expected_pitch_hz: number
  detected_pitch_hz: number | null
  pitch_cents_error: number | null
  pitch_ok: boolean | null

  // ─── v1.7 Phase D/E 追加 (optional) ──────────────────
  /** 各 pitch の独立評価。Phase D 実装後に常時出力。 */
  pitches?: ComparisonPitch[]
  /** ハーモニクス純度。is_harmonic=true ノートのみ非 null。Phase E 実装後に出力。 */
  harmonic_purity?: HarmonicPurity | null
}

// =========================================================
// v1.7 Phase F (2026-05-23): TS consumer 用集計ヘルパー
// =========================================================
// Python (analyze_performance.py pitch_accuracy 集計) と同一ロジックを TS で
// 再現するための中央実装。各 API ルート / UI コンポーネントから利用される。

/** pitch_accuracy 等の集計対象に含める evaluation_status。
 *  spectral_inconclusive / not_detected / not_evaluated / section_missing は除外
 *  (判定保留扱い、accuracy の分母から外す = 赤判定にしない)。 */
export const EVALUATED_STATUSES: readonly EvaluationStatus[] = [
  "evaluated", "pitch_only",
  "double_stop_full", "double_stop_partial", "double_stop_miss",
  "harmonic_ok", "harmonic_normal_tone", "harmonic_miss",
] as const

/** ノートが集計対象か判定 (filter 用)。 */
export function isEvaluated(n: {
  evaluation_status?: EvaluationStatus | string | null
}): boolean {
  if (!n.evaluation_status) return false
  return (EVALUATED_STATUSES as readonly string[]).includes(n.evaluation_status)
}

/** pitch スコアを 0 / 0.5 / 1 で返す。
 *  - 重音 △ (double_stop_partial) / ハーモニクス △ (harmonic_normal_tone) = 0.5 点
 *  - pitch_ok=true = 1.0 点
 *  - それ以外 = 0.0 点
 *  Python analyze_performance.py _pitch_score() と完全に同じロジック。 */
export function pitchScore(n: {
  evaluation_status?: EvaluationStatus | string | null
  pitch_ok?: boolean | null
}): number {
  if (n.evaluation_status === "double_stop_partial" ||
      n.evaluation_status === "harmonic_normal_tone") {
    return 0.5
  }
  return n.pitch_ok === true ? 1.0 : 0.0
}
