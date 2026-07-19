# -*- coding: utf-8 -*-
"""lib/achievement の判定ロジック検証（曲マスター/達成/Star/エチュード解決）。

2026-06-07 スコア設計方針転換の思想に対して検証する:
  - マスター = 達成済 & 未マスター & 直近5回の (pitchAccuracy+timingAccuracy)/2 平均 >= 90
    ※ overallScore は使わない。区間録音(rangeFromNote)は非算入。
  - 達成 = 崩壊ゼロ3回 + star非null + レッスン要件 + エチュード要件。
"""
from lib.achievement import (
    process_score_achievement,
    resolve_required_etude,
    _clean_run_count,
    _parse_positions,
    _position_key,
    _check_star_up,
    CLEAN_RUNS_REQUIRED,
    MASTER_RECENT_COUNT,
    MASTER_AVG,
)


# ─── スクリプト式モックカーソル ──────────────────────────────────────────

class Router:
    """SQL 文字列の部分一致でルーティングするモック応答テーブル。"""

    def __init__(self):
        self.rules = []  # list[(substr, spec)]

    def add(self, substr, one=None, all=None, rowcount=0):
        self.rules.append((substr, {"one": one, "all": all or [], "rowcount": rowcount}))
        return self

    def __call__(self, sql, params):
        for substr, spec in self.rules:
            if substr in sql:
                return spec
        raise AssertionError(f"No route configured for SQL:\n{sql}")


class MockCursor:
    def __init__(self, router):
        self._router = router
        self.rowcount = 0
        self._one = None
        self._all = []
        self.log = []  # 実行された SQL 文字列（順序保持）

    def execute(self, sql, params=None):
        self.log.append(sql)
        spec = self._router(sql, params)
        self._one = spec.get("one")
        self._all = spec.get("all", [])
        self.rowcount = spec.get("rowcount", 0)

    def fetchone(self):
        return self._one

    def fetchall(self):
        return self._all

    def ran(self, substr):
        return any(substr in s for s in self.log)


# ─── 純粋ヘルパ ──────────────────────────────────────────────────────────

def test_parse_positions():
    assert _parse_positions(["1st", "3rd", "10th"]) == [1, 3, 10]
    assert _parse_positions(None) == []
    assert _parse_positions(["bogus", "2nd"]) == [2]


def test_position_key_caps_at_6():
    assert _position_key(2) == "2"
    assert _position_key(5) == "5"
    assert _position_key(6) == "6"
    assert _position_key(9) == "6"  # 6th 以上は "6" に正規化


def test_clean_run_count_performance_excludes_range_recordings():
    """Performance では区間録音(rangeFromNote NOT NULL)を除外する SQL であること。"""
    cur = MockCursor(Router().add("COUNT(*)", one=(3,)))
    n = _clean_run_count(cur, "Performance", "scoreId", "s1", "u1")
    assert n == 3
    sql = cur.log[0]
    assert 'is_clean' in sql
    assert '"rangeFromNote" IS NULL' in sql  # 区間録音を非算入


def test_clean_run_count_practiceperformance_has_no_range_filter():
    """PracticePerformance には rangeFromNote カラムが無いのでフィルタを付けない。"""
    cur = MockCursor(Router().add("COUNT(*)", one=(5,)))
    _clean_run_count(cur, "PracticePerformance", "practiceItemId", "p1", "u1")
    assert '"rangeFromNote"' not in cur.log[0]


# ─── マスター判定（思想の中核） ───────────────────────────────────────────

def _mastery_router(existing, agg_one, update_rowcount=0):
    return (
        Router()
        .add('SELECT star FROM "Score"', one=(1,))
        .add('SELECT id, "masteredAt"', one=existing)
        .add('AVG(s.avg2)', one=agg_one)
        .add('SET "masteredAt"', rowcount=update_rowcount)
    )


def test_master_granted_when_recent5_avg_ge_90():
    cur = MockCursor(_mastery_router(("ach-1", None), (5, 92.0), update_rowcount=1))
    res = process_score_achievement(cur, "u1", "s1", "perf-1")
    assert res["mastered"] is True
    assert res["achieved"] is False  # 既達成なので新規達成はしない


def test_master_avg_exactly_90_grants():
    cur = MockCursor(_mastery_router(("ach-1", None), (5, MASTER_AVG), update_rowcount=1))
    assert process_score_achievement(cur, "u1", "s1", "p")["mastered"] is True


def test_master_blocked_when_avg_below_90():
    cur = MockCursor(_mastery_router(("ach-1", None), (5, 89.9)))
    res = process_score_achievement(cur, "u1", "s1", "p")
    assert res["mastered"] is False
    assert not cur.ran('SET "masteredAt"')  # UPDATE を撃たない


def test_master_blocked_when_fewer_than_5_scored():
    cur = MockCursor(_mastery_router(("ach-1", None), (4, 99.0)))
    assert process_score_achievement(cur, "u1", "s1", "p")["mastered"] is False


def test_master_blocked_when_no_scored_performances():
    # 採点済み演奏ゼロ → AVG は None
    cur = MockCursor(_mastery_router(("ach-1", None), (0, None)))
    assert process_score_achievement(cur, "u1", "s1", "p")["mastered"] is False


def test_already_mastered_skips_reevaluation():
    # masteredAt が既に入っている → マスター判定ブロックに入らない
    cur = MockCursor(_mastery_router(("ach-1", "2026-01-01"), (5, 99.0)))
    res = process_score_achievement(cur, "u1", "s1", "p")
    assert res["mastered"] is False
    assert not cur.ran('AVG(s.avg2)')  # 集計クエリすら走らない


def test_master_sql_uses_pitch_timing_not_overallscore():
    """思想検証: マスターは (pitchAccuracy+timingAccuracy)/2 平均。overallScore は不使用。"""
    cur = MockCursor(_mastery_router(("ach-1", None), (5, 95.0), update_rowcount=1))
    process_score_achievement(cur, "u1", "s1", "p")
    agg_sql = next(s for s in cur.log if 'AVG(s.avg2)' in s)
    assert '"pitchAccuracy"' in agg_sql
    assert '"timingAccuracy"' in agg_sql
    assert 'overallScore' not in agg_sql          # 廃止済
    assert '"rangeFromNote" IS NULL' in agg_sql   # 区間録音は非算入
    # LIMIT が MASTER_RECENT_COUNT(=5) パラメータで渡ること
    assert 'LIMIT %s' in agg_sql


# ─── 達成判定のブロック条件 ───────────────────────────────────────────────

def test_achievement_blocked_by_insufficient_clean_runs():
    cur = MockCursor(
        Router()
        .add('SELECT star FROM "Score"', one=(1,))
        .add('SELECT id, "masteredAt"', one=None)   # 未達成
        .add('is_clean', one=(CLEAN_RUNS_REQUIRED - 1,))  # 2回 < 3
    )
    res = process_score_achievement(cur, "u1", "s1", "p")
    assert res["achieved"] is False
    assert res["blocked_by"] == "clean_runs"
    assert res["clean_runs"] == CLEAN_RUNS_REQUIRED - 1


def test_achievement_blocked_by_star_null():
    cur = MockCursor(
        Router()
        .add('SELECT star FROM "Score"', one=(None,))  # star 未設定
        .add('SELECT id, "masteredAt"', one=None)
        .add('is_clean', one=(CLEAN_RUNS_REQUIRED,))
    )
    res = process_score_achievement(cur, "u1", "s1", "p")
    assert res["blocked_by"] == "star_null"
    assert res["achieved"] is False


def test_achievement_granted_then_mastered_full_path():
    """要件が全て免除される最小構成で 達成成立 → 同一トランザクションでマスターまで。"""
    router = (
        Router()
        .add('SELECT star FROM "Score"', one=(1,))
        .add('SELECT id, "masteredAt"', one=None)                 # 未達成
        .add('is_clean', one=(CLEAN_RUNS_REQUIRED,))              # 崩壊ゼロ3回
        .add('FROM "PracticeItem" pi', all=[])                    # lesson在庫なし
        .add('FROM "ScoreTechniqueTag"', all=[])                  # 技術タグなし(=エチュ免除も)
        .add('FROM "ScoreFeatureTag"', all=[])
        .add('SELECT positions FROM "Score"', one=(None,))        # ポジション要件なし
        .add('SELECT star, "keyTonic"', one=(1, "C", "major", 100.0))  # resolve_required_etude
        .add('INSERT INTO "UserScoreAchievement"', rowcount=1)    # 達成 INSERT 成功
        .add('INSERT INTO "UserStarProgress"', rowcount=0)
        .add('SELECT "currentStar"', one=(1,))
        .add('COUNT(*) FROM "UserScoreAchievement"', one=(1,))    # 達成1件 <10 → 昇格なし
        .add('AVG(s.avg2)', one=(5, 95.0))                        # マスター条件成立
        .add('SET "masteredAt"', rowcount=1)
    )
    cur = MockCursor(router)
    res = process_score_achievement(cur, "u1", "s1", "perf-9")
    assert res["achieved"] is True
    assert res["blocked_by"] is None
    assert res["star_up"] is None
    assert res["mastered"] is True


# ─── エチュード解決（決定関数） ───────────────────────────────────────────

def test_resolve_etude_none_when_star_null():
    cur = MockCursor(Router().add('SELECT star, "keyTonic"', one=(None, None, None, None)))
    assert resolve_required_etude(cur, "s1") is None


def test_resolve_etude_none_when_no_technique_tags():
    cur = MockCursor(
        Router()
        .add('SELECT star, "keyTonic"', one=(1, "C", "major", 100.0))
        .add('FROM "ScoreTechniqueTag"', all=[])  # 技術タグなし → 免除
    )
    assert resolve_required_etude(cur, "s1") is None


def test_resolve_etude_none_when_no_candidate():
    cur = MockCursor(
        Router()
        .add('SELECT star, "keyTonic"', one=(1, "C", "major", 100.0))
        .add('FROM "ScoreTechniqueTag"', all=[("スラー",)])
        .add("category = 'etude'", all=[])  # 同★候補なし → 免除
    )
    assert resolve_required_etude(cur, "s1") is None


def test_resolve_etude_picks_max_overlap():
    """①技術タグ最多カバー を最優先で選ぶ。"""
    cur = MockCursor(
        Router()
        .add('SELECT star, "keyTonic"', one=(1, "C", "major", 100.0))
        .add('FROM "ScoreTechniqueTag"', all=[("スラー",), ("スタッカート",)])
        .add(
            "category = 'etude'",
            all=[
                # (id, title, overlap, tonic, mode, tempoMin, tempoMax)
                ("e-low", "Overlap1", 1, "C", "major", 100, 100),
                ("e-hi", "Overlap2", 2, "G", "minor", 40, 40),  # 調/テンポ不一致でも overlap 最多
            ],
        )
    )
    r = resolve_required_etude(cur, "s1")
    assert r == {"id": "e-hi", "title": "Overlap2"}


def test_resolve_etude_tiebreak_key_then_tempo():
    """overlap 同点なら 調号一致 → テンポ近い の順。"""
    cur = MockCursor(
        Router()
        .add('SELECT star, "keyTonic"', one=(2, "D", "major", 90.0))
        .add('FROM "ScoreTechniqueTag"', all=[("スラー",)])
        .add(
            "category = 'etude'",
            all=[
                ("e-farkey", "FarKey", 1, "A", "major", 88, 92),   # テンポは近いが調不一致
                ("e-matchkey", "MatchKey", 1, "D", "major", 40, 50),  # 調一致 → こちらが優先
            ],
        )
    )
    r = resolve_required_etude(cur, "s1")
    assert r["id"] == "e-matchkey"


# ─── Star 昇格 ────────────────────────────────────────────────────────────

def test_check_star_up_promotes_at_10():
    cur = MockCursor(
        Router()
        .add('INSERT INTO "UserStarProgress"', rowcount=0)
        .add('SELECT "currentStar"', one=(1,))
        .add('COUNT(*) FROM "UserScoreAchievement"', one=(10,))  # 10件で昇格
        .add('UPDATE "UserStarProgress"', rowcount=1)
    )
    assert _check_star_up(cur, "u1") == 2


def test_check_star_up_none_below_threshold():
    cur = MockCursor(
        Router()
        .add('INSERT INTO "UserStarProgress"', rowcount=0)
        .add('SELECT "currentStar"', one=(1,))
        .add('COUNT(*) FROM "UserScoreAchievement"', one=(9,))  # 9件 → 昇格なし
    )
    assert _check_star_up(cur, "u1") is None
