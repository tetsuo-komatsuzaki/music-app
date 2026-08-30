// dev専用: 報酬体系骨組みの検証ハーネス (本番導線からは一切参照されない)。
// /dev/treasure-demo/demo?s=card|mixed|coins|shelves|medal|cert|nintei
import TreasureDemoClient from "@/app/[userId]/_gallery/TreasureDemoClient"

export const dynamic = "force-dynamic"

export default async function TreasureDemoPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>
}) {
  const sp = await searchParams
  return <TreasureDemoClient scenario={sp.s ?? "card"} />
}
