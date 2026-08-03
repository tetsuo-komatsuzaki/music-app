// シェア公開ページ (2026-08-03): /s/[token] — 認証不要 (middlewareは/s/*を素通り)。
// SNSカード(OGP静止画)をタップした人が着地する「動く」ページ:
// お祝い系=紙吹雪が降る / 報告系=音符が五線譜の上を流れる (A-1確定)。
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { prisma } from "@/app/_libs/prisma"
import { type SharePayload, isShareKind, shareOgTitle, shareText } from "@/app/_libs/shareCard"
import SharePublicView from "./SharePublicView"

async function getCard(token: string) {
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(token)) return null
  const card = await prisma.shareCard.findUnique({
    where: { token },
    select: { kind: true, displayName: true, payload: true, createdAt: true },
  })
  if (!card || !isShareKind(card.kind)) return null
  return { ...card, kind: card.kind, payload: (card.payload ?? {}) as SharePayload }
}

export async function generateMetadata(
  { params }: { params: Promise<{ token: string }> },
): Promise<Metadata> {
  const { token } = await params
  const card = await getCard(token)
  if (!card) return { title: "アルコ" }
  return {
    title: shareOgTitle(card.kind, card.payload, card.displayName),
    description: shareText(card.kind, card.payload),
    robots: { index: false }, // 公開だが検索には載せない
  }
}

export default async function SharePage(
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const card = await getCard(token)
  if (!card) notFound()
  return (
    <SharePublicView
      kind={card.kind}
      payload={card.payload}
      displayName={card.displayName}
      token={token}
    />
  )
}
