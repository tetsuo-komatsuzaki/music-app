// 生徒: 先生の添削は曲の演奏画面にインライン表示するようになったため、
// 旧・専用レビュー画面(行き止まり)は曲詳細へリダイレクトして廃止 (2026-08-01)。
import { redirect } from "next/navigation"

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ userId: string; scoreId: string }>
}) {
  const { userId, scoreId } = await params
  redirect(`/${userId}/scores/${scoreId}`)
}
