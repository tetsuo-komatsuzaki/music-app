# 賞状2種: 蝋封+サイン → アルコのモーション動画 (案2 封印の後継・ランダム5種)
import io

def sub(path, old, new, label):
    s = io.open(path, encoding="utf-8").read()
    assert old in s, f"{label}: anchor not found in {path}"
    io.open(path, "w", encoding="utf-8").write(s.replace(old, new, 1))
    print("ok", label)

# ArcoKit 拡張
sub("app/components/ArcoMotion.tsx",
    'export type ArcoKit = "01C" | "05A" | "05C" | "06A" | "09B"',
    'export type ArcoKit = "01C" | "05A" | "05C" | "06A" | "06B" | "08B" | "09A" | "09B"',
    "arco kit union")

RANDOM = '''
/** 賞状に立つアルコ (2026-08-31 Tetsuo確定: 固定でなくランダム表示・決定5種) */
const AWARD_ARCO_KITS = ["01C", "05C", "06B", "08B", "09A"] as const
'''

# ── 証明書 ──
sub("app/[userId]/_coin/CertAwardMotion.tsx",
    'import { useEffect, useRef, useState } from "react"',
    'import { useEffect, useRef, useState } from "react"\nimport ArcoMotion, { type ArcoKit } from "@/app/components/ArcoMotion"\n' + RANDOM,
    "cert imports")
sub("app/[userId]/_coin/CertAwardMotion.tsx",
    '''  const starText = "★ ".repeat(Math.min(Math.max(face.stars, 1), 3)).trim()''',
    '''  const starText = "★ ".repeat(Math.min(Math.max(face.stars, 1), 3)).trim()
  // アルコのモーションはマウントごとにランダム (案2: 封印の後継)
  const [arcoKit] = useState<ArcoKit>(() => AWARD_ARCO_KITS[Math.floor(Math.random() * AWARD_ARCO_KITS.length)])''',
    "cert random")
sub("app/[userId]/_coin/CertAwardMotion.tsx",
    '''                <div className="ceSealRow">
                  <div className="ceSeal">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="ceSealImg" src="/arco/05B.jpg" alt="" />
                  </div>
                  <div className="ceSign">Arco</div>
                </div>''',
    '''                {/* 案2 封印の後継: 大きなアルコのモーション (ランダム5種・2026-08-31) */}
                <div className="ceArco"><ArcoMotion kit={arcoKit} label="アルコ" className="ceArcoV" /></div>''',
    "cert seal swap")
sub("app/[userId]/_coin/CertAwardMotion.tsx",
    '''/* ---- 封印: 蝋印+肖像メダイヨン ---- */
.ceSealRow { margin-top:2.4cqh; display:flex; align-items:center; gap:3.4cqw; }
.ceSeal { position:relative; width:11.4cqw; height:11.4cqw; }
.ceSeal::before { content:""; position:absolute; inset:-1.1cqw;
  border-radius:46% 54% 51% 49% / 52% 47% 53% 48%;
  background:radial-gradient(circle at 36% 30%, #a83232, #7e1c1c 52%, #541010 88%);
  box-shadow:0 3px 6px rgba(60,20,10,.5), inset 0 2px 3px rgba(255,180,160,.35), inset 0 -3px 5px rgba(40,8,8,.6); }
.ceSeal::after { content:""; position:absolute; inset:-0.4cqw; border-radius:48% 52% 50% 50% / 51% 49% 52% 48%;
  border:1px solid rgba(255,205,180,.28); }
.ceSealImg { position:absolute; inset:0.7cqw; width:10cqw; height:10cqw; border-radius:50%; object-fit:cover;
  box-shadow:inset 0 2px 4px rgba(60,20,10,.55), 0 0 0 1.4px rgba(232,178,60,.75);
  filter:sepia(.28) saturate(.92); }
.ceSign { font-size:3.1cqw; font-weight:700; color:#4e3a12; font-style:italic; letter-spacing:.06em;
  font-family:"Snell Roundhand","Brush Script MT","Zen Kaku Gothic New",cursive;
  text-shadow:0 1px 0 rgba(255,252,240,.85), 0 -1px 1px rgba(80,58,16,.4);
  transform:rotate(-2.5deg); }''',
    '''/* ---- アルコのモーション (案2 封印の後継・大円形) ---- */
.ceArco { margin-top:1.8cqh; width:24cqw; height:24cqw; border-radius:50%; overflow:hidden;
  box-shadow:0 3px 9px rgba(90,62,10,.35), 0 0 0 1.6px rgba(178,134,44,.6); }
.ceArco .ceArcoV { display:block; width:100%; height:100%; }
.ceArco video, .ceArco img { width:100%; height:100%; object-fit:cover; display:block; }''',
    "cert seal css")
sub("app/[userId]/_coin/CertAwardMotion.tsx",
    '.ceMeta { margin-top:2.4cqh;',
    '.ceMeta { margin-top:1.6cqh;',
    "cert meta margin")

# ── 認定証 ──
sub("app/[userId]/_coin/NinteiAwardMotion.tsx",
    'import { useEffect, useRef, useState } from "react"',
    'import { useEffect, useRef, useState } from "react"\nimport ArcoMotion, { type ArcoKit } from "@/app/components/ArcoMotion"\n' + RANDOM,
    "nintei imports")
sub("app/[userId]/_coin/NinteiAwardMotion.tsx",
    '''  const advance = () => {
    const p = phaseRef.current
    if (p === "fall" || p === "open") setPhase("recv")
    else if (p === "recv") startFly()
  }''',
    '''  const advance = () => {
    const p = phaseRef.current
    if (p === "fall" || p === "open") setPhase("recv")
    else if (p === "recv") startFly()
  }

  // アルコのモーションはマウントごとにランダム (案2: 封印の後継)
  const [arcoKit] = useState<ArcoKit>(() => AWARD_ARCO_KITS[Math.floor(Math.random() * AWARD_ARCO_KITS.length)])''',
    "nintei random")
sub("app/[userId]/_coin/NinteiAwardMotion.tsx",
    '''                <div className="niSealRow">
                  <div className="niSeal">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="niSealImg" src="/arco/05B.jpg" alt="" />
                  </div>
                  <div className="niSign">Arco</div>
                </div>''',
    '''                {/* 案2 封印の後継: 大きなアルコのモーション (ランダム5種・2026-08-31) */}
                <div className="niArco"><ArcoMotion kit={arcoKit} label="アルコ" className="niArcoV" /></div>''',
    "nintei seal swap")
sub("app/[userId]/_coin/NinteiAwardMotion.tsx",
    '''/* ---- 封印: 蝋印+肖像メダイヨン (蝋は赤のまま・リングは青) ---- */
.niSealRow { margin-top:2.4cqh; display:flex; align-items:center; gap:3.4cqw; }
.niSeal { position:relative; width:11.4cqw; height:11.4cqw; }
.niSeal::before { content:""; position:absolute; inset:-1.1cqw;
  border-radius:46% 54% 51% 49% / 52% 47% 53% 48%;
  background:radial-gradient(circle at 36% 30%, #a83232, #7e1c1c 52%, #541010 88%);
  box-shadow:0 3px 6px rgba(60,20,10,.5), inset 0 2px 3px rgba(255,180,160,.35), inset 0 -3px 5px rgba(40,8,8,.6); }
.niSeal::after { content:""; position:absolute; inset:-0.4cqw; border-radius:48% 52% 50% 50% / 51% 49% 52% 48%;
  border:1px solid rgba(255,205,180,.28); }
.niSealImg { position:absolute; inset:0.7cqw; width:10cqw; height:10cqw; border-radius:50%; object-fit:cover;
  box-shadow:inset 0 2px 4px rgba(60,20,10,.55), 0 0 0 1.4px var(--tfA);
  filter:sepia(.28) saturate(.92); }
.niSign { font-size:3.1cqw; font-weight:700; color:#4e3a12; font-style:italic; letter-spacing:.06em;
  font-family:"Snell Roundhand","Brush Script MT","Zen Kaku Gothic New",cursive;
  text-shadow:0 1px 0 rgba(255,252,240,.85);
  transform:rotate(-2.5deg); }''',
    '''/* ---- アルコのモーション (案2 封印の後継・大円形・リングは青) ---- */
.niArco { margin-top:1.8cqh; width:24cqw; height:24cqw; border-radius:50%; overflow:hidden;
  box-shadow:0 3px 9px rgba(20,35,70,.35), 0 0 0 1.6px rgba(61,93,168,.7); }
.niArco .niArcoV { display:block; width:100%; height:100%; }
.niArco video, .niArco img { width:100%; height:100%; object-fit:cover; display:block; }''',
    "nintei seal css")
sub("app/[userId]/_coin/NinteiAwardMotion.tsx",
    '.niMeta { margin-top:2.4cqh;',
    '.niMeta { margin-top:1.6cqh;',
    "nintei meta margin")
