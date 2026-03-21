"use client"

import { useEffect, useRef } from "react"

type RingConfig = {
  r:        number
  color:    string
  bg:       string
  progress: number
}

type Props = {
  size:        number
  cx:          number
  cy:          number
  strokeWidth: number
  rings:       RingConfig[]
}

function AnimatedCircle({
  cx, cy, r, color, bg, progress, strokeWidth, delay,
}: RingConfig & { cx: number; cy: number; strokeWidth: number; delay: number }) {
  const circRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    const el = circRef.current
    if (!el) return
    const circ   = 2 * Math.PI * r
    const target = circ * (1 - Math.min(progress, 1))

    // Start fully hidden, animate to target
    el.style.strokeDasharray  = String(circ)
    el.style.strokeDashoffset = String(circ)

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReduced) {
      el.style.strokeDashoffset = String(target)
      return
    }

    const start  = performance.now() + delay
    const dur    = 900
    const from   = circ
    const to     = target

    let rafId: number
    const animate = (now: number) => {
      const elapsed = Math.max(0, now - start)
      const t = Math.min(elapsed / dur, 1)
      // ease-out cubic
      const ease = 1 - Math.pow(1 - t, 3)
      el.style.strokeDashoffset = String(from + (to - from) * ease)
      if (t < 1) rafId = requestAnimationFrame(animate)
    }
    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [r, progress, delay])

  const circ = 2 * Math.PI * r
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={bg} strokeWidth={strokeWidth} />
      <circle
        ref={circRef}
        cx={cx} cy={cy} r={r}
        fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    </g>
  )
}

export default function AnimatedRings({ size, cx, cy, strokeWidth, rings }: Props) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {rings.map((ring, i) => (
        <AnimatedCircle
          key={ring.r}
          {...ring}
          cx={cx}
          cy={cy}
          strokeWidth={strokeWidth}
          delay={i * 120}
        />
      ))}
    </svg>
  )
}
