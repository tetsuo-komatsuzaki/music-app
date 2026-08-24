"""position_pass のテスト (2026-08-25 アンカー方式)。"""
from lib.position_pass import resolve_anchor, resolve_sequence

# 音名 → (step, octave, midi)
def N(step: str, octave: int, midi: int, finger=None):
    return {"step": step, "octave": octave, "midi": midi, "finger": finger}


class TestAnchor:
    def test_1st_position_wins_when_playable(self):
        """① 楽譜の運指が1stで鳴らせるなら1stで確定 (2026-08-25 確定)。"""
        # B4 (midi 71) に指1 → A線1stポジ
        r = resolve_anchor("B", 4, 1, 71)
        assert r["position"] == 1 and r["string_id"] == "A" and r["is_anchor"]

    def test_lowest_position_when_not_1st(self):
        """② 1stで鳴らせないときは最も低いポジションを採用。"""
        # D6 (midi 86) に指1 → E線では1指=レ が5ポジ相当 (1stでは届かない)
        r = resolve_anchor("D", 6, 1, 86)
        assert r["position"] is not None and r["position"] > 1
        # より低い候補があればそれが選ばれている
        assert r["string_id"] in ("E", "A")

    def test_open_string(self):
        r = resolve_anchor("A", 4, 0, 69)
        assert r["string_id"] == "A" and r["position"] is None and r["finger"] == 0

    def test_impossible_returns_none(self):
        assert resolve_anchor("C", 2, 1, 36) is None   # G線より低い音


class TestSequence:
    def test_no_anchor_uses_first_position_then_estimate(self):
        """④ アンカーが無ければ1stで押さえられる音は1st、無理なら推定。"""
        notes = [N("A", 4, 69), N("B", 4, 71), N("D", 6, 86)]
        out = resolve_sequence(notes)
        assert out[0]["position"] is None           # A4 = A線開放
        assert out[1]["position"] == 1              # 1stで押さえられる
        assert out[2]["position"] > 1               # 1stでは無理 → 推定

    def test_anchor_is_respected(self):
        """③ アンカーは動かさない (補間はアンカーに合わせる)。"""
        notes = [
            N("A", 6, 93, finger=4),   # 高いアンカー
            N("G", 6, 92),             # 運指なし (補間対象)
            N("F", 6, 90),             # 運指なし
            N("B", 4, 71, finger=1),   # 1stポジのアンカー
        ]
        out = resolve_sequence(notes)
        assert out[0]["is_anchor"] and out[3]["is_anchor"]
        assert out[3]["position"] == 1                       # 1st確定
        assert all(o is not None for o in out)

    def test_position_is_kept_when_possible(self):
        """同じポジションで弾けるならポジションを動かさない。"""
        notes = [
            N("E", 6, 88, finger=1),   # アンカー (高ポジ)
            N("F", 6, 90),             # 同じポジションで届く → 維持されるはず
        ]
        out = resolve_sequence(notes)
        assert out[1]["position"] == out[0]["position"]

    def test_descending_scale_stays_on_string(self):
        """下行音階: 弦をまたがずシフトで降りる (2026-08-24 折衷案の維持)。"""
        seq = [("A", 6, 93), ("G", 6, 92), ("F", 6, 90), ("E", 6, 88), ("D", 6, 86), ("C", 6, 85)]
        notes = [N(s, o, m) for s, o, m in seq]
        out = resolve_sequence(notes)
        strings = [o["string_id"] for o in out]
        assert strings.count("E") >= 5, f"E線に留まるはず: {strings}"
