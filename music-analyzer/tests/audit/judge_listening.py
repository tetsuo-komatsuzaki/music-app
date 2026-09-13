"""judge_listening.py — 聴いて答えた結果を集計し、「精度が上がったか」に答える

verify_new_recording.py が出した「きいて答える.csv」を読み、伏せてあった群
(新規 / 喪失 / 対照) と突き合わせる。

読み方:
  対照 … 変更前も変更後も正しく取れていた音。**ここが高くなければ、他の数字を読んではいけない。**
         低いときは、聴く条件か切り出しかが悪い。物差しが壊れている。
  新規 … 変更後に初めて検出された音。**本当に鳴っていた割合**が、そのまま改善の大きさ。
  喪失 … 変更で検出できなくなった音。**本当に鳴っていた割合**が、そのまま悪化の大きさ。

使い方:
  python tests/audit/judge_listening.py <case_id>
"""
import argparse
import csv
import json
import math
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
CASES = HERE.parent / "cases"
YES = ("はい", "y", "yes", "1", "○", "o")


def wilson(k, n):
    """割合の幅 (95%)。n が小さいことを隠さないために出す。"""
    if n == 0:
        return (0.0, 1.0)
    z, p = 1.96, k / n
    d = 1 + z * z / n
    c = (p + z * z / (2 * n)) / d
    m = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return (max(0.0, c - m), min(1.0, c + m))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("case_id")
    a = ap.parse_args()
    d = CASES / a.case_id / "listen"
    ans_path, key_path = d / "きいて答える.csv", d / "_答え合わせ.json"
    if not ans_path.exists() or not key_path.exists():
        raise SystemExit(f"{d} に記入済みの csv と答え合わせが要る")

    key = {int(r["番号"]): r for r in json.loads(key_path.read_text(encoding="utf-8"))["key"]}
    meta = json.loads(key_path.read_text(encoding="utf-8"))

    groups = {}
    blank = 0
    with open(ans_path, encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            no = int(row["番号"])
            sounded = row.get("鳴っていたか(はい/いいえ)", "").strip().lower()
            right = row.get("楽譜の高さだったか(はい/いいえ/わからない)", "").strip().lower()
            if not sounded:
                blank += 1
                continue
            g = key[no]["群"]
            s = groups.setdefault(g, {"n": 0, "sounded": 0, "right": 0})
            s["n"] += 1
            if sounded in YES:
                s["sounded"] += 1
                if right in YES:
                    s["right"] += 1

    print(f"=== {a.case_id}   変更前 = {meta['baseline']}")
    if blank:
        print(f"  未記入 {blank} 音は数えていない")
    print("\n  群     数   鳴っていた            うち楽譜の高さだった")
    for g in ("対照", "新規", "喪失"):
        s = groups.get(g)
        if not s or s["n"] == 0:
            print(f"  {g:<5}  なし")
            continue
        lo, hi = wilson(s["sounded"], s["n"])
        lo2, hi2 = wilson(s["right"], s["n"])
        print(f"  {g:<5} {s['n']:>3}   {s['sounded']:>2}/{s['n']} "
              f"({s['sounded']/s['n']*100:5.1f}%  幅 {lo*100:.0f}〜{hi*100:.0f}%)   "
              f"{s['right']:>2}/{s['n']} ({s['right']/s['n']*100:5.1f}%  幅 {lo2*100:.0f}〜{hi2*100:.0f}%)")

    ctrl = groups.get("対照")
    gain = groups.get("新規")
    loss = groups.get("喪失")

    print("\n=== 読み")
    if not ctrl or ctrl["n"] < 5:
        print("  対照が足りない。判断できない。")
        return
    ctrl_rate = ctrl["right"] / ctrl["n"]
    if ctrl_rate < 0.8:
        print(f"  **対照が {ctrl_rate*100:.0f}% しかない。物差しが壊れている。**")
        print("  切り出しの長さか、聴く条件を見直すこと。ほかの数字は読まない。")
        return
    print(f"  対照 {ctrl_rate*100:.0f}% → 聴き取りは信用できる。")

    if gain and gain["n"]:
        g = gain["right"] / gain["n"]
        lo, hi = wilson(gain["right"], gain["n"])
        print(f"  新しく検出した音の {g*100:.0f}% が本当に楽譜の高さで鳴っていた (幅 {lo*100:.0f}〜{hi*100:.0f}%)。")
        if lo >= 0.5:
            print("    → 半分より多いことが確からしい。**この増加は本物。**")
        elif hi < 0.5:
            print("    → 半分に届かないことが確からしい。**増加の多くは見当違い。**")
        else:
            print("    → 半分の上か下か決まらない。音数を増やすこと。")
    if loss and loss["n"]:
        l = loss["right"] / loss["n"]
        lo, hi = wilson(loss["right"], loss["n"])
        print(f"  失った音の {l*100:.0f}% は本当に鳴っていた (幅 {lo*100:.0f}〜{hi*100:.0f}%)。")
        if hi < 0.3:
            print("    → ほとんどが元から怪しい音。**失っても構わない。**")
        elif lo >= 0.5:
            print("    → 半分より多くが本物。**これは悪化。直し方を見直すこと。**")
        else:
            print("    → 決まらない。音数を増やすこと。")

    if gain and loss and gain["n"] and loss["n"]:
        net = gain["right"] - loss["right"]
        print(f"\n  差し引き: 正しく増えた {gain['right']} − 正しく失った {loss['right']} = {net:+d} 音"
              f" (聴いた範囲で)")
        print("  ここまでが人の耳で言えること。全体への当てはめは、聴いた割合を群の総数に掛けて見積もる。")


if __name__ == "__main__":
    main()
