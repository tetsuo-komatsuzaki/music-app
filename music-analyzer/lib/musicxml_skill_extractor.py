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
    derive_position,
    diatonic_index,
    infer_pitch_only,
    infer_with_finger,
    string_num_to_id,
    try_infer_violin_position,  # noqa: F401  (後方互換のため残置)
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

    # 工程A-5 (2026-07-10): 楽譜上の小節番号 (<measure number="..">)。
    # 展開対応表の突合キー (analysis.json の measure_number と同じ番号体系。弱起=0対応)
    measure_number: Optional[int] = None

    string_id: Optional[str] = None  # "E"/"A"/"D"/"G"
    finger: Optional[int] = None  # 0〜4
    is_in_slur: bool = False
    is_after_rest: bool = False
    is_inferred_position: bool = False
    # 注：is_string_change_from_prev はここで出力しない（v3.2 Q7 確定）

    # ─── 工程B 追加 (2026-07-06・version 2) ───
    # position: ポジション番号 (1〜12)。開放弦・休符・導出不能は None。
    # position_confidence:
    #   "annotated" = <string>+<fingering> 両方の注釈から確定
    #   "estimated" = 方針上の既定推定 (記載なし=1stポジ / 弦既知でポジ導出)
    #   "low"       = 複数候補から音脈補正で選択 (§25: 移動系の集計から除外)
    position: Optional[int] = None
    position_confidence: Optional[str] = None

    # ─── 工程A 追加 (2026-07-10・note_karte version 3) ───
    # ■ 音符属性
    step: Optional[str] = None       # 音名文字 "F" 等 (休符は None)
    alter: int = 0                   # -1=♭ / 0 / +1=♯
    octave: Optional[int] = None
    midi: Optional[int] = None       # 実音高 (MIDI)
    duration_beats: Optional[float] = None  # 拍単位の音価
    note_type: Optional[str] = None  # "quarter"/"eighth"/"16th" 等
    is_dotted: bool = False
    is_grace: bool = False           # 装飾音符
    is_tuplet: bool = False          # 連符 (time-modification)
    beat_offset: Optional[float] = None  # 小節内オフセット (拍・0始まり)
    beat_number: Optional[int] = None    # 拍番号 (1始まり)
    is_on_beat: Optional[bool] = None    # 拍頭か
    is_chord: bool = False           # 重音グループの代表音符
    chord_midis: Optional[list] = None      # 重音の全構成音 (MIDI)
    chord_intervals: Optional[list] = None  # 隣接ペア分解後の音程種別 ["3度",...]
    is_slur_start: bool = False
    is_slur_end: bool = False

    # ■ 遷移属性 (単音のみ。重音・休符・曲頭は None。§26-1)
    prev_note_index: Optional[int] = None   # 遷移元 (直前の単音。休符透過・重音不参加)
    interval_degree: Optional[int] = None   # 符号付き度数 (+3=3度上行, 1=同度)
    interval_semitones: Optional[int] = None
    string_from: Optional[str] = None
    string_to: Optional[str] = None
    string_change_kind: Optional[str] = None  # "same"/"adjacent"/"skip"
    position_from: Optional[int] = None       # 手のポジション (開放弦は維持)
    position_to: Optional[int] = None
    position_moved: Optional[bool] = None
    prev_duration_beats: Optional[float] = None  # 音価変化の判定用
    rest_before_beats: float = 0.0               # 直前休符の合計拍

    # ─── 奏法 (2026-09-04) ───
    # piece_summary.build_piece_summary が音符ごとに書き戻す。
    # ここに宣言が無いと dataclasses.asdict() が拾わず、書き出しから静かに落ちる。
    # 落ちると diagnosis.py が奏法を一切読めず、pitch_tech_* / rhythm_tech_* の
    # カウンタが永久に0行になる (2026-09-03 に原因特定)。
    technique_tags: Optional[list] = None    # ["スラー", "スタッカート"] 等。無ければ None
    technique_ambiguous: bool = False        # 曖昧記号からの仮付与を含むか (§18-2)


# ---------------------------------------------------------------------------
# .mxl / .musicxml のロード
# ---------------------------------------------------------------------------


def load_musicxml(path: str) -> ET.ElementTree:
    """.mxl（圧縮）または .musicxml（プレーン）をロードして ElementTree を返す。

    .mxl は ZIP アーカイブで、META-INF/container.xml に主譜面のパスが書かれている。
    工程A-5 (2026-07-10): 拡張子でなく先頭バイト(PK)で判定する。
    実データに「拡張子 .musicxml だが中身は ZIP」の教材が存在するため
    (etude 実測)。拡張子判定だと ET.parse が失敗していた。
    """
    with open(path, "rb") as f:
        magic = f.read(2)
    if magic == b"PK" or path.lower().endswith(".mxl"):
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
    """後方互換ラッパー（notes のみ返す）。新規コードは extract_note_karte を使う。"""
    notes, _meta = extract_note_karte(musicxml_path)
    return notes


def extract_note_karte(musicxml_path: str) -> tuple[List[SkillInfoNote], dict]:
    """MusicXML から音符カルテ (note_karte) を抽出する（工程A・version 3）。

    走査は <measure> 直下を文書順に歩く（拍計算・重音収集・多声部検知のため。
    旧実装の findall(".//note") は <attributes>/<backup> の順序情報を失うため廃止）。

    note_index 規約（§2-1 インバリアント・analysis.json と同一）:
      - 休符は index を消費する
      - 重音グループは代表1音のみ index を消費（<chord/> 付き2音目以降は
        代表音符の chord_midis に収集し、index は進めない）

    Returns:
        (notes, meta)  meta = {"has_multiple_voices": bool}
    """
    tree = load_musicxml(musicxml_path)
    root = tree.getroot()

    parts = root.findall(".//part")
    if not parts:
        raise ValueError(f"No <part> element found in {musicxml_path}")
    part = parts[0]

    notes: List[SkillInfoNote] = []
    note_index = 0

    active_slurs: set[str] = set()
    prev_was_rest = False
    prev_string: Optional[str] = None
    prev_position: Optional[int] = None

    # 拍計算の状態（<attributes> で更新・小節を跨いで持続）
    divisions = 1          # 四分音符の分割数
    beat_type = 4          # 拍子の分母
    has_multiple_voices = False
    key_fifths_changes: list = []  # 調号の出現列 (先頭=主調、以降=副次調候補)

    for measure_idx, measure in enumerate(part.findall("measure")):
        cursor = 0  # 小節内カーソル (divisions 単位)
        # 楽譜上の小節番号 (弱起="0" もあり得る)。数値化できなければ連番+1
        try:
            measure_number = int(str(measure.get("number", "")).strip())
        except ValueError:
            measure_number = measure_idx + 1

        for elem in list(measure):
            tag = elem.tag

            if tag == "attributes":
                d = elem.find("divisions")
                if d is not None and d.text:
                    divisions = max(1, int(d.text.strip()))
                bt = elem.find("time/beat-type")
                if bt is not None and bt.text:
                    beat_type = max(1, int(bt.text.strip()))
                # 工程A-3: 調号 (fifths) の変更を捕捉 → 副次調検出 (§2-4)
                f = elem.find("key/fifths")
                if f is not None and f.text:
                    try:
                        key_fifths_changes.append(
                            {"measure_index": measure_idx, "fifths": int(f.text.strip())}
                        )
                    except ValueError:
                        pass
                continue

            if tag == "backup":
                dur = elem.find("duration")
                if dur is not None and dur.text:
                    cursor -= int(dur.text.strip())
                continue

            if tag == "forward":
                dur = elem.find("duration")
                if dur is not None and dur.text:
                    cursor += int(dur.text.strip())
                continue

            if tag != "note":
                continue

            note_elem = elem
            is_rest = note_elem.find("rest") is not None
            is_chord_member = note_elem.find("chord") is not None
            is_grace = note_elem.find("grace") is not None

            # 多声部検知: voice != 1 は第1声部のみ処理の v1 制限（§2-6）
            voice_elem = note_elem.find("voice")
            voice = voice_elem.text.strip() if voice_elem is not None and voice_elem.text else "1"
            if voice != "1":
                has_multiple_voices = True
                if not is_chord_member and not is_grace:
                    dur = note_elem.find("duration")
                    if dur is not None and dur.text:
                        cursor += int(dur.text.strip())
                continue

            # 音価 (divisions 単位)。grace は duration なし=0
            dur_div = 0
            dur_elem = note_elem.find("duration")
            if dur_elem is not None and dur_elem.text:
                dur_div = int(dur_elem.text.strip())

            # 重音メンバー（2音目以降）: 代表音符に音高を収集して終わり
            if is_chord_member:
                if notes:
                    rep = notes[-1]
                    m = _extract_midi_pitch(note_elem)
                    so = _extract_step_octave(note_elem)
                    if m is not None and rep.chord_midis is not None:
                        rep.chord_midis.append(m)
                        rep.is_chord = True
                        if so[0] is not None:
                            letters = getattr(rep, "_chord_letters", [])
                            letters.append(so)
                            rep._chord_letters = letters  # type: ignore[attr-defined]
                            rep.chord_intervals = _chord_intervals_from_letters(letters)
                continue

            # ── ここから index を消費する音符（単音代表 or 休符）──
            string_id, finger, position, confidence, is_inferred = (
                _resolve_string_finger_position(note_elem, prev_string, prev_position)
            )

            slur_was_active = bool(active_slurs)
            _update_slur_state(note_elem, active_slurs)
            slur_starts_here = _slur_starts_in_note(note_elem)
            slur_stops_here = _slur_stops_in_note(note_elem)
            is_in_slur = slur_was_active or slur_starts_here

            step, octv = _extract_step_octave(note_elem)
            midi = _extract_midi_pitch(note_elem)
            alter = _extract_alter(note_elem)

            # 拍位置 (整数演算で判定・float は表示用)
            beats_scale = divisions * 4  # cursor*beat_type / beats_scale = 拍
            beat_offset = round(cursor * beat_type / beats_scale, 4)
            beat_number = (cursor * beat_type) // beats_scale + 1
            is_on_beat = (cursor * beat_type) % beats_scale == 0
            duration_beats = round(dur_div * beat_type / beats_scale, 4)

            type_elem = note_elem.find("type")
            note_type = type_elem.text.strip() if type_elem is not None and type_elem.text else None

            skill_note = SkillInfoNote(
                note_index=note_index,
                measure_index=measure_idx,
                measure_number=measure_number,
                is_rest=is_rest,
                string_id=string_id,
                finger=finger,
                is_in_slur=is_in_slur and not is_rest,
                is_after_rest=prev_was_rest and not is_rest,
                is_inferred_position=is_inferred and not is_rest,
                position=position if not is_rest else None,
                position_confidence=confidence if not is_rest else None,
                # 工程A: 音符属性
                step=step,
                alter=alter,
                octave=octv,
                midi=midi,
                duration_beats=duration_beats,
                note_type=note_type,
                is_dotted=note_elem.find("dot") is not None,
                is_grace=is_grace,
                is_tuplet=note_elem.find("time-modification") is not None,
                beat_offset=beat_offset,
                beat_number=beat_number,
                is_on_beat=is_on_beat,
                is_chord=False,  # メンバー収集時に True 化
                chord_midis=([midi] if (not is_rest and midi is not None) else None),
                chord_intervals=None,
                is_slur_start=slur_starts_here and not is_rest,
                is_slur_end=slur_stops_here and not is_rest,
            )
            # 重音の音程計算用に音名も一時保持 (JSON には出さない)
            skill_note._chord_letters = [ (step, octv) ] if step is not None else []  # type: ignore[attr-defined]
            # 工程A-3: アーティキュレーション記号を一時保持 (技術タグ判定用・非serialize)
            skill_note._artic = {  # type: ignore[attr-defined]
                "staccato": note_elem.find("notations/articulations/staccato") is not None,
                "spiccato": note_elem.find("notations/articulations/spiccato") is not None,
                "detached_legato": note_elem.find("notations/articulations/detached-legato") is not None,
                "pizzicato": note_elem.get("pizzicato") == "yes"
                or note_elem.find("notations/technical/pluck") is not None,
            }
            notes.append(skill_note)

            if not is_rest and string_id is not None:
                prev_string = string_id
                if position is not None:
                    prev_position = position

            note_index += 1
            prev_was_rest = is_rest
            if not is_grace:
                cursor += dur_div

    _annotate_transitions(notes)

    # 単音の chord_midis は None に戻す (カルテ上は重音のみ保持)
    for n in notes:
        if not n.is_chord:
            n.chord_midis = None
        if hasattr(n, "_chord_letters"):
            del n._chord_letters

    meta = {
        "has_multiple_voices": has_multiple_voices,
        "key_fifths_changes": key_fifths_changes,
    }
    return notes, meta


# ---------------------------------------------------------------------------
# 工程A: 遷移属性の付与 (§26-1・遷移チェーンは単音のみ)
# ---------------------------------------------------------------------------


def _annotate_transitions(notes: List[SkillInfoNote]) -> None:
    """遷移属性を後段パスで付与する。

    規則（セッション確定・設計書§2-7）:
      - チェーンは単音のみ。休符=透過 (rest_before_beats に累積)。
      - 重音=チェーン不参加 (重音自身の遷移は None、次の単音の遷移元は重音より前の単音)。
      - 開放弦は手のポジションを動かさない (position は直前の手ポジを維持)。
    """
    prev_single: Optional[SkillInfoNote] = None
    hand_position: Optional[int] = None  # 直近の確定した手ポジ
    rest_accum = 0.0

    for n in notes:
        if n.is_rest:
            rest_accum += n.duration_beats or 0.0
            continue
        if n.is_chord:
            rest_accum = 0.0  # 重音の発音で休符の連続は切れる
            continue

        n.rest_before_beats = round(rest_accum, 4)
        rest_accum = 0.0

        if prev_single is not None:
            n.prev_note_index = prev_single.note_index
            # 音程 (音名算術: 度数) + 半音
            if (
                n.step is not None and n.octave is not None
                and prev_single.step is not None and prev_single.octave is not None
            ):
                d_now = diatonic_index(n.step, n.octave)
                d_prev = diatonic_index(prev_single.step, prev_single.octave)
                if d_now is not None and d_prev is not None:
                    diff = d_now - d_prev
                    n.interval_degree = (abs(diff) + 1) * (1 if diff > 0 else -1 if diff < 0 else 1)
            if n.midi is not None and prev_single.midi is not None:
                n.interval_semitones = n.midi - prev_single.midi
            # 移弦
            if n.string_id is not None and prev_single.string_id is not None:
                n.string_from = prev_single.string_id
                n.string_to = n.string_id
                dist = _string_index_distance(prev_single.string_id, n.string_id)
                n.string_change_kind = (
                    "same" if dist == 0 else "adjacent" if dist == 1 else "skip"
                )
            # ポジション移動 (開放弦は手ポジ維持)
            pos_from = hand_position
            pos_to = n.position if n.position is not None else hand_position
            n.position_from = pos_from
            n.position_to = pos_to
            if pos_from is not None and pos_to is not None:
                n.position_moved = pos_from != pos_to
            n.prev_duration_beats = prev_single.duration_beats

        if n.position is not None:
            hand_position = n.position
        prev_single = n


_STRING_INDEX = {"G": 0, "D": 1, "A": 2, "E": 3}


def _string_index_distance(a: str, b: str) -> int:
    return abs(_STRING_INDEX.get(a, 0) - _STRING_INDEX.get(b, 0))


# 隣接ペア分解 (§25): ソートした構成音の隣接2音ずつの度数 → 種別ラベル
_INTERVAL_LABEL = {3: "3度", 4: "4度", 5: "5度", 6: "6度", 8: "オクターブ", 10: "10度"}


def _chord_intervals_from_letters(letters: list) -> list:
    """重音構成音 [(step, octave), ...] を音高順に並べ、隣接ペアの度数種別を返す。"""
    dias = sorted(
        d for s, o in letters
        if s is not None and o is not None and (d := diatonic_index(s, o)) is not None
    )
    labels: list[str] = []
    for lo, hi in zip(dias, dias[1:]):
        degree = hi - lo + 1
        labels.append(_INTERVAL_LABEL.get(degree, "その他"))
    return labels


# ---------------------------------------------------------------------------
# 弦・指の抽出（注釈あり / 推定フォールバック）
# ---------------------------------------------------------------------------


def _resolve_string_finger_position(
    note_elem: ET.Element,
    prev_string: Optional[str],
    prev_position: Optional[int],
) -> tuple[Optional[str], Optional[int], Optional[int], Optional[str], bool]:
    """1音符要素から (string_id, finger, position, position_confidence, is_inferred) を解決する。

    優先順位（工程B 2026-07-06・fingering運用方針 §11 / ポジション推定2段方式 §25）:
      1. <string>+<fingering> 両方あり → 採用、ポジションはモデルから導出 ("annotated")
      2. <fingering> のみ → 指番号+音高から弦・ポジを導出 (infer_with_finger)。
         候補1つ="estimated" / 複数候補を音脈補正で選択="low"
      3. <string> のみ → 弦+音高からポジション導出 ("estimated")
      4. 両方なし → 音高のみから推定 (infer_pitch_only)。
         MIDI 55-83=1stポジ既定 ("estimated") / 84+=弦候補×音脈補正 ("low")
         → 旧実装の「MIDI 84+ は string_id=None で欠落」を撤廃。

    Returns:
        (string_id, finger, position, position_confidence, is_inferred)
        休符・導出不能は (None, None, None, None, False)
    """
    if note_elem.find("rest") is not None:
        return None, None, None, None, False

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

    midi_pitch = _extract_midi_pitch(note_elem)
    step, octave = _extract_step_octave(note_elem)

    # 1. 両方注釈あり → 最優先で採用
    if annotated_string_id is not None and annotated_finger is not None:
        pos = (
            derive_position(
                midi_pitch, annotated_string_id, annotated_finger, step, octave
            )
            if midi_pitch is not None
            else None
        )
        return annotated_string_id, annotated_finger, pos, "annotated", False

    if midi_pitch is None:
        # ピッチ取得不能 → 注釈分のみ返す
        return annotated_string_id, annotated_finger, None, None, False

    # 2. 指番号のみ → 音名算術で弦・ポジを導出 (§11 の中核ケース)
    if annotated_finger is not None:
        inferred = infer_with_finger(
            midi_pitch, annotated_finger, prev_string, prev_position,
            step=step, octave=octave,
        )
        if inferred is not None:
            s, pos, conf = inferred
            confidence = "estimated" if conf == "high" else "low"
            return s, annotated_finger, pos, confidence, True
        return None, annotated_finger, None, None, False

    # 3. 弦のみ → 弦+音名からポジション導出
    if annotated_string_id is not None:
        pos = derive_position(midi_pitch, annotated_string_id, None, step, octave)
        return annotated_string_id, None, pos, "estimated", True

    # 4. 両方なし → 音高のみから推定 (55-83=1stポジ既定 / 84+=音名算術×音脈補正)
    inferred_po = infer_pitch_only(
        midi_pitch, prev_string, prev_position, step=step, octave=octave
    )
    if inferred_po is None:
        return None, None, None, None, False
    s, pos, f, conf = inferred_po
    return s, f, pos, conf, True


# ---------------------------------------------------------------------------
# MIDI ピッチ抽出
# ---------------------------------------------------------------------------


# 半音のオフセット（C を 0 として）
_STEP_TO_SEMITONE = {
    "C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11,
}


def _extract_step_octave(
    note_elem: ET.Element,
) -> tuple[Optional[str], Optional[int]]:
    """<note><pitch> から音名 (step) とオクターブを抽出する（音名算術用）。
    MusicXML 仕様上 <pitch> には <step>+<octave> が必須のため、
    有音符なら必ず取得できる。休符・不正値は (None, None)。"""
    pitch = note_elem.find("pitch")
    if pitch is None:
        return None, None
    step_elem = pitch.find("step")
    octave_elem = pitch.find("octave")
    if step_elem is None or octave_elem is None:
        return None, None
    if step_elem.text is None or octave_elem.text is None:
        return None, None
    step = step_elem.text.strip().upper()
    if step not in _STEP_TO_SEMITONE:
        return None, None
    try:
        octave = int(octave_elem.text.strip())
    except ValueError:
        return None, None
    return step, octave


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


def _slur_stops_in_note(note_elem: ET.Element) -> bool:
    """この音符でスラーが stop するかを判定する（工程A: スラー境界フラグ用）。"""
    notations = note_elem.find("notations")
    if notations is None:
        return False
    for slur in notations.findall("slur"):
        if slur.attrib.get("type", "") == "stop":
            return True
    return False


def _extract_alter(note_elem: ET.Element) -> int:
    """<pitch><alter> を int で返す（無ければ 0）。"""
    alter_elem = note_elem.find("pitch/alter")
    if alter_elem is None or alter_elem.text is None:
        return 0
    try:
        return int(float(alter_elem.text.strip()))
    except ValueError:
        return 0


# ---------------------------------------------------------------------------
# 出力：musicxml_skill_info.json として保存
# ---------------------------------------------------------------------------


def export_skill_info_json(
    notes: List[SkillInfoNote], output_path: str, meta: Optional[dict] = None
) -> None:
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
        # version 3 (工程A 2026-07-10): note_karte 化。音符属性(音名/音価/拍位置/重音/
        # スラー境界)+遷移属性(度数/移弦/ポジ移動/休符前)を追加。追加フィールドのみ後方互換。
        # version 2 (工程B 2026-07-06): position / position_confidence 追加。
        "version": 3,
        "notes": [asdict(n) for n in notes],
    }
    if meta:
        payload["meta"] = meta
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
    notes, meta = extract_note_karte(musicxml_path)
    export_skill_info_json(notes, output_path, meta)
    return notes


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 3:
        print("Usage: python -m lib.musicxml_skill_extractor <input.mxl> <output_musicxml_skill_info.json>")
        sys.exit(1)

    notes = run_extraction(sys.argv[1], sys.argv[2])
    print(f"Extracted {len(notes)} notes to {sys.argv[2]}")
