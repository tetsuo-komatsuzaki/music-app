"""
music-analyzer ライブラリパッケージ（v3.2）。

上達ループエンジンの解析パイプラインを構成するモジュール群を提供する。

v3.2 修正:
  - violin_position.py：MIDI 55-83 のまま維持（v3.1 高7 巻き戻し）
  - musicxml_skill_extractor.py：musicxml_skill_info.json として出力（Q6）
  - note_integration.py：comparison_result が flat array に対応（Phase 0.1 Task 1）、
                         is_string_change_from_prev を生成（Q7）
  - audio_volume.py：detected_start_sec を優先（致命3）、flat array に対応
  - subtask_judges.py：問題1（A 解釈）、問題4（文言）、問題6, 7（厳密化）、高5（BPM 連動）
  - skill_aggregator.py：target_count=0 を集計除外（Q5、変更なし）
  - integrated_note.py：time_signature を dict 型に変更（Phase 0.1 Task 2）
"""

from .integrated_note import (
    IntegratedNote,
    IntegratedScoreData,
    SubTaskResult,
    hz_to_midi,
    calc_duration_beats,
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
from .timing_tolerance import (
    get_timing_tolerance,
    get_rush_threshold,
    PITCH_TOLERANCE_CENTS,
    TIMING_TOLERANCE_BASE_SEC,
)
from .audio_volume import (
    calc_avg_volume_db,
    calc_volume_drop_after,
    calculate_audio_features_per_note,
    merge_audio_features_into_comparison_result,
)
from .subtask_judges import (
    is_performance_analyzable,
    run_all_judges,
    judge_pitch_overall,
    judge_pitch_high,
    judge_pitch_chromatic,
    judge_rhythm_overall,
    judge_rhythm_fast,
    judge_rhythm_after_rest,
    judge_string_change_volume,
    judge_string_change_slur,
    judge_string_change_timing,
)
from .skill_aggregator import (
    aggregate_skill_scores,
    SKILL_TASK_MAP,
)

__all__ = [
    # integrated_note
    "IntegratedNote",
    "IntegratedScoreData",
    "SubTaskResult",
    "hz_to_midi",
    "calc_duration_beats",
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
    # timing_tolerance
    "get_timing_tolerance",
    "get_rush_threshold",
    "PITCH_TOLERANCE_CENTS",
    "TIMING_TOLERANCE_BASE_SEC",
    # audio_volume
    "calc_avg_volume_db",
    "calc_volume_drop_after",
    "calculate_audio_features_per_note",
    "merge_audio_features_into_comparison_result",
    # subtask_judges
    "is_performance_analyzable",
    "run_all_judges",
    "judge_pitch_overall",
    "judge_pitch_high",
    "judge_pitch_chromatic",
    "judge_rhythm_overall",
    "judge_rhythm_fast",
    "judge_rhythm_after_rest",
    "judge_string_change_volume",
    "judge_string_change_slur",
    "judge_string_change_timing",
    # skill_aggregator
    "aggregate_skill_scores",
    "SKILL_TASK_MAP",
]
