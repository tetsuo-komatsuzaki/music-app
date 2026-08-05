-- 表現クリア実績 (2026-08-06): 表現力レベル = クリアした曲の★
CREATE TABLE "UserExpressionClear" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "moodTagId" TEXT NOT NULL,
    "scoreId" TEXT NOT NULL,
    "starAtClear" INTEGER NOT NULL,
    "clearedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserExpressionClear_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UserExpressionClear_userId_moodTagId_scoreId_key" ON "UserExpressionClear"("userId", "moodTagId", "scoreId");
CREATE INDEX "UserExpressionClear_userId_moodTagId_idx" ON "UserExpressionClear"("userId", "moodTagId");
ALTER TABLE "UserExpressionClear" ADD CONSTRAINT "UserExpressionClear_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserExpressionClear" ADD CONSTRAINT "UserExpressionClear_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserExpressionClear" ADD CONSTRAINT "UserExpressionClear_scoreId_fkey" FOREIGN KEY ("scoreId") REFERENCES "Score"("id") ON DELETE CASCADE ON UPDATE CASCADE;
