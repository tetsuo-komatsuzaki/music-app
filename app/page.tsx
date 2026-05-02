import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"

export default async function RootPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect(`/${user.id}`)
  }
  redirect("/login")
}
