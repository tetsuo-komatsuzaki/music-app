"""
shift_profile.py — 曲を通して「その区間だけで見た最良の位置」を並べる

位置合わせの問題が
  (1) 演奏全体が一定量ずれている (= 起点の取り方が悪い)
  (2) ずれが曲の途中で育つ      (= 位置が録音に 1 つしかないのが悪い)
のどちらかを見分ける。15 音ずつの窓を 5 音きざみで滑らせ、各窓で最良の位置を求める。

Usage: python tests/audit/shift_profile.py <case_id>[,...]
"""
import pathlib
import sys
import warnings
warnings.filterwarnings("ignore")

import numpy as np
import librosa

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from _cache import local_case, load_audio  # noqa: E402
import offline_analyzer as OA  # noqa: E402

A = OA.A
CASES_DIR = HERE.parent / "cases"
HOP, FRAME, MIN_FRAMES = A.HOP_LENGTH, A.FRAME_LENGTH, 5
WIN, STEP, SCAN, SCAN_STEP = 15, 5, 6.0, 0.05
FIXED_THRESHOLD = 0.01   # ゲートの床は固定にして、床の問題と切り離す


def run(case_id):
    case = local_case(CASES_DIR / case_id)
    y, sr = load_audio(str(case / "recording.wav"))
    res = OA.analyze_case(case)
    S = res["summary"]
    gs, beat = float(S["global_shift"]), float(S["beat_sec"])
    an, bpm, info = OA.notes_from_case(case)
    fmin_n, fmax_n = A.INSTRUMENT_PITCH_RANGE.get(info.get("instrument", "unknown"), A.DEFAULT_PITCH_RANGE)
    notes = [n for n in an if n.get("type") == "note" and n.get("pitches")]
    yin = np.array(librosa.yin(y, fmin=librosa.note_to_hz(fmin_n), fmax=librosa.note_to_hz(fmax_n),
                               sr=sr, frame_length=FRAME, hop_length=HOP))
    t_all = np.array(librosa.frames_to_time(np.arange(len(yin)), sr=sr, hop_length=HOP))
    rms = np.array(librosa.feature.rms(y=y, frame_length=FRAME, hop_length=HOP)[0])
    vm = (~np.isnan(yin)) & (rms > FIXED_THRESHOLD)
    vt, vf = t_all[vm], yin[vm]
    dur_rec = len(y) / sr

    def matches(pool, shift):
        m = 0
        for nt in pool:
            t0, t1 = float(nt["start_time_sec"]) + shift, float(nt["end_time_sec"]) + shift
            if t1 < 0 or t0 > dur_rec:
                continue
            mg = (t1 - t0) * 0.1
            k = (vt >= t0 + mg) & (vt <= t1 - mg)
            if k.sum() >= MIN_FRAMES and abs(1200 * np.log2(np.median(vf[k]) / float(nt["pitches"][0]))) <= 50:
                m += 1
        return m

    def best_shift(pool):
        best, bs = -1, 0.0
        for d in np.arange(-SCAN, SCAN + 1e-9, SCAN_STEP):
            c = matches(pool, gs + d)
            if c > best:
                best, bs = c, d
        return bs, best

    print(f"\n===== {case_id}  (現行 shift={gs:.3f}s, 1拍={beat:.2f}s, 録音{dur_rec:.0f}s, {len(notes)}音) =====", flush=True)
    rows = []
    for s in range(0, max(1, len(notes) - WIN + 1), STEP):
        pool = notes[s:s + WIN]
        t_mid = (float(pool[0]["start_time_sec"]) + float(pool[-1]["end_time_sec"])) / 2 + gs
        if t_mid > dur_rec + 2:
            break
        bs, cnt = best_shift(pool)
        if cnt >= 3:                      # 3 音未満しか合わない区間は位置を決められない
            rows.append((s, t_mid, bs, cnt))
    if not rows:
        print("  位置を決められる区間がない"); return
    print("  音番号  録音上のおよその時刻   その区間だけで見た最良の位置   一致")
    for s, tm, bs, cnt in rows:
        bar = "|" + ("+" if bs >= 0 else "-") * min(20, int(abs(bs) / 0.1))
        print(f"   {s:>4}     {tm:7.1f}s            {bs:+6.2f}s  {bar:<22} {cnt}/{WIN}")
    import json as _json
    (HERE / f"profile_{case_id}.json").write_text(_json.dumps(
        {"case": case_id, "global_shift": gs, "beat_sec": beat, "tolerance": A.get_timing_tolerance(bpm),
         "search_range": max(beat * A.SEARCH_RANGE_BEATS, A.SEARCH_RANGE_MIN_SEC),
         "rows": [{"note": r[0], "t": r[1], "best": r[2], "matches": r[3]} for r in rows]}, indent=1), encoding="utf-8")
    bss = np.array([r[2] for r in rows])
    first = bss[0]; last = bss[-1]
    print(f"  最良の位置: 最初の区間 {first:+.2f}s → 最後の区間 {last:+.2f}s   "
          f"範囲 {bss.min():+.2f}〜{bss.max():+.2f}s   中央 {np.median(bss):+.2f}s   標準偏差 {bss.std():.2f}s")
    tol = A.get_timing_tolerance(bpm)
    rng = max(beat * A.SEARCH_RANGE_BEATS, A.SEARCH_RANGE_MIN_SEC)
    solid = np.array([r[2] for r in rows if r[3] >= 12])
    print(f"  判定の許容は ±{tol:.2f}s / 探せる幅は ±{rng:.2f}s")
    if len(solid) >= 3:
        span, mid = float(solid.max() - solid.min()), float((solid.max() + solid.min()) / 2)
        print(f"  12/15 以上そろった区間だけで見ると: 最良の位置は {solid.min():+.2f}〜{solid.max():+.2f}s "
              f"に散らばる（幅 {span:.2f}s）。中央は {mid:+.2f}s")
        print(f"  1つの位置でまかなえる幅は 2×許容 = {2*tol:.2f}s → "
              + ("まかなえる。" if span <= 2 * tol else "まかなえない。位置が1つでは足りない。"))
        print(f"  その中央 {mid:+.2f}s は探せる幅 ±{rng:.2f}s の "
              + ("内側。探索は届く。" if abs(mid) <= rng else "外側。探索が届かない。"))
    if abs(np.median(bss)) > 0.2 and bss.std() < 0.3:
        print("  → ほぼ一定量ずれている。起点の取り方の問題。")
    elif bss.std() >= 0.3:
        print("  → 区間によって最良の位置が動く。位置が 1 つしか持てないことの問題。")
    else:
        print("  → 現行の位置でほぼ合っている。")


if __name__ == "__main__":
    for cid in sys.argv[1].split(","):
        try:
            run(cid)
        except Exception as e:
            import traceback; traceback.print_exc()
            print(f"{cid}: 失敗 {type(e).__name__}: {e}")
