import type { BodyViewId } from "@/app/_libs/bodyMap"

// 癖の人体マップ用イラスト。2026-08-13 全ビューをTetsuo提供のラスターイラストに統一。
// ピン座標は app/_libs/bodyMap.ts の部位 % 座標と対応 (画像を変えるときは両方直す)。

export const BODY_VIEWBOX: Record<BodyViewId, string> = {
  body: "raster", // standing.webp 900x1203
  left_out: "raster", // left-out.webp 1000x750
  left_in: "raster", // left-in.webp 1000x800
  bow_frog: "raster", // frog-pose.webp 1000x667
  bow_tip: "raster", // tip-pose.webp 1000x667
  bow_hold: "raster", // bow-hold.webp 1000x585
  strings: "raster", // violin-top.webp 1000x1000
}

const SRC: Record<BodyViewId, { src: string; alt: string }> = {
  body: { src: "/body/standing.webp", alt: "立ち姿" },
  left_out: { src: "/body/left-out.webp", alt: "左手・右" },
  left_in: { src: "/body/left-in.webp", alt: "左手・左" },
  bow_frog: { src: "/body/frog-pose.webp", alt: "元弓のポーズ" },
  bow_tip: { src: "/body/tip-pose.webp", alt: "先弓のポーズ" },
  bow_hold: { src: "/body/bow-hold.webp", alt: "弓の持ち方" },
  strings: { src: "/body/violin-top.webp", alt: "バイオリン上部" },
}

export default function BodyFigure({ view, className }: { view: BodyViewId; className?: string }) {
  const { src, alt } = SRC[view]
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} style={{ display: "block", width: "100%", height: "auto", borderRadius: 6 }} />
}
