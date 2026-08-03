-- 表現特徴 (2026-08-04): 曲の記号特徴の集約キャッシュ (合う曲推薦用)
ALTER TABLE "Score" ADD COLUMN "exprFeatures" JSONB;
