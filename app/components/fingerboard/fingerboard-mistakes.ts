/**
 * Arcoda 指板俯瞰図 — 重音ミスパターン（監修済み・2026-07-14）
 *
 * ミス2種 × 重音5レッスン。犠牲になる指は次の規則で導出し、監修を経ている:
 *   ① pull（引っ張られて音程が潰れる）
 *      両方押弦 → 番号の小さい指が釣られて上ずる（dir = +1）
 *      開放弦を含む → 押弦側が届かず下がる（dir = −1）
 *      ズレ量 = PULL_SEMITONES（0.6半音）。実弦長比でそのまま距離になる
 *   ② late（同時に置けない）
 *      番号の大きい指（置きにくい方）が LATE_SEC（0.25秒）遅れて着地。
 *      拍頭は破線ゴーストのみ
 *
 * ⚠️ PULL_SEMITONES / LATE_SEC / victims を書き換えてはならない（要再監修）。
 * ⚠️ 旋律（崩し弾き）部分は正常表示。ミスは和音イベントだけに出す。
 */
import { FB_LESSONS, type FbLesson } from "./fingerboard-lessons";

export const PULL_SEMITONES = 0.6;
export const LATE_SEC = 0.25;
export const MISS_COLOR = "#C0392B";

export interface PullVictim { event: number; note: number; dir: 1 | -1 }
export interface LateVictim { event: number; note: number }
export interface FbMistakeSet { lesson: string; pull: PullVictim[]; late: LateVictim[] }

/** event = 発音イベントの連番（休符を除く）。note = そのイベント内の音の添字 */
export const FB_MISTAKES: Record<string, FbMistakeSet> = {
  "double-3rd": {
    lesson: "double-3rd",
    pull: [{ event: 2, note: 0, dir: 1 }],
    late: [{ event: 2, note: 1 }],
  },
  "double-6th": {
    lesson: "double-6th",
    pull: [{ event: 2, note: 1, dir: 1 }],
    late: [{ event: 2, note: 0 }],
  },
  "double-octave": {
    lesson: "double-octave",
    pull: [{ event: 2, note: 1, dir: 1 }],
    late: [{ event: 2, note: 0 }],
  },
  "double-10th": {
    lesson: "double-10th",
    pull: [{ event: 2, note: 0, dir: -1 }],
    late: [{ event: 2, note: 0 }],
  },
  "double-series": {
    lesson: "double-series",
    pull: [{ event: 0, note: 1, dir: -1 }, { event: 1, note: 0, dir: 1 }, { event: 2, note: 0, dir: 1 }, { event: 3, note: 0, dir: 1 }],
    late: [{ event: 0, note: 1 }, { event: 1, note: 1 }, { event: 2, note: 1 }, { event: 3, note: 1 }],
  },
};

export function assertFbMistakes(): void {
  for (const ms of Object.values(FB_MISTAKES)) {
    const l: FbLesson | undefined = FB_LESSONS[ms.lesson];
    if (!l) throw new Error(`${ms.lesson}: レッスンが存在しない`);
    const pitched = l.events.filter((e) => e.notes.length > 0);
    const chords = pitched.map((e, i) => [i, e] as const).filter(([, e]) => e.notes.length === 2);
    // 1. 全ての和音にミス定義がある（旋律には無い）
    for (const arr of [ms.pull, ms.late]) {
      if (arr.length !== chords.length) throw new Error(`${ms.lesson}: 和音数とミス数が不一致`);
      for (const v of arr) {
        const ev = pitched[v.event];
        if (!ev || ev.notes.length !== 2) throw new Error(`${ms.lesson}: 和音でないイベントにミス`);
        if (ev.notes[v.note].finger === 0) throw new Error(`${ms.lesson}: 開放弦は犠牲にできない`);
      }
    }
    // 2. pull の方向: 両方押弦なら +1（小さい指）、開放を含むなら −1（押弦側）
    for (const v of ms.pull) {
      const ns = pitched[v.event].notes;
      const open = ns.some((n) => n.finger === 0);
      if (open && v.dir !== -1) throw new Error(`${ms.lesson}: 開放を含む和音は届かず下がる(−1)`);
      if (!open) {
        const minF = Math.min(...ns.map((n) => n.finger));
        if (v.dir !== 1 || ns[v.note].finger !== minF)
          throw new Error(`${ms.lesson}: 両方押弦なら小さい指が上ずる(+1)`);
      }
    }
    // 3. late は番号の大きい指
    for (const v of ms.late) {
      const ns = pitched[v.event].notes;
      const maxF = Math.max(...ns.map((n) => n.finger));
      if (ns[v.note].finger !== maxF) throw new Error(`${ms.lesson}: 遅れるのは番号の大きい指`);
    }
  }
}
