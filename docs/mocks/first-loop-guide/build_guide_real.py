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
SHOT_HOMEP = b64(os.path.join(HERE, "shots/16_home_premise.jpg"), "image/jpeg")
SHOT_HOMED = b64(os.path.join(HERE, "shots/16_home_done.jpg"), "image/jpeg")
SHOT_SCORE = b64(os.path.join(HERE, "shots/12_score_clean.jpg"), "image/jpeg")
SHOT_CTRL = b64(os.path.join(HERE, "shots/15_colored.jpg"), "image/jpeg")
SHOT_REVIEW = b64(os.path.join(HERE, "shots/21_review_points.jpg"), "image/jpeg")
BAND_STRIP = b64(os.path.join(HERE, "shots/band_strip.jpg"), "image/jpeg")
SHOT_RESULT = b64(os.path.join(HERE, "shots/51_result_top.jpg"), "image/jpeg")
SHOT_R72 = b64(os.path.join(HERE, "shots/result72_real.jpg"), "image/jpeg")
SHOT_ZOOM = b64(os.path.join(HERE, "shots/80_zoom_red.jpg"), "image/jpeg")
SHOT_TRAJ = b64(os.path.join(HERE, "shots/70_review_graph.jpg"), "image/jpeg")
MAP_ZOOM = b64(os.path.join(HERE, "shots/map_zoom_half.jpg"), "image/jpeg")
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
BGKEYS = {"home": SHOT_HOME, "ctrl": SHOT_CTRL, "r72": SHOT_R72, "result": SHOT_RESULT,
           "review": SHOT_REVIEW, "zoom": SHOT_ZOOM, "traj": SHOT_TRAJ,
           "home2p": SHOT_HOMEP, "homed": SHOT_HOMED}
def bg(key):
    return '<img class="shotbg" data-bg="%s" alt="">' % key

# 採点結果: 実画面の音符 (頭+符幹) をピクセル置換で塗り替えた画像を使う
# (make_recolor.py が生成。上貼りの楕円は使わない)
# 初期ユーザーのホーム: いま練習している曲は出ない。さいしょの1曲カードを実デザインで再現
STARTER = (
    '<div class="fresh-patch"></div>'
    '<div class="starter" id="hlStarter" data-adv>'
    '<div class="stLbl">&#10022; さいしょの1曲</div>'
    '<div class="stBanner"><span class="stCover">&#9834;</span>'
    '<div class="stMeta"><b>きらきら星</b><span>&#9734;1 ・ きみのレベルにぴったり</span></div>'
    '<span class="stArrow">&#8594;</span></div>'
    '<div class="stNote">&#9734;が小さいほど やさしい曲だよ</div>'
    '<div class="stCta">さっそく始めよう</div>'
    '<div class="stLink">ほかの曲を選ぶ</div>'
    '</div>')

S = {}
S["home"] = bg("home") + STARTER
S["home2"] = (bg("home2p") +
    '<div class="ptscover">☆1 ・ 直近 <b>80点</b></div>')
S["ctrl"] = (bg("ctrl") + '<div class="optPlay" data-optplay title="お手本を聴く"></div>'
    + '<div class="lvHide"></div>')
S["ctrl2"] = (bg("ctrl")
    + '<div class="lvName">いい調子</div><div class="lvNum">80</div>')
# 1回目: 2小節目=オレンジ・3小節目=赤・5小節目=オレンジに塗り替え+72点上書き
PERF_ROW5 = '<div class="perfPatch">Performance #5 ・ 2026/8/29</div>'
PERF_ROW6 = '<div class="perfPatch">Performance #6 ・ 2026/8/29</div>'
S["score72"] = (bg("r72") + PERF_ROW5 + '<div class="scorePatch">80<span>点</span></div>' + '<div class="celebBubble">採点できあがったよ！</div>')
# 再挑戦: 実画面 (全緑)。6回目・86点に差し替え
S["score85"] = (bg("result") + PERF_ROW6 + '<div class="scorePatch">95<span>点</span></div>' + '<div class="celebBubble">採点できあがったよ！</div>')
# 低得点ブランチ: 1段目ほぼ全部を塗り替え+34点上書き
S["reviewg"] = (bg("traj") + '<div class="gpCover"></div><svg class="gpSvg" viewBox="0 0 540 250" fill="none"><line x1="10" y1="34" x2="530" y2="34" stroke="#e8b23c" stroke-width="2" stroke-dasharray="6 7" opacity=".8"/><text x="440" y="24" font-size="17" fill="#e8b23c" font-weight="800">達成 90点</text><polyline points="40,196 155,178 270,167 385,145 500,124" stroke="#f6ecd4" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="40" cy="196" r="8" fill="#0f1a33" stroke="#f6ecd4" stroke-width="4"/><circle cx="155" cy="178" r="8" fill="#0f1a33" stroke="#f6ecd4" stroke-width="4"/><circle cx="270" cy="167" r="8" fill="#0f1a33" stroke="#f6ecd4" stroke-width="4"/><circle cx="385" cy="145" r="8" fill="#0f1a33" stroke="#f6ecd4" stroke-width="4"/><circle cx="500" cy="124" r="10" fill="#f6ecd4" stroke="#fff" stroke-width="3"/><text x="30" y="240" font-size="16" fill="#7c8cae" font-weight="700">8/25</text><text x="480" y="240" font-size="16" fill="#7c8cae" font-weight="700">いま</text></svg><div class="numPatch npBig">80</div><div class="numPatch npDelta">&#8599; +6</div><div class="numPatch npPitch">83</div><div class="numPatch npRhythm">77</div><div class="numPatch npBest">80</div><div class="numPatch npAvg">69</div><div class="numPatch npCount">5</div>')
# 本物の拡大モーダル (音程マップ・とじる・台形指板)。セル1つのみ高すぎ色にピクセル置換
S["mapzoom"] = (bg("zoom")
    + '<div class="mzPh">指板の色がついた音をタップすると、ここに「どこからの移動でずれたか」が出ます。</div>')
# 説明: 実物の下枠 (選択セルの判定エリア) の位置に、実装の文言形式で差し替え
S["mapdetail"] = (bg("zoom")
    + '<div class="mdCover"></div>'
    + '<div class="fb2" id="fbDetail">'
      '<div class="fb2Head"><b>シ・A線</b><span class="fb2Pill">高すぎ</span></div>'
      '<div class="fb2Sub">ずれ(4回/10回)・音が高い4回・音が低い0回</div>'
      '<div class="fb2Sec">どこからの移動でずれた？</div>'
      '<div class="fb2Row"><svg class="fb2Fig" width="104" height="50" viewBox="0 0 104 50"><text x="2" y="9.6" font-size="7" fill="#8fa0c4">E</text><line x1="11" y1="7" x2="102" y2="7" stroke="rgba(150,175,225,.14)" stroke-width="1"/><text x="2" y="21.6" font-size="7" fill="#8fa0c4">A</text><line x1="11" y1="19" x2="102" y2="19" stroke="rgba(150,175,225,.4)" stroke-width="1.4"/><text x="2" y="33.6" font-size="7" fill="#8fa0c4">D</text><line x1="11" y1="31" x2="102" y2="31" stroke="rgba(150,175,225,.3)" stroke-width="1"/><text x="2" y="45.6" font-size="7" fill="#8fa0c4">G</text><line x1="11" y1="43" x2="102" y2="43" stroke="rgba(150,175,225,.14)" stroke-width="1"/><line x1="20.2" y1="27.4" x2="21.7" y2="26.2" stroke="#8fa0c4" stroke-width="1.4" stroke-dasharray="3 3"/><polygon points="24.7,23.6 22.9,29.1 19,24.6" fill="#8fa0c4"/><text x="23" y="20.5" font-size="8" font-weight="800" fill="#8fa0c4" text-anchor="middle">↑</text><circle cx="16" cy="31" r="4" fill="rgba(150,175,225,.5)"/><circle cx="30" cy="19" r="5" fill="#2b5bc4" stroke="rgba(255,255,255,.6)" stroke-width="1"/></svg><div class="fb2Tx"><b>レから(D線)</b><div class="fb2Res bad">音が高い(4回/6回)</div></div></div>'
      '<div class="fb2Row bt"><svg class="fb2Fig" width="104" height="50" viewBox="0 0 104 50"><text x="2" y="9.6" font-size="7" fill="#8fa0c4">E</text><line x1="11" y1="7" x2="102" y2="7" stroke="rgba(150,175,225,.14)" stroke-width="1"/><text x="2" y="21.6" font-size="7" fill="#8fa0c4">A</text><line x1="11" y1="19" x2="102" y2="19" stroke="rgba(150,175,225,.4)" stroke-width="1.4"/><text x="2" y="33.6" font-size="7" fill="#8fa0c4">D</text><line x1="11" y1="31" x2="102" y2="31" stroke="rgba(150,175,225,.14)" stroke-width="1"/><text x="2" y="45.6" font-size="7" fill="#8fa0c4">G</text><line x1="11" y1="43" x2="102" y2="43" stroke="rgba(150,175,225,.14)" stroke-width="1"/><line x1="21.5" y1="19" x2="19" y2="19" stroke="#8fa0c4" stroke-width="1.4" stroke-dasharray="3 3"/><polygon points="23,19 18,22 18,16" fill="#8fa0c4"/><text x="23" y="14.5" font-size="8" font-weight="800" fill="#8fa0c4" text-anchor="middle">↑</text><circle cx="16" cy="19" r="4" fill="rgba(150,175,225,.5)"/><circle cx="30" cy="19" r="5" fill="#2b5bc4" stroke="rgba(255,255,255,.6)" stroke-width="1"/></svg><div class="fb2Tx"><b>ラから(同一弦)</b><div class="fb2Res">音が正確(0回/4回)</div></div></div>'
      '</div>')
S["home3"] = (bg("homed") + '<div class="ptscover">☆1 ・ 直近 <b>95点</b></div>' + '<div class="rankNum">★7をあと9曲</div>' + '<div class="rankSliver"></div>')
S["recording"] = (
    '<div class="bandStage">'
    '<div class="bandCaption">スマホを横にすると、譜面が1本の帯になるよ</div>'
    '<div class="bandDevice">'
    '<div class="bandTop"><span class="bandRec"><i></i>REC</span><span class="bandTime">0:02</span></div>'
    '<div class="bandSheet"><img class="bandImg" src="' + BAND_STRIP + '" alt="">'
    '<span class="bandBeat"></span><span class="bandCursor"></span></div>'
    '<div class="bandBar"><span class="bandExit">たて画面にもどす</span>'
    '<span class="bandStop">停止</span>'
    '<span class="bandBpm">&#9833;100</span></div>'
    '</div>'
    '</div>'
    + '<div class="countod" id="countod"><b id="countnum">3</b></div>')
S["manner"] = (bg("ctrl") +
    '<div class="gcardwrap mannerPos"><div class="gcard" id="hlManner">'
    '<div class="gcT">録音の前に、これだけ</div>'
    '<div class="gcR"><i>1</i>スマホを<b>横向き</b>にすると譜面が大きくなる</div>'
    '<div class="gcR"><i>2</i><b>3・2・1</b>のカウントのあとに弾きはじめる</div>'
    '<div class="gcR"><i>3</i><b>テンポガイドの音</b>に合わせて、ゆっくりでOK</div>'
    '<button class="gcBtn" data-adv>わかった</button></div></div>')
S["ring"] = (bg("home2p")
    + '<div class="ptscover">☆1 ・ 直近 <b>95点</b></div>'
    + '<div class="ringWrap"><svg viewBox="0 0 170 170">'
      '<circle class="ringArc" cx="85" cy="85" r="71.5" fill="none" stroke="#e9b23d" stroke-width="15" stroke-linecap="butt"/></svg></div>'
    + '<div class="ringNum"><b>3</b>/3</div>'
    + '<div class="runRow">3/3回</div>'
    + '<div class="runChk">&#10003;</div>'
    + '<div class="achvWrap">'
      '<div class="reward" id="hlCard"><div class="rwArt"><img class="arcoimg" src="' + IMG["bravo"] + '"></div>'
      '<div class="rwTitle">きらきら星・達成</div>'
      '<div class="rwMeta">80→95点・2026.08.29</div>'
      '<div class="rwNo">CARD No.001</div></div>'
      '<button class="sharebtn" data-adv>うけとる</button>'
      '<button class="ghostlink">シェアして自慢する</button></div>')
S["end"] = ('<div class="flashwrap endwrap">'
    '<div class="cyc">'
    '<div class="cy"><i>0</i>聴く</div><em>→</em><div class="cy"><i>1</i>弾く</div><em>→</em>'
    '<div class="cy"><i>2</i>結果</div><em>→</em><div class="cy"><i>3</i>トップ</div><em>→</em>'
    '<div class="cy"><i>4</i>直す</div><em>→</em><div class="cy"><i>5</i>再挑戦</div><span class="loopmk">↺</span></div>'
    '<div class="endlead">これが上達の1周。2周目以降:</div>'
    '<div class="endmenu">'
    '<button data-jump="x_quest">2周目以降: アルコのクエスト</button>'
    '<button data-jump="x_clear">曲クリア→次の曲</button>'
    '<button data-jump="restart" class="goldbtn">もう一度最初から体験する</button>'
    '</div></div>')
def quest(t, s2, done=False):
    return ('<div class="qrow%s"><span class="qck">%s</span><div class="qtx"><b>%s</b><span>%s</span></div><span class="qcd">🎴</span></div>'
            % (" done" if done else "", "✓" if done else "", t, s2))
S["trace"] = (bg("homed")
    + '<div class="ptscover">☆1 ・ 直近 <b>95点</b></div>'
    + '<div class="rankNum">★7をあと9曲</div><div class="rankSliver"></div>'
    + '<div class="trDim"></div>'
    + '<div class="trSheet"><div class="trGrab"></div><button class="trClose">&#10005;</button>'
      '<div class="trTtl">演奏の軌跡</div>'
      '<div class="trCard"><div class="trLab">達成した曲</div>'
      '<div class="trNumRow"><b>1</b><span>/ 10曲</span></div>'
      '<div class="trCoins"><span class="trCoin"><i>95<em>点</em></i></span><span class="trEmpty"></span><span class="trEmpty"></span><span class="trEmpty"></span><span class="trEmpty"></span><span class="trEmpty"></span><span class="trEmpty"></span><span class="trEmpty"></span><span class="trEmpty"></span><span class="trEmpty"></span></div>'
      '</div></div>')
S["review"] = bg("review")
S["quest"] = (bg("home") + '<div class="gcardwrap gcardTop"><div class="gcard" id="hlQuest">'
    '<div class="gcT">アルコのクエスト</div>'
    + quest("はじめての1周", "成長サイクルを回した", True)
    + quest("譜面に書き込みしてみる", "気をつける場所に印を")
    + quest("学びのレッスンを1つ", "新しい技術のコツ")
    + quest("カルテで成長を見る", "2周ぶん貯まったら")
    + quest("ループ練習を使う", "弱点の小節だけくり返す")
    + quest("7日つづけて練習", "毎日15分の力")
    + '<div class="gcNote">達成ごとにカード1枚。ホームに常設するカードのイメージ</div></div></div>')
S["clear2"] = (bg("home") + '<div class="flashwrap flashdim">'
    '<div class="flasharco"><img class="arcoimg" src="' + IMG["bravo"] + '"></div>'
    '<div class="clbadge">きらきら星 クリア!</div>'
    '<div class="clsub">曲マスターまで: 課題をぜんぶクリア+平均90点</div>'
    '<div class="gcard" style="width:88%"><div class="gcR" style="margin:0"><b style="margin-right:auto">つぎはこの曲: G線上のアリア ☆2</b><span class="gobtn">見る</span></div></div>'
    '<button class="ghostlink" data-jump="end">‹ もどる</button></div>')

screens_html = "".join('<div class="screen" id="scr_%s">%s</div>' % (k, v) for k, v in S.items())

STEPS_PANEL = [
    "ホーム: 初期ユーザーの実際の見た目。さいしょの1曲カード自体が金枠発光 (DOM基準・ズレなし)。カードタップで進む",
    "演奏画面: お手本ボタンの紹介 (灰枠)+作法カード3行。カードの「わかった」で進む",
    "演奏画面: 「録音して採点」から 3・2・1、横画面の帯モードデモ。採点前なので現在のレベルは非表示 (実装準拠)",
    "採点結果: 今回=5回目・80点 (音程83/リズム77)。採点完了の吹き出し (実装転写) がふりかえりタブを指す",
    "ふりかえり: 上達のようす。グラフは5回分 60-65-68-74-80。2回弾くと出るよ、の補足つき",
    "音程マップ拡大: 本物の拡大モーダル。赤セル (シ・A線) をタップ",
    "音程マップ: どこからの移動でずれた？は実装 (案C 弦の上で見せる) の転写。ずれ例=レ・D線からの移弦。「とじる」で戻る",
    "ふりかえり: バーが上に退避。下のホームタブをタップ",
    "ホーム: 達成条件の説明 (学びレッスン✓・エチュード✓・通し2/3回=前提)。リングは2/3",
    "ホーム: 学びレッスン・エチュードは行タップでその練習ページに行ける、の説明 (灰枠)",
    "ホーム: 練習メニューの紹介 (灰枠のみ・画面遷移なし)。タップで進む",
    "ホーム: 曲カードをタップして再挑戦へ",
    "演奏画面: 現在のレベル=いい調子・80点 (直近1回)。もう一回「録音して採点」",
    "採点結果: 再挑戦=6回目・95点+吹き出し。これで通して弾く3回め。ホームタブへ",
    "ホーム: 通し3回めでリング完成モーション (2/3から満了・実寸の太さ)→3/3回✓→紙吹雪+達成カード。「うけとる」で進む",
    "ホーム: マイランクカードをタップ (金枠)",
    "演奏の軌跡シート (MyRankCard実装の転写): 達成コイン1枚めがポンと埋まるモーション。10枚でランクアップ",
    "ホーム: マスターの説明 (直近5回の平均90点以上)。タップで進む",
    "完了画面: 上達の1周のまとめと2周目以降のメニュー",
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
.evdot { position:absolute; width:2.9%; aspect-ratio:1.35; border-radius:50%; opacity:0; z-index:3;
  transform:translate(-50%,-50%) rotate(-18deg); box-shadow:0 0 3px rgba(0,0,0,.3); }
.evdot.play { animation:evpop .45s cubic-bezier(.2,1.5,.4,1) both; }
@keyframes evpop { from { opacity:0; transform:translate(-50%,-50%) rotate(-18deg) scale(.2); }
  to { opacity:1; transform:translate(-50%,-50%) rotate(-18deg) scale(1); } }
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
.ptscover { position:absolute; left:24.4%; top:35.0%; width:25%; height:2.0%; z-index:3;
  background:linear-gradient(90deg,#24468e,#2c4ea5); display:flex; align-items:center;
  color:#d9e4fa; font-size:min(1.7cqh,13.5px); font-weight:700; letter-spacing:.02em; white-space:nowrap; overflow:hidden; }
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
.fresh-patch { position:absolute; left:0; right:0; top:19.6%; height:62.5%; background:#0a1122; }
.starter { position:absolute; left:4.5%; right:4.5%; top:21%;
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
.optPlay { position:absolute; left:10.5%; top:51.5%; width:26.5%; height:8%; cursor:pointer; z-index:3; }
/* 帯モード録音画面のデモ: 横にしたスマホのプレビューとして見せる */
.bandStage { position:absolute; inset:0; background:#06090f; display:flex; flex-direction:column;
  align-items:center; justify-content:center; gap:2.2cqh; padding:0 3%; }
.bandCaption { font-size:min(1.7cqh,14px); color:#8fa0c4; font-weight:800; }
.bandDevice { width:100%; aspect-ratio:844/390; background:#0a0f1c; border:1px solid rgba(150,175,225,.25);
  border-radius:14px; box-shadow:0 10px 30px rgba(4,8,20,.6); overflow:hidden;
  display:flex; flex-direction:column; }
.bandTop { display:flex; justify-content:space-between; align-items:center; padding:1cqh 3.5cqw 0; }
.bandRec { display:inline-flex; align-items:center; gap:1cqw; color:#ff9d94; font-size:min(1.4cqh,11px); font-weight:900; letter-spacing:.1em; }
.bandRec i { width:1.2cqh; aspect-ratio:1; border-radius:50%; background:#e5392b; animation:blink 1s infinite; }
.bandTime { color:#cbd6ee; font-size:min(1.5cqh,12px); font-weight:800; font-variant-numeric:tabular-nums; }
.bandSheet { position:relative; margin:auto 3cqw; height:46%; background:#fff; border-radius:8px; overflow:hidden; }
.bandImg { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
.bandCursor { position:absolute; top:4%; bottom:4%; width:2.5px; background:#2b5bc4; border-radius:2px;
  box-shadow:0 0 8px rgba(43,91,196,.8); animation:bandRun 3s linear forwards; animation-play-state:paused; }
.go .bandCursor, .go .bandBeat { animation-play-state:running !important; }
@keyframes bandRun { from { left:6%; } to { left:88%; } }
/* テンポガイドのビート玉: 帯の上で拍ごとに弾む (&#9833;100) */
.bandBeat { position:absolute; top:5%; width:1.8cqh; aspect-ratio:1; border-radius:50%;
  background:#e8b23c; box-shadow:0 0 8px rgba(232,178,60,.8);
  animation:bandRun 3s linear forwards, beatHop .6s ease-in-out infinite; animation-play-state:paused; }
@keyframes beatHop { 0%,100% { transform:translateY(0); } 50% { transform:translateY(1.4cqh); } }
.bandBar { display:flex; align-items:center; justify-content:space-between; padding:0 3.5cqw 1.2cqh; }
.bandExit { color:#8FA0C4; font-size:min(1.35cqh,11px); font-weight:800; }
.bandStop { width:5.4cqh; aspect-ratio:1; border-radius:50%; display:grid; place-items:center;
  background:linear-gradient(180deg,#E05A3C,#C63F26); color:#fff; font-size:min(1.2cqh,10px); font-weight:900;
  box-shadow:0 4px 14px rgba(224,90,60,.35); }
.bandBpm { color:#e8b23c; font-size:min(1.5cqh,12px); font-weight:900; }
.resultCard { position:absolute; left:5%; right:5%; top:74.5%; z-index:3;
  background:linear-gradient(180deg,#1e3053,#15233f); border:1px solid rgba(150,175,225,.2);
  border-radius:16px; padding:1.2cqh 4.5cqw 1.4cqh;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.06), 0 10px 26px rgba(4,8,20,.5); }
.rcTop { display:flex; align-items:baseline; gap:2.6cqw; }
.rcHead { font-size:min(1.5cqh,12px); color:#8fa0c4; font-weight:800; }
.rcMain { color:#edf1fa; font-size:min(1.7cqh,13px); }
.rcMain b { font-size:min(3.2cqh,26px); font-weight:900; }
.rcLegend { margin-left:auto; display:inline-flex; align-items:center; gap:1.5cqw;
  font-size:min(1.3cqh,10px); color:#8fa0c4; font-weight:700; }
.rcLegend i { width:1.3cqh; aspect-ratio:1; border-radius:50%; display:inline-block; }
.rcRow { display:flex; align-items:center; gap:2.4cqw; margin-top:.8cqh; }
.rcRow span { flex:none; width:12cqw; font-size:min(1.5cqh,12px); color:#cbd6ee; font-weight:800; }
.rcBar { flex:1; height:1.1cqh; border-radius:999px; background:rgba(150,175,225,.16); overflow:hidden; }
.rcBar b { display:block; height:100%; border-radius:999px; background:linear-gradient(90deg,#2b5bc4,#7aa7ff); }
.rcRow em { flex:none; width:7cqw; text-align:right; font-style:normal; font-size:min(1.6cqh,13px); font-weight:900; color:#edf1fa; }
.shirubeTop { bottom:auto !important; top:8.5% !important; }
/* 実画面の98点の上に重ねる点数上書き (位置=Performance行の右) */
.scorePatch { position:absolute; left:67.8%; top:21.4%; width:12%; height:4.2%; z-index:3;
  background:#0d1730; display:flex; align-items:center; justify-content:center;
  color:#e8b23c; font-size:min(2.6cqh,21px); font-weight:900; border-radius:8px; }
.scorePatch span { font-size:min(1.5cqh,12px); margin-left:.2em; }
/* 音程マップ拡大デモ */
.zoomWrap { position:absolute; inset:0; background:#0a1122; display:flex; flex-direction:column;
  align-items:center; padding:12% 4% 0; gap:1.6cqh; }
.zoomTitle { font-size:min(2cqh,17px); font-weight:900; color:#edf1fa; }
.zoomImg { width:100%; border-radius:10px; }
.zoomLegend { display:flex; gap:3.4cqw; }
.zoomLegend span { display:inline-flex; align-items:center; gap:1.2cqw; font-size:min(1.5cqh,12px); color:#8fa0c4; font-weight:700; }
.zoomLegend i { width:1.6cqh; aspect-ratio:1; border-radius:4px; display:inline-block; }
.fbDetail { width:100%; background:linear-gradient(180deg,#1e3053,#15233f); border:1px solid rgba(150,175,225,.2);
  border-radius:14px; padding:1.5cqh 4cqw; margin-top:1cqh; }
.fbHead { display:flex; align-items:baseline; gap:2.4cqw; }
.fbHead b { font-size:min(2cqh,17px); color:#edf1fa; font-weight:900; }
.fbHead span { font-size:min(1.5cqh,12px); color:#8fa0c4; font-weight:700; }
.fbJudge { margin-left:auto; color:#e26a5d !important; font-weight:900 !important; font-size:min(1.6cqh,13px) !important; }
.fbSec { margin-top:1.3cqh; font-size:min(1.5cqh,12px); color:#8fa0c4; font-weight:800; }
.fbRow { display:flex; align-items:center; gap:2.4cqw; margin-top:.9cqh; }
.fbRow span { flex:none; width:22cqw; font-size:min(1.55cqh,12px); color:#cbd6ee; font-weight:800; }
.fbBar { flex:1; height:1.05cqh; border-radius:999px; background:rgba(150,175,225,.16); overflow:hidden; }
.fbBar b { display:block; height:100%; border-radius:999px; background:linear-gradient(90deg,#2b5bc4,#7aa7ff); }
.fbRow em { flex:none; font-style:normal; font-size:min(1.45cqh,11px); font-weight:900; color:#5cc98a; }
.fbRow em.bad { color:#e26a5d; }
/* Performance行の差し替え (番号・日付) */
.perfPatch { position:absolute; left:11.5%; top:21.6%; width:53%; height:3.4%; z-index:3;
  background:#131f3a; display:flex; align-items:center;
  color:#e8b23c; font-size:min(1.85cqh,15px); font-weight:800; letter-spacing:.01em; }
/* ふりかえりの数値差し替え */
.gpCover { position:absolute; left:15%; top:8.2%; width:70%; height:17.6%; background:#121d38; z-index:2; }
.gpSvg { position:absolute; left:15%; top:8.2%; width:70%; height:16%; z-index:3; }
.numPatch { position:absolute; z-index:3; background:#121d38; display:flex; align-items:center; justify-content:flex-start; }
.npBig { left:13.5%; top:0%; width:14%; height:3.6%; color:#f6ecd4; font-size:min(4.2cqh,34px); font-weight:900; }
.npDelta { left:27%; top:0%; width:17%; height:3.2%; color:#5cc98a; font-size:min(1.7cqh,14px); font-weight:900;
  background:#182742; border-radius:8px; justify-content:center; }
.npPitch { left:15.5%; top:35.2%; width:14%; height:4.2%; color:#e8a13c; font-size:min(3.4cqh,28px); font-weight:900; }
.npRhythm { left:52%; top:35.2%; width:14%; height:4.2%; color:#79c7c0; font-size:min(3.4cqh,28px); font-weight:900; }
.npBest { left:20.5%; top:42.6%; width:10%; height:3.4%; color:#edf1fa; font-size:min(2.6cqh,21px); font-weight:900; justify-content:center; }
.npAvg { left:45.5%; top:42.6%; width:10%; height:3.4%; color:#edf1fa; font-size:min(2.6cqh,21px); font-weight:900; justify-content:center; }
.npCount { left:70.5%; top:42.6%; width:10%; height:3.4%; color:#edf1fa; font-size:min(2.6cqh,21px); font-weight:900; justify-content:center; }
.zoomClose { position:absolute; right:4.5%; top:6.7%; width:4.4cqh; aspect-ratio:1; border-radius:50%;
  background:#15233f; border:1px solid rgba(150,175,225,.3); color:#cbd6ee; cursor:pointer;
  font-size:min(1.9cqh,16px); font-weight:900; display:grid; place-items:center; font-family:inherit; }
.fgGrid { display:grid; grid-template-columns:5cqw repeat(8,1fr); width:100%;
  border-radius:10px; overflow:hidden; border:1px solid #9aa1ac; background:#fdfdfb; }
.fgLbl { display:grid; place-items:center; background:#eceff3; color:#5a6472;
  font-size:min(1.5cqh,12px); font-weight:900; border-bottom:1px solid #c8ccd4; }
.fgCell { display:grid; place-items:center; aspect-ratio:1.15; background:#fdfdfb; color:#6a7482;
  font-size:min(1.8cqh,15px); font-weight:800;
  border-left:1px solid #c8ccd4; border-bottom:1px solid #c8ccd4; }
.fgGreen { background:#d9efd9; color:#3e5a44; }
.fgRed { background:#e26a5d; color:#fff; }
.tapHint { margin-top:2.4cqh; font-size:min(1.5cqh,12px); color:#5e7099; font-weight:700; }
/* 実モーダルの下枠の位置に説明を重ねる */
.mdCover { position:absolute; left:4.05%; top:54.4%; width:91.9%; height:27%; background:#15233f;
  border:1px solid rgba(150,175,225,.14); border-top:none; border-radius:0 0 24px 24px; z-index:2; }
.fb2 { position:absolute; left:7.7%; top:55.2%; width:84.6%; background:#111d38; border-radius:14px;
  padding:1.5cqh 4cqw; z-index:3; }
.fb2Head { display:flex; align-items:center; gap:2.4cqw; }
.fb2Head b { font-size:min(2cqh,17px); color:#edf1fa; font-weight:900; }
.fb2Pill { font-size:min(1.4cqh,11px); font-weight:900; color:#fff; background:#e26a5d; border-radius:999px; padding:1px 8px; }
.fb2Sub { margin-top:.5cqh; font-size:min(1.5cqh,12px); color:#8fa0c4; font-weight:700; }
.fb2Sec { margin-top:1.2cqh; font-size:min(1.5cqh,12px); color:#8fa0c4; font-weight:800; }
.fb2Row { display:flex; align-items:center; gap:2.6cqw; padding:.9cqh 0; }
.fb2Row.bt { border-top:1px dashed rgba(150,175,225,.16); }
.fb2Fig { flex:none; width:27cqw; height:auto; }
.fb2Tx { min-width:0; }
.fb2Tx b { font-size:min(1.7cqh,13px); color:#edf1fa; font-weight:900; }
.fb2Res { font-size:min(1.5cqh,12px); font-weight:800; margin-top:.3cqh; color:#5cc98a; }
.fb2Res.bad { color:#e26a5d; }
/* ランクゲージ+1曲 (達成コイン) */
.rankNum { position:absolute; left:66%; top:10.55%; width:29%; height:1.5%; z-index:3; background:#182742;
  display:flex; align-items:center; justify-content:flex-end; color:#e8b23c; font-size:min(1.75cqh,14px); font-weight:900; }
.rankSliver { position:absolute; left:9.4%; top:13.02%; width:8%; height:0.5%; z-index:3;
  background:linear-gradient(90deg,#d9a93c,#f0cd7c); border-radius:999px; }
.mannerPos { align-items:flex-start; padding-top:59.5cqh; }
.mzPh { position:absolute; left:7.7%; top:54.9%; width:84.6%; height:7.3%; z-index:2;
  background:#111d38; border-radius:14px; padding:1.4cqh 4cqw; color:#8fa0c4;
  font-size:min(1.55cqh,12px); font-weight:700; line-height:1.55; }
/* 採点完了の吹き出し (CelebrationBanner 転写: ふりかえりタブ中心の真上) */
.celebBubble { position:absolute; left:50%; top:9.7%; transform:translateX(-50%); z-index:6;
  display:inline-flex; align-items:center; background:#1E3A8A; color:#fff;
  border-radius:999px; padding:.75cqh 3.6cqw; font-size:min(1.6cqh,12.5px); font-weight:800;
  white-space:nowrap; box-shadow:0 3px 10px rgba(20,35,70,.28); animation:celebBubbleIn .3s ease; }
.celebBubble::after { content:""; position:absolute; left:50%; bottom:-4px; width:10px; height:10px;
  background:#1E3A8A; transform:translateX(-50%) rotate(45deg); }
@keyframes celebBubbleIn { from { opacity:0; transform:translateX(-50%) translateY(4px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
/* 現在のレベル: 採点前は非表示 (実装準拠) / 2回目は いい調子・80 */
.lvHide { position:absolute; left:9.3%; top:62.6%; width:81%; height:7.8%; background:#0d1226; z-index:2; }
.lvName { position:absolute; left:13.5%; top:66.6%; width:15%; height:2.1%; z-index:2; background:#111c38;
  display:flex; align-items:center; color:#7fa4e8; font-size:min(1.6cqh,13px); font-weight:900; }
.lvNum { position:absolute; left:73.8%; top:65.5%; width:8.4%; height:2.9%; z-index:2; background:#111c38;
  display:flex; align-items:center; justify-content:flex-end; color:#f6ecd4;
  font-size:min(3.6cqh,29px); font-weight:900; text-shadow:0 0 24px rgba(255,243,220,.28); }
/* 弾けるリング完成モーション+達成カード */
.ringWrap { position:absolute; left:7.76%; top:50.42%; width:21.79%; aspect-ratio:1; z-index:6; }
.ringWrap svg { width:100%; height:100%; transform:rotate(-90deg); }
.ringArc { stroke-dasharray:449.25; stroke-dashoffset:149.75; animation:ringFill 1s .5s ease-out forwards; }
@keyframes ringFill { to { stroke-dashoffset:0; } }
.ringNum, .ringNumS { position:absolute; left:13.4%; top:53.9%; width:8.8%; height:3.3%; z-index:6; background:#192849;
  display:flex; align-items:center; justify-content:center; gap:1px; color:#8fa0c4;
  font-size:min(1.6cqh,12px); font-weight:800; }
.ringNum { opacity:0; animation:ringNumIn .3s 1.6s ease forwards; }
.ringNum b, .ringNumS b { color:#f8eed3; font-size:min(2.8cqh,22px); font-weight:900; }
@keyframes ringNumIn { to { opacity:1; } }
.runRow { position:absolute; left:83.1%; top:58.2%; width:10.5%; height:2.25%; z-index:6; background:#192847;
  display:flex; align-items:center; justify-content:flex-end; color:#8ea0c4;
  font-size:min(1.75cqh,14px); font-weight:800; opacity:0; animation:ringNumIn .3s 1.6s ease forwards; }
.runChk { position:absolute; left:31.3%; top:58.1%; width:5.5%; aspect-ratio:1; z-index:6; border-radius:50%;
  background:#e9b23d; color:#332d2f; display:grid; place-items:center; font-size:min(1.9cqh,15px); font-weight:900;
  opacity:0; animation:ringNumIn .3s 1.6s ease forwards; }
.goldhl { box-shadow:0 0 0 3px #f0cd7c, 0 0 30px rgba(232,178,60,.5) !important; }
.achvWrap { position:absolute; inset:0; z-index:30; display:flex; flex-direction:column; align-items:center;
  justify-content:center; gap:1.8cqh; background:rgba(6,10,22,.62);
  opacity:0; pointer-events:none; transition:opacity .5s ease; }
.achvWrap.shown { opacity:1; pointer-events:auto; }
.shirube.shirubeHigh { top:0.6% !important; bottom:auto; }
/* 演奏の軌跡シート (MyRankCard 転写)+コイン追加モーション */
.trDim { position:absolute; inset:0; background:rgba(20,15,10,.5); z-index:8; }
.trSheet { position:absolute; left:0; right:0; top:0; z-index:9; background:#121d38;
  border:1px solid rgba(150,175,225,.16); border-top:none; border-radius:0 0 20px 20px;
  box-shadow:0 8px 30px rgba(0,0,0,.35); padding:4.8cqh 3.6cqw 2.6cqh; animation:trUp .32s cubic-bezier(.2,1,.3,1); }
@keyframes trUp { from { transform:translateY(-30%); opacity:0; } }
.trGrab { width:42px; height:4px; border-radius:3px; background:rgba(150,175,225,.12); margin:1.1cqh auto .3cqh; }
.trClose { position:absolute; top:5cqh; right:3cqw; width:3.4cqh; aspect-ratio:1; border-radius:50%; border:none;
  background:#1b2a4a; color:#8fa0c4; font-size:min(1.7cqh,14px); display:grid; place-items:center; }
.trTtl { text-align:center; font-size:min(1.9cqh,15px); font-weight:800; color:#edf1fa; margin:.3cqh 0 .9cqh; }
.trCard { background:#111c38; border:1px solid rgba(150,175,225,.08); border-radius:14px; padding:1.5cqh 4cqw 2cqh; }
.trLab { font-size:min(1.5cqh,12px); color:#8fa0c4; font-weight:800; }
.trNumRow { display:flex; align-items:flex-end; gap:2cqw; margin-top:.6cqh; }
.trNumRow b { font-size:min(6cqh,48px); line-height:1; color:#edf1fa; font-weight:900; }
.trNumRow span { padding-bottom:.8cqh; font-size:min(1.55cqh,12px); color:#8fa0c4; font-weight:800; }
.trCoins { display:flex; align-items:center; margin-top:1.8cqh; padding:.6cqh 0; overflow:hidden; }
.trCoin { flex:none; width:13.8cqw; aspect-ratio:1; border-radius:50%; z-index:2; display:grid; place-items:center;
  background:radial-gradient(circle at 34% 28%,#FFE08A,#E8B23C 52%,#A5761C);
  border:1.5px solid rgba(255,240,200,.5); box-shadow:0 4px 12px rgba(0,0,0,.4);
  animation:coinPop .55s .8s cubic-bezier(.2,1.6,.4,1) both; }
.trCoin i { font-style:normal; text-align:center; color:#3A2705; font-size:min(2.1cqh,17px); font-weight:900; line-height:1; }
.trCoin i em { display:block; font-style:normal; font-size:min(1cqh,8px); font-weight:800; opacity:.72; margin-top:1px; }
@keyframes coinPop { from { transform:scale(0); } 70% { transform:scale(1.18); } to { transform:scale(1); } }
.trEmpty { flex:none; width:13.8cqw; aspect-ratio:1; margin-left:-3.5cqw; border-radius:50%;
  background:rgba(150,175,225,.06); border:1.5px dashed rgba(150,175,225,.18); }
/* 説明ステップの送りチップ (advTap時にバー右端へ自動表示) */
.advChip { flex:none; margin-left:auto; align-self:center; z-index:41; cursor:pointer;
  background:linear-gradient(135deg,#d9a93c,#f0cd7c); color:#241a05; border-radius:999px;
  padding:.6cqh 3.2cqw; font-size:min(1.55cqh,12px); font-weight:900; letter-spacing:.04em;
  animation:chipPulse 1.6s ease-in-out infinite; }
@keyframes chipPulse { 0%,100% { transform:scale(1); box-shadow:0 0 0 0 rgba(232,178,60,.5); }
  50% { transform:scale(1.07); box-shadow:0 0 0 8px rgba(232,178,60,0); } }
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
const R_TAB_REVIEW_R=[40,13.2,20,5.6];  // 採点結果背景(51)用
const R_TAB_HOME=[4.5,92.4,16,7];
const R_NOBI=[4.5,61.3,91,21.5];
const spot2=document.querySelector("#spot2");
function where(t){$("#whereChip").textContent=t;}
function barTop(on){const el=$("#shirube");el.classList.toggle("shirubeTop",!!on);el.classList.toggle("shirubeHigh",on==="high");}
function spot2At(r){if(!r){spot2.style.display="none";return;}
  spot2.style.display="block";
  spot2.style.left=r[0]+"%";spot2.style.top=r[1]+"%";spot2.style.width=r[2]+"%";spot2.style.height=r[3]+"%";}
function countdownThen(cb){show("recording");where("録音中・横画面");spotAt(null);spot2At(null);bar(null);
  const dev0=document.querySelector("#scr_recording .bandDevice");if(dev0)dev0.classList.remove("go");
  let n=3;const el=$("#countnum");el.textContent=n;$("#countod").style.display="";
  const iv=setInterval(()=>{n--;if(n>0){el.textContent=n;}else{clearInterval(iv);$("#countod").style.display="none";
    const dev=document.querySelector(".screen.on .bandDevice");if(dev)dev.classList.add("go");
    setTimeout(()=>{$("#countod").style.display="";cb();},3000);}},650);}
const FLOW=[
  {scr:"home",w:"ホーム",p:0,go:()=>{dim(true);barTop(false);spot2At(null);spotAt(null);
    document.querySelector("#scr_home .starter").classList.add("goldhl");
    bar("point","まずは1回、弾いてみよう。<br>さいしょの1曲をタップ!",0);}},
  {scr:"manner",w:"演奏画面",p:1,go:()=>{barTop(false);spotAt(null);spot2At([10,51,28,8]);
    bar("question","曲のページに来たよ。お手本も聴けるよ。<br>録音の前に、これだけ覚えてね",1);}},
  {scr:"ctrl",w:"演奏画面",p:2,go:()=>{barTop(false);spotAt(R_RECBTN);spot2At(null);
    bar("question","「録音して採点」を押して、<br>いまの音をアルコに聴かせて",1);},tapSpot:true,
   act(){countdownThen(next);return true;}},
  {scr:"score72",w:"採点結果",p:3,go:()=>{barTop(false);pop("r72");spot2At([3.5,20.6,93,5.8]);spotAt(R_TAB_REVIEW_R);
    bar("listen","弾いた結果は80点。音程83・リズム77。<br>次は「ふりかえり」をタップ",2);},tapSpot:true},
  {scr:"reviewg",w:"ふりかえり",p:4,go:()=>{barTop(false);spot2At([9,0,82,48]);spotAt([15,72.3,72,6]);
    bar("listen","上達のようすもここ。2回弾くとグラフが出るよ。<br>見たら、下の指板をタップして大きくしよう",2);},tapSpot:true},
  {scr:"mapzoom",w:"音程マップ",p:5,go:()=>{barTop(false);spot2At(null);spotAt([21.3,44.6,4.9,2.1]);
    bar("question","色がついた音がずれた音。<br>赤いところをタップしてみて",2);},tapSpot:true},
  {scr:"mapdetail",w:"音程マップ",p:6,go:()=>{barTop(false);spotAt([72.8,37.4,19.6,3.6]);spot2At([6.5,54.9,87,25.8]);
    bar("listen","どこからの移動でずれたかまで見られるよ。<br>じっくり見たら「とじる」をタップ",2);},tapSpot:true},
  {scr:"review",w:"ふりかえり",p:7,go:()=>{barTop(true);spot2At(null);spotAt(R_TAB_HOME);
    bar("point","つぎはホームへ。<br>下の「ホーム」タブをタップ",3);},tapSpot:true},
  {scr:"home2",w:"ホーム",p:8,advTap:true,go:()=>{barTop(false);spotAt(null);spot2At([4.5,46.5,91,15.8]);
    bar("point","達成の条件はこの3つ。学びレッスンとエチュード、<br>「通して弾く」3回。きみはあと通し1回!",4);}},
  {scr:"home2",w:"ホーム",p:9,advTap:true,go:()=>{barTop(false);spotAt(null);spot2At([30.5,50.3,63,7]);
    bar("point","学びレッスンとエチュードは、この行をタップすると<br>その練習ページに行けるよ",4);}},
  {scr:"home2",w:"ホーム",p:10,advTap:true,go:()=>{barTop(false);spotAt(null);spot2At(R_BASICS);
    bar("point","下の練習メニューには、曲の上達にあった<br>練習が出るんだ",4);}},
  {scr:"home2",w:"ホーム",p:11,go:()=>{barTop(false);spot2At(null);spotAt(R_SONGCARD);
    bar("point","練習したら、もう一回チャレンジ!<br>曲カードをタップ",4);},tapSpot:true},
  {scr:"ctrl2",w:"演奏画面",p:12,go:()=>{barTop(false);spotAt(R_RECBTN);spot2At(null);
    bar("cheer","曲にもどってきたよ。直したところで、<br>もう一回「録音して採点」!",5);},tapSpot:true,
   act(){countdownThen(next);return true;}},
  {scr:"score85",w:"採点結果",p:13,go:()=>{barTop("high");spot2At(null);spotAt(R_TAB_HOME);
    bar("bravo","いい演奏! これで「通して弾く」が3回め。<br>下の「ホーム」タブへ",5);},tapSpot:true},
  {scr:"ring",w:"ホーム",p:14,go:()=>{barTop(true);spotAt(null);spot2At(null);
    bar("bravo","「通して弾く」3回で、弾けるリングが完成!<br>この曲は「達成」だ",5);
    const w=document.querySelector("#scr_ring .achvWrap");if(w)w.classList.remove("shown");
    const r=cur;setTimeout(()=>{if(cur===r){if(w)w.classList.add("shown");confetti();
      bar("play","達成カードをゲット!<br>「うけとる」を押してね",6);}},2300);}},
  {scr:"home3",w:"ホーム",p:15,go:()=>{barTop(false);spot2At(null);spotAt([5,0.8,90,17.5]);
    bar("bravo","達成すると、マイランクに達成コインがたまるよ。<br>マイランクカードをタップ!",5);},tapSpot:true},
  {scr:"trace",w:"演奏の軌跡",p:16,advTap:true,go:()=>{barTop(false);spotAt(null);spot2At(null);
    bar("bravo","達成コインが1枚たまった!<br>10枚あつめるとランクアップだ",5);}},
  {scr:"home3",w:"ホーム",p:17,advTap:true,go:()=>{barTop(false);spotAt(null);spot2At([4.5,46.5,91,15.8]);
    bar("point","つぎの目標は「マスター」。直近5回の平均90点以上で、<br>この曲は完全にきみのものだ",6);}},
  {scr:"end",w:"ガイド完了",p:18,go:()=>{dim(false);spotAt(null);spot2At(null);bar(null);}},
];
function next(){cur=Math.min(cur+1,FLOW.length-1);run();}
function rippleAtSpot(){const r=spot.getBoundingClientRect(),ph=phone.getBoundingClientRect();
  const sp=document.createElement("span");sp.className="ripple";
  sp.style.left=(r.left-ph.left+r.width/2)+"px";sp.style.top=(r.top-ph.top+r.height/2)+"px";
  phone.appendChild(sp);setTimeout(()=>sp.remove(),600);}
function run(){const st=FLOW[cur];show(st.scr);if(st.w)where(st.w);panel(st.p);st.go();
  const oldC=$("#advcatch");if(oldC)oldC.remove();
  const oldChip=$("#advchip");if(oldChip)oldChip.remove();
  if(st.advTap){const c=document.createElement("div");c.id="advcatch";c.setAttribute("data-adv","");
    c.style.cssText="position:absolute;inset:0;z-index:40;cursor:pointer;";phone.appendChild(c);
    const ch=document.createElement("span");ch.id="advchip";ch.className="advChip";ch.setAttribute("data-adv","");
    ch.textContent="つづける";$("#shirube").appendChild(ch);}
  if(st.tapSpot){spot.onclick=async()=>{rippleAtSpot();try{if(st.act){if(await st.act())return;}}catch(e){}next();};}}
document.addEventListener("click",async(e)=>{
  if(!e.target.closest("[data-optplay]"))return;
  try{await phrase();}catch(err){}
});
document.addEventListener("click",(e)=>{if(e.target.closest("[data-adv]"))next();});
document.addEventListener("click",(e)=>{
  if(!e.target.closest("#zoomClose"))return;
  const st=FLOW[cur];
  if(st&&st.scr==="mapdetail")next();
});
$("#branchBack").addEventListener("click",()=>{$("#branchBack").style.display="none";cur=FLOW.length-1;run();});
document.addEventListener("click",(e)=>{const j=e.target.closest("[data-jump]");if(!j)return;
  const to=j.getAttribute("data-jump");
  if(to==="restart"){$("#branchBack").style.display="none";cur=-1;next();return;}
  if(to==="end"){$("#branchBack").style.display="none";cur=FLOW.length-1;run();return;}
  panel(10);spotAt(null);spot2At(null);$("#branchBack").style.display="block";
  if(to==="x_quest"){show("quest");where("ホーム");dim(true);bar("point","2周目からはクエスト。<br>自分のペースで、達成ごとにカード1枚",6);}
  if(to==="x_clear"){show("clear2");where("曲クリア");dim(false);bar(null);}
});
document.querySelector(".sbSkip").addEventListener("click",()=>{cur=FLOW.length-1;run();});
const BGMAP={__BGS__};
document.querySelectorAll("img[data-bg]").forEach((el)=>{el.src=BGMAP[el.getAttribute("data-bg")];});
next();
</script>
"""
JS = JS.replace("__NOTES__", NOTES_JS).replace("__ARCO__", ",".join('"%s":"%s"' % (k, v) for k, v in IMG.items()))
JS = JS.replace("__BGS__", ",".join('"%s":"%s"' % (k, v) for k, v in BGKEYS.items()))

html = ('<title>アルコと最初の1周</title>\n'
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700;900&display=swap">\n'
        '<style>' + CSS + '</style>\n'
        '<div class="page">'
        '<h1>アルコと最初の1周・動くプロトタイプ (本番画面ベース)</h1>'
        '<p class="lead"><b>背景はすべて本番アプリの実スクリーンショット</b> (ホーム・きらきら星の演奏画面)。'
        'その上にガイド層 = 暗幕+金の光+アルコの道しるべバーを重ねています。'
        '光る場所をタップして進んでください。お手本のボタンを押すと本物の音源が鳴ります。ステップ1のホームは初期ユーザーの実際の見た目 (🌟さいしょの1曲カード) をデモ描画で再現しています。▶では本物の音源が鳴ります。'
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
        'スキップ常設・途中離脱は続きから。最後の画面から2周目以降も見られます。</div>'
        '</div>'
        '</div>'
        '</div>\n' + JS)

io.open(OUT, "w", encoding="utf-8", newline="\n").write(html)
print("ok", os.path.getsize(OUT), "bytes")
