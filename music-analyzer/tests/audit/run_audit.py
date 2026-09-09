"""
run_audit.py — 音程監査の3層をまとめて回し、履歴に残す

  層1 pitch_probe   フレーム f0 の既知量シフト応答
  層2 note_probe    音符報告値の既知量シフト応答・誤合格数
  層3 motion_probe  合成音の音内変化に対する報告値

Usage:
  python tests/audit/run_audit.py [--case CASE_ID] [--seconds 30] [--quick]

出力: tests/audit/history/audit_<日付>.json と .md
      解析器を変えたら回して、前回と数字を比べる。
"""

import argparse
import json
import pathlib
import subprocess
import sys
import warnings
warnings.filterwarnings("ignore")
from datetime import datetime, timezone

import numpy as np
import librosa

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from _cache import local_case, load_audio  # noqa: E402
import _load_analyzer  # noqa: E402
import pitch_probe  # noqa: E402
import note_probe  # noqa: E402
import motion_probe  # noqa: E402

CASES_DIR = HERE.parent / "cases"
HISTORY_DIR = HERE / "history"
DEFAULT_CASE = "cmnl2fcv800000ojywq952uxk"   # 糸・50音評価済・欠落0


def git_commit() -> str:
    try:
        return subprocess.check_output(["git", "rev-parse", "--short", "HEAD"],
                                       cwd=str(HERE), text=True).strip()
    except Exception:
        return "unknown"


def layer1(case_local: pathlib.Path, seconds: float, cents: list[int]):
    A = _load_analyzer.load()
    fmin_note, fmax_note = A.INSTRUMENT_PITCH_RANGE["violin"]
    fmin, fmax = librosa.note_to_hz(fmin_note), librosa.note_to_hz(fmax_note)
    y, sr = load_audio(str(case_local / "recording.wav"))
    if seconds > 0:
        y = y[:int(seconds * sr)]
    rows, valid, total = pitch_probe.probe(y, sr, cents, fmin, fmax)
    return {"seconds": round(len(y) / sr, 1), "valid_frames": valid, "total_frames": total, "rows": rows}


def layer2(case_local: pathlib.Path, cents: list[int]):
    A = _load_analyzer.load()
    fmin_note, fmax_note = A.INSTRUMENT_PITCH_RANGE["violin"]
    fmin, fmax = librosa.note_to_hz(fmin_note), librosa.note_to_hz(fmax_note)
    notes = note_probe.load_notes(case_local)
    y, sr = load_audio(str(case_local / "recording.wav"))
    f0, rms, t = pitch_probe.compute_f0(y, sr, fmin, fmax)
    vm = pitch_probe.gated_valid(f0, rms, t)
    base = note_probe.report_notes(notes, t[vm], f0[vm])
    n_base = sum(v is not None for v in base)
    rows = []
    for c in cents:
        y_s = librosa.effects.pitch_shift(y, sr=sr, n_steps=float(c), bins_per_octave=1200)
        f0s, rmss, ts = pitch_probe.compute_f0(y_s, sr, fmin, fmax)
        vms = pitch_probe.gated_valid(f0s, rmss, ts)
        rep = note_probe.report_notes(notes, ts[vms], f0s[vms])
        errs, lost, fp, fn = [], 0, 0, 0
        for b, r in zip(base, rep):
            if b is None:
                continue
            truth = b + c
            if r is None:
                lost += 1
                continue
            errs.append(r - truth)
            tp, rp = abs(truth) <= A.PITCH_TOLERANCE_CENTS, abs(r) <= A.PITCH_TOLERANCE_CENTS
            fp += int((not tp) and rp)
            fn += int(tp and (not rp))
        e = np.array(errs) if errs else np.array([0.0])
        rows.append({"truth_cents": c, "compared": len(errs), "lost": lost,
                     "err_median": round(float(np.median(e)), 2),
                     "err_p95_abs": round(float(np.percentile(np.abs(e), 95)), 2),
                     "within_5c": round(float(np.mean(np.abs(e) <= 5)), 3),
                     "false_pass": fp, "false_fail": fn})
    return {"notes": len(notes), "base_matched": n_base, "rows": rows}


def layer3():
    out = []
    for d in (0.333, 0.667, 1.333):
        out += motion_probe.run(d)
    return out


def to_markdown(doc: dict) -> str:
    L = [f"# 音程監査 — {doc['timestamp'][:10]} · commit {doc['git_commit']}", ""]
    L += [f"ケース: {doc['case']}", ""]
    l1 = doc["layer1"]
    L += ["## 層1 フレーム f0", f"{l1['seconds']}s · 有効 {l1['valid_frames']}/{l1['total_frames']}", "",
          "| 真値 | 測定中央 | 誤差中央 | ±5c | 10-100c | >100c |", "|---:|---:|---:|---:|---:|---:|"]
    for r in l1["rows"]:
        if r.get("frames", 0) == 0:
            continue
        L.append(f"| {r['truth_cents']} | {r['measured_median']} | {r['err_median']} | "
                 f"{r['within_5c']:.1%} | {r['err_10_100c']:.1%} | {r['err_gt100c']:.1%} |")
    l2 = doc["layer2"]
    L += ["", "## 層2 音符報告値", f"{l2['base_matched']}/{l2['notes']} 音が一致", "",
          "| 真値 | 比較 | 消失 | 誤差中央 | |誤差|p95 | ±5c | 誤合格 | 誤不合格 |",
          "|---:|---:|---:|---:|---:|---:|---:|---:|"]
    for r in l2["rows"]:
        L.append(f"| {r['truth_cents']} | {r['compared']} | {r['lost']} | {r['err_median']} | "
                 f"{r['err_p95_abs']} | {r['within_5c']:.1%} | {r['false_pass']} | {r['false_fail']} |")
    L += ["", "## 層3 音内変化 (合成音・0.667s)", "",
          "| 軌道 | 頭30%極値 | 全体平均 | 報告 | 判定 |", "|---|---:|---:|---:|---|"]
    for r in doc["layer3"]:
        if abs(r["dur"] - 0.667) > 1e-3:
            continue
        L.append(f"| {r['profile']} | {r['head30_extreme']} | {r['whole_mean']} | {r['reported']} | {r['confidence']} |")
    L.append("")
    return "\n".join(L)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--case", default=DEFAULT_CASE)
    ap.add_argument("--seconds", type=float, default=30.0, help="層1で使う秒数。0で全体")
    ap.add_argument("--quick", action="store_true", help="段を減らして速く回す")
    args = ap.parse_args()

    cents1 = [-40, 0, 40] if args.quick else pitch_probe.DEFAULT_CENTS
    cents2 = [-40, 0, 40] if args.quick else note_probe.DEFAULT_CENTS

    case_local = local_case(CASES_DIR / args.case)
    print(f"case {args.case} → {case_local}", flush=True)

    print("[1/3] frame f0", flush=True)
    l1 = layer1(case_local, args.seconds, cents1)
    print("[2/3] note reports", flush=True)
    l2 = layer2(case_local, cents2)
    print("[3/3] intra-note motion", flush=True)
    l3 = layer3()

    doc = {"timestamp": datetime.now(timezone.utc).isoformat(), "git_commit": git_commit(),
           "case": args.case, "layer1": l1, "layer2": l2, "layer3": l3}
    HISTORY_DIR.mkdir(exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d")
    (HISTORY_DIR / f"audit_{stamp}.json").write_text(json.dumps(doc, ensure_ascii=False, indent=2), encoding="utf-8")
    (HISTORY_DIR / f"audit_{stamp}.md").write_text(to_markdown(doc), encoding="utf-8")
    print(f"\nwrote {HISTORY_DIR / f'audit_{stamp}.md'}")


if __name__ == "__main__":
    main()
