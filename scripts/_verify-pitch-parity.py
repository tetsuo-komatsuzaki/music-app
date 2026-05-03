# -*- coding: utf-8 -*-
"""
scripts/_verify-pitch-parity.py
Usage:
  # ベースライン取得（変更前に1回）
  python scripts/_verify-pitch-parity.py snapshot prisma/data/mxl       baseline-scale.json
  python scripts/_verify-pitch-parity.py snapshot prisma/data/mxl_arpeggio baseline-arpeggio.json

  # 再生成後の検証
  python scripts/_verify-pitch-parity.py verify prisma/data/mxl       baseline-scale.json
  python scripts/_verify-pitch-parity.py verify prisma/data/mxl_arpeggio baseline-arpeggio.json

各 .mxl の全 <note> から (effective_step, effective_alter, octave) を計算し
MIDI ノート番号化したものを保存・比較する。
key signature による暗黙の alter も考慮するため、修正前後で MIDI が一致するはず。
"""
import sys
import io
import os
import json
import zipfile
import xml.etree.ElementTree as ET

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

SHARP_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B']
FLAT_ORDER  = ['B', 'E', 'A', 'D', 'G', 'C', 'F']
STEP_TO_SEMI = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}


def key_sig_default_alter(step, fifths):
    if fifths > 0:
        return 1 if step in SHARP_ORDER[:fifths] else 0
    if fifths < 0:
        return -1 if step in FLAT_ORDER[:abs(fifths)] else 0
    return 0


def extract_midi_sequence(xml_str):
    """
    MusicXML から MIDI ノート列を抽出する。
    各小節内で:
      - <key><fifths> を読む
      - 各 <note> について step/alter/octave を読み取り
      - alter が無い場合: 同一小節の同 (step, octave) で先行する明示的 alter があればそれを使用、
                          なければ key signature 既定値を使用
      - alter があればそのまま使用
    """
    root = ET.fromstring(xml_str)
    midi_seq = []
    fifths = 0

    # find part(s)
    for part in root.iter('part'):
        for measure in part.iter('measure'):
            # update fifths if specified in this measure
            for k in measure.iter('key'):
                f_el = k.find('fifths')
                if f_el is not None and f_el.text is not None:
                    fifths = int(f_el.text)

            # measure-local accidental state: (step, octave) -> alter
            measure_state = {}
            for note in measure.iter('note'):
                if note.find('rest') is not None:
                    continue
                pitch = note.find('pitch')
                if pitch is None:
                    continue
                step_el = pitch.find('step')
                alter_el = pitch.find('alter')
                oct_el = pitch.find('octave')
                if step_el is None or oct_el is None:
                    continue
                step = step_el.text.strip()
                octave = int(oct_el.text)

                if alter_el is not None and alter_el.text is not None:
                    alter = int(float(alter_el.text))
                else:
                    # check measure-local prior state, then key sig
                    key = (step, octave)
                    if key in measure_state:
                        alter = measure_state[key]
                    else:
                        alter = key_sig_default_alter(step, fifths)

                # remember for the rest of the measure
                measure_state[(step, octave)] = alter

                base = STEP_TO_SEMI.get(step, 0)
                midi = (octave + 1) * 12 + base + alter
                midi_seq.append(midi)

    return midi_seq


def read_score_xml(mxl_path):
    with zipfile.ZipFile(mxl_path) as zf:
        # find rootfile from container.xml or fallback to score.xml
        try:
            container = zf.read('META-INF/container.xml').decode('utf-8')
            cr = ET.fromstring(container)
            for rf in cr.iter():
                if rf.tag.endswith('rootfile'):
                    fp = rf.attrib.get('full-path')
                    if fp:
                        return zf.read(fp).decode('utf-8')
        except KeyError:
            pass
        # fallback
        for name in zf.namelist():
            if name.endswith('.xml') and not name.startswith('META-INF/'):
                return zf.read(name).decode('utf-8')
    raise RuntimeError(f"No score xml in {mxl_path}")


def snapshot(directory, output_path):
    files = sorted(f for f in os.listdir(directory) if f.endswith('.mxl'))
    result = {}
    for f in files:
        try:
            xml = read_score_xml(os.path.join(directory, f))
            seq = extract_midi_sequence(xml)
            result[f] = seq
        except Exception as e:
            print(f"  ERROR {f}: {e}")
            result[f] = None
    with open(output_path, 'w', encoding='utf-8') as fp:
        json.dump(result, fp)
    print(f"Snapshot saved: {output_path} ({len(result)} files)")


def verify(directory, baseline_path):
    with open(baseline_path, 'r', encoding='utf-8') as fp:
        baseline = json.load(fp)

    files = sorted(f for f in os.listdir(directory) if f.endswith('.mxl'))
    ok = 0
    diff = []
    missing = []
    for f in files:
        if f not in baseline:
            missing.append(f)
            continue
        try:
            xml = read_score_xml(os.path.join(directory, f))
            seq = extract_midi_sequence(xml)
            if seq == baseline[f]:
                ok += 1
            else:
                # find first diff
                first = next(
                    (i for i, (a, b) in enumerate(zip(seq, baseline[f])) if a != b),
                    min(len(seq), len(baseline[f])),
                )
                diff.append((f, len(baseline[f]), len(seq), first))
        except Exception as e:
            diff.append((f, -1, -1, str(e)))

    print(f"\n=== Verification result ===")
    print(f"OK:      {ok}/{len(files)}")
    print(f"DIFF:    {len(diff)}")
    print(f"MISSING: {len(missing)}")
    if diff:
        print("\n--- DIFF details (first 10) ---")
        for d in diff[:10]:
            print(f"  {d}")
    if missing:
        print("\n--- MISSING (first 10) ---")
        for m in missing[:10]:
            print(f"  {m}")
    return len(diff) == 0


def main():
    if len(sys.argv) < 4:
        print(__doc__)
        sys.exit(2)
    cmd = sys.argv[1]
    directory = sys.argv[2]
    path = sys.argv[3]
    if cmd == 'snapshot':
        snapshot(directory, path)
    elif cmd == 'verify':
        ok = verify(directory, path)
        sys.exit(0 if ok else 1)
    else:
        print(__doc__)
        sys.exit(2)


if __name__ == '__main__':
    main()
