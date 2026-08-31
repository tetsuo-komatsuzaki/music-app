"use client"

// ============================================================
// アルコの認定証 授与モーション (肉付け・2026-08-30 Tetsuo承認 genspark高級版v8の移植)。
// 正本: treasure-handoff/nintei-motion-approved-v8.html。
// 証明書v6と同じ掛け軸タイムラインの青バリアント+質感強化:
//   枠/飾り/見出し/罫線/メタ=青 (賞状ファミリー: マスター証明書=金・認定証=青)、
//   光筋を廃止し柔らかい環境光のみ、紙にレード線+透かし+手漉きの濃淡むら。
// フェーズ制 (降下→展開+光は自動→うけとる待ち→マイランクカードへ飛翔) は
// CertAwardMotion と同一。造形CSSは原文のまま ni 接頭辞で流用する。
// 対象=最難関6クエスト (grade "cert")。券面文言は treasureCatalog の NINTEI_FACES。
// reduced-motion は呼び手 (TreasureCelebration) が演出ごと省略する。
// ============================================================

import { useEffect, useRef, useState } from "react"


/** 主役テキストを1行に収めるフォント倍率 (2026-08-31 仕様: 2行に分かれない) */
function fitScale(text: string): number {
  const n = [...text].length
  if (n <= 8) return 1
  if (n <= 12) return 0.8
  if (n <= 16) return 0.64
  return 0.52
}

type Phase = "fall" | "open" | "recv" | "fly"

export type NinteiFace = {
  /** 大見出し (例 100 DAYS) */
  big: string
  /** 種別行 (例 継続の認定証) */
  kindLine: string
  /** 本文2行 */
  body1: string
  body2: string
  /** 認定日 (YYYY.MM.DD) */
  date: string
  /** 通し番号。null なら正本どおり CERT No.— を出す */
  certNo: number | null
}

export default function NinteiAwardMotion({ face, onDone }: { face: NinteiFace; onDone: () => void }) {
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
    const startY = vh * 0.47
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

  return (
    <div onClick={advance} style={{ position: "fixed", inset: 0, zIndex: 941, cursor: "pointer" }} aria-hidden>
      {/* v8のcqh/cqw座標系を成立させるステージ */}
      <div className={`niStage ni-${phase}`} style={fly ? ({ ["--fdx" as string]: `${fly.dx}px`, ["--fdy" as string]: `${fly.dy}px` }) : undefined}>
        <div className={`niDim ${phase === "fly" ? "niDimOut" : ""}`} />
        {(phase === "fall" || phase === "open") && <div className="niGlow" />}
        <div className="niScroll">
          <span className="niCord niCordL" /><span className="niCord niCordR" />
          <div className="niRod niRodT"><span className="niFin niFinL" /><span className="niFin niFinR" /></div>
          <div className="niPaper">
            <div className="niPaperIn">
              <div className="niGrain" />
              <div className="niFiber" />
              <div className="niLaid" />
              <div className="niWtmk" />
              <div className="niCyl" />
              <div className="niCurlT" />
              <div className="niCurlB" />
              <div className="niFrame1" />
              <div className="niFrame2" />
              <span className="niCorner niCTL" /><span className="niCorner niCTR" />
              <span className="niCorner niCBL" /><span className="niCorner niCBR" />
              <div className="niFace">
                <div className="niBrand">ARCODA</div>
                <div className="niTitle">CERTIFICATE</div>
                <div className="niRule" />
                <div className="niPiece" style={{ fontSize: `${(6.4 * fitScale(face.big)).toFixed(2)}cqw`, whiteSpace: "nowrap", maxWidth: "none" }}>{face.big}</div>
                <div className="niKind">{face.kindLine}</div>
                <div className="niBody">{face.body1}<br />{face.body2}</div>
                <div className="niSealRow">
                  <div className="niSeal">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="niSealImg" src="/arco/05B.jpg" alt="" />
                  </div>
                  <div className="niSign">Arco</div>
                </div>
                <div className="niMeta">
                  <span>認定日 {face.date}</span>
                  <span>CERT No.{face.certNo != null ? String(face.certNo).padStart(3, "0") : "—"}</span>
                </div>
              </div>
              <div className="niWash" />
              <div className="niSheen" />
            </div>
          </div>
          <div className="niRod niRodB"><span className="niFin niFinL" /><span className="niFin niFinR" /></div>
        </div>
        {phase === "fly" && (
          <>
            <span className="niPt niPt1" /><span className="niPt niPt2" />
            <span className="niPt niPt3" /><span className="niPt niPt4" />
          </>
        )}
        {phase === "recv" && (
          <div className="niRecv">
            <button type="button" onClick={(e) => { e.stopPropagation(); startFly() }}>うけとる</button>
          </div>
        )}
      </div>
      {/* v8 CSSの移植 (%タイムライン→フェーズ別・ni接頭辞。造形は原文のまま) */}
      <style>{`
.niStage { position:absolute; inset:0; container-type:size; }
.niDim { position:absolute; inset:0; z-index:2; opacity:0;
  background:
    radial-gradient(ellipse 78% 60% at 50% 46%, transparent 26%, rgba(5,8,15,.74) 76%, rgba(5,8,15,.95)),
    rgba(6,10,22,.5);
  animation:niDimIn .55s ease forwards; }
.niDimOut { animation:niDimOutK .5s .25s ease forwards; opacity:1; }
@keyframes niDimIn { to { opacity:1; } }
@keyframes niDimOutK { to { opacity:0; } }

/* ---- 環境光: 柔らかい金色の輝きのみ (光筋は廃止・降下中だけ) ---- */
.niGlow { position:absolute; left:50%; top:42%; z-index:3; width:96cqw; height:68cqh;
  transform:translate(-50%,-50%) scale(.55);
  background:
    radial-gradient(ellipse 34% 30% at 50% 44%, rgba(255,242,206,.58), transparent 62%),
    radial-gradient(ellipse 54% 46% at 50% 50%, rgba(240,200,118,.34), rgba(232,178,60,.12) 52%, transparent 78%);
  filter:blur(16px); opacity:0;
  animation:niGlowK 2.25s ease-in-out forwards; }
@keyframes niGlowK {
  0% { opacity:0; transform:translate(-50%,-50%) scale(.52); }
  30% { opacity:1; transform:translate(-50%,-50%) scale(1.02); }
  48% { opacity:.86; transform:translate(-50%,-50%) scale(1); }
  63% { opacity:.96; }
  78% { opacity:.9; }
  100% { opacity:0; } }

/* ---- 巻物全体 (タイムラインは証明書v6と同一) ---- */
.niScroll { position:absolute; left:50%; top:50%; z-index:5; width:66cqw; height:53cqh;
  transform:translate(-50%,-56%); }
.ni-fall .niScroll { animation:niDropK 2.25s cubic-bezier(.3,1.25,.48,1) both; }
@keyframes niDropK {
  0% { opacity:0; transform:translate(-50%,-132cqh) rotate(0deg); }
  68% { opacity:1; transform:translate(-50%,-53cqh) rotate(0deg); }
  79% { transform:translate(-50%,-58.5cqh) rotate(.7deg); }
  89% { transform:translate(-50%,-56%) rotate(-.5deg); }
  100% { opacity:1; transform:translate(-50%,-56%) rotate(0deg); } }
.ni-fly .niScroll { animation:niFlyK .75s cubic-bezier(.5,-.12,.5,1) forwards; }
@keyframes niFlyK {
  0% { opacity:1; transform:translate(-50%,-56%) rotate(0deg) scale(1); }
  100% { opacity:0; transform:translate(calc(-50% + var(--fdx,120px)), calc(-56% + var(--fdy,-300px))) scale(.09) rotate(6deg); } }

/* ---- 吊り金具 ---- */
.niCord { position:absolute; top:-9cqh; width:0.55cqw; height:9.4cqh; z-index:3;
  background:linear-gradient(90deg,#8a6a1a,#e8b23c 40%,#f7dd9a 55%,#a5761c);
  box-shadow:0 0 2px rgba(0,0,0,.5); }
.niCordL { left:24cqw; transform:rotate(2.5deg); }
.niCordR { right:24cqw; transform:rotate(-2.5deg); }

/* ---- 軸 (木芯+金の飾り玉) ---- */
.niRod { position:absolute; left:50%; transform:translateX(-50%); z-index:6;
  width:72cqw; border-radius:2cqh;
  box-shadow:0 4px 8px rgba(0,0,0,.65), inset 0 1px 1px rgba(255,240,205,.35), inset 0 -2px 3px rgba(20,12,2,.8); }
.niRodT { top:0; height:2.7cqh;
  background:linear-gradient(180deg,#8a6238 0%,#5e3f1e 42%,#3a2710 78%,#241708); }
.niRodB { bottom:47cqh; height:3.4cqh;
  background:linear-gradient(180deg,#7a552e 0%,#4e3415 42%,#33210c 78%,#1d1206); }
.ni-open .niRodB { animation:niRodBK .9s linear forwards; }
.ni-recv .niRodB, .ni-fly .niRodB { bottom:0; }
@keyframes niRodBK { from { bottom:47cqh; } to { bottom:0; } }
.niFin { position:absolute; top:50%; width:5cqw; height:5cqw; transform:translateY(-50%); }
.niFin::before { content:""; position:absolute; top:50%; width:2.2cqw; height:1.1cqw; transform:translateY(-50%);
  background:linear-gradient(180deg,#f7dd9a,#a5761c); }
.niFin::after { content:""; position:absolute; top:50%; width:4.4cqw; height:4.4cqw; border-radius:50%; transform:translateY(-50%);
  background:radial-gradient(circle at 33% 27%, #fdf0c0, #e8b23c 45%, #8a6a1a 80%, #54380a);
  box-shadow:inset 0 -2px 3px rgba(50,34,2,.9), inset 0 1px 1px rgba(255,246,214,.8), 0 2px 5px rgba(0,0,0,.6); }
.niFinL { left:-3.6cqw; } .niFinL::before { right:2.2cqw; } .niFinL::after { left:0; }
.niFinR { right:-3.6cqw; } .niFinR::before { left:2.2cqw; } .niFinR::after { right:0; }

/* ---- 紙本体 (展開・v8の深みのある地色+手漉きの濃淡むら) ---- */
.niPaper { position:absolute; left:50%; top:1.35cqh; width:66cqw; transform:translateX(-50%); z-index:4;
  height:0; overflow:hidden;
  filter:drop-shadow(0 20px 24px rgba(0,0,0,.62)) drop-shadow(0 4px 6px rgba(0,0,0,.4)); }
.ni-open .niPaper { animation:niUnfurlK .9s linear forwards; }
.ni-recv .niPaper, .ni-fly .niPaper { height:50.3cqh; }
@keyframes niUnfurlK { from { height:0; } to { height:50.3cqh; } }
.niPaperIn { position:absolute; left:0; top:0; width:100%; height:50.3cqh;
  background:
    radial-gradient(ellipse 70% 46% at 30% 22%, rgba(255,251,238,.38), transparent 68%),
    radial-gradient(ellipse 62% 40% at 74% 68%, rgba(196,158,92,.13), transparent 72%),
    radial-gradient(ellipse 55% 36% at 22% 78%, rgba(206,170,102,.12), transparent 70%),
    radial-gradient(ellipse 48% 32% at 68% 12%, rgba(255,250,235,.26), transparent 70%),
    radial-gradient(ellipse 34% 20% at 7% 5%, rgba(118,86,34,.17), transparent 70%),
    radial-gradient(ellipse 30% 18% at 93% 8%, rgba(118,86,34,.13), transparent 70%),
    radial-gradient(ellipse 36% 22% at 11% 95%, rgba(104,75,30,.19), transparent 70%),
    radial-gradient(ellipse 32% 20% at 91% 93%, rgba(104,75,30,.14), transparent 70%),
    radial-gradient(ellipse 64% 44% at 50% 50%, rgba(146,112,56,.07), transparent 76%),
    linear-gradient(163deg,#faf3e4 0%,#f4ead3 24%,#eee1c3 47%,#f2e7cd 68%,#f6eeda 84%,#e7d8b6 100%);
  clip-path:polygon(0.6% 1.2%, 4% 0.3%, 9% 0.9%, 15% 0.2%, 22% 0.8%, 30% 0.3%, 38% 0.9%, 46% 0.2%, 54% 0.8%, 62% 0.3%, 70% 0.9%, 78% 0.2%, 86% 0.8%, 93% 0.3%, 98.5% 1%,
    99.6% 5%, 99.1% 12%, 99.7% 20%, 99.2% 28%, 99.7% 36%, 99.1% 45%, 99.6% 54%, 99.2% 63%, 99.7% 72%, 99.1% 81%, 99.6% 90%, 99% 97%,
    96% 99.4%, 89% 99.8%, 81% 99.3%, 73% 99.8%, 65% 99.3%, 57% 99.8%, 49% 99.4%, 41% 99.8%, 33% 99.3%, 25% 99.8%, 17% 99.4%, 9% 99.8%, 3% 99.3%,
    0.4% 95%, 0.9% 87%, 0.3% 78%, 0.8% 69%, 0.3% 60%, 0.9% 51%, 0.3% 42%, 0.8% 33%, 0.3% 24%, 0.9% 15%, 0.4% 7%); }
.niGrain { position:absolute; inset:0; z-index:1; pointer-events:none;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n' x='0' y='0' width='100%25' height='100%25'><feTurbulence type='fractalNoise' baseFrequency='0.92' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 0.38 0 0 0 0 0.28 0 0 0 0 0.14 0 0 0 0.05 0'/></filter><rect width='200' height='200' filter='url(%23n)'/></svg>");
  background-size:200px 200px; }
.niFiber { position:absolute; inset:0; z-index:1; pointer-events:none; mix-blend-mode:multiply;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='340' height='340'><filter id='f' x='0' y='0' width='100%25' height='100%25'><feTurbulence type='turbulence' baseFrequency='0.008 0.16' numOctaves='4' seed='11' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 0.52 0 0 0 0 0.41 0 0 0 0 0.23 0 0 0 0.045 0'/></filter><rect width='340' height='340' filter='url(%23f)'/></svg>");
  background-size:340px 340px; }
.niLaid { position:absolute; inset:0; z-index:1; pointer-events:none;
  background:
    repeating-linear-gradient(0deg, transparent 0 0.62cqh, rgba(120,90,40,.045) 0.62cqh 0.72cqh),
    repeating-linear-gradient(0deg, rgba(255,252,242,.05) 0 0.31cqh, transparent 0.31cqh 0.62cqh); }
.niWtmk { position:absolute; left:50%; top:38%; width:34cqw; height:34cqw; transform:translate(-50%,-50%); z-index:1; pointer-events:none;
  background:radial-gradient(circle at 50% 50%, rgba(255,252,242,.16), transparent 68%); }
.niCyl { position:absolute; inset:0; z-index:2; pointer-events:none;
  background:
    linear-gradient(90deg,
      rgba(64,46,16,.30), rgba(64,46,16,.16) 5%, rgba(64,46,16,.05) 10%,
      transparent 19%, transparent 81%,
      rgba(64,46,16,.05) 90%, rgba(64,46,16,.16) 95%, rgba(64,46,16,.32)),
    radial-gradient(ellipse 84% 58% at 50% 40%, rgba(255,253,244,.24), transparent 58%),
    linear-gradient(180deg, rgba(255,252,240,.10), transparent 14%, transparent 86%, rgba(96,70,28,.10)); }
.niCurlT { position:absolute; left:0; top:0; width:100%; height:6.2cqh; z-index:3; pointer-events:none;
  background:linear-gradient(180deg, rgba(52,36,12,.46), rgba(52,36,12,.20) 38%, rgba(52,36,12,.06) 68%, transparent); }
.niCurlB { position:absolute; left:0; bottom:0; width:100%; height:7.4cqh; z-index:3; pointer-events:none;
  background:linear-gradient(0deg, rgba(52,36,12,.5), rgba(52,36,12,.22) 38%, rgba(52,36,12,.07) 70%, transparent); }
.niCurlB::after { content:""; position:absolute; left:3%; right:3%; bottom:0; height:1.2cqh;
  background:linear-gradient(0deg, rgba(30,20,6,.5), transparent); }

/* 青の二重枠 + 四隅の角飾り (賞状ファミリー: 認定証=青) */
.niFrame1 { position:absolute; inset:3.4cqh 4cqw; z-index:4; border:1.6px solid rgba(61,93,168,.95);
  box-shadow:0 0 5px rgba(61,93,168,.20), inset 0 0 5px rgba(61,93,168,.12); }
.niFrame2 { position:absolute; inset:4.3cqh 5.4cqw; z-index:4; border:0.8px solid rgba(61,93,168,.8); }
.niCorner { position:absolute; width:5cqw; height:5cqw; z-index:5; }
.niCorner::before { content:""; position:absolute; inset:0;
  background:linear-gradient(135deg,#7a9ade,#3d5da8 55%,#25406e);
  clip-path:polygon(0 0,100% 0,100% 18%,18% 18%,18% 100%,0 100%);
  filter:drop-shadow(0 1px 1px rgba(80,55,10,.5)); }
.niCTL { left:3.6cqw; top:3.2cqh; }
.niCTR { right:3.6cqw; top:3.2cqh; transform:scaleX(-1); }
.niCBL { left:3.6cqw; bottom:3.2cqh; transform:scaleY(-1); }
.niCBR { right:3.6cqw; bottom:3.2cqh; transform:scale(-1); }

/* ---- 券面: 活版 (レタープレス・青) ---- */
.niFace { position:absolute; inset:0; z-index:6; display:flex; flex-direction:column; align-items:center;
  text-align:center; padding-top:7.6cqh; }
.niBrand { font-size:2.2cqw; letter-spacing:.44em; text-indent:.44em; font-weight:700; color:#3d5da8;
  text-shadow:0 1px 0 rgba(255,252,240,.85), 0 -1px 1px rgba(96,72,26,.4); }
.niTitle { margin-top:1.3cqh; font-size:3.7cqw; letter-spacing:.16em; text-indent:.16em; font-weight:900; color:#2c4a86;
  text-shadow:0 1px 0 rgba(255,252,240,.9), 0 -1px 1px rgba(80,58,16,.45); }
.niRule { position:relative; margin-top:1.5cqh; width:36cqw; height:0;
  border-top:1.6px solid rgba(61,93,168,.9); }
.niRule::before { content:""; position:absolute; left:0; right:0; top:2.4px; border-top:0.7px solid rgba(61,93,168,.7); }
.niRule::after { content:""; position:absolute; left:50%; top:-3.4px; width:5.4px; height:5.4px;
  transform:translateX(-50%) rotate(45deg);
  background:linear-gradient(135deg,#7a9ade,#3d5da8 60%,#25406e);
  box-shadow:0 0 4px rgba(61,93,168,.45); }
.niPiece { margin-top:2.4cqh; font-size:6.4cqw; font-weight:900; letter-spacing:.1em; text-indent:.1em; color:#2c4a86;
  text-shadow:0 1px 0 rgba(255,252,240,.95), 0 -1px 1px rgba(30,52,96,.5);
  max-width:52cqw; }
.niKind { margin-top:1.1cqh; font-size:2.9cqw; letter-spacing:.34em; text-indent:.34em; color:#3d5da8; font-weight:700;
  text-shadow:0 1px 0 rgba(255,252,240,.9), 0 -1px 1px rgba(37,64,110,.35); }
.niBody { margin-top:2.3cqh; font-size:2.25cqw; line-height:2.1; color:#3d4a63; font-weight:500;
  text-shadow:0 1px 0 rgba(255,252,240,.6); }

/* ---- 封印: 蝋印+肖像メダイヨン (蝋は赤のまま・リングは青) ---- */
.niSealRow { margin-top:2.4cqh; display:flex; align-items:center; gap:3.4cqw; }
.niSeal { position:relative; width:11.4cqw; height:11.4cqw; }
.niSeal::before { content:""; position:absolute; inset:-1.1cqw;
  border-radius:46% 54% 51% 49% / 52% 47% 53% 48%;
  background:radial-gradient(circle at 36% 30%, #a83232, #7e1c1c 52%, #541010 88%);
  box-shadow:0 3px 6px rgba(60,20,10,.5), inset 0 2px 3px rgba(255,180,160,.35), inset 0 -3px 5px rgba(40,8,8,.6); }
.niSeal::after { content:""; position:absolute; inset:-0.4cqw; border-radius:48% 52% 50% 50% / 51% 49% 52% 48%;
  border:1px solid rgba(255,205,180,.28); }
.niSealImg { position:absolute; inset:0.7cqw; width:10cqw; height:10cqw; border-radius:50%; object-fit:cover;
  box-shadow:inset 0 2px 4px rgba(60,20,10,.55), 0 0 0 1.4px rgba(61,93,168,.8);
  filter:sepia(.28) saturate(.92); }
.niSign { font-size:3.1cqw; font-weight:700; color:#4e3a12; font-style:italic; letter-spacing:.06em;
  font-family:"Snell Roundhand","Brush Script MT","Zen Kaku Gothic New",cursive;
  text-shadow:0 1px 0 rgba(255,252,240,.85), 0 -1px 1px rgba(80,58,16,.4);
  transform:rotate(-2.5deg); }
.niMeta { margin-top:2.4cqh; display:flex; gap:6.4cqw; font-size:1.95cqw; letter-spacing:.15em; text-indent:.15em;
  color:#3d5da8; font-weight:700;
  text-shadow:0 1px 0 rgba(255,252,240,.8); }

/* ---- 展開後に差す温かい光 (v8のまたたき) + 光沢スイープ ---- */
.niWash { position:absolute; inset:0; z-index:7; pointer-events:none; opacity:0;
  background:radial-gradient(ellipse 90% 62% at 50% 28%, rgba(255,248,226,.34), rgba(255,244,214,.10) 52%, transparent 70%); }
.ni-open .niWash { animation:niWashK 2.4s .8s ease-in-out forwards; }
@keyframes niWashK {
  0% { opacity:0; }
  20% { opacity:.85; }
  37% { opacity:1; }
  54% { opacity:.9; }
  71% { opacity:1; }
  100% { opacity:0; } }
.niSheen { position:absolute; inset:0; z-index:8; overflow:hidden; pointer-events:none; }
.niSheen::before { content:""; position:absolute; top:-25%; left:-75%; width:38%; height:150%;
  background:linear-gradient(102deg, transparent, rgba(255,252,242,.24) 50%, transparent);
  transform:skewX(-16deg); opacity:0; }
.ni-open .niSheen::before { animation:niSheenK .9s 1.5s linear forwards; }
@keyframes niSheenK {
  0% { opacity:0; left:-75%; }
  20% { opacity:1; }
  90% { left:125%; opacity:1; }
  100% { opacity:0; left:125%; } }

/* ---- 吸収パーティクル (飛翔と同方向) ---- */
.niPt { position:absolute; left:50%; top:42%; z-index:10; width:1.6cqw; height:1.6cqw; border-radius:50%;
  background:radial-gradient(circle, #fdf0c0, #e8b23c 60%, transparent);
  opacity:0; animation:niPtK .65s ease-in forwards; }
.niPt2 { animation-delay:.06s; }
.niPt3 { animation-delay:.13s; }
.niPt4 { animation-delay:.2s; }
@keyframes niPtK {
  0% { opacity:0; transform:translate(0,0) scale(1); }
  25% { opacity:1; }
  100% { opacity:0; transform:translate(calc(var(--fdx,120px)*.85), calc(var(--fdy,-260px)*.85)) scale(.4); } }

/* ---- ボタン ---- */
.niRecv { position:absolute; left:0; right:0; bottom:8.4cqh; z-index:9; text-align:center; animation:niRecvIn .45s ease backwards; }
@keyframes niRecvIn { from { opacity:0; transform:translateY(2cqh); } to { opacity:1; transform:translateY(0); } }
.niRecv button { position:relative; padding:1.6cqh 7cqw; border-radius:6cqh; border:none; cursor:pointer; font-family:inherit;
  background:linear-gradient(180deg,#3a68c9,#2b5bc4 60%,#1f4196);
  color:#edf1fa; font-size:14px; font-weight:700; letter-spacing:.22em; text-indent:.22em;
  box-shadow:0 6px 16px rgba(20,40,110,.55), inset 0 1px 1px rgba(255,255,255,.28);
  animation:niRing 1.8s .3s ease-out infinite; }
@keyframes niRing {
  0% { box-shadow:0 6px 16px rgba(20,40,110,.55), inset 0 1px 1px rgba(255,255,255,.28), 0 0 0 0 rgba(232,178,60,.6); }
  60%, 100% { box-shadow:0 6px 16px rgba(20,40,110,.55), inset 0 1px 1px rgba(255,255,255,.28), 0 0 0 14px rgba(232,178,60,0); } }
      `}</style>
    </div>
  )
}
