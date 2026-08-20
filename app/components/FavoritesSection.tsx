"use client"

// お気に入り — モック build-home.py NEXT_FAV 下段の写経 (2026-08-20)。
// フィルタのチップ (選択=金) + 行 (金チェック丸 + 名前/補足 + 金の矢印)
import { useState } from "react"
import Link from "next/link"
import ds from "./ds.module.css"

export type FavoriteEntry = { id: string; title: string; category: string; cover: string | null; href: string }

// 表示順とラベル (曲 + 基礎練カテゴリ)。double_stop = 重音
const CATS: { key: string; label: string }[] = [
  { key: "score", label: "曲" },
  { key: "scale", label: "音階" },
  { key: "arpeggio", label: "アルペジオ" },
  { key: "etude", label: "エチュード" },
  { key: "bowing", label: "ボーイング" },
  { key: "fingering", label: "フィンガリング" },
  { key: "double_stop", label: "重音" },
]

function Check() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" />
    </svg>
  )
}

export default function FavoritesSection({ favorites }: { favorites: FavoriteEntry[] }) {
  const [cat, setCat] = useState("score")
  const items = favorites.filter((f) => f.category === cat)
  return (
    <div className={ds.card}>
      <div className={ds.lab} data-onboarding="home.favorites">お気に入り</div>
      {favorites.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--text-sub)", marginTop: 9 }}>
          ♡ を押すと、曲や教材をここに集められます
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", marginTop: 9, paddingBottom: 2 }}>
            {CATS.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setCat(c.key)}
                className={`${ds.pill} ${cat === c.key ? ds.gold : ds.mute}`}
                style={{ fontSize: 11, flex: "none", border: "none", cursor: "pointer", font: "inherit" }}
              >
                {c.label}
              </button>
            ))}
          </div>
          {items.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--text-sub)", marginTop: 12 }}>
              このカテゴリのお気に入りはまだないよ
            </div>
          ) : (
            items.map((f) => (
              <Link
                key={f.id}
                href={f.href}
                className={`${ds.row} pressable`}
                style={{ marginTop: 10, textDecoration: "none", color: "inherit" }}
              >
                <span className={`${ds.chk} ${ds.gold}`} style={{ color: "var(--gold)" }}><Check /></span>
                <div className={ds.rowMain}>
                  <b style={{ fontSize: 13.5 }}>{f.title}</b>
                </div>
                <span className={ds.arrow}>→</span>
              </Link>
            ))
          )}
        </>
      )}
    </div>
  )
}
