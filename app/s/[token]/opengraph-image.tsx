// シェアOG画像 (2026-08-03): 1200×630。ファイル規約により /s/[token] の og:image に自動登録される。
// SNSタイムラインのカードはこの静止画 (アニメはタップ先の公開ページ側)。
import { ImageResponse } from "next/og"
import { prisma } from "@/app/_libs/prisma"
import { type SharePayload, isShareKind } from "@/app/_libs/shareCard"
import { ShareOgCard, loadShareFonts } from "@/app/_libs/shareOg"

export const runtime = "nodejs"
export const alt = "アルコのシェアカード"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const card = token
    ? await prisma.shareCard.findUnique({
        where: { token },
        select: { kind: true, displayName: true, payload: true },
      })
    : null
  if (!card || !isShareKind(card.kind)) {
    return new ImageResponse(
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#fffdf6" }} />,
      size,
    )
  }
  const payload = (card.payload ?? {}) as SharePayload
  const fonts = await loadShareFonts(card.kind, payload, card.displayName)
  return new ImageResponse(
    <ShareOgCard kind={card.kind} payload={payload} displayName={card.displayName} width={size.width} height={size.height} />,
    {
      ...size,
      fonts: fonts.length ? fonts.map((f) => ({ name: f.name, data: f.data, weight: f.weight })) : undefined,
    },
  )
}
