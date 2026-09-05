# -*- coding: utf-8 -*-
"""ノート属性ストアの書き手 (lib/note_store.py) の単体テスト。
仕様: 展開後の演奏順で並びを組む・前の音は演奏順・休符透過・重音は相手にしない・
手のポジションは開放弦で引き継ぐ・かたちは全属性で一意・NULL を入れない。"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lib.note_store import (
    build_score_notes, build_performance_notes, make_profile, profile_key, pitch_name,
    pitch_name_from_music21, NONE, UNKNOWN, FINGER_NONE, FINGER_UNKNOWN, POS_UNKNOWN, PROFILE_COLUMNS,
    PERFORMANCE_NOTE_COLUMNS, score_version,
)


def K(idx, step="E", octave=4, alter=0, midi=64, string="D", finger=1, position=1, dur=1.0, note_type="quarter",
      rest=False, chord=None, techs=None, on_beat=True, measure=1, conf="high", grace=False, dotted=False):
    """記譜のカルテ音 (dataclasses.asdict 相当)"""
    return {"note_index": idx, "measure_number": measure, "measure_index": measure - 1, "is_rest": rest,
            "step": None if rest else step, "alter": alter, "octave": None if rest else octave, "midi": None if rest else midi,
            "string_id": None if rest else string, "finger": None if rest else finger,
            "position": None if rest else position, "position_confidence": conf,
            "duration_beats": dur, "note_type": note_type, "is_dotted": dotted, "is_grace": grace,
            "is_on_beat": on_beat, "beat_offset": 0.0,
            "is_chord": bool(chord), "chord_midis": ([midi] + [c["midi"] for c in chord]) if chord else None,
            "chord_members": ([{"midi": midi, "step": step, "alter": alter, "octave": octave, "string_id": string, "finger": finger,
                                "note_type": note_type, "is_dotted": dotted, "duration_beats": dur}] + chord) if chord else None,
            "technique_tags": techs}


def E(k):
    """記譜のカルテ音から、展開側の要素を作る (繰り返しの無い1:1)"""
    if k["is_rest"]:
        return {"is_rest": True, "is_chord": False, "midis": [], "names": [], "quarter_length": k["duration_beats"], "tuplet_actual": None, "tuplet_normal": None}
    midis = k["chord_midis"] or [k["midi"]]
    return {"is_rest": False, "is_chord": bool(k["is_chord"]), "midis": midis, "names": [], "quarter_length": k["duration_beats"], "tuplet_actual": None, "tuplet_normal": None}


def build(karte, expanded_to_orig=None, expanded=None, spq=0.5):
    if expanded_to_orig is None:
        expanded_to_orig = list(range(len(karte)))
    if expanded is None:
        expanded = [E(karte[o]) for o in expanded_to_orig]
    return build_score_notes(expanded, expanded_to_orig, len([k for k in karte if not k["is_grace"]]), karte, spq)


def test_simple_sequence_prev_and_pass():
    karte = [K(0, "E", midi=64), K(1, "F", alter=1, midi=66, finger=2), K(2, "G", alter=1, midi=68, finger=3)]
    rows, profiles, st = build(karte)
    assert st == "ok" and len(rows) == 3
    assert rows[0]["prevProfileKey"] is None
    assert rows[1]["prevProfileKey"] == rows[0]["profileKey"]
    assert [r["pass"] for r in rows] == [1, 1, 1]
    assert profiles[rows[1]["profileKey"]]["pitch1"] == "F#4"
    assert rows[0]["durationSec"] == 0.5


def test_rest_is_transparent_and_counts_rest_before():
    karte = [K(0), K(1, rest=True, dur=2.0), K(2, "F", alter=1, midi=66)]
    rows, profiles, st = build(karte)
    assert st == "ok" and len(rows) == 2
    assert rows[1]["noteIndex"] == 2 and rows[1]["prevProfileKey"] == rows[0]["profileKey"]
    assert profiles[rows[1]["profileKey"]]["restBefore"] == 2.0


def test_repeat_expansion_prev_is_performance_order():
    karte = [K(0, "E", midi=64), K(1, "F", alter=1, midi=66), K(2, "G", alter=1, midi=68)]
    rows, profiles, st = build(karte, expanded_to_orig=[0, 1, 2, 0, 1, 2])
    assert st == "ok" and len(rows) == 6
    assert rows[3]["writtenNoteIndex"] == 0 and rows[3]["pass"] == 2
    assert rows[3]["prevProfileKey"] == rows[2]["profileKey"]      # 2回目の頭の前 = 1回目の最後
    assert rows[3]["profileKey"] == rows[0]["profileKey"]          # かたちは同じ


def test_chord_members_and_not_transition_partner():
    chord = [{"midi": 71, "step": "B", "alter": 0, "octave": 4, "string_id": "A", "finger": 1, "note_type": "quarter", "is_dotted": False, "duration_beats": 1.0}]
    karte = [K(0, "E", midi=64), K(1, "G", midi=67, chord=chord), K(2, "F", alter=1, midi=66)]
    rows, profiles, st = build(karte)
    assert st == "ok"
    p = profiles[rows[1]["profileKey"]]
    assert p["noteCount"] == 2 and p["pitch1"] == "G4" and p["pitch2"] == "B4" and p["string2"] == "A" and p["finger2"] == 1
    assert p["pitch3"] == NONE and p["finger3"] == FINGER_NONE
    assert rows[1]["prevProfileKey"] == rows[0]["profileKey"]      # 重音自身の前は E4
    assert rows[2]["prevProfileKey"] == rows[0]["profileKey"]      # 重音は次の音の相手にならない


def test_chord_without_members_falls_back_to_unknown_strings():
    karte = [K(0, "G", midi=67, chord=[{"midi": 71, "step": "B", "alter": 0, "octave": 4}])]
    karte[0]["chord_members"] = None
    ex = [{"is_rest": False, "is_chord": True, "midis": [67, 71], "names": ["G4", "B4"], "quarter_length": 1.0, "tuplet_actual": None, "tuplet_normal": None}]
    rows, profiles, st = build(karte, expanded=ex)
    p = profiles[rows[0]["profileKey"]]
    assert st == "ok" and p["pitch2"] == "B4" and p["string2"] == UNKNOWN and p["finger2"] == FINGER_UNKNOWN


def test_hand_position_carries_over_open_string():
    karte = [K(0, position=3), K(1, "A", midi=69, finger=0, position=None), K(2, "B", midi=71, position=3)]
    rows, profiles, st = build(karte)
    assert [profiles[r["profileKey"]]["position"] for r in rows] == [3, 3, 3]


def test_low_confidence_position_is_unknown_until_known():
    karte = [K(0, conf="low"), K(1, position=2)]
    rows, profiles, st = build(karte)
    assert profiles[rows[0]["profileKey"]]["position"] == POS_UNKNOWN
    assert profiles[rows[1]["profileKey"]]["position"] == 2


def test_low_confidence_breaks_hand_carry_for_following_open_string():
    # F16: 低信頼の音は不明。そのあとの開放弦は引き継ぐ相手が無いので不明。確かな音が来たら戻る
    karte = [K(0, position=1), K(1, position=3, conf="low"), K(2, "A", midi=69, finger=0, position=None), K(3, position=1)]
    rows, profiles, st = build(karte)
    assert [profiles[r["profileKey"]]["position"] for r in rows] == [1, POS_UNKNOWN, POS_UNKNOWN, 1]


def test_chord_cont_neighbors():
    ch = [{"midi": 71, "step": "B", "alter": 0, "octave": 4, "string_id": None, "finger": None, "note_type": "quarter", "is_dotted": False, "duration_beats": 1.0}]
    karte = [K(0, "G", midi=67, chord=ch), K(1, "G", midi=67, chord=ch), K(2, "E", midi=64)]
    rows, profiles, st = build(karte)
    assert profiles[rows[0]["profileKey"]]["chordCont"] is True
    assert profiles[rows[2]["profileKey"]]["chordCont"] is False


def test_techniques_and_tuplet():
    karte = [K(0, techs=["スラー", "スタッカート"])]
    ex = [{"is_rest": False, "is_chord": False, "midis": [64], "names": [], "quarter_length": 1 / 3, "tuplet_actual": 3, "tuplet_normal": 2}]
    rows, profiles, st = build(karte, expanded=ex)
    p = profiles[rows[0]["profileKey"]]
    assert p["techSlur"] and p["techStaccato"] and not p["techTremolo"]
    assert p["tupletActual"] == 3 and p["tupletNormal"] == 2


def test_grace_notes_are_skipped_for_alignment():
    karte = [K(0), K(1, grace=True, dur=0.0), K(2, "F", alter=1, midi=66)]
    rows, profiles, st = build(karte, expanded_to_orig=[0, 1], expanded=[E(karte[0]), E(karte[2])])
    assert st == "ok" and len(rows) == 2 and rows[1]["writtenNoteIndex"] == 2


def test_mismatch_statuses():
    karte = [K(0), K(1, "F", alter=1, midi=66)]
    rows, _, st = build_score_notes([E(karte[0])], [0], 3, karte, 0.5)
    assert st.startswith("ordinal_mismatch")
    rows, _, st = build_score_notes([E(karte[0]), {"is_rest": True, "is_chord": False, "midis": [], "names": [], "quarter_length": 1, "tuplet_actual": None, "tuplet_normal": None}], [0, 1], 2, karte, 0.5)
    assert st.startswith("rest_mismatch")
    bad = dict(E(karte[1])); bad["midis"] = [99]
    rows, _, st = build_score_notes([E(karte[0]), bad], [0, 1], 2, karte, 0.5)
    assert st.startswith("pitch_mismatch")
    rows, _, st = build_score_notes([E(karte[0]), E(karte[1])], [0, None], 2, karte, 0.5)
    assert st.startswith("unresolved")


def test_profile_key_is_deterministic_and_null_free():
    a = make_profile([{"pitch": "E4", "string": "D", "finger": 1, "noteType": "quarter", "dotted": False, "durationBeats": 1.0}],
                     position=1, techs=[], tuplet_actual=0, tuplet_normal=0, on_beat=True, chord_cont=False, rest_before=0.0)
    b = make_profile([{"pitch": "E4", "string": "D", "finger": 1, "noteType": "quarter", "dotted": False, "durationBeats": 1.0}],
                     position=1, techs=[], tuplet_actual=0, tuplet_normal=0, on_beat=True, chord_cont=False, rest_before=0.0)
    c = make_profile([{"pitch": "E4", "string": "D", "finger": 2, "noteType": "quarter", "dotted": False, "durationBeats": 1.0}],
                     position=1, techs=[], tuplet_actual=0, tuplet_normal=0, on_beat=True, chord_cont=False, rest_before=0.0)
    assert a["key"] == b["key"] and a["key"] != c["key"] and len(a["key"]) == 40
    assert all(a[col] is not None for col in PROFILE_COLUMNS)
    assert a["pitch2"] == NONE and a["string2"] == NONE and a["finger2"] == FINGER_NONE and a["durationBeats2"] == -1.0


def test_pitch_names():
    assert pitch_name("F", 1, 4) == "F#4" and pitch_name("B", -1, 4) == "Bb4" and pitch_name(None, 0, 4) == UNKNOWN
    assert pitch_name_from_music21("B-4") == "Bb4" and pitch_name_from_music21("F#4") == "F#4"


def test_score_version_changes_with_sequence():
    karte = [K(0), K(1, "F", alter=1, midi=66)]
    rows, profiles, _ = build(karte)
    v1 = score_version(rows)
    rows2, profiles2, _ = build([K(0), K(1, "G", alter=1, midi=68)])
    rows3, _, _ = build(karte)
    assert v1 == score_version(rows3) and v1 != score_version(rows2)


def test_performance_notes_copy_every_field_and_voices():
    comp = [{"note_index": 3, "measure_number": 1, "note_name": "E4", "pitch_ok": False, "start_ok": True,
             "evaluation_status": "double_stop_partial", "pitch_cents_error": -30.5, "start_diff_sec": 0.02,
             "expected_start_sec": 1.0, "expected_end_sec": 2.0, "expected_pitch_hz": 329.6,
             "detected_start_sec": 1.05, "detected_end_sec": 1.85, "detected_pitch_hz": 325.0, "timing_from_start_sec": 1.05,
             "match_confidence": 0.9, "valid_frames": 40, "global_shift_sec": 0.1, "current_shift_sec": 0.1,
             "onset_count_in_note": 1, "onset_rate_per_sec": 1.2, "pitch_alt_count": None, "pitch_alt_semitones": None,
             "amp_stroke_count": None, "attack_peak_frac": 0.1, "decay_ratio": 0.5,
             "pitches": [{"expected_pitch_hz": 329.6, "detected_pitch_hz": 325.0, "pitch_cents_error": -30.5, "pitch_ok": False, "presence_ok": True},
                         {"expected_pitch_hz": 493.9, "detected_pitch_hz": 494.0, "pitch_cents_error": 0.3, "pitch_ok": True, "presence_ok": True}]}]
    rows = build_performance_notes(comp)
    r = rows[0]
    assert r["noteIndex"] == 3 and r["evaluationStatus"] == "double_stop_partial" and r["pitchOk"] is False
    assert r["expectedHz2"] == 493.9 and r["pitchOk2"] is True and r["expectedHz3"] is None
    assert abs(r["playedSec"] - 0.8) < 1e-9 and abs(r["durRatio"] - 0.8) < 1e-9
    assert set(PERFORMANCE_NOTE_COLUMNS) >= set(k for k in r.keys())


def test_performance_notes_skip_rows_without_index():
    assert build_performance_notes([{"pitch_ok": True}]) == []


def test_alignment_tolerates_extra_karte_element():
    # カルテ側に music21 が読まない要素が1つ余分にある (装飾音扱いの差など)。合わない1音だけ落ち、他は並ぶ
    karte = [K(0, "E", midi=64), K(1, "C", midi=60, dur=0.0), K(2, "F", alter=1, midi=66), K(3, "G", alter=1, midi=68)]
    written = [{"is_rest": False, "midis": [64]}, {"is_rest": False, "midis": [66]}, {"is_rest": False, "midis": [68]}]
    expanded = [E(karte[0]), E(karte[2]), E(karte[3])]
    rows, profiles, st = build_score_notes(expanded, [0, 1, 2], 3, karte, 0.5, written=written)
    assert st == "ok" and len(rows) == 3 and rows[1]["writtenNoteIndex"] == 2


def test_alignment_gives_up_when_parts_differ():
    karte = [K(0, rest=True, dur=4.0), K(1, rest=True, dur=4.0)]
    written = [{"is_rest": False, "midis": [65]}, {"is_rest": False, "midis": [67]}, {"is_rest": False, "midis": [60, 65, 69]}, {"is_rest": False, "midis": [74]}]
    expanded = [{"is_rest": False, "is_chord": False, "midis": [m], "names": [], "quarter_length": 1.0, "tuplet_actual": None, "tuplet_normal": None} for m in (65, 67, 60, 74)]
    rows, _, st = build_score_notes(expanded, [0, 1, 2, 3], 4, karte, 0.5, written=written)
    assert st.startswith("align_failed") and rows == []


def test_alignment_partial_drops_unmatched_and_breaks_prev_chain():
    karte = [K(0, "E", midi=64), K(1, "F", alter=1, midi=66), K(2, "G", alter=1, midi=68)]
    written = [{"is_rest": False, "midis": [64]}, {"is_rest": False, "midis": [99]}, {"is_rest": False, "midis": [68]}]  # 2音目が違う
    expanded = [E(karte[0]), {"is_rest": False, "is_chord": False, "midis": [99], "names": [], "quarter_length": 1.0, "tuplet_actual": None, "tuplet_normal": None}, E(karte[2])]
    rows, _, st = build_score_notes(expanded, [0, 1, 2], 3, karte, 0.5, written=written)
    assert st.startswith("ok_partial") and len(rows) == 2 and rows[1]["prevProfileKey"] is None


def test_bundle_keys_match_reader_rules():
    from lib.note_store import bundle_keys, material_bundle_counts
    def prof(pitch, finger=1, position=1, rest=0.0, **techs):
        p = make_profile([{"pitch": pitch, "string": "D", "finger": finger, "noteType": "quarter", "dotted": False, "durationBeats": 1.0}],
                         position=position, techs=[t for t, v in techs.items() if v], tuplet_actual=0, tuplet_normal=0,
                         on_beat=True, chord_cont=False, rest_before=rest)
        return p
    a = prof("G4"); b = prof("C5", finger=2, position=3, slur=True)
    ks = bundle_keys(b, a, prev_duration_sec=0.2)
    assert "pitch|G4|C5" in ks and "fingering|G4|C5" in ks and "position|1|3|C5" in ks and "technique|slur|C5" in ks
    # 遅い・開放弦・同じ音名・直前に休符 はフィンガリングに入らない
    assert "fingering|G4|C5" not in bundle_keys(b, a, prev_duration_sec=0.5)
    assert "fingering|G4|C5" not in bundle_keys(b, prof("G4", finger=0), 0.2)
    assert "fingering|G4|G4" not in bundle_keys(prof("G4", finger=2), a, 0.2)
    assert "fingering|G4|C5" not in bundle_keys(prof("C5", finger=2, rest=1.0), a, 0.2)
    # 曲頭 (前なし) は移動の束に入らない。奏法は入る
    assert bundle_keys(b, None, None) == ["note|C5", "technique|slur|C5"]
    # 並びから数える: 前の音の秒は直前の行の durationSec
    rows = [{"profileKey": a["key"], "prevProfileKey": None, "durationSec": 0.2}, {"profileKey": b["key"], "prevProfileKey": a["key"], "durationSec": 1.0}]
    counts = material_bundle_counts(rows, {a["key"]: a, b["key"]: b})
    assert counts == {"note|G4": 1, "note|C5": 1, "pitch|G4|C5": 1, "fingering|G4|C5": 1, "position|1|3|C5": 1, "technique|slur|C5": 1}
    # 重音は隣り合う構成音の度数の束に入る
    from lib.note_store import chord_interval_label, split_bundle_key
    ch = make_profile([{"pitch": "G3", "string": "G", "finger": 0, "noteType": "whole", "dotted": False, "durationBeats": 4.0},
                       {"pitch": "D4", "string": "D", "finger": 0, "noteType": "whole", "dotted": False, "durationBeats": 4.0}],
                      position=1, techs=[], tuplet_actual=0, tuplet_normal=0, on_beat=True, chord_cont=False, rest_before=0.0)
    assert "chord|5度|G3" in bundle_keys(ch, None, None)
    assert chord_interval_label("G4", "B4") == "3度" and chord_interval_label("G4", "G5") == "オクターブ" and chord_interval_label("G4", "A5") == "その他"
    assert split_bundle_key("pitch|G4|C5") == ("pitch", "G4", "C5") and split_bundle_key("technique|slur|C5") == ("technique", "slur", "C5") and split_bundle_key("chord|5度") == ("chord", "", "5度") and split_bundle_key("position|1|3|C5") == ("position", "1", "3")
