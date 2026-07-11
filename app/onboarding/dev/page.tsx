"use client"

// /onboarding/dev (指示書の_devはNext.jsが_プレフィックスを非ルート扱いするため改名) — C1 確認ページ (全コンポーネント・全状態・全ポーズ)
// 指示書 C1 の検証用。本番フローからはリンクしない。

import { useState } from "react"
import styles from "../onboarding.module.css"
import OptionCard from "../_components/OptionCard"
import CtaButton from "../_components/CtaButton"
import ProgressBar, {
  EMPTY_PROGRESS,
  type ProgressState,
} from "../_components/ProgressBar"
import AvatarBubble from "../_components/AvatarBubble"
import {
  ArcoChan,
  POSES,
  POSE_KEY_MAP,
  type ArcoPoseKey,
} from "../_components/ArcoChan"

const SECTIONS = ["カード", "CTA/バー", "吹き出し", "ポーズ9", "全30"] as const
type Section = (typeof SECTIONS)[number]

export default function DevPage() {
  const [section, setSection] = useState<Section>("カード")
  const [sel, setSel] = useState<string | null>(null)
  const [checks, setChecks] = useState<Set<string>>(new Set())
  const [seg, setSeg] = useState<ProgressState>({ ...EMPTY_PROGRESS, Q2: 1, ladder: 0.4 })

  const toggle = (k: string) => {
    setChecks((prev) => {
      const n = new Set(prev)
      if (n.has(k)) n.delete(k)
      else n.add(k)
      return n
    })
  }

  return (
    <div style={{ position: "absolute", inset: 0, overflowY: "auto", padding: "3% 4% 10%" }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {SECTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setSection(s)}
            style={{
              padding: "6px 10px", borderRadius: 8, fontFamily: "inherit", fontWeight: 700,
              border: section === s ? "2px solid #58CC02" : "1px solid #E5E5E5",
              background: "#fff", fontSize: 12, cursor: "pointer",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {section === "カード" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.6cqh" }}>
          <div className={styles.shead}>(a) アイコン+ラベル</div>
          <OptionCard icon="🎬" label="映画・アニメの曲" selected={sel === "a"} onClick={() => setSel("a")} />
          <div className={styles.shead}>(b) ラベルのみ</div>
          <OptionCard label="これから始める" selected={sel === "b"} onClick={() => setSel("b")} />
          <div className={styles.shead}>(c) ラベル+右補助</div>
          <OptionCard label="15分 / 日" sub="しっかり" selected={sel === "c"} onClick={() => setSel("c")} />
          <div className={styles.shead}>(d) 複数選択</div>
          <OptionCard label="トリル" checkbox checked={checks.has("トリル")} onClick={() => toggle("トリル")} />
          <div className={styles.shead}>2行拡張 (8.7%H)</div>
          <OptionCard
            label="スピッカート"
            desc="弓を弦の上で跳ねさせる"
            checkbox
            checked={checks.has("スピッカート")}
            onClick={() => toggle("スピッカート")}
          />
          <div className={styles.shead}>曲選択 (a型+★補助)</div>
          <OptionCard label="カノン(パッヘルベル)" sub="⭐︎2" selected={sel === "song"} onClick={() => setSel("song")} />
        </div>
      )}

      {section === "CTA/バー" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2.4cqh" }}>
          <div className={styles.shead}>ProgressBar (7セグメント・ラダー按分)</div>
          <div style={{ position: "relative", height: "2.4cqh" }}>
            <div className={styles.pbar} style={{ position: "relative", inset: "auto", left: 0, right: 0, top: 0, height: "1.8cqh" }}>
              <ProgressBar seg={seg} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(["Q2", "ladder", "Q3", "Q4", "Q5", "Q6", "goal"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setSeg((p) => ({ ...p, [k]: p[k] >= 1 ? 0 : Math.min(1, p[k] + 0.2) }))}
                style={{ fontSize: 11, padding: "4px 8px", fontFamily: "inherit", border: "1px solid #E5E5E5", borderRadius: 6, background: "#fff", cursor: "pointer" }}
              >
                {k}: {seg[k].toFixed(1)}
              </button>
            ))}
          </div>
          <div className={styles.shead}>CTA enabled / disabled / ghost</div>
          <button className={styles.cta}>次へ</button>
          <button className={styles.cta} disabled>次へ</button>
          <button className={`${styles.cta} ${styles.ctaGhost}`}>アカウント登録済み</button>
        </div>
      )}

      {section === "吹き出し" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "3cqh" }}>
          <div className={styles.shead}>side型 (質問画面共通)</div>
          <div style={{ position: "relative", height: "18cqh" }}>
            <AvatarBubble poseKey="question">バイオリンはどのくらい弾いてる?</AvatarBubble>
          </div>
          <div className={styles.shead}>center+下しっぽ / center+上しっぽ</div>
          <AvatarBubble variant="center" tail="down">こんにちは!アルコだよ!</AvatarBubble>
          <AvatarBubble variant="center" tail="up">
            最初の練習をはじめる前に、<b>7つのかんたんなステップ</b>に答えてね!(約1分)
          </AvatarBubble>
        </div>
      )}

      {section === "ポーズ9" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {(Object.keys(POSE_KEY_MAP) as ArcoPoseKey[]).map((k) => (
            <div key={k} style={{ border: "1px solid #E5E5E5", borderRadius: 10, padding: 4, textAlign: "center" }}>
              <ArcoChan poseKey={k} />
              <div style={{ fontSize: 11, fontWeight: 700 }}>{k}</div>
              <div style={{ fontSize: 9, color: "#777" }}>{POSE_KEY_MAP[k]}</div>
            </div>
          ))}
        </div>
      )}

      {section === "全30" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {POSES.map((p) => (
            <div key={p.id} style={{ border: "1px solid #E5E5E5", borderRadius: 10, padding: 4, textAlign: "center" }}>
              <ArcoChan pose={p} />
              <div style={{ fontSize: 10, fontWeight: 700 }}>
                {p.id} {p.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
