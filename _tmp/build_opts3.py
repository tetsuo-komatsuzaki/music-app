# 選定ページ v3: アルコ追加候補13種 + 紋章v2 (高級金属仕上げ10種)
import base64
import io
import os

SP = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
os.chdir(SP)


def v64(k):
    with open(f"rec/arco_{k}.webm", "rb") as f:
        return "data:video/webm;base64," + base64.b64encode(f.read()).decode()


CAND = [
    ("01A", "指し示し ・ 正面から指す"),
    ("01B", "指し示し ・ ふりむいて指す"),
    ("02A", "喜び ・ 両手を上げてジャンプ"),
    ("02B", "喜び ・ ダブルガッツポーズ"),
    ("02C", "喜び ・ 両手ほっぺ"),
    ("03A", "応援 ・ がんばれの旗ふり"),
    ("03B", "応援 ・ こぶしをふる"),
    ("03C", "応援 ・ 拍手でこたえる"),
    ("06A", "称賛 ・ 拍手"),
    ("08A", "楽しむ ・ 音楽にゆれる"),
    ("08C", "楽しむ ・ うっとり聴き入る"),
    ("09B", "挨拶 ・ おじぎ"),
    ("09C", "挨拶 ・ 手をふる"),
]

cands = ""
for k, desc in CAND:
    cands += (
        f'<div class="cd"><span class="ring"><video src="{v64(k)}" muted autoplay loop playsinline></video></span>'
        f"<b>{k}</b><span>{desc}</span></div>\n"
    )

RANKS = [
    (1, "はじまりの奏者"), (2, "かけだしの奏者"), (3, "みならいの奏者"), (4, "見習いバイオリニスト"),
    (5, "一人前の奏者"), (6, "熟練の奏者"), (7, "名手"), (8, "達人"), (9, "巨匠"), (10, "マエストロ"),
]
emblems = ""
for n, name in RANKS:
    leaves = ""
    if n == 10:
        leaves += '<i class="burst"></i>'
    if n == 9:
        leaves += '<i class="crown small"></i>'
    if n == 10:
        leaves += '<i class="crown big"></i>'
    emblems += (
        f'<div class="em e{n}"><div class="shape">'
        f'<i class="edge"></i><i class="rim"></i><i class="face"></i>{leaves}'
        f'<span class="star">★</span></div><b>★{n}</b><span>{name}</span></div>\n'
    )

css = """
* { margin:0; padding:0; box-sizing:border-box; }
:root { --bg:#0d1426; --sub:#8fa0c4; --gold:#e8b23c; --line:rgba(150,175,225,.18); }
body { background:var(--bg); color:#edf1fa; font-family:"Zen Kaku Gothic New","Hiragino Sans",sans-serif; padding:24px 14px 70px; }
.wrap { max-width:900px; margin:0 auto; }
h1 { font-size:17px; margin-bottom:4px; }
h2 { font-size:14px; color:var(--gold); margin:28px 0 10px; }
p.l { color:var(--sub); font-size:12.5px; line-height:1.9; margin-bottom:8px; }
.cgrid { display:flex; gap:16px; flex-wrap:wrap; justify-content:center; }
.cd { width:132px; text-align:center; }
.cd .ring { display:block; width:118px; height:118px; margin:0 auto; border-radius:50%; overflow:hidden;
  box-shadow:0 4px 12px rgba(0,0,0,.45), 0 0 0 2px rgba(178,134,44,.55); background:#f4efe2; }
.cd video { width:100%; height:100%; object-fit:cover; display:block; }
.cd b { display:block; margin-top:8px; font-size:11.5px; color:var(--gold); }
.cd span { display:block; font-size:10px; color:var(--sub); margin-top:2px; line-height:1.6; }

/* ── 紋章 v2: メダル級の金属仕上げ ── */
.egrid { display:flex; gap:20px; flex-wrap:wrap; justify-content:center; }
.em { width:126px; text-align:center; }
.em > b { display:block; margin-top:10px; font-size:12px; color:var(--gold); }
.em > span { display:block; font-size:10px; color:var(--sub); margin-top:2px; }
.shape { position:relative; width:104px; height:104px; margin:22px auto 0; display:grid; place-items:center;
  filter:drop-shadow(0 6px 10px rgba(0,0,0,.5)); }
.edge, .rim, .face { position:absolute; border-radius:50%; }
.edge { inset:0; background:repeating-conic-gradient(#1c2f5c 0deg 3deg, #4a6cb8 3deg 6deg);
  box-shadow:0 4px 8px rgba(8,14,36,.6); }
.rim { inset:5%; background:conic-gradient(from 210deg,#223a70,#7a9ade 18%,#3d5da8 34%,#22345f 50%,#6b90d8 66%,#2c4a86 82%,#223a70);
  box-shadow:inset 0 2px 3px rgba(210,226,255,.9), inset 0 -3px 5px rgba(8,14,36,.8); }
.face { inset:14%; background:radial-gradient(circle at 36% 28%, #5c80cc, #3d5da8 46%, #22345f 82%, #131f3e);
  box-shadow:inset 0 3px 6px rgba(200,220,255,.45), inset 0 -4px 7px rgba(5,10,26,.8); }
.face::before { content:""; position:absolute; inset:6%; border-radius:50%; opacity:.5;
  background:repeating-conic-gradient(transparent 0deg 8deg, rgba(200,220,255,.18) 8deg 9deg);
  -webkit-mask:radial-gradient(circle, transparent 58%, #000 60%, #000 82%, transparent 84%);
          mask:radial-gradient(circle, transparent 58%, #000 60%, #000 82%, transparent 84%); }
.face::after { content:""; position:absolute; inset:0; border-radius:50%; mix-blend-mode:screen;
  background:conic-gradient(from 215deg, rgba(255,255,255,.2), transparent 22%, rgba(255,255,255,.07) 48%, transparent 74%, rgba(255,255,255,.2)); }
.star { position:relative; z-index:3; font-size:34px; font-weight:900; color:#eaf1ff;
  text-shadow:0 1.5px 0 rgba(255,255,255,.55), 0 -1.5px 2px rgba(5,10,26,.9), 0 0 16px rgba(140,175,255,.7); }
.lv { position:absolute; z-index:2; width:15px; height:6px; border-radius:60% 60% 60% 0;
  background:linear-gradient(135deg,#f2d48c,#c99a35 60%,#8a6a1a);
  box-shadow:0 1px 1px rgba(60,40,4,.5), inset 0 1px 0 rgba(255,244,205,.7); }
.l1 { left:6px; bottom:24px; transform:rotate(58deg); }
.l2 { left:3px; bottom:44px; transform:rotate(28deg); }
.l3 { left:11px; bottom:63px; transform:rotate(-4deg); }
.l4 { right:6px; bottom:24px; transform:scaleX(-1) rotate(58deg); }
.l5 { right:3px; bottom:44px; transform:scaleX(-1) rotate(28deg); }
.l6 { right:11px; bottom:63px; transform:scaleX(-1) rotate(-4deg); }

/* 金の月桂樹リース (★8以上・盤の両脇を包む) */
.lv.g1 { left:-7px; bottom:16px; transform:rotate(64deg); }
.lv.g2 { left:-11px; bottom:36px; transform:rotate(38deg); }
.lv.g3 { left:-8px; bottom:56px; transform:rotate(16deg); }
.lv.g4 { left:1px; bottom:74px; transform:rotate(-10deg); }
.lv.g5 { right:-7px; bottom:16px; transform:scaleX(-1) rotate(64deg); }
.lv.g6 { right:-11px; bottom:36px; transform:scaleX(-1) rotate(38deg); }
.lv.g7 { right:-8px; bottom:56px; transform:scaleX(-1) rotate(16deg); }
.lv.g8 { right:1px; bottom:74px; transform:scaleX(-1) rotate(-10deg); }
.e8 .lv, .e9 .lv, .e10 .lv { width:19px; height:8px; }

/* 王冠 (★9=小冠 / ★10=大冠+宝石) */
.crown { position:absolute; z-index:4; left:50%; transform:translateX(-50%); }
.crown.small { top:-13px; width:44px; height:22px;
  clip-path:polygon(0 100%, 0 34%, 18% 58%, 34% 8%, 50% 48%, 66% 8%, 82% 58%, 100% 34%, 100% 100%);
  background:linear-gradient(180deg,#fdf0c0,#e8b23c 55%,#a5761c);
  box-shadow:inset 0 -2px 3px rgba(90,62,10,.6); filter:drop-shadow(0 2px 3px rgba(60,40,4,.5)); }
.crown.big { top:-22px; width:62px; height:32px;
  clip-path:polygon(0 100%, 0 26%, 14% 52%, 27% 4%, 40% 46%, 50% 0, 60% 46%, 73% 4%, 86% 52%, 100% 26%, 100% 100%);
  background:linear-gradient(180deg,#fff6d8,#f0c35c 45%,#c99a35 78%,#8a6a1a);
  box-shadow:inset 0 -3px 4px rgba(90,62,10,.65), inset 0 2px 2px rgba(255,250,225,.9);
  filter:drop-shadow(0 2px 5px rgba(60,40,4,.55)) drop-shadow(0 0 10px rgba(232,178,60,.6)); }
.crown.big::after { content:""; position:absolute; left:50%; top:54%; width:7px; height:7px; border-radius:50%;
  transform:translateX(-50%);
  background:radial-gradient(circle at 35% 30%, #ffffff, #f4f8fd 45%, #aebbd0);
  box-shadow:-17px 4px 0 -1.5px #fff, 17px 4px 0 -1.5px #fff; }

/* 放射バースト (★10の後光・回転) */
.burst { position:absolute; inset:-16px; border-radius:50%; z-index:0;
  background:repeating-conic-gradient(rgba(240,205,124,.5) 0deg 5deg, transparent 5deg 14deg);
  -webkit-mask:radial-gradient(circle, transparent 40%, #000 44%, transparent 74%);
          mask:radial-gradient(circle, transparent 40%, #000 44%, transparent 74%);
  animation:burstSpin 14s linear infinite; }
@keyframes burstSpin { to { transform:rotate(360deg); } }

/* 段階グロー (2026-08-31: 光は10段で滑らかに強くなる。色は段の金属色) */
.e1 .shape { filter:drop-shadow(0 6px 10px rgba(0,0,0,.5)); }
.e2 .shape { filter:drop-shadow(0 6px 10px rgba(0,0,0,.5)) drop-shadow(0 0 6px rgba(110,155,240,.45)); }
.e3 .shape { filter:drop-shadow(0 6px 10px rgba(0,0,0,.5)) drop-shadow(0 0 13px rgba(130,170,255,.8)); }
.e4 .shape { filter:drop-shadow(0 6px 10px rgba(0,0,0,.5)) drop-shadow(0 0 4px rgba(200,210,225,.3)); }
.e5 .shape { filter:drop-shadow(0 6px 10px rgba(0,0,0,.5)) drop-shadow(0 0 8px rgba(215,224,236,.5)); }
.e6 .shape { filter:drop-shadow(0 6px 10px rgba(0,0,0,.5)) drop-shadow(0 0 12px rgba(225,235,250,.6)); }
.e7 .shape { filter:drop-shadow(0 6px 10px rgba(0,0,0,.5)) drop-shadow(0 0 16px rgba(240,246,255,.75)); }
.e8 .shape { filter:drop-shadow(0 6px 10px rgba(0,0,0,.5)) drop-shadow(0 0 12px rgba(232,178,60,.55)); }
.e9 .shape { filter:drop-shadow(0 6px 10px rgba(0,0,0,.5)) drop-shadow(0 0 18px rgba(232,178,60,.75)); }
.e10 .shape { filter:drop-shadow(0 6px 10px rgba(0,0,0,.5)) drop-shadow(0 0 26px rgba(240,205,124,.95)); }

/* 段階差分 (2026-08-31 v4: 青1-3は明暗3段 → 銀4-7は銀4段 → 金8-10) */
.e1 .edge { background:repeating-conic-gradient(#131f3e 0deg 3deg, #35508e 3deg 6deg); }
.e1 .rim { background:conic-gradient(from 210deg,#182849,#4a6cb8 18%,#2c4a86 34%,#16264a 50%,#3d5da8 66%,#1e335e 82%,#182849); }
.e1 .face { background:radial-gradient(circle at 36% 28%, #4062ae, #2c4a86 46%, #182b52 82%, #0c1730); }
.e1 .star { text-shadow:0 1.5px 0 rgba(255,255,255,.4), 0 -1.5px 2px rgba(5,10,26,.9); }
.e2 .face::before { opacity:.75; }
.e3 .edge { background:repeating-conic-gradient(#1c2f5c 0deg 3deg, #7aa0e4 3deg 6deg); }
.e3 .rim { background:conic-gradient(from 210deg,#2c4a86,#9ab8ee 18%,#4a6cb8 34%,#26406e 50%,#88a8e8 66%,#35508e 82%,#2c4a86); }
.e3 .face { background:radial-gradient(circle at 36% 28%, #7a9ade, #4a6cb8 46%, #2c4a86 82%, #1a2c54); }
.e3 .star { text-shadow:0 1.5px 0 #fff, 0 -1.5px 2px rgba(5,10,26,.9), 0 0 18px rgba(150,185,255,.95); }
/* 4-7: 銀の4段階 (くもった銀→標準の銀→磨かれた銀→輝く白銀) */
.e4 .edge { background:repeating-conic-gradient(#565e6c 0deg 3deg, #aab3c2 3deg 6deg); }
.e4 .rim { background:conic-gradient(from 210deg,#767f8e,#c4ccd8 18%,#929cac 34%,#5c6574 50%,#bcc4d0 66%,#7d8695 82%,#767f8e); }
.e4 .face { background:radial-gradient(circle at 36% 28%, #ccd3dd, #a2abba 44%, #79828f 80%, #565e6c);
  box-shadow:inset 0 3px 6px rgba(240,244,250,.7), inset 0 -4px 7px rgba(52,58,68,.6); }
.e4 .face::before { background:repeating-conic-gradient(transparent 0deg 8deg, rgba(86,94,108,.3) 8deg 9deg); }
.e4 .star { color:#525b6a; text-shadow:0 1.5px 0 rgba(255,255,255,.8), 0 -1px 1px rgba(46,52,62,.6); }
.e5 .edge { background:repeating-conic-gradient(#5a6474 0deg 3deg, #c5cedb 3deg 6deg); }
.e5 .rim { background:conic-gradient(from 210deg,#828da0,#dbe2ec 18%,#a2adbe 34%,#65707f 50%,#d2dae6 66%,#8b96a8 82%,#828da0);
  box-shadow:inset 0 2px 3px rgba(255,255,255,.85), inset 0 -3px 5px rgba(46,52,62,.65); }
.e5 .face { background:radial-gradient(circle at 36% 28%, #dde3eb, #b4bdcb 43%, #8791a1 80%, #5f6979);
  box-shadow:inset 0 3px 6px rgba(248,250,253,.8), inset 0 -4px 7px rgba(50,56,66,.6); }
.e5 .face::before { background:repeating-conic-gradient(transparent 0deg 8deg, rgba(90,100,116,.3) 8deg 9deg); }
.e5 .star { color:#4e5866; text-shadow:0 1.5px 0 rgba(255,255,255,.85), 0 -1px 1px rgba(44,50,60,.6), 0 0 6px rgba(220,228,240,.5); }
/* 6-7: 全銀 (紺のfaceをやめ銀の盤面に) */
.e6 .edge { background:repeating-conic-gradient(#5a6784 0deg 3deg, #eef2f9 3deg 6deg); }
.e6 .rim { background:conic-gradient(from 210deg,#8a97b2,#f4f7fc 18%,#aebfd8 34%,#66748f 50%,#eef3fa 66%,#8f9db8 82%,#8a97b2);
  box-shadow:inset 0 2px 3px #fff, inset 0 -3px 5px rgba(40,48,66,.7); }
.e6 .face { background:radial-gradient(circle at 36% 28%, #eef2f9, #c2cddf 42%, #8a97b2 80%, #5f6d8a);
  box-shadow:inset 0 3px 6px rgba(255,255,255,.85), inset 0 -4px 7px rgba(50,60,84,.6); }
.e6 .face::before { background:repeating-conic-gradient(transparent 0deg 8deg, rgba(95,109,138,.3) 8deg 9deg); }
.e6 .star { color:#4c5a76; text-shadow:0 1.5px 0 rgba(255,255,255,.9), 0 -1px 1px rgba(40,48,66,.6), 0 0 10px rgba(220,230,245,.8); }
.e7 .edge { background:repeating-conic-gradient(#5a6784 0deg 3deg, #f6f9fd 3deg 6deg); }
.e7 .rim { background:conic-gradient(from 210deg,#98a5be,#ffffff 18%,#bcc9dc 34%,#6d7b96 50%,#f7fafd 66%,#98a5be 82%,#98a5be);
  box-shadow:inset 0 2px 3px #fff, inset 0 -3px 5px rgba(40,48,66,.7) }
.e7 .face { background:radial-gradient(circle at 36% 28%, #f4f8fd, #ccd6e6 42%, #97a4bd 80%, #66748f);
  box-shadow:inset 0 3px 6px rgba(255,255,255,.9), inset 0 -4px 7px rgba(50,60,84,.6); }
.e7 .face::before { background:repeating-conic-gradient(transparent 0deg 8deg, rgba(95,109,138,.32) 8deg 9deg); }
.e7 .star { color:#4c5a76; text-shadow:0 1.5px 0 #fff, 0 -1px 1px rgba(40,48,66,.6), 0 0 12px rgba(230,240,252,.95); }
.e7 .lv { background:linear-gradient(135deg,#f4f8fd,#aebbd0 60%,#77869f); box-shadow:0 1px 1px rgba(50,60,84,.5), inset 0 1px 0 #fff; }
/* 8-9: 金一色 (紺なし) */
.e8 .edge { background:repeating-conic-gradient(#8a6a1a 0deg 2.4deg, #f0cd7c 2.4deg 4.8deg); }
.e8 .rim { background:conic-gradient(from 210deg,#8a6a1a,#f7dd9a 18%,#c99a35 32%,#8a6a1a 48%,#f0cd7c 62%,#a5761c 78%,#8a6a1a); }
.e8 .face { background:radial-gradient(circle at 38% 28%, #ffedb6, #f0c35c 44%, #d9a93c 72%, #a5761c);
  box-shadow:inset 0 3px 6px rgba(255,246,214,.85), inset 0 -4px 7px rgba(90,62,10,.65); }
.e8 .face::before { background:repeating-conic-gradient(transparent 0deg 8deg, rgba(138,106,26,.32) 8deg 9deg); }
.e8 .star { color:#7a5a12; text-shadow:0 1.5px 0 rgba(255,246,214,.95), 0 -1px 1px rgba(74,50,4,.6), 0 0 12px rgba(255,236,170,.7); }
.e9 .edge { background:repeating-conic-gradient(#8a6a1a 0deg 2.4deg, #f7dd9a 2.4deg 4.8deg); }
.e9 .rim { background:conic-gradient(from 210deg,#8a6a1a,#fdf0c0 18%,#c99a35 32%,#8a6a1a 48%,#f7dd9a 62%,#a5761c 78%,#8a6a1a); }
.e9 .face { background:radial-gradient(circle at 38% 28%, #fff3c9, #f3c65f 42%, #dca432 70%, #a5761c);
  box-shadow:inset 0 3px 6px rgba(255,250,225,.9), inset 0 -4px 7px rgba(90,62,10,.7); }
.e9 .face::before { background:repeating-conic-gradient(transparent 0deg 8deg, rgba(138,106,26,.35) 8deg 9deg); }
.e9 .star { color:#6e4e0e; text-shadow:0 1.5px 0 rgba(255,250,225,.95), 0 -1px 1px rgba(74,50,4,.7), 0 0 16px rgba(255,236,170,.95); }
.e10 .edge { background:repeating-conic-gradient(#8a6a1a 0deg 2.4deg, #f7dd9a 2.4deg 4.8deg); box-shadow:0 0 24px rgba(232,178,60,.7); }
.e10 .rim { background:conic-gradient(from 210deg,#8a6a1a,#f7dd9a 18%,#c99a35 32%,#8a6a1a 48%,#f0cd7c 62%,#a5761c 78%,#8a6a1a); }
.e10 .face { background:radial-gradient(circle at 40% 30%, #ffe9ad, #f0c35c 38%, #d9a93c 66%, #a5761c);
  box-shadow:inset 0 3px 6px rgba(255,246,214,.8), inset 0 -4px 7px rgba(90,62,10,.7); }
.e10 .face::before { background:repeating-conic-gradient(transparent 0deg 8deg, rgba(138,106,26,.35) 8deg 9deg); }
.e10 .star { color:#6e4e0e; font-size:38px; text-shadow:0 1.5px 0 rgba(255,246,214,.95), 0 -1px 1px rgba(74,50,4,.7), 0 0 10px rgba(255,236,170,.8); }
"""

html = (
    "<title>賞状のアルコ差し込み 構成案</title>\n<style>" + css + "</style>\n"
    + '<div class="wrap">\n<h1>アルコの追加候補と 紋章の高級版</h1>\n'
    + '<p class="l">アルコのランダムプールは全18種で実装済み (授与のたびにランダム)。紋章はv3=青→銀→金の段位制に改定 (金と紺の混在なし)。</p>\n'
    + '<h2>A. ランダムプール 全18種 (13種すべて採用済み・実装完了)</h2>\n'
    + '<div class="cgrid">\n' + cands + '</div>\n'
    + '<h2>B. 称号カードの紋章 v3 ・ 青→銀→金の段位制 (★1〜10)</h2>\n'
    + '<p class="l">ギザ縁+金属リム+彫刻リング+光沢の4層構造。光の強さも10段で階段状に増加。★1〜3=青の明暗3段、★4〜7=銀の4段階、★8=金一色、★9=金+小さな王冠、★10=全金+大王冠 (白宝石3つ) +回転する後光。</p>\n'
    + '<div class="egrid">\n' + emblems + '</div>\n</div>\n'
)
io.open("arco-cert-options.html", "w", encoding="utf-8").write(html)
print("written", os.path.getsize("arco-cert-options.html"))
