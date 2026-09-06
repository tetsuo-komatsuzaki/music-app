-- スラーの中の位置 (2026-09-06): 何音一緒のスラーかでおすすめ教材を変えるため、音ごとに スラーの長さ と 何番目か を持つ
ALTER TABLE "ScoreNote" ADD COLUMN "slurLen" INTEGER;
ALTER TABLE "ScoreNote" ADD COLUMN "slurPos" INTEGER;
