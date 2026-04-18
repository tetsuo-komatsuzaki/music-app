# -*- coding: utf-8 -*-
"""
936件の音階MusicXMLファイルを生成するスクリプト
"""
import sys
import io
import os
import zipfile
import tempfile

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import openpyxl

# =========================================================
# 定数
# =========================================================
MAJOR_SCALE_INTERVALS      = [0, 2, 4, 5, 7, 9, 11, 12]
NATURAL_MINOR_INTERVALS    = [0, 2, 3, 5, 7, 8, 10, 12]
HARMONIC_MINOR_INTERVALS   = [0, 2, 3, 5, 7, 8, 11, 12]
MELODIC_MINOR_UP           = [0, 2, 3, 5, 7, 9, 11, 12]
MELODIC_MINOR_DOWN         = [0, 2, 3, 5, 7, 8, 10, 12]  # = natural minor
CHROMATIC_INTERVALS        = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

ROOT_TO_SEMITONE = {
    "C": 0, "C#": 1, "Db": 1, "D": 2, "Eb": 3, "E": 4,
    "F": 5, "F#": 6, "Gb": 6, "G": 7, "Ab": 8, "A": 9,
    "Bb": 10, "B": 11
}

# バイオリンの音域: G3 (MIDI 55) 〜 E7 (MIDI 100)
VIOLIN_LOW = 55   # G3
VIOLIN_HIGH = 100  # E7

# MusicXML pitch mapping: semitone offset -> (step, alter) — chromatic / fallback用
SEMITONE_TO_PITCH = {
    0:  ("C", 0),
    1:  ("C", 1),   # C#
    2:  ("D", 0),
    3:  ("E", -1),  # Eb
    4:  ("E", 0),
    5:  ("F", 0),
    6:  ("F", 1),   # F#
    7:  ("G", 0),
    8:  ("A", -1),  # Ab (chromatic fallback; diatonic scales should use G#)
    9:  ("A", 0),
    10: ("B", -1),  # Bb
    11: ("B", 0),
}

# 音名の順序（幹音）
DIATONIC_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
DIATONIC_SEMITONES = [0, 2, 4, 5, 7, 9, 11]  # 各幹音の半音値


def build_scale_pitch_map(root, intervals):
    """
    スケール理論に基づき、各半音値 → (step, alter) の辞書を返す。
    例: A harmonic minor では semitone 8 → ('G', 1) = G# になる。
    """
    root_semi = ROOT_TO_SEMITONE.get(root, 0)
    root_letter = root[0]  # 'A', 'B', ... (アクシデンタルを除いた幹音)
    root_letter_idx = DIATONIC_LETTERS.index(root_letter)

    pitch_map = {}
    degrees = intervals[:-1]  # オクターブ音（末尾）は除く
    for degree, iv in enumerate(degrees):
        sem_mod = (root_semi + iv) % 12
        letter_idx = (root_letter_idx + degree) % 7
        letter = DIATONIC_LETTERS[letter_idx]
        letter_semi = DIATONIC_SEMITONES[letter_idx]
        alter = (sem_mod - letter_semi) % 12
        if alter > 6:
            alter -= 12  # フラット方向が近い場合は負にする
        pitch_map[sem_mod] = (letter, alter)
    return pitch_map


def semitone_to_pitch_with_map(abs_semi, pitch_map):
    """pitch_map を使って (step, alter, octave) を返す。マップにない場合は fallback。"""
    octave = abs_semi // 12 - 1  # 標準MusicXML: C4=60 → octave=4
    remainder = abs_semi % 12
    if remainder in pitch_map:
        step, alter = pitch_map[remainder]
    else:
        step, alter = SEMITONE_TO_PITCH[remainder]
    return step, alter, octave

BOW_KEY_MAP = {
    "デタシェ": "detache",
    "スタッカート": "staccato",
    "スラー2音": "slur2",
    "スラー4音": "slur4",
    "スラー8音": "slur8",
    "レガート": "legato",
}

CATEGORY_MAP = {
    "音階": "scale",
    "アルペジオ": "arpeggio",
    "エチュード": "etude",
}

SCALE_TYPE_MAP = {
    "長音階": "major",
    "自然的短音階": "natural_minor",
    "和声的短音階": "harmonic_minor",
    "旋律的短音階": "melodic_minor",
    "半音階": "chromatic",
}

# =========================================================
# ヘルパー
# =========================================================

def get_intervals(scale_type_ja, minor_variant, direction="up"):
    # Excel列Fが「短音階」の場合、列Gのバリアント(harmonic/melodic/natural)で判別
    if scale_type_ja == "短音階":
        variant = (minor_variant or "natural").strip().lower()
        if variant == "harmonic":
            return HARMONIC_MINOR_INTERVALS
        elif variant == "melodic":
            if direction == "up":
                return MELODIC_MINOR_UP
            else:
                return MELODIC_MINOR_DOWN
        else:  # natural or empty
            return NATURAL_MINOR_INTERVALS

    st = SCALE_TYPE_MAP.get(scale_type_ja, "major")
    if st == "major":
        return MAJOR_SCALE_INTERVALS
    elif st == "natural_minor":
        return NATURAL_MINOR_INTERVALS
    elif st == "harmonic_minor":
        return HARMONIC_MINOR_INTERVALS
    elif st == "melodic_minor":
        if direction == "up":
            return MELODIC_MINOR_UP
        else:
            return MELODIC_MINOR_DOWN
    elif st == "chromatic":
        return CHROMATIC_INTERVALS
    return MAJOR_SCALE_INTERVALS


def semitone_to_musicxml_pitch(semitone):
    """absolute semitone (standard MIDI: C4=60) -> (step, alter, octave)"""
    octave = semitone // 12 - 1  # 標準MusicXML: C4=60 → octave=4
    remainder = semitone % 12
    step, alter = SEMITONE_TO_PITCH[remainder]
    return step, alter, octave


def find_best_starting_octave(root_semi, octaves):
    """バイオリン音域内に収まる最低の開始オクターブを返す（低音域優先）。
    音域を完全に収めるオクターブが存在しない場合は、ルート音のVIOLIN_LOW以上の
    最低オクターブを返す（上端ノートはVIOLIN_HIGHにクランプされる）。
    """
    # 低いオクターブから順に試す → 常に最低有効位置を返す
    for start_oct in range(2, 8):
        base = start_oct * 12 + root_semi
        top = base + octaves * 12
        if base >= VIOLIN_LOW and top <= VIOLIN_HIGH:
            return base
    # 完全に収まるオクターブなし: ルート音の最低有効オクターブを返す
    for start_oct in range(2, 8):
        base = start_oct * 12 + root_semi
        if base >= VIOLIN_LOW:
            return base
    return VIOLIN_LOW


def generate_note_sequence_forced(root, scale_type_ja, minor_variant, octaves, start_midi):
    """指定MIDIノートから始まる音列を生成する（開始音を強制指定）"""
    base = start_midi
    notes = []

    if octaves == 1:
        intervals = get_intervals(scale_type_ja, minor_variant, "up")
        for iv in intervals:
            n = base + iv
            notes.append(max(VIOLIN_LOW, min(n, VIOLIN_HIGH)))
    else:
        for oct in range(octaves):
            intervals_up = get_intervals(scale_type_ja, minor_variant, "up")
            for iv in intervals_up:
                n = base + oct * 12 + iv
                if n not in notes and n <= VIOLIN_HIGH:
                    notes.append(n)

        if not notes:
            return notes

        top = notes[-1]
        down_notes = []
        for oct in range(octaves - 1, -1, -1):
            intervals_down = get_intervals(scale_type_ja, minor_variant, "down")
            for iv in reversed(intervals_down):
                n = base + oct * 12 + iv
                if n not in down_notes and n < top and n >= VIOLIN_LOW:
                    down_notes.append(n)

        down_notes.sort(reverse=True)
        notes.extend(down_notes)

    return notes


def generate_note_sequence(root, scale_type_ja, minor_variant, octaves):
    """Generate list of semitones for the scale (within violin range)"""
    root_semi = ROOT_TO_SEMITONE.get(root, 0)
    base = find_best_starting_octave(root_semi, octaves)

    notes = []

    if octaves == 1:
        # 上行のみ
        intervals = get_intervals(scale_type_ja, minor_variant, "up")
        for iv in intervals:
            n = base + iv
            notes.append(max(VIOLIN_LOW, min(n, VIOLIN_HIGH)))
    else:
        # 上行
        for oct in range(octaves):
            intervals_up = get_intervals(scale_type_ja, minor_variant, "up")
            for iv in intervals_up:
                n = base + oct * 12 + iv
                if n not in notes and n <= VIOLIN_HIGH:
                    notes.append(n)

        # 最高音から下行
        top = notes[-1]
        down_notes = []
        for oct in range(octaves - 1, -1, -1):
            intervals_down = get_intervals(scale_type_ja, minor_variant, "down")
            for iv in reversed(intervals_down):
                n = base + oct * 12 + iv
                if n not in down_notes and n < top and n >= VIOLIN_LOW:
                    down_notes.append(n)

        down_notes.sort(reverse=True)
        notes.extend(down_notes)

    return notes


def parse_tempo(tempo_str):
    """'♩= 60〜100' -> (60, 100)"""
    if not tempo_str:
        return 60, 100
    import re
    nums = re.findall(r'\d+', str(tempo_str))
    if len(nums) >= 2:
        return int(nums[0]), int(nums[1])
    elif len(nums) == 1:
        return int(nums[0]), int(nums[0])
    return 60, 100


def get_fifths(root, mode_key):
    """調号のfifths値を返す（シャープ=正、フラット=負）"""
    MAJOR_FIFTHS = {
        "C": 0, "G": 1, "D": 2, "A": 3, "E": 4, "B": 5, "F#": 6, "Gb": -6,
        "Db": -5, "Ab": -4, "Eb": -3, "Bb": -2, "F": -1,
    }
    MINOR_FIFTHS = {
        "A": 0, "E": 1, "B": 2, "F#": 3, "C#": 4, "G#": 5,
        "Eb": -6, "Bb": -5, "F": -4, "C": -3, "G": -2, "D": -1,
    }
    if mode_key == "minor":
        return MINOR_FIFTHS.get(root, 0)
    elif mode_key == "chromatic":
        return 0
    return MAJOR_FIFTHS.get(root, 0)


def generate_musicxml(notes, tempo, bow, title, pitch_map=None, fifths=0):
    """Generate MusicXML string"""
    lines = []
    lines.append('<?xml version="1.0" encoding="UTF-8"?>')
    lines.append('<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">')
    lines.append('<score-partwise version="3.1">')
    lines.append('  <work><work-title>{}</work-title></work>'.format(escape_xml(title)))
    lines.append('  <part-list>')
    lines.append('    <score-part id="P1"><part-name>Violin</part-name></score-part>')
    lines.append('  </part-list>')
    lines.append('  <part id="P1">')

    # Group notes into measures (4 notes per measure in 4/4 time, quarter notes)
    notes_per_measure = 4
    measure_num = 0
    total_notes = len(notes)

    # Track slur state
    slur_group_size = 0
    if bow == "スラー2音":
        slur_group_size = 2
    elif bow == "スラー4音":
        slur_group_size = 4
    elif bow == "スラー8音":
        slur_group_size = 8
    elif bow == "レガート":
        slur_group_size = total_notes  # all notes in one slur

    slur_counter = 0
    in_slur = False
    global_note_idx = 0

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

        for note_semi in chunk:
            if pitch_map is not None:
                step, alter, octave = semitone_to_pitch_with_map(note_semi, pitch_map)
            else:
                step, alter, octave = semitone_to_musicxml_pitch(note_semi)

            lines.append('      <note>')
            lines.append(f'        <pitch><step>{step}</step>')
            if alter != 0:
                lines.append(f'          <alter>{alter}</alter>')
            lines.append(f'          <octave>{octave}</octave></pitch>')
            lines.append('        <duration>1</duration>')
            lines.append('        <type>quarter</type>')

            # Staccato
            if bow == "スタッカート":
                lines.append('        <notations><articulations><staccato/></articulations></notations>')

            # Slur handling
            if slur_group_size > 0:
                notations_content = []
                if slur_counter == 0:
                    notations_content.append('<slur type="start" number="1"/>')
                    in_slur = True
                if slur_counter == slur_group_size - 1 or global_note_idx == total_notes - 1:
                    notations_content.append('<slur type="stop" number="1"/>')
                    in_slur = False
                    slur_counter = -1  # will be incremented to 0

                if notations_content:
                    if bow == "スタッカート":
                        pass  # already has notations
                    else:
                        lines.append('        <notations>' + ''.join(notations_content) + '</notations>')

                slur_counter += 1

            global_note_idx += 1
            lines.append('      </note>')

        # Pad incomplete last measure with rests
        remaining = notes_per_measure - len(chunk)
        for _ in range(remaining):
            lines.append('      <note><rest/><duration>1</duration><type>quarter</type></note>')

        lines.append('    </measure>')

    lines.append('  </part>')
    lines.append('</score-partwise>')
    return '\n'.join(lines)


def escape_xml(s):
    return str(s).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')


def save_as_mxl(xml_content, filepath):
    """Save MusicXML as compressed .mxl file"""
    with zipfile.ZipFile(filepath, 'w', zipfile.ZIP_DEFLATED) as zf:
        # META-INF/container.xml
        container = '''<?xml version="1.0" encoding="UTF-8"?>
<container>
  <rootfiles>
    <rootfile full-path="score.xml"/>
  </rootfiles>
</container>'''
        zf.writestr('META-INF/container.xml', container)
        zf.writestr('score.xml', xml_content)


# =========================================================
# メイン処理（コードベースカリキュラム）
# =========================================================
def main():
    import glob
    output_dir = 'prisma/data/mxl'

    # 旧MXLファイルをすべて削除してクリーンスタート
    for f in glob.glob(os.path.join(output_dir, '*.mxl')):
        os.remove(f)
    os.makedirs(output_dir, exist_ok=True)

    # =========================================================
    # カリキュラム定義
    # =========================================================
    # スケールタイプ: (scale_type_ja, minor_variant, mode_key, mode_label, bow_ja_key)
    SCALE_TYPES = [
        ("長音階",  "",          "major",      "長調"),
        ("短音階",  "harmonic",  "minor",      "和声的短調"),
        ("短音階",  "melodic",   "minor",      "旋律的短調"),
        ("短音階",  "natural",   "minor",      "自然短調"),
        ("半音階",  "chromatic", "chromatic",  "半音階"),
    ]

    BOW_STYLES = [
        ("デタシェ",    "detache"),
        ("スタッカート", "staccato"),
        ("スラー2音",   "slur2"),
        ("スラー4音",   "slur4"),
        ("スラー8音",   "slur8"),
        ("レガート",    "legato"),
    ]

    BOW_LABELS = {
        "detache": "デタシェ", "staccato": "スタッカート",
        "slur2": "スラー2", "slur4": "スラー4",
        "slur8": "スラー8", "legato": "レガート",
    }

    # 低音域: 2オクターブ (G3〜F#4 = MIDI 55〜66 開始)
    # バイオリン音域 G3-E7 の下半分をカバー
    LOW_2OCT = [
        ("G",  55), ("Ab", 56), ("A",  57), ("Bb", 58), ("B",  59),
        ("C",  60), ("Db", 61), ("D",  62), ("Eb", 63), ("E",  64),
        ("F",  65), ("F#", 66),
    ]

    # 高音域: 2オクターブ (G4〜E5 = MIDI 67〜76 開始)
    # バイオリン音域の上半分をカバー (top = 67+24=91 〜 76+24=100)
    HIGH_2OCT = [
        ("G",  67), ("Ab", 68), ("A",  69), ("Bb", 70), ("B",  71),
        ("C",  72), ("Db", 73), ("D",  74), ("Eb", 75), ("E",  76),
    ]

    # 全音域: 3オクターブ (G3〜E4 = MIDI 55〜64 開始)
    # top = 55+36=91 〜 64+36=100 → G3-G6 から E4-E7 まで
    FULL_3OCT = [
        ("G",  55), ("Ab", 56), ("A",  57), ("Bb", 58), ("B",  59),
        ("C",  60), ("Db", 61), ("D",  62), ("Eb", 63), ("E",  64),
    ]

    # 全エントリ: (tonic, octaves, start_midi, register)
    CURRICULUM = (
        [(t, 2, s, "low")  for t, s in LOW_2OCT]  +
        [(t, 2, s, "high") for t, s in HIGH_2OCT] +
        [(t, 3, s, "full") for t, s in FULL_3OCT]
    )

    generated = 0
    errors = 0

    for tonic, octaves, start_midi, register in CURRICULUM:
        for scale_type_ja, minor_variant, mode_key, mode_label in SCALE_TYPES:
            for bow_ja, bow_key in BOW_STYLES:
                # ファイル名: scale_{tonic}_{mode_key}_{variant}_{N}oct_{bow}_{register}.mxl
                variant_key = minor_variant  # "harmonic"/"melodic"/"natural"/"chromatic"/""
                filename = (
                    f"scale_{tonic}_{mode_key}_{variant_key}"
                    f"_{octaves}oct_{bow_key}_{register}.mxl"
                )
                filepath = os.path.join(output_dir, filename)

                # タイトル
                bow_label = BOW_LABELS[bow_key]
                register_labels = {"low": "低", "high": "高", "full": "全"}
                register_ja = register_labels[register]
                if scale_type_ja == "半音階":
                    title = f"{tonic} 半音階 {octaves}オクターブ {bow_label} ({register_ja}音域)"
                else:
                    title = f"{tonic} {mode_label} {octaves}オクターブ {bow_label} ({register_ja}音域)"

                try:
                    notes = generate_note_sequence_forced(
                        tonic, scale_type_ja, minor_variant, octaves, start_midi
                    )
                    if not notes:
                        continue

                    if scale_type_ja != "半音階":
                        intervals = get_intervals(scale_type_ja, minor_variant, "up")
                        pitch_map = build_scale_pitch_map(tonic, intervals)
                    else:
                        pitch_map = None

                    tempo = 60 if octaves == 3 else 72
                    fifths = get_fifths(tonic, mode_key)
                    xml_content = generate_musicxml(notes, tempo, bow_ja, title, pitch_map, fifths)
                    save_as_mxl(xml_content, filepath)
                    generated += 1
                except Exception as e:
                    print(f"ERROR {filename}: {e}")
                    errors += 1

    print(f"\nGenerated: {generated} files")
    print(f"Errors:    {errors}")
    print(f"Output dir: {output_dir}")


if __name__ == "__main__":
    main()
