// 克服した癖 (確定モック karte06 OVERCOME の写経 ・ 2026-08-22 新設ページ)
// back「‹ 成長カルテ」・ h1 ds.t ・ subT「先生が「なおった」と認めたもの」・
// 1枚のDSカードに 緑✓丸 + 癖名13.5px + 「M月D日に なおった ・ 〇〇先生」11px の行。
// データ = TeacherObservation の severity=resolved (タグごと最新)。
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { resolveObsTag } from "@/app/_libs/observationCatalog"
import ds from "@/app/components/ds.module.css"

export const metadata = { title: "克服した癖" }

export default async function OvercomePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  if (user.id !== userId) redirect(`/${user.id}/progress/overcome`)

  const dbUser = await prisma.user.findUnique({ where: { supabaseUserId: user.id }, select: { id: true } })
  if (!dbUser) redirect("/login")

  // タグごと最新の所見が resolved のものだけ (bodyObs と同じ「初出=最新」規則)
  const obs = await prisma.teacherObservation.findMany({
    where: { studentId: dbUser.id },
    orderBy: { createdAt: "desc" },
    select: { tagIds: true, severity: true, createdAt: true, teacher: { select: { name: true } } },
  })
  const seen = new Set<string>()
  const overcome: { label: string; date: string; teacher: string }[] = []
  for (const o of obs) {
    for (const t of o.tagIds) {
      if (seen.has(t)) continue
      seen.add(t)
      if (o.severity === "resolved") {
        const label = resolveObsTag(t)?.label
        if (label) {
          overcome.push({
            label,
            date: `${o.createdAt.getMonth() + 1}月${o.createdAt.getDate()}日`,
            teacher: o.teacher?.name ?? "先生",
          })
        }
      }
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 0 60px" }}>
      <Link href={`/${userId}/progress`}
        style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--text-sub)", fontSize: 13, fontWeight: 700, padding: "10px 2px 2px", textDecoration: "none" }}>
        ‹ 成長カルテ
      </Link>
      <h1 className={ds.t} style={{ paddingTop: 0 }}>克服した癖</h1>
      <div style={{ color: "var(--text-sub)", fontSize: 13, padding: "5px 2px 0" }}>先生が「なおった」と認めたもの</div>

      <div className={ds.card}>
        {overcome.length === 0 ? (
          <div style={{ fontSize: "var(--fs-body)", color: "var(--text-sub)", lineHeight: 1.8 }}>
            まだ克服の記録はないよ。先生が「なおった」と認めると、ここに刻まれていくよ。
          </div>
        ) : overcome.map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginTop: i === 0 ? 0 : 11, paddingTop: i === 0 ? 0 : 11, borderTop: i === 0 ? "none" : "1px solid rgba(150,175,225,.08)" }}>
            <span style={{ width: 26, height: 26, borderRadius: "50%", flex: "none", display: "grid", placeItems: "center", background: "rgba(168,201,127,.16)", border: "1px solid rgba(168,201,127,.4)", color: "#a8c97f" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            </span>
            <div style={{ minWidth: 0 }}>
              <b style={{ fontSize: 13.5, color: "var(--text-ink)", display: "block" }}>{t.label}</b>
              <span style={{ display: "block", fontSize: 11, color: "var(--text-sub)" }}>{t.date}に なおった ・ {t.teacher}先生</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
