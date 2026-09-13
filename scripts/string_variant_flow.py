"""弦ちがいの教材を作る流れを回す (2026-09-13 Tetsuo確定)。

指示書 docs/string-variant-prompt.md の §9 (人が回す検収と登録) を、コマンドにしたもの。
文章で分岐を積み上げる代わりに、ここで判断して次にやることだけを出す。

人がやるのは4つだけ:
  1. 元の版を選ぶ (どの弦から作るか)
  2. 生成AIに投げる (指示書 + 元の版 + 目標の弦)
  3. MuseScore で目視する (符尾・スラーの弧・アーティキュレーション)
  4. 高いポジションが弾けるかを判断する

使い方:
  # いまどうなっているか。次にやることを出す
  python scripts/string_variant_flow.py status

  # 作る前の下見。素材のどれが使えないかを出す
  python scripts/string_variant_flow.py preflight

  # 作ったものを検収する (合格なら素材へ移し、登録まで進めてよいと出す)
  python scripts/string_variant_flow.py check <出力のファイル> --base G

  # 検収を通ったものを登録する
  python scripts/string_variant_flow.py register <ファイル名>

  # 登録済みのものを差し替える (欠陥が見つかったとき)
  python scripts/string_variant_flow.py replace <ファイル名>

環境変数:
  SRC_DIR   素材フォルダ (既定は アルコ用教材/ポジション移動)
  WORK_DIR  作業用フォルダ (既定は SRC_DIR/_work)
"""
from __future__ import annotations

import argparse
import os
import re
import shutil
import subprocess
import sys
from collections import defaultdict

# Windows の既定のコードページでは日本語が化けるので、自分の出力を UTF-8 に固定する
for _st in (sys.stdout, sys.stderr):
    try:
        _st.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
SRC_DIR = os.environ.get(
    "SRC_DIR", r"C:\Users\tetsu\OneDrive\Desktop\アルコ用教材\ポジション移動")
WORK_DIR = os.environ.get("WORK_DIR", os.path.join(SRC_DIR, "_work"))
OLD_DIR = os.path.join(SRC_DIR, "古い")
CHECKER = os.path.join(HERE, "check_string_variants.py")
UPLOADER = os.path.join(HERE, "upload_position_shift.ts")
STRINGS = ["G線", "D線", "A線", "E線"]
STRING_TOKEN = re.compile(r"^([GDAE])線$")
CANNOT = os.path.join(SRC_DIR, "作れない弦.md")


def stems(folder, ext=".musicxml"):
    if not os.path.isdir(folder):
        return []
    return sorted(f[: -len(ext)] for f in os.listdir(folder) if f.endswith(ext))


def string_of(stem):
    hits = [m.group(1) for m in (STRING_TOKEN.match(t) for t in stem.split("_")) if m]
    return hits[0] if len(hits) == 1 else None


def set_key(stem):
    """組のキー。弦のトークンだけを伏せた残り。"""
    return "_".join("{弦}" if STRING_TOKEN.match(t) else t for t in stem.split("_"))


def cannot_make():
    """作れないと決めた弦。`作れない弦.md` の各行 `組 | 弦 | 理由`"""
    out = set()
    if os.path.exists(CANNOT):
        for line in open(CANNOT, encoding="utf-8"):
            parts = [x.strip() for x in line.split("|")]
            if len(parts) >= 2 and parts[1] in STRINGS:
                out.add((parts[0], parts[1][0]))
    return out


def run(cmd, cwd=REPO):
    """子プロセスも UTF-8 で出させる (既定のコードページだと日本語が壊れる)"""
    env = dict(os.environ, PYTHONIOENCODING="utf-8", PYTHONUTF8="1")
    return subprocess.run(cmd, cwd=cwd, shell=False, text=True, env=env,
                          capture_output=True, encoding="utf-8", errors="replace")


def cmd_status(args):
    """組ごとに、そろっているか・次に作るのはどれかを出す。"""
    sets = defaultdict(dict)
    for s in stems(SRC_DIR):
        letter = string_of(s)
        if letter:
            sets[set_key(s)][letter] = s
    skip = cannot_make()
    done, todo = [], []
    for key in sorted(sets):
        have = sets[key]
        missing = [x for x in "GDAE" if x not in have
                   and (key, x) not in skip]
        (todo if missing else done).append((key, have, missing))
    print(f"素材フォルダ: {SRC_DIR}")
    print(f"組: {len(sets)}  そろっている: {len(done)}  足りない: {len(todo)}\n")
    if todo:
        print("=== 次に作るもの ===")
        for key, have, missing in todo:
            base = next((have[x] for x in "GDAE" if x in have), None)
            print(f"  {key}")
            print(f"     足りない弦: {'・'.join(x + '線' for x in missing)}")
            print(f"     元の版に使えるもの: {base}")
    else:
        print("すべての組がそろっている。")
    if skip:
        print(f"\n作れないと決めた弦 ({CANNOT} に記載): {len(skip)} 件")
    return 0


def cmd_preflight(args):
    """作り始める前に、素材のどれが元の版に使えないかを出す。"""
    print("素材フォルダ全体を照合する…\n")
    r = run([sys.executable, CHECKER, SRC_DIR, "--base", args.base])
    print(r.stdout)
    if r.returncode == 0:
        print("→ 元の版として使えない素材はない。作り始めてよい。")
    else:
        print("→ 上の「先に直す元の版」に出たものは、直すまで元の版に選ばない。")
        print("   `(基準 …)` の行が出た組は、どの版が正しいかを人が決める。")
    return 0


def cmd_check(args):
    """作ったものを検収する。合格なら素材フォルダへ移す。"""
    out = os.path.abspath(args.file)
    if not os.path.exists(out):
        print(f"FATAL ファイルが無い: {out}")
        return 1
    stem = os.path.splitext(os.path.basename(out))[0]
    letter = string_of(stem)
    if letter is None:
        print(f"FATAL 弦の名前が `_` 区切りのトークンとして1つに定まらない: {stem}")
        return 1
    base_stem = None
    for s in stems(SRC_DIR):
        if set_key(s) == set_key(stem) and string_of(s) == args.base:
            base_stem = s
            break
    if base_stem is None:
        print(f"FATAL 基準の {args.base}線 の版が素材フォルダに無い: {set_key(stem)}")
        return 1
    for name in (stem, base_stem):
        for folder in (SRC_DIR,):
            if name != stem and not os.path.exists(os.path.join(folder, name + ".musicxml")):
                print(f"FATAL 元の版が見つからない: {name}")
                return 1

    os.makedirs(WORK_DIR, exist_ok=True)
    for f in os.listdir(WORK_DIR):
        os.remove(os.path.join(WORK_DIR, f))
    shutil.copy2(os.path.join(SRC_DIR, base_stem + ".musicxml"), WORK_DIR)
    shutil.copy2(out, WORK_DIR)

    js = os.path.join(WORK_DIR, f"check_{stem}.json")
    r = run([sys.executable, CHECKER, WORK_DIR, "--base", args.base,
             "--target", stem, "--json", js])
    print(r.stdout)
    if r.returncode != 0:
        print("→ 不合格。上の「合否に効く指摘」を見る。")
        print("   出力の名前で出た行 = 作る側へ返す / 元の版の名前で出た行 = 元の版を直す人へ")
        return 1

    print("→ 合格。次にやること:")
    dup = os.path.join(SRC_DIR, stem + ".musicxml")
    mscz = os.path.join(SRC_DIR, stem + ".mscz")
    if os.path.exists(dup) or os.path.exists(mscz):
        print(f"   同じ名前が素材フォルダに既にある。差し替えるなら:")
        print(f"     python {os.path.relpath(__file__, REPO)} replace {stem}.musicxml")
    else:
        shutil.copy2(out, os.path.join(SRC_DIR, stem + ".musicxml"))
        print(f"   素材フォルダへ移した: {stem}.musicxml")
        print(f"   登録するなら:")
        print(f"     python {os.path.relpath(__file__, REPO)} register {stem}.musicxml")
    print("\n   登録の前に MuseScore で開いて目で確かめること:")
    print("     符尾の向きと連桁 / スラーの弧が音符に掛かっているか / アーティキュレーションと装飾音")
    return 0


def _upload(file_name, replace):
    env = dict(os.environ, ONLY=file_name, SRC_DIR=SRC_DIR)
    if replace:
        env["REPLACE"] = "1"
    print(("差し替え" if replace else "登録") + f": {file_name}\n")
    p = subprocess.run(["npx", "tsx", UPLOADER], cwd=REPO, env=env, shell=True,
                       text=True, encoding="utf-8", errors="replace")
    return p.returncode


def cmd_register(args):
    return _upload(args.file, replace=False)


def cmd_replace(args):
    """登録済みのものを差し替える。先に古いファイルを退避する。"""
    stem = os.path.splitext(args.file)[0]
    os.makedirs(OLD_DIR, exist_ok=True)
    for ext in (".musicxml", ".mscz"):
        src = os.path.join(SRC_DIR, stem + ext)
        if os.path.exists(src) and ext == ".mscz":
            shutil.move(src, os.path.join(OLD_DIR, stem + "_旧" + ext))
            print(f"退避: {stem}{ext}")
    return _upload(args.file, replace=True)


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("status", help="組ごとの進み具合と、次に作るもの")
    p = sub.add_parser("preflight", help="作り始める前の下見")
    p.add_argument("--base", default="G", choices=list("GDAE"))
    p = sub.add_parser("check", help="作ったものを検収する")
    p.add_argument("file", help="出力の .musicxml")
    p.add_argument("--base", required=True, choices=list("GDAE"), help="元の版の弦")
    p = sub.add_parser("register", help="検収を通ったものを登録する")
    p.add_argument("file", help="素材フォルダの .musicxml の名前")
    p = sub.add_parser("replace", help="登録済みのものを差し替える")
    p.add_argument("file", help="素材フォルダの .musicxml の名前")
    args = ap.parse_args()
    return {"status": cmd_status, "preflight": cmd_preflight, "check": cmd_check,
            "register": cmd_register, "replace": cmd_replace}[args.cmd](args)


if __name__ == "__main__":
    sys.exit(main())
