/**
 * ゲートのシートの文言 (2026-09-06)。場所ごとに 1 行目と「得られること」だけ差し替える。
 * サーバー・クライアント両方から import するため、"use client" を付けない素のモジュールに置く
 * (クライアント部品の中に置くと、サーバー側から関数を呼べずに落ちる)。
 */
export type GateItem = { title: string; detail: string }
export type GateText = { title: string; items: GateItem[] }

/** 契約なし・契約切れの人の入口に重ねるゲート (要件整理 v2.7 §2・§8-8)。planStatus で「再開する」と「はじめる」を分ける */
export function subscriptionGate(planStatus: string | null | undefined): { text: GateText; label: string } {
  const ended = planStatus === "expired" || planStatus === "canceled"
  return { text: ended ? GATE_TEXT.resume : GATE_TEXT.subscribe, label: ended ? "再開する" : "はじめる" }
}

export const GATE_TEXT = {
  song: (title: string): GateText => ({
    title: `${title}を練習するには、登録かログインが必要です`,
    items: [
      { title: "譜面と練習前シート", detail: "難易度とパートを選べる" },
      { title: "録音して採点", detail: "弾くたびに音程とリズムが残る" },
      { title: "成長カルテ", detail: "弾くたびに変化が残る" },
    ],
  }),
  // ▼ 1 回ためし (2026-09-12 要件整理 v2.7 §3): 端末の 1 回が未使用のとき
  songTry: (title: string): GateText => ({
    title: `${title}を、登録なしで 1 回だけ採点してみられます`,
    items: [
      { title: "録音して採点", detail: "音程とリズムを 1 音ずつ" },
      { title: "この 1 回は登録なし", detail: "弾いてから決められる" },
      { title: "続けるには登録", detail: "はじめての方は最初の 2 週間は無料、その後 月 1,280 円" },
    ],
  }),
  // ▼ 1 回ためし: 使用済み
  songUsed: (title: string, lastScore: number | null): GateText => ({
    title: "続けるには、はじめる手続きが必要です",
    items: [
      { title: lastScore != null ? `さっきの ${lastScore} 点` : `${title}の採点`, detail: "はじめると、あなたの記録として残る" },
      { title: "毎日の採点と基礎練", detail: "はじめての方は最初の 2 週間は無料、その後 月 1,280 円" },
      { title: "成長カルテ", detail: "弾くたびに変化が残る" },
    ],
  }),
  // ▼ 一度も契約していないアカウント (REQUIRE_SUBSCRIPTION=true のとき)。主ボタンは「はじめる」→ /start (CR-1-10)
  subscribe: {
    title: "アルコプラスをはじめると、採点と基礎練が使えます",
    items: [
      { title: "録音して採点", detail: "音程とリズムを 1 音ずつ" },
      { title: "毎日の基礎練", detail: "はじめての方は最初の 2 週間は無料、その後 月 1,280 円" },
      { title: "成長カルテ", detail: "弾くたびに変化が残る" },
    ],
  } as GateText,
  // ▼ 契約切れ (ゲストと同じ範囲・§8-8)。主ボタンは「再開する」→ /start
  resume: {
    title: "アルコプラスが終了しています",
    items: [
      { title: "採点と基礎練が止まっています", detail: "記録は残っています" },
      { title: "再開する", detail: "購入シートだけで、すぐ戻れる" },
    ],
  } as GateText,
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
      { title: "からだの癖", detail: "指板のどこがずれたか残る" },
    ],
  } as GateText,
  // 先生機能は未公開 (features.ts TEACHER_FEATURE_ENABLED)。
  // ルート側で塞いでいるので現在は未使用だが、公開時にそのまま使えるよう残す。
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
      { title: "録音して採点", detail: "弾くたびに音程とリズムが残る" },
      { title: "成長カルテ", detail: "弾くたびに変化が残る" },
    ],
  } as GateText,
}
