"use server"

import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { supabaseAdmin } from "@/app/_libs/supabaseAdmin"
import { prisma } from "@/app/_libs/prisma"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import { revokeAppleToken } from "@/app/_libs/apple/appleRevoke"
import { getStripe } from "@/app/_libs/stripe"
import { resolveBillingProvider, shouldCancelStripeOnDeletion, isStripeTerminalStatus } from "@/app/_libs/billingProviderOf"

// =========================================================
// 退会フロー (同期削除、Auth-first)
// =========================================================
//
// 設計: v10 doc section 13 に基づく
// - Idempotency: User.deletedAt + admin.getUserById の 3 way 判定
// - Auth-first: Auth 削除を最初に実行、失敗時は deletedAt ロールバックで無傷状態
// - Storage 削除: chunk + retry + pagination、pathB (auth UUID) ハードコード
// - DB 削除: Cascade で関連レコード一括削除、P2025 (race) は success 扱い
// - 完了通知メール: Resend best effort (失敗しても退会自体は成功扱い)
//
// 既知のトレードオフ:
// - 重ユーザーで Vercel Server Action timeout (60s) のリスク
// - AccountDeletionLog なし → 失敗時の復旧は SQL 直接調査
// =========================================================

export async function requestAccountDeletion(
  { password, confirmWord }: { password?: string; confirmWord?: string }
): Promise<{ success: boolean; error?: string }> {
  if (process.env.ENABLE_ACCOUNT_DELETION !== "true") {
    return { success: false, error: "現在この機能は利用できません" }
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser?.email) return { success: false, error: "認証されていません" }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: authUser.id },
  })

  // dbUser 不在: 退会済ユーザーの別タブからのリクエスト可能性を確認
  if (!dbUser) {
    const { data: authCheck } = await supabaseAdmin.auth.admin.getUserById(authUser.id)
    if (!authCheck?.user) {
      return { success: true }  // 既に退会完了済
    }
    return { success: false, error: "ユーザーが見つかりません" }
  }

  // === Idempotency 判定 ===
  if (dbUser.deletedAt) {
    const { data: authCheck, error: checkError } =
      await supabaseAdmin.auth.admin.getUserById(authUser.id)

    if (checkError) {
      return { success: false, error: "状態確認に失敗しました。時間をおいて再試行してください" }
    }
    if (!authCheck?.user) {
      return { success: true }  // Auth 削除済 = 完了
    }
    // Auth 存在
    const diffSec = (Date.now() - dbUser.deletedAt.getTime()) / 1000
    if (diffSec < 30) {
      return { success: true }  // 二重クリック扱い
    }
    // 30 秒以上経過 + Auth 存在 → 残処理続行 (fall through)
  }

  // === 本人確認 (2026-09-12 要件整理 v2.7 §6) ===
  // email の identity がある人はパスワード再認証。Sign in with Apple だけの人にはパスワードが無いので「退会」の入力で確認する
  const providers = (authUser.app_metadata?.providers as string[] | undefined) ?? []
  if (providers.includes("email")) {
    if (!password) return { success: false, error: "パスワードを入力してください" }
    const tempClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    )
    const { error: signInError } = await tempClient.auth.signInWithPassword({ email: authUser.email, password })
    if (signInError) return { success: false, error: "パスワードが正しくありません" }
  } else if (confirmWord !== "退会") {
    return { success: false, error: "「退会」と入力してください" }
  }

  // Web (Stripe) の契約は退会と同時に解約する (2026-09-13 法務対応・規約第5条の5・特商法)。
  // ここでは状態を見るだけ (retrieve)。Stripe に届かない・状態が読めないなら退会を中断する (CR-L2-03)。
  // 実際の解約 (取り消せない) は Auth 削除が成功した後に行う。先に解約して Auth 削除が失敗すると、
  // アカウントは残るのに契約だけ消え、Web では契約し直せないため (CR-L5-02)。
  // 判定は DB の列に頼らない (2026-09-13 より前の Stripe 契約者は billingProvider が空・CR-L3-01。
  // Web で契約した後に Apple でも契約した人は planStatus が Apple の値に上書きされる・CR-L4-01)。
  // 残してよいのは終端 (canceled / incomplete_expired) だけ。unpaid は請求書が生成され続けるので解約する (CR-L5-01)
  let stripeSubscriptionToCancel: string | null = null
  if (shouldCancelStripeOnDeletion(dbUser) && dbUser.stripeSubscriptionId) {
    try {
      const sub = await getStripe().subscriptions.retrieve(dbUser.stripeSubscriptionId)
      if (isStripeTerminalStatus(sub.status)) {
        console.log(JSON.stringify({ event: "stripe_cancel_on_deletion_terminal", userId: dbUser.id, status: sub.status }))
      } else {
        stripeSubscriptionToCancel = dbUser.stripeSubscriptionId
      }
    } catch (e) {
      const err = e as { code?: string; message?: string }
      const gone = err?.code === "resource_missing"
      console.error(JSON.stringify({ event: gone ? "stripe_check_on_deletion_missing" : "stripe_check_on_deletion_failed", userId: dbUser.id, subscriptionId: dbUser.stripeSubscriptionId, error: err?.message ?? String(e) }))
      if (!gone) {
        return { success: false, error: "契約の状態を確認できませんでした。時間をおいて再試行するか、先に「契約を管理」から解約してください" }
      }
    }
  }

  // === deletedAt セット ===
  await prisma.user.update({
    where: { id: dbUser.id },
    data: { deletedAt: new Date() },
  })

  const userEmail = authUser.email  // Auth 削除前に保持
  const appleRefreshToken = dbUser.appleRefreshToken  // DB 削除前に保持 (失効は Auth 削除の後・CR-L2-11)
  const appleContractNote = resolveBillingProvider(dbUser) === "apple"
    ? "\n\nApp Store で契約したアルコプラスは、退会では止まりません。まだ解約していない場合は、iPhone の設定 › サブスクリプションから解約してください。"
    : ""

  // === Auth 削除 (Auth-first) ===
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(authUser.id)
  if (authError) {
    // ロールバック: deletedAt クリア (Auth 失敗時は何も壊れていない状態に戻す)
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { deletedAt: null },
    })
    console.error(JSON.stringify({
      event: "deletion_failed",
      step: "auth",
      userId: dbUser.id,
      error: authError.message,
      timestamp: new Date().toISOString(),
    }))
    return { success: false, error: "退会申請に失敗しました。時間をおいて再試行してください" }
  }

  // Stripe の解約 (取り消せない) はここで行う。Auth 削除が済んでいるので、失敗しても退会は止めずに記録し、完了メールで知らせる (CR-L5-02)
  let stripeCancelFailedNote = ""
  if (stripeSubscriptionToCancel) {
    try {
      await getStripe().subscriptions.cancel(stripeSubscriptionToCancel)
    } catch (e) {
      const err = e as { code?: string; message?: string }
      const already = err?.code === "resource_missing" || /already (been )?canceled/i.test(err?.message ?? "")
      console.error(JSON.stringify({ event: already ? "stripe_cancel_after_auth_already" : "stripe_cancel_after_auth_failed", userId: dbUser.id, subscriptionId: stripeSubscriptionToCancel, error: err?.message ?? String(e) }))
      if (!already) {
        stripeCancelFailedNote = "\n\nWeb でご契約のアルコプラスの解約処理に失敗しました。お手数ですが、下記のお問い合わせ先までご連絡ください。こちらで解約の手続きをいたします。"
      }
    }
  }

  // Sign in with Apple のトークン失効 (5.1.1(v))。Auth 削除が成功した後に行う (失敗して巻き戻る場合に連携だけ切れないように)。失効の失敗は退会を止めない
  if (providers.includes("apple")) {
    const ok = await revokeAppleToken(appleRefreshToken)
    if (!ok) console.warn(JSON.stringify({ event: "apple_revoke_skipped", userId: dbUser.id }))
  }

  // === Storage 削除 ===
  const storageResult = await cleanupStorage(authUser.id)
  if (!storageResult.ok) {
    console.error(JSON.stringify({
      event: "deletion_failed",
      step: "storage",
      userId: dbUser.id,
      error: storageResult.error,
      timestamp: new Date().toISOString(),
    }))
    return {
      success: false,
      error: "ストレージ削除に失敗しました。サポートにご連絡ください",
    }
  }

  // === DB User 削除 (Cascade で関連消滅) ===
  try {
    await prisma.user.delete({ where: { id: dbUser.id } })
  } catch (e: unknown) {
    // P2025 = Record not found (他リクエストが先に削除済 = 並走完了)
    const prismaError = e as { code?: string; message?: string }
    if (prismaError?.code !== "P2025") {
      console.error(JSON.stringify({
        event: "deletion_failed",
        step: "db",
        userId: dbUser.id,
        error: prismaError?.message ?? String(e),
        timestamp: new Date().toISOString(),
      }))
      return {
        success: false,
        error: "DB 削除に失敗しました。サポートにご連絡ください",
      }
    }
    // P2025 = success として続行
  }

  // === 完了通知メール (best effort) ===
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.ARCODA_NOREPLY_EMAIL!,
      to: userEmail,
      subject: "アルコ 退会完了のお知らせ",
      text: `アルコ (Arcoda) の退会処理が完了しました。
すべてのデータを削除いたしました (Supabase の自動バックアップには保持期間中残存する場合があります)。${appleContractNote}${stripeCancelFailedNote}

ご利用ありがとうございました。

ご不明な点があれば ${process.env.ARCODA_SUPPORT_EMAIL ?? "サポートチーム"} までお問い合わせください。
`.trim(),
    })
  } catch (e) {
    console.error("退会完了メール送信失敗:", e)
  }

  console.log(JSON.stringify({
    event: "deletion_succeeded",
    userId: dbUser.id,
    timestamp: new Date().toISOString(),
  }))

  return { success: true }
}

// =========================================================
// Storage cleanup (chunk + retry + pagination)
// =========================================================

async function cleanupStorage(
  supabaseUserId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const buckets = ["musicxml", "performances"]

  for (const bucket of buckets) {
    const listResult = await listAllRecursive(bucket, supabaseUserId)
    if (!listResult.ok) return listResult

    const allPaths = listResult.paths
    if (allPaths.length === 0) continue

    for (let i = 0; i < allPaths.length; i += 1000) {
      const chunk = allPaths.slice(i, i + 1000)
      let lastError: string | null = null
      for (let attempt = 0; attempt < 3; attempt++) {
        const { error } = await supabaseAdmin.storage.from(bucket).remove(chunk)
        if (!error) {
          lastError = null
          break
        }
        lastError = error.message
        // 指数バックオフ + jitter
        const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 30000)
        await new Promise(r => setTimeout(r, delay))
      }
      if (lastError) {
        return { ok: false, error: `${bucket}: ${lastError}` }
      }
    }
  }
  return { ok: true }
}

async function listAllRecursive(
  bucket: string,
  prefix: string
): Promise<{ ok: true; paths: string[] } | { ok: false; error: string }> {
  const result: string[] = []
  const stack: string[] = [prefix]
  const PAGE_SIZE = 1000

  while (stack.length > 0) {
    const current = stack.pop()!
    let offset = 0
    while (true) {
      const { data, error } = await supabaseAdmin.storage.from(bucket).list(current, {
        limit: PAGE_SIZE,
        offset,
      })
      if (error) {
        // list error は中断 (warn で握りつぶし禁止、GDPR 削除義務違反の温床を排除)
        return {
          ok: false,
          error: `list error: ${bucket}/${current}: ${error.message}`,
        }
      }
      if (!data || data.length === 0) break

      for (const item of data) {
        const fullPath = `${current}/${item.name}`
        if (item.id === null) {
          stack.push(fullPath)
        } else {
          result.push(fullPath)
        }
      }
      if (data.length < PAGE_SIZE) break
      offset += data.length
    }
  }
  return { ok: true, paths: result }
}
