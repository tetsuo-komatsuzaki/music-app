"""gate_vs_width.py — ノイズゲートの床と探索幅を独立に動かして一致を測る。

実演奏B が床と幅のどちらで壊れているかを切り分ける。結果は両方。
解析器は変更しない。
"""
import pathlib, sys, warnings
warnings.filterwarnings("ignore")
import numpy as np, librosa
HERE = pathlib.Path("tests/audit").resolve(); sys.path.insert(0, str(HERE))
from _cache import local_case, load_audio
import offline_analyzer as OA
A = OA.A
cid = "cmofva0fb0005zsjy86sy0n9c"
case = local_case(HERE.parent / "cases" / cid)
y, sr = load_audio(str(case / "recording.wav"))
res = OA.analyze_case(case); S = res["summary"]
gs, beat = float(S["global_shift"]), float(S["beat_sec"])
an, bpm, info = OA.notes_from_case(case)
fmin_n, fmax_n = A.INSTRUMENT_PITCH_RANGE.get(info.get("instrument","unknown"), A.DEFAULT_PITCH_RANGE)
notes = [n for n in an if n.get("type")=="note" and n.get("pitches")]
head = notes[:15]
yin = np.array(librosa.yin(y, fmin=librosa.note_to_hz(fmin_n), fmax=librosa.note_to_hz(fmax_n),
                           sr=sr, frame_length=A.FRAME_LENGTH, hop_length=A.HOP_LENGTH))
t_all = np.array(librosa.frames_to_time(np.arange(len(yin)), sr=sr, hop_length=A.HOP_LENGTH))
rms = np.array(librosa.feature.rms(y=y, frame_length=A.FRAME_LENGTH, hop_length=A.HOP_LENGTH)[0])
rng = max(beat*A.SEARCH_RANGE_BEATS, A.SEARCH_RANGE_MIN_SEC)
print(f"実演奏B  1拍={beat:.2f}s  探せる幅=±{rng:.2f}s  現行位置 shift={gs:.3f}s\n")
for lab, thr in [("本番の床 (0.0448)", 0.04481), ("床を直したとき (0.01)", 0.01)]:
    vm = (~np.isnan(yin)) & (rms > thr); vt, vf = t_all[vm], yin[vm]
    def m(sh):
        c=0
        for nt in head:
            t0,t1=float(nt["start_time_sec"])+sh, float(nt["end_time_sec"])+sh
            mg=(t1-t0)*0.1; k=(vt>=t0+mg)&(vt<=t1-mg)
            if k.sum()>=5 and abs(1200*np.log2(np.median(vf[k])/float(nt["pitches"][0])))<=50: c+=1
        return c
    inr = [(d, m(gs+d)) for d in np.arange(-rng, rng+1e-9, 0.05)]
    wide = [(d, m(gs+d)) for d in np.arange(-6.0, 6.0+1e-9, 0.05)]
    bi = max(inr, key=lambda x: x[1]); bw = max(wide, key=lambda x: x[1])
    print(f"{lab}:  ゲート通過 {vm.sum()}/{len(vm)} ({vm.sum()/len(vm)*100:.1f}%)")
    print(f"   現行の幅 ±{rng:.2f}s の中での最良: {bi[1]}/15 ({bi[0]:+.2f}s)")
    print(f"   幅を ±6s に広げたときの最良:      {bw[1]}/15 ({bw[0]:+.2f}s)")
    print(f"   → 床だけ直して幅そのままなら {bi[1]}/15、両方直せば {bw[1]}/15\n")
