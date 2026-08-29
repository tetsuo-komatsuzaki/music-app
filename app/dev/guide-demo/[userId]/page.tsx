// dev専用: 「アルコと最初の1周」画面複製ハーネス (本番導線からは一切参照されない)。
// /dev/guide-demo/demo?step=N で各ステップを表示し、モックとの誤差ゼロ突き合わせに使う。
// [userId] セグメントは HomeClient 等の useParams 用 (値は "demo" を想定・DBは見ない)。
import GuideDemoClient from "@/app/[userId]/_guide/GuideDemoClient"

export const dynamic = "force-dynamic"

export default async function GuideDemoPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>
}) {
  const sp = await searchParams
  const step = Number(sp.step ?? 0)
  return <GuideDemoClient initialStep={Number.isFinite(step) ? step : 0} />
}
