# -*- coding: utf-8 -*-
"""
generate_subtask_catalog.py — 小課題カタログの生成器（工程C-1・2026-07-10）

§26-4 の粒度定義から決定的に展開して単一ソースを生成する:
  - music-analyzer/lib/subtask_catalog.json  (正本・Python が読む)
  - app/_libs/subtaskCatalog.generated.ts    (TS ミラー・手書き禁止)

内訳 (§26-4 確定 → 2026-09-04 Tetsuo 判断で 217→187 に縮小):
  音程の木 55 = D.ポジション移動25 + E.重音12 + F.技術タグ13 + G.音程移動(粗)5
  リズムの木 69 = b.音価4 + c.リズムパターン4 + f.入り6 + h.技術13 + j.音程移動5 + k.重音12 + l.ポジション移動25
  音色の木 63 = a.技術13 + f.音程移動5 + h.音価4 + j.リズムパターン4 + k.重音12 + l.ポジション移動25
  計 187。v1発火 = 音程+リズム = 124 (音色は右手検出未実装のため v1_active=false)

2026-09-04 に削除した課題 (Tetsuo):
  - 音程移動の順次 (同じ弦/となりの弦 × 上下 × 少し動く) と 弦を1本とばす移動 (上下 × 順次/跳躍)
  - 音価の 全音符/2分音符/4分音符
  理由: 「少し上へ動く」のような箱は抽象的で練習の指示にならない。何の音から何の音への
  移動でミスしたかは noteStats.transitions に音名ペアで残っており、毎日の基礎練②④は
  そこから直接おすすめを作っている (dailyLessons.getWeakTransitions)。箱を経由する必要が無い。

再生成: venv\\Scripts\\python.exe scripts\\generate_subtask_catalog.py
"""
from __future__ import annotations

import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ANALYZER = os.path.dirname(HERE)
APP_LIBS = os.path.join(ANALYZER, "..", "app", "_libs")

# ─── 部品定義 ───

POSITIONS = [("1", "第1"), ("2", "第2"), ("3", "第3"), ("4", "第4"), ("5plus", "第5以上")]

DOUBLE_KINDS = [
    ("third", "3度"), ("fourth", "4度"), ("fifth", "5度"),
    ("sixth", "6度"), ("octave", "オクターブ"), ("other", "その他"),
]
DOUBLE_CONT = [("single", "単発"), ("cont", "連続")]

TECHNIQUES = [
    ("slur", "スラー"), ("portato", "ポルタート"), ("staccato", "スタッカート"),
    ("bow_staccato", "ボウ・スタッカート"), ("spiccato", "スピッカート"),
    ("ricochet", "リコシェ"), ("pizzicato", "ピチカート"), ("tremolo", "トレモロ"),
    ("vibrato", "ビブラート"), ("trill", "トリル"), ("mordent", "モルデント"),
    ("glissando", "グリッサンド"), ("harmonic", "ナチュラル・ハーモニクス"),
]

INTERVAL_CROSS = [("same", "同一弦"), ("adj", "隣接移弦"), ("skip", "弦飛ばし")]
INTERVAL_DIR = [("up", "上行"), ("down", "下行")]
INTERVAL_DIST = [("step", "順次"), ("leap", "跳躍")]
# 2026-09-04 削除: 順次(step)は全弦遷移で、弦とばし(skip)は全距離で課題にしない。
# 残るのは 同じ弦/となりの弦 × 上下 × 跳躍 の4つ + 同じ高さで移弦 の1つ = 5。
_INTERVAL_DROP = lambda c_id, s_id: s_id == "step" or c_id == "skip"
# 2026-09-04 削除: 全/2分/4分音符は課題にしない (教材タグも無く、箱として抽象的)
_VALUE_DROP = frozenset({"whole", "half", "quarter"})

# 学びポイントのラベルを平易な文章にする (2026-08-01 Tetsuo)。
# 「同一弦・下行・跳躍」等の専門語の並びは伝わらないので、どんな動きのミスかを説明する。
_ICROSS_TXT = {"same": "同じ弦で", "adj": "となりの弦に移って", "skip": "弦を1本とばして"}
_IMOVE_TXT = {
    ("up", "step"): "少し上の音へ動く",
    ("down", "step"): "少し下の音へ動く",
    ("up", "leap"): "高い音へ大きく跳ぶ",
    ("down", "leap"): "低い音へ大きく跳ぶ",
}
# 入り(休符後の入り)も同様に平易化
_REST_TXT = {"short": "短い休みのあと", "mid": "中くらいの休みのあと", "long": "長い休みのあと"}
_BEAT_TXT = {"onbeat": "拍の頭から入る", "offbeat": "拍の裏から入る"}

VALUES = [
    ("whole", "全音符"), ("half", "2分音符"), ("quarter", "4分音符"),
    ("eighth", "8分音符"), ("16th", "16分音符"), ("32nd_plus", "32分音符以上"),
    ("dotted", "付点音符"),
]
TUPLETS = [("3", "三連符"), ("5", "五連符"), ("6", "六連符"), ("7plus", "七連符以上")]
ENTRY_REST = [("short", "短い休符後"), ("mid", "中休符後"), ("long", "長い休符後")]
ENTRY_BEAT = [("onbeat", "拍表"), ("offbeat", "拍裏")]


# ─── C-5 (2026-07-11 Tetsuo確定): 診断可否と教材クエリの正本化 ───
# diagnosable=False: 「変化なし箱」= 弱点の名前にならないタグ。カウント/累積は
#   継続するが診断top-2の選出からは除外し、教材選びの前提条件(文脈)として使う。
#   対象 = ポジション移動 X→X(同一ポジ内) と 同一弦×順次。
# material_query: 小課題→教材の検索条件(優先順リスト)。TSの推薦エンジンが解釈。
#   {"type":"feature","category":c,"name":n} FeatureTag一致
#   {"type":"technique","name":n}            TechniqueTag一致
#   {"type":"category","category":c}         PracticeCategory一致
#   {"type":"basic"}                          基礎フォールバック(同調同starの音階)

_FEAT = lambda c, n: {"type": "feature", "category": c, "name": n}
_TECHQ = lambda n: {"type": "technique", "name": n}
_CAT = lambda c: {"type": "category", "category": c}
_BASIC = {"type": "basic"}

_VALUE_FEATURE = {"eighth": "8分音符", "16th": "16分音符", "32nd_plus": "32分音符"}
_DOUBLE_FEATURE = {"third": "3度", "fourth": "4度", "fifth": "5度",
                   "sixth": "6度", "octave": "オクターブ", "other": "その他"}


# ポジション移動の教材条件。
# 2026-09-04: 一度 ポジションの FeatureTag に置き換えたが撤回した。
# position_shift は PracticeCategory に実在するカテゴリ (2026-05-31 追加) で、
# 条件は最初から正しい。教材が1件も無いだけ。条件の誤りではなく在庫の穴。
# ポジション移動に効く教材のカテゴリは position_shift と fingering
# (2026-09-04 Tetsuo確定)。position_shift の教材が入るまでこの20課題は0件のまま。
def _pos_shift(prefix: str):
    out = []
    for f_id, f_name in POSITIONS:
        for t_id, t_name in POSITIONS:
            same = f_id == t_id
            # ラベルを平易な文章に (2026-08-01 Tetsuo)
            name = (f"{f_name}ポジションの中だけで弾く" if same
                    else f"左手を{f_name}から{t_name}ポジションへ移す")
            out.append((f"{prefix}_posshift_{f_id}_{t_id}", "position_shift",
                        name, not same,
                        [] if same else [_CAT("position_shift"), _CAT("fingering")]))
    return out


def _double(prefix: str):
    out = []
    for k_id, k_name in DOUBLE_KINDS:
        for c_id, c_name in DOUBLE_CONT:
            q = []
            if c_id == "cont":
                q.append(_FEAT("double_stop", "連続重音"))
            q.append(_FEAT("double_stop", _DOUBLE_FEATURE[k_id]))
            q.append(_CAT("double_stop"))
            name = (f"{k_name}の重音を続けて弾く" if c_id == "cont"
                    else f"{k_name}の重音を弾く")
            out.append((f"{prefix}_double_{k_id}_{c_id}", "double_stop",
                        name, True, q))
    return out


def _tech(prefix: str):
    # 表示名は「〜のところ」と平易化。教材検索は元の奏法名(t_name)のまま。
    return [(f"{prefix}_tech_{t_id}", "technique", f"{t_name}のところ", True, [_TECHQ(t_name)])
            for t_id, t_name in TECHNIQUES]


def _interval(prefix: str):
    out = []
    for c_id, c_name in INTERVAL_CROSS:
        for d_id, d_name in INTERVAL_DIR:
            for s_id, s_name in INTERVAL_DIST:
                if _INTERVAL_DROP(c_id, s_id):
                    continue
                # 跳躍→アルペジオ。無ければエチュードへ落とす。
                q = [_CAT("arpeggio"), _CAT("etude")]
                name = f"{_ICROSS_TXT[c_id]}{_IMOVE_TXT[(d_id, s_id)]}"
                out.append((f"{prefix}_interval_{c_id}_{d_id}_{s_id}", "interval_move",
                            name, True, q))
    out.append((f"{prefix}_interval_unison_crossing", "interval_move",
                "弦を移っても同じ高さの音を弾く", True, [_CAT("bowing"), _CAT("etude")]))
    return out


def _values(prefix: str):
    out = []
    for v_id, v_name in VALUES:
        if v_id in _VALUE_DROP:
            continue
        if v_id in _VALUE_FEATURE:
            q = [_FEAT("rhythm", _VALUE_FEATURE[v_id])]
        else:
            q = [_FEAT("rhythm", "付点")]
        out.append((f"{prefix}_value_{v_id}", "note_value", f"{v_name}のリズム", True, q))
    return out



def _tuplets(prefix: str):
    return [(f"{prefix}_tuplet_{t_id}", "tuplet", f"{t_name}のリズム", True, [_FEAT("rhythm", "連符")])
            for t_id, t_name in TUPLETS]


def _entry(prefix: str):
    out = []
    for r_id, r_name in ENTRY_REST:
        for b_id, b_name in ENTRY_BEAT:
            q = [_FEAT("rhythm", "拍頭休符" if b_id == "onbeat" else "裏拍開始")]
            name = f"{_REST_TXT[r_id]}、{_BEAT_TXT[b_id]}"
            out.append((f"{prefix}_entry_{r_id}_{b_id}", "entry_after_rest",
                        name, True, q))
    return out


def build_catalog():
    entries = []

    def add(tree: str, active: bool, rows):
        for sid, problem, name, diagnosable, material_query in rows:
            entries.append({
                "id": sid, "tree": tree, "problem": problem,
                "name": name, "v1_active": active,
                "diagnosable": diagnosable,
                "material_query": material_query,
            })

    # 音程の木 (55)
    add("pitch", True, _pos_shift("pitch"))    # D 25
    add("pitch", True, _double("pitch"))       # E 12
    add("pitch", True, _tech("pitch"))         # F 13
    add("pitch", True, _interval("pitch"))     # G 5
    # リズムの木 (69)
    add("rhythm", True, _values("rhythm"))     # b 4
    add("rhythm", True, _tuplets("rhythm"))    # c 4
    add("rhythm", True, _entry("rhythm"))      # f 6
    add("rhythm", True, _tech("rhythm"))       # h 13
    add("rhythm", True, _interval("rhythm"))   # j 5
    add("rhythm", True, _double("rhythm"))     # k 12
    add("rhythm", True, _pos_shift("rhythm"))  # l 25
    # 音色の木 (63) — v1 発火不能 (右手検出未実装)
    add("timbre", False, _tech("timbre"))       # a 13
    add("timbre", False, _interval("timbre"))   # f 5
    add("timbre", False, _values("timbre"))     # h 4
    add("timbre", False, _tuplets("timbre"))    # j 4
    add("timbre", False, _double("timbre"))     # k 12
    add("timbre", False, _pos_shift("timbre"))  # l 25

    return entries


def main():
    entries = build_catalog()
    by_tree = {}
    for e in entries:
        by_tree[e["tree"]] = by_tree.get(e["tree"], 0) + 1
    active = sum(1 for e in entries if e["v1_active"])
    TOTAL, ACTIVE = 187, 124
    assert by_tree == {"pitch": 55, "rhythm": 69, "timbre": 63}, by_tree
    assert len(entries) == TOTAL and active == ACTIVE, (len(entries), active)
    ids = [e["id"] for e in entries]
    assert len(set(ids)) == TOTAL, "ID重複あり"
    # C-5: 除外は「同一ポジ内5×木」= 木ごと5 (同一弦×順次は 2026-09-04 に課題ごと削除)
    non_diag = [e["id"] for e in entries if not e["diagnosable"]]
    assert len(non_diag) == 5 * 3, non_diag
    # 診断に出るものは必ず教材クエリを持つ
    assert all(e["material_query"] for e in entries if e["diagnosable"])

    # 正本 JSON
    json_path = os.path.join(ANALYZER, "lib", "subtask_catalog.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({"version": 2, "total": TOTAL, "v1_active": ACTIVE, "entries": entries},
                  f, ensure_ascii=False, indent=1)

    # TS ミラー (自動生成・手書き禁止)
    ts_path = os.path.join(APP_LIBS, "subtaskCatalog.generated.ts")
    lines = [
        "// 自動生成ファイル — 手書き禁止。正本: music-analyzer/lib/subtask_catalog.json",
        "// 再生成: music-analyzer/scripts/generate_subtask_catalog.py (工程C-1/C-5)",
        "export type SubtaskTree = \"pitch\" | \"rhythm\" | \"timbre\"",
        "export type MaterialQuery =",
        "  | { type: \"feature\"; category: string; name: string }",
        "  | { type: \"technique\"; name: string }",
        "  | { type: \"category\"; category: string }",
        "  | { type: \"basic\" }",
        "export interface SubtaskDef {",
        "  id: string; tree: SubtaskTree; problem: string; name: string; v1Active: boolean",
        "  // C-5: diagnosable=false は「変化なし箱」(診断top選出から除外・文脈扱い)",
        "  diagnosable: boolean",
        "  // C-5: 教材検索条件 (優先順。先頭から試して在庫があるものを採用)",
        "  materialQuery: MaterialQuery[]",
        "}",
        "export const SUBTASK_CATALOG: SubtaskDef[] = [",
    ]
    for e in entries:
        mq = json.dumps(e["material_query"], ensure_ascii=False)
        lines.append(
            f'  {{ id: "{e["id"]}", tree: "{e["tree"]}", problem: "{e["problem"]}", '
            f'name: "{e["name"]}", v1Active: {"true" if e["v1_active"] else "false"}, '
            f'diagnosable: {"true" if e["diagnosable"] else "false"}, '
            f'materialQuery: {mq} }},'
        )
    lines += [
        "]",
        "export const SUBTASK_BY_ID: Record<string, SubtaskDef> = Object.fromEntries(",
        "  SUBTASK_CATALOG.map((s) => [s.id, s])",
        ")",
        "",
    ]
    with open(ts_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"OK: {json_path} ({TOTAL}件・v1_active {ACTIVE})")
    print(f"OK: {ts_path}")


if __name__ == "__main__":
    main()
