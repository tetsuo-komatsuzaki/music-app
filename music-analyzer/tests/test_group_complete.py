"""教材グループのコンプリート判定 (2026-09-05 Tetsuo確定): 奏法バリエーション全クリア / リズムバリエーション全クリア"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from lib.achievement import (
    GROUP_COMPLETE_MIN_VARIANTS,
    group_complete_kinds,
)


def V(i, art=None, rhythm=False):
    return {"id": f"v{i}", "articulation": art, "has_rhythm": rhythm}


def test_articulation_complete_requires_all_articulation_variants_mastered():
    variants = [V(1, "legato"), V(2, "staccato"), V(3, "spiccato"), V(4, None, rhythm=True)]
    assert group_complete_kinds(variants, {"v1", "v2"}) == []
    assert group_complete_kinds(variants, {"v1", "v2", "v3"}) == [{"kind": "articulation", "count": 3}]


def test_rhythm_complete_is_separate_and_ignores_articulation_variants():
    variants = [V(1, "legato"), V(2, "slur", rhythm=True), V(3, "slur", rhythm=True)]
    assert group_complete_kinds(variants, {"v2", "v3"}) == [{"kind": "rhythm", "count": 2}]
    assert group_complete_kinds(variants, {"v1", "v2", "v3"}) == [{"kind": "rhythm", "count": 2}]  # 奏法は1つだけなので対象外


def test_single_variant_group_is_not_a_completion():
    assert GROUP_COMPLETE_MIN_VARIANTS == 2
    assert group_complete_kinds([V(1, "legato")], {"v1"}) == []
    assert group_complete_kinds([V(1, None, rhythm=True)], {"v1"}) == []
