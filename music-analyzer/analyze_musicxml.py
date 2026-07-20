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
    interval,
    pitch as m21pitch,
)
# 運指・弦の推定 (音名算術, v64)。運指表示 (1stポジ以外のみ・弦は既定と異なる時のみ) に使用。
from lib.violin_position import (
    infer_with_finger,
    infer_pitch_only,
    VIOLIN_FIRST_POSITION_MAP,
    string_id_to_num,
)
# 未定義HTMLエンティティのサニタイズ (単体テスト可能に lib へ分離)
from lib.xml_sanitize import sanitize_xml_entities

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
# 全調自動生成: 移調ヘルパー (2026-07-20)
#   metadata.transposeSource(長調) から その行の keyTonic/keyMode へ移調する。
#   長調ターゲット=素直に移調 / 自然的短調ターゲット=3,6,7度を♭化(同主調)→移調。
# =========================
VIOLIN_LOW = m21pitch.Pitch("G3")        # 開放G
VIOLIN_TOP = m21pitch.Pitch("B6")
_FLAT_DEG = {4, 9, 11}                    # 長3/長6/長7 (主音からの半音)
_DOWN_A1 = interval.Interval("-A1")       # 増1度下げ=音名保持で半音下げ (E→E♭)


def _to_m21_tonic(db_tonic: str) -> str:
    """DB表記('Eb','F#','C') → music21表記('E-','F#','C')。フラット 'b'→'-'。"""
    return (db_tonic or "").replace("b", "-")


def _fit_to_violin(s):
    """バイオリン音域に収めつつ、1stポジション寄り(最低オクターブ)に配置する。
    移調は既定オクターブで上振れしやすい(例: C→A で A4-A6)ため、開放Gを割らない
    範囲でできるだけ下げる=標準の音階本と同じ最低オクターブ(1stポジ)に揃える。
      ① 最低音が開放G未満なら +1oct
      ② 最低音が G3 以上を保てる限り -1oct (1stポジ寄せ)
      ③ 稀に上限 B6 超なら -1oct"""
    ps = list(s.recurse().pitches)
    if not ps:
        return s
    while min(p.ps for p in ps) < VIOLIN_LOW.ps:
        s = s.transpose("P8"); ps = list(s.recurse().pitches)
    while min(p.ps for p in ps) - 12 >= VIOLIN_LOW.ps:
        s = s.transpose("-P8"); ps = list(s.recurse().pitches)
    while max(p.ps for p in ps) > VIOLIN_TOP.ps:
        s = s.transpose("-P8"); ps = list(s.recurse().pitches)
    return s


def _to_parallel_natural_minor(score, tonic_p):
    """長調スコア → 同主調の自然的短調 (3,6,7度を音名保持で半音下げ)。リズム等は保持。"""
    m = copy.deepcopy(score)
    for n in m.recurse().notes:
        for p in n.pitches:
            if (p.pitchClass - tonic_p.pitchClass) % 12 in _FLAT_DEG:
                p.transpose(_DOWN_A1, inPlace=True)
    return m


def transpose_variant(score, metadata, target_tonic_db, target_mode):
    """metadata.transposeSource(長調)から target_tonic/mode へ移調。対象外なら None。"""
    md = metadata
    if isinstance(md, str):
        try:
            md = json.loads(md)
        except Exception:
            md = None
    src = (md or {}).get("transposeSource") if isinstance(md, dict) else None
    if not src or not src.get("keyTonic"):
        return None
    src_p = m21pitch.Pitch(_to_m21_tonic(src["keyTonic"]))
    tgt_p = m21pitch.Pitch(_to_m21_tonic(target_tonic_db or src["keyTonic"]))
    base = score
    if (target_mode or "").lower() in ("minor", "natural_minor"):
        base = _to_parallel_natural_minor(score, src_p)      # C major → C natural minor
    out = base.transpose(interval.Interval(src_p, tgt_p))     # → target key
    return _fit_to_violin(out)


# 通常技法パターン: 奏法→music21記譜 (2026-07-20)。
#   レガート=Tenuto / スタッカート=Staccato / スピッカート=Spiccato /
#   マルテレ=StrongAccent(マルカート) / ポルタート=DetachedLegato(スラー下点) /
#   トレモロ=expressions.Tremolo(斜線2本)。
_ART_CLS = {
    "legato": articulations.Tenuto,
    "staccato": articulations.Staccato,
    "spiccato": articulations.Spiccato,
    "martele": articulations.StrongAccent,
    "portato": articulations.DetachedLegato,
}


def apply_articulation_variant(score, metadata):
    """metadata.articulationPattern(uniform) があれば全音符に奏法を付与。対象外なら None。"""
    md = metadata
    if isinstance(md, str):
        try:
            md = json.loads(md)
        except Exception:
            md = None
    pat = (md or {}).get("articulationPattern") if isinstance(md, dict) else None
    if not pat or pat.get("type") != "uniform":
        return None
    art_id = pat.get("articulation")
    for n in score.recurse().notes:
        if art_id == "tremolo":
            t = expressions.Tremolo()
            try:
                t.numberOfMarks = 2
            except Exception:
                pass
            n.expressions.append(t)
        elif art_id in _ART_CLS:
            n.articulations.append(_ART_CLS[art_id]())
    return score


# タグ→⭐︎ 正本 (docs/arcoda-design-spec.md §2-2b / 2026-07-20 承認: マルテレ=2, 7thポジ=5)。
# 技術タグ13 + ポジション習得系タグ9 + 重音習得系タグ5 を1表に統合。
# 教材の star = 付いた全タグ(技術+特徴)の⭐︎の最大値(最低1)を自動登録。
_TAG_STAR = {
    # ── 技術タグ ──
    "スラー": 1,
    "スタッカート": 2, "ピチカート": 2, "トレモロ": 2, "ポルタート": 2, "連続スタッカート": 2, "マルテレ": 2,
    "スピッカート": 3, "トリル": 3, "プラルトリラーとモルデント": 3,
    "ビブラート": 4, "リコシェ": 4,
    "グリッサンド": 5, "ナチュラル・ハーモニクス": 5,
    # ── ポジション習得系タグ (7thポジ=5 は 2026-07-20 Tetsuo確定, 他は §2-2b) ──
    "3rdポジション": 4, "5thポジション": 5, "7thポジション": 5,
    "2ndポジション": 6, "4thポジション": 6, "6thポジション": 6,
    "8thポジション": 6, "9thポジション": 6, "10thポジション": 6,
    # ── 重音習得系タグ (piece_summary が chord_intervals から付与する名称) ──
    "6度": 2, "3度": 3, "オクターブ": 4, "10度": 5, "連続重音": 6,
}


def _pos_ord(n: int) -> str:
    """ポジション番号 → 序数 (1→1st, 2→2nd, 3→3rd, 4〜→Nth)。"""
    return f"{n}{'st' if n == 1 else 'nd' if n == 2 else 'rd' if n == 3 else 'th'}"


def _pos_str_to_int(s):
    """positions カラムの値 ("1st"/"3rd"/3 等) を int へ。取れなければ None。"""
    import re as _re
    m = _re.match(r"\s*(\d+)", str(s))
    return int(m.group(1)) if m else None


def _position_tags(pos_ints):
    """ポジション int 列 → 習得系タグ名 (2nd以上のみ, 10th超は10thに丸め)。1stは既定=タグなし。"""
    out = set()
    for p in pos_ints:
        if p is not None and p >= 2:
            out.add(f"{_pos_ord(10 if p > 10 else p)}ポジション")
    return sorted(out)

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
            RETURNING "originalXmlPath", "metadata", "keyTonic", "keyMode"
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
    # 全調自動生成の変種は metadata.transposeSource を持つ (practice-item のみ)
    pi_metadata = row[1] if (IS_PRACTICE_ITEM and len(row) > 1) else None
    pi_key_tonic = row[2] if (IS_PRACTICE_ITEM and len(row) > 3) else None
    pi_key_mode = row[3] if (IS_PRACTICE_ITEM and len(row) > 3) else None
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
    is_zip = res.content[:2] == b'PK'
    if is_zip:
        original_ext = ".mxl"

    # 堅牢化: 一部の元XMLに &copy; 等の未定義HTMLエンティティが含まれ ElementTree parse が
    # 落ちるため、平文XMLのみ事前サニタイズ (既知エンティティ→数値参照 + 裸の&エスケープ)。
    xml_bytes = res.content if is_zip else sanitize_xml_entities(res.content)

    with tempfile.NamedTemporaryFile(
        suffix=original_ext,
        delete=False
    ) as tmp:
        tmp_path = tmp.name
        tmp.write(xml_bytes)

    score = converter.parse(tmp_path)
    # v3.2 Commit D: tmp_path は musicxml_skill_extractor で後ほど再利用するため、
    # ここでは削除しない (analysis.json upload 後に削除する)

    # 全調自動生成 (2026-07-20): 変種なら metadata.transposeSource から移調。
    # 後段(skill_extractor 等)も移調後を使うよう tmp_path を書き換える。
    if IS_PRACTICE_ITEM:
        _changed = False
        _transposed = transpose_variant(score, pi_metadata, pi_key_tonic, pi_key_mode)
        if _transposed is not None:
            score = _transposed
            _changed = True
            print(f"[transpose] variant → {pi_key_tonic}/{pi_key_mode} applied")
        _articulated = apply_articulation_variant(score, pi_metadata)
        if _articulated is not None:
            score = _articulated
            _changed = True
            print("[articulation] variant applied")
        if _changed:
            _t2 = tempfile.NamedTemporaryFile(suffix=".musicxml", delete=False)
            _t2.close()
            score.write("musicxml", fp=_t2.name)
            tmp_path = _t2.name

    # =========================
    # BPM
    # =========================
    def extract_bpm(sc) -> float:
        # number > 0 ガード: 元XMLに <per-minute>0</per-minute> 等があっても 60/BPM のゼロ除算を防ぐ
        for mm in sc.recurse().getElementsByClass(tempo.MetronomeMark):
            if mm.number is not None and mm.number > 0:
                return float(mm.number)
        for ti in sc.recurse().getElementsByClass(tempo.TempoIndication):
            if hasattr(ti, 'number') and ti.number is not None and ti.number > 0:
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
    # 運指推定の音脈コンテキスト (直前の弦・ポジション)。複数弦候補の選択に使う。
    fp_prev_string: Optional[str] = None
    fp_prev_position: Optional[int] = None

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

            # --- 運指・弦の表示解決 (Tetsuo ルール 2026-07-19) ---
            #  ・運指: 1stポジション以外で弾く音符のみ表記 (1stポジは非表示=情報過多回避)
            #  ・弦  : 1stポジで弾く弦と異なる場合のみ表記
            # 推定は violin_position (音名算術)。元記号<fingering>があれば指優先で弦/ポジ導出。
            disp_finger: Optional[int] = None       # 表示する指番号 or None
            disp_string_num: Optional[int] = None   # 表示する弦番号(1-4) or None
            if not is_chord_flag and len(element.pitches) == 1:
                _p = element.pitches[0]
                _midi = int(_p.midi)
                _src_finger = next(
                    (int(a.fingerNumber) for a in element.articulations
                     if type(a).__name__ == "Fingering" and getattr(a, "fingerNumber", None) is not None),
                    None,
                )
                if _src_finger is not None:
                    _r = infer_with_finger(_midi, _src_finger, fp_prev_string, fp_prev_position, _p.step, _p.octave)
                    if _r is not None:
                        _s_id, _pos, _ = _r
                    else:
                        _s_id, _pos = None, None
                    _finger = _src_finger
                else:
                    _r = infer_pitch_only(_midi, fp_prev_string, fp_prev_position, _p.step, _p.octave)
                    if _r is not None:
                        _s_id, _pos, _finger, _ = _r
                    else:
                        _s_id, _pos, _finger = None, None, None
                # 表示ルール適用
                _fp = VIOLIN_FIRST_POSITION_MAP.get(_midi)
                _fp_string = _fp[0] if _fp else None
                if _pos is not None and _pos >= 2 and _finger is not None and _finger >= 1:
                    disp_finger = _finger
                if _s_id is not None and _s_id != _fp_string:
                    disp_string_num = string_id_to_num(_s_id)
                # 音脈コンテキスト更新
                if _s_id is not None:
                    fp_prev_string = _s_id
                    if _pos is not None:
                        fp_prev_position = _pos

            dyn = measure_dynamics.get(float(element.offset))

            # タイ検出
            is_tied = False
            if hasattr(element, 'tie') and element.tie is not None:
                # tie.type: 'start', 'continue', 'stop'
                # 'continue' or 'stop' = このノートは前のノートとタイで繋がっている
                if element.tie.type in ('continue', 'stop'):
                    is_tied = True

            # トレモロ検出 (2e 段階2 2026-06-08)
            # - 弓トレモロ(1音/同音反復) = expressions.Tremolo (要素の expressions に付く)
            # - 指トレモロ(2音/交互)   = expressions.TremoloSpanner (2音をまたぐ spanner)
            #   → ループ後に spannerBundle から拾って両端ノートにタグ付け(下記)
            # tremolo_type: "bowed" | "fingered" | None。tremolo_marks: 刻み線本数(細分)。
            # tremolo_partner_hz / tremolo_interval_semitones: 指トレモロの相手音と音程差。
            is_tremolo = False
            tremolo_type: Optional[str] = None
            tremolo_marks: Optional[int] = None
            if hasattr(element, 'expressions'):
                for expr in element.expressions:
                    if isinstance(expr, expressions.Tremolo):
                        is_tremolo = True
                        tremolo_type = "bowed"
                        tremolo_marks = int(getattr(expr, "numberOfMarks", 3) or 3)
                        break

            # トリル検出
            is_trill = False
            if hasattr(element, 'expressions'):
                for expr in element.expressions:
                    if isinstance(expr, expressions.Trill):
                        is_trill = True
                        break

            # 工程A-4 (2026-07-10): モルデント検出 (§18-1 Tier1。技術タグ13の残る1分岐)
            is_mordent = False
            if hasattr(element, 'expressions'):
                for expr in element.expressions:
                    if isinstance(expr, (expressions.Mordent, expressions.InvertedMordent)):
                        is_mordent = True
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

            # 連符 (tuplet) 情報。music21 の duration.tuplets から実連符数を取得。
            # 3連符=3, 2連符(duplet)=2, 5連符=5 等。連符でなければ None。
            # スキル判定 2c (rhythm_pattern_triplet / _2plet_plus) で使用。
            # 音価(秒)では 2連符と付点が区別できないため、楽譜の連符マークを正本とする。
            tuplet_actual = None
            try:
                _tups = element.duration.tuplets
                if _tups:
                    tuplet_actual = int(_tups[0].numberNotesActual)
            except Exception:
                tuplet_actual = None

            note_results.append({
                "note_index": note_index,
                "type": "note",
                "pitches": pitches,
                "note_name": note_name_str,
                "start_time_sec": start_time_sec,
                "end_time_sec": end_time_sec,
                "measure_number": measure_number,
                "articulations": articulation_list,
                "display_finger": disp_finger,
                "display_string_num": disp_string_num,
                "dynamic": dyn,
                "is_tied": is_tied,
                "is_tremolo": is_tremolo,
                "tremolo_type": tremolo_type,
                "tremolo_marks": tremolo_marks,
                "tremolo_partner_hz": None,          # 指トレモロのみ。ループ後に設定
                "tremolo_interval_semitones": None,  # 指トレモロのみ。ループ後に設定
                "is_trill": is_trill,
                "is_mordent": is_mordent,
                "is_chord": is_chord_flag,
                # v1.7 Phase C: ハーモニクス
                "is_harmonic": is_harmonic,
                "harmonic_type": harmonic_type,
                "sounding_pitch_hz": sounding_pitch_hz,
                # 2c: 連符 (3連符/2連符以上)
                "tuplet_actual": tuplet_actual,
            })

            note_index += 1

    # =========================
    # スラー / ヘアピン抽出
    # =========================
    # build_score.py が spanners.{slurs,hairpins} を読み、生成スコアに
    # spanner.Slur / dynamics.Crescendo|Diminuendo として復元する。
    #
    # music21 9.x の制約 (実機確認済み):
    #   - repeat.Expander.process() は展開時に spanner を破棄する
    #   - part.expandRepeats() は spanner を複製するが参照先を展開前ノートに
    #     残す (dangling) ため、展開後ノートからは辿れない
    # いずれも展開後 performance_part から spanner を直接取れない。そこで:
    #   1. 展開前 `part` から slur/hairpin を ordinal (0..N-1) で抽出
    #   2. 各展開ノートを derivation チェーンで元 ordinal に解決
    #   3. 元の連続スパン(os..oe)が展開列に連続再現される箇所すべてに射影
    # これでリピート反復区間でもスラーが正しく表示される。非リピート曲は
    # expanded_to_orig が [0,1,2,...] となり 1:1 射影に帰着する。
    def _build_ordinal_map(src_part) -> Dict[int, int]:
        ordinal: Dict[int, int] = {}
        k = 0
        for meas in src_part.getElementsByClass("Measure"):
            for el in meas.notesAndRests:
                if float(el.duration.quarterLength) == 0:
                    continue
                ordinal[id(el)] = k
                k += 1
        return ordinal

    orig_ordinal = _build_ordinal_map(part)

    def _spanner_orig_span(sp) -> Optional[tuple]:
        idxs = [
            orig_ordinal[id(e)]
            for e in sp.getSpannedElements()
            if id(e) in orig_ordinal
        ]
        if len(idxs) < 2:
            return None
        return (min(idxs), max(idxs))

    # 展開ノート(note_index 順) → 元 ordinal を derivation で解決
    def _resolve_orig(el) -> Optional[int]:
        cur = el
        for _ in range(12):
            if cur is None:
                return None
            if id(cur) in orig_ordinal:
                return orig_ordinal[id(cur)]
            d = getattr(cur, "derivation", None)
            cur = d.origin if d is not None else None
        return None

    expanded_to_orig: List[Optional[int]] = []
    for meas in performance_part.getElementsByClass("Measure"):
        for el in meas.notesAndRests:
            if float(el.duration.quarterLength) == 0:
                continue
            expanded_to_orig.append(_resolve_orig(el))

    def _project(os: int, oe: int) -> List[tuple]:
        out: List[tuple] = []
        span = oe - os
        n = len(expanded_to_orig)
        for ks in range(n):
            if expanded_to_orig[ks] != os or ks + span >= n:
                continue
            if all(expanded_to_orig[ks + j] == os + j for j in range(span + 1)):
                out.append((ks, ks + span))
        return out

    slurs_out: List[Dict[str, int]] = []
    for sl in part.spannerBundle.getByClass("Slur"):
        span = _spanner_orig_span(sl)
        if span is not None:
            for ks, ke in _project(span[0], span[1]):
                slurs_out.append({"start": ks, "end": ke})

    hairpins_out: List[Dict[str, Any]] = []
    for cls_name, hp_type in (("Crescendo", "crescendo"), ("Diminuendo", "diminuendo")):
        for hp in part.spannerBundle.getByClass(cls_name):
            span = _spanner_orig_span(hp)
            if span is not None:
                for ks, ke in _project(span[0], span[1]):
                    hairpins_out.append({"type": hp_type, "start": ks, "end": ke})

    # 指トレモロ (TremoloSpanner): 2音をまたぐ spanner。両端ノートに fingered タグ付けし、
    # 相手音(partner_hz)と音程差(interval_semitones)を記録。音声側でピッチ交互を検証する。
    # 注: _project は ql==0(装飾音)をスキップした展開 ordinal を返す。装飾音が無い限り
    #     note_index と一致する(スラー機構と同じ前提)。tremolo etude では通常問題ない。
    import math as _math
    for ts in part.spannerBundle.getByClass("TremoloSpanner"):
        span = _spanner_orig_span(ts)
        if span is None:
            continue
        marks = int(getattr(ts, "numberOfMarks", 3) or 3)
        for ks, ke in _project(span[0], span[1]):
            if not (0 <= ks < len(note_results) and 0 <= ke < len(note_results)):
                continue
            a, b = note_results[ks], note_results[ke]
            if a.get("type") != "note" or b.get("type") != "note":
                continue
            pa = (a.get("pitches") or [None])[0]
            pb = (b.get("pitches") or [None])[0]
            interval = None
            if pa and pb and pa > 0 and pb > 0:
                interval = abs(round(12.0 * _math.log2(pb / pa)))
            for cur, partner in ((a, pb), (b, pa)):
                cur["is_tremolo"] = True
                cur["tremolo_type"] = "fingered"
                cur["tremolo_marks"] = marks
                cur["tremolo_partner_hz"] = partner
                cur["tremolo_interval_semitones"] = interval

    # グリッサンド (spanner.Glissando): 2音をまたぐ spanner。開始音(小ordinal)に
    # is_glissando + 音程差 + 方向(up/down)をタグ付け。音声側で f0 軌跡(端点到達/単調性/
    # 音程踏破)を検証する (2e グリッサンド 2026-06-08)。
    for gl in part.spannerBundle.getByClass("Glissando"):
        span = _spanner_orig_span(gl)
        if span is None:
            continue
        for ks, ke in _project(span[0], span[1]):
            if not (0 <= ks < len(note_results) and 0 <= ke < len(note_results)):
                continue
            a, b = note_results[ks], note_results[ke]
            if a.get("type") != "note" or b.get("type") != "note":
                continue
            ps = (a.get("pitches") or [None])[0]
            pe = (b.get("pitches") or [None])[0]
            if not (ps and pe and ps > 0 and pe > 0):
                continue
            semis = 12.0 * _math.log2(pe / ps)
            a["is_glissando"] = True
            a["glissando_interval_semitones"] = abs(round(semis))
            a["glissando_direction"] = "up" if semis > 0 else "down"

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
        "spanners": {"slurs": slurs_out, "hairpins": hairpins_out},
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
    # 工程A-4 (2026-07-10): note_karte v3 (音符カルテ+曲要約) を生成。
    # 旧 musicxml_skill_info.json にも同一 payload を二重書きし、旧読み手
    # (デプロイ済み loop_engine) を無傷に保つ (読み手の新名移行は工程C/A-6)。
    piece_summary = None
    try:
        import dataclasses
        from lib.musicxml_skill_extractor import extract_note_karte
        from lib.piece_summary import build_piece_summary, build_expansion_map

        karte_notes, karte_meta = extract_note_karte(tmp_path)
        piece_summary = build_piece_summary(karte_notes, karte_meta, analysis_result)
        # 展開対応表 (工程C前提): 演奏順(リピート展開後) → カルテ note_index
        emap, emap_status = build_expansion_map(
            karte_notes, analysis_result.get("notes", [])
        )
        karte_payload = {
            "version": 3,
            "notes": [dataclasses.asdict(n) for n in karte_notes],
            "meta": karte_meta,
            "piece": piece_summary,
            "expanded_index_map": emap,
            "expanded_index_map_status": emap_status,
        }
        karte_json = json.dumps(karte_payload, ensure_ascii=False).encode("utf-8")

        def _upload_json_body(storage_path: str) -> bool:
            url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{storage_path}"
            headers = {
                "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                "Content-Type": "application/json",
            }
            res = requests.post(url, headers=headers, data=karte_json)
            if res.status_code not in [200, 201]:
                res = requests.put(url, headers=headers, data=karte_json)
            return res.status_code in [200, 201]

        for _name in ("note_karte.json", "musicxml_skill_info.json"):
            _path = upload_storage_path.replace("analysis.json", _name)
            if _upload_json_body(_path):
                print(f"Generated {_name} with {len(karte_notes)} notes "
                      f"(aligned={piece_summary['index_aligned']})")
            else:
                print(f"WARNING: {_name} upload failed")
        if not piece_summary.get("index_aligned"):
            print("WARNING: note_karte と analysis.json の音符数が不一致 "
                  "(§2-1 インバリアント違反。オーナメント由来タグはスキップされた)")
    except Exception as skill_err:
        # カルテ生成失敗は警告のみ (analysis.json は既に upload 成功)
        piece_summary = None
        print(f"WARNING: note_karte generation failed: {skill_err}")
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

    # =========================
    # 工程A-4 (2026-07-10): 曲/教材の要約を DB へ投入 (設計書§3)
    # - 数値カラム(pitchMin/Max, Score.positions)は上書き (再分析=最新が正)
    # - ScoreKey は delete+insert (冪等)
    # - タグ M:N は「追加のみ」(ON CONFLICT DO NOTHING)。管理者の手動タグは絶対に消さない (§18-2)
    # - status コミット後の独立トランザクション (失敗しても解析 done は保持・警告のみ)
    # =========================
    if piece_summary is not None:
        try:
            import uuid as _uuid
            _ft_names = piece_summary.get("feature_tags") or []
            _tt_names = piece_summary.get("technique_tags") or []
            if IS_PRACTICE_ITEM:
                cur.execute(
                    'UPDATE "PracticeItem" SET "pitchMin"=%s, "pitchMax"=%s WHERE id=%s',
                    (piece_summary.get("pitch_min"), piece_summary.get("pitch_max"), PRACTICE_ITEM_ID),
                )
                # 変種判定を先に (positions/star/slur の扱いを分岐する)。
                _md_v = pi_metadata
                if isinstance(_md_v, str):
                    try:
                        _md_v = json.loads(_md_v)
                    except Exception:
                        _md_v = None
                _is_variant = isinstance(_md_v, dict) and bool(_md_v.get("transposeSource") or _md_v.get("articulationPattern"))

                # ポジション「最終値」の確定 (2026-07-20)。
                #  - 変種(自動生成): 常に推定で上書き。既存カラムは過去解析の残骸なので尊重しない
                #    (移調オクターブ修正後の再解析で、旧オクターブ由来の高ポジが残るのを防ぐ)。
                #  - 手動教材: 既存 positions があればそれが正 (推定は運指なしだと過少)。空なら推定を書く。
                _pos_ints_inf = [int(n) for n in (piece_summary.get("positions") or [])]
                if not _is_variant:
                    cur.execute('SELECT positions FROM "PracticeItem" WHERE id=%s', (PRACTICE_ITEM_ID,))
                    _row_pos = cur.fetchone()
                    _cur_pos = (_row_pos[0] if _row_pos else None) or []
                else:
                    _cur_pos = []
                if _cur_pos:
                    _final_pos_ints = sorted({p for s in _cur_pos if (p := _pos_str_to_int(s)) is not None})
                else:
                    _final_pos_ints = sorted(set(_pos_ints_inf))
                    cur.execute(
                        'UPDATE "PracticeItem" SET positions=%s WHERE id=%s',
                        ([_pos_ord(n) for n in _final_pos_ints], PRACTICE_ITEM_ID),
                    )
                # 特徴タグ = piece_summary の特徴タグ + 最終ポジション由来のポジションタグ。
                # ポジションタグ(category=position)は自動導出なので権威的に貼り替える
                # (最終 positions を単一の正とし、再解析での過去の誤タグ残留を防ぐ)。
                # 他カテゴリの特徴タグ/手動タグは従来どおり「追加のみ」で温存。
                cur.execute(
                    'DELETE FROM "PracticeItemFeatureTag" WHERE "practiceItemId"=%s AND "featureTagId" IN '
                    '(SELECT id FROM "FeatureTag" WHERE category=%s)',
                    (PRACTICE_ITEM_ID, "position"),
                )
                _ft_all = list(_ft_names) + _position_tags(_final_pos_ints)
                for _name in _ft_all:
                    cur.execute(
                        'INSERT INTO "PracticeItemFeatureTag" ("practiceItemId", "featureTagId") '
                        'SELECT %s, ft.id FROM "FeatureTag" ft WHERE ft."name"=%s '
                        'ON CONFLICT DO NOTHING',
                        (PRACTICE_ITEM_ID, _name),
                    )
                for _name in _tt_names:
                    cur.execute(
                        'INSERT INTO "PracticeItemTechnique" ("practiceItemId", "techniqueTagId", "isPrimary") '
                        'SELECT %s, t.id, false FROM "TechniqueTag" t WHERE t."name"=%s '
                        'ON CONFLICT DO NOTHING',
                        (PRACTICE_ITEM_ID, _name),
                    )
                # スラー識別 (2026-07-20): 弓の奏法がスラーのみ(他の奏法技術なし)で articulation 未設定なら
                # articulation='slur' を補完。奏法バリエーションで「スラー」として識別させる(基本は廃止)。
                _OTHER_ART_TAGS = {"スタッカート", "スピッカート", "マルテレ", "ポルタート", "トレモロ", "連続スタッカート"}
                if "スラー" in _tt_names and not (_OTHER_ART_TAGS & set(_tt_names)):
                    cur.execute(
                        'UPDATE "PracticeItem" SET articulation=%s WHERE id=%s AND articulation IS NULL',
                        ("slur", PRACTICE_ITEM_ID),
                    )
                # タグの⭐︎最大値(最低1)を star に自動登録 (§2-2b 統合表: 技術+ポジ+重音)。
                # 変種は毎回上書き / 手動教材は star 未設定のときだけ補完 (監修値を潰さない)。
                # (_is_variant は上のポジション分岐で算出済み)
                _star = max([1] + [_TAG_STAR[t] for t in (_tt_names + _ft_all) if t in _TAG_STAR])
                if _is_variant:
                    cur.execute('UPDATE "PracticeItem" SET star=%s WHERE id=%s', (_star, PRACTICE_ITEM_ID))
                else:
                    cur.execute('UPDATE "PracticeItem" SET star=%s WHERE id=%s AND star IS NULL', (_star, PRACTICE_ITEM_ID))
            else:
                # 曲は positions を毎回上書き (int[])。ポジションタグもこの値から導出。
                _score_pos_ints = [int(n) for n in (piece_summary.get("positions") or [])]
                cur.execute(
                    'UPDATE "Score" SET "pitchMin"=%s, "pitchMax"=%s, "positions"=%s WHERE id=%s',
                    (piece_summary.get("pitch_min"), piece_summary.get("pitch_max"),
                     _score_pos_ints, SCORE_ID),
                )
                cur.execute('DELETE FROM "ScoreKey" WHERE "scoreId"=%s', (SCORE_ID,))
                for _sk in piece_summary.get("sub_keys") or []:
                    cur.execute(
                        'INSERT INTO "ScoreKey" (id, "scoreId", "keyTonic", "keyMode", "sortOrder") '
                        'VALUES (%s, %s, %s, %s, %s) ON CONFLICT DO NOTHING',
                        (str(_uuid.uuid4()), SCORE_ID, _sk["tonic"], _sk["mode"], _sk["sort_order"]),
                    )
                # ポジションタグ(category=position)は権威的に貼り替え (PracticeItem と同様)。
                cur.execute(
                    'DELETE FROM "ScoreFeatureTag" WHERE "scoreId"=%s AND "featureTagId" IN '
                    '(SELECT id FROM "FeatureTag" WHERE category=%s)',
                    (SCORE_ID, "position"),
                )
                _ft_all = list(_ft_names) + _position_tags(_score_pos_ints)
                for _name in _ft_all:
                    cur.execute(
                        'INSERT INTO "ScoreFeatureTag" ("scoreId", "featureTagId") '
                        'SELECT %s, ft.id FROM "FeatureTag" ft WHERE ft."name"=%s '
                        'ON CONFLICT DO NOTHING',
                        (SCORE_ID, _name),
                    )
                for _name in _tt_names:
                    cur.execute(
                        'INSERT INTO "ScoreTechniqueTag" ("scoreId", "techniqueTagId", "isPrimary") '
                        'SELECT %s, t.id, false FROM "TechniqueTag" t WHERE t."name"=%s '
                        'ON CONFLICT DO NOTHING',
                        (SCORE_ID, _name),
                    )
            # 工程G (2026-07-11): スタッカート系曖昧記号の確認キューを DB へ。
            # 確定済み(confirmed)は pending に戻さない (件数・小節のみ最新化)。
            _target_type = "practice" if IS_PRACTICE_ITEM else "score"
            _target_id = PRACTICE_ITEM_ID if IS_PRACTICE_ITEM else SCORE_ID
            for _nc in piece_summary.get("needs_confirmation") or []:
                cur.execute(
                    '''
                    INSERT INTO "TechniqueConfirmation"
                      (id, "targetType", "targetId", pattern, "noteCount",
                       measures, status, "updatedAt")
                    VALUES (%s, %s, %s, %s, %s, %s, 'pending', NOW())
                    ON CONFLICT ("targetType", "targetId", pattern) DO UPDATE SET
                      "noteCount" = EXCLUDED."noteCount",
                      measures = EXCLUDED.measures,
                      "updatedAt" = NOW()
                    ''',
                    (str(_uuid.uuid4()), _target_type, _target_id,
                     _nc.get("pattern"), len(_nc.get("note_indexes") or []),
                     [int(m) + 1 for m in (_nc.get("measure_indexes") or [])]),
                )
            conn.commit()
            print(
                f"[analyze_musicxml] piece summary 保存: "
                f"pitch={piece_summary.get('pitch_min')}-{piece_summary.get('pitch_max')} "
                f"positions={piece_summary.get('positions')} "
                f"ft={len(_ft_names)} tt={len(_tt_names)} "
                f"subkeys={len(piece_summary.get('sub_keys') or [])} "
                f"confirmations={len(piece_summary.get('needs_confirmation') or [])}"
            )
        except Exception as persist_err:
            conn.rollback()
            print(f"WARNING: piece summary DB persist failed: {persist_err}")

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
