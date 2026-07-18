// 練習メニューのカテゴリアイコン (絵文字を色付きSVGタイルに置き換え)。
// カバーのカテゴリ色と揃える。
import styles from "./practice.module.css"

const TILE: Record<string, [string, string]> = {
  scale:          ["#16a99f", "#0c645d"],
  arpeggio:       ["#9a5fc8", "#573380"],
  fingering:      ["#3f78d4", "#24447e"],
  bowing:         ["#2e9866", "#1c6041"],
  position_shift: ["#d06a8e", "#8a3556"],
  double_stop:    ["#5b78c9", "#374a80"],
  etude:          ["#e0812f", "#9a4d18"],
  pieces:         ["#d64f77", "#992f52"],
  lessons:        ["#6b57cc", "#42328a"],
  _default:       ["#3f78d4", "#24447e"],
}

function Glyph({ cat }: { cat: string }) {
  const p = {
    fill: "none" as const,
    stroke: "#fff",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  }
  switch (cat) {
    case "scale":
      return <g {...p}><path d="M4 15c3 0 3-8 6-8s3 8 6 8" /><path d="M4 19h16" /></g>
    case "arpeggio":
      return <g {...p}><circle cx="6" cy="17" r="2.2" /><circle cx="18" cy="13" r="2.2" /><path d="M8.2 16.4 15.8 13M8 15V8l10-2.4V11" /></g>
    case "fingering":
      return <g {...p}><path d="M9 13V6a1.3 1.3 0 0 1 2.6 0v4M11.6 10V4.4a1.3 1.3 0 0 1 2.6 0V10M14.2 10.5V6.6a1.3 1.3 0 0 1 2.6 0V13a5 5 0 0 1-5 5 5 5 0 0 1-3.6-1.5L7 15a1.4 1.4 0 0 1 2-2l.8.8" /></g>
    case "bowing":
      return <g {...p}><path d="M3.5 20.5 20 4.5" /><path d="M18.4 3.2 21 5.8l-1.6 1.6" /><circle cx="4.6" cy="19.4" r="1.4" /></g>
    case "position_shift":
      return <g {...p}><path d="M3 12h18" /><path d="M7 8l-4 4 4 4" /><path d="M17 8l4 4-4 4" /></g>
    case "double_stop":
      return <g {...p}><path d="M6 4v16M12 4v16" /><circle cx="6" cy="9" r="2.1" fill="#fff" /><circle cx="12" cy="14" r="2.1" fill="#fff" /></g>
    case "etude":
      return <g {...p}><path d="M6 4v13" /><circle cx="6" cy="18.5" r="2.1" fill="#fff" /><path d="M11 8h7M11 12h7M11 16h4" /></g>
    case "lessons":
      return <g {...p}><path d="M3 8l9-4 9 4-9 4z" /><path d="M7 10.5V15c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-4.5" /></g>
    case "pieces":
    default:
      return <g {...p}><path d="M9 18V6l9-2v12" /><circle cx="6.5" cy="18" r="2.4" fill="#fff" /><circle cx="15.5" cy="16" r="2.4" fill="#fff" /></g>
  }
}

export default function PracticeCatIcon({ cat }: { cat: string }) {
  const [a, b] = TILE[cat] ?? TILE._default
  return (
    <span className={styles.catIconTile} style={{ background: `linear-gradient(145deg, ${a}, ${b})` }}>
      <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
        <Glyph cat={cat} />
      </svg>
    </span>
  )
}
