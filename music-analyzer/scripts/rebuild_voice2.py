"""声部2 を含む 教材・曲 の表示用譜面 (build_score.musicxml) を作り直す。
build_score.py は analysis.json (演奏順の音符列) から譜面を組むため、解析に無かった小節は譜面からも消えていた。
reanalyze_voice2.py で analysis.json を作り直した後に、これで譜面を作り直す。
実行: venv\\Scripts\\python.exe scripts\\rebuild_voice2.py [--apply] [--jobs N]
"""
import os
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import psycopg2
from dotenv import load_dotenv
from reanalyze_voice2 import targets

ANALYZER = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(ANALYZER, ".env"))
APPLY = "--apply" in sys.argv
JOBS = int(sys.argv[sys.argv.index("--jobs") + 1]) if "--jobs" in sys.argv else 4
PY_EXE = sys.executable
SCRIPT = os.path.join(ANALYZER, "build_score.py")


def main():
    conn = psycopg2.connect((os.environ.get("DIRECT_URL") or os.environ["DATABASE_URL"]).split("?")[0])
    cur = conn.cursor()
    rows = targets(cur)
    cur.close(); conn.close()
    print(f"=== 表示用譜面の作り直し {len(rows)}件 [{'APPLY' if APPLY else 'DRY-RUN'}] ===", flush=True)
    if not APPLY:
        for r in rows[:5]:
            print("  ", r[0], r[3][:40])
        return
    t0 = time.time(); done = [0]; fails = []

    def run(row):
        kind, tid, owner, title = row
        args = [PY_EXE, SCRIPT, "--practice-item", tid] if kind == "practice" else [PY_EXE, SCRIPT, owner, tid]
        r = subprocess.run(args, cwd=ANALYZER, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=900, check=False)
        ok = r.returncode == 0
        if not ok:
            fails.append((kind, title, (r.stderr or r.stdout or "")[-300:]))
        done[0] += 1
        print(f"  {done[0]}/{len(rows)} {'ok' if ok else 'NG'} {kind} {title[:32]}", flush=True)

    with ThreadPoolExecutor(max_workers=JOBS) as ex:
        list(ex.map(run, rows))
    print(f"完了 {len(rows) - len(fails)}/{len(rows)} ・ {int((time.time() - t0) / 60)}分 ・ 失敗 {len(fails)}", flush=True)
    for f in fails:
        print("  失敗", f[0], f[1], f[2].replace("\n", " ")[-240:])


if __name__ == "__main__":
    main()
