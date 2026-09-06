"""
make_expected.py — ケースの expected.json を analysis.json から作る

expected.json は「この録音で、各音符がどこで何の高さで鳴るべきか」。
楽譜側の真値 (音高・楽譜上の時刻) は analysis.json にあるので、そこから作る。
時刻は楽譜基準 (start_time_sec)。録音との位置合わせ (global_shift) は解析器の
仕事であり、正解側には含めない。

confidence は auto_generated のまま。人の耳で「この録音ではこの音は鳴っていない /
別の音を弾いている」を確認したら、notes[].should_exist や review を直して
confidence: reviewed にする。そのとき初めて、ベンチマークは正しさの尺度になる。

Usage:
  python tests/audit/make_expected.py [--force] [case_id ...]
    --force  既存の expected.json も作り直す (auto_generated のものだけ。reviewed は触らない)
"""

import argparse
import json
import pathlib
from datetime import date

import librosa

HERE = pathlib.Path(__file__).resolve().parent
CASES_DIR = HERE.parent / "cases"

POLICY = {"onset_mode": "absolute", "pitch_mode": "closest", "alignment_mode": "monotonic",
          "timing_reference": "score_based", "tempo_normalization": False}
TOLERANCE = {"onset_ms": 120, "offset_ms": 180, "pitch_cents": 35}


def build(case_dir: pathlib.Path) -> dict:
    a = json.loads((case_dir / "analysis.json").read_text(encoding="utf-8"))
    notes = []
    for n in a["notes"]:
        if n.get("type") != "note" or not n.get("pitches"):
            continue
        hz = float(n["pitches"][0])
        notes.append({
            "note_index": int(n["note_index"]),
            "expected_pitch": n.get("note_name") or librosa.hz_to_note(hz),
            "expected_pitch_hz": hz,
            "expected_start_sec": float(n["start_time_sec"]),
            "expected_end_sec": float(n["end_time_sec"]),
            "should_exist": True, "confidence": 1.0, "review": False, "tags": ["normal"],
        })
    return {
        "case_id": case_dir.name, "version": 2,
        "derived_from": "analysis.json", "time_reference": "score",
        "last_reviewed_at": date.today().isoformat(),
        "confidence": "auto_generated", "needs_review": True,
        "evaluation_policy": POLICY, "tolerance": TOLERANCE,
        "sequence_confidence": 1.0, "sequence_breaks": [],
        "bpm": a.get("bpm"), "notes": notes,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cases", nargs="*")
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()
    ids = args.cases or sorted(d.name for d in CASES_DIR.iterdir() if d.is_dir())
    for cid in ids:
        d = CASES_DIR / cid
        if not (d / "analysis.json").exists():
            print(f"{cid}: analysis.json がない (fetch_case_inputs.py を先に)")
            continue
        out = d / "expected.json"
        if out.exists():
            cur = json.loads(out.read_text(encoding="utf-8"))
            if cur.get("confidence") == "reviewed":
                print(f"{cid}: reviewed のため触らない")
                continue
            if not args.force:
                print(f"{cid}: 既にある (--force で作り直し)")
                continue
        doc = build(d)
        out.write_text(json.dumps(doc, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"{cid}: wrote {len(doc['notes'])} notes (score-relative)")


if __name__ == "__main__":
    main()
