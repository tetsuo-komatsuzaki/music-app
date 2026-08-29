"use client"

// dev専用: アルコのクエスト ボードのプレビュー (本番導線からは参照されない)
import QuestBoard from "@/app/[userId]/_guide/QuestBoard"

export default function QuestDemoPage() {
  return (
    <div style={{ maxWidth: 402, margin: "0 auto", minHeight: "100dvh", padding: "20px 18px 60px", background: "var(--bg, #0a1122)" }}>
      <QuestBoard progress={{ first_loop: { doneAt: "2026-08-29" } }} />
    </div>
  )
}
