-- 技法タグマスター 74→12 件絞り込み (Tetsuo 確定 2026-05-25)
--
-- 確定事項:
--   ① 62 件は完全削除 (個別課題 v1 と同型のマスター刷新)
--   ② 残す 12 件のカテゴリを「演奏技法」単一に統合
--   ③ PracticeItemTechnique / ScoreTechniqueTag / UserTechniqueMastery の
--     既存リレーション 319 行 (削除対象 62 件参照分) は CASCADE 削除受容
--
-- 残す 12 件:
--   ポルタート / スタッカート / ボウ・スタッカート / スピッカート / リコシェ /
--   ピチカート / トレモロ / ビブラート / トリル / モルデント / グリッサンド /
--   ナチュラル・ハーモニクス
--
-- 影響 (実行前計測):
--   PracticeItemTechnique 316 / 331 行 削除
--   ScoreTechniqueTag      2 /   3 行 削除
--   UserTechniqueMastery   1 /   1 行 削除
--
-- 注: techniqueTagId FK は onDelete 未指定 (RESTRICT) のため、TechniqueTag
--    DELETE 前に手動で参照行を削除する必要がある。本 migration はこれを
--    トランザクション内で順序実行する。

BEGIN;

-- 1. 残さない TechniqueTag を参照する関連行を先に削除
DELETE FROM "PracticeItemTechnique"
  WHERE "techniqueTagId" IN (
    SELECT id FROM "TechniqueTag"
    WHERE name NOT IN (
      'ポルタート', 'スタッカート', 'ボウ・スタッカート', 'スピッカート',
      'リコシェ', 'ピチカート', 'トレモロ', 'ビブラート', 'トリル',
      'モルデント', 'グリッサンド', 'ナチュラル・ハーモニクス'
    )
  );

DELETE FROM "ScoreTechniqueTag"
  WHERE "techniqueTagId" IN (
    SELECT id FROM "TechniqueTag"
    WHERE name NOT IN (
      'ポルタート', 'スタッカート', 'ボウ・スタッカート', 'スピッカート',
      'リコシェ', 'ピチカート', 'トレモロ', 'ビブラート', 'トリル',
      'モルデント', 'グリッサンド', 'ナチュラル・ハーモニクス'
    )
  );

DELETE FROM "UserTechniqueMastery"
  WHERE "techniqueTagId" IN (
    SELECT id FROM "TechniqueTag"
    WHERE name NOT IN (
      'ポルタート', 'スタッカート', 'ボウ・スタッカート', 'スピッカート',
      'リコシェ', 'ピチカート', 'トレモロ', 'ビブラート', 'トリル',
      'モルデント', 'グリッサンド', 'ナチュラル・ハーモニクス'
    )
  );

-- MissingPracticeItemFlag は前 migration で全クリア済 (techniqueTagId 参照行なし)
-- が念のためクリーンアップ
DELETE FROM "MissingPracticeItemFlag"
  WHERE "techniqueTagId" IS NOT NULL
    AND "techniqueTagId" IN (
      SELECT id FROM "TechniqueTag"
      WHERE name NOT IN (
        'ポルタート', 'スタッカート', 'ボウ・スタッカート', 'スピッカート',
        'リコシェ', 'ピチカート', 'トレモロ', 'ビブラート', 'トリル',
        'モルデント', 'グリッサンド', 'ナチュラル・ハーモニクス'
      )
    );

-- 2. 残す 12 件の category を「演奏技法」単一に統合 + implementStatus="実装" 統一
UPDATE "TechniqueTag"
  SET category = '演奏技法',
      "implementStatus" = '実装'
  WHERE name IN (
    'ポルタート', 'スタッカート', 'ボウ・スタッカート', 'スピッカート',
    'リコシェ', 'ピチカート', 'トレモロ', 'ビブラート', 'トリル',
    'モルデント', 'グリッサンド', 'ナチュラル・ハーモニクス'
  );

-- 3. 非保持 62 件を TechniqueTag テーブルから削除
DELETE FROM "TechniqueTag"
  WHERE name NOT IN (
    'ポルタート', 'スタッカート', 'ボウ・スタッカート', 'スピッカート',
    'リコシェ', 'ピチカート', 'トレモロ', 'ビブラート', 'トリル',
    'モルデント', 'グリッサンド', 'ナチュラル・ハーモニクス'
  );

COMMIT;
