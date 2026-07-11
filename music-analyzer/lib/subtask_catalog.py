# -*- coding: utf-8 -*-
"""subtask_catalog.py — 小課題カタログ217のローダー（工程C-1）
正本: lib/subtask_catalog.json（generate_subtask_catalog.py で生成・手書き禁止）
"""
from __future__ import annotations

import json
import os
from functools import lru_cache

_JSON_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "subtask_catalog.json")


@lru_cache(maxsize=1)
def load_catalog() -> dict:
    with open(_JSON_PATH, encoding="utf-8") as f:
        return json.load(f)


@lru_cache(maxsize=1)
def all_ids() -> frozenset:
    return frozenset(e["id"] for e in load_catalog()["entries"])


@lru_cache(maxsize=1)
def v1_active_ids() -> frozenset:
    return frozenset(e["id"] for e in load_catalog()["entries"] if e["v1_active"])


@lru_cache(maxsize=1)
def name_by_id() -> dict:
    return {e["id"]: e["name"] for e in load_catalog()["entries"]}


@lru_cache(maxsize=1)
def diagnosable_ids() -> frozenset:
    """C-5: 診断top選出に使えるID（「変化なし箱」= 同一ポジ内/同一弦×順次 を除く）。"""
    return frozenset(e["id"] for e in load_catalog()["entries"] if e["diagnosable"])
