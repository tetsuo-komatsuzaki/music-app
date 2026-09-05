"""voice_merge.py — 同じ五線に書かれた複数の声部を 1 本の線にまとめる (2026-09-05 Tetsuo確定)。

【きっかけ】原譜に声部2 (<voice>2) がある小節は解析から丸ごと落ちていた (教材6件・曲3件・45小節)。
解析は小節直下の notesAndRests を読むが、music21 は声部が複数ある小節の音符を Voice 子ストリームに
入れるので直下が空になる。バイオリンは 1 人で弾く楽器なので、声部は「同時に鳴る音」か
「交互に鳴る音」のどちらかであり、時間順に 1 本にまとめれば演奏の実体と一致する。

【規則】小節内の全声部の音と休符を時刻で切り、区間ごとに:
  - 鳴っている音が無い       → 休符 (次に何か鳴るまで 1 つにまとめる)
  - 1 声部の音がそのまま収まる → その音符オブジェクトをそのまま使う (奏法記号・スラー・運指を保つ)
  - 複数の音が重なる          → 重音 (同じ高さは 1 つに)。区間の頭で始まる音の奏法記号・表現を写し、
                                前後にまたがる音にはタイを付ける (持続音の下で動く声部 → 動く音ごとの重音)
  - 装飾音 (長さ 0) と声部内の記号 (強弱など) は同じ位置にそのまま移す
スラーなどのスパナーは、置き換えた音符へ参照を差し替える (spanner.replaceSpannedElement)。
"""
from __future__ import annotations

import copy
from fractions import Fraction
from typing import Any

from music21 import chord, note, stream, tie
from music21.common.numberTools import opFrac


def _frac(x) -> Fraction:
    return x if isinstance(x, Fraction) else Fraction(x).limit_denominator(4096)


class _Ev:
    __slots__ = ("dur", "el", "end", "off", "voice")

    def __init__(self, off: Fraction, dur: Fraction, el: Any, voice: int):
        self.off, self.dur, self.end, self.el, self.voice = off, dur, off + dur, el, voice


def _pitches_of(el) -> list:
    if isinstance(el, chord.Chord):
        return list(el.pitches)
    if isinstance(el, note.Note):
        return [el.pitch]
    return []


def _starts_before(ev: _Ev, t0: Fraction) -> bool:
    if ev.off < t0:
        return True
    t = getattr(ev.el, "tie", None)
    return bool(t and t.type in ("stop", "continue") and ev.off == t0)


def _ends_after(ev: _Ev, t1: Fraction) -> bool:
    if ev.end > t1:
        return True
    t = getattr(ev.el, "tie", None)
    return bool(t and t.type in ("start", "continue") and ev.end == t1)


def _tie_for(before: bool, after: bool) -> tie.Tie | None:
    if before and after:
        return tie.Tie("continue")
    if before:
        return tie.Tie("stop")
    if after:
        return tie.Tie("start")
    return None


def _replace_spanners(old, new) -> None:
    for sp in old.getSpannerSites():
        try:
            sp.replaceSpannedElement(old, new)
        except Exception:  # noqa: BLE001 — 参照の無いスパナーは無視 (音は落とさない)
            pass


def _build_segment(sounding: list[_Ev], t0: Fraction, t1: Fraction):
    """区間 [t0, t1) の音を 1 つの Note/Chord にする。1 音がそのまま収まるなら元のオブジェクトを返す。"""
    starters = sorted([ev for ev in sounding if ev.off == t0], key=lambda e: e.voice)
    if len(sounding) == 1 and starters and sounding[0].end == t1:
        return sounding[0].el, False

    # 高さの集合 (同じ高さは 1 つ)。それぞれのタイ状態も高さ単位で決める
    by_midi: dict = {}
    for ev in sounding:
        before, after = _starts_before(ev, t0), _ends_after(ev, t1)
        for p in _pitches_of(ev.el):
            key = (p.midi, p.name)
            b, a, p0 = by_midi.get(key, (False, False, p))
            by_midi[key] = (b or before, a or after, p0)
    ordered = sorted(by_midi.items(), key=lambda kv: kv[0][0])
    dur_ql = opFrac(t1 - t0)
    if len(ordered) == 1:
        (_, (before, after, p)) = ordered[0]
        new = note.Note(p)
        new.duration.quarterLength = dur_ql
        new.tie = _tie_for(before, after)
    else:
        new = chord.Chord([kv[1][2] for kv in ordered])
        new.duration.quarterLength = dur_ql
        for comp, (_, (before, after, _p)) in zip(new.notes, ordered):
            comp.tie = _tie_for(before, after)

    # 区間の頭で始まる音の記号・表現を写す (声部1 優先で、重複しないように足す)
    seen_art: set = set()
    for ev in starters:
        for a in getattr(ev.el, "articulations", []):
            k = type(a).__name__
            if k not in seen_art:
                seen_art.add(k)
                new.articulations.append(copy.deepcopy(a))
        for x in getattr(ev.el, "expressions", []):
            new.expressions.append(copy.deepcopy(x))
        if getattr(ev.el, "lyrics", None) and not new.lyrics:
            new.lyrics = copy.deepcopy(ev.el.lyrics)
    for ev in starters:
        _replace_spanners(ev.el, new)
    return new, True


def _merge_measure(m: stream.Measure, voices: list[stream.Voice]) -> None:
    events: list[_Ev] = []
    graces: list[tuple[Fraction, Any]] = []
    others: list[tuple[Fraction, Any]] = []
    for vi, v in enumerate(voices):
        for el in list(v):
            off = _frac(el.offset)
            if isinstance(el, note.GeneralNote):
                dur = _frac(el.duration.quarterLength)
                if dur == 0:
                    graces.append((off, el))
                else:
                    events.append(_Ev(off, dur, el, vi))
            else:
                others.append((off, el))
    for v in voices:
        for el in list(v):
            v.remove(el)
        m.remove(v)

    notes_only = [ev for ev in events if not isinstance(ev.el, note.Rest)]
    # 区切りは「音の始まり・終わり」と小節の終端だけ。休符の境目で持続音を割らない
    # (メヌエット m16: 声部2 の休符の切れ目で声部1 の 2 分音符が 4 分×2 のタイに割れていた)
    measure_end = max((ev.end for ev in events), default=Fraction(0))
    bounds = sorted({ev.off for ev in notes_only} | {ev.end for ev in notes_only} | {Fraction(0), measure_end})

    def sounding_at(t: Fraction) -> list[_Ev]:
        return [ev for ev in notes_only if ev.off <= t < ev.end]

    i = 0
    while i < len(bounds) - 1:
        t0 = bounds[i]
        snd = sounding_at(t0)
        if not snd:
            j = i + 1
            while j < len(bounds) - 1 and not sounding_at(bounds[j]):
                j += 1
            r = note.Rest()
            r.duration.quarterLength = opFrac(bounds[j] - t0)
            m.insert(opFrac(t0), r)
            i = j
            continue
        t1 = bounds[i + 1]
        el, _is_new = _build_segment(snd, t0, t1)
        m.insert(opFrac(t0), el)
        i += 1

    for off, el in graces:
        m.insert(opFrac(off), el)
    for off, el in others:
        m.insert(opFrac(off), el)


def merge_voices(score) -> int:
    """Score/Part の全小節について、声部が複数ある小節を 1 本にまとめる。まとめた小節数を返す。"""
    parts = list(score.parts) if hasattr(score, "parts") and len(getattr(score, "parts", [])) else [score]
    merged = 0
    for part in parts:
        for m in part.getElementsByClass(stream.Measure):
            voices = list(m.voices)
            if not voices:
                continue
            _merge_measure(m, voices)
            merged += 1
    return merged
