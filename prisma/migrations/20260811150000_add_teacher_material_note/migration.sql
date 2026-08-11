-- 先生の練習ポイント (2026-08-11 先生カルテv3): おすすめ教材への一言。宿題ではない。
-- CreateTable
CREATE TABLE "TeacherMaterialNote" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "practiceItemId" TEXT NOT NULL,
    "point" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherMaterialNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeacherMaterialNote_teacherId_studentId_practiceItemId_key" ON "TeacherMaterialNote"("teacherId", "studentId", "practiceItemId");

-- CreateIndex
CREATE INDEX "TeacherMaterialNote_studentId_practiceItemId_idx" ON "TeacherMaterialNote"("studentId", "practiceItemId");

-- AddForeignKey
ALTER TABLE "TeacherMaterialNote" ADD CONSTRAINT "TeacherMaterialNote_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherMaterialNote" ADD CONSTRAINT "TeacherMaterialNote_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherMaterialNote" ADD CONSTRAINT "TeacherMaterialNote_practiceItemId_fkey" FOREIGN KEY ("practiceItemId") REFERENCES "PracticeItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
