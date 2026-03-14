import librosa
import numpy as np
import json
from pathlib import Path

# =========================
# パス設定
# =========================
BASE_DIR = Path(__file__).resolve().parent
AUDIO_FILE = BASE_DIR / "input" / "sample.wav"

OUTPUT_DIR = BASE_DIR / "output"
OUTPUT_DIR.mkdir(exist_ok=True)
OUTPUT_JSON = OUTPUT_DIR / "audio_features.json"

# =========================
# 1. 音声読み込み
# =========================
y, sr = librosa.load(AUDIO_FILE, sr=None)

# =========================
# 2. フレーム設定
# =========================
hop_length = 256
frame_length = 2048

# =========================
# 3. ピッチ抽出（YIN）
# =========================
f0 = librosa.yin(
    y,
    fmin=librosa.note_to_hz("G3"),
    fmax=librosa.note_to_hz("E6"),
    sr=sr,
    frame_length=frame_length,
    hop_length=hop_length
)

# =========================
# 4. 時間軸生成
# =========================
times = librosa.frames_to_time(
    np.arange(len(f0)),
    sr=sr,
    hop_length=hop_length
)

# =========================
# 5. RMS（音量）
# =========================
rms = librosa.feature.rms(
    y=y,
    frame_length=frame_length,
    hop_length=hop_length
)[0]

# =========================
# 6. Onset検出
# =========================
onset_frames = librosa.onset.onset_detect(
    y=y,
    sr=sr,
    hop_length=hop_length
)

onset_times = librosa.frames_to_time(
    onset_frames,
    sr=sr,
    hop_length=hop_length
)

# =========================
# 🔵 録音データ前処理
# =========================

f0 = np.array(f0)
rms = np.array(rms)

# 無声音除去（nan）
not_nan_mask = ~np.isnan(f0)

# 小音量除去（ノイズカット）
rms_threshold = 0.01
loud_mask = rms > rms_threshold

# 有効フレーム
valid_mask = not_nan_mask & loud_mask

valid_time = times[valid_mask]
valid_f0 = f0[valid_mask]

# =========================
# 7. JSON保存
# =========================
result = {
    "sr": int(sr),
    "hop_length": hop_length,
    "frame_length": frame_length,
    "time": times.tolist(),
    "f0_hz": f0.tolist(),
    "rms": rms.tolist(),
    "onset_times": onset_times.tolist(),
    "valid_time": valid_time.tolist(),
    "valid_f0": valid_f0.tolist()
}

with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
    json.dump(result, f, indent=2)

print("Audio feature extraction complete.")
print(f"Saved to {OUTPUT_JSON}")
