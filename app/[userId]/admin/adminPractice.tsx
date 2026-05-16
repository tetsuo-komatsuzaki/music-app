"use client"

import { useMemo, useState, useTransition } from "react"
import {
  SUB_TASK_IDS,
  SUB_TASK_NAMES,
  TASK_NAMES,
  SKILL_TASKS,
  type SubTaskId,
  type TaskId,
} from "@/app/_libs/skillMaster"
import { updatePracticeItemTags } from "@/app/actions/updatePracticeItemTags"
import { updateScoreTags } from "@/app/actions/updateScoreTags"
import { updateScoreTechniqueTags } from "@/app/actions/updateScoreTechniqueTags"
import styles from "./admin.module.css"

type TechniqueOption = { id: string; category: string; name: string; nameEn: string | null }
type ItemType = "practice" | "score"
type ItemDTO = {
  type: ItemType
  id: string; category: string; title: string; composer: string | null
  keyTonic: string; keyMode: string
  tempoMin: number | null; tempoMax: number | null; positions: string[]
  isPublished: boolean; analysisStatus: string; buildStatus: string
  star: number | null
  skillSubTaskTags: string[]
  techniques: { id: string; name: string; isPrimary: boolean }[]
}

type Props = {
  items: ItemDTO[]
  tagsByCategory: Record<string, TechniqueOption[]>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uploadAction: (formData: FormData) => Promise<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uploadScoreAction: (formData: FormData) => Promise<any>
}

const categoryLabels: Record<string, string> = {
  scale: "音階",
  arpeggio: "アルペジオ",
  etude: "エチュード",
  score: "曲",
}
const modeLabels: Record<string, string> = { major: "長調", minor: "短調" }
const positionOptions = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"]
const tonicOptions = ["C", "C#", "Db", "D", "Eb", "E", "F", "F#", "Gb", "G", "Ab", "A", "Bb", "B"]

type FilterMode = "all" | "missing_both" | "missing_difficulty" | "missing_tags"

const FILTER_LABELS: Record<FilterMode, string> = {
  all: "すべて",
  missing_both: "両方未設定",
  missing_difficulty: "難易度未設定",
  missing_tags: "課題タグ未設定",
}

const isSubTaskId = (v: string): v is SubTaskId =>
  (SUB_TASK_IDS as readonly string[]).includes(v)

function tagShortName(tag: string): string {
  return isSubTaskId(tag) ? SUB_TASK_NAMES[tag] : tag
}

export default function AdminPractice({
  items: initialItems,
  tagsByCategory,
  uploadAction,
  uploadScoreAction,
}: Props) {
  const [items, setItems] = useState<ItemDTO[]>(initialItems)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState("")

  // フィルタ
  const [filterMode, setFilterMode] = useState<FilterMode>("all")
  const [searchText, setSearchText] = useState("")

  // フォーム state (新規登録用)
  const [title, setTitle] = useState("")
  const [composer, setComposer] = useState("")
  const [category, setCategory] = useState<string>("scale")
  const [keyTonic, setKeyTonic] = useState("G")
  const [keyMode, setKeyMode] = useState("major")
  const [tempoMin, setTempoMin] = useState("")
  const [tempoMax, setTempoMax] = useState("")
  const [positions, setPositions] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<{ id: string; isPrimary: boolean }[]>([])
  const [description, setDescription] = useState("")
  const [descriptionShort, setDescriptionShort] = useState("")
  const [file, setFile] = useState<File | null>(null)
  // ループエンジン用フィールド (Phase 1c で追加)
  const [difficultyInput, setDifficultyInput] = useState("")
  const [selectedSubTasks, setSelectedSubTasks] = useState<Set<string>>(new Set())
  // Score 用 (admin が共有サンプルとしてアップロードする場合のフラグ、デフォルト true)
  const [scoreIsShared, setScoreIsShared] = useState(true)
  const isScoreCategory = category === "score"

  // インライン編集 state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDifficulty, setEditDifficulty] = useState<string>("")
  const [editSubTasks, setEditSubTasks] = useState<Set<string>>(new Set())
  const [, startTransition] = useTransition()
  const [editError, setEditError] = useState<string | null>(null)
  const [editSaving, setEditSaving] = useState(false)

  // v1.6 Phase 4-3 Q5=(b) 確定: Score 用「技法タグを編集」モーダル state (一覧編集とは分離)
  const [techModalScore, setTechModalScore] = useState<ItemDTO | null>(null)
  const [techModalTags, setTechModalTags] = useState<{ id: string; isPrimary: boolean }[]>([])
  const [techModalSaving, setTechModalSaving] = useState(false)
  const [techModalError, setTechModalError] = useState<string | null>(null)

  const openTechModal = (item: ItemDTO) => {
    setTechModalScore(item)
    setTechModalTags(
      item.techniques.map((t) => ({ id: t.id, isPrimary: t.isPrimary })),
    )
    setTechModalError(null)
  }
  const closeTechModal = () => {
    setTechModalScore(null)
    setTechModalTags([])
    setTechModalError(null)
  }
  const toggleTechModalTag = (tagId: string) => {
    setTechModalTags((prev) => {
      const exists = prev.find((t) => t.id === tagId)
      if (exists) return prev.filter((t) => t.id !== tagId)
      return [...prev, { id: tagId, isPrimary: false }]
    })
  }
  const toggleTechModalPrimary = (tagId: string) => {
    setTechModalTags((prev) =>
      prev.map((t) => (t.id === tagId ? { ...t, isPrimary: !t.isPrimary } : t)),
    )
  }
  const saveTechModal = async () => {
    if (!techModalScore) return
    setTechModalError(null)
    setTechModalSaving(true)
    try {
      const result = await updateScoreTechniqueTags(techModalScore.id, techModalTags)
      if ("error" in result) {
        setTechModalError(result.error)
        return
      }
      // 楽観的更新: ローカル state にも反映
      const tagsById = new Map(
        Object.values(tagsByCategory)
          .flat()
          .map((t) => [t.id, t.name]),
      )
      const newTechniques = techModalTags.map((t) => ({
        id: t.id,
        name: tagsById.get(t.id) ?? "(unknown)",
        isPrimary: t.isPrimary,
      }))
      startTransition(() => {
        setItems((prev) =>
          prev.map((it) =>
            it.id === techModalScore.id ? { ...it, techniques: newTechniques } : it,
          ),
        )
      })
      closeTechModal()
    } catch (e) {
      setTechModalError(e instanceof Error ? e.message : String(e))
    } finally {
      setTechModalSaving(false)
    }
  }

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

  const toggleNewSubTask = (subTaskId: string) => {
    setSelectedSubTasks(prev => {
      const next = new Set(prev)
      if (next.has(subTaskId)) next.delete(subTaskId)
      else next.add(subTaskId)
      return next
    })
  }

  const toggleEditSubTask = (subTaskId: string) => {
    setEditSubTasks(prev => {
      const next = new Set(prev)
      if (next.has(subTaskId)) next.delete(subTaskId)
      else next.add(subTaskId)
      return next
    })
  }

  const startEdit = (item: ItemDTO) => {
    setEditingId(item.id)
    setEditDifficulty(item.star != null ? String(item.star) : "")
    setEditSubTasks(new Set(item.skillSubTaskTags))
    setEditError(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditError(null)
  }

  const saveEdit = async (item: ItemDTO) => {
    setEditError(null)
    let difficulty: number | null = null
    if (editDifficulty.trim() !== "") {
      const n = Number.parseInt(editDifficulty, 10)
      if (!Number.isFinite(n) || n < 1 || n > 10) {
        setEditError("難易度は 1〜10 で指定してください")
        return
      }
      difficulty = n
    }
    setEditSaving(true)
    try {
      const payload = {
        star: difficulty, // local 変数名は UI 概念のまま、payload キーは v1.3 B-3 で star に統一
        skillSubTaskTags: Array.from(editSubTasks),
      }
      // type に応じて適切な server action を呼ぶ
      const result =
        item.type === "score"
          ? await updateScoreTags(item.id, payload)
          : await updatePracticeItemTags(item.id, payload)
      if ("error" in result) {
        setEditError(result.error)
        return
      }
      // 楽観的更新: ローカル state も差し替え
      startTransition(() => {
        setItems(prev =>
          prev.map(it =>
            it.id === item.id
              ? { ...it, star: difficulty, skillSubTaskTags: Array.from(editSubTasks) }
              : it,
          ),
        )
      })
      setEditingId(null)
    } catch (e) {
      setEditError(e instanceof Error ? e.message : String(e))
    } finally {
      setEditSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!file) { setMessage("MusicXMLファイルを選択してください"); return }
    if (!title) { setMessage("タイトルを入力してください"); return }
    if (difficultyInput.trim() !== "") {
      const n = Number.parseInt(difficultyInput, 10)
      if (!Number.isFinite(n) || n < 1 || n > 10) {
        setMessage("難易度は 1〜10 で指定してください")
        return
      }
    }

    setSubmitting(true)
    setMessage("")

    const formData = new FormData()
    formData.set("file", file)
    formData.set("title", title)
    formData.set("composer", composer)
    formData.set("star", difficultyInput) // v1.3 B-3: DB カラム & formData key 双方 star に統一
    formData.set("skillSubTaskTags", JSON.stringify(Array.from(selectedSubTasks)))

    try {
      let result
      // v1.6 Phase 4-3: Score / PracticeItem 両方で techniques を送る (Q4=A 流用)
      formData.set("techniques", JSON.stringify(selectedTags))
      if (isScoreCategory) {
        // Score upload
        formData.set("isShared", scoreIsShared ? "true" : "false")
        result = await uploadScoreAction(formData)
      } else {
        // PracticeItem upload (scale / arpeggio / etude)
        formData.set("category", category)
        formData.set("keyTonic", keyTonic)
        formData.set("keyMode", keyMode)
        formData.set("tempoMin", tempoMin)
        formData.set("tempoMax", tempoMax)
        formData.set("positions", JSON.stringify(positions))
        formData.set("description", description)
        formData.set("descriptionShort", descriptionShort)
        result = await uploadAction(formData)
      }
      if (result?.error) {
        setMessage(`エラー: ${result.error}`)
      } else {
        setMessage("登録しました")
        // reset
        setTitle(""); setComposer("")
        setTempoMin(""); setTempoMax(""); setPositions([])
        setSelectedTags([]); setDescription(""); setDescriptionShort("")
        setFile(null); setShowForm(false)
        setDifficultyInput(""); setSelectedSubTasks(new Set())
        setScoreIsShared(true)
        window.location.reload()
      }
    } catch (e) {
      setMessage(`エラー: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setSubmitting(false)
    }
  }

  // フィルタ + 検索適用
  const filteredItems = useMemo(() => {
    const lower = searchText.trim().toLowerCase()
    return items.filter(item => {
      // フィルタ
      const noDiff = item.star == null
      const noTags = item.skillSubTaskTags.length === 0
      if (filterMode === "missing_both" && !(noDiff && noTags)) return false
      if (filterMode === "missing_difficulty" && !noDiff) return false
      if (filterMode === "missing_tags" && !noTags) return false
      // 検索
      if (lower) {
        const hay = `${item.title} ${item.composer ?? ""}`.toLowerCase()
        if (!hay.includes(lower)) return false
      }
      return true
    })
  }, [items, filterMode, searchText])

  const counts = useMemo(() => {
    const total = items.length
    const noDiff = items.filter(it => it.star == null).length
    const noTags = items.filter(it => it.skillSubTaskTags.length === 0).length
    const both = items.filter(it => it.star == null && it.skillSubTaskTags.length === 0).length
    return { total, noDiff, noTags, both }
  }, [items])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>教材管理</h1>
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
                {(["scale", "arpeggio", "etude", "score"] as const).map((c) => (
                  <label key={c} className={styles.radioLabel}>
                    <input type="radio" name="category" value={c}
                      checked={category === c} onChange={() => setCategory(c)} />
                    {categoryLabels[c]}
                  </label>
                ))}
              </div>
              {isScoreCategory && (
                <div className={styles.hint}>
                  ※ 曲 (Score) は PracticeItem とは別テーブルで保存されます。
                  調・テンポ・ポジション等は MusicXML から自動取得されるため、
                  ここでは入力不要です。
                </div>
              )}
            </div>

            {/* PracticeItem (scale/arpeggio/etude) のみ表示する項目 */}
            {!isScoreCategory && (
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
            )}

            {/* Score 用フィールド: 共有フラグ */}
            {isScoreCategory && (
              <div className={styles.field}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={scoreIsShared}
                    onChange={(e) => setScoreIsShared(e.target.checked)}
                  />
                  全ユーザーに共有 (サンプル曲として公開)
                </label>
              </div>
            )}

            <div className={styles.field}>
              <label>難易度 (1〜10) ★ループエンジン必須</label>
              <input
                type="number"
                min={1}
                max={10}
                value={difficultyInput}
                onChange={(e) => setDifficultyInput(e.target.value)}
                placeholder="1〜10"
                style={{ width: 100 }}
              />
            </div>

            <div className={styles.field}>
              <label>課題タグ (skillSubTaskTags) ★ループエンジン必須</label>
              <div className={styles.tagSection}>
                {(Object.keys(SKILL_TASKS) as TaskId[]).map(taskId => (
                  <div key={taskId} className={styles.tagCategory}>
                    <div className={styles.tagCategoryName}>{TASK_NAMES[taskId]}</div>
                    <div className={styles.tagList}>
                      {SKILL_TASKS[taskId].subTaskIds.map(subId => {
                        const checked = selectedSubTasks.has(subId)
                        return (
                          <span
                            key={subId}
                            className={`${styles.tag} ${checked ? styles.tagSelected : ""}`}
                            onClick={() => toggleNewSubTask(subId)}
                            title="クリックで選択/解除"
                          >
                            {SUB_TASK_NAMES[subId]}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                ))}
                <div className={styles.hint}>
                  この教材で改善できる sub_task を選択。「気になる箇所」検出時にレコメンド対象になる。
                </div>
              </div>
            </div>

            {/* v1.6 Phase 4-3 (Q4=A): TechniqueTag セレクタは PracticeItem + Score 両方で表示。
                  isPrimary の意味論が異なるので tooltip/hint で区別する (Q3 確定)。 */}
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
                            title={
                              isScoreCategory
                                ? "クリック: 選択/解除  ダブルクリック: 楽曲の主要技法"
                                : "クリック: 選択/解除  ダブルクリック: 練習の主目的"
                            }
                          >
                            {tag.name}
                            {sel?.isPrimary && " ●"}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                ))}
                <div className={styles.hint}>
                  {isScoreCategory
                    ? "クリック: 選択/解除  ダブルクリック: ● (楽曲の主要技法を指定、完全習得判定 §2-6 で参照)"
                    : "クリック: 選択/解除  ダブルクリック: ● (この練習教材の主目的の技法)"}
                </div>
              </div>
            </div>

            {/* PracticeItem (scale/arpeggio/etude) のみ表示する項目群 */}
            {!isScoreCategory && (
              <>
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
                  <label>短い説明（一覧表示用）</label>
                  <input value={descriptionShort} onChange={(e) => setDescriptionShort(e.target.value)}
                    placeholder="2の指と3の指の間隔に注意" />
                </div>

                <div className={styles.field}>
                  <label>詳細説明</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                    placeholder="練習のポイント、注意事項など" rows={3} />
                </div>
              </>
            )}
          </div>

          <button className={styles.primaryBtn} onClick={handleSubmit} disabled={submitting}>
            {submitting ? "登録中..." : "登録"}
          </button>
        </div>
      )}

      {/* 登録済み一覧 */}
      <div className={styles.listSection}>
        <h2 className={styles.sectionTitle}>登録済み ({items.length}件)</h2>

        {/* フィルタ + 検索 */}
        <div className={styles.filterBar}>
          {(Object.keys(FILTER_LABELS) as FilterMode[]).map(mode => {
            const c =
              mode === "missing_both"
                ? counts.both
                : mode === "missing_difficulty"
                  ? counts.noDiff
                  : mode === "missing_tags"
                    ? counts.noTags
                    : counts.total
            return (
              <button
                key={mode}
                type="button"
                className={`${styles.filterBtn} ${filterMode === mode ? styles.filterBtnActive : ""}`}
                onClick={() => setFilterMode(mode)}
              >
                {FILTER_LABELS[mode]}{" "}
                <span className={styles.filterCount}>{c}</span>
              </button>
            )
          })}
          <input
            type="text"
            placeholder="タイトル / 作曲者で検索"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>タイトル</th>
              <th>カテゴリ</th>
              <th>難易度</th>
              <th>課題タグ</th>
              <th>調</th>
              <th>テンポ</th>
              <th>状態</th>
              <th>公開</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => {
              const isEditing = editingId === item.id
              const noDiff = item.star == null
              const noTags = item.skillSubTaskTags.length === 0
              return (
                <tr key={item.id} className={noDiff || noTags ? styles.rowNeedsAttention : ""}>
                  <td>
                    <div className={styles.itemTitle}>{item.title}</div>
                    {item.composer && <div className={styles.itemSub}>{item.composer}</div>}
                  </td>
                  <td>
                    {categoryLabels[item.category] || item.category}
                    {item.type === "score" && (
                      <span className={styles.scoreMarker} title="Score テーブル">♬</span>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={editDifficulty}
                        onChange={(e) => setEditDifficulty(e.target.value)}
                        style={{ width: 60 }}
                      />
                    ) : (
                      <span className={noDiff ? styles.missingBadge : ""}>
                        {item.star ?? "未設定"}
                      </span>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <div className={styles.editTagGrid}>
                        {SUB_TASK_IDS.map(subId => {
                          const checked = editSubTasks.has(subId)
                          return (
                            <label key={subId} className={styles.editTagLabel}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleEditSubTask(subId)}
                              />
                              {SUB_TASK_NAMES[subId]}
                            </label>
                          )
                        })}
                      </div>
                    ) : noTags ? (
                      <span className={styles.missingBadge}>未設定</span>
                    ) : (
                      <div className={styles.subTaskChips}>
                        {item.skillSubTaskTags.map(t => (
                          <span key={t} className={styles.subTaskChip}>
                            {tagShortName(t)}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td>
                    {item.keyTonic
                      ? `${item.keyTonic} ${modeLabels[item.keyMode] || item.keyMode}`
                      : "-"}
                  </td>
                  <td>
                    {item.type === "score"
                      ? item.tempoMin
                        ? `♩=${item.tempoMin}`
                        : "-"
                      : item.tempoMin && item.tempoMax
                        ? `${item.tempoMin}-${item.tempoMax}`
                        : "-"}
                  </td>
                  <td>
                    <span className={item.analysisStatus === "done" && item.buildStatus === "done"
                      ? styles.statusDone : styles.statusProcessing}>
                      {item.analysisStatus === "done" && item.buildStatus === "done" ? "完了" : "処理中"}
                    </span>
                  </td>
                  <td>{item.isPublished ? "✅" : "❌"}</td>
                  <td>
                    {isEditing ? (
                      <div className={styles.editActions}>
                        <button
                          type="button"
                          className={styles.primaryBtn}
                          onClick={() => saveEdit(item)}
                          disabled={editSaving}
                        >
                          {editSaving ? "保存中..." : "保存"}
                        </button>
                        <button
                          type="button"
                          className={styles.secondaryBtn}
                          onClick={cancelEdit}
                          disabled={editSaving}
                        >
                          キャンセル
                        </button>
                        {editError && <div className={styles.editError}>{editError}</div>}
                      </div>
                    ) : (
                      <div className={styles.editActions}>
                        <button
                          type="button"
                          className={styles.secondaryBtn}
                          onClick={() => startEdit(item)}
                        >
                          編集
                        </button>
                        {/* v1.6 Phase 4-3 Q5=(b): Score のみ「技法」ボタン (モーダル分離) */}
                        {item.type === "score" && (
                          <button
                            type="button"
                            className={styles.secondaryBtn}
                            onClick={() => openTechModal(item)}
                            title="楽曲の技法タグを編集 (完全習得判定 §2-6 用)"
                          >
                            技法
                            {item.techniques.length > 0 && (
                              <span className={styles.filterCount}>
                                {item.techniques.length}
                              </span>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={9} className={styles.emptyRow}>
                  該当する教材がありません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* v1.6 Phase 4-3 Q5=(b): Score 技法タグ編集モーダル */}
      {techModalScore && (
        <div className={styles.techModalOverlay} onClick={closeTechModal}>
          <div
            className={styles.techModal}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`「${techModalScore.title}」の技法タグを編集`}
          >
            <div className={styles.techModalHeader}>
              <h2 className={styles.techModalTitle}>
                技法タグを編集
              </h2>
              <button
                type="button"
                className={styles.techModalClose}
                onClick={closeTechModal}
                aria-label="閉じる"
              >
                ✕
              </button>
            </div>
            <div className={styles.techModalSub}>
              「{techModalScore.title}」
              {techModalScore.composer ? ` / ${techModalScore.composer}` : ""}
            </div>

            <div className={styles.tagSection}>
              {Object.entries(tagsByCategory).map(([cat, tags]) => (
                <div key={cat} className={styles.tagCategory}>
                  <div className={styles.tagCategoryName}>{cat}</div>
                  <div className={styles.tagList}>
                    {tags.map((tag) => {
                      const sel = techModalTags.find((t) => t.id === tag.id)
                      return (
                        <span
                          key={tag.id}
                          className={`${styles.tag} ${sel ? styles.tagSelected : ""} ${sel?.isPrimary ? styles.tagPrimary : ""}`}
                          onClick={() => toggleTechModalTag(tag.id)}
                          onDoubleClick={() => {
                            if (sel) toggleTechModalPrimary(tag.id)
                          }}
                          title="クリック: 選択/解除  ダブルクリック: 楽曲の主要技法"
                        >
                          {tag.name}
                          {sel?.isPrimary && " ●"}
                        </span>
                      )
                    })}
                  </div>
                </div>
              ))}
              <div className={styles.hint}>
                クリック: 選択/解除  ダブルクリック: ● (楽曲の主要技法、完全習得判定 §2-6 で参照)
              </div>
            </div>

            {techModalError && (
              <div className={styles.editError}>{techModalError}</div>
            )}

            <div className={styles.techModalActions}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={closeTechModal}
                disabled={techModalSaving}
              >
                キャンセル
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={saveTechModal}
                disabled={techModalSaving}
              >
                {techModalSaving ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
