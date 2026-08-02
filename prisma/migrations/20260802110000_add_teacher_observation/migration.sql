-- CreateTable
CREATE TABLE "TeacherObservation" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "tagIds" TEXT[],
    "severity" TEXT,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherObservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeacherObservation_studentId_createdAt_idx" ON "TeacherObservation"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "TeacherObservation_teacherId_studentId_createdAt_idx" ON "TeacherObservation"("teacherId", "studentId", "createdAt");

-- AddForeignKey
ALTER TABLE "TeacherObservation" ADD CONSTRAINT "TeacherObservation_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherObservation" ADD CONSTRAINT "TeacherObservation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
