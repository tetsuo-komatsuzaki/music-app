"""
audio_volume.py — 弦移動系判定の音響特徴計算ライブラリ（v3.2 §14-2）

設計書 v3.2 §14-2 で確定した音量フィールド計算ロジック。
music-analyzer/ の analyze_performance.py から呼び出される想定。

役割（Q3 確定）：
  「弦移動系判定の音響特徴を計算するライブラリ」
  - 小項目の判定そのものではなく、判定の前段階のデータを作る
  - bowing 系3 sub task のうち、string_change_volume と string_change_slur が依存するデータを生成
  - subtask_judges.py が読み取る comparison_result.json に音量フィールドを統合する

bowing 系 sub task（string_change_volume / string_change_slur）の判定に必要な
avg_volume_db / volume_drop_after を計算する。

このモジュールは numpy に依存する（音響解析の通常前提）。

v3.2 修正（致命3）:
  volume_drop_after の計算で next_note の検出時刻（detected_start_sec）を優先。
  期待時刻（expected_start_sec）を使うと、走り/もたりがある演奏で
  前の音の余韻を拾い、誤計測になるバグの修正。

v3.2 修正（Phase 0.1 Task 1）:
  comparison_result.json は実物では flat array で出力されている。
  merge_audio_features_into_comparison_result はラッパー構造ではなく flat array を扱う。
"""

from __future__ import annotations

from typing import Any, List, Optional

try:
    import numpy as np
except ImportError:  # numpy なし環境（テスト等）でもモジュール import 自体は通す
    np = None  # type: ignore


# ---------------------------------------------------------------------------
# 単一音符の音量計算
# ---------------------------------------------------------------------------


def calc_avg_volume_db(audio: Any, sample_rate: int, start_sec: float, end_sec: float) -> Optional[float]:
    """音符の時間範囲の平均音量（dB）を計算する。

    Args:
        audio: numpy.ndarray（モノラル波形）または互換オブジェクト
        sample_rate: サンプリングレート（Hz）
        start_sec: 音符の開始秒
        end_sec: 音符の終了秒

    Returns:
        平均音量（dB、通常 -60 〜 0 の範囲）。
        無音または範囲外なら None
    """
    if np is None:
        raise RuntimeError("numpy is required for audio volume calculation")

    if end_sec <= start_sec:
        return None

    start_sample = max(0, int(start_sec * sample_rate))
    end_sample = min(len(audio), int(end_sec * sample_rate))

    if end_sample <= start_sample:
        return None

    note_audio = audio[start_sample:end_sample]
    if len(note_audio) == 0:
        return None

    rms = float(np.sqrt(np.mean(note_audio ** 2)))
    if rms <= 0:
        return None

    return round(20.0 * float(np.log10(rms)), 1)


# ---------------------------------------------------------------------------
# 直後の音量低下量
# ---------------------------------------------------------------------------


def calc_volume_drop_after(
    audio: Any,
    sample_rate: int,
    current_avg_db: Optional[float],
    next_eval_time_sec: float,
    *,
    window_sec: float = 0.1,
) -> Optional[float]:
    """次の音符の最初の window_sec ぶんの音量と、現在の平均音量の差を返す。

    v3.2 修正（致命3）：
      引数名を next_start_sec から next_eval_time_sec に変更。
      これは「実際に評価する時刻」を意味し、呼び出し側が
      detected_start_sec（検出時刻）を渡すか expected_start_sec（期待時刻）を渡すかを
      選択できるようにする。
      呼び出し側は detected_start_sec を優先する（致命3 修正）。

    Args:
        audio: モノラル波形
        sample_rate: サンプリングレート
        current_avg_db: 現在の音符の avg_volume_db
        next_eval_time_sec: 次の音符の評価開始時刻（秒）
                          v3.2 修正：呼び出し側で detected_start_sec を優先する
        window_sec: 次の音符の評価ウィンドウ（デフォルト 100ms）

    Returns:
        音量変化量（dB、負の値=低下）。計算不能なら None
    """
    if np is None:
        raise RuntimeError("numpy is required for audio volume calculation")

    if current_avg_db is None:
        return None

    start_sample = max(0, int(next_eval_time_sec * sample_rate))
    end_sample = min(len(audio), int((next_eval_time_sec + window_sec) * sample_rate))
    if end_sample <= start_sample:
        return None

    next_audio = audio[start_sample:end_sample]
    if len(next_audio) == 0:
        return None

    next_rms = float(np.sqrt(np.mean(next_audio ** 2)))
    if next_rms <= 0:
        return None

    next_db = 20.0 * float(np.log10(next_rms))
    return round(next_db - current_avg_db, 1)


# ---------------------------------------------------------------------------
# 全音符に対する音量フィールド計算
# ---------------------------------------------------------------------------


def calculate_audio_features_per_note(
    audio: Any,
    sample_rate: int,
    note_results_notes: List[dict],
    comparison_result: Optional[List[dict]] = None,
    *,
    next_window_sec: float = 0.1,
) -> List[dict]:
    """各音符の音量特徴を計算する（v3.2 §14-2、致命3 修正）。

    v3.2 修正（致命3）:
      next_note の検出時刻（detected_start_sec）を優先する。
      comparison_result から detected_start_sec を取得し、未検出（None）なら
      expected_start_sec にフォールバック。
      これにより走り/もたりがある演奏での誤計測を回避する。

    v3.2 修正（Phase 0.1 Task 1）:
      comparison_result は flat array（list[dict]）として渡される。

    Args:
        audio: モノラル波形
        sample_rate: サンプリングレート
        note_results_notes: note_results.json の notes 配列
        comparison_result: comparison_result.json (v3.2: flat array)。
                           detected_start_sec を取得するために使う。
                           None の場合は expected_start_sec にフォールバック。
        next_window_sec: 直後音量評価のウィンドウ（秒）

    Returns:
        各音符に対応する {"avg_volume_db", "volume_drop_after"} の辞書のリスト
    """
    features: List[dict] = []

    for i, note in enumerate(note_results_notes):
        if note.get("type") == "rest":
            features.append({"avg_volume_db": None, "volume_drop_after": None})
            continue

        # 現在の音符の avg_volume_db
        # 期待時刻（楽譜時刻）を使う：これは「楽譜上のこの音符の位置で実演奏された音量」を測る
        start_sec = float(note.get("expected_start_sec", note.get("start_time_sec", 0.0)))
        end_sec = float(note.get("expected_end_sec", note.get("end_time_sec", start_sec)))
        avg_db = calc_avg_volume_db(audio, sample_rate, start_sec, end_sec)

        # 直後の音量低下量
        # v3.2 修正（致命3）：next_note の検出時刻を優先
        next_drop: Optional[float] = None
        if i + 1 < len(note_results_notes):
            next_note = note_results_notes[i + 1]
            if next_note.get("type") != "rest" and avg_db is not None:
                # 次の音符の検出時刻を取得（v3.2 致命3 修正）
                next_eval_time_sec = _get_next_eval_time(
                    next_note, comparison_result, i + 1
                )
                
                next_drop = calc_volume_drop_after(
                    audio,
                    sample_rate,
                    current_avg_db=avg_db,
                    next_eval_time_sec=next_eval_time_sec,
                    window_sec=next_window_sec,
                )

        features.append({
            "avg_volume_db": avg_db,
            "volume_drop_after": next_drop,
        })

    return features


def _get_next_eval_time(
    next_note: dict,
    comparison_result: Optional[List[dict]],
    next_index: int,
) -> float:
    """次の音符の評価時刻を取得する（v3.2 致命3 修正）。

    優先順位:
      1. comparison_result から detected_start_sec を取得（実演奏時刻、優先）
      2. note_results.json の expected_start_sec（楽譜時刻、フォールバック）
      3. note_results.json の start_time_sec（最終フォールバック）

    Args:
        next_note: note_results.json の next note dict
        comparison_result: comparison_result.json (flat array)
        next_index: next note のインデックス

    Returns:
        評価時刻（秒）
    """
    # 1. comparison_result から detected_start_sec を取得
    if comparison_result is not None and next_index < len(comparison_result):
        eval_note = comparison_result[next_index]
        if isinstance(eval_note, dict):
            detected = eval_note.get("detected_start_sec")
            if detected is not None:
                return float(detected)
    
    # 2-3. note_results からフォールバック
    return float(
        next_note.get("expected_start_sec",
                     next_note.get("start_time_sec", 0.0))
    )


def merge_audio_features_into_comparison_result(
    comparison_result: List[dict],
    audio_features: List[dict],
) -> List[dict]:
    """音量特徴を comparison_result.json にマージする（v3.2 §14-2）。

    v3.2 修正（Phase 0.1 Task 1）:
      comparison_result は flat array（list[dict]）として渡される。
      旧 spec の {"evaluatedNotes": [...]} ラッパー構造ではない。

    Args:
        comparison_result: 既存の comparison_result.json の中身（flat array）
        audio_features: calculate_audio_features_per_note の出力

    Returns:
        マージ後の comparison_result（インプレース更新版）
    """
    for i, eval_note in enumerate(comparison_result):
        if i < len(audio_features):
            eval_note["avg_volume_db"] = audio_features[i]["avg_volume_db"]
            eval_note["volume_drop_after"] = audio_features[i]["volume_drop_after"]
    return comparison_result
