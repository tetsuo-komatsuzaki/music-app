// 純データのみ ("use client" 不要)

export type CoachMarkBody =
  | string
  | {
      /** 凡例の前に置く一文 (任意) */
      lead?: string
      rows: { color: string; label: string; meaning: string }[]
      /** 凡例の後に置く締めの一文 (任意)。強調表示される */
      note?: string
    }

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
   * true のとき、targetKey の要素が画面に無ければこのマークを出さない。
   * 状態によって出たり出なかったりする導線 (練習中の曲が無いときだけ出る
   * 「曲を選ぶ」CTA など) に使う。既定 (false) は従来どおり、
   * 要素が無ければ画面中央にフォールバック表示する。
   */
  requiresTarget?: boolean
  /**
   * 「次へ」で読み飛ばさせず、実際の画面のボタンを押させる。
   * ガイドの意義は一連の体験を自分でたどらせることなので、流れの節目では
   * ツールチップに次へを出さず、対象を光らせてタップを待つ。
   *   hint … 対象の近くに出す短い指示 (例: "ここをタップ")
   * 対象がリンク/ボタンなら、押した結果 (遷移や録音開始) はアプリ側で起きる。
   */
  awaitTap?: { hint: string }
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
        // すでに弾いた人: 続きと次の練習がホームに出ることを伝える。
        // home.pickPiece と排他 (どちらか一方だけが画面に在る)。
        id: "home.focusCard",
        targetKey: "home.focusCard",
        requiresTarget: true,
        headline: "弾いた曲は、ここから続けられる",
        body: "演奏した曲と、その曲のおすすめ練習がホームに出るよ。次にやることは、ここから選べば大丈夫。",
        trigger: "page",
        showDismissAllCheckbox: true,
      },
      {
        // ランクは「上達の結果」なので、成長を見せたあと (ホームの最後) に置く。
        id: "home.rankCard",
        targetKey: "home.rankCard",
        headline: "ランクが上がると、弾ける曲が増える",
        body: "技法や曲をクリアするとランクUP。もっとむずかしい憧れの曲に挑戦できるようになるよ。タップで、ここまでの歩みも見られる。",
        trigger: "page",
        showDismissAllCheckbox: false,
      },
      {
        // まだ曲を弾いていない人: 曲選びへ送り出す。
        // 曲を選ぶと PracticeFocusCard が中身のある表示に変わり、この要素は消える。
        id: "home.pickPiece",
        targetKey: "home.pickPiece",
        requiresTarget: true,
        headline: "さっそく、弾く曲を選ぼう",
        body: "まずは1曲、通して弾いてみよう。☆が小さいほどやさしい曲だよ。さっそく選びに行こう。",
        awaitTap: { hint: "ここをタップ" },
        trigger: "page",
        showDismissAllCheckbox: true,
      },
    ],
  },
  {
    // 練習曲一覧 (/practice/pieces)。ホームの「曲を選ぶ」CTA の遷移先。
    pageKey: "pieces",
    marks: [
      {
        id: "pieces.starTabs",
        targetKey: "pieces.starTabs",
        headline: "まずは1曲、通して弾いてみよう",
        body: "☆が小さいほどやさしい曲だよ。最初は通して弾けるやさしめから始めるのがおすすめ。",
        trigger: "page",
        showDismissAllCheckbox: true,
      },
      {
        // ここは読み飛ばさせず、実際に曲を選ばせる
        id: "pieces.rail",
        targetKey: "pieces.rail",
        headline: "気になる曲をタップしてみよう",
        body: "曲をタップすると、難易度やパートを選ぶ画面がひらくよ。",
        awaitTap: { hint: "曲をタップ" },
        trigger: "page",
        showDismissAllCheckbox: false,
      },
    ],
  },
  {
    // 練習前シート (曲をタップすると開くボトムシート)。
    // シートが mount された時に発火する (OnboardingTrigger をシート内に置いている)。
    pageKey: "prePractice",
    marks: [
      {
        id: "prePractice.choose",
        targetKey: "prePractice.choose",
        headline: "むりのない難易度で、いい",
        body: "同じ曲でも初級〜上級から選べるよ。むずかしければパートごとに分けて弾いてもOK。完璧じゃなくて大丈夫。",
        trigger: "page",
        showDismissAllCheckbox: true,
      },
      {
        id: "prePractice.skills",
        targetKey: "prePractice.skills",
        headline: "知らない技法があっても、置いていかない",
        body: "弾く前に、この曲に必要な技術がわかるよ。「未習得」のものはタップすると、学びのレッスンで基礎から学べる。",
        trigger: "page",
        showDismissAllCheckbox: false,
      },
      {
        id: "prePractice.start",
        targetKey: "prePractice.start",
        headline: "準備はいいかな",
        body: "難易度とパートを決めたら、ここから練習に入ろう。",
        awaitTap: { hint: "タップして始める" },
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
        id: "scoreDetail.play",
        targetKey: "scoreDetail.playControls",
        headline: "ゆっくりからで、いい",
        body: "お手本を聴きながら合わせられるよ。テンポを落とせば、むずかしい所も怖くない。",
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
        id: "scoreDetail.record",
        targetKey: "scoreDetail.recordButton",
        // ふりかえりタブから演奏タブへ戻してから録音を促す (最後の一歩)
        targetUrl: "?tab=play",
        headline: "まず1回、弾いてみて",
        body: "弾き終わると、アルコが演奏を分析するよ。曲のどこが苦手かを見つけて、きみに合った練習まで教えてくれる。うまく弾けなくて大丈夫。",
        awaitTap: { hint: "タップして録音" },
        trigger: "page",
        showDismissAllCheckbox: false,
      },
      {
        id: "scoreDetail.markers",
        // ハイライト不要 (画面中央に tooltip のみ表示)。
        // 4 色凡例は情報メッセージで特定要素を指す必要がなく、また spotlight が
        // 視認性を損なう (解析結果を見せたい譜面に被る) ため targetKey を null に。
        targetKey: null,
        headline: "見てわかるから、直せる",
        body: {
          lead: "どこが苦手か、音符ひとつずつ色でわかるよ。",
          rows: [
            { color: "green",  label: "緑",       meaning: "ばっちり" },
            { color: "red",    label: "赤",       meaning: "音程がズレた" },
            { color: "orange", label: "オレンジ", meaning: "リズムがズレた" },
            { color: "gray",   label: "グレー",   meaning: "拾えなかった" },
          ],
          note: "わかるから直せる。直せるから、上達する。",
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
        headline: "目的にあわせて、練習を選べる",
        body: "音階・アルペジオ・フィンガリング・ボウイング・ポジション移動・重音。苦手に効くものを選ぼう。",
        trigger: "page",
        showDismissAllCheckbox: true,
      },
      {
        id: "practice.lessons",
        targetKey: "practice.lessons",
        headline: "知らない技法は、ここで学べる",
        body: "スラーやビブラートなどの技法を、基礎から順番に。クリアするとランクにも効いてくるよ。",
        trigger: "page",
        showDismissAllCheckbox: false,
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
        headline: "やさしい順に、選べる",
        body: "「☆順」で難易度から、「グループ別」でまとまりから探せるよ。カードをタップすると、調や奏法を選んで始められる。",
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
        headline: "やり方は、曲のときと同じ",
        body: "再生・録音・分析・譜面の色の読み方は、曲を弾くときとまったく同じだよ。困ったら「使い方」から見返せる。",
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
        headline: "続けた自分が、残っていく",
        body: "練習した日にマークがつくよ。この積み重ねが、そのまま自信になる。",
        trigger: "page",
        showDismissAllCheckbox: true,
      },
      {
        // 旧「弱点」タブは廃止 (現在は 習得状況/練習カレンダー の2タブ)。
        // 該当要素も無いため中央表示にし、遷移先も実在する mastery タブへ修正。
        id: "progress.mastery",
        targetKey: null,
        headline: "できることが、増えていく",
        body: "身につけた技法と、いまのランクを確認できるよ。クリアするほど、挑戦できる曲が広がっていく。",
        trigger: "page",
        showDismissAllCheckbox: false,
        targetUrl: "?tab=mastery",
      },
    ],
  },
  {
    // 主導線ではない。弾く曲は「練習曲」から選ぶのが基本で、
    // ここは自分の楽譜を持ち込みたい人向けの任意の入口なので最後に置く。
    pageKey: "scores",
    marks: [
      {
        id: "scores.upload",
        targetKey: "scores.uploadButton",
        headline: "憧れのあの曲も、持ち込める",
        body: "手持ちの楽譜を取り込めば、その曲でも練習できるよ。(.xml / .musicxml / .mxl・5MBまで)",
        trigger: "page",
        showDismissAllCheckbox: true,
      },
      {
        id: "scores.grid",
        targetKey: "scores.scoreGrid",
        headline: "きみの楽譜が集まる場所",
        body: "取り込んだ楽譜はここに並ぶよ。タップすると、譜面を見ながら再生・録音できる。",
        trigger: "page",
        showDismissAllCheckbox: false,
      },
    ],
  },
]
