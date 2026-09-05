"""教材・曲をまとめて 再解析 (analyze_musicxml.py) または 譜面ファイルの作り直し (build_score.py) する汎用ランナー。

  venv\\Scripts\\python.exe scripts\\run_targets.py --build --all [--apply] [--jobs N]
  venv\\Scripts\\python.exe scripts\\run_targets.py --analyze --targets path.json [--apply]
    targets.json = [{"kind": "practice"|"score", "id": "...", "owner": "<Score.createdById>"|null, "title": "..."}]

2026-09-05: build_score を「解析の小節番号どおりに区切る + 装飾音を描く」方式にした際、
全譜面の作り直し (--build --all) と、装飾音を持つ 69 件の再解析 (--analyze --targets) に使った。
"""
import json
import os
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor

import psycopg2
from dotenv import load_dotenv

ANALYZER = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(ANALYZER, ".env"))
APPLY = "--apply" in sys.argv
JOBS = int(sys.argv[sys.argv.index("--jobs") + 1]) if "--jobs" in sys.argv else 4
MODE = "build" if "--build" in sys.argv else "analyze"
SCRIPT = os.path.join(ANALYZER, "build_score.py" if MODE == "build" else "analyze_musicxml.py")
PY_EXE = sys.executable


def all_targets():
    conn = psycopg2.connect((os.environ.get("DIRECT_URL") or os.environ["DATABASE_URL"]).split("?")[0])
    cur = conn.cursor()
    cur.execute('SELECT id, title FROM "PracticeItem" WHERE "analysisStatus" = \'done\' ORDER BY "createdAt"')
    out = [{"kind": "practice", "id": r[0], "owner": None, "title": r[1]} for r in cur.fetchall()]
    cur.execute('SELECT id, "createdById", title FROM "Score" WHERE "deletedAt" IS NULL AND "analysisStatus" = \'done\' AND "createdById" IS NOT NULL')
    out += [{"kind": "score", "id": r[0], "owner": r[1], "title": r[2]} for r in cur.fetchall()]
    cur.close(); conn.close()
    return out


def main():
    if "--targets" in sys.argv:
        with open(sys.argv[sys.argv.index("--targets") + 1], encoding="utf-8") as fh:
            rows = json.load(fh)
    else:
        rows = all_targets()
    n_p = sum(1 for r in rows if r["kind"] == "practice")
    print(f"=== {MODE}: 教材{n_p}件・曲{len(rows) - n_p}件 [{'APPLY' if APPLY else 'DRY-RUN'}] ===", flush=True)
    if not APPLY:
        for r in rows[:5]:
            print("  ", r["kind"], (r.get("title") or "")[:40])
        return
    t0 = time.time(); done = [0]; fails = []

    def run(row):
        if row["kind"] == "practice":
            args = [PY_EXE, SCRIPT, "--practice-item", row["id"]]
        else:
            args = [PY_EXE, SCRIPT, row["owner"], row["id"]]
        r = subprocess.run(args, cwd=ANALYZER, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=900, check=False)
        ok = r.returncode == 0
        if not ok:
            fails.append((row["kind"], row.get("title", ""), (r.stderr or r.stdout or "")[-300:]))
        done[0] += 1
        if done[0] % 25 == 0 or not ok:
            print(f"  {done[0]}/{len(rows)} {'ok' if ok else 'NG'} {row['kind']} {(row.get('title') or '')[:32]}", flush=True)

    with ThreadPoolExecutor(max_workers=JOBS) as ex:
        list(ex.map(run, rows))
    print(f"完了 {len(rows) - len(fails)}/{len(rows)} ・ {int((time.time() - t0) / 60)}分 ・ 失敗 {len(fails)}", flush=True)
    for f in fails[:40]:
        print("  失敗", f[0], f[1], f[2].replace("\n", " ")[-240:])


if __name__ == "__main__":
    main()
