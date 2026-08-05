-- 雰囲気タグ (2026-08-05): 統一語彙 (曲=手動/演奏=将来AI)。admin がアップロード画面で設定
ALTER TABLE "Score" ADD COLUMN "moodTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
