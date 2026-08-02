-- 2026-08-02: ユーザー履歴の保護 (Cascade→Restrict)
-- 教材カタログ再構築時の hard delete が PracticePerformance 等の全ユーザー履歴を
-- 無言で道連れにした事故の再発防止。録音/習得/達成/レッスン履歴がある教材は削除不可。

-- PracticePerformance
ALTER TABLE "PracticePerformance" DROP CONSTRAINT "PracticePerformance_practiceItemId_fkey";
ALTER TABLE "PracticePerformance" ADD CONSTRAINT "PracticePerformance_practiceItemId_fkey"
  FOREIGN KEY ("practiceItemId") REFERENCES "PracticeItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- UserPracticeMastery
ALTER TABLE "UserPracticeMastery" DROP CONSTRAINT "UserPracticeMastery_practiceItemId_fkey";
ALTER TABLE "UserPracticeMastery" ADD CONSTRAINT "UserPracticeMastery_practiceItemId_fkey"
  FOREIGN KEY ("practiceItemId") REFERENCES "PracticeItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- UserPracticeAchievement
ALTER TABLE "UserPracticeAchievement" DROP CONSTRAINT "UserPracticeAchievement_practiceItemId_fkey";
ALTER TABLE "UserPracticeAchievement" ADD CONSTRAINT "UserPracticeAchievement_practiceItemId_fkey"
  FOREIGN KEY ("practiceItemId") REFERENCES "PracticeItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- UserLessonPlay
ALTER TABLE "UserLessonPlay" DROP CONSTRAINT "UserLessonPlay_practiceItemId_fkey";
ALTER TABLE "UserLessonPlay" ADD CONSTRAINT "UserLessonPlay_practiceItemId_fkey"
  FOREIGN KEY ("practiceItemId") REFERENCES "PracticeItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
