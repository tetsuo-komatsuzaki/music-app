-- 報酬体系「ギャラリー」骨組み (2026-08-30 実装仕様v1.3・追加のみ=additive-only厳守)
-- 旧コードからは不可視。点灯 (一括公開) まで本番挙動に影響しない。

ALTER TABLE "UserGuideState" ADD COLUMN "treasureNoticeAt" TIMESTAMP(3);
ALTER TABLE "UserGuideState" ADD COLUMN "treasureEvaluatedAt" TIMESTAMP(3);
ALTER TABLE "UserScoreAchievement" ADD COLUMN "masterCelebratedAt" TIMESTAMP(3);
-- 既存のマスター済みは遡及・演出なし (観点1): 授与消化済み扱いで backfill
UPDATE "UserScoreAchievement" SET "masterCelebratedAt" = "masteredAt" WHERE "masteredAt" IS NOT NULL;

CREATE TABLE "UserQuestClear" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "clearedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserQuestClear_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UserQuestClear_userId_questId_key" ON "UserQuestClear"("userId", "questId");
CREATE INDEX "UserQuestClear_userId_idx" ON "UserQuestClear"("userId");
ALTER TABLE "UserQuestClear" ADD CONSTRAINT "UserQuestClear_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "UserTreasure" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "catalogNo" INTEGER,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "awardedAt" TIMESTAMP(3),
    CONSTRAINT "UserTreasure_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UserTreasure_userId_sourceType_sourceId_key" ON "UserTreasure"("userId", "sourceType", "sourceId");
CREATE INDEX "UserTreasure_userId_awardedAt_idx" ON "UserTreasure"("userId", "awardedAt");
ALTER TABLE "UserTreasure" ADD CONSTRAINT "UserTreasure_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "UserActionCount" (
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserActionCount_pkey" PRIMARY KEY ("userId", "action")
);
ALTER TABLE "UserActionCount" ADD CONSTRAINT "UserActionCount_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
