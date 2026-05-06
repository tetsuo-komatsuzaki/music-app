"""
problematic_positions.py — 「気になる箇所」生成（v3.2.2 §8）

設計書 v3.2 §8 に基づき、IntegratedScoreData から最大 5 箇所の
「気になる箇所」を抽出する。score_full.py から呼ばれる。

連続する NG 音符（赤 = pitch_ok=False かつ start_ok=False、
黄 = どちらか片方 NG）をグループ化し、severity 順に上位 5 箇所を返す。

v3.2.2 修正:
  - measure_index → measure_number（1-indexed、IntegratedNote と整合）
  - data.beats_per_measure は存在しないため data.time_signature["numerator"] を使用
"""

from __future__ import annotations

from typing import List

from .integrated_note import (
    IntegratedNote,
    IntegratedScoreData,
    SubTaskResult,
    calc_duration_beats,
)


HIGH_PITCH_MIDI_THRESHOLD = 76  # E5 以上を高音域とみなす（§8-4 spec 通り）
PITCH_ERROR_RATIO = 0.5  # グループ内で半数超が pitch_ok=False のとき pitch error 多
TIMING_ERROR_RATIO = 0.5  # 同 start_ok=False
MAX_POSITIONS = 5  # 出力数の上限
MAX_CANDIDATES = 3  # candidate_sub_task_ids の上限


# ---------------------------------------------------------------------------
# severity（§8-2）
# ---------------------------------------------------------------------------


def calculate_severity(notes: List[IntegratedNote]) -> float:
    """箇所の重要度を計算（0〜1）。赤 = 1.0、黄 = 0.5 重み。"""
    if not notes:
        return 0.0
    red_count = sum(
        1 for n in notes
        if n.pitch_ok is False and n.start_ok is False
    )
    yellow_count = sum(
        1 for n in notes
        if (n.pitch_ok is False and n.start_ok is True)
        or (n.pitch_ok is True and n.start_ok is False)
    )
    severity_raw = (red_count * 1.0 + yellow_count * 0.5) / len(notes)
    return round(min(severity_raw, 1.0), 2)


# ---------------------------------------------------------------------------
# グループ化（§8-3）
# ---------------------------------------------------------------------------


def group_problematic_notes(
    notes: List[IntegratedNote],
) -> List[List[IntegratedNote]]:
    """連続する NG 音符をグループ化。

    休符・未検出音符はグループを区切るのみ（自身は含めない）。
    OK 音符が間に挟まったらグループを切る。
    """
    groups: List[List[IntegratedNote]] = []
    current: List[IntegratedNote] = []
    for n in notes:
        if n.is_rest or not n.is_detected:
            if current:
                groups.append(current)
                current = []
            continue
        is_ng = (n.pitch_ok is False) or (n.start_ok is False)
        if is_ng:
            current.append(n)
        else:
            if current:
                groups.append(current)
                current = []
    if current:
        groups.append(current)
    return groups


# ---------------------------------------------------------------------------
# 候補小項目（§8-4）
# ---------------------------------------------------------------------------


def extract_candidate_sub_tasks(group: List[IntegratedNote]) -> List[str]:
    """箇所の特徴から候補 sub_task を抽出（最大 3 個、優先度順）。"""
    has_string_change = any(n.is_string_change_from_prev for n in group)
    has_slur = any(n.is_in_slur for n in group)
    has_high_pitch = any(
        n.expected_pitch_midi is not None and n.expected_pitch_midi >= HIGH_PITCH_MIDI_THRESHOLD
        for n in group
    )
    has_after_rest = any(n.is_after_rest for n in group)

    pitch_errors = sum(1 for n in group if n.pitch_ok is False)
    has_pitch_error = pitch_errors > len(group) * PITCH_ERROR_RATIO

    timing_errors = sum(1 for n in group if n.start_ok is False)
    has_timing_error = timing_errors > len(group) * TIMING_ERROR_RATIO

    candidates: List[tuple[str, float]] = []
    if has_string_change and has_slur:
        candidates.append(("string_change_slur", 0.9))
    if has_string_change and has_pitch_error:
        candidates.append(("string_change_volume", 0.8))
    if has_string_change and has_timing_error:
        candidates.append(("string_change_timing", 0.7))
    if has_high_pitch and has_pitch_error:
        candidates.append(("pitch_high", 0.8))
    if has_after_rest and has_timing_error:
        candidates.append(("rhythm_after_rest", 0.7))
    if has_pitch_error and not has_string_change:
        candidates.append(("pitch_overall", 0.6))
    if has_timing_error and not has_string_change:
        candidates.append(("rhythm_overall", 0.6))

    candidates.sort(key=lambda x: x[1], reverse=True)
    return [sub_task_id for sub_task_id, _ in candidates[:MAX_CANDIDATES]]


# ---------------------------------------------------------------------------
# 全体生成（§8-5）
# ---------------------------------------------------------------------------


def _features(group: List[IntegratedNote]) -> List[str]:
    f: List[str] = []
    if any(n.is_string_change_from_prev for n in group):
        f.append("string_change")
    if any(n.is_in_slur for n in group):
        f.append("in_slur")
    if any(n.is_after_rest for n in group):
        f.append("after_rest")
    if any(
        n.expected_pitch_midi is not None and n.expected_pitch_midi >= HIGH_PITCH_MIDI_THRESHOLD
        for n in group
    ):
        f.append("high_pitch")
    return f


def generate_problematic_positions(
    data: IntegratedScoreData,
    sub_task_results: dict[str, SubTaskResult] | None = None,
) -> List[dict]:
    """「気になる箇所」を生成（最大 5 箇所、severity 降順）。

    Args:
        data: 統合済み演奏データ
        sub_task_results: SubTaskResult の辞書（v3.2 spec のシグネチャ互換のため
            受け取るが、現時点では参照しない。将来 candidate 抽出を
            sub_task の matched 状態で絞り込む拡張余地）

    Returns:
        problematicPositions（dict のリスト）。score_full の result.json に格納。
    """
    _ = sub_task_results  # 互換のため受け取る（将来用）

    groups = group_problematic_notes(data.notes)
    beats_per_measure = data.time_signature.get("numerator", 4)

    positions: List[dict] = []
    for i, group in enumerate(groups):
        if not group:
            continue
        candidates = extract_candidate_sub_tasks(group)
        if not candidates:
            continue  # 候補がない箇所はスキップ

        first = group[0]
        last = group[-1]
        severity = calculate_severity(group)

        beat_start = (
            calc_duration_beats(0.0, first.expected_start_sec, data.bpm)
            % beats_per_measure
        )
        beat_end = (
            calc_duration_beats(0.0, last.expected_end_sec, data.bpm)
            % beats_per_measure
        )

        positions.append({
            "position_id": f"pos_{i + 1:03d}",
            "measure_start": first.measure_number,
            "beat_start": round(beat_start, 3),
            "measure_end": last.measure_number,
            "beat_end": round(beat_end, 3),
            "note_indices": [n.note_index for n in group],
            "candidate_sub_task_ids": candidates,
            "severity": severity,
            "features": _features(group),
        })

    positions.sort(key=lambda p: p["severity"], reverse=True)
    return positions[:MAX_POSITIONS]
