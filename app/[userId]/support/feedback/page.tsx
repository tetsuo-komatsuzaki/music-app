import { getUserIdsFromParams } from "@/app/_libs/getUserIdsFromParams"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import FeedbackClient from "./FeedbackClient"

export const metadata = { title: "フィードバック | Arcoda" }

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const p = await params
  await getUserIdsFromParams(p)

  // ログインメールをデフォルト連絡先として渡す (任意項目のため空でも可)
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  return <FeedbackClient defaultEmail={user?.email ?? ""} />
}
