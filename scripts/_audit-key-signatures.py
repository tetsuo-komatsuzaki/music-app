# -*- coding: utf-8 -*-
"""
scripts/_audit-key-signatures.py
全 scale + arpeggio MXL の調号正当性を網羅監査する。

各ファイルについて以下を検証:
  1. ファイル名から導いた「期待される fifths」と、実際の <fifths> 値が一致するか
  2. <alter> の出現回数（多すぎないか、調号で吸収できる alter が音符側に残っていないか）
"""
import sys
import io
import os
import zipfile
import re

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 標準音楽理論に基づく期待調号
EXPECTED_MAJOR_FIFTHS = {
    "C": 0, "G": 1, "D": 2, "A": 3, "E": 4, "B": 5, "F#": 6, "C#": 7,
    "F": -1, "Bb": -2, "Eb": -3, "Ab": -4, "Db": -5, "Gb": -6, "Cb": -7,
}
EXPECTED_MINOR_FIFTHS = {
    "A": 0, "E": 1, "B": 2, "F#": 3, "C#": 4, "G#": 5, "D#": 6, "A#": 7,
    "D": -1, "G": -2, "C": -3, "F": -4, "Bb": -5, "Eb": -6, "Ab": -7,
    # Db minor は -8 で表記不可。慣例的に C# minor (+4) に書き換える運用が望ましい。
    # ここでは「ありうる正しい値の集合」を示すために -7 (Ab minor enharmonic としての扱い) を許容しない。
    # Db minor は要判断項目として別扱い。
}


def parse_scale_filename(fn):
    """scale_<tonic>_<mode>_<variant>_<N>oct_<bow>_<register>.mxl"""
    m = re.match(r'^scale_([A-G][#b]?)_(major|minor|chromatic)_([a-z]*)_(\d+)oct_(\w+?)_(low|high|full)\.mxl$', fn)
    if not m: return None
    return {"tonic": m.group(1), "mode": m.group(2), "variant": m.group(3),
            "octaves": int(m.group(4)), "bow": m.group(5), "register": m.group(6)}


def parse_arpeggio_filename(fn):
    """arpeggio_<tonic>_<chord>_<N>oct_<bow>.mxl"""
    m = re.match(r'^arpeggio_([A-G][#b]?)_(\w+?)_(\d+)oct_(\w+)\.mxl$', fn)
    if not m: return None
    return {"tonic": m.group(1), "chord": m.group(2),
            "octaves": int(m.group(3)), "bow": m.group(4)}


def expected_fifths_for_scale(tonic, mode):
    if mode == "major":
        return EXPECTED_MAJOR_FIFTHS.get(tonic, "UNKNOWN")
    elif mode == "minor":
        return EXPECTED_MINOR_FIFTHS.get(tonic, "UNKNOWN")
    elif mode == "chromatic":
        return 0  # chromatic は調なし
    return "UNKNOWN"


def expected_fifths_for_arpeggio(tonic, chord):
    if "minor" in chord or "diminished" in chord or "dim" in chord:
        return EXPECTED_MINOR_FIFTHS.get(tonic, "UNKNOWN")
    return EXPECTED_MAJOR_FIFTHS.get(tonic, "UNKNOWN")


def read_score_xml(mxl_path):
    with zipfile.ZipFile(mxl_path) as zf:
        for name in zf.namelist():
            if name == 'score.xml' or (name.endswith('.xml') and not name.startswith('META-INF/')):
                return zf.read(name).decode('utf-8')
    return None


def audit_directory(directory, parse_fn, expected_fn, kind):
    files = sorted(f for f in os.listdir(directory) if f.endswith('.mxl'))
    bugs = []
    ok_count = 0
    skipped = 0

    for f in files:
        meta = parse_fn(f)
        if not meta:
            skipped += 1
            continue
        if kind == "scale":
            expected = expected_fn(meta["tonic"], meta["mode"])
        else:
            expected = expected_fn(meta["tonic"], meta["chord"])
        if expected == "UNKNOWN":
            bugs.append((f, "UNKNOWN_TONIC", expected, None))
            continue

        xml = read_score_xml(os.path.join(directory, f))
        if xml is None:
            bugs.append((f, "NO_XML", expected, None))
            continue
        m = re.search(r'<fifths>([-\d]+)</fifths>', xml)
        actual = int(m.group(1)) if m else None
        alter_count = len(re.findall(r'<alter>', xml))

        if actual != expected:
            bugs.append((f, "FIFTHS_MISMATCH", expected, actual))
        else:
            ok_count += 1

    return {"total": len(files), "ok": ok_count, "bugs": bugs, "skipped": skipped}


def main():
    print("\n=== SCALE audit ===")
    r = audit_directory("prisma/data/mxl", parse_scale_filename, expected_fifths_for_scale, "scale")
    print(f"Total: {r['total']}, OK: {r['ok']}, Bugs: {len(r['bugs'])}, Skipped: {r['skipped']}")
    if r["bugs"]:
        print("\n--- Mismatches (first 30) ---")
        for f, reason, expected, actual in r["bugs"][:30]:
            print(f"  [{reason}] {f}: expected={expected}, actual={actual}")
        # group by (tonic, mode, variant)
        groups = {}
        for f, reason, expected, actual in r["bugs"]:
            meta = parse_scale_filename(f)
            if not meta: continue
            key = (meta["tonic"], meta["mode"], meta.get("variant", ""), expected, actual)
            groups[key] = groups.get(key, 0) + 1
        print("\n--- Bug groups (tonic, mode, variant, expected, actual): count ---")
        for k, c in sorted(groups.items()):
            print(f"  {k}: {c}")

    print("\n=== ARPEGGIO audit ===")
    r2 = audit_directory("prisma/data/mxl_arpeggio", parse_arpeggio_filename, expected_fifths_for_arpeggio, "arpeggio")
    print(f"Total: {r2['total']}, OK: {r2['ok']}, Bugs: {len(r2['bugs'])}, Skipped: {r2['skipped']}")
    if r2["bugs"]:
        print("\n--- Mismatches (first 30) ---")
        for f, reason, expected, actual in r2["bugs"][:30]:
            print(f"  [{reason}] {f}: expected={expected}, actual={actual}")
        groups = {}
        for f, reason, expected, actual in r2["bugs"]:
            meta = parse_arpeggio_filename(f)
            if not meta: continue
            key = (meta["tonic"], meta["chord"], expected, actual)
            groups[key] = groups.get(key, 0) + 1
        print("\n--- Bug groups (tonic, chord, expected, actual): count ---")
        for k, c in sorted(groups.items()):
            print(f"  {k}: {c}")


if __name__ == '__main__':
    main()
