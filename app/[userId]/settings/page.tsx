import { getUserIdsFromParams } from "@/app/_libs/getUserIdsFromParams"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { prisma } from "@/app/_libs/prisma"
import { redirect } from "next/navigation"
import SettingsClient from "./SettingsClient"

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const p = await params

  // 認証 + URL ↔ session 一致は helper 内部で完結 (失敗時は redirect 投げる)
  const { dbUserId } = await getUserIdsFromParams(p)

  // helper は ID のみ返すので、email / name は別途取得
  const supabase = await createServerSupabaseClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  const dbUser = await prisma.user.findUnique({
    where: { id: dbUserId },
    select: { name: true },
  })
  // helper を通過していれば dbUser は存在するはず、念のため
  if (!dbUser) redirect("/login")

  return (
    <SettingsClient
      userId={dbUserId}
      initialName={dbUser.name}
      currentEmail={authUser?.email ?? ""}
      accountDeletionEnabled={process.env.ENABLE_ACCOUNT_DELETION === "true"}
    />
  )
}
