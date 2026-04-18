# -*- coding: utf-8 -*-
"""
アルペジオMusicXMLファイルを生成するスクリプト
prisma/data/arcoda_arpeggios_540.xlsx を読み込み、MXLを生成する
出力先: prisma/data/mxl_arpeggio/

バグ修正（スケールと同様）:
  - オクターブ計算: octave = midi // 12 - 1  (標準MusicXML: C4=60 -> octave=4)
  - find_arpeggio_start: 低いオクターブから順に試す（最低有効位置を返す）
"""
import sys
import io
import os
import zipfile
import glob

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import openpyxl

# =========================================================
# 定数
# =========================================================
ROOT_TO_SEMITONE = {
    "C": 0, "C#": 1, "Db": 1, "D": 2, "Eb": 3, "E": 4,
    "F": 5, "F#": 6, "Gb": 6, "G": 7, "Ab": 8, "A": 9,
    "Bb": 10, "B": 11
}

# バイオリンの音域: G3 (MIDI 55) 〜 E7 (MIDI 100)
VIOLIN_LOW  = 55   # G3
VIOLIN_HIGH = 100  # E7

# 和音ごとの半音インターバル（オクターブは含めない）
CHORD_INTERVALS = {
    "major":       [0, 4, 7],
    "minor":       [0, 3, 7],
    "augmented":   [0, 4, 8],
    "dominant7":   [0, 4, 7, 10],
    "diminished7": [0, 3, 6, 9],
}

# 最小オクターブ数: 総音数が十分になるよう設定
# 3-note chord: (2*N*3+1) notes. N=3 -> 19 notes
# 4-note chord: (2*N*4+1) notes. N=2 -> 17 notes
MIN_OCTAVES = {
    "major":       3,
    "minor":       3,
    "augmented":   3,
    "dominant7":   2,
    "diminished7": 2,
}

# MusicXML pitch fallback (chromatic / fallback用)
SEMITONE_TO_PITCH = {
    0:  ("C",  0),
    1:  ("C",  1),   # C#
    2:  ("D",  0),
    3:  ("E", -1),   # Eb
    4:  ("E",  0),
    5:  ("F",  0),
    6:  ("F",  1),   # F#
    7:  ("G",  0),
    8:  ("A", -1),   # Ab
    9:  ("A",  0),
    10: ("B", -1),   # Bb
    11: ("B",  0),
}

DIATONIC_LETTERS   = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
DIATONIC_SEMITONES = [0, 2, 4, 5, 7, 9, 11]

BOW_KEY_MAP = {
    "デタシェ":   "detache",
    "スタッカート": "staccato",
    "スラー4音":  "slur4",
}


# =========================================================
# ピッチスペリング
# =========================================================

def build_chord_pitch_map(root, chord_type_key):
    """
    和音理論に基づき、各半音値 → (step, alter) の辞書を返す。
    degree_offsets: [0, 2, 4] for 3-note, [0, 2, 4, 6] for 4-note chords
    """
    intervals = CHORD_INTERVALS[chord_type_key]
    root_semi = ROOT_TO_SEMITONE.get(root, 0)
    root_letter = root[0]
    root_letter_idx = DIATONIC_LETTERS.index(root_letter)

    # 和音音度の幹音インデックスオフセット (M3=+2letters, P5=+4letters, m7=+6letters)
    degree_letter_offsets = [0, 2, 4] if len(intervals) == 3 else [0, 2, 4, 6]

    pitch_map = {}
    for degree, iv in enumerate(intervals):
        sem_mod = (root_semi + iv) % 12
        letter_idx = (root_letter_idx + degree_letter_offsets[degree]) % 7
        letter = DIATONIC_LETTERS[letter_idx]
        letter_semi = DIATONIC_SEMITONES[letter_idx]
        alter = (sem_mod - letter_semi) % 12
        if alter > 6:
            alter -= 12
        pitch_map[sem_mod] = (letter, alter)
    return pitch_map


def midi_to_pitch(midi_note, pitch_map):
    """
    MIDI note番号 -> (step, alter, octave)
    オクターブ計算: midi // 12 - 1  (C4=60 -> octave=4)
    """
    octave = midi_note // 12 - 1  # 標準MusicXML: C4=60 → octave=4
    remainder = midi_note % 12
    if remainder in pitch_map:
        step, alter = pitch_map[remainder]
    else:
        step, alter = SEMITONE_TO_PITCH[remainder]
    return step, alter, octave


# =========================================================
# 音列生成
# =========================================================

def find_arpeggio_start(root_semi, target_oct):
    """
    バイオリン音域内に収まる最低の開始MIDIノートを返す。
    スケールと同様に低いオクターブから順に試す。
    """
    span = target_oct * 12  # ルートから最高音（オクターブ上のルート）までの半音数
    # 完全に音域内に収まる最低オクターブを探す
    for start_oct in range(2, 8):
        base = start_oct * 12 + root_semi
        top  = base + span
        if base >= VIOLIN_LOW and top <= VIOLIN_HIGH:
            return base
    # 完全に収まらない場合: ルート音がVIOLIN_LOW以上の最低オクターブ
    for start_oct in range(2, 8):
        base = start_oct * 12 + root_semi
        if base >= VIOLIN_LOW:
            return base
    return VIOLIN_LOW


def generate_arpeggio_notes(root, chord_type_key, target_oct):
    """
    アルペジオの音列（MIDIノート番号のリスト）を生成する。
    上行: root, 3rd, 5th [, 7th], root+12, ... , root+N*12
    下行: [7th, 5th, 3rd] + root+12 ... root (最高音は除く)
    """
    root_semi = ROOT_TO_SEMITONE.get(root, 0)
    intervals = CHORD_INTERVALS[chord_type_key]
    base = find_arpeggio_start(root_semi, target_oct)

    # 上行
    notes_up = []
    for oct in range(target_oct):
        for iv in intervals:
            midi = base + oct * 12 + iv
            if midi <= VIOLIN_HIGH:
                notes_up.append(midi)
    # 最頂音（N オクターブ上のルート）
    top = base + target_oct * 12
    if top <= VIOLIN_HIGH:
        notes_up.append(top)

    # 下行（最頂音は除く）
    notes_down = []
    for oct in range(target_oct - 1, -1, -1):
        for iv in reversed(intervals):
            midi = base + oct * 12 + iv
            if midi >= VIOLIN_LOW:
                notes_down.append(midi)

    return notes_up + notes_down


# =========================================================
# MusicXML 生成
# =========================================================

def get_fifths_for_chord(root, chord_key):
    """アルペジオの調号fifths値を返す"""
    MAJOR_FIFTHS = {
        "C": 0, "G": 1, "D": 2, "A": 3, "E": 4, "B": 5, "F#": 6, "Gb": -6,
        "Db": -5, "Ab": -4, "Eb": -3, "Bb": -2, "F": -1,
    }
    MINOR_FIFTHS = {
        "A": 0, "E": 1, "B": 2, "F#": 3, "C#": 4, "G#": 5,
        "Eb": -6, "Bb": -5, "F": -4, "C": -3, "G": -2, "D": -1,
    }
    if "minor" in chord_key or "dim" in chord_key:
        return MINOR_FIFTHS.get(root, 0)
    return MAJOR_FIFTHS.get(root, 0)


def generate_musicxml(notes, tempo, bow_ja, title, pitch_map, fifths=0):
    lines = []
    lines.append('<?xml version="1.0" encoding="UTF-8"?>')
    lines.append('<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">')
    lines.append('<score-partwise version="3.1">')
    lines.append('  <work><work-title>{}</work-title></work>'.format(escape_xml(title)))
    lines.append('  <part-list>')
    lines.append('    <score-part id="P1"><part-name>Violin</part-name></score-part>')
    lines.append('  </part-list>')
    lines.append('  <part id="P1">')

    notes_per_measure = 4
    total_notes = len(notes)

    # スラーグループサイズ
    slur_group_size = 0
    if bow_ja == "スラー4音":
        slur_group_size = 4

    slur_counter  = 0
    global_note_idx = 0
    measure_num   = 0

    # measure 0: 属性のみ（OSMDのEndlessモードで音符が脱落するのを防ぐ）
    lines.append('    <measure number="0">')
    lines.append('      <attributes>')
    lines.append('        <divisions>1</divisions>')
    lines.append(f'        <key><fifths>{fifths}</fifths></key>')
    lines.append('        <time><beats>4</beats><beat-type>4</beat-type></time>')
    lines.append('        <clef><sign>G</sign><line>2</line></clef>')
    lines.append('      </attributes>')
    lines.append(f'      <direction placement="above"><sound tempo="{tempo}"/></direction>')
    lines.append('    </measure>')

    for i in range(0, total_notes, notes_per_measure):
        measure_num += 1
        chunk = notes[i:i + notes_per_measure]
        lines.append(f'    <measure number="{measure_num}">')

        for note_midi in chunk:
            step, alter, octave = midi_to_pitch(note_midi, pitch_map)

            lines.append('      <note>')
            lines.append(f'        <pitch><step>{step}</step>')
            if alter != 0:
                lines.append(f'          <alter>{alter}</alter>')
            lines.append(f'          <octave>{octave}</octave></pitch>')
            lines.append('        <duration>1</duration>')
            lines.append('        <type>quarter</type>')

            # スタッカート
            if bow_ja == "スタッカート":
                lines.append('        <notations><articulations><staccato/></articulations></notations>')

            # スラー
            if slur_group_size > 0:
                notations_parts = []
                if slur_counter == 0:
                    notations_parts.append('<slur type="start" number="1"/>')
                if slur_counter == slur_group_size - 1 or global_note_idx == total_notes - 1:
                    notations_parts.append('<slur type="stop" number="1"/>')
                    slur_counter = -1  # will be incremented to 0 below
                if notations_parts:
                    lines.append('        <notations>' + ''.join(notations_parts) + '</notations>')
                slur_counter += 1

            global_note_idx += 1
            lines.append('      </note>')

        # 小節末のrest埋め
        for _ in range(notes_per_measure - len(chunk)):
            lines.append('      <note><rest/><duration>1</duration><type>quarter</type></note>')

        lines.append('    </measure>')

    lines.append('  </part>')
    lines.append('</score-partwise>')
    return '\n'.join(lines)


def escape_xml(s):
    return str(s).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')


def save_as_mxl(xml_content, filepath):
    """MusicXML を圧縮 .mxl 形式で保存"""
    with zipfile.ZipFile(filepath, 'w', zipfile.ZIP_DEFLATED) as zf:
        container = '''<?xml version="1.0" encoding="UTF-8"?>
<container>
  <rootfiles>
    <rootfile full-path="score.xml"/>
  </rootfiles>
</container>'''
        zf.writestr('META-INF/container.xml', container)
        zf.writestr('score.xml', xml_content)


# =========================================================
# Excel読み込み
# =========================================================

def load_excel(xlsx_path):
    """
    Excelを読み込み、行データのリストを返す。
    Col: A=title, B=composer, C=category, D=tonic, E=key_mode,
         F=chord_ja, G=chord_key, H=octaves, I=bow_ja, J=difficulty,
         K=positions, L=tempo, M=desc_short, N=description, O=tags_primary, P=tags_normal
    """
    wb = openpyxl.load_workbook(xlsx_path, data_only=True)
    ws = wb.active
    rows = []
    for row in ws.iter_rows(min_row=2, values_only=True):
        if not row[0]:  # タイトルが空なら終了
            break
        rows.append(row)
    return rows


# =========================================================
# メイン
# =========================================================

def main():
    xlsx_path  = 'prisma/data/arcoda_arpeggios_540.xlsx'
    output_dir = 'prisma/data/mxl_arpeggio'

    # 旧MXLをクリーン
    os.makedirs(output_dir, exist_ok=True)
    for f in glob.glob(os.path.join(output_dir, '*.mxl')):
        os.remove(f)
    print(f"Cleared {output_dir}")

    rows = load_excel(xlsx_path)
    print(f"Loaded {len(rows)} rows from Excel")

    generated = 0
    skipped   = 0
    errors    = 0

    for i, row in enumerate(rows, start=2):
        try:
            title       = str(row[0] or "").strip()
            composer    = str(row[1] or "").strip()
            tonic       = str(row[3] or "").strip()   # D列: ルート音
            chord_key   = str(row[6] or "").strip()   # G列: 和音種類キー
            oct_excel   = int(row[7] or 2)            # H列: オクターブ
            bow_ja      = str(row[8] or "").strip()   # I列: 弓法

            # バリデーション
            if tonic not in ROOT_TO_SEMITONE:
                print(f"  Row {i}: unknown tonic '{tonic}', skip")
                skipped += 1
                continue
            if chord_key not in CHORD_INTERVALS:
                print(f"  Row {i}: unknown chord '{chord_key}', skip")
                skipped += 1
                continue
            if bow_ja not in BOW_KEY_MAP:
                print(f"  Row {i}: unknown bow '{bow_ja}', skip")
                skipped += 1
                continue

            bow_key = BOW_KEY_MAP[bow_ja]

            # 最小オクターブ数を適用
            min_oct    = MIN_OCTAVES[chord_key]
            target_oct = max(oct_excel, min_oct)

            # ファイル名: arpeggio_{tonic}_{chord_key}_{eff_oct}oct_{bow_key}.mxl
            filename = f"arpeggio_{tonic}_{chord_key}_{target_oct}oct_{bow_key}.mxl"
            filepath = os.path.join(output_dir, filename)

            # 同一ファイルが既に生成済みならスキップ（重複行の最適化）
            if os.path.exists(filepath):
                skipped += 1
                continue

            # 音列生成
            notes = generate_arpeggio_notes(tonic, chord_key, target_oct)
            if not notes:
                print(f"  Row {i}: no notes generated for {filename}, skip")
                skipped += 1
                continue

            # ピッチマップ
            pitch_map = build_chord_pitch_map(tonic, chord_key)

            # テンポ: オクターブ数に応じて調整
            tempo = 60 if target_oct >= 3 else 72

            fifths = get_fifths_for_chord(tonic, chord_key)
            xml_content = generate_musicxml(notes, tempo, bow_ja, title, pitch_map, fifths)
            save_as_mxl(xml_content, filepath)
            generated += 1

            if generated % 50 == 0:
                print(f"  Generated {generated}...")

        except Exception as e:
            print(f"  ERROR row {i}: {e}")
            errors += 1

    print(f"\nDone: generated={generated}, skipped={skipped}, errors={errors}")
    print(f"Output dir: {output_dir}")


if __name__ == "__main__":
    main()
