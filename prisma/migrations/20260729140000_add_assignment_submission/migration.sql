-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "submittedAt" TIMESTAMP(3),
ADD COLUMN     "submittedPerformanceId" TEXT,
ADD COLUMN     "submittedScore" DOUBLE PRECISION;

