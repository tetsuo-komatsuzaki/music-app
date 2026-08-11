# -*- coding: utf-8 -*-
"""
Arcoda からだの癖: 全身イラスト SVG本番生成
- 数値はv9確定ドラフトと同一(写真抽出値+承認済み目視近似)
- 単位: 人物身長=100 (頭頂y=0, 足裏y=100, y下向き=SVGネイティブ)
- 視点定義: 正面 / よこ=左側面視(楽器を載せた左肩が手前)
- レイヤー: 部位ごとにid付きgroup、markersは空コンテナ(アプリが挿入)
- アンカー: id="anc-{view}-{name}" の不可視circle(r=0)
"""
import numpy as np, math
from scipy.interpolate import PchipInterpolator

S = 100.0
BG,FIGC,LINE,VIO,VIOD,VIO2,RED,HAIR = '#f7efe2','#f3e9d5','#8a7a66','#a1734f','#6f4a2f','#c49583','#c14a3d','#4a3f38'

def F(v): return f'{v:.3f}'
def pts_str(pts): return ' '.join(f'{F(x)},{F(y)}' for x,y in pts)

def smooth(ts_c, ws_c, ts): return PchipInterpolator(ts_c, ws_c)(ts)

def limb_path(pts, n=60):
    pts = np.array(pts); t = np.linspace(0,1,len(pts)); ts = np.linspace(0,1,n)
    xs = PchipInterpolator(t,pts[:,0])(ts); ys = PchipInterpolator(t,pts[:,1])(ts)
    d = f'M {F(xs[0])} {F(ys[0])} ' + ' '.join(f'L {F(x)} {F(y)}' for x,y in zip(xs[1:],ys[1:]))
    return d

def limb_svg(id_, pts, w_out=3.0, w_in=2.14, z_note=''):
    d = limb_path(pts)
    return (f'<g id="{id_}"{z_note}>'
            f'<path d="{d}" fill="none" stroke="{LINE}" stroke-width="{w_out}" stroke-linecap="round"/>'
            f'<path d="{d}" fill="none" stroke="{FIGC}" stroke-width="{w_in}" stroke-linecap="round"/></g>')

def violin_svg(id_, chin, scroll, width_scale=1.0):
    cx,cy = chin; sx,sy = scroll
    L = math.hypot(sx-cx, sy-cy)
    ux,uy = (sx-cx)/L,(sy-cy)/L; nx,ny = -uy,ux
    def M(t,w): return (cx+ux*t*L+nx*w*L, cy+uy*t*L+ny*w*L)
    tt = np.linspace(0.02,0.585,80)
    ww = smooth([0.02,0.05,0.16,0.30,0.44,0.55,0.585],
                [0.02,0.12,0.172,0.092,0.140,0.09,0.028], tt)*width_scale
    body = [M(t,w) for t,w in zip(tt,ww)]+[M(t,-w) for t,w in zip(tt[::-1],ww[::-1])]
    nk = 0.020*width_scale; fb = 0.016*width_scale
    sxy = M(0.97,0)
    parts = [
      f'<polygon id="{id_}-body" points="{pts_str(body)}" fill="{VIO}" stroke="{VIOD}" stroke-width="0.5"/>',
      f'<polygon id="{id_}-neck" points="{pts_str([M(0.585,nk),M(0.93,nk),M(0.93,-nk),M(0.585,-nk)])}" fill="{VIO}" stroke="{VIOD}" stroke-width="0.5"/>',
      f'<polygon id="{id_}-fb" points="{pts_str([M(0.30,fb),M(0.90,fb),M(0.90,-fb),M(0.30,-fb)])}" fill="{VIOD}"/>',
      f'<circle id="{id_}-scroll" cx="{F(sxy[0])}" cy="{F(sxy[1])}" r="{F(0.030*L)}" fill="{VIO}" stroke="{VIOD}" stroke-width="0.5"/>',
      f'<circle id="{id_}-scroll-eye" cx="{F(sxy[0])}" cy="{F(sxy[1])}" r="{F(0.014*L)}" fill="{VIOD}"/>',
    ]
    return f'<g id="{id_}">' + ''.join(parts) + '</g>', M, sxy

def head_svg(id_, cx, cy, r, facing):
    out = [f'<circle id="{id_}-face" cx="{F(cx)}" cy="{F(cy)}" r="{F(r)}" fill="{FIGC}" stroke="{LINE}" stroke-width="0.6"/>']
    if facing == -1:
        nose = [(cx-r*0.99,cy-0.4),(cx-r*1.10,cy+0.3),(cx-r*0.96,cy+1.0)]
        th = np.linspace(-math.pi*0.42, math.pi*0.50, 40)
        outer = [(cx+r*1.05*math.cos(a), cy-r*1.05*math.sin(a)) for a in th]
        inner = [(cx+r*0.66*math.cos(a), cy-r*0.66*math.sin(a)) for a in th[::-1]]
        out.insert(0, f'<polygon id="{id_}-nose" points="{pts_str(nose)}" fill="{FIGC}" stroke="{LINE}" stroke-width="0.45"/>')
        out.append(f'<polygon id="{id_}-hair" points="{pts_str(outer+inner)}" fill="{HAIR}"/>')
        out.append(f'<circle id="{id_}-bun" cx="{F(cx+r*1.02)}" cy="{F(cy+r*0.30)}" r="{F(r*0.30)}" fill="{HAIR}"/>')
    else:
        th = np.linspace(math.pi*0.15, math.pi*0.85, 40)
        outer = [(cx+r*1.04*math.cos(a), cy-r*1.04*math.sin(a)) for a in th]
        inner = [(cx+r*0.78*math.cos(a), cy-r*0.55*math.sin(a)) for a in th[::-1]]
        out.append(f'<polygon id="{id_}-hair" points="{pts_str(outer+inner)}" fill="{HAIR}"/>')
    return f'<g id="{id_}">' + ''.join(out) + '</g>'

def torso_svg(id_, cx, w_sh, w_hip, y_sh, y_hip):
    ys = np.linspace(y_sh, y_hip, 40)
    frac = (ys-y_sh)/(y_hip-y_sh)
    w = w_sh + (w_hip-w_sh)*frac - 1.8*np.sin(frac*math.pi)
    right = [(cx+wi,yi) for wi,yi in zip(w,ys)]
    left  = [(cx-wi,yi) for wi,yi in zip(w[::-1],ys[::-1])]
    sh = [(cx+w[0]*math.cos(a), y_sh-3.0*math.sin(a)) for a in np.linspace(0,math.pi,30)]
    return f'<polygon id="{id_}" points="{pts_str(right+left+sh)}" fill="{FIGC}" stroke="{LINE}" stroke-width="0.6"/>'

def shoe(pts_): return f'<polygon points="{pts_str(pts_)}" fill="{HAIR}"/>'
def anchor(view,name,x,y): return f'<circle id="anc-{view}-{name}" cx="{F(x)}" cy="{F(y)}" r="0" fill="none"/>'

anchors = {}
def A(view,name,x,y):
    anchors[f'{view}-{name}'] = (round(x,3),round(y,3))
    return anchor(view,name,x,y)

svg = []
svg.append('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-52 -15 188 132" font-family="sans-serif">')
svg.append(f'<rect x="-52" y="-15" width="188" height="132" rx="6" fill="{BG}"/>')

# ============ 正面 (cx=0) ============
fr = ['<g id="view-front">']
# 脚+靴 (両膝伸ばし)
for s,side in [(-1,'l'),(1,'r')]:
    xa = s*7.5
    fr.append(limb_svg(f'front-leg-{side}', [(s*4.5,52),(s*6.2,72),(xa,93)], w_out=3.4, w_in=2.5))
    toe = xa + s*7; heel = xa - s*2.5
    fr.append(shoe([(xa-2,92.5),(xa+2,92.5),(max(toe,heel),99),(min(toe,heel),99)]))
fr.append(torso_svg('front-torso', 0, 10.5, 8.2, 20.5, 54.5))
fr.append(limb_svg('front-neck', [(0,13),(0,20)], w_out=2.6, w_in=1.85))
fr.append(head_svg('front-head', 0, 6.2, 5.8, facing=0))
# 楽器: 顎(4.5,15.0)→12°下がり L=40
t12 = math.radians(12)
chinF = (4.5,15.0); scrollF = (chinF[0]+40*math.cos(t12), chinF[1]+40*math.sin(t12))
# 左腕(楽器の下→ネック)
fr.append(limb_svg('front-arm-l', [(9.5,21.2),(15.0,33.0),(28.5,27.5),(33.5,21.5)]))
vsvg, MF, scrollF_c = violin_svg('front-violin', chinF, scrollF, 1.0)
fr.append(vsvg)
lh = MF(0.80,0)
fr.append(f'<circle id="front-hand-l" cx="{F(lh[0])}" cy="{F(lh[1])}" r="1.6" fill="{FIGC}" stroke="{LINE}" stroke-width="0.5"/>')
# 弓 + フロッグ + 右腕
frog = (15.5,34.5); tip = (18.5,4.5)
fr.append(f'<line id="front-bow" x1="{F(frog[0])}" y1="{F(frog[1])}" x2="{F(tip[0])}" y2="{F(tip[1])}" stroke="{VIO2}" stroke-width="0.9" stroke-linecap="round"/>')
fr.append(f'<rect id="front-frog" x="{F(frog[0]-0.8)}" y="{F(frog[1]-1.5)}" width="1.6" height="2.7" fill="{HAIR}"/>')
fr.append(limb_svg('front-arm-r', [(-9.5,21.2),(-10.0,35.0),(frog[0]-1.2,frog[1]+0.5)]))
fr.append(f'<circle id="front-hand-r" cx="{F(frog[0])}" cy="{F(frog[1])}" r="1.5" fill="{FIGC}" stroke="{LINE}" stroke-width="0.5"/>')
# アンカー
fr.append(A('front','head',0,6.2))
fr.append(A('front','shoulder-l',10.5,20.5)); fr.append(A('front','shoulder-r',-10.5,20.5))
fr.append(A('front','elbow-l',15.0,33.0));   fr.append(A('front','elbow-r',-10.0,35.0))
fr.append(A('front','scroll',*scrollF_c))
fr.append(A('front','hip',0,54.5))
fr.append(A('front','knee-l',6.2,72));  fr.append(A('front','knee-r',-6.2,72))
fr.append(A('front','ankle-l',7.5,93)); fr.append(A('front','ankle-r',-7.5,93))
fr.append(A('front','stance-mid',0,93))
fr.append(f'<text x="0" y="111" text-anchor="middle" font-size="5" fill="{LINE}">正面</text>')
fr.append('<g id="front-markers"></g>')
fr.append('</g>')
svg += fr

# ============ よこ=左側面視 (cx=86, 前方=-x) ============
C = 86.0
sd = ['<g id="view-side">']
# 右腕(弓側)=奥: 上腕は胴の背後
sd.append(limb_svg('side-arm-r-upper', [(C-2.0,22.8),(C-8.7,29.0)]))
for fx_,side in [(-3.0,'front'),(2.8,'back')]:
    sd.append(limb_svg(f'side-leg-{side}', [(C+fx_*0.4,52),(C+fx_*0.8,72),(C+fx_,93)], w_out=3.4, w_in=2.5))
    sd.append(shoe([(C+fx_-2,92.5),(C+fx_+2,92.5),(C+fx_+2,99),(C+fx_-9,99)]))
sd.append(torso_svg('side-torso', C, 7.5, 6.2, 20.5, 54.5))
sd.append(limb_svg('side-neck', [(C-0.8,13),(C,20)], w_out=2.6, w_in=1.85))
sd.append(head_svg('side-head', C-1.2, 6.2, 5.8, facing=-1))
# 右前腕: 左腕の背後へ
sd.append(limb_svg('side-arm-r-fore', [(C-8.7,29.0),(C-15.0,32.2)]))
# 弓(楽器の背後・実測 tip/frog)
frogS = (C-16.2,32.9); tipS = (C-9.4,4.4)
sd.append(f'<line id="side-bow" x1="{F(frogS[0])}" y1="{F(frogS[1])}" x2="{F(tipS[0])}" y2="{F(tipS[1])}" stroke="{VIO2}" stroke-width="0.9" stroke-linecap="round"/>')
sd.append(f'<rect id="side-frog" x="{F(frogS[0]-0.8)}" y="{F(frogS[1]-0.2)}" width="1.6" height="2.2" fill="{HAIR}"/>')
# 楽器: 顎(C-3.5,15.7)→前方10°下がり L=36 幅0.62
t10 = math.radians(10)
chinS = (C-3.5,15.7); scrollS = (chinS[0]-36*math.cos(t10), chinS[1]+36*math.sin(t10))
vsvg2, MS, scrollS_c = violin_svg('side-violin', chinS, scrollS, 0.62)
sd.append(vsvg2)
# 左腕(楽器側)=手前
sd.append(limb_svg('side-arm-l-upper', [(C-2.2,22.3),(C-18.8,33.0)]))
sd.append(limb_svg('side-arm-l-fore',  [(C-18.8,33.0),(C-29.8,19.8)]))
lh2 = MS(0.80,0)
sd.append(f'<circle id="side-hand-l" cx="{F(lh2[0])}" cy="{F(lh2[1])}" r="1.5" fill="{FIGC}" stroke="{LINE}" stroke-width="0.5"/>')
# アンカー
sd.append(A('side','head',C-1.2,6.2))
sd.append(A('side','shoulder',C-2.2,22.3))
sd.append(A('side','elbow-l',C-18.8,33.0))
sd.append(A('side','scroll',*scrollS_c))
sd.append(A('side','hip',C,54.5))
sd.append(A('side','spine-top',C+8.5,6.0)); sd.append(A('side','spine-bottom',C+8.5,58.0))
sd.append(A('side','knee-front',C-2.4,72)); sd.append(A('side','ankle-front',C-3.0,93))
sd.append(f'<text x="{F(C)}" y="111" text-anchor="middle" font-size="5" fill="{LINE}">よこ</text>')
sd.append('<g id="side-markers"></g>')
sd.append('</g>')
svg += sd
svg.append('</svg>')

with open('zenshin.svg','w') as f: f.write('\n'.join(svg))

# 検証: SVG再パースでアンカー座標を突合(ゼロ差分)
import re
txt = open('zenshin.svg').read()
maxd = 0; n = 0
for m in re.finditer(r'id="anc-([a-z]+)-([a-z-]+)" cx="([\-\d.]+)" cy="([\-\d.]+)"', txt):
    key = f'{m.group(1)}-{m.group(2)}'
    gx,gy = float(m.group(3)), float(m.group(4))
    ex,ey = anchors[key]
    maxd = max(maxd, abs(gx-ex), abs(gy-ey)); n += 1
print(f'アンカー検証: {n}/{len(anchors)} 最大差分={maxd} → {"PASS" if maxd==0 and n==len(anchors) else "FAIL"}')
print('要素数: path=%d polygon=%d circle=%d' % (txt.count('<path'), txt.count('<polygon'), txt.count('<circle')))
print('マーカーコンテナ:', 'front-markers' in txt and 'side-markers' in txt)
