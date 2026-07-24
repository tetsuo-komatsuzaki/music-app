// 純データのみ ("use client" 不要)
// 2026-07-21 刷新: 「上達の旅」の感情アークで再構成。
//   憧れ → 譜面に色で評価 → 点数&おすすめ → 学びのレッスン → ランク推移 → 積み上がる → 次の1曲

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
    body: "「弾いてみたい」その気持ちが、上達のはじまり。いっしょに近づいていこう。",
    cta: { type: "next" },
  },
  {
    id: 2,
    visual: { type: "scoreEval" },
    headline: "弾いた音が、譜面に色でうつる",
    subhead: "どこが良くて、どこを直すか、ひと目で。",
    body: "音符ひとつひとつを緑・赤・オレンジ・グレーで色分け。数字を読まなくても、直す場所がわかるよ。",
    cta: { type: "next" },
  },
  {
    id: 3,
    visual: { type: "resultScreen" },
    headline: "点数と、つぎの練習も教えてくれる",
    subhead: "アルコが見て、次の一手まで。",
    body: "総合点とランク、そしてあなたの学びポイントに合ったおすすめ練習を、アルコが示してくれるよ。",
    cta: { type: "next" },
  },
  {
    id: 4,
    visual: { type: "lesson" },
    headline: "むずかしい技術は、学びのレッスンで",
    body: "新しい技術は「学びのレッスン」でコツをつかもう。むずかしい曲も、きっと弾けるようになる。",
    cta: { type: "next" },
  },
  {
    id: 5,
    visual: { type: "rankTrend" },
    headline: "ランクは、右肩上がり。",
    subhead: "続けるほど、着実に上がっていく。",
    body: "曲をマスターするたびにランクUP。推移で見れば、成長がひと目でわかる。最高ランクを目指そう！",
    cta: { type: "next" },
  },
  {
    id: 6,
    visual: { type: "mastered" },
    headline: "できた！が、積み上がっていく",
    subhead: "ひとつ、またひとつ。",
    body: "マスターした曲が増えていく。あなたの努力が、目に見える自信になるよ。",
    cta: { type: "next" },
  },
  {
    id: 7,
    visual: { type: "arco", pose: "greet" },
    headline: "さあ、はじめの1曲を。",
    subhead: "あの憧れの曲も、きっと弾ける。",
    body: "用意された曲でも、自分の楽譜でもOK。今日、はじめてみよう！",
    cta: {
      type: "dual",
      primary:   { label: "練習をはじめる",      pathTemplate: "/practice" },
      secondary: { label: "楽譜をアップロード",  pathTemplate: "/scores" },
    },
  },
]
