"use client"

// 設定「🎯 目標」カード (2026-08-02)。オンボーディングで答えた目標(目標曲/時期/
// かなえたいこと)をあとから変更できる。曲はオンボと同じ候補リストから選択。
import { useEffect, useMemo, useState, useTransition } from "react"
import { Target, Calendar, Sparkles } from "lucide-react"
import { getGoalOptions, getMyGoal, saveMyGoal, type GoalSongOption, type MyGoal } from "@/app/actions/updateGoal"
import styles from "./Settings.module.css"

const CAT_LABEL: Record<string, string> = {
  movie: "映画・アニメ",
  classic: "クラシック",
  season: "季節・定番",
}

export default function GoalCard() {
  const [goal, setGoal] = useState<MyGoal | null>(null)
  const [options, setOptions] = useState<GoalSongOption[]>([])
  const [editing, setEditing] = useState(false)
  const [songKey, setSongKey] = useState("") // `${category}|${name}`
  const [goalDate, setGoalDate] = useState("")
  const [epicWin, setEpicWin] = useState("")
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, start] = useTransition()

  useEffect(() => {
    getMyGoal().then((r) => { if (r.ok) setGoal(r.goal) }).catch(() => {})
  }, [])

  const grouped = useMemo(() => {
    const m = new Map<string, GoalSongOption[]>()
    for (const o of options) {
      const arr = m.get(o.category)
      if (arr) arr.push(o)
      else m.set(o.category, [o])
    }
    return m
  }, [options])

  const openEdit = () => {
    setMsg(null)
    setSongKey(goal?.songCategory && goal.songName ? `${goal.songCategory}|${goal.songName}` : "")
    setGoalDate(goal?.goalDate ?? "")
    setEpicWin(goal?.epicWin ?? "")
    setEditing(true)
    if (options.length === 0) {
      getGoalOptions().then((r) => { if (r.ok) setOptions(r.options) }).catch(() => {})
    }
  }

  const save = () => {
    const [category, name] = songKey.split("|")
    if (!category || !name) { setMsg({ ok: false, text: "目標曲を選んでください" }); return }
    start(async () => {
      const r = await saveMyGoal({ songCategory: category, songName: name, goalDate, epicWin })
      if (r.ok) {
        const star = options.find((o) => o.category === category && o.name === name)?.star ?? null
        setGoal({ songCategory: category, songName: name, songStar: star, goalDate: goalDate || null, epicWin: epicWin || null })
        setEditing(false)
        setMsg({ ok: true, text: "目標を更新しました" })
      } else {
        setMsg({ ok: false, text: r.error })
      }
    })
  }

  const inp: React.CSSProperties = { width: "100%", border: "1px solid #dfe3e8", borderRadius: 9, padding: "9px 12px", fontSize: "var(--fs-body)", marginTop: 5 }
  const lbl: React.CSSProperties = { fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-ink)", display: "block", marginTop: 12 }

  return (
    <section className={styles.card}>
      <h2 className={styles.sectionTitle} style={{ display: "flex", alignItems: "center", gap: 6 }}><Target size={16} /> 目標</h2>

      {!editing ? (
        <>
          {goal?.songName ? (
            <div>
              <div style={{ fontSize: "var(--fs-subhead)", fontWeight: 800, color: "var(--text-ink)" }}>
                {goal.songName}
                {goal.songStar != null && <span style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-master)", marginLeft: 6 }}>★{goal.songStar}</span>}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 5, fontSize: "var(--fs-body)", color: "var(--text-sub)" }}>
                {goal.goalDate && <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Calendar size={12} /> {goal.goalDate}</span>}
                {goal.epicWin && <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Sparkles size={12} /> {goal.epicWin}</span>}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: "var(--fs-body)", color: "var(--text-sub)" }}>目標が未設定です。目標を決めると、ホームのおすすめや先生への共有に使われます。</div>
          )}
          <button type="button" onClick={openEdit}
            style={{ marginTop: 10, fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-ink)", background: "#fff", border: "1px solid #dfe3e8", borderRadius: 9, padding: "8px 14px", cursor: "pointer" }}>
            {goal?.songName ? "目標を変更" : "目標を設定"}
          </button>
        </>
      ) : (
        <div>
          <label style={{ ...lbl, marginTop: 0 }}>目標曲
            <select value={songKey} onChange={(e) => setSongKey(e.target.value)} style={inp}>
              <option value="">選択してください</option>
              {[...grouped.entries()].map(([cat, items]) => (
                <optgroup key={cat} label={CAT_LABEL[cat] ?? cat}>
                  {items.map((o) => (
                    <option key={`${o.category}|${o.name}`} value={`${o.category}|${o.name}`}>★{o.star} {o.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            {options.length === 0 && <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", marginTop: 4 }}>候補を読み込み中…</div>}
          </label>
          <label style={lbl}>目標時期（任意）
            <input value={goalDate} onChange={(e) => setGoalDate(e.target.value)} placeholder="例: 2026年12月 / 発表会まで" style={inp} maxLength={40} />
          </label>
          <label style={lbl}>かなえたいこと（任意）
            <input value={epicWin} onChange={(e) => setEpicWin(e.target.value)} placeholder="例: 家族の前で最後まで弾く" style={inp} maxLength={200} />
          </label>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button type="button" onClick={() => setEditing(false)}
              style={{ flex: 1, fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-sub)", background: "#fff", border: "1px solid #e2e6ea", borderRadius: 9, padding: 10, cursor: "pointer" }}>キャンセル</button>
            <button type="button" onClick={save} disabled={pending}
              style={{ flex: 2, fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-on-accent)", background: "#2b3742", border: "none", borderRadius: 9, padding: 10, cursor: "pointer", opacity: pending ? 0.6 : 1 }}>
              {pending ? "保存中…" : "保存する"}
            </button>
          </div>
        </div>
      )}

      {msg && <div style={{ fontSize: "var(--fs-body)", marginTop: 8, color: msg.ok ? "#2e8b57" : "#c0392b" }}>{msg.text}</div>}
    </section>
  )
}
