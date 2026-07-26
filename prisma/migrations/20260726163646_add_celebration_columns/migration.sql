-- 祝い体験 v2.0 (2026-07-26): 後方互換な列追加のみ(加算・null許容)。既存データに無害。
-- UserScoreAchievement.masteredPerformanceId: マスター遷移演奏ID(ID照合による再解析耐性)
-- UserScoreAchievement.celebratedAt / UserPracticeMastery.celebratedAt: 祝い既読(端末横断の一回性)
ALTER TABLE "UserScoreAchievement" ADD COLUMN "masteredPerformanceId" TEXT;
ALTER TABLE "UserScoreAchievement" ADD COLUMN "celebratedAt" TIMESTAMP(3);
ALTER TABLE "UserPracticeMastery" ADD COLUMN "celebratedAt" TIMESTAMP(3);
