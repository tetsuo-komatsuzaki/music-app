# -*- coding: utf-8 -*-
import io, os
SP = os.environ.get("SP")

html = r"""<title>プラス案内のポップアップ</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700;900&display=swap">
<style>
:root{
  --ink:#0a1526; --panel:#12203a; --card-a:#1e3053; --card-b:#15233f;
  --line:rgba(150,175,225,.16); --text:#eaf0fb; --sub:#9db0d0; --dim:#6e83a8;
  --blue:#2b5bc4; --blue2:#3f74e0; --gold:#E0A73C; --warm:#e08e64; --cream:#F3E6D2;
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
.body{display:grid;grid-template-columns:minmax(280px,340px) 1fr;gap:26px;padding:20px}
@media(max-width:780px){.body{grid-template-columns:1fr}}
dl{margin:0}
dt{font-weight:700;font-size:13.5px;margin-top:12px}
dt:first-child{margin-top:0}
dt.g::before{content:"よい ";color:var(--gold);font-size:11px;letter-spacing:.1em}
dt.b::before{content:"よわい ";color:var(--warm);font-size:11px;letter-spacing:.1em}

/* 端末 */
.phone{position:relative;height:430px;border-radius:20px;overflow:hidden;
  background:linear-gradient(180deg,#101c33,#0c1526);border:1px solid var(--line)}
.behind{padding:14px 13px;filter:blur(0px)}
.bTtl{font-size:15px;font-weight:900}
.bSub{font-size:10.5px;color:var(--dim);margin-top:2px}
.upBtn{margin-top:12px;display:flex;align-items:center;justify-content:center;gap:6px;
  border:1px dashed rgba(150,175,225,.3);border-radius:12px;padding:13px;font-size:12.5px;color:var(--sub)}
.row{margin-top:9px;height:44px;border-radius:11px;background:rgba(150,175,225,.06)}
.veil{position:absolute;inset:0;background:rgba(6,12,24,.72)}

/* 1 中央カード */
.mid{position:absolute;left:14px;right:14px;top:50%;transform:translateY(-50%);
  background:var(--card-b);border:1px solid rgba(232,178,60,.34);border-radius:16px;padding:18px}
.kick{font-size:10px;font-weight:900;letter-spacing:.14em;color:var(--gold)}
.tt{font-size:15.5px;font-weight:900;margin-top:7px}
.bd{font-size:12px;color:var(--sub);margin-top:8px;line-height:1.85}
.acts{display:flex;gap:8px;margin-top:15px;align-items:center}
.pill{border-radius:999px;padding:7px 14px;font-size:12px;font-weight:800;text-decoration:none;
  border:1px solid var(--line);color:var(--sub)}
.pill.gold{background:linear-gradient(180deg,#f0c46a,var(--gold));color:#5b3a0c;border-color:transparent}
.pill.ghost{margin-left:auto}

/* 2 下から出るシート */
.sheet{position:absolute;left:0;right:0;bottom:0;background:var(--card-b);
  border-top:1px solid rgba(232,178,60,.34);border-radius:20px 20px 0 0;padding:16px 16px 20px}
.grab{width:36px;height:4px;border-radius:2px;background:rgba(150,175,225,.28);margin:0 auto 12px}

/* 3 金の券面 */
.ticket{position:absolute;left:16px;right:16px;top:50%;transform:translateY(-50%);
  border-radius:16px;padding:18px;color:#3a2708;
  background:linear-gradient(160deg,#fbe9bd 0%,#f0c46a 46%,#e0a73c 100%);
  box-shadow:0 16px 34px rgba(0,0,0,.45)}
.ticket .kick{color:#8a5f13}
.ticket .bd{color:#5b4213}
.ticket .pill{border-color:rgba(90,60,10,.28);color:#5b3a0c}
.ticket .pill.dark{background:#2a1f0a;color:#f4dfae;border-color:transparent}

/* 4 その場のヒント */
.tip{position:absolute;left:13px;right:13px;top:132px;background:var(--card-b);
  border:1px solid rgba(232,178,60,.34);border-radius:13px;padding:13px}
.tip::before{content:"";position:absolute;left:38px;top:-7px;width:12px;height:12px;
  background:var(--card-b);border-left:1px solid rgba(232,178,60,.34);border-top:1px solid rgba(232,178,60,.34);
  transform:rotate(45deg)}

/* 5 できることを並べる */
.list{margin-top:11px;display:flex;flex-direction:column;gap:6px}
.li{display:flex;gap:8px;align-items:baseline;font-size:12px;color:var(--sub)}
.li b{color:var(--text);font-weight:700}
.chk{color:var(--gold);flex:none;font-weight:900}

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
<h1>プラス案内のポップアップ</h1>
<p class="lead">無料ユーザーが楽譜のアップロードを押したときに出す案内の5案。いまは押しても何も起きません。背景はライブラリのマイ楽譜タブです。</p>

<h2>5案</h2>

<div class="case">
  <div class="head"><span class="num">案1</span><h3>中央のカード</h3><span class="tag">いまの実装</span></div>
  <div class="body">
    <div class="phone">
      <div class="behind"><div class="bTtl">マイ楽譜</div><div class="bSub">じぶんで取り込んだ楽譜</div>
        <div class="upBtn">楽譜をえらぶ</div><div class="row"></div><div class="row"></div></div>
      <div class="veil"></div>
      <div class="mid">
        <div class="kick">ARCODA PLUS</div>
        <div class="tt">楽譜のアップロードはプラス限定です</div>
        <div class="bd">自分の楽譜を取り込むと、その曲も採点できるようになります。</div>
        <div class="acts"><a class="pill gold">プランを見る</a><a class="pill ghost">とじる</a></div>
      </div>
    </div>
    <dl>
      <dt class="g">実装済み ・ どの画面でも同じ形で使える</dt>
      <dt class="b">中央に出るので操作が完全に止まる</dt>
      <dt class="b">スマホでは指が届きにくい位置</dt>
    </dl>
  </div>
</div>

<div class="case">
  <div class="head"><span class="num">案2</span><h3>下から出るシート</h3><span class="tag">親指が届く</span></div>
  <div class="body">
    <div class="phone">
      <div class="behind"><div class="bTtl">マイ楽譜</div><div class="bSub">じぶんで取り込んだ楽譜</div>
        <div class="upBtn">楽譜をえらぶ</div><div class="row"></div><div class="row"></div></div>
      <div class="veil"></div>
      <div class="sheet">
        <div class="grab"></div>
        <div class="kick">ARCODA PLUS</div>
        <div class="tt">楽譜のアップロードはプラス限定です</div>
        <div class="bd">自分の楽譜を取り込むと、その曲も採点できるようになります。</div>
        <div class="acts"><a class="pill gold">プランを見る</a><a class="pill ghost">とじる</a></div>
      </div>
    </div>
    <dl>
      <dt class="g">スマホで押しやすい ・ アプリの他のシートと同じ作り</dt>
      <dt class="g">下に出るので、押したボタンが隠れない</dt>
      <dt class="b">下タブと重なる ・ 見た目の階層が増える</dt>
    </dl>
  </div>
</div>

<div class="case">
  <div class="head"><span class="num">案3</span><h3>金の券面</h3><span class="tag">宝物と同じ質感</span></div>
  <div class="body">
    <div class="phone">
      <div class="behind"><div class="bTtl">マイ楽譜</div><div class="bSub">じぶんで取り込んだ楽譜</div>
        <div class="upBtn">楽譜をえらぶ</div><div class="row"></div><div class="row"></div></div>
      <div class="veil"></div>
      <div class="ticket">
        <div class="kick">ARCODA PLUS</div>
        <div class="tt">楽譜のアップロードはプラス限定です</div>
        <div class="bd">自分の楽譜を取り込むと、その曲も採点できるようになります。</div>
        <div class="acts"><a class="pill dark">プランを見る</a><a class="pill ghost">とじる</a></div>
      </div>
    </div>
    <dl>
      <dt class="g">特別さが伝わる ・ 宝物の券面と語彙が揃う</dt>
      <dt class="b">金は成果の色 ・ 課金の案内に使うと意味が濁る</dt>
      <dt class="b">売り込みの圧が強い</dt>
    </dl>
  </div>
</div>

<div class="case">
  <div class="head"><span class="num">案4</span><h3>その場のヒント</h3><span class="tag">いちばん軽い</span></div>
  <div class="body">
    <div class="phone">
      <div class="behind"><div class="bTtl">マイ楽譜</div><div class="bSub">じぶんで取り込んだ楽譜</div>
        <div class="upBtn">楽譜をえらぶ</div><div class="row"></div><div class="row"></div></div>
      <div class="tip">
        <div class="kick">ARCODA PLUS</div>
        <div class="tt">プラス限定の機能です</div>
        <div class="bd">自分の楽譜を取り込むと、その曲も採点できるようになります。</div>
        <div class="acts"><a class="pill gold">プランを見る</a><a class="pill ghost">とじる</a></div>
      </div>
    </div>
    <dl>
      <dt class="g">画面を止めない ・ 押した場所のすぐ下に出る</dt>
      <dt class="g">暗幕が無いので圧が小さい</dt>
      <dt class="b">見落とされる ・ 気づかず何度も押される</dt>
    </dl>
  </div>
</div>

<div class="case">
  <div class="head"><span class="num">案5</span><h3>できることを並べる</h3><span class="tag">価値を先に見せる</span></div>
  <div class="body">
    <div class="phone">
      <div class="behind"><div class="bTtl">マイ楽譜</div><div class="bSub">じぶんで取り込んだ楽譜</div>
        <div class="upBtn">楽譜をえらぶ</div><div class="row"></div><div class="row"></div></div>
      <div class="veil"></div>
      <div class="sheet">
        <div class="grab"></div>
        <div class="kick">ARCODA PLUS</div>
        <div class="tt">アルコプラスでできること</div>
        <div class="list">
          <div class="li"><span class="chk">+</span><span><b>自分の楽譜を取り込む</b> ・ その曲も採点できる</span></div>
          <div class="li"><span class="chk">+</span><span><b>採点が無制限</b> ・ 週7回の上限が外れる</span></div>
          <div class="li"><span class="chk">+</span><span><b>14日間おためし</b> ・ いつでもやめられる</span></div>
        </div>
        <div class="acts"><a class="pill gold">プランを見る</a><a class="pill ghost">とじる</a></div>
      </div>
    </div>
    <dl>
      <dt class="g">何が増えるか分かる ・ 判断できる</dt>
      <dt class="g">アップロード以外の価値も伝わる</dt>
      <dt class="b">縦が長い ・ 売り込みに見えやすい</dt>
      <dt class="b">書いた内容が実装と合っているか毎回確認が要る</dt>
    </dl>
  </div>
</div>

<div class="verdictBox">
<h3>おすすめ</h3>
<p><b>案2 下から出るシート</b>。スマホで押しやすく、アプリの他のシートと同じ作りなので新しい部品を増やしません。押したボタンの上に暗幕が乗るだけで、何が起きたかも分かります。</p>
<p><b>案5</b>は内容としては最良ですが、書ける項目がいまは2つしかありません。プラン判定が入っているのは楽譜アップロードと採点回数だけで、設定画面の宣伝文にある基礎練やレッスンには課金の判定が存在しないためです。宣伝文を実装に合わせて直したうえでなら、案5が最も親切になります。</p>
<p><b>案3 金の券面</b>は避けたほうがよいと考えます。金は成果の色として使い分けている色で、課金の案内に使うと意味が濁ります。<b>案4</b>は軽い代わりに見落とされます。</p>
</div>
</div>
"""
out = os.path.join(SP, "plan-popup.html")
io.open(out, "w", encoding="utf-8").write(html)
print(out, round(len(html) / 1024, 1), "KB")
