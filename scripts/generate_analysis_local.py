# -*- coding: utf-8 -*-
"""
ローカルMXLファイルからanalysis.jsonを生成してSupabaseにアップロードし、DBを更新する
ネットワーク経由のダウンロードなしに、ローカルのMXLファイルを直接読む

対象: source='seed', category IN ('scale', 'arpeggio'), analysisStatus != 'done'
"""
import sys, io, os, json, zipfile, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import requests
import psycopg2
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
# psycopg2 は Prisma 固有の "pgbouncer=true" パラメータを認識できないため、
# DIRECT_URL (migrations 用、pgbouncer なし) を優先。なければ DATABASE_URL から
# pgbouncer 系クエリパラメータを除去して使う。
DATABASE_URL = os.getenv("DIRECT_URL") or os.getenv("DATABASE_URL")
if DATABASE_URL and "pgbouncer" in DATABASE_URL:
    from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode
    parsed = urlparse(DATABASE_URL)
    cleaned_query = urlencode([(k, v) for k, v in parse_qsl(parsed.query) if k not in ("pgbouncer", "connection_limit")])
    DATABASE_URL = urlunparse(parsed._replace(query=cleaned_query))
BUCKET       = "musicxml"

# ローカルMXLディレクトリ
SCRIPT_DIR      = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR     = os.path.join(SCRIPT_DIR, "..")
MXL_SCALE_DIR   = os.path.join(PROJECT_DIR, "prisma", "data", "mxl")
MXL_ARPEG_DIR   = os.path.join(PROJECT_DIR, "prisma", "data", "mxl_arpeggio")

NOTE_TO_SEMITONE = {"C":0,"D":2,"E":4,"F":5,"G":7,"A":9,"B":11}


def parse_musicxml_notes(xml_content):
    notes = []
    note_index = 0

    tempo_match = re.search(r'<sound tempo="(\d+)"', xml_content)
    bpm = int(tempo_match.group(1)) if tempo_match else 90
    seconds_per_quarter = 60.0 / bpm

    beats_match     = re.search(r'<beats>(\d+)</beats>', xml_content)
    beat_type_match = re.search(r'<beat-type>(\d+)</beat-type>', xml_content)
    time_num = int(beats_match.group(1))     if beats_match     else 4
    time_den = int(beat_type_match.group(1)) if beat_type_match else 4

    measure_offset = 0.0

    for measure_match in re.finditer(r'<measure number="(\d+)">(.*?)</measure>', xml_content, re.DOTALL):
        measure_num     = int(measure_match.group(1))
        measure_content = measure_match.group(2)
        note_offset_in_measure = 0.0

        for note_match in re.finditer(r'<note>(.*?)</note>', measure_content, re.DOTALL):
            note_content = note_match.group(1)

            is_rest          = '<rest/>' in note_content
            duration_match   = re.search(r'<duration>(\d+)</duration>', note_content)
            duration         = int(duration_match.group(1)) if duration_match else 1

            global_offset = measure_offset + note_offset_in_measure
            start_sec     = global_offset * seconds_per_quarter
            end_sec       = (global_offset + duration) * seconds_per_quarter

            if is_rest:
                notes.append({
                    "note_index": note_index, "type": "rest", "pitches": [],
                    "note_name": "", "start_time_sec": start_sec, "end_time_sec": end_sec,
                    "measure_number": measure_num, "articulations": [],
                    "dynamic": None, "is_tied": False, "is_tremolo": False,
                    "is_trill": False, "is_chord": False,
                })
            else:
                pitch_match = re.search(
                    r'<pitch>\s*<step>(\w)</step>(?:\s*<alter>([-\d]+)</alter>)?\s*<octave>(\d+)</octave>\s*</pitch>',
                    note_content
                )
                if pitch_match:
                    step  = pitch_match.group(1)
                    alter = int(pitch_match.group(2)) if pitch_match.group(2) else 0
                    octave = int(pitch_match.group(3))
                    # 修正済みMXL: C4=octave4 → MIDI = (octave+1)*12 + semi
                    midi = (octave + 1) * 12 + NOTE_TO_SEMITONE.get(step, 0) + alter
                    freq = 440.0 * (2 ** ((midi - 69) / 12.0))

                    alter_str = "#" if alter == 1 else ("b" if alter == -1 else "")
                    note_name = f"{step}{alter_str}{octave}"

                    arts = ["Staccato"] if '<staccato/>' in note_content else []

                    notes.append({
                        "note_index": note_index, "type": "note",
                        "pitches": [freq], "note_name": note_name,
                        "start_time_sec": start_sec, "end_time_sec": end_sec,
                        "measure_number": measure_num, "articulations": arts,
                        "dynamic": None, "is_tied": False, "is_tremolo": False,
                        "is_trill": False, "is_chord": False,
                    })

            note_offset_in_measure += duration
            note_index += 1

        measure_offset += time_num

    return {
        "bpm": bpm, "seconds_per_quarter": seconds_per_quarter,
        "instrument": "violin", "key": {"tonic": "C", "mode": "major"},
        "time_signature": {"numerator": time_num, "denominator": time_den},
        "notes": notes,
    }


def get_conn():
    return psycopg2.connect(DATABASE_URL)


def upload_analysis(item_id, analysis_json_bytes):
    """Supabase Storage に analysis.json をアップロード (POST→失敗時 PUT)"""
    analysis_path = f"practice/{item_id}/analysis.json"
    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{analysis_path}"
    headers = {"Authorization": f"Bearer {SUPABASE_KEY}", "Content-Type": "application/json"}

    res = requests.post(url, headers=headers, data=analysis_json_bytes)
    if res.status_code not in [200, 201]:
        res = requests.put(url, headers=headers, data=analysis_json_bytes)
    return analysis_path, res.status_code in [200, 201]


def main():
    conn = get_conn()
    cur  = conn.cursor()
    cur.execute("""
        SELECT id, "originalXmlPath", category FROM "PracticeItem"
        WHERE source = 'seed' AND category IN ('scale', 'arpeggio') AND "analysisStatus" != 'done'
    """)
    items = cur.fetchall()
    cur.close()
    conn.close()

    print(f"Items to process: {len(items)}")

    processed = 0
    skipped   = 0
    errors    = 0

    for item_id, xml_path, category in items:
        try:
            # ローカルファイルを探す
            filename = os.path.basename(xml_path)
            if category == 'arpeggio':
                local_path = os.path.join(MXL_ARPEG_DIR, filename)
            else:
                local_path = os.path.join(MXL_SCALE_DIR, filename)

            if not os.path.exists(local_path):
                print(f"  Local file not found: {local_path}")
                skipped += 1
                continue

            # MXL（ZIP）を読み込む
            with zipfile.ZipFile(local_path, 'r') as zf:
                xml_content = zf.read('score.xml').decode('utf-8')

            # analysis.json 生成
            analysis      = parse_musicxml_notes(xml_content)
            analysis_bytes = json.dumps(analysis).encode('utf-8')

            # Supabase にアップロード
            analysis_path, ok = upload_analysis(item_id, analysis_bytes)
            if not ok:
                print(f"  Upload failed: {item_id}")
                errors += 1
                continue

            # DB 更新
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
            if processed % 100 == 0:
                print(f"  Progress: {processed}")

        except Exception as e:
            print(f"  Error {item_id}: {e}")
            errors += 1

    print(f"\nComplete: processed={processed}, skipped={skipped}, errors={errors}")


if __name__ == "__main__":
    main()
