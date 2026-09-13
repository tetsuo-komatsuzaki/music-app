"use client"

import { useState, useTransition } from "react"
import { setTeacherEmailOff, setMarketingOff } from "@/app/actions/updateNotificationPref"
import TeacherLinkCard from "./TeacherLinkCard"
import PlanCard from "./PlanCard"
import styles from "./Settings.module.css"
import { TEACHER_FEATURE_ENABLED } from "@/app/_libs/features"

interface Props {
  userId: string
  hasTeacher?: boolean
  teacherEmailOff?: boolean
  marketing?: { email: string; off: boolean }
  billing?: {
    billingEnabled: boolean
    isPlus: boolean
    planStatus: string | null
    periodEnd: string | null
    provider?: string | null
    planGrant?: string | null
    autoRenew?: boolean | null
  }
}

export default function SettingsClient({
  userId: _userId,
  hasTeacher = false,
  teacherEmailOff = false,
  marketing,
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
  // お知らせメール (お便り): オンボーディングで同意した人が、いつでも止められる (特定電子メール法・プライバシーポリシー第12条)
  const [mailOff, setMailOff] = useState(!!marketing?.off)
  const [mailPending, startMailTransition] = useTransition()
  const toggleMarketing = () => {
    const next = !mailOff
    setMailOff(next)
    startMailTransition(async () => {
      const r = await setMarketingOff(next)
      if (!r.ok) setMailOff(!next)
    })
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>設定</h1>

      <div style={{ fontSize: "var(--fs-caption)", fontWeight: 900, letterSpacing: ".06em", color: "var(--text-master)", margin: "2px 2px 8px" }}>アプリ設定</div>

      {/* プラン (課金 Phase 2, 2026-08-07): Stripe 未構成の間は非表示 */}
      {billing && <PlanCard {...billing} />}

      {/* 先生とつながる (先生機能 MVP 2026-07-28)。2026-09-12: 未公開の間は出さない */}
      {TEACHER_FEATURE_ENABLED && <TeacherLinkCard />}

      {/* お知らせメール (2026-09-13): お便り用アドレスを持つ人だけ */}
      {marketing && (
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>お知らせメール</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "var(--fs-subhead)", fontWeight: 700, color: "var(--text-ink)" }}>上達のヒントと新しい曲のお知らせ</div>
              <div style={{ fontSize: "var(--fs-body)", color: "var(--text-sub)", marginTop: 3, lineHeight: 1.6, overflowWrap: "anywhere" }}>
                {marketing.email} にたまに送ります。いつでも止められます。
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!mailOff}
              aria-label="お知らせメール"
              onClick={toggleMarketing}
              disabled={mailPending}
              data-testid="marketing-switch"
              style={{ flex: "none", width: 46, height: 27, borderRadius: 999, border: "none", cursor: "pointer", position: "relative", background: mailOff ? "rgba(150,175,225,.24)" : "#a8c97f", transition: "background .2s" }}
            >
              <span style={{ position: "absolute", top: 3, left: mailOff ? 3 : 22, width: 21, height: 21, borderRadius: "50%", background: "var(--card-in)", boxShadow: "0 1px 2px rgba(0,0,0,.25)", transition: "left .2s" }} />
            </button>
          </div>
          <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", marginTop: 8 }}>
            {mailOff ? "いまはオフ・お知らせは届きません" : "いまはオン"}
          </div>
        </section>
      )}

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

