# -*- coding: utf-8 -*-
"""lib/timing_tolerance — BPM 連動タイミング閾値（v3.2 §14-3 H3）。"""
import math

from lib.timing_tolerance import (
    get_timing_tolerance,
    get_rush_threshold,
    TIMING_TOLERANCE_BASE_SEC,
    TIMING_TOLERANCE_RUSH_BASE_SEC,
)


def test_tolerance_at_bpm_60_is_base():
    assert get_timing_tolerance(60) == TIMING_TOLERANCE_BASE_SEC  # 0.10


def test_tolerance_scales_inversely_with_bpm():
    # 設計書の例値
    assert math.isclose(get_timing_tolerance(80), 0.075, rel_tol=1e-9)
    assert math.isclose(get_timing_tolerance(120), 0.05, rel_tol=1e-9)
    assert math.isclose(get_timing_tolerance(81), 0.10 * 60.0 / 81.0, rel_tol=1e-9)


def test_tolerance_bpm_81_matches_logged_value():
    # Tetsuo 報告ログ: ±0.074s (target_bpm=81.0)
    assert round(get_timing_tolerance(81.0), 3) == 0.074


def test_tolerance_invalid_bpm_falls_back_to_base():
    assert get_timing_tolerance(0) == TIMING_TOLERANCE_BASE_SEC
    assert get_timing_tolerance(-10) == TIMING_TOLERANCE_BASE_SEC


def test_rush_threshold_is_negative_and_scales():
    assert get_rush_threshold(60) == -TIMING_TOLERANCE_RUSH_BASE_SEC  # -0.05
    assert math.isclose(get_rush_threshold(120), -0.025, rel_tol=1e-9)
    assert math.isclose(get_rush_threshold(80), -0.0375, rel_tol=1e-9)


def test_rush_threshold_invalid_bpm_fallback():
    assert get_rush_threshold(0) == -TIMING_TOLERANCE_RUSH_BASE_SEC
    assert get_rush_threshold(-5) == -TIMING_TOLERANCE_RUSH_BASE_SEC


def test_faster_bpm_yields_tighter_tolerance():
    # 単調減少: BPM が上がるほど許容は狭まる
    vals = [get_timing_tolerance(b) for b in (60, 90, 120, 180)]
    assert all(a > b for a, b in zip(vals, vals[1:]))
