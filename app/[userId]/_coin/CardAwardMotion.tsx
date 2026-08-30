"use client"

// ============================================================
// カード授与モーション (肉付け・2026-08-30 Tetsuo承認 genspark高級版v3の移植)。
// 正本: treasure-handoff/card-motion-approved-v3.html。
// v3は8秒ループの%タイムラインだが、実アプリはタップ駆動のフェーズ制に変換:
//   dim+ビーコン → 落下 → めくり待ち (タップ) → めくり+金粒子 → うけとる(タップ)
//   → マイランクカードへ回転飛翔+光粒子 → 完了。
// 券面 = クリーム地+金縁+アルコ円形写真 (A案確定)。日付は券面に復帰 (v3で欠落していた分)。
// reduced-motion は呼び手 (TreasureCelebration) が演出ごと省略する。
// ============================================================

import { useEffect, useRef, useState } from "react"

export type CardFace = {
  title: string
  sub: string
  no: number | null
  date: string // YYYY.MM.DD
}

type Phase = "fall" | "wait" | "flip" | "recv" | "fly"

export default function CardAwardMotion({ face, onDone }: { face: CardFace; onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>("fall")
  const [fly, setFly] = useState<{ dx: number; dy: number } | null>(null)
  const phaseRef = useRef<Phase>("fall")
  phaseRef.current = phase

  // 落下の完了で自動的にめくり待ちへ
  useEffect(() => {
    if (phase !== "fall") return
    const t = setTimeout(() => setPhase("wait"), 1450)
    return () => clearTimeout(t)
  }, [phase])

  // めくり完了で うけとる 表示へ
  useEffect(() => {
    if (phase !== "flip") return
    const t = setTimeout(() => setPhase("recv"), 1000)
    return () => clearTimeout(t)
  }, [phase])

  // 飛翔完了で終了
  useEffect(() => {
    if (phase !== "fly") return
    const t = setTimeout(() => onDone(), 850)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const startFly = () => {
    // 収納先 = マイランクカード (コインの飛翔と同じ着地言語)。無ければ右上へ
    const card = document.querySelector<HTMLElement>('[data-guide="home-rank-card"]')
    const vw = window.innerWidth
    const vh = window.innerHeight
    const startX = vw / 2
    const startY = vh * 0.36 + vh * 0.115 // fwrap中心 (top36% + カード半分ぶん)
    let dx = vw * 0.36
    let dy = -vh * 0.3
    if (card) {
      const r = card.getBoundingClientRect()
      dx = r.left + r.width * 0.5 - startX
      dy = Math.max(-startY + 30, r.top + r.height * 0.5 - startY)
    }
    setFly({ dx, dy })
    setPhase("fly")
  }

  const advance = () => {
    const p = phaseRef.current
    if (p === "fall") setPhase("wait")
    else if (p === "wait") setPhase("flip")
    else if (p === "flip") setPhase("recv")
    else if (p === "recv") startFly()
  }

  return (
    <div
      onClick={advance}
      style={{ position: "fixed", inset: 0, zIndex: 941, cursor: "pointer" }}
      aria-hidden
    >
      <div className={`caDim ${phase === "fly" ? "caDimOut" : ""}`} />
      {phase === "fall" && <div className="caBeacon" />}
      <div
        className={`caWrap ca-${phase}`}
        style={fly ? ({ ["--fdx" as string]: `${fly.dx}px`, ["--fdy" as string]: `${fly.dy}px` }) : undefined}
      >
        <div className={`caCard ${phase === "flip" || phase === "recv" || phase === "fly" ? "caFlipped" : ""}`}>
          <div className="caFace caBack">
            <div className="caBin"><div className="caBmark">f</div><div className="caBtext">ARCODA QUEST</div></div>
          </div>
          <div className="caFace caFront">
            <div className="caInner">
              <div className="caBrand">ARCODA</div>
              <div className="caArt" />
              <div className="caTitle">{face.title}</div>
              <div className="caDesc">{face.sub}</div>
              <div className="caDate">{face.date}</div>
              <div className="caNo">{face.no != null ? `CARD No.${String(face.no).padStart(3, "0")}` : ""}</div>
            </div>
          </div>
        </div>
      </div>
      {(phase === "flip" || phase === "recv") && (
        <div className="caDust"><span /><span /><span /><span /><span /></div>
      )}
      {phase === "fly" && <div className="caStream"><span /><span /><span /><span /></div>}
      {phase === "wait" && <div className="caLead"><span>タップでめくる</span></div>}
      {phase === "recv" && (
        <div className="caRecv">
          <button type="button" onClick={(e) => { e.stopPropagation(); startFly() }}>うけとる</button>
        </div>
      )}
      {/* v3のCSS移植 (%タイムライン→フェーズ別アニメーション・cqh/cqw→dvh/vw) */}
      <style>{`
.caDim { position:absolute; inset:0; opacity:0;
  background:radial-gradient(ellipse 62% 48% at 50% 38%, rgba(6,10,22,.30) 0%, rgba(6,10,22,.72) 62%, rgba(4,7,16,.88) 100%);
  animation:caDimIn .5s ease forwards; }
.caDimOut { animation:caDimOutK .5s .3s ease forwards; opacity:1; }
@keyframes caDimIn { to { opacity:1; } }
@keyframes caDimOutK { to { opacity:0; } }
.caBeacon { position:absolute; left:50%; top:38%; width:6px; height:6px; border-radius:50%;
  background:#f0cd7c; opacity:0; transform:translate(-50%,-50%);
  animation:caBeaconK 1.05s .15s linear forwards; }
@keyframes caBeaconK {
  0% { opacity:0; transform:translate(-50%,-50%) scale(.3); box-shadow:0 0 0 0 rgba(232,178,60,0); }
  30% { opacity:1; }
  62% { transform:translate(-50%,-50%) scale(2.4); box-shadow:0 0 34px 10px rgba(232,178,60,.4); }
  100% { opacity:0; transform:translate(-50%,-50%) scale(3.6); box-shadow:0 0 70px 26px rgba(232,178,60,0); } }
.caWrap { position:absolute; left:50%; top:36%; width:min(56vw, 232px); aspect-ratio:3/4.1;
  perspective:1100px; transform:translate(-50%,-50%);
  filter:drop-shadow(0 26px 34px rgba(0,0,0,.55)); }
.ca-fall { animation:caFall 1.35s .15s cubic-bezier(.3,.85,.35,1.05) backwards; }
@keyframes caFall {
  0% { opacity:0; transform:translate(-50%,-58vh) rotate(-8deg); }
  86% { opacity:1; transform:translate(-50%,-49%) rotate(2.2deg); }
  100% { opacity:1; transform:translate(-50%,-50%) rotate(0); } }
.ca-wait { animation:caGlow 2s ease-in-out infinite; }
@keyframes caGlow {
  0%,100% { filter:drop-shadow(0 26px 34px rgba(0,0,0,.55)); }
  50% { filter:drop-shadow(0 26px 34px rgba(0,0,0,.55)) drop-shadow(0 0 22px rgba(232,178,60,.35)); } }
.ca-fly { animation:caFlyK .8s cubic-bezier(.5,-.12,.5,1) forwards; }
@keyframes caFlyK {
  0% { opacity:1; transform:translate(-50%,-50%) rotate(0) scale(1); }
  100% { opacity:0; transform:translate(calc(-50% + var(--fdx,140px)), calc(-50% + var(--fdy,-300px))) scale(.1) rotate(10deg);
    filter:drop-shadow(0 0 18px rgba(240,205,124,.8)); } }
.caCard { position:absolute; inset:0; transform-style:preserve-3d; transition:transform .96s cubic-bezier(.35,.1,.25,1); }
.caFlipped { transform:rotateY(180deg); }
.caFace { position:absolute; inset:0; border-radius:14px; backface-visibility:hidden; overflow:hidden; }
.caBack { background:radial-gradient(circle at 32% 18%, #1d2c50, #0f1930 72%);
  border:1px solid rgba(232,178,60,.6);
  box-shadow:inset 0 0 0 5px #0f1930, inset 0 0 0 6px rgba(232,178,60,.4), inset 0 0 0 11px #0f1930, inset 0 0 0 12px rgba(232,178,60,.16); }
.caBin { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; }
.caBmark { font-family:Georgia,serif; font-style:italic; font-size:58px; color:#f0cd7c; text-shadow:0 0 18px rgba(232,178,60,.4); }
.caBtext { font-size:11px; letter-spacing:.42em; padding-left:.42em; color:#8fa0c4; font-weight:700; }
.caBack::after { content:""; position:absolute; inset:0;
  background:linear-gradient(115deg, transparent 28%, rgba(240,205,124,.28) 44%, rgba(255,255,255,.55) 50%, rgba(240,205,124,.28) 56%, transparent 72%);
  transform:translateX(-130%); animation:caSweep 2.6s .6s ease-in-out infinite; }
@keyframes caSweep { 0% { transform:translateX(-130%); } 55%,100% { transform:translateX(130%); } }
.caFront { transform:rotateY(180deg); background:linear-gradient(160deg, #f9f4e8, #ede4ce 85%);
  border:1px solid #d7dfee;
  box-shadow:inset 0 0 0 4px rgba(255,255,255,.65), inset 0 0 0 5px rgba(148,162,190,.75), inset 0 0 0 9px rgba(249,244,232,.9), inset 0 0 0 10px rgba(148,162,190,.4); }
.caFront::before { content:""; position:absolute; inset:0; opacity:.5;
  background:repeating-linear-gradient(0deg, transparent 0 3px, rgba(120,110,90,.05) 3px 4px); }
.caFront::after { content:""; position:absolute; inset:0;
  background:linear-gradient(115deg, transparent 30%, rgba(255,255,255,.5) 48%, rgba(255,255,255,.65) 50%, rgba(255,255,255,.5) 52%, transparent 70%);
  transform:translateX(-130%); animation:caSweep 2.6s 1.2s ease-in-out infinite; }
.caInner { position:absolute; inset:7%; display:flex; flex-direction:column; align-items:center; text-align:center; color:#2b3350; }
.caBrand { font-size:10px; letter-spacing:.4em; padding-left:.4em; color:#8a7a4e; font-weight:900; }
.caArt { width:64%; aspect-ratio:1; margin:11px 0; border-radius:50%; background:url(/arco/05B.jpg) center/cover;
  box-shadow:inset 0 0 0 1px rgba(148,162,190,.6), 0 3px 10px rgba(43,51,80,.18); }
.caTitle { font-size:16px; font-weight:900; letter-spacing:.04em; line-height:1.4; text-wrap:balance; }
.caDesc { font-size:11.5px; color:#5a6480; margin-top:5px; }
.caDate { font-size:9.5px; color:#8a93a8; margin-top:4px; font-variant-numeric:tabular-nums; }
.caNo { margin-top:auto; font-size:9px; letter-spacing:.3em; padding-left:.3em; color:#8a93a8; font-weight:700; }
.caDust span { position:absolute; left:50%; top:56%; width:5px; height:5px; border-radius:50%;
  background:#f0cd7c; opacity:0; animation:caDustK 1.15s ease-out forwards; }
.caDust span:nth-child(1) { --dx:-36px; --dy:-60px; }
.caDust span:nth-child(2) { --dx:32px; --dy:-76px; animation-delay:.06s; }
.caDust span:nth-child(3) { --dx:-20px; --dy:-102px; animation-delay:.12s; }
.caDust span:nth-child(4) { --dx:24px; --dy:-44px; animation-delay:.03s; }
.caDust span:nth-child(5) { --dx:0px; --dy:-118px; animation-delay:.09s; }
@keyframes caDustK { 0% { opacity:0; transform:translate(0,0) scale(.5); } 18% { opacity:.9; }
  100% { opacity:0; transform:translate(var(--dx),var(--dy)) scale(1); } }
.caStream span { position:absolute; left:52%; top:34%; width:4px; height:4px; border-radius:50%;
  background:#f0cd7c; opacity:0; animation:caStreamK .75s ease-in forwards; }
.caStream span:nth-child(2) { animation-delay:.08s; }
.caStream span:nth-child(3) { animation-delay:.16s; }
.caStream span:nth-child(4) { animation-delay:.24s; }
@keyframes caStreamK { 0% { opacity:0; } 25% { opacity:1; }
  100% { opacity:0; transform:translate(calc(var(--fdx,140px)*.9), calc(var(--fdy,-280px)*.9)) scale(.4); } }
.caLead { position:absolute; left:0; right:0; top:66%; text-align:center; pointer-events:none; }
.caLead span { color:#8fa0c4; font-size:13px; font-weight:700; letter-spacing:.14em;
  animation:caLeadGlow 1.6s ease-in-out infinite; }
@keyframes caLeadGlow { 0%,100% { opacity:.55; } 50% { opacity:1; text-shadow:0 0 12px rgba(143,160,196,.5); } }
.caRecv { position:absolute; left:0; right:0; top:66%; text-align:center; animation:caRecvIn .3s ease backwards; }
@keyframes caRecvIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; } }
.caRecv button { background:#2b5bc4; color:#fff; border:none; border-radius:999px; padding:13px 44px;
  font-size:14px; font-weight:900; cursor:pointer; font-family:inherit;
  box-shadow:0 6px 18px rgba(43,91,196,.45); animation:caRing 1.8s ease-out infinite; }
@keyframes caRing { 0% { box-shadow:0 6px 18px rgba(43,91,196,.45), 0 0 0 0 rgba(232,178,60,.55); }
  60%,100% { box-shadow:0 6px 18px rgba(43,91,196,.45), 0 0 0 14px rgba(232,178,60,0); } }
      `}</style>
    </div>
  )
}
