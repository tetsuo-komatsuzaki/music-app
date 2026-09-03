# -*- coding: utf-8 -*-
import io, os
SP = os.environ.get("SP")

html = r"""<title>伸びしろポイントの検討</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700;900&display=swap">
<style>
:root{
  --ink:#0a1526; --panel:#12203a; --deep:#0b1526; --line:rgba(150,175,225,.16);
  --text:#eaf0fb; --sub:#9db0d0; --dim:#6e83a8;
  --blue2:#3f74e0; --gold:#E0A73C; --warm:#e08e64; --good:#7fc4a0;
}
*{box-sizing:border-box}
body{margin:0;background:var(--ink);color:var(--text);
  font-family:"Zen Kaku Gothic New","Hiragino Kaku Gothic ProN",system-ui,sans-serif;
  font-size:15px;line-height:1.75;-webkit-font-smoothing:antialiased}
.wrap{max-width:940px;margin:0 auto;padding:36px 20px 90px}
h1{font-size:28px;font-weight:900;margin:0 0 8px;letter-spacing:.01em}
.lead{color:var(--sub);margin:0 0 8px;max-width:70ch}
.stamp{display:inline-block;font-size:11px;color:var(--dim);border:1px solid var(--line);
  border-radius:999px;padding:4px 12px;margin-bottom:30px}
h2{font-size:19px;font-weight:900;margin:44px 0 12px;padding-bottom:9px;border-bottom:1px solid var(--line)}
h3{font-size:15px;font-weight:900;margin:26px 0 8px;color:var(--text)}
p{margin:0 0 12px;color:var(--sub)}
p b,li b{color:var(--text)}
ul{margin:0 0 12px;padding-left:19px;color:var(--sub)}
li{margin:6px 0}
table{width:100%;border-collapse:collapse;font-size:13.5px;margin:10px 0 4px}
th,td{text-align:left;padding:10px;border-bottom:1px solid var(--line);vertical-align:top}
th{color:var(--dim);font-weight:700;font-size:12px;letter-spacing:.06em}
td b{color:var(--gold)}
td.bad{color:var(--warm)}
td.good{color:var(--good)}
.scroll{overflow-x:auto}
.card{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:18px 20px;margin:14px 0}
.card h4{margin:0 0 8px;font-size:14px;font-weight:900}
.finding{background:linear-gradient(135deg,rgba(224,142,100,.13),rgba(224,142,100,.03));
  border:1px solid rgba(224,142,100,.36);border-radius:16px;padding:18px 20px;margin:16px 0}
.finding h4{margin:0 0 8px;font-size:15px;font-weight:900;color:var(--warm)}
.verdict{background:linear-gradient(135deg,rgba(224,167,60,.12),rgba(224,167,60,.03));
  border:1px solid rgba(224,167,60,.34);border-radius:16px;padding:20px;margin:20px 0}
.verdict h4{margin:0 0 8px;font-size:16px;font-weight:900;color:var(--gold)}
.axis{display:grid;gap:1px;background:var(--line);border:1px solid var(--line);border-radius:14px;overflow:hidden;margin:14px 0}
.ax{display:grid;grid-template-columns:130px 1fr;gap:14px;background:var(--panel);padding:13px 15px;font-size:13.5px}
@media(max-width:640px){.ax{grid-template-columns:1fr}}
.ax .k{color:var(--gold);font-weight:700;font-size:12.5px}
.ax .v{color:var(--sub)}
.ax .v b{color:var(--text)}
.small{font-size:12.5px;color:var(--dim)}
</style>

<div class="wrap">
<h1>伸びしろポイントの検討</h1>
<p class="lead">このアプリに伸びしろという概念が必要かを、6つの観点から検討したもの。数字はすべて本番データベースの実ユーザー3人の記録から計算しています。</p>
<div class="stamp">2026-09-03 ・ 実ユーザー3人 ・ 録音57件</div>

<h2>2つの伸びしろ</h2>
<p>この会話で伸びしろは2つの意味で出てきました。分けて検討します。</p>
<div class="axis">
  <div class="ax"><div class="k">伸びしろ ①</div><div class="v"><b>余分に外した音数</b>。その項目の失敗率から本人の全体の失敗率を引き、判定音数を掛けた値。おすすめ練習で犯人を選ぶ内部の物差しとして使うと決めたもの</div></div>
  <div class="ax"><div class="k">伸びしろ ②</div><div class="v"><b>伸びしろランキング</b>。偏差値の設計にあった案で、全履歴の失点を分野に配分し「ここを直すと偏差値が何点上がる」と示すもの。将来開発として保留中</div></div>
</div>

<h2>実データで何が起きるか</h2>
<p>①をそのまま順位付けに使うと、2つの問題が出ました。</p>

<h3>問題1 ・ 上位が入れ替わる</h3>
<p>記録を前半と後半に割って、それぞれ伸びしろ順を出しました。</p>
<div class="scroll"><table>
<tr><th>ユーザー</th><th>前半の1位</th><th>後半の1位</th><th>上位3の残留</th></tr>
<tr><td>A ・ 22件</td><td>16分音符のリズム</td><td>8分音符のリズム</td><td class="bad">3件中1件</td></tr>
<tr><td>B ・ 20件</td><td>8分音符のリズム</td><td>8分音符のリズム</td><td class="bad">3件中1件</td></tr>
<tr><td>C ・ 15件</td><td>16分音符のリズム</td><td>となりの弦へ大きく跳ぶ</td><td class="bad">3件中1件</td></tr>
</table></div>
<p><b>3人とも残留率33%</b>でした。期間を変えると上位3のうち2つが入れ替わります。ユーザーに「ここを直そう」と言った翌週には、別の項目が1位になっている状態です。</p>

<h3>問題2 ・ 直しても点が動かない</h3>
<p>上位1件を本人の平均並みまで直したとき、失点が何%減るかを計算しました。</p>
<div class="scroll"><table>
<tr><th>ユーザー</th><th>いまの失点</th><th>1位を直したあと</th><th>減る割合</th></tr>
<tr><td>A</td><td>4603音</td><td>4567音</td><td class="bad">1%</td></tr>
<tr><td>B</td><td>283音</td><td>259音</td><td class="bad">9%</td></tr>
<tr><td>C</td><td>408音</td><td>398音</td><td class="bad">3%</td></tr>
</table></div>
<div class="finding">
<h4>これは定義から必然です</h4>
<p>①は<b>本人の平均との差</b>で測ります。平均から離れた項目ほど上位に来る設計なので、ほとんどの項目は平均の近くに固まり、差は小さくなります。<b>意外性は拾えますが、量は逃します。</b></p>
</div>

<h3>比較 ・ 失点の多い順ならどうか</h3>
<p>単純に失点した音数の多い順に並べると、こうなります。</p>
<div class="scroll"><table>
<tr><th>ユーザー</th><th>1位</th><th>全失点に占める割合</th><th>上位3の合計</th></tr>
<tr><td>A</td><td>8分音符のリズム 2920音</td><td class="good">28%</td><td class="good">47%</td></tr>
<tr><td>B</td><td>8分音符のリズム 327音</td><td class="good">44%</td><td class="good">59%</td></tr>
<tr><td>C</td><td>16分音符のリズム 343音</td><td class="good">21%</td><td class="good">40%</td></tr>
</table></div>
<p>上位3つで全失点の<b>40%から59%</b>を占めます。①の1%から9%と比べると、量としては桁が違います。</p>
<div class="finding">
<h4>ただし失点順にも欠点があります</h4>
<p>3人とも上位が<b>音価の話ばかり</b>です。8分音符・16分音符・4分音符。音の長さはすべての音符に付くので、全体が悪ければ必ず上位に来ます。「8分音符を直そう」は「全部うまく弾こう」とほぼ同義で、練習の当てどころになりません。</p>
</div>

<h2>6つの観点</h2>

<h3>1 ・ ユーザーにとっての意味</h3>
<p><b>「余分に外した音数」は子どもに伝わりません。</b>本人の平均という見えない基準からの差なので、36音という数字が何を意味するか説明できません。保護者にも「平均より36音多く外している」は文脈なしには読めません。</p>
<p>失点の多い順なら「8分音符で2920音落としている」と言えて、量としては伝わります。ただし前述のとおり当てどころになりません。</p>

<h3>2 ・ 他の指標との重複</h3>
<div class="scroll"><table>
<tr><th>既存の指標</th><th>答えていること</th><th>伸びしろとの関係</th></tr>
<tr><td>精度 ・ わざごとの%</td><td>いまどれくらいできるか</td><td>重複しない</td></tr>
<tr><td>成長カーブ</td><td>伸びているか</td><td>重複しない</td></tr>
<tr><td>指板ヒートマップ</td><td>どの音が苦手か</td><td class="bad">重複する ・ 場所を特定する点で同じ</td></tr>
<tr><td>おすすめ練習</td><td>次に何をやるか</td><td class="bad">重複する ・ 伸びしろはこの選び方そのもの</td></tr>
<tr><td>記録の分析の各項目</td><td>どの動きが苦手か</td><td class="bad">重複する</td></tr>
</table></div>
<p><b>伸びしろを独立した表示として出すと、3つの既存機能と重なります。</b>すでに「どこが苦手か」を答える画面が3つあり、4つ目を足す理由が要ります。</p>

<h3>3 ・ データの裏づけ</h3>
<p>上のとおり、安定性と効き目の両方で弱い結果でした。加えて母数の制約があります。</p>
<ul>
<li>解析データを持つ実ユーザーは<b>4人・録音58件</b></li>
<li>★2以上の録音は<b>1件のみ</b>。★3以上はゼロ</li>
<li>弾かれている曲は10種類で、ゆっくりな曲に偏っている</li>
</ul>
<p>この規模では、順位の入れ替わりが偶然なのか実態なのかを区別できません。<b>いま順位を前面に出すのは早いと判断します。</b></p>

<h3>4 ・ 提供価値との整合</h3>
<p>確定している提供価値は<b>カルテの示す成長を全体験に編み込む</b>ことです。伸びしろは成長ではなく<b>不足</b>を示す指標で、方向が逆を向きます。</p>
<p>使うとしても、ユーザーに順位として見せるのではなく、<b>おすすめ練習をどう選ぶかという裏側の判断</b>に留めるほうが方針と合います。この使い方は既に決めてあり、変える必要はありません。</p>

<h3>5 ・ 他社との比較</h3>
<p>26サービスの調査では、失点の原因分解は<b>業界が実際に解いている問題</b>でした。ゴルフのストロークゲインド、チェスのミス分類、PROGOSの6軸。ただし、そのどれもが<b>順位ではなく配分</b>を見せています。</p>
<ul>
<li><b>ストロークゲインド</b>は「ドライバーで+1.2打、パットで−0.8打」と<b>全部の内訳</b>を出す。1位だけを言わない</li>
<li><b>chess.com</b>はミスを種類で分類して<b>件数</b>を出す。優先順位はつけない</li>
<li><b>Modacity</b>は音を採点せず<b>検証済みの改善サイクルの蓄積</b>を上達と定義している</li>
</ul>
<p>順位を出しているサービスは調査範囲にありませんでした。<b>配分を見せて解釈は本人に委ねる</b>のが業界の作法です。</p>

<h3>6 ・ 作る負担と維持</h3>
<p>①は計算が軽く、実装は既にあります。負担は小さい。</p>
<p>問題は<b>外したときの損失</b>です。「ここを直すと効く」と言い切った項目が翌週に変わり、直しても点が動かなければ、カルテ全体の信頼が落ちます。安定性33%・効き目1%という数字は、その危険が現実にあることを示しています。</p>

<h2>結論</h2>
<div class="verdict">
<h4>伸びしろは機能として出さない。おすすめ練習の裏側に留める</h4>
<p><b>伸びしろ①は、いまの使い方のままがよい。</b>6項目それぞれの中で、どの課題を犯人にするかを選ぶ物差しです。項目の中は候補が数個しかないので、順位が入れ替わる危険も小さく、選んだ結果は教材1つとして出るだけです。ユーザーは順位を見ません。</p>
<p><b>全項目を横断する伸びしろランキングは作らない。</b>データが持ちません。安定性33%、効き目1%から9%。加えて指板・記録の分析・おすすめ練習と役割が重なります。</p>
<p><b>伸びしろ②は保留のままでよい。</b>前提となるElo方式のレーティングが未着手で、★2以上の録音が1件しかない現状では較正もできません。ただし<b>失点を配分して見せる</b>という考え方自体は業界の作法と一致しており、将来データが貯まったときの本命です。</p>
</div>

<div class="card">
<h4>もし将来やるなら</h4>
<p>順位ではなく<b>配分</b>で出すことを勧めます。「1位はこれ」ではなく「失点100のうち、音の長さに47・弦の移動に18・ポジションに12」という内訳です。順位は入れ替わりますが、配分は安定します。実データでも上位3つで40%から59%という安定した塊が見えています。</p>
<p>そのとき音価の偏りをどう扱うかが要点になります。8分音符が常に上位に来るのは、音価がすべての音符に付くためです。<b>ストロークゲインドが「ドライバー」と「パット」を並べるように、重ならない分類に組み替える</b>必要があります。いまの6項目はその方向で作ってあるので、素材は揃っています。</p>
</div>
</div>
"""
out = os.path.join(SP, "upside-review.html")
io.open(out, "w", encoding="utf-8").write(html)
print(out, round(len(html) / 1024, 1), "KB")
