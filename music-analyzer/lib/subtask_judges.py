"""
subtask_judges.py — 9 sub task の判定関数（v3.2 §6-4 〜 §6-6）

設計書 v3.2 §6-4 〜 §6-6 に基づく実装。

判定ロジックの設計方針（H4 確定）：
  - エンジン側の pitch_ok / start_ok を信頼
  - 上達ループ層は「エンジンが NG とした音符の割合」で判定
  - sub task 固有の厳しさが必要な場合のみ独自閾値（pitch_high, rhythm_fast 等）

中項目構成：
  中項目1：音程（pitch）
    - pitch_overall, pitch_high, pitch_chromatic
  中項目2：リズム（rhythm）
    - rhythm_overall, rhythm_fast, rhythm_after_rest
  中項目3：弦移動（bowing）
    - string_change_volume, string_change_slur, string_change_timing

v3.2 修正（subtask_judges.py 問題1〜10）:
  問題1（致命）：string_change_volume を A 解釈に修正
    - n が is_string_change_from_prev=True なら、前の音符 n-1 の volume_drop_after を見る
    - 「弦移動の瞬間（n-1 → n）で音抜け」を判定する自然な解釈
  問題2：pitch_high の MIDI 76 維持（A弦3rdポジションで弾く場合あり）
  問題3：pitch_chromatic は実装通り（半音1回で該当）
  問題4：rhythm_after_rest の文言を「タイミングがずれる傾向」に変更
  問題5：rhythm_fast はビート単位のまま
  問題6：is_bad の None 処理コメントを全関数に統一
  問題7：target_count の判定不能音符を分母から除外（厳密化）
  問題8〜10：閾値の根拠を補記、α 運用後にチューニング想定
  
  高5（v3.1 から維持）：rhythm_fast の閾値を BPM 連動化
"""

from __future__ import annotations

from typing import Optional

from .integrated_note import (
    IntegratedNote,
    IntegratedScoreData,
    SubTaskResult,
    calc_duration_beats,
    calculate_subtask_score_hybrid,
)
from .timing_tolerance import get_rush_threshold


# ---------------------------------------------------------------------------
# 共通閾値（v3.2 §6 で確定、α 運用後にチューニング想定）
# ---------------------------------------------------------------------------

# 高音域判定の MIDI 閾値（m3 確定：E5 = E弦開放以上）
# v3.2 注（問題2）：MIDI 76 維持
# A弦3rdポジションで MIDI 76 を弾く場合があるため、開放弦含めて判定対象に
HIGH_PITCH_THRESHOLD_MIDI = 76

# 速い音符のビート閾値（八分音符以下）
# v3.2 注（問題5）：ビート単位のまま維持
FAST_NOTE_BEAT_THRESHOLD = 0.5

# 高音域の独自厳し目閾値（独自閾値、H4 の特殊判定）
# 中10：音響的根拠：高音域では弦のテンションが緩み、ピッチが揺れやすい
HIGH_PITCH_INDEPENDENT_THRESHOLD_CENTS = 30

# 弦移動時の音量低下「ずれ大」閾値
# 高6 / 問題8：α 運用後にチューニング想定
VOLUME_DROP_THRESHOLD_DB = -3.0

# matched 閾値（問題8：根拠は α 運用後にチューニング想定）
MATCHED_THRESHOLD_OVERALL = 0.30
MATCHED_THRESHOLD_HIGH = 0.40
MATCHED_THRESHOLD_CHROMATIC = 0.40
MATCHED_THRESHOLD_AFTER_REST = 0.50  # 休符明けは個数少ないため閾値高め
MATCHED_THRESHOLD_RHYTHM_FAST = 0.30
MATCHED_THRESHOLD_STRING_CHANGE = 0.30
MATCHED_THRESHOLD_STRING_CHANGE_SLUR = 0.40

# 解析可能性の検出割合閾値
# 問題9：根拠は α 運用後にチューニング想定
DETECTION_RATE_MIN = 0.50


# ---------------------------------------------------------------------------
# 解析可能性チェック（v3 §6-3 A1）
# ---------------------------------------------------------------------------


def is_performance_analyzable(data: IntegratedScoreData) -> bool:
    """A1 確定：検出割合 < 50% なら解析スキップ。

    v3.2 注（問題9）：50% の根拠は α 運用後にチューニング想定。

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
# 中項目1：音程（pitch）の判定関数（v3.2 §6-4）
# ---------------------------------------------------------------------------


def judge_pitch_overall(data: IntegratedScoreData) -> SubTaskResult:
    """全体的な音程ずれを判定する（pitch_overall）。

    該当音符：全音符（休符除く、検出済み、pitch_ok 判定可能）
    判定：エンジンの pitch_ok を信頼（H4）
    matched 閾値：bad/target > 30%
    
    v3.2 修正:
      - 問題7：pitch_ok is None（判定不能）を分母から除外
      - 問題6：is_bad の None 処理コメント統一
    """
    # v3.2 修正（問題7）：判定不能音符（pitch_ok is None）を target_count から除外
    target_notes = [
        n for n in data.notes 
        if not n.is_rest 
        and n.is_detected 
        and n.pitch_ok is not None
    ]
    
    # H4：エンジンの pitch_ok を信頼
    # v3.2 注釈統一（問題6）：None は target_notes フィルタで既に除外済み
    is_bad = lambda n: n.pitch_ok is False

    score, target_count, bad_count = calculate_subtask_score_hybrid(target_notes, is_bad)

    matched = (bad_count / target_count > MATCHED_THRESHOLD_OVERALL) if target_count > 0 else False

    details = "全体的に音程ずれが多い傾向" if matched else None
    details_with_count = (
        f"全音符{target_count}個中{bad_count}個で音程ずれ大" if matched else None
    )

    return SubTaskResult(
        sub_task_id="pitch_overall",
        score=round(score, 1),
        matched=matched,
        sample_size=target_count,
        target_count=target_count,
        bad_count=bad_count,
        details=details,
        details_with_count=details_with_count,
    )


def judge_pitch_high(data: IntegratedScoreData) -> SubTaskResult:
    """高音域の音程の正確さを判定する（pitch_high）。

    該当音符：MIDI 76 以上（E5 = E弦開放以上、A弦3rdポジション含む）
    判定：エンジンより厳しい独自閾値（±30セント）
    matched 閾値：bad/target > 40%
    
    v3.2 修正:
      - 問題2：MIDI 76 維持（開放弦含めて判定対象、A弦3rdポジションも考慮）
      - 問題7 + H4：pitch_ok is not None でフィルタを統一
        （pitch_ok が None なら pitch_cents_error も None なので、
         どちらでフィルタしても等価。pitch_ok is not None に統一して関数間の整合を取る）
      - 問題6：is_bad の None 処理コメント統一
    """
    # v3.2 修正（問題7 + H4）：pitch_ok is not None で判定不能を除外（関数間統一）
    target_notes = [
        n
        for n in data.notes
        if not n.is_rest
        and n.is_detected
        and n.expected_pitch_midi is not None
        and n.expected_pitch_midi >= HIGH_PITCH_THRESHOLD_MIDI
        and n.pitch_ok is not None  # H4 統一：pitch_ok is not None
        and n.pitch_cents_error is not None  # 判定で使うので念のためチェック（通常は pitch_ok is not None と等価）
    ]

    # 独自閾値 ±30 cents（中10：音響的根拠）
    # v3.2 注釈統一（問題6）：None は target_notes フィルタで既に除外済み
    is_bad = lambda n: abs(n.pitch_cents_error) > HIGH_PITCH_INDEPENDENT_THRESHOLD_CENTS

    score, target_count, bad_count = calculate_subtask_score_hybrid(target_notes, is_bad)
    matched = (bad_count / target_count > MATCHED_THRESHOLD_HIGH) if target_count > 0 else False

    details = "高音域でずれが多い傾向" if matched else None
    details_with_count = (
        f"高音域{target_count}音符中{bad_count}個でずれ大" if matched else None
    )

    return SubTaskResult(
        sub_task_id="pitch_high",
        score=round(score, 1),
        matched=matched,
        sample_size=target_count,
        target_count=target_count,
        bad_count=bad_count,
        details=details,
        details_with_count=details_with_count,
    )


def judge_pitch_chromatic(data: IntegratedScoreData) -> SubTaskResult:
    """半音階での音程の正確さを判定する（pitch_chromatic）。

    該当音符：直前の音と半音間隔（MIDI 差 = 1）
    判定：エンジンの pitch_ok を信頼
    matched 閾値：bad/target > 40%
    
    v3.2 修正:
      - 問題3：実装通り（半音1回で該当）。サンプル数確保を優先、3連続要件は導入しない
      - 問題7：pitch_ok is not None フィルタを追加
      - 問題6：is_bad の None 処理コメント統一
    """
    target_notes = []
    for i in range(1, len(data.notes)):
        prev = data.notes[i - 1]
        curr = data.notes[i]
        if prev.is_rest or curr.is_rest:
            continue
        if not curr.is_detected:
            continue
        # v3.2 修正（問題7）：pitch_ok が None の音符を除外
        if curr.pitch_ok is None:
            continue
        if prev.expected_pitch_midi is None or curr.expected_pitch_midi is None:
            continue
        # 半音間隔の連続音（直前との MIDI 差 = 1）
        # v3.2 注（問題3）：サンプル数確保のため、半音1回で該当
        if abs(curr.expected_pitch_midi - prev.expected_pitch_midi) == 1:
            target_notes.append(curr)

    # H4：エンジンの pitch_ok を信頼
    # v3.2 注釈統一（問題6）：None は target_notes フィルタで既に除外済み
    is_bad = lambda n: n.pitch_ok is False

    score, target_count, bad_count = calculate_subtask_score_hybrid(target_notes, is_bad)
    matched = (bad_count / target_count > MATCHED_THRESHOLD_CHROMATIC) if target_count > 0 else False

    details = "半音階でずれが多い傾向" if matched else None
    details_with_count = (
        f"半音階{target_count}箇所中{bad_count}箇所でずれ大" if matched else None
    )

    return SubTaskResult(
        sub_task_id="pitch_chromatic",
        score=round(score, 1),
        matched=matched,
        sample_size=target_count,
        target_count=target_count,
        bad_count=bad_count,
        details=details,
        details_with_count=details_with_count,
    )


# ---------------------------------------------------------------------------
# 中項目2：リズム（rhythm）の判定関数（v3.2 §6-5）
# ---------------------------------------------------------------------------


def judge_rhythm_overall(data: IntegratedScoreData) -> SubTaskResult:
    """全体的なタイミングずれを判定する（rhythm_overall）。

    判定：エンジンの start_ok を信頼（H3 BPM 連動済み）
    matched 閾値：bad/target > 30%
    
    v3.2 修正:
      - 問題7：start_ok is None（判定不能）を分母から除外
      - 問題6：is_bad の None 処理コメント統一
    """
    # v3.2 修正（問題7）：start_ok is None の音符を除外
    target_notes = [
        n for n in data.notes 
        if not n.is_rest 
        and n.is_detected 
        and n.start_ok is not None
    ]
    
    # H4：エンジンの start_ok を信頼
    # v3.2 注釈統一（問題6）：None は target_notes フィルタで既に除外済み
    is_bad = lambda n: n.start_ok is False

    score, target_count, bad_count = calculate_subtask_score_hybrid(target_notes, is_bad)
    matched = (bad_count / target_count > MATCHED_THRESHOLD_OVERALL) if target_count > 0 else False

    details = "全体的にタイミングがずれる傾向" if matched else None
    details_with_count = (
        f"全音符{target_count}個中{bad_count}個でタイミングずれ大" if matched else None
    )

    return SubTaskResult(
        sub_task_id="rhythm_overall",
        score=round(score, 1),
        matched=matched,
        sample_size=target_count,
        target_count=target_count,
        bad_count=bad_count,
        details=details,
        details_with_count=details_with_count,
    )


def judge_rhythm_fast(data: IntegratedScoreData) -> SubTaskResult:
    """速い音符での前のめりを判定する（rhythm_fast）。

    該当音符：duration <= 0.5 ビート（八分音符以下）
    判定：start_diff_sec < rush_threshold で「前のめり」（独自厳し目閾値、BPM 連動）
    matched 閾値：bad/target > 30%
    
    v3.2 修正:
      - 問題5：ビート単位のまま維持（FAST_NOTE_BEAT_THRESHOLD = 0.5）
      - 問題7：start_diff_sec is not None フィルタを追加
      - 問題6：is_bad の None 処理コメント統一
      - 高5：BPM 連動化（v3.1 から維持）。get_rush_threshold(data.bpm) を使う
    """
    # v3.2 修正（高5）：BPM 連動の閾値計算
    # H3 と整合させて、テンポに応じてスケール
    # BPM 60 のときの -0.05 を基準
    rush_threshold = get_rush_threshold(data.bpm)
    
    target_notes = []
    for n in data.notes:
        if n.is_rest or not n.is_detected:
            continue
        # v3.2 修正（問題7）：start_diff_sec が None の音符を除外
        if n.start_diff_sec is None:
            continue
        try:
            duration = calc_duration_beats(
                n.expected_start_sec, n.expected_end_sec, data.bpm
            )
        except ValueError:
            continue
        if duration <= FAST_NOTE_BEAT_THRESHOLD:
            target_notes.append(n)

    # 独自厳し目閾値（H4 の特殊判定）、BPM 連動（高5）
    # v3.2 注釈統一（問題6）：None は target_notes フィルタで既に除外済み
    is_bad = lambda n: n.start_diff_sec < rush_threshold

    score, target_count, bad_count = calculate_subtask_score_hybrid(target_notes, is_bad)
    matched = (bad_count / target_count > MATCHED_THRESHOLD_RHYTHM_FAST) if target_count > 0 else False

    details = "速い音符で前のめり傾向" if matched else None
    details_with_count = (
        f"速い音符{target_count}個中{bad_count}個で前のめり" if matched else None
    )

    return SubTaskResult(
        sub_task_id="rhythm_fast",
        score=round(score, 1),
        matched=matched,
        sample_size=target_count,
        target_count=target_count,
        bad_count=bad_count,
        details=details,
        details_with_count=details_with_count,
    )


def judge_rhythm_after_rest(data: IntegratedScoreData) -> SubTaskResult:
    """休符明けのタイミングずれを判定する（rhythm_after_rest）。

    該当音符：is_after_rest = True
    判定：エンジンの start_ok を信頼（早すぎる入りも遅すぎる入りも両方含む）
    matched 閾値：bad/target > 50%（休符明けは個数少ないため閾値高め）
    
    v3.2 修正:
      - 問題4：文言を「タイミングがずれる傾向」に変更
        旧：「休符明けで入りが遅れる傾向」（早すぎる入りを除外していた）
        新：「休符明けでタイミングがずれる傾向」（早すぎる/遅すぎる両方含む）
      - 問題7：start_ok is None フィルタを追加
      - 問題6：is_bad の None 処理コメント統一
    """
    target_notes = [
        n for n in data.notes
        if not n.is_rest 
        and n.is_detected 
        and n.is_after_rest
        and n.start_ok is not None  # v3.2 修正（問題7）：判定不能音符を除外
    ]

    # H4：エンジンの start_ok を信頼（BPM 連動済み）
    # v3.2 注釈統一（問題6）：None は target_notes フィルタで既に除外済み
    is_bad = lambda n: n.start_ok is False

    score, target_count, bad_count = calculate_subtask_score_hybrid(target_notes, is_bad)
    matched = (bad_count / target_count > MATCHED_THRESHOLD_AFTER_REST) if target_count > 0 else False

    # v3.2 修正（問題4）：文言を「タイミングがずれる傾向」に変更
    details = "休符明けでタイミングがずれる傾向" if matched else None
    details_with_count = (
        f"休符明け{target_count}箇所中{bad_count}箇所でずれ大" if matched else None
    )

    return SubTaskResult(
        sub_task_id="rhythm_after_rest",
        score=round(score, 1),
        matched=matched,
        sample_size=target_count,
        target_count=target_count,
        bad_count=bad_count,
        details=details,
        details_with_count=details_with_count,
    )


# ---------------------------------------------------------------------------
# 中項目3：弦移動（bowing）の判定関数（v3.2 §6-6）
# ---------------------------------------------------------------------------
# 前提：mxl に <technical><string> / <fingering> / <slur> 注釈が含まれる
# 注釈なしの場合は note_integration 側でファーストポジション推定により補完済み
#
# v3.2 重要（Phase 0.1 Task 5 反映）：
#   既存 mxl の 86%が MIDI 84+ を含み、<technical> 注釈もない。
#   「作り直し」プロジェクトは MVP 後に実施。
#   結果として α MVP では bowing 系3 sub task の target_count が小さい / 0 になる演奏が大半。
#   bowingSkillScore = None になる演奏が大半（Q5 集計除外）。


def judge_string_change_volume(data: IntegratedScoreData) -> SubTaskResult:
    """弦移動の瞬間（n-1 → n）で音抜けを判定する（string_change_volume）。

    該当：n が is_string_change_from_prev=True かつ前の音符 n-1 の volume_drop_after が取得できる
    判定：n-1 の volume_drop_after < -3.0 dB で「弦移動の瞬間に音量低下」
    matched 閾値：bad/target > 30%
    
    v3.2 修正（問題1：A 解釈に修正、最重要）:
      旧（B 解釈、間違っていた）:
        target_notes = is_string_change_from_prev かつ n の volume_drop_after を見る
        → 「弦移動先の音 n の、さらに次への移行で音量低下」を判定（意味不明確）
      
      新（A 解釈、正しい）:
        target_pairs = (n, prev) のペア。n は弦移動先、prev は弦移動元
        → prev の volume_drop_after を見る = 「弦移動の瞬間（prev → n）で音抜け」
        → バイオリン的に「弦移動で音が抜ける」の正しい判定
    
    その他の修正:
      - 問題6：is_bad の None 処理コメント統一
      - 問題7：volume_drop_after is not None で判定不能を除外
    """
    # 該当ペアの構築：(curr, prev) のタプルを集める
    # curr: 弦移動先の音符（is_string_change_from_prev=True）
    # prev: 弦移動元の音符（curr の直前の有効な音符、休符は飛ばす）
    target_pairs: list[tuple[IntegratedNote, IntegratedNote]] = []
    
    for i in range(1, len(data.notes)):
        curr = data.notes[i]
        if curr.is_rest or not curr.is_detected:
            continue
        if not curr.is_string_change_from_prev:
            continue
        
        # 直前の有効な音符（休符は飛ばす）を探す
        prev: Optional[IntegratedNote] = None
        for j in range(i - 1, -1, -1):
            if not data.notes[j].is_rest:
                prev = data.notes[j]
                break
        
        if prev is None:
            continue
        # v3.2 修正（問題7）：判定不能を除外
        if prev.volume_drop_after is None:
            continue
        
        target_pairs.append((curr, prev))
    
    target_count = len(target_pairs)
    
    # 音量低下が 3dB 以上で「弦移動の瞬間に音抜け」
    # v3.2 注（高6 / 問題8）：閾値 -3.0dB は α 運用後にチューニング想定
    # v3.2 注釈統一（問題6）：None は target_pairs フィルタで既に除外済み
    bad_count = sum(
        1 for _curr, prev in target_pairs
        if prev.volume_drop_after < VOLUME_DROP_THRESHOLD_DB
    )
    
    # スコア計算（hybrid 方式と同等）
    if target_count == 0:
        score = 100.0
    else:
        score = 100.0 - (bad_count / target_count) * 100.0
        score = max(0.0, min(100.0, score))
    
    matched = (bad_count / target_count > MATCHED_THRESHOLD_STRING_CHANGE) if target_count > 0 else False

    details = "弦移動時に音が抜ける傾向" if matched else None
    details_with_count = (
        f"弦移動{target_count}箇所中{bad_count}箇所で音量低下" if matched else None
    )

    return SubTaskResult(
        sub_task_id="string_change_volume",
        score=round(score, 1),
        matched=matched,
        sample_size=target_count,
        target_count=target_count,
        bad_count=bad_count,
        details=details,
        details_with_count=details_with_count,
    )


def judge_string_change_slur(data: IntegratedScoreData) -> SubTaskResult:
    """スラー中の弦移動の乱れを判定する（string_change_slur）。

    該当音符：is_string_change_from_prev = True かつ is_in_slur = True
    判定：音量低下 OR 音程ずれ で「ずれ大」
    matched 閾値：bad/target > 40%
    
    v3.2 修正:
      - スラー中は弓を切らないので、本来 volume_drop_after は発生しにくい
        主な判定材料は pitch_ok=False
        音量条件はスラー外で意図せず弓を切った場合の検出用に維持
      - 問題7：pitch_ok is not None フィルタを追加
      - 問題6：is_bad の None 処理コメント統一
    """
    target_notes = [
        n for n in data.notes
        if not n.is_rest
        and n.is_detected
        and n.is_string_change_from_prev
        and n.is_in_slur
        and n.pitch_ok is not None  # v3.2 修正（問題7）：判定可能な音符
    ]

    # スラー中の弦移動：音量低下 OR 音程ずれ で「ずれ大」
    # v3.2 注釈統一（問題6）：pitch_ok は None フィルタ済み、volume は None 許容（OR の片方）
    is_bad = lambda n: (
        (n.volume_drop_after is not None and n.volume_drop_after < VOLUME_DROP_THRESHOLD_DB)
        or (n.pitch_ok is False)
    )

    score, target_count, bad_count = calculate_subtask_score_hybrid(target_notes, is_bad)
    matched = (bad_count / target_count > MATCHED_THRESHOLD_STRING_CHANGE_SLUR) if target_count > 0 else False

    details = "スラー中の弦移動でばらつき" if matched else None
    details_with_count = (
        f"スラー中弦移動{target_count}箇所中{bad_count}箇所で乱れ" if matched else None
    )

    return SubTaskResult(
        sub_task_id="string_change_slur",
        score=round(score, 1),
        matched=matched,
        sample_size=target_count,
        target_count=target_count,
        bad_count=bad_count,
        details=details,
        details_with_count=details_with_count,
    )


def judge_string_change_timing(data: IntegratedScoreData) -> SubTaskResult:
    """弦移動時のタイミングずれを判定する（string_change_timing）。

    該当音符：is_string_change_from_prev = True
    判定：エンジンの start_ok を信頼（BPM 連動済み）
    matched 閾値：bad/target > 30%
    
    v3.2 修正:
      - 問題7：start_ok is not None フィルタを追加
      - 問題6：is_bad の None 処理コメント統一
    """
    target_notes = [
        n for n in data.notes
        if not n.is_rest
        and n.is_detected
        and n.is_string_change_from_prev
        and n.start_ok is not None  # v3.2 修正（問題7）：判定不能音符を除外
    ]

    # H4：エンジンの start_ok を信頼（BPM 連動済み）
    # v3.2 注釈統一（問題6）：None は target_notes フィルタで既に除外済み
    is_bad = lambda n: n.start_ok is False

    score, target_count, bad_count = calculate_subtask_score_hybrid(target_notes, is_bad)
    matched = (bad_count / target_count > MATCHED_THRESHOLD_STRING_CHANGE) if target_count > 0 else False

    details = "弦移動時にタイミングがずれる傾向" if matched else None
    details_with_count = (
        f"弦移動{target_count}箇所中{bad_count}箇所でタイミングずれ" if matched else None
    )

    return SubTaskResult(
        sub_task_id="string_change_timing",
        score=round(score, 1),
        matched=matched,
        sample_size=target_count,
        target_count=target_count,
        bad_count=bad_count,
        details=details,
        details_with_count=details_with_count,
    )


# ---------------------------------------------------------------------------
# 全 sub task 判定の実行
# ---------------------------------------------------------------------------


def run_all_judges(data: IntegratedScoreData) -> dict[str, SubTaskResult]:
    """9 sub task すべての判定を実行する。

    Returns:
        sub_task_id をキーとする SubTaskResult の辞書
    """
    return {
        # 中項目1：音程
        "pitch_overall": judge_pitch_overall(data),
        "pitch_high": judge_pitch_high(data),
        "pitch_chromatic": judge_pitch_chromatic(data),
        # 中項目2：リズム
        "rhythm_overall": judge_rhythm_overall(data),
        "rhythm_fast": judge_rhythm_fast(data),
        "rhythm_after_rest": judge_rhythm_after_rest(data),
        # 中項目3：弦移動
        "string_change_volume": judge_string_change_volume(data),
        "string_change_slur": judge_string_change_slur(data),
        "string_change_timing": judge_string_change_timing(data),
    }
