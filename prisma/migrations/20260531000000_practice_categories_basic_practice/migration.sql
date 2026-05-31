-- 2026-05-31 練習メニュー再編: 基礎練の新カテゴリを enum に追加
--
-- 確定事項:
--   ① PracticeCategory に fingering / bowing / position_shift / double_stop を追加
--   ② AssignedCategory に FINGERING / BOWING / POSITION_SHIFT / DOUBLE_STOP を追加
--   ③ 既存値 (scale/arpeggio/etude, SCALE/ARPEGGIO/ETUDE) は維持 = 非破壊
--
-- 注: ALTER TYPE ... ADD VALUE は Postgres 12+ ではトランザクション内で実行可
--     (同一トランザクション内で新値を使用しないため安全)。IF NOT EXISTS で冪等化。

ALTER TYPE "PracticeCategory" ADD VALUE IF NOT EXISTS 'fingering';
ALTER TYPE "PracticeCategory" ADD VALUE IF NOT EXISTS 'bowing';
ALTER TYPE "PracticeCategory" ADD VALUE IF NOT EXISTS 'position_shift';
ALTER TYPE "PracticeCategory" ADD VALUE IF NOT EXISTS 'double_stop';

ALTER TYPE "AssignedCategory" ADD VALUE IF NOT EXISTS 'FINGERING';
ALTER TYPE "AssignedCategory" ADD VALUE IF NOT EXISTS 'BOWING';
ALTER TYPE "AssignedCategory" ADD VALUE IF NOT EXISTS 'POSITION_SHIFT';
ALTER TYPE "AssignedCategory" ADD VALUE IF NOT EXISTS 'DOUBLE_STOP';
