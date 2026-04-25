/*
  Warnings:

  - A unique constraint covering the columns `[idempotencyKey]` on the table `Performance` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[idempotencyKey]` on the table `PracticeItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[idempotencyKey]` on the table `PracticePerformance` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[idempotencyKey]` on the table `Score` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "JobStatus" ADD VALUE 'queued';
ALTER TYPE "JobStatus" ADD VALUE 'retrying';

-- AlterTable
ALTER TABLE "Performance" ADD COLUMN     "analysisStatus" "JobStatus" NOT NULL DEFAULT 'done',
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "executionId" TEXT,
ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "lastAttemptedAt" TIMESTAMP(3),
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "PracticeItem" ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "executionId" TEXT,
ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "lastAttemptedAt" TIMESTAMP(3),
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "PracticePerformance" ADD COLUMN     "analysisStatus" "JobStatus" NOT NULL DEFAULT 'done',
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "executionId" TEXT,
ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "lastAttemptedAt" TIMESTAMP(3),
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Score" ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "executionId" TEXT,
ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "lastAttemptedAt" TIMESTAMP(3),
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Performance_idempotencyKey_key" ON "Performance"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "PracticeItem_idempotencyKey_key" ON "PracticeItem"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "PracticePerformance_idempotencyKey_key" ON "PracticePerformance"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Score_idempotencyKey_key" ON "Score"("idempotencyKey");
