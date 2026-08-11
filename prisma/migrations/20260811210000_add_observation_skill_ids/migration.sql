-- 癖記録に「関係するわざ」明示欄を追加 (2026-08-11): 自動マッピング廃止・先生が選ぶ
ALTER TABLE "TeacherObservation" ADD COLUMN "skillIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
