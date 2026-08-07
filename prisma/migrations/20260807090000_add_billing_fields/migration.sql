-- 課金 Phase 1 (2026-08-07 課金設計確定): Stripe サブスクの写しを User に持つ。
-- Stripe が正・DB は写し。webhook (Phase 2) が planStatus / plan を更新する。
ALTER TABLE "User" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "User" ADD COLUMN "stripeSubscriptionId" TEXT;
ALTER TABLE "User" ADD COLUMN "planStatus" TEXT;
ALTER TABLE "User" ADD COLUMN "planCurrentPeriodEnd" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");
