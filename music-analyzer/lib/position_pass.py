"""
position_pass.py — 譜面全体を見て弦・ポジションを決める2段パス (2026-08-25 Tetsuo確定)

これまでは音を前から順に貪欲に決めていたため、楽譜に書かれた運指が持つ「意図」
(ここで1stに戻る、など) を活かせなかった。本モジュールは譜面を通しで見て、
まず確実な地点 (アンカー) を固定し、その間を規則で補間する。

## 第1段: アンカー (楽譜に運指が書かれた音)
  A. その指で1stポジションで鳴らせる → **1stポジションとして確定**
     (楽譜がわざわざ1stの運指を書くのは「ここで1stに戻る」という指示のため)
  B. 1stで鳴らせない → その指で成立する候補のうち **最も低いポジション** を採用
     (弦の指定がなければ、最も低いポジションになる弦を選ぶ = ②確定)

## 第2段: アンカー間の補間 (運指が書かれていない音)
  前後のアンカーを両端として、その間の音を規則で埋める:
    1. 同じポジションで弾ける → ポジションを動かさない (弦は同弦 → 隣弦の順)
    2. 弾けない → シフト (移動量の小さい順)
  **アンカーが優先** (③確定)。補間が終点アンカーに合わなくてもアンカーは動かさない。
  アンカーが1つもない譜面は、1stポジションで押さえられる音は1stポジション、
  押さえられない音は推定ロジックで判定する (④確定)。

## 未定義 (2026-08-25 時点で解なし ・ 今後決める)
  「1stポジションで鳴らせるが、実際は1stではない」稀な例外の見抜き方。
  現状は A を無条件で適用する。前後のアンカーとの矛盾から検出する案は保留。
  → docs/SPEC-CHANGES.md にも記録。
"""
from __future__ import annotations

import logging
from typing import Any, Optional

from lib.violin_position import (
    FIRST_POSITION_MIDI_MAX,
    FIRST_POSITION_MIDI_MIN,
    VIOLIN_FIRST_POSITION_MAP,
    _OPEN_MIDI,
    _STRING_ORDER,
    _string_distance,
    position_by_letter,
)

logger = logging.getLogger(__name__)

# 1音の解決結果
Resolved = dict[str, Any]   # {string_id, position, finger, confidence, is_anchor}


def _candidates_for_finger(step: str, octave: int, finger: int, midi: int) -> list[tuple[str, int]]:
    """指定の指で鳴らせる (弦, ポジション) の候補。物理的に出せない弦は除く。"""
    out: list[tuple[str, int]] = []
    for s, open_midi in _OPEN_MIDI.items():
        if midi <= open_midi:
            continue
        pos = position_by_letter(step, octave, finger, s)
        if pos is not None:
            out.append((s, pos))
    return out


def _candidates_any_finger(step: str, octave: int, midi: int) -> list[tuple[str, int, int]]:
    """指を問わず鳴らせる (弦, ポジション, 指) の候補。"""
    out: list[tuple[str, int, int]] = []
    for s, open_midi in _OPEN_MIDI.items():
        if midi <= open_midi:
            continue
        for f in (1, 2, 3, 4):
            pos = position_by_letter(step, octave, f, s)
            if pos is not None:
                out.append((s, pos, f))
    return out


def resolve_anchor(step: str, octave: int, finger: int, midi: int) -> Optional[Resolved]:
    """第1段: 運指が書かれた音を解決する。"""
    if finger == 0:                              # 開放弦
        for s, open_midi in _OPEN_MIDI.items():
            if midi == open_midi:
                return {"string_id": s, "position": None, "finger": 0,
                        "confidence": "high", "is_anchor": True}
        return None
    cands = _candidates_for_finger(step, octave, finger, midi)
    if not cands:
        return None
    # A: 1stポジションで鳴らせるなら1stで確定 (同点は高音弦を優先=慣用)
    firsts = [c for c in cands if c[1] == 1]
    if firsts:
        s, p = min(firsts, key=lambda c: -_STRING_ORDER.index(c[0]))
        return {"string_id": s, "position": 1, "finger": finger,
                "confidence": "high", "is_anchor": True}
    # B: 最も低いポジション ・ 同点は高音弦
    s, p = min(cands, key=lambda c: (c[1], -_STRING_ORDER.index(c[0])))
    return {"string_id": s, "position": p, "finger": finger,
            "confidence": "high" if len(cands) == 1 else "low", "is_anchor": True}


def _pick_between(step: str, octave: int, midi: int,
                  prev: Optional[Resolved], nxt: Optional[Resolved]) -> Optional[Resolved]:
    """第2段: 運指のない音を、前後の文脈から選ぶ。

    優先順 (2026-08-24 折衷案 + アンカー志向):
      1. 直前と同じポジション (同弦 → 隣弦の順)
      2. シフト (移動量が小さい順)。次のアンカーに近づく向きを優先。
    """
    cands = _candidates_any_finger(step, octave, midi)
    if not cands:
        return None
    prev_s = prev.get("string_id") if prev else None
    prev_p = prev.get("position") if prev else None
    next_p = nxt.get("position") if nxt else None

    def rank(c: tuple[str, int, int]) -> tuple:
        s, p, f = c
        if prev_p is None or prev_s is None:
            return (0, 0, 0, 0, p, -_STRING_ORDER.index(s))   # 文脈なし: 低ポジ優先
        # ① 同じ弦・同じポジションで届くなら手を動かさない (最優先)
        keep = 0 if (s == prev_s and p == prev_p) else 1
        # ② それ以外: アンカーが張る回廊 (次のアンカーと直前の低い方が下限) の中で、
        #    最も低いポジションを選ぶ。これで上行は自然に弦をまたぎ、
        #    下行は同じ弦に留まってシフトする (2026-08-25 実データで検証)。
        floor = min(prev_p, next_p) if next_p is not None else 1
        in_corridor = 0 if p >= floor else 1
        same_str = 0 if s == prev_s else 1
        toward = 0
        if next_p is not None:
            toward = 0 if abs(p - next_p) <= abs(prev_p - next_p) else 1
        return (keep, in_corridor, p, same_str, toward, -_STRING_ORDER.index(s))

    s, p, f = min(cands, key=rank)
    return {"string_id": s, "position": p, "finger": f,
            "confidence": "low", "is_anchor": False}


def _fallback_no_anchor(step: str, octave: int, midi: int,
                        prev: Optional[Resolved]) -> Optional[Resolved]:
    """④ アンカーが1つも無い譜面: 1stで押さえられるならそこ、無理なら推定。"""
    if FIRST_POSITION_MIDI_MIN <= midi <= FIRST_POSITION_MIDI_MAX:
        s, f = VIOLIN_FIRST_POSITION_MAP[midi]
        return {"string_id": s, "position": None if f == 0 else 1, "finger": f,
                "confidence": "estimated", "is_anchor": False}
    return _pick_between(step, octave, midi, prev, None)


def resolve_sequence(notes: list[dict[str, Any]]) -> list[Optional[Resolved]]:
    """譜面1パート分の音列を解決する。

    notes: [{"midi": int, "step": "A", "octave": 4, "finger": Optional[int]}, ...]
           finger は楽譜に書かれた運指 (無ければ None)。
    返り値: 各音の Resolved (解決できない音は None)。
    """
    n = len(notes)
    out: list[Optional[Resolved]] = [None] * n

    # ── 第1段: アンカーを立てる ──
    anchor_idx: list[int] = []
    for i, nt in enumerate(notes):
        f = nt.get("finger")
        if f is None:
            continue
        r = resolve_anchor(nt["step"], nt["octave"], int(f), nt["midi"])
        if r is not None:
            out[i] = r
            anchor_idx.append(i)

    # ── 第2段: 間を埋める ──
    if not anchor_idx:
        prev: Optional[Resolved] = None
        for i, nt in enumerate(notes):
            r = _fallback_no_anchor(nt["step"], nt["octave"], nt["midi"], prev)
            out[i] = r
            if r is not None:
                prev = r
        logger.info("position pass: no anchors (%d notes)", n)
        return out

    for i, nt in enumerate(notes):
        if out[i] is not None:
            continue
        prev = next((out[k] for k in range(i - 1, -1, -1) if out[k] is not None), None)
        nxt = next((out[k] for k in range(i + 1, n) if out[k] is not None and out[k]["is_anchor"]), None)
        out[i] = _pick_between(nt["step"], nt["octave"], nt["midi"], prev, nxt)

    logger.info("position pass: %d notes / %d anchors", n, len(anchor_idx))
    return out
