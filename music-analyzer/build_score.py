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
    expressions,
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
        # 2026-08-26: ユーザーIDは2種類ある。
        #   User.id             cuid  cmmm46xn4...  ← Score.createdById とストレージのパスはこちら
        #   User.supabaseUserId UUID  a0952076-...  ← 認証の auth uid
        # 呼び出し側がどちらを渡すかブレるため、USER_ID 自体を内部 User.id へ正規化する。
        # 認可だけでなくストレージのパスにも使うので、ここで揃えないと保存先がずれる。
        # 2026-08-24 の一括再解析は auth uid(UUID) を渡し、cuid と比較されて曲74件が全滅した。
        cur.execute(
            'SELECT id FROM "User" WHERE id = %s OR "supabaseUserId" = %s LIMIT 1',
            (USER_ID, USER_ID),
        )
        _u = cur.fetchone()
        if not _u:
            raise Exception(
                f"User not found: USER_ID={USER_ID!r} (User.id にも supabaseUserId にも一致しない)"
            )
        USER_ID = _u[0]
        cur.execute("""
            UPDATE "Score"
            SET "buildStatus" = 'processing'
            WHERE id = %s AND "createdById" = %s
            RETURNING id
        """, (SCORE_ID, USER_ID))

    if not cur.fetchone():
        if IS_PRACTICE_ITEM:
            raise Exception(f"PracticeItem not found: id={PRACTICE_ITEM_ID!r}")
        raise Exception(
            f"Score not found or unauthorized: id={SCORE_ID!r} owner={USER_ID!r}"
        )

    conn.commit()

    # =========================
    # analysis.json を Storage から取得
    # =========================
    if IS_PRACTICE_ITEM:
        analysis_path = f"practice/{PRACTICE_ITEM_ID}/analysis.json"
    else:
        analysis_path = f"{USER_ID}/{SCORE_ID}/analysis.json"
    # 再ビルド時、直前に analyze が上書きした analysis.json がストレージCDNの
    # キャッシュ (cacheControl 既定3600s) に負けて旧版が返ることがある
    # (2026-08-29 カイザーNo.23 Part再ビルドで実測)。クエリでキャッシュを回避する。
    import uuid as _uuid
    download_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{analysis_path}?cb={_uuid.uuid4().hex}"

    res = requests.get(
        download_url,
        headers={
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "Cache-Control": "no-cache",
        },
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
                # 音名(note_name)から綴りを保持して構築 (2026-07-20 Tetsuo承認)。
                # 周波数から組むと異名同音が既定(♯)に倒れ、A♭→G# 等で調号と食い違う。
                # 正しい綴り(analysis.json の nameWithOctave)を最優先し、無い時のみ周波数へフォールバック。
                _names = [s for s in (r.get("note_name") or "").split("/") if s]
                pitches = r.get("pitches", [])
                if len(_names) == 1:
                    n = note.Note(_names[0])
                elif len(_names) >= 2:
                    n = chord.Chord(_names)
                elif len(pitches) <= 1:
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

            # 描画マッピング (2026-07-20): OSMD が Spiccato/DetachedLegato の記号を描かないため、
            # スピッカート→スタッカート(点)、ポルタート→スタッカート+テヌート(点+線) に置換して表示。
            # (技術タグは analyze_musicxml/piece_summary 側で付与済みのため不変)
            _RENDER_MAP = {"Spiccato": ["Staccato"], "DetachedLegato": ["Staccato", "Tenuto"]}
            for art_name in r.get("articulations", []):
                if art_name in ("Fingering", "StringIndication"):
                    continue  # 運指/弦は display_* フィールドからルール適用して付与 (下)
                for rn in _RENDER_MAP.get(art_name, [art_name]):
                    if hasattr(articulations, rn):
                        n.articulations.append(getattr(articulations, rn)())

            # 装飾記号の復元 (2026-08-25 Tetsuo指摘: No.17 のトリルと装飾音符が消えていた)。
            # analyze_musicxml が expressions (Trill/Turn/Mordent/Fermata 等) を出しているので
            # 譜面にも書き戻す。これが無いと元譜面にあった記号が生成譜面から丸ごと落ちる。
            for _ex in r.get("expressions", []) or []:
                _base = str(_ex).split(":")[0]          # "Turn:delayed" → "Turn"
                _cls = getattr(expressions, _base, None)
                if _cls is None:
                    continue
                try:
                    n.expressions.append(_cls())
                except Exception:
                    pass                                # 引数が要る記号は飛ばす

            # 運指・弦の表示 (analyze_musicxml がルール適用済: 1stポジ以外の指 / 既定と異なる弦のみ)。
            # music21 → MusicXML <technical><fingering>/<string> → OSMD が描画。
            _df = r.get("display_finger")
            if _df is not None:
                try:
                    n.articulations.append(articulations.Fingering(int(_df)))
                except (ValueError, TypeError):
                    pass
            _ds = r.get("display_string_num")
            if _ds is not None:
                try:
                    n.articulations.append(articulations.StringIndication(int(_ds)))
                except (ValueError, TypeError):
                    pass

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
        # 1行4小節レイアウト（hairpinループの外で実行）
        # =========================
        # makeMeasures(inPlace=True): 音符オブジェクトの id() を保持する。
        # 非 inPlace で part を作り直すと、上で score に挿入したスラー/ヘアピンが
        # 参照する音符が最終ストリームから外れ、MusicXML export 時に
        # <slur>/<wedge> が消える（music21 9.x で実機確認済み）。
        part.makeMeasures(inPlace=True)

        for i, m in enumerate(part.getElementsByClass(stream.Measure)):
            # 4小節ごとに改行
            if i != 0 and i % 4 == 0:
                m.insert(0, layout.SystemLayout(isNew=True))

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
    # 2026-08-26: errorMessage を必ず残す。無いと画面は「楽譜の準備がうまくいかなかったよ」
    # だけになり、原因が追えない。
    _msg = f"{type(e).__name__}: {e}"[:300]
    if IS_PRACTICE_ITEM:
        cur.execute("""
            UPDATE "PracticeItem"
            SET "buildStatus" = 'error', "errorMessage" = %s
            WHERE id = %s
        """, (_msg, PRACTICE_ITEM_ID))
    else:
        cur.execute("""
            UPDATE "Score"
            SET "buildStatus" = 'error', "errorMessage" = %s
            WHERE id = %s
        """, (_msg, SCORE_ID))
    conn.commit()
    print(f"ERROR: {_msg}", file=sys.stderr)
    raise e

finally:
    cur.close()
    conn.close()