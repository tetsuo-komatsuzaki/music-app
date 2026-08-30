-- 達成コインの獲得モーション (2026-08-30 Tetsuo確定仕様)
-- coinCelebratedAt: ホームのコイン演出を消化した時刻。null = 未演出 (次のホーム表示で再生)
ALTER TABLE "UserScoreAchievement" ADD COLUMN "coinCelebratedAt" TIMESTAMP(3);

-- 既存の達成分は演出済み扱いで backfill (Q1: 過去分に遡って演出はしない。
-- 軌跡シートのコイン表示は従来どおり全達成分が並ぶ)
UPDATE "UserScoreAchievement" SET "coinCelebratedAt" = "achievedAt" WHERE "coinCelebratedAt" IS NULL;
