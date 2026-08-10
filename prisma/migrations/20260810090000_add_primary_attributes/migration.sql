-- 主属性 (毎日の基礎練の②③照合用・2026-08-10)
-- primaryBowing: 主弓奏法 (スラー除外→技術★最大→同★は最頻)
-- primaryPosition: 主ポジション (非1stの最頻・同数は高い方)
ALTER TABLE "Score" ADD COLUMN "primaryBowing" TEXT;
ALTER TABLE "Score" ADD COLUMN "primaryPosition" INTEGER;
ALTER TABLE "PracticeItem" ADD COLUMN "primaryBowing" TEXT;
ALTER TABLE "PracticeItem" ADD COLUMN "primaryPosition" INTEGER;
