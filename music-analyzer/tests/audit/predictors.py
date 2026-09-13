"""3本で「どの指標が実際の最良Δを当てるか」を並べる。固定窓の一致は床0.01で測る。"""
import pathlib, sys, warnings
warnings.filterwarnings("ignore")
import numpy as np, librosa
HERE = pathlib.Path("tests/audit").resolve(); sys.path.insert(0, str(HERE))
from _cache import local_case, load_audio
import offline_analyzer as OA
A = OA.A
ACTUAL = {"実演奏A": +1.30, "糸": -0.50, "実演奏B": -2.50}
rows=[]
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
    m=(~np.isnan(yin))&(rms>0.01); vt,vf=t[m],yin[m]; dur=len(y)/sr
    def match(sh):
        c=0
        for nt in notes:
            t0,t1=float(nt["start_time_sec"])+sh,float(nt["end_time_sec"])+sh
            if t1<0 or t0>dur: continue
            mg=(t1-t0)*0.1; k=(vt>=t0+mg)&(vt<=t1-mg)
            if k.sum()>=5 and abs(1200*np.log2(np.median(vf[k])/float(nt["pitches"][0])))<=50: c+=1
        return c
    grid=np.arange(-5,5.001,0.05)
    cnt=np.array([match(gs+d) for d in grid]); allbest=float(grid[int(np.argmax(cnt))])
    d=np.array([r["start_diff_sec"] for r in res["results"] if r.get("start_diff_sec") is not None])
    g2=np.arange(-4,4.001,0.01)
    desk=float(g2[int(np.argmax([np.sum(np.abs(d-x)<=tol) for x in g2]))]) if len(d) else float("nan")
    prof=pathlib.Path(f"tests/audit/profile_{cid}.json")
    import json
    reg=[r["best"] for r in json.loads(prof.read_text(encoding="utf-8"))["rows"] if r["matches"]>=12]
    regmid=(max(reg)+min(reg))/2
    rows.append((lab, ACTUAL[lab], desk, regmid, allbest, tol))
print("  録音      実際の最良   机上の計算      区間の中央      全音の固定窓    許容")
for lab,act,desk,regmid,allb,tol in rows:
    print(f"  {lab:<8} {act:+6.2f}   {desk:+6.2f}({abs(desk-act):4.2f})  {regmid:+6.2f}({abs(regmid-act):4.2f})"
          f"  {allb:+6.2f}({abs(allb-act):4.2f})  ±{tol:.2f}")
print("\n  括弧内は実際の最良とのずれ(秒)。許容より小さければ使える予測。")
