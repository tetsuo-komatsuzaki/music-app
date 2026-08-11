-- 案A (2026-08-11): 癖・指板マーク・表現認定を「一緒に送られたカルテ」に紐づける
ALTER TABLE "TeacherObservation" ADD COLUMN "karteId" TEXT;
ALTER TABLE "TeacherMarkedCell" ADD COLUMN "karteId" TEXT;
ALTER TABLE "UserExpressionClear" ADD COLUMN "karteId" TEXT;
CREATE INDEX "TeacherObservation_karteId_idx" ON "TeacherObservation"("karteId");
CREATE INDEX "TeacherMarkedCell_karteId_idx" ON "TeacherMarkedCell"("karteId");
CREATE INDEX "UserExpressionClear_karteId_idx" ON "UserExpressionClear"("karteId");
