// 純データ + アイコン参照 ("use client" 不要)
import { Home, Library, Dumbbell, Music, NotebookPen } from "lucide-react"

export const HELP_CONTENT = {
  // ① はじめてガイド
  welcome: {
    title: "はじめてガイドをもう一度見る",
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
    ],
    note: "音程とタイミングが両方ズレた音は、赤で表示します。まずは赤から直すのが、上達への近道です。",
  },

  // ③ ページごとの使い方 (「ガイドを再生」でそのページへ移動して再生する)
  pageGuides: {
    title: "ページごとの使い方",
    items: [
      { pageKey: "home",     icon: Home,        name: "ホーム",          description: "続きから練習・履歴・アルコの案内",  pathTemplate: "/" },
      { pageKey: "scores",   icon: Library,     name: "ライブラリ",      description: "曲・基礎練・自分の楽譜",            pathTemplate: "/library" },
      { pageKey: "practice", icon: Dumbbell,    name: "基礎練",          description: "カテゴリから練習をえらぶ",          pathTemplate: "/library?tab=basics" },
      { pageKey: "pieces",   icon: Music,       name: "練習曲",          description: "☆別・ジャンル別に弾く曲を選ぶ",     pathTemplate: "/practice/pieces" },
      { pageKey: "progress", icon: NotebookPen, name: "成長カルテ",      description: "練習の実態・安定マップ・所見・成長の物語", pathTemplate: "/progress" },
    ],
    buttonLabel: "ガイドを再生",
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
      a: "MusicXMLを使えます。1ファイル5MBまでです。",
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
  fullHelpLinkLabel: "もっと詳しく見る",
  // footerNote は削除 (サポート導線は別途)

  // ⑤ うまくいかないとき
  troubleshooting: [
    {
      title: "マイクが反応しない",
      body: "ブラウザでマイクを「許可」にしてください。\n・PC：URLバー左の鍵アイコン → マイクを許可\n・iPhone：設定アプリ → Safari → マイク → 許可",
    },
    {
      title: "録音できるのに分析されない・止まる",
      body: "少し時間をおいて、ページを再読み込みしてから、もう一度録音してください。",
    },
    {
      title: "楽譜のアップロードでエラーが出る",
      body: "形式と容量・5MB以下を確認してください。ソフトによっては「MusicXMLで書き出し」が必要です。",
    },
    {
      title: "分析しても色がつかない",
      body: "譜面と違う曲を弾くと、正しく判定できません。同じ楽譜を見ながら弾いてみてください。",
    },
  ],
} as const
