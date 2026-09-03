# -*- coding: utf-8 -*-
"""
backfill_technique_diagnosis.py — 奏法診断の取りこぼし復旧 (2026-09-04)

何が起きていたか:
  SkillInfoNote に technique_tags の宣言が無く、piece_summary の書き戻しが
  dataclasses.asdict() から静かに落ちていた。結果 musicxml_skill_info.json に
  音符ごとの奏法が一切載らず、diagnosis.py が奏法を読めないまま動いていた。
  pitch_tech_* / rhythm_tech_* の累積カウンタは DB 全体で0行。

このスクリプトがやること:
  1. 演奏のある曲の musicxml_skill_info.json / note_karte.json を作り直す
     (元の MusicXML と analysis.json から再構築。音声の再解析はしない)
  2. その曲の演奏を診断し直し、**奏法の課題だけ** をカウンタに足す

なぜ奏法だけか:
  カウンタは足し込み式。全項目を足すと既存の音程・リズムが二重になる。
  奏法は0行なので、そこだけ足せば整合する。

既定は dry-run (書き込みゼロ)。--apply で本実行。
実行: venv\\Scripts\\python.exe scripts\\backfill_technique_diagnosis.py [--apply]
"""
from __future__ import annotations

import dataclasses
import json
import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import psycopg2  # noqa: E402
import requests  # noqa: E402

from lib.diagnosis import diagnose  # noqa: E402
from lib.diagnosis_store import bump_user_subtask_counters  # noqa: E402
from lib.musicxml_skill_extractor import extract_note_karte  # noqa: E402
from lib.piece_summary import build_piece_summary, build_expansion_map  # noqa: E402
from lib.xml_sanitize import sanitize_xml_entities  # noqa: E402

APPLY = "--apply" in sys.argv


def load_env() -> dict:
    env: dict = {}
    env_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", ".env"
    )
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
SERVICE_KEY = ENV["SUPABASE_SERVICE_ROLE_KEY"]
DB_URL = (ENV.get("DIRECT_URL") or ENV["DATABASE_URL"]).split("?")[0]
XML_BUCKET = ENV.get("BUCKET_NAME") or "musicxml"
PERF_BUCKET = "performances"
HEADERS = {"Authorization": f"Bearer {SERVICE_KEY}"}


def storage_get(bucket: str, path: str) -> bytes | None:
    url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{path}"
    res = requests.get(url, headers=HEADERS, timeout=90)
    return res.content if res.status_code == 200 else None


def storage_put(bucket: str, path: str, body: bytes) -> bool:
    url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{path}"
    h = {**HEADERS, "Content-Type": "application/json"}
    res = requests.post(url, headers=h, data=body, timeout=90)
    if res.status_code not in (200, 201):
        res = requests.put(url, headers=h, data=body, timeout=90)
    return res.status_code in (200, 201)


def rebuild_karte(score_id: str, owner_id: str, xml_path: str):
    """元の MusicXML と analysis.json から note_karte を作り直して返す。"""
    raw = storage_get(XML_BUCKET, xml_path)
    if raw is None:
        return None, None, "MusicXML が取得できない"
    aj = storage_get(XML_BUCKET, f"{owner_id}/{score_id}/analysis.json")
    if aj is None:
        return None, None, "analysis.json が取得できない"
    analysis = json.loads(aj.decode("utf-8"))

    is_zip = raw[:2] == b"PK"
    body = raw if is_zip else sanitize_xml_entities(raw)
    with tempfile.NamedTemporaryFile(
        suffix=".mxl" if is_zip else os.path.splitext(xml_path)[1] or ".musicxml",
        delete=False,
    ) as tmp:
        tmp_path = tmp.name
        tmp.write(body)
    try:
        notes, meta = extract_note_karte(tmp_path)
        piece = build_piece_summary(notes, meta, analysis)
        emap, emap_status = build_expansion_map(notes, analysis.get("notes", []))
        payload = {
            "version": 3,
            "notes": [dataclasses.asdict(n) for n in notes],
            "meta": meta,
            "piece": piece,
            "expanded_index_map": emap,
            "expanded_index_map_status": emap_status,
        }
        return payload, analysis, None
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


def main() -> None:
    mode = "APPLY" if APPLY else "DRY-RUN"
    print(f"=== 奏法診断のバックフィル [{mode}] ===\n")
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = False
    cur = conn.cursor()

    cur.execute(
        '''
        SELECT s.id, s.title, s."createdById", s."originalXmlPath"
        FROM "Score" s
        WHERE s."originalXmlPath" IS NOT NULL
          AND s."deletedAt" IS NULL
          AND EXISTS (SELECT 1 FROM "Performance" p
                      WHERE p."scoreId" = s.id AND p."pitchAccuracy" IS NOT NULL)
        ORDER BY s."createdAt"
        '''
    )
    scores = cur.fetchall()
    print(f"対象の曲 {len(scores)}件\n")

    tot_perf = tot_bump = tot_tags = 0
    per_user: dict = {}
    for sid, title, owner, xml_path in scores:
        payload, analysis, err = rebuild_karte(sid, owner, xml_path)
        if payload is None:
            print(f"  [skip] {title} … {err}")
            continue
        tagged = sum(1 for n in payload["notes"] if n.get("technique_tags"))
        tot_tags += tagged
        print(f"  {(title or '')[:18]:<20} 音符{len(payload['notes']):>4}  奏法つき{tagged:>4}音", end="")

        if APPLY:
            body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            for name in ("note_karte.json", "musicxml_skill_info.json"):
                if not storage_put(XML_BUCKET, f"{owner}/{sid}/{name}", body):
                    print(f"  … {name} の書き込み失敗")
                    break

        # この曲の演奏を診断し直し、奏法の項目だけカウンタへ
        cur.execute(
            '''
            SELECT p.id, p."userId", p."comparisonResultPath"
            FROM "Performance" p
            WHERE p."scoreId" = %s AND p."pitchAccuracy" IS NOT NULL
              AND p."comparisonResultPath" IS NOT NULL
            ''',
            (sid,),
        )
        perfs = cur.fetchall()
        n_perf = n_bump = 0
        for pid, uid, comp_path in perfs:
            cb = storage_get(PERF_BUCKET, comp_path)
            if cb is None:
                continue
            comp = json.loads(cb.decode("utf-8"))
            results = comp if isinstance(comp, list) else (
                comp.get("results") or comp.get("evaluatedNotes") or []
            )
            if not results:
                continue
            try:
                diag = diagnose(results, payload, analysis.get("notes"))
            except Exception as e:
                print(f"\n    [warn] 診断失敗 {pid}: {e}", end="")
                continue
            n_perf += 1
            tech = {
                k: v for k, v in (diag.get("per_subtask") or {}).items()
                if "_tech_" in k and int(v.get("target", 0)) > 0
            }
            if not tech:
                continue
            n_bump += len(tech)
            for k, v in tech.items():
                e = per_user.setdefault((uid, k), [0, 0])
                e[0] += int(v.get("miss", 0))
                e[1] += int(v.get("target", 0))
            if APPLY:
                bump_user_subtask_counters(cur, uid, tech)
        tot_perf += n_perf
        tot_bump += n_bump
        print(f"  演奏{n_perf:>4}回  奏法カウンタ{n_bump:>5}件")

    if APPLY:
        conn.commit()
        print("\ncommit しました")
    else:
        conn.rollback()
        print("\ndry-run のため書き込みなし。--apply で本実行")
    print(
        f"合計: 奏法つきの音符 {tot_tags} ・ 診断し直した演奏 {tot_perf}回 ・ "
        f"足し込む奏法カウンタ {tot_bump}件"
    )
    if per_user:
        print("")
        print("足し込み後の見込み (ユーザー × 課題)")
        for (uid, k), (miss, target) in sorted(
            per_user.items(), key=lambda x: -x[1][1]
        ):
            rate = (1 - miss / target) * 100 if target else 0
            gate = "" if target >= 10 else "  ← 判定音が足りず候補外"
            print(f"   {uid[:8]}  {k:<28} 対象{target:>5}音 成功率{rate:>5.0f}%{gate}")
    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
