# -*- coding: utf-8 -*-
"""全曲 (Score) の再解析 ・ ノート属性ストア 段3 の埋め戻し用。
analyze_musicxml.py USER_ID SCORE_ID を曲ごとに回す。実行: venv\Scripts\python.exe scripts\reanalyze_all_scores.py --apply [--jobs N]"""
import os, sys, subprocess, time
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import psycopg2
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))
APPLY = "--apply" in sys.argv
JOBS = int(sys.argv[sys.argv.index("--jobs") + 1]) if "--jobs" in sys.argv else 4
PY_EXE = sys.executable
def main():
    conn = psycopg2.connect(os.environ["DATABASE_URL"]); cur = conn.cursor()
    cur.execute('SELECT id, "createdById", title FROM "Score" ORDER BY "createdAt"')
    scores = cur.fetchall(); conn.close()
    print(f"=== 全曲の再解析 [{'APPLY' if APPLY else 'DRY-RUN'}] {len(scores)}曲 ===", flush=True)
    if not APPLY:
        return
    t0 = time.time(); done = [0]; fails = []
    def run(row):
        sid, owner, title = row
        r = subprocess.run([PY_EXE, "analyze_musicxml.py", owner, sid], capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=900)
        ns = [l for l in (r.stdout or "").splitlines() if "[note_store]" in l]
        ok = r.returncode == 0
        if not ok:
            fails.append((sid, title, (r.stderr or "")[-300:]))
        done[0] += 1
        print(f"  {done[0]}/{len(scores)} {'ok' if ok else 'NG'} {title[:24]} {ns[-1] if ns else ''}", flush=True)
    with ThreadPoolExecutor(max_workers=JOBS) as ex:
        list(ex.map(run, scores))
    print(f"完了 {len(scores)-len(fails)}/{len(scores)} ・ {int((time.time()-t0)/60)}分 ・ 失敗 {len(fails)}", flush=True)
    for f in fails:
        print("  失敗", f[0], f[1], f[2].replace("\n", " ")[-200:])
if __name__ == "__main__":
    main()
