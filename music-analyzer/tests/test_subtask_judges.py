# -*- coding: utf-8 -*-
"""lib/subtask_judges — 弓採点23項目の判定器（マスター判定 bowing の唯一の製造元）。

判定ルール（2026-06-07 確定）:
  ① 点 = 対象音符のうち OK だった割合（弓系 OK = 音程かつタイミング）
  ② 対象 = 属性で絞った非休符 & 評価可能(pitch_ok/start_ok が非None)
  ③ 奏法品質は ① に AND / matched = target>=FIRE_MIN_SAMPLES(3) かつ score<70
"""
from lib.integrated_note import IntegratedNote, IntegratedScoreData
from lib.subtask_judges import (
    run_bowing_judges,
    is_performance_analyzable,
    BOWING_SUB_TASK_IDS,
    FIRE_MIN_SAMPLES,
    FIRE_SCORE_THRESHOLD,
    _q_staccato,
    _q_portato,
    _q_trill,
    _q_pizzicato,
)


def _note(idx=0, *, is_rest=False, string_id=None, pitch_ok=True, start_ok=True,
          detected=True, **kw):
    n = IntegratedNote(
        note_index=idx,
        measure_number=1,
        expected_pitch_hz=440.0,
        expected_start_sec=0.0,
        expected_end_sec=0.5,
        is_rest=is_rest,
    )
    n.string_id = string_id
    n.pitch_ok = pitch_ok
    n.start_ok = start_ok
    n.detected_start_sec = 0.0 if detected else None
    for k, v in kw.items():
        setattr(n, k, v)
    return n


def _data(notes, bpm=60.0):
    return IntegratedScoreData(
        performance_id="p", user_id="u", practice_item_id="pi",
        practice_item_difficulty=1, notes=notes, bpm=bpm,
        time_signature={"numerator": 4, "denominator": 4},
    )


# ─── エントリポイントの契約 ──────────────────────────────────────────────

def test_run_returns_all_23_subtask_ids():
    out = run_bowing_judges(_data([]))
    assert set(out.keys()) == set(BOWING_SUB_TASK_IDS)
    assert len(BOWING_SUB_TASK_IDS) == 23


def test_no_targets_yields_skipped_result():
    # 音符ゼロ → 全項目 target_count 0（集計対象外）
    out = run_bowing_judges(_data([]))
    r = out["bowing_string_g"]
    assert r.target_count == 0
    assert r.matched is False


# ─── 弦判定 (bowing_string_*) ────────────────────────────────────────────

def test_string_judge_score_is_ok_fraction():
    # G線4音・1音NG → score = 100 - 25 = 75
    notes = [_note(0, string_id="G", pitch_ok=False)] + [
        _note(i, string_id="G") for i in range(1, 4)
    ]
    r = run_bowing_judges(_data(notes))["bowing_string_g"]
    assert r.target_count == 4
    assert r.bad_count == 1
    assert r.score == 75.0
    # score 75 は閾値70以上 → 課題化されない
    assert r.matched is False


def test_string_judge_matched_when_score_below_threshold():
    # G線4音・2音NG → score 50 < 70 かつ target>=3 → matched True
    notes = [_note(0, string_id="G", pitch_ok=False),
             _note(1, string_id="G", start_ok=False)] + [
        _note(i, string_id="G") for i in range(2, 4)
    ]
    r = run_bowing_judges(_data(notes))["bowing_string_g"]
    assert r.score == 50.0
    assert r.matched is True


def test_string_judge_excludes_unevaluable_notes():
    # pitch_ok/start_ok が None の音は対象外（評価不能）
    notes = [
        _note(0, string_id="A"),
        _note(1, string_id="A", pitch_ok=None, start_ok=None),  # 評価不能→除外
        _note(2, string_id="A"),
    ]
    r = run_bowing_judges(_data(notes))["bowing_string_a"]
    assert r.target_count == 2


def test_string_judge_below_min_samples_not_matched():
    # 2音（<3）全滅でも matched False（偶発ミスで暴れない足切り）
    notes = [_note(0, string_id="E", pitch_ok=False),
             _note(1, string_id="E", pitch_ok=False)]
    r = run_bowing_judges(_data(notes))["bowing_string_e"]
    assert r.score == 0.0
    assert r.target_count == 2
    assert r.matched is False  # target < FIRE_MIN_SAMPLES


# ─── 弦移動 (bowing_string_change_*) ─────────────────────────────────────

def test_string_change_targets_transition_notes():
    # G→D→G→D → d_to_g / g_to_d の遷移先を拾う
    notes = [
        _note(0, string_id="G"),
        _note(1, string_id="D"),  # g_to_d の遷移先
        _note(2, string_id="G"),  # d_to_g の遷移先
        _note(3, string_id="D"),  # g_to_d の遷移先
    ]
    out = run_bowing_judges(_data(notes))
    assert out["bowing_string_change_g_to_d"].target_count == 2
    assert out["bowing_string_change_d_to_g"].target_count == 1


# ─── 奏法品質判定（純関数） ──────────────────────────────────────────────

def test_q_staccato_threshold():
    assert _q_staccato(_note(dur_ratio=0.4)) is True   # <=0.5 短く切れている
    assert _q_staccato(_note(dur_ratio=0.5)) is True   # 境界含む
    assert _q_staccato(_note(dur_ratio=0.6)) is False
    assert _q_staccato(_note(dur_ratio=None)) is None   # 測れない


def test_q_portato_band():
    assert _q_portato(_note(dur_ratio=0.5)) is True
    assert _q_portato(_note(dur_ratio=0.85)) is True
    assert _q_portato(_note(dur_ratio=0.4)) is False   # 切りすぎ
    assert _q_portato(_note(dur_ratio=0.9)) is False   # 切れてない
    assert _q_portato(_note(dur_ratio=None)) is None


def test_q_trill_requires_alternation_in_band():
    # 交替回数>=4 かつ 半音差 0.7..3.0
    assert _q_trill(_note(pitch_alt_count=5, pitch_alt_semitones=2.0)) is True
    assert _q_trill(_note(pitch_alt_count=3, pitch_alt_semitones=2.0)) is False  # 回数不足
    assert _q_trill(_note(pitch_alt_count=8, pitch_alt_semitones=5.0)) is False  # 広すぎ=跳躍
    assert _q_trill(_note(pitch_alt_count=None, pitch_alt_semitones=None)) is None


def test_q_pizzicato_envelope():
    # 鋭いアタック(前方ピーク) かつ 減衰
    assert _q_pizzicato(_note(attack_peak_frac=0.2, decay_ratio=0.3)) is True
    assert _q_pizzicato(_note(attack_peak_frac=0.6, decay_ratio=0.3)) is False  # アタック遅い
    assert _q_pizzicato(_note(attack_peak_frac=0.2, decay_ratio=0.8)) is False  # 減衰せず
    assert _q_pizzicato(_note(attack_peak_frac=None, decay_ratio=None)) is None


# ─── 奏法判定が品質を ① に AND すること ──────────────────────────────────

def test_staccato_quality_anded_into_score():
    # 音程/タイミングは全OKだが staccato dur_ratio が長い → 品質NGで減点
    notes = [
        _note(i, articulations=["Staccato"], dur_ratio=0.9)  # 品質NG
        for i in range(3)
    ]
    r = run_bowing_judges(_data(notes))["bowing_technique_staccato"]
    assert r.target_count == 3
    assert r.bad_count == 3      # 品質NGで bad
    assert r.score == 0.0


def test_staccato_unmeasurable_quality_excluded_from_target():
    # dur_ratio None（品質測定不能）は対象外（誤判定回避）
    notes = [_note(i, articulations=["Staccato"], dur_ratio=None) for i in range(3)]
    r = run_bowing_judges(_data(notes))["bowing_technique_staccato"]
    assert r.target_count == 0


def test_staccato_quality_ok_full_score():
    notes = [_note(i, articulations=["Staccato"], dur_ratio=0.3) for i in range(3)]
    r = run_bowing_judges(_data(notes))["bowing_technique_staccato"]
    assert r.target_count == 3
    assert r.score == 100.0


# ─── ハーモニクス / 重音 ─────────────────────────────────────────────────

def test_harmonic_judge_targets_harmonic_notes():
    notes = [_note(i, is_harmonic=True) for i in range(3)] + [_note(9)]
    r = run_bowing_judges(_data(notes))["bowing_technique_harmonic"]
    assert r.target_count == 3


def test_double_stop_2_vs_3plus():
    notes = [
        _note(0, is_chord=True, pitch_count=2),
        _note(1, is_chord=True, pitch_count=2),
        _note(2, is_chord=True, pitch_count=3),
    ]
    out = run_bowing_judges(_data(notes))
    assert out["bowing_double_stop_2"].target_count == 2
    assert out["bowing_double_stop_3plus"].target_count == 1


# ─── is_performance_analyzable ───────────────────────────────────────────

def test_analyzable_detection_rate_threshold():
    # 4音中2音検出 = 0.5 >= 0.5 → 解析可
    notes = [_note(0, detected=True), _note(1, detected=True),
             _note(2, detected=False), _note(3, detected=False)]
    assert is_performance_analyzable(_data(notes)) is True


def test_not_analyzable_below_half():
    notes = [_note(0, detected=True)] + [_note(i, detected=False) for i in range(1, 4)]
    assert is_performance_analyzable(_data(notes)) is False


def test_not_analyzable_when_all_rests():
    assert is_performance_analyzable(_data([_note(0, is_rest=True)])) is False
