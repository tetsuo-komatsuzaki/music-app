// ============================================================
// 「アルコと最初の1周」フロー定義 (2026-08-29 設計確定)
// 見た目と流れの正 = docs/mocks/first-loop-guide/ (Tetsuo承認モック)。
// 実装完了時にモック画面との誤差ゼロ突き合わせを行う約束。
//
// 確定ルール:
//  ・「次へ」ボタンは存在しない。遷移=実物タップのみ
//    (確認はガイドカード自身のボタン、押す物がない場面は自動送り)
//  ・金の光=次に押す場所 / 灰枠=いま見る場所 / 現在地チップ / スキップ常設
//  ・対象要素は実画面側に data-guide="<spot名>" を付けて指す
//  ・データはすべて本物 (実際に録音させ、実結果を見せる。デモ表示→戻す処理は無い)
//  ・進行と完了はサーバー(DB)に保存。localStorage 禁止 (端末が変わると再表示される
//    WelcomeSlides の欠陥を繰り返さない)。完了/スキップ後は二度と表示しない。
//    途中離脱は続きから再開 (再表示にはあたらない)
// ============================================================

/** アルコのポーズ (app/components/ArcoChan の POSES id) */
export type GuidePoseId = "05B" | "05C" | "06B" | "08B" | "03B" | "07B" | "08C"

export type GuideStep = {
  id: string
  /** このステップが属する画面 (現在地チップの表示名) */
  where: string
  /** どのルートで出るか (前方一致。ホーム="home" は /{userId} 直下) */
  route: "home" | "score" | "practice"
  pose: GuidePoseId
  /** 道しるべバーの文言 (改行は \n) */
  text: string
  /** 進捗pips: 0〜6 (聴く/弾く/結果/トップ/直す/再挑戦/ごほうび) */
  phase: number
  /** 金の光を当てる実要素: [data-guide="..."] の値。無ければ光なし */
  spot?: string
  /** 灰枠 (いま見る場所) を当てる実要素 */
  spot2?: string
  /** 進み方 */
  advance:
    | { type: "tap" }              // spot の実要素タップで進む
    | { type: "card" }             // ガイドカード自身のボタン (わかった 等)
    | { type: "auto"; ms: number } // 自動送り
    | { type: "event"; name: GuideEventName } // アプリ内イベントで進む
}

/** アプリ側から通知するイベント (録音完了・採点表示など) */
export type GuideEventName =
  | "exemplar_finished"   // お手本の再生が終わった
  | "recording_scored"    // 録音→採点結果が表示された
  | "basics_cleared"      // 基礎練をクリアした

// 1周目のフロー。モックの FLOW と1対1 (docs/mocks/first-loop-guide/build_guide_real.py)
export const FIRST_LOOP: GuideStep[] = [
  {
    // 初期ユーザーのホームは「いま練習している曲」ではなく 🌟さいしょの1曲
    // (スターターカード) が出る (録音0の間。弾き始めると世代交代)。ガイドはそれを指す。
    id: "home_pick_song", where: "ホーム", route: "home", pose: "05B", phase: 0,
    text: "まずは1回、弾いてみよう。\nさいしょの1曲をタップ!",
    spot: "home-starter", advance: { type: "tap" },
  },
  {
    id: "score_listen", where: "演奏画面", route: "score", pose: "08B", phase: 0,
    text: "曲のページに来たよ。\nまずはお手本を聴いてみよう",
    spot: "score-exemplar", advance: { type: "event", name: "exemplar_finished" },
  },
  {
    id: "score_manner", where: "演奏画面", route: "score", pose: "05C", phase: 1,
    text: "はじめての録音。\n3つだけ覚えてね",
    advance: { type: "card" }, // 作法カード (わかった) はガイドカード側
  },
  {
    id: "score_record", where: "演奏画面", route: "score", pose: "05C", phase: 1,
    text: "「録音して採点」を押して、\nいまの音をアルコに聴かせて",
    spot: "score-record", advance: { type: "event", name: "recording_scored" },
  },
  {
    id: "result_colors", where: "採点結果", route: "score", pose: "08B", phase: 2,
    text: "色がのびしろの印だよ。\nくわしくは「ふりかえり」タブをタップ",
    spot: "score-tab-review", spot2: "score-color-legend", advance: { type: "tap" },
  },
  {
    id: "review_points", where: "ふりかえり", route: "score", pose: "08B", phase: 2,
    text: "結果はまずここに載る。数字がのびしろ。\n見たら下の「ホーム」タブへ",
    spot: "tab-home", spot2: "review-growth-points", advance: { type: "tap" },
  },
  {
    id: "home_reflected", where: "ホーム", route: "home", pose: "05B", phase: 3,
    text: "ホームにも結果が載ったよ。\n弱点は基礎練へ。01をタップ",
    spot: "home-basics", spot2: "home-current-song" /* 1周目の録音後は世代交代済み */, advance: { type: "event", name: "basics_cleared" },
  },
  {
    id: "score_retry", where: "演奏画面", route: "score", pose: "03B", phase: 5,
    text: "曲にもどってきたよ。直したところで、\nもう一回「録音して採点」!",
    spot: "score-record", advance: { type: "event", name: "recording_scored" },
  },
  {
    id: "result_improved", where: "採点結果", route: "score", pose: "06B", phase: 5,
    text: "色が変わったところが、きみの上達。\nこれが上達の1周だよ",
    advance: { type: "auto", ms: 3200 },
  },
  {
    id: "reward_card", where: "ごほうび", route: "score", pose: "08C", phase: 6,
    text: "1周のごほうび!\n「うけとる」を押してね",
    advance: { type: "card" }, // ごほうびカード (うけとる) はガイドカード側
  },
]

/** 進捗pipsの総数 (聴く/弾く/結果/トップ/直す/再挑戦/ごほうび) */
export const GUIDE_PHASES = 7
