// 純データのみ ("use client" 不要)
//
// 【この順番の意図 (Tetsuo 2026-07-25)】
//   曲を選ぶ (自分に合った難易度・むずかしければパート毎) → 一度通して弾く
//   → アルコが分析して「曲のどこが苦手か」を教える
//   → 苦手に合った練習メニューが届く (音階・フィンガリング・ボウイングなど目的別)
//   → 毎日の練習はお気に入りに登録 → 知らない技法は学びのレッスンで
//   → 練習したら曲に再挑戦 → クリアで星がひとつ → 星10個でランクUP
//   → ランクが上がると、さらにむずかしい曲に挑戦できる
//   → (任意) 自分の楽譜を持ち込む → 成長記録・スキルツリー
// 「実際に弾いて、どこが悪かったか目で見てわかる。だから直せる、だから上達する」
// がこの体験の軸。

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
   * requiresTarget の逆。指定した data-onboarding 要素が「無い」ときだけ出す。
   * 例: home.pickPiece (まだ弾いていない印) が無い = 既に弾いた人、という判定に使う。
   * これで「弾いた人向けの説明」を新規ユーザーには出さないようにする。
   */
  requiresAbsent?: string
  /**
   * 「次へ」で読み飛ばさせず、実際の画面のボタンを押させる。
   * ガイドの意義は一連の体験を自分でたどらせることなので、流れの節目では
   * ツールチップに次へを出さず、対象を光らせてタップを待つ。
   *   hint … 対象の近くに出す短い指示 (例: "ここをタップ")
   * 対象がリンク/ボタンなら、押した結果 (遷移や録音開始) はアプリ側で起きる。
   */
  awaitTap?: { hint: string }
  /**
   * このマークの表示中だけ、対象画面に「見本データ」を出させる (例: "review")。
   * まだ演奏が無いユーザーにも、分析結果とおすすめ練習がどう出るかを見せられる。
   * 見本であることは画面側で明示する。
   */
  sample?: string
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
  /**
   * このページのガイドが動いている間ずっと見本を出す (例: "home")。
   * マーク単位の sample と違い、requiresTarget の判定より先に立つので、
   * 「見本が出る → 対象要素ができる → その対象を指すマークが出せる」
   * という順番が成立する。
   */
  sample?: string
}

export const PAGE_COACH_MARKS: PageCoachMarksConfig[] = [
  {
    // ホームは状態で中身が入れ替わる。
    //  ・まだ弾いていない人 → 「曲を選ぼう」だけ (上4枚は requiresTarget で出ない)
    //  ・1曲でも弾いた人   → 続き方・クリア条件・おすすめ練習・お気に入り・ランク
    // ランクの説明は「1曲クリアしたらどうなるか」の話なので、
    // 演奏を一周したあと (弾いた曲がホームに出るようになってから) に置く。
    pageKey: "home",
    marks: [
      {
        id: "home.focusCard",
        targetKey: "home.focusCard",
        requiresTarget: true,
        requiresAbsent: "home.pickPiece",
        headline: "弾いた曲は、この画面にも出るよ",
        body: "「マスターへのステップ」がこの曲のクリア条件。音程とリズムの平均が90点以上になって、通し演奏が3回たまるとクリアだよ。",
        trigger: "page",
        showDismissAllCheckbox: true,
      },
      {
        id: "home.focusPractice",
        targetKey: "home.focusCard",
        requiresTarget: true,
        requiresAbsent: "home.pickPiece",
        headline: "おすすめの練習は、ここからすぐ",
        body: "苦手に効く練習と、毎日の基礎練がならんでいるよ。タップするとその練習が始まる。さっそくやってみよう。",
        trigger: "page",
        showDismissAllCheckbox: false,
      },
      {
        id: "home.favorites",
        targetKey: "home.favorites",
        requiresTarget: true,
        requiresAbsent: "home.pickPiece",
        headline: "毎日やりたい練習は、♡でここに",
        body: "曲や教材の ♡ を押すとお気に入りに入るよ。毎日の練習も大事なので、続けたいものを集めておこう。",
        trigger: "page",
        showDismissAllCheckbox: false,
      },
      {
        id: "home.rankCard",
        targetKey: "home.rankCard",
        requiresTarget: true,
        requiresAbsent: "home.pickPiece",
        headline: "クリアすると、星がひとつ増える",
        body: "練習したら、もう一度その曲に挑戦しよう。クリアするとランクカードに星がひとつ。星が10個たまるとランクが上がって、さらにむずかしい曲にも挑戦できるようになるよ。この繰り返しでうまくなっていこう。",
        trigger: "page",
        showDismissAllCheckbox: false,
      },
      {
        // まだ弾いていない人に出るのは、この1枚だけ
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
        body: "☆が小さいほどやさしい曲だよ。最初は一回通して弾ける、やさしめの曲から始めるのがおすすめ。",
        trigger: "page",
        showDismissAllCheckbox: true,
      },
      {
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
    // シート内に OnboardingTrigger を置いているので、開いた時に発火する。
    pageKey: "prePractice",
    marks: [
      {
        id: "prePractice.choose",
        targetKey: "prePractice.choose",
        headline: "自分に合った難易度で、いい",
        body: "同じ曲でも初級〜上級から選べるよ。むずかしければパートごとに分けて弾いてもOK。完璧じゃなくて大丈夫。",
        trigger: "page",
        showDismissAllCheckbox: true,
      },
      {
        id: "prePractice.skills",
        targetKey: "prePractice.skills",
        headline: "知らない技法があっても、置いていかない",
        body: "弾く前に、この曲に必要な技術がわかるよ。「未習得」のものはタップすると、学びのレッスンで基礎から学べるから安心。",
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
        // 楽譜そのものを指す。記号の説明は次のマークに分けている
        // (1枚に混ぜると「すぐ下に…」と言いながら譜面を光らせることになる)。
        id: "scoreDetail.score",
        targetKey: "scoreDetail.scoreOverlay",
        headline: "選んだ曲の楽譜が、ここに出るよ",
        body: "譜面の上についている丸い目印は、この曲に出てくる記号。タップすると、その場で意味と弾き方がわかる。",
        trigger: "page",
        showDismissAllCheckbox: true,
      },
      {
        id: "scoreDetail.symbols",
        targetKey: "scoreDetail.symbolGuide",
        headline: "知らない記号は、タップで聞ける",
        body: "この曲に出てくる記号がぜんぶならんでいるよ。タップすると意味と弾き方、譜面のどこに出るかまでわかる。わからないまま弾かなくて大丈夫。",
        trigger: "page",
        showDismissAllCheckbox: false,
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
        // ふりかえりタブへ切り替え、まだ演奏が無くても「弾くとこう出る」を見本で見せる
        id: "scoreDetail.reviewResult",
        targetKey: "scoreDetail.recommendation",
        targetUrl: "?tab=review",
        sample: "review",
        headline: "弾いたら、アルコが分析してくれる",
        body: "音程とリズムを見て点数をつけて、曲のどこが苦手かを教えてくれるよ。（いまは見本を出しているよ）",
        trigger: "page",
        showDismissAllCheckbox: false,
      },
      {
        id: "scoreDetail.reviewReco",
        targetKey: "scoreDetail.recommendation",
        targetUrl: "?tab=review",
        sample: "review",
        headline: "きみに合った練習メニューが届く",
        body: "「おすすめ教材」をタップすると、その練習の画面にうつるよ。次に何をすればいいか、もう迷わない。",
        trigger: "page",
        showDismissAllCheckbox: false,
      },
      {
        // 最後に演奏タブへ戻して録音を促す (戻さないと録音ボタンが見えない)
        id: "scoreDetail.record",
        targetKey: "scoreDetail.recordButton",
        targetUrl: "?tab=play",
        headline: "まず1回、弾いてみて",
        body: "うまく弾けなくて大丈夫。弾き終わると自動で分析がはじまるよ。",
        awaitTap: { hint: "タップして録音" },
        trigger: "page",
        showDismissAllCheckbox: false,
      },
      {
        // ハイライト不要 (画面中央に tooltip のみ)。spotlight は見せたい譜面に被る。
        id: "scoreDetail.markers",
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
        id: "practice.categoryNav",
        targetKey: "practice.categoryNav",
        headline: "目的にあわせて、練習を選べる",
        body: "音階・アルペジオ・フィンガリング・ボウイング・ポジション移動・重音。苦手に効くものを選ぼう。",
        trigger: "page",
        showDismissAllCheckbox: true,
      },
      {
        id: "practice.lessons",
        targetKey: "practice.lessons",
        headline: "知らない技法は、ここで学べる",
        body: "スラーやビブラートなどの技法を、基礎から順番に。曲を選ぶときにも「未習得」として出てくるから、置いていかれない。",
        trigger: "page",
        showDismissAllCheckbox: false,
      },
      {
        id: "practice.retry",
        targetKey: null,
        headline: "練習したら、もう一度その曲へ",
        body: "練習で手ごたえが出たら、また曲に挑戦しよう。弾く → 苦手がわかる → 練習する。この行き来でうまくなっていくよ。",
        trigger: "page",
        showDismissAllCheckbox: false,
      },
    ],
  },
  {
    pageKey: "categoryList",
    marks: [
      {
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
        id: "progress.mastery",
        targetKey: null,
        headline: "きみの成長は、ここで見られる",
        body: "身につけた技法と、いまのランクを確認できるよ。技法や曲をクリアするほど、挑戦できる曲が広がっていく。",
        trigger: "page",
        showDismissAllCheckbox: false,
        targetUrl: "?tab=mastery",
      },
      {
        id: "progress.skillTree",
        targetKey: null,
        headline: "これから、スキルツリーもつくるよ",
        body: "身につけた技術が枝分かれして広がっていく地図を準備中。そこでも技をひとつずつマスターしていけるようにするね。",
        trigger: "page",
        showDismissAllCheckbox: false,
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
        headline: "弾きたい曲があったら、持ち込もう",
        body: "手持ちの楽譜を取り込めば、その曲でも練習できるよ。(.xml / .musicxml / .mxl・5MBまで)",
        trigger: "page",
        showDismissAllCheckbox: true,
      },
      {
        id: "scores.grid",
        targetKey: "scores.scoreGrid",
        headline: "持ち込んだ曲も、同じように見てもらえる",
        body: "練習曲とまったく同じだよ。弾けばアルコが分析して、上手く弾くためのおすすめ練習まで案内する。",
        trigger: "page",
        showDismissAllCheckbox: false,
      },
    ],
  },
]
