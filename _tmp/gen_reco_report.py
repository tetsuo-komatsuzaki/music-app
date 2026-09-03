# -*- coding: utf-8 -*-
import base64, io, os
SP = os.environ.get("SP")

def b64(p):
    return "data:image/png;base64," + base64.b64encode(open(p, "rb").read()).decode()

# r1=曲詳細(枠) r3=ホーム(枠) r5=わざ詳細(枠) r6? 実際は section>div:last-child が6個
IMG = {k: b64(f"_tmp/r{i}.png") for k, i in [("perf", 1), ("home", 3), ("skill", 5), ("full", 6)]}

html = """<title>3つの推薦の並べくらべ</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700;900&display=swap">
<style>
:root{ --ink:#0a1526; --panel:#12203a; --line:rgba(150,175,225,.16); --text:#eaf0fb;
  --sub:#9db0d0; --dim:#6e83a8; --blue2:#3f74e0; --gold:#E0A73C; --warm:#e08e64; }
*{box-sizing:border-box}
body{margin:0;background:var(--ink);color:var(--text);
  font-family:"Zen Kaku Gothic New","Hiragino Kaku Gothic ProN",system-ui,sans-serif;
  font-size:15px;line-height:1.75;-webkit-font-smoothing:antialiased}
.wrap{max-width:1120px;margin:0 auto;padding:34px 20px 84px}
h1{font-size:27px;font-weight:900;margin:0 0 6px}
.lead{color:var(--sub);margin:0 0 26px;max-width:70ch}
h2{font-size:13.5px;font-weight:700;color:var(--dim);letter-spacing:.15em;
  margin:42px 0 14px;padding-bottom:8px;border-bottom:1px solid var(--line)}
.case{margin:0 0 26px;background:var(--panel);border:1px solid var(--line);border-radius:20px;overflow:hidden}
.head{display:flex;align-items:baseline;gap:12px;padding:14px 20px;border-bottom:1px solid var(--line);
  background:rgba(43,91,196,.08);flex-wrap:wrap}
.num{font-size:12px;font-weight:900;letter-spacing:.16em;color:var(--blue2)}
.head h3{font-size:18px;font-weight:900;margin:0}
.head .tag{margin-left:auto;font-size:12px;color:var(--dim)}
.body{display:grid;grid-template-columns:minmax(280px,400px) 1fr;gap:26px;padding:20px}
@media(max-width:800px){.body{grid-template-columns:1fr}}
.shot{border:1px solid var(--line);border-radius:14px;overflow:hidden;background:#0b1526}
.shot img{display:block;width:100%;height:auto}
dl{margin:0}
dt{font-weight:700;font-size:13.5px;margin-top:13px}
dt:first-child{margin-top:0}
dd{margin:3px 0 0;color:var(--sub);font-size:13.5px}
table{width:100%;border-collapse:collapse;font-size:13px}
th,td{text-align:left;padding:9px 10px;border-bottom:1px solid var(--line);vertical-align:top}
th{color:var(--dim);font-weight:700;font-size:12px;letter-spacing:.06em}
td b{color:var(--gold)} td.bad{color:var(--warm)}
.scroll{overflow-x:auto}
.note{color:var(--sub);font-size:13.5px;margin:12px 0 0;max-width:76ch}
.verdict{margin-top:22px;padding:18px 20px;border-radius:16px;
  background:linear-gradient(135deg,rgba(224,167,60,.12),rgba(224,167,60,.03));
  border:1px solid rgba(224,167,60,.34)}
.verdict h3{margin:0 0 8px;font-size:16px;font-weight:900;color:var(--gold)}
.verdict p{margin:0 0 8px;color:var(--sub);font-size:14px}
.verdict p:last-child{margin-bottom:0}
.verdict b{color:var(--text)}
</style>

<div class="wrap">
<h1>3つの推薦の並べくらべ</h1>
<p class="lead">描き直したモックではなく、<b>本番と同じコンポーネント</b>に本番と同じ形の値を流して撮ったものです。同じものが3つの名前で呼ばれているかを確かめるために並べました。</p>

<h2>いまアプリにある3つ</h2>

<div class="case">
  <div class="head"><span class="num">1</span><h3>曲の詳細 ・ 伸びしろポイント</h3><span class="tag">/scores/[id] の練習タブ</span></div>
  <div class="body">
    <div class="shot"><img src="__PERF__" alt="伸びしろポイント"></div>
    <dl>
      <dt>エンジン ・ 演奏1回ごとの診断</dt>
      <dd>いま開いている曲の、最後の録音1回だけを見る</dd>
      <dt>出る項目</dt>
      <dd>木のラベル ・ 件数 ・ 課題名 ・ 成功率のバーと%</dd>
      <dt>教材</dt>
      <dd><b>出さない設定</b>。呼び出し側が hideMaterials を渡している</dd>
    </dl>
  </div>
</div>

<div class="case">
  <div class="head"><span class="num">2</span><h3>ホーム ・ いま気になるところ</h3><span class="tag">ホーム④</span></div>
  <div class="body">
    <div class="shot"><img src="__HOME__" alt="ホームの弱点パネル"></div>
    <dl>
      <dt>エンジン ・ 累積カウンタ</dt>
      <dd>生涯のすべての録音を合算した課題ごとのカウンタ</dd>
      <dt>出る項目</dt>
      <dd>木のラベル ・ 件数 ・ 課題名 ・ 成功率 ・ <b>おすすめ教材と 練習する ボタン</b></dd>
      <dt>枠</dt>
      <dd>音程から2つ、リズムから2つの最大4枠</dd>
    </dl>
  </div>
</div>

<div class="case">
  <div class="head"><span class="num">3</span><h3>わざの詳細 ・ おすすめ練習</h3><span class="tag">/progress/skill/[id]</span></div>
  <div class="body">
    <div class="shot"><img src="__SKILL__" alt="わざ詳細のおすすめ練習"></div>
    <dl>
      <dt>エンジン ・ 累積カウンタ</dt>
      <dd><b>2と同じ計算</b>。そこからこのわざに関係する枠だけを抜き、教材を2件まで</dd>
      <dt>出る項目</dt>
      <dd>2と同じ ・ 説明文が1行つく</dd>
      <dt>ちがい</dt>
      <dd>わざで絞るかどうかだけ</dd>
    </dl>
  </div>
</div>

<h2>比較</h2>
<div class="scroll"><table>
<tr><th>場所</th><th>見出し</th><th>エンジン</th><th>材料</th><th>教材</th><th>絞り込み</th></tr>
<tr><td>曲の詳細</td><td>伸びしろポイント</td><td>演奏1回ごと</td><td>最後の録音</td><td class="bad">出さない</td><td>その曲</td></tr>
<tr><td>ホーム</td><td>いま気になるところ</td><td>累積</td><td>生涯すべて</td><td>出す</td><td>なし ・ 4枠</td></tr>
<tr><td>わざの詳細</td><td>おすすめ練習</td><td>累積</td><td>生涯すべて</td><td>出す</td><td>そのわざ</td></tr>
</table></div>
<p class="note">2と3は<b>同じ計算の結果</b>で、絞り込みの有無だけが違います。1だけが別の材料を見ています。</p>

<h2>参考 ・ 教材まで出した場合</h2>
<div class="case">
  <div class="head"><span class="num">参考</span><h3>曲の詳細で教材まで出すと</h3><span class="tag">hideMaterials を外した状態</span></div>
  <div class="body">
    <div class="shot"><img src="__FULL__" alt="教材つき"></div>
    <dl>
      <dt>ホームとほぼ同じ見た目になります</dt>
      <dd>材料が違うだけで、並ぶ項目は同一です</dd>
      <dt>いま教材を出していない理由</dt>
      <dd>2026-07-25 の判断で、教材は毎日の基礎練に一本化したため</dd>
    </dl>
  </div>
</div>

<div class="verdict">
<h3>精査の結論</h3>
<p><b>成長カルテに推薦はありません。</b>前に「成長カルテのおすすめ練習」と申し上げたのは誤りで、実際はわざの詳細の中でした。訂正します。</p>
<p><b>実体は2種類、名前は3つです。</b>演奏1回ごとの診断が1つ、累積が1つ。それを「伸びしろポイント」「いま気になるところ」「おすすめ練習」と呼び分けています。同じ課題名と同じ成功率のバーが、3つの名前で出ています。</p>
<p><b>伸びしろの順位を新しく足す必要はありません。</b>ご指摘のとおりです。累積の推薦がすでに「どこが弱いか」と「何をやるか」の両方を出しており、順位を足しても同じ材料の別の言い方になります。</p>
</div>
<p class="note">整理するなら、呼び名を先に揃えることを勧めます。累積の2箇所を「おすすめ練習」に統一し、曲の詳細だけは材料が違うので別の名前を残す。あるいは3つとも「おすすめ練習」にして、見出しの下の説明文で材料の違いを書く方法もあります。</p>
</div>
"""
for k, v in IMG.items():
    html = html.replace("__" + k.upper() + "__", v)
out = os.path.join(SP, "reco-compare.html")
io.open(out, "w", encoding="utf-8").write(html)
print(out, round(len(html) / 1024 / 1024, 2), "MB")
