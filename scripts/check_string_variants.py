"""弦ちがいの教材が、元の弦の版と本当に対応しているかを機械で確かめる (2026-09-13)。

生成AIに他の弦の版を作らせたとき、出来を人の目とAIの自己申告だけに任せない。
同じ系統の版を並べ、基準の弦の版と1音ずつ突き合わせる。

  1. 音符と休符の数・並び・音価・拍子・小節数
  2. すべての音が 元の MIDI + 7 × 弦の距離
  3. すべての音名の文字が 元から 4 × 弦の距離 ぶんずれている (異名同音のすり替えを見つける)
  4. 運指が1音ずつ元と同じ ・ 空の <fingering> が無い
  5. <string> が目標弦ひとつだけ ・ 休符に付いていない
  6. 調号 fifths が 元 + 弦の距離
  7. 開放弦より低い音が無い ・ 開放弦と同じ高さの音は指番号0だけ
  8. ポジションが 1〜14 に収まり、元と1音ずつ同じ
  9. 平文XML ・ UTF-8 ・ BOM なし ・ 既定名前空間なし

ポジションの数え方は解析器 (music-analyzer/lib/violin_position.py) と同じ音名の文字数。
半音ではないので、♯♭はポジションを変えない。

位置は「第N小節の M 拍目」で報告する。MuseScore で開いてそのまま探せるようにするため。

使い方:
  python scripts/check_string_variants.py <フォルダ> --base G
  python scripts/check_string_variants.py <フォルダ> --base G --json out.json

  生成物を検収するときは、**元の版と生成物を同じフォルダに並べてから**走らせる。
  別フォルダに置いたまま走らせると突き合わせる相手がいない。
  --base には「元になった弦」を必ず指定する。

終了コード: 合否に効く指摘 (NG / FATAL) が1件でもあれば 1、無ければ 0。
「欠け」「基準なし」「loose」は参考情報として数え、終了コードには影響しない。
"""
from __future__ import annotations

import argparse
import codecs
import glob
import json
import os
import re
import sys
import xml.etree.ElementTree as ET
from collections import defaultdict

# MusicXML の弦番号 1=E 2=A 3=D 4=G
STRING_NUM_BY_LETTER = {"E": "1", "A": "2", "D": "3", "G": "4"}
LETTER_BY_STRING_NUM = {v: k for k, v in STRING_NUM_BY_LETTER.items()}
# 低い順に並べたときの位置。となり合う弦は完全5度 = 7半音 = 音名4文字ぶん
STRING_INDEX = {"G": 0, "D": 1, "A": 2, "E": 3}
OPEN_MIDI = {"G": 55, "D": 62, "A": 69, "E": 76}
OPEN_DIATONIC = {"G": 3 * 7 + 4, "D": 4 * 7 + 1, "A": 4 * 7 + 5, "E": 5 * 7 + 2}
LETTER_INDEX = {"C": 0, "D": 1, "E": 2, "F": 3, "G": 4, "A": 5, "B": 6}
SEMITONE = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
MAX_POSITION = 14
ACCIDENTAL_BY_ALTER = {2: "double-sharp", 1: "sharp", 0: "natural", -1: "flat", -2: "flat-flat"}
STRING_TOKEN = re.compile(r"^([GDAE])線$")


class Note:
    """1つの <note>。休符も含む。"""

    __slots__ = ("midi", "step", "octave", "alter", "finger", "finger_raw", "string", "is_rest",
                 "duration", "note_type", "measure", "beat", "empty_fingering", "is_grace",
                 "is_chord", "accidental", "dots", "tie", "slur", "tuplet", "finger_count",
                 "rest_has_technical", "string_count", "acc_cautionary", "acc_parentheses", "tied",
                 "paired")

    def __init__(self, **kw):
        for k in self.__slots__:
            setattr(self, k, kw.get(k))

    @property
    def diatonic(self):
        if self.step is None:
            return None
        return self.octave * 7 + LETTER_INDEX[self.step]

    @property
    def where(self):
        """MuseScore で探せる位置。第N小節 M拍目"""
        beat = "?" if self.beat is None else f"{self.beat:g}"
        return f"第{self.measure}小節{beat}拍目"

    def position(self):
        """音名の文字数で数えるポジション。解析器の position_by_letter / derive_position と同じ規則。"""
        if self.diatonic is None or self.finger is None or self.string is None:
            return None
        string_letter = LETTER_BY_STRING_NUM.get(self.string)
        if string_letter is None or self.finger < 1:
            return None
        # 解析器の derive_position と同じ物理ガード: 開放弦以下の高さはその弦では鳴らない
        if self.midi is not None and self.midi <= OPEN_MIDI[string_letter]:
            return None
        pos = (self.diatonic - (self.finger - 1)) - OPEN_DIATONIC[string_letter]
        if pos == 0 and self.finger == 1:
            return 1  # ハーフポジションは1st扱い
        if pos < 1 or pos > MAX_POSITION:
            return None
        return pos


def _int(text, default=0):
    """MusicXML の数値。小数や空文字でも落ちない。"""
    try:
        return int(float(str(text).strip()))
    except (TypeError, ValueError):
        return default


# 「元の版が同じ傷を持っていれば不合格にしない」の**例外ではなく、免除してよい側**を列挙する。
# 逆向き (直す義務のあるものを列挙) にすると、数え漏らした条件が全部すり抜ける。
# 免除してよいのは、指示書 §6 が「元のまま写す」と決めているものだけ。
# 元の版が §5 の中止条件に当たる傷を持っていれば、それを引き継いだ出力も不合格にする
# (§5 は「1つでも当たったら MusicXML を出さない」と決めているので、出た時点で誤り)。
INHERITABLE = (
    "ファイルの形式: DOCTYPE 宣言が無い",
    "調号と合わない高さなのに臨時記号が書かれていない",
)

# 元の版の側に出たとき、合否に効かせるもの = 指示書 §5 の「入力そのものの不備」(§5-1〜16)。
# これらは「その元の版から出力を作ってはいけない」条件なので、出てきた時点で誤り。
# 元の版にしか痕跡が残らない傷 (元の fifths が範囲外・<transpose> がある) もここで止まる。
# 逆に、全角の運指や BOM のように「元の版にあってよく、出力で直すもの」は含めない。
BASE_BLOCKING = (
    "<part> が",
    "<staves> が",
    "<staff> が",
    "<backup> がある",
    "<voice> が",
    "<chord> がある",
    "<transpose> が",
    "<key><fifths> が無い",
    "曲の途中で調号が変わる",
    "<string> が ",
    "1つの音符に <string> が2種類以上",
    "運指が書かれていない",
    "運指が 0〜4 の外",
    "指番号0なのに",
    "1つの音符に中身のある <fingering> が2つ以上",
    "休符に <technical> が付いている",
    "弦と運指が別の <technical>",
    "開放弦(",
    "開放弦と同じ高さなのに",
    "ポジションが 1〜",
    "調号 fifths=",
    "音符が1つも無い",
    "ファイルを読めない",
)


def read_score(path):
    """譜面を読む。音符の並び・調号・拍子・小節数・素のバイト所見を返す。"""
    with open(path, "rb") as fh:
        raw = fh.read()
    file_notes = []
    if raw.startswith(b"\xef\xbb\xbf"):
        file_notes.append("BOM が付いている")
    head = raw[:2000].decode("utf-8", errors="replace")
    if "<score-partwise" in head and "xmlns=" in head.split("<score-partwise", 1)[1][:300]:
        file_notes.append("<score-partwise> に既定名前空間 xmlns が付いている (弦・運指が読まれなくなる)")
    if "<!DOCTYPE" not in head:
        file_notes.append("DOCTYPE 宣言が無い")

    if raw[:2] == b"PK":
        # ET.parse に渡すと「not well-formed」という原因の分からない例外になるので、
        # ここで理由の分かる形にして投げる
        raise ValueError("圧縮された MusicXML (.mxl) を .musicxml として置いている。平文XMLで書き出すこと")
    root = ET.parse(path).getroot()
    notes = []
    divisions = 1
    beats = None
    beat_type = None
    measures = 0
    repeats = []   # 繰り返し・番号かっこの並び
    times = []     # 拍子の並び (途中の変更も拾う)
    tempos = []    # テンポ指定の並び
    for measure in root.iter("measure"):
        measures += 1
        number = measure.get("number")
        for bl in measure.findall("barline"):
            rp = bl.find("repeat")
            en = bl.find("ending")
            if rp is not None:
                repeats.append(f"{number}:repeat:{bl.get('location') or 'right'}:{rp.get('direction')}:{rp.get('times') or ''}")
            if en is not None:
                repeats.append(f"{number}:ending:{en.get('number')}:{en.get('type')}")
        for sd in measure.iter("sound"):
            if sd.get("tempo"):
                tempos.append(f"{number}:sound:{sd.get('tempo')}")
        for mm in measure.iter("metronome"):
            tempos.append(f"{number}:metronome:{mm.findtext('beat-unit')}:{mm.findtext('per-minute')}")
        cursor = 0  # divisions 単位の経過
        for el in measure:
            if el.tag == "attributes":
                d = el.find("divisions")
                if d is not None and d.text:
                    divisions = _int(d.text, divisions) or divisions
                t = el.find("time")
                if t is not None:
                    times.append(f"{number}:{t.findtext('beats')}/{t.findtext('beat-type')}")
                    if beats is None:
                        beats = t.findtext("beats")
                        beat_type = t.findtext("beat-type")
                continue
            if el.tag == "backup":
                cursor -= _int(el.findtext("duration"))
                continue
            if el.tag == "forward":
                cursor += _int(el.findtext("duration"))
                continue
            if el.tag != "note":
                continue
            is_grace = el.find("grace") is not None
            dur = _int(el.findtext("duration"))
            technicals = el.findall("notations/technical")  # 1つの note に <notations> が複数あり得る
            technical = technicals[0] if technicals else None
            finger = None
            finger_raw = None
            empty_fingering = False
            for tech in technicals:
                for fe in tech.findall("fingering"):
                    if fe.text is None or not fe.text.strip():
                        empty_fingering = True
                        continue
                    if finger is None:
                        finger_raw = fe.text.strip()
                        try:
                            # int() は全角数字も読むので、表記の検査は finger_raw で別に行う
                            finger = int(finger_raw)
                        except ValueError:
                            pass
            finger_count = len([fe for tech in technicals for fe in tech.findall("fingering")
                                if fe.text and fe.text.strip()])
            # 解析器は最初の <technical> しか読まない。弦と運指が別の <notations> に分かれていると
            # 「両方そろっている」と見なされず、推定に落ちる。
            first = technicals[0] if technicals else None
            paired = bool(first is not None
                          and first.find("string") is not None
                          and any(fe.text and fe.text.strip() for fe in first.findall("fingering")))
            string_vals = [se.text.strip() for tech in technicals for se in tech.findall("string")
                           if se.text and se.text.strip()]
            string = string_vals[0] if string_vals else None
            string_count = len(set(string_vals))
            pitch = el.find("pitch")
            beat = cursor / divisions + 1 if divisions else None
            notations_all = el.findall("notations")  # 1つの note に <notations> は複数あり得る
            common = dict(
                dots=len(el.findall("dot")),
                tie="".join(sorted(t.get("type") or "" for t in el.findall("tie"))),
                slur="".join(sorted(f"{sl.get('type') or ''}{sl.get('number') or ''}"
                                    for nt in notations_all for sl in nt.findall("slur"))),
                tied="".join(sorted((td.get("type") or "") for nt in notations_all
                                    for td in nt.findall("tied"))),
                tuplet=(lambda tm: f"{tm.findtext('actual-notes')}/{tm.findtext('normal-notes')}"
                        if tm is not None else "")(el.find("time-modification")),
                finger_count=finger_count,
                rest_has_technical=(el.find("rest") is not None and technical is not None),
                finger=finger, finger_raw=finger_raw, string=string, duration=dur,
                          note_type=el.findtext("type"), measure=number, beat=beat,
                          empty_fingering=empty_fingering, is_grace=is_grace,
                          is_chord=el.find("chord") is not None,
                          string_count=string_count, paired=paired,
                          accidental=el.findtext("accidental"),
                          acc_cautionary=(el.find("accidental").get("cautionary") if el.find("accidental") is not None else None),
                          acc_parentheses=(el.find("accidental").get("parentheses") if el.find("accidental") is not None else None))
            step = pitch.findtext("step") if pitch is not None else None
            if pitch is None or step not in SEMITONE or not (pitch.findtext("octave") or "").strip().lstrip("-").isdigit():
                # 休符・<unpitched>・読めない音程は「音の無い音符」として並びだけ数える
                notes.append(Note(midi=None, step=None, octave=None, alter=None,
                                  is_rest=True, **common))
            else:
                octave = _int(pitch.findtext("octave"))
                alter = _int(pitch.findtext("alter"))
                notes.append(Note(midi=(octave + 1) * 12 + SEMITONE[step] + alter,
                                  step=step, octave=octave, alter=alter,
                                  is_rest=False, **common))
            # 和音の2音目以降は時間を進めない
            if el.find("chord") is None and not is_grace:
                cursor += dur

    # §7 が「変えない・足さない」と定めた要素。数が変われば何かを足したか消したかしている。
    WATCH_TAGS = ("beam", "dynamics", "words", "octave-shift", "glissando", "slide",
                  "staff-details", "wedge", "metronome", "tuplet", "grace", "chord",
                  "articulations", "ornaments", "technical", "notations", "tie", "tied", "slur")
    tag_counts = {t: len(list(root.iter(t))) for t in WATCH_TAGS}
    # §7-1 で消すと決めているもの。音の高さが変わると紙の上の位置と符尾の向きが変わるので、
    # 元の版から写すと数字が音符から離れ、符尾が全音で逆になる。
    layout_left = {
        "default-x / default-y": sum(
            1 for t in ("note", "fingering", "string", "accidental")
            for el in root.iter(t) if el.get("default-x") or el.get("default-y")),
        "<measure> の width": sum(1 for m in root.iter("measure") if m.get("width")),
        # <defaults> の中の <system-layout> は譜面全体の既定で、音の高さに連動しない。
        # §7-1 が消せと言っているのは <print> の中のものだけ。
        "<print> の中の <system-layout>": sum(
            len(pr.findall("system-layout")) for pr in root.iter("print")),
        "<stem>": len(list(root.iter("stem"))),
        "スラー・タイの制御点": sum(
            1 for t in ("slur", "tied") for el in root.iter(t)
            if any(el.get(k) for k in ("default-x", "default-y", "bezier-x", "bezier-y"))),
    }
    clefs = [f"{c.findtext('sign')}{c.findtext('line') or ''}" for c in root.iter("clef")]
    divisions_list = [x.text for x in root.iter("divisions") if x.text]
    # BOM を剥いでから見る。bytes.lstrip() は ASCII 空白しか落とさないので、
    # BOM 付きファイルを「宣言が無い」と誤って報告してしまう。
    has_xml_decl = raw.lstrip(codecs.BOM_UTF8).lstrip()[:5] == b"<?xml"
    instrument = (root.findtext(".//score-instrument/instrument-name") or "").strip()
    tr = root.find(".//attributes/transpose")
    transpose = (_int(tr.findtext("chromatic")), _int(tr.findtext("diatonic"))) if tr is not None else (0, 0)
    has_backup = root.find(".//backup") is not None
    staff_kinds = {x.text for x in root.iter("staff") if x.text}
    fifths_els = root.findall(".//key/fifths")
    fifths = _int(fifths_els[0].text, None) if fifths_els and fifths_els[0].text else None
    modes = [m.text for m in root.findall(".//key/mode") if m.text]
    return {
        "notes": notes,
        "fifths": fifths,
        "all_fifths": [_int(x.text) for x in fifths_els if x.text],
        "modes": modes,
        "instrument": instrument,
        "transpose": transpose,
        "tag_counts": tag_counts,
        "layout_left": layout_left,
        "clefs": clefs,
        "divisions_list": divisions_list,
        "has_xml_decl": has_xml_decl,
        "has_backup": has_backup,
        "staff_kinds": staff_kinds,
        "beats": beats,
        "beat_type": beat_type,
        "repeats": repeats,
        "times": times,
        "tempos": tempos,
        "measures": measures,
        "file_notes": file_notes,
        "has_chord": root.find(".//chord") is not None,
        "parts": len(root.findall(".//part")),
        "voices": {v.text for v in root.iter("voice") if v.text},
        "staves": root.findtext(".//attributes/staves"),
    }


def string_letter_of_name(stem):
    """ファイル名の `_` 区切りトークンのうち、弦名に完全一致するものを1つだけ採る。"""
    hits = [m.group(1) for m in (STRING_TOKEN.match(t) for t in stem.split("_")) if m]
    return hits[0] if len(hits) == 1 else None


def family_key(stem, letter):
    """弦トークンだけを伏せた系統キー。部分一致で置換しない。"""
    return "_".join("{弦}" if STRING_TOKEN.match(t) else t for t in stem.split("_"))


def self_check(score, stem, letter, is_target=False):
    """その版が、その弦で単独に成立しているか。"""
    problems = list(f"ファイルの形式: {x}" for x in score["file_notes"])
    if is_target:
        left = {k: v for k, v in score["layout_left"].items() if v}
        if left:
            detail = "・".join(f"{k} {v}個" for k, v in left.items())
            problems.append(f"§7-1 で消すと決めているものが残っている: {detail}")
    want = STRING_NUM_BY_LETTER[letter]
    notes = score["notes"]
    pitched = [x for x in notes if not x.is_rest]
    if not pitched:
        return problems + ["音符が1つも無い"]
    if score["parts"] > 1:
        problems.append(f"<part> が {score['parts']} つある")
    if score["staves"] and score["staves"] != "1":
        problems.append(f"<staves> が {score['staves']}")
    if len(score["voices"]) > 1:
        problems.append(f"<voice> が {sorted(score['voices'])} と複数ある")
    if score["has_chord"]:
        problems.append("<chord> がある (重音は1本の弦で弾けない)")
    if score["has_backup"]:
        problems.append("<backup> がある (重音や2声部を別の声部で書いた譜面)")
    if len(score["staff_kinds"]) > 1:
        problems.append(f"<staff> が {sorted(score['staff_kinds'])} と複数ある")
    if score["transpose"] != (0, 0):
        problems.append(f"<transpose> が {score['transpose']} ・移調楽器の譜面は <pitch> が実音でない")
    split_tech = [x for x in pitched if x.string and x.finger is not None and not x.paired]
    if split_tech:
        problems.append(
            f"弦と運指が別の <technical> に分かれている {len(split_tech)}音 ({split_tech[0].where}) ・"
            "解析器は最初の1つしか読まないので、両方そろっていると見なされない")
    multi_string = [x for x in pitched if (x.string_count or 0) > 1]
    if multi_string:
        problems.append(f"1つの音符に <string> が2種類以上 {len(multi_string)}音 ({multi_string[0].where})")
    if score["fifths"] is None:
        problems.append("<key><fifths> が無い (登録時に調が読めず飛ばされる)")
    else:
        lo, hi = allowed_fifths_range(score["modes"])
        if not (lo <= score["fifths"] <= hi):
            kind = "短調" if (score["modes"] or [""])[0] == "minor" else "長調"
            problems.append(
                f"調号 fifths={score['fifths']} が {kind} で使える範囲 {lo}〜{hi} の外 ・"
                "登録される調名が異名同音に寄り、譜面と食い違う")
    if len(set(score["all_fifths"])) > 1:
        problems.append(f"曲の途中で調号が変わる: {score['all_fifths']}")

    strings = {x.string for x in pitched}
    if strings != {want}:
        shown = sorted((s or "無し") for s in strings)
        odd = [x for x in pitched if x.string != want]
        problems.append(f"<string> が {shown} ・ファイル名は {letter}線 ・該当 {len(odd)}音 ({odd[0].where} ほか)")
    rest_str = [x for x in notes if x.is_rest and x.string]
    if rest_str:
        problems.append(f"休符または音程を読めない音符に <string> が付いている {len(rest_str)}個 ({rest_str[0].where})")
    empt = [x for x in notes if x.empty_fingering]
    if empt:
        problems.append(f"空の <fingering></fingering> がある {len(empt)}音 ({empt[0].where}) ・読み取り経路によって解釈が割れる")
    zenkaku = [x for x in pitched if x.finger_raw and any(c not in "01234" for c in x.finger_raw)]
    if zenkaku:
        problems.append(f"運指が半角数字0〜4でない {len(zenkaku)}音 ({zenkaku[0].where} 値='{zenkaku[0].finger_raw}')")
    no_finger = [x for x in pitched if x.finger is None]
    if no_finger:
        problems.append(f"運指が書かれていない {len(no_finger)}音 ({no_finger[0].where} ほか)")
    open_midi = OPEN_MIDI[letter]
    below = [x for x in pitched if x.midi is not None and x.midi < open_midi]
    if below:
        problems.append(f"開放弦({open_midi})より低い音 {len(below)}音 ({below[0].where} ほか) ・その弦では鳴らない")
    same_as_open = [x for x in pitched if x.midi == open_midi and x.finger not in (0, None)]
    if same_as_open:
        problems.append(f"開放弦と同じ高さなのに指番号が1以上の音 {len(same_as_open)}音 ({same_as_open[0].where} ほか) ・その弦の候補が捨てられる")
    open_finger_wrong = [x for x in pitched if x.finger == 0 and x.midi != open_midi]
    if open_finger_wrong:
        problems.append(f"指番号0なのに開放弦の高さでない音 {len(open_finger_wrong)}音 ({open_finger_wrong[0].where}) ・ポジションが失われる")
    bad_value = [x for x in pitched if x.finger is not None and not (0 <= x.finger <= 4)]
    if bad_value:
        problems.append(f"運指が 0〜4 の外 {len(bad_value)}音 ({bad_value[0].where} 値={bad_value[0].finger})")
    multi_finger = [x for x in pitched if x.finger_count > 1]
    if multi_finger:
        problems.append(f"1つの音符に中身のある <fingering> が2つ以上 {len(multi_finger)}音 ({multi_finger[0].where})")
    rest_tech = [x for x in notes if x.rest_has_technical]
    if rest_tech:
        problems.append(f"休符に <technical> が付いている {len(rest_tech)}音 ({rest_tech[0].where})")
    big_alter = [x for x in pitched if x.alter is not None and abs(x.alter) > 2]
    if big_alter:
        problems.append(f"alter が ±2 の外 {len(big_alter)}音 ({big_alter[0].where} alter={big_alter[0].alter})")
    problems.extend(_accidental_conflicts(score, notes))
    # 採点のピッチ検出の上限。楽器名が英語の violin でないと既定の G3〜E6 (MIDI 88) に落ち、
    # それを超える音は「検出できない」ではなく別の高さとして採点され続ける。
    ceiling = 100 if score["instrument"].lower() == "violin" else 88
    too_high = [x for x in pitched if x.midi is not None and x.midi > ceiling]
    if too_high:
        hint = (" ・楽器名を `Violin` にすれば上限は100になる" if ceiling == 88
                else " ・これ以上は上げられない。この弦の版は作れない")
        top = max(too_high, key=lambda x: x.midi)
        problems.append(
            f"採点できる高さの上限({ceiling})を超える音 {len(too_high)}音 (いちばん高いのは {top.where} MIDI{top.midi}) ・"
            f"楽器名='{score['instrument'] or '無し'}'{hint}")
    # 弦が無い・開放弦以下は別の行で報告済みなので、ここでは「弦も指も読めているのに範囲外」だけを見る
    out_of_range = [x for x in pitched
                    if x.string == want and x.finger is not None and 1 <= x.finger <= 4
                    and x.midi is not None and x.midi > open_midi and x.position() is None]
    if out_of_range:
        problems.append(f"ポジションが 1〜{MAX_POSITION} に収まらない {len(out_of_range)}音 ({out_of_range[0].where} ほか)")
    return problems


# 調号がその文字に与える♯♭ (fifths の順に並ぶ)
_SHARP_ORDER = ["F", "C", "G", "D", "A", "E", "B"]
_FLAT_ORDER = list(reversed(_SHARP_ORDER))


def allowed_fifths_range(modes):
    """登録側が正しい調名を出せる fifths の範囲。
    app/_libs/musicxmlKey.ts の表の都合で、長調は −7 が C♭ でなく B に、
    短調は +5/+6/+7 が G♯m/D♯m/A♯m でなく A♭/E♭/B♭ に寄る。"""
    return (-7, 4) if (modes or [""])[0] == "minor" else (-6, 7)


def _key_alter_map(fifths):
    """調号だけで決まる、文字ごとの alter。"""
    m = {k: 0 for k in LETTER_INDEX}
    if fifths is None:
        return m
    if fifths > 0:
        for letter in _SHARP_ORDER[:min(fifths, 7)]:
            m[letter] = 1
    else:
        for letter in _FLAT_ORDER[:min(-fifths, 7)]:
            m[letter] = -1
    return m


def _accidental_conflicts(score, notes):
    """調号どおりでない高さなのに <accidental> が無い音を探す。
    同じ小節の中で先に出た変化は引き継がれるので、その分は差し引く。"""
    base_map = _key_alter_map(score["fifths"])
    problems = []
    missing = []
    current_measure = None
    carried = {}
    for note in notes:
        if note.measure != current_measure:
            current_measure = note.measure
            carried = {}
        if note.is_rest or note.step is None:
            continue
        key = (note.step, note.octave)
        expected = carried.get(key, base_map.get(note.step, 0))
        tie_stop = "stop" in (note.tie or "") or "stop" in (note.tied or "")
        if note.alter != expected and note.accidental is None and not tie_stop:
            # 小節線をまたぐタイの後半は、臨時記号を書かないのが正しい記譜
            missing.append(note)
        if note.accidental is not None:
            carried[key] = note.alter
        elif note.alter != base_map.get(note.step, 0):
            carried[key] = note.alter
    if missing:
        problems.append(
            f"調号と合わない高さなのに臨時記号が書かれていない {len(missing)}音 ({missing[0].where}) ・読み手によって違う音に描かれる")
    return problems


def compare(base, base_stem, base_letter, target, target_stem, target_letter):
    """基準の版と1音ずつ突き合わせる。"""
    problems = []
    n = STRING_INDEX[target_letter] - STRING_INDEX[base_letter]
    b_notes, t_notes = base["notes"], target["notes"]

    if base["measures"] != target["measures"]:
        problems.append(f"小節の数 {base['measures']} -> {target['measures']}")
    if base["times"] != target["times"]:
        problems.append(f"拍子の並び {base['times'] or '無し'} -> {target['times'] or '無し'}")
    if base["repeats"] != target["repeats"]:
        only_base = [x for x in base["repeats"] if x not in target["repeats"]]
        only_target = [x for x in target["repeats"] if x not in base["repeats"]]
        problems.append(
            f"繰り返し・番号かっこが元と違う ・元だけ={only_base[:3] or '無し'} 今だけ={only_target[:3] or '無し'} ・"
            "繰り返しが落ちると曲の長さと音符の採番が丸ごと変わる")
    if base["tempos"] != target["tempos"]:
        problems.append(f"テンポ指定 {base['tempos'] or '無し'} -> {target['tempos'] or '無し'} ・同じ組の中で原速がばらつく")
    # 調号と mode は音符の対応づけに依存しないので、音符数が違っても必ず見る
    if len(base["all_fifths"]) != len(target["all_fifths"]):
        problems.append(f"<key> の数 {len(base['all_fifths'])} -> {len(target['all_fifths'])} ・途中の転調が落ちている")
    for i, (bf, tf) in enumerate(zip(base["all_fifths"], target["all_fifths"]), start=1):
        if tf != bf + n:
            where = "調号" if i == 1 else f"{i}つ目の <key>"
            lo, hi = allowed_fifths_range(base["modes"])
            extra = ("" if lo <= bf + n <= hi else
                     f" ・期待値 {bf + n} は登録側が正しい調名を出せる範囲 {lo}〜{hi} の外なので、元の版の調を選び直す必要がある")
            problems.append(f"{where} {bf} -> {tf} (期待 {bf + n}){extra}")
    if base["modes"] != target["modes"]:
        problems.append(f"<mode> {base['modes'] or '無し'} -> {target['modes'] or '無し'} ・調性が変わると登録される調名が変わる")
    # (2) メタデータのうち、採点の音域を決める楽器名は勝手に変えさせない (§7)
    if base["instrument"] != target["instrument"]:
        problems.append(
            f"<instrument-name> {base['instrument'] or '無し'} -> {target['instrument'] or '無し'} ・"
            "§7 で変更を禁じている。書き換えると採点の音域の上限が変わり、元の版と食い違う")

    # §7「あるものは変えない・無いものは足さない」の機械判定
    for tag, bc in base["tag_counts"].items():
        tc = target["tag_counts"][tag]
        if bc != tc:
            problems.append(f"<{tag}> の数 {bc} -> {tc} ・§7 で変えない・足さないと決めている要素")
    if base["clefs"] != target["clefs"]:
        problems.append(f"音部記号 {base['clefs']} -> {target['clefs']}")
    if base["divisions_list"] != target["divisions_list"]:
        problems.append(
            f"<divisions> {base['divisions_list']} -> {target['divisions_list']} ・"
            "音価の分母が変わると、<duration> が同じでも実際の長さが変わる")
    if base["has_xml_decl"] != target["has_xml_decl"]:
        problems.append(f"1行目の XML 宣言 {'あり' if base['has_xml_decl'] else '無し'} -> "
                        f"{'あり' if target['has_xml_decl'] else '無し'} ・§6 で元のまま写すと決めている")

    if not b_notes or not t_notes:
        problems.append(
            f"照合できる音符が無い (元 {len(b_notes)}個 / 今 {len(t_notes)}個) ・"
            "名前空間 xmlns が付いていると小節ごと読めなくなる")
        return problems
    if len(b_notes) != len(t_notes):
        problems.append(f"音符と休符の数 {len(b_notes)} -> {len(t_notes)}")
        return problems  # 数が違えば1音ずつの照合は意味を持たない

    want = STRING_NUM_BY_LETTER[target_letter]
    # キーは (見出し, 左の値が何か)。「元」=元の版の値 / 「期待」=こうなっているべき値
    buckets = defaultdict(list)
    for b, t in zip(b_notes, t_notes):
        if b.is_rest != t.is_rest:
            buckets[("休符と音符が入れ替わっている", "元")].append((t.where, None, None))
            continue
        if b.duration != t.duration or b.note_type != t.note_type or b.dots != t.dots:
            buckets[("音価が元と違う", "元")].append((t.where, f"{b.note_type}/{b.duration}/点{b.dots}", f"{t.note_type}/{t.duration}/点{t.dots}"))
        if b.tie != t.tie:
            buckets[("タイ (<tie>) が元と違う", "元")].append((t.where, b.tie or "無し", t.tie or "無し"))
        if b.tied != t.tied:
            buckets[("タイの弧 (<tied>) が元と違う", "元")].append((t.where, b.tied or "無し", t.tied or "無し"))
        if b.slur != t.slur:
            buckets[("スラーが元と違う", "元")].append((t.where, b.slur or "無し", t.slur or "無し"))
        if b.tuplet != t.tuplet:
            buckets[("連符が元と違う", "元")].append((t.where, b.tuplet or "無し", t.tuplet or "無し"))
        if b.is_rest:
            continue
        if t.midi != b.midi + 7 * n:
            buckets[("音の高さが完全5度ぶんになっていない", "期待")].append((t.where, b.midi + 7 * n, t.midi))
        if b.diatonic is not None and t.diatonic != b.diatonic + 4 * n:
            want_di = b.diatonic + 4 * n
            want_name = f"{'CDEFGAB'[want_di % 7]}{want_di // 7}"
            buckets[("音名の文字がずれている ・異名同音に書き替えるとポジションが1ずれる", "期待")].append(
                (t.where, want_name, f"{t.step}{t.octave}"))
        if b.finger != t.finger:
            buckets[("運指が元と違う", "元")].append((t.where, b.finger, t.finger))
        if t.string != want:
            buckets[(f"<string> が目標弦({want})でない", "期待")].append((t.where, want, t.string))
        if b.position() != t.position():
            buckets[("ポジションが元と違う", "元")].append((t.where, b.position(), t.position()))
        if (b.accidental is None) != (t.accidental is None):
            buckets[("臨時記号の表示の有無が元と違う", "元")].append((t.where, b.accidental or "無し", t.accidental or "無し"))
        elif t.accidental is not None:
            want_acc = ACCIDENTAL_BY_ALTER.get(t.alter)
            if want_acc and t.accidental != want_acc:
                buckets[("臨時記号の種類が高さと合っていない", "期待")].append((t.where, want_acc, t.accidental))
            if (b.acc_cautionary, b.acc_parentheses) != (t.acc_cautionary, t.acc_parentheses):
                buckets[("臨時記号の cautionary / parentheses が元と違う", "元")].append(
                    (t.where, f"{b.acc_cautionary}/{b.acc_parentheses}", f"{t.acc_cautionary}/{t.acc_parentheses}"))
        if b.is_chord != t.is_chord:
            buckets[("和音の組み方が元と違う", "元")].append((t.where, b.is_chord, t.is_chord))
        if b.is_grace != t.is_grace:
            buckets[("装飾音の有無が元と違う", "元")].append((t.where, b.is_grace, t.is_grace))

    def show(v):
        return "無し" if v is None else v

    for (label, left_kind), rows in buckets.items():
        head = "・".join(f"{w}({left_kind}{show(a)}→今{show(c)})" for w, a, c in rows[:3])
        problems.append(f"{label} {len(rows)}音: {head}{' ほか' if len(rows) > 3 else ''}")
    return problems


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("directory", help="musicxml が置かれたフォルダ。生成物は元の版と同じフォルダに並べて走らせる")
    ap.add_argument("--base", required=True, choices=list("GDAE"), help="基準にする弦 (元になった版の弦)")
    ap.add_argument("--target", help="今回作った版の教材名 (拡張子なし)。渡すと、その1本が本当に突き合わせられたかを確かめる")
    ap.add_argument("--json", help="結果をJSONで書き出す先")
    args = ap.parse_args()

    def bail(message):
        print(f"FATAL {message}")
        if args.json:
            parent = os.path.dirname(os.path.abspath(args.json))
            os.makedirs(parent, exist_ok=True)
            with open(args.json, "w", encoding="utf-8") as fh:
                json.dump({"total": 1, "info": 0, "blocking": [f"FATAL {message}"],
                           "loose": [], "families": {}, "fatal": [message]},
                          fh, ensure_ascii=False, indent=2)
        return 1

    if not os.path.isdir(args.directory):
        return bail(f"指定されたフォルダが無い: {args.directory}")
    families = defaultdict(dict)
    loose = []
    xml_files = sorted(glob.glob(os.path.join(args.directory, "*.musicxml")))
    if not xml_files:
        return bail(f"フォルダに .musicxml が1本も無い: {args.directory}")
    for path in xml_files:
        stem = os.path.splitext(os.path.basename(path))[0]
        letter = string_letter_of_name(stem)
        if letter is None:
            loose.append(stem)
            continue
        families[family_key(stem, letter)][letter] = (path, stem)

    # --target を渡したときは、その版の指摘だけを合否に効くものとして数える。
    # 元の版が元から持っている傷まで数えると、忠実に写した正しい出力でも 0 にならない。
    target_stem = None
    if args.target:
        target_stem = args.target
        for ext in (".musicxml", ".xml", ".mxl"):
            if target_stem.lower().endswith(ext):
                target_stem = target_stem[: -len(ext)]
                break

    blocking: list[str] = []   # 合否に効く NG 行 (画面の最後にまとめて出す)
    total = 0   # 合否に効く指摘 (FATAL と、検収する版の NG) の数
    info = 0    # 参考情報 (欠け・基準なし・loose) の数
    fatal: list[str] = []
    compared: set[str] = set()
    report = {"loose": loose, "families": {}, "fatal": fatal}

    if loose:
        print(f"弦の名前が `_` 区切りのトークンとして1回だけ現れる形になっていないファイル {len(loose)} 本:")
        for s in loose:
            print(f"  - {s}")
        info += len(loose)
        print()

    for key in sorted(families):
        members = families[key]
        have = [s for s in "GDAE" if s in members]
        missing = [s for s in "GDAE" if s not in members]
        lines = []

        if missing:
            lines.append(f"欠け: {'・'.join(m + '線' for m in missing)}")
        for letter in have:
            path, stem = members[letter]
            try:
                score = read_score(path)
            except Exception as e:  # 1本読めなくても、他の組の結果は出す
                members[letter] = (path, stem, None)
                lines.append(f"NG {stem}: ファイルを読めない ({type(e).__name__}: {e})")
                continue
            members[letter] = (path, stem, score)
            for p in self_check(score, stem, letter, is_target=(stem == target_stem)):
                lines.append(f"NG {stem}: {p}")

        base_letter = args.base
        if base_letter not in members and target_stem is None:
            # 下見 (--target 無し) では、その組にある一番低い弦を代理の基準にして必ず突き合わせる。
            # ここを飛ばすと、基準の弦が欠けている組の食い違いが1行に化けて消える。
            usable = [x for x in have if members[x][2] is not None]
            if usable:
                base_letter = usable[0]
                lines.append(f"基準の {args.base}線 が無いので {base_letter}線 を代理の基準にした")
        if base_letter not in members or members[base_letter][2] is None:
            lines.append(f"基準に指定した {args.base}線 がこの系統に無い。突き合わせができない")
        else:
            base_path, base_stem, base_score = members[base_letter]
            for letter in have:
                if letter == base_letter:
                    continue
                path, stem, score = members[letter]
                if score is None:
                    continue
                compared.add(stem)
                for p in compare(base_score, base_stem, base_letter, score, stem, letter):
                    lines.append(f"NG {stem} (基準 {base_stem}): {p}")

        if lines:
            print(f"[{key}]")
            for line in lines:
                print(f"  {line}")
            print()
        # 元の版が元から持っている傷は、忠実に写せば出力にも出る。同じ内容なら合否に数えない
        # (指示書 §9-1 の合格条件そのもの)。基準の版に無い指摘だけが、今回作ったものの傷。
        def row_owner(line):
            """`NG <教材名>: …` / `NG <教材名> (基準 …): …` から教材名を完全一致で取り出す"""
            if not line.startswith("NG "):
                return None, None
            body = line[3:]
            head, sep, rest = body.partition(": ")
            if not sep:
                return None, None
            name = head.split(" (基準 ")[0]
            return name, rest

        base_contents = {c for (n, c) in (row_owner(x) for x in lines)
                         if n is not None and n != target_stem}
        for x in lines:
            name, content = row_owner(x)
            if name is None:
                info += 1
            elif target_stem is None:
                # §0-3 の下見。ここで止めたいのは「その元の版から作ってはいけない」ものだけ
                if content.startswith(BASE_BLOCKING):
                    total += 1
                    blocking.append(x)
                else:
                    info += 1
            elif name != target_stem:
                if content.startswith(BASE_BLOCKING):
                    total += 1  # §5 の入力の不備。この元の版から出力を作ってはいけない
                    blocking.append(x)
                else:
                    info += 1   # 元の版にあってよい傷 (出力側で直す・別途人が直す)
            elif content in base_contents and content.startswith(INHERITABLE):
                info += 1       # 元の版から引き継いだ同じ傷
            else:
                total += 1      # 今回作ったものの傷
                blocking.append(x)
        report["families"][key] = lines

    # 突き合わせが本当に行われたかの確認。ここを見ないと、ファイル名が弦以外でも変わっていて
    # 元の版と同じ系統に入らなかったとき、1音も照合しないまま「指摘なし」に見えてしまう。
    if args.target:
        # 教材名にドットが入ることがあるので、既知の拡張子のときだけ落とす
        t = args.target
        for ext in (".musicxml", ".xml", ".mxl"):
            if t.lower().endswith(ext):
                t = t[: -len(ext)]
                break
        if t in loose:
            fatal.append(f"{t}: 弦の名前が `_` 区切りのトークンとして1つに定まらないため、照合されていない")
        elif t not in compared:
            fam = next((k for k, v in families.items() for _, (_, st, *_r) in
                        [(x, y) for x, y in v.items()] if st == t), None)
            if fam is None:
                fatal.append(f"{t}: 指定したファイルが見つからない")
            elif string_letter_of_name(t) == args.base:
                fatal.append(f"{t}: 基準の弦 ({args.base}線) と同じなので、比べる相手がいない。--base には元の版の弦を渡すこと")
            else:
                own = next((k for k, v in families.items()
                            if any(st == t for (_, st, *_r) in v.values())), None)
                unreadable_self = own is not None and any(
                    st == t and len(rest) > 0 and rest[0] is None
                    for (_, st, *rest) in families[own].values())
                base_here = own is not None and args.base in families[own]
                base_anywhere = any(args.base in v for v in families.values())
                if unreadable_self:
                    pass  # 「ファイルを読めない」の NG で既に止まるので、二重に数えない
                elif base_here and families[own][args.base][2] is None:
                    fatal.append(f"{t}: 基準の {args.base}線 の版を読めなかったため、1音も照合されていない。"
                                 "上の NG 行に理由がある")
                elif not base_here and base_anywhere:
                    fatal.append(f"{t}: 基準の弦の版はフォルダにあるが、同じ組に入らなかった。"
                                 "出力のファイル名が弦のトークン以外でも変わっている")
                elif not base_here:
                    fatal.append(f"{t}: 基準の {args.base}線 の版が検収フォルダに入っていないため、1音も照合されていない。"
                                 "元の版を同じフォルダに置くこと")
                else:
                    fatal.append(f"{t}: 1音も照合されていない。原因を特定できないので、"
                                 "検収フォルダの中身とファイル名を確かめること")
        if fatal:
            print("=== 照合が成立していない (合格にしてはいけない) ===")
            for f in fatal:
                print(f"  FATAL {f}")
                blocking.append(f"FATAL {f}")
            print()
            total += len(fatal)

    if blocking and target_stem is None:
        print("=== 先に直す元の版 (§9-1 の3 の仕分け(2)) ===")
        print("   この元の版からは出力を作ってはいけない。ほかの NG 行は参考情報として [組名] の下に出ている。")
        for b in blocking:
            print(f"  {b}")
        print()
    elif blocking:
        print("=== 合否に効く指摘 (作る側に返すか元の版へ回すかは指示書 §9-1 の5) ===")
        for b in blocking:
            print(f"  {b}")
        print()
    elif args.target and not fatal:
        print(f"合否に効く指摘なし: {target_stem} は合格")

    print(f"系統 {len(families)} ・ 合否に効く指摘 {total} 件 ・ 参考情報 {info} 件")
    if args.json:
        parent = os.path.dirname(os.path.abspath(args.json))
        os.makedirs(parent, exist_ok=True)
        with open(args.json, "w", encoding="utf-8") as fh:
            json.dump({"total": total, "info": info, "blocking": blocking, **report},
                  fh, ensure_ascii=False, indent=2)
        print(f"JSON を書きました: {args.json}")
    return 1 if total else 0


if __name__ == "__main__":
    sys.exit(main())
