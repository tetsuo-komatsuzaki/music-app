// ============================================================
// アルコのクエスト定義 (2026-08-29 実装・2周目以降のガイド後継)
// 概念 (Tetsuo確定): 2周目からはクエスト。自分のペースで、達成ごとに
// アルコちゃんオリジナルカードを1枚ゲット。シェアして自慢できる。
//
// ・リストは モック確定6件+追加候補3件 (2026-08-24 提示・採用推奨) の9件。
//   最終確定は Tetsuo 承認待ち — 差し替えはこのファイルだけで完結する。
// ・doneEvent は本番接続時に発火させる実装イベント名 (進行はDB保存・
//   localStorage 禁止。チュートリアルの進行保存と同じテーブルに載せる想定)
// ============================================================

import type { GuidePoseId } from "./guideFlow"

export type QuestDef = {
  id: string
  title: string
  sub: string
  /** ごほうびカードの番号 (CARD No.)。No.001 は「きらきら星・達成」で使用済み */
  cardNo: number
  /** カードの絵柄 (ArcoChan POSES id) */
  pose: GuidePoseId
  /** 本番接続時に達成を発火させるイベントの正 (実装箇所のメモ) */
  doneEvent: string
}

export const QUESTS: QuestDef[] = [
  { id: "first_loop", title: "はじめての1周", sub: "成長サイクルを回した", cardNo: 1, pose: "06B",
    doneEvent: "チュートリアル完了 (ガイド進行の保存と同時)" },
  { id: "annotate", title: "譜面に書き込みしてみる", sub: "気をつける場所に印を", cardNo: 2, pose: "05C",
    doneEvent: "譜面注釈の初回保存 (scoreAnnotation 作成)" },
  { id: "lesson", title: "学びのレッスンを1つ", sub: "新しい技術のコツ", cardNo: 3, pose: "08B",
    doneEvent: "学びレッスンの初回クリア (recordLessonPlay)" },
  { id: "karte", title: "カルテで成長を見る", sub: "2周ぶん貯まったら", cardNo: 4, pose: "07B",
    doneEvent: "カルテ (progress) の初回閲覧" },
  { id: "loop_practice", title: "ループ練習を使う", sub: "弱点の小節だけくり返す", cardNo: 5, pose: "05B",
    doneEvent: "ループ区間を指定して録音 (rangeFromNote 付き演奏)" },
  { id: "week_streak", title: "7日つづけて練習", sub: "毎日15分の力", cardNo: 6, pose: "03B",
    doneEvent: "streak が 7 に到達" },
  // ── 追加候補 (2026-08-24 提示・採用推奨。最終確定待ち) ──
  { id: "landscape_rec", title: "横画面で録音する", sub: "譜面が大きく見やすい", cardNo: 7, pose: "05C",
    doneEvent: "帯モード (横画面) での録音完了" },
  { id: "listen_back", title: "演奏を聴き返す", sub: "自分の音を客観的に", cardNo: 8, pose: "08B",
    doneEvent: "演奏履歴の再生 (自分の録音の playback)" },
  { id: "month_streak", title: "30日つづけて練習", sub: "習慣がいちばんの才能", cardNo: 9, pose: "08C",
    doneEvent: "streak が 30 に到達" },
]

/** ユーザーのクエスト進行 (本番はDBから。デモは固定値) */
export type QuestProgress = Record<string, { doneAt: string } | undefined>
