# -*- coding: utf-8 -*-
import json, io, os
SP = os.environ.get("SP")
data = json.load(io.open("_tmp/habit_star.json", encoding="utf-8"))
NAMES = {"cmlyl3rf20": "ユーザーA", "cmoecf4zv0": "ユーザーB", "cmmm46xn40": "ユーザーC"}
payload = json.dumps(data, ensure_ascii=False)

html = r"""<title>カルテ総合所見</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700;900&display=swap">
<style>
:root{
  --ink:#0a1526; --panel:#12203a; --deep:#0b1526; --line:#24365c;
  --text:#eaf0fb; --sub:#9db0d0; --dim:#6e83a8;
  --blue:#2b5bc4; --blue2:#3f74e0; --gold:#d9a93c; --warm:#e08e64;
}
*{box-sizing:border-box}
body{margin:0;background:var(--ink);color:var(--text);
  font-family:"Zen Kaku Gothic New","Hiragino Kaku Gothic ProN",system-ui,sans-serif;
  font-size:15px;line-height:1.7;-webkit-font-smoothing:antialiased}
.wrap{max-width:1120px;margin:0 auto;padding:34px 20px 80px}
h1{font-size:27px;font-weight:900;margin:0 0 6px;letter-spacing:.02em}
.lead{color:var(--sub);margin:0 0 26px;max-width:66ch}
h2{font-size:13.5px;font-weight:700;color:var(--dim);letter-spacing:.15em;
  margin:44px 0 14px;padding-bottom:8px;border-bottom:1px solid var(--line)}

.grid{display:grid;gap:22px;grid-template-columns:repeat(auto-fit,minmax(340px,1fr))}
.phone{background:var(--panel);border:1px solid var(--line);border-radius:20px;
  padding:18px 16px 20px;box-shadow:0 18px 46px rgba(0,0,0,.42)}
.phoneCap{font-size:12px;color:var(--dim);letter-spacing:.08em;margin:0 0 12px}

.tabs{display:flex;gap:6px;background:var(--deep);border:1px solid var(--line);
  border-radius:11px;padding:4px;margin-bottom:9px}
.tab{flex:1;border:0;background:transparent;color:var(--sub);font:inherit;font-size:12.5px;
  font-weight:700;padding:7px 4px;border-radius:8px;cursor:pointer;transition:.16s}
.tab:hover{color:var(--text)}
.tab[aria-selected=true]{background:var(--blue);color:#fff}
.tab:focus-visible{outline:2px solid var(--blue2);outline-offset:2px}
.stars{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}
.st{border:1px solid var(--line);background:var(--deep);color:var(--sub);font:inherit;
  font-size:12px;font-weight:700;padding:5px 12px;border-radius:999px;cursor:pointer;transition:.16s}
.st:hover{color:var(--text)}
.st[aria-selected=true]{background:rgba(217,169,60,.16);border-color:rgba(217,169,60,.55);color:var(--gold)}
.st:focus-visible{outline:2px solid var(--blue2);outline-offset:2px}

.total{display:flex;align-items:baseline;gap:9px;flex-wrap:wrap;
  padding:12px 13px;background:var(--deep);border:1px solid var(--line);border-radius:12px}
.total .lab{font-size:11px;color:var(--dim);letter-spacing:.08em}
.total .a{font-size:18px;font-weight:700;color:var(--sub);font-variant-numeric:tabular-nums}
.arw{color:var(--dim)}
.total .b{font-size:28px;font-weight:900;font-variant-numeric:tabular-nums;line-height:1}
.chip{margin-left:auto;font-size:12px;font-weight:900;padding:3px 10px;border-radius:999px;
  font-variant-numeric:tabular-nums}
.up{background:rgba(217,169,60,.15);color:var(--gold);border:1px solid rgba(217,169,60,.4)}
.down{background:rgba(224,142,100,.14);color:var(--warm);border:1px solid rgba(224,142,100,.42)}

.radar{margin-top:13px;background:var(--deep);border:1px solid var(--line);
  border-radius:14px;padding:12px 34px 10px}
.radar svg{display:block;width:100%;height:auto;overflow:visible}
.legend{display:flex;justify-content:center;gap:16px;font-size:11.5px;color:var(--sub);margin-top:2px}
.legend i{display:inline-block;width:15px;height:0;border-top:3px solid;border-radius:2px;
  vertical-align:middle;margin-right:5px}
.legend .l1{border-color:#46608f;border-top-style:dashed}
.legend .l2{border-color:var(--gold)}

/* 6項目の行 */
.rows{margin-top:13px;display:flex;flex-direction:column;gap:6px}
.row{background:var(--deep);border:1px solid var(--line);border-radius:12px;padding:11px 12px}
.rowTop{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin-bottom:9px}
.rowName{font-weight:700;font-size:13.5px}
.rowVal{margin-left:auto;font-size:12px;color:var(--sub);font-variant-numeric:tabular-nums}
.rowVal b{color:var(--text);font-size:14.5px}
.bar{position:relative;height:7px;border-radius:4px;background:#16233d;overflow:hidden}
.bar i{position:absolute;top:0;bottom:0;left:0;border-radius:4px;display:block}
.was{background:#31456e}
.now{background:linear-gradient(90deg,var(--blue),var(--blue2))}
.meter{position:relative;height:22px}
.meter .track{position:absolute;left:0;right:0;top:9px;height:4px;border-radius:3px;
  background:linear-gradient(90deg,#31456e,#16233d 50%,#31456e)}
.meter .mid{position:absolute;left:50%;top:4px;width:1px;height:14px;background:var(--dim)}
.meter .pin{position:absolute;top:2px;width:2px;height:18px;background:var(--sub);transform:translateX(-50%)}
.meter .pin.now{width:10px;height:10px;border-radius:50%;top:6px;background:var(--gold);
  box-shadow:0 0 0 3px rgba(217,169,60,.18)}
.reco{display:flex;align-items:center;gap:8px;margin-top:10px;padding:9px 10px;border-radius:9px;
  background:rgba(43,91,196,.16);border:1px solid rgba(63,116,224,.34);font-size:12.5px;
  color:#cfdcff;text-decoration:none}
.reco .k{font-size:10.5px;color:#8fa9e8;letter-spacing:.08em;flex:none}
.reco .t{font-weight:700;color:var(--text)}
.reco .go{margin-left:auto;color:#8fa9e8;flex:none}
.reco.none{background:transparent;border-style:dashed;border-color:var(--line);color:var(--dim)}
.reco.none .t{color:var(--sub);font-weight:400}
.na{color:var(--dim);font-size:12px}

.did{margin-top:14px;padding:11px 12px;background:var(--deep);border:1px solid var(--line);
  border-radius:12px;font-size:13px}
.did .lab{font-size:10.5px;color:var(--dim);letter-spacing:.1em;margin-bottom:4px}
.empty{padding:28px 14px;text-align:center;color:var(--sub);background:var(--deep);
  border:1px dashed var(--line);border-radius:13px}
.empty b{display:block;color:var(--text);margin-bottom:5px}

table{width:100%;border-collapse:collapse;font-size:13px}
th,td{text-align:left;padding:9px 10px;border-bottom:1px solid var(--line);vertical-align:top}
th{color:var(--dim);font-weight:700;font-size:12px;letter-spacing:.06em}
td b{color:var(--gold)} td.bad{color:var(--warm)}
.note{color:var(--sub);font-size:13.5px;margin:12px 0 0;max-width:74ch}
.scroll{overflow-x:auto}
.spec{display:grid;gap:1px;background:var(--line);border:1px solid var(--line);border-radius:14px;overflow:hidden}
.sp{display:flex;gap:14px;background:var(--panel);padding:11px 14px;font-size:13.5px;flex-wrap:wrap}
.sp .k{flex:none;width:104px;color:var(--gold);font-weight:700;font-size:12.5px}
.sp .v{color:var(--sub);flex:1;min-width:200px}
.warn{margin-top:16px;padding:18px 20px;border-radius:16px;
  background:linear-gradient(135deg,rgba(224,142,100,.13),rgba(224,142,100,.03));
  border:1px solid rgba(224,142,100,.36)}
.warn h3{margin:0 0 8px;font-size:16px;font-weight:900;color:var(--warm)}
.warn p{margin:0 0 8px;color:var(--sub);font-size:14px}
.warn p:last-child{margin-bottom:0}
.warn b{color:var(--text)}
</style>

<div class="wrap">
<h1>カルテ総合所見</h1>
<p class="lead">★ごとに箱を分け、六角のかたちと6項目の内訳を見る画面。項目ごとにおすすめ練習を同じ画面に置きます。数字はすべて本番データベースの実ユーザーの記録から計算したもので、作り値はありません。</p>

<h2>確定していること</h2>
<div class="spec">
<div class="sp"><span class="k">出す項目</span><span class="v">演奏のクセ6つ ・ 走り ・ もたり / 上ずり ・ ぶら下がり / 細かい音 / 弦をまたぐ / 跳躍 / ポジション移動</span></div>
<div class="sp"><span class="k">見せ方</span><span class="v">六角のかたちを主役に、6項目の内訳を下に並べる</span></div>
<div class="sp"><span class="k">おすすめ</span><span class="v">項目ごとに同じ画面へ置く。教材がまだ無い項目は、無いと書く</span></div>
<div class="sp"><span class="k">期間</span><span class="v">タブで選ぶ ・ 1か月 / 3か月 / はじめから</span></div>
<div class="sp"><span class="k">★</span><span class="v">箱を分ける。★の付かない曲は じぶんの楽譜 という別箱にまとめ、★には混ぜない</span></div>
<div class="sp"><span class="k">ことば</span><span class="v">尺度は はずした音 / 走り / もたり / 上ずり / ぶら下がり の5語だけ。よい わるい の言い換えは使わない</span></div>
<div class="sp"><span class="k">足切り</span><span class="v">20音。満たない項目は数字を出さず、かたちからも外す</span></div>
<div class="sp"><span class="k">除外</span><span class="v">ポジション移動は 移動なし を母数から除く</span></div>
</div>

<h2>画面</h2>
<div class="grid" id="mocks"></div>
<p class="note">期間タブと★の箱はどちらも実際に動きます。おすすめ練習は本番の教材在庫から引いています。<b>ポジション移動だけは教材が1件もありません</b>。族も0件で、いまは作るところからです。</p>

<h2>★で分けると数字がどう変わるか</h2>
<div class="scroll"><table id="cmpTable">
<tr><th>ユーザー</th><th>★を混ぜた場合</th><th>★で分けた場合</th><th>何が起きていたか</th></tr>
</table></div>

<h2>★で分けても残るもの</h2>
<div class="warn">
<h3>同じ★の中の曲差までは取れません</h3>
<p><b>ユーザーA</b>は22回すべてがマイ楽譜で、はじめから 42.1 から 15.7 へ落ちています。ところが曲ごとに見ると、sample1 が 53.4 から 40.3、糸が 14.2 から 7.0、G線上のアリアが 13.7 から 15.7 です。落ちた正体は<b>曲の入れ替わり</b>で、53点台の曲から13点台の曲へ移っただけです。</p>
<p>★で分けてもこれは残ります。★が同じでも曲ごとの難しさは違うからです。ここまで取るには曲の難度をデータから較正する必要があり、それが偏差値の設計にあたります。いまは着手しない前提なので、★で分けるところまでを今回の範囲とします。</p>
</div>
</div>

<script>
const DATA = __DATA__;
const NAMES = __NAMES__;

/* ことばの尺度は5語だけ: はずした音 / 走り / もたり / 上ずり / ぶら下がり */
const AX = [
  {key:"tempo", label:"走り ・ もたり", kind:"meter", range:100, part:0, unit:"%",
   dir:function(v){ return v<0?"もたり":"走り" }},
  {key:"fine",  label:"細かい音",       kind:"rate", part:0},
  {key:"cross", label:"弦をまたぐ",     kind:"rate", part:1},
  {key:"leap",  label:"跳躍",           kind:"rate", part:1},
  {key:"shift", label:"ポジション移動", kind:"rate", part:1},
  {key:"cents", label:"上ずり ・ ぶら下がり", kind:"meter", range:30, part:2, unit:"セント",
   dir:function(v){ return v<0?"ぶら下がり":"上ずり" }}
];
/* おすすめ練習 ・ 本番の教材在庫から (2026-09-02 時点) */
const RECO = {
  tempo:{title:"A線 ・ 開放弦の練習", sub:"ボウイング ・ ★1"},
  cents:{title:"音階 1オクターブ", sub:"音階 ・ 12調"},
  fine:{title:"カイザー No.1 ・ 16音符", sub:"エチュード ・ ★2"},
  cross:{title:"3度音程と移弦の練習", sub:"ボウイング ・ ★1"},
  leap:{title:"アルペジオ 2オクターブ", sub:"アルペジオ ・ 12調"},
  shift:null
};

function axVals(t, ax){
  if(ax.key==="tempo") return [t.tempoA?t.tempoA.bias:null, t.tempoB?t.tempoB.bias:null];
  if(ax.key==="cents") return [t.centsA?t.centsA.cents:null, t.centsB?t.centsB.cents:null];
  const r=t.rows.filter(function(r){return r.key===ax.key})[0];
  return [r?r.a.rate:null, r?r.b.rate:null];
}
function good(ax,v){
  if(v==null) return null;
  if(ax.kind==="meter") return 1-Math.min(Math.abs(v),ax.range)/ax.range;
  return 1-v/100;
}
function head(t){
  const d=Math.round((t.scoreB-t.scoreA)*10)/10;
  return '<div class="total"><span class="lab">'+t.starLabel+' の平均点</span><span class="a">'+t.scoreA+'</span>'
    +'<span class="arw">&rarr;</span><span class="b">'+t.scoreB+'</span>'
    +'<span class="chip '+(d>=0?"up":"down")+'">'+(d>=0?"+":"")+d+'</span></div>';
}
function radar(t){
  const S=250, cx=125, cy=125, R=82, IN=0.12;
  const th=function(i){return -Math.PI/2 + i*Math.PI/3};
  const at=function(i,r){return [cx+r*Math.cos(th(i)), cy+r*Math.sin(th(i))]};
  const g=function(w){return AX.map(function(ax){return good(ax, axVals(t,ax)[w])})};
  const ga=g(0), gb=g(1);
  const known=AX.map(function(_,i){return ga[i]!=null&&gb[i]!=null});
  const rings=[.25,.5,.75,1].map(function(k){return '<polygon points="'
    +AX.map(function(_,i){return at(i,R*k).map(function(v){return v.toFixed(1)}).join(",")}).join(" ")
    +'" fill="none" stroke="#1b2b49"/>'}).join("");
  const spokes=AX.map(function(_,i){const p=at(i,R);
    return '<line x1="'+cx+'" y1="'+cy+'" x2="'+p[0].toFixed(1)+'" y2="'+p[1].toFixed(1)+'" stroke="#1b2b49"/>'}).join("");
  const poly=function(gv,extra){
    const pts=AX.map(function(_,i){return known[i]?at(i,(IN+gv[i]*(1-IN))*R):null}).filter(Boolean);
    if(pts.length<3) return "";
    return '<polygon points="'+pts.map(function(p){return p[0].toFixed(1)+","+p[1].toFixed(1)}).join(" ")+'" '+extra+'/>';
  };
  const dots=AX.map(function(ax,i){
    if(known[i]) return "";
    const p=at(i,R);
    return '<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="3.4" fill="none" stroke="#46608f" stroke-dasharray="2 2"/>';
  }).join("");
  const labels=AX.map(function(ax,i){
    const p=at(i,R+18), c=Math.cos(th(i));
    const anc=Math.abs(c)<0.25?"middle":(c>0?"start":"end");
    const parts=ax.label.split(" ・ ");
    const fill=known[i]?"#9db0d0":"#4b5f82";
    if(parts.length===2 && ax.label.length>7){
      return '<text x="'+p[0].toFixed(0)+'" y="'+(p[1]-2).toFixed(0)+'" text-anchor="'+anc+'" fill="'+fill+'" font-size="10">'+parts[0]+' ・</text>'
           + '<text x="'+p[0].toFixed(0)+'" y="'+(p[1]+10).toFixed(0)+'" text-anchor="'+anc+'" fill="'+fill+'" font-size="10">'+parts[1]+'</text>';
    }
    return '<text x="'+p[0].toFixed(0)+'" y="'+(p[1]+4).toFixed(0)+'" text-anchor="'+anc+'" fill="'+fill+'" font-size="10">'+ax.label+'</text>';
  }).join("");
  return '<div class="radar"><svg viewBox="0 0 '+S+' '+S+'" role="img" aria-label="クセ6項目のかたち">'
    +rings+spokes
    +poly(ga,'fill="none" stroke="#46608f" stroke-width="2" stroke-dasharray="4 3"')
    +poly(gb,'fill="rgba(217,169,60,.17)" stroke="#d9a93c" stroke-width="2.4" stroke-linejoin="round"')
    +dots+labels+'</svg>'
    +'<div class="legend"><span><i class="l1"></i>起点</span><span><i class="l2"></i>いま</span></div></div>';
}
function recoBlock(ax){
  const r=RECO[ax.key];
  if(!r) return '<div class="reco none"><span class="k">おすすめ</span>'
    +'<span class="t">この項目の教材はまだ無いよ</span></div>';
  return '<a class="reco" href="#"><span class="k">おすすめ</span>'
    +'<span class="t">'+r.title+'</span><span class="go">&rarr;</span></a>';
}
function rowBlock(t,ax){
  const v=axVals(t,ax), a=v[0], b=v[1];
  if(a==null||b==null){
    return '<div class="row"><div class="rowTop"><span class="rowName">'+ax.label+'</span>'
      +'<span class="rowVal na">まだ判定できる音が少ないよ</span></div>'+recoBlock(ax)+'</div>';
  }
  let body;
  if(ax.kind==="meter"){
    const p=function(x){return 50+Math.max(-50,Math.min(50,x/ax.range*50))};
    body='<div class="meter"><div class="track"></div><div class="mid"></div>'
      +'<div class="pin" style="left:'+p(a)+'%"></div>'
      +'<div class="pin now" style="left:'+p(b)+'%"></div></div>';
  }else{
    body='<div class="bar"><i class="was" style="width:'+a+'%"></i><i class="now" style="width:'+b+'%"></i></div>';
  }
  let txt;
  if(ax.kind==="meter"){
    const da=ax.dir(a), db=ax.dir(b);
    txt = (da===db)
      ? (da+' '+Math.abs(a)+' <span class="arw">&rarr;</span> <b>'+Math.abs(b)+ax.unit+'</b>')
      : (da+' '+Math.abs(a)+' <span class="arw">&rarr;</span> <b>'+db+' '+Math.abs(b)+ax.unit+'</b>');
  }else{
    txt = 'はずした音 '+a+'% <span class="arw">&rarr;</span> <b>'+b+'%</b>';
  }
  return '<div class="row"><div class="rowTop"><span class="rowName">'+ax.label+'</span>'
    +'<span class="rowVal">'+txt+'</span></div>'+body+recoBlock(ax)+'</div>';
}
function foot(t){
  return '<div class="did"><div class="lab">この期間に弾いたもの</div>'
    + t.songs.map(function(s){return s.title+" ×"+s.n}).join(" ・ ")+'</div>';
}
function renderBox(t){
  if(!t.ok){
    return '<div class="empty"><b>'+t.starLabel+' のこの期間の記録は '+t.n+' 回</b>あと '
      +Math.max(1,4-t.n)+' 回ふえると、ここに変化が出るよ</div>';
  }
  return head(t)+radar(t)
    +'<div class="rows">'+AX.map(function(ax){return rowBlock(t,ax)}).join("")+'</div>'
    +foot(t);
}

const host=document.getElementById("mocks");
const ORDER=["cmoecf4zv0","cmmm46xn40","cmlyl3rf20"];
const sorted=ORDER.map(function(id){return DATA.filter(function(d){return d.uid===id})[0]}).filter(Boolean);
sorted.forEach(function(u){
  const el=document.createElement("div");
  el.className="phone";
  el.innerHTML='<p class="phoneCap">'+(NAMES[u.uid]||u.uid)+'</p>'
    +'<div class="tabs" role="tablist"></div>'
    +'<div class="stars" role="tablist"></div>'
    +'<div class="body"></div>';
  const tabs=el.querySelector(".tabs"), stars=el.querySelector(".stars"), body=el.querySelector(".body");
  let si=0;
  u.stars.forEach(function(s,i){ if(s.total>u.stars[si].total) si=i });
  let ti=u.stars[si].tabs.map(function(t){return t.ok}).indexOf(true);
  if(ti<0) ti=u.stars[si].tabs.length-1;
  const draw=function(){
    Array.prototype.forEach.call(tabs.children,function(c,i){c.setAttribute("aria-selected",String(i===ti))});
    Array.prototype.forEach.call(stars.children,function(c,i){c.setAttribute("aria-selected",String(i===si))});
    body.innerHTML=renderBox(u.stars[si].tabs[ti]);
  };
  u.stars[0].tabs.forEach(function(t,i){
    const b=document.createElement("button");
    b.className="tab"; b.type="button"; b.setAttribute("role","tab"); b.textContent=t.label;
    b.onclick=function(){ ti=i; draw() };
    tabs.appendChild(b);
  });
  u.stars.forEach(function(s,i){
    const b=document.createElement("button");
    b.className="st"; b.type="button"; b.setAttribute("role","tab"); b.textContent=s.label;
    b.onclick=function(){ si=i; draw() };
    stars.appendChild(b);
  });
  draw();
  host.appendChild(el);
});

const cmp=document.getElementById("cmpTable");
const WHY={
  cmoecf4zv0:"最初の1回がマイ楽譜で0点。混ぜると伸びが3倍以上に盛れる",
  cmmm46xn40:"易しいじぶんの楽譜へ移った。混ぜると伸びに見えるが★1では落ちている",
  cmlyl3rf20:"全部マイ楽譜なので箱は1つ。曲の入れ替わりぶんは★では取れない"
};
sorted.forEach(function(u){
  const mixed=u.mixed[u.mixed.length-1];
  let main=u.stars[0];
  u.stars.forEach(function(s){ if(s.total>main.total) main=s });
  const box=main.tabs[main.tabs.length-1];
  const f=function(t){ return t&&t.ok ? (t.scoreA+" → "+t.scoreB+" ("+(t.scoreB-t.scoreA>=0?"+":"")+Math.round((t.scoreB-t.scoreA)*10)/10+")") : "出せない" };
  const d1=mixed&&mixed.ok?mixed.scoreB-mixed.scoreA:null, d2=box&&box.ok?box.scoreB-box.scoreA:null;
  const flip=d1!=null&&d2!=null&&((d1>=0)!==(d2>=0));
  const tr=document.createElement("tr");
  tr.innerHTML='<td>'+(NAMES[u.uid]||u.uid)+'</td><td>'+f(mixed)+'</td>'
    +'<td>'+main.label+' <b>'+f(box)+'</b></td>'
    +'<td'+(flip?' class="bad"':'')+'>'+(flip?"向きが逆転 ・ ":"")+(WHY[u.uid]||"")+'</td>';
  cmp.appendChild(tr);
});
</script>
"""
html = html.replace("__DATA__", payload).replace("__NAMES__", json.dumps(NAMES, ensure_ascii=False))
out = os.path.join(SP, "karte-hero.html")
io.open(out, "w", encoding="utf-8").write(html)
print(out, len(html), "bytes")
