// 純データのみ ("use client" 不要)
// 2026-07-21 刷新: 「上達の旅」の感情アークで再構成。
//   憧れ → 譜面に色で評価 → 点数&おすすめ → 学びのレッスン → ランク推移 → 積み上がる → 次の1曲

export type SlidePrimaryCta =
  | { type: "next" }
  // 最終スライド: 押すとホームへ着地し、そこからコーチガイドが始まる (2026-07-25)。
  // 「スライドを見終わる → ホーム → コーチガイド」の順にするため。
  // (旧 dual CTA の「練習をはじめる/楽譜をアップロード」はホームの
  //  コーチガイド 1枚目「弾く曲を選ぼう」と重複するので統合した)
  | { type: "start"; label: string }

export type SlideVisual =
  // アルコちゃん(モーション付きイラスト)。pose は POSES のカテゴリで解決
  | { type: "arco"; pose: "greet" | "point" | "joy" }
  // 憧れの曲カード (いつか弾きたい)
  | { type: "dreamSong"; title: string; composer: string }
  // 譜面の上で音符が色評価される様子
  | { type: "scoreEval" }
  // 分析後の結果画面 (点数 + ランク + おすすめ)
  | { type: "resultScreen" }
  // 学びのレッスン
  | { type: "lesson" }
  // マイスコアランクの推移 (右肩上がり)
  | { type: "rankTrend" }
  // マスターした曲が積み上がる
  | { type: "mastered" }

export type Slide = {
  id: number
  visual: SlideVisual
  headline: string
  subhead?: string
  body?: string
  cta: SlidePrimaryCta
}

export const SLIDES: Slide[] = [
  {
    id: 1,
    visual: { type: "dreamSong", title: "愛の挨拶", composer: "エルガー" },
    headline: "あの憧れの曲を、いつか。",
    subhead: "はじめまして、アルコだよ。",
    body: "「弾いてみたい」が、上達のはじまり。",
    cta: { type: "next" },
  },
  {
    id: 2,
    visual: { type: "scoreEval" },
    headline: "弾いた音が、譜面に色でうつる",
    subhead: "直す場所が、ひと目で。",
    body: "緑・赤・オレンジで色分け。数字を読まなくてもわかる。",
    cta: { type: "next" },
  },
  {
    id: 3,
    visual: { type: "resultScreen" },
    headline: "点数も、つぎの練習も",
    subhead: "アルコが次の一手まで。",
    body: "点数とランク、きみに合ったおすすめ練習まで。",
    cta: { type: "next" },
  },
  {
    id: 4,
    visual: { type: "lesson" },
    headline: "むずかしい技術は、学びのレッスンで",
    body: "新しい技術は、レッスンでコツをつかもう。",
    cta: { type: "next" },
  },
  {
    id: 5,
    visual: { type: "rankTrend" },
    headline: "ランクは、右肩上がり。",
    subhead: "続けるほど、上がる。",
    body: "マスターするたびランクUP。成長がひと目で。",
    cta: { type: "next" },
  },
  {
    id: 6,
    visual: { type: "mastered" },
    headline: "できた！が、積み上がっていく",
    subhead: "ひとつ、またひとつ。",
    body: "努力が、目に見える自信に。",
    cta: { type: "next" },
  },
  {
    id: 7,
    visual: { type: "arco", pose: "greet" },
    headline: "さあ、はじめの1曲を。",
    subhead: "あの曲も、きっと弾ける。",
    body: "用意された曲でも、自分の楽譜でもOK。",
    cta: {
      type: "start",
      label: "さっそく始めよう",
    },
  },
]
