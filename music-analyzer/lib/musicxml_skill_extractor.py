"""
musicxml_skill_extractor.py — MusicXML から musicxml_skill_info.json を生成する（v3.2 §14-4 Commit D）

このモジュールは設計書 v3.2 で確定した Commit D の中核実装。
analyze_musicxml.py から呼ばれて、新規ファイル musicxml_skill_info.json を生成する。

v3.2 確定（Q6）:
  既存 analysis.json は変更しない（温存）。
  新規ファイル musicxml_skill_info.json を生成（既存 analysis.json と並列）。

v3.2 確定（Q7）:
  is_string_change_from_prev は出力しない。
  note_integration.py 側で 4 JSON 統合時に生成する。

抽出するフィールド：
- string_id           : <technical><string> から（推定フォールバックあり）
- finger              : <technical><fingering> から（推定フォールバックあり）
- is_in_slur          : <slur type="start"> から <slur type="stop"> までの区間
- is_after_rest       : 直前の音符が休符だったか
- is_inferred_position: 弦・指がファーストポジション推定された場合 True

設計書 v3.2 §6-2 の IntegratedNote 仕様に対応。

v3.2 重要（Phase 0.1 Task 5 反映）:
  既存 mxl の 86%が MIDI 84+ を含み、<technical> 注釈もない。
  「作り直し」プロジェクトは MVP 後に実施。
  α MVP では MIDI 84+ の音符は string_id=None として出力される。
"""

from __future__ import annotations

import json
import xml.etree.ElementTree as ET
import zipfile
from dataclasses import asdict, dataclass
from io import BytesIO
from typing import List, Optional

from .violin_position import (
    string_num_to_id,
    try_infer_violin_position,
)


# ---------------------------------------------------------------------------
# 出力データ構造
# ---------------------------------------------------------------------------


@dataclass
class SkillInfoNote:
    """musicxml_skill_info.json の各音符のエントリ。
    
    v3.2 Q7：is_string_change_from_prev は出力しない（note_integration.py で生成）
    """

    note_index: int
    measure_index: int
    is_rest: bool

    string_id: Optional[str] = None  # "E"/"A"/"D"/"G"
    finger: Optional[int] = None  # 0〜4
    is_in_slur: bool = False
    is_after_rest: bool = False
    is_inferred_position: bool = False
    # 注：is_string_change_from_prev はここで出力しない（v3.2 Q7 確定）


# ---------------------------------------------------------------------------
# .mxl / .musicxml のロード
# ---------------------------------------------------------------------------


def load_musicxml(path: str) -> ET.ElementTree:
    """.mxl（圧縮）または .musicxml（プレーン）をロードして ElementTree を返す。

    .mxl は ZIP アーカイブで、META-INF/container.xml に主譜面のパスが書かれている。
    """
    if path.lower().endswith(".mxl"):
        return _load_compressed_mxl(path)
    return ET.parse(path)


def _load_compressed_mxl(path: str) -> ET.ElementTree:
    """.mxl を ZIP として開き、META-INF/container.xml が指す主譜面を返す。"""
    with zipfile.ZipFile(path, "r") as zf:
        # META-INF/container.xml から主譜面のパスを取得
        try:
            container_data = zf.read("META-INF/container.xml")
            container_root = ET.fromstring(container_data)
            # rootfile element を探す
            ns = {"c": "urn:oasis:names:tc:opendocument:xmlns:container"}
            rootfile = container_root.find(".//c:rootfile", ns)
            if rootfile is None:
                rootfile = container_root.find(".//rootfile")
            if rootfile is None or "full-path" not in rootfile.attrib:
                # フォールバック：拡張子で推定
                main_path = next(
                    (n for n in zf.namelist() if n.endswith(".xml") and not n.startswith("META-INF")),
                    None,
                )
            else:
                main_path = rootfile.attrib["full-path"]
        except KeyError:
            main_path = next(
                (n for n in zf.namelist() if n.endswith(".xml") and not n.startswith("META-INF")),
                None,
            )

        if main_path is None:
            raise ValueError(f"Cannot find main MusicXML file inside {path}")

        main_data = zf.read(main_path)
        return ET.parse(BytesIO(main_data))


# ---------------------------------------------------------------------------
# MusicXML 走査の中核
# ---------------------------------------------------------------------------


def extract_skill_info(musicxml_path: str) -> List[SkillInfoNote]:
    """MusicXML から skill_info のリストを抽出する。
    
    v3.2 Q7：is_string_change_from_prev は出力しない（note_integration 側で生成）

    Args:
        musicxml_path: .mxl または .musicxml のパス

    Returns:
        SkillInfoNote のリスト（音符・休符を順序保持）
    """
    tree = load_musicxml(musicxml_path)
    root = tree.getroot()

    # 主声部の <part> を取得（ヴァイオリン1パート前提）
    parts = root.findall(".//part")
    if not parts:
        raise ValueError(f"No <part> element found in {musicxml_path}")
    part = parts[0]

    notes: List[SkillInfoNote] = []
    note_index = 0

    # スラー状態の追跡（複数の number を扱う、basic case では number=1 のみ）
    active_slurs: set[str] = set()

    # 直前の音符が休符だったかフラグ
    prev_was_rest = False

    for measure_idx, measure in enumerate(part.findall(".//measure")):
        for note_elem in measure.findall(".//note"):
            is_rest = note_elem.find("rest") is not None
            is_chord = note_elem.find("chord") is not None

            # コード（同時発音）の2音目以降は note_index を進めずスキップ
            # （上達ループ的にはメロディラインの主音のみ扱う）
            if is_chord:
                continue

            # 弦・指の抽出
            string_id, finger, is_inferred = _extract_string_and_finger(note_elem)

            # スラー範囲判定（<slur type="start"> を見つけたら active 化、stop で除去）
            slur_was_active = bool(active_slurs)
            _update_slur_state(note_elem, active_slurs)
            # 「この音符がスラー範囲内か」は、slur_was_active OR この音符で start
            # ただし、慣例的には start を含む音符からスラー範囲とみなすので、
            # update 後の active 状態（または start を含む状態）を採用する
            slur_starts_here = _slur_starts_in_note(note_elem)
            is_in_slur = slur_was_active or slur_starts_here

            # 結果オブジェクト構築
            # v3.2 Q7：is_string_change_from_prev はここでは出力しない
            skill_note = SkillInfoNote(
                note_index=note_index,
                measure_index=measure_idx,
                is_rest=is_rest,
                string_id=string_id,
                finger=finger,
                is_in_slur=is_in_slur and not is_rest,  # 休符はスラー対象外
                is_after_rest=prev_was_rest and not is_rest,
                is_inferred_position=is_inferred and not is_rest,
            )
            notes.append(skill_note)

            note_index += 1
            prev_was_rest = is_rest

    return notes


# ---------------------------------------------------------------------------
# 弦・指の抽出（注釈あり / 推定フォールバック）
# ---------------------------------------------------------------------------


def _extract_string_and_finger(
    note_elem: ET.Element,
) -> tuple[Optional[str], Optional[int], bool]:
    """1音符要素から (string_id, finger, is_inferred) を抽出する。

    優先順位（Tetsuo 確定方針 v3.2）：
      1. <notations><technical><string> + <fingering> が両方ある → そのまま採用（最優先）
      2. 片方だけある → ある方を採用、ない方は推定で補完
      3. 両方ない → MIDI ピッチから推定（フォールバック専用）
    
    v3.2 注（Phase 0.1 Task 5 反映）:
      既存 mxl の 86%が <technical> 注釈なしかつ MIDI 84+ を含む。
      推定範囲外（MIDI 84+）は string_id=None で返る。

    Args:
        note_elem: <note> 要素

    Returns:
        (string_id, finger, is_inferred)
        休符の場合は (None, None, False)
        推定範囲外の場合は (None, None, False)
    """
    if note_elem.find("rest") is not None:
        return None, None, False

    # 注釈の取得
    technical = note_elem.find(".//technical")
    annotated_string_id: Optional[str] = None
    annotated_finger: Optional[int] = None

    if technical is not None:
        string_elem = technical.find("string")
        if string_elem is not None and string_elem.text is not None:
            annotated_string_id = string_num_to_id(string_elem.text.strip())

        fingering_elem = technical.find("fingering")
        if fingering_elem is not None and fingering_elem.text is not None:
            try:
                annotated_finger = int(fingering_elem.text.strip())
            except ValueError:
                annotated_finger = None

    # 両方そろっていればそのまま採用（最優先）
    if annotated_string_id is not None and annotated_finger is not None:
        return annotated_string_id, annotated_finger, False

    # 推定が必要 → MIDI ピッチを取得
    midi_pitch = _extract_midi_pitch(note_elem)
    if midi_pitch is None:
        # ピッチ取得不能 → 注釈分のみ返す（is_inferred = False、注釈の信頼性に従う）
        return annotated_string_id, annotated_finger, False

    # ファーストポジション推定（フォールバック）
    # v3.2 注：MIDI 範囲外（55未満 or 84以上）は None が返る
    inferred = try_infer_violin_position(midi_pitch)
    if inferred is None:
        # 推定範囲外 → 注釈の値があればそれを返す、なければ全 None
        return annotated_string_id, annotated_finger, False

    inferred_string_id, inferred_finger = inferred

    # 注釈が片方だけある場合、ある方を優先する
    final_string_id = annotated_string_id if annotated_string_id is not None else inferred_string_id
    final_finger = annotated_finger if annotated_finger is not None else inferred_finger

    # is_inferred は「いずれかが推定で埋まった場合」True
    is_inferred = (annotated_string_id is None) or (annotated_finger is None)

    return final_string_id, final_finger, is_inferred


# ---------------------------------------------------------------------------
# MIDI ピッチ抽出
# ---------------------------------------------------------------------------


# 半音のオフセット（C を 0 として）
_STEP_TO_SEMITONE = {
    "C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11,
}


def _extract_midi_pitch(note_elem: ET.Element) -> Optional[int]:
    """<note><pitch> から MIDI 番号を計算する。

    MIDI 番号 = (octave + 1) * 12 + step_semitone + alter
    （C-1 が MIDI 0、C0 が 12、C4 が 60）

    Args:
        note_elem: <note> 要素

    Returns:
        MIDI 番号。<pitch> がない、不正な値の場合は None
    """
    pitch = note_elem.find("pitch")
    if pitch is None:
        return None

    step_elem = pitch.find("step")
    octave_elem = pitch.find("octave")
    if step_elem is None or octave_elem is None:
        return None
    if step_elem.text is None or octave_elem.text is None:
        return None

    step = step_elem.text.strip().upper()
    if step not in _STEP_TO_SEMITONE:
        return None

    try:
        octave = int(octave_elem.text.strip())
    except ValueError:
        return None

    alter = 0
    alter_elem = pitch.find("alter")
    if alter_elem is not None and alter_elem.text is not None:
        try:
            alter = int(float(alter_elem.text.strip()))
        except ValueError:
            alter = 0

    midi_num = (octave + 1) * 12 + _STEP_TO_SEMITONE[step] + alter
    return midi_num


# ---------------------------------------------------------------------------
# スラー範囲の判定
# ---------------------------------------------------------------------------


def _update_slur_state(note_elem: ET.Element, active_slurs: set[str]) -> None:
    """音符に含まれる <slur> 要素を見て、active_slurs を更新する。

    MusicXML のスラー仕様：
      - <slur number="N" type="start"/> でスラー開始
      - <slur number="N" type="stop"/> でスラー終了
      - number 属性は省略可能（その場合は "1" とみなす）

    Args:
        note_elem: <note> 要素
        active_slurs: 現在 active なスラーの number セット（インプレース更新）
    """
    notations = note_elem.find("notations")
    if notations is None:
        return

    for slur in notations.findall("slur"):
        number = slur.attrib.get("number", "1")
        slur_type = slur.attrib.get("type", "")

        if slur_type == "start":
            active_slurs.add(number)
        elif slur_type == "stop":
            active_slurs.discard(number)
        # "continue" 等は何もしない（範囲は維持）


def _slur_starts_in_note(note_elem: ET.Element) -> bool:
    """この音符でスラーが start するかを判定する。"""
    notations = note_elem.find("notations")
    if notations is None:
        return False
    for slur in notations.findall("slur"):
        if slur.attrib.get("type", "") == "start":
            return True
    return False


# ---------------------------------------------------------------------------
# 出力：musicxml_skill_info.json として保存
# ---------------------------------------------------------------------------


def export_skill_info_json(notes: List[SkillInfoNote], output_path: str) -> None:
    """SkillInfoNote のリストを musicxml_skill_info.json として保存する。
    
    v3.2 Q6 確定：ファイル名は musicxml_skill_info.json
    既存 analysis.json と並列で別ファイルとして管理する。

    出力フォーマット：
        {
          "version": 1,
          "notes": [
            { "note_index": 0, "measure_index": 0, "is_rest": false, ... },
            ...
          ]
        }
    """
    payload = {
        "version": 1,
        "notes": [asdict(n) for n in notes],
    }
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)


# ---------------------------------------------------------------------------
# CLI エントリポイント（analyze_musicxml.py からも呼び出し可能）
# ---------------------------------------------------------------------------


def run_extraction(musicxml_path: str, output_path: str) -> List[SkillInfoNote]:
    """MusicXML から skill_info を抽出して JSON として保存する。
    
    v3.2 Q6 確定：output_path は musicxml_skill_info.json を想定。

    Args:
        musicxml_path: 入力 .mxl または .musicxml のパス
        output_path: 出力 musicxml_skill_info.json のパス

    Returns:
        抽出された SkillInfoNote のリスト
    """
    notes = extract_skill_info(musicxml_path)
    export_skill_info_json(notes, output_path)
    return notes


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 3:
        print("Usage: python -m lib.musicxml_skill_extractor <input.mxl> <output_musicxml_skill_info.json>")
        sys.exit(1)

    notes = run_extraction(sys.argv[1], sys.argv[2])
    print(f"Extracted {len(notes)} notes to {sys.argv[2]}")
