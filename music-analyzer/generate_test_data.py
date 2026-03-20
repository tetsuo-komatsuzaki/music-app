"""
テストデータ生成スクリプト

analysis.json から4種類のテスト用 wav を生成:
  1. perfect.wav        — 完璧な演奏（全ノート正確）
  2. pitch_error.wav    — 音程ずれ（特定ノートを意図的にずらす）
  3. timing_start.wav   — 演奏開始時点でタイミングずれ
  4. timing_mid.wav     — 演奏途中でタイミングずれ

Usage:
  python generate_test_data.py <analysis.json のパス> [出力フォルダ]

例:
  python generate_test_data.py output/analysis.json test_wavs/
  python generate_test_data.py analysis.json
"""

from __future__ import annotations

import sys
import json
import os
import numpy as np

try:
    import soundfile as sf
except ImportError:
    print("soundfile が必要です: pip install soundfile")
    sys.exit(1)

# =========================
# 引数
# =========================
if len(sys.argv) < 2:
    print("Usage: python generate_test_data.py <analysis.json> [output_dir]")
    sys.exit(1)

ANALYSIS_PATH = sys.argv[1]
OUTPUT_DIR = sys.argv[2] if len(sys.argv) >= 3 else "test_wavs"

os.makedirs(OUTPUT_DIR, exist_ok=True)

# =========================
# analysis.json 読み込み
# =========================
with open(ANALYSIS_PATH, "r", encoding="utf-8") as f:
    analysis = json.load(f)

notes = analysis["notes"]
bpm = float(analysis["bpm"])

print(f"BPM: {bpm}")
print(f"Total entries: {len(notes)}")
print(f"Notes (type=note): {len([n for n in notes if n['type'] == 'note'])}")
print(f"Rests (type=rest): {len([n for n in notes if n['type'] == 'rest'])}")

# =========================
# 合成パラメータ
# =========================
SR = 44100  # サンプリングレート
AMPLITUDE = 0.5  # 音量
ATTACK = 0.01  # アタック（秒）
RELEASE = 0.02  # リリース（秒）

# 演奏開始前の無音（録音開始 → 演奏開始のギャップをシミュレート）
LEAD_SILENCE = 0.5  # 秒


def generate_tone(frequency: float, duration: float, sr: int = SR) -> np.ndarray:
    """指定周波数・長さのサイン波を生成（エンベロープ付き）"""
    n_samples = int(duration * sr)
    if n_samples <= 0:
        return np.zeros(0)

    t = np.arange(n_samples) / sr
    wave = AMPLITUDE * np.sin(2 * np.pi * frequency * t)

    # エンベロープ（アタック + リリース）
    attack_samples = min(int(ATTACK * sr), n_samples // 2)
    release_samples = min(int(RELEASE * sr), n_samples // 2)

    envelope = np.ones(n_samples)
    if attack_samples > 0:
        envelope[:attack_samples] = np.linspace(0, 1, attack_samples)
    if release_samples > 0:
        envelope[-release_samples:] = np.linspace(1, 0, release_samples)

    return wave * envelope


def generate_silence(duration: float, sr: int = SR) -> np.ndarray:
    """無音を生成"""
    return np.zeros(int(duration * sr))


def synthesize_performance(
    notes_data: list,
    pitch_offsets: dict[int, float] | None = None,
    timing_offsets: dict[int, float] | None = None,
    global_offset: float = LEAD_SILENCE,
) -> np.ndarray:
    """
    analysis.notes から wav データを合成

    Args:
        notes_data: analysis.json の notes 配列
        pitch_offsets: {note_index: cents} 音程をずらすノート
        timing_offsets: {note_index: seconds} タイミングをずらすノート
        global_offset: 演奏開始前の無音（秒）
    """
    if pitch_offsets is None:
        pitch_offsets = {}
    if timing_offsets is None:
        timing_offsets = {}

    # 全体の長さを計算
    last_note = notes_data[-1]
    total_duration = float(last_note["end_time_sec"]) + global_offset + 1.0  # 末尾に1秒余白
    total_samples = int(total_duration * SR)
    audio = np.zeros(total_samples)

    for n in notes_data:
        if n["type"] != "note" or not n.get("pitches"):
            continue

        note_index = int(n["note_index"])
        frequency = float(n["pitches"][0])
        start = float(n["start_time_sec"])
        end = float(n["end_time_sec"])
        duration = end - start

        # 音程オフセット適用（cents）
        if note_index in pitch_offsets:
            cents = pitch_offsets[note_index]
            frequency = frequency * (2 ** (cents / 1200.0))

        # タイミングオフセット適用（秒）
        timing_shift = timing_offsets.get(note_index, 0.0)
        actual_start = start + global_offset + timing_shift

        if actual_start < 0:
            actual_start = 0

        # トーン生成
        tone = generate_tone(frequency, duration)

        # 配置
        start_sample = int(actual_start * SR)
        end_sample = start_sample + len(tone)

        if end_sample > total_samples:
            tone = tone[: total_samples - start_sample]
            end_sample = total_samples

        if start_sample < total_samples and len(tone) > 0:
            audio[start_sample:start_sample + len(tone)] += tone

    # クリッピング防止
    max_val = np.max(np.abs(audio))
    if max_val > 1.0:
        audio = audio / max_val

    return audio


def save_wav(audio: np.ndarray, filename: str):
    """wav ファイルとして保存"""
    path = os.path.join(OUTPUT_DIR, filename)
    sf.write(path, audio, SR)
    print(f"  → {path} ({len(audio) / SR:.1f}s)")


# =========================
# note 一覧（type=note のみ）
# =========================
note_entries = [n for n in notes if n["type"] == "note" and n.get("pitches")]
note_indices = [int(n["note_index"]) for n in note_entries]

print(f"\nNote indices: {note_indices}")
print(f"Total notes to synthesize: {len(note_entries)}")

# =========================
# 1. 完璧な演奏
# =========================
print("\n[1/4] Generating perfect.wav ...")
audio_perfect = synthesize_performance(notes)
save_wav(audio_perfect, "perfect.wav")

# =========================
# 2. 音程ずれ（特定ノートを ±80〜150 cents ずらす）
# =========================
print("\n[2/4] Generating pitch_error.wav ...")

# ノートの 20% 程度をずらす（最低2ノート）
n_pitch_errors = max(2, len(note_entries) // 5)
# 均等に分散させる
pitch_error_indices = [
    note_indices[i]
    for i in np.linspace(1, len(note_indices) - 2, n_pitch_errors, dtype=int)
]

pitch_offsets = {}
for i, idx in enumerate(pitch_error_indices):
    # 交互に sharp / flat
    direction = 1 if i % 2 == 0 else -1
    cents = direction * np.random.randint(80, 150)
    pitch_offsets[idx] = cents

print(f"  Pitch errors at note_indices: {pitch_error_indices}")
print(f"  Offsets (cents): {pitch_offsets}")

audio_pitch = synthesize_performance(notes, pitch_offsets=pitch_offsets)
save_wav(audio_pitch, "pitch_error.wav")

# 正解ラベルを保存
pitch_error_label = {
    "description": "音程ずれテスト",
    "errors": [
        {"note_index": idx, "cents_offset": pitch_offsets[idx]}
        for idx in pitch_error_indices
    ],
    "expected": {
        "pitch_error_indices": pitch_error_indices,
        "all_other_notes": "should be pitch_ok=true"
    }
}

# =========================
# 3. タイミングずれ（演奏開始時点）
# =========================
print("\n[3/4] Generating timing_start.wav ...")

# 最初の3ノートを 0.15〜0.25 秒遅らせる
timing_start_offsets = {}
n_start_errors = min(3, len(note_entries))
for i in range(n_start_errors):
    idx = note_indices[i]
    delay = np.random.uniform(0.15, 0.25)
    timing_start_offsets[idx] = delay

print(f"  Timing errors at start, note_indices: {list(timing_start_offsets.keys())}")
print(f"  Delays (sec): {timing_start_offsets}")

audio_timing_start = synthesize_performance(notes, timing_offsets=timing_start_offsets)
save_wav(audio_timing_start, "timing_start.wav")

timing_start_label = {
    "description": "タイミングずれテスト（演奏開始時点）",
    "errors": [
        {"note_index": idx, "delay_sec": timing_start_offsets[idx]}
        for idx in timing_start_offsets
    ],
    "expected": {
        "timing_error_indices": list(timing_start_offsets.keys()),
        "all_other_notes": "should be start_ok=true"
    }
}

# =========================
# 4. タイミングずれ（演奏途中）
# =========================
print("\n[4/4] Generating timing_mid.wav ...")

# 中盤の3ノートを 0.15〜0.25 秒遅らせる
mid_start = len(note_entries) // 3
mid_end = mid_start + min(3, len(note_entries) - mid_start)

timing_mid_offsets = {}
for i in range(mid_start, mid_end):
    idx = note_indices[i]
    delay = np.random.uniform(0.15, 0.25)
    timing_mid_offsets[idx] = delay

print(f"  Timing errors at mid, note_indices: {list(timing_mid_offsets.keys())}")
print(f"  Delays (sec): {timing_mid_offsets}")

audio_timing_mid = synthesize_performance(notes, timing_offsets=timing_mid_offsets)
save_wav(audio_timing_mid, "timing_mid.wav")

timing_mid_label = {
    "description": "タイミングずれテスト（演奏途中）",
    "errors": [
        {"note_index": idx, "delay_sec": timing_mid_offsets[idx]}
        for idx in timing_mid_offsets
    ],
    "expected": {
        "timing_error_indices": list(timing_mid_offsets.keys()),
        "all_other_notes": "should be start_ok=true"
    }
}

# =========================
# 正解ラベルを保存
# =========================
all_labels = {
    "bpm": bpm,
    "total_notes": len(note_entries),
    "note_indices": note_indices,
    "test_cases": {
        "perfect": {
            "file": "perfect.wav",
            "description": "全ノート正確。全て pitch_ok=true, start_ok=true になるべき",
        },
        "pitch_error": {
            "file": "pitch_error.wav",
            **pitch_error_label,
        },
        "timing_start": {
            "file": "timing_start.wav",
            **timing_start_label,
        },
        "timing_mid": {
            "file": "timing_mid.wav",
            **timing_mid_label,
        },
    }
}

labels_path = os.path.join(OUTPUT_DIR, "test_labels.json")
with open(labels_path, "w", encoding="utf-8") as f:
    json.dump(all_labels, f, indent=2, ensure_ascii=False)

print(f"\n正解ラベル → {labels_path}")
print("\n=== 生成完了 ===")
print(f"出力フォルダ: {OUTPUT_DIR}/")
print("  perfect.wav        — 完璧な演奏")
print("  pitch_error.wav    — 音程ずれ")
print("  timing_start.wav   — タイミングずれ（開始時点）")
print("  timing_mid.wav     — タイミングずれ（途中）")
print("  test_labels.json   — 正解ラベル（検証用）")
