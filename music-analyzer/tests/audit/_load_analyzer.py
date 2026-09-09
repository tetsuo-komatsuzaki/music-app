"""
analyze_performance.py は import した瞬間に DB へ行くスクリプトなので、
関数と定数の定義だけを AST で抜き出して名前空間に載せる。

(benchmark_runner.py が動かなかった理由もここ。`from analyze_performance import
analyze_performance` という関数は存在せず、import 自体が DB 接続で落ちる。)
"""

import ast
import pathlib
import sys
import types

ANALYZER_DIR = pathlib.Path(__file__).resolve().parents[2]
SRC = ANALYZER_DIR / "analyze_performance.py"

_KEEP = (ast.Import, ast.ImportFrom, ast.FunctionDef, ast.AsyncFunctionDef,
         ast.ClassDef, ast.Assign, ast.AnnAssign)


def load():
    if str(ANALYZER_DIR) not in sys.path:
        sys.path.insert(0, str(ANALYZER_DIR))
    tree = ast.parse(SRC.read_text(encoding="utf-8"), filename=str(SRC))
    ns = types.ModuleType("analyzer_defs")
    ns.__file__ = str(SRC)
    ns.__dict__["__builtins__"] = __builtins__
    skipped = []
    src_lines = SRC.read_text(encoding="utf-8").splitlines()
    for node in tree.body:
        if not isinstance(node, _KEEP):
            continue
        # DB 接続 / sys.argv 依存の代入は実行しない (接続タイムアウト 38s の回避)
        seg = chr(10).join(src_lines[node.lineno - 1: node.end_lineno])
        if any(k in seg for k in ("psycopg2.connect", "conn.cursor", "sys.argv")):
            skipped.append((node.lineno, "filtered", seg[:50]))
            continue
        mod = ast.Module(body=[node], type_ignores=[])
        try:
            exec(compile(mod, str(SRC), "exec"), ns.__dict__)
        except Exception as e:  # sys.argv 依存の代入など
            skipped.append((getattr(node, "lineno", 0), type(e).__name__, str(e)[:60]))
    ns._skipped = skipped
    return ns
