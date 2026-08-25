-- 族の軸定義 (2026-08-25): 練習前シートのプルダウンを組み立てるための定義。
-- [{ key, label, kind:"select"|"toggle", values:[string] }] 最大2軸。null=軸なし。
ALTER TABLE "MaterialGroup" ADD COLUMN "axes" JSONB;
