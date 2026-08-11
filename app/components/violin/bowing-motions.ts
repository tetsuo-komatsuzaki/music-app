/**
 * bowing-motions.ts
 *
 * 運弓モーションの単一の真実。
 *
 * 【設計の核】
 * 運弓を「毛のどの位置が弦に接しているか」という 1 つの数値 h の時系列で定義する。
 * この h だけから、弓単体ビュー／バイオリン+弓ビューの両方の座標変換が導出されるため、
 * 2 つのビューは構造的に同期する（ビューごとに動きを作り込まない）。
 *
 *   h    : 毛の局所x座標。30 = 弓先 / 316 = フロッグ側。**h が減る = ダウンボウ**
 *   lift : 弦から離れる量（弓単体ビューでのみ描画可能。正面図では奥行き方向のため描けない）
 */

export interface BowKeyframe {
  /** 0-100 (%) */
  t: number;
  /** 毛のどの位置が弦に接しているか */
  h: number;
  /** 離弦量。0 = 接弦 */
  lift: number;
}

export interface BowingTechnique {
  id: string;
  /** 技術タグ名 */
  name: string;
  desc: string;
  /** 1周期の秒数 */
  duration: number;
  /** true = 往復再生 */
  alternate: boolean;
  /** 離弦がある技法。接触点マーカーを点滅させる */
  hasBounce?: boolean;
  keyframes: BowKeyframe[];
}

const k = (t: number, h: number, lift = 0): BowKeyframe => ({ t, h, lift });

export const BOWING_TECHNIQUES: BowingTechnique[] = [
  {
    id: "detache",
    name: "デタシェ",
    desc: "中弓で滑らかに往復。常に弦に接触",
    duration: 1.6,
    alternate: true,
    keyframes: [k(0, 210), k(100, 130)],
  },

  {
    id: "legato",
    name: "レガート／スラー",
    desc: "全弓をゆっくり。一方向を長く",
    duration: 4.5,
    alternate: true,
    keyframes: [k(0, 305), k(100, 45)],
  },

  {
    /**
     * スタッカート: 1音ごとに弓を返す技法（ボウ・スタッカートとの決定的な違い）。
     *   ・接弦したまま（スピッカートと違い離弦しない。lift は常に 0）
     *   ・音と音の間で止まる
     *   ・1音ごとに弓の向きが反転する → h は往復する（一方向に進み続けない）
     * 1周期で ダウン → アップ → ダウン → アップ の 4 音。
     */
    id: "staccato",
    name: "スタッカート",
    desc: "1音ごとに弓を返す。接弦したまま止まりながら刻む",
    duration: 2.0,
    alternate: false,
    keyframes: [
      k(0, 205), k(6, 205),      // 停止
      k(20, 185), k(26, 185),    // ダウンボウの1音 → 停止
      k(40, 205), k(46, 205),    // アップボウの1音 → 停止
      k(60, 185), k(66, 185),    // ダウンボウの1音 → 停止
      k(80, 205), k(100, 205),   // アップボウの1音 → 停止
    ],
  },

  {
    /**
     * 連続スタッカート(旧称: ボウ・スタッカート)【2026-07-12改訂・教材データJSON準拠】:
     * ダウン4音→弓を返してアップ4音の往復周期。
     *   ・各弓区間内では h 単調(=一弓の中では返さない)
     *   ・lift は常に 0(接弦のまま)
     *   ・終点 h = 始点 h(往復ループ・継ぎ目に跳びなし)
     * id は互換維持のため旧名のまま変更しない(図解アセット仕様書v1.2 §9-6)。
     */
    id: "bow-staccato",
    name: "連続スタッカート",
    desc: "一弓で4音刻んで弓を返し、逆方向でも4音刻む",
    duration: 4.4,
    alternate: false,
    keyframes: [
      k(0, 300), k(4, 300),
      k(11, 270), k(14, 270),
      k(21, 240), k(24, 240),
      k(31, 210), k(34, 210),
      k(41, 180), k(50, 180),   // ← ここまでダウン4音
      k(54, 180),
      k(61, 210), k(64, 210),
      k(71, 240), k(74, 240),
      k(81, 270), k(84, 270),
      k(91, 300), k(100, 300),  // ← アップ4音で始点へ復帰
    ],
  },

  {
    /**
     * スピッカート: 1音ごとに弓を返す技法（リコシェとの決定的な違い）。
     * 弓先は楕円軌道を描く:
     *   ・ストロークの中央 = 接弦（lift 0）
     *   ・両端 = 方向転換点。ここでは必ず離弦している（lift 最大）
     *   ・h は一方向に進み続けず、158〜182 を往復する
     * 1周期で ダウン(25%) → アップ(75%) の 2 音。
     */
    id: "spiccato",
    name: "スピッカート",
    desc: "1音ごとに弓を返す。返しは空中で行う",
    duration: 0.8,
    alternate: false,
    hasBounce: true,
    keyframes: [
      k(0, 182, 17),                       // 空中・ダウンへ方向転換
      k(10, 177, 8),
      k(20, 173), k(25, 170), k(30, 167),  // 接弦：ダウンボウの1音
      k(40, 162, 9),
      k(50, 158, 17),                      // 空中・アップへ方向転換
      k(60, 162, 9),
      k(70, 167), k(75, 170), k(80, 173),  // 接弦：アップボウの1音
      k(90, 177, 8),
      k(100, 182, 17),
    ],
  },

  {
    /**
     * リコシェ【2026-07-12改訂・教材データJSON準拠】:
     * ダウン4跳ね(減衰)→空中で弓を返してアップ4跳ね(減衰)の往復周期。
     *   ・各跳ね群内で h 単調(=一弓の中では返さない)
     *   ・接地(lift=0)はちょうど4回×2群、跳ね高さは群内で減衰
     *   ・方向転換点(t=0/50/100)は必ず lift>0(空中)
     */
    id: "ricochet",
    name: "リコシェ",
    desc: "ダウン4跳ね→空中で返してアップ4跳ね",
    duration: 3.2,
    alternate: false,
    hasBounce: true,
    keyframes: [
      k(0, 200, 22),
      k(7, 186), k(13, 177, 14), k(19, 166), k(25, 158, 9), k(31, 150),
      k(36, 144, 5), k(42, 138),                 // ← ダウン群: 接地 186/166/150/138 の4回
      k(50, 140, 18),                            // ← 空中で方向転換(弓を返す)
      k(57, 152), k(63, 161, 12), k(69, 172), k(75, 180, 7), k(81, 188),
      k(86, 193, 4), k(92, 198),                 // ← アップ群: 接地 152/172/188/198 の4回
      k(100, 200, 22),
    ],
  },

  {
    /**
     * ポルタート【2026-07-12新規・教材データJSON準拠】:
     * 1音ずつ柔らかく弓を返す。接弦のまま(lift常に0)、
     * 停止はスタッカートより短い(柔らかい区切りの表現)。
     */
    id: "portato",
    name: "ポルタート",
    desc: "1音ずつ柔らかく弓を返す。止めずにゆるめる",
    duration: 3.2,
    alternate: false,
    keyframes: [
      k(0, 200), k(4, 200),
      k(22, 165), k(28, 165),
      k(46, 200), k(52, 200),
      k(70, 165), k(76, 165),
      k(94, 200), k(100, 200),
    ],
  },

  {
    /**
     * トレモロ【2026-07-12改訂・教材データJSON準拠】: 中弓で高速に微振動する。
     * 弓先である必要はない（毛の可視範囲 30〜316 の中央 ≈ 172 を中心に往復）。
     */
    id: "tremolo",
    name: "トレモロ",
    desc: "中弓で高速に微振動",
    duration: 0.13,
    alternate: true,
    keyframes: [k(0, 178), k(100, 166)],
  },
];

/**
 * レッスンid → 運弓モーションid (教材データJSON lessonMotionMap 準拠)。
 * JSON側のキー "bowstacc" は技法id "bow-staccato" のエイリアス
 * (図解アセット仕様書v1.2 §9-6: 表示名のみ改訂・idは変更しない)。
 */
export const LESSON_MOTION_MAP: Record<string, string> = {
  staccato: "staccato",
  bow_staccato: "bow-staccato", // JSON値 "bowstacc" のid正規化
  spiccato: "spiccato",
  ricochet: "ricochet",
  tremolo: "tremolo",
  portato: "portato",
  slur: "legato",
};

export const getTechnique = (id: string) =>
  BOWING_TECHNIQUES.find((t) => t.id === id) ?? BOWING_TECHNIQUES[0];

/* ============================================================
   キーフレーム → CSS
   ============================================================ */

/** 弓単体ビュー用 */
export const sideKeyframes = (t: BowingTechnique) =>
  t.keyframes
    .map(({ t: p, h, lift }) => `${p}%{transform:translate(${-h}px,${-lift}px)}`)
    .join("");

/** バイオリン+弓ビュー用 */
export const violinKeyframes = (t: BowingTechnique) =>
  t.keyframes.map(({ t: p, h }) => `${p}%{transform:translate(${-h}px,0)}`).join("");

/** 接触点マーカー用 */
export const contactKeyframes = (t: BowingTechnique) =>
  t.keyframes
    .map(({ t: p, lift }) => `${p}%{opacity:${lift > 0 ? 0.12 : 1}}`)
    .join("");
