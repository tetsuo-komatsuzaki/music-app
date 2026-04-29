import { getUserIdsFromParams } from "@/app/_libs/getUserIdsFromParams"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import InquiryClient from "./InquiryClient"

export const metadata = { title: "お問い合わせ | Arcoda" }

export default async function ContactPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const p = await params
  await getUserIdsFromParams(p)

  // ログインメールを返信先デフォルトとして渡す
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  return <InquiryClient defaultEmail={user?.email ?? ""} />
}
