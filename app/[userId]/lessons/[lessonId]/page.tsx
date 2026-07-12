// 学びレッスン詳細 (INTRO→スライド5枚→弾いてみる→クリア)
// サーバー側: レッスン⇔教材の解決・楽譜署名URL・現在の演奏回数を渡すだけ。
// 判定(窓あき発音チェック)と進行はすべてクライアント (確定#3)。
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/app/_libs/prisma"
import { storageAdmin } from "@/app/_libs/storageAdmin"
import { encodeSignedUrl } from "@/app/_libs/encodeSignedUrl"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { getLessonInventory, getUserLessonState, tagId } from "@/app/_libs/lessonStatus"
import { LESSON_BY_ID } from "../_lib/content"
import LessonPlayer from "../_components/LessonPlayer"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lessonId: string }>
}) {
  const { lessonId } = await params
  return { title: LESSON_BY_ID.get(lessonId)?.name ?? "学びレッスン" }
}

export default async function LessonDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string; lessonId: string }>
  searchParams: Promise<{ return?: string }>
}) {
  const { userId, lessonId } = await params
  const sp = await searchParams
  // 「曲にもどる」復帰先 (UI要件v1.1 §4)。オープンリダイレクト防止で自ユーザー配下のみ許可
  const returnUrl =
    sp.return && sp.return.startsWith(`/${userId}/`) ? sp.return : null
  const lesson = LESSON_BY_ID.get(lessonId)
  if (!lesson) notFound()

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  if (user.id !== userId) redirect(`/${user.id}/lessons/${lessonId}`)

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: user.id },
    select: { id: true },
  })
  if (!dbUser) redirect("/login")

  const [inventory, state] = await Promise.all([
    getLessonInventory(),
    getUserLessonState(dbUser.id),
  ])
  const item = inventory.get(tagId(lesson.tag))
  if (!item || item.buildStatus !== "done" || !item.generatedXmlPath) {
    // 教材未公開 (準備中) — 一覧へ戻す (確定#6 段階公開)
    redirect(`/${userId}/lessons`)
  }

  const [{ data: signed }, itemMeta] = await Promise.all([
    storageAdmin.storage.from("musicxml").createSignedUrl(item.generatedXmlPath, 600),
    prisma.practiceItem.findUnique({
      where: { id: item.practiceItemId },
      select: { metadata: true },
    }),
  ])
  const buildUrl = signed?.signedUrl ? encodeSignedUrl(signed.signedUrl) : null
  if (!buildUrl) redirect(`/${userId}/lessons`)

  // お手本音源 (確定③: 専用録音の差し替え設計。未登録の間は合成再生フォールバック)
  const meta = itemMeta?.metadata as { exemplarAudioUrl?: string } | null
  const exemplarAudioUrl =
    typeof meta?.exemplarAudioUrl === "string" ? meta.exemplarAudioUrl : null

  return (
    <LessonPlayer
      lessonId={lesson.id}
      practiceItemId={item.practiceItemId}
      buildUrl={buildUrl}
      guideBpm={item.tempoMin ?? 60}
      initialPlayCount={state.plays.get(item.practiceItemId) ?? 0}
      alreadyCleared={state.cleared.has(tagId(lesson.tag))}
      listHref={`/${userId}/lessons`}
      returnUrl={returnUrl}
      exemplarAudioUrl={exemplarAudioUrl}
    />
  )
}
