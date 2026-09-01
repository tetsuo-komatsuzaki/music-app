# 2026-08-31 Tetsuo採用 D01-D18 を No.129-146 で追加 → 全100件
import io

p = "app/_libs/treasureCatalog.ts"
s = io.open(p, encoding="utf-8").read()

old_m = '  | "action"            // UserActionCount の action 累計 (payload.action)'
new_m = '''  | "week7"             // 週7日練習した週がある (閾値1)
  | "practice_streak"   // 基礎練だけの連続日数
  | "day_songs_max"     // 1日で弾いた曲数の最大
  | "practice_categories" // 基礎練で弾いたカテゴリ種類数 (scale/arpeggio/etude/fingering...)
  | "etude_distinct"    // 弾いたことのあるエチュード教材の数
  | "titles_count"      // 称号カードの枚数 (=ランクアップ回数)
  | "nintei_count"      // 認定証の枚数 (kind cert + sourceType quest)
  | "cards_all"         // カード全制覇 (閾値は動的=カード格クエスト数-1・自分の分を除く)
  | "action"            // UserActionCount の action 累計 (payload.action)'''
assert old_m in s
s = s.replace(old_m, new_m)

# morning_rec はD02採用で回数制に (日数カウント・閾値1の118はそのまま成立)
s = s.replace('  | "morning_rec"       // 朝5-9時の録音がある (閾値1)',
              '  | "morning_rec"       // 朝5-9時に録音した日数 (118=1日 / 130=5日)')

Q = []

def q(no, qid, title, sub, cat, metric, threshold, action=None):
    c = f'counter: {{ metric: "{metric}", threshold: {threshold}' + (f', action: "{action}"' if action else "") + " }"
    Q.append(f'  {{ no: {no}, questId: "{qid}", title: "{title}", sub: "{sub}", category: "{cat}", type: "counter", {c} }},')

Q.append("  // ── 追加18件 (2026-08-31 Tetsuo採用D案・全てカウンター型) → 計100件 ──")
K = "続ける力"
q(129, "week7", "週7日練習する", "パーフェクトな1週間", K, "week7", 1)
q(130, "morning_5", "朝練を5回", "朝型の音楽家", K, "morning_rec", 5)
q(131, "practice_streak7", "基礎練を7日つづける", "土台を毎日", K, "practice_streak", 7)
T = "つみかさねの道"
q(132, "day_songs3", "1日で3曲弾く", "気分はコンサート", T, "day_songs_max", 3)
q(133, "practice_cat4", "基礎練を4種類", "メニューの使い分け", T, "practice_categories", 4)
q(134, "etude_kinds3", "エチュードを3種類", "いろんな磨き方", T, "etude_distinct", 3)
q(135, "scale_50", "音階を50回", "基本をきわめる", T, "scale_runs", 50)
q(136, "lessons_20", "学びのレッスン20", "わざはかせ", T, "lessons_cleared", 20)
C = "曲の道"
q(137, "songs90_5", "90点を5曲で", "どの曲もハイレベル", C, "songs_90", 5)
q(138, "master_30", "マスター30曲", "生きる伝説", C, "mastered_songs", 30)
q(139, "best_20", "自己ベストを20回更新", "成長がとまらない", "じぶんの音をみがく", "best_updates", 20)
q(140, "days_365", "のべ365日", "1年ぶんの練習日", K, "total_days", 365)
A = "たからものあつめ"
q(141, "titles_3", "ランクアップを3回", "のぼり続ける人", A, "titles_count", 3)
q(142, "nintei_1", "はじめての認定証", "最難関のあかし", A, "nintei_count", 1)
q(143, "medals_5", "メダルを5個全部", "節目の完全制覇", A, "medals_count", 5)
q(144, "treasures_100", "宝物100個", "あふれるギャラリー", A, "treasures_count", 100)
q(145, "cards_all", "カードを全部あつめる", "カードコンプリート", A, "cards_all", 0)
q(146, "share_10", "シェア10回", "応援団がついてる", "シェアする", "action", 10, action="share")

anchor = '  { no: 128, questId: "anniversary", title: "アルコ記念日", sub: "はじめての録音から1年", category: "たからものあつめ", type: "counter", counter: { metric: "anniversary_1y", threshold: 1 } },\n]'
assert anchor in s
s = s.replace(anchor, anchor[:-2] + "\n" + "\n".join(Q) + "\n]")
io.open(p, "w", encoding="utf-8").write(s)
print("added", len(Q) - 1)
