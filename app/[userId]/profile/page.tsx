// プロフィール (2026-08-17 ナビ刷新で全面差し替え)。
// 旧「マイページ」のグレード詳細は廃止 (成長カルテと役割が重複していたため)。
// 代わりに、設定画面にあった「アカウント情報」「アカウント管理」をここへ移設した。
// 設定はアプリ設定 (プラン・目標・先生・通知) だけを担う。
import { getUserIdsFromParams } from "@/app/_libs/getUserIdsFromParams"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { prisma } from "@/app/_libs/prisma"
import { redirect } from "next/navigation"
import AccountInfo from "./AccountInfo"
import styles from "../settings/Settings.module.css"

export const metadata = { title: "プロフィール" }

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const p = await params
  const { dbUserId } = await getUserIdsFromParams(p)

  const supabase = await createServerSupabaseClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  const dbUser = await prisma.user.findUnique({
    where: { id: dbUserId },
    select: { name: true },
  })
  if (!dbUser) redirect("/login")

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>プロフィール</h1>
      <AccountInfo
        initialName={dbUser.name ?? ""}
        currentEmail={authUser?.email ?? ""}
        accountDeletionEnabled={process.env.ENABLE_ACCOUNT_DELETION === "true"}
      />
    </div>
  )
}
