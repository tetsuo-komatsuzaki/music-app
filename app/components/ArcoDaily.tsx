"use client"

import { useEffect, useState } from "react"
import { ArcoChan, POSES } from "./ArcoChan"
import hb from "../[userId]/homeBlocks.module.css"

/* 30ポーズ それぞれに対応する「今日の一言」。POSES の id と対応。 */
const COMMENTS: Record<string, string> = {
  // 指差しガイド
  "01A": "次はここ！いっしょに練習しよう🎵",
  "01B": "こっちの曲もおすすめだよ〜",
  "01C": "目標はあの高いところ。ねらっていこう！",
  // 喜び
  "02A": "やったー！その調子だね✨",
  "02B": "ナイス！すごく良くなってるよ💪",
  "02C": "うれしい〜！今の音、すてきだった",
  // 励まし
  "03A": "ファイト！あと少しだよ🔥",
  "03B": "いけるいける、その勢い！",
  "03C": "ここが踏ん張りどころ、応援してる！",
  // しょんぼり
  "04A": "うまくいかない日もあるよ。ゆっくりね",
  "04B": "今日は無理しないで大丈夫だからね",
  "04C": "ひと息ついて、また明日いっしょに🍵",
  // 説明・レッスン
  "05A": "今日は弓の使い方をおさらいしよ",
  "05B": "ここがポイント！ゆっくり弾いてみて",
  "05C": "楽譜のこの音、いっしょに見てみよ",
  // 称賛
  "06A": "上手になったね、ぱちぱち👏",
  "06B": "ブラボー！今日は最高だったよ🎉",
  "06C": "あっぱれ！自信もっていいよ",
  // 考える・分析
  "07A": "うーん、どこを練習しようかな",
  "07B": "あれ？ここ、もう一回いってみる？",
  "07C": "この一音を、じっくり磨いてみよ",
  // 見守り・リズム
  "08A": "いい調子〜、そのテンポでね",
  "08B": "きれいな音…うっとりしちゃう",
  "08C": "ノってきたね！リズムばっちり🎶",
  // 挨拶・登場
  "09A": "今日もよろしくね、ぺこり",
  "09B": "やっほー！練習はじめよっか",
  "09C": "こんにちは！来てくれてうれしいな",
  // 休憩・おやすみ
  "10A": "ひと休みも大事だよ☕",
  "10B": "今日はよくがんばったね、おやすみ",
  "10C": "音楽って楽しいね、ぎゅっ🎵",
}

// 端末ローカルの日付で 1日ごとに変わるインデックス
function todayIndex() {
  const d = new Date()
  const dayNum = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000)
  return ((dayNum % POSES.length) + POSES.length) % POSES.length
}

export default function ArcoDaily() {
  // SSR/ハイドレーション不一致を避けるため初期は 0、マウント後に当日ぶんへ
  const [i, setI] = useState(0)
  useEffect(() => setI(todayIndex()), [])

  const pose = POSES[i]
  const comment = COMMENTS[pose.id] ?? "今日もいっしょに練習しよう🎵"

  return (
    <div
      className={hb.arco}
      data-onboarding="home.arcoCard"
      role="button"
      tabIndex={0}
      aria-label="アルコちゃんの今日の一言（タップで次へ）"
      onClick={() => setI((v) => (v + 1) % POSES.length)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setI((v) => (v + 1) % POSES.length) } }}
      style={{ cursor: "pointer" }}
    >
      <div className={hb.ill}><ArcoChan pose={pose} /></div>
      <div className={hb.bubble}>{comment}</div>
    </div>
  )
}
