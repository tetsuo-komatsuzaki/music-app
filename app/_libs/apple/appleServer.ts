import "server-only"
// Apple の署名つきデータ (App Store Server Notifications V2 / StoreKit 2 の JWS) の検証と、User への写し (2026-09-12 要件整理 v2.7 §2・§4)。
//
// 検証: JWS の x5c 証明書チェーン (leaf → 中間 → Apple Root CA G3) を node:crypto の X509Certificate で辿り、
// 根が同梱の Apple Root CA G3 (SHA-256 指紋で照合) であることを確かめてから、leaf の公開鍵で署名を検証する。
// bundleId と environment も照合する。Apple が正・DB は写し (Stripe の原則をそのまま移す)。
import { X509Certificate } from "node:crypto"
import { readFileSync } from "node:fs"
import path from "node:path"
import { compactVerify, decodeProtectedHeader, importX509 } from "jose"
import { prisma } from "@/app/_libs/prisma"
import { APPLE_PRODUCT_IDS } from "@/app/_libs/plan"

export const APPLE_BUNDLE_ID = "com.arcodaviolin.app"
/** Apple Root CA - G3 の SHA-256 指紋 (openssl で取得・2026-09-12) */
const APPLE_ROOT_FINGERPRINT_SHA256 = "63:34:3A:BF:B8:9A:6A:03:EB:B5:7E:9B:3F:5F:A7:BE:7C:4F:5C:75:6F:30:17:B3:A8:C4:88:C3:65:3E:91:79"

let rootCert: X509Certificate | null = null
function appleRoot(): X509Certificate {
  if (!rootCert) {
    const pem = readFileSync(path.join(process.cwd(), "app/_libs/apple/AppleRootCA-G3.pem"), "utf8")
    rootCert = new X509Certificate(pem)
    if (rootCert.fingerprint256 !== APPLE_ROOT_FINGERPRINT_SHA256) throw new Error("Apple Root CA の指紋が一致しません")
  }
  return rootCert
}

function derToPem(b64: string): string {
  return `-----BEGIN CERTIFICATE-----\n${b64.replace(/(.{64})/g, "$1\n").trim()}\n-----END CERTIFICATE-----`
}

/** x5c チェーンを検証し、leaf の PEM を返す */
function verifyChain(x5c: string[]): string {
  if (!x5c || x5c.length < 2) throw new Error("x5c が不足しています")
  const certs = x5c.map((c) => new X509Certificate(derToPem(c)))
  const now = new Date()
  for (const c of certs) {
    if (now < new Date(c.validFrom) || now > new Date(c.validTo)) throw new Error("証明書の有効期限外です")
  }
  for (let i = 0; i < certs.length - 1; i++) {
    if (!certs[i].verify(certs[i + 1].publicKey)) throw new Error(`証明書チェーンの検証に失敗しました (${i})`)
  }
  const last = certs[certs.length - 1]
  const root = appleRoot()
  // 最後の証明書が root そのものか、root が署名した中間証明書か
  const anchored = last.fingerprint256 === root.fingerprint256 || last.verify(root.publicKey)
  if (!anchored) throw new Error("Apple Root CA に到達しません")
  return derToPem(x5c[0])
}

/** Apple の JWS を検証してペイロードを返す */
export async function verifyAppleJws<T = Record<string, unknown>>(jws: string): Promise<T> {
  const header = decodeProtectedHeader(jws)
  const x5c = header.x5c as string[] | undefined
  if (!x5c) throw new Error("x5c がありません")
  const leafPem = verifyChain(x5c)
  const key = await importX509(leafPem, (header.alg as string) || "ES256")
  const { payload } = await compactVerify(jws, key)
  return JSON.parse(new TextDecoder().decode(payload)) as T
}

// ── Apple のペイロード型 (必要な項目だけ) ──
export type AppleTransaction = {
  originalTransactionId: string
  transactionId: string
  productId: string
  bundleId: string
  environment: "Sandbox" | "Production"
  appAccountToken?: string
  purchaseDate: number
  expiresDate?: number
  revocationDate?: number
  offerType?: number // 1 = 導入オファー (無料期間)
  type?: string
}
export type AppleRenewalInfo = {
  originalTransactionId: string
  autoRenewStatus: number // 1 = 自動更新オン
  autoRenewProductId?: string
  expirationIntent?: number
  isInBillingRetryPeriod?: boolean
  environment: "Sandbox" | "Production"
}
export type AppleNotificationPayload = {
  notificationType: string
  subtype?: string
  notificationUUID: string
  data?: { bundleId: string; environment: "Sandbox" | "Production"; signedTransactionInfo?: string; signedRenewalInfo?: string }
  version?: string
  signedDate?: number
}

export function isKnownProduct(productId: string): boolean {
  return productId === APPLE_PRODUCT_IDS.yearly || productId === APPLE_PRODUCT_IDS.monthly
}

/** 取引と更新情報から planStatus を決める。請求猶予は無し (失敗した瞬間に expired) */
export function derivePlanStatus(tx: AppleTransaction, renewal: AppleRenewalInfo | null, now = Date.now()): "trialing" | "active" | "expired" {
  if (tx.revocationDate) return "expired"
  if (tx.expiresDate != null && tx.expiresDate <= now) return "expired"
  if (renewal?.isInBillingRetryPeriod) return "expired"
  if (tx.offerType === 1) return "trialing"
  return "active"
}

export type ApplyResult = { ok: true; userId: string; status: string } | { ok: false; reason: "no_user" | "conflict" | "unknown_product" | "bundle" }

/**
 * 検証済みの取引を User に写す。持ち主は appAccountToken (supabaseUserId) か既存の originalTransactionId で引く。
 * 別のアカウントに結び済みの取引は付け替えない (乗っ取り防止)。
 */
export async function applyTransaction(tx: AppleTransaction, renewal: AppleRenewalInfo | null, opts?: { forUserId?: string }): Promise<ApplyResult> {
  if (tx.bundleId !== APPLE_BUNDLE_ID) return { ok: false, reason: "bundle" }
  if (!isKnownProduct(tx.productId)) return { ok: false, reason: "unknown_product" }

  const owner = await prisma.user.findUnique({ where: { appleOriginalTransactionId: tx.originalTransactionId }, select: { id: true, supabaseUserId: true } })
  let target: { id: string } | null = null
  if (opts?.forUserId) {
    // アプリからの購入証明・復元: いまのユーザーに結ぶ。他人に結び済みなら衝突
    if (owner && owner.supabaseUserId !== opts.forUserId) return { ok: false, reason: "conflict" }
    target = await prisma.user.findUnique({ where: { supabaseUserId: opts.forUserId }, select: { id: true } })
  } else if (owner) {
    target = owner
  } else if (tx.appAccountToken) {
    target = await prisma.user.findUnique({ where: { supabaseUserId: tx.appAccountToken }, select: { id: true } })
  }
  if (!target) return { ok: false, reason: "no_user" }

  const status = derivePlanStatus(tx, renewal)
  await prisma.user.update({
    where: { id: target.id },
    data: {
      billingProvider: "apple",
      appleOriginalTransactionId: tx.originalTransactionId,
      appleProductId: tx.productId,
      appleEnvironment: tx.environment,
      appleAutoRenew: renewal ? renewal.autoRenewStatus === 1 : undefined,
      plan: "plus",
      planStatus: status,
      planCurrentPeriodEnd: tx.expiresDate ? new Date(tx.expiresDate) : null,
    },
  })
  return { ok: true, userId: target.id, status }
}
