"""verify_new_recording.py — 新しい録音1本で「精度が上がったか」を確かめる

点が上がったことと正しくなったことは別なので、機械の数字だけでは決着しない。
このツールは 2 つを出す。

  1. 変更前後を同じ録音で通した差分 (機械)
  2. 人が聴いて答えるための音の切り出しと一覧 (人)

2 が要るのは、新しく検出された音が本当に鳴っていたのか、失われた音が
本当に鳴っていなかったのかを、機械側の数字では区別できないため。
一覧は目隠しにしてある。新規・喪失・対照 (変更前後どちらでも正しく取れていた音) を
混ぜて並べ替え、どれがどの群かは答え合わせ用の別ファイルにだけ書く。

使い方:
  python tests/audit/verify_new_recording.py <case_id> [--baseline <git ref>] [--n 10]

前提: tests/cases/<case_id>/ に recording.wav と analysis.json があること
      (無ければ fetch_case_inputs.py / fetch_case_audio.py で取る)。
"""
import argparse
import csv
import json
import pathlib
import random
import subprocess
import sys
import warnings

warnings.filterwarnings("ignore")
import numpy as np
import soundfile as sf

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import _load_analyzer  # noqa: E402
from _cache import local_case, load_audio  # noqa: E402
import offline_analyzer as OA  # noqa: E402

CASES = HERE.parent / "cases"
# 位置合わせを直す前の最後のコミット
DEFAULT_BASELINE = "c780a5a6"
EV = ("evaluated", "pitch_only", "double_stop_full", "double_stop_partial",
      "double_stop_miss", "harmonic_ok", "harmonic_normal_tone", "harmonic_miss")


def analyzer_source(ref):
    """指定した版の analyze_performance.py を取り出してパスを返す。"""
    if ref in ("HEAD", "current", None):
        return None
    out = HERE / f"_analyzer_{ref}.py"
    src = subprocess.run(
        ["git", "show", f"{ref}:music-analyzer/analyze_performance.py"],
        cwd=str(HERE.parents[2]), capture_output=True, text=True, encoding="utf-8")
    if src.returncode != 0 or not src.stdout:
        raise SystemExit(f"{ref} から analyze_performance.py を取り出せなかった: {src.stderr[:200]}")
    out.write_text(src.stdout, encoding="utf-8")
    return out


def run_with(ns, case_dir, **kw):
    """名前空間 ns (= ある版の解析器) でケースを通す。"""
    saved = OA.A
    OA.A = ns
    try:
        return OA.analyze_case(case_dir, **kw)
    finally:
        OA.A = saved


def score_of(res):
    rs = res["results"]
    det = [r for r in rs if r["evaluation_status"] in EV]
    pool = [r for r in rs if r["evaluation_status"] != "pitch_only"]
    ok = sum(1 for r in pool if r.get("start_ok") is True)

    def ps(r):
        if r.get("evaluation_status") in ("double_stop_partial", "harmonic_normal_tone"):
            return 0.5
        return 1.0 if r.get("pitch_ok") is True else 0.0

    d = [r["start_diff_sec"] for r in rs if r.get("start_diff_sec") is not None]
    return {
        "notes": len(rs),
        "detected": len(det),
        "pitch_ok": sum(1 for r in rs if r.get("pitch_ok") is True),
        "pitch": sum(ps(r) for r in det) / max(1, len(rs)) * 100,
        "rhythm": ok / max(1, len(pool)) * 100,
        "median_diff": float(np.median(d)) if d else float("nan"),
        "by_index": {r["note_index"]: r for r in rs},
    }


def cut(y, sr, t0, t1, pad=0.35):
    a = max(0, int((t0 - pad) * sr))
    b = min(len(y), int((t1 + pad) * sr))
    return y[a:b] if b > a else np.zeros(int(0.1 * sr), dtype=y.dtype)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("case_id")
    ap.add_argument("--baseline", default=DEFAULT_BASELINE, help="比べる相手の git ref")
    ap.add_argument("--n", type=int, default=20,
                    help="各群から何音ずつ聴くか。8音では幅が広すぎて結論が出ない (実測)。"
                         "当たりが8割なら20音で半分の線を越えられる。7割なら30音要る")
    ap.add_argument("--seed", type=int, default=20260913)
    a = ap.parse_args()

    case = local_case(CASES / a.case_id)
    old_src = analyzer_source(a.baseline)
    new_ns = _load_analyzer.load()
    old_ns = _load_analyzer.load(old_src)

    print(f"=== {a.case_id}   変更前 = {a.baseline} / 変更後 = いまの作業ツリー\n")
    new = score_of(run_with(new_ns, case))
    old = score_of(run_with(old_ns, case))

    print("  指標            変更前     変更後     差")
    for key, label, fmt in [("detected", "検出", "{:>6.0f}"), ("pitch_ok", "音程合格", "{:>6.0f}"),
                            ("pitch", "音程", "{:>6.1f}"), ("rhythm", "リズム", "{:>6.1f}"),
                            ("median_diff", "ずれの中央", "{:>6.2f}")]:
        o, n = old[key], new[key]
        print(f"  {label:<12} " + fmt.format(o) + "    " + fmt.format(n) + f"    {n - o:+7.2f}")
    print(f"\n  楽譜の音数 {new['notes']}")

    # --- 音ごとの移り変わり
    o_det = {i for i, r in old["by_index"].items() if r["evaluation_status"] in EV}
    n_det = {i for i, r in new["by_index"].items() if r["evaluation_status"] in EV}
    gained, lost, both = sorted(n_det - o_det), sorted(o_det - n_det), sorted(n_det & o_det)
    ctrl = [i for i in both
            if old["by_index"][i].get("pitch_ok") is True and new["by_index"][i].get("pitch_ok") is True]
    print(f"\n  新しく検出 {len(gained)} / 失った {len(lost)} / 両方で検出 {len(both)}"
          f" (うち両方で音程合格 {len(ctrl)})")

    if not gained and not lost:
        print("\n  変わった音がない。聴いて確かめることは無い。")
        return

    # --- 目隠しの一覧と音の切り出し
    rnd = random.Random(a.seed)
    pick = ([("新規", i) for i in rnd.sample(gained, min(a.n, len(gained)))]
            + [("喪失", i) for i in rnd.sample(lost, min(a.n, len(lost)))]
            + [("対照", i) for i in rnd.sample(ctrl, min(a.n, len(ctrl)))])
    rnd.shuffle(pick)

    y, sr = load_audio(str(case / "recording.wav"))
    out = CASES / a.case_id / "listen"
    out.mkdir(exist_ok=True)
    rows, key = [], []
    for k, (group, idx) in enumerate(pick, 1):
        r = new["by_index"][idx] if group != "喪失" else old["by_index"][idx]
        t0 = r.get("detected_start_sec") or r.get("expected_start_sec") or 0.0
        t1 = r.get("detected_end_sec") or (t0 + 0.5)
        name = f"{k:02d}.wav"
        sf.write(str(out / name), cut(y, sr, float(t0), float(t1)), sr)
        rows.append({"番号": k, "音声": name, "楽譜の音名": r.get("note_name") or "",
                     "小節": r.get("measure_number") or "",
                     "鳴っていたか(はい/いいえ)": "", "楽譜の高さだったか(はい/いいえ/わからない)": "",
                     "ひとこと": ""})
        key.append({"番号": k, "群": group, "note_index": idx,
                    "切り出し開始秒": round(float(t0), 3)})

    with open(out / "きいて答える.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
    with open(out / "_答え合わせ.json", "w", encoding="utf-8") as f:
        json.dump({"case": a.case_id, "baseline": a.baseline, "key": key}, f,
                  ensure_ascii=False, indent=1)

    print(f"\n  聴く材料を {out} に出した ({len(rows)} 音)")
    print("   きいて答える.csv に記入する。どれが新規でどれが対照かは伏せてある。")
    print("   記入が済んだら judge_listening.py で答え合わせする。")
    if old_src and old_src.exists():
        old_src.unlink()


if __name__ == "__main__":
    main()
