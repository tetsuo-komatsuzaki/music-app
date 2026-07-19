-- 譜面注釈（Phase 1）: ハイライト/テキスト/注意メモ/記譜スタンプを音符アンカーで保持。
-- CreateTable
CREATE TABLE "ScoreAnnotation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scoreId" TEXT,
    "practiceItemId" TEXT,
    "data" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoreAnnotation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScoreAnnotation_userId_idx" ON "ScoreAnnotation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ScoreAnnotation_userId_scoreId_key" ON "ScoreAnnotation"("userId", "scoreId");

-- CreateIndex
CREATE UNIQUE INDEX "ScoreAnnotation_userId_practiceItemId_key" ON "ScoreAnnotation"("userId", "practiceItemId");
