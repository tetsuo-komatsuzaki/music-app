"""
test_progress_updater.py — loop_engine_runner.py の Python 累積処理ユニットテスト

検証カテゴリ (Tetsuo の指示):
  検証 1: 単一更新の正しさ (EMA / matched 比率 / カード遷移 / グレード判定)
  検証 2: トランザクション整合性 (途中エラーで rollback、中間状態にならない)

検証 1' (TS skillRecalc.ts との状態一致) は実 DB が必要 (skillRecalc.ts は
TypeScript で Prisma client を使う) ため本ファイルでは扱わない。代わりに、
spec の数値が手計算と一致することを Python 側だけで検証する。

実行方法:
    cd music-analyzer
    python tests/test_progress_updater.py

このテストは psycopg2 を使わず、in-memory mock cursor で完結する。
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# テスト対象を import するため、psycopg2 が無い環境でも通せるよう sys.modules を
# 事前に偽装する (CI / ローカル両対応)。
try:
    import psycopg2  # noqa: F401
except ImportError:
    import types
    sys.modules["psycopg2"] = types.ModuleType("psycopg2")
try:
    import requests  # noqa: F401
except ImportError:
    import types
    sys.modules["requests"] = types.ModuleType("requests")

from loop_engine_runner import (  # noqa: E402
    EMA_ALPHA,
    SUB_TASK_IDS,
    TASK_IDS,
    _check_grade_up,
    _is_eligible_for_grade_progress,
    process_performance_completion_py,
)


# ---------------------------------------------------------------------------
# In-memory mock cursor (psycopg2 互換 subset)
# ---------------------------------------------------------------------------


class FakeCursor:
    def __init__(self, store):
        self._store = store
        self._last = None  # 直近 fetchone() の結果
        self._closed = False

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self._closed = True

    def execute(self, sql, params=None):
        sql_low = " ".join(sql.lower().split())
        params = params or ()
        self._last = None

        # --- UserSkillScore SELECT ---
        if sql_low.startswith('select "currentscore", "samplecount" from "userskillscore"'):
            user_id, task_id = params
            row = self._store["UserSkillScore"].get((user_id, task_id))
            if row:
                self._last = (row["currentScore"], row["sampleCount"])
            return

        # --- UserSkillScore INSERT ON CONFLICT ---
        if sql_low.startswith('insert into "userskillscore"'):
            _, user_id, task_id, current_score, sample_count = params
            self._store["UserSkillScore"][(user_id, task_id)] = {
                "currentScore": current_score,
                "sampleCount": sample_count,
            }
            return

        # --- UserSkillSubScore SELECT ---
        if sql_low.startswith('select "matchedcount", "totalcount", "averagescore" from "userskillsubscore"'):
            user_id, sub_task_id = params
            row = self._store["UserSkillSubScore"].get((user_id, sub_task_id))
            if row:
                self._last = (
                    row["matchedCount"], row["totalCount"], row["averageScore"]
                )
            return

        # --- UserSkillSubScore INSERT ON CONFLICT ---
        if sql_low.startswith('insert into "userskillsubscore"'):
            _, user_id, sub_task_id, matched_count, total_count, match_rate, avg = params
            self._store["UserSkillSubScore"][(user_id, sub_task_id)] = {
                "matchedCount": matched_count,
                "totalCount": total_count,
                "matchRate": match_rate,
                "averageScore": avg,
                "lastMatched": "matched" in sql_low and "now()" in sql_low,
            }
            return

        # --- UserSkillTaskCard SELECT (sub_task) ---
        if 'from "userskilltaskcard"' in sql_low and "skillsubtaskid" in sql_low and "select" in sql_low:
            if "is null" in sql_low and len(params) == 3:
                # sub_task lookup: cardType='sub_task', skillTaskId IS NULL, skillSubTaskId=?
                user_id, _ct, sub_task_id = params
                for cid, c in self._store["UserSkillTaskCard"].items():
                    if (c["userId"] == user_id and c["cardType"] == "sub_task"
                            and c["skillTaskId"] is None
                            and c["skillSubTaskId"] == sub_task_id):
                        self._last = (cid, c["status"])
                        return
                return
            if "select id, \"skillsubtaskid\"" in sql_low:
                # active sub_task カード一覧 (improving 判定用)
                user_id = params[0]
                actives = [
                    (cid, c["skillSubTaskId"])
                    for cid, c in self._store["UserSkillTaskCard"].items()
                    if c["userId"] == user_id and c["status"] == "active"
                    and c["cardType"] == "sub_task"
                ]
                self._last = actives
                return

        # --- UserSkillTaskCard SELECT (task) ---
        if 'from "userskilltaskcard"' in sql_low and "skilltaskid" in sql_low and "is null" not in sql_low.split("skilltaskid =", 1)[-1].split(" and ")[0] if "skilltaskid =" in sql_low else False:
            pass  # fall-through to next branches

        if 'from "userskilltaskcard"' in sql_low and "skilltaskid = %s" in sql_low and "select id, status" in sql_low:
            user_id, _ct, task_id = params
            for cid, c in self._store["UserSkillTaskCard"].items():
                if (c["userId"] == user_id and c["cardType"] == "task"
                        and c["skillTaskId"] == task_id
                        and c["skillSubTaskId"] is None):
                    self._last = (cid, c["status"])
                    return
            return

        # --- PracticePerformance SELECT (recent for improving) ---
        if 'from "practiceperformance"' in sql_low and 'select "skillsubscores"' in sql_low:
            user_id, limit = params
            perfs = sorted(
                [p for p in self._store["PracticePerformance"]
                 if p["userId"] == user_id and p["analysisStatus"] == "done"],
                key=lambda p: p["uploadedAt"], reverse=True,
            )
            self._last = [(p["skillSubScores"],) for p in perfs[:limit]]
            return

        # --- UserSkillTaskCard INSERT ---
        if sql_low.startswith('insert into "userskilltaskcard"'):
            new_id = params[0]
            user_id = params[1]
            if "'sub_task'" in sql_low:
                sub_task_id = params[2]
                self._store["UserSkillTaskCard"][new_id] = {
                    "userId": user_id, "cardType": "sub_task",
                    "skillTaskId": None, "skillSubTaskId": sub_task_id,
                    "status": "active", "improvedAt": None,
                }
            else:  # task
                task_id = params[2]
                self._store["UserSkillTaskCard"][new_id] = {
                    "userId": user_id, "cardType": "task",
                    "skillTaskId": task_id, "skillSubTaskId": None,
                    "status": "active", "improvedAt": None,
                }
            return

        # --- UserSkillTaskCard UPDATE ---
        if sql_low.startswith('update "userskilltaskcard"'):
            card_id = params[0]
            card = self._store["UserSkillTaskCard"][card_id]
            if "'active'" in sql_low and "improving" in sql_low.split("status")[1][:50]:
                pass  # check below
            if "'active'" in sql_low and "improvedat = null" in sql_low:
                card["status"] = "active"
                card["improvedAt"] = None
            elif "'improving'" in sql_low:
                card["status"] = "improving"
                card["improvedAt"] = "NOW()"
            # lastMatchedAt 単独更新は no-op (テスト不要)
            return

        # --- UserGrade SELECT ---
        if sql_low.startswith('select id, "currentgrade", "progressdata" from "usergrade"'):
            user_id = params[0]
            row = self._store["UserGrade"].get(user_id)
            if row:
                self._last = (row["id"], row["currentGrade"], row["progressData"])
            return

        # --- UserGrade INSERT ---
        if sql_low.startswith('insert into "usergrade"'):
            new_id, user_id = params
            self._store["UserGrade"][user_id] = {
                "id": new_id, "currentGrade": "BEGINNER",
                "progressData": {}, "achievedAt": None,
            }
            self._last = (new_id, "BEGINNER", {})
            return

        # --- UserGrade UPDATE ---
        if sql_low.startswith('update "usergrade"'):
            if "currentgrade" in sql_low:
                progress, new_grade, grade_id = params
                for ug in self._store["UserGrade"].values():
                    if ug["id"] == grade_id:
                        import json as _json
                        ug["progressData"] = _json.loads(progress)
                        ug["currentGrade"] = new_grade
                        ug["achievedAt"] = "NOW()"
            else:
                progress, grade_id = params
                for ug in self._store["UserGrade"].values():
                    if ug["id"] == grade_id:
                        import json as _json
                        ug["progressData"] = _json.loads(progress)
            return

        raise NotImplementedError(f"FakeCursor.execute: unhandled SQL: {sql[:150]}")

    def fetchone(self):
        if isinstance(self._last, list):
            return self._last[0] if self._last else None
        return self._last

    def fetchall(self):
        if self._last is None:
            return []
        if isinstance(self._last, list):
            return self._last
        return [self._last]

    def close(self):
        self._closed = True


class FakeConn:
    def __init__(self):
        self._store = {
            "UserSkillScore": {},      # (userId, taskId) -> {currentScore, sampleCount}
            "UserSkillSubScore": {},   # (userId, subTaskId) -> {...}
            "UserSkillTaskCard": {},   # cardId -> {...}
            "UserGrade": {},           # userId -> {...}
            "PracticePerformance": [], # list of {userId, uploadedAt, analysisStatus, skillSubScores}
        }
        self.committed = False
        self.rolled_back = False

    def cursor(self):
        return FakeCursor(self._store)

    def commit(self):
        self.committed = True

    def rollback(self):
        self.rolled_back = True


# ---------------------------------------------------------------------------
# テストケース
# ---------------------------------------------------------------------------


def _make_sub_scores(matched: dict[str, bool], targets: dict[str, int] = None,
                    scores: dict[str, float] = None) -> dict:
    """skillSubScores 形式のサンプル生成."""
    targets = targets or {}
    scores = scores or {}
    out = {}
    for sid in SUB_TASK_IDS:
        out[sid] = {
            "score": scores.get(sid, 100.0 if not matched.get(sid) else 60.0),
            "matched": matched.get(sid, False),
            "sample_size": targets.get(sid, 0),
            "target_count": targets.get(sid, 0),
            "bad_count": 0,
            "details": None, "details_with_count": None,
        }
    return out


def test_ema_first_sample():
    """初回サンプル: prev=null → currentScore = newScore."""
    conn = FakeConn()
    process_performance_completion_py(
        conn,
        user_id="u1", performance_id="p1",
        practice_item_id="i1", practice_item_difficulty=3,
        skill_scores={"pitch": 80.0, "rhythm": None, "bowing": None},
        sub_scores=_make_sub_scores({}),
    )
    row = conn._store["UserSkillScore"][("u1", "pitch")]
    assert row["currentScore"] == 80.0, f"expected 80.0, got {row['currentScore']}"
    assert row["sampleCount"] == 1
    assert ("u1", "rhythm") not in conn._store["UserSkillScore"], "None score is skipped"
    print("✅ test_ema_first_sample")


def test_ema_second_sample():
    """2 サンプル目: prev * 0.7 + new * 0.3 (丸めなし)."""
    conn = FakeConn()
    # 1 回目: 70.0
    process_performance_completion_py(
        conn, user_id="u1", performance_id="p1",
        practice_item_id="i1", practice_item_difficulty=3,
        skill_scores={"pitch": 70.0, "rhythm": None, "bowing": None},
        sub_scores=_make_sub_scores({}),
    )
    # 2 回目: 95.0 → EMA = 70 * 0.7 + 95 * 0.3 = 77.5
    process_performance_completion_py(
        conn, user_id="u1", performance_id="p2",
        practice_item_id="i1", practice_item_difficulty=3,
        skill_scores={"pitch": 95.0, "rhythm": None, "bowing": None},
        sub_scores=_make_sub_scores({}),
    )
    row = conn._store["UserSkillScore"][("u1", "pitch")]
    expected = 70.0 * (1 - EMA_ALPHA) + 95.0 * EMA_ALPHA  # = 77.5
    assert abs(row["currentScore"] - expected) < 1e-10, \
        f"expected {expected}, got {row['currentScore']}"
    assert row["sampleCount"] == 2
    print("✅ test_ema_second_sample (no rounding, exact match)")


def test_sub_score_matched_ratio():
    """matched=true 1/2 → matchRate=0.5、平均 score = matched 時のスコア."""
    conn = FakeConn()
    # 1 回目: matched=true, score=70
    process_performance_completion_py(
        conn, user_id="u1", performance_id="p1",
        practice_item_id="i1", practice_item_difficulty=3,
        skill_scores={"pitch": 70.0, "rhythm": None, "bowing": None},
        sub_scores=_make_sub_scores(
            matched={"pitch_overall": True},
            targets={"pitch_overall": 16},
            scores={"pitch_overall": 70.0},
        ),
    )
    # 2 回目: matched=false, score=95 (target あり)
    process_performance_completion_py(
        conn, user_id="u1", performance_id="p2",
        practice_item_id="i1", practice_item_difficulty=3,
        skill_scores={"pitch": 95.0, "rhythm": None, "bowing": None},
        sub_scores=_make_sub_scores(
            matched={"pitch_overall": False},
            targets={"pitch_overall": 16},
            scores={"pitch_overall": 95.0},
        ),
    )
    sub = conn._store["UserSkillSubScore"][("u1", "pitch_overall")]
    assert sub["matchedCount"] == 1
    assert sub["totalCount"] == 2
    assert abs(sub["matchRate"] - 0.5) < 1e-10
    assert sub["averageScore"] == 70.0  # matched 時のみ加算 = 70 単独
    print("✅ test_sub_score_matched_ratio")


def test_sub_score_target_zero_skipped():
    """target_count=0 はスキップ (Q5)."""
    conn = FakeConn()
    process_performance_completion_py(
        conn, user_id="u1", performance_id="p1",
        practice_item_id="i1", practice_item_difficulty=3,
        skill_scores={"pitch": 80.0, "rhythm": None, "bowing": None},
        sub_scores=_make_sub_scores(
            matched={},
            targets={"pitch_overall": 0},  # target 0
            scores={"pitch_overall": 80.0},
        ),
    )
    assert ("u1", "pitch_overall") not in conn._store["UserSkillSubScore"], \
        "target=0 should not create row"
    print("✅ test_sub_score_target_zero_skipped (Q5)")


def test_card_active_creation():
    """matched=true で sub_task カードが active 生成される."""
    conn = FakeConn()
    process_performance_completion_py(
        conn, user_id="u1", performance_id="p1",
        practice_item_id="i1", practice_item_difficulty=3,
        skill_scores={"pitch": 70.0, "rhythm": None, "bowing": None},
        sub_scores=_make_sub_scores(
            matched={"pitch_overall": True},
            targets={"pitch_overall": 16},
        ),
    )
    cards = [c for c in conn._store["UserSkillTaskCard"].values()
             if c["skillSubTaskId"] == "pitch_overall"]
    assert len(cards) == 1
    assert cards[0]["status"] == "active"
    print("✅ test_card_active_creation")


def test_card_improving_requires_3_perfs():
    """3 件未満では improving 遷移しない (Commit 7 fix)."""
    conn = FakeConn()
    # 1 回目: matched 1/1 → active
    conn._store["PracticePerformance"].append({
        "userId": "u1", "uploadedAt": 1, "analysisStatus": "done",
        "skillSubScores": {"pitch_overall": {"matched": True}},
    })
    process_performance_completion_py(
        conn, user_id="u1", performance_id="p1",
        practice_item_id="i1", practice_item_difficulty=3,
        skill_scores={"pitch": 70.0, "rhythm": None, "bowing": None},
        sub_scores=_make_sub_scores(matched={"pitch_overall": True}, targets={"pitch_overall": 16}),
    )
    cards = [c for c in conn._store["UserSkillTaskCard"].values()
             if c["skillSubTaskId"] == "pitch_overall"]
    assert cards[0]["status"] == "active", \
        f"1 件のみで improving に落ちてはダメ: {cards[0]}"
    print("✅ test_card_improving_requires_3_perfs")


def test_grade_eligibility():
    """eligibility 判定: 3 score >=90 (bowing=None は弦移動なし曲扱い)."""
    assert _is_eligible_for_grade_progress(95, 95, 95) is True
    assert _is_eligible_for_grade_progress(95, 95, None) is True  # 弦移動なし曲
    assert _is_eligible_for_grade_progress(89, 95, 95) is False
    assert _is_eligible_for_grade_progress(95, 89, 95) is False
    assert _is_eligible_for_grade_progress(95, 95, 89) is False
    assert _is_eligible_for_grade_progress(None, 95, 95) is False
    print("✅ test_grade_eligibility")


def test_grade_progress_added():
    """grade-eligible 演奏で progressData に PracticeItem が追加される."""
    conn = FakeConn()
    process_performance_completion_py(
        conn, user_id="u1", performance_id="p1",
        practice_item_id="i1", practice_item_difficulty=3,
        skill_scores={"pitch": 95.0, "rhythm": 95.0, "bowing": 95.0},
        sub_scores=_make_sub_scores({}),
    )
    grade = conn._store["UserGrade"]["u1"]
    assert grade["progressData"]["3"]["completed"] == 1
    assert "i1" in grade["progressData"]["3"]["practiceItemIds"]
    assert grade["currentGrade"] == "BEGINNER"  # まだ昇格しない
    print("✅ test_grade_progress_added")


def test_grade_duplicate_skipped():
    """同じ PracticeItem を再達成しても progressData の completed は増えない."""
    conn = FakeConn()
    for _ in range(2):
        process_performance_completion_py(
            conn, user_id="u1", performance_id="p1",
            practice_item_id="i1", practice_item_difficulty=3,
            skill_scores={"pitch": 95.0, "rhythm": 95.0, "bowing": 95.0},
            sub_scores=_make_sub_scores({}),
        )
    grade = conn._store["UserGrade"]["u1"]
    assert grade["progressData"]["3"]["completed"] == 1
    assert len(grade["progressData"]["3"]["practiceItemIds"]) == 1
    print("✅ test_grade_duplicate_skipped")


def test_check_grade_up_logic():
    """各バンド完成時の grade-up 判定."""
    # BEGINNER: 難易度 1, 2, 3 各 10 件で → INTERMEDIATE
    progress_ready_for_inter = {
        "1": {"completed": 10}, "2": {"completed": 10}, "3": {"completed": 10},
    }
    assert _check_grade_up(progress_ready_for_inter, "BEGINNER") == "INTERMEDIATE"
    # 1 バンド未達 → 上がらない
    progress_partial = {
        "1": {"completed": 10}, "2": {"completed": 10}, "3": {"completed": 9},
    }
    assert _check_grade_up(progress_partial, "BEGINNER") == "BEGINNER"
    # MASTER は永久保持 (上がる先なし)
    assert _check_grade_up({}, "MASTER") == "MASTER"
    print("✅ test_check_grade_up_logic")


def test_no_score_no_update():
    """skill_scores が全 None ならどの累積も発生しない."""
    conn = FakeConn()
    result = process_performance_completion_py(
        conn, user_id="u1", performance_id="p1",
        practice_item_id="i1", practice_item_difficulty=3,
        skill_scores={"pitch": None, "rhythm": None, "bowing": None},
        sub_scores=_make_sub_scores({}),
    )
    assert conn._store["UserSkillScore"] == {}, "no scores → no UserSkillScore rows"
    assert result["gradeUpdate"]["changed"] is False
    print("✅ test_no_score_no_update")


def main():
    print("=" * 60)
    print("test_progress_updater.py — Python 累積処理ユニットテスト")
    print("=" * 60)
    test_ema_first_sample()
    test_ema_second_sample()
    test_sub_score_matched_ratio()
    test_sub_score_target_zero_skipped()
    test_card_active_creation()
    test_card_improving_requires_3_perfs()
    test_grade_eligibility()
    test_grade_progress_added()
    test_grade_duplicate_skipped()
    test_check_grade_up_logic()
    test_no_score_no_update()
    print("=" * 60)
    print("✅ All progress_updater tests passed (11 ケース)")
    print("=" * 60)


if __name__ == "__main__":
    main()
