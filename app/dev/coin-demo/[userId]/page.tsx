// dev専用: 達成コイン獲得モーションの複製ハーネス (本番導線からは一切参照されない)。
// /dev/coin-demo/demo で案Aモーションを再生し、coin-motions.html モックと突き合わせる。
// [userId] セグメントは HomeClient の useParams 用 (値は "demo" を想定・DBは見ない)。
import CoinDemoClient from "@/app/[userId]/_coin/CoinDemoClient"

export const dynamic = "force-dynamic"

export default async function CoinDemoPage({
  searchParams,
}: {
  searchParams: Promise<{ two?: string }>
}) {
  const sp = await searchParams
  return <CoinDemoClient two={sp.two === "1"} />
}
