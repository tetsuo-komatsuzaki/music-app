# -*- coding: utf-8 -*-
"""
弦の上 v2 — 見本v7忠実ズーム(全要素=測量値×一様スケール)
■ 測量表(図解アセット見本_一覧.png A-1, 元px):
  指板: x[141,260] y[194,222] 端は垂直フラット(x261でn=0)
  弦4本: y=195,204,212,220 (等間隔8.3px・平行) E→G
  駒: 右向き三角形 左辺x=338 y[199,217] → 頂点(370,207.5) ※見本の様式
  f字: 上 x[240,299]y[163,182] / 下 x[240,299]y[234,252] (中線はPNGから直接トレース)
  胴輪郭: 4px間隔実測テーブル(x184-372) 上部胴幅92/くびれ62/下部胴114 (比0.807≈実物0.816)
■ 実物補正(IMG_2096実測: 下部胴幅353px=206mm, 1見本px=1.835mm) 2026-08-11:
  駒中心=290.0 (指板端+55mm: 再計測2026-08-12/指板影の誤含みを修正・実物標準と一致) / テール前縁=320.5 (駒+56mm) ※見本の304/338は実物比+11%/+14%ズレ→実物優先
  f字: 長さ87mm=47.4px 駒中心±23.7 → x[258.5,305.9], 弦帯中心から±21.9px(y=185.6/229.4)
  テールピース: 実物は駒側が狭い → 見本三角形を反転(頂点=駒側)
  弦: 駒まで平行、駒→テール取付部(x322)で半分の間隔に収束
■ ズーム: クロップ窓 x[205,380] y中心207.5 → S=1000/175=5.714 (一様)
  X_c=(x-205)*S, Y_c=(y-207.5)*S+440
"""
import numpy as np

BODY,DARK,LINE,STR = '#e8b87e','#4a2a18','#8a5a33','#e9e2d0'
BG,FLOOR,FLINE = '#F7F0E8','#E9D3A9','#D9BE8E'
S = 1000.0/175.0
def X(x): return (x-205.0)*S
def Y(y): return (y-207.5)*S + 440.0
def F(v): return f'{v:.2f}'
def P(pts): return ' '.join(f'{F(a)},{F(b)}' for a,b in pts)

# 胴輪郭 実測テーブル(x, top, bot)
EDGE = [(204,170,246),(208,167,248),(212,165,250),(216,164,252),(220,163,253),(224,162,253),
 (228,162,254),(232,162,253),(236,163,253),(240,163,252),(244,165,251),(248,167,249),
 (252,170,246),(256,174,242),(260,177,238),(264,177,239),(268,177,239),(272,176,239),
 (276,176,240),(280,176,240),(284,177,239),(288,177,238),(292,171,245),(296,169,247),
 (300,167,249),(304,162,254),(308,158,257),(312,156,260),(316,154,262),(320,153,263),
 (324,152,264),(328,151,264),(332,151,265),(336,152,264),(340,152,264),(344,153,263),
 (348,154,262),(352,156,260),(356,159,257),(360,162,254),(364,166,249),(368,172,243),
 (372,183,233),(376,196,220),(378,206,209)]

svg = []
svg.append('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" font-family="sans-serif">')
svg.append('<title>からだの癖: 弦の上(見本v7忠実ズーム)</title>')
svg.append(f'<rect width="1000" height="1000" fill="{BG}"/>')

# 胴(実測トレース: クロップ左端は垂直に閉じる)
from scipy.interpolate import PchipInterpolator
# コーナー4点(1px実測): 上左(259.5,172) 上右(290,170.5) 下左(258,244) 下右(290.5,244.5)
# コーナーで分割し区分平滑(コーナーは鋭角頂点として保持)
def seg_smooth(table, corners, col):
    # コーナー間を平滑化スプラインで復元(測量ノイズ除去)。実測点との最大乖離を検証。
    from scipy.interpolate import UnivariateSpline
    xs = np.array([e[0] for e in table], float)
    ys = np.array([e[col] for e in table], float)
    pieces = []; max_dev = 0.0
    bounds = [xs[0]] + [c[0] for c in corners] + [xs[-1]]
    for i in range(len(bounds)-1):
        m = (xs>=bounds[i]+4)&(xs<=bounds[i+1]-4)
        px_, py_ = xs[m], ys[m]
        if i>0: px_ = np.concatenate([[corners[i-1][0]],px_]); py_ = np.concatenate([[corners[i-1][1]],py_])
        if i<len(corners): px_ = np.concatenate([px_,[corners[i][0]]]); py_ = np.concatenate([py_,[corners[i][1]]])
        o = np.argsort(px_); px_,py_ = px_[o],py_[o]
        u,ui = np.unique(px_, return_index=True); px_,py_ = u, py_[ui]
        if len(px_) >= 5:
            # s=平滑度: 残差二乗和上限 ≈ n*(0.8px)^2 → ノイズ除去しつつ±1.5px以内
            sp = UnivariateSpline(px_, py_, s=len(px_)*0.30, k=3)
            fit = sp(px_)
            max_dev = max(max_dev, float(np.abs(fit-py_).max()))
            n = max(8, int((px_[-1]-px_[0])/2.5))
            sx_ = np.linspace(px_[0], px_[-1], n)
            pieces += list(zip(sx_, sp(sx_)))
        else:
            pieces += list(zip(px_, py_))
    seg_smooth.max_dev = max(getattr(seg_smooth,'max_dev',0.0), max_dev)
    return pieces
CORNERS_T = [(259.5,172.0),(290.0,170.5)]
CORNERS_B = [(258.0,244.0),(290.5,244.5)]
top_pts = [(X(x),Y(y)) for x,y in seg_smooth(EDGE, CORNERS_T, 1)]
bot_pts = [(X(x),Y(y)) for x,y in seg_smooth(EDGE, CORNERS_B, 2)][::-1]
def bezier_path(pts, sharp=None, closed=True):
    """Catmull-Rom→3次ベジェ。sharpに含まれる頂点では接線を切る(尖り保持)"""
    p = list(pts); n = len(p)
    sharp = sharp or set()
    def is_sharp(i): return i % n in sharp
    d = f'M {F(p[0][0])} {F(p[0][1])} '
    for i in range(n if closed else n-1):
        p1 = p[i]; p2 = p[(i+1)%n]
        p0 = p1 if is_sharp(i) else p[(i-1)%n]
        p3 = p2 if is_sharp((i+1)%n) else p[(i+2)%n]
        c1 = (p1[0]+(p2[0]-p0[0])/6, p1[1]+(p2[1]-p0[1])/6)
        c2 = (p2[0]-(p3[0]-p1[0])/6, p2[1]-(p3[1]-p1[1])/6)
        d += f'C {F(c1[0])} {F(c1[1])} {F(c2[0])} {F(c2[1])} {F(p2[0])} {F(p2[1])} '
    return d + ('Z' if closed else '')
# 制御点は平滑列を10点おきに間引き(コーナー点は必ず含める)
def thin_keep(pts, keep_xy, step=3):
    out = [pts[0]]
    for i,pt in enumerate(pts[1:-1],1):
        if i % step == 0: out.append(pt)
    out.append(pts[-1])
    # コーナーを厳密挿入
    for kx,ky in keep_xy:
        best = min(range(len(out)), key=lambda j:(out[j][0]-kx)**2+(out[j][1]-ky)**2)
        out[best] = (kx,ky)
    return out
ct_c = [(X(c[0]),Y(c[1])) for c in CORNERS_T]
cb_c = [(X(c[0]),Y(c[1])) for c in CORNERS_B]
_top = thin_keep(top_pts, ct_c)
_bot = thin_keep(bot_pts, cb_c)
body_pts = [(0,_top[0][1])] + _top + _bot + [(0,_bot[-1][1])]
# シャープ頂点: 左端の閉路2点 + くびれ角4点
sharp = {0, len(body_pts)-1}
for kx,ky in ct_c+cb_c:
    for j,(px_,py_) in enumerate(body_pts):
        if abs(px_-kx)<0.01 and abs(py_-ky)<0.01: sharp.add(j)
svg.append(f'<path id="body-plate" d="{bezier_path(body_pts, sharp=sharp)}" fill="{BODY}" stroke="{LINE}" stroke-width="{0.6*S:.1f}"/>')

# f字孔: 見本に存在しないため描画しない(測量で「f字」に見えた要素は胴輪郭のC字部と判明)

# 指板下の開口(実物写真: 指板は胴から浮いており端の下に暗い穴が見える)
# 開口は指板端の直下にタック(左ギャップへの突出≈1mm: 左右クリア比率を保つ 2026-08-12)
svg.append(f'<ellipse id="fb-gap" cx="{F(X(258.5))}" cy="{F(Y(208))}" rx="{F(2.1*S)}" ry="{F(15.0*S)}" fill="#2A1810" opacity="0.85"/>')
# 指板(実測: x[141,260] y[194,222]・端は角丸で厚みを示唆)
svg.append(f'<rect id="fingerboard" x="-20" y="{F(Y(194))}" width="{F(X(260)+20)}" height="{F((222-194)*S)}" rx="{F(2.2*S)}" fill="{DARK}"/>')

# テールピース(IMG_2096実測 2026-08-12): 駒側が広い(最大42.0mm)→ボタン側へテーパー(末端≈11mm)
# 実測プロファイル(t, 幅mm)。テーパー部は平滑スプラインで復元(ノイズ除去・残差検証)、
# 前縁/末端キャップは楕円弧で解析構成(Catmull-Rom折返しのオーバーシュート回避)
TAIL_PROF = [(0.00,8.8),(0.10,42.0),(0.18,38.5),(0.25,33.8),(0.32,30.3),(0.39,25.7),
             (0.46,22.8),(0.53,19.3),(0.60,16.9),(0.67,15.2),(0.74,14.6),(0.81,13.4),
             (0.88,12.3),(0.95,10.5),(1.00,8.8)]
TAIL_X0, TAIL_LEN = 320.5, 52.5
from scipy.interpolate import UnivariateSpline as _US
_tt = np.array([p[0] for p in TAIL_PROF[1:-1]]); _ww = np.array([p[1] for p in TAIL_PROF[1:-1]])
_tw = _US(_tt, _ww, s=len(_tt)*0.55, k=3)
_fit = _tw(_tt)
TAIL_PROF_DEV = float(np.abs(_fit-_ww).max())
def tail_w(t):
    """平滑幅mm: 楕円前縁キャップ(t<0.10) / スプラインテーパー / 楕円末端キャップ(t>0.95)"""
    if t <= 0.10:
        return float(_tw(0.10)) * np.sqrt(max(0.0, 1-((0.10-t)/0.10)**2)) if t>0 else 0.0
    if t >= 0.95:
        return float(_tw(0.95)) * np.sqrt(max(0.0, 1-((t-0.95)/0.05)**2)) if t<1 else 0.0
    return float(_tw(t))
def tail_pts(n=70):
    ts = np.linspace(0.0, 1.0, n)
    up = [(X(TAIL_X0+t*TAIL_LEN), Y(207.5-tail_w(t)/1.835/2)) for t in ts]
    dn = [(X(TAIL_X0+t*TAIL_LEN), Y(207.5+tail_w(t)/1.835/2)) for t in ts]
    return up + dn[::-1]
svg.append(f'<path id="tailpiece" d="{bezier_path(tail_pts(), sharp=set(), closed=True)}" fill="{DARK}"/>')

# 弦4本(実測y・平行・指板左端〜駒左辺)
BR_C = 290.0   # 駒中心(指板端260+55mm/1.835)
# 駒: 上面視(弦を横断する薄いストリップ=正しい投影)を実体化
#   板厚4.5mm=2.45px / 全幅41.5mm=22.6px(足が弦帯の上下にはみ出す) / 中央くびれ・両端=足
BT = 2.45
BW2 = 22.6/2
by_t, by_b = 207.5-BW2, 207.5+BW2
svg.append(f"""<path id="bridge" d="M {F(X(BR_C-BT*1.7))},{F(Y(by_t))}
  L {F(X(BR_C+BT*1.7))},{F(Y(by_t))}
  L {F(X(BR_C+BT*1.7))},{F(Y(by_t+3.2))}
  C {F(X(BR_C+BT*0.7))},{F(Y(by_t+4.6))} {F(X(BR_C+BT*0.7))},{F(Y(by_b-4.6))} {F(X(BR_C+BT*1.7))},{F(Y(by_b-3.2))}
  L {F(X(BR_C+BT*1.7))},{F(Y(by_b))}
  L {F(X(BR_C-BT*1.7))},{F(Y(by_b))}
  L {F(X(BR_C-BT*1.7))},{F(Y(by_b-3.2))}
  C {F(X(BR_C-BT*0.7))},{F(Y(by_b-4.6))} {F(X(BR_C-BT*0.7))},{F(Y(by_t+4.6))} {F(X(BR_C-BT*1.7))},{F(Y(by_t+3.2))}
  Z" fill="#D9B184" stroke="{LINE}" stroke-width="{F(0.45*S)}" stroke-linejoin="round"/>""")

KY = [195,204,212,220]; NAMES=['E','A','D','G']
anchors = {}
svg.append(f'<g id="strings" stroke="{STR}" stroke-linecap="round" fill="none">')
for y,nm in zip(KY,NAMES):
    y_t = 207.5 + (y-207.5)*0.62  # テール取付での収束(実物比)
    svg.append(f'<path d="M 0,{F(Y(y))} L {F(X(BR_C))},{F(Y(y))} L {F(X(TAIL_X0+2.5))},{F(Y(y_t))}" '
               f'fill="none" stroke-width="{0.9*S:.1f}"/>')
    anchors[f'lane-{nm.lower()}'] = (round((X(260)+X(BR_C-BT*1.7))/2,1), round(Y(y),1))
svg.append('</g>')
# f字孔2本(実物比位置 x[258.5,305.9] / 目玉2+単一Sステム+中央ニック)
for fy,flip in [(185.6,1),(229.4,-1)]:
    y0 = Y(fy)
    xl, xr = X(BR_C-23.7), X(BR_C+23.7)
    svg.append(f'<path d="M {F(xl+8)},{F(y0+9*flip)} '
               f'C {F(xl+70)},{F(y0-14*flip)} {F(xr-70)},{F(y0+14*flip)} {F(xr-8)},{F(y0-9*flip)}" '
               f'fill="none" stroke="{DARK}" stroke-width="{F(1.9*S)}" stroke-linecap="round" opacity="0.92"/>')
    svg.append(f'<circle cx="{F(xl+4)}" cy="{F(y0+10*flip)}" r="{F(1.9*S)}" fill="{DARK}" opacity="0.92"/>')
    svg.append(f'<circle cx="{F(xr-4)}" cy="{F(y0-10*flip)}" r="{F(1.9*S)}" fill="{DARK}" opacity="0.92"/>')
    for side in [-1,1]:
        svg.append(f'<line x1="{F(X(BR_C)+side*4)}" y1="{F(y0+side*2*flip)}" '
                   f'x2="{F(X(BR_C)+side*16)}" y2="{F(y0+side*8*flip)}" '
                   f'stroke="{DARK}" stroke-width="{F(0.9*S)}" stroke-linecap="round" opacity="0.92"/>')
# エンドボタン(実測 x[374,379] y[206,210])
svg.append(f'<rect id="end-button" x="{F(X(374))}" y="{F(Y(206))}" width="{F(5*S)}" height="{F(4.5*S)}" '
           f'rx="{F(1.2*S)}" fill="{DARK}"/>')

# ゾーン境界値(アンカー計算用のみ・描画なし 2026-08-12指示でガイド線とラベルを削除)
BR_L = BR_C - BT*1.7
Z1 = X(260)+(X(BR_L)-X(260))/3; Z2 = X(260)+2*(X(BR_L)-X(260))/3

anchors.update({
  'fb-end': (round(X(260),1), 440.0),
  'bridge': (round(X(BR_C),1), 440.0),
  'tailpiece': (round(X(TAIL_X0+TAIL_LEN/2),1), 440.0),
  'zone-fb': (round((X(260)+Z1)/2,1), 440.0),
  'zone-mid': (round((Z1+Z2)/2,1), 440.0),
  'zone-bridge': (round((Z2+X(BR_L))/2,1), 440.0),
  'perp-top': (round((X(260)+X(BR_L))/2,1), round(Y(195)-90,1)),
  'perp-bottom': (round((X(260)+X(BR_L))/2,1), round(Y(220)+90,1)),
})
for k,(x,y) in anchors.items():
    svg.append(f'<circle id="anc-str-{k}" cx="{F(x)}" cy="{F(y)}" r="0" fill="none"/>')
svg.append('<g id="str-markers"></g>')
svg.append('</svg>')
open('gennoue.svg','w').write('\n'.join(svg))

# ===== 弓付き版: 弦に直角(垂直)・真上からの構図 =====
# 上面視: 毛はスティックの真下で不可視 → 見えるのはスティック帯のみ。
# フロッグ=E線側(上・右手側)、先=G線側(下・画面外)。
# 上面視のフロッグ=スティックより僅かに広い暗帯(幅13mm)、巻線スリーブ、スクリューボタン。
MM = S/1.835
BOW_X = X((260 + (BR_C-BT*1.7))/2)
STICK_W = 8*MM
FROG_W, FROG_L = 13*MM, 60*MM
BTN_W, BTN_L = 11*MM, 10*MM
WRAP_L = 40*MM
# 当て位置=中弓: 毛の演奏長≈650mm、その中央325mm地点を弦帯中心(440c)に合わせる
# 毛の起点≈フロッグ前端(=ボタン10mm+フロッグ60mm) → ボタン上端 = 440 - (70+325)mm
CONTACT_MM = 325.0
btn_top = 440.0 - (70.0 + CONTACT_MM)*MM
frog_top = btn_top + BTN_L
wrap_top = frog_top + FROG_L
bow = []
bow.append('<g id="bow">')
# スティック(ボタン下から下端画面外へ=先方向)
stick_end = btn_top + (70.0 + 650.0)*MM   # 先端位置(画面外可)
bow.append(f'<rect id="bow-stick" x="{F(BOW_X-STICK_W/2)}" y="{F(frog_top)}" width="{F(STICK_W)}" height="{F(stick_end-frog_top)}" fill="#C89A6B" stroke="{LINE}" stroke-width="1.4"/>')
# 巻線スリーブ(フロッグの先側)
bow.append(f'<rect id="bow-wrap" x="{F(BOW_X-STICK_W/2-1.5)}" y="{F(wrap_top)}" width="{F(STICK_W+3)}" height="{F(WRAP_L)}" fill="#8a6a45" stroke="{LINE}" stroke-width="1.2"/>')
# フロッグ上面(スティックより広い暗帯)
bow.append(f'<rect id="bow-frog" x="{F(BOW_X-FROG_W/2)}" y="{F(frog_top)}" width="{F(FROG_W)}" height="{F(FROG_L)}" rx="{F(2.5*MM)}" fill="{DARK}"/>')
# スクリューボタン(末端)
bow.append(f'<rect id="bow-screw" x="{F(BOW_X-BTN_W/2)}" y="{F(btn_top)}" width="{F(BTN_W)}" height="{F(BTN_L)}" rx="{F(2*MM)}" fill="#8a6a45" stroke="{LINE}" stroke-width="1.2"/>')
bow.append('</g>')
svg_bow = [l for l in svg]
svg_bow.insert(len(svg_bow)-2, '\n'.join(bow))
open('gennoue_bow.svg','w').write('\n'.join(svg_bow))

# 弓の検証: 垂直性(=弦との直角)と接触点位置
_lane_l, _lane_r = 260.0, BR_C-BT*1.7
print(f'弓当て位置: 中弓(毛起点+{CONTACT_MM:.0f}mm/650mm, ボタンy={btn_top:.0f}c=画面外)')
print(f'弓検証: 接触x={BOW_X:.1f}c (走行域中央={X((_lane_l+_lane_r)/2):.1f}c, 差={abs(BOW_X-X((_lane_l+_lane_r)/2)):.2f}c) / 弦との角度=90.0°(垂直rect構成)')

import re
out = open('gennoue.svg').read()
# 検証: 比率が見本と一致するか(スケール不変量)
r1 = (222-194)/ (253-162)          # 指板幅/上部胴幅(見本)
r2 = ((222-194)*S) / ((Y(253)-Y(162)))  # 同(生成)
print(f'比率検証 指板幅/上部胴幅: 見本={r1:.4f} 生成={r2:.4f} 差={abs(r1-r2):.2e}')
r3 = (370-338)/(338-260); r4 = (X(370)-X(338))/(X(338)-X(260))
print(f'比率検証 駒長/弓走行域: 見本={r3:.4f} 生成={r4:.4f} 差={abs(r3-r4):.2e}')
print(f'輪郭平滑化 実測点との最大乖離: {seg_smooth.max_dev:.2f}見本px (許容1.5)')
# === 最終パス検証: 出射ベジェをサンプルして形状と滑らかさを実測 ===
def bez_sample(p0,c1,c2,p3,n=12):
    t = np.linspace(0,1,n)[1:]
    return [((1-u)**3*p0[0]+3*(1-u)**2*u*c1[0]+3*(1-u)*u*u*c2[0]+u**3*p3[0],
             (1-u)**3*p0[1]+3*(1-u)**2*u*c1[1]+3*(1-u)*u*u*c2[1]+u**3*p3[1]) for u in t]
m2 = re.search(r'id="body-plate" d="([^"]*)"', out)
nums = [float(v) for v in re.findall(r'-?\d+\.?\d*', m2.group(1))]
sampled = [(nums[0],nums[1])]; i2 = 2
while i2+5 < len(nums):
    sampled += bez_sample(sampled[-1], (nums[i2],nums[i2+1]), (nums[i2+2],nums[i2+3]), (nums[i2+4],nums[i2+5]))
    i2 += 6
sp_pts = np.array(sampled)
sharp_xy = [(X(c[0]),Y(c[1])) for c in CORNERS_T+CORNERS_B] + [(0,0)]
def near_sharp(p):
    return any((p[0]-sx_)**2+(p[1]-sy_)**2 < 30**2 for sx_,sy_ in sharp_xy) or p[0] < 30
v1 = sp_pts[1:-1]-sp_pts[:-2]; v2 = sp_pts[2:]-sp_pts[1:-1]
ang = np.degrees(np.abs(np.angle(np.exp(1j*(np.arctan2(v2[:,1],v2[:,0])-np.arctan2(v1[:,1],v1[:,0]))))))
mask_ok = np.array([not near_sharp(p) for p in sp_pts[1:-1]])
top_m = mask_ok & (sp_pts[1:-1,1] < 440); bot_m = mask_ok & (sp_pts[1:-1,1] >= 440)
print(f'最終パス折れ角 上縁max={ang[top_m].max():.1f}° 下縁max={ang[bot_m].max():.1f}° (コーナー除外・許容8°)')
# === テールピース自己検証: 出射パスを再サンプルし実測プロファイルと照合 ===
m3 = re.search(r'id="tailpiece" d="([^"]*)"', out)
nums3 = [float(v) for v in re.findall(r'-?\d+\.?\d*', m3.group(1))]
tp = [(nums3[0],nums3[1])]; i3 = 2
while i3+5 < len(nums3):
    tp += bez_sample(tp[-1], (nums3[i3],nums3[i3+1]), (nums3[i3+2],nums3[i3+3]), (nums3[i3+4],nums3[i3+5]), n=8)
    i3 += 6
tp = np.array(tp)
max_dev_t = 0.0
for t,wmm in TAIL_PROF[1:-1]:
    xq = X(TAIL_X0 + t*TAIL_LEN)
    near = tp[np.abs(tp[:,0]-xq) < 6]
    if len(near) < 2: continue
    w_out = (near[:,1].max()-near[:,1].min())/S*1.835   # 出射幅をmmへ
    max_dev_t = max(max_dev_t, abs(w_out - wmm))
_gap_mm = (BR_C-260)*1.835
_ecx, _erx = 258.5, 2.1
_clear_L = (BR_C-BT*1.7 - (_ecx+_erx))*1.835
_clear_R = (TAIL_X0 - (BR_C+BT*1.7))*1.835
print(f'左右クリア(視覚): 左={_clear_L:.1f}mm 右={_clear_R:.1f}mm 比率={_clear_L/_clear_R:.3f} (写真中心比0.979)')
print(f'指板端→駒 出射距離: {_gap_mm:.1f}mm (実物標準55, 許容±2)')
print(f'テール自己検証: 出射幅と実測幅の最大差={max_dev_t:.2f}mm (許容2.0) / プロファイル平滑残差={TAIL_PROF_DEV:.2f}mm')
v1t = tp[1:-1]-tp[:-2]; v2t = tp[2:]-tp[1:-1]
_at = np.degrees(np.abs(np.angle(np.exp(1j*(np.arctan2(v2t[:,1],v2t[:,0])-np.arctan2(v1t[:,1],v1t[:,0]))))))
_cap = (tp[1:-1,0] < X(TAIL_X0+0.10*TAIL_LEN)) | (tp[1:-1,0] > X(TAIL_X0+0.93*TAIL_LEN))
print(f'テール折れ角(キャップ除外)max={_at[~_cap].max():.1f}° (許容8°)')

print('アンカー:', len(re.findall(r'id="anc-str-', out)), '/', len(anchors))
