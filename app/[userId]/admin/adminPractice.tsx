"use client"

import { useState } from "react"
import styles from "./admin.module.css"

type TechniqueOption = { id: string; category: string; name: string; nameEn: string | null }
type ItemDTO = {
  id: string; category: string; title: string; composer: string | null
  difficulty: number; keyTonic: string; keyMode: string
  tempoMin: number | null; tempoMax: number | null; positions: string[]
  isPublished: boolean; analysisStatus: string; buildStatus: string
  techniques: { id: string; name: string; isPrimary: boolean }[]
}

type Props = {
  items: ItemDTO[]
  tagsByCategory: Record<string, TechniqueOption[]>
  uploadAction: (formData: FormData) => Promise<any>
}

const categoryLabels: Record<string, string> = { scale: "音階", arpeggio: "アルペジオ", etude: "エチュード" }
const modeLabels: Record<string, string> = { major: "長調", minor: "短調" }
const positionOptions = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"]
const tonicOptions = ["C", "C#", "Db", "D", "Eb", "E", "F", "F#", "Gb", "G", "Ab", "A", "Bb", "B"]

export default function AdminPractice({ items, tagsByCategory, uploadAction }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState("")

  // フォーム state
  const [title, setTitle] = useState("")
  const [composer, setComposer] = useState("")
  const [category, setCategory] = useState<string>("scale")
  const [difficulty, setDifficulty] = useState(1)
  const [keyTonic, setKeyTonic] = useState("G")
  const [keyMode, setKeyMode] = useState("major")
  const [tempoMin, setTempoMin] = useState("")
  const [tempoMax, setTempoMax] = useState("")
  const [positions, setPositions] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<{ id: string; isPrimary: boolean }[]>([])
  const [description, setDescription] = useState("")
  const [descriptionShort, setDescriptionShort] = useState("")
  const [file, setFile] = useState<File | null>(null)

  const togglePosition = (pos: string) => {
    setPositions((prev) => prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos])
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) => {
      const exists = prev.find((t) => t.id === tagId)
      if (exists) return prev.filter((t) => t.id !== tagId)
      return [...prev, { id: tagId, isPrimary: false }]
    })
  }

  const togglePrimary = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.map((t) => t.id === tagId ? { ...t, isPrimary: !t.isPrimary } : t)
    )
  }

  const handleSubmit = async () => {
    if (!file) { setMessage("MusicXMLファイルを選択してください"); return }
    if (!title) { setMessage("タイトルを入力してください"); return }

    setSubmitting(true)
    setMessage("")

    const formData = new FormData()
    formData.set("file", file)
    formData.set("title", title)
    formData.set("composer", composer)
    formData.set("category", category)
    formData.set("difficulty", String(difficulty))
    formData.set("keyTonic", keyTonic)
    formData.set("keyMode", keyMode)
    formData.set("tempoMin", tempoMin)
    formData.set("tempoMax", tempoMax)
    formData.set("positions", JSON.stringify(positions))
    formData.set("techniques", JSON.stringify(selectedTags))
    formData.set("description", description)
    formData.set("descriptionShort", descriptionShort)

    try {
      const result = await uploadAction(formData)
      if (result?.error) {
        setMessage(`エラー: ${result.error}`)
      } else {
        setMessage("登録しました")
        // reset
        setTitle(""); setComposer(""); setDifficulty(1)
        setTempoMin(""); setTempoMax(""); setPositions([])
        setSelectedTags([]); setDescription(""); setDescriptionShort("")
        setFile(null); setShowForm(false)
        window.location.reload()
      }
    } catch (e: any) {
      setMessage(`エラー: ${e.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const renderStars = (n: number, interactive = false) => {
    return (
      <span className={styles.stars}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={i <= n ? styles.starFilled : styles.starEmpty}
            onClick={interactive ? () => setDifficulty(i) : undefined}
            style={interactive ? { cursor: "pointer" } : undefined}
          >
            ★
          </span>
        ))}
      </span>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>練習メニュー管理</h1>
        <button className={styles.primaryBtn} onClick={() => setShowForm(!showForm)}>
          {showForm ? "閉じる" : "新規登録"}
        </button>
      </div>

      {message && <div className={styles.message}>{message}</div>}

      {showForm && (
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>新規登録</h2>

          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>MusicXML ファイル *</label>
              <input type="file" accept=".musicxml,.mxl,.xml"
                onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>

            <div className={styles.field}>
              <label>タイトル *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="ト長調 音階 2オクターブ" />
            </div>

            <div className={styles.field}>
              <label>作曲者</label>
              <input value={composer} onChange={(e) => setComposer(e.target.value)}
                placeholder="カイザー" />
            </div>

            <div className={styles.field}>
              <label>カテゴリ *</label>
              <div className={styles.radioGroup}>
                {(["scale", "arpeggio", "etude"] as const).map((c) => (
                  <label key={c} className={styles.radioLabel}>
                    <input type="radio" name="category" value={c}
                      checked={category === c} onChange={() => setCategory(c)} />
                    {categoryLabels[c]}
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.field}>
              <label>難易度 *</label>
              <div>{renderStars(difficulty, true)} <span className={styles.hint}>({difficulty}/5)</span></div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label>調 *</label>
                <div className={styles.inlineGroup}>
                  <select value={keyTonic} onChange={(e) => setKeyTonic(e.target.value)}>
                    {tonicOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select value={keyMode} onChange={(e) => setKeyMode(e.target.value)}>
                    <option value="major">長調</option>
                    <option value="minor">短調</option>
                  </select>
                </div>
              </div>

              <div className={styles.field}>
                <label>推奨テンポ</label>
                <div className={styles.inlineGroup}>
                  <input type="number" value={tempoMin} onChange={(e) => setTempoMin(e.target.value)}
                    placeholder="60" style={{ width: 80 }} />
                  <span>〜</span>
                  <input type="number" value={tempoMax} onChange={(e) => setTempoMax(e.target.value)}
                    placeholder="90" style={{ width: 80 }} />
                </div>
              </div>
            </div>

            <div className={styles.field}>
              <label>ポジション</label>
              <div className={styles.checkboxGroup}>
                {positionOptions.map((pos) => (
                  <label key={pos} className={styles.checkboxLabel}>
                    <input type="checkbox" checked={positions.includes(pos)}
                      onChange={() => togglePosition(pos)} />
                    {pos}
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.field}>
              <label>技法タグ</label>
              <div className={styles.tagSection}>
                {Object.entries(tagsByCategory).map(([cat, tags]) => (
                  <div key={cat} className={styles.tagCategory}>
                    <div className={styles.tagCategoryName}>{cat}</div>
                    <div className={styles.tagList}>
                      {tags.map((tag) => {
                        const sel = selectedTags.find((t) => t.id === tag.id)
                        return (
                          <span key={tag.id}
                            className={`${styles.tag} ${sel ? styles.tagSelected : ""} ${sel?.isPrimary ? styles.tagPrimary : ""}`}
                            onClick={() => toggleTag(tag.id)}
                            onDoubleClick={() => { if (sel) togglePrimary(tag.id) }}
                            title="クリックで選択、ダブルクリックで主要タグ"
                          >
                            {tag.name}
                            {sel?.isPrimary && " ●"}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                ))}
                <div className={styles.hint}>クリック: 選択/解除　ダブルクリック: 主要タグ指定</div>
              </div>
            </div>

            <div className={styles.field}>
              <label>短い説明（一覧表示用）</label>
              <input value={descriptionShort} onChange={(e) => setDescriptionShort(e.target.value)}
                placeholder="2の指と3の指の間隔に注意" />
            </div>

            <div className={styles.field}>
              <label>詳細説明</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="練習のポイント、注意事項など" rows={3} />
            </div>
          </div>

          <button className={styles.primaryBtn} onClick={handleSubmit} disabled={submitting}>
            {submitting ? "登録中..." : "登録"}
          </button>
        </div>
      )}

      {/* 登録済み一覧 */}
      <div className={styles.listSection}>
        <h2 className={styles.sectionTitle}>登録済み ({items.length}件)</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>タイトル</th>
              <th>カテゴリ</th>
              <th>難易度</th>
              <th>調</th>
              <th>テンポ</th>
              <th>技法</th>
              <th>状態</th>
              <th>公開</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className={styles.itemTitle}>{item.title}</div>
                  {item.composer && <div className={styles.itemSub}>{item.composer}</div>}
                </td>
                <td>{categoryLabels[item.category] || item.category}</td>
                <td>{renderStars(item.difficulty)}</td>
                <td>{item.keyTonic} {modeLabels[item.keyMode] || item.keyMode}</td>
                <td>{item.tempoMin && item.tempoMax ? `${item.tempoMin}-${item.tempoMax}` : "-"}</td>
                <td>
                  {item.techniques.map((t) => (
                    <span key={t.id} className={`${styles.tagSmall} ${t.isPrimary ? styles.tagPrimary : ""}`}>
                      {t.name}
                    </span>
                  ))}
                </td>
                <td>
                  <span className={item.analysisStatus === "done" && item.buildStatus === "done"
                    ? styles.statusDone : styles.statusProcessing}>
                    {item.analysisStatus === "done" && item.buildStatus === "done" ? "完了" : "処理中"}
                  </span>
                </td>
                <td>{item.isPublished ? "✅" : "❌"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
