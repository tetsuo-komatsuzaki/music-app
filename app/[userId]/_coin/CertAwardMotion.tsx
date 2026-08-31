"use client"

// ============================================================
// マスター証明書 授与モーション (肉付け・2026-08-30 Tetsuo承認 genspark高級版v6の移植)。
// 正本: treasure-handoff/certificate-motion-approved-v6.html (v8として再送されたファイルとMD5一致)。
// v6は8秒ループの%タイムライン。実アプリはフェーズ制:
//   金の環境光+光筋 → 巻いた掛け軸が吊り紐で降下 (0-28%)
//   → 下軸が降りて紙が展開 (26-37%) → 温かい光+光沢スイープ (37-60%・自動)
//   → うけとる待ち → マイランクカードへ飛翔+吸収粒子 → 完了。
// v6のcqh/cqw座標系を保つため、全画面ステージに container-type:size を張り
// 造形CSS (羊皮紙/デッキルエッジ/金二重枠/蝋封/活版) は原文のまま流用する。
// CERT No はサーバー採番 (getTreasureQueue が通し番号を付与)。
// reduced-motion は呼び手 (TreasureCelebration) が演出ごと省略する。
// ============================================================

import { useEffect, useRef, useState } from "react"
import ArcoMotion, { type ArcoKit } from "@/app/components/ArcoMotion"

/** 賞状に立つアルコ (2026-08-31 Tetsuo確定: 固定でなくランダム表示・全18種) */
const AWARD_ARCO_KITS = ["01A", "01B", "01C", "02A", "02B", "02C", "03A", "03B", "03C", "05C", "06A", "06B", "08A", "08B", "08C", "09A", "09B", "09C"] as const



/** 主役テキストを1行に収めるフォント倍率 (2026-08-31 仕様: 2行に分かれない) */
function fitScale(text: string): number {
  const n = [...text].length
  if (n <= 8) return 1
  if (n <= 12) return 0.8
  if (n <= 16) return 0.64
  return 0.52
}

type Phase = "fall" | "open" | "recv" | "fly"

export type CertFace = {
  /** 曲名 */
  song: string
  /** 曲の★数 (1〜3) */
  stars: number
  /** 認定日 (YYYY.MM.DD) */
  date: string
  /** 通し番号。null なら番号行を出さない */
  certNo: number | null
}

export default function CertAwardMotion({ face, onDone }: { face: CertFace; onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>("fall")
  const [fly, setFly] = useState<{ dx: number; dy: number } | null>(null)
  const phaseRef = useRef<Phase>("fall")
  phaseRef.current = phase

  useEffect(() => {
    if (phase !== "fall") return
    const t = setTimeout(() => setPhase("open"), 2250)
    return () => clearTimeout(t)
  }, [phase])

  useEffect(() => {
    if (phase !== "open") return
    const t = setTimeout(() => setPhase("recv"), 2800)
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
    const startY = vh * 0.47 // .ceScroll (top50%・translate-56%) の中心
    let dx = vw * 0.3
    let dy = -vh * 0.25
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
    if (p === "fall" || p === "open") setPhase("recv")
    else if (p === "recv") startFly()
  }

  const starText = "★ ".repeat(Math.min(Math.max(face.stars, 1), 3)).trim()
  // アルコのモーションはマウントごとにランダム (案2: 封印の後継)
  const [arcoKit] = useState<ArcoKit>(() => AWARD_ARCO_KITS[Math.floor(Math.random() * AWARD_ARCO_KITS.length)])

  return (
    <div onClick={advance} style={{ position: "fixed", inset: 0, zIndex: 941, cursor: "pointer" }} aria-hidden>
      {/* v6のcqh/cqw座標系を成立させるステージ */}
      <div className={`ceStage ce-${phase}`} style={fly ? ({ ["--fdx" as string]: `${fly.dx}px`, ["--fdy" as string]: `${fly.dy}px` }) : undefined}>
        <div className={`ceDim ${phase === "fly" ? "ceDimOut" : ""}`} />
        {(phase === "fall" || phase === "open") && (
          <>
            <div className="ceGlow" />
            <div className="ceRays" />
          </>
        )}
        <div className="ceScroll">
          <span className="ceCord ceCordL" /><span className="ceCord ceCordR" />
          <div className="ceRod ceRodT"><span className="ceFin ceFinL" /><span className="ceFin ceFinR" /></div>
          <div className="cePaper">
            <div className="cePaperIn">
              <div className="ceGrain" />
              <div className="ceFiber" />
              <div className="ceCyl" />
              <div className="ceCurlT" />
              <div className="ceCurlB" />
              <div className="ceFrame1" />
              <div className="ceFrame2" />
              <span className="ceCorner ceCTL" /><span className="ceCorner ceCTR" />
              <span className="ceCorner ceCBL" /><span className="ceCorner ceCBR" />
              <div className="ceFace">
                <div className="ceBrand">ARCODA</div>
                <div className="ceTitle">MASTER CERTIFICATE</div>
                <div className="ceRule" />
                <div className="cePiece" style={{ fontSize: `${(5 * fitScale(face.song)).toFixed(2)}cqw`, whiteSpace: "nowrap", maxWidth: "none" }}>{face.song}</div>
                <div className="ceStars">{starText}</div>
                <div className="ceBody">この曲を なんども ていねいに 弾きこなしたことを<br />いちばん近くで 聴いてきた わたしが 証明します</div>
                {/* 案2 封印の後継: 大きなアルコのモーション (ランダム5種・2026-08-31) */}
                <div className="ceArco"><ArcoMotion kit={arcoKit} label="アルコ" className="ceArcoV" /></div>
                <div className="ceMeta">
                  <span>認定日 {face.date}</span>
                  {face.certNo != null && <span>CERT No.{String(face.certNo).padStart(3, "0")}</span>}
                </div>
              </div>
              <div className="ceWash" />
              <div className="ceSheen" />
            </div>
          </div>
          <div className="ceRod ceRodB"><span className="ceFin ceFinL" /><span className="ceFin ceFinR" /></div>
        </div>
        {phase === "fly" && (
          <>
            <span className="cePt cePt1" /><span className="cePt cePt2" />
            <span className="cePt cePt3" /><span className="cePt cePt4" />
          </>
        )}
        {phase === "recv" && (
          <div className="ceRecv">
            <button type="button" onClick={(e) => { e.stopPropagation(); startFly() }}>うけとる</button>
          </div>
        )}
      </div>
      {/* v6 CSSの移植 (%タイムライン→フェーズ別・ce接頭辞。造形は原文のまま) */}
      <style>{`
.ceStage { position:absolute; inset:0; container-type:size; }
.ceDim { position:absolute; inset:0; z-index:2; opacity:0;
  background:
    radial-gradient(ellipse 78% 60% at 50% 46%, transparent 26%, rgba(5,8,15,.74) 76%, rgba(5,8,15,.95)),
    rgba(6,10,22,.5);
  animation:ceDimIn .55s ease forwards; }
.ceDimOut { animation:ceDimOutK .5s .25s ease forwards; opacity:1; }
@keyframes ceDimIn { to { opacity:1; } }
@keyframes ceDimOutK { to { opacity:0; } }

/* ---- 環境光: 柔らかい金色の輝き + 斜めの薄い光筋 (降下中のみ) ---- */
.ceGlow { position:absolute; left:50%; top:44%; z-index:3; width:88cqw; height:60cqh;
  transform:translate(-50%,-50%) scale(.55);
  background:radial-gradient(ellipse 50% 42% at 50% 50%, rgba(246,222,158,.42), rgba(232,178,60,.16) 46%, transparent 72%);
  filter:blur(10px); opacity:0;
  animation:ceGlowK 2.25s ease-in-out forwards; }
@keyframes ceGlowK {
  0% { opacity:0; transform:translate(-50%,-50%) scale(.5); }
  27% { opacity:1; transform:translate(-50%,-50%) scale(1); }
  69% { opacity:.9; }
  100% { opacity:0; } }
.ceRays { position:absolute; inset:0; z-index:3; opacity:0; overflow:hidden;
  animation:ceRaysK 2.25s ease-in-out forwards; }
.ceRays::before, .ceRays::after { content:""; position:absolute; top:-14%; height:128%; width:9cqw;
  background:linear-gradient(180deg, transparent, rgba(250,232,180,.16) 30%, rgba(250,232,180,.2) 55%, rgba(250,232,180,.16) 80%, transparent);
  filter:blur(9px); transform:skewX(-14deg); }
.ceRays::before { left:30%; }
.ceRays::after { left:58%; width:6cqw; background:linear-gradient(180deg, transparent, rgba(250,232,180,.12) 35%, rgba(250,232,180,.15) 60%, transparent); }
@keyframes ceRaysK {
  0% { opacity:0; }
  30% { opacity:1; }
  74% { opacity:.85; }
  100% { opacity:0; } }

/* ---- 巻物全体 ---- */
.ceScroll { position:absolute; left:50%; top:50%; z-index:5; width:66cqw; height:53cqh;
  transform:translate(-50%,-56%); }
.ce-fall .ceScroll { animation:ceDropK 2.25s cubic-bezier(.3,1.25,.48,1) both; }
@keyframes ceDropK {
  0% { opacity:0; transform:translate(-50%,-132cqh) rotate(0deg); }
  68% { opacity:1; transform:translate(-50%,-53cqh) rotate(0deg); }
  79% { transform:translate(-50%,-58.5cqh) rotate(.7deg); }
  89% { transform:translate(-50%,-56%) rotate(-.5deg); }
  100% { opacity:1; transform:translate(-50%,-56%) rotate(0deg); } }
.ce-fly .ceScroll { animation:ceFlyK .75s cubic-bezier(.5,-.12,.5,1) forwards; }
@keyframes ceFlyK {
  0% { opacity:1; transform:translate(-50%,-56%) rotate(0deg) scale(1); }
  100% { opacity:0; transform:translate(calc(-50% + var(--fdx,120px)), calc(-56% + var(--fdy,-300px))) scale(.09) rotate(6deg); } }

/* ---- 吊り金具: 上軸から伸びる金の紐2本 ---- */
.ceCord { position:absolute; top:-9cqh; width:0.55cqw; height:9.4cqh; z-index:3;
  background:linear-gradient(90deg,#8a6a1a,#e8b23c 40%,#f7dd9a 55%,#a5761c);
  box-shadow:0 0 2px rgba(0,0,0,.5); }
.ceCordL { left:24cqw; transform:rotate(2.5deg); }
.ceCordR { right:24cqw; transform:rotate(-2.5deg); }

/* ---- 軸 (木芯+金の飾り玉) ---- */
.ceRod { position:absolute; left:50%; transform:translateX(-50%); z-index:6;
  width:72cqw; border-radius:2cqh;
  box-shadow:0 4px 8px rgba(0,0,0,.65), inset 0 1px 1px rgba(255,240,205,.35), inset 0 -2px 3px rgba(20,12,2,.8); }
.ceRodT { top:0; height:2.7cqh;
  background:linear-gradient(180deg,#8a6238 0%,#5e3f1e 42%,#3a2710 78%,#241708); }
.ceRodB { bottom:47cqh; height:3.4cqh;
  background:linear-gradient(180deg,#7a552e 0%,#4e3415 42%,#33210c 78%,#1d1206); }
.ce-open .ceRodB { animation:ceRodBK .9s linear forwards; }
.ce-recv .ceRodB, .ce-fly .ceRodB { bottom:0; }
@keyframes ceRodBK { from { bottom:47cqh; } to { bottom:0; } }
.ceFin { position:absolute; top:50%; width:5cqw; height:5cqw; transform:translateY(-50%); }
.ceFin::before { content:""; position:absolute; top:50%; width:2.2cqw; height:1.1cqw; transform:translateY(-50%);
  background:linear-gradient(180deg,#f7dd9a,#a5761c); }
.ceFin::after { content:""; position:absolute; top:50%; width:4.4cqw; height:4.4cqw; border-radius:50%; transform:translateY(-50%);
  background:radial-gradient(circle at 33% 27%, #fdf0c0, #e8b23c 45%, #8a6a1a 80%, #54380a);
  box-shadow:inset 0 -2px 3px rgba(50,34,2,.9), inset 0 1px 1px rgba(255,246,214,.8), 0 2px 5px rgba(0,0,0,.6); }
.ceFinL { left:-3.6cqw; } .ceFinL::before { right:2.2cqw; } .ceFinL::after { left:0; }
.ceFinR { right:-3.6cqw; } .ceFinR::before { left:2.2cqw; } .ceFinR::after { right:0; }

/* ---- 紙本体 (展開) ---- */
.cePaper { position:absolute; left:50%; top:1.35cqh; width:66cqw; transform:translateX(-50%); z-index:4;
  height:0; overflow:hidden;
  filter:drop-shadow(0 20px 24px rgba(0,0,0,.62)) drop-shadow(0 4px 6px rgba(0,0,0,.4)); }
.ce-open .cePaper { animation:ceUnfurlK .9s linear forwards; }
.ce-recv .cePaper, .ce-fly .cePaper { height:50.3cqh; }
@keyframes ceUnfurlK { from { height:0; } to { height:50.3cqh; } }
.cePaperIn { position:absolute; left:0; top:0; width:100%; height:50.3cqh;
  background:
    radial-gradient(ellipse 34% 20% at 8% 6%, rgba(126,92,38,.14), transparent 70%),
    radial-gradient(ellipse 30% 18% at 92% 8%, rgba(126,92,38,.11), transparent 70%),
    radial-gradient(ellipse 36% 22% at 12% 94%, rgba(110,80,32,.16), transparent 70%),
    radial-gradient(ellipse 32% 20% at 90% 92%, rgba(110,80,32,.12), transparent 70%),
    radial-gradient(ellipse 60% 40% at 50% 50%, rgba(150,116,58,.06), transparent 75%),
    linear-gradient(168deg,#f8f1e0 0%,#f1e7cf 30%,#eee2c6 55%,#f3ead4 78%,#e9dcbc 100%);
  clip-path:polygon(0.6% 1.2%, 4% 0.3%, 9% 0.9%, 15% 0.2%, 22% 0.8%, 30% 0.3%, 38% 0.9%, 46% 0.2%, 54% 0.8%, 62% 0.3%, 70% 0.9%, 78% 0.2%, 86% 0.8%, 93% 0.3%, 98.5% 1%,
    99.6% 5%, 99.1% 12%, 99.7% 20%, 99.2% 28%, 99.7% 36%, 99.1% 45%, 99.6% 54%, 99.2% 63%, 99.7% 72%, 99.1% 81%, 99.6% 90%, 99% 97%,
    96% 99.4%, 89% 99.8%, 81% 99.3%, 73% 99.8%, 65% 99.3%, 57% 99.8%, 49% 99.4%, 41% 99.8%, 33% 99.3%, 25% 99.8%, 17% 99.4%, 9% 99.8%, 3% 99.3%,
    0.4% 95%, 0.9% 87%, 0.3% 78%, 0.8% 69%, 0.3% 60%, 0.9% 51%, 0.3% 42%, 0.8% 33%, 0.3% 24%, 0.9% 15%, 0.4% 7%); }
.ceGrain { position:absolute; inset:0; z-index:1; pointer-events:none;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><filter id='n' x='0' y='0' width='100%25' height='100%25'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 0.40 0 0 0 0 0.30 0 0 0 0 0.16 0 0 0 0.055 0'/></filter><rect width='260' height='260' filter='url(%23n)'/></svg>");
  background-size:260px 260px; }
.ceFiber { position:absolute; inset:0; z-index:1; pointer-events:none; mix-blend-mode:multiply;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='f' x='0' y='0' width='100%25' height='100%25'><feTurbulence type='turbulence' baseFrequency='0.012 0.22' numOctaves='3' seed='7' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 0.55 0 0 0 0 0.44 0 0 0 0 0.26 0 0 0 0.05 0'/></filter><rect width='300' height='300' filter='url(%23f)'/></svg>");
  background-size:300px 300px; }
.ceCyl { position:absolute; inset:0; z-index:2; pointer-events:none;
  background:
    linear-gradient(90deg, rgba(70,50,18,.22), rgba(70,50,18,.05) 9%, transparent 20%, transparent 80%, rgba(70,50,18,.05) 91%, rgba(70,50,18,.24)),
    radial-gradient(ellipse 90% 60% at 50% 42%, rgba(255,252,240,.20), transparent 60%); }
.ceCurlT { position:absolute; left:0; top:0; width:100%; height:5.5cqh; z-index:3; pointer-events:none;
  background:linear-gradient(180deg, rgba(60,42,14,.38), rgba(60,42,14,.12) 55%, transparent); }
.ceCurlB { position:absolute; left:0; bottom:0; width:100%; height:6.5cqh; z-index:3; pointer-events:none;
  background:linear-gradient(0deg, rgba(60,42,14,.42), rgba(60,42,14,.14) 55%, transparent); }
.ceCurlB::after { content:""; position:absolute; left:3%; right:3%; bottom:0; height:1.2cqh;
  background:linear-gradient(0deg, rgba(30,20,6,.5), transparent); }

/* 金の二重枠 + 四隅の角飾り */
.ceFrame1 { position:absolute; inset:3.4cqh 4cqw; z-index:4; border:1.6px solid rgba(178,134,44,.92);
  box-shadow:0 0 5px rgba(232,178,60,.22), inset 0 0 5px rgba(232,178,60,.14); }
.ceFrame2 { position:absolute; inset:4.3cqh 5.4cqw; z-index:4; border:0.8px solid rgba(160,118,38,.8); }
.ceCorner { position:absolute; width:5cqw; height:5cqw; z-index:5; }
.ceCorner::before { content:""; position:absolute; inset:0;
  background:linear-gradient(135deg,#f2d48c,#c99a35 55%,#8a6a1a);
  clip-path:polygon(0 0,100% 0,100% 18%,18% 18%,18% 100%,0 100%);
  filter:drop-shadow(0 1px 1px rgba(80,55,10,.5)); }
.ceCTL { left:3.6cqw; top:3.2cqh; }
.ceCTR { right:3.6cqw; top:3.2cqh; transform:scaleX(-1); }
.ceCBL { left:3.6cqw; bottom:3.2cqh; transform:scaleY(-1); }
.ceCBR { right:3.6cqw; bottom:3.2cqh; transform:scale(-1); }

/* ---- 券面: 活版 (レタープレス) ---- */
.ceFace { position:absolute; inset:0; z-index:6; display:flex; flex-direction:column; align-items:center;
  text-align:center; padding-top:7.6cqh; }
.ceBrand { font-size:2.2cqw; letter-spacing:.44em; text-indent:.44em; font-weight:700; color:#7a5c22;
  text-shadow:0 1px 0 rgba(255,252,240,.85), 0 -1px 1px rgba(96,72,26,.4); }
.ceTitle { margin-top:1.3cqh; font-size:3.7cqw; letter-spacing:.16em; text-indent:.16em; font-weight:900; color:#503a10;
  text-shadow:0 1px 0 rgba(255,252,240,.9), 0 -1px 1px rgba(80,58,16,.45); }
.ceRule { position:relative; margin-top:1.5cqh; width:36cqw; height:0;
  border-top:1.6px solid rgba(178,134,44,.9); }
.ceRule::before { content:""; position:absolute; left:0; right:0; top:2.4px; border-top:0.7px solid rgba(178,134,44,.75); }
.ceRule::after { content:""; position:absolute; left:50%; top:-3.4px; width:5.4px; height:5.4px;
  transform:translateX(-50%) rotate(45deg);
  background:linear-gradient(135deg,#f2d48c,#c99a35 60%,#8a6a1a);
  box-shadow:0 0 4px rgba(232,178,60,.5); }
.cePiece { margin-top:2.5cqh; font-size:5cqw; font-weight:900; letter-spacing:.12em; text-indent:.12em; color:#33260a;
  text-shadow:0 1px 0 rgba(255,252,240,.95), 0 -1px 1px rgba(70,50,14,.5);
  max-width:52cqw; }
.ceStars { margin-top:1cqh; font-size:3.1cqw; letter-spacing:.52em; text-indent:.52em; color:#b8902f;
  text-shadow:0 0 7px rgba(232,178,60,.5), 0 1px 0 rgba(255,250,235,.8), 0 -1px 1px rgba(120,88,26,.5); }
.ceBody { margin-top:2.3cqh; font-size:2.25cqw; line-height:2.1; color:#57431d; font-weight:500;
  text-shadow:0 1px 0 rgba(255,252,240,.6); }

/* ---- アルコのモーション (案2 封印の後継・大円形) ---- */
.ceArco { margin-top:1.8cqh; width:24cqw; height:24cqw; border-radius:50%; overflow:hidden;
  box-shadow:0 3px 9px rgba(90,62,10,.35), 0 0 0 1.6px rgba(178,134,44,.6); }
.ceArco .ceArcoV { display:block; width:100%; height:100%; }
.ceArco video, .ceArco img { width:100%; height:100%; object-fit:cover; display:block; }
.ceMeta { margin-top:1.6cqh; display:flex; gap:6.4cqw; font-size:1.95cqw; letter-spacing:.15em; text-indent:.15em;
  color:#7a5c22; font-weight:700;
  text-shadow:0 1px 0 rgba(255,252,240,.8); }

/* ---- 展開後に差す温かい光 + 光沢スイープ ---- */
.ceWash { position:absolute; inset:0; z-index:7; pointer-events:none; opacity:0;
  background:radial-gradient(ellipse 85% 60% at 50% 30%, rgba(255,246,220,.30), transparent 65%); }
.ce-open .ceWash { animation:ceWashK 2.4s .8s ease-in-out forwards; }
@keyframes ceWashK { 0% { opacity:0; } 28% { opacity:1; } 70% { opacity:1; } 100% { opacity:0; } }
.ceSheen { position:absolute; inset:0; z-index:8; overflow:hidden; pointer-events:none; }
.ceSheen::before { content:""; position:absolute; top:-25%; left:-75%; width:38%; height:150%;
  background:linear-gradient(102deg, transparent, rgba(255,251,238,.30) 50%, transparent);
  transform:skewX(-16deg); opacity:0; }
.ce-open .ceSheen::before { animation:ceSheenK .9s 1.5s linear forwards; }
@keyframes ceSheenK {
  0% { opacity:0; left:-75%; }
  20% { opacity:1; }
  90% { left:125%; opacity:1; }
  100% { opacity:0; left:125%; } }

/* ---- 吸収パーティクル (飛翔と同方向) ---- */
.cePt { position:absolute; left:50%; top:42%; z-index:10; width:1.6cqw; height:1.6cqw; border-radius:50%;
  background:radial-gradient(circle, #fdf0c0, #e8b23c 60%, transparent);
  opacity:0; animation:cePtK .65s ease-in forwards; }
.cePt2 { animation-delay:.06s; }
.cePt3 { animation-delay:.13s; }
.cePt4 { animation-delay:.2s; }
@keyframes cePtK {
  0% { opacity:0; transform:translate(0,0) scale(1); }
  25% { opacity:1; }
  100% { opacity:0; transform:translate(calc(var(--fdx,120px)*.85), calc(var(--fdy,-260px)*.85)) scale(.4); } }

/* ---- ボタン ---- */
.ceRecv { position:absolute; left:0; right:0; bottom:8.4cqh; z-index:9; text-align:center; animation:ceRecvIn .45s ease backwards; }
@keyframes ceRecvIn { from { opacity:0; transform:translateY(2cqh); } to { opacity:1; transform:translateY(0); } }
.ceRecv button { position:relative; padding:1.6cqh 7cqw; border-radius:6cqh; border:none; cursor:pointer; font-family:inherit;
  background:linear-gradient(180deg,#3a68c9,#2b5bc4 60%,#1f4196);
  color:#edf1fa; font-size:14px; font-weight:700; letter-spacing:.22em; text-indent:.22em;
  box-shadow:0 6px 16px rgba(20,40,110,.55), inset 0 1px 1px rgba(255,255,255,.28);
  animation:ceRing 1.8s .3s ease-out infinite; }
@keyframes ceRing {
  0% { box-shadow:0 6px 16px rgba(20,40,110,.55), inset 0 1px 1px rgba(255,255,255,.28), 0 0 0 0 rgba(232,178,60,.6); }
  60%, 100% { box-shadow:0 6px 16px rgba(20,40,110,.55), inset 0 1px 1px rgba(255,255,255,.28), 0 0 0 14px rgba(232,178,60,0); } }
      `}</style>
    </div>
  )
}
