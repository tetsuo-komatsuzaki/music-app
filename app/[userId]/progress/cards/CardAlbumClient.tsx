"use client"

// カードアルバム (図鑑・2026-08-31 Tetsuo確定)。
// カード格クエスト (grade:"cert" 以外) をカタログのカテゴリ順に全掲載。
// クリア済み=カードv3ミニ券面 (GalleryShelvesから移設した正本デザイン)、
// 未クリア=シルエット+達成条件 (つぎの目標リストを兼ねる)。
// 券面のカテゴリ別絵柄 (C案) は制作物が揃い次第ここに差し込む。

import Link from "next/link"
import ds from "@/app/components/ds.module.css"
import { QUESTS } from "@/app/_libs/treasureCatalog"

type Clear = { questId: string; clearedAt: string }

const CARD_QUESTS = QUESTS.filter((q) => q.grade !== "cert")

/** 券面タイトルを1行に収めるフォント倍率 (ミニ96px幅用) */
function miniFit(text: string): number {
  const n = [...text].length
  if (n <= 6) return 1
  if (n <= 9) return 0.75
  if (n <= 12) return 0.6
  if (n <= 16) return 0.46
  return 0.4
}

function fmtDate(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 9 * 3600_000)
  return d.toISOString().slice(0, 10).replaceAll("-", ".")
}

export default function CardAlbumClient({ userId, cleared }: { userId: string; cleared: Clear[] }) {
  const clearedAt = new Map(cleared.map((c) => [c.questId, c.clearedAt]))
  const total = CARD_QUESTS.length
  const got = CARD_QUESTS.filter((q) => clearedAt.has(q.questId)).length
  const categories = [...new Set(CARD_QUESTS.map((q) => q.category))]

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 14px 60px" }}>
      <Link href={`/${userId}/progress`} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 800, color: "var(--text-sub)", textDecoration: "none", paddingTop: 10 }}>
        ‹ カルテにもどる
      </Link>
      <div style={{ display: "flex", alignItems: "baseline", gap: 9, padding: "6px 2px 0" }}>
        <h1 className={ds.t} style={{ padding: 0 }}>カードアルバム</h1>
        <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--gold)", fontVariantNumeric: "tabular-nums" }}>{got} / {total}まい</span>
      </div>
      <p style={{ fontSize: 11, color: "var(--text-sub)", lineHeight: 1.8, margin: "6px 2px 0" }}>
        クエストをクリアすると カードがここにおさまるよ
      </p>

      {categories.map((cat) => {
        const items = CARD_QUESTS.filter((q) => q.category === cat)
        const catGot = items.filter((q) => clearedAt.has(q.questId)).length
        return (
          <section key={cat} style={{ marginTop: 22 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "0 2px" }}>
              <h2 style={{ fontSize: 13.5, fontWeight: 900, margin: 0, color: "var(--text-ink)" }}>{cat}</h2>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: "var(--text-sub)", fontVariantNumeric: "tabular-nums" }}>{catGot}/{items.length}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 10, marginTop: 10 }}>
              {items.map((q) => {
                const at = clearedAt.get(q.questId)
                return at != null ? (
                  <span key={q.questId} className="caAlbumCard">
                    <span className="caAlbumBrand">ARCODA</span>
                    <span className="caAlbumArt">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/arco/05B.jpg" alt="" /></span>
                    <span className="caAlbumTitle" style={{ fontSize: `${Math.round(90 * miniFit(q.title)) / 10}px` }}>{q.title}</span>
                    <span className="caAlbumDate">{fmtDate(at)}</span>
                    <span className="caAlbumNo">No.{String(q.no).padStart(3, "0")}</span>
                  </span>
                ) : (
                  <span key={q.questId} className="caAlbumGhost">
                    <span className="caAlbumGhostNo">No.{String(q.no).padStart(3, "0")}</span>
                    <span className="caAlbumGhostQ">?</span>
                    <span className="caAlbumGhostTitle">{q.title}</span>
                    <span className="caAlbumGhostSub">{q.sub}</span>
                  </span>
                )
              })}
            </div>
          </section>
        )
      })}

      {/* 券面CSS (カードv3 caFront の正本ミニ版=旧GalleryShelves.MiniCardの移設) */}
      <style>{`
.caAlbumCard { position:relative; display:flex; flex-direction:column; align-items:center; justify-content:flex-start;
  aspect-ratio:3/4.1; border-radius:9px; padding:11px 6px 8px; box-sizing:border-box; overflow:hidden;
  background:linear-gradient(160deg, #f9f4e8, #ede4ce 85%);
  border:1px solid #d7dfee;
  box-shadow:inset 0 0 0 2px rgba(255,255,255,.65), inset 0 0 0 3px rgba(148,162,190,.75),
    inset 0 0 0 5px rgba(249,244,232,.9), inset 0 0 0 6px rgba(148,162,190,.4),
    0 5px 12px rgba(0,0,0,.4); }
.caAlbumCard::before { content:""; position:absolute; inset:0; opacity:.5; pointer-events:none;
  background:repeating-linear-gradient(0deg, transparent 0 3px, rgba(120,110,90,.05) 3px 4px); }
.caAlbumBrand { font-size:6.5px; letter-spacing:.4em; padding-left:.4em; color:#8a7a4e; font-weight:900; }
.caAlbumArt { display:block; width:52%; aspect-ratio:1; margin-top:7px; border-radius:50%; overflow:hidden;
  box-shadow:inset 0 0 0 1px rgba(148,162,190,.6), 0 2px 6px rgba(43,51,80,.18); }
.caAlbumArt img { width:100%; height:100%; object-fit:cover; display:block; }
.caAlbumTitle { margin-top:7px; max-width:94%; overflow:hidden; white-space:nowrap; font-weight:900; color:#2b3350; line-height:1.4; text-align:center; letter-spacing:.02em; }
.caAlbumDate { margin-top:3px; font-size:6.5px; color:#8a93a8; font-variant-numeric:tabular-nums; }
.caAlbumNo { margin-top:auto; font-size:6.5px; font-weight:700; letter-spacing:.24em; padding-left:.24em; color:#8a93a8; }
.caAlbumGhost { position:relative; display:flex; flex-direction:column; align-items:center; justify-content:flex-start;
  aspect-ratio:3/4.1; border-radius:9px; padding:10px 6px 8px; box-sizing:border-box;
  background:rgba(150,175,225,.05); border:1.5px dashed rgba(150,175,225,.22); }
.caAlbumGhostNo { font-size:6.5px; font-weight:700; letter-spacing:.24em; padding-left:.24em; color:var(--text-muted); }
.caAlbumGhostQ { margin-top:9px; width:34px; height:34px; border-radius:50%; display:grid; place-items:center;
  border:1.5px dashed rgba(150,175,225,.3); color:var(--text-muted); font-size:15px; font-weight:900; }
.caAlbumGhostTitle { margin-top:8px; max-width:94%; font-size:8.5px; font-weight:800; color:var(--text-sub); text-align:center; line-height:1.4; }
.caAlbumGhostSub { margin-top:3px; max-width:94%; font-size:7px; color:var(--text-muted); text-align:center; line-height:1.5; }
      `}</style>
    </div>
  )
}
