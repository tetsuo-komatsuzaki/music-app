-- v1.6 G5: Score.arranger 列削除 (Tetsuo 指示)
-- 全 17 件 null・実参照コードなし (updateScore.ts はコメントのみ) → データ損失なし

ALTER TABLE "Score" DROP COLUMN IF EXISTS "arranger";
