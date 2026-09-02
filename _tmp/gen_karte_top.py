# -*- coding: utf-8 -*-
import json, io, os
SP = os.environ.get("SP")
data = json.load(io.open("_tmp/karte_top.json", encoding="utf-8"))
NAMES = {"cmlyl3rf20": "ユーザーA", "cmoecf4zv0": "ユーザーB", "cmmm46xn40": "ユーザーC"}
payload = json.dumps(data, ensure_ascii=False)

html = r"""<title>成長カルテ 新構成</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700;900&display=swap">
<style>
:root{
  --ink:#0a1526; --panel:#12203a; --deep:#0b1526; --line:#24365c;
  --text:#eaf0fb; --sub:#9db0d0; --dim:#6e83a8;
  --blue:#2b5bc4; --blue2:#3f74e0; --gold:#d9a93c; --warm:#e08e64;
  --st-stable:#2e8b57; --st-sharp:#c0473a; --st-flat:#2b5bc4; --st-unstable:#7a4dd6;
}
*{box-sizing:border-box}
body{margin:0;background:var(--ink);color:var(--text);
  font-family:"Zen Kaku Gothic New","Hiragino Kaku Gothic ProN",system-ui,sans-serif;
  font-size:15px;line-height:1.7;-webkit-font-smoothing:antialiased}
.wrap{max-width:1180px;margin:0 auto;padding:34px 20px 80px}
h1{font-size:27px;font-weight:900;margin:0 0 6px;letter-spacing:.02em}
.lead{color:var(--sub);margin:0 0 26px;max-width:68ch}
h2{font-size:13.5px;font-weight:700;color:var(--dim);letter-spacing:.15em;
  margin:44px 0 14px;padding-bottom:8px;border-bottom:1px solid var(--line)}

.grid{display:grid;gap:22px;grid-template-columns:repeat(auto-fit,minmax(340px,1fr))}
.phone{background:var(--panel);border:1px solid var(--line);border-radius:20px;
  padding:16px 14px 18px;box-shadow:0 18px 46px rgba(0,0,0,.42)}
.phoneCap{font-size:12px;color:var(--dim);letter-spacing:.08em;margin:0 0 10px}
.kt{font-size:19px;font-weight:900;margin:0 2px 12px}

.hero{background:linear-gradient(180deg,#1b2b4c,#152241);border:1px solid var(--line);
  border-radius:14px;padding:12px;display:flex;gap:8px}
.kpi{flex:1;background:rgba(11,21,38,.55);border-radius:10px;padding:9px 8px;text-align:center}
.kpi b{display:block;font-size:19px;font-weight:900;font-variant-numeric:tabular-nums}
.kpi span{font-size:10px;color:var(--sub)}

.sec{margin-top:14px}
.kick{font-size:9.5px;font-weight:900;letter-spacing:.16em;color:var(--dim)}
.secTitle{font-size:15px;font-weight:900;margin:1px 0 9px}
.card{background:var(--deep);border:1px solid var(--line);border-radius:13px;padding:11px 12px}

/* 指板 */
.fb{background:var(--deep);border:1px solid var(--line);border-radius:13px;padding:12px 10px 10px}
.fb svg{display:block;width:100%;height:auto}
.fbLeg{display:flex;flex-wrap:wrap;gap:9px;justify-content:center;margin-top:9px;font-size:10.5px;color:var(--sub)}
.fbLeg i{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:4px;vertical-align:-1px}
.find{margin-top:9px;padding:9px 11px;background:rgba(43,91,196,.14);border:1px solid rgba(63,116,224,.3);
  border-radius:10px;font-size:12.5px}
.find b{color:var(--gold)}

/* 数字の行 */
.rowTop{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin-bottom:8px}
.rowName{font-weight:700;font-size:13.5px}
.rowVal{margin-left:auto;font-size:12px;color:var(--sub);font-variant-numeric:tabular-nums}
.rowVal b{color:var(--text);font-size:14.5px}
.cmp{display:flex;gap:6px;margin-bottom:9px}
.cmpBox{flex:1;background:rgba(11,21,38,.6);border:1px solid var(--line);border-radius:9px;padding:7px 9px}
.cmpBox .k{font-size:10px;color:var(--dim)}
.cmpBox .v{font-size:15px;font-weight:900;font-variant-numeric:tabular-nums}
.cmpBox .n{font-size:10px;color:var(--dim)}
.cmpBox.now{border-color:rgba(217,169,60,.45);background:rgba(217,169,60,.08)}
.cmpBox.now .v{color:var(--gold)}
.na{color:var(--dim);font-size:12px}
.reco{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:9px;
  background:rgba(43,91,196,.16);border:1px solid rgba(63,116,224,.34);font-size:12.5px;
  color:#cfdcff;text-decoration:none}
.reco .k{font-size:10px;color:#8fa9e8;letter-spacing:.08em;flex:none}
.reco .t{font-weight:700;color:var(--text)}
.reco .go{margin-left:auto;color:#8fa9e8}
.reco.none{background:transparent;border-style:dashed;border-color:var(--line)}
.reco.none .t{color:var(--sub);font-weight:400}

/* わざ */
.catRow{display:flex;align-items:center;gap:9px;margin-top:7px}
.catLab{width:96px;flex:none;font-size:12px;color:var(--sub)}
.catBar{flex:1;height:7px;border-radius:4px;background:#16233d;overflow:hidden}
.catBar i{display:block;height:100%;border-radius:4px;background:var(--gold)}
.catN{width:44px;text-align:right;font-size:11.5px;color:var(--sub);font-variant-numeric:tabular-nums}
.chapLink{display:block;margin-top:10px;text-align:center;font-size:12px;font-weight:700;
  color:#a8c2ff;text-decoration:none;padding:8px;border:1px solid var(--line);border-radius:9px}
.letter{border:1px solid rgba(232,178,60,.3);border-radius:14px;padding:13px;
  background:linear-gradient(180deg,#20304f,#16233e)}
.letter .k{font-size:10px;font-weight:900;letter-spacing:.12em;color:#a9833b}
.letter .t{font-size:14px;font-weight:900;margin-top:6px}
.letter .b{font-size:12px;color:var(--sub);margin-top:5px;line-height:1.75}
.rule{height:1px;background:var(--line);margin:14px 0}

table{width:100%;border-collapse:collapse;font-size:13px}
th,td{text-align:left;padding:9px 10px;border-bottom:1px solid var(--line);vertical-align:top}
th{color:var(--dim);font-weight:700;font-size:12px;letter-spacing:.06em}
td b{color:var(--gold)}
.note{color:var(--sub);font-size:13.5px;margin:12px 0 0;max-width:76ch}
.scroll{overflow-x:auto}
.warn{margin-top:14px;padding:18px 20px;border-radius:16px;
  background:linear-gradient(135deg,rgba(224,142,100,.13),rgba(224,142,100,.03));
  border:1px solid rgba(224,142,100,.36)}
.warn h3{margin:0 0 8px;font-size:16px;font-weight:900;color:var(--warm)}
.warn p{margin:0 0 8px;color:var(--sub);font-size:14px}
.warn p:last-child{margin-bottom:0}
.warn b{color:var(--text)}
</style>

<div class="wrap">
<h1>成長カルテ 新構成</h1>
<p class="lead">指板をカルテのトップに上げ、その下に速い指の切り替えとポジション移動を置いた形。わざの習得状況から下は既存のままです。指板のマスと数字はすべて本番データベースの実ユーザーの記録から計算したもので、作り値はありません。</p>

<h2>画面</h2>
<div class="grid" id="mocks"></div>
<p class="note">3人とも実在のユーザーです。<b>ユーザーC</b>は判定できるマスが22個ともっとも多い例。<b>ユーザーA</b>は音を外すマスが目立つ例。<b>ユーザーB</b>はマスが12個と少なく、わざがまだ1つも点いていない例です。</p>

<h2>記録の分析ページは削除できるか</h2>
<div class="scroll"><table>
<tr><th>いま記録の分析にあるもの</th><th>どうなるか</th></tr>
<tr><td>音程マップ ・ 指板</td><td><b>カルテのトップへ移す</b></td></tr>
<tr><td>音程のクセ ・ 針メーター</td><td><b>廃止</b> ・ 指板と同じことを見ている</td></tr>
<tr><td>ポジション移動べつ</td><td><b>廃止</b> ・ 新しいポジション移動の行に置き換わる</td></tr>
<tr><td>いまの平均</td><td>ヒーローの数字と重なる ・ 寄せられる</td></tr>
<tr><td>成長カーブ</td><td><b>行き先が要る</b> ・ 推移を見せるのはここだけ</td></tr>
<tr><td>練習バランス</td><td><b>行き先が要る</b> ・ 何をどれだけ弾いたか</td></tr>
<tr><td>奏法べつ</td><td><b>行き先が要る</b> ・ 基礎練のスコア平均</td></tr>
</table></div>
<p class="note">7つのうち4つは移すか廃止できますが、<b>成長カーブ ・ 練習バランス ・ 奏法べつ の3つは行き先が要ります</b>。そのままページを消すと、この3つが見られなくなります。</p>
<div class="warn">
<h3>おすすめは 記録ページへ寄せて 記録の分析を畳む</h3>
<p>カルテの下にすでに<b>記録</b>ページへの導線があり、そこは「弾いた日と点数のすべて」です。成長カーブと練習バランスと奏法べつは、どれも<b>何をどれだけ弾いたかの話</b>なので、記録ページの性格と合います。3つを記録ページへ移せば、記録の分析ページは畳めます。</p>
<p>カルテのトップは<b>いまどこが苦手か</b>、記録は<b>これまで何をどれだけ弾いたか</b>、と役割が分かれます。期間タブは記録ページ側に残します。</p>
</div>

<h2>いまのデータで出る状態</h2>
<div class="scroll"><table id="stateTable">
<tr><th>ユーザー</th><th>録音</th><th>指板の判定できるマス</th><th>速い指の切り替え</th><th>ポジション移動</th><th>わざ</th></tr>
</table></div>
<p class="note">速い指の切り替えは、1人あたり19音から37音しかありません。全ユーザーを合わせた159音では音程9%対6%と狙いどおりの向きが出ますが、<b>個人ごとでは母数が足りず、まだ向きが安定しません</b>。記録が増えるまでは参考値です。ポジション移動はさらに少なく、ユーザーBは0音です。</p>
</div>

<script>
const DATA = __DATA__;
const NAMES = __NAMES__;
const STRINGS = ["E","A","D","G"];
const ST_COLOR = { stable:"var(--st-stable)", sharp:"var(--st-sharp)", flat:"var(--st-flat)", unstable:"var(--st-unstable)" };
const ST_LABEL = { stable:"安定", sharp:"高すぎ", flat:"低すぎ", unstable:"両方にブレる" };

function fingerboard(cells){
  const NMAX = 12, W = 306, LEFT = 26, CW = (W-LEFT-6)/NMAX, RH = 21, H = RH*4 + 20;
  const byId = {};
  for(const c of cells) byId[c.s+c.n] = c;
  let g = "";
  // 指板の地
  g += '<rect x="'+LEFT+'" y="8" width="'+(W-LEFT-6)+'" height="'+(RH*4)+'" rx="3" fill="#14213a" stroke="#24365c"/>';
  // ポジションの目安線
  for(const n of [1,4,7,11]){
    const x = LEFT + n*CW;
    g += '<line x1="'+x.toFixed(1)+'" y1="8" x2="'+x.toFixed(1)+'" y2="'+(8+RH*4)+'" stroke="#1f3055"/>';
  }
  STRINGS.forEach(function(s,si){
    const y = 8 + si*RH;
    g += '<text x="'+(LEFT-7)+'" y="'+(y+RH/2+3.5)+'" text-anchor="end" fill="#9db0d0" font-size="9.5">'+s+'</text>';
    g += '<line x1="'+LEFT+'" y1="'+(y+RH/2)+'" x2="'+(W-6)+'" y2="'+(y+RH/2)+'" stroke="#2a3d63" stroke-width="0.8"/>';
    for(let n=1;n<=NMAX;n++){
      const c = byId[s+n];
      const x = LEFT + (n-1)*CW + 1;
      if(!c || c.status==="insufficient") continue;
      g += '<rect x="'+x.toFixed(1)+'" y="'+(y+2.5)+'" width="'+(CW-2).toFixed(1)+'" height="'+(RH-5)+'" rx="2.5" fill="'+ST_COLOR[c.status]+'" opacity="0.85"><title>'+s+'線 '+n+' ・ '+ST_LABEL[c.status]+' ・ '+c.total+'音</title></rect>';
    }
  });
  // ポジションの目盛り
  ["1","2","3","4"].forEach(function(p,i){
    const n=[1,4,7,11][i];
    g += '<text x="'+(LEFT+(n-0.5)*CW).toFixed(1)+'" y="'+(8+RH*4+12)+'" text-anchor="middle" fill="#6e83a8" font-size="9">第'+p+'</text>';
  });
  return '<div class="fb"><svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="指板ヒートマップ">'+g+'</svg>'
    +'<div class="fbLeg">'
    + Object.keys(ST_LABEL).map(function(k){return '<span><i style="background:'+ST_COLOR[k]+'"></i>'+ST_LABEL[k]+'</span>'}).join("")
    +'<span><i style="background:#243palette"></i></span>'.replace('<span><i style="background:#243palette"></i></span>','<span style="color:var(--dim)">色なし = 判定できる音が5つ未満</span>')
    +'</div></div>';
}
function finding(cells){
  const bad = cells.filter(function(c){return c.status==="sharp"||c.status==="flat"||c.status==="unstable"})
    .sort(function(a,b){return b.total-a.total})[0];
  if(!bad) return '<div class="find">この期間は、色がつくほどの苦手なマスは出ていないよ</div>';
  return '<div class="find">いちばん多いのは <b>'+bad.s+'線 '+bad.n+'</b> の '+ST_LABEL[bad.status]+' ・ '+bad.total+'音</div>';
}
function pct(b){ return b && b.n ? Math.round(b.ng/b.n*100)+"%" : null }
function twoBox(a, b, la, lb){
  const va = pct(a), vb = pct(b);
  return '<div class="cmp">'
    +'<div class="cmpBox now"><div class="k">'+la+'</div><div class="v">'+(va??"—")+'</div><div class="n">'+(a&&a.n?a.n+"音":"0音")+'</div></div>'
    +'<div class="cmpBox"><div class="k">'+lb+'</div><div class="v">'+(vb??"—")+'</div><div class="n">'+(b&&b.n?b.n+"音":"0音")+'</div></div>'
    +'</div>';
}
function reco(t, sub){
  if(!t) return '<a class="reco none"><span class="k">おすすめ</span><span class="t">この項目の教材はまだ無いよ</span></a>';
  return '<a class="reco" href="#"><span class="k">おすすめ</span><span class="t">'+t+'</span><span class="go">&rarr;</span></a>';
}
function section(kick, title, body){
  return '<div class="sec"><div class="kick">'+kick+'</div><div class="secTitle">'+title+'</div>'+body+'</div>';
}
function card(u){
  const litAll = u.skills.reduce(function(s,c){return s+c.lit},0);
  let h = '<h2 class="kt">成長カルテ</h2>'
    +'<div class="hero">'
    +'<div class="kpi"><b>'+u.records+'</b><span>録音</span></div>'
    +'<div class="kpi"><b>'+u.cells.filter(function(c){return c.status!=="insufficient"}).length+'</b><span>判定できたマス</span></div>'
    +'<div class="kpi"><b>'+litAll+'</b><span>点いたわざ</span></div>'
    +'</div>';
  h += section("SOUND","音のクセ", fingerboard(u.cells)+finding(u.cells));
  h += '<div class="rule"></div>';
  h += section("SPEED","速い指の切り替え",
    '<div class="card">'
    + twoBox(u.fast.p, u.slow.p, "0.3秒未満で入った音", "ゆっくり入った音")
    + reco("弓とリズムの練習 ・ G線")
    + '</div>');
  h += '<div class="rule"></div>';
  const hasShift = u.shift.moved.p.n > 0;
  h += section("SHIFT","ポジション移動",
    '<div class="card">'
    + (hasShift ? twoBox(u.shift.moved.p, u.shift.none.p, "移動した直後の音", "移動しない音")
               : '<div class="na" style="padding:6px 2px 10px">まだ判定できる音が少ないよ ・ 0音</div>')
    + reco(null)
    + '</div>');
  h += '<div class="rule"></div>';
  h += section("SKILLS","わざの習得状況",
    u.skills.map(function(c){
      return '<div class="catRow"><span class="catLab">'+c.label+'</span>'
        +'<span class="catBar"><i style="width:'+(c.total?c.lit/c.total*100:0)+'%"></i></span>'
        +'<span class="catN">'+c.lit+' / '+c.total+'</span></div>';
    }).join("")
    + '<a class="chapLink" href="#">技術マップへ</a>');
  h += '<div class="rule"></div>';
  h += section("ESPRESSIONE","表現の習得状況",
    '<div class="letter"><div class="k">先生とつながると開放</div>'
    +'<div class="t">表現は、先生の耳から</div>'
    +'<div class="b">音の表情は機械では測りきれないところ。先生とつながると、ここに表現の習得状況が並びます。</div></div>');
  h += '<div class="rule"></div>';
  h += section("CARDS","カードアルバム",
    '<div class="card" style="display:flex;align-items:baseline;gap:8px">'
    +'<span style="font-size:12.5px;color:var(--sub)">あつめたカード</span>'
    +'<span style="margin-left:auto;font-weight:900;font-size:15px">3 / 10</span></div>'
    +'<a class="chapLink" href="#">アルバムへ</a>');
  return h;
}
const host=document.getElementById("mocks");
const ORDER=["cmmm46xn40","cmlyl3rf20","cmoecf4zv0"];
const sorted=ORDER.map(function(id){return DATA.filter(function(d){return d.uid===id})[0]}).filter(Boolean);
sorted.forEach(function(u){
  const el=document.createElement("div");
  el.className="phone";
  el.innerHTML='<p class="phoneCap">'+(NAMES[u.uid]||u.uid)+'</p>'+card(u);
  host.appendChild(el);
});
const tbl=document.getElementById("stateTable");
sorted.forEach(function(u){
  const f=function(b){ return b&&b.n ? Math.round(b.ng/b.n*100)+"% ("+b.n+"音)" : "0音" };
  const tr=document.createElement("tr");
  tr.innerHTML='<td>'+(NAMES[u.uid]||u.uid)+'</td><td>'+u.records+'件</td>'
    +'<td>'+u.cells.filter(function(c){return c.status!=="insufficient"}).length+' / '+u.cells.length+'</td>'
    +'<td>'+f(u.fast.p)+'</td><td>'+f(u.shift.moved.p)+'</td>'
    +'<td>'+u.skills.reduce(function(s,c){return s+c.lit},0)+' / '+u.skills.reduce(function(s,c){return s+c.total},0)+'</td>';
  tbl.appendChild(tr);
});
</script>
"""
html = html.replace("__DATA__", payload).replace("__NAMES__", json.dumps(NAMES, ensure_ascii=False))
out = os.path.join(SP, "karte-top.html")
io.open(out, "w", encoding="utf-8").write(html)
print(out, len(html), "bytes")
