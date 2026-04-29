import { getUserIdsFromParams } from "@/app/_libs/getUserIdsFromParams"
import PrivacyContent from "@/app/components/legal/PrivacyContent"

export const metadata = { title: "プライバシーポリシー | Arcoda" }

export default async function AuthPrivacyPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const p = await params
  await getUserIdsFromParams(p)
  return <PrivacyContent />
}
