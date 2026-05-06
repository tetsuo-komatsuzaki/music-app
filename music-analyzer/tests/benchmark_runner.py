"""
benchmark_runner.py
Usage: python tests/benchmark_runner.py

tests/cases/*/ を全件評価してメトリクスを算出し、
Markdownレポートと履歴JSONを出力する。
"""

import json
import pathlib
import sys
import math
from datetime import datetime, timezone

import numpy as np

# ─── パス設定 ─────────────────────────────────────────────────
TESTS_DIR    = pathlib.Path(__file__).resolve().parent
ANALYZER_DIR = TESTS_DIR.parent
CASES_DIR    = TESTS_DIR / "cases"
HISTORY_DIR  = TESTS_DIR / "history"
HISTORY_DIR.mkdir(exist_ok=True)

# ─── analyze_performance のインポート（同階層想定）─────────────
sys.path.insert(0, str(ANALYZER_DIR))
try:
    from analyze_performance import analyze_performance
    ANALYZER_AVAILABLE = True
except ImportError:
    ANALYZER_AVAILABLE = False


# ─── ピッチ → MIDI ────────────────────────────────────────────

def pitch_to_midi(pitch_str: str) -> int:
    if not pitch_str or pitch_str in ("rest", ""):
        return -1
    from music21 import pitch as m21pitch
    try:
        return m21pitch.Pitch(pitch_str).midi
    except Exception:
        return -1


def midi_to_cents(midi: int) -> float:
    return float(midi) * 100.0


# ─── テンポ正規化 ─────────────────────────────────────────────

def tempo_normalize_onsets(
    detected_starts: list[float],
    expected_starts: list[float],
) -> list[float]:
    """
    演奏全体の平均速度差を正規化してから onset_error を返す。
    ratio = mean(detected) / mean(expected) で全体スケールを補正。
    """
    if not detected_starts or not expected_starts:
        return []
    ratio = (sum(detected_starts) / len(detected_starts)) / max(
        sum(expected_starts) / len(expected_starts), 1e-9
    )
    normalized = [d / ratio for d in detected_starts]
    return normalized


# ─── evaluation_policy 適用 ──────────────────────────────────

def apply_policy(
    notes_out: list[dict],
    policy: dict,
    tolerance: dict,
) -> list[dict]:
    """
    evaluation_policy に基づいて各音符の評価結果を算出する。
    notes_out は analyze_performance の出力（またはそれに準じる辞書リスト）。
    返すリストには以下を追加する:
      - pitch_ok, start_ok, evaluation_status
      - onset_error_ms, pitch_error_cents
    """
    onset_ms  = tolerance.get("onset_ms",   120)
    offset_ms = tolerance.get("offset_ms",  180)
    pitch_cents = tolerance.get("pitch_cents", 35)

    onset_mode         = policy.get("onset_mode",         "relative")
    alignment_mode     = policy.get("alignment_mode",     "monotonic")
    tempo_normalization = policy.get("tempo_normalization", True)

    # テンポ正規化
    detected_starts  = [n.get("detected_start_sec", 0.0) for n in notes_out if n.get("detected_start_sec") is not None]
    expected_starts  = [n.get("expected_start_sec",  0.0) for n in notes_out if n.get("expected_start_sec")  is not None]

    if tempo_normalization and len(detected_starts) == len(expected_starts) and expected_starts:
        ratio = (sum(detected_starts) / len(detected_starts)) / max(
            sum(expected_starts) / len(expected_starts), 1e-9
        )
    else:
        ratio = 1.0

    evaluated = []
    last_matched_idx = -1
    duplicate_match_count = 0

    for i, note_entry in enumerate(notes_out):
        det_start = note_entry.get("detected_start_sec")
        exp_start = note_entry.get("expected_start_sec")
        det_pitch = note_entry.get("detected_pitch", "")
        exp_pitch = note_entry.get("expected_pitch", "")

        onset_error_ms  = None
        pitch_error_cents = None
        pitch_ok = False
        start_ok = False

        if det_start is not None and exp_start is not None:
            det_norm = det_start / max(ratio, 1e-9)
            onset_error_ms = abs(det_norm - exp_start) * 1000.0
            start_ok = onset_error_ms <= onset_ms

            # monotonic 制約チェック
            if alignment_mode == "monotonic":
                if i <= last_matched_idx:
                    duplicate_match_count += 1
                else:
                    last_matched_idx = i

        if det_pitch and exp_pitch:
            det_midi = pitch_to_midi(det_pitch)
            exp_midi = pitch_to_midi(exp_pitch)
            if det_midi >= 0 and exp_midi >= 0:
                pitch_error_cents = abs(det_midi - exp_midi) * 100.0
                pitch_ok = pitch_error_cents <= pitch_cents

        result = {**note_entry,
                  "pitch_ok":           pitch_ok,
                  "start_ok":           start_ok,
                  "onset_error_ms":     onset_error_ms,
                  "pitch_error_cents":  pitch_error_cents,
                  "_duplicate":         False}
        evaluated.append(result)

    evaluated[0]["_duplicate_match_count"] = duplicate_match_count  # 先頭に集約
    return evaluated


# ─── 1ケース評価 ─────────────────────────────────────────────

def evaluate_case(case_dir: pathlib.Path) -> dict | None:
    """
    1ケースを評価してメトリクス辞書を返す。
    スキップ条件を満たす場合は {"skip": True, "reason": "..."} を返す。
    """
    case_id      = case_dir.name
    expected_path = case_dir / "expected.json"
    wav_path      = case_dir / "recording.wav"
    meta_path     = case_dir / "meta.json"

    # スキップ判定
    if not expected_path.exists():
        return {"skip": True, "reason": "expected.json が存在しません", "case_id": case_id}
    if not wav_path.exists():
        return {"skip": True, "reason": "recording.wav が存在しません", "case_id": case_id}

    expected = json.loads(expected_path.read_text(encoding="utf-8"))
    meta      = json.loads(meta_path.read_text(encoding="utf-8")) if meta_path.exists() else {}

    policy    = expected.get("evaluation_policy", {})
    tolerance = expected.get("tolerance", {})
    exp_notes = expected.get("notes", [])

    dataset_split = meta.get("dataset_split", "train")
    difficulty    = meta.get("difficulty",    "medium")
    tags_meta     = []
    if meta.get("has_shift"):            tags_meta.append("shift")
    if meta.get("has_rest"):             tags_meta.append("rest")
    if meta.get("has_string_crossing"):  tags_meta.append("string_crossing")
    max_pitch_midi = pitch_to_midi(meta.get("max_pitch", ""))
    if max_pitch_midi >= 76:             tags_meta.append("high_position")

    # 分析実行（analyze_performance が使えない場合は comparison_result.json を流用）
    cr_path = case_dir / "comparison_result.json"
    if ANALYZER_AVAILABLE:
        try:
            mxl_path = case_dir / "score.mxl"
            raw_results = analyze_performance(str(wav_path), str(mxl_path))
            notes_out = raw_results.get("notes", raw_results.get("results", []))
        except Exception as e:
            if cr_path.exists():
                cr = json.loads(cr_path.read_text(encoding="utf-8"))
                notes_out = cr.get("notes", cr.get("results", []))
            else:
                return {"skip": True, "reason": f"analyze_performance 失敗: {e}", "case_id": case_id}
    else:
        if not cr_path.exists():
            return {"skip": True, "reason": "comparison_result.json が存在しません（分析エンジン未利用時）", "case_id": case_id}
        cr = json.loads(cr_path.read_text(encoding="utf-8"))
        notes_out = cr.get("notes", cr.get("results", []))

    # expected と notes_out をマージ（expected の pitch/timing を正解とする）
    merged = []
    for i, exp_n in enumerate(exp_notes):
        if not exp_n.get("should_exist", True):
            continue
        det = notes_out[i] if i < len(notes_out) else {}
        merged.append({
            "expected_pitch":    exp_n.get("expected_pitch",    ""),
            "expected_start_sec": exp_n.get("expected_start_sec", 0.0),
            "expected_end_sec":  exp_n.get("expected_end_sec",  0.0),
            "detected_pitch":    det.get("detected_pitch",  det.get("pitch", "")),
            "detected_start_sec": det.get("detected_start_sec", det.get("start_sec")),
            "evaluation_status": det.get("evaluation_status", "not_detected"),
            "confidence_level":  det.get("confidence_level", ""),
            "start_ok":          det.get("start_ok",  False),
            "pitch_ok":          det.get("pitch_ok",  False),
        })

    evaluated = apply_policy(merged, policy, tolerance)

    # ── メトリクス算出 ──
    total_notes = len(evaluated)
    if total_notes == 0:
        return {"skip": True, "reason": "音符が0件", "case_id": case_id}

    detected      = [n for n in evaluated if n["evaluation_status"] != "not_detected"]
    wrong_notes   = [n for n in evaluated if n["evaluation_status"] == "wrong_note"]
    pitch_ok_list = [n for n in detected  if n.get("pitch_ok", False)]

    onset_errors  = [n["onset_error_ms"]   for n in detected if n.get("onset_error_ms")    is not None]
    offset_errors: list[float] = []  # offset情報は現行スキーマに含まれないため空
    pitch_errors  = [n["pitch_error_cents"] for n in evaluated if n.get("pitch_error_cents") is not None]

    note_detection_rate  = len(detected)     / total_notes
    pitch_accuracy_rate  = len(pitch_ok_list) / max(len(detected), 1)
    false_positive_rate  = len(wrong_notes)  / total_notes
    onset_mae            = sum(onset_errors) / len(onset_errors)  if onset_errors else 0.0
    offset_mae           = sum(offset_errors) / len(offset_errors) if offset_errors else 0.0
    pitch_mae            = sum(pitch_errors) / len(pitch_errors)  if pitch_errors else 0.0

    # cascade_failure_count
    cascade_failures = 0
    run = 0
    in_cascade = False
    for n in evaluated:
        if n["evaluation_status"] in ("not_detected", "wrong_note"):
            run += 1
            if run == 3 and not in_cascade:
                cascade_failures += 1
                in_cascade = True
        else:
            run = 0
            in_cascade = False
        # run が 3 超でも同一カスケード
        if run > 3:
            in_cascade = True

    skipped_note_count  = total_notes - len(detected)
    dup_count           = evaluated[0].get("_duplicate_match_count", 0) if evaluated else 0

    return {
        "skip":                  False,
        "case_id":               case_id,
        "dataset_split":         dataset_split,
        "difficulty":            difficulty,
        "tags":                  tags_meta,
        "total_notes":           total_notes,
        "note_detection_rate":   note_detection_rate,
        "pitch_accuracy_rate":   pitch_accuracy_rate,
        "false_positive_rate":   false_positive_rate,
        "onset_mae_ms":          onset_mae,
        "offset_mae_ms":         offset_mae,
        "pitch_mae_cents":       pitch_mae,
        "alignment_success_rate": pitch_accuracy_rate,  # pitchOK = alignment OK と近似
        "cascade_failure_count": cascade_failures,
        "skipped_note_count":    skipped_note_count,
        "duplicate_match_count": dup_count,
        "_onset_errors":         onset_errors,
        "_pitch_errors":         pitch_errors,
    }


# ─── p95 算出 ────────────────────────────────────────────────

def p95(values: list[float]) -> float:
    if not values:
        return 0.0
    return float(np.percentile(values, 95))


# ─── レポート生成 ────────────────────────────────────────────

def format_pct(v: float) -> str:
    return f"{v * 100:.1f}%"


def build_report(
    ts: str,
    skipped: list[dict],
    results: list[dict],
    summary: dict,
    split_summary: dict,
    tag_summary: dict,
    overfitting_warning: str | None,
) -> str:
    lines = [
        f"# Benchmark Report — {ts}",
        "",
    ]

    # スキップ
    lines += ["## スキップ", "| case_id | 理由 |", "|---|---|"]
    for s in skipped:
        lines.append(f"| {s['case_id']} | {s['reason']} |")
    lines += [f"\nスキップ: {len(skipped)}件", ""]

    # 過学習警告
    if overfitting_warning:
        lines += [f"> **[WARNING]** {overfitting_warning}", ""]

    # 全体サマリー
    lines += [
        "## 全体サマリー",
        "| メトリクス | スコア |",
        "|---|---|",
        f"| note_detection_rate    | {format_pct(summary['detection'])} |",
        f"| pitch_accuracy_rate    | {format_pct(summary['pitch'])} |",
        f"| false_positive_rate    | {format_pct(summary['false_positive'])} |",
        f"| onset_mae              | {summary['onset_mae']:.1f}ms |",
        f"| onset_p95              | {summary['onset_p95']:.1f}ms |",
        f"| pitch_mae              | {summary['pitch_mae']:.1f}cent |",
        f"| pitch_p95              | {summary['pitch_p95']:.1f}cent |",
        f"| alignment_success_rate | {format_pct(summary['alignment'])} |",
        f"| cascade_failure_count  | {summary['cascade_failures']}件 |",
        f"| 評価ケース数            | {summary['case_count']}件 |",
        f"| スキップ数              | {len(skipped)}件 |",
        "",
    ]

    # dataset_split 別サマリー
    lines += [
        "## dataset_split別サマリー",
        "| split | ケース数 | detection | pitch | onset_mae | onset_p95 |",
        "|-------|---------|-----------|-------|-----------|-----------|",
    ]
    for split, sv in split_summary.items():
        lines.append(
            f"| {split} | {sv['count']}件 | {format_pct(sv['detection'])} | "
            f"{format_pct(sv['pitch'])} | {sv['onset_mae']:.1f}ms | {sv['onset_p95']:.1f}ms |"
        )
    lines.append("")

    # ケース別詳細
    lines += [
        "## ケース別詳細",
        "| case_id | detection | pitch | fpr | onset_mae | onset_p95 | cascade | tags |",
        "|---------|-----------|-------|-----|-----------|-----------|---------|------|",
    ]
    for r in results:
        op95 = p95(r["_onset_errors"])
        lines.append(
            f"| {r['case_id']} | {format_pct(r['note_detection_rate'])} | "
            f"{format_pct(r['pitch_accuracy_rate'])} | {format_pct(r['false_positive_rate'])} | "
            f"{r['onset_mae_ms']:.1f}ms | {op95:.1f}ms | "
            f"{r['cascade_failure_count']} | {', '.join(r['tags']) or '–'} |"
        )
    lines.append("")

    # タグ別集計
    lines += [
        "## タグ別集計",
        "| tag | detection | pitch | fpr | ケース数 |",
        "|-----|-----------|-------|-----|---------|",
    ]
    for tag, tv in tag_summary.items():
        lines.append(
            f"| {tag} | {format_pct(tv['detection'])} | "
            f"{format_pct(tv['pitch'])} | {format_pct(tv['fpr'])} | {tv['count']}件 |"
        )

    return "\n".join(lines)


# ─── メイン処理 ──────────────────────────────────────────────

def main():
    ts       = datetime.now().strftime("%Y%m%d_%H%M%S")
    ts_iso   = datetime.now(timezone.utc).isoformat()
    ts_date  = datetime.now().strftime("%Y%m%d")

    case_dirs = sorted([d for d in CASES_DIR.iterdir() if d.is_dir()])
    if not case_dirs:
        print("[WARN] tests/cases/ にケースがありません")
        return

    print(f"評価対象: {len(case_dirs)} ケース")

    skipped = []
    results = []
    all_onset_errors: list[float] = []
    all_pitch_errors: list[float] = []

    for case_dir in case_dirs:
        res = evaluate_case(case_dir)
        if res is None:
            continue
        if res.get("skip"):
            print(f"  [SKIP] {res['case_id']}: {res['reason']}")
            skipped.append(res)
        else:
            print(f"  [OK]   {res['case_id']}: detection={res['note_detection_rate']:.1%} pitch={res['pitch_accuracy_rate']:.1%}")
            results.append(res)
            all_onset_errors.extend(res["_onset_errors"])
            all_pitch_errors.extend(res["_pitch_errors"])

    if not results:
        print("[WARN] 評価できたケースが0件でした")
        return

    # ── 全体サマリー ──
    n = len(results)
    onset_p95_val = p95(all_onset_errors)
    pitch_p95_val = p95(all_pitch_errors)

    summary = {
        "detection":       sum(r["note_detection_rate"]   for r in results) / n,
        "pitch":           sum(r["pitch_accuracy_rate"]   for r in results) / n,
        "false_positive":  sum(r["false_positive_rate"]   for r in results) / n,
        "onset_mae":       sum(r["onset_mae_ms"]          for r in results) / n,
        "onset_p95":       onset_p95_val,
        "pitch_mae":       sum(r["pitch_mae_cents"]       for r in results) / n,
        "pitch_p95":       pitch_p95_val,
        "alignment":       sum(r["alignment_success_rate"] for r in results) / n,
        "cascade_failures": sum(r["cascade_failure_count"] for r in results),
        "case_count":      n,
    }

    # ── dataset_split 別集計 ──
    split_groups: dict[str, list[dict]] = {}
    for r in results:
        sp = r.get("dataset_split", "train")
        split_groups.setdefault(sp, []).append(r)

    split_summary = {}
    for sp, rs in split_groups.items():
        sp_onset = [e for r in rs for e in r["_onset_errors"]]
        split_summary[sp] = {
            "count":     len(rs),
            "detection": sum(r["note_detection_rate"] for r in rs) / len(rs),
            "pitch":     sum(r["pitch_accuracy_rate"] for r in rs) / len(rs),
            "onset_mae": sum(r["onset_mae_ms"]        for r in rs) / len(rs),
            "onset_p95": p95(sp_onset),
        }

    # ── 過学習チェック ──
    overfitting_warning = None
    if "train" in split_summary and "eval" in split_summary:
        diff = split_summary["train"]["detection"] - split_summary["eval"]["detection"]
        if diff > 0.10:
            overfitting_warning = (
                f"過学習の可能性があります  "
                f"train: {split_summary['train']['detection']:.1%}  "
                f"eval: {split_summary['eval']['detection']:.1%}  "
                f"差: {diff:.1%}"
            )
            print(f"\n[WARNING] {overfitting_warning}")

    # ── タグ別集計 ──
    tag_groups: dict[str, list[dict]] = {}
    for r in results:
        for tag in r.get("tags", []):
            tag_groups.setdefault(tag, []).append(r)

    tag_summary = {}
    for tag, rs in tag_groups.items():
        tag_summary[tag] = {
            "count":     len(rs),
            "detection": sum(r["note_detection_rate"]  for r in rs) / len(rs),
            "pitch":     sum(r["pitch_accuracy_rate"]  for r in rs) / len(rs),
            "fpr":       sum(r["false_positive_rate"]  for r in rs) / len(rs),
        }

    # ── レポート出力 ──
    report_path = TESTS_DIR / f"report_{ts}.md"
    report_text = build_report(ts, skipped, results, summary, split_summary, tag_summary, overfitting_warning)
    report_path.write_text(report_text, encoding="utf-8")
    print(f"\n[OK] レポート: {report_path}")

    # ── 履歴JSON ──
    history = {
        "timestamp":  ts_iso,
        "case_count": n,
        "metrics": {
            "detection":       round(summary["detection"],      4),
            "pitch":           round(summary["pitch"],          4),
            "false_positive":  round(summary["false_positive"], 4),
            "onset_mae":       round(summary["onset_mae"],      2),
            "onset_p95":       round(onset_p95_val,             2),
            "pitch_mae":       round(summary["pitch_mae"],      2),
            "pitch_p95":       round(pitch_p95_val,             2),
            "alignment":       round(summary["alignment"],      4),
            "cascade_failures": summary["cascade_failures"],
        },
        "split": {
            sp: {
                "detection": round(sv["detection"], 4),
                "pitch":     round(sv["pitch"],     4),
            }
            for sp, sv in split_summary.items()
        },
    }
    history_path = HISTORY_DIR / f"benchmark_{ts_date}.json"
    history_path.write_text(json.dumps(history, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[OK] 履歴JSON: {history_path}")

    # ── サマリー表示 ──
    print(f"\n── 全体サマリー ──────────────────────────")
    print(f"  note_detection_rate:  {summary['detection']:.1%}")
    print(f"  pitch_accuracy_rate:  {summary['pitch']:.1%}")
    print(f"  false_positive_rate:  {summary['false_positive']:.1%}")
    print(f"  onset_mae:            {summary['onset_mae']:.1f}ms  (p95: {onset_p95_val:.1f}ms)")
    print(f"  pitch_mae:            {summary['pitch_mae']:.1f}cent (p95: {pitch_p95_val:.1f}cent)")
    print(f"  cascade_failures:     {summary['cascade_failures']}件")
    print(f"  評価ケース: {n}件 / スキップ: {len(skipped)}件")

    if split_summary:
        print(f"\n── dataset_split 別 ──────────────────────")
        for sp, sv in split_summary.items():
            print(f"  {sp}: detection={sv['detection']:.1%}  pitch={sv['pitch']:.1%}  "
                  f"onset_mae={sv['onset_mae']:.1f}ms  onset_p95={sv['onset_p95']:.1f}ms  ({sv['count']}件)")


if __name__ == "__main__":
    main()
