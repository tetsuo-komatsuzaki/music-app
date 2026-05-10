"""
note_integration.py — 4 つの JSON を統合して IntegratedScoreData を構築する（v3.2.2）

これが解析パイプライン全体の中核処理。

v3.2.2 修正（2026-05-06、Phase 0.1 Task 1 結論訂正）:
  - comparison_result.json は **{version, warnings, results} ラッパー構造**
    （実物検証済み、サンプル comparison_result.json の version="3.0"）
    旧 v3.2 spec：flat array（誤り）
    新 v3.2.2 spec：{"version", "warnings", "results"} の dict
  - 実物は 18 フィールド（設計書 v3.2 想定の 13 フィールドより多い）
  - end 系フィールド削除：detected_end_sec / end_diff_sec / end_ok（実物に存在しない）
  - measure_index（0-indexed）→ measure_number（1-indexed）に統一
    （実物 comparison_result.json から取得可能）

v3.2 修正（維持）:
  - Phase 0.1 Task 2：note_results.json の time_signature は dict 型
  - Q6 確定：musicxml_skill_info.json は別ファイル
  - Q7 確定：is_string_change_from_prev は note_integration.py 側で生成

入力（4つの JSON）：
  1. comparison_result.json    — 解析結果（v3.2.2: {version, warnings, results} 構造）
                                  results 配列の各要素に pitch_ok, start_ok, avg_volume_db 等
  2. note_results.json         — 楽譜上の期待値（expected_pitch_hz, bpm, time_signature 等）
  3. analysis.json             — 既存の analyze_musicxml 出力（変更しない、温存）
  4. musicxml_skill_info.json  — Commit D で新規生成（string_id, finger, is_in_slur 等）

出力：
  IntegratedScoreData（IntegratedNote のリストを含む）

このモジュールは：
- 4 つの JSON のフィールドを音符インデックスでマージ
- is_string_change_from_prev フラグを生成（前後比較、v3.2 Q7 確定）
- detection_rate の計算（A1 判定で使う）

note_results.json の構造：
  {
    "bpm": 80.0,
    "time_signature": {"numerator": 4, "denominator": 4},  # v3.2: dict
    "notes": [
      {
        "type": "note" | "rest",
        "expected_start_sec": 0.0,
        "expected_end_sec": 0.75,
        "expected_pitch_hz": 440.0,
        "measure": 0
      },
      ...
    ]
  }

comparison_result.json の構造（v3.2.2: ラッパー）:
  {
    "version": "3.0",
    "warnings": [],
    "results": [
      {
        "note_index": 0,
        "measure_number": 1,                # v3.2.2: 取り込む（1-indexed）
        "note_name": "C4",                  # 表示用、IntegratedNote では取り込まない
        "global_shift_sec": -0.05,          # 取り込まない
        "current_shift_sec": -0.05,         # 取り込まない
        "expected_start_sec": -0.05,
        "expected_end_sec": 0.77,
        "expected_pitch_hz": 261.62,
        "detected_start_sec": -0.05,
        "detected_pitch_hz": 253.83,        # 取り込まない
        "timing_from_start_sec": 0.0,       # 取り込まない
        "match_confidence": "medium",       # α では取り込まない（β で活用検討）
        "pitch_cents_error": -52.35,
        "pitch_ok": false,
        "start_diff_sec": 0.0,
        "start_ok": true,
        "valid_frames": 79,                 # α では取り込まない
        "evaluation_status": "evaluated",   # α では取り込まない
        # 以下は Commit A で追加されている:
        "avg_volume_db": -22.5,
        "volume_drop_after": -1.2
      },
      ...
    ]
  }

musicxml_skill_info.json の構造（v3.2 Q6: 新規ファイル）:
  {
    "version": 1,
    "notes": [
      {
        "note_index": 0,
        "measure_index": 0,
        "is_rest": false,
        "string_id": "A",
        "finger": 0,
        "is_in_slur": false,
        "is_after_rest": false,
        "is_inferred_position": false
      },
      ...
    ]
  }
  注：is_string_change_from_prev は出力されない（v3.2 Q7：このモジュールで生成）
"""

from __future__ import annotations

import json
from typing import Any, List, Optional

from .integrated_note import IntegratedNote, IntegratedScoreData


# ---------------------------------------------------------------------------
# JSON 読み込みヘルパー
# ---------------------------------------------------------------------------


def load_json(path: str) -> Any:
    """JSON ファイルを読み込む（dict または list を返す）。"""
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# パイプライン中核：4 つの JSON を統合
# ---------------------------------------------------------------------------


def build_integrated_score_data(
    comparison_result_path: str,
    note_results_path: str,
    musicxml_skill_info_path: str,
    *,
    performance_id: str,
    user_id: str,
    practice_item_id: str,
    practice_item_difficulty: int,
    skill_sub_task_tags: Optional[List[str]] = None,
) -> IntegratedScoreData:
    """4 つの JSON を読み込み、IntegratedScoreData を構築する（v3.2.2）。
    
    v3.2.2 修正:
      - comparison_result.json は {version, warnings, results} 構造として読み込む
      - results 配列にアクセスして音符データを取得
      - measure_number は comparison_result から取得（1-indexed）
      - end 系フィールドは取り込まない（実物に存在しない）

    Args:
        comparison_result_path: comparison_result.json のパス
        note_results_path: note_results.json のパス
        musicxml_skill_info_path: musicxml_skill_info.json のパス
        performance_id: 演奏ID
        user_id: ユーザーID
        practice_item_id: PracticeItem ID
        practice_item_difficulty: PracticeItem.star (v1.3 で difficulty → star、1〜10)
        skill_sub_task_tags: PracticeItem.skillSubTaskTags

    Returns:
        IntegratedScoreData
    """
    comparison = load_json(comparison_result_path)
    note_results = load_json(note_results_path)
    skill_info = load_json(musicxml_skill_info_path)

    return integrate(
        comparison_result=comparison,
        note_results=note_results,
        musicxml_skill_info=skill_info,
        performance_id=performance_id,
        user_id=user_id,
        practice_item_id=practice_item_id,
        practice_item_difficulty=practice_item_difficulty,
        skill_sub_task_tags=skill_sub_task_tags or [],
    )


def integrate(
    *,
    comparison_result: Any,  # v3.2.2: {"version", "warnings", "results"} dict
    note_results: dict,
    musicxml_skill_info: dict,
    performance_id: str,
    user_id: str,
    practice_item_id: str,
    practice_item_difficulty: int,
    skill_sub_task_tags: List[str],
) -> IntegratedScoreData:
    """4 つの dict を統合して IntegratedScoreData を構築する（v3.2.2）。

    純粋関数。ファイル読み込みは build_integrated_score_data() 側で行う。
    
    v3.2.2 修正:
      - comparison_result は {version, warnings, results} ラッパー構造
      - 互換性のため、旧形式（flat array、または evaluatedNotes ラッパー）もサポート
        （v3.2 で生成された旧データを読む場合の保険）
    """
    # v3.2.2: comparison_result の構造判定
    # 優先順位: 1. v3.2.2 ラッパー (results キー), 2. 旧 flat array, 3. 旧 evaluatedNotes
    eval_notes: List[dict] = []
    comparison_meta: dict = {}
    
    if isinstance(comparison_result, dict):
        if "results" in comparison_result:
            # v3.2.2 正規形式: {"version", "warnings", "results"}
            eval_notes = comparison_result.get("results", [])
            comparison_meta = {
                "version": comparison_result.get("version"),
                "warnings": comparison_result.get("warnings", []),
            }
        elif "evaluatedNotes" in comparison_result:
            # 旧 v3 互換: {"evaluatedNotes": [...]}
            eval_notes = comparison_result.get("evaluatedNotes", [])
        else:
            # 不明な dict 構造、空とみなす
            eval_notes = []
    elif isinstance(comparison_result, list):
        # v3.2 が想定していた flat array（互換維持、旧データ用）
        eval_notes = comparison_result
    else:
        eval_notes = []
    
    note_results_notes = note_results.get("notes", [])
    skill_info_notes = musicxml_skill_info.get("notes", [])

    # マージ：4 つを音符インデックスで突き合わせる
    integrated_notes = _merge_notes(
        eval_notes=eval_notes,
        note_results_notes=note_results_notes,
        skill_info_notes=skill_info_notes,
    )

    # v3.2 Q7：is_string_change_from_prev を生成（前後比較）
    _annotate_string_change(integrated_notes)

    # is_after_rest フラグの整合性チェック
    _annotate_after_rest_from_results(integrated_notes)

    # 検出割合の計算
    detection_rate = _calc_detection_rate(integrated_notes)

    # bpm / time_signature の取り出し
    bpm = float(note_results.get("bpm", 60.0))
    
    # v3.2 修正（Phase 0.1 Task 2）：time_signature は dict 型
    time_signature = note_results.get("time_signature", {"numerator": 4, "denominator": 4})
    if isinstance(time_signature, str):
        # 旧形式（文字列）の互換維持
        try:
            num, den = time_signature.split("/")
            time_signature = {"numerator": int(num), "denominator": int(den)}
        except (ValueError, AttributeError):
            time_signature = {"numerator": 4, "denominator": 4}

    # target_bpm_used は comparison_result の dict 形式から取得（v3.2.2 では非標準フィールド）
    target_bpm_used = None
    if isinstance(comparison_result, dict):
        # 旧形式互換 + v3.2.2 では meta としては想定しないが将来対応
        target_bpm_used = comparison_result.get("target_bpm_used")

    return IntegratedScoreData(
        performance_id=performance_id,
        user_id=user_id,
        practice_item_id=practice_item_id,
        practice_item_difficulty=practice_item_difficulty,
        notes=integrated_notes,
        bpm=bpm,
        time_signature=time_signature,
        skill_sub_task_tags=skill_sub_task_tags,
        target_bpm_used=target_bpm_used,
        detection_rate=detection_rate,
    )


# ---------------------------------------------------------------------------
# 各音符の統合
# ---------------------------------------------------------------------------


def _merge_notes(
    eval_notes: List[dict],
    note_results_notes: List[dict],
    skill_info_notes: List[dict],
) -> List[IntegratedNote]:
    """3 つの音符配列を統合して IntegratedNote のリストを返す。

    マッピング戦略：
    - note_results.json の notes 配列を「正本」とする（音符の総数とインデックス）
    - 各インデックスに対して、comparison_result.json と musicxml_skill_info.json
      から対応する要素をマッチ
    - インデックスがずれている場合：警告ログを出して可能な限り処理（None 補完）
    
    v3.2.2 修正:
      - measure_number は comparison_result から優先取得（1-indexed）
      - フォールバック: note_results.measure が存在すれば 1 を加算（0-indexed → 1-indexed）
      - end 系フィールドは取り込まない
    """
    # skill_info を note_index でマップ化
    skill_info_by_index = {
        n.get("note_index", i): n for i, n in enumerate(skill_info_notes)
    }

    integrated: List[IntegratedNote] = []

    for i, nr_note in enumerate(note_results_notes):
        # note_results 側の基本情報
        is_rest = nr_note.get("type") == "rest"
        expected_pitch_hz = float(nr_note.get("expected_pitch_hz", 0.0)) if not is_rest else 0.0
        expected_start_sec = float(nr_note.get("expected_start_sec", 0.0))
        expected_end_sec = float(nr_note.get("expected_end_sec", 0.0))

        # comparison_result から検出結果を取得（インデックスで対応付け）
        eval_note = eval_notes[i] if i < len(eval_notes) else None
        if eval_note is not None:
            detected_start_sec = _safe_float(eval_note.get("detected_start_sec"))
            pitch_cents_error = _safe_float(eval_note.get("pitch_cents_error"))
            pitch_ok = _safe_bool(eval_note.get("pitch_ok"))
            start_diff_sec = _safe_float(eval_note.get("start_diff_sec"))
            start_ok = _safe_bool(eval_note.get("start_ok"))
            avg_volume_db = _safe_float(eval_note.get("avg_volume_db"))
            volume_drop_after = _safe_float(eval_note.get("volume_drop_after"))
            
            # v3.2.2: measure_number を comparison_result から取得（1-indexed）
            measure_number = eval_note.get("measure_number")
            if measure_number is None:
                # フォールバック：note_results.measure（0-indexed）から +1
                measure_raw = nr_note.get("measure", 0)
                measure_number = int(measure_raw) + 1 if isinstance(measure_raw, (int, float)) else 1
            else:
                measure_number = int(measure_number)
        else:
            detected_start_sec = None
            pitch_cents_error = None
            pitch_ok = None
            start_diff_sec = None
            start_ok = None
            avg_volume_db = None
            volume_drop_after = None
            
            # comparison_result が無い → note_results からフォールバック
            measure_raw = nr_note.get("measure", 0)
            measure_number = int(measure_raw) + 1 if isinstance(measure_raw, (int, float)) else 1

        # skill_info から運指情報を取得
        si_note = skill_info_by_index.get(i)
        if si_note is not None:
            string_id = si_note.get("string_id")
            finger_raw = si_note.get("finger")
            finger = int(finger_raw) if finger_raw is not None else None
            is_in_slur = bool(si_note.get("is_in_slur", False))
            is_after_rest = bool(si_note.get("is_after_rest", False))
            is_inferred_position = bool(si_note.get("is_inferred_position", False))
        else:
            string_id = None
            finger = None
            is_in_slur = False
            is_after_rest = False
            is_inferred_position = False

        integrated.append(
            IntegratedNote(
                note_index=i,
                measure_number=measure_number,  # v3.2.2: 1-indexed
                expected_pitch_hz=expected_pitch_hz,
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
                is_after_rest=is_after_rest,
                is_inferred_position=is_inferred_position,
                is_string_change_from_prev=False,  # 後で _annotate_string_change で設定
            )
        )

    return integrated


# ---------------------------------------------------------------------------
# 弦移動フラグの生成（v3.2 Q7：このモジュールで生成）
# ---------------------------------------------------------------------------


def _annotate_string_change(notes: List[IntegratedNote]) -> None:
    """各音符に is_string_change_from_prev フラグを設定する（インプレース）。
    
    v3.2 Q7 確定：この処理は note_integration.py 側で行う。
    analyze_musicxml.py / Commit D 側では出力しない。

    判定ロジック：
      - 現在の音符が休符 → False
      - 直前の音符（休符を飛ばす）が None または string_id None → False
      - 現在と直前の string_id が異なる → True
      - 同じなら → False
    """
    prev_note_with_string: Optional[IntegratedNote] = None

    for note in notes:
        if note.is_rest:
            continue

        if note.string_id is None:
            note.is_string_change_from_prev = False
            prev_note_with_string = note
            continue

        if prev_note_with_string is None or prev_note_with_string.string_id is None:
            note.is_string_change_from_prev = False
        else:
            note.is_string_change_from_prev = (
                note.string_id != prev_note_with_string.string_id
            )

        prev_note_with_string = note


def _annotate_after_rest_from_results(notes: List[IntegratedNote]) -> None:
    """直前が休符かフラグを再計算する（インプレース）。"""
    prev_was_rest = False
    for note in notes:
        if note.is_rest:
            prev_was_rest = True
            note.is_after_rest = False
            continue
        note.is_after_rest = prev_was_rest
        prev_was_rest = False


# ---------------------------------------------------------------------------
# 検出割合の計算
# ---------------------------------------------------------------------------


def _calc_detection_rate(notes: List[IntegratedNote]) -> float:
    """検出割合（休符以外の音符のうち、検出された音符の割合）を計算する。"""
    non_rest = [n for n in notes if not n.is_rest]
    if not non_rest:
        return 0.0
    detected = sum(1 for n in non_rest if n.is_detected)
    return detected / len(non_rest)


# ---------------------------------------------------------------------------
# 型変換ヘルパー（None を保持しながら安全に変換）
# ---------------------------------------------------------------------------


def _safe_float(value) -> Optional[float]:
    """値を float に変換、None や不正値は None を返す。"""
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _safe_bool(value) -> Optional[bool]:
    """値を bool に変換、None は None を返す。"""
    if value is None:
        return None
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    if isinstance(value, str):
        return value.lower() in ("true", "1", "yes")
    return None
