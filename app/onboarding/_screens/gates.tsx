"use client"

// ゲート共通部品 (C2) — YES/NO と複数選択。
// YES/NO: タップ→300ms選択色ハイライト→自動遷移(承認③代替案b・CTAなし)
// 複数選択: 「次へ」確定制。0選択でも進行可能(=不通過判定)。
//           最下部「どれもまだできない」は選択をクリアして即確定。

import { useState } from "react"
import styles from "../onboarding.module.css"
import OptionCard from "../_components/OptionCard"
import CtaButton from "../_components/CtaButton"
import AvatarBubble from "../_components/AvatarBubble"

export function YesNoGate({
  question,
  yesLabel = "はい、できる",
  noLabel = "まだできない",
  onAnswer,
}: {
  question: string
  yesLabel?: string
  noLabel?: string
  onAnswer: (v: boolean) => void
}) {
  const [picked, setPicked] = useState<boolean | null>(null)

  const pick = (v: boolean) => {
    if (picked !== null) return
    setPicked(v)
    setTimeout(() => onAnswer(v), 300)
  }

  return (
    <>
      <AvatarBubble poseKey="question">{question}</AvatarBubble>
      <div className={styles.list}>
        <OptionCard label={yesLabel} forceSelected={picked === true} onClick={() => pick(true)} />
        <OptionCard label={noLabel} forceSelected={picked === false} onClick={() => pick(false)} />
      </div>
    </>
  )
}

export function MultiGate({
  question,
  options,
  noneLabel,
  onConfirm,
}: {
  question: string
  options: Array<{ value: string; desc?: string }>
  /** 「どれもまだできない」等。タップで選択クリア+即確定 */
  noneLabel: string
  onConfirm: (selected: string[]) => void
}) {
  const [checks, setChecks] = useState<Set<string>>(new Set())
  const [nonePicked, setNonePicked] = useState(false)

  const toggle = (v: string) => {
    if (nonePicked) return
    setChecks((prev) => {
      const n = new Set(prev)
      if (n.has(v)) n.delete(v)
      else n.add(v)
      return n
    })
  }

  const pickNone = () => {
    if (nonePicked) return
    setNonePicked(true)
    setChecks(new Set())
    setTimeout(() => onConfirm([]), 300)
  }

  return (
    <>
      <AvatarBubble poseKey="listen">{question}</AvatarBubble>
      <div className={styles.list}>
        {options.map((o) => (
          <OptionCard
            key={o.value}
            label={o.value}
            desc={o.desc}
            checkbox
            checked={checks.has(o.value)}
            onClick={() => toggle(o.value)}
          />
        ))}
        <OptionCard label={noneLabel} forceSelected={nonePicked} onClick={pickNone} />
      </div>
      <CtaButton label="次へ" divider onClick={() => onConfirm([...checks])} />
    </>
  )
}
