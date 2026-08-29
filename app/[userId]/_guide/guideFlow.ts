// ============================================================
// 「アルコと最初の1周」フロー定義 (2026-08-29 19ステップ確定版)
// 見た目と流れの正 = docs/mocks/first-loop-guide/ (Tetsuo承認モック)。
// 実装完了時にモック画面との誤差ゼロ突き合わせを行う約束。
//
// 【方式確定 (Tetsuo 2026-08-29)】チュートリアルはデモ再現でやる。
//   ・ユーザーのランクによって表示される曲が異なるため、デモ曲 (きらきら星)
//     に固定して全員に同じ体験を見せる
//   ・実演奏を待つと時間がかかるため「弾いたてい」で進める
//     (録音ボタン→3・2・1→横画面の帯モードデモ→採点結果)
//   ・デモはDBに演奏データを一切書かない (副作用ゼロ)。終了後は通常の
//     ホームに着地するだけで「戻す」処理は存在しない。
//     本物なのは進行の保存と達成カードの付与だけ
//
// 確定ルール:
//  ・「次へ」ボタンは存在しない。遷移=デモ画面の実物タップ・カード内ボタン・
//    「つづける」チップのタップのみ。自動送りは禁止 (例外は録音カウントダウンと、
//    画面内で完結する演出: リング完成→達成カード出現、コインが埋まる)
//  ・説明ステップ (advance: chip) は道しるべバー右端に脈動する金の「つづける」
//    チップを表示。「タップでつづける」という文言は使わない
//  ・金の光=次に押す場所 / 灰枠=いま見る場所 / 現在地チップ / スキップ常設。
//    光の枠は data-guide 要素の実測 rect (DOM基準) — 固定%座標は使わない
//  ・達成=弾けるリングの3条件 (学びレッスン+エチュード+通して弾く3回)。90点ではない。
//    マスター=直近5回の平均90点以上
//  ・デモ画面は実コンポーネント+デモデータで組む。対象要素は data-guide="<spot名>"
//  ・進行と完了はサーバー(DB)に保存。localStorage 禁止 (端末が変わると再表示される
//    WelcomeSlides の欠陥を繰り返さない)。完了/スキップ後は二度と表示しない。
//    途中離脱は続きから再開 (再表示にはあたらない)
//  ・失敗分岐 (低得点・無音) は廃止済み
// ============================================================

/** アルコのポーズ (app/components/ArcoChan の POSES id) */
export type GuidePoseId = "05B" | "05C" | "06B" | "08B" | "03B" | "07B" | "08C"

/** デモ画面の種類 (チュートリアル専用の再現画面。実画面には遷移しない) */
export type GuideScreen =
  | "home"         // デモホーム (さいしょの1曲=きらきら星。カード自体が金枠発光)
  | "score"        // デモ演奏画面 1回目 (採点前なので現在のレベルは非表示=実装準拠)
  | "recording"    // カウントダウン→横画面の帯モードデモ (カウント中テンポガイドは停止)
  | "result80"     // デモ採点結果 1回目 (#5・80点・音程83/リズム77+採点完了の吹き出し)
  | "reviewGraph"  // デモふりかえり (上達のようす 60→65→68→74→80+音程マップカード)
  | "mapZoom"      // 音程マップ拡大モーダル (赤セル=シ・A線)
  | "mapDetail"    // 赤セルの詳細 (案C: 弦の上で見せる TransRow 転写)
  | "review"       // デモふりかえり (ホームタブへ誘導)
  | "home2"        // デモホーム 前提状態 (直近80点・レッスン✓・エチュード✓・通し2/3・リング2/3)
  | "score2"       // デモ演奏画面 2回目 (現在のレベル=いい調子・80点)
  | "result95"     // デモ採点結果 2回目 (#6・95点・ぜんぶ緑+吹き出し)
  | "ringComplete" // ホームで弾けるリング完成モーション→3/3・✓→紙吹雪+達成カード出現
  | "home3"        // デモホーム 達成後 (直近95点・リング3/3・★7をあと9曲+ゲージ)
  | "trace"        // 演奏の軌跡シート (画面上部から表示・コイン1枚めが埋まるモーション)

export type GuideAdvance =
  | { type: "tap" }    // spot のデモ要素タップで進む
  | { type: "card" }   // ガイドカード・デモ画面内のボタン (わかった/うけとる 等)
  | { type: "chip" }   // 説明ステップ: バー右端の「つづける」チップ (画面タップでも可)
  | { type: "record" } // 弾いたてい (3・2・1→帯モードデモ→次へ)

export type GuideStep = {
  id: string
  /** 現在地チップの表示名 */
  where: string
  /** どのデモ画面を出すか */
  screen: GuideScreen
  pose: GuidePoseId
  /** 道しるべバーの文言 (改行は \n) */
  text: string
  /** 進捗pips: 0〜6 (聴く/弾く/結果/トップ/直す/再挑戦/ごほうび) */
  phase: number
  /** 金の光を当てるデモ要素: [data-guide="..."] の値 */
  spot?: string
  /** 灰枠 (いま見る場所) */
  spot2?: string
  /** バー位置の特例。high=最上部 (採点完了の吹き出しと重ねないため) */
  barPos?: "high"
  /** ガイド暗幕を出さない特例 (実画面側が既に暗幕を持つとき: 演奏の軌跡シート等) */
  dim?: false
  /** 進み方 */
  advance: GuideAdvance
}

// 1周目のフロー (19ステップ)。モックの FLOW と1対1
// (docs/mocks/first-loop-guide/build_guide_real.py の FLOW 配列が正)
export const FIRST_LOOP: GuideStep[] = [
  {
    id: "home_pick_song", where: "ホーム", screen: "home", pose: "05B", phase: 0,
    text: "まずは1回、弾いてみよう。\nさいしょの1曲をタップ!",
    spot: "home-starter", advance: { type: "tap" },
  },
  {
    // お手本は必須にしない (Tetsuo確定)。灰枠で「聴けるよ」と紹介するだけ。
    // 作法カードはお手本ボタン行を隠さない位置 (下寄せ・上端固定) に出す
    id: "score_manner", where: "演奏画面", screen: "score", pose: "08B", phase: 1,
    text: "曲のページに来たよ。お手本も聴けるよ。\n録音の前に、これだけ覚えてね",
    spot2: "score-exemplar", advance: { type: "card" }, // 作法カード (わかった)
  },
  {
    id: "score_record", where: "演奏画面", screen: "score", pose: "05C", phase: 1,
    text: "「録音して採点」を押して、\nいまの音をアルコに聴かせて",
    spot: "score-record", advance: { type: "record" },
  },
  {
    id: "result_first", where: "採点結果", screen: "result80", pose: "08B", phase: 2,
    text: "80点！ どこがずれたかは楽譜の色でわかるよ。\nつぎは「ふりかえり」をタップ",
    spot: "score-tab-review", spot2: "result-perf-row", advance: { type: "tap" },
  },
  {
    id: "review_graph", where: "ふりかえり", screen: "reviewGraph", pose: "08B", phase: 2,
    text: "上のグラフで、点数の伸びをチェック！ 2回以上弾くと出るよ。\nつづいて下の指板をタップ",
    spot: "review-fingerboard", spot2: "review-trajectory", advance: { type: "tap" },
  },
  {
    id: "map_zoom", where: "音程マップ", screen: "mapZoom", pose: "05C", phase: 2,
    text: "色がついた音がずれた音。\n赤いところをタップしてみて",
    spot: "map-red-cell", advance: { type: "tap" },
  },
  {
    id: "map_detail", where: "音程マップ", screen: "mapDetail", pose: "08B", phase: 2,
    text: "どこからの移動でずれたかまで見られるよ。\nじっくり見たら「とじる」をタップ",
    spot: "map-close", spot2: "map-detail-panel", advance: { type: "tap" },
  },
  {
    id: "review_to_home", where: "ふりかえり", screen: "review", pose: "05B", phase: 3,
    text: "つぎはホームへ。\n下の「ホーム」タブをタップ",
    spot: "tab-home", advance: { type: "tap" },
  },
  {
    id: "home_conditions", where: "ホーム", screen: "home2", pose: "05B", phase: 4,
    text: "まずは「達成」をめざそう！ レッスン・エチュード・通して3回演奏でクリア。\nあと、通して1回演奏してみよう",
    spot2: "home-ring-card", advance: { type: "chip" },
  },
  {
    id: "home_row_links", where: "ホーム", screen: "home2", pose: "05B", phase: 4,
    text: "学びレッスンとエチュードは\nこの行をタップすると\nその練習ページにいけるよ",
    spot2: "home-ring-rows", advance: { type: "chip" },
  },
  {
    id: "home_practice_menu", where: "ホーム", screen: "home2", pose: "05B", phase: 4,
    text: "基礎練には、その曲の上達にあった練習が出るんだ。",
    spot2: "home-basics", advance: { type: "chip" },
  },
  {
    id: "home_retry", where: "ホーム", screen: "home2", pose: "03B", phase: 4,
    text: "練習したら、もう一回チャレンジ!\n曲カードをタップ",
    spot: "home-current-song", advance: { type: "tap" },
  },
  {
    id: "score_retry", where: "演奏画面", screen: "score2", pose: "03B", phase: 5,
    text: "曲にもどってきたよ。\nもう一回「録音して採点」!",
    spot: "score-record", advance: { type: "record" },
  },
  {
    // 吹き出し (採点できあがったよ！) と重なるため、この画面だけバーを最上部へ
    id: "result_retry", where: "採点結果", screen: "result95", pose: "06B", phase: 5,
    text: "いい演奏! これで「通して弾く」が3回め。\n下の「ホーム」タブへ",
    spot: "tab-home", barPos: "high", advance: { type: "tap" },
  },
  {
    // 画面内演出: リング2/3→満了 (実寸 r71.5/stroke15・1s)→3/3・✓・3/3回→
    // 紙吹雪+達成カード「きらきら星・達成」出現。「うけとる」で進む
    id: "ring_complete", where: "ホーム", screen: "ringComplete", pose: "06B", phase: 5,
    text: "「通して弾く」3回で、弾けるリングが完成!\nこの曲は「達成」だ",
    advance: { type: "card" }, // 達成カード (うけとる)
  },
  {
    id: "home_coin_prompt", where: "ホーム", screen: "home3", pose: "06B", phase: 5,
    text: "達成すると、マイランクに達成コインがたまるよ。\nマイランクカードをタップ!",
    spot: "home-rank-card", advance: { type: "tap" },
  },
  {
    // 演奏の軌跡シートは画面上部から表示 (Tetsuo指示 2026-08-29)。
    // コイン1枚めが coinPop で埋まるモーション。バーは下端
    id: "trace_coin", where: "演奏の軌跡", screen: "trace", pose: "06B", phase: 5,
    dim: false,
    text: "達成コインが1枚たまった!\n10枚あつめるとランクアップだ",
    advance: { type: "chip" },
  },
  {
    id: "home_master", where: "ホーム", screen: "home3", pose: "05B", phase: 6,
    text: "つぎの目標は「マスター」\n直近5回の平均が90点以上で\nこの曲は完全にきみのものだ",
    // 灰枠は「いま練習している曲」カード全体 (直近95点の演奏実績+マスターゲージを含む実カード境界)
    spot2: "home-focus-card", advance: { type: "chip" },
  },
  {
    // 最終ステップ (2026-08-29 Tetsuo追加)。つづけるでガイド終了→通常ホームに着地
    id: "home_next", where: "ホーム", screen: "home3", pose: "08C", phase: 6,
    text: "つぎは新しい曲にチャレンジ！ 10曲達成でランクアップだ。\nいっしょに、いっぱい弾けるようになろう！",
    spot2: "home-rank-card", advance: { type: "chip" },
  },
]

/** 進捗pipsの総数 (聴く/弾く/結果/トップ/直す/再挑戦/ごほうび) */
export const GUIDE_PHASES = 7

/** デモで使う固定値 (ランクに依存しない・全ユーザー共通・モックと同値) */
export const GUIDE_DEMO = {
  songTitle: "きらきら星",
  songStar: 1,
  demoDate: "2026/8/29",
  /** 1回目: 5回目の演奏として 80点 (音程83/リズム77) */
  firstPerfNo: 5,
  firstScore: 80,
  firstPitch: 83,
  firstTiming: 77,
  /** 再挑戦: 6回目 95点 (ぜんぶ緑)。これが「通して弾く」3回め */
  retryPerfNo: 6,
  retryScore: 95,
  /** 上達のようす (5回分)。表示条件は採点つき通し2回 (実装 TRAJECTORY_MIN_POINTS=2) */
  trajectory: [60, 65, 68, 74, 80],
  /** 前提: 学びレッスン✓・エチュード✓・通して弾く2/3回 (リング2/3) */
  ringBefore: { lessons: true, etude: true, cleanRuns: 2, cleanRunsRequired: 3 },
  /** 音程マップの赤セルと詳細 (案C転写) */
  redCell: { note: "シ", string: "A" },
  /** マイランク: 達成コイン 1/10。ゲージは★7をあと9曲相当 */
  coinTotal: 10,
  coinAfter: 1,
  basicsTitle: "音階",
} as const
