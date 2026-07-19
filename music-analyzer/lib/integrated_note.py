"""
integrated_note.py — 上達ループエンジンの統合データ構造定義

設計書 v3.2.2 §6-2 に基づく実装。

このモジュールは、解析パイプラインの全段階で共有される中核データクラスを定義する：
- IntegratedNote: 1音符の統合データ（解析結果 + MusicXML 情報）
- IntegratedScoreData: 演奏全体の統合データ
- SubTaskResult: 1つの小項目（sub task）の判定結果

すべて純粋なデータクラスで、副作用を持たない。

v3.2.2 修正（2026-05-06）:
  - Phase 0.1 Task 1 訂正: comparison_result.json は flat array ではなく
    {version, warnings, results} ラッパー構造（実物検証済み）
  - measure_index（0-indexed）→ measure_number（1-indexed）にリネーム
    実物 comparison_result.json の "measure_number" に統一
  - end 系フィールドを削除（実物に存在しないため）:
    detected_end_sec / end_diff_sec / end_ok
    β で必要になったら再追加（案 A 採用）

v3.2 修正:
  - Phase 0.1 Task 2 反映：time_signature を dict 型に変更
    旧：time_signature: str（例 "4/4"）
    新：time_signature: dict（例 {"numerator": 4, "denominator": 4}）
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import List, Optional


# ---------------------------------------------------------------------------
# 導出関数（v3 §6-2 確定）
# ---------------------------------------------------------------------------


def hz_to_midi(hz: float) -> int:
    """Hz から MIDI ピッチ番号への変換。

    A4 (440 Hz) を MIDI 69 とする標準変換。

    Args:
        hz: 周波数（Hz）

    Returns:
        MIDI ピッチ番号（整数、四捨五入）

    Raises:
        ValueError: hz が 0 以下のとき
    """
    if hz <= 0:
        raise ValueError(f"Invalid Hz: {hz}")
    return round(69 + 12 * math.log2(hz / 440.0))


# ---------------------------------------------------------------------------
# IntegratedNote — 1音符の統合データ
# ---------------------------------------------------------------------------


@dataclass
class IntegratedNote:
    """1音符の統合データ（解析結果 + MusicXML 情報）。

    このデータクラスは 4 つの JSON を統合して構築される：
    - comparison_result.json: 検出されたピッチ・タイミング情報、音量情報（v3 C5 で追加）
      ※ v3.2 修正（Phase 0.1 Task 1）：実物は flat array で出力される
    - note_results.json: 楽譜上の期待ピッチ・期待タイミング、bpm、time_signature（dict 型）
    - 既存 analysis.json: bpm, time_signature, notes（type, pitches, articulations 等）
    - 新規 musicxml_skill_info.json: 運指・弦・スラー・休符前後・推定フラグ等（Commit D で生成）

    判定関数（subtask_judges.py の judge_*）はこのデータクラスを読み取って
    sub task の判定結果（SubTaskResult）を生成する。
    """

    # === 基本情報 ===
    note_index: int  # 0 始まりの音符インデックス
    measure_number: int  # 1 始まりの小節番号（v3.2.2 修正）
                          # v3.2: measure_index（0-indexed）から
                          # v3.2.2: measure_number（1-indexed）に統一
                          # 実物 comparison_result.json の "measure_number" を採用

    # === 楽譜情報（note_results.json から）===
    expected_pitch_hz: float  # 楽譜の期待ピッチ（Hz）。休符は 0.0
    expected_start_sec: float
    expected_end_sec: float
    is_rest: bool  # 休符フラグ

    # === 解析結果（comparison_result.json から）===
    # v3.2.2 修正：実物の comparison_result.json は {version, warnings, results} 構造
    detected_start_sec: Optional[float] = None  # None = 未検出
    pitch_cents_error: Optional[float] = None  # ピッチずれ（セント単位、符号付き）
    pitch_ok: Optional[bool] = None  # エンジンの判定
    start_diff_sec: Optional[float] = None  # タイミングずれ（秒単位、符号付き）
    start_ok: Optional[bool] = None  # エンジンの判定
    
    # v3.2.2 削除（実物に存在しないため）:
    #   detected_end_sec   → ない
    #   end_diff_sec       → ない
    #   end_ok             → ない
    # β で必要になった場合は再追加

    # === 音量情報（v3 §14-2 C5 で追加）===
    avg_volume_db: Optional[float] = None  # その音符の平均音量（dB）
    volume_drop_after: Optional[float] = None  # 直後の音量低下量（dB、負の値=低下）
                                                # v3.2: detected_start_sec ベースで計算（致命3）

    # === MusicXML 運指情報（musicxml_skill_info.json から、Commit D で生成）===
    string_id: Optional[str] = None  # "G" / "D" / "A" / "E" または None
    finger: Optional[int] = None  # 0=開放弦、1〜4
    is_in_slur: bool = False  # スラー範囲内
    is_after_rest: bool = False  # 直前が休符だった
    is_inferred_position: bool = False  # ファーストポジション推定された場合 True

    # === 重音/ハーモニクス（analysis.json から、第二弾 2a 2026-06-07）===
    is_chord: bool = False  # 重音（同時に複数ピッチ）
    pitch_count: int = 1  # 同時発音ピッチ数（重音 2 / 3+ の判定用、休符/単音は 1 or 0）
    is_harmonic: bool = False  # ハーモニクス（フラジオレット）

    # === 連符（analysis.json tuplet_actual から、2c 2026-06-07）===
    tuplet_actual: Optional[int] = None  # 実連符数: 3連符=3, 2連符=2, 5連符=5。連符でなければ None

    # === 奏法（analysis.json から、2e 2026-06-07）===
    articulations: List[str] = field(default_factory=list)  # music21 articulation クラス名
    is_tremolo: bool = False
    is_trill: bool = False

    # === 奏法品質（comparison_result から、2e 段階1 2026-06-08）===
    detected_end_sec: Optional[float] = None  # 実音の発音終了時刻（音量精緻化）。検出不能は None
    dur_ratio: Optional[float] = None  # 実音長/期待音長。共に演奏テンポ(comparison)で算出し
                                        # テンポ不変。staccato 等の「短く切れているか」判定用。
                                        # 検出不能(detected_end/start欠落、期待長0)は None

    # === 奏法品質 段階2（comparison_result から、2e 段階2 2026-06-08）===
    onset_count: Optional[int] = None  # 音符ピッチ区間内のオンセット数(旧指標、参考)
    onset_rate_per_sec: Optional[float] = None  # オンセット密度(回/秒)(旧指標、参考)
    # tremolo 音声側特徴量
    pitch_alt_count: Optional[int] = None  # f0 が 2 クラスタ間を往復した回数(指トレモロ/トリル)
    pitch_alt_semitones: Optional[float] = None  # 2 クラスタの音程差(半音)。交替の確認用
    amp_stroke_count: Optional[int] = None  # 音量ストローク数(弓トレモロ)
    # ピチカート包絡特徴量 (2e 段階3 2026-06-08)
    attack_peak_frac: Optional[float] = None  # RMS ピーク位置(区間内, 0=先頭)。撥弦は鋭く小さい
    decay_ratio: Optional[float] = None  # 末尾1/4平均RMS ÷ ピークRMS。撥弦は減衰で小さい

    # === tremolo 楽譜側情報（analysis.json から、2e 段階2 2026-06-08）===
    tremolo_type: Optional[str] = None  # "bowed"(弓/同音) | "fingered"(指/2音) | None
    tremolo_marks: Optional[int] = None  # 刻み線本数(細分)。期待ストローク/往復数の算出に使う
    tremolo_partner_hz: Optional[float] = None  # 指トレモロの相手音(Hz)
    tremolo_interval_semitones: Optional[int] = None  # 指トレモロの2音音程差(半音)

    # === グリッサンド（2e グリッサンド 2026-06-08）===
    # 楽譜側(analysis.json、開始音に付く)
    is_glissando: bool = False  # グリッサンド開始音
    glissando_interval_semitones: Optional[int] = None  # 滑る音程差(半音)
    glissando_direction: Optional[str] = None  # "up" | "down"
    # 音声側(comparison_result、次音 onset までの f0 軌跡)
    gliss_range_semitones: Optional[float] = None  # 実測の踏破幅(半音)
    gliss_monotonic_frac: Optional[float] = None  # 主方向への単調割合(滑らかさ)
    gliss_direction: Optional[str] = None  # 実測のスライド方向

    # === note_integration.py で生成（v3.2 Q7 確定）===
    is_string_change_from_prev: bool = False  # 直前の音から弦移動した
                                                # v3.2: analyze_musicxml ではなく
                                                # note_integration.py で生成

    # === 派生プロパティ ===

    @property
    def is_detected(self) -> bool:
        """検出されたか（C5：detected_start_sec から導出）。"""
        return self.detected_start_sec is not None

    @property
    def expected_pitch_midi(self) -> Optional[int]:
        """MIDI ピッチ番号（C5：Hz から導出）。

        休符（expected_pitch_hz == 0.0）の場合は None を返す。
        """
        if self.expected_pitch_hz <= 0:
            return None
        return hz_to_midi(self.expected_pitch_hz)


# ---------------------------------------------------------------------------
# IntegratedScoreData — 演奏全体の統合データ
# ---------------------------------------------------------------------------


@dataclass
class IntegratedScoreData:
    """演奏全体の統合データ。

    解析パイプラインのエントリポイント（score_full.py）が
    `note_integration.build_integrated_score_data()` で構築し、
    `subtask_judges.calculate_skill_scores()` に渡される。
    """

    performance_id: str
    user_id: str
    practice_item_id: str
    practice_item_difficulty: int  # 1〜10 の難易度 (PracticeItem.star、v1.3 で difficulty → star に rename)

    notes: List[IntegratedNote]  # 音符のリスト（休符を含む順序保持）

    bpm: float  # 楽譜の目標 BPM（note_results.json の bpm）
    
    # v3.2 修正（Phase 0.1 Task 2）：time_signature は dict 型
    # 旧：str（例 "4/4"）
    # 新：dict（例 {"numerator": 4, "denominator": 4}）
    time_signature: dict

    skill_sub_task_tags: List[str] = field(default_factory=list)
    """PracticeItem.skillSubTaskTags（C7）。

    判定スキップ判定や生成範囲の絞り込みに利用可能。
    例：["pitch_overall", "rhythm_overall", "string_change_volume"]
    """

    # === メタ情報（デバッグ・ロギング用、v3 §14-3 で確認用に追加）===
    target_bpm_used: Optional[float] = None  # comparison_result から取得した実 BPM
    detection_rate: Optional[float] = None  # 検出割合（A1 判定で使う）


# ---------------------------------------------------------------------------
# SubTaskResult — 1つの小項目の判定結果
# ---------------------------------------------------------------------------


@dataclass
class SubTaskResult:
    """1つの小項目（sub task）の判定結果。

    設計書 v3.2 §6-2 / §9（v2.3 から踏襲、E1 確定の文言2種類対応）。
    """

    sub_task_id: str  # "pitch_overall" / "string_change_volume" 等
    score: float  # 0〜100（中項目スコア計算用）
    matched: bool  # 課題として該当（カード発生用）

    sample_size: int  # 判定に使ったサンプル数（target_count と同じ、互換のため保持）
    target_count: int  # 該当音符の総数（v3.2: 判定不能音符は除外、問題7）
    bad_count: int  # ずれが大きい音符の数

    # E1 確定（v2.3 踏襲）：文言2種類保持
    details: Optional[str] = None  # 抽象表現（UIメイン表示用）
    details_with_count: Optional[str] = None  # 数値表現（先生用ダッシュボード用）


# ---------------------------------------------------------------------------
# 共通スコア計算関数（v3 §6-2、v2.3 から踏襲）
# ---------------------------------------------------------------------------


def calculate_subtask_score_hybrid(
    target_notes: List[IntegratedNote],
    is_bad,  # Callable[[IntegratedNote], bool]
) -> tuple[float, int, int]:
    """ハイブリッド方式の小項目スコア計算。

    該当音符のうち、ずれが大きい音符の割合ベースでスコア化する：
        score = 100 - (bad / target) × 100

    該当音符が 0 件の場合は満点（評価不可ではなく「課題なし」とみなす）。
    
    v3.2 注：個別 sub task では score=100 を返すが、
    skill_aggregator では target_count=0 の sub_task を集計から除外する（Q5 確定）。

    Args:
        target_notes: 該当音符のリスト
        is_bad: 「ずれが大きい」判定関数

    Returns:
        (score, target_count, bad_count) のタプル
    """
    target_count = len(target_notes)
    if target_count == 0:
        # 該当音符なし → 課題化されない（個別 sub task は満点）
        # Q5：skill_aggregator では集計から除外される
        return 100.0, 0, 0

    bad_count = sum(1 for n in target_notes if is_bad(n))

    score = 100.0 - (bad_count / target_count) * 100.0
    score = max(0.0, min(100.0, score))  # クランプ

    return score, target_count, bad_count
