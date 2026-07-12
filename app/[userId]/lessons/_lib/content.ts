// 学びレッスン 全23本のコンテンツ定義 (プロトタイプ v2.4 移植 + 確定#1〜#8 反映)
//
// 構成 (確定#2): 技術13(スラー含む) + ポジション5(2nd〜6th+) + 重音4(3/6/8/10度) + 連続重音1 = 23
//   - プロトから重音4度/5度を削除 (isAcquisition=false=記録も要求も対象外のため)
//   - 連続重音を新規追加 (設計書§1-5にあり・FeatureTag isAcquisition=true)
// 教育テキストは暫定 — Tetsuo監修対象。
//
// tag: レッスンが教える習得タグ (UserLessonClear / UserTagAcquisition と同一体系)。
//   technique = TechniqueTag.name / position = "2".."6"(6=6th以上) / double_stop = FeatureTag.name
// 対応する教材 (PracticeItem category=lesson) はこのタグが張られたものを実行時に解決する。
// レッスン名やIDをtagKeyに使わないこと (正本はこの対応表のみ)。

import type { BowFigOpts, FbFigOpts } from "./figures"

export type LessonCat = "bow" | "left" | "both"

// 2026-07-14 分類改定(Tetsuo指示): スラー/ピチカート→bow(右手・弓系)、
// both は重音のみ残るため「重音系」に改名 (キーは互換のため both のまま)
export const CATS: Record<LessonCat, { label: string; theme: string; light: string }> = {
  bow: { label: "右手・弓系", theme: "#55B8B8", light: "#93F4F5" },
  left: { label: "左手系", theme: "#8C2FCF", light: "#F2A7FA" },
  both: { label: "重音系", theme: "#E8883A", light: "#FFD9AE" },
}

export type LessonTag = {
  tagType: "technique" | "position" | "double_stop"
  tagKey: string
}

export type Lesson = {
  id: string
  name: string
  cat: LessonCat
  tag: LessonTag
  figType: "bow" | "fb"
  /** スライド2,3,4 の図解パラメータ */
  figs: [BowFigOpts | FbFigOpts, BowFigOpts | FbFigOpts, BowFigOpts | FbFigOpts]
  /** [①これは何 ②体の使い方 ③よくある間違い ④コツ ⑤成功の感覚] (<b>タグ可) */
  texts: [string, string, string, string, string]
  /** 各スライドの用語ラベル */
  terms: [string, string, string, string, string]
}

const tech = (key: string): LessonTag => ({ tagType: "technique", tagKey: key })
const pos = (key: string): LessonTag => ({ tagType: "position", tagKey: key })
const ds = (key: string): LessonTag => ({ tagType: "double_stop", tagKey: key })

export const LESSONS: Lesson[] = [
  // ─── 右手・弓系 (6) ───
  {
    id: "staccato", name: "スタッカート", cat: "bow", tag: tech("スタッカート"), figType: "bow",
    figs: [{ zone: "mid" }, { zone: "mid", cross: true }, { zone: "mid", dir: "down" }],
    texts: [
      "音を短く切って、粒立ちよく弾く技術だよ。記号は音符の上の点。",
      "弓は<b>弦につけたまま</b>、動きを止めて音を切る。手首で「止める」イメージ。",
      "弓を弦から<b>離して</b>しまうまちがいが多い。離すのは跳ばし系の別技術だよ。",
      "「弾く→止める」をワンセットに。止めた瞬間も弓は弦の上!",
      "音の間にきれいな無音ができて、粒がそろって聞こえたら成功。次のフレーズでやってみよう!",
    ],
    terms: ["スタッカート", "弦につけたまま", "よくあるまちがい", "コツ", "できたときの感覚"],
  },
  {
    // 2026-07-14 用語改定: 旧称ボウ・スタッカート
    id: "bow_staccato", name: "連続スタッカート", cat: "bow", tag: tech("連続スタッカート"), figType: "bow",
    figs: [{ zone: "whole", dir: "down" }, { zone: "whole", cross: true }, { zone: "whole", shake: true }],
    texts: [
      "<b>1弓のなかで</b>音を連続して切る、上級のアーティキュレーションだよ。",
      "ダウン(またはアップ)の<b>1方向のまま</b>、小さな「止め」を連続させる。",
      "音ごとに弓の方向が入れ替わってしまうのがよくあるまちがい。",
      "まずは1弓で2音から。腕は一定の速さ、指と手首で刻むよ。",
      "ミシンみたいに等間隔でタタタと刻めたら成功。やってみよう!",
    ],
    terms: ["連続スタッカート", "1方向のまま刻む", "よくあるまちがい", "コツ", "できたときの感覚"],
  },
  {
    id: "spiccato", name: "スピッカート", cat: "bow", tag: tech("スピッカート"), figType: "bow",
    figs: [{ zone: "mid", bounce: true }, { zone: "mid", press: true }, { zone: "mid", bounce: true }],
    texts: [
      "弓を弦の上で軽く<b>跳ねさせて</b>、短く弾む音を出す技術だよ。",
      "弓の<b>まんなかあたり</b>を使う。手首とゆびは柔らかく、弓の重さで自然に跳ねさせよう。",
      "腕全体で<b>押さえつける</b>と弓は跳ねられない。力で跳ねさせようとするのが一番多いまちがい。",
      "弓を弦に「<b>落として、跳ね返りを受け取る</b>」感覚。1回ポンと落とすところから。",
      "コロコロと軽い音が続いたら成功。いっしょにやってみよう!",
    ],
    terms: ["スピッカート", "弓のまんなか", "よくあるまちがい", "コツ", "できたときの感覚"],
  },
  {
    id: "ricochet", name: "リコシェ", cat: "bow", tag: tech("リコシェ"), figType: "bow",
    figs: [{ zone: "tip", throw_: true }, { zone: "tip", cross: true }, { zone: "tip", throw_: true }],
    texts: [
      "弓を<b>1回投げて</b>、その跳ね返りで2〜数音を鳴らす技術だよ。",
      "弓の<b>先寄り</b>を弦に投げて、あとは跳ね返りに任せる。",
      "跳ねを1回ずつ手で作ろうとするのがまちがい。それだとスピッカートになっちゃう。",
      "「1回投げて、あとは受け身」。まずは2連から始めよう。",
      "弓がひとりでにタタッと跳ねてくれたら成功だよ!",
    ],
    terms: ["リコシェ", "先寄りに投げる", "よくあるまちがい", "コツ", "できたときの感覚"],
  },
  {
    id: "tremolo", name: "トレモロ", cat: "bow", tag: tech("トレモロ"), figType: "bow",
    figs: [{ zone: "tip", shake: true, dir: "both" }, { zone: "whole", cross: true }, { zone: "tip", shake: true }],
    texts: [
      "同じ音を<b>細かく速く</b>刻みつづける技術。オーケストラのざわざわした音だね。",
      "弓の<b>先寄り</b>で、手首から先だけを小刻みに動かすよ。",
      "腕全体で大きく動かすと、すぐ疲れて続かなくなるよ。",
      "動きを最小に。羽で撫でるくらい軽く、が合言葉。",
      "音が途切れずふるえ続けたら成功。やってみよう!",
    ],
    terms: ["トレモロ", "弓先で小刻みに", "よくあるまちがい", "コツ", "できたときの感覚"],
  },
  {
    id: "portato", name: "ポルタート", cat: "bow", tag: tech("ポルタート"), figType: "bow",
    figs: [{ zone: "whole", dir: "down" }, { zone: "mid", cross: true }, { zone: "whole", dir: "down" }],
    texts: [
      "1弓のなかで音を<b>やわらかく区切る</b>、歌うようなアーティキュレーションだよ。",
      "弓は止めずに、<b>圧を波のようにゆるめて</b>音を区切る。",
      "完全に止めてしまうとスタッカートになっちゃうよ。",
      "音と音の間を「切る」ではなく「<b>ゆるめる</b>」。息つぎのイメージ。",
      "音がつながったまま、ふわっと区切れて聞こえたら成功!",
    ],
    terms: ["ポルタート", "圧をゆるめる", "よくあるまちがい", "コツ", "できたときの感覚"],
  },
  // ─── 左手系 (5 + ポジション5) ───
  {
    id: "vibrato", name: "ビブラート", cat: "left", tag: tech("ビブラート"), figType: "fb",
    figs: [{ fingers: [[2, 2]], wave: true }, { fingers: [[2, 2]], cross: true }, { fingers: [[2, 2]], wave: true }],
    texts: [
      "音を<b>ゆらして</b>、温かみと響きを作る技術だよ。",
      "指先の接点を<b>支点</b>にして、手をやわらかく揺らす。指先は動かさない。",
      "指先が指板の上を<b>すべって</b>、音程ごと動いてしまうのがまちがい。",
      "指先は貼りついたまま、関節をやわらかく前後に。<b>ゆっくり大きく</b>から始めよう。",
      "音がふくらんで、響きが長くのびたら成功だよ!",
    ],
    terms: ["ビブラート", "指先を支点に", "よくあるまちがい", "コツ", "できたときの感覚"],
  },
  {
    id: "trill", name: "トリル", cat: "left", tag: tech("トリル"), figType: "fb",
    figs: [{ fingers: [[2, 1], [2, 2]] }, { fingers: [[2, 1], [2, 2]], cross: true }, { fingers: [[2, 1], [2, 2]] }],
    texts: [
      "となりの音と<b>すばやく交互に</b>鳴らす装飾だよ。",
      "押さえた指は<b>置いたまま</b>、上の指だけを上下させる。",
      "下の指までいっしょに浮いてしまうのがよくあるまちがい。",
      "力まず、<b>ゆっくり均等</b>から。速さより均等さが先だよ。",
      "2つの音が転がるように交互に鳴ったら成功!",
    ],
    terms: ["トリル", "下の指は置いたまま", "よくあるまちがい", "コツ", "できたときの感覚"],
  },
  {
    // 2026-07-14 用語改定: 旧称モルデント (上=プラルトリラー/下=モルデントの両方を扱う)
    id: "mordent", name: "プラルトリラーとモルデント", cat: "left", tag: tech("プラルトリラーとモルデント"), figType: "fb",
    figs: [{ fingers: [[2, 1], [2, 2]] }, { fingers: [[2, 1], [2, 2]], cross: true }, { fingers: [[2, 1], [2, 2]] }],
    texts: [
      "トリルの短縮形。となりの音との<b>1往復だけ</b>の飾りだよ。<b>上の音</b>と往復するのがプラルトリラー、<b>下の音</b>と往復するのがモルデント。",
      "本体の音→となりの音→本体、を<b>すばやく1回</b>。",
      "往復が増えてトリルになってしまうのがまちがい。",
      "「<b>ワンタッチだけ</b>」と数えながら弾こう。",
      "音の頭にキラッと飾りがついたら成功!",
    ],
    terms: ["プラルトリラーとモルデント", "1往復だけ", "よくあるまちがい", "コツ", "できたときの感覚"],
  },
  {
    id: "glissando", name: "グリッサンド", cat: "left", tag: tech("グリッサンド"), figType: "fb",
    figs: [{ fingers: [[2, 1]], arrow: [120, 260] }, { fingers: [[2, 1]], cross: true }, { fingers: [[2, 1]], arrow: [120, 260] }],
    texts: [
      "音から音へ<b>すべらかにつなげて</b>移動する表現だよ。",
      "指を弦に軽く触れたまますべらせる。指だけでなく<b>腕ごと運ぶ</b>よ。",
      "指先だけですべると、途中で音が抜けてしまう。",
      "触れる強さを一定に。<b>到達する音でピタッと止める</b>のがコツ。",
      "音が1本の線のようにつながって届いたら成功!",
    ],
    terms: ["グリッサンド", "腕ごと運ぶ", "よくあるまちがい", "コツ", "できたときの感覚"],
  },
  {
    id: "harmonics", name: "ナチュラル・ハーモニクス", cat: "left", tag: tech("ナチュラル・ハーモニクス"), figType: "fb",
    figs: [{ harm: [[2, 3]] }, { fingers: [[2, 3]], cross: true }, { harm: [[2, 3]] }],
    texts: [
      "弦に<b>軽く触れるだけ</b>で倍音を出す、笛のような音の技術だよ。",
      "押さえずに「<b>触れるだけ</b>」。場所は弦のちょうど分割点。",
      "押さえこんでしまうと、普通の音になっちゃう。",
      "羽のタッチ+弓は少し速めに駒寄りで。",
      "透明な高い音がスッと抜けたら成功!",
    ],
    terms: ["ハーモニクス", "触れるだけ", "よくあるまちがい", "コツ", "できたときの感覚"],
  },
  // ポジション5本 (tagKey "2".."6"、6=6th以上)
  ...(
    [
      ["pos2", "2nd", "2", [150, 210]],
      ["pos3", "3rd", "3", [180, 240]],
      ["pos4", "4th", "4", [210, 270]],
      ["pos5", "5th", "5", [240, 300]],
      ["pos6", "6thポジション以上", "6", [270, 330]],
    ] as Array<[string, string, string, [number, number]]>
  ).map(([id, nm, key, band]): Lesson => ({
    id,
    name: nm === "6thポジション以上" ? nm : `${nm}ポジション`,
    cat: "left",
    tag: pos(key),
    figType: "fb",
    figs: [
      { band, fingers: [[2, 1]] },
      { band, fingers: [[2, 1]], cross: true },
      { band, arrow: [110, band[0] + 30], fingers: [[2, 1]] },
    ],
    texts: [
      `${nm}ポジションは、手の「基地」を${nm === "2nd" ? "少し" : ""}高い音域へ移す位置だよ。`,
      "指をのばすんじゃなくて、<b>腕ごとフレームを運ぶ</b>。親指もいっしょに引っ越しするよ。",
      "指だけのばして手の形がくずれるのが、いちばん多いまちがい。",
      "移動の前に<b>力を抜く</b>。「フレームごと引っ越し」と唱えよう。",
      "移動したあとも1〜4の指がそのまま使えたら成功!",
    ],
    terms: [`${nm}ポジション`, "フレームごと運ぶ", "よくあるまちがい", "コツ", "できたときの感覚"],
  })),
  // ─── 重音系 (重音4 + 連続重音)。スラー/ピチカートは2026-07-14にbowへ移動 ───
  ...(
    [
      ["ds3", "3度", [[1, 1], [2, 3]]],
      ["ds6", "6度", [[1, 1], [2, 2]]],
      ["ds8", "オクターブ", [[1, 1], [2, 4]]],
      ["ds10", "10度", [[1, 2], [2, 4]]],
    ] as Array<[string, string, Array<[number, number]>]>
  ).map(([id, nm, fg]): Lesson => ({
    id,
    name: `重音(${nm})`,
    cat: "both",
    tag: ds(nm),
    figType: "fb",
    figs: [{ fingers: fg }, { fingers: fg, cross: true }, { fingers: fg }],
    texts: [
      `重音は<b>2本の弦を同時に</b>鳴らす技術。${nm}は2つの音の間隔のことだよ。`,
      "2本の指で<b>1つのフレーム</b>を保つ。弓は2弦のまんなかの角度で。",
      "片方の指だけ意識すると、もう片方の音程がくずれる(フレームくずれ)。",
      "2音を「<b>1つの形</b>」として押さえる。ゆっくり片方ずつ→同時、の順で。",
      "2つの音が1つにとけて響いたら成功!",
    ],
    terms: [`重音(${nm})`, "2本で1つのフレーム", "よくあるまちがい", "コツ", "できたときの感覚"],
  })),
  {
    id: "ds_series", name: "連続重音", cat: "both", tag: ds("連続重音"), figType: "fb",
    figs: [
      { fingers: [[1, 1], [2, 3]], arrow: [140, 280] },
      { fingers: [[1, 1], [2, 3]], cross: true },
      { fingers: [[1, 1], [2, 3]], arrow: [140, 280] },
    ],
    texts: [
      "重音が<b>2つ以上つづく</b>パッセージだよ。和音の階段をのぼるイメージ。",
      "1つの重音フレームを保ったまま、<b>形ごと次の場所へ運ぶ</b>。弓は2弦の角度をキープ。",
      "音ごとに指をバラバラに置き直すと、つなぎ目で音がとぎれてしまう。",
      "次の重音の<b>形を先に準備</b>してから移る。「形→移動→形」のくり返し。",
      "重音の列がなめらかにつながって聞こえたら成功!",
    ],
    terms: ["連続重音", "形ごと運ぶ", "よくあるまちがい", "コツ", "できたときの感覚"],
  },
  {
    id: "slur", name: "スラー", cat: "bow", tag: tech("スラー"), figType: "bow",
    figs: [{ zone: "whole", dir: "down" }, { zone: "whole", cross: true }, { zone: "whole", dir: "down" }],
    texts: [
      "<b>1弓で複数の音</b>をなめらかにつなげる技術。弧の線が印だよ。",
      "弓は<b>一定の速さ</b>のまま、左手だけが動く。",
      "音が変わる瞬間に弓が揺れたり止まったりするのがまちがい。",
      "弓の<b>配分を先に決める</b>。2音なら半分ずつ、って感じ。",
      "音がひと息でつながって聞こえたら成功!",
    ],
    terms: ["スラー", "弓は一定速度", "よくあるまちがい", "コツ", "できたときの感覚"],
  },
  {
    id: "pizzicato", name: "ピチカート", cat: "bow", tag: tech("ピチカート"), figType: "fb",
    figs: [{ pluck: true }, { pluck: true, cross: true }, { pluck: true }],
    texts: [
      "弓を使わずに、<b>指で弦をはじく</b>奏法だよ。",
      "右手人差しゆびの<b>腹</b>で、指板の端あたりをはじく。",
      "爪で引っかけると、かたい音になっちゃう。",
      "ゆびの腹で「<b>つまんで、はなす</b>」。",
      "ポンとまるい音が鳴ったら成功!",
    ],
    terms: ["ピチカート", "ゆびの腹ではじく", "よくあるまちがい", "コツ", "できたときの感覚"],
  },
]

export const LESSON_BY_ID = new Map(LESSONS.map((l) => [l.id, l]))
export const LESSON_TOTAL = LESSONS.length // 23

/** 3回いっしょに弾こう画面の掛け声 (クリアまで固定3種) */
export const FEEDBACK = (name: string): [string, string, string] => [
  `いいね!${name}の感覚、つかめてきた?`,
  "その調子!だんだん形になってきたよ",
  "3回目、いこう。力を抜いて、ていねいに",
]

/** タグ→レッスンの逆引き (曲詳細の誘導などで使用) */
export const LESSON_BY_TAG = new Map(
  LESSONS.map((l) => [`${l.tag.tagType}:${l.tag.tagKey}`, l]),
)
