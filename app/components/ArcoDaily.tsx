"use client"

import { useEffect, useState } from "react"
import { ArcoChan, POSES } from "./ArcoChan"
import ds from "./ds.module.css"

/* 30ポーズ それぞれに対応する「今日の一言」。POSES の id と対応。 */
const COMMENTS: Record<string, string> = {
  // 指差しガイド
 "01A": "次はここ！いっしょに練習しよう",
  "01B": "こっちの曲もおすすめだよ〜",
  "01C": "目標はあの高いところ。ねらっていこう！",
  // 喜び
 "02A": "やったー！その調子だね",
 "02B": "ナイス！すごく良くなってるよ",
  "02C": "うれしい〜！今の音、すてきだった",
  // 励まし
 "03A": "ファイト！あと少しだよ",
  "03B": "いけるいける、その勢い！",
  "03C": "ここが踏ん張りどころ、応援してる！",
  // しょんぼり
  "04A": "うまくいかない日もあるよ。ゆっくりね",
  "04B": "今日は無理しないで大丈夫だからね",
 "04C": "ひと息ついて、また明日いっしょに",
  // 説明・レッスン
  "05A": "今日は弓の使い方をおさらいしよ",
  "05B": "ここがポイント！ゆっくり弾いてみて",
  "05C": "楽譜のこの音、いっしょに見てみよ",
  // 称賛
 "06A": "上手になったね、ぱちぱち",
 "06B": "ブラボー！今日は最高だったよ",
  "06C": "あっぱれ！自信もっていいよ",
  // 考える・分析
  "07A": "うーん、どこを練習しようかな",
  "07B": "あれ？ここ、もう一回いってみる？",
  "07C": "この一音を、じっくり磨いてみよ",
  // 見守り・リズム
  "08A": "いい調子〜、そのテンポでね",
  "08B": "きれいな音…うっとりしちゃう",
 "08C": "ノってきたね！リズムばっちり",
  // 挨拶・登場
  "09A": "今日もよろしくね、ぺこり",
  "09B": "やっほー！練習はじめよっか",
  "09C": "こんにちは！来てくれてうれしいな",
  // 休憩・おやすみ
 "10A": "ひと休みも大事だよ",
  "10B": "今日はよくがんばったね、おやすみ",
 "10C": "音楽って楽しいね、ぎゅっ",
}

// ログイン(セッション)ごとに 1 回だけランダムで選び、その間は固定する。
// タップしても変わらない。次にログイン(新しいセッション)すると別の一言になる。
const SESSION_KEY = "arcoda.arcoDaily.idx"
function pickSessionIndex(): number {
  if (typeof window === "undefined") return 0
  try {
    const saved = window.sessionStorage.getItem(SESSION_KEY)
    if (saved !== null) {
      const n = parseInt(saved, 10)
      if (!Number.isNaN(n) && n >= 0 && n < POSES.length) return n
    }
    const n = Math.floor(Math.random() * POSES.length)
    window.sessionStorage.setItem(SESSION_KEY, String(n))
    return n
  } catch {
    return 0
  }
}

export default function ArcoDaily() {
  // SSR/ハイドレーション不一致を避けるため初期は 0、マウント後にこのセッションぶんへ
  const [i, setI] = useState(0)
  useEffect(() => setI(pickSessionIndex()), [])

  const pose = POSES[i]
 const comment = COMMENTS[pose.id] ?? "今日もいっしょに練習しよう"

  const next = () => setI((v) => (v + 1) % POSES.length)
  return (
    // モック 追01 (ARCO_CARD) の写経: カード + ラベル + アルコ92px + 吹き出し + タップで次のポーズ
    <div
      className={`${ds.card} pressable`}
      data-onboarding="home.arcoCard"
      aria-label="アルコちゃんの一言"
      onClick={next}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); next() } }}
      style={{ cursor: "pointer" }}
    >
      <div className={ds.lab}>アルコちゃんの一言</div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 10 }}>
        <div style={{ width: 92, height: 92, borderRadius: 20, flex: "none", overflow: "hidden" }}>
          <ArcoChan pose={pose} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              position: "relative", background: "rgba(150,175,225,.10)",
              border: "1px solid rgba(150,175,225,.14)", borderRadius: 14, padding: "12px 13px",
            }}
          >
            <div style={{ fontSize: 13.5, fontWeight: 800, lineHeight: 1.7, color: "var(--text-ink)" }}>{comment}</div>
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 7 }}>タップで つぎのポーズ</div>
        </div>
      </div>
    </div>
  )
}
