# -*- coding: utf-8 -*-
"""
左手・左(からだの癖) 静止アセット生成
ソース: 確認済みプレビューHTML SVG① (ポジション移動モーション 1st→2nd)
変換: 全<animate*>除去、1stポジションのtranslateをtransform属性としてベイク、
      指1のリフト用opacityアニメを除去(全指押弦状態)、アンカー21点+markersコンテナ追加
"""
import re

txt = open('position_preview.html', encoding='utf-8').read()
svgs = re.findall(r'(<svg[^>]*>.*?</svg>)', txt, re.S)
s = svgs[0]

# 1) アニメーション除去
s_static = re.sub(r'<animateTransform[^>]*/>', '', s)
s_static = re.sub(r'<animate [^>]*/>', '', s_static)

# 2) 1stポジションtranslateをベイク
s_static = s_static.replace('<g id="fingers">', '<g id="fingers" transform="translate(-34,-1.69)">')
s_static = s_static.replace('<g id="hand-nut">', '<g id="hand-nut" transform="translate(-49,-2.54)">')

# 2.5) 前腕延長(★承認2026-08-11): 既存前腕側線ベクトルの機械延長 L=210
#   近位側線(576,514)→(689,627), 遠位側線(682,464)→(794,569)
#   延長端: 近位(837.5,775.5) 遠位(947.2,712.6) 幅109.6→126.4(肘側へ自然な広がり)
#   接合: 切断端から各側線に沿って14px内側から開始しオーバーラップ(継ぎ目の輪郭を掌ストロークが覆う)
forearm_fill = ('<path id="forearm-ext-fill" d="M 679.1,617.1 L 837.5,775.5 '
                'L 947.2,712.6 L 783.8,559.4 Z" fill="#F6CBA6"/>')
forearm_edge = ('<g id="forearm-ext-edge" stroke="#C98F5F" stroke-width="2.4" stroke-linecap="round">'
                '<line x1="689" y1="627" x2="837.5" y2="775.5"/>'
                '<line x1="794" y1="569" x2="947.2" y2="712.6"/>'
                '<line x1="837.5" y1="775.5" x2="947.2" y2="712.6"/></g>')
# 掌パス(stroke付き)の後ろに fill を先、edge を後で挿入(掌ストロークは接合部を覆えないため
# fillは掌パスの「前」= 掌が接合線を上書きする順にする)
# 掌パスの「後」に挿入: fillが旧手首端の輪郭(縫い目)を覆い、その上に側線を再描画
idx = s_static.find('<g id="hand-nut"')
palm_start = s_static.find('<path', idx)
palm_end = s_static.find('/>', palm_start) + 2
s_static = s_static[:palm_end] + forearm_fill + forearm_edge + s_static[palm_end:]

# 3) タイトル差し替え
s_static = re.sub(r'<title>[^<]*</title>', '<title>からだの癖: 左手・左(1stポジション)</title>', s_static)

# 4) アンカー + markersコンテナを</svg>直前に挿入
# 座標はベイク後(=表示座標)。導出根拠:
#   thumb: hand-nutパス親指先(397,322)+(-49,-2.54)
#   wrist: 手首縁中点((689+788)/2,(627+569)/2)+(-49,-2.54)
#   knuckle: fingersナックル上弧端(414,259)/(604,258)+(-34,-1.69)
#   finger1-4: 爪rect中心(426,276)(488,276)(554,276)(599,276)+(-34,-1.69)
#   nut: ナット中心((334+351)/2,(291+341)/2)
#   neck-bottom: ネック下縁の掌上x=500での補間 y=365+(383-365)*(500-345)/(692-345)*0.45→373
anchors = {
    'thumb':        (348.0, 319.5),
    'wrist-mid':    (689.5, 595.5),
    'forearm-dir':  (843.35, 741.52),  # 前腕延長端中点(=肘側端)
    'knuckle-l':    (380.0, 257.3),
    'knuckle-r':    (570.0, 256.3),
    'finger-1':     (392.0, 274.3),
    'finger-2':     (454.0, 274.3),
    'finger-3':     (520.0, 274.3),
    'finger-4':     (565.0, 274.3),
    'elbow-end':    (843.35, 741.52),
    'nut':          (342.5, 316.0),
    'palm-neck':    (500.0, 378.0),
}
anc_svg = ''.join(f'<circle id="anc-lhl-{k}" cx="{x}" cy="{y}" r="0" fill="none"/>' for k,(x,y) in anchors.items())
s_static = s_static.replace('</svg>', anc_svg + '<g id="lhl-markers"></g></svg>')

open('hidarite_hidari.svg','w',encoding='utf-8').write(s_static)

# 検証
out = open('hidarite_hidari.svg',encoding='utf-8').read()
n_anim = len(re.findall(r'<animate', out))
n_anc = len(re.findall(r'id="anc-lhl-', out))
baked = ('translate(-49,-2.54)' in out) and ('translate(-34,-1.69)' in out)
print(f'animate残存: {n_anim} (期待0) / アンカー: {n_anc}/{len(anchors)} / ベイク: {baked}')
print('markersコンテナ:', 'lhl-markers' in out)
print('PASS' if n_anim==0 and n_anc==len(anchors) and baked else 'FAIL')
