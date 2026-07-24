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
   * マーク表示前に navigate する相対 URL (例: "?tab=mastery")。
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
        // ランクは最上部の MyRankCard。新軸(マスター→ランクUP)の入口なので最初に案内する
        id: "home.rankCard",
        targetKey: "home.rankCard",
        headline: "ここが、きみのランク",
        body: "曲をマスターするほどランクが上がるよ。タップすると、これまでの演奏の軌跡も見られる。",
        trigger: "page",
        showDismissAllCheckbox: true,
      },
      {
        // このカードは「アルコの今日の一言」(タップでポーズが変わる)。ランク表示ではない。
        id: "home.arcoCard",
        targetKey: "home.arcoCard",
        headline: "アルコが毎日ひとこと",
        body: "その日のアルコがひとこと声をかけてくれるよ。タップすると次のポーズになるんだ。",
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
        headline: "知らない記号は、タップで聞ける",
        body: "選んだ曲の楽譜がここに出るよ。すぐ下に「この曲に出てくる記号」がならんでいて、タップすると意味と弾き方がわかる。わからないまま弾かなくて大丈夫。",
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
        // 「ふりかえり」タブへ実際に切り替えたうえで、おすすめ練習が出る場所を指す。
        // targetUrl でタブを切り替え、targetKey で ScoreLoopDetail の推薦セクションを
        // スポットライトする (演奏記録が無い場合も同じ枠に案内文が出る)。
        id: "scoreDetail.recommendation",
        targetKey: "scoreDetail.recommendation",
        targetUrl: "?tab=review",
        headline: "きみ専用の練習メニューが届く",
        body: "点数と、苦手に合わせたおすすめ練習がここにたまるよ。次に何をすればいいか、もう迷わない。",
        trigger: "page",
        showDismissAllCheckbox: false,
      },
      {
        id: "scoreDetail.markers",
        // ハイライト不要 (画面中央に tooltip のみ表示)。
        // 4 色凡例は情報メッセージで特定要素を指す必要がなく、また spotlight が
        // 視認性を損なう (解析結果を見せたい譜面に被る) ため targetKey を null に。
        targetKey: null,
        headline: "色で答え合わせ",
        body: {
          rows: [
            { color: "green",  label: "緑",       meaning: "ばっちり" },
            { color: "red",    label: "赤",       meaning: "音程がズレた" },
            { color: "orange", label: "オレンジ", meaning: "タイミングがズレた" },
            { color: "gray",   label: "グレー",   meaning: "拾えなかった" },
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
        // 旧 targetKey "practice.categoryNav" は該当要素が無くなったため中央表示に変更
        id: "practice.categoryNav",
        targetKey: null,
        headline: "おすすめ練習と、学びのレッスン",
        body: "いまのあなたに合った「おすすめ練習」と、新しい技術を身につける「学びのレッスン」から選べます。むずかしい曲も、ここで練習すれば近づきます。",
        trigger: "page",
        showDismissAllCheckbox: true,
      },
    ],
  },
  {
    pageKey: "categoryList",
    marks: [
      {
        // 旧 targetKey/絞り込みUIは現行に無いため、現在の画面(☆順・グループ別)に合わせて中央表示に統合
        id: "categoryList.cards",
        targetKey: null,
        headline: "練習を選ぶ",
        body: "「☆順」で難易度から、「グループ別」でまとまりから探せます。カードをタップすると、調や奏法を選んで練習を始められます。",
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
        // 旧「弱点」タブは廃止 (現在は 習得状況/練習カレンダー の2タブ)。
        // 該当要素も無いため中央表示にし、遷移先も実在する mastery タブへ修正。
        id: "progress.mastery",
        targetKey: null,
        headline: "習得状況をふりかえる",
        body: "どの技術が身についたか、いまのランクと習得状況を確認できます。演奏を重ねると、あなたの学びポイントも見つかります。",
        trigger: "page",
        showDismissAllCheckbox: false,
        targetUrl: "?tab=mastery",
      },
    ],
  },
]
