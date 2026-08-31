"use client"

// ============================================================
// 宝物の授与オーケストレーター (骨組み・2026-08-30 実装仕様v1.3 §4)。
// コイン工程 (CoinCelebration・本番稼働・非改変) の完了後に、宝物キューを
// 格順 (カード→称号→メダル→記念→証明書) で再生する。
// 骨組みでは券面・モーションはプレースホルダー (灰カードのフェード)。
// C案めくり/巻物は肉付けフェーズでモック承認後に実装する。
// 規則: 演出開始時点で全消化 / 画面タップでスキップ / コインと合わせ最大2つ /
// reduced-motion は演出なし即消化 / 3つ目以降は棚へ。
// ============================================================

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { consumeTreasures } from "@/app/actions/treasures"
import { NINTEI_FACES, QUEST_BY_ID } from "@/app/_libs/treasureCatalog"
import CardAwardMotion from "./CardAwardMotion"
import MedalAwardMotion from "./MedalAwardMotion"
import CertAwardMotion from "./CertAwardMotion"
import NinteiAwardMotion from "./NinteiAwardMotion"
import TitleAwardMotion from "./TitleAwardMotion"
import MasterCardAwardMotion from "./MasterCardAwardMotion"
import { rankName } from "@/app/_libs/rankCard"

export type TreasureQueueItem = {
  id: string
  kind: string // card / title / medal / master_card / cert
  sourceId: string
  catalogNo: number | null
  /** 成果成立日 (券面の日付)。ISO文字列 */
  earnedAt?: string
  /** 券面表示名 (マスター証明書=曲名)。サーバーで解決 */
  label?: string
  /** 曲の★数 (マスター証明書用) */
  stars?: number
  /** 通し番号 (マスター証明書のCERT No)。サーバー採番 */
  certNo?: number
}

function faceDate(iso?: string): string {
  const d = iso ? new Date(iso) : new Date()
  const jst = new Date(d.getTime() + 9 * 3600_000)
  return jst.toISOString().slice(0, 10).replaceAll("-", ".")
}

const KIND_LABEL: Record<string, string> = {
  card: "カード",
  title: "称号カード",
  medal: "メダル",
  master_card: "マスター記念カード",
  cert: "証明書",
}

export default function TreasureCelebration({
  queue,
  coinMotionCount,
  demo,
  onDone,
}: {
  /** 授与待ちの宝物 (サーバーで格順ソート済) */
  queue: TreasureQueueItem[]
  /** 同じ帰着で流れたコイン演出の数 (最大2つ規則の残枠計算) */
  coinMotionCount: number
  demo?: boolean
  onDone?: () => void
}) {
  const [mounted, setMounted] = useState(false)
  const [idx, setIdx] = useState(0)
  const [done, setDone] = useState(false)
  const consumed = useRef(false)
  useEffect(() => setMounted(true), [])

  // 最大2つ/帰着はコインと合算 (実装仕様§4)
  const playable = Math.max(0, 2 - coinMotionCount)
  const playQueue = queue.slice(0, playable)

  useEffect(() => {
    if (!mounted) return
    // 演出開始時点で全消化 (残りは棚へ・二度と流れない)
    if (!consumed.current) {
      consumed.current = true
      if (!demo) void consumeTreasures()
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduced || playQueue.length === 0) {
      setDone(true)
      onDone?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted])

  if (!mounted || done || playQueue.length === 0) return null
  const item = playQueue[idx]

  const next = () => {
    if (idx + 1 < playQueue.length) setIdx(idx + 1)
    else { setDone(true); onDone?.() }
  }

  // メダルは高級版v4の実装モーション (肉付け済)
  if (item.kind === "medal") {
    return createPortal(
      <MedalAwardMotion key={item.id} count={Number(item.sourceId) || 0} onDone={next} />,
      document.body,
    )
  }

  // カードは高級版v3の実装モーション (肉付け済)。他種は券面確定まで仮演出
  if (item.kind === "card") {
    const q = QUEST_BY_ID.get(item.sourceId)
    return createPortal(
      <CardAwardMotion
        key={item.id}
        face={{
          title: q?.title ?? "カード",
          sub: q?.sub ?? "",
          no: item.catalogNo,
          date: faceDate(item.earnedAt),
        }}
        onDone={next}
      />,
      document.body,
    )
  }

  // 称号カードは結晶パターンの実装モーション (肉付け済)。sourceId=新しい★
  if (item.kind === "title") {
    const star = Number(item.sourceId) || 1
    return createPortal(
      <TitleAwardMotion
        key={item.id}
        face={{ star, rankName: rankName(star), date: faceDate(item.earnedAt) }}
        onDone={next}
      />,
      document.body,
    )
  }

  // マスター記念カードは結晶パターン金族の実装モーション (肉付け済)
  if (item.kind === "master_card") {
    return createPortal(
      <MasterCardAwardMotion
        key={item.id}
        face={{ song: item.label ?? "この曲", date: faceDate(item.earnedAt) }}
        onDone={next}
      />,
      document.body,
    )
  }

  // 認定証は高級版v8の実装モーション (肉付け済)。kind "cert" のうち
  // catalogNo あり=クエストgrade cert (最難関6件)。券面文言は NINTEI_FACES (草案)
  if (item.kind === "cert" && item.catalogNo != null) {
    const q = QUEST_BY_ID.get(item.sourceId)
    const f = NINTEI_FACES[item.sourceId]
    return createPortal(
      <NinteiAwardMotion
        key={item.id}
        face={{
          big: f?.big ?? q?.title ?? "認定証",
          kindLine: f?.kindLine ?? "アルコの認定証",
          body1: f?.body1 ?? (q?.sub ?? ""),
          body2: f?.body2 ?? "",
          date: faceDate(item.earnedAt),
          certNo: null,
        }}
        onDone={next}
      />,
      document.body,
    )
  }

  // マスター証明書は高級版v6の実装モーション (肉付け済)。
  // kind "cert" は認定証 (クエストgrade・catalogNoあり) と共用のため、
  // catalogNo なし=マスター起点のみここで再生する
  if (item.kind === "cert" && item.catalogNo == null) {
    return createPortal(
      <CertAwardMotion
        key={item.id}
        face={{
          song: item.label ?? "この曲",
          stars: item.stars ?? 1,
          date: faceDate(item.earnedAt),
          certNo: item.certNo ?? null,
        }}
        onDone={next}
      />,
      document.body,
    )
  }

  return createPortal(
    <div
      onClick={next}
      style={{
        position: "fixed", inset: 0, zIndex: 941, background: "rgba(6,10,22,.6)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 16, cursor: "pointer", animation: "treasureIn .3s ease",
      }}
    >
      {/* 骨組みプレースホルダー券面: 肉付けフェーズでC案めくり/巻物に置換 */}
      <div style={{
        width: 200, aspectRatio: "3/4.1", borderRadius: 14,
        background: "linear-gradient(180deg,#2a3550,#1a2340)",
        border: "1.5px dashed rgba(150,175,225,.5)",
        display: "grid", placeItems: "center", textAlign: "center",
        color: "#8fa0c4", fontSize: 13, fontWeight: 800, lineHeight: 1.9, padding: 12,
      }}>
        {KIND_LABEL[item.kind] ?? item.kind}
        <br />
        {item.catalogNo != null ? `No.${String(item.catalogNo).padStart(3, "0")}` : item.sourceId}
        <br />
        券面は仮置き
      </div>
      <span style={{ fontSize: 12, fontWeight: 800, color: "#8fa0c4" }}>
        タップでつぎへ ({idx + 1}/{playQueue.length}
        {queue.length > playQueue.length ? ` ・ ほか${queue.length - playQueue.length}件は棚へ` : ""})
      </span>
      <style>{`@keyframes treasureIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>,
    document.body,
  )
}
