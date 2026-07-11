-- 工程G (2026-07-11): スタッカート系曖昧記号の管理者確認キュー

CREATE TABLE "TechniqueConfirmation" (
    "id" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "noteCount" INTEGER NOT NULL DEFAULT 0,
    "measures" INTEGER[],
    "status" TEXT NOT NULL DEFAULT 'pending',
    "resolvedTag" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechniqueConfirmation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TechniqueConfirmation_targetType_targetId_pattern_key"
    ON "TechniqueConfirmation"("targetType", "targetId", "pattern");
CREATE INDEX "TechniqueConfirmation_status_idx" ON "TechniqueConfirmation"("status");
