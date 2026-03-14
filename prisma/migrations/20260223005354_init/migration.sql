-- CreateEnum
CREATE TYPE "Role" AS ENUM ('student', 'teacher');

-- CreateEnum
CREATE TYPE "PerformanceType" AS ENUM ('user', 'pro');

-- CreateEnum
CREATE TYPE "PerformanceStatus" AS ENUM ('uploaded', 'invalid', 'deleted');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "supabaseUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
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
    "keyTonic" TEXT,
    "keyMode" TEXT,
    "timeNumerator" INTEGER,
    "timeDenominator" INTEGER,
    "defaultTempo" INTEGER,
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

    CONSTRAINT "Performance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_supabaseUserId_key" ON "User"("supabaseUserId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "Score_createdById_idx" ON "Score"("createdById");

-- CreateIndex
CREATE INDEX "Performance_scoreId_idx" ON "Performance"("scoreId");

-- CreateIndex
CREATE INDEX "Performance_userId_uploadedAt_idx" ON "Performance"("userId", "uploadedAt");

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Performance" ADD CONSTRAINT "Performance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Performance" ADD CONSTRAINT "Performance_scoreId_fkey" FOREIGN KEY ("scoreId") REFERENCES "Score"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
