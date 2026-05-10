-- CreateEnum
CREATE TYPE "TaskCategory" AS ENUM ('PITCH', 'RHYTHM', 'BOWING');

-- CreateEnum
CREATE TYPE "AssignedCategory" AS ENUM ('SCALE', 'ARPEGGIO', 'ETUDE');

-- AlterTable
ALTER TABLE "Performance" ADD COLUMN     "bowingAccuracy" DOUBLE PRECISION,
ADD COLUMN     "bowingSkillScore" DOUBLE PRECISION,
ADD COLUMN     "pitchSkillScore" DOUBLE PRECISION,
ADD COLUMN     "problematicPositions" JSONB,
ADD COLUMN     "rhythmAccuracy" DOUBLE PRECISION,
ADD COLUMN     "rhythmSkillScore" DOUBLE PRECISION,
ADD COLUMN     "skillSubScores" JSONB;

-- AlterTable
ALTER TABLE "PerformanceSkillFeedback" ADD COLUMN     "performanceId" TEXT,
ALTER COLUMN "practicePerformanceId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PracticePerformance" ADD COLUMN     "bowingAccuracy" DOUBLE PRECISION,
ADD COLUMN     "rhythmAccuracy" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Score" ADD COLUMN     "ownerScope" TEXT NOT NULL DEFAULT 'admin';

-- CreateTable
CREATE TABLE "SongMastery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scoreId" TEXT NOT NULL,
    "recentAverageScore" DOUBLE PRECISION,
    "totalPerformanceCount" INTEGER NOT NULL DEFAULT 0,
    "isPerformanceMastered" BOOLEAN NOT NULL DEFAULT false,
    "isFullyMastered" BOOLEAN NOT NULL DEFAULT false,
    "performanceMasteredAt" TIMESTAMP(3),
    "fullyMasteredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SongMastery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGradeProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentStar" INTEGER NOT NULL DEFAULT 1,
    "currentGrade" "GradeLevel" NOT NULL DEFAULT 'BEGINNER',
    "masteredSongCountAtCurrentStar" INTEGER NOT NULL DEFAULT 0,
    "masterReachedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserGradeProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillTaskCard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scoreId" TEXT NOT NULL,
    "taskCategory" "TaskCategory" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMatchedAt" TIMESTAMP(3),
    "clearedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillTaskCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubTask" (
    "id" TEXT NOT NULL,
    "skillTaskCardId" TEXT NOT NULL,
    "subTaskType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clearedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubTaskAssignment" (
    "id" TEXT NOT NULL,
    "subTaskId" TEXT NOT NULL,
    "practiceItemId" TEXT NOT NULL,
    "assignedCategory" "AssignedCategory" NOT NULL,
    "isMastered" BOOLEAN NOT NULL DEFAULT false,
    "masteredAt" TIMESTAMP(3),
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubTaskAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPracticeMastery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "practiceItemId" TEXT NOT NULL,
    "recentAverageScore" DOUBLE PRECISION,
    "totalPerformanceCount" INTEGER NOT NULL DEFAULT 0,
    "isPerformanceMastered" BOOLEAN NOT NULL DEFAULT false,
    "masteredAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPracticeMastery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTechniqueMastery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "techniqueTagId" TEXT NOT NULL,
    "isMastered" BOOLEAN NOT NULL DEFAULT false,
    "masteredAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTechniqueMastery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeItemSubTaskTag" (
    "practiceItemId" TEXT NOT NULL,
    "subTaskType" TEXT NOT NULL,

    CONSTRAINT "PracticeItemSubTaskTag_pkey" PRIMARY KEY ("practiceItemId","subTaskType")
);

-- CreateTable
CREATE TABLE "MissingPracticeItemFlag" (
    "id" TEXT NOT NULL,
    "scoreId" TEXT NOT NULL,
    "subTaskType" TEXT NOT NULL,
    "missingCategory" TEXT NOT NULL,
    "keyTonic" TEXT NOT NULL,
    "keyMode" TEXT NOT NULL,
    "star" INTEGER NOT NULL,
    "techniqueTagId" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "MissingPracticeItemFlag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SongMastery_userId_isFullyMastered_idx" ON "SongMastery"("userId", "isFullyMastered");

-- CreateIndex
CREATE INDEX "SongMastery_scoreId_idx" ON "SongMastery"("scoreId");

-- CreateIndex
CREATE UNIQUE INDEX "SongMastery_userId_scoreId_key" ON "SongMastery"("userId", "scoreId");

-- CreateIndex
CREATE UNIQUE INDEX "UserGradeProgress_userId_key" ON "UserGradeProgress"("userId");

-- CreateIndex
CREATE INDEX "UserGradeProgress_currentStar_idx" ON "UserGradeProgress"("currentStar");

-- CreateIndex
CREATE INDEX "SkillTaskCard_userId_status_idx" ON "SkillTaskCard"("userId", "status");

-- CreateIndex
CREATE INDEX "SkillTaskCard_scoreId_idx" ON "SkillTaskCard"("scoreId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillTaskCard_userId_scoreId_taskCategory_key" ON "SkillTaskCard"("userId", "scoreId", "taskCategory");

-- CreateIndex
CREATE INDEX "SubTask_subTaskType_idx" ON "SubTask"("subTaskType");

-- CreateIndex
CREATE UNIQUE INDEX "SubTask_skillTaskCardId_subTaskType_key" ON "SubTask"("skillTaskCardId", "subTaskType");

-- CreateIndex
CREATE INDEX "SubTaskAssignment_subTaskId_idx" ON "SubTaskAssignment"("subTaskId");

-- CreateIndex
CREATE INDEX "SubTaskAssignment_practiceItemId_idx" ON "SubTaskAssignment"("practiceItemId");

-- CreateIndex
CREATE UNIQUE INDEX "SubTaskAssignment_subTaskId_practiceItemId_key" ON "SubTaskAssignment"("subTaskId", "practiceItemId");

-- CreateIndex
CREATE INDEX "UserPracticeMastery_userId_isPerformanceMastered_idx" ON "UserPracticeMastery"("userId", "isPerformanceMastered");

-- CreateIndex
CREATE UNIQUE INDEX "UserPracticeMastery_userId_practiceItemId_key" ON "UserPracticeMastery"("userId", "practiceItemId");

-- CreateIndex
CREATE INDEX "UserTechniqueMastery_userId_isMastered_idx" ON "UserTechniqueMastery"("userId", "isMastered");

-- CreateIndex
CREATE UNIQUE INDEX "UserTechniqueMastery_userId_techniqueTagId_key" ON "UserTechniqueMastery"("userId", "techniqueTagId");

-- CreateIndex
CREATE INDEX "PracticeItemSubTaskTag_subTaskType_idx" ON "PracticeItemSubTaskTag"("subTaskType");

-- CreateIndex
CREATE INDEX "MissingPracticeItemFlag_scoreId_resolvedAt_idx" ON "MissingPracticeItemFlag"("scoreId", "resolvedAt");

-- CreateIndex
CREATE INDEX "MissingPracticeItemFlag_keyTonic_keyMode_star_idx" ON "MissingPracticeItemFlag"("keyTonic", "keyMode", "star");

-- CreateIndex
CREATE INDEX "MissingPracticeItemFlag_resolvedAt_idx" ON "MissingPracticeItemFlag"("resolvedAt");

-- CreateIndex
CREATE INDEX "PerformanceSkillFeedback_performanceId_idx" ON "PerformanceSkillFeedback"("performanceId");

-- CreateIndex
CREATE INDEX "Score_ownerScope_idx" ON "Score"("ownerScope");

-- AddForeignKey
ALTER TABLE "PerformanceSkillFeedback" ADD CONSTRAINT "PerformanceSkillFeedback_performanceId_fkey" FOREIGN KEY ("performanceId") REFERENCES "Performance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongMastery" ADD CONSTRAINT "SongMastery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongMastery" ADD CONSTRAINT "SongMastery_scoreId_fkey" FOREIGN KEY ("scoreId") REFERENCES "Score"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGradeProgress" ADD CONSTRAINT "UserGradeProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillTaskCard" ADD CONSTRAINT "SkillTaskCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillTaskCard" ADD CONSTRAINT "SkillTaskCard_scoreId_fkey" FOREIGN KEY ("scoreId") REFERENCES "Score"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubTask" ADD CONSTRAINT "SubTask_skillTaskCardId_fkey" FOREIGN KEY ("skillTaskCardId") REFERENCES "SkillTaskCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubTaskAssignment" ADD CONSTRAINT "SubTaskAssignment_subTaskId_fkey" FOREIGN KEY ("subTaskId") REFERENCES "SubTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubTaskAssignment" ADD CONSTRAINT "SubTaskAssignment_practiceItemId_fkey" FOREIGN KEY ("practiceItemId") REFERENCES "PracticeItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPracticeMastery" ADD CONSTRAINT "UserPracticeMastery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPracticeMastery" ADD CONSTRAINT "UserPracticeMastery_practiceItemId_fkey" FOREIGN KEY ("practiceItemId") REFERENCES "PracticeItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTechniqueMastery" ADD CONSTRAINT "UserTechniqueMastery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTechniqueMastery" ADD CONSTRAINT "UserTechniqueMastery_techniqueTagId_fkey" FOREIGN KEY ("techniqueTagId") REFERENCES "TechniqueTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeItemSubTaskTag" ADD CONSTRAINT "PracticeItemSubTaskTag_practiceItemId_fkey" FOREIGN KEY ("practiceItemId") REFERENCES "PracticeItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissingPracticeItemFlag" ADD CONSTRAINT "MissingPracticeItemFlag_scoreId_fkey" FOREIGN KEY ("scoreId") REFERENCES "Score"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissingPracticeItemFlag" ADD CONSTRAINT "MissingPracticeItemFlag_techniqueTagId_fkey" FOREIGN KEY ("techniqueTagId") REFERENCES "TechniqueTag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────
-- v1.3 Phase 1: PerformanceSkillFeedback polymorphic CHECK 制約
-- practicePerformanceId と performanceId のうち正確に 1 つだけが非 NULL
-- (Prisma が表現できないため raw SQL で追加)
-- ─────────────────────────────────────────────────────────
ALTER TABLE "PerformanceSkillFeedback"
  ADD CONSTRAINT "PerformanceSkillFeedback_target_exactly_one"
  CHECK (
    ("practicePerformanceId" IS NOT NULL AND "performanceId" IS NULL)
    OR
    ("practicePerformanceId" IS NULL AND "performanceId" IS NOT NULL)
  );
