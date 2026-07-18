-- 教材カバー画像パス (AI生成カバー・Supabase Storage public URL)。追加のみ・既存データ影響なし。
ALTER TABLE "Score" ADD COLUMN     "coverImagePath" TEXT;
ALTER TABLE "PracticeItem" ADD COLUMN     "coverImagePath" TEXT;
