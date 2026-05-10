"""
Cloud Run Job のエントリーポイント。
MODE 環境変数を見て、対応する既存スクリプトを sys.argv を組み直して exec する。
既存 .py ファイル (analyze_musicxml / build_score / analyze_performance) は無改修。
"""
from __future__ import annotations

import os
import sys
import runpy


def _require(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"Required env var missing: {name}")
    return value


def main() -> None:
    mode = _require("MODE")

    if mode == "score_full":
        # analyze_musicxml → build_score を 1 Job 内で連結実行
        # (Vercel から 2 回呼ばず 1 度の invoke で完結させる)
        if os.environ.get("PRACTICE_ITEM_ID"):
            argv_shared = ["--practice-item", os.environ["PRACTICE_ITEM_ID"]]
        else:
            argv_shared = [_require("USER_ID"), _require("SCORE_ID")]
        sys.argv = ["analyze_musicxml.py"] + argv_shared
        print(f"[entrypoint] 1/2 analyze_musicxml argv={sys.argv}")
        runpy.run_path("analyze_musicxml.py", run_name="__main__")
        sys.argv = ["build_score.py"] + argv_shared
        print(f"[entrypoint] 2/2 build_score argv={sys.argv}")
        runpy.run_path("build_score.py", run_name="__main__")
        return

    if mode == "analyze_musicxml":
        if os.environ.get("PRACTICE_ITEM_ID"):
            argv = ["--practice-item", os.environ["PRACTICE_ITEM_ID"]]
        else:
            argv = [_require("USER_ID"), _require("SCORE_ID")]
        script = "analyze_musicxml.py"

    elif mode == "build_score":
        if os.environ.get("PRACTICE_ITEM_ID"):
            argv = ["--practice-item", os.environ["PRACTICE_ITEM_ID"]]
        else:
            argv = [_require("USER_ID"), _require("SCORE_ID")]
        script = "build_score.py"

    elif mode == "analyze_performance":
        argv = [
            _require("USER_ID"),
            _require("SCORE_ID"),
            _require("PERFORMANCE_ID"),
        ]
        if os.environ.get("IS_PRACTICE") == "true":
            argv.append("practice")
        bpm = os.environ.get("RECORDING_BPM")
        if bpm:
            argv.append(f"--recording-bpm={bpm}")
        script = "analyze_performance.py"

    else:
        raise RuntimeError(f"Unknown MODE: {mode!r}")

    sys.argv = [script] + argv
    print(f"[entrypoint] MODE={mode} argv={sys.argv}")
    runpy.run_path(script, run_name="__main__")

    # v3.2.2 Commit 8a: practice モードの analyze_performance 完了後に
    # score_full (loop engine) を chain。失敗しても analyze_performance の成果は保持。
    #
    # v1.5 Phase 3a (2026-05-11): IS_PRACTICE=true 限定のゲートを撤去。
    # Score 演奏 (IS_PRACTICE=false) でも loop_engine_runner を呼び、Performance テーブル
    # に skillSubScores / pitchSkillScore / 等 + bowingAccuracy + overallScore (3 軸) を書き込む。
    # loop_engine_runner.main() 側で IS_PRACTICE を検出して practice / score モードに分岐。
    if mode == "analyze_performance":
        try:
            mode_label = "practice" if os.environ.get("IS_PRACTICE") == "true" else "score"
            print(f"[entrypoint] post-analyze: running loop_engine_runner ({mode_label} mode)")
            sys.argv = ["loop_engine_runner.py"]
            runpy.run_path("loop_engine_runner.py", run_name="__main__")
        except Exception as e:
            import traceback
            print(f"[entrypoint] WARNING: loop_engine_runner failed: {e}")
            traceback.print_exc()


if __name__ == "__main__":
    main()
