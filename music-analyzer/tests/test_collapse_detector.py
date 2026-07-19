# -*- coding: utf-8 -*-
"""lib/collapse_detector — 崩壊小節検出（達成=崩壊ゼロ3回 の判定部品）。

2026-07-10 Tetsuo 確定:
  - 4音以上の小節のみ判定対象（3音以下は条件A/Bとも対象外）
  - 条件A: 全音 not_detected（止まった）/ 条件B: NG率 >= 0.8
  - NG = not_detected / pitch_ok False / start_ok False
"""
from lib.collapse_detector import (
    is_note_ng,
    detect_collapsed_measures,
    COLLAPSE_THRESHOLD,
    MIN_MEASURE_NOTES,
)


def _note(m, *, status=None, pitch_ok=True, start_ok=True):
    return {
        "measure_number": m,
        "evaluation_status": status,
        "pitch_ok": pitch_ok,
        "start_ok": start_ok,
    }


# ─── is_note_ng ──────────────────────────────────────────────────────────

def test_is_note_ng_not_detected():
    assert is_note_ng({"evaluation_status": "not_detected"}) is True


def test_is_note_ng_pitch_or_timing_false():
    assert is_note_ng({"pitch_ok": False}) is True
    assert is_note_ng({"start_ok": False}) is True


def test_is_note_ng_ok_and_none_are_not_ng():
    # True / None(救済・評価対象外) は OK 扱い（保守側）
    assert is_note_ng({"pitch_ok": True, "start_ok": True}) is False
    assert is_note_ng({"pitch_ok": None, "start_ok": None}) is False
    assert is_note_ng({}) is False


# ─── detect_collapsed_measures ───────────────────────────────────────────

def test_small_measure_below_min_notes_is_skipped():
    # 3音の小節は判定対象外 → skipped にカウント・崩壊にはならない
    results = [_note(1, status="not_detected") for _ in range(3)]
    out = detect_collapsed_measures(results)
    assert out["skipped_small_measures"] == 1
    assert out["total_measure_passes"] == 0
    assert out["is_clean"] is True
    assert out["collapsed"] == []


def test_condition_a_all_undetected():
    results = [_note(1, status="not_detected") for _ in range(MIN_MEASURE_NOTES)]
    out = detect_collapsed_measures(results)
    assert out["is_clean"] is False
    assert len(out["collapsed"]) == 1
    c = out["collapsed"][0]
    assert c["condition"] == "A"
    assert c["measure_number"] == 1


def test_condition_b_high_ng_rate_but_not_all_undetected():
    # 4音中4音が pitch NG（未検知ではない）→ 条件B, rate 1.0
    results = [_note(2, pitch_ok=False) for _ in range(4)]
    out = detect_collapsed_measures(results)
    assert out["collapsed"][0]["condition"] == "B"
    assert out["collapsed"][0]["ng_rate"] == 1.0


def test_condition_b_threshold_boundary_inclusive():
    # 5音中4音NG = 0.8 = 閾値ちょうど → 崩壊（>= 判定）
    results = [_note(3, pitch_ok=False) for _ in range(4)] + [_note(3)]
    out = detect_collapsed_measures(results)
    assert out["collapsed"], "rate 0.8 は閾値ちょうどで崩壊のはず"
    assert out["collapsed"][0]["ng_rate"] == 0.8


def test_just_below_threshold_is_clean():
    # 5音中3音NG = 0.6 < 0.8 → 崩壊なし
    results = [_note(3, pitch_ok=False) for _ in range(3)] + [_note(3), _note(3)]
    out = detect_collapsed_measures(results)
    assert out["is_clean"] is True


def test_clean_full_measure_all_ok():
    results = [_note(1) for _ in range(4)]
    out = detect_collapsed_measures(results)
    assert out["is_clean"] is True
    assert out["total_measure_passes"] == 1


def test_repeat_passes_get_distinct_pass_index():
    # 小節1 → 小節2 → 小節1（リピート2周目）。区切られた 2 つの run に分かれる。
    run1 = [_note(1, status="not_detected") for _ in range(4)]
    run2 = [_note(2) for _ in range(4)]
    run3 = [_note(1, status="not_detected") for _ in range(4)]
    out = detect_collapsed_measures(run1 + run2 + run3)
    collapsed_m1 = [c for c in out["collapsed"] if c["measure_number"] == 1]
    assert len(collapsed_m1) == 2
    assert {c["pass_index"] for c in collapsed_m1} == {1, 2}


def test_total_measure_passes_counts_only_judged():
    # 4音小節(判定対象) + 2音小節(対象外)
    results = [_note(1) for _ in range(4)] + [_note(2) for _ in range(2)]
    out = detect_collapsed_measures(results)
    assert out["total_measure_passes"] == 1
    assert out["skipped_small_measures"] == 1


def test_empty_input_is_clean():
    out = detect_collapsed_measures([])
    assert out["is_clean"] is True
    assert out["total_measure_passes"] == 0
