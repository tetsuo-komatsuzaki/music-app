-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('processing', 'done', 'error');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('student', 'teacher');

-- CreateEnum
CREATE TYPE "PerformanceType" AS ENUM ('user', 'pro');

-- CreateEnum
CREATE TYPE "PerformanceStatus" AS ENUM ('uploaded', 'invalid', 'deleted');

-- CreateEnum
CREATE TYPE "PracticeCategory" AS ENUM ('scale', 'arpeggio', 'etude');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "supabaseUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "plan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Score" (
    "id" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "composer" TEXT,
    "arranger" TEXT,
    "originalXmlPath" TEXT NOT NULL,
    "generatedXmlPath" TEXT,
    "analysisStatus" "JobStatus" NOT NULL DEFAULT 'processing',
    "buildStatus" "JobStatus" NOT NULL DEFAULT 'processing',
    "keyTonic" TEXT,
    "keyMode" TEXT,
    "timeNumerator" INTEGER,
    "timeDenominator" INTEGER,
    "defaultTempo" INTEGER,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Score_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Performance" (
    "id" TEXT NOT NULL,
    "performanceType" "PerformanceType" NOT NULL,
    "performanceStatus" "PerformanceStatus" NOT NULL DEFAULT 'uploaded',
    "userId" TEXT NOT NULL,
    "scoreId" TEXT NOT NULL,
    "audioPath" TEXT NOT NULL,
    "audioFeaturesPath" TEXT,
    "comparisonResultPath" TEXT,
    "pseudoXmlPath" TEXT,
    "performanceDuration" DOUBLE PRECISION,
    "performanceDate" TIMESTAMP(3),
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pitchAccuracy" DOUBLE PRECISION,
    "timingAccuracy" DOUBLE PRECISION,
    "overallScore" DOUBLE PRECISION,
    "evaluatedNotes" INTEGER,
    "analysisSummary" JSONB,

    CONSTRAINT "Performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeItem" (
    "id" TEXT NOT NULL,
    "category" "PracticeCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "composer" TEXT,
    "description" TEXT,
    "descriptionShort" TEXT,
    "keyTonic" TEXT NOT NULL,
    "keyMode" TEXT NOT NULL,
    "tempoMin" INTEGER,
    "tempoMax" INTEGER,
    "positions" TEXT[],
    "instrument" TEXT NOT NULL DEFAULT 'violin',
    "originalXmlPath" TEXT NOT NULL,
    "generatedXmlPath" TEXT,
    "analysisPath" TEXT,
    "analysisStatus" "JobStatus" NOT NULL DEFAULT 'processing',
    "buildStatus" "JobStatus" NOT NULL DEFAULT 'processing',
    "ownerUserId" TEXT,
    "source" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PracticeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechniqueTag" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "description" TEXT,
    "xmlTags" TEXT[],
    "isAnalyzable" TEXT NOT NULL,
    "implementStatus" TEXT NOT NULL,

    CONSTRAINT "TechniqueTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeItemTechnique" (
    "practiceItemId" TEXT NOT NULL,
    "techniqueTagId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PracticeItemTechnique_pkey" PRIMARY KEY ("practiceItemId","techniqueTagId")
);

-- CreateTable
CREATE TABLE "PracticePerformance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "practiceItemId" TEXT NOT NULL,
    "audioPath" TEXT NOT NULL,
    "comparisonResultPath" TEXT,
    "performanceDuration" DOUBLE PRECISION,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pitchAccuracy" DOUBLE PRECISION,
    "timingAccuracy" DOUBLE PRECISION,
    "overallScore" DOUBLE PRECISION,
    "evaluatedNotes" INTEGER,
    "analysisSummary" JSONB,

    CONSTRAINT "PracticePerformance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserWeakness" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weaknessType" TEXT NOT NULL,
    "weaknessKey" TEXT NOT NULL,
    "techniqueTagId" TEXT,
    "severity" DOUBLE PRECISION NOT NULL,
    "sampleCount" INTEGER NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserWeakness_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_supabaseUserId_key" ON "User"("supabaseUserId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "Score_createdById_idx" ON "Score"("createdById");

-- CreateIndex
CREATE INDEX "Score_isShared_idx" ON "Score"("isShared");

-- CreateIndex
CREATE INDEX "Performance_scoreId_idx" ON "Performance"("scoreId");

-- CreateIndex
CREATE INDEX "Performance_userId_uploadedAt_idx" ON "Performance"("userId", "uploadedAt");

-- CreateIndex
CREATE INDEX "PracticeItem_category_keyTonic_keyMode_idx" ON "PracticeItem"("category", "keyTonic", "keyMode");

-- CreateIndex
CREATE INDEX "PracticeItem_category_isPublished_sortOrder_idx" ON "PracticeItem"("category", "isPublished", "sortOrder");

-- CreateIndex
CREATE INDEX "PracticeItem_ownerUserId_idx" ON "PracticeItem"("ownerUserId");

-- CreateIndex
CREATE INDEX "TechniqueTag_category_idx" ON "TechniqueTag"("category");

-- CreateIndex
CREATE UNIQUE INDEX "TechniqueTag_category_name_key" ON "TechniqueTag"("category", "name");

-- CreateIndex
CREATE INDEX "PracticePerformance_userId_practiceItemId_uploadedAt_idx" ON "PracticePerformance"("userId", "practiceItemId", "uploadedAt");

-- CreateIndex
CREATE INDEX "PracticePerformance_practiceItemId_idx" ON "PracticePerformance"("practiceItemId");

-- CreateIndex
CREATE INDEX "UserWeakness_userId_severity_idx" ON "UserWeakness"("userId", "severity");

-- CreateIndex
CREATE UNIQUE INDEX "UserWeakness_userId_weaknessType_weaknessKey_key" ON "UserWeakness"("userId", "weaknessType", "weaknessKey");

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Performance" ADD CONSTRAINT "Performance_scoreId_fkey" FOREIGN KEY ("scoreId") REFERENCES "Score"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Performance" ADD CONSTRAINT "Performance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeItem" ADD CONSTRAINT "PracticeItem_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeItemTechnique" ADD CONSTRAINT "PracticeItemTechnique_practiceItemId_fkey" FOREIGN KEY ("practiceItemId") REFERENCES "PracticeItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeItemTechnique" ADD CONSTRAINT "PracticeItemTechnique_techniqueTagId_fkey" FOREIGN KEY ("techniqueTagId") REFERENCES "TechniqueTag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticePerformance" ADD CONSTRAINT "PracticePerformance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticePerformance" ADD CONSTRAINT "PracticePerformance_practiceItemId_fkey" FOREIGN KEY ("practiceItemId") REFERENCES "PracticeItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWeakness" ADD CONSTRAINT "UserWeakness_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWeakness" ADD CONSTRAINT "UserWeakness_techniqueTagId_fkey" FOREIGN KEY ("techniqueTagId") REFERENCES "TechniqueTag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

