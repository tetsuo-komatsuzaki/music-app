"""スラーの中にスタッカート点を持つ 教材・曲 だけを再解析する (2026-09-05 Tetsuo確定: その点は「連続スタッカート」)。

対象は並び (ScoreNote → NoteProfile) で techSlur かつ techStaccato の音を持つもの。再解析で
技術タグ・かたち (techBowStaccato)・教材側の写し (MaterialBundleCount) が新しい規則に揃う。

実行: venv\\Scripts\\python.exe scripts\\reanalyze_slur_staccato.py [--apply] [--jobs N]
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


def targets(cur):
    cur.execute('''
        SELECT DISTINCT sn."targetType"::text, sn."targetId"
        FROM "ScoreNote" sn JOIN "NoteProfile" np ON np.id = sn."profileId"
        WHERE np."techSlur" AND np."techStaccato"''')
    rows = cur.fetchall()
    out = []
    for kind, tid in rows:
        if kind == "practice":
            cur.execute('SELECT title FROM "PracticeItem" WHERE id = %s AND "isPublished" = true', (tid,))
            r = cur.fetchone()
            if r:
                out.append(("practice", tid, None, r[0]))
        else:
            cur.execute('SELECT "createdById", title FROM "Score" WHERE id = %s AND "deletedAt" IS NULL', (tid,))
            r = cur.fetchone()
            if r:
                out.append(("score", tid, r[0], r[1]))
    return out


def main():
    conn = psycopg2.connect((os.environ.get("DIRECT_URL") or os.environ["DATABASE_URL"]).split("?")[0])
    cur = conn.cursor()
    rows = targets(cur)
    cur.close(); conn.close()
    n_p = sum(1 for r in rows if r[0] == "practice"); n_s = len(rows) - n_p
    print(f"=== スラー内スタッカート点を持つ 教材{n_p}件・曲{n_s}件 の再解析 [{'APPLY' if APPLY else 'DRY-RUN'}] ===", flush=True)
    for r in rows[:10]:
        print(f"   {r[0]} {r[3][:30]}")
    if not APPLY:
        return
    t0 = time.time(); done = [0]; fails = []

    def run(row):
        kind, tid, owner, title = row
        args = [PY_EXE, SCRIPT, "--practice-item", tid] if kind == "practice" else [PY_EXE, SCRIPT, owner, tid]
        r = subprocess.run(args, cwd=ANALYZER, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=900, check=False)
        ok = r.returncode == 0
        if not ok:
            fails.append((kind, title, (r.stderr or "")[-300:]))
        done[0] += 1
        print(f"  {done[0]}/{len(rows)} {'ok' if ok else 'NG'} {kind} {title[:28]}", flush=True)

    with ThreadPoolExecutor(max_workers=JOBS) as ex:
        list(ex.map(run, rows))
    print(f"完了 {len(rows) - len(fails)}/{len(rows)} ・ {int((time.time() - t0) / 60)}分 ・ 失敗 {len(fails)}", flush=True)
    for f in fails:
        print("  失敗", f[0], f[1], f[2].replace("\n", " ")[-200:])


if __name__ == "__main__":
    main()
