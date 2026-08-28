# -*- coding: utf-8 -*-
# 「アルコと最初の1周」動くプロトタイプ最終版。背景=本番アプリの実スクリーンショット。
# ガイド層 (暗幕+金の光+道しるべバー) を実画面の上に重ね、タップで1周体験できる。
import io, base64, os

APP = r"C:/Users/tetsu/OneDrive/Desktop/shiftB/music-app/music-app"
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "guide-redesign.html")

def b64(p, mime):
    return "data:%s;base64," % mime + base64.b64encode(open(p, "rb").read()).decode()

SHOT_HOME = b64(os.path.join(HERE, "shots/16_home_kirakira.jpg"), "image/jpeg")
SHOT_SCORE = b64(os.path.join(HERE, "shots/12_score_clean.jpg"), "image/jpeg")
SHOT_CTRL = b64(os.path.join(HERE, "shots/15_colored.jpg"), "image/jpeg")
SHOT_REVIEW = b64(os.path.join(HERE, "shots/21_review_points.jpg"), "image/jpeg")
IMG = {
    "point": b64(os.path.join(HERE, "small/05B.jpg"), "image/jpeg"),
    "question": b64(os.path.join(HERE, "small/05C.jpg"), "image/jpeg"),
    "bravo": b64(os.path.join(HERE, "small/06B.jpg"), "image/jpeg"),
    "listen": b64(os.path.join(HERE, "small/08B.jpg"), "image/jpeg"),
    "cheer": b64(os.path.join(HERE, "small/03B.jpg"), "image/jpeg"),
    "think": b64(os.path.join(HERE, "small/07B.jpg"), "image/jpeg"),
    "play": b64(os.path.join(HERE, "small/08C.jpg"), "image/jpeg"),
}
NOTES_JS = ",".join('"%s":"%s"' % (n, b64(APP + "/public/violin/arco/mf/%s.mp3" % n, "audio/mpeg"))
                    for n in ["D5", "E5", "B4", "G4", "A4", "E4"])

# ── 実画面バックドロップ+新規UI (デモ描画) ──
# 座標は 780x1688 の実スクリーンショットからの実測 (%)
def bg(img):
    return '<img class="shotbg" src="%s" alt="">' % img

# きらきら星の譜面1段目の音符位置 (12_score_clean 実測・%)
DOT_XS = [30.5, 36.5, 44.5, 48.5, 53.5, 57.5, 63.0, 67.0, 73.0, 77.0]
def dots(sid, colors):
    out = ""
    for i, (x, c) in enumerate(zip(DOT_XS, colors)):
        col = {"g": "#2fae52", "r": "#e5392b", "o": "#f08a1d"}[c]
        out += ('<span class="evdot" data-ev="%s" style="left:%.1f%%;animation-delay:%.2fs;background:%s"></span>'
                % (sid, x, 0.25 + i * 0.13, col))
    return out

S = {}
# 初期ユーザーのホーム: いま練習している曲は出ない (演奏履歴が材料のため録音0では空)。
# 代わりに🌟さいしょの1曲カードが出る (home.tsx STARTER の実デザインを再現)
STARTER = (
    '<div class="fresh-patch"></div>'
    '<div class="starter" id="hlStarter">'
    '<div class="stLbl">&#10022; さいしょの1曲</div>'
    '<div class="stBanner"><span class="stCover">&#9834;</span>'
    '<div class="stMeta"><b>きらきら星</b><span>&#9734;1 ・ きみのレベルにぴったり</span></div>'
    '<span class="stArrow">&#8594;</span></div>'
    '<div class="stNote">&#9734;が小さいほど やさしい曲だよ</div>'
    '<div class="stCta">さっそく始めよう</div>'
    '<div class="stLink">ほかの曲を選ぶ</div>'
    '</div>')
S["home"] = bg(SHOT_HOME) + STARTER
S["home2"] = (bg(SHOT_HOME) +
    '<div class="ptscover">☆1・直近 <b>72点</b></div>')
S["ctrl"] = (bg(SHOT_CTRL) + '<div class="playchip" id="playchip" hidden>♪ お手本を再生中…</div>')
S["score72"] = (bg(SHOT_SCORE) + dots("r72", ["g","g","o","g","r","g","g","g","o","g"])
    + '<div class="scorechip" data-ev-chip="r72"><b>72</b>点</div>'
    + '<div class="legend" id="hlLegend"><div class="lgT">色の読みかた</div>'
      '<div class="lgR"><i style="background:#2fae52"></i>ばっちり</div>'
      '<div class="lgR"><i style="background:#e5392b"></i>音程がずれた</div>'
      '<div class="lgR"><i style="background:#f08a1d"></i>リズムがずれた</div></div>')
S["score85"] = (bg(SHOT_SCORE) + dots("r85", ["g","g","g","g","g","g","g","g","o","g"])
    + '<div class="scorechip" data-ev-chip="r85"><b>85</b>点<em>+13</em></div>')
S["score34"] = (bg(SHOT_SCORE) + dots("rlow", ["r","o","r","r","o","r","o","r","r","o"])
    + '<div class="scorechip" data-ev-chip="rlow"><b>34</b>点</div>')
S["recording"] = (bg(SHOT_CTRL) +
    '<div class="recoverlay"><div class="recing"><span class="reddot"></span>録音中…</div></div>'
    '<div class="countod" id="countod"><b id="countnum">3</b></div>')
S["silent"] = (bg(SHOT_CTRL) +
    '<div class="gcardwrap"><div class="gcard" id="hlSilent">'
    '<div class="gcT red">音がうまく録れなかったみたい</div>'
    '<div class="gcR"><i>1</i>スマホを楽器に<b>1〜2m</b>まで近づけてみて</div>'
    '<div class="gcR"><i>2</i>まわりの音が大きい場所は避けてね</div>'
    '<button class="gcBtn" data-jump="end">もう一回ためす</button></div></div>')
S["manner"] = (bg(SHOT_CTRL) +
    '<div class="gcardwrap"><div class="gcard" id="hlManner">'
    '<div class="gcT">録音の前に、これだけ</div>'
    '<div class="gcR"><i>1</i>スマホを<b>横向き</b>にすると譜面が大きくなる</div>'
    '<div class="gcR"><i>2</i><b>3・2・1</b>のカウントのあとに弾きはじめる</div>'
    '<div class="gcR"><i>3</i><b>テンポガイドの音</b>に合わせて、ゆっくりでOK</div>'
    '<button class="gcBtn" data-adv>わかった</button></div></div>')
S["clearflash"] = ('<div class="flashwrap"><div class="flasharco"><img class="arcoimg" src="' + IMG["bravo"] + '"></div>'
    '<div class="clbadge">基礎練クリア!</div><div class="clsub">音階・合格</div></div>')
S["card"] = ('<div class="flashwrap">'
    '<div class="reward" id="hlCard"><div class="rwArt"><img class="arcoimg" src="' + IMG["play"] + '"></div>'
    '<div class="rwTitle">はじめての1周</div>'
    '<div class="rwMeta">きらきら星 72→85点・2026.08.29</div>'
    '<div class="rwNo">CARD No.001</div></div>'
    '<button class="sharebtn" data-adv>うけとる</button>'
    '<button class="ghostlink">シェアして自慢する</button></div>')
S["end"] = ('<div class="flashwrap endwrap">'
    '<div class="cyc">'
    '<div class="cy"><i>0</i>聴く</div><em>→</em><div class="cy"><i>1</i>弾く</div><em>→</em>'
    '<div class="cy"><i>2</i>結果</div><em>→</em><div class="cy"><i>3</i>トップ</div><em>→</em>'
    '<div class="cy"><i>4</i>直す</div><em>→</em><div class="cy"><i>5</i>再挑戦</div><span class="loopmk">↺</span></div>'
    '<div class="endlead">これが上達の1周。分岐と2周目以降:</div>'
    '<div class="endmenu">'
    '<button data-jump="b_low">分岐: 点が低かったとき</button>'
    '<button data-jump="b_silent">分岐: 音が録れなかったとき</button>'
    '<button data-jump="x_quest">2周目以降: アルコのクエスト</button>'
    '<button data-jump="x_clear">曲クリア→次の曲</button>'
    '<button data-jump="restart" class="goldbtn">もう一度最初から体験する</button>'
    '</div></div>')
def quest(t, s2, done=False):
    return ('<div class="qrow%s"><span class="qck">%s</span><div class="qtx"><b>%s</b><span>%s</span></div><span class="qcd">🎴</span></div>'
            % (" done" if done else "", "✓" if done else "", t, s2))
S["review"] = bg(SHOT_REVIEW)
S["quest"] = (bg(SHOT_HOME) + '<div class="gcardwrap gcardTop"><div class="gcard" id="hlQuest">'
    '<div class="gcT">アルコのクエスト</div>'
    + quest("はじめての1周", "成長サイクルを回した", True)
    + quest("譜面に書き込みしてみる", "気をつける場所に印を")
    + quest("学びのレッスンを1つ", "新しい技術のコツ")
    + quest("カルテで成長を見る", "2周ぶん貯まったら")
    + quest("ループ練習を使う", "弱点の小節だけくり返す")
    + quest("7日つづけて練習", "毎日15分の力")
    + '<div class="gcNote">達成ごとにカード1枚。ホームに常設するカードのイメージ</div></div></div>')
S["clear2"] = (bg(SHOT_HOME) + '<div class="flashwrap flashdim">'
    '<div class="flasharco"><img class="arcoimg" src="' + IMG["bravo"] + '"></div>'
    '<div class="clbadge">きらきら星 クリア!</div>'
    '<div class="clsub">曲マスターまで: 課題をぜんぶクリア+平均90点</div>'
    '<div class="gcard" style="width:88%"><div class="gcR" style="margin:0"><b style="margin-right:auto">つぎはこの曲: G線上のアリア ☆2</b><span class="gobtn">見る</span></div></div>'
    '<button class="ghostlink" data-jump="end">‹ もどる</button></div>')

screens_html = "".join('<div class="screen" id="scr_%s">%s</div>' % (k, v) for k, v in S.items())

STEPS_PANEL = [
    "ホーム: 初期ユーザーの実際の見た目 (🌟さいしょの1曲カード・いま練習している曲は出ない) をデモ描画で再現。タップで演奏画面へ",
    "演奏画面: お手本▶ → 本物の音源+再生中表示 → 自動で次へ",
    "演奏画面: 作法カード3行。カードの「わかった」で進む",
    "演奏画面: 「録音して採点」→ 3・2・1 → 録音中 → 採点結果へ",
    "採点結果: 色が灯る (デモ描画)。灰枠=読みかたカード。金の光=ふりかえりタブ → タップ",
    "ふりかえり: 灰枠=伸びしろポイント (67%/75%は実データ)。金の光=ホームタブ → タップ",
    "ホーム: 灰枠=直近72点に更新 (デモ)。金の光=基礎練01音階 → タップ → クリア祝い",
    "演奏画面: もう一回「録音して採点」→ カウントダウン",
    "採点結果: 赤が緑・72→85点 → 3秒で自動で次へ",
    "ごほうびカード+紙吹雪 (新設UI)。カードの「うけとる」で完了へ",
    "完了: サイクル図。分岐と2周目以降もここから。右上スキップでいつでもここへ",
]
panel_html = "".join('<div class="stepItem" data-step="%d"><b>%d</b><span>%s</span></div>' % (i, i, t)
                     for i, t in enumerate(STEPS_PANEL))

CSS = """
* { box-sizing:border-box; }
body { background:#060b16; color:#edf1fa; font-family:"Zen Kaku Gothic New","Hiragino Sans",sans-serif; margin:0; padding:26px 16px 60px; }
.page { max-width:1060px; margin:0 auto; }
h1 { font-size:21px; font-weight:900; margin:0 0 4px; }
.lead { font-size:13px; color:#8fa0c4; line-height:1.9; margin:0 0 20px; }
.lead b { color:#edf1fa; }
.stage { display:flex; gap:26px; align-items:flex-start; justify-content:center; flex-wrap:wrap; }
.phone { position:relative; width:min(402px,94vw); aspect-ratio:780/1688; background:#0a1122;
  border-radius:22px; overflow:hidden; border:1px solid rgba(150,175,225,.18);
  box-shadow:0 10px 40px rgba(4,10,28,.6); flex:none; container-type:size; }
.screen { position:absolute; inset:0; display:none; }
.screen.on { display:block; }
.shotbg { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
/* ガイド層 */
.dimmer { position:absolute; inset:0; background:rgba(4,8,20,.55); pointer-events:none; opacity:0; transition:opacity .3s; z-index:4; }
.dimmer.on { opacity:1; }
.spot { position:absolute; z-index:5; border-radius:18px; cursor:pointer;
  box-shadow:0 0 0 3px rgba(232,178,60,.85), 0 0 26px rgba(232,178,60,.45);
  animation:spotb 2.2s ease-in-out infinite; display:none; }
@keyframes spotb { 0%,100% { box-shadow:0 0 0 3px rgba(232,178,60,.85), 0 0 26px rgba(232,178,60,.45); }
  50% { box-shadow:0 0 0 3px rgba(232,178,60,1), 0 0 38px rgba(232,178,60,.7); } }
.shirube { position:absolute; left:3%; right:3%; bottom:2%; z-index:6; display:flex; align-items:center; gap:2.6cqw;
  background:rgba(13,24,48,.97); border:1px solid rgba(150,175,225,.25); border-radius:16px;
  padding:1.3cqh 3cqw; box-shadow:0 8px 26px rgba(4,8,20,.7);
  transition:transform .35s cubic-bezier(.2,.8,.2,1); }
.shirube.hidden { transform:translateY(150%); }
.sbArco { flex:none; width:6.4cqh; aspect-ratio:1; }
.arcoimg { display:block; width:100%; height:100%; object-fit:cover;
  -webkit-mask-image:radial-gradient(circle at 50% 50%, #000 0 58%, rgba(0,0,0,.55) 70%, transparent 78%);
  mask-image:radial-gradient(circle at 50% 50%, #000 0 58%, rgba(0,0,0,.55) 70%, transparent 78%); }
.sbBody { flex:1; min-width:0; }
.sbText { font-size:min(1.72cqh,14px); font-weight:800; line-height:1.55; }
.sbPips { display:flex; gap:1.4cqw; margin-top:.7cqh; }
.sbPips i { width:1.05cqh; aspect-ratio:1; border-radius:50%; background:rgba(150,175,225,.22); }
.sbPips i.on { background:#d9a93c; }
.sbPips i.now { background:none; border:1.5px solid #d9a93c; }
.sbCta { flex:none; background:#2b5bc4; color:#fff; border:none; border-radius:999px; cursor:pointer;
  font-family:inherit; font-size:min(1.6cqh,13px); font-weight:900; padding:1cqh 3.8cqw; }
.sbSkip { position:absolute; right:4%; top:1.6%; z-index:6; background:rgba(13,24,48,.85); border:1px solid rgba(150,175,225,.2);
  color:#8fa0c4; font-size:11px; font-weight:700; border-radius:999px; padding:4px 12px; }
/* デモ描画UI */
.evdot { position:absolute; top:43.6%; width:2.1%; aspect-ratio:1; border-radius:50%; opacity:0; z-index:3; }
.evdot.play { animation:evpop .45s cubic-bezier(.2,1.5,.4,1) both; }
@keyframes evpop { from { opacity:0; transform:scale(.2); } to { opacity:1; transform:scale(1); } }
.scorechip { position:absolute; top:34.5%; left:50%; transform:translateX(-50%); z-index:3;
  background:rgba(13,24,48,.95); border:1px solid rgba(150,175,225,.3); border-radius:999px;
  padding:.9cqh 4.5cqw; font-size:min(1.8cqh,15px); font-weight:800; color:#8fa0c4; }
.scorechip b { font-size:min(2.8cqh,23px); color:#edf1fa; margin-right:.15em; }
.scorechip em { font-style:normal; color:#5cc98a; font-weight:900; margin-left:.5em; }
.legend { position:absolute; right:5%; top:50%; z-index:5; background:#15233f; border:1px solid rgba(150,175,225,.25);
  border-radius:12px; padding:1.2cqh 3.4cqw; }
.lgT { font-size:min(1.55cqh,12px); font-weight:900; color:#f0d9a6; margin-bottom:.6cqh; }
.lgR { display:flex; align-items:center; gap:1.8cqw; font-size:min(1.55cqh,12px); font-weight:700; color:#cbd6ee; margin-top:.5cqh; }
.lgR i { width:1.6cqh; aspect-ratio:1; border-radius:50%; }
.gcardwrap { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; z-index:5; padding:0 6%; }
.gcardTop { align-items:flex-start; padding-top:14%; }
.gcard { width:100%; background:#15233f; border:1px solid rgba(150,175,225,.25); border-radius:16px;
  padding:1.8cqh 4.5cqw; box-shadow:0 10px 30px rgba(4,8,20,.6); }
.gcT { font-size:min(1.95cqh,16px); font-weight:900; color:#f0d9a6; margin-bottom:1.1cqh; }
.gcT.red { color:#ff9d94; }
.gcR { display:flex; align-items:flex-start; gap:2.4cqw; font-size:min(1.65cqh,13px); color:#cbd6ee;
  font-weight:600; line-height:1.65; margin-top:.9cqh; }
.gcR b { color:#edf1fa; }
.gcR i { flex:none; width:2.5cqh; aspect-ratio:1; border-radius:50%; background:#0d1730;
  border:1px solid rgba(150,175,225,.3); display:grid; place-items:center; font-style:normal;
  font-size:min(1.4cqh,11px); font-weight:900; color:#8fa0c4; margin-top:.15cqh; }
.gcNote { margin-top:1.2cqh; font-size:min(1.4cqh,11px); color:#5e7099; }
.gobtn { flex:none; background:#2b5bc4; color:#fff; font-size:min(1.6cqh,13px); font-weight:800;
  border-radius:999px; padding:.8cqh 3.6cqw; }
.recoverlay { position:absolute; top:74%; left:0; right:0; display:flex; justify-content:center; z-index:3; }
.recing { display:flex; align-items:center; gap:2cqw; font-size:min(2cqh,16px); font-weight:800;
  background:rgba(13,24,48,.95); border-radius:999px; padding:1.1cqh 5cqw; border:1px solid rgba(229,57,43,.4); }
.reddot { width:1.8cqh; aspect-ratio:1; border-radius:50%; background:#e5392b; animation:blink 1s infinite; }
@keyframes blink { 50% { opacity:.25; } }
.countod { position:absolute; inset:0; background:rgba(4,8,20,.7); display:grid; place-items:center; z-index:7; }
.countod b { font-size:min(14cqh,110px); font-weight:900; color:#fff; animation:cdp .55s ease-out infinite; }
@keyframes cdp { from { transform:scale(1.35); opacity:.3; } to { transform:scale(1); opacity:1; } }
.flashwrap { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:1.8cqh; padding:0 6%; z-index:5; background:#0a1122; }
.flashdim { background:rgba(6,10,22,.92); }
.flasharco { width:34%; aspect-ratio:1; }
.clbadge { background:rgba(217,169,60,.14); border:1.5px solid rgba(217,169,60,.55); color:#f0d9a6;
  font-size:min(2.2cqh,19px); font-weight:900; border-radius:999px; padding:1cqh 6cqw; }
.clsub { font-size:min(1.55cqh,13px); color:#8fa0c4; text-align:center; }
.reward { width:66%; background:linear-gradient(180deg,#16294f,#0d1b33); border:1.5px solid rgba(217,169,60,.55);
  border-radius:18px; padding:2cqh 4cqw; display:flex; flex-direction:column; align-items:center; gap:.8cqh;
  box-shadow:0 0 26px rgba(217,169,60,.2); }
.rwArt { width:56%; aspect-ratio:1; }
.rwTitle { font-size:min(2.2cqh,18px); font-weight:900; color:#f0d9a6; }
.rwMeta { font-size:min(1.45cqh,12px); color:#8fa0c4; text-align:center; line-height:1.7; }
.rwNo { font-size:min(1.3cqh,11px); color:#d9a93c; letter-spacing:.24em; font-weight:800; }
.sharebtn { background:#2b5bc4; color:#fff; border:none; border-radius:999px; font-family:inherit;
  font-size:min(1.8cqh,15px); font-weight:900; padding:1.3cqh 7cqw; cursor:pointer; }
.cyc { display:flex; align-items:center; flex-wrap:wrap; gap:1.4cqw; justify-content:center; }
.cy { display:flex; flex-direction:column; align-items:center; gap:.4cqh; font-size:min(1.35cqh,11px); font-weight:800; }
.cy i { width:4cqh; aspect-ratio:1; border-radius:50%; display:grid; place-items:center; font-style:normal;
  background:#15233f; border:2px solid rgba(217,169,60,.6); color:#f0d9a6; font-weight:900; font-size:min(1.7cqh,14px); }
.cyc em { color:#5e7099; font-style:normal; font-weight:900; }
.loopmk { color:#d9a93c; font-size:min(2.6cqh,21px); font-weight:900; }
.endlead { font-size:min(1.65cqh,13px); color:#8fa0c4; text-align:center; }
.endmenu { display:flex; flex-direction:column; gap:1cqh; width:88%; }
.endmenu button { background:#15233f; border:1px solid rgba(150,175,225,.16); color:#edf1fa; font-family:inherit;
  font-size:min(1.7cqh,14px); font-weight:800; border-radius:12px; padding:1.3cqh; cursor:pointer; }
.endmenu .goldbtn { border-color:rgba(217,169,60,.55); color:#f0d9a6; }
.ghostlink { background:none; border:none; color:#8fa0c4; font-family:inherit; font-size:min(1.6cqh,13px);
  font-weight:700; cursor:pointer; }
.qrow { display:flex; align-items:center; gap:2.6cqw; padding:1.1cqh 0; border-bottom:1px dashed rgba(150,175,225,.14); }
.qck { flex:none; width:2.7cqh; aspect-ratio:1; border-radius:50%; border:2px solid rgba(150,175,225,.35);
  display:grid; place-items:center; font-size:min(1.4cqh,11px); color:#0d1b33; font-weight:900; }
.qrow.done .qck { background:#d9a93c; border-color:#d9a93c; }
.qrow.done .qtx b { color:#8fa0c4; text-decoration:line-through; }
.qtx { flex:1; min-width:0; display:flex; flex-direction:column; }
.qtx b { font-size:min(1.65cqh,14px); color:#edf1fa; }
.qtx span { font-size:min(1.35cqh,11px); color:#8fa0c4; }
.qcd { flex:none; font-size:min(2cqh,16px); }
.confetti { position:absolute; top:-4%; border-radius:2px; pointer-events:none; animation:cfall linear forwards; z-index:8; }
@keyframes cfall { from { transform:translateY(0) rotate(0); opacity:1; } to { transform:translateY(95cqh) rotate(720deg); opacity:0; } }
.ptscover { position:absolute; left:26.5%; top:34.9%; z-index:3;
  background:#2857c9; border-radius:6px; padding:.15cqh 1.6cqw;
  color:#dbe6ff; font-size:min(1.75cqh,14px); font-weight:700; letter-spacing:.02em; }
.ptscover b { color:#fff; font-weight:900; }
.playchip { position:absolute; left:50%; top:47%; transform:translateX(-50%); z-index:5;
  background:rgba(13,24,48,.95); border:1px solid rgba(217,169,60,.5); color:#f0d9a6;
  border-radius:999px; padding:.9cqh 4cqw; font-size:min(1.7cqh,14px); font-weight:800;
  animation:spotb 1.2s ease-in-out infinite; }
.ripple { position:absolute; width:64px; height:64px; margin:-32px 0 0 -32px; border-radius:50%;
  background:rgba(232,178,60,.5); transform:scale(.2); animation:rip .5s ease-out forwards; z-index:9; pointer-events:none; }
@keyframes rip { to { transform:scale(2.6); opacity:0; } }
.screen.on { animation:scrin .3s ease both; }
@keyframes scrin { from { opacity:.3; transform:translateX(3.5%); } to { opacity:1; transform:none; } }
.whereChip { position:absolute; left:4%; top:1.6%; z-index:6; background:rgba(13,24,48,.85);
  border:1px solid rgba(150,175,225,.2); color:#8fa0c4; font-size:11px; font-weight:800;
  border-radius:999px; padding:4px 12px; letter-spacing:.04em; }
.gcBtn { margin-top:1.6cqh; width:100%; background:#2b5bc4; color:#fff; border:none; border-radius:999px;
  font-family:inherit; font-size:min(1.7cqh,14px); font-weight:900; padding:1.2cqh; cursor:pointer; }
.spot2 { position:absolute; z-index:4; border-radius:16px; pointer-events:none; display:none;
  box-shadow:0 0 0 2px rgba(150,175,225,.55); }
.branchBack { position:absolute; right:4%; top:6.4%; z-index:7; background:rgba(13,24,48,.9);
  border:1px solid rgba(150,175,225,.3); color:#cbd6ee; font-size:12px; font-weight:800;
  border-radius:999px; padding:5px 14px; cursor:pointer; display:none; font-family:inherit; }
/* 初期ユーザーのホーム再現: 実スクショの下部を地の色で覆い、🌟カードを重ねる */
.fresh-patch { position:absolute; left:0; right:0; top:28.6%; height:56%; background:#0a1122; }
.starter { position:absolute; left:4.5%; right:4.5%; top:29.4%;
  background:linear-gradient(180deg,#1e3053 0%,#15233f 100%); border:1px solid rgba(150,175,225,.12);
  border-radius:20px; overflow:hidden;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.06), 0 2px 6px rgba(4,10,28,.35), 0 14px 34px -8px rgba(4,10,28,.55); }
.stLbl { display:inline-flex; align-items:center; gap:.8cqw; font-size:min(1.45cqh,11px); font-weight:800;
  color:#e8b23c; padding:1.6cqh 4cqw 0; }
.stBanner { display:flex; align-items:center; gap:3cqw; padding:1.5cqh 4cqw;
  margin-top:1cqh; background:linear-gradient(135deg,#1F3D78,#2B5BC4); }
.stCover { width:6cqh; aspect-ratio:1; border-radius:14px; flex:none; display:grid; place-items:center;
  background:rgba(255,255,255,.16); color:#fff; font-size:min(2.6cqh,22px); }
.stMeta { flex:1; min-width:0; display:flex; flex-direction:column; }
.stMeta b { font-size:min(2.3cqh,18px); font-weight:900; color:#fff; }
.stMeta span { font-size:min(1.5cqh,12px); font-weight:700; color:#CDD9F2; margin-top:.2cqh; }
.stArrow { font-size:min(1.9cqh,15px); font-weight:900; color:#fff; flex:none; }
.stNote { font-size:min(1.4cqh,11px); color:#8fa0c4; padding:1.4cqh 4cqw 0; }
.stCta { margin:1.2cqh 4cqw 0; background:linear-gradient(180deg,#E8B23C,#D2992C); border-radius:14px;
  padding:1.5cqh; text-align:center; color:#201604; font-weight:900; font-size:min(1.8cqh,14px); }
.stLink { text-align:center; padding:1cqh 0 1.6cqh; font-size:min(1.4cqh,11px); color:#7FA4E8; font-weight:800; }
/* パネル */
.panel { flex:1 1 300px; max-width:420px; min-width:280px; }
.panel h2 { font-size:14px; font-weight:900; color:#f0d9a6; margin:0 0 8px; }
.stepList { display:flex; flex-direction:column; gap:2px; }
.stepItem { display:flex; gap:10px; padding:8px 12px; border-radius:10px; font-size:12.5px; color:#5e7099;
  line-height:1.7; border:1px solid transparent; }
.stepItem b { color:#8fa0c4; font-weight:800; flex:none; }
.stepItem.now { background:#0d1730; border-color:rgba(217,169,60,.4); color:#cbd6ee; }
.stepItem.now b { color:#f0d9a6; }
.panelNote { margin-top:14px; font-size:12px; color:#5e7099; line-height:1.9;
  border-top:1px solid rgba(150,175,225,.12); padding-top:12px; }
.panelNote b { color:#8fa0c4; }
"""

JS = """
<script>
const NOTES={__NOTES__};
const PHRASE=[["D5",.32],["E5",.13],["D5",.32],["B4",.13],["G4",.32],["A4",.13],["G4",.32],["E4",.13],["G4",.85]];
let actx=null,bufs=null;
async function audio(){
  if(!actx)actx=new (window.AudioContext||window.webkitAudioContext)();
  if(actx.state==="suspended")await actx.resume();
  if(!bufs){bufs={};for(const[k,u]of Object.entries(NOTES)){bufs[k]=await actx.decodeAudioData(await(await fetch(u)).arrayBuffer());}}
}
async function phrase(){
  await audio();let t=actx.currentTime+.08;const t0=t;
  for(const[n,d]of PHRASE){const s=actx.createBufferSource();s.buffer=bufs[n];const g=actx.createGain();
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.9,t+.02);g.gain.setValueAtTime(.9,t+d);
    g.gain.linearRampToValueAtTime(0,t+d+.14);s.connect(g).connect(actx.destination);s.start(t);s.stop(t+d+.16);t+=d;}
  return (t-t0)*1000;
}
const ARCO={__ARCO__};
const $=(s)=>document.querySelector(s);
const phone=$("#phone"), spot=$("#spot");
function show(id){const el=$("#scr_"+id);if(el.classList.contains("on"))return;
  document.querySelectorAll(".screen").forEach(e=>e.classList.remove("on"));el.classList.add("on");}
function dim(on){$("#dimmer").classList.toggle("on",on);}
// 実画面上の光: %座標 [left, top, width, height]
function spotAt(r){
  if(!r){spot.style.display="none";spot.onclick=null;return;}
  spot.style.display="block";
  spot.style.left=r[0]+"%";spot.style.top=r[1]+"%";spot.style.width=r[2]+"%";spot.style.height=r[3]+"%";
}
function bar(pose,text,step,cta){
  const b=$("#shirube");
  if(pose===null){b.classList.add("hidden");return;}
  b.classList.remove("hidden");
  $("#sbImg").src=ARCO[pose];
  $("#sbText").innerHTML=text;
  $("#sbPips").innerHTML=Array.from({length:7},(_,i)=>`<i class="${i<step?"on":i===step?"now":""}"></i>`).join("");

}
function panel(i){document.querySelectorAll(".stepItem").forEach((e,k)=>e.classList.toggle("now",k===i));}
function pop(sid){document.querySelectorAll(`[data-ev="${sid}"]`).forEach(d=>{d.classList.remove("play");void d.getBoundingClientRect();d.classList.add("play");});}
function confetti(){const cs=["#d9a93c","#f0d9a6","#2b5bc4","#8fa0c4","#edf1fa"];
  for(let i=0;i<30;i++){const s=document.createElement("span");s.className="confetti";
    s.style.left=(5+Math.random()*90)+"%";const z=5+Math.random()*6;s.style.width=z+"px";
    s.style.height=z*(0.4+Math.random())+"px";s.style.background=cs[i%cs.length];
    s.style.animationDuration=(1.1+Math.random()*0.9)+"s";s.style.animationDelay=(Math.random()*0.25)+"s";
    phone.appendChild(s);setTimeout(()=>s.remove(),2600);}}

let cur=-1;
const R_SONGCARD=[4.5,29.8,91,9.5];
const R_BASICS=[4.5,63.5,91,15.5];
const R_EXAMPLE=[10.5,51.5,26.5,8];
const R_RECBTN=[9,71.5,82,8];
const R_TAB_REVIEW=[36.5,20.6,25,6];
const R_TAB_HOME=[4.5,92.4,16,7];
const R_NOBI=[4.5,61.3,91,21.5];
const spot2=document.querySelector("#spot2");
function where(t){$("#whereChip").textContent=t;}
function spot2At(r){if(!r){spot2.style.display="none";return;}
  spot2.style.display="block";
  spot2.style.left=r[0]+"%";spot2.style.top=r[1]+"%";spot2.style.width=r[2]+"%";spot2.style.height=r[3]+"%";}
function countdownThen(cb){show("recording");where("録音中");spotAt(null);spot2At(null);bar(null);
  let n=3;const el=$("#countnum");el.textContent=n;$("#countod").style.display="";
  const iv=setInterval(()=>{n--;if(n>0){el.textContent=n;}else{clearInterval(iv);$("#countod").style.display="none";
    setTimeout(()=>{$("#countod").style.display="";cb();},1500);}},650);}
const FLOW=[
  {scr:"home",w:"ホーム",p:0,go:()=>{dim(true);spot2At(null);spotAt([4.5,29.4,91,26]);bar("point","まずは1回、弾いてみよう。<br>さいしょの1曲をタップ!",0);},tapSpot:true},
  {scr:"ctrl",w:"演奏画面",p:1,go:()=>{spot2At(null);spotAt(R_EXAMPLE);bar("listen","曲のページに来たよ。<br>まずはお手本を聴いてみよう",0);},tapSpot:true,
   async act(){const pc=$("#playchip");if(pc)pc.hidden=false;
     let ms=2600;try{ms=await phrase();}catch(e){}
     setTimeout(()=>{if(pc)pc.hidden=true;next();},Math.min(ms+250,3500));return true;}},
  {scr:"manner",w:"演奏画面",p:2,go:()=>{spotAt(null);spot2At(null);bar("question","はじめての録音。<br>3つだけ覚えてね",1);}},
  {scr:"ctrl",w:"演奏画面",p:3,go:()=>{spotAt(R_RECBTN);spot2At(null);bar("question","「録音して採点」を押して、<br>いまの音をアルコに聴かせて",1);},tapSpot:true,
   act(){countdownThen(next);return true;}},
  {scr:"score72",w:"採点結果",p:4,go:()=>{pop("r72");spot2At([55,49.5,41,15]);spotAt(R_TAB_REVIEW);
    bar("listen","色がのびしろの印だよ。<br>くわしくは「ふりかえり」タブをタップ",2);},tapSpot:true},
  {scr:"review",w:"ふりかえり",p:5,go:()=>{spot2At(R_NOBI);spotAt(R_TAB_HOME);
    bar("listen","結果はまずここに載る。数字がのびしろ。<br>見たら下の「ホーム」タブへ",2);},tapSpot:true},
  {scr:"home2",w:"ホーム",p:6,go:()=>{spot2At(R_SONGCARD);spotAt(R_BASICS);
    bar("point","ホームにも直近72点が載ったよ。<br>弱点は基礎練へ。01 音階をタップ",3);},tapSpot:true,
   act(){show("clearflash");where("基礎練");spotAt(null);spot2At(null);bar(null);setTimeout(next,1700);return true;}},
  {scr:"ctrl",w:"演奏画面",p:7,go:()=>{spotAt(R_RECBTN);spot2At(null);bar("cheer","曲にもどってきたよ。直したところで、<br>もう一回「録音して採点」!",5);},tapSpot:true,
   act(){countdownThen(next);return true;}},
  {scr:"score85",w:"採点結果",p:8,go:()=>{pop("r85");spotAt(null);spot2At(null);
    bar("bravo","赤が緑に変わった! 72点→85点。<br>これが上達の1周だよ",5);
    setTimeout(()=>{if(FLOW[cur]&&FLOW[cur].scr==="score85")next();},3200);}},
  {scr:"card",w:"ごほうび",p:9,go:()=>{confetti();spotAt(null);spot2At(null);
    bar("play","1周のごほうび!<br>「うけとる」を押してね",6);}},
  {scr:"end",w:"ガイド完了",p:10,go:()=>{dim(false);spotAt(null);spot2At(null);bar(null);}},
];
function next(){cur=Math.min(cur+1,FLOW.length-1);run();}
function rippleAtSpot(){const r=spot.getBoundingClientRect(),ph=phone.getBoundingClientRect();
  const sp=document.createElement("span");sp.className="ripple";
  sp.style.left=(r.left-ph.left+r.width/2)+"px";sp.style.top=(r.top-ph.top+r.height/2)+"px";
  phone.appendChild(sp);setTimeout(()=>sp.remove(),600);}
function run(){const st=FLOW[cur];show(st.scr);if(st.w)where(st.w);panel(st.p);st.go();
  if(st.tapSpot){spot.onclick=async()=>{rippleAtSpot();try{if(st.act){if(await st.act())return;}}catch(e){}next();};}}
document.addEventListener("click",(e)=>{if(e.target.closest("[data-adv]"))next();});
$("#branchBack").addEventListener("click",()=>{$("#branchBack").style.display="none";cur=FLOW.length-1;run();});
document.addEventListener("click",(e)=>{const j=e.target.closest("[data-jump]");if(!j)return;
  const to=j.getAttribute("data-jump");
  if(to==="restart"){$("#branchBack").style.display="none";cur=-1;next();return;}
  if(to==="end"){$("#branchBack").style.display="none";cur=FLOW.length-1;run();return;}
  panel(10);spotAt(null);spot2At(null);$("#branchBack").style.display="block";
  if(to==="b_low"){show("score34");where("採点結果");dim(true);pop("rlow");bar("cheer","のびしろが、たくさん見つかった!<br>ここから上手くなるのが楽しいんだ",2);}
  if(to==="b_silent"){show("silent");where("演奏画面");dim(true);bar("think","だいじょうぶ、よくあることだよ。<br>もう一回だけ試してみよう",2);}
  if(to==="x_quest"){show("quest");where("ホーム");dim(true);bar("point","2周目からはクエスト。<br>自分のペースで、達成ごとにカード1枚",6);}
  if(to==="x_clear"){show("clear2");where("曲クリア");dim(false);bar(null);}
});
document.querySelector(".sbSkip").addEventListener("click",()=>{cur=FLOW.length-1;run();});
next();
</script>
"""
JS = JS.replace("__NOTES__", NOTES_JS).replace("__ARCO__", ",".join('"%s":"%s"' % (k, v) for k, v in IMG.items()))

html = ('<title>アルコと最初の1周</title>\n'
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700;900&display=swap">\n'
        '<style>' + CSS + '</style>\n'
        '<div class="page">'
        '<h1>アルコと最初の1周・動くプロトタイプ (本番画面ベース)</h1>'
        '<p class="lead"><b>背景はすべて本番アプリの実スクリーンショット</b> (ホーム・きらきら星の演奏画面)。'
        'その上にガイド層 = 暗幕+金の光+アルコの道しるべバーを重ねています。'
        '光る場所をタップして進んでください。ステップ1のホームは初期ユーザーの実際の見た目 (🌟さいしょの1曲カード) をデモ描画で再現しています。▶では本物の音源が鳴ります。'
        '色丸・点数チップ・ごほうびカード・クエストは新設UIのデモ描画です。</p>'
        '<div class="stage">'
        '<div class="phone" id="phone">'
        + screens_html +
        '<div class="dimmer" id="dimmer"></div>'
        '<div class="spot" id="spot"></div><div class="spot2" id="spot2"></div><button class="branchBack" id="branchBack">‹ もどる</button>'
        '<div class="whereChip" id="whereChip">ホーム</div><button class="sbSkip">スキップ</button>'
        '<div class="shirube hidden" id="shirube">'
        '<div class="sbArco"><img id="sbImg" class="arcoimg" src="" alt=""></div>'
        '<div class="sbBody"><div class="sbText" id="sbText"></div><div class="sbPips" id="sbPips"></div></div>'
        ''
        '</div>'
        '</div>'
        '<div class="panel"><h2>いま何が起きているか</h2>'
        '<div class="stepList">' + panel_html + '</div>'
        '<div class="panelNote"><b>実装の姿:</b> ガイドは全画面共通のオーバーレイ1部品。'
        'WelcomeSlides (7枚) と画面ごとのコーチマーク (現行1/4・1/6の吹き出し) はこれに置き換える。'
        'スキップ常設・途中離脱は続きから。最後の画面から分岐 (低得点・無音) と2周目以降も見られます。</div>'
        '</div>'
        '</div>'
        '</div>\n' + JS)

io.open(OUT, "w", encoding="utf-8", newline="\n").write(html)
print("ok", os.path.getsize(OUT), "bytes")
