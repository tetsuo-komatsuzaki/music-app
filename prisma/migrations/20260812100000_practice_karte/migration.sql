-- 練習後カルテ: 曲/教材にぶら下がる独立エンティティ (2026-08-11 Tetsuo確定)
CREATE TABLE "PracticeKarte" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "scoreId" TEXT,
    "practiceItemId" TEXT,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeKarte_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PracticeKarte_studentId_scoreId_createdAt_idx" ON "PracticeKarte"("studentId", "scoreId", "createdAt");
CREATE INDEX "PracticeKarte_studentId_practiceItemId_createdAt_idx" ON "PracticeKarte"("studentId", "practiceItemId", "createdAt");
CREATE INDEX "PracticeKarte_teacherId_studentId_createdAt_idx" ON "PracticeKarte"("teacherId", "studentId", "createdAt");

ALTER TABLE "PracticeKarte" ADD CONSTRAINT "PracticeKarte_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PracticeKarte" ADD CONSTRAINT "PracticeKarte_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PracticeKarte" ADD CONSTRAINT "PracticeKarte_scoreId_fkey" FOREIGN KEY ("scoreId") REFERENCES "Score"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PracticeKarte" ADD CONSTRAINT "PracticeKarte_practiceItemId_fkey" FOREIGN KEY ("practiceItemId") REFERENCES "PracticeItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
