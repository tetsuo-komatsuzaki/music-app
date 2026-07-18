-- 区間録音（部分練習 Phase 2）: 選択区間だけを録音・部分採点した演奏の範囲。
-- null = 通常の全体演奏。非null = 区間演奏（曲の公式スコア/マスター判定には非算入）。
-- AlterTable
ALTER TABLE "Performance" ADD COLUMN "rangeFromNote" INTEGER;
ALTER TABLE "Performance" ADD COLUMN "rangeToNote" INTEGER;
