/**
 * Arcoda 左手 — ビブラートのモーション（正解 / ミス）
 *
 * 【設計の核 — d の一元管理】
 * ビブラートは「d を小さく振動させる」だけ。ポジション移動・グリッサンドと同じ軸に乗る。
 *
 * 【⚠️ 親指は支点。動いてはならない】
 * HAND_PATH は掌＋親指＋前腕が融合した単一パス。handTransform(d) で動かすと
 * **親指まで動いてしまう**。ビブラートの親指はネックに触れた支点であり、不動でなければならない。
 *
 * そこで手は **群 transform を基準音の位置に固定**し、
 * **パスの節点だけ**を追従率つきでずらす（`handPathPivotThumb(delta)`）。
 * 親指の先端は w = 0 なので 1px も動かない。
 *
 * ⚠️ この `d` 属性のアニメーションは CSS では書けない（`d: path()` は対応環境が限られる）。
 *    ビブラートは **SMIL 駆動**にしてある。
 *
 * 【正解】
 *   掌が指と **一緒に** 揺れる（handRatio 1.0）。親指は不動。正弦波・4.5Hz・30セント。
 *
 * 【ミス: 手が固まって指だけが動く】
 *   handRatio 0（手が完全に静止）。
 *   さらに「手が固まった結果として起きること」を重ねてある:
 *
 *     ① 掌が固まる（親指はもともと不動） … handRatio 0
 *     ② 音程が揺れすぎる     … cents 60（指を滑らせて音程を作るため）
 *     ③ 速く硬い            … rate 7Hz（手首が使えず、指の小さい筋肉だけで振る）
 *     ④ 折り返しが鋭い       … waveform "sharp"（こわばり）
 *
 *   ⚠️ 単一変数の比較ではない。**ミスを顕著に見せるための意図的な設計**であり、
 *      「1 つだけ崩す」原則をここでは適用していない（監修判断・2026-07-14）。
 *      振幅だけを上げてもミスは目立たない（指の塊が小さく、変化量が 8,691→10,690px
 *      にしか増えない）。②③④を重ねて初めて「明らかにおかしい」動きになる。
 *
 * ⚠️ 手を **回転させてはならない**。左手アセットには「前腕を回転させてはならない」
 *    （手ごと回転すると掌がネック下縁から浮き、指と掌が分断される）という不変条件があり、
 *    回転した手のパスも元絵に存在しない。
 *
 * 【基準音は上端】
 * 指を糸巻側へ転がすと弦長が伸びて音程が下がる。したがって
 * **d は基準音から下へ揺れて戻る。基準音を超えて上には行かない。**
 * 「音程の上下に均等に揺れる」実装をしてはならない（音程が上ずって聞こえる）。
 */

import {
  POSITIONS,
  THUMB_PIVOT_FOLLOW,
  fingerTransform,
  handPathPivotThumb,
  handCreasesPivotThumb,
  type PositionId,
} from "./lefthand-geometry";

/* ============================================================
   セント ⇔ px の換算

   元絵の実測: 2nd(68) → 3rd(170) は 102px で、これが全音（200セント）。
   したがって 3rd 付近では 0.51 px/セント。

   ⚠️ この換算は **3rd 付近でのみ有効**。元絵の指配置は物理的な弦長モデルに
      従っておらず（移動量は 68 / 102 / 102 / 68 / 51 と等間隔でない）、
      他のポジションでは px/セント が変わる。
      **他ポジションでビブラートを作るときは、その場の隣接ポジション間隔から
        改めて換算し直すこと。定数を流用してはならない。**
   ============================================================ */

/** そのポジション付近の px/セント（隣接ポジション間 = 全音 = 200セント として算出） */
export function pxPerCent(p: PositionId): number {
  const order: PositionId[] = ["1st", "2nd", "3rd", "4th", "5th", "6th"];
  const i = order.indexOf(p);
  const lo = order[Math.max(i - 1, 0)];
  const hi = order[Math.min(i + 1, order.length - 1)];
  const span = POSITIONS[hi].d - POSITIONS[lo].d;
  const steps = order.indexOf(hi) - order.indexOf(lo);
  return span / steps / 200;
}

/* ============================================================
   型
   ============================================================ */

export interface VibratoDef {
  id: string;
  label: string;
  /** 基準音のポジション（＝ d の上端） */
  position: PositionId;
  /** 揺れ幅（セント。基準音より下へ） */
  cents: number;
  /** 速さ（Hz） */
  rate: number;
  /**
   * 掌の振幅 / 指の振幅。**親指はどちらの場合も不動**（支点）。
   * 1.0 = 掌が指と一緒に揺れる（正解） ／ 0 = 掌も固まる（ミス）
   */
  handRatio: number;
  /**
   * 揺れの波形。
   * "sine"  = 正弦波。折り返しが柔らかい（正しいビブラート）
   * "sharp" = 三角波。折り返しが鋭く、こわばって見える（ミス）
   */
  waveform: "sine" | "sharp";
  description: string;
}

/* ============================================================
   確定データ

   正しいビブラート: ±30セント / 6Hz（3rd・1の指）
   ⚠️ cents / rate はバイオリン専門家の監修値。書き換えるときは再監修が必要。
   ============================================================ */

export const VIBRATOS: Record<string, VibratoDef> = {
  "3rd-ok": {
    id: "3rd-ok",
    label: "ビブラート（3rdポジション・正解）",
    position: "3rd",
    cents: 30,        // ±30セント
    rate: 4.5,        // 4.5Hz
    handRatio: 1,     // 手と指が一緒に揺れる
    waveform: "sine", // 折り返しが柔らかい
    description:
      "手と指が一緒に揺れる。折り返しが柔らかく、指の関節が保たれ、音に響きが乗る。",
  },
  "3rd-stiff-hand": {
    id: "3rd-stiff-hand",
    label: "ビブラート（ミス：手が固まって指だけが動く）",
    position: "3rd",
    cents: 60,         // ② 指を滑らせて音程を作るので揺れすぎる（正解の2倍）
    rate: 7,           // ③ 手首が使えず、指の小さい筋肉だけで振るので速く硬い
    handRatio: 0,      // ① ミスの本体：手が完全に静止する
    waveform: "sharp", // ④ 折り返しが鋭く、こわばって見える
    description:
      "手が固まったまま指だけが揺れる。指を滑らせて音程を作るので揺れすぎ、" +
      "動きは速く硬い。指の関節がつぶれ、音に響きが乗らない。",
  },
};

export function getVibrato(id: string): VibratoDef | undefined {
  return VIBRATOS[id];
}

/** 基準音の d（＝ d の上端） */
export const vibratoNoteD = (v: VibratoDef) => POSITIONS[v.position].d;

/** 指の揺れ幅（px） */
export const vibratoAmplitude = (v: VibratoDef) =>
  Math.round(v.cents * pxPerCent(v.position));

/** 掌の揺れ幅（px）。handRatio = 0 のミスでは 0。**親指は常に 0** */
export const vibratoHandAmplitude = (v: VibratoDef) =>
  vibratoAmplitude(v) * v.handRatio;

/** 1 周期の長さ（秒） */
export const vibratoDuration = (v: VibratoDef) => 1 / v.rate;

/* ============================================================
   キーフレーム

   d(t) = noteD - amp × (1 - cos(2πt)) / 2

   ⚠️ 正弦波で刻むこと。2 点（上端・下端）を ease-in-out で往復させると
      頂点が尖り、機械的な揺れに見える。
   ============================================================ */

const STEPS = 24;

export interface VibratoKeyframe {
  /** 0-1 */
  t: number;
  /** 指のシフト量（px・絶対） */
  finger: number;
  /** 掌のずれ量（px・基準音からの相対）。0 = 基準音の位置。ミスでは常に 0 */
  palm: number;
}

/**
 * 揺れの形。t = 0 と 1 で基準音、t = 0.5 で最下点。どちらも 0 → 1 → 0 の単一の谷。
 *
 * ⚠️ "sine" では 2 点（上端・下端）を ease-in-out で往復させてはならない。頂点が尖る。
 *    24 分割の正弦波で刻むこと。
 */
const shape = (t: number, form: "sine" | "sharp") =>
  form === "sine"
    ? (1 - Math.cos(2 * Math.PI * t)) / 2   // 正弦波: 折り返しが柔らかい
    : 1 - Math.abs(2 * t - 1);              // 三角波: 折り返しが鋭い

const wave = (noteD: number, amp: number, t: number, form: "sine" | "sharp") =>
  Math.round((noteD - amp * shape(t, form)) * 100) / 100;

export function vibratoKeyframes(v: VibratoDef): VibratoKeyframe[] {
  const noteD = vibratoNoteD(v);
  const amp = vibratoAmplitude(v);
  const handAmp = vibratoHandAmplitude(v);
  return Array.from({ length: STEPS + 1 }, (_, i) => {
    const t = i / STEPS;
    return {
      t: Math.round(t * 1e4) / 1e4,
      finger: wave(noteD, amp, t, v.waveform),
      palm: wave(0, handAmp, t, v.waveform),   // 基準音からの相対（0 または負）
    };
  });
}

/* ============================================================
   不変条件（改変したら必ず確認）
   ============================================================ */

export function assertVibrato(v: VibratoDef): void {
  const kf = vibratoKeyframes(v);
  const noteD = vibratoNoteD(v);
  const fs = kf.map((f) => f.finger);
  const ps = kf.map((f) => f.palm);

  // 1. 指も掌も基準音を超えて上に行かない（上ずり禁止）
  if (Math.max(...fs) > noteD + 1e-6) {
    throw new Error(
      `${v.id}: 指の d が基準音（${noteD}）を超えている。ビブラートは基準音から下へ揺れる。`,
    );
  }
  if (Math.max(...ps) > 1e-6) {
    throw new Error(`${v.id}: 掌が基準音より駒側へ出ている。`);
  }
  // 2. ループの継ぎ目で跳ばない
  if (Math.abs(fs[0] - fs[fs.length - 1]) > 1e-6 || Math.abs(ps[0] - ps[ps.length - 1]) > 1e-6) {
    throw new Error(`${v.id}: 先頭と末尾が一致していない。ループの継ぎ目で跳ぶ。`);
  }
  // 3. 指の揺れ幅が指定どおり
  const amp = vibratoAmplitude(v);
  if (Math.abs(noteD - Math.min(...fs) - amp) > 0.5) {
    throw new Error(`${v.id}: 指の揺れ幅が ${v.cents}セント（${amp}px）と一致していない。`);
  }
  // 4. handRatio は 0〜1
  if (v.handRatio < 0 || v.handRatio > 1) {
    throw new Error(
      `${v.id}: handRatio は 0〜1。手が指より大きく動くことはない（1 を超えると腕が先走る）。`,
    );
  }
  // 5. 掌は指を追い越さない
  if (vibratoHandAmplitude(v) > amp + 1e-6) {
    throw new Error(`${v.id}: 掌の振幅が指を超えている。`);
  }
  // 6. 親指は支点。追従率 0 の節点が存在しなければならない
  if (!Object.values(THUMB_PIVOT_FOLLOW).includes(0)) {
    throw new Error("親指の支点（追従率 0 の節点）が失われている。親指が動いてしまう。");
  }
  // 7. 指の揺れが単一の谷（山が 2 つあると二重振動になる）
  const lowIdx = fs.indexOf(Math.min(...fs));
  const down = fs.slice(0, lowIdx + 1);
  const up = fs.slice(lowIdx);
  if (down.some((d, i) => i > 0 && d > down[i - 1] + 1e-6)) {
    throw new Error(`${v.id}: 下降中に戻っている。1 周期は「下がって戻る」1 回だけ。`);
  }
  if (up.some((d, i) => i > 0 && d < up[i - 1] - 1e-6)) {
    throw new Error(`${v.id}: 上昇中に戻っている。1 周期は「下がって戻る」1 回だけ。`);
  }
}

/* ============================================================
   SMIL 値の生成

   ⚠️ 掌の動きは path の `d` の変化として現れる（親指の節点だけ動かさないため）。
      CSS の `d: path()` は対応環境が限られるので、**ビブラートは SMIL 駆動**。
   ⚠️ 指の transform と掌の d は **同一の keyTimes** を共有すること。
      別々にすると指と掌がずれる。
   ============================================================ */

export interface SmilTiming {
  keyTimes: string;
  keySplines: string;
  dur: string;
}

export function smilTiming(v: VibratoDef): SmilTiming {
  const kf = vibratoKeyframes(v);
  return {
    keyTimes: kf.map((f) => f.t).join(";"),
    keySplines: kf.slice(0, -1).map(() => "0 0 1 1").join(";"),
    dur: `${vibratoDuration(v)}s`,
  };
}

/** 指の translate（"x y" のペア） */
export const fingerValues = (v: VibratoDef) =>
  vibratoKeyframes(v)
    .map((f) => {
      const m = /translate\(([^,]+), *([^)]+)\)/.exec(fingerTransform(f.finger))!;
      return `${m[1]} ${m[2]}`;
    })
    .join(";");

/** 手のパス（親指は不動・掌だけがずれる） */
export const handPathValues = (v: VibratoDef) =>
  vibratoKeyframes(v).map((f) => handPathPivotThumb(f.palm)).join(";");

/** 手のしわ（i 番目） */
export const handCreaseValues = (v: VibratoDef, i: number) =>
  vibratoKeyframes(v).map((f) => handCreasesPivotThumb(f.palm)[i]).join(";");
