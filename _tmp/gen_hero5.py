# -*- coding: utf-8 -*-
import json, io, os
SP = os.environ.get("SP")
data = json.load(io.open("_tmp/habit_series.json", encoding="utf-8"))
NAMES = {"cmlyl3rf20": "ユーザーA", "cmoecf4zv0": "ユーザーB", "cmmm46xn40": "ユーザーC"}
payload = json.dumps(data, ensure_ascii=False)

html = r"""<title>カルテ総合所見 5案</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700;900&display=swap">
<style>
:root{
  --ink:#0a1526; --panel:#12203a; --sunk:#0e1a2f; --line:#24365c;
  --text:#eaf0fb; --sub:#9db0d0; --dim:#6e83a8;
  --blue:#2b5bc4; --blue2:#3f74e0; --gold:#d9a93c; --warm:#e08e64;
}
*{box-sizing:border-box}
body{margin:0;background:var(--ink);color:var(--text);
  font-family:"Zen Kaku Gothic New","Hiragino Kaku Gothic ProN",system-ui,sans-serif;
  font-size:15px;line-height:1.7;-webkit-font-smoothing:antialiased}
.wrap{max-width:1180px;margin:0 auto;padding:34px 20px 80px}
h1{font-size:27px;font-weight:900;margin:0 0 6px;letter-spacing:.02em}
.lead{color:var(--sub);margin:0 0 10px;max-width:66ch}
.who{display:inline-flex;gap:8px;align-items:center;font-size:12px;color:var(--dim);
  border:1px solid var(--line);border-radius:999px;padding:5px 12px;margin-bottom:30px}
.who b{color:var(--gold);font-weight:700}

.case{margin:0 0 40px;background:var(--panel);border:1px solid var(--line);
  border-radius:20px;overflow:hidden;box-shadow:0 16px 40px rgba(0,0,0,.4)}
.caseHead{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;
  padding:16px 20px;border-bottom:1px solid var(--line);background:rgba(43,91,196,.08)}
.num{font-size:12px;font-weight:900;letter-spacing:.16em;color:var(--blue2)}
.caseHead h2{font-size:19px;font-weight:900;margin:0}
.caseHead .tag{margin-left:auto;font-size:12px;color:var(--dim)}
.caseBody{display:grid;grid-template-columns:minmax(300px,380px) 1fr;gap:24px;padding:20px}
@media(max-width:820px){.caseBody{grid-template-columns:1fr}}
.crit dt{font-weight:700;font-size:13px;color:var(--text);margin-top:12px}
.crit dt:first-child{margin-top:0}
.crit dd{margin:2px 0 0;color:var(--sub);font-size:13.5px}
.crit dt.g::before{content:"よい ";color:var(--gold);font-size:11px;letter-spacing:.1em}
.crit dt.b::before{content:"よわい ";color:var(--warm);font-size:11px;letter-spacing:.1em}

.screen{background:var(--sunk);border:1px solid var(--line);border-radius:16px;padding:16px 14px}
.tabs{display:flex;gap:6px;background:#0b1526;border:1px solid var(--line);
  border-radius:11px;padding:4px;margin-bottom:14px}
.tab{flex:1;border:0;background:transparent;color:var(--sub);font:inherit;font-size:12.5px;
  font-weight:700;padding:7px 4px;border-radius:8px;cursor:pointer}
.tab[aria-selected=true]{background:var(--blue);color:#fff}
.tab:focus-visible{outline:2px solid var(--blue2);outline-offset:2px}

.total{display:flex;align-items:baseline;gap:9px;flex-wrap:wrap;margin-bottom:14px}
.total .lab{font-size:11px;color:var(--dim);letter-spacing:.1em}
.total .a{font-size:17px;font-weight:700;color:var(--sub);font-variant-numeric:tabular-nums}
.arw{color:var(--dim)}
.total .b{font-size:27px;font-weight:900;font-variant-numeric:tabular-nums;line-height:1}
.chip{margin-left:auto;font-size:12px;font-weight:900;padding:3px 9px;border-radius:999px;font-variant-numeric:tabular-nums}
.up{background:rgba(217,169,60,.15);color:var(--gold);border:1px solid rgba(217,169,60,.4)}
.down{background:rgba(224,142,100,.14);color:var(--warm);border:1px solid rgba(224,142,100,.42)}

.row{padding:10px 11px;border-radius:10px;background:#0b1526}
.row+.row{margin-top:5px}
.rowTop{display:flex;align-items:baseline;gap:8px;margin-bottom:8px;flex-wrap:wrap}
.rowName{font-weight:700;font-size:13.5px}
.rowVal{margin-left:auto;font-size:11.5px;color:var(--sub);font-variant-numeric:tabular-nums}
.rowVal b{color:var(--text);font-size:14px}
.bar{position:relative;height:7px;border-radius:4px;background:#16233d;overflow:hidden}
.bar i{position:absolute;top:0;bottom:0;left:0;border-radius:4px;display:block}
.was{background:#31456e}
.now{background:linear-gradient(90deg,var(--blue),var(--blue2))}
.meter{position:relative;height:24px}
.meter .track{position:absolute;left:0;right:0;top:10px;height:4px;border-radius:3px;
  background:linear-gradient(90deg,#31456e,#16233d 50%,#31456e)}
.meter .mid{position:absolute;left:50%;top:5px;width:1px;height:14px;background:var(--dim)}
.meter .pin{position:absolute;top:3px;width:2px;height:18px;background:var(--sub);transform:translateX(-50%)}
.meter .pin.now{width:10px;height:10px;border-radius:50%;top:7px;background:var(--gold);
  box-shadow:0 0 0 3px rgba(217,169,60,.18);}
.mLab{display:flex;justify-content:space-between;font-size:10.5px;color:var(--dim)}
.thin{color:var(--dim);font-size:11.5px}
.did{margin-top:13px;padding:10px 12px;background:#0b1526;border:1px solid var(--line);border-radius:11px;font-size:13px}
.did .lab{font-size:10.5px;color:var(--dim);letter-spacing:.1em;margin-bottom:4px}
.next{margin-top:9px;padding:11px 12px;border-radius:11px;
  background:linear-gradient(135deg,rgba(43,91,196,.3),rgba(43,91,196,.08));
  border:1px solid rgba(63,116,224,.45);font-size:13.5px}
.next .lab{font-size:10.5px;color:#a8c2ff;letter-spacing:.1em;margin-bottom:3px}
.next b{font-weight:700}

/* 案2 レーダー */
.radarWrap{display:flex;flex-direction:column;align-items:center;gap:10px}
.legend{display:flex;gap:14px;font-size:11.5px;color:var(--sub)}
.legend i{display:inline-block;width:16px;height:3px;border-radius:2px;vertical-align:middle;margin-right:5px}
.deltaList{width:100%;margin-top:4px}
.dl{display:flex;align-items:center;gap:8px;padding:7px 10px;background:#0b1526;border-radius:9px;font-size:13px}
.dl+.dl{margin-top:5px}
.dl .n{margin-left:auto;font-weight:900;font-variant-numeric:tabular-nums}
.dl .n.g{color:var(--gold)} .dl .n.b{color:var(--warm)}

/* 案3 のびの矢印 */
.dumb{padding:11px 12px;background:#0b1526;border-radius:10px}
.dumb+.dumb{margin-top:6px}
.dumbTop{display:flex;gap:8px;align-items:baseline;font-size:13.5px;font-weight:700;margin-bottom:10px}
.dumbTop .u{margin-left:auto;font-size:11px;color:var(--dim);font-weight:400}
.line{position:relative;height:22px}
.line .ax{position:absolute;left:0;right:0;top:10px;height:2px;background:#1b2b49;border-radius:2px}
.line .seg{position:absolute;top:9px;height:4px;border-radius:2px;background:linear-gradient(90deg,#31456e,var(--gold))}
.line .seg.bad{background:linear-gradient(90deg,#31456e,var(--warm))}
.line .d{position:absolute;top:5px;width:12px;height:12px;border-radius:50%;transform:translateX(-50%)}
.line .d.from{background:#31456e;border:2px solid #46608f}
.line .d.to{background:var(--gold);box-shadow:0 0 0 3px rgba(217,169,60,.16)}
.line .d.to.bad{background:var(--warm);box-shadow:0 0 0 3px rgba(224,142,100,.16)}
.lineLab{display:flex;justify-content:space-between;font-size:10.5px;color:var(--dim)}

/* 案4 からだ */
.part{background:#0b1526;border-radius:12px;padding:12px}
.part+.part{margin-top:8px}
.partHead{display:flex;align-items:center;gap:9px;margin-bottom:10px}
.ico{width:30px;height:30px;border-radius:9px;background:rgba(43,91,196,.22);
  border:1px solid rgba(63,116,224,.4);display:grid;place-items:center}
.ico svg{width:17px;height:17px;stroke:#a8c2ff;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.partName{font-weight:900;font-size:14px}
.partSum{margin-left:auto;font-size:11.5px;color:var(--dim)}
.mini{display:flex;align-items:baseline;gap:8px;font-size:12.5px;padding:5px 0}
.mini+.mini{border-top:1px solid rgba(36,54,92,.6)}
.mini .v{margin-left:auto;color:var(--sub);font-variant-numeric:tabular-nums}
.mini .v b{color:var(--text)}

/* 案5 軌跡 */
.trace{padding:9px 11px;background:#0b1526;border-radius:10px;display:flex;align-items:center;gap:10px}
.trace+.trace{margin-top:5px}
.trace .nm{font-size:12.5px;font-weight:700;width:118px;flex:none;white-space:nowrap}
.trace svg{flex:1;height:34px;overflow:visible}
.trace .vv{font-size:11.5px;color:var(--sub);font-variant-numeric:tabular-nums;width:74px;text-align:right;flex:none}
.trace .vv b{color:var(--text);font-size:13.5px}

.verdictBox{margin-top:34px;padding:18px 20px;border-radius:16px;
  background:linear-gradient(135deg,rgba(217,169,60,.12),rgba(217,169,60,.03));
  border:1px solid rgba(217,169,60,.34)}
.verdictBox h3{margin:0 0 8px;font-size:16px;font-weight:900;color:var(--gold)}
.verdictBox p{margin:0 0 8px;color:var(--sub);font-size:14px}
.verdictBox p:last-child{margin-bottom:0}
.verdictBox b{color:var(--text)}
</style>

<div class="wrap">
<h1>カルテ総合所見 5案</h1>
<p class="lead">載せる情報は5案とも同じです。演奏のクセ6項目を、選んだ期間の起点といまで見くらべます。変えているのは見せ方だけ。数字は本番データベースの実ユーザーの記録から計算したもので、作り値はありません。</p>
<div class="who">表示中 <b id="whoName"></b> ・ 期間タブは実際に動きます</div>

<div id="cases"></div>

<div class="verdictBox">
<h3>おすすめ</h3>
<p><b>案5 軌跡</b>。「現在に至るまで、どのように改善しているのか」を見たいという狙いに対して、2点しか見せない案1から案4より、線でつながった推移を見せる案5がまっすぐ答えます。上がって下がってまた上がった、が見えるのはこの案だけです。</p>
<p>次点は<b>案3 のびの矢印</b>。伸びた量が矢印の長さで直接読めるので、6項目のどれがいちばん動いたかが一目で分かります。線の推移は要らない、結果だけでよい、という判断ならこちらです。</p>
<p><b>案2 レーダー</b>は形の変化が一目で分かる代わりに、走りともたりのような向きの情報が消えます。中央が良い項目と、低いほど良い項目を同じ軸に混ぜるため、正確さを犠牲にしています。</p>
</div>
</div>

<script>
const DATA = __DATA__;
const NAMES = __NAMES__;
const AX = [
  {key:"tempo", label:"走り ・ もたり", kind:"meter", left:"もたり", right:"走り", range:100,
   fmt:v=>v>10?"走り":v<-10?"もたり":"まんなか"},
  {key:"cents", label:"上ずり ・ ぶら下がり", kind:"meter", left:"ぶら下がり", right:"上ずり", range:30,
   fmt:v=>(v>0?"+":"")+v+"セント"},
  {key:"fine", label:"細かい音", kind:"rate"},
  {key:"cross", label:"弦をまたぐ", kind:"rate"},
  {key:"leap", label:"跳躍", kind:"rate"},
  {key:"shift", label:"ポジション移動", kind:"rate"}
];
function axVals(t, ax){
  if(ax.kind==="meter"){
    const a = ax.key==="tempo" ? (t.tempoA?t.tempoA.bias:null) : (t.centsA?t.centsA.cents:null);
    const b = ax.key==="tempo" ? (t.tempoB?t.tempoB.bias:null) : (t.centsB?t.centsB.cents:null);
    return [a,b];
  }
  const r = t.rows.find(r=>r.key===ax.key);
  return [r?r.a.rate:null, r?r.b.rate:null];
}
function notesOf(t, ax){
  const r = t.rows.find(r=>r.key===ax.key);
  return r ? r.b.notes : 0;
}
/* 0=わるい 1=よい に正規化 */
function good(ax, v){
  if(v==null) return null;
  if(ax.kind==="meter") return 1 - Math.min(Math.abs(v), ax.range)/ax.range;
  return 1 - v/100;
}
function head(t){
  const d=Math.round((t.scoreB-t.scoreA)*10)/10;
  return '<div class="total"><span class="lab">平均点</span><span class="a">'+t.scoreA+'</span>'
    +'<span class="arw">&rarr;</span><span class="b">'+t.scoreB+'</span>'
    +'<span class="chip '+(d>=0?"up":"down")+'">'+(d>=0?"+":"")+d+'</span></div>';
}
function foot(t){
  const worst=t.rows.filter(r=>r.b.rate!=null).sort((x,y)=>y.b.rate-x.b.rate)[0];
  return '<div class="did"><div class="lab">この期間に弾いたもの</div>'
    + t.songs.map(s=>s.title+" ×"+s.n).join(" ・ ")+'</div>'
    + '<div class="next"><div class="lab">つぎの一手</div><b>'
    + (worst? worst.label+" をやわらげる練習へ" : "まずは録音をふやそう")+'</b></div>';
}
function emptyTab(t){
  return '<div class="row" style="text-align:center;padding:28px 12px;color:var(--sub)">'
    +'この期間の記録は '+t.n+' 回<br><span class="thin">あと '+Math.max(1,4-t.n)+' 回ふえると、ここに変化が出るよ</span></div>';
}

/* ------- 案1 計器盤 ------- */
function view1(t){
  let h = head(t);
  for(const ax of AX){
    const [a,b]=axVals(t,ax);
    if(a==null&&b==null){
      h+='<div class="row"><div class="rowTop"><span class="rowName">'+ax.label+'</span>'
       +'<span class="rowVal thin">まだ判定できる音が少ないよ</span></div><div class="bar"></div></div>';
      continue;
    }
    if(ax.kind==="meter"){
      const p=v=>50+Math.max(-50,Math.min(50,v/ax.range*50));
      h+='<div class="row"><div class="rowTop"><span class="rowName">'+ax.label+'</span>'
       +'<span class="rowVal">'+(a==null?"—":ax.fmt(a))+' <span class="arw">&rarr;</span> <b>'+(b==null?"—":ax.fmt(b))+'</b></span></div>'
       +'<div class="meter"><div class="track"></div><div class="mid"></div>'
       +(a==null?"":'<div class="pin" style="left:'+p(a)+'%"></div>')
       +(b==null?"":'<div class="pin now" style="left:'+p(b)+'%"></div>')+'</div>'
       +'<div class="mLab"><span>'+ax.left+'</span><span>'+ax.right+'</span></div></div>';
    }else{
      h+='<div class="row"><div class="rowTop"><span class="rowName">'+ax.label+'</span>'
       +'<span class="rowVal">はずした音 '+a+'% <span class="arw">&rarr;</span> <b>'+b+'%</b></span></div>'
       +'<div class="bar"><i class="was" style="width:'+a+'%"></i><i class="now" style="width:'+b+'%"></i></div></div>';
    }
  }
  return h+foot(t);
}

/* ------- 案2 レーダー ------- */
function view2(t){
  const R=94, cx=118, cy=112;
  const pts=(which)=>AX.map((ax,i)=>{
    const v=good(ax, axVals(t,ax)[which]);
    const r=(v==null?0.12:0.12+v*0.88)*R;
    const th=-Math.PI/2 + i*Math.PI/3;
    return [cx+r*Math.cos(th), cy+r*Math.sin(th)];
  });
  const path=p=>p.map(q=>q[0].toFixed(1)+","+q[1].toFixed(1)).join(" ");
  const rings=[.25,.5,.75,1].map(k=>'<polygon points="'+path(AX.map((_,i)=>{
    const th=-Math.PI/2+i*Math.PI/3; return [cx+R*k*Math.cos(th), cy+R*k*Math.sin(th)];
  }))+'" fill="none" stroke="#1b2b49" stroke-width="1"/>').join("");
  const spokes=AX.map((_,i)=>{const th=-Math.PI/2+i*Math.PI/3;
    return '<line x1="'+cx+'" y1="'+cy+'" x2="'+(cx+R*Math.cos(th))+'" y2="'+(cy+R*Math.sin(th))+'" stroke="#1b2b49"/>';}).join("");
  const labels=AX.map((ax,i)=>{const th=-Math.PI/2+i*Math.PI/3;
    const x=cx+(R+22)*Math.cos(th), y=cy+(R+22)*Math.sin(th);
    const anc=Math.abs(Math.cos(th))<0.2?"middle":(Math.cos(th)>0?"start":"end");
    return '<text x="'+x.toFixed(0)+'" y="'+(y+4).toFixed(0)+'" text-anchor="'+anc+'" fill="#9db0d0" font-size="11">'+ax.label+'</text>';}).join("");
  const deltas=AX.map(ax=>{
    const [a,b]=axVals(t,ax); const ga=good(ax,a), gb=good(ax,b);
    return {label:ax.label, d:(ga==null||gb==null)?null:Math.round((gb-ga)*100)};
  }).filter(d=>d.d!=null).sort((x,y)=>Math.abs(y.d)-Math.abs(x.d)).slice(0,3);
  return head(t)
    +'<div class="radarWrap"><svg viewBox="0 0 236 236" width="100%" style="max-width:300px">'
    +rings+spokes
    +'<polygon points="'+path(pts(0))+'" fill="none" stroke="#46608f" stroke-width="2" stroke-dasharray="4 3"/>'
    +'<polygon points="'+path(pts(1))+'" fill="rgba(217,169,60,.18)" stroke="#d9a93c" stroke-width="2.4"/>'
    +labels+'</svg>'
    +'<div class="legend"><span><i style="background:#46608f"></i>起点</span><span><i style="background:#d9a93c"></i>いま</span></div>'
    +'<div class="deltaList">'+deltas.map(d=>'<div class="dl"><span>'+d.label+'</span>'
      +'<span class="n '+(d.d>=0?"g":"b")+'">'+(d.d>=0?"+":"")+d.d+'</span></div>').join("")+'</div></div>'
    +foot(t);
}

/* ------- 案3 のびの矢印 ------- */
function view3(t){
  let h=head(t);
  for(const ax of AX){
    const [a,b]=axVals(t,ax);
    if(a==null||b==null){
      h+='<div class="dumb"><div class="dumbTop"><span>'+ax.label+'</span>'
       +'<span class="u">まだ判定できる音が少ないよ</span></div><div class="line"><div class="ax"></div></div></div>';
      continue;
    }
    let pa,pb,l,r,unit;
    if(ax.kind==="meter"){
      pa=50+Math.max(-50,Math.min(50,a/ax.range*50)); pb=50+Math.max(-50,Math.min(50,b/ax.range*50));
      l=ax.left; r=ax.right; unit=ax.fmt(a)+" → "+ax.fmt(b);
    }else{
      pa=a; pb=b; l="0%"; r="100%"; unit="はずした音 "+a+"% → "+b+"%";
    }
    const better = ax.kind==="meter" ? Math.abs(b)<Math.abs(a) : b<a;
    const lo=Math.min(pa,pb), w=Math.abs(pb-pa);
    h+='<div class="dumb"><div class="dumbTop"><span>'+ax.label+'</span><span class="u">'+unit+'</span></div>'
     +'<div class="line"><div class="ax"></div>'
     +'<div class="seg'+(better?"":" bad")+'" style="left:'+lo+'%;width:'+w+'%"></div>'
     +'<div class="d from" style="left:'+pa+'%"></div>'
     +'<div class="d to'+(better?"":" bad")+'" style="left:'+pb+'%"></div></div>'
     +'<div class="lineLab"><span>'+l+'</span><span>'+r+'</span></div></div>';
  }
  return h+foot(t);
}

/* ------- 案4 からだの地図 ------- */
const PARTS=[
  {name:"右手 ・ 弓", keys:["tempo","fine"], svg:'<path d="M3 13 L15 3"/><path d="M2 15 l3 -3"/><circle cx="15" cy="3" r="1.6"/>'},
  {name:"左手 ・ 指板", keys:["cross","leap","shift"], svg:'<path d="M4 15 v-7a1.6 1.6 0 013 0v6"/><path d="M7 12V6a1.6 1.6 0 013 0v6"/><path d="M10 12V7a1.6 1.6 0 013 0v6a4 4 0 01-9 2"/>'},
  {name:"耳 ・ 音程", keys:["cents"], svg:'<path d="M6 15a5 5 0 01-1-3 4 4 0 018 0c0 2-2 2.5-2 4.2A1.8 1.8 0 018.6 18"/><path d="M7.6 9.6a1.4 1.4 0 012.4 1"/>'}
];
function view4(t){
  let h=head(t);
  for(const p of PARTS){
    const rows=p.keys.map(k=>{
      const ax=AX.find(a=>a.key===k); const [a,b]=axVals(t,ax);
      const gb=good(ax,b);
      return {ax,a,b,gb};
    });
    const known=rows.filter(r=>r.gb!=null);
    const sum = known.length ? Math.round(known.reduce((s,r)=>s+r.gb,0)/known.length*100) : null;
    h+='<div class="part"><div class="partHead"><span class="ico"><svg viewBox="0 0 20 20">'+p.svg+'</svg></span>'
     +'<span class="partName">'+p.name+'</span>'
     +'<span class="partSum">'+(sum==null?"まだ判定できないよ":"ととのい "+sum)+'</span></div>'
     + rows.map(r=>{
        if(r.b==null) return '<div class="mini"><span>'+r.ax.label+'</span><span class="v thin">音が少ないよ</span></div>';
        const txt = r.ax.kind==="meter" ? (r.ax.fmt(r.a)+" → <b>"+r.ax.fmt(r.b)+"</b>")
                                        : (r.a+"% → <b>"+r.b+"%</b>");
        return '<div class="mini"><span>'+r.ax.label+'</span><span class="v">'+txt+'</span></div>';
       }).join("")
     +'</div>';
  }
  return h+foot(t);
}

/* ------- 案5 軌跡 ------- */
function spark(vals, ax){
  const pts=vals.map((v,i)=>[i,v]).filter(p=>p[1]!=null);
  if(pts.length<2) return '<svg viewBox="0 0 100 34"></svg>';
  const W=100,H=34, n=vals.length-1||1;
  let lo,hi;
  if(ax.kind==="meter"){ lo=-ax.range; hi=ax.range; } else { lo=0; hi=100; }
  const X=i=>i/n*W, Y=v=>H-2-((Math.max(lo,Math.min(hi,v))-lo)/(hi-lo))*(H-4);
  const d=pts.map((p,i)=>(i?"L":"M")+X(p[0]).toFixed(1)+","+Y(p[1]).toFixed(1)).join(" ");
  const zero = ax.kind==="meter" ? '<line x1="0" y1="'+Y(0).toFixed(1)+'" x2="100" y2="'+Y(0).toFixed(1)+'" stroke="#2a3d63" stroke-dasharray="3 3"/>' : "";
  const last=pts[pts.length-1];
  return '<svg viewBox="0 0 100 34" preserveAspectRatio="none">'+zero
    +'<path d="'+d+'" fill="none" stroke="#3f74e0" stroke-width="1.8" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>'
    +'<circle cx="'+X(last[0]).toFixed(1)+'" cy="'+Y(last[1]).toFixed(1)+'" r="2.6" fill="#d9a93c" vector-effect="non-scaling-stroke"/></svg>';
}
function view5(t){
  let h=head(t);
  h+='<div class="thin" style="margin:-6px 0 10px">線は録音3回ぶんをならした推移 ・ 丸がいま</div>';
  for(const ax of AX){
    const vals = ax.kind==="meter" ? t.series[ax.key] : t.series[ax.key];
    const [a,b]=axVals(t,ax);
    const txt = b==null ? '<span class="thin">音が少ないよ</span>'
      : (ax.kind==="meter" ? '<b>'+ax.fmt(b)+'</b>' : '<b>'+b+'%</b>');
    h+='<div class="trace"><span class="nm">'+ax.label+'</span>'+spark(vals,ax)+'<span class="vv">'+txt+'</span></div>';
  }
  return h+foot(t);
}

const VIEWS=[
  {n:"案1", t:"計器盤", tag:"いまの実装案", f:view1, crit:[
    ["g","6項目の意味がいちばん正確に出る"],["g","中央が良い項目と、低いほど良い項目を混ぜていない"],
    ["b","2点しか見せないので、途中の上がり下がりが分からない"],["b","縦に長い"]]},
  {n:"案2", t:"六角のかたち", tag:"形で見る", f:view2, crit:[
    ["g","形の変化が一目で分かる ・ 縦に短い"],["g","得意と苦手のかたよりが見える"],
    ["b","走りともたりの向きが消える ・ どちらも中央から遠いだけになる"],
    ["b","判定できない項目が中心に張りつき、下手に見える"]]},
  {n:"案3", t:"のびの矢印", tag:"伸びた量で見る", f:view3, crit:[
    ["g","どれがいちばん動いたかが矢印の長さで直接読める"],["g","向きも量も残る ・ 正確さを犠牲にしない"],
    ["b","途中の推移は見えない"],["b","動きが小さい期間は点が重なって見える"]]},
  {n:"案4", t:"からだの地図", tag:"体の部位で束ねる", f:view4, crit:[
    ["g","6項目が右手 ・ 左手 ・ 耳のどこの話かが分かる"],["g","練習の当てどころに直結する"],
    ["b","ととのい の数値は6項目を平均した合成値で、根拠が薄まる"],["b","項目ごとの変化量は小さく出る"]]},
  {n:"案5", t:"軌跡", tag:"線で見る", f:view5, crit:[
    ["g","現在に至るまでの上がり下がりがそのまま見える"],["g","一度落ちてから戻ったことが分かるのはこの案だけ"],
    ["g","縦に短い ・ 6項目を1画面に収められる"],
    ["b","線の1点が録音3回ぶんなので、記録が少ないと線にならない"]]}
];

const u = DATA.find(d=>d.uid==="cmmm46xn40") || DATA[0];
document.getElementById("whoName").textContent = (NAMES[u.uid]||u.uid)+" ・ 全"+u.total+"件";
const host=document.getElementById("cases");
VIEWS.forEach(v=>{
  const el=document.createElement("div");
  el.className="case";
  el.innerHTML='<div class="caseHead"><span class="num">'+v.n+'</span><h2>'+v.t+'</h2><span class="tag">'+v.tag+'</span></div>'
    +'<div class="caseBody"><div class="screen"><div class="tabs" role="tablist"></div><div class="body"></div></div>'
    +'<dl class="crit">'+v.crit.map(c=>'<dt class="'+c[0]+'">'+c[1]+'</dt>').join("")+'</dl></div>';
  const tabs=el.querySelector(".tabs"), body=el.querySelector(".body");
  let first=u.tabs.findIndex(t=>t.ok); if(first<0) first=0;
  u.tabs.forEach((t,i)=>{
    const b=document.createElement("button");
    b.className="tab"; b.type="button"; b.setAttribute("role","tab"); b.textContent=t.label;
    b.setAttribute("aria-selected", String(i===first));
    b.onclick=()=>{
      Array.prototype.forEach.call(tabs.children,c=>c.setAttribute("aria-selected","false"));
      b.setAttribute("aria-selected","true");
      body.innerHTML = t.ok ? v.f(t) : emptyTab(t);
    };
    tabs.appendChild(b);
  });
  body.innerHTML = u.tabs[first].ok ? v.f(u.tabs[first]) : emptyTab(u.tabs[first]);
  host.appendChild(el);
});
</script>
"""
html = html.replace("__DATA__", payload).replace("__NAMES__", json.dumps(NAMES, ensure_ascii=False))
out = os.path.join(SP, "karte-hero-5.html")
io.open(out, "w", encoding="utf-8").write(html)
print(out, len(html), "bytes")
