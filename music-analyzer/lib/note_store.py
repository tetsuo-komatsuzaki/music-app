# -*- coding: utf-8 -*-
"""
note_store.py — ノート属性ストア (2026-09-05 Tetsuo確定) の書き手。

仕様: https://claude.ai/code/artifact/7a7d2c1f-57b0-4b40-926a-cd88c1d8513a
検証: https://claude.ai/code/artifact/66a5cce8-9704-4245-a84a-baacb96dabd9

正となる表は3つ。集計は保存しない。
  NoteProfile      音のかたち。属性の組 = 1行。全属性の指紋 key で一意
  ScoreNote        曲と教材の音の並び。繰り返しを展開した演奏順。前の音は演奏順
  PerformanceNote  演奏の1音ごとの結果。comparison_result.json の全項目

R1 展開後の並びと記譜のカルテの対応は、analyze_musicxml が music21 の derivation で
   作る expanded_to_orig (演奏順 → 記譜の ordinal) を使う。小節番号の突き合わせ
   (build_expansion_map) は使わない。対応表が作れなかった23件はこれで組める見込み。
R2 position は手のポジション。開放弦は直前の手のポジションを引き継ぐ。
R5 重音の構成音ごとの音価・弦・指は、カルテの chord_members から読む。

値の規約 (NULL を入れない。NULL 同士は等しくならず一意性が壊れるため):
  文字列   "none" = その構成音は無い / "unknown" = 分からない
  finger   -1 = 分からない / -2 = 構成音が無い
  duration -1 = 構成音が無い
  position -1 = 分からない
  tuplet   0:0 = 連符でない
"""
from __future__ import annotations

import hashlib
import json
from typing import Any, Dict, Iterable, List, Optional, Tuple

NOTE_PROFILE_VERSION = 1

NONE = "none"
UNKNOWN = "unknown"
FINGER_UNKNOWN = -1
FINGER_NONE = -2
DUR_NONE = -1.0
POS_UNKNOWN = -1
MAX_VOICES = 4

# 奏法13種。列名の順 = 指紋の順。増やす = 次の版。
TECHS = ["slur", "portato", "staccato", "bow_staccato", "spiccato", "ricochet", "pizzicato",
         "tremolo", "vibrato", "trill", "mordent", "glissando", "harmonic"]
TECH_COLUMNS = {
    "slur": "techSlur", "portato": "techPortato", "staccato": "techStaccato",
    "bow_staccato": "techBowStaccato", "spiccato": "techSpiccato", "ricochet": "techRicochet",
    "pizzicato": "techPizzicato", "tremolo": "techTremolo", "vibrato": "techVibrato",
    "trill": "techTrill", "mordent": "techMordent", "glissando": "techGlissando", "harmonic": "techHarmonic",
}
# カルテの奏法名 (日本語) → 列の接尾辞。diagnosis._TECH_SUFFIX と同じ表。
TECH_NAME_TO_SUFFIX = {
    "スラー": "slur", "ポルタート": "portato", "スタッカート": "staccato",
    "連続スタッカート": "bow_staccato", "スピッカート": "spiccato",
    "リコシェ": "ricochet", "ピチカート": "pizzicato", "トレモロ": "tremolo",
    "ビブラート": "vibrato", "トリル": "trill", "プラルトリラーとモルデント": "mordent",
    "グリッサンド": "glissando", "ナチュラル・ハーモニクス": "harmonic",
}

# 指紋に入れる列の順。Prisma の NoteProfile と同じ集合。
PROFILE_COLUMNS: List[str] = (
    ["noteCount"]
    + [f"pitch{i}" for i in range(1, 5)]
    + [f"string{i}" for i in range(1, 5)]
    + [f"finger{i}" for i in range(1, 5)]
    + [f"noteType{i}" for i in range(1, 5)]
    + [f"dotted{i}" for i in range(1, 5)]
    + [f"durationBeats{i}" for i in range(1, 5)]
    + ["position"]
    + [TECH_COLUMNS[t] for t in TECHS]
    + ["tupletActual", "tupletNormal", "onBeat", "chordCont", "restBefore"]
)


# ───────────────────────── かたち ─────────────────────────

def pitch_name(step: Optional[str], alter: Optional[int], octave: Optional[int]) -> str:
    """音名+オクターブ。"F#4" / "Bb4" / "E5"。分からなければ unknown。"""
    if not step or octave is None:
        return UNKNOWN
    acc = ""
    a = int(alter or 0)
    if a > 0:
        acc = "#" * a
    elif a < 0:
        acc = "b" * (-a)
    return f"{step}{acc}{octave}"


def pitch_name_from_music21(name_with_octave: str) -> str:
    """music21 の nameWithOctave ("B-4", "F#4", "C##5") をこの表の表記に直す。"""
    if not name_with_octave:
        return UNKNOWN
    return name_with_octave.replace("-", "b")


def _voice(pitch: str = NONE, string: str = NONE, finger: int = FINGER_NONE,
           note_type: str = NONE, dotted: bool = False, duration: float = DUR_NONE) -> Dict[str, Any]:
    return {"pitch": pitch, "string": string, "finger": finger,
            "noteType": note_type, "dotted": bool(dotted), "durationBeats": float(duration)}


def make_profile(voices: List[Dict[str, Any]], *, position: int, techs: Iterable[str],
                 tuplet_actual: int, tuplet_normal: int, on_beat: bool, chord_cont: bool,
                 rest_before: float) -> Dict[str, Any]:
    """構成音 (低い方から・1〜4) と全体の値から、かたち1行を作る。NULL は入れない。"""
    if not voices:
        raise ValueError("構成音が0")
    voices = voices[:MAX_VOICES]
    p: Dict[str, Any] = {"version": NOTE_PROFILE_VERSION, "noteCount": len(voices)}
    for i in range(1, MAX_VOICES + 1):
        v = voices[i - 1] if i <= len(voices) else _voice()
        p[f"pitch{i}"] = v["pitch"]
        p[f"string{i}"] = v["string"]
        p[f"finger{i}"] = int(v["finger"])
        p[f"noteType{i}"] = v["noteType"]
        p[f"dotted{i}"] = bool(v["dotted"])
        p[f"durationBeats{i}"] = round(float(v["durationBeats"]), 4)
    p["position"] = int(position)
    tset = set(techs)
    for t in TECHS:
        p[TECH_COLUMNS[t]] = t in tset
    p["tupletActual"] = int(tuplet_actual or 0)
    p["tupletNormal"] = int(tuplet_normal or 0)
    p["onBeat"] = bool(on_beat)
    p["chordCont"] = bool(chord_cont)
    p["restBefore"] = round(float(rest_before or 0.0), 4)
    for c in PROFILE_COLUMNS:
        if p[c] is None:
            raise ValueError(f"NULL は禁止: {c}")
    p["key"] = profile_key(p)
    return p


def profile_key(p: Dict[str, Any]) -> str:
    """全属性を決まった順に並べた sha1 の先頭40桁。版番号も含める。"""
    parts = [str(NOTE_PROFILE_VERSION)]
    for c in PROFILE_COLUMNS:
        v = p[c]
        if isinstance(v, bool):
            parts.append("1" if v else "0")
        elif isinstance(v, float):
            parts.append(f"{v:.4f}")
        else:
            parts.append(str(v))
    return hashlib.sha1("|".join(parts).encode("utf-8")).hexdigest()[:40]


# ───────────────────────── 並び ─────────────────────────

def _techs_of(karte_note: Dict[str, Any]) -> List[str]:
    out = []
    for name in karte_note.get("technique_tags") or []:
        sfx = TECH_NAME_TO_SUFFIX.get(name)
        if sfx:
            out.append(sfx)
    return out


def _voices_of(karte_note: Dict[str, Any], expanded_el: Dict[str, Any]) -> List[Dict[str, Any]]:
    """構成音の列を作る。低い方から。単音は1つ。
    重音は R5 の chord_members (音価・弦・指つき) があればそれを、無ければ展開側の音名だけで組む。"""
    rep_string = karte_note.get("string_id") or UNKNOWN
    rep_finger = karte_note.get("finger")
    rep_finger = int(rep_finger) if rep_finger is not None else FINGER_UNKNOWN
    rep_type = karte_note.get("note_type") or UNKNOWN
    rep_dot = bool(karte_note.get("is_dotted"))
    rep_dur = karte_note.get("duration_beats")
    rep_dur = float(rep_dur) if rep_dur is not None else 0.0

    if not karte_note.get("is_chord"):
        return [_voice(pitch_name(karte_note.get("step"), karte_note.get("alter"), karte_note.get("octave")),
                       rep_string, rep_finger, rep_type, rep_dot, rep_dur)]

    members = karte_note.get("chord_members")
    voices: List[Tuple[int, Dict[str, Any]]] = []
    if members:
        for m in members:
            midi = m.get("midi")
            if midi is None:
                continue
            f = m.get("finger")
            voices.append((int(midi), _voice(
                pitch_name(m.get("step"), m.get("alter"), m.get("octave")),
                m.get("string_id") or UNKNOWN,
                int(f) if f is not None else FINGER_UNKNOWN,
                m.get("note_type") or rep_type,
                bool(m.get("is_dotted")) if m.get("is_dotted") is not None else rep_dot,
                float(m["duration_beats"]) if m.get("duration_beats") is not None else rep_dur,
            )))
    else:
        # 旧カルテ (chord_members 無し): 展開側の音名で組む。弦と指は分からない
        midis = expanded_el.get("midis") or karte_note.get("chord_midis") or []
        names = expanded_el.get("names") or []
        for i, midi in enumerate(midis):
            nm = pitch_name_from_music21(names[i]) if i < len(names) else UNKNOWN
            voices.append((int(midi), _voice(nm, UNKNOWN, FINGER_UNKNOWN, rep_type, rep_dot, rep_dur)))
    voices.sort(key=lambda t: t[0])
    out = [v for _, v in voices]
    if not out:
        out = [_voice(pitch_name(karte_note.get("step"), karte_note.get("alter"), karte_note.get("octave")),
                      rep_string, rep_finger, rep_type, rep_dot, rep_dur)]
    return out[:MAX_VOICES]


def _token(is_rest: bool, midis: Iterable[int]) -> str:
    return "R" if is_rest else "N" + ",".join(str(m) for m in sorted(set(int(x) for x in midis)))


def align_written_to_karte(written: List[Dict[str, Any]], karte_seq: List[Dict[str, Any]]) -> Tuple[List[Optional[int]], int]:
    """music21 が読んだ記譜の要素列と、カルテの音の列を突き合わせる (ordinal → karte の位置)。
    要素数が同じで各要素の休符/音高が一致すれば 1:1。ずれがあれば difflib で最長一致を取り、
    合わない要素は None (その音は並びに載らない)。戻り = (対応表, 合わなかった要素数)。
    ずれの原因は、装飾音の扱い・多声部・段の違いなど、2つの読み手 (XML 直読みと music21) の差。"""
    import difflib
    wt = [_token(w.get("is_rest", False), w.get("midis") or []) for w in written]
    kt = [_token(bool(k.get("is_rest")), k.get("chord_midis") or ([k["midi"]] if k.get("midi") is not None else [])) for k in karte_seq]
    if wt == kt:
        return list(range(len(written))), 0

    # 重音は片側が代表音だけのことがある: 先頭音だけの表記で比べる
    def head(tok: str) -> str:
        return tok if tok == "R" else "N" + tok[1:].split(",")[0]
    sm = difflib.SequenceMatcher(a=[head(t) for t in wt], b=[head(t) for t in kt], autojunk=False)
    mapping: List[Optional[int]] = [None] * len(written)
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            for d in range(i2 - i1):
                mapping[i1 + d] = j1 + d
    unmatched = sum(1 for m in mapping if m is None)
    return mapping, unmatched


def build_score_notes(
    expanded: List[Dict[str, Any]],
    expanded_to_orig: List[Optional[int]],
    n_orig: int,
    karte_notes: List[Dict[str, Any]],
    seconds_per_quarter: Optional[float],
    written: Optional[List[Dict[str, Any]]] = None,
) -> Tuple[List[Dict[str, Any]], Dict[str, Dict[str, Any]], str]:
    """展開後の並び (演奏順) を、記譜のカルテの属性で組む。

    expanded[i]         演奏順 i 番目の要素 (休符も含む・装飾音は含まない):
                        {"is_rest", "is_chord", "midis":[int], "names":[str],
                         "quarter_length": float, "tuplet_actual": int|None, "tuplet_normal": int|None}
    expanded_to_orig[i] その要素が記譜の何番目 (ordinal) の要素か。derivation で解決。None = 不明
    n_orig              記譜の要素数 (休符含む・装飾音除く)
    karte_notes         記譜順のカルテ (dataclasses.asdict 済み)
    戻り: (rows, profiles_by_key, status)。status != "ok" のとき rows は空。
    """
    # 記譜の ordinal → カルテ音。カルテは装飾音も index を持つが music21 側は duration 0 を飛ばすので揃える
    karte_seq = [n for n in karte_notes if not n.get("is_grace")]
    if len(expanded) != len(expanded_to_orig):
        return [], {}, f"length_mismatch:expanded={len(expanded)},map={len(expanded_to_orig)}"
    unmatched = 0
    if written is not None:
        if len(written) != n_orig:
            return [], {}, f"written_mismatch:written={len(written)},n_orig={n_orig}"
        orig_to_karte, unmatched = align_written_to_karte(written, karte_seq)
        # 半分以上合わないなら別のパートを読んでいる。並びなしにする
        if n_orig and unmatched * 2 > n_orig:
            return [], {}, f"align_failed:unmatched={unmatched}/{n_orig}"
    else:
        if len(karte_seq) != n_orig:
            return [], {}, f"ordinal_mismatch:karte={len(karte_seq)},music21={n_orig}"
        orig_to_karte = list(range(n_orig))

    # 1周目: 各要素をカルテ音に対応づけ、整合を確かめる。合わない要素は並びに載せない (None)
    linked: List[Optional[Dict[str, Any]]] = []
    dropped = 0
    for i, el in enumerate(expanded):
        o = expanded_to_orig[i]
        if o is None or o < 0 or o >= len(orig_to_karte) or orig_to_karte[o] is None:
            if written is None:
                return [], {}, f"unresolved:{i}"
            linked.append(None); dropped += 1
            continue
        k = karte_seq[orig_to_karte[o]]
        if bool(el.get("is_rest")) != bool(k.get("is_rest")):
            if written is None:
                return [], {}, f"rest_mismatch:{i}"
            linked.append(None); dropped += 1
            continue
        if not el.get("is_rest"):
            midis = el.get("midis") or []
            kmidi = k.get("midi")
            kall = set(k.get("chord_midis") or ([kmidi] if kmidi is not None else []))
            if midis and kmidi is not None and not (set(midis) & kall):
                if written is None:
                    return [], {}, f"pitch_mismatch:{i}"
                linked.append(None); dropped += 1
                continue
        linked.append(k)

    # 2周目: 演奏順で 前の音・手のポジション・直前休符・連続重音 を決めて行を作る
    rows: List[Dict[str, Any]] = []
    profiles: Dict[str, Dict[str, Any]] = {}
    prev_key: Optional[str] = None      # 前の単音のかたち (重音は相手にしない)
    hand_position: Optional[int] = None
    rest_accum = 0.0
    occ: Dict[int, int] = {}
    non_rest_idx = [i for i, el in enumerate(expanded) if not el.get("is_rest") and linked[i] is not None]
    is_chord_at = {i: bool(expanded[i].get("is_chord") or (linked[i] or {}).get("is_chord")) for i in non_rest_idx}
    pos_in_list = {i: p for p, i in enumerate(non_rest_idx)}

    for i, el in enumerate(expanded):
        k = linked[i]
        if k is None:
            # 対応づかなかった要素。休符なら長さを music21 の値 (四分音符単位) で足す
            if el.get("is_rest"):
                rest_accum += float(el.get("quarter_length") or 0.0)
            else:
                rest_accum = 0.0
                prev_key = None  # つながりが切れるので、次の音の前の音は分からない扱い
            continue
        if el.get("is_rest"):
            rest_accum += float(k.get("duration_beats") or 0.0)
            continue
        # 手のポジション (R2 / F16)
        #   低信頼の音        → 不明 (-1)。手のポジションも分からなくなるので引き継ぎを切る
        #   開放弦 (position None, 低信頼でない) → 直前の手のポジションを引き継ぐ
        #   それ以外          → その音のポジションが新しい手のポジション
        kpos = k.get("position")
        if k.get("position_confidence") == "low":
            hand_position = None
            position = POS_UNKNOWN
        else:
            if kpos is not None:
                hand_position = int(kpos)
            position = hand_position if hand_position is not None else POS_UNKNOWN
        # 連続重音: 前後の非休符が重音か
        p = pos_in_list[i]
        neighbor_chord = False
        if is_chord_at[i]:
            if p > 0 and is_chord_at[non_rest_idx[p - 1]]:
                neighbor_chord = True
            if p + 1 < len(non_rest_idx) and is_chord_at[non_rest_idx[p + 1]]:
                neighbor_chord = True
        prof = make_profile(
            _voices_of(k, el),
            position=position,
            techs=_techs_of(k),
            tuplet_actual=el.get("tuplet_actual") or 0,
            tuplet_normal=el.get("tuplet_normal") or 0,
            on_beat=bool(k.get("is_on_beat")),
            chord_cont=neighbor_chord,
            rest_before=rest_accum,
        )
        profiles[prof["key"]] = prof
        wi = int(k["note_index"])
        occ[wi] = occ.get(wi, 0) + 1
        ql = el.get("quarter_length")
        dur_sec = (float(ql) * float(seconds_per_quarter)) if (ql is not None and seconds_per_quarter) else None
        rows.append({
            "noteIndex": i,
            "writtenNoteIndex": wi,
            "measure": int(k.get("measure_number") if k.get("measure_number") is not None else (k.get("measure_index") or 0) + 1),
            "pass": occ[wi],
            "profileKey": prof["key"],
            "prevProfileKey": prev_key,
            "durationSec": dur_sec,
            "beatOffset": float(k.get("beat_offset") or 0.0),
        })
        rest_accum = 0.0
        if not is_chord_at[i]:
            prev_key = prof["key"]
    status = "ok" if (unmatched == 0 and dropped == 0) else f"ok_partial:unmatched={unmatched},dropped={dropped}"
    return rows, profiles, status


def score_version(rows: List[Dict[str, Any]]) -> str:
    """並びの指紋。行の (演奏順, かたちの key, 前のかたちの key) から作る。
    DB の id ではなく key を使うので、環境や採番に依らず同じ並びは同じ版になる。"""
    s = "|".join(f"{r['noteIndex']}:{r['profileKey']}:{r['prevProfileKey'] or ''}" for r in rows)
    return hashlib.sha1(s.encode("utf-8")).hexdigest()[:16]


# ───────────────────────── 保存 (psycopg2 cursor) ─────────────────────────

_PROFILE_DB_COLUMNS = ["version", "key"] + PROFILE_COLUMNS


def upsert_profiles(cur, profiles: Dict[str, Dict[str, Any]]) -> Dict[str, int]:
    """かたちを get-or-create。全列一意 (key) + ON CONFLICT DO NOTHING → SELECT。並走しても同じ組は同じ id。"""
    if not profiles:
        return {}
    cols = ", ".join(f'"{c}"' for c in _PROFILE_DB_COLUMNS)
    placeholders = ", ".join(["%s"] * len(_PROFILE_DB_COLUMNS))
    sql = f'INSERT INTO "NoteProfile" ({cols}) VALUES ({placeholders}) ON CONFLICT ("key") DO NOTHING'
    # F17: 並走する解析が同じかたちを別の順で INSERT すると、一意索引の行ロックを互いに待ち合って
    # デッドロックになる (2026-09-05 教材1,014件の再解析で12並列中4件が失敗)。key の順に入れて
    # ロックの取得順を揃える。これで待ちはあっても行き止まりにはならない。
    for key in sorted(profiles):
        p = profiles[key]
        cur.execute(sql, [p[c] for c in _PROFILE_DB_COLUMNS])
    keys = list(profiles.keys())
    cur.execute('SELECT "key", id FROM "NoteProfile" WHERE "key" = ANY(%s)', (keys,))
    key_to_id = {k: i for k, i in cur.fetchall()}
    missing = [k for k in keys if k not in key_to_id]
    if missing:
        raise RuntimeError(f"NoteProfile の取得に失敗: {len(missing)}件")
    return key_to_id


def save_score_notes(cur, target_type: str, target_id: str,
                     rows: List[Dict[str, Any]], profiles: Dict[str, Dict[str, Any]]) -> str:
    """その曲/教材の並びを消して書き直し、版の指紋を Score/PracticeItem.scoreNoteVersion に書く。
    失敗は例外で返す (WARNING で握りつぶさない)。呼び手のトランザクションで囲むこと。"""
    if target_type not in ("score", "practice"):
        raise ValueError(target_type)
    key_to_id = upsert_profiles(cur, profiles)
    cur.execute('DELETE FROM "ScoreNote" WHERE "targetType" = %s::"ScoreNoteTarget" AND "targetId" = %s', (target_type, target_id))
    sql = ('INSERT INTO "ScoreNote" ("targetType","targetId","noteIndex","writtenNoteIndex","measure","pass",'
           '"profileId","prevProfileId","durationSec","beatOffset") '
           'VALUES (%s::"ScoreNoteTarget",%s,%s,%s,%s,%s,%s,%s,%s,%s)')
    for r in rows:
        cur.execute(sql, (target_type, target_id, r["noteIndex"], r["writtenNoteIndex"], r["measure"], r["pass"],
                          key_to_id[r["profileKey"]], key_to_id.get(r["prevProfileKey"]) if r["prevProfileKey"] else None,
                          r["durationSec"], r["beatOffset"]))
    version = score_version(rows)
    table = "Score" if target_type == "score" else "PracticeItem"
    cur.execute(f'UPDATE "{table}" SET "scoreNoteVersion" = %s WHERE id = %s', (version, target_id))
    return version


def clear_score_notes(cur, target_type: str, target_id: str, reason: str) -> None:
    """並びが組めなかったとき: 古い並びを消し、版を無しにする (演奏はこの曲では集計されない)。"""
    cur.execute('DELETE FROM "ScoreNote" WHERE "targetType" = %s::"ScoreNoteTarget" AND "targetId" = %s', (target_type, target_id))
    table = "Score" if target_type == "score" else "PracticeItem"
    cur.execute(f'UPDATE "{table}" SET "scoreNoteVersion" = NULL WHERE id = %s', (target_id,))
    print(f"[note_store] 並びなし ({target_type} {target_id}): {reason}")


# ───────────────────────── 明細 ─────────────────────────

# comparison_result.json の項目 → 列。全項目を落とさない (項目が増えたら足す)。
_COMPARISON_FIELDS = [
    ("measure_number", "measureNumber", int), ("note_name", "noteName", str),
    ("pitch_ok", "pitchOk", bool), ("start_ok", "startOk", bool),
    ("pitch_cents_error", "pitchCentsError", float), ("start_diff_sec", "startDiffSec", float),
    ("expected_start_sec", "expectedStartSec", float), ("expected_end_sec", "expectedEndSec", float),
    ("expected_pitch_hz", "expectedPitchHz", float),
    ("detected_start_sec", "detectedStartSec", float), ("detected_end_sec", "detectedEndSec", float),
    ("detected_pitch_hz", "detectedPitchHz", float), ("timing_from_start_sec", "timingFromStartSec", float),
    ("match_confidence", "matchConfidence", float), ("valid_frames", "validFrames", int),
    ("global_shift_sec", "globalShiftSec", float), ("current_shift_sec", "currentShiftSec", float),
    ("onset_count_in_note", "onsetCountInNote", int), ("onset_rate_per_sec", "onsetRatePerSec", float),
    ("pitch_alt_count", "pitchAltCount", int), ("pitch_alt_semitones", "pitchAltSemitones", float),
    ("amp_stroke_count", "ampStrokeCount", int), ("attack_peak_frac", "attackPeakFrac", float),
    ("decay_ratio", "decayRatio", float), ("gliss_range_semitones", "glissRangeSemitones", float),
    ("gliss_monotonic_frac", "glissMonotonicFrac", float), ("gliss_direction", "glissDirection", str),
]
PERFORMANCE_NOTE_COLUMNS = (
    ["performanceKind", "performanceId", "noteIndex", "evaluationStatus"]
    + [c for _, c, _ in _COMPARISON_FIELDS]
    + [f"expectedHz{i}" for i in range(1, 5)] + [f"detectedHz{i}" for i in range(1, 5)]
    + [f"cents{i}" for i in range(1, 5)] + [f"pitchOk{i}" for i in range(1, 5)] + [f"presenceOk{i}" for i in range(1, 5)]
    + ["playedSec", "durRatio"]
)


def _cast(v, typ):
    if v is None:
        return None
    try:
        if typ is bool:
            return bool(v)
        if typ is int:
            return int(v)
        if typ is float:
            return float(v)
        return str(v)
    except (TypeError, ValueError):
        return None


def build_performance_notes(comp_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """comparison の各行を PerformanceNote の1行に写す。全項目。"""
    rows = []
    for r in comp_results:
        ni = r.get("note_index")
        if ni is None:
            continue
        row: Dict[str, Any] = {"noteIndex": int(ni), "evaluationStatus": str(r.get("evaluation_status") or "unknown")}
        for src, dst, typ in _COMPARISON_FIELDS:
            row[dst] = _cast(r.get(src), typ)
        pitches = r.get("pitches") or []
        for i in range(1, MAX_VOICES + 1):
            p = pitches[i - 1] if i <= len(pitches) and isinstance(pitches[i - 1], dict) else {}
            row[f"expectedHz{i}"] = _cast(p.get("expected_pitch_hz"), float)
            row[f"detectedHz{i}"] = _cast(p.get("detected_pitch_hz"), float)
            row[f"cents{i}"] = _cast(p.get("pitch_cents_error"), float)
            row[f"pitchOk{i}"] = _cast(p.get("pitch_ok"), bool)
            row[f"presenceOk{i}"] = _cast(p.get("presence_ok"), bool)
        ds, de = row["detectedStartSec"], row["detectedEndSec"]
        es, ee = row["expectedStartSec"], row["expectedEndSec"]
        played = (de - ds) if (ds is not None and de is not None and de > ds) else None
        row["playedSec"] = played
        expected = (ee - es) if (es is not None and ee is not None and ee > es) else None
        row["durRatio"] = (played / expected) if (played is not None and expected) else None
        rows.append(row)
    return rows


def save_performance_notes(cur, kind: str, performance_id: str, rows: List[Dict[str, Any]],
                           target_type: str, target_id: str) -> Optional[str]:
    """その演奏の明細を消して書き直し、採点したときの並びの版を演奏に書く。
    並びの版が無い (並びが組めていない曲) なら version は None で、集計から除かれる。"""
    if kind not in ("score", "practice"):
        raise ValueError(kind)
    cur.execute('DELETE FROM "PerformanceNote" WHERE "performanceKind" = %s::"PerformanceKind" AND "performanceId" = %s', (kind, performance_id))
    cols = ", ".join(f'"{c}"' for c in PERFORMANCE_NOTE_COLUMNS)
    ph = ", ".join(['%s::"PerformanceKind"'] + ["%s"] * (len(PERFORMANCE_NOTE_COLUMNS) - 1))
    sql = f'INSERT INTO "PerformanceNote" ({cols}) VALUES ({ph})'
    for r in rows:
        r2 = dict(r)
        r2["performanceKind"] = kind
        r2["performanceId"] = performance_id
        cur.execute(sql, [r2.get(c) for c in PERFORMANCE_NOTE_COLUMNS])
    src_table = "Score" if target_type == "score" else "PracticeItem"
    cur.execute(f'SELECT "scoreNoteVersion" FROM "{src_table}" WHERE id = %s', (target_id,))
    row = cur.fetchone()
    version = row[0] if row else None
    perf_table = "Performance" if kind == "score" else "PracticePerformance"
    cur.execute(f'UPDATE "{perf_table}" SET "scoreNoteVersion" = %s WHERE id = %s', (version, performance_id))
    return version


def delete_performance_notes(cur, kind: str, performance_id: str) -> None:
    cur.execute('DELETE FROM "PerformanceNote" WHERE "performanceKind" = %s::"PerformanceKind" AND "performanceId" = %s', (kind, performance_id))


# ───────────────────────── 教材側の束の出現回数 (派生表) ─────────────────────────
# 2026-09-05 Tetsuo: 「毎回計算するのはナンセンス。表に持ち、楽譜が変わったときだけ書き直す」。
# 正は ScoreNote。ここは読み手 (app/_libs/noteStore.ts の groupKeysOf) と同じ束の定義で数えた写し。
# 束の定義を変えるときは両方を同時に変え、rebuild_material_bundle_counts.py で全件作り直す。

FAST_SWITCH_SEC = 0.3
BUNDLE_VERSION = 1
TECH_BUNDLE = {t: TECH_COLUMNS[t] for t in TECHS}
_LETTERS = "CDEFGAB"


def _diatonic(pitch: str) -> Optional[int]:
    """"F#4" → 全音階上の位置 (度数計算用)。unknown/none は None"""
    if pitch in (UNKNOWN, NONE) or not pitch:
        return None
    step = pitch[0]
    i = 1
    while i < len(pitch) and pitch[i] in "#b":
        i += 1
    try:
        return _LETTERS.index(step) + 7 * int(pitch[i:])
    except (ValueError, IndexError):
        return None


def chord_interval_label(p_low: str, p_high: str) -> str:
    """隣り合う構成音の度数 → 3度 4度 5度 6度 オクターブ その他 (piece_summary と同じ名前)"""
    a, b = _diatonic(p_low), _diatonic(p_high)
    if a is None or b is None:
        return "その他"
    deg = abs(b - a) + 1
    return {3: "3度", 4: "4度", 5: "5度", 6: "6度", 8: "オクターブ"}.get(deg, "その他")


def bundle_keys(cur: Dict[str, Any], prev: Optional[Dict[str, Any]], prev_duration_sec: Optional[float]) -> List[str]:
    """1音がどの束に入るか。cur/prev はかたち (profile dict)。prev_duration_sec は前の音の秒 (教材の想定テンポ)。
    読み手 app/_libs/noteStore.ts の groupKeysOf と同じ定義。増やすときは BUNDLE_VERSION を上げる。"""
    keys: List[str] = []
    if cur["pitch1"] != UNKNOWN:
        keys.append(f"note|{cur['pitch1']}")
    if prev is not None and prev["pitch1"] != UNKNOWN and cur["pitch1"] != UNKNOWN:
        keys.append(f"pitch|{prev['pitch1']}|{cur['pitch1']}")
        if (prev["finger1"] > 0 and cur["finger1"] > 0 and prev["pitch1"] != cur["pitch1"]
                and cur["restBefore"] == 0 and prev_duration_sec is not None and prev_duration_sec < FAST_SWITCH_SEC):
            keys.append(f"fingering|{prev['pitch1']}|{cur['pitch1']}")
    if prev is not None and prev["position"] != POS_UNKNOWN and cur["position"] != POS_UNKNOWN and prev["position"] != cur["position"]:
        keys.append(f"position|{prev['position']}|{cur['position']}")
    for t, col in TECH_BUNDLE.items():
        if cur.get(col):
            keys.append(f"technique|{t}")
    n = int(cur.get("noteCount") or 1)
    if n > 1:
        pitches = [cur.get(f"pitch{i}") for i in range(1, n + 1)]
        for lo, hi in zip(pitches, pitches[1:]):
            keys.append(f"chord|{chord_interval_label(lo, hi)}")
    return keys


def split_bundle_key(key: str) -> Tuple[str, str, str]:
    """"pitch|G4|C5" → (kind, from, to)。2要素のキーは from = "" """
    parts = key.split("|")
    if len(parts) == 3:
        return parts[0], parts[1], parts[2]
    return parts[0], "", parts[1] if len(parts) > 1 else ""


def material_bundle_counts(rows: List[Dict[str, Any]], profiles: Dict[str, Dict[str, Any]]) -> Dict[str, int]:
    """build_score_notes の rows/profiles から束ごとの回数を数える。
    前の音の秒は、並びで直前の行 (休符は行にならないので直前の音) の durationSec。"""
    counts: Dict[str, int] = {}
    prev_dur: Optional[float] = None
    for r in rows:
        cur = profiles[r["profileKey"]]
        prev = profiles.get(r["prevProfileKey"]) if r.get("prevProfileKey") else None
        for k in bundle_keys(cur, prev, prev_dur):
            counts[k] = counts.get(k, 0) + 1
        prev_dur = r.get("durationSec")
    return counts


def save_material_bundle_counts(cur, target_id: str, counts: Dict[str, int], note_total: int, score_note_version: str) -> None:
    """教材の束の回数を消して書き直す。写しを作った時点の並びの版も書く。"""
    cur.execute('DELETE FROM "MaterialBundleCount" WHERE "targetId" = %s', (target_id,))
    for key in sorted(counts):
        kind, frm, to = split_bundle_key(key)
        cur.execute('INSERT INTO "MaterialBundleCount" ("targetId", "bundleKey", kind, "fromValue", "toValue", count, "noteTotal", "scoreNoteVersion", "bundleVersion", "updatedAt") '
                    'VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())',
                    (target_id, key, kind, frm, to, counts[key], note_total, score_note_version, BUNDLE_VERSION))


def clear_material_bundle_counts(cur, target_id: str) -> None:
    cur.execute('DELETE FROM "MaterialBundleCount" WHERE "targetId" = %s', (target_id,))
