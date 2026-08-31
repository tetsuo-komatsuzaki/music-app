"use client"

// ============================================================
// メダル授与モーション (肉付け・2026-08-30 Tetsuo承認 genspark高級版v4の移植)。
// 正本: treasure-handoff/medal-motion-approved-v4.html。
// v4は9秒ループの%タイムライン。実アプリはフェーズ制:
//   dim+ビーコン → 落下 (バウンド)+金粒子 → 振り子のゆれ (自動) → きらり+うけとる待ち
//   → マイランクカードへ飛翔+光粒子 → 完了。
// v4のcqh/cqw座標系を保つため、全画面ステージに container-type:size を張り
// CSSをほぼ原文のまま流用する (キーフレームのみフェーズ分割)。
// reduced-motion は呼び手 (TreasureCelebration) が演出ごと省略する。
// ============================================================

import { useEffect, useRef, useState } from "react"

type Phase = "fall" | "swing" | "recv" | "fly"

export default function MedalAwardMotion({ count, onDone }: { count: number; onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>("fall")
  const [fly, setFly] = useState<{ dx: number; dy: number } | null>(null)
  const phaseRef = useRef<Phase>("fall")
  phaseRef.current = phase

  useEffect(() => {
    if (phase !== "fall") return
    const t = setTimeout(() => setPhase("swing"), 1150)
    return () => clearTimeout(t)
  }, [phase])

  useEffect(() => {
    if (phase !== "swing") return
    const t = setTimeout(() => setPhase("recv"), 2250)
    return () => clearTimeout(t)
  }, [phase])

  useEffect(() => {
    if (phase !== "fly") return
    const t = setTimeout(() => onDone(), 800)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const startFly = () => {
    const card = document.querySelector<HTMLElement>('[data-guide="home-rank-card"]')
    const vw = window.innerWidth
    const vh = window.innerHeight
    const startX = vw / 2
    const startY = vh * 0.06 + vh * 0.28 // mwrap top6% + メダル高さの過半
    let dx = vw * 0.3
    let dy = -vh * 0.2
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
    if (p === "fall" || p === "swing") setPhase("recv")
    else if (p === "recv") startFly()
  }

  return (
    <div onClick={advance} style={{ position: "fixed", inset: 0, zIndex: 941, cursor: "pointer" }} aria-hidden>
      {/* v4のcqh/cqw座標系を成立させるステージ */}
      <div className="maStage">
        <div className={`maDim ${phase === "fly" ? "maDimOut" : ""}`} />
        {phase === "fall" && <div className="maBeacon" />}
        <div
          className={`maWrap ma-${phase}`}
          style={fly ? ({ ["--fdx" as string]: `${fly.dx}px`, ["--fdy" as string]: `${fly.dy}px` }) : undefined}
        >
          <div className={`maMm ${phase === "swing" ? "maSwinging" : ""}`}>
            <div className="maRib"><span className="maRibbar" /><span className="maRibEdgeL" /><span className="maRibEdgeR" /><span className="maRibL" /><span className="maRibR" /></div>
            <span className="maRibtail" />
            <span className="maBail" />
            <div className="maDisc">
              <span className="maEdge" />
              <span className="maRim" />
              <span className="maFace"><span className="maRelief">
                <span className="maLaurel"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></span>
                <b>{count}</b><small>CARDS</small>
              </span></span>
            </div>
            {phase === "recv" && <span className="maShine" />}
          </div>
        </div>
        {(phase === "swing" || phase === "recv") && (
          <div className="maDust"><span /><span /><span /><span /><span /></div>
        )}
        {phase === "fly" && <div className="maStream"><span /><span /><span /><span /></div>}
        {phase === "recv" && (
          <div className="maRecv">
            <button type="button" onClick={(e) => { e.stopPropagation(); startFly() }}>うけとる</button>
          </div>
        )}
      </div>
      {/* v4 CSSの移植 (%タイムライン→フェーズ別・ma-接頭辞) */}
      <style>{`
.maStage { position:absolute; inset:0; container-type:size; }
.maDim { position:absolute; inset:0; z-index:3; opacity:0;
  background:radial-gradient(ellipse 66% 52% at 50% 32%, rgba(6,10,22,.28) 0%, rgba(6,10,22,.72) 60%, rgba(4,7,16,.88) 100%);
  animation:maDimIn .55s ease forwards; }
.maDimOut { animation:maDimOutK .5s .25s ease forwards; opacity:1; }
@keyframes maDimIn { to { opacity:1; } }
@keyframes maDimOutK { to { opacity:0; } }
.maBeacon { position:absolute; left:50%; top:28%; width:6px; height:6px; border-radius:50%; z-index:4;
  background:#f0cd7c; opacity:0; transform:translate(-50%,-50%); animation:maBeaconK 1.1s .1s linear forwards; }
@keyframes maBeaconK {
  0% { opacity:0; transform:translate(-50%,-50%) scale(.3); }
  33% { opacity:1; }
  66% { transform:translate(-50%,-50%) scale(2.4); box-shadow:0 0 34px 10px rgba(232,178,60,.4); }
  100% { opacity:0; transform:translate(-50%,-50%) scale(3.4); box-shadow:0 0 70px 26px rgba(232,178,60,0); } }
.maWrap { position:absolute; left:50%; top:6%; z-index:5; transform:translate(-50%,0); transform-origin:50% 0; }
.ma-fall { animation:maFallK 1.1s .1s cubic-bezier(.3,.85,.35,1) backwards; }
@keyframes maFallK {
  0% { opacity:0; transform:translate(-50%,-52cqh); }
  83% { opacity:1; transform:translate(-50%,1.2cqh); }
  100% { opacity:1; transform:translate(-50%,0); } }
.ma-fly { animation:maFlyK .75s cubic-bezier(.5,-.12,.5,1) forwards; }
@keyframes maFlyK {
  0% { opacity:1; transform:translate(-50%,0) rotate(0) scale(1); }
  100% { opacity:0; transform:translate(calc(-50% + var(--fdx,120px)), var(--fdy,-300px)) scale(.12) rotate(8deg); } }
.maMm { position:relative; width:34cqw; height:46cqh; filter:drop-shadow(0 18px 22px rgba(0,0,0,.6)); transform-origin:50% 0; }
.maSwinging { animation:maSwingK 2.2s ease-in-out; }
@keyframes maSwingK {
  0% { rotate:0deg; } 25% { rotate:6.5deg; } 45% { rotate:-4.5deg; }
  62% { rotate:2.8deg; } 78% { rotate:-1.3deg; } 100% { rotate:0deg; } }
.maRib { position:absolute; left:50%; top:0; width:17cqw; height:22cqh; transform:translateX(-50%); }
.maRibbar { position:absolute; left:50%; top:-0.4cqh; width:19cqw; height:1.7cqh; transform:translateX(-50%);
  border-radius:0.85cqh;
  background:linear-gradient(180deg,#f7dd9a 8%,#e8b23c 38%,#a5761c 78%,#6e4e0e);
  box-shadow:0 2px 4px rgba(0,0,0,.55), inset 0 1px 1px rgba(255,246,214,.9), inset 0 -1px 2px rgba(60,40,2,.7); }
.maRibbar::before, .maRibbar::after { content:""; position:absolute; top:50%; width:2.2cqw; height:2.2cqw; border-radius:50%;
  transform:translateY(-50%);
  background:radial-gradient(circle at 35% 30%, #fdf0c0, #e8b23c 55%, #7a5a12);
  box-shadow:inset 0 -1px 1px rgba(60,40,2,.8), 0 1px 2px rgba(0,0,0,.5); }
.maRibbar::before { left:-0.6cqw; }
.maRibbar::after { right:-0.6cqw; }
.maRibL, .maRibR { position:absolute; top:0; width:52%; height:100%;
  background:
    repeating-radial-gradient(ellipse 240% 60% at 50% -40%, rgba(255,255,255,.10) 0 0.55cqh, rgba(10,20,50,.16) 0.55cqh 1.1cqh),
    linear-gradient(180deg,#4a7ade 0%,#2c4d9e 45%,#1c3568 100%);
  clip-path:polygon(0 0,100% 0,88% 100%,0 100%); }
.maRibL { left:0; transform:skewY(-4deg);
  box-shadow:inset -4px 0 6px rgba(0,0,0,.45), inset 2px 0 3px rgba(255,255,255,.18); }
.maRibR { right:0; transform:skewY(4deg) scaleX(-1);
  box-shadow:inset -4px 0 6px rgba(0,0,0,.45), inset 2px 0 3px rgba(255,255,255,.18); }
.maRibEdgeL, .maRibEdgeR { position:absolute; top:0; width:1.1cqw; height:100%; z-index:2;
  background:linear-gradient(180deg,#f7dd9a,#e8b23c 40%,#c99a35 75%,#8a6a1a);
  box-shadow:inset 0 0 1px rgba(255,246,214,.7), 0 0 3px rgba(0,0,0,.4); }
.maRibEdgeL { left:0; clip-path:polygon(0 0,100% 0,62% 100%,0 100%); transform:skewY(-4deg); }
.maRibEdgeR { right:0; clip-path:polygon(0 0,100% 0,100% 100%,38% 100%); transform:skewY(4deg); }
.maRib::before { content:""; position:absolute; left:50%; top:0; width:1.4cqw; height:100%; transform:translateX(-50%); z-index:3;
  background:linear-gradient(90deg, rgba(255,255,255,.14), rgba(6,12,32,.5) 55%, rgba(6,12,32,.15));
  clip-path:polygon(0 0,100% 0,60% 100%,40% 100%); }
.maRib::after { content:""; position:absolute; inset:0; z-index:2;
  background:repeating-linear-gradient(0deg, transparent 0 0.42cqh, rgba(255,255,255,.05) 0.42cqh 0.5cqh, transparent 0.5cqh 0.84cqh, rgba(0,0,0,.10) 0.84cqh 0.92cqh); }
.maRibtail { position:absolute; left:50%; top:20.5cqh; width:17cqw; height:3.6cqh; transform:translateX(-50%);
  background:
    repeating-radial-gradient(ellipse 240% 60% at 50% -380%, rgba(255,255,255,.08) 0 0.55cqh, rgba(10,20,50,.14) 0.55cqh 1.1cqh),
    linear-gradient(180deg,#2c4d9e,#16264a);
  clip-path:polygon(0 0,100% 0,100% 55%,50% 100%,0 55%);
  box-shadow:0 2px 3px rgba(0,0,0,.4); }
.maRibtail::after { content:""; position:absolute; inset:0;
  background:linear-gradient(180deg, transparent 78%, rgba(232,178,60,.85) 92%, rgba(247,221,154,.9));
  clip-path:polygon(0 0,100% 0,100% 55%,50% 100%,0 55%); }
.maBail { position:absolute; left:50%; top:21.6cqh; width:5.6cqw; height:5.6cqw; transform:translateX(-50%);
  border-radius:50%;
  background:radial-gradient(circle at 34% 30%, transparent 42%, #f7d98a 46%, #c99a35 62%, #7a5a12 82%, transparent 88%);
  box-shadow:0 2px 4px rgba(0,0,0,.5); }
.maDisc { position:absolute; left:50%; bottom:0; width:29cqw; height:29cqw; transform:translateX(-50%); border-radius:50%; }
.maEdge { position:absolute; inset:0; border-radius:50%;
  background:repeating-conic-gradient(from 0deg, #8a6a1a 0deg 2.4deg, #d9b054 2.4deg 4.8deg);
  box-shadow:0 10px 22px rgba(0,0,0,.6); }
.maRim { position:absolute; inset:2.2%; border-radius:50%;
  background:conic-gradient(from 210deg, #8a6a1a, #f7dd9a 18%, #c99a35 32%, #8a6a1a 48%, #f0cd7c 62%, #a5761c 78%, #8a6a1a);
  box-shadow:inset 0 2px 3px rgba(255,244,205,.95), inset 0 -3px 5px rgba(74,50,4,.75); }
.maRim::after { content:""; position:absolute; inset:6%; border-radius:50%;
  background:repeating-conic-gradient(transparent 0deg 6deg, rgba(90,60,8,.5) 6deg 6.8deg);
  -webkit-mask:radial-gradient(circle, transparent 62%, #000 64%, #000 78%, transparent 80%);
          mask:radial-gradient(circle, transparent 62%, #000 64%, #000 78%, transparent 80%); }
.maFace { position:absolute; inset:11%; border-radius:50%; overflow:hidden;
  background:radial-gradient(circle at 50% 30%, #ffe9ad 0%, #f0c35c 34%, #d9a93c 62%, #a5761c 100%);
  box-shadow:inset 0 2px 6px rgba(74,50,4,.55), inset 0 -2px 3px rgba(255,244,205,.5);
  display:grid; place-items:center; text-align:center; }
.maFace::before { content:""; position:absolute; inset:0; border-radius:50%; opacity:.35;
  background:repeating-radial-gradient(circle at 50% 50%, transparent 0 2px, rgba(122,90,18,.25) 2px 2.6px); }
.maFace::after { content:""; position:absolute; inset:0; border-radius:50%;
  background:linear-gradient(115deg, transparent 30%, rgba(255,244,205,.4) 45%, rgba(255,255,255,.75) 50%, rgba(255,244,205,.4) 55%, transparent 70%);
  transform:translateX(-135%); animation:maSweepK 2.8s .9s ease-in-out infinite; }
@keyframes maSweepK { 0% { transform:translateX(-135%); } 55%,100% { transform:translateX(135%); } }
.maRelief { position:relative; z-index:2; display:flex; flex-direction:column; align-items:center; }
.maLaurel { position:absolute; left:50%; top:50%; width:86%; height:86%; transform:translate(-50%,-50%); }
.maLaurel i { position:absolute; left:50%; top:50%; width:3.4cqw; height:1.7cqw; border-radius:50% 50% 50% 0;
  background:linear-gradient(135deg, #e9c268, #a5761c);
  box-shadow:0 .4px 0 rgba(255,244,205,.7), inset 0 -.5px 1px rgba(74,50,4,.6);
  transform-origin:0 0; }
.maLaurel i:nth-child(1){ transform:translate(-50%,-50%) rotate(200deg) translateX(9.2cqw) rotate(40deg); }
.maLaurel i:nth-child(2){ transform:translate(-50%,-50%) rotate(220deg) translateX(9.4cqw) rotate(42deg); }
.maLaurel i:nth-child(3){ transform:translate(-50%,-50%) rotate(240deg) translateX(9.5cqw) rotate(44deg); }
.maLaurel i:nth-child(4){ transform:translate(-50%,-50%) rotate(260deg) translateX(9.4cqw) rotate(46deg); }
.maLaurel i:nth-child(5){ transform:translate(-50%,-50%) rotate(280deg) translateX(9.2cqw) rotate(48deg); }
.maLaurel i:nth-child(6){ transform:translate(-50%,-50%) rotate(340deg) translateX(9.2cqw) scaleX(-1) rotate(40deg); }
.maLaurel i:nth-child(7){ transform:translate(-50%,-50%) rotate(320deg) translateX(9.4cqw) scaleX(-1) rotate(42deg); }
.maLaurel i:nth-child(8){ transform:translate(-50%,-50%) rotate(300deg) translateX(9.5cqw) scaleX(-1) rotate(44deg); }
.maLaurel i:nth-child(9){ transform:translate(-50%,-50%) rotate(280deg) translateX(0); opacity:0; }
.maLaurel i:nth-child(10){ transform:translate(-50%,-50%) rotate(100deg) translateX(9.4cqw) scaleX(-1) rotate(46deg); }
.maLaurel i:nth-child(11){ transform:translate(-50%,-50%) rotate(80deg) translateX(9.2cqw) scaleX(-1) rotate(48deg); }
.maRelief b { position:relative; font-family:Georgia,serif; font-weight:700; font-size:9cqw; line-height:1;
  color:#b8892e;
  text-shadow:0 1px 0 rgba(255,244,205,.9), 0 -1.2px 1.5px rgba(74,50,4,.7), 0 0 2px rgba(122,90,18,.4); }
.maRelief small { position:relative; margin-top:.5cqh; font-size:2.2cqw; font-weight:900; letter-spacing:.2em;
  color:#a5761c;
  text-shadow:0 .8px 0 rgba(255,244,205,.8), 0 -.8px 1px rgba(74,50,4,.5); }
.maShine { position:absolute; left:60%; bottom:12cqh; width:2px; height:2px; border-radius:50%; opacity:0; pointer-events:none;
  box-shadow:0 0 18px 10px rgba(255,244,205,.95), 0 0 50px 24px rgba(240,205,124,.55);
  animation:maShineK .9s .15s ease forwards; }
@keyframes maShineK { 0% { opacity:0; } 30% { opacity:1; } 100% { opacity:0; } }
.maDust span { position:absolute; left:50%; top:58%; width:.55cqh; height:.55cqh; border-radius:50%;
  background:#f0cd7c; opacity:0; z-index:6; animation:maDustK 1.3s ease-out forwards; }
.maDust span:nth-child(1) { --dx:-9cqw; --dy:-6cqh; }
.maDust span:nth-child(2) { --dx:8cqw; --dy:-8cqh; animation-delay:.05s; }
.maDust span:nth-child(3) { --dx:-5cqw; --dy:-11cqh; animation-delay:.1s; }
.maDust span:nth-child(4) { --dx:6cqw; --dy:-4cqh; animation-delay:.02s; }
.maDust span:nth-child(5) { --dx:0cqw; --dy:-13cqh; animation-delay:.08s; }
@keyframes maDustK { 0% { opacity:0; transform:translate(0,0) scale(.5); } 18% { opacity:.9; }
  100% { opacity:0; transform:translate(var(--dx),var(--dy)) scale(1); } }
.maStream span { position:absolute; left:50%; top:32%; width:.5cqh; height:.5cqh; border-radius:50%;
  background:#f0cd7c; opacity:0; z-index:6; animation:maStreamK .7s ease-in forwards; }
.maStream span:nth-child(2){ animation-delay:.1s; }
.maStream span:nth-child(3){ animation-delay:.2s; }
.maStream span:nth-child(4){ animation-delay:.28s; }
@keyframes maStreamK { 0% { opacity:0; } 30% { opacity:1; }
  100% { opacity:0; transform:translate(calc(var(--fdx,120px)*.9), calc(var(--fdy,-260px)*.9)) scale(.4); } }
.maRecv { position:absolute; left:0; right:0; top:64%; z-index:7; text-align:center; animation:maRecvIn .3s ease backwards; }
@keyframes maRecvIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; } }
.maRecv button { background:#2b5bc4; color:#fff; border:none; border-radius:999px; padding:13px 44px;
  font-size:14px; font-weight:900; cursor:pointer; font-family:inherit;
  box-shadow:0 6px 18px rgba(43,91,196,.45); animation:maRing 1.8s ease-out infinite; }
@keyframes maRing { 0% { box-shadow:0 6px 18px rgba(43,91,196,.45), 0 0 0 0 rgba(232,178,60,.55); }
  60%,100% { box-shadow:0 6px 18px rgba(43,91,196,.45), 0 0 0 14px rgba(232,178,60,0); } }
      `}</style>
    </div>
  )
}
