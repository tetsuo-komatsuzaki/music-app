// ============================================================
// 報酬体系「ギャラリー」カタログ (骨組み・2026-08-30 実装仕様v1.3)
//
// クエスト定義の正本。中身 (文言・件数・絵柄) は草案v3ベースで【Tetsuo最終確定前】。
// 構造 (番号・型・カテゴリ・判定メトリクス) の検証が骨組みフェーズの目的。
// 規約: 番号の再利用禁止 / 欠番はコメントで残す / 文言lintは catalog.test.ts。
// 授与の格: 通常=カード / 最難関6件=認定証 (grade:"cert") / メダルはカード枚数の節目
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
  | "action"            // UserActionCount の action 累計 (payload.action)

export type QuestDef = {
  /** カタログ固定番号 (全体通し・再利用禁止) */
  no: number
  questId: string
  title: string
  sub: string
  category: string
  type: QuestType
  /** 授与の格。省略=カード。cert=アルコの認定証 (最難関6件) */
  grade?: "cert"
  /** ホームのボードに出す操作系か */
  home?: true
  /** event型: 発火フックの実装箇所 (検収表の正) */
  hook?: string
  /** counter型: メトリクスと閾値 */
  counter?: { metric: CounterMetric; threshold: number; action?: string }
}

export const QUESTS: QuestDef[] = [
  // ── はじまりの旅 (001-009) 全て操作系 ──
  { no: 1, questId: "first_loop", title: "はじめての1周", sub: "成長サイクルを回した", category: "はじまりの旅", type: "event", home: true, hook: "completeGuide (guideState.ts)" },
  { no: 2, questId: "annotate", title: "譜面に書き込みしてみる", sub: "気をつける場所に印を", category: "はじまりの旅", type: "event", home: true, hook: "譜面注釈の保存action" },
  { no: 3, questId: "lesson_first", title: "学びのレッスンを1つ", sub: "新しい技術のコツ", category: "はじまりの旅", type: "event", home: true, hook: "recordLessonPlay (クリア成立時)" },
  { no: 4, questId: "karte_view", title: "カルテで成長を見る", sub: "2周ぶん貯まったら", category: "はじまりの旅", type: "event", home: true, hook: "recordQuestEvent (progressページ表示)" },
  { no: 5, questId: "guide_modal", title: "上達のしくみを見る", sub: "成長の地図を知る", category: "はじまりの旅", type: "event", home: true, hook: "recordQuestEvent (ProgressGuideModal表示)" },
  { no: 6, questId: "loop_practice", title: "ループ練習を使う", sub: "弱点の小節だけくり返す", category: "はじまりの旅", type: "event", home: true, hook: "演奏アップロード処理 (rangeFromNote付き)" },
  { no: 7, questId: "listen_back", title: "演奏を聴き返す", sub: "自分の音を客観的に", category: "はじまりの旅", type: "event", home: true, hook: "recordQuestEvent (録音の再生)" },
  { no: 8, questId: "landscape_rec", title: "横画面で録音する", sub: "譜面が大きく見やすい", category: "はじまりの旅", type: "event", home: true, hook: "演奏アップロード処理 (帯モードフラグ)" },
  { no: 9, questId: "basics_first", title: "基礎練をやってみる", sub: "毎日の積み重ねの入口", category: "はじまりの旅", type: "event", home: true, hook: "教材演奏アップロード処理 (初回)" },
  // ── つかいこなしの旅 (010-021) 全て操作系 ──
  { no: 10, questId: "easy_variant", title: "やさしい難易度で弾く", sub: "無理なく一歩ずつ", category: "つかいこなしの旅", type: "event", home: true, hook: "演奏アップロード処理 (難易度変種)" },
  { no: 11, questId: "part_variant", title: "パート練習を使う", sub: "むずかしい所だけ", category: "つかいこなしの旅", type: "event", home: true, hook: "演奏アップロード処理 (パート変種)" },
  { no: 12, questId: "tempo_change", title: "テンポをかえて弾く", sub: "ゆっくりから確実に", category: "つかいこなしの旅", type: "event", home: true, hook: "recordQuestEvent (テンポ変更録音)" },
  { no: 13, questId: "visual_beat", title: "視覚ビートをつけて弾く", sub: "拍を目で感じる", category: "つかいこなしの旅", type: "event", home: true, hook: "recordQuestEvent (視覚ビート録音)" },
  { no: 14, questId: "fingerboard_zoom", title: "指板マップをのぞく", sub: "音程のくせが見える", category: "つかいこなしの旅", type: "event", home: true, hook: "recordQuestEvent (指板ズーム)" },
  { no: 15, questId: "pitch_cell", title: "音程マップのマスを開く", sub: "1音ずつ確かめる", category: "つかいこなしの旅", type: "event", home: true, hook: "recordQuestEvent (セル詳細)" },
  { no: 16, questId: "practice_karte", title: "練習後カルテを見る", sub: "きょうの練習のまとめ", category: "つかいこなしの旅", type: "event", home: true, hook: "recordQuestEvent (練習後カルテ表示)" },
  { no: 17, questId: "skill_map", title: "技術マップを見る", sub: "わざの点灯を確かめる", category: "つかいこなしの旅", type: "event", home: true, hook: "recordQuestEvent (技術マップ表示)" },
  { no: 18, questId: "trajectory", title: "点数の伸びグラフを見る", sub: "上達は線でわかる", category: "つかいこなしの旅", type: "event", home: true, hook: "recordQuestEvent (上達のようす表示)" },
  { no: 19, questId: "favorite", title: "お気に入りに登録", sub: "よく使うものを手元に", category: "つかいこなしの旅", type: "event", home: true, hook: "お気に入り登録action" },
  { no: 20, questId: "next_song", title: "つぎの曲に挑戦", sub: "レパートリーを広げる", category: "つかいこなしの旅", type: "event", home: true, hook: "recordQuestEvent (おすすめ経由の録音)" },
  { no: 21, questId: "stamp", title: "記譜スタンプを使う", sub: "音楽記号で書き込み", category: "つかいこなしの旅", type: "event", home: true, hook: "譜面注釈の保存action (スタンプ種別)" },
  // ── 曲の道 (022-033) ──
  { no: 22, questId: "achieve_1", title: "はじめての達成", sub: "1曲を弾けるように", category: "曲の道", type: "counter", counter: { metric: "achieved_songs", threshold: 1 } },
  { no: 23, questId: "achieve_3", title: "達成コレクター", sub: "弾ける曲が増えていく", category: "曲の道", type: "counter", counter: { metric: "achieved_songs", threshold: 3 } },
  { no: 24, questId: "achieve_5", title: "達成の手だれ", sub: "5曲めの達成", category: "曲の道", type: "counter", counter: { metric: "achieved_songs", threshold: 5 } },
  { no: 25, questId: "achieve_10", title: "達成の達人", sub: "10曲=ランクアップ", category: "曲の道", type: "counter", counter: { metric: "achieved_songs", threshold: 10 } },
  { no: 26, questId: "achieve_20", title: "達成の鉄人", sub: "20曲の達成", category: "曲の道", type: "counter", counter: { metric: "achieved_songs", threshold: 20 } },
  { no: 27, questId: "master_1", title: "はじめてのマスター", sub: "完全にきみのもの", category: "曲の道", type: "counter", counter: { metric: "mastered_songs", threshold: 1 } },
  { no: 28, questId: "master_3", title: "マスターの風格", sub: "3曲のマスター", category: "曲の道", type: "counter", counter: { metric: "mastered_songs", threshold: 3 } },
  { no: 29, questId: "master_5", title: "マスターの誇り", sub: "5曲のマスター", category: "曲の道", type: "counter", counter: { metric: "mastered_songs", threshold: 5 } },
  { no: 30, questId: "master_10", title: "マスターの殿堂", sub: "10曲のマスター", category: "曲の道", type: "counter", grade: "cert", counter: { metric: "mastered_songs", threshold: 10 } },
  { no: 31, questId: "score_90", title: "90点の壁をこえる", sub: "とても上手な演奏", category: "曲の道", type: "counter", counter: { metric: "score_total", threshold: 90 } },
  { no: 32, questId: "score_95", title: "95点の高み", sub: "ほぼ完璧な演奏", category: "曲の道", type: "counter", counter: { metric: "score_total", threshold: 95 } },
  { no: 33, questId: "star2_song", title: "☆2の曲に挑戦", sub: "一段むずかしい曲へ", category: "曲の道", type: "counter", counter: { metric: "song_star2", threshold: 1 } },
  // ── つみかさねの道 (034-045) ──
  { no: 34, questId: "rec_10", title: "録音10回", sub: "積み重ねの始まり", category: "つみかさねの道", type: "counter", counter: { metric: "recordings", threshold: 10 } },
  { no: 35, questId: "rec_25", title: "録音25回", sub: "習慣になってきた", category: "つみかさねの道", type: "counter", counter: { metric: "recordings", threshold: 25 } },
  { no: 36, questId: "rec_50", title: "録音50回", sub: "立派な練習量", category: "つみかさねの道", type: "counter", counter: { metric: "recordings", threshold: 50 } },
  { no: 37, questId: "rec_100", title: "録音100回", sub: "100回の挑戦", category: "つみかさねの道", type: "counter", counter: { metric: "recordings", threshold: 100 } },
  { no: 38, questId: "rec_250", title: "録音250回", sub: "音がきたえられていく", category: "つみかさねの道", type: "counter", counter: { metric: "recordings", threshold: 250 } },
  { no: 39, questId: "rec_500", title: "録音500回", sub: "つみかさねの頂", category: "つみかさねの道", type: "counter", grade: "cert", counter: { metric: "recordings", threshold: 500 } },
  { no: 40, questId: "basics_10", title: "基礎練10回", sub: "土台づくり", category: "つみかさねの道", type: "counter", counter: { metric: "practice_runs", threshold: 10 } },
  { no: 41, questId: "basics_50", title: "基礎練50回", sub: "強い土台", category: "つみかさねの道", type: "counter", counter: { metric: "practice_runs", threshold: 50 } },
  { no: 42, questId: "basics_100", title: "基礎練100回", sub: "ゆるがない土台", category: "つみかさねの道", type: "counter", counter: { metric: "practice_runs", threshold: 100 } },
  { no: 43, questId: "lessons_5", title: "学びのレッスン5つ", sub: "わざが増えていく", category: "つみかさねの道", type: "counter", counter: { metric: "lessons_cleared", threshold: 5 } },
  { no: 44, questId: "lessons_10", title: "学びのレッスン10", sub: "多彩なわざ", category: "つみかさねの道", type: "counter", counter: { metric: "lessons_cleared", threshold: 10 } },
  { no: 45, questId: "lessons_all", title: "レッスン全制覇", sub: "すべてのわざを学んだ", category: "つみかさねの道", type: "counter", grade: "cert", counter: { metric: "lessons_all", threshold: 0 } },
  // ── 続ける力 (046-055) ──
  { no: 46, questId: "streak_3", title: "3日つづける", sub: "続ける力の芽", category: "続ける力", type: "counter", counter: { metric: "streak", threshold: 3 } },
  { no: 47, questId: "streak_7", title: "7日つづける", sub: "毎日15分の力", category: "続ける力", type: "counter", counter: { metric: "streak", threshold: 7 } },
  { no: 48, questId: "streak_14", title: "14日つづける", sub: "2週間の継続", category: "続ける力", type: "counter", counter: { metric: "streak", threshold: 14 } },
  { no: 49, questId: "streak_30", title: "30日つづける", sub: "習慣がいちばんの才能", category: "続ける力", type: "counter", counter: { metric: "streak", threshold: 30 } },
  { no: 50, questId: "streak_50", title: "50日つづける", sub: "もう止まらない", category: "続ける力", type: "counter", counter: { metric: "streak", threshold: 50 } },
  { no: 51, questId: "streak_100", title: "100日つづける", sub: "百日の道", category: "続ける力", type: "counter", grade: "cert", counter: { metric: "streak", threshold: 100 } },
  { no: 52, questId: "week5_1", title: "1週間で5日", sub: "充実の1週間", category: "続ける力", type: "counter", counter: { metric: "week5", threshold: 1 } },
  { no: 53, questId: "week5_4", title: "週5日を4週連続", sub: "1ヶ月の充実", category: "続ける力", type: "counter", counter: { metric: "week5_streak", threshold: 4 } },
  { no: 54, questId: "month20", title: "ひと月で20日", sub: "練習が生活の一部に", category: "続ける力", type: "counter", counter: { metric: "month20", threshold: 1 } },
  { no: 55, questId: "days_100", title: "のべ100日", sub: "積もった練習日", category: "続ける力", type: "counter", counter: { metric: "total_days", threshold: 100 } },
  // ── いろんな曲の旅 (056-065) ──
  { no: 56, questId: "songs_3", title: "3曲弾いてみる", sub: "旅の始まり", category: "いろんな曲の旅", type: "counter", counter: { metric: "distinct_songs", threshold: 3 } },
  { no: 57, questId: "songs_5", title: "5曲の旅人", sub: "世界が広がる", category: "いろんな曲の旅", type: "counter", counter: { metric: "distinct_songs", threshold: 5 } },
  { no: 58, questId: "songs_10", title: "10曲の旅人", sub: "レパートリーの厚み", category: "いろんな曲の旅", type: "counter", counter: { metric: "distinct_songs", threshold: 10 } },
  { no: 59, questId: "songs_20", title: "20曲の旅人", sub: "たくさんの物語", category: "いろんな曲の旅", type: "counter", grade: "cert", counter: { metric: "distinct_songs", threshold: 20 } },
  { no: 60, questId: "minor_song", title: "短調のしらべ", sub: "あたらしい響きの世界", category: "いろんな曲の旅", type: "counter", counter: { metric: "song_minor", threshold: 1 } },
  { no: 61, questId: "fast_song", title: "はやい曲に挑戦", sub: "指が駆ける", category: "いろんな曲の旅", type: "counter", counter: { metric: "song_fast", threshold: 1 } },
  { no: 62, questId: "doublestop_song", title: "重音の響き", sub: "2つの弦の和音", category: "いろんな曲の旅", type: "counter", counter: { metric: "song_doublestop", threshold: 1 } },
  { no: 63, questId: "position_song", title: "ポジション移動の曲", sub: "左手の旅", category: "いろんな曲の旅", type: "counter", counter: { metric: "song_position", threshold: 1 } },
  { no: 64, questId: "etude_1", title: "エチュードを1つ達成", sub: "わざを磨く1冊", category: "いろんな曲の旅", type: "counter", counter: { metric: "etudes_achieved", threshold: 1 } },
  { no: 65, questId: "etude_5", title: "エチュードを5つ達成", sub: "磨かれたわざ", category: "いろんな曲の旅", type: "counter", counter: { metric: "etudes_achieved", threshold: 5 } },
  // ── じぶんの音をみがく (066-075) ──
  { no: 66, questId: "best_1", title: "自己ベスト更新", sub: "前の自分をこえた", category: "じぶんの音をみがく", type: "counter", counter: { metric: "best_updates", threshold: 1 } },
  { no: 67, questId: "best_5", title: "自己ベスト5回", sub: "こえ続ける力", category: "じぶんの音をみがく", type: "counter", counter: { metric: "best_updates", threshold: 5 } },
  { no: 68, questId: "pitch_90", title: "音程90点", sub: "正確な左手", category: "じぶんの音をみがく", type: "counter", counter: { metric: "score_pitch", threshold: 90 } },
  { no: 69, questId: "timing_90", title: "リズム90点", sub: "正確な拍", category: "じぶんの音をみがく", type: "counter", counter: { metric: "score_timing", threshold: 90 } },
  { no: 70, questId: "pitch_95", title: "音程95点", sub: "研ぎすまされた音程", category: "じぶんの音をみがく", type: "counter", counter: { metric: "score_pitch", threshold: 95 } },
  { no: 71, questId: "timing_95", title: "リズム95点", sub: "きざむ拍が美しい", category: "じぶんの音をみがく", type: "counter", counter: { metric: "score_timing", threshold: 95 } },
  { no: 72, questId: "annotations_5", title: "印を5つ", sub: "考える練習の跡", category: "じぶんの音をみがく", type: "counter", counter: { metric: "annotations", threshold: 5 } },
  { no: 73, questId: "annotations_20", title: "印を20", sub: "譜面がきみの地図に", category: "じぶんの音をみがく", type: "counter", counter: { metric: "annotations", threshold: 20 } },
  { no: 74, questId: "playback_10", title: "聴き返し10回", sub: "耳が育つ習慣", category: "じぶんの音をみがく", type: "counter", counter: { metric: "action", threshold: 10, action: "playback" } },
  { no: 75, questId: "karte_5", title: "カルテ通い", sub: "自分を知る5回", category: "じぶんの音をみがく", type: "counter", counter: { metric: "action", threshold: 5, action: "karte_view" } },
  // ── シェアする (076-083・先生関連6件は欠番: 077-082) ──
  { no: 76, questId: "share_card", title: "シェアカードを作る", sub: "がんばりを見せよう", category: "シェアする", type: "event", home: true, hook: "シェアカード作成action" },
  // 077-082 欠番 (先生関連の全削除・2026-08-30)
  { no: 83, questId: "share_cert", title: "証明書をシェア", sub: "誇りを届ける", category: "シェアする", type: "event", hook: "証明書シェアaction (フェーズ3)" },
  // ── たからものあつめ (084-091・087/088/091はメダル一本化で欠番) ──
  { no: 84, questId: "gallery_open", title: "ギャラリーを開く", sub: "宝物の家へ", category: "たからものあつめ", type: "event", home: true, hook: "recordQuestEvent (ギャラリー表示)" },
  { no: 85, questId: "coins_3", title: "コイン3枚", sub: "たまり始めた輝き", category: "たからものあつめ", type: "counter", counter: { metric: "achieved_songs", threshold: 3 } },
  { no: 86, questId: "coins_10", title: "コイン10枚", sub: "ランクアップの輝き", category: "たからものあつめ", type: "counter", counter: { metric: "achieved_songs", threshold: 10 } },
  // 087/088 欠番 (カード枚数はメダルへ一本化)
  { no: 89, questId: "cert_1", title: "はじめての証明書", sub: "マスターの証", category: "たからものあつめ", type: "counter", counter: { metric: "mastered_songs", threshold: 1 } },
  { no: 90, questId: "cert_3", title: "証明書3枚", sub: "誇りの棚", category: "たからものあつめ", type: "counter", grade: "cert", counter: { metric: "mastered_songs", threshold: 3 } },
  // 091 欠番 (章廃止に伴い削除)
  // ── 追加5件 (2026-08-30 Tetsuo承認: 基礎練の種類別3+変種2。全部カウンター型=配線不要) ──
  { no: 92, questId: "etude_first", title: "エチュードをやってみる", sub: "わざを磨く1冊を開く", category: "つみかさねの道", type: "counter", counter: { metric: "etude_runs", threshold: 1 } },
  { no: 93, questId: "scale_first", title: "音階をやってみる", sub: "音づくりの基本の1回", category: "つみかさねの道", type: "counter", counter: { metric: "scale_runs", threshold: 1 } },
  { no: 94, questId: "arpeggio_first", title: "アルペジオをやってみる", sub: "和音の指づかいに触れる", category: "つみかさねの道", type: "counter", counter: { metric: "arpeggio_runs", threshold: 1 } },
  { no: 95, questId: "practice_key2", title: "ちがう調で基礎練", sub: "調がかわると景色もかわる", category: "つかいこなしの旅", type: "counter", counter: { metric: "practice_keys", threshold: 2 } },
  { no: 96, questId: "practice_art2", title: "奏法をかえて基礎練", sub: "スタッカートやスラーで", category: "つかいこなしの旅", type: "counter", counter: { metric: "practice_articulations", threshold: 2 } },
]

/** メダル = カード枚数の節目 (枚数は草案・観点16: 変更時も番号=枚数は不変) */
export const MEDAL_MILESTONES = [5, 10, 20, 30, 50] as const

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
  songs_20: {
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
