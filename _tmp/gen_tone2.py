# -*- coding: utf-8 -*-
import io, os
SP = os.environ.get("SP")

CHAP_ABOVE = """<div class="chap"><div class="kick">SKILLS</div><div class="ttl">わざの習得状況</div>
        <div class="catRow"><span class="catLab">弓</span><span class="catBar"><i style="width:25%"></i></span><span class="catN">2 / 8</span></div>
        <div class="catRow"><span class="catLab">フィンガリング</span><span class="catBar"><i style="width:50%"></i></span><span class="catN">1 / 2</span></div>
        <a class="chapLink" href="#">技術マップへ</a></div>"""
CHAP_BELOW = """<div class="chap"><div class="kick">CARDS</div><div class="ttl">カードアルバム</div>
        <div class="copy">あつめたカード 3 / 10</div></div>"""

CASES = [
    ("1", "無彩色のグレー", "青みを抜いた灰にする", "toneGray", [
        ("g", "青の一族から外れるので、章が休んでいると分かりやすい"),
        ("g", "灰は状態の色で、分類の色ではない ・ 配色ルールと衝突しない"),
        ("b", "冷たい ・ 完全に切り離されたようにも見える"),
    ]),
    ("2", "紙のような明るい面", "暗くするのではなく、明るく抜く", "tonePaper", [
        ("g", "空白の紙に見える ・ これから書き込まれる感じが出る"),
        ("g", "暗い帯ができないので、シートの継ぎ目が目立たない"),
        ("b", "明るい面は普通は使える場所の合図 ・ 逆に目立つ"),
    ]),
    ("3", "文字だけ ・ 面を持たない", "地も枠も置かない", "toneBare", [
        ("g", "いちばん静か ・ 余白として読める"),
        ("g", "色を1つも増やさない"),
        ("b", "見落とされやすい ・ 章が抜けているようにも見える"),
    ]),
    ("4", "斜めのハッチ", "工事中の面として示す", "toneHatch", [
        ("g", "面が塞がっていることが記号で伝わる"),
        ("g", "破線と違い、データ待ちとは読まれない"),
        ("b", "工事中の比喩が子どもの画面に合うかは好み"),
    ]),
]

body = ""
for (n, title, tag, cls, crit) in CASES:
    dl = "".join(f'<dt class="{k}">{v}</dt>' for k, v in crit)
    body += f"""
<div class="case">
  <div class="head"><span class="num">案{n}</span><h3>{title}</h3><span class="tag">{tag}</span></div>
  <div class="body">
    <div class="sheet">
      {CHAP_ABOVE}
      <div class="rule"></div>
      <div class="chap {cls}">
        <div class="kick">ESPRESSIONE</div><div class="ttl">表現の習得状況</div>
        <div class="soonRow">この機能はこれから追加します。</div>
      </div>
      <div class="rule"></div>
      {CHAP_BELOW}
    </div>
    <dl>{dl}</dl>
  </div>
</div>"""

html = """<title>これから追加します の面</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700;900&display=swap">
<style>
:root{
  --ink:#0a1526; --panel:#12203a; --line:rgba(150,175,225,.16);
  --text:#eaf0fb; --sub:#9db0d0; --dim:#6e83a8; --faint:#4b5f82;
  --blue2:#3f74e0; --gold:#E0A73C; --warm:#e08e64; --card-b:#15233f;
}
*{box-sizing:border-box}
body{margin:0;background:var(--ink);color:var(--text);
  font-family:"Zen Kaku Gothic New","Hiragino Kaku Gothic ProN",system-ui,sans-serif;
  font-size:15px;line-height:1.7;-webkit-font-smoothing:antialiased}
.wrap{max-width:1140px;margin:0 auto;padding:34px 20px 80px}
h1{font-size:27px;font-weight:900;margin:0 0 6px}
.lead{color:var(--sub);margin:0 0 26px;max-width:68ch}
h2{font-size:13.5px;font-weight:700;color:var(--dim);letter-spacing:.15em;
  margin:42px 0 14px;padding-bottom:8px;border-bottom:1px solid var(--line)}
.case{margin:0 0 26px;background:var(--panel);border:1px solid var(--line);border-radius:20px;overflow:hidden}
.head{display:flex;align-items:baseline;gap:12px;padding:14px 20px;border-bottom:1px solid var(--line);
  background:rgba(43,91,196,.08)}
.num{font-size:12px;font-weight:900;letter-spacing:.16em;color:var(--blue2)}
.head h3{font-size:18px;font-weight:900;margin:0}
.head .tag{margin-left:auto;font-size:12px;color:var(--dim)}
.body{display:grid;grid-template-columns:minmax(280px,368px) 1fr;gap:26px;padding:20px}
@media(max-width:780px){.body{grid-template-columns:1fr}}
dl{margin:0}
dt{font-weight:700;font-size:13.5px;margin-top:12px}
dt:first-child{margin-top:0}
dt.g::before{content:"よい ";color:var(--gold);font-size:11px;letter-spacing:.1em}
dt.b::before{content:"よわい ";color:var(--warm);font-size:11px;letter-spacing:.1em}

.sheet{background:var(--card-b);border:1px solid var(--line);border-radius:18px;overflow:hidden}
.rule{height:1px;background:var(--line)}
.chap{padding:18px 16px 16px}
.kick{font-size:9.5px;font-weight:900;letter-spacing:.16em;color:var(--dim)}
.ttl{font-size:15px;font-weight:900;margin:1px 0 9px}
.copy{font-size:12.5px;color:var(--sub);line-height:1.8}
.catRow{display:flex;align-items:center;gap:9px;margin-top:6px}
.catLab{width:92px;flex:none;font-size:11.5px;color:var(--sub)}
.catBar{flex:1;height:6px;border-radius:4px;background:#16233d;overflow:hidden}
.catBar i{display:block;height:100%;border-radius:4px;background:var(--gold)}
.catN{width:42px;text-align:right;font-size:11px;color:var(--sub);font-variant-numeric:tabular-nums}
.chapLink{display:block;margin-top:9px;text-align:center;font-size:11.5px;font-weight:700;
  color:#a8c2ff;text-decoration:none;padding:7px;border:1px solid var(--line);border-radius:9px}
.soonRow{font-size:12.5px}

/* 案1 無彩色のグレー */
.toneGray{background:#22242a}
.toneGray .kick{color:#7c8088}
.toneGray .ttl{color:#a8adb6}
.toneGray .soonRow{color:#8d929b}

/* 案2 紙のような明るい面 */
.tonePaper{background:#e9e6df}
.tonePaper .kick{color:#8d887e}
.tonePaper .ttl{color:#3c3a35}
.tonePaper .soonRow{color:#6a655c}

/* 案3 文字だけ */
.toneBare{background:transparent}
.toneBare .kick{color:var(--faint)}
.toneBare .ttl{color:var(--faint)}
.toneBare .soonRow{color:var(--faint)}

/* 案4 斜めのハッチ */
.toneHatch{background:
  repeating-linear-gradient(135deg, rgba(140,146,158,.07) 0 7px, transparent 7px 15px), #1a1d24}
.toneHatch .kick{color:#7c8088}
.toneHatch .ttl{color:#a8adb6}
.toneHatch .soonRow{color:#8d929b}

.note{color:var(--sub);font-size:13.5px;margin:12px 0 0;max-width:76ch}
.verdictBox{margin-top:30px;padding:18px 20px;border-radius:16px;
  background:linear-gradient(135deg,rgba(224,167,60,.12),rgba(224,167,60,.03));
  border:1px solid rgba(224,167,60,.34)}
.verdictBox h3{margin:0 0 8px;font-size:16px;font-weight:900;color:var(--gold)}
.verdictBox p{margin:0 0 8px;color:var(--sub);font-size:14px}
.verdictBox p:last-child{margin-bottom:0}
.verdictBox b{color:var(--text)}
</style>

<div class="wrap">
<h1>これから追加します の面</h1>
<p class="lead">青のトーンで沈めるのをやめ、面そのものを変えた4案です。文言は<b>この機能はこれから追加します。</b>の一行だけ。上下にわざの章とカードアルバムを置いて、周りとの違いが見えるようにしています。</p>

<h2>4案</h2>
__BODY__

<div class="verdictBox">
<h3>おすすめ</h3>
<p><b>案1 無彩色のグレー</b>。アプリは全体が青の一族なので、青みを抜くだけで「ここは別の状態」と伝わります。色は増えず、灰は分類ではなく状態を表す色なので、配色ルールとも衝突しません。</p>
<p><b>案4 斜めのハッチ</b>も候補です。面が塞がっていることが記号で分かり、破線と違ってデータ待ちとは読まれません。ただ工事中の比喩がアプリの雰囲気に合うかは好みが分かれます。</p>
<p><b>案2 紙</b>は明るすぎて、かえって目を引きます。<b>案3 文字だけ</b>は静かですが、章が抜けているようにも見えます。</p>
</div>
<p class="note">案1で決まれば、灰の濃さは実機で詰めます。いまは #22242a を置いています。</p>
</div>
"""
html = html.replace("__BODY__", body)
out = os.path.join(SP, "teaser-face.html")
io.open(out, "w", encoding="utf-8").write(html)
print(out, round(len(html) / 1024, 1), "KB")
