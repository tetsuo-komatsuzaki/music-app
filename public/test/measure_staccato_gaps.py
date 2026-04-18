"""
measure_staccato_gaps.py
========================
スタッカート録音のノート間無音区間を実測するスクリプト。
ノイズゲートの GATE_HOLD_FRAMES パラメータ決定に使う。

使い方:
    python measure_staccato_gaps.py                      # input/sample.wav を使用
    python measure_staccato_gaps.py path/to/staccato.wav # 任意のWAVを指定

出力:
    コンソール: ギャップ統計 + RMS分布 + テキスト波形
    output/staccato_gaps.csv: 全フレームのRMS + gate状態
"""

import sys
import csv
import librosa
import numpy as np
from pathlib import Path

# =========================
# パス設定
# =========================
BASE_DIR   = Path(__file__).resolve().parent
INPUT_FILE = Path(sys.argv[1]) if len(sys.argv) > 1 else BASE_DIR / "input" / "sample.wav"
OUTPUT_CSV = BASE_DIR / "output" / "staccato_gaps.csv"
OUTPUT_CSV.parent.mkdir(exist_ok=True)

# =========================
# 解析パラメータ（analyze_performance.py と同一）
# =========================
HOP_LENGTH   = 256
FRAME_LENGTH = 2048

# ゲート検証用パラメータ（ここを変えて再実行して比較する）
RMS_THRESHOLD   = 0.01   # 現行の固定閾値（比較用）
ATTACK_FRAMES   = 3      # ゲート開くまでの連続フレーム数
HOLD_CANDIDATES = [0, 4, 8, 12, 20]  # 複数のHOLD値を同時検証（単位: フレーム）

# =========================
# 1. 音声読み込み
# =========================
print(f"Loading: {INPUT_FILE}")
y, sr = librosa.load(str(INPUT_FILE), sr=None)
duration_sec = len(y) / sr
print(f"  Duration: {duration_sec:.2f}s  SR: {sr}Hz")

# =========================
# 2. RMS + f0 抽出
# =========================
rms = librosa.feature.rms(y=y, frame_length=FRAME_LENGTH, hop_length=HOP_LENGTH)[0]
f0  = librosa.yin(y,
                  fmin=librosa.note_to_hz("G3"),
                  fmax=librosa.note_to_hz("E6"),
                  sr=sr,
                  frame_length=FRAME_LENGTH,
                  hop_length=HOP_LENGTH)
time_all = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=HOP_LENGTH)

rms      = np.array(rms,      dtype=float)
f0       = np.array(f0[:len(rms)], dtype=float)
time_all = np.array(time_all[:len(rms)], dtype=float)

frame_dur_ms = (HOP_LENGTH / sr) * 1000  # 1フレームの長さ(ms)

# =========================
# 3. RMS分布の表示
# =========================
print("\n── RMS分布 ──────────────────────────────────")
for p in [5, 10, 15, 25, 50, 75, 90, 95]:
    val = np.percentile(rms, p)
    bar = "#" * int(val * 500)
    print(f"  p{p:2d}: {val:.4f}  {bar}")

print(f"\n  現行 RMS_THRESHOLD = {RMS_THRESHOLD}")
above = np.sum(rms > RMS_THRESHOLD)
print(f"  threshold超え: {above}/{len(rms)} フレーム ({above/len(rms)*100:.0f}%)")

# =========================
# 4. ゲート状態機械（Hold違いで複数パターン計算）
# =========================
def apply_gate(rms_arr, threshold, attack_frames, hold_frames):
    """
    Returns: boolean mask (True=gate open)
    State: 0=CLOSED, 1=OPENING, 2=OPEN, 3=HOLDING
    """
    n      = len(rms_arr)
    gate   = np.zeros(n, dtype=bool)
    state  = 0   # CLOSED
    attack_cnt = 0
    hold_cnt   = 0

    for i in range(n):
        loud = rms_arr[i] > threshold

        if state == 0:   # CLOSED
            if loud:
                attack_cnt = 1
                state = 1
        elif state == 1: # OPENING
            if loud:
                attack_cnt += 1
                if attack_cnt >= attack_frames:
                    state = 2
            else:
                attack_cnt = 0
                state = 0
        elif state == 2: # OPEN
            gate[i] = True
            if not loud:
                hold_cnt = 1
                state = 3
        elif state == 3: # HOLDING
            gate[i] = True
            if loud:
                hold_cnt = 0
                state = 2
            else:
                hold_cnt += 1
                if hold_cnt >= hold_frames:
                    state = 0
                    hold_cnt = 0

    return gate


# =========================
# 5. ノート間ギャップを計測
# =========================
def measure_gaps(gate_mask, time_arr):
    """
    gate_mask の OFF→ON 遷移から、連続する音符間のギャップを抽出。
    Returns: list of gap_ms (float)
    """
    gaps_ms = []
    in_note   = False
    note_end  = None

    for i in range(len(gate_mask)):
        if gate_mask[i] and not in_note:
            # 音符開始
            if note_end is not None:
                gap = (time_arr[i] - note_end) * 1000
                if gap > 0:
                    gaps_ms.append(gap)
            in_note = True
        elif not gate_mask[i] and in_note:
            # 音符終了
            note_end = time_arr[i]
            in_note  = False

    return gaps_ms


print("\n── Hold別ギャップ統計 ────────────────────────")
print(f"{'Hold':>6} {'ms':>6}  {'ギャップ数':>8}  "
      f"{'min':>7}  {'p25':>7}  {'med':>7}  {'p75':>7}  {'max':>7}  {'<46ms':>7}")

all_gaps = {}
for hold_f in HOLD_CANDIDATES:
    gate  = apply_gate(rms, RMS_THRESHOLD, ATTACK_FRAMES, hold_f)
    gaps  = measure_gaps(gate, time_all)
    all_gaps[hold_f] = gaps

    if len(gaps) == 0:
        print(f"  hold={hold_f:2d} ({hold_f*frame_dur_ms:5.0f}ms)  ギャップなし（音が全て繋がった）")
        continue

    a = np.array(gaps)
    n_short = int(np.sum(a < 46))  # 46ms未満（現設計のHOLD=8fr相当）
    print(f"  hold={hold_f:2d} ({hold_f*frame_dur_ms:5.0f}ms)"
          f"  {len(gaps):8d}"
          f"  {np.min(a):7.1f}"
          f"  {np.percentile(a,25):7.1f}"
          f"  {np.median(a):7.1f}"
          f"  {np.percentile(a,75):7.1f}"
          f"  {np.max(a):7.1f}"
          f"  {n_short:5d}/{len(gaps)}")

# =========================
# 6. Hold=0（生のギャップ）を詳細表示
# =========================
raw_gaps = all_gaps[0]
if raw_gaps:
    print("\n── 生ギャップ（Hold=0）分布 ─────────────────")
    a = np.array(raw_gaps)
    buckets = [(0,20),(20,40),(40,60),(60,80),(80,120),(120,200),(200,9999)]
    for lo, hi in buckets:
        cnt = int(np.sum((a >= lo) & (a < hi)))
        bar = "#" * cnt
        label = f"{lo}-{hi}ms" if hi < 9999 else f"{lo}ms+"
        print(f"  {label:12s}: {cnt:3d}  {bar}")

# =========================
# 7. テキスト波形（最初の10秒）
# =========================
print("\n-- RMS wave (first 10s) -------------------------")
DISPLAY_SEC = 10.0
COLS        = 80
mask_10s    = time_all <= DISPLAY_SEC
rms_10s     = rms[mask_10s]
time_10s    = time_all[mask_10s]

# COLS幅にダウンサンプル
bucket_size = max(1, len(rms_10s) // COLS)
bars = ""
blocks = " 12345678"
gate0 = apply_gate(rms, RMS_THRESHOLD, ATTACK_FRAMES, 0)[mask_10s]
gate8 = apply_gate(rms, RMS_THRESHOLD, ATTACK_FRAMES, 8)[mask_10s]

print("  RMS : ", end="")
for i in range(0, len(rms_10s) - bucket_size, bucket_size):
    chunk = rms_10s[i:i+bucket_size]
    level = float(np.max(chunk))
    idx   = min(int(level / 0.025 * 8), 8)
    print(blocks[idx], end="")
print()

print("  G=0 : ", end="")
for i in range(0, len(gate0) - bucket_size, bucket_size):
    chunk = gate0[i:i+bucket_size]
    print("#" if chunk.any() else ".", end="")
print()

print("  G=8 : ", end="")
for i in range(0, len(gate8) - bucket_size, bucket_size):
    chunk = gate8[i:i+bucket_size]
    print("#" if chunk.any() else ".", end="")
print()

print(f"  0s{'':<{COLS-6}}{DISPLAY_SEC:.0f}s")

# =========================
# 8. CSV出力（全フレーム）
# =========================
gate_hold0 = apply_gate(rms, RMS_THRESHOLD, ATTACK_FRAMES, 0)
gate_hold8 = apply_gate(rms, RMS_THRESHOLD, ATTACK_FRAMES, 8)

with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as fp:
    writer = csv.writer(fp)
    writer.writerow(["time_sec", "rms", "f0_hz", "gate_hold0", "gate_hold8",
                     "above_threshold"])
    for i in range(len(time_all)):
        writer.writerow([
            round(float(time_all[i]), 4),
            round(float(rms[i]),      5),
            round(float(f0[i]), 2) if not np.isnan(f0[i]) else "",
            int(gate_hold0[i]),
            int(gate_hold8[i]),
            int(rms[i] > RMS_THRESHOLD),
        ])

print(f"\nCSV saved: {OUTPUT_CSV}")
print("   (Excel/SheetsでRMS列をグラフ化すると波形が確認できます)")
print("\n── 判定基準 ─────────────────────────────────")
print("  生ギャップ(Hold=0)の最小値 > HOLD設定値  → HOLD設定が安全")
print("  生ギャップ(Hold=0)の最小値 < HOLD設定値  → HOLDがギャップを埋めてしまう（要調整）")
