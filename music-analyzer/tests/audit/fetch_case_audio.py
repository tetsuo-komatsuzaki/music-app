"""
fetch_case_audio.py — 本番の演奏を監査ケースとして取り寄せる (読み取りのみ)

tests/cases/<performance_id>/ に recording.wav (webm は ffmpeg で 44.1kHz mono に変換) と
meta.json を置き、fetch_case_inputs と同じ手順で analysis.json / params.json も揃える。

Usage:
  python tests/audit/fetch_case_audio.py <performance_id> [...]
"""
import json
import os
import pathlib
import subprocess
import sys

import psycopg2
import requests
from dotenv import load_dotenv

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import fetch_case_inputs as fci  # noqa: E402

ANALYZER_DIR = HERE.parents[1]
CASES_DIR = HERE.parent / "cases"
load_dotenv(ANALYZER_DIR / ".env")
URL = os.getenv("SUPABASE_URL"); KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
PERF_BUCKET = os.getenv("PERFORMANCE_BUCKET", "performances")


def ffmpeg_exe():
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return "ffmpeg"


def main():
    ids = sys.argv[1:]
    if not ids:
        raise SystemExit("performance_id を指定")
    conn = psycopg2.connect(os.getenv("DATABASE_URL")); conn.set_session(readonly=True, autocommit=True)
    cur = conn.cursor()
    for pid in ids:
        cur.execute('''SELECT p."audioPath", s.title, p."uploadedAt", p."scoreId"
                       FROM "Performance" p JOIN "Score" s ON s.id = p."scoreId" WHERE p.id = %s''', (pid,))
        row = cur.fetchone()
        if not row or not row[0]:
            print(f"{pid}: 音声パスがない"); continue
        audio_path, title, uploaded, score_id = row
        d = CASES_DIR / pid; d.mkdir(parents=True, exist_ok=True)
        raw = requests.get(f"{URL}/storage/v1/object/{PERF_BUCKET}/{audio_path}",
                           headers={"Authorization": f"Bearer {KEY}"}, timeout=120)
        raw.raise_for_status()
        ext = pathlib.Path(audio_path).suffix.lower()
        src = d / f"recording_src{ext}"
        src.write_bytes(raw.content)
        wav = d / "recording.wav"
        r = subprocess.run([ffmpeg_exe(), "-y", "-loglevel", "error", "-i", str(src),
                            "-ar", "44100", "-ac", "1", "-acodec", "pcm_s16le", str(wav)],
                           capture_output=True, text=True)
        if r.returncode != 0:
            print(f"{pid}: ffmpeg 失敗 {r.stderr[:200]}"); continue
        src.unlink(missing_ok=True)
        (d / "meta.json").write_text(json.dumps({
            "performance_id": pid, "score_id": score_id, "title": title,
            "created_at": uploaded.isoformat(), "dataset_split": "eval",
            "source": "production (fetch_case_audio.py)", "tempo_bpm": 0.0,
        }, ensure_ascii=False, indent=2), encoding="utf-8")
        msg = fci.fetch_one(cur, d)
        print(f"{pid}: {title} {wav.stat().st_size//1000}KB  {msg}", flush=True)
    cur.close(); conn.close()


if __name__ == "__main__":
    main()
