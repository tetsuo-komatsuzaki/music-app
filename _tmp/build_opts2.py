# 案2確定: アルコ5候補+紋章10パターンの選定ページ
import base64
import io
import os

SP = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
os.chdir(SP)


def v64(k):
    with open(f"rec/arco_{k}.webm", "rb") as f:
        return "data:video/webm;base64," + base64.b64encode(f.read()).decode()


ARCO = {
    "01C": ("指し示し", "つぎの目標を指すアルコ"),
    "05C": ("説明", "曲について語るアルコ"),
    "06B": ("称賛", "たたえるアルコ"),
    "08B": ("楽しむ", "うれしそうに楽しむアルコ"),
    "09A": ("挨拶・登場", "登場してあいさつするアルコ"),
}


def cert(k):
    kit, desc = ARCO[k]
    return (
        f'<div class="opt"><h3>{k} ・ {kit}</h3>'
        f'<div class="paper"><i class="f1"></i><i class="f2"></i>'
        f'<span class="arco"><video src="{v64(k)}" muted autoplay loop playsinline></video></span>'
        f'<div class="tx"><span class="b1">ARCODA</span><span class="b2">MASTER CERTIFICATE</span><i class="rule"></i>'
        f'<span class="pc">きらきら星</span><span class="st">★ ★ ★</span>'
        f'<span class="bd">この曲を なんども ていねいに 弾きこなしたことを<br>いちばん近くで 聴いてきた わたしが 証明します</span>'
        f'<span class="mt">認定日 2026.08.31 ・ CERT No.001</span></div>'
        f"</div><p>{desc}</p></div>\n"
    )


arco_opts = "".join(cert(k) for k in ARCO)

RANKS = [
    (1, "はじまりの奏者"), (2, "かけだしの奏者"), (3, "みならいの奏者"), (4, "見習いバイオリニスト"),
    (5, "一人前の奏者"), (6, "熟練の奏者"), (7, "名手"), (8, "達人"), (9, "巨匠"), (10, "マエストロ"),
]
emblems = ""
for n, name in RANKS:
    emblems += f'<div class="em e{n}"><div class="emShape"><span class="emStar">★</span></div><b>★{n}</b><span>{name}</span></div>\n'

css = """
* { margin:0; padding:0; box-sizing:border-box; }
:root { --bg:#0d1426; --sub:#8fa0c4; --gold:#e8b23c; --line:rgba(150,175,225,.18); }
body { background:var(--bg); color:#edf1fa; font-family:"Zen Kaku Gothic New","Hiragino Sans",sans-serif; padding:24px 14px 70px; }
.wrap { max-width:880px; margin:0 auto; }
h1 { font-size:17px; margin-bottom:4px; }
h2 { font-size:14px; color:var(--gold); margin:28px 0 10px; }
p.l { color:var(--sub); font-size:12.5px; line-height:1.9; margin-bottom:8px; }
.grid { display:flex; gap:16px; flex-wrap:wrap; justify-content:center; }
.opt { width:250px; }
.opt h3 { font-size:12px; color:var(--gold); margin:0 0 8px; }
.opt p { font-size:10.5px; color:var(--sub); line-height:1.7; margin-top:7px; }
.paper { position:relative; width:250px; height:400px; overflow:hidden; border-radius:6px;
  background:
    radial-gradient(ellipse 34% 20% at 8% 6%, rgba(126,92,38,.14), transparent 70%),
    radial-gradient(ellipse 32% 20% at 90% 92%, rgba(110,80,32,.12), transparent 70%),
    linear-gradient(168deg,#f8f1e0 0%,#f1e7cf 30%,#eee2c6 55%,#f3ead4 78%,#e9dcbc 100%);
  box-shadow:0 14px 30px rgba(0,0,0,.55); }
.f1 { position:absolute; inset:12px 10px; border:1.4px solid rgba(178,134,44,.92); }
.f2 { position:absolute; inset:17px 15px; border:.7px solid rgba(160,118,38,.8); }
.tx { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; text-align:center; padding-top:26px; z-index:3; }
.b1 { font-size:8px; letter-spacing:.44em; text-indent:.44em; font-weight:700; color:#7a5c22; }
.b2 { margin-top:7px; font-size:13px; letter-spacing:.14em; font-weight:900; color:#503a10; }
.rule { margin-top:8px; width:120px; border-top:1.4px solid rgba(178,134,44,.9); }
.pc { margin-top:12px; font-size:19px; font-weight:900; color:#33260a; white-space:nowrap; }
.st { margin-top:5px; font-size:11px; letter-spacing:.5em; text-indent:.5em; color:#b8902f; }
.bd { margin-top:10px; font-size:8.2px; line-height:2; color:#57431d; font-weight:500; }
.mt { margin-top:auto; margin-bottom:16px; font-size:7.5px; letter-spacing:.14em; color:#7a5c22; font-weight:700; }
.arco { position:absolute; z-index:2; left:50%; bottom:44px; width:112px; height:112px; transform:translateX(-50%);
  border-radius:50%; overflow:hidden; box-shadow:0 4px 12px rgba(90,62,10,.35), 0 0 0 2px rgba(178,134,44,.55); }
.arco video { width:100%; height:100%; object-fit:cover; display:block; }

.egrid { display:flex; gap:18px; flex-wrap:wrap; justify-content:center; }
.em { width:120px; text-align:center; }
.em b { display:block; margin-top:9px; font-size:12px; color:var(--gold); }
.em span { display:block; font-size:10px; color:var(--sub); margin-top:2px; }
.emShape { position:relative; width:96px; height:96px; margin:0 auto; display:grid; place-items:center; }
.emStar { position:relative; z-index:2; font-size:34px; font-weight:900; color:#eaf1ff;
  text-shadow:0 1px 0 rgba(255,255,255,.5), 0 -1px 2px rgba(8,14,36,.8), 0 0 14px rgba(140,175,255,.6); }
.emShape::before { content:""; position:absolute; inset:0; }
.emShape::after { content:""; position:absolute; }
.e1 .emShape::before { border-radius:50%;
  background:radial-gradient(circle at 36% 28%, #5578c4, #3d5da8 42%, #25406e 82%, #16264a);
  box-shadow:0 5px 12px rgba(20,35,70,.5), inset 0 2px 3px rgba(200,220,255,.4), inset 0 -3px 6px rgba(8,14,36,.7); }
.e2 .emShape::before { border-radius:50%;
  background:radial-gradient(circle at 36% 28%, #5578c4, #3d5da8 42%, #25406e 82%, #16264a);
  box-shadow:0 5px 12px rgba(20,35,70,.5), inset 0 2px 3px rgba(200,220,255,.4); }
.e2 .emShape::after { inset:10px; border-radius:50%; border:1.6px solid rgba(200,220,255,.6); }
.e3 .emShape::before { clip-path:polygon(50% 0,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%);
  background:linear-gradient(160deg,#5578c4,#3d5da8 45%,#1e335e); }
.e3 .emShape::after { inset:8px; clip-path:polygon(50% 0,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%);
  background:linear-gradient(160deg, rgba(200,220,255,.25), transparent 60%); }
.e4 .emShape::before { clip-path:polygon(0 0,100% 0,100% 62%,50% 100%,0 62%);
  background:linear-gradient(170deg,#4a6cb8,#2c4a86 55%,#182b52); }
.e4 .emShape::after { inset:8px; clip-path:polygon(0 0,100% 0,100% 62%,50% 100%,0 62%);
  background:linear-gradient(170deg, rgba(200,220,255,.22), transparent 55%); }
.e5 .emShape::before { clip-path:polygon(0 0,100% 0,100% 62%,50% 100%,0 62%);
  background:linear-gradient(170deg,#d7e2f2,#9fb4d4 18%,#2c4a86 40%,#182b52); }
.e5 .emShape::after { inset:7px; clip-path:polygon(0 0,100% 0,100% 62%,50% 100%,0 62%);
  background:linear-gradient(170deg,#4a6cb8,#2c4a86 55%,#182b52); }
.e5 .emStar { z-index:3; }
.e6 .emShape::before { clip-path:polygon(30% 0,70% 0,100% 30%,100% 70%,70% 100%,30% 100%,0 70%,0 30%);
  background:linear-gradient(160deg,#c99a35,#8a6a1a); }
.e6 .emShape::after { inset:4px; clip-path:polygon(30% 0,70% 0,100% 30%,100% 70%,70% 100%,30% 100%,0 70%,0 30%);
  background:linear-gradient(160deg,#2c4a86,#16264a); }
.e6 .emStar { z-index:3; }
.e7 .emShape::before { border-radius:50%;
  background:radial-gradient(circle at 36% 28%, #4a6cb8, #2c4a86 50%, #16264a);
  box-shadow:0 0 0 3px rgba(201,154,53,.75), 0 5px 12px rgba(20,35,70,.5); }
.e7 .emShape::after { left:-8px; right:-8px; top:-10px; height:54px;
  background:radial-gradient(ellipse 50% 100% at 50% 0%, transparent 54%, rgba(232,178,60,.85) 57%, transparent 70%); }
.e8 .emShape::before { border-radius:50%;
  background:radial-gradient(circle at 36% 28%, #3d5da8, #1e335e 60%, #101c38);
  box-shadow:0 0 0 2px #c99a35, 0 0 0 6px #16264a, 0 0 0 7.5px #e8b23c, 0 0 18px rgba(232,178,60,.45); }
.e8 .emStar { text-shadow:0 0 14px rgba(232,178,60,.8), 0 1px 0 rgba(255,255,255,.5); }
.e9 .emShape::before { clip-path:polygon(50% 0,61% 20%,82% 11%,79% 33%,100% 38%,86% 55%,98% 74%,76% 74%,69% 96%,50% 82%,31% 96%,24% 74%,2% 74%,14% 55%,0 38%,21% 33%,18% 11%,39% 20%);
  background:linear-gradient(160deg,#f2d48c,#c99a35 45%,#8a6a1a); }
.e9 .emShape::after { inset:14px; border-radius:50%;
  background:radial-gradient(circle at 36% 28%, #3d5da8, #1e335e 70%); }
.e9 .emStar { z-index:3; color:#fdf0c0; text-shadow:0 0 12px rgba(232,178,60,.9); }
.e10 .emShape::before { clip-path:polygon(50% 0,63% 16%,84% 6%,84% 28%,100% 34%,90% 55%,96% 78%,72% 78%,63% 98%,50% 86%,37% 98%,28% 78%,4% 78%,10% 55%,0 34%,16% 28%,16% 6%,37% 16%);
  background:conic-gradient(from 210deg,#8a6a1a,#f7dd9a 18%,#c99a35 36%,#8a6a1a 52%,#f0cd7c 66%,#a5761c 82%,#8a6a1a);
  box-shadow:0 0 22px rgba(232,178,60,.55); }
.e10 .emShape::after { inset:16px; border-radius:50%;
  background:radial-gradient(circle at 40% 30%, #ffe9ad, #d9a93c 60%, #a5761c); }
.e10 .emStar { z-index:3; color:#6e4e0e; text-shadow:0 1px 0 rgba(255,244,205,.9); }
"""

html = (
    "<title>賞状のアルコ差し込み 構成案</title>\n<style>" + css + "</style>\n"
    + '<div class="wrap">\n<h1>賞状のアルコ差し込み ・ 案2確定にともなう選定</h1>\n'
    + '<h2>A. アルコのモーション 5候補 (案2 封印の後継レイアウト・実動画ループ)</h2>\n'
    + '<p class="l">採用するモーションを1つ選んでください。証明書 (金) と認定証 (青) の両方に適用します。証明書と認定証で別のモーションにする指定も可能です。</p>\n'
    + '<div class="grid">\n' + arco_opts + '</div>\n'
    + '<h2>B. 称号カードの紋章 10パターン (★に応じて色と形が進化)</h2>\n'
    + '<p class="l">★1〜5は青の造形が育ち (円→内リング→六角→盾→銀縁の盾)、★6以降は金の格が加わり (金縁八角→金環+月桂樹→金二重リング→金の星形→全金の冠形)、マエストロで全金に到達。金=成果のみの配色ルールに適合しています。</p>\n'
    + '<div class="egrid">\n' + emblems + '</div>\n</div>\n'
)
io.open("arco-cert-options.html", "w", encoding="utf-8").write(html)
print("written", os.path.getsize("arco-cert-options.html"))
