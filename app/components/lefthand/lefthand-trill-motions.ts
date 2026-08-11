/**
 * Arcoda 左手 — トリルのモーション
 *
 * 【設計】
 * トリルは「主音を押さえたまま、上の指を上げ下げする」＝**2つの指パターンの交替**。
 * 手はまったく動かない。d は固定。
 *
 * ⚠️ 交替は **step-end（補間しない）**。トリルは瞬間的な打鍵であり、
 *    クロスフェードすると指がブレて見える。
 *
 * 【指の「上げ方」は2通りある — 監修判断が要る】
 *   liftStyle: "hover"  … 浮かせ指（規約どおり・物理的に正確）
 *       開放弦の状態そのもの。上下の差は「爪の短縮（中心y 294↔276）と DIP しわの有無」だけで、
 *       指本体は 1px も動かない。**トリル速度では動きがほとんど見えない。**
 *   liftStyle: "raised" … 立て指（動きが明確）
 *       指本体が立ち上がるので変化量が約6倍。ただし「立て指」は本来
 *       「使わない指を立てる」表現であり、教則的な正しさは監修で判断すること。
 */

import { POSITIONS, type FingerPatternId, type PositionId } from "./lefthand-geometry";

/* ============================================================
   型定義
   ============================================================ */

export type TrillLiftStyle = "hover" | "raised";

export interface TrillDef {
  id: string;
  label: string;
  /** トリルを行うポジション */
  position: PositionId;
  /** 主音 */
  lower: FingerPatternId;
  /** 補助音。liftStyle ごとに 2 種類持つ */
  upper: Record<TrillLiftStyle, FingerPatternId>;
  /** 交替回数・上げ下げを 1 回と数える */
  alternations: number;
  /** 1 ループの長さ */
  dur: number;
  description: string;
}

/* ============================================================
   確定データ

   v1 のスコープは「0の指 ⇔ 1の指」のみ。
   他のトリルも既存の指パターンだけで組めるので、必要になったらここに足す:
     1 ⇔ 2 : lower "f12"   / upper "f1_up2"
     2 ⇔ 3 : lower "f123"  / upper "f12_up3"
     3 ⇔ 4 : lower "f1234" / upper "f123_up4"   ← ⚠️ f123_up4 は未作成
   ============================================================ */

export const TRILLS: Record<string, TrillDef> = {
  "0-1": {
    id: "0-1",
    label: "トリル 0の指 ⇔ 1の指",
    position: "1st",
    lower: "f1",
    upper: { hover: "open", raised: "up1" },
    alternations: 12,
    dur: 3.0,
    description:
      "1の指だけを上げ下げして開放弦と交替する。手も他の指も動かさない。",
  },
};

export function getTrill(id: string): TrillDef | undefined {
  return TRILLS[id];
}

/** そのトリルで手が置かれる d */
export const trillD = (t: TrillDef) => POSITIONS[t.position].d;

/* ============================================================
   CSS 生成

   主音レイヤと補助音レイヤの opacity を step-end で交替させるだけ。
   ⚠️ transform は一切アニメーションさせない（手も指塊も動かない）。
   ============================================================ */

/** 前後の「溜め」の割合 */
const HOLD = 0.18;

/** 交替の keyframes を作る。phase=0 が主音、phase=1 が補助音 */
function toggleKeyframes(t: TrillDef, phase: 0 | 1): string {
  const steps = t.alternations * 2;
  const span = 1 - HOLD * 2;
  const rows: string[] = [`  0% { opacity: ${phase === 0 ? 1 : 0}; }`];
  for (let i = 0; i < steps; i += 1) {
    const at = (HOLD + (span * i) / steps) * 100;
    const up = i % 2 === 1; // 奇数ステップで指を上げる
    const v = phase === 0 ? (up ? 0 : 1) : up ? 1 : 0;
    rows.push(`  ${Math.round(at * 100) / 100}% { opacity: ${v}; }`);
  }
  rows.push(`  ${(1 - HOLD) * 100}% { opacity: ${phase === 0 ? 1 : 0}; }`);
  rows.push(`  100% { opacity: ${phase === 0 ? 1 : 0}; }`);
  return rows.join("\n");
}

/**
 * 1 つのトリルに必要な CSS を生成する。
 * @param uid useId() 等で得た一意な識別子
 */
export function trillCSS(t: TrillDef, uid: string): string {
  // ⚠️ step-end。linear にすると指がブレる。
  const anim = (n: string) => `${n}-${uid} ${t.dur}s step-end infinite`;
  return `
@keyframes lh-trill-lower-${uid} {
${toggleKeyframes(t, 0)}
}
@keyframes lh-trill-upper-${uid} {
${toggleKeyframes(t, 1)}
}

.lh-${uid} .lh-trill-lower { animation: ${anim("lh-trill-lower")}; }
.lh-${uid} .lh-trill-upper { animation: ${anim("lh-trill-upper")}; }

/* 停止状態では主音を押さえた静止画として正しく表示される */
.lh-${uid}.is-paused * { animation-play-state: paused !important; }

@media (prefers-reduced-motion: reduce) {
  .lh-${uid} * { animation: none !important; }
}
`.trim();
}
