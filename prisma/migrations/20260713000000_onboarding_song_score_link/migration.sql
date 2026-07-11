-- OnboardingSong(目標曲カタログ) と Score(楽譜) の結線 (2026-07-12)
-- 目標曲カード「楽譜へ」導線用。追加のみ・既存データ影響なし。

-- AlterTable
ALTER TABLE "OnboardingSong" ADD COLUMN "scoreId" TEXT;

-- CreateIndex
CREATE INDEX "OnboardingSong_scoreId_idx" ON "OnboardingSong"("scoreId");

-- AddForeignKey
ALTER TABLE "OnboardingSong" ADD CONSTRAINT "OnboardingSong_scoreId_fkey"
  FOREIGN KEY ("scoreId") REFERENCES "Score"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
