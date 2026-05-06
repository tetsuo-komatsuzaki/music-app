"""
generate_expected.py
Usage: python scripts/generate_expected.py <performanceId>

comparison_result.json と score.mxl から expected.json（仮の教師データ）を生成する。
"""

import sys
import json
import pathlib
from datetime import date, datetime, timezone
from music21 import converter, note, chord, tempo as m21tempo

# ─── パス設定 ─────────────────────────────────────────────────
SCRIPT_DIR   = pathlib.Path(__file__).resolve().parent
ANALYZER_DIR = SCRIPT_DIR.parent
CASES_DIR    = ANALYZER_DIR / "tests" / "cases"


# ─── MXL から理論タイミングを取得 ────────────────────────────

def extract_score_notes(mxl_path: pathlib.Path) -> list[dict]:
    """
    MXL を解析して各音符の理論的なタイミング（秒）を返す。
    休符も含む（is_rest フラグで区別）。
    """
    sc = converter.parse(str(mxl_path))
    flat = sc.flat.notesAndRests

    # TempoMap 構築
    tempo_map = []  # [(offset_ql, bpm)]
    for el in sc.flat:
        if isinstance(el, m21tempo.MetronomeMark):
            bpm = el.number or 60.0
            tempo_map.append((float(el.offset), float(bpm)))
    if not tempo_map:
        tempo_map = [(0.0, 60.0)]
    tempo_map.sort(key=lambda x: x[0])

    def ql_to_sec(offset_ql: float) -> float:
        """quarterLength offset → 秒"""
        t = 0.0
        prev_offset = 0.0
        prev_bpm = tempo_map[0][1]
        for map_offset, map_bpm in tempo_map:
            if offset_ql <= map_offset:
                break
            elapsed_ql = min(offset_ql, map_offset) - prev_offset
            t += elapsed_ql * (60.0 / prev_bpm)
            prev_offset = map_offset
            prev_bpm    = map_bpm
        remaining = offset_ql - prev_offset
        t += remaining * (60.0 / prev_bpm)
        return round(t, 4)

    results = []
    for el in flat:
        start_ql  = float(el.offset)
        dur_ql    = float(el.duration.quarterLength) if el.duration else 0.0
        start_sec = ql_to_sec(start_ql)
        end_sec   = ql_to_sec(start_ql + dur_ql)

        if el.isRest:
            results.append({
                "is_rest":          True,
                "expected_pitch":   "rest",
                "expected_start_sec": start_sec,
                "expected_end_sec":   end_sec,
                "measure_number":   el.measureNumber or 0,
            })
        else:
            if isinstance(el, chord.Chord):
                # コードの場合は最高音を代表ピッチとする
                pitches = sorted(el.pitches, key=lambda p: p.midi)
                rep_pitch = pitches[-1].nameWithOctave
            else:
                rep_pitch = el.pitch.nameWithOctave
            results.append({
                "is_rest":          False,
                "expected_pitch":   rep_pitch,
                "expected_start_sec": start_sec,
                "expected_end_sec":   end_sec,
                "measure_number":   el.measureNumber or 0,
            })

    return results


# ─── ピッチ → MIDI ─────────────────────────────────────────

def pitch_to_midi(pitch_str: str) -> int:
    if not pitch_str or pitch_str == "rest":
        return -1
    from music21 import pitch as m21pitch
    try:
        return m21pitch.Pitch(pitch_str).midi
    except Exception:
        return -1


# ─── confidence 算出 ─────────────────────────────────────────

def calc_confidence(
    score_note: dict,
    result_note: dict | None,
    interval_semitones: int,
) -> float:
    """
    0.0〜1.0 の confidence を算出する。
    - MXL タイミングと comparison_result の一致度
    - medium confidence マッチか否か
    - 音程跳躍の大きさ（大きいほど低信頼）
    - 高音域（E5以上）か否か
    """
    conf = 1.0

    # comparison_result の evaluation_status による減点
    if result_note:
        status = result_note.get("evaluation_status", "")
        if status == "not_detected":
            conf -= 0.35
        elif status == "wrong_note":
            conf -= 0.30
        elif status == "match":
            # タイミング精度による微調整
            if not result_note.get("start_ok", True):
                conf -= 0.10
            if not result_note.get("pitch_ok", True):
                conf -= 0.15
        # medium_confidence マッチ
        if result_note.get("confidence_level") == "medium":
            conf -= 0.25

    # 音程跳躍による減点（5半音以上で段階的に）
    if interval_semitones >= 12:
        conf -= 0.20
    elif interval_semitones >= 7:
        conf -= 0.12
    elif interval_semitones >= 5:
        conf -= 0.07

    # 高音域（E5 = MIDI 76以上）
    midi = pitch_to_midi(score_note.get("expected_pitch", ""))
    if midi >= 76:
        conf -= 0.10

    return max(0.0, round(conf, 3))


# ─── シーケンス信頼度・崩壊点 ────────────────────────────────

def calc_sequence_confidence(results: list[dict]) -> float:
    score = 1.0
    cascade_start = None
    for i, note_entry in enumerate(results):
        status = note_entry.get("evaluation_status", "match")
        if status in ("not_detected", "wrong_note"):
            if cascade_start is None:
                cascade_start = i
            cascade_len = i - cascade_start + 1
            score -= 0.03 * cascade_len
        else:
            cascade_start = None
    return max(0.0, round(score, 2))


def calc_sequence_breaks(results: list[dict]) -> list[int]:
    breaks = []
    run = 0
    for i, note_entry in enumerate(results):
        status = note_entry.get("evaluation_status", "match")
        if status in ("not_detected", "wrong_note"):
            run += 1
            if run == 3:
                breaks.append(i - 2)
        else:
            run = 0
    return breaks


# ─── タグ自動付与 ─────────────────────────────────────────────

def assign_tags(
    score_note: dict,
    result_note: dict | None,
    interval_semitones: int,
    prev_was_rest: bool,
) -> list[str]:
    tags = []
    if interval_semitones >= 7:
        tags.append("shift")
    midi = pitch_to_midi(score_note.get("expected_pitch", ""))
    if midi >= 76:
        tags.append("high_position")
    if prev_was_rest:
        tags.append("after_rest")
    if result_note and result_note.get("confidence_level") == "medium":
        tags.append("medium_confidence")
    if not tags:
        tags.append("normal")
    return tags


# ─── バージョン管理 ───────────────────────────────────────────

def get_next_version(expected_path: pathlib.Path) -> int:
    if expected_path.exists():
        try:
            existing = json.loads(expected_path.read_text(encoding="utf-8"))
            return existing.get("version", 0) + 1
        except Exception:
            pass
    return 1


# ─── メイン処理 ──────────────────────────────────────────────

def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/generate_expected.py <performanceId>")
        sys.exit(1)

    performance_id = sys.argv[1]
    case_dir = CASES_DIR / performance_id

    # 必要ファイルの確認
    mxl_path      = case_dir / "score.mxl"
    cr_path       = case_dir / "comparison_result.json"
    meta_path     = case_dir / "meta.json"
    expected_path = case_dir / "expected.json"

    for p, name in [(mxl_path, "score.mxl"), (cr_path, "comparison_result.json"), (meta_path, "meta.json")]:
        if not p.exists():
            print(f"[ERROR] {name} が存在しません: {p}")
            sys.exit(1)

    meta             = json.loads(meta_path.read_text(encoding="utf-8"))
    analyzer_version = meta.get("analyzer_version", "unknown")

    # comparison_result.json 読み込み
    cr_data = json.loads(cr_path.read_text(encoding="utf-8"))
    cr_notes: list[dict] = cr_data.get("notes", cr_data.get("results", []))

    # MXL から理論タイミングを取得
    print("Analyzing score.mxl ...")
    score_notes = [n for n in extract_score_notes(mxl_path) if not n["is_rest"]]

    # comparison_result と score_notes を zip（短い方に合わせる）
    combined = list(zip(score_notes, cr_notes + [None] * max(0, len(score_notes) - len(cr_notes))))

    notes_out = []
    prev_was_rest = False
    prev_midi = -1

    for idx, (sn, rn) in enumerate(combined):
        expected_midi = pitch_to_midi(sn["expected_pitch"])
        interval = abs(expected_midi - prev_midi) if prev_midi >= 0 and expected_midi >= 0 else 0

        conf  = calc_confidence(sn, rn, interval)
        tags  = assign_tags(sn, rn, interval, prev_was_rest)
        review = conf < 0.9  # 0.7未満=要確認, 0.7〜0.9=確認推奨, どちらも review=true

        # evaluation_status を cr から引き継ぐ（sequence_confidence 計算用）
        eval_status = (rn.get("evaluation_status", "match") if rn else "not_detected")

        entry: dict = {
            "note_index":          idx,
            "expected_pitch":      sn["expected_pitch"],
            "expected_start_sec":  sn["expected_start_sec"],
            "expected_end_sec":    sn["expected_end_sec"],
            "should_exist":        True,
            "confidence":          conf,
            "review":              review,
            "tags":                tags,
            # sequence 計算用（出力には含まない — 後で削除）
            "_evaluation_status":  eval_status,
        }
        notes_out.append(entry)

        prev_was_rest  = False
        prev_midi      = expected_midi

    # sequence_confidence / sequence_breaks 算出
    # _evaluation_status を一時的に使う
    for n in notes_out:
        n["evaluation_status"] = n.pop("_evaluation_status")

    seq_conf   = calc_sequence_confidence(notes_out)
    seq_breaks = calc_sequence_breaks(notes_out)

    # evaluation_status を最終出力から除去
    for n in notes_out:
        n.pop("evaluation_status", None)

    # バージョン管理
    version = get_next_version(expected_path)

    expected = {
        "case_id":      performance_id,
        "version":      version,
        "derived_from": f"comparison_result_{analyzer_version}",
        "last_reviewed_at": str(date.today()),
        "confidence":   "auto_generated",
        "needs_review": True,
        "evaluation_policy": {
            "onset_mode":         "relative",
            "pitch_mode":         "closest",
            "alignment_mode":     "monotonic",
            "timing_reference":   "score_based",
            "tempo_normalization": True,
        },
        "tolerance": {
            "onset_ms":   120,
            "offset_ms":  180,
            "pitch_cents": 35,
        },
        "sequence_confidence": seq_conf,
        "sequence_breaks":     seq_breaks,
        "notes":               notes_out,
    }

    expected_path.write_text(json.dumps(expected, indent=2, ensure_ascii=False), encoding="utf-8")

    # ─── 標準出力 ───
    n_total  = len(notes_out)
    n_low    = sum(1 for n in notes_out if n["confidence"] < 0.7)
    n_mid    = sum(1 for n in notes_out if 0.7 <= n["confidence"] < 0.9)
    n_auto   = sum(1 for n in notes_out if n["confidence"] >= 0.9)
    breaks_str = str(seq_breaks) if seq_breaks else "なし"

    print(f"\n[OK] expected.json を生成しました（{n_total}件）")
    print(f"version:          {version}")
    print(f"derived_from:     comparison_result_{analyzer_version}")
    print(f"last_reviewed_at: {date.today()}")
    print(f"sequence_confidence: {seq_conf}")
    print(f"sequence_breaks: {breaks_str}  → note_index {breaks_str} 付近に崩壊あり" if seq_breaks else f"sequence_breaks: なし")
    print(f"[REVIEW] 要確認（conf < 0.7）:        {n_low}件")
    print(f"[REVIEW] 確認推奨（0.7 <= conf < 0.9）: {n_mid}件")
    print(f"[AUTO]   自動承認（conf >= 0.9）:       {n_auto}件")
    print(f"\n→ expected.json を開いて review=true の箇所を確認してください")
    print("\n注意: この expected.json は「仮の教師データ」です。")
    print("      needs_review=true の間はベンチマークの参考値として扱うこと。")
    print("      [REVIEW]箇所を確認・修正したら last_reviewed_at を更新すること。")


if __name__ == "__main__":
    main()
