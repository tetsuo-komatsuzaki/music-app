"""
test_pipeline.py — 解析パイプライン全体の統合テスト（v3.2.2）

実装が動作することを保証するための最小限のスモークテスト。

実行方法：
    cd music-analyzer
    python tests/test_pipeline.py

このテストは外部依存（numpy, librosa, ファイルシステム）を使わず、
インメモリで完結するように設計されている。

v3.2.2 で追加・修正されたテスト:
  - test_integrate_wrapped_structure: Phase 0.1 Task 1 訂正（{version, warnings, results} 構造）
  - test_integrate_flat_array_compat: 旧 v3.2 flat array の互換性確認
  - test_measure_number_from_comparison: measure_number 取り込み（Q2=C）
  - test_problematic_positions_basic / _severity_sort_and_cap / _all_ok_returns_empty:
    §8「気になる箇所」生成（発見 A、score_full に組み込み）
  - end 系（detected_end_sec / end_diff_sec / end_ok）テストは削除（フィールド削除のため）

v3.2 で追加されたテスト（維持）:
  - test_pitch_overall_excludes_none_pitch_ok: 問題7
  - test_rhythm_after_rest_text_change: 問題4
  - test_string_change_volume_a_interpretation: 問題1
  - test_rhythm_fast_bpm_linked: 高5
  - test_aggregate_skill_scores_returns_none: Q5
  - test_integrate_dict_time_signature: Phase 0.1 Task 2
"""

from __future__ import annotations

import sys
from pathlib import Path

# lib をインポート可能にするため親ディレクトリを sys.path に追加
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from lib import (
    IntegratedNote,
    IntegratedScoreData,
    SubTaskResult,
    aggregate_skill_scores,
    calculate_severity,
    calculate_subtask_score_hybrid,
    extract_candidate_sub_tasks,
    generate_problematic_positions,
    group_problematic_notes,
    hz_to_midi,
    integrate,
    is_performance_analyzable,
    judge_pitch_overall,
    judge_rhythm_after_rest,
    judge_rhythm_fast,
    judge_rhythm_overall,
    judge_string_change_volume,
    run_all_judges,
    string_id_to_num,
    string_num_to_id,
    try_infer_violin_position,
)


# ---------------------------------------------------------------------------
# ユーティリティ：テスト用データ生成
# ---------------------------------------------------------------------------


def make_note(
    *,
    note_index: int = 0,
    measure_number: int = 1,  # v3.2.2: 1-indexed に変更
    expected_pitch_hz: float = 440.0,
    expected_start_sec: float = 0.0,
    expected_end_sec: float = 0.5,
    is_rest: bool = False,
    detected_start_sec: float | None = 0.0,
    pitch_ok: bool | None = True,
    start_ok: bool | None = True,
    pitch_cents_error: float | None = 0.0,
    start_diff_sec: float | None = 0.0,
    avg_volume_db: float | None = -20.0,
    volume_drop_after: float | None = 0.0,
    string_id: str | None = "A",
    finger: int | None = 0,
    is_in_slur: bool = False,
    is_string_change_from_prev: bool = False,
    is_after_rest: bool = False,
    is_inferred_position: bool = False,
) -> IntegratedNote:
    """テスト用の IntegratedNote を生成するヘルパー（v3.2.2）。
    
    v3.2.2 修正:
      - measure_index → measure_number に変更（1-indexed）
      - detected_end_sec / end_diff_sec / end_ok 引数を削除
    """
    return IntegratedNote(
        note_index=note_index,
        measure_number=measure_number,  # v3.2.2: 1-indexed
        expected_pitch_hz=expected_pitch_hz if not is_rest else 0.0,
        expected_start_sec=expected_start_sec,
        expected_end_sec=expected_end_sec,
        is_rest=is_rest,
        detected_start_sec=detected_start_sec,
        pitch_cents_error=pitch_cents_error,
        pitch_ok=pitch_ok,
        start_diff_sec=start_diff_sec,
        start_ok=start_ok,
        avg_volume_db=avg_volume_db,
        volume_drop_after=volume_drop_after,
        string_id=string_id,
        finger=finger,
        is_in_slur=is_in_slur,
        is_string_change_from_prev=is_string_change_from_prev,
        is_after_rest=is_after_rest,
        is_inferred_position=is_inferred_position,
    )


def make_data(notes: list[IntegratedNote], bpm: float = 80.0) -> IntegratedScoreData:
    """テスト用の IntegratedScoreData を生成するヘルパー。"""
    return IntegratedScoreData(
        performance_id="perf_test",
        user_id="user_test",
        practice_item_id="item_test",
        practice_item_difficulty=3,
        notes=notes,
        bpm=bpm,
        time_signature={"numerator": 4, "denominator": 4},
        skill_sub_task_tags=[],
    )


# ---------------------------------------------------------------------------
# 基本機能テスト
# ---------------------------------------------------------------------------


def test_hz_to_midi():
    """hz_to_midi が正しく変換することを確認。"""
    assert hz_to_midi(440.0) == 69, "A4 = MIDI 69"
    assert hz_to_midi(261.63) == 60, "C4 = MIDI 60"
    print("✅ test_hz_to_midi")


def test_string_num_to_id():
    """弦番号 ⇔ 弦ID 変換。"""
    assert string_num_to_id("1") == "E"
    assert string_num_to_id("2") == "A"
    assert string_num_to_id("3") == "D"
    assert string_num_to_id("4") == "G"
    assert string_id_to_num("E") == "1"
    assert string_id_to_num("A") == "2"
    print("✅ test_string_num_to_id")


def test_try_infer_violin_position():
    """ファーストポジション推定（範囲内 + 範囲外）。"""
    assert try_infer_violin_position(69) == ("A", 0), "MIDI 69 = A4 開放"
    assert try_infer_violin_position(76) == ("E", 0), "MIDI 76 = E5 開放"
    assert try_infer_violin_position(83) == ("E", 4), "MIDI 83 = B5 4指"
    assert try_infer_violin_position(84) is None, "MIDI 84 は範囲外"
    assert try_infer_violin_position(54) is None, "MIDI 54 は範囲外"
    print("✅ test_try_infer_violin_position")


def test_calculate_subtask_score_hybrid():
    """ハイブリッドスコア計算。"""
    notes = [make_note(pitch_ok=True), make_note(pitch_ok=True), make_note(pitch_ok=False)]
    is_bad = lambda n: n.pitch_ok is False
    score, target, bad = calculate_subtask_score_hybrid(notes, is_bad)
    assert target == 3
    assert bad == 1
    assert abs(score - (100.0 - (1/3) * 100.0)) < 0.01
    
    score, target, bad = calculate_subtask_score_hybrid([], is_bad)
    assert target == 0
    assert score == 100.0
    print("✅ test_calculate_subtask_score_hybrid")


def test_is_performance_analyzable():
    """A1：検出割合 < 50% フィルタ。"""
    notes_high = [make_note(detected_start_sec=0.0)] * 8 + [make_note(detected_start_sec=None)] * 2
    data_high = make_data(notes_high)
    assert is_performance_analyzable(data_high) is True
    
    notes_low = [make_note(detected_start_sec=0.0)] * 3 + [make_note(detected_start_sec=None)] * 7
    data_low = make_data(notes_low)
    assert is_performance_analyzable(data_low) is False
    print("✅ test_is_performance_analyzable")


# ---------------------------------------------------------------------------
# v3.2 新規テスト：問題7（target_count から判定不能を除外）
# ---------------------------------------------------------------------------


def test_pitch_overall_excludes_none_pitch_ok():
    """v3.2 問題7：pitch_ok=None の音符は target_count から除外される。"""
    notes = [
        make_note(pitch_ok=True),
        make_note(pitch_ok=False),
        make_note(pitch_ok=None),
    ]
    data = make_data(notes)
    result = judge_pitch_overall(data)
    
    assert result.target_count == 2, f"Expected 2, got {result.target_count}"
    assert result.bad_count == 1
    assert abs(result.score - 50.0) < 0.01
    print("✅ test_pitch_overall_excludes_none_pitch_ok (問題7)")


# ---------------------------------------------------------------------------
# v3.2 新規テスト：問題4（rhythm_after_rest 文言変更）
# ---------------------------------------------------------------------------


def test_rhythm_after_rest_text_change():
    """v3.2 問題4：文言が「タイミングがずれる傾向」になっている。"""
    notes = [
        make_note(is_after_rest=True, start_ok=False, start_diff_sec=0.15)
        for _ in range(4)
    ]
    data = make_data(notes)
    result = judge_rhythm_after_rest(data)
    
    assert result.matched is True
    assert "タイミングがずれる" in (result.details or "")
    assert "ずれ大" in (result.details_with_count or "")
    print("✅ test_rhythm_after_rest_text_change (問題4)")


# ---------------------------------------------------------------------------
# v3.2 新規テスト：問題1（string_change_volume A 解釈）
# ---------------------------------------------------------------------------


def test_string_change_volume_a_interpretation():
    """v3.2 問題1：弦移動の瞬間（n-1 → n）で音抜けを判定（A 解釈）。"""
    notes = [
        make_note(
            note_index=0,
            string_id="A",
            volume_drop_after=-5.0,
            is_string_change_from_prev=False,
        ),
        make_note(
            note_index=1,
            string_id="D",
            volume_drop_after=0.0,
            is_string_change_from_prev=True,
        ),
    ]
    data = make_data(notes)
    result = judge_string_change_volume(data)
    
    assert result.target_count == 1, f"Expected 1, got {result.target_count}"
    assert result.bad_count == 1, "n-1 の volume_drop_after が -3.0 未満なので bad"
    print("✅ test_string_change_volume_a_interpretation (問題1)")


# ---------------------------------------------------------------------------
# v3.2 新規テスト：高5（rhythm_fast の BPM 連動化）
# ---------------------------------------------------------------------------


def test_rhythm_fast_bpm_linked():
    """v3.2 高5：rhythm_fast の閾値が BPM 連動になっている。"""
    notes = [
        make_note(
            note_index=i,
            expected_start_sec=i * 0.5,
            expected_end_sec=i * 0.5 + 0.25,
            start_diff_sec=-0.04,
            start_ok=True,
        )
        for i in range(4)
    ]
    
    data_bpm_60 = make_data(notes, bpm=60.0)
    result_60 = judge_rhythm_fast(data_bpm_60)
    assert result_60.bad_count == 0, f"BPM 60 では bad ではない: bad={result_60.bad_count}"
    
    data_bpm_120 = make_data(notes, bpm=120.0)
    result_120 = judge_rhythm_fast(data_bpm_120)
    assert result_120.bad_count == 4, f"BPM 120 では全 bad: bad={result_120.bad_count}"
    
    print("✅ test_rhythm_fast_bpm_linked (高5)")


# ---------------------------------------------------------------------------
# v3.2 新規テスト：Q5（aggregate_skill_scores の集計除外）
# ---------------------------------------------------------------------------


def test_aggregate_skill_scores_returns_none():
    """v3.2 Q5：全配下が target_count=0 の中項目は None を返す。"""
    sub_results = {
        "pitch_overall": SubTaskResult(
            sub_task_id="pitch_overall", score=80.0, matched=False,
            sample_size=10, target_count=10, bad_count=2,
        ),
        "pitch_high": SubTaskResult(
            sub_task_id="pitch_high", score=100.0, matched=False,
            sample_size=0, target_count=0, bad_count=0,
        ),
        "pitch_chromatic": SubTaskResult(
            sub_task_id="pitch_chromatic", score=100.0, matched=False,
            sample_size=0, target_count=0, bad_count=0,
        ),
        "rhythm_overall": SubTaskResult(
            sub_task_id="rhythm_overall", score=85.0, matched=False,
            sample_size=10, target_count=10, bad_count=1,
        ),
        "rhythm_fast": SubTaskResult(
            sub_task_id="rhythm_fast", score=100.0, matched=False,
            sample_size=0, target_count=0, bad_count=0,
        ),
        "rhythm_after_rest": SubTaskResult(
            sub_task_id="rhythm_after_rest", score=100.0, matched=False,
            sample_size=0, target_count=0, bad_count=0,
        ),
        "string_change_volume": SubTaskResult(
            sub_task_id="string_change_volume", score=100.0, matched=False,
            sample_size=0, target_count=0, bad_count=0,
        ),
        "string_change_slur": SubTaskResult(
            sub_task_id="string_change_slur", score=100.0, matched=False,
            sample_size=0, target_count=0, bad_count=0,
        ),
        "string_change_timing": SubTaskResult(
            sub_task_id="string_change_timing", score=100.0, matched=False,
            sample_size=0, target_count=0, bad_count=0,
        ),
    }
    
    skill_scores = aggregate_skill_scores(sub_results)
    
    assert skill_scores["pitch"] == 80.0
    assert skill_scores["rhythm"] == 85.0
    assert skill_scores["bowing"] is None
    
    print("✅ test_aggregate_skill_scores_returns_none (Q5)")


# ---------------------------------------------------------------------------
# v3.2.2 新規テスト：Phase 0.1 Task 1 訂正（ラッパー構造）
# ---------------------------------------------------------------------------


def test_integrate_wrapped_structure():
    """v3.2.2 Phase 0.1 Task 1 訂正：comparison_result が {version, warnings, results} 構造。"""
    # v3.2.2 正規形式（実物に合わせる）
    comparison_wrapped = {
        "version": "3.0",
        "warnings": [],
        "results": [
            {
                "note_index": 0,
                "measure_number": 1,            # v3.2.2: 取り込む
                "note_name": "C4",              # 取り込まない（IntegratedNote にはない）
                "expected_start_sec": 0.0,
                "expected_end_sec": 0.5,
                "expected_pitch_hz": 261.63,
                "detected_start_sec": 0.0,
                "detected_pitch_hz": 261.0,     # 取り込まない
                "pitch_cents_error": 5.0,
                "pitch_ok": True,
                "start_diff_sec": 0.01,
                "start_ok": True,
                "valid_frames": 79,             # 取り込まない
                "evaluation_status": "evaluated",  # 取り込まない
                "match_confidence": "medium",   # 取り込まない
                "avg_volume_db": -20.0,
                "volume_drop_after": 0.0,
            }
        ]
    }
    
    note_results = {
        "bpm": 80.0,
        "time_signature": {"numerator": 4, "denominator": 4},
        "notes": [
            {
                "type": "note",
                "expected_start_sec": 0.0,
                "expected_end_sec": 0.5,
                "expected_pitch_hz": 261.63,
                "measure": 0,  # 0-indexed、フォールバック用
            }
        ],
    }
    
    skill_info = {
        "version": 1,
        "notes": [
            {
                "note_index": 0,
                "measure_index": 0,
                "is_rest": False,
                "string_id": "A",
                "finger": 0,
                "is_in_slur": False,
                "is_after_rest": False,
                "is_inferred_position": False,
            }
        ],
    }
    
    data = integrate(
        comparison_result=comparison_wrapped,
        note_results=note_results,
        musicxml_skill_info=skill_info,
        performance_id="perf_test",
        user_id="user_test",
        practice_item_id="item_test",
        practice_item_difficulty=3,
        skill_sub_task_tags=[],
    )
    
    assert len(data.notes) == 1
    assert data.notes[0].pitch_ok is True
    assert data.notes[0].avg_volume_db == -20.0
    assert data.notes[0].string_id == "A"
    # v3.2.2: measure_number は comparison_result から取得（1-indexed）
    assert data.notes[0].measure_number == 1, f"Expected 1, got {data.notes[0].measure_number}"
    print("✅ test_integrate_wrapped_structure (Phase 0.1 Task 1 訂正)")


# ---------------------------------------------------------------------------
# v3.2.2 新規テスト：旧 flat array の互換性確認
# ---------------------------------------------------------------------------


def test_integrate_flat_array_compat():
    """v3.2.2: 旧 v3.2 flat array 形式の互換性確認（保険）。"""
    # 旧 v3.2 flat array 形式
    comparison_flat = [
        {
            "note_index": 0,
            "expected_start_sec": 0.0,
            "expected_end_sec": 0.5,
            "expected_pitch_hz": 440.0,
            "detected_start_sec": 0.0,
            "pitch_cents_error": 5.0,
            "pitch_ok": True,
            "start_diff_sec": 0.01,
            "start_ok": True,
            "avg_volume_db": -20.0,
            "volume_drop_after": 0.0,
        }
    ]
    
    note_results = {
        "bpm": 80.0,
        "time_signature": {"numerator": 4, "denominator": 4},
        "notes": [
            {
                "type": "note",
                "expected_start_sec": 0.0,
                "expected_end_sec": 0.5,
                "expected_pitch_hz": 440.0,
                "measure": 2,  # 0-indexed
            }
        ],
    }
    
    skill_info = {"version": 1, "notes": []}
    
    data = integrate(
        comparison_result=comparison_flat,
        note_results=note_results,
        musicxml_skill_info=skill_info,
        performance_id="perf_test",
        user_id="user_test",
        practice_item_id="item_test",
        practice_item_difficulty=3,
        skill_sub_task_tags=[],
    )
    
    # flat array でも動く（互換性確保）
    assert len(data.notes) == 1
    assert data.notes[0].pitch_ok is True
    # comparison_result に measure_number がない場合のフォールバック：
    # note_results.measure (2, 0-indexed) → +1 = 3 (1-indexed)
    assert data.notes[0].measure_number == 3, f"Expected 3 (fallback), got {data.notes[0].measure_number}"
    print("✅ test_integrate_flat_array_compat (旧形式互換)")


# ---------------------------------------------------------------------------
# v3.2.2 新規テスト：measure_number 取り込み（Q2=C）
# ---------------------------------------------------------------------------


def test_measure_number_from_comparison():
    """v3.2.2 Q2=C：measure_number は comparison_result から優先取得。"""
    comparison_wrapped = {
        "version": "3.0",
        "warnings": [],
        "results": [
            {
                "note_index": 0,
                "measure_number": 5,  # comparison_result の値（1-indexed）
                "expected_start_sec": 0.0,
                "expected_end_sec": 0.5,
                "expected_pitch_hz": 261.63,
                "detected_start_sec": 0.0,
                "pitch_cents_error": 0.0,
                "pitch_ok": True,
                "start_diff_sec": 0.0,
                "start_ok": True,
            }
        ]
    }
    
    note_results = {
        "bpm": 80.0,
        "time_signature": {"numerator": 4, "denominator": 4},
        "notes": [
            {
                "type": "note",
                "expected_start_sec": 0.0,
                "expected_end_sec": 0.5,
                "expected_pitch_hz": 261.63,
                "measure": 99,  # 異なる値（comparison_result が優先されることを確認）
            }
        ],
    }
    
    data = integrate(
        comparison_result=comparison_wrapped,
        note_results=note_results,
        musicxml_skill_info={"version": 1, "notes": []},
        performance_id="perf_test",
        user_id="user_test",
        practice_item_id="item_test",
        practice_item_difficulty=3,
        skill_sub_task_tags=[],
    )
    
    # comparison_result の measure_number = 5 が優先される
    assert data.notes[0].measure_number == 5, f"Expected 5, got {data.notes[0].measure_number}"
    print("✅ test_measure_number_from_comparison (Q2=C)")


# ---------------------------------------------------------------------------
# v3.2 新規テスト：Phase 0.1 Task 2（time_signature が dict）
# ---------------------------------------------------------------------------


def test_integrate_dict_time_signature():
    """v3.2 Phase 0.1 Task 2：time_signature が dict 型として保持される。"""
    note_results = {
        "bpm": 80.0,
        "time_signature": {"numerator": 3, "denominator": 4},
        "notes": [],
    }
    
    data = integrate(
        comparison_result={"version": "3.0", "warnings": [], "results": []},
        note_results=note_results,
        musicxml_skill_info={"version": 1, "notes": []},
        performance_id="perf_test",
        user_id="user_test",
        practice_item_id="item_test",
        practice_item_difficulty=3,
        skill_sub_task_tags=[],
    )
    
    assert isinstance(data.time_signature, dict)
    assert data.time_signature["numerator"] == 3
    assert data.time_signature["denominator"] == 4
    
    # 旧形式（文字列）の互換性テスト
    note_results_old = {
        "bpm": 80.0,
        "time_signature": "6/8",
        "notes": [],
    }
    
    data_old = integrate(
        comparison_result={"version": "3.0", "warnings": [], "results": []},
        note_results=note_results_old,
        musicxml_skill_info={"version": 1, "notes": []},
        performance_id="perf_test",
        user_id="user_test",
        practice_item_id="item_test",
        practice_item_difficulty=3,
        skill_sub_task_tags=[],
    )
    
    assert isinstance(data_old.time_signature, dict)
    assert data_old.time_signature["numerator"] == 6
    assert data_old.time_signature["denominator"] == 8
    print("✅ test_integrate_dict_time_signature (Phase 0.1 Task 2)")


# ---------------------------------------------------------------------------
# v3.2.2 新規テスト：「気になる箇所」生成（§8、発見 A）
# ---------------------------------------------------------------------------


def test_problematic_positions_basic():
    """v3.2.2 §8：連続 NG 音符が 1 グループにまとめられ、severity と候補が付く。"""
    notes = [
        make_note(note_index=0, measure_number=1, pitch_ok=True, start_ok=True),
        # 連続 NG (赤2 + 黄1)、すべて高音域 + ピッチエラー → pitch_high 候補
        make_note(
            note_index=1, measure_number=1,
            expected_pitch_hz=659.26,  # E5 (MIDI 76、高音域)
            pitch_ok=False, start_ok=False,
        ),
        make_note(
            note_index=2, measure_number=2,
            expected_pitch_hz=783.99,  # G5
            pitch_ok=False, start_ok=False,
        ),
        make_note(
            note_index=3, measure_number=2,
            expected_pitch_hz=880.00,  # A5
            pitch_ok=False, start_ok=True,  # 黄
        ),
        make_note(note_index=4, measure_number=3, pitch_ok=True, start_ok=True),
    ]
    data = make_data(notes)
    positions = generate_problematic_positions(data)

    assert len(positions) == 1, f"Expected 1 position, got {len(positions)}"
    p = positions[0]
    assert p["measure_start"] == 1
    assert p["measure_end"] == 2
    assert p["note_indices"] == [1, 2, 3]
    assert "pitch_high" in p["candidate_sub_task_ids"]
    assert 0.0 < p["severity"] <= 1.0
    assert "high_pitch" in p["features"]
    print("✅ test_problematic_positions_basic (§8 基本)")


def test_problematic_positions_severity_sort_and_cap():
    """v3.2.2 §8：6 つ以上のグループが severity 降順でソートされ、上位 5 件まで返る。"""
    notes: list[IntegratedNote] = []
    # 6 グループを作る：OK 音 1 + NG 音 N + OK 音 1 ... を繰り返す
    # 各グループの NG 音数で severity に差をつける
    idx = 0
    for group_id in range(6):
        # OK separator
        notes.append(make_note(note_index=idx, pitch_ok=True, start_ok=True))
        idx += 1
        # NG group: 全て赤、サイズは group_id + 1（1〜6 個）
        for _ in range(group_id + 1):
            notes.append(make_note(
                note_index=idx,
                expected_pitch_hz=440.0,
                pitch_ok=False, start_ok=False,
            ))
            idx += 1
    notes.append(make_note(note_index=idx, pitch_ok=True, start_ok=True))

    data = make_data(notes)
    positions = generate_problematic_positions(data)

    assert len(positions) == 5, f"Expected 5 (cap), got {len(positions)}"
    severities = [p["severity"] for p in positions]
    assert severities == sorted(severities, reverse=True), f"Not sorted desc: {severities}"
    print("✅ test_problematic_positions_severity_sort_and_cap (§8 sort + cap)")


def test_problematic_positions_all_ok_returns_empty():
    """v3.2.2 §8：全音符 OK / 休符 / 未検出のみの場合、空配列を返す。"""
    notes = [
        make_note(note_index=0, pitch_ok=True, start_ok=True),
        make_note(note_index=1, is_rest=True),
        make_note(note_index=2, pitch_ok=True, start_ok=True),
        make_note(note_index=3, detected_start_sec=None, pitch_ok=None, start_ok=None),
    ]
    data = make_data(notes)
    positions = generate_problematic_positions(data)
    assert positions == [], f"Expected empty, got {positions}"

    # 内部関数の単体検証
    assert calculate_severity([]) == 0.0
    assert group_problematic_notes(notes) == []
    assert extract_candidate_sub_tasks([]) == []
    print("✅ test_problematic_positions_all_ok_returns_empty (§8 空ケース)")


# ---------------------------------------------------------------------------
# 全 sub task 実行テスト
# ---------------------------------------------------------------------------


def test_run_all_judges():
    """run_all_judges が9個すべての sub task を実行することを確認。"""
    notes = [make_note(note_index=i) for i in range(10)]
    data = make_data(notes)
    
    results = run_all_judges(data)
    
    expected_keys = {
        "pitch_overall", "pitch_high", "pitch_chromatic",
        "rhythm_overall", "rhythm_fast", "rhythm_after_rest",
        "string_change_volume", "string_change_slur", "string_change_timing",
    }
    assert set(results.keys()) == expected_keys
    print("✅ test_run_all_judges")


# ---------------------------------------------------------------------------
# main: テストランナー
# ---------------------------------------------------------------------------


def main():
    """全テストを実行。"""
    print("=" * 60)
    print("test_pipeline.py - v3.2.2 統合テスト")
    print("=" * 60)
    
    # 基本機能
    test_hz_to_midi()
    test_string_num_to_id()
    test_try_infer_violin_position()
    test_calculate_subtask_score_hybrid()
    test_is_performance_analyzable()
    
    # v3.2 新規テスト
    test_pitch_overall_excludes_none_pitch_ok()
    test_rhythm_after_rest_text_change()
    test_string_change_volume_a_interpretation()
    test_rhythm_fast_bpm_linked()
    test_aggregate_skill_scores_returns_none()
    test_integrate_dict_time_signature()
    
    # v3.2.2 新規テスト（Phase 0.1 Task 1 訂正）
    test_integrate_wrapped_structure()
    test_integrate_flat_array_compat()
    test_measure_number_from_comparison()

    # v3.2.2 新規テスト（§8 problematicPositions、発見 A）
    test_problematic_positions_basic()
    test_problematic_positions_severity_sort_and_cap()
    test_problematic_positions_all_ok_returns_empty()

    # 全 sub task 実行
    test_run_all_judges()

    print("=" * 60)
    print("✅ All tests passed (18 ケース)")
    print("=" * 60)


if __name__ == "__main__":
    main()
