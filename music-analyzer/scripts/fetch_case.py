"""
fetch_case.py
Usage: python scripts/fetch_case.py <performanceId>

Supabaseから演奏データを取得して tests/cases/{performanceId}/ に保存する。
"""

import sys
import json
import hashlib
import pathlib
import subprocess
from datetime import datetime, timezone

from dotenv import load_dotenv
import os
import psycopg2
import requests

# ─── パス設定 ────────────────────────────────────────────────
SCRIPT_DIR   = pathlib.Path(__file__).resolve().parent
ANALYZER_DIR = SCRIPT_DIR.parent
PROJECT_ROOT = ANALYZER_DIR.parent

load_dotenv(ANALYZER_DIR / ".env")

DATABASE_URL  = os.environ["DATABASE_URL"]
SUPABASE_URL  = os.environ["SUPABASE_URL"]
SUPABASE_KEY  = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

CASES_DIR     = ANALYZER_DIR / "tests" / "cases"


# ─── DB 接続 ─────────────────────────────────────────────────

def db_connect():
    return psycopg2.connect(DATABASE_URL)


# ─── Storage ダウンロード ─────────────────────────────────────

def storage_download(bucket: str, path: str) -> bytes:
    """Supabase Storage からファイルをダウンロード"""
    url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{path}"
    headers = {
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "apikey": SUPABASE_KEY,
    }
    r = requests.get(url, headers=headers, timeout=120)
    r.raise_for_status()
    return r.content


BUCKET_PERFORMANCES = "performances"
BUCKET_MXL          = "musicxml"


# ─── git commit / analyzer hash ──────────────────────────────

def get_git_commit() -> str:
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=PROJECT_ROOT,
            stderr=subprocess.DEVNULL,
        ).decode().strip()
    except Exception:
        return "unknown"


def get_analyzer_hash() -> str:
    analyzer_path = ANALYZER_DIR / "analyze_performance.py"
    if not analyzer_path.exists():
        return "unknown"
    return hashlib.md5(analyzer_path.read_bytes()).hexdigest()[:8]


# ─── MXL 解析 ────────────────────────────────────────────────

VIOLIN_STRINGS_RANGE = {
    "G": (55, 70),
    "D": (62, 77),
    "A": (69, 84),
    "E": (76, 108),
}
STRING_ORDER = ["G", "D", "A", "E"]


def pitch_to_midi(pitch_str: str) -> int:
    from music21 import pitch as m21pitch
    try:
        return m21pitch.Pitch(pitch_str).midi
    except Exception:
        return -1


def which_string(midi: int) -> str | None:
    for s, (lo, hi) in VIOLIN_STRINGS_RANGE.items():
        if lo <= midi <= hi:
            return s
    return None


def cross_string(midi_a: int, midi_b: int) -> bool:
    sa = which_string(midi_a)
    sb = which_string(midi_b)
    if sa is None or sb is None:
        return False
    ia = STRING_ORDER.index(sa)
    ib = STRING_ORDER.index(sb)
    return abs(ia - ib) >= 2


def analyze_mxl(mxl_path: pathlib.Path) -> dict:
    from music21 import converter, chord

    sc   = converter.parse(str(mxl_path))
    flat = sc.flat.notesAndRests

    pitches_midi: list[int] = []
    has_rest            = False
    note_count          = 0
    has_string_crossing = False
    has_shift           = False
    prev_midi           = -1
    measure_notes: dict[int, list[str]] = {}

    for el in flat:
        if el.isRest:
            has_rest  = True
            prev_midi = -1
            continue

        if isinstance(el, chord.Chord):
            midis = [p.midi for p in el.pitches]
        else:
            midis = [el.pitch.midi]

        note_count    += len(midis)
        pitches_midi.extend(midis)

        m_num = el.measureNumber or 0
        if m_num not in measure_notes:
            measure_notes[m_num] = []

        from music21 import pitch as m21p
        for m in midis:
            measure_notes[m_num].append(m21p.Pitch(m).nameWithOctave)

        for m in midis:
            if prev_midi >= 0:
                interval = abs(m - prev_midi)
                if interval >= 7:
                    has_shift = True
                if cross_string(prev_midi, m):
                    has_string_crossing = True
            prev_midi = m

    max_pitch = ""
    if pitches_midi:
        from music21 import pitch as m21p
        max_pitch = m21p.Pitch(max(pitches_midi)).nameWithOctave

    return {
        "note_count":           note_count,
        "max_pitch":            max_pitch,
        "has_rest":             has_rest,
        "has_string_crossing":  has_string_crossing,
        "has_shift":            has_shift,
        "_measure_notes":       measure_notes,
    }


# ─── difficulty 自動推定 ──────────────────────────────────────

def estimate_difficulty(mxl_info: dict, tempo_bpm: float) -> str:
    score = 0
    max_midi = pitch_to_midi(mxl_info["max_pitch"]) if mxl_info.get("max_pitch") else -1
    if max_midi >= pitch_to_midi("E5"):
        score += 1
    if mxl_info.get("has_shift"):
        score += 1
    if tempo_bpm > 100:
        score += 1
    if mxl_info.get("has_string_crossing"):
        score += 1

    if score == 0:
        return "easy"
    elif score <= 2:
        return "medium"
    else:
        return "hard"


# ─── メイン処理 ──────────────────────────────────────────────

def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/fetch_case.py <performanceId>")
        sys.exit(1)

    performance_id = sys.argv[1]
    case_dir       = CASES_DIR / performance_id
    case_dir.mkdir(parents=True, exist_ok=True)

    conn = db_connect()
    cur  = conn.cursor()

    # ── 1. Performance レコード取得 ──
    print(f"Fetching Performance {performance_id} ...")
    cur.execute(
        """
        SELECT p.id, p."scoreId", p."audioPath", p."comparisonResultPath",
               p."createdAt",
               s.title, s."generatedXmlPath"
        FROM   "Performance" p
        LEFT JOIN "Score" s ON s.id = p."scoreId"
        WHERE  p.id = %s
        """,
        (performance_id,),
    )
    row = cur.fetchone()
    if row is None:
        print(f"[ERROR] Performance {performance_id} が見つかりません")
        cur.close(); conn.close()
        sys.exit(1)

    (_, score_id, audio_path, comparison_path,
     created_at, title, generated_xml_path) = row
    mxl_storage_path = generated_xml_path
    analyzer_version = "unknown"

    # tempo_bpm を別テーブルから取得する場合に備えてデフォルト 0
    tempo_bpm = 0.0

    cur.close()
    conn.close()

    # ── 2. recording.wav ダウンロード ──
    if audio_path:
        print(f"  Downloading recording.wav ...")
        wav_bytes = storage_download(BUCKET_PERFORMANCES, audio_path)
        (case_dir / "recording.wav").write_bytes(wav_bytes)
        print(f"    → recording.wav ({len(wav_bytes):,} bytes)")
    else:
        print("  [WARN] audioPath が空です。recording.wav をスキップ")

    # ── 3. comparison_result.json ダウンロード ──
    if comparison_path:
        print(f"  Downloading comparison_result.json ...")
        json_bytes = storage_download(BUCKET_PERFORMANCES, comparison_path)
        (case_dir / "comparison_result.json").write_bytes(json_bytes)
        print(f"    → comparison_result.json ({len(json_bytes):,} bytes)")
    else:
        print("  [WARN] comparisonResultPath が空です。comparison_result.json をスキップ")

    # ── 4. score.mxl ダウンロード ──
    mxl_path = case_dir / "score.mxl"
    if mxl_storage_path:
        print(f"  Downloading score.mxl ...")
        mxl_bytes = storage_download(BUCKET_MXL, mxl_storage_path)
        mxl_path.write_bytes(mxl_bytes)
        print(f"    → score.mxl ({len(mxl_bytes):,} bytes)")
    else:
        print("  [WARN] mxlStoragePath が空です。score.mxl をスキップ")

    # ── 5. MXL 解析 ──
    mxl_info   = {}
    difficulty = "medium"
    if mxl_path.exists():
        print("  Analyzing score.mxl ...")
        try:
            mxl_info   = analyze_mxl(mxl_path)
            difficulty = estimate_difficulty(mxl_info, tempo_bpm)
        except Exception as e:
            print(f"  [WARN] MXL 解析失敗: {e}")

    # ── 6. meta.json 生成 ──
    meta = {
        "performance_id":      performance_id,
        "score_id":            score_id or "",
        "title":               title or "",
        "tempo_bpm":           tempo_bpm,
        "created_at":          created_at.isoformat() if created_at else "",
        "analyzer_version":    analyzer_version or "unknown",
        "git_commit":          get_git_commit(),
        "analyzer_hash":       get_analyzer_hash(),
        "dataset_split":       "train",
        "difficulty":          difficulty,
        "params":              {},
        "note_count":          mxl_info.get("note_count",          0),
        "max_pitch":           mxl_info.get("max_pitch",           ""),
        "has_rest":            mxl_info.get("has_rest",            False),
        "has_string_crossing": mxl_info.get("has_string_crossing", False),
        "has_shift":           mxl_info.get("has_shift",           False),
    }
    (case_dir / "meta.json").write_text(
        json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    # ── 7. 標準出力 ──
    print(f"\n[OK] tests/cases/{performance_id}/ に保存しました")

    measure_notes = mxl_info.get("_measure_notes", {})
    if measure_notes:
        print("\nMXL音符情報（先頭10小節）:")
        for m_num in sorted(measure_notes.keys())[:10]:
            notes_str = " ".join(measure_notes[m_num])
            print(f"  m.{m_num}: {notes_str}")

    tags = []
    max_midi = pitch_to_midi(mxl_info["max_pitch"]) if mxl_info.get("max_pitch") else -1
    if max_midi >= pitch_to_midi("E5"):
        tags.append("high_position")
    if mxl_info.get("has_shift"):
        tags.append("shift")
    if mxl_info.get("has_rest"):
        tags.append("rest")

    print("\n推定タグ:")
    if tags:
        for t in tags:
            print(f"  - {t}")
    else:
        print("  （なし）")

    print(f"\ndifficulty（自動推定）: {difficulty}")


if __name__ == "__main__":
    main()
