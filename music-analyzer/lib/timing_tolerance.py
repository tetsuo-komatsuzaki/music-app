"""
timing_tolerance.py — BPM 連動のタイミング閾値計算（v3.2 §14-3 H3 確定）

設計書 v3.2 §14-3 で確定した BPM 連動化ロジック。
music-analyzer/ の compare_musicxml_to_recordingData.py から呼び出される。

このモジュールは：
  1. compare_recording で start_ok 判定の閾値計算に使う（既に本番実装済み）
  2. subtask_judges.judge_rhythm_fast の独自閾値計算に使う（v3.2 で導入）

状態：
  ✅ 本番稼働中（Phase 0.1 Task 8 で確認済み）
  ✅ Tetsuo 報告：「Timing tolerance: ±0.074s (target_bpm=81.0)」のログ確認

target_bpm の取得優先順位:
  1. recording_bpm（PracticePerformance.recordingBpm）
  2. 未指定時は note_results.json の bpm（譜面 BPM）
"""

from __future__ import annotations


PITCH_TOLERANCE_CENTS = 50
"""ピッチ許容範囲（セント）。設計書 v3 §14-3 で変更なし。"""

TIMING_TOLERANCE_BASE_SEC = 0.10
"""BPM 60 時の基準タイミング許容範囲（秒）。"""

TIMING_TOLERANCE_RUSH_BASE_SEC = 0.05
"""速い音符（八分音符以下）の前のめり判定基準（秒）。rhythm_fast 用。"""


def get_timing_tolerance(target_bpm: float) -> float:
    """BPM 連動のタイミング閾値を計算する（H3 確定）。

    Args:
        target_bpm: 楽譜の目標 BPM

    Returns:
        BPM に応じてスケールされた閾値（秒）

    設計書 v3.2 §14-3 の例：
        BPM 60   → 0.10 秒
        BPM 80   → 0.075 秒
        BPM 81   → 0.074 秒（Phase 0.1 Task 8 で稼働確認）
        BPM 120  → 0.05 秒
        BPM 180  → 約 0.033 秒
    """
    if target_bpm <= 0:
        # 無効値のフォールバック
        return TIMING_TOLERANCE_BASE_SEC
    return TIMING_TOLERANCE_BASE_SEC * (60.0 / target_bpm)


def get_rush_threshold(target_bpm: float) -> float:
    """速い音符の前のめり判定基準（負の符号付き、秒）。

    v3.2 利用箇所：
      subtask_judges.judge_rhythm_fast の閾値計算に使う。
      H3 と整合させて BPM 連動化（v3.1 高5 で確定、v3.2 で維持）。

    Args:
        target_bpm: 楽譜の目標 BPM

    Returns:
        前のめり閾値（秒、負の値）。これより小さい start_diff_sec を「前のめり」と判定。

    Examples:
        BPM 60   → -0.05 秒
        BPM 80   → -0.0375 秒
        BPM 120  → -0.025 秒
    """
    if target_bpm <= 0:
        return -TIMING_TOLERANCE_RUSH_BASE_SEC
    return -TIMING_TOLERANCE_RUSH_BASE_SEC * (60.0 / target_bpm)
