// 純データのみ ("use client" 不要)

export type CoachMarkBody =
  | string
  | { rows: { color: string; label: string; meaning: string }[] }

export type CoachMarkConfig = {
  id: string
  /**
   * data-onboarding 属性に入れる値 (CSS セレクタではない)
   * null = ターゲットなし、画面中央に tooltip 表示
   */
  targetKey: string | null
  headline: string
  body: CoachMarkBody
  trigger: "page" | "first-analysis-complete"
  showDismissAllCheckbox: boolean
}

export type PageCoachMarksConfig = {
  pageKey: string
  marks: CoachMarkConfig[]
}

export const PAGE_COACH_MARKS: PageCoachMarksConfig[] = [
  {
    pageKey: "home",
    marks: [
      {
        id: "home.arcoCard",
        targetKey: "home.arcoCard",
        headline: "アルコちゃんがあなたを案内します",
        body: "毎日の挨拶と、今日のおすすめ練習を表示します。練習を続けるとストリーク (連続練習日数) も伸びます。",
        trigger: "page",
        showDismissAllCheckbox: true,
      },
      {
        id: "home.continueItem",
        targetKey: "home.continueItem",
        headline: "続きから練習できます",
        body: "前回の練習を覚えています。タップすればすぐに再開できます。",
        trigger: "page",
        showDismissAllCheckbox: false,
      },
    ],
  },
  {
    pageKey: "scores",
    marks: [
      {
        id: "scores.upload",
        targetKey: "scores.uploadButton",
        headline: "まずは楽譜をアップロード",
        body: "楽譜ファイル (.xml / .musicxml / .mxl、5MB以下) を読み込ませると、譜面が表示されて練習を始められます。",
        trigger: "page",
        showDismissAllCheckbox: true,
      },
      {
        id: "scores.grid",
        targetKey: "scores.scoreGrid",
        headline: "アップロードした楽譜はここに並びます",
        body: "カードをタップすると、譜面の表示・再生・録音ができる詳細画面に移動します。",
        trigger: "page",
        showDismissAllCheckbox: false,
      },
    ],
  },
  {
    pageKey: "scoreDetail",
    marks: [
      {
        id: "scoreDetail.play",
        targetKey: "scoreDetail.playControls",
        headline: "解析を待つ間、ここで再生できます",
        body: "バイオリン音源で再生し、テンポも変えられます。譜面のどこかをタップしてもその位置から再生開始します。",
        trigger: "page",
        showDismissAllCheckbox: true,
      },
      {
        id: "scoreDetail.record",
        targetKey: "scoreDetail.recordButton",
        headline: "ここを押して録音",
        body: "演奏を終えると自動で分析がはじまります。結果が同じ譜面の上に映ります。",
        trigger: "page",
        showDismissAllCheckbox: false,
      },
      {
        id: "scoreDetail.markers",
        targetKey: "scoreDetail.scoreOverlay",
        headline: "譜面の上で、答え合わせ",
        body: {
          rows: [
            { color: "🟢", label: "緑",       meaning: "OK" },
            { color: "🔴", label: "赤",       meaning: "音程がズレた" },
            { color: "🟠", label: "オレンジ", meaning: "タイミングがズレた" },
            { color: "⚪", label: "灰色",     meaning: "音が検出できなかった" },
          ],
        },
        trigger: "first-analysis-complete",
        showDismissAllCheckbox: false,
      },
    ],
  },
  {
    pageKey: "practice",
    marks: [
      {
        id: "practice.recommendations",
        targetKey: "practice.recommendations",
        headline: "あなた向けのおすすめ",
        body: "演奏履歴をもとに、次に取り組むと良い練習をArcodaが提案します。最初は基本のおすすめが並びます。",
        trigger: "page",
        showDismissAllCheckbox: true,
      },
      {
        id: "practice.categoryNav",
        targetKey: "practice.categoryNav",
        headline: "カテゴリから自由に探す",
        body: "音階・アルペジオ・エチュードから、いまの自分に合った練習を選べます。",
        trigger: "page",
        showDismissAllCheckbox: false,
      },
    ],
  },
  {
    pageKey: "categoryList",
    marks: [
      {
        id: "categoryList.filters",
        targetKey: "categoryList.filters",
        headline: "条件で絞り込めます",
        body: "キー (調)・ポジション・並び順で練習を絞り込めます。",
        trigger: "page",
        showDismissAllCheckbox: true,
      },
    ],
  },
  {
    pageKey: "practiceItem",
    marks: [
      {
        id: "practiceItem.same",
        targetKey: null,
        headline: "操作はスコア詳細と同じ",
        body: "再生・録音・分析・譜面マーカーの読み方は同じです。詳しい操作は「使い方」メニューから見返せます。",
        trigger: "page",
        showDismissAllCheckbox: true,
      },
    ],
  },
  {
    pageKey: "progress",
    marks: [
      {
        id: "progress.calendar",
        targetKey: "progress.calendar",
        headline: "練習カレンダー",
        body: "練習した日にマークが付きます。連続練習日数 (ストリーク) もここで確認できます。",
        trigger: "page",
        showDismissAllCheckbox: true,
      },
      {
        id: "progress.weakness",
        targetKey: "progress.weakness",
        headline: "苦手を見える化",
        body: "練習を重ねると、つまずきやすいキーやタイミングをArcodaが自動で見つけます。「弱点」タブで確認できます。",
        trigger: "page",
        showDismissAllCheckbox: false,
      },
    ],
  },
]
