"use client";

import { useId } from "react";
import { BowShape } from "./Bow";
import { ViolinBody } from "./Violin";
import {
  COLORS,
  VIOLIN_ROTATE,
  HAIR_Y,
  stringDisplayY,
  STRING_LABELS,
  type StringIndex,
} from "./violin-geometry";
import {
  getTechnique,
  sideKeyframes,
  violinKeyframes,
  contactKeyframes,
  type BowingTechnique,
} from "./bowing-motions";

/* ============================================================
   幾何定数
   ============================================================ */

/** 弓単体ビュー：接触点の x */
const C_SIDE = 250;

/** バイオリンビュー：弓の拡大率（実寸比に近づける） */
const BOW_SCALE = 1.35;

/** バイオリンビュー：接触点の表示 x（駒 405 と指板端 262 の間） */
const BOW_CONTACT_X = 360;

/**
 * バイオリンビューの弓の変換（rotate(-90) → 先端=下・フロッグ=上）
 *
 *   内部点 (x, HAIR_Y) → anim translate(-h,0) → scale(S) → rotate(-90) → translate(TX, C)
 *     表示x = TX + S*HAIR_Y            … 毛の軸（一定）
 *     表示y = C - S*(x - h)            … x=h（接触点）で C、x が小さい先端ほど下
 */
const TX = BOW_CONTACT_X - BOW_SCALE * HAIR_Y;

/* ============================================================
   BowingDemo
   ============================================================ */

export interface BowingDemoProps {
  /** 技法 id。BOWING_TECHNIQUES 参照 */
  technique: string;
  /** 再生中か */
  playing?: boolean;
  /** どのビューを描くか */
  view?: "side" | "violin" | "both";
  /** 弓く対象の弦（既定 = A線） */
  targetString?: StringIndex;
  className?: string;
}

export function BowingDemo({
  technique,
  playing = true,
  view = "both",
  targetString = 2,
  className,
}: BowingDemoProps) {
  const tech = getTechnique(technique);
  // useId は ":r0:" 等を返すため、CSS 識別子として使えるようサニタイズする
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");

  return (
    <div className={className}>
      {(view === "side" || view === "both") && (
        <SideView tech={tech} uid={uid} playing={playing} />
      )}
      {(view === "violin" || view === "both") && (
        <ViolinView
          tech={tech}
          uid={uid}
          playing={playing}
          targetString={targetString}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------
   ① 弓単体（側面模式図）— 離弦が正確に見える唯一のビュー
   ------------------------------------------------------------ */

function SideView({
  tech,
  uid,
  playing,
}: {
  tech: BowingTechnique;
  uid: string;
  playing: boolean;
}) {
  const bowAnim = `bow-side-${uid}-${tech.id}`;
  const dotAnim = `dot-side-${uid}-${tech.id}`;
  const dir = tech.alternate ? "alternate" : "normal";
  const state = playing ? "running" : "paused";

  const css = `
    @keyframes ${bowAnim}{${sideKeyframes(tech)}}
    ${tech.hasBounce ? `@keyframes ${dotAnim}{${contactKeyframes(tech)}}` : ""}
    .bow-${uid}{
      animation:${bowAnim} ${tech.duration}s ease-in-out infinite ${dir};
      animation-play-state:${state};
    }
    ${
      tech.hasBounce
        ? `.dot-${uid}{
             animation:${dotAnim} ${tech.duration}s ease-in-out infinite ${dir};
             animation-play-state:${state};
           }`
        : ""
    }
    @media (prefers-reduced-motion: reduce){
      .bow-${uid}, .dot-${uid}{ animation:none !important; }
    }
  `;

  return (
    <svg
      viewBox="-60 0 660 120"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${tech.name}の運弓（弓のみ）`}
    >
      <style>{css}</style>
      {/* 弦（模式） */}
      <line
        x1="-60"
        y1={HAIR_Y}
        x2="600"
        y2={HAIR_Y}
        stroke={COLORS.string}
        strokeWidth="2.4"
      />
      <text x="-52" y={HAIR_Y - 8} fontSize="10" fontWeight="700" fill="#9A8A76">
        弦
      </text>
      {/* 接触点 */}
      <circle
        className={`dot-${uid}`}
        cx={C_SIDE}
        cy={HAIR_Y}
        r="5.5"
        fill={COLORS.teal}
        opacity=".85"
      />
      {/* 弓：外側 translate で接触点へ寄せ、内側 group をアニメーションさせる */}
      <g transform={`translate(${C_SIDE},0)`}>
        <g className={`bow-${uid}`}>
          <BowShape />
        </g>
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------
   ② バイオリン＋弓（正面図）
   どの弦を・弓のどの部分で・どちら向きに弾くかが分かる。
   ※正面図では離弦が奥行き方向になるため描けない。
     跳ねは接触点マーカーの点滅で表現する。
   ------------------------------------------------------------ */

function ViolinView({
  tech,
  uid,
  playing,
  targetString,
}: {
  tech: BowingTechnique;
  uid: string;
  playing: boolean;
  targetString: StringIndex;
}) {
  const bowAnim = `bow-vln-${uid}-${tech.id}`;
  const dotAnim = `dot-vln-${uid}-${tech.id}`;
  const dir = tech.alternate ? "alternate" : "normal";
  const state = playing ? "running" : "paused";

  const contactY = stringDisplayY(targetString, BOW_CONTACT_X);

  const css = `
    @keyframes ${bowAnim}{${violinKeyframes(tech)}}
    ${tech.hasBounce ? `@keyframes ${dotAnim}{${contactKeyframes(tech)}}` : ""}
    .bowv-${uid}{
      animation:${bowAnim} ${tech.duration}s ease-in-out infinite ${dir};
      animation-play-state:${state};
    }
    ${
      tech.hasBounce
        ? `.dotv-${uid}{
             animation:${dotAnim} ${tech.duration}s ease-in-out infinite ${dir};
             animation-play-state:${state};
           }`
        : ""
    }
    @media (prefers-reduced-motion: reduce){
      .bowv-${uid}, .dotv-${uid}{ animation:none !important; }
    }
  `;

  return (
    <svg
      viewBox="-10 -120 514 530"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${tech.name}の運弓（バイオリンと弓）`}
    >
      <style>{css}</style>
      <g transform={VIOLIN_ROTATE}>
        <ViolinBody />
      </g>
      {/* 対象弦のハイライト */}
      <line
        x1="262"
        y1={contactY}
        x2="405"
        y2={contactY}
        stroke={COLORS.teal}
        strokeWidth="3"
        opacity=".35"
      />
      {/* 弓：rotate(-90) で先端=下・フロッグ=上 */}
      <g
        transform={`translate(${TX},${contactY}) rotate(-90) scale(${BOW_SCALE})`}
      >
        <g className={`bowv-${uid}`}>
          <BowShape />
        </g>
      </g>
      {/* 接触点 */}
      <circle
        className={`dotv-${uid}`}
        cx={BOW_CONTACT_X}
        cy={contactY}
        r="5.5"
        fill={COLORS.teal}
        opacity=".9"
      />
      <text
        x={BOW_CONTACT_X + 12}
        y={contactY - 10}
        fontSize="11"
        fontWeight="800"
        fill={COLORS.teal}
      >
        {STRING_LABELS[targetString]}線
      </text>
    </svg>
  );
}
