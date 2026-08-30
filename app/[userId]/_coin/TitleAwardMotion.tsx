"use client"

// ============================================================
// 称号カード 授与モーション (肉付け・2026-08-31 Tetsuo承認 genspark「結晶」パターンの移植)。
// 正本: treasure-handoff/title-card-approved-crystal.html (5案中パターンA=光の結晶化)。
// 12秒ループの%タイムラインをフェーズ制に変換:
//   青い光の柱+粒子が中心へ集積 → 閃光+光輪 → カードが光から凝結 → きらめき
//   → うけとる待ち → マイランクカードへ飛翔 → 完了。
// 券面: クリーム+金縁のカード族に青の差し色 (称号=青の格式)。
// 青メダリオン紋章+★ / 金箔の★列 / ランク名 / 日付。ホロとサンバースト。
// reduced-motion は呼び手 (TreasureCelebration) が演出ごと省略する。
// ============================================================

import { useEffect, useRef, useState } from "react"

type Phase = "gather" | "crystal" | "recv" | "fly"

export type TitleFace = {
  /** 新しい★ */
  star: number
  /** 新しいランク名 (rankCard.ts の rankName) */
  rankName: string
  /** 授与日 (YYYY.MM.DD) */
  date: string
}

export default function TitleAwardMotion({ face, onDone }: { face: TitleFace; onDone: () => void }) {
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

  const stars = "★".repeat(Math.min(Math.max(face.star, 1), 5))

  return (
    <div onClick={advance} style={{ position: "fixed", inset: 0, zIndex: 941, cursor: "pointer" }} aria-hidden>
      <div className={`tiStage ti-${phase}`} style={fly ? ({ ["--fdx" as string]: `${fly.dx}px`, ["--fdy" as string]: `${fly.dy}px` }) : undefined}>
        <div className={`tiDim ${phase === "fly" ? "tiDimOut" : ""}`} />
        {(phase === "gather" || phase === "crystal") && <div className="tiBeacon" />}
        <div className="tiScene">
          <div className="tiCard">
            <i className="tiGrain" />
            <i className="tiHolo" />
            <i className="tiSunburst" />
            <i className="tiFc tiTl" /><i className="tiFc tiTr" /><i className="tiFc tiBl" /><i className="tiFc tiBr" />
            <div className="tiWrap">
              <div className="tiKlabel">称号カード</div>
              <i className="tiKrule" />
              <div className="tiEmblem"><i className="tiEmedal" /><span className="tiEstar">★</span></div>
              <div className="tiKstars tiFoil">{stars}</div>
              <div className="tiKrank">{face.rankName}</div>
              <div className="tiKtitle">ランクアップの称号</div>
              <div className="tiKdate">{face.date}</div>
            </div>
          </div>
          {phase === "gather" && (
            <>
              <span className="tiPt tiG" style={{ ["--fx" as string]: "-24cqw", ["--fy" as string]: "-18cqh" }} />
              <span className="tiPt" style={{ ["--fx" as string]: "-4cqw", ["--fy" as string]: "-26cqh" }} />
              <span className="tiPt tiG" style={{ ["--fx" as string]: "18cqw", ["--fy" as string]: "-20cqh" }} />
              <span className="tiPt" style={{ ["--fx" as string]: "26cqw", ["--fy" as string]: "-8cqh" }} />
              <span className="tiPt tiG" style={{ ["--fx" as string]: "24cqw", ["--fy" as string]: "8cqh" }} />
              <span className="tiPt" style={{ ["--fx" as string]: "10cqw", ["--fy" as string]: "18cqh" }} />
              <span className="tiPt tiG" style={{ ["--fx" as string]: "-14cqw", ["--fy" as string]: "16cqh" }} />
              <span className="tiPt" style={{ ["--fx" as string]: "-27cqw", ["--fy" as string]: "4cqh" }} />
              <span className="tiPt tiG" style={{ ["--fx" as string]: "-12cqw", ["--fy" as string]: "-22cqh" }} />
              <span className="tiPt" style={{ ["--fx" as string]: "20cqw", ["--fy" as string]: "22cqh" }} />
              <span className="tiPt tiG" style={{ ["--fx" as string]: "-22cqw", ["--fy" as string]: "12cqh" }} />
              <span className="tiPt" style={{ ["--fx" as string]: "6cqw", ["--fy" as string]: "-16cqh" }} />
            </>
          )}
          {phase === "crystal" && (
            <>
              <i className="tiFlash" />
              <i className="tiRingB" />
              <i className="tiRingB tiR2" />
              <span className="tiSparkle" style={{ left: "20%", top: "22%", animationDelay: "1.1s" }} />
              <span className="tiSparkle" style={{ left: "78%", top: "30%", animationDelay: "1.45s" }} />
              <span className="tiSparkle" style={{ left: "16%", top: "60%", animationDelay: "1.8s" }} />
              <span className="tiSparkle" style={{ left: "82%", top: "64%", animationDelay: "1.25s" }} />
              <span className="tiSparkle" style={{ left: "50%", top: "16%", animationDelay: "1.6s" }} />
            </>
          )}
        </div>
        {phase === "recv" && (
          <div className="tiRecv">
            <button type="button" onClick={(e) => { e.stopPropagation(); startFly() }}>うけとる</button>
          </div>
        )}
      </div>
      {/* 結晶パターンCSS (genspark正本の移植・ti接頭辞・%タイムライン→フェーズ別) */}
      <style>{`
.tiStage { position:absolute; inset:0; container-type:size; }
.tiDim { position:absolute; inset:0; z-index:2; opacity:0;
  background:
    radial-gradient(ellipse 78% 60% at 50% 46%, transparent 26%, rgba(5,8,15,.74) 76%, rgba(5,8,15,.95)),
    rgba(6,10,22,.5);
  animation:tiDimIn .55s ease forwards; }
.tiDimOut { animation:tiDimOutK .5s .25s ease forwards; opacity:1; }
@keyframes tiDimIn { to { opacity:1; } }
@keyframes tiDimOutK { to { opacity:0; } }
.tiBeacon { position:absolute; left:50%; top:44%; z-index:5; width:42cqw; height:66cqh;
  transform:translate(-50%,-50%); filter:blur(16px); opacity:0; pointer-events:none;
  background:
    radial-gradient(ellipse 40% 36% at 50% 44%, rgba(190,212,255,.5), transparent 62%),
    radial-gradient(ellipse 56% 48% at 50% 50%, rgba(90,130,230,.28), rgba(43,91,196,.1) 55%, transparent 78%);
  animation:tiBeaconK 2.3s ease-in-out forwards; }
@keyframes tiBeaconK { 0% { opacity:0; transform:translate(-50%,-50%) scale(.5); }
  42% { opacity:1; transform:translate(-50%,-50%) scale(1); }
  74% { opacity:.8; } 100% { opacity:.4; } }

.tiScene { position:absolute; left:50%; top:46%; z-index:6; width:64cqw; height:62cqh;
  transform:translate(-50%,-50%); pointer-events:none; }
.tiCard { position:absolute; inset:0; border-radius:12px; overflow:hidden;
  box-shadow:0 24px 52px rgba(0,0,0,.65); opacity:0;
  background:
    radial-gradient(ellipse 62% 30% at 22% 6%, rgba(126,92,38,.13), transparent 70%),
    radial-gradient(ellipse 62% 30% at 82% 96%, rgba(110,80,32,.14), transparent 70%),
    radial-gradient(ellipse 80% 60% at 50% 42%, rgba(255,251,238,.35), transparent 62%),
    linear-gradient(163deg,#fbf5e6,#f4ead1 46%,#ecdfc0 100%);
  border:1.5px solid rgba(190,146,52,.92); }
.tiCard::before { content:""; position:absolute; inset:5px; border-radius:8px; pointer-events:none; z-index:3;
  border:1px solid rgba(190,146,52,.5); box-shadow:inset 0 0 0 2.5px rgba(251,245,230,.8); }
.ti-crystal .tiCard { animation:tiCardK 2.1s cubic-bezier(.3,1.25,.45,1) forwards; }
.ti-recv .tiCard { opacity:1; }
@keyframes tiCardK {
  0% { opacity:0; transform:scale(.55); filter:brightness(3.2) blur(10px); }
  29% { opacity:1; transform:scale(1.05); filter:brightness(1.7) blur(0); }
  49% { transform:scale(1); filter:brightness(1); }
  100% { opacity:1; transform:scale(1); filter:brightness(1); } }
.ti-fly .tiCard { opacity:1; animation:tiFlyK .75s cubic-bezier(.5,-.12,.5,1) forwards; }
@keyframes tiFlyK {
  0% { opacity:1; transform:scale(1) rotate(0); }
  100% { opacity:0; transform:translate(var(--fdx,120px), var(--fdy,-300px)) scale(.1) rotate(8deg); } }
.tiGrain { position:absolute; inset:0; pointer-events:none; opacity:.5; z-index:1; display:block;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 0.42 0 0 0 0 0.32 0 0 0 0 0.16 0 0 0 0.05 0'/></filter><rect width='180' height='180' filter='url(%23n)'/></svg>");
  background-size:180px 180px; }
.tiHolo { position:absolute; inset:0; z-index:2; pointer-events:none; mix-blend-mode:overlay; opacity:.45; display:block;
  background:conic-gradient(from 0deg at 50% 42%, rgba(255,120,120,.22), rgba(255,220,120,.22), rgba(140,255,180,.2), rgba(120,180,255,.22), rgba(220,140,255,.2), rgba(255,120,120,.22));
  animation:tiHoloSpin 9s linear infinite; }
@keyframes tiHoloSpin { to { transform:rotate(360deg); } }
.tiSunburst { position:absolute; left:50%; top:33%; width:56cqw; height:56cqw; z-index:1; pointer-events:none; display:block;
  transform:translate(-50%,-50%); border-radius:50%;
  background:repeating-conic-gradient(from 0deg, rgba(178,134,44,.10) 0 4deg, transparent 4deg 12deg);
  -webkit-mask:radial-gradient(circle, #000 12%, transparent 58%); mask:radial-gradient(circle, #000 12%, transparent 58%); }
.tiFc { position:absolute; width:9cqw; height:9cqw; z-index:4; pointer-events:none; display:block; }
.tiFc::before { content:""; position:absolute; inset:0;
  background:linear-gradient(135deg,#7a9ade,#3d5da8 60%,#25406e);
  clip-path:polygon(0 0,100% 0,100% 16%,16% 16%,16% 100%,0 100%); }
.tiTl { left:8px; top:8px; } .tiTr { right:8px; top:8px; transform:scaleX(-1); }
.tiBl { left:8px; bottom:8px; transform:scaleY(-1); } .tiBr { right:8px; bottom:8px; transform:scale(-1); }
.tiWrap { position:absolute; inset:0; z-index:5; display:flex; flex-direction:column; align-items:center;
  padding:9.5% 8% 7.5%; text-align:center; }
.tiKlabel { font-size:2.6cqw; font-weight:900; letter-spacing:.4em; text-indent:.4em; color:#3d5da8;
  text-shadow:0 1px 0 rgba(255,252,240,.85); }
.tiKrule { display:block; margin-top:2.6%; width:30cqw; position:relative; height:0; border-top:1.4px solid rgba(61,93,168,.85); }
.tiKrule::before { content:""; position:absolute; left:0; right:0; top:2.4px; border-top:.7px solid rgba(61,93,168,.6); }
.tiKrule::after { content:""; position:absolute; left:50%; top:-3.2px; width:5px; height:5px;
  transform:translateX(-50%) rotate(45deg);
  background:linear-gradient(135deg,#7a9ade,#3d5da8 60%,#25406e); }
.tiEmblem { position:relative; margin-top:5%; width:27cqw; height:27cqw; }
.tiEmedal { position:absolute; inset:0; border-radius:50%; overflow:hidden; display:block;
  background:
    repeating-conic-gradient(from 0deg, rgba(200,220,255,.16) 0 6deg, rgba(20,35,70,.16) 6deg 12deg),
    radial-gradient(circle at 36% 28%, #5578c4, #3d5da8 42%, #25406e 82%, #16264a);
  box-shadow:0 5px 12px rgba(20,35,70,.5), inset 0 2px 3px rgba(200,220,255,.4), inset 0 -3px 6px rgba(8,14,36,.7); }
.tiEmedal::before { content:""; position:absolute; inset:7%; border-radius:50%;
  border:1.2px solid rgba(200,220,255,.5); box-shadow:inset 0 1px 2px rgba(200,220,255,.3); }
.tiEmedal::after { content:""; position:absolute; inset:15%; border-radius:50%;
  background:radial-gradient(circle at 40% 32%, rgba(122,154,222,.85), rgba(37,64,110,.45) 60%, transparent);
  border:1px solid rgba(122,154,222,.4); }
.tiEstar { position:absolute; inset:0; display:grid; place-items:center; z-index:2;
  font-size:11.5cqw; font-weight:900; color:#eaf1ff;
  text-shadow:0 1px 0 rgba(255,255,255,.5), 0 -1px 2px rgba(8,14,36,.8), 0 0 14px rgba(140,175,255,.6); }
.tiFoil { background:linear-gradient(100deg,#b8892e 0%,#f5d98c 25%,#fff6d8 50%,#f5d98c 75%,#b8892e 100%);
  background-size:220% 100%; -webkit-background-clip:text; background-clip:text; color:transparent;
  animation:tiFoilK 3.6s linear infinite;
  filter:drop-shadow(0 1px 0 rgba(255,252,240,.9)) drop-shadow(0 -1px 1px rgba(120,88,26,.45)); }
@keyframes tiFoilK { to { background-position:220% 0; } }
.tiKstars { margin-top:4.5%; font-size:7.6cqw; line-height:1; letter-spacing:.14em; text-indent:.14em; }
.tiKrank { margin-top:3.4%; font-size:6.2cqw; font-weight:900; color:#2c2a1a; letter-spacing:.1em; text-indent:.1em;
  text-shadow:0 1px 0 rgba(255,252,240,.95), 0 -1px 1px rgba(90,70,30,.4); }
.tiKtitle { margin-top:2.2%; font-size:3cqw; font-weight:700; letter-spacing:.3em; text-indent:.3em;
  color:#6b6455; text-shadow:0 1px 0 rgba(255,252,240,.7); }
.tiKdate { margin-top:auto; font-size:2.3cqw; letter-spacing:.3em; text-indent:.3em; color:#8a7a52;
  text-shadow:0 1px 0 rgba(255,252,240,.7); }

/* ── 結晶化の演出部品 ── */
.tiPt { position:absolute; left:50%; top:50%; z-index:9; width:1.8cqw; height:1.8cqw; border-radius:50%;
  pointer-events:none; opacity:0;
  background:radial-gradient(circle, #eaf1ff, #5b84e0 62%, transparent);
  animation:tiPtK 2.3s ease-in forwards; }
.tiG { background:radial-gradient(circle, #fff6d8, #e8b23c 62%, transparent); }
@keyframes tiPtK {
  0% { opacity:0; transform:translate(var(--fx),var(--fy)) scale(.4); }
  26% { opacity:1; }
  89% { opacity:1; transform:translate(0,0) scale(1.1); }
  100% { opacity:0; transform:translate(0,0) scale(.2); } }
.tiFlash { position:absolute; left:50%; top:50%; z-index:8; width:80cqw; height:80cqw; border-radius:50%; display:block;
  transform:translate(-50%,-50%); pointer-events:none; opacity:0;
  background:radial-gradient(circle, rgba(255,252,240,.98), rgba(190,212,255,.5) 36%, transparent 66%);
  animation:tiFlashK 1.1s ease-out forwards; }
@keyframes tiFlashK { 0% { opacity:0; transform:translate(-50%,-50%) scale(.25); }
  26% { opacity:1; transform:translate(-50%,-50%) scale(1); }
  100% { opacity:0; transform:translate(-50%,-50%) scale(1.4); } }
.tiRingB { position:absolute; left:50%; top:50%; z-index:9; width:40cqw; height:40cqw; border-radius:50%; display:block;
  transform:translate(-50%,-50%); pointer-events:none; opacity:0;
  border:2px solid rgba(190,212,255,.95);
  box-shadow:0 0 26px rgba(90,140,255,.7), inset 0 0 22px rgba(90,140,255,.4);
  animation:tiRingK 1.6s ease-out forwards; }
.tiR2 { width:30cqw; height:30cqw; border-color:rgba(240,246,255,.85); animation-delay:.14s; }
@keyframes tiRingK { 0% { opacity:0; transform:translate(-50%,-50%) scale(.25); }
  27% { opacity:1; } 100% { opacity:0; transform:translate(-50%,-50%) scale(2.2); } }
.tiSparkle { position:absolute; z-index:9; width:5px; height:5px; border-radius:50%; pointer-events:none; opacity:0;
  background:radial-gradient(circle,#fff,#ffe9a8 60%,transparent);
  animation:tiTwkK 1.2s ease-in-out forwards; }
@keyframes tiTwkK { 0% { opacity:0; transform:scale(.3); } 25% { opacity:1; transform:scale(1.2); }
  55% { opacity:.4; } 75% { opacity:1; transform:scale(1); } 100% { opacity:0; transform:scale(.3); } }

/* ── ボタン ── */
.tiRecv { position:absolute; left:0; right:0; bottom:10cqh; z-index:30; text-align:center; animation:tiRecvIn .45s ease backwards; }
@keyframes tiRecvIn { from { opacity:0; transform:translateY(10px) scale(.92); } to { opacity:1; transform:translateY(0) scale(1); } }
.tiRecv button { position:relative; padding:1.8cqh 8cqw; border-radius:999px; border:none; cursor:pointer; font-family:inherit;
  background:linear-gradient(180deg,#3a68c9,#2b5bc4 60%,#1f4196); color:#edf1fa;
  font-size:12px; font-weight:800; letter-spacing:.24em; text-indent:.24em;
  box-shadow:0 8px 20px rgba(20,40,110,.5), inset 0 1px 1px rgba(255,255,255,.28);
  animation:tiRing2 1.8s .3s ease-out infinite; }
@keyframes tiRing2 {
  0% { box-shadow:0 8px 20px rgba(20,40,110,.5), inset 0 1px 1px rgba(255,255,255,.28), 0 0 0 0 rgba(232,178,60,.6); }
  60%, 100% { box-shadow:0 8px 20px rgba(20,40,110,.5), inset 0 1px 1px rgba(255,255,255,.28), 0 0 0 14px rgba(232,178,60,0); } }
      `}</style>
    </div>
  )
}
