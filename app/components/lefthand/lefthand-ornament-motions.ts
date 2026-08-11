/**
 * Arcoda 左手 — 装飾音のモーション（プラルトリラー / モルデント）
 *
 * 【設計の核】
 * 装飾音は「主音のパターン ⇔ 装飾のパターン」を**一度だけ**交替させるもの。
 * **手はまったく動かない**（d は基準音のポジションに固定）。
 *
 * ⚠️ 交替は **step-end（補間しない）**。装飾音は瞬間的な打鍵であり、
 *    クロスフェードすると指がブレて見える。
 *
 * 【指の上げ方（2026-07-14 監修判断）】
 * **正解は「浮かせ指」**。規約どおり、押弦と浮かせの差は「爪の短縮と DIP しわの有無」で表す。
 * **ミスは「立て指」**（f12_up3 / f1_up2）。指を高く立てる動作そのものがミスであり、
 * **立てすぎるから装飾が遅くなる**（原因と結果が 1 本につながる）。
 *
 *   プラルのミス   : 待機中に 3 の指を高く立てて構えてしまう … 主音側が f12_up3
 *   モルデントのミス: 外した 2 の指が高く跳ね上がる           … 装飾側が f1_up2
 *
 * 【基準音 = A線のド(C)】
 * A線・1stポジション・**低い2の指**。
 *   プラルトリラー（上）: ド → レ → ド   3の指を落とす   f12 → f123 → f12
 *   モルデント（下）    : ド → シ → ド   2の指を上げる   f12 → f1   → f12
 *
 * ⚠️ **上下を取り違えてはならない。**
 *    プラルトリラーは上（3の指を足す）、モルデントは下（2の指を外す）。
 *    パターンを入れ替えると、まったく別の装飾音になる。
 */

import { POSITIONS, type FingerPatternId, type PositionId } from "./lefthand-geometry";

/* ============================================================
   型
   ============================================================ */

export interface OrnamentDef {
  id: string;
  label: string;
  /** 手が置かれるポジション */
  position: PositionId;
  /** 主音の指パターン */
  main: FingerPatternId;
  /** 装飾音の指パターン */
  ornament: FingerPatternId;
  /** 拍頭から装飾に入るまで */
  onset: number;
  /** 装飾音を保つ時間 */
  hold: number;
  /** 1 音・＝ 1 ループの長さ */
  dur: number;
  /** ミスかどうか */
  isMistake: boolean;
  description: string;
}

/* ============================================================
   確定データ

   正解: 拍頭で主音を鳴らし、ただちに装飾へ入ってすばやく戻る
        （視認性のため 0.3 倍速に監修調整。開始 100ms / 装飾音 200ms）
   ミス: 指を高く立てるため、装飾に入るのが遅く（1.5倍）、装飾音が長すぎる（2倍）
        → 装飾ではなく「1つの音符」に聞こえてしまう

   ⚠️ onset / hold はバイオリン専門家の監修値。書き換えるときは再監修が必要。
   ============================================================ */

const NOTE_DUR = 2.0;

/**
 * 正解のタイミング。
 * ⚠️ 物理的な実速（30ms/60ms）ではアプリ上で視認できないため、
 *    **0.3 倍速（開始 100ms / 装飾音 200ms）に監修調整済み**（2026-07-14）。
 *    これ以上速くしてはならない（見えなくなる）。実速に「修正」してもならない。
 */
const OK = { onset: 0.1, hold: 0.2 };
/** ミスのタイミング */
const SLOW = { onset: 0.15, hold: 0.4 };

function ornament(
  id: string,
  label: string,
  main: FingerPatternId,
  orn: FingerPatternId,
  timing: { onset: number; hold: number },
  isMistake: boolean,
  description: string,
): OrnamentDef {
  return {
    id,
    label,
    position: "1st",
    main,
    ornament: orn,
    onset: timing.onset,
    hold: timing.hold,
    dur: NOTE_DUR,
    isMistake,
    description,
  };
}

export const ORNAMENTS: Record<string, OrnamentDef> = {
  "pralltriller-ok": ornament(
    "pralltriller-ok", "プラルトリラー", "f12", "f123", OK, false,
    "ド → レ → ド。3の指を落とす。拍頭でただちに、すばやく装飾する。",
  ),
  "pralltriller-slow": ornament(
    // ミス: 待機中に 3 の指を高く立てて構える（f12_up3）。立てているぶん落とすのが遅れる
    "pralltriller-slow", "プラルトリラー", "f12_up3", "f123", SLOW, true,
    "3の指を高く立てて構えるため、装飾に入るのが遅く長すぎる。装飾ではなく1つの音符に聞こえる。",
  ),
  "mordent-ok": ornament(
    "mordent-ok", "モルデント", "f12", "f1", OK, false,
    "ド → シ → ド。2の指を上げる。拍頭でただちに、すばやく装飾する。",
  ),
  "mordent-slow": ornament(
    // ミス: 外した 2 の指が高く跳ね上がる（f1_up2）。高く上げたぶん戻すのが遅れる
    "mordent-slow", "モルデント", "f12", "f1_up2", SLOW, true,
    "外した2の指が高く跳ね上がるため、装飾が長すぎる。装飾ではなく1つの音符に聞こえる。",
  ),
};

export function getOrnament(id: string): OrnamentDef | undefined {
  return ORNAMENTS[id];
}

/** 手が置かれる d */
export const ornamentD = (o: OrnamentDef) => POSITIONS[o.position].d;

/* ============================================================
   計測（検証・表示用）
   ============================================================ */

/** 装飾音が 1 音に占める割合・%。大きいほど「もたついている」 */
export const ornamentShare = (o: OrnamentDef) => (o.hold / o.dur) * 100;

/** 正解に対する遅さの倍率 */
export const slownessVsCorrect = (o: OrnamentDef) => ({
  onset: o.onset / OK.onset,
  hold: o.hold / OK.hold,
});

/* ============================================================
   不変条件（改変したら必ず確認）
   ============================================================ */

export function assertOrnament(o: OrnamentDef): void {
  // 1. 装飾は 1 音の中に収まる
  if (o.onset + o.hold >= o.dur) {
    throw new Error(`${o.id}: 装飾が音の長さを超えている。装飾は音の頭に置く。`);
  }
  // 2. 主音と装飾音は別のパターン
  if (o.main === o.ornament) {
    throw new Error(`${o.id}: 主音と装飾音が同じパターン。装飾になっていない。`);
  }
  // 3. 上下を取り違えていない
  //    プラルトリラー = 上（指を足す） / モルデント = 下（指を外す）
  //    立て指パターンは「押さえている指の数」で数える（立てた指は押さえていない）
  const fingersOf: Record<string, number> = {
    f1: 1, f12: 2, f123: 3, f1234: 4, f1_up2: 1, f12_up3: 2,
  };
  const delta = (fingersOf[o.ornament] ?? 0) - (fingersOf[o.main] ?? 0);
  if (o.id.startsWith("pralltriller") && delta <= 0) {
    throw new Error(`${o.id}: プラルトリラーは**上**。装飾音で指を足すこと・f12 → f123。`);
  }
  if (o.id.startsWith("mordent") && delta >= 0) {
    throw new Error(`${o.id}: モルデントは**下**。装飾音で指を外すこと・f12 → f1。`);
  }
  // 4. 正解は装飾音が十分に短い（0.3倍速の監修調整後で 1 音の 10%）
  if (!o.isMistake && ornamentShare(o) > 10) {
    throw new Error(
      `${o.id}: 装飾音が長すぎる・1音の ${ornamentShare(o).toFixed(1)}%。` +
        `装飾は瞬間的でなければ、装飾に聞こえない。`,
    );
  }
}

/* ============================================================
   CSS 生成

   主音レイヤと装飾レイヤの opacity を step-end で切り替えるだけ。
   ⚠️ transform は一切アニメーションさせない（手も指塊も動かない）。
   ============================================================ */

export function ornamentCSS(o: OrnamentDef, uid: string): string {
  const t0 = (o.onset / o.dur) * 100;
  const t1 = ((o.onset + o.hold) / o.dur) * 100;
  const r = (v: number) => Math.round(v * 1000) / 1000;

  const kf = (mainOn: boolean) => {
    const on = mainOn ? 1 : 0;
    const off = mainOn ? 0 : 1;
    return [
      `  0% { opacity: ${on}; }`,
      `  ${r(t0)}% { opacity: ${off}; }`,
      `  ${r(t1)}% { opacity: ${on}; }`,
      `  100% { opacity: ${on}; }`,
    ].join("\n");
  };

  // ⚠️ step-end。linear にすると指がブレる。
  const anim = (n: string) => `${n}-${uid} ${o.dur}s step-end infinite`;
  return `
@keyframes lh-orn-main-${uid} {
${kf(true)}
}
@keyframes lh-orn-aux-${uid} {
${kf(false)}
}

.lh-${uid} .lh-orn-main { animation: ${anim("lh-orn-main")}; }
.lh-${uid} .lh-orn-aux  { animation: ${anim("lh-orn-aux")}; }

/* 停止状態では主音を押さえた静止画として正しく表示される */
.lh-${uid}.is-paused * { animation-play-state: paused !important; }

@media (prefers-reduced-motion: reduce) {
  .lh-${uid} * { animation: none !important; }
}
`.trim();
}
