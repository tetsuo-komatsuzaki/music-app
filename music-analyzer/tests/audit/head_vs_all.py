"""head_vs_all.py — 先頭15音で数えた一致と、録音内の全音で数えた一致を並べる。

位置合わせの基準 (find_start_position は先頭15音だけを見る) が、
曲全体と食い違うかどうかを見る。解析器は変更しない。
"""
import pathlib, sys, warnings
warnings.filterwarnings("ignore")
import numpy as np, librosa
HERE = pathlib.Path("tests/audit").resolve()
sys.path.insert(0, str(HERE))
from _cache import local_case, load_audio
import offline_analyzer as OA
A = OA.A
CASES = HERE.parent / "cases"

def run(cid, label):
    case = local_case(CASES / cid)
    y, sr = load_audio(str(case / "recording.wav"))
    res = OA.analyze_case(case); S = res["summary"]
    gs, beat = float(S["global_shift"]), float(S["beat_sec"])
    an, bpm, info = OA.notes_from_case(case)
    fmin_n, fmax_n = A.INSTRUMENT_PITCH_RANGE.get(info.get("instrument","unknown"), A.DEFAULT_PITCH_RANGE)
    notes = [n for n in an if n.get("type")=="note" and n.get("pitches")]
    yin = np.array(librosa.yin(y, fmin=librosa.note_to_hz(fmin_n), fmax=librosa.note_to_hz(fmax_n),
                               sr=sr, frame_length=A.FRAME_LENGTH, hop_length=A.HOP_LENGTH))
    t_all = np.array(librosa.frames_to_time(np.arange(len(yin)), sr=sr, hop_length=A.HOP_LENGTH))
    rms = np.array(librosa.feature.rms(y=y, frame_length=A.FRAME_LENGTH, hop_length=A.HOP_LENGTH)[0])
    vm = (~np.isnan(yin)) & (rms > 0.01)
    vt, vf = t_all[vm], yin[vm]
    dur = len(y)/sr
    def m(pool, sh):
        c=0
        for nt in pool:
            t0,t1 = float(nt["start_time_sec"])+sh, float(nt["end_time_sec"])+sh
            if t1<0 or t0>dur: continue
            mg=(t1-t0)*0.1
            k=(vt>=t0+mg)&(vt<=t1-mg)
            if k.sum()>=5 and abs(1200*np.log2(np.median(vf[k])/float(nt["pitches"][0])))<=50: c+=1
        return c
    head = notes[:15]
    inrec = [n for n in notes if float(n["start_time_sec"])+gs <= dur]
    print(f"\n===== {label}  1拍={beat:.2f}s  許容=±{A.get_timing_tolerance(bpm):.2f}s  録音{dur:.0f}s  録音内{len(inrec)}/{len(notes)}音")
    print("  ずらし量   先頭15音の一致   録音内の全音の一致")
    for d in np.arange(-0.6, 2.41, 0.15):
        h = m(head, gs+d); a = m(inrec, gs+d)
        mark = " ←現行" if abs(d)<1e-9 else ""
        print(f"   {d:+5.2f}s      {h:>2}/15  {'#'*h:<15}  {a:>3}/{len(inrec)} ({a/len(inrec)*100:4.1f}%) {'#'*int(a/len(inrec)*25)}{mark}")
    # 音1つあたりの長さ
    lens = np.array([float(n["end_time_sec"])-float(n["start_time_sec"]) for n in head])
    print(f"  先頭15音の長さ: 中央値 {np.median(lens):.2f}s  最短 {lens.min():.2f}s  最長 {lens.max():.2f}s"
          f"  / 15音で楽譜 {float(head[-1]['end_time_sec'])-float(head[0]['start_time_sec']):.1f} 秒ぶん")

for cid,lab in [("cmplsqe3i000004i61gisxyp5","実演奏A"),("cmnl2fcv800000ojywq952uxk","糸"),("cmofva0fb0005zsjy86sy0n9c","実演奏B")]:
    run(cid, lab)
