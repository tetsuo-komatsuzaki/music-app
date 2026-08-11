import type { BodyViewId } from "@/app/_libs/bodyMap"
import BodyFigureZenshin, { ZENSHIN_VIEWBOX } from "./BodyFigureZenshin"

// 癖の人体マップ用イラスト (線画SVG)。モックv2 (1349ea3b) の構図。
// 座標系は app/_libs/bodyMap.ts の部位 % 座標と対応 (viewBox を変えるときは両方直す)。

const INK = "#8b7d6b" // 線
const SKIN = "#f7efe2" // 面
const WOOD = "#c9a87c" // 楽器
const WOOD_D = "#a9825a"

export const BODY_VIEWBOX: Record<BodyViewId, string> = {
  body: ZENSHIN_VIEWBOX, // 2026-08-11 差し替え (正面+よこ・アンカー検証済)
  left_out: "0 0 240 190",
  left_in: "0 0 240 190",
  bow_frog: "0 0 240 190",
  bow_tip: "0 0 240 190",
  strings: "0 0 240 140",
}

export default function BodyFigure({ view, className }: { view: BodyViewId; className?: string }) {
  // 全身は新イラスト (2026-08-11 Tetsuo提供ジェネレータ) に差し替え。他ビューは従来線画
  if (view === "body") return <BodyFigureZenshin className={className} />
  const common = {
    className,
    viewBox: BODY_VIEWBOX[view],
    width: "100%",
    style: { display: "block", height: "auto" } as const,
    fill: "none",
    stroke: INK,
    strokeWidth: 2.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  }

  // 旧・全身線画は削除 (2026-08-11 新イラストへ差し替え済)
  if (view === "left_out") {
    // 指板を右側から見る: 指のかたちが主役
    return (
      <svg {...common} role="img" aria-label="左手を指板の右側から見た図">
        {/* ネック+指板 */}
        <g stroke={WOOD_D}>
          <rect x={96} y={12} width={30} height={168} rx={6} fill={WOOD} />
          <rect x={104} y={12} width={14} height={168} rx={4} fill="#5d4a38" stroke="none" />
        </g>
        {/* 弦 */}
        <path d="M108 14 L108 178 M114 14 L114 178" strokeWidth={1.2} stroke="#e8ddc8" />
        {/* 手のひら (右奥から) */}
        <path d="M150 120 Q186 116 196 86 Q200 66 184 58 Q166 52 152 62 L140 74 Q132 96 138 112 Q142 120 150 120 Z" fill={SKIN} />
        {/* 腕 */}
        <path d="M158 122 Q176 150 186 178" />
        {/* 指1〜4 (弦上へ丸く) */}
        <path d="M146 62 Q126 52 116 44" />
        <circle cx={115} cy={42} r={6} fill={SKIN} />
        <path d="M150 72 Q128 66 117 58" />
        <circle cx={116} cy={57} r={6} fill={SKIN} />
        <path d="M150 84 Q130 80 118 74" />
        <circle cx={117} cy={72} r={6} fill={SKIN} />
        <path d="M148 96 Q132 94 120 88" />
        <circle cx={119} cy={87} r={5.5} fill={SKIN} />
      </svg>
    )
  }

  if (view === "left_in") {
    // 指板を左側から見る: 手首・親指が主役
    return (
      <svg {...common} role="img" aria-label="左手を指板の左側から見た図">
        <g stroke={WOOD_D}>
          <rect x={112} y={12} width={30} height={168} rx={6} fill={WOOD} />
          <rect x={120} y={12} width={14} height={168} rx={4} fill="#5d4a38" stroke="none" />
        </g>
        {/* ネックを支える親指 */}
        <path d="M100 66 Q92 52 102 46 Q112 42 116 54 L116 66 Z" fill={SKIN} />
        {/* 手のひら (手前) */}
        <path d="M64 108 Q60 78 84 66 Q104 58 112 72 L112 104 Q96 120 78 118 Q68 116 64 108 Z" fill={SKIN} />
        {/* 手首→腕: 折れやすいポイント */}
        <path d="M76 118 Q68 140 72 160 Q76 176 88 182" />
        <path d="M96 120 Q92 142 96 160" />
        {/* 手首の注意ライン */}
        <path d="M64 132 Q80 128 100 132" strokeDasharray="4 4" stroke="#c98f5f" strokeWidth={1.8} />
      </svg>
    )
  }

  if (view === "bow_frog" || view === "bow_tip") {
    const frog = view === "bow_frog"
    // 弓は左(元)→右(先)。元弓=手が左寄り・肘が畳まれる / 先弓=手が右寄り・腕が伸びる
    return (
      <svg {...common} role="img" aria-label={frog ? "右手・元弓" : "右手・先弓"}>
        {/* 弦(縦・簡略) */}
        <path d="M120 16 L120 174 M132 16 L132 174" strokeWidth={1.4} stroke="#cbbfa8" />
        {/* 弓 */}
        <g stroke={WOOD_D}>
          <path d="M22 84 L218 76" strokeWidth={3.5} />
          <rect x={frog ? 26 : 190} y={frog ? 78 : 70} width={16} height={12} rx={2} fill="#4c3b2c" stroke="none" />
        </g>
        {frog ? (
          <g>
            {/* 手 (元弓: フロッグ上) */}
            <path d="M84 66 Q104 58 112 72 Q116 84 104 92 Q88 98 78 88 Q74 74 84 66 Z" fill={SKIN} />
            <path d="M86 90 Q78 84 72 86 M94 94 Q88 90 82 92" strokeWidth={2} />
            {/* 腕: 手→肘(低め・畳む)→肩(右上へ) */}
            <path d="M82 94 Q56 110 42 142 Q60 150 78 146 Q96 122 104 96" fill={SKIN} />
            <path d="M44 144 Q30 132 26 118" strokeDasharray="4 4" stroke="#c98f5f" strokeWidth={1.8} />
          </g>
        ) : (
          <g>
            {/* 手 (先弓: 先端寄り) */}
            <path d="M172 68 Q192 62 200 74 Q204 86 192 94 Q176 100 168 90 Q164 76 172 68 Z" fill={SKIN} />
            {/* 腕: 伸びるライン (肘は中央下) */}
            <path d="M170 92 Q136 116 108 146 Q124 156 140 152 Q166 122 186 98" fill={SKIN} />
            {/* 小指・手首のしなり */}
            <path d="M196 66 Q202 58 210 56" strokeWidth={2} />
            <path d="M110 148 Q96 142 88 132" strokeDasharray="4 4" stroke="#c98f5f" strokeWidth={1.8} />
          </g>
        )}
      </svg>
    )
  }

  // strings: 弓と弦の接点 (上=指板 / 下=駒)
  return (
    <svg {...common} role="img" aria-label="弦の上・弓と弦の接点">
      {/* 指板の端 (上) */}
      <path d="M60 10 L180 10 L172 34 L68 34 Z" fill="#5d4a38" stroke={WOOD_D} />
      {/* 駒 (下) */}
      <path d="M84 112 Q120 96 156 112 L152 128 L88 128 Z" fill={WOOD} stroke={WOOD_D} />
      {/* 弦4本 */}
      <path d="M92 34 L96 112 M108 34 L110 112 M126 34 L128 112 M142 34 L146 112" strokeWidth={1.6} stroke="#e8ddc8" />
      {/* 弓 (接点を横切る) */}
      <g stroke={WOOD_D}>
        <path d="M20 72 L224 62" strokeWidth={4} />
        <path d="M20 78 L224 68" strokeWidth={1.4} opacity={0.6} />
      </g>
      {/* 通り道ゾーン (指板寄り⇄駒寄り) */}
      <path d="M64 46 L176 40 M74 100 L168 96" strokeDasharray="4 5" strokeWidth={1.4} stroke="#c98f5f" />
      <text x={184} y={48} fontSize={10} fill={INK} stroke="none">指板寄り</text>
      <text x={176} y={102} fontSize={10} fill={INK} stroke="none">駒寄り</text>
    </svg>
  )
}
