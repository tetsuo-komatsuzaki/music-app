"use client"

// ============================================================
// 宝物の静的券面 (ギャラリー棚・結果パネル用・2026-08-31)。
// 造形の正はモーション実装 (MedalAwardMotion / CertAwardMotion / NinteiAwardMotion)。
// ここはその造形CSSを「静止状態」で写した縮小表示用コピー。
// 【同期規約】モーション側の造形を変えたら必ずここにも反映する (逆も同じ)。
// 仕組み: 402x870の仮想ステージ (container-type:size で cqw/cqh を成立させる) を
// scale で縮め、宝物の領域だけを切り出して表示する。
// ============================================================

const MEDAL_REGION = { x: 125, y: 45, w: 155, h: 350 }

/** 賞状に立つアルコ (静止用ポスター)。モーション側のランダム5種と同じ顔ぶれから決定的に選ぶ */
const AWARD_ARCO_POSTERS = ["01A", "01B", "01C", "02A", "02B", "02C", "03A", "03B", "03C", "05C", "06A", "06B", "08A", "08B", "08C", "09A", "09B", "09C"] as const
function arcoPoster(seed: string): string {
  let h = 0
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return `/proto/assets/motion/${AWARD_ARCO_POSTERS[h % AWARD_ARCO_POSTERS.length]}_poster.jpg`
}
const SCROLL_REGION = { x: 56, y: 170, w: 290, h: 480 }

/** メダル (v4造形・静止)。height で大きさ指定 */
export function MedalFace({ count, height = 140 }: { count: number; height?: number }) {
  const s = height / MEDAL_REGION.h
  return (
    <span className="tfBox" style={{ width: MEDAL_REGION.w * s, height }}>
      <span className="tfStage" style={{ transform: `scale(${s})`, left: -MEDAL_REGION.x * s, top: -MEDAL_REGION.y * s }}>
        <span className="tfWrap">
          <span className="tfMm">
            <span className="tfRib"><i className="tfRibbar" /><i className="tfRibEdgeL" /><i className="tfRibEdgeR" /><i className="tfRibL" /><i className="tfRibR" /></span>
            <i className="tfRibtail" />
            <i className="tfBail" />
            <span className="tfDisc">
              <i className="tfEdge" />
              <i className="tfRim" />
              <span className="tfFace"><span className="tfRelief">
                <span className="tfLaurel"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></span>
                <b>{count}</b><small>CARDS</small>
              </span></span>
            </span>
          </span>
        </span>
      </span>
    </span>
  )
}

/** 賞状 (掛け軸・静止)。variant gold=マスター証明書 / blue=認定証。造形はv6/v8 */
export function ScrollFace({
  variant, title, piece, kindLine, height = 170,
}: {
  variant: "gold" | "blue"
  /** 見出し (MASTER CERTIFICATE / CERTIFICATE) の下に出す主役文字 */
  piece: string
  /** 種別行 (認定証のみ)。gold は省略可 */
  kindLine?: string
  /** 上部見出し。省略時は variant 既定 */
  title?: string
  height?: number
}) {
  const s = height / SCROLL_REGION.h
  return (
    <span className={`tfBox tf-${variant}`} style={{ width: SCROLL_REGION.w * s, height }}>
      <span className="tfStage" style={{ transform: `scale(${s})`, left: -SCROLL_REGION.x * s, top: -SCROLL_REGION.y * s }}>
        <span className="tfScroll">
          <i className="tfRod tfRodT"><i className="tfFin tfFinL" /><i className="tfFin tfFinR" /></i>
          <span className="tfPaper">
            <span className="tfPaperIn">
              <i className="tfGrain" />
              <i className="tfCyl" />
              <i className="tfFrame1" />
              <i className="tfFrame2" />
              <span className="tfPFace">
                <span className="tfBrand">ARCODA</span>
                <span className="tfTitle">{title ?? (variant === "gold" ? "MASTER CERTIFICATE" : "CERTIFICATE")}</span>
                <i className="tfRule" />
                <span className="tfPiece">{piece}</span>
                {kindLine && <span className="tfKind">{kindLine}</span>}
                {/* 案2 封印の後継 (静止はポスター画・piece文字列で決定的に選ぶ) */}
                <span className="tfArco">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={arcoPoster(piece)} alt="" />
                </span>
              </span>
            </span>
          </span>
          <i className="tfRod tfRodB"><i className="tfFin tfFinL" /><i className="tfFin tfFinR" /></i>
        </span>
      </span>
    </span>
  )
}

/** 券面CSS (1回だけマウントする)。GalleryShelves / 結果パネルが利用 */
export function TreasureFaceStyles() {
  return (
    <style>{`
.tfBox { position:relative; display:inline-block; overflow:hidden; vertical-align:bottom; }
.tfStage { position:absolute; width:402px; height:870px; container-type:size; transform-origin:0 0; display:block; }
:where(.tfBox) i, :where(.tfBox) span { display:block; } /* 詳細度0-0-1: 造形側のflex/gridが勝つ */

/* ---- メダル (MedalAwardMotion v4造形の静止コピー) ---- */
.tfWrap { position:absolute; left:50%; top:6%; transform:translate(-50%,0); }
.tfMm { position:relative; width:34cqw; height:46cqh; filter:drop-shadow(0 18px 22px rgba(0,0,0,.6)); }
.tfRib { position:absolute; left:50%; top:0; width:17cqw; height:22cqh; transform:translateX(-50%); }
.tfRibbar { position:absolute; left:50%; top:-0.4cqh; width:19cqw; height:1.7cqh; transform:translateX(-50%);
  border-radius:0.85cqh;
  background:linear-gradient(180deg,#f7dd9a 8%,#e8b23c 38%,#a5761c 78%,#6e4e0e);
  box-shadow:0 2px 4px rgba(0,0,0,.55), inset 0 1px 1px rgba(255,246,214,.9), inset 0 -1px 2px rgba(60,40,2,.7); }
.tfRibbar::before, .tfRibbar::after { content:""; position:absolute; top:50%; width:2.2cqw; height:2.2cqw; border-radius:50%;
  transform:translateY(-50%);
  background:radial-gradient(circle at 35% 30%, #fdf0c0, #e8b23c 55%, #7a5a12);
  box-shadow:inset 0 -1px 1px rgba(60,40,2,.8), 0 1px 2px rgba(0,0,0,.5); }
.tfRibbar::before { left:-0.6cqw; }
.tfRibbar::after { right:-0.6cqw; }
.tfRibL, .tfRibR { position:absolute; top:0; width:52%; height:100%;
  background:
    repeating-radial-gradient(ellipse 240% 60% at 50% -40%, rgba(255,255,255,.10) 0 0.55cqh, rgba(10,20,50,.16) 0.55cqh 1.1cqh),
    linear-gradient(180deg,#4a7ade 0%,#2c4d9e 45%,#1c3568 100%);
  clip-path:polygon(0 0,100% 0,88% 100%,0 100%); }
.tfRibL { left:0; transform:skewY(-4deg);
  box-shadow:inset -4px 0 6px rgba(0,0,0,.45), inset 2px 0 3px rgba(255,255,255,.18); }
.tfRibR { right:0; transform:skewY(4deg) scaleX(-1);
  box-shadow:inset -4px 0 6px rgba(0,0,0,.45), inset 2px 0 3px rgba(255,255,255,.18); }
.tfRibEdgeL, .tfRibEdgeR { position:absolute; top:0; width:1.1cqw; height:100%; z-index:2;
  background:linear-gradient(180deg,#f7dd9a,#e8b23c 40%,#c99a35 75%,#8a6a1a);
  box-shadow:inset 0 0 1px rgba(255,246,214,.7), 0 0 3px rgba(0,0,0,.4); }
.tfRibEdgeL { left:0; clip-path:polygon(0 0,100% 0,62% 100%,0 100%); transform:skewY(-4deg); }
.tfRibEdgeR { right:0; clip-path:polygon(0 0,100% 0,100% 100%,38% 100%); transform:skewY(4deg); }
.tfRib::before { content:""; position:absolute; left:50%; top:0; width:1.4cqw; height:100%; transform:translateX(-50%); z-index:3;
  background:linear-gradient(90deg, rgba(255,255,255,.14), rgba(6,12,32,.5) 55%, rgba(6,12,32,.15));
  clip-path:polygon(0 0,100% 0,60% 100%,40% 100%); }
.tfRib::after { content:""; position:absolute; inset:0; z-index:2;
  background:repeating-linear-gradient(0deg, transparent 0 0.42cqh, rgba(255,255,255,.05) 0.42cqh 0.5cqh, transparent 0.5cqh 0.84cqh, rgba(0,0,0,.10) 0.84cqh 0.92cqh); }
.tfRibtail { position:absolute; left:50%; top:20.5cqh; width:17cqw; height:3.6cqh; transform:translateX(-50%);
  background:
    repeating-radial-gradient(ellipse 240% 60% at 50% -380%, rgba(255,255,255,.08) 0 0.55cqh, rgba(10,20,50,.14) 0.55cqh 1.1cqh),
    linear-gradient(180deg,#2c4d9e,#16264a);
  clip-path:polygon(0 0,100% 0,100% 55%,50% 100%,0 55%);
  box-shadow:0 2px 3px rgba(0,0,0,.4); }
.tfRibtail::after { content:""; position:absolute; inset:0;
  background:linear-gradient(180deg, transparent 78%, rgba(232,178,60,.85) 92%, rgba(247,221,154,.9));
  clip-path:polygon(0 0,100% 0,100% 55%,50% 100%,0 55%); }
.tfBail { position:absolute; left:50%; top:21.6cqh; width:5.6cqw; height:5.6cqw; transform:translateX(-50%);
  border-radius:50%;
  background:radial-gradient(circle at 34% 30%, transparent 42%, #f7d98a 46%, #c99a35 62%, #7a5a12 82%, transparent 88%);
  box-shadow:0 2px 4px rgba(0,0,0,.5); }
/* 静止ミニでは吊りの余白を詰める (モーションは bottom:0・造形は同一) */
.tfDisc { position:absolute; left:50%; bottom:8cqh; width:29cqw; height:29cqw; transform:translateX(-50%); border-radius:50%; }
.tfEdge { position:absolute; inset:0; border-radius:50%;
  background:repeating-conic-gradient(from 0deg, #8a6a1a 0deg 2.4deg, #d9b054 2.4deg 4.8deg);
  box-shadow:0 10px 22px rgba(0,0,0,.6); }
.tfRim { position:absolute; inset:2.2%; border-radius:50%;
  background:conic-gradient(from 210deg, #8a6a1a, #f7dd9a 18%, #c99a35 32%, #8a6a1a 48%, #f0cd7c 62%, #a5761c 78%, #8a6a1a);
  box-shadow:inset 0 2px 3px rgba(255,244,205,.95), inset 0 -3px 5px rgba(74,50,4,.75); }
.tfRim::after { content:""; position:absolute; inset:6%; border-radius:50%;
  background:repeating-conic-gradient(transparent 0deg 6deg, rgba(90,60,8,.5) 6deg 6.8deg);
  -webkit-mask:radial-gradient(circle, transparent 62%, #000 64%, #000 78%, transparent 80%);
          mask:radial-gradient(circle, transparent 62%, #000 64%, #000 78%, transparent 80%); }
.tfFace { position:absolute; inset:11%; border-radius:50%; overflow:hidden;
  background:radial-gradient(circle at 50% 30%, #ffe9ad 0%, #f0c35c 34%, #d9a93c 62%, #a5761c 100%);
  box-shadow:inset 0 2px 6px rgba(74,50,4,.55), inset 0 -2px 3px rgba(255,244,205,.5);
  display:grid; place-items:center; text-align:center; }
.tfFace::before { content:""; position:absolute; inset:0; border-radius:50%; opacity:.35;
  background:repeating-radial-gradient(circle at 50% 50%, transparent 0 2px, rgba(122,90,18,.25) 2px 2.6px); }
.tfRelief { position:relative; z-index:2; display:flex; flex-direction:column; align-items:center; }
.tfLaurel { position:absolute; left:50%; top:50%; width:86%; height:86%; transform:translate(-50%,-50%); }
.tfLaurel i { position:absolute; left:50%; top:50%; width:3.4cqw; height:1.7cqw; border-radius:50% 50% 50% 0;
  background:linear-gradient(135deg, #e9c268, #a5761c);
  box-shadow:0 .4px 0 rgba(255,244,205,.7), inset 0 -.5px 1px rgba(74,50,4,.6);
  transform-origin:0 0; }
.tfLaurel i:nth-child(1){ transform:translate(-50%,-50%) rotate(200deg) translateX(9.2cqw) rotate(40deg); }
.tfLaurel i:nth-child(2){ transform:translate(-50%,-50%) rotate(220deg) translateX(9.4cqw) rotate(42deg); }
.tfLaurel i:nth-child(3){ transform:translate(-50%,-50%) rotate(240deg) translateX(9.5cqw) rotate(44deg); }
.tfLaurel i:nth-child(4){ transform:translate(-50%,-50%) rotate(260deg) translateX(9.4cqw) rotate(46deg); }
.tfLaurel i:nth-child(5){ transform:translate(-50%,-50%) rotate(280deg) translateX(9.2cqw) rotate(48deg); }
.tfLaurel i:nth-child(6){ transform:translate(-50%,-50%) rotate(340deg) translateX(9.2cqw) scaleX(-1) rotate(40deg); }
.tfLaurel i:nth-child(7){ transform:translate(-50%,-50%) rotate(320deg) translateX(9.4cqw) scaleX(-1) rotate(42deg); }
.tfLaurel i:nth-child(8){ transform:translate(-50%,-50%) rotate(300deg) translateX(9.5cqw) scaleX(-1) rotate(44deg); }
.tfLaurel i:nth-child(9){ transform:translate(-50%,-50%) rotate(280deg) translateX(0); opacity:0; }
.tfLaurel i:nth-child(10){ transform:translate(-50%,-50%) rotate(100deg) translateX(9.4cqw) scaleX(-1) rotate(46deg); }
.tfLaurel i:nth-child(11){ transform:translate(-50%,-50%) rotate(80deg) translateX(9.2cqw) scaleX(-1) rotate(48deg); }
.tfRelief b { position:relative; font-family:Georgia,serif; font-weight:700; font-size:9cqw; line-height:1;
  color:#b8892e;
  text-shadow:0 1px 0 rgba(255,244,205,.9), 0 -1.2px 1.5px rgba(74,50,4,.7), 0 0 2px rgba(122,90,18,.4); }
.tfRelief small { position:relative; margin-top:.5cqh; font-size:2.2cqw; font-weight:900; letter-spacing:.2em;
  color:#a5761c;
  text-shadow:0 .8px 0 rgba(255,244,205,.8), 0 -.8px 1px rgba(74,50,4,.5); }

/* ---- 賞状 (Cert/NinteiAwardMotion 造形の静止コピー・色はファミリー変数) ---- */
.tf-gold { --tfA:rgba(178,134,44,.92); --tfA2:rgba(160,118,38,.8); --tfInk:#503a10; --tfInk2:#33260a; --tfSub:#7a5c22;
  --tfC1:#f2d48c; --tfC2:#c99a35; --tfC3:#8a6a1a; }
.tf-blue { --tfA:rgba(61,93,168,.95); --tfA2:rgba(61,93,168,.8); --tfInk:#2c4a86; --tfInk2:#2c4a86; --tfSub:#3d5da8;
  --tfC1:#7a9ade; --tfC2:#3d5da8; --tfC3:#25406e; }
.tfScroll { position:absolute; left:50%; top:50%; width:66cqw; height:53cqh; transform:translate(-50%,-56%); }
.tfRod { position:absolute; left:50%; transform:translateX(-50%); z-index:6;
  width:72cqw; border-radius:2cqh;
  box-shadow:0 4px 8px rgba(0,0,0,.65), inset 0 1px 1px rgba(255,240,205,.35), inset 0 -2px 3px rgba(20,12,2,.8); }
.tfRodT { top:0; height:2.7cqh;
  background:linear-gradient(180deg,#8a6238 0%,#5e3f1e 42%,#3a2710 78%,#241708); }
.tfRodB { bottom:0; height:3.4cqh;
  background:linear-gradient(180deg,#7a552e 0%,#4e3415 42%,#33210c 78%,#1d1206); }
.tfFin { position:absolute; top:50%; width:5cqw; height:5cqw; transform:translateY(-50%); }
.tfFin::after { content:""; position:absolute; top:50%; width:4.4cqw; height:4.4cqw; border-radius:50%; transform:translateY(-50%);
  background:radial-gradient(circle at 33% 27%, #fdf0c0, #e8b23c 45%, #8a6a1a 80%, #54380a);
  box-shadow:inset 0 -2px 3px rgba(50,34,2,.9), inset 0 1px 1px rgba(255,246,214,.8), 0 2px 5px rgba(0,0,0,.6); }
.tfFinL { left:-3.6cqw; } .tfFinL::after { left:0; }
.tfFinR { right:-3.6cqw; } .tfFinR::after { right:0; }
.tfPaper { position:absolute; left:50%; top:1.35cqh; width:66cqw; transform:translateX(-50%); z-index:4;
  height:50.3cqh; overflow:hidden;
  filter:drop-shadow(0 20px 24px rgba(0,0,0,.62)) drop-shadow(0 4px 6px rgba(0,0,0,.4)); }
.tfPaperIn { position:absolute; left:0; top:0; width:100%; height:50.3cqh;
  background:
    radial-gradient(ellipse 34% 20% at 8% 6%, rgba(126,92,38,.14), transparent 70%),
    radial-gradient(ellipse 30% 18% at 92% 8%, rgba(126,92,38,.11), transparent 70%),
    radial-gradient(ellipse 36% 22% at 12% 94%, rgba(110,80,32,.16), transparent 70%),
    radial-gradient(ellipse 32% 20% at 90% 92%, rgba(110,80,32,.12), transparent 70%),
    linear-gradient(168deg,#f8f1e0 0%,#f1e7cf 30%,#eee2c6 55%,#f3ead4 78%,#e9dcbc 100%); }
.tfGrain { position:absolute; inset:0; z-index:1; pointer-events:none;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><filter id='n' x='0' y='0' width='100%25' height='100%25'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 0.40 0 0 0 0 0.30 0 0 0 0 0.16 0 0 0 0.055 0'/></filter><rect width='260' height='260' filter='url(%23n)'/></svg>");
  background-size:260px 260px; }
.tfCyl { position:absolute; inset:0; z-index:2; pointer-events:none;
  background:
    linear-gradient(90deg, rgba(70,50,18,.22), rgba(70,50,18,.05) 9%, transparent 20%, transparent 80%, rgba(70,50,18,.05) 91%, rgba(70,50,18,.24)),
    radial-gradient(ellipse 90% 60% at 50% 42%, rgba(255,252,240,.20), transparent 60%); }
.tfFrame1 { position:absolute; inset:3.4cqh 4cqw; z-index:4; border:1.6px solid var(--tfA);
  box-shadow:0 0 5px rgba(232,178,60,.18), inset 0 0 5px rgba(232,178,60,.1); }
.tfFrame2 { position:absolute; inset:4.3cqh 5.4cqw; z-index:4; border:0.8px solid var(--tfA2); }
.tfPFace { position:absolute; inset:0; z-index:6; display:flex; flex-direction:column; align-items:center;
  text-align:center; padding-top:7.6cqh; }
.tfBrand { font-size:2.2cqw; letter-spacing:.44em; text-indent:.44em; font-weight:700; color:var(--tfSub);
  text-shadow:0 1px 0 rgba(255,252,240,.85); }
.tfTitle { margin-top:1.3cqh; font-size:3.7cqw; letter-spacing:.16em; text-indent:.16em; font-weight:900; color:var(--tfInk);
  text-shadow:0 1px 0 rgba(255,252,240,.9); }
.tfRule { position:relative; margin-top:1.5cqh; width:36cqw; height:0;
  border-top:1.6px solid var(--tfA); }
.tfRule::after { content:""; position:absolute; left:50%; top:-3.4px; width:5.4px; height:5.4px;
  transform:translateX(-50%) rotate(45deg);
  background:linear-gradient(135deg,var(--tfC1),var(--tfC2) 60%,var(--tfC3)); }
.tfPiece { margin-top:2.5cqh; font-size:6cqw; font-weight:900; letter-spacing:.1em; text-indent:.1em; color:var(--tfInk2);
  text-shadow:0 1px 0 rgba(255,252,240,.95); max-width:54cqw; }
.tfKind { margin-top:1.1cqh; font-size:2.9cqw; letter-spacing:.34em; text-indent:.34em; color:var(--tfSub); font-weight:700;
  text-shadow:0 1px 0 rgba(255,252,240,.9); }
.tfArco { margin-top:2cqh; width:22cqw; height:22cqw; border-radius:50%; overflow:hidden; display:block;
  box-shadow:0 3px 8px rgba(60,42,10,.3), 0 0 0 1.4px var(--tfA); }
.tfArco img { width:100%; height:100%; object-fit:cover; display:block; }
    `}</style>
  )
}
