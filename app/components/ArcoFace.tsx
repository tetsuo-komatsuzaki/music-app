import type { CSSProperties } from "react"

// アルコちゃんの顔（SVG）。ランクカード・ホーム等で再利用する共通パーツ。
export default function ArcoFace({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="8 32 184 134" role="img" aria-label="アルコちゃん">
      <path d="M 72.9,52.1 Q 48.4,39.0 20.9,36.8 Q 13.9,35.8 14.9,43.8 Q 19.8,65.6 37.6,87.4 Z" fill="#F2B266" />
      <path d="M 65.8,59.2 Q 51.4,51.1 31.0,49.1 Q 34.8,67.7 44.7,80.3 Z" fill="#A8622E" />
      <path d="M 127.1,52.1 Q 151.6,39.0 179.1,36.8 Q 186.1,35.8 185.1,43.8 Q 180.2,65.6 162.4,87.4 Z" fill="#F2B266" />
      <path d="M 134.2,59.2 Q 148.6,51.1 169.0,49.1 Q 165.2,67.7 155.3,80.3 Z" fill="#A8622E" />
      <ellipse cx="100" cy="103" rx="65" ry="56" fill="#F2B266" />
      <path d="M 62,101 q 8,-3.5 16,-2" stroke="#4A2A18" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 138,101 q -8,-3.5 -16,-2" stroke="#4A2A18" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="70.5" cy="122" r="12" fill="#4A2A18" /><circle cx="129.5" cy="122" r="12" fill="#4A2A18" />
      <circle cx="74.5" cy="118" r="3.6" fill="#FFF" /><circle cx="133.5" cy="118" r="3.6" fill="#FFF" />
      <ellipse cx="51" cy="135" rx="9" ry="5.5" fill="#F79E8D" opacity="0.85" /><ellipse cx="149" cy="135" rx="9" ry="5.5" fill="#F79E8D" opacity="0.85" />
      <path d="M 90,140 q 10,10 20,0" stroke="#5C3A21" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  )
}
