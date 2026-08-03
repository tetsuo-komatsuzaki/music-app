// シェアIG縦画像 (2026-08-03): 1080×1350 (4:5)。Instagram の画像ファイル共有・保存用。
// GET /s/<token>/ig-image — 公開 (middleware は /s/* を素通り)。
import { ImageResponse } from "next/og"
import { prisma } from "@/app/_libs/prisma"
import { type SharePayload, isShareKind } from "@/app/_libs/shareCard"
import { ShareOgCard, loadShareFonts } from "@/app/_libs/shareOg"

export const runtime = "nodejs"
const W = 1080
const H = 1350

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const card = await prisma.shareCard.findUnique({
    where: { token },
    select: { kind: true, displayName: true, payload: true },
  })
  if (!card || !isShareKind(card.kind)) {
    return new Response("not found", { status: 404 })
  }
  const payload = (card.payload ?? {}) as SharePayload
  const fonts = await loadShareFonts(card.kind, payload, card.displayName)
  return new ImageResponse(
    <ShareOgCard kind={card.kind} payload={payload} displayName={card.displayName} width={W} height={H} vertical />,
    {
      width: W, height: H,
      fonts: fonts.length ? fonts.map((f) => ({ name: f.name, data: f.data, weight: f.weight })) : undefined,
      headers: { "Cache-Control": "public, max-age=31536000, immutable" },
    },
  )
}
