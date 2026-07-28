-- CreateTable
CREATE TABLE "TeacherFeedback" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "scoreId" TEXT,
    "practiceItemId" TEXT,
    "data" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeacherFeedback_studentId_idx" ON "TeacherFeedback"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherFeedback_teacherId_studentId_scoreId_key" ON "TeacherFeedback"("teacherId", "studentId", "scoreId");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherFeedback_teacherId_studentId_practiceItemId_key" ON "TeacherFeedback"("teacherId", "studentId", "practiceItemId");

-- AddForeignKey
ALTER TABLE "TeacherFeedback" ADD CONSTRAINT "TeacherFeedback_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherFeedback" ADD CONSTRAINT "TeacherFeedback_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

