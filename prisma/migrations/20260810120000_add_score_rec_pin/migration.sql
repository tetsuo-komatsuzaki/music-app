-- ④診断おすすめのピン (2026-08-10): ホーム毎日の基礎練の④枠を (userId×scoreId) で固定。
CREATE TABLE "ScoreRecPin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scoreId" TEXT NOT NULL,
    "practiceItemId" TEXT NOT NULL,
    "subtaskId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ScoreRecPin_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ScoreRecPin_userId_scoreId_key" ON "ScoreRecPin"("userId", "scoreId");
