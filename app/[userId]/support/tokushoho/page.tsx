import { getUserIdsFromParams } from "@/app/_libs/getUserIdsFromParams"
import TokushohoContent from "@/app/components/legal/TokushohoContent"

export const metadata = { title: "特定商取引法に基づく表記" }

// サポート内の特商法ページ (2026-09-13)。/tokushoho と同じ本文。契約者が設定→サポートから辿れるように
export default async function AuthTokushohoPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const p = await params
  await getUserIdsFromParams(p)
  return <TokushohoContent />
}
