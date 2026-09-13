"""物理制約(音符の区間が無音なら、その位置は採らない)を入れると最良の位置がどこへ動くか。"""
import pathlib, sys, warnings
warnings.filterwarnings("ignore")
import numpy as np, librosa
HERE = pathlib.Path("tests/audit").resolve(); sys.path.insert(0, str(HERE))
from _cache import local_case, load_audio
import offline_analyzer as OA
A = OA.A
for cid, lab in [("cmplsqe3i000004i61gisxyp5","実演奏A"),("cmnl2fcv800000ojywq952uxk","糸"),
                 ("cmofva0fb0005zsjy86sy0n9c","実演奏B")]:
    case = local_case(HERE.parent/"cases"/cid)
    y, sr = load_audio(str(case/"recording.wav"))
    res = OA.analyze_case(case); gs = float(res["summary"]["global_shift"])
    an, bpm, info = OA.notes_from_case(case); tol = A.get_timing_tolerance(bpm)
    fmin,fmax = A.INSTRUMENT_PITCH_RANGE.get(info.get("instrument","unknown"), A.DEFAULT_PITCH_RANGE)
    notes=[n for n in an if n.get("type")=="note" and n.get("pitches")]
    yin=np.array(librosa.yin(y,fmin=librosa.note_to_hz(fmin),fmax=librosa.note_to_hz(fmax),sr=sr,
                             frame_length=A.FRAME_LENGTH,hop_length=A.HOP_LENGTH))
    t=np.array(librosa.frames_to_time(np.arange(len(yin)),sr=sr,hop_length=A.HOP_LENGTH))
    rms=np.array(librosa.feature.rms(y=y,frame_length=A.FRAME_LENGTH,hop_length=A.HOP_LENGTH)[0])
    voiced=(~np.isnan(yin))&(rms>0.01); vt,vf=t[voiced],yin[voiced]; dur=len(y)/sr
    def voiced_frac(nt, sh):     # その音符の区間のうち、音が鳴っているフレームの割合
        t0,t1=float(nt["start_time_sec"])+sh, float(nt["end_time_sec"])+sh
        a=int(max(0,np.floor(t0*sr/A.HOP_LENGTH))); b=int(min(len(voiced),np.ceil(t1*sr/A.HOP_LENGTH)))
        if b<=a: return 0.0
        return float(voiced[a:b].mean())
    def match(sh):
        c=0
        for nt in notes:
            t0,t1=float(nt["start_time_sec"])+sh,float(nt["end_time_sec"])+sh
            if t1<0 or t0>dur: continue
            mg=(t1-t0)*0.1; k=(vt>=t0+mg)&(vt<=t1-mg)
            if k.sum()>=5 and abs(1200*np.log2(np.median(vf[k])/float(nt["pitches"][0])))<=50: c+=1
        return c
    grid=np.arange(-5,5.001,0.05)
    rows=[(float(d), match(gs+d), voiced_frac(notes[0], gs+d)) for d in grid]
    best_free=max(rows,key=lambda r:r[1])
    print(f"\n=== {lab}  現行 shift={gs:+.3f}  1音目の音価 {float(notes[0]['end_time_sec'])-float(notes[0]['start_time_sec']):.2f}s")
    print(f"  制約なしの最良: Δ={best_free[0]:+.2f}  一致{best_free[1]}  1音目の区間が鳴っている割合 {best_free[2]:.0%}")
    for thr in (0.3, 0.5, 0.7):
        ok=[r for r in rows if r[2]>=thr]
        if not ok:
            print(f"  1音目が{thr:.0%}以上鳴っている位置のみ: 候補なし → 位置を決められない"); continue
        b=max(ok,key=lambda r:r[1])
        print(f"  1音目が{thr:.0%}以上鳴っている位置のみ: Δ={b[0]:+.2f}  一致{b[1]}  候補{len(ok)}/{len(rows)}")
    print(f"  現行位置(Δ=0)の1音目: 鳴っている割合 {voiced_frac(notes[0], gs):.0%}  一致{match(gs)}")
