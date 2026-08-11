"use client";

/**
 * Arcoda 指板俯瞰図 — レッスン再生コンポーネント
 *
 * 指板を上から見た図で、押さえる位置を演奏順にアニメーションで示す。
 * SMIL 駆動（opacity は discrete、グリッサンドの滑走は translate）。
 *
 * ⚠️ 押弦マーカーの色は ev.seg → SEG_COLORS。**ポジション移動で色を変える**（監修指定）。
 * ⚠️ グリッサンドの滑走に easing を入れてはならない（linear）。
 * ⚠️ 装飾レッスン（ornament）の補助音タイミング 100ms/200ms は
 *    0.3倍速の監修調整値。実速に「修正」してはならない。
 */

import { useId } from "react";
import {
  Geo, dist, SEG_COLORS, STRING_ORDER, STRING_WIDTH, V_STR, V_NUT, H_STR, H_NUT,
  DOT_R, DOT_FONT, PILL_FONT, OPEN_R, type StringName,
} from "./fingerboard-geometry";
import { getFbLesson, fbLoop, type FbEvent, type FbNote } from "./fingerboard-lessons";

const F = "system-ui, 'Hiragino Sans', 'Noto Sans JP', sans-serif";

export function Pill({ x, y, text, left = false }: { x: number; y: number; text: string; left?: boolean }) {
  const w = 30 * text.length + 22;
  const x0 = left ? x : x - w / 2;
  return (
    <g>
      <rect x={x0} y={y - 23} width={w} height={46} rx={23}
            fill="#F7F0E8" stroke="#C9BFA8" strokeWidth={1.8} />
      <text x={x0 + w / 2} y={y + 11} fontSize={PILL_FONT} fontWeight={800}
            fill="#4A2A18" textAnchor="middle" fontFamily={F}>{text}</text>
    </g>
  );
}

export function Dot({ g, n, color, children }: { g: Geo; n: FbNote; color: string; children?: React.ReactNode }) {
  if (n.finger === 0) {
    const [ox, oy] = g.openPos(n.string);
    return (
      <g>
        <circle cx={ox} cy={oy} r={OPEN_R} fill="#F7F0E8" stroke={color} strokeWidth={6} />
        {children}
        <text x={ox} y={oy + 10} fontSize={28} fontWeight={800} fill={color}
              textAnchor="middle" fontFamily={F}>0</text>
      </g>
    );
  }
  const [x, y] = g.pos(n.string, n.off);
  return (
    <g>
      <circle cx={x} cy={y} r={DOT_R} fill={color} stroke="#F7F0E8" strokeWidth={4} />
      {children}
      <text x={x} y={y + 13} fontSize={DOT_FONT} fontWeight={800} fill="#fff"
            textAnchor="middle" fontFamily={F}>{n.finger}</text>
    </g>
  );
}

export function Label({ g, n, text }: { g: Geo; n: FbNote; text?: string }) {
  const [x, y] = n.finger > 0 ? g.pos(n.string, n.off) : g.openPos(n.string);
  return g.h
    ? <Pill x={x} y={y - 62} text={text ?? n.name} />
    : <Pill x={x + 40} y={y} text={text ?? n.name} left />;
}

export function Board({ g }: { g: Geo }) {
  const S = g.h ? H_STR : V_STR;
  const lo = Math.min(...Object.values(S)) - 38;
  const hi = Math.max(...Object.values(S)) + 38;
  const marks = [2, 5, 7, 12];
  return (
    <g>
      <rect width={g.W} height={g.H} fill="#F7F0E8" />
      {g.h ? (
        <>
          <path d={`M ${H_NUT - 28},${lo} L ${g.W - 16},${lo - 18} L ${g.W - 16},${hi + 18} L ${H_NUT - 28},${hi} Z`} fill="#463527" />
          <rect x={H_NUT - 8} y={lo - 2} width={10} height={hi - lo + 4} rx={3}
                fill="#EFE2CE" stroke="#B98A55" strokeWidth={1.2} />
        </>
      ) : (
        <>
          <path d={`M ${lo},${V_NUT - 28} L ${hi},${V_NUT - 28} L ${hi + 18},${g.H - 20} L ${lo - 18},${g.H - 20} Z`} fill="#463527" />
          <rect x={lo - 2} y={V_NUT - 8} width={hi - lo + 4} height={10} rx={3}
                fill="#EFE2CE" stroke="#B98A55" strokeWidth={1.2} />
        </>
      )}
      {STRING_ORDER.map((st) =>
        g.h ? (
          <g key={st}>
            <line x1={H_NUT - 24} y1={H_STR[st]} x2={g.W - 20} y2={H_STR[st]}
                  stroke="#D8D0BC" strokeWidth={STRING_WIDTH[st]} />
            <text x={H_NUT - 44} y={H_STR[st] + 9} fontSize={26} fontWeight={700}
                  fill="#5A4535" textAnchor="middle" fontFamily={F}>{st}</text>
          </g>
        ) : (
          <g key={st}>
            <line x1={V_STR[st]} y1={V_NUT - 24} x2={V_STR[st]} y2={g.H - 24}
                  stroke="#D8D0BC" strokeWidth={STRING_WIDTH[st]} />
            <text x={V_STR[st]} y={V_NUT - 42} fontSize={26} fontWeight={700}
                  fill="#5A4535" textAnchor="middle" fontFamily={F}>{st}</text>
          </g>
        ),
      )}
      {Array.from({ length: 15 }, (_, i) => i + 1).map((n) => {
        // ⚠️ dist() は無理数寄りの浮動小数。生値のままだとサーバ/クライアントで末尾桁がズレて
        //    hydration mismatch になる。Geo.pos() と同じ ×10/10 丸めで一致させる（値・見た目は不変）。
        const d = Math.round(dist(n) * 10) / 10;
        const w = marks.includes(n) ? 2 : 0.8;
        const op = marks.includes(n) ? 0.5 : 0.28;
        return g.h ? (
          <line key={n} x1={H_NUT + d} y1={lo + 8} x2={H_NUT + d} y2={hi - 8}
                stroke="#5A4535" strokeWidth={w} opacity={op} />
        ) : (
          <line key={n} x1={lo + 8} y1={V_NUT + d} x2={hi - 8} y2={V_NUT + d}
                stroke="#5A4535" strokeWidth={w} opacity={op} />
        );
      })}
      {([[2, "1st"], [5, "3rd"], [8, "5th"], [12, "8va"]] as const).map(([n, lab]) => {
        const d = Math.round(dist(n) * 10) / 10; // 同上
        return g.h ? (
          <text key={lab} x={H_NUT + d} y={lo - 16} fontSize={20} fill="#8a6a54"
                textAnchor="middle" fontFamily={F}>{lab}</text>
        ) : (
          <text key={lab} x={lo - 16} y={V_NUT + d + 8} fontSize={20} fill="#8a6a54"
                textAnchor="end" fontFamily={F}>{lab}</text>
        );
      })}
    </g>
  );
}

/** イベント可視ウィンドウの discrete opacity */
export function Window({ t0, t1, loop, children }: { t0: number; t1: number; loop: number; children: React.ReactNode }) {
  const kt = [0, t0 / loop, Math.min(t1 / loop, 1), 1].map((v) => Math.round(v * 1e5) / 1e5);
  return (
    <g opacity={0}>
      <animate attributeName="opacity" calcMode="discrete"
               keyTimes={kt.join(";")} values="0;1;0;0"
               dur={`${loop}s`} repeatCount="indefinite" />
      {children}
    </g>
  );
}

export interface FingerboardDemoProps {
  lesson: string;
  className?: string;
}

export function FingerboardDemo({ lesson: lessonId, className }: FingerboardDemoProps) {
  const uid = useId();
  const l = getFbLesson(lessonId);
  if (!l) return null;
  const g = new Geo(l.horizontal);
  const loop = Math.round(fbLoop(l) * 1e4) / 1e4;
  const isOrn = l.id === "ornament";
  const isHarm = l.id === "harmonics";
  const last = l.events[l.events.length - 1];
  const ORN_AUX = [
    { off: 5, finger: 1, name: "レ", label: "プラルトリラー" },
    { off: 2, finger: 1, name: "シ", label: "モルデント" },
  ];
  let ornIdx = 0;

  return (
    <svg viewBox={`0 0 ${g.W} ${g.H}`} className={className}
         xmlns="http://www.w3.org/2000/svg" role="img"
         aria-label={`${l.title}：指板を上から見た押弦位置`}>
      <Board g={g} />
      {l.events.map((ev, i) => {
        const color = SEG_COLORS[Math.min(ev.seg, SEG_COLORS.length - 1)];
        // --- ハーモニクス: 最終音 = A線オクターブ点の倍音（触れるだけ・菱形） ---
        if (isHarm && ev === last) {
          const [x, y] = g.pos("A", 12);
          return (
            <Window key={i} t0={ev.t} t1={ev.t + ev.dur} loop={loop}>
              <path d={`M ${x},${y - 30} L ${x + 25},${y} L ${x},${y + 30} L ${x - 25},${y} Z`}
                    fill="#F7F0E8" stroke={color} strokeWidth={5.5} />
              {g.h ? <Pill x={x} y={y - 64} text="ラ 倍音・触れるだけ" />
                   : <Pill x={x + 40} y={y} text="ラ 倍音・触れるだけ" left />}
            </Window>
          );
        }
        // --- グリッサンド: 同一弦上を滑る（linear・easing 禁止） ---
        if (ev.kind === "gliss-start") {
          const n = ev.notes[0];
          const stop = l.events.find((e) => e.kind === "gliss-stop")!;
          const [x0, y0] = g.pos(n.string, n.off);
          const [x1, y1] = g.pos(stop.notes[0].string, stop.notes[0].off);
          const g0 = ev.t / loop;
          const g1 = (ev.t + ev.dur) / loop;
          return (
            <Window key={i} t0={ev.t} t1={ev.t + ev.dur} loop={loop}>
              <g>
                <animateTransform attributeName="transform" type="translate" calcMode="linear"
                                  keyTimes={`0;${g0};${g1};1`}
                                  values={`0 0;0 0;${x1 - x0} ${y1 - y0};${x1 - x0} ${y1 - y0}`}
                                  dur={`${loop}s`} repeatCount="indefinite" />
                <circle cx={x0} cy={y0} r={DOT_R} fill={color} stroke="#F7F0E8" strokeWidth={4} />
                <text x={x0} y={y0 + 13} fontSize={DOT_FONT} fontWeight={800} fill="#fff"
                      textAnchor="middle" fontFamily={F}>{n.finger}</text>
              </g>
              <Pill x={x0} y={y0 - 62} text={`${n.name} → 滑らせる`} />
            </Window>
          );
        }
        // --- 装飾: 主音の途中に補助音をフラッシュ（100ms/200ms・監修調整値） ---
        if (isOrn) {
          const aux = ORN_AUX[ornIdx % 2];
          ornIdx += 1;
          const a0 = (ev.t + 0.1) / loop;
          const a1 = (ev.t + 0.3) / loop;
          const mainKt = [0, ev.t / loop, a0, a1, (ev.t + ev.dur) / loop, 1]
            .map((v) => Math.round(v * 1e5) / 1e5).join(";");
          const auxN: FbNote = { midi: 0, string: "A", finger: 3, off: aux.off, name: aux.name };
          const auxFinger = aux.off === 5 ? 3 : 1;
          return (
            <g key={i}>
              <g opacity={0}>
                <animate attributeName="opacity" calcMode="discrete" keyTimes={mainKt}
                         values="0;1;0;1;0;0" dur={`${loop}s`} repeatCount="indefinite" />
                {ev.notes.map((n, j) => (
                  <g key={j}><Dot g={g} n={n} color={color} /><Label g={g} n={n} /></g>
                ))}
              </g>
              <Window t0={ev.t + 0.1} t1={ev.t + 0.3} loop={loop}>
                <Dot g={g} n={{ ...auxN, finger: auxFinger }} color={color} />
                <Label g={g} n={{ ...auxN, finger: auxFinger }} text={aux.name} />
              </Window>
              <Window t0={ev.t} t1={ev.t + ev.dur} loop={loop}>
                <text x={g.W / 2} y={46} fontSize={26} fontWeight={800} fill="#5A4535"
                      textAnchor="middle" fontFamily={F}>{aux.label}</text>
              </Window>
            </g>
          );
        }
        // --- 通常の音・重音 ---
        return (
          <Window key={i} t0={ev.t} t1={ev.t + ev.dur} loop={loop}>
            {ev.notes.map((n, j) => (
              <g key={j}><Dot g={g} n={n} color={color} /><Label g={g} n={n} /></g>
            ))}
          </Window>
        );
      })}
    </svg>
  );
}
