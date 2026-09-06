"""
_cache.py — テストケースをローカルに写して読む

OneDrive 上の wav は読むだけで 278 秒かかった (ローカルなら 0.5 秒)。
解析に使うファイルは一度だけローカルへ写し、以後はそちらを読む。
デコード済み音声も .npy で隣に置く。

置き場所: %LOCALAPPDATA%\\arcoda-audit-cache\\<case_id>\\
          環境変数 ARCODA_AUDIT_CACHE で変更可
"""

import os
import pathlib
import shutil
import tempfile

import numpy as np


def cache_root() -> pathlib.Path:
    env = os.environ.get("ARCODA_AUDIT_CACHE")
    if env:
        root = pathlib.Path(env)
    else:
        base = os.environ.get("LOCALAPPDATA") or tempfile.gettempdir()
        root = pathlib.Path(base) / "arcoda-audit-cache"
    root.mkdir(parents=True, exist_ok=True)
    return root


def local_case(case_dir: pathlib.Path) -> pathlib.Path:
    """case_dir の中身をローカルへ写し、そのパスを返す。写し済みなら何もしない。"""
    case_dir = pathlib.Path(case_dir)
    dst = cache_root() / case_dir.name
    dst.mkdir(parents=True, exist_ok=True)
    for src in case_dir.iterdir():
        if not src.is_file():
            continue
        out = dst / src.name
        if out.exists() and out.stat().st_size == src.stat().st_size:
            continue
        shutil.copy2(src, out)
    return dst


def load_audio(wav_path) -> tuple[np.ndarray, int]:
    """wav の隣の .npy を優先。なければ読んで作る。モノラル float32。"""
    import soundfile as sf
    p = pathlib.Path(wav_path)
    npy = p.with_suffix(".npy")
    sr = int(sf.info(str(p)).samplerate)
    if npy.exists():
        return np.load(str(npy)), sr
    y, _ = sf.read(str(p), dtype="float32")
    if y.ndim > 1:
        y = y.mean(axis=1)
    try:
        np.save(str(npy), y)
    except OSError:
        pass
    return y, sr
