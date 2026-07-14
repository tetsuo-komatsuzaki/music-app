/**
 * Arcoda 指板俯瞰図 — レッスンデータ（13本・確定値）
 *
 * MusicXML（学びのレッスン教材）から**機械生成**したもの。手書き転記はない。
 * 弦・指の割り当ては次の規則で導出し、バイオリン専門家の監修を経ている:
 *   A. 譜面の運指（fingering）は確定アンカー。直前の押弦と同じ弦を最優先
 *   B. グリッサンドは同一弦（終点の弦に始点を合わせる）。**指は1で確定**（監修指定）
 *   C. 和音に参加する音高は、崩して弾くときも和音の弦・指の形のまま
 *   D. それ以外は現在のポジション（F1〜F1+7）に収まる弦。開放弦は低ポジションのみ
 *   指の間隔は全音階的（≈1.7半音/指）。2半音均等にしてはならない
 *
 * seg = ポジション区間。**最初の押弦音で基準を確立**し、以降 F1 が変わるたびに +1。
 * 開放弦は手のポジションを定義しないため、基準の確立にも変化の検出にも使わない。
 *
 * ⚠️ ここの数値（string / finger / off / t / dur / seg）を書き換えてはならない。
 *    修正が必要なときは監修（導出表）に戻すこと。
 * ⚠️ トレモロ・連続スタッカートは**意図的に存在しない**（弓の技法であり、
 *    指板図としての情報がないため除外。監修判断 2026-07-14）。追加してはならない。
 */

import type { StringName } from "./fingerboard-geometry";

export interface FbNote {
  midi: number;
  string: StringName;
  /** 0 = 開放弦 */
  finger: number;
  /** 開放からの半音数 */
  off: number;
  /** カタカナ音名（表示用） */
  name: string;
}

export interface FbEvent {
  /** 開始秒（テンポ90・MusicXML の音価から機械算出） */
  t: number;
  dur: number;
  kind: "note" | "gliss-start" | "gliss-stop";
  /** ポジション区間（SEG_COLORS の添字） */
  seg: number;
  notes: FbNote[];
}

export interface FbLesson {
  id: string;
  title: string;
  /** true = 横長（単音・技法） / false = 縦型（重音） */
  horizontal: boolean;
  /** 演奏の全長（秒）。ループはこれ + 0.6s の間 */
  total: number;
  events: FbEvent[];
}

export const FB_LESSONS: Record<string, FbLesson> = {
  "pos-2nd": {
    id: "pos-2nd",
    title: "2ndポジション_2_",
    horizontal: true,
    total: 2.6667,
    events: [
      { t: 0, dur: 0.6667, kind: "note", seg: 0, notes: [{ midi: 69, string: "A", finger: 0, off: 0, name: "ラ" }] },
      { t: 0.6667, dur: 0.6667, kind: "note", seg: 0, notes: [{ midi: 71, string: "A", finger: 1, off: 2, name: "シ" }] },
      { t: 1.3333, dur: 1.3333, kind: "note", seg: 1, notes: [{ midi: 72, string: "A", finger: 1, off: 3, name: "ド" }] },
    ],
  },
  "pos-3rd": {
    id: "pos-3rd",
    title: "3rdポジション",
    horizontal: true,
    total: 2.6667,
    events: [
      { t: 0, dur: 0.6667, kind: "note", seg: 0, notes: [{ midi: 69, string: "A", finger: 0, off: 0, name: "ラ" }] },
      { t: 0.6667, dur: 0.6667, kind: "note", seg: 0, notes: [{ midi: 71, string: "A", finger: 1, off: 2, name: "シ" }] },
      { t: 1.3333, dur: 0.6667, kind: "note", seg: 0, notes: [{ midi: 72, string: "A", finger: 2, off: 3, name: "ド" }] },
      { t: 2, dur: 0.6667, kind: "note", seg: 1, notes: [{ midi: 74, string: "A", finger: 1, off: 5, name: "レ" }] },
    ],
  },
  "pos-4th": {
    id: "pos-4th",
    title: "4thポジション",
    horizontal: true,
    total: 5.3333,
    events: [
      { t: 0, dur: 0.6667, kind: "note", seg: 0, notes: [{ midi: 69, string: "A", finger: 0, off: 0, name: "ラ" }] },
      { t: 0.6667, dur: 0.6667, kind: "note", seg: 0, notes: [{ midi: 71, string: "A", finger: 1, off: 2, name: "シ" }] },
      { t: 1.3333, dur: 0.6667, kind: "note", seg: 0, notes: [{ midi: 72, string: "A", finger: 2, off: 3, name: "ド" }] },
      { t: 2, dur: 0.6667, kind: "note", seg: 0, notes: [{ midi: 74, string: "A", finger: 3, off: 5, name: "レ" }] },
      { t: 2.6667, dur: 2.6667, kind: "note", seg: 1, notes: [{ midi: 76, string: "A", finger: 1, off: 7, name: "ミ" }] },
    ],
  },
  "pos-5th": {
    id: "pos-5th",
    title: "5thポジション",
    horizontal: true,
    total: 5.3333,
    events: [
      { t: 0, dur: 0.6667, kind: "note", seg: 0, notes: [{ midi: 71, string: "A", finger: 1, off: 2, name: "シ" }] },
      { t: 0.6667, dur: 0.6667, kind: "note", seg: 0, notes: [{ midi: 72, string: "A", finger: 2, off: 3, name: "ド" }] },
      { t: 1.3333, dur: 0.6667, kind: "note", seg: 1, notes: [{ midi: 74, string: "A", finger: 1, off: 5, name: "レ" }] },
      { t: 2, dur: 0.6667, kind: "note", seg: 1, notes: [{ midi: 76, string: "A", finger: 2, off: 7, name: "ミ" }] },
      { t: 2.6667, dur: 2.6667, kind: "note", seg: 2, notes: [{ midi: 77, string: "A", finger: 1, off: 8, name: "ファ" }] },
    ],
  },
  "pos-6th": {
    id: "pos-6th",
    title: "6thポジション",
    horizontal: true,
    total: 5.3333,
    events: [
      { t: 0, dur: 0.6667, kind: "note", seg: 0, notes: [{ midi: 71, string: "A", finger: 1, off: 2, name: "シ" }] },
      { t: 0.6667, dur: 0.6667, kind: "note", seg: 0, notes: [{ midi: 72, string: "A", finger: 2, off: 3, name: "ド" }] },
      { t: 1.3333, dur: 0.6667, kind: "note", seg: 1, notes: [{ midi: 74, string: "A", finger: 1, off: 5, name: "レ" }] },
      { t: 2, dur: 0.6667, kind: "note", seg: 1, notes: [{ midi: 76, string: "A", finger: 2, off: 7, name: "ミ" }] },
      { t: 2.6667, dur: 0.6667, kind: "note", seg: 1, notes: [{ midi: 77, string: "A", finger: 3, off: 8, name: "ファ" }] },
      { t: 3.3333, dur: 2, kind: "note", seg: 2, notes: [{ midi: 79, string: "A", finger: 1, off: 10, name: "ソ" }] },
    ],
  },
  "glissando": {
    id: "glissando",
    title: "グリッサンド",
    horizontal: true,
    total: 2.6667,
    events: [
      { t: 0, dur: 2, kind: "gliss-start", seg: 0, notes: [{ midi: 84, string: "A", finger: 1, off: 15, name: "ド" }] },
      { t: 2, dur: 0.6667, kind: "gliss-stop", seg: 0, notes: [{ midi: 69, string: "A", finger: 0, off: 0, name: "ラ" }] },
    ],
  },
  "harmonics": {
    id: "harmonics",
    title: "ハーモニクス",
    horizontal: true,
    total: 5.3333,
    events: [
      { t: 0, dur: 0.6667, kind: "note", seg: 0, notes: [{ midi: 74, string: "A", finger: 1, off: 5, name: "レ" }] },
      { t: 0.6667, dur: 0.6667, kind: "note", seg: 0, notes: [{ midi: 76, string: "A", finger: 2, off: 7, name: "ミ" }] },
      { t: 1.3333, dur: 0.6667, kind: "note", seg: 0, notes: [{ midi: 77, string: "A", finger: 3, off: 8, name: "ファ" }] },
      { t: 2, dur: 0.6667, kind: "note", seg: 0, notes: [{ midi: 79, string: "A", finger: 4, off: 10, name: "ソ" }] },
      { t: 2.6667, dur: 2.6667, kind: "note", seg: 0, notes: [{ midi: 81, string: "E", finger: 1, off: 5, name: "ラ" }] },
    ],
  },
  "ornament": {
    id: "ornament",
    title: "プラルトリラーとモルデント",
    horizontal: true,
    total: 2.6667,
    events: [
      { t: 0, dur: 0.6667, kind: "note", seg: 0, notes: [{ midi: 72, string: "A", finger: 2, off: 3, name: "ド" }] },
      { t: 1.3333, dur: 0.6667, kind: "note", seg: 0, notes: [{ midi: 72, string: "A", finger: 2, off: 3, name: "ド" }] },
    ],
  },
  "double-3rd": {
    id: "double-3rd",
    title: "重音_3度_",
    horizontal: false,
    total: 2.6667,
    events: [
      { t: 0, dur: 0.6667, kind: "note", seg: 0, notes: [{ midi: 67, string: "D", finger: 3, off: 5, name: "ソ" }] },
      { t: 0.6667, dur: 0.6667, kind: "note", seg: 0, notes: [{ midi: 71, string: "A", finger: 1, off: 2, name: "シ" }] },
      { t: 1.3333, dur: 1.3333, kind: "note", seg: 0, notes: [{ midi: 71, string: "A", finger: 1, off: 2, name: "シ" }, { midi: 67, string: "D", finger: 3, off: 5, name: "ソ" }] },
    ],
  },
  "double-6th": {
    id: "double-6th",
    title: "重音_6度_",
    horizontal: false,
    total: 2.6667,
    events: [
      { t: 0, dur: 0.6667, kind: "note", seg: 0, notes: [{ midi: 64, string: "D", finger: 1, off: 2, name: "ミ" }] },
      { t: 0.6667, dur: 0.6667, kind: "note", seg: 0, notes: [{ midi: 72, string: "A", finger: 2, off: 3, name: "ド" }] },
      { t: 1.3333, dur: 1.3333, kind: "note", seg: 0, notes: [{ midi: 72, string: "A", finger: 2, off: 3, name: "ド" }, { midi: 64, string: "D", finger: 1, off: 2, name: "ミ" }] },
    ],
  },
  "double-octave": {
    id: "double-octave",
    title: "重音_オクターブ_",
    horizontal: false,
    total: 2.6667,
    events: [
      { t: 0, dur: 0.6667, kind: "note", seg: 0, notes: [{ midi: 64, string: "D", finger: 1, off: 2, name: "ミ" }] },
      { t: 0.6667, dur: 0.6667, kind: "note", seg: 0, notes: [{ midi: 76, string: "A", finger: 4, off: 7, name: "ミ" }] },
      { t: 1.3333, dur: 1.3333, kind: "note", seg: 0, notes: [{ midi: 76, string: "A", finger: 4, off: 7, name: "ミ" }, { midi: 64, string: "D", finger: 1, off: 2, name: "ミ" }] },
    ],
  },
  "double-10th": {
    id: "double-10th",
    title: "重音_10度_",
    horizontal: false,
    total: 2.6667,
    events: [
      { t: 0, dur: 0.6667, kind: "note", seg: 0, notes: [{ midi: 62, string: "D", finger: 0, off: 0, name: "レ" }] },
      { t: 0.6667, dur: 0.6667, kind: "note", seg: 0, notes: [{ midi: 77, string: "A", finger: 3, off: 8, name: "ファ" }] },
      { t: 1.3333, dur: 1.3333, kind: "note", seg: 0, notes: [{ midi: 77, string: "A", finger: 3, off: 8, name: "ファ" }, { midi: 62, string: "D", finger: 0, off: 0, name: "レ" }] },
    ],
  },
  "double-series": {
    id: "double-series",
    title: "連続重音",
    horizontal: false,
    total: 2.6667,
    events: [
      { t: 0, dur: 0.6667, kind: "note", seg: 0, notes: [{ midi: 69, string: "A", finger: 0, off: 0, name: "ラ" }, { midi: 65, string: "D", finger: 2, off: 3, name: "ファ" }] },
      { t: 0.6667, dur: 0.6667, kind: "note", seg: 0, notes: [{ midi: 71, string: "A", finger: 1, off: 2, name: "シ" }, { midi: 67, string: "D", finger: 3, off: 5, name: "ソ" }] },
      { t: 1.3333, dur: 0.6667, kind: "note", seg: 0, notes: [{ midi: 72, string: "A", finger: 2, off: 3, name: "ド" }, { midi: 69, string: "D", finger: 4, off: 7, name: "ラ" }] },
      { t: 2, dur: 0.6667, kind: "note", seg: 0, notes: [{ midi: 74, string: "A", finger: 3, off: 5, name: "レ" }, { midi: 71, string: "D", finger: 4, off: 9, name: "シ" }] },
    ],
  },
};

export const getFbLesson = (id: string): FbLesson | undefined => FB_LESSONS[id];

/** ループ全長（末尾に 0.6 秒の間） */
export const fbLoop = (l: FbLesson) => l.total + 0.6;

/* ============================================================
   不変条件（改変したら必ず確認）
   ============================================================ */
import { OPEN_MIDI, STRING_ORDER } from "./fingerboard-geometry";

export function assertFbLesson(l: FbLesson): void {
  let lastEnd = -1e-9;
  let lastSeg = 0;
  for (const ev of l.events) {
    // 1. 時間が単調でループ内に収まる
    if (ev.t < lastEnd - 1e-6) throw new Error(`${l.id}: イベントの時間が重なっている`);
    if (ev.t + ev.dur > fbLoop(l) + 1e-6) throw new Error(`${l.id}: ループからはみ出す`);
    lastEnd = ev.t;
    // 2. off = midi − 開放弦（弦の張り替え・移調ミスを検出）
    for (const n of ev.notes) {
      if (n.off !== n.midi - OPEN_MIDI[n.string]) {
        throw new Error(`${l.id}: ${n.name} の off が弦と矛盾`);
      }
      if (n.off < 0 || n.off > 17) throw new Error(`${l.id}: ${n.name} が指板の外`);
      if (n.finger === 0 && n.off !== 0) throw new Error(`${l.id}: 開放でないのに指0`);
    }
    // 3. 重音は隣接する弦
    if (ev.notes.length === 2) {
      const [a, b] = ev.notes.map((n) => STRING_ORDER.indexOf(n.string));
      if (Math.abs(a - b) !== 1) throw new Error(`${l.id}: 重音が隣接弦でない`);
    }
    // 4. seg は単調非減少（ポジションは戻さない教材設計）
    if (ev.seg < lastSeg) throw new Error(`${l.id}: seg が戻っている`);
    lastSeg = ev.seg;
  }
  // 5. グリッサンドは同一弦・指1
  const gs = l.events.filter((e) => e.kind === "gliss-start");
  for (const g of gs) {
    const stop = l.events.find((e) => e.kind === "gliss-stop");
    if (!stop || stop.notes[0].string !== g.notes[0].string) {
      throw new Error(`${l.id}: グリッサンドが弦をまたいでいる`);
    }
    if (g.notes[0].finger !== 1) throw new Error(`${l.id}: グリッサンドは1の指（監修指定）`);
  }
}
