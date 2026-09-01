# 2026-08-31 Tetsuo再編: QUESTSを52件構成に書き換える
import io

p = "app/_libs/treasureCatalog.ts"
s = io.open(p, encoding="utf-8").read()
start = s.index("export const QUESTS: QuestDef[] = [")
end = s.index("\n]", start) + 2

Q = []

def q(no, qid, title, sub, cat, typ, home=False, hook=None, grade=None, metric=None, threshold=None):
    parts = [f"no: {no}", f'questId: "{qid}"', f'title: "{title}"', f'sub: "{sub}"', f'category: "{cat}"', f'type: "{typ}"']
    if grade:
        parts.append(f'grade: "{grade}"')
    if home:
        parts.append("home: true")
    if hook:
        parts.append(f'hook: "{hook}"')
    if metric is not None:
        parts.append(f'counter: {{ metric: "{metric}", threshold: {threshold} }}')
    Q.append("  { " + ", ".join(parts) + " },")

H = "はじまりの旅"
Q.append("  // ── はじまりの旅 (2026-08-31 Tetsuo再編: トップ表示はこのカテゴリのみ。カウンター型も含む) ──")
q(1, "first_loop", "はじめての1周", "成長サイクルを回した", H, "event", True, "completeGuide (guideState.ts)")
q(2, "annotate", "譜面に書き込みしてみる", "気をつける場所に印を", H, "event", True, "譜面注釈の保存action")
q(3, "lesson_first", "学びのレッスンを1つ実施", "新しい技術のコツ", H, "event", True, "recordLessonPlay (クリア成立時)")
q(4, "karte_view", "カルテで成長を見る", "2周ぶん貯まったら", H, "event", True, "recordQuestEvent (progressページ表示)")
q(5, "guide_modal", "上達のしくみを見る", "成長の地図を知る", H, "event", True, "recordQuestEvent (ProgressGuideModal表示)")
q(6, "part_variant", "パート別に録音採点する", "むずかしい所だけ", H, "event", True, "演奏アップロード処理 (パート変種)")
q(7, "listen_back", "自分の演奏を聴き返す", "自分の音を客観的に", H, "event", True, "recordQuestEvent (録音の再生)")
q(12, "tempo_change", "テンポをかえて弾く", "ゆっくりから確実に", H, "event", True, "recordQuestEvent (テンポ変更録音)")
q(17, "skill_map", "技術マップを見る", "わざの点灯を確かめる", H, "event", True, "recordQuestEvent (技術マップ表示)")
q(19, "favorite", "お気に入りに登録", "よく使うものを手元に", H, "event", True, "お気に入り登録action")
q(20, "next_song", "つぎの曲に挑戦", "レパートリーを広げる", H, "event", True, "recordQuestEvent (おすすめ経由の録音)")
q(95, "practice_key2", "ちがう調で基礎練", "調がかわると景色もかわる", H, "counter", True, metric="practice_keys", threshold=2)
q(96, "practice_art2", "奏法をかえて基礎練", "スタッカートやスラーで", H, "counter", True, metric="practice_articulations", threshold=2)
q(92, "etude_first", "エチュードをやってみる", "わざを磨く1冊を開く", H, "counter", True, metric="etude_runs", threshold=1)
q(93, "scale_first", "音階をやってみる", "音づくりの基本の1回", H, "counter", True, metric="scale_runs", threshold=1)
q(94, "arpeggio_first", "アルペジオをやってみる", "和音の指づかいに触れる", H, "counter", True, metric="arpeggio_runs", threshold=1)
q(76, "share_card", "カードをシェアする", "がんばりを見せよう", H, "event", True, "シェアカード作成action")
q(84, "gallery_open", "ギャラリーを開く", "宝物の家へ", H, "event", True, "recordQuestEvent (ギャラリー表示)")

Q.append("  // ── 曲の道 ──")
C = "曲の道"
q(22, "achieve_1", "はじめての達成", "1曲を弾けるように", C, "counter", metric="achieved_songs", threshold=1)
q(27, "master_1", "はじめてのマスター", "完全にきみのもの", C, "counter", metric="mastered_songs", threshold=1)
q(28, "master_3", "マスターの風格", "3曲のマスター", C, "counter", metric="mastered_songs", threshold=3)
q(29, "master_5", "マスターの誇り", "5曲のマスター", C, "counter", metric="mastered_songs", threshold=5)
q(30, "master_10", "マスターの殿堂", "10曲のマスター", C, "counter", grade="cert", metric="mastered_songs", threshold=10)
q(31, "score_90", "90点の壁をこえる", "とても上手な演奏", C, "counter", metric="score_total", threshold=90)
q(32, "score_95", "95点の高み", "ほぼ完璧な演奏", C, "counter", metric="score_total", threshold=95)

Q.append("  // ── つみかさねの道 ──")
T = "つみかさねの道"
q(36, "rec_50", "録音50回", "立派な練習量", T, "counter", metric="recordings", threshold=50)
q(37, "rec_100", "録音100回", "100回の挑戦", T, "counter", metric="recordings", threshold=100)
q(38, "rec_250", "録音250回", "音がきたえられていく", T, "counter", metric="recordings", threshold=250)
q(39, "rec_500", "録音500回", "つみかさねの頂", T, "counter", grade="cert", metric="recordings", threshold=500)
q(41, "basics_50", "基礎練50回", "強い土台", T, "counter", metric="practice_runs", threshold=50)
q(42, "basics_100", "基礎練100回", "ゆるがない土台", T, "counter", metric="practice_runs", threshold=100)
q(43, "lessons_5", "学びのレッスン5つ", "わざが増えていく", T, "counter", metric="lessons_cleared", threshold=5)
q(44, "lessons_10", "学びのレッスン10", "多彩なわざ", T, "counter", metric="lessons_cleared", threshold=10)
q(45, "lessons_all", "レッスン全制覇", "すべてのわざを学んだ", T, "counter", grade="cert", metric="lessons_all", threshold=0)

Q.append("  // ── 続ける力 ──")
K = "続ける力"
q(46, "streak_3", "3日つづける", "続ける力の芽", K, "counter", metric="streak", threshold=3)
q(47, "streak_7", "7日つづける", "毎日15分の力", K, "counter", metric="streak", threshold=7)
q(48, "streak_14", "14日つづける", "2週間の継続", K, "counter", metric="streak", threshold=14)
q(49, "streak_30", "30日つづける", "習慣がいちばんの才能", K, "counter", metric="streak", threshold=30)
q(50, "streak_50", "50日つづける", "もう止まらない", K, "counter", metric="streak", threshold=50)
q(51, "streak_100", "100日つづける", "百日の道", K, "counter", grade="cert", metric="streak", threshold=100)
q(52, "week5_1", "1週間で5日練習する", "充実の1週間", K, "counter", metric="week5", threshold=1)
q(53, "week5_4", "週5日を4週連続", "1ヶ月の充実", K, "counter", metric="week5_streak", threshold=4)

Q.append("  // ── じぶんの音をみがく ──")
J = "じぶんの音をみがく"
q(66, "best_1", "自己ベスト更新", "前の自分をこえた", J, "counter", metric="best_updates", threshold=1)
q(67, "best_5", "自己ベストを5回更新", "こえ続ける力", J, "counter", metric="best_updates", threshold=5)
q(68, "pitch_90", "音程90点を達成", "正確な左手", J, "counter", metric="score_pitch", threshold=90)
q(69, "timing_90", "リズム90点を達成", "正確な拍", J, "counter", metric="score_timing", threshold=90)
q(70, "pitch_95", "音程95点を達成", "研ぎすまされた音程", J, "counter", metric="score_pitch", threshold=95)
q(71, "timing_95", "リズム95点を達成", "きざむ拍が美しい", J, "counter", metric="score_timing", threshold=95)

Q.append("  // ── シェアする (フェーズ3で配線) ──")
S = "シェアする"
q(83, "share_cert", "証明書をシェア", "誇りを届ける", S, "event", hook="証明書シェアaction (フェーズ3)")
q(97, "share_nintei", "認定証をシェアする", "挑戦のあかしを見せよう", S, "event", hook="認定証シェアaction (フェーズ3)")
q(98, "share_medal", "メダルをシェアする", "節目のよろこびを一緒に", S, "event", hook="メダルシェアaction (フェーズ3)")

Q.append("  // ── たからものあつめ ──")
q(89, "cert_1", "はじめての証明書", "マスターの証", "たからものあつめ", "counter", metric="mastered_songs", threshold=1)

new = "export const QUESTS: QuestDef[] = [\n" + "\n".join(Q) + "\n]\n"
s = s[:start] + new + s[end:]

# NINTEI_FACES: 認定証対象が4件に (059/090 削除)
drop = """  songs_20: {
    big: "20 SONGS",
    kindLine: "旅の認定証",
    body1: "20曲の物語を 奏でたことを ここに認定します",
    body2: "あなたの音楽の世界は 大きく広がりました",
  },
  cert_3: {
    big: "3 CERTIFICATES",
    kindLine: "誇りの認定証",
    body1: "マスター証明書を3枚 あつめたことを ここに認定します",
    body2: "誇りの棚は これからも増えていきます",
  },
"""
assert drop in s
s = s.replace(drop, "")
io.open(p, "w", encoding="utf-8").write(s)
print("catalog rewritten:", len(Q), "lines incl comments")
