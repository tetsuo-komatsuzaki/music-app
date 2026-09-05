"""原譜に声部2 がある 教材・曲 を再解析する (2026-09-05 Tetsuo確定: 声部を 1 本にまとめる lib/voice_merge.py)。
対象 = 声部2 を含む原譜 (走査で確定した 5 教材の originalXmlPath を共有する全教材 = 本体・パート・奏法/リズム変種) と 曲3件。
実行: venv\\Scripts\\python.exe scripts\\reanalyze_voice2.py [--apply] [--jobs N]
"""
import os
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import psycopg2
from dotenv import load_dotenv

ANALYZER = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(ANALYZER, ".env"))
APPLY = "--apply" in sys.argv
JOBS = int(sys.argv[sys.argv.index("--jobs") + 1]) if "--jobs" in sys.argv else 4
PY_EXE = sys.executable
SCRIPT = os.path.join(ANALYZER, "analyze_musicxml.py")

BASE_ITEMS = [
    "cmt833aed000d04l77p1eofa5",  # カイザー No.20
    "cmt82y17m000404jptdx7gsxr",  # No.17
    "cmt844tno000004laflekcruu",  # No.28
    "cmt826cw7000104l7fzzw0aoj",  # No.8
    "cmt8461p5000004ibte5ck2go",  # No.29
]
SCORES = [
    "cmpva48gb000404lakjkexbsf",  # レジェンド
    "cmquvg2so000005jviyj9y7xg",  # メヌエット
    "cmqutq3co000604l4s8bbwpcu",  # ガボット
    "cmmau66jb00014cjy4o18fhbu",  # 糸 (mxl・声部つき19小節。走査の正規表現は mxl を読めず見落としていた)
]


def targets(cur):
    cur.execute('SELECT "originalXmlPath" FROM "PracticeItem" WHERE id = ANY(%s)', (BASE_ITEMS,))
    paths = [r[0] for r in cur.fetchall()]
    cur.execute('SELECT id, title FROM "PracticeItem" WHERE "originalXmlPath" = ANY(%s) ORDER BY "createdAt"', (paths,))
    out = [("practice", tid, None, title) for tid, title in cur.fetchall()]
    cur.execute('SELECT id, "createdById", title FROM "Score" WHERE id = ANY(%s) AND "deletedAt" IS NULL', (SCORES,))
    out += [("score", sid, owner, title) for sid, owner, title in cur.fetchall()]
    return out


def main():
    conn = psycopg2.connect((os.environ.get("DIRECT_URL") or os.environ["DATABASE_URL"]).split("?")[0])
    cur = conn.cursor()
    rows = targets(cur)
    cur.close(); conn.close()
    n_p = sum(1 for r in rows if r[0] == "practice"); n_s = len(rows) - n_p
    print(f"=== 声部2 を含む 教材{n_p}件・曲{n_s}件 の再解析 [{'APPLY' if APPLY else 'DRY-RUN'}] ===", flush=True)
    for r in rows:
        print(f"   {r[0]} {r[3][:40]}")
    if not APPLY:
        return
    t0 = time.time(); done = [0]; fails = []

    def run(row):
        kind, tid, owner, title = row
        args = [PY_EXE, SCRIPT, "--practice-item", tid] if kind == "practice" else [PY_EXE, SCRIPT, owner, tid]
        r = subprocess.run(args, cwd=ANALYZER, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=900, check=False)
        ok = r.returncode == 0
        merged = next((ln for ln in (r.stdout or "").splitlines() if "[voice-merge]" in ln), "(voice-merge なし)")
        if not ok:
            fails.append((kind, title, (r.stderr or "")[-300:]))
        done[0] += 1
        print(f"  {done[0]}/{len(rows)} {'ok' if ok else 'NG'} {kind} {title[:32]} {merged}", flush=True)

    with ThreadPoolExecutor(max_workers=JOBS) as ex:
        list(ex.map(run, rows))
    print(f"完了 {len(rows) - len(fails)}/{len(rows)} ・ {int((time.time() - t0) / 60)}分 ・ 失敗 {len(fails)}", flush=True)
    for f in fails:
        print("  失敗", f[0], f[1], f[2].replace("\n", " ")[-200:])


if __name__ == "__main__":
    main()
