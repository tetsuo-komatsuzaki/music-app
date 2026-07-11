# -*- coding: utf-8 -*-
"""
reanalyze_all.py — 工程A-5: 既存 288件（曲74+教材214）の再分析バッチ

既定は dry-run（書き込みゼロ）: カルテ生成+投入予定値をレポートに出すのみ。
--apply で storage(note_karte.json 二重書き) + DB投入を実行（要 Tetsuo 承認）。

実行:
  venv\\Scripts\\python.exe scripts\\reanalyze_all.py            # dry-run
  venv\\Scripts\\python.exe scripts\\reanalyze_all.py --apply    # 本番
"""
from __future__ import annotations

import json
import os
import sys
import tempfile
import uuid

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import psycopg2  # noqa: E402
import requests  # noqa: E402

from lib.musicxml_skill_extractor import extract_note_karte  # noqa: E402
from lib.piece_summary import build_piece_summary, build_expansion_map  # noqa: E402
import dataclasses  # noqa: E402

APPLY = "--apply" in sys.argv
BUCKET = "musicxml"


def load_env() -> dict:
    """../.env を素朴にパース（python-dotenv 非依存）。"""
    env: dict = {}
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", ".env")
    with open(env_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    return env


ENV = load_env()
SUPABASE_URL = ENV.get("NEXT_PUBLIC_SUPABASE_URL") or ENV.get("SUPABASE_URL")
SERVICE_KEY = ENV.get("SUPABASE_SERVICE_ROLE_KEY")
DB_URL = ENV.get("DIRECT_URL") or ENV.get("DATABASE_URL")
# psycopg2 が解釈できないクエリパラメータを除去
if DB_URL and "?" in DB_URL:
    DB_URL = DB_URL.split("?")[0]

HEADERS = {"Authorization": f"Bearer {SERVICE_KEY}"}


def storage_get(path: str):
    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{path}"
    res = requests.get(url, headers=HEADERS, timeout=60)
    return res.content if res.status_code == 200 else None


def storage_put_json(path: str, body: bytes) -> bool:
    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{path}"
    h = dict(HEADERS)
    h["Content-Type"] = "application/json"
    res = requests.post(url, headers=h, data=body, timeout=60)
    if res.status_code not in (200, 201):
        res = requests.put(url, headers=h, data=body, timeout=60)
    return res.status_code in (200, 201)


def analyze_one(xml_bytes: bytes, analysis_json: dict | None):
    """カルテ生成 + 曲要約（一時ファイル経由）。"""
    suffix = ".mxl" if xml_bytes[:2] == b"PK" else ".musicxml"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tf:
        tf.write(xml_bytes)
        tmp = tf.name
    try:
        notes, meta = extract_note_karte(tmp)
        piece = build_piece_summary(notes, meta, analysis_json)
        return notes, meta, piece
    finally:
        try:
            os.remove(tmp)
        except OSError:
            pass


def persist_db(cur, kind: str, item_id: str, piece: dict) -> None:
    ft = piece.get("feature_tags") or []
    tt = piece.get("technique_tags") or []
    if kind == "practice":
        cur.execute(
            'UPDATE "PracticeItem" SET "pitchMin"=%s, "pitchMax"=%s WHERE id=%s',
            (piece.get("pitch_min"), piece.get("pitch_max"), item_id),
        )
        for name in ft:
            cur.execute(
                'INSERT INTO "PracticeItemFeatureTag" ("practiceItemId","featureTagId") '
                'SELECT %s, f.id FROM "FeatureTag" f WHERE f."name"=%s ON CONFLICT DO NOTHING',
                (item_id, name),
            )
        for name in tt:
            cur.execute(
                'INSERT INTO "PracticeItemTechnique" ("practiceItemId","techniqueTagId","isPrimary") '
                'SELECT %s, t.id, false FROM "TechniqueTag" t WHERE t."name"=%s ON CONFLICT DO NOTHING',
                (item_id, name),
            )
    else:
        cur.execute(
            'UPDATE "Score" SET "pitchMin"=%s, "pitchMax"=%s, "positions"=%s WHERE id=%s',
            (piece.get("pitch_min"), piece.get("pitch_max"), piece.get("positions") or [], item_id),
        )
        cur.execute('DELETE FROM "ScoreKey" WHERE "scoreId"=%s', (item_id,))
        for sk in piece.get("sub_keys") or []:
            cur.execute(
                'INSERT INTO "ScoreKey" (id,"scoreId","keyTonic","keyMode","sortOrder") '
                'VALUES (%s,%s,%s,%s,%s) ON CONFLICT DO NOTHING',
                (str(uuid.uuid4()), item_id, sk["tonic"], sk["mode"], sk["sort_order"]),
            )
        for name in ft:
            cur.execute(
                'INSERT INTO "ScoreFeatureTag" ("scoreId","featureTagId") '
                'SELECT %s, f.id FROM "FeatureTag" f WHERE f."name"=%s ON CONFLICT DO NOTHING',
                (item_id, name),
            )
        for name in tt:
            cur.execute(
                'INSERT INTO "ScoreTechniqueTag" ("scoreId","techniqueTagId","isPrimary") '
                'SELECT %s, t.id, false FROM "TechniqueTag" t WHERE t."name"=%s ON CONFLICT DO NOTHING',
                (item_id, name),
            )


def main() -> None:
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    # 教材 → 曲 の順（設計 §4）
    cur.execute(
        'SELECT id, title, category::text, "originalXmlPath" FROM "PracticeItem" ORDER BY category, id'
    )
    practices = cur.fetchall()
    cur.execute(
        'SELECT id, title, "createdById", "originalXmlPath" FROM "Score" '
        'WHERE "deletedAt" IS NULL ORDER BY "createdAt"'
    )
    scores = cur.fetchall()

    lines: list[str] = []
    stats = {"ok": 0, "fail": 0, "misaligned": 0, "multivoice": 0, "no_analysis": 0,
             "map_ok": 0, "map_ng": 0}
    failures: list[str] = []
    map_failures: list[str] = []

    def process(kind: str, item_id: str, title: str, xml_path: str, analysis_path: str) -> None:
        try:
            xml = storage_get(xml_path)
            if xml is None:
                raise RuntimeError(f"XML取得失敗: {xml_path}")
            a_raw = storage_get(analysis_path)
            analysis = json.loads(a_raw) if a_raw else None
            if analysis is None:
                stats["no_analysis"] += 1
            notes, meta, piece = analyze_one(xml, analysis)

            if not piece["index_aligned"]:
                stats["misaligned"] += 1
            if piece["has_multiple_voices"]:
                stats["multivoice"] += 1

            # 展開対応表 (工程C前提): 演奏順 → カルテ note_index
            if analysis is not None:
                emap, emap_status = build_expansion_map(notes, analysis.get("notes", []))
            else:
                emap, emap_status = None, "no_analysis"
            if emap is not None:
                stats["map_ok"] += 1
            else:
                stats["map_ng"] += 1
                map_failures.append(f"{kind}/{title}: {emap_status}")

            if APPLY:
                payload = json.dumps(
                    {"version": 3, "notes": [dataclasses.asdict(n) for n in notes],
                     "meta": meta, "piece": piece,
                     "expanded_index_map": emap,
                     "expanded_index_map_status": emap_status},
                    ensure_ascii=False,
                ).encode("utf-8")
                base = analysis_path.rsplit("/", 1)[0]
                ok1 = storage_put_json(f"{base}/note_karte.json", payload)
                ok2 = storage_put_json(f"{base}/musicxml_skill_info.json", payload)
                persist_db(cur, kind, item_id, piece)
                conn.commit()
                extra = f" storage={'OK' if ok1 and ok2 else 'NG'}"
            else:
                extra = ""

            stats["ok"] += 1
            lines.append(
                f"OK   [{kind}] {title} | notes={len(notes)} aligned={'Y' if piece['index_aligned'] else 'N'} "
                f"pitch={piece['pitch_min']}-{piece['pitch_max']} pos={piece['positions']} "
                f"ft={len(piece['feature_tags'])} tt={piece['technique_tags']} "
                f"subkeys={len(piece['sub_keys'])} conf={len(piece['needs_confirmation'])} "
                f"mv={'Y' if piece['has_multiple_voices'] else 'N'}{extra}"
            )
        except Exception as e:
            if APPLY:
                conn.rollback()
            stats["fail"] += 1
            failures.append(f"{kind}/{title}: {e}")
            lines.append(f"FAIL [{kind}] {title} | {e}")

    for pid, title, _cat, xml_path in practices:
        process("practice", pid, title, xml_path, f"practice/{pid}/analysis.json")
    for sid, title, created_by, xml_path in scores:
        process("score", sid, title, xml_path, f"{created_by}/{sid}/analysis.json")

    lines.append("")
    lines.append(f"===== {'APPLY' if APPLY else 'DRY-RUN'} 完了 =====")
    lines.append(
        f"OK={stats['ok']} FAIL={stats['fail']} 不整合(aligned=N)={stats['misaligned']} "
        f"多声部={stats['multivoice']} analysis.json欠落={stats['no_analysis']}"
    )
    lines.append(
        f"展開対応表: 成功={stats['map_ok']} 失敗={stats['map_ng']} "
        f"(成功率 {stats['map_ok']}/{stats['map_ok']+stats['map_ng']})"
    )
    if failures:
        lines.append("--- 失敗一覧 ---")
        lines.extend(failures)
    if map_failures:
        lines.append("--- 対応表 失敗一覧 (理由つき) ---")
        lines.extend(map_failures)

    out = "reanalyze_report.txt"
    with open(out, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(lines[-(len(failures) + 3) if failures else -2])
    print(lines[-1] if not failures else "")
    print(f"レポート: {out}")

    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
