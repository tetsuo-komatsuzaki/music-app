"""
subtask_judges.py — 弓（bowing）採点の判定器（C-6b スリム化 2026-07-11）

【このファイルの役割 — 他の人が読むときはここだけ理解すればOK】
  マスター判定は「直近5回の演奏スコア(overallScore)平均90点」で、
    overallScore = (音程 + リズム + 弓) ÷ 3
  のうち音程・リズムは analyze_performance の音符照合から出るが、
  **弓（bowing）だけは本ファイル群が唯一の計算元**。
  弦ごとの安定性・弦移動・奏法品質（スタッカートの短さ等）を判定して
  bowing スコア(0-100)を作り、bowingAccuracy → overallScore に流れる。

【歴史】旧55課題体系はこの判定器を「①課題化（カード生成）」と「②採点」の
  両方に使っていた。①は217診断体系（lib/diagnosis.py）に置換済みのため、
  2026-07-11 に音程系18項目・リズム系14項目の判定器を削除し、②の弓採点
  23項目のみを残した（旧実装は git 履歴 6a35f16 以前を参照）。

判定ルール（[[project_skill_scoring_firing_spec]] 2026-06-07 確定を踏襲）:
  ① 点 = 対象音符のうち OK だった割合。弓系の OK = 音程かつタイミング
  ② 対象 = 属性で絞った非休符音符のうち評価可能（pitch_ok/start_ok が非None）なもの
  奏法品質（staccato の dur_ratio 等）は ① に AND される。しきい値は暫定
  ([[project_technique_threshold_calibration_pending]])。
"""

from __future__ import annotations

from typing import Callable, List, Optional

from .integrated_note import (
    IntegratedNote,
    IntegratedScoreData,
    SubTaskResult,
    calculate_subtask_score_hybrid,
)


# 解析可能性の検出割合閾値 (旧来踏襲、v3.2 §6-3 A1)
DETECTION_RATE_MIN = 0.50

# スコア集計の最低サンプル数 (2026-06-07 Tetsuo 確定)。
# target_count < FIRE_MIN_SAMPLES の項目は 1〜2音の偶発ミスで点が暴れるため集計除外。
FIRE_MIN_SAMPLES = 3
FIRE_SCORE_THRESHOLD = 70.0


# ---------------------------------------------------------------------------
# 弓採点 23 項目（旧55項目のうち bowing 系のみ。pitch/rhythm 系は217診断に移行済）
# ---------------------------------------------------------------------------

BOWING_SUB_TASK_IDS: list[str] = [
    "bowing_technique_staccato",
    "bowing_technique_spiccato",
    "bowing_technique_pizzicato", "bowing_technique_tremolo",
    "bowing_technique_portato", "bowing_technique_trill",
    "bowing_technique_glissando",
    "bowing_technique_harmonic",
    # 連続スタッカート/スピッカート。粒の均一性は別軸で後日
    # ([[project_evenness_quality_axis_pending]])。
    "bowing_technique_staccato_continuous", "bowing_technique_spiccato_continuous",
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
    """A1 確定：検出割合 < 50% なら採点スキップ。"""
    non_rest_notes = [n for n in data.notes if not n.is_rest]
    if not non_rest_notes:
        return False
    detected_count = sum(1 for n in non_rest_notes if n.is_detected)
    return detected_count / len(non_rest_notes) >= DETECTION_RATE_MIN


def _skipped_result(sub_task_id: str) -> SubTaskResult:
    """評価対象なし (target_count=0) = 集計対象外。"""
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
# 共通述語・組み立て
# ---------------------------------------------------------------------------

# 弦 ID は IntegratedNote.string_id では大文字 ("G"/"D"/"A"/"E")、
# sub_task_id では小文字 (g/d/a/e) のため対応表で橋渡しする。
_STRING_LABEL: dict[str, str] = {"g": "G", "d": "D", "a": "A", "e": "E"}


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
    """対象音符と is_bad から SubTaskResult を組み立てる。"""
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


def _judge_string_change(
    data: IntegratedScoreData, sub_task_id: str, src: str, dst: str
) -> SubTaskResult:
    """bowing_string_change_{src}_to_{dst}: 直前の非休符音符が src 弦、
    当該音符が dst 弦の遷移先音符。OK = 音程かつタイミング。"""
    non_rest = [n for n in data.notes if not n.is_rest]
    targets = [
        curr
        for prev, curr in zip(non_rest, non_rest[1:])
        if prev.string_id == src and curr.string_id == dst and _bow_evaluable(curr)
    ]
    return _judge(sub_task_id, targets, _bow_bad)


# ---------------------------------------------------------------------------
# 重音 / ハーモニクス（弓軸のみ）
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
) -> SubTaskResult:
    """重音 sub_task（弓軸）。OK = 音程かつタイミング。"""
    targets = [
        n
        for n in data.notes
        if not n.is_rest and n.is_chord and predicate(n) and _bow_evaluable(n)
    ]
    return _judge(sub_task_id, targets, _bow_bad)


def _judge_harmonic(data: IntegratedScoreData, sub_task_id: str) -> SubTaskResult:
    """ハーモニクス sub_task（弓軸）。OK = 音程かつタイミング。"""
    targets = [
        n
        for n in data.notes
        if not n.is_rest and n.is_harmonic and _bow_evaluable(n)
    ]
    return _judge(sub_task_id, targets, _bow_bad)


def _run_chord_harmonic_judges(data: IntegratedScoreData) -> dict[str, SubTaskResult]:
    cont_ids = _continuous_chord_ids(data)
    preds: dict[str, Callable[[IntegratedNote], bool]] = {
        "2": lambda n: n.pitch_count == 2,
        "3plus": lambda n: n.pitch_count >= 3,
        "continuous": lambda n: id(n) in cont_ids,
    }
    results: dict[str, SubTaskResult] = {}
    for suffix, pred in preds.items():
        results[f"bowing_double_stop_{suffix}"] = _judge_double_stop(
            data, f"bowing_double_stop_{suffix}", pred
        )
    results["bowing_technique_harmonic"] = _judge_harmonic(
        data, "bowing_technique_harmonic"
    )
    return results


# ---------------------------------------------------------------------------
# 奏法（bowing_technique_*）
# analysis.json の articulations(music21クラス名) / is_tremolo / is_trill で対象を絞る。
# OK = 音程&タイミング + 奏法品質(あれば AND)。
# ---------------------------------------------------------------------------

# 奏法 suffix → 検出関数 (該当音符か)
_TECH_DETECTORS: dict[str, Callable[[IntegratedNote], bool]] = {
    "staccato": lambda n: any(a in ("Staccato", "Staccatissimo") for a in n.articulations),
    "spiccato": lambda n: "Spiccato" in n.articulations,
    "pizzicato": lambda n: "Pizzicato" in n.articulations,
    "portato": lambda n: any(a in ("DetachedLegato", "Tenuto") for a in n.articulations),
    "tremolo": lambda n: n.is_tremolo,
    "trill": lambda n: n.is_trill,
    "glissando": lambda n: bool(n.is_glissando),
}

# 奏法品質しきい値 (2e 段階1/2 2026-06-08)。
# ※ 暫定値。奏法を含む実演サンプルで分布を見て要チューニング
#   ([[feedback_spec_premise_verification]] / [[project_technique_threshold_calibration_pending]])。
_DUR_RATIO_STACCATO_MAX = 0.5   # staccato/spiccato: これ以下なら「短く切れている」=OK
_DUR_RATIO_PORTATO_MIN = 0.5    # portato: 切るが切りすぎない範囲 (軽い分離)
_DUR_RATIO_PORTATO_MAX = 0.85
_TREMOLO_ACHIEVE_FRAC = 0.6     # tremolo: 楽譜の期待反復数のこの割合以上を実演で達成すれば OK
_TREMOLO_FINGERED_MIN_SEMITONES = 1.0  # 指トレモロ: 2音が実際にこの半音以上離れて往復していること


# 奏法 suffix → 品質判定 (note → Optional[bool])。
#   True  = 奏法として正しく弾けている / False = NG / None = 測れない(対象外)
def _q_staccato(n: IntegratedNote) -> Optional[bool]:
    if n.dur_ratio is None:
        return None
    return n.dur_ratio <= _DUR_RATIO_STACCATO_MAX


def _q_portato(n: IntegratedNote) -> Optional[bool]:
    if n.dur_ratio is None:
        return None
    return _DUR_RATIO_PORTATO_MIN <= n.dur_ratio <= _DUR_RATIO_PORTATO_MAX


def _tremolo_expected_reps(n: IntegratedNote, bpm: float) -> Optional[float]:
    """楽譜が要求する反復数 = 音価(4分音符換算) × 2^marks。テンポ非依存(刻みは音価で決まる)。"""
    if n.tremolo_marks is None or bpm <= 0:
        return None
    dur_quarters = (n.expected_end_sec - n.expected_start_sec) * bpm / 60.0
    if dur_quarters <= 0:
        return None
    return dur_quarters * (2 ** n.tremolo_marks)


def _make_tremolo_quality(bpm: float) -> Callable[[IntegratedNote], Optional[bool]]:
    """tremolo の②奏法OK。type で特徴量を切替え、marks+音価の期待反復数と比較(テンポ考慮)。
    ※ 回数モデルは欠陥ありで凍結中 ([[project_technique_threshold_calibration_pending]])。
    """
    def q(n: IntegratedNote) -> Optional[bool]:
        expected = _tremolo_expected_reps(n, bpm)
        if expected is None:
            return None
        need = expected * _TREMOLO_ACHIEVE_FRAC
        if n.tremolo_type == "fingered":
            if n.pitch_alt_count is None or n.pitch_alt_semitones is None:
                return None
            if n.pitch_alt_semitones < _TREMOLO_FINGERED_MIN_SEMITONES:
                return False  # 2音交互になっていない(ビブラート/単音)
            return n.pitch_alt_count >= need
        if n.tremolo_type == "bowed":
            if n.amp_stroke_count is None:
                return None
            return n.amp_stroke_count >= need
        return None  # 種別不明は測れない

    return q


# 段階3 (2026-06-08) トリル/ピチカート。暫定値([[project_technique_threshold_calibration_pending]])。
_TRILL_MIN_ALTERNATIONS = 4     # トリル: f0 往復がこれ以上
_TRILL_MIN_SEMITONES = 0.7      # トリル: 主音↔補助音 (半音/全音) の下限
_TRILL_MAX_SEMITONES = 3.0      # トリル: これ超は跳躍/トレモロであってトリルでない
_PIZZ_MAX_ATTACK_FRAC = 0.4     # ピチカート: ピークが区間前方 (鋭いアタック)
_PIZZ_MAX_DECAY_RATIO = 0.5     # ピチカート: 末尾がピークの半分以下 (撥弦の自然減衰)


def _q_trill(n: IntegratedNote) -> Optional[bool]:
    if n.pitch_alt_count is None or n.pitch_alt_semitones is None:
        return None
    if not (_TRILL_MIN_SEMITONES <= n.pitch_alt_semitones <= _TRILL_MAX_SEMITONES):
        return False  # 交替が無い/広すぎる = トリルとして弾けていない
    return n.pitch_alt_count >= _TRILL_MIN_ALTERNATIONS


def _q_pizzicato(n: IntegratedNote) -> Optional[bool]:
    if n.attack_peak_frac is None or n.decay_ratio is None:
        return None
    # 鋭いアタック(ピークが前方) かつ 減衰している(末尾が小さい) = 撥弦らしい包絡
    return n.attack_peak_frac <= _PIZZ_MAX_ATTACK_FRAC and n.decay_ratio <= _PIZZ_MAX_DECAY_RATIO


# グリッサンド (2026-06-08): f0軌跡の「端点方向一致 + 単調 + 音程踏破」で滑ったか判定。暫定値。
_GLISS_MIN_MONOTONIC = 0.7   # 動くコマの 70%以上が主方向 = 一方向に滑っている
_GLISS_RANGE_FRAC = 0.6      # 実測踏破幅が楽譜音程の 60%以上 = 途中を飛ばしていない


def _q_glissando(n: IntegratedNote) -> Optional[bool]:
    if (n.gliss_range_semitones is None or n.gliss_monotonic_frac is None
            or n.glissando_interval_semitones is None):
        return None
    dir_ok = (n.gliss_direction == n.glissando_direction
              if (n.gliss_direction and n.glissando_direction) else True)
    range_ok = n.gliss_range_semitones >= n.glissando_interval_semitones * _GLISS_RANGE_FRAC
    mono_ok = n.gliss_monotonic_frac >= _GLISS_MIN_MONOTONIC
    return dir_ok and range_ok and mono_ok


_TECH_QUALITY: dict[str, Callable[[IntegratedNote], Optional[bool]]] = {
    "staccato": _q_staccato,
    "spiccato": _q_staccato,
    "portato": _q_portato,
    "trill": _q_trill,
    "pizzicato": _q_pizzicato,
    "glissando": _q_glissando,
}


def _judge_technique(
    data: IntegratedScoreData,
    sub_task_id: str,
    detector: Callable[[IntegratedNote], bool],
    quality: Optional[Callable[[IntegratedNote], Optional[bool]]] = None,
) -> SubTaskResult:
    """奏法 sub_task（弓軸）。①OK=音程&タイミング。
    quality 指定時: ①に加え ②奏法実演OK を AND する。quality(n)==None の音符は
    品質を測れないため対象外 (誤判定を避ける)。
    """
    if quality is None:
        evaluable = _bow_evaluable
        is_bad = _bow_bad
    else:
        def evaluable(n: IntegratedNote) -> bool:
            return _bow_evaluable(n) and quality(n) is not None

        def is_bad(n: IntegratedNote) -> bool:
            return _bow_bad(n) or quality(n) is False

    targets = [
        n for n in data.notes if not n.is_rest and detector(n) and evaluable(n)
    ]
    return _judge(sub_task_id, targets, is_bad)


def _continuous_run_ids(
    data: IntegratedScoreData, pred: Callable[[IntegratedNote], bool]
) -> set[int]:
    """pred を満たす音符が連続している(前後どちらかの非休符音符も pred)塊の id 集合。"""
    non_rest = [n for n in data.notes if not n.is_rest]
    result: set[int] = set()
    for i, n in enumerate(non_rest):
        if not pred(n):
            continue
        prev_ok = i > 0 and pred(non_rest[i - 1])
        next_ok = i < len(non_rest) - 1 and pred(non_rest[i + 1])
        if prev_ok or next_ok:
            result.add(id(n))
    return result


def _run_technique_judges(data: IntegratedScoreData) -> dict[str, SubTaskResult]:
    results: dict[str, SubTaskResult] = {}
    quality_map = dict(_TECH_QUALITY)
    quality_map["tremolo"] = _make_tremolo_quality(data.bpm or 60.0)  # marks/音価依存
    for tech, detector in _TECH_DETECTORS.items():
        quality = quality_map.get(tech)  # 品質判定未対応奏法は None=①のみ
        bid = f"bowing_technique_{tech}"
        results[bid] = _judge_technique(data, bid, detector, quality)

    # 連続スタッカート/スピッカート: 連続する塊を対象に、跳ね系共通軸
    # dur_ratio<=0.5 (短く切れている) で判定。
    for tech in ("staccato", "spiccato"):
        bid = f"bowing_technique_{tech}_continuous"
        run_ids = _continuous_run_ids(data, _TECH_DETECTORS[tech])
        detector = lambda n, _ids=run_ids: id(n) in _ids
        results[bid] = _judge_technique(data, bid, detector, _q_staccato)
    return results


# ---------------------------------------------------------------------------
# エントリポイント
# ---------------------------------------------------------------------------


def run_bowing_judges(data: IntegratedScoreData) -> dict[str, SubTaskResult]:
    """弓採点 23 項目の判定を実行する。

    Returns:
        sub_task_id をキーとする SubTaskResult の辞書 (BOWING_SUB_TASK_IDS 全 23 エントリ)
    """
    implemented: dict[str, SubTaskResult] = {}

    # 弦 (G/D/A/E)
    for key, label in _STRING_LABEL.items():
        implemented[f"bowing_string_{key}"] = _judge_string(
            data, f"bowing_string_{key}", label
        )

    # 弦移動 (隣接弦の双方向)
    for src_key, dst_key in (
        ("g", "d"), ("d", "g"), ("d", "a"), ("a", "d"), ("a", "e"), ("e", "a"),
    ):
        sub_id = f"bowing_string_change_{src_key}_to_{dst_key}"
        implemented[sub_id] = _judge_string_change(
            data, sub_id, _STRING_LABEL[src_key], _STRING_LABEL[dst_key]
        )

    implemented.update(_run_chord_harmonic_judges(data))
    implemented.update(_run_technique_judges(data))

    return {
        sub_id: implemented.get(sub_id) or _skipped_result(sub_id)
        for sub_id in BOWING_SUB_TASK_IDS
    }
