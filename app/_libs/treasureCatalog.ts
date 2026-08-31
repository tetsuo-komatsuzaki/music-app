// ============================================================
// 報酬体系「ギャラリー」カタログ (骨組み・2026-08-30 実装仕様v1.3)
//
// クエスト定義の正本。中身 (文言・件数・絵柄) は草案v3ベースで【Tetsuo最終確定前】。
// 構造 (番号・型・カテゴリ・判定メトリクス) の検証が骨組みフェーズの目的。
// 規約: 番号の再利用禁止 / 欠番はコメントで残す / 文言lintは catalog.test.ts。
// 授与の格: 通常=カード / 最難関16件=認定証 (grade:"cert") / メダルはカード枚数の節目
// (クエストではなく MEDAL_MILESTONES)。
// ============================================================

export type QuestType = "event" | "counter"

/** カウンター型の判定メトリクス。実装は questEvaluator.ts (追加時は両方同期) */
export type CounterMetric =
  | "recordings"        // 通し録音の累計 (区間録音は含めない・2026-08-30確定)
  | "practice_runs"     // 基礎練 (PracticePerformance) の累計
  | "lessons_cleared"   // 学びレッスンのクリア数
  | "lessons_all"       // 学びレッスン全クリア (閾値は動的=公開レッスン数)
  | "etudes_achieved"   // エチュード達成数
  | "achieved_songs"    // 曲の達成数 (=コイン枚数)
  | "mastered_songs"    // マスター数 (=証明書枚数)
  | "score_total"       // 演奏スコア(音程+リズム)/2 がN点以上を1回
  | "score_pitch"       // 音程スコアN点以上
  | "score_timing"      // リズムスコアN点以上
  | "best_updates"      // 自己ベスト更新の累計
  | "distinct_songs"    // 録音した曲数
  | "annotations"       // 譜面注釈の累計
  | "song_minor"        // 短調の曲を録音 (閾値1)
  | "song_fast"         // テンポ120以上の曲を録音 (閾値1)
  | "song_doublestop"   // 重音タグの曲を録音 (閾値1)
  | "song_position"     // 2ndポジ以上の曲を録音 (閾値1)
  | "song_star2"        // ☆2の曲を録音 (閾値1)
  | "streak"            // 連続練習日数 (365日窓)
  | "week5"             // 週5日練習をN回 (週単位)
  | "week5_streak"      // 週5日を連続N週
  | "month20"           // ひと月で20日練習 (閾値1)
  | "total_days"        // 練習した日の累計
  | "etude_runs"        // エチュード教材の録音回数 (達成でなく実施)
  | "scale_runs"        // 音階教材の録音回数
  | "arpeggio_runs"     // アルペジオ教材の録音回数
  | "practice_keys"     // 基礎練で弾いた調の種類数 (閾値2=2つ目の調)
  | "practice_articulations" // 基礎練で弾いた奏法の種類数 (未指定=基本を1種と数える・閾値2)
  | "songs_90"          // ベスト90点以上の曲数
  | "songs_95"          // ベスト95点以上の曲数
  | "first_take_90"     // どれかの曲で最初の録音が90点以上 (閾値1)
  | "song_rec_max"      // 1曲あたりの録音回数の最大
  | "day_rec5"          // 1日で5回以上録音した日がある (閾値1)
  | "day_both"          // 同じ日に曲と基礎練の両方 (閾値1)
  | "weekend_both"      // 土日どちらも練習した週がある (閾値1)
  | "morning_rec"       // 朝5-9時に録音した日数 (118=1日 / 130=5日)
  | "comeback"          // 7日以上あけてから練習を再開した (閾値1)
  | "anniversary_1y"    // はじめての録音から365日 (閾値1)
  | "cards_count"       // カード宝物の枚数
  | "medals_count"      // メダル宝物の個数
  | "treasures_count"   // 宝物の総数 (全kind)
  | "week7"             // 週7日練習した週がある (閾値1)
  | "practice_streak"   // 基礎練だけの連続日数
  | "day_songs_max"     // 1日で弾いた曲数の最大
  | "practice_categories" // 基礎練で弾いたカテゴリ種類数 (scale/arpeggio/etude/fingering...)
  | "etude_distinct"    // 弾いたことのあるエチュード教材の数
  | "titles_count"      // 称号カードの枚数 (=ランクアップ回数)
  | "nintei_count"      // 認定証の枚数 (kind cert + sourceType quest)
  | "cards_all"         // カード全制覇 (閾値は動的=カード格クエスト数-1・自分の分を除く)
  | "action"            // UserActionCount の action 累計 (payload.action)

export type QuestDef = {
  /** カタログ固定番号 (全体通し・再利用禁止) */
  no: number
  questId: string
  title: string
  sub: string
  category: string
  type: QuestType
  /** 授与の格。省略=カード。cert=アルコの認定証 (最難関16件) */
  grade?: "cert"
  /** ホームのボードに出す操作系か */
  home?: true
  /** event型: 発火フックの実装箇所 (検収表の正) */
  hook?: string
  /** counter型: メトリクスと閾値 */
  counter?: { metric: CounterMetric; threshold: number; action?: string }
}

export const QUESTS: QuestDef[] = [
  // ── はじまりの旅 (2026-08-31 Tetsuo再編: トップ表示はこのカテゴリのみ。カウンター型も含む) ──
  { no: 1, questId: "first_loop", title: "はじめての1周", sub: "成長サイクルを回した", category: "はじまりの旅", type: "event", home: true, hook: "completeGuide (guideState.ts)" },
  { no: 2, questId: "annotate", title: "譜面に書き込みしてみる", sub: "気をつける場所に印を", category: "はじまりの旅", type: "event", home: true, hook: "譜面注釈の保存action" },
  { no: 3, questId: "lesson_first", title: "学びのレッスンを1つ実施", sub: "新しい技術のコツ", category: "はじまりの旅", type: "event", home: true, hook: "recordLessonPlay (クリア成立時)" },
  { no: 4, questId: "karte_view", title: "カルテで成長を見る", sub: "2周ぶん貯まったら", category: "はじまりの旅", type: "event", home: true, hook: "recordQuestEvent (progressページ表示)" },
  { no: 5, questId: "guide_modal", title: "上達のしくみを見る", sub: "成長の地図を知る", category: "はじまりの旅", type: "event", home: true, hook: "recordQuestEvent (ProgressGuideModal表示)" },
  { no: 6, questId: "part_variant", title: "パート別に録音採点する", sub: "むずかしい所だけ", category: "はじまりの旅", type: "event", home: true, hook: "演奏アップロード処理 (パート変種)" },
  { no: 7, questId: "listen_back", title: "自分の演奏を聴き返す", sub: "自分の音を客観的に", category: "はじまりの旅", type: "event", home: true, hook: "recordQuestEvent (録音の再生)" },
  { no: 12, questId: "tempo_change", title: "テンポをかえて弾く", sub: "ゆっくりから確実に", category: "はじまりの旅", type: "event", home: true, hook: "recordQuestEvent (テンポ変更録音)" },
  { no: 17, questId: "skill_map", title: "技術マップを見る", sub: "わざの点灯を確かめる", category: "はじまりの旅", type: "event", home: true, hook: "recordQuestEvent (技術マップ表示)" },
  { no: 19, questId: "favorite", title: "お気に入りに登録", sub: "よく使うものを手元に", category: "はじまりの旅", type: "event", home: true, hook: "お気に入り登録action" },
  { no: 20, questId: "next_song", title: "つぎの曲に挑戦", sub: "レパートリーを広げる", category: "はじまりの旅", type: "event", home: true, hook: "recordQuestEvent (おすすめ経由の録音)" },
  { no: 95, questId: "practice_key2", title: "ちがう調で基礎練", sub: "調がかわると景色もかわる", category: "はじまりの旅", type: "counter", home: true, counter: { metric: "practice_keys", threshold: 2 } },
  { no: 96, questId: "practice_art2", title: "奏法をかえて基礎練", sub: "スタッカートやスラーで", category: "はじまりの旅", type: "counter", home: true, counter: { metric: "practice_articulations", threshold: 2 } },
  { no: 92, questId: "etude_first", title: "エチュードをやってみる", sub: "わざを磨く1冊を開く", category: "はじまりの旅", type: "counter", home: true, counter: { metric: "etude_runs", threshold: 1 } },
  { no: 93, questId: "scale_first", title: "音階をやってみる", sub: "音づくりの基本の1回", category: "はじまりの旅", type: "counter", home: true, counter: { metric: "scale_runs", threshold: 1 } },
  { no: 94, questId: "arpeggio_first", title: "アルペジオをやってみる", sub: "和音の指づかいに触れる", category: "はじまりの旅", type: "counter", home: true, counter: { metric: "arpeggio_runs", threshold: 1 } },
  { no: 84, questId: "gallery_open", title: "ギャラリーを開く", sub: "宝物の家へ", category: "はじまりの旅", type: "event", home: true, hook: "recordQuestEvent (ギャラリー表示)" },
  // ── 曲の道 ──
  { no: 22, questId: "achieve_1", title: "はじめての達成", sub: "1曲を弾けるように", category: "曲の道", type: "counter", counter: { metric: "achieved_songs", threshold: 1 } },
  { no: 27, questId: "master_1", title: "はじめてのマスター", sub: "完全にきみのもの", category: "曲の道", type: "counter", counter: { metric: "mastered_songs", threshold: 1 } },
  { no: 28, questId: "master_3", title: "マスターの風格", sub: "3曲のマスター", category: "曲の道", type: "counter", counter: { metric: "mastered_songs", threshold: 3 } },
  { no: 29, questId: "master_5", title: "マスターの誇り", sub: "5曲のマスター", category: "曲の道", type: "counter", counter: { metric: "mastered_songs", threshold: 5 } },
  { no: 30, questId: "master_10", title: "マスターの殿堂", sub: "10曲のマスター", category: "曲の道", type: "counter", grade: "cert", counter: { metric: "mastered_songs", threshold: 10 } },
  { no: 31, questId: "score_90", title: "90点の壁をこえる", sub: "とても上手な演奏", category: "曲の道", type: "counter", counter: { metric: "score_total", threshold: 90 } },
  { no: 32, questId: "score_95", title: "95点の高み", sub: "ほぼ完璧な演奏", category: "曲の道", type: "counter", counter: { metric: "score_total", threshold: 95 } },
  // ── つみかさねの道 ──
  { no: 36, questId: "rec_50", title: "録音50回", sub: "立派な練習量", category: "つみかさねの道", type: "counter", counter: { metric: "recordings", threshold: 50 } },
  { no: 37, questId: "rec_100", title: "録音100回", sub: "100回の挑戦", category: "つみかさねの道", type: "counter", counter: { metric: "recordings", threshold: 100 } },
  { no: 38, questId: "rec_250", title: "録音250回", sub: "音がきたえられていく", category: "つみかさねの道", type: "counter", counter: { metric: "recordings", threshold: 250 } },
  { no: 39, questId: "rec_500", title: "録音500回", sub: "つみかさねの頂", category: "つみかさねの道", type: "counter", grade: "cert", counter: { metric: "recordings", threshold: 500 } },
  { no: 41, questId: "basics_50", title: "基礎練50回", sub: "強い土台", category: "つみかさねの道", type: "counter", counter: { metric: "practice_runs", threshold: 50 } },
  { no: 42, questId: "basics_100", title: "基礎練100回", sub: "ゆるがない土台", category: "つみかさねの道", type: "counter", counter: { metric: "practice_runs", threshold: 100 } },
  { no: 43, questId: "lessons_5", title: "学びのレッスン5つ", sub: "わざが増えていく", category: "つみかさねの道", type: "counter", counter: { metric: "lessons_cleared", threshold: 5 } },
  { no: 44, questId: "lessons_10", title: "学びのレッスン10", sub: "多彩なわざ", category: "つみかさねの道", type: "counter", counter: { metric: "lessons_cleared", threshold: 10 } },
  { no: 45, questId: "lessons_all", title: "レッスン全制覇", sub: "すべてのわざを学んだ", category: "つみかさねの道", type: "counter", grade: "cert", counter: { metric: "lessons_all", threshold: 0 } },
  // ── 続ける力 ──
  { no: 46, questId: "streak_3", title: "3日つづける", sub: "続ける力の芽", category: "続ける力", type: "counter", counter: { metric: "streak", threshold: 3 } },
  { no: 47, questId: "streak_7", title: "7日つづける", sub: "毎日15分の力", category: "続ける力", type: "counter", counter: { metric: "streak", threshold: 7 } },
  { no: 48, questId: "streak_14", title: "14日つづける", sub: "2週間の継続", category: "続ける力", type: "counter", counter: { metric: "streak", threshold: 14 } },
  { no: 49, questId: "streak_30", title: "30日つづける", sub: "習慣がいちばんの才能", category: "続ける力", type: "counter", counter: { metric: "streak", threshold: 30 } },
  { no: 50, questId: "streak_50", title: "50日つづける", sub: "もう止まらない", category: "続ける力", type: "counter", counter: { metric: "streak", threshold: 50 } },
  { no: 51, questId: "streak_100", title: "100日つづける", sub: "百日の道", category: "続ける力", type: "counter", grade: "cert", counter: { metric: "streak", threshold: 100 } },
  { no: 52, questId: "week5_1", title: "1週間で5日練習する", sub: "充実の1週間", category: "続ける力", type: "counter", counter: { metric: "week5", threshold: 1 } },
  { no: 53, questId: "week5_4", title: "週5日を4週連続", sub: "1ヶ月の充実", category: "続ける力", type: "counter", counter: { metric: "week5_streak", threshold: 4 } },
  // ── じぶんの音をみがく ──
  { no: 66, questId: "best_1", title: "自己ベスト更新", sub: "前の自分をこえた", category: "じぶんの音をみがく", type: "counter", counter: { metric: "best_updates", threshold: 1 } },
  { no: 67, questId: "best_5", title: "自己ベストを5回更新", sub: "こえ続ける力", category: "じぶんの音をみがく", type: "counter", counter: { metric: "best_updates", threshold: 5 } },
  { no: 68, questId: "pitch_90", title: "音程90点を達成", sub: "正確な左手", category: "じぶんの音をみがく", type: "counter", counter: { metric: "score_pitch", threshold: 90 } },
  { no: 69, questId: "timing_90", title: "リズム90点を達成", sub: "正確な拍", category: "じぶんの音をみがく", type: "counter", counter: { metric: "score_timing", threshold: 90 } },
  { no: 70, questId: "pitch_95", title: "音程95点を達成", sub: "研ぎすまされた音程", category: "じぶんの音をみがく", type: "counter", counter: { metric: "score_pitch", threshold: 95 } },
  { no: 71, questId: "timing_95", title: "リズム95点を達成", sub: "きざむ拍が美しい", category: "じぶんの音をみがく", type: "counter", counter: { metric: "score_timing", threshold: 95 } },
  // ── たからものあつめ ──
  { no: 89, questId: "cert_1", title: "はじめての証明書", sub: "マスターの証", category: "たからものあつめ", type: "counter", counter: { metric: "mastered_songs", threshold: 1 } },
  // ── 追加30件 (2026-08-31 Tetsuo採用 C01-C06/C11-C26/C30/C37/C45-C50・全てカウンター型) ──
  { no: 99, questId: "master_20", title: "マスター20曲", sub: "殿堂のさらに先", category: "曲の道", type: "counter", grade: "cert", counter: { metric: "mastered_songs", threshold: 20 } },
  { no: 100, questId: "songs90_3", title: "90点を3曲で", sub: "上手が当たり前に", category: "曲の道", type: "counter", counter: { metric: "songs_90", threshold: 3 } },
  { no: 101, questId: "songs95_3", title: "95点を3曲で", sub: "完成度の職人", category: "曲の道", type: "counter", counter: { metric: "songs_95", threshold: 3 } },
  { no: 102, questId: "score_100", title: "100点達成", sub: "満点の演奏", category: "曲の道", type: "counter", grade: "cert", counter: { metric: "score_total", threshold: 100 } },
  { no: 103, questId: "first_take_90", title: "一発で90点", sub: "最初の録音でいきなり", category: "曲の道", type: "counter", counter: { metric: "first_take_90", threshold: 1 } },
  { no: 104, questId: "song_rec_10", title: "同じ曲を10回録音", sub: "1曲をとことん", category: "曲の道", type: "counter", counter: { metric: "song_rec_max", threshold: 10 } },
  { no: 105, questId: "rec_1000", title: "録音1000回", sub: "伝説の練習量", category: "つみかさねの道", type: "counter", grade: "cert", counter: { metric: "recordings", threshold: 1000 } },
  { no: 106, questId: "basics_250", title: "基礎練250回", sub: "鋼の土台", category: "つみかさねの道", type: "counter", grade: "cert", counter: { metric: "practice_runs", threshold: 250 } },
  { no: 107, questId: "lessons_15", title: "学びのレッスン15", sub: "わざの図鑑ができていく", category: "つみかさねの道", type: "counter", counter: { metric: "lessons_cleared", threshold: 15 } },
  { no: 108, questId: "scale_10", title: "音階を10回", sub: "音づくりの習慣", category: "つみかさねの道", type: "counter", counter: { metric: "scale_runs", threshold: 10 } },
  { no: 109, questId: "arpeggio_10", title: "アルペジオを10回", sub: "和音の足腰", category: "つみかさねの道", type: "counter", counter: { metric: "arpeggio_runs", threshold: 10 } },
  { no: 110, questId: "etude_10", title: "エチュードを10回", sub: "磨きの積み重ね", category: "つみかさねの道", type: "counter", counter: { metric: "etude_runs", threshold: 10 } },
  { no: 111, questId: "day_rec5", title: "1日に5回録音", sub: "集中練習の日", category: "つみかさねの道", type: "counter", counter: { metric: "day_rec5", threshold: 1 } },
  { no: 112, questId: "day_both", title: "1日で曲も基礎練も", sub: "バランスのよい練習", category: "つみかさねの道", type: "counter", counter: { metric: "day_both", threshold: 1 } },
  { no: 113, questId: "streak_200", title: "200日つづける", sub: "道はまだつづく", category: "続ける力", type: "counter", grade: "cert", counter: { metric: "streak", threshold: 200 } },
  { no: 114, questId: "streak_365", title: "365日つづける", sub: "1年の道", category: "続ける力", type: "counter", grade: "cert", counter: { metric: "streak", threshold: 365 } },
  { no: 115, questId: "days_30", title: "のべ30日", sub: "ひと月ぶんの練習日", category: "続ける力", type: "counter", counter: { metric: "total_days", threshold: 30 } },
  { no: 116, questId: "days_200", title: "のべ200日", sub: "積もる日々", category: "続ける力", type: "counter", counter: { metric: "total_days", threshold: 200 } },
  { no: 117, questId: "weekend_both", title: "土日どちらも練習", sub: "週末の音楽家", category: "続ける力", type: "counter", counter: { metric: "weekend_both", threshold: 1 } },
  { no: 118, questId: "morning_rec", title: "朝の練習をする", sub: "1日が音で始まる", category: "続ける力", type: "counter", counter: { metric: "morning_rec", threshold: 1 } },
  { no: 119, questId: "comeback", title: "おかえり練習", sub: "休んでも戻ってこられた", category: "続ける力", type: "counter", counter: { metric: "comeback", threshold: 1 } },
  { no: 120, questId: "week5_8", title: "週5日を8週連続", sub: "2ヶ月の充実", category: "続ける力", type: "counter", grade: "cert", counter: { metric: "week5_streak", threshold: 8 } },
  { no: 121, questId: "position_song", title: "ポジション移動の曲", sub: "左手の旅", category: "いろんな曲の旅", type: "counter", counter: { metric: "song_position", threshold: 1 } },
  { no: 122, questId: "best_10", title: "自己ベストを10回更新", sub: "こえ続ける人", category: "じぶんの音をみがく", type: "counter", counter: { metric: "best_updates", threshold: 10 } },
  { no: 123, questId: "cards_10", title: "カード10枚", sub: "集まり始めた思い出", category: "たからものあつめ", type: "counter", counter: { metric: "cards_count", threshold: 10 } },
  { no: 124, questId: "cards_30", title: "カード30枚", sub: "りっぱなコレクション", category: "たからものあつめ", type: "counter", counter: { metric: "cards_count", threshold: 30 } },
  { no: 125, questId: "medals_3", title: "メダルを3個", sub: "節目をかさねて", category: "たからものあつめ", type: "counter", counter: { metric: "medals_count", threshold: 3 } },
  { no: 126, questId: "treasures_50", title: "宝物50個", sub: "ギャラリーがにぎやかに", category: "たからものあつめ", type: "counter", counter: { metric: "treasures_count", threshold: 50 } },
  { no: 128, questId: "anniversary", title: "アルコ記念日", sub: "はじめての録音から1年", category: "たからものあつめ", type: "counter", counter: { metric: "anniversary_1y", threshold: 1 } },
  // ── 追加18件 (2026-08-31 Tetsuo採用D案・全てカウンター型) → 計100件 ──
  { no: 129, questId: "week7", title: "週7日練習する", sub: "パーフェクトな1週間", category: "続ける力", type: "counter", counter: { metric: "week7", threshold: 1 } },
  { no: 130, questId: "morning_5", title: "朝練を5回", sub: "朝型の音楽家", category: "続ける力", type: "counter", counter: { metric: "morning_rec", threshold: 5 } },
  { no: 131, questId: "practice_streak7", title: "基礎練を7日つづける", sub: "土台を毎日", category: "続ける力", type: "counter", counter: { metric: "practice_streak", threshold: 7 } },
  { no: 132, questId: "day_songs3", title: "1日で3曲弾く", sub: "気分はコンサート", category: "つみかさねの道", type: "counter", counter: { metric: "day_songs_max", threshold: 3 } },
  { no: 133, questId: "practice_cat4", title: "基礎練を4種類", sub: "メニューの使い分け", category: "つみかさねの道", type: "counter", counter: { metric: "practice_categories", threshold: 4 } },
  { no: 134, questId: "etude_kinds3", title: "エチュードを3種類", sub: "いろんな磨き方", category: "つみかさねの道", type: "counter", counter: { metric: "etude_distinct", threshold: 3 } },
  { no: 135, questId: "scale_50", title: "音階を50回", sub: "基本をきわめる", category: "つみかさねの道", type: "counter", counter: { metric: "scale_runs", threshold: 50 } },
  { no: 136, questId: "lessons_20", title: "学びのレッスン20", sub: "わざはかせ", category: "つみかさねの道", type: "counter", counter: { metric: "lessons_cleared", threshold: 20 } },
  { no: 137, questId: "songs90_5", title: "90点を5曲で", sub: "どの曲もハイレベル", category: "曲の道", type: "counter", counter: { metric: "songs_90", threshold: 5 } },
  { no: 138, questId: "master_30", title: "マスター30曲", sub: "生きる伝説", category: "曲の道", type: "counter", grade: "cert", counter: { metric: "mastered_songs", threshold: 30 } },
  { no: 139, questId: "best_20", title: "自己ベストを20回更新", sub: "成長がとまらない", category: "じぶんの音をみがく", type: "counter", counter: { metric: "best_updates", threshold: 20 } },
  { no: 140, questId: "days_365", title: "のべ365日", sub: "1年ぶんの練習日", category: "続ける力", type: "counter", grade: "cert", counter: { metric: "total_days", threshold: 365 } },
  { no: 141, questId: "titles_3", title: "ランクアップを3回", sub: "のぼり続ける人", category: "たからものあつめ", type: "counter", counter: { metric: "titles_count", threshold: 3 } },
  { no: 142, questId: "nintei_1", title: "はじめての認定証", sub: "最難関のあかし", category: "たからものあつめ", type: "counter", counter: { metric: "nintei_count", threshold: 1 } },
  { no: 143, questId: "medals_5", title: "メダルを5個全部", sub: "節目の完全制覇", category: "たからものあつめ", type: "counter", grade: "cert", counter: { metric: "medals_count", threshold: 5 } },
  { no: 144, questId: "treasures_100", title: "宝物100個", sub: "あふれるギャラリー", category: "たからものあつめ", type: "counter", grade: "cert", counter: { metric: "treasures_count", threshold: 100 } },
  { no: 145, questId: "cards_all", title: "カードを全部あつめる", sub: "カードコンプリート", category: "たからものあつめ", type: "counter", grade: "cert", counter: { metric: "cards_all", threshold: 0 } },
]


/** メダル = カード枚数の節目。2026-08-31再編でカード対象が48件になったため上限50→45に調整 (要Tetsuo確認) */
export const MEDAL_MILESTONES = [5, 10, 20, 30, 45] as const

/** 認定証 (grade cert・最難関6件) の券面文言。大見出し/種別行/本文2行 (草案・中身確定で差し替え可) */
export type NinteiFaceDef = { big: string; kindLine: string; body1: string; body2: string }
export const NINTEI_FACES: Record<string, NinteiFaceDef> = {
  master_10: {
    big: "10 MASTERS",
    kindLine: "栄冠の認定証",
    body1: "10曲をマスターしたことを ここに認定します",
    body2: "その音は もう堂々たる演奏家のものです",
  },
  rec_500: {
    big: "500 TAKES",
    kindLine: "つみかさねの認定証",
    body1: "500回の録音を かさねたことを ここに認定します",
    body2: "ひとつひとつの挑戦が いまの音を作りました",
  },
  lessons_all: {
    big: "ALL LESSONS",
    kindLine: "わざの認定証",
    body1: "すべての学びのレッスンを 修めたことを ここに認定します",
    body2: "身につけたわざは 一生の宝物です",
  },
  streak_100: {
    big: "100 DAYS",
    kindLine: "継続の認定証",
    body1: "100日つづけて練習したことを ここに認定します",
    body2: "続ける力は いちばんの才能です",
  },
  master_20: {
    big: "20 MASTERS",
    kindLine: "栄光の認定証",
    body1: "20曲をマスターしたことを ここに認定します",
    body2: "きみの音楽は 立派な財産です",
  },
  master_30: {
    big: "30 MASTERS",
    kindLine: "伝説の認定証",
    body1: "30曲をマスターしたことを ここに認定します",
    body2: "その歩みは もう伝説です",
  },
  rec_1000: {
    big: "1000 TAKES",
    kindLine: "鍛錬の認定証",
    body1: "1000回の録音を かさねたことを ここに認定します",
    body2: "積み重ねの力を わたしは知っています",
  },
  basics_250: {
    big: "250 DRILLS",
    kindLine: "土台の認定証",
    body1: "基礎練を250回 かさねたことを ここに認定します",
    body2: "ゆるがない土台が きみの音を支えます",
  },
  streak_200: {
    big: "200 DAYS",
    kindLine: "不屈の認定証",
    body1: "200日つづけて練習したことを ここに認定します",
    body2: "続いた日々そのものが 誇りです",
  },
  streak_365: {
    big: "365 DAYS",
    kindLine: "1年の認定証",
    body1: "365日つづけて練習したことを ここに認定します",
    body2: "音楽が きみの毎日になりました",
  },
  days_365: {
    big: "365 TOTAL",
    kindLine: "歩みの認定証",
    body1: "のべ365日の練習を ここに認定します",
    body2: "1年ぶんの音が きみの中にあります",
  },
  score_100: {
    big: "PERFECT 100",
    kindLine: "満点の認定証",
    body1: "100点の演奏を ここに認定します",
    body2: "完璧な瞬間に 立ち会えました",
  },
  cards_all: {
    big: "ALL CARDS",
    kindLine: "完集の認定証",
    body1: "すべてのカードを あつめたことを ここに認定します",
    body2: "きみの旅の すべてが ここにあります",
  },
  week5_8: {
    big: "8 WEEKS",
    kindLine: "習慣の認定証",
    body1: "週5日の練習を 8週つづけたことを ここに認定します",
    body2: "習慣の力が きみを育てています",
  },
  medals_5: {
    big: "5 MEDALS",
    kindLine: "制覇の認定証",
    body1: "すべてのメダルを あつめたことを ここに認定します",
    body2: "節目のひとつひとつを 乗りこえました",
  },
  treasures_100: {
    big: "100 TREASURES",
    kindLine: "宝物の認定証",
    body1: "100個の宝物を あつめたことを ここに認定します",
    body2: "ギャラリーは きみの歩みの美術館です",
  },
}

export const QUEST_BY_ID = new Map(QUESTS.map((q) => [q.questId, q]))
export const EVENT_QUESTS = QUESTS.filter((q) => q.type === "event")
export const COUNTER_QUESTS = QUESTS.filter((q) => q.type === "counter")
/** recordQuestEvent が受理する操作イベントの白リスト (event型questId + action累計) */
export const CLIENT_EVENT_QUEST_IDS = new Set(
  EVENT_QUESTS.filter((q) => q.hook?.startsWith("recordQuestEvent")).map((q) => q.questId),
)
export const ACTION_COUNT_KEYS = new Set(
  COUNTER_QUESTS.filter((q) => q.counter?.metric === "action").map((q) => q.counter?.action as string),
)
