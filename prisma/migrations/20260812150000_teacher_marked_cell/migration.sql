-- 指板の「気をつける音」マーク (2026-08-11 指板ヒートマップ案5)
CREATE TABLE "TeacherMarkedCell" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "cellId" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherMarkedCell_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TeacherMarkedCell_teacherId_studentId_cellId_key" ON "TeacherMarkedCell"("teacherId", "studentId", "cellId");
CREATE INDEX "TeacherMarkedCell_studentId_idx" ON "TeacherMarkedCell"("studentId");

ALTER TABLE "TeacherMarkedCell" ADD CONSTRAINT "TeacherMarkedCell_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeacherMarkedCell" ADD CONSTRAINT "TeacherMarkedCell_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
