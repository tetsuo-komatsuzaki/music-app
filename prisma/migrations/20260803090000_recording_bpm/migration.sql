-- カルテv2 Phase0-1 (2026-08-03): 録音時のテンポガイドbpmを保存 (テンポ帯分析用)
ALTER TABLE "Performance" ADD COLUMN "recordingBpm" DOUBLE PRECISION;
ALTER TABLE "PracticePerformance" ADD COLUMN "recordingBpm" DOUBLE PRECISION;
