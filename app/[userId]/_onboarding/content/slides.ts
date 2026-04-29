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
    visual: { type: "hero", emoji: "🎻" },
    headline: "ようこそ、Arcoda へ",
    subhead: "弾いた音が、譜面の上で見える。",
    body: "バイオリン練習が、もっと楽しく、もっと見える。",
    cta: { type: "next" },
  },
  {
    id: 2,
    visual: {
      type: "options",
      left: { emoji: "🎼", label: "自分の楽譜" },
      right: { emoji: "🎯", label: "練習メニュー" },
    },
    headline: "好きな方法で、はじめよう",
    body: "持っている楽譜をアップロードしても、用意された練習から選んでも、どちらでも始められます。",
    cta: { type: "next" },
  },
  {
    id: 3,
    visual: {
      type: "flow",
      steps: [
        { emoji: "🎙️", label: "録音" },
        { emoji: "⚡", label: "自動分析" },
        { emoji: "🎼", label: "結果表示" },
      ],
    },
    headline: "録音ボタンを押すだけ",
    body: "演奏を終えると、自動で分析がはじまります。少し待つと、結果が譜面に映ります。",
    cta: { type: "next" },
  },
  {
    id: 4,
    visual: { type: "colorLegend" },
    headline: "色で答え合わせ",
    body: "譜面に色がつくから、どこを直せばいいか、ひと目でわかります。",
    cta: { type: "next" },
  },
  {
    id: 5,
    visual: { type: "hero", emoji: "🚀" },
    headline: "さあ、はじめよう",
    subhead: "最初の一歩を、いま。",
    cta: {
      type: "dual",
      primary:   { label: "楽譜をアップロード", pathTemplate: "/scores" },
      secondary: { label: "練習メニューを見る",  pathTemplate: "/practice" },
    },
  },
]
