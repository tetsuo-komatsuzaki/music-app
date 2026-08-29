# -*- coding: utf-8 -*-
# ホーム背景の前提差分を生成 (2026-08-29 Tetsuo指示):
#  premise: 学びレッスン✓(元から)+エチュード✓+通して弾く2/3回+リング2/3
#  done   : さらに通して弾く✓+3/3回+リング完成
# 学びレッスンの✓丸と行末✓は同画像から領域コピー (描き直さない)
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "shots", "16_home_kirakira.jpg")

CIRCLE_A = (243, 853, 287, 897)      # 学びレッスンの✓丸
CHECK_A = (692, 858, 719, 888)       # 学びレッスン行末の✓
ETUDE_Y = 917                        # エチュード丸の貼り先 y
RUN_Y = 980                          # 通して弾く丸の貼り先 y
MADA = (655, 920, 730, 957)          # 「まだ」領域
RUNS = (648, 982, 730, 1020)         # 「1/3回」領域
CNT = (118, 918, 176, 962)           # リング中央「1/3」領域
CARD_BG = (0x19, 0x28, 0x47)
INNER_BG = (0x19, 0x28, 0x49)
TRACK = (0x2b, 0x3b, 0x5d)
GOLD = (0xe9, 0xb2, 0x3d)
CREAM = (0xf8, 0xee, 0xd3)
SUB = (0x8e, 0xa0, 0xc4)

f_big = ImageFont.truetype("C:/Windows/Fonts/meiryob.ttc", 34)
f_small = ImageFont.truetype("C:/Windows/Fonts/meiryob.ttc", 20)
f_run = ImageFont.truetype("C:/Windows/Fonts/meiryob.ttc", 23)

def text_at(d, xy, s, font, fill, anchor="lm"):
    d.text(xy, s, font=font, fill=fill, anchor=anchor)

def build(done):
    img = Image.open(SRC).convert("RGB")
    d = ImageDraw.Draw(img)
    circle = img.crop(CIRCLE_A)
    check = img.crop(CHECK_A)
    # エチュード: ✓丸+行末✓ (「まだ」を消す)
    img.paste(circle, (CIRCLE_A[0], ETUDE_Y))
    d = ImageDraw.Draw(img)
    d.rectangle(MADA, fill=CARD_BG)
    img.paste(check, (688, 924))
    d = ImageDraw.Draw(img)
    if done:
        img.paste(circle, (CIRCLE_A[0], RUN_Y))
        d = ImageDraw.Draw(img)
    # 通して弾く回数
    d.rectangle(RUNS, fill=CARD_BG)
    text_at(d, (RUNS[2] - 4, (RUNS[1] + RUNS[3]) // 2), "3/3回" if done else "2/3回", f_run, SUB, anchor="rm")
    # リング: 既存の帯をトラック色で塗り潰してから金の弧を描く
    d.arc([65, 856, 226, 1016], 0, 360, fill=TRACK, width=18)
    if done:
        d.arc([66, 857, 225, 1015], 0, 360, fill=GOLD, width=15)
    else:
        d.arc([66, 857, 225, 1015], 270, 150, fill=GOLD, width=15)  # 12時から時計回り240°
    # 中央カウンタ
    d.rectangle(CNT, fill=INNER_BG)
    cy = (CNT[1] + CNT[3]) // 2
    text_at(d, (CNT[0] + 6, cy - 1), "3" if done else "2", f_big, CREAM)
    text_at(d, (CNT[0] + 30, cy + 5), "/3", f_small, SUB)
    out = os.path.join(HERE, "shots", "16_home_done.jpg" if done else "16_home_premise.jpg")
    img.save(out, "JPEG", quality=86)
    print("ok", out)

build(False)
build(True)
