# -*- coding: utf-8 -*-
# 拡大モーダル背景 (80_zoom_real.png) の加工を一括生成 → 80_zoom_red.jpg
#  1) 背景グラフをデモ数値 (60→65→68→74→80・5点・右肩上がり) に描き替え
#     実チャートの軸に合わせる: 達成90=破線y193 を基準に 5.4px/点
#  2) 赤セル (シ・A線) をセル境界ぴったりに塗り + 白丸グリフ「シ」
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
img = Image.open(os.path.join(HERE, "shots", "80_zoom_real.png")).convert("RGB")
px = img.load()
d = ImageDraw.Draw(img)

# ── 1) グラフ描き替え ──
BG = px[400, 300]                # プロット領域の地色 (dim済)
ring = px[186, 241]              # 既存スパイク頂点の輪の色をサンプル
if sum(ring) < 150:              # 外したら固定値
    ring = (125, 122, 112)
line_c = tuple(int(c * 0.92) for c in ring)
lab_c = (58, 66, 86)             # 4/25 相当の dim 文字色 (サンプルは背景を拾うため固定)

# プロット消去 (破線・達成ラベル・いま・説明文は残す)
d.rectangle([110, 200, 690, 390], fill=BG)
for yy in range(396, 429):  # 4/25 だけ行ごとに地色で消す (縦グラデ対応)
    d.line([(104, yy), (240, yy)], fill=px[300, yy])

# 薄いグリッド線を復元
for gy in (215, 291, 368):
    d.line([(118, gy), (668, gy)], fill=tuple(int(c * 1.45) for c in BG), width=1)

# デモ折れ線: 90点=y193, 5.4px/点
def y_of(score):
    return int(round(193 + (90 - score) * 5.4))
xs = [127, 258, 390, 521, 653]
scores = [60, 65, 68, 74, 80]
pts = [(x, y_of(sc)) for x, sc in zip(xs, scores)]
d.line(pts, fill=line_c, width=7, joint="curve")
for i, (x, y) in enumerate(pts):
    d.ellipse([x - 10, y - 10, x + 10, y + 10], fill=BG, outline=ring, width=5)
# 最新点はやや強調 (実装の現在点)
x, y = pts[-1]
d.ellipse([x - 10, y - 10, x + 10, y + 10], fill=ring, outline=ring, width=5)

# ラベル 8/25
try:
    f = ImageFont.truetype("C:/Windows/Fonts/meiryo.ttc", 24)
except OSError:
    f = ImageFont.truetype("C:/Windows/Fonts/YuGothM.ttc", 24)
d.text((112, 398), "8/25", fill=lab_c, font=f)

# ── 2) 赤セル シ・A線 ──
d.rectangle([169, 759, 201, 782], fill=(226, 106, 93))
cx, cy = 185, 770
d.ellipse([cx - 8, cy - 8, cx + 8, cy + 8], fill=(255, 255, 255), outline=(210, 214, 222))
try:
    f2 = ImageFont.truetype("C:/Windows/Fonts/meiryo.ttc", 11)
except OSError:
    f2 = ImageFont.truetype("C:/Windows/Fonts/YuGothM.ttc", 11)
bb = d.textbbox((0, 0), "シ", font=f2)
d.text((cx - (bb[2] - bb[0]) / 2 - bb[0], cy - (bb[3] - bb[1]) / 2 - bb[1]), "シ", fill=(90, 100, 114), font=f2)

img.save(os.path.join(HERE, "shots", "80_zoom_red.jpg"), "JPEG", quality=86)
print("zoom bg ok", "ring=", ring, "lab=", lab_c)
