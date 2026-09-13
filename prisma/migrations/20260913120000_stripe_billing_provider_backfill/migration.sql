-- 2026-09-13 法務対応 (CR-L3-01): Stripe の契約者に billingProvider = 'stripe' を埋める。
-- これまで billingProvider を書くのは Apple の経路だけだったため、既存の Stripe 契約者は null のまま。
-- 以後は webhook (subscriptionToUserFields) が 'stripe' を書く。画面と退会処理は resolveBillingProvider で列の空白にも耐える。
-- 本番への適用は手動 (npx prisma migrate deploy)。
UPDATE "User"
SET "billingProvider" = 'stripe'
WHERE "stripeSubscriptionId" IS NOT NULL
  AND "billingProvider" IS NULL;
