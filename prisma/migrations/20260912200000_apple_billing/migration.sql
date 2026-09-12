-- Apple のアプリ内課金 (2026-09-12 要件整理 v2.7 §4): User の Apple 列・開発者扱い・お便り・ゲスト列、通知の記録表
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'guest';

ALTER TABLE "User"
  ADD COLUMN "billingProvider" TEXT,
  ADD COLUMN "appleOriginalTransactionId" TEXT,
  ADD COLUMN "appleProductId" TEXT,
  ADD COLUMN "appleEnvironment" TEXT,
  ADD COLUMN "appleAutoRenew" BOOLEAN,
  ADD COLUMN "appleRefreshToken" TEXT,
  ADD COLUMN "planGrant" TEXT,
  ADD COLUMN "marketingEmail" TEXT,
  ADD COLUMN "marketingOptInAt" TIMESTAMP(3),
  ADD COLUMN "marketingOptOutAt" TIMESTAMP(3),
  ADD COLUMN "guestDeviceKey" TEXT,
  ADD COLUMN "guestExpiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_appleOriginalTransactionId_key" ON "User"("appleOriginalTransactionId");
CREATE UNIQUE INDEX "User_guestDeviceKey_key" ON "User"("guestDeviceKey");

CREATE TABLE "AppleNotification" (
    "id" TEXT NOT NULL,
    "notificationUUID" TEXT NOT NULL,
    "notificationType" TEXT NOT NULL,
    "subtype" TEXT,
    "environment" TEXT NOT NULL,
    "originalTransactionId" TEXT,
    "appAccountToken" TEXT,
    "signedPayload" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AppleNotification_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AppleNotification_notificationUUID_key" ON "AppleNotification"("notificationUUID");
CREATE INDEX "AppleNotification_originalTransactionId_idx" ON "AppleNotification"("originalTransactionId");
CREATE INDEX "AppleNotification_createdAt_idx" ON "AppleNotification"("createdAt");
