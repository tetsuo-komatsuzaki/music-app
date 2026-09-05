-- ノート属性ストア: 曲と教材に「いまの並びの版」を持たせる。演奏側の版と比べて、並びが変わった演奏を集計から除く。
ALTER TABLE "Score" ADD COLUMN "scoreNoteVersion" TEXT;
ALTER TABLE "PracticeItem" ADD COLUMN "scoreNoteVersion" TEXT;
