"""numba の JIT コンパイル結果をイメージに焼き込むためのウォームアップ (2026-09-12)。

なぜ必要か:
  librosa.yin などは numba で JIT コンパイルされる。Cloud Run Jobs は実行ごとに
  新しいコンテナで起動するため、キャッシュが無いと毎回ゼロからコンパイルし直す。
  本番イメージ (analyzer:v138) 上での実測では、この初回コンパイルに 22.1 秒かかり、
  キャッシュがあると 1.6 秒で済む (92.6% 削減)。

  Cloud Run (2 vCPU) 換算では 1 本あたり 27.0 秒 → 2.0 秒、
  実行時間全体で 41.9 秒 → 16.9 秒 (60% 削減) になる。

何をするか:
  実際の解析と同じ関数・同じ引数の型・同じパラメータで 1 回だけ呼び、
  コンパイル結果を NUMBA_CACHE_DIR に書き出す。docker build の中で走らせることで、
  そのキャッシュがイメージのレイヤーに残り、以後すべての実行で再利用される。

やらないこと:
  - アプリのコード (analyze_performance.py 等) は呼ばない
  - DB・Supabase・ネットワークに一切触らない。音声は合成波で作る
  - 解析ロジックは変更しない。計算結果は不変 (本番イメージ上で md5 一致を確認済み)

重要:
  numba のキャッシュ鍵は CPU の指定を含む。ビルド時と実行時で NUMBA_CPU_NAME が
  食い違うとキャッシュを読まない (実測で確認)。Cloud Run は載る CPU が変わりうるため、
  Dockerfile で NUMBA_CPU_NAME=generic を固定し、ビルドと実行の両方で同じ鍵になるようにする。
  ENV は実行時のコンテナにも継承されるので、Cloud Run 側の設定変更は不要。
"""

from __future__ import annotations

import os
import sys
import time

import numpy as np
import librosa

# analyze_performance.py と同じ定数 (ずれるとコンパイル対象が変わりキャッシュが効かない)
HOP_LENGTH = 256
FRAME_LENGTH = 2048
SPECTRAL_N_FFT = 4096
SR = 44100  # ffmpeg で 44.1kHz mono に変換してから librosa に渡している
PITCH_LOW, PITCH_HIGH = "G3", "E7"  # INSTRUMENT_PITCH_RANGE["violin"]

WARM_SECONDS = 8  # コンパイルが目的なので短くてよい


def synth(seconds: int) -> np.ndarray:
    """音程が動く合成波。librosa.load と同じ float32 で返す (dtype が違うと別コンパイルになる)。"""
    rng = np.random.default_rng(0)
    t = np.arange(int(SR * seconds)) / SR
    semitones = (np.sin(2 * np.pi * 0.3 * t) * 6).round()
    freq = 220.0 * (2 ** (semitones / 12))
    wave = 0.3 * np.sin(2 * np.pi * np.cumsum(freq) / SR)
    noise = 0.01 * rng.standard_normal(t.size)
    return (wave + noise).astype(np.float32)


def main() -> None:
    cache_dir = os.environ.get("NUMBA_CACHE_DIR", "(未設定)")
    print(f"[warm_numba] NUMBA_CACHE_DIR={cache_dir}")
    print(f"[warm_numba] NUMBA_CPU_NAME={os.environ.get('NUMBA_CPU_NAME', '(未設定)')}")
    if cache_dir == "(未設定)":
        print("[warm_numba] NUMBA_CACHE_DIR が未設定です。キャッシュが残らない可能性があります", file=sys.stderr)

    y = synth(WARM_SECONDS)
    fmin = librosa.note_to_hz(PITCH_LOW)
    fmax = librosa.note_to_hz(PITCH_HIGH)

    t0 = time.perf_counter()
    f0 = librosa.yin(y, fmin=fmin, fmax=fmax, sr=SR, frame_length=FRAME_LENGTH, hop_length=HOP_LENGTH)
    librosa.frames_to_time(np.arange(len(f0)), sr=SR, hop_length=HOP_LENGTH)
    librosa.feature.rms(y=y, frame_length=FRAME_LENGTH, hop_length=HOP_LENGTH)
    np.abs(librosa.stft(y, n_fft=SPECTRAL_N_FFT, hop_length=HOP_LENGTH))
    librosa.fft_frequencies(sr=SR, n_fft=SPECTRAL_N_FFT)
    librosa.onset.onset_detect(y=y, sr=SR, hop_length=HOP_LENGTH)
    first = time.perf_counter() - t0

    # 2 回目が十分速ければ、コンパイル結果が使える状態になっている
    t0 = time.perf_counter()
    librosa.yin(y, fmin=fmin, fmax=fmax, sr=SR, frame_length=FRAME_LENGTH, hop_length=HOP_LENGTH)
    librosa.feature.rms(y=y, frame_length=FRAME_LENGTH, hop_length=HOP_LENGTH)
    np.abs(librosa.stft(y, n_fft=SPECTRAL_N_FFT, hop_length=HOP_LENGTH))
    librosa.onset.onset_detect(y=y, sr=SR, hop_length=HOP_LENGTH)
    second = time.perf_counter() - t0

    files = 0
    if os.path.isdir(cache_dir):
        files = sum(len(fs) for _, _, fs in os.walk(cache_dir))

    print(f"[warm_numba] 初回 {first:.3f}s / 2回目 {second:.3f}s / JIT {first - second:.3f}s")
    print(f"[warm_numba] キャッシュファイル {files} 個")

    if files == 0:
        print("[warm_numba] キャッシュが 1 つも書き出されていません。ビルドを止めます", file=sys.stderr)
        raise SystemExit(1)
    print("[warm_numba] ok")


if __name__ == "__main__":
    main()
