-- 「アルコと最初の1周」ガイドとクエストの進行 (2026-08-29)
CREATE TABLE "UserGuideState" (
    "userId" TEXT NOT NULL,
    "firstLoopStep" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "skippedAt" TIMESTAMP(3),
    "quests" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserGuideState_pkey" PRIMARY KEY ("userId")
);
ALTER TABLE "UserGuideState" ADD CONSTRAINT "UserGuideState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
