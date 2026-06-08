// app/components/ProgressGuideModal.tsx
//
// 「上達のしくみ」ガイドモーダル。ホームのグレードバッジ横ボタンから開く。
// ランク/曲マスター/課題/練習教材の関係を 1 か所で説明する
// (思想: [[project_clear_master_philosophy]] + ★昇格=同★を10曲マスター)。

"use client"

type Props = {
  open: boolean
  onClose: () => void
}

const STEPS: { n: string; text: string }[] = [
  { n: "1", text: "曲を弾く（録音する）" },
  { n: "2", text: "あなたの弱点＝「課題」が見つかる" },
  { n: "3", text: "課題の練習教材をクリアする → 課題クリア" },
  { n: "4", text: "全部の課題クリア ＋ 演奏スコア90点 → 🏆 曲マスター" },
  { n: "5", text: "いまのレベル（★）の曲を10曲マスター → ★が1つ上がる" },
  { n: "6", text: "★が上がると ランク（初級者→中級者→上級者→マスター）アップ" },
]

const TERMS: { term: string; desc: string }[] = [
  { term: "課題", desc: "演奏で見つかったあなたの弱点（例：移弦、休符後の入り）。" },
  { term: "練習教材", desc: "課題を克服する基礎練習・エチュード。クリアすると課題が消えます。" },
  { term: "演奏スコア", desc: "その曲の出来。音程とリズムの正確さの平均点。" },
  { term: "曲マスター🏆", desc: "その曲の全課題クリア＋直近5回の演奏スコア90点以上。" },
  { term: "★（レベル）", desc: "曲の難易度。同じ★の曲を10曲マスターすると次の★に進みます。" },
  { term: "ランク", desc: "★に応じた称号（初級者／中級者／上級者／マスター）。" },
]

export default function ProgressGuideModal({ open, onClose }: Props) {
  if (!open) return null
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 1000,
      }}
      role="dialog"
      aria-modal="true"
      aria-label="上達のしくみ"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 16,
          maxWidth: 480,
          width: "100%",
          maxHeight: "85vh",
          overflowY: "auto",
          padding: "20px 18px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>🎯 上達のしくみ</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            style={{
              border: "none",
              background: "transparent",
              fontSize: 22,
              lineHeight: 1,
              cursor: "pointer",
              color: "#888",
              padding: 4,
            }}
          >
            ×
          </button>
        </div>

        <p style={{ fontSize: 13, color: "#555", margin: "0 0 14px" }}>
          演奏 → 弱点克服 → 曲マスター → レベルアップ、の流れで上達していきます。
        </p>

        {/* ループのステップ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
          {STEPS.map((s) => (
            <div key={s.n} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span
                style={{
                  flex: "0 0 auto",
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "#4a90d9",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {s.n}
              </span>
              <span style={{ fontSize: 14, lineHeight: 1.5, color: "#33475b" }}>{s.text}</span>
            </div>
          ))}
        </div>

        {/* 用語集 */}
        <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 8px", color: "#33475b" }}>用語</h3>
        <dl style={{ margin: 0 }}>
          {TERMS.map((t) => (
            <div key={t.term} style={{ marginBottom: 8 }}>
              <dt style={{ fontSize: 13, fontWeight: 700, color: "#222" }}>{t.term}</dt>
              <dd style={{ fontSize: 13, color: "#555", margin: "2px 0 0", lineHeight: 1.5 }}>
                {t.desc}
              </dd>
            </div>
          ))}
        </dl>

        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: 16,
            width: "100%",
            padding: "10px 0",
            borderRadius: 10,
            border: "none",
            background: "#4a90d9",
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          とじる
        </button>
      </div>
    </div>
  )
}
