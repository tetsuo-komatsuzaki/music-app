// ============================================================
// 「アルコと最初の1周」フロー定義 (2026-08-29 設計確定・デモ方式)
// 見た目と流れの正 = docs/mocks/first-loop-guide/ (Tetsuo承認モック)。
// 実装完了時にモック画面との誤差ゼロ突き合わせを行う約束。
//
// 【方式確定 (Tetsuo 2026-08-29)】チュートリアルはデモ再現でやる。
//   ・ユーザーのランクによって表示される曲が異なるため、デモ曲 (きらきら星)
//     に固定して全員に同じ体験を見せる
//   ・実演奏を待つと時間がかかるため「弾いたてい」で進める
//     (録音ボタン→3・2・1→録音中1.5秒→デモの採点72点。再挑戦は85点)
//   ・デモはDBに演奏データを一切書かない (副作用ゼロ)。終了後は通常の
//     ホームに着地するだけで「戻す」処理は存在しない。
//     本物なのは進行の保存とごほうびカードの付与だけ
//
// 確定ルール:
//  ・「次へ」ボタンは存在しない。遷移=デモ画面の実物タップのみ
//    (確認はガイドカード自身のボタン、押す物がない場面は自動送り)
//  ・金の光=次に押す場所 / 灰枠=いま見る場所 / 現在地チップ / スキップ常設
//  ・デモ画面は実コンポーネント+デモデータで組む。対象要素は data-guide="<spot名>"
//  ・進行と完了はサーバー(DB)に保存。localStorage 禁止 (端末が変わると再表示される
//    WelcomeSlides の欠陥を繰り返さない)。完了/スキップ後は二度と表示しない。
//    途中離脱は続きから再開 (再表示にはあたらない)
// ============================================================

/** アルコのポーズ (app/components/ArcoChan の POSES id) */
export type GuidePoseId = "05B" | "05C" | "06B" | "08B" | "03B" | "07B" | "08C"

/** デモ画面の種類 (チュートリアル専用の再現画面。実画面には遷移しない) */
export type GuideScreen =
  | "home"        // デモホーム (🌟さいしょの1曲=きらきら星)
  | "score"       // デモ演奏画面 (譜面+お手本+録音して採点)
  | "recording"   // カウントダウン→録音中 (弾いたてい)
  | "result72"    // デモ採点結果 (72点・色つき)
  | "review"      // デモふりかえり (伸びしろポイント)
  | "home2"       // デモホーム (直近72点反映後)
  | "clearflash"  // 基礎練クリアの祝い
  | "result85"    // デモ採点結果 (85点・緑)
  | "card"        // ごほうびカード

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
  /** 進み方 */
  advance:
    | { type: "tap" }               // spot のデモ要素タップで進む
    | { type: "card" }              // ガイドカード自身のボタン (わかった 等)
    | { type: "auto"; ms: number }  // 自動送り
    | { type: "record" }            // 弾いたてい (3・2・1→横画面の帯モード録音デモ3秒→次へ)
}

// 1周目のフロー。モックの FLOW と1対1 (docs/mocks/first-loop-guide/build_guide_real.py)
export const FIRST_LOOP: GuideStep[] = [
  {
    id: "home_pick_song", where: "ホーム", screen: "home", pose: "05B", phase: 0,
    text: "まずは1回、弾いてみよう。\nさいしょの1曲をタップ!",
    spot: "home-starter", advance: { type: "tap" },
  },
  {
    // お手本は必須にしない (Tetsuo確定 2026-08-29)。灰枠で「聴けるよ」と紹介する
    // だけで、押せば鳴るが押さなくても自動で先へ進む
    id: "score_arrival", where: "演奏画面", screen: "score", pose: "08B", phase: 0,
    text: "曲のページに来たよ。\n▶でお手本も聴けるよ",
    spot2: "score-exemplar", advance: { type: "auto", ms: 3200 },
  },
  {
    id: "score_manner", where: "演奏画面", screen: "score", pose: "05C", phase: 1,
    text: "はじめての録音。\n3つだけ覚えてね",
    advance: { type: "card" }, // 作法カード (わかった)
  },
  {
    id: "score_record", where: "演奏画面", screen: "score", pose: "05C", phase: 1,
    text: "「録音して採点」を押して、\nいまの音をアルコに聴かせて",
    spot: "score-record", advance: { type: "record" },
  },
  {
    id: "result_colors", where: "採点結果", screen: "result72", pose: "08B", phase: 2,
    text: "色がのびしろの印だよ。\nくわしくは「ふりかえり」タブをタップ",
    spot: "score-tab-review", spot2: "score-color-legend", advance: { type: "tap" },
  },
  {
    id: "review_points", where: "ふりかえり", screen: "review", pose: "08B", phase: 2,
    text: "結果はまずここに載る。数字がのびしろ。\n見たら下の「ホーム」タブへ",
    spot: "tab-home", spot2: "review-growth-points", advance: { type: "tap" },
  },
  {
    id: "home_reflected", where: "ホーム", screen: "home2", pose: "05B", phase: 3,
    text: "ホームにも直近72点が載ったよ。\n弱点は基礎練へ。01をタップ",
    spot: "home-basics", spot2: "home-current-song", advance: { type: "tap" },
  },
  {
    id: "basics_clear", where: "基礎練", screen: "clearflash", pose: "06B", phase: 4,
    text: "",
    advance: { type: "auto", ms: 1700 }, // クリアの祝い (バー非表示)
  },
  {
    id: "score_retry", where: "演奏画面", screen: "score", pose: "03B", phase: 5,
    text: "曲にもどってきたよ。直したところで、\nもう一回「録音して採点」!",
    spot: "score-record", advance: { type: "record" },
  },
  {
    id: "result_improved", where: "採点結果", screen: "result85", pose: "06B", phase: 5,
    text: "赤が緑に変わった! 72点→85点。\nこれが上達の1周だよ",
    advance: { type: "auto", ms: 3200 },
  },
  {
    id: "reward_card", where: "ごほうび", screen: "card", pose: "08C", phase: 6,
    text: "1周のごほうび!\n「うけとる」を押してね",
    advance: { type: "card" }, // ごほうびカード (うけとる)
  },
]

/** 進捗pipsの総数 (聴く/弾く/結果/トップ/直す/再挑戦/ごほうび) */
export const GUIDE_PHASES = 7

/** デモで使う固定値 (ランクに依存しない・全ユーザー共通) */
export const GUIDE_DEMO = {
  songTitle: "きらきら星",
  songStar: 1,
  firstScore: 72,
  secondScore: 85,
  basicsTitle: "音階",
} as const
