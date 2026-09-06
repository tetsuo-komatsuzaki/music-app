"use client"
/**
 * GuestGate — 押した先の本物の画面を薄く見せ、その上に GateSheet を重ねる (2026-09-06 Tetsuo確定)。
 * 中身は最初から触れない (pointer-events: none)。「あとで」で閉じても中身は薄いままで、
 * 画面下の細い帯から再びシートを開ける。
 */
import type { ReactNode } from "react"
import GateSheet from "./GateSheet"
import type { GateItem } from "./gateText"
import styles from "./GateSheet.module.css"

export default function GuestGate({ title, items, children }: { title: string; items: GateItem[]; children: ReactNode }) {
  return (
    <>
      <div className={styles.muted} aria-hidden>{children}</div>
      <GateSheet title={title} items={items} laterMode="bar" />
    </>
  )
}
