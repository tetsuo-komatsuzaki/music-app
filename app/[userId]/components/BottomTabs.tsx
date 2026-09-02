"use client"

// ボトムタブ (2026-08-17 ナビ要件定義 SECTION 01)。
// サイドバーを廃止し、ホーム / ライブラリ / カルテ / 先生 の4タブに集約する。
// 先生タブは TeacherStudent の有無でラベルと遷移先を出し分け、未読があればバッジを出す。
// 未読の算出は既存の getTeacherStudentSummary をそのまま使う (新規定義しない)。
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useParams } from "next/navigation"
import { Home, Library, BarChart3, MessageCircle, type LucideIcon } from "lucide-react"
import { getTeacherStudentSummary } from "@/app/actions/teacherStudentViews"
import styles from "./BottomTabs.module.css"

type Tab = { key: string; path: string; Icon: LucideIcon; label: string; match: (p: string, base: string) => boolean }

/** ライブラリ配下とみなすパス (曲・練習・レッスンを吸収する) */
const LIBRARY_PREFIXES = ["/library", "/scores", "/practice", "/lessons"]
/** カルテ配下とみなすパス */
const KARTE_PREFIXES = ["/progress", "/records"]
/** 先生配下とみなすパス */
const TEACHER_PREFIXES = ["/my-teacher", "/find-teacher"]

const startsWithAny = (rest: string, list: string[]) => list.some((p) => rest === p || rest.startsWith(p + "/"))

const TABS: Tab[] = [
  { key: "home", path: "", Icon: Home, label: "ホーム", match: (rest) => rest === "" },
  { key: "library", path: "library", Icon: Library, label: "ライブラリ", match: (rest) => startsWithAny(rest, LIBRARY_PREFIXES) },
  { key: "karte", path: "progress", Icon: BarChart3, label: "カルテ", match: (rest) => startsWithAny(rest, KARTE_PREFIXES) },
]

export default function BottomTabs() {
  const params = useParams()
  const pathname = usePathname() ?? ""
  const userId = params.userId as string
  const [hasTeacher, setHasTeacher] = useState<boolean | null>(null)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    getTeacherStudentSummary()
      .then((s) => { setHasTeacher(s.hasTeacher); setUnread(s.unreadMessages) })
      .catch(() => setHasTeacher(false))
  }, [userId])

  const base = `/${userId}`
  const rest = pathname.startsWith(base) ? pathname.slice(base.length) : pathname

  // 先生タブ (2026-09-02 Tetsuo確定 A案): 先生機能は未公開なので、先生がいないときは
  // タブごと出さない (3つになる)。以前は「先生をさがす」を出していたが、押しても
  // 先生が見つからない画面に着くだけで空振りしていた。公開時に4つへ戻す。
  // 判定前 (null) は先生タブを出す = チラつきを抑える (先生ありユーザーの体験を優先)
  const teacherTab: Tab | null = hasTeacher === false
    ? null
    : { key: "teacher", path: "my-teacher", Icon: MessageCircle, label: "先生", match: (r) => startsWithAny(r, TEACHER_PREFIXES) }

  const tabs = teacherTab ? [...TABS, teacherTab] : TABS

  return (
    <nav className={styles.bar} aria-label="メインナビゲーション">
      <div className={styles.inner}>
        {tabs.map((t) => {
          const active = t.match(rest, base)
          const Icon = t.Icon
          return (
            <Link
              key={t.key}
              href={t.path ? `${base}/${t.path}` : base}
              replace
              data-onboarding={`tab.${t.key}`}
              className={`${styles.tab} ${active ? styles.active : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <span className={styles.iconWrap}>
                <Icon size={23} strokeWidth={active ? 2.4 : 2} />
                {t.key === "teacher" && unread > 0 && (
                  <span className={styles.badge} aria-label={`未読${unread}件`}>
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </span>
              <span className={styles.label}>{t.label}</span>
              {active && <span className={styles.dot} aria-hidden />}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
