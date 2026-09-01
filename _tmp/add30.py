# 2026-08-31 Tetsuo採用30件 (C01-C06/C11-C26/C30/C37/C45-C50) を No.099-128 で追加
import io

p = "app/_libs/treasureCatalog.ts"
s = io.open(p, encoding="utf-8").read()

# CounterMetric に新メトリクス13種を追加
old_m = '  | "action"            // UserActionCount の action 累計 (payload.action)'
new_m = '''  | "songs_90"          // ベスト90点以上の曲数
  | "songs_95"          // ベスト95点以上の曲数
  | "first_take_90"     // どれかの曲で最初の録音が90点以上 (閾値1)
  | "song_rec_max"      // 1曲あたりの録音回数の最大
  | "day_rec5"          // 1日で5回以上録音した日がある (閾値1)
  | "day_both"          // 同じ日に曲と基礎練の両方 (閾値1)
  | "weekend_both"      // 土日どちらも練習した週がある (閾値1)
  | "morning_rec"       // 朝5-9時の録音がある (閾値1)
  | "comeback"          // 7日以上あけてから練習を再開した (閾値1)
  | "anniversary_1y"    // はじめての録音から365日 (閾値1)
  | "cards_count"       // カード宝物の枚数
  | "medals_count"      // メダル宝物の個数
  | "treasures_count"   // 宝物の総数 (全kind)
  | "action"            // UserActionCount の action 累計 (payload.action)'''
assert old_m in s
s = s.replace(old_m, new_m)

Q = []

def q(no, qid, title, sub, cat, metric, threshold, action=None):
    c = f'counter: {{ metric: "{metric}", threshold: {threshold}' + (f', action: "{action}"' if action else "") + " }"
    Q.append(f'  {{ no: {no}, questId: "{qid}", title: "{title}", sub: "{sub}", category: "{cat}", type: "counter", {c} }},')

Q.append("  // ── 追加30件 (2026-08-31 Tetsuo採用 C01-C06/C11-C26/C30/C37/C45-C50・全てカウンター型) ──")
C = "曲の道"
q(99, "master_20", "マスター20曲", "殿堂のさらに先", C, "mastered_songs", 20)
q(100, "songs90_3", "90点を3曲で", "上手が当たり前に", C, "songs_90", 3)
q(101, "songs95_3", "95点を3曲で", "完成度の職人", C, "songs_95", 3)
q(102, "score_100", "100点達成", "満点の演奏", C, "score_total", 100)
q(103, "first_take_90", "一発で90点", "最初の録音でいきなり", C, "first_take_90", 1)
q(104, "song_rec_10", "同じ曲を10回録音", "1曲をとことん", C, "song_rec_max", 10)
T = "つみかさねの道"
q(105, "rec_1000", "録音1000回", "伝説の練習量", T, "recordings", 1000)
q(106, "basics_250", "基礎練250回", "鋼の土台", T, "practice_runs", 250)
q(107, "lessons_15", "学びのレッスン15", "わざの図鑑ができていく", T, "lessons_cleared", 15)
q(108, "scale_10", "音階を10回", "音づくりの習慣", T, "scale_runs", 10)
q(109, "arpeggio_10", "アルペジオを10回", "和音の足腰", T, "arpeggio_runs", 10)
q(110, "etude_10", "エチュードを10回", "磨きの積み重ね", T, "etude_runs", 10)
q(111, "day_rec5", "1日に5回録音", "集中練習の日", T, "day_rec5", 1)
q(112, "day_both", "1日で曲も基礎練も", "バランスのよい練習", T, "day_both", 1)
K = "続ける力"
q(113, "streak_200", "200日つづける", "道はまだつづく", K, "streak", 200)
q(114, "streak_365", "365日つづける", "1年の道", K, "streak", 365)
q(115, "days_30", "のべ30日", "ひと月ぶんの練習日", K, "total_days", 30)
q(116, "days_200", "のべ200日", "積もる日々", K, "total_days", 200)
q(117, "weekend_both", "土日どちらも練習", "週末の音楽家", K, "weekend_both", 1)
q(118, "morning_rec", "朝の練習をする", "1日が音で始まる", K, "morning_rec", 1)
q(119, "comeback", "おかえり練習", "休んでも戻ってこられた", K, "comeback", 1)
q(120, "week5_8", "週5日を8週連続", "2ヶ月の充実", K, "week5_streak", 8)
q(121, "position_song", "ポジション移動の曲", "左手の旅", "いろんな曲の旅", "song_position", 1)
q(122, "best_10", "自己ベストを10回更新", "こえ続ける人", "じぶんの音をみがく", "best_updates", 10)
A = "たからものあつめ"
q(123, "cards_10", "カード10枚", "集まり始めた思い出", A, "cards_count", 10)
q(124, "cards_30", "カード30枚", "りっぱなコレクション", A, "cards_count", 30)
q(125, "medals_3", "メダルを3個", "節目をかさねて", A, "medals_count", 3)
q(126, "treasures_50", "宝物50個", "ギャラリーがにぎやかに", A, "treasures_count", 50)
q(127, "share_5", "シェア5回", "応援がふえていく", "シェアする", "action", 5, action="share")
q(128, "anniversary", "アルコ記念日", "はじめての録音から1年", A, "anniversary_1y", 1)

anchor = '  { no: 89, questId: "cert_1", title: "はじめての証明書", sub: "マスターの証", category: "たからものあつめ", type: "counter", counter: { metric: "mastered_songs", threshold: 1 } },\n]'
assert anchor in s
s = s.replace(anchor, anchor[:-2] + "\n" + "\n".join(Q) + "\n]")
io.open(p, "w", encoding="utf-8").write(s)
print("added", len(Q) - 1, "quests")
