"use client";

/**
 * Arcoda 指板俯瞰図 — 重音ミスの再生（pull / late）
 *
 * ⚠️ 旋律（崩し弾き）は正常表示。ミスは**和音イベントだけ**に出す。
 * ⚠️ ゴースト（破線の輪）＝正しい位置。消してはならない — ズレの基準が消える。
 * ⚠️ pull のズレは PULL_SEMITONES を dist() に通す（実弦長比）。px 直書き禁止。
 */
import {
  Geo, SEG_COLORS, DOT_R, DOT_FONT, type StringName,
} from "./fingerboard-geometry";
import { getFbLesson, fbLoop, type FbNote } from "./fingerboard-lessons";
import { FB_MISTAKES, PULL_SEMITONES, LATE_SEC, MISS_COLOR, type PullVictim } from "./fingerboard-mistakes";
// Board / Dot / Label / Window は FingerboardDemo.tsx から export しておくこと（commit 1）
import { Board, Dot, Label, Window, Pill } from "./FingerboardDemo";

export interface FingerboardMissDemoProps {
  lesson: string;             // "double-3rd" など
  type: "pull" | "late";
  className?: string;
}

export function FingerboardMissDemo({ lesson, type, className }: FingerboardMissDemoProps) {
  const l = getFbLesson(lesson);
  const ms = FB_MISTAKES[lesson];
  if (!l || !ms) return null;
  const g = new Geo(l.horizontal);
  const loop = Math.round(fbLoop(l) * 1e4) / 1e4;
  const pitched = l.events.filter((e) => e.notes.length > 0);
  const victims = new Map(
    (type === "pull" ? ms.pull : ms.late).map((v) => [v.event, v]),
  );

  return (
    <svg viewBox={`0 0 ${g.W} ${g.H}`} className={className}
         xmlns="http://www.w3.org/2000/svg" role="img"
         aria-label={`${l.title} ミス：${type === "pull" ? "引っ張られて音程が潰れる" : "同時に置けない"}`}>
      <Board g={g} />
      {pitched.map((ev, i) => {
        const v = victims.get(i);
        const color = SEG_COLORS[Math.min(ev.seg, SEG_COLORS.length - 1)];
        return (
          <g key={i}>
            {ev.notes.map((n: FbNote, j: number) => {
              if (!v || j !== v.note) {
                return (
                  <Window key={j} t0={ev.t} t1={ev.t + ev.dur} loop={loop}>
                    <Dot g={g} n={n} color={color} /><Label g={g} n={n} />
                  </Window>
                );
              }
              const [gx, gy] = g.pos(n.string as StringName, n.off);
              const ghost = (
                <circle cx={gx} cy={gy} r={DOT_R} fill="none" stroke="#F7F0E8"
                        strokeWidth={4} strokeDasharray="9 7" opacity={0.9} />
              );
              if (type === "pull") {
                const dir = (v as PullVictim).dir;
                const off2 = n.off + dir * PULL_SEMITONES;
                const bad: FbNote = { ...n, off: off2 };
                return (
                  <Window key={j} t0={ev.t} t1={ev.t + ev.dur} loop={loop}>
                    {ghost}
                    <Dot g={g} n={bad} color={MISS_COLOR} />
                    <Label g={g} n={bad} text={`${n.name}${dir > 0 ? "↑上ずる" : "↓届かない"}`} />
                  </Window>
                );
              }
              return (
                <g key={j}>
                  <Window t0={ev.t} t1={Math.min(ev.t + LATE_SEC, ev.t + ev.dur)} loop={loop}>
                    {ghost}
                  </Window>
                  <Window t0={ev.t + LATE_SEC} t1={ev.t + ev.dur} loop={loop}>
                    <Dot g={g} n={n} color={MISS_COLOR} />
                    <Label g={g} n={n} text={`${n.name} 遅れ`} />
                  </Window>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
