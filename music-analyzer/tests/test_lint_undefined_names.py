# 未定義名の静的検出 (2026-08-31 導入)。
# 背景: analyze_musicxml.py の奏法変種skip指定パスが music21 の stream を
# インポートし忘れており、そのパスを初めて通した教材登録 (カイザーNo.1
# スタッカート) が本番で NameError になった。Pythonは実行時まで気づけないため、
# 「通らないパスの書き忘れ」をpytestで先に捕まえる。
# 検出対象: F821 (undefined name) / F823 (local referenced before assignment) /
# F811 (redefinition)。ruff が無い環境では失敗させる (スキップで黙らせない)。
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_no_undefined_names() -> None:
    result = subprocess.run(
        [sys.executable, "-m", "ruff", "check", "--select", "F821,F823,F811",
         "--output-format", "concise", str(ROOT)],
        capture_output=True, text=True,
    )
    if result.returncode not in (0, 1):
        raise AssertionError(
            "ruff を実行できません (venvに `python -m pip install ruff`): "
            + result.stderr.strip()
        )
    assert result.returncode == 0, "未定義名を検出:\n" + result.stdout
