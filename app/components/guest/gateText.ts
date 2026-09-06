/**
 * ゲートのシートの文言 (2026-09-06)。場所ごとに 1 行目と「得られること」だけ差し替える。
 * サーバー・クライアント両方から import するため、"use client" を付けない素のモジュールに置く
 * (クライアント部品の中に置くと、サーバー側から関数を呼べずに落ちる)。
 */
export type GateItem = { title: string; detail: string }
export type GateText = { title: string; items: GateItem[] }

export const GATE_TEXT = {
  song: (title: string): GateText => ({
    title: `${title}を練習するには、登録かログインが必要です`,
    items: [
      { title: "譜面と練習前シート", detail: "難易度とパートを選べる" },
      { title: "録音して採点", detail: "週 7 回まで無料" },
      { title: "成長カルテ", detail: "弾くたびに変化が残る" },
    ],
  }),
  item: (title: string): GateText => ({
    title: `${title}を練習するには、登録かログインが必要です`,
    items: [
      { title: "調 ・ 奏法 ・ パート", detail: "練習前シートで選べる" },
      { title: "毎日の基礎練", detail: "苦手に合わせて4枚" },
      { title: "成長カルテ", detail: "弾くたびに変化が残る" },
    ],
  }),
  lesson: {
    title: "この動画を見るには、登録かログインが必要です",
    items: [
      { title: "23 本の短い動画", detail: "音のしくみを順番に" },
      { title: "見たら申告してクリア", detail: "カルテの わざ に灯る" },
    ],
  } as GateText,
  karte: {
    title: "成長カルテは、登録すると自分の演奏から育ちます",
    items: [
      { title: "成長カーブ", detail: "弾くたびに 1 点ずつ増える折れ線" },
      { title: "わざの習得状況", detail: "認定曲のマスターで灯る" },
      { title: "からだの癖", detail: "先生の目で直す" },
    ],
  } as GateText,
  teacher: {
    title: "先生とつながると、宿題と添削が届きます",
    items: [
      { title: "宿題", detail: "目標つきで、ホームに届く" },
      { title: "添削", detail: "譜面の上に書き込みが返る" },
      { title: "カルテの共有", detail: "先生は生徒と同じカルテを見る" },
    ],
  } as GateText,
  upload: {
    title: "楽譜を取り込むには、登録が必要です",
    items: [{ title: "自分の曲も採点できる", detail: "取り込んだ曲がライブラリに並ぶ" }],
  } as GateText,
  contact: {
    title: "送信には登録かログインが必要です",
    items: [{ title: "返信をアプリ内で受け取れる", detail: "やりとりが残る" }],
  } as GateText,
  generic: {
    title: "この画面を開くには、登録かログインが必要です",
    items: [
      { title: "録音して採点", detail: "週 7 回まで無料" },
      { title: "成長カルテ", detail: "弾くたびに変化が残る" },
    ],
  } as GateText,
}
