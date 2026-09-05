"""途中失敗 (仕様 §11-9): 書き込みが途中で失敗したとき、握りつぶさず例外で止まり、
版の指紋 (scoreNoteVersion) を書く手前で終わること。

行の消し残しは呼び手のトランザクション (analyze_musicxml は最後に1回 commit、
loop_engine_runner._write_performance_notes は with ブロックの後に commit) が巻き戻す。
ここでは「例外が伝わる」「版の UPDATE と commit に到達しない」を偽カーソルで確かめる。
"""
import json
import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from lib.note_store import (
    build_performance_notes,
    make_profile,
    save_material_bundle_counts,
    save_performance_notes,
    save_score_notes,
)


class FailingCursor:
    """N 回目の INSERT で失敗する偽カーソル。実行した SQL を記録する。"""

    def __init__(self, fail_on_insert_no=None, fail_sql_contains=None):
        self.executed = []
        self.inserts = 0
        self.fail_on_insert_no = fail_on_insert_no
        self.fail_sql_contains = fail_sql_contains
        self._last = None

    def execute(self, sql, params=None):
        self.executed.append(sql)
        if self.fail_sql_contains and self.fail_sql_contains in sql:
            raise RuntimeError("db failure: " + self.fail_sql_contains)
        if sql.lstrip().upper().startswith("INSERT"):
            self.inserts += 1
            if self.fail_on_insert_no is not None and self.inserts == self.fail_on_insert_no:
                raise RuntimeError(f"db failure on insert #{self.inserts}")
        self._last = sql

    def fetchall(self):
        # upsert_profiles の SELECT "key", id: 全 key に id を返す
        return [(k, i + 1) for i, k in enumerate(self._keys)]

    def fetchone(self):
        return ("v1",)

    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False


class FakeConn:
    def __init__(self, cur):
        self._cur = cur
        self.commits = 0
        self.rollbacks = 0

    def cursor(self):
        return self._cur

    def commit(self):
        self.commits += 1

    def rollback(self):
        self.rollbacks += 1


def _profiles_and_rows(n=5):
    profiles = {}
    rows = []
    for i in range(n):
        p = make_profile([{"pitch": f"E{4 + i % 2}", "string": "D", "finger": 1, "noteType": "quarter", "dotted": False, "durationBeats": 1.0}],
                         position=1, techs=[], tuplet_actual=0, tuplet_normal=0, on_beat=True, chord_cont=False, rest_before=0.0)
        profiles[p["key"]] = p
        rows.append({"noteIndex": i, "writtenNoteIndex": i, "measure": 1, "pass": 1, "profileKey": p["key"],
                     "prevProfileKey": rows[-1]["profileKey"] if rows else None, "durationSec": 0.5, "beatOffset": float(i)})
    return profiles, rows


def _executed_update_version(cur):
    return [s for s in cur.executed if "scoreNoteVersion" in s and s.lstrip().upper().startswith("UPDATE")]


def test_save_score_notes_stops_before_version_when_insert_fails():
    profiles, rows = _profiles_and_rows()
    cur = FailingCursor(fail_on_insert_no=len(profiles) + 3)  # かたちの INSERT の後、3本目の ScoreNote INSERT で失敗
    cur._keys = list(profiles.keys())
    with pytest.raises(RuntimeError):
        save_score_notes(cur, "score", "s1", rows, profiles)
    assert _executed_update_version(cur) == []  # 版は書かれていない
    assert any('DELETE FROM "ScoreNote"' in s for s in cur.executed)  # 消してから書く途中で止まった = 呼び手の巻き戻しが要る


def test_save_score_notes_writes_version_last_on_success():
    profiles, rows = _profiles_and_rows()
    cur = FailingCursor()
    cur._keys = list(profiles.keys())
    version = save_score_notes(cur, "score", "s1", rows, profiles)
    assert version and _executed_update_version(cur) and cur.executed[-1] == _executed_update_version(cur)[-1]


def test_save_material_bundle_counts_failure_propagates():
    cur = FailingCursor(fail_on_insert_no=2)
    with pytest.raises(RuntimeError):
        save_material_bundle_counts(cur, "m1", {"pitch|E4|F4": 3, "technique|slur": 2, "note|E4": 5}, 10, "v1")
    assert cur.executed[0].lstrip().startswith('DELETE FROM "MaterialBundleCount"')


def _comparison_rows(n=4):
    return [{"note_index": i, "note_name": "E4", "pitch_ok": True, "start_ok": True, "evaluation_status": "evaluated",
             "expected_start_sec": i * 0.5, "expected_end_sec": i * 0.5 + 0.4} for i in range(n)]


def test_save_performance_notes_stops_before_version_when_insert_fails():
    rows = build_performance_notes(_comparison_rows())
    cur = FailingCursor(fail_on_insert_no=2)
    with pytest.raises(RuntimeError):
        save_performance_notes(cur, "score", "p1", rows, "score", "s1")
    assert _executed_update_version(cur) == []


def test_runner_write_does_not_commit_when_save_fails(tmp_path):
    """loop_engine_runner._write_performance_notes: 失敗は例外で伝え、commit に到達しない。"""
    try:
        from loop_engine_runner import _write_performance_notes
    except ImportError as e:  # pragma: no cover - 実行環境に重い依存が無いときは飛ばす
        pytest.skip(f"runner import unavailable: {e}")
    comp = tmp_path / "comparison_result.json"
    comp.write_text(json.dumps({"results": _comparison_rows()}), encoding="utf-8")
    cur = FailingCursor(fail_on_insert_no=3)
    conn = FakeConn(cur)
    with pytest.raises(RuntimeError):
        _write_performance_notes(conn, "score", "p1", str(comp), "score", "s1")
    assert conn.commits == 0
    # 成功すれば 1 回だけ commit
    cur_ok = FailingCursor()
    conn_ok = FakeConn(cur_ok)
    _write_performance_notes(conn_ok, "score", "p1", str(comp), "score", "s1")
    assert conn_ok.commits == 1 and _executed_update_version(cur_ok)
