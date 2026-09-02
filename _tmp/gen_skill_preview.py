# -*- coding: utf-8 -*-
import base64, io, os
SP = os.environ.get("SP")

def b64(path):
    return "data:image/png;base64," + base64.b64encode(open(path, "rb").read()).decode()

IMGS = {f"p{i}": b64(f"_tmp/p{i}.png") for i in range(1, 5)}

html = """<title>わざ 実装プレビュー</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700;900&display=swap">
<style>
:root{ --ink:#0a1526; --panel:#12203a; --line:#24365c; --text:#eaf0fb; --sub:#9db0d0; --dim:#6e83a8;
  --blue2:#3f74e0; --gold:#d9a93c; --warm:#e08e64; }
*{box-sizing:border-box}
body{margin:0;background:var(--ink);color:var(--text);
  font-family:"Zen Kaku Gothic New","Hiragino Kaku Gothic ProN",system-ui,sans-serif;
  font-size:15px;line-height:1.7;-webkit-font-smoothing:antialiased}
.wrap{max-width:1160px;margin:0 auto;padding:34px 20px 80px}
h1{font-size:27px;font-weight:900;margin:0 0 6px;letter-spacing:.02em}
.lead{color:var(--sub);margin:0 0 28px;max-width:68ch}
h2{font-size:13.5px;font-weight:700;color:var(--dim);letter-spacing:.15em;
  margin:44px 0 14px;padding-bottom:8px;border-bottom:1px solid var(--line)}
.case{margin:0 0 34px;background:var(--panel);border:1px solid var(--line);
  border-radius:20px;overflow:hidden;box-shadow:0 16px 40px rgba(0,0,0,.4)}
.head{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;
  padding:15px 20px;border-bottom:1px solid var(--line);background:rgba(43,91,196,.08)}
.num{font-size:12px;font-weight:900;letter-spacing:.16em;color:var(--blue2)}
.head h3{font-size:19px;font-weight:900;margin:0}
.head .tag{margin-left:auto;font-size:12px;color:var(--dim);font-variant-numeric:tabular-nums}
.body{display:grid;grid-template-columns:minmax(280px,400px) 1fr;gap:26px;padding:20px}
@media(max-width:800px){.body{grid-template-columns:1fr}}
.shot{border:1px solid var(--line);border-radius:14px;overflow:hidden;background:#0b1526}
.shot img{display:block;width:100%;height:auto}
dl{margin:0}
dt{font-weight:700;font-size:13.5px;margin-top:14px}
dt:first-child{margin-top:0}
dd{margin:3px 0 0;color:var(--sub);font-size:13.5px}
table{width:100%;border-collapse:collapse;font-size:13px}
th,td{text-align:left;padding:9px 10px;border-bottom:1px solid var(--line);vertical-align:top}
th{color:var(--dim);font-weight:700;font-size:12px;letter-spacing:.06em}
td b{color:var(--gold)}
.note{color:var(--sub);font-size:13.5px;margin:12px 0 0;max-width:76ch}
.scroll{overflow-x:auto}
.warn{margin-top:16px;padding:18px 20px;border-radius:16px;
  background:linear-gradient(135deg,rgba(224,142,100,.13),rgba(224,142,100,.03));
  border:1px solid rgba(224,142,100,.36)}
.warn h3{margin:0 0 8px;font-size:16px;font-weight:900;color:var(--warm)}
.warn p{margin:0 0 8px;color:var(--sub);font-size:14px}
.warn p:last-child{margin-bottom:0}
.warn b{color:var(--text)}
code{background:rgba(150,175,225,.12);border-radius:4px;padding:1px 5px;font-size:12.5px}
</style>

<div class="wrap">
<h1>わざ 実装プレビュー</h1>
<p class="lead">描き直したモックではありません。<b>本番と同じコンポーネント</b>に、本番と同じ形の値を流して撮ったものです。課題曲の並びは2026-09-02に投入した実データと同じ。わざの詳細は先生あり特典のため通常アカウントでは開けず、確認用の一時ルートで描画しています。</p>

<h2>画面</h2>

<div class="case">
  <div class="head"><span class="num">1</span><h3>技術マップ</h3><span class="tag">/progress/skills ・ 全ユーザー</span></div>
  <div class="body">
    <div class="shot"><img src="__P1__" alt="技術マップ"></div>
    <dl>
      <dt>4つのタブで15のわざを分ける</dt>
      <dd>弓8 ・ フィンガリング2 ・ 装飾3 ・ 音色と特殊2</dd>
      <dt>カードの数字 = そのわざの精度</dt>
      <dd>そのわざに紐づく個別課題の成功率。判定が8個たまってから出る</dd>
      <dt>★のセル行 = わざマスターの進み</dt>
      <dd>金=マスター済み ・ 青=挑戦中 ・ 破線=まだ。右に「★1 マスター」と現在のランク</dd>
      <dt>状態は5つ</dt>
      <dd>安定 / ゆらぎ中 ・ 練習しどき / 習得ずみ ・ データ集め中 / つぎに挑戦できる / ★N で出会う</dd>
    </dl>
  </div>
</div>

<div class="case">
  <div class="head"><span class="num">2</span><h3>わざ詳細 ・ 記録も指導もある</h3><span class="tag">/progress/skill/slur ・ 先生あり特典</span></div>
  <div class="body">
    <div class="shot"><img src="__P2__" alt="わざ詳細 スラー"></div>
    <dl>
      <dt>いまの状態</dt>
      <dd>精度と、何音から出したかの注記</dd>
      <dt>わざマスターの記録 <b>= 案4 検定の記録表</b></dt>
      <dd>★ごとに課題曲を並べ、合格日 ・ 挑戦中の平均点 ・ まだ を出す。下に「★2の課題曲を弾く」</dd>
      <dt>安定度の推移と、指導の効果</dt>
      <dd>録音ごとの点を線でつなぎ、先生の所見とレッスンクリアを縦線で注釈。効果を1行で要約</dd>
      <dt>先生が気づいた癖</dt>
      <dd>所見の履歴。日付とタグとコメント</dd>
      <dt>聴き比べ</dt>
      <dd>はじめの頃といまの録音を並べる。音源が無いときは文言だけ</dd>
      <dt>おすすめ練習</dt>
      <dd>弱点推薦エンジンから、このわざに効く教材を出す</dd>
    </dl>
  </div>
</div>

<div class="case">
  <div class="head"><span class="num">3</span><h3>わざ詳細 ・ 記録が少ない</h3><span class="tag">録音2回 ・ 指導なし</span></div>
  <div class="body">
    <div class="shot"><img src="__P3__" alt="わざ詳細 スタッカート"></div>
    <dl>
      <dt>記録表は課題曲があれば出る</dt>
      <dd>まだ1つもマスターしていないので右上のランク章は出ない。★2が挑戦中で、平均点が無いときは「この曲をマスターすると★2」とだけ出る</dd>
      <dt>推移は2点でも線になる</dt>
      <dd>注釈が無いので縦線は出ない</dd>
      <dt>先生の癖と聴き比べは章ごと消える</dt>
      <dd>データが無い章は見出しごと出さない。空の箱を見せない</dd>
    </dl>
  </div>
</div>

<div class="case">
  <div class="head"><span class="num">4</span><h3>わざ詳細 ・ まだ出会っていない</h3><span class="tag">課題曲なし ・ 記録なし</span></div>
  <div class="body">
    <div class="shot"><img src="__P4__" alt="わざ詳細 トレモロ"></div>
    <dl>
      <dt>記録表は出ない</dt>
      <dd>課題曲が0件のわざは、記録表の章ごと出さない。いまトレモロを含む公開曲が1曲も無いため</dd>
      <dt>精度も出ない</dt>
      <dd>判定音が足りないので数字は伏せる</dd>
      <dt>残るのは教材への導線だけ</dt>
      <dd>「トレモロの教材いちらんを見る」</dd>
    </dl>
  </div>
</div>

<h2>課題曲がいま入っているわざ</h2>
<div class="scroll"><table>
<tr><th>わざ</th><th>★1</th><th>★2</th><th>★3</th><th>選び方</th></tr>
<tr><td><b>スラー</b></td><td>ワルツ No.15</td><td>ポルカ</td><td>楽しい農夫</td><td>スラーの音の出現率 96 / 86 / 91%</td></tr>
<tr><td><b>スタッカート</b></td><td>—</td><td>メヌエット</td><td>ガボット「ミニヨンより」</td><td>出現率 42 / 64%</td></tr>
<tr><td><b>ポルタート</b></td><td>ワルツ No.15</td><td>ファニタ</td><td>—</td><td>技術タグのみ</td></tr>
<tr><td><b>ピチカート</b></td><td>—</td><td>アマリリス</td><td>—</td><td>技術タグのみ</td></tr>
<tr><td><b>スピッカート</b></td><td>—</td><td>—</td><td>ガボット「ミニヨンより」</td><td>技術タグのみ</td></tr>
<tr><td><b>トリル</b></td><td>—</td><td>—</td><td>ガボット</td><td>技術タグのみ</td></tr>
</table></div>
<p class="note">候補はその★の公開曲のうち対象わざの技術タグが付いたもの。そこから譜面解析の出現率で1曲に絞ります。出現率が0%と出るものは、譜面に記号が無く技術タグだけで候補になった曲です。スクリプトで何度でも選び直せます。</p>

<div class="warn">
<h3>65組は課題曲なし</h3>
<p>トレモロ ・ リコシェ ・ ポジション移動 ・ 重音 ・ モルデント ・ ビブラート ・ グリッサンド ・ ハーモニクスは、そのわざのタグが付いた公開曲が<b>1曲もありません</b>。★4と★5もほぼ空です。該当するわざの詳細は、画面4の状態のままになります。</p>
<p>曲を足せばスクリプトの再実行で自動的に埋まります。埋まらない限り、そのわざはマスターできません。</p>
</div>

<h2>ことばについて</h2>
<p class="note">画面には「安定度」という語が残っています。記録では<b>中身と嘘があるため「精度」に改名予定</b>としてありました。実体はそのわざに紐づく個別課題の成功率で、安定しているかどうかを測ってはいません。この機会に置き換えるかどうか、決めてください。</p>
</div>
"""
for k, v in IMGS.items():
    html = html.replace("__" + k.upper() + "__", v)
out = os.path.join(SP, "skill-preview.html")
io.open(out, "w", encoding="utf-8").write(html)
print(out, round(len(html) / 1024 / 1024, 2), "MB")
