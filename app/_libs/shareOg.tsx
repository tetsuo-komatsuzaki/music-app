// シェア機能 (2026-08-03): OG画像 (Satori/ImageResponse) の共通ビルダー。
// 横1200×630 (OGP) と 縦1080×1350 (Instagram) の2レイアウトを同じ部品で生成。
// デザイン = 確定モック: お祝い系(master/rank_up)=クリーム金+図形紙吹雪 / 報告系(weekly/daily)=五線譜。
// アルコちゃんは ArcoChan SVG を data URI で埋め込み (アプリ内と同一キャラ)。
import type { ReactElement } from "react"
import { readFileSync } from "fs"
import { join } from "path"
import {
  type ShareKind, type SharePayload, isCelebrationKind, titleFontPx, SHARE_KIND_META,
} from "@/app/_libs/shareCard"

// ── 色 (確定モックのパレット) ────────────────────────────
const C = {
  bgFrom: "#fffdf6", bgTo: "#fdf6e6",
  ink: "#1a2028", eyebrow: "#a98b2f", sub: "#8a7c62", muted: "#9a8c74",
  gold: "#a97b1f", green: "#0f8a4f", blue: "#4f63c8",
  starOn: "#e3a51f", starOff: "#c9bfa8", arrow: "#b8a982",
  confetti: ["#e8c96a", "#7a8ce0", "#e59fb2", "#8fce9f"],
  staff: "#e3d5ac", note: "#d8c48e", glow: "#f5df9e66",
}

// ── 新アルコ (水彩ポスター) → JPEG data URI ────────────────────────────
// 2026-08-23: 旧SVGアルコ→キットのポスターへ。master/rank_up=喜び, weekly=お疲れさま(ひと息), daily=いいね(拍手)
const ARCO_KIND_KIT: Record<ShareKind, string> = { master: "02A", rank_up: "02B", weekly: "10A", daily: "06A" }
const arcoCache: Partial<Record<ShareKind, string>> = {}
export function arcoDataUri(kind: ShareKind): string {
  if (!arcoCache[kind]) {
    const buf = readFileSync(join(process.cwd(), "public", "arco", `${ARCO_KIND_KIT[kind]}.jpg`))
    arcoCache[kind] = `data:image/jpeg;base64,${buf.toString("base64")}`
  }
  return arcoCache[kind]!
}

// ── 五線譜背景 (報告系) → SVG data URI ─────────────────
// 音符はフォント非依存の図形 (楕円+符幹) で描く (resvg のテキスト描画に依存しない)
function staffSvg(w: number, h: number): string {
  const lines: string[] = []
  const y0 = h * 0.19
  const gap = h * 0.048
  for (let i = 0; i < 5; i++) {
    const y = y0 + i * gap
    lines.push(
      `<path d="M${-20},${y} C ${w * 0.25},${y - h * 0.048} ${w * 0.58},${y + h * 0.048} ${w + 20},${y - h * 0.032}" stroke="${C.staff}" stroke-width="${Math.max(2, w / 600)}" fill="none" opacity="0.55"/>`,
    )
  }
  const note = (x: number, y: number, s: number, rot: number, op: number) =>
    `<g transform="translate(${x},${y}) rotate(${rot})" opacity="${op}">` +
    `<ellipse cx="0" cy="0" rx="${s}" ry="${s * 0.72}" transform="rotate(-20)" fill="${C.note}"/>` +
    `<rect x="${s * 0.72}" y="${-s * 3.1}" width="${s * 0.22}" height="${s * 3.1}" rx="${s * 0.11}" fill="${C.note}"/>` +
    `</g>`
  const notes = [
    note(w * 0.15, y0 + gap * 1.2, w / 80, -6, 0.8),
    note(w * 0.53, y0 + gap * 3.0, w / 95, 8, 0.65),
    note(w * 0.82, y0 + gap * 0.5, w / 88, -4, 0.7),
  ].join("")
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${lines.join("")}${notes}</svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`
}

// ── 図形紙吹雪 (お祝い系) — モック確定配置 ──────────────
type Conf = { top?: string; bottom?: string; left?: string; right?: string; wf: number; hf: number; round?: boolean; rot: number; op: number; c: number }
const CONFETTI: Conf[] = [
  { top: "9%", left: "6%", wf: 11, hf: 15, rot: 28, op: 1, c: 0 },
  { top: "22%", left: "34%", wf: 8, hf: 8, round: true, rot: 0, op: 0.65, c: 1 },
  { top: "6%", left: "56%", wf: 9, hf: 13, rot: -35, op: 0.8, c: 2 },
  { top: "38%", left: "3%", wf: 10, hf: 10, rot: 50, op: 0.7, c: 3 },
  { top: "14%", right: "9%", wf: 12, hf: 16, rot: -18, op: 0.85, c: 0 },
  { top: "52%", right: "3%", wf: 8, hf: 8, round: true, rot: 0, op: 0.6, c: 2 },
  { bottom: "14%", left: "12%", wf: 9, hf: 13, rot: 70, op: 0.6, c: 1 },
  { bottom: "9%", left: "44%", wf: 8, hf: 11, rot: -50, op: 0.55, c: 3 },
  { bottom: "20%", right: "16%", wf: 10, hf: 14, rot: 15, op: 0.7, c: 0 },
  { top: "30%", left: "18%", wf: 7, hf: 7, round: true, rot: 0, op: 0.5, c: 0 },
  { bottom: "32%", right: "34%", wf: 8, hf: 12, rot: 95, op: 0.5, c: 2 },
]

// ── フォント (Google Fonts から使用文字だけ subset 取得) ──
async function fetchGoogleFont(text: string, weight: 700 | 900): Promise<ArrayBuffer | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@${weight}&text=${encodeURIComponent(text)}`
    const css = await fetch(cssUrl).then((r) => (r.ok ? r.text() : null))
    if (!css) return null
    const m = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)
    if (!m) return null
    const buf = await fetch(m[1]).then((r) => (r.ok ? r.arrayBuffer() : null))
    return buf
  } catch {
    return null
  }
}

export async function loadShareFonts(kind: ShareKind, p: SharePayload, displayName: string | null) {
  // カードに出る可能性のある文字を全部 subset に含める (数字・記号込み)
  const text =
    (p.title ?? "") + (p.period ?? "") + (p.date ?? "") + (displayName ?? "") +
    "0123456789+−-/〜・★→!！点回日個目 MASTEREDRANKUPWEKLYPOTDAI'S" +
    "アルコちゃんレベル挑戦した回数練習日数録音伸びたわざ音程リズム自己ベスト更新今週も頑張ったね次のステージへつぎ上がったよマスターarcodaviolin.com"
  const [w700, w900] = await Promise.all([fetchGoogleFont(text, 700), fetchGoogleFont(text, 900)])
  const fonts: { name: string; data: ArrayBuffer; weight: 700 | 900 }[] = []
  if (w700) fonts.push({ name: "NotoSansJP", data: w700, weight: 700 })
  if (w900) fonts.push({ name: "NotoSansJP", data: w900, weight: 900 })
  return fonts
}

// ── 部品 ────────────────────────────────────────────────
function Stat({ value, unit, label, color, fs }: { value: string; unit?: string; label: string; color: string; fs: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
      <div style={{ display: "flex", alignItems: "baseline" }}>
        <span style={{ fontSize: fs, fontWeight: 900, color }}>{value}</span>
        {unit ? <span style={{ fontSize: Math.round(fs * 0.5), fontWeight: 900, color }}>{unit}</span> : null}
      </div>
      <span style={{ fontSize: Math.round(fs * 0.38), fontWeight: 700, color: C.muted }}>{label}</span>
    </div>
  )
}

function starsRow(p: SharePayload, fs: number): ReactElement {
  const from = Math.max(0, p.fromStar ?? 0)
  const to = Math.max(1, p.star ?? 1)
  return (
    <div style={{ display: "flex", alignItems: "center", gap: Math.round(fs * 0.35) }}>
      <span style={{ fontSize: fs, fontWeight: 900, color: C.starOff }}>{"★".repeat(Math.max(1, from))}</span>
      <span style={{ fontSize: Math.round(fs * 0.62), fontWeight: 900, color: C.arrow }}>→</span>
      <span style={{ fontSize: Math.round(fs * 1.4), fontWeight: 900, color: C.starOn }}>{"★".repeat(to)}</span>
    </div>
  )
}

// ── カード本体 ──────────────────────────────────────────
export function ShareOgCard({
  kind, payload: p, displayName, width, height, vertical = false,
}: {
  kind: ShareKind
  payload: SharePayload
  displayName: string | null
  width: number
  height: number
  vertical?: boolean
}): ReactElement {
  const celebration = isCelebrationKind(kind)
  const meta = SHARE_KIND_META[kind]
  // スケール基準: モック640px幅 → width
  const k = width / 640
  const px = (v: number) => Math.round(v * k * (vertical ? 0.85 : 1))

  // OG画像は絵文字を使わない (Satori の emoji ローダー非依存)。英字ラベルのみ
  const plainEyebrow = meta.eyebrow.replace(/[^ -~]/g, "").trim()
  const eyebrowText =
    kind === "weekly" ? `${plainEyebrow} ・ ${p.period ?? ""}` :
    kind === "daily" ? `${plainEyebrow} ・ ${p.date ?? ""}` : plainEyebrow

  const headline =
    kind === "master" || kind === "daily" ? (p.title ?? "") :
    kind === "weekly" ? "今週も頑張ったね！" : "つぎのステージへ！"
  const headlineFs =
    kind === "master" || kind === "daily" ? titleFontPx(headline, px(38)) : px(30)

  const footer = `${displayName ? `${displayName} ・ ` : ""}アルコ ・ arcodaviolin.com`

  const stats: ReactElement[] = []
  if (kind === "master") {
    stats.push(<Stat key="s" value={`★${p.star ?? 1}`} label="レベル" color={C.gold} fs={px(24)} />)
    stats.push(<Stat key="a" value={String(p.attempts ?? 1)} unit="回" label="挑戦した回数" color={C.green} fs={px(24)} />)
  } else if (kind === "weekly") {
    stats.push(<Stat key="d" value={String(p.days ?? 0)} unit="日" label="練習した日数" color={C.gold} fs={px(24)} />)
    stats.push(<Stat key="r" value={String(p.recs ?? 0)} unit="回" label="録音した回数" color={C.green} fs={px(24)} />)
    stats.push(<Stat key="s" value={String(p.skills ?? 0)} unit="個" label="伸びたわざ" color={C.blue} fs={px(24)} />)
  } else if (kind === "daily") {
    stats.push(<Stat key="p" value={String(p.pitch ?? 0)} unit="点" label="音程" color={C.gold} fs={px(24)} />)
    stats.push(<Stat key="t" value={String(p.timing ?? 0)} unit="点" label="リズム" color={C.green} fs={px(24)} />)
    if (p.bestDelta != null) {
      stats.push(<Stat key="b" value={`+${p.bestDelta}`} label="自己ベスト更新" color={C.blue} fs={px(24)} />)
    } else {
      stats.push(<Stat key="n" value={String(p.attempts ?? 1)} unit="回目" label="挑戦" color={C.blue} fs={px(24)} />)
    }
  }

  const arcoSize = vertical ? Math.round(width * 0.38) : Math.round(height * 0.52)
  const arco = (
    <div style={{ display: "flex", position: "relative", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        display: "flex", position: "absolute",
        width: arcoSize * 1.35, height: arcoSize * 1.35, borderRadius: 9999,
        backgroundImage: `radial-gradient(circle, ${C.glow} 0%, rgba(255,255,255,0) 68%)`,
      }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={arcoDataUri(kind)} width={arcoSize} height={arcoSize} alt="" style={{ borderRadius: "50%" }} />
    </div>
  )

  const textCol = (align: "flex-start" | "center") => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: align, maxWidth: "100%" }}>
      <span style={{ fontSize: px(12), fontWeight: 900, color: C.eyebrow, letterSpacing: 2 }}>{eyebrowText}</span>
      <span style={{
        fontSize: headlineFs, fontWeight: 900, color: C.ink, lineHeight: 1.25,
        marginTop: px(2), marginBottom: px(10), textAlign: align === "center" ? "center" : "left",
      }}>
        {headline}
      </span>
      {kind === "rank_up" ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: align, gap: px(4) }}>
          {starsRow(p, px(24))}
          <span style={{ fontSize: px(12), fontWeight: 700, color: C.sub }}>レベルが 1つ 上がったよ</span>
        </div>
      ) : (
        <div style={{ display: "flex", gap: px(22) }}>{stats}</div>
      )}
      <span style={{ fontSize: px(11), fontWeight: 700, color: C.muted, marginTop: px(14) }}>{footer}</span>
    </div>
  )

  return (
    <div style={{
      display: "flex", width, height, position: "relative",
      backgroundImage: `linear-gradient(150deg, ${C.bgFrom}, ${C.bgTo})`,
      fontFamily: "NotoSansJP",
    }}>
      {/* 背景装飾: お祝い系=図形紙吹雪 / 報告系=五線譜 */}
      {celebration ? (
        CONFETTI.map((f, i) => (
          <div key={i} style={{
            display: "flex", position: "absolute",
            // undefined のキーを渡すと Satori が .trim() で落ちるため、存在するものだけ載せる
            ...(f.top != null ? { top: f.top } : {}),
            ...(f.bottom != null ? { bottom: f.bottom } : {}),
            ...(f.left != null ? { left: f.left } : {}),
            ...(f.right != null ? { right: f.right } : {}),
            width: Math.round(f.wf * k * 0.65), height: Math.round(f.hf * k * 0.65),
            backgroundColor: C.confetti[f.c], opacity: f.op,
            borderRadius: f.round ? 9999 : Math.round(2 * k * 0.65),
            transform: `rotate(${f.rot}deg)`,
          }} />
        ))
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={staffSvg(width, height)} width={width} height={height} alt=""
          style={{ position: "absolute", top: 0, left: 0 }} />
      )}

      {vertical ? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          width: "100%", height: "100%", gap: Math.round(height * 0.03),
        }}>
          {arco}
          {textCol("center")}
        </div>
      ) : (
        <div style={{
          display: "flex", alignItems: "center", width: "100%", height: "100%",
          paddingLeft: Math.round(width * 0.08), paddingRight: Math.round(width * 0.08),
          gap: Math.round(width * 0.05),
        }}>
          <div style={{ display: "flex", flex: 1, minWidth: 0 }}>{textCol("flex-start")}</div>
          {arco}
        </div>
      )}
    </div>
  )
}
