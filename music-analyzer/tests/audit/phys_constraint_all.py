"""物理制約を「1音目だけ」でなく「録音内の全音符」で見る版。"""
import pathlib, sys, warnings
warnings.filterwarnings("ignore")
import numpy as np, librosa
HERE = pathlib.Path("tests/audit").resolve(); sys.path.insert(0, str(HERE))
from _cache import local_case, load_audio
import offline_analyzer as OA
A = OA.A
KNOWN = {"実演奏A": +1.05, "糸": 0.00, "実演奏B": -3.10}   # judge_zero と固定窓から見た妥当な位置
for cid, lab in [("cmplsqe3i000004i61gisxyp5","実演奏A"),("cmnl2fcv800000ojywq952uxk","糸"),
                 ("cmofva0fb0005zsjy86sy0n9c","実演奏B")]:
    case = local_case(HERE.parent/"cases"/cid)
    y, sr = load_audio(str(case/"recording.wav"))
    res = OA.analyze_case(case); gs = float(res["summary"]["global_shift"])
    an, bpm, info = OA.notes_from_case(case)
    fmin,fmax = A.INSTRUMENT_PITCH_RANGE.get(info.get("instrument","unknown"), A.DEFAULT_PITCH_RANGE)
    notes=[n for n in an if n.get("type")=="note" and n.get("pitches")]
    yin=np.array(librosa.yin(y,fmin=librosa.note_to_hz(fmin),fmax=librosa.note_to_hz(fmax),sr=sr,
                             frame_length=A.FRAME_LENGTH,hop_length=A.HOP_LENGTH))
    t=np.array(librosa.frames_to_time(np.arange(len(yin)),sr=sr,hop_length=A.HOP_LENGTH))
    rms=np.array(librosa.feature.rms(y=y,frame_length=A.FRAME_LENGTH,hop_length=A.HOP_LENGTH)[0])
    voiced=(~np.isnan(yin))&(rms>0.01); vt,vf=t[voiced],yin[voiced]; dur=len(y)/sr
    def stats(sh):
        sounded=tot=match=0
        for nt in notes:
            t0,t1=float(nt["start_time_sec"])+sh,float(nt["end_time_sec"])+sh
            if t1<0 or t0>dur: continue
            tot+=1
            a=int(max(0,np.floor(t0*sr/A.HOP_LENGTH))); b=int(min(len(voiced),np.ceil(t1*sr/A.HOP_LENGTH)))
            if b>a and voiced[a:b].mean()>=0.5: sounded+=1
            mg=(t1-t0)*0.1; k=(vt>=t0+mg)&(vt<=t1-mg)
            if k.sum()>=5 and abs(1200*np.log2(np.median(vf[k])/float(nt["pitches"][0])))<=50: match+=1
        return sounded/max(1,tot), match/max(1,tot), tot
    grid=np.arange(-5,5.001,0.05)
    rows=[(float(d),)+stats(gs+d) for d in grid]
    bm=max(rows,key=lambda r:r[2]); bs=max(rows,key=lambda r:r[1])
    print(f"\n=== {lab}  (妥当と見ている位置 Δ={KNOWN[lab]:+.2f})")
    print(f"  音程の一致が最大: Δ={bm[0]:+.2f}  一致{bm[2]:.0%}  そこで「鳴っている」割合 {bm[1]:.0%}")
    print(f"  「鳴っている」割合が最大: Δ={bs[0]:+.2f} ({bs[1]:.0%})  そこでの音程の一致 {bs[2]:.0%}")
    print("   Δ      鳴っている  音程の一致   (妥当と見ている位置に★)")
    for d in (-3.1,-2.3,-0.5,-0.35,-0.2,0.0,0.5,1.05,1.3,2.0):
        r=[x for x in rows if abs(x[0]-d)<0.026]
        if r:
            r=r[0]; star=" ★" if abs(d-KNOWN[lab])<0.06 else ""
            print(f"  {r[0]:+5.2f}     {r[1]:5.0%}      {r[2]:5.0%}{star}")
