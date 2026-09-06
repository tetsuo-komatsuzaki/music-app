"""
benchmark_runner.py — 解析器の回帰ベンチマーク
Usage: python tests/benchmark_runner.py [--case CASE_ID] [--no-onset]

tests/cases/*/ を全件、本番と同じ経路 (tests/audit/offline_analyzer.py) で解析し、
expected.json と突き合わせてメトリクスを出す。Markdown レポートと履歴 JSON を残す。

これが測るもの / 測らないもの (2026-09-06 監査で整理):
  - 測るもの: 「前回と同じ出力が出るか」。expected.json は解析器の過去の出力から
    自動生成されたもの (confidence: auto_generated) なので、これは正解との一致ではなく
    基準線との一致。解析器を変えたとき、意図しない変化を検知するためのもの。
  - 測らないもの: 検出の正しさ。それは tests/audit/ (既知量シフト・合成音) が担う。
    人の耳で検証した expected.json (confidence: reviewed) が揃えば、この数字も
    正しさの尺度になる。

2026-09-06 以前はこのスクリプトは一度も動いていなかった。
  - `from analyze_performance import analyze_performance` という関数は存在しない
  - analyze_performance.py は import 時に DB へ接続する
  - 失敗すると comparison_result.json (= expected.json の生成元) に黙って倒れ、
    「自分の過去の出力と自分の過去の出力」を比べていた
今は offline_analyzer 経由で本体の関数をそのまま呼ぶ。解析に失敗したケースは
スキップとして明示し、黙って代替しない。
"""

import argparse
import json
import pathlib
import sys
import traceback
from datetime import datetime, timezone

import numpy as np

# ─── パス設定 ─────────────────────────────────────────────────
TESTS_DIR    = pathlib.Path(__file__).resolve().parent
ANALYZER_DIR = TESTS_DIR.parent
CASES_DIR    = TESTS_DIR / "cases"
HISTORY_DIR  = TESTS_DIR / "history"
HISTORY_DIR.mkdir(exist_ok=True)

sys.path.insert(0, str(TESTS_DIR / "audit"))
from _cache import local_case            # noqa: E402
from offline_analyzer import analyze_case  # noqa: E402


# ─── ピッチ → MIDI ────────────────────────────────────────────

def pitch_to_midi(pitch_str: str) -> int:
    if not pitch_str or pitch_str in ("rest", ""):
        return -1
    from music21 import pitch as m21pitch
    try:
        return m21pitch.Pitch(pitch_str).midi
    except Exception:
        return -1


# ─── 判定ポリシー適用 ─────────────────────────────────────────

def apply_policy(notes_out: list[dict], policy: dict, tolerance: dict) -> list[dict]:
    """
    expected.json の evaluation_policy / tolerance で各音符を判定する。
    追加するフィールド: pitch_ok, start_ok, onset_error_ms, pitch_error_cents

    pitch_error_cents は解析器が返す実測セント (pitch_cents_error) を優先する。
    旧実装は音名同士の差 (100 セント刻み) しか見ておらず、pitch_mae が半音単位でしか
    出なかった。
    """
    onset_ms    = tolerance.get("onset_ms",   120)
    pitch_cents = tolerance.get("pitch_cents", 35)
    alignment_mode      = policy.get("alignment_mode",      "monotonic")
    tempo_normalization = policy.get("tempo_normalization", True)

    detected_starts = [n["detected_start_sec"] for n in notes_out if n.get("detected_start_sec") is not None]
    expected_starts = [n["expected_start_sec"] for n in notes_out if n.get("expected_start_sec") is not None]
    if tempo_normalization and len(detected_starts) == len(expected_starts) and expected_starts:
        ratio = (sum(detected_starts) / len(detected_starts)) / max(sum(expected_starts) / len(expected_starts), 1e-9)
    else:
        ratio = 1.0

    evaluated = []
    last_matched_idx = -1
    duplicate_match_count = 0
    for i, n in enumerate(notes_out):
        det_start = n.get("detected_start_sec")
        exp_start = n.get("expected_start_sec")
        onset_error_ms = None
        pitch_error_cents = None
        pitch_ok = False
        start_ok = False

        if det_start is not None and exp_start is not None:
            onset_error_ms = abs(det_start / max(ratio, 1e-9) - exp_start) * 1000.0
            start_ok = onset_error_ms <= onset_ms
            if alignment_mode == "monotonic":
                if i <= last_matched_idx:
                    duplicate_match_count += 1
                else:
                    last_matched_idx = i

        if n.get("pitch_cents_error") is not None:
            pitch_error_cents = abs(float(n["pitch_cents_error"]))
            pitch_ok = pitch_error_cents <= pitch_cents
        elif n.get("detected_pitch") and n.get("expected_pitch"):
            dm, em = pitch_to_midi(n["detected_pitch"]), pitch_to_midi(n["expected_pitch"])
            if dm >= 0 and em >= 0:
                pitch_error_cents = abs(dm - em) * 100.0
                pitch_ok = pitch_error_cents <= pitch_cents

        evaluated.append({**n, "pitch_ok": pitch_ok, "start_ok": start_ok,
                          "onset_error_ms": onset_error_ms, "pitch_error_cents": pitch_error_cents})
    if evaluated:
        evaluated[0]["_duplicate_match_count"] = duplicate_match_count
    return evaluated


# ─── 1ケース評価 ─────────────────────────────────────────────

def evaluate_case(case_dir: pathlib.Path, use_onset: bool | None = None) -> dict:
    case_id = case_dir.name
    expected_path = case_dir / "expected.json"
    if not expected_path.exists():
        return {"skip": True, "reason": "expected.json がない", "case_id": case_id}
    if not (case_dir / "recording.wav").exists():
        return {"skip": True, "reason": "recording.wav がない", "case_id": case_id}

    expected = json.loads(expected_path.read_text(encoding="utf-8"))
    meta_path = case_dir / "meta.json"
    meta = json.loads(meta_path.read_text(encoding="utf-8")) if meta_path.exists() else {}
    policy    = expected.get("evaluation_policy", {})
    tolerance = expected.get("tolerance", {})
    exp_notes = expected.get("notes", [])
    provenance = expected.get("confidence", "unknown")

    tags_meta = []
    if meta.get("has_shift"):           tags_meta.append("shift")
    if meta.get("has_rest"):            tags_meta.append("rest")
    if meta.get("has_string_crossing"): tags_meta.append("string_crossing")
    if pitch_to_midi(meta.get("max_pitch", "")) >= 76: tags_meta.append("high_position")

    # 解析 (本番経路・ローカル写し)
    try:
        res = analyze_case(local_case(case_dir), use_onset=use_onset)
    except Exception as e:
        return {"skip": True, "case_id": case_id,
                "reason": f"解析失敗: {type(e).__name__}: {str(e)[:120]}",
                "traceback": traceback.format_exc()}
    by_index = {int(r["note_index"]): r for r in res["results"] if r.get("note_index") is not None}
    # expected.json の時刻は楽譜基準 (time_reference: score)。解析結果は録音基準なので
    # 位置合わせ量 global_shift を引いて同じ基準に揃える。
    gs = float(res["summary"]["global_shift"])
    if expected.get("time_reference", "score") != "score":
        gs = 0.0

    merged = []
    for i, exp_n in enumerate(exp_notes):
        if not exp_n.get("should_exist", True):
            continue
        det = by_index.get(int(exp_n.get("note_index", i)), {})
        ds = det.get("detected_start_sec")
        merged.append({
            "note_index":         exp_n.get("note_index", i),
            "expected_pitch":     exp_n.get("expected_pitch", ""),
            "expected_start_sec": exp_n.get("expected_start_sec"),
            "expected_end_sec":   exp_n.get("expected_end_sec"),
            "detected_pitch_hz":  det.get("detected_pitch_hz"),
            "detected_start_sec": (float(ds) - gs) if ds is not None else None,
            "pitch_cents_error":  det.get("pitch_cents_error"),
            "evaluation_status":  det.get("evaluation_status", "not_detected"),
            "match_confidence":   det.get("match_confidence", ""),
        })
    evaluated = apply_policy(merged, policy, tolerance)
    total = len(evaluated)
    if total == 0:
        return {"skip": True, "reason": "音符が0件", "case_id": case_id}

    detected     = [n for n in evaluated if n["evaluation_status"] not in ("not_detected", "section_missing")]
    wrong_notes  = [n for n in evaluated if n["evaluation_status"] == "wrong_note"]
    pitch_ok     = [n for n in detected if n["pitch_ok"]]
    onset_errors = [n["onset_error_ms"] for n in detected if n["onset_error_ms"] is not None]
    pitch_errors = [n["pitch_error_cents"] for n in evaluated if n["pitch_error_cents"] is not None]

    cascade_failures, run = 0, 0
    for n in evaluated:
        if n["evaluation_status"] in ("not_detected", "wrong_note", "section_missing"):
            run += 1
            if run == 3:
                cascade_failures += 1
        else:
            run = 0

    return {
        "skip": False, "case_id": case_id,
        "dataset_split": meta.get("dataset_split", "train"),
        "difficulty": meta.get("difficulty", "medium"),
        "tags": tags_meta, "provenance": provenance,
        "total_notes": total,
        "note_detection_rate":  len(detected) / total,
        "pitch_accuracy_rate":  len(pitch_ok) / max(len(detected), 1),
        "false_positive_rate":  len(wrong_notes) / total,
        "onset_mae_ms":         float(np.mean(onset_errors)) if onset_errors else 0.0,
        "pitch_mae_cents":      float(np.mean(pitch_errors)) if pitch_errors else 0.0,
        "cascade_failure_count": cascade_failures,
        "analyzer_summary": res["summary"],
        "notes_source": res.get("notes_source", {}),
        "_onset_errors": onset_errors, "_pitch_errors": pitch_errors,
    }


# ─── 集計 / レポート ─────────────────────────────────────────

def p95(values):
    return float(np.percentile(values, 95)) if values else 0.0


def pct(v):
    return f"{v * 100:.1f}%"


def build_report(ts, skipped, results, summary, split_summary, tag_summary):
    L = [f"# Benchmark Report — {ts}", ""]
    auto = sum(1 for r in results if r["provenance"] == "auto_generated")
    L += ["> **読み方**: これは基準線との一致率であり、正解との一致率ではない。",
          f"> expected.json {auto}/{len(results)} 件が解析器の過去出力から自動生成 (auto_generated)。",
          "> 検出の正しさは tests/audit/ の既知量シフト・合成音プローブで測る。", ""]
    L += ["## 全体サマリー", "| メトリクス | 値 |", "|---|---|",
          f"| note_detection_rate | {pct(summary['detection'])} |",
          f"| pitch_accuracy_rate | {pct(summary['pitch'])} |",
          f"| false_positive_rate | {pct(summary['false_positive'])} |",
          f"| onset_mae | {summary['onset_mae']:.1f}ms |",
          f"| onset_p95 | {summary['onset_p95']:.1f}ms |",
          f"| pitch_mae | {summary['pitch_mae']:.1f}cent |",
          f"| pitch_p95 | {summary['pitch_p95']:.1f}cent |",
          f"| cascade_failures | {summary['cascade_failures']} |",
          f"| case_count | {summary['case_count']} |", ""]
    L += ["## ケース別", "| case | split | notes | detection | pitch_ok | pitch_mae | onset_mae | not_detected | global_shift |",
          "|---|---|---:|---:|---:|---:|---:|---:|---:|"]
    for r in results:
        s = r["analyzer_summary"]
        L.append(f"| {r['case_id']} | {r['dataset_split']} | {r['total_notes']} | {pct(r['note_detection_rate'])} | "
                 f"{pct(r['pitch_accuracy_rate'])} | {r['pitch_mae_cents']:.1f}c | {r['onset_mae_ms']:.0f}ms | "
                 f"{s['not_detected']} | {s['global_shift']:.2f}s |")
    L.append("")
    if split_summary:
        L += ["## split 別", "| split | count | detection | pitch |", "|---|---:|---:|---:|"]
        for sp, v in split_summary.items():
            L.append(f"| {sp} | {v['count']} | {pct(v['detection'])} | {pct(v['pitch'])} |")
        L.append("")
    if tag_summary:
        L += ["## タグ別", "| tag | count | detection | pitch |", "|---|---:|---:|---:|"]
        for tg, v in tag_summary.items():
            L.append(f"| {tg} | {v['count']} | {pct(v['detection'])} | {pct(v['pitch'])} |")
        L.append("")
    L += ["## スキップ", "| case | 理由 |", "|---|---|"]
    for s in skipped:
        L.append(f"| {s['case_id']} | {s['reason']} |")
    L += [f"\nスキップ: {len(skipped)}件", ""]
    return "\n".join(L)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--case", default="", help="1ケースだけ実行する場合の case_id")
    ap.add_argument("--no-onset", action="store_true", help="USE_ONSET_DETECTION=false で実行")
    args = ap.parse_args()

    ts      = datetime.now().strftime("%Y%m%d_%H%M%S")
    ts_iso  = datetime.now(timezone.utc).isoformat()
    ts_date = datetime.now().strftime("%Y%m%d")

    case_dirs = sorted(d for d in CASES_DIR.iterdir() if d.is_dir())
    if args.case:
        case_dirs = [d for d in case_dirs if d.name == args.case]
    if not case_dirs:
        print("[WARN] tests/cases/ にケースがありません")
        return
    print(f"評価対象: {len(case_dirs)} ケース", flush=True)

    skipped, results = [], []
    all_onset, all_pitch = [], []
    for d in case_dirs:
        r = evaluate_case(d, use_onset=(False if args.no_onset else None))
        if r.get("skip"):
            print(f"  [SKIP] {r['case_id']}: {r['reason']}", flush=True)
            if r.get("traceback"):
                print("         " + r["traceback"].strip().splitlines()[-1], flush=True)
            skipped.append(r)
        else:
            s = r["analyzer_summary"]
            print(f"  [OK]   {r['case_id']}: detection={r['note_detection_rate']:.1%} "
                  f"pitch={r['pitch_accuracy_rate']:.1%} pitch_mae={r['pitch_mae_cents']:.1f}c "
                  f"not_detected={s['not_detected']}/{s['notes']} shift={s['global_shift']:.2f}s", flush=True)
            results.append(r)
            all_onset.extend(r["_onset_errors"])
            all_pitch.extend(r["_pitch_errors"])

    if not results:
        print("[WARN] 評価できたケースが0件でした")
        return

    n = len(results)
    summary = {
        "detection":      sum(r["note_detection_rate"] for r in results) / n,
        "pitch":          sum(r["pitch_accuracy_rate"] for r in results) / n,
        "false_positive": sum(r["false_positive_rate"] for r in results) / n,
        "onset_mae":      sum(r["onset_mae_ms"] for r in results) / n,
        "onset_p95":      p95(all_onset),
        "pitch_mae":      sum(r["pitch_mae_cents"] for r in results) / n,
        "pitch_p95":      p95(all_pitch),
        "cascade_failures": sum(r["cascade_failure_count"] for r in results),
        "case_count":     n,
    }
    split_groups, tag_groups = {}, {}
    for r in results:
        split_groups.setdefault(r["dataset_split"], []).append(r)
        for tg in r["tags"]:
            tag_groups.setdefault(tg, []).append(r)

    def agg(rs):
        return {"count": len(rs),
                "detection": sum(x["note_detection_rate"] for x in rs) / len(rs),
                "pitch": sum(x["pitch_accuracy_rate"] for x in rs) / len(rs)}
    split_summary = {k: agg(v) for k, v in split_groups.items()}
    tag_summary   = {k: agg(v) for k, v in tag_groups.items()}

    report_path = HISTORY_DIR / f"benchmark_{ts}.md"
    report_path.write_text(build_report(ts, skipped, results, summary, split_summary, tag_summary), encoding="utf-8")
    print(f"\n[OK] レポート: {report_path}")

    history = {
        "timestamp": ts_iso, "case_count": n,
        "metrics": {k: (round(v, 4) if isinstance(v, float) else v) for k, v in summary.items()},
        "cases": {r["case_id"]: {
            "provenance": r["provenance"],
            "detection": round(r["note_detection_rate"], 4),
            "pitch": round(r["pitch_accuracy_rate"], 4),
            "pitch_mae": round(r["pitch_mae_cents"], 2),
            "onset_mae": round(r["onset_mae_ms"], 2),
            "analyzer": r["analyzer_summary"],
        } for r in results},
        "skipped": [{"case_id": s["case_id"], "reason": s["reason"]} for s in skipped],
    }
    history_path = HISTORY_DIR / f"benchmark_{ts_date}.json"
    history_path.write_text(json.dumps(history, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[OK] 履歴JSON: {history_path}")

    print("\n── 全体サマリー ──────────────────────────")
    print(f"  note_detection_rate:  {summary['detection']:.1%}")
    print(f"  pitch_accuracy_rate:  {summary['pitch']:.1%}")
    print(f"  pitch_mae:            {summary['pitch_mae']:.1f}c  (p95: {summary['pitch_p95']:.1f}c)")
    print(f"  onset_mae:            {summary['onset_mae']:.1f}ms  (p95: {summary['onset_p95']:.1f}ms)")
    print(f"  cascade_failures:     {summary['cascade_failures']}")


if __name__ == "__main__":
    main()
