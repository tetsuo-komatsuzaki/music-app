-- 1拍目(楽譜の起点)が録音の何秒目か。リズム判定の基準 (2026-08-27)。
-- アプリ版のみ値が入る。Web版と旧録音は NULL のままで、解析は従来どおり音から起点を推定する。
ALTER TABLE "Performance" ADD COLUMN "guideOffsetSec" DOUBLE PRECISION;
ALTER TABLE "PracticePerformance" ADD COLUMN "guideOffsetSec" DOUBLE PRECISION;
