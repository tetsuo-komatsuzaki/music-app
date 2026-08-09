// 純データ + アイコン参照 ("use client" 不要)
import { Home, Library, FileMusic, Dumbbell, Music, ClipboardList, NotebookPen } from "lucide-react"

export const HELP_CONTENT = {
  // ① はじめてガイド
  welcome: {
    title: "はじめてガイドをもう一度見る",
    description: "弾きたい曲に挑戦して、上手くなっていく流れを7枚のスライドで紹介します。",
    buttonLabel: "スライドを再生する",
  },

  // ② 譜面マーカーの読み方
  markerLegend: {
    title: "譜面マーカーの読み方",
    intro: "弾いた音は、譜面の上に4色で表示されます。色を見るだけで、どこを直せばいいかわかります。",
    // key = CSS でカラードットを描くための色ID (絵文字は使わない)
    rows: [
      { key: "green",  name: "緑",       meaning: "ばっちり",         detail: "音程もタイミングも合っている音" },
      { key: "red",    name: "赤",       meaning: "音程がズレた",     detail: "楽譜と違う高さで弾いた音" },
      { key: "orange", name: "オレンジ", meaning: "タイミングがズレた", detail: "楽譜より早い・遅く弾いた音" },
      { key: "gray",   name: "グレー",   meaning: "拾えなかった",     detail: "音が小さい・短いなどで検出できなかった音" },
    ],
    note: "音程とタイミングが両方ズレた音は、赤で表示します。まずは赤（音程）から直すのが、上達への近道です。",
  },

  // ③ ページごとの使い方 (簡潔な一行紹介、詳しくは /support/help)
  pageGuides: {
    title: "ページごとの使い方",
    items: [
      { pageKey: "home",         icon: Home,          name: "ホーム",          description: "続きから練習・履歴・アルコの案内",      pathTemplate: "/" },
      { pageKey: "scores",       icon: Library,       name: "マイライブラリー",  description: "アップロードした楽譜の一覧",            pathTemplate: "/scores" },
      { pageKey: "scoreDetail",  icon: FileMusic,     name: "スコア詳細",      description: "譜面を見て、再生・録音する",            pathTemplate: null },
      { pageKey: "practice",     icon: Dumbbell,      name: "練習メニュー",    description: "あなた向けのおすすめ練習",              pathTemplate: "/practice" },
      { pageKey: "pieces",       icon: Music,         name: "練習曲",          description: "☆別・ジャンル別に弾く曲を選ぶ",         pathTemplate: "/practice/pieces" },
      { pageKey: "categoryList", icon: ClipboardList, name: "カテゴリ一覧",    description: "種類をしぼって練習を探す",              pathTemplate: null },
      { pageKey: "practiceItem", icon: Music,         name: "練習アイテム詳細", description: "練習を再生・録音する（操作はスコア詳細と同じ）", pathTemplate: null },
      { pageKey: "progress",     icon: NotebookPen,   name: "成長カルテ",      description: "練習の実態・安定マップ・所見・成長の物語", pathTemplate: "/progress" },
    ],
    buttonLabel: "ガイドを再生",
    note: "スコア詳細・カテゴリ一覧・練習アイテム詳細は、そのページを開いてからガイドを再生できます。",
  },

  // ④ よくある質問 (5 件以内、完全版は /support/help)
  faq: [
    {
      q: "録音した演奏は、他の人に見られますか？",
      a: "いいえ。演奏も分析結果も、見られるのはあなただけです。",
    },
    {
      q: "分析にどれくらい時間がかかりますか？",
      a: "ふつう1分ほどです。演奏が長いほど、少し時間がかかります。",
    },
    {
      q: "どんな楽譜ファイルを使えますか？",
      a: "MusicXML（.xml / .musicxml / .mxl）を使えます。1ファイル5MBまでです。",
    },
    {
      q: "MusicXMLはどこで手に入りますか？",
      a: "MuseScoreなどの無料ソフトで作れます。市販の楽譜にも、MusicXML付きのものがあります。",
    },
    {
      q: "練習の記録は、いつまで残りますか？",
      a: "消さない限り、ずっと残ります。退会すると、すべて削除されます。",
    },
  ],

  fullHelpLink: "/support/help",
  fullHelpLinkLabel: "もっと詳しく見る (FAQ完全版)",

  // ⑤ うまくいかないとき
  troubleshooting: [
    {
      title: "マイクが反応しない",
      body: "ブラウザでマイクを「許可」にしてください。\n・PC（Chrome / Edge）：URLバー左の鍵アイコン → マイクを許可\n・iPhone（Safari）：設定アプリ → Safari → マイク → 許可",
    },
    {
      title: "録音できるのに分析されない・止まる",
      body: "少し時間をおいて、ページを再読み込みしてから、もう一度録音してください。",
    },
    {
      title: "楽譜のアップロードでエラーが出る",
      body: "形式（.xml / .musicxml / .mxl）と容量（5MB以下）を確認してください。ソフトによっては「MusicXMLで書き出し」が必要です。",
    },
    {
      title: "分析しても色がつかない",
      body: "譜面と違う曲を弾くと、正しく判定できません。同じ楽譜を見ながら弾いてみてください。",
    },
  ],

  footerNote: "※ サポート窓口は「お問い合わせ」 (/support/contact) からどうぞ。",
} as const
