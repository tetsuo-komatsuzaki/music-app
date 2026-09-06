"""43/121 しか一致しない理由と、下方向シフトで消える8音の理由を切り分ける。"""
import json, pathlib, sys, warnings, collections
warnings.filterwarnings("ignore")
import numpy as np, librosa
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import _load_analyzer
from pitch_probe import compute_f0, gated_valid
from _cache import load_audio, local_case
from note_probe import load_notes
A = _load_analyzer.load()

case = local_case(pathlib.Path(sys.argv[1]))
old = json.loads((case / "comparison_result.json").read_text(encoding="utf-8"))["results"]
print("old evaluation_status:", collections.Counter(r.get("evaluation_status") for r in old))
print("old pitch_ok:", collections.Counter(r.get("pitch_ok") for r in old))

notes = load_notes(case)
y, sr = load_audio(str(case / "recording.wav"))
fmin, fmax = librosa.note_to_hz("G3"), librosa.note_to_hz("E7")

def explain(t, hz, dur, vt, vf, prev_hz=None, next_hz=None):
    margin = dur * (1.0 - A.CENTER_RATIO) / 2.0
    mask = (vt >= t + margin) & (vt <= t + dur - margin)
    cnt = int(mask.sum())
    if cnt < A.MIN_VALID_FRAMES:
        return f"frames<{A.MIN_VALID_FRAMES} (cnt={cnt})", None
    med = float(np.median(vf[mask]))
    c = float(A.cents_diff(med, hz))
    if abs(c) > A.PITCH_SEARCH_CENTS:
        return f"cents>{A.PITCH_SEARCH_CENTS} ({c:+.0f}c; med={med:.0f}Hz vs exp={hz:.0f}Hz)", c
    if abs(c) > A.PITCH_TOLERANCE_CENTS:
        if prev_hz and abs(A.cents_diff(med, prev_hz)) < abs(c): return f"skip: closer to prev ({c:+.0f}c)", c
        if next_hz and abs(A.cents_diff(med, next_hz)) < abs(c): return f"skip: closer to next ({c:+.0f}c)", c
    return "match", c

def run(label, ysig):
    f0, rms, t = compute_f0(ysig, sr, fmin, fmax)
    vm = gated_valid(f0, rms, t); vt, vf = t[vm], f0[vm]
    reasons = collections.Counter(); rows = []
    for i, n in enumerate(notes):
        prev_hz = notes[i-1]["hz"] if i > 0 else None
        next_hz = notes[i+1]["hz"] if i+1 < len(notes) else None
        r, c = explain(n["start"], n["hz"], n["dur"], vt, vf, prev_hz, next_hz)
        reasons[r.split(" (")[0]] += 1
        rows.append((n["note_index"], n["note_name"], round(n["dur"],2), r))
    print(f"\n[{label}] valid={vm.sum()}/{len(vm)}  reasons:", dict(reasons))
    return rows

base = run("base", y)
for ni, nm, dur, r in base:
    if r != "match": print(f"   #{ni:>3} {nm:4} dur={dur:.2f}  {r}")

ys = librosa.effects.pitch_shift(y, sr=sr, n_steps=-10.0, bins_per_octave=1200)
sh = run("-10c", ys)
print("\nbase=match but -10c lost:")
for (ni, nm, dur, rb), (_, _, _, rs) in zip(base, sh):
    if rb == "match" and rs != "match": print(f"   #{ni:>3} {nm:4} dur={dur:.2f}  {rs}")
