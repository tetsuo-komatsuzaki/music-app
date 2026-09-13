"""anchor(最初の音)と現行 global_shift の差を3本で測り、判定の基準の候補を比べる。"""
import pathlib, sys, warnings
warnings.filterwarnings("ignore")
import numpy as np, librosa
HERE = pathlib.Path("tests/audit").resolve(); sys.path.insert(0, str(HERE))
from _cache import local_case, load_audio
import offline_analyzer as OA
A = OA.A
print("=== anchor(最初に音が出た時刻 − 楽譜の1音目の時刻) と 現行 global_shift の差\n")
for cid, lab in [("cmplsqe3i000004i61gisxyp5","実演奏A"),("cmnl2fcv800000ojywq952uxk","糸"),
                 ("cmofva0fb0005zsjy86sy0n9c","実演奏B")]:
    case = local_case(HERE.parent/"cases"/cid)
    y, sr = load_audio(str(case/"recording.wav"))
    res = OA.analyze_case(case); gs = float(res["summary"]["global_shift"])
    an, bpm, info = OA.notes_from_case(case)
    notes=[n for n in an if n.get("type")=="note" and n.get("pitches")]
    fst = res["summary"].get("first_sound_time")
    if fst is None:
        rms=np.array(librosa.feature.rms(y=y,frame_length=A.FRAME_LENGTH,hop_length=A.HOP_LENGTH)[0])
        t=np.array(librosa.frames_to_time(np.arange(len(rms)),sr=sr,hop_length=A.HOP_LENGTH))
        fst=float(t[np.argmax(rms>A.RMS_THRESHOLD)])
    n0 = float(notes[0]["start_time_sec"])
    anchor = fst - n0
    print(f"  {lab:<7} 最初の音 {fst:7.3f}s  楽譜1音目 {n0:6.3f}s  anchor {anchor:+7.3f}s"
          f"  現行 global_shift {gs:+7.3f}s  差 {gs-anchor:+7.3f}s")
    print(f"          録音 {len(y)/sr:.1f}s / 楽譜 {float(notes[-1]['end_time_sec']):.1f}s")
