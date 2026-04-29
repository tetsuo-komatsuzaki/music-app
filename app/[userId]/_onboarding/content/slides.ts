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

export type Slide = {
  id: number
  headline: string
  body: string
  visualHint: string
  cta: SlidePrimaryCta
}

export const SLIDES: Slide[] = [
  {
    id: 1,
    headline: "弾いた音が、譜面の上に返ってくる。",
    body: "Arcodaは、あなたの演奏を譜面の上で見えるようにするバイオリン練習アプリです。",
    visualHint: "白譜面の音符が緑・赤・オレンジに色付いて浮かび上がるアニメーション",
    cta: { type: "next" },
  },
  {
    id: 2,
    headline: "あなたの楽譜で、用意された練習で。",
    body: "自分の楽譜を持ち込んで練習することも、音階・アルペジオ・エチュードから選んで始めることもできます。",
    visualHint: "左に楽譜アイコン (「楽譜をアップロード」)、右に練習メニューアイコン (「練習メニューから選ぶ」) の並列",
    cta: { type: "next" },
  },
  {
    id: 3,
    headline: "録音ボタンを押すだけ。",
    body: "演奏を終えると、自動で分析がはじまります。少し待つと、結果が譜面に映ります。",
    visualHint: "録音ボタン → 分析中インジケータ → 譜面オーバーレイ の3コマアニメ",
    cta: { type: "next" },
  },
  {
    id: 4,
    headline: "譜面の上で、答え合わせ。",
    body: "🟢 緑：音程もタイミングもOK\n🔴 赤：音程がズレた\n🟠 オレンジ：タイミングがズレた\n⚪ 灰色：音が検出できなかった\n\n※ いつでも「使い方」メニューから見返せます。",
    visualHint: "実際の譜面サンプルに4色の音符が混在する小節を1〜2小節分",
    cta: { type: "next" },
  },
  {
    id: 5,
    headline: "練習が積み重なっていく。",
    body: "演奏履歴と弱点を覚えていくと、Arcodaが次の練習を提案します。",
    visualHint: "成長グラフのシルエット、または積み上げる音符のアニメーション",
    cta: {
      type: "dual",
      primary:   { label: "最初の楽譜をアップロード", pathTemplate: "/scores" },
      secondary: { label: "練習メニューを見る",         pathTemplate: "/practice" },
    },
  },
]
