# -*- coding: utf-8 -*-
import io, os
SP = os.environ.get("SP")

html = r"""<title>これから追加します のトーン</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700;900&display=swap">
<style>
:root{
  --ink:#0a1526; --panel:#12203a; --line:rgba(150,175,225,.16);
  --text:#eaf0fb; --sub:#9db0d0; --dim:#6e83a8; --faint:#4b5f82;
  --blue2:#3f74e0; --gold:#E0A73C; --warm:#e08e64; --teal:#7fc4c4;
  --card-b:#15233f;
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

/* カルテのシート (実装の値) */
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

/* ── これから追加する章 ── */
.soonRow{display:flex;align-items:center;gap:9px;padding:11px 12px;
  border-radius:11px;font-size:12.5px}
.dot{width:6px;height:6px;border-radius:50%;flex:none}

/* A 弱: 文字色だけ落とす */
.toneA .kick,.toneA .ttl{color:var(--dim)}
.toneA .soonRow{background:#0e1a2f;border:1px solid var(--line);color:var(--sub)}
.toneA .dot{background:var(--dim)}

/* B 中: 章ごと沈める + 破線 */
.toneB .kick{color:var(--faint)}
.toneB .ttl{color:var(--dim)}
.toneB .soonRow{background:transparent;border:1px dashed rgba(150,175,225,.22);color:var(--dim)}
.toneB .dot{background:var(--faint)}

/* C 強: 地を沈め、左に縦罫 */
.toneC{background:rgba(8,15,28,.55)}
.toneC .kick{color:var(--faint)}
.toneC .ttl{color:var(--dim)}
.toneC .soonRow{background:transparent;border:0;border-left:2px solid rgba(150,175,225,.28);
  border-radius:0;padding:2px 0 2px 11px;color:var(--dim)}
.toneC .dot{display:none}

.note{color:var(--sub);font-size:13.5px;margin:12px 0 0;max-width:76ch}
.verdictBox{margin-top:30px;padding:18px 20px;border-radius:16px;
  background:linear-gradient(135deg,rgba(224,167,60,.12),rgba(224,167,60,.03));
  border:1px solid rgba(224,167,60,.34)}
.verdictBox h3{margin:0 0 8px;font-size:16px;font-weight:900;color:var(--gold)}
.verdictBox p{margin:0 0 8px;color:var(--sub);font-size:14px}
.verdictBox p:last-child{margin-bottom:0}
.verdictBox b{color:var(--text)}

/* 一覧ページ用 */
.page{background:var(--ink);border:1px solid var(--line);border-radius:18px;padding:18px 16px 22px}
.pageTtl{font-size:19px;font-weight:900;margin:0 0 3px}
.pageSub{font-size:11.5px;color:var(--dim);margin-bottom:22px}
.center{padding:34px 12px;text-align:center}
</style>

<div class="wrap">
<h1>これから追加します のトーン</h1>
<p class="lead">案3をベースに、文言の重複をなくしました。見出しの横にあった「これから追加」のバッジは外し、<b>この機能はこれから追加します。</b>の一行だけにしています。違いは色のトーンの強さだけ。上下に他の章を置いて、沈み具合が比べられるようにしています。</p>

<h2>3つのトーン</h2>

<div class="case">
  <div class="head"><span class="num">A</span><h3>弱く沈める</h3><span class="tag">文字色だけ落とす</span></div>
  <div class="body">
    <div class="sheet">
      <div class="chap"><div class="kick">SKILLS</div><div class="ttl">わざの習得状況</div>
        <div class="catRow"><span class="catLab">弓</span><span class="catBar"><i style="width:25%"></i></span><span class="catN">2 / 8</span></div>
        <div class="catRow"><span class="catLab">フィンガリング</span><span class="catBar"><i style="width:50%"></i></span><span class="catN">1 / 2</span></div>
        <a class="chapLink" href="#">技術マップへ</a></div>
      <div class="rule"></div>
      <div class="chap toneA">
        <div class="kick">ESPRESSIONE</div><div class="ttl">表現の習得状況</div>
        <div class="soonRow"><span class="dot"></span>この機能はこれから追加します。</div>
      </div>
      <div class="rule"></div>
      <div class="chap"><div class="kick">CARDS</div><div class="ttl">カードアルバム</div>
        <div class="copy">あつめたカード 3 / 10</div></div>
    </div>
    <dl>
      <dt class="g">他の章と作りが揃う ・ 落差が小さく落ち着いて見える</dt>
      <dt class="b">沈み方が弱く、使える章と見分けがつきにくい</dt>
      <dt class="b">枠があるぶん、中身が入りそうに見える</dt>
    </dl>
  </div>
</div>

<div class="case">
  <div class="head"><span class="num">B</span><h3>中くらい</h3><span class="tag">章ごと沈める ・ 破線の枠</span></div>
  <div class="body">
    <div class="sheet">
      <div class="chap"><div class="kick">SKILLS</div><div class="ttl">わざの習得状況</div>
        <div class="catRow"><span class="catLab">弓</span><span class="catBar"><i style="width:25%"></i></span><span class="catN">2 / 8</span></div>
        <div class="catRow"><span class="catLab">フィンガリング</span><span class="catBar"><i style="width:50%"></i></span><span class="catN">1 / 2</span></div>
        <a class="chapLink" href="#">技術マップへ</a></div>
      <div class="rule"></div>
      <div class="chap toneB">
        <div class="kick">ESPRESSIONE</div><div class="ttl">表現の習得状況</div>
        <div class="soonRow"><span class="dot"></span>この機能はこれから追加します。</div>
      </div>
      <div class="rule"></div>
      <div class="chap"><div class="kick">CARDS</div><div class="ttl">カードアルバム</div>
        <div class="copy">あつめたカード 3 / 10</div></div>
    </div>
    <dl>
      <dt class="g">破線が「まだ中身が無い」を示す ・ アプリの準備中と同じ記号</dt>
      <dt class="g">見出しも沈むので、章ごと休んでいると分かる</dt>
      <dt class="b">破線はデータ待ちにも使われている ・ 機能待ちと区別がつかない</dt>
    </dl>
  </div>
</div>

<div class="case">
  <div class="head"><span class="num">C</span><h3>強く沈める</h3><span class="tag">地を暗くし、左に縦罫</span></div>
  <div class="body">
    <div class="sheet">
      <div class="chap"><div class="kick">SKILLS</div><div class="ttl">わざの習得状況</div>
        <div class="catRow"><span class="catLab">弓</span><span class="catBar"><i style="width:25%"></i></span><span class="catN">2 / 8</span></div>
        <div class="catRow"><span class="catLab">フィンガリング</span><span class="catBar"><i style="width:50%"></i></span><span class="catN">1 / 2</span></div>
        <a class="chapLink" href="#">技術マップへ</a></div>
      <div class="rule"></div>
      <div class="chap toneC">
        <div class="kick">ESPRESSIONE</div><div class="ttl">表現の習得状況</div>
        <div class="soonRow">この機能はこれから追加します。</div>
      </div>
      <div class="rule"></div>
      <div class="chap"><div class="kick">CARDS</div><div class="ttl">カードアルバム</div>
        <div class="copy">あつめたカード 3 / 10</div></div>
    </div>
    <dl>
      <dt class="g">地が暗いので、章そのものが休んでいると一目で分かる</dt>
      <dt class="g">枠を持たないので、中身が入る箱には見えない</dt>
      <dt class="g">縦罫は注記の記号 ・ データ待ちの破線と混ざらない</dt>
      <dt class="b">シートの中に暗い帯ができる ・ 継ぎ目が目立つ</dt>
    </dl>
  </div>
</div>

<h2>一覧ページ側</h2>
<div class="case">
  <div class="head"><span class="num">同じ</span><h3>表現の一覧</h3><span class="tag">ページ全体が空になる場合</span></div>
  <div class="body">
    <div class="page">
      <div class="pageTtl">表現の習得状況</div>
      <div class="pageSub">‹ カルテにもどる</div>
      <div class="center toneC">
        <div class="soonRow" style="justify-content:center;border-left:0;padding:0">この機能はこれから追加します。</div>
      </div>
    </div>
    <dl>
      <dt class="g">同じ一行だけ ・ 中央に置く</dt>
      <dt class="b">ページとして薄い ・ 到達する導線も無いので、そもそも開けなくする手もある</dt>
    </dl>
  </div>
</div>

<div class="verdictBox">
<h3>おすすめ</h3>
<p><b>C 強く沈める</b>。地を暗くすると、章そのものがいま働いていないと一目で分かります。枠を持たないので中身が入る箱にも見えません。左の縦罫は注記の記号で、教材の準備中に使っている破線とも混ざりません。</p>
<p><b>B</b>の破線は、アプリの中でデータ待ちを表す記号としてすでに使われています。機能待ちに同じ記号を当てると、録音を増やせば出ると誤解されます。<b>A</b>は落差が小さく、使える章との見分けがつきません。</p>
<p>Cの弱点はシートの中に暗い帯ができることです。表現の章はカードアルバムの手前にあるので、下端に近く目立ちにくい位置ではあります。</p>
</div>
<p class="note">一覧ページは同じ一行を中央に置く形にしています。ただしカルテ側の章からリンクを外すと、このページに到達する手段が無くなります。ページごと閉じるか、直リンクで来た人のために残すかは別に決めてください。</p>
</div>
"""
out = os.path.join(SP, "teaser-tone.html")
io.open(out, "w", encoding="utf-8").write(html)
print(out, round(len(html) / 1024, 1), "KB")
