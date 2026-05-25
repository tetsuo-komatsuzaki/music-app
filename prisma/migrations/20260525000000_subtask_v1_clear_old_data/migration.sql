-- 個別課題 v1 (2026-05-25): 旧 9 sub_task ID を完全廃止し新 59 項目に置換
-- する際の旧データクリア (Tetsuo 承認済 2026-05-25)。
--
-- クリア対象:
--   - UserSkillSubScore       : 旧 sub_task_id に紐付く累積スコア
--   - UserSkillTaskCard       : 旧 sub_task_id 経由のカード
--   - SubTaskAssignment       : SubTask 経由で旧 ID 参照 (CASCADE)
--   - SubTask                 : Phase 3b 生成、旧 subTaskType 文字列
--   - SkillTaskCard           : Phase 3b 生成
--   - MissingPracticeItemFlag : Phase 3b 生成、旧 subTaskType
--   - PracticeItem.skillSubTaskTags : 旧タグ → 空配列にリセット (admin 再付与)
--   - Score.skillSubTaskTags        : 同上
--
-- 残すデータ:
--   - PracticePerformance / Performance: 演奏履歴 (skillSubScores JSON は次回解析で上書き)
--   - UserPracticeMastery / SongMastery / UserGradeProgress: 旧 ID 参照なし
--   - PerformanceSkillFeedback: 過去ユーザーフィードバックの履歴値、selectedSubTaskId は
--     新規 POST 時に新 IDs validation されるため orphan 参照は残置で問題なし

BEGIN;

-- 1. 累積スキル指標を全消去 (旧 sub_task_id 参照)
DELETE FROM "UserSkillSubScore";
DELETE FROM "UserSkillTaskCard";

-- 2. Phase 3b 生成テーブルを CASCADE で削除
DELETE FROM "SubTaskAssignment";
DELETE FROM "SubTask";
DELETE FROM "SkillTaskCard";
DELETE FROM "MissingPracticeItemFlag";

-- 3. PracticeItem / Score の skillSubTaskTags を空配列にリセット
--    (admin 側で新 57 タグから再付与)
UPDATE "PracticeItem" SET "skillSubTaskTags" = '[]'::jsonb
  WHERE "skillSubTaskTags" IS NOT NULL;
UPDATE "Score" SET "skillSubTaskTags" = '[]'::jsonb
  WHERE "skillSubTaskTags" IS NOT NULL;

COMMIT;
