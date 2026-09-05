# -*- coding: utf-8 -*-
"""
verify_note_store_parity.py — 旧新一致の検査 (段3 の合格条件・検証報告 §7-1)。

新しい表 (NoteProfile / ScoreNote / PerformanceNote) だけから、いま保存されている集計を作り直し、
保存値と突き合わせる。旧が古い差 (奏法が診断に届いていなかった時期の診断など) は「旧が古い」として
数え、理由を出す。差ゼロではなく「差がすべて説明できる」が合格。

  A 演奏ごとの課題別ミス数  analysisSummary.diagnosis.per_subtask  ↔ 明細+並び+かたち から再計算
  B 演奏ごとの遷移          analysisSummary.noteStats.transitions ↔ 同上 (旧の規則: 評価済み・音程or入り・2回以上)
  C 教材の出現回数          PracticeItemSubtaskCount               ↔ 並び+かたち から再計算
  D 明細の全項目            comparison_result.json                 ↔ PerformanceNote (値の一致)

実行: venv\\Scripts\\python.exe scripts\\verify_note_store_parity.py [--limit N]
"""
from __future__ import annotations
import os, sys, json, io, collections, math
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import psycopg2, psycopg2.extras, requests
from dotenv import load_dotenv
from lib.diagnosis import _context_suffixes
from lib.subtask_catalog import v1_active_ids, all_ids
from lib.note_store import TECHS, TECH_COLUMNS, TECH_NAME_TO_SUFFIX, POS_UNKNOWN, UNKNOWN, NONE, _COMPARISON_FIELDS

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))
U = os.environ["SUPABASE_URL"]; K = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
LIMIT = int(sys.argv[sys.argv.index("--limit") + 1]) if "--limit" in sys.argv else None
EVALUATED = ("evaluated", "pitch_only", "double_stop_full", "double_stop_partial", "double_stop_miss",
             "harmonic_ok", "harmonic_normal_tone", "harmonic_miss")
SUFFIX_TO_NAME = {v: k for k, v in TECH_NAME_TO_SUFFIX.items()}
STRINGS = ["G", "D", "A", "E"]


def _string_kind(a, b):
    if a in (UNKNOWN, NONE) or b in (UNKNOWN, NONE):
        return None
    d = abs(STRINGS.index(a) - STRINGS.index(b))
    return "same" if d == 0 else "adjacent" if d == 1 else "skip"


def _parse_pitch(p: str):
    """"F#4" → (step, alter, octave, midi)"""
    if p in (UNKNOWN, NONE):
        return None
    step = p[0]; i = 1; alter = 0
    while i < len(p) and p[i] in "#b":
        alter += 1 if p[i] == "#" else -1; i += 1
    octave = int(p[i:])
    base = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}[step]
    return step, alter, octave, 12 * (octave + 1) + base + alter


def profile_to_karte(cur_p: dict, prev_p: dict | None) -> dict:
    """かたち (今と前) から、diagnosis._context_suffixes が読むカルテ音の形を作る。"""
    k: dict = {}
    pp = _parse_pitch(cur_p["pitch1"])
    k["step"], k["alter"], k["octave"], k["midi"] = (pp if pp else (None, 0, None, None))
    k["position_confidence"] = "low" if cur_p["position"] == POS_UNKNOWN else "high"
    k["position_to"] = None if cur_p["position"] == POS_UNKNOWN else cur_p["position"]
    k["position_from"] = None
    k["string_change_kind"] = None; k["interval_degree"] = None
    if prev_p is not None:
        k["position_from"] = None if prev_p["position"] == POS_UNKNOWN else prev_p["position"]
        k["string_change_kind"] = _string_kind(prev_p["string1"], cur_p["string1"])
        q = _parse_pitch(prev_p["pitch1"])
        if pp and q:
            L = "CDEFGAB"
            d = (L.index(pp[0]) + 7 * pp[2]) - (L.index(q[0]) + 7 * q[2])
            k["interval_degree"] = (abs(d) + 1) * (1 if d > 0 else -1 if d < 0 else 1)
    k["is_chord"] = cur_p["noteCount"] > 1
    if k["is_chord"]:
        # 隣接ペアの度数ラベル (piece_summary と同じ名前)
        labels = []
        pitches = [_parse_pitch(cur_p[f"pitch{i}"]) for i in range(1, cur_p["noteCount"] + 1)]
        L = "CDEFGAB"
        for a, b in zip(pitches, pitches[1:]):
            if a and b:
                deg = abs((L.index(b[0]) + 7 * b[2]) - (L.index(a[0]) + 7 * a[2])) + 1
                labels.append({3: "3度", 4: "4度", 5: "5度", 6: "6度", 8: "オクターブ"}.get(deg, "その他"))
        k["chord_intervals"] = labels
    k["technique_tags"] = [SUFFIX_TO_NAME[t] for t in TECHS if cur_p[TECH_COLUMNS[t]]]
    nt = cur_p["noteType1"]
    k["note_type"] = None if nt in (UNKNOWN, NONE) else nt
    k["is_dotted"] = bool(cur_p["dotted1"])
    k["is_tuplet"] = cur_p["tupletActual"] > 0
    k["is_after_rest"] = cur_p["restBefore"] > 0
    k["rest_before_beats"] = cur_p["restBefore"]
    k["is_on_beat"] = bool(cur_p["onBeat"])
    k["note_index"] = 0
    return k


def load_score_notes(dcur, target_type: str, target_id: str):
    # 位置で切るので、辞書カーソルではなく素のカーソルを使う
    cur = dcur.connection.cursor()
    cur.execute('''SELECT sn."noteIndex", sn."profileId", sn."prevProfileId", sn."pass", sn."writtenNoteIndex",
                          p.*, q.*
                   FROM "ScoreNote" sn
                   JOIN "NoteProfile" p ON p.id = sn."profileId"
                   LEFT JOIN "NoteProfile" q ON q.id = sn."prevProfileId"
                   WHERE sn."targetType" = %s::"ScoreNoteTarget" AND sn."targetId" = %s ORDER BY sn."noteIndex"''',
                (target_type, target_id))
    cols = [d.name for d in cur.description]
    out = {}
    for row in cur.fetchall():
        # p.* と q.* の列名が重複するので位置で切る
        n_fixed = 5
        n_p = (len(cols) - n_fixed) // 2
        pcols = cols[n_fixed:n_fixed + n_p]
        cur_p = dict(zip(pcols, row[n_fixed:n_fixed + n_p]))
        prev_p = dict(zip(pcols, row[n_fixed + n_p:])) if row[2] is not None else None
        out[row[0]] = {"cur": cur_p, "prev": prev_p, "chordCont": cur_p["chordCont"], "pass": row[3], "written": row[4]}
    cur.close()
    return out


def piece_facts(notes):
    """並びから: 繰り返しの境目の数 (記譜番号が戻る回数)、不明ポジションの音数、行数、重音の数"""
    seq = [notes[k] for k in sorted(notes)]
    boundaries = sum(1 for a, b in zip(seq, seq[1:]) if b["written"] < a["written"])
    unknown_pos = sum(1 for n in seq if n["cur"]["position"] == POS_UNKNOWN)
    chords = sum(1 for n in seq if (n["cur"].get("noteCount") or 1) > 1)
    return boundaries, unknown_pos, len(seq), chords


def recompute_per_subtask(notes_by_idx, perf_rows, active):
    per = {}; trans = collections.defaultdict(lambda: {"target": 0, "miss": 0}); joined = 0
    prev_name = None
    for r in perf_rows:
        n = notes_by_idx.get(r["noteIndex"])
        if n is None:
            continue
        joined += 1
        k = profile_to_karte(n["cur"], n["prev"])
        cx = _context_suffixes(k, n["chordCont"] and k["is_chord"], (n["cur"]["tupletActual"] or None))
        und = r["evaluationStatus"] == "not_detected"
        pm = und or r["pitchOk"] is False; rm = und or r["startOk"] is False
        def bump(sid, miss):
            if sid not in active:
                return
            d = per.setdefault(sid, {"miss": 0, "target": 0}); d["target"] += 1; d["miss"] += 1 if miss else 0
        for s in cx["pitch_ctx"]:
            bump(f"pitch_{s}", pm); bump(f"rhythm_{s}", rm)
        for s in cx["rhythm_only_ctx"]:
            bump(f"rhythm_{s}", rm)
        # 旧 noteStats.transitions の規則: 評価済み・前の音名は明細順で直前 (休符では切れない)・ミスは音程 or 入り
        name = r["noteName"]
        if name and r["evaluationStatus"] in EVALUATED:
            if prev_name:
                t = trans[f"{prev_name}>{name}"]; t["target"] += 1
                if r["pitchOk"] is False or r["startOk"] is False:
                    t["miss"] += 1
        if name:
            prev_name = name
    trans = {k: v for k, v in trans.items() if v["target"] >= 2}
    return per, trans, joined


def main():
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    active = v1_active_ids(); allids = all_ids()
    # ── A + B: 演奏 ──
    cur.execute('''SELECT p.id, p."scoreId", p."analysisSummary", p."scoreNoteVersion", s.title, s."scoreNoteVersion" AS sv
                   FROM "Performance" p JOIN "Score" s ON s.id = p."scoreId"
                   WHERE p."analysisSummary"->'diagnosis' IS NOT NULL ORDER BY p."createdAt"''')
    perfs = cur.fetchall()
    if LIMIT:
        perfs = perfs[:LIMIT]
    tot = collections.Counter(); reasons = collections.Counter(); examples = []
    for p in perfs:
        cur.execute('SELECT * FROM "PerformanceNote" WHERE "performanceKind" = %s::"PerformanceKind" AND "performanceId" = %s ORDER BY "noteIndex"', ("score", p["id"]))
        rows = cur.fetchall()
        if not rows:
            tot["no_detail"] += 1; continue
        if p["scoreNoteVersion"] is None or p["scoreNoteVersion"] != p["sv"]:
            tot["version_mismatch"] += 1; continue
        notes = load_score_notes(cur, "score", p["scoreId"])
        if not notes:
            tot["no_sequence"] += 1; continue
        per, trans, joined = recompute_per_subtask(notes, rows, active)
        old = (p["analysisSummary"].get("diagnosis") or {}).get("per_subtask") or {}
        old = {k: v for k, v in old.items() if k in active}
        keys = set(old) | set(per)
        diff = {k: (old.get(k), per.get(k)) for k in keys if old.get(k) != per.get(k)}
        tot["perf"] += 1; tot["joined"] += joined; tot["rows"] += len(rows)
        if not diff:
            tot["A_match"] += 1
        else:
            # 理由づけ:
            #   旧に無く新にある奏法            → 旧が古い (v121以前の診断)
            #   繰り返しのある曲で、差が境目の数以内 → 繰り返し境目 (新は演奏順で前の音を決める)
            #   それ以外の posshift/interval の差  → 要調査
            boundaries, unknown_pos, _, chords = piece_facts(notes)
            kinds = set()
            for k, (o, n) in diff.items():
                if "_tech_" in k and o is None:
                    kinds.add("旧が古い・奏法")
                    continue
                dt = abs((n or {}).get("target", 0) - (o or {}).get("target", 0))
                if boundaries > 0 and dt <= boundaries and ("_posshift_" in k or "_interval_" in k or "_double_" in k):
                    kinds.add("繰り返し境目")
                elif unknown_pos > 0 and ("_posshift_" in k or "_interval_" in k):
                    # 低信頼のポジションを持つ曲: 新は不明として外す (F16)。旧はその位置を使っていた
                    kinds.add("F16 低信頼ポジション")
                elif chords > 0 and ("_posshift_" in k or "_interval_" in k or "_double_" in k):
                    # 旧は重音を遷移の連鎖から外し position_from/to を持たせなかった。新は重音にも手のポジションがある
                    kinds.add("重音の扱い")
                else:
                    kinds.add("その他・要調査")
            label = "+".join(sorted(kinds))
            reasons[label] += 1
            tot["A_diff"] += 1
            if any("要調査" in k for k in kinds) and len(examples) < 12:
                ex = {k: v for k, v in diff.items() if not ("_tech_" in k and v[0] is None)}
                examples.append((p["title"], p["id"][:8], label, dict(list(ex.items())[:4])))
        old_tr = (p["analysisSummary"].get("noteStats") or {}).get("transitions") or {}
        tks = set(old_tr) | set(trans)
        tdiff = sum(1 for k in tks if (old_tr.get(k) or {}).get("target") != (trans.get(k) or {}).get("target") or (old_tr.get(k) or {}).get("miss") != (trans.get(k) or {}).get("miss"))
        tot["B_match" if tdiff == 0 else "B_diff"] += 1
    print("=== A 課題別ミス数 / B 遷移 (演奏)")
    print(dict(tot))
    print("A の差の理由:", dict(reasons))
    for e in examples:
        print("  ", e)

    # ── C: 教材の出現回数 ──
    cur.execute('SELECT "practiceItemId", "subtaskId", count, "noteTotal" FROM "PracticeItemSubtaskCount"')
    old_counts = collections.defaultdict(dict); old_totals = {}
    for r in cur.fetchall():
        old_counts[r["practiceItemId"]][r["subtaskId"]] = r["count"]
        old_totals[r["practiceItemId"]] = r["noteTotal"]
    items = list(old_counts.keys())
    if LIMIT:
        items = items[:LIMIT]
    ctot = collections.Counter(); cex = []; creasons = collections.Counter(); c_other = []
    for iid in items:
        notes = load_score_notes(cur, "practice", iid)
        if not notes:
            ctot["no_sequence"] += 1; continue
        cnt = collections.Counter()
        ordered = sorted(notes.items())
        for idx, n in ordered:
            k = profile_to_karte(n["cur"], n["prev"])
            cx = _context_suffixes(k, n["chordCont"] and k["is_chord"], (n["cur"]["tupletActual"] or None))
            for s in cx["pitch_ctx"]:
                if f"pitch_{s}" in active: cnt[f"pitch_{s}"] += 1
                if f"rhythm_{s}" in active: cnt[f"rhythm_{s}"] += 1
            for s in cx["rhythm_only_ctx"]:
                if f"rhythm_{s}" in active: cnt[f"rhythm_{s}"] += 1
        old = {k: v for k, v in old_counts[iid].items() if k in active}
        keys = set(old) | set(cnt)
        diff = {k: (old.get(k), cnt.get(k)) for k in keys if old.get(k) != cnt.get(k)}
        ctot["items"] += 1
        if not diff:
            ctot["C_match"] += 1
        else:
            ctot["C_diff"] += 1
            # 理由づけ:
            #   posshift だけの差   → F16: 旧は低信頼のポジションを手の位置として使っていた。新は不明扱い
            #   tuplet の差         → 新は連符の実比を持つ (旧は三連符に既定されていた)
            #   繰り返しのある教材  → 境目の前の音が演奏順になった
            #   それ以外            → 要調査
            boundaries, unknown_pos, nrows, chords = piece_facts(notes)
            note_total = old_totals.get(iid)
            dropped = (note_total is not None and boundaries == 0 and nrows < note_total)
            kinds = set()
            for k, (o, n) in diff.items():
                if "_tuplet_" in k:
                    kinds.add("連符の実比")
                elif dropped:
                    kinds.add("対応づけで落ちた音")
                elif boundaries > 0:
                    kinds.add("繰り返し境目")
                elif unknown_pos > 0 and ("_posshift_" in k or "_interval_" in k):
                    kinds.add("F16 低信頼ポジション")
                elif chords > 0 and ("_posshift_" in k or "_interval_" in k or "_double_" in k or "_entry_" in k):
                    # 旧は重音を遷移の連鎖から外し、休符の連続も重音で切っていた。新は重音にも手のポジションと直前の休符がある
                    kinds.add("重音の扱い")
                else:
                    kinds.add("その他・要調査")
            label = "+".join(sorted(kinds))
            creasons[label] += 1
            if "その他・要調査" in kinds:
                c_other.append(iid)
                if len(cex) < 10:
                    unexplained = {k: v for k, v in diff.items() if not ("_tuplet_" in k or "_posshift_" in k or "_interval_" in k or "_double_" in k)}
                    cex.append((iid[:8], f"境目{boundaries} 不明pos{unknown_pos} 重音{chords} 行{nrows}/旧{note_total}", dict(list(unexplained.items())[:4])))
    print("=== C 教材の出現回数")
    print(dict(ctot))
    print("C の差の理由:", dict(creasons))
    io.open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "_tmp_proto", "c_other.txt"), "w").write(chr(10).join(c_other))
    for e in cex:
        print("  ", e)

    # ── D: 明細の全項目 (演奏の先頭 N 件) ──
    cur.execute('SELECT id, "userId", "scoreId", "comparisonResultPath" FROM "Performance" WHERE "comparisonResultPath" IS NOT NULL ORDER BY "createdAt" DESC LIMIT %s', (LIMIT or 30,))
    dtot = collections.Counter()
    for p in cur.fetchall():
        path = p["comparisonResultPath"] or f"{p['userId']}/{p['scoreId']}/{p['id']}/comparison_result.json"
        r = requests.get(f"{U}/storage/v1/object/performances/{path}", headers={"Authorization": f"Bearer {K}"}, timeout=60)
        if r.status_code != 200:
            dtot["file_missing"] += 1; continue
        comp = r.json(); comp = comp if isinstance(comp, list) else (comp.get("results") or [])
        cur.execute('SELECT * FROM "PerformanceNote" WHERE "performanceKind" = %s::"PerformanceKind" AND "performanceId" = %s', ("score", p["id"]))
        by = {row["noteIndex"]: row for row in cur.fetchall()}
        if not by:
            dtot["no_detail"] += 1; continue
        bad = 0
        for c in comp:
            row = by.get(c.get("note_index"))
            if row is None:
                bad += 1; continue
            for src, dst, typ in _COMPARISON_FIELDS:
                a = c.get(src); b = row[dst]
                if a is None and b is None:
                    continue
                if typ is float and a is not None and b is not None:
                    if not math.isclose(float(a), float(b), rel_tol=1e-9, abs_tol=1e-9):
                        bad += 1; break
                elif typ is not float and (a is None) != (b is None) or (typ is not float and a is not None and typ(a) != b):
                    bad += 1; break
        dtot["perf"] += 1
        dtot["D_match" if bad == 0 else "D_diff"] += 1
    print("=== D 明細の全項目")
    print(dict(dtot))
    conn.close()


if __name__ == "__main__":
    main()
