/**
 * bowing-mistake-motions.ts
 *
 * 運弓のミスパターン。正しい運弓（bowing-motions.ts）と同じ型・同じ h の設計に乗る。
 *
 * 【設計の核 — h の一元管理】
 * ミスも「毛のどの位置が弦に接しているか」＝ h の時系列だけで定義する。
 * 正しい運弓と同じジェネレータ（sideKeyframes / violinKeyframes / contactKeyframes）が
 * そのまま使えるため、2 ビューは構造的に同期する。
 *
 * > ビューごとに動きを作り込んではならない。
 */

import type { BowingTechnique, BowKeyframe } from "./bowing-motions";
// 毛の可視範囲は violin-geometry.ts が真実（30 = 弓先 / 316 = フロッグ側）。
// 指示書 §3 commit1-② に従い、ローカル定義を廃し import に一本化（値の二重管理を避ける）。
import { HAIR_VISIBLE_MIN, HAIR_VISIBLE_MAX } from "./violin-geometry";

const k = (t: number, h: number, lift = 0): BowKeyframe => ({ t, h, lift });

/* ============================================================
   型
   ============================================================ */

export interface BowingMistake extends BowingTechnique {
  /** 何の技法のミスか（正しい方の id） */
  correctOf: string;
  /** 何が崩れているか */
  faults: string[];
  /** 教則上の要点 */
  lesson: string;
}

/* ============================================================
   トレモロ「弓の位置が定まらない」

   【元データ = ストローク列】
   1 ストロークを「(移動量 Δh, 弓速 px/秒)」で定義する。
   移動量と弓速を 1 本ずつ変えることで、次の 3 つが**同時に**崩れる:

     ① 使う場所がふらつく   … 中弓位置が 145〜208 の間をドリフト（63px）
     ② ストロークの長さがバラバラ … 振幅 6〜60px（10 倍のばらつき）
     ③ 速さもバラバラ       … 弓速 90〜330 px/秒（3.7 倍のばらつき）

   正しいトレモロ: 振幅 12px 一定 ／ 弓速 92 px/秒 一定 ／ 中弓 172 固定

   ⚠️⚠️ 仕様書 §7-3 の受け入れ基準に「トレモロ: h の中心が中弓（≈172）にある」がある。
        **これは正しいトレモロに対する基準であり、本ミスは①として意図的にこれを破る。**
        「中心がずれているから直す」ことをしてはならない。
        （なお全ストロークの平均中心は 177 で中弓付近に留まる。ドリフトの範囲が問題なのであって、
          弓の別の場所に移動しているわけではない）

   ⚠️ 移動量の総和は必ず 0 にすること。0 でないとループの継ぎ目で弓が跳ぶ。
   ⚠️ 移動量の符号は必ず交互にすること。同符号が続くと「弓を返していない」ことになり、
      トレモロではなく**連続スタッカート**（一弓で4音刻む・仕様書 §9-3）の動きになってしまう。
   ⚠️ alternate は false。左右非対称なので往復再生してはならない。
   ============================================================ */

/** [移動量 Δh, 弓速 px/秒]。下降(-) と上昇(+) が交互に並ぶ */
export const UNSTABLE_STROKES: ReadonlyArray<readonly [number, number]> = [
  [-22, 140], [14, 110], [-48, 300], [30, 130], [-10, 100], [8, 95],
  [-52, 320], [40, 150], [-12, 105], [6, 90], [-11, 100], [60, 330],
  [-30, 140], [15, 110], [-9, 95], [45, 300], [-42, 200], [18, 120]
] as const;

export const BOWING_MISTAKES: BowingMistake[] = [
  {
    id: "tremolo-unstable",
    correctOf: "tremolo",
    name: "トレモロ（弓の位置が定まらない）",
    desc: "使う場所も、ストロークの長さも、速さもバラバラ",
    faults: [
      "中弓位置が 63px ドリフトする（正しくは 172 に固定）",
      "振幅が 6〜60px でばらつく（正しくは 12px 一定）",
      "弓速が 90〜330 px/秒でばらつく（正しくは 92 px/秒 一定）",
    ],
    lesson:
      "トレモロは中弓の狭い一点で、一定の振幅・一定の速さで刻む。" +
      "場所がふらつき、長さと速さがばらつくと、粒が揃わずトレモロに聞こえない。",
    duration: 2.72,
    alternate: false,   // ⚠️ 左右非対称。alternate にすると逆再生されて別の動きになる
    hasBounce: false,   // トレモロは接弦したまま。跳ねない
    keyframes: [
      k(0, 205), k(5.78, 183), k(10.47, 197), k(16.36, 149),
      k(24.85, 179), k(28.53, 169), k(31.63, 177), k(37.62, 125),
      k(47.43, 165), k(51.64, 153), k(54.09, 159), k(58.14, 148),
      k(64.83, 208), k(72.72, 178), k(77.74, 193), k(81.23, 184),
      k(86.75, 229), k(94.48, 187), k(100, 205)
    ],
  },
];

export const getBowingMistake = (id: string): BowingMistake | undefined =>
  BOWING_MISTAKES.find((m) => m.id === id);

/* ============================================================
   計測（検証・表示用）

   ミスの「崩れ具合」を数値で出せるようにしておく。
   これがないと、ミスの度合いが恣意的になる。
   ============================================================ */

/** 各ストロークの振幅（px） */
export const strokeSpans = (t: BowingTechnique): number[] =>
  t.keyframes.slice(1).map((f, i) => Math.abs(f.h - t.keyframes[i].h));

/** 各ストロークの弓速（px/秒） */
export const strokeSpeeds = (t: BowingTechnique): number[] =>
  t.keyframes.slice(1).map((f, i) => {
    const prev = t.keyframes[i];
    const sec = ((f.t - prev.t) / 100) * t.duration;
    return sec > 0 ? Math.abs(f.h - prev.h) / sec : 0;
  });

/** 各ストロークの中点（＝そのとき弓のどこを使っているか） */
export const strokeCenters = (t: BowingTechnique): number[] =>
  t.keyframes.slice(1).map((f, i) => (f.h + t.keyframes[i].h) / 2);

/** 中弓位置のドリフト幅（px）。0 = 常に同じ場所を使っている */
export const centerDrift = (t: BowingTechnique): number => {
  const c = strokeCenters(t);
  return Math.max(...c) - Math.min(...c);
};

/** 音符密度（音/秒）。1 ストローク = 1 音 */
export const noteRate = (t: BowingTechnique): number =>
  (t.keyframes.length - 1) / t.duration;

/* ============================================================
   不変条件（改変したら必ず確認）
   ============================================================ */

export function assertBowingMistake(m: BowingMistake): void {
  // 1. 接弦したまま（トレモロは離弦しない）
  if (m.keyframes.some((f) => f.lift !== 0)) {
    throw new Error(`${m.id}: トレモロは接弦したまま。lift は 0 でなければならない。`);
  }
  // 2. 接触点が毛の可視範囲を外れない
  const hs = m.keyframes.map((f) => f.h);
  if (Math.min(...hs) < HAIR_VISIBLE_MIN || Math.max(...hs) > HAIR_VISIBLE_MAX) {
    throw new Error(
      `${m.id}: 接触点が毛の可視範囲（${HAIR_VISIBLE_MIN}〜${HAIR_VISIBLE_MAX}）を外れている。`,
    );
  }
  // 3. ループの継ぎ目で弓が跳ばない
  if (m.keyframes[0].h !== m.keyframes[m.keyframes.length - 1].h) {
    throw new Error(`${m.id}: 最初と最後の h が一致していない。ループの継ぎ目で弓が跳ぶ。`);
  }
  // 4. 1 音ごとに弓を返している（＝ Δh の符号が交互）
  const deltas = m.keyframes.slice(1).map((f, i) => f.h - m.keyframes[i].h);
  for (let i = 1; i < deltas.length; i += 1) {
    if (Math.sign(deltas[i]) === Math.sign(deltas[i - 1])) {
      throw new Error(
        `${m.id}: ストローク ${i} で弓を返していない。` +
          `トレモロではなく連続スタッカート（id: bow-staccato）の動きになっている。`,
      );
    }
  }
  // 5. 非対称なので alternate 禁止
  if (m.alternate) {
    throw new Error(`${m.id}: 左右非対称。alternate にすると逆再生されて別の動きになる。`);
  }
}
