"use client"

import { useMemo, useState, useTransition } from "react"
import { detectKeyFromMusicXml, browserInflate } from "@/app/_libs/musicxmlKey"
import { formatKey } from "@/app/_libs/musicNotation"
import { Palette } from "lucide-react"
import {
  SUB_TASK_IDS,
  SUB_TASK_NAMES,
  TASK_NAMES,
  SKILL_TASKS,
  AXES,
  SUB_TASKS_FUTURE,
  LIVE_SUB_TASK_IDS,
  type SubTaskId,
  type TaskId,
} from "@/app/_libs/skillMaster"

// 課題タグの選択肢は現役(弓採点23項目)のみ表示 (2026-07-14)。
// 音程/リズム系はv68で217診断体系に置換済みの死にタグのため隠す(既存データは不変)。
const isSelectableSubTask = (subId: SubTaskId) =>
  !SUB_TASKS_FUTURE.has(subId) && LIVE_SUB_TASK_IDS.has(subId)
import Link from "next/link"
import { usePathname } from "next/navigation"
import { updatePracticeItemTags } from "@/app/actions/updatePracticeItemTags"
import { updateScoreTags } from "@/app/actions/updateScoreTags"
import { deleteAdminMaterial } from "@/app/actions/deleteAdminMaterial"
import { CATEGORY_LABELS, PRACTICE_CATEGORIES } from "@/app/_libs/practiceConstants"
import { SONG_GENRES } from "@/app/_libs/songGenre"
import { STANDARD_ARTICULATIONS, ARTICULATION_CATEGORIES } from "@/app/_libs/articulationPatterns"
import {
  DIFFICULTIES,
  ARTICULATIONS,
  usesDifficulty,
  usesArticulation,
} from "@/app/_libs/materialVariant"
import ScoreVariantDialog from "./ScoreVariantDialog"
import ArticulationVariantDialog from "./ArticulationVariantDialog"
import RhythmVariantDialog from "./RhythmVariantDialog"
import ScoreAuthorDialog from "./ScoreAuthorDialog"
import PartsDialog from "./PartsDialog"
import styles from "./admin.module.css"
import { MOOD_TAG_DEFS, moodTagLabel } from "@/app/_libs/moodTags"

// アップロード時に選べるカテゴリ: 基礎練6 + エチュード + 学びレッスン + 練習曲(score=isShared Score)
// lesson は練習メニューには出さない管理専用カテゴリ (学びレッスン23本の教材)
const UPLOAD_CATEGORY_OPTIONS: readonly string[] = [
  ...PRACTICE_CATEGORIES,
  "lesson",
  "score",
]

type TechniqueOption = { id: string; category: string; name: string; nameEn: string | null }
type ItemType = "practice" | "score"
type ItemDTO = {
  type: ItemType
  id: string; category: string; title: string; composer: string | null
  groupId?: string | null; groupTitle?: string | null
  /** 奏法別・リズム別・パート別。教材管理では既定で隠す (2026-09-01 Tetsuo確定) */
  isVariant?: boolean
  keyTonic: string; keyMode: string
  tempoMin: number | null; tempoMax: number | null; positions: string[]
  isPublished: boolean; analysisStatus: string; buildStatus: string
  star: number | null
  /** 譜面の技術から機械計算した★ (2026-08-25)。star と食い違うと要確認 */
  autoStar?: number | null
  skillSubTaskTags: string[]
  /** 雰囲気タグ (2026-08-05・曲のみ手動設定) */
  moodTags?: string[]
  techniques: { id: string; name: string; isPrimary: boolean }[]
}

type GroupAxis = { key: string; label: string; kind: string; values: string[] }
type GroupOption = {
  id: string
  category: string
  title: string
  composer: string | null
  variantCount: number
  /** 族の軸 (2026-08-25)。既存グループに追加するとき、軸の値を選ばせる */
  axes?: GroupAxis[] | null
}

type Props = {
  items: ItemDTO[]
  tagsByCategory: Record<string, TechniqueOption[]>
  groups: GroupOption[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uploadAction: (formData: FormData) => Promise<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uploadScoreAction: (formData: FormData) => Promise<any>
}

const categoryLabels: Record<string, string> = {
  ...CATEGORY_LABELS,
  lesson: "学びレッスン",
  score: "練習曲",
}
const modeLabels: Record<string, string> = { major: "長調", minor: "短調" }
const positionOptions = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"]
const tonicOptions = ["C", "C#", "Db", "D", "Eb", "E", "F", "F#", "Gb", "G", "Ab", "A", "Bb", "B"]

type FilterMode = "all" | "star_mismatch" | "missing_both" | "missing_difficulty" | "missing_tags"

const FILTER_LABELS: Record<FilterMode, string> = {
  all: "すべて",
  missing_both: "両方未設定",
  missing_difficulty: "難易度未設定",
  missing_tags: "課題タグ未設定",
  star_mismatch: "★が要確認",
}

const isSubTaskId = (v: string): v is SubTaskId =>
  (SUB_TASK_IDS as readonly string[]).includes(v)

function tagShortName(tag: string): string {
  return isSubTaskId(tag) ? SUB_TASK_NAMES[tag] : tag
}

export default function AdminPractice({
  items: initialItems,
  tagsByCategory,
  groups,
  uploadAction,
  uploadScoreAction,
}: Props) {
  const [items, setItems] = useState<ItemDTO[]>(initialItems)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  // v1.6 Phase 6: 不足教材フラグ画面へのナビ ( /{userId}/admin/practice → .../missing-items )
  const pathname = usePathname()
  const missingItemsHref = pathname.replace(/\/practice$/, "/missing-items")

  // フィルタ
  const [filterMode, setFilterMode] = useState<FilterMode>("all")
  // カテゴリ絞り込み+並び替え (2026-08-25 Tetsuo: 教材が多くスクロールが大変)
  // 一括生成する奏法の選択 (2026-08-25 Tetsuo: 全部ではなく必要なものだけ作れるように)
  const [selectedArts, setSelectedArts] = useState<Set<string>>(new Set(STANDARD_ARTICULATIONS.map((a) => a.id)))
  const [catFilter, setCatFilter] = useState<string>("all")
  const [sortMode, setSortMode] = useState<"category" | "title" | "star" | "new">("category")
  // 族でまとめる (2026-08-25 Tetsuo「数が多くて見にくい」)。
  // 824件を族の見出し行に畳み、開いたときだけ変種を出す。
  const [groupedView, setGroupedView] = useState(true)
  // 奏法別・リズム別・パート別を出すか (2026-09-01 Tetsuo確定「量が多すぎて見れなくなる」)。
  // 既定は隠す。解析の失敗を追うときだけ開く
  const [showVariants, setShowVariants] = useState(false)
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set())
  const [searchText, setSearchText] = useState("")

  // フォーム state (新規登録用)
  const [title, setTitle] = useState("")
  const [composer, setComposer] = useState("")
  const [category, setCategory] = useState<string>("scale")
  const [expandAllKeys, setExpandAllKeys] = useState(false)
  const [stdArticulations, setStdArticulations] = useState(false)
  const [keyTonic, setKeyTonic] = useState("G")
  const [keyMode, setKeyMode] = useState("major")
  // 調の自動認識 (2026-09-06 Tetsuo: 手で選ばない)。ファイルを選んだ時点で読み、認識できたら選択欄を畳む
  const [keyAuto, setKeyAuto] = useState<{ ok: boolean; label?: string } | null>(null)
  const [keyManual, setKeyManual] = useState(false)
  const [tempoMin, setTempoMin] = useState("")
  const [tempoMax, setTempoMax] = useState("")
  const [positions, setPositions] = useState<string[]>([])
  const [description, setDescription] = useState("")
  const [descriptionShort, setDescriptionShort] = useState("")
  const [file, setFile] = useState<File | null>(null)
  // ループエンジン用フィールド (Phase 1c で追加)
  const [difficultyInput, setDifficultyInput] = useState("")
  const [selectedSubTasks, setSelectedSubTasks] = useState<Set<string>>(new Set())
  // Score 用 (admin が共有サンプルとしてアップロードする場合のフラグ、デフォルト true)
  const [scoreIsShared, setScoreIsShared] = useState(true)
  // Score 用ジャンル (曲のみ。未選択可、後から一覧編集も可)
  const [scoreGenre, setScoreGenre] = useState("")

  // 教材グループ・変種 (Phase B): 既存グループに変種として追加するか
  const [groupMode, setGroupMode] = useState<"new" | "existing">("new")
  const [joinGroupId, setJoinGroupId] = useState("")
  // 族の軸の値 (2026-08-25)。既存グループに追加するとき、その族の軸ぶんだけ選ばせる。
  // 教材名は「族名_軸1_軸2」で自動生成するので、手打ちの表記ゆれが起きない。
  const [axisVals, setAxisVals] = useState<string[]>([])
  const joinedGroup = groups.find((g) => g.id === joinGroupId) ?? null
  const joinedAxes = joinedGroup?.axes ?? null
  const [difficulty, setDifficulty] = useState("") // 曲/エチュード
  const [articulation, setArticulation] = useState("") // 基礎練
  const isScoreCategory = category === "score"

  // パート分け (2026-07-26): 曲アップロード時に任意個のパート範囲を入力 (案b)。パートは曲(グループ)単位。
  type PartRow = { id: string; name: string; startMeasure: string; endMeasure: string }
  const [parts, setParts] = useState<PartRow[]>([])
  const addPartRow = () =>
    setParts((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", startMeasure: "", endMeasure: "" },
    ])
  const updatePartRow = (id: string, patch: Partial<PartRow>) =>
    setParts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  const removePartRow = (id: string) => setParts((prev) => prev.filter((p) => p.id !== id))

  // インライン編集 state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDifficulty, setEditDifficulty] = useState<string>("")
  const [editSubTasks, setEditSubTasks] = useState<Set<string>>(new Set())
  // v: タイトル/カテゴリ/調/テンポ もインライン編集対象に追加
  const [editTitle, setEditTitle] = useState("")
  const [editCategory, setEditCategory] = useState("")
  const [editKeyTonic, setEditKeyTonic] = useState("")
  const [editKeyMode, setEditKeyMode] = useState("")
  const [editMoodTags, setEditMoodTags] = useState<Set<string>>(new Set())
  const [editTempoMin, setEditTempoMin] = useState("")
  const [editTempoMax, setEditTempoMax] = useState("")
  // 2026-07-14: ポジション欄が編集に無かった(学びレッスンのポジション教材で必須)
  const [editPositions, setEditPositions] = useState<string[]>([])
  const [, startTransition] = useTransition()
  const [editError, setEditError] = useState<string | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  // 難易度・パート変種ダイアログ (2026-08-24 アップロード改修)
  const [variantScoreId, setVariantScoreId] = useState<string | null>(null)
  const [artVariantItemId, setArtVariantItemId] = useState<string | null>(null)
  const [rhythmItemId, setRhythmItemId] = useState<string | null>(null)
  // 自作スコア登録 (2026-09-06): ファイル無しで音階などを組み立てる。作ったら閉じるときに一覧を読み直す
  const [authorOpen, setAuthorOpen] = useState(false)
  const [authorMade, setAuthorMade] = useState(false)
  const [partsTarget, setPartsTarget] = useState<{ id: string; kind: "practice" | "score" } | null>(null)
  // 削除中の id (二重実行防止 + ボタン無効化)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // 2026-08-28 Tetsuo確定: 技法タグは特徴タグと同じ全自動 (人の手による変更は一切しない)。
  // ここにあった「技法タグを編集」モーダル (state + open/close/toggle/save) は撤去した。
  // 機械が判断に迷うケースは従来どおり /admin/confirmations の4択で人が確定する。

  const togglePosition = (pos: string) => {
    setPositions((prev) => prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos])
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
    setEditTitle(item.title)
    setEditCategory(item.category)
    setEditKeyTonic(item.keyTonic || "")
    setEditKeyMode(item.keyMode || "")
    setEditTempoMin(item.tempoMin != null ? String(item.tempoMin) : "")
    setEditTempoMax(item.tempoMax != null ? String(item.tempoMax) : "")
    setEditPositions(item.positions ?? [])
    setEditMoodTags(new Set(item.moodTags ?? []))
    setEditError(null)
  }

  const toggleEditPosition = (pos: string) => {
    setEditPositions((prev) =>
      prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos],
    )
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditError(null)
  }

  const handleDelete = async (item: ItemDTO) => {
    const label = item.type === "score" ? "練習曲" : "教材"
    if (!window.confirm(`「${item.title}」を削除します。\nこの操作は取り消せません。よろしいですか？`)) {
      return
    }
    setDeletingId(item.id)
    try {
      const result = await deleteAdminMaterial(item.type, item.id)
      if ("error" in result) {
        setMessage(`削除エラー: ${result.error}`)
        return
      }
      setMessage(`${label}「${item.title}」を削除しました`)
      startTransition(() => {
        setItems((prev) => prev.filter((it) => it.id !== item.id))
      })
      if (editingId === item.id) setEditingId(null)
    } catch (e) {
      setMessage(`削除エラー: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setDeletingId(null)
    }
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

    // タイトル
    const title = editTitle.trim()
    if (title === "") {
      setEditError("タイトルを入力してください")
      return
    }

    // テンポ (空欄は未設定=null)
    const parseTempo = (s: string): number | null | "invalid" => {
      if (s.trim() === "") return null
      const n = Number.parseInt(s, 10)
      if (!Number.isFinite(n) || n < 1 || n > 400) return "invalid"
      return n
    }
    const tMin = parseTempo(editTempoMin)
    const tMax = parseTempo(editTempoMax)
    if (tMin === "invalid" || tMax === "invalid") {
      setEditError("テンポは 1〜400 で指定してください")
      return
    }
    if (tMin != null && tMax != null && tMin > tMax) {
      setEditError("テンポの最小値は最大値以下にしてください")
      return
    }

    setEditSaving(true)
    try {
      const subTasks = Array.from(editSubTasks)
      let result
      let patch: Partial<ItemDTO>
      if (item.type === "score") {
        // Score: カテゴリは固定。テンポは単一 (defaultTempo)。最小値を採用。
        const defaultTempo = tMin
        const moodTags = Array.from(editMoodTags)
        result = await updateScoreTags(item.id, {
          star: difficulty,
          skillSubTaskTags: subTasks,
          title,
          keyTonic: editKeyTonic.trim() || null,
          keyMode: editKeyMode || null,
          defaultTempo,
          moodTags,
        })
        patch = {
          star: difficulty, skillSubTaskTags: subTasks, title,
          keyTonic: editKeyTonic.trim(), keyMode: editKeyMode,
          tempoMin: defaultTempo, tempoMax: null,
          moodTags,
        }
      } else {
        result = await updatePracticeItemTags(item.id, {
          star: difficulty,
          skillSubTaskTags: subTasks,
          title,
          category: editCategory,
          keyTonic: editKeyTonic.trim(),
          keyMode: editKeyMode,
          tempoMin: tMin,
          tempoMax: tMax,
          positions: editPositions,
        })
        patch = {
          star: difficulty, skillSubTaskTags: subTasks, title,
          category: editCategory, keyTonic: editKeyTonic.trim(), keyMode: editKeyMode,
          tempoMin: tMin, tempoMax: tMax, positions: editPositions,
        }
      }
      if ("error" in result) {
        setEditError(result.error)
        return
      }
      // 楽観的更新: ローカル state も差し替え
      startTransition(() => {
        setItems(prev =>
          prev.map(it => (it.id === item.id ? { ...it, ...patch } : it)),
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
    // 教材グループ・変種 (Phase B): 既存グループに変種追加なら groupId、軸=difficulty/articulation
    if (groupMode === "existing" && joinGroupId) {
      formData.set("groupId", joinGroupId)
      // 軸のある族は「族名_軸1_軸2」で教材名を組み立てる (表記ゆれを構造的に防ぐ)
      if (joinedAxes && joinedAxes.length > 0 && joinedAxes.every((_, i) => axisVals[i])) {
        const suffix = joinedAxes.map((_, i) => (axisVals[i] === "基本" ? "" : `_${axisVals[i]}`)).join("")
        formData.set("title", `${joinedGroup?.title ?? ""}${suffix}`)
      }
    }
    if (usesDifficulty(category)) formData.set("difficulty", difficulty)

    // パート分け (曲のみ): 入力があれば JSON で送る。id は入力時に採番済み(固定)。
    if (isScoreCategory && parts.length > 0) {
      const payload = parts
        .map((p, i) => ({
          id: p.id,
          name: p.name.trim(),
          startMeasure: Number.parseInt(p.startMeasure, 10),
          endMeasure: Number.parseInt(p.endMeasure, 10),
          order: i,
        }))
        .filter(
          (p) =>
            p.name !== "" &&
            Number.isInteger(p.startMeasure) &&
            Number.isInteger(p.endMeasure) &&
            p.startMeasure >= 1 &&
            p.endMeasure >= p.startMeasure,
        )
      if (payload.length > 0) formData.set("parts", JSON.stringify(payload))
    }
    if (usesArticulation(category)) formData.set("articulation", articulation)

    try {
      let result
      // 2026-08-28 Tetsuo確定: 技法タグは全自動。アップロード時の手動指定は廃止
      // (選択UIは既に無く、常に空配列を送る死んだ経路だった)。
      if (isScoreCategory) {
        // Score upload
        formData.set("isShared", scoreIsShared ? "true" : "false")
        formData.set("genre", scoreGenre)
        result = await uploadScoreAction(formData)
      } else {
        // PracticeItem upload (scale / arpeggio / etude)
        formData.set("category", category)
        formData.set("keyTonic", keyTonic)
        formData.set("keyMode", keyMode)
        formData.set("expandAllKeys", expandAllKeys ? "true" : "false")
        formData.set("standardArticulations", stdArticulations ? "true" : "false")
        // 選んだ奏法だけを一括生成する (2026-08-25)
        if (stdArticulations) formData.set("articulationIds", JSON.stringify([...selectedArts]))
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
        setDescription(""); setDescriptionShort("")
        setFile(null); setShowForm(false)
        setDifficultyInput(""); setSelectedSubTasks(new Set())
        setScoreIsShared(true); setScoreGenre("")
        setGroupMode("new"); setJoinGroupId(""); setDifficulty(""); setArticulation("")
        setParts([])
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
    const list = items.filter(item => {
      // 奏法別・リズム別・パート別は一覧に出さない (2026-09-01 Tetsuo確定)。
      // 量が多すぎて見えなくなるため、代表の1件だけを並べる。
      if (item.isVariant && !showVariants) return false
      // フィルタ
      const noDiff = item.star == null
      const noTags = item.skillSubTaskTags.length === 0
      // ★の食い違い (2026-08-25): 譜面から計算した★の方が高い = 難しい技術が入っている
      const starMismatch = item.autoStar != null && item.star != null && item.autoStar > item.star
      if (filterMode === "star_mismatch" && !starMismatch) return false
      if (filterMode === "missing_both" && !(noDiff && noTags)) return false
      if (filterMode === "missing_difficulty" && !noDiff) return false
      if (filterMode === "missing_tags" && !noTags) return false
      // 検索
      if (lower) {
        const hay = `${item.title} ${item.composer ?? ""}`.toLowerCase()
        if (!hay.includes(lower)) return false
      }
      // カテゴリ絞り込み
      if (catFilter !== "all" && item.category !== catFilter) return false
      return true
    })
    const catOrder = (c: string) => {
      const i = [...PRACTICE_CATEGORIES, "lesson", "score"].indexOf(c)
      return i < 0 ? 999 : i
    }
    const sorted = [...list]
    if (sortMode === "category") {
      sorted.sort((a, b) => catOrder(a.category) - catOrder(b.category) || a.title.localeCompare(b.title, "ja"))
    } else if (sortMode === "title") {
      sorted.sort((a, b) => a.title.localeCompare(b.title, "ja"))
    } else if (sortMode === "star") {
      sorted.sort((a, b) => (a.star ?? 99) - (b.star ?? 99) || a.title.localeCompare(b.title, "ja"))
    }
    return sorted
  }, [items, filterMode, searchText, catFilter, sortMode, showVariants])
  // 族の見出し + 開いている族の変種、という並びに組み替える。
  // 族に属さない教材と、1件しかない族はそのまま1行で出す (畳む意味がないため)。
  type Row = { kind: "family"; key: string; title: string; category: string; items: ItemDTO[] } | { kind: "item"; item: ItemDTO }
  const displayRows: Row[] = useMemo(() => {
    if (!groupedView) return filteredItems.map((item) => ({ kind: "item" as const, item }))
    const order: string[] = []
    const map = new Map<string, ItemDTO[]>()
    for (const it of filteredItems) {
      const k = it.groupId ?? `solo:${it.id}`
      if (!map.has(k)) { map.set(k, []); order.push(k) }
      map.get(k)!.push(it)
    }
    const out: Row[] = []
    for (const k of order) {
      const arr = map.get(k)!
      if (arr.length === 1) { out.push({ kind: "item", item: arr[0] }); continue }
      out.push({ kind: "family", key: k, title: arr[0].groupTitle ?? arr[0].title, category: arr[0].category, items: arr })
      if (openGroups.has(k)) for (const it of arr) out.push({ kind: "item", item: it })
    }
    return out
  }, [filteredItems, groupedView, openGroups])


  const counts = useMemo(() => {
    const total = items.filter(it => !it.isVariant).length
    const noDiff = items.filter(it => it.star == null).length
    const noTags = items.filter(it => it.skillSubTaskTags.length === 0).length
    const both = items.filter(it => it.star == null && it.skillSubTaskTags.length === 0).length
    const starMismatch = items.filter(it => it.autoStar != null && it.star != null && it.autoStar > it.star).length
    return { total, noDiff, noTags, both, starMismatch }
  }, [items])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>教材管理</h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {/* 工程G (2026-07-11): スタッカート系曖昧記号の確認キュー */}
          <Link
            href={missingItemsHref.replace(/\/missing-items$/, "/confirmations")}
            style={{ fontSize: "0.9rem", color: "var(--text-link)" }}
          >
            奏法の確認 →
          </Link>
          <Link href={missingItemsHref} style={{ fontSize: "0.9rem", color: "var(--text-link)" }}>
            不足教材フラグ →
          </Link>
          <Link
            href={missingItemsHref.replace(/\/missing-items$/, "/song-requests")}
            style={{ fontSize: "0.9rem", color: "var(--text-link)" }}
          >
            曲リクエスト →
          </Link>
          <button className={styles.primaryBtn} onClick={() => setAuthorOpen(true)}>
            スコアを自分で作る
          </button>
          <button className={styles.primaryBtn} onClick={() => setShowForm(!showForm)}>
            {showForm ? "閉じる" : "新規登録"}
          </button>
        </div>
      </div>

      {message && <div className={styles.message}>{message}</div>}

      {showForm && (
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>新規登録</h2>

          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>MusicXML ファイル *</label>
              <input type="file" accept=".musicxml,.mxl,.xml"
                onChange={async (e) => {
                  const f = e.target.files?.[0] || null
                  setFile(f); setKeyAuto(null); setKeyManual(false)
                  if (!f) return
                  try {
                    const k = await detectKeyFromMusicXml(new Uint8Array(await f.arrayBuffer()), browserInflate)
                    if (k) { setKeyTonic(k.keyTonic); setKeyMode(k.keyMode); setKeyAuto({ ok: true, label: formatKey(k.keyTonic, k.keyMode) }) }
                    else { setKeyAuto({ ok: false }); setKeyManual(true) }
                  } catch { setKeyAuto({ ok: false }); setKeyManual(true) }
                }} />
            </div>

            <div className={styles.field}>
              <label>タイトル *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100}
                placeholder="ト長調 音階 2オクターブ" />
            </div>

            <div className={styles.field}>
              <label>作曲者</label>
              <input value={composer} onChange={(e) => setComposer(e.target.value)} maxLength={100}
                placeholder="カイザー" />
            </div>

            <div className={styles.field}>
              <label>カテゴリ *</label>
              <div className={styles.radioGroup}>
                {UPLOAD_CATEGORY_OPTIONS.map((c) => (
                  <label key={c} className={styles.radioLabel}>
                    <input type="radio" name="category" value={c}
                      checked={category === c} onChange={() => setCategory(c)} />
                    {categoryLabels[c] ?? c}
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

            {/* 教材グループ・変種 (Phase B): 同じ曲/エクササイズを束ねる */}
            <div className={styles.field}>
              <label>教材グループ</label>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input type="radio" name="groupMode" checked={groupMode === "new"} onChange={() => setGroupMode("new")} />
                  新規グループ
                </label>
                <label className={styles.radioLabel}>
                  <input type="radio" name="groupMode" checked={groupMode === "existing"} onChange={() => setGroupMode("existing")} />
                  既存グループに変種を追加
                </label>
              </div>
              {groupMode === "existing" && (
                <select value={joinGroupId} onChange={(e) => setJoinGroupId(e.target.value)}>
                  <option value="">グループを選択…</option>
                  {groups
                    .filter((g) => g.category === category)
                    .map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title}{g.composer ? ` / ${g.composer}` : ""}・変種{g.variantCount}
                      </option>
                    ))}
                </select>
              )}
              {groupMode === "existing" && joinedAxes && joinedAxes.length > 0 && (
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                  {joinedAxes.map((ax, i) => (
                    <label key={ax.key} style={{ fontSize: "var(--fs-body)", display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontWeight: 600 }}>{ax.label}</span>
                      <select value={axisVals[i] ?? ""}
                        onChange={(e) => setAxisVals((prev) => {
                          const next = [...prev]; next[i] = e.target.value; return next
                        })}>
                        <option value="">選んでください</option>
                        {ax.values.map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </label>
                  ))}
                  <div className={styles.hint}>
                    教材名は「{joinedGroup?.title}
                    {joinedAxes.map((_, i) => `_${axisVals[i] || "…"}`).join("")}」になります。
                  </div>
                </div>
              )}
              <div className={styles.hint}>
                同じ曲/エクササイズの難易度・奏法違いは「既存グループに追加」で束ねます。
                軸のある族は、軸を選ぶと教材名が自動で決まります。
              </div>
            </div>

            {usesDifficulty(category) && (
              <div className={styles.field}>
                <label>難易度</label>
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                  <option value="">未設定</option>
                  {DIFFICULTIES.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
                </select>
              </div>
            )}
            {usesArticulation(category) && (
              <div className={styles.field}>
                <label>奏法バリエーション</label>
                <select value={articulation} onChange={(e) => setArticulation(e.target.value)}>
                  <option value="">未設定</option>
                  {ARTICULATIONS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                </select>
              </div>
            )}

            {/* パート分け (曲のみ・任意・小節範囲・グループ共通)。2026-07-26 */}
            {isScoreCategory && (
              <div className={styles.field}>
                <label>パート分け</label>
                <div style={{ fontSize: "var(--fs-body)", color: "var(--text-sub)", marginBottom: 6 }}>
                  サビ・難所など練習させたい区間を「◯小節〜◯小節」で登録。曲(グループ)共通・難易度に依存しません。
                </div>
                {parts.map((p) => (
                  <div key={p.id} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
                    <input
                      placeholder="名前"
                      value={p.name}
                      onChange={(e) => updatePartRow(p.id, { name: e.target.value })}
                      style={{ flex: 1, minWidth: 0 }}
                    />
                    <input
                      type="number" min={1} placeholder="開始"
                      value={p.startMeasure}
                      onChange={(e) => updatePartRow(p.id, { startMeasure: e.target.value })}
                      style={{ width: 64 }}
                    />
                    <span>〜</span>
                    <input
                      type="number" min={1} placeholder="終了"
                      value={p.endMeasure}
                      onChange={(e) => updatePartRow(p.id, { endMeasure: e.target.value })}
                      style={{ width: 64 }}
                    />
                    <span style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)" }}>小節</span>
                    <button type="button" onClick={() => removePartRow(p.id)} style={{ padding: "2px 8px" }}>
                      削除
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addPartRow} style={{ padding: "4px 10px", fontSize: "var(--fs-body)" }}>
                  ＋ パートを追加
                </button>
              </div>
            )}

            {/* PracticeItem (scale/arpeggio/etude) のみ表示する項目 */}
            {!isScoreCategory && (
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label>調 ・ ファイルから自動認識</label>
                  {keyAuto?.ok && !keyManual ? (
                    <div className={styles.inlineGroup} style={{ alignItems: "center", gap: 10 }}>
                      <b>{keyAuto.label}</b>
                      <button type="button" className={styles.linkBtn} onClick={() => setKeyManual(true)}>変更する</button>
                    </div>
                  ) : (
                    <>
                      <div className={styles.inlineGroup}>
                        <select value={keyTonic} onChange={(e) => setKeyTonic(e.target.value)}>
                          {tonicOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <select value={keyMode} onChange={(e) => setKeyMode(e.target.value)}>
                          <option value="major">長調</option>
                          <option value="minor">短調</option>
                        </select>
                        {keyAuto?.ok && <button type="button" className={styles.linkBtn} onClick={() => setKeyManual(false)}>自動認識に戻す ・ {keyAuto.label}</button>}
                      </div>
                      <p className={styles.hint}>
                        {keyAuto?.ok === false ? "ファイルから調を読めませんでした。手で選んでください" : file ? "" : "ファイルを選ぶと自動で認識します"}
                      </p>
                    </>
                  )}
                  {["scale", "arpeggio", "fingering"].includes(category) && (
                    <label style={{ display: "block", marginTop: 8, fontSize: "var(--fs-body)" }}>
                      <input
                        type="checkbox"
                        checked={expandAllKeys}
                        disabled={keyMode !== "major"}
                        onChange={(e) => setExpandAllKeys(e.target.checked)}
                      />{" "}
                      全調で自動生成・長調ソース→12長調＋12自然的短調＝24件。奏法も選ぶと掛け合わせ
                    </label>
                  )}
                  {ARTICULATION_CATEGORIES.includes(category) && (
                    <>
                      <label style={{ display: "block", marginTop: 6, fontSize: "var(--fs-body)" }}>
                        <input
                          type="checkbox"
                          checked={stdArticulations}
                          onChange={(e) => setStdArticulations(e.target.checked)}
                        />{" "}
                        奏法パターンを一括生成
                      </label>
                      {stdArticulations && (
                        <div style={{ margin: "6px 0 0 22px", display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {STANDARD_ARTICULATIONS.map((a) => (
                            <label key={a.id} style={{ fontSize: "var(--fs-body)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <input
                                type="checkbox"
                                checked={selectedArts.has(a.id)}
                                onChange={() => setSelectedArts((prev) => {
                                  const next = new Set(prev)
                                  if (next.has(a.id)) next.delete(a.id)
                                  else next.add(a.id)
                                  return next
                                })}
                              />
                              {a.label}
                            </label>
                          ))}
                          <span style={{ fontSize: "var(--fs-caption)", color: "var(--text-sub)" }}>
                            作りたい奏法だけを選べます ({selectedArts.size}種)
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className={styles.field}>
                  <label>推奨テンポ</label>
                  <div className={styles.inlineGroup}>
                    <input type="number" min={1} max={400} value={tempoMin} onChange={(e) => setTempoMin(e.target.value)}
                      placeholder="60" style={{ width: 80 }} />
                    <span>〜</span>
                    <input type="number" min={1} max={400} value={tempoMax} onChange={(e) => setTempoMax(e.target.value)}
                      placeholder="90" style={{ width: 80 }} />
                  </div>
                </div>
              </div>
            )}

            {/* Score 用フィールド: 共有フラグ + ジャンル */}
            {isScoreCategory && (
              <>
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
                <div className={styles.field}>
                  <label>ジャンル (練習曲一覧の区分に使用)</label>
                  <select value={scoreGenre} onChange={(e) => setScoreGenre(e.target.value)}>
                    <option value="">未選択</option>
                    {SONG_GENRES.map((g) => (
                      <option key={g.id} value={g.id}>{g.label}</option>
                    ))}
                  </select>
                </div>
              </>
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



            {/* v1.6 Phase 4-3 (Q4=A): TechniqueTag セレクタは PracticeItem + Score 両方で表示。
                  isPrimary の意味論が異なるので tooltip/hint で区別する (Q3 確定)。 */}

            {/* PracticeItem (scale/arpeggio/etude) のみ表示する項目群 */}
            {!isScoreCategory && (
              <>

                <div className={styles.field}>
                  <label>短い説明</label>
                  <input value={descriptionShort} onChange={(e) => setDescriptionShort(e.target.value)} maxLength={200}
                    placeholder="2の指と3の指の間隔に注意" />
                </div>

                <div className={styles.field}>
                  <label>詳細説明</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000}
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
        <h2 className={styles.sectionTitle}>
          登録済み ({counts.total}件)
          <label style={{ marginLeft: 14, fontSize: 13, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 5 }}>
            <input type="checkbox" checked={showVariants} onChange={(e) => setShowVariants(e.target.checked)} />
            奏法別・リズム別・パート別も出す
          </label>
        </h2>

        {/* フィルタ + 検索 */}
        <div className={styles.filterBar}>
          {(Object.keys(FILTER_LABELS) as FilterMode[]).map(mode => {
            const c =
              mode === "star_mismatch"
                ? counts.starMismatch
              : mode === "missing_both"
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
            <label style={{ display: "inline-flex", alignItems: "center", gap: 6, marginLeft: 10, fontSize: "var(--fs-body)", fontWeight: 600, cursor: "pointer" }}>
              <input type="checkbox" checked={groupedView} onChange={(e) => setGroupedView(e.target.checked)} />
              族でまとめる
            </label>

        {/* カテゴリ絞り込み + 並び替え (2026-08-25: 教材数が多いため) */}
        <div className={styles.filterBar}>
          <button
            type="button"
            className={`${styles.filterBtn} ${catFilter === "all" ? styles.filterBtnActive : ""}`}
            onClick={() => setCatFilter("all")}
          >
            すべて <span className={styles.filterCount}>{items.length}</span>
          </button>
          {[...PRACTICE_CATEGORIES, "lesson", "score"].map((c) => {
            const n = items.filter((it) => it.category === c).length
            if (n === 0) return null
            return (
              <button
                key={c}
                type="button"
                className={`${styles.filterBtn} ${catFilter === c ? styles.filterBtnActive : ""}`}
                onClick={() => setCatFilter(c)}
              >
                {categoryLabels[c] ?? c} <span className={styles.filterCount}>{n}</span>
              </button>
            )
          })}
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as typeof sortMode)}
            style={{ marginLeft: "auto" }}
            title="並び替え"
          >
            <option value="category">カテゴリ順</option>
            <option value="title">タイトル順</option>
            <option value="star">★の低い順</option>
            <option value="new">登録順</option>
          </select>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>タイトル</th>
              <th>カテゴリ</th>
              <th>難易度</th>
              <th>調</th>
              <th>テンポ</th>
              <th>状態</th>
              <th>公開</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row) => {
              if (row.kind === "family") {
                const open = openGroups.has(row.key)
                const pub = row.items.filter((x) => x.isPublished).length
                return (
                  <tr key={`fam-${row.key}`} style={{ cursor: "pointer", background: "rgba(43,91,196,.08)" }}
                    onClick={() => setOpenGroups((prev) => {
                      const next = new Set(prev)
                      if (next.has(row.key)) next.delete(row.key); else next.add(row.key)
                      return next
                    })}>
                    <td colSpan={8} style={{ fontWeight: 700 }}>
                      <span style={{ display: "inline-block", width: 18 }}>{open ? "▾" : "▸"}</span>
                      {row.title}
                      <span style={{ marginLeft: 10, fontWeight: 500, color: "var(--text-sub)", fontSize: "var(--fs-body)" }}>
                        {categoryLabels[row.category] ?? row.category} ・ 変種{row.items.length}件 ・ 公開{pub}件
                      </span>
                    </td>
                  </tr>
                )
              }
              const item = row.item
              const isEditing = editingId === item.id
              const noDiff = item.star == null
              const noTags = item.skillSubTaskTags.length === 0
              // ★の食い違い: 譜面から計算した★の方が高い (2026-08-25)
              const mismatch = item.autoStar != null && item.star != null && item.autoStar > item.star
              return (
                <tr key={item.id} className={mismatch ? styles.rowStarMismatch : (noDiff || noTags ? styles.rowNeedsAttention : "")}>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        style={{ width: 200 }}
                        placeholder="タイトル"
                      />
                    ) : (
                      <div className={styles.itemTitle}>{item.title}</div>
                    )}
                    {item.composer && <div className={styles.itemSub}>{item.composer}</div>}
                    {/* 雰囲気タグ (2026-08-05・曲のみ): 曲を聴いて手動設定。統一語彙台帳 */}
                    {item.type === "score" && (
                      <div style={{ marginTop: 10, borderTop: "1px dashed #ddd", paddingTop: 8 }}>
                        <div style={{ fontSize: "var(--fs-body)", fontWeight: 600, color: "var(--text-body)", marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
                          <Palette size={14} /> 雰囲気タグ
                        </div>
                        <div style={{ marginLeft: 12, marginTop: 2, display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {MOOD_TAG_DEFS.map((t) => (
                            <label key={t.id} className={styles.editTagLabel}>
                              <input
                                type="checkbox"
                                checked={editMoodTags.has(t.id)}
                                onChange={() => setEditMoodTags((prev) => {
                                  const next = new Set(prev)
                                  if (next.has(t.id)) next.delete(t.id)
                                  else next.add(t.id)
                                  return next
                                })}
                              />
                              {moodTagLabel(t.id)}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </td>
                  <td>
                    {isEditing && item.type !== "score" ? (
                      <div>
                        <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                          {[...PRACTICE_CATEGORIES, "lesson"].map((c) => (
                            <option key={c} value={c}>{categoryLabels[c] ?? c}</option>
                          ))}
                        </select>
                        {/* 2026-07-14: ポジション欄 (学びレッスンのポジション教材で必須) */}
                        <div style={{ marginTop: 6 }}>
                          <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-sub)", marginBottom: 2 }}>ポジション</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {positionOptions.map((pos) => (
                              <label key={pos} style={{ fontSize: "var(--fs-body)", display: "inline-flex", alignItems: "center", gap: 2 }}>
                                <input
                                  type="checkbox"
                                  checked={editPositions.includes(pos)}
                                  onChange={() => toggleEditPosition(pos)}
                                />
                                {pos}
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {categoryLabels[item.category] || item.category}
                        {item.type === "score" && (
                          <span className={styles.scoreMarker} title="Score テーブル">♬</span>
                        )}
                      </>
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
                        {mismatch && (
                          <span className={styles.starWarn} title="譜面に、この★では習得していない技術が使われています">
                            要確認 ・ 譜面は★{item.autoStar}
                          </span>
                        )}
                      </span>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <div style={{ display: "flex", gap: 4 }}>
                        <select value={editKeyTonic} onChange={(e) => setEditKeyTonic(e.target.value)}>
                          <option value="">-</option>
                          {tonicOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <select value={editKeyMode} onChange={(e) => setEditKeyMode(e.target.value)}>
                          <option value="">-</option>
                          <option value="major">長調</option>
                          <option value="minor">短調</option>
                        </select>
                      </div>
                    ) : item.keyTonic ? (
                      `${item.keyTonic} ${modeLabels[item.keyMode] || item.keyMode}`
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      item.type === "score" ? (
                        // Score は単一テンポ (defaultTempo)。最小値欄を流用。
                        <div className={styles.inlineGroup}>
                          <span style={{ fontSize: "var(--fs-body)" }}>♩=</span>
                          <input type="number" min={1} max={400} value={editTempoMin}
                            onChange={(e) => setEditTempoMin(e.target.value)}
                            placeholder="120" style={{ width: 70 }} />
                        </div>
                      ) : (
                        <div className={styles.inlineGroup}>
                          <input type="number" min={1} max={400} value={editTempoMin}
                            onChange={(e) => setEditTempoMin(e.target.value)}
                            placeholder="60" style={{ width: 60 }} />
                          <span>〜</span>
                          <input type="number" min={1} max={400} value={editTempoMax}
                            onChange={(e) => setEditTempoMax(e.target.value)}
                            placeholder="90" style={{ width: 60 }} />
                        </div>
                      )
                    ) : item.type === "score" ? (
                      item.tempoMin ? `♩=${item.tempoMin}` : "-"
                    ) : item.tempoMin && item.tempoMax ? (
                      `${item.tempoMin}-${item.tempoMax}`
                    ) : (
                      "-"
                    )}
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
                        {item.type === "score" && item.buildStatus === "done" && (
                          <button
                            type="button"
                            className={styles.secondaryBtn}
                            onClick={() => setVariantScoreId(item.id)}
                            title="難易度・パート変種を作る"
                          >
                            変種
                          </button>
                        )}
                        {item.type === "practice" && item.buildStatus === "done" && (
                          <button
                            type="button"
                            className={styles.secondaryBtn}
                            onClick={() => setArtVariantItemId(item.id)}
                            title="奏法バリエーションを追加する"
                          >
                            奏法
                          </button>
                        )}
                        {item.type === "practice" && item.buildStatus === "done" && (
                          <button
                            type="button"
                            className={styles.secondaryBtn}
                            onClick={() => setRhythmItemId(item.id)}
                            title="リズムパターンを変える"
                          >
                            リズム
                          </button>
                        )}
                        {item.buildStatus === "done" && (
                          <button
                            type="button"
                            className={styles.secondaryBtn}
                            onClick={() => setPartsTarget({ id: item.id, kind: item.type === "score" ? "score" : "practice" })}
                            title="パートを設定する (何個でも追加できます)"
                          >
                            パート
                          </button>
                        )}
                        {/* 技法タグは全自動 (2026-08-28)。編集ボタンは撤去し、件数表示のみ */}
                        {item.techniques.length > 0 && (
                          <span className={styles.secondaryBtn} style={{ cursor: "default", opacity: .75 }} title={item.techniques.map((t) => t.name).join(" ・ ")}>
                            技法 <span className={styles.filterCount}>{item.techniques.length}</span>
                          </span>
                        )}
                        <button
                          type="button"
                          className={styles.dangerBtn}
                          onClick={() => handleDelete(item)}
                          disabled={deletingId === item.id}
                          title="この公式教材を削除"
                        >
                          {deletingId === item.id ? "削除中..." : "削除"}
                        </button>
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

      {variantScoreId && (
        <ScoreVariantDialog scoreId={variantScoreId} onClose={() => setVariantScoreId(null)} />
      )}
      {artVariantItemId && (
        <ArticulationVariantDialog itemId={artVariantItemId} onClose={() => setArtVariantItemId(null)} />
      )}
      {authorOpen && (
        <ScoreAuthorDialog onCreated={() => setAuthorMade(true)} onClose={() => { setAuthorOpen(false); if (authorMade) window.location.reload() }} />
      )}
      {rhythmItemId && (
        <RhythmVariantDialog itemId={rhythmItemId} onClose={() => setRhythmItemId(null)} />
      )}
      {partsTarget && (
        <PartsDialog itemId={partsTarget.id} kind={partsTarget.kind} onClose={() => setPartsTarget(null)} />
      )}
    </div>
  )
}
