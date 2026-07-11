"""
pattern_generator.py — ベース楽譜(MusicXML)にパターンを掛けて変奏を生成する (PoC)

設計(決定doc §18):
- 教材 = ベース教材 × パターン。pitch/弦/ポジションは不変、弾き方(奏法・リズム)だけを上書き。
- パターン2タイプ:
    単一(uniform)   : 全音符に同じ弾き方を適用
    グループ(group) : テンプレート(各位置の役割)を循環適用
- パターンはレジストリ(下記 PATTERNS)で管理 = 拡張前提(追加・削除で再生成)。
- 各パターンは誘発タグ(induced_tags)を宣言 → 掛けると自動でそのタグが付く。

使い方:
    python pattern_generator.py <input.musicxml> <pattern_id> <output.musicxml>
"""
from __future__ import annotations
import sys
from music21 import converter, articulations, duration, spanner


# --- パターン・レジストリ (拡張前提: ここに1件足すだけで増える) ---
PATTERNS = {
    # 単一 (uniform): 全音符に適用
    "staccato_all": {
        "type": "uniform", "articulation": "staccato",
        "induced_tags": ["スタッカート"],
    },
    "spiccato_all": {
        "type": "uniform", "articulation": "spiccato",
        "induced_tags": ["スピッカート"],
    },
    "sixteenth_all": {
        "type": "uniform", "rhythm_ql": 0.25,   # 16分 = quarterLength 0.25
        "induced_tags": ["16分"],
    },
    # グループ (template): 単位を循環適用。各要素 = そのポジションの役割
    "slur_2": {
        "type": "group",
        "template": [{"slur": "start"}, {"slur": "stop"}],
        "induced_tags": ["スラー"],
    },
    "dotted": {  # 付点 = [長(1.5), 短(0.5)] の繰り返し (8分基準の付点8分+16分)
        "type": "group",
        "template": [{"rhythm_ql": 0.75}, {"rhythm_ql": 0.25}],
        "induced_tags": ["付点"],
    },
}

_ART = {"staccato": articulations.Staccato, "spiccato": articulations.Spiccato}


def _iter_notes(score):
    return list(score.recurse().notes)  # Note と Chord


def apply_uniform(score, pat):
    for n in _iter_notes(score):
        if "articulation" in pat:
            n.articulations.append(_ART[pat["articulation"]]())
        if "rhythm_ql" in pat:
            n.duration = duration.Duration(pat["rhythm_ql"])


def apply_group(score, pat):
    tpl = pat["template"]
    notes = _iter_notes(score)
    slur = None
    for i, n in enumerate(notes):
        role = tpl[i % len(tpl)]
        if "rhythm_ql" in role:
            n.duration = duration.Duration(role["rhythm_ql"])
        if role.get("slur") == "start":
            slur = spanner.Slur()
            slur.addSpannedElements(n)
            score.insert(0, slur)
        elif role.get("slur") == "stop" and slur is not None:
            slur.addSpannedElements(n)
            slur = None
        elif slur is not None:
            slur.addSpannedElements(n)  # 継続(中)


def generate(in_path, pattern_id, out_path):
    if pattern_id not in PATTERNS:
        raise SystemExit(f"unknown pattern: {pattern_id}. known: {list(PATTERNS)}")
    pat = PATTERNS[pattern_id]
    score = converter.parse(in_path)
    (apply_uniform if pat["type"] == "uniform" else apply_group)(score, pat)
    score.write("musicxml", fp=out_path)
    print(f"OK  pattern={pattern_id}  induced_tags={pat['induced_tags']}")
    print(f"    in={in_path}  out={out_path}  notes={len(_iter_notes(score))}")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print(__doc__)
        raise SystemExit(1)
    generate(sys.argv[1], sys.argv[2], sys.argv[3])
