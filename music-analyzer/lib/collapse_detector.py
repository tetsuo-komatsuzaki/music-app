# -*- coding: utf-8 -*-
"""
collapse_detector.py — 崩壊小節の検出（工程E・2026-07-10）

役割（設計 §26-5 / spec §1-1・2026-07-10 Tetsuo 確定「条件Bで」）:
  達成 = 3回演奏して3回とも「崩壊小節ゼロ」の判定部品。
  UIフロー[7]「詰まった場所の検知 → パート弾き直し」も同じ結果を使う。

判定規則（2026-07-10 Tetsuo最終確定）:
  **1小節に3音以下しかない小節は、条件A・条件Bとも判定対象外**
  （少音数小節のミス・無音は通常の課題出しに回す。例外規定を条件側に持たない）。
  判定対象 = 4音以上の小節（の1回の演奏 = 同一小節番号の連続区間）:
    条件A: 全音が未検知 (not_detected) = 本当に弾くのを止めた小節。
    条件B: NG率 >= 0.8。
  休符のみの小節: comparison_result に音が載らない → 自然に判定対象外。
  NG の定義:
    - evaluation_status == "not_detected"（未検知）
    - pitch_ok is False（音程ズレ）
    - start_ok is False（タイミングズレ）
    - それ以外（True / None=救済・評価対象外系）は OK 扱い
      （tremolo/trill の pitch_only 救済等を誤って崩壊にしない保守側）

入力は comparison_result.json の results[]（リピート展開後の演奏順・
各音に measure_number が付いている）。カルテ不要で単独動作する。
"""
from __future__ import annotations

from typing import List, Optional

COLLAPSE_THRESHOLD = 0.8   # 条件B: 8割以上
MIN_MEASURE_NOTES = 4      # 判定対象の最低音数 (3音以下の小節は条件A/Bとも対象外)


def is_note_ng(r: dict) -> bool:
    """1音が「ズレ or 未検知」か。"""
    if r.get("evaluation_status") == "not_detected":
        return True
    if r.get("pitch_ok") is False:
        return True
    if r.get("start_ok") is False:
        return True
    return False


def detect_collapsed_measures(
    comparison_results: List[dict],
    threshold: float = COLLAPSE_THRESHOLD,
    min_measure_notes: int = MIN_MEASURE_NOTES,
) -> dict:
    """崩壊小節を検出する。

    Args:
        comparison_results: comparison_result.json の results[]（演奏順）
        threshold: 条件B の NG 率しきい値（既定 0.8）
        min_measure_notes: 判定対象とする小節の最低音数（既定 4。
            3音以下の小節は条件A/Bとも対象外 = 2026-07-10 Tetsuo確定）

    Returns:
        {
          "collapsed": [ {measure_number, pass_index, ng, total, ng_rate, condition} ],
          "total_measure_passes": int,   # 判定した小節演奏の数（対象外は含まない）
          "skipped_small_measures": int, # 3音以下で対象外にした小節演奏の数
          "is_clean": bool,              # 崩壊ゼロか（達成の合格ライン）
        }
    """
    # 演奏順を「同一小節番号の連続区間」に圧縮（リピートの各周は別区間になる）
    runs: List[List[dict]] = []
    prev_m: Optional[int] = object()  # type: ignore[assignment]
    for r in comparison_results:
        m = r.get("measure_number")
        if m != prev_m:
            runs.append([])
            prev_m = m
        runs[-1].append(r)

    pass_count: dict = {}
    collapsed: List[dict] = []
    judged = 0
    skipped_small = 0

    for run in runs:
        if not run:
            continue
        m = run[0].get("measure_number")
        pass_count[m] = pass_count.get(m, 0) + 1
        total = len(run)

        # 3音以下の小節は条件A/Bとも判定対象外（Tetsuo確定 2026-07-10）
        if total < min_measure_notes:
            skipped_small += 1
            continue
        judged += 1

        # 条件A: 全音が未検知 = 本当に止まった小節
        all_undetected = all(
            r.get("evaluation_status") == "not_detected" for r in run
        )
        # 条件B: NG率 >= threshold
        ng = sum(1 for r in run if is_note_ng(r))
        rate = ng / total
        cond_b = rate >= threshold

        if all_undetected or cond_b:
            collapsed.append(
                {
                    "measure_number": m,
                    "pass_index": pass_count[m],  # その小節の何回目の演奏か（リピート用）
                    "ng": ng,
                    "total": total,
                    "ng_rate": round(rate, 3),
                    "condition": "A" if all_undetected else "B",
                }
            )

    return {
        "collapsed": collapsed,
        "total_measure_passes": judged,
        "skipped_small_measures": skipped_small,
        "is_clean": len(collapsed) == 0,
    }
