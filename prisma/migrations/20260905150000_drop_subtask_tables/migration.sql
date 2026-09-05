-- 段5 (2026-09-05 ノート属性ストア): 課題カタログの集計表を廃止。
-- UserSkillSubScore (ユーザー×課題の累計) と PracticeItemSubtaskCount (教材×課題の出現回数) は
-- 明細 (PerformanceNote / ScoreNote / NoteProfile) と写し MaterialBundleCount に置き換わった。
DROP TABLE IF EXISTS "PracticeItemSubtaskCount";
DROP TABLE IF EXISTS "UserSkillSubScore";
