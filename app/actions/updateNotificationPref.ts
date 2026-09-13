"use server"

// 通知メールの配信停止設定 (2026-08-01)。生徒が「先生からの通知メール」をオフにできる。
import { prisma } from "@/app/_libs/prisma"
import { requireAuthAction } from "@/app/_libs/requireAuth"

export async function setTeacherEmailOff(
  off: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  try {
    await prisma.user.update({
      where: { id: auth.user.dbUser.id },
      data: { teacherEmailOff: off },
    })
    return { ok: true }
  } catch {
    return { ok: false, error: "設定の保存に失敗しました" }
  }
}

/** お知らせメール (お便り) の受け取り停止・再開 (2026-09-13 法務対応)。
 *  特定電子メール法: 受信拒否の通知を受けたら以後は送らない。marketingOptOutAt を正とし、配信側は optOutAt が null かつ optInAt ありの人にだけ送る。 */
export async function setMarketingOff(
  off: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  try {
    await prisma.user.update({
      where: { id: auth.user.dbUser.id },
      data: off
        ? { marketingOptOutAt: new Date() }
        : { marketingOptOutAt: null, marketingOptInAt: new Date() },
    })
    return { ok: true }
  } catch {
    return { ok: false, error: "設定の保存に失敗しました" }
  }
}
