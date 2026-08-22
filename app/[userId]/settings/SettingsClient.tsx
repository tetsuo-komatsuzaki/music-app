"use client"

import { useState, useTransition } from "react"
import { setTeacherEmailOff } from "@/app/actions/updateNotificationPref"
import TeacherLinkCard from "./TeacherLinkCard"
import GoalCard from "./GoalCard"
import PlanCard from "./PlanCard"
import styles from "./Settings.module.css"

interface Props {
  userId: string
  hasTeacher?: boolean
  teacherEmailOff?: boolean
  billing?: {
    billingEnabled: boolean
    isPlus: boolean
    planStatus: string | null
    periodEnd: string | null
    trialEligible: boolean
  }
}

export default function SettingsClient({
  userId: _userId,
  hasTeacher = false,
  teacherEmailOff = false,
  billing,
}: Props) {
  // 先生からの通知メール: オフ(配信停止)にできる
  const [emailOff, setEmailOff] = useState(teacherEmailOff)
  const [notifyPending, startNotifyTransition] = useTransition()
  const toggleTeacherEmail = () => {
    const next = !emailOff
    setEmailOff(next)
    startNotifyTransition(async () => {
      const r = await setTeacherEmailOff(next)
      if (!r.ok) setEmailOff(!next) // 失敗したら戻す
    })
  }
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>設定</h1>

      <div style={{ fontSize: "var(--fs-caption)", fontWeight: 900, letterSpacing: ".06em", color: "var(--text-master)", margin: "2px 2px 8px" }}>アプリ設定</div>

      {/* プラン (課金 Phase 2, 2026-08-07): Stripe 未構成の間は非表示 */}
      {billing && <PlanCard {...billing} />}

      {/* 目標の変更 (2026-08-02): オンボで答えた目標曲/時期/かなえたいこと */}
      <GoalCard />

      {/* 先生とつながる (先生機能 MVP 2026-07-28) */}
      <TeacherLinkCard />

      {/* 通知設定 (先生がいる生徒のみ・2026-08-01) */}
      {hasTeacher && (
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>通知</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "var(--fs-subhead)", fontWeight: 700, color: "var(--text-ink)" }}>先生からの通知メール</div>
              <div style={{ fontSize: "var(--fs-body)", color: "var(--text-sub)", marginTop: 3, lineHeight: 1.6 }}>
                先生から宿題・添削・コメントが届いたとき、登録メールにお知らせします。
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!emailOff}
              onClick={toggleTeacherEmail}
              disabled={notifyPending}
              style={{ flex: "none", width: 46, height: 27, borderRadius: 999, border: "none", cursor: "pointer", position: "relative", background: emailOff ? "rgba(150,175,225,.24)" : "#a8c97f", transition: "background .15s", padding: 0 }}
            >
              <span style={{ position: "absolute", top: 3, left: emailOff ? 3 : 22, width: 21, height: 21, borderRadius: "50%", background: "var(--card-in)", boxShadow: "0 1px 2px rgba(0,0,0,.25)", transition: "left .15s" }} />
            </button>
          </div>
          <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", marginTop: 8 }}>
            {emailOff ? "いまはオフ" : "いまはオン"}
          </div>
        </section>
      )}


</div>
  )
}

