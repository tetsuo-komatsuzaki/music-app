"use client"

// ============================================================
// マスター記念カード 授与モーション (肉付け・2026-08-31 Tetsuo承認 genspark「結晶」パターンの移植)。
// 正本: treasure-handoff/master-card-approved-crystal.html (称号と同じ結晶リグの金族)。
// 12秒ループの%タイムラインをフェーズ制に変換:
//   青い光の柱+粒子が中心へ集積 → 閃光+光輪 → カードが光から凝結 → きらめき
//   → うけとる待ち → マイランクカードへ飛翔 → 完了。
// 券面: クリーム+金縁のカード族・金の差し色 (マスター=金の成果)。
// 月桂樹リース+★ / MASTER箔 / 曲名 / 蝋封+Arco署名 / 日付。ホロとサンバースト。
// reduced-motion は呼び手 (TreasureCelebration) が演出ごと省略する。
// ============================================================

import { useEffect, useRef, useState } from "react"

type Phase = "gather" | "crystal" | "recv" | "fly"

export type MasterCardFace = {
  /** マスターした曲名 */
  song: string
  /** 授与日 (YYYY.MM.DD) */
  date: string
}

export default function MasterCardAwardMotion({ face, onDone }: { face: MasterCardFace; onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>("gather")
  const [fly, setFly] = useState<{ dx: number; dy: number } | null>(null)
  const phaseRef = useRef<Phase>("gather")
  phaseRef.current = phase

  useEffect(() => {
    if (phase !== "gather") return
    const t = setTimeout(() => setPhase("crystal"), 2300)
    return () => clearTimeout(t)
  }, [phase])

  useEffect(() => {
    if (phase !== "crystal") return
    const t = setTimeout(() => setPhase("recv"), 2100)
    return () => clearTimeout(t)
  }, [phase])

  useEffect(() => {
    if (phase !== "fly") return
    const t = setTimeout(() => onDone(), 850)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const startFly = () => {
    const card = document.querySelector<HTMLElement>('[data-guide="home-rank-card"]')
    const vw = window.innerWidth
    const vh = window.innerHeight
    const startX = vw / 2
    const startY = vh * 0.46
    let dx = vw * 0.3
    let dy = -vh * 0.3
    if (card) {
      const r = card.getBoundingClientRect()
      dx = r.left + r.width * 0.5 - startX
      dy = r.top + r.height * 0.5 - startY
    }
    setFly({ dx, dy })
    setPhase("fly")
  }

  const advance = () => {
    const p = phaseRef.current
    if (p === "gather" || p === "crystal") setPhase("recv")
    else if (p === "recv") startFly()
  }

  return (
    <div onClick={advance} style={{ position: "fixed", inset: 0, zIndex: 941, cursor: "pointer" }} aria-hidden>
      <div className={`mcStage mc-${phase}`} style={fly ? ({ ["--fdx" as string]: `${fly.dx}px`, ["--fdy" as string]: `${fly.dy}px` }) : undefined}>
        <div className={`mcDim ${phase === "fly" ? "mcDimOut" : ""}`} />
        {(phase === "gather" || phase === "crystal") && <div className="mcBeacon" />}
        <div className="mcScene">
          <div className="mcCard">
            <i className="mcGrain" />
            <i className="mcHolo" />
            <i className="mcSunburst" />
            <i className="mcFc mcTl" /><i className="mcFc mcTr" /><i className="mcFc mcBl" /><i className="mcFc mcBr" />
            <div className="mcWrap">
              <div className="mcKlabel">記念カード</div>
              <i className="mcKrule" />
              <div className="mcWreath">
                <i className="mcLeaf" /><i className="mcLeaf" /><i className="mcLeaf" /><i className="mcLeaf" /><i className="mcLeaf" />
                <i className="mcLeaf" /><i className="mcLeaf" /><i className="mcLeaf" /><i className="mcLeaf" /><i className="mcLeaf" />
                <span className="mcWstar mcFoil">★</span>
              </div>
              <div className="mcMword mcFoil">MASTER</div>
              <div className="mcMpiece">{face.song}</div>
              <div className="mcSealrow">
                <span className="mcSeal">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/arco/05B.jpg" alt="" />
                </span>
                <span className="mcSign">Arco</span>
              </div>
              <div className="mcKdate">{face.date}</div>
            </div>
          </div>
          {phase === "gather" && (
            <>
              <span className="mcPt mcG" style={{ ["--fx" as string]: "-24cqw", ["--fy" as string]: "-18cqh" }} />
              <span className="mcPt" style={{ ["--fx" as string]: "-4cqw", ["--fy" as string]: "-26cqh" }} />
              <span className="mcPt mcG" style={{ ["--fx" as string]: "18cqw", ["--fy" as string]: "-20cqh" }} />
              <span className="mcPt" style={{ ["--fx" as string]: "26cqw", ["--fy" as string]: "-8cqh" }} />
              <span className="mcPt mcG" style={{ ["--fx" as string]: "24cqw", ["--fy" as string]: "8cqh" }} />
              <span className="mcPt" style={{ ["--fx" as string]: "10cqw", ["--fy" as string]: "18cqh" }} />
              <span className="mcPt mcG" style={{ ["--fx" as string]: "-14cqw", ["--fy" as string]: "16cqh" }} />
              <span className="mcPt" style={{ ["--fx" as string]: "-27cqw", ["--fy" as string]: "4cqh" }} />
              <span className="mcPt mcG" style={{ ["--fx" as string]: "-12cqw", ["--fy" as string]: "-22cqh" }} />
              <span className="mcPt" style={{ ["--fx" as string]: "20cqw", ["--fy" as string]: "22cqh" }} />
              <span className="mcPt mcG" style={{ ["--fx" as string]: "-22cqw", ["--fy" as string]: "12cqh" }} />
              <span className="mcPt" style={{ ["--fx" as string]: "6cqw", ["--fy" as string]: "-16cqh" }} />
            </>
          )}
          {phase === "crystal" && (
            <>
              <i className="mcFlash" />
              <i className="mcRingB" />
              <i className="mcRingB mcR2" />
              <span className="mcSparkle" style={{ left: "20%", top: "22%", animationDelay: "1.1s" }} />
              <span className="mcSparkle" style={{ left: "78%", top: "30%", animationDelay: "1.45s" }} />
              <span className="mcSparkle" style={{ left: "16%", top: "60%", animationDelay: "1.8s" }} />
              <span className="mcSparkle" style={{ left: "82%", top: "64%", animationDelay: "1.25s" }} />
              <span className="mcSparkle" style={{ left: "50%", top: "16%", animationDelay: "1.6s" }} />
            </>
          )}
        </div>
        {phase === "recv" && (
          <div className="mcRecv">
            <button type="button" onClick={(e) => { e.stopPropagation(); startFly() }}>うけとる</button>
          </div>
        )}
      </div>
      {/* 結晶パターンCSS (genspark正本の移植・ti接頭辞・%タイムライン→フェーズ別) */}
      <style>{`
.mcStage { position:absolute; inset:0; container-type:size; }
.mcDim { position:absolute; inset:0; z-index:2; opacity:0;
  background:
    radial-gradient(ellipse 78% 60% at 50% 46%, transparent 26%, rgba(5,8,15,.74) 76%, rgba(5,8,15,.95)),
    rgba(6,10,22,.5);
  animation:mcDimIn .55s ease forwards; }
.mcDimOut { animation:mcDimOutK .5s .25s ease forwards; opacity:1; }
@keyframes mcDimIn { to { opacity:1; } }
@keyframes mcDimOutK { to { opacity:0; } }
.mcBeacon { position:absolute; left:50%; top:44%; z-index:5; width:42cqw; height:66cqh;
  transform:translate(-50%,-50%); filter:blur(16px); opacity:0; pointer-events:none;
  background:
    radial-gradient(ellipse 40% 36% at 50% 44%, rgba(190,212,255,.5), transparent 62%),
    radial-gradient(ellipse 56% 48% at 50% 50%, rgba(90,130,230,.28), rgba(43,91,196,.1) 55%, transparent 78%);
  animation:mcBeaconK 2.3s ease-in-out forwards; }
@keyframes mcBeaconK { 0% { opacity:0; transform:translate(-50%,-50%) scale(.5); }
  42% { opacity:1; transform:translate(-50%,-50%) scale(1); }
  74% { opacity:.8; } 100% { opacity:.4; } }

.mcScene { position:absolute; left:50%; top:46%; z-index:6; width:64cqw; height:62cqh;
  transform:translate(-50%,-50%); pointer-events:none; }
.mcCard { position:absolute; inset:0; border-radius:12px; overflow:hidden;
  box-shadow:0 24px 52px rgba(0,0,0,.65); opacity:0;
  background:
    radial-gradient(ellipse 62% 30% at 22% 6%, rgba(126,92,38,.13), transparent 70%),
    radial-gradient(ellipse 62% 30% at 82% 96%, rgba(110,80,32,.14), transparent 70%),
    radial-gradient(ellipse 80% 60% at 50% 42%, rgba(255,251,238,.35), transparent 62%),
    linear-gradient(163deg,#fbf5e6,#f4ead1 46%,#ecdfc0 100%);
  border:1.5px solid rgba(190,146,52,.92); }
.mcCard::before { content:""; position:absolute; inset:5px; border-radius:8px; pointer-events:none; z-index:3;
  border:1px solid rgba(190,146,52,.5); box-shadow:inset 0 0 0 2.5px rgba(251,245,230,.8); }
.mc-crystal .mcCard { animation:mcCardK 2.1s cubic-bezier(.3,1.25,.45,1) forwards; }
.mc-recv .mcCard { opacity:1; }
@keyframes mcCardK {
  0% { opacity:0; transform:scale(.55); filter:brightness(3.2) blur(10px); }
  29% { opacity:1; transform:scale(1.05); filter:brightness(1.7) blur(0); }
  49% { transform:scale(1); filter:brightness(1); }
  100% { opacity:1; transform:scale(1); filter:brightness(1); } }
.mc-fly .mcCard { opacity:1; animation:mcFlyK .75s cubic-bezier(.5,-.12,.5,1) forwards; }
@keyframes mcFlyK {
  0% { opacity:1; transform:scale(1) rotate(0); }
  100% { opacity:0; transform:translate(var(--fdx,120px), var(--fdy,-300px)) scale(.1) rotate(8deg); } }
.mcGrain { position:absolute; inset:0; pointer-events:none; opacity:.5; z-index:1; display:block;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 0.42 0 0 0 0 0.32 0 0 0 0 0.16 0 0 0 0.05 0'/></filter><rect width='180' height='180' filter='url(%23n)'/></svg>");
  background-size:180px 180px; }
.mcHolo { position:absolute; inset:0; z-index:2; pointer-events:none; mix-blend-mode:overlay; opacity:.45; display:block;
  background:conic-gradient(from 0deg at 50% 42%, rgba(255,120,120,.22), rgba(255,220,120,.22), rgba(140,255,180,.2), rgba(120,180,255,.22), rgba(220,140,255,.2), rgba(255,120,120,.22));
  animation:mcHoloSpin 9s linear infinite; }
@keyframes mcHoloSpin { to { transform:rotate(360deg); } }
.mcSunburst { position:absolute; left:50%; top:33%; width:56cqw; height:56cqw; z-index:1; pointer-events:none; display:block;
  transform:translate(-50%,-50%); border-radius:50%;
  background:repeating-conic-gradient(from 0deg, rgba(178,134,44,.10) 0 4deg, transparent 4deg 12deg);
  -webkit-mask:radial-gradient(circle, #000 12%, transparent 58%); mask:radial-gradient(circle, #000 12%, transparent 58%); }
.mcFc { position:absolute; width:9cqw; height:9cqw; z-index:4; pointer-events:none; display:block; }
.mcFc::before { content:""; position:absolute; inset:0;
  background:linear-gradient(135deg,#f2d48c,#c99a35 60%,#8a6a1a);
  clip-path:polygon(0 0,100% 0,100% 16%,16% 16%,16% 100%,0 100%); }
.mcTl { left:8px; top:8px; } .mcTr { right:8px; top:8px; transform:scaleX(-1); }
.mcBl { left:8px; bottom:8px; transform:scaleY(-1); } .mcBr { right:8px; bottom:8px; transform:scale(-1); }
.mcWrap { position:absolute; inset:0; z-index:5; display:flex; flex-direction:column; align-items:center;
  padding:9.5% 8% 7.5%; text-align:center; }
.mcKlabel { font-size:2.6cqw; font-weight:900; letter-spacing:.4em; text-indent:.4em; color:#7a5c22;
  text-shadow:0 1px 0 rgba(255,252,240,.85); }
.mcKrule { display:block; margin-top:2.6%; width:30cqw; position:relative; height:0; border-top:1.4px solid rgba(178,134,44,.85); }
.mcKrule::before { content:""; position:absolute; left:0; right:0; top:2.4px; border-top:.7px solid rgba(178,134,44,.65); }
.mcKrule::after { content:""; position:absolute; left:50%; top:-3.2px; width:5px; height:5px;
  transform:translateX(-50%) rotate(45deg);
  background:linear-gradient(135deg,#f2d48c,#c99a35 60%,#8a6a1a); box-shadow:0 0 5px rgba(232,178,60,.5); }
.mcWreath { position:relative; margin-top:4.5%; width:30cqw; height:20cqw; }
.mcLeaf { position:absolute; display:block; width:4.6cqw; height:1.7cqw; border-radius:50% 50% 50% 50% / 60% 60% 40% 40%;
  background:linear-gradient(135deg,#f2d48c,#c99a35 60%,#8a6a1a);
  box-shadow:0 1px 1px rgba(90,62,10,.4), inset 0 1px 0 rgba(255,244,205,.6); }
.mcWreath .mcLeaf:nth-of-type(1) { left:8%; bottom:6%; transform:rotate(52deg); }
.mcWreath .mcLeaf:nth-of-type(2) { left:6%; bottom:24%; transform:rotate(34deg); }
.mcWreath .mcLeaf:nth-of-type(3) { left:9%; bottom:44%; transform:rotate(16deg); }
.mcWreath .mcLeaf:nth-of-type(4) { left:16%; bottom:62%; transform:rotate(-2deg); }
.mcWreath .mcLeaf:nth-of-type(5) { left:26%; bottom:74%; transform:rotate(-18deg); }
.mcWreath .mcLeaf:nth-of-type(6) { right:8%; bottom:6%; transform:scaleX(-1) rotate(52deg); }
.mcWreath .mcLeaf:nth-of-type(7) { right:6%; bottom:24%; transform:scaleX(-1) rotate(34deg); }
.mcWreath .mcLeaf:nth-of-type(8) { right:9%; bottom:44%; transform:scaleX(-1) rotate(16deg); }
.mcWreath .mcLeaf:nth-of-type(9) { right:16%; bottom:62%; transform:scaleX(-1) rotate(-2deg); }
.mcWreath .mcLeaf:nth-of-type(10) { right:26%; bottom:74%; transform:scaleX(-1) rotate(-18deg); }
.mcWstar { position:absolute; left:50%; top:-4%; transform:translateX(-50%); z-index:2; font-size:7cqw;
  animation:mcWstarK 2.8s ease-in-out infinite; }
@keyframes mcWstarK { 0%,100% { filter:drop-shadow(0 0 6px rgba(232,178,60,.5)); } 50% { filter:drop-shadow(0 0 16px rgba(232,178,60,.95)); } }
.mcMword { margin-top:1%; font-size:8.8cqw; font-weight:900; letter-spacing:.18em; text-indent:.18em; }
.mcMpiece { margin-top:2.4%; font-size:5.4cqw; font-weight:900; color:#33260a; letter-spacing:.12em; text-indent:.12em;
  text-shadow:0 1px 0 rgba(255,252,240,.95), 0 -1px 1px rgba(90,70,30,.45); }
.mcSealrow { margin-top:3.2%; display:flex; align-items:center; gap:3cqw; }
.mcSeal { width:9cqw; height:9cqw; border-radius:50%; position:relative; display:grid; place-items:center;
  background:radial-gradient(circle at 36% 30%, #a83232, #7e1c1c 55%, #541010 90%);
  box-shadow:0 2px 5px rgba(60,20,10,.45), inset 0 1px 1px rgba(255,180,160,.4), inset 0 -2px 3px rgba(40,8,8,.5); }
.mcSeal img { width:76%; height:76%; border-radius:50%; object-fit:cover; filter:sepia(.3) saturate(.9);
  box-shadow:inset 0 1px 2px rgba(60,20,10,.5); }
.mcSign { font-size:3.6cqw; font-weight:700; color:#4e3a12; font-style:italic;
  font-family:"Snell Roundhand","Brush Script MT","Zen Kaku Gothic New",cursive;
  text-shadow:0 1px 0 rgba(255,252,240,.85); transform:rotate(-2.5deg); }
.mcFoil { background:linear-gradient(100deg,#b8892e 0%,#f5d98c 25%,#fff6d8 50%,#f5d98c 75%,#b8892e 100%);
  background-size:220% 100%; -webkit-background-clip:text; background-clip:text; color:transparent;
  animation:mcFoilK 3.6s linear infinite;
  filter:drop-shadow(0 1px 0 rgba(255,252,240,.9)) drop-shadow(0 -1px 1px rgba(120,88,26,.45)); }
@keyframes mcFoilK { to { background-position:220% 0; } }
.mcKdate { margin-top:auto; font-size:2.3cqw; letter-spacing:.3em; text-indent:.3em; color:#8a7a52;
  text-shadow:0 1px 0 rgba(255,252,240,.7); }

/* ── 結晶化の演出部品 ── */
.mcPt { position:absolute; left:50%; top:50%; z-index:9; width:1.8cqw; height:1.8cqw; border-radius:50%;
  pointer-events:none; opacity:0;
  background:radial-gradient(circle, #fff6d8, #e8b23c 62%, transparent);
  animation:mcPtK 2.3s ease-in forwards; }
.mcG { background:radial-gradient(circle, #fff6d8, #e8b23c 62%, transparent); }
@keyframes mcPtK {
  0% { opacity:0; transform:translate(var(--fx),var(--fy)) scale(.4); }
  26% { opacity:1; }
  89% { opacity:1; transform:translate(0,0) scale(1.1); }
  100% { opacity:0; transform:translate(0,0) scale(.2); } }
.mcFlash { position:absolute; left:50%; top:50%; z-index:8; width:80cqw; height:80cqw; border-radius:50%; display:block;
  transform:translate(-50%,-50%); pointer-events:none; opacity:0;
  background:radial-gradient(circle, rgba(255,252,240,.98), rgba(255,230,160,.5) 36%, transparent 66%);
  animation:mcFlashK 1.1s ease-out forwards; }
@keyframes mcFlashK { 0% { opacity:0; transform:translate(-50%,-50%) scale(.25); }
  26% { opacity:1; transform:translate(-50%,-50%) scale(1); }
  100% { opacity:0; transform:translate(-50%,-50%) scale(1.4); } }
.mcRingB { position:absolute; left:50%; top:50%; z-index:9; width:40cqw; height:40cqw; border-radius:50%; display:block;
  transform:translate(-50%,-50%); pointer-events:none; opacity:0;
  border:2px solid rgba(255,240,200,.95);
  box-shadow:0 0 26px rgba(232,178,60,.75), inset 0 0 22px rgba(232,178,60,.45);
  animation:mcRingK 1.6s ease-out forwards; }
.mcR2 { width:30cqw; height:30cqw; border-color:rgba(240,246,255,.85); animation-delay:.14s; }
@keyframes mcRingK { 0% { opacity:0; transform:translate(-50%,-50%) scale(.25); }
  27% { opacity:1; } 100% { opacity:0; transform:translate(-50%,-50%) scale(2.2); } }
.mcSparkle { position:absolute; z-index:9; width:5px; height:5px; border-radius:50%; pointer-events:none; opacity:0;
  background:radial-gradient(circle,#fff,#ffe9a8 60%,transparent);
  animation:mcTwkK 1.2s ease-in-out forwards; }
@keyframes mcTwkK { 0% { opacity:0; transform:scale(.3); } 25% { opacity:1; transform:scale(1.2); }
  55% { opacity:.4; } 75% { opacity:1; transform:scale(1); } 100% { opacity:0; transform:scale(.3); } }

/* ── ボタン ── */
.mcRecv { position:absolute; left:0; right:0; bottom:10cqh; z-index:30; text-align:center; animation:mcRecvIn .45s ease backwards; }
@keyframes mcRecvIn { from { opacity:0; transform:translateY(10px) scale(.92); } to { opacity:1; transform:translateY(0) scale(1); } }
.mcRecv button { position:relative; padding:1.8cqh 8cqw; border-radius:999px; border:none; cursor:pointer; font-family:inherit;
  background:linear-gradient(180deg,#3a68c9,#2b5bc4 60%,#1f4196); color:#edf1fa;
  font-size:12px; font-weight:800; letter-spacing:.24em; text-indent:.24em;
  box-shadow:0 8px 20px rgba(20,40,110,.5), inset 0 1px 1px rgba(255,255,255,.28);
  animation:mcRing2 1.8s .3s ease-out infinite; }
@keyframes mcRing2 {
  0% { box-shadow:0 8px 20px rgba(20,40,110,.5), inset 0 1px 1px rgba(255,255,255,.28), 0 0 0 0 rgba(232,178,60,.6); }
  60%, 100% { box-shadow:0 8px 20px rgba(20,40,110,.5), inset 0 1px 1px rgba(255,255,255,.28), 0 0 0 14px rgba(232,178,60,0); } }
      `}</style>
    </div>
  )
}
