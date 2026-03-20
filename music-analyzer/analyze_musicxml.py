from __future__ import annotations

import sys
import json
import os
import copy
import tempfile
from typing import Any, Dict, List
import requests
import psycopg2
from dotenv import load_dotenv
from music21 import (
    converter,
    note,
    chord,
    instrument,
    dynamics,
    articulations,
    expressions,
    spanner,
    repeat,
    tempo,
    pitch as m21pitch,
)

# =========================
# 引数取得
# =========================
IS_PRACTICE_ITEM = "--practice-item" in sys.argv

if IS_PRACTICE_ITEM:
    PRACTICE_ITEM_ID = sys.argv[sys.argv.index("--practice-item") + 1]
    USER_ID = None
    SCORE_ID = None
else:
    if len(sys.argv) < 3:
        raise Exception("Usage: python analyze_musicxml.py USER_ID SCORE_ID  or  --practice-item ITEM_ID")
    USER_ID = sys.argv[1]
    SCORE_ID = sys.argv[2]

# =========================
# ENV
# =========================
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
BUCKET_NAME = os.getenv("BUCKET_NAME")
DATABASE_URL = os.getenv("DATABASE_URL")

if not all([SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BUCKET_NAME, DATABASE_URL]):
    raise Exception("ENV不足")

# =========================
# ヘルパー: 周波数→音名変換
# =========================
def freq_to_note_name(freq: float) -> str:
    """周波数からC4, A#5等の音名を返す"""
    try:
        p = m21pitch.Pitch()
        p.frequency = freq
        return p.nameWithOctave
    except Exception:
        return ""

# =========================
# DB接続
# =========================
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

try:
    # ステータス更新（processing）
    if IS_PRACTICE_ITEM:
        cur.execute("""
            UPDATE "PracticeItem"
            SET "analysisStatus" = 'processing'
            WHERE id = %s
            RETURNING "originalXmlPath"
        """, (PRACTICE_ITEM_ID,))
    else:
        cur.execute("""
            UPDATE "Score"
            SET "analysisStatus" = 'processing'
            WHERE id = %s AND "createdById" = %s
            RETURNING "originalXmlPath"
        """, (SCORE_ID, USER_ID))

    row = cur.fetchone()

    if not row:
        raise Exception("Score not found or unauthorized")

    xml_storage_path = row[0]
    conn.commit()

    # =========================
    # StorageからXML取得
    # =========================
    download_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{xml_storage_path}"

    res = requests.get(
        download_url,
        headers={"Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}"}
    )

    print("DOWNLOAD STATUS:", res.status_code)
    print("FIRST 20 BYTES:", res.content[:20])

    if res.status_code != 200:
        raise Exception(f"XML download failed: {res.text}")

    # 先頭バイトでZIP(.mxl)かXMLかを判定
    original_ext = os.path.splitext(xml_storage_path)[1]
    if res.content[:2] == b'PK':
        original_ext = ".mxl"

    with tempfile.NamedTemporaryFile(
        suffix=original_ext,
        delete=False
    ) as tmp:
        tmp_path = tmp.name
        tmp.write(res.content)

    score = converter.parse(tmp_path)
    os.remove(tmp_path)

    # =========================
    # BPM
    # =========================
    def extract_bpm(sc) -> float:
        for mm in sc.recurse().getElementsByClass(tempo.MetronomeMark):
            if mm.number is not None:
                return float(mm.number)
        for ti in sc.recurse().getElementsByClass(tempo.TempoIndication):
            if hasattr(ti, 'number') and ti.number is not None:
                return float(ti.number)
        print("WARNING: No tempo marking found. Using default BPM=90")
        return 90.0

    BPM = extract_bpm(score)
    SECONDS_PER_QUARTER = 60.0 / BPM
    print(f"BPM: {BPM}")

    # =========================
    # 楽器検出
    # =========================
    def detect_instrument(sc) -> str:
        """楽譜から楽器名を推定する"""
        for p in sc.parts:
            inst = p.getInstrument()
            if inst:
                name = getattr(inst, "instrumentName", None)
                if name:
                    return name.lower()
                best = inst.bestName()
                if best:
                    return best.lower()
        return "unknown"

    instrument_name = detect_instrument(score)
    print(f"Instrument: {instrument_name}")

    # =========================
    # Violinパート選択（既存ロジックそのまま）
    # =========================
    def select_violin_part(sc):
        parts = sc.parts
        if len(parts) == 1:
            return parts[0]
        for p in parts:
            name_candidates = [
                p.partName,
                getattr(p.getInstrument(), "instrumentName", None),
                p.getInstrument().bestName(),
            ]
            for name in name_candidates:
                if name and "violin" in name.lower():
                    return p
        for p in parts:
            if isinstance(p.getInstrument(), instrument.StringInstrument):
                return p
        return parts[0]

    part = select_violin_part(score)

    # =========================
    # Repeat展開（既存ロジック維持）
    # =========================
    def expand_to_performance_part(original_part):
        try:
            exp = repeat.Expander(original_part)
            expanded = exp.process()
            if hasattr(expanded, "parts") and len(expanded.parts) > 0:
                expanded_part = expanded.parts[0]
            else:
                expanded_part = expanded
            return copy.deepcopy(expanded_part)
        except Exception:
            try:
                return copy.deepcopy(original_part.expandRepeats())
            except Exception:
                return copy.deepcopy(original_part)

    performance_part = expand_to_performance_part(part)

    key_obj = score.analyze("key")
    time_sig = next(score.recurse().getElementsByClass("TimeSignature"), None)

    # =========================
    # ノート走査（設計書に合わせて拡張）
    # =========================
    note_results: List[Dict[str, Any]] = []
    note_index = 0

    for measure in performance_part.getElementsByClass("Measure"):
        measure_number = int(measure.number)

        measure_dynamics: Dict[float, str] = {}
        for d in measure.getElementsByClass(dynamics.Dynamic):
            measure_dynamics[float(d.offset)] = d.value

        for element in measure.notesAndRests:
            duration_quarter = float(element.duration.quarterLength)
            if duration_quarter == 0:
                continue

            global_offset = float(measure.offset + element.offset)
            start_time_sec = global_offset * SECONDS_PER_QUARTER
            end_time_sec = (global_offset + duration_quarter) * SECONDS_PER_QUARTER

            if isinstance(element, note.Rest):
                note_results.append({
                    "note_index": note_index,
                    "type": "rest",
                    "pitches": [],
                    "note_name": "",
                    "start_time_sec": start_time_sec,
                    "end_time_sec": end_time_sec,
                    "measure_number": measure_number,
                    "articulations": [],
                    "dynamic": None,
                    "is_tied": False,
                    "is_tremolo": False,
                    "is_trill": False,
                    "is_chord": False,
                })
                note_index += 1
                continue

            # ピッチ抽出
            pitches: List[float] = []
            note_name_str = ""
            is_chord_flag = False

            if isinstance(element, note.Note):
                pitches = [float(element.pitch.frequency)]
                note_name_str = element.pitch.nameWithOctave
            elif isinstance(element, chord.Chord):
                pitches = [float(p.frequency) for p in element.pitches]
                note_name_str = "/".join(p.nameWithOctave for p in element.pitches)
                is_chord_flag = True
            else:
                continue

            # アーティキュレーション
            articulation_list: List[str] = [type(a).__name__ for a in element.articulations]
            dyn = measure_dynamics.get(float(element.offset))

            # タイ検出
            is_tied = False
            if hasattr(element, 'tie') and element.tie is not None:
                # tie.type: 'start', 'continue', 'stop'
                # 'continue' or 'stop' = このノートは前のノートとタイで繋がっている
                if element.tie.type in ('continue', 'stop'):
                    is_tied = True

            # トレモロ検出
            is_tremolo = False
            if hasattr(element, 'expressions'):
                for expr in element.expressions:
                    if isinstance(expr, expressions.Tremolo):
                        is_tremolo = True
                        break

            # トリル検出
            is_trill = False
            if hasattr(element, 'expressions'):
                for expr in element.expressions:
                    if isinstance(expr, expressions.Trill):
                        is_trill = True
                        break

            note_results.append({
                "note_index": note_index,
                "type": "note",
                "pitches": pitches,
                "note_name": note_name_str,
                "start_time_sec": start_time_sec,
                "end_time_sec": end_time_sec,
                "measure_number": measure_number,
                "articulations": articulation_list,
                "dynamic": dyn,
                "is_tied": is_tied,
                "is_tremolo": is_tremolo,
                "is_trill": is_trill,
                "is_chord": is_chord_flag,
            })

            note_index += 1

    analysis_result = {
        "bpm": BPM,
        "seconds_per_quarter": SECONDS_PER_QUARTER,
        "instrument": instrument_name,
        "key": {"tonic": key_obj.tonic.name, "mode": key_obj.mode},
        "time_signature": {
            "numerator": time_sig.numerator if time_sig else 4,
            "denominator": time_sig.denominator if time_sig else 4,
        },
        "notes": note_results,
    }

    analysis_json = json.dumps(analysis_result)

    # =========================
    # Storageへ直接アップロード
    # =========================
    if IS_PRACTICE_ITEM:
        upload_storage_path = f"practice/{PRACTICE_ITEM_ID}/analysis.json"
    else:
        upload_storage_path = f"{USER_ID}/{SCORE_ID}/analysis.json"
    upload_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{upload_storage_path}"

    upload_res = requests.post(
        upload_url,
        headers={
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json",
        },
        data=analysis_json.encode("utf-8"),
    )

    if upload_res.status_code not in [200, 201]:
        # 既に存在する場合はPUTで上書き
        upload_res = requests.put(
            upload_url,
            headers={
                "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                "Content-Type": "application/json",
            },
            data=analysis_json.encode("utf-8"),
        )
        if upload_res.status_code not in [200, 201]:
            raise Exception(f"analysis upload failed: {upload_res.text}")

    # ステータス更新（done）
    if IS_PRACTICE_ITEM:
        cur.execute("""
            UPDATE "PracticeItem"
            SET "analysisStatus" = 'done', "analysisPath" = %s
            WHERE id = %s
        """, (upload_storage_path, PRACTICE_ITEM_ID))
    else:
        cur.execute("""
            UPDATE "Score"
            SET "analysisStatus" = 'done'
            WHERE id = %s
        """, (SCORE_ID,))
    conn.commit()

    print("Analysis complete")

except Exception as e:
    conn.rollback()
    if IS_PRACTICE_ITEM:
        cur.execute("""
            UPDATE "PracticeItem"
            SET "analysisStatus" = 'error'
            WHERE id = %s
        """, (PRACTICE_ITEM_ID,))
    else:
        cur.execute("""
            UPDATE "Score"
            SET "analysisStatus" = 'error'
            WHERE id = %s
        """, (SCORE_ID,))
    conn.commit()
    raise e

finally:
    cur.close()
    conn.close()
