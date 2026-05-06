-- CreateEnum
CREATE TYPE "CardType" AS ENUM ('task', 'sub_task');

-- CreateEnum
CREATE TYPE "CardStatus" AS ENUM ('active', 'improving', 'cleared');

-- CreateEnum
CREATE TYPE "GradeLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'MASTER');

-- AlterTable
ALTER TABLE "PracticeItem" ADD COLUMN     "difficulty" INTEGER,
ADD COLUMN     "skillSubTaskTags" JSONB;

-- AlterTable
ALTER TABLE "PracticePerformance" ADD COLUMN     "bowingSkillScore" DOUBLE PRECISION,
ADD COLUMN     "pitchSkillScore" DOUBLE PRECISION,
ADD COLUMN     "problematicPositions" JSONB,
ADD COLUMN     "rhythmSkillScore" DOUBLE PRECISION,
ADD COLUMN     "skillSubScores" JSONB;

-- CreateTable
CREATE TABLE "UserSkillScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillTaskId" TEXT NOT NULL,
    "currentScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sampleCount" INTEGER NOT NULL DEFAULT 0,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSkillScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSkillSubScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillSubTaskId" TEXT NOT NULL,
    "matchedCount" INTEGER NOT NULL DEFAULT 0,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "matchRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageScore" DOUBLE PRECISION,
    "lastMatchedAt" TIMESTAMP(3),
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSkillSubScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSkillTaskCard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cardType" "CardType" NOT NULL,
    "skillTaskId" TEXT,
    "skillSubTaskId" TEXT,
    "status" "CardStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "improvedAt" TIMESTAMP(3),
    "clearedAt" TIMESTAMP(3),
    "lastMatchedAt" TIMESTAMP(3),

    CONSTRAINT "UserSkillTaskCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGrade" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentGrade" "GradeLevel" NOT NULL DEFAULT 'BEGINNER',
    "achievedAt" TIMESTAMP(3),
    "progressData" JSONB NOT NULL DEFAULT '{}',
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserGrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceSkillFeedback" (
    "id" TEXT NOT NULL,
    "practicePerformanceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "selectedSubTaskId" TEXT,
    "feedbackType" TEXT NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceSkillFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserSkillScore_userId_skillTaskId_idx" ON "UserSkillScore"("userId", "skillTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSkillScore_userId_skillTaskId_key" ON "UserSkillScore"("userId", "skillTaskId");

-- CreateIndex
CREATE INDEX "UserSkillSubScore_userId_matchRate_idx" ON "UserSkillSubScore"("userId", "matchRate");

-- CreateIndex
CREATE UNIQUE INDEX "UserSkillSubScore_userId_skillSubTaskId_key" ON "UserSkillSubScore"("userId", "skillSubTaskId");

-- CreateIndex
CREATE INDEX "UserSkillTaskCard_userId_status_idx" ON "UserSkillTaskCard"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "UserSkillTaskCard_userId_cardType_skillTaskId_skillSubTaskI_key" ON "UserSkillTaskCard"("userId", "cardType", "skillTaskId", "skillSubTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "UserGrade_userId_key" ON "UserGrade"("userId");

-- CreateIndex
CREATE INDEX "PerformanceSkillFeedback_practicePerformanceId_idx" ON "PerformanceSkillFeedback"("practicePerformanceId");

-- CreateIndex
CREATE INDEX "PerformanceSkillFeedback_userId_feedbackType_idx" ON "PerformanceSkillFeedback"("userId", "feedbackType");

-- CreateIndex
CREATE INDEX "PracticeItem_category_difficulty_idx" ON "PracticeItem"("category", "difficulty");

-- AddForeignKey
ALTER TABLE "UserSkillScore" ADD CONSTRAINT "UserSkillScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkillSubScore" ADD CONSTRAINT "UserSkillSubScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkillTaskCard" ADD CONSTRAINT "UserSkillTaskCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGrade" ADD CONSTRAINT "UserGrade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceSkillFeedback" ADD CONSTRAINT "PerformanceSkillFeedback_practicePerformanceId_fkey" FOREIGN KEY ("practicePerformanceId") REFERENCES "PracticePerformance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceSkillFeedback" ADD CONSTRAINT "PerformanceSkillFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
