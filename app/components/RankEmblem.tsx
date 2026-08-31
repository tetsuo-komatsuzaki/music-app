"use client"

// ============================================================
// ランク紋章 (2026-08-31 Tetsuo承認・fb048a4a最終案)。
// ★1〜10で色と光が一本の階段になる: 青の明暗3段 → 銀の4段階 → 金3段。
// ★9=小さな王冠 / ★10=大王冠 (白宝石3つ) +回転する後光。月桂樹なし。
// 寸法は size (CSS長・cqw可) を font-size に立て、内部は全て em で従動する。
// 使い所: TitleAwardMotion (授与) / GalleryShelves (棚ミニ)。
// ============================================================

export default function RankEmblem({ star, size }: {
  /** ランク★ (1〜10) */
  star: number
  /** 一辺の長さ (CSS長。例 "19cqw" / "34px")。王冠は上へはみ出す */
  size: string
}) {
  const n = Math.min(Math.max(Math.round(star), 1), 10)
  return (
    <span className={`reWrap re${n}`} style={{ width: size, height: size, fontSize: size }} aria-hidden>
      {n === 10 && <i className="reBurst" />}
      <i className="reEdge" />
      <i className="reRim" />
      <i className="reFace" />
      {n === 9 && <i className="reCrown reCrownS" />}
      {n === 10 && <i className="reCrown reCrownB" />}
      <span className="reStar">★</span>
      <style>{`
.reWrap { position:relative; display:inline-grid; place-items:center; }
.reWrap i, .reWrap .reStar { line-height:1; }
.reEdge, .reRim, .reFace { position:absolute; border-radius:50%; }
.reEdge { inset:0; background:repeating-conic-gradient(#1c2f5c 0deg 3deg, #4a6cb8 3deg 6deg);
  box-shadow:0 .04em .08em rgba(8,14,36,.6); }
.reRim { inset:5%; background:conic-gradient(from 210deg,#223a70,#7a9ade 18%,#3d5da8 34%,#22345f 50%,#6b90d8 66%,#2c4a86 82%,#223a70);
  box-shadow:inset 0 .02em .03em rgba(210,226,255,.9), inset 0 -.03em .05em rgba(8,14,36,.8); }
.reFace { inset:14%; background:radial-gradient(circle at 36% 28%, #5c80cc, #3d5da8 46%, #22345f 82%, #131f3e);
  box-shadow:inset 0 .03em .06em rgba(200,220,255,.45), inset 0 -.04em .07em rgba(5,10,26,.8); }
.reFace::before { content:""; position:absolute; inset:6%; border-radius:50%; opacity:.5;
  background:repeating-conic-gradient(transparent 0deg 8deg, rgba(200,220,255,.18) 8deg 9deg);
  -webkit-mask:radial-gradient(circle, transparent 58%, #000 60%, #000 82%, transparent 84%);
          mask:radial-gradient(circle, transparent 58%, #000 60%, #000 82%, transparent 84%); }
.reFace::after { content:""; position:absolute; inset:0; border-radius:50%; mix-blend-mode:screen;
  background:conic-gradient(from 215deg, rgba(255,255,255,.2), transparent 22%, rgba(255,255,255,.07) 48%, transparent 74%, rgba(255,255,255,.2)); }
.reStar { position:relative; z-index:3; font-size:.33em; font-weight:900; color:#eaf1ff;
  text-shadow:0 .04em 0 rgba(255,255,255,.55), 0 -.04em .06em rgba(5,10,26,.9), 0 0 .45em rgba(140,175,255,.7); }

/* 王冠 */
.reCrown { position:absolute; z-index:4; left:50%; transform:translateX(-50%); }
.reCrownS { top:-.125em; width:.42em; height:.21em;
  clip-path:polygon(0 100%, 0 34%, 18% 58%, 34% 8%, 50% 48%, 66% 8%, 82% 58%, 100% 34%, 100% 100%);
  background:linear-gradient(180deg,#fdf0c0,#e8b23c 55%,#a5761c);
  box-shadow:inset 0 -.02em .03em rgba(90,62,10,.6); filter:drop-shadow(0 .02em .03em rgba(60,40,4,.5)); }
.reCrownB { top:-.21em; width:.6em; height:.31em;
  clip-path:polygon(0 100%, 0 26%, 14% 52%, 27% 4%, 40% 46%, 50% 0, 60% 46%, 73% 4%, 86% 52%, 100% 26%, 100% 100%);
  background:linear-gradient(180deg,#fff6d8,#f0c35c 45%,#c99a35 78%,#8a6a1a);
  box-shadow:inset 0 -.03em .04em rgba(90,62,10,.65), inset 0 .02em .02em rgba(255,250,225,.9);
  filter:drop-shadow(0 .02em .05em rgba(60,40,4,.55)) drop-shadow(0 0 .1em rgba(232,178,60,.6)); }
.reCrownB::after { content:""; position:absolute; left:50%; top:54%; width:.068em; height:.068em; border-radius:50%;
  transform:translateX(-50%);
  background:radial-gradient(circle at 35% 30%, #ffffff, #f4f8fd 45%, #aebbd0);
  box-shadow:-.163em .04em 0 -.014em #fff, .163em .04em 0 -.014em #fff; }

/* 後光 (★10) */
.reBurst { position:absolute; inset:-15%; border-radius:50%; z-index:0;
  background:repeating-conic-gradient(rgba(240,205,124,.5) 0deg 5deg, transparent 5deg 14deg);
  -webkit-mask:radial-gradient(circle, transparent 40%, #000 44%, transparent 74%);
          mask:radial-gradient(circle, transparent 40%, #000 44%, transparent 74%);
  animation:reBurstK 14s linear infinite; }
@keyframes reBurstK { to { transform:rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .reBurst { animation:none; } }

/* ── ★1-3: 青の明暗3段 ── */
.re1 .reEdge { background:repeating-conic-gradient(#131f3e 0deg 3deg, #35508e 3deg 6deg); }
.re1 .reRim { background:conic-gradient(from 210deg,#182849,#4a6cb8 18%,#2c4a86 34%,#16264a 50%,#3d5da8 66%,#1e335e 82%,#182849); }
.re1 .reFace { background:radial-gradient(circle at 36% 28%, #4062ae, #2c4a86 46%, #182b52 82%, #0c1730); }
.re1 .reStar { text-shadow:0 .04em 0 rgba(255,255,255,.4), 0 -.04em .06em rgba(5,10,26,.9); }
.re2 .reFace::before { opacity:.75; }
.re3 .reEdge { background:repeating-conic-gradient(#1c2f5c 0deg 3deg, #7aa0e4 3deg 6deg); }
.re3 .reRim { background:conic-gradient(from 210deg,#2c4a86,#9ab8ee 18%,#4a6cb8 34%,#26406e 50%,#88a8e8 66%,#35508e 82%,#2c4a86); }
.re3 .reFace { background:radial-gradient(circle at 36% 28%, #7a9ade, #4a6cb8 46%, #2c4a86 82%, #1a2c54); }
.re3 .reStar { text-shadow:0 .04em 0 #fff, 0 -.04em .06em rgba(5,10,26,.9), 0 0 .5em rgba(150,185,255,.95); }

/* ── ★4-7: 銀の4段階 ── */
.re4 .reEdge { background:repeating-conic-gradient(#565e6c 0deg 3deg, #aab3c2 3deg 6deg); }
.re4 .reRim { background:conic-gradient(from 210deg,#767f8e,#c4ccd8 18%,#929cac 34%,#5c6574 50%,#bcc4d0 66%,#7d8695 82%,#767f8e); }
.re4 .reFace { background:radial-gradient(circle at 36% 28%, #ccd3dd, #a2abba 44%, #79828f 80%, #565e6c);
  box-shadow:inset 0 .03em .06em rgba(240,244,250,.7), inset 0 -.04em .07em rgba(52,58,68,.6); }
.re4 .reFace::before { background:repeating-conic-gradient(transparent 0deg 8deg, rgba(86,94,108,.3) 8deg 9deg); }
.re4 .reStar { color:#525b6a; text-shadow:0 .04em 0 rgba(255,255,255,.8), 0 -.03em .03em rgba(46,52,62,.6); }
.re5 .reEdge { background:repeating-conic-gradient(#5a6474 0deg 3deg, #c5cedb 3deg 6deg); }
.re5 .reRim { background:conic-gradient(from 210deg,#828da0,#dbe2ec 18%,#a2adbe 34%,#65707f 50%,#d2dae6 66%,#8b96a8 82%,#828da0);
  box-shadow:inset 0 .02em .03em rgba(255,255,255,.85), inset 0 -.03em .05em rgba(46,52,62,.65); }
.re5 .reFace { background:radial-gradient(circle at 36% 28%, #dde3eb, #b4bdcb 43%, #8791a1 80%, #5f6979);
  box-shadow:inset 0 .03em .06em rgba(248,250,253,.8), inset 0 -.04em .07em rgba(50,56,66,.6); }
.re5 .reFace::before { background:repeating-conic-gradient(transparent 0deg 8deg, rgba(90,100,116,.3) 8deg 9deg); }
.re5 .reStar { color:#4e5866; text-shadow:0 .04em 0 rgba(255,255,255,.85), 0 -.03em .03em rgba(44,50,60,.6), 0 0 .18em rgba(220,228,240,.5); }
.re6 .reEdge { background:repeating-conic-gradient(#5a6784 0deg 3deg, #eef2f9 3deg 6deg); }
.re6 .reRim { background:conic-gradient(from 210deg,#8a97b2,#f4f7fc 18%,#aebfd8 34%,#66748f 50%,#eef3fa 66%,#8f9db8 82%,#8a97b2);
  box-shadow:inset 0 .02em .03em #fff, inset 0 -.03em .05em rgba(40,48,66,.7); }
.re6 .reFace { background:radial-gradient(circle at 36% 28%, #eef2f9, #c2cddf 42%, #8a97b2 80%, #5f6d8a);
  box-shadow:inset 0 .03em .06em rgba(255,255,255,.85), inset 0 -.04em .07em rgba(50,60,84,.6); }
.re6 .reFace::before { background:repeating-conic-gradient(transparent 0deg 8deg, rgba(95,109,138,.3) 8deg 9deg); }
.re6 .reStar { color:#4c5a76; text-shadow:0 .04em 0 rgba(255,255,255,.9), 0 -.03em .03em rgba(40,48,66,.6), 0 0 .28em rgba(220,230,245,.8); }
.re7 .reEdge { background:repeating-conic-gradient(#5a6784 0deg 3deg, #f6f9fd 3deg 6deg); }
.re7 .reRim { background:conic-gradient(from 210deg,#98a5be,#ffffff 18%,#bcc9dc 34%,#6d7b96 50%,#f7fafd 66%,#98a5be 82%,#98a5be);
  box-shadow:inset 0 .02em .03em #fff, inset 0 -.03em .05em rgba(40,48,66,.7); }
.re7 .reFace { background:radial-gradient(circle at 36% 28%, #f4f8fd, #ccd6e6 42%, #97a4bd 80%, #66748f);
  box-shadow:inset 0 .03em .06em rgba(255,255,255,.9), inset 0 -.04em .07em rgba(50,60,84,.6); }
.re7 .reFace::before { background:repeating-conic-gradient(transparent 0deg 8deg, rgba(95,109,138,.32) 8deg 9deg); }
.re7 .reStar { color:#4c5a76; text-shadow:0 .04em 0 #fff, 0 -.03em .03em rgba(40,48,66,.6), 0 0 .34em rgba(230,240,252,.95); }

/* ── ★8-10: 金3段 ── */
.re8 .reEdge, .re9 .reEdge { background:repeating-conic-gradient(#8a6a1a 0deg 2.4deg, #f0cd7c 2.4deg 4.8deg); }
.re8 .reRim, .re9 .reRim { background:conic-gradient(from 210deg,#8a6a1a,#f7dd9a 18%,#c99a35 32%,#8a6a1a 48%,#f0cd7c 62%,#a5761c 78%,#8a6a1a); }
.re8 .reFace { background:radial-gradient(circle at 38% 28%, #ffedb6, #f0c35c 44%, #d9a93c 72%, #a5761c);
  box-shadow:inset 0 .03em .06em rgba(255,246,214,.85), inset 0 -.04em .07em rgba(90,62,10,.65); }
.re8 .reFace::before, .re9 .reFace::before, .re10 .reFace::before { background:repeating-conic-gradient(transparent 0deg 8deg, rgba(138,106,26,.32) 8deg 9deg); }
.re8 .reStar { color:#7a5a12; text-shadow:0 .04em 0 rgba(255,246,214,.95), 0 -.03em .03em rgba(74,50,4,.6), 0 0 .34em rgba(255,236,170,.7); }
.re9 .reFace { background:radial-gradient(circle at 38% 28%, #fff3c9, #f3c65f 42%, #dca432 70%, #a5761c);
  box-shadow:inset 0 .03em .06em rgba(255,250,225,.9), inset 0 -.04em .07em rgba(90,62,10,.7); }
.re9 .reStar { color:#6e4e0e; text-shadow:0 .04em 0 rgba(255,250,225,.95), 0 -.03em .03em rgba(74,50,4,.7), 0 0 .45em rgba(255,236,170,.95); }
.re10 .reEdge { background:repeating-conic-gradient(#8a6a1a 0deg 2.4deg, #f7dd9a 2.4deg 4.8deg); }
.re10 .reRim { background:conic-gradient(from 210deg,#8a6a1a,#fdf0c0 18%,#c99a35 32%,#8a6a1a 48%,#f7dd9a 62%,#a5761c 78%,#8a6a1a); }
.re10 .reFace { background:radial-gradient(circle at 40% 30%, #ffe9ad, #f0c35c 38%, #d9a93c 66%, #a5761c);
  box-shadow:inset 0 .03em .06em rgba(255,246,214,.8), inset 0 -.04em .07em rgba(90,62,10,.7); }
.re10 .reStar { color:#6e4e0e; font-size:.37em; text-shadow:0 .04em 0 rgba(255,246,214,.95), 0 -.03em .03em rgba(74,50,4,.7), 0 0 .28em rgba(255,236,170,.8); }

/* ── 段階グロー (色は段の金属色・10段で滑らかに) ── */
.re1 { filter:drop-shadow(0 .06em .1em rgba(0,0,0,.5)); }
.re2 { filter:drop-shadow(0 .06em .1em rgba(0,0,0,.5)) drop-shadow(0 0 .06em rgba(110,155,240,.45)); }
.re3 { filter:drop-shadow(0 .06em .1em rgba(0,0,0,.5)) drop-shadow(0 0 .125em rgba(130,170,255,.8)); }
.re4 { filter:drop-shadow(0 .06em .1em rgba(0,0,0,.5)) drop-shadow(0 0 .04em rgba(200,210,225,.3)); }
.re5 { filter:drop-shadow(0 .06em .1em rgba(0,0,0,.5)) drop-shadow(0 0 .077em rgba(215,224,236,.5)); }
.re6 { filter:drop-shadow(0 .06em .1em rgba(0,0,0,.5)) drop-shadow(0 0 .115em rgba(225,235,250,.6)); }
.re7 { filter:drop-shadow(0 .06em .1em rgba(0,0,0,.5)) drop-shadow(0 0 .154em rgba(240,246,255,.75)); }
.re8 { filter:drop-shadow(0 .06em .1em rgba(0,0,0,.5)) drop-shadow(0 0 .115em rgba(232,178,60,.55)); }
.re9 { filter:drop-shadow(0 .06em .1em rgba(0,0,0,.5)) drop-shadow(0 0 .173em rgba(232,178,60,.75)); }
.re10 { filter:drop-shadow(0 .06em .1em rgba(0,0,0,.5)) drop-shadow(0 0 .25em rgba(240,205,124,.95)); }
      `}</style>
    </span>
  )
}
