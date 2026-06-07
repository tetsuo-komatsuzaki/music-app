"""
subtask_judges.py — 個別課題 v1 (2026-05-25) スケルトン

旧 9 sub task (pitch_overall/pitch_high/pitch_chromatic、rhythm_overall/rhythm_fast/
rhythm_after_rest、string_change_volume/slur/timing) は完全廃止し、新 57 項目
+ 将来検討 2 = 計 59 項目のスケルトン実装に置換。

各項目の本判定ロジックは別タスクで段階的に充填:
  [[project_subtask_quality_judgment_deferred]] (音色軸の音声側品質判定)
  + 抽出ロジック全般 (Tetsuo 「またあとで精査」確定 2026-05-25)

現状の挙動:
  - 全 sub_task が target_count=0 を返す → skill_aggregator では集計対象外
  - 中項目スコア (pitch / rhythm / bowing) は配下全 0 件のため None になる
  - Phase 3b の MissingPracticeItemFlag 生成は走るが target=0 のため発火せず
  - 既存音響解析 (pitch_ok / start_ok per note) は analyze_performance.py で別途実行
    されており、本ファイル変更の影響なし

本ファイルの判定ロジックを段階的に実装する際は、各 sub_task_id の helper を
追加して run_all_judges からの呼び出しに置換する。
"""

from __future__ import annotations

from typing import Callable, List

from .integrated_note import (
    IntegratedNote,
    IntegratedScoreData,
    SubTaskResult,
    calculate_subtask_score_hybrid,
)


# 解析可能性の検出割合閾値 (旧来踏襲、v3.2 §6-3 A1)
DETECTION_RATE_MIN = 0.50


# 発火条件 (課題カード化) の閾値。
# [[project_skill_scoring_firing_spec]] 2026-06-07 Tetsuo 確定:
#   matched = (target_count >= FIRE_MIN_SAMPLES) かつ (score < FIRE_SCORE_THRESHOLD)
FIRE_MIN_SAMPLES = 3
FIRE_SCORE_THRESHOLD = 70.0


# ---------------------------------------------------------------------------
# 個別課題 v1 全 59 項目の sub_task_id
# (TS app/_libs/skillMaster.ts SUB_TASK_IDS と一対一対応)
# ---------------------------------------------------------------------------

ALL_SUB_TASK_IDS: list[str] = [
    # ─── 音程 (18) ───
    "pitch_position_2", "pitch_position_3", "pitch_position_4", "pitch_position_5plus",
    "pitch_shift_up", "pitch_shift_down",
    "pitch_double_stop_2", "pitch_double_stop_3plus", "pitch_double_stop_continuous",
    "pitch_harmonic",
    "pitch_interval_up_2nd_plus", "pitch_interval_up_3rd_plus",
    "pitch_interval_down_2nd_plus", "pitch_interval_down_3rd_plus",
    "pitch_finger_1", "pitch_finger_2", "pitch_finger_3", "pitch_finger_4",
    # ─── リズム (17、うち 1 将来検討) ───
    "rhythm_value_whole", "rhythm_value_half", "rhythm_value_16th",
    "rhythm_value_32nd_plus", "rhythm_value_dotted",
    "rhythm_pattern_triplet", "rhythm_pattern_2plet_plus",
    "rhythm_entry_after_rest",
    "rhythm_technique_martele", "rhythm_technique_staccato", "rhythm_technique_spiccato",
    "rhythm_technique_ricochet",  # 将来検討
    "rhythm_technique_tremolo", "rhythm_technique_portato", "rhythm_technique_trill",
    "rhythm_technique_arpeggio", "rhythm_technique_glissando",
    # ─── 弦移動 (24、うち 1 将来検討) ───
    "bowing_technique_staccato", "bowing_technique_hooked_staccato",
    "bowing_technique_spiccato",
    "bowing_technique_ricochet",  # 将来検討
    "bowing_technique_pizzicato", "bowing_technique_tremolo",
    "bowing_technique_portato", "bowing_technique_trill",
    "bowing_technique_arpeggio", "bowing_technique_glissando",
    "bowing_technique_harmonic",
    "bowing_string_g", "bowing_string_d", "bowing_string_a", "bowing_string_e",
    "bowing_string_change_g_to_d", "bowing_string_change_d_to_g",
    "bowing_string_change_d_to_a", "bowing_string_change_a_to_d",
    "bowing_string_change_a_to_e", "bowing_string_change_e_to_a",
    "bowing_double_stop_2", "bowing_double_stop_3plus", "bowing_double_stop_continuous",
]


# ---------------------------------------------------------------------------
# 解析可能性チェック (旧来踏襲、v3 §6-3 A1)
# ---------------------------------------------------------------------------


def is_performance_analyzable(data: IntegratedScoreData) -> bool:
    """A1 確定：検出割合 < 50% なら解析スキップ。

    Returns:
        True なら解析可能、False なら全 sub task 判定をスキップして null を返す
    """
    non_rest_notes = [n for n in data.notes if not n.is_rest]
    if not non_rest_notes:
        return False

    detected_count = sum(1 for n in non_rest_notes if n.is_detected)
    detection_rate = detected_count / len(non_rest_notes)

    return detection_rate >= DETECTION_RATE_MIN


# ---------------------------------------------------------------------------
# スケルトン判定 (target_count=0 で集計対象外を返す)
# ---------------------------------------------------------------------------


def _skipped_result(sub_task_id: str) -> SubTaskResult:
    """個別課題 v1 暫定スケルトン: 評価対象なし (target_count=0) を返す。

    各項目の本実装は別タスクで段階的に充填する。
    """
    return SubTaskResult(
        sub_task_id=sub_task_id,
        score=0.0,
        matched=False,
        sample_size=0,
        target_count=0,
        bad_count=0,
        details=None,
        details_with_count=None,
    )


# ---------------------------------------------------------------------------
# 第一弾スキル判定 (属性で即時実装可能、IntegratedNote に属性あり)
# [[project_skill_scoring_firing_spec]] 2026-06-07 確定:
#   ① 点 = 対象音符のうち OK だった割合 (calculate_subtask_score_hybrid)
#       - 音程系 → OK = pitch_ok
#       - リズム系 → OK = start_ok
#       - 弓・弦系 → OK = pitch_ok かつ start_ok
#       対象 = 属性で絞った非休符音符のうち、該当 ok が None でない (評価可能) もの
#   ② 発火 (matched=True) = target_count >= 3 かつ score < 70
# ---------------------------------------------------------------------------


# 弦 ID は IntegratedNote.string_id では大文字 ("G"/"D"/"A"/"E")、
# sub_task_id では小文字 (g/d/a/e) のため対応表で橋渡しする。
_STRING_LABEL: dict[str, str] = {"g": "G", "d": "D", "a": "A", "e": "E"}


def _pitch_evaluable(n: IntegratedNote) -> bool:
    """音程系: pitch_ok が判定済み (None でない) なら評価可能。"""
    return n.pitch_ok is not None


def _pitch_bad(n: IntegratedNote) -> bool:
    return n.pitch_ok is False


def _timing_evaluable(n: IntegratedNote) -> bool:
    """リズム系: start_ok が判定済みなら評価可能。"""
    return n.start_ok is not None


def _timing_bad(n: IntegratedNote) -> bool:
    return n.start_ok is False


def _bow_evaluable(n: IntegratedNote) -> bool:
    """弓・弦系: pitch_ok と start_ok の両方が判定済みなら評価可能。"""
    return n.pitch_ok is not None and n.start_ok is not None


def _bow_bad(n: IntegratedNote) -> bool:
    return n.pitch_ok is False or n.start_ok is False


def _judge(
    sub_task_id: str,
    target_notes: List[IntegratedNote],
    is_bad: Callable[[IntegratedNote], bool],
) -> SubTaskResult:
    """対象音符と is_bad から SubTaskResult を組み立てる (① 点 + ② 発火)。

    target_notes は呼び出し側で「属性で絞った非休符かつ評価可能」に絞り込み済み。
    target_count == 0 のときは calculate_subtask_score_hybrid が score=100 を返し、
    matched=False (skill_aggregator が集計から除外) になる。
    """
    score, target_count, bad_count = calculate_subtask_score_hybrid(
        target_notes, is_bad
    )
    matched = target_count >= FIRE_MIN_SAMPLES and score < FIRE_SCORE_THRESHOLD
    return SubTaskResult(
        sub_task_id=sub_task_id,
        score=score,
        matched=matched,
        sample_size=target_count,
        target_count=target_count,
        bad_count=bad_count,
        details=None,
        details_with_count=None,
    )


def _judge_string(data: IntegratedScoreData, sub_task_id: str, label: str) -> SubTaskResult:
    """bowing_string_{g,d,a,e}: 指定弦上の非休符音符。OK = 音程かつタイミング。"""
    targets = [
        n
        for n in data.notes
        if not n.is_rest and n.string_id == label and _bow_evaluable(n)
    ]
    return _judge(sub_task_id, targets, _bow_bad)


def _judge_finger(data: IntegratedScoreData, sub_task_id: str, finger: int) -> SubTaskResult:
    """pitch_finger_{1..4}: 指定運指の非休符音符。OK = 音程。"""
    targets = [
        n
        for n in data.notes
        if not n.is_rest and n.finger == finger and _pitch_evaluable(n)
    ]
    return _judge(sub_task_id, targets, _pitch_bad)


def _judge_string_change(
    data: IntegratedScoreData, sub_task_id: str, src: str, dst: str
) -> SubTaskResult:
    """bowing_string_change_{src}_to_{dst}: 連続非休符で src→dst に弦移動した音符。

    対象 = 直前の非休符音符が src 弦、当該音符が dst 弦の遷移先音符。OK = 音程かつタイミング。
    """
    non_rest = [n for n in data.notes if not n.is_rest]
    targets = [
        curr
        for prev, curr in zip(non_rest, non_rest[1:])
        if prev.string_id == src and curr.string_id == dst and _bow_evaluable(curr)
    ]
    return _judge(sub_task_id, targets, _bow_bad)


def _judge_after_rest(data: IntegratedScoreData) -> SubTaskResult:
    """rhythm_entry_after_rest: 直前が休符だった音符の入り。OK = タイミング。"""
    targets = [
        n
        for n in data.notes
        if not n.is_rest and n.is_after_rest and _timing_evaluable(n)
    ]
    return _judge("rhythm_entry_after_rest", targets, _timing_bad)


# ---------------------------------------------------------------------------
# 第二弾 2a: 重音 (double stop) / ハーモニクス (2026-06-07)
# is_chord / pitch_count / is_harmonic は note_integration が analysis.json から配線。
# ---------------------------------------------------------------------------


def _continuous_chord_ids(data: IntegratedScoreData) -> set[int]:
    """連続する重音（前後どちらかの非休符音符も重音）の id 集合を返す。"""
    non_rest = [n for n in data.notes if not n.is_rest]
    result: set[int] = set()
    for i, n in enumerate(non_rest):
        if not n.is_chord:
            continue
        prev_chord = i > 0 and non_rest[i - 1].is_chord
        next_chord = i < len(non_rest) - 1 and non_rest[i + 1].is_chord
        if prev_chord or next_chord:
            result.add(id(n))
    return result


def _judge_double_stop(
    data: IntegratedScoreData,
    sub_task_id: str,
    predicate: Callable[[IntegratedNote], bool],
    is_pitch_axis: bool,
) -> SubTaskResult:
    """重音 sub_task。pitch 系は OK=音程、bowing 系は OK=音程かつタイミング。"""
    evaluable = _pitch_evaluable if is_pitch_axis else _bow_evaluable
    is_bad = _pitch_bad if is_pitch_axis else _bow_bad
    targets = [
        n
        for n in data.notes
        if not n.is_rest and n.is_chord and predicate(n) and evaluable(n)
    ]
    return _judge(sub_task_id, targets, is_bad)


def _judge_harmonic(
    data: IntegratedScoreData, sub_task_id: str, is_pitch_axis: bool
) -> SubTaskResult:
    """ハーモニクス sub_task。pitch 系は OK=音程、bowing 系は OK=音程かつタイミング。"""
    evaluable = _pitch_evaluable if is_pitch_axis else _bow_evaluable
    is_bad = _pitch_bad if is_pitch_axis else _bow_bad
    targets = [
        n
        for n in data.notes
        if not n.is_rest and n.is_harmonic and evaluable(n)
    ]
    return _judge(sub_task_id, targets, is_bad)


# ---------------------------------------------------------------------------
# 第二弾 2b: 音程の跳躍 (pitch_interval) (2026-06-07, 2度/3度を重複なしに分割)
# 直前の非休符音からの半音差で判定。重複なし: 2度=|Δ| 1〜2半音, 3度以上=|Δ|>=3半音。
# 方向で up/down。OK = 音程。expected_pitch_midi は note_integration が pitches[0] 補完。
# 注: sub_task_id は _2nd_plus のままだが意味は「2度(1〜2半音)」(3度以上と非入れ子)。
# ---------------------------------------------------------------------------


def _run_interval_judges(data: IntegratedScoreData) -> dict[str, SubTaskResult]:
    non_rest = [n for n in data.notes if not n.is_rest]
    up2: List[IntegratedNote] = []
    up3: List[IntegratedNote] = []
    down2: List[IntegratedNote] = []
    down3: List[IntegratedNote] = []
    prev_midi: int | None = None
    for n in non_rest:
        cur_midi = n.expected_pitch_midi
        if cur_midi is not None and prev_midi is not None and _pitch_evaluable(n):
            delta = cur_midi - prev_midi
            if 1 <= delta <= 2:
                up2.append(n)
            elif delta >= 3:
                up3.append(n)
            elif -2 <= delta <= -1:
                down2.append(n)
            elif delta <= -3:
                down3.append(n)
        if cur_midi is not None:
            prev_midi = cur_midi
    return {
        "pitch_interval_up_2nd_plus": _judge("pitch_interval_up_2nd_plus", up2, _pitch_bad),
        "pitch_interval_up_3rd_plus": _judge("pitch_interval_up_3rd_plus", up3, _pitch_bad),
        "pitch_interval_down_2nd_plus": _judge("pitch_interval_down_2nd_plus", down2, _pitch_bad),
        "pitch_interval_down_3rd_plus": _judge("pitch_interval_down_3rd_plus", down3, _pitch_bad),
    }


# ---------------------------------------------------------------------------
# 第二弾 2c: 音価 (rhythm_value) / 連符 (rhythm_pattern) (2026-06-07)
# 音符の長さ(拍 = duration_sec / (60/bpm) = quarterLength)で分類。OK = タイミング。
# 楽譜由来の duration なので整数比でクリーン。連符は ql×3 が2のべき(3連符)で判定。
# 2plet_plus(2連符等)は拍値からの判別が曖昧なため保留(スケルトン)。
# ---------------------------------------------------------------------------


def _near(a: float, b: float, tol: float = 0.06) -> bool:
    return abs(a - b) < tol


def _is_dotted_value(ql: float) -> bool:
    """付点音価 (1.5 × 2のべき): 6/3/1.5/0.75/0.375 拍。"""
    return any(_near(ql, base) for base in (6.0, 3.0, 1.5, 0.75, 0.375))


def _is_tuplet_note(n: IntegratedNote) -> bool:
    """楽譜上の連符 (tuplet_actual >= 2)。秒では2連符と付点が区別不可のため、
    楽譜の連符マーク (analyze_musicxml の tuplet_actual) を正本にする。"""
    return n.tuplet_actual is not None and n.tuplet_actual >= 2


def _run_value_judges(data: IntegratedScoreData) -> dict[str, SubTaskResult]:
    spb = 60.0 / data.bpm if data.bpm else 0.0
    results: dict[str, SubTaskResult] = {}
    if spb <= 0:
        return results

    def ql_of(n: IntegratedNote) -> float:
        return (n.expected_end_sec - n.expected_start_sec) / spb

    non_rest_eval = [
        n for n in data.notes if not n.is_rest and _timing_evaluable(n)
    ]

    def by(pred: Callable[[IntegratedNote], bool]) -> List[IntegratedNote]:
        return [n for n in non_rest_eval if pred(n)]

    # 連符 (楽譜の tuplet マークが正本): 3連符 = tuplet_actual==3,
    # 2連符以上 = 連符かつ 3連符でない (2連符/5連符/…)
    results["rhythm_pattern_triplet"] = _judge(
        "rhythm_pattern_triplet", by(lambda n: n.tuplet_actual == 3), _timing_bad
    )
    results["rhythm_pattern_2plet_plus"] = _judge(
        "rhythm_pattern_2plet_plus",
        by(lambda n: _is_tuplet_note(n) and n.tuplet_actual != 3),
        _timing_bad,
    )

    # 音価/付点は「連符でない音」だけを長さ(拍)で分類
    results["rhythm_value_dotted"] = _judge(
        "rhythm_value_dotted",
        by(lambda n: not _is_tuplet_note(n) and _is_dotted_value(ql_of(n))),
        _timing_bad,
    )

    def plain(target: float) -> Callable[[IntegratedNote], bool]:
        return lambda n: (
            not _is_tuplet_note(n)
            and _near(ql_of(n), target)
            and not _is_dotted_value(ql_of(n))
        )

    results["rhythm_value_whole"] = _judge("rhythm_value_whole", by(plain(4.0)), _timing_bad)
    results["rhythm_value_half"] = _judge("rhythm_value_half", by(plain(2.0)), _timing_bad)
    results["rhythm_value_16th"] = _judge("rhythm_value_16th", by(plain(0.25)), _timing_bad)
    results["rhythm_value_32nd_plus"] = _judge(
        "rhythm_value_32nd_plus",
        by(lambda n: not _is_tuplet_note(n) and ql_of(n) < 0.1875),
        _timing_bad,
    )
    return results


# ---------------------------------------------------------------------------
# 第二弾 2d: ポジション (pitch_position) / ポジション移動 (pitch_shift) (2026-06-07)
# string_id + finger + pitch からポジション番号を近似推定。OK = 音程。
# 注: 指の間隔は調(長/短)で変わるため厳密なポジションは決まらない。標準的な
#   「弦の開放からの半音距離 − 指オフセット ≒ ポジション(2半音で+1)」で best-effort 推定。
# ---------------------------------------------------------------------------

_OPEN_STRING_MIDI: dict[str, int] = {"G": 55, "D": 62, "A": 69, "E": 76}
# 1指から各指までの標準的な半音間隔(長調寄りの既定)。近似のため厳密ではない。
_FINGER_GAP: dict[int, int] = {1: 0, 2: 2, 3: 4, 4: 5}


def _violin_position(n: IntegratedNote) -> Optional[int]:
    """string_id + finger + pitch からポジション番号(1〜5+)を近似推定。
    開放弦(finger 0)・情報不足は None (対象外)。"""
    open_midi = _OPEN_STRING_MIDI.get(n.string_id or "")
    if open_midi is None or not n.finger:  # finger None/0(開放) は対象外
        return None
    midi = n.expected_pitch_midi
    if midi is None:
        return None
    # 1指の位置(半音) ≒ 音の半音距離 − 指オフセット
    first_finger_semitones = (midi - open_midi) - _FINGER_GAP.get(n.finger, 0)
    if first_finger_semitones <= 2:
        return 1
    if first_finger_semitones <= 4:
        return 2
    if first_finger_semitones <= 6:
        return 3
    if first_finger_semitones <= 8:
        return 4
    return 5


def _run_position_judges(data: IntegratedScoreData) -> dict[str, SubTaskResult]:
    non_rest = [n for n in data.notes if not n.is_rest]
    pos_by_id: dict[int, Optional[int]] = {id(n): _violin_position(n) for n in non_rest}

    def in_pos(pred: Callable[[int], bool]) -> List[IntegratedNote]:
        return [
            n for n in non_rest
            if pos_by_id[id(n)] is not None
            and pred(pos_by_id[id(n)])
            and _pitch_evaluable(n)
        ]

    results: dict[str, SubTaskResult] = {
        "pitch_position_2": _judge("pitch_position_2", in_pos(lambda p: p == 2), _pitch_bad),
        "pitch_position_3": _judge("pitch_position_3", in_pos(lambda p: p == 3), _pitch_bad),
        "pitch_position_4": _judge("pitch_position_4", in_pos(lambda p: p == 4), _pitch_bad),
        "pitch_position_5plus": _judge("pitch_position_5plus", in_pos(lambda p: p >= 5), _pitch_bad),
    }

    # ポジション移動: 直前の(ポジションが取れる)音から番号が変わった音。OK = 音程。
    up: List[IntegratedNote] = []
    down: List[IntegratedNote] = []
    prev_pos: Optional[int] = None
    for n in non_rest:
        p = pos_by_id[id(n)]
        if p is not None and prev_pos is not None and p != prev_pos and _pitch_evaluable(n):
            (up if p > prev_pos else down).append(n)
        if p is not None:
            prev_pos = p
    results["pitch_shift_up"] = _judge("pitch_shift_up", up, _pitch_bad)
    results["pitch_shift_down"] = _judge("pitch_shift_down", down, _pitch_bad)
    return results


# ---------------------------------------------------------------------------
# 第二弾 2e: 奏法 (rhythm_technique_* / bowing_technique_*) (2026-06-07)
# analysis.json の articulations(music21クラス名) / is_tremolo / is_trill で対象を絞る。
# OK = リズム系→タイミング, 弓系→音程&タイミング (音色の品質判定は後回し[[..deferred]])。
# 確実に検出できる奏法のみ実装。martele/hooked_staccato/ricochet/arpeggio/glissando は
# 確実な検出手段が無いためスケルトン据置。
# ---------------------------------------------------------------------------

# 奏法 suffix → 検出関数 (該当音符か)
_TECH_DETECTORS: dict[str, Callable[[IntegratedNote], bool]] = {
    "staccato": lambda n: any(a in ("Staccato", "Staccatissimo") for a in n.articulations),
    "spiccato": lambda n: "Spiccato" in n.articulations,
    "pizzicato": lambda n: "Pizzicato" in n.articulations,
    "portato": lambda n: any(a in ("DetachedLegato", "Tenuto") for a in n.articulations),
    "tremolo": lambda n: n.is_tremolo,
    "trill": lambda n: n.is_trill,
}


def _judge_technique(
    data: IntegratedScoreData,
    sub_task_id: str,
    detector: Callable[[IntegratedNote], bool],
    axis: str,
) -> SubTaskResult:
    """奏法 sub_task。axis='rhythm'→OK=タイミング, 'bowing'→OK=音程&タイミング。"""
    evaluable = _timing_evaluable if axis == "rhythm" else _bow_evaluable
    is_bad = _timing_bad if axis == "rhythm" else _bow_bad
    targets = [
        n for n in data.notes if not n.is_rest and detector(n) and evaluable(n)
    ]
    return _judge(sub_task_id, targets, is_bad)


def _run_technique_judges(data: IntegratedScoreData) -> dict[str, SubTaskResult]:
    all_ids = set(ALL_SUB_TASK_IDS)
    results: dict[str, SubTaskResult] = {}
    for tech, detector in _TECH_DETECTORS.items():
        rid = f"rhythm_technique_{tech}"
        if rid in all_ids:
            results[rid] = _judge_technique(data, rid, detector, "rhythm")
        bid = f"bowing_technique_{tech}"
        if bid in all_ids:
            results[bid] = _judge_technique(data, bid, detector, "bowing")
    return results


def _run_chord_harmonic_judges(data: IntegratedScoreData) -> dict[str, SubTaskResult]:
    """第二弾 2a: 重音 (2/3plus/continuous) × pitch/bowing + ハーモニクス × pitch/bowing。"""
    cont_ids = _continuous_chord_ids(data)
    preds: dict[str, Callable[[IntegratedNote], bool]] = {
        "2": lambda n: n.pitch_count == 2,
        "3plus": lambda n: n.pitch_count >= 3,
        "continuous": lambda n: id(n) in cont_ids,
    }
    results: dict[str, SubTaskResult] = {}
    for suffix, pred in preds.items():
        results[f"pitch_double_stop_{suffix}"] = _judge_double_stop(
            data, f"pitch_double_stop_{suffix}", pred, is_pitch_axis=True
        )
        results[f"bowing_double_stop_{suffix}"] = _judge_double_stop(
            data, f"bowing_double_stop_{suffix}", pred, is_pitch_axis=False
        )
    results["pitch_harmonic"] = _judge_harmonic(data, "pitch_harmonic", is_pitch_axis=True)
    results["bowing_technique_harmonic"] = _judge_harmonic(
        data, "bowing_technique_harmonic", is_pitch_axis=False
    )
    return results


def _run_first_batch_judges(
    data: IntegratedScoreData,
) -> dict[str, SubTaskResult]:
    """第一弾スキルの本判定を実行し sub_task_id → SubTaskResult を返す。"""
    results: dict[str, SubTaskResult] = {}

    # 弦 (G/D/A/E)
    for key, label in _STRING_LABEL.items():
        results[f"bowing_string_{key}"] = _judge_string(
            data, f"bowing_string_{key}", label
        )

    # 運指 (1〜4)
    for finger in (1, 2, 3, 4):
        results[f"pitch_finger_{finger}"] = _judge_finger(
            data, f"pitch_finger_{finger}", finger
        )

    # 弦移動 (隣接弦の双方向)
    for src_key, dst_key in (
        ("g", "d"), ("d", "g"), ("d", "a"), ("a", "d"), ("a", "e"), ("e", "a"),
    ):
        sub_id = f"bowing_string_change_{src_key}_to_{dst_key}"
        results[sub_id] = _judge_string_change(
            data, sub_id, _STRING_LABEL[src_key], _STRING_LABEL[dst_key]
        )

    # 休符明けの入り
    results["rhythm_entry_after_rest"] = _judge_after_rest(data)

    return results


def run_all_judges(data: IntegratedScoreData) -> dict[str, SubTaskResult]:
    """個別課題 v1 全 59 項目の判定を実行する。

    第一弾 (弦・運指・弦移動・休符明け) + 第二弾 2a (重音・ハーモニクス) は
    本判定を行い、それ以外はスケルトン (target_count=0、集計対象外) を返す。
    残りの第二弾 (ポジション/音程跳躍/音価/連符/奏法) は属性追加 or 音声側品質
    判定が必要なため別 PR で段階的に充填する ([[project_skill_scoring_firing_spec]])。

    Returns:
        sub_task_id をキーとする SubTaskResult の辞書 (全 59 エントリ)
    """
    implemented: dict[str, SubTaskResult] = {}
    implemented.update(_run_first_batch_judges(data))
    implemented.update(_run_chord_harmonic_judges(data))
    implemented.update(_run_interval_judges(data))
    implemented.update(_run_value_judges(data))
    implemented.update(_run_position_judges(data))
    implemented.update(_run_technique_judges(data))
    return {
        sub_id: implemented.get(sub_id) or _skipped_result(sub_id)
        for sub_id in ALL_SUB_TASK_IDS
    }
