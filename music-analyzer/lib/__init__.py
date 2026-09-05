"""
music-analyzer ライブラリパッケージ。

構成（2026-07-11 C-6b 再編後）:
  - 診断の保存: diagnosis_store.py (collapse と milestone) ・ 明細: note_store.py (ノート属性ストア) /
    collapse_detector.py — 弱点分析・崩壊小節（達成判定の材料）
  - 判定系: achievement.py — 達成/マスター/Star/学びレッスン
  - 弓採点系: subtask_judges.py（弓23項目のみ）+ 呼び手 bowing_score.py —
    マスター判定(平均90)の bowingAccuracy の唯一の製造元
  - カルテ系: musicxml_skill_extractor.py / piece_summary.py / violin_position.py
  - 統合・音響: note_integration.py / integrated_note.py / audio_volume.py /
    timing_tolerance.py

旧55課題体系の課題化用モジュール（skill_aggregator / problematic_positions /
pitch・rhythm系judges）は 2026-07-11 に削除（217診断に置換済・git 6a35f16 以前参照）。
"""

from .integrated_note import (
    IntegratedNote,
    IntegratedScoreData,
    SubTaskResult,
    hz_to_midi,
    calculate_subtask_score_hybrid,
)
from .violin_position import (
    infer_violin_position,
    try_infer_violin_position,
    string_num_to_id,
    string_id_to_num,
    VIOLIN_FIRST_POSITION_MAP,
    FIRST_POSITION_MIDI_MIN,
    FIRST_POSITION_MIDI_MAX,
)
from .musicxml_skill_extractor import (
    SkillInfoNote,
    extract_skill_info,
    export_skill_info_json,
    run_extraction,
)
from .note_integration import (
    build_integrated_score_data,
    integrate,
)
from .audio_volume import (
    calc_avg_volume_db,
    calc_volume_drop_after,
    calculate_audio_features_per_note,
    merge_audio_features_into_comparison_result,
)
# 弓採点 (C-6b 2026-07-11: 旧55体系から bowing 23項目のみ残置)
from .subtask_judges import (
    is_performance_analyzable,
    run_bowing_judges,
    BOWING_SUB_TASK_IDS,
)

__all__ = [
    # integrated_note
    "IntegratedNote",
    "IntegratedScoreData",
    "SubTaskResult",
    "hz_to_midi",
    "calculate_subtask_score_hybrid",
    # violin_position
    "infer_violin_position",
    "try_infer_violin_position",
    "string_num_to_id",
    "string_id_to_num",
    "VIOLIN_FIRST_POSITION_MAP",
    "FIRST_POSITION_MIDI_MIN",
    "FIRST_POSITION_MIDI_MAX",
    # musicxml_skill_extractor
    "SkillInfoNote",
    "extract_skill_info",
    "export_skill_info_json",
    "run_extraction",
    # note_integration
    "build_integrated_score_data",
    "integrate",
    # audio_volume
    "calc_avg_volume_db",
    "calc_volume_drop_after",
    "calculate_audio_features_per_note",
    "merge_audio_features_into_comparison_result",
    # subtask_judges (弓採点のみ)
    "is_performance_analyzable",
    "run_bowing_judges",
    "BOWING_SUB_TASK_IDS",
]
