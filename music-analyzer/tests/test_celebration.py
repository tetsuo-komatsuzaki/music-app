# -*- coding: utf-8 -*-
"""祝い体験 v2.0 の Python 側検証 (celebrationdesign_v2_0.md §4/§5/§8/§11)。

- derive_score_milestone_events: ID照合方式 (achieve/master/rank_up)。再解析でも同一結果。
- recompute_practice_mastery   : 直近5回平均90の境界・日常は降格しない。
- _run_celebration_v2          : CELEBRATION_WRITE_ENABLED=false で書き込みが一切発生しない。
"""
import os
from datetime import datetime

from lib.achievement import (
    derive_score_milestone_events,
    recompute_practice_mastery,
    STAR_UP_ACHIEVEMENTS,
)


class Cur:
    """SQL 部分一致で応答を返し、実行パラメータを記録するモックカーソル。"""

    def __init__(self, routes):
        self.routes = routes  # list[(substr, response_tuple_or_None)]
        self._one = None
        self.rowcount = 1
        self.captured = {}

    def execute(self, sql, params=None):
        for substr, resp in self.routes:
            if substr in sql:
                self._one = resp
                self.captured[substr] = params
                return
        raise AssertionError(f"no route for SQL: {sql[:100]}")

    def fetchone(self):
        return self._one


DT = datetime(2026, 7, 26, 12, 0, 0)
PERF = "perf-1"


# ─── derive_score_milestone_events ────────────────────────────────────────

def _derive_routes(main_row, rank=0, current_star=1):
    return [
        ('"achievedPerformanceId", "masteredPerformanceId"', main_row),
        ('COUNT(*) FROM "UserScoreAchievement"', (rank,)),
        ('"currentStar" FROM "UserStarProgress"', (current_star,)),
    ]


def _types(events):
    return [e["type"] for e in events]


def test_derive_achieve_only():
    cur = Cur(_derive_routes((PERF, None, 3, DT), rank=5, current_star=3))
    assert _types(derive_score_milestone_events(cur, "u", "s", PERF)) == ["achieve"]


def test_derive_achieve_with_rank_up():
    # 同★10曲目 かつ currentStar が star_at を超えている → rank_up
    cur = Cur(_derive_routes((PERF, None, 3, DT), rank=STAR_UP_ACHIEVEMENTS, current_star=4))
    ev = derive_score_milestone_events(cur, "u", "s", PERF)
    assert _types(ev) == ["achieve", "rank_up"]
    assert ev[1]["payload"] == {"newStar": 4}


def test_derive_no_rank_up_when_star_not_advanced():
    # 10曲目でも currentStar が star_at のまま(昇格せず) → rank_up 出さない
    cur = Cur(_derive_routes((PERF, None, 3, DT), rank=STAR_UP_ACHIEVEMENTS, current_star=3))
    assert _types(derive_score_milestone_events(cur, "u", "s", PERF)) == ["achieve"]


def test_derive_master_only():
    # achievedPerformanceId は別演奏 / masteredPerformanceId が当該演奏 → master のみ
    cur = Cur(_derive_routes(("other", PERF, 3, DT)))
    assert _types(derive_score_milestone_events(cur, "u", "s", PERF)) == ["master"]


def test_derive_rerun_non_milestone_is_empty():
    # 既達成の別演奏を再解析 → 空 (空上書きは呼び手が {events:[]} で保存)
    cur = Cur(_derive_routes(("other", None, 3, DT)))
    assert derive_score_milestone_events(cur, "u", "s", PERF) == []


def test_derive_no_row():
    cur = Cur(_derive_routes(None))
    assert derive_score_milestone_events(cur, "u", "s", PERF) == []


# ─── recompute_practice_mastery ───────────────────────────────────────────

def _recompute_routes(recent_cnt, recent_avg, total, was_mastered):
    existing = (was_mastered,) if was_mastered is not None else None
    return [
        ("AVG(avg2)", (recent_cnt, recent_avg)),
        ('COUNT(*) FROM "PracticePerformance"', (total,)),
        ('"isPerformanceMastered" FROM "UserPracticeMastery"', existing),
        ('INSERT INTO "UserPracticeMastery"', None),
    ]


def _insert_next_mastered(cur):
    # INSERT の params: (uuid, user, item, avg, total, next, next, next, next) → index5 が next_mastered
    return cur.captured['INSERT INTO "UserPracticeMastery"'][5]


def test_recompute_4th_not_cleared():
    cur = Cur(_recompute_routes(4, 85.0, 4, None))
    assert recompute_practice_mastery(cur, "u", "i") is False
    assert _insert_next_mastered(cur) is False


def test_recompute_5th_exactly_90_clears():
    cur = Cur(_recompute_routes(5, 90.0, 5, None))
    assert recompute_practice_mastery(cur, "u", "i") is True  # 新規到達
    assert _insert_next_mastered(cur) is True


def test_recompute_below_90_not_cleared():
    cur = Cur(_recompute_routes(5, 89.9, 5, None))
    assert recompute_practice_mastery(cur, "u", "i") is False


def test_recompute_already_cleared_no_new_event():
    cur = Cur(_recompute_routes(5, 92.0, 12, True))
    assert recompute_practice_mastery(cur, "u", "i") is False  # newly=False (既クリア)


def test_recompute_daily_does_not_demote():
    # 既クリアで直近が90割れでも、日常(allow_demotion=False)は降格しない
    cur = Cur(_recompute_routes(5, 80.0, 12, True))
    assert recompute_practice_mastery(cur, "u", "i", allow_demotion=False) is False
    assert _insert_next_mastered(cur) is True  # mastered維持


def test_recompute_recompute_mode_demotes():
    # 一斉(allow_demotion=True)は現状に合わせて降格
    cur = Cur(_recompute_routes(5, 80.0, 12, True))
    assert recompute_practice_mastery(cur, "u", "i", allow_demotion=True) is False
    assert _insert_next_mastered(cur) is False  # 降格


# ─── WRITE フラグ ─────────────────────────────────────────────────────────

def test_write_flag_off_no_writes(monkeypatch):
    from lib import __init__  # noqa: F401 (パッケージ確認)
    import loop_engine_runner as runner

    class ExplodingConn:
        def cursor(self):
            raise AssertionError("フラグOFF時に cursor が呼ばれてはいけない")

    monkeypatch.delenv("CELEBRATION_WRITE_ENABLED", raising=False)
    # 例外を出さずに即 return する (書き込みゼロ)
    runner._run_celebration_v2(
        ExplodingConn(), user_id="u", performance_id=PERF, is_practice=False, score_id="s"
    )
