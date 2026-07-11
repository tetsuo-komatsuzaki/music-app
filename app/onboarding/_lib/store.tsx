"use client"

// ============================================================
// オンボーディング回答ストア (C2・2026-07-11)
// - 画面遷移(history付き) + 回答 + 7セグメント進捗 + ★判定結果
// - ドラフト保存: localStorage(中断→再開で最後の画面から復帰。
//   サーバー保存への昇格は C5)
// ============================================================

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import {
  EMPTY_PROGRESS,
  type ProgressSegKey,
  type ProgressState,
} from "../_components/ProgressBar"
import { judge, type JudgeResult, type LadderAnswers } from "./logic"
import type { CatalogCategory } from "./catalog"
import { saveOnboardingDraft } from "./actions"

export type ScreenId =
  | "SCR01" | "SCR02" | "SCR03" | "SCR04"
  | "L_G1" | "L_G2" | "L_G3" | "L_G3S" | "L_G4" | "L_G5"
  | "SCR07" | "SCR08A" | "SCR08B" | "SCR10" | "SCR08C" | "SCR09"
  | "SCR11" | "SCR11B" | "SCR11C" | "SCR12"

export type Answers = {
  q2?: string
  q3?: string
  q4cat?: string
  q4song?: string
  q4star?: number
  q5?: string
  q6?: string
  q8?: string
  goalDate?: string | null
  goalSong?: string | null
}

type OnboardingState = {
  screen: ScreenId
  history: ScreenId[]
  ans: Answers
  ladder: LadderAnswers
  seg: ProgressState
  result: JudgeResult | null
  songRequest: string | null
}

/** サーバードラフトの受け渡し等で使う公開型 */
export type OnboardingPublicState = OnboardingState

const INITIAL: OnboardingState = {
  screen: "SCR01",
  history: [],
  ans: {},
  ladder: {},
  seg: { ...EMPTY_PROGRESS },
  result: null,
  songRequest: null,
}

const DRAFT_KEY = "arcoda_onboarding_draft_v1"

type Store = OnboardingState & {
  /** 曲カタログ(サーバー=DBが正。失敗時はモックJSONフォールバック) */
  catalog: Record<string, CatalogCategory>
  /** 完了後の遷移先(/{supabaseUserId}) */
  homePath: string
  go: (scr: ScreenId) => void
  back: () => void
  setAns: (patch: Partial<Answers>) => void
  setLadder: (patch: Partial<LadderAnswers>) => void
  setSeg: (key: ProgressSegKey, value: number) => void
  /** ラダー確定。最後の回答は setState 未フラッシュのため patch で受け取る(stale閉包対策) */
  finalizeLadder: (patch?: Partial<LadderAnswers>) => JudgeResult
  setSongRequest: (name: string | null) => void
  resetDraft: () => void
}

const Ctx = createContext<Store | null>(null)

export function OnboardingProvider({
  children,
  catalog,
  homePath,
  serverDraft,
}: {
  children: ReactNode
  catalog: Record<string, CatalogCategory>
  homePath: string
  /** サーバー保存済みドラフト(正)。null=未保存 → localStorageフォールバック */
  serverDraft: Partial<OnboardingState> | null
}) {
  const [state, setState] = useState<OnboardingState>(INITIAL)
  const restored = useRef(false)

  // ドラフト復帰(初回マウント時のみ)。サーバーが正・localStorageはフォールバック(C5)
  useEffect(() => {
    if (restored.current) return
    restored.current = true
    const hydrate = (draft: Partial<OnboardingState>) => {
      const merged: OnboardingState = { ...INITIAL, ...draft }
      // ラダー確定済みなら判定を再計算(サーバードラフトは★のみ保持のため、
      // 仮習得タグを復元する。判定は決定的なので同じ結果になる)
      if ((merged.seg?.ladder ?? 0) >= 1) {
        merged.result = judge({
          beginner: merged.ans.q2 === "これから始める",
          ...merged.ladder,
        })
      }
      setState(merged)
    }
    if (serverDraft?.screen && serverDraft.seg) {
      hydrate(serverDraft)
      return
    }
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const draft = JSON.parse(raw) as OnboardingState
        if (draft.screen && draft.seg) hydrate(draft)
      }
    } catch {
      /* 壊れたドラフトは無視して最初から */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // サーバードラフト保存(画面遷移ごと・fire-and-forget。失敗しても画面は止めない)
  useEffect(() => {
    if (!restored.current || state.screen === "SCR01") return
    void saveOnboardingDraft({
      answers: state.ans as Record<string, unknown>,
      ladder: state.ladder as Record<string, unknown>,
      screen: state.screen,
      seg: state.seg,
      star: state.result?.star ?? null,
    }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.screen])

  // ドラフト保存
  useEffect(() => {
    if (!restored.current) return
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(state))
    } catch {
      /* private mode 等は諦める(必須機能ではない) */
    }
  }, [state])

  const store = useMemo<Store>(
    () => ({
      ...state,
      catalog,
      homePath,
      go: (scr) =>
        setState((s) => ({ ...s, history: [...s.history, s.screen], screen: scr })),
      back: () =>
        setState((s) => {
          if (!s.history.length) return s
          const history = [...s.history]
          const prev = history.pop()!
          return { ...s, history, screen: prev }
        }),
      setAns: (patch) => setState((s) => ({ ...s, ans: { ...s.ans, ...patch } })),
      setLadder: (patch) =>
        setState((s) => ({ ...s, ladder: { ...s.ladder, ...patch } })),
      // バーは戻っても減らさない(v0.4 §A: 戻る・進まないの違和感排除)
      setSeg: (key, value) =>
        setState((s) => ({
          ...s,
          seg: { ...s.seg, [key]: Math.max(s.seg[key], value) },
        })),
      finalizeLadder: (patch = {}) => {
        // 現在レンダーの state + 最終回答パッチで確定計算(表示・証跡・戻り値を一致させる)
        const ladder = { ...state.ladder, ...patch }
        const result = judge({
          beginner: state.ans.q2 === "これから始める",
          ...ladder,
        })
        setState((s) => ({
          ...s,
          ladder: { ...s.ladder, ...patch },
          result,
          seg: { ...s.seg, ladder: 1 },
        }))
        return result
      },
      setSongRequest: (name) => setState((s) => ({ ...s, songRequest: name })),
      resetDraft: () => {
        try {
          localStorage.removeItem(DRAFT_KEY)
        } catch { /* noop */ }
        setState(INITIAL)
      },
    }),
    [state, catalog, homePath],
  )

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useOnboarding(): Store {
  const s = useContext(Ctx)
  if (!s) throw new Error("useOnboarding must be used within OnboardingProvider")
  return s
}
