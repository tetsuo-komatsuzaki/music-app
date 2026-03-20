from __future__ import annotations

import sys
import os
import json
import tempfile
import psycopg2
import requests
from dotenv import load_dotenv

# ここから下はあなたの既存 import を変更しない
from pathlib import Path
from fractions import Fraction
from typing import Any, Dict, List

from music21 import (
    stream,
    note,
    chord,
    tempo,
    clef,
    metadata,
    key,
    meter,
    dynamics,
    articulations,
    spanner,
    layout,
    instrument
)

# =========================
# 引数
# =========================
IS_PRACTICE_ITEM = "--practice-item" in sys.argv

if IS_PRACTICE_ITEM:
    PRACTICE_ITEM_ID = sys.argv[sys.argv.index("--practice-item") + 1]
    USER_ID = None
    SCORE_ID = None
else:
    if len(sys.argv) < 3:
        raise Exception("Usage: python build_score.py USER_ID SCORE_ID  or  --practice-item ITEM_ID")
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

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

try:
    # =========================
    # buildStatus → processing
    # =========================
    if IS_PRACTICE_ITEM:
        cur.execute("""
            UPDATE "PracticeItem"
            SET "buildStatus" = 'processing'
            WHERE id = %s
            RETURNING id
        """, (PRACTICE_ITEM_ID,))
    else:
        cur.execute("""
            UPDATE "Score"
            SET "buildStatus" = 'processing'
            WHERE id = %s AND "createdById" = %s
            RETURNING id
        """, (SCORE_ID, USER_ID))

    if not cur.fetchone():
        raise Exception("Score not found or unauthorized")

    conn.commit()

    # =========================
    # analysis.json を Storage から取得
    # =========================
    if IS_PRACTICE_ITEM:
        analysis_path = f"practice/{PRACTICE_ITEM_ID}/analysis.json"
    else:
        analysis_path = f"{USER_ID}/{SCORE_ID}/analysis.json"
    download_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{analysis_path}"

    res = requests.get(
        download_url,
        headers={"Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}"}
    )

    if res.status_code != 200:
        raise Exception(f"analysis.json download failed: {res.text}")

    analysis = json.loads(res.text)

    BPM = int(analysis["bpm"])
    note_results: List[Dict[str, Any]] = analysis["notes"]
    key_info = analysis["key"]
    time_sig_info = analysis["time_signature"]
    spanners_info = analysis.get("spanners", {"slurs": [], "hairpins": []})

    # =========================
    # ▼▼▼ ここから下は一切変更しない ▼▼▼
    # =========================

    def quantize_quarter_length(q: float, denom: int = 16) -> float:
        if q <= 0:
            return 0.25
        return float(Fraction(q).limit_denominator(denom))


    def build_score(note_results: List[Dict[str, Any]], bpm: int):
        score = stream.Score()
        score.insert(0, metadata.Metadata())
        score.metadata.title = "Pseudo Score (Analysis)"

        part = stream.Part()
        part.insert(0, clef.TrebleClef())
        part.insert(0, key.Key(key_info["tonic"], key_info["mode"]))
        part.insert(0, meter.TimeSignature(f'{time_sig_info["numerator"]}/{time_sig_info["denominator"]}'))
        part.insert(0, tempo.MetronomeMark(number=bpm))

        seconds_per_quarter = 60.0 / bpm

        index_to_element: Dict[int, Any] = {}

        for r in note_results:
            duration_sec = float(r["end_time_sec"]) - float(r["start_time_sec"])
            raw_quarter_length = duration_sec / seconds_per_quarter
            quarter_length = quantize_quarter_length(raw_quarter_length)

            if r["type"] == "rest":
                n = note.Rest()
            else:
                pitches = r.get("pitches", [])
                if len(pitches) <= 1:
                    n = note.Note()
                    if len(pitches) == 1:
                        n.pitch.frequency = float(pitches[0])
                else:
                    ps = []
                    for f in pitches:
                        tmp = note.Note()
                        tmp.pitch.frequency = float(f)
                        ps.append(tmp.pitch)
                    n = chord.Chord(ps)

            n.quarterLength = quarter_length

            for art_name in r.get("articulations", []):
                if art_name == "Fingering":
                    continue  # 運指番号なしだと"none"と表示されるためスキップ
                if hasattr(articulations, art_name):
                    n.articulations.append(getattr(articulations, art_name)())

            if r.get("dynamic"):
                part.append(dynamics.Dynamic(r["dynamic"]))

            part.append(n)
            index_to_element[int(r["note_index"])] = n

        for sl in spanners_info.get("slurs", []):
            s = int(sl["start"])
            e = int(sl["end"])
            if s in index_to_element and e in index_to_element and s < e:
                slur = spanner.Slur()
                for i in range(s, e + 1):
                    if i in index_to_element:
                        slur.addSpannedElements(index_to_element[i])
                score.insert(0, slur)

        for hp in spanners_info.get("hairpins", []):
            typ = hp.get("type")
            s = int(hp["start"])
            e = int(hp["end"])
            if not (s in index_to_element and e in index_to_element and s < e):
                continue

            if typ == "crescendo":
                hairpin = dynamics.Crescendo()
            elif typ == "diminuendo":
                hairpin = dynamics.Diminuendo()
            else:
                continue

            for i in range(s, e + 1):
                if i in index_to_element:
                    hairpin.addSpannedElements(index_to_element[i])

            score.insert(0, hairpin)

            # =========================
            # 1行4小節レイアウト
            # =========================

            measures = part.makeMeasures()

            for i, m in enumerate(measures.getElementsByClass(stream.Measure)):
                # 4小節ごとに改行
                if i != 0 and i % 4 == 0:
                    m.insert(0, layout.SystemLayout(isNew=True))

            part = measures

        score.append(part)
        return score

    build_score_obj = build_score(note_results, bpm=BPM)

    # =========================
    # ローカル永続保存を廃止
    # 一時ファイル → メモリ → 即アップロード
    # =========================
    # 一時ファイルを作る（閉じるため delete=False）
    with tempfile.NamedTemporaryFile(
        suffix=".musicxml",
        delete=False
    ) as tmp:
        tmp_path = tmp.name

    # ← ここで閉じられる

    # music21に書き込ませる
    build_score_obj.write("musicxml", tmp_path)

    # バイナリ読み込み
    with open(tmp_path, "rb") as f:
        xml_bytes = f.read()

    # 削除
    os.remove(tmp_path)

    if IS_PRACTICE_ITEM:
        build_path = f"practice/{PRACTICE_ITEM_ID}/build_score.musicxml"
    else:
        build_path = f"{USER_ID}/{SCORE_ID}/build_score.musicxml"
    upload_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{build_path}"

    upload_res = requests.post(
        upload_url,
        headers={
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/vnd.recordare.musicxml+xml",
        },
        data=xml_bytes,
    )

    if upload_res.status_code not in [200, 201]:
        # 既に存在する場合はPUTで上書き
        upload_res = requests.put(
            upload_url,
            headers={
                "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                "Content-Type": "application/vnd.recordare.musicxml+xml",
            },
            data=xml_bytes,
        )
        if upload_res.status_code not in [200, 201]:
            raise Exception(f"build upload failed: {upload_res.text}")

    # DB更新
    if IS_PRACTICE_ITEM:
        cur.execute("""
            UPDATE "PracticeItem"
            SET "buildStatus" = 'done',
                "generatedXmlPath" = %s
            WHERE id = %s
        """, (build_path, PRACTICE_ITEM_ID))
    else:
        cur.execute("""
            UPDATE "Score"
            SET "buildStatus" = 'done',
                "generatedXmlPath" = %s
            WHERE id = %s
        """, (build_path, SCORE_ID))
    conn.commit()

    print("Build complete")

except Exception as e:
    conn.rollback()
    if IS_PRACTICE_ITEM:
        cur.execute("""
            UPDATE "PracticeItem"
            SET "buildStatus" = 'error'
            WHERE id = %s
        """, (PRACTICE_ITEM_ID,))
    else:
        cur.execute("""
            UPDATE "Score"
            SET "buildStatus" = 'error'
            WHERE id = %s
        """, (SCORE_ID,))
    conn.commit()
    raise e

finally:
    cur.close()
    conn.close()