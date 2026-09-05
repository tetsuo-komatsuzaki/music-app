"use client"
/**
 * PressButton — 「押して離したら必ず動く」ボタン (2026-09-05)。
 * usePress を <button> に包んだもの。iOS は指を 0.5 秒ほど置くと長押しと判断して click を成立させないので、
 * 録音・採点の流れにあるボタンはこれで描く (Recorder の 4 ボタンは usePress を直接使っている)。
 * onClick ではなく onPress を渡す。ref は usePress が使うため外から渡せない。
 */
import type { ButtonHTMLAttributes, ReactNode } from "react"
import { usePress } from "@/app/_libs/usePress"

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "type" | "ref"> & {
  onPress: () => void
  children?: ReactNode
}

export default function PressButton({ onPress, children, ...rest }: Props) {
  const press = usePress<HTMLButtonElement>(onPress)
  return (
    <button type="button" {...rest} {...press}>
      {children}
    </button>
  )
}
