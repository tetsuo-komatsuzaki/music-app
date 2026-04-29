// 純データのみ ("use client" 不要)

export const HELP_CONTENT = {
  // ① はじめてガイド
  welcome: {
    title: "はじめてガイドをもう一度見る",
    description: "Arcodaの基本的な使い方を5枚のスライドで紹介します。",
    buttonLabel: "スライドを再生する",
  },

  // ② 譜面マーカーの読み方
  markerLegend: {
    title: "譜面マーカーの読み方",
    intro: "譜面の上のマーカーは、4色で答えを返します。",
    rows: [
      { color: "🟢", name: "緑",       meaning: "OK",                     detail: "音程・タイミングともに合っている音符" },
      { color: "🔴", name: "赤",       meaning: "音程がズレた",           detail: "楽譜と違う高さで弾いた音符" },
      { color: "🟠", name: "オレンジ", meaning: "タイミングがズレた",     detail: "楽譜より早い／遅く弾いた音符" },
      { color: "⚪", name: "灰色",     meaning: "検出できなかった",       detail: "短すぎる／音量が足りなかった／弓で擦れなかった音符" },
    ],
    note: "音程もタイミングも両方ズレた音符は、赤で表示されます。Arcodaは音程のズレを優先してお伝えします。まずは音程を直すことが上達への近道です。",
  },

  // ③ ページごとの使い方 (簡潔な一行紹介、詳しくは /support/help)
  pageGuides: {
    title: "ページごとの使い方",
    items: [
      { pageKey: "home",         icon: "🏠", name: "ホーム",          description: "アルコちゃんの案内・続きから練習・履歴",  pathTemplate: "/" },
      { pageKey: "scores",       icon: "🎵", name: "スコア一覧",      description: "アップロードした楽譜を見る",            pathTemplate: "/scores" },
      { pageKey: "scoreDetail",  icon: "🎼", name: "スコア詳細",      description: "譜面・再生・録音の使い方",              pathTemplate: null },
      { pageKey: "practice",     icon: "🎯", name: "練習メニュー",    description: "あなた向けのおすすめ",                  pathTemplate: "/practice" },
      { pageKey: "categoryList", icon: "📋", name: "カテゴリ一覧",    description: "練習を絞り込んで探す",                  pathTemplate: null },
      { pageKey: "practiceItem", icon: "🎻", name: "練習アイテム詳細", description: "練習メニューを実行する (操作はスコア詳細と同じ)", pathTemplate: null },
      { pageKey: "progress",     icon: "📊", name: "成長記録",        description: "練習カレンダーと弱点",                  pathTemplate: "/progress" },
    ],
    buttonLabel: "ガイドを再生",
    note: "scoreDetail / categoryList / practiceItem は対象ページにアクセスしてからご利用ください。",
  },

  // ④ よくある質問 (5 件以内、完全版は /support/help)
  faq: [
    {
      q: "録音データは他のユーザーに見えますか？",
      a: "いいえ、録音した演奏と分析結果は本人だけが見られます。",
    },
    {
      q: "解析にはどれくらい時間がかかりますか？",
      a: "演奏の長さによりますが、通常30秒〜1分ほどです。長い演奏ほど時間がかかります。",
    },
    {
      q: "アップロードできるファイル形式は？",
      a: ".xml / .musicxml / .mxl の3形式に対応。1ファイル5MBまでです。",
    },
    {
      q: "MusicXMLはどこで入手できますか？",
      a: "MuseScore等の楽譜編集ソフトで作成・出力できます。市販の楽譜の中にはMusicXML形式で配信されているものもあります。",
    },
    {
      q: "練習履歴はいつまで残りますか？",
      a: "削除しない限り保持されます。退会時にすべて削除されます。",
    },
  ],

  fullHelpLink: "/support/help",
  fullHelpLinkLabel: "もっと詳しく見る (FAQ完全版)",

  // ⑤ うまくいかないとき
  troubleshooting: [
    {
      title: "マイクが反応しない",
      body: "ブラウザのマイク許可が必要です。\n・Chrome / Edge (PC)：URLバー左の鍵アイコン → サイトの設定 → マイクを許可\n・Safari (Mac)：環境設定 → Webサイト → マイク → このサイトを許可\n・iOS Safari：設定アプリ → Safari → マイク → 許可",
    },
    {
      title: "録音はできるけど分析されない／止まる",
      body: "ファイルが大きすぎる、またはサーバー混雑の可能性があります。少し時間をあけて再読み込み、もういちど録音してみてください。",
    },
    {
      title: "楽譜のアップロードでエラーが出る",
      body: "ファイル形式 (.xml / .musicxml / .mxl) と容量 (5MB以下) を確認してください。一部の楽譜編集ソフトは独自形式で出力するため、MusicXML形式で書き出し直してください。",
    },
    {
      title: "解析結果が表示されない",
      body: "譜面と録音が一致しない場合 (別の曲を演奏したなど)、マーカーが正しく出ないことがあります。同じ楽譜を見ながら演奏してみてください。",
    },
  ],

  footerNote: "※ サポート窓口は「お問い合わせ」 (/support/contact) からどうぞ。",
} as const
