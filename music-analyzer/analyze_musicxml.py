from __future__ import annotations

import sys
import json
import os
import copy
import tempfile
from typing import Any, Dict, List, Optional
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
    key,
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


def normalize_tonic(name: str) -> str:
    """music21 の tonic.name (フラットは '-' 表記、例 'B-') を
    Arcoda 標準フォーマット ('Bb' 形式) に正規化する。

    v1.6 Phase 4-4 critical-path fix (Q1=b 確定):
      推薦エンジン / Phase 3b SubTask 自動アサインが PracticeItem.keyTonic
      ('Bb' 形式、admin 手動設定) と突合するため Score.keyTonic も同形式に揃える。
      music21: 'B-' (B flat) / 'F#' (F sharp) / 'C' (natural)
      → '-' を 'b' へ置換。シャープ '#' はそのまま (PracticeItem も '#' 形式)。
    """
    if not name:
        return name
    return name.replace("-", "b")

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
    # v3.2 Commit D: tmp_path は musicxml_skill_extractor で後ほど再利用するため、
    # ここでは削除しない (analysis.json upload 後に削除する)

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

    # =========================
    # 調号の決定
    # =========================
    # 記譜された調号 (<key><fifths>...) を最優先する。
    # score.analyze("key") は音高ベースの調推定 (Krumhansl-Schmuckler) で、
    # 開放弦の単音や短い素材だと誤推定する (例: E 線開放弦のみ → A 長調=♯3個)。
    # その結果、C 長調 (調号なし) の教材に誤った♯が表示される不具合があった。
    # 記譜上の調号があればそれを正とし、音高推定はフォールバックに留める。
    notated_key = next(score.recurse().getElementsByClass(key.KeySignature), None)
    if notated_key is not None:
        if isinstance(notated_key, key.Key):
            # MusicXML に <mode> 付きで記譜されている場合はそのまま採用
            key_obj = notated_key
        else:
            # mode なしの素の調号。tonic/mode は音高推定で補うが、
            # 推定の調号 (fifths) が記譜と食い違う場合は記譜側 (長調) を信頼する。
            analyzed = score.analyze("key")
            if analyzed.sharps == notated_key.sharps:
                key_obj = analyzed
            else:
                key_obj = notated_key.asKey("major")
    else:
        # 記譜上の調号がない場合のみ音高から推定
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

            # v1.7 Phase C (2026-05-23): ハーモニクス検出
            # - MusicXML <harmonic> は music21 で articulations.Harmonic に対応
            # - harmonic_type: natural / artificial を best-effort で取得
            #   (music21 の属性が無い場合は natural を既定 — 出現頻度的に妥当)
            # - sounding_pitch_hz: music21 解釈 (pitches[0]) を採用。natural なら
            #   そのまま正解、artificial は touching の可能性あり (Phase E 純度
            #   判定で harmonic_miss として顕在化、後続 PR で精緻化検討)
            is_harmonic = False
            harmonic_type: Optional[str] = None
            sounding_pitch_hz: Optional[float] = None
            for art in element.articulations:
                if isinstance(art, articulations.Harmonic):
                    is_harmonic = True
                    ht = getattr(art, "harmonicType", None)
                    if isinstance(ht, str) and ht in ("natural", "artificial"):
                        harmonic_type = ht
                    else:
                        harmonic_type = "natural"
                    sounding_pitch_hz = pitches[0] if pitches else None
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
                # v1.7 Phase C: ハーモニクス
                "is_harmonic": is_harmonic,
                "harmonic_type": harmonic_type,
                "sounding_pitch_hz": sounding_pitch_hz,
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

    # =========================
    # v3.2 Commit D: musicxml_skill_info.json を生成 + Storage upload
    # 設計書 §14-4 / commit_D_musicxml_skill_info.md 参照
    # 既存 analysis.json は変更せず、別ファイルとして並列に出力する (Q6 確定)
    # is_string_change_from_prev は出力しない (Q7、note_integration.py 側で生成)
    # =========================
    try:
        import dataclasses
        from lib.musicxml_skill_extractor import extract_skill_info

        skill_info_notes = extract_skill_info(tmp_path)
        skill_info_payload = {
            "version": 1,
            "notes": [dataclasses.asdict(n) for n in skill_info_notes],
        }
        skill_info_json = json.dumps(skill_info_payload, ensure_ascii=False)

        skill_info_storage_path = upload_storage_path.replace(
            "analysis.json", "musicxml_skill_info.json"
        )
        skill_info_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{skill_info_storage_path}"

        skill_info_res = requests.post(
            skill_info_url,
            headers={
                "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                "Content-Type": "application/json",
            },
            data=skill_info_json.encode("utf-8"),
        )
        if skill_info_res.status_code not in [200, 201]:
            skill_info_res = requests.put(
                skill_info_url,
                headers={
                    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                    "Content-Type": "application/json",
                },
                data=skill_info_json.encode("utf-8"),
            )
            if skill_info_res.status_code not in [200, 201]:
                # skill_info upload 失敗は警告のみ (analysis.json は upload 成功している)
                print(f"WARNING: musicxml_skill_info.json upload failed: {skill_info_res.text}")
            else:
                print(f"Generated musicxml_skill_info.json with {len(skill_info_notes)} notes")
        else:
            print(f"Generated musicxml_skill_info.json with {len(skill_info_notes)} notes")
    except Exception as skill_err:
        # skill_info 生成失敗は警告のみ (analysis.json は既に upload 成功)
        print(f"WARNING: musicxml_skill_info generation failed: {skill_err}")
    finally:
        # tmp_path を削除 (skill_info 抽出が終わったので不要)
        try:
            os.remove(tmp_path)
        except OSError:
            pass

    # ステータス更新（done）
    if IS_PRACTICE_ITEM:
        cur.execute("""
            UPDATE "PracticeItem"
            SET "analysisStatus" = 'done', "analysisPath" = %s
            WHERE id = %s
        """, (upload_storage_path, PRACTICE_ITEM_ID))
    else:
        # v1.6 Phase 4-4 critical-path fix (Q2=a 確定):
        # MusicXML から抽出済の key (key_obj) を Score DB にも保存する。
        # これまで analysis.json のみに書き込まれ Score.keyTonic/keyMode は null のままだった
        # → 推薦エンジン休眠 / Phase 3b SubTask 自動アサイン永久 skip の真因。
        # PracticeItem 経路 (IS_PRACTICE_ITEM=true) は admin 手動設定を温存するため対象外。
        # v1.6 G2 fix (2026-05-17): defaultTempo も keyTonic と同型バグ。
        # BPM は extract_bpm で抽出済・analysis.json には書かれていたが Score.defaultTempo は
        # 常に null → recommendations API が SELECT するが空。Score 列にも保存する。
        # Score.defaultTempo は Int? のため round で整数化。
        # v1.6 G4 fix (2026-05-17): timeNumerator/timeDenominator も key/defaultTempo と同型バグ。
        # 拍子記号 (time_sig) は抽出済・analysis.json には書かれていたが Score 列は常に null。
        # 生成スコアに拍子を表記するため Score 列にも保存 (analysis.json と同じ既定 4/4)。
        norm_tonic = normalize_tonic(key_obj.tonic.name)
        default_tempo = int(round(BPM))
        time_num = time_sig.numerator if time_sig else 4
        time_den = time_sig.denominator if time_sig else 4
        cur.execute("""
            UPDATE "Score"
            SET "analysisStatus" = 'done',
                "keyTonic" = %s,
                "keyMode" = %s,
                "defaultTempo" = %s,
                "timeNumerator" = %s,
                "timeDenominator" = %s
            WHERE id = %s
        """, (norm_tonic, key_obj.mode, default_tempo, time_num, time_den, SCORE_ID))
        print(f"[analyze_musicxml] Score meta 保存: key={norm_tonic} {key_obj.mode} tempo={default_tempo} time={time_num}/{time_den} (score={SCORE_ID})")
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
