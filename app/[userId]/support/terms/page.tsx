import { getUserIdsFromParams } from "@/app/_libs/getUserIdsFromParams"
import TermsContent from "@/app/components/legal/TermsContent"

export const metadata = { title: "利用規約 | Arcoda" }

export default async function AuthTermsPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const p = await params
  await getUserIdsFromParams(p)
  return <TermsContent />
}
