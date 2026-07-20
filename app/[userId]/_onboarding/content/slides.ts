// 純データのみ ("use client" 不要)

export type SlidePrimaryCta =
  | { type: "next" }
  | {
      type: "dual"
      // pathTemplate は /[userId] プレフィックスを含まない相対パス
      // 呼び出し側 (WelcomeSlides) で useParams().userId を runtime に付与する
      primary: { label: string; pathTemplate: string }
      secondary: { label: string; pathTemplate: string }
    }

export type SlideVisual =
  | { type: "hero"; emoji: string }
  // アルコちゃん(モーション付きイラスト)。pose はカテゴリ指定 (WelcomeSlides で POSES から解決)
  | { type: "arco"; pose: "greet" | "point" | "joy" }
  | {
      type: "options"
      left: { emoji: string; label: string }
      right: { emoji: string; label: string }
    }
  | {
      type: "flow"
      steps: { emoji: string; label: string }[]
    }
  | { type: "colorLegend" }

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
    visual: { type: "arco", pose: "greet" },
    headline: "はじめまして、アルコです！",
    subhead: "きみの音を、いっしょに見ていくよ。",
    body: "Arcoda は、弾いた音がそのまま譜面に色でうつるバイオリン練習アプリ。まずはかんたんに使い方を紹介するね。",
    cta: { type: "next" },
  },
  {
    id: 2,
    visual: {
      type: "options",
      left: { emoji: "🎼", label: "自分の楽譜" },
      right: { emoji: "🎯", label: "練習メニュー" },
    },
    headline: "好きな入り口ではじめよう",
    body: "持っている楽譜をアップロードしてもいいし、用意された練習メニューから選んでもOK。どちらからでも始められるよ。",
    cta: { type: "next" },
  },
  {
    id: 3,
    visual: {
      type: "flow",
      steps: [
        { emoji: "🎙️", label: "録音" },
        { emoji: "⚡", label: "自動分析" },
        { emoji: "🎨", label: "色で表示" },
      ],
    },
    headline: "やることは、録音ボタンを押すだけ",
    body: "弾き終わると自動で分析がはじまるよ。少し待つと、譜面に結果が色でうつるんだ。",
    cta: { type: "next" },
  },
  {
    id: 4,
    visual: { type: "colorLegend" },
    headline: "色で、ひと目で答え合わせ",
    body: "どの音が合っていて、どこを直せばいいか、色を見るだけでわかる。むずかしい数字はいらないよ。",
    cta: { type: "next" },
  },
  {
    id: 5,
    visual: { type: "arco", pose: "joy" },
    headline: "さあ、いっしょにはじめよう！",
    subhead: "最初の一歩を、いま。",
    body: "気になった方をタップしてね。いつでもこのガイドは見返せるよ。",
    cta: {
      type: "dual",
      primary:   { label: "🎼 楽譜をアップロード", pathTemplate: "/scores" },
      secondary: { label: "🎯 練習メニューを見る",  pathTemplate: "/practice" },
    },
  },
]
