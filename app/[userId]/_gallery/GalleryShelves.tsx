"use client"

// ============================================================
// ギャラリー3棚 Museum Edition (肉付け・2026-08-31 Tetsuo承認 genspark返却の移植)。
// 正本: treasure-handoff/gallery-screen-approved-v3.html (舞台装置のCSSはほぼ原文)。
// Tetsuo指示: コイン/メダル/証明書/認定証の造形は実装済み正本を使う
//   → Coin部品 + TreasureFaces (モーション造形の静止コピー) を差し込む。
// 棚: コイン (達成コイン+つぎの宝物) / カード (クエスト+称号と記念) /
//     栄誉 (メダル+賞状+つぎの栄誉)。タップで拡大表示。
// 点灯までどの本番画面からも参照しない (ダーク)。
// ============================================================

import { useState, type ReactNode } from "react"
import Coin from "@/app/components/Coin"
import ShareSheet from "@/app/components/ShareSheet"
import type { ShareKind } from "@/app/_libs/shareCard"
import { MEDAL_MILESTONES, NINTEI_FACES, QUESTS } from "@/app/_libs/treasureCatalog"
import { MedalFace, ScrollFace, TreasureFaceStyles } from "./TreasureFaces"

export type GalleryCoin = { scoreId: string; title: string; star: number; mastered: boolean }
export type GalleryTreasure = {
  kind: string // card / medal / cert / title / master_card
  sourceId: string
  catalogNo: number | null
  earnedAt: string
  /** 券面表示名 (マスター証明書=曲名など)。サーバーで解決 */
  label?: string
}

const QUEST_TITLE = new Map(QUESTS.map((q) => [q.questId, q.title]))

function MiniCard({ no, title, badge, num }: { no: string; title: string; badge?: "称号" | "記念"; num: string }) {
  return (
    <span className="glMini">
      <span className="glMiniNo">{no}</span>
      <span className="glMiniNum">{num}</span>
      <span className="glMiniTitle">{title}</span>
      {badge && <span className={`glMiniBadge ${badge === "称号" ? "glBTitle" : "glBMemo"}`}>{badge}</span>}
    </span>
  )
}

function Case({ jp, en, children, delay = 0 }: { jp: string; en: string; children: ReactNode; delay?: number }) {
  return (
    <section className="glCase" style={{ animationDelay: `${delay}s` }}>
      <i className="glBeam" />
      <i className="glGlass" />
      <i className="glFrameT" /><i className="glFrameB" />
      <span className="glMote" style={{ left: "18%", animationDuration: "6s", animationDelay: "1s" }} />
      <span className="glMote" style={{ left: "76%", animationDuration: "7.5s", animationDelay: "2.4s" }} />
      <div className="glPlaque"><span className="glPJp">{jp}</span><span className="glPEn">{en}</span></div>
      {children}
    </section>
  )
}

function EmptySlot({ text }: { text: string }) {
  return <div className="glEmpty"><span>{text}</span></div>
}

export default function GalleryShelves({
  coins,
  required,
  treasures,
}: {
  coins: GalleryCoin[]
  required: number
  treasures: GalleryTreasure[]
}) {
  const [tab, setTab] = useState<"coin" | "card" | "honor">("coin")
  const [zoom, setZoom] = useState<ReactNode | null>(null)
  // 栄誉のシェア (フェーズ3: 証明書/認定証/メダル)
  const [share, setShare] = useState<{ kind: ShareKind; refId: string } | null>(null)
  const cards = treasures.filter((t) => t.kind === "card")
  const titles = treasures.filter((t) => ["title", "master_card"].includes(t.kind))
  const medals = treasures.filter((t) => t.kind === "medal")
  const certs = treasures.filter((t) => t.kind === "cert")
  const honorCount = medals.length + certs.length
  const nextMilestone = MEDAL_MILESTONES.find((n) => n > cards.length)

  const tabs = [
    { id: "coin" as const, label: "コイン", n: coins.length },
    { id: "card" as const, label: "カード", n: cards.length + titles.length },
    { id: "honor" as const, label: "栄誉", n: honorCount },
  ]

  const zoomable = (node: ReactNode, big: ReactNode, shareReq?: { kind: ShareKind; refId: string }) => (
    <button
      type="button"
      className="glTreasure"
      onClick={() => setZoom(
        <>
          {big}
          {shareReq && (
            <button
              type="button"
              className="glShareBtn"
              onClick={(e) => { e.stopPropagation(); setZoom(null); setShare(shareReq) }}
            >
              シェアする
            </button>
          )}
        </>,
      )}
    >
      {node}
    </button>
  )

  /** 認定証の券面文言 (sourceId=questId → NINTEI_FACES) */
  const certFace = (t: GalleryTreasure) => {
    const f = NINTEI_FACES[t.sourceId]
    if (f) return { variant: "blue" as const, piece: f.big, kindLine: f.kindLine }
    return { variant: "gold" as const, piece: t.label ?? "この曲", kindLine: undefined }
  }

  return (
    <div className="glRoot">
      <TreasureFaceStyles />
      <header className="glHead">
        <div className="glTitle">宝物の棚</div>
        <div className="glSub">TREASURE GALLERY</div>
        <div className="glRule"><i /></div>
      </header>

      <div className="glTabs">
        {tabs.map((t) => (
          <button key={t.id} type="button" className={`glTab ${tab === t.id ? "on" : ""}`} onClick={() => setTab(t.id)}>
            <span className="glTName">{t.label}</span>
            <span className="glTCount">{t.n} しょじ</span>
          </button>
        ))}
      </div>

      {tab === "coin" && (
        <div className="glShelf">
          <Case jp="達成コイン" en="ACHIEVEMENT COINS">
            <div className="glRow">
              {coins.map((c) => (
                <span key={c.scoreId} className="glPed">
                  {zoomable(
                    <Coin size={62} star={c.star} master={c.mastered} />,
                    <div style={{ textAlign: "center" }}><Coin size={160} star={c.star} master={c.mastered} /><p className="glZoomName">{c.title}{c.mastered ? " ・ マスター" : ""}</p></div>,
                  )}
                  <i className="glPedestal" />
                  <span className="glPedTag">{c.title}</span>
                </span>
              ))}
            </div>
          </Case>
          <Case jp="つぎの宝物" en="NEXT TREASURE" delay={0.15}>
            <EmptySlot text={coins.length < required ? "つぎの曲を達成すると ここに届くよ" : "どんどん増えていくよ"} />
          </Case>
        </div>
      )}

      {tab === "card" && (
        <div className="glShelf">
          <Case jp="クエストカード" en="QUEST CARDS">
            <div className="glRow">
              {cards.length === 0 && <EmptySlot text="クエストをクリアすると カードがならぶよ" />}
              {cards.map((t) => {
                const title = QUEST_TITLE.get(t.sourceId) ?? ""
                const no = t.catalogNo != null ? `No.${String(t.catalogNo).padStart(3, "0")}` : ""
                const mini = <MiniCard no={no} num={String(t.catalogNo ?? "")} title={title} />
                return <span key={t.sourceId}>{zoomable(mini, <div className="glZoomCard">{mini}</div>)}</span>
              })}
            </div>
          </Case>
          <Case jp="称号と記念" en="TITLE AND MEMORIAL" delay={0.15}>
            <div className="glRow">
              {titles.length === 0 && <EmptySlot text="ランクアップやマスターの記念が ここにならぶよ" />}
              {titles.map((t) => {
                const isTitle = t.kind === "title"
                const mini = (
                  <MiniCard
                    no={isTitle ? `STAR ${t.sourceId}` : "MASTER"}
                    num={isTitle ? t.sourceId : "M"}
                    title={isTitle ? "ランクアップ" : (t.label ?? "マスター記念")}
                    badge={isTitle ? "称号" : "記念"}
                  />
                )
                return <span key={`${t.kind}:${t.sourceId}`}>{zoomable(mini, <div className="glZoomCard">{mini}</div>)}</span>
              })}
            </div>
          </Case>
        </div>
      )}

      {tab === "honor" && (
        <div className="glShelf">
          <Case jp="メダル" en="MEDALS">
            <div className="glRow">
              {medals.length === 0 && <EmptySlot text="カードがたまると メダルが届くよ" />}
              {medals.map((t) => (
                <span key={t.sourceId} className="glPed">
                  {zoomable(
                    <MedalFace count={Number(t.sourceId) || 0} height={120} />,
                    <div style={{ textAlign: "center" }}><MedalFace count={Number(t.sourceId) || 0} height={320} /><p className="glZoomName">カード{t.sourceId}枚の節目</p></div>,
                    { kind: "medal", refId: t.sourceId },
                  )}
                  <span className="glPedTag">カード{t.sourceId}枚の節目</span>
                </span>
              ))}
            </div>
          </Case>
          <Case jp="賞状" en="CERTIFICATES" delay={0.15}>
            <div className="glRow">
              {certs.length === 0 && <EmptySlot text="マスターと最難関クエストの賞状が ここにならぶよ" />}
              {certs.map((t) => {
                const f = certFace(t)
                return (
                  <span key={`${t.kind}:${t.sourceId}`} className="glPed">
                    {zoomable(
                      <ScrollFace variant={f.variant} piece={f.piece} kindLine={f.kindLine} height={150} />,
                      <div style={{ textAlign: "center" }}><ScrollFace variant={f.variant} piece={f.piece} kindLine={f.kindLine} height={430} /></div>,
                      f.variant === "gold"
                        ? { kind: "cert", refId: t.sourceId }
                        : { kind: "nintei", refId: t.sourceId },
                    )}
                  </span>
                )
              })}
            </div>
          </Case>
          <Case jp="つぎの栄誉" en="NEXT HONOR" delay={0.3}>
            <EmptySlot text={nextMilestone != null
              ? `あと${nextMilestone - cards.length}枚のカードで あたらしいメダルが届くよ`
              : "つぎの栄誉を めざそう"} />
          </Case>
        </div>
      )}

      <p className="glFoot">宝物をタップすると おおきく眺められるよ</p>

      {zoom != null && (
        <div className="glZoom" onClick={() => setZoom(null)}>
          {zoom}
          <span className="glZoomHint">タップでもどる</span>
        </div>
      )}
      {share != null && (
        <ShareSheet kind={share.kind} refId={share.refId} onClose={() => setShare(null)} />
      )}

      {/* 舞台装置CSS (genspark Museum Edition v3 の移植・gl接頭辞) */}
      <style>{`
.glRoot { position:relative;
  background:
    radial-gradient(ellipse 130% 42% at 50% -8%, rgba(240,205,124,.07), transparent 55%),
    radial-gradient(ellipse 120% 90% at 50% 110%, rgba(20,32,64,.5), transparent 60%),
    #070b16;
  margin:0; padding:6px 14px 34px; border-radius:18px; }
.glHead { padding:22px 4px 0; text-align:center; animation:glFadeDown .9s ease both; }
@keyframes glFadeDown { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:none; } }
.glTitle { font-size:16px; font-weight:900; letter-spacing:.42em; text-indent:.42em;
  background:linear-gradient(180deg,#fdf3d0,#e8c96e 55%,#b8892e);
  -webkit-background-clip:text; background-clip:text; color:transparent; }
.glSub { margin-top:6px; font-size:9.5px; letter-spacing:.5em; text-indent:.5em; color:#5d6b8c; font-weight:700; }
.glRule { margin:13px auto 0; display:flex; align-items:center; justify-content:center; gap:10px; }
.glRule::before, .glRule::after { content:""; width:72px; height:1px;
  background:linear-gradient(90deg, transparent, rgba(232,178,60,.55)); }
.glRule::after { transform:scaleX(-1); }
.glRule i { width:6px; height:6px; transform:rotate(45deg);
  background:linear-gradient(135deg,#f5d98c,#c99a35 60%,#8a6a1a);
  box-shadow:0 0 8px rgba(232,178,60,.5); }
.glTabs { display:flex; gap:9px; padding:16px 2px 4px; }
.glTab { flex:1; position:relative; padding:10px 4px 9px; cursor:pointer; text-align:center;
  background:linear-gradient(180deg,#0e1730,#0a1122);
  border:1px solid rgba(150,175,225,.12); border-radius:4px;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.04), 0 4px 10px rgba(0,0,0,.4); transition:.28s; }
.glTab .glTName { display:block; font-size:11.5px; font-weight:800; letter-spacing:.22em; text-indent:.22em; color:#8fa0c4; }
.glTab .glTCount { display:block; margin-top:3px; font-size:8.5px; letter-spacing:.16em; color:#5d6b8c; }
.glTab.on { border-color:rgba(212,168,72,.55);
  background:linear-gradient(180deg,#1b2544,#101a34);
  box-shadow:inset 0 1px 0 rgba(245,217,140,.18), 0 0 0 1px rgba(212,168,72,.12), 0 6px 16px rgba(0,0,0,.5); }
.glTab.on .glTName { color:#f5d98c; text-shadow:0 0 12px rgba(232,178,60,.35); }
.glTab.on .glTCount { color:#c99a35; }
.glShelf { padding:4px 0 8px; }
.glCase { position:relative; margin:16px 0 26px; padding:28px 12px 24px; border-radius:6px; overflow:hidden;
  background:
    radial-gradient(ellipse 120% 90% at 50% 0%, rgba(44,58,104,.55), transparent 60%),
    linear-gradient(180deg, #101830, #0a1020);
  border:1px solid rgba(190,200,230,.1);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.05), inset 0 20px 44px rgba(0,0,0,.5),
    inset 0 -22px 40px rgba(0,0,0,.55), 0 20px 44px rgba(0,0,0,.55);
  animation:glCaseIn .85s cubic-bezier(.22,1,.36,1) both; }
@keyframes glCaseIn { from { opacity:0; transform:translateY(28px) scale(.985); } to { opacity:1; transform:none; } }
.glBeam { position:absolute; left:50%; top:-38px; width:78%; height:150px; transform:translateX(-50%);
  transform-origin:top center;
  background:linear-gradient(180deg, rgba(255,236,190,.17), rgba(255,236,190,.05) 55%, transparent);
  clip-path:polygon(38% 0,62% 0,100% 100%,0 100%); filter:blur(6px); pointer-events:none;
  animation:glBeamSway 9s ease-in-out 1.2s infinite alternate; }
@keyframes glBeamSway { from { transform:translateX(-50%) rotate(-1.8deg); } to { transform:translateX(-50%) rotate(1.8deg); } }
.glGlass { position:absolute; inset:0; border-radius:6px; pointer-events:none; overflow:hidden; }
.glGlass::before { content:""; position:absolute; top:-30%; left:-24%; width:36%; height:170%;
  background:linear-gradient(100deg, transparent, rgba(220,232,255,.06) 46%, rgba(220,232,255,.1) 50%, rgba(220,232,255,.06) 54%, transparent);
  transform:skewX(-14deg); animation:glSheen 11s ease-in-out infinite; }
@keyframes glSheen { 0%,70% { left:-30%; } 88%,100% { left:120%; } }
.glFrameT, .glFrameB { position:absolute; left:-5px; right:-5px; height:9px; z-index:3;
  background:linear-gradient(180deg,#3a3320,#241d0e 55%,#161106);
  box-shadow:0 3px 8px rgba(0,0,0,.6), inset 0 1px 0 rgba(245,217,140,.35); }
.glFrameT { top:0; border-radius:4px 4px 0 0; }
.glFrameB { bottom:0; border-radius:0 0 4px 4px; background:linear-gradient(180deg,#2c2513,#1a1408 60%,#100c04); }
.glMote { position:absolute; bottom:14%; width:3.5px; height:3.5px; border-radius:50%; z-index:2; pointer-events:none;
  background:radial-gradient(circle, #fdf0c0, #e8b23c 70%, transparent);
  filter:blur(.3px); opacity:0; animation:glMote linear infinite; }
@keyframes glMote {
  0% { transform:translateY(0) translateX(0); opacity:0; }
  15% { opacity:.85; }
  50% { transform:translateY(-38px) translateX(6px); opacity:.6; }
  100% { transform:translateY(-84px) translateX(-4px); opacity:0; } }
.glPlaque { position:relative; z-index:4; margin:0 auto 16px; width:max-content; max-width:88%;
  padding:6px 20px 7px; border-radius:3px; text-align:center;
  background:linear-gradient(180deg,#3d351c,#2a2410);
  border:1px solid rgba(212,168,72,.4);
  box-shadow:0 3px 8px rgba(0,0,0,.5), inset 0 1px 0 rgba(245,217,140,.28); }
.glPJp { display:block; font-size:11px; font-weight:900; letter-spacing:.3em; text-indent:.3em; color:#f5d98c; }
.glPEn { display:block; margin-top:2px; font-size:7.5px; letter-spacing:.34em; text-indent:.34em; color:rgba(232,178,60,.65); font-weight:700; }
.glPlaque::before, .glPlaque::after { content:""; position:absolute; top:50%; width:3.5px; height:3.5px; border-radius:50%;
  transform:translateY(-50%); background:radial-gradient(circle at 35% 30%, #f5d98c, #a5761c); }
.glPlaque::before { left:7px; } .glPlaque::after { right:7px; }
.glRow { position:relative; z-index:3; display:flex; justify-content:center; align-items:flex-end; gap:16px; flex-wrap:wrap; }
.glTreasure { display:inline-block; cursor:pointer; background:none; border:none; padding:0;
  animation:glTIn .7s cubic-bezier(.3,1.35,.5,1) both; }
@keyframes glTIn { from { opacity:0; transform:translateY(16px) scale(.92); } to { opacity:1; transform:none; } }
.glPed { width:96px; text-align:center; }
.glPedestal { display:block; position:relative; width:64px; height:10px; margin:6px auto 0; border-radius:3px;
  background:linear-gradient(180deg,#333c5e,#1c2440 60%,#131a30);
  box-shadow:0 4px 8px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.1); }
.glPedTag { display:block; margin-top:8px; font-size:9px; color:#8fa0c4; letter-spacing:.08em; line-height:1.5; }
.glMini { position:relative; display:flex; flex-direction:column; align-items:center; justify-content:flex-start;
  width:92px; aspect-ratio:3/4.1; border-radius:8px; padding:9px 6px 6px; box-sizing:border-box;
  background:linear-gradient(172deg,#faf4e4 0%,#f3ead2 55%,#eadfc2 100%);
  border:1.5px solid #c99a35; box-shadow:0 6px 14px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.7); }
.glMiniNo { font-size:7.5px; font-weight:800; letter-spacing:.14em; color:#8a6a1a; align-self:flex-start; }
.glMiniNum { margin-top:8px; width:34px; height:34px; border-radius:50%; display:grid; place-items:center;
  border:1.4px solid #c99a35; color:#8a6a1a; font-size:15px; font-weight:900;
  background:radial-gradient(circle at 35% 30%, #fdf6dd, #f3e6bf); }
.glMiniTitle { margin-top:8px; font-size:9px; font-weight:800; color:#503a10; line-height:1.5; text-align:center; }
.glMiniBadge { position:absolute; bottom:6px; font-size:7.5px; font-weight:900; border-radius:999px; padding:2px 9px; color:#fff; }
.glBTitle { background:#2b5bc4; }
.glBMemo { background:#a5761c; }
.glEmpty { position:relative; z-index:3; width:150px; margin:4px auto 6px; aspect-ratio:3/3.6; border-radius:8px;
  border:1.5px dashed rgba(150,175,225,.3); display:grid; place-items:center; padding:12px; box-sizing:border-box; }
.glEmpty span { font-size:10px; color:#8fa0c4; line-height:1.9; text-align:center; font-weight:700; }
.glFoot { text-align:center; font-size:9.5px; color:#5d6b8c; letter-spacing:.14em; margin:6px 0 0; }
.glZoom { position:fixed; inset:0; z-index:960; background:rgba(4,7,14,.9);
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:18px; cursor:pointer;
  animation:glZoomIn .25s ease; }
@keyframes glZoomIn { from { opacity:0; } to { opacity:1; } }
.glZoomName { margin-top:14px; font-size:12px; font-weight:800; color:#edf1fa; text-align:center; }
.glZoomCard { transform:scale(2.4); transform-origin:center; }
.glZoomHint { font-size:10px; color:#8fa0c4; letter-spacing:.2em; }
.glShareBtn { background:linear-gradient(180deg,#3a68c9,#2b5bc4 60%,#1f4196); color:#edf1fa; border:none;
  border-radius:999px; padding:12px 40px; font-size:13px; font-weight:800; letter-spacing:.14em; cursor:pointer;
  box-shadow:0 6px 16px rgba(20,40,110,.55), inset 0 1px 1px rgba(255,255,255,.28); font-family:inherit; }
      `}</style>
    </div>
  )
}
