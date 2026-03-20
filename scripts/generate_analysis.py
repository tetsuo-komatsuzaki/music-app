# -*- coding: utf-8 -*-
"""
936件のMXLファイルからanalysis.jsonを生成してSupabase Storageにアップロードし、DBを更新する
"""
import sys, io, os, json, zipfile, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import requests
import psycopg2
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")
BUCKET = "musicxml"

NOTE_TO_SEMITONE = {"C":0,"D":2,"E":4,"F":5,"G":7,"A":9,"B":11}

def parse_musicxml_notes(xml_content):
    """MusicXML文字列からノート情報を抽出"""
    notes = []
    note_index = 0

    # テンポ取得
    tempo_match = re.search(r'<sound tempo="(\d+)"', xml_content)
    bpm = int(tempo_match.group(1)) if tempo_match else 90
    seconds_per_quarter = 60.0 / bpm

    # 拍子取得
    beats_match = re.search(r'<beats>(\d+)</beats>', xml_content)
    beat_type_match = re.search(r'<beat-type>(\d+)</beat-type>', xml_content)
    time_num = int(beats_match.group(1)) if beats_match else 4
    time_den = int(beat_type_match.group(1)) if beat_type_match else 4

    # 調取得
    fifths_match = re.search(r'<fifths>([-\d]+)</fifths>', xml_content)

    # ノートを順に処理
    measure_offset = 0.0
    current_measure = 0

    for measure_match in re.finditer(r'<measure number="(\d+)">(.*?)</measure>', xml_content, re.DOTALL):
        measure_num = int(measure_match.group(1))
        measure_content = measure_match.group(2)
        note_offset_in_measure = 0.0

        for note_match in re.finditer(r'<note>(.*?)</note>', measure_content, re.DOTALL):
            note_content = note_match.group(1)

            is_rest = '<rest/>' in note_content
            duration_match = re.search(r'<duration>(\d+)</duration>', note_content)
            duration = int(duration_match.group(1)) if duration_match else 1

            global_offset = measure_offset + note_offset_in_measure
            start_sec = global_offset * seconds_per_quarter
            end_sec = (global_offset + duration) * seconds_per_quarter

            if is_rest:
                notes.append({
                    "note_index": note_index,
                    "type": "rest",
                    "pitches": [],
                    "note_name": "",
                    "start_time_sec": start_sec,
                    "end_time_sec": end_sec,
                    "measure_number": measure_num,
                    "articulations": [],
                    "dynamic": None,
                    "is_tied": False,
                    "is_tremolo": False,
                    "is_trill": False,
                    "is_chord": False,
                })
            else:
                # Parse pitch
                pitch_match = re.search(
                    r'<pitch>\s*<step>(\w)</step>(?:\s*<alter>([-\d]+)</alter>)?\s*<octave>(\d+)</octave>\s*</pitch>',
                    note_content
                )
                if pitch_match:
                    step = pitch_match.group(1)
                    alter = int(pitch_match.group(2)) if pitch_match.group(2) else 0
                    octave = int(pitch_match.group(3))
                    midi = (octave + 1) * 12 + NOTE_TO_SEMITONE.get(step, 0) + alter
                    freq = 440.0 * (2 ** ((midi - 69) / 12.0))

                    alter_str = ""
                    if alter == 1: alter_str = "#"
                    elif alter == -1: alter_str = "b"
                    note_name = f"{step}{alter_str}{octave}"

                    # Check articulations
                    arts = []
                    if '<staccato/>' in note_content:
                        arts.append("Staccato")

                    notes.append({
                        "note_index": note_index,
                        "type": "note",
                        "pitches": [freq],
                        "note_name": note_name,
                        "start_time_sec": start_sec,
                        "end_time_sec": end_sec,
                        "measure_number": measure_num,
                        "articulations": arts,
                        "dynamic": None,
                        "is_tied": False,
                        "is_tremolo": False,
                        "is_trill": False,
                        "is_chord": False,
                    })

            note_offset_in_measure += duration
            note_index += 1

        measure_offset += time_num  # 4 beats per measure in 4/4

    return {
        "bpm": bpm,
        "seconds_per_quarter": seconds_per_quarter,
        "instrument": "violin",
        "key": {"tonic": "C", "mode": "major"},
        "time_signature": {"numerator": time_num, "denominator": time_den},
        "notes": notes,
    }


def get_conn():
    return psycopg2.connect(DATABASE_URL)


def main():
    import io as iomod

    conn = get_conn()
    cur = conn.cursor()

    # Get only unprocessed items (scale and arpeggio)
    cur.execute("""
        SELECT id, "originalXmlPath" FROM "PracticeItem"
        WHERE source = 'seed' AND category IN ('scale', 'arpeggio') AND "analysisStatus" != 'done'
    """)
    items = cur.fetchall()
    cur.close()
    conn.close()

    print(f"Items to process: {len(items)}")

    processed = 0
    errors = 0

    for item_id, xml_path in items:
        try:
            # Download MXL from Storage
            download_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{xml_path}"
            res = requests.get(download_url, headers={"Authorization": f"Bearer {SUPABASE_KEY}"})
            if res.status_code != 200:
                print(f"Download failed for {item_id}: {res.status_code}")
                errors += 1
                continue

            # Extract XML from MXL (ZIP)
            with zipfile.ZipFile(iomod.BytesIO(res.content)) as zf:
                xml_content = zf.read('score.xml').decode('utf-8')

            # Parse and generate analysis
            analysis = parse_musicxml_notes(xml_content)
            analysis_json = json.dumps(analysis)

            # Upload analysis.json
            analysis_path = f"practice/{item_id}/analysis.json"
            upload_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{analysis_path}"
            upload_res = requests.post(
                upload_url,
                headers={"Authorization": f"Bearer {SUPABASE_KEY}", "Content-Type": "application/json"},
                data=analysis_json.encode("utf-8"),
            )
            if upload_res.status_code not in [200, 201]:
                upload_res = requests.put(
                    upload_url,
                    headers={"Authorization": f"Bearer {SUPABASE_KEY}", "Content-Type": "application/json"},
                    data=analysis_json.encode("utf-8"),
                )
                if upload_res.status_code not in [200, 201]:
                    print(f"Upload failed for {item_id}: {upload_res.text}")
                    errors += 1
                    continue

            # Update DB with fresh connection
            c = get_conn()
            cr = c.cursor()
            cr.execute("""
                UPDATE "PracticeItem"
                SET "analysisStatus" = 'done', "analysisPath" = %s
                WHERE id = %s
            """, (analysis_path, item_id))
            c.commit()
            cr.close()
            c.close()

            processed += 1
            if processed % 50 == 0:
                print(f"Progress: {processed}/{len(items)}")

        except Exception as e:
            print(f"Error {item_id}: {e}")
            errors += 1

    print(f"\nComplete: processed={processed}, errors={errors}")


if __name__ == "__main__":
    main()
