// シェア機能 (2026-08-03): 純粋ヘルパー (prisma非依存・クライアント/サーバー両用)。
// カード4種 = お祝い系(master/rank_up=図形紙吹雪) + 報告系(weekly/daily=五線譜)。
// デザイン確定モック: share-master(c6e96c58)/starup(edf5f053)/weekly(2d5278f1)/today(3ede2c6c)

export type ShareKind = "master" | "rank_up" | "weekly" | "daily" | "cert" | "nintei" | "medal"

/** ShareCard.payload の中身 (サーバー生成の自己完結スナップショット) */
export type SharePayload = {
  // master / daily
  title?: string // 曲名
  star?: number // master: 達成時★ / rank_up: 上がった後の★
  fromStar?: number // rank_up: 上がる前の★
  attempts?: number // master: 挑戦回数 / daily: この曲N回目
  // daily
  pitch?: number // 音程 (四捨五入済)
  timing?: number // リズム (四捨五入済)
  bestDelta?: number | null // 自己ベスト更新幅 (+N)。null/undefined = 更新なし
  date?: string // "8/3"
  // weekly
  period?: string // "7/28〜8/3"
  days?: number // 練習した日数
  recs?: number // 録音した回数
  skills?: number // 伸びたわざ (正式習得=レッスンクリアのみ)
  // cert (マスター証明書)
  certNo?: number // 獲得順の通し番号
  // nintei (アルコの認定証)
  big?: string // 大見出し (例 100 DAYS)
  kindLine?: string // 種別行 (例 継続の認定証)
  // medal
  count?: number // カード枚数の節目
}

export const SHARE_KINDS: readonly ShareKind[] = ["master", "rank_up", "weekly", "daily", "cert", "nintei", "medal"]

export function isShareKind(v: unknown): v is ShareKind {
  return typeof v === "string" && (SHARE_KINDS as readonly string[]).includes(v)
}

/** お祝い系 (紙吹雪) か報告系 (五線譜) か */
export function isCelebrationKind(kind: ShareKind): boolean {
  return kind === "master" || kind === "rank_up" || kind === "cert" || kind === "nintei" || kind === "medal"
}

/** カード種別ごとの表示メタ (eyebrow = カード上部の英字ラベル) */
export const SHARE_KIND_META: Record<ShareKind, { eyebrow: string; label: string }> = {
  master: { eyebrow: "🏆 MASTERED", label: "曲マスター" },
  rank_up: { eyebrow: "⭐ RANK UP", label: "ランクアップ" },
  weekly: { eyebrow: "📅 WEEKLY REPORT", label: "今週のがんばり" },
  daily: { eyebrow: "🎵 TODAY'S PLAY", label: "きょうの演奏" },
  cert: { eyebrow: "📜 MASTER CERTIFICATE", label: "マスター証明書" },
  nintei: { eyebrow: "📜 CERTIFICATE", label: "アルコの認定証" },
  medal: { eyebrow: "🏅 MEDAL", label: "カードのメダル" },
}

/**
 * 長い曲名の自動縮小 (確定ルール): 〜8字=基準 / 9〜14字=79% / 15字〜=63%。最大2行はCSS側。
 * base = 基準サイズ (OG 1200幅なら 71, モック640幅なら 38)
 */
export function titleFontPx(title: string, base: number): number {
  const n = [...title.trim()].length
  if (n <= 8) return base
  if (n <= 14) return Math.round(base * 0.79)
  return Math.round(base * 0.63)
}

/** JST の月/日 "8/3" */
export function fmtMDJst(d: Date): string {
  const j = new Date(d.getTime() + 9 * 3600_000)
  return `${j.getUTCMonth() + 1}/${j.getUTCDate()}`
}

/** end 日を含む直近7日間の期間表記 "7/28〜8/3" (JST) */
export function weekPeriodJst(end: Date): string {
  const start = new Date(end.getTime() - 6 * 24 * 3600_000)
  return `${fmtMDJst(start)}〜${fmtMDJst(end)}`
}

/** JST の日付キー "2026-08-03" (練習日数の distinct 用) */
export function dayKeyJst(d: Date): string {
  const j = new Date(d.getTime() + 9 * 3600_000)
  return `${j.getUTCFullYear()}-${String(j.getUTCMonth() + 1).padStart(2, "0")}-${String(j.getUTCDate()).padStart(2, "0")}`
}

/** SNS投稿の文言 (URL は各プラットフォーム側で付与) */
export function shareText(kind: ShareKind, p: SharePayload): string {
  switch (kind) {
    case "master":
      return `「${p.title ?? ""}」をマスターしました！🏆🎻 #アルコ #バイオリン`
    case "rank_up":
      return `★${p.star ?? ""}ステージにランクアップしました！⭐🎻 #アルコ #バイオリン`
    case "weekly":
      return `今週は練習${p.days ?? 0}日・録音${p.recs ?? 0}回がんばりました！📅🎻 #アルコ #バイオリン`
    case "daily":
      return `「${p.title ?? ""}」を演奏しました 音程${p.pitch ?? "-"}点・リズム${p.timing ?? "-"}点🎵🎻 #アルコ #バイオリン`
    case "cert":
      return `「${p.title ?? ""}」のマスター証明書をもらいました！📜🎻 #アルコ #バイオリン`
    case "nintei":
      return `${p.kindLine ?? "認定証"}をもらいました！📜🎻 #アルコ #バイオリン`
    case "medal":
      return `カード${p.count ?? ""}枚のメダルをもらいました！🏅🎻 #アルコ #バイオリン`
  }
}

/** 公開ページ/OGのタイトル (metadata 用) */
export function shareOgTitle(kind: ShareKind, p: SharePayload, displayName: string | null): string {
  const who = displayName ? `${displayName}さんが` : ""
  switch (kind) {
    case "master": return `${who}「${p.title ?? ""}」をマスター！ | アルコ`
    case "rank_up": return `${who}★${p.star ?? ""}ステージにランクアップ！ | アルコ`
    case "weekly": return `${who}今週も練習がんばりました | アルコ`
    case "daily": return `${who}「${p.title ?? ""}」を演奏しました | アルコ`
    case "cert": return `${who}「${p.title ?? ""}」のマスター証明書を獲得！ | アルコ`
    case "nintei": return `${who}${p.kindLine ?? "認定証"}を獲得！ | アルコ`
    case "medal": return `${who}カード${p.count ?? ""}枚のメダルを獲得！ | アルコ`
  }
}
