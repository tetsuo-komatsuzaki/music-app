"use client"

// 課題曲設定のマトリクスUI (admin・2026-09-01)。
// 行=わざ、★1〜5の各セルにセレクト。候補=その★の曲 (タグ一致を上グループに)。
// 保存は即時 (onChange→server action)。
import { useState, useTransition } from "react"
import Link from "next/link"
import ds from "@/app/components/ds.module.css"
import { setSkillMasterySong } from "@/app/actions/skillMasterySongs"

type Skill = { id: string; label: string; lane: "bow" | "left"; tagType: string; tagKeys: string[] }
type ScoreOpt = { id: string; title: string; star: number; tags: string[] }
type Mapping = { skillId: string; star: number; scoreId: string }

const STARS = [1, 2, 3, 4, 5]

export default function SkillSongsClient({ userId, skills, scores, mappings }: {
  userId: string
  skills: Skill[]
  scores: ScoreOpt[]
  mappings: Mapping[]
}) {
  const [map, setMap] = useState(() => new Map(mappings.map((m) => [`${m.skillId}:${m.star}`, m.scoreId])))
  const [err, setErr] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const candidates = (skill: Skill, star: number) => {
    const inStar = scores.filter((s) => s.star === star)
    if (skill.tagType !== "technique" || skill.tagKeys.length === 0) return { tagged: inStar, rest: [] }
    const tagged = inStar.filter((s) => s.tags.some((t) => skill.tagKeys.includes(t)))
    const taggedIds = new Set(tagged.map((s) => s.id))
    return { tagged, rest: inStar.filter((s) => !taggedIds.has(s.id)) }
  }

  const change = (skillId: string, star: number, scoreId: string) => {
    const key = `${skillId}:${star}`
    const prev = map.get(key) ?? ""
    setMap((m) => { const n = new Map(m); if (scoreId) n.set(key, scoreId); else n.delete(key); return n })
    setErr(null)
    startTransition(async () => {
      const r = await setSkillMasterySong({ skillId, star, scoreId: scoreId || null })
      if (!r.ok) {
        setErr(`${skillId} ★${star}: ${r.error}`)
        setMap((m) => { const n = new Map(m); if (prev) n.set(key, prev); else n.delete(key); return n })
      }
    })
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "10px 14px 60px" }}>
      <Link href={`/${userId}/admin/practice`} style={{ fontSize: 11.5, fontWeight: 800, color: "var(--text-sub)", textDecoration: "none" }}>‹ 教材管理へ</Link>
      <h1 className={ds.t}>わざマスターの課題曲</h1>
      <p style={{ fontSize: 11.5, color: "var(--text-sub)", lineHeight: 1.8, margin: "4px 0 14px" }}>
        わざ×★ごとに「この曲をマスターしたら そのわざの★nマスター」となる課題曲を指定します。
        候補はその★の曲のみ。技術タグが一致する曲が上のグループに出ます。空にすると指定解除。
      </p>
      {err && <div style={{ fontSize: 11.5, color: "#e8a78f", fontWeight: 800, marginBottom: 10 }}>{err}</div>}

      {(["bow", "left"] as const).map((lane) => (
        <div key={lane} style={{ marginTop: 16 }}>
          <div className={ds.lab}>{lane === "bow" ? "弓のわざ" : "左手のわざ"}</div>
          {skills.filter((s) => s.lane === lane).map((skill) => (
            <div key={skill.id} className={ds.card} style={{ padding: "11px 13px", marginTop: 8 }}>
              <b style={{ fontSize: 13, color: "var(--text-ink)" }}>{skill.label}</b>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8, marginTop: 8 }}>
                {STARS.map((star) => {
                  const key = `${skill.id}:${star}`
                  const val = map.get(key) ?? ""
                  const { tagged, rest } = candidates(skill, star)
                  return (
                    <label key={star} style={{ display: "block" }}>
                      <span style={{ fontSize: 9.5, fontWeight: 900, color: val ? "var(--gold)" : "var(--text-muted)" }}>★{star}</span>
                      <select
                        value={val}
                        disabled={pending}
                        onChange={(e) => change(skill.id, star, e.target.value)}
                        style={{
                          width: "100%", marginTop: 3, fontSize: 11, fontWeight: 700, padding: "6px 6px",
                          background: "var(--card-in)", color: "var(--text-ink)",
                          border: `1px solid ${val ? "rgba(232,178,60,.45)" : "rgba(150,175,225,.2)"}`, borderRadius: 8,
                        }}
                      >
                        <option value="">指定なし</option>
                        {tagged.length > 0 && (
                          <optgroup label="タグ一致">
                            {tagged.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                          </optgroup>
                        )}
                        {rest.length > 0 && (
                          <optgroup label={tagged.length > 0 ? "その他の曲" : "この★の曲"}>
                            {rest.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                          </optgroup>
                        )}
                      </select>
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
