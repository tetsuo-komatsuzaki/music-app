-- =============================================================================
-- I2 = P 路線 (v1.5、2026-05-11) バックフィル SQL
-- =============================================================================
-- 目的: 既存 Performance / PracticePerformance に対して以下を実行:
--   (a) rhythmAccuracy = timingAccuracy のコピー (NULL のところに backfill、P-ア)
--   (b) bowingAccuracy = bowingSkillScore のコピー (NULL のところに backfill、P-イ)
--   (c) overallScore = (pitchAccuracy + rhythmAccuracy + bowingAccuracy) / 3 で再計算 (P-ウ)
--
-- 前提条件:
--   1. Phase 1 migration (20260510125345_add_loop_engine_v1_3_phase1) が deploy 済み
--      = Score / PracticeItem の difficulty → star rename + 9 新規テーブル + Performance への
--        rhythmAccuracy / bowingAccuracy / pitchSkillScore など追加が反映済
--
-- 安全性:
--   - (a) WHERE rhythmAccuracy IS NULL: 既に値があるレコードは温存
--   - (b) WHERE bowingAccuracy IS NULL: 同上
--   - (c) WHERE 3 軸すべて NOT NULL: Strict 3-axis 計算のみ。legacy 2-axis 演奏は overallScore 温存
--   - 全文を BEGIN ... COMMIT で 1 transaction 化し、途中失敗で部分適用を防止
--
-- 実行方法:
--   psql -f scripts/i2p_backfill.sql "${DIRECT_URL}"
--   または Supabase SQL Editor に貼り付け実行
-- =============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- Performance (Score 演奏) のバックフィル
-- ─────────────────────────────────────────────────────────────────────────────

-- (a) rhythmAccuracy = timingAccuracy
UPDATE "Performance"
SET "rhythmAccuracy" = "timingAccuracy"
WHERE "rhythmAccuracy" IS NULL
  AND "timingAccuracy" IS NOT NULL;

-- (b) bowingAccuracy = bowingSkillScore
UPDATE "Performance"
SET "bowingAccuracy" = "bowingSkillScore"
WHERE "bowingAccuracy" IS NULL
  AND "bowingSkillScore" IS NOT NULL;

-- (c) overallScore = ROUND((pitch + rhythm + bowing) / 3, 1)
UPDATE "Performance"
SET "overallScore" = ROUND(
    (("pitchAccuracy" + "rhythmAccuracy" + "bowingAccuracy") / 3.0)::numeric, 1
)::float
WHERE "pitchAccuracy" IS NOT NULL
  AND "rhythmAccuracy" IS NOT NULL
  AND "bowingAccuracy" IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- PracticePerformance (練習教材演奏) のバックフィル
-- ─────────────────────────────────────────────────────────────────────────────

-- (a) rhythmAccuracy = timingAccuracy
UPDATE "PracticePerformance"
SET "rhythmAccuracy" = "timingAccuracy"
WHERE "rhythmAccuracy" IS NULL
  AND "timingAccuracy" IS NOT NULL;

-- (b) bowingAccuracy = bowingSkillScore
UPDATE "PracticePerformance"
SET "bowingAccuracy" = "bowingSkillScore"
WHERE "bowingAccuracy" IS NULL
  AND "bowingSkillScore" IS NOT NULL;

-- (c) overallScore = ROUND((pitch + rhythm + bowing) / 3, 1)
UPDATE "PracticePerformance"
SET "overallScore" = ROUND(
    (("pitchAccuracy" + "rhythmAccuracy" + "bowingAccuracy") / 3.0)::numeric, 1
)::float
WHERE "pitchAccuracy" IS NOT NULL
  AND "rhythmAccuracy" IS NOT NULL
  AND "bowingAccuracy" IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 検証クエリ (COMMIT 前に件数を確認)
-- ─────────────────────────────────────────────────────────────────────────────
-- 影響件数を確認するには COMMIT を実行せず、上記までで一旦 ROLLBACK して
-- 以下の SELECT を別 session で実行する。または COMMIT 後に件数確認。

-- SELECT
--   (SELECT COUNT(*) FROM "Performance" WHERE "rhythmAccuracy" IS NOT NULL) AS perf_rhythm_set,
--   (SELECT COUNT(*) FROM "Performance" WHERE "bowingAccuracy" IS NOT NULL) AS perf_bowing_set,
--   (SELECT COUNT(*) FROM "Performance" WHERE "overallScore" IS NOT NULL) AS perf_overall_set,
--   (SELECT COUNT(*) FROM "PracticePerformance" WHERE "rhythmAccuracy" IS NOT NULL) AS practice_rhythm_set,
--   (SELECT COUNT(*) FROM "PracticePerformance" WHERE "bowingAccuracy" IS NOT NULL) AS practice_bowing_set,
--   (SELECT COUNT(*) FROM "PracticePerformance" WHERE "overallScore" IS NOT NULL) AS practice_overall_set;

COMMIT;

-- =============================================================================
-- 注意事項
-- =============================================================================
-- 1. 本 SQL は idempotent (繰り返し実行しても結果同じ):
--    WHERE x IS NULL があるため、既に backfill 済のレコードは触らない。
--
-- 2. legacy (2-axis のみ) の overallScore は温存される:
--    - bowingSkillScore が NULL なら bowingAccuracy も NULL のまま
--    - 3-axis 揃わないので overallScore は更新されない
--    - 旧 overallScore (pitch×0.6 + timing×0.4) がそのまま残る
--    Tetsuo が legacy を 2-axis 平均 (pitch + rhythm) / 2 で塗り替えたい場合は別 SQL が必要。
--
-- 3. Phase 3 (loop_engine for Score 演奏) 完了後、Score 演奏で bowingAccuracy が
--    set されるようになる。本 backfill は Phase 3 deploy 後に再実行することで
--    Score 演奏の overallScore も埋まる (idempotent なので安全)。
