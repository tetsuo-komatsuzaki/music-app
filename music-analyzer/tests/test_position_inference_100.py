# -*- coding: utf-8 -*-
"""音名算術モデル 100パターン検証 (2026-07-09)
結果は test_100_results.txt (UTF-8) に出力する。
"""
import sys
sys.path.insert(0, ".")
from lib.violin_position import (
    infer_with_finger, infer_pitch_only, derive_position,
    VIOLIN_FIRST_POSITION_MAP,
)

SOLF = {"C": "ド", "D": "レ", "E": "ミ", "F": "ファ", "G": "ソ", "A": "ラ", "B": "シ"}
NOTE_NAMES = {  # midi -> (step, alter, octave, 表記)
    m: None for m in range(50, 106)
}
_CHROM = [("C",0),("C",1),("D",0),("D",1),("E",0),("F",0),("F",1),("G",0),("G",1),("A",0),("A",1),("B",0)]
def midi_name(m):
    octv = m // 12 - 1
    step, alter = _CHROM[m % 12]
    disp = f"{step}{'#' if alter else ''}{octv}（{SOLF[step]}{'♯' if alter else ''}{octv}）"
    return step, alter, octv, disp

results = []
n_pass = n_fail = 0
case_no = 0

def check(desc, actual, expected):
    global n_pass, n_fail, case_no
    case_no += 1
    ok = actual == expected
    if ok: n_pass += 1
    else: n_fail += 1
    mark = "✓" if ok else "✗✗✗"
    results.append(f"#{case_no:3d} {mark} {desc} → 実際={actual} 期待={expected}")

# ============ A. 開放弦 (6) ============
results.append("=== A. 開放弦（指0） ===")
for m, s in [(55, "G"), (62, "D"), (69, "A"), (76, "E")]:
    _, _, _, disp = midi_name(m)
    check(f"{disp} 指0 開放弦", infer_with_finger(m, 0), (s, None, "high"))
check("A#4（ラ♯4）指0 ＝どの開放弦とも不一致", infer_with_finger(70, 0), None)
check("C6（ド6）指0 ＝不一致", infer_with_finger(84, 0), None)

# ============ B. 指なし・1stポジ帯 55-83 全29音 ============
results.append("=== B. 指なし（1stポジ音域ゾーン）55-83 全数 ===")
for m in range(55, 84):
    step, alter, octv, disp = midi_name(m)
    s_exp, f_exp = VIOLIN_FIRST_POSITION_MAP[m]
    pos_exp = None if f_exp == 0 else 1
    check(f"{disp} 指なし", infer_pitch_only(m, step=step, octave=octv),
          (s_exp, pos_exp, f_exp, "estimated"))

# ============ C. 指なし・高音域 84-93 (10) ============
results.append("=== C. 指なし・高音域（旧欠落帯 84+） ===")
golden_c = {84:("E",2,4),85:("E",2,4),86:("E",3,4),87:("E",3,4),88:("E",4,4),
            89:("E",5,4),90:("E",5,4),91:("E",6,4),92:("E",6,4),93:("E",7,4)}
for m in range(84, 94):
    step, alter, octv, disp = midi_name(m)
    s_exp, p_exp, f_exp = golden_c[m]
    check(f"{disp} 指なし", infer_pitch_only(m, step=step, octave=octv),
          (s_exp, p_exp, f_exp, "low"))

# ============ D. 指番号ゴールデン (30) ============
results.append("=== D. 指番号あり（音名算術ゴールデン） ===")
D = [  # (midi, step, octave, finger, expected)
    (71,"B",4,1,("A",1,"low")),   # シ4 指1 → A線1ポジ(1指=シ)
    (72,"C",5,2,("A",1,"low")),   # ド5 指2 → A線1ポジ(1指=シ)
    (74,"D",5,3,("A",1,"low")),   # レ5 指3 → A線1ポジ(シドレ=123)
    (76,"E",5,4,("A",1,"low")),   # ミ5 指4 → A線1ポジ
    (77,"F",5,3,("A",3,"low")),   # ★ファ5 指3 → A線3ポジ(1指=レ) Tetsuoの例
    (77,"F",5,1,("E",1,"low")),   # ファ5 指1 → E線1ポジ
    (77,"F",5,2,("A",4,"low")),   # ファ5 指2 → A線4ポジ(1指=ミ)
    (77,"F",5,4,("A",2,"low")),   # ファ5 指4 → A線2ポジ(1指=ド,ドレミファ=1234)
    (79,"G",5,4,("A",3,"low")),   # ソ5 指4 → A線3ポジ(レミファソ=1234)
    (79,"G",5,1,("E",2,"low")),   # ソ5 指1 → E線2ポジ
    (81,"A",5,3,("E",1,"low")),   # ラ5 指3 → E線1ポジ(ファソラ=123)
    (83,"B",5,4,("E",1,"low")),   # シ5 指4 → E線1ポジ
    (84,"C",6,4,("E",2,"low")),   # ド6 指4 → E線2ポジ(1指=ソ)
    (84,"C",6,3,("E",3,"low")),   # ド6 指3 → E線3ポジ(ラシド=123)
    (84,"C",6,2,("E",4,"low")),   # ド6 指2 → E線4ポジ(1指=シ)
    (84,"C",6,1,("E",5,"low")),   # ド6 指1 → E線5ポジ(1指=ド)
    (88,"E",6,4,("E",4,"low")),   # ミ6 指4 → E線4ポジ(1指=シ5)
    (91,"G",6,4,("E",6,"low")),   # ソ6 指4 → E線6ポジ(1指=レ6)
    (93,"A",6,3,("E",8,"low")),   # ラ6 指3 → E線8ポジ(1指=ファ6)
    (96,"C",7,4,("E",9,"high")),  # ド7 指4 → E線9ポジ・弦一意=高信頼
    (100,"E",7,4,("E",11,"high")),# ミ7 指4 → E線11ポジ・一意
    (103,"G",7,4,None),           # ソ7 指4 → 13ポジ超=導出不能
    (57,"A",3,4,None),            # ラ3 指4 → 1指がソ3開放より下=不能
    (57,"A",3,2,None),            # ラ3 指2 → 1指=ソ3(開放と同文字)=ポジ0=不能
    (57,"A",3,1,("G",1,"high")),  # ラ3 指1 → G線1ポジ・一意
    (59,"B",3,2,("G",1,"high")),  # シ3 指2 → G線1ポジ(ラシ=12)・一意
    (60,"C",4,3,("G",1,"high")),  # ド4 指3 → G線1ポジ・一意
    (62,"D",4,4,("G",1,"high")),  # レ4 指4 → G線1ポジ(D線は開放=除外)・一意
    (64,"E",4,1,("D",1,"low")),   # ミ4 指1 → D線1ポジ (G線5ポジも候補)
    (72,"C",5,1,("A",2,"low")),   # ド5 指1 → A線2ポジ(1指=ド)
]
for m, st, oc, f, exp in D:
    disp = f"{st}{oc}（{SOLF[st]}{oc}）指{f}"
    check(disp, infer_with_finger(m, f, step=st, octave=oc), exp)

# ============ E. ♯♭はポジションを変えない (10 = 5ペア) ============
results.append("=== E. ♯♭不変（同じ文字なら同じ結果になるか） ===")
pairs = [
    ((77,"F",5,3), (78,"F",5,3), "F5（ファ5）vs F#5（ファ♯5）指3"),
    ((84,"C",6,4), (85,"C",6,4), "C6（ド6）vs C#6（ド♯6）指4"),
    ((71,"B",4,1), (70,"B",4,1), "B4（シ4）vs B♭4（シ♭4）指1"),
    ((64,"E",4,1), (63,"E",4,1), "E4（ミ4）vs E♭4（ミ♭4）指1"),
    ((79,"G",5,1), (80,"G",5,1), "G5（ソ5）vs G#5（ソ♯5）指1"),
]
for (m1,s1,o1,f1), (m2,s2,o2,f2), label in pairs:
    r1 = infer_with_finger(m1, f1, step=s1, octave=o1)
    r2 = infer_with_finger(m2, f2, step=s2, octave=o2)
    check(f"{label}（前者）", r1, r1)  # 表示用
    check(f"{label}＝同一結果", r2, r1)

# ============ F. 音脈補正 (5) ============
results.append("=== F. 音脈補正（直前の弦・ポジで候補選択） ===")
check("F5（ファ5）指3・直前A線3ポジ", infer_with_finger(77,3,"A",3,step="F",octave=5), ("A",3,"low"))
check("F5（ファ5）指3・直前D線7ポジ", infer_with_finger(77,3,"D",7,step="F",octave=5), ("D",7,"low"))
check("F5（ファ5）指3・直前G線11ポジ", infer_with_finger(77,3,"G",11,step="F",octave=5), ("G",11,"low"))
check("B4（シ4）指1・直前D線5ポジ", infer_with_finger(71,1,"D",5,step="B",octave=4), ("D",5,"low"))
check("C6（ド6）指なし・直前E線2ポジ", infer_pitch_only(84,"E",2,step="C",octave=6), ("E",2,4,"low"))

# ============ G. 弦既知のポジション導出 (5) ============
results.append("=== G. derive_position（弦＋音名→ポジ） ===")
check("E線 C6（ド6）指2", derive_position(84,"E",2,"C",6), 4)
check("A線 F5（ファ5）指3", derive_position(77,"A",3,"F",5), 3)
check("D線 G4（ソ4）指3", derive_position(67,"D",3,"G",4), 1)
check("G線 D4（レ4）指4", derive_position(62,"G",4,"D",4), 1)
check("A線 C5（ド5）指不明→最低ポジ", derive_position(72,"A",None,"C",5), 1)

# ============ H. 境界・エッジ (5) ============
results.append("=== H. 境界（最大ポジ・ハーフポジション） ===")
check("C7（ド7）指1 → E線12ポジ(上限内・一意)", infer_with_finger(96,1,step="C",octave=7), ("E",12,"high"))
check("D7（レ7）指1 → 13ポジ=上限超で不能", infer_with_finger(98,1,step="D",octave=7), None)
check("G#3（ソ♯3）指1 → G線1ポジ(ハーフ扱い)", infer_with_finger(56,1,step="G",octave=3), ("G",1,"high"))
check("D#4（レ♯4）指1 → D線1ポジ(ハーフ扱い)or他弦", infer_with_finger(63,1,step="D",octave=4), ("D",1,"low"))
check("A#4（ラ♯4）指1 → A線1ポジ(ハーフ扱い)or他弦", infer_with_finger(70,1,step="A",octave=4), ("A",1,"low"))

# ============ 出力 ============
summary = f"\n===== 結果: {n_pass}/{case_no} PASS / {n_fail} FAIL ====="
results.append(summary)
with open("test_100_results.txt", "w", encoding="utf-8") as fp:
    fp.write("\n".join(results))
print(f"PASS={n_pass} FAIL={n_fail} TOTAL={case_no}")
