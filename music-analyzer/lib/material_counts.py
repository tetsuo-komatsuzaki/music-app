# -*- coding: utf-8 -*-
"""
material_counts.py — 教材の中に各課題が何回出てくるかを数える (2026-09-04)

ホームのおすすめの規則 (2026-09-04 Tetsuo確定):
  ユーザーの★以下の教材から、その課題がいちばん多く出てくる1件を出す。

回数はカルテを1音ずつ見ないと出せず、表示のたびに1000件読むのは不可能なので
PracticeItemSubtaskCount に置く。ここはその計算と保存の正本。

呼び手は2つ。どちらも同じ関数を使うので、後追いの一括集計と、教材アップロード時の
自動反映で数え方がずれない。
  - analyze_musicxml.py     教材の解析が終わるたびに自動で書く (新規教材はこれで入る)
  - scripts/build_material_subtask_counts.py  既存教材の一括集計

文脈の導出は diagnosis.py の _context_suffixes をそのまま使う。ユーザーの演奏を
判定するときと同じ関数なので、教材側と診断側で数え方が一致する (C-1 単一ソース原則)。

tuplet_actual は analysis.json 側の情報でカルテには無い。None を渡すと diagnosis と
同じく三連符に既定されるため、五連符以上の回数は立たない。集計の既知の限界。
"""
from __future__ import annotations

import uuid
from typing import Any, Iterable

from lib.diagnosis import _context_suffixes
from lib.subtask_catalog import v1_active_ids


def compute_counts(notes: Iterable[dict[str, Any]]) -> tuple[int, dict[str, int]]:
    """カルテの音符列から (休符を除く音符数, {課題ID: 回数}) を返す。

    notes は note_karte.json の notes[] と同じ形の dict 列。
    dataclass のままなら dataclasses.asdict した後に渡すこと。
    """
    active = v1_active_ids()
    ordered = [n for n in notes if not n.get("is_rest")]
    if not ordered:
        return 0, {}

    # 連続重音の判定は diagnose と同じ規則
    neighbor: dict = {}
    for i, n in enumerate(ordered):
        prev_c = i > 0 and ordered[i - 1].get("is_chord")
        next_c = i + 1 < len(ordered) and ordered[i + 1].get("is_chord")
        neighbor[n["note_index"]] = bool(n.get("is_chord") and (prev_c or next_c))

    counts: dict[str, int] = {}

    def bump(sid: str) -> None:
        if sid in active:
            counts[sid] = counts.get(sid, 0) + 1

    for n in ordered:
        cx = _context_suffixes(n, neighbor.get(n["note_index"], False), None)
        for sfx in cx["pitch_ctx"]:
            bump(f"pitch_{sfx}")
            bump(f"rhythm_{sfx}")
        for sfx in cx["rhythm_only_ctx"]:
            bump(f"rhythm_{sfx}")
    return len(ordered), counts


def save_counts(cur, practice_item_id: str, note_total: int, counts: dict[str, int]) -> int:
    """その教材の行を丸ごと貼り替える。コミットは呼び手の責務。

    貼り替えにするのは、変種の作り直しで課題の構成が変わったときに
    古い行が残らないようにするため。
    """
    cur.execute(
        'DELETE FROM "PracticeItemSubtaskCount" WHERE "practiceItemId" = %s',
        (practice_item_id,),
    )
    if not counts:
        return 0
    cur.executemany(
        '''
        INSERT INTO "PracticeItemSubtaskCount"
          (id, "practiceItemId", "subtaskId", count, "noteTotal", "updatedAt")
        VALUES (%s, %s, %s, %s, %s, NOW())
        ''',
        [
            (str(uuid.uuid4()), practice_item_id, sid, n, note_total)
            for sid, n in counts.items()
        ],
    )
    return len(counts)
