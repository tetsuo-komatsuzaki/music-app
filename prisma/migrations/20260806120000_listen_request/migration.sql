-- 聴いてもらうリクエスト (2026-08-06): 生徒→先生ワンタップ演奏依頼
CREATE TABLE "ListenRequest" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "performanceId" TEXT NOT NULL,
    "scoreId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    CONSTRAINT "ListenRequest_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ListenRequest_studentId_performanceId_key" ON "ListenRequest"("studentId", "performanceId");
CREATE INDEX "ListenRequest_teacherId_status_createdAt_idx" ON "ListenRequest"("teacherId", "status", "createdAt");
ALTER TABLE "ListenRequest" ADD CONSTRAINT "ListenRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ListenRequest" ADD CONSTRAINT "ListenRequest_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
