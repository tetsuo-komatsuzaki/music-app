# -*- coding: utf-8 -*-
import json, io, os
SP = os.environ.get("SP")
data = json.load(io.open("_tmp/karte_top.json", encoding="utf-8"))
NAMES = {"cmlyl3rf20": "ユーザーA", "cmoecf4zv0": "ユーザーB", "cmmm46xn40": "ユーザーC"}
payload = json.dumps(data, ensure_ascii=False)

html = r"""<title>成長カルテ 新構成 5案</title>
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
.lead{color:var(--sub);margin:0 0 10px;max-width:68ch}
.who{display:inline-flex;gap:8px;align-items:center;font-size:12px;color:var(--dim);
  border:1px solid var(--line);border-radius:999px;padding:5px 12px;margin-bottom:28px}
.who b{color:var(--gold)}
h2{font-size:13.5px;font-weight:700;color:var(--dim);letter-spacing:.15em;
  margin:44px 0 14px;padding-bottom:8px;border-bottom:1px solid var(--line)}

.case{margin:0 0 38px;background:var(--panel);border:1px solid var(--line);
  border-radius:20px;overflow:hidden;box-shadow:0 16px 40px rgba(0,0,0,.4)}
.caseHead{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;
  padding:15px 20px;border-bottom:1px solid var(--line);background:rgba(43,91,196,.08)}
.num{font-size:12px;font-weight:900;letter-spacing:.16em;color:var(--blue2)}
.caseHead h3{font-size:19px;font-weight:900;margin:0}
.caseHead .tag{margin-left:auto;font-size:12px;color:var(--dim)}
.caseBody{display:grid;grid-template-columns:minmax(300px,360px) 1fr;gap:24px;padding:20px}
@media(max-width:820px){.caseBody{grid-template-columns:1fr}}
.crit dt{font-weight:700;font-size:13px;color:var(--text);margin-top:12px}
.crit dt:first-child{margin-top:0}
.crit dt.g::before{content:"よい ";color:var(--gold);font-size:11px;letter-spacing:.1em}
.crit dt.b::before{content:"よわい ";color:var(--warm);font-size:11px;letter-spacing:.1em}

.screen{background:var(--deep);border:1px solid var(--line);border-radius:16px;padding:14px 12px}
.kt{font-size:17px;font-weight:900;margin:0 2px 11px}
.kick{font-size:9.5px;font-weight:900;letter-spacing:.16em;color:var(--dim)}
.secTitle{font-size:14.5px;font-weight:900;margin:1px 0 8px}
.sec{margin-top:13px}
.card{background:#0e1a2f;border:1px solid var(--line);border-radius:12px;padding:10px 11px}
.rule{height:1px;background:var(--line);margin:13px 0}

.fb{background:#0e1a2f;border:1px solid var(--line);border-radius:12px;padding:11px 9px 9px}
.fb.flat{background:transparent;border:0;padding:0}
.fb svg{display:block;width:100%;height:auto}
.fbLeg{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:8px;font-size:10px;color:var(--sub)}
.fbLeg i{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:4px;vertical-align:-1px}
.find{margin-top:8px;padding:8px 10px;background:rgba(43,91,196,.14);border:1px solid rgba(63,116,224,.3);
  border-radius:9px;font-size:12px}
.find b{color:var(--gold)}

.cmp{display:flex;gap:6px}
.cmpBox{flex:1;background:rgba(11,21,38,.6);border:1px solid var(--line);border-radius:9px;padding:7px 9px}
.cmpBox .k{font-size:9.5px;color:var(--dim)}
.cmpBox .v{font-size:15px;font-weight:900;font-variant-numeric:tabular-nums}
.cmpBox .n{font-size:9.5px;color:var(--dim)}
.cmpBox.now{border-color:rgba(217,169,60,.45);background:rgba(217,169,60,.08)}
.cmpBox.now .v{color:var(--gold)}
.na{color:var(--dim);font-size:11.5px}
.reco{display:flex;align-items:center;gap:8px;margin-top:9px;padding:8px 10px;border-radius:9px;
  background:rgba(43,91,196,.16);border:1px solid rgba(63,116,224,.34);font-size:12px;
  color:#cfdcff;text-decoration:none}
.reco .k{font-size:9.5px;color:#8fa9e8;letter-spacing:.08em;flex:none}
.reco .t{font-weight:700;color:var(--text)}
.reco .go{margin-left:auto;color:#8fa9e8}
.reco.none{background:transparent;border-style:dashed;border-color:var(--line)}
.reco.none .t{color:var(--sub);font-weight:400}

/* 案2 2列 */
.duo{display:flex;gap:8px}
.duo>div{flex:1;background:#0e1a2f;border:1px solid var(--line);border-radius:12px;padding:10px}
.duo .t{font-size:11.5px;font-weight:700;margin-bottom:6px}
.duo .v{font-size:19px;font-weight:900;color:var(--gold);font-variant-numeric:tabular-nums;line-height:1.2}
.duo .s{font-size:10px;color:var(--dim)}
.duo .lk{display:block;margin-top:7px;font-size:10.5px;color:#8fa9e8;text-decoration:none}

/* 案3 結論 */
.verdict{background:linear-gradient(135deg,rgba(217,169,60,.16),rgba(217,169,60,.04));
  border:1px solid rgba(217,169,60,.42);border-radius:14px;padding:13px}
.verdict .k{font-size:9.5px;font-weight:900;letter-spacing:.14em;color:var(--gold)}
.verdict .t{font-size:16px;font-weight:900;margin-top:5px;line-height:1.5}
.verdict .b{font-size:12px;color:var(--sub);margin-top:6px}
.fold{margin-top:9px;border:1px solid var(--line);border-radius:11px;overflow:hidden}
.foldH{display:flex;align-items:center;gap:8px;padding:10px 11px;background:#0e1a2f;
  font-size:12.5px;font-weight:700;cursor:pointer}
.foldH .v{margin-left:auto;font-variant-numeric:tabular-nums;color:var(--sub);font-weight:400;font-size:11.5px}
.caret{width:8px;height:8px;border-right:2px solid var(--dim);border-bottom:2px solid var(--dim);
  transform:rotate(45deg) translateY(-2px);flex:none}
.foldB{padding:10px 11px;background:#0b1526;border-top:1px solid var(--line)}
.foldH[aria-expanded=false]+.foldB{display:none}
.foldH[aria-expanded=true] .caret{transform:rotate(-135deg) translateY(-2px)}

/* 案4 タブ */
.tabs{display:flex;gap:5px;background:#0b1526;border:1px solid var(--line);
  border-radius:10px;padding:3px;margin-bottom:11px}
.tab{flex:1;border:0;background:transparent;color:var(--sub);font:inherit;font-size:11.5px;
  font-weight:700;padding:6px 3px;border-radius:7px;cursor:pointer}
.tab[aria-selected=true]{background:var(--blue);color:#fff}

/* 案5 帯 */
.strip{display:flex;gap:1px;background:var(--line);border:1px solid var(--line);
  border-radius:11px;overflow:hidden;margin-bottom:9px}
.strip>div{flex:1;background:#0e1a2f;padding:8px 6px;text-align:center}
.strip .v{font-size:16px;font-weight:900;font-variant-numeric:tabular-nums}
.strip .k{font-size:9.5px;color:var(--dim);margin-top:1px}
.strip .gold .v{color:var(--gold)}

.catRow{display:flex;align-items:center;gap:9px;margin-top:6px}
.catLab{width:92px;flex:none;font-size:11.5px;color:var(--sub)}
.catBar{flex:1;height:6px;border-radius:4px;background:#16233d;overflow:hidden}
.catBar i{display:block;height:100%;border-radius:4px;background:var(--gold)}
.catN{width:42px;text-align:right;font-size:11px;color:var(--sub);font-variant-numeric:tabular-nums}
.chapLink{display:block;margin-top:9px;text-align:center;font-size:11.5px;font-weight:700;
  color:#a8c2ff;text-decoration:none;padding:7px;border:1px solid var(--line);border-radius:9px}
.tail{opacity:.62}
.tailCap{font-size:10px;color:var(--dim);letter-spacing:.1em;margin:14px 0 0}

.verdictBox{margin-top:34px;padding:18px 20px;border-radius:16px;
  background:linear-gradient(135deg,rgba(217,169,60,.12),rgba(217,169,60,.03));
  border:1px solid rgba(217,169,60,.34)}
.verdictBox h3{margin:0 0 8px;font-size:16px;font-weight:900;color:var(--gold)}
.verdictBox p{margin:0 0 8px;color:var(--sub);font-size:14px}
.verdictBox p:last-child{margin-bottom:0}
.verdictBox b{color:var(--text)}
</style>

<div class="wrap">
<h1>成長カルテ 新構成 5案</h1>
<p class="lead">載せる内容は5案とも同じです。指板をトップに置き、速い指の切り替えとポジション移動を続け、わざから下は既存のまま。変えているのは組み立て方だけ。数字と指板のマスは本番データベースの実ユーザーの記録から計算したもので、作り値はありません。</p>
<div class="who">表示中 <b id="whoName"></b> ・ わざから下は各案とも共通なので、案1にだけ全部を出しています</div>

<div id="cases"></div>

<div class="verdictBox">
<h3>おすすめ</h3>
<p><b>案3 結論を先に出す</b>。カルテを開いた人がまず知りたいのは「いまどこが苦手で、次に何をするか」です。指板は情報量が多いぶん読み解きに時間がかかるので、答えを先に1行で出し、指板はその裏付けとして下に置きます。速い指の切り替えとポジション移動はたたんでおき、必要な人だけ開きます。</p>
<p>次点は<b>案5 帯でまとめる</b>。3つの数字を指板の上に横一列で載せるので、縦が短く、わざから下までが1画面に近づきます。ただし数字だけが並ぶので、何を意味するかは指板を見ないと分かりません。</p>
<p><b>案4 タブ</b>は縦がいちばん短くなりますが、3つのうち2つが常に隠れます。速い指の切り替えとポジション移動はいま母数が少なく空になりがちなので、タブを開いて空だったときの落胆が大きいです。</p>
</div>
</div>

<script>
const DATA = __DATA__;
const NAMES = __NAMES__;
const STRINGS = ["E","A","D","G"];
const ST_COLOR = { stable:"var(--st-stable)", sharp:"var(--st-sharp)", flat:"var(--st-flat)", unstable:"var(--st-unstable)" };
const ST_LABEL = { stable:"安定", sharp:"高すぎ", flat:"低すぎ", unstable:"両方にブレる" };

function fingerboard(cells, compact){
  const NMAX=12, W=306, LEFT=24, CW=(W-LEFT-6)/NMAX, RH=compact?16:20, H=RH*4+(compact?14:20);
  const byId={}; for(const c of cells) byId[c.s+c.n]=c;
  let g='<rect x="'+LEFT+'" y="6" width="'+(W-LEFT-6)+'" height="'+(RH*4)+'" rx="3" fill="#14213a" stroke="#24365c"/>';
  for(const n of [1,4,7,11]){ const x=LEFT+n*CW;
    g+='<line x1="'+x.toFixed(1)+'" y1="6" x2="'+x.toFixed(1)+'" y2="'+(6+RH*4)+'" stroke="#1f3055"/>'; }
  STRINGS.forEach(function(s,si){
    const y=6+si*RH;
    g+='<text x="'+(LEFT-6)+'" y="'+(y+RH/2+3.2)+'" text-anchor="end" fill="#9db0d0" font-size="9">'+s+'</text>';
    g+='<line x1="'+LEFT+'" y1="'+(y+RH/2)+'" x2="'+(W-6)+'" y2="'+(y+RH/2)+'" stroke="#2a3d63" stroke-width="0.8"/>';
    for(let n=1;n<=NMAX;n++){
      const c=byId[s+n]; if(!c||c.status==="insufficient") continue;
      const x=LEFT+(n-1)*CW+1;
      g+='<rect x="'+x.toFixed(1)+'" y="'+(y+2)+'" width="'+(CW-2).toFixed(1)+'" height="'+(RH-4)+'" rx="2.5" fill="'+ST_COLOR[c.status]+'" opacity="0.85"><title>'+s+'線 '+n+' ・ '+ST_LABEL[c.status]+' ・ '+c.total+'音</title></rect>';
    }
  });
  ["1","2","3","4"].forEach(function(p,i){ const n=[1,4,7,11][i];
    g+='<text x="'+(LEFT+(n-0.5)*CW).toFixed(1)+'" y="'+(6+RH*4+11)+'" text-anchor="middle" fill="#6e83a8" font-size="8.5">第'+p+'</text>'; });
  return '<div class="fb'+(compact?" flat":"")+'"><svg viewBox="0 0 '+W+' '+H+'">'+g+'</svg>'
    + (compact?"":'<div class="fbLeg">'+Object.keys(ST_LABEL).map(function(k){
        return '<span><i style="background:'+ST_COLOR[k]+'"></i>'+ST_LABEL[k]+'</span>'}).join("")
      +'<span style="color:var(--dim)">色なし = 5音未満</span></div>')
    +'</div>';
}
function worstCell(cells){
  return cells.filter(function(c){return c.status==="sharp"||c.status==="flat"||c.status==="unstable"})
    .sort(function(a,b){return b.total-a.total})[0] || null;
}
function pct(b){ return b&&b.n ? Math.round(b.ng/b.n*100)+"%" : null }
function twoBox(a,b,la,lb){
  return '<div class="cmp">'
    +'<div class="cmpBox now"><div class="k">'+la+'</div><div class="v">'+(pct(a)??"—")+'</div><div class="n">'+((a&&a.n)||0)+'音</div></div>'
    +'<div class="cmpBox"><div class="k">'+lb+'</div><div class="v">'+(pct(b)??"—")+'</div><div class="n">'+((b&&b.n)||0)+'音</div></div></div>';
}
function reco(t){
  return t ? '<a class="reco" href="#"><span class="k">おすすめ</span><span class="t">'+t+'</span><span class="go">&rarr;</span></a>'
           : '<a class="reco none"><span class="k">おすすめ</span><span class="t">この項目の教材はまだ無いよ</span></a>';
}
function sec(k,t,body){ return '<div class="sec"><div class="kick">'+k+'</div><div class="secTitle">'+t+'</div>'+body+'</div>' }
function shiftBody(u){
  return u.shift.moved.p.n>0 ? twoBox(u.shift.moved.p,u.shift.none.p,"移動した直後の音","移動しない音")
    : '<div class="na" style="padding:4px 2px 8px">まだ判定できる音が少ないよ ・ 0音</div>';
}
function tail(u, faded){
  const s = u.skills.map(function(c){
    return '<div class="catRow"><span class="catLab">'+c.label+'</span>'
      +'<span class="catBar"><i style="width:'+(c.total?c.lit/c.total*100:0)+'%"></i></span>'
      +'<span class="catN">'+c.lit+' / '+c.total+'</span></div>';
  }).join("");
  return '<div class="'+(faded?"tail":"")+'">'
    +'<div class="rule"></div>'
    + sec("SKILLS","わざの習得状況", s+'<a class="chapLink" href="#">技術マップへ</a>')
    +'<div class="rule"></div>'
    + sec("ESPRESSIONE","表現の習得状況",
        '<div class="card" style="border-color:rgba(232,178,60,.3)"><div style="font-size:9.5px;font-weight:900;letter-spacing:.12em;color:#a9833b">先生とつながると開放</div>'
        +'<div style="font-size:13.5px;font-weight:900;margin-top:5px">表現は、先生の耳から</div></div>')
    +'<div class="rule"></div>'
    + sec("CARDS","カードアルバム",
        '<div class="card" style="display:flex;align-items:baseline"><span style="font-size:12px;color:var(--sub)">あつめたカード</span>'
        +'<span style="margin-left:auto;font-weight:900">3 / 10</span></div>')
    +'</div>';
}
const RECO_FAST = "弓とリズムの練習 ・ G線";

/* 案1 積み上げ */
function v1(u){
  return '<h2 class="kt">成長カルテ</h2>'
    + sec("SOUND","音のクセ", fingerboard(u.cells)
        + (worstCell(u.cells)? '<div class="find">いちばん多いのは <b>'+worstCell(u.cells).s+'線 '+worstCell(u.cells).n+'</b> の '+ST_LABEL[worstCell(u.cells).status]+' ・ '+worstCell(u.cells).total+'音</div>':''))
    + '<div class="rule"></div>'
    + sec("SPEED","速い指の切り替え", '<div class="card">'+twoBox(u.fast.p,u.slow.p,"0.3秒未満で入った音","ゆっくり入った音")+reco(RECO_FAST)+'</div>')
    + '<div class="rule"></div>'
    + sec("SHIFT","ポジション移動", '<div class="card">'+shiftBody(u)+reco(null)+'</div>')
    + tail(u, false);
}
/* 案2 2列にまとめる */
function v2(u){
  const w=worstCell(u.cells);
  return '<h2 class="kt">成長カルテ</h2>'
    + sec("SOUND","音のクセ", fingerboard(u.cells)
        + (w? '<div class="find">いちばん多いのは <b>'+w.s+'線 '+w.n+'</b> の '+ST_LABEL[w.status]+'</div>':'')
        + '<div class="duo" style="margin-top:9px">'
        + '<div><div class="t">速い指の切り替え</div><div class="v">'+(pct(u.fast.p)??"—")+'</div>'
        + '<div class="s">0.3秒未満 ・ '+u.fast.p.n+'音</div><a class="lk" href="#">弓とリズムの練習へ &rarr;</a></div>'
        + '<div><div class="t">ポジション移動</div><div class="v">'+(pct(u.shift.moved.p)??"—")+'</div>'
        + '<div class="s">移動した直後 ・ '+u.shift.moved.p.n+'音</div><a class="lk" href="#" style="color:var(--dim)">教材はまだ無いよ</a></div>'
        + '</div>')
    + tail(u, true);
}
/* 案3 結論を先に */
function v3(u){
  const w=worstCell(u.cells);
  const head = w ? (w.s+'線 '+w.n+' が '+ST_LABEL[w.status]) : "苦手なマスは出ていないよ";
  return '<h2 class="kt">成長カルテ</h2>'
    + '<div class="verdict"><div class="k">いまのいちばん</div><div class="t">'+head+'</div>'
    + '<div class="b">この音を含む練習からはじめよう</div>'
    + '<a class="reco" href="#" style="margin-top:9px"><span class="k">つぎの一手</span><span class="t">音階 1オクターブ</span><span class="go">&rarr;</span></a></div>'
    + sec("SOUND","音のクセ", fingerboard(u.cells))
    + '<div class="fold"><div class="foldH" aria-expanded="false" onclick="tg(this)">速い指の切り替え<span class="v">'+(pct(u.fast.p)??"—")+'</span><span class="caret"></span></div>'
    + '<div class="foldB">'+twoBox(u.fast.p,u.slow.p,"0.3秒未満","ゆっくり")+reco(RECO_FAST)+'</div></div>'
    + '<div class="fold"><div class="foldH" aria-expanded="false" onclick="tg(this)">ポジション移動<span class="v">'+(pct(u.shift.moved.p)??"—")+'</span><span class="caret"></span></div>'
    + '<div class="foldB">'+shiftBody(u)+reco(null)+'</div></div>'
    + tail(u, true);
}
/* 案4 タブ */
function v4(u){
  const w=worstCell(u.cells);
  return '<h2 class="kt">成長カルテ</h2>'
    + '<div class="tabs" role="tablist">'
    + '<button class="tab" aria-selected="true" onclick="tab(this,0)">音のクセ</button>'
    + '<button class="tab" aria-selected="false" onclick="tab(this,1)">速い切り替え</button>'
    + '<button class="tab" aria-selected="false" onclick="tab(this,2)">ポジション移動</button></div>'
    + '<div class="tp" data-i="0">'+fingerboard(u.cells)
      + (w? '<div class="find">いちばん多いのは <b>'+w.s+'線 '+w.n+'</b> の '+ST_LABEL[w.status]+'</div>':'')+'</div>'
    + '<div class="tp" data-i="1" hidden><div class="card">'+twoBox(u.fast.p,u.slow.p,"0.3秒未満で入った音","ゆっくり入った音")+reco(RECO_FAST)+'</div></div>'
    + '<div class="tp" data-i="2" hidden><div class="card">'+shiftBody(u)+reco(null)+'</div></div>'
    + tail(u, true);
}
/* 案5 帯でまとめる */
function v5(u){
  const w=worstCell(u.cells);
  return '<h2 class="kt">成長カルテ</h2>'
    + '<div class="strip">'
    + '<div class="gold"><div class="v">'+u.cells.filter(function(c){return c.status!=="insufficient"}).length+'</div><div class="k">判定できたマス</div></div>'
    + '<div><div class="v">'+(pct(u.fast.p)??"—")+'</div><div class="k">速い切り替え</div></div>'
    + '<div><div class="v">'+(pct(u.shift.moved.p)??"—")+'</div><div class="k">ポジション移動</div></div>'
    + '</div>'
    + fingerboard(u.cells)
    + (w? '<div class="find">いちばん多いのは <b>'+w.s+'線 '+w.n+'</b> の '+ST_LABEL[w.status]+' ・ '+w.total+'音</div>':'')
    + reco(RECO_FAST)
    + tail(u, true);
}
function tg(el){ el.setAttribute("aria-expanded", el.getAttribute("aria-expanded")==="true"?"false":"true") }
function tab(el,i){
  const root=el.closest(".screen");
  Array.prototype.forEach.call(root.querySelectorAll(".tab"),function(b,j){b.setAttribute("aria-selected",String(j===i))});
  Array.prototype.forEach.call(root.querySelectorAll(".tp"),function(p,j){ if(j===i) p.removeAttribute("hidden"); else p.setAttribute("hidden","") });
}
window.tg=tg; window.tab=tab;

const VIEWS=[
  {n:"案1",t:"積み上げ",tag:"素直に縦に並べる",f:v1,crit:[
    ["g","3つが同じ重みで並び、どれも見落とさない"],["g","各項目におすすめが付く"],
    ["b","縦が長い ・ わざまでスクロールが遠い"],["b","どこから読めばいいかは自分で決めることになる"]]},
  {n:"案2",t:"2列にまとめる",tag:"指板の下に横並び",f:v2,crit:[
    ["g","縦が短く、指板と2つの数字が1画面に入る"],["g","指板が主役だと分かる"],
    ["b","数字だけで、くらべる相手が見えない"],["b","2つの項目が同じ大きさなので、母数の差が伝わらない"]]},
  {n:"案3",t:"結論を先に",tag:"答えから読ませる",f:v3,crit:[
    ["g","開いてすぐ、いま何をすればいいかが分かる"],["g","2項目はたたむので、母数が少ない今も邪魔にならない"],
    ["g","指板は裏付けとして残る"],
    ["b","結論の1行が外すと、画面全体の信頼が落ちる"]]},
  {n:"案4",t:"タブで切り替え",tag:"1つずつ見せる",f:v4,crit:[
    ["g","縦がいちばん短い"],["g","1つずつ集中して見られる"],
    ["b","3つのうち2つが常に隠れる"],["b","母数が少ない項目を開いたとき、空で終わる"]]},
  {n:"案5",t:"帯でまとめる",tag:"数字を上に載せる",f:v5,crit:[
    ["g","3つの数字が一目で並ぶ ・ 縦も短い"],["g","指板が大きく残る"],
    ["b","数字の意味は指板を見ないと分からない"],["b","項目ごとのおすすめが1つに減る"]]}
];
const u = DATA.filter(function(d){return d.uid==="cmmm46xn40"})[0] || DATA[0];
document.getElementById("whoName").textContent = (NAMES[u.uid]||u.uid)+" ・ 録音"+u.records+"件";
const host=document.getElementById("cases");
VIEWS.forEach(function(v){
  const el=document.createElement("div");
  el.className="case";
  el.innerHTML='<div class="caseHead"><span class="num">'+v.n+'</span><h3>'+v.t+'</h3><span class="tag">'+v.tag+'</span></div>'
    +'<div class="caseBody"><div class="screen">'+v.f(u)+'</div>'
    +'<dl class="crit">'+v.crit.map(function(c){return '<dt class="'+c[0]+'">'+c[1]+'</dt>'}).join("")+'</dl></div>';
  host.appendChild(el);
});
</script>
"""
html = html.replace("__DATA__", payload).replace("__NAMES__", json.dumps(NAMES, ensure_ascii=False))
out = os.path.join(SP, "karte-top-5.html")
io.open(out, "w", encoding="utf-8").write(html)
print(out, len(html), "bytes")
