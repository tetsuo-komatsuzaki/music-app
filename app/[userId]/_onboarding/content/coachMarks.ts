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
  /**
   * マーク表示前に navigate する相対 URL (例: "?tab=weakness")。
   * URL クエリ駆動でタブを切り替えるページ (progress / categoryList) で使う。
   * 既に同じクエリの場合は no-op。
   */
  targetUrl?: string
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
        headline: "好きな楽譜をアップロード",
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
        id: "scoreDetail.score",
        targetKey: "scoreDetail.scoreOverlay",
        headline: "ここに楽譜が表示されます",
        body: "譜面のどこかをタップすると、その位置から再生を始められます。再生中の現在位置はカーソルで示されます。",
        trigger: "page",
        showDismissAllCheckbox: true,
      },
      {
        id: "scoreDetail.record",
        targetKey: "scoreDetail.recordButton",
        headline: "演奏を録音する",
        body: "ここから録音を始めます。演奏を終えると自動で分析がはじまり、結果が同じ譜面の上に色で表示されます。",
        trigger: "page",
        showDismissAllCheckbox: false,
      },
      {
        id: "scoreDetail.play",
        targetKey: "scoreDetail.playControls",
        headline: "楽譜を再生して確認",
        body: "バイオリン音源で楽譜を再生できます。テンポも変えられるので、ゆっくり練習したい時に便利です。",
        trigger: "page",
        showDismissAllCheckbox: false,
      },
      {
        id: "scoreDetail.markers",
        targetKey: "scoreDetail.scoreOverlay",
        headline: "色で答え合わせ",
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
        id: "practice.categoryNav",
        targetKey: "practice.categoryNav",
        headline: "カテゴリから自由に探す",
        body: "音階・アルペジオ・エチュードから、いまの自分に合った練習を選べます。",
        trigger: "page",
        showDismissAllCheckbox: true,
      },
    ],
  },
  {
    pageKey: "categoryList",
    marks: [
      {
        id: "categoryList.cards",
        targetKey: "categoryList.itemList",
        headline: "練習したいカードを選択",
        body: "カードをタップすると、練習画面に遷移します。",
        trigger: "page",
        showDismissAllCheckbox: true,
        targetUrl: "?view=all",
      },
      {
        id: "categoryList.filters",
        targetKey: "categoryList.filters",
        headline: "条件を絞ります",
        body: "キー (調)・ポジション・並び順で練習を絞り込めます。",
        trigger: "page",
        showDismissAllCheckbox: false,
        targetUrl: "?view=all",
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
        targetUrl: "?tab=weakness",
      },
    ],
  },
]
