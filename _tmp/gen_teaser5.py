# -*- coding: utf-8 -*-
import io, os
SP = os.environ.get("SP")

html = r"""<title>これから追加します の見せ方</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700;900&display=swap">
<style>
:root{
  --ink:#0a1526; --panel:#12203a; --deep:#0b1526; --line:rgba(150,175,225,.16);
  --text:#eaf0fb; --sub:#9db0d0; --dim:#6e83a8;
  --blue2:#3f74e0; --gold:#E0A73C; --warm:#e08e64; --teal:#7fc4c4;
  --card-a:#1e3053; --card-b:#15233f; --cream:#F3E6D2;
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
.catRow{display:flex;align-items:center;gap:9px;margin-top:6px}
.catLab{width:92px;flex:none;font-size:11.5px;color:var(--sub)}
.catBar{flex:1;height:6px;border-radius:4px;background:#16233d;overflow:hidden}
.catBar i{display:block;height:100%;border-radius:4px;background:var(--teal)}
.catN{width:42px;text-align:right;font-size:11px;color:var(--sub);font-variant-numeric:tabular-nums}
.body-copy{font-size:12.5px;color:var(--sub);line-height:1.8}
.soon{font-size:11px;font-weight:800;color:var(--dim);letter-spacing:.06em}

/* 案1 便箋 */
.letter{margin:16px;border:1px solid rgba(232,178,60,.3);border-radius:18px;padding:18px;
  background:linear-gradient(180deg,#20304f,#16233e)}
.letter .k{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:900;letter-spacing:.12em;color:#a9833b}
.letter .t{font-size:15px;font-weight:900;margin-top:8px;color:var(--cream)}
.letter .b{font-size:12.5px;color:var(--sub);margin-top:7px;line-height:1.8}

/* 案2 かすみ棚 */
.shelfWrap{position:relative;margin-top:8px}
.shelf{display:flex;gap:7px;overflow:hidden;padding:2px 0 4px}
.chip{flex:none;border:1px solid var(--line);border-radius:11px;padding:9px 12px;background:#0e1a2f;
  font-size:11.5px;font-weight:700;color:var(--sub);white-space:nowrap}
.veil{position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(180deg, rgba(21,35,63,0) 0%, rgba(21,35,63,.55) 55%, rgba(21,35,63,.94) 100%)}
.veilTxt{position:absolute;left:0;right:0;bottom:6px;text-align:center;font-size:11.5px;font-weight:800;color:var(--sub)}

/* 案3 1行 */
.oneline{display:flex;align-items:center;gap:9px;padding:11px 12px;margin-top:2px;
  background:#0e1a2f;border:1px solid var(--line);border-radius:11px;font-size:12.5px;color:var(--sub)}
.dot{width:6px;height:6px;border-radius:50%;background:var(--dim);flex:none}

/* 案4 うすいバー */
.ghostRow{display:flex;align-items:center;gap:9px;margin-top:6px;opacity:.42}
.ghostBar{flex:1;height:6px;border-radius:4px;background:repeating-linear-gradient(90deg,#22344f 0 6px,transparent 6px 11px)}

/* 案5 見本 */
.sample{margin-top:9px;display:flex;gap:9px;align-items:stretch}
.sampleCard{flex:1;border:1px solid rgba(127,196,196,.34);border-radius:13px;padding:11px;
  background:linear-gradient(180deg,rgba(127,196,196,.1),rgba(127,196,196,.02))}
.sampleCard .n{font-size:12.5px;font-weight:900}
.sampleCard .s{font-size:10.5px;color:var(--sub);margin-top:3px}
.sampleCard .st{margin-top:8px;font-size:10.5px;color:var(--teal);font-weight:800}
.sampleNote{flex:1;display:flex;align-items:center;font-size:11.5px;color:var(--sub);line-height:1.75}

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
<h1>これから追加します の見せ方</h1>
<p class="lead">文言は5案とも同じです。<b>この機能はこれから追加します。</b>変えているのは置き方だけ。カルテのシートの中に置いた状態で並べています。先生をさがすボタンは5案とも外しています。</p>

<h2>5案</h2>

<div class="case">
  <div class="head"><span class="num">案1</span><h3>便箋のまま</h3><span class="tag">いまの形 ・ 文言だけ差し替え</span></div>
  <div class="body">
    <div class="sheet">
      <div class="chap"><div class="kick">CURVE</div><div class="ttl">成長カーブ</div>
        <div class="body-copy">2日ぶん録音がたまると 線がのびていくよ</div></div>
      <div class="rule"></div>
      <div class="letter">
        <div class="k">ESPRESSIONE</div>
        <div class="t">表現の習得状況</div>
        <div class="b">この機能はこれから追加します。</div>
      </div>
      <div class="rule"></div>
      <div class="chap"><div class="kick">CARDS</div><div class="ttl">カードアルバム</div></div>
    </div>
    <dl>
      <dt class="g">既存の見た目をそのまま使える ・ 実装が一行で済む</dt>
      <dt class="g">金の罫が特別さを残す</dt>
      <dt class="b">他の章と作りが違うので、まだ浮いて見える</dt>
      <dt class="b">事務的な文言と、装飾のある便箋が噛み合わない</dt>
    </dl>
  </div>
</div>

<div class="case">
  <div class="head"><span class="num">案2</span><h3>かすみのかかった棚</h3><span class="tag">何が来るかを見せる</span></div>
  <div class="body">
    <div class="sheet">
      <div class="chap"><div class="kick">CURVE</div><div class="ttl">成長カーブ</div>
        <div class="body-copy">2日ぶん録音がたまると 線がのびていくよ</div></div>
      <div class="rule"></div>
      <div class="chap">
        <div class="kick">ESPRESSIONE</div><div class="ttl">表現の習得状況</div>
        <div class="body-copy">この機能はこれから追加します。</div>
        <div class="shelfWrap">
          <div class="shelf">
            <span class="chip">やさしく</span><span class="chip">歌うように</span><span class="chip">華やかに</span><span class="chip">軽やかに</span>
          </div>
          <div class="veil"></div>
        </div>
      </div>
      <div class="rule"></div>
      <div class="chap"><div class="kick">CARDS</div><div class="ttl">カードアルバム</div></div>
    </div>
    <dl>
      <dt class="g">何が並ぶ場所かが一目で分かる</dt>
      <dt class="g">他の章と同じ作りなので浮かない</dt>
      <dt class="b">かすみが「もうすぐ来る」に読める ・ 時期を約束していないのに期待させる</dt>
      <dt class="b">項目名を先に見せると、開放後の発見が減る</dt>
    </dl>
  </div>
</div>

<div class="case">
  <div class="head"><span class="num">案3</span><h3>一行だけ</h3><span class="tag">いちばん静か</span></div>
  <div class="body">
    <div class="sheet">
      <div class="chap"><div class="kick">CURVE</div><div class="ttl">成長カーブ</div>
        <div class="body-copy">2日ぶん録音がたまると 線がのびていくよ</div></div>
      <div class="rule"></div>
      <div class="chap">
        <div class="kick">ESPRESSIONE</div>
        <div class="ttl">表現の習得状況 <span class="soon">・ これから追加</span></div>
        <div class="oneline"><span class="dot"></span>この機能はこれから追加します。</div>
      </div>
      <div class="rule"></div>
      <div class="chap"><div class="kick">CARDS</div><div class="ttl">カードアルバム</div></div>
    </div>
    <dl>
      <dt class="g">縦を取らない ・ 事務的な文言と釣り合う</dt>
      <dt class="g">見出しに これから追加 と出るので、章を開く前に分かる</dt>
      <dt class="b">地味 ・ 先生機能の存在に気づかれにくい</dt>
      <dt class="b">章として空いている感じは残る</dt>
    </dl>
  </div>
</div>

<div class="case">
  <div class="head"><span class="num">案4</span><h3>うすいバー</h3><span class="tag">他の章と同じ形で置く</span></div>
  <div class="body">
    <div class="sheet">
      <div class="chap"><div class="kick">CURVE</div><div class="ttl">成長カーブ</div>
        <div class="body-copy">2日ぶん録音がたまると 線がのびていくよ</div></div>
      <div class="rule"></div>
      <div class="chap">
        <div class="kick">ESPRESSIONE</div><div class="ttl">表現の習得状況</div>
        <div class="body-copy">この機能はこれから追加します。</div>
        <div style="margin-top:10px">
          <div class="ghostRow"><span class="catLab">やさしい ・ 歌う</span><span class="ghostBar"></span><span class="catN">0 / 5</span></div>
          <div class="ghostRow"><span class="catLab">華やか ・ 軽快</span><span class="ghostBar"></span><span class="catN">0 / 4</span></div>
          <div class="ghostRow"><span class="catLab">力強い ・ 堂々</span><span class="ghostBar"></span><span class="catN">0 / 4</span></div>
          <div class="ghostRow"><span class="catLab">表情 ・ 幻想</span><span class="ghostBar"></span><span class="catN">0 / 2</span></div>
        </div>
      </div>
      <div class="rule"></div>
      <div class="chap"><div class="kick">CARDS</div><div class="ttl">カードアルバム</div></div>
    </div>
    <dl>
      <dt class="g">わざの章とまったく同じ形 ・ カルテの並びが崩れない</dt>
      <dt class="g">4系統15項目という規模が伝わる</dt>
      <dt class="b">0 / 5 が並ぶので、できていないと責められた感じになる</dt>
      <dt class="b">破線のバーは、データ待ちなのか機能待ちなのか区別がつかない</dt>
    </dl>
  </div>
</div>

<div class="case">
  <div class="head"><span class="num">案5</span><h3>見本を1枚だけ</h3><span class="tag">できあがりを見せる</span></div>
  <div class="body">
    <div class="sheet">
      <div class="chap"><div class="kick">CURVE</div><div class="ttl">成長カーブ</div>
        <div class="body-copy">2日ぶん録音がたまると 線がのびていくよ</div></div>
      <div class="rule"></div>
      <div class="chap">
        <div class="kick">ESPRESSIONE</div><div class="ttl">表現の習得状況</div>
        <div class="body-copy">この機能はこれから追加します。</div>
        <div class="sample">
          <div class="sampleCard">
            <div class="n">歌うように</div>
            <div class="s">アルプス一万尺</div>
            <div class="st">★2 認定</div>
          </div>
          <div class="sampleNote">認定されると、こんなふうに残ります</div>
        </div>
      </div>
      <div class="rule"></div>
      <div class="chap"><div class="kick">CARDS</div><div class="ttl">カードアルバム</div></div>
    </div>
    <dl>
      <dt class="g">できあがりが具体的に分かる ・ 待つ理由が生まれる</dt>
      <dt class="g">1枚だけなので圧がない</dt>
      <dt class="b">見本と実物の区別がつきにくい ・ 自分の記録と誤解されうる</dt>
      <dt class="b">実装がいちばん重い ・ 見本の中身を持つ必要がある</dt>
    </dl>
  </div>
</div>

<div class="verdictBox">
<h3>おすすめ</h3>
<p><b>案3 一行だけ</b>。事務的な文言に決めた以上、置き方も事務的に揃えるのが筋です。見出しの横に これから追加 と出るので、章を開く前に状態が分かります。縦も取りません。</p>
<p>次点は<b>案1 便箋のまま</b>。実装が文言の差し替えだけで済み、金の罫が「いずれ来る特別なもの」という気配を残します。ただ事務的な文言と装飾が噛み合わないので、便箋のままにするなら文言はもう少し柔らかいほうが合います。</p>
<p><b>案4</b>は 0 / 5 が並ぶのが難点です。機能が無くて0なのに、できていないと読めます。<b>案2</b>のかすみと<b>案5</b>の見本は、時期を約束していないのに近く来ると期待させます。</p>
</div>
<p class="note">5案とも「先生をさがす」ボタンを外しています。先生機能が公開されていない以上、押しても空振りするためです。同じ理由で、先生がいないユーザーの下タブが「先生をさがす」になっている点も、あわせて見直すか決めてください。</p>
</div>
"""
out = os.path.join(SP, "teaser-5.html")
io.open(out, "w", encoding="utf-8").write(html)
print(out, round(len(html) / 1024, 1), "KB")
